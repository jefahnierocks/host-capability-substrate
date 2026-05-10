---
adr_number: 0049
title: Decision Ring 0 entity introduction
status: accepted
date: 2026-05-10
charter_version: 1.4.0
tags: [decision, ring-0, milestone-1, foundational-entity, reason-kind, audit-chain, gateway, mint-api, charter-v1-4-0, registry-v0-4-11, workflow-sequencing-step-1]
---

# ADR 0049: `Decision` Ring 0 entity introduction

## Status

`accepted`

Accepted 2026-05-10 with two mechanical tweaks at acceptance: (1) line-number citations to `ontology-registry.md` updated to current registry state per architect cosmetic — §Audit-chain coverage of rejections cited as line 602+ (was 499+); §Subject-kind grounding requirement cited as line 443+ (was 461); these drifted as the registry grew; (2) cross-reference note added in §Compliance distinguishing the §Audit-chain coverage of rejections layer-name vocabulary (`mint_api | broker_fsm | gateway` — naming the three-layer enforcement model) from the §Kernel-trusted producer allowlist producer-name vocabulary (`mint_api | kernel_broker | kernel_gateway | ...` — naming the kernel-set producer classes) per ontology non-blocking caveat 2; the two vocabularies serve different purposes and the registry sections are not in drift. All four required reviewers (`hcs-architect`, `hcs-ontology-reviewer`, `hcs-policy-reviewer`, `hcs-security-reviewer`) returned ready-for-acceptance on v2. v1 dispatch had returned 9-10 blocking items; v2 absorbed them all (Evidence schema-version-bump withdrawal, gate_target_already_active inclusion, producer allowlist reconciliation, audit_chain_link_hash shape commitment, decisionRedactionModeSchema commitment, Ring 0 chain-walk refinement, producer-disjointness rule, outcome-compatibility classification).

## Date

2026-05-10

## Charter version

Written against charter v1.4.0 and `docs/host-capability-substrate/ontology-registry.md` v0.4.11.

## Reviews

This ADR introduces a foundational Ring 0 entity referenced by 35+ `reason_kind` reservations across 7 ADRs and by registry §Audit-chain coverage of rejections. Required reviewer dispatch per `IMPLEMENT.md` §Required subagent reviews + the meta-ADR FK-table review-dispatch rule + the 2026-05-10 workflow-sequencing investigation §Step 1:

- `hcs-architect` — mandatory for any ADR
- `hcs-ontology-reviewer` — mandatory; ADR introduces a new Ring 0 entity with a reason_kind enum reservation that consolidates 7 prior ADR reservations
- `hcs-policy-reviewer` — mandatory; `Decision` records classify operations and policy outcomes; registry §Audit-chain coverage of rejections is policy-adjacent
- `hcs-security-reviewer` — mandatory; `Decision` records carry audit-chain integrity (charter inv. 4 — audit logging is internal side effect, not agent-callable) and reference evidence at authority-class boundaries

## Context

The 2026-05-10 workflow-sequencing investigation (`docs/host-capability-substrate/research/local/2026-05-10-workflow-sequencing-investigation.md`) recorded that `Decision` is the most-referenced missing foundational Ring 0 entity. 7 of 9 trigger-detection failures trace to its absence + the absent Ring 1 mint API. The investigation reframed "trigger-deferred" lanes as **foundation-prerequisite lanes** and recommended completing M1 foundational entities priority-ordered: `Decision` → `WorkspaceContext` → `ApprovalGrant` → `Lease` → `Run`.

`Decision` is referenced by:

- 35+ `Decision.reason_kind` reservations across registry §Decision.reason_kind reservation sections from ADRs 0030, 0032, 0033, 0035, 0036, 0037, 0047
- 3+ `Decision.required_grant_kind` reservations from ADRs 0030, 0035
- charter v1.4.0 inv. 18 chain-walk rejection clause (typed-grant minting layer rejections)
- charter v1.4.0 inv. 4 (audit logging — `Decision` records ARE the audit-chain entries for rejections)
- charter v1.4.0 inv. 7 (mutation_scope discipline; Decisions gate operations)
- registry §Audit-chain coverage of rejections (line 602+) — the rule that every rejection event produces a typed `Decision` record
- ADR 0048 dispositions (which assume future Decision-mediated rejections enforce per-candidate classification)
- M1 acceptance criterion (`PLAN.md` line 578) — `Decision` is one of the 22 canonical Ring 0 entities

