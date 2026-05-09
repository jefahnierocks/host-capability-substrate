---
adr_number: 0001
title: Repository boundary — name, path, scope
status: accepted
date: 2026-04-22
charter_version: 1.1.0
tags: [boundary, naming, governance]
---

# ADR 0001: Repository boundary — name, path, scope

## Status

`accepted`

Originally accepted 2026-04-22 against master v1.0.0+. Re-synced
2026-05-08 against master v1.3.0 to reflect the GitHub-org ownership
migration recorded by ADR 0046 / `DECISIONS.md` D-034: the §Decision
GitHub slug now reads `jefahnierocks/host-capability-substrate`.
Historical reasoning under §Context, §Options considered, and
§Consequences is preserved as observed-at-decision evidence (it
references `verlyn13/...` patterns that were the basis of the original
choice; rewriting that text would falsify the historical record).

## Date

2026-04-22

## Charter version

Written against charter v1.1.0.

## Context

HCS needs a canonical local path, GitHub slug, and scope boundary. Host-scoped infrastructure already has a precedent in the jefahnierocks host repo (`system-config`). The former Jefahnierocks root `.subsidiary.yaml` convention (`prefix: jfr`) contradicted observed practice (zero `verlyn13/jfr-*` repos exist) and was later removed rather than renamed because no Jefahnierocks-owned local metadata consumer exists yet.

## Options considered

### Option A: `jfr-host-capability-substrate` under `~/Organizations/jefahnierocks/`

**Pros:** followed the then-stated `.subsidiary.yaml` convention.
**Cons:** no existing repo uses the prefix; the convention was already out of date with observed repo practice.

### Option B: `host-capability-substrate` under `~/Organizations/jefahnierocks/`

**Pros:** matches observed practice on 30+ verlyn13 repos; matches `system-config` precedent for host-scoped infrastructure.
**Cons:** contradicted the stale yaml before the Jefahnierocks root file was removed.

### Option C: place under a parent-level tier (`the-citadel`)

**Pros:** host infrastructure might belong at parent scope.
**Cons:** jefahnierocks's `system-config` already establishes the current workspace precedent for host-scoped infrastructure; parent-tier placement would require a separate cross-workspace governance decision.

## Decision

**Option B.** Local path `~/Organizations/jefahnierocks/host-capability-substrate/`; GitHub `jefahnierocks/host-capability-substrate` (public source; transferred from the personal `verlyn13` account to the `jefahnierocks` GitHub organization on 2026-05-08 — see ADR 0046 / `DECISIONS.md` D-034); owner jefahnierocks; sibling to `system-config`.

## Consequences

### Accepts

- Historical non-compliance with the former `.subsidiary.yaml` prefix. The Jefahnierocks root file was later removed rather than renamed because no local metadata consumer exists yet.
- Long repo name, mitigated by `hcs` alias for env vars, CLI, and URLs.
- Public source with stricter private deployment boundary (see ADR 0011).

### Rejects

- Placing under `apps/` or `packages/` — wrong tier for host-scoped infrastructure.
- Prefixing — inconsistent with every other verlyn13 repo.

### Future amendments

- If a parent-scope "host-layer" pillar is formally adopted, reconsider placement.
- If cross-host or cross-workspace HCS usage emerges, reconsider placement.

## References

### Internal

- Binding decision (master): `~/Organizations/jefahnierocks/system-config/docs/host-capability-substrate/0001-repo-boundary-decision.md` (v1.3.0+). **This ADR is a short in-repo pointer to that master document; substantive edits go there.**
- ADR 0046 — repository GitHub-org migration to `jefahnierocks` org (2026-05-08; amends the §Decision GitHub-slug claim of this ADR).
- `docs/github-org-setup.md` — GitHub-side configuration recipe (org, team, branch ruleset, CODEOWNERS).
- Charter: `docs/host-capability-substrate/implementation-charter.md`
- Decision ledger: `DECISIONS.md` entry D-017

### External

- N/A
