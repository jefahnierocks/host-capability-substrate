---
title: GitHub Org Configuration
category: reference
component: github_org
status: active
version: 1.0.1
last_updated: 2026-06-29
tags: [github, org, ruleset, branch-protection, codeowners, teams]
priority: high
---

# GitHub Org Configuration

Captures the GitHub-side configuration for `jefahnierocks/host-capability-substrate`
so it can be reproduced if rulesets, teams, or branch protection are
lost (e.g., after another transfer).

GitHub UI state is not version-controlled. This file is the closest
substitute and the canonical recipe for recreating the setup via `gh`.

## Org

- Login: `jefahnierocks`
- Plan: `team` (rulesets and team-level access controls available)

## Teams

| Team | Slug | Permission on repo | Purpose |
|------|------|--------------------|---------|
| `host-capability-substrate maintainers` | `host-capability-substrate-maintainers` | `admin` | Bypass actor for main ruleset; CODEOWNERS target |

Team id: `17459475`. Membership is managed at the org level. Today: `verlyn13` as `maintainer`.

## Branch ruleset on `main`

Active ruleset enforces three rules on the default branch:

| Rule | Effect |
|------|--------|
| `deletion` | Cannot delete `main` |
| `non_fast_forward` | Cannot force-push to `main` |
| `required_linear_history` | All merges must produce a linear history (no merge commits) |

Bypass actors: `host-capability-substrate-maintainers` team, `always` mode (members
can override the rules when needed for emergencies).

Ruleset id: `16161078`, active on `~DEFAULT_BRANCH`.

No required PR review or branch-required status checks today - single-developer
direct-push workflow is preserved. The `verify` GitHub Actions workflow exists
and publishes a status check, but the branch ruleset does not yet require it.
Add required checks or reviews when the contributor set or workflow demands it.

## GitHub Actions

`.github/workflows/verify.yml` runs `just verify` on pull requests, pushes to
`main`, and manual `workflow_dispatch` runs. It uses `macos-latest`,
`jdx/mise-action`, `npm ci`, and `HCS_SKIP_HOST_FIXTURES=1` for the host-coupled
fixtures that are local-workstation probes rather than clean-runner tests.

Latest observed `main` run during the 2026-06-29 housekeeping pass:
`verify` succeeded for
`ca09aafbe62f56d88a7f190b6f7dccf328bab855` (run `28328992025`).

This workflow is CI evidence. It is not branch-protection authority until a
ruleset required-status-check rule is added.

## CODEOWNERS

`.github/CODEOWNERS` routes review requests for all paths to the
maintainers team. Useful once collaborators are added; benign for the
single-developer case today.

## Reproduce

If teams, ruleset, or CODEOWNERS are lost, the following recreates the
configuration. Run as an org admin authenticated to `gh`.

```bash
# 1. Create team
gh api -X POST /orgs/jefahnierocks/teams \
  -f name='host-capability-substrate-maintainers' \
  -f description='Maintainers for host-capability-substrate repo. Bypass actors for main ruleset.' \
  -f privacy='closed'

# 2. Add yourself as team maintainer (substitute your login)
gh api -X PUT /orgs/jefahnierocks/teams/host-capability-substrate-maintainers/memberships/verlyn13 \
  -f role='maintainer'

# 3. Grant team admin on the repo
gh api -X PUT /orgs/jefahnierocks/teams/host-capability-substrate-maintainers/repos/jefahnierocks/host-capability-substrate \
  -f permission='admin'

# 4. Capture the team id for the ruleset bypass list
TEAM_ID=$(gh api /orgs/jefahnierocks/teams/host-capability-substrate-maintainers --jq .id)

# 5. Create the ruleset (template — substitute $TEAM_ID into actor_id)
cat > /tmp/ruleset-main.json <<JSON
{
  "name": "main: no-force-push, no-delete, linear-history",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {"include": ["~DEFAULT_BRANCH"], "exclude": []}
  },
  "rules": [
    {"type": "deletion"},
    {"type": "non_fast_forward"},
    {"type": "required_linear_history"}
  ],
  "bypass_actors": [
    {"actor_id": $TEAM_ID, "actor_type": "Team", "bypass_mode": "always"}
  ]
}
JSON
gh api -X POST /repos/jefahnierocks/host-capability-substrate/rulesets --input /tmp/ruleset-main.json
rm /tmp/ruleset-main.json
```

CODEOWNERS is a regular committed file at `.github/CODEOWNERS`; recreate
by checking it in.

## When to extend

Add a required-status-check rule when the existing `verify` workflow is worth
blocking pushes on. The quality-gate stack named in the source boundary decision
Section 10 (`format`, `typecheck`, unit tests, schema generation/drift, boundary
import, policy lint, forbidden-string scan, agent contract identity scan,
gitleaks, no-runtime-state-in-repo, hook dry-run, AGENTS/CLAUDE pointer) all run
via `just verify` today. This file is the place to document promoting the
existing `verify` status check to a branch-required check.

Add required PR reviews once a second contributor exists.

Add an `authorized pushers` allowlist once direct push is no longer the
norm (today, the bypass actor list and the no-restriction-on-pushers
default are equivalent for a single-developer org).

The 2026-05-08 ownership transfer to the `jefahnierocks` org cleared
GitHub's per-repo bypass-actor / authorized-pusher / authorized
review-dismisser identity lists (those identities had been scoped to
the previous owner). Those lists are intentionally empty today across
both this repo and the sibling `jefahnierocks/system-config` —
single-developer org, no collaborators, no review-required rule on
either repo. Re-population is triggered case-by-case when collaborators
land; at that point both repos need it in lockstep, and
`docs/github-org-setup.md` in each repo is the canonical recipe.

## Related

- [`.github/CODEOWNERS`](../.github/CODEOWNERS)
- [`docs/host-capability-substrate/adr/0001-repo-boundary.md`](./host-capability-substrate/adr/0001-repo-boundary.md) — in-repo boundary ADR (short pointer; source decision in `system-config`)
- [`docs/host-capability-substrate/adr/0046-github-org-migration.md`](./host-capability-substrate/adr/0046-github-org-migration.md) — ADR recording the 2026-05-08 transfer to the `jefahnierocks` org
- `~/Organizations/jefahnierocks/system-config/docs/github-org-setup.md` — sibling repo's parallel setup
- `~/Organizations/jefahnierocks/system-config/docs/host-capability-substrate/0001-repo-boundary-decision.md` — source boundary decision (v1.3.0+)
