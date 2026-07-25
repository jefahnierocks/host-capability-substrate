---
title: HCS Workstation Surface Contract
category: contract
component: host_capability_substrate
status: active
version: 0.4.0
last_updated: 2026-07-20
tags: [workstation, authority, agent-contract, mcp, oauth, cloudflare, vscode, execution-context]
priority: high
---

# HCS Workstation Surface Contract

This contract restates the HCS-owned workstation surface in HCS vocabulary.
Normal HCS sessions use this file, `AGENTS.md`, `README.md`, the implementation
charter, ADRs, `PLAN.md`, `IMPLEMENT.md`, and `DECISIONS.md` as their operating
context. External directive packets may be read when the operator relays them
for integration work; adopted rules are written back here or in another
HCS-owned artifact before they become default session context.

## Scope

HCS is the local substrate for agent and operator actions on this workstation.
It owns the contracts for:

- host-state evidence and freshness;
- toolchain and command rendering from typed operation intent;
- capability registration and gateway decisions;
- approval grants, leases, audited runs, and the evidence and coordination
  store;
- thin adapter surfaces for MCP, CLI, hooks, and the dashboard;
- agent-facing instructions that keep those layers separated.

HCS does not own provider resources, provider account identity, LAN routing,
project deployment flows, live policy authoring, or resolved secret values.
Those surfaces may produce evidence consumed by HCS, but they remain outside
this repo's authority unless an HCS ADR explicitly accepts a typed interface.

## Authority Surfaces

Every HCS operation must keep four authority surfaces separate.

| Surface | HCS wording | What HCS records |
|---------|-------------|------------------|
| Actor identity | who or what acts | Principal, AgentClient, Session, credential-source evidence, operator identity references |
| Managed resource | what is acted on | host paths, tool installations, worktrees, provider object references, runtime state references |
| Authorization binding | what allows the action | OperationShape, Decision, ApprovalGrant, policy snapshot compatibility, lease state |
| Runtime evaluation | what happens at request time | gateway outcome, adapter call, provider response, audit-chain link, Run evidence |

Adapters, hooks, and agent docs do not own authorization binding or runtime
evaluation. They translate or observe. Ring 1 owns HCS decisions once the
kernel service exists; provider runtimes own their own request-time decisions.

## Work Roles

HCS roles are local workflow roles, not imported governance identities.

| Work role | Responsibility |
|-----------|----------------|
| Design owner | States the target ring, confirms the ADR or opens one, and keeps boundary language coherent. |
| Implementer | Edits one scoped surface and updates matching tests or docs. |
| Reviewer | Files objections on boundary, ontology, policy, security, hook, or eval drift. Reviewers do not edit unless reassigned. |
| Maintainer | Handles version drift, dependency hygiene, generated artifacts, and stale-state cleanup with explicit authority. |
| Evidence gatherer | Collects observed facts without promoting sandbox, stale, or derived content into host-authoritative evidence. |

Each substantial change should name both the work role and the authority surface
it touches. A change that touches more than one authority surface has higher
review burden and should usually split into smaller slices.

## Cloudflare Operator Identity

HCS docs or local config that reference the operator's Cloudflare identity use
this explicit transition:

- Interim identity: `jeffreyverlynjohnson@gmail.com`
- Target identity after the Phase 2 Cloudflare account email migration:
  `guardian@thenash.group`
- Target date for the migration: 2026-07-15
- Refresh/sunset date for this contract entry: 2026-08-15

The target identity already exists for operator use, but the Cloudflare account
owner identity is still the interim email until the migration is executed.
Changing provider account ownership, re-authenticating OAuth sessions, updating
Access policies, or mutating provider state remains operator-gated work.

## Cloudflare MCP Baseline

The workstation baseline for interactive Cloudflare MCP access is:

- MCP server name: `cloudflare-api`
- URL: `https://mcp.cloudflare.com/mcp`
- Auth pattern: per-agent OAuth session
- Secret posture: no shared bearer token, no bearer token in argv, no local
  wrapper that injects bearer material
- Current grant posture: read-mostly; writes are not assumed available

