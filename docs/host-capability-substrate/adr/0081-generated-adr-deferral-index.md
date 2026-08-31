---
adr_number: 0081
title: Generated ADR deferral index
status: accepted
version: v1
date: 2026-08-30
charter_version: 1.6.0
tags: [docs, adr, deferral-index, generated-artifact, ci, class-j]
---

# ADR 0081: Generated ADR deferral index

## Status

`accepted`

Implementation-bearing. Per D-085's successor rule, this ADR opens only for
the named Class-J PR that adds the generator, its generated document, its
`just` recipe, and verify wiring. It lands with that implementation rather
than ahead of it.

## Date

2026-08-30

## Charter version

Written against charter v1.6.0.

## Context

The ADR corpus records obligations that one decision deliberately leaves to a
successor. Those deferrals are distributed across dozens of files and use more
than one prose form. A human can reconstruct the graph by reading every ADR,
but the result is immediately vulnerable to the next merge: source line spans
move, successor files appear, and a new irregular heading can escape the
manual inventory.

The index is a lookup aid, not decision authority. An out-of-scope statement
cannot authorize its successor, an ADR mention is not proof that the mentioned
ADR accepts the work, and a generated existence result says only whether a
file is present. The accepted status drift in ADRs 0079 and 0080 was repaired
by PR #103 (`main` at `25dc060`), so frontmatter status is again internally
consistent at this decision point. The generator nevertheless must not read
frontmatter status as implementation authorization; status is neither an
extraction predicate nor a successor-resolution input.

The corpus has one regular form suitable for deterministic extraction:
Markdown headings whose text is exactly `Out of scope`. Other forms — for
example `Deferred follow-on candidates`, `Cross-scope follow-ups`, qualified
headings such as `Out of scope for this ADR`, and legacy bold
`Out-of-scope for v1` lead-ins — are semantically suggestive but structurally
different. Treating them as equivalent would make a heuristic rewrite of the
source, so they require a separate review queue.

This is change class J: it adds a merge-blocking documentation-drift check
under `scripts/ci/`, a `justfile` recipe, and `scripts/ci/verify.sh` wiring.
Charter v1.6.0 therefore requires `hcs-architect` objections before human
review. It does not change an invariant-enforcing security gate, operation
classification, policy, or ontology, so no additional reviewer mandate is
triggered by the declared scope.

## Options considered

### Option A: deterministic exact-source index plus an irregular-form review queue

Generate a tracked Markdown lookup from exact `Out of scope` sections. Preserve
source text and line spans, resolve only explicit file-addressable locators,
and quote irregular forms separately without interpreting them.

**Pros:**

- Deterministic output can be byte-compared in CI.
- Every generated claim links back to exact source text and a 1-based inclusive
  line span.
- The regular index and the human-review queue make parser confidence visible
  instead of silently normalizing prose.
- File existence is mechanically answerable without claiming that the file
  authorizes or implements the obligation.

**Cons:**

- The index is intentionally incomplete for prose outside the recognized and
  review-candidate forms.
- Lexical successor detection can produce candidates that still require a
  human to read the quoted entry.
- Any new irregular form requires an explicit parser/fixture update before it
  becomes regular input.

### Option B: semantic extraction across all ADR prose

Use broad heuristics or a model to infer deferrals, successor identity, and
implementation status from any section.

**Pros:**

- Higher apparent coverage over the current corpus.
- Could group differently worded obligations under inferred successor names.

**Cons:**

- Non-deterministic or heuristic meaning cannot be a merge-blocking CI input.
- Title similarity can invent successor edges that no ADR states.
- Inferring authorization from status, proximity, or prose repeats the
  citation-discipline failure recorded by D-085 and D-086.

### Option C: maintain the deferral index by hand

Commit a curated document and update it during ADR review.

**Pros:**

- A human can interpret ambiguous prose and omit false candidates.
- No parser implementation is required.

**Cons:**

- It recreates the maintenance problem: line spans and existence results drift
  after unrelated ADR changes.
- CI cannot distinguish a deliberately curated omission from forgotten work.
- The next session must trust or re-derive a hand-maintained graph.

### Option D: add structured successor metadata to ADR frontmatter

Define a new frontmatter field or schema and backfill every ADR.

**Pros:**

- Successor types and resolution rules could become fully machine-readable.
- New ADRs could declare deferrals without prose heuristics.

**Cons:**

- Expands this Class-J documentation check into a corpus-wide metadata or
  schema migration.
- Backfilling historical prose still requires human semantic decisions.
- Creates a second representation whose consistency with the quoted
  out-of-scope text would itself need enforcement.

## Decision

