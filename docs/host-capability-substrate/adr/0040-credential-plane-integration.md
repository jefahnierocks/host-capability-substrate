---
adr_number: 0040
title: Credential-plane integration posture
status: accepted
date: 2026-05-05
charter_version: 1.4.0
tags: [credential-plane, onepassword, credential-source, service-account, broker, opentofu, q-013, phase-2]
---

# ADR 0040: Credential-plane integration posture

## Status

accepted (v1 + ontology wording patches before acceptance; one
future-amendment clarification folded at acceptance)

This ADR closes Q-013 at the generic posture layer. It does not authorize
schema source, generated JSON Schema, canonical policy YAML, reconciler code,
service accounts, vault inventory, OpenTofu changes, runtime artifacts, broker
changes, or operation registration. Those remain blocked until a follow-on
accepted ADR or approved sequencing amendment authorizes the implementation
lane.

## Date

2026-05-05 (proposed); 2026-05-05 (accepted)

## Acceptance note

All four reviewer subagents (`hcs-architect`, `hcs-policy-reviewer`,
`hcs-security-reviewer`, `hcs-ontology-reviewer`) returned ready for
acceptance on v1, with Ontology requiring wording patches that were folded and
re-reviewed clean before this acceptance. No schema, policy, reconciler,
service-account, vault, OpenTofu, broker, or runtime implementation is accepted
by this ADR.

One acceptance-time clarification was folded into §Future amendments: if
Covenant SEC-005 transitions to ACTIVE and changes the machine-identity
preference order, ADR 0040 must be re-evaluated against the active policy.

Q-013 sub-decision dispositions:

1. **Phase 2 sequencing.** Credential-plane implementation is a Phase 2.7 /
   Wave-2 follow-up candidate. ADR 0038 is not amended by this acceptance. A
   separate sequencing amendment ADR is required if implementation pressure
   accelerates the lane.
2. **`CredentialSource.source_type` enum extension.** Deferred. No new values
   are accepted by ADR 0040. Future schema work may extend the enum only after
   concrete implementation evidence and normal schema-change review per
   `.agents/skills/hcs-schema-change`.
3. **`credential_plane_mutation` as distinct operation class.** Rejected for
   this cycle. `external_control_plane_mutation` per ADR 0029 v2 is the path
   forward. A future ADR may reopen if implementation proves the existing class
   is too coarse.
4. **Reconciler manifest authority.** Lives in `system-config` or a
   Citadel-owned implementation repo. HCS core ontology does not reference
   organization-specific vault hierarchy.
5. **OpenTofu credential-plane policy Q-row.** Absorbed by Q-013 for now.
   Reopen as a separate Q-row only if state-leakage risk cannot be contained by
   Q-013 policy posture.
6. **Charter invariant.** Not added. Existing invariants 5, 7, 8, 10, 14, 16,
   17, 18, and 19 are sufficient for the planning posture.
7. **1Password vs Infisical / future machine-identity authorities.** 1Password
   is bootstrap/workstation custody. Infisical and platform-native short-lived
   credentials remain preferred for unattended machine identity per Covenant
   SEC-005 alignment. Specific composition rules are deferred to a future
   implementation ADR.

## Charter version

Written against charter v1.4.0.

## Context

The 2026-05-05 1Password credential-plane research and Citadel guidance raise
a real design dependency: HCS already models durable credential sources and a
future broker contract, but it does not yet describe how a credential authority
surface such as 1Password composes with desired-state reconciliation, runtime
secret injection, service-account exceptions, OpenTofu consumption, and machine
identity policy.

The source research is preserved in quarantine form:

- `docs/host-capability-substrate/research/external/2026-05-05-1password-credential-plane-research.md`
- raw source:
  `docs/host-capability-substrate/research/external/2026-05-05-1password-credential-plane-research.raw.md`
- Citadel guidance source note:
  `docs/host-capability-substrate/research/external/2026-05-05-citadel-credential-plane-guidance.md`
- HCS synthesis:
  `docs/host-capability-substrate/research/local/2026-05-05-credential-plane-integration-synthesis.md`

