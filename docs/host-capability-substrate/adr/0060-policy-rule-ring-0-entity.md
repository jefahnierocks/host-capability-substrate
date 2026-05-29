---
adr_number: 0060
title: PolicyRule Ring 0 entity
status: proposed
version: v2
date: 2026-05-29
charter_version: 1.4.1
tags: [policy-rule, ring-0, m1-entity, operation-class, tier, non-minted, policy-gate]
---

# ADR 0060: PolicyRule Ring 0 entity

## Status

`proposed`

Drafted 2026-05-29 as the first entity in the resumed M1 forward train per the
2026-05-29 jefahnierocks-coordinator directive (orchestration tree:
`/Users/verlyn13/Organizations/jefahnierocks/docs/orchestration/2026-05-29-hcs-ring1-progress.md`
— a workspace-shell packet, not an HCS-repo file). Design-only through the
reviewer cycle; the schema PR follows acceptance per
`.agents/skills/hcs-schema-change`.

Round 1 (v1) returned three `yes-with-mechanical-tweaks` (architect, ontology,
policy) and one `no` (security, two blockers). v2 absorbs both security blockers
and the consolidated mechanical tweaks; see §Revision history.

## Date

2026-05-29

## Charter version

Written against implementation charter v1.4.1 and
`docs/host-capability-substrate/ontology-registry.md` v0.4.20. PolicyRule is
constrained by charter invariants 1 (no policy decision lives in an adapter;
tier classification and approval logic belong to Ring 1's policy/gateway
service), 2 (primary operation intent is the typed `OperationShape.operation_class`,
not a shell string), 4 (audit logging is the integrity surface — see §Decision
attribution), 5 (secrets never at rest in Ring 0/1), 6 (`forbidden` tier
non-escalable), and 10 (live policy YAML canonical in
`system-config/policies/host-capability-substrate/`; this repo holds the schema
and a read-only vendored snapshot, not the authoring surface).

## Revision history

- **v1 (2026-05-29):** initial draft; non-minted PolicyRule keyed to
  `operation_class`, inv. 6 structural refinement, registry change-set.
- **v2 (2026-05-29):** absorbs round-1 review:
  - **B-1 (security, blocker) — audit attribution.** v1 §Why-non-minted asserted
    "the `Decision` captures the rule reference + bound digest," but `decision.ts`
    carries no `policy_rule_ref`/digest field. v2 corrects the claim and names a
    **required follow-up `Decision` schema amendment** as an explicit dependency
    of the non-minted posture (new §Decision attribution).
  - **B-2 (security, blocker) — provenance spoofability.** `source_provenance` is
    self-assertable (`authority` literal + unverified digest). v2 adds a
    **normative Ring-1-enforcement requirement** that the gateway/loader verify
    the asserted `source_policy_sha256` against the bound, verified snapshot
    digest before a rule influences a `Decision`, and states the `authority`
    literal carries no authority absent that match (new §Provenance verification).
  - Mechanical (architect/ontology/policy): `iso8601DurationSchema` is net-new
    (narrow `PT…` regex in `common.ts`); reuse the existing
    `approvalGrantProducerSchema` rather than a new enum; add the
    `required_grant_kind ∈ allowed_grant_kinds` refinement; frame
    `requires_typed_provider_evidence` as a deliberate lossy projection of the
    policy's structured block; bind `source_policy_sha256` to the binding-manifest
    digest (`e06442e0…`), not the stale candidate-skeleton field; state
    `authority` is disjoint from `evidenceAuthoritySchema`; encode inv. 6 as a
    non-escalable-tier-**set** constant; extend registry Sub-rule 9 kebab-case
    grandfather list for `policyRuleTierSchema`; reword the registry change-set to
    the concrete schema-version-ledger row; correct the out-of-repo directive
    citation; add the §Follow-up test obligations.

## Context

PolicyRule is one of the eleven lower-coupling M1 canonical entities still
unbuilt after the foundational train (ADR 0049–0055). The 2026-05-29 coordinator
directive resumes the M1 train in Ring-1-mint dependency order and lands
**PolicyRule first**, for two concrete reasons:

1. The live policy `system-config/policies/host-capability-substrate/tiers.yaml`
   (`status: active`, operator-approved 2026-05-18; vendored at
   `policies/generated-snapshot/tiers.yaml`, bound by `snapshot-binding.json` to
   system-config `136dbaa`, `source_policy_sha256 e06442e0…`) declares
   `schema_refs.policy_rule_schema_version: null`. Every other consuming entity in
   that block names a concrete version; PolicyRule is the one dangling reference.
   Landing PolicyRule sets it to `'0.1.0'`.
