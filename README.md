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
sub-schemas and evidence envelopes make up the 46 modules above. Source also
includes the read-only policy-rule loader (ADR 0079) and CLI (ADR 0080).
The dashboard and execution lane remain unimplemented; their policy, audit,
lease, and approval prerequisites remain binding. Author /
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
Decision/ApprovalGrant boundary-evidence consumption work is still ahead.
The read-only loader and `hcs policy status` CLI have landed; they do not register
capabilities, construct decisions, or execute mutations. `PLAN.md` is the current
status of record. The
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
- Tooling surface matrix — `docs/host-capability-substrate/tooling-surface-matrix.md` (current v1.6.0) — copy vendored here
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

The repository's `project.yaml` uses Specification 1. Its pinned Release 1
consumer, native command mappings and declaration/status checks are documented
in [project-manifest adoption](docs/host-capability-substrate/project-manifest-adoption.md).
`just manifest-check` validates the declaration; `just manifest-status` reads its
declared status. Both require prepared Python and native Git `>=2.56.0` and prove
no host readiness, live service, producer acceptance or substrate admission.

## Quick start

Review `.mise.toml`, the dependency manifests/lock, and the setup task before
trusting the configuration or installing anything. Preparation is separate
from ordinary commands; use a prepared checkout for the checks below.

Portable verification fixtures require Python `>=3.11` for `datetime.UTC`.
`.mise.toml` pins Python `3.13.16`, the prepared version used in completed
source-gate receipts. The dated setup receipt below describes the source before
this pin.

```bash
mise install       # Node 24, Python 3.13.16, shellcheck, shfmt, just, gitleaks
MISE_EXEC_AUTO_INSTALL=0 mise exec -- npm install  # explicit dependency preparation
MISE_EXEC_AUTO_INSTALL=0 HCS_SKIP_HOST_FIXTURES=1 mise exec -- just verify
```

`just bootstrap` runs both preparation commands. The mise `bootstrap` task runs
only `npm install`, after tools have been prepared. CI deliberately uses
`npm ci` with the committed lockfile. These existing setup choices are unchanged.
The full `just verify` also runs workstation-coupled probe fixtures; review that
lane separately before using it. ShellCheck is required in either profile: a
missing executable fails the gate, and each scan exercises that refusal branch.

### Native command roles

Run ordinary commands from the checkout root through prepared mise, for example:

```bash
MISE_EXEC_AUTO_INSTALL=0 mise exec -- just test
```

Use the same entry for the ordinary commands below, including editor and agent
processes. `.mise.toml` owns tool selection and the five non-secret `HCS_ROOT`,
`HCS_POLICY_DIR`, `HCS_STATE_DIR`, `HCS_LOG_DIR`, and `HCS_LAUNCH_LABEL` values;
its pins, latest channels and values are unchanged. HCS no longer has a project
`.envrc`. An explicit invocation supplies the child process environment; it does
not export those values into the caller. Interactive entry/exit/re-entry through
the workstation's native mise hook needs separate qualification.

`MISE_EXEC_AUTO_INSTALL=0` disables mise exec's missing-tool installation; it does
not prove exact executable selection or constrain arbitrary project code. Review
configuration and prepare tools/dependencies separately. D-028/D-056/D-090's
`host_secret_*`, `use_host_secrets`, and `HCS_SECRET_*` seam stays unchanged;
this project transition retires no shared helper or workstation hook.

| Role | Existing command / scope |
| --- | --- |
| Setup | `just bootstrap` — tool installation and Node dependency preparation; review before running |
| Source check | `HCS_SKIP_HOST_FIXTURES=1 just verify`; `npm run verify` and the mise `verify` task call the same `just verify` implementation |
| Test | `just test`; scoped targets currently include `schemas`, `kernel`, and `cli` |
| Test watch | `npm run test:watch`; a source-test loop, not an HCS service |
| Build | No application build command; `just typecheck` and `just generate-schemas --check` validate source; `just generate-schemas` writes generated source separately |
| Local read path | `just cli policy status` — one-shot, read-only policy-rule inspection; no service start/stop or live-policy authority |
| Format check | `just format-check` |
| Format/lint write | `just format-fix`, `just lint-fix`, or the existing npm write scripts; source-changing operations in a prepared checkout |

Ordinary VS Code tasks invoke `mise exec -- just ...` as processes from the
workspace root with missing-tool installation disabled; the explicit bootstrap
task keeps its existing setup command. CI still calls `just verify` after its
explicit preparation. Fresh GUI/agent executable selection, missing/different-tool
refusal, the `npx` write recipes and prepared-dependency consistency still need
qualification. The dated receipt below records the earlier legacy entry.

### Native setup receipt — source review, 2026-10-13

Reviewed HCS source at `5bbcc1dc85f645cf4f11cae9ae9bf7c07ce53bce` and the
authorized system-config setup guide v1.1.2 / consumer contract v2.4.2 at
`a2fe15fcbe1b84f797812efb6110db9f01a91d4e`. This repository carries its own
commands and requirements; the private guidance is not a runtime or CI dependency.

- **Tools and preparation:** `.mise.toml` owns Node `24`, Gitleaks `8.30.1`, and
  the existing `latest` channels for ShellCheck, shfmt, and just. Node dependencies
  are recorded in `package-lock.json` v3. Gate scripts also require Git, npm,
  Ruby and modern Bash (4+; CI provisions Bash 5). Tool updates remain a project
  review decision; this receipt changes no pin or installation policy.
- **Environment:** `.mise.toml` owns the non-secret `HCS_ROOT`, `HCS_POLICY_DIR`,
  `HCS_STATE_DIR`, `HCS_LOG_DIR`, and `HCS_LAUNCH_LABEL` declarations. Entry still
  uses the retained legacy `.envrc` / `use mise` lane. Source checks require no
  credential delivery. D-028/D-090's secret seam, shared helpers and admission
  records are preserved; environment migration is a separate owner-started task.
- **Dated checks:** PR #108's local CI-profile gate and hosted
  [PR verification](https://github.com/jefahnierocks/host-capability-substrate/actions/runs/38351720005)
  passed; the exact-head
  [main verification](https://github.com/jefahnierocks/host-capability-substrate/actions/runs/38352463899)
  succeeded on 2026-10-13 UTC. Host-coupled fixtures were excluded. These are prior
  source results, not verification of this amendment or current host readiness.
- **Remaining acceptance:** exact tool/version selection and missing/different-tool
  refusal in a fresh process; prepared dependencies matching the lock; ordinary
  runs not preparing tools or rewriting declarations; editor/agent command paths;
  environment entry/exit/re-entry if changed. Resolved executable/version evidence
  has not been collected for this receipt. No runtime, provider or admission
  acceptance follows from the dated gates. No new task runner, MCP server,
  container, workspace enrollment or manifest migration is needed for this source
  workflow.

The Phase-0b measurement recipes (`just day1`, `just measure`, `just measure-brief`)
are retained but no longer part of any active campaign; that window closed
2026-04-26.

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
