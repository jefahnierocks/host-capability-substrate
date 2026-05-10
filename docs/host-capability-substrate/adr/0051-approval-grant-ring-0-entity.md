---
adr_number: 0051
title: ApprovalGrant Ring 0 entity introduction
status: proposed
date: 2026-05-10
charter_version: 1.4.0
tags: [approval-grant, ring-0, milestone-1, foundational-entity, grant-kind, producer-disjointness, charter-v1-4-0, registry-v0-4-13-pending-v0-4-14, workflow-sequencing-step-1, adr-0049-mirror, revocation-tiebreaker, consumption-time-freshness, envelope-superrefine-chain-walk, self-approval-rejection, pre-emptive-deferred, canonical-concatenation-length-prefix]
---

# ADR 0051: `ApprovalGrant` Ring 0 entity introduction

## Status

`accepted`

Accepted 2026-05-10 (v4 ready-for-acceptance from all four required reviewers: `hcs-architect`, `hcs-ontology-reviewer`, `hcs-policy-reviewer`, `hcs-security-reviewer`). Five mechanical tweaks at acceptance: (1) MT-1 PLAN.md §References line citation `578` → `672` (current actual line for §Milestone 1 acceptance §22 canonical Ring 0 entities); (2) MT-2 registry §Naming-discipline §Sub-rule 9 line citation `206` → `203`; (3) MT-Sec-1 §Compliance §Cross-step chain-walk bounds citation precision — replaces "ADR 0019 v3 forbids cycles by construction" with "ADR 0019 v3 §Acceptance defers cycle-detection rules to Ring 1 mint API (Milestone 2 / Milestone 4); ADR 0051 commits the Ring 1 rejection with `audit_chain_corruption_detected`"; (4) MT-Sec-2 §Self-approval rejection — adds one-sentence acknowledgment that NFC normalization does not strip zero-width characters (U+200B / U+200C / U+200D / U+FEFF); typed-Principal comparison at workflow-sequencing investigation §Step 3 closes this v1 posture limitation structurally; (5) MT-Sec-3 `audit_chain_corruption_detected` reason_kind — adds sub-classification note distinguishing `derived_from` cycle detection (Ring 1 mint API) from audit-event-storage corruption (Milestone 3 audit-events table). v1 returned 15+ blockers; v2 absorbed v1 but surfaced new convergent issues; v3 removed pre-emptive infrastructure but surfaced 8 new blockers (tier_scope vocabulary collision, chain-walk attribution misattribution); v4 scope-back grounds forbidden-tier defense on `OperationShape.operation_class` enum closure + canonical policy YAML, commits `approvalGrantSchema` envelope-level superRefine, adds canonical-concatenation length-prefix discipline retroactively for ADR 0049/0050/0051. All four required reviewers ready-for-acceptance on v4.

## Date

2026-05-10

## Charter version