2. The HCS-owned generated-snapshot compatibility lint (D-048 / D-051) checks
   `operation_class_defaults` coverage and schema-ref compatibility. Without a
   typed PolicyRule shape there is no contract for what a rule record must
   contain, so the snapshot lint cannot validate rule structure.

`docs/host-capability-substrate/ontology.md` (line ~94) names PolicyRule: "a
tier/destructive-pattern/approval rule (YAML or Rego)." The live policy's
`operation_class_defaults` block is the concrete structure a PolicyRule must be
able to express: one `operation_class` mapped to a `default_tier`, with optional
`approval_required` / `approval_required_details` (`required_grant_kind`,
`valid_until_ceiling` + `valid_until_ceiling_source_ref`, `producer_allowlist`,
`dashboard_visibility`, `evidence_bound_scope`, `single_use`,
`grant_kind_compatibility.allowed_grant_kinds`), plus `requires_active_lease`,
`requires_deletion_authority`, and a structured `required_pre_execution_evidence`
block (inv. 16, on `external_control_plane_mutation`).

A PolicyRule record types **one** rule (a single `operation_class`). The
set-coverage of all operation classes is a lint concern over a *collection* of
PolicyRule records (`operation_class_defaults_coverage_lint`), not a per-record
schema invariant.

PolicyRule is **not** one of the six audit-chain-committed mint entities
(Decision, ApprovalGrant, Lease, Run, Principal, Session — ADR 0057). The forcing
question: what is the typed Ring-0 shape of a single policy rule, and is it a
minted authority record or a non-minted typed projection of operator-approved
governance content?

## Options considered

### Option A: Non-minted typed policy-rule record keyed to `operation_class`

PolicyRule is a Ring-0 entity typing a single operation-class → tier rule with
its approval / lease / deletion / evidence requirements, freshness ceiling, and
provenance back to the operator-approved live policy. No `audit_chain_link_hash`,
no producer-mint field. The Ring-1 gateway decides *using* PolicyRule records;
live-policy authoring stays in system-config; PolicyRule is the schema those
rules conform to. **Audit attribution of which rule authorized a decision is
carried by the minted `Decision`** (which requires the §Decision-attribution
amendment), not by minting PolicyRule. **Rule authority derives from a digest
match against the bound snapshot** (§Provenance verification), not from a
self-asserted field.

**Pros:**

- Matches inv. 1 (PolicyRule is a shape; the *decision* is a minted `Decision`)
  and inv. 10 (HCS owns the schema, not the policy content).
- Resolves the dangling `policy_rule_schema_version` and gives the
  snapshot-compatibility lint a rule-shape contract.
- Reuses existing source-of-truth enums (`operationShapeOperationClassSchema`,
  `approvalGrantKindSchema`, `approvalGrantProducerSchema`) so policy
  classification, grant kinds, and grant producers cannot drift.
- No mint machinery (producer allowlist, link-hash, GENESIS, chain walk) that a
  config-shape record does not need.

**Cons:**

- Audit attribution requires a follow-up `Decision` amendment (B-1) — a small,
  named dependency, not a re-architecture.
- Provenance trust requires a Ring-1 digest-verification step (B-2) — the schema
  cannot self-verify content (correctly, per inv. 1).
- Two surfaces describe rules (schema here; content in system-config); their
  relationship must be stated precisely.

### Option B: Audit-chain-minted PolicyRule

Give PolicyRule an `audit_chain_link_hash` + producer field and mint it through
the Ring-1 mint/audit service.

**Pros:** uniform with the six mint entities; rule provenance audit-chained
without a Decision amendment.

**Cons:** conflates the *rule* (operator-approved config) with the *decision*
(`Decision`, already the minted record of applying a rule); expands ADR 0057's
six-entity service scope; adds a second kernel-authority story over content the
operator already approves out-of-band (inv. 10). The B-1 audit-attribution need
is better met by a narrow `Decision` field than by minting every rule record.

### Option C: No PolicyRule entity; leave the reference null

**Pros:** zero schema work now.

**Cons:** permanent dangling reference in operator-approved live policy; no typed
rule-shape contract; snapshot lint cannot check rule shape; blocks the directive's
PolicyRule-first step.

