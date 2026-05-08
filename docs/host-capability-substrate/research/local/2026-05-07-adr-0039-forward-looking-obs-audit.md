---
title: ADR 0039 forward-looking observations absorption audit
category: research
component: host_capability_substrate
status: planning-input
version: 0.1.0
last_updated: 2026-05-07
tags: [adr-0039, charter-v1-4-0, invariant-18, invariant-19, forward-looking-observations, audit, phase-2-1, phase-2-2, phase-2-5, phase-2-6, registry, ontology-registry]
priority: medium
---

# ADR 0039 Forward-Looking Observations Absorption Audit

## Status

Docs-only audit. ADR 0039 (charter v1.4.0 amendment, accepted 2026-05-04)
deferred 13 forward-looking observations from the v2 reviewer pass "for
absorption at downstream PRs." This audit walks each observation against
landed Phase 2.x work to identify which were absorbed, which are
appropriately deferred, and which remain owed.

This document does not author the absorptions; the receiving PRs cite
ADR 0039 §Forward-looking observations by reference. The audit produces a
per-observation disposition.

## Methodology

ADR 0039 §Forward-looking observations groups the 13 items by their
expected receiving surface (Phase 2.1.x / 2.1.4 / 2.2.3 / 2.5 / 2.6 /
wave-2 reactive amendment / future glossary cleanup / already-documented).
For each item the audit checks:

- Which receiving PR has landed since 2026-05-04 ADR 0039 acceptance
- Whether the receiving PR (or another landed surface) absorbed the
  observation
- Whether the absorption matches the observation text or whether a gap
  remains

Disposition buckets:

- **Closed** — observation absorbed at acceptance or in a landed PR; no
  further action.
- **Effectively handled** — observation's underlying concern is addressed
  by a different landed surface even though the literal recommendation
  was not followed.
- **Owed** — observation's receiving PR has landed but the observation
  was not absorbed; small follow-up doc edit or registry update remains.
- **Deferred** — observation's receiving PR has not yet landed (or
  wave-2 has not been triggered); will be honored when that PR is
  drafted; no current action.

## Per-observation disposition

### Phase 2.1.x schema PR group

#### 1. Arch-N10 / Pol-N1 / Ont-N8 — DerivedSummary 4-class `derived_from` alignment

**Disposition:** Owed.

The observation: ADR 0019 v3 §DerivedSummary domain shape (lines 611-613)
lists `derived_from` membership as three classes
(`Evidence` / `CoordinationFact` / `KnowledgeChunk`) but the chain-promotion
rule (line 645) implies four classes (also `DerivedSummary`). Charter v1.4.0
inv. 18 commits the four-class membership.

The recommendation: tighten ADR 0019 v3 lines 611-613 to align with the
four-class committed list, or record the alignment in `DECISIONS.md` as a
Q-row resolution.

Landed state:

- ADR 0019 v3 lines 611-613 still read
  `Evidence` / `CoordinationFact` / `KnowledgeChunk` (three classes).
- Phase 2.1.3 schema landed `DerivedSummary.derived_from.source_record_kind`
  with four classes (`evidence`, `coordination_fact`, `derived_summary`,
  `knowledge_chunk`) — see ontology-registry.md §Knowledge and coordination
  enum mirrors.
- Charter v1.4.0 inv. 18 records the four-class membership as charter-
  committed semantics.
- No DECISIONS.md row aligns ADR 0019 v3 line 611-613 with the four-class
  schema and charter posture.

Owed: a small ADR 0019 v3 text edit (preferred) or a DECISIONS.md
alignment-only entry. Tightening the ADR keeps a single source of truth
for the domain shape.

### Phase 2.1.4 QualityGate Zod refinement PR group

#### 2. Arch-N12 — Phase 2.1.4 PR description note about `self-asserted` chain-walk inertness

**Disposition:** Effectively handled.

The observation: Phase 2.1.4 PR description should explicitly note that
the inv. 18 `self-asserted` chain-walk rejection clause is operationally
inert until the `evidenceAuthoritySchema` enum extension PR lands.

Landed state:

- Phase 2.1.4 commit `6a3c07c feat(schemas): land quality gate entity` is
  subject-only with no body or extended PR description.
- ontology-registry.md §`self-asserted` authority class is explicitly
  titled "(new; schema landing pending)" — the registry section itself
  records the inertness state.
