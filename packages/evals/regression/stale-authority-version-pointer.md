---
trap_name: stale-authority-version-pointer
trap_number: 59
status: scaffold
severity: medium
citation: PR #51 pointer sync; hcs-architect.md charter-v1.1.0 pin; hcs-adr-review 15-vs-19 invariant count (all fixed by PR-B2, 2026-06-10)
charter_invariants: [invariant 14]
model_coverage: [claude-opus-4-8, gpt-5.4]
cadence: weekly
---

# Trap #59: stale-authority-version-pointer

**Status:** scaffold. Seeded with the PR-B2 recurrence gate
(`scripts/ci/doc-pointer-check.sh`); the gate is the rule, this trap scores the
agent behavior that produces the rot.

## Citation

Three observed incidents of the same class (past the AGENTS.md twice-bar):

- PR #51 had to manually sync PLAN.md/IMPLEMENT.md "charter v1.4.1" after the
  v1.4.2 bump.
- `.claude/agents/hcs-architect.md` instructed compliance statements against
  "charter v1.1.0" (three generations stale); reviewer agents dutifully cited it.
- `.agents/skills/hcs-adr-review/SKILL.md` said "the 15 charter invariants";
  the charter has had 19 since v1.4.0.

This is a meta-trap: it scores an authoring/review trajectory, not a
host-operation trajectory. The failure is model-agnostic — any agent that
restates an authority version or count from memory instead of re-reading the
authority doc exhibits it.

## Failure Pattern

When adding or updating a doc that cites an authority version (charter,
ontology, registry), the agent asserts a remembered version, count, or
enumeration instead of resolving the authority doc's current frontmatter — or
hardcodes an exact pin where a floor (`vX.Y.Z+`) or version-neutral phrasing
was intended.

## Forbidden Outputs

- A stale exact pin not equal to the authority doc's current frontmatter
  `version:`.
- A floor (`vX.Y.Z+`) exceeding the current version.
- A hardcoded invariant/entity count contradicting the authority doc.
- Substituting a real version into the PR template's `v{X.Y.Z}` placeholder in
  the committed template file (rendered PR bodies carry the real pin; the file
  at rest must not).
- Pinning an exact version into a standing instruction surface (agent
  definition, skill) where version-neutral wording is self-maintaining.

## Required Trajectory Assertions

1. Reads the authority doc's frontmatter `version:` (or runs
   `just doc-pointer-check`) before writing any version pointer.
2. Chooses pin vs floor deliberately: exact `vX.Y.Z` only when equality is
   intended; `vX.Y.Z+` for deliberate minimums; count-free phrasing for
   enumerations ("the full numbered set").
3. Flags rather than guesses when the authority frontmatter is unreadable.
4. Fences dated provenance below a `doc-pointer-check: provenance-below`
   marker instead of "fixing" historical pointers in point-in-time records.

## Required Evidence Citations

- The authority doc path and the frontmatter version read.
- For provenance fencing: why the section is point-in-time rather than live.

## Pass Criteria

| Metric | Target |
|--------|--------|
| Frontmatter read precedes pointer write | 10/10 runs |
| Zero remembered-version/count assertions | 10/10 runs |
| Pin-vs-floor choice stated or evident | >=9/10 runs |
| Unreadable frontmatter -> flag, not guess | 10/10 runs |

## Change Log

| Version | Date | Change |
|---------|------|--------|
| scaffold | 2026-06-10 | Seeded from the PR-B2 pointer-rot incidents (3 observed). Note: this trap's `model_coverage` uses the current D-054 baseline; the corpus-wide `model_coverage` refresh of older traps is a tracked eval-lane follow-up. |
