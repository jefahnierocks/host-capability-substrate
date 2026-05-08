# Q-015 Implementation Lane Plan

Date: 2026-05-07

Status: schema slice landed. ADR 0045 accepted the narrow Q-015
schema/evidence implementation slice, and that slice has landed. This
document does not authorize canonical policy YAML, validators, adapters,
dashboard routes, hooks, runner registration, Proxmox changes, Hetzner
changes, OpenTofu changes,
machine-identity issuance, backup execution, restore execution, project
workload provisioning, broker behavior, runtime behavior, provider actions,
or operation registration.

## Authority

Accepted posture:

- ADR 0042:
  `docs/host-capability-substrate/adr/0042-q-015-backup-readiness-posture.md`
- Decision ledger: `DECISIONS.md` Q-015
- Plan entry: `PLAN.md` Q-015 backup-readiness substrate-contract posture
- Q-015 intake:
  `docs/host-capability-substrate/research/local/2026-05-06-q-015-backup-readiness-intake.md`
- Phase 2.7 deferred-lane sequencing:
  `docs/host-capability-substrate/research/local/2026-05-06-phase-2-7-deferred-lane-sequencing-plan.md`
- Accepted Q-015 implementation ADR:
  `docs/host-capability-substrate/adr/0045-q-015-backup-readiness-implementation.md`

ADR 0042 closes Q-015 at posture level only. Q-013 v1 schema/evidence landed
via ADR 0043, and Q-014 v1 schema/evidence landed via ADR 0044. ADR 0045
accepted the Q-015 schema/evidence scope, which landed as Ring 0 schema
source, generated JSON Schema, ontology/registry docs, and focused tests.

## Accepted Shape

HCS models backup readiness as typed evidence and contract-consumption
posture. HCS does not own backup execution, restore execution, upstream
storage substrates, runner registration, or project workload admission.

The storage-class readiness lifecycle is:

```text
pending -> configured -> usable -> ready
                                -> expired
                                -> unknown
```

The lifecycle is load-bearing:

- `configured` means the backup target is reachable or initialized. It is not
  `usable`.
- `usable` means backup operations are succeeding under monitoring. It is not
  `ready`.
- `ready` requires a restore drill with boot/service verification inside the
  evidence-freshness window.
- `expired` demotes prior readiness when restore-drill evidence ages out.
- `unknown` is not positive readiness.

The landed schema requires proof-bearing nested evidence refs to exclude
`sandbox-observation`, carry non-null `valid_until`, carry `parser_version`,
and include typed `payload_schema_version` when a specific Q-013/Q-014/Q-015
subtype is the load-bearing referenced record. Future policy or kernel
consumers must still dereference restore-drill refs and verify the referenced
record's type, freshness, boot verification, service verification, and
contradictions before treating `ready` as positive admission or gate evidence.

Accepted v1 names from ADR 0045:

- `BackupReadinessObservation`
- `RestoreDrillReceipt`
- `BackupCredentialCustodyObservation`
- `ProjectSubstrateBackupRequirementObservation`
- `KnowledgeSource.source_kind: "threat_model"`

Backup contract YAML, backup requirement declarations, recovery runbooks, and
threat-model documents may compose as ADR 0036 Layer 2 `KnowledgeSource`
inputs in a future implementation lane. Gate-eligible facts must be typed
evidence that cites both source material and Layer 1 operational evidence.

## Entry Conditions

Q-015 schema implementation opened only after all of these became true:

- Phase 2.1-2.6 schema train completed per ADR 0038.
- Q-013 implementation landed the credential-source and machine-identity
  evidence dependencies needed by backup credential custody via ADR 0043.
- Q-014 implementation lands the project-substrate contract validation and
  admission evidence that project backup requirements can cite. Completed by
  ADR 0044's v1 schema/evidence slice.
- Backup/readiness remains an independent evidence need after Q-014
  implementation review.
- A Q-015 implementation ADR is accepted for schema scope, including
  registry changes, Zod source, generated JSON Schema, fixtures, docs, and
  tests. Completed by ADR 0045.
- Reviewer dispatch completes for `hcs-architect`,
  `hcs-ontology-reviewer`, `hcs-policy-reviewer`, and
  `hcs-security-reviewer`. Completed for ADR 0045.

## Landed Work Package and Deferred Follow-ups

1. Schema implementation. Completed by the ADR 0045 schema/evidence landing:
   `BackupReadinessObservation`, `RestoreDrillReceipt`,
   `BackupCredentialCustodyObservation`,
   `ProjectSubstrateBackupRequirementObservation`, and
   `KnowledgeSource.source_kind: "threat_model"`.

2. Shape triage. Completed for v1: no standalone `StorageClassReadiness`
   entity and no `boundary_dimension: "backup_readiness"` branch. Reopen only
   if direct evidence observations cannot remain the single fact home.

3. Restore-drill receipt. Completed for v1 as event-shaped evidence with
   source artifact reference, restore target reference, restored environment
   reference, boot / service verification record, RTO, RPO, runbook revision
   reference, cleanup disposition record, evidence expiration, provenance, and
   execution-context binding. `restored_environment_ref` must be a typed
   provider/object reference, never an inline payload, file dump, or
   environment dump.