Choose Option A. Add a dependency-free generator at
`scripts/ci/adr-deferral-index.js` and track its output at
`docs/host-capability-substrate/adr-deferral-index.md`.

Use a `.js` ES module because `package.json` already declares `type: module`,
Node is a pinned required toolchain, and the existing formatter/linter includes
`.js` but not `.mjs`. This needs neither a package dependency, formatter-scope
expansion, nor a TypeScript compilation exception.

### Source and section recognition

The generator:

1. Enumerates repository files matching
   `docs/host-capability-substrate/adr/[0-9][0-9][0-9][0-9]-*.md`, sorted by
   filename, excluding `0000-template.md`.
2. Derives the ADR number from the unique four-digit filename prefix. It does
   not consult frontmatter status, ledger state, or title similarity.
3. Recognizes a regular block only when an unfenced Markdown H2 or H3 is
   exactly `## Out of scope` or `### Out of scope`, allowing trailing
   horizontal whitespace only. The block ends at the next unfenced heading of
   equal or higher level. H4 through H6 variants are irregular review input,
   not an automatic expansion of the regular grammar.
4. Treats each top-level list item as one entry, including its wrapped lines,
   blank lines, and nested list. When a recognized block has no top-level list,
   each complete non-list paragraph is one entry; semicolon-delimited clauses
   are not split or rewritten.
5. Preserves a recoverable exact source payload and records its 1-based
   inclusive source span. The payload is the UTF-8 bytes from the first source
   line through the final line's content, with original LF separators and no
   synthetic trailing LF. It is placed inside a deterministic collision-safe
   Markdown fence: backticks, at least three, one longer than the longest
   backtick run in the payload. The payload itself is not prefixed, escaped,
   reflowed, normalized, or summarized; an embedded fixture extracts it and
   asserts byte equality.
6. Fails closed on malformed input it cannot represent deterministically,
   including duplicate regular `Out of scope` blocks in one ADR or an
   ambiguous duplicate ADR-number filename.

### Successor candidates and resolution

ADR numbers, Q/D rows, class letters, paths, and descriptive nouns are
resolution types, not admission predicates. A bare token never creates an
edge. An entry appears in the regular deferral index only when the closed
grammar below captures an obligation-to-successor relation. Matching uses a
shadow view that folds runs of horizontal/vertical whitespace between lexical
words; the displayed payload and span remain the untouched source.

The closed relationship forms are:

1. A successor target immediately following one of these exact case-insensitive
   introducers: `queued as`, `continues under`, `remains under`, `reserved for`,
   `deferred to`, `defers to`, `belong to`, `belongs to`, `lands in`, `land in`,
   `lands with`, `land with`, `lands together with`, `land together with`,
   `lands together as`, `land together as`, `follows as`, or `follow as`.
   `subsumed into` is also a direct introducer.
2. A successor target followed by the exact owner verb `owns`.
3. An explicit target at the start of an entry, after the list marker and
   optional Markdown emphasis, followed by zero through six bounded descriptor
   tokens and then `:`, `—`, `-`, `(`, `.`, or the end of the entry. The target
   is captured; its following descriptor is only a label. A token preceded by
   prose such as `Edits to ADR` is not entry-initial and does not match.
4. A marked descriptive noun phrase: an optional word from the closed set
   `a`, `an`, `the`, `its`, `their`, `this`, or `that`, then
   one of `future`, `follow-up`, `follow-on`, `separate`, `own`, `later`, or
   `coordinated`, then zero through six bounded name tokens, then one of the
   exact heads `ADR`, `ADRs`, `PR`, `PRs`, `Q-row`, `Q-rows`, `sub-decision`,
   `ADR cycle`, `ontology review`, `policy slice`, `change-set`, `change-sets`,
   `service`, `lane`, `implementation lane`, `implementation PR`, or `task`.
5. One of these context-free fixed lane heads, optionally followed immediately
   by one exact ASCII type suffix from `PR`, `PRs`, `ADR`, or `ADRs`:
   `Schema implementation`, `Schema PR`, `Schema PRs`, `the schema PR`,
   `Registry update PR`, `Canonical policy at Milestone N`,
   `tiers.yaml once HCS Milestone N ships`, `HCS Milestone N`,
   `Ring 0 implementation`, `Ring 1 implementation`, `Ring 2 implementation`,
   or `Ring 3 implementation`.

`Phase N` is a fixed target only when immediately bound by a direct introducer
or the `owns` relation. A bare phase mention is an ambiguity cue, not a
successor. This prevents a statement of current posture such as
`Phase 1 is one-to-one` from becoming a false edge.

