# Q-013 Implementation Lane Plan

Date: 2026-05-06

Status: v1 schema/evidence slice landed. ADR 0043 authorized only
`CredentialAuthorityObservation`, `MachineIdentityBindingObservation`, and the
minimum subject/ref vocabulary required by those records; that implementation
landed on 2026-05-07 with `Evidence.schema_version` `0.9.0`. This
document does not authorize canonical policy YAML, reconciler code,
service-account creation, vault inventory, OpenTofu changes, broker changes,
runtime behavior, provider mutation, operation registration,
`CredentialRuntimeInjectionReceipt`, `CredentialReconcilerReceipt`,
`CredentialIssuanceReceipt`, or `RemoteMutationReceipt`.

## Authority

Accepted posture:

- ADR 0040:
  `docs/host-capability-substrate/adr/0040-credential-plane-integration.md`
- ADR 0043:
  `docs/host-capability-substrate/adr/0043-q-013-credential-plane-implementation.md`
- Decision ledger: `DECISIONS.md` Q-013
- Plan entry: `PLAN.md` Q-013 credential-plane posture
- Local synthesis:
  `docs/host-capability-substrate/research/local/2026-05-05-credential-plane-integration-synthesis.md`
- External credential-plane intake:
  `docs/host-capability-substrate/research/external/2026-05-05-1password-credential-plane-research.md`
- Citadel guidance source note:
  `docs/host-capability-substrate/research/external/2026-05-05-citadel-credential-plane-guidance.md`

ADR 0040 closes Q-013 at posture level. ADR 0043 opened the first Q-013
implementation slice as Phase 2.7 schema/evidence work only.

## Accepted Shape

HCS models the credential plane as three layers:

1. Authority of record.
2. Control-plane reconciliation.
3. Runtime injection.

HCS owns generic typed evidence, `CredentialSource` refinement, broker
contracts, mutation receipts, policy-gate posture, and forbidden-pattern
posture. HCS does not own provider inventory, vault hierarchy,
service-account issuance, organization-specific manifests, OpenTofu applies,
or runtime secret material.

ADR 0040 keeps `CredentialSource.source_type` as the schema field name. ADR
0043 accepts and the v1 implementation lands only two evidence subtypes:
`CredentialAuthorityObservation` and `MachineIdentityBindingObservation`. No
new credential-source enum values, operation classes, broker behavior, runtime
behavior, reconciler receipts, mutation receipts, or policy rows are accepted
by ADR 0043.

Credential-plane mutations compose through existing
`external_control_plane_mutation` posture unless a future accepted ADR proves
that path too coarse. A standalone `credential_plane_mutation` operation class
is rejected for this cycle.

## Entry Conditions

Q-013 v1 schema/evidence implementation opened because these entry conditions
were satisfied:

- Phase 2.1-2.6 schema train completed per ADR 0038.
- ADR 0043 was accepted for the exact HCS-side v1 scope: credential-source
  authority posture evidence and machine-identity binding posture evidence.
- Concrete implementation evidence exists for any requested
  `CredentialSource.source_type` refinement; none is requested by ADR 0043.
- Reviewer dispatch completed for the touched surfaces:
  `hcs-architect`, `hcs-ontology-reviewer`, `hcs-policy-reviewer`, and
  `hcs-security-reviewer`.

## Landed Work Package and Deferred Follow-ups

1. Schema and registry implementation.
   Completed by the ADR 0043 schema/evidence landing: Zod source, generated
   JSON Schema, ontology docs, ontology registry entries, fixtures, and tests
   moved together.

2. Credential authority observation.
   Completed for v1 as typed evidence for authority, source posture,
   scope/audience posture, health, expiry/rotation, provenance, and
   auditability without resolving credential material.

3. Machine identity binding observation.
   Completed for v1 as typed evidence binding a nonhuman identity claim to
   credential-source authority evidence through the ADR 0043
   `machine_identity_kind` / `machine_identity_ref` reference shape. HCS does
   not mint, rotate, retire,
   register, or mutate identities.

