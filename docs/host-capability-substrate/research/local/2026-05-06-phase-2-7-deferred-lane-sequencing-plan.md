# Phase 2.7 Deferred-Lane Sequencing Plan

Date: 2026-05-06

Status: deferred-lane sequencing plan. ADR 0043's first Q-013
schema/evidence slice has landed, ADR 0044's first Q-014 schema/evidence
slice has landed, and ADR 0045's first Q-015 schema/evidence slice has
landed. This document does not independently amend ADR 0038 or
authorize canonical policy YAML, runtime/live validators, adapters, dashboard
routes, hooks, broker/runtime behavior, runner registration, Proxmox changes,
Hetzner changes, OpenTofu changes, service-account creation, machine-identity
issuance, backup execution, restore execution, project workload provisioning,
provider mutation, operation registration, Q-014 work beyond ADR 0044, or
Q-015 work beyond ADR 0045.

## Purpose

ADR 0038 accepts the Phase 2.1-2.6 schema landing train. ADR 0040, ADR 0041,
and ADR 0042 accept three posture lanes that are outside that train:

- Q-013 credential-plane implementation, with the v1 schema/evidence slice
  accepted by ADR 0043 and landed on 2026-05-07.
- Q-014 project-substrate contract validation and admission evidence, with the
  v1 schema/evidence slice accepted by ADR 0044 and landed on 2026-05-07.
- Q-015 backup-readiness and restore-drill evidence posture, with the v1
  schema/evidence slice accepted by ADR 0045 and landed on 2026-05-07.

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
- Accepted Q-014 implementation ADR:
  `docs/host-capability-substrate/adr/0044-q-014-project-substrate-implementation.md`
- Q-015 intake:
  `docs/host-capability-substrate/research/local/2026-05-06-q-015-backup-readiness-intake.md`
- Q-015 lane plan:
  `docs/host-capability-substrate/research/local/2026-05-07-q-015-implementation-lane-plan.md`
- Accepted Q-015 implementation ADR:
  `docs/host-capability-substrate/adr/0045-q-015-backup-readiness-implementation.md`

## Sequencing Rule

Default order:

1. Finish Phase 2.1-2.6 as accepted by ADR 0038. Completed before ADR 0043
   acceptance.
2. Accept a Q-013 implementation ADR. Completed by ADR 0043 for the v1
   schema/evidence slice only.
3. Land ADR 0043 implementation evidence needed for credential-source and
   machine-identity validation. Completed by the v1 schema/evidence slice.
4. Open and accept a Q-014 implementation ADR. Completed by ADR 0044 for the
   first schema/evidence slice only.
5. Land Q-014 contract-validation and admission-evidence shapes per ADR 0044.
   Completed by the v1 schema/evidence slice.
6. Open and accept a Q-015 implementation ADR only after Q-013 and Q-014
   implementation evidence exists and backup/readiness remains a real
   independent evidence need. Completed by ADR 0045 for the first
   schema/evidence slice only.
7. Land Q-015 backup-readiness, restore-drill, credential-custody, and
   project-backup-requirement shapes per ADR 0045. Completed by the v1
   schema/evidence slice.
8. Open selected-repository-access, workflow-policy-check, or dashboard
   follow-on lanes only if their evidence dependencies remain real after
   Q-013, Q-014, and Q-015 implementation.

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
| Q-014 project substrate | Landed on 2026-05-07 via ADR 0044 | `project_substrate_contract` source-kind implementation, `project_admission_authority` boundary branch, contract-validation receipt, admission observation, teardown receipts | ADR 0044 deliberately defers `QualityGate.gate_kind: "project_substrate_admission"` to a future policy/gate lane. It composes with ADRs 0036, 0035, 0034, 0032, 0033, 0040, 0041, and the landed ADR 0043 evidence shapes. |
| Q-015 backup readiness | Landed on 2026-05-07 via ADR 0045 | `BackupReadinessObservation`, `RestoreDrillReceipt`, `BackupCredentialCustodyObservation`, `ProjectSubstrateBackupRequirementObservation`, generic `KnowledgeSource.source_kind: "threat_model"`, and `KnowledgeSource.schema_version` `0.2.0` | Policy/runtime/gate/provider work remains blocked behind future ADRs or policy lanes. Preserve `pending` -> `configured` -> `usable` -> `ready` with optional `expired`; restore drill with boot/service verification is the promotion gate to `ready`; keep runner-substrate Proxmox/Synology evidence separate from Hetzner VPS restic / Storage Box evidence. |
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
- expand Q-014 beyond ADR 0044's accepted schema/evidence slice without a
  follow-on ADR or policy lane;
