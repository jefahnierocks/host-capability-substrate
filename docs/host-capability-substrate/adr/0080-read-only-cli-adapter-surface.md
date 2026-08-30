---
adr_number: 0080
title: Read-only CLI adapter surface
status: accepted
version: v1
date: 2026-07-25
charter_version: 1.6.0
tags: [ring-2, adapter, cli, read-only, class-e, adr-0079-followup]
---

# ADR 0080: Read-only CLI adapter surface

## Status

`accepted`

Ships in the same PR as the code it governs, per D-085's successor rule.

## Date

2026-07-25

## Context

`packages/adapters/cli/` has held a `.gitkeep` since the repo was scaffolded.
No ADR authorizes a CLI surface: ADR 0003 covers transport topology (stdio +
Streamable HTTP), and ADR 0079 §Out of scope explicitly excludes "any consumer
of the returned rules" — which a CLI verb is. Citing either as authorization
would repeat regression trap #61 for a third time.

ADR 0079 also left a precondition on this PR: "A no-argument public form.
`LoadOptions` takes a caller-supplied path, which is acceptable while the only
callers are tests; before an adapter forwards a path argument, the public form
must become kernel-resolved."

The substrate has produced no runnable surface in its history. Everything built
so far is verified by tests and CI. That is not the same as an operator being
able to ask the substrate a question and read the answer.

## Decision

A read-only `hcs` CLI adapter at `packages/adapters/cli/`, with exactly one
substantive verb in this ADR's scope: **`hcs policy status`**.

**Read-only by construction, not by convention.** The adapter registers no
`Capability`, accepts and emits no `OperationShape`, mints and consumes no
`ApprovalGrant`, spawns no process, and writes nothing. Adding a verb that
mutates host state makes this package class I and gates it behind charter
invariant 7.

**The adapter decides nothing** (charter inv. 1). `policy-status.ts` formats the
loader's result object and does nothing else. It contains no tier name, no
classification branch, and no verdict of its own. A guard test asserts no tier
literal appears in adapter source, derived from `policyRuleTierSchema.options`
rather than hand-written.

**It imports only `@hcs/kernel/api`.** The kernel's exports map publishes that
path and nothing deeper, so a kernel internal is unreachable from Ring 2 at
module resolution — `ERR_PACKAGE_PATH_NOT_EXPORTED` — independently of whether
`boundary-check.sh` rule 2 is working.

**Dispatch is an exhaustive match over a closed verb list**, not a lookup with a
default handler. An unrecognised verb exits `2`. A rejected snapshot exits `1`:
a snapshot the kernel refuses is an operator-visible failure, not an
informational note.

**`run(argv)` is exported and pure** — it returns `{exitCode, lines}` rather
than writing to stdout — so the verb is testable without spawning a process or
capturing streams.

**Kernel-resolved snapshot path.** This ADR discharges ADR 0079's precondition:
`@hcs/kernel/api` now exports `loadBoundPolicyRules()`, which takes no path.
`resolveBoundSnapshotPath()` reads `HCS_ROOT` when set and falls back to the
kernel module's own location — charter inv. 15 warns that GUI apps, launchd
jobs, and IDE extensions do not inherit shell env, so a resolver that only read
the variable would fail in exactly those contexts. The parameterized
`loadPolicyRules` remains for tests, which must stage mutated snapshots.

## Out of scope

This ADR does not authorize:

- Any mutating verb, any verb that spawns a process, or any verb that writes to
  disk or network.
- MCP tools, HTTP endpoints, or the dashboard. ADR 0003 governs transports;
  those surfaces need their own ADRs.
- `hcs audit verify` or any audit-adjacent verb. The audit store does not exist,
  and ADR 0077 §5 makes its chain-walk a kernel write path — a "read-only" verb
  that induces a kernel write is not read-only.
- Gateway re-derivation, `Decision` construction, capability registration, tool
  resolution, or host state. ADR 0057 §Out of scope defers all of these to ADRs
  that do not exist.
- Installing `hcs` onto `PATH`. The verb is invoked through `just cli` in this
  ADR's scope; a PATH install is a host-surface change with its own posture
  questions.
- Machine-readable output. The current renderer is for a human reading a
  terminal. A `--json` form is a contract, and contracts get ADRs.

## Options considered

**Fold the verb into ADR 0079.** Rejected: 0079's §Out of scope excludes
consumers of its own output, and amending an ADR to authorize the thing it just
declined is the shortcut D-085 recorded against.

**Skip the ADR and cite 0079 §Consequences**, which mentions this verb as
next work. Rejected on the generalized citation rule: a document mentioning
something is not the same as authorizing it. That rule exists because this
failure has now occurred twice.

**Ship a `--json` mode immediately.** Deferred. The first consumer is a human;
a machine format invites a parser, and a parser is a contract that outlives the
convenience.

## Consequences

An operator can run `just cli policy status` and read what the substrate knows
about the bound policy snapshot — the first invocable surface this project has
produced.

It also makes `boundary-check.sh` rule 2 load-bearing for the first time: that
rule is `[ -d packages/adapters ]`-guarded and scans adapters only, so until
this package existed it had no subject. The rule was repaired in PR #93 after
three months of never executing; this is the first code it actually polices.

Class **E** — adapter read path.

## References

- ADR 0079 §Out of scope — the kernel-resolved-path precondition this discharges
- ADR 0003 — transport topology; does not cover a CLI surface
- ADR 0057 §Out of scope — why gateway/capability/tool-resolution verbs are absent
- ADR 0077 §5 — why `hcs audit verify` is out of scope
- charter inv. 1 (adapters do not classify), inv. 7 (callability), inv. 15
  (GUI/launchd do not inherit shell env)
- D-085 — the successor rule under which this ADR ships with its code
