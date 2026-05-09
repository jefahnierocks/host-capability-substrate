---
adr_number: 0046
title: Repository GitHub-org migration to jefahnierocks org
status: accepted
date: 2026-05-08
charter_version: 1.4.0
tags: [boundary, naming, governance, ownership-transition, github, amendment]
---

# ADR 0046: Repository GitHub-org migration to `jefahnierocks` org

## Status

`accepted` (with reviewer-disposition mechanical tweaks at acceptance)

Drafted, reviewed, and accepted on 2026-05-08. The GitHub UI ownership
transfer completed earlier the same day; `gh repo view` confirms
`nameWithOwner: jefahnierocks/host-capability-substrate` (public) and
`git remote origin` has been re-pointed to
`git@github.com:jefahnierocks/host-capability-substrate.git`.

`hcs-architect` review (per IMPLEMENT.md line 124) returned a clean pass:
no blocking objections; four non-blocking observations folded in
mechanically at acceptance — (1) inline charter-invariant citations on the
§Accepts frozen-evidence bullet, (2) explicit invariant naming on the
§Cross-scope follow-ups provider-mutation bullet, (3) a §Rejects
parenthetical pointer to the §Cross-scope follow-ups README-link bullet,
and (4) `DECISIONS.md` line-number pinning in §References.

`DECISIONS.md` mechanical flip executed alongside this acceptance:
Q-016 (formerly §Pending) → D-034 in §Accepted; D-017 → §Reversed with the
slug-only delta.

## Date

2026-05-08

## Charter version

Written against charter v1.4.0.

## Context

ADR 0001 (in-repo pointer; master at
`~/Organizations/jefahnierocks/system-config/docs/host-capability-substrate/0001-repo-boundary-decision.md`)
recorded the GitHub slug as `verlyn13/host-capability-substrate`. That choice
matched the then-observed practice of 30+ host-scoped repositories under the
personal `verlyn13` GitHub account.

The user is transferring host-scoped infrastructure repositories from the
personal `verlyn13` GitHub account to a dedicated `jefahnierocks` GitHub
organization, executed via the standard GitHub UI repository-transfer flow.
The sibling repository `system-config` is migrating in the same direction
under that repo's own scope/agent and is therefore not handled from this
session.

