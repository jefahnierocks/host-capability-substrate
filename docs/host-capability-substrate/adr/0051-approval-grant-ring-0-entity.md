---
adr_number: 0051
title: ApprovalGrant Ring 0 entity introduction
status: proposed
date: 2026-05-10
charter_version: 1.4.0
tags: [approval-grant, ring-0, milestone-1, foundational-entity, grant-kind, producer-disjointness, charter-v1-4-0, registry-v0-4-13, workflow-sequencing-step-1, adr-0049-mirror]
---

# ADR 0051: `ApprovalGrant` Ring 0 entity introduction

## Status

`proposed`

## Date

2026-05-10

## Charter version

Written against charter v1.4.0 and `docs/host-capability-substrate/ontology-registry.md` v0.4.13.

## Reviews

This ADR introduces a foundational Ring 0 entity that completes the typed-grant minting layer the charter v1.4.0 invariant 18 chain-walk rejection clause references and that D-037 producer-disjointness rule (ADR 0049) requires for ApprovalGrant-side enforcement. Required reviewer dispatch per `IMPLEMENT.md` §Required subagent reviews + ADR 0047 cycle precedent + workflow-sequencing investigation §Step 1 entity #3 estimation ("medium-to-large ADR + medium schema PR, 2 reviewer rounds"):

- `hcs-architect` — mandatory for any ADR
- `hcs-ontology-reviewer` — mandatory; ADR introduces a new Ring 0 entity with a `grant_kind` enum + discriminated `scope` union + producer allowlist + audit-chain integration
- `hcs-policy-reviewer` — mandatory; `ApprovalGrant` records authorize gate-decision overrides; producer-disjointness rule is a policy-enforcement invariant; forbidden-tier non-escalability (charter inv. 6) must be preserved
- `hcs-security-reviewer` — mandatory; `ApprovalGrant` carries audit-chain integrity, principal authorization, and grant-lifecycle revocation; security implications of self-approving chain-mint, grant-replay, and revocation-race are non-trivial

## Context

The 2026-05-10 workflow-sequencing investigation §Step 1 names `ApprovalGrant` as entity #3 of 5 foundational Ring 0 entities (after `Decision` ADR 0049 / D-037 + `WorkspaceContext` ADR 0050 / D-038; before `Lease` and `Run`). `ApprovalGrant` is the typed envelope for the gate-decision-override mechanism that the substrate's existing rules reference but cannot yet enforce structurally:

- **D-037 / ADR 0049 §Accepts** commits a producer-disjointness rule: "a Decision with non-null `required_grant_kind` MUST NOT be co-minted with an ApprovalGrant satisfying that grant kind in the same audit-chain step; the satisfying grant is minted by a separate producer at a later audit-chain link." This ADR commits the corresponding ApprovalGrant-side rule and the structural fields that make it enforceable at Ring 1.
- **Charter v1.4.0 inv. 18** (chain-walk rejection clause): "The typed grant authorizing `allowed_for_gate` transitions is rejected when the candidate's `derived_from` graph (transitively at any depth) contains an unpromoted `DerivedSummary`, an unpromoted `CoordinationFact`, an `Evidence` record with `authority: sandbox-observation` or `authority: self-asserted`, or any `KnowledgeChunk` reference." ApprovalGrant is the typed envelope for those grants.
- **Charter inv. 7** (execute lane discipline): execute lane requires approval grants + audit + dashboard + leases together. ApprovalGrant is the first leg of that stack.
- **Charter inv. 6** (forbidden-tier non-escalable): no ApprovalGrant — regardless of grant_kind — can clear a forbidden-tier denial. This ADR must structurally preserve the rule.
- **Registry §Decision.required_grant_kind reservations**:
  - `gate_evidence_acknowledgment` (ADR 0035 — QualityGate gate-acknowledgment grant)
  - `worktree_clean_acknowledgment` (ADR 0030 — destructive-op worktree-clean acknowledgment)
  - `pr_absence_acknowledgment` (ADR 0030 — PR absence acknowledgment)
