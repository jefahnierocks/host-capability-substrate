# W-A Situation Check

Directive: `NASH-DIR-HCS-CODEX-ORIENT-2026-06-04`
Status: scratch proposal / evidence report only. Not an applied change.

## Status

Phase 0b hook posture is still measurement-only for the HCS project hooks. The
current branch has accepted ADR/D-ledger coverage through CommandShape at the
docs layer, source schemas for PolicyRule and Capability, no CommandShape source
schema yet, and no Ring 1 kernel service implementation.

## Evidence

- `git branch -vv`:
  - current branch: `docs/adr-0063-commandshape`
  - upstream: `origin/docs/adr-0063-commandshape`
  - `main` and `origin/main`: `6d2a068`
- `git log --oneline --decorate -12`:
  - `37d6be7 docs: accept ADR 0063 command shape ring 0 entity (D-061)`
  - `6d2a068 schema: land adr 0062 capability ring 0 entity (D-060) (#13)`
- `codex --version`: `codex-cli 0.138.0-alpha.4`
- `find packages/kernel -maxdepth 3 -type f | sort`:
  - `packages/kernel/.gitkeep`
- File existence probe:
  - `packages/schemas/src/entities/policy-rule.ts`: exists
  - `packages/schemas/src/entities/capability.ts`: exists
  - `packages/schemas/src/entities/command-shape.ts`: absent
  - `packages/schemas/generated/PolicyRule.schema.json`: exists
  - `packages/schemas/generated/Capability.schema.json`: exists
  - `packages/schemas/generated/CommandShape.schema.json`: absent
- Hook evidence:
  - `.claude/hooks/hcs-hook:4-11` says the wrapper is thin, contains no policy, delegates to measurement-only code, and future hard decisions come from Ring 1 RPC or a hash-bound generated runtime policy/cache.
  - `.codex/hooks/hcs-hook:4-11` says the same for Codex.
  - `.claude/hooks/hcs-hook:19` and `.codex/hooks/hcs-hook:19` both exec `scripts/dev/hcs-hook-cli.sh`.
  - `scripts/dev/hcs-hook-cli.sh:2-12` says Phase 0b is log-only and never blocks, denies, or asks.
  - `scripts/dev/hcs-hook-cli.sh:109-115` always emits `permissionDecision: "allow"`.
  - `.codex/hooks.json:3-11` wires Codex `PreToolUse` Bash hooks to `.codex/hooks/hcs-hook`.
  - `.claude/settings.json:84-92` wires Claude `PreToolUse` Bash hooks to `.claude/hooks/hcs-hook`.
- Classifier evidence:
  - `scripts/dev/classify.py:2-11` identifies the classifier as Phase 0b interim measurement code, not an HCS decision.
- Current policy snapshot checks:
  - `just snapshot-binding-check`: passed, source policy digest `sha256:e06442e02db50604e8ae8cbc1572a4ecec91ae87bfac6705e52161fd450ae68b`.
  - `just policy-lint`: passed, generated policy snapshot compatibility OK.

## Assessment

- Ring 0: PolicyRule and Capability are implemented in Zod, generated JSON Schema,
  tests, and ontology docs. CommandShape is accepted at ADR/D-ledger layer but not
  implemented in source.
- Ring 1: kernel remains placeholder-only. There is no Ring 1 classifier, loader,
  gateway, mint/audit implementation, runtime policy cache, or execution broker.
- Hooks/adapters: project hooks are thin wrappers. They log and allow; none returns
  a project HCS `block`.
- Phase 0b measurement-only status is confirmed.

## Proposal Path

This file is the W-A proposal/evidence path:
`docs/host-capability-substrate/research/local/2026-06-04-hcs-codex-orientation/W-A-situation-check.md`

## Boundary Adherence

No parent repo files were read after the directive. No hook behavior, schemas,
policy, config, or runtime state were changed. This is HCS-local scratch output.

## Open Operator Decisions

- Whether to treat `docs/adr-0063-commandshape` as the active working branch for
  the next schema slice or first merge/rebase it to `main`.
- Whether the rego reorientation should interrupt CommandShape schema landing or
  run as a docs/decision/ADR proposal first.
