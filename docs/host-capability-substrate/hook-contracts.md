---
title: HCS Hook Contracts
category: reference
component: host_capability_substrate
status: stub
version: 0.5.1
last_updated: 2026-07-01
tags: [hooks, claude-code, codex, policy, contracts]
priority: medium
---

# HCS Hook Contracts

Defines how hooks interact with the HCS substrate. Populated in Phase 3 when the kernel exposes `system.tool.resolve.v1` and `system.policy.classify_operation.v1`. Current project hooks are thin adapters only: they do not contain policy tables, destructive-pattern arrays, or forbidden-operation regexes.

## Current hook posture

**Neither wrapper is registered.** As of D-083 (2026-07-25) the Phase-0b
measurement lane is decommissioned: `.claude/settings.json` has no `hooks` key
and `.codex/hooks.json` is `{"hooks": {}}`. Both wrapper scripts remain on disk
as the Phase-3 attachment point and are reachable only from
`scripts/dev/run-hook-fixtures.sh`. Nothing intercepts a tool call on either
runtime today.

The description below therefore documents what the wrappers *do when invoked*,
not an active interception path. Re-registering either one is gated on D-083's
open question: the delegated CLI returns `permissionDecision: "allow"` on every
path, and a `PreToolUse` hook returning `allow` on matcher `Bash` may bypass the
`.claude/settings.json` deny list entirely.

`.claude/hooks/hcs-hook` and `.codex/hooks/hcs-hook` scripts:

- Resolve the HCS repo root.
- Export `HCS_ROOT`.
- Delegate to `scripts/dev/hcs-hook-cli.sh`.
- Do not block, deny, or ask in the current Phase 0b posture.
- Do not embed live policy, tier tables, forbidden-pattern arrays, or
  destructive-operation regexes.

The shared delegated hook (`scripts/dev/hcs-hook-cli.sh`):

- Reads the JSON hook envelope from stdin
- Classifies shell commands with `scripts/dev/classify.py`
- Writes decision records to `.logs/phase-0/<YYYY-MM-DD>/hook-decisions.jsonl`
- Always returns `allow` in Phase 0b; it is measurement-only, never the enforcement boundary
- Emits a Claude/Codex-compatible common stdout schema. Do not add Claude-only
  response fields such as `suppressOutput`; Codex rejects unsupported hook
  response keys.
- Exists to collect measurement evidence, not to replace substrate policy

The interim classifier is a temporary measurement backstop only. It is
non-authoritative, data-driven by the Phase 0b fixture corpus, and sunsetted:
when Ring 1 RPC exists, hooks call `system.tool.resolve.v1` and
`system.policy.classify_operation.v1`; before Ring 1 exists, any runtime cache
used for decisions must be generated from the live system-config policy and
hash-bound to source commit/path/hash. Hook bodies must not copy the classifier
tables.

Closeout parity on 2026-04-26 added trap #18 coverage to the interim
classifier: direct secret-shaped env echo and `printenv|env | grep` value
enumeration classify as forbidden measurement events. Safe alternatives are
existence-only, names-only, classified, or hashed inspection. Canonical
enforcement moves to Ring 1 when `system.policy.classify_operation.v1` exists.

## Phase 3+ (RPC to substrate)

Hook upgrades to:

- Call `system.tool.resolve.v1` with 50ms timeout + cache fallback
- Call `system.policy.classify_operation.v1` with 50ms timeout + cache fallback
- Classification `read-safe` → allow
- Classification `write-local` / `write-project` → allow with warning
- Classification `write-host` → ask (substrate not yet running execute lane)
- Classification `write-destructive` or `forbidden` → block
- Fail-open for reads (warn + allow on timeout or substrate-unreachable)
- Fail-closed for writes (deny when command is confidently mutating/destructive and substrate can't classify)

The cache fallback is not hand-authored hook policy. It must be either Ring 1
managed state or a generated, hash-bound runtime policy/cache sourced from the
live system-config policy.

## Phase 4+ (gateway integration)

Hook additionally:

- Proposes via `system.gateway.propose.v1`
- Consumes `ApprovalGrant` via `system.gateway.consume_grant.v1`
- Records pass-through events in audit log

## Codex hooks

Advisory only. Codex project hooks live in `.codex/hooks.json` and load only
when the project `.codex/` layer is trusted. Bash coverage is incomplete per
D-007 and the current Codex hooks documentation; Codex hooks can log and return
advisory decisions, but substrate policy/gateway remains the real enforcement
boundary.

## Populated by

- Phase 3 — hooks connected to substrate
- `hcs-hook-integrator` subagent maintains

## References

- Research plan §22.8 (implementation-phase hook strategy)
- Charter invariants 1 (no policy in adapters), 4 (audit internal)
- Boundary decision §11 (stage-by-stage config)
- D-005, D-006, D-007 in `DECISIONS.md`
- OpenAI Codex Hooks documentation:
  `https://developers.openai.com/codex/hooks`

## Change log

| Version | Date | Change |
|---------|------|--------|
| 0.5.1 | 2026-07-01 | Removed `suppressOutput` from the shared hook stdout schema after Codex rejected it as unsupported; hook fixtures now guard against reintroducing the field. |
| 0.5.0 | 2026-05-12 | Removed hook-local literal-block posture from the contract. `.claude/hooks/hcs-hook` and `.codex/hooks/hcs-hook` are now thin wrappers around the Phase 0b measurement CLI; any future hard-decision cache must be Ring 1 managed or generated/hash-bound from system-config live policy. |
| 0.4.0 | 2026-05-01 | Added project-scoped `.codex/` hook contract notes and clarified that Codex hooks are trusted-project advisory guardrails, not the enforcement boundary. |
| 0.3.0 | 2026-04-26 | Added Phase 0b closeout note for trap #18 secret-safe env-inspection parity in the interim classifier and repo-local hook. |
| 0.2.0 | 2026-04-23 | Added the Phase 0b measurement-hook contract and clarified the distinction between the repo-local guardrail hook and the opt-in soak hook. |
| 0.1.0 | 2026-04-22 | Initial stub. |