Written against charter v1.4.0 and `docs/host-capability-substrate/ontology-registry.md` v0.4.13 (forward-looking citation per ADR 0050's pattern — ADR 0049 cited the actual current v0.4.11 state, ADR 0050 introduced the forward-looking citation pattern citing v0.4.12 reserved by ADR 0049's pending registry change-set docs commit, this ADR continues that pattern by citing v0.4.13 reserved by ADR 0050's pending registry change-set docs commit and reserves v0.4.14 for its own registry change-set docs commit to land after ADR 0049 + ADR 0050 registry commits land in sequence).

## Reviews

This ADR introduces a foundational Ring 0 entity that completes the typed-grant minting layer the charter v1.4.0 invariant 18 chain-walk rejection clause references and that D-037 producer-disjointness rule (ADR 0049) requires for ApprovalGrant-side enforcement. Required reviewer dispatch per `IMPLEMENT.md` §Required subagent reviews:

- `hcs-architect` — mandatory for any ADR
- `hcs-ontology-reviewer` — mandatory; ADR introduces a new Ring 0 entity with a `grant_kind` enum + discriminated `scope` union + producer allowlist + audit-chain integration
- `hcs-policy-reviewer` — mandatory; `ApprovalGrant` records authorize gate-decision overrides; producer-disjointness rule is a policy-enforcement invariant; forbidden-tier non-escalability (charter inv. 6) preservation
- `hcs-security-reviewer` — mandatory; `ApprovalGrant` carries audit-chain integrity, principal authorization, grant-lifecycle revocation, consumption-time race conditions

**Revision history**:
- **v1** (commit `043b276`) dispatch returned 15+ blocking items across 4 reviewers
- **v2** absorbed v1 blockers but introduced new convergent issues (consume_after_revoke_attempt audit-only vs typed Decision, nullable minted_for_decision_id schrödinger state, silent supersession of ADR 0049 framing, kernel_gateway missing, tier_scope kebab-case, scope-payload chain-walk leak, self-approval surface, etc.)
- **v3** removed pre-emptive grant infrastructure entirely (collapsed ~6 v2 blockers), reframed D-037 cross-step as additive (not supersession), committed typed-Decision framing for revocation race, fixed naming-discipline. v3 returned 8 blocking items: chain-walk attribution misattributed (qualityGateEvidenceRefSchema does NOT carry the refinement — it's at the envelope), `tier_scope` vocabulary collision (no `tier` field exists on OperationShape source), `inherited_from_gate` dynamic-dispatch escalation, self-approval framing issues, valid_until inheritance schema-vs-Ring-1 boundary, hash concatenation collision via variable-length branch_ref.
- **v4 (this revision)** — major scope-back: removes `tier_scope` column entirely; grounds forbidden-tier defense on `OperationShape.operation_class` enum closure (already structurally excludes `forbidden`) + canonical policy YAML mapping operation_class → tier (system-config Phase 2.5 lane); fixes chain-walk attribution by committing `approvalGrantSchema` envelope-level superRefine (mirroring `decisionSchema` precedent); adds canonical-concatenation length-prefix discipline; bounds `branch_ref` content with git-ref-grammar regex; tightens self-approval framing (drops "principal-side analog to D-037" claim, commits canonicalization-aware Ring 1 mint API comparison); adds `valid_until` cross-record refinement §Rejects entry mirroring ADR 0050; registers walk-depth budget ceiling (≤ 64); absorbs all v3 non-blocking tweaks.

## Context

The 2026-05-10 workflow-sequencing investigation §Step 1 names `ApprovalGrant` as entity #3 of 5 foundational Ring 0 entities. `ApprovalGrant` is the typed envelope for the gate-decision-override mechanism that the substrate's existing rules reference but cannot yet enforce structurally:

- **D-037 / ADR 0049 §Accepts** commits a producer-disjointness rule (same-step framing). This ADR additively extends to cross-step closure case (both rules survive as facets of the same disjointness invariant).
- **Charter v1.4.0 inv. 18** (chain-walk rejection clause): ApprovalGrant is the typed envelope for `allowed_for_gate`-authorizing grants; chain-walk rejection applies via the `approvalGrantSchema` envelope-level superRefine (this ADR commits the refinement; see §Decision).
- **Charter inv. 7** (execute lane discipline): ApprovalGrant is the first leg of the stack.
- **Charter inv. 6** (forbidden-tier non-escalable): preserved structurally via `OperationShape.operation_class` enum closure (the enum at `packages/schemas/src/entities/operation-shape.ts:10-21` admits `read_only_diagnostic | agent_internal_state | destructive_git | external_control_plane_mutation | worktree_mutation | merge_or_push | workspace_verify | cleanup_plan` — **no `forbidden` value**). Forbidden-tier enforcement happens upstream of grant satisfaction at the canonical policy YAML layer (system-config Phase 2.5) where operation_class → tier mapping rejects `forbidden`-tier execution paths. v4 grant_kind status table commits an `operation_class_scope` column (NOT a new `tier_scope` enum) that lists which `OperationShape.operation_class` values each grant_kind can clear; reviewer-discretion forbidden-clearing check in §Procedure step 2.
- **Charter inv. 19** (freshness-bound + execution-context-bound): `valid_until` non-null + `execution_context_id` kernel-set + consumption-time re-check.
- **Registry §Decision.required_grant_kind reservations** (ADR 0030 + ADR 0035; this ADR closes all three).
- **ADR 0036 `human_dashboard_grant` deletion authority**: FK composition via underlying check class per §Accepts.
- **ADR 0047 cleanup-plan composition** §Future amendments references future ApprovalGrant lifecycle for class-I cleanup execution.

**Out-of-scope for v1 (deferred to future `kernel_dashboard` producer ADR)**: pre-emptive grants. v1 requires `minted_for_decision_id` non-null at the schema layer. Pre-emptive grant infrastructure lands together with the future `kernel_dashboard` producer ADR as a coordinated change-set.

The constraint stack: charter v1.4.0 inv. 1, 4, 6, 7, 8, 17, 18, 19; ADR 0019 v3 §Chain promotion rule; ADR 0029 v2 §Closed-list fail-mode tightening; ADR 0049 D-037 producer-disjointness; registry §Naming-discipline Sub-rule 9 enum-value casing.

## Options considered

### Option A — Comprehensive v1 including pre-emptive grants + tier_scope structural defense

v2 attempted this; rejected per v3 absorption.

### Option B — Pre-emptive grants out of scope + `tier_scope` column on grant_kind status table

v3 attempted this; surfaced two new structural problems: (i) `tier_scope` vocabulary collision (no `tier` field on `OperationShape` source); (ii) `inherited_from_gate` dynamic-dispatch escalation surface for `gate_evidence_acknowledgment`. Both required reframing.

### Option C — Pre-emptive grants out of scope + ground forbidden-tier defense on existing OperationShape.operation_class enum closure + commit operation_class_scope column on grant_kind status table (this ADR's choice)

`OperationShape.operation_class` enum at source already structurally excludes `forbidden` (closed enum, 8 values, none is `'forbidden'`). Charter inv. 6 forbidden-tier non-escalability is therefore defended structurally upstream of any ApprovalGrant interaction:
- **Source-layer defense**: any OperationShape with `operation_class: 'forbidden'` is rejected at schema parse time because the value cannot be expressed (closed enum exclusion).
- **Policy-YAML-layer defense**: canonical policy YAML (system-config Phase 2.5) maps operation_class → tier and rejects `forbidden`-tier execution paths upstream of grant satisfaction.
- **Procedure-layer defense**: §Procedure rule for adding a new grant_kind requires identifying the underlying operation surfaces (which operation_class values the grant_kind can clear) and confirms no `forbidden` clearing path is opened. The forbidden-clearing check is reviewer-discretion (the `operation_class` enum closure makes it structurally impossible to declare a clearing path).

The `operation_class_scope` column on the grant_kind status table records the operation_class values each grant_kind can clear (for documentation + reviewer cross-check at schema-PR time). It is NOT a new enum; it reuses `operationShapeOperationClassSchema` values.

**Pros:**

- Anchors all claims against fields that exist in source today
- Eliminates v3 `tier_scope` vocabulary collision (C2) and `inherited_from_gate` escalation surface (C3)
- Charter inv. 6 defense is structurally upstream of ApprovalGrant — the ADR doesn't need to commit a new defensive layer
- §Procedure rule's forbidden-clearing check survives as reviewer-discretion, anchored to the operation_class enum closure
- Smaller registry change-set; cleaner per-entity scope

**Cons:**

- Forbidden-tier defense at ApprovalGrant layer is "inherited from upstream" rather than "newly added here"; some reviewers may want a freshly-asserted layer (rejected per scope discipline — defense in depth at the substrate is not the same as defense-in-depth at every entity)

## Decision

**Option C.** Pre-emptive grants out of scope; ground forbidden-tier defense on `OperationShape.operation_class` enum closure (already structurally excludes `forbidden`); register `operation_class_scope` column on grant_kind status table for documentation; commit `approvalGrantSchema` envelope-level superRefine for chain-walk rejection.

v1 ApprovalGrant carries:

- `schema_version` — entity-specific literal `'0.1.0'` via `approvalGrantSchemaVersionSchema = z.literal('0.1.0')`. Precedent set includes `evidenceSchemaVersionSchema`, `knowledgeSourceSchemaVersionSchema`, and `operationShapeSchemaVersionSchema` (all landed in source). `decisionSchemaVersionSchema` (ADR 0049 co-commitment) and `workspaceContextSchemaVersionSchema` (ADR 0050 co-commitment) are sibling-ADR co-commitments not yet landed in source.
- `approval_grant_id` — `entityIdSchema` (kernel-set)
- `grant_kind` — `approvalGrantKindSchema = z.enum(['gate_evidence_acknowledgment', 'worktree_clean_acknowledgment', 'pr_absence_acknowledgment'])` (kernel-set; closed enum, initial 3 values from registry reservations; extensible per the registered §Procedure rule). **Re-used by `Decision.required_grant_kind`** (ADR 0049 schema PR will source from this schema; cross-reference commitment).
- `scope` — discriminated union on `grant_kind`:
  - `gate_evidence_acknowledgment`: `{ grant_kind: 'gate_evidence_acknowledgment', gate_id: entityIdSchema, acknowledged_evidence_refs: z.array(qualityGateEvidenceRefSchema).min(1) }`
  - `worktree_clean_acknowledgment`: `{ grant_kind: 'worktree_clean_acknowledgment', workspace_context_id: entityIdSchema, acknowledged_dirty_state_evidence_ref: qualityGateEvidenceRefSchema }`
  - `pr_absence_acknowledgment`: `{ grant_kind: 'pr_absence_acknowledgment', repository_id: entityIdSchema, branch_ref: gitBranchRefSchema, acknowledged_pr_absence_evidence_ref: qualityGateEvidenceRefSchema }` — uses `gitBranchRefSchema` from `packages/schemas/src/entities/source-control-evidence.ts` (regex-validated `refs/heads/<name>` form per git-ref grammar); closes v3 N1 + B3 producer-injection surface

  Note on `qualityGateEvidenceRefSchema` reuse: the schema is reused for the **chain-aware preview shape** (adds `evidence_chain_refs` array structurally). The **inv. 18 chain-walk rejection refinement** lives at the `approvalGrantSchema` envelope-level superRefine (see below), NOT at the ref schema. The ref schema reuse provides shape consistency with QualityGate; the rejection logic is committed at this entity's envelope.
- `minted_for_decision_id` — `entityIdSchema` (kernel-set, **non-null at v1**; FK to the Decision record this grant is intended to satisfy). Pre-emptive grants (null FK) deferred to future `kernel_dashboard` producer ADR.
- `grantor_principal_ref` — `entityIdSchema` (kernel-set; FK to a Principal entity; forward-reference since Principal is M1 entity #5+ and not yet built). At v1 (Principal not built), `grantor_principal_ref` is a `string` shape with FK resolution deferred. Layer 1 mint API enforces self-approval rejection via canonicalization-aware string-comparison against consuming session's principal_id (see §Rejects §Self-approval rejection).
- `granted_by` — `approvalGrantProducerSchema = z.enum(['mint_api', 'kernel_broker'])` (kernel-set; named enum schema for forward-compatible allowlist widening, mirroring `workspaceContextProducerSchema` pattern). v1 allowlist is `[mint_api, kernel_broker]` only. **`kernel_gateway` is intentionally excluded from `granted_by`** by design: the gateway re-derive is the authoritative non-escalable layer per registry §Cross-context enforcement layer §Layer-disagreement tiebreaker; the gateway does not mint grants, only re-derives Decisions. Producer-disjointness check is trivially satisfied for gateway-decided Decisions because `kernel_gateway ∉ granted_by allowlist`; gateway-decided Decisions inherit the gateway re-derive non-escalability layer (the two defenses compose). `kernel_dashboard` deferred to its own producer ADR per policy-reviewer scope discipline.
- `granted_at` — `isoDateTimeSchema` (kernel-set)
- `valid_until` — `isoDateTimeSchema` (kernel-set, **non-null per inv. 19**; ApprovalGrants are freshness-bound). The constraint `valid_until <= Decision.valid_until` (grant cannot outlive target Decision's validity) is a cross-record refinement enforced **only at Ring 1 mint API**, NOT at the schema layer (per §Rejects §valid_until cross-record refinement).
- `execution_context_id` — `entityIdSchema` (kernel-set per inv. 19; ApprovalGrants bind to the execution_context_id of the session that mints AND consumes the grant — at v1 these are equal because pre-emptive minting is out of scope.)
- `grant_state` — `approvalGrantStateSchema = z.enum(['active', 'consumed', 'expired', 'revoked'])` (kernel-set; lifecycle pattern mirroring `agentClientStateSchema` / `workspaceContextStateSchema`)
- `audit_chain_link_hash` — `sha256DigestSchema` (required, non-empty, sha256-shape-validated). Hash covers the canonical concatenation of `approval_grant_id || grant_kind || canonical(scope) || minted_for_decision_id || grantor_principal_ref || granted_by || granted_at || valid_until || execution_context_id || grant_state || canonical(evidence_refs) || prior_audit_chain_link_hash`. **The `||` notation requires length-prefix encoding at Ring 1 mint API** (see §Compliance §Implementation-detail acknowledgments §Canonical-concatenation length-prefix discipline; closes v3 security B3). `schema_version` is intentionally excluded from the canonical concatenation per ADR 0049 + ADR 0050 precedent. Genesis ApprovalGrant policy: same `'GENESIS'` sentinel rule (per ADR 0049 + ADR 0050).
- `evidence_refs` — chain-aware references mirroring `qualityGateEvidenceRefSchema` shape. **Chain-walk rejection refinement lives at the `approvalGrantSchema` envelope-level superRefine** (this ADR commits the refinement; mirrors `decisionSchema` + `qualityGateSchema` precedents). The envelope-level superRefine walks UNCONDITIONALLY (no `gate_state` gating — ApprovalGrants authorize override at all states, so the rejection must fire unconditionally) and rejects:
  - direct `KnowledgeChunk` references (matched by `retrievalArtifactIdPattern`)
  - `Evidence` refs with `authority: 'sandbox-observation' | 'self-asserted'`
  - unpromoted `coordination_fact` / `derived_summary` chain refs (per ADR 0019 v3 four-class `derived_from` closure)
  - The walk applies uniformly across envelope `evidence_refs` AND each scope branch's `acknowledged_evidence_refs[]` (gate_evidence_acknowledgment) / `acknowledged_dirty_state_evidence_ref` (worktree_clean_acknowledgment) / `acknowledged_pr_absence_evidence_ref` (pr_absence_acknowledgment). Closes v2 + v3 inv. 18 scope-payload leak.

**Cardinality discipline** (committed inline per ontology N1 from v2): at most one `active` ApprovalGrant per `minted_for_decision_id`. The schema layer commits the rule per §Decision; Ring 1 mint API enforces via a single-writer commit ordering (cross-record cardinality is not schema-enforceable; see §Rejects §Cross-record cardinality refinement).

**Authority-discipline posture**: ApprovalGrant is **envelope-level kernel-set** (mirrors ADR 0050 framing). All 13 fields (`schema_version`, `approval_grant_id`, `grant_kind`, `scope`, `minted_for_decision_id`, `grantor_principal_ref`, `granted_by`, `granted_at`, `valid_until`, `execution_context_id`, `grant_state`, `audit_chain_link_hash`, `evidence_refs`) are kernel-set; producer-supplied ApprovalGrant records are rejected at the Ring 1 mint API. No producer-asserted-kernel-verifiable field-level exceptions.

**Cross-context binding** (charter inv. 19): `ApprovalGrant.execution_context_id` is kernel-set; cross-context substitution is rejected per registry §Cross-context enforcement layer.

### Revocation race tiebreaker

Concurrent `consume` and `revoke` attempts on the same `active` ApprovalGrant are resolved by the **revoke-wins** rule. Per registry §Audit-chain coverage of rejections (registry line 602+) "Rejection at any of the three layers emits an audit event... carrying the typed `Decision` record returned to the requester," the race-loser produces a **typed `informational` Decision** (`outcome: 'informational'`, `reason_kind: 'consume_after_revoke_attempt'`). The underlying operation that was waiting on the grant **separately** produces a typed `deny` Decision (`outcome: 'deny'`, `reason_kind: 'required_grant_kind_unmet'`). Both records participate in the audit chain.

Ring 1 mint API enforces via single-writer commit ordering on the ApprovalGrant record's `grant_state` transition.

### Consumption-time freshness re-check

Charter inv. 19 freshness-bound + execution-context-bound is enforced at TWO points:
1. **Mint-time**: `valid_until > granted_at` AND `valid_until <= Decision.valid_until` (cross-record check at Ring 1 mint API; see §Rejects §valid_until cross-record refinement)
2. **Consumption-time**: gateway re-verifies `valid_until > now()` at consumption time even if mint-time validation passed; defends against clock-skew, replay, audit-chain-walk re-citation. Stale grants at consumption-time cause rejection with `Decision.reason_kind: 'grant_expired_at_consumption'`.

## Consequences

### Accepts

- **`ApprovalGrant` Ring 0 entity introduced** at `packages/schemas/src/entities/approval-grant.ts` with `schema_version: '0.1.0'`. Closes M1 acceptance criterion #16. **`approvalGrantSchema` commits an envelope-level superRefine** mirroring `decisionSchema` + `qualityGateSchema` precedents that walks `evidence_refs` AND scope-payload evidence refs unconditionally per charter inv. 18 (see §Decision).

- **Initial `approvalGrantKindSchema` Zod-defined enum** with three values — closes all three registry §Decision.required_grant_kind reservations. The schema is **re-used by `Decision.required_grant_kind`** at the ADR 0049 schema PR (cross-reference commitment registered in registry §Decision.required_grant_kind enum mirror change-set item; the two fields share a single Zod source to prevent enum drift).

- **Discriminated `scope` union** with one branch per grant_kind. Scope evidence refs reuse `qualityGateEvidenceRefSchema` shape (for chain-aware preview); chain-walk rejection lives at the envelope-level superRefine. `pr_absence_acknowledgment.branch_ref` uses `gitBranchRefSchema` (regex-validated git-ref grammar; bounds producer-injection surface).

- **D-037 producer-disjointness rule (additive cross-step extension)**: ADR 0049's same-step rule survives as the strict-distance case; this ADR extends to cover the cross-step closure case. Both rules survive as facets of the same disjointness invariant. Formal statement:

  > A `Decision` with non-null `required_grant_kind` MUST NOT be satisfied by an `ApprovalGrant` whose `granted_by` producer class equals the `Decision.decided_by` producer class, whether co-minted in the same audit-chain step (ADR 0049 same-step rule) OR minted in different audit-chain steps where one record is in the other's `derived_from` closure transitively (this ADR's cross-step extension). Producer equality is checked **by class identity**, not by delegation chain.

  Ring 1 mint API enforces by walking the `derived_from` closure (bounded by walk-depth budget ≤ 64 records — see §Compliance) and emitting `Decision.reason_kind: 'producer_disjointness_violation'` on equality.

  **v1 producer-disjointness scope-acknowledgment**: with `granted_by` allowlist `[mint_api, kernel_broker]` (2 producers) and `decided_by` allowlist `[mint_api, kernel_broker, kernel_gateway]` (3 producers per ADR 0049), the rule's defense is **structurally complete but layered with the gateway re-derive non-escalability defense**:
  - `Decision.decided_by: kernel_gateway` Decisions: producer-disjointness trivially satisfied (no granted_by overlaps); the gateway re-derive IS the defense for gateway-decided Decisions per registry §Layer-disagreement tiebreaker
  - `Decision.decided_by: mint_api` Decisions: only `kernel_broker`-minted grants disjoint
  - `Decision.decided_by: kernel_broker` Decisions: only `mint_api`-minted grants disjoint

  The forced-binary at v1 for the two grant-minting producers is structurally complete because gateway-decided Decisions inherit the gateway re-derive non-escalability layer; producer-disjointness is the defense for mint_api/kernel_broker Decisions specifically. Defense strengthens when future producers join the `granted_by` allowlist via the `kernel_dashboard` ADR.

- **Charter inv. 6 (forbidden-tier non-escalable) preservation**: defended structurally **upstream of ApprovalGrant** at the `OperationShape.operation_class` source-enum closure (admits 8 values, none is `'forbidden'`) + canonical policy YAML mapping operation_class → tier (system-config Phase 2.5; rejects `forbidden`-tier execution paths upstream of any grant satisfaction). The §Procedure rule for new grant_kind extensions includes a reviewer-discretion forbidden-clearing check anchored to the operation_class enum closure (no grant_kind can declare a clearing path because no operation_class value is `'forbidden'`).

  v4 scope-back: v2/v3 attempted to add a `tier_scope` column on the grant_kind status table with a new closed enum structurally excluding `'forbidden'`; both versions surfaced reviewer blockers (kebab-case violation, vocabulary collision with non-existent `tier` field, dynamic-dispatch escalation for `inherited_from_gate`). v4 removes the `tier_scope` column entirely and grounds the defense on the existing source-enum closure + policy YAML. The §Procedure rule survives as reviewer-discretion.

- **`operation_class_scope` column on registry §ApprovalGrant.grant_kind status table** — documentation column listing which `OperationShape.operation_class` values each grant_kind can clear (for reviewer cross-check at schema-PR time; not a structural defense layer). v1 grant_kind assignments:
  - `gate_evidence_acknowledgment` → any value in `qualityGateOperationClassSchema` (gates carry their own operation_class; this grant_kind's scope is the union of permissible gate operation_classes)
  - `worktree_clean_acknowledgment` → `destructive_git` (per ADR 0030 stage-2 source-control evidence)
  - `pr_absence_acknowledgment` → `destructive_git` (per ADR 0030)

  The `operation_class_scope` is reviewer-discretion documentation; the structural defense for forbidden-tier-non-escalability lives upstream at the operation_class enum closure (no forbidden value exists; cannot be declared).

- **Grant lifecycle**: 'active' → 'consumed' | 'expired' | 'revoked'. Lifecycle transitions are immutable: state changes via NEW ApprovalGrant record citing the prior in evidence_refs (mirrors ADR 0049 + ADR 0050). **Cardinality discipline** (per §Decision): at most one `active` ApprovalGrant per `minted_for_decision_id`; Ring 1 mint API enforces.

- **Revocation race tiebreaker** (per §Decision §Revocation race tiebreaker): revoke-wins; concurrent consume produces TWO typed Decision records (informational `consume_after_revoke_attempt` + paired deny `required_grant_kind_unmet`). **Registry §Audit-chain coverage of rejections is extended in this ADR's registry change-set #9** to register the pair-mate vocabulary: "Some rejection events emit TWO typed Decision records — an informational Decision attributing the race-loser action + a paired deny Decision attributing the operation-denial. Both participate in the audit chain. Audit-chain consumers must handle the pair atomically."

- **Consumption-time freshness re-check** (per §Decision §Consumption-time freshness re-check): gateway re-verifies `valid_until > now()` at consumption; `Decision.reason_kind: 'grant_expired_at_consumption'` on stale.

- **NEW Decision.reason_kind reservations**: the following 6 reason_kind values are reserved registry-canonical, with Zod-defined values to land at Ring 1 mint API schema PR per ADR 0049 §Procedure rule:
  - `'grant_expired_at_consumption'` — gateway detected stale grant at consumption time. **Outcome compatibility: `'deny'`-only.**
  - `'producer_disjointness_violation'` — D-037 producer-disjointness rule violation (same-step + cross-step extension). **Outcome compatibility: `'deny'`-only.**
  - `'consume_after_revoke_attempt'` — race-loser informational Decision per §Revocation race tiebreaker. **Outcome compatibility: `'informational'`-only.**
  - `'required_grant_kind_unmet'` — Decision deny when its `required_grant_kind` is not satisfied. **Outcome compatibility: `'deny'`-only.**
  - `'self_approval_rejected'` — self-approval rejection (see §Rejects §Self-approval rejection). **Outcome compatibility: `'deny'`-only.**
  - `'audit_chain_corruption_detected'` — emitted when the Ring 1 mint API's cross-step `derived_from` closure walk detects a cycle. **Sub-classification note (MT-Sec-3 at acceptance)**: this reason_kind covers Ring 1 mint API `derived_from` cycle detection only, distinct from Milestone 3 audit-event-storage corruption (which lands as a separate reason_kind reservation in the Milestone 3 audit-events table ADR). **Outcome compatibility: `'deny'`-only.**

  These extend the registry §Decision.reason_kind status table to 21 reservations total (15 prior from ADR 0049 + 6 new from this ADR). Outcome-compatibility classifications match ADR 0049's format.

- **`Evidence.subject_kind: 'approval_grant'` already exists** in `evidenceSubjectKindSchema` (verified at `packages/schemas/src/entities/evidence.ts:38`). This ADR does not modify `evidenceSubjectKindSchema` and does not bump `Evidence.schema_version`.

- **Producer allowlist DOES NOT change in this ADR**: `granted_by` allowlist `[mint_api, kernel_broker]`. `kernel_gateway` intentionally excluded (gateway does not mint grants). `kernel_dashboard` deferred to its own producer ADR.

- **§Producer-vs-kernel-set authority fields update**: enumerate all 13 ApprovalGrant fields as kernel-set (envelope-level posture; explicit enumeration to address v3 ontology N1 field-count discrepancy): `schema_version`, `approval_grant_id`, `grant_kind`, `scope`, `minted_for_decision_id`, `grantor_principal_ref`, `granted_by`, `granted_at`, `valid_until`, `execution_context_id`, `grant_state`, `audit_chain_link_hash`, `evidence_refs`. `schema_version` and `approval_grant_id` are inherent envelope-level kernel-set fields per registry baseline; enumerating explicitly for documentation completeness.

- **`ADR 0036 human_dashboard_grant` deletion-authority FK composition**: the `human_dashboard_grant` *deletion_authority_kind* value (ADR 0036) references an `ApprovalGrant` FK, with the underlying ApprovalGrant record carrying one of the v1 `grant_kind` values per the underlying check class:
  - class-D destructive Git ops requiring worktree-clean: `grant_kind: 'worktree_clean_acknowledgment'`
  - class-D destructive Git ops requiring PR-absence: `grant_kind: 'pr_absence_acknowledgment'`
  - class-D destructive Git ops requiring gate-evidence-acknowledgment (rare): `grant_kind: 'gate_evidence_acknowledgment'`
  - class-I cleanup_plan deletions (ADR 0047): future grant_kind extension; v1 ApprovalGrant entity does NOT cover class-I cleanup, by design

  **Class-D tier preservation**: the `human_dashboard_grant` deletion-authority composition does NOT bypass Decision-mediated enforcement. A Decision against the underlying destructive_git operation is still emitted; the ApprovalGrant satisfies the Decision's `required_grant_kind`. The forbidden-tier defense lives upstream (operation_class enum closure + policy YAML); no grant clears a `forbidden`-tier path because no `forbidden`-tier path can be declared.

  **Single-use semantics**: the ApprovalGrant referenced by `human_dashboard_grant` FK is single-use per cardinality discipline + lifecycle rules. Consumption against one Decision retires the grant atomically. Re-using for a second Decision requires a fresh mint.

- **NEW §Procedure for adding a new grant_kind value rule** registered in `ontology-registry.md` mirroring §Procedure rule patterns from ADR 0048 + ADR 0049. Future schema PRs extending the enum:
  1. Cite the source ADR / charter rule that the grant_kind enforces
  2. **Identify the `operation_class_scope`**: list which `OperationShape.operation_class` values the grant_kind can clear. Confirm no clearing path opens for `forbidden`-tier (anchored to the operation_class enum closure — no `'forbidden'` value exists in the closed enum, so the clearing path cannot be declared; reviewer-discretion check verifies the operation_class_scope is sensible)
  3. **Classify outcome compatibility** for any Decision.reason_kind values introduced together with the grant_kind (deny-only / informational-only / either)
  4. **Declare single-use semantics** (consumed-on-one-Decision-application) and verify the lifecycle transitions
  5. Commit the typed scope shape (discriminated union branch); use `qualityGateEvidenceRefSchema` for chain-aware preview; commit envelope-level superRefine chain-walk on the new scope branch's evidence refs
  6. Update registry §ApprovalGrant.grant_kind status table (Zod-defined vs registry-canonical, with `operation_class_scope` column + outcome-compatibility column for any paired reason_kind reservations) at the same change-set
  7. Pass `hcs-ontology-reviewer` (always); `hcs-policy-reviewer` (always — operation_class_scope check; escalation hole check anchored to operation_class enum closure); `hcs-security-reviewer` (always — chain-walk uniform extension; producer-disjointness rule application; self-approval check); `hcs-architect` (always)

- **Registry change-set bundled into this ADR's commit (or follow-on docs commit referencing this ADR)**. Registry version bumps `v0.4.13` → `v0.4.14` (after ADR 0049 and ADR 0050 registry change-set docs commits land). Changes:
  1. NEW §ApprovalGrant entity section (entity overview + field-shape mirror + scope discriminated-union mirror + v1 non-null minted_for_decision_id commitment + envelope-level superRefine chain-walk commitment)
  2. NEW §ApprovalGrant.grant_kind status table (3 Zod-defined values + `operation_class_scope` column + outcome-compatibility column for paired reason_kind reservations)
  3. NEW §ApprovalGrant.grant_state enum mirror (4 values)
  4. NEW §Procedure for adding a new grant_kind value rule (operation_class_scope + outcome-compatibility + single-use declaration)
  5. NEW §Revocation race tiebreaker registry section (revoke-wins outcome rule + pair-mate `consume_after_revoke_attempt` + `required_grant_kind_unmet` reason_kind mappings)
  6. NEW §Consumption-time freshness re-check registry section (gateway re-derive rule + `grant_expired_at_consumption` reason_kind mapping)
  7. NEW §Self-approval rejection rule registry section (rejection rule + canonicalization-aware comparison commitment + Principal-entity-pending posture)
  8. UPDATE §Producer-vs-kernel-set authority fields — enumerate all 13 ApprovalGrant fields as kernel-set (envelope-level posture; explicit field-count enumeration)
  9. UPDATE §Audit-chain coverage of rejections — add cross-reference to ApprovalGrant.audit_chain_link_hash semantic; **extend vocabulary** for pair-mate records (revocation race tiebreaker case) + commit canonical-concatenation length-prefix discipline as a registry-level posture rule for all entities (ADR 0049, ADR 0050, ADR 0051 share the gap; this ADR closes it for all three)
  10. UPDATE §Decision-ApprovalGrant producer-disjointness rule (D-037) — register the ApprovalGrant-side enforcement mirror as ADDITIVE cross-step extension; Layer 1 mint API checks producer equality by class identity + walks `derived_from` closure bounded by walk-depth budget ≤ 64 records + cycle-rejection
  11. UPDATE §Decision.reason_kind status table — add 6 new reservations from this ADR (15 prior + 6 new = 21 total reservations; outcome compatibility classified)

- **D-row in `DECISIONS.md`** recording the entity introduction + initial enum disposition + producer-disjointness rule completion + revocation tiebreaker + consumption-time freshness re-check + self-approval rejection + reason_kind reservations + pre-emptive deferral + envelope-level superRefine commitment + canonical-concatenation length-prefix discipline.

- **Charter compliance**: inv. 1 (canonical-typed-evidence — typed envelope + typed scope + chain-walk-refined refs via envelope superRefine), inv. 4 (audit logging — audit_chain_link_hash with length-prefix discipline carries integrity; race-loser produces typed Decision pair), inv. 6 (forbidden-tier non-escalable — preserved structurally upstream at operation_class enum closure + policy YAML), inv. 7 (execute lane discipline), inv. 8 (no sandbox→stronger — envelope superRefine walks uniformly), inv. 17 (execution context declared), inv. 18 (derived retrieval is never decision authority — envelope superRefine applies chain-walk unconditionally), inv. 19 (freshness-bound + execution-context-bound — `valid_until` non-null + `execution_context_id` kernel-set + consumption-time re-check; cross-record `valid_until` inheritance at Ring 1 mint API). All upheld.

### Rejects

- **Opaque `scope: z.json()`** — violates charter inv. 1. Rejected.

- **Pre-emptive grants (nullable `minted_for_decision_id`) at v1** — deferred to the future `kernel_dashboard` producer ADR as a coordinated change-set.

- **Producer-supplied ApprovalGrant records** — ApprovalGrant is kernel-set throughout. Rejected per §Producer-vs-kernel-set authority fields.

- **Raw secret values or unsigned grantor declarations inline** — `grantor_principal_ref` is a typed FK; raw signed bytes belong in evidence_refs.

- **Schema-level Decision-ApprovalGrant producer-disjointness refinement** asserting "`minted_for_decision_id` FK target's `decided_by` MUST NOT equal this grant's `granted_by`" — rejected because cross-record equality cannot be schema-validated against host state per registry §Cross-context enforcement layer §Schema validation alone is not an enforcement layer rule. The schema layer commits the field shapes (`granted_by` allowlist enum + `minted_for_decision_id` FK + producer-equality-by-class-identity); Layer 1 mint API performs the comparison + chain-walk.

- **Schema-level `valid_until <= Decision.valid_until` cross-record inheritance refinement** — rejected because cross-record equality cannot be schema-validated against host state per registry §Cross-context enforcement layer §Schema validation alone is not an enforcement layer rule (mirrors ADR 0050 §Rejects pattern). The valid_until inheritance check requires looking up the FK Decision record at mint time, which is a Ring 1 mint API responsibility. The schema layer commits non-null `valid_until` shape; Ring 1 mint API performs the `valid_until <= Decision.valid_until` comparison at mint time. Closes v3 security B2.

- **Schema-level cross-record cardinality refinement** asserting "at most one `active` ApprovalGrant per `minted_for_decision_id`" — rejected at the Zod layer for the same reason. The schema commits the rule per §Decision; Ring 1 mint API enforces via single-writer commit ordering.

- **Self-approval rejection** (NEW §Rejects rule): `grantor_principal_ref` MUST NOT equal the consuming session's `principal_id` for grants whose underlying `OperationShape.operation_class` is in the non-readonly set `{destructive_git, external_control_plane_mutation, worktree_mutation, merge_or_push, cleanup_plan}`. Self-approval is permitted for grants whose underlying operation_class is in the readonly set `{read_only_diagnostic, agent_internal_state, workspace_verify}` (these operations don't escalate substrate state; an agent acknowledging its own diagnostic-tier observation is a no-op-strength operation).

  **Framing note (v4 tightening)**: v3 framed this as the "principal-side analog to D-037 producer-disjointness"; the framing over-claimed because D-037 is closed-enum producer-class equality (structurally enforced from a small allowlist) while self-approval is principal-string-equality (operationally enforced via canonicalization-aware Ring 1 mint API comparison at v1 since Principal entity is forward-reference). The two rules have **different enforcement strengths at v1**: D-037 is structurally complete; self-approval is enforcement-weaker until Principal entity lands. v4 commits both rules but acknowledges the strength differential.

  **Canonicalization-aware comparison rule** (v4 addition): the Ring 1 mint API string-comparison applies after canonical normalization (Unicode NFC + lowercase folding + leading/trailing-whitespace trimming) to defend against case/Unicode/whitespace evasion. The canonicalization rule lands in registry §Self-approval rejection rule registry change-set #7 and is required-by-implementation when Principal entity lands. Closes v3 security B4. **v1 posture limitation (MT-Sec-2 at acceptance)**: NFC normalization does NOT strip zero-width characters (U+200B ZWSP, U+200C ZWNJ, U+200D ZWJ, U+FEFF BOM, U+00AD soft-hyphen). The v1 string-comparison surface remains evadable by zero-width-character injection at the producer side. The typed-Principal comparison at workflow-sequencing investigation §Step 3 closes this v1 limitation structurally (FK-equality on a typed Principal entity replaces string-comparison; canonicalization rule survives as a normalization step in the typed comparison).

  Ring 1 mint API enforces at v1 by canonicalized string-comparison against the consuming session's principal_id. Rejection emits `Decision.reason_kind: 'self_approval_rejected'`.

- **`kernel_gateway` in `granted_by` allowlist** — rejected by design. Gateway re-derive is authoritative non-escalable; gateway does not mint grants. Producer-disjointness trivially satisfied for gateway-decided Decisions.

- **`kernel_dashboard` producer extension bundled into this ADR** — rejected per policy-reviewer scope discipline. Lands in future separate ADR together with pre-emptive grant infrastructure.

- **`tier_scope` column on grant_kind status table (v2/v3 attempt)** — rejected. v2 used kebab-case (Naming-discipline violation); v3 used lower_snake_case but introduced vocabulary collision (no `tier` field on `OperationShape` source) + dynamic-dispatch escalation surface (`inherited_from_gate`). v4 grounds forbidden-tier defense on `OperationShape.operation_class` source-enum closure + canonical policy YAML; the `operation_class_scope` column on grant_kind status table is documentation-only (reviewer cross-check; not a structural defense layer).

- **Same-audit-chain-step-only D-037 framing (v1 supersession claim)** — v3/v4 reframe as ADDITIVE. ADR 0049's same-step rule survives as the strict-distance case; this ADR extends to cross-step closure. v2's silent supersession framing withdrawn.

- **Producer-equality-by-delegation-chain** — rejected; producer equality is checked by class identity at the structurally-asserted `granted_by` value. Future delegating producers must structurally re-establish their own class identity.

- **Stale grants at consumption time** — gateway re-derive rejects with `'grant_expired_at_consumption'`.

- **Concurrent consume + revoke without deterministic resolution** — rejected by revoke-wins tiebreaker; race-loser produces TWO typed Decision records.

- **ApprovalGrant lifecycle in-place mutation** — grants are immutable once minted.

- **Multiple active ApprovalGrants for the same `minted_for_decision_id`** — cardinality discipline; Ring 1 mint API enforces.

- **Grant_kinds that open a `forbidden`-tier clearing path** — structurally impossible to declare because `OperationShape.operation_class` enum (the surface a grant clears) does not contain `'forbidden'`. The §Procedure rule's reviewer-discretion check anchors to this enum closure.

- **Authoring Ring 1 mint API, dashboard surface, or revocation workflow** — out of scope.

- **Authoring canonical policy YAML for grant-tier rules** — out of scope; Phase 2.5 lane in `system-config`.

### Future amendments

- **`kernel_dashboard` producer ADR + pre-emptive grant infrastructure** — separate forthcoming ADR adds `kernel_dashboard` to the kernel-trusted producer allowlist + the `approvalGrantProducerSchema` enum extension + the dashboard producer-class authority discipline + the dashboard human-grant minting contract + nullable `minted_for_decision_id` (re-introducing pre-emptive grants) + §Pre-emptive grant guardrails (FK-liveness re-validation + bounded valid_until ceiling + producer-class restriction allowlist) + granting-session attribution (`granted_in_execution_context_id` envelope field) + pre-emptive-specific reason_kind reservations (`preemptive_grant_unauthorized_producer`, `preemptive_grant_window_exceeded`, `preemptive_grant_fk_stale`) + `revoker_session_id` audit-event field for dashboard-initiated revocations.

- **Subsequent grant_kind extensions** land via schema PR following the §Procedure rule. Candidate grant_kinds:
  - `cleanup_plan_acknowledgment` (or similar) per ADR 0047 §Future amendments for class-I cleanup execution
  - Future grant_kinds derived from execute-lane stack work (M4)

- **Ring 1 mint API implementation** consumes the ApprovalGrant entity. Enforces D-037 producer-disjointness (additive cross-step + same-step) with walk-depth budget ≤ 64, cardinality discipline, charter inv. 6 via upstream operation_class enum closure, grant-state lifecycle, revocation race tiebreaker, consumption-time freshness re-check, self-approval rejection with canonicalization-aware comparison, valid_until cross-record inheritance check.

- **Dashboard human-grant minting surface** (Milestone 5) — after the `kernel_dashboard` producer + pre-emptive-infrastructure ADR lands.

- **Revocation workflow** — explicit grantor-initiated revocation lands at Ring 1 mint API + dashboard surface.

- **`Principal` Ring 0 entity** (M1 acceptance criterion #3) — `grantor_principal_ref` is a forward-reference. When `Principal` lands per workflow-sequencing investigation §Step 3, FK target becomes typed; self-approval string-comparison becomes typed comparison.

- **Walk-depth budget tuning** — v1 budget ceiling is ≤ 64 records (registered registry posture). Future ADRs may revise based on attack-class observations or operational evidence.

- **`Decision.reason_kind` Zod-defined value lift** — the 6 new reason_kind reservations from this ADR are registry-canonical pending Ring 1 mint API schema PR per ADR 0049 §Procedure rule.

- **`branch_ref` shape evolution** — v1 uses `gitBranchRefSchema` regex from `source-control-evidence.ts`. Future ADRs may tighten further (e.g., normalized form for reflog-style refs) based on operational evidence.

- **Reopen** if a future incident shows: v1 scope shapes inadequate, producer-disjointness rule needs additional defense, revocation tiebreaker behaviorally unworkable, consumption-time freshness check creates operational pain, self-approval canonicalization rule too restrictive or too permissive, operation_class enum closure as forbidden-tier defense surfaces unanticipated edges.

## Compliance

This ADR is Ring 0 docs-only at the ADR layer; the schema PR that follows is a Ring 0 schema-change PR per `.agents/skills/hcs-schema-change`. No cross-ring imports authored. No canonical policy YAML, runtime probes, dashboard route React components, MCP adapter contracts, hook bodies, charter invariant text changes, or Ring 1 mint API implementation in this commit. Registry-side changes (per the 11-item change-set in §Accepts) are bundled into this commit or a follow-on docs commit referencing this ADR. Complies with implementation charter v1.4.0.

**Implementation-detail acknowledgments** (per ADR 0049 + ADR 0050 precedents):

- `prior_audit_chain_link_hash` is NOT a schema field on the ApprovalGrant record; it is an input to the `audit_chain_link_hash` canonical-concatenation computation at Ring 1 mint time. Chain-link continuity is enforced by Ring 1 storage on insert (Milestone 3 audit-events table).
- Genesis-collision defense for the same `minted_for_decision_id` audit-chain root is a Milestone 3 audit-events table unique-constraint commitment.
- **Canonical-concatenation field-order convention** (v4 length-prefix discipline): per ADR 0050's per-entity-orderings principle. ADR 0051 places identity + discriminator first, binding fields second, lifecycle third, evidence fourth, chain link last. **The `||` operator in the canonical-concatenation expression denotes length-prefix-encoded concatenation, NOT naive byte concatenation**: each variable-length field is encoded as `varint(byte_length) || field_bytes` to prevent concatenation-collision attacks (e.g., `grant_kind: 'a'` + `gate_id: 'bc'` vs `grant_kind: 'ab'` + `gate_id: 'c'` produce different canonical encodings under length-prefix). This rule applies to ALL variable-length fields: `grant_kind` enum strings, `canonical(scope)` discriminated-union encoding, `minted_for_decision_id` UUID strings, `grantor_principal_ref` strings, `granted_by` enum strings, `granted_at` / `valid_until` ISO strings, `execution_context_id` strings, `grant_state` enum strings, `canonical(evidence_refs)` array encoding, `prior_audit_chain_link_hash` digest. Fixed-length fields (e.g., the sha256 digest at chain-link position) carry length-prefix consistency for serializer simplicity. **Registry change-set #9 registers this discipline as a posture rule for ADR 0049 (Decision), ADR 0050 (WorkspaceContext), and ADR 0051 (ApprovalGrant)** — all three foundational-entity ADRs share the canonical-concatenation pattern and inherit the length-prefix rule retroactively. Closes v3 security B3.
- `canonical(scope)` encoding is deferred to Ring 1 mint API; the schema commits the typed structure (discriminated union), and Ring 1 commits a deterministic serialization for hash-determinism that applies the length-prefix rule per branch.
- **Audit-event session identity**: ApprovalGrant lifecycle audit events (consume / revoke / expire / consume_after_revoke_attempt) carry an `event_session_id` field on the audit-event record (NOT on the ApprovalGrant Ring 0 entity); `event_session_id` identifies the session that initiated the lifecycle action. At v1 (pre-emptive deferred), `event_session_id` equals the ApprovalGrant's `execution_context_id`-binding session for non-race cases; for revoke-vs-consume races, `event_session_id` distinguishes the consume-initiating session from the revoke-initiating session. The forthcoming `kernel_dashboard` producer ADR adds `revoker_session_id` for dashboard-initiated revocations. Audit-event entity lands at Milestone 3 audit-events table.
- **Cross-step chain-walk bounds**: the Ring 1 mint API enforces D-037 cross-step extension by walking the `derived_from` closure to detect chain-relation. The walk is bounded by a **walk-depth budget MUST NOT exceed 64 records** (v1 ceiling; future ADR may revise based on attack-class evidence). The walk **rejects cycles** at Ring 1 (MT-Sec-1 at acceptance: ADR 0019 v3 §Acceptance defers cycle-detection rules to Ring 1 mint API (Milestone 2 / Milestone 4); ADR 0051 commits the Ring 1 rejection with `Decision.reason_kind: 'audit_chain_corruption_detected'`; the schema layer does not structurally prohibit cycles).
- **Producer equality by class identity, not delegation**: the producer-disjointness check compares the structurally-asserted `granted_by` value to `Decision.decided_by` by class identity. Any future producer that delegates internally must structurally re-establish its own class identity at the mint API contract.
- **v1 grantor_principal_ref pre-typed-Principal posture**: at v1 (Principal entity is forward-reference and not built), `grantor_principal_ref` is a `string` shape with FK resolution deferred. Ring 1 mint API enforces self-approval rejection via canonicalization-aware (Unicode NFC + lowercase folding + whitespace trim) string-comparison against the consuming session's principal_id (also a string at v1). When Principal entity lands (per workflow-sequencing investigation §Step 3), both fields become typed and the comparison becomes typed (canonicalization rule carries forward as a normalization step in the typed comparison).
- **Envelope-level superRefine vs ref-schema reuse**: the `qualityGateEvidenceRefSchema` reuse in scope branches provides the **chain-aware preview shape** (adds `evidence_chain_refs` array). The **inv. 18 chain-walk rejection refinement** lives at the `approvalGrantSchema` envelope-level superRefine (this ADR's schema PR commits the refinement). The two layers are distinct: shape reuse for type alignment with QualityGate; rejection refinement for inv. 18 enforcement at the entity that owns the rule (ApprovalGrant authorizes Decision overrides, so the chain-walk MUST fire unconditionally at every grant state, not gated by gate_state as the `qualityGateSchema` envelope does).

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md` v1.4.0 — invariants 1, 4, 6, 7, 8, 17, 18, 19
- Decision ledger: `DECISIONS.md` (D-037 producer-disjointness rule from ADR 0049; D-row to be added at acceptance)
- Related ADRs:
  - ADR 0019 v3 (chain-promotion rule; four-class `derived_from` closure; cycle-rejection in chain construction)
  - ADR 0028 (kernel_broker + mint_api producers; ADR 0049 audit-chain coverage)
  - ADR 0030 v2 (Q-006 Stage 2 source-control evidence; reserves `worktree_clean_acknowledgment` and `pr_absence_acknowledgment` grant kinds)
  - ADR 0035 v2 (Q-007(g) QualityGate standalone entity; reserves `gate_evidence_acknowledgment` grant kind; canonical QualityGate identifier is `gate_id`; `qualityGateEvidenceRefSchema` source for chain-aware preview shape)
  - ADR 0036 (Q-009 workspace manifest projection; `human_dashboard_grant` deletion authority kind references ApprovalGrant via FK; composition rule per §Accepts; class-I cleanup defers per ADR 0047 §Future amendments)
  - ADR 0047 (cleanup-plan composition; §Future amendments references future ApprovalGrant lifecycle for class-I cleanup execution)
  - ADR 0049 (Decision Ring 0 entity introduction; D-037 producer-disjointness rule same-step framing; §Procedure for adding a new reason_kind value rule pattern; outcome-compatibility classification format; envelope-level superRefine chain-walk precedent)
  - ADR 0050 (WorkspaceContext Ring 0 entity introduction; envelope-level kernel-set framing; canonical-concatenation per-entity-orderings principle; named-enum-producer-schema pattern; forward-looking registry citation pattern; cross-record refinement §Rejects pattern; canonical(path) normalization precedent)
- Registry: `docs/host-capability-substrate/ontology-registry.md` v0.4.13 (forward-looking citation per ADR 0050's pattern; current file frontmatter v0.4.11; ADR 0049 reserves v0.4.12 pending docs commit; ADR 0050 reserves v0.4.13 pending docs commit; ADR 0051 reserves v0.4.14 pending docs commit) — §Authority discipline (line 279+), §Cross-context enforcement layer (line 546+), §Audit-chain coverage of rejections (line 602+), §Subject-kind grounding requirement (line 443+), §Kernel-trusted producer allowlist final state (line 798+), §Decision.required_grant_kind reservations (line 1363+), §Naming-discipline §Sub-rule 9 enum-value casing (line 203 — `lower_snake_case` mandate for new enum values; MT-2 at acceptance: corrected from stale citation `206`)
- Workflow-sequencing investigation: `docs/host-capability-substrate/research/local/2026-05-10-workflow-sequencing-investigation.md` §Step 1 entity #3 (ApprovalGrant)
- Outstanding-work sequencing workflow: `docs/host-capability-substrate/research/local/2026-05-09-outstanding-work-sequencing-workflow.md`
- Implementation rules: `IMPLEMENT.md` §Required subagent reviews, §Change classes
- Plan: `PLAN.md` §Milestone 1 acceptance (line 672 — 22 canonical Ring 0 entities; MT-1 at acceptance: updated from stale citation `578` to current `672`; ADR 0049 + ADR 0050 carry the same stale citation and warrant a coordinated docs-only follow-up commit)
- Schema-change skill: `.agents/skills/hcs-schema-change/SKILL.md`
- Live policy authoritative source (out-of-scope for this ADR; Phase 2.5 lane): `~/Organizations/jefahnierocks/system-config/policies/host-capability-substrate/` — canonical operation_class → tier mapping; forbidden-tier execution-path rejection
- Schema source for related entities:
  - `packages/schemas/src/entities/operation-shape.ts:10-21` (`operationShapeOperationClassSchema` — 8-value closed enum, no `forbidden`; charter inv. 6 source-layer defense anchor)
  - `packages/schemas/src/entities/operation-shape.ts:141` (`humanDashboardGrantDeletionAuthorityRefSchema` references `approval_grant_id`)
  - `packages/schemas/src/entities/quality-gate.ts:25-35` (`qualityGateOperationClassSchema` — gate operation_class enum)
  - `packages/schemas/src/entities/quality-gate.ts:129-134` (`qualityGateEvidenceRefSchema` — chain-aware preview shape; reused by ApprovalGrant scope branches)
  - `packages/schemas/src/entities/quality-gate.ts:139` (canonical `gate_id` identifier)
  - `packages/schemas/src/entities/quality-gate.ts:152-200` (`qualityGateSchema` envelope-level superRefine — chain-walk rejection precedent; ApprovalGrant envelope superRefine mirrors this)
  - `packages/schemas/src/entities/source-control-evidence.ts:95-98` (`gitBranchRefSchema` — regex-validated git-ref-grammar form; reused by `pr_absence_acknowledgment.branch_ref`)
  - `packages/schemas/src/entities/evidence.ts:38` (`'approval_grant'` Evidence.subject_kind already present)
  - `packages/schemas/src/entities/agent-client.ts` (schema pattern reference)
- Currently-landed schemaVersion literals: `evidenceSchemaVersionSchema`, `knowledgeSourceSchemaVersionSchema`, `operationShapeSchemaVersionSchema` (sibling co-commitments `decisionSchemaVersionSchema` (ADR 0049) and `workspaceContextSchemaVersionSchema` (ADR 0050) not yet landed in source per their schema PR deferrals)

### External

- None directly; this ADR composes existing internal posture.
