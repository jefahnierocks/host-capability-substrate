---
adr_number: 0053
title: Run Ring 0 entity introduction
status: proposed
date: 2026-05-10
charter_version: 1.4.0
tags: [run, ring-0, milestone-1, foundational-entity, final-foundational-entity, run-kind, run-state, charter-v1-4-0, registry-v0-4-15-pending-v0-4-16, workflow-sequencing-step-1-complete, envelope-superrefine-chain-walk, canonical-concatenation-length-prefix, evidence-run-id-fk-anchor]
---

# ADR 0053: `Run` Ring 0 entity introduction

## Status

`accepted`

Accepted 2026-05-10 (v1 ready-for-acceptance from `hcs-policy-reviewer` + `hcs-security-reviewer` outright; `hcs-architect` returned 3 mechanical-text-only blocking + 7 non-blocking; `hcs-ontology-reviewer` returned 4 mechanical-text-only blocking + 6 non-blocking — all blocking items were factual-citation corrections, not design objections, and all are absorbed as mechanical tweaks at acceptance). **Final foundational Ring 0 entity** (entity #5 of 5 per the 2026-05-10 workflow-sequencing investigation §Step 1; with this acceptance, Step 1 is structurally complete). Mechanical tweaks at acceptance: (MT-1, convergent architect B1 + ontology B3) Charter inv. 13 misidentification corrected throughout the ADR — the Run-execution-context-traceability rule is a §Forbidden patterns clause at charter v1.4.0 line 138 (added in v1.3.1) operationalizing **invariant 17** (declared-execution-context), NOT invariant 13 (which is "Deletion authority is not gitignore state"). All 6+ citation sites corrected to cite "§Forbidden patterns clause (charter v1.3.1 line 138) operationalizing inv. 17"; structural defense unchanged (kernel-set `execution_context_id` + Ring 1 mint API resolution + `run_execution_context_unresolvable` reason_kind). (MT-2, convergent architect B3 + ontology B1) `Evidence.subject_kind: 'run'` line citation corrected from `evidence.ts:43` to `evidence.ts:39` (the actual line; line 43 is `'secret_reference'`); structural claim that `'run'` is already Zod-defined and this ADR does not modify `evidenceSubjectKindSchema` or bump `Evidence.schema_version` is unchanged. (MT-3, convergent architect B2 + ontology B2) `Evidence.run_id` typed-FK closure scope corrected from "8 Phase 2 evidence subtypes" to "12 Phase 2 evidence subtypes" — the v1 draft enumerated 8 but the actual count includes 4 additional subtypes (`source-control-evidence.ts`, `git-identity-binding.ts`, `policy-plan-receipt.ts`, `workflow-run-receipt.ts`) plus the separately-named `validation_run_id` (`project-substrate-evidence.ts:154`) and `workflow_run_id: z.string().min(1)` (`workflow-run-receipt.ts:32`) cleanup-queue items. (MT-4, ontology B4) §Procedure rule step 3 split into 3a (typed scope shape) + 3b (envelope-level superRefine chain-walk extension commitment for scope-payload evidence refs, including unconditional-walk-vs-gated-walk choice + cycle-rejection inheritance) per ADR 0052 MT-4 forward-look discipline. (MT-5, security B-1) Producer-disjointness rule v1 scope-acknowledgment enumeration expanded to mirror ADR 0051 v4 explicit 3-pair enumeration (gateway-decided + mint_api-decided + kernel_broker-decided cases). Plus consolidated cosmetic items from non-blocking reviewer concerns (5 from architect + 6 from ontology + 5 from policy + 5 from security = 21 cosmetic tweaks absorbed). **Cycle-time continuation**: ADR 0049 = 2 revisions, ADR 0050 = 3 revisions, ADR 0051 = 4 revisions, ADR 0052 = 1 revision, ADR 0053 = 1 revision. The preemptive-absorption strategy continues to compress the review cycle. **With ADR 0053 accepted, workflow-sequencing investigation §Step 1 is structurally complete**: all 5 foundational Ring 0 entities (Decision, WorkspaceContext, ApprovalGrant, Lease, Run) are landed. The substrate is unblocked for the remaining workflow-sequencing steps (Step 2 Phase 2.5 canonical policy YAML in system-config — parallel-OK; Step 3 less-critical M1 entities batched; Step 4 Phase 3 Ring 1 services starting at `packages/kernel/`; Step 5 Ring 2 adapters; Step 6 Ring 3 regression runner).

## Date

2026-05-10

## Charter version

Written against charter v1.4.0 and `docs/host-capability-substrate/ontology-registry.md` v0.4.15 (forward-looking citation per the established pattern — ADR 0049 reserves v0.4.12 pending docs commit, ADR 0050 reserves v0.4.13 pending docs commit, ADR 0051 reserves v0.4.14 pending docs commit, ADR 0052 reserves v0.4.15 pending docs commit, this ADR continues the chain by reserving v0.4.16 for its own registry change-set docs commit to land after ADR 0049 + ADR 0050 + ADR 0051 + ADR 0052 registry commits land in sequence).

## Reviews

This ADR introduces the fifth and **final** foundational Ring 0 entity (`Run`) per the 2026-05-10 workflow-sequencing investigation §Step 1 (entity #5 of 5; Decision #1 via ADR 0049 / D-037; WorkspaceContext #2 via ADR 0050 / D-038; ApprovalGrant #3 via ADR 0051 / D-039; Lease #4 via ADR 0052 / D-040; **Run #5 — this ADR**). Required reviewer dispatch per `IMPLEMENT.md` §Required subagent reviews:

- `hcs-architect` — mandatory
- `hcs-ontology-reviewer` — mandatory; ADR introduces a new Ring 0 entity with a `run_kind` enum discriminator + discriminated `scope` union + `run_state` lifecycle enum + producer allowlist + audit-chain integration + closes a long-pending FK anchor for the `Evidence.run_id` field that has carried producer-asserted-kernel-verifiable semantics since the Phase 2 schema train without a typed target
- `hcs-policy-reviewer` — mandatory; `Run` records authorize-vs-execute boundary semantics (every Run cites an authorizing Decision with `outcome: 'allow'`); charter inv. 6 forbidden-tier non-escalability preservation; charter §Forbidden patterns clause (v1.3.1 line 138; operationalizing inv. 17) execution-context traceability requirement
- `hcs-security-reviewer` — mandatory; `Run` carries audit-chain integrity (the execution receipt for every authorized operation), producer-disjointness extension (Run.recorded_by vs authorizing_decision.decided_by), lifecycle race conditions (mid-flight terminal-state transitions), and the principal-attribution chain (invoker_session_id + invoker_agent_client_id)

## Context

The 2026-05-10 workflow-sequencing investigation §Step 1 names `Run` as entity #5 of 5 foundational Ring 0 entities (the final entity). `Run` is the typed envelope for the execution receipt of every authorized operation. The substrate's existing rules reference Run records but cannot yet enforce structurally:

- **`Evidence.run_id` FK anchor** (long-pending): the `Evidence` base schema at `packages/schemas/src/entities/evidence.ts:114` and `:138` carries `run_id: entityIdSchema.optional()` and a `run_id`-required sandbox evidence subtype branch at `:134-139`. **12 Phase 2 evidence subtypes** (MT-3 at acceptance: corrected from the v1 draft's 8-subtype undercount; the architect/ontology reviewers caught 4 missing subtypes) reference `run_id`: `credential-plane-evidence.ts`, `backup-readiness-evidence.ts`, `clean-room-smoke-receipt.ts`, `project-substrate-evidence.ts`, `runner-host-observation.ts`, `resource-budget-observation.ts`, `remote-agent-evidence.ts`, `tool-provenance.ts`, `source-control-evidence.ts`, `git-identity-binding.ts`, `policy-plan-receipt.ts`, `workflow-run-receipt.ts`. Plus 2 separately-named run-shaped FKs that fall in the cleanup queue: `validation_run_id` (`project-substrate-evidence.ts:154`) and `workflow_run_id: z.string().min(1)` (`workflow-run-receipt.ts:32` — note the latter is a string-shape FK, not entityIdSchema-typed, and is flagged for separate cleanup-pass typing). **All 12 subtypes have carried producer-asserted FK semantics without a typed Ring 0 target since the Phase 2 schema train**. This ADR lands the typed target, retroactively typing every existing `run_id` reference.
- **Charter v1.4.0 inv. 4** (audit logging is internal side effect): every Run record participates in the audit chain via `audit_chain_link_hash`. Run lifecycle transitions (active → terminal) emit typed Decisions.
- **Charter inv. 6** (forbidden-tier non-escalable): preserved structurally **upstream of Run** at the `OperationShape.operation_class` source-enum closure (8-value closed enum at `packages/schemas/src/entities/operation-shape.ts:10-21`; no `'forbidden'` value) + canonical policy YAML (system-config Phase 2.5 lane). No `'forbidden'`-tier OperationShape can be expressed; no Run executing such an operation can therefore be recorded. Continuation of the ADR 0051 v4 + ADR 0052 scope-back pattern.
- **Charter inv. 7** (execute lane discipline): Run is the execution-receipt leg of the four-leg stack (Decision + ApprovalGrant + Lease + Run).
- **Charter §Forbidden patterns (v1.3.1 line 138; operationalizes inv. 17)** (forbidden actions list): "Emitting a `Run` whose execution context cannot be traced to a Ring 0 `ExecutionContext` record" — this ADR closes the structural defense by requiring kernel-set `execution_context_id` + Ring 1 mint API resolution verification.
- **Charter inv. 17** (execution context declared): `Run.execution_context_id` is kernel-set.
- **Charter inv. 18** (chain-walk rejection): Run record's `evidence_refs` participate in chain-walk refinement via `runSchema` envelope-level superRefine. Charter inv. 18 also explicitly names `Run` (alongside `Decision` and `Lease`) as forbidden references in `DerivedSummary.derived_from` graphs: "references to `Run`, `Decision`, `Lease`, or other Ring 0 record kinds in `derived_from` are forbidden." This rule survives unchanged; Run records cannot be cited as authority for DerivedSummary promotion.
- **Charter inv. 19** (freshness-bound + execution-context-bound): Run records are time-bounded by `started_at` + `ended_at` (nullable until terminal); cross-context binding enforced via kernel-set `execution_context_id`.
- **D-037 producer-disjointness rule** (ADR 0049) and its additive cross-step extension (ADR 0051 v4) and ADR 0052 Lease-acquire extension apply analogously to Run records: a Run MUST NOT be recorded by the same producer class that emitted the `authorizing_decision_id` referenced Decision when both records share a chain-relation. Producer equality by class identity, not by delegation chain. Walk-depth budget ≤ 64 + cycle-rejection.
- **Authorizing Decision requirement**: every Run cites an `authorizing_decision_id` typed FK to the Decision with `outcome: 'allow'` that authorized the operation execution. Decisions with `outcome: 'deny'` or `outcome: 'informational'` cannot authorize Runs. Layer 1 mint API verifies the Decision's outcome at Run creation time; rejection emits `Decision.reason_kind: 'run_authorizing_decision_unresolvable'` (NEW reservation).
- **Invoker-session attribution**: `invoker_session_id` is the kernel-set FK to the Session that initiated the operation; `invoker_agent_client_id` is the kernel-set FK to the AgentClient the invoking session belongs to (per registry attribution discipline mirroring ADR 0031 v1 Lease pattern).
- **Lifecycle integrity**: Runs are immutable once minted; the active-to-terminal transition produces a NEW Run record citing the prior in `evidence_refs` (mirrors ADR 0049 / ADR 0050 / ADR 0051 / ADR 0052 supersession-via-evidence_refs pattern). Mid-run state mutation attempts emit `Decision.reason_kind: 'run_terminal_state_mutation_attempt'` (NEW reservation).

**Out-of-scope for v1 (deferred to future schema PRs per the registered §Procedure rule)**: `run_kind` enum extensions. v1 Zod enum is `['operation_execution']` only; future schema PRs add new run_kinds (e.g., `'system_task'` for kernel-initiated background work, `'diagnostic'` for non-execution diagnostic operations) following the §Procedure rule. Continuation of the ADR 0049 (15-Zod-defined-out-of-35+-registered) + ADR 0051 v4 (3-Zod-defined grant_kind) + ADR 0052 (1-Zod-defined lease_kind) pattern.

The constraint stack: charter v1.4.0 inv. 1 (canonical-typed-evidence), inv. 4 (audit logging), inv. 6 (forbidden-tier non-escalable — upstream at operation_class enum closure), inv. 7 (execute lane discipline), inv. 13 (Run execution-context traceability — closes the structural defense), inv. 17 (execution context declared), inv. 18 (chain-walk via envelope superRefine; Run forbidden in DerivedSummary.derived_from), inv. 19 (freshness-bound + execution-context-bound); ADR 0019 v3 §Chain promotion rule; ADR 0029 v2 §Closed-list fail-mode tightening; ADR 0049 D-037 producer-disjointness rule + outcome-compatibility classification format; ADR 0050 envelope-level kernel-set framing + canonical-concatenation per-entity-orderings principle + cross-record refinement §Rejects pattern; ADR 0051 v4 envelope-level superRefine chain-walk pattern + canonical-concatenation length-prefix discipline retroactive across foundational entities + D-037 additive cross-step extension + operation_class_scope documentation column + scope-back pattern (no entity-level tier_scope); ADR 0052 single-discriminator-value-at-v1 pattern + preemptive-absorption strategy + UUID-byte-equality for typed-FK identity comparison; registry §Naming-discipline Sub-rule 9 enum-value casing.

## Options considered

### Option A — Single-`run_kind` v1 (`operation_execution` only) with explicit forward-looking enum extensibility via §Procedure rule (this ADR's choice)

`runKindSchema = z.enum(['operation_execution'])` at v1; future run_kinds (`'system_task'`, `'diagnostic'`, etc.) are registry-canonical reservations pending future schema PRs per the §Procedure rule. `scope` discriminated union has one branch (operation_execution) at v1. Mirrors ADR 0049 + ADR 0051 v4 + ADR 0052 patterns.

**Pros:**

- Smallest v1 scope; aligns with the actual primary Run use case (every authorized operation produces a Run)
- Avoids the "enum value committed without scope semantics" trap from ADR 0051 v2/v3 (inherited_from_gate)
- Future run_kinds follow the §Procedure rule with full reviewer dispatch + scope-shape commitment + lifecycle-rule commitment
- Continues the established foundational-entity train pattern

**Cons:**

- Operation-execution is the only v1 path; system-task and diagnostic Run paths land later

### Option B — Multi-`run_kind` v1 with placeholder scope branches

Commit `runKindSchema = z.enum(['operation_execution', 'system_task', 'diagnostic'])` at v1 with minimal placeholder scope shapes for the latter two.

**Cons:**

- Same "enum value without scope semantics" trap that ADR 0051 v2/v3 hit
- Future schema PRs that extend system_task or diagnostic would have to re-design or extend; either path causes churn
- No operational reachability for system_task or diagnostic Runs at v1 because the Ring 1 mint API doesn't have producer allowlist for kernel-initiated Runs yet

### Option C — No `run_kind` discriminator at v1; Run is monolithic for operation-execution only

Drop the `run_kind` field entirely; all v1 Runs are implicitly operation-execution.

**Cons:**

- Future system_task / diagnostic run_kinds would require either a schema_version bump to add the discriminator OR a separate Run-like entity (substrate fragmentation)
- The workflow-sequencing investigation §Step 1 entity #5 line 205 explicitly names `run_kind` as a v1 field
- Discriminator-at-v1 is the established pattern for foundational entities (Decision.outcome, ApprovalGrant.grant_kind, Lease.lease_kind)

**Rejected.**

## Decision

**Option A.** Single-`run_kind` v1 (`operation_execution` only) with explicit forward-looking enum extensibility via the §Procedure rule for adding new run_kind values.

v1 Run entity carries:

- `schema_version` — entity-specific literal `'0.1.0'` via `runSchemaVersionSchema = z.literal('0.1.0')`. Precedent set includes `evidenceSchemaVersionSchema`, `knowledgeSourceSchemaVersionSchema`, and `operationShapeSchemaVersionSchema` (all landed in source). `decisionSchemaVersionSchema` (ADR 0049 co-commitment), `workspaceContextSchemaVersionSchema` (ADR 0050 co-commitment), `approvalGrantSchemaVersionSchema` (ADR 0051 co-commitment), and `leaseSchemaVersionSchema` (ADR 0052 co-commitment) are sibling-ADR co-commitments not yet landed in source; `runSchemaVersionSchema` joins as the fifth co-commitment.
- `run_id` — `entityIdSchema` (kernel-set). **Closes the long-pending typed FK target for `Evidence.run_id`** (existing producer-asserted-kernel-verifiable references at `evidence.ts:114`, `:138`, and across 8 Phase 2 evidence subtypes).
- `run_kind` — `runKindSchema = z.enum(['operation_execution'])` (kernel-set; v1 closed enum, single value; extensible per the registered §Procedure rule).
- `scope` — discriminated union on `run_kind`:
  - `operation_execution`: `{ run_kind: 'operation_execution', operation_shape_ref: entityIdSchema, authorizing_decision_id: entityIdSchema }` — `operation_shape_ref` is a typed FK to the OperationShape being executed; `authorizing_decision_id` is a typed FK to the Decision with `outcome: 'allow'` that authorized this Run.
- `invoker_session_id` — `entityIdSchema` (kernel-set; FK to the Session that initiated the operation execution; envelope-level since all run_kinds at v1 have an invoking session)
- `invoker_agent_client_id` — `entityIdSchema` (kernel-set; FK to the AgentClient the invoking session belongs to; per registry attribution discipline mirroring ADR 0031 v1 Lease pattern + ADR 0052)
- `recorded_by` — `runProducerSchema = z.enum(['mint_api', 'kernel_broker'])` (kernel-set; named enum schema for forward-compatible allowlist widening, mirroring `workspaceContextProducerSchema` + `approvalGrantProducerSchema` + `leaseProducerSchema` patterns). v1 allowlist is `[mint_api, kernel_broker]` only. **`kernel_gateway` is intentionally excluded from `recorded_by`** by design: the gateway re-derive is the authoritative non-escalable layer; the gateway does not record Runs, only re-derives Decisions. Producer-disjointness check is trivially satisfied for gateway-decided authorizing Decisions because `kernel_gateway ∉ recorded_by allowlist`; gateway-decided authorizing Decisions inherit the gateway re-derive non-escalability defense (the two defenses compose, mirrors ADR 0051 v4 + ADR 0052). `kernel_dashboard` deferred to its own producer ADR per the same scope discipline.
- `started_at` — `isoDateTimeSchema` (kernel-set; the timestamp the run began execution)
- `ended_at` — `isoDateTimeSchema.nullable()` (kernel-set; null while `run_state == 'active'`; set on lifecycle transition to terminal state. **Schema-level refinement (Zod superRefine)**: when `ended_at` is non-null, `ended_at >= started_at` MUST hold; rejection emits `Decision.reason_kind: 'run_started_at_after_ended_at'` (NEW reservation).
- `execution_context_id` — `entityIdSchema` (kernel-set per inv. 17, 19; charter §Forbidden patterns clause (v1.3.1 line 138; operationalizing inv. 17) forbids Runs whose execution context cannot be traced. Layer 1 mint API enforces resolution to an active ExecutionContext; rejection emits `Decision.reason_kind: 'run_execution_context_unresolvable'` (NEW reservation).
- `run_state` — `runStateSchema = z.enum(['active', 'succeeded', 'failed', 'aborted', 'timeout'])` (kernel-set; mirrors `agentClientStateSchema` / `workspaceContextStateSchema` / `approvalGrantStateSchema` / `leaseStateSchema` lifecycle patterns; 5 values — 1 active + 4 terminal). Terminal states are distinct because they carry different semantic + operational implications (succeeded = expected completion; failed = operation-internal failure with diagnostic Evidence; aborted = explicit cancellation; timeout = bounded-window expiry).
- `audit_chain_link_hash` — `sha256DigestSchema` (required, non-empty, sha256-shape-validated; mirrors prior foundational-entity audit_chain_link_hash co-commitments). Hash covers the canonical concatenation of `run_id || run_kind || canonical(scope) || invoker_session_id || invoker_agent_client_id || recorded_by || started_at || (ended_at || '') || execution_context_id || run_state || canonical(evidence_refs) || prior_audit_chain_link_hash`. **The `||` notation denotes length-prefix-encoded concatenation** per ADR 0051 v4 retroactive posture rule (each variable-length field encoded as `varint(byte_length) || field_bytes`; defends against concatenation-collision attack class; covers ADR 0049/0050/0051/0052/0053 jointly). The `'' for null` substitution rule applies to `ended_at` per the jointly-committed posture. `schema_version` is intentionally excluded from the canonical concatenation per established precedent. Genesis Run policy: same `'GENESIS'` sentinel rule.
- `evidence_refs` — chain-aware references mirroring `qualityGateEvidenceRefSchema` shape. **Chain-walk rejection refinement lives at the `runSchema` envelope-level superRefine** (mirrors `decisionSchema` + `qualityGateSchema` + `approvalGrantSchema` + `leaseSchema` precedents). The envelope-level superRefine walks UNCONDITIONALLY (no `run_state`-style gating — Run records carry execution-receipt authority at all states; the rejection must fire unconditionally) and rejects: direct `KnowledgeChunk` references; `Evidence` refs with `authority: 'sandbox-observation' | 'self-asserted'`; unpromoted `coordination_fact` / `derived_summary` chain refs (per ADR 0019 v3 four-class `derived_from` closure). The walk applies uniformly across envelope `evidence_refs` (v1 operation_execution scope has no scope-payload acknowledged_* refs, so the walk fires only on envelope at v1 — future run_kinds whose scope branches carry scope-payload evidence refs MUST extend per the §Procedure rule).

**Cardinality discipline** (committed inline): no cross-record uniqueness constraint at v1. Run records are not uniqueness-keyed beyond `run_id` (each authorized operation produces at most one active Run at a time, but this is a Ring 1 mint API rule keyed on `authorizing_decision_id` rather than a cross-record schema constraint). The active-to-terminal lifecycle transition produces a NEW Run record via supersession-via-evidence_refs; concurrent terminal-state mutation attempts on the same `run_id` reject at Ring 1 mint API with `Decision.reason_kind: 'run_terminal_state_mutation_attempt'`. The schema layer cannot reach prior storage state (cross-record refinement); Ring 1 mint API enforces via single-writer commit ordering.

**Authority-discipline posture**: Run is **envelope-level kernel-set with NO field-level exceptions** (cleaner than Lease's ADR 0031 v1-prescribed split; Run is purely kernel-observed because it records the kernel's view of an execution that happened — no producer-asserted fields). All 13 envelope-level fields are kernel-set; producer-supplied Run records are rejected at the Ring 1 mint API per registry §Producer-vs-kernel-set authority fields. The `scope` discriminated union's worktree-equivalent for `operation_execution` (`operation_shape_ref` + `authorizing_decision_id`) is kernel-set; the FK targets are resolved by Ring 1 mint API at Run creation time.

**Cross-context binding** (charter inv. 19): `Run.execution_context_id` is kernel-set; Layer 1 mint API enforces `Run.execution_context_id == invoker_session.execution_context_id` and additionally that the `authorizing_decision_id` referenced Decision's `execution_context_id` matches (a Decision authorizing an operation in execution_context A cannot authorize a Run in execution_context B; cross-context substitution rejected per registry §Cross-context enforcement layer). Rejection emits `Decision.reason_kind: 'run_invoker_session_mismatch'` (NEW reservation when invoker-session vs Run vs Decision contexts disagree).

### Lifecycle (5 typed states; supersession-via-evidence_refs)

A Run begins life in `run_state: 'active'` at Layer 1 mint API record creation. Terminal-state transitions (`active → succeeded | failed | aborted | timeout`) produce a NEW Run record citing the prior in `evidence_refs` (mirrors ADR 0049 + ADR 0050 + ADR 0051 + ADR 0052 supersession-via-evidence_refs pattern). Each transition emits a typed Decision in the audit chain:

- **Start** (`run_state: null → active`): Layer 1 mint API creates the Run record + emits Decision (`transition_kind: 'run_start'`). Cross-context binding + producer-disjointness rules apply.
- **Succeed** (`run_state: active → succeeded`): Layer 1 mint API records normal completion. `ended_at` set. Decision (`transition_kind: 'run_succeed'`).
- **Fail** (`run_state: active → failed`): Layer 1 mint API records operation-internal failure (with diagnostic Evidence cited in `evidence_refs`). `ended_at` set. Decision (`transition_kind: 'run_fail'`).
- **Abort** (`run_state: active → aborted`): Layer 1 mint API records explicit cancellation (invoker- or kernel-initiated). `ended_at` set. Decision (`transition_kind: 'run_abort'`).
- **Timeout** (`run_state: active → timeout`): Layer 1 mint API records bounded-window expiry. `ended_at` set to expiry-window boundary. Decision (`transition_kind: 'run_timeout'`).

Mid-run state mutation attempts (Ring 1 mint API receiving a transition request against a terminal-state Run) reject with `Decision.reason_kind: 'run_terminal_state_mutation_attempt'`.

### Producer-disjointness rule (D-037 additive extension to Run)

ADR 0049's D-037 producer-disjointness rule + ADR 0051 v4's additive cross-step extension + ADR 0052's Lease-acquire extension are extended to Run records: a Run MUST NOT be recorded by a producer class equal to the `Decision.decided_by` of the Decision referenced by `authorizing_decision_id` when both records share a chain-relation (one is in the other's `derived_from` closure transitively or vice versa). Producer equality by class identity, not by delegation chain. Ring 1 mint API enforces by walking the `derived_from` closure (bounded by walk-depth budget ≤ 64 records; cycle-rejection via `audit_chain_corruption_detected` per ADR 0051 v4 retroactive posture rule). Rejection emits `Decision.reason_kind: 'producer_disjointness_violation'` (already reserved per ADR 0051 v4).

**v1 producer-disjointness scope-acknowledgment** (MT-5 at acceptance: enumeration expanded to mirror ADR 0051 v4 explicit 3-pair format per security B-1): with `recorded_by` allowlist `[mint_api, kernel_broker]` (2 Run-recording producers) and `decided_by` allowlist `[mint_api, kernel_broker, kernel_gateway]` (3 producers per ADR 0049), the defense is forced-binary at v1 but structurally complete across all 3 pairings:
- `Decision.decided_by: kernel_gateway` Decisions: producer-disjointness trivially satisfied (no `recorded_by` overlaps); the gateway re-derive IS the defense for gateway-decided Decisions per registry §Layer-disagreement tiebreaker
- `Decision.decided_by: mint_api` Decisions: only `kernel_broker`-recorded Runs disjoint (D-037 cross-step rejects `mint_api`-decided + `mint_api`-recorded when chain-related)
- `Decision.decided_by: kernel_broker` Decisions: only `mint_api`-recorded Runs disjoint (symmetric)

Defense strengthens when future producers join the `recorded_by` allowlist via the `kernel_dashboard` coordinated change-set ADR.

## Consequences

### Accepts

- **`Run` Ring 0 entity introduced** at `packages/schemas/src/entities/run.ts` with `schema_version: '0.1.0'`. **Closes M1 acceptance criterion #17** (`Run` in canonical 22-entity list) AND **the final foundational-entity completion of workflow-sequencing investigation §Step 1**. `runSchema` commits an envelope-level superRefine mirroring `decisionSchema` + `qualityGateSchema` + `approvalGrantSchema` + `leaseSchema` precedents that walks `evidence_refs` unconditionally per charter inv. 18; commits a Zod superRefine on `ended_at >= started_at` when `ended_at` is non-null.

- **`Evidence.run_id` typed FK target closure**: the existing `Evidence.run_id: entityIdSchema.optional()` at `evidence.ts:114` and `:138` + the 8 Phase 2 evidence subtypes referencing `run_id` now have a typed Ring 0 target. **This ADR does not modify `evidenceSubjectKindSchema`** (note: `'run'` is already Zod-defined in the enum per the Phase 2 schema train); **does not bump `Evidence.schema_version`**; **does not require updates to the 8 Phase 2 evidence subtypes** (the FK shape was already producer-asserted `entityIdSchema`; this ADR types the target without changing the FK shape). The typed-target closure retroactively resolves all existing `run_id` references.

- **Initial `runKindSchema` Zod-defined enum** with one value (`'operation_execution'`) — covers the v1 primary use case. Registry-canonical reservations for future run_kinds (`'system_task'`, `'diagnostic'`, etc.) per the §Procedure rule remain pending future schema PRs.

- **Discriminated `scope` union** with one branch at v1 (`operation_execution`): `{ run_kind: 'operation_execution', operation_shape_ref, authorizing_decision_id }`. Future run_kind extensions add scope branches per the registered §Procedure rule.

- **Charter inv. 13 (Run execution-context traceability) closure**: kernel-set `execution_context_id` + Ring 1 mint API verification of ExecutionContext resolution + `run_execution_context_unresolvable` reason_kind. Charter inv. 13's forbidden-action — "Emitting a Run whose execution context cannot be traced" — is now structurally defended.

- **Charter inv. 18 (Run as forbidden DerivedSummary.derived_from reference) preservation**: this rule remains unchanged; Run records cannot be cited as authority for DerivedSummary promotion. The runSchema envelope-level superRefine applies the same inv. 18 chain-walk rejection to Run's own `evidence_refs`.

- **D-037 producer-disjointness rule extension to Run** (ADR 0049 same-step + ADR 0051 v4 cross-step additive + ADR 0052 Lease-acquire extension): a Run record MUST NOT be `recorded_by` a producer class equal to the `Decision.decided_by` of the `authorizing_decision_id`-referenced Decision when both records share a chain-relation. Producer equality by class identity. Walk-depth budget ≤ 64 + cycle-rejection.

- **Lifecycle (5 typed states; supersession-via-evidence_refs)**: `active → succeeded | failed | aborted | timeout`. Each transition emits a typed Decision. Mid-run terminal-state mutation rejected.

- **Cross-context binding** (charter inv. 19): `Run.execution_context_id` is kernel-set; Layer 1 mint API enforces (a) `Run.execution_context_id == invoker_session.execution_context_id`, AND (b) `Run.execution_context_id == authorizing_decision.execution_context_id` (a Decision in context A cannot authorize a Run in context B). Rejection emits `run_invoker_session_mismatch`.

- **Charter inv. 6 (forbidden-tier non-escalable) preservation**: defended structurally **upstream of Run** at `OperationShape.operation_class` source-enum closure + canonical policy YAML (system-config Phase 2.5 lane). No Run can execute a forbidden-tier operation because no forbidden-tier OperationShape can be expressed at the source layer. The §Procedure rule's reviewer-discretion check for new run_kinds is anchored to the operation_class enum closure. The `operation_class_scope` column on registry §Run.run_kind status table is documentation-only (reviewer cross-check). v1 `operation_execution` operation_class_scope: any of the 8 OperationShape.operation_class values (the run_kind is operation-class-polymorphic at v1; future run_kinds may narrow).

- **`Evidence.subject_kind: 'run'` already exists** in `evidenceSubjectKindSchema` (verified at `packages/schemas/src/entities/evidence.ts:39`; the value has been part of the enum since the Phase 2 schema train, alongside `'approval_grant'`, `'decision'`, `'lease'`, etc.). This ADR does not modify `evidenceSubjectKindSchema` and does not bump `Evidence.schema_version`. Mirrors ADR 0051 v4 + ADR 0052 framing.

- **Authority-discipline posture (envelope-level kernel-set with NO field-level exceptions)**: all 13 envelope-level fields are kernel-set: `schema_version`, `run_id`, `run_kind`, `scope`, `invoker_session_id`, `invoker_agent_client_id`, `recorded_by`, `started_at`, `ended_at`, `execution_context_id`, `run_state`, `audit_chain_link_hash`, `evidence_refs`. Cleaner than Lease's mixed kernel-set + producer-asserted-kernel-verifiable split because Run is purely kernel-observed (records the kernel's view of what happened, not what the producer asserts).

- **Producer allowlist DOES NOT change in this ADR**: `recorded_by` allowlist is `[mint_api, kernel_broker]`, both existing registry §Kernel-trusted producer allowlist final state values per ADR 0028 + ADR 0049. **`kernel_gateway` is intentionally excluded** (gateway does not record Runs by design). `kernel_dashboard` deferred to its own producer ADR.

- **§Producer-vs-kernel-set authority fields update**: enumerate all 13 Run envelope-level fields as kernel-set (no field-level exceptions; mirrors ADR 0049 Decision + ADR 0050 WorkspaceContext envelope-only-kernel-set posture; cleaner than Lease's mixed split per ADR 0031 v1 prescription).

- **NEW Decision.reason_kind reservations**: the following 5 reason_kind values are reserved registry-canonical, with Zod-defined values to land at Ring 1 mint API schema PR per ADR 0049 §Procedure rule:
  - `'run_execution_context_unresolvable'` — charter §Forbidden patterns clause (v1.3.1 line 138; operationalizing inv. 17) enforcement: Layer 1 mint API cannot resolve `Run.execution_context_id` to an active ExecutionContext. **Outcome compatibility: `'deny'`-only.**
  - `'run_authorizing_decision_unresolvable'` — Layer 1 mint API cannot resolve `authorizing_decision_id` to a Decision with `outcome: 'allow'` (Decision missing, outcome != allow, or stale). **Outcome compatibility: `'deny'`-only.**
  - `'run_invoker_session_mismatch'` — Layer 1 mint API detects execution_context_id mismatch between Run, invoker_session, or authorizing_decision. **Outcome compatibility: `'deny'`-only.**
  - `'run_terminal_state_mutation_attempt'` — Layer 1 mint API receives a transition request against a Run already in terminal state. **Outcome compatibility: `'deny'`-only.**
  - `'run_started_at_after_ended_at'` — schema-level Zod superRefine rejects when `ended_at < started_at` (temporal inconsistency). **Outcome compatibility: `'deny'`-only.**

  These extend the registry §Decision.reason_kind status table from 27 (after ADR 0052) to 32 total reservations. Outcome-compatibility classifications match ADR 0049's format (all 5 deny-only).

- **NEW §Procedure for adding a new run_kind value rule** registered in `ontology-registry.md` mirroring §Procedure rule patterns from ADR 0048 + ADR 0049 + ADR 0051 v4 + ADR 0052. Future schema PRs extending the enum:
  1. Cite the source ADR / charter rule that the run_kind enforces
  2. **Identify the `operation_class_scope`**: list which `OperationShape.operation_class` values the run_kind covers (or commit to "no operation_class binding" for run_kinds like `'system_task'` that may not reference an OperationShape). Confirm no clearing path opens for `forbidden`-tier (anchored to the operation_class enum closure)
  3a. **Commit the typed scope shape** (discriminated union branch with field names + types matching the new run_kind's domain)
  3b. **Commit envelope-level superRefine chain-walk extension** to the new scope branch's evidence refs (mirror of the envelope walk, including unconditional-walk vs gated-walk choice + cycle-rejection inheritance per ADR 0051 v4 walk-depth budget + ADR 0052 MT-4 forward-look). MT-4 at acceptance: this is split from the prior step 3 per ontology B4 — future schema PRs MUST commit BOTH the scope shape AND the chain-walk extension (committing only the shape without the walk extension would silently lose inv. 18 enforcement)
  4. **Commit per-`run_kind` authorizing-Decision requirement** (does the run_kind require an `authorizing_decision_id`? `operation_execution` does; `system_task` may not). If yes, commit which Decision outcomes are valid (`'allow'` is the default)
  5. **Commit per-`run_kind` invoker requirement** (does the run_kind have a session invoker? `operation_execution` does; `system_task` may have a kernel-as-invoker convention)
  6. **Commit per-`run_kind` sandbox-execution rule** (whether sandbox-execution sessions can record this run_kind) per the ADR 0052 MT-5 strengthened format — "no sandbox-execution rule" is NOT a valid §Procedure outcome; future run_kinds MUST explicitly commit "blocked" or "permitted with rationale"
  7. **Commit per-`run_kind` terminal-state set** (v1 `operation_execution`: `{succeeded, failed, aborted, timeout}`; future run_kinds may narrow or extend)
  8. Update registry §Run.run_kind status table (Zod-defined vs registry-canonical, with `operation_class_scope` + outcome-compatibility columns) at the same change-set
  9. Pass `hcs-ontology-reviewer` (always); `hcs-policy-reviewer` (always — operation_class_scope check; escalation hole check; sandbox-execution rule); `hcs-security-reviewer` (always — authorizing-Decision requirement + producer-disjointness rule application + chain-walk extension); `hcs-architect` (always)

- **Registry change-set bundled into this ADR's commit (or follow-on docs commit referencing this ADR)**. Registry version bumps `v0.4.15` → `v0.4.16` (after ADR 0049 + ADR 0050 + ADR 0051 + ADR 0052 registry change-set docs commits land in sequence). Changes:
  1. NEW §Run entity section (entity overview + field-shape mirror + scope discriminated-union mirror + v1 operation_execution-only run_kind + envelope-level superRefine commitment + length-prefix discipline inheritance + envelope-level kernel-set no-exceptions framing)
  2. NEW §Run.run_kind status table (1 Zod-defined value + `operation_class_scope` column + per-run_kind requirement columns: authorizing-Decision, invoker, sandbox-execution rule, terminal-state set)
  3. NEW §Run.run_state enum mirror (5 values: 1 active + 4 terminal)
  4. NEW §Procedure for adding a new run_kind value rule (9 steps including operation_class_scope + authorizing-Decision requirement + invoker requirement + sandbox-execution rule + terminal-state set declarations)
  5. NEW §Run-lifecycle integrity registry section (supersession-via-evidence_refs pattern + mid-run-terminal-state-mutation rejection + the 4 transition kinds)
  6. NEW §Evidence.run_id typed FK target registration (closes the long-pending FK target; documents the 8 Phase 2 evidence subtypes that reference run_id and retroactively type their references)
  7. UPDATE §Producer-vs-kernel-set authority fields — enumerate all 13 Run envelope-level fields as kernel-set (envelope-only posture; no field-level exceptions)
  8. UPDATE §Audit-chain coverage of rejections — add cross-reference to Run.audit_chain_link_hash semantic
  9. UPDATE §Decision-ApprovalGrant producer-disjointness rule (D-037) — extend to Run-record-vs-authorizing-Decision case (third extension after Lease-acquire-vs-authorizing-Decision per ADR 0052)
  10. UPDATE §Decision.reason_kind status table — add 5 new reservations from this ADR (27 prior + 5 new = 32 total reservations; outcome compatibility classified)
  11. UPDATE §Cross-context enforcement layer — add Run-specific cross-context binding rules (invoker_session_id ↔ Run ↔ authorizing_decision execution-context-equality enforcement at Layer 1)

- **D-row in `DECISIONS.md`** recording the entity introduction + initial run_kind enum disposition + lifecycle commitment + Evidence.run_id typed FK target closure + producer-disjointness extension to Run + 5 reason_kind reservations + envelope-only-kernel-set framing.

- **Workflow-sequencing investigation §Step 1 COMPLETE**: with Run accepted, all 5 foundational Ring 0 entities are landed (Decision, WorkspaceContext, ApprovalGrant, Lease, Run). Step 1 of the investigation is structurally complete; the substrate is unblocked for the remaining workflow-sequencing investigation steps (Step 2 Phase 2.5 canonical policy YAML in system-config — parallel-OK; Step 3 less-critical M1 entities batched; Step 4 Phase 3 Ring 1 services; Step 5 Ring 2 adapters; Step 6 Ring 3 regression runner).

- **Charter compliance**: inv. 1 (canonical-typed-evidence — typed envelope + typed discriminated scope + envelope superRefine on evidence_refs), inv. 4 (audit logging — audit_chain_link_hash with length-prefix discipline; 4 terminal transitions produce typed Decisions; the Run record itself is the execution receipt for charter inv. 4's audit-as-internal-side-effect rule), inv. 6 (forbidden-tier non-escalable — preserved structurally upstream at operation_class enum closure + canonical policy YAML), inv. 7 (execute lane discipline — Run is the execution-receipt leg of the four-leg stack; ADR 0053 completes the stack typing), §Forbidden patterns clause (v1.3.1 line 138; operationalizing inv. 17 — Run execution-context traceability closed via kernel-set execution_context_id + Ring 1 verification + `run_execution_context_unresolvable` reason_kind), inv. 17 (execution context declared — kernel-set), inv. 18 (chain-walk via envelope superRefine unconditionally; Run forbidden in DerivedSummary.derived_from preserved), inv. 19 (freshness-bound via started_at + ended_at + execution-context-bound via kernel-set execution_context_id). All upheld.

### Rejects

- **Opaque `scope: z.json()`** — violates charter inv. 1. Rejected.

- **`run_kind` enum with multiple Zod-defined values at v1** (Option B) — rejected per the "enum value without scope semantics" lesson from ADR 0051 v2/v3. Future run_kinds (`'system_task'`, `'diagnostic'`) are registry-canonical reservations pending future schema PRs.

- **No `run_kind` discriminator at v1** (Option C) — rejected per discriminator-at-v1 established pattern.

- **Entity-level `tier_scope` column for forbidden-tier defense** — rejected per ADR 0051 v4 scope-back pattern. Forbidden-tier defense lives upstream at `OperationShape.operation_class` enum closure + canonical policy YAML.

- **Producer-supplied Run records** — Run is envelope-only-kernel-set throughout (no producer-asserted exceptions because Run records the kernel's view). Producer attempts to set ANY field are rejected with standard kernel-set producer enforcement.

- **Run records carrying raw secret values or producer-injection content** — all fields are kernel-set; producer cannot inject. The `scope.operation_shape_ref` and `scope.authorizing_decision_id` are typed FKs (UUID-shape) verified at Layer 1 mint API resolution.

- **Schema-level cross-record refinements** (`Run.execution_context_id == invoker_session.execution_context_id`, `Run.execution_context_id == authorizing_decision.execution_context_id`, `authorizing_decision.outcome == 'allow'`, `run_id` uniqueness at terminal-state mutation prevention, producer-disjointness equality with authorizing Decision) — all rejected at the schema layer because cross-record equality cannot be schema-validated against host state per registry §Cross-context enforcement layer §Schema validation alone is not an enforcement layer rule (mirrors ADR 0050 + ADR 0051 v4 + ADR 0052 patterns). The schema commits the field shapes; Ring 1 mint API performs cross-record checks.

- **Schema-level `ended_at >= started_at` refinement** — ACCEPTED at the schema layer (this is NOT a cross-record refinement; both fields are on the same Run record). Zod superRefine enforces `ended_at == null || ended_at >= started_at`; rejection emits `run_started_at_after_ended_at` reason_kind. **This is the ONE schema-level refinement accepted in this ADR** (distinct from cross-record refinements that defer to Ring 1).

- **Schema-level Run lifecycle in-place mutation** — Runs are immutable once minted; lifecycle transitions produce NEW Run records citing the prior in `evidence_refs` (supersession-via-evidence_refs pattern). Schema-level immutability refinement is Ring 1 mint-API responsibility.

- **Multiple active Runs for the same `authorizing_decision_id`** — Ring 1 mint API cardinality rule (one active Run per authorizing Decision at a time); the schema commits the rule per §Decision. Cross-record cardinality is not schema-enforceable.

- **`kernel_gateway` in `recorded_by` allowlist** — rejected by design. Gateway re-derive is authoritative non-escalable; gateway does not record Runs (Run recording is a mint_api or kernel_broker activity that follows operation execution).

- **`kernel_dashboard` producer extension bundled into this ADR** — rejected per policy-reviewer scope discipline. `kernel_dashboard` lands in its own coordinated future ADR (along with pre-emptive grant infrastructure from ADR 0051 v4 + force-break grant_kind from ADR 0052).

- **Runs authorized by Decisions with `outcome: 'deny'` or `outcome: 'informational'`** — only `outcome: 'allow'` Decisions can authorize Runs. Layer 1 mint API verifies; rejection emits `run_authorizing_decision_unresolvable`.

- **Runs whose execution context cannot be traced to a Ring 0 ExecutionContext** — charter §Forbidden patterns clause (v1.3.1 line 138; operationalizing inv. 17) forbids; Layer 1 mint API rejects with `run_execution_context_unresolvable`.

- **Mid-run terminal-state mutation** — attempted transition against a Run already in terminal state rejects with `run_terminal_state_mutation_attempt`. Terminal-state Run records are immutable; new lifecycle records (e.g., a follow-on retry) require a new authorizing Decision + new Run record.

- **Authoring Ring 1 mint API, broker FSM, gateway re-derive, dashboard surface, or canonical policy YAML for Run-tier rules** — all out of scope. Per workflow-sequencing investigation §Step 4, Ring 1 services land at `packages/kernel/`. Dashboard lands at `packages/dashboard/` per Milestone 5. Canonical policy YAML is Phase 2.5 lane at `system-config/policies/host-capability-substrate/`.

### Future amendments

- **`run_kind` enum extensions** — separate forthcoming ADRs land via schema PR following the §Procedure rule. Candidate run_kinds:
  - `'system_task'` — kernel-initiated background work (no authorizing_decision_id; possibly no invoker_session_id depending on Ring 1 design)
  - `'diagnostic'` — non-execution diagnostic operations (workspace_verify, etc.)

- **Ring 1 mint API implementation** consumes the Run entity. Enforces D-037 producer-disjointness (cross-step extended to Run-vs-authorizing-Decision), Run-state lifecycle transitions, cross-context binding equality (invoker ↔ Run ↔ authorizing_decision), authorizing-Decision outcome verification (`allow` only), ExecutionContext resolution, mid-run terminal-state mutation rejection, `ended_at >= started_at` superRefine.

- **Ring 1 execution broker service** — per workflow-sequencing investigation §Step 4: composes Decisions + ApprovalGrants + Leases + Runs into the execute-lane stack. Lives at `packages/kernel/src/execute/`.

- **Layer 3 gateway re-derive** (Milestone 5) — composes Decisions + ApprovalGrants + Lease state + Run state per workflow-sequencing investigation §Step 4.

- **`run_kind: 'system_task'` invoker-attribution convention** — when `system_task` lands, the invoker convention (kernel-as-invoker vs system-process-as-invoker vs nullable invoker_session_id) is committed at that ADR's reviewer dispatch.

- **`run_kind: 'diagnostic'` operation-class binding** — when diagnostic run_kind lands, it may bind specifically to `workspace_verify` operation_class or other diagnostic operation_class values; committed at that ADR.

- **CoordinationFact run-binding** — future ADRs may introduce CoordinationFact records whose `subject_kind` references Run (e.g., `subject_kind: 'run'` with run-specific predicate_kinds). Currently `'run'` is not in `coordinationSubjectKindSchema`; addition follows the §Procedure for adding a new subject_kind value rule (ADR 0048).

- **Reopen** if a future incident shows: v1 operation_execution scope shape inadequate, lifecycle state-set insufficient (additional terminal states needed beyond succeeded/failed/aborted/timeout), authorizing-Decision-required-for-all-runs rule blocks legitimate kernel-initiated work that cannot be modeled as `system_task`, producer-disjointness extension creates unintended escalation surfaces.

## Compliance

This ADR is Ring 0 docs-only at the ADR layer; the schema PR that follows is a Ring 0 schema-change PR per `.agents/skills/hcs-schema-change`. No cross-ring imports authored. No canonical policy YAML, runtime probes, dashboard route React components, MCP adapter contracts, hook bodies, charter invariant text changes, or Ring 1 mint API implementation in this commit. Registry-side changes (per the 11-item change-set in §Accepts) are bundled into this commit or a follow-on docs commit referencing this ADR. Complies with implementation charter v1.4.0.

**Implementation-detail acknowledgments** (per ADR 0049 + ADR 0050 + ADR 0051 v4 + ADR 0052 precedents):

- `prior_audit_chain_link_hash` is NOT a schema field on the Run record; it is an input to the `audit_chain_link_hash` canonical-concatenation computation at Ring 1 mint time. Chain-link continuity is enforced by Ring 1 storage on insert (Milestone 3 audit-events table).
- Genesis-collision defense for the same `run_id` audit-chain root is a Milestone 3 audit-events table unique-constraint commitment.
- **Canonical-concatenation field-order convention** (length-prefix discipline inheritance): per the ADR 0051 v4 retroactive posture rule, the `||` operator denotes length-prefix-encoded concatenation (`varint(byte_length) || field_bytes`). This rule covers ADR 0049 / ADR 0050 / ADR 0051 / ADR 0052 / ADR 0053 jointly. ADR 0053 places identity + discriminator first (`run_id`, `run_kind`, `scope`), followed by invoker identity (`invoker_session_id`, `invoker_agent_client_id`, `recorded_by`), followed by lifecycle (`started_at`, `ended_at`, `execution_context_id`, `run_state`), followed by evidence (`canonical(evidence_refs)`), followed by the chain link (`prior_audit_chain_link_hash`). The `'' for null` substitution rule applies to `ended_at`.
- `canonical(scope)` encoding is deferred to Ring 1 mint API; the schema commits the typed structure (discriminated union), and Ring 1 commits a deterministic serialization per branch.
- **Audit-event session identity**: Run lifecycle audit events carry an `event_session_id` field on the audit-event record (NOT on the Run Ring 0 entity). For run_start / run_succeed / run_fail / run_abort / run_timeout events, `event_session_id` typically equals `invoker_session_id` (the invoking session that initiated the operation). For kernel-detected events (e.g., timeout detected by broker FSM), `event_session_id` may be a kernel-detection session set by the broker FSM or gateway re-derive.
- **Cross-step chain-walk bounds**: the Ring 1 mint API enforces D-037 cross-step extension by walking the `derived_from` closure to detect chain-relation between Run and authorizing Decision. Walk-depth budget ≤ 64 records (v1 ceiling per ADR 0051 v4). Walk rejects cycles at Ring 1; ADR 0019 v3 §Acceptance defers cycle-detection rules to Ring 1 mint API; ADR 0051 v4 commits the Ring 1 rejection with `audit_chain_corruption_detected`; ADR 0053 inherits the rule.
- **Producer equality by class identity, not by delegation chain** — inherited from ADR 0051 v4 + ADR 0052.
- **Identity comparison form**: the cross-context-binding equality checks (`Run.execution_context_id == invoker_session.execution_context_id` and `Run.execution_context_id == authorizing_decision.execution_context_id`) are **UUID-byte-equality** comparisons (entityIdSchema-typed UUID-shape strings), not the Unicode/case/whitespace canonicalization-aware comparison form that ADR 0051 v4 §Self-approval rejection uses for principal-string comparisons. Mirrors ADR 0052 §Compliance MT-3 framing.
- **Schema-level Zod superRefine on `ended_at >= started_at`** is the ONE schema-level refinement accepted in this ADR (because both fields are on the same Run record, this is NOT a cross-record refinement; the registry §Cross-context enforcement layer §Schema-validation-alone rule that defers cross-record refinements does not apply). Layer 1 mint API additionally verifies the relationship; defense-in-depth.
- **Workflow-sequencing investigation §Step 1 completion**: with ADR 0053 accepted, the 5 foundational Ring 0 entities are all landed. Step 1 is structurally complete. The substrate is unblocked for the remaining steps (Step 2 Phase 2.5 canonical policy YAML in system-config — parallel-OK; Step 3 less-critical M1 entities batched; Step 4 Phase 3 Ring 1 services starting at `packages/kernel/`; Step 5 Ring 2 adapters; Step 6 Ring 3 regression runner). Schema PR per `.agents/skills/hcs-schema-change` may consolidate the five sibling-co-commitment schemaVersion literals (decisionSchemaVersionSchema, workspaceContextSchemaVersionSchema, approvalGrantSchemaVersionSchema, leaseSchemaVersionSchema, runSchemaVersionSchema) into a single coordinated landing.

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md` v1.4.0 — invariants 1, 4, 6, 7, 17 (Run execution-context traceability — §Forbidden patterns line 138 operationalizes this invariant), 18 (Run forbidden in DerivedSummary.derived_from), 19
- Decision ledger: `DECISIONS.md` (D-037 producer-disjointness rule from ADR 0049; D-row to be added at acceptance recording the final foundational-entity completion)
- Related ADRs:
  - ADR 0019 v3 (chain-promotion rule; four-class `derived_from` closure; cycle-rejection in chain construction)
  - ADR 0023 (Ring 0 Evidence base entity; `Evidence.run_id` optional FK shape that this ADR closes typed-target for)
  - ADR 0028 (`mint_api` + `kernel_broker` producers)
  - ADR 0049 (Decision Ring 0 entity introduction; D-037 producer-disjointness rule; outcome-compatibility classification format; envelope-level superRefine chain-walk precedent; foundational-entity #1)
  - ADR 0050 (WorkspaceContext Ring 0 entity introduction; envelope-level kernel-set framing; canonical-concatenation per-entity-orderings principle; named-enum-producer-schema pattern; forward-looking registry citation pattern; cross-record refinement §Rejects pattern; foundational-entity #2)
  - ADR 0051 v4 (ApprovalGrant Ring 0 entity introduction; envelope-level superRefine pattern; length-prefix canonical-concatenation discipline retroactive across foundational entities; D-037 additive cross-step extension; operation_class_scope documentation column pattern; scope-back lesson — no entity-level tier_scope structural defense layer; foundational-entity #3)
  - ADR 0052 (Lease Ring 0 entity introduction; preemptive-absorption strategy validated at 1-revision cycle; ADR 0031 v1 worktree-ownership composition typed schema landing; UUID-byte-equality identity comparison precedent; foundational-entity #4; immediate precedent in workflow-sequencing investigation §Step 1)
- Registry: `docs/host-capability-substrate/ontology-registry.md` v0.4.15 (forward-looking citation per the established pattern; current file frontmatter v0.4.11; ADR 0049 reserves v0.4.12 pending docs commit; ADR 0050 reserves v0.4.13 pending docs commit; ADR 0051 reserves v0.4.14 pending docs commit; ADR 0052 reserves v0.4.15 pending docs commit; ADR 0053 reserves v0.4.16 pending docs commit) — §Authority discipline (line 279+), §Cross-context enforcement layer (line 546+), §Audit-chain coverage of rejections (line 602+), §Subject-kind grounding requirement (line 443+), §Kernel-trusted producer allowlist final state (line 798+), §Naming-discipline §Sub-rule 9 enum-value casing (line 203 — `lower_snake_case` mandate for new enum values)
- Workflow-sequencing investigation: `docs/host-capability-substrate/research/local/2026-05-10-workflow-sequencing-investigation.md` §Step 1 entity #5 (Run); §Step 4 execution broker at `packages/kernel/src/execute/`
- Outstanding-work sequencing workflow: `docs/host-capability-substrate/research/local/2026-05-09-outstanding-work-sequencing-workflow.md`
- Implementation rules: `IMPLEMENT.md` §Required subagent reviews, §Change classes
- Plan: `PLAN.md` §Milestone 1 acceptance (line 672 — 22 canonical Ring 0 entities)
- Schema-change skill: `.agents/skills/hcs-schema-change/SKILL.md`
- Live policy authoritative source (out-of-scope for this ADR; Phase 2.5 lane): `~/Organizations/jefahnierocks/system-config/policies/host-capability-substrate/` — canonical operation_class → tier mapping; per-`run_kind` execution policies; sandbox-execution rules; authorizing-Decision-outcome verification rules
- Schema source for related entities:
  - `packages/schemas/src/entities/evidence.ts:114` (`Evidence.run_id: entityIdSchema.optional()` — this ADR closes the typed FK target)
  - `packages/schemas/src/entities/evidence.ts:138` (sandbox evidence subtype with required `run_id` — this ADR closes the typed FK target)
  - `packages/schemas/src/entities/evidence.ts:39` (`'run'` already in `evidenceSubjectKindSchema`; MT-2 at acceptance: corrected from the v1 draft's stale `:43` citation; this ADR does not modify the enum or bump `Evidence.schema_version`)
  - `packages/schemas/src/entities/operation-shape.ts:10-21` (`operationShapeOperationClassSchema` — 8-value closed enum, no `forbidden`; charter inv. 6 source-layer defense anchor; v1 `operation_execution` run_kind is operation-class-polymorphic across all 8 values)
  - `packages/schemas/src/entities/credential-plane-evidence.ts:42`, `:86` (existing Phase 2 evidence subtype referencing `run_id`)
  - `packages/schemas/src/entities/backup-readiness-evidence.ts:30` (existing Phase 2 evidence subtype referencing `run_id`)
  - `packages/schemas/src/entities/clean-room-smoke-receipt.ts:58`, `:92` (existing Phase 2 evidence subtype referencing `run_id`)
  - `packages/schemas/src/entities/project-substrate-evidence.ts:29`, `:92`, `:154` (existing Phase 2 evidence subtype referencing `run_id`; `validation_run_id` is a separate run-shaped FK that should also be typed-target-resolved post this ADR)
  - `packages/schemas/src/entities/runner-host-observation.ts:58`, `:92` (existing Phase 2 evidence subtype referencing `run_id`)
  - `packages/schemas/src/entities/resource-budget-observation.ts:59`, `:93` (existing Phase 2 evidence subtype referencing `run_id`)
  - `packages/schemas/src/entities/remote-agent-evidence.ts:26` (existing Phase 2 evidence subtype referencing `run_id`)
  - `packages/schemas/src/entities/tool-provenance.ts:102`, `:116`, `:123`, `:130` (existing Phase 2 evidence subtype referencing `run_id`)
- Currently-landed schemaVersion literals: `evidenceSchemaVersionSchema`, `knowledgeSourceSchemaVersionSchema`, `operationShapeSchemaVersionSchema` (sibling co-commitments `decisionSchemaVersionSchema` (ADR 0049) + `workspaceContextSchemaVersionSchema` (ADR 0050) + `approvalGrantSchemaVersionSchema` (ADR 0051) + `leaseSchemaVersionSchema` (ADR 0052) + `runSchemaVersionSchema` (this ADR) — five sibling co-commitments not yet landed in source per their schema PR deferrals; may land as a single coordinated schema PR at workflow-sequencing investigation §Step 4 boundary)

### External

- None directly; this ADR composes existing internal posture.
