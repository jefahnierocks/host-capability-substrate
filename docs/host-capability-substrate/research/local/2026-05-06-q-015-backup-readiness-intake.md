---
title: Q-015 backup-readiness substrate-contract intake
category: research
component: host_capability_substrate
status: planning-input
version: 0.2.0
last_updated: 2026-05-07
tags: [backup-readiness, restore-drill, storage-class, project-substrate, runner-substrate, hetzner, citadel, boundary-observation, quality-gate, q-015]
priority: high
---

# Q-015 Backup-Readiness Substrate-Contract Intake

## Status

Planning input only. This document captures an external advisor directive
delivered 2026-05-06 on backup/readiness posture as HCS-facing substrate
contract requirements. It does not authorize Zod schemas, generated JSON
Schema, ontology promotions, registry entries, canonical policy YAML,
validators, adapters, dashboard routes, hooks, runner registration, Proxmox
changes, OpenTofu changes, machine-identity issuance, project workload
provisioning, broker behavior, or runtime changes. No HCS facts are minted
from this document.

This document does not amend ADR 0038. Q-015 implementation, if subsequently
accepted, opens as a Phase 2.7 / Wave-2 lane behind Q-013 (ADR 0040) and
Q-014 (ADR 0041), or under a separately accepted sequencing amendment.

## Source

External advisor directive, 2026-05-06. Verbatim payload preserved in
§Advisor directive (verbatim) below.

Follow-up Citadel compatibility updates, 2026-05-07. Normalized follow-up:
`docs/host-capability-substrate/research/local/2026-05-07-citadel-readiness-compatibility-followup.md`.

## Framing

The advisor goal is for HCS to model the evidence and authority pattern that
project repos will eventually consume for backup readiness, without taking
over live execution.

HCS posture, restated against existing substrate ownership:

- HCS is the typed evidence / contract consumer. HCS does not own backup
  execution, restore execution, runner registration, or project workload
  admission.
- `runner-substrate` owns the physical Proxmox substrate and Synology backup
  evidence. `runner-substrate` PR #3 is the active backup-readiness procedure
  / evidence packet at intake time.
- `hetzner` repo owns VPS-side restic / Storage Box / Layer A+B implementation.
- Citadel owns GitHub runner groups, selected-repository access, workflow
  policy, and admission standards.
- `HomeNetOps` owns network/DNS-adjacent backup paths.
- `system-config` owns transitional host-local policy translation and
  generated snapshots.
- Project repos own their backup contract / declarations.

The Phase 2.7 deferred-lane sequencing plan (`docs/host-capability-substrate/research/local/2026-05-06-phase-2-7-deferred-lane-sequencing-plan.md`,
§Lane Dependency Matrix) already names the backup/restore follow-on as a
downstream lane with candidate entities `BackupReadinessObservation` and
`RestoreExpectationReceipt`. This intake provides the specific structure that
placeholder lacked.

## Vocabulary discipline (advisor input)

These vocabulary rules are load-bearing and must survive into any future ADR
or schema unchanged in substance:

- A backup target reachable is `configured`, not `usable`.
- A backup succeeding is `usable`, not `ready`.
- A restore drill with boot/service verification is required for `ready`.
- Expired evidence demotes readiness.
- Hetzner native Backups are rollback insurance, not durable backup.
- Hetzner Storage Box / restic is VPS backup, not Proxmox Synology readiness.
- Synology NFS for runner-substrate is backup-only storage, not VM disk
  storage.
- Backup readiness does not imply runner readiness.
- Runner readiness does not imply project workload admission.

## Follow-up compatibility intake (2026-05-07)

Citadel provided additional compatibility guidance after ADR 0045 landed. HCS
tracks it as future-policy and future-schema input only:

- Runner readiness remains a pending structured evidence concept. HCS has no
  accepted `RunnerReadiness` entity or evidence subtype.
