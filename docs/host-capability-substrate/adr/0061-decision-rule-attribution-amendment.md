---
adr_number: 0061
title: Decision rule-attribution amendment
status: proposed
version: v1
date: 2026-05-29
charter_version: 1.4.1
tags: [decision, ring-0, policy-rule, audit-attribution, schema-extension, adr-0060-followup, b-1]
---

# ADR 0061: Decision rule-attribution amendment

## Status

`proposed`

Drafted 2026-05-29 as the B-1 dependency named by ADR 0060 (PolicyRule,
D-057). This ADR is design-only. It does not modify Zod source, generated
JSON Schema, tests, registry docs, ADR 0060, ADR 0049, live policy,
generated snapshots, system-config, or Ring 1 implementation code. The
follow-up schema PR follows only after ADR acceptance per
`.agents/skills/hcs-schema-change`, and only after the PolicyRule schema
itself lands (the new `policy_rule_ref` is a typed reference to a
`PolicyRule` record, so its FK target must exist first).

v1 is dispatched to all five reviewers (`hcs-architect`,
`hcs-ontology-reviewer`, `hcs-policy-reviewer`, `hcs-security-reviewer`,
`hcs-eval-reviewer`) for round 1, matching the Decision-amendment review
discipline used for ADR 0056 and ADR 0058.

## Date

2026-05-29

## Charter version

Written against implementation charter v1.4.1 and
`docs/host-capability-substrate/ontology-registry.md` v0.4.21. The
amendment is constrained by charter invariants 1 (no policy decision in an
adapter), 4 (audit is the integrity surface), and 10 (live policy is
canonical in system-config). The PolicyRule record this Decision field
references is non-minted (ADR 0060), so the durable, audit-anchored answer
to "which rule, resolved against which policy digest, authorized this
decision" must live on the minted Decision.

## Context

ADR 0060 landed `PolicyRule` as the first non-minted Ring 0 entity: a
typed shape of a single live-policy rule, keyed to
`OperationShape.operation_class`, carrying its own
`source_provenance.source_policy_sha256` (the live-policy blob digest the
rule was read from). Because PolicyRule is non-minted, it is not part of
the audit chain and cannot itself be the durable attribution record for a
gate decision.

ADR 0060 §Decision attribution therefore named a required follow-up
("B-1"): the minted `Decision` envelope must be able to record which
`PolicyRule` authorized a gate decision and which resolved policy digest
that rule was applied at. Today `packages/schemas/src/entities/decision.ts`
carries `operation_shape_ref` (the operation the decision was about) but no
rule reference and no resolved-policy digest. Without B-1, the non-minted
posture's audit attribution is not closeable in code: an auditor reading a
Decision cannot recover the exact rule + digest that drove the outcome.

`Decision` is consumed by the ADR 0057 mint/audit service (authoritative
minting, audit-chain validation) and by the live policy snapshot's
`schema_refs.decision_schema_version` binding (`"0.1.0"`, D-051). Any
change to `Decision.schema_version` would stale that snapshot reference and
force a coordinated, operator-gated system-config snapshot re-vendor. That
coupling shapes the chosen option below.

## Decision-specific additive field extension

