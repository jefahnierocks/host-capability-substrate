#!/usr/bin/env node

import assert from 'node:assert/strict';
import { lstat, open, readdir, readFile, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '../..');
const ADR_DIRECTORY = 'docs/host-capability-substrate/adr';
const OUTPUT_PATH = 'docs/host-capability-substrate/adr-deferral-index.md';
const REGENERATE_COMMAND = 'node scripts/ci/adr-deferral-index.js --write';

const DIRECT_INTRODUCERS = [
  'lands together with',
  'land together with',
  'lands together as',
  'land together as',
  'continues under',
  'remains under',
  'subsumed into',
  'reserved for',
  'deferred to',
  'belongs to',
  'queued as',
  'defers to',
  'belong to',
  'lands with',
  'land with',
  'follows as',
  'follow as',
  'lands in',
  'land in',
];

const DETERMINERS = new Set(['a', 'an', 'the', 'its', 'their', 'this', 'that']);
const DESCRIPTOR_MARKERS = new Set([
  'future',
  'follow-up',
  'follow-on',
  'separate',
  'own',
  'later',
  'coordinated',
]);
const DESCRIPTOR_HEADS = [
  'implementation lane',
  'implementation PR',
  'ontology review',
  'sub-decision',
  'ADR cycle',
  'policy slice',
  'change-sets',
  'change-set',
  'Q-rows',
  'Q-row',
  'service',
  'lane',
  'ADRs',
  'ADR',
  'PRs',
  'PR',
  'task',
];
const PROHIBITED_WORDS = new Set([
  'that',
  'per',
  'if',
  'when',
  'after',
  'before',
  'once',
  'and',
  'or',
]);

const COMPOSITE_PATTERNS = [
  /\bthe[ \t]+gateway[ \t]+ADR[ \t]+that[ \t]+ADR[ \t]+\d{4}[ \t]+defers[ \t]+to\b/gi,
  /\bADR[ \t]+\d{4}'s[ \t]+schema[ \t]+PR\b/gi,
  /\bADR[ \t]+\d{4}[ \t]+follow-up\b/gi,
  /\bthe[ \t]+wave-\d+[ \t]+ADR\b/gi,
  /\baudit-events\/storage[ \t]+ADR\b/gi,
];

const FIXED_LANE_PATTERNS = [
  /\btiers\.yaml[ \t]+once[ \t]+HCS[ \t]+Milestone[ \t]+\d+[ \t]+ships\b/gi,
  /\bCanonical[ \t]+policy[ \t]+at[ \t]+Milestone[ \t]+\d+\b/gi,
  /\bRegistry[ \t]+update[ \t]+PR\b/gi,
  /\bSchema[ \t]+implementation\b/gi,
  /\bthe[ \t]+schema[ \t]+PR\b/gi,
  /\bSchema[ \t]+PRs\b/gi,
  /\bSchema[ \t]+PR\b/gi,
  /\bHCS[ \t]+Milestone[ \t]+\d+\b/gi,
  /\bRing[ \t]+[0-3][ \t]+implementation\b/gi,
];

const RELATION_ONLY_FIXED_LANE_PATTERNS = [/\bPhase[ \t]+\d+\b/gi];
const FIXED_LANE_SUFFIX_PATTERN = /^(?:PRs?|ADRs?)\b/i;

const DEFERRAL_CUE_PATTERNS = [
  /\bcontinues[ ]+under\b/gi,
  /\bremains[ ]+under\b/gi,
  /\bbelongs[ ]+to\b/gi,
  /\bbelong[ ]+to\b/gi,
  /\bQ-row\b/gi,
  /\b(?:defer|deferred|defers|future|follow-up|follow-on|separate|own|queued|reserved|land|lands|follow|follows|owns|milestone|phase)\b/gi,
];

const ROOT_FILES = new Set([
  'AGENTS.md',
  'CLAUDE.md',
  'DECISIONS.md',
  'IMPLEMENT.md',
  'PLAN.md',
  'README.md',
  'justfile',
  'package.json',
  'tsconfig.json',
  'biome.json',
  '.mise.toml',
]);
const ADMITTED_ROOTS = new Set([
  '.agents',
  '.claude',
  '.codex',
  '.github',
  'docs',
  'packages',
  'policies',
  'scripts',
]);

function asciiLower(value) {
  return value.replace(/[A-Z]/g, (character) => character.toLowerCase());
}

function containsExactGatewayToken(value) {
  return /(^|[^a-z0-9_])gateway(?=$|[^a-z0-9_])/.test(asciiLower(value));
}

function compareCodeUnits(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseMode(argv) {
  if (argv.length !== 1 || (argv[0] !== '--write' && argv[0] !== '--check')) {
    throw new Error(`usage: node scripts/ci/adr-deferral-index.js (--write | --check)`);
  }
  return argv[0];
}

function fenceMap(lines) {
  const fenced = Array.from({ length: lines.length }, () => false);
  let active = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (active !== null) {
      fenced[index] = true;
      const closing = new RegExp(
        `^ {0,3}${escapeRegExp(active.character)}{${active.length},}[ \\t]*$`,
      );
      if (closing.test(line)) {
        active = null;
      }
      continue;
    }

    const opener = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (opener === null) {
      continue;
    }
    if (opener[1][0] === '`' && opener[2].includes('`')) {
      continue;
    }
    active = { character: opener[1][0], length: opener[1].length };
    fenced[index] = true;
  }

  return fenced;
}

function headingAt(lines, fenced, index) {
  if (fenced[index]) {
    return null;
  }
  const match = lines[index].match(/^(#{1,6})[ \t]+(.*)$/);
  if (match === null) {
    return null;
  }
  return {
    level: match[1].length,
    text: match[2].replace(/[ \t]+$/, ''),
  };
}

function blockEnd(lines, fenced, startIndex, level) {
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const heading = headingAt(lines, fenced, index);
    if (heading !== null && heading.level <= level) {
      return index;
    }
  }
  return lines.length;
}

function isTopLevelListItem(line) {
  return /^(?:[-+*]|\d+[.)])[ \t]+/.test(line);
}

function sourcePayload(lines, startIndex, endIndex) {
  return lines.slice(startIndex, endIndex + 1).join('\n');
}

function regularEntries(lines, fenced, startIndex, endIndex) {
  const topLevelItems = [];
  for (let index = startIndex; index < endIndex; index += 1) {
    if (!fenced[index] && isTopLevelListItem(lines[index])) {
      topLevelItems.push(index);
    }
  }

  if (topLevelItems.length > 0) {
    return topLevelItems.map((itemStart, itemIndex) => {
      const itemEnd =
        itemIndex + 1 < topLevelItems.length ? topLevelItems[itemIndex + 1] - 1 : endIndex - 1;
      return {
        startIndex: itemStart,
        endIndex: itemEnd,
        paragraphForm: false,
        payload: sourcePayload(lines, itemStart, itemEnd),
      };
    });
  }

  const paragraphs = [];
  let index = startIndex;
  while (index < endIndex) {
    while (index < endIndex && lines[index].trim() === '') {
      index += 1;
    }
    if (index >= endIndex) {
      break;
    }
    const paragraphStart = index;
    while (index < endIndex && lines[index].trim() !== '') {
      index += 1;
    }
    paragraphs.push({
      startIndex: paragraphStart,
      endIndex: index - 1,
      paragraphForm: true,
      payload: sourcePayload(lines, paragraphStart, index - 1),
    });
  }
  return paragraphs;
}

function isIrregularHeading(heading) {
  const text = heading.text;
  const exactRegular = (heading.level === 2 || heading.level === 3) && text === 'Out of scope';
  if (exactRegular) {
    return false;
  }
  return (
    text.startsWith('Out of scope') ||
    text.startsWith('Out-of-scope') ||
    text.startsWith('Deferred follow-on') ||
    text.startsWith('Cross-scope follow-up') ||
    text.startsWith('Non-charter changes deferred') ||
    text.startsWith('Cross-record commitments deferred')
  );
}

function legacyBoldKind(line) {
  const trimmed = line.trimStart();
  if (!trimmed.startsWith('**')) {
    return null;
  }
  const afterOpen = trimmed.slice(2);
  if (!afterOpen.startsWith('Out of scope') && !afterOpen.startsWith('Out-of-scope')) {
    return null;
  }
  const closingOffset = afterOpen.indexOf('**');
  if (closingOffset === -1) {
    return { kind: 'malformed legacy bold lead-in', listIntroducer: false };
  }
  const emphasized = afterOpen.slice(0, closingOffset);
  const remainder = afterOpen.slice(closingOffset + 2).trim();
  const remainderIsOptionalColon = remainder === '' || remainder === ':';
  const hasColon = emphasized.trimEnd().endsWith(':') || remainder === ':';
  return {
    kind: 'legacy bold lead-in',
    listIntroducer: remainderIsOptionalColon && hasColon,
  };
}

function paragraphEnd(lines, fenced, startIndex) {
  let index = startIndex + 1;
  while (index < lines.length) {
    if (lines[index].trim() === '' || headingAt(lines, fenced, index) !== null) {
      return index;
    }
    index += 1;
  }
  return lines.length;
}

