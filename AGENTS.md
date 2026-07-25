# AGENTS.md — Host Capability Substrate


## Tool baseline (binding during early phases)

**This section is the single-source baseline statement** that charter invariant 12 binds (per ADR 0075 / D-076): the dated authority of record is its `DECISIONS.md` re-baseline row — currently **D-075** — and `CLAUDE.md`, `README.md`, and `tooling-surface-matrix.md` point here instead of restating the model name or observed CLI version. A baseline change edits this section plus a new `DECISIONS.md` row; the `opus` alias pin needs no edit.

**Identifiers, not version numbers.** The governing pins are durable: Claude's `opus` alias, Codex's HCS profiles (`hcs-*`), and the CLI semver floors — the running model is resolved/observed at runtime (`claude --version`, `codex --version`), per inv. 14. A specific model *version number* (e.g. `Opus 4.8`, `GPT-5.5`) appears **only here**, and only as a dated observation behind those pins. Every other surface — reviewer definitions, eval scoring/coverage lists, role tables, anti-patterns — names the **runtime/family** (Claude · Codex · Gemini/ADK), never a version. That keeps the next model rollover a one-line edit here, not a repo-wide sweep. (This baseline observes the two host-session runtimes — Claude and Codex; Gemini/ADK appears only as an eval run-scope family, never as a host baseline.)

Current observed baseline (re-recorded 2026-06-15 in `DECISIONS.md` D-075, superseding D-071/D-072; triggered by Anthropic's retraction of Fable 5 and revert to Opus, per charter inv. 12's re-baseline-after-material-version-changes clause). Public CLI semver and app-build identifiers are separate authority facts (D-029).

