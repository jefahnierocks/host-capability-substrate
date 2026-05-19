---
adr_number: 0058
title: Depth-overflow reason_kind promotion
status: accepted
version: v2
date: 2026-05-19
charter_version: 1.4.1
tags: [decision, reason-kind, ring-0, schema-extension, audit-chain, authority-chain, adr-0057-followup]
---

# ADR 0058: Depth-overflow `reason_kind` promotion

## Status

`accepted`

Drafted 2026-05-19 as the ADR 0057 follow-up for the bounded
authority-chain walk depth-overflow failure class. This ADR is
design-only through v2. It does not modify Zod source, generated JSON
Schema, tests, registry docs, ADR 0057, ADR 0056, live policy, generated
snapshots, system-config, or Ring 1 implementation code. The schema PR
follows only after ADR acceptance per `.agents/skills/hcs-schema-change`.

v1 was dispatched to all five reviewers for round 1. Round 1 returned
one architect blocker: the draft did not clarify when a valid
`Decision.operation_shape_ref` exists for typed depth-overflow Decision
emission. Round 1 also returned 11 non-blockers across architect,
ontology, security, and eval review; policy returned `yes` with no
findings. v2 absorbs the blocker by adding §Typed-Decision emission
scope, keeps the ADR 0056-style additive-enum-widening section in its
reviewer-confirmed placement between Context and Options, and absorbs all
mechanical non-blockers: ADR 0057 future-amendment closure wording,
broker-forward-reservation limits, registry count/title target,
non-clearability wording, service-path matching, mutual-exclusion and
evidence-ref test obligations, generated-schema assertion, and
no-synthetic-trap regression-coverage framing. v2 was ready for round-2
reviewer dispatch after operator confirmation.

ADR 0058 v2 was dispatched to all five reviewers for round 2 on
2026-05-19. Four reviewers returned `yes` ready-for-acceptance
(`hcs-ontology-reviewer`, `hcs-policy-reviewer`,
`hcs-security-reviewer`, and `hcs-eval-reviewer`); `hcs-architect`
returned `yes-with-mechanical-tweaks` with two stale-wording
non-blockers, both absorbed in the acceptance commit. Round 2 returned
zero new blockers, and all round-1 findings were confirmed absorbed
cleanly: one architect blocker for Decision-minting envelope
applicability plus 11 non-blockers across architect, ontology, security,
and eval review. ADR 0058 is accepted 2026-05-19 as D-053. This ADR
closes ADR 0057's depth-overflow future-amendment item.

## Date

2026-05-19

## Charter version

Written against implementation charter v1.4.1 and
`docs/host-capability-substrate/ontology-registry.md` v0.4.19. The
depth-overflow reason kind is constrained by charter invariants 4, 8,
17, 18, and 19: audit emission is internal, sandbox/self-asserted
authority does not promote, execution context is declared, derived
retrieval is never decision authority, and boundary claims remain
freshness-bound and execution-context-bound.

## Reviewer dispatch plan

Reviewer dispatch summary for rounds 1-2:

- `hcs-architect` -- verify ADR 0058 is a narrow ADR 0056-style
  amendment and does not reopen ADR 0057's mint/audit boundary.
- `hcs-ontology-reviewer` -- verify the proposed reason-kind name,
  Zod-lift posture, no-bump schema-version discipline, and registry
  status-table implications.
- `hcs-policy-reviewer` -- verify deny-only / non-clearable posture,
  producer scope, and live-policy boundary preservation.
- `hcs-security-reviewer` -- verify the failure class stays distinct
  from cycle/corruption, preserves fail-closed behavior, and cannot be
  used to launder sandbox or KnowledgeChunk authority.
- `hcs-eval-reviewer` -- verify acceptance creates implementation-test
  obligations without requiring synthetic regression traps before an
  observed agent/implementation failure with cited fixture evidence.

## Context

ADR 0057 accepted the first Ring 1 service boundary: the mint/audit
service owns authoritative record minting, audit-chain link validation,
producer allowlist enforcement, and transitive authority-graph checks.
Its §Audit-chain integrity rules bound authority-chain and `derived_from`
walks to at most 64 records. They intentionally separate that
authority-chain walk from the storage-chain link computation.

