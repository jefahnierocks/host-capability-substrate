import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { policyRuleTierSchema } from '@hcs/schemas';
import { afterAll, describe, expect, it } from 'vitest';
import { LOADER_CHECKPOINTS, loadPolicyRules } from '../src/policy/rule-loader.ts';

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));
const realSnapshot = join(repoRoot, 'policies/generated-snapshot/tiers.yaml');
const body = () => readFileSync(realSnapshot, 'utf8');

const dirs: string[] = [];
afterAll(() => {
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
});

/** Stage a mutated snapshot under $TMPDIR. Never mutates the repo. */
function stage(snapshotBody: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'hcs-rules-'));
  dirs.push(dir);
  const p = join(dir, 'tiers.yaml');
  writeFileSync(p, snapshotBody);
  return p;
}

function load(snapshotBody?: string) {
  return loadPolicyRules({
    snapshotPath: snapshotBody === undefined ? realSnapshot : stage(snapshotBody),
  });
}

/**
 * Apply a mutation ONLY inside `operation_class_defaults:`.
 *
 * Live policy declares approval posture in THREE places — `tiers.<tier>`,
 * `operation_class_defaults.<class>`, and that class's
 * `approval_required_details.status`. An unscoped regex hits `tiers:` first
 * (line ~220) and corrupts a block the loader does not read, so the test
 * passes for the wrong reason.
 */
function mutateDefaults(pattern: RegExp, replacement: string): string {
  const src = body();
  const marker = '\noperation_class_defaults:';
  const at = src.indexOf(marker);
  if (at < 0) throw new Error('operation_class_defaults not found');
  const head = src.slice(0, at);
  const tail = src.slice(at);
  const mutated = tail.replace(pattern, replacement);
  if (mutated === tail) throw new Error(`mutation did not apply: ${pattern}`);
  return head + mutated;
}

function rejectedAt(r: ReturnType<typeof loadPolicyRules>) {
  return r.ok ? 'ok' : r.rejectedAt;
}

describe('happy path — every value is read from a declared field', () => {
  it('loads all eight operation classes from the real snapshot', () => {
    const r = load();
    if (!r.ok) throw new Error(`expected success: ${r.reason}`);
    expect(r.rules).toHaveLength(8);
  });

  it('reads approval posture from BOTH forms policy uses', () => {
    const r = load();
    if (!r.ok) throw new Error(r.reason);
    const by = Object.fromEntries(r.rules.map((x) => [x.operation_class, x]));
    // Declared via `approval_required: false`
    expect(by.read_only_diagnostic?.approval.approval_required).toBe(false);
    // Declared via `approval_required_details.status: required`
    expect(by.merge_or_push?.approval.approval_required).toBe(true);
  });

  it('reads real ceilings from the tiers block instead of authoring not_applicable', () => {
    const r = load();
    if (!r.ok) throw new Error(r.reason);
    const by = Object.fromEntries(r.rules.map((x) => [x.operation_class, x]));
    expect(by.worktree_mutation?.valid_until_ceiling).toBe('PT24H');
    expect(by.destructive_git?.valid_until_ceiling).toBe('PT1H');
    expect(by.read_only_diagnostic?.valid_until_ceiling).toBe('not_applicable');
  });
});

/**
 * THE FAIL-CLOSED CLASS.
 *
 * Five independent sites in this repo shared one rule — absence projects to
 * permission: boundary-check rc=2 read as pass, no-live-secrets' malformed
 * pattern read as clean, the justfile's missing toolchain read as exit 0, the
 * Phase-0b hook's missing deny path read as allow, and this loader's earlier
 * draft reading a null approval block as `approval_required: false`.
 *
 * Every case below feeds the null / absent / empty / wrong-type variant of a
 * security-relevant field and asserts it REJECTS. This is the class, not the
 * instance.
 */
