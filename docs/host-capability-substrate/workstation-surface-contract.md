---
title: HCS Workstation Surface Contract
category: contract
component: host_capability_substrate
status: active
version: 0.1.0
last_updated: 2026-05-17
tags: [workstation, authority, agent-contract, mcp, oauth, cloudflare]
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
| `system-config` | current host config deployment records, live policy source, generated-policy snapshot source binding, MCP config baseline evidence | live policy authoring, host deployment mutation from this repo, resolved secrets |
| `HomeNetOps` | LAN and router state evidence when an operation needs it | LAN topology, router configuration, appliance lifecycle |
| `cloudflare-dns` or successor family-home Cloudflare project | provider object references, zone/project state evidence, identity-transition notes | Cloudflare resource provisioning, Pulumi/OpenTofu project flow, provider writes |

References to project paths or names that are known to be moving should be kept
easy to replace. HCS should depend on typed interfaces and evidence shapes, not
on a sibling project's current filesystem name.

## Historical Records

Older ADRs, research notes, and decision rows may preserve external names,
paths, or vocabulary as provenance. Do not rewrite historical evidence simply
to make it look current. When a historical record conflicts with this contract
or another current HCS-local source, treat the historical record as context and
the current HCS contract as the operating rule.
