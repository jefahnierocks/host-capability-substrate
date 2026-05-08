---
title: Phase 2.6 trap scaffold completeness audit
category: research
component: host_capability_substrate
status: planning-input
version: 0.1.0
last_updated: 2026-05-07
tags: [phase-2-6, regression-corpus, trap-skill, audit, seed-md]
priority: medium
---

# Phase 2.6 Trap Scaffold Completeness Audit

## Status

Docs-only audit. Classifies the 22 unscaffolded seeds in
`packages/evals/regression/seed.md` against the binding rule in
`.agents/skills/hcs-regression-trap/SKILL.md`: "No synthetic traps. Every
trap cites a real incident."

This document does not author scaffolds, change schema, change policy,
mutate the corpus index, or amend `seed.md`. It produces a per-seed
disposition that downstream commits can act on, one scaffold per commit, per
the trap skill procedure.

## Methodology

The trap skill defines the gate for promoting a seed to a scaffold:

> **Inputs:** A description of the failure (what the agent did wrong);
> **Citation:** commit hash, session log, or memory note where the failure
> was observed (no synthetic traps); **The expected correct trajectory**.

The audit walks each unscaffolded seed and classifies it into one of three
dispositions:

- **Ready** — a real-incident citation exists in repo evidence (commit,
  ADR review pass, observed soak/intervention record, decision-ledger entry,
  AGENTS.md rule). Scaffold-eligible now under the trap skill procedure.
- **Blocked** — a citation exists but a fixture or transcript prerequisite
  is documented as missing in `seed.md` itself or in `PLAN.md`.
- **No-citation** — the seed derives from research plan §18 brainstorm or
  pure charter-invariant language without a specific repo-observed incident.
  Per the trap skill, NOT scaffold-eligible until a concrete citation
  surfaces. Equivalent to synthetic for skill purposes.

## Inventory

`seed.md` records 58 numbered seeds. 36 have scaffold files today:
#16, #18, #19–#38, #45–#58. The remaining 22 unscaffolded seeds are
the audit subject.

| Range | Seeds | Origin |
|---|---|---|
| #1–#15 | 15 | Research plan §18 brainstorm; charter invariants 7, 11 |
| #17 | 1 | 2026-04-23 Claude Code 2.1.119 startup-block incident |
| #39–#44 | 6 | 2026-04-30 Codex/ScopeCam exchange lessons report and synthesis |

## Disposition Table

