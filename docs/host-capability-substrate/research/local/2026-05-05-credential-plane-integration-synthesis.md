---
title: Credential plane integration synthesis
category: research
component: host_capability_substrate
status: accepted-posture
version: 0.2.0
last_updated: 2026-05-05
tags: [credential-plane, onepassword, service-accounts, ssh-agent, opentofu, system-config, citadel, covenant, q-013]
priority: high
---

# Credential Plane Integration Synthesis

## Status

Accepted posture only. This synthesis preserves and normalizes
`docs/host-capability-substrate/research/external/2026-05-05-1password-credential-plane-research.md`
plus the citable 2026-05-05 Citadel guidance source note into HCS vocabulary.

This document does **not** authorize Zod schemas, generated JSON Schema,
canonical policy YAML, reconciler code, service accounts, vault inventory,
OpenTofu changes, runtime artifacts, or broker implementation. Q-013 is
accepted via ADR 0040 at the generic posture layer only; implementation remains
blocked until a follow-on accepted ADR or approved sequencing amendment
authorizes the implementation lane.

## Core Framing

HCS should model the abstract credential-plane pattern, not own the
organization-specific 1Password inventory.

- 1Password is a credential authority surface HCS models, not "the secret
  manager HCS owns."
- HCS owns typed evidence, `CredentialSource` refinement, broker contracts,
  mutation receipts, and policy gates.
- `system-config` owns workstation configuration and any future declarative
  1Password inventory location for this host.
- Citadel-owned implementation docs own organization-specific vault hierarchy,
  aliases, service-account wiring, and reconciler manifests.
- Jefahnierocks adopts the pattern under its own local authority; HCS core
  ontology must not bake in Nash, Covenant, or subsidiary vault names.

## Accepted Posture

Q-013 accepts a three-layer credential-plane pattern at posture level only:

1. **Authority of record:** 1Password or another credential authority holds
   credential material outside HCS.
2. **Control-plane reconciler:** a version-pinned, SDK-backed specification
   reconciler compares a desired-state manifest to the authority surface and
   produces typed plan/apply receipts.
3. **Runtime injection:** bounded runtime resolution through `op run`,
   `op inject`, 1Password SSH Agent, 1Password Environments, or the future
   `$HCS_BROKER_SOCKET` path. Secret values exist only in the target process
   boundary and never at rest in Ring 0 or Ring 1.

The three layers compose with, but do not replace, ADR 0012's credential broker
and ADR 0018's durable credential-source preference.

## Tension Resolutions

### 1Password vs machine identity

1Password is acceptable bootstrap/workstation custody and may hold credential
material. It is not the preferred unattended machine-identity platform.

Automation should prefer GitHub Apps, OIDC, and platform-native short-lived
credentials first. A 1Password service-account-backed credential source is a
scoped exception that requires expiry or rotation evidence, auditability,
health evidence, and approval gates. It is not blanket permission for
long-lived bearer tokens.

Human 1Password SSH Agent use remains a human interactive identity surface.
Human-supervised local agent actions may use it only with explicit human
approval in the loop. Unattended agents, CI, servers, cron jobs, and shared
automation require separate nonhuman credentials.

### SDK vs `op`

The SDK-backed reconciler is the right desired-state path, but only after the
SDK version is pinned and runtime/config evidence is captured per charter
invariant 14. The `op` CLI remains runtime read/inject compatibility and
one-off inspection. It must not become the infrastructure-as-code engine or an
untyped shell-command interface.

### Bounded `op run`

`op run` is acceptable only for bounded per-command injection. It must not wrap
login shells, daemons, long-running agent sessions, or persistent config
materialization. Environment variables are still inspectable by same-user
processes, so the correct unit is the narrow subprocess that needs the
credential.

### OpenTofu

OpenTofu may consume secret references and ephemeral secret reads. It must not
own SSH key lifecycle, service-account token lifecycle, or any path that writes
secret material into state. OpenTofu plans against credential surfaces compose
with existing `PolicyPlanReceipt` posture; provider applies compose with
`RemoteMutationReceipt`.

### Covenant live truth

The Covenant identity/account spec is `DRAFT -- Accepted for Validation`, not
ACTIVE. HCS must not describe per-entity vault isolation, scoped-token
enforcement, or entity-specific audit routing as live controls until issuance,
audit logs, workflow rewrites, and end-to-end migration proof exist. Those are
validation targets, not current HCS facts.

### HCS generic model

HCS models credential authority, sources, receipts, brokered injection, and
forbidden patterns generically. Citadel and `system-config` carry the
Nash/Jefahnierocks-specific inventory, aliases, and rollout details.

