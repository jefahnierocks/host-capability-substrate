---
adr_number: 0047
title: system.cleanup.plan.v1 composition with workspace-diagnose summary
status: proposed
date: 2026-05-09
charter_version: 1.4.0
tags: [cleanup-plan, deletion-authority, workspace-diagnose, derived-summary, operation-shape, charter-v1-4-0, registry-v0-4-7, adr-0036-followup, q-009-followup, architect-f4]
---

# ADR 0047: `system.cleanup.plan.v1` composition with workspace-diagnose summary

## Status

`proposed`

## Date

2026-05-09

## Charter version

Written against charter v1.4.0 and `docs/host-capability-substrate/ontology-registry.md` v0.4.7.

## Reviews

This ADR introduces enum reservations, an FK-bearing operation surface, and authority-class composition rules across `OperationShape`, `DerivedSummary`, and `Decision`. Required reviewer dispatch per `IMPLEMENT.md` §Required subagent reviews + the meta-ADR FK-table review-dispatch rule (memory `feedback_meta_adr_fk_table_review_dispatch.md`):

- `hcs-architect` — mandatory for any ADR
- `hcs-ontology-reviewer` — mandatory; ADR reserves enum extensions and commits chain-promotion composition rules
- `hcs-policy-reviewer` — mandatory; ADR introduces a new `operation_class` and commits class-I composition discipline

`hcs-security-reviewer` is not required for this posture-only commit but should be added if a future revision touches `.claude/`/`.codex/` settings or hook posture.

## Context

ADR 0036 (Q-009 workspace manifest projection) committed the deletion-authority field-shape on `OperationShape` (`deletion_authority_kind` + `deletion_authority_source_ref` polymorphic FK) and reserved `system.cleanup.plan.v1` as an operation-shape that "lands when canonical policy YAML at Milestone 2 ships." The deletion-authority field-shape landed in Phase 2.2.2 (commit `c58a21b`) with four typed `deletion_authority_kind` values: `filesystem_protected_paths_observation`, `coordination_fact`, `human_dashboard_grant`, `runtime_state_classification`. ADR 0036 §Future amendments explicitly reserves a follow-up ADR for `system.cleanup.plan.v1` composition with `system.workspace.diagnose.v1` outputs (architect F4 — "whether cleanup-plan consumes the workspace-diagnose summary as authoritative input, and what re-derivation is required").

This ADR resolves architect F4 and commits the composition rule.

`system.workspace.diagnose.v1` (also from ADR 0036) outputs a `DerivedSummary` of `summary_kind: "operational_summary"` whose `derived_from` cites Layer 1 operational evidence and Layer 2 audit-profile `KnowledgeChunk` records. The summary is `allowed_for_gate: false` by default; charter v1.4.0 inv. 18 chain-walk rejection structurally blocks promotion when `KnowledgeChunk` refs are present.

The forcing question: cleanup operations require typed deletion-authority source refs per D-025 + ADR 0036. If the cleanup-plan operation consumes the diagnose summary as input, does it inherit the summary's `allowed_for_gate: false` posture? Does it re-derive Layer 1 evidence at plan-construction time, or rely on the summary's previously-cited evidence?

The constraint stack: charter v1.4.0 inv. 7 (mutation_scope discipline), inv. 8 (no sandbox→stronger promotion), inv. 13 (cleanup derivability-authority), inv. 18 (derived retrieval is never decision authority), inv. 19 (boundary claims freshness-bound and execution-context-bound), ADR 0036 deletion-authority discipline, and `IMPLEMENT.md` §Change classes (cleanup execution remains class I until M4). Together they require: cleanup-plan output records must each cite a freshly-derived typed-Evidence authority source, never inherit a `DerivedSummary` graph as authority, and downstream class-I consumers must re-walk authority refs at consumption time.

## Options considered

### Option A — `system.cleanup.plan.v1` consumes the workspace-diagnose summary as advisory structured input, with full re-derivation at plan-construction time

The plan operation accepts `(workspace_id, summary_id)`. It reads the summary to enumerate candidate paths, then independently re-derives Layer 1 evidence for each candidate's deletion-authority source ref. Each output `OperationShape` carries a freshly-minted authority ref; the summary itself is never cited by any output record.

**Pros:**

