---
adr_number: 0044
title: Q-014 project-substrate implementation slice
status: accepted
date: 2026-05-07
charter_version: 1.4.0
tags: [project-substrate, contract-validation, admission, knowledge-source, boundary-observation, evidence, q-014, phase-2-7]
---

# ADR 0044: Q-014 project-substrate implementation slice

## Status

accepted

Accepted on 2026-05-07 after reviewer pass and human approval. This ADR
authorizes only schema/evidence work for the narrow Q-014 v1 slice named
below: project-substrate contract source-kind support, admission-authority
boundary evidence, contract validation, admission observation, teardown plan
receipt, teardown completion receipt, and the minimum subject/ref vocabulary
required by those records.

This ADR does not authorize canonical policy YAML, runtime/live validators,
adapters, dashboard routes, hooks, runner registration, GitHub runner-group
mutation, Proxmox changes, OpenTofu changes, machine-identity issuance,
project workload provisioning, provider mutation, operation registration, or
runtime behavior.

## Acceptance note

The four required reviewers completed the acceptance-readiness pass:

- `hcs-architect`: ACCEPT-AS-IS
- `hcs-ontology-reviewer`: READY-FOR-ACCEPTANCE
- `hcs-policy-reviewer`: READY-FOR-ACCEPTANCE
- `hcs-security-reviewer`: READY-FOR-ACCEPTANCE

No reviewer found blocking issues. Mechanical hardening from ontology, policy,
and security review is folded into this accepted revision: runtime/live
validator wording, schema-validator policy-boundary text, typed
`project_admission_authority` branch requirements, `BoundaryObservation`
contract-source binding placement, sandbox-observation non-promotion,
teardown attribution, runner escape rejection, and reject-list authority
citations.

Acceptance remains limited to the Ring 0 schema/evidence slice named above.
Runtime, policy, provider, runner, Proxmox, OpenTofu, identity issuance,
project provisioning, backup-readiness, dashboard, adapter, hook, and gate
behavior require separate accepted ADRs or policy lanes.

## Date

2026-05-07 (proposed); 2026-05-07 (accepted)

## Charter version

Written against charter v1.4.0.

## Context

ADR 0041 accepted Q-014 project-substrate contract validation posture only.
It committed the structural boundary: project-owned contract YAML enters HCS
as ADR 0036 `KnowledgeSource` input plus typed validation evidence, not as HCS
operating authority. Contract lifecycle state and `guardian_approval` are
evidence inputs; neither is direct HCS authorization.

ADR 0043 has now landed the first Q-013 credential-plane implementation slice:
`CredentialAuthorityObservation`, `MachineIdentityBindingObservation`, and
`Evidence.subject_kind: "machine_identity"`. That removes ADR 0041's main
implementation blocker for Q-014 because project-substrate admission can cite
generic credential-source and machine-identity evidence without HCS minting
project identities.

The current schema confirms Q-014 remains unimplemented:

- `KnowledgeSource.source_kind` does not yet include
  `project_substrate_contract`.
- `BoundaryObservation.boundary_dimension` does not yet include
  `project_admission_authority`.
- `QualityGate.gate_kind` does not yet include
  `project_substrate_admission`.
- No `ProjectSubstrateContractValidationReceipt`,
  `ProjectSubstrateAdmissionObservation`, `ProjectTeardownPlanReceipt`, or
  `ProjectTeardownCompletionReceipt` schema exists.

Q-014 therefore needs an implementation ADR before schema work begins. The
goal is not to implement Citadel admission policy, runner provisioning, project
workload provisioning, provider mutation, or CI control-plane behavior. The
goal is to give HCS a generic, freshness-bound evidence vocabulary that can
validate an external project-substrate contract as one input to future gates.

Constraints:

- HCS must not duplicate policy across adapter, hook, dashboard, canonical
  policy, or Citadel surfaces (charter invariant 1).