function legacyListEnd(lines, fenced, startIndex) {
  let index = startIndex + 1;
  let listStarted = false;
  while (index < lines.length) {
    if (headingAt(lines, fenced, index) !== null) {
      return index;
    }
    const line = lines[index];
    if (!listStarted) {
      if (line.trim() === '') {
        index += 1;
        continue;
      }
      if (!isTopLevelListItem(line)) {
        return index;
      }
      listStarted = true;
      index += 1;
      continue;
    }
    if (line.trim() === '' || isTopLevelListItem(line) || /^[ \t]+\S/.test(line)) {
      index += 1;
      continue;
    }
    return index;
  }
  return lines.length;
}

function parseDocument(document) {
  const lines = document.text.split('\n');
  if (lines.at(-1) === '') {
    lines.pop();
  }
  const fenced = fenceMap(lines);
  const regularBlocks = [];
  const irregular = [];

  for (let index = 0; index < lines.length; index += 1) {
    const heading = headingAt(lines, fenced, index);
    if (heading !== null) {
      const exactRegular =
        (heading.level === 2 || heading.level === 3) && heading.text === 'Out of scope';
      if (exactRegular) {
        const endIndex = blockEnd(lines, fenced, index, heading.level);
        regularBlocks.push({
          headingIndex: index,
          endIndex,
          entries: regularEntries(lines, fenced, index + 1, endIndex),
        });
      } else if (isIrregularHeading(heading)) {
        const endIndex = blockEnd(lines, fenced, index, heading.level);
        irregular.push({
          kind: 'irregular heading',
          startIndex: index,
          endIndex: endIndex - 1,
          payload: sourcePayload(lines, index, endIndex - 1),
        });
      }
      continue;
    }

    if (fenced[index]) {
      continue;
    }
    const legacy = legacyBoldKind(lines[index]);
    if (legacy === null) {
      continue;
    }
    const endIndex = legacy.listIntroducer
      ? legacyListEnd(lines, fenced, index)
      : paragraphEnd(lines, fenced, index);
    irregular.push({
      kind: legacy.kind,
      startIndex: index,
      endIndex: Math.max(index, endIndex - 1),
      payload: sourcePayload(lines, index, Math.max(index, endIndex - 1)),
    });
    index = Math.max(index, endIndex - 1);
  }

  if (regularBlocks.length > 1) {
    throw new Error(`${document.relativePath}: duplicate regular Out of scope blocks`);
  }

  return { regularBlocks, irregular };
}

function shadowView(source) {
  let shadow = '';
  const starts = [];
  const ends = [];
  let index = 0;
  while (index < source.length) {
    if (/\s/.test(source[index])) {
      const start = index;
      while (index < source.length && /\s/.test(source[index])) {
        index += 1;
      }
      shadow += ' ';
      starts.push(start);
      ends.push(index);
      continue;
    }
    shadow += source[index];
    starts.push(index);
    ends.push(index + 1);
    index += 1;
  }
  return {
    shadow,
    literal(start, end) {
      assert(end > start, 'cannot recover an empty source literal');
      return source.slice(starts[start], ends[end - 1]);
    },
  };
}

function wordBoundaryAt(value, index) {
  return index < 0 || index >= value.length || !/[A-Za-z0-9_]/.test(value[index]);
}

function exactPhraseAt(value, index, phrase) {
  const candidate = value.slice(index, index + phrase.length);
  if (asciiLower(candidate) !== asciiLower(phrase)) {
    return null;
  }
  if (!wordBoundaryAt(value, index - 1) || !wordBoundaryAt(value, index + phrase.length)) {
    return null;
  }
  return { start: index, end: index + phrase.length };
}

function skipSpaces(value, index) {
  let cursor = index;
  while (cursor < value.length && value[cursor] === ' ') {
    cursor += 1;
  }
  return cursor;
}

function codeSpanAt(value, index) {
  if (value[index] !== '`') {
    return null;
  }
  let runEnd = index;
  while (value[runEnd] === '`') {
    runEnd += 1;
  }
  const delimiter = value.slice(index, runEnd);
  let searchIndex = runEnd;
  while (searchIndex < value.length) {
    const found = value.indexOf(delimiter, searchIndex);
    if (found === -1) {
      return null;
    }
    if (value[found - 1] !== '`' && value[found + delimiter.length] !== '`') {
      return { start: index, end: found + delimiter.length };
    }
    searchIndex = found + delimiter.length;
  }
  return null;
}

function boundedTokenAt(value, index) {
  const code = codeSpanAt(value, index);
  if (code !== null) {
    return code;
  }
  const match = value.slice(index).match(/^[A-Za-z0-9][A-Za-z0-9_.-]*/);
  if (match === null) {
    return null;
  }
  return { start: index, end: index + match[0].length };
}

function explicitTargetAt(value, index, allowAnyCode = false) {
  const rest = value.slice(index);
  const patterns = [/^ADR[ ]+\d{4}\b/i, /^[QD]-\d{3}\b/i, /^class[ ]+[A-J]\b/i];
  for (const pattern of patterns) {
    const match = rest.match(pattern);
    if (match !== null) {
      return { start: index, end: index + match[0].length, type: 'explicit' };
    }
  }
  const code = codeSpanAt(value, index);
  if (code !== null) {
    const content = value.slice(
      code.start + value.slice(code.start).match(/^`+/)[0].length,
      code.end,
    );
    const delimiterLength = value.slice(code.start).match(/^`+/)[0].length;
    const rawContent = content.slice(0, -delimiterLength);
    if (allowAnyCode || looksPathShaped(rawContent)) {
      return { ...code, type: 'explicit-code' };
    }
  }
  return null;
}

function descriptorAt(value, index) {
  let cursor = index;
  const first = boundedTokenAt(value, cursor);
  if (first === null || first.start !== cursor) {
    return null;
  }
  let firstWord = asciiLower(value.slice(first.start, first.end));
  if (DETERMINERS.has(firstWord)) {
    cursor = skipSpaces(value, first.end);
    const marker = boundedTokenAt(value, cursor);
    if (marker === null) {
      return null;
    }
    firstWord = asciiLower(value.slice(marker.start, marker.end));
    if (!DESCRIPTOR_MARKERS.has(firstWord)) {
      return null;
    }
    cursor = marker.end;
  } else if (DESCRIPTOR_MARKERS.has(firstWord)) {
    cursor = first.end;
  } else {
    return null;
  }

  let best = null;
  for (let nameCount = 0; nameCount <= 6; nameCount += 1) {
    const headStart = skipSpaces(value, cursor);
    for (const head of DESCRIPTOR_HEADS) {
      const match = exactPhraseAt(value, headStart, head);
      if (match !== null) {
        if (best === null || match.end > best.end) {
          best = { start: index, end: match.end, type: 'descriptor' };
        }
      }
    }
    if (nameCount === 6) {
      break;
    }
    const tokenStart = skipSpaces(value, cursor);
    const token = boundedTokenAt(value, tokenStart);
    if (token === null) {
      break;
    }
    const tokenWord = asciiLower(value.slice(token.start, token.end));
    if (PROHIBITED_WORDS.has(tokenWord)) {
      break;
    }
    cursor = token.end;
  }
  return best;
}

function collectRegexMatches(value, patterns, priority, type) {
  const matches = [];
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    for (const match of value.matchAll(pattern)) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        priority,
        type,
      });
    }
  }
  return matches;
}

function collectFixedLaneMatches(value, includeRelationOnly) {
  const contextFree = collectRegexMatches(value, FIXED_LANE_PATTERNS, 4, 'fixed').map((match) => {
    const suffixStart = skipSpaces(value, match.end);
    const suffix = value.slice(suffixStart).match(FIXED_LANE_SUFFIX_PATTERN);
    if (suffix !== null) {
      return { ...match, end: suffixStart + suffix[0].length };
    }
    return match;
  });
  if (!includeRelationOnly) {
    return contextFree;
  }
  return [
    ...contextFree,
    ...collectRegexMatches(value, RELATION_ONLY_FIXED_LANE_PATTERNS, 4, 'fixed'),
  ];
}

function collectDescriptors(value) {
  const matches = [];
  for (let index = 0; index < value.length; index += 1) {
    if (!wordBoundaryAt(value, index - 1)) {
      continue;
    }
    const descriptor = descriptorAt(value, index);
    if (descriptor !== null) {
      matches.push({ ...descriptor, priority: 3 });
    }
  }
  return matches;
}

function overlaps(left, right) {
  return left.start < right.end && right.start < left.end;
}

function contains(container, inner) {
  return container.start <= inner.start && container.end >= inner.end;
}

