---
adr_number: 0041
title: Q-014 project-substrate contract validation posture
status: proposed
date: 2026-05-06
charter_version: 1.4.0
tags: [project-substrate, contract-validation, citadel, workspace-context, knowledge-source, boundary-observation, quality-gate, q-014, phase-2]
---

# ADR 0041: Q-014 project-substrate contract validation posture

## Status

proposed

This ADR proposes the posture for Q-014. It does not authorize Zod schema
source, generated JSON Schema, canonical policy YAML, validators, adapters,
dashboard routes, hooks, runner registration, Proxmox changes, OpenTofu
changes, machine-identity issuance, project workload provisioning, or runtime
behavior.

Before acceptance, this ADR requires reviewer objections from:

- `hcs-architect`
- `hcs-ontology-reviewer`
- `hcs-policy-reviewer`
- `hcs-security-reviewer`

Reviewer pass completed on 2026-05-06 with no remaining blockers. The
ontology re-review confirmed the prior blockers were closed by the
`ProjectTeardownCompletionReceipt` rename, single-home
`project_admission_authority` posture, and explicit Evidence provenance /
freshness commitments. The security re-review found no blockers in the
secret-reference, guardian-approval, teardown-authority, runner-boundary, and
forbidden-operation posture.

## Date

2026-05-06

## Charter version

Written against charter v1.4.0.

## Context

Citadel PR #37 introduced a project-substrate admission standard for shared
compute substrate use. The standard covers both CI execution and project
infrastructure lanes. It requires each admitted project to carry a non-secret
project substrate contract that declares resource budget, network posture,
storage and backup posture, machine identities, secret references, IaC owner,
evidence requirements, teardown policy, guardian approval, and lifecycle
status.

HCS needs a posture for how that contract enters the substrate without turning
HCS into a runner, Proxmox, GitHub, OpenTofu, identity, or project workload
control plane.

The source material is preserved as external compatibility input:

- `docs/host-capability-substrate/research/external/2026-05-06-citadel-project-substrate-standard.md`
- `docs/host-capability-substrate/research/local/2026-05-06-project-substrate-compatibility-synthesis.md`

The observed Citadel source authority is:

- Repository: `The-Nash-Group/citadel-config`
- Commit: `46c55857427af4b887194277bac2218c20b595b6`
- Source paths:
  - `/Users/verlyn13/Organizations/the-nash-group/the-citadel/docs/project-substrate-control-plane-standard.md`
  - `/Users/verlyn13/Organizations/the-nash-group/the-citadel/docs/reference/project-substrate-contract.example.yaml`
  - `/Users/verlyn13/Organizations/the-nash-group/the-citadel/docs/runner-substrate-boundary.md`

Existing ADRs already cover much of the component vocabulary:

- ADR 0015: external control-plane operations are evidence-first.
- ADR 0018 / ADR 0040: credential sources and machine-identity posture are
  modeled generically; HCS does not mint machine identities in Citadel or
  project domains.
- ADR 0019 / charter invariant 18: derived or source-file content may guide
  discovery, but only typed evidence can gate.
- ADR 0022 / ADR 0034 / ADR 0035: boundary evidence and QualityGate
  composition carry freshness and execution-context discipline.
- ADR 0032: HCS consumes runner evidence; Citadel owns runner control-plane
  desired state.
- ADR 0033: HCS requires source identity before consuming check results.
- ADR 0036: workspace manifest inputs compose as operational truth plus
  source snapshots plus derived projection.
- ADR 0038: Phase 2.1-2.6 schema sequencing is already accepted and does not
  include project-substrate implementation.
- ADR 0040: credential-plane implementation is Phase 2.7 / Wave-2 candidate
  work unless sequencing is amended.

Q-014 must therefore answer a narrower question: how should HCS represent and
validate a project-owned substrate contract as future input without duplicating
Citadel policy, project ownership, or substrate provisioning authority?

## Options considered

### Option A: Create a standalone `ProjectSubstrateContract` Ring 0 entity now

