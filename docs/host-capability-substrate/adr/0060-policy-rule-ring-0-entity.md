---
adr_number: 0060
title: PolicyRule Ring 0 entity
status: proposed
version: v1
date: 2026-05-29
charter_version: 1.4.1
tags: [policy-rule, ring-0, m1-entity, operation-class, tier, non-minted, policy-gate]
---

# ADR 0060: PolicyRule Ring 0 entity

## Status

`proposed`

Drafted 2026-05-29 as the first entity in the resumed M1 forward train per the
2026-05-29 jefahnierocks-coordinator directive (`docs/orchestration/2026-05-29-hcs-ring1-progress.md`).
This ADR is design-only through the reviewer cycle. It does not author Zod source,
generated JSON Schema, tests, registry docs, live policy, or the vendored snapshot;
the schema PR follows acceptance per `.agents/skills/hcs-schema-change`.

## Date

2026-05-29

## Charter version

Written against implementation charter v1.4.1 and
`docs/host-capability-substrate/ontology-registry.md` v0.4.20. PolicyRule is
constrained by charter invariants 1 (no policy decision lives in an adapter;
tier classification and approval logic belong to Ring 1's policy/gateway
service), 2 (primary operation intent is the typed `OperationShape.operation_class`,
not a shell string — PolicyRule keys off that enum), 6 (`forbidden` tier is
non-escalable: no approval grant, no exception, no override), and 10 (live
policy YAML is canonical in `system-config/policies/host-capability-substrate/`;
this repo holds the schema and a read-only vendored snapshot, not the authoring
surface).

## Context

PolicyRule is one of the eleven lower-coupling M1 canonical entities still
unbuilt after the foundational train (ADR 0049–0055). The 2026-05-29 coordinator
directive resumes the M1 train in Ring-1-mint dependency order and lands
**PolicyRule first**, for two concrete reasons:

1. The live policy `system-config/policies/host-capability-substrate/tiers.yaml`
   (`status: active`, operator-approved 2026-05-18; vendored at
   `policies/generated-snapshot/tiers.yaml`, bound to system-config `136dbaa`)
   declares `schema_refs.policy_rule_schema_version: null`. Every other consuming
   entity in that block (`operation_shape`, `decision`, `approval_grant`,
   `lease`, `run`, `principal`, `session`) names a concrete version; PolicyRule
   is the one dangling reference. Landing PolicyRule sets it to `'0.1.0'`.
2. The HCS-owned generated-snapshot compatibility lint (D-048 / D-051) checks
   `operation_class_defaults` coverage and schema-ref compatibility. Without a
   typed PolicyRule shape, there is no contract for what a rule record must
   contain, so the snapshot lint cannot validate rule structure.

`docs/host-capability-substrate/ontology.md` (line ~94) already names PolicyRule:
"a tier / destructive-pattern / approval rule." The live policy's
`operation_class_defaults` block is the concrete structure a PolicyRule must be
able to express: an `operation_class` mapped to a `default_tier`, with optional
`approval_required` / `approval_required_details` (`required_grant_kind`,
`valid_until_ceiling`, `producer_allowlist`, `dashboard_visibility`,
`evidence_bound_scope`, `single_use`), plus `requires_active_lease`,
`requires_deletion_authority`, and `required_pre_execution_evidence` flags.

PolicyRule is **not** one of the six audit-chain-committed mint entities
(Decision, ApprovalGrant, Lease, Run, Principal, Session — ADR 0057). The
forcing question this ADR answers is: what is the typed Ring-0 shape of a single
policy rule, and is it a minted authority record or a non-minted typed
projection of operator-approved governance content?

## Options considered

### Option A: Non-minted typed policy-rule record keyed to `operation_class`

