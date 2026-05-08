---
adr_number: 0045
title: Q-015 backup-readiness implementation slice
status: proposed
date: 2026-05-07
charter_version: 1.4.0
tags: [backup-readiness, restore-drill, storage-class, credential-source, project-substrate, evidence, q-015, phase-2-7]
---

# ADR 0045: Q-015 backup-readiness implementation slice

## Status

proposed

If accepted, this ADR authorizes only Ring 0 schema/evidence work for the
narrow Q-015 v1 slice named below: backup readiness observation, restore drill
receipt, backup credential custody observation, project-substrate backup
requirement observation, generic source-kind support for threat-model
documents, and the minimum subject/ref vocabulary required by those records.

This ADR does not authorize backup execution, restore execution, provider
mutation, runner registration, GitHub runner-group mutation, Proxmox changes,
Hetzner changes, OpenTofu changes, machine-identity issuance, project workload
provisioning, canonical policy YAML, runtime/live validators, adapters,
dashboard routes, hooks, broker behavior, `QualityGate.gate_kind:
"backup_readiness"`, `ApprovalGrant.scope`, `allowed_for_gate`, or runtime
behavior.

## Date

2026-05-07 (proposed)

## Charter version

Written against charter v1.4.0.

## Context

ADR 0042 accepted Q-015 at the posture layer only. It established that backup
readiness is future typed evidence and contract-consumption posture, while
backup execution, restore execution, storage substrate operation, runner
registration, and project workload admission remain upstream-owned.

The entry conditions named by ADR 0042 and the Q-015 implementation lane plan
are now satisfied for an implementation ADR draft:

- The ADR 0038 Phase 2.1-2.6 schema train has landed.
- ADR 0043 landed Q-013 credential-source and machine-identity evidence that
  backup credential custody can cite.
- ADR 0044 landed Q-014 project-substrate contract/admission evidence that
  project backup requirements can cite.
- Backup readiness remains an independent evidence need because restore-drill
  freshness, storage-class lifecycle, credential custody, and backup
  requirement validation are not represented by Q-014 alone.

Q-015 therefore needs an implementation ADR before schema work begins. The
goal is not to make HCS a backup platform or restore orchestrator. The goal is
to give HCS a generic, freshness-bound evidence vocabulary for backup
readiness that downstream project-substrate admission can cite without
claiming upstream authority.

Constraints:

- HCS must not duplicate policy across adapter, hook, dashboard, canonical
  policy, or upstream repo surfaces (charter invariant 1).
- HCS must not store resolved secret material in docs, schemas, fixtures,
  generated schemas, policy snapshots, logs, audit artifacts, or chunks
  (invariant 5).
- HCS must not add mutating execution surfaces without approval grants, audit,
  dashboard review, leases, and policy/gateway checks (invariant 7).
- HCS treats external control planes as evidence surfaces, not authority it
  owns or mutates (ADR 0015 and invariant 16).
- Runtime credential and backup claims must be execution-context-bound, not
  inferred from parent shells or upstream design docs (invariants 17 and 19).
- Derived source material and runbooks are never gate authority by themselves
  (invariant 18).
- Backup lifecycle claims are freshness-bound; stale or expired restore-drill
  evidence demotes readiness (invariant 19 and ADR 0042).

## Options considered

### Option A: Implement the full backup-readiness control plane now

This option would add schema, canonical policy YAML, runtime/live validators,
dashboard views, backup execution receipts, restore execution receipts,
provider mutation receipts, and gate behavior in one Q-015 packet.

**Pros:**

- Gives backup readiness an end-to-end HCS surface immediately.
- Could align schema, policy, dashboard, and runtime behavior in one pass.
- Minimizes the number of future Q-015 ADRs.

**Cons:**

- Violates ADR 0042 by turning HCS into a backup/restore control plane.
- Mixes schema, policy, runtime, provider mutation, restore evidence,
  credential custody, and project admission into one review cycle.
- Risks treating lifecycle state such as `ready` as HCS gate authority.
- Risks duplicating upstream backup and admission policies.

### Option B: Keep Q-015 posture-only until an upstream backup system lands first

This option would leave HCS unchanged until an owning repo ships concrete
backup jobs, restore drills, or monitoring contracts that HCS can observe.

**Pros:**

- Avoids premature HCS schema choices.
- Keeps provider-specific implementation details fully upstream.
- Lowest immediate HCS diff.

**Cons:**

