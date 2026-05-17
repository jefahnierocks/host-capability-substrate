---
title: Phase 2.5 Policy Handoff
category: handoff
date: 2026-05-17
status: current-at-handoff
tags: [phase-2-5, policy, handoff, system-config, snapshot]
---

# Phase 2.5 Policy Handoff - 2026-05-17

This is the fresh-agent entry packet for the HCS side of the Phase 2.5 policy
lane. It records what is done, what is still blocked, and where the next work
must happen.

## Bottom Line

HCS has completed its current Phase 2.5 prerequisites:

- ADR 0056 reason-kind schema slice landed.
- Hook-local policy arrays were removed.
- HCS policy lint is now generated-snapshot compatibility lint only.

The next work is not in HCS. It is system-config live-policy activation work.
Until that lands, do not vendor a policy snapshot into HCS and do not start a
Ring 1 mint/audit service ADR.

## HCS State Observed

At the start of this closeout pass, HCS `main` was clean and aligned with
`origin/main` at `4373007` (`docs: refresh hcs handoff status (2026-05-17)`).
The HCS-side closure commits are:

- `0440c9c` - `schema: land adr 0056 decision reasons`
- `2d45327` - `hooks: remove local policy arrays`
- `78f0d13` - `ci: split policy snapshot lint`
- `4373007` - `docs: refresh hcs handoff status (2026-05-17)`

Run `git status --short --branch` before acting; this file is a handoff
snapshot, not a substitute for live branch checks.

## HCS Decisions Now Settled

- `D-046`: ADR 0056 v3 accepted and schema landed. `operation_class_unregistered`
  and `audit_chain_corruption_detected` are in `decisionReasonKindSchema`.
  Both are deny-only. `operation_class_unregistered` is non-clearable:
  `required_grant_kind` must be `null`, and any non-null grant kind rejects.
  `Decision.operation_shape_ref` remains required.
- `D-047`: `.claude/hooks/hcs-hook` and `.codex/hooks/hcs-hook` are thin
  wrappers. They do not contain hook-local forbidden-pattern arrays or tier
  tables.
- `D-048`: policy lint is split. `system-config` owns live-policy lint. HCS
  owns only vendored generated-snapshot compatibility lint.

## HCS Non-Claims

The following are still not true:

- No live `system-config/policies/host-capability-substrate/tiers.yaml` exists.
- No HCS snapshot has been vendored under `policies/generated-snapshot/`.
- No Ring 1 mint/audit service ADR has been opened.
- No Ring 1 enforcement exists.
- No execution broker work is authorized by this lane.

## System-Config State Observed

Sibling repo inspected:
`/Users/verlyn13/Organizations/jefahnierocks/system-config`

Observed state during this closeout pass:

- `main` was ahead of `origin/main` by 2 commits:
  - `5503656` - `docs(device-admin): record desktop ssh rca follow-up`
  - `44c730d` - `chore(device-admin): backfill desktop rca status commit`
- Worktree had unrelated non-HCS dirty state:
  - `AGENTS.md`
  - `scripts/system-update.d/README.md`
  - `scripts/system-update.d/gam.sh`
  - untracked `docs/google-admin-tooling.md`
- No diffs were observed under:
  - `docs/host-capability-substrate/`
  - `policies/host-capability-substrate/`
  - `scripts/policy-lint.sh`

System-config HCS policy lane was still blocked:

- `scripts/policy-lint.sh` was still the 156-line live-policy lint stub.
- `docs/host-capability-substrate/tiers.yaml.v0.2.0-skeleton.yaml` still had
  `status: activation_candidate_non_authoritative`.
- The candidate still listed
  `activation_blockers_remaining: [fix_4_reason_kind_path, fix_7_policy_lint_placement]`,
  even though HCS has closed those decisions via D-046 and D-048.
- The candidate still had `provenance.hcs_source_commit: f8792b3`, which is
  stale relative to the HCS-side closure commits.
- No `tests/policies/host-capability-substrate/` fixtures existed.
- `policies/host-capability-substrate/` contained only
  `project-substrate-admission.yaml`.

## Next Agent Route

If the next agent is in HCS:

1. Re-run `git status --short --branch`.
2. Re-run `just verify`.
3. Do not change policy or Ring 1 service code unless system-config has a live
   `policies/host-capability-substrate/tiers.yaml` with source commit/path/hash.
4. Only after live policy exists, vendor a snapshot into
   `policies/generated-snapshot/` with:
   - `snapshot_binding.system_config_commit`
   - `snapshot_binding.source_policy_path`
   - `snapshot_binding.source_policy_sha256`
5. Run `just policy-lint` and `just verify` after snapshot vendoring.

If the next agent is in system-config:

1. Preserve unrelated device-admin / Google-admin dirty work.
2. Expand `scripts/policy-lint.sh` as the live-policy lint surface.
3. Add negative lint fixtures for:
   - forbidden with approval path
   - broad grant scope
   - grant reuse
   - external mutation missing provider evidence
   - sandboxed worktree lease acquire
   - invalid reason kind
   - raw secret material
   - snapshot binding missing
   - tier valid-until ceiling exceeded
4. Refresh the Phase 2.5 candidate to mark `fix_4_reason_kind_path` and
   `fix_7_policy_lint_placement` resolved, citing HCS D-046 and D-048.
5. Promote to live `policies/host-capability-substrate/tiers.yaml` only after
   lint and fixtures pass, with source commit/path/hash binding populated.
6. Mark the live policy as policy data only, not Ring 1 enforcement.

## Stop Rules

- Do not treat the system-config candidate as live policy.
- Do not vendor an HCS snapshot from a candidate path.
- Do not start Ring 1 mint/audit work before live policy and snapshot exist.
- Do not fold hook cleanup, live policy activation, snapshot vendoring, and
  Ring 1 service design into one PR.
- Do not edit or normalize unrelated system-config dirty work from an HCS
  session.

