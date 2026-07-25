# PLAN.md — Host Capability Substrate


Milestone-by-milestone implementation plan. Follow in order. Each milestone has acceptance criteria and validation commands. Do not skip validation.

Research plan (canonical): `~/Organizations/jefahnierocks/system-config/docs/host-capability-substrate-research-plan.md`.

## Current Focus — M1 complete; policy-snapshot loader is the next lane

**Capped at 20 lines by D-085.** Narrative belongs in the dated housekeeping
readouts; decisions belong in `DECISIONS.md`. This section states status only.

- **M1 COMPLETE** — 22/22 canonical Ring-0 entities, plus post-M1 `Model`
  (ADR 0076 / D-077) and the ADR 0078 / D-081 `model_ref` slice.
- **Versions:** ontology **v1.34.0** · registry **v0.4.37** · charter **v1.6.0** ·
  ADRs **0001–0079** (0026 absent, reserved — see `adr/0025` §Future amendments) ·
  decisions through **D-086** (next-free **D-087**).
- **M2 residue:** the ADR 0034 boundary-evidence consumption matrix
  (`Decision`/`ApprovalGrant` × {stale, missing, contradictory}) is the one
  acceptance bullet still open. PolicyRule schema ref (D-078), freshness windows
  (D-079) and the loader-rejection fixtures all landed.
- **Next lane:** policy-snapshot loader, read-only, class D — `adr/0060:325-331`
  assigns it and `adr/0061:371` specifies its checkpoint-level test obligation,
  so no new ADR is required. Then `hcs policy status`, one read-only CLI verb.
- **Gates:** `just verify` fails closed as of #93 — a missing toolchain or an
  unexecutable grep is a FAILED gate, not a passed one.
- **Stopped:** the Phase-0b measurement lane, both runtimes (D-083).

---

## Prior focus — removed 2026-07-25 (D-085)

Roughly 1,190 lines of superseded prior-focus sections stood here, dated
2026-04-22 through 2026-06-08.

**Preserved at `3063d9f`** — `git show 3063d9f:PLAN.md` reproduces the file
exactly as it stood before this collapse. That SHA is the citable home; a bare
`git log -- PLAN.md` is true but not findable.

Removed rather than archived to a second file because the content is
narration, not obligation: the decisions it describes are in `DECISIONS.md`,
the designs are in `docs/host-capability-substrate/adr/`, and the dated status
is in the housekeeping readouts. Maintaining a third copy is the cost this
milestone exists to stop.

**Milestones 0-6 below are NOT part of this removal.** They keep their
acceptance criteria and validation blocks. Two demonstrably false statements
inside them are corrected in this same change (the M3 hash construction and the
scoped `just test` targets); nothing else in them is touched.

Three ADRs cite §Current Focus content that the 20-line cap removed —
`adr/0038:748`, `adr/0039:1136`, `adr/0054:42`, all referencing the Phase-2
entry-point inventory. That content is at `3063d9f`.

---

## Milestone 0 — Repository scaffold

**Goal:** The repo enforces its own discipline from commit 1.

**Acceptance:**

- Package layout exists (`packages/schemas`, `packages/kernel`, `packages/adapters`, `packages/dashboard`, `packages/evals`, `packages/fixtures`)
- `just verify` runs (even if it only runs lint + boundary-check + forbidden-string-scan + no-runtime-state-in-repo)
- Schema package compiles (empty but typed)
- `docs/host-capability-substrate/` exists with charter (v1.3.0+), tooling-surface-matrix, ADR template, and accepted ADRs 0001-0015 through closeout
- `AGENTS.md`, `CLAUDE.md`, `PLAN.md`, `IMPLEMENT.md`, `DECISIONS.md` in place
- `.agents/skills/` has the six canonical workflow skills (hcs-adr-review, hcs-draft-adr, hcs-regression-trap, hcs-operation-proof, hcs-policy-tier-entry, hcs-schema-change)
- `.claude/agents/` has six subagents (architect, ontology-reviewer, policy-reviewer, security-reviewer, hook-integrator, eval-reviewer)
- `.claude/skills/` empty at Phase 0a
- `.claude/settings.json` present with model=opus, deny-list for forbidden literals, and hook wiring *(hook wiring withdrawn 2026-07-25 per D-083; the M0 criterion was met at the time and is recorded here as satisfied-then-superseded, not as a live requirement)*
- `.claude/hooks/hcs-hook` present *(present on disk but **unregistered** since D-083; it is the Phase-3 attachment point, not an active log-only hook)*
- No `WARP.md`, no `.windsurf/`, no `.copilot/`
- CI boundary checks wired (strict from M0): boundary-check, policy-lint, schema-drift, forbidden-string-scan, no-live-secrets, no-runtime-state-in-repo

**Validation:**

```bash
just verify
```

---

## Milestone 1 — Ontology schemas (Ring 0)

**Goal:** 22 canonical entities are real and versioned.

**Acceptance:**