## Q-013 Accepted Scope

Q-013 accepted these sub-decision dispositions:

1. Credential-plane implementation is a Phase 2.7 / Wave-2 follow-up candidate.
   ADR 0038 is not amended.
2. No `CredentialSource.source_type` enum values are accepted by ADR 0040.
   Future extension requires implementation evidence and schema-change review.
3. `credential_plane_mutation` as a distinct operation class is rejected for
   this cycle; use `external_control_plane_mutation` unless later evidence
   proves it too coarse.
4. Reconciler manifest authority lives in `system-config` or a Citadel-owned
   implementation repo, not HCS core ontology.
5. OpenTofu credential-plane policy is absorbed by Q-013 for now; reopen as a
   separate Q-row only if state-leakage risk cannot be contained.
6. No charter invariant is added; existing invariants 5, 7, 8, 10, 14, 16, 17,
   18, and 19 are sufficient for posture.
7. 1Password is bootstrap/workstation custody; Infisical and platform-native
   short-lived credentials remain preferred for unattended machine identity.

## Implementation Blockers

Until a follow-on accepted ADR or approved sequencing amendment authorizes the
implementation lane, the following are blocked:

- `CredentialSource` discriminator schema changes for 1Password-specific kinds.
- New credential-plane evidence subtype schemas or proof composites.
- Any `credential_plane_mutation` policy row or ApprovalGrant scope extension.
- Any SDK reconciler implementation.
- Any service-account token creation, vault inventory manifest, or vault access
  mutation.
- Any OpenTofu provider change involving 1Password or credential material.
- Any runtime behavior change to `host_secret_*`, `op run`, SSH Agent, or
  Environments.

## Reviewer Dispatch

Completed before Q-013 acceptance:

- `hcs-architect`: boundary fit with ADRs 0012, 0015, 0018, 0019, 0029, 0032,
  0034, and 0038.
- `hcs-ontology-reviewer`: credential-source vocabulary, evidence subtype
  names, generic-vs-org-specific boundary, and registry placement.
- `hcs-policy-reviewer`: mutation class, grant scope, forbidden families,
  OpenTofu state-leakage policy, and system-config/Citadel ownership split.
- `hcs-security-reviewer`: service-account exceptions, human-vs-machine
  identity separation, SSH Agent socket spoofing, bounded `op run`, redaction,
  and secret-reference chunking.

## References

- External intake:
  `docs/host-capability-substrate/research/external/2026-05-05-1password-credential-plane-research.md`
- Raw external source:
  `docs/host-capability-substrate/research/external/2026-05-05-1password-credential-plane-research.raw.md`
- Citadel guidance source note:
  `docs/host-capability-substrate/research/external/2026-05-05-citadel-credential-plane-guidance.md`
- ADR 0012: `docs/host-capability-substrate/adr/0012-credential-broker.md`
- ADR 0015:
  `docs/host-capability-substrate/adr/0015-external-control-plane-automation.md`
- ADR 0018:
  `docs/host-capability-substrate/adr/0018-durable-credential-preference.md`
- ADR 0038:
  `docs/host-capability-substrate/adr/0038-phase-2-schema-landing-sequence.md`
- ADR 0040:
  `docs/host-capability-substrate/adr/0040-credential-plane-integration.md`
- Covenant identity/account management:
  `/Users/verlyn13/Organizations/the-nash-group/the-covenant/policies/specs/identity-and-account-management.md`
- Covenant SEC-005 machine identity:
  `/Users/verlyn13/Organizations/the-nash-group/the-covenant/policies/sec-005-machine-identity.md`

## Change Log

| Version | Date | Change |
|---|---:|---|
| 0.2.0 | 2026-05-05 | Recorded Q-013 acceptance via ADR 0040; posture accepted, implementation remains blocked pending follow-on acceptance. |
| 0.1.4 | 2026-05-05 | Aligned Q-013 candidate scope with ADR 0040: no credential-source enum values are accepted by this planning posture. |
| 0.1.3 | 2026-05-05 | Reworded service-account-backed source language to avoid implying a new accepted `CredentialSource.source_type` enum value. |
| 0.1.2 | 2026-05-05 | Linked proposed ADR 0040 as the Q-013 posture draft; implementation remains blocked pending review and human acceptance. |
| 0.1.1 | 2026-05-05 | Clarified candidate-only architecture wording, cited the Citadel guidance source note, and routed directive raw-source language through the external quarantine wrapper. |
| 0.1.0 | 2026-05-05 | Initial HCS synthesis of the 1Password credential-plane research and Citadel guidance; opens Q-013 planning posture and blocks implementation until acceptance. |