- Charter v1.4.0 §Posture commitments (history line 182, v1.4.0 entry)
  records the `self-asserted` authority class as "registry-canonical
  pending `evidenceAuthoritySchema` enum extension PR."

Effectively handled: the registry section title and the charter history
line both document the inertness. A future reader who notices the
chain-walk clause and looks for the enum will find the registry note.
The literal recommendation (commit message / PR description note) was
not followed but the underlying concern is addressed at two
authoritative surfaces. No further action.

### Phase 2.2.3 BoundaryObservation payload bundle PR group

#### 3. Ont-N9 — Registry §Producer-vs-kernel-set extension for the five execution-context binding FKs

**Disposition:** Owed.

The observation: charter inv. 19 declares the five execution-context
binding fields kernel-set; the rule is grounded in ADR 0034 v2
§Authority discipline but not yet enumerated in registry §Producer-vs-
kernel-set. Recommend extending registry §Producer-vs-kernel-set to
enumerate the five FKs in a registry update PR before or alongside the
Phase 2.2.3 schema PR.

The five FKs from charter v1.4.0 invariant 19 text:
`execution_context_id`, `surface_id`, `workspace_id`,
`credential_source_id`, `tool_or_provider_ref`.

Landed state:

- Phase 2.2.3 schema landed (`211bf14 feat(schemas): land boundary
  observation payload bundle`).
- ontology-registry.md §Producer-vs-kernel-set authority fields (line ~348)
  enumerates `detected_by`, `captured_by`, `observed_via`,
  `ExecutionContext.latest_containment_evidence_ref`, and
  `ExecutionContext.kernel_sandbox_kind` plus the `Evidence.producer`
  kernel-trusted producer-class allowlist.
- The five inv. 19 execution-context binding FKs are NOT enumerated in
  §Producer-vs-kernel-set as kernel-set authority fields.

Owed: registry §Producer-vs-kernel-set extension to enumerate the five
inv. 19 FKs as kernel-set on `BoundaryObservation` envelopes (and the
related `Evidence` subtype envelopes that inv. 19 covers). This is a
registry update PR per registry §Adding or removing a dimension. No
schema or charter change — the authority discipline is already
charter-binding via inv. 19.

### Phase 2.5 canonical policy YAML group

#### 4. Pol-N4 — Pre-emptive no-duplication note for Phase 2.5 reviewer

**Disposition:** Deferred (Phase 2.5 has not landed).

The observation: Phase 2.5 canonical policy YAML must NOT re-state inv.
18 / 19 invariant rules; that would be policy duplication outside the
canonical source. Per-`gate_kind` and per-`boundary_dimension` numeric
thresholds belong in policy YAML; the rule shapes belong in the charter.

Landed state: Phase 2.5 canonical policy YAML lives in
`system-config/policies/host-capability-substrate/`, outside this repo
per AGENTS.md scope. No Phase 2.5 PR has landed.

Deferred: the observation will be honored when the Phase 2.5 policy
YAML PR is drafted in `system-config`. Track as a Phase 2.5 reviewer
checklist item.

### Phase 2.6 trap-fixture PR group

#### 5. Arch-N12 / Pol-N2 / Sec-N-v2-2 — `evidenceAuthoritySchema` enum extension before Phase 2.6 trap fixtures

**Disposition:** Active sequencing dependency; not yet violated.

The observation: `evidenceAuthoritySchema` enum extension PR for
`self-asserted` must land before any trap fixture in Phase 2.6
references `self-asserted`. Sequencing dependency to honor; otherwise
fixtures fail at Zod parsing rather than at the chain-walk rejection
layer.

Landed state:

- `evidenceAuthoritySchema` enum extension PR for `self-asserted` has
  NOT landed. Verified by `grep -rn "self-asserted\|self_asserted"
  packages/schemas/src/` returning no schema-source matches.
- Registry §`self-asserted` authority class still titled
  "(new; schema landing pending)".
- Phase 2.6 trap scaffolds for #46–#58 plus #17 / #44 (today) have
  landed. None of the scaffold files reference `Evidence.authority:
  "self-asserted"`. Trap #50 (`agent-client-axis-self-asserted-rejection`)
  references `Decision.reason_kind` and `kernel_agent_client_resolver`
  producer values — distinct from the `Evidence.authority` enum value
  the sequencing rule guards.