- HCS must not store resolved secret material in docs, schemas, fixtures,
  generated schemas, policy snapshots, logs, audit artifacts, or retrieval
  chunks (invariant 5).
- HCS must not add mutating execution surfaces without the full safety stack
  of approval grants, audit, dashboard review, leases, and policy/gateway
  checks (invariant 7).
- HCS treats external control planes as evidence surfaces, not as authority it
  owns or mutates (ADR 0015 and invariant 16).
- Derived source material and contract chunks are never gate authority by
  themselves (invariant 18).
- Boundary, admission, credential, runner, and teardown claims are
  freshness-bound (invariant 19).

## Options considered

### Option A: Implement the full project-substrate control plane now

This option would add a standalone project contract entity, validator runtime,
canonical policy YAML, QualityGate admission rules, dashboard views, runner
registration hooks, GitHub runner-group access checks, Proxmox/OpenTofu
integration, teardown execution, and project provisioning behavior in one
Q-014 packet.

**Pros:**

- Gives project-substrate admission an end-to-end HCS surface immediately.
- Could align schema, policy, dashboard, and runtime behavior in one pass.
- Minimizes the number of future Q-014 ADRs.

**Cons:**

- Violates ADR 0041's posture-only boundary by making HCS a parallel
  admission/control plane.
- Mixes schema, policy, runtime, provider mutation, CI, identity, and
  teardown behavior into one review cycle.
- Risks treating Citadel contract status or `guardian_approval` as HCS
  authorization.
- Would duplicate owning-repo policy and provisioning responsibilities.

### Option B: Keep Q-014 posture-only until Citadel/project repos implement first

This option would leave HCS unchanged until Citadel or a project repo ships a
contract validator, runner linkage, or admission workflow that HCS can observe.

**Pros:**

- Avoids premature HCS schema choices.
- Keeps all project-substrate details in the owning repos for now.
- Lowest immediate HCS diff.

**Cons:**

- Leaves Q-015 and future admission checks without a citable Q-014 evidence
  dependency.
- Encourages future agents to treat ADR 0041 posture text as enough schema
  authority.
- Defers the single-home decision for `guardian_approval`, increasing the
  risk of duplicate fact homes.
- Keeps `project_substrate_contract` as a candidate enum without a reviewed
  implementation scope.

### Option C: Authorize a narrow schema/evidence slice

This option implements only the generic HCS vocabulary required by ADR 0041:
project-substrate contract `KnowledgeSource` support, one
admission-authority `BoundaryObservation` branch, direct evidence subtypes for
contract validation and admission observation, and direct receipt subtypes for
teardown plan/completion evidence.

**Pros:**

- Reuses ADR 0036 instead of inventing a parallel intake model.
- Gives downstream Q-015 and future admission checks typed evidence to cite.
- Keeps source chunks display/discovery-only and preserves invariant 18.
- Keeps `guardian_approval` in one ontology home as boundary evidence, not
  `ApprovalGrant`.
- Preserves Citadel/project ownership of contracts, runners, infrastructure,
  machine identities, and project workloads.
- Makes the implementation reviewable as schema, generated schema, docs,
  registry, fixtures, and tests only.

**Cons:**

- Does not add live validators, dashboard views, policy gates, or runtime
  admission checks.
- Defers `QualityGate.gate_kind: "project_substrate_admission"` despite ADR
  0041 naming it as a future candidate.
- May need a follow-on if a standalone contract entity becomes necessary.
- Requires later policy/runtime work before operations can consume the
  evidence as gate authority.

### Option D: Bundle Q-014 implementation with Q-015 backup readiness

This option would combine project-substrate contract validation and
backup-readiness implementation into a single Phase 2.7 schema lane.

**Pros:**

- Keeps project admission and backup readiness visibly aligned.
- Could reduce some cross-ADR references.

**Cons:**

- Recreates the oversized Q-014/Q-015 scope that ADR 0041 and ADR 0042
  deliberately separated.
