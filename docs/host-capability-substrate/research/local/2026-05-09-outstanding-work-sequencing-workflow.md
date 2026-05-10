---
title: Outstanding Work Sequencing Workflow
category: research
component: host_capability_substrate
status: active
version: 0.1.0
last_updated: 2026-05-09
tags: [sequencing, phase-2-5, phase-2-7, credential-plane, project-substrate, backup-readiness, cleanup-plan, policy-yaml]
priority: high
---

# Outstanding Work Sequencing Workflow

## Status

This is a docs-only Ring 3 workflow directive for the outstanding
user-direction and trigger-deferred work reviewed on 2026-05-09. It records
the next safe order of work. It does not authorize schema, canonical policy
YAML, Ring 1 services, adapters, dashboard routes, hooks, broker behavior,
runtime behavior, provider mutation, backup/restore execution, project
workload provisioning, or class-I cleanup execution.

## Empirical Baseline

- Repo state checked on 2026-05-09: `main` was aligned with `origin/main`.
- Q-013, Q-014, and Q-015 first schema/evidence slices are landed via ADRs
  0043, 0044, and 0045.
- ADR 0039 #5 is landed: `Evidence.schema_version` is `0.10.0` after the
  `self-asserted` authority extension.
- ADR 0047 is accepted, and its first Ring 0 schema slice is landed. Current
  schema source includes `operation_class: cleanup_plan`;
  `mutation_scope: "none"`; `target_kind: "workspace"` narrowing;
  `summary_kind: cleanup_plan` on `DerivedSummary`; and the cleanup-plan
  hint-status refinement.
- ADR 0047 `Decision.reason_kind` reservations and `cleanup_scope` remain
  registry-canonical only, pending a future Ring 1 mint API schema PR.
- The subject-kind grounding requirement is now registered in
  `ontology-registry.md` v0.4.10. Current `CoordinationFact.subject_kind`
  values are still limited to the accepted ADR 0019 / ADR 0036 set; Phase 2.7
  evidence subjects are not yet `CoordinationFact.subject_kind` enum values.
- The only observed file under the live system-config policy directory is the
  transitional `project-substrate-admission.yaml`; the broader Phase 2.5
  policy set is not present in this repo and remains cross-repo work.

## Decisions

### 1. Policy-first is the next substantive lane

The next substantive lane is Phase 2.5 canonical policy YAML, in
`system-config/policies/host-capability-substrate/`, preceded by the HCS-local
classification work needed to keep that policy honest. Do not open Q-013,
Q-014, Q-015, or cleanup-plan runtime/provider/execution work before the policy
consumption rules exist.

Rationale: the schema/evidence vocabulary is now ahead of the policy layer.
Opening runtime or provider lanes first would force implicit policy into Ring 1
services, adapters, hooks, or operator runbooks, violating charter invariants 1,
7, 16, 18, and 19.

### 2. Use ADR 0048 for subject-kind grounding, not runtime expansion

Reserve ADR 0048 for the Phase 2.7 subject-kind grounding evaluation unless a
stronger trigger fires first. That ADR should decide how future
`CoordinationFact.subject_kind` additions for machine identity,
project-substrate contracts, and backup-readiness facts classify against the
registered grounding rule.

Do not spend ADR 0048 on AgentClient x WorkspaceContext cardinality today. The
trigger has not fired: there is no observed single workspace whose operations
span multiple AgentClients with conflicting capability-class evidence, and
`WorkspaceContext` is not yet a Ring 0 schema.

Do not spend ADR 0048 on `RemoteAgentInvocationReceipt` today. The trigger has
not fired: no non-PR binder failure has shown that
`(execution_context_id, observed_at_window)` is inadequate.

### 3. Q-013 next lane is policy/gate compatibility only

Authorize only the planning path that maps project-secret standards and
credential-plane evidence into future policy/gate inputs. Keep broker daemon,
reconciler, service-account/vault inventory, OpenTofu integration, runtime
injection, provider mutation, operation registration, and credential issuance
blocked behind separate accepted authority.

The immediate Q-013 policy questions are:

- what credential authority evidence must exist before a runtime consumer may
  read a credential;
- when `CredentialAuthorityObservation` and
  `MachineIdentityBindingObservation` are stale, contradictory, self-asserted,
  sandbox-only, or insufficient;
- how argv/persistent-config/log/screenshot/chat secret-material exposure is
  represented as a denial or stop condition;
- how human workstation credentials stay distinct from machine identities.

### 4. Q-014 next lane is admission policy/gate shape

Authorize only policy/gate design for future
`QualityGate.gate_kind: project_substrate_admission`, after ADR 0048 grounding
classification. Keep runtime validators, runner registration, GitHub
runner-group mutation, selected-repository access mutation, Proxmox/OpenTofu
mutation, identity issuance, project workload provisioning, adapters, dashboard
routes, hooks, and runtime behavior blocked.

Contract lifecycle status and `guardian_approval` remain evidence inputs, not
HCS gate authority or `ApprovalGrant` substitutes.

### 5. Q-015 next lane is readiness policy/gate shape

Authorize only policy/gate design for backup-readiness consumption, after ADR
0048 grounding classification. Preserve the lifecycle:

```text
pending -> configured -> usable -> ready
```

with optional `expired`. `ready` requires freshness-valid restore-drill evidence
with boot/service verification. Do not authorize backup execution, restore
execution, provider mutation, runtime validators, adapters, dashboard routes,
hooks, monitoring integration, or project workload admission from the HCS repo.

### 6. Cleanup-plan next lane is policy, then Ring 1 mint API shape