describe('fail-closed: absence and malformation never project to permission', () => {
  it('rejects a NULL approval_required_details — the withdrawn draft returned ok:true here', () => {
    // `approval_required_details:` with no value parses to null. The old code
    // read that as "absent" and projected approval_required: false on a
    // write-destructive class.
    const mutated = mutateDefaults(
      /^ {4}approval_required_details:$/m,
      '    approval_required_details: null\n    _orig:',
    );
    expect(rejectedAt(load(mutated))).toBe('rule_projection');
  });

  it.each([
    ['a string', '    approval_required_details: "required"\n    _orig:'],
    ['an array', '    approval_required_details: []\n    _orig:'],
    ['a boolean', '    approval_required_details: true\n    _orig:'],
  ])('rejects approval_required_details declared as %s', (_label, replacement) => {
    const mutated = mutateDefaults(/^ {4}approval_required_details:$/m, replacement);
    expect(rejectedAt(load(mutated))).toBe('rule_projection');
  });

  it('rejects when policy declares NEITHER approval_required NOR a details status', () => {
    // Strip the status line from the first approval block; approval_required is
    // already absent on those classes. Policy then says nothing at all.
    // `status:` sits at indent 6, nested under approval_required_details.
    const mutated = mutateDefaults(/^ {6}status: required$/m, '      _removed: required');
    expect(rejectedAt(load(mutated))).toBe('rule_projection');
  });

  it('rejects a boolean-like STRING for approval_required', () => {
    const mutated = mutateDefaults(
      /^ {4}approval_required: false$/m,
      '    approval_required: "false"',
    );
    expect(rejectedAt(load(mutated))).toBe('rule_projection');
  });

  it.each([
    'requires_active_lease',
    'requires_deletion_authority',
  ])('rejects a boolean-like STRING for %s', (field) => {
    const mutated = mutateDefaults(new RegExp(`^ {4}${field}: true$`, 'm'), `    ${field}: "true"`);
    expect(rejectedAt(load(mutated))).toBe('rule_projection');
  });

  it('rejects a null required_pre_execution_evidence rather than clearing the inv-16 flag', () => {
    const mutated = mutateDefaults(
      /^ {4}required_pre_execution_evidence:$/m,
      '    required_pre_execution_evidence: null\n    _orig:',
    );
    expect(rejectedAt(load(mutated))).toBe('rule_projection');
  });

  it('rejects an EMPTY operation_class_defaults rather than returning ok with zero rules', () => {
    const mutated = body().replace(
      /^operation_class_defaults:$/m,
      'operation_class_defaults: {}\n_orig_operation_class_defaults:',
    );
    const r = load(mutated);
    expect(r.ok).toBe(false);
    expect(r).not.toHaveProperty('rules');
  });

  it('rejects a snapshot that DROPS an operation class — coverage is checked both ways', () => {
    const mutated = mutateDefaults(/^ {2}destructive_git:$/m, '  _removed_destructive_git:');
    const r = load(mutated);
    expect(rejectedAt(r)).toBe('rule_projection');
    if (!r.ok) expect(r.reason).toContain('destructive_git');
  });
});

describe('checkpoint ordering is observable', () => {
  it('declares checkpoints in execution order', () => {
    expect([...LOADER_CHECKPOINTS]).toEqual(['parse', 'schema_refs', 'rule_projection']);
  });

  it('rejects unparseable YAML at parse', () => {
    expect(rejectedAt(load('this: [is: not: valid'))).toBe('parse');
  });

  it('rejects duplicate keys at parse rather than silently taking the last', () => {
    expect(rejectedAt(load('a: 1\na: 2\n'))).toBe('parse');
  });

  it('reaches schema_refs only once parse succeeds', () => {
    expect(rejectedAt(load('kind: something\n'))).toBe('schema_refs');
  });
});

describe('error hygiene — reasons classify, never echo content', () => {
  it('does not leak snapshot content or absolute paths into the reason', () => {
    const marker = 'op://vault/item/field';
    const r = load(`this: [is: not: valid ${marker}`);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).not.toContain(marker);
    expect(r.reason).not.toContain('/Users/');
    expect(r.reason).not.toContain(tmpdir());
  });

  it('classifies a missing file without echoing its path', () => {
    const r = loadPolicyRules({ snapshotPath: '/nonexistent/hcs/definitely-not-here.yaml' });
    expect(rejectedAt(r)).toBe('parse');
    if (!r.ok) {
      expect(r.reason).toContain('ENOENT');
      expect(r.reason).not.toContain('/nonexistent');
    }
  });
});

/**
 * inv. 1 — the loader must not author policy.
 *
 * The withdrawn draft's version of this guard hardcoded four strings, two of
 * which (`read-only`, `write-scoped`) are not tiers in this system, and missed
 * three that are. It would have passed a loader hardcoding `tier: 'read-safe'`.
 * Deriving the list from the enum makes it impossible for the guard to drift
 * from the vocabulary it guards.
 */
describe('inv. 1 — no policy vocabulary authored in kernel source', () => {
  // Strip comments before scanning. The module's design prose legitimately
  // names tiers when explaining WHY a value is read rather than authored; the
  // guard's subject is executable code, where a tier literal would mean the
  // kernel had taken a classification decision.
  const source = readFileSync(
    fileURLToPath(new URL('../src/policy/rule-loader.ts', import.meta.url)),
    'utf8',
  )
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  it('guards every tier the enum declares, derived not hand-written', () => {
    expect(policyRuleTierSchema.options).toHaveLength(5);
    for (const tier of policyRuleTierSchema.options) {
      expect(source).not.toContain(`'${tier}'`);
      expect(source).not.toContain(`"${tier}"`);
      expect(source).not.toContain(`\`${tier}\``);
    }
  });

  it('encodes no tier-to-approval mapping', () => {
    // The loader may name `approval_required` as a FIELD it reads; it must not
    // pair a tier name with an approval verdict.
    for (const tier of policyRuleTierSchema.options) {
      expect(source).not.toContain(tier);
    }
  });
});