- Forces backup lifecycle, restore-drill, storage-class, contract-admission,
  teardown, and credential-custody semantics through one review.
- Risks importing upstream product names or storage brands into HCS core
  ontology.
- Blocks useful Q-014 evidence on backup-specific decisions that are not
  required for contract/admission validation v1.

## Decision

Choose Option C. If accepted, Q-014 implementation v1 is a schema/evidence
slice that composes with ADR 0036 and ADR 0041. It may add
`KnowledgeSource.source_kind: "project_substrate_contract"`, a typed
`BoundaryObservation` branch for
`boundary_dimension: "project_admission_authority"`, direct `Evidence`
subtypes for `ProjectSubstrateContractValidationReceipt` and
`ProjectSubstrateAdmissionObservation`, direct receipt subtypes for
`ProjectTeardownPlanReceipt` and `ProjectTeardownCompletionReceipt`, and the
minimum subject/ref vocabulary required by those records.

This ADR does not authorize a standalone `ProjectSubstrateContract` entity,
`QualityGate.gate_kind: "project_substrate_admission"`, `ApprovalGrant`
scope changes, canonical policy YAML, runtime/live validators, adapters, dashboard
routes, hooks, runner registration, GitHub runner-group mutation,
Proxmox/OpenTofu/provider mutation, machine-identity issuance, project
workload provisioning, backup-readiness schema, or runtime behavior.

The implementation PR must follow `.agents/skills/hcs-schema-change`: Zod
source, generated JSON Schema, `ontology.md`, `ontology-registry.md`, tests,
and fixtures move together. Any canonical policy YAML remains in
`system-config/policies/host-capability-substrate/` and requires a separate
accepted policy lane.

## Proposed v1 evidence scope

The implementation slice may define these HCS-side records.

### Shared evidence contract

All Q-014 v1 direct evidence records must satisfy the base `Evidence` shape
plus stricter subtype rules:

- `valid_until` is non-null. Project-substrate admission, contract
  validation, and teardown claims expire; downstream gates cannot extend
  freshness.
- `source`, optional `source_ref`, `observed_at`, `authority`, `confidence`,
  `parser_version`, `redaction_mode`, and producer/authority discipline are
  explicit per ADR 0041 and charter invariant 19.
- Each record binds to the relevant `workspace_id`, `execution_context_id`,
  `knowledge_source_id`, contract content hash, and cited operational
  evidence as applicable.
- For `BoundaryObservation`, `knowledge_source_id` and contract-hash binding
  belong in typed payload fields or `evidence_refs`, not as a new envelope
  target-reference field.
- `subject_refs` name the underlying subject, not the envelope. Schema work
  must not add subject-kind values such as
  `project_substrate_contract_validation_receipt`,
  `project_substrate_admission_observation`,
  `project_teardown_plan_receipt`, or
  `project_teardown_completion_receipt`.
- Use existing subject kinds where possible. Expected v1 subject kinds are
  `workspace`, `knowledge_source`, `credential_source`, `machine_identity`,
  `runner_host`, `workflow_run`, `resource_budget`, `policy_plan`,
  `status_check_source`, `external_control_plane`, and `provider_object`.
  A new subject kind requires reviewer justification in the implementation
  PR.
- Contract chunks and derived summaries remain display/discovery input only.
  They must not be cited directly as gate authority or converted into
  gate-consumed facts without typed evidence.
- Secret-bearing fields are reference-only. `secret_refs` may cite
  `SecretReference` / `op://`-style pointers but must not contain resolved
  secret values, token fragments, private keys, recovery codes, provider item
  bodies, environment dumps, or shell history.
- Evidence with `authority: "sandbox-observation"` may document parser or
  contract observations, but must not satisfy admission readiness,
  deletion-authority, teardown completion, or future `allowed_for_gate`
  promotion.
- Gate consumption is not accepted by this ADR. Future policy may consume
  these records only through accepted `QualityGate` / `ApprovalGrant` /
  `allowed_for_gate` rules in the proper policy lane.

