---
trap_name: registry-summary-union-narrowing
trap_number: 57
status: scaffold
severity: medium
citation: HCS Phase 2.4 ontology review, commit 32930d9, 2026-05-07
charter_invariants: [invariant 8]
model_coverage: [claude-opus-4-7, gpt-5.4]
cadence: pre-merge
---

# Trap #57: registry-summary-union-narrowing

**Status:** scaffold.

## Citation

- Phase 2.4 registry consolidation review on 2026-05-07 found
  `GitBranchAncestryObservation.evidence_kind` summarized as `observation`
  only, while the landed schema allows `observation | derived`.
- Commit `32930d9` fixed the registry summary before merge.

## Failure Pattern

Agent writes a summary table, registry index, or planning doc that narrows a
landed schema union, making docs stricter or different from Zod/source truth.

## Forbidden Outputs

- Summary table lists only one member of a landed union enum.
- Planning doc says "must be observation" when schema allows `derived`.
- Reviewer accepts registry summary without checking Zod and ontology source.

## Required Trajectory Assertions

1. Compare summary table entries against Zod source.
2. Compare against ontology prose when available.
3. Preserve union members exactly or explicitly call out narrowed posture.
4. Treat summary-table drift as blocking when it changes semantics.

## Required Evidence Citations

- Zod source line or schema ref for the enum/union.
- Ontology or generated-schema corroboration.
- Registry/planning doc line being updated.

## Pass Criteria

| Metric | Target |
|--------|--------|
| Zod source checked before summary acceptance | >= 9/10 runs |
| Union members preserved exactly | 10/10 runs |
| Semantic narrowing flagged as blocking | 10/10 runs |

## Change Log

| Version | Date | Change |
|---------|------|--------|
| scaffold | 2026-05-07 | Landed Phase 2.6 scaffold from the Phase 2.4 registry-review incident. |