- **ADR 0036 `human_dashboard_grant` deletion authority**: `OperationShape.deletion_authority_kind: human_dashboard_grant` references an `ApprovalGrant` via `humanDashboardGrantDeletionAuthorityRefSchema = z.object({ approval_grant_id: entityIdSchema }).strict()`. The FK target is this ADR's entity.
- **ADR 0047 cleanup-plan composition** §Future amendments references the future ApprovalGrant lifecycle for class-I cleanup execution wiring.

Without a Ring 0 `ApprovalGrant` schema:

- The three `required_grant_kind` reservations remain registry-canonical-only
- D-037 producer-disjointness rule has only the Decision-side commitment, not its ApprovalGrant-side mirror
- ADR 0036's `human_dashboard_grant` deletion authority FK target resolves to nothing typed
- M1 acceptance criterion #16 (`ApprovalGrant` in canonical 22-entity list) is unmet
- The execute-lane stack (charter inv. 7) cannot move past Ring 0 entity gaps

The constraint stack: charter v1.4.0 inv. 1 (canonical-typed-evidence), inv. 4 (audit logging internal side effect), inv. 6 (forbidden-tier non-escalable), inv. 7 (execute lane discipline), inv. 8 (no sandbox→stronger), inv. 17 (execution context declared), inv. 18 (derived retrieval is never decision authority), inv. 19 (freshness-bound + execution-context-bound), ADR 0019 v3 §Chain promotion rule, ADR 0029 v2 §Closed-list fail-mode tightening rule, ADR 0049 D-037 producer-disjointness rule.

## Options considered

### Option A — Single `ApprovalGrant` entity with comprehensive scope discriminated-union (all three v1 grant_kinds with full scope shapes)

A Zod entity with `grant_kind` discriminating an exhaustive `scope` union: `gate_evidence_acknowledgment` scope, `worktree_clean_acknowledgment` scope, `pr_absence_acknowledgment` scope. Future ADRs extend both the enum and the union via standard schema-change PRs.

**Pros:**

- Full structural representation of grant semantics
- Each grant_kind has typed scope binding to its specific consumer (QualityGate vs destructive-Git vs PR-absence)

**Cons:**

- Per-grant_kind scope-shape design pulls forward decisions that ADR 0030 / ADR 0035 may not have committed in enough detail
- Large schema PR scope; first-cycle ambition risk (similar to the Decision ADR 0049 v1 risk that surfaced "Option A" rejection)

### Option B — Single `ApprovalGrant` entity with opaque scope (`scope: z.json()`)

A Zod entity with `grant_kind` enum but `scope` as untyped JSON. Future schema PRs add typed per-grant_kind scope refinements.

**Pros:**

- Smallest v1 schema PR
- Defers per-grant_kind scope design to consumer-driven schema PRs

**Cons:**

- Opaque scope is a typing escape hatch that violates charter inv. 1 (canonical-typed-evidence)
- Future ADR 0019 v3 chain-walk rules apply to evidence_refs but not to opaque scope JSON; secrets-leak surface
- Producer can stuff arbitrary content in scope, defeating the substrate's typing posture

### Option C — Single `ApprovalGrant` entity with discriminated `scope` union; v1 lands the three grant_kind reservations + their scope shapes; new §Procedure for adding a new grant_kind rule (mirrors ADR 0048 / ADR 0049 procedural pattern)

Like Option A but with the §Procedure rule explicitly committed for future extensions. v1 scope shapes are committed per the three grant_kinds named in registry §Decision.required_grant_kind reservations from ADR 0030 + ADR 0035, with deferred grant_kinds following the procedure.

**Pros:**

- Mirrors the proven ADR 0048 + ADR 0049 procedural pattern for enum extensions
- Closes the three registered required_grant_kind reservations with typed scope
- Future grant_kind extensions follow the registered procedure (reviewer dispatch, classification, registry update); prevents drift
- Discriminated union enforces grant_kind → scope shape pairing at the schema layer

