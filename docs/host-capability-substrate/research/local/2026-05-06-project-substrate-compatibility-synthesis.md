---
title: Project substrate compatibility synthesis
category: research
component: host_capability_substrate
status: planning-input
version: 0.2.0
last_updated: 2026-05-06
tags: [project-substrate, citadel, runner-substrate, workspace-context, resource-budget, credential-source, boundary-observation, quality-gate, q-014]
priority: high
---

# Project Substrate Compatibility Synthesis

## Status

Planning input only. This document normalizes the Citadel project-substrate
admission standard into HCS vocabulary.

Source note:
`docs/host-capability-substrate/research/external/2026-05-06-citadel-project-substrate-standard.md`

This document does not authorize Zod schemas, generated JSON Schema,
canonical policy YAML, runner behavior, provider mutation, machine-identity
issuance, project workload provisioning, dashboard routes, adapter endpoints,
hook behavior, or runtime changes.

## Framing

The Citadel project-substrate standard is an admission contract for shared
compute substrate use. HCS is the future typed evidence and validation
consumer for the records the standard names.

HCS must keep the ownership split explicit:

- Citadel owns GitHub organization control-plane state: runner groups,
  selected repository access, workflow policy checks, repository rulesets, and
  related OpenTofu state.
- `runner-substrate` owns physical Proxmox host implementation, host storage,
  templates, networking, backup readiness, runner VM bootstrap, and substrate
  maintenance evidence.
- Project repos own their project substrate contract and project workload
  source.
- `system-config` owns transitional host-local policy representation and
  generated policy snapshots until HCS is primary.
- HCS owns generic typed evidence, validation posture, freshness rules, and
  operation gating once an accepted HCS lane exists.

## Concept Mapping

| Citadel standard concept | HCS vocabulary | Current lane |
|---|---|---|
| Project substrate contract | Project-owned input to `WorkspaceContext`, the ADR 0036 workspace manifest projection, and future contract-validation evidence. | Q-014 candidate; ADR 0036 related |
| `workload_lanes.ci_execution` | Runner/check evidence and source-identity receipts. | Q-005 / ADR 0032, Q-006 / ADR 0033 |
| `workload_lanes.project_infrastructure` | External-control-plane evidence, resource, network, storage, backup, teardown, and credential-source posture. | Q-014 candidate; ADR 0015, ADR 0022, ADR 0040 related |
| `resource_budget` | `ResourceBudget` plus future `ResourceBudgetObservation` evidence. | Q-005 / ADR 0032; future schema implementation |
| `network_profile` | Boundary evidence such as egress, ingress, management-surface exposure, service-to-service trust, and reverse-proxy ownership. | Q-007 / ADR 0022 and ADR 0034 |
| `storage_profile` and `backup_profile` | Boundary evidence plus `QualityGate` inputs for durability, restore expectation, and backup readiness. | Q-007 / ADR 0035; Q-014 candidate |
| `machine_identities` | `CredentialSource`, `Principal`, `ExecutionContext`, and machine-identity evidence. HCS consumes and validates; it does not mint identities in Citadel domains. | Q-013 / ADR 0040; Q-014 candidate |
| `secret_refs` | `SecretReference` or credential-source reference names only, never secret material. | Charter invariants 5, 10, 16, 17; ADR 0040 |
| `iac_owner` and no-secrets-in-state evidence | `PolicyPlanReceipt`, external-control-plane receipts, and no-secret-material enforcement. HCS consumes evidence; Citadel or project/substrate repos own applies. | Q-005 / ADR 0032; Q-013 / ADR 0040 |
| Runner group, labels, hosted smoke, public-fork rule | `RunnerHostObservation`, `RunnerIsolationObservation`, `WorkflowRunReceipt`, `CleanRoomSmokeReceipt`, and `StatusCheckSourceObservation`. | Q-005 / ADR 0032; Q-006 / ADR 0033 |
| `evidence_required` | `Evidence` refs, `BoundaryObservation` envelopes, `QualityGate` evidence binding, and future validation receipts. | Q-007 / ADR 0022, ADR 0034, ADR 0035 |
| `teardown_policy` | Deletion authority, leases, cleanup planning, and project-scope proof before ephemeral infrastructure is created or removed. | Q-009 / ADR 0036; Q-014 candidate |
| `guardian_approval` | External approval evidence or human-decision input. It is not automatically an HCS `ApprovalGrant` for HCS-mediated operations. | Q-007 / Q-014 candidate |
| Contract lifecycle status | Admission lifecycle evidence. Do not equate `active` with live HCS authorization unless all required HCS gates are proven and fresh. | Q-014 candidate |

## Fit Assessment

The component facts mostly fit existing HCS lanes:

- CI runner and check facts fit Q-005 and Q-006.
- Boundary and freshness posture fits Q-007.
- Credential and machine-identity posture fits Q-013.
- Workspace manifest and diagnostic projection posture fits Q-009.

The whole project-substrate contract envelope does not fit cleanly under any
single accepted lane. It spans workspace identity, admission lifecycle,
resource budgets, identity references, evidence requirements, network/storage
boundaries, teardown policy, and approval evidence. HCS should open a future
ADR/schema decision lane before validating these contracts as first-class HCS
inputs.

Q-014 records that future lane. The pre-deliberation commitment is to compose
with ADR 0036 rather than invent a parallel intake model: add
`project_substrate_contract` as a `KnowledgeSource.source_kind` candidate,
treat the project-owned YAML as Layer 2 input, and mint typed validation
receipts that cite both the contract source and Layer 1 operational evidence.

The future ADR should decide whether this starting point is sufficient or
whether HCS must later model the contract as:

1. a new `ProjectSubstrateContract` Ring 0 entity;
2. a `WorkspaceContext` extension plus validation receipt;
3. a `KnowledgeSource` input to the ADR 0036 workspace manifest projection
   plus derived validation output;
4. a narrower contract-validation evidence subtype with no new entity.

The conservative starting point is option 3 plus validation receipts: it keeps
the project-owned YAML outside HCS as source input while allowing HCS to
produce typed, freshness-bound validation evidence. A new standalone entity
should require proof that the contract needs durable identity and lifecycle
inside HCS rather than only validated projection.

## Pre-Deliberation Commitments

These commitments should be folded into the first Q-014 ADR draft before
reviewer dispatch.

1. **Compose with ADR 0036.** The contract YAML is a
   `KnowledgeSource` input using candidate
   `source_kind: "project_substrate_contract"`. Contract chunks remain
   display-only under charter invariant 18. Gate-eligible facts are typed
   validation receipts that cite both the contract source and Layer 1 evidence.
2. **Contract lifecycle states are evidence inputs, not gate states.**
   `draft`, `accepted`, `provisionable`, `active`, `suspended`, and `retired`
   are producer-asserted admission evidence. A future
   `QualityGate.gate_kind: "project_substrate_admission"` candidate consumes
   admission evidence plus freshness checks, identity bindings, runner/check
   receipts, and boundary observations. Contract `active` alone is never gate
   authority.
3. **`guardian_approval` is admission evidence, not `ApprovalGrant`.**
   Model it as admission-authority evidence, likely through a
   `BoundaryObservation` payload with candidate
   `boundary_dimension: "project_admission_authority"` or a narrow evidence
   subtype if the envelope is too coarse. Runtime approvals still mint their
   own HCS `ApprovalGrant` records.
4. **Triage evidence shapes before v1 scope.** Q-014 v1 should commit only the
   Tier 2 posture shapes listed below, while Tier 1 composes with existing ADRs
   and Tier 3 defers to follow-on lanes.
5. **Stop rules cite authority.** Every stop rule should cite a charter
   invariant or ADR so review remains mechanical.

## Evidence Shape Triage

Tier 1 composes with accepted ADRs and needs no new v1 evidence subtype:

- `network_profile` validation through existing or separately registered
  `BoundaryObservation` dimensions.
- `resource_budget` through `ResourceBudget` and Q-005
  `ResourceBudgetObservation`.
- CI execution validation through Q-005/Q-006 receipts.
- `iac_owner` no-secrets-in-state through ADR 0032 `PolicyPlanReceipt`.

Tier 2 posture candidates for Q-014 v1:

- `ProjectSubstrateContractValidationReceipt` — point-in-time structural
  validation of the contract against the Citadel standard; grain:
  `(contract_content_hash, validation_run)`.
- `ProjectSubstrateAdmissionObservation` — freshness-bound admission state
  observation citing contract validation plus Citadel authority evidence.
- `ProjectTeardownPlanReceipt` — project-scope teardown plan evidence that
  composes with D-025 deletion authority.
- `ProjectTeardownProofReceipt` — closeout evidence that teardown happened
  within the declared project scope.

Tier 3 deferred candidates:

- `MachineIdentityMappingObservation` and
  `MachineIdentityIssuanceReceipt` wait on Q-013 implementation.
- `BackupReadinessObservation` and `RestoreExpectationReceipt` may need a
  future backup/restore evidence lane if existing boundary dimensions are
  insufficient.
- `SelectedRepositoryAccessObservation` and `WorkflowPolicyCheckReceipt`
  should defer to Q-005/Q-006 follow-on composition unless source-control
  evidence gaps remain after those shapes land.

## Design Rules For Future Work