The intake produced three constraints:

1. HCS should model 1Password as a credential authority surface, not own it as
   an HCS secret manager.
2. HCS must not bake Nash, Covenant, Citadel, Jefahnierocks, subsidiary, or
   project vault names into core ontology, fixtures, or policy.
3. Covenant identity/account controls remain validation posture, not live HCS
   controls, until issuance, audit logs, workflow rewrites, and Litecky
   migration proof exist.

Existing ADRs constrain the shape:

- ADR 0012 defines the future broker behind the already-shipped
  `host_secret_*` compatibility contract.
- ADR 0015 treats external control planes as typed evidence surfaces.
- ADR 0018 defines `CredentialSource` using the current field name
  `source_type`, not the source note's `credential_source_kind`.
- ADR 0029 defines operation-class registration authority and
  `ApprovalGrant.scope` posture for external-control-plane mutations.
- ADR 0038 sequences the accepted Phase 2.1-2.6 schema landing train and does
  not include credential-plane implementation.

## Options considered

### Option A: Treat the 1Password source note as an implementation directive

HCS would directly adopt the raw note's provider-specific `CredentialSource`
values, vault hierarchy, manifest path, grant-scope sketch, forbidden patterns,
OpenTofu guidance, and landing order.

**Pros:**
- Fastest route from source research to implementation.
- Preserves the operational specificity of the raw note.
- Would give future implementers concrete names and paths immediately.

**Cons:**
- Violates the HCS generic model by importing org-specific vault names into
  core ontology and possibly fixtures.
- Turns source-author candidate wording into HCS commitments without Q-row
  acceptance.
- Risks canonical-policy drift by pre-committing grant scopes and forbidden
  patterns before the policy path is reviewed.
- Conflicts with ADR 0038 by adding a new Phase 2 implementation lane without
  an explicit sequencing decision.

### Option B: Defer all credential-plane modeling

HCS would keep ADR 0012 and ADR 0018 unchanged and leave 1Password, service
accounts, OpenTofu, and runtime injection entirely to `system-config` or
Citadel until an implementation PR forces the issue.

**Pros:**
- Avoids premature schema and policy changes.
- Keeps the current Phase 2.1-2.6 sequence untouched.
- Minimizes immediate reviewer load.

**Cons:**
- Leaves future agents with only a quarantined source note and no ADR-level
  boundary decision.
- Re-opens the same tensions when schema, policy, reconciler, or OpenTofu work
  begins.
- Does not record the machine-identity caveat that 1Password service accounts
  are scoped exceptions, not preferred unattended identity.
- Does not give `system-config` or Citadel a stable boundary to build against.

### Option C: Accept a generic credential-plane posture and keep implementation blocked

HCS records the abstract credential-plane pattern now, keeps all provider and
org inventory outside HCS, composes with existing `CredentialSource.source_type`
and `external_control_plane_mutation` posture, and defers implementation to a
later accepted schema/policy/reconciler sequence.

**Pros:**
- Gives future work a citable ADR boundary without pre-authoring schemas or
  policy YAML.
- Preserves HCS as generic substrate while allowing Citadel and
  `system-config` to carry organization-specific inventory.
- Uses current schema vocabulary (`source_type`) and ADR 0015/0029 operation
  class posture instead of inventing a parallel credential-plane class.
- Keeps ADR 0038 intact by making credential-plane work a follow-up lane unless
  the human owner explicitly amends sequencing.
- Records the machine-identity and OpenTofu constraints before tokens,
  manifests, or state paths exist.

**Cons:**
- Does not yet give implementers Zod shapes or policy rows.
- Requires another ADR or accepted amendment before any schema/policy/runtime
  work can proceed.
- Leaves exact receipt names and fixture shapes to future reviewer cycles.

### Option D: Make 1Password service accounts the default machine identity

HCS would model 1Password service-account-backed credentials as a first-class
machine-identity source and prefer them for CI, cron, servers, and shared
automation.

**Pros:**
- Simple mental model: one vendor custody plane for human and nonhuman
  credentials.
