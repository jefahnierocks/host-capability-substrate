---
adr_number: 0073
title: "Charter amendment: recognize the generated policy snapshot location and add enforcement-tooling authoring requirements"
status: proposed
date: 2026-06-11
charter_version: 1.4.2
tags: [charter-amendment, policy-snapshot, ci-tooling, authoring-rules, change-class]
---

# ADR 0073: Charter amendment — generated-snapshot location + enforcement-tooling authoring requirements

## Status

`proposed`

## Date

2026-06-11

## Charter version

Written against charter v1.4.2.

## Context

Two charter gaps surfaced by the 2026-06-10 repo audit and the remediation arc
that followed (PRs #52–#61). Both are operator-approved queue items
(2026-06-11). Per §Change policy, each requires an amendment ADR,
`hcs-policy-reviewer` + `hcs-security-reviewer` objections, human approval,
and a version bump; the charter edit itself lands in its own later PR.

**Gap 1 — the §Package boundary enforcement YAML-location bullet contradicts
operator-approved reality and the charter's own CI.** The bullet reads: "No
YAML policy file exists outside `system-config/policies/host-capability-substrate/`
or the test fixture directory `packages/fixtures/policies/`." But D-048 split
the generated-snapshot lane and D-051 (2026-05-18, operator-approved) vendored
the first live policy snapshot into `policies/generated-snapshot/tiers.yaml`,
digest-bound to the canonical source via
`policies/generated-snapshot/snapshot-binding.json`
(`source_policy_sha256: sha256:e06442e0…`, source commit `136dbaa`) and
validated by `scripts/ci/snapshot-binding-check.sh` on every `just verify`.
The CI gate `scripts/ci/policy-lint.sh` already enforces the *amended*
boundary, not the written one: it fails on YAML at the `policies/` **root**
("canonical location is system-config") while linting
`policies/generated-snapshot/` as a legitimate, schema-checked surface. The
charter text trails both the decision ledger and its own enforcement — the
same text-trails-reality class the hcs-architect agent-definition pin (fixed
in PR #54) exhibited. (The vendored file's *internal* `snapshot_binding`
block is stale candidate-blob provenance from the pre-vendor lane; the
authoritative binding is deliberately external in `snapshot-binding.json`
per D-051 — which is why the amended bullet names the external binding, not
the in-file marker. Fixing the in-file marker is system-config-lane work.)

**Gap 2 — enforcement-powered tooling has no mandated reviewer lens and no
change class.** `scripts/ci/**`, `.github/workflows/**`, the `justfile`, and
the `verify.sh` gate wiring carry merge-blocking authority over every PR, yet
§Authoring rules mandates no reviewer for them and IMPLEMENT.md's A–I change
classes do not cover them. Review-gating is inverted relative to enforcement
power: a one-line docs change to a lensed surface gets mandated objections,
while a new merge-blocking gate (doc-pointer-check in PR #54, the justfile
test-target guard in PR #55, shared-state-naming-scan in PR #61, the CI
workflow in PR #16) lands with voluntary lenses only. Four recent PR bodies
have had to disclaim "CI tooling has no change class; that gap is a tracked
operator-decision item."

## Options considered

### Gap 1 — Option A: amend the bullet to name the digest-bound snapshot (chosen)

Add `policies/generated-snapshot/` as a third permitted YAML location,
qualified as read-only, digest-bound, never hand-edited, and not live policy.

**Pros:**
- Conforms charter text to the operator-approved D-048/D-051 lane and to what
  `policy-lint.sh` + `snapshot-binding-check.sh` already enforce.
- Keeps invariant 10's live-policy boundary intact: the snapshot is a bound
  copy, canonical policy remains in `system-config`.
- The qualification ("digest-bound … validated by `snapshot-binding-check`")
  makes the exception mechanically checkable, not a prose loophole.

**Cons:**
- Boundary-enforcement text grows; a third location is more to reason about.

### Gap 1 — Option B: de-vendor the snapshot into `packages/fixtures/policies/`

**Pros:**
- The written bullet would become true without amendment.

**Cons:**
- Reverses the operator-approved D-048/D-051 design: the snapshot is not a
  test fixture — it is the authorized generated/hash-bound policy cache that
  hooks and tests consume (charter §Forbidden patterns, v1.4.1 clarification,
  already names "an authorized generated/hash-bound policy cache" as the
  thing hook bodies may consume).
- Moves a load-bearing consumption surface to a directory whose semantics are
  synthetic test data; worsens the text/reality fit it claims to fix.

### Gap 1 — Option C: leave the bullet as written

**Pros:**
- No charter ceremony.

**Cons:**
- The charter permanently contradicts the decision ledger and the repo's own
  green CI; every future reader must discover D-051 to learn the bullet is
  stale. This is the doc-rot class the repo now gates elsewhere
  (doc-pointer-check, trap #59).

### Gap 2 — Option A: §Authoring rules bullet + IMPLEMENT.md class J restatement (chosen)

Charter §Authoring rules gains: enforcement-tooling changes require
`hcs-architect` objections before human review, adding `hcs-security-reviewer`
when the change touches secret-scanning, sandbox, or permission-adjacent
gates. IMPLEMENT.md restates this as a new change class
`J: enforcement tooling (scripts/ci/, .github/, justfile, verify wiring)` and
a §Required subagent reviews row.

**Pros:**
- Proportionate: the lens that has actually been dispatched voluntarily on
  every recent tooling PR (#54, #55, #59, #61) becomes mandated, codifying
  demonstrated practice rather than inventing process.
- Two-tier security escalation matches the existing pattern for
  `.claude/agents/**` ("add `hcs-security-reviewer` when …").
- Closes the disclaimed gap without creating any new subagent or ring.

**Cons:**
- One more mandated review on tooling PRs (cost is small; the lens was being
  run anyway).

### Gap 2 — Option B: leave tooling review voluntary

**Pros:**
- No process growth.

**Cons:**
- Standing inversion: merge-blocking surfaces get less mandated review than
  the docs they gate. The 2026-06-10 audit flagged exactly this.

### Gap 2 — Option C: dedicated CI-tooling reviewer subagent

**Pros:**
- Maximal specialization.

**Cons:**
- A seventh reviewer for a surface the architect lens already covers;
  violates the repo's update-policy instinct (add process after repeated
  need, smallest sufficient step).

## Decision

Amend the charter (next minor bump, v1.5.0, in its own charter-only PR after
this ADR is accepted):

1. **§Package boundary enforcement** — replace the YAML-location bullet with:

   > No YAML policy file exists outside
   > `system-config/policies/host-capability-substrate/`, the test fixture
   > directory `packages/fixtures/policies/`, or the digest-bound read-only
   > generated snapshot `policies/generated-snapshot/` *(added in v1.5.0 per
   > D-048/D-051: bound to the canonical source by `snapshot-binding.json`;
   > the binding's snapshot file is the **only** YAML permitted under this
   > path — `snapshot-binding-check` fails on any additional YAML and on any
   > digest mismatch, on every verify run; never hand-edited, and never live
   > policy — canonical policy remains in `system-config`)*.

2. **§Authoring rules** — add:

   > If the PR changes enforcement tooling — `scripts/ci/**`,
   > `.github/workflows/**`, the `justfile`, or the verify gate wiring — the
   > `hcs-architect` subagent must produce its objections before human
   > review. Add `hcs-security-reviewer` when the change touches any
   > invariant-enforcing gate: the secret-defense gates (`no-live-secrets`,
   > `forbidden-string-scan` — which also carries the audit-write-exposure,
   > universal-shell, and hook-thinness stanzas), `no-runtime-state-in-repo`,
   > `snapshot-binding-check` (the integrity gate backing the
   > generated-snapshot location exception), sandbox or permission-adjacent
   > gates, or hook installation. This mandate **composes with — and never
   > displaces — the existing required-review rules**: files that classify
   > operations (for example `policy-lint.sh` and `snapshot-binding-check`)
   > still require `hcs-policy-reviewer` objections, and changes engaging
   > schema enums or ontology still require `hcs-ontology-reviewer`
   > objections. *(v1.5.0)*

3. **Restatement sync (same charter PR, established pointer-sync practice):**
   IMPLEMENT.md §Change classes gains
   `J: enforcement tooling (scripts/ci/, .github/, justfile, verify wiring)`;
   IMPLEMENT.md §Required subagent reviews gains the matching row, reusing
   the existing two-tier pattern ("…objections required; add
   `hcs-security-reviewer` when…"). The class-J surface list and the
   security-escalation trigger list must stay **textually identical**
   between the charter §Authoring rules bullet and the IMPLEMENT.md row, so
   neither document can become the divergent copy (the doc-pointer-check
   gate covers version pointers, not prose-trigger equivalence). The
   "no change class" disclaimers in standing docs are retired.

Invariant text is untouched: this amendment edits one boundary-enforcement
bullet and adds one authoring rule. Invariant 10 (public source / private
deployment) and invariant 12 (tool baseline; its named-model text remains the
separately deferred amendment) are unchanged.

## Consequences

**Accepted:**
- Charter text matches the decision ledger (D-048/D-051) and the repo's own
  green CI enforcement; future readers stop discovering the contradiction.
- Enforcement-powered tooling gets mandated review proportionate to its
  authority; the recurring PR-body disclaimer retires.
- The snapshot exception is mechanically qualified (digest binding +
  named validating gate), so it cannot drift into a generic "YAML allowed
  here" loophole.

**Rejected / explicitly not changed:**
- `policies/generated-snapshot/` does **not** become live policy; canonical
  policy remains in `system-config/policies/host-capability-substrate/`
  (invariant 10 untouched).
- No new subagent, ring, or execution surface; no schema or ontology change
  (no `hcs-ontology-reviewer` requirement per §Change policy v1.1.0 clause).
- The snapshot mechanism itself (binding format, vendor process, re-vendor
  coordination) is unchanged; byte changes to the snapshot remain
  system-config-lane work.

**Future amendments this decision anticipates:**
- The deferred invariant-12 named-model amendment (D-054/D-071 lineage)
  remains queued and is deliberately not bundled here.

**Suggested regression coverage (carried to the charter PR / eval lane, not
this ADR PR):**
- Unbound-second-YAML trap: any extra YAML under `policies/generated-snapshot/`
  must fail `snapshot-binding-check` (the exact-allowlist at its glob check).
- Digest-mismatch trap: a one-byte snapshot mutation without a binding update
  must fail at the digest checkpoint.
- Hook-non-consumption note: the Phase 0b hook path does not read the
  snapshot; any future PR adding snapshot consumption to a hook routes
  through the v1.4.1 authorized hash-bound-cache clause, not an ad-hoc read.
- Gate-class lens-coverage meta-check: each invariant-enforcing gate under
  `scripts/ci/` is named in the always-security-lens set, so a new gate
  cannot be added without a review-trigger entry.

## References

- Implementation charter v1.4.2 — §Package boundary enforcement,
  §Authoring rules, §Change policy
- `DECISIONS.md` D-048 (generated-snapshot split), D-051 (first vendored
  snapshot + `snapshot-binding-check.sh` ownership)
- `scripts/ci/policy-lint.sh` (enforces the amended boundary today),
  `scripts/ci/snapshot-binding-check.sh` (digest binding validation)
- 2026-06-10 repo audit (operator-decision queue: charter:88 bullet;
  scripts/ci/.github lens/class gap); operator approval 2026-06-11
- PRs #16, #54, #55, #59, #61 (enforcement-tooling PRs that carried the
  voluntary-lens disclaimer this amendment retires)
- Research plan §5 (capability surface boundary), §18 (regression corpus)

## Revision history

- 2026-06-11: Initial proposal.
- 2026-06-11 (v2): Folded round-1 reviewer objections. Policy B1 (blocking):
  the §Authoring rules bullet and IMPLEMENT.md restatement now state
  explicitly that the class-J architect mandate composes with — never
  displaces — the existing operation-classifying-file `hcs-policy-reviewer`
  mandate and the `hcs-ontology-reviewer` mandate. Security (non-blocking):
  the security-escalation trigger list now names the invariant-enforcing
  gates explicitly (secret-defense, audit-write-exposure/universal-shell/
  hook-thinness stanzas, runtime-state, and `snapshot-binding-check` — the
  gate backing the Gap-1 exception). Architect (non-blocking): the Gap-1
  bullet carries the single-file exact-allowlist qualifier so charter text
  and `snapshot-binding-check` cannot drift; charter/IMPLEMENT trigger lists
  must stay textually identical. Added the suggested regression coverage and
  the stale in-file `snapshot_binding` provenance note (authoritative
  binding is external per D-051).