## Decision

Choose **Option A**. PolicyRule is a Ring-0 typed entity for a single policy
rule, keyed to `OperationShape.operation_class`, expressing the assigned tier and
its approval / lease / deletion / pre-execution-evidence requirements, freshness
ceiling, and provenance to the operator-approved live policy. It is **non-minted**.
The Ring-1 policy/gateway service decides *using* PolicyRule records (inv. 1);
live-policy authoring stays in system-config (inv. 10); PolicyRule types the
shape the live policy and vendored snapshot conform to. `schema_version` is
`'0.1.0'`; landing this entity flips the live policy's
`policy_rule_schema_version` from `null` to `'0.1.0'` (a system-config +
operator-gated edit, not performed by this ADR).

The non-minted posture has two binding obligations, both addressed below and in
the acceptance criteria: **audit attribution** (§Decision attribution, B-1) and
**provenance verification** (§Provenance verification, B-2). The schema encodes
only **structural** invariants — chiefly inv. 6 (forbidden non-escalability),
internal approval-shape consistency, and `required_grant_kind ∈
allowed_grant_kinds`. It does **not** encode the `operation_class → tier` or
`tier → approval_required` mappings; those are live-policy *content* owned by
system-config (inv. 1 / inv. 10).

## PolicyRule shape (proposed; final Zod lands in the schema PR)

Envelope fields:

1. `schema_version` — `policyRuleSchemaVersionSchema = z.literal('0.1.0')`.
2. `policy_rule_id` — `entityIdSchema`.
3. `operation_class` — **reuses** `operationShapeOperationClassSchema` (the closed
   8-value enum). A record types exactly one operation class.
4. `tier` — `policyRuleTierSchema = z.enum(['read-safe', 'write-local',
   'write-project', 'write-destructive', 'forbidden'])` (the five active tiers;
   `write-host` was removed from live policy v0.1.0). Values mirror the live
   policy's `tiers:` keys verbatim and are therefore `kebab-case`; the schema PR
   extends registry Sub-rule 9's kebab-case grandfather list (currently
   `evidenceAuthoritySchema`-only) to name `policyRuleTierSchema`.
5. `classification_basis` — `z.literal('typed_operation_class')` (mirrors the live
   policy's `classification_authority.primary_classification_surface`; regex is
   renderer/hook/lint defense-in-depth only — inv. 2). `classification_basis` is a
   new HCS-side field name, registered in the change-set.
6. `requires_active_lease` — `z.boolean()` (live policy: `worktree_mutation` true).
7. `requires_deletion_authority` — `z.boolean()` (live policy: `destructive_git` true).
8. `requires_typed_provider_evidence` — `z.boolean()`. **Deliberate lossy
   projection** of the live policy's structured `required_pre_execution_evidence`
   block (`typed_provider_evidence_required`, `minimal_request_plan_required`,
   `target_binding_required`, `fanout_quota_evidence_required`,
   `secret_reference_separation_required`, `typed_receipts_required` — present on
   `external_control_plane_mutation`). PolicyRule records only the *presence* of
   the inv.-16 requirement; the Ring-1 gateway enforces the detail. Widening to
   the structured shape is a §Future-amendment if the gateway needs the
   per-sub-requirement granularity at the record layer.
9. `approval` — discriminated union on `approval_required`:
   - `{ approval_required: z.literal(false), approval_path_allowed: z.boolean() }`
   - `{ approval_required: z.literal(true), approval_path_allowed: z.literal(true),
     required_grant_kind: approvalGrantKindSchema, allowed_grant_kinds:
     z.array(approvalGrantKindSchema).min(1), producer_allowlist:
     z.array(approvalGrantProducerSchema).min(1), dashboard_visibility:
     policyRuleDashboardVisibilitySchema, single_use: z.boolean(),
     evidence_bound_scope: policyRuleScopeDescriptorSchema }`
   where `producer_allowlist` **reuses the existing `approvalGrantProducerSchema`**
   (`z.enum(['mint_api', 'kernel_broker'])`, `kernel_gateway` excluded per ADR
   0051 v4 — the two existing values are identical, and reuse prevents drift; the
   semantic distinction is that ApprovalGrant's `granted_by` is the *actual*
   minter while PolicyRule's `producer_allowlist` is the policy-*permitted* set,
   but they draw from the same closed producer domain).
   `policyRuleDashboardVisibilitySchema = z.enum(['not_required',
   'required_before_grant_consumption'])`. `policyRuleScopeDescriptorSchema` is a
   constrained string (see field 12 / §Provenance verification secret note) —
   scope-descriptor tokens only, never resolved values.