- Works for some scoped automation where a service account is the only
  practical bootstrap credential.

**Cons:**
- Conflicts with Covenant SEC-005's preference for scoped, auditable,
  preferably short-lived nonhuman credentials.
- Conflates human workstation custody with unattended machine identity.
- Encourages long-lived bearer-token shortcuts.
- Makes human 1Password SSH Agent posture look like machine identity, which it
  is not.

## Decision

HCS adopts Option C: a generic credential-plane posture. 1Password may be
modeled as an external credential authority surface, but HCS does not own
provider inventory, vault hierarchy, service-account issuance, or
organization-specific manifests. Credential-plane mutations compose through
ADR 0015/0029 external-control-plane mutation posture unless a future ADR
proves a narrower sub-discriminator is required. `CredentialSource` refinement
uses the existing `source_type` field name; Q-013 does not rename it to
`credential_source_kind`. All schema, policy, reconciler, service-account,
vault, OpenTofu, runtime, and broker implementation remains blocked until a
post-acceptance implementation sequence is explicitly approved.

## Consequences

### Accepts

- HCS models a three-layer credential-plane pattern at the posture level:
  authority of record, control-plane reconciliation, and runtime injection.
- HCS owns generic typed evidence, `CredentialSource` refinement, broker
  contracts, mutation receipts, policy-gate posture, and forbidden-pattern
  posture. Canonical policy YAML remains owned by `system-config`.
- `system-config` owns workstation configuration and any future host-level
  declarative inventory location.
- Citadel-owned implementation docs own Nash/Citadel-specific vault hierarchy,
  aliases, service-account wiring, reconciler manifests, and rollout details.
- Jefahnierocks may adopt the same pattern through local authority without HCS
  core ontology referencing Nash/Covenant context.
- `CredentialSource.source_type` remains the schema field name. The existing
  coarse values (`onepassword`, `service_account`, `brokered_secret_reference`,
  `infisical`, `vault`) are the starting point; future schema work may add
  evidence subtypes, fields, or enum values only after a follow-on accepted
  implementation ADR and normal schema-change review.
- Credential authority is evidence-bound provenance. A source kind or provider
  label does not itself promote authority; stronger facts require separate
  Evidence records with `source`, `observed_at`, `valid_until`, `authority`,
  `confidence`, `parser_version`, and runtime provenance.
- A 1Password service account is a scoped exception. It requires expiry or
  rotation evidence, scope evidence, health evidence, auditability, and approval
  gates. It is not blanket permission for long-lived bearer-token automation.
- Human 1Password SSH Agent use remains human interactive identity. It is not a
  machine-identity platform for unattended CI, cron, servers, or shared
  automation.
- Runtime injection surfaces such as `op run`, `op inject`, 1Password SSH
  Agent, and 1Password Environments are bounded to the narrow command or
  interaction that needs the credential. They must not wrap login shells,
  daemons, long-running agent sessions, or persistent config materialization.
- OpenTofu may consume secret references and ephemeral reads only under future
  accepted policy. Future policy must reject ownership of SSH key lifecycle,
  service-account token lifecycle, or any path that persists resolved secret
  material in state.
- ADR 0038 is not amended by this ADR. Credential-plane implementation is a
  Phase 2 Wave-2 / Phase 2.7 candidate unless the human owner accepts a
  separate sequencing amendment.

### Rejects

- Treating the raw 1Password research note as HCS authority.
- Storing resolved secret values in Ring 0, Ring 1, fixtures, docs, OpenTofu
  state, plan files, audit chunks, or generated schemas.
- Embedding Nash, Covenant, Citadel, subsidiary, or project vault names in HCS
  ontology, schema enums, canonical policy YAML, generated snapshots, or
  fixtures.
- Creating `credential_plane_mutation` as a distinct operation class in this
  ADR. Future work may propose a sub-discriminator or class only with evidence
  that `external_control_plane_mutation` is too coarse.
- Renaming `CredentialSource.source_type` to `credential_source_kind` in this
  ADR.