function codeSpanContent(literal) {
  const opening = literal.match(/^`+/);
  if (opening === null) {
    return null;
  }
  const delimiter = opening[0];
  if (!literal.endsWith(delimiter) || literal.length <= delimiter.length * 2) {
    return null;
  }
  return literal.slice(delimiter.length, -delimiter.length);
}

function pathClassification(literal) {
  const content = codeSpanContent(literal);
  if (content === null) {
    return { pathLike: false, valid: false, path: null };
  }
  const withoutLocator = content.replace(/:\d+(?:-\d+)?$/, '');
  const pathLike =
    withoutLocator.includes('/') ||
    withoutLocator.includes('\\') ||
    withoutLocator.startsWith('.') ||
    withoutLocator.startsWith('~') ||
    withoutLocator.startsWith('/') ||
    /^[A-Za-z][A-Za-z0-9+.-]*:/.test(withoutLocator) ||
    ROOT_FILES.has(withoutLocator);
  if (!pathLike) {
    return { pathLike: false, valid: false, path: null };
  }
  if (
    withoutLocator === '' ||
    withoutLocator.startsWith('/') ||
    withoutLocator.startsWith('~') ||
    /^[A-Za-z][A-Za-z0-9+.-]*:/.test(withoutLocator) ||
    withoutLocator.includes('\\') ||
    withoutLocator.includes('\0')
  ) {
    return { pathLike: true, valid: false, path: null };
  }
  if (ROOT_FILES.has(withoutLocator)) {
    return { pathLike: true, valid: true, path: withoutLocator };
  }
  const components = withoutLocator.split('/');
  if (
    components.length < 2 ||
    !ADMITTED_ROOTS.has(components[0]) ||
    components.some(
      (component) =>
        component === '' ||
        component === '.' ||
        component === '..' ||
        !/^[A-Za-z0-9._@-]+$/.test(component),
    )
  ) {
    return { pathLike: true, valid: false, path: null };
  }
  return { pathLike: true, valid: true, path: withoutLocator };
}

function looksPathShaped(content) {
  return pathClassification(`\`${content}\``).pathLike;
}

function scanExplicitTargets(value) {
  const candidates = [];
  const patterns = [/\bADR[ ]+\d{4}\b/gi, /\b[QD]-\d{3}\b/gi, /\bclass[ ]+[A-J]\b/gi];
  for (const pattern of patterns) {
    for (const match of value.matchAll(pattern)) {
      candidates.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'explicit',
      });
    }
  }
  for (let index = 0; index < value.length; index += 1) {
    const code = codeSpanAt(value, index);
    if (code === null) {
      continue;
    }
    const literal = value.slice(code.start, code.end);
    if (pathClassification(literal).pathLike) {
      candidates.push({ start: code.start, end: code.end, type: 'explicit-code' });
    }
    index = code.end - 1;
  }
  return candidates.sort((left, right) => left.start - right.start || right.end - left.end);
}

function targetAt(value, index, allowAnyCode = false) {
  const candidates = [];
  for (const pattern of COMPOSITE_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(value.slice(index));
    if (match !== null && match.index === 0) {
      candidates.push({
        start: index,
        end: index + match[0].length,
        priority: 1,
        type: 'composite',
      });
    }
  }
  const explicit = explicitTargetAt(value, index, allowAnyCode);
  if (explicit !== null) {
    candidates.push({ ...explicit, priority: 2 });
  }
  const descriptor = descriptorAt(value, index);
  if (descriptor !== null) {
    candidates.push({ ...descriptor, priority: 3 });
  }
  for (const match of collectFixedLaneMatches(value, true)) {
    if (match.start === index) {
      candidates.push(match);
    }
  }
  candidates.sort(
    (left, right) =>
      left.priority - right.priority || right.end - right.start - (left.end - left.start),
  );
  return candidates[0] ?? null;
}

function nextSuccessorBoundary(value, start) {
  let index = start;
  while (index < value.length) {
    const code = codeSpanAt(value, index);
    if (code !== null) {
      index = code.end;
      continue;
    }
    if ('.;:()'.includes(value[index])) {
      return { end: index, alternative: false };
    }
    if (/[A-Za-z]/.test(value[index]) && wordBoundaryAt(value, index - 1)) {
      const wordMatch = value.slice(index).match(/^[A-Za-z]+(?:-[A-Za-z]+)*/);
      if (wordMatch !== null) {
        const word = asciiLower(wordMatch[0]);
        const targetInitialDeterminer =
          index === start && word === 'that' && descriptorAt(value, start) !== null;
        if (PROHIBITED_WORDS.has(word) && !targetInitialDeterminer) {
          return { end: index, alternative: word === 'and' || word === 'or' };
        }
        index += wordMatch[0].length;
        continue;
      }
    }
    index += 1;
  }
  return { end: value.length, alternative: false };
}

function splitOnPlus(value, start, end) {
  const spans = [];
  let segmentStart = start;
  let index = start;
  while (index < end) {
    const code = codeSpanAt(value, index);
    if (code !== null && code.end <= end) {
      index = code.end;
      continue;
    }
    if (value[index] === '+') {
      spans.push({ start: segmentStart, end: index });
      segmentStart = index + 1;
    }
    index += 1;
  }
  spans.push({ start: segmentStart, end });
  return spans;
}

function trimSpan(value, span) {
  let start = span.start;
  let end = span.end;
  while (start < end && value[start] === ' ') {
    start += 1;
  }
  while (end > start && value[end - 1] === ' ') {
    end -= 1;
  }
  return { start, end };
}

function collectDirectRelations(value, compositeCaptures) {
  const captures = [];
  const relationSpans = [];
  const reasons = new Set();
  const lower = asciiLower(value);
  const introducers = [...DIRECT_INTRODUCERS].sort((left, right) => right.length - left.length);

  for (let index = 0; index < value.length; index += 1) {
    for (const introducer of introducers) {
      const match = exactPhraseAt(lower, index, asciiLower(introducer));
      if (match === null || compositeCaptures.some((capture) => contains(capture, match))) {
        continue;
      }
      const successorStart = skipSpaces(value, match.end);
      const boundary = nextSuccessorBoundary(value, successorStart);
      const relationSpan = { start: match.start, end: boundary.end };
      relationSpans.push(relationSpan);
      if (boundary.alternative) {
        reasons.add('relation-crosses-and-or');
        index = match.end - 1;
        break;
      }
      const segments = splitOnPlus(value, successorStart, boundary.end);
      let relationValid = segments.length > 0;
      for (const rawSegment of segments) {
        const segment = trimSpan(value, rawSegment);
        const target = targetAt(value, segment.start, true);
        if (target === null || target.end !== segment.end) {
          relationValid = false;
          continue;
        }
        if (
          target.type === 'explicit-code' &&
          !pathClassification(value.slice(target.start, target.end)).valid
        ) {
          relationValid = false;
          continue;
        }
        captures.push({ ...target, priority: 2, relationSpan });
      }
      if (!relationValid) {
        reasons.add('unbound-deferral-cue');
      }
      index = match.end - 1;
      break;
    }
  }
  return { captures, relationSpans, reasons };
}

function collectOwnerRelations(value, compositeCaptures) {
  const captures = [];
  const reasons = new Set();
  const ownerPattern = /\bowns\b/gi;
  for (const owner of value.matchAll(ownerPattern)) {
    const ownerSpan = { start: owner.index, end: owner.index + owner[0].length };
    if (compositeCaptures.some((capture) => contains(capture, ownerSpan))) {
      continue;
    }
    let targetEnd = owner.index;
    while (targetEnd > 0 && value[targetEnd - 1] === ' ') {
      targetEnd -= 1;
    }
    const possibilities = [
      ...compositeCaptures,
      ...scanExplicitTargets(value).map((capture) => ({
        ...capture,
        priority: 2,
      })),
      ...collectDescriptors(value),
      ...collectFixedLaneMatches(value, true),
    ].filter((capture) => capture.end === targetEnd);
    possibilities.sort(
      (left, right) =>
        left.priority - right.priority ||
        left.start - right.start ||
        right.end - right.start - (left.end - left.start),
    );
    const target = possibilities[0];
    if (target === undefined) {
      reasons.add('unbound-deferral-cue');
      continue;
    }
    captures.push({
      ...target,
      priority: 2,
      relationSpan: { start: target.start, end: ownerSpan.end },
    });
  }
  return { captures, reasons };
}

function entryHeadRelation(value) {
  const marker = value.match(/^(?:[-+*]|\d+[.)])[ ]+/);
  if (marker === null) {
    return null;
  }
  let cursor = marker[0].length;
  let emphasis = null;
  if (value.startsWith('**', cursor) || value.startsWith('__', cursor)) {
    emphasis = value.slice(cursor, cursor + 2);
    cursor += 2;
  } else if (value[cursor] === '*' || value[cursor] === '_') {
    emphasis = value[cursor];
    cursor += 1;
  }
  const target = explicitTargetAt(value, cursor, false);
  if (target === null) {
    return null;
  }
  let afterTarget = target.end;
  if (emphasis !== null && value.startsWith(emphasis, afterTarget)) {
    afterTarget += emphasis.length;
  }

  for (let descriptorCount = 0; descriptorCount <= 6; descriptorCount += 1) {
    let boundary = skipSpaces(value, afterTarget);
    if (emphasis !== null && value.startsWith(emphasis, boundary)) {
      boundary += emphasis.length;
      boundary = skipSpaces(value, boundary);
    }
    if (
      boundary === value.length ||
      value[boundary] === ':' ||
      value[boundary] === '—' ||
      value[boundary] === '-' ||
      value[boundary] === '(' ||
      value[boundary] === '.'
    ) {
      return { ...target, priority: 2, relationSpan: { start: marker[0].length, end: boundary } };
    }
    if (descriptorCount === 6) {
      break;
    }
    const token = boundedTokenAt(value, boundary);
    if (token === null) {
      break;
    }
    afterTarget = token.end;
  }
  return null;
}

function selectCaptures(candidates) {
  const selected = [];
  for (let priority = 1; priority <= 4; priority += 1) {
    const tier = candidates
      .filter((candidate) => candidate.priority === priority)
      .sort(
        (left, right) =>
          left.start - right.start ||
          right.end - right.start - (left.end - left.start) ||
          compareCodeUnits(left.type, right.type),
      );
    for (const candidate of tier) {
      if (selected.some((existing) => overlaps(existing, candidate))) {
        continue;
      }
      selected.push(candidate);
    }
  }
  return selected.sort((left, right) => left.start - right.start || left.end - right.end);
}

