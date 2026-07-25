<!--
Derived checklist — the canonical source is IMPLEMENT.md §Per-PR checklist.
If this template and IMPLEMENT.md disagree, IMPLEMENT.md wins; fix this template.
Multi-line PR bodies are created with `gh pr create --body-file <path>` per the
AGENTS.md hard boundary on body-bearing GitHub operations.
-->

## Purpose

<!-- What this PR does and why. One milestone (ideally one ring) per PR. -->

## Ring changed

- [ ] Ontology/schema
- [ ] Kernel
- [ ] Adapter
- [ ] Dashboard
- [ ] Hook
- [ ] Eval
- [ ] Docs

## Boundary checks

- [ ] No policy duplicated into adapter/hook
- [ ] No universal shell execution added
- [ ] No audit-write agent endpoint added
- [ ] `OperationShape` remains upstream of `CommandShape`
- [ ] Evidence includes provenance/freshness where applicable
- [ ] Dashboard impact considered
- [ ] **Citation discipline** — a citation used as *authorization* must establish
      that the document **authorizes** the thing, not merely that it mentions it.
      Quote the ADR's own scope statement and show the cited line falls inside
      it. Checking the cited section's heading is NOT sufficient: D-085 quoted an
      `adr/0057` line sitting under "This ADR explicitly does not authorize:",
      and D-086 then cited `adr/0060` §Provenance verification — correct heading,
      correct text — while that same ADR's §Out of scope declined to authorize
      the implementation. Two failures, two different locations, one property.
- [ ] **Precedence respected** — `AGENTS.md` §Source of truth ranks `adr/` above
      `IMPLEMENT.md`. A rule stated in an accepted ADR is not relieved by
      editing `IMPLEMENT.md`; amend the ADR, then restate below it.
- [ ] **Charter text quoted verbatim or untouched** — charter edits are their own
      class and do not ride in another PR. (D-085: `charter:54`'s "is live" was
      silently weakened to "exist".)

## Validation

```
just verify
just test <package>
```

<!-- State the outcome. Scoped test targets exist only as listed in the
justfile `test` recipe (`schemas` today); unknown targets fail loudly. If a
scoped target does not exist yet, name the command that actually ran. -->

## Charter compliance

Complies with implementation charter v{X.Y.Z}. Ring: {0|1|2|3}. No cross-ring imports added.

<!-- Use the current charter version from its frontmatter; do not leave the
placeholder. Format per the charter §How to cite this charter. -->

## Agent use

- Implementer: (role from AGENTS.md table)
- Reviewer: (different role)
- Subagents: (optional)