- expand Q-015 beyond ADR 0045's accepted schema/evidence slice without a
  follow-on ADR or policy lane;
- treat this plan as policy, runtime, broker, runner, Proxmox, Hetzner,
  OpenTofu, machine-identity, backup execution, restore execution, project
  workload authority, or schema authority beyond ADR 0045's accepted slice;
- mutate `system-config`, Citadel, GitHub runner groups, selected repository
  access, Proxmox state, OpenTofu state, vault state, or service-account state
  from the HCS repo;
- treat credential-source labels, contract lifecycle status, or
  `guardian_approval` as gate authority by themselves;
- store resolved secret material in HCS docs, schemas, fixtures, generated
  JSON Schema, policy snapshots, logs, or audit artifacts;
- collapse Citadel or project-owned YAML into HCS live policy;
- describe a backup layer as `ready` without freshness-bound restore-drill
  evidence with boot/service verification;
- conflate runner-substrate Proxmox/Synology backup evidence with Hetzner VPS
  restic / Storage Box evidence.

## Next Safe Action

Keep Q-014 and Q-015 runtime, gate-kind, provider, runner, policy, dashboard,
adapter, hook, and broader schema work blocked without a follow-on accepted
ADR or policy lane. The next safe action is reviewer cleanup and verification
for the landed ADR 0045 schema/evidence slice, not provider or execution work.

## Change Log

| Version | Date | Change |
|---|---:|---|
| 0.4.5 | 2026-05-07 | Recorded ADR 0045 schema/evidence landing and moved Q-015 follow-on policy/runtime/gate/provider work back to blocked posture. |
| 0.4.4 | 2026-05-07 | Added proposed ADR 0045 as the Q-015 implementation ADR draft and moved Q-015 from dependency-waiting to reviewer-deliberation posture while keeping implementation blocked. |
| 0.4.3 | 2026-05-07 | Recorded ADR 0044 schema/evidence landing and moved the next safe action to blocked follow-on lanes plus future Q-015 implementation-ADR review. |
| 0.4.2 | 2026-05-07 | Updated after ADR 0044 acceptance; Q-014 schema/evidence implementation may open for the accepted slice only. |
| 0.4.1 | 2026-05-07 | Added proposed ADR 0044 as the Q-014 implementation ADR draft and clarified that Q-014 schema/runtime work remains blocked pending acceptance. |
| 0.4.0 | 2026-05-07 | Recorded ADR 0043 v1 schema/evidence landing and moved the next downstream lane to Q-014 implementation ADR planning. |
| 0.3.0 | 2026-05-07 | Updated after ADR 0043 acceptance; Q-013 v1 schema/evidence implementation opens while Q-014/Q-015 and runtime/provider/policy work remain blocked. |
| 0.2.4 | 2026-05-07 | Added proposed ADR 0043 as the Q-013 implementation ADR input without changing implementation authority. |
| 0.2.3 | 2026-05-07 | Added the Q-015 implementation-lane plan as an input while keeping Q-015 implementation blocked. |
| 0.2.2 | 2026-05-07 | Added Q-015 surfaces to the planning-only status block and generalized the acceleration rule to all three deferred lanes. |
| 0.2.1 | 2026-05-07 | Updated ADR 0042 references after human acceptance; Q-015 remains posture-only and implementation-blocked. |
| 0.2.0 | 2026-05-07 | Added Q-015 backup-readiness as a third deferred posture lane, linked the intake and proposed ADR 0042, expanded the lane matrix, and added backup-specific stop rules. |
| 0.1.0 | 2026-05-06 | Initial docs-only sequencing plan tying Q-013 and Q-014 deferred implementation lanes together after ADR 0040 and ADR 0041 acceptance. |