function analyzeRegularEntry(entry) {
  const view = shadowView(entry.payload);
  const value = view.shadow;
  const composites = collectRegexMatches(value, COMPOSITE_PATTERNS, 1, 'composite');
  const direct = collectDirectRelations(value, composites);
  const owner = collectOwnerRelations(value, composites);
  const head = entryHeadRelation(value);
  const marked = collectDescriptors(value);
  const fixed = collectFixedLaneMatches(value, false);
  const candidates = [
    ...composites,
    ...direct.captures,
    ...owner.captures,
    ...(head === null ? [] : [head]),
    ...marked,
    ...fixed,
  ];
  const captures = selectCaptures(candidates);
  const reasons = new Set([...direct.reasons, ...owner.reasons]);

  for (const capture of captures) {
    if (
      capture.type === 'explicit-code' &&
      !pathClassification(value.slice(capture.start, capture.end)).valid
    ) {
      reasons.add('invalid-path-target');
    }
  }

  if (entry.paragraphForm) {
    reasons.add('paragraph-form-regular-entry');
  }

  const explicitCandidates = scanExplicitTargets(value);
  for (const candidate of explicitCandidates) {
    if (!captures.some((capture) => contains(capture, candidate))) {
      reasons.add('unbound-candidate');
    }
  }

  for (let left = 0; left < direct.relationSpans.length; left += 1) {
    for (let right = left + 1; right < direct.relationSpans.length; right += 1) {
      if (overlaps(direct.relationSpans[left], direct.relationSpans[right])) {
        reasons.add('nested-obligation-successor-mappings');
      }
    }
  }

  const consumedSpans = candidates.flatMap((capture) =>
    capture.relationSpan === undefined ? [capture] : [capture, capture.relationSpan],
  );
  const unboundCue = collectRegexMatches(value, DEFERRAL_CUE_PATTERNS, 0, 'cue').some(
    (cue) => !consumedSpans.some((span) => contains(span, cue)),
  );
  if (unboundCue) {
    reasons.add('unbound-deferral-cue');
  }

  if (reasons.size > 0) {
    return { captures: [], ambiguousReasons: [...reasons].sort(compareCodeUnits) };
  }
  return {
    captures: captures.map((capture) => ({
      ...capture,
      literal: view.literal(capture.start, capture.end),
    })),
    ambiguousReasons: [],
  };
}

function validateDocuments(documents) {
  const byNumber = new Map();
  for (const document of documents) {
    const match = document.filename.match(/^(\d{4})-.*\.md$/);
    if (match === null || document.filename === '0000-template.md') {
      continue;
    }
    const number = match[1];
    if (byNumber.has(number)) {
      throw new Error(
        `ambiguous duplicate ADR number ${number}: ${byNumber.get(number).filename}, ${document.filename}`,
      );
    }
    byNumber.set(number, document);
  }
  return byNumber;
}

function resolveTarget(targetLiteral, documentsByNumber, fileKind) {
  const normalized = targetLiteral.replace(/\s+/g, ' ').trim();
  const adr = normalized.match(/^ADR[ ]+(\d{4})$/i);
  if (adr !== null) {
    return {
      resolution: documentsByNumber.has(adr[1]) ? 'yes' : 'no',
      fileAddressableTarget: `ADR ${adr[1]}`,
    };
  }
  if (/^[QD]-\d{3}$/i.test(normalized) || /^class[ ]+[A-J]$/i.test(normalized)) {
    return { resolution: 'not-file-addressable', fileAddressableTarget: null };
  }
  const pathResult = pathClassification(targetLiteral);
  if (pathResult.valid) {
    return {
      resolution: fileKind(pathResult.path) === 'file' ? 'yes' : 'no',
      fileAddressableTarget: pathResult.path,
    };
  }
  return { resolution: 'not-file-addressable', fileAddressableTarget: null };
}

function analyzeCorpus(documents, fileKind = () => 'absent') {
  const sortedDocuments = [...documents]
    .filter(
      (document) =>
        document.filename !== '0000-template.md' && /^(\d{4})-.*\.md$/.test(document.filename),
    )
    .sort((left, right) => compareCodeUnits(left.filename, right.filename));
  const documentsByNumber = validateDocuments(sortedDocuments);
  const regular = [];
  const regularBlockEntries = [];
  const ambiguous = [];
  const irregular = [];

  for (const document of sortedDocuments) {
    const number = document.filename.slice(0, 4);
    const parsed = parseDocument(document);
    const block = parsed.regularBlocks[0];
    if (block !== undefined) {
      for (let entryIndex = 0; entryIndex < block.entries.length; entryIndex += 1) {
        const entry = block.entries[entryIndex];
        const result = analyzeRegularEntry(entry);
        const source = {
          adrNumber: number,
          entryNumber: entryIndex + 1,
          relativePath: document.relativePath,
          lineStart: entry.startIndex + 1,
          lineEnd: entry.endIndex + 1,
          payload: entry.payload,
        };
        regularBlockEntries.push(source);
        if (result.ambiguousReasons.length > 0) {
          ambiguous.push({ ...source, reasons: result.ambiguousReasons });
          continue;
        }
        for (let successorIndex = 0; successorIndex < result.captures.length; successorIndex += 1) {
          const capture = result.captures[successorIndex];
          const resolved = resolveTarget(capture.literal, documentsByNumber, fileKind);
          regular.push({
            ...source,
            successorNumber: successorIndex + 1,
            target: capture.literal,
            ...resolved,
          });
        }
      }
    }
    for (let irregularIndex = 0; irregularIndex < parsed.irregular.length; irregularIndex += 1) {
      const item = parsed.irregular[irregularIndex];
      irregular.push({
        adrNumber: number,
        itemNumber: irregularIndex + 1,
        relativePath: document.relativePath,
        lineStart: item.startIndex + 1,
        lineEnd: item.endIndex + 1,
        kind: item.kind,
        payload: item.payload,
      });
    }
  }
  return { regular, regularBlockEntries, ambiguous, irregular };
}

