---
title: Project secrets standards directive
category: research
component: host_capability_substrate
status: planning-directive
version: 0.1.0
last_updated: 2026-05-08
tags: [credential-plane, project-secrets, onepassword, github, cloudflare, jefahnierocks, happy-patterns, q-013, project-substrate]
priority: high
---

# Project Secrets Standards Directive

## Status

Planning directive for HCS/HCP-facing credential-plane work.

This document records how upcoming Jefahnierocks and Happy Patterns project
secrets standards should be interpreted from the Host Capability Substrate
perspective. It is not an implementation ADR, does not amend ADR 0040 or ADR
0043, and does not authorize schema, canonical policy YAML, broker/runtime,
provider mutation, 1Password vault mutation, service-account issuance,
OpenTofu, adapter, dashboard, hook, or operation-registration work.

## Source Context

The source standards are project-owned policy drafts for naming, storing,
using, rotating, and auditing material credentials. They introduce a common
non-secret credential-record shape:

- logical path;
- storage alias;
- runtime env var or secret name;
- runtime consumer;
- semantic owner;
- provider-side steward;
- rotation cadence;
- status;
- evidence location;
- stop rules.

They also establish these cross-project rules:

- secret values must not be committed, printed, logged, pasted into chat,
  placed in screenshots, or persisted in runtime manifests;
- names must describe actual scope;
- project credentials must not secretly span other projects, businesses, or
  provider boundaries;
- agents may read secret metadata, names, schemas, and redacted evidence when
  authorized, but must not inspect secret values or mutate provider
  credentials without bounded delegation for the exact task;
- provider-side creation, rotation, narrowing, broadening, or revocation is an
  escalation point unless a future accepted automation path exists.

## HCS Interpretation

HCS is not the owner of these project standards. HCS consumes them as
credential-plane compatibility input.

HCS should model the standards through existing generic credential-plane
vocabulary:

- `CredentialSource` represents the reference-form credential source, such as
  an `op://` storage alias or future brokered secret reference.
- `CredentialAuthorityObservation` records observed non-secret authority
  posture: semantic owner, provider steward, scope/audience, expiry/rotation,
  health, auditability, and redaction posture.
- `MachineIdentityBindingObservation` records nonhuman identity binding only
  when the credential is used by an automation identity.
- `ProjectSubstrateContractValidationReceipt` and
  `ProjectSubstrateAdmissionObservation` may cite credential evidence when a
  project admission standard requires it.
- `BackupCredentialCustodyObservation` may cite the same credential source
  when backup/restore custody depends on that secret.

The standards do not require new HCS enum values by themselves. Project and
organization names remain source data, reference-form values, or owning-repo
metadata. They must not become HCS core enum values or organization-specific
schema branches.

## Naming Model

HCS must distinguish these names:

| Name | Meaning | HCS treatment |
|---|---|---|
| Logical path | Standards-shaped authority name such as `github/jefahnierocks/macpro-mcp` | Non-secret metadata; can appear in evidence payloads or source references. |
| Storage alias | Current secret-store reference such as `op://Dev/github-mcp/token` | `CredentialSource.secret_ref` or equivalent reference-form field; never resolved. |
| Provider UI name | Dashboard-visible token name | Non-secret evidence field when observed; may differ during transition. |
| Runtime env var | Env name such as `GITHUB_PAT` or `CLOUDFLARE_API_TOKEN` | Non-secret runtime-consumer metadata; never implies value availability. |
| Secret material | PAT, API token, private key, recovery code, bearer value | Forbidden in HCS docs, schemas, fixtures, generated JSON Schema, logs, audit artifacts, and Ring 0/Ring 1 state. |

Semantic ownership and provider placement are separate facts. A credential may
be Jefahnierocks-owned while the current provider-side steward is a personal
`verlyn13` account during transition. HCS must record that as transitional
provider placement, not rewrite it into provider truth and not treat the
personal account as the semantic owner.

## Current Compatibility Examples

These examples are observed local compatibility inputs from `system-config`;
they are not HCS core ontology:

| Logical path | Current storage alias | Current provider UI name | HCS posture |
|---|---|---|---|
| `github/jefahnierocks/macpro-mcp` | `op://Dev/github-mcp/token` | `mcp-servers-macpro` | Transitional Jefahnierocks-owned MacPro GitHub MCP credential. |
| `github/jefahnierocks/macpro-dev-tools` | `op://Dev/github-dev-tools/token` | `mcp-servers-token` | Transitional Jefahnierocks local-bootstrap dev-tools credential. |
| `github/happy-patterns/macpro-mcp` | `op://Dev/github-happy-patterns/token` | `macpro-mcp-happy` | Happy Patterns GitHub MCP/local-tooling credential for `happy-patterns-org`. |
| `cloudflare/jefahnierocks/mcp` | `op://Dev/cloudflare-mcp-jefahnierocks/token` | `cloudflare-mcp-jefahnierocks` | Transitional Jefahnierocks Cloudflare MCP credential. |