### `KnowledgeSource.source_kind: "project_substrate_contract"`

The project-owned contract YAML is represented as a `KnowledgeSource` source
kind. It is not a standalone HCS contract entity and not a policy source.

Purpose:

- Preserve the contract content hash and retrieval/index provenance.
- Let validation receipts cite the exact contract source observed.
- Keep project/Citadel ownership separate from HCS validation evidence.

Constraints:

- Expected `security_label` is `internal` for non-secret contract content, or
  `secret_pointer` / `secret_referenced` only when reference-form secret
  pointers require that label. Resolved secret material remains forbidden.
- `KnowledgeChunk` records derived from the contract are display/discovery
  artifacts only. They do not carry gate authority.
- HCS does not mutate the contract file, project repo, Citadel repo, or live
  policy from this source-kind addition.

### `project_admission_authority` boundary observation

The external `guardian_approval` fact has one v1 ontology home: a typed
`BoundaryObservation` branch with
`boundary_dimension: "project_admission_authority"`.

Purpose:

- Record that an external project-admission authority assertion was observed.
- Keep `guardian_approval` separate from HCS `ApprovalGrant`.
- Give `ProjectSubstrateAdmissionObservation` a citable boundary fact without
  duplicating the approval payload.

Expected payload posture:

- observed approval state and observed lifecycle/status value;
- guardian/authority reference in non-secret, reference-form fields;
- authority source reference and contract content hash binding;
- observed timestamp and freshness;
- evidence refs to the contract source and any authority records used.

Constraints:

- The payload is not an HCS runtime approval.
- Implementation must land this as a typed `BoundaryObservation` payload
  branch, not as a generic boundary-dimension enum-only addition.
- It must not mint, rotate, or retire identities.
- It must not bypass future per-operation `ApprovalGrant` requirements.
- If implementation proves the `BoundaryObservation` envelope is wrong for
  this fact, reopen ADR 0041 or this ADR before creating a direct evidence
  subtype fallback.

### `ProjectSubstrateContractValidationReceipt`

Direct `Evidence` receipt for point-in-time structural validation of a
project-substrate contract source.

Expected grain: per `(knowledge_source_id, contract_content_hash,
validation_run_id)`. `subject_refs` must include `knowledge_source` for the
contract source and `workspace` when the contract is bound to a workspace.

Purpose:

- Validate that the project-owned contract source conforms structurally to the
  accepted external standard version.
- Record standard/version refs, parser version, validation outcome, field
  coverage, and no-secrets inspection posture.
- Cite the `KnowledgeSource` content hash being validated.

Constraints:

- This receipt validates structure and reference-form constraints only. It
  does not approve the project, provision anything, or pass an HCS gate.
- Schema validators may enforce only structural shape, required field
  presence, reference-form constraints, hashes, schema/provenance fields,
  non-null `valid_until`, and no-resolved-secret constraints. They must not
  encode Citadel OPA controls, lane admission policy, status-to-gate
  promotion, freshness-window durations, denial semantics,
  `allowed_for_gate` promotion, or `ApprovalGrant.scope` behavior.
- It must not resolve `secret_refs`.
- It must not duplicate Citadel OPA rules or canonical HCS policy YAML.
- Contract `active` / `accepted` / `provisionable` status remains
  producer-asserted source content, not gate state.

### `ProjectSubstrateAdmissionObservation`

Direct `Evidence` observation for freshness-bound project-substrate admission
state as observed by HCS.

Expected grain: per `(workspace_id, contract_content_hash,
admission_observed_at)`. `subject_refs` must include `workspace` and
`knowledge_source`; cited evidence supplies credential-source, machine
identity, boundary, runner/check, resource-budget, and policy-plan subjects.

Purpose:

- Summarize a contract's admission posture as an evidence observation.
- Cite contract validation, `project_admission_authority` boundary evidence,
  Q-013 credential authority and machine-identity binding evidence,
  Q-005/Q-006 runner/check/source evidence, `ResourceBudgetObservation`,
  `PolicyPlanReceipt`, and other accepted operational evidence as applicable.
