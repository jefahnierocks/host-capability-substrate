# ADR Deferral Index — Derived and Non-Authoritative

> **Derived, non-authoritative lookup.** Quoted ADR text remains the source.
> This index grants no implementation authorization. A `yes` or `no` result
> reports only whether an explicitly file-addressable successor exists.

<!-- doc-pointer-check: provenance-below -->

## File-addressable successor summary — Derived and Non-Authoritative

> This table includes only regular successor captures that resolve to a canonical
> ADR number or admitted repository path. Descriptive and other
> `not-file-addressable` targets are excluded. `Unique deferring ADRs` counts
> each ADR once per canonical successor even when that ADR emits repeated edges.
> Rows sort by that count descending, then by canonical successor in
> locale-independent code-unit order.

| Successor | Successor file exists | Unique deferring ADRs | ADR numbers |
|---|---|---:|---|
| `ADR 0026` | `no` | 7 | `0025`, `0027`, `0031`, `0033`, `0034`, `0035`, `0036` |

## Review only: Entries containing the exact token `gateway` — Derived and Non-Authoritative

> Syntactic review rollup only. The selector ASCII-folds `A` through `Z` and
> matches `gateway` only when bounded by non-`[A-Za-z0-9_]` characters or a
> payload boundary. It scans exact payloads already parsed from recognized
> regular `Out of scope` blocks, including entries routed to ambiguous review.
> It assigns no successor identity, existence state, or edge claim; ambiguous
> entries remain review-only.

