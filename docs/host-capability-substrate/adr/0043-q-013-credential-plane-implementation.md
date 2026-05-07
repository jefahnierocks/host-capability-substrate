---
adr_number: 0043
title: Q-013 credential-plane implementation slice
status: proposed
date: 2026-05-07
charter_version: 1.4.0
tags: [credential-plane, credential-source, machine-identity, evidence, q-013, phase-2-7]
---

# ADR 0043: Q-013 credential-plane implementation slice

## Status

proposed

This ADR proposes the first Q-013 implementation slice after ADR 0040. It
does not authorize code changes, schema source, generated JSON Schema,
canonical policy YAML, broker/runtime behavior, reconciler code,
service-account creation, vault inventory mutation, OpenTofu changes, provider
mutation, or operation registration until accepted by the human owner and
reviewed for the touched surfaces.

## Date

2026-05-07

## Charter version

Written against charter v1.4.0.

## Context

ADR 0040 accepted Q-013 at posture level only: HCS models credential-plane
facts as generic typed evidence, not as ownership of 1Password, Infisical,
Vault, service accounts, OpenTofu state, or organization-specific vault
inventory. ADR 0040 kept `CredentialSource.source_type` as the field name,
rejected a distinct `credential_plane_mutation` operation class for this
cycle, and left implementation blocked.

The Phase 2.1-2.6 train from ADR 0038 is now recorded as landed in `PLAN.md`.
The Phase 2.7 deferred-lane sequencing plan therefore makes Q-013 the first
deferred implementation dependency. Q-014 project-substrate implementation is
downstream because project admission needs credential-source and machine
identity evidence before contract validation can cite those facts.

The existing `CredentialSource` schema already has generic source-type values
for the current credential authorities (`onepassword`, `infisical`, `vault`,
`service_account`, `brokered_secret_reference`, and related local/bootstrap
sources). The next implementation question is not "which provider names do we
add?" but "which typed evidence records make those sources usable without
storing secrets or claiming provider authority by label?"

Constraints:

- HCS must not store resolved secret material in docs, schemas, fixtures,
  generated schemas, policy snapshots, logs, or audit artifacts (charter
  invariant 5).
- HCS must not add mutating execution surfaces without the full safety stack
  of grants, audit, dashboard review, leases, and policy/gateway checks
  (invariant 7).
- HCS treats external control planes as evidence surfaces, not as operating
  authority it owns (ADR 0015 and invariant 16).
- Runtime credential scope must be execution-context-bound and explicitly
  evidenced, not inferred from a parent shell or provider label (invariant 17).
- Derived source material and provider labels are never gate authority by
  themselves (invariant 18).
- Boundary and credential claims are freshness-bound (invariant 19).

## Options considered

### Option A: Implement the full credential plane now

This option would land schema, canonical policy YAML, broker/runtime behavior,
SDK reconciler receipts, service-account issuance paths, OpenTofu rules,
machine-identity issuance, and operation registration in one Phase 2.7 packet.

**Pros:**
- Gives Q-014 and Q-015 every downstream dependency immediately.
- Minimizes the number of future ADRs.
- Could align schema, broker, policy, and runtime behavior in one pass.

**Cons:**
- Too broad for one review cycle; it mixes schema, policy, broker, external
  control-plane mutation, provider inventory, and runtime injection.
- Risks making HCS a credential control plane rather than typed evidence
  consumer.
- Increases the chance of storing or implying secret material in public HCS
  artifacts.
- Would bypass the ADR 0040 commitment that implementation needs concrete
  evidence and normal schema-change review.

### Option B: Keep Q-013 posture-only until an owning repo implements first

This option would leave HCS unchanged until `system-config`, Citadel, or
another owning repo ships a concrete credential-plane reconciler or manifest.

**Pros:**
- Avoids premature HCS schema choices.
- Keeps provider inventory and implementation details entirely in the owning
  repos.
- Lowest immediate diff in HCS.

**Cons:**
- Leaves Q-014 blocked without a citable machine-identity evidence lane.
- Pushes the shape decision into the first implementation PR, where it will be
  harder to review independently.
- Encourages future agents to treat ADR 0040's posture text as enough schema
  authority.
- Does not define the boundary between provider-specific receipts and generic
  HCS evidence.

### Option C: Authorize a narrow schema/evidence slice

This option opens only the HCS-side evidence vocabulary needed to validate
credential authority, bounded runtime injection, reconciler conformance, and
machine-identity binding. It keeps provider inventory, reconciler code,
service-account issuance, broker behavior, OpenTofu changes, and canonical
policy YAML out of this ADR.

**Pros:**
- Gives Q-014 a concrete machine-identity evidence dependency without
  provider mutation.
- Preserves `CredentialSource.source_type` and avoids unnecessary enum churn.
- Keeps the slice reviewable as Zod source, generated JSON Schema, ontology,
  registry, fixtures, and tests only.
- Makes provider labels evidence inputs, not authority.
- Maintains the ADR 0040 boundary that HCS consumes generic typed evidence and
  does not own organization-specific credential planes.