function collisionSafeFence(payload) {
  let longest = 0;
  for (const match of payload.matchAll(/`+/g)) {
    longest = Math.max(longest, match[0].length);
  }
  return '`'.repeat(Math.max(3, longest + 1));
}

function fencedPayload(payload) {
  const fence = collisionSafeFence(payload);
  return `${fence}\n${payload}\n${fence}`;
}

function fileAddressableSuccessorSummary(regular) {
  const groups = new Map();
  for (const item of regular) {
    if (item.fileAddressableTarget === null) {
      if (item.resolution !== 'not-file-addressable') {
        throw new Error(`missing canonical identity for ${item.resolution} successor`);
      }
      continue;
    }
    if (item.resolution !== 'yes' && item.resolution !== 'no') {
      throw new Error(
        `invalid existence state for canonical successor ${item.fileAddressableTarget}`,
      );
    }
    const existing = groups.get(item.fileAddressableTarget);
    if (existing === undefined) {
      groups.set(item.fileAddressableTarget, {
        successor: item.fileAddressableTarget,
        resolution: item.resolution,
        adrNumbers: new Set([item.adrNumber]),
      });
      continue;
    }
    if (existing.resolution !== item.resolution) {
      throw new Error(
        `inconsistent existence resolution for canonical successor ${item.fileAddressableTarget}`,
      );
    }
    existing.adrNumbers.add(item.adrNumber);
  }

  return [...groups.values()]
    .map((group) => ({
      successor: group.successor,
      resolution: group.resolution,
      adrNumbers: [...group.adrNumbers].sort(compareCodeUnits),
    }))
    .sort(
      (left, right) =>
        right.adrNumbers.length - left.adrNumbers.length ||
        compareCodeUnits(left.successor, right.successor),
    );
}

function gatewayReviewEntries(regularBlockEntries) {
  return regularBlockEntries
    .filter((entry) => containsExactGatewayToken(entry.payload))
    .sort(
      (left, right) =>
        compareCodeUnits(left.adrNumber, right.adrNumber) ||
        left.entryNumber - right.entryNumber ||
        compareCodeUnits(left.relativePath, right.relativePath) ||
        left.lineStart - right.lineStart ||
        left.lineEnd - right.lineEnd,
    );
}

function sourceSpanLink(item) {
  const relativeTarget = path.posix.relative(path.posix.dirname(OUTPUT_PATH), item.relativePath);
  const lineAnchor =
    item.lineStart === item.lineEnd ? `L${item.lineStart}` : `L${item.lineStart}-L${item.lineEnd}`;
  const label = `${item.relativePath}:${item.lineStart}-${item.lineEnd}`;
  return `[\`${label}\`](${relativeTarget}?plain=1#${lineAnchor})`;
}

function renderIndex(analysis) {
  const successorSummary = fileAddressableSuccessorSummary(analysis.regular);
  const gatewayEntries = gatewayReviewEntries(analysis.regularBlockEntries);
  const gatewayAdrNumbers = [...new Set(gatewayEntries.map((entry) => entry.adrNumber))].sort(
    compareCodeUnits,
  );
  const lines = [
    '# ADR Deferral Index — Derived and Non-Authoritative',
    '',
    '> **Derived, non-authoritative lookup.** Quoted ADR text remains the source.',
    '> This index grants no implementation authorization. A `yes` or `no` result',
    '> reports only whether an explicitly file-addressable successor exists.',
    '',
    '<!-- doc-pointer-check: provenance-below -->',
    '',
    '## File-addressable successor summary — Derived and Non-Authoritative',
    '',
    '> This table includes only regular successor captures that resolve to a canonical',
    '> ADR number or admitted repository path. Descriptive and other',
    '> `not-file-addressable` targets are excluded. `Unique deferring ADRs` counts',
    '> each ADR once per canonical successor even when that ADR emits repeated edges.',
    '> Rows sort by that count descending, then by canonical successor in',
    '> locale-independent code-unit order.',
    '',
  ];

  if (successorSummary.length === 0) {
    lines.push('_None._', '');
  } else {
    lines.push(
      '| Successor | Successor file exists | Unique deferring ADRs | ADR numbers |',
      '|---|---|---:|---|',
    );
    for (const row of successorSummary) {
      lines.push(
        `| \`${row.successor}\` | \`${row.resolution}\` | ${row.adrNumbers.length} | ${row.adrNumbers
          .map((number) => `\`${number}\``)
          .join(', ')} |`,
      );
    }
    lines.push('');
  }

  lines.push(
    '## Review only: Entries containing the exact token `gateway` — Derived and Non-Authoritative',
    '',
    '> Syntactic review rollup only. The selector ASCII-folds `A` through `Z` and',
    '> matches `gateway` only when bounded by non-`[A-Za-z0-9_]` characters or a',
    '> payload boundary. It scans exact payloads already parsed from recognized',
    '> regular `Out of scope` blocks, including entries routed to ambiguous review.',
    '> It assigns no successor identity, existence state, or edge claim; ambiguous',
    '> entries remain review-only.',
    '',
    `- Unique ADR count: ${gatewayAdrNumbers.length}`,
    `- ADR numbers: ${
      gatewayAdrNumbers.length === 0
        ? '_None._'
        : gatewayAdrNumbers.map((number) => `\`${number}\``).join(', ')
    }`,
    '- Matching source spans:',
    '',
  );

  if (gatewayEntries.length === 0) {
    lines.push('  - _None._', '');
  } else {
    for (const item of gatewayEntries) {
      lines.push(`  - ADR ${item.adrNumber}, entry ${item.entryNumber}: ${sourceSpanLink(item)}`);
    }
    lines.push('');
  }

  lines.push('## Regular deferrals', '');

  if (analysis.regular.length === 0) {
    lines.push('_None._', '');
  } else {
    for (let index = 0; index < analysis.regular.length; index += 1) {
      const item = analysis.regular[index];
      lines.push(
        `### ${index + 1}. ADR ${item.adrNumber} — entry ${item.entryNumber}, successor ${item.successorNumber}`,
        '',
        `- Source: \`${item.relativePath}:${item.lineStart}-${item.lineEnd}\``,
        `- Successor file exists: \`${item.resolution}\``,
        '- Named successor (exact source literal):',
        '',
        fencedPayload(item.target),
        '',
        '- Deferred obligation (exact source payload):',
        '',
        fencedPayload(item.payload),
        '',
      );
    }
  }

  lines.push('## Review required: ambiguous regular entries', '');
  if (analysis.ambiguous.length === 0) {
    lines.push('_None._', '');
  } else {
    for (let index = 0; index < analysis.ambiguous.length; index += 1) {
      const item = analysis.ambiguous[index];
      lines.push(
        `### ${index + 1}. ADR ${item.adrNumber} — entry ${item.entryNumber}`,
        '',
        `- Source: \`${item.relativePath}:${item.lineStart}-${item.lineEnd}\``,
        `- Review reason: ${item.reasons.map((reason) => `\`${reason}\``).join(', ')}`,
        '- Exact source payload:',
        '',
        fencedPayload(item.payload),
        '',
      );
    }
  }

  lines.push('## Review required: irregular forms', '');
  if (analysis.irregular.length === 0) {
    lines.push('_None._', '');
  } else {
    for (let index = 0; index < analysis.irregular.length; index += 1) {
      const item = analysis.irregular[index];
      lines.push(
        `### ${index + 1}. ADR ${item.adrNumber} — irregular item ${item.itemNumber}`,
        '',
        `- Source: \`${item.relativePath}:${item.lineStart}-${item.lineEnd}\``,
        `- Form: \`${item.kind}\``,
        '- Exact source payload:',
        '',
        fencedPayload(item.payload),
        '',
      );
    }
  }

  while (lines.at(-1) === '') {
    lines.pop();
  }
  return `${lines.join('\n')}\n`;
}

async function loadRepositoryDocuments() {
  const absoluteDirectory = path.join(REPO_ROOT, ADR_DIRECTORY);
  const entries = await readdir(absoluteDirectory, { withFileTypes: true });
  const filenames = entries
    .filter(
      (entry) =>
        entry.isFile() && entry.name !== '0000-template.md' && /^\d{4}-.*\.md$/.test(entry.name),
    )
    .map((entry) => entry.name)
    .sort(compareCodeUnits);
  return Promise.all(
    filenames.map(async (filename) => {
      const relativePath = `${ADR_DIRECTORY}/${filename}`;
      const bytes = await readFile(path.join(REPO_ROOT, relativePath));
      const text = bytes.toString('utf8');
      if (!Buffer.from(text, 'utf8').equals(bytes)) {
        throw new Error(`${relativePath}: source is not valid round-trippable UTF-8`);
      }
      return {
        filename,
        relativePath,
        text,
      };
    }),
  );
}

async function repositoryFileKind(relativePath, inspectPath = lstat) {
  const components = relativePath.split('/');
  let current = REPO_ROOT;
  for (let index = 0; index < components.length; index += 1) {
    current = path.join(current, components[index]);
    try {
      const result = await inspectPath(current);
      if (result.isSymbolicLink()) {
        return 'other';
      }
      if (index + 1 < components.length) {
        if (!result.isDirectory()) {
          return 'other';
        }
        continue;
      }
      return result.isFile() ? 'file' : result.isDirectory() ? 'directory' : 'other';
    } catch (error) {
      if (error !== null && typeof error === 'object' && error.code === 'ENOENT') {
        return 'absent';
      }
      throw error;
    }
  }
  return 'absent';
}

async function renderRepositoryIndex() {
  const documents = await loadRepositoryDocuments();
  const knownPaths = new Set();
  const pathCandidates = new Set();

  // Analyze once with a collecting resolver, then resolve the finite path set
  // asynchronously and render from the same immutable source documents.
  analyzeCorpus(documents, (relativePath) => {
    pathCandidates.add(relativePath);
    return 'absent';
  });
  for (const candidate of pathCandidates) {
    knownPaths.add(`${candidate}\0${await repositoryFileKind(candidate)}`);
  }
  const fileKind = (relativePath) => {
    for (const encoded of knownPaths) {
      const separator = encoded.indexOf('\0');
      if (encoded.slice(0, separator) === relativePath) {
        return encoded.slice(separator + 1);
      }
    }
    return 'absent';
  };
  return renderIndex(analyzeCorpus(documents, fileKind));
}

function checkBytes(rendered, current) {
  return current !== null && rendered === current;
}

async function atomicWrite(relativePath, bytes) {
  const destination = path.join(REPO_ROOT, relativePath);
  const temporary = path.join(
    path.dirname(destination),
    `.${path.basename(destination)}.${process.pid}.${Date.now()}.tmp`,
  );
  let handle = null;
  try {
    handle = await open(temporary, 'wx', 0o644);
    await handle.writeFile(bytes, 'utf8');
    await handle.sync();
    await handle.close();
    handle = null;
    await rename(temporary, destination);
  } catch (error) {
    if (handle !== null) {
      await handle.close();
    }
    try {
      await unlink(temporary);
    } catch (unlinkError) {
      if (
        unlinkError === null ||
        typeof unlinkError !== 'object' ||
        unlinkError.code !== 'ENOENT'
      ) {
        throw unlinkError;
      }
    }
    throw error;
  }
}

function fixtureDocument(number, body, suffix = 'fixture') {
  const filename = `${number}-${suffix}.md`;
  return {
    filename,
    relativePath: `${ADR_DIRECTORY}/${filename}`,
    text: body,
  };
}

function fixtureAnalysis(body, extraDocuments = [], fileKinds = new Map()) {
  return analyzeCorpus(
    [fixtureDocument('0001', body), ...extraDocuments],
    (relativePath) => fileKinds.get(relativePath) ?? 'absent',
  );
}