PolicyRule is a Ring-0 entity typing a single operation-class → tier rule with
its approval / lease / deletion / evidence requirements, freshness ceiling, and
provenance back to the operator-approved live policy. It carries **no**
`audit_chain_link_hash` and **no** producer-mint field. The Ring-1 gateway makes
decisions *using* PolicyRule records; the live policy authoring stays in
system-config; PolicyRule is the schema those rules conform to.

**Pros:**

- Matches charter inv. 1 (PolicyRule is a shape; the *decision* is a `Decision`
  record, already minted) and inv. 10 (HCS owns the schema, not the policy
  content).
- Resolves the live policy's dangling `policy_rule_schema_version` and gives the
  snapshot-compatibility lint a rule-shape contract to check.
- Reuses existing source-of-truth enums (`operationShapeOperationClassSchema`,
  `approvalGrantKindSchema`) so policy classification and grant kinds cannot
  drift from the entities they reference.
- Does not add mint machinery (producer allowlist, link-hash, GENESIS, chain
  walk) that a config-shape record does not need.

**Cons:**

- Requires careful structural refinements so the schema enforces inv. 6
  (forbidden non-escalability) without hardcoding policy *content* (the specific
  operation_class → tier mapping is the live policy's call, not the schema's).
- Two authority surfaces describe rules (the schema here; the content in
  system-config); their relationship must be stated precisely to avoid the
  "policy duplicated outside the policy source" anti-pattern.

### Option B: Audit-chain-minted PolicyRule (mirrors the six mint entities)

Give PolicyRule an `audit_chain_link_hash` + producer field and mint it through
the Ring-1 mint/audit service like Decision/ApprovalGrant/etc.

**Pros:**

- Uniform with the six mint entities; rule provenance would be audit-chained.

**Cons:**

- Conflates the *rule* (operator-approved governance config) with the *decision*
  (`Decision`, already the minted, audit-chained record of applying a rule).
- The mint/audit service (ADR 0057) is scoped to six entities and explicitly
  does not include PolicyRule; adding it expands that service's surface for no
  decision-authority gain.
- Live policy is operator-approved in system-config (inv. 10); minting a kernel
  link-hash over a projection of it adds a second authority story for the same
  content.

### Option C: No PolicyRule entity; leave the reference null

Leave `policy_rule_schema_version: null` and let the gateway consume untyped
policy.

**Pros:**

- Zero schema work now.

**Cons:**

- Leaves a permanent dangling reference in operator-approved live policy.
- No typed contract for rule structure; snapshot-compatibility lint cannot check
  rule shape; future Ring-1 gateway code reads untyped policy.
- Blocks the directive's stated PolicyRule-first dependency step.

## Decision

Choose **Option A**. PolicyRule is a Ring-0 typed entity for a single policy
rule, keyed to `OperationShape.operation_class`, expressing the assigned tier and
its approval / lease / deletion / pre-execution-evidence requirements, freshness
ceiling, and provenance to the operator-approved live policy. It is **non-minted**:
no `audit_chain_link_hash`, no producer-mint field. The Ring-1 policy/gateway
service decides *using* PolicyRule records (charter inv. 1); live-policy authoring
stays in system-config (inv. 10); PolicyRule types the shape the live policy and
the vendored snapshot conform to. `schema_version` is `'0.1.0'`; landing this
entity flips the live policy's `policy_rule_schema_version` from `null` to
`'0.1.0'` (a system-config + operator-gated edit, not performed by this ADR).

The schema encodes only **structural** invariants — chiefly inv. 6
(forbidden non-escalability) and internal approval-shape consistency. It does
**not** encode the operation_class → tier mapping or the tier → approval-required
mapping; those are live-policy *content* owned by system-config (inv. 1 / inv. 10).

## PolicyRule shape (proposed; final Zod lands in the schema PR)

Envelope fields:

1. `schema_version` — `policyRuleSchemaVersionSchema = z.literal('0.1.0')`.
2. `policy_rule_id` — `entityIdSchema`.
3. `operation_class` — **reuses** `operationShapeOperationClassSchema` (the
   closed 8-value enum). Shared source prevents drift between PolicyRule and
   OperationShape, mirroring how `Decision.required_grant_kind` reuses
   `approvalGrantKindSchema`.