1. Validate, do not provision. HCS may validate the project contract and gate
   HCS-mediated operations; it must not provision Proxmox, register runners,
   assign runner groups, or mutate project workloads from this intake.
2. Consume evidence, do not copy policy. Citadel OPA and HCS canonical policy
   remain separate. HCS may consume Citadel evidence such as policy-plan
   receipts, selected-repository access, and workflow policy check results.
3. Bind freshness and context. Admission, runner, backup, identity, and
   teardown evidence must carry `observed_at`, `valid_until`, authority,
   confidence, producer, and the appropriate execution-context or provider
   binding.
4. Keep identity authority external. HCS may model machine identity posture
   through `CredentialSource` and evidence records, but identity issuance,
   rotation, and retirement remain owned by the appropriate authority surface.
5. Treat contract status as evidence, not authority. A project status of
   `active` is not a free-standing HCS authorization. HCS gates consume the
   underlying evidence and freshness windows.
6. Preserve no-secrets invariants. Contract files, evidence directories, docs,
   OpenTofu plans, generated schemas, fixtures, and audit summaries must carry
   references only, not secret material.

## Future ADR Questions

Q-014 v1 should answer:

- Does Q-014 compose with ADR 0036 through
  `source_kind: "project_substrate_contract"` plus typed validation receipts?
- Which Tier 2 evidence shapes are committed at posture level for v1?
- Is Q-014 implementation sequenced as Phase 2.7 / Wave-2 jointly with Q-013,
  with machine-identity validation blocked until Q-013 implementation lands?

Future amendments should decide backup/restore freshness, dashboard rendering,
source-control follow-on receipts, and exact canonical policy YAML matrix
cells.

## Immediate Plan

This intake should land only as docs/planning:

1. Preserve the source note in `research/external/`.
2. Preserve this HCS synthesis in `research/local/`.
3. Record Q-014 in `DECISIONS.md`.
4. Add a `PLAN.md` note that project-substrate validation is future work and
   is not part of the current Phase 2.1-2.6 landing train.

Schema, policy, adapter, dashboard, hook, runtime, runner, Proxmox, GitHub,
OpenTofu, and machine-identity changes remain blocked until a future accepted
ADR or sequencing amendment authorizes them.

## Stop Rules

Stop and return to human review if a future task tries to:

- make HCS a CI control plane (charter invariants 1 and 7; ADR 0032);
- make HCS a Proxmox control plane (charter invariant 1; ADR 0015);
- make HCS a project workload provisioner (charter invariants 7 and 16; ADR
  0032);
- mint or rotate project machine identities (ADR 0040);
- register or deregister runners (ADR 0032);
- mutate GitHub runner groups, selected-repository access, repository rulesets,
  or workflow policy (ADR 0032 and ADR 0033);
- mutate Proxmox host state (charter invariant 16; ADR 0015);
- mutate OpenTofu state from the HCS repo (ADR 0040; D-018);
- treat Citadel contract status as HCS approval (charter invariant 18 and the
  Q-014 contract-status composition rule);
- store secret values in HCS docs, fixtures, schemas, policy snapshots, or
  audit artifacts (charter invariant 5);
- collapse project-owned contract YAML into HCS live policy (D-004 and D-018);
- duplicate Citadel OPA rules inside HCS policy YAML (charter invariant 1);
- use HCS to bypass project contract, direct host SSH, Docker, or Proxmox
  console controls (charter invariants 6 and 7).

## Sequencing And Review

Q-014 should follow Q-013 / ADR 0040: posture-only ADR first, implementation
later. ADR 0038 should not be amended unless implementation pressure forces
project-substrate work into Phase 2.1-2.6.

Recommended sequencing:

1. Q-014 v1 ADR commits posture and the commitments above.
2. Phase 2.1-2.6 schema train completes per ADR 0038.
3. Q-013 implementation lane opens and lands credential-source implementation
   evidence.
4. Q-014 implementation lane opens after Q-013 lands the credential-source
   work that machine-identity validation depends on.
5. Backup/restore or other deferred lanes open only when evidence dependencies
   justify them.

Reviewer dispatch should include `hcs-architect`, `hcs-ontology-reviewer`,
`hcs-policy-reviewer`, and `hcs-security-reviewer`.

## Change Log

| Version | Date | Change |
|---|---:|---|
| 0.2.0 | 2026-05-06 | Added pre-deliberation commitments: ADR 0036 composition, contract-status and guardian-approval evidence rules, evidence-shape triage, cited stop rules, and Phase 2.7/Q-013 sequencing posture. |
| 0.1.0 | 2026-05-06 | Initial HCS synthesis of Citadel project-substrate standard; opened Q-014 planning posture and blocked implementation until follow-on acceptance. |
