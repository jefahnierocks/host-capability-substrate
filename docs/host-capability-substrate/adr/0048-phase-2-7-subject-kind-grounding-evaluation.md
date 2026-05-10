---
adr_number: 0048
title: Phase 2.7 subject-kind grounding evaluation
status: accepted
date: 2026-05-09
charter_version: 1.4.0
tags: [subject-kind, grounding, coordination-fact, evidence, machine-identity, project-substrate, backup-readiness, q-013, q-014, q-015, adr-0036-followup, phase-2-7, registry-v0-4-10]
---

# ADR 0048: Phase 2.7 subject-kind grounding evaluation

## Status

`accepted`

Accepted 2026-05-09 with four mechanical tweaks at acceptance: (1) `machine_identity` disposition restated positively (host-observation-backed classification; per-record `authority` guards delegated to ADR 0019 v3 chain-promotion rule + charter v1.4.0 inv. 18) per architect NB-1 + ontology NB-1; (2) cross-context binding language added to each disposition explicitly inheriting registry §Cross-context enforcement layer + inv. 19 execution-context binding for any future schema PR per policy Q5; (3) registry table cell for backup-readiness tightened to specify the `ready` lifecycle state applies to the *object payload* assertion specifically (not all backup-readiness facts) per architect NB-4; (4) registry table cell for `project_substrate_contract` made specific by naming `BoundaryObservation` of `boundary_dimension: project_admission_authority` per ontology NB-2. All four required reviewers (`hcs-architect`, `hcs-ontology-reviewer`, `hcs-policy-reviewer`, `hcs-security-reviewer`) returned no blocking objections on v1.

## Date

2026-05-09

## Charter version

Written against charter v1.4.0 and `docs/host-capability-substrate/ontology-registry.md` v0.4.10.

## Reviews

This ADR introduces no schema reservations and no FK-bearing surface, but it commits classification dispositions that the future Ring 1 mint API enforcement will rely on, and it touches authority-discipline boundaries via the §Subject-kind grounding requirement. Required reviewer dispatch per `IMPLEMENT.md` §Required subagent reviews + the meta-ADR FK-table review-dispatch rule (memory `feedback_meta_adr_fk_table_review_dispatch.md`) + the 2026-05-09 sequencing workflow §Step 1:

- `hcs-architect` — mandatory for any ADR
- `hcs-ontology-reviewer` — mandatory; ADR commits subject-kind classification dispositions
- `hcs-policy-reviewer` — mandatory; ADR records authority-discipline rules that Phase 2.5 canonical policy YAML depends on
- `hcs-security-reviewer` — mandatory; ADR touches grounding-rule extensions for promotion-eligibility, an authority-discipline surface

## Context

ADR 0036 §Future amendments §Layer 1 grounding rule extensibility principle declared the architectural rule that future `CoordinationFact.subject_kind` values primarily backed by derived-content or Layer-2 evidence MUST cite at least one host-observation `Evidence` record before promotion to `allowed_for_gate: true`. The principle was promoted to discoverable registry status on 2026-05-09 as `ontology-registry.md` v0.4.10 §Subject-kind grounding requirement. The registry section's §Open follow-up evaluations subsection lists three Phase 2.7 candidates whose dispositions were not classified at acceptance time:

- `machine_identity` (ADR 0043 Q-013)
- `project_substrate_contract` (ADR 0044 Q-014)
- backup-readiness subject_kinds (ADR 0045 Q-015)

The 2026-05-09 outstanding-work sequencing workflow (`docs/host-capability-substrate/research/local/2026-05-09-outstanding-work-sequencing-workflow.md` §Step 1) reserves ADR 0048 for this evaluation and bounds the scope: classify each candidate against the grounding rule, decide whether any need a `CoordinationFact.subject_kind` enum addition, and default to no enum addition unless policy/gate work proves the fact must be promoted as a gateable coordination fact rather than consumed directly as typed Evidence.