4. `tier` — `policyRuleTierSchema = z.enum(['read-safe', 'write-local',
   'write-project', 'write-destructive', 'forbidden'])` (the five active tiers;
   `write-host` was removed from live policy v0.1.0 and is not in the enum).
5. `classification_basis` — `z.literal('typed_operation_class')` (the live
   policy's `classification_authority.primary_classification_surface`; regex
   patterns are renderer/hook/lint defense-in-depth only, never primary intent —
   inv. 2).
6. `requires_active_lease` — `z.boolean()`.
7. `requires_deletion_authority` — `z.boolean()`.
8. `requires_typed_provider_evidence` — `z.boolean()` (the inv.-16
   external-control-plane "typed provider evidence before any executable path"
   flag; the gateway enforces, this records the requirement).
9. `approval` — discriminated union on `approval_required`:
   - `{ approval_required: z.literal(false), approval_path_allowed: z.boolean() }`
   - `{ approval_required: z.literal(true), approval_path_allowed: z.literal(true),
     required_grant_kind: approvalGrantKindSchema, allowed_grant_kinds:
     z.array(approvalGrantKindSchema).min(1), producer_allowlist:
     z.array(policyRuleGrantProducerSchema).min(1), dashboard_visibility:
     policyRuleDashboardVisibilitySchema, single_use: z.boolean(),
     evidence_bound_scope: z.string().min(1) }`
   where `policyRuleGrantProducerSchema = z.enum(['mint_api', 'kernel_broker'])`
   (the grant-minting producers; `kernel_gateway` excluded per ADR 0051 v4 —
   gateway re-derive does not mint grants) and
   `policyRuleDashboardVisibilitySchema = z.enum(['not_required',
   'required_before_grant_consumption'])`.
10. `valid_until_ceiling` — `policyRuleValidUntilCeilingSchema =
    z.union([iso8601DurationSchema, z.literal('not_applicable')])` (live policy
    uses `"PT24H"`, `"PT1H"`, `not_applicable`). The exact duration
    representation is an open item for `hcs-ontology-reviewer`.
11. `source_provenance` — `{ authority: z.literal('system_config_live_policy'),
    source_policy_path: z.string().min(1), source_policy_sha256:
    sha256DigestSchema, observed_at: isoDateTimeSchema }`. PolicyRule is
    non-minted but is a typed projection of operator-approved content; this ties
    each record to the live-policy authority and its bound digest (satisfies the
    provenance discipline without a mint chain).

Envelope-level `superRefine` (structural invariants only):

