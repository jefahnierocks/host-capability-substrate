# host-capability-substrate

**Host Capability Substrate (HCS)** — a horizontal operations kernel for this macOS workstation. Provides host ground-truth, toolchain resolution, capability exposure, policy/gateway, approval grants, audited runs, and human control for every agent on the host.

HCS is infrastructure. It is the substrate on which every agent's actions compose, not a feature of any one agent.

## Status

Milestone 1 (Ring 0 ontology) is complete: all 22 of 22 canonical Ring-0 entities
are landed as Zod schemas + generated JSON Schema + `schema_version` + ontology and
registry docs (closed by PR #45; the HCS side of the Phase 2.5 policy-lint split is
also closed). Kernel, adapters, and dashboard code are still intentionally
unimplemented until their policy, snapshot, audit, lease, and approval
prerequisites are explicit. The HCS-local agent-facing workstation contract
restatement reached usable documentation state on 2026-05-17; see
`docs/host-capability-substrate/usable-state-readout-2026-05-17.md`.

## Local Contract

HCS operating authority is restated in this repo. External policy and deployment
sources are named where HCS consumes them, but root agent sessions should be able
to understand HCS scope and boundaries from HCS-owned files.

Read in order:

1. `AGENTS.md` — canonical cross-tool contract
2. `CLAUDE.md` — imports `AGENTS.md` + Claude-specific notes
3. `docs/host-capability-substrate/workstation-surface-contract.md` — workstation authority surfaces, local roles, Cloudflare identity transition, MCP OAuth baseline, and cross-project interfaces
4. `docs/host-capability-substrate/usable-state-readout-2026-05-17.md` — current restatement status and non-authorization boundaries
5. `docs/host-capability-substrate/implementation-charter.md` — binding invariants
6. `PLAN.md` — current milestone and acceptance criteria
7. `IMPLEMENT.md` — per-PR workflow rules
8. `DECISIONS.md` — human-readable decision ledger
9. `docs/github-org-setup.md` — GitHub org / branch ruleset / CODEOWNERS recipe

## External Inputs

The following sources live outside this repo and are consumed through explicit
HCS boundaries:

- Research plan — `system-config/docs/host-capability-substrate-research-plan.md` (v0.3.0+; lives in `system-config`, not this repo)
- Implementation charter — `docs/host-capability-substrate/implementation-charter.md` (v1.4.1+) — copy vendored here at `docs/host-capability-substrate/implementation-charter.md`
- Boundary decision — in-repo pointer: `docs/host-capability-substrate/adr/0001-repo-boundary.md` (v1.1.0+; source decision lives in `system-config`)
- Tooling surface matrix — `docs/host-capability-substrate/tooling-surface-matrix.md` (v1.0.0+) — copy vendored here
- Live runtime policy — `policies/host-capability-substrate/` (**canonical; not in this repo**)

Per charter invariant 10: this repo contains source, schemas, test fixtures, docs, and ADRs. Live policy, runtime state, audit archives, and tokens live outside the repo.

## Four rings

No lower ring may import from a higher ring. Enforced by CI from commit 1.

- **Ring 0 — Ontology & schemas** (`packages/schemas/`)
- **Ring 1 — Kernel services** (`packages/kernel/`)
- **Ring 2 — Adapter surfaces** (`packages/adapters/`, `packages/dashboard/`)
- **Ring 3 — Agent/human workflows** (`.agents/skills/`, `AGENTS.md`, `CLAUDE.md`, `PLAN.md`, `docs/`)

## Tool baseline (early phases)

- **Claude Code CLI** ≥ `2.1.120` with Fable 5 as the main-session model (pinned per `DECISIONS.md` D-071/D-072; reviewer subagents stay on Opus 4.8); Claude macOS app build tracked separately
- **Codex CLI** ≥ `0.125.0` with GPT-5.5/GPT-5.4-compatible HCS profiles; Codex macOS app build tracked separately

Subsequent minor updates acceptable. See `DECISIONS.md` D-071 (supersedes D-054) for the current baseline and the public-semver/app-build split.

## Quick start

```bash
mise install       # Node 24, shellcheck, shfmt, just
just verify        # lint + typecheck + tests + all boundary checks
just day1          # kickoff measurement battery (soak harness)
just measure       # daily partition capture
just measure-brief # consolidated measurement readout
```

## Runtime layout (not in this repo)

- **State:** `~/Library/Application Support/host-capability-substrate/`
- **Logs:** `~/Library/Logs/host-capability-substrate/`
- **LaunchAgent:** `~/Library/LaunchAgents/com.jefahnierocks.host-capability-substrate.plist`
- **Live policy:** `~/Organizations/jefahnierocks/system-config/policies/host-capability-substrate/`

## Ownership

Owned by **jefahnierocks** as a host-scoped HCS project. External
organizational materials may be used only as integration inputs. HCS operating
authority comes from this repo's contract, charter, ADRs, decision ledger, and
the external policy source explicitly named by those HCS-local documents.
