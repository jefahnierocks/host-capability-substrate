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
- [ ] **Citation discipline** — every citation used as *authorization* quotes its
      enclosing section heading verbatim in the PR body. If the heading reads
      "Out of scope", the citation refutes itself on sight. (D-085: an
      `adr/0057` line was quoted as a grant when it sat inside "This ADR
      explicitly does not authorize:".)
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