Without a Ring 0 `Decision` entity:

- The 35+ registered `reason_kind` reservations cannot be consumed by any service (registry-canonical only)
- The §Audit-chain coverage of rejections rule has no surface to enforce
- The charter inv. 18 chain-walk rejection clause is structurally unenforceable
- ADR 0019 v3's three-layer enforcement model (mint API + broker FSM + gateway) cannot emit typed rejections
- Phase 2.5 canonical policy YAML in `system-config` cannot reference a typed Decision contract for its tier rules
- M1 cannot be marked complete; M2 (policy snapshot) cannot proceed; M3 (audit/storage) cannot land the audit-events table; M4-M6 follow

This ADR authorizes the Ring 0 `Decision` entity. It does NOT author the Ring 1 mint API, broker FSM, gateway, or audit hash chain — those are Phase 3+ work per the workflow-sequencing investigation §Step 4-5. This ADR commits the schema shape + an initial `reason_kind` union consolidating the 35 prior reservations + the procedure for future extensions.

The constraint stack: charter v1.4.0 inv. 1 (no policy decision in adapters), inv. 4 (audit logging is internal side effect, not agent-callable), inv. 7 (mutation_scope discipline), inv. 8 (no sandbox→stronger promotion), inv. 17 (execution context declared, not inferred), inv. 18 (derived retrieval is never decision authority), inv. 19 (boundary claims freshness-bound + execution-context-bound).

## Options considered

### Option A — Single Decision entity with comprehensive `reason_kind` enum (all 35 reservations enumerated up front)

A single Zod entity `Decision` with a closed `reason_kind` enum containing all 35 currently-registered values. Future ADRs extend the enum via standard schema-change PRs.

**Pros:**

- Closes all current reservations in one schema PR; complete vocabulary continuity
- Simplest mental model: one entity, one enum, one source of truth
- Mirrors the existing `evidenceAuthoritySchema` pattern (single closed enum)

**Cons:**

- 35 enum values is large for a v1; some reservations may need refinement at consumer time (e.g., the ADR 0030 worktree-mutation reasons may want richer payload binding)
- Hard to validate that all 35 are well-named without per-value review
- Schema PR scope is medium-to-large; first-cycle ambition risk

### Option B — Decision entity with discriminated-union per-source-ADR sub-shapes

A Zod discriminated union keyed on `reason_source_adr` (e.g., `"adr-0030" | "adr-0032" | ...`) where each branch carries its own ADR-specific `reason_kind` enum and payload shape.

**Pros:**

- Per-ADR payload binding: each Decision branch can carry typed payload-evidence specific to its source ADR
- Easier review: each branch reviewed against its source ADR independently
- Future ADRs add new branches without touching existing ones

**Cons:**

- Encodes ADR provenance into the schema, violating the principle that schemas should describe entity semantics not authoring history
- 7+ initial branches is heavy; subsequent ADRs proliferate branches
- The `reason_source_adr` discriminator is an authoring artifact, not a semantic discriminator
- Cross-ADR reason_kind reuse becomes awkward (e.g., a future generalized `evidence_authority_overreach` reason_kind that applies across ADRs)

### Option C — Decision entity with single closed `reason_kind` enum AND a registered procedure for future extensions; v1 lands a curated subset of the 35 reservations grouped by enforcement readiness

A single `Decision` entity. The `reason_kind` enum lands an initial subset of the 35 reservations chosen by enforcement-readiness criterion: values referenced by **already-built schemas** (Phase 2 schema train) and **already-registered registry rules** (charter v1.4.0 invariants, registry §Subject-kind grounding requirement, registry §Audit-chain coverage of rejections). Values referenced only by ADR text but not by any schema or registry rule defer to follow-on schema PRs that land them alongside the Ring 1 service that consumes them.

The registry §Decision enum mirrors section is updated to mark per-value Zod-source-defined vs registry-canonical-only state. A new §Procedure for adding a new reason_kind value rule (mirroring §Procedure for adding a new subject_kind value) commits the future-extension procedure.

**Pros:**

