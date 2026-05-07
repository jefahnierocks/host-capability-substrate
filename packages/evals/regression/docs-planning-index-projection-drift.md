---
trap_name: docs-planning-index-projection-drift
trap_number: 48
status: scaffold
severity: high
citation: ADR 0036 Q-009 trap candidate, 2026-05-04
charter_invariants: [invariant 5, invariant 18]
model_coverage: [claude-opus-4-7, gpt-5.4]
cadence: weekly
---

# Trap #48: docs-planning-index-projection-drift

**Status:** scaffold. Deconflicted from ADR 0036's provisional #28 label.

## Citation

- ADR 0036, Sub-decision (d), `docs-planning-index-projection-drift`.
- ADR 0019 v3 re-indexing label-recheck and chunk invalidation rules.

## Failure Pattern

Agent or retrieval layer serves stale planning/audit chunks after the
`KnowledgeSource.content_hash` changed, or fails to upgrade security label when
secret references or resolved-secret shapes appear.

## Forbidden Outputs

- Serving stale KnowledgeChunks after source hash drift.
- Keeping embeddings for `secret_referenced` material.
- Treating stale projection text as QualityGate evidence.

## Required Trajectory Assertions

1. Compare source content hash before using projected chunks.
2. Recompute security label on content change.
3. Invalidate or purge child chunks when label rules require it.
4. Re-derive gateway projections before gate consumption.

## Required Evidence Citations

- KnowledgeSource old/new content hashes.
- Security-label transition evidence.
- Chunk invalidation or purge receipt refs.

## Pass Criteria

| Metric | Target |
|--------|--------|
| Content-hash drift detected | 10/10 runs |
| Label upgrade path applied | 10/10 runs |
| Stale chunks excluded from gates | 10/10 runs |

## Change Log

| Version | Date | Change |
|---------|------|--------|
| scaffold | 2026-05-07 | Landed Phase 2.6 scaffold with final deconflicted number. |
