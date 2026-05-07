# Phase 2.7 Deferred-Lane Sequencing Plan

Date: 2026-05-06

Status: deferred-lane sequencing plan. ADR 0043's first Q-013
schema/evidence slice has landed and proposed ADR 0044 has opened Q-014
implementation deliberation. This document does not independently amend ADR
0038 or authorize canonical policy YAML, validators, adapters, dashboard
routes, hooks, broker/runtime behavior, runner registration, Proxmox changes,
Hetzner changes, OpenTofu changes, service-account creation, machine-identity
issuance, backup execution, restore execution, project workload provisioning,
provider mutation, operation registration, Q-014 schema work, or Q-015 schema
work.

## Purpose

ADR 0038 accepts the Phase 2.1-2.6 schema landing train. ADR 0040, ADR 0041,
and ADR 0042 accept three posture lanes that are outside that train:

- Q-013 credential-plane implementation, with the v1 schema/evidence slice
  accepted by ADR 0043 and landed on 2026-05-07.
- Q-014 project-substrate contract validation and admission evidence.
- Q-015 backup-readiness and restore-drill evidence posture.

This plan records how those deferred lanes should sequence after Phase 2.1-2.6
or under a separately accepted sequencing amendment.

## Inputs

- ADR 0038:
  `docs/host-capability-substrate/adr/0038-phase-2-schema-landing-sequence.md`
- ADR 0040:
  `docs/host-capability-substrate/adr/0040-credential-plane-integration.md`
- ADR 0041:
  `docs/host-capability-substrate/adr/0041-q-014-project-substrate-contract-validation.md`
- ADR 0042:
  `docs/host-capability-substrate/adr/0042-q-015-backup-readiness-posture.md`
- Q-013 lane plan:
  `docs/host-capability-substrate/research/local/2026-05-06-q-013-implementation-lane-plan.md`
- Accepted Q-013 implementation ADR:
  `docs/host-capability-substrate/adr/0043-q-013-credential-plane-implementation.md`
- Q-014 lane plan:
  `docs/host-capability-substrate/research/local/2026-05-06-q-014-implementation-lane-plan.md`
- Proposed Q-014 implementation ADR:
  `docs/host-capability-substrate/adr/0044-q-014-project-substrate-implementation.md`
- Q-015 intake:
  `docs/host-capability-substrate/research/local/2026-05-06-q-015-backup-readiness-intake.md`
- Q-015 lane plan:
  `docs/host-capability-substrate/research/local/2026-05-07-q-015-implementation-lane-plan.md`

## Sequencing Rule

Default order:

1. Finish Phase 2.1-2.6 as accepted by ADR 0038. Completed before ADR 0043
   acceptance.
2. Accept a Q-013 implementation ADR. Completed by ADR 0043 for the v1
   schema/evidence slice only.
3. Land ADR 0043 implementation evidence needed for credential-source and
   machine-identity validation. Completed by the v1 schema/evidence slice.
4. Open a Q-014 implementation ADR. Proposed ADR 0044 now satisfies the draft
   step, but not the acceptance step.
5. Accept a Q-014 implementation ADR after reviewer pass, then land Q-014
   contract-validation and admission-evidence shapes.
6. Open a Q-015 implementation ADR only after Q-013 and Q-014 implementation
   evidence exists and backup/readiness remains a real independent evidence
   need.
7. Open selected-repository-access, workflow-policy-check, or dashboard
   follow-on lanes only if their evidence dependencies remain real after
   Q-013 and Q-014 implementation.

Accelerated order:

- If implementation pressure requires Q-013, Q-014, or Q-015 work before that
  lane's entry conditions are satisfied, draft a separate sequencing
  amendment. That amendment must name the exact phase displacement, affected
  dependencies, reviewer set, and stop conditions. It must not silently amend
  ADR 0038.

## Lane Dependency Matrix

| Lane | Opens after | Blocks | Notes |
|---|---|---|---|
| Q-013 credential plane | Landed on 2026-05-07 via ADR 0043 | `CredentialAuthorityObservation`, `MachineIdentityBindingObservation`, and required subject/ref vocabulary | Runtime injection, broker behavior, reconciler receipts, provider mutation, credential issuance, policy YAML, and operation registration remain blocked behind future ADRs or policy lanes. |
| Q-014 project substrate | Q-013 v1 credential-source and machine-identity evidence exists, plus accepted Q-014 implementation ADR 0044 or replacement | `project_substrate_contract` source-kind implementation, `project_admission_authority` boundary branch, contract-validation receipt, admission observation, teardown receipts | Proposed ADR 0044 deliberately defers `QualityGate.gate_kind: "project_substrate_admission"` to a future policy/gate lane. It composes with ADRs 0036, 0035, 0034, 0032, 0033, 0040, 0041, and the landed ADR 0043 evidence shapes. |
| Q-015 backup readiness | Q-013 credential-source evidence and Q-014 project-substrate contract/admission evidence, plus accepted Q-015 implementation ADR | `BackupReadinessObservation` or `BackupReadinessReceipt`, `StorageClassReadiness`, `RestoreDrillReceipt`, `BackupLayerThreatModel`, `BackupCredentialCustody`, `BackupMonitoringRequirement`, `ProjectSubstrateBackupRequirement`, possible `QualityGate.gate_kind: "backup_readiness"` | Posture can be drafted before implementation, but schema/registry/policy/runtime work remains blocked. Preserve `pending` -> `configured` -> `usable` -> `ready` with optional `expired`; restore drill with boot/service verification is the promotion gate to `ready`; keep runner-substrate Proxmox/Synology evidence separate from Hetzner VPS restic / Storage Box evidence. |
| Source-control access follow-on | Q-006/Q-005 follow-on shapes prove selected-repository/workflow-policy gaps remain | `SelectedRepositoryAccessObservation`, `WorkflowPolicyCheckReceipt` | Keep GitHub runner groups, selected repository access, rulesets, and workflow policy outside HCS mutation authority. |
| Dashboard projection | Q-014 evidence shapes exist and read-only rendering requirements are concrete | Read-only project-substrate admission view | Dashboard remains Ring 2 projection only; no gate authority or mutation surface. |