This ADR adds two fields to the `Decision` envelope as an additive,
nullable, optional pair. Additive nullable-optional fields keep existing
serialized `Decision` records valid (the fields are absent today, and
absence remains valid), so `Decision.schema_version` stays `0.1.0` and the
snapshot `decision_schema_version` binding stays compatible. This follows
`.agents/skills/hcs-schema-change` ("additive changes with defaults skip
the schema_version bump"), and is deliberately narrower than the
`ExecutionContext` (0.1.0 -> 0.2.0, Phase 2.2.1 containment-cache refactor)
and `OperationShape` (deletion-authority) field extensions, which were
non-optional structural changes and therefore bumped.

## Options considered

### Option A: Additive nullable-optional attribution pair, no schema-version bump

Add `policy_rule_ref` (`entityIdSchema`, nullable + optional) and
`resolved_policy_sha256` (`sha256DigestSchema`, nullable + optional) to the
`Decision` envelope. A same-record refinement requires the pair to be
consistent: both present (non-null) or both absent/null. The Ring 1
mint/audit service populates the pair for rule-applying (gate) decisions
and leaves it absent for non-rule decisions (for example
`audit_chain_corruption_detected` or
`authority_chain_walk_depth_exceeded`). `Decision.schema_version` stays
`0.1.0`.

**Pros:**

- Closes ADR 0060's B-1 audit-attribution gap: an auditor can recover the
  exact `PolicyRule` and the resolved policy digest from the Decision.
- Additive and non-breaking: existing serialized Decisions remain valid,
  and the live policy snapshot `decision_schema_version: "0.1.0"` binding
  stays compatible — no operator-gated snapshot re-vendor.
- The pair composes with B-2 (the Ring 1 loader's obligation to verify the
  resolved digest against the bound, verified snapshot before the rule
  influences a decision) without committing any Ring 1 behavior here.
- Nullable-optional matches reality: not every Decision applies a rule.

**Cons:**

- Optionality means the Ring 0 schema cannot enforce "every gate decision
  carries attribution." That enforcement (which reason kinds / outcomes
  must carry the pair) is Ring 1 mint/audit logic, consistent with charter
  inv. 1 keeping cross-record decision logic out of the schema layer.

### Option B: Required attribution pair, schema-version bump 0.1.0 -> 0.2.0

Add both fields as required. Existing Decisions become invalid, forcing a
`Decision.schema_version` bump and a coordinated update of the live policy
snapshot `decision_schema_version` binding.

**Pros:**

- The schema itself guarantees every Decision carries the pair.

**Cons:**

- Semantically wrong: non-rule decisions (corruption, depth overflow) do
  not apply a PolicyRule and would have to carry sentinel attribution.
- Couples a Ring 0 amendment to an operator-gated live-policy snapshot
  re-vendor (system-config byte change) — heavier and cross-repo.
- Breaks existing serialized Decisions.

### Option C: Separate attribution record instead of amending Decision

Mint a distinct `DecisionRuleAttribution` record referencing the Decision.

**Pros:**

- Leaves the Decision envelope untouched.

**Cons:**

- Adds another entity and another mint path for what is intrinsically a
  property of the decision.
- Fragments the audit chain: the attribution would live outside the
  Decision it explains, weakening the single-anchor audit story.

## Decision

Choose **Option A**. Add to the `Decision` envelope, in the follow-up
schema PR:

- `policy_rule_ref`: `entityIdSchema.nullable().optional()` — a typed
  reference to the `PolicyRule.policy_rule_id` (ADR 0060) that authorized
  this decision. Absent/null when no rule applies.
- `resolved_policy_sha256`: `sha256DigestSchema.nullable().optional()` —
  the live-policy blob digest the referenced rule was resolved against.
  This is the same value as the referenced rule's
  `source_provenance.source_policy_sha256` at resolution time. Absent/null
  when no rule applies.

A same-record `superRefine` enforces pair consistency: a Decision with one
field present and the other absent/null is rejected. Both present (the
gate-decision case) and both absent/null (the non-rule case) are valid.

`Decision.schema_version` stays `0.1.0`. The amendment is additive
nullable-optional, so existing serialized Decisions remain valid and the
live policy snapshot `decision_schema_version: "0.1.0"` binding stays
compatible. No snapshot re-vendor, no system-config change.

The schema enforces **only** pair consistency and the field formats. It
does **not** enforce which `reason_kind` / `outcome` combinations must
carry attribution. Deciding that a particular decision "applies a rule,"
populating the pair, and verifying `resolved_policy_sha256` against the
bound snapshot digest are Ring 1 mint/audit obligations (charter inv. 1
and inv. 7), not Ring 0 schema behavior.

## Population and verification scope