- Using 1Password service accounts as the preferred unattended machine identity
  when GitHub Apps, OIDC, or platform-native short-lived credentials are
  available.
- Describing Covenant per-entity vault isolation, scoped-token enforcement, or
  entity-specific audit routing as live HCS controls before Covenant validation
  evidence exists.
- Adding an HCS charter invariant in this ADR. Existing invariants 5, 7, 8, 10,
  14, 16, 17, 18, and 19 are sufficient for the planning posture. A future
  amendment may reopen this if implementation reveals a repeated failure class.

### Future amendments

- Reopen if a concrete implementation proves that
  `external_control_plane_mutation` cannot safely model credential-plane
  mutations without a distinct operation class or sub-discriminator.
- Reopen if `CredentialSource.source_type` proves too coarse and a schema
  extension is needed for provider-specific credential authority surfaces.
- Reopen if the SDK-backed reconciler lands in a concrete owning repo and
  exposes receipt shapes that require new Ring 0 entities or evidence subtypes.
- Reopen if OpenTofu credential-plane use needs a separate policy Q-row because
  state-leakage risk cannot be contained by Q-013 policy posture.
- Reopen if Covenant validation evidence makes per-entity vault isolation or
  scoped-token enforcement live controls that HCS must consume.
- Reopen if Covenant SEC-005 transitions to ACTIVE and the machine-identity
  preference order changes, requiring ADR 0040's rejection of 1Password service
  accounts as preferred unattended machine identity to be re-evaluated against
  the active policy.
- Reopen if repeated agent failures show that a new charter invariant is needed
  beyond the current invariant set.

## Review completion

- `hcs-architect`: ready for acceptance. Confirmed ADR 0038 sequencing,
  generic-vs-org-specific boundary, and no implementation authorization.
- `hcs-ontology-reviewer`: ready for acceptance after wording patches and clean
  re-review. Confirmed `CredentialSource.source_type` posture, no enum-value
  commitment, exact `parser_version` provenance wording, and no org-specific
  ontology leak.
- `hcs-policy-reviewer`: ready for acceptance. Confirmed no canonical-policy
  YAML drift, no `credential_plane_mutation` commitment, and no grant-scope
  extension.
- `hcs-security-reviewer`: ready for acceptance. Confirmed service-account
  exception posture, human-vs-machine identity separation, bounded runtime
  injection, raw-source quarantine, and Covenant validation posture.

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md` v1.4.0
- Decision ledger: `DECISIONS.md` Q-013
- Research plan:
  `~/Organizations/jefahnierocks/system-config/docs/host-capability-substrate-research-plan.md`
- Local synthesis:
  `docs/host-capability-substrate/research/local/2026-05-05-credential-plane-integration-synthesis.md`
- External quarantine wrapper:
  `docs/host-capability-substrate/research/external/2026-05-05-1password-credential-plane-research.md`
- Raw external source (provenance-only; do not cite as HCS authority):
  `docs/host-capability-substrate/research/external/2026-05-05-1password-credential-plane-research.raw.md`
- Citadel guidance source note:
  `docs/host-capability-substrate/research/external/2026-05-05-citadel-credential-plane-guidance.md`
- ADR 0012: `docs/host-capability-substrate/adr/0012-credential-broker.md`
- ADR 0015:
  `docs/host-capability-substrate/adr/0015-external-control-plane-automation.md`
- ADR 0018:
  `docs/host-capability-substrate/adr/0018-durable-credential-preference.md`
- ADR 0029:
  `docs/host-capability-substrate/adr/0029-q-008-b-anomalous-capture-blocking-thresholds.md`
- ADR 0038:
  `docs/host-capability-substrate/adr/0038-phase-2-schema-landing-sequence.md`
- Covenant identity/account management:
  `/Users/verlyn13/Organizations/the-nash-group/the-covenant/policies/specs/identity-and-account-management.md`
- Covenant SEC-005 machine identity:
  `/Users/verlyn13/Organizations/the-nash-group/the-covenant/policies/sec-005-machine-identity.md`

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
