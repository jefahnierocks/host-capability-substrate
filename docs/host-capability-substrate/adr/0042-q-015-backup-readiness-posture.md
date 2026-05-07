---
adr_number: 0042
title: Q-015 backup-readiness posture
status: accepted
date: 2026-05-07
charter_version: 1.4.0
tags: [backup-readiness, restore-drill, storage-class, project-substrate, credential-source, boundary-observation, quality-gate, q-015, phase-2]
---

# ADR 0042: Q-015 backup-readiness posture

## Status

accepted

Accepted on 2026-05-07 by human approval. This ADR closes Q-015 at the posture
layer only. It does not authorize Zod schema source, generated JSON Schema,
registry entries, canonical policy YAML, validators, adapters, dashboard
routes, hooks, runner registration, Proxmox changes, Hetzner changes,
OpenTofu changes, machine-identity issuance, backup execution, restore
execution, project workload provisioning, broker behavior, or runtime
behavior.

Follow-on implementation work still requires a separate accepted
implementation ADR and reviewer dispatch for:

- `hcs-architect`
- `hcs-ontology-reviewer`
- `hcs-policy-reviewer`
- `hcs-security-reviewer`

## Date

2026-05-07 (proposed); 2026-05-07 (accepted)

## Charter version

Written against charter v1.4.0.

## Context

The 2026-05-06 backup-readiness advisor directive asks HCS to absorb an
evidence and authority pattern for backup/restore readiness that project repos
will eventually consume. The directive specifically covers upstream backup
surfaces owned by `runner-substrate` (Proxmox/Synology backup evidence),
`hetzner` (VPS-side restic / Storage Box), Citadel (admission and runner
policy), `HomeNetOps`, `system-config`, and project repos. HCS must model the
typed evidence posture without becoming the live executor for any of those
surfaces.

The source intake is preserved at:

- `docs/host-capability-substrate/research/local/2026-05-06-q-015-backup-readiness-intake.md`

Existing accepted ADRs constrain the shape:

- ADR 0015: upstream backup and restore operations are external control-plane
  surfaces and must remain evidence-first.
- ADR 0022 / ADR 0034 / ADR 0035: boundary evidence and QualityGate
  composition carry freshness, execution-context, and evidence-chain
  discipline.
- ADR 0036: backup contract YAML and threat-model documents can compose as
  Layer 2 `KnowledgeSource` inputs, but chunks are display/discovery only.
- ADR 0038: Phase 2.1-2.6 schema sequencing is already accepted and did not
  include backup-readiness implementation.
- ADR 0040: backup credential custody must compose with generic credential
  posture and must not store resolved secret material in HCS.
- ADR 0041: project-substrate admission can consume backup-readiness evidence
  as a contract slice, but contract lifecycle or backup lifecycle states do
  not become gate authority by themselves.

Q-015 therefore needs to answer a narrow posture question: how should HCS
represent backup/readiness concepts for future validation while preserving
source ownership and keeping implementation blocked until Q-013 and Q-014
dependencies are real?

## Options considered

### Option A: Implement backup-readiness schemas now

HCS would immediately add Ring 0 schema types for backup readiness, storage
class readiness, restore drill evidence, threat models, credential custody,
monitoring requirements, and project backup requirements.

**Pros:**

- Gives future project contracts concrete schema names immediately.
- Could accelerate dashboard and admission validation design.
- Captures the advisor's field list while the context is fresh.

**Cons:**

- Violates ADR 0038 by adding an unsequenced schema lane after Phase 2.1-2.6.
- Runs ahead of Q-013 credential-source and machine-identity dependencies.
- Runs ahead of Q-014 project-substrate contract validation implementation.
- Risks encoding advisor names before Q-011 naming-suffix review.
- Encourages agents to describe upstream backup layers as HCS-ready facts
  without typed restore-drill evidence.

### Option B: Fold backup readiness entirely into Q-014

HCS would treat backup/readiness as just another project-substrate contract
field and defer all specific lifecycle, restore-drill, threat-model,
credential-custody, and monitoring semantics to Q-014 implementation.

**Pros:**

- Keeps the number of Q-rows smaller.
- Preserves Q-014 as the project-admission umbrella.
- Avoids premature backup-specific entity commitments.

**Cons:**

- Inflates Q-014 beyond its accepted cohort-2 scope in ADR 0041.
- Obscures backup readiness as its own source-ownership and freshness problem.
- Makes it too easy to conflate Proxmox/Synology readiness, Hetzner VPS
  backups, and project contract requirements.
- Hides the restore-drill promotion rule inside a broader admission model.

### Option C: Accept a posture-only backup-readiness lane and keep implementation blocked