ADR 0057 also made a deliberate distinction between cycle detection and
depth overflow:

- cycle detection rejects with
  `Decision.reason_kind: 'audit_chain_corruption_detected'` when a
  Decision can be minted;
- walk-depth overflow fails closed through the audit rejection path and
  MUST NOT borrow `audit_chain_corruption_detected` or any unrelated
  reason kind;
- a future reason-kind amendment is required before the service can emit
  a typed Decision for depth overflow.

That future-amendment item is now concrete enough to record. The
mint/audit service needs a Zod-defined `Decision.reason_kind` value for
the bounded authority-chain walk exceeding its depth budget. Without a
specific value, the ADR 0057 behavior remains fail-closed but cannot
emit a typed Decision for this rejection class.

ADR 0056 is the direct precedent. It promoted
`operation_class_unregistered` and `audit_chain_corruption_detected`
into `decisionReasonKindSchema`, classified them as deny-only, kept
`Decision.schema_version == '0.1.0'` under additive enum widening, and
kept the ADR acceptance separate from the follow-up schema PR.

## Decision-specific additive enum widening

This ADR applies the ADR 0056 Decision-specific additive-enum-widening
rule to one additional `Decision.reason_kind` value. The follow-up
schema PR adds exactly one enum member to
`packages/schemas/src/entities/decision.ts`:

```text
authority_chain_walk_depth_exceeded
```

`Decision.schema_version` remains `0.1.0`. The entity shape is unchanged,
existing serialized Decision records remain valid, and the new value
lands with outcome-compatibility, non-clearability / null-only
`required_grant_kind`, producer-scope, schema tests, generated JSON
Schema, ontology docs, and registry status-table updates in the separate
schema-change slice.

The follow-up schema PR must update the `decisionSchemaVersionSchema`
`.describe()` text and the `decisionReasonKindSchema` `.describe()` text
to cite ADR 0058 as an additive reason-kind promotion, mirroring the ADR
0056 precedent.

## Options considered

### Option A: Register a distinct depth-overflow reason kind

Promote a new Zod-defined `Decision.reason_kind` for the walk-depth
overflow failure class. Keep cycle detection on
`audit_chain_corruption_detected`.

**Pros:**

- Preserves ADR 0057's reviewer-driven separation between cycle
  detection and depth overflow.
- Lets the mint/audit service emit typed Decisions for bounded-walk
  overflow without inventing or borrowing an unrelated reason kind.
- Mirrors ADR 0056's source-defined promotion path and schema-version
  no-bump discipline.
- Gives policy checks, schema tests, and future implementation tests a
  precise failure class.

**Cons:**

- Requires an ADR and schema PR before the Ring 1 implementation can emit
  typed Decisions for this class.
- Adds one more `Decision.reason_kind` value and corresponding registry
  maintenance burden.

### Option B: Broaden `audit_chain_corruption_detected`

Reuse `audit_chain_corruption_detected` for both cycle detection and
walk-depth overflow.

**Pros:**

- No new enum member.
- The value is already Zod-defined after ADR 0056.
- Short-term implementation could reuse existing denial handling.

**Cons:**

- Reverses ADR 0057's round-1 ontology/security absorption, which
  narrowed `audit_chain_corruption_detected` to cycle detection in
  bounded walks.
- Conflates structural budget exhaustion with detected cycle/corruption,
  making downstream audit interpretation weaker.
- Violates ADR 0057's explicit rule that depth overflow MUST NOT borrow
  `audit_chain_corruption_detected` or any unrelated reason kind.

### Option C: Keep fail-closed audit rejection without typed Decision

Leave ADR 0057 as-is and keep depth overflow as an untyped
fail-closed audit rejection path until implementation experience proves a
typed value is necessary.

**Pros:**

- No immediate schema or registry change.
- Keeps the first mint/audit implementation narrower at the reason-kind
  surface.

**Cons:**

- Leaves a known rejection class outside typed Decision emission even
  though ADR 0057 already identified the gap.
- Weakens audit consistency for a failure class that can occur while
  enforcing charter invariants 8 and 18.
