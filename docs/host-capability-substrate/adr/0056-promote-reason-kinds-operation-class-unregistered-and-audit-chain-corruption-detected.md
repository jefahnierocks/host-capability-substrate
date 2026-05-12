---
adr_number: 0056
title: Promote operation-class and audit-chain reason kinds
status: accepted
date: 2026-05-12
charter_version: 1.4.0
tags: [decision, reason-kind, ring-0, schema-extension, policy-lint, phase-2-5, adr-0049-followup, adr-0051-followup, audit-chain]
---

# ADR 0056: Promote `operation_class_unregistered` and `audit_chain_corruption_detected`

## Status

`accepted`

Accepted 2026-05-12 after human approval of the v3 consult decisions.
v3 absorbs the v2 ontology blocker by making
`operation_class_unregistered` explicitly non-clearable, keeps
`Decision.operation_shape_ref` required, keeps
`audit_chain_corruption_detected` deny-only, and separates hook cleanup,
policy-lint placement, live policy activation, snapshot vendoring, and
Ring 1 mint/audit work into follow-on slices. D-046 records.

Drafted 2026-05-12 as the HCS-side Fix #4 path decision for Phase 2.5
policy activation. Human direction selected the **source-defined** path:
promote both reason kinds into `decisionReasonKindSchema` rather than
carry a transitional allowlist in system-config lint.

This ADR is docs-only at v3. It does not modify Zod source, generated
JSON Schema, tests, registry docs, live policy, or policy snapshots.
The schema PR follows only after ADR acceptance per `.agents/skills/hcs-schema-change`.

**Revision history**:

- **v1** (commit `3cecc3c`) dispatched the four required reviewers in
  parallel. `hcs-architect` and `hcs-security-reviewer` returned
  ready-for-acceptance. `hcs-ontology-reviewer` returned two blockers:
  (B1) `operation_class_unregistered` is not currently present in the
  registry status table, so the schema PR cannot simply "move" an
  existing row to Zod-defined; (B2) the no-bump posture for a Decision
  enum widening needs an explicit Decision-specific exception rather
  than relying on the OperationShape precedent alone. `hcs-policy-reviewer`
  returned one blocker: ADR 0056 omitted ADR 0029 as the HCS source
  authority for `operation_class_unregistered`.
- **v2** absorbs the three blockers and eight
  non-blocking findings. It adds ADR 0029 as source authority, distinguishes
  adding the missing `operation_class_unregistered` registry row from
  moving the existing `audit_chain_corruption_detected` row, commits the
  Decision-specific additive-enum-widening application that keeps
  `Decision.schema_version == '0.1.0'`, clarifies Decision minting for
  defense-in-depth `operation_class_unregistered` catches, tightens the
  schema-test commitments, and states that temporary lint allowlists do
  not authorize live activation, snapshot vendoring, or schema-version
  posture changes.
- **v3 (this revision)** absorbs the v2 ontology blocker and approved
  consult decisions. It makes `operation_class_unregistered`
  non-clearable by schema commitment: `required_grant_kind` must be
  `null`, and any non-null grant kind must reject. It also commits
  schema PR tests proving `operation_shape_ref` remains required for
  this reason kind, rejecting missing, null, and invalid refs. It
  clarifies that hook-local policy-copy cleanup, split policy lint,
  live policy activation, snapshot vendoring, and Ring 1 mint/audit work
  are separate follow-on slices and not part of this ADR's implementation.

## Date

2026-05-12

## Charter version

Written against charter v1.4.0 and `docs/host-capability-substrate/ontology-registry.md`
v0.4.18.

## Reviews

Required reviewer dispatch for v1:

- `hcs-architect` -- mandatory for ADRs and for preserving the ADR 0049
  procedure rule boundary.
- `hcs-ontology-reviewer` -- mandatory because this ADR proposes a
  `Decision.reason_kind` enum extension and registry status-table update.
- `hcs-policy-reviewer` -- mandatory because `operation_class_unregistered`
  is consumed by the Phase 2.5 operation-policy activation candidate and
  classifies forbidden-policy rejection behavior.
- `hcs-security-reviewer` -- mandatory because
  `audit_chain_corruption_detected` is the chain-walk cycle-rejection
  sentinel for producer-disjointness and authority-chain integrity.

Target cycle time: two revisions, matching the ADR 0049, ADR 0052, ADR
0054, and ADR 0055 efficiency tier.

