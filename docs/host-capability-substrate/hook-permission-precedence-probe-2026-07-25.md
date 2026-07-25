---
title: PreToolUse hook vs permission-system precedence — observed-runtime probe
category: evidence
component: host_capability_substrate
status: active
version: 1.0.0
last_updated: 2026-07-25
tags: [hooks, permissions, precedence, invariant-14, observed-runtime, probe, d-083]
priority: high
---

# PreToolUse hook vs permission-system precedence — observed-runtime probe

Dated evidence artifact. Method and negative controls recorded so the result is
reproducible and its limits are visible.

## Why this exists

D-083 parked an open question: `scripts/dev/hcs-hook-cli.sh` returned
`permissionDecision: "allow"` on every path, so it may have been neutering the
`.claude/settings.json` deny list for the life of the repo.

Three independent sources predicted that it did:

1. Official Claude Code documentation, as read by a research agent
   (`code.claude.com/docs/en/hooks.md`): PreToolUse runs first at highest
   precedence, and a hook returning `allow` "bypasses the permission system."
2. The operator's prior.
3. This agent's prior.

**All three were wrong.** Charter invariant 14's authority order — observed
runtime + matching changelog > static vendor docs > published schema > model
memory — has been an assertion in a charter for months. This is the first time it
produced a result no one predicted.

## Method

- **CLI:** `2.1.220 (Claude Code)`, observed via `claude --version`. Note this is
  **not** the `2.1.177` recorded in `AGENTS.md` §Tool baseline; that row is stale
  and is an inv-12 re-baseline trigger.
- **Host:** macOS `26.5.2` (confirmed incidentally by the posture test).
- Scratch directory under `$TMPDIR`, its own `.claude/settings.json`, synthetic
  deny rule, harmless probe command. No HCS file and no live setting was modified.
- Hooks instrumented to append to a log file, so hook firing is proven rather than
  assumed.
- `~/.claude.json` was backed up before the trust-state case and restored from
  that backup afterward; scratch directory removed. Zero residue verified.

## The control failed first, and that is a finding

The initial control used deny rule `Bash(echo HCSPROBE:*)` and command
`echo HCSPROBE:ran`. **The command ran.**

Cause: the colon in the probe string collides with the `:` separator in the
`Bash(prefix:*)` pattern form. The rule matched nothing, and **no warning was
emitted**.

> **A malformed deny pattern fails open, silently.**

This is why the control ran first. A positive result without it would have been
uninterpretable — "the command ran" could not have been distinguished from "the
rule never matched." Re-run with a colon-free pattern (`Bash(sw_vers:*)`), the
control blocked correctly, and the sequence proceeded.

## Results — CLI 2.1.220

| # | Setup | Hook fired | Outcome |
|---|---|---|---|
| 0 | deny rule, no hook | — | **blocked** (control valid) |
| 0a | deny pattern with colon collision | — | **RAN** (fail-open, silent) |
| 1 | hook `allow` + deny rule, untrusted workspace | yes | **blocked** |
| 1t | hook `allow` + deny rule, **trusted** workspace | yes | **blocked** |
| 2 | ask-listed command, no hook | — | not granted |
| 3 | hook `allow` + ask-listed command | yes | **not granted** |
| 4 | hook `deny` + allow-listed command | yes | **blocked by the hook**, reason surfaced |
| 5 | hook exits 0, empty stdout, ordinary command | — | **ran cleanly** — no error, timeout, or log spam |

In cases 1, 1t, and 3 the hook's captured input confirms it received
`tool_name: Bash` and the exact command, and returned `allow`.

## Finding

**On CLI 2.1.220, a PreToolUse hook can restrict but cannot permit.**

- `permissionDecision: "deny"` — has real authority; blocks an otherwise-allowed
  operation and surfaces its reason.
- `permissionDecision: "allow"` — overrides neither `permissions.deny` nor
  `permissions.ask`. Inert.
- Empty output (exit 0, no stdout) — clean pass-through to the permission system.

Confirmed in both trusted and untrusted workspaces. The trusted-workspace re-run
was added mid-probe after case 4 surfaced the warning "Ignoring 1
permissions.allow entry … this workspace has not been trusted," which raised the
possibility that trust state — not precedence — was suppressing `allow`. It was
not: the result is identical either way.

## Not tested

`permissionDecision: "defer"` and bare `{"continue": true}` with no decision
field. HCS ships neither; "emit nothing" is the ADR 0007 rule and it is verified
at case 5. Logged as F-002 in the findings queue.

## Consequences

1. **D-083's open question is closed.** No bypass occurred. The Phase-0b hook's
   `allow` was ignored by the runtime for its entire life.
2. **The inv-1 violation is undiminished and becomes the primary finding.** An
   adapter asserted the maximally permissive approval verdict on every Bash call
   from `8edf2d9` to `431c5e3`. That the runtime ignored it is luck, not design;
   the assertion would have become live under a runtime change.
3. **ADR 0007's degraded-path constraint is now empirically grounded**: emit no
   decision, rather than `allow`. Verified clean at case 5, and it depends on no
   undocumented value.
4. **The deny list itself was verified separately.** All 11 Bash deny entries
   block their probe command — see `scripts/dev/verify-deny-rules.sh`.

## Re-verification trigger

A Claude Code CLI version change invalidates this artifact. Bind re-running both
this probe and `verify-deny-rules.sh` to the inv-12 re-baseline ritual in
`AGENTS.md` §Tool baseline. A control verified once is not a verified control.