- Natural composition with `system.workspace.diagnose.v1`; the summary's path enumeration accelerates plan construction
- Explicit re-derivation step satisfies inv. 18 chain-walk rejection (the summary is consumed as discovery, not authority)
- Plan construction is deterministic relative to Layer 1 state at plan time, regardless of summary age

**Cons:**

- "Advisory structured input" semantics blur the line between authoritative and non-authoritative inputs in the operation surface
- A typed input field for the summary id implies the plan operation has a dependency on the summary, which may not always be true (callers may want to invoke cleanup-plan without a prior diagnose pass)
- Future readers may misread the field as authority-bearing without careful documentation

### Option B — `system.cleanup.plan.v1` consumes Layer 1 evidence directly, ignoring the summary entirely

The plan operation accepts `(workspace_id)` only. It runs its own Layer 1 query path independently of any prior diagnose summary. The summary is irrelevant to plan construction.

**Pros:**

- Simplest dependency graph; cleanup-plan is fully self-contained
- No chain-walk concern at all (no summary consumption surface to scrutinize)
- Plan operation can be invoked standalone, without any prior diagnose pass

**Cons:**

- Loses the audit-profile claim enumeration that the diagnose summary already produced (the plan would have to re-query Layer 2 audit-profile content even when a fresh summary exists)
- Doubled compute for the common case where a diagnose summary was just produced
- No natural composition with the diagnose surface; the two operations are unrelated despite serving adjacent purposes

### Option C — `system.cleanup.plan.v1` accepts the workspace-diagnose summary as an opt-in discovery hint, never as structured authority-bearing input

The plan operation accepts `(workspace_id, cleanup_scope, discovery_hint_summary_id?)`. The summary id is optional and explicitly typed as a discovery hint via the field name. The plan uses it only to seed the candidate-path enumeration; the plan ignores the summary's `derived_from` graph for authority purposes. Each output `OperationShape` carries a freshly-minted deletion-authority source ref derived from Layer 1 at plan time. If the hint resolves to a stale or invalid summary, the plan ignores the hint and proceeds without it (does not fail).

**Pros:**

- Field name `discovery_hint_summary_id` is self-documenting; future readers cannot misread it as authority-bearing
- Opt-in coupling allows the plan operation to be invoked standalone, with or without a prior diagnose pass
- Hint failure modes (stale, missing, mismatched workspace) gracefully degrade rather than fail the plan
- Re-derivation at plan time satisfies inv. 18 / inv. 19 by construction at the input layer
- Smallest new operation surface — one optional input field, no new authority semantics

**Cons:**

- Slight performance asymmetry between hinted and non-hinted invocations (hinted invocations skip Layer 2 enumeration if the hint covers it)
- Requires explicit semantics documentation for what "discovery hint" means operationally

## Decision

**Option C.** `system.cleanup.plan.v1` accepts the workspace-diagnose summary as an opt-in `discovery_hint_summary_id` only, and re-derives all deletion-authority source refs from Layer 1 at plan-construction time. Each output `OperationShape` record carries a freshly-minted authority ref; no output record cites the summary's `DerivedSummary` graph as authority.

The field name `discovery_hint_summary_id` is the canonical self-documenting form and is the only summary-bearing input the operation accepts. The plan is structurally incapable at the *input layer* of inheriting `DerivedSummary` authority semantics because the operation surface does not expose any authority-bearing summary input. Per registry §Cross-context enforcement layer, schema-layer (Zod) validation alone is *not* an enforcement layer for cross-context binding semantics: Zod constrains `discovery_hint_summary_id` to a bare `entityIdSchema` (defense-in-depth, prevents structured-summary smuggling at parse time), while the canonical enforcement is at the Ring 1 mint API per layer 1, with broker FSM re-check at layer 2 and gateway re-derive at layer 3 (per registry §Cross-context enforcement layer).

This matches the ADR 0036 reframe pattern (workspace manifest is a Layer 3 retrieval projection, not a source of truth) and the charter v1.4.0 inv. 18 chain-walk rejection rule: derived retrieval is discovery, never authority.

## Consequences

### Accepts