HCS records backup/readiness as a deferred Phase 2.7 / Wave-2 posture lane.
The ADR preserves lifecycle vocabulary, source ownership, candidate shape
triage, and stop rules, while leaving schema, registry, policy, validator,
dashboard, adapter, hook, and runtime work blocked behind a future accepted
implementation ADR.

**Pros:**

- Gives future Q-015 work a citable boundary without landing schemas early.
- Preserves the explicit lifecycle: `pending` -> `configured` -> `usable` ->
  `ready`, with optional `expired`.
- Keeps restore drill with boot/service verification as the promotion gate
  from `usable` to `ready`.
- Separates runner-substrate Proxmox/Synology evidence from Hetzner VPS
  restic / Storage Box evidence.
- Composes with ADR 0036, ADR 0040, and ADR 0041 without making backup status
  gate authority by itself.
- Leaves Q-011 naming-suffix and registry questions for reviewer-led
  implementation design.

**Cons:**

- Does not give implementers Zod types or fixtures yet.
- Requires another ADR before implementation can begin.
- Leaves freshness-window durations and exact gate-policy rules unresolved.

### Option D: Keep backup readiness entirely upstream

HCS would leave backup/readiness to `runner-substrate`, `hetzner`, Citadel,
`HomeNetOps`, `system-config`, and project repos, and would consume only
generic boundary or runner evidence if it appears later.

**Pros:**

- Lowest immediate HCS scope.
- Avoids new HCS vocabulary.
- Preserves upstream ownership completely.

**Cons:**

- Leaves future project-admission work without a citable HCS posture.
- Reopens the same ready-vs-usable and Synology-vs-Hetzner distinctions at
  every implementation touchpoint.
- Does not record how backup evidence composes with QualityGate, project
  substrate admission, or credential-source posture.
- Provides no regression target for agents that overclaim backup readiness.

## Decision

Choose Option C. Q-015 records a posture-only backup-readiness lane. HCS will
model backup/readiness as typed evidence and contract-consumption posture in
the future, but HCS does not own backup execution, restore execution, upstream
storage substrates, runner registration, or project workload admission. The
future implementation lane is Phase 2.7 / Wave-2 work behind Q-013 and Q-014,
unless ADR 0038 is separately amended. This ADR preserves the lifecycle,
source-ownership split, candidate evidence-shape triage, and stop rules needed
for reviewer deliberation, while blocking all schema, registry, policy,
validator, dashboard, adapter, hook, broker, runtime, and provider work.

## Consequences

### Accepts

- The storage-class readiness lifecycle is explicit:
  `pending` -> `configured` -> `usable` -> `ready`, with optional `expired`.
- `configured` means the backup target is reachable or initialized. It is not
  `usable`.
- `usable` means backup operations are succeeding under monitoring. It is not
  `ready`.
- `ready` requires a restore drill with boot/service verification inside the
  evidence-freshness window.
- Expired restore-drill evidence demotes readiness.
- Backup readiness is necessary evidence for some project-admission cases, but
  it is not sufficient for runner readiness or project workload admission.
- Runner readiness is not project workload admission.
- Hetzner native Backups are rollback insurance, not durable backup evidence.
- Hetzner Storage Box / restic evidence is VPS backup evidence, not Proxmox
  Synology readiness.
- Synology NFS for `runner-substrate` is backup-only storage, not VM disk
  storage.
- Backup contract YAML, backup requirement declarations, and threat-model
  documents may compose as ADR 0036 Layer 2 `KnowledgeSource` inputs in a
  future implementation lane. Their chunks remain display/discovery input
  only and never gate authority directly.
- Gate-eligible backup/readiness facts must be typed evidence that cites
  relevant source material and Layer 1 operational evidence.
- Future backup/readiness evidence must carry the base Evidence provenance and
  freshness contract, including non-null `valid_until` and the applicable
  execution-context binding required by charter invariant 19.
- A future `QualityGate.gate_kind: "backup_readiness"` may be proposed by the
  implementation ADR. Lifecycle status alone must never pass that gate.
- A future `QualityGate.gate_kind: "project_substrate_admission"` may consume
  backup-readiness evidence when a project contract declares persistent data,
  but the project admission gate must evaluate the full evidence chain.
- Candidate evidence and entity names are posture-only pending Q-011 naming
  review:
  - `BackupReadinessObservation` or `BackupReadinessReceipt`
  - `StorageClassReadiness` or `StorageClassReadinessObservation`
  - `RestoreDrillReceipt`
  - `BackupLayerThreatModel`
  - `BackupCredentialCustody` or `BackupCredentialCustodyObservation`
  - `BackupMonitoringRequirement`
  - `ProjectSubstrateBackupRequirement`