- **Claude Code CLI:** `2.1.177` observed; main-session model Opus 4.8 via the resilient `opus` alias the `.claude/settings.json` `model` key now holds (it resolves to the latest Opus). Reverted from D-072's exact `claude-fable-5[1m]` pin after that exact string was retracted (D-075); the alias absorbs retraction/rename without a re-pin. The six reviewer subagents also pin `model: opus`, so the D-071/D-072 main/reviewer split has converged back to uniform Opus. Floor remains ≥ `2.1.120` (charter inv. 12). Claude macOS app build tracked separately. (inv. 14 note: installed-CLI `--help` still advertises a `fable` alias — client help lags server-side retraction; observed runtime governs.)
- **Codex CLI:** verify via `codex --version`; the model runs under the HCS profiles (`hcs-*`) and is resolved at runtime — current observed **GPT-5.5** (operator-confirmed 2026-06-22; within D-075's GPT-5.5/5.4-compatible baseline). Floor remains ≥ `0.125.0` (charter inv. 12). Codex macOS app `26.519.81530 (3178)` / Workspace dependencies `26.521.10419` tracked separately as app-build facts (D-054 values, not re-observed).
- **Host OS:** macOS Tahoe `26.5.2` (build 25F84; observed 2026-07-20 via `sw_vers`; minor bump from `26.5.1`, acceptable without re-baselining). Historical `26.5.1` observations in D-071/D-075 ledger rows are point-in-time and left unchanged.

Subsequent minor updates acceptable without re-baselining. Re-baseline after material version changes; the new row supersedes this one and becomes the dated authority of record (see `DECISIONS.md` D-075, superseding D-071/D-072). Charter invariant 12 — amended in charter **v1.6.0** (ADR 0075 / D-076) — no longer names a model: it binds *this* statement as the single-source baseline record, keeps the ≥ `2.1.120` / ≥ `0.125.0` floors as a hard gate, and requires **alias** pinning (an exact model string is a rationale-bearing exception; an unrecorded, sub-floor, or model-memory baseline is a violation).

## Source of truth

Read these before editing:

1. `docs/host-capability-substrate/implementation-charter.md` — binding rules, four rings, non-negotiable invariants (current v1.6.0)
2. `docs/host-capability-substrate/workstation-surface-contract.md` — HCS-local workstation authority surfaces, roles, Cloudflare identity transition, MCP OAuth baseline, and cross-project interfaces
3. `docs/host-capability-substrate/ontology.md` — entity schemas
4. `docs/host-capability-substrate/tooling-surface-matrix.md` — where each config file belongs and what it can enforce
5. `docs/host-capability-substrate/adr/` — architecture decisions
6. `PLAN.md` — current milestone and acceptance criteria
7. `IMPLEMENT.md` — workflow rules
8. `DECISIONS.md` — human-readable decision ledger
9. `docs/github-org-setup.md` — GitHub org / branch ruleset / CODEOWNERS recipe (repo administration; reproduces the GitHub-side configuration if rulesets, teams, or branch protection are lost)

Current restatement status:
`docs/host-capability-substrate/usable-state-readout-2026-05-17.md`.

Research plan (in system-config, canonical reference):
`~/Organizations/jefahnierocks/system-config/docs/host-capability-substrate-research-plan.md`.

Canonical live policy (not in this repo):
`~/Organizations/jefahnierocks/system-config/policies/host-capability-substrate/`.

Integration-time directive packets can inform HCS updates, but adopted rules
must be restated in HCS-owned docs before they become default session context.
Do not make normal HCS sessions depend on external governance files.

## Repo layout

```
packages/
  schemas/      Ring 0: ontology + JSON Schema + TypeScript types
  kernel/       Ring 1: host-state, tool-resolution, capabilities, policy,
                        gateway, session-ledger, evidence-cache, audit,
                        leases, execution-broker
  adapters/     Ring 2: mcp-stdio, mcp-http, dashboard-http, cli,
                        claude-hooks, codex-hooks
  dashboard/    Ring 2: local HTTPS dashboard
  evals/        regression corpus + trajectory harness
  fixtures/     macOS fixtures, help-output fixtures, policy test fixtures

policies/
  generated-snapshot/   read-only snapshot for tests; canonical policy lives
                        in system-config/policies/host-capability-substrate/

scripts/
  dev/          local dev helpers
  install/      launchd install
  launchd/      plist templates
  ci/           boundary checks, policy lint, schema drift check
```

## Hard boundaries (charter invariants summarized)

- Do not put business logic in MCP, dashboard, Claude, Codex, or CLI adapters.
- Do not add a universal shell execution tool.
- Do not represent shell strings as primary intent.
- Do not copy policy into hooks. Hooks call HCS or read the generated policy snapshot.
- Do not expose audit-write tools to agents.
- Do not add mutating execution endpoints before approval grants and dashboard review exist.
- Do not use live CLI syntax from model memory; use tool-resolution/help evidence.
- Do not promote sandbox observations to host-authoritative evidence.
- Skills are canonical at `.agents/skills/`; `.claude/skills/` is for Claude-specific wrappers only.
- No `WARP.md` in Phase 0a; Warp consumes `AGENTS.md`.
- No runtime state in the repo — it lives under `~/Library/Application Support/host-capability-substrate/` and `~/Library/Logs/host-capability-substrate/`.
- Live policy is canonical in `system-config/policies/host-capability-substrate/`, not in this repo.
- Gitignore state is not deletion authority; `.logs/`, runtime state, audit state, materialized facts, and policy caches can be load-bearing.
- Operator handoffs go to `.handoffs/` as `*.handoff.md`: a record-class, load-bearing-but-untracked surface — a `.logs/` sibling governed by inv. 13, **not** inv-10 runtime state, and not deletable on gitignore grounds. Gitignored (structurally un-committable) but durable. Durable operator-facing briefs go here; throwaways use `$TMPDIR`. End every brief by echoing its host-resolved absolute path plus a zsh-ready `bat <path>` / `open <path>`. An operator brief is record-class, not an `Artifact` (an `Artifact` needs a `Run`'s authorizing `Decision` an interactive session never produces; minting one would fabricate provenance). Per ADR 0074.
- Runtime-config claims require installed-runtime/config-spec evidence; do not write boolean-like strings for strict JSON booleans.
- GUI/app/IDE agents do not automatically inherit terminal shell env, direnv, or zsh startup state.
- Never echo secret-shaped environment values; use existence-only, names-only, classified, or hashed inspection.
- GitHub body-bearing operations (`gh pr create`, `gh issue create`, `gh pr comment`, `gh issue comment`, `gh pr edit`, `gh issue edit`) must use `--body-file <path>` or `--body-file -` with stdin for multi-line bodies. Inline `--body "..."` is reserved for single-line content. Per Q-008(e), 2026-05-02.
- HCS shared state is typed evidence + coordination state + derived retrieval index. Never call it "memory," "agent memory," "shared memory," "LLM memory," "persistent memory," "long-term memory," or "context memory." Canonical names: "evidence and coordination store," "shared state," "knowledge index," "coordination fact," "derived summary." Per D-033 / ADR 0019 v3, 2026-05-07. CI-gated by `just shared-state-naming-scan` (the greppable alias subset; bare "memory" stays reviewer judgment). <!-- shared-state-naming-scan: quoted-rule -->

## Required workflow

Before code:

1. Identify the target ring: schema, kernel, adapter, dashboard, hook, eval, docs.
2. Confirm the matching ADR exists.
3. If the task changes ontology, update schema + docs + tests together.

For implementation:

1. Keep diffs scoped to one milestone.
2. Add or update tests with every behavior change.
3. Run `just verify` before finishing.
4. Update `DECISIONS.md` for non-obvious choices.
5. Add regression traps when a model/tooling failure motivates a rule.

## Validation commands

```bash
just verify             # runs lint + typecheck + tests + boundary check
just test schemas       # schema tests only — the only scoped target that exists today
just test kernel        # future target — fails loudly until kernel tests land
just test mcp           # future target — fails loudly until MCP adapter tests land
just generate-schemas --check   # confirms JSON Schema matches Zod
just policy-lint        # checks policy files are well-formed and schema-valid
just boundary-check     # enforces charter §Package boundary enforcement
just agent-contract-identity-scan # checks default agent-facing surfaces stay in HCS wording
```

## Definition of done

A change is not done until:

- schemas validate
- tests pass
- generated JSON Schema updated if schemas changed
- docs match behavior
- no adapter imports kernel-private internals
- no policy is duplicated outside policy sources
- eval fixtures updated when relevant
- `just verify` passes
- PR template boundary checks ticked

## Agent role table

One role per PR. Critic does not edit without a follow-up assignment. Six
project-scoped reviewer definitions are mirrored for Claude Code and Codex in
`.claude/agents/` and `.codex/agents/`:

| Subagent | Tools | Write scope | Role |
|----------|-------|-------------|------|
| `hcs-architect` | Read, Grep, Glob, Edit | docs/ + adr/ | ADR + boundary review; drafts ADRs |
| `hcs-ontology-reviewer` | Read, Grep, Glob | none | Schema/entity/provenance drift review |
| `hcs-policy-reviewer` | Read, Grep, Glob | none | Policy duplication, escalation holes, forbidden leaks |
| `hcs-security-reviewer` | Read, Grep, Glob | none | Secrets, sandbox, audit, forbidden operations |
| `hcs-hook-integrator` | Read, Grep, Glob, Edit | .claude/hooks/, .codex/hooks/, .codex/hooks.json, adapter hook docs | Wires hooks without owning policy |
| `hcs-eval-reviewer` | Read, Grep, Glob, Edit | packages/evals/, packages/fixtures/ | Regression trap quality |

Claude Code subagents pin `model: opus` (the alias — the same one the main session pins, so main and reviewers run uniform; the resolved model is recorded once in §Tool baseline); Codex reviewer definitions inherit
the active Codex model/profile. No reviewer subagent has Bash in its tool list —
reviewers catch drift, not execute commands. Implementation work happens in the
main session with explicit permission.

Implementation roles (human-directed; not subagents):

| Role | Tool | Output |
|------|------|--------|
| Schema engineer | Codex (profile: `hcs-implement`) | Zod + JSON Schema + fixtures |
| Kernel implementer | Codex (profile: `hcs-implement`) | service code + tests |
| Adapter implementer | Codex or Claude Code | MCP/CLI/hook wrappers |
| Dashboard implementer | Codex or Claude Code | read-only views |
| Policy drafter | Claude Code | `tiers.yaml` (to system-config), rationale |
| Doc keeper | Claude Code | DECISIONS, ADRs, changelog |

## Update policy

Update `AGENTS.md` after repeated agent mistakes; do not stuff it upfront. Keep it practical. When a class of mistake surfaces twice, add a rule and record the trap in the regression corpus.

## Hub interop header

When posture/phase/peers/visibility change, update `project.yaml` (hub interop header; contract: `/Users/verlyn13/Repos/verlyn13/meta-inventory/docs/decisions/0002-project-intelligence-spec.md` §D3). It is a derived lookup header consumed by the meta-inventory hub — `PLAN.md` §Current Focus remains the status of record; never treat `project.yaml` as a competing status authority, and never present HCS as employment, client work, or a commercial product.

## Ecosystem awareness — agentic-coding-lab

`agentic-coding-lab` (Plane A, the `~/ai` LLM stack) is a future consumer of HCS's approval/audit lane. Its command-allowlist checker (`harness/sandbox/command_checker.py`) is a deliberate placeholder whose module docstring already documents a defer-to-HCS seam: when HCS's approval/audit lane ships, the lab intends to route eval commands through `OperationShape → CommandShape` + approval grants instead of the local checker. No live wiring today (the planes are orthogonal) — this is a future-consumer note so the approval/audit shape accounts for a waiting client.