**Cons:**
- Does not implement broker/runtime enforcement.
- Does not create service accounts or reconcile vault inventory.
- Requires later policy and broker ADRs before operations can consume the new
  evidence as gate authority.
- May need a follow-on if implementation evidence proves the first receipt
  names too coarse.

### Option D: Bundle Q-013 with Q-014 and Q-015

This option would treat credential source, project-substrate admission, and
backup readiness as one Phase 2.7 implementation train.

**Pros:**
- Keeps downstream project-admission and backup-readiness contracts visibly
  aligned.
- Reduces some cross-ADR reference churn.

**Cons:**
- Recreates the same oversized scope ADR 0041 and ADR 0042 deliberately
  avoided.
- Makes machine identity, project admission, backup readiness, and teardown
  semantics depend on one review cycle.
- Increases the risk of importing Citadel/project vocabulary into HCS core
  ontology.

## Decision

Choose Option C. If accepted, Q-013 implementation v1 is a narrow
schema/evidence slice. It may add HCS generic evidence subtypes for credential
authority observation, runtime injection receipt, reconciler receipt, and
machine-identity binding observation. It must not add new
`CredentialSource.source_type` values, must not create a
`credential_plane_mutation` operation class, and must not add broker/runtime,
provider, OpenTofu, service-account, vault-inventory, or canonical policy YAML
behavior.

The implementation PR must follow `.agents/skills/hcs-schema-change`: Zod
source, generated JSON Schema, `ontology.md`, `ontology-registry.md`, tests,
and fixtures move together. Any canonical policy YAML work remains in
`system-config/policies/host-capability-substrate/` and requires a separate
accepted policy lane.

## Proposed v1 evidence scope

The implementation slice may define these HCS-side records.

### `CredentialAuthorityObservation`

Direct `Evidence` observation for the current authority posture of a
`CredentialSource`.

Expected grain: per `(credential_source_id, authority surface, observed_at)`
or tighter if a provider/API requires a narrower identity.

Purpose:

- Verify source posture without resolving credential material.
- Record source type, storage plane, scope/audience posture, expiry/rotation
  posture, health posture, and auditability evidence.
- Cite the observed `CredentialSource` record and any boundary evidence.

Constraints:

- No raw secret value, token fragment, private key material, recovery code, or
  provider item body.
- Provider-specific item/vault/project names remain in owning repos or
  reference-form fields only; HCS core enum values stay generic.
- Provider labels and source types are not gate authority by themselves.

### `CredentialRuntimeInjectionReceipt`

Direct `Evidence` receipt for a bounded runtime credential-injection event.

Expected grain: per injection attempt or per bounded invocation.

Purpose:

- Record that a narrow execution context received credential material through
  a declared injection mechanism.
- Bind the injection event to `ExecutionContext`, `CredentialSource`,
  command/tool invocation evidence when available, start/end timestamps,
  declared `secret_ref` references, and names-only environment bindings.
- Support later broker/runtime work without implementing broker behavior in
  this ADR.

Constraints:

- No resolved secret material, environment dumps, shell-history text, process
  environment captures, or long-running session wrappers.
- `op run`, `op inject`, SSH Agent, Environments, and future broker paths are
  event evidence only until a broker/runtime ADR authorizes enforcement.
- Login shells, daemons, long-running agent sessions, and persistent config
  materialization remain rejected patterns.

### `CredentialReconcilerReceipt`

Direct `Evidence` receipt for desired-state reconciliation posture from an
owning repo or external control-plane reconciler.

Expected grain: per reconciler run and action kind (`plan`, `apply`, or
`drift_check`) if the schema PR accepts a shared discriminator; split into
separate receipts if review finds the lifecycle semantics differ.

Purpose:

- Record reconciler input references, content hashes, SDK/tool provenance,
  action kind, target authority surface, redacted outcome summary, and
  mutation/result evidence refs.
- Let HCS consume a reconciler's typed conformance evidence without owning the
  manifest, SDK implementation, vault hierarchy, or apply behavior.

Constraints:

- Manifest bodies and provider-specific inventory live outside HCS or as ADR
  0036 `KnowledgeSource` references when appropriate.
- Apply behavior remains external-control-plane posture per ADR 0015 and ADR
  0029; this receipt does not create a new operation class.
- Provider mutation receipts such as future `RemoteMutationReceipt` or
  `CredentialIssuanceReceipt` remain separate follow-on work unless a reviewer
  requires them for this slice.

### `MachineIdentityBindingObservation`

Direct `Evidence` observation mapping a nonhuman identity claim to credential
authority evidence.

Expected grain: per `(machine_identity_ref, credential_source_id,
authority_surface, observed_at)`.

Purpose:

- Give Q-014 project-substrate admission a typed evidence dependency for
  machine identity without making HCS mint, rotate, or retire identities.
- Record issuer/source class, subject/audience posture, expiry/rotation
  posture, credential-source evidence refs, and execution-context binding.
- Distinguish human interactive 1Password SSH Agent use from unattended
  machine identity.

Constraints:

- HCS does not mint project identities, issue service-account tokens, register
  runners, or mutate provider identity state.