- Preserve the rule that contract lifecycle status is one producer-asserted
  input, not HCS approval.

Constraints:

- It must not cite contract chunks or derived summaries as gate authority.
- It must not pass or create `QualityGate` records in this ADR.
- It must not treat `guardian_approval` as `ApprovalGrant`.
- It must not register runners, mutate GitHub selected-repository access,
  mutate Proxmox/OpenTofu state, mint project identities, or provision
  workloads.

### `ProjectTeardownPlanReceipt`

Direct `Evidence` receipt for a project-scope teardown plan observed before a
teardown operation.

Expected grain: per `(workspace_id, contract_content_hash,
teardown_plan_id)`. `subject_refs` must include `workspace`; `knowledge_source`
is expected when the plan is tied to a project-substrate contract source.

Purpose:

- Record the planned teardown boundary, target refs, retention expectations,
  data-minimization posture, approval/evidence refs, and deletion-authority
  evidence before any external teardown action occurs.
- Compose with D-025 deletion-authority discipline and ADR 0041 teardown
  posture.

Constraints:

- Contract self-assertion and `.gitignore` state are never deletion authority.
- This receipt does not execute teardown and does not mutate provider state.
- Any future execution must cite separately accepted operation, grant, audit,
  and external-control-plane evidence with `agent_client_id`, `session_id`,
  and principal identity recorded, or typed unknown/absence reasons.

### `ProjectTeardownCompletionReceipt`

Direct `Evidence` receipt for observed teardown completion or closeout
evidence after an external owning surface completes teardown.

Expected grain: per `(workspace_id, teardown_plan_id,
teardown_completed_at)`. `subject_refs` must include `workspace`; additional
refs may include `external_control_plane`, `provider_object`, and
`knowledge_source` when applicable.

Purpose:

- Record closeout evidence refs, retained/removed target refs, residual-risk
  status, retention/tombstone posture, and observed completion timestamp.
- Distinguish completion evidence from HCS execution authority.

Constraints:

- This receipt is not `ProjectTeardownProof`. A future proof composite, if
  needed, must be named `ProjectTeardownProof` and modeled as a `*Proof`
  composite that references evidence records, not as Evidence.
- Completion claims must cite typed deletion-authority and external evidence.
- Stale "retired" or tombstone records must not be promoted to positive
  readiness or admission without fresh evidence.

## Deferred follow-on candidates

This ADR does not accept these records, enum values, or behaviors:

- `QualityGate.gate_kind: "project_substrate_admission"`. ADR 0041 keeps this
  as a future candidate, but v1 schema work stops at evidence production.
  Gate-kind implementation needs a separate policy/gate ADR or amendment that
  defines target refs, evidence_refs, freshness windows, and denial semantics.
- A standalone `ProjectSubstrateContract` entity. Reopen only if HCS needs
  durable contract lifecycle beyond source snapshot plus evidence.
- `SelectedRepositoryAccessObservation` and `WorkflowPolicyCheckReceipt`.
  These remain Q-005/Q-006 follow-on work if existing runner/check/source
  evidence is insufficient.
- Q-015 backup-readiness entities and receipts, including
  `StorageClassReadiness`, `RestoreDrillReceipt`,
  `BackupCredentialCustody`, and `ProjectSubstrateBackupRequirement`.
- Runtime validators, live policy evaluation, dashboard routes, adapters,
  hooks, runner registration, project provisioning, provider mutation, and
  teardown execution.

## Consequences

### Accepts

- Q-014 v1 is schema/evidence work only; implementation PRs must be scoped to
  the source-kind, boundary branch, direct evidence subtypes, docs, registry,
  fixtures, and tests named in this ADR.
- Project-owned contract YAML composes with ADR 0036 as `KnowledgeSource`,
  not as HCS operating authority.