A bounded name or descriptor token is either one Markdown code span or one
`[A-Za-z0-9][A-Za-z0-9_.-]*` token; the cardinality bounds above count each
code span as one token. All relationship, descriptor, head, determiner, and
boundary-word comparisons use ASCII case-insensitive matching while preserving
the source literal. A descriptive capture cannot cross `.`, `;`, `:`, `(`,
`)`, or the words `that`, `per`, `if`, `when`, `after`, `before`, `once`,
`and`, or `or`. The exact composite descriptors
`ADR NNNN follow-up`, `ADR NNNN's schema PR`,
`the gateway ADR that ADR NNNN defers to`,
`the wave-N ADR`, and `audit-events/storage ADR` are captured whole and take
precedence over an inner ADR-number token.

A successful composite consumes every target, introducer, and ambiguity cue
whose span is wholly inside the composite, emits exactly one descriptive target
using the complete source literal, and cannot trigger ambiguity from its
consumed interior. The backward-gateway fixture asserts that ADR NNNN is not
separately emitted and `defers to` is not reconsidered as a forward relation.

A direct introducer's successor region ends at the first prohibited boundary.
It may contain more than one explicit target separated by `+`; each is emitted
against the same source entry. `and` or `or` makes the whole entry ambiguous
rather than being treated as a list separator.

Captured targets are then classified:

- `ADR NNNN`: resolve the four-digit number against the enumerated ADR files.
  Report `yes` for exactly one match and `no` for none; more than one match is
  an extraction error.
- A literal repository-relative path is one inline-code token whose optional
  terminal locator is `:N` or `:N-N` and whose remaining path is either a named
  root file or slash-separated components matching `[A-Za-z0-9._@-]+` beneath
  one of `.agents`, `.claude`, `.codex`, `.github`, `docs`, `packages`,
  `policies`, or `scripts`. The named root files are `AGENTS.md`, `CLAUDE.md`,
  `DECISIONS.md`, `IMPLEMENT.md`, `PLAN.md`, `README.md`, `justfile`,
  `package.json`, `tsconfig.json`, `biome.json`, and `.mise.toml`. Strip the
  terminal locator only for the existence check. Report `yes` for a repository
  regular file and `no` for an absent path, directory, symbolic link, or other
  non-regular filesystem object under an admitted root. Inspect every path
  component without following symbolic links; a symbolic link in any ancestor
  or the final component reports `no`. A token with an empty, `.`, or `..`
  component, leading `/` or `~`, URI scheme, backslash, NUL, or a non-admitted
  first component is invalid: it emits no path result and routes a
  deferral-cued entry to ambiguous review.
- `Q-NNN`, `D-NNN`, and `class A` through `class J`: preserve the literal and
  report `not-file-addressable`.
- A captured descriptive phrase or fixed lane head: preserve it and report
  `not-file-addressable`.

The fixed-lane suffix is not an arbitrary bounded token; punctuation, code
spans, and every other word remain outside the capture. Capture precedence is:
composite descriptor, relationship-bound or entry-head explicit token, marked
descriptor, then fixed lane head. Within one tier use
leftmost-longest matching. Lower-priority overlaps are suppressed. Distinct
occurrences remain in source order, including repeated equal text; they are not
deduplicated. Multiple non-overlapping captures share the same exact entry and
span.

Route the entire regular entry to a separate
`Review required: ambiguous regular entries` section, with no resolved edge,
when any of these conditions holds:

- two captures overlap without the declared precedence resolving them;
- a candidate-shaped token or deferral cue is present but no closed relation
  binds it, or a candidate or cue remains unbound beside an otherwise valid
  capture;
- a relation crosses `and` or `or` and therefore may express alternatives;
- the entry contains multiple nested obligation-to-successor mappings that
  cannot share one unambiguous binding; or
- the recognized block is paragraph-form rather than top-level-list form.

Deferral cues for that review routing are the case-insensitive words or phrases
`defer`, `deferred`, `defers`, `future`, `follow-up`, `follow-on`, `separate`,
`own`, `queued`, `reserved`, `land`, `lands`, `follow`, `follows`,
`continues under`, `remains under`, `owns`, `belong to`, `belongs to`,
`Q-row`, `Milestone`, `Phase`, and a bare explicit target shape. A cue is bound
only when its span is inside a candidate capture or that candidate's declared
relationship span; a lower-priority overlapping candidate is still consumed
by the stated precedence rule. A regular entry with neither a captured
relation nor a review cue is omitted.

The generator never searches ADR titles for a similar phrase and never maps a
descriptive successor to an existing file by judgment. `yes` and `no` mean
only file existence; neither value means accepted, authorized, implemented,
current, or complete.