The local filesystem path
(`~/Organizations/jefahnierocks/host-capability-substrate/`), repository name
(`host-capability-substrate`), workspace boundary, ring boundaries, and the
`README.md` §Ownership declaration ("Owned by **jefahnierocks** as a
host-scoped HCS project") are unchanged. Only the GitHub-side slug moves.

The 2026-05-08 project-secrets-standards directive
(`docs/host-capability-substrate/research/local/2026-05-08-project-secrets-standards-directive.md`
§Naming Model) explicitly distinguishes semantic ownership from transitional
provider placement and notes that a Jefahnierocks-owned credential may be
transitionally stewarded by a personal `verlyn13` account during transition.
The same distinction applies to the repository itself: semantic ownership
has been Jefahnierocks; the GitHub slug catches up to that with this move.

## Options considered

### Option A: Stay on the personal `verlyn13` account

**Pros:** zero in-repo work; preserves slug continuity.
**Cons:** mis-frames host-scoped infrastructure ownership as personal;
contradicts the `README.md` §Ownership declaration; diverges from the
sibling `system-config` migration; complicates future credential-plane and
runner-substrate work that touches GitHub APIs where role-account vs.
personal-account semantics matter.

### Option B: Transfer to the `jefahnierocks` GitHub organization

**Pros:** GitHub-side ownership matches the in-repo ownership declaration;
aligns with sibling `system-config` migration; removes the
personal/role-account ambiguity; preserves git history, issues, PRs, and
GitHub-side rulesets/branch-protection through the standard UI transfer.
**Cons:** in-repo records require amendment (ADR 0001 master text in
`system-config`, D-017 ledger row in this repo); `git remote origin` URL
must be re-pointed; frozen evidence retains the old slug (intentional —
see §Consequences).

### Option C: Cut a fresh repository under `jefahnierocks` and archive the old

**Pros:** clean slate; no transfer ambiguity.
**Cons:** loses GitHub-side history continuity; loses issue/PR history;
unnecessary given GitHub's transfer flow preserves all of that and
auto-redirects the legacy slug.

## Decision

**Option B.** GitHub slug becomes `jefahnierocks/host-capability-substrate`.
Repository name, local path, workspace boundary, ring boundaries, and
ownership semantics remain unchanged.

## Consequences

### Accepts

- **Live config flip post-move.** `git remote origin` must be re-pointed
  from `git@github.com:verlyn13/host-capability-substrate.git` to
  `git@github.com:jefahnierocks/host-capability-substrate.git` after the
  GitHub UI transfer completes. GitHub's auto-redirect tolerates the legacy
  URL but explicit re-point removes the dangling-redirect failure mode.
- **Frozen evidence retains the legacy slug.** Dated artifacts —
  `packages/fixtures/provenance-snapshot-2026-04-30.json`, `.logs/phase-0/`
  captures, dated `docs/host-capability-substrate/research/` notes, and
  archived Codex/Claude transcripts — record what was observed at their
  `observed_at` date (charter v1.4.0 inv. 10 + inv. 19; AGENTS.md §Hard
  boundaries `observed_at` rule). Per that provenance discipline, those
  references are correct historical evidence and must not be rewritten.
- **Schema test fixtures already align.**
  `packages/schemas/tests/source-control-receipts.test.ts:96,123,514`
  already canonicalize `git@github.com:jefahnierocks/host-capability-substrate.git`
  as the expected remote URL. The test corpus was authored with this
  transfer pre-anticipated; no test changes are required.
- **No in-repo `.github/`-level surface to reapply.** This repo presently
  ships no Actions workflows, no CODEOWNERS, and no PR template under
  `.github/` (the directory does not exist). Rule *definitions* for branch
  protection and rulesets travel with the standard GitHub repository
  transfer.
- **GitHub-side bypass-actor allowlists are cleared by the transfer
  (observed 2026-05-08).** GitHub's transfer notice on this move stated:
  "Individual users, teams, and apps will be removed from the following
  options: Repository ruleset bypassers; Protected branch pull request
  bypassers; Protected branch authorized pull request review dismissers;
  Protected branch authorized pushers; Protected branch allowed force
  pushers." The rule *definitions* survive; the actor *allowlists* do not,
  because those identities were scoped to the previous owner's identity
  space. Re-populating those allowlists against `jefahnierocks` org
  membership is a follow-up GitHub-side action and is not authorized from
  this session.
- **DECISIONS.md ledger churn (mechanical, on acceptance).** Q-016 (Pending,
  drafted 2026-05-08 alongside this ADR) becomes D-034 in **Accepted**.
  D-017 moves to **Reversed** with old/new pair: old slug
  `verlyn13/host-capability-substrate`, new slug
  `jefahnierocks/host-capability-substrate`; repo name, local path, and the
  `.subsidiary.yaml`-precursor rationale are preserved.

### Rejects

- **Rewriting frozen evidence to use the new slug.** That would falsify
  observed-at-date provenance and is forbidden by AGENTS.md.
- **Editing the in-repo ADR 0001 §Decision text in place.** ADR 0001's own
  §References note ("This ADR is a short in-repo pointer to that master
  document; edits go there.") makes the master in `system-config` the
  authoritative source. The in-repo pointer text will sync after the master
  is updated in that scope. Until then, the chain is traceable via the
  DECISIONS.md ledger (D-017 Reversed → D-034 Accepted → ADR 0046).
- **Touching the `README.md:13` link to `https://github.com/verlyn13/system-config`
  from this scope.** That link belongs to `system-config`'s own
  ownership-transfer scope; updating it here would either be premature or
  step outside this workspace boundary (see §Cross-scope follow-ups
  bullet 2).

### Cross-scope follow-ups (not authorized by this ADR)

- The master ADR at
  `~/Organizations/jefahnierocks/system-config/docs/host-capability-substrate/0001-repo-boundary-decision.md`
  must be updated in a `system-config` session to reflect the new slug.
- `README.md:13` link to `system-config` will need updating once the sibling
  repo completes its own GitHub-org migration. That edit is in this
  repo's scope but waits on the upstream move so the link does not point
  through a redirect chain.
- Branch-protection / ruleset bypass-actor allowlists, authorized-pusher
  lists, and authorized review-dismisser lists must be re-populated against
  `jefahnierocks` org membership on the GitHub side after the transfer.
  This is provider-side mutation; per charter v1.4.0 inv. 16
  (external-control-plane evidence-first) and the substrate-scope/
  provider-scope split codified in the 2026-05-08 project-secrets directive
  §Naming Model, HCS does not execute provider-side allowlist mutation from
  this substrate.

## References

### Internal

- `docs/host-capability-substrate/adr/0001-repo-boundary.md` — amended by
  this ADR with respect to the GitHub-slug claim only; local path, naming,
  scope, and `.subsidiary.yaml`-precursor history unchanged. Master lives
  in `system-config`.
- `DECISIONS.md` — Q-016 at line 28 (Pending, paired with this ADR);
  D-017 at line 115 (moved to **Reversed** at acceptance); D-034 (added
  to **Accepted** at acceptance).
- `README.md` §Ownership — already declares "Owned by **jefahnierocks**";
  no change needed for the ownership statement.
- `packages/schemas/tests/source-control-receipts.test.ts:96,123,514` —
  schema test fixtures already canonicalize the new slug.
- `docs/host-capability-substrate/research/local/2026-05-08-project-secrets-standards-directive.md`
  §Naming Model — frames transitional vs. semantic-ownership distinction
  relevant to this move.

### External

- N/A