`policy_rule_ref` / `resolved_policy_sha256` are populated by the kernel
mint/audit service when it resolves a gate decision against a `PolicyRule`.
Producer self-assertion of an arbitrary digest is not trusted: per ADR
0057's service-path matching rule and ADR 0060's `source_provenance`
discipline, `resolved_policy_sha256` is meaningful only when it matches the
digest of the bound, verified live-policy snapshot the kernel resolved the
rule against. That match is **B-2**, a Ring 1 loader obligation tracked for
the mint/audit implementation ADR; this ADR and its schema PR do not
implement it. The Ring 0 schema only guarantees the digest is well-formed
(`sha256:` + 64 hex) and paired with a rule reference.

`policy_rule_ref` is a local entity identifier, not an FK the schema can
dereference; the schema validates its format via `entityIdSchema`. The
mint/audit service is responsible for ensuring the referenced PolicyRule
exists and matches the operation class — also a Ring 1 obligation.

## Consequences

### Accepts

- `Decision` gains two additive nullable-optional fields after the
  follow-up schema PR lands.
- ADR 0060's B-1 audit-attribution gap becomes closeable: gate decisions
  can durably record the rule + resolved digest on the minted Decision.
- The Ring 0 schema enforces field formats and pair consistency only.
- `Decision.schema_version` remains `0.1.0`; no snapshot re-vendor.
- Population and digest verification (B-2) are Ring 1 obligations carried
  to the mint/audit implementation ADR.

### Rejects

- Required attribution fields and a `Decision.schema_version` bump (Option
  B), and the implied operator-gated snapshot re-vendor.