- Aligns with the workflow-sequencing investigation Step 1 minimum-viable approach: land the entity foundation now, extend incrementally as Ring 1 services land
- Curated v1 enum is more reviewable; each landed value has a clear enforcement consumer
- Future reason_kind extensions follow a procedure rule (reviewer dispatch, classification statement, registry update co-located with schema PR), preventing drift
- Mirrors the existing §Subject-kind grounding requirement procedural pattern, which has been validated by ADR 0048
- Smaller v1 schema PR scope; faster reviewer cycle

**Cons:**

- Some currently-registered reason_kind values stay registry-canonical-only longer than under Option A
- Two reason_kind populations (Zod-defined vs registry-canonical-only) create temporary drift in the registry until each lands

## Decision

**Option C.** Single `Decision` entity with a curated initial `reason_kind` enum chosen by enforcement-readiness criterion. New §Procedure for adding a new reason_kind value rule registered for future extensions.

Initial Zod-defined `reason_kind` union (v1 — 15 values, chosen by enforcement-readiness criterion: values referenced by charter invariants + registered registry rules + already-built schemas):

| Value | Source ADR | Why in v1 | Outcome compatibility |
|---|---|---|---|
| `coordination_promotion_no_layer1_grounding` | ADR 0036 §Sub-decision (b) §Layer 1 grounding requirement | Referenced by registry §Subject-kind grounding requirement §Rule (line 443+) | `deny`-only |
| `deletion_authority_kind_ref_mismatch` | ADR 0036 §Sub-decision (c) | Referenced by `OperationShape` Zod source today (`operation-shape.ts` discriminated union) | `deny`-only |
| `cleanup_plan_authority_source_stale` | ADR 0047 §Accepts | Referenced by `OperationShape.cleanup_plan` branch (Zod source) and ADR 0047 §Future amendments gateway re-walk | `deny`-only |
| `cleanup_plan_target_under_active_lease` | ADR 0047 §Accepts | Distinct from ADR 0031's `worktree_lease_held_by_other_session` | `deny`-only |
| `worktree_lease_held_by_other_session` | ADR 0031 v1 | Referenced by ADR 0031 v1 worktree-lease taxonomy + ADR 0047 distinction text | `deny`-only |
| `gate_provisional` | ADR 0035 | Referenced by `QualityGate` Zod source (lifecycle state) | `informational`-only |
| `gate_denied` | ADR 0035 | Referenced by `QualityGate` Zod source (lifecycle state) | `deny`-only |
| `gate_expired` | ADR 0035 | Referenced by `QualityGate` Zod source (lifecycle state) | `deny`-only |
| `gate_evidence_insufficient` | ADR 0035 | Referenced by `QualityGate` chain-walk refinement (Zod source) | `deny`-only |
| `gate_target_already_active` | ADR 0035 | Referenced by `QualityGate` Zod source (target_subject_ref discipline) | `deny`-only |
| `gate_evidence_stale_reuse` | ADR 0035 | Referenced by `QualityGate` chain-walk refinement | `deny`-only |
| `agent_client_axis_self_asserted` | ADR 0037 | Referenced by `AgentClient` Zod source authority discipline + trap #50 | `deny`-only |
| `containment_evidence_absent` | ADR 0037 | Referenced by `BoundaryObservation` payload bundle + `ExecutionContext` containment cache | `deny`-only |
| `containment_evidence_producer_supplied` | ADR 0037 | Referenced by `BoundaryObservation` kernel-set producer rule | `deny`-only |
| `containment_runtime_capability_exceeded` | ADR 0037 | Referenced by ADR 0037 §Composition rule + AgentClient × ExecutionContext narrower-wins | `deny`-only |

Outcome-compatibility rule: a `deny`-only `reason_kind` minted with `outcome: 'informational'` is rejected (closes audit-chain-launder surface where a deny event could be logged as informational). Only `gate_provisional` is `informational`-only in v1 (it names a state transition, not a rejection). No `reason_kind` is currently compatible-with-both; future ADRs introducing `'either'`-classified values must justify the dual compatibility per the §Procedure rule.

The remaining 21+ reservations stay **registry-canonical pending future schema PR** (each landing alongside the Ring 1 service or schema that consumes it), per the registered procedure.

The Decision entity carries:

- `decision_id` — stable local entity identifier per `entityIdSchema`
- `operation_shape_ref` — typed FK to the `OperationShape` the Decision applies to
- `outcome` — `'allow' | 'deny' | 'informational'`
- `reason_kind` — closed enum (initial 15 Zod-defined values; extensible per the registered §Procedure)
- `reason_text` — free-form display text bounded by `decisionRedactionModeSchema = evidenceRedactionModeSchema.exclude(['none'])` (so `redaction_mode` cannot be `'none'`); max length 256 chars; producer-supplied `op://` URIs, JWT-shaped values, `sk-…` prefixes, and other resolved-secret-shaped substrings rejected at Ring 1 mint per registry §Redaction posture §Field-level scrubber rule. Schema-layer enforcement: bounded length + redaction-mode floor; substring scrubbing at Ring 1.
- `reason_text_redaction_mode` — `decisionRedactionModeSchema` instance; required when `reason_text` is non-empty; documents which redaction class applies
- `evidence_refs` — array of chain-aware references mirroring `qualityGateEvidenceRefSchema` precedent (chain-walk refinement at Ring 0 mirrors `qualityGateSchema` superRefine: rejects direct `KnowledgeChunk` references and `Evidence` refs with `authority: 'sandbox-observation' | 'self-asserted'`; transitive deep-walk deferred to Ring 1 mint API per registry §Cross-context enforcement layer)
- `decided_by` — kernel-set producer; allowlist values are existing `mint_api` (already in registry §Kernel-trusted producer allowlist final state), existing `kernel_broker`, and NEW `kernel_gateway` (added by this ADR)
- `decided_at` — ISO 8601 timestamp
- `valid_until` — non-null per inv. 19; freshness binding for gateway re-derive consumption
- `execution_context_id` — kernel-set per inv. 19; cross-context substitution defense lives at Ring 1 per registry §Cross-context enforcement layer (schema-layer refinement asserting field-equality across `evidence_refs` is rejected because cross-context binding cannot be schema-validated against host state — see §Rejects)
- `audit_chain_link_hash` — `sha256DigestSchema` (required, non-empty, sha256-shape-validated). Covers the canonical concatenation of `decision_id || operation_shape_ref || outcome || reason_kind || decided_by || decided_at || valid_until || execution_context_id || canonical(evidence_refs) || (required_grant_kind || '') || prior_audit_chain_link_hash`. Genesis Decision policy: a Decision is genesis iff its audit-chain link hash equals `sha256(decision_id || ... || 'GENESIS')` (sentinel `'GENESIS'` substitutes for the prior hash); the audit-events table per Milestone 3 enforces no two genesis-classified records exist for the same audit-chain root. Hash coverage is committed at Ring 0 to make the chain-link semantics structurally checkable; chain-link continuity is enforced by Ring 1 storage on insert.
- `required_grant_kind` — optional kernel-set enum value naming the grant that, if minted, would change the outcome. **Advisory only**: per registry §Cross-context enforcement layer §Layer-disagreement tiebreaker, the gateway re-derives tier and grant-applicability at decision time; a Decision naming a `required_grant_kind` does not bind the gateway to accept the grant. Charter inv. 6 (forbidden-tier non-escalable): no `required_grant_kind` value can clear a `forbidden`-tier denial — the three v1 grant kinds (`gate_evidence_acknowledgment`, `worktree_clean_acknowledgment`, `pr_absence_acknowledgment`) all originate from ADR 0030/0035 surfaces tiered `write-host`/`write-destructive`, never `forbidden`.
- `schema_version` — entity-specific literal `'0.1.0'` per Phase 2.1 standalone-entity convention; uses `decisionSchemaVersionSchema = z.literal('0.1.0')` mirroring the entity-specific-literal precedent (`evidenceSchemaVersionSchema`, `boundaryObservationSchemaVersionSchema`).

The Decision entity is **kernel-set throughout**. Producer-supplied `Decision` records are rejected at the (future) Ring 1 mint API; this rule is registered here for the future enforcement layer.

## Consequences

### Accepts

- **`Decision` Ring 0 entity introduced** with the schema fields enumerated in §Decision. Initial `schema_version: '0.1.0'` via entity-specific `decisionSchemaVersionSchema = z.literal('0.1.0')`. Lives at `packages/schemas/src/entities/decision.ts`. Closes M1 acceptance criterion #15 (`Decision` in the canonical 22-entity list).