- The backup readiness lifecycle remains `pending` -> `configured` ->
  `usable` -> `ready`, with `expired` and `unknown` represented in the
  accepted ADR 0045 schema.
- Alert-delivery evidence is a future readiness-schema and policy input. The
  current schema has generic `monitoring_evidence_refs`, but no accepted
  alert-delivery receipt, observation, freshness window, or gate policy.
- File-level or metadata backup must stay distinct from VM/CT image backup.
  Current `storage_class_kind` is provider-neutral storage classification; it
  is not sufficient by itself to prove artifact grain.
- Cross-repo evidence receipts may arrive from Citadel, `ci-runner`,
  `runner-substrate`, `HomeNetOps`, and `hetzner`, but HCS core ontology must
  keep provider-neutral names and consume those as generic source/evidence
  refs.
- No HCS docs, policy, ontology, schemas, or runtime claims should describe
  live readiness from design packets alone.

## Lifecycle states (advisor input)

Storage-class readiness lifecycle:

```
pending → configured → usable → ready
                                  └→ expired (optional, demoted)
```

State transitions:

- `pending`: storage class declared, not provisioned.
- `configured`: target reachable; transport, credentials, mount, or repo
  initialization succeeded.
- `usable`: backup operations succeeding under monitoring.
- `ready`: restore drill with boot/service verification has succeeded within
  evidence-freshness window.
- `expired`: prior `ready` state where the evidence freshness window has
  elapsed without renewal.

Restore drill is the promotion gate from `usable` → `ready`. Reaching
`configured` or `usable` does not authorize `ready` claims.

## Candidate entity / receipt names (advisor input; not ontology-reviewed)

The advisor proposed these names. They are recorded verbatim here for
synthesis. Q-011 naming-suffix discipline (registry §Naming suffix
discipline) will rename them at ADR review time:

| Advisor name | Likely Q-011-discipline rename | Q-011 bucket |
|---|---|---|
| `BackupReadinessEvidence` | `BackupReadinessObservation` (matches Phase 2.7 placeholder) or `BackupReadinessReceipt` if event-shaped | Evidence subtype |
| `StorageClassReadiness` | `StorageClassReadiness` (no suffix) if standalone Ring 0 entity, or `StorageClassReadinessObservation` if observation-shaped | Standalone Ring 0 entity OR Evidence subtype |
| `RestoreDrillEvidence` | `RestoreDrillReceipt` (event-shaped) | Evidence subtype |
| `BackupLayerThreatModel` | `BackupLayerThreatModel` (no suffix) if standalone, or chunk-shaped under `KnowledgeSource` | Standalone Ring 0 entity OR Layer 2 KnowledgeChunk |
| `BackupCredentialCustody` | `BackupCredentialCustody` (no suffix) if standalone, or `BackupCredentialCustodyObservation` | Standalone Ring 0 entity OR Evidence subtype |
| `BackupMonitoringRequirement` | `BackupMonitoringRequirement` (no suffix) if declarative, may be chunk-shaped | Standalone Ring 0 entity OR Layer 2 KnowledgeChunk |
| `ProjectSubstrateBackupRequirement` | `ProjectSubstrateBackupRequirement` (no suffix), composes with Q-014 contract validation | Standalone Ring 0 entity OR project-substrate-contract chunk |

The bucket assignments are advisory pending hcs-ontology-reviewer pass. The
final shape may be a mix of standalone entities and evidence subtypes.

## Required field shapes (advisor input)

`RestoreDrillEvidence` (advisor-named):

- source artifact reference
- restore target reference
- restored environment reference
- boot / service verification record
- RTO (recovery time objective)
- RPO (recovery point objective)
- runbook revision reference
- cleanup disposition record
- evidence expiration

`BackupLayerThreatModel` (advisor-named):

- `protects_against`
- `does_not_protect_against`
- trust boundary reference
- accepted risks list

`BackupCredentialCustody` (advisor-named):

- runtime read pattern reference
- break-glass recovery path reference
- secret reference only (composes with ADR 0040 / `SecretReference`)
- no secret material in the entity body