### Irregular-form review queue

The generated document has a separate `Review required: irregular forms`
section. It preserves exact fenced payloads and source spans for candidate
blocks that are not regular input.

- unfenced headings that begin `Out of scope` or `Out-of-scope`, excluding the
  exact regular H2/H3 forms;
- headings beginning `Deferred follow-on` or `Cross-scope follow-up`;
- the current `Non-charter changes deferred` and
  `Cross-record commitments deferred` heading families; and
- legacy bold lead-ins beginning `Out of scope` or `Out-of-scope`.

For an irregular heading, the span starts at the heading and ends immediately
before the next unfenced heading of equal or higher level. For a legacy bold
lead-in, the span starts at the line whose first non-whitespace bytes are the
recognized bold phrase. Parse its matching closing `**`; the lead-in is a list
introducer only when no non-whitespace source follows that delimiter except an
optional `:`, and either the final non-whitespace byte inside the emphasis is
`:` (`:**`) or the first non-whitespace byte after it is `:` (`**:`). A
list-introducing lead-in includes the immediately following top-level list,
including nested, wrapped, and blank lines, and ends before the next heading or
non-list paragraph. Every other bold lead-in is one paragraph and ends at its
blank-line boundary, immediately before the next heading, or at EOF, whichever
comes first. A list continuing to a heading or EOF ends at that same boundary.
If the paragraph has no matching closing `**`, preserve it through the same
paragraph boundary as `malformed legacy bold lead-in`; do not infer list
attachment and do not fail the entire index. Fixtures cover both colon
placements, inline prose after the delimiter, blank/heading/EOF boundaries,
unmatched emphasis, and both termination branches.

The review queue does not split entries, extract successors, or report file
existence. It also does not admit arbitrary follow-up headings: `Follow-up
regression coverage`, `Follow-up test obligations`, and any other heading that
does not match the closed prefixes above remain excluded. The queue's purpose
is to make the specified unparsed candidates visible without letting them
acquire the semantics of the regular index.

### Output and modes

The generated Markdown's exact first line is:

`# ADR Deferral Index — Derived and Non-Authoritative`

The following notice states that quoted ADR text remains the source and that
the index grants no implementation authorization. The file is deterministic.
Every source filename and tie-break string is ordered by locale-independent
UTF-16 code-unit comparison; no ambient locale or collation input is consulted.
No generation timestamp, host path, branch name, frontmatter status, or other
ambient state appears in the bytes.

Immediately after the notice, emit the existing
`doc-pointer-check: provenance-below` marker. Every later authority-version
string is exact quoted ADR provenance, not a live pointer authored by the
derived document. This uses the pointer checker's established provenance
classification; it does not change the checker or its authority-document
carve-out.

The script accepts exactly one mode:

- `--write` renders in memory and atomically replaces the tracked output.
- `--check` renders in memory, byte-compares it with the tracked output, and
  exits nonzero with a regeneration instruction on absence or drift. It never
  writes.

Embedded in-memory fixtures run before either real mode. They cover exact H2/H3
recognition; H4-H6 and qualified-heading review routing; fenced fake headings
and list markers; regular and every irregular block-termination form;
wrapped/nested lists; direct regular, ambiguous, and irregular inclusive-span
assertions;
paragraph and blank-separated entries; the negative option-title case;
exclusion of arbitrary follow-up headings; every relationship, descriptor,
precedence, ambiguity, ordering, and occurrence-preservation rule; ASCII case
folding; every determiner and bounded-token limit; lowercase fixed lanes; the
entry-head descriptor positive case and `Edits to ADR` negative case; forward
`defers to` and the backward gateway composite; ADR and admitted-root path
`yes`/`no` including directory, final-symlink, and intermediate-symlink results;
owner-form invalid-path rejection; entry-head descriptors
terminated by `:`, `—`, `-`, `(`, `.`, and end-of-entry; every
`not-file-addressable` family; multiple successors on one entry; exact-payload
fence collision/round-trip;
locale-independent deterministic ordering; the provenance marker;
straight-versus-curly-apostrophe
composite handling; relation-only `Phase N` suffix rejection;
frontmatter-status non-effect; duplicate regular-block rejection; duplicate
ADR-number filename rejection;
absolute/home-relative/URL/sibling/path-
traversal rejection; zero/multiple/unknown mode rejection; and `--check` byte
drift.

Add `just adr-deferral-index-check` beside the other document checks and add
that recipe to the `static-gates` group in `scripts/ci/verify.sh`. The verify
lane invokes only `--check`; `--write` remains an explicit developer action.

