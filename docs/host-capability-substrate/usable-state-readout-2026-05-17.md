---
title: HCS Usable-State Readout
category: status
component: host_capability_substrate
status: ready-for-relay
version: 0.1.2
last_updated: 2026-05-18
tags: [agent-contract, restatement, workstation, status]
priority: high
---

# HCS Usable-State Readout

This readout records the HCS-local workstation-contract restatement completed
on 2026-05-17. It is a status artifact, not authorization for provider writes,
sibling repo edits, remote pushes, live policy activation, schema changes,
hook behavior changes, or Ring 1 service work.

## Basis

- Local contract:
  `docs/host-capability-substrate/workstation-surface-contract.md`
- Inventory:
  `docs/host-capability-substrate/restatement-inventory-2026-05-17.md`
- Guard:
  `just agent-contract-identity-scan`, included in `just verify`

## Usable-State Criteria

| Criterion | Local evidence | Status |
|-----------|----------------|--------|
| HCS has its own agent-facing contract surface. | `AGENTS.md`, `README.md`, `CLAUDE.md`, and `workstation-surface-contract.md` now link the local contract path. | Reached |
| Active guidance is written in HCS vocabulary. | The workstation contract defines HCS scope, authority surfaces, work roles, Cloudflare identity transition, MCP OAuth baseline, and sibling interfaces without importing external organizational labels. | Reached |
| A fresh HCS agent can derive what HCS owns. | `workstation-surface-contract.md` separates HCS-owned evidence, tool resolution, gateway, approval, adapter, and instruction surfaces from provider resources, routing, deployment, live policy authoring, and secrets. | Reached |
| Cross-project interfaces are stated from HCS's side. | The contract names what HCS consumes from `system-config`, `HomeNetOps`, and the family-home Cloudflare project lineage, and what remains outside HCS authority. | Reached |
| Cloudflare workstation access is restated locally. | The contract records `cloudflare-api` at `https://mcp.cloudflare.com/mcp`, per-agent OAuth, no shared bearer, no bearer-in-argv wrapper, and read-mostly grant posture. | Reached |
| Drift prevention exists for default agent-facing surfaces. | `scripts/ci/agent-contract-identity-scan.sh` scans the default and near-default agent-facing surfaces, plus project agent config directories, during `just verify`. | Reached |

## Relay Statement

HCS has reached the usable agent-facing workstation-contract state for the
2026-05-17 restatement pass. The default HCS contract surfaces now express
scope, authority surfaces, local work roles, the Cloudflare operator identity
transition, the Cloudflare MCP OAuth baseline, and sibling-project interfaces
in HCS-owned wording. A verification guard now keeps the default agent-facing
surfaces from reintroducing external organizational labels as active operating
guidance.

This status confirms the contract/documentation slice only. It does not claim
that provider state changed, live policy activated, Ring 1 service behavior
changed, or a remote branch was pushed.

## Follow-On Scan

On 2026-05-18, a second pass classified remaining inherited-authority wording
outside the guarded default surfaces. No new blocker was found for the usable
agent-facing state. Non-default plans, decision history, ADRs, runbooks,
ontology records, and research/design notes may preserve source/provenance
vocabulary. Future promotion from those records into default session context
must restate the guidance in HCS-owned wording first.

## Operator Relay Packet

The operator can relay the following status text into the coordinating session
that requested HCS progress:

```text
HCS reports usable agent-facing workstation-contract state reached for the
2026-05-17 restatement pass.

Local artifacts:
- docs/host-capability-substrate/workstation-surface-contract.md
- docs/host-capability-substrate/restatement-inventory-2026-05-17.md
- docs/host-capability-substrate/usable-state-readout-2026-05-17.md

Coverage:
- HCS scope and non-owned surfaces are stated locally.
- Four authority surfaces are restated locally: actor identity, managed
  resource, authorization binding, runtime evaluation.
- HCS work roles are restated locally: design owner, implementer, reviewer,
  maintainer, evidence gatherer.
- Cloudflare operator identity transition is recorded locally:
  jeffreyverlynjohnson@gmail.com interim, guardian@thenash.group target after
  the Phase 2 account email migration.
- Cloudflare MCP baseline is recorded locally: cloudflare-api at
  https://mcp.cloudflare.com/mcp, per-agent OAuth, no shared bearer,
  no bearer-in-argv wrapper, read-mostly grant posture.
- HCS-side interfaces with system-config, HomeNetOps, and the family-home
  Cloudflare project lineage are stated locally.
- just agent-contract-identity-scan is wired into just verify to guard default
  and near-default HCS agent-facing surfaces.
- A 2026-05-18 follow-on scan classified remaining non-default historical,
  runbook, ontology, and research/design references as provenance or technical
  vocabulary, not default operating authority.

Non-authorizations:
- No provider state changed.
- No live policy activated.
- No sibling repo was edited.
- No Ring 1 service behavior changed.
- No remote branch was pushed.
```

Before relaying, rerun:

```bash
just agent-contract-identity-scan
just verify
git diff --check
```