- `RestoreDrillReceipt` is the preferred Q-011-aligned name for the advisor's
  event-shaped `RestoreDrillEvidence` candidate.
- `ProjectSubstrateBackupRequirement` is the backup-shaped slice of the Q-014
  project-substrate contract posture. It does not replace Q-014 contract
  validation.
- `BackupCredentialCustody` composes with ADR 0040 `CredentialSource` and
  broker posture. It stores secret references only, never resolved secret
  material.
- Implementation remains blocked until an accepted Q-015 implementation ADR
  defines exact schema scope, registry updates, Zod source, generated JSON
  Schema, fixtures, docs, and tests.

### Rejects

- Starting Q-015 schema, registry, validator, canonical policy YAML, adapter,
  dashboard, hook, broker, runtime, or fixture implementation from this ADR.
- Treating the advisor directive as direct schema authority.
- Treating upstream backup design docs as live HCS facts.
- Describing any backup layer as live-ready without typed restore-drill
  evidence.
- Collapsing `pending`, `configured`, `usable`, and `ready` into fewer states.
- Treating reachability as usability.
- Treating successful backup jobs as readiness without restore evidence.
- Treating expired evidence as still ready.
- Treating `runner-substrate` Synology readiness and Hetzner VPS backup
  readiness as the same fact.
- Treating backup readiness as runner readiness.
- Treating runner readiness as project workload admission.
- Making HCS a backup executor, restore executor, Proxmox control plane,
  Hetzner control plane, Citadel runner/admission control plane, OpenTofu
  control plane, or project workload provisioner.
- Editing `runner-substrate`, `hetzner`, Citadel, `HomeNetOps`, or
  `system-config` from the HCS repo as part of Q-015.
- Reading, resolving, or storing secret material in HCS docs, schemas,
  fixtures, generated JSON Schema, policy snapshots, logs, audit artifacts, or
  contract chunks.
- Duplicating upstream backup or admission policy into HCS canonical policy
  YAML.

### Future amendments

- Reopen when Q-013 implementation lands credential-source and
  machine-identity evidence needed by backup credential custody.
- Reopen when Q-014 implementation lands project-substrate contract validation
  and admission observations that backup requirements can cite.
- Reopen if implementation proves `StorageClassReadiness` should be a
  standalone Ring 0 entity instead of an evidence subtype or boundary payload.
- Reopen if implementation proves a new `boundary_dimension:
  "backup_readiness"` is needed rather than direct evidence subtypes.
- Reopen if `BackupReadinessObservation` and `RestoreDrillReceipt` are not
  sufficient to represent readiness lifecycle and restore proof.
- Reopen if freshness-window durations or data-class semantics require a
  separate policy Q-row.
- Reopen if repeated agent failures show backup status being treated as gate
  authority despite this ADR.
- Reopen if implementation pressure requires an ADR 0038 sequencing amendment
  to move backup/readiness work ahead of Q-013 or Q-014 dependencies.

## Reviewer focus

- `hcs-architect`: ADR 0036 / ADR 0040 / ADR 0041 composition; Phase 2.7
  sequencing; source-ownership split; lifecycle state discipline; whether
  Q-015 should stay separate from Q-014.
- `hcs-ontology-reviewer`: Q-011 naming-suffix discipline; direct Evidence vs
  `BoundaryObservation` vs standalone Ring 0 shape; candidate
  `gate_kind: "backup_readiness"`; possible `boundary_dimension:
  "backup_readiness"`; no upstream-org-specific names in HCS core ontology.
- `hcs-policy-reviewer`: canonical policy YAML boundary; no upstream policy
  duplication; lifecycle status not gate authority; freshness windows deferred
  to policy; operation-class posture remains external-control-plane evidence.
- `hcs-security-reviewer`: no secret material; credential custody as references
  only; restore-drill proof freshness; teardown/retention interaction;
  separation of backup readiness from runner/project admission; no provider
  actions from HCS.

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md` v1.4.0
- Decision ledger: `DECISIONS.md` Q-015
- Plan: `PLAN.md` Q-015 backup-readiness substrate-contract intake
- Q-015 intake:
  `docs/host-capability-substrate/research/local/2026-05-06-q-015-backup-readiness-intake.md`
- Phase 2.7 sequencing plan:
  `docs/host-capability-substrate/research/local/2026-05-06-phase-2-7-deferred-lane-sequencing-plan.md`
- ADR 0015:
  `docs/host-capability-substrate/adr/0015-external-control-plane-automation.md`
- ADR 0022:
  `docs/host-capability-substrate/adr/0022-boundary-observation-envelope.md`
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

### External

- Advisor directive preserved verbatim in the Q-015 intake document.
