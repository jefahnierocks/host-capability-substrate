---
title: HCS Agent-Facing Restatement Inventory
category: inventory
component: host_capability_substrate
status: active
version: 0.1.2
last_updated: 2026-05-18
tags: [agent-contract, restatement, workstation, inventory]
priority: medium
---

# HCS Agent-Facing Restatement Inventory

This inventory records the first docs-only pass after the 2026-05-17
operator-relayed integration directive for HCS workstation-contract alignment.
It is HCS-local and does not authorize provider writes, sibling repo edits,
remote pushes, or live policy activation.

## Scope Checked

Default and near-default agent-facing surfaces:

- `AGENTS.md`
- `CLAUDE.md`
- `README.md`
- `IMPLEMENT.md`
- `docs/host-capability-substrate/implementation-charter.md`
- `docs/host-capability-substrate/tooling-surface-matrix.md`
- `docs/github-org-setup.md`
- `policies/README.md`
- `.agents/`
- `.claude/`
- `.codex/`

Planning and historical surfaces sampled separately:

- `PLAN.md`
- `DECISIONS.md`
- `docs/host-capability-substrate/adr/`
- `docs/host-capability-substrate/research/local/`

External source packets were read only as integration-time context. Adopted
rules from those packets are restated in HCS-local wording in
`workstation-surface-contract.md`. The relayable status readout is
`usable-state-readout-2026-05-17.md`.

## Findings

| Surface | Finding | Action |
|---------|---------|--------|
| Root contract files | No project-breaking external governance labels found in `AGENTS.md`, `CLAUDE.md`, `README.md`, or `IMPLEMENT.md`; several local-contract gaps remained. | Added `workstation-surface-contract.md` and linked it from the root contract. |
| Tooling matrix | The matrix had a stale header phrase and lacked a row for the workstation contract. | Updated the header, added the row, and bumped the matrix changelog. |
| Claude-specific contract | The Claude file referenced the managed shell policy as external inheritance. | Reworded to system-config-managed host policy and linked the workstation contract. |
| README | Status and contract order were stale; HCS-local operating authority was not stated strongly enough. | Updated status, split local contract from external inputs, and linked the workstation contract. |
| `PLAN.md` | Historical sections contain external names and context from earlier evidence intake. | Preserve as historical provenance; add current-focus note for the docs-only restatement slice. |
| `DECISIONS.md` | Historical rows preserve external vocabulary as evidence. | Preserve as historical provenance; add a current decision row for the HCS-local contract boundary. |
| CI guard | Default contract and project agent-definition surfaces needed a repeatable check after the restatement pass. | Added `just agent-contract-identity-scan` to `just verify` for root contracts, near-default setup/policy docs, active workstation/tooling contract docs, and project agent-facing config directories. |
| Usable-state readout | The operator needs a brief local status statement that can be relayed without reconstructing criteria from the inventory. | Added `usable-state-readout-2026-05-17.md` with criteria evidence, non-authorization boundaries, and a copy/paste relay packet. |
| ADRs and research notes | Many records intentionally preserve source names, old path claims, or compatibility context. | Do not rewrite in bulk. Future docs should normalize active guidance into HCS vocabulary while preserving provenance records. |

## Current Restatement Coverage

The first pass now covers:

- four authority surfaces in HCS wording: actor identity, managed resource,
  authorization binding, and runtime evaluation;
- local HCS work roles: design owner, implementer, reviewer, maintainer, and
  evidence gatherer;
- Cloudflare operator identity transition:
  `jeffreyverlynjohnson@gmail.com` now, `guardian@thenash.group` after the
  Phase 2 Cloudflare account email migration;
- Cloudflare MCP OAuth baseline:
  `cloudflare-api` at `https://mcp.cloudflare.com/mcp`, per-agent OAuth, no
  shared bearer, no bearer-in-argv wrapper, read-mostly grant;
- HCS-side interfaces with `system-config`, `HomeNetOps`, and the
  family-home Cloudflare project lineage;
- a relayable status statement confirming the contract/documentation slice
  reached usable agent-facing state without claiming runtime or provider
  changes.

## Second-Pass Classification

On 2026-05-18, HCS ran a second pass over root files and
`docs/host-capability-substrate/*.md` for inherited-authority wording.

Classification:

- Default and near-default agent-facing surfaces are guarded by
  `just agent-contract-identity-scan`.
- `IMPLEMENT.md` contains `OperationShape remains upstream of CommandShape`;
  this is dependency-order vocabulary, not an external authority reference.
- The implementation charter contains parent/child execution-context language;
  this is process-boundary vocabulary and remains current HCS behavior.
- Historical plans, decision rows, ADRs, runbooks, ontology records, and
  research/design notes may preserve source labels or external infrastructure
  names as provenance. They are not default HCS operating authority unless a
  current HCS contract file restates the rule.

Decision D-050 records the boundary: do not bulk-rewrite provenance records
solely to remove historical vocabulary. When guidance from those records is
promoted into default session context, restate it in HCS-owned wording first.

## Remaining Work

This pass deliberately does not rewrite historical ADRs, decision rows, or
research notes. A later cleanup pass can tighten active docs further if a
specific agent-facing file still reads as operating authority from outside HCS.

The next practical restatement checks are:

1. Keep new active docs from adding external governance identifiers as operating
   rules; the default-surface guard now checks this during `just verify`.
2. When the Cloudflare account email migration lands, update the identity entry
   in `workstation-surface-contract.md` and any HCS-local references.
3. When the family-home Cloudflare project moves or renames, update HCS path and
   interface references by ordinary find-and-replace rather than redesigning the
   contract.
