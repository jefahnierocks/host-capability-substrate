---
title: HCS Housekeeping Readout
category: status
component: host_capability_substrate
status: active
version: 0.1.0
last_updated: 2026-06-29
tags: [housekeeping, status, agent-contract, workflow-prep, validation]
priority: high
---

# HCS Housekeeping Readout - 2026-06-29

This readout records the June 29 housekeeping pass after PR #86 merged. It is a
status and workflow-prep artifact. It does not authorize live policy authoring,
provider mutation, Ring 1 runtime work, adapter work, dashboard work,
meta-inventory edits, or execution-path implementation.

## Reverified State

- Repo state: `main` and `origin/main` resolve to
  `ca09aafbe62f56d88a7f190b6f7dccf328bab855`, the PR #86 merge commit.
- Branch cleanup: remote `feat/adr-0078-model-ref-schema` is absent after
  prune; the stale local branch was deleted after tree equality was confirmed.
- Remote CI: latest GitHub Actions `verify` run on `main` at `ca09aaf` succeeded.
- Local status: housekeeping starts from a clean `main`; any follow-on branch
  should be cut from this point.
- Hub header: `project.yaml` mirrors this recheck with quoted
  `status.as_of: "2026-06-29"`; `PLAN.md` remains the status of record.

## Current Authority

- Status of record: `PLAN.md` Current Focus.
- Tool/model baseline: `AGENTS.md` Tool baseline only, anchored to
  `DECISIONS.md` D-075 per ADR 0075 / D-076.
- Live policy: `~/Organizations/jefahnierocks/system-config/policies/host-capability-substrate/`.
- Policy snapshot in this repo: `policies/generated-snapshot/`, digest-bound and
  read-only for tests.
- Current ontology/docs facts: ontology `v1.34.0`, registry `v0.4.37`, charter
  `v1.6.0`, ADRs through `0078` with `0026` absent, decisions through `D-081`,
  next free decision row `D-082`.

## Next Workflow Queue

1. **M2 Decision / ApprovalGrant boundary-evidence consumption.** First prepared
   branch should inspect ADR 0034, ADR 0060, D-078/D-079, and the current
   `Decision`, `ApprovalGrant`, and `BoundaryObservation` schemas/tests. Target
   class is expected to be schema/docs/tests unless the read-only pass finds an
   ADR gap. No execution path.
2. **Policy loader stale-schema and digest rejection gate.** Inspect
   `policy-lint`, `snapshot-binding-check`, generated snapshot binding, and
   policy fixtures. Keep live policy authority in `system-config`; HCS owns only
   snapshot compatibility and binding checks.
3. **ADR 0064 contract-Zod / AuditEvent envelope design-interface slice.** Keep
   implementation class-I work M4-gated. This lane is contract/interface-only
   until approval grants, dashboard review, audit, and leases exist together.
4. **Permission-posture as queryable fact.** Future ADR candidate, not a
   milestone blocker. Use it to make tightened harness gate-1 posture discoverable
   to incoming agents before they propose config changes.

## Lessons Carried Forward

- Single-source volatile facts. Model names live only in `AGENTS.md` Tool
  baseline; milestone status lives in `PLAN.md`; `project.yaml` is a derived hub
  header; live policy lives in `system-config`.
- Do not sweep historical model/version strings. ADRs, decision rows, research
  notes, and eval `model_coverage` fields preserve provenance or run-scope
  metadata unless a current authority surface explicitly owns them.
- Keep manifest dates quoted. Update `project.yaml status.as_of` only when the
  manifest is actually reverified, and keep the ISO date a quoted string.
- Prove post-merge cleanup before deleting local branch refs: prune, refresh
  `main`, verify PR merge state, confirm remote branch absence, and use tree
  equality or another explicit proof before deleting a stale local branch.
- Treat GitHub Actions status checks and branch rulesets as different surfaces.
  HCS now has `.github/workflows/verify.yml`; the `verify` check exists, but it
  is not yet branch-required.
- Use `--body-file` for multi-line `gh` body-bearing operations.
- Schema changes use the HCS schema workflow: Zod source, generated JSON Schema,
  ontology docs, registry docs, and tests move together, with ontology review.
- GUI/app/IDE agents do not inherit terminal shell environment by assumption.
  Capture execution-context evidence before making credential or permission
  claims.

## Agent Intake

For the next branch, begin with:

1. `AGENTS.md`
2. `PLAN.md`
3. this readout
4. `IMPLEMENT.md`
5. the specific ADRs for the target slice

Declare the ring, change class, required reviewer, and non-authorization
boundary before edits. For the expected M2 schema slice, that means Ring 0 /
class B until proven otherwise, with `hcs-ontology-reviewer` required and
`hcs-policy-reviewer` added if operation-classifying policy behavior moves.

Before finishing any branch:

```bash
just verify
git diff --check
git status --short --branch
```