`BackupMonitoringRequirement` (advisor-named):

- success heartbeat declaration
- failure route declaration
- maximum silent-failure window
- log location outside the failed host where applicable

`ProjectSubstrateBackupRequirement` (advisor-named):

- whether persistent data exists
- required backup class
- required restore evidence before active use
- RPO / RTO expectation
- data minimization / exclude posture
- teardown and retention expectations
- evidence reference and expiration

These field names are advisor-asserted. Final fields require composition with
existing ADR 0034 / ADR 0035 freshness-and-execution-context discipline,
ADR 0036 layered-knowledge composition, ADR 0040 credential-source posture,
and ADR 0041 project-substrate contract validation.

## Project-contract composition (advisor input)

A future project contract must declare:

- whether persistent data exists
- required backup class
- required restore evidence before active use
- RPO / RTO expectation
- data minimization / exclude posture
- teardown and retention expectations
- evidence reference and expiration

Default dev-infra posture: modest, e.g. daily RPO and 1–4 hour RTO, but
declared. Rebuildable / ephemeral projects may waive backup readiness only
if the contract explicitly says data is disposable and teardown is proven.

This composes with Q-014 `ProjectSubstrateContractValidationReceipt` and
`ProjectSubstrateAdmissionObservation` posture from ADR 0041.

## Source ownership split

| Concern | Owner | HCS role |
|---|---|---|
| Proxmox host substrate, Synology backup evidence | `runner-substrate` | Typed evidence consumer; not provisioner |
| VPS restic / Storage Box / Layer A+B | `hetzner` | Typed evidence consumer; not provisioner |
| GitHub runner groups, repo access, workflow policy, admission standards | Citadel | Typed evidence consumer; not control-plane mutator |
| Network / DNS-adjacent backup paths | `HomeNetOps` | Typed evidence consumer |
| Host-local policy translation, generated snapshots | `system-config` | Read-only consumer of generated snapshots |
| Project backup contract / declaration | Project repos | Typed validation consumer |
| Backup credential custody contract | `runner-substrate` / `hetzner` / project repos | Composes with ADR 0040 credential-source posture |

HCS does not own backup execution, restore execution, or any of the upstream
substrates. HCS provides typed evidence and gating posture for downstream
admission decisions.

## Composition with existing accepted ADRs

- ADR 0015 (external control-plane automation): backup/restore mutations on
  upstream substrates are external control-plane evidence, not HCS-mutating
  operations.
- ADR 0022 (BoundaryObservation): future backup-readiness evidence may use
  boundary-dimension framing for storage-class readiness or trust-boundary
  posture if registry review accepts it.
- ADR 0034 / inv. 19 (boundary claims freshness- and execution-context-bound):
  every restore-drill receipt and backup-readiness observation must carry
  freshness and execution-context binding.
- ADR 0035 (QualityGate): future `gate_kind: "backup_readiness"` and
  `gate_kind: "project_substrate_admission"` may consume backup evidence.
  Lifecycle status alone never passes the gate.
- ADR 0036 (workspace manifest projection): backup contract YAML and threat
  model documents are Layer 2 `KnowledgeSource` inputs; gate-eligible facts
  must be typed validation evidence citing both contract source and Layer 1
  operational evidence.
- ADR 0040 (Q-013 credential plane): `BackupCredentialCustody` composes with
  `CredentialSource` and broker contract; resolved secrets stay out of HCS
  state.
- ADR 0041 (Q-014 project-substrate contract): `ProjectSubstrateBackupRequirement`
  is the backup-shaped slice of the project-substrate contract; admission
  depends on backup readiness when the contract declares persistent data.

## Stop rules

Stop and return to human review if a task tries to:

- start Q-015 schema, registry, validator, adapter, dashboard, hook, policy,
  or runtime implementation before a follow-on implementation ADR is accepted;