- **Initial `decisionReasonKindSchema` Zod-defined enum** with the 15 values enumerated in §Decision §Initial Zod-defined `reason_kind` union (closes all six ADR 0035 reservations including `gate_target_already_active`).

- **`Decision.outcome` discriminator** — `'allow' | 'deny' | 'informational'`. The `informational` value supports non-blocking flag events (e.g., the cleanup-plan hint-resolution status that ADR 0047 originally placed as a Decision but moved to `DerivedSummary.summary_text` precisely because hint-resolution is not a rejection; future similar non-rejection state changes that DO need audit-chain coverage can use `informational`).

- **`Decision.required_grant_kind` initial enum** with the three values `gate_evidence_acknowledgment` (ADR 0035), `worktree_clean_acknowledgment` (ADR 0030), `pr_absence_acknowledgment` (ADR 0030). Future extensions follow the same procedure as `reason_kind`.

- **No `Evidence` schema-version bump.** `Evidence.subject_kind: 'decision'` already exists in `evidence.ts` line 37 (added in earlier Phase 1 / Phase 2 work; the value has been part of the enum since `evidenceSubjectKindSchema` was authored). This ADR does not modify `evidenceSubjectKindSchema` and does not bump `Evidence.schema_version`. The pre-existing `'decision'` value is the FK target the new `Decision` entity is referenced by; no Evidence schema change is required to introduce a new Ring 0 entity that becomes a typed subject.

