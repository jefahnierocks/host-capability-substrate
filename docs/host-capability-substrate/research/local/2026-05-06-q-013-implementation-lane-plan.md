# Q-013 Implementation Lane Plan

Date: 2026-05-06

Status: planning only. This document does not authorize schema source,
generated JSON Schema, canonical policy YAML, reconciler code, service-account
creation, vault inventory, OpenTofu changes, broker changes, runtime behavior,
or operation registration.

## Authority

Accepted posture:

- ADR 0040:
  `docs/host-capability-substrate/adr/0040-credential-plane-integration.md`
- Decision ledger: `DECISIONS.md` Q-013
- Plan entry: `PLAN.md` Q-013 credential-plane posture
- Local synthesis:
  `docs/host-capability-substrate/research/local/2026-05-05-credential-plane-integration-synthesis.md`
- External credential-plane intake:
  `docs/host-capability-substrate/research/external/2026-05-05-1password-credential-plane-research.md`
- Citadel guidance source note:
  `docs/host-capability-substrate/research/external/2026-05-05-citadel-credential-plane-guidance.md`

ADR 0040 closes Q-013 at posture level only. Q-013 implementation is a Phase
2.7 / Wave-2 candidate unless a separate ADR 0038 sequencing amendment is
accepted.

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

ADR 0040 keeps `CredentialSource.source_type` as the schema field name. No new
enum values, evidence subtypes, operation classes, broker behavior, or policy
rows are accepted by ADR 0040.

Credential-plane mutations compose through existing
`external_control_plane_mutation` posture unless a future accepted ADR proves
that path too coarse. A standalone `credential_plane_mutation` operation class
is rejected for this cycle.

## Entry Conditions

Q-013 implementation should not open until all of these are true:

- Phase 2.1-2.6 schema train completes per ADR 0038, or a separate sequencing
  amendment explicitly changes that order.
- A follow-on implementation ADR is accepted for the exact HCS-side scope:
  schema, evidence, broker, runtime, policy, reconciler receipts, or
  operation-shape changes.
- Concrete implementation evidence exists for any requested
  `CredentialSource.source_type` refinement or new evidence subtype.
- Reviewer dispatch is planned for the touched surfaces:
  `hcs-architect`, `hcs-ontology-reviewer`, `hcs-policy-reviewer`, and
  `hcs-security-reviewer` as required by the synthesis approval contract.

## Future Work Packages

1. Implementation ADR.
   Define the exact HCS-side scope and explicitly compose with ADRs 0012,
   0015, 0018, 0019, 0029, 0034, 0038, and 0040.

2. Schema and registry proposal.
   If credential-source refinement is needed, move registry entries, Zod
   source, generated JSON Schema, ontology docs, tests, and fixtures together.
   Keep provider-specific or organization-specific names out of HCS core
   ontology.

3. Credential authority evidence.
   Define typed evidence for authority, scope, health, expiry/rotation, and
   provenance only when implementation evidence proves the shape. Provider
   labels do not promote authority by themselves.

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

7. Machine-identity dependency.
   Land the credential-source and machine-identity evidence needed before Q-014
   project-substrate implementation opens.

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

- start Q-013 schema, policy, broker, runtime, reconciler, OpenTofu, or
  service-account implementation before a follow-on implementation ADR is
  accepted;
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

Leave implementation blocked. The next HCS-local action is to keep Q-013 in
the Phase 2.7 / Wave-2 queue and revisit it only after Phase 2.1-2.6 completes
or a sequencing amendment is accepted. Q-014 remains downstream of the Q-013
credential-source and machine-identity evidence.

## Change Log

| Version | Date | Change |
|---|---:|---|
| 0.1.0 | 2026-05-06 | Initial docs-only implementation-lane plan following ADR 0040 acceptance. |
