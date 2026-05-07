# Phase 2.7 Deferred-Lane Sequencing Plan

Date: 2026-05-06

Status: planning only. This document does not amend ADR 0038 and does not
authorize schema source, generated JSON Schema, canonical policy YAML,
validators, adapters, dashboard routes, hooks, broker/runtime behavior,
runner registration, Proxmox changes, OpenTofu changes, service-account
creation, machine-identity issuance, project workload provisioning, or
operation registration.

## Purpose

ADR 0038 accepts the Phase 2.1-2.6 schema landing train. ADR 0040, ADR 0041,
and ADR 0042 accept three posture lanes that are outside that train:

- Q-013 credential-plane implementation.
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
- Q-014 lane plan:
  `docs/host-capability-substrate/research/local/2026-05-06-q-014-implementation-lane-plan.md`
- Q-015 intake:
  `docs/host-capability-substrate/research/local/2026-05-06-q-015-backup-readiness-intake.md`

## Sequencing Rule

Default order:

1. Finish Phase 2.1-2.6 as accepted by ADR 0038.
2. Open a Q-013 implementation ADR.
3. Land Q-013 implementation evidence needed for credential-source and
   machine-identity validation.
4. Open a Q-014 implementation ADR.
5. Land Q-014 contract-validation and admission-evidence shapes.
6. Open a Q-015 implementation ADR only after Q-013 and Q-014 implementation
   evidence exists and backup/readiness remains a real independent evidence
   need.
7. Open selected-repository-access, workflow-policy-check, or dashboard
   follow-on lanes only if their evidence dependencies remain real after
   Q-013 and Q-014 implementation.

Accelerated order:

- If implementation pressure requires Q-013 or Q-014 work before Phase 2.1-2.6
  completes, draft a separate sequencing amendment. That amendment must name
  the exact phase displacement, affected dependencies, reviewer set, and stop
  conditions. It must not silently amend ADR 0038.

## Lane Dependency Matrix

| Lane | Opens after | Blocks | Notes |
|---|---|---|---|
| Q-013 credential plane | Phase 2.1-2.6 completion, or accepted sequencing amendment | Credential-source refinement, credential-authority evidence, broker/runtime credential posture, reconciler receipts, machine-identity evidence dependencies | Implementation ADR must compose with ADRs 0012, 0015, 0018, 0019, 0029, 0034, 0038, and 0040. |
| Q-014 project substrate | Q-013 implementation evidence needed for machine identity, plus Phase 2.1-2.6 completion or accepted sequencing amendment | `project_substrate_contract` source-kind implementation, contract-validation receipt, admission observation, teardown receipts, project admission gate posture | Implementation ADR must compose with ADRs 0036, 0035, 0034, 0032, 0033, 0040, and 0041. |
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

- implement Q-013 or Q-014 before Phase 2.1-2.6 completes without a sequencing
  amendment;
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

Continue with docs-only posture work for deferred lanes unless an accepted
implementation ADR or sequencing amendment authorizes more. Keep Q-013,
Q-014, and Q-015 implementation in the deferred Phase 2.7 queue until their
entry conditions are satisfied or a sequencing amendment is accepted.

## Change Log

| Version | Date | Change |
|---|---:|---|
| 0.2.1 | 2026-05-07 | Updated ADR 0042 references after human acceptance; Q-015 remains posture-only and implementation-blocked. |
| 0.2.0 | 2026-05-07 | Added Q-015 backup-readiness as a third deferred posture lane, linked the intake and proposed ADR 0042, expanded the lane matrix, and added backup-specific stop rules. |
| 0.1.0 | 2026-05-06 | Initial docs-only sequencing plan tying Q-013 and Q-014 deferred implementation lanes together after ADR 0040 and ADR 0041 acceptance. |
