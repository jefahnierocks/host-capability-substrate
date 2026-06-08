# W-B Retire Dead Codex Profiles Proposal

Directive: `NASH-DIR-HCS-CODEX-ORIENT-2026-06-04`
Status: scratch proposal only. Not an applied change.

## Status

Profile-era Codex wording still appears in active HCS-facing docs. The current
Codex CLI is `0.138.0-alpha.4`; the directive says legacy `[profiles.hcs-*]`
entries are dead under the v2 profile model and conflict with a GPT-5.5 default.
D-031 already prevents HCS from depending on profiles as a cross-surface
mechanism, so this is a documentation and role-table cleanup, not a new
architecture decision.

## Evidence

- `codex --version`: `codex-cli 0.138.0-alpha.4`.
- `AGENTS.md:9` still says "GPT-5.5/GPT-5.4-compatible HCS profiles".
- `AGENTS.md:145-147` says Codex reviewer definitions inherit the active Codex
  model/profile.
- `AGENTS.md:154-155` names `Codex GPT-5.4 (profile: hcs-implement)` for schema
  and kernel implementation roles.
- `README.md:57-62` still names GPT-5.5/GPT-5.4-compatible HCS profiles in the
  early-phase tool baseline.
- `.codex/config.toml:1-3` says most behavior comes from user-global profiles.
- `docs/host-capability-substrate/tooling-surface-matrix.md:21` names
  GPT-5.5/GPT-5.4-compatible HCS profiles.
- `docs/host-capability-substrate/tooling-surface-matrix.md:102` says to add
  `hcs-plan` / `hcs-implement` / `hcs-review` profiles.
- `docs/host-capability-substrate/tooling-surface-matrix.md:247` repeats the
  profile-era anti-pattern wording.
- `DECISIONS.md:127` records D-031: profiles are CLI-only opt-ins and not a
  cross-surface identity/auth/policy/app mechanism.
- `DECISIONS.md:161` records D-054: Codex CLI was not asserted in that packet;
  Codex model posture still used the GPT-5.5/GPT-5.4-compatible profile wording.
- `PLAN.md:1036` still has an open direct-test item to confirm
  `[profiles.hcs-*]` surface coverage.
- Adjacent drift found by grep:
  - `.claude/agents/hcs-eval-reviewer.md:17` and
    `.codex/agents/hcs-eval-reviewer.toml:12` still mention GPT-5.4 scoring.
  - `DECISIONS.md:106` / D-009 names "GPT-5.4 remote MCP hosting"; this is
    historical and should be left as provenance unless a new amendment explicitly
    revises that decision.

## Proposed Edits

1. Add a new decision row, tentatively D-062:

   `Legacy Codex hcs-* profile references are retired for active HCS operating
   guidance under Codex CLI 0.138.0-alpha.4 and the current GPT-5.5 default.
   HCS roles use the active Codex model selected by the session/operator rather
   than `[profiles.hcs-plan|hcs-implement|hcs-review]`. D-031 remains the
   boundary decision: HCS does not depend on profiles as identity, auth, policy,
   app/IDE config, or cross-surface mechanism. Historical rows such as D-029,
   D-031, and D-054 remain as provenance. System-config profile docs are an
   owner handoff, not an HCS edit.`

2. Update active agent-facing docs:

   - `AGENTS.md:9`: replace profile-era wording with current observed Codex CLI
     plus GPT-5.5 default posture. Keep the floor and app-build distinction.
   - `AGENTS.md:145-147`: say Codex reviewer definitions inherit the active
     Codex session model; remove "model/profile".
   - `AGENTS.md:154-155`: replace `Codex GPT-5.4 (profile: hcs-implement)` with
     `Codex GPT-5.5 (active session default)` or `Codex GPT-5.5 xhigh` if the
     operator wants the reasoning-effort posture in the role table.
   - `README.md:60`: remove profile wording and name Codex CLI floor plus active
     GPT-5.5 default.
   - `.codex/config.toml:2`: replace "profiles" with "user-global Codex defaults"
     or remove the sentence.
   - `docs/host-capability-substrate/tooling-surface-matrix.md:21`: remove
     profile wording.
   - `docs/host-capability-substrate/tooling-surface-matrix.md:102`: change the
     Phase 0a posture from "add hcs-* profiles" to "no project dependency on
     named profiles; user-global defaults are observed only".
   - `docs/host-capability-substrate/tooling-surface-matrix.md:247`: update the
     anti-pattern to "using stale/non-baselined models during early-phase HCS
     work" rather than naming hcs profiles.
   - `PLAN.md:1036`: mark the old D-031 profile-coverage probe retired by D-062.

3. Optional adjacent cleanup:

   - Update `.codex/agents/hcs-eval-reviewer.toml` and
     `.claude/agents/hcs-eval-reviewer.md` only if the operator includes agent
     definitions in the cleanup scope. Per `IMPLEMENT.md:125-126`, touching those
     requires `hcs-architect` review and likely security review if permissions or
     secret-handling text changes.

4. System-config handoff:

   - Flag the parallel system-config docs/config references to the system-config
     owner. Do not edit system-config from this HCS directive.

## Proposal Path

This file is the W-B proposal path:
`docs/host-capability-substrate/research/local/2026-06-04-hcs-codex-orientation/W-B-retire-dead-profiles-proposal.md`

## Boundary Adherence

No user-global Codex config, system-config file, active HCS doc, or role table
was edited. The proposal stays in HCS-local scratch docs.

## Open Operator Decisions

- Whether the active role-table wording should name `GPT-5.5 xhigh` explicitly
  or say "active Codex session model" to avoid future model churn.
- Whether to include `.codex/agents/**` and `.claude/agents/**` in the same
  cleanup PR or leave evaluator wording for a separate reviewer-definition PR.