- A separate attribution entity (Option C).
- Schema-level enforcement of which decisions must carry attribution
  (Ring 1's responsibility).
- Trusting a self-asserted `resolved_policy_sha256` at the Ring 0 layer.
- Any live-policy, generated-snapshot, system-config, ADR 0060, ADR 0049,
  or Ring 1 implementation change in this ADR slice.

### Future amendments

- If operational evidence shows attribution must be mandatory for specific
  `reason_kind` values, that becomes a Ring 1 enforcement rule, not a
  schema change.
- If a single decision must cite more than one rule, widen
  `policy_rule_ref` to an ordered list in a future amendment (which would
  then weigh a schema-version bump).

## Out of scope

This ADR explicitly does not authorize:

- schema source edits in `packages/schemas/src/entities/decision.ts`;
- generated JSON Schema regeneration;
- ontology or ontology-registry edits;
- test or fixture edits;
- edits to ADR 0060, ADR 0049, ADR 0056, ADR 0057, or ADR 0058;
- live policy or `tiers.yaml` changes;
- generated-snapshot changes;
- system-config edits;
- Ring 1 mint/audit implementation code, including the B-2 loader digest
  verification;
- execution broker, gateway, capability registration, tool resolution,
  host-state, or dashboard human-in-the-loop behavior.

## Implementation plan after acceptance

The follow-up schema PR, and only that PR (sequenced after the PolicyRule
schema lands), should:

1. Update `packages/schemas/src/entities/decision.ts`:
   - add `policy_rule_ref: entityIdSchema.nullable().optional()` and
     `resolved_policy_sha256: sha256DigestSchema.nullable().optional()` to
     `decisionSchema`;
   - add a same-record `superRefine` that rejects a Decision where exactly
     one of the pair is present (both present or both absent/null only);
   - update `decisionSchemaVersionSchema.describe()` to cite ADR 0061 as an
     additive nullable-optional field extension with no version bump.
2. Regenerate generated JSON Schema and prove `policy_rule_ref` and
   `resolved_policy_sha256` appear in `Decision.schema.json` as optional,
   nullable properties (not in `required`).
3. Add schema tests proving:
   - a Decision with both fields present (valid `entityIdSchema` +
     `sha256:`-prefixed digest) accepts;
   - a Decision with both fields absent accepts (back-compat with existing
     records);
   - a Decision with both fields explicitly `null` accepts;
   - a Decision with `policy_rule_ref` present and `resolved_policy_sha256`
     absent/null rejects;
   - a Decision with `resolved_policy_sha256` present and `policy_rule_ref`
     absent/null rejects;
   - a malformed `resolved_policy_sha256` (missing `sha256:` prefix or
     wrong length) rejects;
   - all pre-existing Decision refinements (outcome-compatibility,
     reason-kind producer scope, evidence-authority rejection,
     non-clearable rules) continue to pass unchanged.
4. Update `docs/host-capability-substrate/ontology.md` and
   `docs/host-capability-substrate/ontology-registry.md`:
   - extend the Decision entity section with the two new optional fields;
   - update the Decision schema-version ledger note to record ADR 0061 as
     an additive nullable-optional extension that does not bump
     `Decision.schema_version` (mirroring how the ledger cites ADR 0056 and
     ADR 0058 for additive Decision changes).
5. Do not edit live policy, generated snapshots, system-config, Ring 1
   service code, ADR 0060, or ADR 0049 in the schema PR unless separately
   authorized.

## Follow-up regression coverage

| Failure class | Coverage posture |
|---|---|
| Additive field extension | Schema tests in the follow-up schema PR; no regression trap unless an observed agent/implementation failure with cited fixture evidence appears. |
| Pair-consistency violation | Schema tests assert reject for one-of-pair-present; no synthetic trap at ADR acceptance. |
| Self-asserted resolved digest | Ring 0 only validates digest format; the trust check (resolved digest matches bound snapshot) is a mint/audit implementation test (B-2) when that service lands; trajectory-asserted, not final-state-only. |
| Mandatory-attribution-by-reason-kind | Deferred Ring 1 enforcement; no Ring 0 coverage now. |
| Snapshot binding | No `Decision.schema_version` change in this ADR, so the existing `decision_schema_version` snapshot binding remains valid; no snapshot test change. |

## Acceptance criteria

- Operator confirms the ADR 0061 v1 scope and the additive nullable-optional
  field design.
- All five reviewers return ready-for-acceptance, or all blockers are
  absorbed in a later revision: `hcs-architect`, `hcs-ontology-reviewer`,
  `hcs-policy-reviewer`, `hcs-security-reviewer`, `hcs-eval-reviewer`.
- The accepted ADR keeps the attribution pair additive nullable-optional
  with no `Decision.schema_version` bump and no snapshot re-vendor.
- The accepted ADR keeps population + digest verification (B-2) as Ring 1
  obligations carried to the mint/audit implementation ADR.
- The accepted ADR preserves the schema-change boundary: no Zod source,
  generated JSON Schema, ontology, registry, test, fixture, live-policy,
  generated-snapshot, system-config, or Ring 1 implementation changes in
  the ADR acceptance slice.
- The follow-up schema PR target records the schema-PR sequencing
  dependency on the PolicyRule schema landing first.
- `just verify` remains green.

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md`
  v1.4.1 — invariants 1, 4, 7, 10.
- ADR 0060 / D-057: `PolicyRule` Ring 0 entity, its non-minted posture, its
  `source_provenance.source_policy_sha256`, and the §Decision-attribution
  follow-up (B-1) this ADR discharges; B-2 loader digest verification.
- ADR 0049 / D-037: `Decision` Ring 0 entity envelope and the procedure for
  amending it.
- ADR 0056 / D-046 and ADR 0058 / D-053: Decision-specific additive change
  precedent (additive enum widening, no `Decision.schema_version` bump).
- ADR 0057 / D-052: Ring 1 mint/audit service; producer service-path
  matching; the Decision consumer that will populate the attribution pair.
- D-051: live policy snapshot binding, including
  `schema_refs.decision_schema_version`.
- Source schema at draft time:
  `packages/schemas/src/entities/decision.ts`; `entityIdSchema` and
  `sha256DigestSchema` in `packages/schemas/src/common.ts`.
- Schema-change workflow: `.agents/skills/hcs-schema-change/SKILL.md`.
- Decision ledger: `DECISIONS.md` — D-046, D-051, D-052, D-053, D-057.

### External

- None. This is an internal schema/ontology discipline amendment.
