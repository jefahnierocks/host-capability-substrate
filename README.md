# host-capability-substrate

**Host Capability Substrate (HCS)** — a typed governance layer and operations
kernel for host-level AI agents on a single macOS workstation. It gives every
agent on the host one substrate for host ground-truth and toolchain resolution,
capability exposure, policy and gateway decisions, provenance-typed evidence,
scoped and expiring authorization grants, and tamper-evident audited runs under
human control.

HCS is infrastructure, not a feature of any one agent — the substrate on which
every agent's actions compose. It is a self-directed, single-operator substrate;
nothing here is a production-scale or commercial claim.

## What's built (verified 2026-07-08)

- **46** Zod entity schemas (`packages/schemas/src/entities/`) compiled to **67**
  generated JSON Schemas — see `packages/schemas/generated/` for the concrete,
  inspectable artifact.
- **~500** tests (vitest) across the schema suite.
- **19** non-negotiable invariants in the implementation charter (v1.6.0).
- **Four-ring** layered architecture — Ring 0 (schemas) imports from nowhere
  above it; enforced by CI from the first commit.
- **One merge gate** — `.github/workflows/verify.yml` → `scripts/ci/verify.sh`
  composes a dozen static scanners (policy-lint, boundary-check, no-live-secrets,
  schema-drift, forbidden-string-scan, shellcheck, and more).

Ring 0 (the ontology) is complete — the 22 canonical entities plus supplemental
sub-schemas and evidence envelopes make up the 46 modules above. Kernel,
adapters, and dashboard code are intentionally unimplemented until their policy,
snapshot, audit, lease, and approval prerequisites are explicit; the enforcing,
advisory, and design-stage boundaries are labeled in the charter. Author /
portfolio: [jvjohnson.dev](https://jvjohnson.dev).

## Status

Milestone 1 (Ring 0 ontology) is complete: all 22 of 22 canonical Ring-0 entities
are landed as Zod schemas + generated JSON Schema + `schema_version` + ontology and
registry docs (ResourceBudget landed in PR #44; the Milestone 1 closeout landed
in PR #45). Post-M1 source now also includes the Model entity (ADR 0076 / D-077,
PR #78) plus the ADR 0078 / D-081 `AgentClient.model_ref` and
`Session.model_ref` schema slice. Milestone 2 is open: the PolicyRule
live-policy schema ref and per-boundary-dimension freshness windows are
byte-identically re-vendored from `system-config`, while the remaining
Decision/ApprovalGrant boundary-evidence consumption work is still ahead. Kernel,
adapters, and dashboard code are still intentionally unimplemented until their
policy, snapshot, audit, lease, and approval prerequisites are explicit. The
HCS-local agent-facing workstation contract restatement reached usable
documentation state on 2026-05-17; see
`docs/host-capability-substrate/usable-state-readout-2026-05-17.md`. The current
post-merge housekeeping readout, including the 2026-06-30 system-config relay
addendum, is
`docs/host-capability-substrate/housekeeping-readout-2026-06-29.md`.

## Local Contract

HCS operating authority is restated in this repo. External policy and deployment
sources are named where HCS consumes them, but root agent sessions should be able
to understand HCS scope and boundaries from HCS-owned files.

Read in order:

1. `AGENTS.md` — canonical cross-tool contract
2. `CLAUDE.md` — imports `AGENTS.md` + Claude-specific notes
3. `docs/host-capability-substrate/workstation-surface-contract.md` — workstation authority surfaces, local roles, Cloudflare identity transition, MCP OAuth baseline, and cross-project interfaces
4. `docs/host-capability-substrate/usable-state-readout-2026-05-17.md` — dated restatement status and non-authorization boundaries
5. `docs/host-capability-substrate/housekeeping-readout-2026-06-29.md` — current post-merge status, lessons, and workflow-prep queue
6. `docs/host-capability-substrate/implementation-charter.md` — binding invariants
7. `PLAN.md` — current milestone and acceptance criteria
8. `IMPLEMENT.md` — per-PR workflow rules
9. `DECISIONS.md` — human-readable decision ledger
10. `docs/github-org-setup.md` — GitHub org / branch ruleset / CODEOWNERS recipe

## External Inputs

The following sources live outside this repo and are consumed through explicit
HCS boundaries:

- Research plan — `system-config/docs/host-capability-substrate-research-plan.md` (v0.3.0+; lives in `system-config`, not this repo)
- Implementation charter — `docs/host-capability-substrate/implementation-charter.md` (current v1.6.0) — copy vendored here at `docs/host-capability-substrate/implementation-charter.md`
- Boundary decision — in-repo pointer: `docs/host-capability-substrate/adr/0001-repo-boundary.md` (v1.1.0+; source decision lives in `system-config`)
- Tooling surface matrix — `docs/host-capability-substrate/tooling-surface-matrix.md` (current v1.5.6) — copy vendored here
- Live runtime policy — `~/Organizations/jefahnierocks/system-config/policies/host-capability-substrate/` (**canonical; not in this repo**)

Per charter invariant 10: this repo contains source, schemas, test fixtures, docs, and ADRs. Live policy, runtime state, audit archives, and tokens live outside the repo.

## Four rings

No lower ring may import from a higher ring. Enforced by CI from commit 1.

- **Ring 0 — Ontology & schemas** (`packages/schemas/`)
- **Ring 1 — Kernel services** (`packages/kernel/`)
- **Ring 2 — Adapter surfaces** (`packages/adapters/`, `packages/dashboard/`)
- **Ring 3 — Agent/human workflows** (`.agents/skills/`, `AGENTS.md`, `CLAUDE.md`, `PLAN.md`, `docs/`)

## Tool baseline (early phases)

- **Claude Code CLI** ≥ `2.1.120`; **Codex CLI** ≥ `0.125.0` — the binding floors (charter invariant 12)

The current model/CLI baseline, the `opus` alias-pinning rule, and the public-CLI-semver/app-build split are recorded once in the **single source** — see `AGENTS.md` §Tool baseline, anchored to its `DECISIONS.md` re-baseline row. This README does not restate the model name, observed CLI version, or re-baseline `D-0NN`. Subsequent minor updates acceptable; re-baseline after material version changes.

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