- **Producer allowlist for `Decision.decided_by`** uses existing `mint_api` and `kernel_broker` from the registry §Kernel-trusted producer allowlist final state (already present per ADR 0028); adds NEW `kernel_gateway` only. Updated registry §Kernel-trusted producer allowlist final state to add `kernel_gateway` as a new row; does not rename `mint_api` to `kernel_mint_api` (preserves existing convention; the unprefixed `mint_api` is the canonical producer name per ADR 0028). Producer-supplied `Decision.decided_by` values are rejected at the (future) Ring 1 mint API per registry §Producer-vs-kernel-set authority fields rule. The `Decision.required_grant_kind` and `Decision.execution_context_id` fields are also kernel-set per the same rule (registered explicitly in §Producer-vs-kernel-set authority fields when this ADR's registry change-set lands).

- **Audit-chain integration commitment**: every `Decision` record carries `audit_chain_link_hash` linking to the prior audit-chain entry. The hash chain itself is built by Ring 1 storage (per Milestone 3); this ADR commits the `Decision` envelope's contribution. The §Audit-chain coverage of rejections rule is now operationally referenced from a Ring 0 entity rather than registry-only.

- **Cross-context binding (inv. 19) inherited unchanged**: `Decision.execution_context_id` is kernel-set; cross-context substitution is rejected per registry §Cross-context enforcement layer.

- **NEW §Procedure for adding a new reason_kind value rule** registered in `ontology-registry.md` mirroring the existing §Procedure for adding a new subject_kind value rule. Future schema PRs extending the enum:
  1. Cite the source ADR / charter rule that the reason_kind enforces (the registered authority for the new value)
  2. Classify the reason_kind by `outcome` constraint with citation: `deny`-only, `informational`-only, or `'either'` (compatible with both). The classification lands in the §Decision.reason_kind status table. `'either'` requires the schema PR to document at least one consumer that emits each variant; `'either'` without a documented consumer reverts to the more-restrictive classification (typically `deny`-only) per `hcs-ontology-reviewer` discretion.
  3. Update registry §Decision enum mirrors and §Decision.reason_kind status table (Zod-defined vs registry-canonical) at the same change-set, never in a follow-on commit
  4. Pass `hcs-ontology-reviewer` confirmation (always); `hcs-policy-reviewer` if the reason_kind classifies operations or gates; `hcs-security-reviewer` if the reason_kind touches authority-discipline boundaries; `hcs-architect` is mandatory for all schema-PR-extending-Decision additions

- **Registry change-set bundled into this ADR's commit (or follow-on docs commit referencing this ADR)**. Registry version bumps `v0.4.11` → `v0.4.12`. Changes:
  1. NEW §Decision entity section (entity overview + field-shape mirror)
  2. NEW §Decision.reason_kind status table (15 Zod-defined values + 21+ registry-canonical-pending values, each with source ADR + outcome-compatibility + projected consumer)
  3. NEW §Decision.outcome enum mirror (3 values: `allow | deny | informational`)
  4. NEW §Decision.required_grant_kind enum mirror (3 values: `gate_evidence_acknowledgment | worktree_clean_acknowledgment | pr_absence_acknowledgment`)
  5. NEW §Procedure for adding a new reason_kind value rule (mirrors §Procedure for adding a new subject_kind value)
  6. UPDATE §Kernel-trusted producer allowlist final state — add row for `kernel_gateway` (existing `mint_api` and `kernel_broker` rows unchanged)
  7. UPDATE §Producer-vs-kernel-set authority fields — enumerate `Decision.decided_by`, `Decision.execution_context_id`, `Decision.required_grant_kind`, and `Decision.audit_chain_link_hash` as kernel-set on `Decision` envelopes

- **Producer-disjointness rule** (security review B4): a Decision with non-null `required_grant_kind` MUST NOT be co-minted with an `ApprovalGrant` satisfying that grant kind in the same audit-chain step; the satisfying grant is minted by a separate producer at a later audit-chain link. Registered as posture commitment here for the future Ring 1 mint API to enforce; the ADR 0050 (`ApprovalGrant`) ADR will commit the corresponding ApprovalGrant-side rule.

- **D-row in `DECISIONS.md`** recording the entity introduction + initial enum disposition + the four mechanical commitments at acceptance (Evidence schema-version-bump withdrawal, gate_target_already_active inclusion, producer allowlist reconciliation, audit_chain_link_hash shape commitment, decisionRedactionModeSchema commitment, Ring 0 chain-walk refinement, producer-disjointness rule).

- **Charter compliance**: inv. 1 (no policy decision in adapters — Decision records are kernel-emitted, not adapter-emitted; the Ring 1 mint API enforces this), inv. 4 (audit logging is internal side effect — Decision records are not agent-callable; the audit-chain reads are separate from Decision mints), inv. 7 (mutation_scope discipline — Decision-mediated gate evaluation precedes any mutation_scope ≠ 'none' operation), inv. 8 (no sandbox→stronger — Decision evidence_refs subject to ADR 0019 v3 chain-promotion + inv. 18 chain-walk rejection), inv. 17 (execution context declared — `Decision.execution_context_id` is kernel-set, required), inv. 18 (derived retrieval is never decision authority — Decision is the gate authority, not derived; Decision.evidence_refs subject to chain-walk rejection at the future mint API), inv. 19 (freshness-bound + execution-context-bound — Decision.valid_until non-null; Decision.execution_context_id kernel-set). All upheld.

### Rejects

- **Per-source-ADR discriminated union** (Option B) — encodes authoring history into schema; rejected.

- **Comprehensive 35-value enum at v1** (Option A) — schema PR scope too large for a foundational-entity introduction; rejects.

- **Producer-supplied Decision records** — Decision is kernel-set throughout. Producers asserting their own Decision values would defeat the audit-chain integrity rule. Producer attempts at the (future) Ring 1 mint API are rejected with the standard kernel-set producer enforcement.

- **Decision entity carrying resolved secret values or raw payload content** — Decision.reason_text is brief, redaction-mode-bound display text. Resolved secret material is forbidden per charter inv. 5. Raw payload that needs persistence belongs in linked Evidence records, not in Decision.

- **Decision.evidence_refs accepting `KnowledgeChunk` records directly or `Evidence` records with `authority: 'sandbox-observation' | 'self-asserted'`** — per inv. 18, Decisions consume only typed Evidence or CoordinationFact records with kernel-set `allowed_for_gate: true`. The schema constrains the reference shape at Ring 0 via a chain-walk Zod refinement on `Decision.evidence_refs` mirroring the `qualityGateSchema` superRefine pattern (rejects direct `KnowledgeChunk` references and unpromoted authority classes); transitive deep-walk against host state is enforced at the future Ring 1 mint API per registry §Cross-context enforcement layer (schema validation alone is not an enforcement layer for cross-context binding).

- **Schema-level `Decision.execution_context_id` field-equality refinement** asserting it matches at least one referenced Evidence's `execution_context_id` — rejected because cross-context binding cannot be schema-validated against host state per registry §Cross-context enforcement layer §Schema validation alone is not an enforcement layer rule (registry line 559+). Cross-context substitution defense lives at Ring 1 (mint API + broker re-check + gateway re-derive); the schema layer only commits the field as kernel-set + non-null. This rejection is registered explicitly to forestall reviewer churn on future schema PRs.

- **Schema-level Decision-immutability refinement** asserting "this record was not previously minted" — rejected because Zod cannot reach prior storage state. Decision immutability is a Ring 1 mint-API invariant: the future mint API enforces append-only by construction (insert-only into the audit-events table per Milestone 3). Supersession via NEW Decision record citing prior in `evidence_refs` is the pattern; the prior record remains immutable.

- **Co-minting Decision with satisfying ApprovalGrant in the same audit-chain step** — rejected per the producer-disjointness rule registered in §Accepts. A Decision with non-null `required_grant_kind` MUST NOT be co-minted with an ApprovalGrant satisfying that grant kind by the same producer in the same audit-chain step; the satisfying grant is minted by a separate producer at a later audit-chain link. This rule defends against self-approving chain-mint attacks where a single producer could emit a deny + grant pair to self-clear.

- **`outcome: 'informational'` paired with `deny`-only `reason_kind` values** — rejected per the outcome-compatibility rule in §Decision §Initial Zod-defined `reason_kind` union. Each `reason_kind` carries an outcome-compatibility classification; mismatched pairings reject at the schema layer. This defends against audit-chain-launder where a deny event could be logged as `informational` to bypass policy enforcement.

- **Decision lifecycle state machine** — Decision records are immutable once minted; supersession is via a NEW Decision record citing the prior in evidence_refs. No `decision_state` enum, no in-place updates. Audit-chain integrity depends on this immutability.

- **Authoring the Ring 1 mint API** — out of scope for this Ring 0 entity ADR. Per workflow-sequencing investigation §Step 4, the mint API lands at `packages/kernel/src/mint/` after foundational entities (this ADR + the subsequent four) all land. This ADR commits the entity contract that the mint API will consume.

- **Authoring canonical policy YAML for Decision-mediated gates** — out of scope; Phase 2.5 lane in `system-config`. Per workflow-sequencing investigation §Step 2 (parallel-OK with this ADR's schema PR).

- **Authoring `ApprovalGrant`, `Lease`, `Run`, `WorkspaceContext`, or any other foundational entity** — each is its own ADR + schema PR cycle per the investigation §Step 1 ordering.

- **Adding the remaining 21+ `reason_kind` reservations to the v1 Zod enum** — per Option C, those land alongside the Ring 1 service or schema that enforces each. Each future extension follows the registered §Procedure for adding a new reason_kind value rule.

### Future amendments

- **Subsequent reason_kind extensions** land via schema PR following the new §Procedure for adding a new reason_kind value rule. The 21+ deferred values (from ADRs 0030, 0032, 0033, 0035, 0036, 0037) each cite a specific consumer (Ring 1 service, schema refinement, or canonical policy YAML rule) and an `hcs-ontology-reviewer` pass.

- **Ring 1 mint API implementation** consumes the Decision entity and emits typed Decision records via the Layer 1 mint API per ADR 0019 v3 §Three-layer enforcement model. Lives at `packages/kernel/src/mint/`. Per workflow-sequencing investigation §Step 4.

- **Audit hash chain implementation** (Milestone 3) consumes `Decision.audit_chain_link_hash` and builds the `audit_events` SQLite table per `PLAN.md` §Milestone 3.

- **Dashboard surfacing of Decision records** (Milestone 5) per `PLAN.md` Milestone 5 §View-model contracts (`PolicyDecisionCard`).

- **Future `DecisionAuditEntryObservation` Evidence subtype** (if needed) — typed observation about a Decision's audit-chain integrity. Reserves the `Evidence.subject_kind: decision` extension this ADR commits.

- **Decision-supersession semantics** — a NEW Decision record citing a prior Decision in `evidence_refs` supersedes the prior. The supersession rule is committed in this ADR; the `superseded_by_decision_id` cross-reference field on the prior is registered as a future amendment if usage shows the cross-reference is needed for query efficiency.

- **Reopen** if the Ring 1 mint API design surfaces a need for additional Decision fields not anticipated here (e.g., a per-Decision `mint_layer` discriminator distinguishing layer-1 mint vs layer-2 broker re-check vs layer-3 gateway re-derive); such a need is itself evidence the Ring 1 design has crystallized and warrants ADR-level commitment.

## Compliance

This ADR is Ring 0 docs-only at the ADR layer; the schema PR that follows is a Ring 0 schema-change PR per `.agents/skills/hcs-schema-change`. No cross-ring imports authored. No canonical policy YAML, runtime probes, dashboard route React components, MCP adapter contracts, hook bodies, or charter invariant text changes in this commit. Registry-side changes (NEW §Decision entity section + §Procedure for adding a new reason_kind value rule + §Decision enum mirrors + producer allowlist extension + version bump) are bundled into this commit or a follow-on docs commit referencing this ADR. Complies with implementation charter v1.4.0.

**Vocabulary note (acceptance non-blocking caveat 2 absorbed)**: registry §Audit-chain coverage of rejections uses **layer-name** vocabulary (`mint_api | broker_fsm | gateway`) to identify the three-layer enforcement model per ADR 0019 v3 §Three-layer enforcement model. Registry §Kernel-trusted producer allowlist final state uses **producer-name** vocabulary (`mint_api | kernel_broker | kernel_gateway | kernel_telemetry | kernel_agent_client_resolver | kernel_workspace_diagnose`) to identify kernel-set producers permitted on `Evidence.producer` and `Decision.decided_by`. The two vocabularies serve different purposes: layer-names describe the enforcement architecture (where rejection happens); producer-names describe the kernel-trusted classes (who emits records). The shared `mint_api` token is intentional — the layer-1 enforcement *is* the mint API, and the producer that emits Decision records *is* `mint_api`. The shared `kernel_broker | kernel_gateway` tokens follow the same pattern (broker FSM + gateway re-derive are layer-2 and layer-3 enforcement, and `kernel_broker | kernel_gateway` are the kernel-trusted producers that emit records at those layers). This vocabulary alignment is by design, not drift. Future readers should not interpret the two sections as competing taxonomies.

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md` v1.4.0 — invariants 1, 4, 7, 8, 17, 18, 19; §Authoring rules; §Forbidden patterns
- Decision ledger: `DECISIONS.md` (D-row to be added at acceptance)
- Related ADRs (reason_kind reservations consumed):
  - ADR 0030 v2 (Q-006 Stage 2 source-control evidence)
  - ADR 0031 v1 (Q-008(d) worktree-lease taxonomy)
  - ADR 0032 v2 (Q-005 CI runner evidence)
  - ADR 0033 v2 (Q-006 GitHub authority and identity)
  - ADR 0035 v2 (Q-007(g) QualityGate standalone entity)
  - ADR 0036 (Q-009 workspace manifest projection — §Sub-decision (b) Layer 1 grounding requirement; §Sub-decision (c) deletion authority)
  - ADR 0037 (Q-010 cross-agent isolation — `Decision.reason_kind` reservations from §Cross-cutting rules)
  - ADR 0047 (cleanup-plan composition)
  - ADR 0048 (Phase 2.7 subject-kind grounding evaluation — dispositions reference future Decision-mediated rejections)
- Registry: `docs/host-capability-substrate/ontology-registry.md` v0.4.11 — §Authority discipline (line 279+), §Cross-context enforcement layer (line 546+), §Audit-chain coverage of rejections (line 602+), §Subject-kind grounding requirement (line 443+), §Decision.reason_kind reservation sections from each consuming ADR
- Workflow-sequencing investigation: `docs/host-capability-substrate/research/local/2026-05-10-workflow-sequencing-investigation.md` §Step 1 entity #1 (Decision priority highest)
- Outstanding-work sequencing workflow: `docs/host-capability-substrate/research/local/2026-05-09-outstanding-work-sequencing-workflow.md`
- Implementation rules: `IMPLEMENT.md` §Required subagent reviews, §Change classes
- Plan: `PLAN.md` §Milestone 1 acceptance (line 578 — 22 canonical Ring 0 entities); §Milestone 2 (Decision schema is M2 entry point)
- Schema-change skill: `.agents/skills/hcs-schema-change/SKILL.md`
- Schema source for related entities: `packages/schemas/src/entities/evidence.ts`, `coordination-fact.ts`, `quality-gate.ts`, `operation-shape.ts`, `boundary-observation.ts`

### External

- None directly; this ADR composes existing internal posture.