### Registry-to-charter pointer carve-out

Do not add a registry-to-charter pointer check and do not broaden
`doc-pointer-check.sh`. That script deliberately excludes the charter,
ontology, and ontology registry because their changelogs and citation examples
carry historical versions under their own change ceremonies.

The registry's `## Change log` heading is a deterministic boundary, but it is
not a sufficient classifier: historical version-origin citations also occur
throughout the live pre-changelog body, using the same `charter vX.Y.Z`
syntax as the citation at ontology-registry line 1153. Without a new explicit
machine-readable current-versus-historical annotation contract, automation
cannot distinguish stale normative text from point-in-time provenance. Adding
that contract would change a self-governed authority document's ceremony and
is outside this decision. The existing carve-out therefore remains intact.

## Out of scope

This ADR does not authorize:

- Any implementation-authority conclusion, successor-title inference, or
  claim that a successor file implements the quoted obligation.
- Parsing `Future amendments`, `Consequences`, `References`, decision-ledger
  prose, or arbitrary mentions of future work as regular deferral entries.
- A new schema, ADR-frontmatter field, ontology entity, policy rule, kernel
  service, adapter, capability, runtime state, or network access.
- Editing source ADR prose to make extraction easier; the index adapts to the
  corpus without rewriting its authority sources.
- Changing the self-governed authority-document exclusion in the pointer
  checker, editing the ontology-registry citation at line 1153, or adding a
  registry-to-charter check.
- Treating a clean generated index as proof that the corpus contains no other
  deferral forms.

## Consequences

### Accepts

- Reviewers gain a deterministic, source-linked map of regular ADR deferrals
  and a visible queue of irregular candidates.
- Any source edit that moves a quoted entry or changes successor-file existence
  makes `--check` fail until the tracked derivative is regenerated.
- Exact source payloads can contain punctuation, nested lists, fences, and
  wrapped text, so the output uses collision-safe per-entry fenced blocks
  rather than a Markdown table that would require escaping or reflow.
- The generated document and its gate become Class-J maintained surfaces.

### Rejects

- No semantic inference, title matching, or frontmatter-status authorization.
- No silent normalization of legacy forms into the regular index.
- No registry-to-charter pointer gate under the existing ambiguous source
  syntax.
- No manually maintained deferral graph and no new metadata schema.

### Future amendments

- A future ADR may define structured successor metadata if repeated review of
  the irregular queue establishes a stable vocabulary and funds a corpus-wide
  backfill.
- A self-governed authority document may separately adopt explicit provenance
  annotations; only then could a narrow internal pointer check distinguish
  historical from current citations without guessing.
- A newly observed irregular deferral form may extend the review-candidate
  allowlist and embedded fixtures in the implementation-bearing PR that needs
  it.

## References

### Internal

- Implementation charter v1.6.0 — §Authoring rules (Class-J architect
  objections) and §Package boundary enforcement.
- `IMPLEMENT.md` — §Per-PR checklist citation discipline, §Change classes J,
  and §Required subagent reviews.
- `DECISIONS.md` D-085 — implementation-bearing successor ADRs land with the
  named PR; D-086/D-087 — ADR 0079/0080 predecessor/successor precedent.
- ADR 0073 / D-073 — enforcement-tooling authoring and reviewer mandate.
- ADR 0079 §Status and §Out of scope — successor timing and the rule that an
  excluded implementation is not authorized by being mentioned.
- ADR 0080 §Context and §Options considered — a consumer requires its own
  authorizing ADR.
- `scripts/ci/doc-pointer-check.sh` — self-governed authority-document
  exclusion and embedded-self-test precedent.
- Research plan §18 (regression corpus), §22.5 (producer/critic loop), §22.11
  (implementation sequence), and Appendix M (ADR index).

### External

- None. This is a repository-local derived-document and CI contract.

## Revision history

- 2026-08-30: Initial implementation-bearing proposal; no generator or CI
  wiring exists until the required Class-J architect objections are received.
- 2026-08-30: Accepted with its implementation after three design-objection
  rounds and two implementation-objection rounds were folded; the final
  architect re-review returned no blocking or non-blocking objections.
- 2026-08-30: Follow-on rendering amendment adds a file-addressable successor
  summary and a separate review-only exact-`gateway`-token rollup. The summary
  aggregates only canonical ADR numbers and admitted repository paths, counts
  each deferring ADR once, and excludes descriptive successors. The rollup
  projects source spans from already parsed regular-block entries without
  changing successor captures, ambiguity routing, resolution, or edge meaning.
  The pre-implementation Class-J architect review returned no blockers and
  confirmed both additions are rendering-only under this decision.
