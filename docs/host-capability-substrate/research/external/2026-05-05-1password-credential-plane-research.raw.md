The path I’d take: **stop trying to make `op` itself your IaC engine**. Use 1Password as the system of record, but manage it with a small desired-state layer using the **official Python SDK**, and reserve `op` for runtime secret injection, shell plugins, and one-off inspection.

For your Mac/zsh setup, the clean architecture is:

```text
Git repo / dotfiles
  ├── desired secret/item manifests     # no secret values
  ├── 1Password SSH agent config
  ├── .env.op / environment templates
  └── small reconciler script using official 1Password Python SDK

1Password
  ├── shared Infra / Dev / Prod vaults
  ├── SSH Key items
  ├── API credentials / DB creds / tokens
  └── Environments where useful

Runtime
  ├── op run / op inject / Environments
  ├── 1Password SSH Agent
  ├── shell plugins for CLIs
  └── service accounts for CI/shared automation
```

1Password’s official SDKs now support local desktop-app authorization, service-account auth, item management, vault/access operations, and secret loading; the SDK docs also explicitly support Python. The catch is that the SDKs are still version 0, so pin the SDK version and expect occasional breaking changes. ([1Password Developer][1]) 

## My recommendation for your use case

Build or refactor your custom Python script into an **official SDK-backed reconciler**, not a raw wrapper around `op`.

That means your script should read a declarative manifest, compare it to 1Password, and apply only safe changes. It should never store actual secret values in Git.

Example repo shape:

```text
onepassword-iac/
  op.yaml
  op.lock.json
  env/
    dev.env.op
    prod.env.op
  ssh/
    agent.toml
  scripts/
    opctl.py
```

Example manifest:

```yaml
vaults:
  - name: Infrastructure
  - name: Development
  - name: Production

items:
  - name: github-work-ed25519
    vault: Infrastructure
    category: ssh_key
    tags: [iac, ssh, github]
    key:
      algorithm: ed25519
      generate: create-only

  - name: app-prod-db
    vault: Production
    category: database
    tags: [iac, app, prod]
    fields:
      username: app_user
      password:
        generate: create-only
        length: 40

  - name: openai-api
    vault: Development
    category: api_credential
    tags: [iac, api]
    fields:
      token:
        manual: true
```

The reconciler behavior should be conservative:

```text
create missing vaults/items
update names, tags, URLs, labels, non-secret metadata
generate passwords/keys only on create or explicit rotation
never print secret values
never overwrite manually managed fields unless marked managed: true
archive rather than delete
write UUIDs to op.lock.json so renames do not break references
```

This gives you IaC ergonomics without pretending secret values are normal config.

## SSH keys: use the 1Password SSH Agent, not exported key files

For SSH, the right official path is **1Password SSH Agent + `agent.toml` + normal OpenSSH config**.

The agent is designed so private keys stay in 1Password; SSH clients can use the keys, but they do not read the private key material directly, and key use requires authorization. ([1Password Developer][2])

Create:

```toml
# ~/.config/1Password/ssh/agent.toml

[[ssh-keys]]
vault = "Infrastructure"
item = "github-work-ed25519"

[[ssh-keys]]
vault = "Infrastructure"
item = "prod-bastion-ed25519"

[[ssh-keys]]
vault = "Development"
item = "lab-server-ed25519"
```

The agent config file is the part that makes this feel like IaC: it lets you choose keys from specific vaults/accounts, control ordering, and share/sync the config separately from the 1Password app. 1Password also recommends using item/vault IDs instead of names when you do not want plaintext metadata in the file. ([1Password Developer][3])

On macOS, I’d also normalize the socket path so your dotfiles stay clean:

```zsh
mkdir -p ~/.1password

ln -sf "$HOME/Library/Group Containers/2BUA8C4S2C.com.1password/t/agent.sock" \
  "$HOME/.1password/agent.sock"
```

Then in `~/.ssh/config`:

```sshconfig
Host github-work
  HostName github.com
  User git
  IdentityAgent ~/.1password/agent.sock
  IdentityFile ~/.ssh/github-work.pub
  IdentitiesOnly yes

Host prod-bastion
  HostName bastion.example.com
  User jake
  IdentityAgent ~/.1password/agent.sock
  IdentityFile ~/.ssh/prod-bastion.pub
  IdentitiesOnly yes
```

The `IdentityFile` here is the **public key file**, not the private key. It helps OpenSSH pick the right key and avoids the common “too many authentication failures” / six-key `MaxAuthTries` problem. 1Password’s advanced SSH docs explicitly call out this pattern. ([1Password Developer][4])

For agents or automation, set 1Password’s SSH-agent authorization to be stricter rather than looser. The agent supports per-key/app/default authorization behavior and per-terminal-session approval, which is exactly what you want when AI agents or scripts can issue SSH/Git commands. ([1Password Developer][5])

## The `op` CLI limitation you’re feeling is real

For SSH keys, `op` is not a full CRUD interface. Official docs show that `op item create --category ssh` can generate a new SSH key, but importing existing SSH keys is routed through the desktop app. The CLI reference also notes that `op item edit` cannot edit SSH keys. ([1Password Developer][6])

The SDK is more promising for your IaC layer. The official SDK item-management docs include `SshKey` as a supported category and `SSHKey` as a supported field type. For SSH key fields, the value must be a decrypted PEM-encoded private key, and 1Password generates the public key, fingerprint, and key type. ([1Password Developer][7])

So the split should be:

```text
Create/manage SSH Key items:
  official SDK reconciler

Use SSH keys:
  1Password SSH Agent

Avoid:
  exporting private keys to disk
  relying on op item edit for SSH
  stuffing private keys into Terraform state
```

## Runtime secrets: use secret references or Environments

For apps, CLIs, and local dev, use `op://` secret references and `op run`.

Example `env/dev.env.op`:

```dotenv
DATABASE_URL=op://Development/app-dev-db/url
OPENAI_API_KEY=op://Development/openai-api/token
GITHUB_TOKEN=op://Development/github/api-token
```

Run:

```zsh
op run --env-file env/dev.env.op -- pnpm dev
op run --env-file env/dev.env.op -- python app.py
```

Secret references let you keep templates in source control while resolving values at runtime. `op run` scans environment variables for secret references and injects the resolved values only into the subprocess. `op inject` does the same idea for config files. ([1Password Developer][8])

One caution: environment variables are still environment variables. 1Password’s docs warn that processes running as the same user may be able to inspect another process’s environment, so use `op run` narrowly around the command that needs the secret, not as a giant login-shell wrapper. ([1Password Developer][9])

For newer workflows, look at **1Password Environments** too. They support local `.env`-style workflows without storing plaintext on disk, CLI/SDK reads, service-account access, and an agent hook that validates locally mounted `.env` files before supported AI agents execute shell commands. ([1Password Developer][10])

Example:

```toml
# .1password/environments.toml
mount_paths = [".env", ".env.local"]
```

That is useful when Cursor, Claude Code, GitHub Copilot, Windsurf, or similar tools can run shell commands in your repo.

## Terraform and Pulumi: useful, but not the whole answer

The 1Password Terraform provider can reference, create, and update items using Connect, a service account, or the desktop app. It currently exposes `onepassword_item` as the main resource. ([1Password Developer][11])

But for actual managed resources, the Terraform provider’s item categories are limited to `login`, `password`, and `database`, so it is not the right primary tool for SSH-key lifecycle management. ([1Password Developer][11])