The user-supplied outstanding list treated the ADR 0047 schema slice as still
future. That is now stale. The first Ring 0 slice has landed. The remaining
cleanup-plan order is:

1. canonical policy YAML for `cleanup_plan`;
2. Ring 1 mint API schema/implementation for `cleanup_scope` and the new
   rejection reasons when cleanup-plan construction begins;
3. adapter/dashboard read surfaces only after policy and Ring 1 shape are
   concrete;
4. cleanup execution wiring only after the class-I M4 stack exists.

Do not re-introduce `explicit_target_set` until registry redaction posture
defines structurally typed caller-observable targets or existence-only
redaction for rejected-target `Decision` bodies.

### 7. Trigger-deferred items remain deferred

Keep these closed until their trigger evidence exists:

- `RemoteAgentInvocationReceipt` aggregator;
- AgentClient x WorkspaceContext direct cardinality;
- ADR 0039 wave-2 reactive amendment;
- Phase 2.6 executable trap fixtures without observed-incident citations or
  human-approved fixtures;
- cleanup-plan class-I execution wiring;
- cleanup-plan `explicit_target_set` re-introduction.

ADR 0039 #9 glossary cleanup is safe but low priority. It should not displace
policy-first work.

## Workflow

### Step 0: Truth refresh

Every follow-on session starts with:

```bash
git status --short --branch
git log --oneline --decorate -12
rg -n "Current Focus|Phase 2 entry-point inventory|Future ADRs queued" PLAN.md
rg -n "Subject-kind grounding requirement|cleanup_plan|Evidence.schema_version" docs/host-capability-substrate/ontology-registry.md docs/host-capability-substrate/ontology.md
```

Stop if branch/remote state, schema-version ledger, or PLAN contradicts the
intended lane.

### Step 1: Draft ADR 0048

Draft ADR 0048 as a docs-only evaluation:

- classify future `CoordinationFact.subject_kind: machine_identity` as
  host-observation-backed only when evidence refs include
  `CredentialAuthorityObservation` / `MachineIdentityBindingObservation` with
  non-sandbox, non-self-asserted authority;
- classify project-substrate contract facts as derived/Layer-2-backed unless
  they cite independent `host-observation` evidence, or an accepted
  provider-asserted-kernel-verifiable equivalent, beyond source YAML and
  structural validation;
- classify backup-readiness facts as mixed/declarative, with `ready` requiring
  restore-drill evidence that carries boot/service verification and freshness;
- decide whether any Phase 2.7 subject needs a `CoordinationFact.subject_kind`
  enum addition now. Default answer: no enum addition unless policy/gate work
  proves the fact must be promoted as a gateable coordination fact rather than
  consumed directly as typed Evidence.

Required review for ADR 0048: `hcs-architect`, `hcs-ontology-reviewer`,
`hcs-policy-reviewer`, and `hcs-security-reviewer`.

### Step 2: Prepare the Phase 2.5 policy packet in system-config

Use ADR 0048 and existing ADRs as inputs. The policy packet should cover:

- per-`boundary_dimension` freshness windows;
- `workspace_verify` operation-class composition thresholds;
- per-product-family `permission_mode` verifier rules;
- non-PR remote-agent binding window duration;
- cross-tool exclusion-pattern conflict resolution;
- QualityGate per-`gate_kind` composition rules, freshness maxima,
  verifier-class privileges, denial-rate ceiling, and evidence-rotation
  materiality thresholds;
- Q-013 credential-plane stop conditions and credential-consumption
  prerequisites;
- Q-014 project-substrate admission policy;
- Q-015 backup-readiness lifecycle and restore-drill freshness policy;
- ADR 0047 `cleanup_plan` policy.

Output belongs in system-config, not this repo. HCS may keep a read-only
snapshot or pointer only when a future test fixture needs it.

### Step 3: Return to HCS Ring 1 read paths

Only after policy shape exists:

- implement promotion-grounding enforcement in the Ring 1 mint API when that
  API is active;
- define cleanup-plan Ring 1 construction behavior and rejection reasons;
- connect `QualityGate` evaluation to policy-backed evidence rules;
- keep adapters and hooks thin.

### Step 4: Add read-only projections

Dashboard or adapter views may follow once Ring 1 read models are concrete.
They are projections only. They do not classify, decide, mint grants, or store
policy.

### Step 5: Keep execution/provider lanes closed

Runtime injection, provider mutation, backup/restore execution, cleanup
execution, identity issuance, and OpenTofu apply paths remain class-I or
external-control-plane work. They require approval grants, audit, dashboard,
leases, and accepted operation-specific authority before implementation.

## Stop Rules

Stop and return to human review if a task:

- tries to implement policy in HCS repo files instead of system-config;
- opens broker/runtime/provider work before policy/gate consumption rules;
- treats a contract, provider label, source chunk, derived summary, lifecycle
  status, or `guardian_approval` as gate authority by itself;
- uses `ready` for backup/readiness without freshness-valid restore-drill
  evidence with boot/service verification;
- expands a docs-only ADR into schema or runtime behavior;
- edits system-config, Citadel, runner-substrate, Hetzner, HomeNetOps, GitHub,
  Proxmox, OpenTofu, or 1Password state from an HCS workspace task;
- stores resolved secret material, token fragments, provider item bodies,
  private keys, recovery codes, environment dumps, or shell history in repo
  artifacts.

## Change Log

| Version | Date | Change |
|---|---:|---|
| 0.1.0 | 2026-05-09 | Initial workflow decision for outstanding user-direction and trigger-deferred work after verifying current repo state. |