- Forces schema and implementation work to special-case a known
  structural rejection.

## Decision

Choose Option A. Register
`authority_chain_walk_depth_exceeded` as a new Zod-defined
`Decision.reason_kind` in the follow-up schema PR. The name is deliberately
`authority_chain_*`, not `audit_chain_*`, because ADR 0057 says the
bounded walk is an authority-chain / `derived_from` graph traversal
separate from storage-chain link computation. The suffix
`_depth_exceeded` matches the existing enum's descriptive snake_case
style, including values such as `containment_runtime_capability_exceeded`.

`authority_chain_walk_depth_exceeded` is deny-only. It records that the
mint/audit service reached its bounded-walk limit before it could prove
the consumed authority graph was safe. It is non-clearable:
`required_grant_kind` must be `null`, and any non-null grant kind rejects.
No ApprovalGrant can clear this rejection because exceeding the authority
walk budget is a structural uncertainty, not an approvable operation
condition.

Producer scope for this reason kind is:

- `mint_api` -- the mint/audit service path that performs authoritative
  record minting and the bounded authority-chain walk.
- `kernel_broker` -- future broker-mediated transitions that consume the
  same mint/audit contract and require the same bounded authority-chain
  validation.

This ADR does not authorize `kernel_gateway` to emit
`authority_chain_walk_depth_exceeded`. A future gateway ADR may add that
producer scope if gateway re-derive performs equivalent bounded
authority-chain walks and commits the same fail-closed semantics.

`kernel_broker` is a forward producer reservation for this reason kind.
This ADR and its follow-up schema PR do not authorize broker
implementation or broker emission before a future broker ADR accepts that
service boundary.

## Typed-Decision emission scope

`authority_chain_walk_depth_exceeded` can be emitted as a typed Decision
only when the depth-overflow rejection is tied to an existing valid
OperationShape through the rejected mint request's `operation_shape_ref`
chain. The in-scope case is an operation-bearing mint attempt such as a
Decision, ApprovalGrant, Lease, or Run transition where the
authority-chain walk overflows during that mint's enforcement and the
mint/audit service can still construct a schema-valid Decision envelope.

This ADR does not introduce a nullable `Decision.operation_shape_ref`, a
sentinel OperationShape, or a pre-classification rejection model. If the
service cannot point the rejection at a valid operation shape, the depth
overflow remains on the audit rejection path without typed Decision
emission. That includes non-operation mint enforcement for Principal or
Session records where no `operation_shape_ref` is naturally available,
and pure chain validation outside a mint request. Any typed Decision for
those paths requires a separate ADR/schema treatment.

This mirrors ADR 0056's envelope-applicability discipline for
`operation_class_unregistered`: a reason-kind promotion does not relax
the Decision envelope requirements. `Decision.operation_shape_ref` stays
required, and the follow-up schema PR must reject missing, null, invalid,
or sentinel operation-shape references for
`authority_chain_walk_depth_exceeded`.

`decided_by` producer value is necessary but not sufficient for this
reason kind. `mint_api` or `kernel_broker` must also match the trusted
kernel-resolved service path; producer self-assertion rejects per ADR
0057's service-path matching rule.

## Consequences

### Accepts

- `Decision.reason_kind` gains one additional Zod-defined value after the
  follow-up schema PR lands.
- The mint/audit service can emit typed Decisions for authority-chain
  walk-depth overflow when it can construct a schema-valid Decision
  envelope with a valid `operation_shape_ref`; otherwise the rejection
  stays on the audit rejection path.
- `audit_chain_corruption_detected` remains the cycle-detection sentinel
  and is not broadened to budget overflow.
- The schema PR must classify the new reason kind as `deny`-only and
  non-clearable with `required_grant_kind == null`.
- Producer scope is limited to `mint_api` and `kernel_broker` in this
  ADR.
- `Decision.schema_version` remains `0.1.0` because this is additive enum
  widening under the ADR 0056 Decision-specific precedent.

### Rejects

- Reusing `audit_chain_corruption_detected` for depth overflow.
- Treating walk-depth overflow as approvable or clearable by
  ApprovalGrant or any non-null `required_grant_kind`.
