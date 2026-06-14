---
adr_number: 0074
title: "Operator handoffs are a record-class surface (`.handoffs/`), not an Artifact"
status: proposed
date: 2026-06-14
charter_version: 1.5.0
tags: [handoff, record-class, artifact, inv-13, inv-10, gitignore, scratch, storage-primitive]
---

# ADR 0074: Operator handoffs are a record-class surface (`.handoffs/`), not an Artifact

## Status

`proposed`

## Date

2026-06-14

## Charter version

Written against charter v1.5.0. This ADR applies invariants 10, 13, and 17 to a
new artifact class; it amends no invariant text and bumps no charter version.
("Applies," not "operationalizes" — it adds no boundary-enforcement or CI
plumbing for those invariants.)

## Context

A recurring development friction: an agent generates a durable, operator-facing
document (a session handoff, a brief, an explain-this-denial writeup) and its
reflex sink for "a doc I just made" is scratch — `$TMPDIR` / `/tmp`. Under a
sandboxed Bash tool, scratch is the wrong *kind* of place for a handoff three
ways at once:

1. **Invisible.** `/tmp` is reaped, never browsed, and on macOS hides under
   `/private/tmp`. A durable handoff written there is lost to the human it was
   written for.
2. **Context-divergent.** Sandboxed and unsandboxed commands resolve `$TMPDIR`
   to *different* directories by design — this is charter invariant 17
   (execution context is declared, not inferred) observed in the wild: the
   agent's "temp" and the operator's interactive "temp" are not the same place.
3. **Wrong durability class.** A handoff is durable, human-facing, and
   do-not-commit. Scratch is none of those.