- 22 canonical entities (HostProfile, WorkspaceContext, Principal, AgentClient, Session, ToolProvider, ToolInstallation, ResolvedTool, Capability, OperationShape, CommandShape, Evidence, ExecutionContext, PolicyRule, Decision, ApprovalGrant, Run, Artifact, Lease, Lock, SecretReference, ResourceBudget) as Zod schemas. `ExecutionContext` is on the canonical list per ADR 0021 invariant 17 forward binding (introduced in charter v1.3.0+, still live at v1.6.0); `EnvProvenance`, `CredentialSource`, and `StartupPhase` remain Phase 1 supplemental entities until Q-011-guided ontology review promotes them.
- JSON Schema generated from Zod
- Every entity has `schema_version`
- Provenance schema (`Evidence`) is reusable by every fact-returning service
- Docs autogenerated or hand-written and verified against schemas

**Validation:**

```bash
just test schemas
just generate-schemas --check
```

---

## Milestone 2 — Policy snapshot + decision package

**Goal:** Policy can be evaluated against structured inputs without a running kernel.

**2026-06-10 re-sync.** This block predated the Q-007(d) resolution and was
re-synced to settled decisions. The original text named `ApprovalRequest` — an early
research-sketch concept (2026-04-29 intake) that the canonical ontology split into
`Decision` + `ApprovalGrant`, both landed in M1; no binding doc defines an
`ApprovalRequest` object (ADRs 0057/0064 use `ApprovalGrant` exclusively). It also
framed Q-007(d) as open with a four-state `observation_state` gate set; Q-007(d) was
settled 2026-05-03 by ADR 0034 v2, whose matrix is keyed to `valid_until` expiry, not
`observation_state`. M2 implements that decision; it does not re-open it.

**Acceptance:**

- `tiers.yaml` schema validates against Zod entity schemas. **PolicyRule slice
  done 2026-06-23 (D-078):** live policy `policy_rule_schema_version` is `"0.1.0"`,
  the HCS snapshot is byte-identical to system-config commit `426843252e80`, and
  `just policy-lint` projects all eight `operation_class_defaults` entries through
  `policyRuleSchema`.
- `Decision.reason_kind` gains the three reserved `boundary_evidence_*` values
  (`_stale` / `_missing` / `_contradictory`, with `divergent_evidence_ref_pair` —
  an exactly-two `evidence_ref` pair — co-recorded on contradiction) and
  `Decision.required_grant_kind` gains the three reserved single-use
  acknowledgment grant kinds (`boundary_evidence_freshness_override` /
  `boundary_evidence_contradiction_acknowledgment` /
  `boundary_evidence_absence_acceptance`), with the matching `ApprovalGrant.scope`
  per-class boundary-evidence binding extension — the ADR 0034 posture-only
  reservations get their schema enum lift per `.agents/skills/hcs-schema-change`
- `Decision` / `ApprovalGrant` consumption of `BoundaryObservation` evidence refs
  implements the accepted Q-007(d) stateness matrix (ADR 0034 §Sub-decision (d)):
  rows {`stale`, `missing`, `contradictory`} × the six ADR-0029-v2 operation
  classes, with the `stale` row keyed to `valid_until` window expiry — NOT to the
  producer's `observation_state` field; an `unknown` observation that a consuming
  operation requires evaluates as `missing` (per ADR 0034, the matrix takes only
  the three anomaly rows, so the remaining observer-enum states — including
  `inapplicable` — are not matrix inputs and stay observer-side)
- tiers.yaml gains per-`boundary_dimension` `valid_until` freshness windows
  (ADR 0034: policy-set in tiers.yaml at Milestone 2 — a live-policy edit in
  system-config plus a coordinated byte-identical re-vendor of the snapshot).
  **Done 2026-06-23 (D-079):** live policy now carries
  `boundary_dimension_freshness_windows` for all 21 current
  `BoundaryObservation.boundary_dimension` values, the HCS snapshot is
  byte-identical to system-config commit `551419064422`, and `just policy-lint`
  compares the window keys against generated `BoundaryObservation.schema.json`.