- **`system.cleanup.plan.v1` is `operation_class: cleanup_plan` (NEW)** — a Ring 1 read-only operation. The new operation_class signals plan-construction (distinct from `read_only_diagnostic`'s passive introspection), allowing future canonical policy YAML to gate it differently (e.g., requiring a workspace lease, requiring a prior diagnose summary in some tiers, requiring rate limits).

- **`mutation_scope: "none"` committed (NOT a new mutation_scope value).** The cleanup-plan operation is read-only by §Decision: it produces typed `OperationShape` records but does not execute deletions. Per charter v1.4.0 inv. 7 boundary-enforcement rule (line 90: every `OperationShape` with `mutation_scope != "none"` requires a documented gateway path, decision-package contract, and renderer; missing any blocks merge), a Ring 1 read-only operation MUST declare `mutation_scope: "none"`. The cleanup-plan operation joins `read_only_diagnostic` and `agent_internal_state` as a non-mutating operation_class. The follow-on schema PR adds `cleanup_plan` to the `operation_class` enum without adding a corresponding `mutation_scope` value.

- **Target-kind narrowing: `cleanup_plan` → `workspace`** — the plan operation's `target_ref.target_kind` is constrained to `"workspace"`, mirroring the `workspace_verify` → `workspace` precedent ADR 0036 set. The follow-on schema PR commits this narrowing in `operationShapeSchema`'s discriminated union. The plan's `target_id` resolves to a `WorkspaceContext` per ADR 0031 v1 cardinality.

- **Input shape** — `(workspace_id, cleanup_scope, discovery_hint_summary_id?)`. `cleanup_scope` is a closed-enum discriminator over the cleanup population kind, with two initial values:
  - `audit_profile_claim_supersession` — cleanup driven by an audit-profile snapshot supersession (`KnowledgeSource.content_hash` change with `predicate_kind: "claim_superseded_by_snapshot"` per ADR 0019 v3 + ADR 0036 reservation)
  - `worktree_lease_completed` — cleanup driven by a worktree lease reaching `lease_state: "released"` or `"force_broken"` per ADR 0031 v1
  
  Per registry §Naming-discipline §Sub-rule 8 (bare-noun central-concept discriminator), `cleanup_scope` is the central-concept discriminator and does not take a `_kind` suffix; this matches the `boundary_dimension` precedent ADR 0022 set. Caller-driven `explicit_target_set` is deferred to a future amendment with redaction-posture discipline (see §Future amendments).

- **`discovery_hint_summary_id` is opt-in and graceful-degrading** — if absent, the plan runs full re-derivation. If present but resolves to a stale or workspace-mismatched summary, the plan ignores the hint and proceeds without it. Hint resolution failure does NOT fail plan construction. Hint-resolution status is captured as a typed annotation on the plan's `DerivedSummary.summary_text` (see below); it is *not* a `Decision.reason_kind` because the plan does not reject — it succeeds with a non-default code-path.

- **Output shape** — Two output kinds:

  1. **A collection of typed `OperationShape` records** (one per validated cleanup target) plus a collection of typed `Decision` records (one per rejected candidate target). Each `OperationShape` carries `operation_class` ∈ {`destructive_git`, `worktree_mutation`} (or future cleanup-bearing classes) with its own `deletion_authority_kind` + `deletion_authority_source_ref` field pair, freshly minted at plan-construction time. The plan operation does NOT reify itself as a separate composite entity; the population of `OperationShape` records IS the plan.
  
  2. **A mandatory `DerivedSummary`** of `summary_kind: cleanup_plan` (NEW reservation; pending registry update). This serves as the cleanup-plan operation's audit-chain entry. Its `derived_from` cites the underlying typed Layer 1 `Evidence` records used in re-derivation (NOT the produced `OperationShape` records — `OperationShape` is not in the `DerivedSummary.derived_from` four-class closure per inv. 18 / `derivedSummarySourceRecordKindSchema`). For each authority-source kind, the cited Evidence is:
     - `filesystem_protected_paths_observation` → the `BoundaryObservation` (Evidence subtype envelope) cited via `source_record_kind: "evidence"`
     - `coordination_fact` → the `CoordinationFact` cited via `source_record_kind: "coordination_fact"`
     - `human_dashboard_grant` → the typed Evidence the `ApprovalGrant` was minted against (cited via `source_record_kind: "evidence"`); the `ApprovalGrant` itself is NOT cited in `derived_from` because it is not in the four-class closure
     - `runtime_state_classification` → the cited Evidence record via `source_record_kind: "evidence"`
     
     The summary is `allowed_for_gate: false` by default. The summary is the only summary the plan operation produces; it carries hint-resolution status as a typed `summary_text` annotation: `hint_resolved | hint_ignored_stale | hint_ignored_workspace_mismatch | hint_unresolvable | no_hint_provided`.

- **Re-derivation at plan-construction time** — each output `OperationShape`'s `deletion_authority_source_ref` is freshly minted via the Layer 1 mint API at plan time, satisfying ADR 0036 §Cleanup rules per-target-kind validation. Stale or absent authority sources reject with `Decision.reason_kind: deletion_authority_kind_ref_mismatch` (existing) or NEW `Decision.reason_kind: cleanup_plan_authority_source_stale` (committed by this ADR; pending schema PR).

- **`Decision.reason_kind: cleanup_plan_target_under_active_lease`** committed (NEW). Layer 1 mint rejects a candidate cleanup target when an active `Lease` of `lease_kind: "worktree"` exists for the target. This is distinct from ADR 0031's `worktree_lease_held_by_other_session` (ADR 0031 names the case where a session's worktree mutation is blocked because another session holds the lease — the rejection is at the worktree-mutation operation surface). The cleanup-plan rejection class names a different surface: cleanup-plan refuses to *propose* deletion of a target under any active lease, regardless of session ownership. The plan does NOT silently break leases.