All six host agents are expected to use this OAuth-native pattern: Claude Code,
Claude Desktop through the `mcp-remote` OAuth shim, Cursor, Windsurf, Copilot
CLI, and Codex CLI. HCS treats this as the local workstation baseline for
interactive reads. Provider writes still go through project-specific workflows,
project-specific credentials, operation-specific authorization, and the
operator's explicit approval.

## Cross-Project Interfaces

HCS documents its side of nearby project boundaries so a fresh session can
reason locally.

| Interface | HCS consumes | HCS does not own |
|-----------|--------------|------------------|
| `system-config` | current host config deployment records, live policy source, generated-policy snapshot source binding, MCP config baseline evidence, managed workstation CLI/tool baselines such as Infisical | live policy authoring, host deployment mutation from this repo, resolved secrets |
| `HomeNetOps` | LAN and router state evidence when an operation needs it | LAN topology, router configuration, appliance lifecycle |
| `cloudflare-dns` or successor family-home Cloudflare project | provider object references, zone/project state evidence, identity-transition notes | Cloudflare resource provisioning, Pulumi/OpenTofu project flow, provider writes |
| `infisical` management repo / project repos | installed CLI path/version/help output, command syntax evidence, and `SecretReference`-shaped project references when a consuming project supplies them | Infisical server/org policy, secret templates, project `.infisical.json`, project `.envrc`, CI/runtime secret loading, or resolved secret values |
| Parent-org secure control plane (org/cloud scope; documentation-only, non-authorizing) | workload-identity claim shape; decision-receipt and audit-envelope shapes — kept congruent with, not adopted as schema | org secret authority, OpenBao, cloud IAM, OpenTofu state, GitHub-OIDC federation, the org PEP |

References to project paths or names that are known to be moving should be kept
easy to replace. HCS should depend on typed interfaces and evidence shapes, not
on a sibling project's current filesystem name.

## Managed Secret-Tool CLI Boundary

Infisical CLI is a managed workstation tool supplied by system-config. The
current host baseline, as relayed on 2026-06-30, is:

- binary path: `/opt/homebrew/bin/infisical`
- install/update source: Homebrew core formula `infisical`, updated through
  system-config `system-update` `brew-formulae`
- observed version: `infisical version 0.43.99`
- health surface: `ng-doctor tools` includes `infisical_installed`

HCS consumes this as tool-resolution, command-help, and secret-reference
evidence. It is not a secret authority or value broker. Resolved secret values
stay outside HCS. Infisical server/org/policy/template work belongs in the
Infisical management repo; dev-machine CLI guardrails live in system-config;
project `.infisical.json`, `.envrc`, runtime loaders, and CI secret flows stay
in the consuming project repo.

Tool-resolution fixtures must validate installed CLI help before using syntax.
Current guardrails: use `--projectId` when explicit project selection is needed,
do not use `--project-slug`, valid `infisical export --format` values include
`dotenv`, `dotenv-export`, `dotenv-eval`, `json`, `csv`, and `yaml`, and shell
sourcing should prefer `dotenv-export` rather than `--format shell`.

### Parent-Org Control-Plane Congruence (integration restatement, 2026-05-28)

The parent organization adopted a secure control-plane reference strategy at
org/cloud scope, in a documentation-only, non-authorizing posture. Its
identity-and-policy-as-code model — a three-plane authorization architecture
(identity plane / decision plane / native-enforcement plane) backed by a
stateful control plane and a policy-enforcement point (PEP) — is the org-scope
analog of the HCS authority model on this host. HCS restates the correspondence
in its own terms:

- Org **identity plane** ↔ HCS **actor-identity** surface (Principal,
  AgentClient, Session, credential-source evidence). The **workload-identity
  claim** is an integration-input shape HCS keeps its actor-identity evidence
  congruent with.
- Org **decision plane** (policy-as-code) ↔ HCS **authorization-binding**
  surface and gateway/policy path (OperationShape, Decision, ApprovalGrant, the
  canonical policy snapshot). The **decision-receipt** and **audit-envelope**
  are integration-input shapes HCS keeps its Decision records and audit-chain
  envelope congruent with.