- edit `runner-substrate`, `hetzner`, Citadel, `HomeNetOps`, or `system-config`
  from this repo;
- read or store secrets in HCS state, fixtures, snapshots, logs, or audit
  artifacts;
- run provider actions, register runners, or create project workloads;
- promote upstream design documents to live HCS facts without typed evidence
  references;
- describe any backup layer as live-ready without typed restore-drill evidence;
- collapse the `pending` → `configured` → `usable` → `ready` lifecycle into
  fewer states or treat reachable as usable, succeeding as ready, or any
  state without a restore drill as ready;
- treat `runner-substrate` Synology readiness and Hetzner VPS backup as the
  same fact;
- treat backup readiness as runner readiness or runner readiness as project
  workload admission;
- mint Q-015 evidence without freshness binding, execution-context binding,
  or authority discipline;
- duplicate `runner-substrate`, `hetzner`, or Citadel policy into HCS canonical
  policy YAML.

## Entry conditions for implementation lane

A future Q-015 implementation lane should not open until all of these are
true:

- Phase 2.1–2.6 schema train completes per ADR 0038, or a separate sequencing
  amendment explicitly changes that order.
- Q-013 (ADR 0040) implementation lands the credential-source and machine-
  identity evidence dependencies needed by `BackupCredentialCustody`.
- Q-014 (ADR 0041) implementation lands `ProjectSubstrateContractValidationReceipt`
  and `ProjectSubstrateAdmissionObservation` so backup composes onto an
  existing contract entity.
- A follow-on implementation ADR is accepted for Q-015 schema scope, including
  registry changes, Zod source, generated JSON Schema, fixtures, docs, and
  tests.
- Reviewer dispatch is planned for `hcs-architect`, `hcs-ontology-reviewer`,
  `hcs-policy-reviewer`, and `hcs-security-reviewer`.

## Next safe action

Continue Q-010 (remote-agent receipts; Phase 2.3.4) per the accepted ADR 0038
landing sequence. Q-015 stays in the Phase 2.7 / Wave-2 deferred queue until
its entry conditions are satisfied or a sequencing amendment is accepted. The
next docs-only Q-015 action, when scheduled, is to update the Phase 2.7
deferred-lane sequencing plan with this intake's specific structure, then
draft a Q-015 posture-only ADR for reviewer dispatch.

## Advisor directive (verbatim)

The directive is preserved verbatim below as the source-of-truth for any
later synthesis. Vocabulary, names, and field shapes above are derived from
this text but rephrased into HCS framing; the verbatim text governs intent.