## Context

`packages/schemas/src/entities/decision.ts` currently defines
`decisionReasonKindSchema` as a closed 15-value enum. The same file's
`decisionReasonKindCompatibleOutcomes` table classifies each value by
allowed `Decision.outcome`. ADR 0049 intentionally left many
registry-canonical reservations outside the initial Zod enum and
registered a procedure for later promotion when a concrete consumer
exists.

Two concrete source/consumer anchors now exist:

1. ADR 0029 introduced `operation_class_unregistered` as the gateway
   rejection reason when an operation is registered without an operation
   class; it also named the value among the reason kinds a future schema
   PR must enumerate.
2. The Phase 2.5 activation policy candidate in system-config commit
   `7ba9071` references `operation_class_unregistered` for non-escalable
   forbidden-pattern defense-in-depth and references
   `audit_chain_corruption_detected` through structured
   `cross_record_rules.producer_disjointness`.
3. ADR 0051 v4, ADR 0052, and ADR 0053 commit the chain-walk
   cycle-rejection sentinel `audit_chain_corruption_detected` for Ring 1
   mint API enforcement of producer-disjointness and related cross-step
   authority checks.

The current drift is load-bearing: the policy candidate wants to cite a
typed Zod source for both reason kinds before activation, and the future
HCS-side snapshot lint should validate policy reason-kind references
against the post-promotion Zod enum with no transitional-reservation hole.

Precedent: `operationShapeSchemaVersionSchema` remains
`z.literal('0.2.0')` even though ADR 0047 added the `cleanup_plan`
`operation_class`; `operation-shape.ts` documents that additive enum
widening did not bump the schema version. This ADR applies the same
schema-version posture to `Decision.reason_kind`: additive enum widening
does not bump `Decision.schema_version`.

## Decision-specific additive enum widening

`.agents/skills/hcs-schema-change` classifies schema changes into
additive-compatible changes and breaking changes, with `schema_version`
bumps required for breaking changes. ADR 0047's `cleanup_plan`
`operation_class` addition was the first concrete application of the
additive enum-widening posture and kept `OperationShape.schema_version`
at `0.2.0`.

This ADR explicitly applies that same general rule to `Decision`:
adding `Decision.reason_kind` values is an additive closed-enum widening
when the entity shape is unchanged, existing serialized records remain
valid, and each new value lands with outcome-compatibility classification
and tests. `Decision.schema_version` therefore remains `0.1.0` for this
promotion. The follow-up schema PR must update the
`decisionSchemaVersionSchema` `.describe()` text to name this ADR and the
no-bump commitment, mirroring the `operation-shape.ts` describe-text
precedent.

This is the Decision-specific precedent requested by the v1 ontology
review. Future `Decision.reason_kind` widenings may cite ADR 0056 when
they meet the same additive criteria; breaking `Decision` shape changes
still require a schema-version bump and their own ADR.

## Decision minting clarification for `operation_class_unregistered`

For the Phase 2.5 policy activation path, `operation_class_unregistered`
is a defense-in-depth rejection reason on an already classified operation
candidate. Primary classification remains the closed
`OperationShape.operation_class` enum; renderer, hook, and lint backstops
may catch a forbidden surface after the operation candidate exists. In
that path, `Decision.operation_shape_ref` is valid because the
OperationShape candidate exists, and the reason kind records that the
forbidden-pattern backstop rejected the operation. Charter invariant 4 is
preserved: the rejection is still a typed Decision.

This ADR does not authorize a nullable `Decision.operation_shape_ref`, a
sentinel OperationShape, or live pre-classification rejection semantics.
If a future gateway path needs to reject a truly pre-classification
operation with no OperationShape candidate, that path requires its own
ADR/schema treatment before implementation.

Denials with `reason_kind: 'operation_class_unregistered'` are
non-clearable. The schema PR must reject any such Decision whose
`required_grant_kind` is non-null and must accept the same reason only
when `required_grant_kind` is `null`. No ApprovalGrant can clear this
rejection because the class remains outside the registered OperationShape
operation-class surface and has no approval path.

`operation_shape_ref` remains required for this path. The schema PR must
prove that missing, null, and invalid `operation_shape_ref` values reject
when paired with `operation_class_unregistered`. This preserves the v3
scope: defense-in-depth rejection after an OperationShape candidate
exists, not a sentinel or pre-classification rejection model.

## Options considered

