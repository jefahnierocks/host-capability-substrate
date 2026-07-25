---
adr_number: 0007
title: Hook call pattern — blocking RPC with cache fallback
status: accepted
date: 2026-04-22
charter_version: 1.1.0
tags: [hooks, claude-code, codex, rpc]
---

# ADR 0007: Hook call pattern — blocking RPC with cache fallback

## Context

PreToolUse hooks need to consult the HCS substrate without adding perceptible latency. Substrate may be unavailable (Phase 0a, startup, crashes). Agents must degrade gracefully.

## Decision

- **Pattern:** blocking local RPC with 50ms timeout and cache fallback.
- **Reads:** warn-and-allow on timeout or substrate-unavailable (fail-open).
- **Writes:** warn-and-deny when the command is confidently classifiable as mutating/destructive (fail-closed).
- **Claude Code:** command hooks for hard decisions; HTTP hooks for advisory/telemetry only.
- **Codex hooks:** advisory only (Bash-only coverage); not the enforcement boundary.

## Consequences

### Accepts

- Slight latency budget for classification (50ms p99).
- Hook bodies stay thin; logic delegates to substrate + cache.

### Rejects

- Async hooks for hard decisions (loses fail-closed semantics).
- HTTP hooks as sole enforcement (Claude HTTP hook failures non-blocking).
- Codex hooks as enforcement boundary (incomplete coverage).

### Future amendments

- If Codex hook coverage improves, elevate Codex hooks.
- If substrate sub-20ms becomes achievable reliably, tighten timeout.

## Degraded-path constraint (added 2026-07-25, D-083)

The blocking-RPC-with-cache-fallback design has a degraded path — timeout, cache
miss, kernel unavailable, malformed input. That path is where this pattern's
predecessor failed:

> On timeout, cache miss, kernel unavailability, or malformed input, the hook
> **emits no permission decision**. The degraded path is never more permissive
> than the healthy path.

Emitting `allow` on the degraded path is forbidden. It is an approval decision
from an adapter (charter inv. 1), and a kernel outage silently disabling the
operator's own deny list is the same fail-open shape as the five sites D-083
enumerates.

Empirically grounded rather than reasoned: a hook that exits 0 with empty stdout
passes cleanly through to the permission system on CLI 2.1.220 (case 5 of
`docs/host-capability-substrate/hook-permission-precedence-probe-2026-07-25.md`).
"Emit nothing" is chosen over `permissionDecision: "defer"` because it asserts
nothing at all and cannot be misparsed into permission, and because `defer`
remains untested on this binary.

Note the probe also establishes that hook `deny` DOES carry authority on 2.1.220
while hook `allow` is inert. So the failure mode to design against is not a hook
that wrongly permits — it is one that wrongly denies on kernel timeout and blocks
legitimate work. Emitting nothing avoids both.

## References


### Internal

- Research plan §§21.2, 21.3, 21.4, 22.8
- Decision ledger: `DECISIONS.md` entries D-005, D-006, D-007
- `.claude/hooks/hcs-hook` Phase 0a implementation *(present on disk but **unregistered** since D-083, 2026-07-25 — the Phase-0b measurement lane was decommissioned. This ADR's blocking-RPC-with-cache-fallback design is unchanged and remains the Phase-3 target; only the interim measurement wiring was withdrawn.)*

### External

- [Claude Code hooks](https://docs.anthropic.com/en/docs/claude-code/hooks)
- [Codex hooks](https://developers.openai.com/codex/hooks)