- **Chain-promotion safety claim** — the cleanup-plan output `DerivedSummary` is structurally non-promotable at the Ring 1 mint-API layer per inv. 18 chain-walk rule (transitive walk). Schema-layer (Zod) enforcement at `derivedSummarySchema` rejects only direct-citation `KnowledgeChunk` refs in `derived_from`; the transitive walk is a Ring 1 mint-API rule per registry §Cross-context enforcement layer. Defense-in-depth: the operation surface does not expose any authority-bearing summary input field, so even if a future buggy mint accepted a structured `DerivedSummary` object, the input shape would still reject at parse time.

- **Gateway re-walk at class-I consumption time** — `OperationShape` records produced by `system.cleanup.plan.v1` carry no implicit freshness. When a downstream class-I consumer (a future cleanup-execution operation, blocked until M4) presents an `OperationShape` to the gateway, the gateway re-walks `deletion_authority_source_ref` against current Layer 1 evidence and rejects with `Decision.reason_kind: deletion_authority_kind_ref_mismatch` or `cleanup_plan_authority_source_stale` if the cited authority's `valid_until` has elapsed or the underlying observation has been superseded. Plan-time mint is one validation; gateway-time re-walk is a second, independent validation. Inv. 19 freshness binding applies at consumption, not at plan time.

- **Cross-context binding (inv. 19)** — the discovery hint summary's `execution_context_id` does NOT propagate to any output `OperationShape`. Output records bind to the calling session's `execution_context_id` (kernel-set per ADR 0036 §Authority discipline). The hint is consumed for path enumeration only; its execution context is irrelevant to the plan output.

- **No new schema surface beyond the reservations** — this ADR is posture-only and reserves the new `operation_class: cleanup_plan`, the NEW `Decision.reason_kind: cleanup_plan_authority_source_stale` and `cleanup_plan_target_under_active_lease`, the new `cleanup_scope` discriminator (initial values `audit_profile_claim_supersession`, `worktree_lease_completed`), and `DerivedSummary.summary_kind: cleanup_plan`. Schema implementation lands in a follow-on PR per `.agents/skills/hcs-schema-change`.

- **Charter compliance** — inv. 7 (`mutation_scope: none` committed), inv. 8 (no sandbox→stronger), inv. 13 (deletion authority is not gitignore — per ADR 0036), inv. 18 (derived retrieval is never decision authority — input layer structurally enforced; output layer Ring-1-enforced), inv. 19 (freshness-bound + execution-context-bound — re-walk at class-I consumption committed). All upheld.

### Rejects

- **Treating the workspace-diagnose summary as authority-bearing input** — would inherit `DerivedSummary` chain-promotion semantics that are inv. 18-blocked when `KnowledgeChunk` refs are present, which is the routine case. Rejected at the operation-surface layer.