Active sequencing dependency: the enum extension PR is genuinely owed
for charter v1.4.0 inv. 18's chain-walk rejection clause to be
schema-operational, but the sequencing rule has not been violated yet.
Future trap fixtures referencing `Evidence.authority: "self-asserted"`
or future schema work asserting the chain-walk clause must wait on the
enum extension PR.

Owed: enum extension PR for `evidenceAuthoritySchema` covering
`self-asserted`. This is a schema-change PR per
`.agents/skills/hcs-schema-change`; it requires
`hcs-ontology-reviewer` objections per IMPLEMENT.md. Independently
useful even before any trap fixture references the value.

### Wave-2 reactive amendment group

#### 6. Sec-N-v2-1 — "Typed-grant minting layer" phrasing alternatives

**Disposition:** Deferred (wave-2 not triggered).

The observation: the phrasing "typed-grant minting layer" reads Layer-
1-leaning; alternative phrasings ("typed-grant lifecycle," "typed-grant
authorization stack," "Ring 1 typed-grant pipeline") may better convey
multi-layer composition. Wave-2 reactive amendment can absorb if
Phase 2.1.4 / 2.2.3 review surfaces the gap.

Landed state: Phase 2.1.4 and Phase 2.2.3 have landed. No post-merge
review has surfaced the phrasing as causing confusion. Wave-2 reactive
amendment has not been triggered.

Deferred: track as wave-2 candidate. Per ADR 0024's `f9e30d4` post-merge
precedent, wave-2 is reactive (post-merge review surfaces gaps), not
pre-scheduled.

#### 7. Sec-N-v2-3 — Inv. 19 surface enumeration vs charter v1.3.2 line 140 surface list

**Disposition:** Deferred (wave-2 not triggered).

The observation: inv. 19 surface enumeration (macOS app, shell,
package-manager, Git/GitHub, MCP) is narrower than charter v1.3.2 line
140 forbidden-pattern entry's surface list (Warp, Zed external agent,
Cursor, Windsurf, JetBrains AI Assistant, GitHub Copilot CLI, launchd
`EnvironmentVariables`). The "or any other surface" + "authority floor,
not a ceiling" idiom resolves textually; wave-2 may align the lists if
reviewers find the disparity confusing.

Landed state: charter v1.4.0 inv. 19 retains the narrower surface
enumeration with the "authority floor, not a ceiling" idiom. No reviewer
has surfaced the disparity as causing confusion in practice.

Deferred: wave-2 candidate. Aligning the lists is purely editorial.

#### 8. Ont-N10 — "Primary target reference" vs "at least one" composition tension

**Disposition:** Deferred (wave-2 not triggered).

The observation: composition tension between charter v1.3.2 line 141
forbidden-pattern ("primary target reference") and inv. 19's "at least
one" framing. A `BoundaryObservation` that satisfies inv. 19 (any
binding present) might still fail v1.3.2 line 141's primary-only check
if cross-context detection runs against the per-dimension primary
reference. Wave-2 reactive amendment should clarify whether forbidden-
pattern detection runs against "primary" or "at least one" target.

Landed state: charter v1.4.0 retains both framings. Phase 2.2.3 schema
landed without exposing the tension as a runtime defect (no kernel
runtime exists yet). Wave-2 not triggered.

Deferred: wave-2 candidate. Clarification can wait until kernel
implementation surfaces a concrete decision point or post-merge review
flags the gap.

### Future glossary cleanup / registry v0.4.0+ group

#### 9. Pol-N3 — "Authority floor, not a ceiling" idiom canonicalization

**Disposition:** Deferred (low priority).

The observation: the idiom now appears at three textual sites (charter
v1.3.2 lines 140 + 141 + v1.4.0 inv. 19). Future glossary or ontology
cleanup may canonicalize the phrase as a registry-defined term.

Landed state: registry now at v0.4.5 (today). No glossary section
exists in ontology-registry.md. The idiom remains free-form text at
three sites.

Deferred: low-priority editorial cleanup. Track as a future
ontology-registry glossary candidate; not blocking any current work.

### Already-documented group

#### 10. Sec-N-v2-4 — Cross-context substitution defense composes with kernel-set

**Disposition:** Closed at acceptance.

ADR 0039 §Composition with existing invariants documents this. No
follow-up needed.

#### 11. Ont-N11 — Folded as mechanical tweak at acceptance