- Contract lifecycle status is producer-asserted evidence input, never gate
  authority alone.
- `guardian_approval` is admission-authority boundary evidence, not HCS
  `ApprovalGrant`.
- Q-013 `CredentialAuthorityObservation` and
  `MachineIdentityBindingObservation` are the credential/machine-identity
  evidence inputs for this slice.
- Acceptance review included `hcs-architect`, `hcs-ontology-reviewer`,
  `hcs-policy-reviewer`, and `hcs-security-reviewer`; future implementation
  review remains scoped by the schema-change workflow and this ADR.

### Rejects

- Making HCS a CI, runner, Proxmox, GitHub, OpenTofu, identity,
  backup/restore, or project workload control plane. Authority: charter
  invariants 1, 7, and 16; ADR 0015; ADR 0032.
- Adding a standalone `ProjectSubstrateContract` entity in this slice.
  Authority: ADR 0036, ADR 0041, and charter invariant 18.
- Adding `QualityGate.gate_kind: "project_substrate_admission"` in this
  slice. Authority: ADR 0035 and ADR 0041; policy/gate semantics remain a
  future lane.
- Defining `ApprovalGrant.scope`, `allowed_for_gate`, gate-promotion, or
  canonical policy behavior in this ADR. Authority: charter invariants 1, 7,
  10, 18, and 19.
- Treating contract status, `guardian_approval`, provider labels, runner
  labels, check names, or source chunks as gate authority by themselves.
  Authority: charter invariant 18; ADR 0032; ADR 0033; ADR 0041.
- Treating `guardian_approval` as HCS `ApprovalGrant`. Authority: ADR 0041
  and charter invariant 7.
- Registering or deregistering runners. Authority: ADR 0032.
- Mutating GitHub runner groups, selected-repository access, repository
  rulesets, workflow policy, Proxmox host state, OpenTofu state, vault state,
  service-account state, or project workload state from HCS. Authority:
  charter invariants 7 and 16; ADR 0015; ADR 0032; ADR 0033; ADR 0040.
- Minting, rotating, or retiring project machine identities. Authority:
  ADR 0040 and ADR 0043.
- Treating public fork code on self-hosted runners, generic `runs-on:
  self-hosted`, Docker socket exposure to untrusted jobs, or runner tokens in
  state as guardian-overridable exceptions. Authority: ADR 0032 and charter
  invariants 6, 7, and 16.
- Collapsing project-owned contract YAML into HCS live policy. Authority:
  ADR 0006 and charter invariant 10.
- Duplicating Citadel OPA rules inside HCS policy YAML or schema validators.
  Authority: charter invariant 1 and ADR 0006.
- Storing resolved secret material in HCS docs, schemas, fixtures, generated
  JSON Schema, policy snapshots, logs, audit artifacts, contract chunks,
  receipts, or validator output. Authority: charter invariants 5 and 10.
- Adding Q-015 backup-readiness schema work by implication. Authority:
  ADR 0042 and the Phase 2.7 deferred-lane sequencing plan.

### Future amendments

- Reopen when project-substrate admission is ready for
  `QualityGate.gate_kind: "project_substrate_admission"` with accepted target
  refs, evidence refs, policy-owned freshness windows, and denial semantics.
- Reopen if implementation proves HCS needs a durable
  `ProjectSubstrateContract` entity.
- Reopen if `project_admission_authority` does not fit the
  `BoundaryObservation` envelope.
- Reopen if selected-repository access or workflow-policy evidence cannot
  compose through accepted Q-005/Q-006 receipts.
- Reopen if Q-015 backup-readiness implementation changes the contract
  validation or admission-observation shape.
- Reopen if dashboard requirements require a dedicated read-only
  project-substrate admission projection.
- Reopen if repeated agent failures show contract status, `guardian_approval`,
  or source chunks being treated as direct HCS authorization despite ADR 0041
  and this ADR.

## Reviewer focus