The working tree is the one surface reliably shared and durable across the
sandbox boundary, but it is *governed* (naming scans, secret scans, "stage
explicit paths, never blanket-add"). So a "durable, shared, do-not-commit"
artifact has no native home: scratch is invisible-but-clean, the repo is
visible-but-governed. That gap is the whole problem.

HCS has already encountered and named this artifact class once. `.logs/` is
in-repo, gitignored, durable, do-not-commit, and *load-bearing* (the Phase-0
measurement corpus). It is the living precedent for "in-repo, untracked,
durable, not-scratch" state, and it is exactly what invariant 13 means by
distinguishing **user scratch** from **load-bearing state**: a handoff that a
*next* session reads for context has crossed from scratch into load-bearing,
and inv. 13 forbids treating gitignore membership as license to delete it.

**The forcing question — is a handoff an `Artifact`?** HCS's first storage
primitive, `Artifact` (ADR 0070), is a digest-addressed descriptor that
deliberately carries `content_sha256` + `byte_size` and **no storage-location
pointer, no bytes** — the bytes and their location are Ring-1 obligations. That
descriptor/storage split is the right lens, but the `Run` schema settles the
type decisively. `Artifact.run_id` is a **required** FK to a `Run` (ADR 0053),
and a `Run` is only `operation_execution` and carries a required
`authorizing_decision_id` — a typed FK to a `Decision` with `outcome: "allow"`.
An interactive agent writing a markdown brief acts within a `Session`
(`agent_invocation`, ADR 0055) but produces no `OperationShape`, no allow-
`Decision`, and therefore no `Run`. Typing such a brief as an `Artifact` would
**fabricate a `Run` and an authorization that never happened** — manufacturing
provenance, which is the precise anti-pattern HCS exists to forbid (facts
without a real source/authority).

So the handoff is two subclasses, and conflating them is the error to avoid:

- **Operator brief (the common case):** written in a `Session` with no
  authorizing `Run`. It is **record-class** — a file, with no descriptor, no
  `run_id`, no `artifact_kind`. Governed by inv. 13.
- **Broker run-summary (the rare case):** genuinely the output of an authorized
  operation `Run`. It legitimately *is* an `Artifact` (`artifact_kind:
  signed_summary`, already reserved in the enum), whose descriptor is Ring-1
  runtime state and *references* wherever the bytes live.

This ADR ratifies the type and home of the common case so a future cleanup
agent or reviewer cannot (correctly, by its own rules) flag the new directory.
The broker-summary storage mechanics are deferred (see Decision part b).

## Options considered

### Option A: `.handoffs/` — in-repo, gitignored, record-class, inv-13-governed (chosen)

A repo-local `.handoffs/` directory holding `*.handoff.md` files; gitignored so
it is structurally un-committable; declared in `AGENTS.md` and this ADR as
record-class, load-bearing-but-untracked, a `.logs/` sibling, and explicitly
**not** invariant-10 runtime state.

**Pros:**
- Solves the original *invisibility* friction: a file in CWD is visible the
  instant it lands, unlike `$TMPDIR`.
- Reuses an already-sanctioned HCS pattern (`.logs/`) — no new kind of state.
- The `*.handoff.md` suffix is CI-clean **by construction**: it cannot match
  any shape `scripts/ci/no-runtime-state-in-repo.sh` keys on (`*.sqlite`,
  `audit_events.*`, `facts.*`, `cache_entries.*`, `hcs.*.log`,
  `dashboard-token*`), so the directory cannot be mistaken for runtime state by
  the existing gate. This ADR + the inv-13 declaration cover any *future* gate.
- Commit-prevention (gitignore) and deletion-prevention (inv. 13) are kept as
  the orthogonal axes they are: the directory is un-committable **and**
  not-deletable-on-gitignore-grounds at once.
- Writes stay permission-prompted under the repo's `defaultMode: ask` + path-
  scoped `Edit()` allowlist (the directory is deliberately *not* added to the
  allowlist). For a durable operator-facing artifact, a one-beat approval is a
  feature, not friction to remove.

**Cons:**
- A second in-repo gitignored surface to reason about alongside `.logs/`.
- Relies on the suffix convention plus the inv-13 declaration rather than a
  dedicated CI gate (acceptable; the suffix is self-protecting against today's
  gate, and a gate can be added if the class grows).

### Option B: external outbox (`~/.nash/outbox`) via a sandbox `allowWrite` widening

Place handoffs in a dedicated directory outside the repo tree, granted in the
user-global sandbox writable set.

**Pros:**
- Fully clears the repo's governance surface; philosophically aligned with
  inv. 10 (durable agent output lives outside the repo tree).
- Enables a cross-device story (synced root or quarantine ref) for a multi-host
  fleet.

**Cons:**
- **Out of HCS scope.** The path is outside
  `/Users/verlyn13/Organizations/jefahnierocks/`; the sandbox key lives in
  user-global `~/.claude/settings.json`, which HCS does not own.
- HCS is single-host by the workstation-surface contract, so the cross-device
  benefit is a *fleet* concern, not an HCS one.
- The exact settings key has churned across Claude Code builds; writing it from
  docs prose would violate invariant 14 (config-spec claims require installed-
  runtime authority provenance). It must be verified against the installed
  build first.
- This is a deliberate one-directory widening of the sandbox boundary — a
  gate-1/security-surface change, not a free win.

Recorded as the fleet-layer option, escalated separately; not adopted here.

### Option C: keep using `$TMPDIR` / `/tmp`

**Pros:**
- Zero change; matches the agent's reflex.

**Cons:**
- Reintroduces every part of the original friction: invisibility, the
  sandboxed-vs-unsandboxed `$TMPDIR` divergence (inv. 17), and the wrong
  durability class. This is the problem, not a solution.

### Option D: commit handoffs into the repo (tracked)

**Pros:**
- Durable and cross-device via Git transport.

**Cons:**
- A non-committal handoff in a tracked path is a contamination hazard (the
  `git add docs/...`-sweeps-it-in problem); it adds governance noise and
  violates the "do-not-commit" nature of the artifact class.

### Option E: type every handoff as an `Artifact` (widen `artifact_kind: handoff`)

**Pros:**
- Maximal typing; one descriptor for every brief.

**Cons:**
- **Fabricates provenance.** `Artifact.run_id` requires a `Run`, which requires
  an authorizing allow-`Decision`. An interactive operator brief has neither;
  minting an `Artifact` for it invents a `Run` and an authorization that never
  occurred — the exact anti-pattern HCS forbids. Record-class is not a stopgap
  to be upgraded; for this subclass it is the correct type.

## Decision

**(a) Ratify Option A.** `.handoffs/` is a record-class, load-bearing-but-
untracked operator-handoff surface — a sibling of `.logs/`, governed by
invariant 13, and explicitly **not** invariant-10 runtime state (a prose brief
is not SQLite/audit/materialized-facts runtime state). Handoff files use the
`*.handoff.md` suffix. The directory is gitignored (commit-prevention) and is
**not** added to the `.claude/settings.json` `Edit()` allowlist (writes stay
prompt-gated). The behavioral convention — briefs → `.handoffs/`, throwaways →
`$TMPDIR`, and every brief ends by echoing its host-resolved absolute path plus
a zsh-ready `bat`/`open` invocation — is stated in `AGENTS.md` (cross-tool) and
reinforced in `CLAUDE.md`. zsh/`just` only; no fish-specific patterns
(the repo opted out of the fleet's fish default).

**(b) Defer the broker-summary storage mechanics.** A handoff that is genuinely
the output of an authorized operation `Run` is an `Artifact`
(`artifact_kind: signed_summary`) whose descriptor references the bytes' home.
Designing that storage-pointer for a producer that does not yet exist (no
broker, no Ring-1) is premature (YAGNI). The reserved `signed_summary` enum
value is placeholder enough. This subclass is recognized and deferred until a
broker exists; no schema or storage-pointer change lands here.

## Consequences

### Accepts

- A second in-repo gitignored surface (`.handoffs/`), justified by the `.logs/`
  precedent and bounded by the `*.handoff.md` suffix + the inv-13 declaration.
- A standing per-write approval prompt on handoff writes, treated as a desirable
  beat for a durable operator-facing artifact rather than friction to remove.

### Rejects

- `.handoffs/` does **not** become tracked, does **not** become inv-10 runtime
  state, and is **not** deletable on gitignore grounds (inv. 13).
- No handoff is typed as an `Artifact` unless it is a real `Run` output; the
  common operator brief carries no `run_id` and no `artifact_kind`.
- No `artifact_kind: handoff` enum widening; no sandbox `allowWrite` change; no
  `Edit(.handoffs/**)` allowlist entry.

### Future amendments

- **Broker-summary storage (part b):** reopens when a broker / Ring-1 runtime
  state exists and a `signed_summary` Artifact needs a concrete storage pointer.
- **External outbox (Option B):** a fleet-layer decision (global ignore for the
  long-tail repos; a synced outbox or quarantine ref for cross-device), gated on
  invariant-14 verification of the sandbox settings key. Out of HCS scope.
- **A dedicated CI gate** for `.handoffs/` hygiene, if the class grows beyond the
  self-protecting suffix.

### Tracked separately

- Making **permission-posture a queryable fact** — so an incoming agent (or an
  unsituated general assistant reading `AGENTS.md`) can consult "this repo
  tightened gate-1, so any 'no settings change needed' claim is false here"
  *before* proposing config. The `zsh`-only opt-out is already a queryable fact;
  the gate-1 posture is not. Logged as its own substrate item (PLAN.md); not a
  dependency of this ADR.

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md` v1.5.0 —
  invariants 10 (public source / private deployment), 13 (deletion authority is
  not gitignore state), 17 (execution context is declared, not inferred)
- Decision ledger: `DECISIONS.md` entry D-074 (added on acceptance)
- Related ADRs: 0070 (`Artifact` — the descriptor/storage split), 0053 (`Run` —
  the `authorizing_decision_id` requirement), 0055 (`Session`), 0011
  (public/private boundary — inv-10 runtime-state layout)
- `scripts/ci/no-runtime-state-in-repo.sh` (the gate the `*.handoff.md` suffix
  is clean against), `.gitignore` (`.logs/` precedent + the new handoff block)

### External

- Claude Code sandboxing / settings — `code.claude.com/docs/en/sandboxing`
  (the `$TMPDIR` sandboxed-vs-unsandboxed divergence; the `allowWrite` form for
  Option B). Verify against the installed build per invariant 14 before relying
  on any specific key.

## Revision history

- 2026-06-14: Initial proposal. Required `hcs-architect` review (IMPLEMENT.md
  §Required subagent reviews) returned `accept-ready`, zero blocking — every
  load-bearing claim verified against source (the
  `Artifact.run_id → Run.authorizing_decision_id → Decision{allow}` chain has
  no interactive-session path; `signed_summary` is a reserved `artifact_kind`;
  `*.handoff.md` is CI-clean against `no-runtime-state-in-repo.sh`'s pattern
  list; the inv-10/inv-13 distinction matches how `.logs/` is treated). Folded
  two non-blocking wording tweaks (ADR 0011 citation precision; "applies" vs
  "operationalizes").