`system-config` remains the owner of the workstation inventory and 1Password
metadata for this host. HCS may consume redacted evidence or non-secret
records from that repo, but HCS must not mutate that inventory from this repo.

## Argv and Runtime Injection Rule

The project standards make one rule explicit for HCS: secret values must never
be rendered into process argv.

The `mcp-remote --header "Authorization: Bearer ..."` pattern is a
credential-plane failure because it materializes bearer material into a
process-command surface that local users, process accounting, EDR, logs, and
diagnostic captures can observe. HCS should treat this as both:

- credential authority evidence that the runtime injection path is
  out-of-spec; and
- process/argv exposure evidence for incident response.

Future HCS-rendered `CommandShape` values must not carry resolved secret
material in argv. If a tool only accepts a bearer token via argv, HCS should
classify that integration as blocked or requiring a broker/proxy/provider-native
auth path before relaunch. Acceptable directions include a local broker, stdin
or template input for bounded one-shot mutation where the tool supports it,
environment variables scoped to a narrow subprocess, provider-native OAuth,
or a custom bridge that injects headers inside the process rather than in
parent argv.

## Future Policy and Gate Inputs

When policy-as-code lands for these standards, HCS should be able to report or
gate on these non-secret conditions:

- missing credential record for a material credential;
- logical path absent from the storage alias metadata;
- provider UI name that lies about scope or cannot be matched to the logical
  path;
- semantic owner and provider steward conflated;
- cross-project, cross-business, or cross-provider-boundary credential without
  an explicit exception basis;
- provider scope not verified or stale past `valid_until`;
- rotation cadence missing, expired, or contradicted by provider evidence;
- runtime consumer using argv, persistent config, logs, screenshots, or chat
  as a secret transport;
- agent asked to inspect or mutate a secret value without bounded delegation;
- project admission depending on a credential whose evidence is
  `out-of-spec`, `unknown`, stale, or secret-material-tainted.

These checks should compose with existing HCS evidence and gate posture. They
do not turn project standards, provider UI labels, `op://` aliases, or
storage-backend metadata into gate authority by themselves.

## Required HCS Trajectory

1. Preserve project standards as source/compatibility input.
2. Normalize them into generic HCS credential-plane vocabulary before any
   schema or policy proposal.
3. Keep organization-specific paths in evidence, records, fixtures, or
   owning-repo docs only; do not encode them into HCS core enums.
4. Represent secret-store paths as `SecretReference` / `CredentialSource`
   references, never as resolved material.
5. Require typed freshness and execution-context binding for any claim that a
   runtime consumer can access a credential.
6. Treat provider mutation, vault mutation, token creation, token rotation, and
   token narrowing as external-control-plane mutation requiring future
   accepted authority.
7. Preserve the distinction between human workstation credentials and
   unattended machine identities.

## Stop Rules

Stop and return to human review if a task tries to:

- implement project-secret standards as HCS schema or policy without a
  follow-on accepted ADR or policy lane;
- mutate 1Password, GitHub, Cloudflare, provider dashboards, service accounts,
  or OpenTofu state from the HCS repo;
- import Jefahnierocks, Happy Patterns, Nash, Covenant, or provider-specific
  vault hierarchy into HCS core ontology;
- store or echo resolved secret material, token prefixes, private key
  material, recovery codes, shell history, raw provider item bodies, or
  screenshots in HCS artifacts;
- treat an `op://` alias, provider UI name, or project standard as sufficient
  gate authority without typed evidence and policy/gateway acceptance;
- claim a credential is compliant when its provider scope, runtime consumer,
  semantic owner, provider steward, cadence, status, or stop rules are
  unverified;
- relaunch or recommend an integration that passes bearer material in argv.

## Next Safe Action

Keep this directive as Q-013 compatibility input. The next HCS-side work, if
needed, is a follow-on credential-plane ADR or policy lane that maps the
standards to existing `CredentialSource`, `CredentialAuthorityObservation`,
`QualityGate`, and project-substrate evidence without changing provider
credentials or storing secret material.

## Change Log

| Version | Date | Change |
|---|---:|---|
| 0.1.0 | 2026-05-08 | Initial HCS/HCP directive for upcoming project secrets standards and the MCP bearer argv incident implications. |
