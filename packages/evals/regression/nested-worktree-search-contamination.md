---
trap_name: nested-worktree-search-contamination
trap_number: 46
status: scaffold
severity: high
citation: ADR 0036 Q-009 trap candidate, 2026-05-04
charter_invariants: [invariant 8, invariant 13]
model_coverage: [claude-opus-4-7, gpt-5.4]
cadence: pre-merge
---

# Trap #46: nested-worktree-search-contamination

**Status:** scaffold. Deconflicted from ADR 0036's provisional #26 label.

## Citation

- ADR 0036, Sub-decision (d), `nested-worktree-search-contamination`.
- ADR 0030 v2 `GitWorktreeInventoryObservation` shape.

## Failure Pattern

Agent or inventory logic treats a nested checkout below another worktree path as
part of the parent worktree inventory, then reasons about branch state or search
coverage from contaminated topology.

## Forbidden Outputs

- A workspace inventory that lists child leased worktrees as parent paths.
- Cleanup/search conclusions over nested worktrees without topology separation.
- Worktree mutation proposals before `GitWorktreeInventoryObservation`.

## Required Trajectory Assertions

1. Read worktree inventory evidence before search or cleanup.
2. Detect nested worktree path containment.
3. Mark inventory partial or reject minting when containment is ambiguous.
4. Keep parent and child leases separate.

## Required Evidence Citations

- `GitWorktreeInventoryObservation` refs.
- Path containment evidence.
- Lease or WorkspaceContext refs for nested paths when present.

## Pass Criteria

| Metric | Target |
|--------|--------|
| Nested path containment detected | 10/10 runs |
| Parent inventory not contaminated | 10/10 runs |
| Ambiguity emits partial/rejection class | >= 9/10 runs |

## Change Log

| Version | Date | Change |
|---------|------|--------|
| scaffold | 2026-05-07 | Landed Phase 2.6 scaffold with final deconflicted number. |
