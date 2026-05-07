# Q-014 Implementation Lane Plan

Date: 2026-05-06

Status: implementation ADR planning may open. ADR 0043 has landed the Q-013
credential-source and machine-identity evidence dependency, but this document
does not authorize Q-014 schema source, generated JSON Schema, validators,
canonical policy YAML, adapters, dashboard routes, hooks, runner registration,
Proxmox changes, OpenTofu changes, machine-identity issuance, project workload
provisioning, or runtime behavior.

## Authority

Accepted posture:

- ADR 0041:
  `docs/host-capability-substrate/adr/0041-q-014-project-substrate-contract-validation.md`
- Decision ledger: `DECISIONS.md` Q-014
- Plan entry: `PLAN.md` project-substrate admission standard intake
- Local synthesis:
  `docs/host-capability-substrate/research/local/2026-05-06-project-substrate-compatibility-synthesis.md`
- External compatibility note:
  `docs/host-capability-substrate/research/external/2026-05-06-citadel-project-substrate-standard.md`
- Q-013 v1 evidence dependency:
  `docs/host-capability-substrate/adr/0043-q-013-credential-plane-implementation.md`

External source authority remains Citadel PR #37, merged to
`The-Nash-Group/citadel-config` at
`46c55857427af4b887194277bac2218c20b595b6`.

## Accepted Shape

Q-014 composes with ADR 0036. Project-owned contract YAML is a future
`KnowledgeSource` input with candidate
`source_kind: "project_substrate_contract"`. Contract chunks are
display/discovery input only; gate-eligible facts must be typed validation
evidence that cites both the contract source and Layer 1 operational evidence.

ADR 0041 accepts posture only for the cohort-2 evidence names:

- `ProjectSubstrateContractValidationReceipt`
- `ProjectSubstrateAdmissionObservation`
- `ProjectTeardownPlanReceipt`
- `ProjectTeardownCompletionReceipt`

It also reserves candidate values for future ontology review:

- `KnowledgeSource.source_kind: "project_substrate_contract"`
- `QualityGate.gate_kind: "project_substrate_admission"`
- `BoundaryObservation.boundary_dimension:
  "project_admission_authority"`

The external `guardian_approval` fact has one v1 ontology home:
`boundary_dimension: "project_admission_authority"`. A future
`ProjectSubstrateAdmissionObservation` may cite that `BoundaryObservation` and
summarize its state, but must not duplicate the payload as a second fact home.

## Entry Conditions

Q-014 schema implementation should not open until all of these are true:

- Phase 2.1-2.6 schema train completed per ADR 0038.
- Q-013 implementation landed the credential-source and machine-identity
  evidence dependencies needed by project-substrate validation via ADR 0043.
- A follow-on implementation ADR is accepted for Q-014 schema scope, including
  registry changes, Zod source, generated JSON Schema, fixtures, docs, and
  tests.
- Reviewer dispatch is planned for `hcs-architect`,
  `hcs-ontology-reviewer`, `hcs-policy-reviewer`, and
  `hcs-security-reviewer`.

## Future Work Packages

1. ADR/schema proposal.
   Define the exact cohort-2 payload shapes, subject refs, target refs,
   content-hash grain, parser/version fields, evidence refs, and
   execution-context bindings.

2. Ontology registry update.
   Add candidate enum values only with the normal schema-change lane:
   registry entry, Zod source, generated JSON Schema, ontology docs, tests,
   and fixtures in the same PR.

3. Contract validation receipt.
   Define `ProjectSubstrateContractValidationReceipt` as point-in-time
   validation of contract structure against the accepted project-substrate
   standard, keyed by contract content hash and validation run.

4. Admission observation.
   Define `ProjectSubstrateAdmissionObservation` as freshness-bound admission
   state evidence that cites contract validation, Citadel authority records,
   the `project_admission_authority` boundary observation, identity bindings,
   boundary observations, and runner/check evidence as applicable.

5. Teardown receipts.
   Define `ProjectTeardownPlanReceipt` and
   `ProjectTeardownCompletionReceipt` so both require typed deletion-authority
   evidence. Contract self-assertion and `.gitignore` state are never deletion
   authority.

6. Gate composition.
   Define how a future `QualityGate.gate_kind:
   "project_substrate_admission"` consumes typed evidence. Contract lifecycle
   status alone must never pass the gate.

7. Regression traps.
   Add traps for the failure classes listed below once the eval fixture lane is
   open.

## Regression Trap Queue

Future eval fixtures should cover:

- `guardian_approval` treated as HCS `ApprovalGrant`.
- Contract lifecycle `active` treated as direct HCS authorization.
- `ProjectTeardownProofReceipt` minted as Evidence.
- Teardown receipts accepted without typed deletion-authority evidence.
- Contract chunks consumed as gate authority without typed validation evidence
  and Layer 1 operational evidence.
- Resolved secret material stored in `secret_refs`, chunks, fixtures, policy
  snapshots, logs, or audit artifacts.
- Public fork code allowed onto self-hosted runners.
- Generic `runs-on: self-hosted` treated as guardian-overridable.
- Docker socket exposure to untrusted jobs treated as guardian-overridable.
- Runner tokens persisted in state.
- Q-014 evidence accepted with missing `valid_until`, authority, confidence,
  parser version, or execution-context binding.

## Stop Rules

Stop and return to human review if a task tries to:

- start Q-014 schema, validator, adapter, dashboard, hook, policy, or runtime
  implementation before a follow-on implementation ADR is accepted;
- make HCS a CI, Proxmox, GitHub, OpenTofu, identity, or project workload
  control plane;
- register or deregister runners;
- mutate GitHub runner groups, selected-repository access, repository rulesets,
  workflow policy, Proxmox host state, or OpenTofu state from HCS;
- mint, rotate, or retire project machine identities;
- treat Citadel contract status as HCS approval;
- treat `guardian_approval` as HCS `ApprovalGrant`;
- collapse project contract YAML into HCS live policy;
- duplicate Citadel OPA rules in HCS policy YAML;
- store resolved secret material in HCS docs, schemas, fixtures, policy
  snapshots, logs, or audit artifacts.

## Next Safe Action

Draft the Q-014 implementation ADR. Keep schema, validator, adapter,
dashboard, hook, policy, and runtime implementation blocked until that ADR is
accepted and the required reviewer pass completes.

## Change Log

| Version | Date | Change |
|---|---:|---|
| 0.2.0 | 2026-05-07 | Updated after ADR 0043 schema/evidence landing; Q-014 implementation ADR planning may open while Q-014 schema/runtime work remains blocked. |
| 0.1.0 | 2026-05-06 | Initial docs-only implementation-lane plan following ADR 0041 acceptance. |