10. `valid_until_ceiling` — envelope-level (one ceiling per rule):
    `policyRuleValidUntilCeilingSchema = z.union([iso8601DurationSchema,
    z.literal('not_applicable')])`. **`iso8601DurationSchema` is net-new** (no
    duration schema exists in the package today); the schema PR defines it in
    `common.ts` as a **narrow** anchored regex over the hour/minute/second subset
    the policy actually uses — `/^PT(?:\d+H)?(?:\d+M)?(?:\d+S)?$/` with a guard
    that at least one of H/M/S is present (rejects bare `PT`). Calendar components
    (Y/M/W/D, fractional seconds) are intentionally excluded; widening is an
    additive, ADR-gated change. Covers the live policy's `PT24H`/`PT1H`.
11. `valid_until_ceiling_source_ref` — `z.string().min(1)` (the live policy pairs
    each ceiling with a `valid_until_ceiling_source_ref` citing the authorizing
    ADR or the candidate-default marker; preserved here for provenance fidelity).
12. `source_provenance` — `{ authority: z.literal('system_config_live_policy'),
    source_policy_path: policyRulePolicyPathSchema, source_policy_sha256:
    sha256DigestSchema, source_policy_sha256_basis: z.literal('live_policy_blob'),
    observed_at: isoDateTimeSchema }`. The digest covers the **live-policy content
    blob** bound by `snapshot-binding.json` (`e06442e0…` @ system-config
    `136dbaa`), **not** the live policy's own stale internal
    `snapshot_binding.source_policy_sha256` candidate-skeleton field
    (`26ebf6a5…`, basis `63309b3`, which the 2026-05-29 directive flags as
    operator-gated cleanup). `source_policy_path` is the system-config canonical
    *relative* path (`policies/host-capability-substrate/tiers.yaml`), never a
    host-absolute or secret-bearing path. `authority` is a standalone literal and
    is **intentionally disjoint** from `evidenceAuthoritySchema` — PolicyRule is
    not an Evidence record; this is a provenance tag, not an evidence trust class,
    and must not be wired into chain-walk logic. **The literal confers no
    authority on its own** (see §Provenance verification).

Envelope-level `superRefine` (structural invariants only):

- **Inv. 6 (forbidden non-escalable):** if `tier` is in the
  `nonEscalableTiers` set (a named constant; `{'forbidden'}` at v1, extensible),
  `approval` must be the `approval_required: false` variant **and**
  `approval_path_allowed` must be `false`. Encoded as set-membership, not a bare
  `=== 'forbidden'` literal, so a future non-escalable tier cannot be added
  without tripping the same gate (mirrors `decisionReasonKindCompatibleOutcomes`
  table style). A forbidden rule that carries any approval path or grant detail
  is rejected.
- **Approval-path consistency:** when `approval_required === true`,
  `approval_path_allowed` is `true` (pinned by the union via `z.literal(true)`).
- **Grant-kind membership:** when `approval_required === true`,
  `allowed_grant_kinds.includes(required_grant_kind)` must hold (matches the live
  policy, where `required_grant_kind ∈ grant_kind_compatibility.allowed_grant_kinds`
  in every block; intra-record, so it lives in Zod, not the gateway).

The schema deliberately does **not** refine `operation_class → tier` or
`tier → approval_required`; those mappings are live-policy content (inv. 1 /
inv. 10). The gateway resolves a tier for an operation class from the live policy
and validates the resolved rule against this schema.

## Decision attribution (B-1; binding dependency of the non-minted posture)

Because PolicyRule is non-minted, the durable audit answer to "*which rule, at
which bound digest, authorized this decision*" must live on the minted
`Decision`. `Decision` today (`packages/schemas/src/entities/decision.ts`)
carries `operation_shape_ref` but **no** `policy_rule_ref` and no resolved
policy digest. Therefore:

- This ADR names a **required follow-up `Decision` schema amendment** (its own
  ADR + schema slice) adding `policy_rule_ref` (the `policy_rule_id` applied) and
  the `source_policy_sha256` the gateway resolved the rule against. That amendment
  is an explicit **dependency** of PolicyRule's non-minted posture, not optional.