- **Ignoring the workspace-diagnose summary entirely (Option B)** — loses the audit-profile claim enumeration the summary already grounded; doubles Layer 2 enumeration work for the common case. Rejected as wasteful without offsetting benefit.

- **Reifying the cleanup plan as a new Ring 0 entity** (e.g., `CleanupPlan` with its own ID and lifecycle) — would mint a parallel composite competing with the existing `OperationShape` mechanism for deletion-authority discipline. The population-of-`OperationShape` model already carries every needed typed field; minting a wrapper composite would add registry surface without adding semantics. Rejected per Q-009 §Sub-decision (b) reframe ("workspace manifest is a generated view, not a source of truth") — the cleanup plan is similarly a population, not a separate composite entity.

- **Citing the produced `OperationShape` records in `DerivedSummary.derived_from`** — `OperationShape` is not in the `DerivedSummary.derived_from` four-class closure per inv. 18 / `derivedSummarySourceRecordKindSchema` (`evidence | coordination_fact | derived_summary | knowledge_chunk`). Rejected as structurally invalid; the summary's `derived_from` cites the underlying typed Evidence records instead (see §Accepts).

- **Reusing `operation_class: read_only_diagnostic`** for the plan operation — would conflate diagnostic introspection (passive observation) with plan construction (active candidate derivation against typed authority). Rejected to preserve operation-class semantics for future canonical policy YAML gating.

- **Reserving a NEW `mutation_scope: cleanup_plan` value** — would create an ontology surface where a Ring 1 read-only operation declares a non-`none` mutation scope, contradicting charter inv. 7 boundary-enforcement semantics. Rejected; `mutation_scope: "none"` is the only correct posture for a plan-construction operation that produces typed records without executing them.

- **Inheriting `allowed_for_gate` from the discovery hint summary** — the summary's `allowed_for_gate: false` posture would be a misleading signal on the plan output, since the plan output's gateability is governed by each individual `OperationShape`'s deletion-authority source ref, not by any inherited summary state. Rejected as confusing the chain.

- **Synchronous re-execution of cleanup operations as part of plan construction** — the plan ONLY produces typed `OperationShape` records; actual destructive execution remains a class-I mutation per `IMPLEMENT.md` §Change classes, blocked until M4 (approval grants + audit + dashboard + leases all exist). Rejected as scope creep.

- **Adding a `cleanup_scope: lease_expiration` value** — rejected because lease expiration is a target-eligibility condition (handled via the `cleanup_plan_target_under_active_lease` rejection class), not a cleanup population driver. Lease-released worktrees that are now eligible for cleanup are surfaced via the `worktree_lease_completed` cleanup_scope.

- **Including `cleanup_scope: explicit_target_set` in the initial enum** — rejected because caller-supplied `candidate_target_refs[]` opens a discovery-probe surface on `filesystem_protected_paths` membership: a less-privileged caller could enumerate protected paths via the rejection-Decision feedback loop. Re-introducing `explicit_target_set` requires either (a) structurally typing `candidate_target_refs[]` to workspace-scoped target_kinds the caller already has observability over, or (b) committing existence-only redaction posture for Decision bodies on rejected targets. Both paths are deferred to a future amendment.

- **Reserving `cleanup_plan_summary_hint_unresolvable` as a `Decision.reason_kind`** — rejected because the hint failure is not a rejection (the plan succeeds, ignoring the hint). Per registry §Audit-chain coverage of rejections, `Decision.reason_kind` is the rejection-class discriminator. Hint-resolution status is captured as a typed `summary_text` annotation on the plan's mandatory `DerivedSummary` instead, mirroring the ADR 0036 `manifest_valid_until: null` precedent for graceful-degrade flagging.

### Future amendments

- **Canonical policy YAML for `cleanup_plan` operation_class** — per-tier gating rules, lease requirements, rate limits, and prior-diagnose-required policy modes. Lives in `system-config/policies/host-capability-substrate/`, not this repo. Lands at Milestone 2 per ADR 0036's reservation.

- **`cleanup_plan` operation_class schema PR** — follow-up Ring 0 schema-change PR per `.agents/skills/hcs-schema-change` requiring `hcs-ontology-reviewer` objections. Adds `cleanup_plan` to `operationShapeOperationClassSchema` enum, commits target-kind narrowing to `workspace`, and adds the new `Decision.reason_kind` reservations and the `cleanup_scope` enum. Also reconciles the `qualityGateOperationClassSchema` enum mirror at `quality-gate.ts:25-34` with the OperationShape enum (currently lacks `workspace_verify` per ADR 0036 acceptance and would lack `cleanup_plan` post-this-ADR).