- Unique ADR count: 20
- ADR numbers: `0030`, `0057`, `0058`, `0059`, `0060`, `0061`, `0062`, `0063`, `0064`, `0065`, `0066`, `0067`, `0068`, `0069`, `0070`, `0071`, `0072`, `0077`, `0079`, `0080`
- Matching source spans:

  - ADR 0030, entry 7: [`docs/host-capability-substrate/adr/0030-q-006-stage-2-source-control-evidence-subtypes.md:696-701`](adr/0030-q-006-stage-2-source-control-evidence-subtypes.md?plain=1#L696-L701)
  - ADR 0057, entry 2: [`docs/host-capability-substrate/adr/0057-ring-1-mint-audit-service.md:414-415`](adr/0057-ring-1-mint-audit-service.md?plain=1#L414-L415)
  - ADR 0058, entry 10: [`docs/host-capability-substrate/adr/0058-depth-overflow-reason-kind-promotion.md:330-332`](adr/0058-depth-overflow-reason-kind-promotion.md?plain=1#L330-L332)
  - ADR 0059, entry 10: [`docs/host-capability-substrate/adr/0059-agentclient-canonical-hash-amendment.md:361-362`](adr/0059-agentclient-canonical-hash-amendment.md?plain=1#L361-L362)
  - ADR 0060, entry 1: [`docs/host-capability-substrate/adr/0060-policy-rule-ring-0-entity.md:426-436`](adr/0060-policy-rule-ring-0-entity.md?plain=1#L426-L436)
  - ADR 0061, entry 10: [`docs/host-capability-substrate/adr/0061-decision-rule-attribution-amendment.md:299-301`](adr/0061-decision-rule-attribution-amendment.md?plain=1#L299-L301)
  - ADR 0062, entry 9: [`docs/host-capability-substrate/adr/0062-capability-ring-0-entity.md:313-314`](adr/0062-capability-ring-0-entity.md?plain=1#L313-L314)
  - ADR 0063, entry 8: [`docs/host-capability-substrate/adr/0063-command-shape-ring-0-entity.md:339-340`](adr/0063-command-shape-ring-0-entity.md?plain=1#L339-L340)
  - ADR 0064, entry 4: [`docs/host-capability-substrate/adr/0064-ring-1-mint-audit-service-contracts.md:481-482`](adr/0064-ring-1-mint-audit-service-contracts.md?plain=1#L481-L482)
  - ADR 0065, entry 6: [`docs/host-capability-substrate/adr/0065-secret-reference-ring-0-entity.md:355-356`](adr/0065-secret-reference-ring-0-entity.md?plain=1#L355-L356)
  - ADR 0066, entry 6: [`docs/host-capability-substrate/adr/0066-host-profile-ring-0-entity.md:295-296`](adr/0066-host-profile-ring-0-entity.md?plain=1#L295-L296)
  - ADR 0067, entry 7: [`docs/host-capability-substrate/adr/0067-tool-provider-ring-0-entity.md:288-289`](adr/0067-tool-provider-ring-0-entity.md?plain=1#L288-L289)
  - ADR 0068, entry 6: [`docs/host-capability-substrate/adr/0068-tool-installation-ring-0-entity.md:291-292`](adr/0068-tool-installation-ring-0-entity.md?plain=1#L291-L292)
  - ADR 0069, entry 5: [`docs/host-capability-substrate/adr/0069-resolved-tool-ring-0-entity.md:291-292`](adr/0069-resolved-tool-ring-0-entity.md?plain=1#L291-L292)
  - ADR 0070, entry 6: [`docs/host-capability-substrate/adr/0070-artifact-ring-0-entity.md:264-265`](adr/0070-artifact-ring-0-entity.md?plain=1#L264-L265)
  - ADR 0071, entry 6: [`docs/host-capability-substrate/adr/0071-lock-ring-0-entity.md:245-246`](adr/0071-lock-ring-0-entity.md?plain=1#L245-L246)
  - ADR 0072, entry 5: [`docs/host-capability-substrate/adr/0072-resource-budget-ring-0-entity.md:254-255`](adr/0072-resource-budget-ring-0-entity.md?plain=1#L254-L255)
  - ADR 0077, entry 1: [`docs/host-capability-substrate/adr/0077-audit-events-storage.md:312-319`](adr/0077-audit-events-storage.md?plain=1#L312-L319)
  - ADR 0079, entry 1: [`docs/host-capability-substrate/adr/0079-ring-1-policy-rule-loader.md:108-113`](adr/0079-ring-1-policy-rule-loader.md?plain=1#L108-L113)
  - ADR 0079, entry 3: [`docs/host-capability-substrate/adr/0079-ring-1-policy-rule-loader.md:119-120`](adr/0079-ring-1-policy-rule-loader.md?plain=1#L119-L120)
  - ADR 0080, entry 4: [`docs/host-capability-substrate/adr/0080-read-only-cli-adapter-surface.md:90-92`](adr/0080-read-only-cli-adapter-surface.md?plain=1#L90-L92)

## Regular deferrals

### 1. ADR 0019 — entry 2, successor 1

- Source: `docs/host-capability-substrate/adr/0019-knowledge-and-coordination-store.md:1043-1046`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
the schema PR
```

- Deferred obligation (exact source payload):

```
- `evidenceSubjectKindSchema` enum extension for any new subject
  kinds (`knowledge_source`, `knowledge_chunk`,
  `coordination_fact`, `derived_summary`). Extensions land with
  the schema PR.
```

### 2. ADR 0019 — entry 4, successor 1

- Source: `docs/host-capability-substrate/adr/0019-knowledge-and-coordination-store.md:1049-1050`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
Follow-up ADR
```

- Deferred obligation (exact source payload):

```
- Embedding model commitment, embedding dimensions, re-indexing
  triggers, retrieval tuning. Follow-up ADR.
```

### 3. ADR 0019 — entry 7, successor 1

- Source: `docs/host-capability-substrate/adr/0019-knowledge-and-coordination-store.md:1055-1056`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
follow-up
  ontology review
```

- Deferred obligation (exact source payload):

```
- The promotion-grant entity name. Reserved for follow-up
  ontology review.
```

### 4. ADR 0025 — entry 4, successor 1

- Source: `docs/host-capability-substrate/adr/0025-branch-deletion-proof.md:462-463`
- Successor file exists: `no`
- Named successor (exact source literal):

```
ADR 0026
```

- Deferred obligation (exact source payload):

```
- The full hook architecture for non-literal protected-branch
  classification (queued as ADR 0026).
```

### 5. ADR 0027 — entry 3, successor 1

- Source: `docs/host-capability-substrate/adr/0027-q-006-stage-1-source-control-evidence-subtypes.md:419-422`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
schema
  implementation PR
```

- Deferred obligation (exact source payload):

```
- Adding `branch_protection` to the `boundary_dimension` registry
  or to `boundaryDimensionSchema` enum (deferred to schema
  implementation PR per ontology-registry §Adding or removing a
  dimension and §Registration rules rule 7).
```

### 6. ADR 0027 — entry 4, successor 1

- Source: `docs/host-capability-substrate/adr/0027-q-006-stage-1-source-control-evidence-subtypes.md:423-425`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
a separate schema-change PR
```

- Deferred obligation (exact source payload):

```
- Adding `self-asserted` to the `evidenceAuthoritySchema` enum
  (deferred to a separate schema-change PR; registry v0.3.1
  §Self-assertion authority class records the rule).
```

### 7. ADR 0027 — entry 5, successor 1

- Source: `docs/host-capability-substrate/adr/0027-q-006-stage-1-source-control-evidence-subtypes.md:426-427`
- Successor file exists: `no`
- Named successor (exact source literal):

```
ADR 0026
```

- Deferred obligation (exact source payload):

```
- ADR 0026 substrate hook architecture (separate ADR, gated on
  `BranchProtectionObservation` schema acceptance).
```

### 8. ADR 0027 — entry 5, successor 2

- Source: `docs/host-capability-substrate/adr/0027-q-006-stage-1-source-control-evidence-subtypes.md:426-427`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
separate ADR
```

- Deferred obligation (exact source payload):

```
- ADR 0026 substrate hook architecture (separate ADR, gated on
  `BranchProtectionObservation` schema acceptance).
```

### 9. ADR 0028 — entry 2, successor 1

- Source: `docs/host-capability-substrate/adr/0028-q-008-a-execution-mode-receipts.md:634-635`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
Q-008
```

- Deferred obligation (exact source payload):

```
- Q-008(b) anomalous-command-capture blocking thresholds (separate
  sub-decision; pending).
```

### 10. ADR 0028 — entry 2, successor 2

- Source: `docs/host-capability-substrate/adr/0028-q-008-a-execution-mode-receipts.md:634-635`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
separate
  sub-decision
```

- Deferred obligation (exact source payload):

```
- Q-008(b) anomalous-command-capture blocking thresholds (separate
  sub-decision; pending).
```

### 11. ADR 0028 — entry 5, successor 1

- Source: `docs/host-capability-substrate/adr/0028-q-008-a-execution-mode-receipts.md:640-641`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
separate
  schema-change PR
```

- Deferred obligation (exact source payload):

```
- Adding `self-asserted` to `evidenceAuthoritySchema` (separate
  schema-change PR; registry v0.3.2 records the rule).
```

### 12. ADR 0028 — entry 8, successor 1

- Source: `docs/host-capability-substrate/adr/0028-q-008-a-execution-mode-receipts.md:646-648`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
schema
  implementation PR
```

- Deferred obligation (exact source payload):

```
- Setting canonical excerpt byte caps or capability-name
  classification schemes (canonical-policy-driven; schema
  implementation PR).
```

### 13. ADR 0029 — entry 6, successor 1

- Source: `docs/host-capability-substrate/adr/0029-q-008-b-anomalous-capture-blocking-thresholds.md:592-596`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
their own ADR
```

- Deferred obligation (exact source payload):

```
- Numeric thresholds for stage-2 anomalous-capture combinations (e.g.,
  rate of `empty_apparent_success` per session window). Such
  combinations require their own ADR if and when an incident
  motivates them.

```

### 14. ADR 0030 — entry 2, successor 1

- Source: `docs/host-capability-substrate/adr/0030-q-006-stage-2-source-control-evidence-subtypes.md:679-682`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
the schema PR
```

- Deferred obligation (exact source payload):

```
- The `evidenceSubjectKindSchema` enum extension that adds
  `git_worktree`, `git_worktree_inventory`,
  `git_branch_ancestry`, `git_dirty_state`, `pull_request`,
  `pull_request_absence`. The extension lands with the schema PR.
```

### 15. ADR 0031 — entry 4, successor 1

- Source: `docs/host-capability-substrate/adr/0031-q-008-d-worktree-ownership-composition.md:642-644`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
Canonical
  policy at Milestone 2
```

- Deferred obligation (exact source payload):

```
- `Lease` GC / expiry / extension policy windows. Canonical
  policy at Milestone 2 imposes per-`lease_kind` maximum
  windows.
```

### 16. ADR 0031 — entry 8, successor 1

- Source: `docs/host-capability-substrate/adr/0031-q-008-d-worktree-ownership-composition.md:653-654`
- Successor file exists: `no`
- Named successor (exact source literal):

```
ADR 0026
```

- Deferred obligation (exact source payload):

```
- ADR 0026 substrate hook architecture (still gated on
  stage-1 `BranchProtectionObservation` schema landing).
```

### 17. ADR 0031 — entry 9, successor 1

- Source: `docs/host-capability-substrate/adr/0031-q-008-d-worktree-ownership-composition.md:655-656`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
Q-006
```

- Deferred obligation (exact source payload):

```
- Q-006 (b)–(g) sub-decisions (separate ADR cycle).

```

### 18. ADR 0031 — entry 9, successor 2

- Source: `docs/host-capability-substrate/adr/0031-q-008-d-worktree-ownership-composition.md:655-656`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
separate ADR cycle
```

- Deferred obligation (exact source payload):

```
- Q-006 (b)–(g) sub-decisions (separate ADR cycle).

```

### 19. ADR 0032 — entry 2, successor 1

- Source: `docs/host-capability-substrate/adr/0032-q-005-ci-runner-evidence-model.md:1017-1020`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
Schema PR
```

- Deferred obligation (exact source payload):

```
- `evidenceSubjectKindSchema` enum extension for the six new
  subject-kind values (`runner_host`, `runner_isolation`,
  `workflow_run`, `clean_room_smoke`, `resource_budget`,
  `policy_plan`). Schema PR commits.
```

### 20. ADR 0032 — entry 3, successor 1

- Source: `docs/host-capability-substrate/adr/0032-q-005-ci-runner-evidence-model.md:1021-1022`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
Schema PR
```

- Deferred obligation (exact source payload):

```
- `Decision.reason_kind` enum extension for the five new
  reservations. Schema PR commits.
```

### 21. ADR 0033 — entry 8, successor 1

- Source: `docs/host-capability-substrate/adr/0033-q-006-b-g-github-authority-and-identity.md:929-931`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
follow-up Q-006 stage-3 ADRs
```

- Deferred obligation (exact source payload):

```
- Tag deletion, release-branch classification, submodule
  observation. Reserved for follow-up Q-006 stage-3 ADRs if
  needed.
```

### 22. ADR 0033 — entry 9, successor 1

- Source: `docs/host-capability-substrate/adr/0033-q-006-b-g-github-authority-and-identity.md:932-934`
- Successor file exists: `no`
- Named successor (exact source literal):

```
ADR 0026
```

- Deferred obligation (exact source payload):

```
- ADR 0026 substrate hook architecture (still gated on
  stage-1 `BranchProtectionObservation` schema; not gated on
  this ADR).
```

### 23. ADR 0034 — entry 5, successor 1

- Source: `docs/host-capability-substrate/adr/0034-q-007-b-f-boundary-evidence-composition-quality-gate-posture.md:920-921`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
Q-007
```

- Deferred obligation (exact source payload):

```
- `QualityGate` standalone Ring 0 entity. Reserved for
  Q-007(g) follow-up ADR.
```

### 24. ADR 0034 — entry 5, successor 2

- Source: `docs/host-capability-substrate/adr/0034-q-007-b-f-boundary-evidence-composition-quality-gate-posture.md:920-921`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
follow-up ADR
```

- Deferred obligation (exact source payload):

```
- `QualityGate` standalone Ring 0 entity. Reserved for
  Q-007(g) follow-up ADR.
```

### 25. ADR 0034 — entry 6, successor 1

- Source: `docs/host-capability-substrate/adr/0034-q-007-b-f-boundary-evidence-composition-quality-gate-posture.md:922-923`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
separate dashboard ADR
```

- Deferred obligation (exact source payload):

```
- Six dashboard view React component implementations. Reserved
  for separate dashboard ADR.
```

### 26. ADR 0034 — entry 9, successor 1

- Source: `docs/host-capability-substrate/adr/0034-q-007-b-f-boundary-evidence-composition-quality-gate-posture.md:933-935`
- Successor file exists: `no`
- Named successor (exact source literal):

```
ADR 0026
```

- Deferred obligation (exact source payload):

```
- ADR 0026 substrate hook architecture (gated on stage-1
  `BranchProtectionObservation` schema landing; not gated on
  this ADR).
```

### 27. ADR 0035 — entry 2, successor 1

- Source: `docs/host-capability-substrate/adr/0035-q-007-g-quality-gate-standalone-entity.md:775-776`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
Schema PR
```

- Deferred obligation (exact source payload):

```
- `evidenceSubjectKindSchema` enum extension for
  `quality_gate` (NEW subject-kind value). Schema PR commits.
```

### 28. ADR 0035 — entry 6, successor 1

- Source: `docs/host-capability-substrate/adr/0035-q-007-g-quality-gate-standalone-entity.md:785-788`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
Canonical policy
  at Milestone 2
```

- Deferred obligation (exact source payload):

```
- Per-`gate_kind` `valid_until` window policy. Canonical policy
  at Milestone 2 commits per-kind maxima (e.g.,
  `signing_identity` gate may carry 7-day window;
  `tool_provenance` gate may carry 30-day window).
```

### 29. ADR 0035 — entry 7, successor 1

- Source: `docs/host-capability-substrate/adr/0035-q-007-g-quality-gate-standalone-entity.md:789-791`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
Q-006
```

- Deferred obligation (exact source payload):

```
- Q-006 stage-3 `CommitSigningReceipt` (referenced by
  `signing_identity` gate but not yet committed). Reserved for
  future Q-006 stage-3 ADR.
```

### 30. ADR 0035 — entry 7, successor 2

- Source: `docs/host-capability-substrate/adr/0035-q-007-g-quality-gate-standalone-entity.md:789-791`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
future Q-006 stage-3 ADR
```

- Deferred obligation (exact source payload):

```
- Q-006 stage-3 `CommitSigningReceipt` (referenced by
  `signing_identity` gate but not yet committed). Reserved for
  future Q-006 stage-3 ADR.
```

### 31. ADR 0035 — entry 11, successor 1

- Source: `docs/host-capability-substrate/adr/0035-q-007-g-quality-gate-standalone-entity.md:799-801`
- Successor file exists: `no`
- Named successor (exact source literal):

```
ADR 0026
```

- Deferred obligation (exact source payload):

```
- ADR 0026 substrate hook architecture (still gated on
  stage-1 `BranchProtectionObservation` schema landing).

```

### 32. ADR 0036 — entry 2, successor 1

- Source: `docs/host-capability-substrate/adr/0036-q-009-workspace-manifest-projection-and-diagnostic-surface.md:965-967`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
Schema PR
```

- Deferred obligation (exact source payload):

```
- `evidenceSubjectKindSchema` enum extension for
  `verification_command_spec` (NEW subject-kind value). Schema PR
  commits.
```

### 33. ADR 0036 — entry 7, successor 1

- Source: `docs/host-capability-substrate/adr/0036-q-009-workspace-manifest-projection-and-diagnostic-surface.md:1016-1017`
- Successor file exists: `no`
- Named successor (exact source literal):

```
ADR 0026
```

- Deferred obligation (exact source payload):

```
- ADR 0026 substrate hook architecture (still gated on stage-1
  `BranchProtectionObservation` schema landing).
```

### 34. ADR 0036 — entry 9, successor 1

- Source: `docs/host-capability-substrate/adr/0036-q-009-workspace-manifest-projection-and-diagnostic-surface.md:1020-1020`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
Q-010
```

- Deferred obligation (exact source payload):

```
- Q-010 sub-decisions (separate Q-row).
```

### 35. ADR 0036 — entry 9, successor 2

- Source: `docs/host-capability-substrate/adr/0036-q-009-workspace-manifest-projection-and-diagnostic-surface.md:1020-1020`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
separate Q-row
```

- Deferred obligation (exact source payload):

```
- Q-010 sub-decisions (separate Q-row).
```

### 36. ADR 0036 — entry 11, successor 1

- Source: `docs/host-capability-substrate/adr/0036-q-009-workspace-manifest-projection-and-diagnostic-surface.md:1023-1028`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
Future Q-row
```

- Deferred obligation (exact source payload):

```
- Future Q-row for commit-signature-to-principal mapping (closes
  security NB-7 — the cycle-history.md ratification verifier-
  identity binding mechanism is committed by this ADR; the
  resolution rule for synthesizing `principal_id` from a signed
  git commit's author identity, including configured signature-to-
  principal mappings, defers to that future Q-row).
```

### 37. ADR 0036 — entry 11, successor 2

- Source: `docs/host-capability-substrate/adr/0036-q-009-workspace-manifest-projection-and-diagnostic-surface.md:1023-1028`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
that future Q-row
```

- Deferred obligation (exact source payload):

```
- Future Q-row for commit-signature-to-principal mapping (closes
  security NB-7 — the cycle-history.md ratification verifier-
  identity binding mechanism is committed by this ADR; the
  resolution rule for synthesizing `principal_id` from a signed
  git commit's author identity, including configured signature-to-
  principal mappings, defers to that future Q-row).
```

### 38. ADR 0036 — entry 12, successor 1

- Source: `docs/host-capability-substrate/adr/0036-q-009-workspace-manifest-projection-and-diagnostic-surface.md:1029-1033`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
Future ADR for `system.cleanup.plan.v1` composition with this
  ADR
```

- Deferred obligation (exact source payload):

```
- Future ADR for `system.cleanup.plan.v1` composition with this
  ADR's `system.workspace.diagnose.v1` outputs (architect F4 —
  whether cleanup-plan consumes the workspace-diagnose summary as
  authoritative input, and what re-derivation is required).

```

### 39. ADR 0037 — entry 4, successor 1

- Source: `docs/host-capability-substrate/adr/0037-q-010-cross-agent-isolation-and-compatibility-taxonomy.md:925-928`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
future
  ADR
```

- Deferred obligation (exact source payload):

```
- Per-product surface enum entries for Cursor, Copilot, Devin,
  Windsurf, Augment / Auggie, Amp, OpenCode, Warp Oz, VS Code
  local agents (matrix-only per Sub-decision (d) until future
  ADR with explicit Receipt subtype).
```

### 40. ADR 0037 — entry 11, successor 1

- Source: `docs/host-capability-substrate/adr/0037-q-010-cross-agent-isolation-and-compatibility-taxonomy.md:942-943`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
Future Q-row
```

- Deferred obligation (exact source payload):

```
- Future Q-row for first-class per-product surface enum entries
  if matrix-only entries accumulate material incident history.
```

### 41. ADR 0057 — entry 1, successor 1

- Source: `docs/host-capability-substrate/adr/0057-ring-1-mint-audit-service.md:410-413`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
a separate future ADR
```

- Deferred obligation (exact source payload):

```
- Execution broker behavior or host operation execution. The execution
  broker is a separate future ADR and remains forbidden until
  mint/audit, approval grants, leases, and dashboard review are
  operational.
```

### 42. ADR 0057 — entry 2, successor 1

- Source: `docs/host-capability-substrate/adr/0057-ring-1-mint-audit-service.md:414-415`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
a separate future ADR
```

- Deferred obligation (exact source payload):

```
- Gateway behavior. The gateway receives operation intent and
  re-derives decisions in a separate future ADR.
```

### 43. ADR 0064 — entry 2, successor 1

- Source: `docs/host-capability-substrate/adr/0064-ring-1-mint-audit-service-contracts.md:477-478`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
audit-events/storage ADR
```

- Deferred obligation (exact source payload):

```
- The persistent audit-events store, atomic per-chain-root append, or
  unique-genesis enforcement (audit-events/storage ADR).
```

### 44. ADR 0067 — entry 6, successor 1

- Source: `docs/host-capability-substrate/adr/0067-tool-provider-ring-0-entity.md:287-287`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
separate future ADRs
```

- Deferred obligation (exact source payload):

```
- `ToolInstallation` / `ResolvedTool` design (separate future ADRs).
```

### 45. ADR 0068 — entry 5, successor 1

- Source: `docs/host-capability-substrate/adr/0068-tool-installation-ring-0-entity.md:290-290`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
a separate future ADR
```

- Deferred obligation (exact source payload):

```
- `ResolvedTool` design (a separate future ADR).
```

### 46. ADR 0070 — entry 5, successor 1

- Source: `docs/host-capability-substrate/adr/0070-artifact-ring-0-entity.md:263-263`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
separate future ADRs
```

- Deferred obligation (exact source payload):

```
- `Lock` / `ResourceBudget` design (separate future ADRs).
```

### 47. ADR 0071 — entry 5, successor 1

- Source: `docs/host-capability-substrate/adr/0071-lock-ring-0-entity.md:244-244`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
a separate future ADR
```

- Deferred obligation (exact source payload):

```
- `ResourceBudget` design (a separate future ADR).
```

### 48. ADR 0076 — entry 4, successor 1

- Source: `docs/host-capability-substrate/adr/0076-model-ring-0-entity.md:376-377`
- Successor file exists: `not-file-addressable`
- Named successor (exact source literal):

```
a later policy slice
```

- Deferred obligation (exact source payload):

```
- Any Ring-1 retracted-model guard, floor-rejection, or `pin_value → resolved_model_name`
  resolver; any `reason_kind` additions for model rejections (a later policy slice).
```

## Review required: ambiguous regular entries

### 1. ADR 0019 — entry 1

- Source: `docs/host-capability-substrate/adr/0019-knowledge-and-coordination-store.md:1040-1042`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Zod schema source for any of the four entities. Schema
  implementation lands per `.agents/skills/hcs-schema-change`
  after acceptance and Milestone 4.
```

### 2. ADR 0019 — entry 5

- Source: `docs/host-capability-substrate/adr/0019-knowledge-and-coordination-store.md:1051-1052`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Dashboard views (`/evidence`, `/coordination`, `/knowledge`,
  `/interventions`, `/reconciliation`). Separate dashboard ADR.
```

### 3. ADR 0019 — entry 6

- Source: `docs/host-capability-substrate/adr/0019-knowledge-and-coordination-store.md:1053-1054`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- MCP surface (Resources `hcs://...`, Tools `system.*`,
  Prompts). Separate adapter ADR.
```

### 4. ADR 0019 — entry 8

- Source: `docs/host-capability-substrate/adr/0019-knowledge-and-coordination-store.md:1057-1059`
- Review reason: `unbound-deferral-cue`
- Exact source payload:

```
- Charter invariant text. The inv. 18 wording is a candidate;
  the actual charter amendment lands per change-policy in a
  separate PR.
```

### 5. ADR 0019 — entry 9

- Source: `docs/host-capability-substrate/adr/0019-knowledge-and-coordination-store.md:1060-1064`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Canonical policy YAML at
  `system-config/policies/host-capability-substrate/`. Promotion-
  grant verifier-class privileges, retention windows for
  unpromoted candidates, and similar canonical-policy concerns
  land at HCS Milestone 2.
```

### 6. ADR 0019 — entry 10

- Source: `docs/host-capability-substrate/adr/0019-knowledge-and-coordination-store.md:1065-1066`
- Review reason: `unbound-deferral-cue`
- Exact source payload:

```
- Multi-host coordination-store deployment. Postgres/pgvector
  deferred per the brief.
```

### 7. ADR 0019 — entry 11

- Source: `docs/host-capability-substrate/adr/0019-knowledge-and-coordination-store.md:1067-1071`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Q-008(d) worktree-ownership composition rules. Q-008(d) gates
  on Q-003 *posture*, which this ADR commits; the actual
  composition between `WorkspaceContext` / `Lease` / `CoordinationFact`
  continues under Q-008(d).

```

### 8. ADR 0025 — entry 3

- Source: `docs/host-capability-substrate/adr/0025-branch-deletion-proof.md:460-461`
- Review reason: `unbound-deferral-cue`
- Exact source payload:

```
- The `ApprovalGrant.scope` field-level shape (deferred to its own ADR
  in Milestone 2).
```

### 9. ADR 0025 — entry 6

- Source: `docs/host-capability-substrate/adr/0025-branch-deletion-proof.md:466-468`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Any change to ADR 0020's broader version-control authority posture;
  this ADR specializes one of ADR 0020's named receipts.

```

### 10. ADR 0027 — entry 2

- Source: `docs/host-capability-substrate/adr/0027-q-006-stage-1-source-control-evidence-subtypes.md:418-418`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- The remaining five Q-006 stage-2 receipts.
```

### 11. ADR 0027 — entry 6

- Source: `docs/host-capability-substrate/adr/0027-q-006-stage-1-source-control-evidence-subtypes.md:428-428`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Q-006 broader receipt inventory beyond the three stage-1 picks.
```

### 12. ADR 0028 — entry 3

- Source: `docs/host-capability-substrate/adr/0028-q-008-a-execution-mode-receipts.md:636-636`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Q-008(d) worktree-ownership composition (gated on Q-003).
```

### 13. ADR 0028 — entry 4

- Source: `docs/host-capability-substrate/adr/0028-q-008-a-execution-mode-receipts.md:637-639`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Adding `tool_invocation` to the evidence-subject enum in
  `packages/schemas/src/entities/evidence.ts`. That schema enum
  update lands with the schema implementation PR.
```

### 14. ADR 0028 — entry 6

- Source: `docs/host-capability-substrate/adr/0028-q-008-a-execution-mode-receipts.md:642-644`
- Review reason: `unbound-deferral-cue`
- Exact source payload:

```
- Kernel broker semantics for `installed-runtime` authority on
  `ToolInvocationReceipt`. Anticipated future authority but not
  current posture; broker lands later.
```

### 15. ADR 0029 — entry 1

- Source: `docs/host-capability-substrate/adr/0029-q-008-b-anomalous-capture-blocking-thresholds.md:574-578`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Canonical policy YAML at
  `system-config/policies/host-capability-substrate/`. The matrix is
  posture; the policy entries are system-config work, gated on HCS
  Milestone 2 (`tiers.yaml` schema + `Decision`/`ApprovalGrant`
  schema extensions).
```

### 16. ADR 0029 — entry 2

- Source: `docs/host-capability-substrate/adr/0029-q-008-b-anomalous-capture-blocking-thresholds.md:579-582`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Schema source for `Decision` or `ApprovalGrant` extensions
  (`reason_kind` enum, `required_grant_kind` enum,
  `ApprovalGrant.scope` shape). Schema implementation lands per
  `.agents/skills/hcs-schema-change` after this ADR's acceptance.
```

### 17. ADR 0029 — entry 5

- Source: `docs/host-capability-substrate/adr/0029-q-008-b-anomalous-capture-blocking-thresholds.md:587-591`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Q-008(d) worktree-ownership composition rules. The matrix names
  `worktree_mutation` as a class; the composition with
  `WorkspaceContext` / `Lease` / Q-003 coordination facts continues
  under Q-008(d). The default cell values in the
  `worktree_mutation` row apply until Q-008(d) settles.
```

### 18. ADR 0030 — entry 1

- Source: `docs/host-capability-substrate/adr/0030-q-006-stage-2-source-control-evidence-subtypes.md:676-678`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Zod schema source for any of the six receipts. Schema
  implementation lands per `.agents/skills/hcs-schema-change` after
  this ADR's acceptance.
```

### 19. ADR 0030 — entry 3

- Source: `docs/host-capability-substrate/adr/0030-q-006-stage-2-source-control-evidence-subtypes.md:683-685`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- The `Decision.reason_kind` enum extensions for the six
  rejection-class names above. Those land per
  `.agents/skills/hcs-schema-change`.
```

### 20. ADR 0030 — entry 5

- Source: `docs/host-capability-substrate/adr/0030-q-006-stage-2-source-control-evidence-subtypes.md:688-692`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Q-008(d) worktree-ownership composition rules. Stage-2 commits
  the field shape (`lease_id`, `owning_session_id`,
  `last_lease_check_at` on `GitWorktreeObservation`); composition
  with `WorkspaceContext` / `Lease` / Q-003 coordination facts
  remains under Q-008(d) once Q-003 settles.
```

### 21. ADR 0030 — entry 6

- Source: `docs/host-capability-substrate/adr/0030-q-006-stage-2-source-control-evidence-subtypes.md:693-695`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- ADR 0026 substrate hook architecture. ADR 0026 is gated on
  stage-1's `BranchProtectionObservation` schema landing, not on
  stage-2.
```

### 22. ADR 0030 — entry 7

- Source: `docs/host-capability-substrate/adr/0030-q-006-stage-2-source-control-evidence-subtypes.md:696-701`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Canonical policy YAML at
  `system-config/policies/host-capability-substrate/`. The matrix
  of operation-class × receipt-anomaly cells from ADR 0029 v2
  governs gateway behavior; canonical numeric thresholds and
  per-cell refinements land in `tiers.yaml` once HCS Milestone 2
  ships.
```

### 23. ADR 0030 — entry 8

- Source: `docs/host-capability-substrate/adr/0030-q-006-stage-2-source-control-evidence-subtypes.md:702-706`
- Review reason: `unbound-deferral-cue`
- Exact source payload:

```
- Provider-specific receipts beyond GitHub. `provider_kind: "github"`
  is the only currently-supported provider value; other providers
  (GitLab, Bitbucket) follow under separate ADRs if and when
  needed.

```

### 24. ADR 0031 — entry 1

- Source: `docs/host-capability-substrate/adr/0031-q-008-d-worktree-ownership-composition.md:631-634`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Zod schema source for `Lease`, `WorkspaceContext`, or the
  `subject_kind: "worktree"` `subject_ref` shape on
  `CoordinationFact`. Schema implementation lands per
  `.agents/skills/hcs-schema-change` after acceptance.
```

### 25. ADR 0031 — entry 2

- Source: `docs/host-capability-substrate/adr/0031-q-008-d-worktree-ownership-composition.md:635-638`
- Review reason: `unbound-deferral-cue`
- Exact source payload:

```
- `Lease.lease_kind` enum extension beyond the three reserved
  values (`worktree`, `credential_audience`, `external_target`).
  New `lease_kind` values require an ontology-controlled
  vocabulary update.
```

### 26. ADR 0031 — entry 3

- Source: `docs/host-capability-substrate/adr/0031-q-008-d-worktree-ownership-composition.md:639-641`
- Review reason: `unbound-deferral-cue`
- Exact source payload:

```
- Multi-worktree `WorkspaceContext` (a context spanning primary
  + linked worktrees). Phase 1 is one-to-one per (A);
  multi-worktree revisitable when an incident motivates it.
```

### 27. ADR 0031 — entry 6

- Source: `docs/host-capability-substrate/adr/0031-q-008-d-worktree-ownership-composition.md:646-647`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Charter invariant text for any worktree-ownership rule.
  Q-008(d) is doc-only / posture-only.
```

### 28. ADR 0031 — entry 7

- Source: `docs/host-capability-substrate/adr/0031-q-008-d-worktree-ownership-composition.md:648-652`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Canonical policy YAML at
  `system-config/policies/host-capability-substrate/`. Per-
  `lease_kind` windows, per-class force-break-glass authority,
  and verifier-class privileges all land in `tiers.yaml` once
  HCS Milestone 2 ships.
```

### 29. ADR 0032 — entry 1

- Source: `docs/host-capability-substrate/adr/0032-q-005-ci-runner-evidence-model.md:1015-1016`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Zod schema source for any of the six entities. Schema lands
  per `.agents/skills/hcs-schema-change` after acceptance.
```

### 30. ADR 0032 — entry 4

- Source: `docs/host-capability-substrate/adr/0032-q-005-ci-runner-evidence-model.md:1023-1026`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Promotion of `CleanRoomSmokeReceipt` or `PolicyPlanReceipt`
  to proof composite (Q-011 bucket 3). Reserved for follow-up
  ADRs if and when a future operation class consumes them as
  gating evidence.
```

### 31. ADR 0032 — entry 5

- Source: `docs/host-capability-substrate/adr/0032-q-005-ci-runner-evidence-model.md:1027-1029`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- `StatusCheckSourceObservation` Zod schema or full receipt
  shape. Q-005 names the requirement; Q-006 stage-2 / stage-3
  owns the receipt shape.
```

### 32. ADR 0032 — entry 6

- Source: `docs/host-capability-substrate/adr/0032-q-005-ci-runner-evidence-model.md:1030-1033`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Canonical policy YAML at
  `system-config/policies/host-capability-substrate/`. The five
  forbidden-runner families are posture-only here; canonical
  rule entries land in `tiers.yaml` once HCS Milestone 2 ships.
```

### 33. ADR 0032 — entry 8

- Source: `docs/host-capability-substrate/adr/0032-q-005-ci-runner-evidence-model.md:1038-1043`
- Review reason: `unbound-deferral-cue`
- Exact source payload:

```
- Charter invariant text. The Citadel-HCS boundary and the five
  forbidden families compose with existing inv. 1 / 5 / 7 / 8 /
  13 / 15 / 16 / 17 without requiring new invariants. Future
  charter v1.4.0 may codify "HCS does not own external CI
  control-plane policy" as an explicit invariant; that
  amendment lands per change-policy in a separate PR.
```

### 34. ADR 0032 — entry 9

- Source: `docs/host-capability-substrate/adr/0032-q-005-ci-runner-evidence-model.md:1044-1047`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Q-007 (b)–(f) sub-decisions. Q-007's `QualityGate` deferral
  cadence depends on Q-005 + Q-006 settling; Q-005 settles
  here, but Q-007 (b) acceptance requires Q-006 (b)–(g)
  closure, which is a separate Q-row.
```

### 35. ADR 0032 — entry 10

- Source: `docs/host-capability-substrate/adr/0032-q-005-ci-runner-evidence-model.md:1048-1051`
- Review reason: `relation-crosses-and-or`, `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Stage-2 runner/check receipts (e.g.,
  `WorkflowPolicyObservation`, `RemoteAgentEnvironmentReceipt`).
  Reserved for follow-up Q-005 stage-2 or Q-010 when remote-
  agent execution evidence work begins.
```

### 36. ADR 0032 — entry 11

- Source: `docs/host-capability-substrate/adr/0032-q-005-ci-runner-evidence-model.md:1052-1056`
- Review reason: `unbound-deferral-cue`
- Exact source payload:

```
- Multi-runner-host coordination facts. A
  `CoordinationFact.subject_kind: "runner_host"` is a future
  candidate for the §Predicate-kind vocabulary registry update;
  not committed by this ADR.

```

### 37. ADR 0033 — entry 1

- Source: `docs/host-capability-substrate/adr/0033-q-006-b-g-github-authority-and-identity.md:901-907`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Zod schema source for any of the five new evidence subtypes
  (`RulesetObservation`, `RepositoryIdentityReconciliation`,
  `MCPCredentialAudienceObservation`,
  `StatusCheckSourceObservation`). Plus the
  `GitHubMutationAuthority` value type and the six
  `Decision.reason_kind` reservations. Schema lands per
  `.agents/skills/hcs-schema-change` after acceptance.
```

### 38. ADR 0033 — entry 3

- Source: `docs/host-capability-substrate/adr/0033-q-006-b-g-github-authority-and-identity.md:912-915`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Canonical policy YAML at
  `system-config/policies/host-capability-substrate/`. The
  mutation-class × authority-class matrix is posture; canonical
  rule entries land in `tiers.yaml` once HCS Milestone 2 ships.
```

### 39. ADR 0033 — entry 4

- Source: `docs/host-capability-substrate/adr/0033-q-006-b-g-github-authority-and-identity.md:916-918`
- Review reason: `unbound-deferral-cue`
- Exact source payload:

```
- Specific GitHub Ruleset IDs, ruleset versions, or canonical
  GitHub App identifiers. Those belong to a separate GitHub
  governance / hardening task outside HCS mutation lanes.
```

### 40. ADR 0033 — entry 5

- Source: `docs/host-capability-substrate/adr/0033-q-006-b-g-github-authority-and-identity.md:919-922`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- GitHub App provisioning automation or installation
  workflows. Citadel OPA / OpenTofu owns external control-
  plane provisioning per ADR 0015 + ADR 0032 v2 Citadel-vs-HCS
  boundary.
```

### 41. ADR 0033 — entry 6

- Source: `docs/host-capability-substrate/adr/0033-q-006-b-g-github-authority-and-identity.md:923-924`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Workspace-context ↔ repository_id cross-binding (separate
  Q-009 / Q-008(d) territory).
```

### 42. ADR 0033 — entry 7

- Source: `docs/host-capability-substrate/adr/0033-q-006-b-g-github-authority-and-identity.md:925-928`
- Review reason: `unbound-deferral-cue`
- Exact source payload:

```
- Multi-organization workspace routing. Organizational identity
  mapping is a `WorkspaceContext` concern, not identity
  reconciliation. Single-org per `WorkspaceContext` is the
  Phase 1 default.
```

### 43. ADR 0033 — entry 10

- Source: `docs/host-capability-substrate/adr/0033-q-006-b-g-github-authority-and-identity.md:935-937`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- GitHub Copilot cloud-agent remote-environment receipt (Q-010
  territory; tooling-surface-matrix routes Copilot through
  Q-005/Q-006 evidence).
```

### 44. ADR 0033 — entry 11

- Source: `docs/host-capability-substrate/adr/0033-q-006-b-g-github-authority-and-identity.md:938-940`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- `ExecutionContext.actor_kind` field commitment (referenced by
  ADR 0032 v2's MacBook always-on cross-context rule; remains
  follow-up Q-* candidate).
```

### 45. ADR 0033 — entry 12

- Source: `docs/host-capability-substrate/adr/0033-q-006-b-g-github-authority-and-identity.md:941-945`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Q-007 (b)-(f) sub-decisions. Q-007(b) `QualityGate` deferral
  cadence is now fully unblocked at the posture layer (Q-005
  + Q-006(g) settled); Q-007 (b)-(f) remains a separate
  Q-row.

```

### 46. ADR 0034 — entry 1

- Source: `docs/host-capability-substrate/adr/0034-q-007-b-f-boundary-evidence-composition-quality-gate-posture.md:907-909`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Zod schema source for `GitIdentityBinding` or `ToolProvenance`.
  Schema lands per `.agents/skills/hcs-schema-change` after
  acceptance.
```

### 47. ADR 0034 — entry 3

- Source: `docs/host-capability-substrate/adr/0034-q-007-b-f-boundary-evidence-composition-quality-gate-posture.md:913-917`
- Review reason: `unbound-deferral-cue`
- Exact source payload:

```
- `boundary_dimension` registry entries for the four new
  candidates (`execution_context_boundary`,
  `credential_source_boundary`, `git_identity_boundary`,
  `tool_provenance_boundary`). Registry update PR follows after
  acceptance.
```

### 48. ADR 0034 — entry 7

- Source: `docs/host-capability-substrate/adr/0034-q-007-b-f-boundary-evidence-composition-quality-gate-posture.md:924-925`
- Review reason: `unbound-deferral-cue`
- Exact source payload:

```
- Charter inv. 19 amendment text. Charter amendments follow
  change-policy in a separate PR after this ADR's acceptance.
```

### 49. ADR 0034 — entry 8

- Source: `docs/host-capability-substrate/adr/0034-q-007-b-f-boundary-evidence-composition-quality-gate-posture.md:926-932`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Canonical policy YAML at
  `system-config/policies/host-capability-substrate/`.
  Boundary-evidence stateness matrix entries, per-`boundary_dimension`
  freshness windows, ApprovalGrant.scope per-class extension
  for boundary-evidence operations, and verifier-class
  privileges for `boundary_evidence_*_acknowledgment` grants
  all land in `tiers.yaml` once HCS Milestone 2 ships.
```

### 50. ADR 0034 — entry 10

- Source: `docs/host-capability-substrate/adr/0034-q-007-b-f-boundary-evidence-composition-quality-gate-posture.md:936-937`
- Review reason: `unbound-deferral-cue`
- Exact source payload:

```
- Q-007(g) QualityGate ADR (next candidate Q-row after this
  ADR lands).
```

### 51. ADR 0034 — entry 11

- Source: `docs/host-capability-substrate/adr/0034-q-007-b-f-boundary-evidence-composition-quality-gate-posture.md:938-939`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Q-009, Q-010 sub-decisions (separate Q-rows).

```

### 52. ADR 0035 — entry 1

- Source: `docs/host-capability-substrate/adr/0035-q-007-g-quality-gate-standalone-entity.md:773-774`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Zod schema source for `QualityGate`. Schema lands per
  `.agents/skills/hcs-schema-change` after acceptance.
```

### 53. ADR 0035 — entry 3

- Source: `docs/host-capability-substrate/adr/0035-q-007-g-quality-gate-standalone-entity.md:777-778`
- Review reason: `unbound-deferral-cue`
- Exact source payload:

```
- `gate_kind` and `gate_state` enum extensions to registry.
  Registry update PR follows after acceptance.
```

### 54. ADR 0035 — entry 5

- Source: `docs/host-capability-substrate/adr/0035-q-007-g-quality-gate-standalone-entity.md:781-784`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Per-(gate_kind, operation_class) composition rules in
  canonical policy YAML at
  `system-config/policies/host-capability-substrate/`. Land at
  Milestone 2.
```

### 55. ADR 0035 — entry 8

- Source: `docs/host-capability-substrate/adr/0035-q-007-g-quality-gate-standalone-entity.md:792-794`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Dashboard `/quality-gates` view React component implementation.
  Reserved for separate dashboard ADR per ADR 0019 v3 / ADR 0034
  v2 precedent.
```

### 56. ADR 0035 — entry 9

- Source: `docs/host-capability-substrate/adr/0035-q-007-g-quality-gate-standalone-entity.md:795-797`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Charter inv. 19 amendment text. Charter amendments follow
  change-policy in separate PR (per ADR 0021 / ADR 0024
  precedent).
```

### 57. ADR 0035 — entry 10

- Source: `docs/host-capability-substrate/adr/0035-q-007-g-quality-gate-standalone-entity.md:798-798`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Q-009 / Q-010 sub-decisions (separate Q-rows).
```

### 58. ADR 0036 — entry 1

- Source: `docs/host-capability-substrate/adr/0036-q-009-workspace-manifest-projection-and-diagnostic-surface.md:957-964`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Zod schema source for `VerificationCommandSpec`,
  `boundary_dimension: filesystem_inheritance` /
  `filesystem_protected_paths` / `mcp_canonical_authority` payload
  schemas, or `OperationShape` field additions
  (`deletion_authority_source_ref`, `deletion_authority_kind`,
  `operation_class: "workspace_verify"`,
  `mutation_scope: "verify_workspace"`). Schema lands per
  `.agents/skills/hcs-schema-change`.
```

### 59. ADR 0036 — entry 3

- Source: `docs/host-capability-substrate/adr/0036-q-009-workspace-manifest-projection-and-diagnostic-surface.md:968-1002`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Registry update PR for:
  - Producer-class allowlist extension: new
    `Evidence.producer: "kernel_workspace_diagnose"` value (closes
    architect B3).
  - `KnowledgeSource.source_kind` extensions: 2 new values
    (`audit_profile_yaml`, `cycle_history`).
  - `KnowledgeSource.security_label` extension: 1 new value
    (`secret_pointer`).
  - `CoordinationFact.subject_kind` extensions: 2 new values
    (`workspace_context`, `audit_profile_snapshot`).
  - `predicate_kind` reservations: 3 new values
    (`claimed_to_contain`, `confirmed_to_contain`,
    `claim_superseded_by_snapshot`).
  - `boundary_dimension` reservations: 3 new values
    (`filesystem_inheritance`, `filesystem_protected_paths`,
    `mcp_canonical_authority`); 1 stage-2-reserved value
    (`filesystem_path_authority_check`).
  - `path_authority_kind` enum: 4 new values (`rule_binding`,
    `lease_scope`, `tcc_scoped`, `human_dashboard_grant`) on the
    `filesystem_protected_paths` payload (closes ontology N-5).
  - `operation_class` extension: 1 new value (`workspace_verify`).
  - `mutation_scope` extension: 1 new value (`verify_workspace`)
    (closes policy non-blocking #4).
  - `deletion_authority_kind` enum: 4 new values
    (`filesystem_protected_paths_observation`, `coordination_fact`,
    `human_dashboard_grant`, `runtime_state_classification`).
  - `Decision.reason_kind` reservations: 6 new values
    (`mcp_canonical_authority_duplicate`,
    `verification_command_spec_unmet`,
    `derived_summary_secret_shape_in_text`,
    `coordination_fact_insufficient_grounding`,
    `coordination_promotion_no_layer1_grounding`,
    `deletion_authority_kind_ref_mismatch`).
  - Discriminated-union pattern shape (`pattern_kind: "glob" |
    "regex"`) on `WorkspaceContext` exclusion arrays.
```

### 60. ADR 0036 — entry 4

- Source: `docs/host-capability-substrate/adr/0036-q-009-workspace-manifest-projection-and-diagnostic-surface.md:1003-1008`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Canonical policy YAML at
  `system-config/policies/host-capability-substrate/`. Per-
  `boundary_dimension` freshness windows; per-operation_class
  composition rules; verifier-class privileges for audit-framework
  promotion grants; canonical exclusion-pattern conflict resolution
  (closes security NB-2).
```

### 61. ADR 0036 — entry 5

- Source: `docs/host-capability-substrate/adr/0036-q-009-workspace-manifest-projection-and-diagnostic-surface.md:1009-1013`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Four deferred diagnostic operations (`system.runtime.diagnose.v1`,
  `system.git.diagnose.v1`, `system.docs.diagnose.v1`,
  `system.cleanup.plan.v1`); each defers until evidence dependencies
  clear (Q-006 stage-3, Q-008 typed inputs, Milestone 2 canonical
  policy).
```

### 62. ADR 0036 — entry 6

- Source: `docs/host-capability-substrate/adr/0036-q-009-workspace-manifest-projection-and-diagnostic-surface.md:1014-1015`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- `system.claims.reconcile.v1` operation. Subsumed into ADR 0019 v3
  `DerivedSummary` + Q-003 promotion workflow per Sub-decision (e).
```

### 63. ADR 0036 — entry 8

- Source: `docs/host-capability-substrate/adr/0036-q-009-workspace-manifest-projection-and-diagnostic-surface.md:1018-1019`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Charter inv. 19 amendment text (separate charter PR per change-
  policy, per ADR 0034 v2).
```

### 64. ADR 0037 — entry 1

- Source: `docs/host-capability-substrate/adr/0037-q-010-cross-agent-isolation-and-compatibility-taxonomy.md:891-895`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Zod schema source for `AgentClient` Ring 0 entity, the three
  remote-agent subtype envelopes, the `containment_class`
  payload shape, or `ExecutionContext` field changes
  (`latest_containment_evidence_ref`, `kernel_sandbox_kind` cache
  semantics). Schema lands per `.agents/skills/hcs-schema-change`.
```

### 65. ADR 0037 — entry 2

- Source: `docs/host-capability-substrate/adr/0037-q-010-cross-agent-isolation-and-compatibility-taxonomy.md:896-917`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Registry update PR for:
  - `ExecutionContext.surface` enum extension: 1 new value
    (`remote_cloud_agent`).
  - `boundary_dimension: containment_class` payload commitment
    (closes ADR 0022 open dependency).
  - `AgentClient` Ring 0 entity registration with six axes +
    lifecycle.
  - Three new `Evidence` subtypes
    (`RemoteAgentBaseImageObservation`,
    `RemoteAgentSetupReceipt`,
    `RemoteAgentNetworkPostureObservation`).
  - Producer-class allowlist extension: new
    `kernel_agent_client_resolver` value.
  - `Decision.reason_kind` reservations: 6 new values.
  - `secret_injection_kind` discriminator on
    `RemoteAgentSetupReceipt` (5 values).
  - `containment_kind` discriminator on `containment_class`
    payload (7 values).
  - `AgentClient.product_family` enum (12 values).
  - `AgentClient.permission_mode` enum (5 values).
  - `AgentClient.containment_mechanism` enum (8 values).
  - `agent_client_state` enum (2 values).
```

### 66. ADR 0037 — entry 3

- Source: `docs/host-capability-substrate/adr/0037-q-010-cross-agent-isolation-and-compatibility-taxonomy.md:918-924`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Canonical policy YAML at
  `system-config/policies/host-capability-substrate/`. Per-
  `boundary_dimension` freshness windows (containment dimension
  needs a tighter window per Sub-decision (e)); non-PR remote-
  agent binding window duration (Phase 1 default ±5 min, but
  canonical policy commits the number); per-product-family
  permission-mode verifier rules.
```

### 67. ADR 0037 — entry 5

- Source: `docs/host-capability-substrate/adr/0037-q-010-cross-agent-isolation-and-compatibility-taxonomy.md:929-932`
- Review reason: `unbound-deferral-cue`
- Exact source payload:

```
- `RemoteAgentInvocationReceipt` aggregator entity (Phase 1
  uses `(execution_context_id, observed_at_window)` binding;
  aggregator queued for future amendment if non-PR binder fails
  per Sub-decision (c)).
```

### 68. ADR 0037 — entry 6

- Source: `docs/host-capability-substrate/adr/0037-q-010-cross-agent-isolation-and-compatibility-taxonomy.md:933-935`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- ADR 0022 amendment (Sub-decision (a) keeps containment posture
  inside the BoundaryObservation envelope; ADR 0022 as accepted
  remains correct).
```

### 69. ADR 0037 — entry 7

- Source: `docs/host-capability-substrate/adr/0037-q-010-cross-agent-isolation-and-compatibility-taxonomy.md:936-936`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- A2A facade (deferred per D-013).
```

### 70. ADR 0037 — entry 8

- Source: `docs/host-capability-substrate/adr/0037-q-010-cross-agent-isolation-and-compatibility-taxonomy.md:937-937`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Codex profile cross-surface inheritance (rejected per D-031).
```

### 71. ADR 0037 — entry 10

- Source: `docs/host-capability-substrate/adr/0037-q-010-cross-agent-isolation-and-compatibility-taxonomy.md:940-941`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Charter inv. 19 amendment text (separate charter PR per
  change-policy, per ADR 0034 v2).
```

### 72. ADR 0037 — entry 12

- Source: `docs/host-capability-substrate/adr/0037-q-010-cross-agent-isolation-and-compatibility-taxonomy.md:944-949`
- Review reason: `unbound-deferral-cue`
- Exact source payload:

```
- Future ADR for cross-cutting AgentClient × WorkspaceContext
  cardinality if a single workspace's operations span multiple
  AgentClients with conflicting capability-class evidence
  (architectural deferral; current Phase 1 assumption is single
  active AgentClient per ExecutionContext).

```

### 73. ADR 0038 — entry 1

- Source: `docs/host-capability-substrate/adr/0038-phase-2-schema-landing-sequence.md:683-686`
- Review reason: `unbound-deferral-cue`
- Exact source payload:

```
- Authoring of any Phase 2 content (schemas, registry edits,
  charter v1.4.0 invariant text, canonical policy YAML, trap
  fixtures). Per IMPLEMENT.md meta-ADR rule, these land in their
  own PRs.
```

### 74. ADR 0038 — entry 2

- Source: `docs/host-capability-substrate/adr/0038-phase-2-schema-landing-sequence.md:687-689`
- Review reason: `unbound-deferral-cue`
- Exact source payload:

```
- Phase 3 work: dashboard, kernel read paths, adapter wiring,
  hook integration. Sequencing for Phase 3 is a future ADR if
  warranted.
```

### 75. ADR 0038 — entry 3

- Source: `docs/host-capability-substrate/adr/0038-phase-2-schema-landing-sequence.md:690-691`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Re-baselining of Claude Code CLI / Codex CLI versions
  (D-029) — independent of schema sequencing.
```

### 76. ADR 0038 — entry 4

- Source: `docs/host-capability-substrate/adr/0038-phase-2-schema-landing-sequence.md:692-707`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- The future ADRs queued in §Future amendments of synthesis-
  window cohort:
  - `RemoteAgentInvocationReceipt` aggregator (ADR 0037 follow-up
    if non-PR `(execution_context_id, observed_at_window)` binder
    fails empirically).
  - `AgentClient × WorkspaceContext` cardinality (multi-AgentClient
    workspaces).
  - `system.cleanup.plan.v1` composition with
    `system.workspace.diagnose.v1` (ADR 0036 follow-up).
  - Cross-cutting derived-content `subject_kind` grounding rule
    extension (ADR 0036 extensibility principle).
  - Per-product surface enum entries (only if matrix-only entries
    accumulate material incident history).
  - Future Q-row for commit-signature-to-principal mapping
    (cycle-history.md verifier-identity resolution per ADR 0036).

```

### 77. ADR 0039 — entry 1

- Source: `docs/host-capability-substrate/adr/0039-charter-v1-4-0-invariants-18-and-19.md:1050-1056`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- **Six-question surface-boundary discipline.** Per AGENTS.md
  / charter §Authoring rules, the six-question discipline
  applies when "the PR adds a capability." This PR adds no
  capability; it amends invariant text. Six-question discipline
  is out-of-scope. (ADR 0021 + ADR 0024 also did not include
  six-question discipline; consistent precedent.)

```

### 78. ADR 0039 — entry 2

- Source: `docs/host-capability-substrate/adr/0039-charter-v1-4-0-invariants-18-and-19.md:1057-1063`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- **Schema PRs** for the entities referenced by the invariants
  (`AgentClient` / `VerificationCommandSpec` / Knowledge+
  Coordination subgraph / `QualityGate` at Phase 2.1.x;
  `ExecutionContext` cache / `OperationShape` extension /
  `BoundaryObservation` payload bundle at Phase 2.2.x). Per
  ADR 0038.

```

### 79. ADR 0039 — entry 3

- Source: `docs/host-capability-substrate/adr/0039-charter-v1-4-0-invariants-18-and-19.md:1064-1065`
- Review reason: `unbound-deferral-cue`
- Exact source payload:

```
- **Canonical policy YAML** (Phase 2.5).

```

### 80. ADR 0039 — entry 4

- Source: `docs/host-capability-substrate/adr/0039-charter-v1-4-0-invariants-18-and-19.md:1066-1067`
- Review reason: `unbound-deferral-cue`
- Exact source payload:

```
- **Trap fixtures** (Phase 2.6).

```

### 81. ADR 0039 — entry 5

- Source: `docs/host-capability-substrate/adr/0039-charter-v1-4-0-invariants-18-and-19.md:1068-1072`
- Review reason: `unbound-deferral-cue`
- Exact source payload:

```
- **`evidenceAuthoritySchema` enum extension** to commit
  `self-asserted` as an enum value (separate schema-change PR;
  `self-asserted` remains registry-canonical only per registry
  v0.3.3 until that PR lands).

```

### 82. ADR 0039 — entry 6

- Source: `docs/host-capability-substrate/adr/0039-charter-v1-4-0-invariants-18-and-19.md:1073-1076`
- Review reason: `unbound-deferral-cue`
- Exact source payload:

```
- **Promotion-grant entity ADR** (separate; charter inv. 18 uses
  functional vocabulary so the entity-naming ADR does not
  require charter amendment).

```

### 83. ADR 0039 — entry 7

- Source: `docs/host-capability-substrate/adr/0039-charter-v1-4-0-invariants-18-and-19.md:1077-1081`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- **CI implementation** of the new invariants. Boundary-
  enforcement bullets and forbidden-pattern entries are deferred
  per ADR 0024 wave-2 reactive cadence; CI hooks land alongside
  the wave-2 ADR if/when reactive review surfaces gaps.

```

### 84. ADR 0057 — entry 6

- Source: `docs/host-capability-substrate/adr/0057-ring-1-mint-audit-service.md:419-421`
- Review reason: `unbound-deferral-cue`
- Exact source payload:

```
- Human-in-the-loop approval flows beyond programmatic record minting;
  dashboard signal consumption and dashboard-initiated producers are
  future work.
```

### 85. ADR 0058 — entry 1

- Source: `docs/host-capability-substrate/adr/0058-depth-overflow-reason-kind-promotion.md:321-321`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- schema source edits in `packages/schemas/src/entities/decision.ts`;
```

### 86. ADR 0058 — entry 5

- Source: `docs/host-capability-substrate/adr/0058-depth-overflow-reason-kind-promotion.md:325-325`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- edits to ADR 0057 or ADR 0056;
```

### 87. ADR 0059 — entry 1

- Source: `docs/host-capability-substrate/adr/0059-agentclient-canonical-hash-amendment.md:347-348`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Edits to ADR 0037. This is an amendment that cites the foundational
  AgentClient ADR, not a replacement.
```

### 88. ADR 0059 — entry 3

- Source: `docs/host-capability-substrate/adr/0059-agentclient-canonical-hash-amendment.md:350-351`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- HCS source schema edits in this commit. `agent-client.ts` changes land
  only in the follow-up schema PR per `.agents/skills/hcs-schema-change`.
```

### 89. ADR 0059 — entry 6

- Source: `docs/host-capability-substrate/adr/0059-agentclient-canonical-hash-amendment.md:355-355`
- Review reason: `invalid-path-target`
- Exact source payload:

```
- `policies/generated-snapshot/` changes.
```

### 90. ADR 0059 — entry 7

- Source: `docs/host-capability-substrate/adr/0059-agentclient-canonical-hash-amendment.md:356-357`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Snapshot refresh or generated-snapshot rebinding. ADR 0059 does not
  change the D-051 snapshot-binding posture.
```

### 91. ADR 0059 — entry 9

- Source: `docs/host-capability-substrate/adr/0059-agentclient-canonical-hash-amendment.md:359-360`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- New AgentClient producers. The producer allowlist remains ADR 0037 and
  ADR 0057 scoped.
```

### 92. ADR 0059 — entry 13

- Source: `docs/host-capability-substrate/adr/0059-agentclient-canonical-hash-amendment.md:365-367`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Changes to ADR 0037 cross-workspace AgentClient reuse rejection or ADR
  0019 cross-context substitution defaults.

```

### 93. ADR 0060 — entry 1

- Source: `docs/host-capability-substrate/adr/0060-policy-rule-ring-0-entity.md:426-436`
- Review reason: `paragraph-form-regular-entry`, `unbound-candidate`
- Exact source payload:

```
This ADR does not authorize: Zod source / generated JSON Schema / tests /
ontology-registry edits (the schema PR after acceptance); the `Decision` schema
amendment (its own ADR, named as a dependency in §Decision attribution); any
live-policy byte change including the `policy_rule_schema_version` flip
(system-config + operator lane; coordinated byte-identical re-vendor); edits to
`policies/generated-snapshot/` or the binding; Ring-1 gateway/policy-resolution or
the §Provenance-verification implementation (Ring-1, gated by charter inv. 7);
making PolicyRule a mint entity or adding it to ADR 0057 scope; the
`operation_class → tier` / `tier → approval` mappings (live-policy content); and
the other ten remaining M1 entities (Capability and CommandShape follow as their
own ADRs).
```

### 94. ADR 0061 — entry 1

- Source: `docs/host-capability-substrate/adr/0061-decision-rule-attribution-amendment.md:289-289`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- schema source edits in `packages/schemas/src/entities/decision.ts`;
```

### 95. ADR 0061 — entry 5

- Source: `docs/host-capability-substrate/adr/0061-decision-rule-attribution-amendment.md:293-293`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- edits to ADR 0060, ADR 0049, ADR 0056, ADR 0057, or ADR 0058;
```

### 96. ADR 0062 — entry 1

- Source: `docs/host-capability-substrate/adr/0062-capability-ring-0-entity.md:305-305`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- schema source edits in `packages/schemas/src/entities/capability.ts`;
```

### 97. ADR 0062 — entry 10

- Source: `docs/host-capability-substrate/adr/0062-capability-ring-0-entity.md:315-316`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- adding `Capability` to the ADR 0057 mint scope.

```

### 98. ADR 0063 — entry 1

- Source: `docs/host-capability-substrate/adr/0063-command-shape-ring-0-entity.md:332-332`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- schema source edits in `packages/schemas/src/entities/command-shape.ts`;
```

### 99. ADR 0063 — entry 10

- Source: `docs/host-capability-substrate/adr/0063-command-shape-ring-0-entity.md:342-343`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- adding `CommandShape` to the ADR 0057 mint scope.

```

### 100. ADR 0064 — entry 5

- Source: `docs/host-capability-substrate/adr/0064-ring-1-mint-audit-service-contracts.md:483-484`
- Review reason: `unbound-deferral-cue`
- Exact source payload:

```
- HCS Ring 0 schema source edits or generated JSON Schema changes
  (a follow-on schema PR lands any contract Zod types named here).
```

### 101. ADR 0064 — entry 7

- Source: `docs/host-capability-substrate/adr/0064-ring-1-mint-audit-service-contracts.md:488-488`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Edits to ADR 0057, 0058, 0059, 0061, or ADRs 0049-0055.
```

### 102. ADR 0065 — entry 1

- Source: `docs/host-capability-substrate/adr/0065-secret-reference-ring-0-entity.md:347-348`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Zod source, generated JSON Schema, tests, or ontology/registry edits
  (the schema PR per `.agents/skills/hcs-schema-change` follows).
```

### 103. ADR 0065 — entry 2

- Source: `docs/host-capability-substrate/adr/0065-secret-reference-ring-0-entity.md:349-350`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Edits to ADR 0063 (CommandShape), ADR 0018 (CredentialSource), ADR 0043,
  or any other ADR.
```

### 104. ADR 0066 — entry 1

- Source: `docs/host-capability-substrate/adr/0066-host-profile-ring-0-entity.md:288-289`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Zod source, generated JSON Schema, tests, or ontology/registry edits (the
  schema PR per `.agents/skills/hcs-schema-change` follows).
```

### 105. ADR 0066 — entry 2

- Source: `docs/host-capability-substrate/adr/0066-host-profile-ring-0-entity.md:290-290`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Edits to ADR 0032 (RunnerHostObservation) or any other ADR.
```

### 106. ADR 0067 — entry 1

- Source: `docs/host-capability-substrate/adr/0067-tool-provider-ring-0-entity.md:281-282`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Zod source, generated JSON Schema, tests, or ontology/registry edits (the
  schema PR per `.agents/skills/hcs-schema-change` follows).
```

### 107. ADR 0067 — entry 2

- Source: `docs/host-capability-substrate/adr/0067-tool-provider-ring-0-entity.md:283-283`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Edits to ADR 0034 (ToolProvenance) or any other ADR.
```

### 108. ADR 0068 — entry 1

- Source: `docs/host-capability-substrate/adr/0068-tool-installation-ring-0-entity.md:284-285`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Zod source, generated JSON Schema, tests, or ontology/registry edits (the
  schema PR per `.agents/skills/hcs-schema-change` follows).
```

### 109. ADR 0068 — entry 2

- Source: `docs/host-capability-substrate/adr/0068-tool-installation-ring-0-entity.md:286-287`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Edits to ADR 0034 (`ToolProvenance`), ADR 0067 (`ToolProvider`), or any other
  ADR; any `evidenceSubjectKindSchema` or `Evidence.schema_version` change.
```

### 110. ADR 0069 — entry 1

- Source: `docs/host-capability-substrate/adr/0069-resolved-tool-ring-0-entity.md:283-284`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Zod source, generated JSON Schema, tests, or ontology/registry edits (the schema
  PR per `.agents/skills/hcs-schema-change` follows).
```

### 111. ADR 0069 — entry 2

- Source: `docs/host-capability-substrate/adr/0069-resolved-tool-ring-0-entity.md:285-288`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Edits to ADR 0068 (`ToolInstallation`), ADR 0067 (`ToolProvider`), ADR 0034
  (`ToolProvenance`), ADR 0031 (`ExecutionContext`), ADR 0050 (`WorkspaceContext`),
  or any other ADR; any `evidenceSubjectKindSchema` / `Evidence.schema_version`
  change.
```

### 112. ADR 0070 — entry 1

- Source: `docs/host-capability-substrate/adr/0070-artifact-ring-0-entity.md:257-258`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Zod source, generated JSON Schema, tests, or ontology/registry edits (the schema
  PR per `.agents/skills/hcs-schema-change` follows).
```

### 113. ADR 0070 — entry 2

- Source: `docs/host-capability-substrate/adr/0070-artifact-ring-0-entity.md:259-260`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Edits to ADR 0053 (`Run`) or any other ADR; any `evidenceSubjectKindSchema` /
  `Evidence.schema_version` change.
```

### 114. ADR 0071 — entry 1

- Source: `docs/host-capability-substrate/adr/0071-lock-ring-0-entity.md:238-239`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Zod source, generated JSON Schema, tests, or ontology/registry edits (the schema
  PR per `.agents/skills/hcs-schema-change` follows).
```

### 115. ADR 0071 — entry 2

- Source: `docs/host-capability-substrate/adr/0071-lock-ring-0-entity.md:240-241`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Edits to ADR 0052 (`Lease`), ADR 0055 (`Session`), or any other ADR; any
  `evidenceSubjectKindSchema` / `Evidence.schema_version` change.
```

### 116. ADR 0072 — entry 1

- Source: `docs/host-capability-substrate/adr/0072-resource-budget-ring-0-entity.md:247-248`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Zod source, generated JSON Schema, tests, or ontology/registry edits (the schema
  PR per `.agents/skills/hcs-schema-change` follows).
```

### 117. ADR 0072 — entry 2

- Source: `docs/host-capability-substrate/adr/0072-resource-budget-ring-0-entity.md:249-250`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Edits to ADR 0045 (`ResourceBudgetObservation`), ADR 0055 (`Session`), or any
  other ADR; any `evidenceSubjectKindSchema` / `Evidence.schema_version` change.
```

### 118. ADR 0076 — entry 1

- Source: `docs/host-capability-substrate/adr/0076-model-ring-0-entity.md:370-371`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Zod source, generated JSON Schema, tests, or ontology/registry edits (the schema PR per
  `.agents/skills/hcs-schema-change` follows acceptance).
```

### 119. ADR 0076 — entry 5

- Source: `docs/host-capability-substrate/adr/0076-model-ring-0-entity.md:378-380`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Live policy, `tiers.yaml`, generated-snapshot, system-config, or `AGENTS.md`
  baseline-authority edits.

```

### 120. ADR 0077 — entry 1

- Source: `docs/host-capability-substrate/adr/0077-audit-events-storage.md:312-319`
- Review reason: `paragraph-form-regular-entry`, `unbound-candidate`
- Exact source payload:

```
This ADR explicitly does not authorize: Ring-1 implementation code, SQLite DDL/migration,
a runtime, or an endpoint; the `AuditEvent` Zod (ADR 0064's schema PR); retention/GC,
archival/rotation, or a storage-corruption reason-kind family; the external
untrusted-testimony table; the dashboard/integrity-verifier/broker/gateway behaviors; any
Ring-0 schema or generated JSON Schema change; live-policy / `tiers.yaml` /
generated-snapshot / system-config edits; edits to ADR 0057, 0058, 0059, 0061, or 0064;
new producers (the allowlist stays the registry `Kernel-trusted producer allowlist final
state`).
```

### 121. ADR 0078 — entry 1

- Source: `docs/host-capability-substrate/adr/0078-agentclient-session-model-attribution-amendment.md:363-364`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Zod source, generated JSON Schema, tests, or ontology/registry edits (the
  schema PR per `.agents/skills/hcs-schema-change` follows acceptance).
```

### 122. ADR 0078 — entry 2

- Source: `docs/host-capability-substrate/adr/0078-agentclient-session-model-attribution-amendment.md:365-367`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Any change to the `Decision.model_ref` / `Run.invoker_model_ref` fields,
  the `Model` entity, or the `model` Evidence subject kind (ADR 0076,
  unchanged).
```

### 123. ADR 0078 — entry 3

- Source: `docs/host-capability-substrate/adr/0078-agentclient-session-model-attribution-amendment.md:368-369`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Any change to the ADR 0059 canonical field order or GENESIS rule beyond the
  one additive `describe` sentence noting `model_ref` is excluded.
```

### 124. ADR 0078 — entry 5

- Source: `docs/host-capability-substrate/adr/0078-agentclient-session-model-attribution-amendment.md:372-374`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Any retracted/floor model guard, `reason_kind` for model rejections, live
  policy, `tiers.yaml`, generated-snapshot, system-config, or `AGENTS.md`
  baseline-authority edits.
```

### 125. ADR 0078 — entry 6

- Source: `docs/host-capability-substrate/adr/0078-agentclient-session-model-attribution-amendment.md:375-377`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- Model-card attributes, `AliasResolution`, the eval results-ledger, or
  `region_prefix` (unchanged ADR 0076 deferrals).

```

### 126. ADR 0079 — entry 1

- Source: `docs/host-capability-substrate/adr/0079-ring-1-policy-rule-loader.md:108-113`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- **Provenance or digest verification of any kind.** The loader computes a
  digest of the bytes it read and records it as an *observation*; it performs no
  comparison against `snapshot-binding.json` and makes no authority claim.
  `scripts/ci/snapshot-binding-check.sh` remains the binding gate.
  Implementing ADR 0060 §Provenance verification requires the gateway ADR that
  ADR 0060 defers to, and remains gated by charter inv. 7.
```

### 127. ADR 0079 — entry 2

- Source: `docs/host-capability-substrate/adr/0079-ring-1-policy-rule-loader.md:114-118`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Retiring `scripts/ci/policy-snapshot-compat-check.rb` or
  `policy-rule-zod-check.ts`. With provenance out of scope, the loader and the
  Ruby lane answer **disjoint** questions — binding integrity versus rule shape
  — so there is no inv-1 duplication surface and no parity obligation between
  them. Any future retirement is its own decision and must demonstrate parity.
```

### 128. ADR 0080 — entry 2

- Source: `docs/host-capability-substrate/adr/0080-read-only-cli-adapter-surface.md:85-86`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- MCP tools, HTTP endpoints, or the dashboard. ADR 0003 governs transports;
  those surfaces need their own ADRs.
```

### 129. ADR 0080 — entry 3

- Source: `docs/host-capability-substrate/adr/0080-read-only-cli-adapter-surface.md:87-89`
- Review reason: `unbound-candidate`
- Exact source payload:

```
- `hcs audit verify` or any audit-adjacent verb. The audit store does not exist,
  and ADR 0077 §5 makes its chain-walk a kernel write path — a "read-only" verb
  that induces a kernel write is not read-only.
```

### 130. ADR 0080 — entry 4

- Source: `docs/host-capability-substrate/adr/0080-read-only-cli-adapter-surface.md:90-92`
- Review reason: `unbound-candidate`, `unbound-deferral-cue`
- Exact source payload:

```
- Gateway re-derivation, `Decision` construction, capability registration, tool
  resolution, or host state. ADR 0057 §Out of scope defers all of these to ADRs
  that do not exist.
```

### 131. ADR 0080 — entry 5

- Source: `docs/host-capability-substrate/adr/0080-read-only-cli-adapter-surface.md:93-95`
- Review reason: `unbound-deferral-cue`
- Exact source payload:

```
- Installing `hcs` onto `PATH`. The verb is invoked through `just cli` in this
  ADR's scope; a PATH install is a host-surface change with its own posture
  questions.
```

### 132. ADR 0081 — entry 2

- Source: `docs/host-capability-substrate/adr/0081-generated-adr-deferral-index.md:425-426`
- Review reason: `unbound-deferral-cue`
- Exact source payload:

```
- Parsing `Future amendments`, `Consequences`, `References`, decision-ledger
  prose, or arbitrary mentions of future work as regular deferral entries.
```

## Review required: irregular forms

### 1. ADR 0024 — irregular item 1

- Source: `docs/host-capability-substrate/adr/0024-charter-v1-3-wave-2-and-3.md:141-154`
- Form: `irregular heading`
- Exact source payload:

```
### Out of scope for this ADR

This ADR does not authorize:

- New invariants (charter v1.4.0+ requires a separate ADR per the change
  policy).
- Schema, kernel, adapter, dashboard, runtime probe, mutation operation, or
  policy-tier work landing in the same PRs as the charter changes.
- Any retroactive change to the text of invariants 16 or 17 (those were
  accepted under ADR 0021).
- Domain-payload schemas for boundary dimensions (Q-007 work).
- The CI plumbing that implements the boundary-enforcement bullets — that
  lands in separate kernel/CI PRs once the supporting schema exists.

```

### 2. ADR 0034 — irregular item 1

- Source: `docs/host-capability-substrate/adr/0034-q-007-b-f-boundary-evidence-composition-quality-gate-posture.md:327-330`
- Form: `legacy bold lead-in`
- Exact source payload:

```
**Out-of-scope for this ADR:** QualityGate field shape,
gate_kind enum values, gate_state lifecycle, gate-consuming
operation classes, ApprovalGrant.scope per-class extension for
QualityGate operations.
```

### 3. ADR 0038 — irregular item 1

- Source: `docs/host-capability-substrate/adr/0038-phase-2-schema-landing-sequence.md:558-561`
- Form: `legacy bold lead-in`
- Exact source payload:

```
**Out of scope for ADR 0038:** Specific YAML contents — those are
authored in `system-config` per its own change-management process.
ADR 0038 sequences only the dependency between this repo's
schema/registry state and `system-config`'s policy authoring.
```

### 4. ADR 0039 — irregular item 1

- Source: `docs/host-capability-substrate/adr/0039-charter-v1-4-0-invariants-18-and-19.md:783-838`
- Form: `irregular heading`
- Exact source payload:

```
### Non-charter changes deferred

- **Boundary-enforcement bullets** (e.g., "Every QualityGate's
  `evidence_refs` graph rejects KnowledgeChunk references at the
  typed-grant minting layer"; "Every BoundaryObservation Zod
  schema enforces non-null `valid_until` and at least one
  execution-context binding") — deferred to v1.4.x wave-2 ADR
  after Phase 2.1.4 / Phase 2.2.3 schema enforcement lands.
  Adding bullets here would assert about Zod schemas that do not
  yet exist, repeating the wave-1 defect that ADR 0024 wave-2
  closed.

- **Forbidden-pattern entries** (e.g., "Promoting an aggregation
  whose `derived_from` graph contains a KnowledgeChunk
  reference"; "Emitting a BoundaryObservation envelope without
  `valid_until`"; "Claiming kernel-set execution-context binding
  fields with producer-supplied values") — same deferral; they
  belong in the v1.4.x wave-2 ADR alongside the operationalizing
  schema / policy lint.

- **Canonical policy YAML** — per-`gate_kind` evidence-rotation
  materiality rules + per-(producer, target_subject_ref,
  gate_kind) denial-rate ceilings (inv. 18, per ADR 0035 v2
  §Acceptance note tweak 2); per-`boundary_dimension` `valid_until`
  maximum windows + workspace_verify operation_class composition
  thresholds (inv. 19) — all in `system-config/policies/host-
  capability-substrate/` at Phase 2.5 per ADR 0038.

- **`evidenceAuthoritySchema` enum extension** to add the
  `self-asserted` value referenced by inv. 18 — separate
  schema-change PR per `.agents/skills/hcs-schema-change`; until
  it lands, `self-asserted` is registry-canonical only per
  registry v0.3.3 §Authority discipline.

- **Envelope-level `valid_until` field** on
  `boundaryObservationSchema` and related Evidence subtype
  envelopes — Phase 2.2.3 schema PR; tightens base
  `Evidence.valid_until`'s `nullable()` shape for the envelope
  subset.

- **Promotion-grant entity ADR** to commit a name for the typed
  grant authorizing `allowed_for_gate` transitions (candidate
  names: PromotionGrant, CoordinationGrant, VerificationGrant
  per ADR 0019 v3 §Promotion workflow shape). Inv. 18 uses
  functional vocabulary so this ADR can land without charter
  amendment.

- **Regression-trap fixtures** for inv. 18 + inv. 19 +
  composition cases — Phase 2.6 trap-fixture PR per ADR 0038.
  v1 review surfaced ~31 candidate trap cases across the four
  reviewers (Sec 1-9; Pol 1-18; Ont 1-4); v2 charter-committed
  semantic expansions add additional surfaces (closed
  `derived_from` membership rejection; kernel-set binding-field
  forgery rejection; payload-level freshness escape rejection;
  authority-floor-not-ceiling future-surface coverage).

```

### 5. ADR 0043 — irregular item 1

- Source: `docs/host-capability-substrate/adr/0043-q-013-credential-plane-implementation.md:314-332`
- Form: `irregular heading`
- Exact source payload:

```
## Deferred follow-on candidates

ADR 0043 v1 does not accept these records:

- `CredentialRuntimeInjectionReceipt`. A future ADR may propose it only with
  mandatory kernel-set or kernel-resolved attribution (`agent_client_id`,
  `session_id`, and principal identity, or explicit typed unknown/absence
  reason), invocation evidence or typed absence reason, `execution_context_id`,
  `credential_source_id`, names-only environment binding, `SecretReference`
  usage, non-null freshness, and no environment dumps or shell-history content.
- `CredentialReconcilerReceipt`. A future ADR may propose plan/drift-check
  receipts. Reconciler `apply` evidence requires a separate accepted provider
  mutation / credential issuance / provider-audit receipt path with approval
  and audit linkage; reviewer objections may block ADR 0043 or require a
  follow-on ADR, but they cannot expand this slice into provider-mutation
  receipt territory.
- `RemoteMutationReceipt` and `CredentialIssuanceReceipt`. These remain
  separate ADR 0015 follow-on work and are not accepted by implication.

```

### 6. ADR 0044 — irregular item 1

- Source: `docs/host-capability-substrate/adr/0044-q-014-project-substrate-implementation.md:445-464`
- Form: `irregular heading`
- Exact source payload:

```
## Deferred follow-on candidates

This ADR does not accept these records, enum values, or behaviors:

- `QualityGate.gate_kind: "project_substrate_admission"`. ADR 0041 keeps this
  as a future candidate, but v1 schema work stops at evidence production.
  Gate-kind implementation needs a separate policy/gate ADR or amendment that
  defines target refs, evidence_refs, freshness windows, and denial semantics.
- A standalone `ProjectSubstrateContract` entity. Reopen only if HCS needs
  durable contract lifecycle beyond source snapshot plus evidence.
- `SelectedRepositoryAccessObservation` and `WorkflowPolicyCheckReceipt`.
  These remain Q-005/Q-006 follow-on work if existing runner/check/source
  evidence is insufficient.
- Q-015 backup-readiness entities and receipts, including
  `StorageClassReadiness`, `RestoreDrillReceipt`,
  `BackupCredentialCustody`, and `ProjectSubstrateBackupRequirement`.
- Runtime validators, live policy evaluation, dashboard routes, adapters,
  hooks, runner registration, project provisioning, provider mutation, and
  teardown execution.

```

### 7. ADR 0045 — irregular item 1

- Source: `docs/host-capability-substrate/adr/0045-q-015-backup-readiness-implementation.md:412-430`
- Form: `irregular heading`
- Exact source payload:

```
## Deferred follow-on candidates

This ADR does not accept these records, enum values, or behaviors:

- `QualityGate.gate_kind: "backup_readiness"`. Gate-kind implementation needs
  a separate policy/gate ADR or policy lane defining target refs, evidence
  refs, freshness windows, denial semantics, and composition with
  `project_substrate_admission`.
- `boundary_dimension: "backup_readiness"`. Reopen only if direct evidence
  observations cannot represent storage-class readiness without duplicating
  fact homes.
- A standalone `StorageClassReadiness` entity. Reopen only if HCS needs
  durable lifecycle beyond freshness-bound observations.
- Standalone `BackupLayerThreatModel` or `BackupMonitoringRequirement`
  entities. V1 uses `KnowledgeSource` refs and typed evidence refs instead.
- Backup execution receipts, restore execution operations, provider mutation
  receipts, runtime validators, dashboard routes, adapters, hooks, broker
  behavior, project provisioning, and canonical policy YAML.

```

### 8. ADR 0046 — irregular item 1

- Source: `docs/host-capability-substrate/adr/0046-github-org-migration.md:166-183`
- Form: `irregular heading`
- Exact source payload:

```
### Cross-scope follow-ups (not authorized by this ADR)

- The master ADR at
  `~/Organizations/jefahnierocks/system-config/docs/host-capability-substrate/0001-repo-boundary-decision.md`
  must be updated in a `system-config` session to reflect the new slug.
- `README.md:13` link to `system-config` will need updating once the sibling
  repo completes its own GitHub-org migration. That edit is in this
  repo's scope but waits on the upstream move so the link does not point
  through a redirect chain.
- Branch-protection / ruleset bypass-actor allowlists, authorized-pusher
  lists, and authorized review-dismisser lists must be re-populated against
  `jefahnierocks` org membership on the GitHub side after the transfer.
  This is provider-side mutation; per charter v1.4.0 inv. 16
  (external-control-plane evidence-first) and the substrate-scope/
  provider-scope split codified in the 2026-05-08 project-secrets directive
  §Naming Model, HCS does not execute provider-side allowlist mutation from
  this substrate.

```

### 9. ADR 0051 — irregular item 1

- Source: `docs/host-capability-substrate/adr/0051-approval-grant-ring-0-entity.md:54-54`
- Form: `legacy bold lead-in`
- Exact source payload:

```
**Out-of-scope for v1 (deferred to future `kernel_dashboard` producer ADR)**: pre-emptive grants. v1 requires `minted_for_decision_id` non-null at the schema layer. Pre-emptive grant infrastructure lands together with the future `kernel_dashboard` producer ADR as a coordinated change-set.
```

### 10. ADR 0052 — irregular item 1

- Source: `docs/host-capability-substrate/adr/0052-lease-ring-0-entity.md:52-52`
- Form: `legacy bold lead-in`
- Exact source payload:

```
**Out-of-scope for v1 (deferred to future schema PRs per the registered §Procedure rule)**: `lease_kind` enum extensions (`credential_audience`, `external_target`). ADR 0031 v1 §Out of scope reserves these as registry-canonical lease_kinds requiring ontology-controlled vocabulary updates. v1 Zod enum is `['worktree']` only; future schema PRs add new lease_kinds following the §Procedure rule (mirrors ADR 0049 Zod-defined-vs-registry-canonical pattern). v1 `scope` discriminated union has only the `worktree` branch.
```

### 11. ADR 0052 — irregular item 2

- Source: `docs/host-capability-substrate/adr/0052-lease-ring-0-entity.md:54-54`
- Form: `legacy bold lead-in`
- Exact source payload:

```
**Out-of-scope for v1 (deferred to future coordinated change-set)**: `worktree_lease_force_break_acknowledgment` grant_kind extension. This grant_kind is Phase 1 interim posture human-dashboard-only per ADR 0031 v1; the producer for it is `kernel_dashboard`, which is itself deferred per ADR 0051 v4 scope discipline. Both land together as a coordinated future-ADR change-set (the `kernel_dashboard` producer ADR adds: producer allowlist extension + pre-emptive grant infrastructure from ADR 0051 v4 §Future amendments + `worktree_lease_force_break_acknowledgment` grant_kind).
```

### 12. ADR 0053 — irregular item 1

- Source: `docs/host-capability-substrate/adr/0053-run-ring-0-entity.md:56-56`
- Form: `legacy bold lead-in`
- Exact source payload:

```
**Out-of-scope for v1 (deferred to future schema PRs per the registered §Procedure rule)**: `run_kind` enum extensions. v1 Zod enum is `['operation_execution']` only; future schema PRs add new run_kinds (e.g., `'system_task'` for kernel-initiated background work, `'diagnostic'` for non-execution diagnostic operations) following the §Procedure rule. Continuation of the ADR 0049 (15-Zod-defined-out-of-35+-registered) + ADR 0051 v4 (3-Zod-defined grant_kind) + ADR 0052 (1-Zod-defined lease_kind) pattern.
```

### 13. ADR 0054 — irregular item 1

- Source: `docs/host-capability-substrate/adr/0054-principal-ring-0-entity.md:264-288`
- Form: `legacy bold lead-in`
- Exact source payload:

```
**Out of scope for v1 (deferred to future ADRs):**

- **Detailed identity-binding resolution rules** (per ADR 0036 §Future
  amendments future Q-row). This ADR commits the typed envelope + the v1
  `principal_kind` discriminator; the rules for *how* `kernel_principal_
  resolver` resolves identity from `GitIdentityBinding`, `MachineIdentity
  BindingObservation`, or future binding evidence subtypes land in
  a future Q-row + Phase 2.5 canonical policy YAML.
- **`pseudo_principal` and other registry-canonical principal_kind
  reservations**. ADR 0036 §Sub-decision (d) anticipates cycle-history.md
  ratification verifier-identity bindings that may need a pseudo_principal
  kind once the future Q-row commits the synthesis rule. v1 reserves
  `pseudo_principal` and `system_principal` as registry-canonical pending
  future schema PRs per the registered §Procedure rule.
- **Cross-record self-approval rejection enforcement** (Ring 1 mint API
  per ADR 0051 v4 §Rejects §Self-approval rejection). v1 commits the
  typed envelope; Ring 1 mint API enforces the comparison.
- **Cross-record binding-evidence verification** (Ring 1 mint API). v1
  schema layer permits `evidence_refs` citing any evidence subtype; Ring
  1 verifies the binding evidence is appropriate for the asserted
  `principal_kind` (e.g., `human` Principal records require `Git
  IdentityBinding` evidence; `service_principal` records require
  `MachineIdentityBindingObservation` evidence). The §Procedure rule for
  new principal_kind values commits this verification responsibility.

```

### 14. ADR 0054 — irregular item 2

- Source: `docs/host-capability-substrate/adr/0054-principal-ring-0-entity.md:491-544`
- Form: `irregular heading`
- Exact source payload:

```
### Cross-record commitments deferred to Ring 1 mint API

The following rules are committed by the Principal entity but enforced
at Ring 1 mint API per registry §Cross-context enforcement layer §Schema
validation alone is not an enforcement layer:

1. **Binding-evidence verification** — `evidence_refs` must contain at
   least one binding evidence record appropriate for the asserted
   `principal_kind`:
   - `human` → `GitIdentityBinding` (signed-commit-author binding per
     ADR 0036 §Sub-decision (d) future Q-row); future Q-row commits
     additional human-binding-evidence types
   - `service_principal` → `MachineIdentityBindingObservation` (per ADR
     0043 §MachineIdentityBindingObservation)
   - Future principal_kinds (registry-canonical) commit their own
     binding-evidence-source rule via the §Procedure rule.
2. **Synthetic-identity rejection** — Principal records with binding
   evidence that lacks Ring 1 mint API verification (e.g., self-asserted
   commit author with no signature; producer-supplied machine identity
   without provider verification) reject at mint per ADR 0019 v3
   §Chain-promotion rule + ADR 0036 §Layer 1 grounding requirement.
3. **Self-approval rejection (closes ADR 0051 v4 typed-FK posture
   commitment)** — when this ADR lands as Ring 0 schema source,
   `ApprovalGrant.grantor_principal_ref` retains the
   `entityIdSchema` field shape (NO schema shape change; both pre-
   and post-typed-FK are `entityIdSchema`) but gains a typed-Ring-0
   FK target (Principal). The comparison rule per ADR 0051 v4 §Rejects
   §Self-approval rejection becomes:
   - **UUID-byte-equality** comparison (mirrors ADR 0052 §Identity
     comparison form for session_id), eliminating the runtime
     Unicode-canonicalization-aware string-comparison surface
   - **Zero-width-character evasion structurally closed** (per ADR
     0051 v4 MT-Sec-2): FK-equality on principal_id surface IDs cannot
     be evaded by U+200B / U+200C / U+200D / U+FEFF / U+00AD or any
     other Unicode general-category `Cf` (Format) character injection;
     the surface IDs are themselves canonicalized at Principal mint by
     `kernel_principal_resolver` via the 4-step recipe specified in
     §Compliance §Principal-id canonicalization rule (NFC + `Cf`-strip
     + lowercase fold + whitespace trim). The `Cf`-strip step closes
     the invisibles surface that ADR 0051 v4 MT-Sec-2 acknowledged as
     a v1 posture limitation.
   - The canonicalization rule **survives as a normalization step on
     the principal_id surface IDs** at Principal mint time; the
     comparison itself is byte-equality on already-canonicalized IDs.
   - **Confusable-substitution defense (Unicode TR39 skeleton
     normalization or ASCII-only restriction)** is NOT included at v2;
     reserved as future amendment. ASCII-vs-Cyrillic homoglyph attacks
     remain a posture limitation until that future ADR lands.
4. **`requesting_principal_id` typed-FK closure (ADR 0025 / ADR 0036)**
   — gateway-set `requesting_principal_id` fields gain a typed Ring 0
   target. ADR 0025 §Branch deletion proof line 149 and ADR 0036 §Sub-
   decision (d) line 771+ both reference `principal_id` which now
   resolves to this entity.

```

### 15. ADR 0055 — irregular item 1

- Source: `docs/host-capability-substrate/adr/0055-session-ring-0-entity.md:241-272`
- Form: `legacy bold lead-in`
- Exact source payload:

```
**Out of scope for v1 (deferred to future ADRs)**:

- **Detailed session-kind taxonomy beyond `agent_invocation`**.
  Future kinds (`dashboard` for human-driven dashboard sessions paired
  with the future `kernel_dashboard` producer; `system_task` for
  kernel-initiated background sessions paired with `system_principal`
  per ADR 0054 §Future amendments) remain registry-canonical
  reservations pending future schema PRs via the registered §Procedure
  rule.
- **Session-lifecycle state set extensions**. v1 commits the 2-state
  `active | ended` set mirroring AgentClient + WorkspaceContext +
  Principal. Future ADRs may add `terminated` (kernel-forced close),
  `crashed` (abnormal exit), or other states per operational evidence.
- **Session-level `valid_until` freshness ceiling**. v1 commits
  `started_at` + nullable `ended_at` (mirrors Run.started_at +
  Run.ended_at) but does NOT add a `valid_until` ceiling at the
  entity layer. Per-operation freshness binding lives on the
  consuming entity (Lease.valid_until, ApprovalGrant.valid_until,
  Decision.valid_until); Session is the long-lived holder. Future
  ADRs may add a session-level freshness ceiling if operational
  evidence shows it.
- **Cross-record FK liveness verification** (Principal/AgentClient/
  ExecutionContext FK targets active at Session mint time;
  Principal/AgentClient/ExecutionContext FK targets active at the
  time of consuming records' citations) — Ring 1 mint API
  responsibility per registry §Cross-context enforcement layer.
- **Cross-record cross-context-binding verification** (Layer 1 mint
  API enforces `WorkspaceContext.execution_context_id == Session.
  execution_context_id` per ADR 0031 v1; `Run.execution_context_id
  == invoker_session.execution_context_id` per ADR 0053; etc.) —
  Ring 1 responsibility.

```

### 16. ADR 0055 — irregular item 2

- Source: `docs/host-capability-substrate/adr/0055-session-ring-0-entity.md:492-524`
- Form: `irregular heading`
- Exact source payload:

```
### Cross-record commitments deferred to Ring 1 mint API

The following rules are committed by the Session entity but enforced at
Ring 1 mint API per registry §Cross-context enforcement layer §Schema
validation alone is not an enforcement layer:

1. **FK liveness verification at Session mint**: `agent_client_id`,
   `principal_id`, and `execution_context_id` must all resolve to
   active records at Session mint time. Rejection emits typed
   `Decision.reason_kind` reservations (new at this ADR — see §Accepts).
2. **Cross-context binding equality enforcement (consuming-side)**:
   when Lease acquires / Run creates / ApprovalGrant consumes, Layer
   1 mint API checks the consuming record's `execution_context_id`
   matches `Session.execution_context_id`. The Session is the
   authoritative source of the requesting/invoking/consuming
   execution-context binding. Rejections already reserved:
   `worktree_not_in_workspace_context` (per ADR 0052),
   `run_invoker_session_mismatch` (per ADR 0053), and the self-approval
   rejection rule (per ADR 0051 v4 + ADR 0054).
3. **Holder-only release UUID-byte-equality comparison (ADR 0052
   §Decision §Holder-only release)** — the "requesting session"
   becomes a typed Ring 0 FK target; comparison form remains UUID-
   byte-equality per ADR 0052 §Identity comparison form.
4. **Self-approval rejection FK consumption (ADR 0051 v4 + ADR 0054
   §Self-approval rejection rule)** — the consuming session's
   `principal_id` is the typed Principal FK; comparison is UUID-byte-
   equality on already-canonicalized principal_id surface IDs
   (canonicalized at Principal mint per ADR 0054 4-step recipe).
5. **Session-mint-time agent_client liveness**: the
   `agent_client_id` FK target must be an active AgentClient at Session
   mint. Future system_task session_kind may relax this if a typed
   `system_principal` Zod-defined extension lands per ADR 0054.

```