- Until that amendment lands, the gateway's Ring-1 implementation must not claim
  rule-attribution audit coverage it does not have. This ADR does **not** author
  the `Decision` amendment (separate ADR); it records the dependency so the
  non-minted posture is honest about where attribution lives.

This keeps PolicyRule itself Ring-0-correct and unminted while closing the
charter inv. 4 attribution surface in the entity that actually records decisions.

## Provenance verification (B-2; binding Ring-1 enforcement requirement)

PolicyRule's `source_provenance` is producer-assertable on shape alone: the
`authority` literal is a constant any constructor can write, and
`source_policy_sha256` is an unverified digest string. The schema cannot (and per
inv. 1 must not) verify content. Therefore this ADR states, normatively, that the
Ring-1 policy/gateway loader:

- MUST verify `PolicyRule.source_provenance.source_policy_sha256` equals the
  digest of the currently bound, verified snapshot (the recomputed digest already
  produced by `scripts/ci/snapshot-binding-check.sh` at CI time, and by the loader
  against `snapshot-binding.json` at runtime) **before** any PolicyRule influences
  a `Decision`; a mismatch rejects the rule; and
- MUST treat the `authority: 'system_config_live_policy'` literal as carrying **no
  authority on its own assertion** — authority derives solely from the digest
  match, exactly as `snapshot-binding-check.sh` derives it from recomputation,
  never from the literal.

This is a Ring-1 obligation (cross-record / host-state work, correctly outside the
Ring-0 schema), named here so the follow-up gateway ADR is bound to honor it and
so the acceptance criteria are satisfiable.

## Why non-minted

The six audit-chain entities record *what the kernel decided/authorized at
request time* (Decision, ApprovalGrant, Lease, Run) or *who/what acted*
(Principal, Session). PolicyRule records *the standing rule a decision applies* —
operator-approved governance content, canonical in system-config. The
audit-chained artifact is the `Decision` that cites the rule (via the
§Decision-attribution amendment), not the rule itself. Minting PolicyRule would
create a second kernel-authority story over content the operator already approves
out-of-band, and would expand ADR 0057's six-entity service. Non-minted keeps the
authority lines clean: operator approves rule content (system-config) → HCS types
its shape (this entity) → the gateway verifies the rule's bound digest
(§Provenance verification) and mints a `Decision` that records the applied rule +
digest (§Decision attribution, audit-chained).

## Registry change-set (lands with the schema PR, not this ADR)

Per `.agents/skills/hcs-schema-change` and registry §7 mirror discipline, the
follow-up schema PR updates `ontology-registry.md` and `ontology.md` together
with the Zod source:

1. New `PolicyRule` entity section (envelope fields, non-minted posture; the
   reused-enum note for `operation_class`, `required_grant_kind`/`allowed_grant_kinds`,
   and `producer_allowlist`; the §Decision-attribution dependency and
   §Provenance-verification Ring-1 obligation).
2. New enum registrations: `policyRuleTierSchema` (5 values),
   `policyRuleDashboardVisibilitySchema` (2 values), `iso8601DurationSchema`
   (new `common.ts` primitive, narrow regex), `policyRuleScopeDescriptorSchema`,
   `policyRulePolicyPathSchema`. **Extend registry §Naming-suffix-discipline
   Sub-rule 9's kebab-case grandfather list** to name `policyRuleTierSchema`
   (mirrors the live policy `tiers:` keys; the only other grandfathered kebab enum
   is `evidenceAuthoritySchema`).
3. Schema-version ledger: add a `PolicyRule` row at `'0.1.0'` (this is the
   concrete registry edit; there is no "reserved → built" status cell — the
   "reserved" framing is PLAN/MEMORY narrative, not a registry field).
4. A note that PolicyRule is non-minted and therefore **absent** from the ADR 0057
   mint/audit producer-allowlist, FK-closure inventory, and audit-chain-coverage
   tables; and that `source_provenance.authority` is disjoint from
   `evidenceAuthoritySchema`.
5. A standing registry rule (next to the PolicyRule section): any new
   non-escalable tier must be added to the `nonEscalableTiers` set and covered by
   the inv. 6 refinement.
6. The downstream system-config + operator edit (out of this repo): flip
   `policy_rule_schema_version: null → '0.1.0'` in the live policy, with a
   coordinated byte-identical snapshot re-vendor (operator-gated; tracked in the
   2026-05-29 packet's system-config lane).

## Follow-up test obligations (schema PR + regression corpus)

The schema PR's vitest suite and the regression corpus must exercise (coordinated
with the system-config negative-fixture lane so the same invariant is not assumed
covered on the wrong side of the boundary):