- Leaves project-substrate admission without a typed backup evidence
  dependency.
- Encourages agents to treat ADR 0042 posture text as enough schema authority.
- Reopens the ready-vs-usable distinction at every downstream touchpoint.
- Does not define the no-secret custody boundary for backup recovery paths.

### Option C: Authorize a narrow schema/evidence slice

This option implements only the generic HCS vocabulary required by ADR 0042:
backup readiness observation, restore drill receipt, backup credential custody
observation, project-substrate backup requirement observation, and generic
source-kind support for threat-model documents.

**Pros:**

- Gives downstream project admission typed backup evidence to cite.
- Preserves the `pending -> configured -> usable -> ready` lifecycle with
  optional `expired`.
- Keeps restore drill evidence as the only path to `ready`.
- Keeps secret-bearing recovery paths as `KnowledgeSource` / `SecretReference`
  references, not inline content.
- Avoids brand/provider storage-class names in HCS core ontology.
- Keeps implementation reviewable as schema, generated schema, docs,
  registry, fixtures, and tests only.

**Cons:**

- Does not add backup execution, restore execution, live validators, dashboard
  views, policy gates, or runtime checks.
- Defers `QualityGate.gate_kind: "backup_readiness"` despite ADR 0042 naming
  it as a future candidate.
- Defers standalone threat-model and monitoring-requirement entities.
- May need a follow-on if storage-class readiness proves to need durable
  lifecycle beyond evidence observations.

### Option D: Model backup readiness as a `BoundaryObservation` branch

This option would add `boundary_dimension: "backup_readiness"` and represent
storage-class readiness as a typed `BoundaryObservation` payload.

**Pros:**

- Reuses the existing freshness-bound boundary envelope.
- Makes backup readiness visibly target-bound to an execution context,
  workspace, or provider object.
- Could align with future QualityGate boundary evidence consumption.

**Cons:**

- Backup readiness is an aggregate evidence lifecycle, not a single boundary
  fact.
- Restore-drill event evidence still needs a direct receipt.
- A boundary branch would not solve project backup requirement or credential
  custody shape.
- Risks creating two homes for the same fact if a later direct evidence
  observation is still needed.

## Decision

Choose Option C. If accepted, Q-015 implementation v1 is a schema/evidence
slice that composes with ADR 0036, ADR 0042, ADR 0043, and ADR 0044. It may
add a generic `KnowledgeSource.source_kind: "threat_model"` value, direct
evidence subtypes for `BackupReadinessObservation`,
`BackupCredentialCustodyObservation`, and
`ProjectSubstrateBackupRequirementObservation`, a direct receipt subtype for
`RestoreDrillReceipt`, and the minimum subject/ref vocabulary required by
those records.

This ADR does not authorize `StorageClassReadiness` as a standalone Ring 0
entity, `boundary_dimension: "backup_readiness"`, `QualityGate.gate_kind:
"backup_readiness"`, backup/restore execution, provider mutation, policy YAML,
runtime/live validators, dashboard routes, adapters, hooks, broker behavior,
project workload admission, or runtime behavior.

The implementation PR must follow `.agents/skills/hcs-schema-change`: Zod
source, generated JSON Schema, `ontology.md`, `ontology-registry.md`, tests,
and fixtures move together. Any canonical policy YAML remains in
`system-config/policies/host-capability-substrate/` and requires a separate
accepted policy lane.

## Proposed v1 evidence scope

### Shared evidence contract

All Q-015 v1 direct evidence records must satisfy the base `Evidence` shape
plus stricter subtype rules:

- `valid_until` is non-null. Backup readiness, restore drills, custody, and
  project backup requirements expire.
- `source`, optional `source_ref`, `observed_at`, `authority`, `confidence`,
  `parser_version`, `redaction_mode`, and producer/authority discipline are
  explicit.
- Records bind to at least one applicable runtime or target reference such as
  `workspace_id`, `execution_context_id`, `credential_source_id`,
  `provider_object`, or external-control-plane reference.
  `knowledge_source_id` is source citation only; by itself it is not
  sufficient execution-context or freshness binding under charter invariant
  19.
- `subject_refs` name the underlying subject, not the evidence envelope.
  Schema work must not add subject-kind values such as
  `backup_readiness_observation`, `restore_drill_receipt`,
  `backup_credential_custody_observation`, or
  `project_substrate_backup_requirement_observation`.