Terraform is best here for **consuming** secrets or managing simple secret items around infrastructure, especially with newer ephemeral/write-only patterns. The provider’s ephemeral item resource can retrieve values without storing them in state, including SSH-related fields such as `private_key_openssh` and `public_key`. ([1Password Developer][11])

Be very careful with Terraform state. HashiCorp’s own docs warn that state can contain sensitive data, and “sensitive” markings do not magically encrypt or remove values from state; ephemeral and write-only patterns are the safer direction. ([HashiCorp Developer][12])

Pulumi’s 1Password provider is similar in spirit and supports service-account, Connect, or account-based auth. Pulumi ESC also has a 1Password secrets provider that can dynamically import secrets, including references with `?ssh-format=openssh`, but Pulumi’s docs label that provider as preview. ([1Password Developer][13])

My practical split:

```text
Use Terraform/Pulumi for:
  - referencing secrets in infra workflows
  - simple login/password/database items
  - ephemeral secret reads
  - wiring cloud resources to 1Password references

Use the Python SDK reconciler for:
  - SSH Key items
  - richer item categories
  - vault/item/tag conventions
  - desired-state checks
  - custom policy around rotation and drift
```

## Service accounts vs desktop auth vs Connect

For your MacBook local workflow, use **desktop-app auth** with the SDK. You get Touch ID / local approval and user-specific auditability.

For CI or shared automation, use a **1Password Service Account** scoped to dedicated vaults and Environments. Service accounts are specifically intended for automation, least privilege, CI/CD, infrastructure secrets, and workflows not tied to a personal user. ([1Password Developer][14])

Important: service accounts cannot access built-in Personal, Private, or Employee vaults, so move automation-managed secrets into dedicated shared vaults like:

```text
Infrastructure
Development
Production
SSH
```

Connect is the heavier option: self-hosted, private REST API, lower latency, more control, and no repeated 1Password API dependency after the first fetch. Service accounts are simpler and usually enough unless you need self-hosting, high-volume access, or stricter network boundaries. ([1Password Developer][15])

## Shell plugins: useful for auth flows, not a full IaC model

Since you use zsh, 1Password Shell Plugins are worth enabling for common CLIs. They support zsh and can authenticate third-party CLIs with Touch ID / Apple Watch / system auth while storing credentials in 1Password. ([1Password Developer][16]) 

They are great for tools like GitHub, AWS, OpenAI, Terraform, Pulumi, etc. They are not your desired-state engine. For an unlisted CLI, 1Password lets you build a custom shell plugin, but those are written in Go and are mainly about provisioning credentials into CLI invocations, not managing 1Password inventory. ([1Password Developer][17])

## AI agents

For agents that need browser logins, **1Password Agentic Autofill** is a separate feature. It lets an agent request website autofill through 1Password with your approval; the agent does not directly handle the secret, cannot list your items, and cannot modify items. Today, the docs frame it around Browserbase Director early access, so I would not treat it as your local CLI/IaC solution. ([1Password Developer][18]) 

For local command-running agents, the safer pattern is:

```text
No long-lived plaintext .env files
No private SSH keys on disk
Use op run per command
Use 1Password SSH Agent prompts
Use dedicated low-privilege vaults
Use Environments + agent hook where supported
```

## Concrete migration plan

1. **Create shared vaults**
   Make `Infrastructure`, `Development`, `Production`, and optionally `SSH`. Do not use your Private vault for anything that service accounts or CI need.

2. **Turn on the right local integrations**
   You already have CLI developer mode on. Also verify the desktop app setting for SDK/app integration and the SSH Agent.

3. **Move SSH usage to agent-managed keys**
   Put SSH keys in 1Password as SSH Key items. Configure `~/.config/1Password/ssh/agent.toml`. Use public key files plus `IdentityFile` in `~/.ssh/config` to pin keys per host.

4. **Replace the custom Python secret plumbing with the official Python SDK**
   Keep your script, but make it an SDK-backed reconciler with `plan`, `apply`, `rotate`, and `audit` commands.

5. **Use `op://` references for app runtime**
   Store `.env.op` templates in Git. Run apps with `op run --env-file ... -- command`.

6. **Use service accounts only where automation truly needs them**
   For CI, issue a narrowly scoped service account token. For local work, prefer desktop authorization.

7. **Use Terraform/Pulumi selectively**
   Let them consume secrets or manage simple items. Do not make Terraform the owner of SSH private key material.

The bottom line: **official, IaC-ish 1Password is now a hybrid**. The best version is SDK for reconciliation, SSH Agent for key use, secret references/Environments for runtime injection, service accounts for CI, and Terraform/Pulumi only where their provider model fits cleanly.

[1]: https://developer.1password.com/docs/sdks/ "1Password SDKs | 1Password Developer"
[2]: https://developer.1password.com/docs/ssh/agent/ "1Password SSH agent | 1Password Developer"
[3]: https://developer.1password.com/docs/ssh/agent/config/ "SSH agent config file | 1Password Developer"
[4]: https://developer.1password.com/docs/ssh/agent/advanced/ "Advanced use cases | 1Password Developer"
[5]: https://developer.1password.com/docs/ssh/agent/security/ "About 1Password SSH Agent security | 1Password Developer"
[6]: https://developer.1password.com/docs/cli/ssh-keys/ "Manage SSH keys | 1Password Developer"
[7]: https://developer.1password.com/docs/sdks/manage-items/ "Manage items using 1Password SDKs | 1Password Developer"
[8]: https://developer.1password.com/docs/cli/secret-reference-syntax/ "1Password CLI Secret Reference Syntax | 1Password Developer"
[9]: https://developer.1password.com/docs/cli/secrets-environment-variables/ "Load secrets into the environment | 1Password Developer"
[10]: https://developer.1password.com/docs/environments/ "1Password Environments (beta) | 1Password Developer"
[11]: https://developer.1password.com/docs/terraform/ "Use the 1Password Terraform provider | 1Password Developer"
[12]: https://developer.hashicorp.com/terraform/language/manage-sensitive-data?utm_source=chatgpt.com "Manage sensitive data in your configuration | Terraform"
[13]: https://developer.1password.com/docs/pulumi/ "Use the 1Password provider for Pulumi | 1Password Developer"
[14]: https://developer.1password.com/docs/service-accounts/ "1Password Service Accounts | 1Password Developer"
[15]: https://developer.1password.com/docs/secrets-automation/ "1Password Secrets Automation | 1Password Developer"
[16]: https://developer.1password.com/docs/cli/shell-plugins/ "1Password Shell Plugins | 1Password Developer"
[17]: https://developer.1password.com/docs/cli/shell-plugins/contribute/ "Build your own shell plugins (beta) | 1Password Developer"
[18]: https://developer.1password.com/docs/agentic-autofill "1Password Secure Agentic Autofill | 1Password Developer"


---

---

title: HCS Credential Plane Integration — 1Password Authority Surface, IaC Reconciler, and Specification-Driven Vault Structure
category: research
component: host_capability_substrate
status: active
version: 0.1.0
last_updated: 2026-05-04
tags: [research, credential-plane, 1password, op-cli, sdk-reconciler, ssh-agent, service-accounts, opentofu, specifications, q-013-candidate, phase-1-synthesis]
priority: high

---

# HCS Credential Plane Integration

## Status