- Adding nullable or sentinel `Decision.operation_shape_ref` behavior for
  this reason kind.
- Broadening producer scope to `kernel_gateway` before a gateway ADR
  commits equivalent bounded-walk semantics.
- A schema-version bump for this additive reason-kind promotion.
- Any live-policy, generated-snapshot, system-config, ADR 0057, ADR
  0056, or Ring 1 implementation change in this ADR slice.

### Future amendments

- Reopen if implementation evidence shows that storage-chain validation
  and authority-chain validation need separate depth-overflow reason
  kinds.
- Reopen if a future gateway ADR proves `kernel_gateway` needs to emit
  this reason kind during gateway re-derive.
- Reopen if operational evidence shows that the 64-record budget should
  change; budget tuning remains separate from the reason-kind name.

## Out of scope

This ADR explicitly does not authorize:

- schema source edits in `packages/schemas/src/entities/decision.ts`;
- generated JSON Schema regeneration;
- ontology or ontology-registry edits;
- test or fixture edits;
- edits to ADR 0057 or ADR 0056;
- live policy or `tiers.yaml` changes;
- generated-snapshot changes;
- system-config edits;
- Ring 1 mint/audit implementation code;
- execution broker, gateway, capability registration, tool resolution,
  host-state, or dashboard human-in-the-loop behavior.

## Implementation plan after acceptance

The follow-up schema PR, and only that PR, should:

1. Update `packages/schemas/src/entities/decision.ts`:
   - add `authority_chain_walk_depth_exceeded` to
     `decisionReasonKindSchema`;
   - add a `['deny']` compatibility entry;
   - update `decisionSchemaVersionSchema` and
     `decisionReasonKindSchema` `.describe()` text to cite ADR 0058 and
     the no-bump additive-enum-widening rule;
   - add same-record refinements that reject
     `authority_chain_walk_depth_exceeded` when `required_grant_kind` is
     non-null and when `decided_by` is outside `mint_api` /
     `kernel_broker`.
2. Regenerate generated JSON Schema.
   - prove `authority_chain_walk_depth_exceeded` appears in
     `Decision.schema.json` after generation.
3. Add schema tests proving:
   - `authority_chain_walk_depth_exceeded` accepts with `outcome:
     'deny'`, `required_grant_kind: null`, and `decided_by` in
     `mint_api` / `kernel_broker` when `operation_shape_ref` is present
     and schema-valid;
   - the same reason rejects with `outcome: 'allow'` or
     `outcome: 'informational'`;
   - the same reason rejects with any non-null valid
     `required_grant_kind`;
   - the same reason rejects with `decided_by: 'kernel_gateway'` until a
     future gateway ADR expands producer scope;
   - the same reason rejects missing, null, invalid, or sentinel
     `operation_shape_ref` values;
   - cycle detection still uses `audit_chain_corruption_detected`, depth
     overflow uses only `authority_chain_walk_depth_exceeded`, and
     neither path can borrow the other reason kind or an unrelated
     reason kind;
   - the new reason kind still rejects direct `sandbox-observation`,
     `self-asserted`, KnowledgeChunk, and unpromoted chain-authority
     surfaces under the existing `Decision.evidence_refs` refinements;
   - unknown reason-kind rejection remains in place.
4. Update `docs/host-capability-substrate/ontology.md` and
   `docs/host-capability-substrate/ontology-registry.md`:
   - add a registry status-table row for
     `authority_chain_walk_depth_exceeded` as Zod-defined, with ADR 0057
     as consumer/source context and ADR 0058 as promotion authority;
   - retitle the registry `Decision.reason_kind` status table from
     "after ADRs 0049–0056" to "after ADRs 0049–0058" using the current
     heading style;
   - update the table prose from 17 Zod-defined + 20 registry-canonical
     reservations / 37 total to 18 Zod-defined + 20 registry-canonical
     reservations / 38 total, assuming no intervening promotion lands;
   - make the reason-specific producer exception visible: this value is
     limited to `mint_api` / `kernel_broker` even though the general
     `Decision.decided_by` allowlist also contains `kernel_gateway`;
   - update the Decision schema-version ledger note to mention ADR 0058
     additive promotion without a version bump.