### Option A: Transitional system-config lint allowlist

System-config lint would allow these two registry-canonical reservations
until a later HCS schema PR promotes them.

**Pros:**

- Cheapest short-term path.
- Keeps Phase 2.5 policy activation work entirely in system-config for
  one more step.
- Avoids opening a schema PR before policy lint placement is complete.

**Cons:**

- Preserves drift between canonical policy references and Zod source.
- Forces HCS-side snapshot lint to encode transitional exceptions.
- Weakens ADR 0049's procedure rule by letting a concrete policy
  consumer rely on registry-only values longer than necessary.
- Does not authorize live activation, snapshot vendoring, schema PR
  omission, or schema-version posture changes before the HCS schema PR
  lands.

### Option B: Source-defined promotion into `decisionReasonKindSchema`

Open this ADR, then a schema PR that adds both values to the Zod enum and
the outcome-compatibility table.

**Pros:**

- Closes the drift structurally.
- Lets system-config policy activation cite HCS Zod source directly.
- Lets future HCS-side snapshot lint validate reason-kind references
  against the canonical enum without transitional exceptions.
- Follows ADR 0049's procedure rule for reason-kind additions.

**Cons:**

- Adds an HCS ADR and schema PR cycle before activation can complete.
- Requires coordinated registry status-table updates in the schema PR.

### Option C: Refactor policy references to avoid both values

Change the policy candidate so it no longer references
`operation_class_unregistered` or `audit_chain_corruption_detected`.

**Pros:**

- Avoids immediate schema churn.
- Keeps the candidate Zod-clean by removing the currently non-Zod values.

**Cons:**

- Impractical for `audit_chain_corruption_detected`, which is already the
  committed cycle-rejection sentinel from ADR 0051 v4, ADR 0052, and ADR
  0053.
- Weakens the forbidden-operation rejection story by leaving
  unregistered operation classes without a typed reason kind.
- Moves away from the substrate posture of closing authority drift
  structurally.

## Decision

Choose Option B. Promote `operation_class_unregistered` and
`audit_chain_corruption_detected` into `decisionReasonKindSchema` in the
follow-up schema PR. Both values are `deny`-only and must receive
`['deny']` entries in `decisionReasonKindCompatibleOutcomes`.

The schema PR must treat this as Decision-specific additive enum widening
and must not bump `decisionSchemaVersionSchema` from `0.1.0`. It must
update Zod source, generated JSON Schema, required schema tests/fixtures,
ontology docs, and the registry status table in one change-set per
`.agents/skills/hcs-schema-change`.

## Consequences

### Accepts

- `Decision.reason_kind` moves from 15 to 17 Zod-defined values.
- `operation_class_unregistered` becomes the typed deny reason for
  operation/capability families that remain outside the registered
  OperationShape operation-class surface and have no approval path.
  Denials with this reason kind must not carry a clearing
  `required_grant_kind`; no ApprovalGrant can clear this rejection.
  The follow-up schema PR must enforce this with a same-record
  refinement: `required_grant_kind` must be `null` for this reason kind,
  and any non-null grant kind rejects.
- `audit_chain_corruption_detected` becomes the typed deny reason for
  Ring 1 mint API cycle detection in bounded authority-chain walks.
- Phase 2.5 activation policy gains a citable HCS Zod-source closure for
  both reason-kind references.
- Future HCS-side policy snapshot lint can validate policy
  reason-kind references directly against the Zod enum after the schema
  PR lands.
- The registry update is asymmetric: `operation_class_unregistered` is
  added as a new registry status-table row with ADR 0029 source authority
  and ADR 0056 promotion authority; `audit_chain_corruption_detected`
  moves from an existing registry-canonical row to Zod-defined with ADR
  0056 promotion authority.

### Rejects

- Transitional allowlisting in system-config as the long-term fix. It may
  be useful as a temporary lint implementation strategy only before the
  schema PR lands, but it is not the accepted posture for activation and
  does not authorize live activation, snapshot vendoring, or schema-version
  posture changes.
- Removing the policy references to avoid schema work. The references
  name real rejection classes and should be structurally typed.
- A schema-version bump. This is additive enum widening under the ADR
  0047 `cleanup_plan` precedent and this ADR's Decision-specific
  additive-enum-widening application, not a breaking shape change.
- Nullable `Decision.operation_shape_ref` or sentinel OperationShape
  handling for this Phase 2.5 path. The accepted path is defense-in-depth
  rejection after an OperationShape candidate exists.