Phase 1 synthesis-window planning evidence. This document does not author Zod schemas, generated JSON Schema, canonical policy YAML, OpenTofu modules, reconciler source code, vault inventory, service-account tokens, or any runtime artifacts. It commits posture only and stages the integration of 1Password as the authoritative credential plane against the existing HCS ontology, charter invariants, and accepted ADRs.

The purpose is to keep candidate names, authority assignments, and operation-class boundaries from hardening into incompatible Ring 0 shapes before reviewer dispatch and before Q-013 deliberation opens.

## Problem

The existing HCS posture has a partial credential plane:

- **D-028** commits the `host_secret_*` shell contract (`host_secret_read`, `host_secret_export`, `use_host_secrets`, `host_secret_diag`) and the `HCS_SECRET_*` env-var namespace including `HCS_BROKER_SOCKET` for the future broker path. Backend today is direct `timeout "$HCS_SECRET_TIMEOUT" op read`; backend post-broker is the same callers speaking to `$HCS_BROKER_SOCKET`. ADR 0012 is the broker decision (deferred Phase 1 implementation).
- **ADR 0018** establishes `CredentialSource` as a no-suffix Ring 0 entity (Q-011 bucket 2) with durable lifecycle, health, and rotation. The entity exists; the discriminator vocabulary for *kinds* of credential authority does not.
- **Charter invariant 5** forbids secret values in Ring 0 / Ring 1 at rest; references (`op://` URIs) are permitted. ADR 0019 v3 §Secret-referenced sources extends this to derived retrieval (label propagation, embedding-eligibility nullification, label-upgrade chunk-invalidation).
- **ADR 0034 v2 GitIdentityBinding** typed-FKs `git_signing_key_id` to `CredentialSource` rather than carrying a raw string — the first concrete consumer of a typed credential reference in evidence shape.
- **ADR 0015** classifies external control planes as evidence-producing surfaces with `CredentialIssuanceReceipt`, `RemoteMutationReceipt`, and validator-binding patterns. 1Password is a control plane that has not yet been modeled at this granularity.

The gap: **HCS treats secret reads as evidence-bound but does not yet treat secret-inventory mutations as control-plane operations**. When the user runs an `op` command that creates a vault item, that is structurally a control-plane mutation against an external authority surface — same family as a Cloudflare API call (ADR 0015 territory) — but the existing ontology has no typed receipt for it. Likewise, the SSH Agent surface, Service Account scoping, and the `.env.op` template/runtime split are first-class authority surfaces with no typed evidence.

This document commits the integration posture before any of that becomes Zod source.

## Naming discipline

Binding throughout this document, downstream PRs, and agent guidance:

- **Use:** "credential plane" (the authority surface managed by the broker and SDK reconciler), "credential authority" (the abstract role 1Password / Infisical / GitHub Actions Secrets / Keychain play), "credential source" (Ring 0 entity per ADR 0018), "secret reference" (`op://` URI; never the resolved value), "credential broker" (the future `$HCS_BROKER_SOCKET` surface from ADR 0012), "vault inventory specification" (the declarative manifest the SDK reconciler reads), "specification reconciler" (the SDK-backed apply layer; never "secret manager" or "secret store" because those terms drift toward storage-system framing).
- **Never:** "password manager" (drifts toward end-user product framing), "secret store" (drifts toward storage authority), "vault sync" (drifts toward filesystem-replication framing), "credential cache" (drifts toward kernel-broker overlap), "secret IaC" (drifts toward Terraform/state-file semantics), "raw `op` wrapper" (drifts toward shell-string-as-operation, charter inv. 2 territory).

## Three-layer credential plane architecture

The credential plane composes (does not substitute) with the existing three-layer HCS architecture from ADR 0019 v3. It is itself three layers:

**Layer α — Authority-of-record (1Password).** The system of record for all credential material: passwords, tokens, API credentials, SSH private keys, database credentials, certificate material, and per-environment configuration. Vault structure mirrors organizational hierarchy (see §Vault structure specification below). 1Password's storage authority is external to HCS; HCS treats 1Password as an external control plane per charter invariant 16.

**Layer β — Control-plane reconciler (1Password Python SDK).** The desired-state-versus-observed-state apply layer. Reads the vault inventory specification (declarative YAML manifest), compares to live 1Password state, applies safe mutations (create vaults, create items, update non-secret metadata, generate keys/passwords on create-only, archive on remove). Authored against the official 1Password Python SDK (currently version 0; pin the SDK version per charter invariant 14 authority order). The reconciler operations are typed `external_control_plane_mutation` class per ADR 0029 v2; receipts compose with `RemoteMutationReceipt` and `CredentialIssuanceReceipt` from ADR 0015.

**Layer γ — Runtime injection (op CLI + SSH Agent + Environments + brokered `host_secret_*`).** The bounded-execution surface that consumes secret references and resolves them to plaintext only inside a target subprocess's environment. Backend today is `op run` / `op inject` / 1Password SSH Agent / 1Password Environments (beta); backend post-ADR-0012-broker is the `$HCS_BROKER_SOCKET` socket consumed by `host_secret_*` callers. The runtime injection layer is what charter invariant 5 calls "references yes, values no" — values exist only in the resolved subprocess environment, never in any HCS Ring 0 / Ring 1 record at rest.

The three layers compose: a reconciler operation (Layer β) creates a vault item in 1Password (Layer α); a runtime tool (Layer γ) references that item by `op://` URI and resolves it inside a subprocess. None of the three layers replace the others. The Layer α / β / γ split mirrors the Layer 1 / 2 / 3 split from ADR 0019 v3 and uses the same compositional discipline.

## Vault structure specification

The user's organization manages specifications. The vault inventory is itself a specification — a declarative YAML manifest stored in version control (without secret values), read by the Layer β reconciler, and treated as a typed `KnowledgeSource` per ADR 0019 v3.

### Vault hierarchy aligned to Nash Group structure

The Nash Group framework (Covenant / Citadel / Nexus) and subsidiary projects map onto vault structure as follows:

- `Nash Group / Infrastructure` — shared infrastructure credentials owned by Citadel (Hetzner server access, Synology NAS, Cloudflare Zero Trust, Tailscale auth, Proxmox console). Service-account-accessible. Authoritative for cross-project shared infra.
- `Nash Group / Development` — non-production credentials for active development across all subsidiary projects.
- `Nash Group / Production` — production credentials for deployed services. Strictest service-account scoping.
- `Nash Group / SSH` — SSH Key items consumed by the 1Password SSH Agent. Distinguished from password vaults because SSH Agent reads from this surface specifically; agent.toml binds to vault by name or UUID.
- `Citadel / Operations` — Citadel-internal operations credentials (broker tokens, audit-checkpoint signing keys, dashboard tokens per D-018). Restricted access.
- `Happy Patterns LLC / *` — project-scoped vaults for ScopeCam, Android development tooling, InterTest licensing operations.
- `Budget Triage / *`, `Flux Pro Shop / *`, `Ship Game / *`, `llm-gateway / *` — per-project vaults for active subsidiary projects.
- `Personal` — personal-vault material; **excluded from any service-account scope** per 1Password's Personal/Private/Employee vault automation prohibition. Service accounts cannot reach this vault by design; this is correct posture for the credential plane.

### Vault inventory specification (declarative manifest)