Must-reject:
1. `tier: 'forbidden'` + `approval.approval_required: true` → reject (inv. 6).
2. `tier: 'forbidden'` + `{ approval_required: false, approval_path_allowed: true }`
   → reject (latent path; the `superRefine` must catch this).
3. `approval_required: true, producer_allowlist: ['kernel_gateway']` → reject.
4. `approval_required: true, producer_allowlist: []` → reject (`.min(1)`).
5. `approval_required: true` with `required_grant_kind ∉ allowed_grant_kinds`
   → reject (grant-kind-membership refinement).
6. `approval_required: false` with grant detail present → reject (union shape).
7. invalid duration (`'24h'`, `'PT'`) for `valid_until_ceiling` → reject.

Must-accept (round-trips the four live `write-destructive`/`write-project` rules):
8. `worktree_mutation`/`write-project` with `worktree_clean_acknowledgment`,
   `PT24H`, lease required.
9. `destructive_git`/`write-destructive` with two-value `allowed_grant_kinds`
   (`gate_evidence_acknowledgment`, `pr_absence_acknowledgment`), `PT1H`,
   deletion authority required.
10. `external_control_plane_mutation`/`write-destructive` with
    `requires_typed_provider_evidence: true`; plus the positive forbidden control
    (`{ tier: 'forbidden', approval_required: false, approval_path_allowed: false }`
    accepts) and `valid_until_ceiling: 'not_applicable'` on read/forbidden tiers.

A provenance-fabrication trap (PolicyRule asserting
`authority: 'system_config_live_policy'` with a digest that does not match the
bound snapshot → Ring-1 loader rejects) is an implementation-test obligation for
the gateway lane (no incident yet); seed now, promote to a runnable trap when the
loader exists (ADR 0057 disposition style). Extend the gitleaks/`op://`
forbidden-string scan to cover `evidence_bound_scope` and `source_policy_path` in
any committed PolicyRule fixture.

## Out of scope

This ADR does not authorize: Zod source / generated JSON Schema / tests /
ontology-registry edits (the schema PR after acceptance); the `Decision` schema
amendment (its own ADR, named as a dependency in §Decision attribution); any
live-policy byte change including the `policy_rule_schema_version` flip
(system-config + operator lane; coordinated byte-identical re-vendor); edits to
`policies/generated-snapshot/` or the binding; Ring-1 gateway/policy-resolution or
the §Provenance-verification implementation (Ring-1, gated by charter inv. 7);
making PolicyRule a mint entity or adding it to ADR 0057 scope; the
`operation_class → tier` / `tier → approval` mappings (live-policy content); and
the other ten remaining M1 entities (Capability and CommandShape follow as their
own ADRs).

## Consequences

### Accepts

- A non-minted Ring-0 entity class exists; the registry must state the minted
  (six) vs non-minted (PolicyRule) distinction explicitly.
- PolicyRule reuses `operationShapeOperationClassSchema`, `approvalGrantKindSchema`,
  and `approvalGrantProducerSchema`; changes to those ripple in by design.
- The non-minted posture takes on a **named dependency** (the `Decision`
  attribution amendment, B-1) and a **named Ring-1 obligation** (digest
  verification, B-2). Both are recorded so the posture is honest.
- A new `iso8601DurationSchema` primitive enters `common.ts` (narrow by design).

### Rejects

- Minting PolicyRule / audit-chaining rule records (Option B).
- Encoding policy content (operation_class → tier) in the schema (the
  "tier rules outside the canonical policy source" anti-pattern).
- A `forbidden`-tier rule carrying any approval path or grant detail (inv. 6).
- Trusting `source_provenance` on shape alone (B-2) or claiming Decision
  rule-attribution coverage before the §Decision-attribution amendment (B-1).
- Leaving `policy_rule_schema_version` null (Option C).
- A broad calendar-complete ISO-8601 duration validator.

### Future amendments

- A re-introduced tier (e.g., `write-host`) extends `policyRuleTierSchema` and, if
  non-escalable, the `nonEscalableTiers` set, per the §Procedure rule.
- Widen `requires_typed_provider_evidence` to the structured
  `required_pre_execution_evidence` shape if the gateway needs per-sub-requirement
  granularity at the record layer.