- `hcs-architect`: ADR 0036 composition; ADR 0041 posture preservation; ADR
  0043 dependency usage; Phase 2.7 sequencing; rejection of control-plane,
  runtime, and provider-mutation expansion.
- `hcs-ontology-reviewer`: `project_substrate_contract` source-kind addition;
  `project_admission_authority` boundary dimension; evidence subtype names;
  subject/ref discipline; no organization-specific HCS core ontology names.
- `hcs-policy-reviewer`: canonical policy YAML boundary; no Citadel OPA
  duplication; no gate-kind or `ApprovalGrant` policy acceptance in this ADR;
  invariant citations in stop rules and rejects.
- `hcs-security-reviewer`: reference-only `secret_refs`; no resolved secret
  material in chunks/fixtures/receipts; guardian-approval evidence chain;
  deletion-authority evidence; runner and provider mutation stop rules.

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md` v1.4.0
- Decision ledger: `DECISIONS.md` Q-014
- Plan: `PLAN.md` Current Focus
- Research plan:
  `~/Organizations/jefahnierocks/system-config/docs/host-capability-substrate-research-plan.md`
- ADR 0006:
  `docs/host-capability-substrate/adr/0006-policy-source-location.md`
- ADR 0015:
  `docs/host-capability-substrate/adr/0015-external-control-plane-automation.md`
- ADR 0019:
  `docs/host-capability-substrate/adr/0019-knowledge-and-coordination-store.md`
- ADR 0022:
  `docs/host-capability-substrate/adr/0022-boundary-observation-envelope.md`
- ADR 0023:
  `docs/host-capability-substrate/adr/0023-evidence-base-shape.md`
- ADR 0032:
  `docs/host-capability-substrate/adr/0032-q-005-ci-runner-evidence-model.md`
- ADR 0033:
  `docs/host-capability-substrate/adr/0033-q-006-b-g-github-authority-and-identity.md`
- ADR 0034:
  `docs/host-capability-substrate/adr/0034-q-007-b-f-boundary-evidence-composition-quality-gate-posture.md`
- ADR 0035:
  `docs/host-capability-substrate/adr/0035-q-007-g-quality-gate-standalone-entity.md`
- ADR 0036:
  `docs/host-capability-substrate/adr/0036-q-009-workspace-manifest-projection-and-diagnostic-surface.md`
- ADR 0038:
  `docs/host-capability-substrate/adr/0038-phase-2-schema-landing-sequence.md`
- ADR 0040:
  `docs/host-capability-substrate/adr/0040-credential-plane-integration.md`
- ADR 0041:
  `docs/host-capability-substrate/adr/0041-q-014-project-substrate-contract-validation.md`
- ADR 0042:
  `docs/host-capability-substrate/adr/0042-q-015-backup-readiness-posture.md`
- ADR 0043:
  `docs/host-capability-substrate/adr/0043-q-013-credential-plane-implementation.md`
- Q-014 local synthesis:
  `docs/host-capability-substrate/research/local/2026-05-06-project-substrate-compatibility-synthesis.md`
- Q-014 lane plan:
  `docs/host-capability-substrate/research/local/2026-05-06-q-014-implementation-lane-plan.md`
- Phase 2.7 deferred-lane sequencing:
  `docs/host-capability-substrate/research/local/2026-05-06-phase-2-7-deferred-lane-sequencing-plan.md`

### External

- Citadel source authority: `The-Nash-Group/citadel-config` commit
  `46c55857427af4b887194277bac2218c20b595b6`
- Citadel project-substrate control-plane standard:
  `/Users/verlyn13/Organizations/the-nash-group/the-citadel/docs/project-substrate-control-plane-standard.md`
- Citadel project-substrate contract example:
  `/Users/verlyn13/Organizations/the-nash-group/the-citadel/docs/reference/project-substrate-contract.example.yaml`
- Citadel runner-substrate boundary:
  `/Users/verlyn13/Organizations/the-nash-group/the-citadel/docs/runner-substrate-boundary.md`