4. Broker and runtime contract.
   If ADR 0012 broker work is touched, prove how `host_secret_*`, future
   `$HCS_BROKER_SOCKET`, `op run`, `op inject`, SSH Agent, or Environments
   remain bounded to a narrow invocation and never wrap login shells, daemons,
   long-running agent sessions, or persistent config materialization.

5. Reconciler receipts.
   If an SDK-backed reconciler is implemented in an owning repo, define only
   the HCS evidence receipts needed to validate desired-state conformance.
   HCS must not own the org-specific vault hierarchy or reconciler manifest.

6. OpenTofu policy posture.
   Keep OpenTofu secret references and ephemeral reads separate from resolved
   secret material. Reopen a separate policy Q-row only if Q-013 cannot contain
   state-leakage risk.

7. Downstream dependency.
   Completed for Q-014/Q-015 v1: the credential-source and machine-identity
   evidence dependency exists. Future Q-013 runtime, broker, policy,
   reconciler, credential-issuance, and provider-mutation work remains blocked
   behind separate authority.

## Regression Trap Queue

Future eval fixtures should cover:

- Raw 1Password research treated as direct HCS implementation authority.
- `credential_source_kind` rename attempted instead of preserving
  `CredentialSource.source_type`.
- New `CredentialSource.source_type` enum value added without implementation
  evidence and schema-change review.
- `credential_plane_mutation` added as an operation class without reopening
  ADR 0040.
- Resolved secret material written to schemas, fixtures, docs, logs, audit
  artifacts, OpenTofu state, or generated JSON Schema.
- Service-account token treated as blanket unattended automation permission.
- Human 1Password SSH Agent treated as machine identity for CI, cron, servers,
  or shared automation.
- `op run` or `op inject` used to wrap a login shell, daemon, long-running
  agent session, or persistent config materialization.
- Org-specific vault hierarchy imported into HCS ontology, generated schemas,
  policy snapshots, or fixtures.

## Stop Rules

Stop and return to human review if a task tries to:

- expand Q-013 schema beyond ADR 0043's two accepted evidence observations and
  required subject/ref vocabulary;
- start Q-013 policy, broker, runtime, reconciler, OpenTofu, provider
  mutation, operation registration, or service-account implementation from ADR
  0043;
- create, rotate, or broaden service-account tokens from the HCS repo;
- mutate vault inventory, vault access, or organization-specific reconciler
  manifests from HCS;
- store resolved secret material in HCS docs, schemas, fixtures, policy
  snapshots, logs, generated JSON Schema, OpenTofu state, or audit artifacts;
- describe Covenant, Citadel, Nash, subsidiary, or project vault controls as
  live HCS controls without validation evidence;
- treat provider labels, source kinds, or raw source notes as gate authority
  without typed evidence and policy/gateway approval.

## Next Safe Action

Treat Q-013 v1 schema/evidence as landed and consumed by the landed Q-014 and
Q-015 schema/evidence slices. Any Q-013 runtime, policy, broker, reconciler,
provider-mutation, credential-issuance, or additional schema work still
requires a separate accepted ADR or policy lane.

## Change Log

| Version | Date | Change |
|---|---:|---|
| 0.3.1 | 2026-05-07 | Updated downstream status after Q-014 and Q-015 v1 schema/evidence slices consumed the Q-013 dependency. |
| 0.3.0 | 2026-05-07 | Recorded the ADR 0043 v1 schema/evidence landing and moved the next safe action to Q-014 implementation ADR planning. |
| 0.2.0 | 2026-05-07 | Updated after ADR 0043 acceptance; Q-013 v1 schema/evidence implementation may open with runtime, policy, provider, and reconciler work still blocked. |
| 0.1.0 | 2026-05-06 | Initial docs-only implementation-lane plan following ADR 0040 acceptance. |