- **Inv. 6 (forbidden non-escalable):** if `tier === 'forbidden'`, `approval`
  must be the `approval_required: false` variant **and** `approval_path_allowed`
  must be `false`. A forbidden rule that carries any approval path or grant
  detail is rejected. (Mirrors the live policy's `forbidden:
  approval_path_allowed: false` and `forbidden_policy.approval_path_allowed:
  false`.)
- **Approval-path consistency:** when `approval_required === true`,
  `approval_path_allowed` must be `true` (the discriminated union already pins
  this via `z.literal(true)`; the refinement states it for readers).

The schema deliberately does **not** refine `operation_class → tier` or
`tier → approval_required`; those mappings are live-policy content (inv. 1 /
inv. 10). The gateway resolves a tier for an operation class from the live
policy and validates the resolved rule against this schema.

## Why non-minted

The six audit-chain entities record *what the kernel decided/authorized at
request time* (Decision, ApprovalGrant, Lease, Run) or *who/what acted*
(Principal, Session). PolicyRule records *the standing rule that a decision
applies* — operator-approved governance content, canonical in system-config.
The audit-chained artifact is the `Decision` that cites the rule, not the rule
itself. Minting PolicyRule would create a second kernel-authority story over
content the operator already approves out-of-band. Non-minted keeps the
authority lines clean: operator approves rule content (system-config) → HCS types
its shape (this entity) → the gateway mints a `Decision` when it applies a rule
(audit-chained).

## Registry change-set (lands with the schema PR, not this ADR)

Per `.agents/skills/hcs-schema-change` and registry §7 mirror discipline, the
follow-up schema PR updates `ontology-registry.md` and `ontology.md` together
with the Zod source:

1. New `PolicyRule` entity section (envelope fields, non-minted posture, the
   reused-enum note for `operation_class` + `required_grant_kind`).
2. New enum registrations: `policyRuleTierSchema` (5 values),
   `policyRuleGrantProducerSchema` (2 values), `policyRuleDashboardVisibilitySchema`
   (2 values), `policyRuleValidUntilCeilingSchema`.
3. Schema-version ledger: add `PolicyRule` at `'0.1.0'`.
4. M1 canonical-entity status: PolicyRule moves from "reserved" to "built"
   (11 of 22 → 12 of 22).
5. A note that PolicyRule is non-minted and therefore absent from the ADR 0057
   mint/audit producer-allowlist and audit-chain-coverage tables.
6. The downstream system-config + operator edit (out of this repo): flip
   `policy_rule_schema_version: null → '0.1.0'` in the live policy, with a
   coordinated byte-identical snapshot re-vendor (operator-gated; tracked in the
   2026-05-29 packet's system-config lane).

## Procedure rule for changing PolicyRule scope (registered with the schema PR)

To add a tier value, a grant-producer value, or a new requirement flag to
PolicyRule: (1) cite the source ADR or human policy decision; (2) confirm the
addition is a *shape* change, not a policy-content change (content lives in
system-config); (3) preserve inv. 6 (any new tier that is non-escalable must be
covered by the forbidden-style refinement, and no tier may both be
non-escalable and carry an approval path); (4) update the registry status tables
and the schema-version ledger; (5) dispatch all four reviewers
(`hcs-architect`, `hcs-ontology-reviewer`, `hcs-policy-reviewer`,
`hcs-security-reviewer`).

## Out of scope

This ADR does not authorize:

- Zod source, generated JSON Schema, tests, or ontology/registry edits — those
  land in the follow-up schema PR after acceptance.
- Any live-policy byte change, including flipping `policy_rule_schema_version`
  (system-config + operator lane; requires a coordinated byte-identical snapshot
  re-vendor).
- Edits to `policies/generated-snapshot/` or the snapshot binding.
- Ring-1 gateway/policy-resolution implementation (how a tier is resolved for an
  operation class and how a rule is enforced) — that is Ring-1 work gated by
  charter inv. 7.
- Making PolicyRule a mint entity or adding it to the ADR 0057 producer
  allowlist / audit-chain-coverage scope.
- The operation_class → tier or tier → approval mappings (live-policy content).
- The other ten remaining M1 entities (Capability and CommandShape follow in the
  directive's order as their own ADRs).

## Consequences

### Accepts

- A non-minted Ring-0 entity exists in the ontology; the ontology now has
  minted (six) and non-minted (PolicyRule) Ring-0 entity classes, which the
  registry must state explicitly.
- PolicyRule reuses `operationShapeOperationClassSchema` and
  `approvalGrantKindSchema`; future changes to those enums ripple into PolicyRule
  by design.
- The schema types rule *shape* and the inv. 6 structural invariant; it does not
  encode policy content, so a future live-policy content change does not require
  a PolicyRule schema change unless the rule *shape* changes.

### Rejects

- Minting PolicyRule or audit-chaining rule records (Option B).
- Encoding the operation_class → tier mapping in the schema (would duplicate
  policy content outside the system-config source — the anti-pattern in
  CLAUDE.md §When reviewing).
- A `forbidden`-tier rule that carries any approval path or grant detail
  (inv. 6).
- Leaving `policy_rule_schema_version` null (Option C).

### Future amendments

- A future tier (e.g., a re-introduced `write-host` once an owned operation
  class lands) extends `policyRuleTierSchema` per the §Procedure rule.
- If Ring-1 gateway implementation reveals a needed rule-shape field (e.g., a
  per-`boundary_dimension` freshness window reference), a narrow additive
  amendment adds it.
- If the live policy adopts a structured `required_pre_execution_evidence` shape
  richer than a boolean flag, PolicyRule's field is widened to match.

## Acceptance criteria

- All four reviewers confirm the non-minted posture is correct and the schema
  encodes inv. 6 without encoding policy content.
- `hcs-ontology-reviewer` confirms the envelope fields, the reused-enum sourcing,
  the `valid_until_ceiling` representation, and the registry change-set are
  coherent and drift-free.
- `hcs-policy-reviewer` confirms no policy content is duplicated into the schema,
  the forbidden-tier non-escalability holds structurally, and the
  approval-shape union matches the live policy's `approval_required_details`.
- `hcs-security-reviewer` confirms no escalation hole (forbidden cannot carry an
  approval path), the provenance ties to the operator-approved policy without a
  spoofable producer field, and no secret-shaped content can enter
  `evidence_bound_scope` or `source_provenance`.
- `hcs-architect` confirms ring placement (Ring 0), inv. 1/2/6/10 compliance, and
  that PolicyRule does not leak into the ADR 0057 mint scope.
- The acceptance commit records a new decision-ledger row and the schema PR
  follows per `.agents/skills/hcs-schema-change`.

## Reviewer dispatch plan

Dispatch all four required reviewers in parallel:

- `hcs-architect` — ring placement, inv. 1/2/6/10, non-leak into ADR 0057 mint
  scope, ADR structure.
- `hcs-ontology-reviewer` — envelope shape, reused-enum sourcing, enum
  registrations, `valid_until_ceiling` representation, registry change-set,
  schema-version ledger, M1 count.
- `hcs-policy-reviewer` — no policy-content duplication, forbidden
  non-escalability, approval-shape fidelity to live policy, producer allowlist.
- `hcs-security-reviewer` — escalation holes, provenance spoof surface,
  secret-shaped content in string fields, sandbox/self-asserted authority.

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md` v1.4.1,
  invariants 1, 2, 6, 10 (and 16 for the external-control-plane evidence flag).
- ADR 0029: `docs/host-capability-substrate/adr/0029-...` — `operation_class` /
  `mutation_scope` taxonomy.
- ADR 0036 / ADR 0047 — `operation_class` additions (`workspace_verify`,
  `cleanup_plan`) and deletion-authority discipline.
- ADR 0051: `docs/host-capability-substrate/adr/0051-approval-grant-ring-0-entity.md`
  — `approvalGrantKindSchema`, grant-producer allowlist (`mint_api`,
  `kernel_broker`; `kernel_gateway` excluded).
- ADR 0057: `docs/host-capability-substrate/adr/0057-ring-1-mint-audit-service.md`
  — the six mint entities; PolicyRule is intentionally outside this scope.
- ADR 0049–0055 — foundational Ring-0 entity pattern this ADR follows.
- Decision ledger: `DECISIONS.md` D-051 (snapshot lane), D-052 (ADR 0057),
  D-048 (policy-lint split).
- Live policy snapshot: `policies/generated-snapshot/tiers.yaml`
  (`schema_refs.policy_rule_schema_version: null`; `operation_class_defaults`;
  `tiers`; `forbidden_policy`).
- Ontology: `docs/host-capability-substrate/ontology.md` (PolicyRule line ~94).
- Coordinator directive:
  `docs/orchestration/2026-05-29-hcs-ring1-progress.md` § Active Directives.

### External

- None. PolicyRule types HCS-internal policy-rule shape; the live policy content
  is operator-approved governance in system-config.