**Critical clarification.** The §Subject-kind grounding requirement is specifically on `CoordinationFact.subject_kind`, not on `Evidence.subject_kind`. The Phase 2.7 schema slices (ADRs 0043, 0044, 0045) added the Phase 2.7 vocabulary to `Evidence.subject_kind` (in `evidence.ts`) so that those records could carry typed subject references. The current `coordinationSubjectKindSchema` (in `coordination-fact.ts`) has nine values — seven host-observation-backed (`release | branch | worktree | ruleset | credential_audience | deployment | external_target`) and two derived/Layer-2-backed (`workspace_context | audit_profile_snapshot`) — and does NOT include any of the three Phase 2.7 candidates. The evaluation question is therefore whether and how any Phase 2.7 evidence concept needs to be promoted into `CoordinationFact.subject_kind` for cross-session coordination consumption, separately from being consumed as typed Evidence by direct gate evaluation.

The constraint stack: charter v1.4.0 inv. 1 (canonical-typed-evidence ontology), inv. 7 (mutation-scope discipline), inv. 8 (no sandbox→stronger promotion), inv. 13 (cleanup derivability-authority), inv. 16 (external-control-plane evidence-first), inv. 18 (derived retrieval is never decision authority), inv. 19 (boundary claims freshness-bound and execution-context-bound), ADR 0019 v3 §Chain promotion rule, ADR 0036 §Sub-decision (b) §Layer 1 grounding requirement.

## Options considered

### Option A — Add all three Phase 2.7 candidates to `CoordinationFact.subject_kind` and classify each against the grounding rule

A single schema PR widens the `coordinationSubjectKindSchema` enum from nine values to twelve, adding `machine_identity`, `project_substrate_contract`, and a representative backup-readiness value (e.g., `backup_readiness_state`). Each new value's classification is recorded against the grounding rule.

**Pros:**

- Resolves the §Open follow-up evaluations queue in a single PR
- Future cross-session coordination over Phase 2.7 facts has a typed FK surface waiting
- Registry vocabulary continuity: every Phase 2.7 Evidence subject becomes representable as a CoordinationFact subject

**Cons:**