- **`DerivedSummary.summary_kind: cleanup_plan` registry reservation** — follow-up registry update PR, additive to existing summary-kind enum.

- **Adapter-side cleanup-plan invocation surface** (MCP tool, CLI subcommand, dashboard view) — out of scope for this ADR per Phase 2 sequencing; deferred until canonical policy YAML lands.

- **`cleanup_scope: explicit_target_set` re-introduction** — requires either (a) structurally-typed `candidate_target_refs[]` constraining target_kind values to entities the caller has observability over, or (b) existence-only redaction posture for rejected-target Decision bodies. The redaction posture must be defined in registry §Redaction posture before re-introduction.

- **Cleanup-plan execution wiring (class I)** — when M4 ships (approval grants + audit + dashboard + leases), a follow-on ADR commits the wiring from cleanup-plan output `OperationShape` records to actual gateway-evaluated cleanup operations. Until M4, all cleanup execution remains blocked at the class-I gate.

- **`human_dashboard_grant` freshness binding** — the `deletion_authority_kind: human_dashboard_grant` freshness claim depends on the `ApprovalGrant` schema (unlanded; per ADR 0035 / Q-003 follow-on) preserving freshness anchors. When that schema lands, the cleanup-plan operation must re-validate its freshness binding to confirm inv. 19 compliance and may require ADR amendment.

- **Audit-framework `claim_superseded_by_snapshot` integration** — when the cleanup population is driven by an audit-profile snapshot supersession (`cleanup_scope: audit_profile_claim_supersession`), the plan cites the superseding `KnowledgeSource.content_hash` as discovery context (not authority); each candidate target still requires independent Layer 1 grounding per ADR 0036 §Layer 1 grounding requirement.

- **Reopen** if the audit framework introduces multi-document profiles or federated profiles that break the single-`KnowledgeSource` discovery-hint assumption, or if the `ApprovalGrant` schema landing reveals a freshness-binding gap.

## Compliance

This ADR is Ring 0 doc-only / posture-only. No cross-ring imports authored. No schema source, canonical policy YAML, runtime probes, dashboard route React components, MCP adapter contracts, or charter invariant text changes in this commit. Schema enum reservations are described for follow-on PRs per `.agents/skills/hcs-schema-change`. Complies with implementation charter v1.4.0.

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md` v1.4.0 — invariants 7, 8, 13, 18, 19; boundary-enforcement bullet (line 90)
- Decision ledger: D-025 (deletion authority is not gitignore)
- Related ADRs:
  - ADR 0019 v3 (knowledge / coordination layer; `DerivedSummary` chain-promotion rule; four-class `derived_from` closure)
  - ADR 0029 v2 (operation classes; closed-list fail-mode tightening)
  - ADR 0031 v1 (worktree lease taxonomy; `worktree_lease_held_by_other_session` reservation)
  - ADR 0034 v2 (boundary observation freshness binding)
  - ADR 0036 (Q-009 workspace manifest projection — parent ADR; commits deletion-authority field-shape; reserves `system.cleanup.plan.v1` composition follow-up at §Future amendments)
  - ADR 0038 (Phase 2 schema landing sequence)
  - ADR 0039 (charter v1.4.0 invariants 18 + 19)
- Registry: `docs/host-capability-substrate/ontology-registry.md` v0.4.7 — §Naming-discipline (Sub-rules 8, 9), §Authority discipline, §Cross-context enforcement layer, §Audit-chain coverage of rejections, §Knowledge and coordination enum mirrors (`derivedSummarySourceRecordKindSchema` four-class closure)
- Implementation rules: `IMPLEMENT.md` §Change classes (cleanup execution remains class I until M4); §Required subagent reviews
- Plan: `PLAN.md` §Future ADRs queued (`system.cleanup.plan.v1` composition)
- Research plan: `~/Organizations/jefahnierocks/system-config/docs/host-capability-substrate-research-plan.md` (canonical research source for diagnostic-surface design)

### External

- None directly; this ADR composes existing internal posture.