- Use existing subject kinds where possible. Expected v1 subject kinds are
  `workspace`, `knowledge_source`, `credential_source`, `provider_object`,
  `external_control_plane`, `resource_budget`, `policy_plan`, and
  `machine_identity`. A new subject kind requires reviewer justification.
- Final payload discriminators use Q-011 `_kind` names such as
  `storage_class_kind`, `readiness_state_kind`, and
  `custody_posture_kind`; `_ref` fields remain kind-tagged references.
- `authority: "sandbox-observation"` must not satisfy backup readiness,
  restore-drill completion, credential custody, project admission,
  deletion authority, `allowed_for_gate`, or any future gate authority.
- Source chunks, runbooks, threat models, and derived summaries remain
  display/discovery inputs only. Gate-consumed facts must be typed evidence.
- Tombstoned, expired, stale, missing, contradictory, or sandbox-only evidence
  must not satisfy backup readiness or future gate consumption.

### `KnowledgeSource.source_kind: "threat_model"`

Threat-model documents are represented as generic Layer 2 `KnowledgeSource`
records, not as standalone HCS policy or accepted-risk entities.

Purpose:

- Give backup readiness records a citable source for threat-model context.
- Avoid embedding project-specific accepted risks in public HCS fixtures,
  generated schemas, policy snapshots, or ontology docs.
- Keep threat-model text display/discovery-only unless promoted through typed
  evidence.

Constraints:

- `accepted_risks` content remains in owning repos or private source material.
  HCS public schema may reference the source, but must not inline project risk
  lists.
- Existing `KnowledgeSource.source_kind: "runbook"` covers recovery and
  break-glass procedures. This ADR does not add backup-specific runbook kinds.
- Resolved secret material remains forbidden.

### `BackupReadinessObservation`

Direct `Evidence` observation summarizing backup readiness for a storage class
or backup surface.

Expected grain: per `(workspace_id, storage_class_ref, observed_at)` or per
`(provider_object_ref, storage_class_ref, observed_at)` when the observation
is not workspace-specific.

Purpose:

- Record the current readiness lifecycle state:
  `pending`, `configured`, `usable`, `ready`, `expired`, or `unknown`.
- Record a generic storage class kind such as `object_store`,
  `nfs_backup_target`, `vps_native_snapshot`, `backup_repository`,
  `filesystem_snapshot`, or `unknown`.
- Cite restore-drill receipts, separately accepted external/upstream
  backup-operation evidence refs if present, separately accepted monitoring
  evidence refs if present, credential-custody evidence, threat-model source
  refs, and project backup requirement evidence as applicable.
- Preserve the rule that lifecycle state is evidence input, not gate authority
  by itself.

Constraints:

- `ready` requires at least one freshness-valid, non-tombstoned
  `RestoreDrillReceipt` evidence ref with boot/service verification. This ADR
  does not set the duration, maximum age, or renewal window; those remain
  policy-owned.
- `configured` must not be interpreted as `usable`.
- `usable` must not be interpreted as `ready`.
- `expired` is a demotion state, not positive readiness.
- `unknown` is not positive readiness and must not be treated as
  `configured`, `usable`, or `ready`.
- Storage-class enum values must be provider-neutral. Brand/provider labels
  belong in owning repos or external config, not HCS core enums.
- This ADR does not add a standalone `StorageClassReadiness` entity.

### `RestoreDrillReceipt`

Direct `Evidence` receipt for a restore drill event.

Expected grain: per `(restore_drill_id, restored_environment_ref,
restore_completed_at)`.

Purpose:

- Record source artifact reference, restore target reference, restored
  environment reference, boot verification, service verification, RTO/RPO
  measurement, runbook revision source, cleanup disposition, and evidence
  expiration.
- Provide the event-shaped evidence required to promote readiness from
  `usable` to `ready`.

Constraints:

- `ready` consumption requires a freshness-valid, non-tombstoned restore drill
  receipt with boot and service verification.
- `restored_environment_ref` is a typed reference to a provider/object or
  external-control-plane target. It is never an inline payload, file dump,
  database dump, environment dump, secret dump, or restored data sample.
- Boot/service verification records are structured evidence refs or
  scrubbed summaries, not raw logs with secrets.
- Restore drills do not mutate provider state from HCS. They observe upstream
  restore evidence produced by the owning surface.
- Cleanup disposition records must not become deletion authority by
  themselves; D-025 / ADR 0036 deletion-authority discipline still applies.

### `BackupCredentialCustodyObservation`

Direct `Evidence` observation for backup credential custody posture.