| # | Seed name | Disposition | Citation found | Notes |
|---|---|---|---|---|
| 1 | launchctl-deprecated-verbs | No-citation | none | Pattern attested in macOS 15+ convention but no HCS-observed incident in commits, soak partitions, interventions, or memory. |
| 2 | brew-vs-mise-node-resolution | No-citation | none | Research plan §18 derivation only. |
| 3 | venv-vs-system-python | No-citation | none | Research plan §18 derivation only. |
| 4 | docker-missing-orbstack-present | No-citation | none | Research plan §18 derivation only. |
| 5 | tcc-denial-as-missing-file | No-citation | none | Research plan §18 derivation only. |
| 6 | xcode-select-wrong-path | No-citation | none | Research plan §18 derivation only. |
| 7 | quarantine-bit-as-codesign | No-citation | none | Research plan §18 derivation only. |
| 8 | gnu-vs-bsd-flag-divergence | No-citation | none | Research plan §18 derivation only. Note: `feedback_phase_0b_gotchas.md` records BSD/GNU friction during Phase 0b but as agent operating notes, not a trap-shaped session/commit citation. |
| 9 | subcommand-changed-between-versions | No-citation | none | Research plan §18 derivation only. |
| 10 | help-output-cached-across-version-change | No-citation | none | Research plan §18 derivation only. Note: charter inv. 14 (config-spec authority) and #17 cover the adjacent class with citation. |
| 11 | shell-mode-confusion | No-citation | none | Research plan §18 derivation only. Scanner heuristic `shell-mode-confusion-login` is documented in `trap-known-limitations.yaml` as overstating real incidents (`overstates_real`); does not satisfy the skill's incident-citation requirement. |
| 12 | rm-rf-no-escalation | No-citation | none | Charter invariant 7 derivation. Note: #16 (`ignored-but-load-bearing-deletion`) carries the related observed `rm -rf` incident; #12's distinct "no escalation" framing has no separate citation. |
| 13 | launchctl-deprecated-load-unload | No-citation | none | Seed.md flags this as duplicate of #1; kept as a policy-specific trap. No incident citation. |
| 14 | brew-cask-escalation-missed | No-citation | none | Research plan §18 derivation. Scanner heuristic `brew-cask-escalation-missed` is documented in `trap-known-limitations.yaml` with a 50-hit cap (`understates_real`); does not satisfy the skill's incident-citation requirement. |
| 15 | orbstack-docker-socket-confusion | No-citation | none | Research plan §18 derivation only. |
| 17 | harness-config-boolean-type | Ready | 2026-04-23 Claude Code 2.1.119 startup-block incident; charter v1.2.0 inv. 14; D-026; system-config `docs/claude-cli-setup.md` and `docs/agentic-tooling.md` | Scanner heuristic landed in W3 closeout. Failure pattern, forbidden output (`"verbose": "true"` JSON-string-where-boolean-required), and required trajectory assertion (verify against installed-runtime parser before persisting) are all extractable. No fixture prerequisite documented as blocking. |
| 39 | tool-symptom-as-environment-diagnosis | Blocked | 2026-04-30 Codex/ScopeCam exchange lessons report; HCS synthesis | `seed.md` row 39 explicitly: "Scaffold deferred until redacted primary transcript or human-approved fixture exists." Honors the source-bound discovery rule for ScopeCam-derived traps. |
| 40 | execution-mode-conflation | Blocked | 2026-04-30 Codex/ScopeCam lessons; Q-008 framing | Same blocker as #39. Q-008(a) acceptance via ADR 0028 covers execution-mode receipts but does not provide the redacted-transcript primary citation the trap skill requires. |
| 41 | remote-gone-branch-deletion-without-proof | Blocked | 2026-04-30 Codex/ScopeCam lessons; ADR 0025 v2 BranchDeletionProof | Same blocker as #39. ADR 0025 v2 specifies the proof composite that the corrected behavior would consume, but the failure citation is in the ScopeCam transcript. |
| 42 | worktree-ownership-ignored | Blocked | 2026-04-30 Codex/ScopeCam lessons; ADR 0019 v3 / Q-003 acceptance unblocks the CoordinationFact composition | `seed.md` row 42 still says "Scaffold deferred until redacted primary transcript or human-approved fixture exists." Q-003 acceptance (2026-05-03) and D-033 (2026-05-07) clear the coordination-facts dependency, but the transcript-source blocker remains. |
| 43 | branch-flow-ancestry-ignored | Blocked | 2026-04-30 Codex/ScopeCam lessons | Same blocker as #39. The specific `main`/`development` invariant is ScopeCam-specific; HCS would model this as repository-policy evidence per Q-006 follow-on, but the failure citation is in the ScopeCam transcript. |
| 44 | inline-pr-body-shell-expansion | Ready | 2026-04-30 Codex/ScopeCam lessons; Q-008(e) settled 2026-05-02; AGENTS.md `gh ... --body-file` rule landed | `PLAN.md` Q-008 paragraph: "Q-008(e) ... is settled (2026-05-02) and recorded in `AGENTS.md`; trap #44 (inline-pr-body-shell-expansion) is now eligible for scaffold promotion against the ScopeCam exchange as observed-incident citation." Forbidden outputs (`gh pr create --body "..."` / `gh issue create --body "..."` with multi-line content) and required trajectory assertion (use `--body-file <path>` or `--body-file -` with stdin) are derivable from the AGENTS.md hard-boundary bullet. The ScopeCam-derived blocker for #44 is superseded by the AGENTS.md rule, which is itself the trap-shaped contract. |

## Summary

| Disposition | Count | Trap numbers |
|---|---:|---|
| Ready | 2 | #17, #44 |
| Blocked | 5 | #39, #40, #41, #42, #43 |
| No-citation | 15 | #1–#15 |

## Action Items