- YAML policy loader exists and rejects malformed or stale-schema-version files,
  verifying `source_provenance.source_policy_sha256` against the bound snapshot
  digest before any rule influences a `Decision` (loader requirement per ADR 0060
  B-2; the test obligation — assert rejection at the digest-verification
  checkpoint, not merely final-Decision rejection — per ADR 0061 §Follow-up
  regression coverage, carried in ADR 0064's implementation-test table).
  **2026-06-30 class-J gate fixture:** HCS-side generated-snapshot checks now
  exercise stale schema refs, missing schema refs, and binding digest mismatch
  with temp snapshots via `just policy-loader-rejection-fixture`; live policy
  authoring remains in system-config.
- Policy input shape (principal + session + host + workspace + operation + resolved_tools + evidence + requested_capability + time) is defined
- **No execution path exists yet.** No `system.exec.*`, no approval endpoints.

**Validation:**

```bash
# `just test policy` — activates when packages/policy/tests exists
just policy-lint
```

---

## Milestone 3 — SQLite audit/facts bootstrap

**Goal:** Visible state and audit state are both persisted and queryable, independently.

**Acceptance:**

- `storage.sql` applied to a temp SQLite DB with WAL mode
- `audit_events` append implemented with the hash chain **as bound by `adr/0064:452-456`**: canonical field order, `GENESIS` sentinel for the first
  link, and `varint(byte_length) || field_bytes` length-prefixing on every
  variable-length component. *(Corrected 2026-07-25 / D-085. This bullet previously read `row_hash = sha256(prev_hash || canonical(row))` — naive byte
  concatenation, which `adr/0064:453-456` explicitly **forbids**. An implementer following the old text would have built a hash chain the accepted design
  rejects. The ADR governs; this line restates it.)*
- Checkpoint table exists (checkpoints not yet written to `op://`)
- `facts` + `fact_observations` split implemented
- Read-only `recent_events(limit, filter)` query exists
- Power-cut mid-write test passes (WAL integrity)

**Validation:**

```bash
# `just test storage` — activates when packages/storage/tests exists
# `just test audit-chain` — activates when packages/audit-chain/tests exists
```

---

## Milestone 4 — First MCP read tools

**Goal:** First adapter surface live. Five read-only capabilities callable from Claude Code, Codex, etc.

**Acceptance:**

- `system.host.profile.v1` exposes structured output matching `HostProfile` schema
- `system.session.current.v1` returns live `Session` + `SessionContext`
- `system.tool.resolve.v1` walks mise → project-local → brew → system and returns `ResolvedTool` with provenance
- `system.tool.help.v1` caches `--help` with provenance + parser version
- `system.policy.classify_operation.v1` accepts `OperationShape`, returns `Decision`
- **No mutating endpoints.** Charter invariant 7 enforced by absence.
- MCP stdio adapter wires these 5 tools with strict tool schemas
- Audit log records every call

**Validation:**

```bash
# `just test mcp` — activates when packages/mcp/tests exists
# `just test integration:claude-code` — no package target; integration harness is unbuilt
```

---

## Milestone 5 — Gateway propose + dashboard summary

**Goal:** Full slice-1 surface live; dashboard shows live state.

**Acceptance:**

- `system.gateway.propose.v1` creates a proposal, returns decision package, does not execute
- `system.audit.recent.v1` queries visible state
- `system.dashboard.summary.v1` returns summary payload + local dashboard URL
- Dashboard has read-only views: `/health`, `/sessions`, `/tools`, `/policy`, `/audit`, `/dashboard-summary.json`
- View-model contracts match `DashboardSummary`, `LiveSessionRow`, `HostFactCard`, `ToolResolutionTrace`, `PolicyDecisionCard`, `OperationProposalCard`, `AuditTimelineEvent`, `CacheEntryCard`, `HealthStatus`
- Dashboard never bypasses policy — calls through the same gateway

**Validation:**

```bash
# `just test dashboard` — activates when packages/dashboard/tests exists
# `just test integration:end-to-end-readonly` — no package target; harness unbuilt
```

---

## Milestone 6 — Hooks wired + regression corpus runner

**Goal:** Agent behavior is shaped by substrate from session 1.

**Acceptance:**

- Claude Code PreToolUse hook calls `resolve` + `classify_operation` with 50ms timeout and cache fallback
- Codex hook (where supported) logs advisory signals and blocks forbidden Bash patterns
- Regression corpus runner executes the seed 15 traps against at least Claude Opus
- Acceptance criteria from research plan §6 Phase 3 measurable:
  - ≥50% reduction in redundant `--help` probes across agents vs baseline (top 10)
  - cache-hit p50 < 20ms, p99 < 80ms
  - cache-miss overhead < 50ms above underlying CLI
  - graceful degradation when kernel down
  - ≥1 documented substrate-beats-raw-shell case

**Validation:**

```bash
# `just test evals` — activates when packages/evals/tests exists
just measure       # run daily during the active soak window
just measure-brief # consolidate partitions into the metrics diff
```

---

## Stop-and-fix rules

- If `just verify` fails, fix before proceeding to the next milestone.
- If a boundary-check rule is violated, the PR does not merge — even if tests pass.
- If a regression trap is triggered by substrate changes, add the trap to the corpus and fix in the same PR.
- If a schema changes, regenerate JSON Schema in the same commit.

## Architecture notes

- Ring 0 (schemas) ships first. Every other ring builds on it.
- Ring 1 (kernel) ships before any adapter. Never the reverse.
- Dashboard view contracts land with Ring 1 services — kernel output must be dashboard-renderable from day 1.
- Execute lane (mutations) is blocked until Milestone M4-Month-4 of the full roadmap in research plan §6 Phase 4 (charter invariant 7) — enforced by operator review, not a CI gate; no CI check reads change class today.

## Out of scope for initial build (explicit)

- Execute lane endpoints
- Approval grant creation/consumption
- Sandbox executor
- Remote (non-localhost) MCP
- A2A facade
- MCP Apps UI embeds

These belong in later milestones after the read-only substrate has demonstrated value under soak.