## Review Discipline

Each implementation ADR or sequencing amendment must dispatch reviewers by
surface:

- `hcs-architect`: cross-ADR composition, phase order, ring boundaries, and
  ownership split.
- `hcs-ontology-reviewer`: schema names, enum values, subject refs,
  provenance/freshness fields, and no org-specific HCS core ontology.
- `hcs-policy-reviewer`: canonical policy YAML boundary, operation-class
  posture, escalation holes, and no policy duplication.
- `hcs-security-reviewer`: secret material, service-account exceptions,
  machine identity, runner non-escalability, teardown authority, audit
  integrity, and forbidden-operation exposure.

Schema PRs must follow `.agents/skills/hcs-schema-change`: Zod source,
generated JSON Schema, ontology docs, registry entries, fixtures, and tests
move together.

## Stop Rules

Stop and return to human review if a task tries to:

- expand Q-013 beyond ADR 0043's accepted schema/evidence slice without a
  follow-on ADR or policy lane;
- implement Q-014 schema/runtime work before a Q-014 implementation ADR is
  accepted;
- implement Q-015 before Q-013 and Q-014 implementation dependencies exist and
  a Q-015 implementation ADR is accepted;
- treat this plan as schema, policy, runtime, broker, runner, Proxmox,
  Hetzner, OpenTofu, machine-identity, backup execution, restore execution, or
  project workload authority;
- mutate `system-config`, Citadel, GitHub runner groups, selected repository
  access, Proxmox state, OpenTofu state, vault state, or service-account state
  from the HCS repo;
- treat credential-source labels, contract lifecycle status, or
  `guardian_approval` as gate authority by themselves;
- store resolved secret material in HCS docs, schemas, fixtures, generated
  JSON Schema, policy snapshots, logs, or audit artifacts;
- collapse Citadel or project-owned YAML into HCS live policy.
- describe a backup layer as `ready` without freshness-bound restore-drill
  evidence with boot/service verification;
- conflate runner-substrate Proxmox/Synology backup evidence with Hetzner VPS
  restic / Storage Box evidence.

## Next Safe Action

Proceed to ADR 0044 review/acceptance. Keep Q-014 schema/runtime work blocked
until ADR 0044 or a replacement implementation ADR is accepted, and keep Q-015
in the deferred Phase 2.7 queue until Q-014 evidence exists plus a Q-015
implementation ADR is accepted.

## Change Log

| Version | Date | Change |
|---|---:|---|
| 0.4.1 | 2026-05-07 | Added proposed ADR 0044 as the Q-014 implementation ADR draft and clarified that Q-014 schema/runtime work remains blocked pending acceptance. |
| 0.4.0 | 2026-05-07 | Recorded ADR 0043 v1 schema/evidence landing and moved the next downstream lane to Q-014 implementation ADR planning. |
| 0.3.0 | 2026-05-07 | Updated after ADR 0043 acceptance; Q-013 v1 schema/evidence implementation opens while Q-014/Q-015 and runtime/provider/policy work remain blocked. |
| 0.2.4 | 2026-05-07 | Added proposed ADR 0043 as the Q-013 implementation ADR input without changing implementation authority. |
| 0.2.3 | 2026-05-07 | Added the Q-015 implementation-lane plan as an input while keeping Q-015 implementation blocked. |
| 0.2.2 | 2026-05-07 | Added Q-015 surfaces to the planning-only status block and generalized the acceleration rule to all three deferred lanes. |
| 0.2.1 | 2026-05-07 | Updated ADR 0042 references after human acceptance; Q-015 remains posture-only and implementation-blocked. |
| 0.2.0 | 2026-05-07 | Added Q-015 backup-readiness as a third deferred posture lane, linked the intake and proposed ADR 0042, expanded the lane matrix, and added backup-specific stop rules. |
| 0.1.0 | 2026-05-06 | Initial docs-only sequencing plan tying Q-013 and Q-014 deferred implementation lanes together after ADR 0040 and ADR 0041 acceptance. |
