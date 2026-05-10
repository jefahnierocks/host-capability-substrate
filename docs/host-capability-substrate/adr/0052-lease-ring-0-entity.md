---
adr_number: 0052
title: Lease Ring 0 entity introduction
status: proposed
date: 2026-05-10
charter_version: 1.4.0
tags: [lease, ring-0, milestone-1, foundational-entity, lease-kind, lease-state, worktree-lease, charter-v1-4-0, registry-v0-4-14-pending-v0-4-15, workflow-sequencing-step-1, adr-0031-mirror, envelope-superrefine-chain-walk, canonical-concatenation-length-prefix, force-break-separation-of-duties]
---

# ADR 0052: `Lease` Ring 0 entity introduction

## Status

`accepted`

Accepted 2026-05-10 (v1 ready-for-acceptance from `hcs-architect`, `hcs-policy-reviewer`, `hcs-security-reviewer`; `hcs-ontology-reviewer` returned 2 mechanical-text-only blocking items + 5 non-blocking, all absorbed as mechanical tweaks at acceptance). v1 preemptively absorbed the ADR 0051 v1→v4 cycle lessons: envelope-level superRefine for chain-walk rejection, canonical-concatenation length-prefix discipline, no entity-level `tier_scope` column (forbidden-tier defense grounded upstream on `OperationShape.operation_class` source-enum closure + canonical policy YAML), `operation_class_scope` documentation column, lower_snake_case enum compliance, additive D-037-style producer-disjointness rule, walk-depth budget ≤ 64 + cycle-rejection, force-break-grant_kind extension deferred to coordinated `kernel_dashboard` producer ADR change-set. Mechanical tweaks at acceptance: (MT-1) §Accepts §Authority-discipline posture field-count math corrected from `Total: 14 fields` to `Total: 15 fields` (12 kernel-set + 3 producer-asserted-kernel-verifiable; scope union counted as one envelope-level field with worktree-branch sub-fields enumerated separately under producer-asserted-kernel-verifiable for granular declaration); (MT-2) §Accepts adds explicit "`Evidence.subject_kind: 'lease'` already Zod-defined at `packages/schemas/src/entities/evidence.ts:41`; this ADR does not modify `evidenceSubjectKindSchema` and does not bump `Evidence.schema_version`" entry mirroring ADR 0051 v4 line 186 framing for `'approval_grant'`; (MT-3) §Compliance implementation-detail acknowledgment distinguishes UUID-byte-equality `session_id` comparison from ADR 0051 v4's principal-string-canonicalization comparison; (MT-4) §Future amendments adds forward-look that future lease_kind extensions whose scope branches carry `acknowledged_*_evidence_ref` fields must extend the `leaseSchema` envelope-level superRefine to walk scope-branch evidence refs (ADR 0051 v4 precedent for ApprovalGrant scope branches); (MT-5) §Procedure step 5 sandbox-acquire-rule clarification — "no sandbox-acquire rule" is NOT a valid §Procedure outcome; future lease_kinds MUST explicitly commit "blocked" or "permitted with rationale". Additional cosmetic tweaks consolidated in this acceptance commit (line citations, cross-references, registry sequencing notes). Smoothest cycle of the foundational-entity train (v1 → accepted in 1 revision; ADR 0049 took 2 cycles, ADR 0050 took 3 cycles, ADR 0051 took 4 cycles) — the preemptive-absorption strategy worked.

## Date

2026-05-10

## Charter version

Written against charter v1.4.0 and `docs/host-capability-substrate/ontology-registry.md` v0.4.14 (forward-looking citation per the established pattern — ADR 0049 reserves v0.4.12 pending docs commit, ADR 0050 reserves v0.4.13 pending docs commit, ADR 0051 reserves v0.4.14 pending docs commit, this ADR continues the chain by reserving v0.4.15 for its own registry change-set docs commit to land after ADR 0049 + ADR 0050 + ADR 0051 registry commits land in sequence).

## Reviews