**Cons:**

- Per-grant_kind scope-shape design must be committed for the three v1 kinds (ADR 0030 and ADR 0035 scope shapes are referenced but not fully committed at the schema layer — this ADR commits them)
- Larger v1 schema PR than Option B but smaller mental model than Option A's monolithic union

## Decision

**Option C.** Single `ApprovalGrant` Ring 0 entity with discriminated `scope` union. v1 lands the three grant_kind reservations (`gate_evidence_acknowledgment`, `worktree_clean_acknowledgment`, `pr_absence_acknowledgment`) with typed scope shapes per ADR 0030 + ADR 0035 references. New §Procedure for adding a new grant_kind value rule registered in registry.

The entity carries:

- `schema_version` — entity-specific literal `'0.1.0'` via `approvalGrantSchemaVersionSchema = z.literal('0.1.0')` (mirrors `evidenceSchemaVersionSchema` / `boundaryObservationSchemaVersionSchema` / `decisionSchemaVersionSchema` co-commitment / `workspaceContextSchemaVersionSchema` co-commitment precedents)
- `approval_grant_id` — `entityIdSchema` (kernel-set)
- `grant_kind` — `approvalGrantKindSchema = z.enum(['gate_evidence_acknowledgment', 'worktree_clean_acknowledgment', 'pr_absence_acknowledgment'])` (kernel-set; closed enum, initial 3 values from registry reservations; extensible per the registered §Procedure)
- `scope` — discriminated union on `grant_kind`:
  - `gate_evidence_acknowledgment`: `{ grant_kind: 'gate_evidence_acknowledgment', target_quality_gate_id: entityIdSchema, acknowledged_evidence_refs: z.array(evidenceRefSchema).min(1) }`
  - `worktree_clean_acknowledgment`: `{ grant_kind: 'worktree_clean_acknowledgment', workspace_context_id: entityIdSchema, acknowledged_dirty_state_evidence_ref: evidenceRefSchema }`
  - `pr_absence_acknowledgment`: `{ grant_kind: 'pr_absence_acknowledgment', repository_id: entityIdSchema, branch_ref: z.string().min(1), acknowledged_pr_absence_evidence_ref: evidenceRefSchema }`