- Any grant-clearing path for `operation_class_unregistered`. This
  reason kind is non-escalable and non-clearable; a non-null
  `required_grant_kind` is invalid for it.
- Folding hook-local policy-copy cleanup, split policy-lint placement,
  live policy activation, generated policy snapshot vendoring, or Ring 1
  mint/audit implementation into this ADR. Those are follow-on slices
  with their own review surfaces.

### Future amendments

- Reopen if the schema PR discovers that either reason kind requires an
  outcome other than `deny`.
- Reopen if Ring 1 mint API implementation splits
  `audit_chain_corruption_detected` into separate cycle-detection and
  audit-storage-corruption reason kinds.
- Reopen if Phase 2.5 policy activation stops referencing
  `operation_class_unregistered` and a stronger typed operation-class
  rejection model replaces it.

## Implementation plan after acceptance

1. Update `packages/schemas/src/entities/decision.ts`:
   - add `operation_class_unregistered`
   - add `audit_chain_corruption_detected`
   - add `['deny']` compatibility entries for both values
   - update `decisionSchemaVersionSchema` `.describe()` text to name ADR
     0056 and the Decision-specific no-bump additive-enum-widening rule,
     mirroring the precedent text in `operation-shape.ts`
   - update `decisionReasonKindSchema` `.describe()` text to name ADR
     0056 as the source-defined promotion for these two values
   - add a same-record refinement that rejects
     `operation_class_unregistered` when `required_grant_kind` is
     non-null
2. Regenerate JSON Schema and add required schema tests/fixtures:
   - accept-test for `operation_class_unregistered` with `outcome: 'deny'`
     and `required_grant_kind: null`
   - reject-test for `operation_class_unregistered` with any non-null
     valid `required_grant_kind`
   - accept-test for `audit_chain_corruption_detected` with
     `outcome: 'deny'`
   - reject-tests for both new values with `outcome: 'allow'` and
     `outcome: 'informational'`
   - reject-tests proving `operation_class_unregistered` still requires
     a valid `operation_shape_ref`: missing, null, and invalid refs must
     reject
   - closed-enum rejection test using a still-registry-only value
   - generated JSON Schema diff/fixture update proving both enum values
     appear in `Decision.schema.json`
   - unknown-reason rejection test remains in place
3. Update `docs/host-capability-substrate/ontology.md` and
   `docs/host-capability-substrate/ontology-registry.md`:
   - add a registry status-table row for `operation_class_unregistered`
     as Zod-defined, with ADR 0029 as source authority and ADR 0056 as
     promotion authority
   - move the existing `audit_chain_corruption_detected` row from
     registry-canonical to Zod-defined with ADR 0056 promotion authority
4. Do not vendor any policy snapshot until the live system-config policy
   exists and the snapshot-binding step is separately authorized.
5. Do not edit hooks in this schema PR. Hook-local forbidden-pattern
   cleanup is a separate slice: delegate to Ring 1 RPC when available or
   to a hash-bound generated runtime policy/cache sourced from the live
   system-config policy. Any temporary backstop must be explicitly
   non-authoritative, data-driven, sunsetted, and reviewed by
   `hcs-hook-integrator` plus `hcs-security-reviewer`.

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md`
  v1.4.0, especially invariants 6, 16, 18, and 19
- ADR 0029: source authority for `operation_class_unregistered` as the
  missing-operation-class rejection reason
- ADR 0049 / D-037: `Decision` Ring 0 entity and the procedure for
  adding new `Decision.reason_kind` values
- ADR 0051 v4 / D-039: ApprovalGrant producer-disjointness and
  `audit_chain_corruption_detected` cycle-rejection reservation
- ADR 0052 / D-040: Lease acquisition producer-disjointness extension
- ADR 0053 / D-041: Run producer-disjointness extension
- ADR 0047: additive enum-widening precedent for `cleanup_plan`
  without `OperationShape.schema_version` bump
- HCS source at draft time: `f8792b3`
- system-config policy candidate: `7ba9071`
  `docs/host-capability-substrate/tiers.yaml.v0.2.0-skeleton.yaml`
- system-config reviewer packet:
  `docs/host-capability-substrate/2026-05-12-phase-2-5-reviewer-resolution-packet.md`

### External

- None. This is an internal schema/ontology discipline decision.
