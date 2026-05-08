---
title: Citadel readiness compatibility follow-up
category: research
component: host_capability_substrate
status: planning-input
version: 0.1.0
last_updated: 2026-05-07
tags: [citadel, compatibility-intake, runner-readiness, backup-readiness, alert-delivery, cross-repo-evidence, q-015]
priority: high
---

# Citadel Readiness Compatibility Follow-up

## Status

Compatibility and future-policy input only. This document normalizes two
Citadel updates delivered 2026-05-07 into HCS vocabulary. It does not make
Citadel an HCS operating authority, does not claim live readiness, and does
not authorize schema, ontology, policy, validator, adapter, dashboard, hook,
provider, runner, backup/restore, or runtime changes.

No sibling repo was inspected for this packet. The inputs are recorded as
external compatibility guidance for future HCS planning.

## Normalized Inputs

### Runner readiness remains pending structured

Citadel is developing a runner-readiness evidence template and phase gates.
HCS does not have an accepted `RunnerReadiness` entity or evidence subtype.
Future HCS work should treat runner readiness as a structured evidence
composition problem, not as a live fact from a design packet.

Likely composition inputs, pending future ADR review:

- Q-005 runner/check evidence such as `RunnerHostObservation`,
  `RunnerIsolationObservation`, `WorkflowRunReceipt`,
  `CleanRoomSmokeReceipt`, `ResourceBudgetObservation`, and
  `PolicyPlanReceipt`.
- Q-006 check-source and workflow-policy evidence, especially
  `StatusCheckSourceObservation`.
- Q-014 project-substrate admission evidence when a project contract consumes
  runner readiness.
- Q-015 backup-readiness evidence only when the runner-readiness template
  explicitly depends on backup posture.

Runner readiness remains distinct from backup readiness and from project
workload admission.

### Backup readiness lifecycle remains load-bearing

The backup-readiness state model remains:

```text
pending -> configured -> usable -> ready
```

HCS ADR 0045 already models this through
`BackupReadinessObservation.payload.readiness_state_kind`, with additional
accepted values `expired` and `unknown`. The state meanings remain strict:

- `configured`: target is reachable or initialized; not `usable`.
- `usable`: backup operations are succeeding under monitoring; not `ready`.
- `ready`: restore drill with boot/service verification is fresh and typed.
- `expired`: prior evidence aged out; not positive readiness.
- `unknown`: no positive readiness claim.

No host-local policy or ontology text should claim live readiness from
Citadel design packets.

### Alert-delivery evidence is future readiness input

Alert delivery is now an explicit future readiness-schema and policy input.
The accepted ADR 0045 schema has generic
`BackupReadinessObservation.payload.monitoring_evidence_refs`, but HCS has no
accepted alert-delivery evidence subtype, no freshness window, and no gate
policy for alert delivery.

Future work should distinguish:

- alert route declared;
- alert route configured;
- test alert delivered to an operator-visible surface;
- failure detected but no confirmed delivery;
- alert evidence expired or contradicted.

Alert delivery should prove the failure path works outside the failed host
where applicable. It must not be inferred from a monitoring configuration
document or a successful backup job alone.

### Backup artifact grain must stay distinct

Citadel calls out a separate concern that the backup artifact's grain matters.
HCS should not collapse file-level or metadata backup into VM/CT image backup.

Future schema or policy review may need a provider-neutral artifact-grain
field or evidence subtype. Candidate concepts for review, not accepted
ontology:

- file-level backup;
- metadata or configuration backup;
- VM image backup;
- container image backup;
- volume or filesystem snapshot;
- repository-level backup.

The existing provider-neutral `storage_class_kind` enum is not enough by
itself to prove the artifact grain that a readiness gate needs.

### Cross-repo evidence receipts are external facts

Citadel expects cross-repo evidence receipts across these surfaces:

- Citadel: admission standards, runner groups, selected repository access,
  and phase gates.
- `ci-runner`: runner-readiness packet or runner execution evidence.
- `runner-substrate`: Proxmox/Synology substrate and backup evidence.
- `HomeNetOps`: network, DNS, and route evidence that affects backup or alert
  delivery.
- `hetzner`: VPS restic, Storage Box, native rollback insurance, and
  server-side backup surfaces.

HCS should represent these through generic source references, evidence
references, `KnowledgeSource` inputs, and provider-neutral subject refs. Core
ontology must not bake Nash, Citadel, repo, vendor, or host-specific names
into enum values.

## HCS Fit

Current landed support:

- `BackupReadinessObservation` can record lifecycle state and cite restore,
  backup-operation, monitoring, credential-custody, threat-model, and project
  backup requirement evidence refs.
- `RestoreDrillReceipt` records restore drills with boot and service
  verification.
- `BackupCredentialCustodyObservation` records backup credential custody
  without resolved secret material.
- `ProjectSubstrateBackupRequirementObservation` records the backup-shaped
  slice of a project-substrate contract.
- `KnowledgeSource.source_kind: "threat_model"` can hold generic threat-model
  source material, not project-specific accepted-risk content in public
  fixtures or generated schemas.

Deferred support:

- no accepted `RunnerReadiness` schema;
- no accepted alert-delivery receipt or observation;
- no accepted backup artifact-grain discriminator;
- no accepted gate policy for runner readiness, backup readiness, alert
  delivery, or project-substrate readiness;
- no host-local policy claiming live readiness.

## Future Questions

1. Should runner readiness be a Q-005 follow-on, a Q-014 project-admission
   follow-on, or a separate Q-row?
2. Is alert delivery represented as a new evidence subtype, a monitoring
   receipt, or a stricter typed ref consumed by `BackupReadinessObservation`?
3. Does backup artifact grain belong on `BackupReadinessObservation`, on
   `RestoreDrillReceipt.source_artifact_ref`, or as a separate evidence
   record?
4. What freshness windows apply to runner-readiness phase gates, alert
   delivery tests, restore drills, and cross-repo receipts?
5. Which parser/provenance rules are required before cross-repo receipts can
   become gate-eligible evidence?

## Stop Rules

Stop and return to human review if a task tries to:

- add `RunnerReadiness`, alert-delivery, or backup artifact-grain ontology
  without a new accepted ADR or approved intake task;
- treat Citadel design packets as live HCS readiness evidence;
- claim a runner, backup target, alert route, VM/CT image, project workload,
  or host-local policy is live-ready without typed evidence and freshness;
- mutate Citadel, `ci-runner`, `runner-substrate`, `HomeNetOps`, `hetzner`, or
  `system-config` from the HCS repo;
- import Nash, Citadel, repo, provider, host, Synology, Proxmox, Hetzner, or
  Storage Box names into core ontology enums;
- collapse file/meta backup and VM/CT image backup into a single readiness
  fact;
- treat backup readiness as runner readiness or runner readiness as project
  workload admission.

## Change Log

| Version | Date | Change |
|---|---:|---|
| 0.1.0 | 2026-05-07 | Initial compatibility follow-up for runner readiness, backup readiness lifecycle, alert-delivery evidence, artifact-grain distinction, and cross-repo receipts. |