HCS would define a durable Ring 0 entity with contract identity, lifecycle
state, fields mirroring the Citadel contract, and references to evidence and
approvals.

**Pros:**

- Gives HCS a direct object to query and render.
- Makes contract lifecycle explicit in HCS from the start.
- Could simplify future dashboard views.

**Cons:**

- Risks moving project-owned YAML lifecycle into HCS too early.
- Creates a parallel lifecycle surface beside `QualityGate` and
  `ApprovalGrant`.
- Requires broad schema scope before the evidence dependencies have landed.
- Encourages agents to treat Citadel contract status as HCS authorization.
- Conflicts with ADR 0038 sequencing unless separately amended.

### Option B: Compose with ADR 0036 using `KnowledgeSource` plus validation receipts

HCS treats the project-owned contract YAML as an external source snapshot:
candidate `KnowledgeSource.source_kind: "project_substrate_contract"`.
Contract content and chunks remain display/discovery input only. HCS mints
typed validation receipts that cite both the contract source and Layer 1
operational evidence.

**Pros:**

- Reuses ADR 0036's accepted three-layer pattern rather than creating a
  parallel intake model.
- Preserves project ownership of the contract file.
- Keeps contract chunks non-gate-authority per charter invariant 18.
- Allows HCS to validate contract structure and admission posture with typed,
  freshness-bound evidence.
- Keeps v1 scope narrow enough for one ADR cycle.
- Leaves room to promote a standalone entity later if durable HCS lifecycle
  need is proven.

**Cons:**

- Does not immediately give HCS a first-class contract entity.
- Requires future validation receipt schemas before runtime use.
- Dashboard views will initially compose through evidence rather than a single
  contract object.

### Option C: Treat project-substrate contracts as Citadel-only

HCS would keep the Citadel standard outside HCS entirely and consume only
downstream runner/check/credential/boundary evidence when it appears.

**Pros:**

- Minimal HCS scope.
- Avoids premature schema and policy work.
- Preserves Citadel's admission authority without ambiguity.

**Cons:**

- Leaves future HCS agents without a citable boundary for project-substrate
  contract validation.
- Reopens the same ownership questions at every implementation touchpoint.
- Does not define how contract status and guardian approval relate to
  QualityGate and ApprovalGrant.
- Misses the opportunity to normalize contract validation into HCS vocabulary
  before project agents begin adding contracts.

### Option D: Copy Citadel OPA or admission policy into HCS

HCS would duplicate Citadel's workflow/admission policy rules in HCS canonical
policy YAML or docs so HCS can evaluate project substrate contracts directly.

**Pros:**

- Would make HCS validation self-contained.
- Could give one local policy location for project agents.

**Cons:**

- Violates charter invariant 1 by duplicating policy across surfaces.
- Creates drift between Citadel OPA and HCS policy.
- Makes HCS a parallel CI/admission control plane.
- Collides with ADR 0006, D-004, D-018, and charter invariant 10
  policy/deployment boundary discipline.

## Decision

Choose Option B. Q-014 composes with ADR 0036 by treating project-owned
substrate contract YAML as a `KnowledgeSource` input with candidate
`source_kind: "project_substrate_contract"` and by defining future typed
validation evidence that cites both the contract source and Layer 1
operational evidence. Contract lifecycle status and `guardian_approval` are
evidence inputs, not HCS authorization. Q-014 v1 commits posture only for a
small v1 evidence cohort:
`ProjectSubstrateContractValidationReceipt`,
`ProjectSubstrateAdmissionObservation`, `ProjectTeardownPlanReceipt`, and
`ProjectTeardownCompletionReceipt`. Implementation is deferred to Phase 2.7 /
Wave-2 and should sequence jointly with Q-013 unless ADR 0038 is separately
amended.

## Consequences

### Accepts

- Candidate `KnowledgeSource.source_kind: "project_substrate_contract"` is the
  starting representation for the project-owned contract source.
- Contract source chunks are display/discovery input only. They do not become
  gate authority directly.