- Premature: no observed coordination need has surfaced for any of the three. CoordinationFact records are typed for cross-session coordination state; promoting subjects without that need creates schema surface that may go unused or be designed wrong
- Risk of designing the wrong subject_ref shape per candidate (each would need its own subject_ref schema in `coordinationSubjectKindSchema`'s `subjectRefSchemas` map); without a concrete coordination scenario, the FK shape is guesswork
- The §Subject-kind grounding requirement was authored to govern derived/Layer-2 promotions; widening the enum without an accompanying use case dilutes the rule's purpose

### Option B — Add none of the three to `CoordinationFact.subject_kind`; keep them as typed Evidence consumption only

The `coordinationSubjectKindSchema` enum remains at nine values. Phase 2.7 candidates continue to be represented as `Evidence.subject_kind` values only; gates and policy consume them as typed Evidence directly.

**Pros:**

- Honors the YAGNI principle: no observed coordination need, so no enum widening
- Preserves the §Subject-kind grounding requirement's specificity (it governs promotions of records that DO need cross-session coordination, not records that gates consume directly)
- Matches the 2026-05-09 sequencing workflow §Step 1 default ("no enum addition unless policy/gate work proves the fact must be promoted as a gateable coordination fact rather than consumed directly as typed Evidence")

**Cons:**

- Defers per-candidate classification dispositions; future ADRs (when coordination need surfaces) will re-litigate the classification question
- The §Open follow-up evaluations queue stays open with no recorded resolution

### Option C — Record per-candidate classification dispositions today; add none of the three to `CoordinationFact.subject_kind`; commit the dispositions as preconditions for any future schema PR that promotes a candidate

Same outcome as Option B for the schema (no enum widening), but documents per-candidate classification dispositions in this ADR so future schema PRs that bring a candidate into `CoordinationFact.subject_kind` can cite the recorded disposition rather than re-deriving it. The §Open follow-up evaluations registry section is updated to point at ADR 0048's dispositions.

**Pros:**

- All Option B benefits (no premature schema widening, YAGNI honored, sequencing workflow default respected)
- Each candidate has a recorded classification disposition (host-observation-backed, derived/Layer-2-backed, or mixed) that a future schema PR inherits
- The §Open follow-up evaluations registry queue is closed; future readers find the dispositions in one place
- Aligns with the ADR 0036 acceptance pattern of recording dispositions ahead of implementation (ADR 0036 §Future amendments line 1251-1267 enumerated the principle ahead of implementation; this ADR enumerates the per-candidate dispositions ahead of any schema PR)

**Cons:**

- Slightly more authoring than Option B (records dispositions in advance of need)
- Risk of mis-classifying a candidate based on Phase 2.7 schema shape if usage patterns evolve (mitigated by the §Future amendments commitment that any schema PR re-validates the disposition)

## Decision

**Option C.** No `CoordinationFact.subject_kind` enum addition in this ADR. Per-candidate classification dispositions recorded for the three Phase 2.7 candidates. The §Subject-kind grounding requirement registry §Open follow-up evaluations subsection is updated to cite ADR 0048's dispositions; future schema PRs that promote any candidate inherit the disposition as the classification starting point and re-validate at acceptance time.

This matches the 2026-05-09 sequencing workflow §Step 1 default ("no enum addition unless policy/gate work proves the fact must be promoted as a gateable coordination fact rather than consumed directly as typed Evidence") while closing the §Open follow-up evaluations queue with recorded outcomes. ADR 0036 §Future amendments §Layer 1 grounding rule extensibility principle is now fully discharged: registered as a registry rule on 2026-05-09 (registry v0.4.10), and the Phase 2.7 candidates are evaluated against it here.

## Consequences

### Accepts

- **No `CoordinationFact.subject_kind` enum changes.** The current nine-value enum (`release | branch | worktree | ruleset | credential_audience | deployment | external_target | workspace_context | audit_profile_snapshot`) remains the accepted surface. Phase 2.7 candidates continue to be represented as `Evidence.subject_kind` values only.

- **Per-candidate classification disposition: `machine_identity` (Q-013).** **Disposition: host-observation-backed.** If a future schema PR promotes `machine_identity` into `CoordinationFact.subject_kind`, the value joins the §Subject-kinds inheriting ADR 0019 v3's chain-promotion rule only list (no additional Layer 1 grounding requirement at the subject-kind level). Per-record `authority` requirements are enforced by the ADR 0019 v3 chain-promotion rule (rejects `sandbox-observation` authority + `KnowledgeChunk` chain references) and charter v1.4.0 inv. 18 chain-walk rejection (rejects `self-asserted` authority); promotion to `allowed_for_gate: true` requires `evidence_refs` to include at least one `CredentialAuthorityObservation` or `MachineIdentityBindingObservation` record with `authority: "host-observation"` (or `"provider-asserted-kernel-verifiable"` per inv. 16). Cross-context binding (inv. 19 + registry §Cross-context enforcement layer) is inherited unchanged: a CoordinationFact promoted from `machine_identity` evidence cannot bind to a different `execution_context_id` than its grounding observation. Future-trigger conditions:
  - cross-session coordination over machine identity becomes necessary (e.g., "this machine identity is currently bound to session X for credential issuance")
  - the credential plane's broker daemon needs a coordination surface to track machine-identity lifecycle across sessions (Q-013 deferred lane)
  - the disposition re-validation at the future schema PR's acceptance time MAY reclassify to derived/Layer-2-backed if a future Q-013 broker/reconciler evidence-emission audit shows `CredentialAuthorityObservation` / `MachineIdentityBindingObservation` records are routinely produced with `derived` authority only (escalated per `hcs-ontology-reviewer` re-validation in the schema PR)

- **Per-candidate classification disposition: `project_substrate_contract` (Q-014).** **Disposition: derived/Layer-2-backed.** If a future schema PR promotes `project_substrate_contract` into `CoordinationFact.subject_kind`, the value is classified under the §Subject-kinds subject to the grounding requirement list. Promotion to `allowed_for_gate: true` requires the `evidence_refs` array to include at least one `Evidence` record with `authority: "host-observation"` (or `"provider-asserted-kernel-verifiable"` per inv. 16). Project-substrate contracts are by design declarative source artifacts (registered as `KnowledgeSource.source_kind: "project_substrate_contract"` per ADR 0044 Q-014); without independent host-observation grounding (e.g., a typed `ProjectSubstrateContractValidationReceipt` with kernel-set producer + host-observation authority, or a `BoundaryObservation` of `boundary_dimension: project_admission_authority`), the contract YAML alone cannot promote a coordination fact. Cross-context binding (inv. 19 + registry §Cross-context enforcement layer) is inherited unchanged: a CoordinationFact promoted from `project_substrate_contract` evidence cannot bind to a different `execution_context_id` than its grounding observation. Future-trigger conditions:
  - the Phase 2.5 canonical policy YAML lane defines `QualityGate.gate_kind: project_substrate_admission` and that gate needs cross-session coordination over admission state (e.g., "this workspace has been admitted for project X by session Y for the duration of a long-running operation")
  - a project-substrate admission receipt's lifecycle requires multi-session coordination beyond what a single Decision can express
  - the disposition re-validation at the future schema PR's acceptance time inherits the derived/Layer-2 classification by default

- **Per-candidate classification disposition: backup-readiness subject_kinds (Q-015).** **Disposition: mixed/declarative; promotion to `ready` lifecycle state requires restore-drill freshness binding.** If a future schema PR promotes any backup-readiness `Evidence.subject_kind` (e.g., `backup_readiness_state`, `backup_target`) into `CoordinationFact.subject_kind`, the value is classified under the §Subject-kinds subject to the grounding requirement list. Backup readiness is declarative-derived in its `pending | configured | usable | expired` lifecycle states (the readiness posture follows from typed `BackupReadinessObservation` records and ADR 0045 Q-015 evidence subtypes), but the `ready` lifecycle state specifically requires freshness-valid `RestoreDrillReceipt` evidence carrying boot/service verification per ADR 0042 §Sub-decision and ADR 0045 §Accepts. The grounding rule applies in two layers:
  - Standard rule (per registry §Subject-kind grounding requirement): promotion to `allowed_for_gate: true` requires at least one host-observation `Evidence` record in `evidence_refs`
  - Lifecycle-state rule (specific to backup-readiness): promotion of a coordination fact whose object payload asserts the workspace's backup-readiness lifecycle is in the `ready` state additionally requires a freshness-valid `RestoreDrillReceipt` evidence record with the standard ADR 0019 v3 chain-promotion rule satisfied
  - Cross-context binding (inv. 19 + registry §Cross-context enforcement layer) is inherited unchanged: a CoordinationFact promoted from backup-readiness evidence cannot bind to a different `execution_context_id` than its grounding observation; the `RestoreDrillReceipt` and `BackupReadinessObservation` records each carry their own kernel-set `execution_context_id` and the CoordinationFact must match
  
  Future-trigger conditions:
  - cross-session coordination over backup-readiness lifecycle becomes necessary (e.g., "this workspace has restored backup X via session Y; the readiness state is currently `ready` until restore_drill_valid_until")
  - the Phase 2.5 canonical policy YAML lane defines per-`gate_kind` consumption rules for backup-readiness state and those rules need a coordination surface beyond direct typed-Evidence consumption
  - the disposition re-validation at the future schema PR's acceptance time MUST account for the lifecycle-state rule alongside the standard rule

- **Default rule for future Phase 2.x+ subject_kind candidates.** When a future ADR introduces a new typed Evidence concept whose corresponding `CoordinationFact.subject_kind` representation has not been requested by any observed coordination need, the default disposition is **no enum addition**. Each candidate's classification (host-observation-backed, derived/Layer-2-backed, or mixed) is recorded for future schema PR work. This matches the §Procedure for adding a new subject_kind value rule already in the registry: classification statement is required at schema PR time, not at typed-Evidence-introduction time.

- **Registry §Open follow-up evaluations updated.** Same change-set or follow-on commit updates `ontology-registry.md` v0.4.10 §Subject-kind grounding requirement §Open follow-up evaluations to cite this ADR's per-candidate dispositions instead of leaving the queue open. The registry version bumps accordingly.

- **ADR 0036 §Future amendments §Layer 1 grounding rule extensibility principle fully discharged.** The principle is now (1) registered in the registry as a discoverable rule (registry v0.4.10, 2026-05-09 commit `322e259`), and (2) evaluated against the three Phase 2.7 candidates here. No further follow-on is required from ADR 0036 on this principle.

- **No premature schema surface.** The decision to defer enum widening avoids the schema-shape design risk Option A flagged: each candidate's `subject_ref` shape would need to be designed without a concrete coordination scenario.

- **Charter compliance.** Inv. 1 (canonical-typed-evidence — preserved by keeping Phase 2.7 facts as typed Evidence rather than dual-tracking them in CoordinationFact prematurely), inv. 7 (mutation-scope discipline — no operation surface introduced), inv. 8 (no sandbox→stronger — preserved by the dispositions rejecting sandbox-observation/self-asserted authority for `machine_identity` host-observation classification), inv. 13 (cleanup derivability-authority — not implicated), inv. 16 (external-control-plane evidence-first — preserved for `project_substrate_contract` via the disposition's optional `provider-asserted-kernel-verifiable` clause), inv. 18 (derived retrieval is never decision authority — preserved by the grounding rule's structural enforcement), inv. 19 (freshness-bound and execution-context-bound — extended for backup-readiness via the lifecycle-state rule). All upheld.

### Rejects

- **Adding all three to `CoordinationFact.subject_kind` in a single schema PR (Option A)** — premature; no observed coordination need surfaced; risks designing wrong subject_ref shapes without concrete coordination scenarios. Rejected.

- **Reclassifying any Phase 2.7 `Evidence.subject_kind` values** — this ADR scopes to `CoordinationFact.subject_kind` only. The Phase 2.7 schema slices (ADRs 0043/0044/0045) committed `Evidence.subject_kind` values that remain unchanged.

- **Authoring schema reservations or Zod source changes in this ADR** — this ADR is docs-only / posture-only per the 2026-05-09 sequencing workflow §Step 1.

- **Introducing canonical policy YAML in this ADR** — Phase 2.5 canonical policy YAML lives in `system-config/policies/host-capability-substrate/`, not this repo. Per the workflow §Step 2, the policy packet is the next substantive lane after this ADR lands; this ADR's dispositions are inputs to that packet, not authority for it.

- **Treating `Evidence.subject_kind` as a substitute for `CoordinationFact.subject_kind`** — they are distinct enums with distinct purposes. Evidence records carry typed observations; CoordinationFact records carry typed cross-session coordination state. Promotion of an Evidence subject_kind into CoordinationFact subject_kind is a separate, independently-authorized act per the registry §Procedure for adding a new subject_kind value.

- **Pre-empting ADR 0044's QualityGate.gate_kind: project_substrate_admission decision** — that gate is part of the Phase 2.5 policy lane per the workflow doc §4. This ADR records a classification disposition that the future gate work would inherit IF a CoordinationFact representation is ever needed; it does not commit the gate's existence or shape.

- **Pre-empting Q-013's broker / reconciler / runtime / provider mutation lanes** — those remain blocked behind separate accepted authority per the workflow doc §3.

- **Pre-empting Q-015's policy / gate-kind / runtime validator / dashboard / adapter / backup-restore execution lanes** — those remain blocked behind separate accepted authority per the workflow doc §5.

- **Modifying ADR 0019 v3's chain-promotion rule, ADR 0036's §Layer 1 grounding requirement, or charter inv. 18** — the existing rules apply unchanged. This ADR records dispositions against them, not amendments to them.

### Future amendments

- **Phase 2.5 canonical policy YAML lane** consumes the per-candidate dispositions when defining future per-`gate_kind` consumption rules (lives in `system-config`, not this repo).

- **Future schema PR promoting any candidate to `CoordinationFact.subject_kind`** inherits the recorded disposition as the classification starting point. The schema PR re-validates the disposition against current Phase 2.7+ evidence usage at acceptance time (per the §Procedure for adding a new subject_kind value step 4 — `hcs-ontology-reviewer` confirms the classification). Any classification reclassification (e.g., if `machine_identity` evidence in practice ends up routinely `derived`-authority-only and the disposition shifts to derived/Layer-2-backed) is recorded as an ADR amendment to ADR 0048 or as a fresh ADR superseding the relevant disposition.

- **Reopen** if any of the three candidates surfaces a concrete coordination need that the recorded disposition does not address (e.g., a multi-session coordination scenario over machine identity that the host-observation classification cannot represent without lifecycle-state extensions).

- **Reopen** if a Phase 2.x+ candidate not anticipated here surfaces (e.g., a future Q-row introduces a new `Evidence.subject_kind` value that warrants `CoordinationFact.subject_kind` representation). The new candidate is evaluated against the §Subject-kind grounding requirement at the introducing schema PR's acceptance time per the §Procedure for adding a new subject_kind value rule.

- **Restore-drill freshness binding for backup-readiness `ready` state** is committed by this ADR as a lifecycle-state-specific rule. If the canonical policy YAML lane defines numeric freshness windows for restore-drill receipts, those windows compose with this rule's structural requirement (the receipt must exist; the policy YAML defines how fresh it must be).

## Compliance

This ADR is Ring 0 / Ring 3 docs-only. No cross-ring imports authored. No schema source, canonical policy YAML, runtime probes, dashboard route React components, MCP adapter contracts, hook bodies, or charter invariant text changes in this commit. The only registry-side change is updating the §Subject-kind grounding requirement §Open follow-up evaluations subsection to cite this ADR's dispositions; that change is bundled into this commit or a follow-on docs commit referencing this ADR. Complies with implementation charter v1.4.0.

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md` v1.4.0 — invariants 1, 7, 8, 13, 16, 18, 19
- Decision ledger: `DECISIONS.md` (no D-row required; this ADR records dispositions, not new substrate-level architectural tradeoffs)
- Related ADRs:
  - ADR 0019 v3 (`DerivedSummary` chain-promotion rule; four-class `derived_from` closure; CoordinationFact subject_kind grain)
  - ADR 0036 (parent rule — §Sub-decision (b) §Layer 1 grounding requirement; §Future amendments §Layer 1 grounding rule extensibility principle)
  - ADR 0042 (Q-015 backup-readiness posture; lifecycle vocabulary)
  - ADR 0043 (Q-013 credential-plane implementation; `machine_identity` Evidence subject)
  - ADR 0044 (Q-014 project-substrate implementation; `project_substrate_contract` KnowledgeSource source kind)
  - ADR 0045 (Q-015 backup-readiness implementation; `BackupReadinessObservation` and `RestoreDrillReceipt`)
- Registry: `docs/host-capability-substrate/ontology-registry.md` v0.4.10 — §Subject-kind grounding requirement (§Rule, §Subject-kinds subject to the grounding requirement, §Subject-kinds inheriting ADR 0019 v3's chain-promotion rule only, §Procedure for adding a new subject_kind value, §Open follow-up evaluations)
- Sequencing workflow: `docs/host-capability-substrate/research/local/2026-05-09-outstanding-work-sequencing-workflow.md` §Decisions (2, 3, 4, 5) + §Step 1
- Implementation rules: `IMPLEMENT.md` §Required subagent reviews
- Plan: `PLAN.md` §Current Focus + §Future ADRs queued
- Schema source for `CoordinationFact.subject_kind`: `packages/schemas/src/entities/coordination-fact.ts` lines 18-30 + `subjectRefSchemas` map lines 58-83
- Schema source for `Evidence.subject_kind`: `packages/schemas/src/entities/evidence.ts` lines 19-81

### External

- None directly; this ADR composes existing internal posture.