- Org **native-enforcement plane** plus the **stateful control plane / PEP** ↔
  HCS **runtime-evaluation** surface and the gateway + execution-broker +
  approval-grant + audit + lease kernel. HCS evaluates at host scope; the org
  plane evaluates at org/cloud scope; neither subsumes the other.

This is congruence at the shape level only. HCS does not adopt these shapes as
schema, kernel, Ring 1, Q-013, or policy work; it authors no org policy; and it
changes no provider, secret, or runtime state. The org plane is non-authorizing
for HCS.

HCS does not own the org enforcement substrate: org secret authority, the org
secret store (OpenBao), cloud IAM, infrastructure-as-code state (OpenTofu),
GitHub-OIDC workload federation, or the org PEP. These may produce evidence HCS
consumes by reference shape, but they remain outside this repo's authority
unless a future HCS ADR accepts a typed interface. Secret material crosses only
as `op://`-style reference shape; no secret values.

Optionally and bidirectionally, HCS may later publish typed host-capability
evidence toward the org "hardware custody" question — for example Secure
Enclave, Touch ID, or hardware-security-token presence — as
existence-and-shape evidence only, never device identifiers, serials, or key
material, and consistent with HCS's existence-only / names-only / classified /
hashed inspection discipline. This is optional and not yet built; emitting any
such typed evidence interface would require its own HCS ADR.

## VS Code Workstation Surface (2026-07-20 integration relay)

`system-config` implemented a governed VS Code baseline; this section restates the
HCS-owned surface in HCS vocabulary. HCS does not copy or mutate the live VS Code
configuration. Ownership boundary:

- **HCS owns:** typed value-blind evidence, capability / execution-context
  semantics, approvals, grants, leases, and future gateway decisions for VS Code
  actions.
- **`system-config` owns:** the live baseline — VS Code settings / profile /
  extension manifests, native MCP rendering, `ng-doctor`, `sync-vscode.sh`,
  `sync-mcp.sh`.
- **HCS does not own:** VS Code OAuth/SecretStorage values, publisher / workspace
  / MCP / domain trust stores, profile associations, provider resources, resolved
  secrets, or project-local editor configuration.

Observed 2026-07-20 (method noted): macOS Tahoe **26.5.2** (`sw_vers`, build
25F84); VS Code Stable **1.129.1** (`code --version`); **76** installed extensions
(`code --list-extensions`, un-rationalized — no auto-uninstall); user-profile
`mcp.json` populated to the native top-level `servers` shape (value-blind: 9
servers, no `inputs` block, GitHub server hard-disabled). Config/file-surface
classification lives in the tooling surface matrix §VS Code surfaces; this section
carries the execution-context, approval, and identity-gate posture. The observed
counts above mirror the matrix §VS Code surfaces; re-snapshot both on the next
relay so they cannot silently diverge.

### Reconciliation — no new `ExecutionContext.surface` value

VS Code being managed does not add a per-product `surface` enum value. Per ADR
0037 Sub-decision (d) and the D-013 conservative posture, specific agent products
stay matrix-level classifications. VS Code is already representable:
`AgentClient.product_family: vscode_native` (shipped) names the actor; the
structural `surface` uses the nearest existing value per context. A generic
local-IDE-agent-host `surface` value is **not** added; whether one is ever needed
is a deferred future-ADR question, gated (per D-013 / ADR 0037 first-class
addition criteria) on an accepted Receipt subtype plus material incident history.

### Execution contexts that stay distinct (seven agent contexts + one human-Principal baseline)

A worktree, Restricted Mode, or sandbox is an execution **property** — none is by
itself an HCS approval, grant, lease, custody proof, or operational acceptance,
and none proves every edit / MCP / tool action ran in the same boundary. Classify
these separately:

| Execution context | `AgentClient.product_family` | Nearest structural `surface` | Note |
|-------------------|------------------------------|------------------------------|------|
| Built-in VS Code chat/agent on the open workspace | `vscode_native` | none dedicated → `unknown` (matrix-only) | IDE-hosted; shares Workspace Trust with the window |
| VS Code Agents window sharing that Workspace Trust | `vscode_native` | none dedicated → `unknown` (matrix-only) | distinct window, same trust boundary; do not assume same sandbox |
| Copilot CLI agent-host via VS Code terminal | `copilot` | `app_integrated_terminal` | terminal-surfaced; Copilot CLI adapter carries separate CLI evidence |
| Claude Agent SDK sessions surfaced through VS Code | `claude_code` (nearest shipped family; not the `claude_code` CLI) | `app_integrated_terminal` / `claude_code_ide_ext` | per how the session is surfaced |
| Background agents in worktrees / separate local contexts | per product | per surface | worktree is a property; compose with `WorkspaceContext` / `Lease` |
| Cloud agents on remote branches / compute | per product | `remote_cloud_agent` | `derived` authority; external control-plane evidence |
| Third-party extension agents (Roo, Cline) | `unknown` (matrix-only) | none dedicated → `unknown` | observe only; extension permission prompts are not OS containment |
| Integrated-terminal human commands + repo tasks | n/a (human Principal) | `app_integrated_terminal` | not an agent execution context |

### Trust, approval, and sandbox are separate evidence types

Do not collapse Workspace Trust, publisher trust, MCP trust, domain trust, agent
permission level, sensitive-file approvals, terminal/tool approvals, and sandbox
state into one "trusted" bit. Current system-config baseline posture, restated as
**observation, not HCS enforcement**:

- Workspace Trust on; untrusted files open in a new Restricted Mode window; empty
  windows are not implicitly trusted.
- Default Approvals; no global or terminal auto-approval.
- Explicit confirmation for sensitive files and hook/config JSON.
- Agent sandbox off pending an evidence-backed pilot.
- MCP discovery/autostart off; each server trusted explicitly.
- Hooks / plugins / nested-instruction / parent-customization discovery off while
  unadopted or Preview.
- Git commit/push remains human-approved until a VS Code-specific identity gate is
  verified.

VS Code's terminal auto-approval parser uses Bash-oriented command analysis; this
workstation's interactive shell contract is **zsh**. A textual allow rule is not a
complete zsh command-policy boundary. Sandbox evidence, if HCS models it, records
exact installed version, OS, settings, filesystem rules, network rules,
command/tool class, observation method, and timestamp (charter inv. 8); Preview
behavior is not promoted on docs alone.

### Git-identity hook coverage — ABSENT for VS Code

No VS Code hook adapter exists. Observed 2026-07-20: only `.claude/hooks/` and
`.codex/hooks/` are present; there is no `.github/hooks/`; `git config
core.hooksPath` is unset; `.git/hooks/` holds only samples. Existing HCS /
system-config pretool evidence covers the installed Claude, Codex, Cursor, and
Copilot **CLI** adapters per their runtime contracts. It does **not** prove that
built-in VS Code agent edits, extension-contributed tools, VS Code tasks,
background / cloud agents, or native MCP calls pass through the same pretool gate.
**Do not claim VS Code adapter coverage until a dedicated adapter is implemented
and firing-verified.** If a Preview VS Code hook is evaluated it must: call the
shared identity / policy engine (not copy deny lists); be fixture-tested against
the installed Stable build; declare fail-open / fail-closed behavior per action;
protect agent write access to the hook and invoked script; name exact event types
and execution contexts in any coverage claim; and pass `just verify` plus the
existing hook-fixture / fault-injection suites. A narrow Preview-hook research
spike remains an **operator-gated candidate**, non-authoritative until
firing-verified; it is not scheduled by this restatement.

### `ng-doctor vscode` projection (if consumed)

If HCS consumes `ng-doctor vscode`, it defines a typed, value-blind evidence
projection (existence / names / versions / classified posture). HCS does not
scrape raw settings, secret stores, chat content, or extension databases.

## Historical Records

Older ADRs, research notes, and decision rows may preserve external names,
paths, or vocabulary as provenance. Do not rewrite historical evidence simply
to make it look current. When a historical record conflicts with this contract
or another current HCS-local source, treat the historical record as context and
the current HCS contract as the operating rule.