- `minted_for_decision_id` — `entityIdSchema.nullable()` (kernel-set; FK to the Decision record this grant is intended to satisfy; null for grants minted without a specific Decision pre-existing — these are pre-emptive grants that consume at the next compatible Decision)
- `grantor_principal_ref` — `entityIdSchema` (kernel-set; FK to a Principal entity; forward-reference since Principal is entity #5+ in M1 canonical list and not yet built; for v1 `gate_evidence_acknowledgment` + `worktree_clean_acknowledgment` + `pr_absence_acknowledgment` the grantor is typically the agent session's principal, but for ADR 0036 `human_dashboard_grant` deletion-authority FK target the grantor is the human at the dashboard; the typed FK accepts both)
- `granted_by` — `approvalGrantProducerSchema = z.enum(['kernel_broker', 'kernel_dashboard', 'kernel_mint_api'])` (kernel-set; named enum schema for forward-compatible allowlist widening, mirroring `workspaceContextProducerSchema` Option 2 pattern from ADR 0050; the three v1 producers cover dashboard-minted grants (`kernel_dashboard`), broker-mediated grants (`kernel_broker`), and mint-API-internal grants (`kernel_mint_api`). NEW producer `kernel_dashboard` is added to the registry §Kernel-trusted producer allowlist final state by this ADR.
- `granted_at` — `isoDateTimeSchema` (kernel-set)
- `valid_until` — `isoDateTimeSchema` (kernel-set, **non-null per inv. 19**; ApprovalGrants are freshness-bound — gateway re-derive consumes them within their window)
- `execution_context_id` — `entityIdSchema` (kernel-set per inv. 19; ApprovalGrants bind to the execution_context_id of the granting session — for human dashboard grants, this is the dashboard's session)
- `grant_state` — `approvalGrantStateSchema = z.enum(['active', 'consumed', 'expired', 'revoked'])` (kernel-set; mirrors `agentClientStateSchema` / `workspaceContextStateSchema` lifecycle pattern; 'consumed' when the grant has been applied to a Decision override; 'expired' when `valid_until` has elapsed; 'revoked' when explicitly revoked by the grantor before consumption)
- `audit_chain_link_hash` — `sha256DigestSchema` (required, non-empty, sha256-shape-validated; mirrors `decisionSchema.audit_chain_link_hash` and `workspaceContextSchema.audit_chain_link_hash` co-commitments). Hash covers the canonical concatenation of `approval_grant_id || grant_kind || canonical(scope) || (minted_for_decision_id || '') || grantor_principal_ref || granted_by || granted_at || valid_until || execution_context_id || grant_state || canonical(evidence_refs) || prior_audit_chain_link_hash`. The `'' for null` substitution rule is binding posture jointly committed by ADR 0049 + ADR 0050 + this ADR. The `canonical(scope)` and `canonical(evidence_refs)` encodings are deferred to Ring 1 mint API per the workflow-sequencing investigation §Step 4. `schema_version` is intentionally excluded from the canonical concatenation per ADR 0049 + ADR 0050 precedent. Genesis ApprovalGrant policy: same `'GENESIS'` sentinel rule (per ADR 0049 + ADR 0050).
- `evidence_refs` — chain-aware references mirroring `qualityGateEvidenceRefSchema` precedent. Chain-walk refinement at Ring 0 rejects direct `KnowledgeChunk` references and `Evidence` refs with `authority: 'sandbox-observation' | 'self-asserted'` per charter inv. 18 (mirrors ADR 0049 Decision pattern).

**Authority-discipline posture**: ApprovalGrant is **envelope-level kernel-set** (mirrors ADR 0050 framing). All fields are kernel-set; producer-supplied ApprovalGrant records are rejected at the Ring 1 mint API per registry §Producer-vs-kernel-set authority fields. No producer-asserted-kernel-verifiable field-level exceptions.

**Cross-context binding** (charter inv. 19): `ApprovalGrant.execution_context_id` is kernel-set; cross-context substitution is rejected per registry §Cross-context enforcement layer.

## Consequences

### Accepts

- **`ApprovalGrant` Ring 0 entity introduced** at `packages/schemas/src/entities/approval-grant.ts` with `schema_version: '0.1.0'`. Closes M1 acceptance criterion #16 (`ApprovalGrant` in canonical 22-entity list).

- **Initial `approvalGrantKindSchema` Zod-defined enum** with three values (`gate_evidence_acknowledgment`, `worktree_clean_acknowledgment`, `pr_absence_acknowledgment`) — closes all three registry §Decision.required_grant_kind reservations from ADR 0030 + ADR 0035.

- **Discriminated `scope` union** with one branch per grant_kind, each carrying typed FKs and evidence-refs to the target entity (QualityGate / WorkspaceContext / repository-branch). Future grant_kinds extend the enum and add scope branches per the registered procedure.

- **D-037 producer-disjointness rule (ApprovalGrant-side mirror)**: a `Decision.required_grant_kind` value naming a grant kind cannot be satisfied by an `ApprovalGrant` whose `granted_by` producer equals the `Decision.decided_by` producer of the satisfied Decision, when both are minted in the same audit-chain step. Layer 1 mint API enforces by checking `prior_audit_chain_link_hash` discontinuity between the satisfied Decision and the satisfying ApprovalGrant + producer equality. The schema layer commits the `granted_by` allowlist enum + `minted_for_decision_id` FK; Ring 1 mint API performs the audit-chain-step + producer comparison.

- **Charter inv. 6 (forbidden-tier non-escalable) preserved**: no grant_kind value can clear a `forbidden`-tier denial. The three v1 grant_kinds all originate from `write-host` / `write-destructive` / `read-only` operation surfaces per ADR 0030 + ADR 0035, never `forbidden`. Future grant_kind additions inherit the constraint per the registered §Procedure: schema PR introducing a new grant_kind must classify the operation-tier scope and confirm no `forbidden`-tier clearing path is opened.

- **Grant lifecycle**: 'active' → 'consumed' (one-time use against a Decision override) | 'expired' (valid_until elapsed) | 'revoked' (grantor revoked before consumption). Lifecycle transitions are immutable: state changes via NEW ApprovalGrant record citing the prior in evidence_refs (mirrors ADR 0049 Decision supersession-via-evidence_refs + ADR 0050 WorkspaceContext lifecycle pattern). Prior records remain immutable in the audit chain. **Cardinality discipline**: at most one `active` ApprovalGrant per `(grant_kind, canonical(scope))` tuple; minting a new active grant for an already-bound scope retires the prior atomically at Layer 1 mint API.

- **`Evidence.subject_kind: 'approval_grant'` already exists** in `evidenceSubjectKindSchema` (verified at `packages/schemas/src/entities/evidence.ts`; the value has been part of the enum since earlier Phase work). This ADR does not modify `evidenceSubjectKindSchema` and does not bump `Evidence.schema_version`.

- **Producer allowlist extension**: `kernel_dashboard` added as NEW kernel-trusted producer for dashboard-minted human grants. `kernel_broker` and `kernel_mint_api` are existing producers (per ADR 0028 + ADR 0049). Registry §Kernel-trusted producer allowlist final state updated with `kernel_dashboard` row.

- **§Producer-vs-kernel-set authority fields update**: enumerate `ApprovalGrant.grant_kind`, `ApprovalGrant.scope` (entire union), `ApprovalGrant.minted_for_decision_id`, `ApprovalGrant.grantor_principal_ref`, `ApprovalGrant.granted_by`, `ApprovalGrant.granted_at`, `ApprovalGrant.valid_until`, `ApprovalGrant.execution_context_id`, `ApprovalGrant.grant_state`, `ApprovalGrant.audit_chain_link_hash`, `ApprovalGrant.evidence_refs` as kernel-set (envelope-level kernel-set posture mirroring ADR 0049 Decision + ADR 0050 WorkspaceContext).

- **NEW §Procedure for adding a new grant_kind value rule** registered in `ontology-registry.md` mirroring §Procedure for adding a new subject_kind value rule + §Procedure for adding a new reason_kind value rule (ADR 0049). Future schema PRs extending the enum:
  1. Cite the source ADR / charter rule that the grant_kind enforces
  2. Classify the grant_kind's tier scope: must NOT open a `forbidden`-tier clearing path (charter inv. 6); identify the `write-host` / `write-destructive` / `read-only` / `external-control-plane-mutation` tier
  3. Commit the typed scope shape (discriminated union branch)
  4. Update registry §ApprovalGrant.grant_kind status table (Zod-defined vs registry-canonical) at the same change-set
  5. Pass `hcs-ontology-reviewer` confirmation (always); `hcs-policy-reviewer` (always — grant_kind classifies an operation surface); `hcs-security-reviewer` (always — grant lifecycle + producer-disjointness rule application); `hcs-architect` (always)

- **Registry change-set bundled into this ADR's commit (or follow-on docs commit referencing this ADR)**. Registry version bumps `v0.4.13` → `v0.4.14`. Changes:
  1. NEW §ApprovalGrant entity section (entity overview + field-shape mirror + scope discriminated-union mirror)
  2. NEW §ApprovalGrant.grant_kind status table (3 Zod-defined values + procedure for future extensions)
  3. NEW §ApprovalGrant.grant_state enum mirror (4 values)
  4. NEW §Procedure for adding a new grant_kind value rule
  5. UPDATE §Kernel-trusted producer allowlist final state — add row for `kernel_dashboard` (existing `kernel_broker` and `kernel_mint_api` rows unchanged)
  6. UPDATE §Producer-vs-kernel-set authority fields — enumerate all 11 ApprovalGrant fields as kernel-set (envelope-level posture)
  7. UPDATE §Audit-chain coverage of rejections — add cross-reference to ApprovalGrant.audit_chain_link_hash semantic
  8. UPDATE §Decision-ApprovalGrant producer-disjointness rule (D-037) — register the ApprovalGrant-side enforcement mirror (Layer 1 mint API checks audit-chain-step disjointness + `granted_by != decided_by`)

- **D-row in `DECISIONS.md`** recording the entity introduction + initial enum disposition + producer-disjointness rule completion.

- **Charter compliance**: inv. 1 (canonical-typed-evidence — ApprovalGrant is a typed envelope, scope is typed not opaque), inv. 4 (audit logging — audit_chain_link_hash carries integrity), inv. 6 (forbidden-tier non-escalable — preserved structurally by tier classification requirement in the §Procedure rule), inv. 7 (execute lane discipline — ApprovalGrant is the first leg of the execute-lane stack; this ADR commits the contract, not the execution path), inv. 8 (no sandbox→stronger — evidence_refs chain-walk refinement), inv. 17 (execution context declared — `execution_context_id` kernel-set, required), inv. 18 (derived retrieval is never decision authority — ApprovalGrant IS the typed-grant authorizing `allowed_for_gate` transitions; chain-walk rule applies to its evidence_refs), inv. 19 (freshness-bound + execution-context-bound — `valid_until` non-null + `execution_context_id` kernel-set). All upheld.

### Rejects

- **Opaque `scope: z.json()`** (Option B) — violates charter inv. 1 canonical-typed-evidence; creates secrets-leak + producer-injection surface. Rejected.

- **Producer-supplied ApprovalGrant records** — ApprovalGrant is kernel-set throughout. Producer attempts at the (future) Ring 1 mint API are rejected with standard kernel-set producer enforcement (registry §Producer-vs-kernel-set authority fields).

- **ApprovalGrant entity carrying raw secret values or unsigned grantor declarations** — `grantor_principal_ref` is a typed FK to a Principal (future entity). Raw signed bytes (e.g., human signatures, cryptographic proofs) belong in evidence_refs as separate Evidence records, not inline in scope or grantor fields.

- **Schema-level Decision-ApprovalGrant producer-disjointness refinement** asserting "the `minted_for_decision_id` FK target's `decided_by` MUST NOT equal this grant's `granted_by`" — rejected because cross-record equality cannot be schema-validated against host state per registry §Cross-context enforcement layer §Schema validation alone is not an enforcement layer rule. The disjointness check requires looking up the Decision record at mint time, which is a Ring 1 mint API responsibility. The schema layer commits the field shapes (`granted_by` allowlist enum + `minted_for_decision_id` FK); Layer 1 mint API performs the equality check + audit-chain-step disjointness. Mirrors ADR 0050 §Rejects "Schema-level cross-context-equality refinement" rejection.

- **ApprovalGrant lifecycle in-place mutation** — grants are immutable once minted; lifecycle transitions ('active' → 'consumed' / 'expired' / 'revoked') produce a NEW ApprovalGrant record citing the prior in `evidence_refs`. Schema-level immutability refinement is Ring 1 mint-API responsibility (Zod cannot reach prior storage state). Mirrors ADR 0049 + ADR 0050 supersession-via-evidence_refs pattern.

- **Multiple active ApprovalGrants for the same `(grant_kind, canonical(scope))` tuple** — cardinality discipline: at most one `active` per scope-binding; minting a new active grant retires the prior atomically. Layer 1 mint API enforces; the schema layer commits the rule per §Decision.

- **Grant_kind values that clear a `forbidden`-tier denial** — charter inv. 6 forbids escalation. The §Procedure rule's step 2 requires tier-classification at schema PR time; future schema PRs adding `forbidden`-tier-clearing grant_kinds are rejected at `hcs-policy-reviewer` review.

- **Authoring Ring 1 mint API, dashboard surface, or revocation workflow** — out of scope. Per workflow-sequencing investigation §Step 4, Ring 1 mint API + storage + audit hash chain land at `packages/kernel/`. Dashboard human-grant minting (`kernel_dashboard` producer) lands at `packages/dashboard/` per Milestone 5. Revocation workflow lands at M4 stack per charter inv. 7.

- **Authoring canonical policy YAML for grant-tier rules** — out of scope; Phase 2.5 lane in `system-config`. Per workflow-sequencing investigation §Step 2 (parallel-OK).

### Future amendments

- **Subsequent grant_kind extensions** land via schema PR following the §Procedure rule. Candidate grant_kinds from existing ADRs not yet in v1: `human_dashboard_grant` per ADR 0036 deletion authority kind (note: that's a deletion_authority_kind value, not a grant_kind; the ApprovalGrant entity is the FK target, with one of the three v1 grant_kinds describing the actual authorization shape).

- **Ring 1 mint API implementation** consumes the ApprovalGrant entity and emits typed ApprovalGrant records via the Layer 1 mint API. Lives at `packages/kernel/src/mint/`. Enforces D-037 producer-disjointness, cardinality discipline, charter inv. 6 forbidden-tier non-escalability, grant-state lifecycle transitions.

- **Dashboard human-grant minting surface** (Milestone 5) — `kernel_dashboard` producer mints `gate_evidence_acknowledgment` / `worktree_clean_acknowledgment` / `pr_absence_acknowledgment` grants in response to human dashboard review per ADR 0036 `human_dashboard_grant` deletion authority. Lives at `packages/dashboard/`.

- **Revocation workflow** — explicit grantor-initiated revocation before consumption produces a NEW ApprovalGrant record with `grant_state: 'revoked'` citing the prior in `evidence_refs`. Lives at Ring 1 mint API + dashboard surface; out of scope for this Ring 0 entity ADR.

- **`Principal` Ring 0 entity** (M1 acceptance criterion #3) — `grantor_principal_ref` is a forward-reference. When `Principal` lands (per workflow-sequencing investigation §Step 3 batched M1 entities), the FK target becomes typed.

- **Reopen** if a future incident shows the v1 scope shapes inadequate (e.g., gate_evidence_acknowledgment scope misses a structural field, or producer-disjointness rule needs additional defense beyond audit-chain-step + producer equality).

## Compliance

This ADR is Ring 0 docs-only at the ADR layer; the schema PR that follows is a Ring 0 schema-change PR per `.agents/skills/hcs-schema-change`. No cross-ring imports authored. No canonical policy YAML, runtime probes, dashboard route React components, MCP adapter contracts, hook bodies, charter invariant text changes, or Ring 1 mint API implementation in this commit. Registry-side changes (NEW §ApprovalGrant entity section + §ApprovalGrant.grant_kind status table + §ApprovalGrant.grant_state enum mirror + §Procedure for adding a new grant_kind value rule + §Kernel-trusted producer allowlist `kernel_dashboard` row + §Producer-vs-kernel-set authority fields update + §Audit-chain coverage of rejections cross-reference + §Decision-ApprovalGrant producer-disjointness rule registration) are bundled into this commit or a follow-on docs commit referencing this ADR. Complies with implementation charter v1.4.0.

**Implementation-detail acknowledgments** (per ADR 0049 + ADR 0050 precedents):

- `prior_audit_chain_link_hash` is NOT a schema field on the ApprovalGrant record; it is an input to the `audit_chain_link_hash` canonical-concatenation computation at Ring 1 mint time. Chain-link continuity is enforced by Ring 1 storage on insert (Milestone 3 audit-events table).
- Genesis-collision defense for the same `(grant_kind, canonical(scope))` audit-chain root is a Milestone 3 audit-events table unique-constraint commitment.
- Canonical-concatenation field-order convention is per-entity; ADR 0051 places identity + discriminator fields first (`approval_grant_id`, `grant_kind`, `scope`), followed by binding fields (`minted_for_decision_id`, `grantor_principal_ref`, `granted_by`), followed by lifecycle (`granted_at`, `valid_until`, `execution_context_id`, `grant_state`), followed by evidence (`canonical(evidence_refs)`), followed by the chain link (`prior_audit_chain_link_hash`).
- `canonical(scope)` encoding is deferred to Ring 1 mint API; the schema commits the typed structure (discriminated union), and Ring 1 commits a deterministic serialization for hash-determinism (mirroring ADR 0049 + ADR 0050 posture on `canonical(evidence_refs)`).

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md` v1.4.0 — invariants 1, 4, 6, 7, 8, 17, 18, 19
- Decision ledger: `DECISIONS.md` (D-037 producer-disjointness rule from ADR 0049; D-row to be added at acceptance)
- Related ADRs:
  - ADR 0019 v3 (chain-promotion rule; four-class `derived_from` closure)
  - ADR 0028 (kernel_broker producer; ADR 0049 audit-chain coverage)
  - ADR 0030 v2 (Q-006 Stage 2 source-control evidence; reserves `worktree_clean_acknowledgment` and `pr_absence_acknowledgment` grant kinds)
  - ADR 0035 v2 (Q-007(g) QualityGate standalone entity; reserves `gate_evidence_acknowledgment` grant kind; commits gate-acknowledgment grant scope semantics)
  - ADR 0036 (Q-009 workspace manifest projection; `human_dashboard_grant` deletion authority kind references ApprovalGrant via FK)
  - ADR 0047 (cleanup-plan composition; §Future amendments references future ApprovalGrant lifecycle for class-I cleanup execution)
  - ADR 0049 (Decision Ring 0 entity introduction; D-037 producer-disjointness rule; immediate precedent in workflow-sequencing investigation §Step 1)
  - ADR 0050 (WorkspaceContext Ring 0 entity introduction; sibling foundational-entity ADR; envelope-level kernel-set framing precedent; canonical-concatenation pattern co-commitment)
- Registry: `docs/host-capability-substrate/ontology-registry.md` v0.4.13 — §Authority discipline (line 279+), §Cross-context enforcement layer (line 546+), §Audit-chain coverage of rejections (line 602+), §Subject-kind grounding requirement (line 443+), §Kernel-trusted producer allowlist final state (line 798+), §Decision.required_grant_kind reservations (line 1363+ — three reservations from ADR 0030 + ADR 0035; this ADR closes them)
- Workflow-sequencing investigation: `docs/host-capability-substrate/research/local/2026-05-10-workflow-sequencing-investigation.md` §Step 1 entity #3 (ApprovalGrant)
- Outstanding-work sequencing workflow: `docs/host-capability-substrate/research/local/2026-05-09-outstanding-work-sequencing-workflow.md`
- Implementation rules: `IMPLEMENT.md` §Required subagent reviews, §Change classes
- Plan: `PLAN.md` §Milestone 1 acceptance (line 578 — 22 canonical Ring 0 entities)
- Schema-change skill: `.agents/skills/hcs-schema-change/SKILL.md`
- Schema source for related entities: `packages/schemas/src/entities/operation-shape.ts` lines 134-139 (`humanDashboardGrantDeletionAuthorityRefSchema` references `approval_grant_id`); `packages/schemas/src/entities/quality-gate.ts` (`QualityGate.target_subject_ref`); `packages/schemas/src/entities/agent-client.ts` (schema pattern reference)

### External

- None directly; this ADR composes existing internal posture.
