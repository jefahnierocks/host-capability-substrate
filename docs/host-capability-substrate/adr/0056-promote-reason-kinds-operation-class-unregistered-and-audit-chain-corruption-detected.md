---
adr_number: 0056
title: Promote operation-class and audit-chain reason kinds
status: proposed
date: 2026-05-12
charter_version: 1.4.0
tags: [decision, reason-kind, ring-0, schema-extension, policy-lint, phase-2-5, adr-0049-followup, adr-0051-followup, audit-chain]
---

# ADR 0056: Promote `operation_class_unregistered` and `audit_chain_corruption_detected`

## Status

`proposed`

Drafted 2026-05-12 as the HCS-side Fix #4 path decision for Phase 2.5
policy activation. Human direction selected the **source-defined** path:
promote both reason kinds into `decisionReasonKindSchema` rather than
carry a transitional allowlist in system-config lint.

This ADR is docs-only at v1. It does not modify Zod source, generated
JSON Schema, tests, registry docs, live policy, or policy snapshots.
The schema PR follows only after ADR acceptance per `.agents/skills/hcs-schema-change`.

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

Two concrete consumers now exist:

1. The Phase 2.5 activation policy candidate in system-config commit
   `7ba9071` references `operation_class_unregistered` for non-escalable
   forbidden-pattern defense-in-depth and references
   `audit_chain_corruption_detected` through structured
   `cross_record_rules.producer_disjointness`.
2. ADR 0051 v4, ADR 0052, and ADR 0053 commit the chain-walk
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

The schema PR must treat this as additive enum widening and must not bump
`decisionSchemaVersionSchema` from `0.1.0`. It must update Zod source,
generated JSON Schema, schema tests/fixtures as needed, ontology docs,
and the registry status table in one change-set per
`.agents/skills/hcs-schema-change`.

## Consequences

### Accepts

- `Decision.reason_kind` moves from 15 to 17 Zod-defined values.
- `operation_class_unregistered` becomes the typed deny reason for
  operation/capability families that remain outside the registered
  OperationShape operation-class surface and have no approval path.
- `audit_chain_corruption_detected` becomes the typed deny reason for
  Ring 1 mint API cycle detection in bounded authority-chain walks.
- Phase 2.5 activation policy gains a citable HCS Zod-source closure for
  both reason-kind references.
- Future HCS-side policy snapshot lint can validate policy
  reason-kind references directly against the Zod enum after the schema
  PR lands.

### Rejects

- Transitional allowlisting in system-config as the long-term fix. It may
  be useful as a temporary lint implementation strategy only before the
  schema PR lands, but it is not the accepted posture for activation.
- Removing the policy references to avoid schema work. The references
  name real rejection classes and should be structurally typed.
- A schema-version bump. This is additive enum widening under the ADR
  0047 `cleanup_plan` precedent, not a breaking shape change.

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
2. Regenerate JSON Schema and update schema tests/fixtures.
3. Update `docs/host-capability-substrate/ontology.md` and
   `docs/host-capability-substrate/ontology-registry.md`, including the
   `Decision.reason_kind` status table rows from
   "registry-canonical" to "Zod-defined" with ADR 0056 citation.
4. Do not vendor any policy snapshot until the live system-config policy
   exists and the snapshot-binding step is separately authorized.

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md`
  v1.4.0, especially invariants 6, 16, 18, and 19
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
