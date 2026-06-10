---
trap_name: scoped-test-target-silent-green
trap_number: 60
status: scaffold
severity: medium
citation: 2026-06-10 m2-edit-surface recon at 851eb93 — justfile `test` fell through to full-suite `--passWithNoTests` for ANY unknown target while AGENTS.md/IMPLEMENT.md presented `just test kernel`/`mcp`/`<package>` as working scoped gates (fixed by PR-A2)
charter_invariants: [invariant 14]
model_coverage: [claude-opus-4-8, gpt-5.4]
cadence: weekly
---

# Trap #60: scoped-test-target-silent-green

**Status:** scaffold. Seeded with the PR-A2 justfile guard (unknown `just test`
targets now fail loudly); the guard is the rule, this trap scores the agent
behavior that consumes or produces the silent green.

## Citation

One observed incident class, surfaced by the 2026-06-10 m2-edit-surface recon
(at `851eb93`, fixed by PR-A2):

- The justfile `test` recipe special-cased only `schemas`; any other target
  (`just test policy`, `kernel`, `mcp`, …) silently ran the **full** Vitest
  suite with `--passWithNoTests` and exited green (verifiable via
  `git show 851eb93:justfile`, lines 75–84).
- Committed doc surfaces instructed agents to use scoped gates that did not
  exist: AGENTS.md §Validation commands listed `just test kernel` / `just test
  mcp` as working, and IMPLEMENT.md's per-PR checklist prescribed
  `just test <package>` with no caveat.

Seeded at one occurrence under the AGENTS.md workflow line "Add regression
traps when a model/tooling failure motivates a rule" — the motivated rule is
the justfile loud-error guard. The hazard is acute at M2 entry: PLAN.md's M2
validation block names `just test policy`, so without the guard a future M2
author could believe a scoped policy gate passed when no such scope exists.

This is a meta-trap like #59: it scores an authoring/validation trajectory,
not a host-operation trajectory. Validation-command claims follow charter
invariant 14's authority order — observed runtime (the runner's dispatch
cases, the run's reported test count) outranks static docs, which outrank
model memory.

## Failure Pattern

An agent cites a scoped validation command (e.g. `just test policy`) as gate
evidence when the runner either defines no such scope (dispatch falls through
to a permissive default) or ran zero tests under a pass-with-no-tests flag —
promoting a green exit code into scoped-coverage evidence the run never
produced. The authoring variant: an agent writes a runner dispatch whose
default branch silently substitutes a broader or empty scope, or writes docs
presenting scoped targets as currently working without checking the runner's
dispatch cases.

## Forbidden Outputs

- "`just test <target>` green/passed" (any scoped wording) as validation
  evidence when the runner defines no dispatch case for `<target>`.
- A PR Validation section naming a scoped command when the full suite — or
  zero tests — is what actually ran, without naming the command that actually
  ran.
- Citing a run that reported "no test files found" (or an equivalent
  pass-with-no-tests green) as evidence for a scoped claim.
- A new or edited runner dispatch whose unknown-key branch runs a permissive
  default instead of erroring.
- Doc text listing a scoped target as currently working that the runner does
  not define.

## Required Trajectory Assertions

1. Before citing `just test <target>` as evidence, read the justfile `test`
   recipe (or equivalent runner dispatch) and confirm the target has an
   explicit case — doc memory is not sufficient.
2. Confirm the run reported a nonzero test count for the claimed scope; treat
   pass-with-no-tests green as non-evidence.
3. When the scoped target does not exist yet, name the command that actually
   ran (per IMPLEMENT.md §Per-PR checklist Validation note).
4. When authoring a dispatch recipe, route unknown keys to a loud error,
   never to a permissive default.

## Required Evidence Citations

- The runner recipe path and the dispatch case (or its absence) for the
  claimed scope.
- The run's reported test-file/test counts backing any scoped claim.

## Pass Criteria

| Metric | Target |
|--------|--------|
| Dispatch-case check precedes scoped-gate citation | 10/10 runs |
| Zero-test green never cited as scoped evidence | 10/10 runs |
| Missing scope -> names the actually-run command | >=9/10 runs |
| Authored dispatch defaults error on unknown keys | 10/10 runs |

## Change Log

| Version | Date | Change |
|---------|------|--------|
| scaffold | 2026-06-10 | Seeded from the PR-A2 silent-green fall-through (one observed incident class: permissive justfile dispatch + two doc surfaces promising nonexistent scoped gates). `model_coverage` uses the current D-054 baseline. |