- Gate-eligible project-substrate facts must be typed validation evidence that
  cites both the contract source and operational evidence.
- Every Q-014 candidate `Evidence` subtype must carry the base Evidence
  provenance and freshness contract: `source`, `source_ref`, `observed_at`,
  non-null `valid_until`, `authority`, `confidence`, `parser_version`, and the
  applicable execution-context binding required by charter invariant 19.
  Freshness-window durations remain policy-owned; field presence and non-null
  boundary freshness do not.
- Contract lifecycle states (`draft`, `accepted`, `provisionable`, `active`,
  `suspended`, `retired`) are producer-asserted admission evidence.
- A future `QualityGate.gate_kind: "project_substrate_admission"` candidate
  may consume project-substrate admission evidence, but gate state is computed
  from the full evidence chain. Contract `active` status alone is never
  sufficient gate authority.
- `guardian_approval` is admission-authority evidence, not HCS
  `ApprovalGrant`. Future runtime approvals must mint their own scoped HCS
  `ApprovalGrant` records and may cite guardian evidence as one input.
- Candidate `boundary_dimension: "project_admission_authority"` is the only
  v1 ontology home for the external `guardian_approval` fact. A future
  `ProjectSubstrateAdmissionObservation` may cite that `BoundaryObservation`
  and summarize its state, but must not duplicate the admission-authority
  payload as a second fact home. If ontology review later rejects the
  `BoundaryObservation` envelope for this field, the implementation ADR must
  reopen this ADR before minting a direct evidence subtype fallback.
- Q-014 v1 evidence posture is grouped into cohorts:
  - Cohort 1 composes with existing ADRs and does not add v1 shapes.
  - Cohort 2 is the v1 posture set:
    `ProjectSubstrateContractValidationReceipt`,
    `ProjectSubstrateAdmissionObservation`,
    `ProjectTeardownPlanReceipt`, and `ProjectTeardownCompletionReceipt`.
  - Cohort 3 defers machine-identity, backup/restore, selected-repository
    access, and workflow-policy check shapes to follow-on lanes.
- `ProjectTeardownPlanReceipt` and `ProjectTeardownCompletionReceipt` must
  reference typed deletion-authority evidence. Contract self-assertion and
  `.gitignore` state are never deletion authority.
- A future authored teardown aggregate, if needed, must be named
  `ProjectTeardownProof` and modeled as a `*Proof` composite that references
  Evidence records; it must not be named `*ProofReceipt` or subtype Evidence.
- Q-014 implementation is Phase 2.7 / Wave-2 candidate work and should share
  sequencing with Q-013 because machine-identity validation depends on
  Q-013 implementation evidence.
- ADR 0038 is not amended by this posture ADR.

### Rejects

- Creating a standalone `ProjectSubstrateContract` Ring 0 entity in this
  cycle.
- Treating Citadel contract `active` status as HCS authorization.
- Treating `guardian_approval` as HCS `ApprovalGrant`.
- Making HCS a CI control plane. Authority: charter invariants 1 and 7 plus
  ADR 0032.
- Making HCS a Proxmox control plane. Authority: charter invariant 1 plus
  ADR 0015.
- Making HCS a project workload provisioner. Authority: charter invariants 7
  and 16 plus ADR 0032.
- Minting, rotating, or retiring project machine identities in HCS. Authority:
  ADR 0040.
- Registering or deregistering runners from this lane. Authority: ADR 0032.
- Mutating GitHub runner groups, selected-repository access, repository
  rulesets, or workflow policy. Authority: ADR 0032 and ADR 0033.
- Mutating Proxmox host state. Authority: charter invariant 16 and ADR 0015.
- Mutating OpenTofu state from the HCS repo. Authority: ADR 0032, ADR 0040,
  and D-018.
- Storing secret material in HCS docs, fixtures, schemas, policy snapshots, or
  audit artifacts. Authority: charter invariant 5.
- Collapsing project-owned contract YAML into HCS live policy. Authority:
  ADR 0006, charter invariant 10, D-004, and D-018.