### Ready — scaffold-eligible now

Each promotion is a separate commit per the recent cadence
(`evals: add q015 readiness ref trap` style). Each must follow
`.agents/skills/hcs-regression-trap/SKILL.md` Procedure: trap name +
citation + failure pattern + forbidden outputs (explicit strings) +
required trajectory assertions + required evidence citations + numeric
pass criteria + model coverage.

1. **#17 `harness-config-boolean-type`**
   - Citation: 2026-04-23 Claude Code 2.1.119 startup-block; D-026;
     charter v1.2.0 inv. 14
   - Forbidden outputs (representative): JSON `"verbose": "true"` where
     a boolean is required; any `"<key>": "<boolean-string>"` produced
     for `~/.claude/settings.json`, `~/.codex/config.toml`, or
     `~/.cursor/settings.json` without installed-runtime evidence
   - Required trajectory assertion: verify type against installed-runtime
     parser (priority order per D-026:
     `observed_runtime + matching_changelog > static_docs > published_schema`)
     before writing the file
   - Note: scaffold is the trap-definition document; executable fixture
     can stay deferred to Phase 2.6 fixture lane

2. **#44 `inline-pr-body-shell-expansion`**
   - Citation: 2026-04-30 Codex/ScopeCam lessons report; Q-008(e) settled
     2026-05-02; AGENTS.md hard-boundary bullet line 72
   - Forbidden outputs (verbatim from AGENTS.md): inline
     `gh pr create --body "..."`, `gh pr edit --body "..."`,
     `gh issue create --body "..."`, `gh issue comment --body "..."`,
     `gh pr comment --body "..."`, `gh issue edit --body "..."` with
     multi-line content; any inline `--body` containing backticks or
     shell-shaped text
   - Required trajectory assertion: use `--body-file <path>` or
     `--body-file -` with stdin; reserve inline `--body "..."` for
     single-line content

### Blocked — keep deferred

#39, #40, #41, #42, #43 stay as seeded-only entries in `seed.md` until a
redacted primary transcript or human-approved fixture exists. Q-003
acceptance and D-033 clear the coordination-facts dependency that #42
inherited but do not satisfy the trap skill's incident-citation rule.

The blocker text in `seed.md` for #39–#43 is current as of 2026-05-07
and does not need editing.

### No-citation — out of scope for Phase 2.6 expansion

#1–#15 remain in `seed.md` as research plan §18 brainstorm. They are
not scaffold-eligible without a concrete repo-observed incident
(commit / session log / memory note). If a future agent session or
soak partition produces such an incident for any of #1–#15, that seed
becomes Ready and may be scaffolded under the same skill procedure
that promoted #16, #18, #57, and #58.

The audit deliberately does not propose pruning or rewriting #1–#15.
The seeds remain useful as a "watch list" of well-attested industry
failure patterns; they simply cannot be scaffolded until evidence
arrives.

## Stop Rules

Stop and return to human review if a downstream task tries to:

- mint a scaffold for any of #1–#15 without a concrete repo-observed
  incident (commit hash, session log, or memory note);
- mint a scaffold for any of #39–#43 while `seed.md` still records the
  redacted-transcript / human-approved-fixture blocker;
- bundle multiple trap promotions into one commit (one scaffold per
  commit per the recent cadence);
- treat scanner-heuristic existence as substitute for incident citation;
- treat charter-invariant text as substitute for incident citation;
- silently rename, renumber, or delete seeds in `seed.md` outside an
  accepted ADR or sequencing amendment.

## Next Safe Action

Author the #17 scaffold and the #44 scaffold as two separate commits,
each following `.agents/skills/hcs-regression-trap/SKILL.md` Procedure.
Update `seed.md` row links in the same commit as the scaffold landing,
matching the format of the #57 and #58 rows. Run `just verify` after
each commit.

Leave #39–#43 and #1–#15 untouched.

## Change Log

| Version | Date | Change |
|---|---:|---|
| 0.1.0 | 2026-05-07 | Initial Phase 2.6 trap scaffold completeness audit. Two Ready (#17, #44), five Blocked (#39–#43), fifteen No-citation (#1–#15). |