function runFixtures() {
  // Modes are a closed two-value interface.
  assert.equal(parseMode(['--write']), '--write');
  assert.equal(parseMode(['--check']), '--check');
  assert.throws(() => parseMode([]), /usage:/);
  assert.throws(() => parseMode(['--write', '--check']), /usage:/);
  assert.throws(() => parseMode(['--unknown']), /usage:/);

  // Sorting uses UTF-16 code-unit order and never ambient collation.
  assert.deepEqual(['z', 'A', 'ä'].sort(compareCodeUnits), ['A', 'z', 'ä']);

  // The review-only gateway selector is one closed ASCII-folded token
  // predicate. Word continuations do not match; punctuation does.
  for (const positive of ['gateway', 'GATEWAY', 'gateway/policy', '(Gateway)', 'gateway-set']) {
    assert.equal(containsExactGatewayToken(positive), true, positive);
  }
  for (const negative of [
    'gateways',
    'pregateway',
    'gateway_id',
    'kernel_gateway',
    'gateway2',
    'gäteway',
  ]) {
    assert.equal(containsExactGatewayToken(negative), false, negative);
  }

  // Exact H2/H3 recognition; H4-H6 and qualified forms are review-only.
  for (const level of [2, 3]) {
    const analysis = fixtureAnalysis(`${'#'.repeat(level)} Out of scope\t \n\n- future schema PR.`);
    assert.equal(analysis.regular.length, 1);
    assert.equal(analysis.irregular.length, 0);
  }
  for (const level of [4, 5, 6]) {
    const analysis = fixtureAnalysis(`${'#'.repeat(level)} Out of scope\n\n- quoted candidate`);
    assert.equal(analysis.regular.length, 0);
    assert.equal(analysis.irregular.length, 1);
  }
  {
    const analysis = fixtureAnalysis('### Out of scope for this ADR\n\n- quoted candidate');
    assert.equal(analysis.regular.length, 0);
    assert.equal(analysis.irregular.length, 1);
  }
  {
    const analysis = fixtureAnalysis(
      '```md\n## Out of scope\n- future fake ADR\n```\n~~~md\n### Out of scope\n~~~\n\n## Out of scope\n\n- future schema PR.',
    );
    assert.equal(analysis.regular.length, 1);
    assert.equal(analysis.irregular.length, 0);
  }
  {
    const analysis = fixtureAnalysis(
      '## Out of scope\n\n```md\n- future fake ADR\n```\n\nFuture paragraph.',
    );
    assert.equal(analysis.regular.length, 0);
    assert.equal(analysis.ambiguous.length, 2);
    assert(
      analysis.ambiguous.every((entry) => entry.reasons.includes('paragraph-form-regular-entry')),
    );
  }
  {
    const analysis = fixtureAnalysis(
      '### Option: Out of scope\n\nText.\n\n### Follow-up regression coverage\n\nText.',
    );
    assert.deepEqual(analysis, {
      regular: [],
      regularBlockEntries: [],
      ambiguous: [],
      irregular: [],
    });
  }

  // Regular block termination, top-level item extent, wrapping, nesting, and
  // paragraph fallback all retain exact bytes and inclusive spans.
  {
    const body = [
      '# ADR',
      '',
      '## Out of scope',
      '',
      '- future schema PR',
      '  with a wrapped line',
      '',
      '  - nested item',
      '- separate adapter ADR',
      '',
      '## Consequences',
      '',
      '- not part of the block',
    ].join('\n');
    const parsed = parseDocument(fixtureDocument('0001', body));
    const entries = parsed.regularBlocks[0].entries;
    assert.equal(entries.length, 2);
    assert.equal(
      entries[0].payload,
      '- future schema PR\n  with a wrapped line\n\n  - nested item',
    );
    assert.equal(entries[1].payload, '- separate adapter ADR\n');
  }
  {
    const analysis = fixtureAnalysis(
      '## Out of scope\n\nFuture service paragraph.\ncontinues here.\n\nSeparate ADR paragraph.\n\n## End',
    );
    assert.equal(analysis.ambiguous.length, 2);
    assert(
      analysis.ambiguous.every((entry) => entry.reasons.includes('paragraph-form-regular-entry')),
    );
  }
  {
    const regular = fixtureAnalysis('# ADR\n\n## Out of scope\n\n- future schema PR.');
    assert.equal(regular.regular[0].lineStart, 5);
    assert.equal(regular.regular[0].lineEnd, 5);
    const ambiguous = fixtureAnalysis(
      '# ADR\n\n## Out of scope\n\n- Edits to ADR 9999 are excluded.',
    );
    assert.equal(ambiguous.ambiguous[0].lineStart, 5);
    assert.equal(ambiguous.ambiguous[0].lineEnd, 5);
    const irregular = fixtureAnalysis(
      '# ADR\n\n### Deferred follow-on candidates\n\nCandidate through EOF.',
    );
    assert.equal(irregular.irregular[0].lineStart, 3);
    assert.equal(irregular.irregular[0].lineEnd, 5);
  }

  // Every direct introducer is ASCII-case-insensitive and binds only an
  // immediately following target.
  for (const introducer of DIRECT_INTRODUCERS) {
    const analysis = fixtureAnalysis(
      `## Out of scope\n\n- Work ${introducer.toUpperCase()} ADR 9999.`,
    );
    assert.equal(analysis.regular.length, 1, introducer);
    assert.equal(analysis.regular[0].target, 'ADR 9999');
    assert.equal(analysis.regular[0].resolution, 'no');
  }
  {
    const analysis = fixtureAnalysis('## Out of scope\n\n- ADR 9999 owns the successor work.');
    assert.equal(analysis.regular.length, 1);
    assert.equal(analysis.regular[0].target, 'ADR 9999');
  }
  {
    const analysis = fixtureAnalysis(
      '## Out of scope\n\n- `docs/../README.md` owns the successor work.',
    );
    assert.equal(analysis.regular.length, 0);
    assert(analysis.ambiguous[0].reasons.includes('invalid-path-target'));
  }

  // Entry-initial explicit targets support emphasis, zero-to-six descriptor
  // tokens, every terminator, and reject a prose-prefixed ADR mention.
  for (const terminator of [':', '—', '-', '(', '.', '']) {
    const tail = terminator === '' ? '' : `${terminator} label`;
    const analysis = fixtureAnalysis(
      `## Out of scope\n\n- **ADR 9999** one two three ${tail}`.trimEnd(),
    );
    assert.equal(analysis.regular.length, 1, terminator || 'end');
    assert.equal(analysis.regular[0].target, 'ADR 9999');
  }
  {
    const analysis = fixtureAnalysis(
      '## Out of scope\n\n- Edits to ADR 9999. This mention is not entry-initial.',
    );
    assert.equal(analysis.regular.length, 0);
    assert.equal(analysis.ambiguous.length, 1);
    assert(analysis.ambiguous[0].reasons.includes('unbound-candidate'));
  }

  // Every determiner, descriptor marker, bounded-token edge, and descriptor
  // head is exercised independently of title similarity.
  for (const determiner of DETERMINERS) {
    const analysis = fixtureAnalysis(
      `## Out of scope\n\n- Reserved for ${determiner} future named ADR.`,
    );
    assert.equal(analysis.regular.length, 1, determiner);
  }
  for (const marker of DESCRIPTOR_MARKERS) {
    const analysis = fixtureAnalysis(`## Out of scope\n\n- ${marker} named implementation PR.`);
    assert.equal(analysis.regular.length, 1, marker);
  }
  for (const head of DESCRIPTOR_HEADS) {
    const analysis = fixtureAnalysis(`## Out of scope\n\n- future named ${head}.`);
    assert.equal(analysis.regular.length, 1, head);
  }
  {
    const six = fixtureAnalysis('## Out of scope\n\n- future one two three four five six ADR.');
    assert.equal(six.regular.length, 1);
    const seven = fixtureAnalysis(
      '## Out of scope\n\n- future one two three four five six seven ADR.',
    );
    assert.equal(seven.regular.length, 0);
    assert.equal(seven.ambiguous.length, 1);
  }
  {
    const stopped = fixtureAnalysis('## Out of scope\n\n- future named and alternate ADR.');
    assert.equal(stopped.regular.length, 0);
    assert.equal(stopped.ambiguous.length, 1);
  }
  {
    const zeroNameTokens = fixtureAnalysis('## Out of scope\n\n- future ADR.');
    assert.equal(zeroNameTokens.regular.length, 1);
    const codeNameToken = fixtureAnalysis('## Out of scope\n\n- future `named target` ADR.');
    assert.equal(codeNameToken.regular.length, 1);
  }
  for (const boundary of ['that', 'per', 'if', 'when', 'after', 'before', 'once', 'and', 'or']) {
    const analysis = fixtureAnalysis(
      `## Out of scope\n\n- future named ${boundary} alternate ADR.`,
    );
    assert.equal(analysis.regular.length, 0, boundary);
    assert.equal(analysis.ambiguous.length, 1, boundary);
  }

  // Fixed lanes match in lowercase as required.
  const fixedLaneExamples = [
    'schema implementation',
    'schema pr',
    'schema prs',
    'the schema pr',
    'registry update pr',
    'canonical policy at milestone 2',
    'tiers.yaml once hcs milestone 2 ships',
    'hcs milestone 2',
    'ring 0 implementation',
    'ring 1 implementation',
    'ring 2 implementation',
    'ring 3 implementation',
  ];
  for (const lane of fixedLaneExamples) {
    const analysis = fixtureAnalysis(`## Out of scope\n\n- ${lane}.`);
    assert.equal(analysis.regular.length, 1, lane);
  }
  {
    const suffixed = fixtureAnalysis('## Out of scope\n\n- schema implementation PR.');
    assert.equal(suffixed.regular.length, 1);
    assert.equal(suffixed.regular[0].target, 'schema implementation PR');
    const relationBoundPhase = fixtureAnalysis('## Out of scope\n\n- Work deferred to Phase 2.');
    assert.equal(relationBoundPhase.regular.length, 1);
    assert.equal(relationBoundPhase.regular[0].target, 'Phase 2');
    const suffixedPhase = fixtureAnalysis('## Out of scope\n\n- Work deferred to Phase 2 PR.');
    assert.equal(suffixedPhase.regular.length, 0);
    assert.equal(suffixedPhase.ambiguous.length, 1);
    const contextOnlyPhase = fixtureAnalysis(
      '## Out of scope\n\n- Multi-worktree is excluded. Phase 1 is one-to-one.',
    );
    assert.equal(contextOnlyPhase.regular.length, 0);
    assert.equal(contextOnlyPhase.ambiguous.length, 1);
  }

  // Composite precedence consumes inner ADRs and relation cues; the backward
  // gateway form must produce exactly one descriptive successor.
  const compositeExamples = [
    'ADR 9999 follow-up',
    "ADR 9999's schema PR",
    'the gateway ADR that ADR 9999 defers to',
    'the wave-2 ADR',
    'audit-events/storage ADR',
  ];
  for (const composite of compositeExamples) {
    const analysis = fixtureAnalysis(`## Out of scope\n\n- ${composite}.`);
    assert.equal(analysis.regular.length, 1, composite);
    assert.equal(analysis.regular[0].target, composite);
    assert.equal(analysis.regular[0].resolution, 'not-file-addressable');
  }
  {
    const analysis = fixtureAnalysis('## Out of scope\n\n- ADR 9999’s schema PR.');
    assert.equal(analysis.regular.length, 0);
    assert.equal(analysis.ambiguous.length, 1);
    assert(analysis.ambiguous[0].reasons.includes('unbound-candidate'));
  }
  {
    const analysis = fixtureAnalysis(
      '## Out of scope\n\n- future the gateway ADR that ADR 9999 defers to ADR.',
    );
    assert.equal(analysis.regular.length, 1);
    assert.equal(analysis.regular[0].target, 'the gateway ADR that ADR 9999 defers to');
  }

  // Multiple explicit successors use +, retain source order, and do not
  // deduplicate equal occurrences. Alternatives using and/or are review-only.
  {
    const analysis = fixtureAnalysis('## Out of scope\n\n- Work deferred to ADR 9998 + ADR 9999.');
    assert.deepEqual(
      analysis.regular.map((entry) => entry.target),
      ['ADR 9998', 'ADR 9999'],
    );
  }
  {
    const analysis = fixtureAnalysis('## Out of scope\n\n- future schema PR; future schema PR.');
    assert.deepEqual(
      analysis.regular.map((entry) => entry.target),
      ['future schema PR', 'future schema PR'],
    );
  }
  {
    const analysis = fixtureAnalysis(
      '## Out of scope\n\n- Other providers follow under separate ADRs.',
    );
    assert.equal(analysis.regular.length, 0);
    assert.equal(analysis.ambiguous.length, 1);
    assert(analysis.ambiguous[0].reasons.includes('unbound-deferral-cue'));
  }
  for (const alternative of ['and', 'or']) {
    const analysis = fixtureAnalysis(
      `## Out of scope\n\n- Work deferred to ADR 9998 ${alternative} ADR 9999.`,
    );
    assert.equal(analysis.regular.length, 0);
    assert.equal(analysis.ambiguous.length, 1);
    assert(analysis.ambiguous[0].reasons.includes('relation-crosses-and-or'));
  }

  // ADR existence, repository-path existence (including locators and a
  // directory), and every non-file-addressable family.
  {
    const targetDocument = fixtureDocument('9999', '# ADR target', 'target');
    const analysis = fixtureAnalysis('## Out of scope\n\n- Work deferred to ADR 9999.', [
      targetDocument,
    ]);
    assert.equal(analysis.regular[0].resolution, 'yes');
  }
  {
    const kinds = new Map([
      ['docs/existing.md', 'file'],
      ['docs/missing.md', 'absent'],
      ['docs/a-directory', 'directory'],
      ['docs/a-symlink', 'other'],
    ]);
    const analysis = fixtureAnalysis(
      [
        '## Out of scope',
        '',
        '- Work deferred to `docs/existing.md:12`.',
        '- Work deferred to `docs/existing.md:12-14`.',
        '- Work deferred to `docs/missing.md`.',
        '- Work deferred to `docs/a-directory`.',
        '- Work deferred to `docs/a-symlink`.',
        '- Work deferred to `README.md`.',
      ].join('\n'),
      [],
      new Map([...kinds, ['README.md', 'file']]),
    );
    assert.deepEqual(
      analysis.regular.map((entry) => entry.resolution),
      ['yes', 'yes', 'no', 'no', 'no', 'yes'],
    );
  }
  {
    const analysis = fixtureAnalysis(
      [
        '## Out of scope',
        '',
        '- Work deferred to Q-123.',
        '- Work deferred to D-456.',
        '- Work deferred to class J.',
        '- future named service.',
      ].join('\n'),
    );
    assert.deepEqual(
      analysis.regular.map((entry) => entry.resolution),
      [
        'not-file-addressable',
        'not-file-addressable',
        'not-file-addressable',
        'not-file-addressable',
      ],
    );
  }

  // The addressable summary consumes canonical identities established during
  // resolution, deduplicates repeated edges from one ADR, strips path locators,
  // and sorts by unique-ADR count then canonical key.
  {
    const documents = [
      fixtureDocument(
        '0001',
        [
          '## Out of scope',
          '',
          '- Work deferred to ADR 9999.',
          '- Work deferred to ADR 9999.',
          '- Work deferred to `docs/existing.md:12`.',
          '- future named service.',
        ].join('\n'),
      ),
      fixtureDocument(
        '0002',
        [
          '## Out of scope',
          '',
          '- Work deferred to ADR 9999.',
          '- Work deferred to `docs/existing.md:20-24`.',
          '- Work deferred to `README.md`.',
        ].join('\n'),
      ),
      fixtureDocument('0003', '## Out of scope\n\n- Work deferred to ADR 8888.'),
      fixtureDocument('9999', '# Existing target', 'target'),
    ];
    const kinds = new Map([
      ['docs/existing.md', 'file'],
      ['README.md', 'file'],
    ]);
    const analysis = analyzeCorpus(
      documents,
      (relativePath) => kinds.get(relativePath) ?? 'absent',
    );
    assert.deepEqual(fileAddressableSuccessorSummary(analysis.regular), [
      {
        successor: 'ADR 9999',
        resolution: 'yes',
        adrNumbers: ['0001', '0002'],
      },
      {
        successor: 'docs/existing.md',
        resolution: 'yes',
        adrNumbers: ['0001', '0002'],
      },
      {
        successor: 'ADR 8888',
        resolution: 'no',
        adrNumbers: ['0003'],
      },
      {
        successor: 'README.md',
        resolution: 'yes',
        adrNumbers: ['0002'],
      },
    ]);
    assert(
      analysis.regular.every(
        (entry) => entry.target !== 'future named service' || entry.fileAddressableTarget === null,
      ),
    );

    const nonAddressable = fixtureAnalysis(
      [
        '## Out of scope',
        '',
        '- Work deferred to Q-123.',
        '- Work deferred to D-456.',
        '- Work deferred to class J.',
        '- future named service.',
      ].join('\n'),
    );
    assert.deepEqual(fileAddressableSuccessorSummary(nonAddressable.regular), []);

    const ambiguous = fixtureAnalysis(
      '## Out of scope\n\n- Work deferred to ADR 9998 and ADR 9999.',
    );
    assert.equal(ambiguous.regular.length, 0);
    assert.deepEqual(fileAddressableSuccessorSummary(ambiguous.regular), []);
  }

  // The gateway rollup projects every entry from a recognized regular block
  // once, including silent and ambiguous entries, while excluding irregular
  // blocks and token continuations. It never changes successor classification.
  {
    const documents = [
      fixtureDocument(
        '0001',
        [
          '## Out of scope',
          '',
          '- Gateway behavior.',
          '- GATEWAY/policy follows later.',
          '- gateways and gateway_id are different tokens.',
        ].join('\n'),
      ),
      fixtureDocument(
        '0002',
        '## Out of scope\n\n- Gateway work is deferred to ADR 9998 and ADR 9999; gateway review remains.',
      ),
      fixtureDocument('0003', '### Cross-scope follow-ups\n\nGateway behavior.'),
      fixtureDocument('0004', '## Out of scope\n\nGateway paragraph form.'),
    ];
    const analysis = analyzeCorpus(documents);
    const entries = gatewayReviewEntries(analysis.regularBlockEntries);
    assert.deepEqual(
      entries.map((entry) => [entry.adrNumber, entry.entryNumber]),
      [
        ['0001', 1],
        ['0001', 2],
        ['0002', 1],
        ['0004', 1],
      ],
    );
    assert(
      !analysis.ambiguous.some((entry) => entry.adrNumber === '0001' && entry.entryNumber === 1),
    );
    assert(analysis.ambiguous.some((entry) => entry.adrNumber === '0002'));
    assert(analysis.ambiguous.some((entry) => entry.adrNumber === '0004'));
    assert.equal(analysis.irregular.length, 1);

    const rendered = renderIndex(analysis);
    const section = rendered.slice(
      rendered.indexOf(
        '## Review only: Entries containing the exact token `gateway` — Derived and Non-Authoritative',
      ),
      rendered.indexOf('## Regular deferrals'),
    );
    assert(section.includes('- Unique ADR count: 3'));
    assert(section.includes('- ADR numbers: `0001`, `0002`, `0004`'));
    assert(section.includes('?plain=1#L3'));
    assert(section.includes('Derived and Non-Authoritative'));
    assert(!section.includes('Successor file exists'));
    assert(!section.includes('Named successor'));

    const summarySection = rendered.slice(
      rendered.indexOf('## File-addressable successor summary — Derived and Non-Authoritative'),
      rendered.indexOf(
        '## Review only: Entries containing the exact token `gateway` — Derived and Non-Authoritative',
      ),
    );
    assert(summarySection.includes('Unique deferring ADRs'));
    assert(summarySection.includes('each ADR once per canonical successor'));
    assert(!summarySection.includes('blocked'));
  }

  // Unsafe, unadmitted, directory-traversing, and non-repository path forms
  // never emit a path result and make a deferral-cued entry review-only.
  const invalidPaths = [
    '`/tmp/file.md`',
    '`~/file.md`',
    '`https://example.test/file.md`',
    '`../sibling/file.md`',
    '`docs/../README.md`',
    '`docs//file.md`',
    '`src/file.md`',
    '`docs\\file.md`',
  ];
  for (const invalidPath of invalidPaths) {
    const analysis = fixtureAnalysis(`## Out of scope\n\n- Work deferred to ${invalidPath}.`);
    assert.equal(analysis.regular.length, 0, invalidPath);
    assert.equal(analysis.ambiguous.length, 1, invalidPath);
  }
  {
    const entryHeadInvalid = fixtureAnalysis(
      '## Out of scope\n\n- `docs/trailing-directory/` changes.',
    );
    assert.equal(entryHeadInvalid.regular.length, 0);
    assert(entryHeadInvalid.ambiguous[0].reasons.includes('invalid-path-target'));
  }

  // Frontmatter status is neither an extraction predicate nor a resolution
  // input. Equal-line-count status changes cannot alter the extracted graph.
  {
    const proposed = fixtureAnalysis(
      '---\nstatus: proposed\n---\n\n## Out of scope\n\n- Work deferred to ADR 9999.',
    );
    const accepted = fixtureAnalysis(
      '---\nstatus: accepted\n---\n\n## Out of scope\n\n- Work deferred to ADR 9999.',
    );
    assert.deepEqual(proposed, accepted);
  }

  // Duplicate regular blocks and duplicate number filenames fail closed.
  assert.throws(
    () =>
      parseDocument(
        fixtureDocument(
          '0001',
          '## Out of scope\n\n- future schema PR.\n\n## Out of scope\n\n- future adapter ADR.',
        ),
      ),
    /duplicate regular/,
  );
  assert.throws(
    () =>
      analyzeCorpus([
        fixtureDocument('0001', '# One', 'one'),
        fixtureDocument('0001', '# Two', 'two'),
      ]),
    /ambiguous duplicate ADR number/,
  );

  // Irregular heading families terminate at equal/higher headings and exclude
  // arbitrary follow-up headings.
  const irregularHeadings = [
    '## Out of scope for this ADR',
    '## Out-of-scope legacy heading',
    '### Deferred follow-on candidates',
    '### Cross-scope follow-ups',
    '### Non-charter changes deferred',
    '### Cross-record commitments deferred to Ring 1',
  ];
  for (const irregularHeading of irregularHeadings) {
    const level = irregularHeading.match(/^#+/)[0].length;
    const analysis = fixtureAnalysis(
      `${irregularHeading}\n\nCandidate text.\n\n${'#'.repeat(level)} Stop\n\nExcluded.`,
    );
    assert.equal(analysis.irregular.length, 1, irregularHeading);
    assert(!analysis.irregular[0].payload.includes('Excluded.'));
  }
  {
    const higher = fixtureAnalysis(
      '### Deferred follow-on candidates\n\nCandidate.\n\n#### Nested heading\nStill included.\n\n## Higher stop\nExcluded.',
    );
    assert(higher.irregular[0].payload.includes('Still included.'));
    assert(!higher.irregular[0].payload.includes('Higher stop'));
    const atEof = fixtureAnalysis('### Cross-scope follow-ups\n\nCandidate through EOF.');
    assert(atEof.irregular[0].payload.endsWith('Candidate through EOF.'));
  }

  // Legacy bold lead-ins: both colon placements, inline paragraph behavior,
  // list termination at paragraph/heading/EOF, paragraph blank/heading/EOF,
  // and malformed emphasis are all deterministic.
  for (const lead of ['**Out of scope:**', '**Out-of-scope**:']) {
    const analysis = fixtureAnalysis(`${lead}\n\n- first\n  wrapped\n- second\n\nNext paragraph.`);
    assert.equal(analysis.irregular.length, 1);
    assert(analysis.irregular[0].payload.includes('- second'));
    assert(!analysis.irregular[0].payload.includes('Next paragraph.'));
  }
  {
    const analysis = fixtureAnalysis(
      '**Out of scope** Inline prose follows.\ncontinued line\n\nExcluded paragraph.',
    );
    assert.equal(analysis.irregular.length, 1);
    assert(analysis.irregular[0].payload.includes('continued line'));
    assert(!analysis.irregular[0].payload.includes('Excluded paragraph'));
  }
  {
    const analysis = fixtureAnalysis('**Out of scope: unmatched\ncontinued\n\nExcluded');
    assert.equal(analysis.irregular[0].kind, 'malformed legacy bold lead-in');
    assert(analysis.irregular[0].payload.includes('continued'));
  }
  {
    const atHeading = fixtureAnalysis('**Out of scope:**\n- item\n## Stop\nExcluded');
    assert(!atHeading.irregular[0].payload.includes('Stop'));
    const atEof = fixtureAnalysis('**Out of scope:**\n- item\n  wrapped');
    assert(atEof.irregular[0].payload.endsWith('wrapped'));
    const paragraphAtHeading = fixtureAnalysis('**Out of scope** prose\n## Stop');
    assert.equal(paragraphAtHeading.irregular[0].payload, '**Out of scope** prose');
    const paragraphAtEof = fixtureAnalysis('**Out of scope** prose\ncontinued');
    assert(paragraphAtEof.irregular[0].payload.endsWith('continued'));
  }

  // Collision-safe fences round-trip the source payload byte-for-byte.
  {
    const payload = '- text with ``` and ```` inside';
    const fenced = fencedPayload(payload);
    const [opening, ...rest] = fenced.split('\n');
    assert.equal(opening, '`````');
    assert.equal(rest.at(-1), opening);
    assert.equal(rest.slice(0, -1).join('\n'), payload);
  }

  // Rendering is deterministic, source ordered, status-free, and headed by
  // the exact non-authoritative declaration. Check drift is byte-exact.
  {
    const documents = [
      fixtureDocument('0002', '## Out of scope\n\n- future adapter ADR.'),
      fixtureDocument('0001', '## Out of scope\n\n- future schema PR.'),
    ];
    const first = renderIndex(analyzeCorpus(documents));
    const second = renderIndex(analyzeCorpus([...documents].reverse()));
    assert.equal(first, second);
    assert.equal(first.split('\n')[0], '# ADR Deferral Index — Derived and Non-Authoritative');
    assert(first.includes('<!-- doc-pointer-check: provenance-below -->'));
    assert(!first.endsWith('\n\n'));
    assert(!first.includes('status:'));
    assert.equal(checkBytes(first, first), true);
    assert.equal(checkBytes(first, `${first}drift`), false);
    assert.equal(checkBytes(first, null), false);
  }
}

async function runAsyncFixtures() {
  const inspected = [];
  const kinds = new Map([
    ['docs', 'directory'],
    ['docs/link', 'symlink'],
    ['docs/link/outside.md', 'file'],
  ]);
  const inspectPath = async (absolutePath) => {
    const relativePath = path.relative(REPO_ROOT, absolutePath).split(path.sep).join('/');
    inspected.push(relativePath);
    const kind = kinds.get(relativePath);
    assert.notEqual(kind, undefined, `unexpected fixture path: ${relativePath}`);
    return {
      isDirectory: () => kind === 'directory',
      isFile: () => kind === 'file',
      isSymbolicLink: () => kind === 'symlink',
    };
  };
  assert.equal(await repositoryFileKind('docs/link/outside.md', inspectPath), 'other');
  assert.deepEqual(inspected, ['docs', 'docs/link']);
}

async function main() {
  runFixtures();
  await runAsyncFixtures();
  const mode = parseMode(process.argv.slice(2));
  const rendered = await renderRepositoryIndex();

  if (mode === '--write') {
    await atomicWrite(OUTPUT_PATH, rendered);
    process.stdout.write(`✓ wrote ${OUTPUT_PATH} (embedded fixtures passed)\n`);
    return;
  }

  let current = null;
  try {
    current = await readFile(path.join(REPO_ROOT, OUTPUT_PATH), 'utf8');
  } catch (error) {
    if (error === null || typeof error !== 'object' || error.code !== 'ENOENT') {
      throw error;
    }
  }
  if (!checkBytes(rendered, current)) {
    throw new Error(`${OUTPUT_PATH} is absent or stale; regenerate with: ${REGENERATE_COMMAND}`);
  }
  process.stdout.write(`✓ ${OUTPUT_PATH} is current (embedded fixtures passed)\n`);
}

main().catch((error) => {
  const detail = error instanceof Error ? (error.stack ?? error.message) : String(error);
  process.stderr.write(`✗ adr-deferral-index: ${detail}\n`);
  process.exitCode = 1;
});