- Duplicating Citadel OPA rules inside HCS policy YAML. Authority: charter
  invariant 1.
- Using HCS to bypass project contract, direct host SSH, Docker, or Proxmox
  console controls. Authority: charter invariants 6 and 7.
- Resolved secret values in `secret_refs`, contract chunks, validators,
  fixtures, schemas, policy snapshots, logs, or audit artifacts. Contract
  `secret_refs` are reference-only `SecretReference` / `op://`-style pointers;
  validators must not resolve or persist secret material. Authority: charter
  invariants 5 and 16.
- Treating public fork code on self-hosted runners, generic `runs-on:
  self-hosted`, Docker socket exposure to untrusted jobs, or runner tokens in
  state as guardian-overridable exceptions. These remain forbidden or
  non-escalable runner families under Q-005 posture.

### Future amendments

- Reopen if implementation proves HCS needs durable contract lifecycle inside
  a standalone Ring 0 entity.
- Reopen when Q-013 implementation lands and machine-identity validation
  evidence can be specified concretely.
- Reopen if backup readiness and restore expectation require a separate
  Q-015 backup/restore evidence model.
- Reopen if selected-repository access or workflow-policy check evidence
  cannot compose cleanly through Q-005/Q-006 follow-on receipts.
- Reopen if dashboard requirements require a dedicated read-only
  project-substrate contract view.
- Reopen if repeated agent failures show contract status or guardian approval
  being treated as direct HCS authorization despite this ADR.
- Reopen if implementation pressure requires an ADR 0038 sequencing amendment
  to move project-substrate work into Phase 2.1-2.6.

## Reviewer focus

- `hcs-architect`: ADR 0036 composition; ADR 0038 sequencing; Citadel/HCS
  ownership boundary; cohort triage; contract-status and QualityGate
  composition.
- `hcs-ontology-reviewer`: candidate `source_kind:
  "project_substrate_contract"`; cohort-2 evidence subtype names; candidate
  `boundary_dimension: "project_admission_authority"`; candidate
  `gate_kind: "project_substrate_admission"`; no organization-specific HCS
  ontology names.
- `hcs-policy-reviewer`: stop-rule invariant citations; canonical policy YAML
  boundary; no Citadel OPA duplication; freshness-window commitments deferred
  to policy YAML.
- `hcs-security-reviewer`: reference-only `secret_refs`; no resolved values in
  contract chunks; guardian approval evidence chain; teardown receipts and
  D-025 / charter invariant 13 deletion authority; public-fork/self-hosted
  runner denial remains non-escalable.

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md` v1.4.0
- Decision ledger: `DECISIONS.md` Q-014
- Plan: `PLAN.md` project-substrate admission standard intake
- HCS external source note:
  `docs/host-capability-substrate/research/external/2026-05-06-citadel-project-substrate-standard.md`
- HCS local synthesis:
  `docs/host-capability-substrate/research/local/2026-05-06-project-substrate-compatibility-synthesis.md`
- ADR 0006:
  `docs/host-capability-substrate/adr/0006-policy-source-location.md`
- ADR 0015:
  `docs/host-capability-substrate/adr/0015-external-control-plane-automation.md`
- ADR 0018:
  `docs/host-capability-substrate/adr/0018-durable-credential-preference.md`
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
- Research plan:
  `~/Organizations/jefahnierocks/system-config/docs/host-capability-substrate-research-plan.md`
- Canonical policy location:
  `~/Organizations/jefahnierocks/system-config/policies/host-capability-substrate/`

### External compatibility input

- Citadel project-substrate standard:
  `/Users/verlyn13/Organizations/the-nash-group/the-citadel/docs/project-substrate-control-plane-standard.md`
- Citadel project-substrate contract example:
  `/Users/verlyn13/Organizations/the-nash-group/the-citadel/docs/reference/project-substrate-contract.example.yaml`
- Citadel runner-substrate boundary:
  `/Users/verlyn13/Organizations/the-nash-group/the-citadel/docs/runner-substrate-boundary.md`