The vault inventory specification lives at `system-config/credential-plane/onepassword-iac/op.yaml` (canonical location matches the existing canonical-policy boundary from D-004). The HCS repo vendors a snapshot for tests at `packages/fixtures/credential-plane/` per the existing public-source/private-deployment boundary (D-018). The manifest carries no secret values; it carries names, vault assignments, categories, tags, generation policy, and authority-source references.

Manifest shape (illustrative, not committing Zod):

```yaml
# system-config/credential-plane/onepassword-iac/op.yaml
specification_version: 0.1.0
specification_kind: vault_inventory

vaults:
  - name: "Nash Group / Infrastructure"
    description: "Citadel-owned shared infrastructure credentials"
  - name: "Nash Group / SSH"
    description: "SSH Key items for 1Password SSH Agent"
  - name: "Citadel / Operations"
    description: "Broker tokens, audit-signing keys, dashboard tokens"

items:
  - name: github-verlyn13-ed25519
    vault: "Nash Group / SSH"
    category: ssh_key
    tags: [iac, ssh, github, verlyn13]
    key:
      algorithm: ed25519
      generate: create_only

  - name: hcs-broker-audit-signing
    vault: "Citadel / Operations"
    category: ssh_key
    tags: [iac, broker, audit, hcs]
    key:
      algorithm: ed25519
      generate: create_only

  - name: budget-triage-prod-database
    vault: "Budget Triage / Production"
    category: database
    tags: [iac, db, prod]
    fields:
      hostname: postgres.budget-triage.prod
      port: "5432"
      username: app_user
      password:
        generate: create_only
        length: 40
```

The manifest is a Layer β control-plane specification. The Layer α authority is 1Password itself; the manifest is the agent's claim about what should exist there.

### Specification as `KnowledgeSource` in HCS terms

The `op.yaml` manifest is registered in the Layer 3 retrieval index per ADR 0019 v3 with new candidate `source_kind` extension `vault_inventory_specification`. Per the §Secret-referenced sources rules, it carries `security_label: internal` if it contains no `op://` references, OR `security_label: secret_referenced` if any field includes a secret reference (which is rare in the manifest itself; secret references typically appear in the `.env.op` runtime templates, not the inventory specification). Re-indexing label-recheck applies; label-upgrade chunk-invalidation applies. The chain-promotion rule applies — the manifest's chunks are display-only and cannot reach gate-record-producing pipelines; the typed evidence pathway is the SDK reconciler's mint-API path, not retrieval-derived chunks.

Adjacent specifications under the same canonical location:

- `system-config/credential-plane/ssh/agent.toml` — 1Password SSH Agent config; `source_kind: ssh_agent_specification`
- `system-config/credential-plane/environments/*.toml` — 1Password Environments mount specifications; `source_kind: environment_specification`
- `system-config/credential-plane/env-templates/*.env.op` — runtime template files with `op://` references; `source_kind: env_template_specification`; `security_label: secret_referenced` per the reference-form-only chunking rule

These specification kinds compose with the existing `audit_profile` and `cycle_history` extensions queued in ADR 0036.

## CredentialSource refinements

ADR 0018 commits `CredentialSource` as a no-suffix Ring 0 entity. This document commits the discriminator vocabulary that the schema PR will land per `.agents/skills/hcs-schema-change`. **Posture only**; no Zod source.

### `credential_source_kind` discriminator (closed enum, ontology-controlled)

Reserved values for the registry follow-up entry (parallel to `§Predicate-kind vocabulary` from ADR 0019 v3 and `§Boundary dimension registry` from ADR 0022):

- `onepassword_desktop_auth` — Layer β SDK using local desktop-app authorization with Touch ID. Best for human-in-the-loop integrations on the user's MacBook M3 Max. Authority class: `host-observation` (the desktop app's authorization flow is host-bound).
- `onepassword_service_account` — Layer β/γ token-based authentication for automation, CI, shared building. Vault scope is fixed at token-mint time per service-account permission grants. Authority class: `derived` from the service-account permission grant; the broker may promote to `host-observation` when the token is consumed inside the kernel broker process per ADR 0012.
- `onepassword_connect_server` — self-hosted Connect server (deferred for Phase 1; reserved for future multi-host or high-throughput scenarios). Authority class: `host-observation` if the Connect server runs on the host; `derived` if remote.
- `onepassword_ssh_agent` — distinct credential source kind because SSH key authority composes separately from password/token authority. Authority class: `host-observation` (the SSH Agent is a local Unix domain socket).
- `onepassword_environment_mount` — Environments (beta) locally mounted `.env` files. Authority class: `host-observation` (mount is local, plaintext is not written to disk per the Environments contract).
- `github_actions_secret` — GitHub Actions secret store. Authority class: `derived`. Composes with ADR 0033 v2 `StatusCheckSourceObservation` and Q-005 runner receipts when the secret is consumed inside a self-hosted runner.
- `infisical_machine_identity` — existing Infisical integration for project/production secrets. Authority class: `derived`; composes with the user's existing Infisical machine-identity workflow.
- `keychain_local` — macOS Keychain. Authority class: `host-observation` for items present in the user's login keychain.
- `direnv_env_provenance` — direnv-injected environment values. Authority class: `derived`; references composed with ADR 0016 `EnvProvenance`. NOT a value source — direnv resolves to a credential source (typically `onepassword_*`) and HCS records the provenance chain.

### Authority discipline per kind

Per registry v0.3.2 §Producer-vs-kernel-set:

**Kernel-set fields on `CredentialSource`:**
- `credential_source_id` (primary key)
- `credential_source_kind` discriminator (kernel-set after producer assertion is verified)
- `health_state: healthy | degraded | unreachable | unauthorized` (kernel-set from observed probes per ADR 0018)
- `last_observed_at` (kernel-set freshness anchor)
- `last_rotation_at` (kernel-set when rotation events are observed)
- `mutation_scope` (resolved at registration time; kernel-set per ADR 0018's existing posture)
- `audience_binding_evidence_ref` (kernel-set FK to `AudienceValidationBinding` per ADR 0015 when applicable)

**Producer-asserted, kernel-verifiable:**
- `vault_scope_refs` (array of vault names or UUIDs the source can reach; verifiable via SDK list operations against the source)
- `permission_mode_kind` (read-only | read-write | read-write-share; verifiable via SDK whoami / token introspection)
- `service_account_token_ref` (a `SecretReference` per ADR 0015's typed-slot discipline; never raw token value)
- `desktop_app_account_uuid` (for desktop-auth sources; verifiable via `op account list --format json`)
- `agent_socket_path` (for SSH agent sources; verifiable via socket stat)

**Fixed at construction:**
- `credential_source_kind` cannot mutate; rotation creates a new `CredentialSource` record and links via lineage chain.

### Composition with existing ADR 0034 v2 GitIdentityBinding

ADR 0034 v2 binds `git_signing_key_id` as a typed FK to `CredentialSource`. Under the discriminator vocabulary above, the resolved `CredentialSource` for a Git signing key is typically `credential_source_kind: onepassword_ssh_agent` — the SSH Agent is the surface that mediates the signing operation. The §Path canonicalization rule from ADR 0034 v2 applies to the agent socket path (canonicalize to `${HOME}/.1password/agent.sock` placeholder form per the existing path-placeholder vocabulary). The subtype-level redaction floor (`redaction_mode != none`) per ADR 0034 v2 §Sub-decision (c) propagates: any `CredentialSource` with `credential_source_kind: onepassword_*` carries a redaction floor at Layer 1 mint API.

## SDK reconciler operations as `external_control_plane_mutation` class

Per ADR 0029 v2 §Operation classes class 4 (`external_control_plane_mutation`), the SDK reconciler's create/update/archive operations against 1Password are typed at the operation-class boundary, NOT the receipt-consumption boundary. The matrix cells from ADR 0029 v2 apply (block for capture_failure / abnormal_termination / authority_self_asserted / mode_unknown / producer_class_forgery / cross_receipt_inconsistency; warn for empty_apparent_success / capture_truncated_at_cap).

### `ApprovalGrant.scope` per-class extension for `credential_plane_mutation`

A new operation class `credential_plane_mutation` is reserved as a specialization of `external_control_plane_mutation` (Q-013 sub-decision territory). The grant scope binds:

- `operation_class: "credential_plane_mutation"`
- `target_credential_source_id` (typed FK to the `CredentialSource` representing the SDK reconciler's authority)
- `target_vault_ref` (vault name or UUID being mutated; per-vault grain matches 1Password's authorization grain)
- `target_item_ref` (item name or UUID for item-scoped mutations; null for vault-scoped operations)
- `mutation_kind: create_vault | create_item | update_metadata | update_field | rotate_key | archive_item | manage_access` (closed enum)
- `execution_context_id` (per registry v0.3.0 §Cross-context enforcement layer)

The discriminator-disjointness rule from ADR 0019 v3 / ADR 0031 v1 applies: scope keys for `credential_plane_mutation` are disjoint from `worktree_mutation`, `destructive_git`, `merge_or_push`, and `external_control_plane_mutation` per-class extension keys. Canonical policy YAML at Milestone 2 enforces.

### New `Decision.reason_kind` reservations (posture-only)

Reserved at this stage; schema enum lands per `.agents/skills/hcs-schema-change` after Q-013 acceptance:

- `credential_source_unhealthy` — gate consumed an operation requiring a `CredentialSource` whose `health_state != healthy`.
- `credential_source_authority_insufficient` — operation requires `mutation_scope: read_write_share` but the source has only `read_only`.
- `credential_plane_drift_detected` — Layer β reconciler observed live 1Password state diverged from manifest specification in a way that requires human review (e.g., manually-edited item conflicts with manifest `manual: true` field).
- `credential_plane_secret_in_chunk` — re-uses the `secret_resolution_in_chunk` rejection class from ADR 0019 v3 (do not mint a duplicate; surface-of-origin disambiguates via co-recorded `evidence_subject_kind: vault_inventory_specification`).
- `credential_plane_personal_vault_mutation_attempted` — service-account credential source attempted to mutate a Personal/Private/Employee vault. Structural rejection at Layer 1 mint API; no approval grant overrides per charter invariant 6 (forbidden-tier non-escalable).
- `credential_plane_token_in_state` — OpenTofu plan or apply attempted to write a service-account token, SSH private key, or other secret material into state file. Structural rejection at policy-lint layer; closes the HashiCorp-warned state-file-leakage surface.
- `ssh_agent_socket_mismatch` — `IdentityAgent` resolved socket does not match the canonical `${HOME}/.1password/agent.sock` placeholder; potential agent-spoofing surface.
- `environment_mount_path_unauthorized` — Environments locally-mounted `.env` path is not in the approved mount-path allowlist for the consuming `ExecutionContext`.
- `service_account_personal_vault_scope` — service-account credential source registered with vault scope including Personal/Private/Employee; rejected at registration time (Layer 1 mint API), not at first use.

### `Decision.required_grant_kind` reservations

- `credential_plane_mutation` — grant for any SDK reconciler operation that creates or updates 1Password state.
- `credential_rotation_acknowledgment` — grant for explicit key/password rotation events that override `generate: create_only` policy. Mirrors the `worktree_clean_acknowledgment` (ADR 0030 v2) and `worktree_lease_force_break_acknowledgment` (ADR 0031 v1) patterns.

## New evidence subtype candidates (Q-013 territory)

Posture-only; promotion bucket per Q-011 review grammar.

### Bucket 1 (direct Evidence subtypes; `evidenceSchema`-direct typed payload)

- **`OnePasswordReconcilerPlanReceipt`** — point-in-time SDK plan output. Per-(reconciler invocation, manifest content_hash) grain. Records: planned creates, planned updates, planned archives, drift findings, manifest version asserted, observed live state hash. Scrubber-eligible fields: any field value previews; vault names if marked confidential.
- **`OnePasswordReconcilerApplyReceipt`** — point-in-time SDK apply output. Per-(reconciler invocation, plan_receipt_evidence_ref) grain. Composes with `RemoteMutationReceipt` from ADR 0015 (specialization, not duplication). Records: applied creates, applied updates, applied archives, error class per failed mutation.
- **`OnePasswordSSHAgentObservation`** — observed agent state including which vault items are currently provisioned, agent socket path, agent process identity. Per-(`execution_context_id`, agent_socket_path) grain. Authority class: `host-observation`.
- **`OnePasswordEnvironmentMountObservation`** — observed Environments mount state including which mount_paths are active, which Environment names map to which paths, validation state of the agent hook. Per-(`execution_context_id`, mount_path) grain.
- **`CredentialIssuanceReceipt`** — already reserved in ADR 0015; composes with the new `credential_source_kind` vocabulary. Issuance events for service-account tokens captured at source per ADR 0015's one-time-secret-capture-at-source rule.

### Bucket 2 (no-suffix standalone entities)

- **`CredentialPlaneSpecification`** — durable identity for the vault inventory specification. References `KnowledgeSource` for the manifest content; FK target for `OnePasswordReconcilerPlanReceipt.specification_evidence_ref`. Lifecycle: versioned (specification_version field), immutable per version (rotation creates new version with lineage chain).
- **`OnePasswordEnvironment`** — durable identity for a 1Password Environment (the Environments-feature primitive). FK target for `OnePasswordEnvironmentMountObservation.environment_ref`.

### Bucket 3 (proof composites)

- **`CredentialRotationProof`** — point-in-time proof composite consumed by `credential_rotation_acknowledgment` grants. Cites: previous `CredentialSource` record (kernel-set lineage), new `CredentialIssuanceReceipt`, scope-equivalence check (the new credential carries the same vault scope as the old). Mirrors `BranchDeletionProof` (ADR 0025 v2) shape; reviewed against `ApprovalGrant` consumption semantics per Q-011 sub-decision (b).

## OpenTofu integration posture

The user uses **OpenTofu** for infrastructure as code, not Terraform. The 1Password Terraform provider is OpenTofu-compatible (the OpenTofu fork preserves provider-protocol compatibility with HashiCorp providers; the 1Password provider works against OpenTofu's registry mirror or directly via `terraform.required_providers` syntax which OpenTofu accepts).

### What OpenTofu owns

- **Consuming secrets** in infra workflows via the provider's data sources and ephemeral resources. Ephemeral resources retrieve values without persisting them in state, including SSH-related fields (`private_key_openssh`, `public_key`); this is the **only** correct path for SSH key material in OpenTofu.
- **Simple item categories**: login, password, database. The provider's `onepassword_item` resource currently supports these three categories at the management layer; richer categories (SSH key lifecycle, API credential, document, etc.) require the SDK reconciler.
- **Wiring cloud resources** to `op://` references — e.g., binding a Cloudflare Worker secret, AWS Secrets Manager mirror, or Hetzner Cloud token to a 1Password reference at infrastructure provisioning time.

### What OpenTofu does NOT own

- **SSH Key item lifecycle**. The provider does not support SSH key category management. SSH keys are owned by the SDK reconciler (Layer β).
- **Service account token lifecycle**. Service-account tokens are minted via the 1Password admin console (or, when the SDK supports it, via the SDK's admin operations). Never via OpenTofu state.
- **Secret material in state**. HashiCorp's own documentation warns that state can contain sensitive data, and `sensitive` markings do not encrypt or remove values from state. The forbidden pattern `credential_plane_token_in_state` rejects any OpenTofu plan that would write secret material into state file at policy-lint time.

### Composition with HCS evidence

OpenTofu plan and apply operations against 1Password compose with the existing **`PolicyPlanReceipt`** from ADR 0032 v2 (Q-005). A plan output from `tofu plan` is a `PolicyPlanReceipt` evidence subtype with the existing §Secret-bearing content rule (plan_hash over redacted plan output, redaction_mode discipline, scrubber-eligibility for policy_ids). This means the OpenTofu integration does NOT require a new evidence subtype for plans; it consumes the existing Q-005 receipt shape.

OpenTofu apply against 1Password produces a `RemoteMutationReceipt` per ADR 0015 — same family as Cloudflare API mutations — with provider-specific fields specializing the generic receipt.

## Forbidden patterns (additions to charter §Forbidden patterns)

Posture commitments for the Q-013 ADR; charter v1.4.x amendment lands per change-policy in a separate PR if these are promoted to charter-level.

- **Treating `op` CLI invocations as untyped shell commands.** Per charter invariant 2, no shell command is an ontology object; `op` invocations against an `op://` reference are rendered `CommandShape` outputs of typed `OperationShape` — typically `system.secret.read.v1` once Q-009 settles `system.secret.*` broker surfaces.
- **Routing SSH private key material through OpenTofu state.** The provider's ephemeral resources are the only correct path for SSH key fields; non-ephemeral resources are forbidden for SSH-category items.
- **Service accounts with Personal/Private/Employee vault scope.** Structurally impossible per 1Password's design, but HCS rejects at registration time with `service_account_personal_vault_scope` reason rather than relying on 1Password's downstream rejection.
- **Using `op item edit` for SSH key material.** Per 1Password CLI documentation, `op item edit` cannot edit SSH keys; the SDK reconciler is the only correct path for SSH key updates. Renderers that emit `op item edit --category ssh` fail at command-shape rendering time.
- **Embedding resolved secret values in `.env.op` template files.** The reference-form-only chunking rule from ADR 0019 v3 §Secret-referenced sources is extended: a `.env.op` file containing a resolved value (rather than an `op://` reference) fails Layer 1 mint API at the chunker with `secret_resolution_in_chunk`.
- **Using `op run` as a login-shell wrapper.** 1Password's documentation warns that environment variables can be inspected by other processes running as the same user. `op run` is bounded around the specific subprocess that needs the secret; wrapping a login shell or long-running daemon with `op run` defeats the bounded-execution discipline. The forbidden pattern `op_run_unbounded_scope` is reserved.
- **Treating Browserbase / Agentic Autofill as a credential plane.** Per the 1Password documentation, Agentic Autofill is a separate feature scoped to website autofill via Browserbase Director. It is not a CLI/IaC credential plane and does not compose with the SDK reconciler. HCS does not model Agentic Autofill as a `CredentialSource` for Phase 1; treat as compatibility-only per the tooling-surface-matrix discipline.
- **Inheriting credential authority across `ExecutionContext` boundaries without typed evidence.** Per charter invariant 17 and the v1.3.2 forbidden-pattern list, GUI-launched surfaces (Codex app, Claude Desktop, IDE extensions) do NOT inherit shell-exported `OP_SERVICE_ACCOUNT_TOKEN`, `GITHUB_PAT`, etc. from a terminal session. The credential plane must be modeled per-`ExecutionContext` via typed `CredentialSource` records and brokered injection, not assumed-inherited environment.

## Composition with existing ADRs and decisions

| Existing ADR / decision | Composition with credential plane integration |
|---|---|
| Charter inv. 5 (no secret values in Ring 0/1 at rest) | Strengthened: vault inventory specification carries no values; `op://` references are first-class Layer 0 reference shapes |
| Charter inv. 7 (full safety stack before execute) | Credential plane mutations are `external_control_plane_mutation` class; require approval grants, dashboard review, audit, lease per inv. 7 |
| Charter inv. 8 (sandbox observations cannot promote) | Reconciler running in a sandboxed `ExecutionContext` cannot mint host-authoritative `CredentialSource` records; sandbox-derived credential evidence carries `authority: sandbox-observation` and cannot promote |
| Charter inv. 13 (deletion authority not gitignore) | Vault inventory specifications use `archive: true` rather than `delete: true`; archived items remain queryable for audit-chain reconstruction; canonical policy YAML at Milestone 2 may set per-vault retention windows |
| Charter inv. 14 (config-spec authority hierarchy) | SDK version pin discipline: `observed_runtime + matching_changelog > static_docs > model_memory`. The 1Password SDK is currently version 0; version pin + breaking-change watch applies |
| Charter inv. 15 (GUI shell-env inheritance) | Closed by §Forbidden patterns above (GUI surfaces do not inherit `OP_SERVICE_ACCOUNT_TOKEN` etc.) |
| Charter inv. 16 (external-control-plane evidence-first) | 1Password is an external control plane; SDK reconciler operations produce typed evidence before mutation |
| Charter inv. 17 (execution-context declared) | Each `CredentialSource` registration binds a resolved `ExecutionContext` reference; sandbox-derived sources rejected |
| ADR 0012 (credential broker) | `$HCS_BROKER_SOCKET` is the future runtime path; SDK reconciler is the future control-plane path; both consume from 1Password as Layer α authority |
| ADR 0015 (external control plane automation) | `RemoteMutationReceipt` and `CredentialIssuanceReceipt` specialize for 1Password operations; validator-binding pattern applies if 1Password exposes one (currently no separable validator surface, unlike Cloudflare's OriginAccessValidator) |
| ADR 0018 (durable credential preference) | `CredentialSource` gains `credential_source_kind` discriminator and per-kind authority discipline |
| ADR 0019 v3 (knowledge and coordination store) | Vault inventory specifications, agent.toml configs, .env.op templates are `KnowledgeSource` records with new `source_kind` extensions; chain-promotion rule applies; chunks display-only; secret-referenced label propagation; embedding-eligibility rules apply |
| ADR 0029 v2 (anomalous capture matrix) | `credential_plane_mutation` operation class adopts the matrix cells; `ApprovalGrant.scope` per-class extension committed |
| ADR 0032 v2 (Q-005 runner evidence) | `PolicyPlanReceipt` specializes for OpenTofu plans against 1Password provider; service-account tokens consumed in self-hosted runners compose with `RunnerHostObservation` and `RunnerIsolationObservation` |
| ADR 0034 v2 (boundary evidence composition) | `GitIdentityBinding` typed-FK to `CredentialSource` resolves to `credential_source_kind: onepassword_ssh_agent` for SSH-signed Git operations; subtype-level redaction floor applies |
| D-018 (public source / private deployment boundary) | Vault inventory specifications live in `system-config/credential-plane/`; runtime state (resolved values, broker session keys, dashboard tokens) lives outside repo per the boundary |
| D-028 (`host_secret_*` contract) | Runtime injection layer (Layer γ) callers continue using `host_secret_*` namespace; backend transitions from direct `op` to `$HCS_BROKER_SOCKET` per ADR 0012 |

## Reviewer dispatch path

Per IMPLEMENT.md required-reviewer rule and the Q-row dispatch pattern from prior synthesis-window cycles:

- **`hcs-architect`** — composition with ADR 0015, 0018, 0019 v3, 0029 v2, 0032 v2, 0034 v2; the three-layer credential plane architecture vs the existing three-layer knowledge architecture; vault structure alignment with Nash Group organizational hierarchy; OpenTofu-vs-SDK split coherence.
- **`hcs-ontology-reviewer`** — `credential_source_kind` discriminator vocabulary (closed enum); new evidence subtype names follow §Naming suffix discipline; `CredentialPlaneSpecification` as bucket-2 no-suffix entity; `OnePasswordEnvironment` as bucket-2; new `Decision.reason_kind` and `required_grant_kind` reservations; specification-as-`KnowledgeSource` `source_kind` extensions; registry section reservation `§Credential-source-kind vocabulary` paralleling `§Predicate-kind vocabulary`.
- **`hcs-policy-reviewer`** — `credential_plane_mutation` operation class; matrix cells (default to ADR 0029 v2 inheritance); `ApprovalGrant.scope` per-class extension scope-key disjointness; canonical-policy-at-Milestone-2 commitments (per-vault rotation windows; service-account-vault-scope verifier rules; OpenTofu state-leakage rejection); only after operation-class assignment is committed.
- **`hcs-security-reviewer`** — `credential_plane_personal_vault_mutation_attempted` non-escalability per inv. 6; service-account token capture-at-source per ADR 0015's one-time-secret rule; SSH Agent socket canonicalization; `op run` bounded-scope discipline; redaction-floor propagation through `CredentialSource` typed FKs (per ADR 0034 v2 §Sub-decision (c)); secret-referenced label-upgrade purge composition with vault-inventory-specification chunks; verifier identity binding for `credential_rotation_acknowledgment` grants; the Browserbase/Agentic-Autofill compatibility-only treatment to ensure HCS doesn't inadvertently model it as a `CredentialSource`.

## Q-013 candidate row for DECISIONS.md

Recommend opening Q-013 for the synthesis-window planning cohort:

> **Q-013** — Credential plane integration: 1Password authority surface, IaC reconciler, and specification-driven vault structure. The 2026-05-04 credential plane integration plan (`docs/host-capability-substrate/research/local/2026-05-04-credential-plane-integration.md`) proposes a three-layer architecture (authority-of-record / control-plane reconciler / runtime injection), `CredentialSource` discriminator vocabulary (9 reserved values), new evidence subtype candidates (5 Q-011 bucket 1 subtypes; 2 bucket 2 entities; 1 bucket 3 proof composite), `credential_plane_mutation` operation class as a specialization of `external_control_plane_mutation`, OpenTofu integration posture, vault structure aligned to Nash Group organizational hierarchy, and 8 forbidden-pattern additions. Sub-decisions: **(a)** does the credential plane integration land within Phase 2 (alongside Phase 2.0 charter v1.4.0 amendment) or as a separate Phase 2.7 follow-up cohort? **(b)** are the 9 `credential_source_kind` values approved as the closed enum, and which warrant an ontology-controlled vocabulary update PR? **(c)** is `credential_plane_mutation` a distinct operation class or a sub-discriminator on `external_control_plane_mutation`? **(d)** does the SDK reconciler manifest live at `system-config/credential-plane/onepassword-iac/op.yaml` (matching D-004 canonical-policy boundary) or under `~/Organizations/jefahnierocks/credential-plane/` (matching the cross-org boundary)? **(e)** does the OpenTofu integration warrant a separate Q-014 row for IaC-policy specifically, or is it absorbed by Q-013(c) operation-class assignment? **(f)** does the credential plane integration warrant a charter v1.4.x invariant 20 candidate ("credential plane authority is typed; raw secret material never crosses HCS process boundaries except via brokered injection"), or remain operationalized within existing invariants 5 / 7 / 8 / 16 / 17? **(g)** how does the credential plane integration compose with the user's existing Infisical machine-identity workflow — is `infisical_machine_identity` a `credential_source_kind` peer or a separate Q-row? Resolution target: Phase 1 synthesis-window cohort (2026-05-07 → 2026-05-08) or Phase 2 Wave-2 if Q-013 is deferred.

## Out of scope

This document does NOT authorize:

- Zod schema source for `CredentialSource` discriminator extensions, new evidence subtypes, `CredentialPlaneSpecification`, or `OnePasswordEnvironment`. Schema implementation lands per `.agents/skills/hcs-schema-change` after Q-013 acceptance.
- The reconciler source code itself (`scripts/opctl.py` or equivalent). Implementation lands in a separate PR after Q-013 acceptance and after the SDK version is pinned per charter invariant 14.
- Vault inventory specification YAML contents. Authored in `system-config/` per its change-management process; HCS sequences the dependency between schema/registry state and the inventory specification.
- Service account tokens, OpenTofu state file shapes, GitHub Actions secret bindings, or any runtime artifacts. Live deployment per D-018 boundary discipline.
- Charter v1.4.x invariant text. Q-013 sub-decision (f) decides whether a new invariant is warranted; if so, the amendment lands per change-policy in a separate PR.
- Canonical policy YAML at `system-config/policies/host-capability-substrate/`. Per-vault rotation windows, service-account-vault-scope rules, OpenTofu state-leakage policy, `credential_plane_mutation` matrix cells: all land at Milestone 2.
- ADR 0012 broker implementation. The `$HCS_BROKER_SOCKET` runtime path is referenced as future composition target; broker source lands per ADR 0012's separate cycle.
- 1Password Connect server deployment. Reserved for future multi-host or high-throughput scenarios; current posture is service-account + desktop-auth only.
- Browserbase / Agentic Autofill integration. Compatibility-only per the tooling-surface-matrix discipline; not a `CredentialSource`.
- Multi-host credential plane. Single-host posture per charter invariant 10; multi-host (e.g., Hetzner server pulling secrets independently) deferred until HCS goes multi-host.
- Q-013 sub-decision adjudication. The seven sub-decisions are listed for human review; this document is planning evidence, not deliberation closure.

## Dependency order

Recommended review and landing order:

1. **Q-013 deliberation opens** with this document as the planning input; sub-decisions (a)-(g) settled in human review.
2. **Q-013 ADR drafted** (numbered at authoring time; e.g., ADR 0039 if Q-013 lands in Phase 2 alongside the charter amendment, or post-ADR-0038 if deferred to Phase 2.7).
3. **`§Credential-source-kind vocabulary` registry section** added to `ontology-registry.md` (precondition for `CredentialSource` schema extension PR per the registry §Adding a new suffix or convention rule).
4. **`CredentialSource` schema PR** lands per `.agents/skills/hcs-schema-change` with the discriminator extension, authority-discipline matrix, and cross-context binding rules.
5. **`CredentialPlaneSpecification` and `OnePasswordEnvironment` bucket-2 entity schema PRs** land separately per the one-entity-per-PR rule.
6. **Evidence subtype schema PRs** for `OnePasswordReconcilerPlanReceipt`, `OnePasswordReconcilerApplyReceipt`, `OnePasswordSSHAgentObservation`, `OnePasswordEnvironmentMountObservation`. These can land in parallel after step 4.
7. **`CredentialRotationProof` proof composite schema PR** lands after the evidence subtypes (FK targets needed).
8. **`credential_plane_mutation` operation class** added to ADR 0029 v2 §Operation classes (amendment per change-policy if class list is extended) plus matrix-row inheritance.
9. **Canonical policy YAML** at `system-config/policies/host-capability-substrate/` lands per Milestone 2 (per-vault rotation windows, service-account-scope rules, OpenTofu state policy).
10. **Vault inventory specification authoring** at `system-config/credential-plane/onepassword-iac/op.yaml` (separate from this repo's change-management).
11. **SDK reconciler implementation** in `scripts/opctl.py` (or the reconciler's canonical home; binding decision in Q-013 sub-decision (d)).
12. **Migration plan**: SSH key rotation from existing keys to 1Password-managed keys; service-account creation per project; `.env.op` template authoring; `agent.toml` authoring; OpenTofu provider configuration.

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md` v1.3.2 (invariants 1, 5, 6, 7, 8, 10, 13, 14, 15, 16, 17 and the v1.3.2 forbidden-pattern list)
- Ontology registry: `docs/host-capability-substrate/ontology-registry.md` v0.3.3 (Naming suffix discipline; Producer-vs-kernel-set authority fields; Cross-context enforcement layer; Field-level scrubber rule; Adding a new suffix or convention)
- Decision ledger: `DECISIONS.md` Q-003 (knowledge and coordination store), Q-007 (boundary evidence and quality management), Q-008 (execution reality and Git hygiene), Q-009 (diagnostic surface and workspace manifest), Q-010 (cross-agent isolation and compatibility), Q-011 (ontology promotion review grammar)
- Decision-ledger entries: D-018 (public source / private deployment boundary), D-025 (deletion authority not gitignore), D-026 (config-spec authority hierarchy), D-027 (host hygiene boundary), D-028 (host_secret_* contract), D-029 (tool baseline authority), D-031 (Codex profiles CLI-only), D-032 (external APIs as typed control planes)
- ADR 0001: repo-boundary
- ADR 0012: credential broker (`$HCS_BROKER_SOCKET`)
- ADR 0015: external-control-plane automation
- ADR 0018: durable credential preference (`CredentialSource` Ring 0 entity)
- ADR 0019 v3: knowledge and coordination store (KnowledgeSource / KnowledgeChunk / CoordinationFact / DerivedSummary; secret-referenced sources rules; chain-promotion rule; chunks display-only)
- ADR 0022: BoundaryObservation envelope (boundary_dimension registry)
- ADR 0023: Evidence base shape (evidenceRefSchema; envelope-wraps-payload)
- ADR 0029 v2: anomalous capture matrix (Operation classes; `external_control_plane_mutation`; matrix cells; ApprovalGrant.scope per-class extension)
- ADR 0032 v2: Q-005 CI runner evidence (`PolicyPlanReceipt` for OpenTofu plans)
- ADR 0034 v2: boundary evidence composition (GitIdentityBinding typed FK to CredentialSource; subtype-level redaction floor)
- ADR 0036 (Q-009): workspace manifest as projection (audit_profile / cycle_history source_kind extensions)
- ADR 0038: Phase 2 schema-landing sequence (sequencing context)
- Tooling surface matrix: `tooling-surface-matrix.md` v1.4.0 (compatibility-only adjacent surfaces; existing 1Password mentions in matrix entries)
- Field report: `docs/host-capability-substrate/research/external/2026-04-23-op-ipc-queue-deadlock.md` (motivating D-028)
- Research plan: `~/Organizations/jefahnierocks/system-config/docs/host-capability-substrate-research-plan.md`

### External

- 1Password SDKs documentation (Python, Go, JavaScript): https://developer.1password.com/docs/sdks/
- 1Password Python SDK GitHub: https://github.com/1Password/onepassword-sdk-python/
- 1Password SDK item management (SshKey category, SSHKey field type, PEM private key requirement): https://developer.1password.com/docs/sdks/manage-items/
- 1Password CLI SSH keys (op item create generates new keys; op item edit cannot edit SSH keys; existing keys via desktop app only): https://developer.1password.com/docs/cli/ssh-keys/
- 1Password CLI secret reference syntax (`op://`): https://developer.1password.com/docs/cli/secret-reference-syntax/
- 1Password CLI environment variable injection (`op run`): https://developer.1password.com/docs/cli/secrets-environment-variables/
- 1Password SSH Agent: https://developer.1password.com/docs/ssh/agent/
- 1Password SSH Agent config file (`agent.toml`): https://developer.1password.com/docs/ssh/agent/config/
- 1Password SSH Agent advanced use cases (`IdentityAgent` + `IdentityFile` public key pattern): https://developer.1password.com/docs/ssh/agent/advanced/
- 1Password SSH Agent security (per-key/app/default authorization, per-terminal-session approval): https://developer.1password.com/docs/ssh/agent/security/
- 1Password Service Accounts (rate limits, vault scoping, automation use cases): https://developer.1password.com/docs/service-accounts/
- 1Password Secrets Automation (service accounts vs Connect comparison): https://developer.1password.com/docs/secrets-automation/
- 1Password Environments (beta) (locally-mounted .env files; agent hook validation): https://developer.1password.com/docs/environments/
- 1Password Terraform provider (OpenTofu-compatible; ephemeral resources for SSH/sensitive fields; supported categories: login/password/database): https://developer.1password.com/docs/terraform/
- 1Password Pulumi provider and Pulumi ESC 1Password secrets provider (preview): https://developer.1password.com/docs/pulumi/
- 1Password Shell Plugins (zsh-compatible; per-CLI authentication via Touch ID): https://developer.1password.com/docs/cli/shell-plugins/
- 1Password Agentic Autofill (Browserbase Director only; not a CLI/IaC plane): https://developer.1password.com/docs/agentic-autofill
- HashiCorp Terraform sensitive data documentation (state can contain sensitive data; sensitive markings do not encrypt; ephemeral and write-only patterns are safer): https://developer.hashicorp.com/terraform/language/manage-sensitive-data
- OpenTofu provider compatibility (HashiCorp provider protocol; 1Password provider via standard `terraform.required_providers` block)

## Change log

| Version | Date | Change |
| :---- | ----: | :---- |
| 0.1.0 | 2026-05-04 | Initial credential plane integration plan. Three-layer architecture (authority-of-record / control-plane reconciler / runtime injection); `CredentialSource` discriminator vocabulary; new evidence subtype candidates; `credential_plane_mutation` operation class; OpenTofu integration posture; vault structure aligned to Nash Group organizational hierarchy; eight forbidden-pattern additions; Q-013 candidate row for DECISIONS.md. Posture-only; no schema, policy, or runtime artifacts authored. |

---

This document is staged for the Phase 1 synthesis-window cohort. It is planning evidence and does not commit any of the work it describes. Approval path is Q-013 deliberation → Q-013 ADR drafting → reviewer dispatch (architect / ontology / policy / security) → schema PRs per `.agents/skills/hcs-schema-change` → canonical policy YAML at Milestone 2 → reconciler implementation. Composition with Phase 2 ADR 0038 sequencing is decided at Q-013 sub-decision (a).