**Disposition:** Closed at acceptance.

ADR 0039 §Acceptance note records this. No follow-up needed.

## Summary

| Disposition | Count | Items |
|---|---:|---|
| Owed | 2 | #1 ADR 0019 v3 4-class alignment; #3 registry §Producer-vs-kernel-set five FKs |
| Effectively handled | 1 | #2 self-asserted inertness recorded at registry + charter history instead of commit message |
| Active sequencing dependency | 1 | #5 evidenceAuthoritySchema enum extension PR |
| Deferred (Phase 2.5 not landed) | 1 | #4 Phase 2.5 no-duplication reviewer note |
| Deferred (wave-2 not triggered) | 3 | #6 phrasing alternatives; #7 surface enum disparity; #8 primary-vs-at-least-one tension |
| Deferred (low-priority cleanup) | 1 | #9 authority-floor idiom canonicalization |
| Closed at acceptance | 2 | #10 cross-context substitution; #11 Ont-N11 mechanical tweak |

## Action Items

### Owed and unblocked

Two small follow-up edits land cleanly as docs-only commits, one each:

1. **#1 ADR 0019 v3 four-class alignment.** Edit ADR 0019 v3 lines
   611-613 to add `DerivedSummary` to the `derived_from` membership
   list, matching the schema (Phase 2.1.3) and charter v1.4.0 inv. 18.
   Cite ADR 0039 §Forward-looking observations Arch-N10 / Pol-N1 /
   Ont-N8 in the commit. Single-line edit + revision history append.

2. **#3 registry §Producer-vs-kernel-set five-FK extension.** Edit
   `docs/host-capability-substrate/ontology-registry.md` §Producer-vs-
   kernel-set authority fields to enumerate the five inv. 19
   execution-context binding FKs (`execution_context_id`, `surface_id`,
   `workspace_id`, `credential_source_id`, `tool_or_provider_ref`) as
   kernel-set on `BoundaryObservation` envelopes and related Evidence
   subtype envelopes. Cite ADR 0039 §Forward-looking observations
   Ont-N9 in the commit. Bump registry version + change log.

Both are pure docs/registry edits, parallel to today's predicate-kind
vocabulary section addition.

### Active sequencing dependency

3. **#5 `evidenceAuthoritySchema` enum extension PR.** This is a
   schema-change PR (not docs-only) covering the new `self-asserted`
   authority class. Per IMPLEMENT.md it requires `hcs-ontology-reviewer`
   objections. Out of scope for this audit; track as a Phase 2.x
   schema-change candidate. Genuinely useful independently of any
   trap fixture, since it makes charter v1.4.0 inv. 18's chain-walk
   rejection clause schema-operational.

### Deferred (no current action)

#4, #6, #7, #8, #9 stay tracked as expected-deferred. When their
triggering condition arrives (Phase 2.5 PR drafted; wave-2 reactive
amendment triggered by post-merge review; future glossary cleanup),
the receiving PR cites ADR 0039 §Forward-looking observations.

### Closed at acceptance

#10 and #11 require no follow-up.

## Stop Rules

Stop and return to human review if a downstream task tries to:

- close any of #1, #3, or #5 in a single commit that bundles multiple
  observations (one observation per commit per the recent docs cadence);
- treat #4, #6, #7, #8, or #9 as currently owed work absent the
  triggering condition;
- silently amend ADR 0039 §Forward-looking observations or relabel an
  observation's disposition without a fresh review pass;
- expand any single-line ADR text edit (#1) into a full ADR revision
  cycle when the underlying semantics are unchanged;
- conflate `Evidence.authority` enum extension (#5) with
  `Decision.reason_kind` rejection-class additions or
  `kernel_agent_client_resolver` producer-class allowlist work — they
  are distinct schema surfaces.

## Next Safe Action

Author #1 and #3 as two separate docs-only commits, parallel to today's
five-commit run. #5 is a schema-change PR and stays out of scope for
this audit. The remaining six items stay deferred until their
triggering conditions arrive.

## Change Log

| Version | Date | Change |
|---|---:|---|
| 0.1.0 | 2026-05-07 | Initial ADR 0039 forward-looking observations absorption audit. Two Owed (#1, #3), one Effectively handled (#2), one Active sequencing dependency (#5), five Deferred (#4, #6, #7, #8, #9), two Closed at acceptance (#10, #11). |