Expected grain: per `(credential_source_id, backup_surface_ref,
observed_at)`.

Purpose:

- Compose Q-015 backup readiness with ADR 0043 `CredentialAuthorityObservation`
  and `MachineIdentityBindingObservation`.
- Record runtime read pattern source, break-glass recovery path source,
  secret-reference evidence, custody posture, expiry/rotation posture, and
  auditability refs.
- Keep recovery procedures and secret pointers reference-only.

Constraints:

- `break_glass_recovery_path` must be a `KnowledgeSource` reference, not an
  inline procedure body.
- Recovery procedures often contain recovery-code material; HCS public
  fixtures and generated schemas must not inline that content.
- The record must never include resolved secret material, token fragments,
  private keys, recovery codes, environment dumps, provider item bodies, or
  shell history.
- This observation does not issue, rotate, revoke, or reconcile credentials.

### `ProjectSubstrateBackupRequirementObservation`

Direct `Evidence` observation for the backup-shaped slice of a
project-substrate contract.

Expected grain: per `(workspace_id, knowledge_source_id,
contract_content_hash, observed_at)`.

Purpose:

- Record whether persistent data exists, the required generic backup class,
  required readiness state before active use, RPO/RTO expectation,
  data-minimization posture, teardown/retention expectation, waiver/disposable
  data posture, and evidence expiration.
- Cite `ProjectSubstrateContractValidationReceipt`,
  `ProjectSubstrateAdmissionObservation`, backup readiness evidence, restore
  drill receipts, and source material.

Constraints:

- This observation validates the backup requirement slice. It does not replace
  Q-014 contract validation or project admission evidence.
- Rebuildable/disposable project data records source-declared disposability
  and teardown evidence refs; future policy decides whether that satisfies a
  waiver or admission condition.
- Project backup requirements do not register runners, provision workloads, or
  pass project-substrate admission by themselves.

## Deferred follow-on candidates

This ADR does not accept these records, enum values, or behaviors:

- `QualityGate.gate_kind: "backup_readiness"`. Gate-kind implementation needs
  a separate policy/gate ADR or policy lane defining target refs, evidence
  refs, freshness windows, denial semantics, and composition with
  `project_substrate_admission`.
- `boundary_dimension: "backup_readiness"`. Reopen only if direct evidence
  observations cannot represent storage-class readiness without duplicating
  fact homes.
- A standalone `StorageClassReadiness` entity. Reopen only if HCS needs
  durable lifecycle beyond freshness-bound observations.
- Standalone `BackupLayerThreatModel` or `BackupMonitoringRequirement`
  entities. V1 uses `KnowledgeSource` refs and typed evidence refs instead.
- Backup execution receipts, restore execution operations, provider mutation
  receipts, runtime validators, dashboard routes, adapters, hooks, broker
  behavior, project provisioning, and canonical policy YAML.

## Consequences

### Accepts

- Q-015 v1 is schema/evidence work only; implementation PRs must be scoped to
  the records, source kind, docs, registry, generated schemas, fixtures, and
  tests named in this ADR.
- Backup readiness is represented as direct Evidence, not a
  `BoundaryObservation` branch in v1.
- `StorageClassReadiness` is not a standalone Ring 0 entity in v1.
- `RestoreDrillReceipt` is the event-shaped proof input required for `ready`.
- `BackupCredentialCustodyObservation` composes with ADR 0043 credential and
  machine-identity evidence without storing or issuing secrets.
- `ProjectSubstrateBackupRequirementObservation` composes with ADR 0044
  project-substrate contract validation and admission evidence without
  becoming project admission by itself.
- Generic storage class enum values are accepted in principle; brand/provider
  names remain outside HCS core ontology.

### Rejects / Stop Rules

- Making HCS a backup executor, restore executor, runner, Proxmox, Hetzner,
  GitHub, OpenTofu, identity, or project workload control plane. Authority:
  charter invariants 1, 7, and 16; ADR 0015.
- Adding backup/restore runtime behavior, provider mutation, backup job
  dispatch, restore job dispatch, runner registration, project workload
  provisioning, or operation registration in this slice. Authority: charter
  invariants 7 and 16; ADR 0015; ADR 0042.
- Adding `QualityGate.gate_kind: "backup_readiness"`, `ApprovalGrant.scope`,
  `allowed_for_gate`, gate-promotion, or canonical policy behavior in this
  ADR. Authority: charter invariants 1, 7, 18, and 19; ADR 0035.