This ADR introduces the fourth foundational Ring 0 entity (`Lease`) per the 2026-05-10 workflow-sequencing investigation §Step 1 (entity #4 of 5; Decision #1 via ADR 0049 / D-037; WorkspaceContext #2 via ADR 0050 / D-038; ApprovalGrant #3 via ADR 0051 / D-039; Lease #4; Run #5). Required reviewer dispatch per `IMPLEMENT.md` §Required subagent reviews:

- `hcs-architect` — mandatory
- `hcs-ontology-reviewer` — mandatory; ADR introduces a new Ring 0 entity with a `lease_kind` enum discriminator + discriminated `scope` union + `lease_state` lifecycle enum + producer allowlist + audit-chain integration
- `hcs-policy-reviewer` — mandatory; `Lease` records authorize host-mutation operations (worktree leases gate destructive Git); charter inv. 6 forbidden-tier non-escalability preservation; charter inv. 8 sandbox-derived lease rejection
- `hcs-security-reviewer` — mandatory; `Lease` carries audit-chain integrity, principal authorization, holder-displacement (force-break) separation-of-duties, lease-replay defense, consume-after-expire race conditions; security implications around stuck-lease force-break are non-trivial

## Context

The 2026-05-10 workflow-sequencing investigation §Step 1 names `Lease` as entity #4 of 5 foundational Ring 0 entities. `Lease` is the typed envelope for session-scoped resource holds that gate host-state mutations. The substrate's existing rules reference Lease records but cannot yet enforce structurally:

- **ADR 0031 v1 (Q-008(d) worktree-ownership composition)** commits a substantial Lease field-shape posture (see §Decision below). This ADR lands the typed Ring 0 entity schema enforcing those commitments.
- **Charter v1.4.0 inv. 4** (audit logging is internal side effect): every Lease lifecycle transition emits a typed Decision in the audit chain.
- **Charter inv. 6** (forbidden-tier non-escalable): preserved structurally **upstream of Lease** at the `OperationShape.operation_class` source-enum closure (8-value closed enum at `packages/schemas/src/entities/operation-shape.ts:10-21`; no `'forbidden'` value) + canonical policy YAML (system-config Phase 2.5 lane). v4-of-ADR-0051 scope-back precedent applies: no entity-level `tier_scope` column; `operation_class_scope` is documentation-only column for reviewer cross-check.
- **Charter inv. 7** (execute lane discipline): leases + approval grants + audit + dashboard + leases together. Lease is a co-leg of the execute-lane stack.
- **Charter inv. 8** (no sandbox→stronger): Layer 1 mint API rejects `Lease` acquire with `lease_kind: 'worktree'` when the requesting session's `ExecutionContext.sandbox != 'none'` (charter inv. 8 promotion rule; per ADR 0031 v1).
- **Charter inv. 17** (execution context declared): `Lease.execution_context_id` is kernel-set.
- **Charter inv. 18** (chain-walk rejection): Lease lifecycle Decisions and the Lease record's `evidence_refs` participate in chain-walk refinement via `leaseSchema` envelope-level superRefine.
- **Charter inv. 19** (freshness-bound + execution-context-bound): `valid_until` non-null + Phase 1 interim 24-hour ceiling per ADR 0031 v1 §Lease entity field-shape posture commitment.
- **D-037 producer-disjointness rule** (ADR 0049) and its additive cross-step extension (ADR 0051) apply to Lease records: a Lease MUST NOT be acquired by the same producer class that emitted the `Decision` authorizing the underlying operation. The Lease entity commits the `acquired_by` allowlist enum + the `Decision-authorizing-operation` FK; Layer 1 mint API performs the producer comparison + chain-relation walk.
- **Force-break separation of duties** (ADR 0031 v1 §Lease lifecycle §Force-break): Layer 1 mint API rejects force-break grants whose minter equals the target lease's `held_by_session_id`. Holder + minter asymmetry is structurally enforced. **Phase 1 interim posture**: force-break grants require human approval at the dashboard layer, not agent-mintable. The `worktree_lease_force_break_acknowledgment` grant_kind extension is deferred to the future `kernel_dashboard` producer ADR as a coordinated change-set per ADR 0051 v4 scope-back pattern.
- **`worktree_path` canonicalization** (ADR 0031 v1 Mechanical Tweak #2 / Security-D): Layer 1 canonicalizes `worktree_path` (resolves `..` traversal + symlinks) before uniqueness check. Two producer-asserted paths that resolve to the same physical worktree cannot create two distinct active Lease records.
- **CoordinationFact `subject_kind: 'worktree'` + `predicate_kind: 'leased_to'` FK** (ADR 0019 v3 + ADR 0031 v1): the worktree-ownership CoordinationFact cites the Lease record as authority; Lease drift triggers `coordination_fact_worktree_drift` rejection per ADR 0031 v1.

**Out-of-scope for v1 (deferred to future schema PRs per the registered §Procedure rule)**: `lease_kind` enum extensions (`credential_audience`, `external_target`). ADR 0031 v1 §Out of scope reserves these as registry-canonical lease_kinds requiring ontology-controlled vocabulary updates. v1 Zod enum is `['worktree']` only; future schema PRs add new lease_kinds following the §Procedure rule (mirrors ADR 0049 Zod-defined-vs-registry-canonical pattern). v1 `scope` discriminated union has only the `worktree` branch.

**Out-of-scope for v1 (deferred to future coordinated change-set)**: `worktree_lease_force_break_acknowledgment` grant_kind extension. This grant_kind is Phase 1 interim posture human-dashboard-only per ADR 0031 v1; the producer for it is `kernel_dashboard`, which is itself deferred per ADR 0051 v4 scope discipline. Both land together as a coordinated future-ADR change-set (the `kernel_dashboard` producer ADR adds: producer allowlist extension + pre-emptive grant infrastructure from ADR 0051 v4 §Future amendments + `worktree_lease_force_break_acknowledgment` grant_kind).

The constraint stack: charter v1.4.0 inv. 1 (canonical-typed-evidence), inv. 4 (audit logging), inv. 6 (forbidden-tier non-escalable — upstream at operation_class enum closure), inv. 7 (execute lane discipline), inv. 8 (no sandbox→stronger — `worktree` lease sandbox-acquire rejection), inv. 17 (execution context declared), inv. 18 (chain-walk via envelope superRefine), inv. 19 (freshness-bound + execution-context-bound + Phase 1 24-hour ceiling); ADR 0019 v3 §Chain promotion rule; ADR 0019 v3 §Predicate-kind vocabulary `leased_to`; ADR 0029 v2 §Closed-list fail-mode tightening; ADR 0031 v1 §Lease entity field-shape posture commitment + §Lease lifecycle + §Cross-context binding rules per Ring 1 layer + §Authority discipline + §Predicate-kind vocabulary candidates; ADR 0049 D-037 producer-disjointness; ADR 0051 v4 D-037 additive cross-step extension + scope-back pattern (no tier_scope column) + envelope-level superRefine chain-walk pattern + canonical-concatenation length-prefix discipline; registry §Naming-discipline Sub-rule 9 enum-value casing.

## Options considered

### Option A — Single-`lease_kind` v1 (`worktree` only) with explicit forward-looking enum extensibility (this ADR's choice)

`leaseKindSchema = z.enum(['worktree'])` at v1; `credential_audience` and `external_target` are registry-canonical reservations pending future schema PRs per the §Procedure rule for adding new lease_kind values. `scope` discriminated union has one branch (worktree). Future schema PRs follow the §Procedure rule (mirrors ADR 0049 + ADR 0051 v4 procedural patterns).

**Pros:**

- Smallest v1 scope; aligns with actual Phase 1 implementation (all Phase 1 leases are worktree per ADR 0031 v1 line 266-267)
- Avoids the "enum value committed without scope semantics" trap from ADR 0051 v2/v3 (inherited_from_gate)
- Future lease_kind extensions follow the §Procedure rule with full reviewer dispatch + tier scope classification + scope-shape commitment

**Cons:**

- ADR 0031 v1 commits the 3-value enum at the registry-canonical level; v1 Zod enum is narrower than registry registration

### Option B — Three-`lease_kind` v1 (`worktree | credential_audience | external_target`) with minimal placeholder scope branches

Match ADR 0031 v1's enum commitment exactly; `scope` has 3 branches at v1 with minimal placeholder shapes for credential_audience + external_target.

**Cons:**

- Same "enum value without scope semantics" trap that ADR 0051 v2/v3 hit; the 2 future lease_kinds have no committed scope-shape semantics and would force premature design decisions
- Future schema PRs that extend credential_audience or external_target would have to re-design the placeholder vs. extend it; either path causes churn
- ADR 0031 v1 §Out of scope explicitly defers Zod schema source for both

### Option C — Single-`lease_kind` v1 with structural defense via `tier_scope` column (rejected per ADR 0051 v4 scope-back lesson)

Per ADR 0051 v4 scope-back: don't add entity-level structural defense layers when defense lives upstream at the source-enum closure. The `OperationShape.operation_class` enum closure already provides charter inv. 6 forbidden-tier non-escalability defense; adding a `tier_scope` column on the Lease entity would (a) duplicate defense without adding coverage and (b) face the same vocabulary-collision pitfalls as ADR 0051 v3.

**Rejected.**

## Decision

**Option A.** Single-`lease_kind` v1 (`worktree` only) with explicit forward-looking enum extensibility via the §Procedure rule for adding new lease_kind values.

v1 Lease entity carries:

- `schema_version` — entity-specific literal `'0.1.0'` via `leaseSchemaVersionSchema = z.literal('0.1.0')`. Precedent set includes `evidenceSchemaVersionSchema`, `knowledgeSourceSchemaVersionSchema`, and `operationShapeSchemaVersionSchema` (all landed in source). `decisionSchemaVersionSchema` (ADR 0049 co-commitment), `workspaceContextSchemaVersionSchema` (ADR 0050 co-commitment), and `approvalGrantSchemaVersionSchema` (ADR 0051 co-commitment) are sibling-ADR co-commitments not yet landed in source.
- `lease_id` — `entityIdSchema` (kernel-set)
- `lease_kind` — `leaseKindSchema = z.enum(['worktree'])` (kernel-set; v1 closed enum, single value; extensible per the registered §Procedure rule. Registry-canonical reservations for `credential_audience` and `external_target` per ADR 0031 v1 §Out of scope remain pending future schema PRs.)
- `scope` — discriminated union on `lease_kind`:
  - `worktree`: `{ lease_kind: 'worktree', repository_id: entityIdSchema, workspace_context_id: entityIdSchema, worktree_path: z.string().min(1) }` — `worktree_path` is producer-asserted, kernel-verifiable per ADR 0031 v1 §Authority discipline. Layer 1 mint API canonicalizes `worktree_path` per ADR 0031 v1 Mechanical Tweak #2 / Security-D before the uniqueness check on `(repository_id, canonical(worktree_path), lease_state == 'active')`.
- `held_by_session_id` — `entityIdSchema` (kernel-set; FK to the `Session` holding the lease per ADR 0031 v1 §Authority discipline)
- `held_by_agent_client_id` — `entityIdSchema` (kernel-set; FK to the `AgentClient` the holding session belongs to per registry §canonical attribution; ADR 0031 v1 line 270-272)
- `acquired_by` — `leaseProducerSchema = z.enum(['mint_api', 'kernel_broker'])` (kernel-set; named enum schema for forward-compatible allowlist widening, mirroring `workspaceContextProducerSchema` Option 2 pattern from ADR 0050 + `approvalGrantProducerSchema` from ADR 0051 v4). v1 allowlist is `[mint_api, kernel_broker]` only. **`kernel_gateway` is intentionally excluded from `acquired_by`** by design: the gateway re-derive is the authoritative non-escalable layer; the gateway does not mint leases, only re-derives Decisions. Producer-disjointness check is trivially satisfied for gateway-decided Decisions because `kernel_gateway ∉ acquired_by allowlist`; gateway-decided Decisions inherit the gateway re-derive non-escalability defense (the two defenses compose, mirrors ADR 0051 v4). `kernel_dashboard` deferred to its own producer ADR per policy-reviewer scope discipline.
- `acquired_at` — `isoDateTimeSchema` (kernel-set; per ADR 0031 v1 §Authority discipline)
- `valid_until` — `isoDateTimeSchema` (producer-asserted but kernel-verifiable per ADR 0031 v1 §Authority discipline; **non-null per inv. 19**; ApprovalGrants are freshness-bound). **Phase 1 interim 24-hour ceiling** (per ADR 0031 v1 line 274-279): Layer 1 mint API rejects any `Lease` record whose `valid_until` is more than 24 hours past `acquired_at`. The 24-hour ceiling is a v1 defensive default; future ADRs may revise based on operational evidence.
- `released_at` — `isoDateTimeSchema.nullable()` (kernel-set; null while `lease_state == 'active'`; set on lifecycle transition to `'released'` / `'expired'` / `'force_broken'`)
- `execution_context_id` — `entityIdSchema` (kernel-set per inv. 19; Layer 1 mint API enforces `Lease.execution_context_id == Session.execution_context_id` of the requesting session per ADR 0031 v1 §Cross-context binding rules)
- `lease_state` — `leaseStateSchema = z.enum(['active', 'expired', 'released', 'force_broken'])` (kernel-set; mirrors `agentClientStateSchema` / `workspaceContextStateSchema` / `approvalGrantStateSchema` lifecycle patterns; 4 values per ADR 0031 v1)
- `force_break_grant_id` — `entityIdSchema.nullable()` (kernel-set; null unless `lease_state == 'force_broken'`. FK to an `ApprovalGrant` with `grant_kind: 'worktree_lease_force_break_acknowledgment'` — this grant_kind is **deferred to the future `kernel_dashboard` producer ADR coordinated change-set** per Phase 1 interim posture. At v1, no valid `force_break_grant_id` value can exist because no producer is authorized to mint force-break grants; v1 schema permits `null` but Ring 1 mint API rejects any non-null value until the future grant_kind extension lands.)
- `audit_chain_link_hash` — `sha256DigestSchema` (required, non-empty, sha256-shape-validated; mirrors `decisionSchema.audit_chain_link_hash` + `workspaceContextSchema.audit_chain_link_hash` + `approvalGrantSchema.audit_chain_link_hash` co-commitments). Hash covers the canonical concatenation of `lease_id || lease_kind || canonical(scope) || held_by_session_id || held_by_agent_client_id || acquired_by || acquired_at || valid_until || (released_at || '') || execution_context_id || lease_state || (force_break_grant_id || '') || canonical(evidence_refs) || prior_audit_chain_link_hash`. **The `||` notation denotes length-prefix-encoded concatenation** per ADR 0051 v4 retroactive posture rule (each variable-length field encoded as `varint(byte_length) || field_bytes`; defends against concatenation-collision attack class). The `'' for null` substitution rule applies to `released_at` and `force_break_grant_id` per ADR 0049 + ADR 0050 + ADR 0051 jointly committed posture. `schema_version` is intentionally excluded from the canonical concatenation per ADR 0049 + ADR 0050 + ADR 0051 precedent. Genesis Lease policy: same `'GENESIS'` sentinel rule.
- `evidence_refs` — chain-aware references mirroring `qualityGateEvidenceRefSchema` shape. **Chain-walk rejection refinement lives at the `leaseSchema` envelope-level superRefine** (mirrors `decisionSchema` + `qualityGateSchema` + `approvalGrantSchema` precedents). The envelope-level superRefine walks UNCONDITIONALLY (no `lease_state`-style gating — Lease records gate host-mutation operations at all states; the rejection must fire unconditionally) and rejects: direct `KnowledgeChunk` references; `Evidence` refs with `authority: 'sandbox-observation' | 'self-asserted'`; unpromoted `coordination_fact` / `derived_summary` chain refs (per ADR 0019 v3 four-class `derived_from` closure). The walk applies uniformly across envelope `evidence_refs` AND scope-payload (worktree scope's evidence is referenced via envelope `evidence_refs`; v1 worktree scope does not have a separate `acknowledged_*_evidence_ref` field, so the walk fires only on envelope `evidence_refs` at v1).

**Cardinality discipline** (committed inline; mirrors ADR 0031 v1 Mechanical Tweak #6 / Security-G): for `lease_kind: 'worktree'`, at most one `active` Lease per `(repository_id, canonical(worktree_path))`. Layer 1 mint API enforces via atomic insert with a unique constraint on `(repository_id, canonical(worktree_path), lease_state == 'active')`; concurrent acquire attempts produce exactly one success and one `worktree_lease_held_by_other_session` rejection per ADR 0031 v1 §Conflict resolution patterns. The schema layer commits the rule per §Decision; Ring 1 mint API enforces (cross-record cardinality is not schema-enforceable; see §Rejects §Cross-record cardinality refinement). Future lease_kind extensions commit their own cardinality discipline via the §Procedure rule.

**Authority-discipline posture**: Lease is **envelope-level kernel-set with field-level exceptions** per ADR 0031 v1 §Authority discipline. Kernel-set: `schema_version`, `lease_id`, `held_by_session_id`, `held_by_agent_client_id`, `acquired_by`, `acquired_at`, `released_at`, `execution_context_id`, `lease_state`, `force_break_grant_id`, `audit_chain_link_hash`, `evidence_refs`. Producer-asserted-kernel-verifiable: `lease_kind`, `scope` (worktree branch's `repository_id`, `workspace_context_id`, `worktree_path`), `valid_until`. Layer 1 mint API verifies producer-asserted values per ADR 0031 v1 §Authority discipline (filesystem stat for `worktree_path`, `WorkspaceContext` resolution for `workspace_context_id`, etc.); rejection emits `Decision.reason_kind: 'lease_producer_assertion_unverifiable'` (NEW reservation, see §Accepts).

**Cross-context binding** (charter inv. 19): `Lease.execution_context_id` is kernel-set; Layer 1 mint API enforces `Lease.execution_context_id == Session.execution_context_id` of the requesting session per ADR 0031 v1 §Cross-context binding rules. Cross-context substitution rejected per registry §Cross-context enforcement layer.

### Sandbox-derived lease rejection (charter inv. 8)

Per ADR 0031 v1 §Sandbox-derived lease rejection (Security-F): Layer 1 mint API rejects `Lease` acquire with `lease_kind: 'worktree'` when the requesting session's `ExecutionContext.sandbox != 'none'`. Worktree leases mediate destructive host mutations; allowing a sandbox-execution session to acquire one would promote a sandbox-observation authority to a host-authoritative side effect, violating charter inv. 8. Sandbox-execution sessions can acquire other (future) `lease_kind` values per their canonical-policy rules; only `worktree` leases are blocked at v1.

Rejection emits `Decision.reason_kind: 'lease_acquire_sandbox_rejected'` (NEW reservation, see §Accepts).

### Lease lifecycle (4 typed transitions, supersession-via-evidence_refs)

Per ADR 0031 v1 §Lease lifecycle. Each transition produces a typed `Decision` in the audit chain; the Lease record itself is immutable once minted (state changes via NEW Lease record citing the prior in `evidence_refs`, mirroring ADR 0049 + ADR 0050 + ADR 0051 supersession-via-evidence_refs pattern).

- **Acquire** (`lease_state: null → active`): Layer 1 mint API creates the Lease record + emits Decision (`transition_kind: 'acquire'`). Cardinality + cross-context + sandbox-rejection + producer-disjointness rules apply.
- **Release** (`lease_state: active → released`): Layer 1 mint API rejects release attempts unless `requesting_session_id == held_by_session_id` (only the holder can release; non-holders use force-break-glass). Sets `released_at`. Decision (`transition_kind: 'release'`). Rejection of unauthorized release emits `Decision.reason_kind: 'lease_release_unauthorized'` (NEW reservation).
- **Expiry** (`lease_state: active → expired`): kernel-detected at Layer 2 broker FSM re-check or Layer 3 gateway re-derive when `valid_until` passes. Sets `released_at` to `valid_until`. Decision (`transition_kind: 'expiry'`).
- **Force-break** (`lease_state: active → force_broken`): consumption of a `worktree_lease_force_break_acknowledgment` grant by the requesting (NOT the original) session. **Phase 1 interim posture**: force-break grants are human-dashboard-minted only (not agent-mintable). At v1, no producer is authorized to mint this grant_kind (it lands together with `kernel_dashboard` producer extension as a coordinated change-set). Layer 1 mint API rejects force-break grants whose minter equals the target lease's `held_by_session_id` (separation of duties; mirrors ADR 0019 v3 producer-equals-verifier prohibition). Sets `force_break_grant_id`. Decision (`transition_kind: 'force_break'`) with `evidence_refs` to the prior acquire Decision (preserves holder lineage).

### Producer-disjointness rule (D-037 additive extension to Lease)

ADR 0049's D-037 producer-disjointness rule + ADR 0051 v4's additive cross-step extension are extended to Lease acquisition: a Lease acquire MUST NOT be performed by a producer class equal to the `Decision.decided_by` of the Decision that authorized the operation requesting the lease, when both records share a chain-relation (one is in the other's `derived_from` closure transitively or vice versa). Producer equality by class identity, not by delegation chain. Ring 1 mint API enforces by walking the `derived_from` closure (bounded by walk-depth budget ≤ 64 records; cycle-rejection via `audit_chain_corruption_detected` per ADR 0051 v4). Rejection emits `Decision.reason_kind: 'producer_disjointness_violation'` (already reserved per ADR 0051 v4).

**v1 producer-disjointness scope-acknowledgment** (mirrors ADR 0051 v4): with `acquired_by` allowlist `[mint_api, kernel_broker]` (2 lease-acquiring producers) and `decided_by` allowlist `[mint_api, kernel_broker, kernel_gateway]` (3 producers per ADR 0049), the defense is forced-binary at v1 but structurally complete because gateway-decided Decisions inherit the gateway re-derive non-escalability layer.

## Consequences

### Accepts

- **`Lease` Ring 0 entity introduced** at `packages/schemas/src/entities/lease.ts` with `schema_version: '0.1.0'`. Closes M1 acceptance criterion #19 (`Lease` in canonical 22-entity list). **`leaseSchema` commits an envelope-level superRefine** mirroring `decisionSchema` + `qualityGateSchema` + `approvalGrantSchema` precedents that walks `evidence_refs` unconditionally per charter inv. 18.

- **Initial `leaseKindSchema` Zod-defined enum** with one value (`'worktree'`) — closes ADR 0031 v1 §Lease entity field-shape posture commitment for the worktree composition. Registry-canonical reservations for `credential_audience` and `external_target` per ADR 0031 v1 §Out of scope remain pending future schema PRs per the §Procedure rule. Mirrors ADR 0049's 15-Zod-defined-out-of-35+-registered + ADR 0051 v4's 3-Zod-defined patterns.

- **Discriminated `scope` union** with one branch at v1 (`worktree`): `{ lease_kind: 'worktree', repository_id, workspace_context_id, worktree_path }`. Future lease_kind extensions add scope branches per the registered §Procedure rule. `worktree_path` is producer-asserted, kernel-verifiable; Layer 1 canonicalizes path per ADR 0031 v1 Mechanical Tweak #2 / Security-D.

- **Lease lifecycle (4 transitions, supersession-via-evidence_refs)**: acquire / release / expiry / force-break. Lifecycle transitions are immutable: state changes via NEW Lease record citing the prior in `evidence_refs` (mirrors ADR 0049 + ADR 0050 + ADR 0051). Each transition produces a typed Decision in the audit chain per ADR 0031 v1 §Lease lifecycle + charter inv. 4.

- **Cardinality discipline** (worktree-specific, per §Decision): at most one `active` Lease per `(repository_id, canonical(worktree_path))`. Layer 1 mint API enforces via atomic insert with unique constraint. Future lease_kind extensions commit their own cardinality discipline via the §Procedure rule.

- **D-037 producer-disjointness rule extension to Lease** (ADR 0049 same-step + ADR 0051 v4 cross-step additive): a Lease acquire MUST NOT be performed by a producer class equal to the `Decision.decided_by` of the authorizing Decision when both records share a chain-relation. Producer equality by class identity. Layer 1 mint API enforces with walk-depth budget ≤ 64 records + cycle-rejection.

- **Sandbox-derived lease rejection (charter inv. 8)**: Layer 1 mint API rejects `Lease` acquire with `lease_kind: 'worktree'` when requesting session's `ExecutionContext.sandbox != 'none'`. Future lease_kind extensions commit their own sandbox-acquire rules via the §Procedure rule.

- **Charter inv. 6 (forbidden-tier non-escalable) preservation**: defended structurally **upstream of Lease** at `OperationShape.operation_class` source-enum closure + canonical policy YAML per ADR 0051 v4 scope-back pattern. The §Procedure rule's reviewer-discretion forbidden-clearing check is anchored to the operation_class enum closure (no lease_kind can authorize a `forbidden`-tier path because no `forbidden` value exists in the closed enum). The `operation_class_scope` column on registry §Lease.lease_kind status table is documentation-only (reviewer cross-check, not a structural defense layer). v1 `lease_kind` operation_class_scope assignments:
  - `worktree` → `{worktree_mutation, destructive_git, merge_or_push}` (per ADR 0031 v1 §`worktree_mutation` matrix cell refinements + §`ApprovalGrant.scope` per-class extension; worktree leases gate these operation classes)

- **Authority-discipline posture (envelope-level kernel-set with field-level exceptions per ADR 0031 v1)**:
  - **Kernel-set** (12 envelope-level fields): `schema_version`, `lease_id`, `held_by_session_id`, `held_by_agent_client_id`, `acquired_by`, `acquired_at`, `released_at`, `execution_context_id`, `lease_state`, `force_break_grant_id`, `audit_chain_link_hash`, `evidence_refs`
  - **Producer-asserted-kernel-verifiable** (3 envelope-level fields): `lease_kind`, `scope` (the `scope` union counted as one envelope-level field; the worktree branch internally carries `repository_id` + `workspace_context_id` + `worktree_path` as producer-asserted-kernel-verifiable sub-fields per the granular-authority-declaration convention), `valid_until`

  **Total: 15 envelope-level fields** (MT-1 at acceptance: corrected from the v1 draft's `Total: 14 fields` arithmetic error; 12 kernel-set + 3 producer-asserted-kernel-verifiable; scope union counted as one envelope-level field). Layer 1 mint API verifies producer-asserted values per ADR 0031 v1 §Authority discipline; rejection emits `Decision.reason_kind: 'lease_producer_assertion_unverifiable'` (NEW reservation).

- **`Evidence.subject_kind: 'lease'` already exists** in `evidenceSubjectKindSchema` (verified at `packages/schemas/src/entities/evidence.ts:41`; the value has been part of the enum since the Phase 2 schema train, alongside `'approval_grant'`, `'decision'`, `'run'`, etc.). This ADR does not modify `evidenceSubjectKindSchema` and does not bump `Evidence.schema_version`. **MT-2 at acceptance**: this entry mirrors ADR 0051 v4 §Accepts line 186 framing for `'approval_grant'`; the v1 draft incorrectly framed `'lease'` as registry-canonical reserved pending future schema PR, which was a factual error caught by ontology B2.

- **Cross-context binding** (charter inv. 19): `Lease.execution_context_id` is kernel-set; Layer 1 mint API enforces `Lease.execution_context_id == Session.execution_context_id` per ADR 0031 v1 §Cross-context binding rules.

- **Audit-chain integrity with length-prefix discipline**: the `audit_chain_link_hash` canonical-concatenation uses length-prefix-encoded `||` (per ADR 0051 v4 retroactive posture rule covering ADR 0049/0050/0051; ADR 0052 inherits and applies the same rule). `'' for null` substitution rule for `released_at` and `force_break_grant_id` per jointly-committed posture.

- **NEW Decision.reason_kind reservations**: the following 6 reason_kind values are reserved registry-canonical, with Zod-defined values to land at Ring 1 mint API schema PR per ADR 0049 §Procedure rule:
  - `'worktree_lease_held_by_other_session'` — concurrent-acquire race-loser per ADR 0031 v1 §Conflict resolution patterns pattern 1. **Outcome compatibility: `'deny'`-only.**
  - `'worktree_lease_expired_during_mutation'` — Layer 2 broker FSM re-check detects expiry mid-operation per ADR 0031 v1 pattern 2. **Outcome compatibility: `'deny'`-only.**
  - `'worktree_not_in_workspace_context'` — operation target's `(repository_id, worktree_path)` does not match session's WorkspaceContext per ADR 0031 v1 pattern 5. **Outcome compatibility: `'deny'`-only.**
  - `'lease_acquire_sandbox_rejected'` — charter inv. 8 sandbox-acquire defense per ADR 0031 v1 Security-F. **Outcome compatibility: `'deny'`-only.**
  - `'lease_release_unauthorized'` — non-holder release attempt per ADR 0031 v1 pattern 6 / Security-H. **Outcome compatibility: `'deny'`-only.**
  - `'lease_producer_assertion_unverifiable'` — Layer 1 mint API cannot verify producer-asserted-kernel-verifiable field (e.g., `worktree_path` filesystem stat failure, `workspace_context_id` resolution failure). **Outcome compatibility: `'deny'`-only.**

  ADR 0031 v1 also previously reserved `coordination_fact_worktree_drift` and `worktree_lease_force_break_required` registry-canonical; both remain registry-canonical (not Zod-defined at v1) pending downstream consumer Zod-source landing. The 6 NEW reservations extend the registry §Decision.reason_kind status table from 21 (after ADR 0051 v4) to 27 total reservations. Outcome-compatibility classifications match ADR 0049's format (all 6 deny-only).

- **§Producer-vs-kernel-set authority fields update**: enumerate all 12 kernel-set + 3 producer-asserted-kernel-verifiable fields (envelope-level kernel-set with field-level exceptions posture per ADR 0031 v1).

- **NEW §Procedure for adding a new lease_kind value rule** registered in `ontology-registry.md` mirroring §Procedure rule patterns from ADR 0048 + ADR 0049 + ADR 0051 v4. Future schema PRs extending the enum:
  1. Cite the source ADR / charter rule that the lease_kind enforces
  2. **Identify the `operation_class_scope`**: list which `OperationShape.operation_class` values the lease_kind gates. Confirm no clearing path opens for `forbidden`-tier (anchored to the operation_class enum closure)
  3. **Commit the typed scope shape** (discriminated union branch); use chain-aware ref schemas where applicable; commit envelope-level superRefine chain-walk extension to the new scope branch's evidence refs
  4. **Commit per-`lease_kind` cardinality discipline** (1:1 with target resource, or other shape)
  5. **Commit per-`lease_kind` sandbox-acquire rule** explicitly (MT-5 at acceptance — strengthened): future lease_kinds MUST commit either "blocked" (charter inv. 8 promotion defense for that lease_kind) OR "permitted with rationale" (with documented justification why the lease_kind does not enable a sandbox→stronger promotion path). "No sandbox-acquire rule" is NOT a valid §Procedure outcome; reviewer cannot waive.
  6. **Commit `valid_until` ceiling** (Phase 1 default is 24h for worktree; new lease_kinds declare their own)
  7. Update registry §Lease.lease_kind status table (Zod-defined vs registry-canonical, with `operation_class_scope` column) at the same change-set
  8. Pass `hcs-ontology-reviewer` (always); `hcs-policy-reviewer` (always — operation_class_scope check; escalation hole check; sandbox-acquire rule); `hcs-security-reviewer` (always — cardinality + lifecycle + chain-walk extension); `hcs-architect` (always)

- **Registry change-set bundled into this ADR's commit (or follow-on docs commit referencing this ADR)**. Registry version bumps `v0.4.14` → `v0.4.15` (after ADR 0049 + ADR 0050 + ADR 0051 registry change-set docs commits land in sequence). Changes:
  1. NEW §Lease entity section (entity overview + field-shape mirror + scope discriminated-union mirror + v1 worktree-only lease_kind + envelope-level superRefine commitment + length-prefix discipline inheritance)
  2. NEW §Lease.lease_kind status table (1 Zod-defined value + 2 registry-canonical reservations from ADR 0031 v1 + `operation_class_scope` column + 24h ceiling note for worktree)
  3. NEW §Lease.lease_state enum mirror (4 values)
  4. NEW §Procedure for adding a new lease_kind value rule (operation_class_scope + cardinality + sandbox-acquire + valid_until ceiling declarations)
  5. NEW §Worktree-lease cardinality discipline registry section (atomic insert + canonical(worktree_path) + ADR 0031 v1 Mechanical Tweak #6 cross-reference)
  6. NEW §Force-break separation of duties registry section (holder + minter asymmetry + Phase 1 interim human-dashboard-only posture + future kernel_dashboard coordinated change-set)
  7. UPDATE §Producer-vs-kernel-set authority fields — enumerate Lease envelope-level-kernel-set + 3 producer-asserted-kernel-verifiable field-level exceptions
  8. UPDATE §Audit-chain coverage of rejections — add cross-reference to Lease.audit_chain_link_hash + extend pair-mate vocabulary (revocation-race-style pair semantics if a future lease-lifecycle case requires; v1 does not)
  9. UPDATE §Decision-ApprovalGrant producer-disjointness rule (D-037) — extend to Lease-acquire-vs-authorizing-Decision case
  10. UPDATE §Decision.reason_kind status table — add 6 new reservations from this ADR (21 prior + 6 new = 27 total reservations; outcome compatibility classified)
  11. UPDATE §Predicate-kind vocabulary — confirm `leased_to` value (already in registry per ADR 0031 v1 + recent registry §Predicate-kind vocabulary section per 2026-05-07 registry update) refers to this ADR's Lease entity

- **D-row in `DECISIONS.md`** recording the entity introduction + initial lease_kind enum disposition + lifecycle commitment + cardinality discipline + sandbox-rejection + producer-disjointness extension + 6 reason_kind reservations + force-break grant_kind deferral.

- **Charter compliance**: inv. 1 (canonical-typed-evidence — typed envelope + typed discriminated scope + envelope superRefine on evidence_refs), inv. 4 (audit logging — audit_chain_link_hash with length-prefix discipline; 4 lifecycle transitions produce typed Decisions), inv. 6 (forbidden-tier non-escalable — preserved structurally upstream at operation_class enum closure + canonical policy YAML), inv. 7 (execute lane discipline — Lease is a co-leg of the stack), inv. 8 (no sandbox→stronger — sandbox-acquire rejection for worktree; future lease_kinds commit their own rule), inv. 17 (execution context declared — `execution_context_id` kernel-set), inv. 18 (chain-walk via envelope superRefine unconditionally), inv. 19 (freshness-bound + execution-context-bound + Phase 1 24h ceiling for worktree). All upheld.

### Rejects

- **Opaque `scope: z.json()`** — violates charter inv. 1. Rejected.

- **`lease_kind` enum with all 3 values committed Zod-defined at v1** (Option B) — rejected per the "enum value without scope semantics" lesson from ADR 0051 v2/v3. `credential_audience` and `external_target` are registry-canonical reservations; Zod-defined commitment defers to future schema PRs per the §Procedure rule.

- **Entity-level `tier_scope` column for forbidden-tier defense** (Option C) — rejected per ADR 0051 v4 scope-back pattern. Forbidden-tier defense lives upstream at `OperationShape.operation_class` enum closure + canonical policy YAML; an entity-level defense layer would duplicate without adding coverage and would face the same vocabulary-collision pitfalls.

- **Producer-supplied Lease records** — Lease is kernel-set throughout (envelope-level posture with the 3 explicit producer-asserted-kernel-verifiable exceptions per ADR 0031 v1). Producer attempts at the (future) Ring 1 mint API to set kernel-set fields are rejected with standard producer enforcement.

- **Lease records carrying raw secret values or producer-injection content** — `lease_kind` discriminator + typed scope + verified producer-asserted-kernel-verifiable fields prevent injection. Layer 1 mint API verifies all producer-asserted values; rejection emits `lease_producer_assertion_unverifiable`.

- **Schema-level cross-record refinements** (`Lease.execution_context_id == Session.execution_context_id`, `Lease.valid_until <= Decision.valid_until`, `(repository_id, canonical(worktree_path), lease_state == 'active')` uniqueness, producer-disjointness equality with authorizing Decision) — all rejected at the schema layer because cross-record equality cannot be schema-validated against host state per registry §Cross-context enforcement layer §Schema validation alone is not an enforcement layer rule (mirrors ADR 0050 + ADR 0051 v4 pattern). The schema commits the field shapes; Ring 1 mint API performs cross-record checks.

- **Schema-level lease lifecycle in-place mutation** — Leases are immutable once minted; lifecycle transitions produce NEW Lease records citing the prior in `evidence_refs` (supersession-via-evidence_refs pattern). Schema-level immutability refinement is Ring 1 mint-API responsibility (Zod cannot reach prior storage state).

- **Self-acquire to retire own active lease** (analog to ADR 0051 v4 self-approval rejection): a session whose `held_by_session_id` is the active lease's holder cannot re-acquire to bypass release-discipline. Per ADR 0031 v1 §Conflict resolution patterns pattern 1, the second-session attempt rejects with `worktree_lease_held_by_other_session`. The same rejection applies when the requesting session IS the holder; the proper path is `release` then `acquire` (or extension-via-supersession when future ADR commits extension semantics).

- **`kernel_gateway` in `acquired_by` allowlist** — rejected by design. Gateway re-derive is authoritative non-escalable; gateway does not mint leases. Producer-disjointness check trivially satisfied for gateway-decided Decisions.

- **`kernel_dashboard` producer extension bundled into this ADR** — rejected per policy-reviewer scope discipline. Adding a new kernel-trusted producer is a meaningful authority extension that deserves its own ADR; v1 `acquired_by` allowlist is `[mint_api, kernel_broker]` only. `kernel_dashboard` lands in a future separate ADR as a coordinated change-set with pre-emptive grant infrastructure (per ADR 0051 v4 §Future amendments) + `worktree_lease_force_break_acknowledgment` grant_kind extension.

- **`worktree_lease_force_break_acknowledgment` grant_kind extension bundled into this ADR** — rejected per coordinated change-set discipline. The grant_kind is Phase 1 interim posture human-dashboard-only per ADR 0031 v1; the producer for it is `kernel_dashboard`, deferred per ADR 0051 v4 scope discipline. Both land together as a coordinated future-ADR change-set. v1 Lease entity carries `force_break_grant_id.nullable()` schema shape; Ring 1 mint API rejects any non-null value at v1 (no producer is authorized to mint the referenced grant kind yet).

- **`credential_audience` and `external_target` lease_kind values Zod-defined at v1** — rejected per Option A choice. Registry-canonical reservations remain pending future schema PRs per the §Procedure rule.

- **Multiple active Leases for the same `(repository_id, canonical(worktree_path))` (worktree-specific)** — cardinality discipline per §Decision; Ring 1 mint API enforces via atomic insert.

- **`worktree` lease_kind values that authorize a `forbidden`-tier operation class** — structurally impossible at the upstream `OperationShape.operation_class` enum closure (8-value closed enum admits no `'forbidden'` value).

- **Authoring Ring 1 mint API, broker FSM, gateway re-derive, dashboard surface, force-break workflow, or canonical policy YAML for lease-tier rules** — all out of scope. Per workflow-sequencing investigation §Step 4, Ring 1 services land at `packages/kernel/`. Dashboard lands at `packages/dashboard/` per Milestone 5. Canonical policy YAML is Phase 2.5 lane at `system-config/policies/host-capability-substrate/`.

### Future amendments

- **`kernel_dashboard` producer + pre-emptive grant infrastructure + force-break grant_kind extension** — the future coordinated change-set ADR adds: `kernel_dashboard` to the kernel-trusted producer allowlist + `approvalGrantProducerSchema` enum extension (per ADR 0051 v4) + nullable `minted_for_decision_id` + §Pre-emptive grant guardrails + granting-session attribution + `'worktree_lease_force_break_acknowledgment'` grant_kind extension. v1 `Lease.force_break_grant_id.nullable()` schema shape becomes operationally reachable when this ADR lands.

- **`credential_audience` and `external_target` lease_kind extensions** — separate forthcoming ADRs land via schema PR following the §Procedure rule. Each commits its own scope-shape, cardinality discipline, sandbox-acquire rule, and valid_until ceiling.

- **Ring 1 mint API implementation** consumes the Lease entity. Enforces D-037 producer-disjointness (additive cross-step), cardinality discipline (worktree-specific atomic insert), charter inv. 6 via upstream operation_class enum closure, lease-state lifecycle, sandbox-acquire rejection, Phase 1 24h ceiling, producer-assertion verification, cross-context binding equality, holder-only release rule, force-break separation-of-duties.

- **Ring 1 lease manager service** — per workflow-sequencing investigation §Step 4 line 238: "lease manager: manages Lease lifecycle. Lives at `packages/kernel/src/lease/`." Composes with the broker FSM, mint API, audit hash chain.

- **Layer 3 gateway re-derive** (Milestone 5) — composes Decisions + ApprovalGrants + Lease state per workflow-sequencing investigation §Step 4 line 240.

- **Cross-host lease (single-host posture per charter inv. 10)** — out of scope at v1; future ADR may revise if a cross-host coordination need surfaces.

- **CoordinationFact drift detection** — `Decision.reason_kind: 'coordination_fact_worktree_drift'` is registry-canonical per ADR 0031 v1. Zod-defined value lands at Ring 1 mint API schema PR or downstream CoordinationFact schema landing.

- **24-hour ceiling revision for worktree** — v1 ceiling is a defensive default per ADR 0031 v1; future ADRs may revise based on operational evidence.

- **Reopen** if a future incident shows: v1 worktree scope shape inadequate, cardinality discipline allows undetected collisions, sandbox-acquire rule too restrictive or too permissive, producer-disjointness extension creates unintended approval surfaces, lifecycle transitions surface race conditions beyond the 4 patterns ADR 0031 v1 anticipates, Phase 1 24h ceiling operationally insufficient or overgenerous, force-break Phase 1 human-only posture surfaces operational pain.

## Compliance

This ADR is Ring 0 docs-only at the ADR layer; the schema PR that follows is a Ring 0 schema-change PR per `.agents/skills/hcs-schema-change`. No cross-ring imports authored. No canonical policy YAML, runtime probes, dashboard route React components, MCP adapter contracts, hook bodies, charter invariant text changes, or Ring 1 mint API implementation in this commit. Registry-side changes (per the 11-item change-set in §Accepts) are bundled into this commit or a follow-on docs commit referencing this ADR. Complies with implementation charter v1.4.0.

**Implementation-detail acknowledgments** (per ADR 0049 + ADR 0050 + ADR 0051 v4 precedents):

- `prior_audit_chain_link_hash` is NOT a schema field on the Lease record; it is an input to the `audit_chain_link_hash` canonical-concatenation computation at Ring 1 mint time. Chain-link continuity is enforced by Ring 1 storage on insert (Milestone 3 audit-events table).
- Genesis-collision defense for the same `(repository_id, canonical(worktree_path))` audit-chain root is a Milestone 3 audit-events table unique-constraint commitment.
- **Canonical-concatenation field-order convention** (length-prefix discipline inheritance): per the ADR 0051 v4 retroactive posture rule, the `||` operator denotes length-prefix-encoded concatenation (each variable-length field encoded as `varint(byte_length) || field_bytes`). This rule covers ADR 0049 / ADR 0050 / ADR 0051 / ADR 0052 jointly. ADR 0052 places identity + discriminator fields first (`lease_id`, `lease_kind`, `scope`), followed by holder identity (`held_by_session_id`, `held_by_agent_client_id`, `acquired_by`), followed by lifecycle (`acquired_at`, `valid_until`, `released_at`, `execution_context_id`, `lease_state`, `force_break_grant_id`), followed by evidence (`canonical(evidence_refs)`), followed by the chain link (`prior_audit_chain_link_hash`). The `'' for null` substitution rule applies to `released_at` and `force_break_grant_id`.
- `canonical(scope)` encoding is deferred to Ring 1 mint API; the schema commits the typed structure (discriminated union), and Ring 1 commits a deterministic serialization per branch.
- **Audit-event session identity**: Lease lifecycle audit events carry an `event_session_id` field on the audit-event record (NOT on the Lease Ring 0 entity). For acquire / release events, `event_session_id` equals `held_by_session_id` (the holder). For expiry events, `event_session_id` may be a kernel-detection session (set by the broker FSM or gateway re-derive). For force-break events, `event_session_id` is the requesting session (NOT the original holder, per separation-of-duties).
- **Cross-step chain-walk bounds**: the Ring 1 mint API enforces D-037 cross-step extension by walking the `derived_from` closure to detect chain-relation. Walk-depth budget ≤ 64 records (v1 ceiling per ADR 0051 v4). Walk rejects cycles at Ring 1; ADR 0019 v3 §Acceptance defers cycle-detection rules to Ring 1 mint API (Milestone 2 / Milestone 4); ADR 0051 v4 commits the Ring 1 rejection with `audit_chain_corruption_detected`; ADR 0052 inherits the rule.
- **Producer equality by class identity, not by delegation chain** — inherited from ADR 0051 v4. Any future producer that delegates internally must structurally re-establish its own class identity at the mint API contract.
- **TOCTOU at acquire** (per ADR 0031 v1 §Conflict resolution patterns pattern 1): the Layer 1 uniqueness check is implemented as an atomic insert with a unique constraint on `(repository_id, canonical_worktree_path, lease_state == 'active')`, not a check-then-insert pattern. Schema PR implementation must respect this atomicity; check-then-insert implementations are non-conformant.
- **Force-break audit lineage preservation** (per ADR 0031 v1): the acquire and force-break Decision events together preserve full holder lineage. The force-break Decision's `evidence_refs` MUST cite the prior acquire Decision; ownership history is reconstructable from the Decision chain.
- **Identity comparison form** (MT-3 at acceptance — distinguishes from ADR 0051 v4 principal-comparison form): the holder-only release rule's `requesting_session_id == held_by_session_id` comparison at Layer 1 mint API is **UUID-byte-equality** comparison. Both fields are `entityIdSchema`-typed (UUID-shape strings); the comparison is structural identity, not the Unicode/case/whitespace canonicalization-aware comparison form that ADR 0051 v4 §Self-approval rejection uses for `grantor_principal_ref` vs `consuming_session.principal_id` (where the comparison involves principal strings that may differ in case / Unicode normalization / whitespace before typed-Principal entity lands). The two comparison forms are intentionally distinct: session_id is a typed FK with structural identity; principal_id is a forward-reference string-shape comparison until Principal entity lands. Future Lease lifecycle additions involving non-UUID FK comparisons (none anticipated at v1) would need to commit their own canonicalization rule.
- **Future scope-branch chain-walk extension** (MT-4 at acceptance — forward-look): future lease_kind extensions whose scope branches carry `acknowledged_*_evidence_ref` fields (analogous to ADR 0051 v4 ApprovalGrant scope branches' `acknowledged_evidence_refs`, `acknowledged_dirty_state_evidence_ref`, `acknowledged_pr_absence_evidence_ref`) MUST extend the `leaseSchema` envelope-level superRefine to walk the new scope branch's evidence refs uniformly. The §Procedure rule step 3 commits the extension responsibility; this acknowledgment commits the forward-look semantic. v1 worktree scope has no scope-payload evidence refs, so the envelope superRefine walks only the envelope `evidence_refs` array at v1.

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md` v1.4.0 — invariants 1, 4, 6, 7, 8, 17, 18, 19
- Decision ledger: `DECISIONS.md` (D-037 producer-disjointness rule from ADR 0049; D-row to be added at acceptance)
- Related ADRs:
  - ADR 0019 v3 (chain-promotion rule; four-class `derived_from` closure; cycle-rejection in chain construction; predicate-kind vocabulary `leased_to`)
  - ADR 0027 v2 (first-commit-SHA-rooted `GitRepositoryObservation`; source of `repository_id` typed FK in worktree scope)
  - ADR 0028 (`mint_api` + `kernel_broker` producers)
  - ADR 0029 v2 (`worktree_mutation` operation class + closed-list fail-mode tightening)
  - ADR 0030 v2 (Q-006 Stage 2 source-control evidence; worktree-clean / pr-absence grant kinds composing with worktree leases)
  - ADR 0031 v1 (Q-008(d) worktree-ownership composition; §Lease entity field-shape posture commitment + §Lease lifecycle + §Cross-context binding rules per Ring 1 layer + §Authority discipline + Mechanical Tweaks #2 / #6 / #8 + Security-D / Security-F / Security-G / Security-H — substantial source for v1 commitments)
  - ADR 0036 (`humanDashboardGrantDeletionAuthorityRefSchema` composition; class-D destructive Git ops compose with `worktree_clean_acknowledgment` grant referencing this ADR's Lease entity)
  - ADR 0049 (Decision Ring 0 entity introduction; D-037 producer-disjointness rule; outcome-compatibility classification format; envelope-level superRefine chain-walk precedent; foundational-entity #1)
  - ADR 0050 (WorkspaceContext Ring 0 entity introduction; envelope-level kernel-set framing; canonical-concatenation per-entity-orderings principle; named-enum-producer-schema pattern; forward-looking registry citation pattern; cross-record refinement §Rejects pattern; foundational-entity #2)
  - ADR 0051 (ApprovalGrant Ring 0 entity introduction; envelope-level superRefine pattern; length-prefix canonical-concatenation discipline retroactive across foundational entities; D-037 additive cross-step extension; operation_class_scope documentation column pattern; scope-back lesson — no entity-level tier_scope structural defense layer; foundational-entity #3; immediate precedent in workflow-sequencing investigation §Step 1)
- Registry: `docs/host-capability-substrate/ontology-registry.md` v0.4.14 (forward-looking citation per ADR 0050's pattern; current file frontmatter v0.4.11; ADR 0049 reserves v0.4.12 pending docs commit; ADR 0050 reserves v0.4.13 pending docs commit; ADR 0051 reserves v0.4.14 pending docs commit; ADR 0052 reserves v0.4.15 pending docs commit) — §Authority discipline (line 279+), §Cross-context enforcement layer (line 546+), §Audit-chain coverage of rejections (line 602+), §Subject-kind grounding requirement (line 443+), §Kernel-trusted producer allowlist final state (line 798+), §Predicate-kind vocabulary (line 1188+ — `leased_to` value reserved per ADR 0031 v1; this ADR confirms reservation against accepted Lease entity), §Naming-discipline §Sub-rule 9 enum-value casing (line 203 — `lower_snake_case` mandate for new enum values)
- Workflow-sequencing investigation: `docs/host-capability-substrate/research/local/2026-05-10-workflow-sequencing-investigation.md` §Step 1 entity #4 (Lease)
- Outstanding-work sequencing workflow: `docs/host-capability-substrate/research/local/2026-05-09-outstanding-work-sequencing-workflow.md`
- Implementation rules: `IMPLEMENT.md` §Required subagent reviews, §Change classes
- Plan: `PLAN.md` §Milestone 1 acceptance (line 672 — 22 canonical Ring 0 entities)
- Schema-change skill: `.agents/skills/hcs-schema-change/SKILL.md`
- Live policy authoritative source (out-of-scope for this ADR; Phase 2.5 lane): `~/Organizations/jefahnierocks/system-config/policies/host-capability-substrate/` — canonical operation_class → tier mapping; per-`lease_kind` maximum windows; per-class force-break authority; verifier-class privileges
- Schema source for related entities:
  - `packages/schemas/src/entities/operation-shape.ts:10-21` (`operationShapeOperationClassSchema` — 8-value closed enum, no `forbidden`; charter inv. 6 source-layer defense anchor; `worktree_mutation` value is one of v1 Lease's operation_class_scope targets)
  - `packages/schemas/src/entities/operation-shape.ts:141` (`humanDashboardGrantDeletionAuthorityRefSchema` references `approval_grant_id` — composition path with ADR 0036's deletion authority kind; worktree leases gate the destructive Git ops that use this deletion authority)
  - `packages/schemas/src/entities/quality-gate.ts:129-134` (`qualityGateEvidenceRefSchema` — chain-aware preview shape pattern; not reused at v1 since worktree scope has no `acknowledged_*_evidence_ref` field, but the precedent informs future lease_kind extensions)
  - `packages/schemas/src/entities/evidence.ts:41` — `Evidence.subject_kind: 'lease'` already exists in `evidenceSubjectKindSchema` (verified at line 41; MT-2 at acceptance corrected the v1 draft's factual error claiming this was "registry-canonical reserved pending future schema PR"). This ADR does not modify `evidenceSubjectKindSchema` and does not bump `Evidence.schema_version` (mirrors ADR 0051 v4 §Accepts line 186 framing for `'approval_grant'`)
  - `packages/schemas/src/entities/source-control-evidence.ts:95-98` (`gitBranchRefSchema` — regex pattern reference; not reused at v1 since worktree scope uses `worktree_path` not `branch_ref`)
  - `packages/schemas/src/entities/coordination-fact.ts` (`subject_kind: 'worktree'` + `predicate_kind: 'leased_to'` references this ADR's Lease entity per ADR 0019 v3 + ADR 0031 v1)
- Currently-landed schemaVersion literals: `evidenceSchemaVersionSchema`, `knowledgeSourceSchemaVersionSchema`, `operationShapeSchemaVersionSchema` (sibling co-commitments `decisionSchemaVersionSchema` (ADR 0049) + `workspaceContextSchemaVersionSchema` (ADR 0050) + `approvalGrantSchemaVersionSchema` (ADR 0051) not yet landed in source per their schema PR deferrals; `leaseSchemaVersionSchema` joins as the fourth co-commitment)

### External

- None directly; this ADR composes existing internal posture.
