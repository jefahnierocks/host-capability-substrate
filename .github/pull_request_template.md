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