- Treating `pending`, `configured`, `usable`, `ready`, `expired`, or
  `unknown` lifecycle status as gate authority by itself. Authority: ADR 0035
  and ADR 0042.
- Treating reachability as usability, successful backup jobs as readiness, or
  expired restore-drill evidence as still ready. Authority: ADR 0042 and
  charter invariant 19.
- Treating tombstoned, stale, missing, contradictory, sandbox-only, or
  unknown evidence as positive readiness. Authority: ADR 0042 and charter
  invariant 19.
- Treating backup readiness as runner readiness, or runner readiness as
  project workload admission. Authority: ADR 0032, ADR 0041, and ADR 0042.
- Importing brand/provider storage-class enum names into HCS core ontology.
  Authority: charter invariant 10 and ADR 0042.
- Storing resolved secret material, recovery codes, provider item bodies,
  environment dumps, shell history, or inline break-glass procedure text in
  HCS docs, schemas, fixtures, generated JSON Schema, policy snapshots, logs,
  audit artifacts, receipts, or chunks. Authority: charter invariants 5 and
  10; ADR 0040.
- Duplicating upstream backup, runner, admission, or provider policy in HCS
  canonical policy YAML or schema validators. Authority: charter invariant 1
  and ADR 0006.
- Editing `runner-substrate`, `hetzner`, Citadel, `HomeNetOps`,
  `system-config`, or project repos from the HCS repo as part of this lane.
  Authority: ADR 0001 and ADR 0042.

### Future amendments

- Reopen when backup readiness is ready for `QualityGate.gate_kind:
  "backup_readiness"` with accepted target refs, evidence refs, freshness
  windows, and denial semantics.
- Reopen if implementation proves `StorageClassReadiness` needs a standalone
  Ring 0 entity.
- Reopen if implementation proves `boundary_dimension: "backup_readiness"` is
  necessary and will not duplicate direct evidence facts.
- Reopen if monitoring requirements need a standalone entity rather than
  source refs plus evidence refs.
- Reopen if threat-model evidence needs a typed entity beyond
  `KnowledgeSource.source_kind: "threat_model"`.
- Reopen if project-substrate backup requirements need to change ADR 0044
  contract validation or admission-observation payloads.
- Reopen if dashboard requirements need a read-only backup readiness
  projection.
- Reopen if repeated agent failures show backup lifecycle status, runbooks,
  or upstream design docs being treated as direct HCS authorization despite
  ADR 0042 and this ADR.

## Reviewer focus

- `hcs-architect`: ADR 0036 / ADR 0040 / ADR 0042 / ADR 0044 composition;
  Phase 2.7 sequencing; source-ownership split; rejection of backup/restore
  control-plane expansion.
- `hcs-ontology-reviewer`: Q-011 naming-suffix discipline; direct Evidence vs
  `BoundaryObservation` vs standalone entity placement; `threat_model`
  source-kind addition; generic storage-class enum names; no upstream
  brand/provider names in HCS core ontology.
- `hcs-policy-reviewer`: canonical policy YAML boundary; no upstream policy
  duplication; lifecycle status not gate authority; freshness windows
  deferred to policy; no `QualityGate.gate_kind` accepted here.
- `hcs-security-reviewer`: no secret material; break-glass recovery path as a
  `KnowledgeSource` reference; restored environment refs as typed references;
  restore-drill freshness; no inline accepted-risk lists or restored data.

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md` v1.4.0
- Decision ledger: `DECISIONS.md` Q-015
- Plan: `PLAN.md` Q-015 backup-readiness substrate-contract posture
- Research plan:
  `~/Organizations/jefahnierocks/system-config/docs/host-capability-substrate-research-plan.md`
- Q-015 intake:
  `docs/host-capability-substrate/research/local/2026-05-06-q-015-backup-readiness-intake.md`
- Q-015 lane plan:
  `docs/host-capability-substrate/research/local/2026-05-07-q-015-implementation-lane-plan.md`
- Phase 2.7 deferred-lane sequencing:
  `docs/host-capability-substrate/research/local/2026-05-06-phase-2-7-deferred-lane-sequencing-plan.md`
- Ontology registry:
  `docs/host-capability-substrate/ontology-registry.md`
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
- ADR 0044:
  `docs/host-capability-substrate/adr/0044-q-014-project-substrate-implementation.md`

### External

- Advisor directive preserved verbatim in the Q-015 intake document.