> Goal: absorb the backup/readiness posture as HCS-facing substrate contract
> requirements, without taking over live execution. HCS should model the
> evidence and authority pattern that project repos will eventually consume.
>
> Current upstream facts to account for:
> - runner-substrate owns the physical Proxmox substrate and Synology backup
>   evidence.
> - runner-substrate PR #3 is the active backup-readiness procedure/evidence
>   packet.
> - Synology Red-spindle target is currently `configured`, not `usable` or
>   `ready`.
> - No runner registration or project workloads are authorized.
> - Hetzner VPS backup work is separate: Hetzner repo owns VPS-side
>   restic/Storage Box/Layer A+B implementation.
> - Citadel owns GitHub runner groups, selected-repository access, workflow
>   policy, and admission standards.
> - HCS should become the typed evidence/contract consumer, not the live
>   provider executor.
>
> Required HCS posture:
> - Do not describe any backup layer as live-ready without evidence.
> - Preserve `pending -> configured -> usable -> ready` as explicit lifecycle
>   states.
> - Treat restore evidence as the promotion gate from `usable` to `ready`.
> - Treat backup readiness as necessary but not sufficient for runner/project
>   admission.
> - Keep source ownership explicit: `runner-substrate`, `hetzner`,
>   `HomeNetOps`, `system-config`, `Citadel`, and project repos each own
>   different surfaces.
>
> Model requirements to add or refine:
> - `BackupReadinessEvidence` or equivalent HCS entity.
> - `StorageClassReadiness` with states:
>   - `pending`
>   - `configured`
>   - `usable`
>   - `ready`
>   - optionally `expired`
> - `RestoreDrillEvidence` with:
>   - source artifact
>   - restore target
>   - restored environment
>   - boot/service verification
>   - RTO
>   - RPO
>   - runbook revision
>   - cleanup disposition
>   - evidence expiration
> - `BackupLayerThreatModel` with:
>   - protects_against
>   - does_not_protect_against
>   - trust_boundary
>   - accepted_risks
> - `BackupCredentialCustody` with:
>   - runtime read pattern
>   - break-glass recovery path
>   - secret reference only
>   - no secret material
> - `BackupMonitoringRequirement` with:
>   - success heartbeat
>   - failure route
>   - maximum silent-failure window
>   - log location outside the failed host where applicable
> - `ProjectSubstrateBackupRequirement` tying project admission to declared
>   storage/backup class and evidence freshness.
>
> Vocabulary constraints:
> - A backup target being reachable is `configured`, not `usable`.
> - A backup succeeding is `usable`, not `ready`.
> - A restore drill with boot/service verification is required for `ready`.
> - Expired evidence demotes readiness.
> - Hetzner native Backups are rollback insurance, not durable backup.
> - Hetzner Storage Box/restic is VPS backup, not Proxmox Synology readiness.
> - Synology NFS for runner-substrate is backup-only storage, not VM disk
>   storage.
> - Backup readiness does not imply runner readiness.
> - Runner readiness does not imply project workload admission.
>
> Project contract implications:
> - Project contracts must declare:
>   - whether persistent data exists;
>   - required backup class;
>   - required restore evidence before active use;
>   - RPO/RTO expectation;
>   - data minimization/exclude posture;
>   - teardown and retention expectations;
>   - evidence reference and expiration.
> - Default dev-infra posture can be modest, e.g. daily RPO and 1-4 hour RTO,
>   but it must be declared.
> - Rebuildable/ephemeral projects may waive backup readiness only if the
>   contract explicitly says data is disposable and teardown is proven.
>
> Boundary rules:
> - Do not edit runner-substrate, Hetzner, Citadel, HomeNetOps, or
>   system-config from HCS unless explicitly instructed.
> - Do not read or store secrets.
> - Do not run provider actions.
> - Do not register runners.
> - Do not create project workloads.
> - Do not convert upstream design docs into live HCS facts without evidence
>   references.
>
> Recommended first HCS packet:
> 1. Inspect current HCS schema/docs startup surfaces.
> 2. Add or update backup readiness ontology/schema docs.
> 3. Add example evidence snippets using redacted, non-secret references only.
> 4. Add project contract guidance that consumes these readiness states.
> 5. Keep all upstream repo references as contextual source refs, not
>    ownership claims.
> 6. Run `just verify`.

## Note on the recommended first packet

The advisor's recommended first packet (steps 1–6 above) is partially executed
by this intake document, `PLAN.md` Q-015 stub, and `DECISIONS.md` Q-015 row.
It is not executed as ontology / schema
edits, registry edits, example evidence snippets, or project-contract guidance
in `docs/host-capability-substrate/`. Those steps are blocked behind a
follow-on implementation ADR per Phase 2.7 sequencing rules (ADR 0038, ADR 0040,
ADR 0041, and the deferred-lane sequencing plan). Executing them now would
skip ADR-first review and the accepted Phase 2.1–2.6 schema train.

## Change log

| Version | Date | Change |
|---|---:|---|
| 0.2.0 | 2026-05-07 | Added Citadel follow-up compatibility guidance for runner readiness, alert delivery, artifact grain, and cross-repo evidence receipts. |
| 0.1.0 | 2026-05-06 | Initial intake; advisor directive captured verbatim; HCS framing applied; implementation deferred to Phase 2.7 / Wave-2 lane. |