- Human 1Password SSH Agent use is not unattended machine identity.
- Service-account-backed machine identity remains a scoped exception requiring
  expiry/rotation evidence, scope evidence, health evidence, auditability, and
  approval gates.

## Consequences

### Accepts

- Q-013 v1 is schema/evidence work only; implementation PRs must be scoped to
  the named evidence records and their generated artifacts.
- Existing `CredentialSource.source_type` values are enough for this slice.
  Provider-specific refinement remains a future amendment, not a default.
- Machine identity enters HCS as evidence observation, not identity issuance.
- Runtime injection enters HCS as a receipt shape, not broker behavior.
- Reconciler output enters HCS as receipts and references, not as HCS-owned
  manifest authority or SDK implementation.
- Q-014 may proceed only after the needed Q-013 credential-source and
  machine-identity evidence lands or a later ADR changes that dependency.
- Review must include `hcs-architect`, `hcs-ontology-reviewer`,
  `hcs-policy-reviewer`, and `hcs-security-reviewer` before acceptance or
  implementation.

### Rejects

- Adding `credential_plane_mutation` as a new operation class in this slice.
- Renaming `CredentialSource.source_type` to `credential_source_kind`.
- Adding provider- or organization-specific vault/project names to HCS core
  ontology, generated schemas, fixtures, policy snapshots, or registry enums.
- Treating a provider label, source type, contract field, or reconciler status
  as gate authority by itself.
- Storing resolved secret material in HCS docs, schemas, fixtures, generated
  JSON Schema, policy snapshots, logs, audit artifacts, or ADR 0036 chunks.
- Implementing the credential broker, `host_secret_*` behavior, `op run`,
  `op inject`, SSH Agent, Environments, service-account lifecycle, OpenTofu
  provider usage, reconciler code, vault inventory, or provider mutation from
  this ADR.
- Treating human workstation custody or human SSH Agent use as unattended
  machine identity.
- Treating future `CredentialIssuanceReceipt` or `RemoteMutationReceipt` as
  accepted by implication. Those names remain follow-on ADR work unless the
  Q-013 v1 review proves they are necessary for this slice.

### Future amendments

- Reopen if implementation evidence proves a new
  `CredentialSource.source_type` value or provider-source discriminator is
  necessary.
- Reopen if `CredentialReconcilerReceipt` must split into separate plan/apply
  receipt classes.
- Reopen if `RemoteMutationReceipt` or `CredentialIssuanceReceipt` becomes a
  prerequisite for correct credential-plane audit semantics.
- Reopen if broker/runtime implementation is ready and needs to enforce
  `CredentialRuntimeInjectionReceipt` production.
- Reopen if Q-014 project-substrate implementation requires identity issuance
  evidence rather than identity-binding observation.
- Reopen if canonical policy YAML needs new gate or operation-class rules that
  cannot be handled in the `system-config` policy lane.
- Reopen if a repeated failure class shows that charter invariants 5, 7, 8,
  10, 14, 16, 17, 18, and 19 are insufficient for credential-plane work.

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md` v1.4.0
- Decision ledger: `DECISIONS.md` Q-013
- Plan: `PLAN.md` Current Focus
- Research plan:
  `~/Organizations/jefahnierocks/system-config/docs/host-capability-substrate-research-plan.md`
- ADR 0012:
  `docs/host-capability-substrate/adr/0012-credential-broker.md`
- ADR 0015:
  `docs/host-capability-substrate/adr/0015-external-control-plane-automation.md`
- ADR 0018:
  `docs/host-capability-substrate/adr/0018-durable-credential-preference.md`
- ADR 0019:
  `docs/host-capability-substrate/adr/0019-knowledge-and-coordination-store.md`
- ADR 0029:
  `docs/host-capability-substrate/adr/0029-q-008-b-anomalous-capture-blocking-thresholds.md`
- ADR 0034:
  `docs/host-capability-substrate/adr/0034-q-007-b-f-boundary-evidence-composition-quality-gate-posture.md`
- ADR 0038:
  `docs/host-capability-substrate/adr/0038-phase-2-schema-landing-sequence.md`
- ADR 0040:
  `docs/host-capability-substrate/adr/0040-credential-plane-integration.md`
- Q-013 local synthesis:
  `docs/host-capability-substrate/research/local/2026-05-05-credential-plane-integration-synthesis.md`
- Q-013 lane plan:
  `docs/host-capability-substrate/research/local/2026-05-06-q-013-implementation-lane-plan.md`
- Phase 2.7 deferred-lane sequencing:
  `docs/host-capability-substrate/research/local/2026-05-06-phase-2-7-deferred-lane-sequencing-plan.md`

### External

- 1Password SDKs:
  `https://developer.1password.com/docs/sdks/`
- 1Password Service Accounts:
  `https://developer.1password.com/docs/service-accounts/`
- 1Password CLI secret environment loading:
  `https://developer.1password.com/docs/cli/secrets-environment-variables/`
- 1Password SSH Agent security:
  `https://developer.1password.com/docs/ssh/agent/security/`
- 1Password Terraform provider:
  `https://developer.1password.com/docs/terraform/`