5. Do not edit live policy, generated snapshots, system-config, Ring 1
   service code, or ADR 0057 in the schema PR unless separately
   authorized.

## Follow-up regression coverage

| Failure class | Coverage posture |
|---|---|
| Reason-kind enum promotion | Schema tests in the follow-up schema PR; no regression trap unless an observed agent/implementation failure with cited fixture evidence appears. |
| Cycle-vs-depth separation | Schema tests in the follow-up schema PR and mint/audit implementation tests when that service lands; no synthetic trap at ADR acceptance. |
| Producer scope and service-path matching | Schema tests cover `decided_by` value restrictions; mint/audit implementation tests cover trusted service-path matching when the service lands. |
| Evidence-authority bypass | Schema tests preserve existing `Decision.evidence_refs` rejection for sandbox-observation, self-asserted, KnowledgeChunk, and unpromoted chain authority surfaces; mint/audit implementation tests cover transitive enforcement when the service lands. |
| Policy snapshot reflection | No live-policy or generated-snapshot change in this ADR. Future snapshot compatibility tests update only if a later system-config policy references this reason kind. |

## Acceptance criteria

- Operator confirms the ADR 0058 v2 scope and proposed reason-kind name.
- All five reviewers return ready-for-acceptance, or all blockers are
  absorbed in a later revision:
  `hcs-architect`, `hcs-ontology-reviewer`, `hcs-policy-reviewer`,
  `hcs-security-reviewer`, and `hcs-eval-reviewer`.
- The accepted ADR keeps `audit_chain_corruption_detected` cycle-only and
  records depth overflow as a distinct reason kind.
- The accepted ADR keeps `authority_chain_walk_depth_exceeded` deny-only
  and non-clearable.
- The accepted ADR limits typed Decision emission to schema-valid
  Decision envelopes with a valid `operation_shape_ref`; non-operation
  mint and pure chain-validation overflows stay audit-rejection-only
  pending separate ADR/schema treatment.
- The ADR acceptance ledger row records that ADR 0058 consumes ADR
  0057's depth-overflow reason-kind future-amendment item.
- The follow-up schema PR target records the registry post-state:
  `Decision.reason_kind` status table after ADRs 0049–0058, 18
  Zod-defined values + 20 registry-canonical reservations, 38 total,
  assuming no intervening promotion.
- The accepted ADR preserves the schema-change boundary: no Zod source,
  generated JSON Schema, ontology, registry, test, fixture, live-policy,
  generated-snapshot, system-config, or Ring 1 implementation changes in
  the ADR acceptance slice.
- `just verify` remains green.

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md`
  v1.4.1 -- invariants 4, 8, 17, 18, and 19.
- ADR 0049 / D-037: `Decision` Ring 0 entity,
  `decisionReasonKindSchema`, and the procedure for adding new
  `Decision.reason_kind` values.
- ADR 0056 / D-046: Decision-specific additive reason-kind promotion,
  deny-only classification, non-clearable precedent for
  `operation_class_unregistered`, and no `Decision.schema_version` bump.
- ADR 0057 / D-052: Ring 1 mint/audit service; §Audit-chain integrity
  rules; §Future amendments depth-overflow reason-kind item; producer
  allowlist table for `mint_api`, `kernel_broker`, and `kernel_gateway`.
- Source schema at draft time:
  `packages/schemas/src/entities/decision.ts` --
  `decisionReasonKindSchema`, `decisionReasonKindCompatibleOutcomes`,
  `decisionProducerSchema`, and same-record refinements.
- Ontology registry:
  `docs/host-capability-substrate/ontology-registry.md` --
  `Decision.reason_kind` status table (after ADRs 0049–0056),
  `Kernel-trusted producer allowlist final state`, and `Current
  schema-version ledger`.
- Schema-change workflow:
  `.agents/skills/hcs-schema-change/SKILL.md`.
- Decision ledger: `DECISIONS.md` -- D-046 and D-052.

### External

- None. This is an internal schema/ontology discipline amendment.