- Widen `iso8601DurationSchema` if day-scale ceilings are ever needed.

## Procedure rule for changing PolicyRule scope (registered with the schema PR)

To add a tier, or a requirement flag: (1) cite the source ADR or human policy
decision; (2) confirm it is a *shape* change, not policy content (content lives
in system-config); (3) preserve inv. 6 — a new non-escalable tier MUST be added to
the `nonEscalableTiers` set; no tier may both be non-escalable and carry an
approval path; (4) update the registry status tables and schema-version ledger;
(5) dispatch all four reviewers.

## Acceptance criteria

- All four reviewers confirm the non-minted posture, the B-1 dependency framing,
  and the B-2 Ring-1 obligation.
- `hcs-security-reviewer` confirms: the §Provenance-verification requirement makes
  the digest non-spoofable in practice (authority derives from the match, not the
  literal); the §Decision-attribution amendment closes the inv. 4 surface; no
  escalation hole; no secret-shaped content in `evidence_bound_scope` /
  `source_policy_path`.
- `hcs-ontology-reviewer` confirms envelope fields, reused-enum sourcing, the new
  `iso8601DurationSchema` shape, `source_policy_sha256` basis, Sub-rule 9
  grandfather extension, registry change-set, and schema-version-ledger row.
- `hcs-policy-reviewer` confirms no policy-content duplication, forbidden
  non-escalability, approval-shape fidelity, and `required_grant_kind ∈
  allowed_grant_kinds`.
- `hcs-architect` confirms ring placement, inv. 1/2/4/6/10 compliance, and
  non-leak into ADR 0057 mint scope.
- The acceptance commit records a decision-ledger row; the schema PR and the named
  `Decision`-attribution amendment ADR follow.

## Reviewer dispatch plan

Round 2: re-dispatch all four reviewers. Each (1) confirms its round-1 findings
are absorbed (`absorbed-cleanly` / `absorbed-with-concerns` / `not-absorbed`),
(2) scans for new round-2 issues, (3) returns a verdict
(`yes` / `yes-with-mechanical-tweaks` / `no`). Focus areas unchanged from round 1;
security additionally confirms B-1 and B-2 absorption.

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md` v1.4.1,
  invariants 1, 2, 4, 5, 6, 10 (and 16 for the provider-evidence flag);
  §Package-boundary-enforcement secret-scan line for the §Follow-up secret note.
- ADR 0049: `docs/host-capability-substrate/adr/0049-decision-ring-0-entity.md`
  — `Decision` envelope (the B-1 attribution amendment target).
- ADR 0051: `docs/host-capability-substrate/adr/0051-approval-grant-ring-0-entity.md`
  — `approvalGrantKindSchema`, `approvalGrantProducerSchema` (`mint_api`,
  `kernel_broker`; `kernel_gateway` excluded).
- ADR 0057: `docs/host-capability-substrate/adr/0057-ring-1-mint-audit-service.md`
  — the six mint entities; PolicyRule is intentionally outside this scope.
- ADR 0049–0055 — foundational Ring-0 entity pattern.
- `packages/schemas/src/entities/decision.ts` — confirms `Decision` lacks a
  `policy_rule_ref`/digest field today (B-1).
- `packages/schemas/src/common.ts` — `sha256DigestSchema`, `isoDateTimeSchema`,
  `evidenceAuthoritySchema` (PolicyRule's `authority` is disjoint); no duration
  schema exists yet (B-2 / field 10).
- `scripts/ci/snapshot-binding-check.sh` — the digest-recomputation verification
  pattern the Ring-1 loader must mirror at runtime (B-2).
- `policies/generated-snapshot/{tiers.yaml,snapshot-binding.json}` — the rule
  structure PolicyRule types; the bound digest (`e06442e0…`) provenance must use.
- Decision ledger: `DECISIONS.md` D-048, D-051, D-052.
- Ontology: `docs/host-capability-substrate/ontology.md` (PolicyRule line ~94).
- Coordinator directive (orchestration tree, **not** an HCS-repo path):
  `/Users/verlyn13/Organizations/jefahnierocks/docs/orchestration/2026-05-29-hcs-ring1-progress.md`
  § Active Directives.

### External

- None. PolicyRule types HCS-internal policy-rule shape; the live policy content
  is operator-approved governance in system-config.

Complies with implementation charter v1.4.1. Ring: 0. No cross-ring imports added.