4. Backup readiness observation. Completed for v1 as a lifecycle observation
   that does not make lifecycle status gate authority by itself. Evidence refs
   must include freshness-bound restore-drill receipts for `ready`.

5. Backup credential custody. Completed for v1 as a `CredentialSource`
   composition record. Secret fields are reference-only. Break-glass recovery
   path material is a `KnowledgeSource` reference, not an inline procedure
   body.

6. Project substrate backup requirement. Completed for v1 as a composition
   record over ADR 0041/0044 contract validation and admission observations.
   Capture whether persistent data exists, required backup class, required
   restore evidence before active use, RPO/RTO expectation, data-minimization
   posture, teardown and retention expectation, evidence refs, and expiration.

7. Threat model and monitoring requirements.
   Decide whether `BackupLayerThreatModel` and
   `BackupMonitoringRequirement` are standalone entities, evidence subtypes,
   or ADR 0036 source/chunk projections. Public HCS schemas may carry generic
   shape; project-specific accepted-risk content must not be embedded in
   public fixtures or generated schemas.

8. Gate composition.
   Define whether `QualityGate.gate_kind: "backup_readiness"` is needed and
   how it composes with `project_substrate_admission`. Freshness-window
   durations remain policy-owned.

9. Generic vocabulary.
   Storage and backup class enums must be generic. Brand/provider names such as
   Hetzner, Synology, Proxmox, and Storage Box belong in owning repos or
   `system-config`, not HCS core ontology.

10. Regression traps.
   Add traps for the failure classes listed below once the eval fixture lane
   opens for Q-015.

## Regression Trap Queue

Future eval fixtures should cover:

- Reachability promoted from `configured` to `usable`.
- Successful backup jobs promoted from `usable` to `ready` without restore
  drill evidence.
- Expired restore-drill evidence treated as still ready.
- Hetzner native Backups treated as durable backup evidence.
- Hetzner Storage Box / restic readiness conflated with Proxmox Synology
  readiness.
- Synology NFS backup storage treated as VM disk storage.
- Backup readiness treated as runner readiness.
- Runner readiness treated as project workload admission.
- Backup lifecycle status treated as QualityGate authority by itself.
- `BackupCredentialCustody` storing inline recovery procedure text or resolved
  secret material.
- `RestoreDrillReceipt.restored_environment_ref` storing inline restored data,
  file dumps, or environment dumps.
- Brand-specific storage class enum names imported into HCS ontology.
- Stale "backup retired" or teardown tombstone evidence promoted to positive
  readiness.
- `BackupLayerThreatModel.accepted_risks` copied into public HCS fixtures,
  generated schemas, or policy snapshots as project-specific content.

## Stop Rules

Stop and return to human review if a task tries to:

- start additional Q-015 schema, registry, validator, adapter, dashboard,
  hook, policy, fixture, broker, runtime, backup execution, or restore
  execution beyond ADR 0045's accepted schema/evidence slice before a
  follow-on implementation ADR is accepted;
- mutate `runner-substrate`, `hetzner`, Citadel, `HomeNetOps`, `system-config`,
  Proxmox, Hetzner, OpenTofu, GitHub runner groups, selected repository access,
  vault state, or project workload state from the HCS repo;
- describe any backup layer as `ready` without freshness-bound restore-drill
  evidence with boot/service verification;
- collapse `pending`, `configured`, `usable`, and `ready` into fewer states;
- treat backup readiness as runner readiness or runner readiness as project
  workload admission;
- store resolved secret material in HCS docs, schemas, fixtures, generated
  JSON Schema, policy snapshots, logs, audit artifacts, or contract chunks;
- duplicate upstream backup, runner, Hetzner, Citadel, or project policy into
  HCS canonical policy YAML;
- import brand/provider storage-class names into HCS core ontology.

## Next Safe Action

Future Q-015 work requires a separate accepted ADR or policy lane. Leave
runtime, policy, provider, dashboard, adapter, hook, backup/restore execution,
monitoring, and gate behavior blocked.

## Change Log

| Version | Date | Change |
|---|---:|---|
| 0.5.1 | 2026-05-07 | Added reviewer-cleanup notes for proof-bearing nested evidence refs and future cross-record readiness checks. |
| 0.5.0 | 2026-05-07 | Recorded the ADR 0045 schema/evidence landing and kept all runtime, policy, provider, monitoring, dashboard, adapter, hook, backup/restore execution, and gate behavior out of scope. |
| 0.4.0 | 2026-05-07 | Recorded ADR 0045 acceptance after reviewer pass and human approval; Q-015 schema/evidence implementation slice is now authorized while runtime/policy/provider/gate work remains blocked. |
| 0.3.0 | 2026-05-07 | Added proposed ADR 0045 as the Q-015 implementation ADR draft and recorded that Q-013/Q-014 dependencies exist while Q-015 implementation remains blocked pending reviewer pass and human acceptance. |
| 0.2.0 | 2026-05-07 | Updated after ADR 0043 schema/evidence landing; Q-015 remains blocked behind Q-014 implementation evidence. |
| 0.1.0 | 2026-05-07 | Initial docs-only implementation-lane plan following ADR 0042 acceptance. |
