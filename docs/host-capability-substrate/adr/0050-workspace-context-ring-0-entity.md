---
adr_number: 0050
title: WorkspaceContext Ring 0 entity introduction
status: proposed
date: 2026-05-10
charter_version: 1.4.0
tags: [workspace-context, ring-0, milestone-1, foundational-entity, adr-0031-followup, charter-v1-4-0, registry-v0-4-12, workflow-sequencing-step-1]
---

# ADR 0050: `WorkspaceContext` Ring 0 entity introduction

## Status

`proposed`

## Date

2026-05-10

## Charter version

Written against charter v1.4.0 and `docs/host-capability-substrate/ontology-registry.md` v0.4.12.

## Reviews

This ADR introduces a Ring 0 entity whose design is largely pre-committed by ADR 0031 v1 (1:1 cardinality with worktree + mechanical tweak #8 cross-context-equality rule on `WorkspaceContext.execution_context_id`). Required reviewer dispatch per `IMPLEMENT.md` §Required subagent reviews + the workflow-sequencing investigation §Step 1 entity #2 estimation, expanded in v2 because the entity carries `execution_context_id` (an authority-discipline field per registry §Producer-vs-kernel-set authority fields):

- `hcs-architect` — mandatory for any ADR
- `hcs-ontology-reviewer` — mandatory; ADR introduces a new Ring 0 entity that gains a typed schema where currently only an FK identity exists
- `hcs-security-reviewer` — mandatory in v2; ADR 0031 v1 mechanical tweak #8 commits `WorkspaceContext.execution_context_id` as a Layer 1 mint API cross-context-equality enforcement field; per registry §Cross-context enforcement layer this is an authority-discipline boundary

`hcs-policy-reviewer` is **not** required: the entity does not classify operations (no `reason_kind` enum) and does not introduce policy tier rules.

## Context

The 2026-05-10 workflow-sequencing investigation (`docs/host-capability-substrate/research/local/2026-05-10-workflow-sequencing-investigation.md`) §Step 1 names `WorkspaceContext` as entity #2 of 5 foundational Ring 0 entities to land before Ring 1 service implementation (after `Decision` ADR 0049, before `ApprovalGrant` ADR 0051). The investigation classifies it as "small ADR + small schema PR, 1 reviewer round" because the design is pre-committed.

**Pre-committed design points:**

- ADR 0031 v1 (Q-008(d) worktree-ownership composition) commits **1:1 cardinality with worktree**: every `WorkspaceContext` corresponds to exactly one worktree at one `(repository_id, worktree_path)` tuple, and every active worktree has at most one `WorkspaceContext` (`docs/host-capability-substrate/adr/0031-q-008-d-worktree-ownership-composition.md` §Sub-decision (a)).
- **ADR 0031 v1 §Acceptance note Mechanical Tweak #8 (Security-C, lines 65-69)** explicitly commits `WorkspaceContext.execution_context_id` as a kernel-set field: "Layer 1 mint API rejects `Lease` acquire when `WorkspaceContext.execution_context_id != Session.execution_context_id`." Reaffirmed in §Cross-context binding rules per Ring 1 layer (lines 567-571). This ADR composes with that commitment: WorkspaceContext records carry `execution_context_id` set at mint time, and the Layer 1 mint API enforces equality with the requesting session's execution_context_id when leases are acquired.
- **ADR 0031 v1 §Authority discipline (lines 595-607)** classifies WorkspaceContext fields explicitly: `workspace_context_id`, lifecycle/audit fields are kernel-set; `repository_id` and `worktree_path` are **producer-asserted, kernel-verifiable** (the workspace-diagnose service supplies them; Layer 1 verifies via filesystem stat + `worktree_path` canonicalization per Mechanical Tweak #2 / Security-D).
- ADR 0036 §Sub-decision (b) §Layer 1 grounding requirement makes `subject_kind: "workspace_context"` one of the two derived/Layer-2-backed coordination subject kinds (the other being `audit_profile_snapshot`); promotion of a CoordinationFact with this subject_kind requires at least one host-observation `Evidence` record per the registry §Subject-kind grounding requirement (line 443+).
- ADR 0037 §Out of scope reserves the `AgentClient × WorkspaceContext` cardinality question as architectural deferral; current Phase 1 assumption is single active AgentClient per ExecutionContext, with WorkspaceContext :N: AgentClient via ExecutionContext binding. ADR 0048 records dispositions for future schema PRs that surface this need.
- Existing `CoordinationFact.subjectRefSchemas.workspace_context` is `z.object({ workspace_context_id: entityIdSchema }).strict()` (just the FK identity); the entity itself is unbuilt.
- Existing `VerificationCommandSpec.workspace_context_id` is a string FK with no entity to resolve to.
- ADR 0036 §`subject_kind: "audit_profile_snapshot"` references `(workspace_context_id, audit_profile_revision_date)` pairs — the workspace-context FK there resolves to this entity once landed.

**Current state.** Without a Ring 0 `WorkspaceContext` schema:

- The FK references in `CoordinationFact`, `VerificationCommandSpec`, and `audit_profile_snapshot` resolve to nothing typed
- ADR 0036 §Layer 1 grounding requirement governs `subject_kind: workspace_context` records but their identity has no kernel-trusted owner
- The `AgentClient × WorkspaceContext` cardinality deferral cannot be revisited cleanly until WorkspaceContext is a typed entity
- M1 acceptance criterion #2 (`WorkspaceContext` in the canonical 22-entity list) is unmet

The constraint stack: charter v1.4.0 inv. 1 (canonical-typed-evidence ontology), inv. 17 (execution context declared, not inferred), inv. 19 (boundary claims execution-context-bound — WorkspaceContext binds workspace identity to repository + worktree path).

## Options considered

### Option A — Minimal entity (just typed identity, no worktree binding fields)

A Zod entity with only `workspace_context_id` + `schema_version` + lifecycle metadata. Worktree binding stays implicit / external; future schema PRs add binding fields when they surface concrete need.

**Pros:**

- Smallest scope; fastest to land
- Defers binding-field design until a concrete consumer surfaces

**Cons:**

- Existing FK consumers (`CoordinationFact`, `VerificationCommandSpec`) still cannot resolve to a typed worktree binding
- ADR 0031 v1 1:1 cardinality with worktree is committed but not realized in schema
- Future schema PRs would have to add `repository_id` + `worktree_path` anyway; might as well land them now

### Option B — Rich entity with full lifecycle binding (Lease references, audit-profile binding, etc.)

A Zod entity with `workspace_context_id`, `repository_id`, `worktree_path`, `audit_profile_snapshot_refs`, `active_lease_refs`, `bound_agent_client_refs`, etc.

**Pros:**

- Full structural representation of WorkspaceContext's role in the substrate
- Future consumers (Ring 1 gateway, audit-chain re-derive) get rich typed binding

**Cons:**

- Forward-references entities not yet built (`Lease` is entity #4 per workflow §Step 1; `ApprovalGrant` is #3; `Run` is #5)
- Premature design risk: the `bound_agent_client_refs` shape would be guessed without the AgentClient × WorkspaceContext cardinality ADR (deferred per ADR 0037 §Out of scope)
- Larger schema PR scope; pulls forward design decisions that should land with their respective entities

### Option C — Minimal entity with ADR 0031 worktree-binding fields (between A and B)

A Zod entity that captures the ADR 0031-committed identity (workspace_context_id + repository_id + worktree_path + lifecycle state), mirroring the `AgentClient` schema pattern (which similarly uses `agent_client_state: 'active' | 'retired'` + `kernel_observed_at` + nullable `valid_until` + `audit_chain_link_hash` + `evidence_refs`). No forward references to entities not yet built.

**Pros:**

- Lands the ADR 0031-committed binding without speculating beyond it
- Existing FK consumers resolve to a typed worktree binding (`repository_id + worktree_path`)
- Mirrors the proven `AgentClient` schema pattern (Phase 2.1.1 precedent)
- Future Lease / ApprovalGrant / Run schema PRs compose with WorkspaceContext via shared `(repository_id, worktree_path)` keys without WorkspaceContext referencing them
- Smallest schema PR scope that fulfills ADR 0031 + workflow-sequencing investigation §Step 1 commitments

**Cons:**

- Adds the `repository_id` + `worktree_path` fields beyond Option A's minimal scope (defensible per ADR 0031 already committing the 1:1 cardinality)

## Decision

**Option C.** `WorkspaceContext` Ring 0 entity introduced with the ADR 0031-committed worktree-binding fields, mirroring the `AgentClient` Phase 2.1.1 schema pattern. No forward references to entities not yet built (`Lease`, `ApprovalGrant`, `Run`).

The entity carries:

- `schema_version` — entity-specific literal `'0.1.0'` via `workspaceContextSchemaVersionSchema = z.literal('0.1.0')`. Per the entity-specific-literal precedents in landed source: `evidenceSchemaVersionSchema` (`evidence.ts`), `boundaryObservationSchemaVersionSchema` (`boundary-observation.ts`), `executionContextSchemaVersionSchema` (`execution-context.ts`), `knowledgeSourceSchemaVersionSchema` (`knowledge-source.ts`), `operationShapeSchemaVersionSchema` (`operation-shape.ts`), `credentialSourceSchemaVersionSchema` (`credential-source.ts`). Note: `agentClientSchema` uses the generic `schemaVersionSchema` from `common.ts`; this ADR chooses the entity-specific-literal pattern for explicit version-bump tracking. `decisionSchemaVersionSchema` is a co-commitment from ADR 0049 (sibling foundational entity), not a precedent yet landed in source.
- `workspace_context_id` — `entityIdSchema` (kernel-set)
- `execution_context_id` — `entityIdSchema` (**kernel-set**; per ADR 0031 v1 Mechanical Tweak #8 / Security-C). Layer 1 mint API enforces `WorkspaceContext.execution_context_id == Session.execution_context_id` when leases are acquired. WorkspaceContext binds to one execution_context_id at mint; lifecycle transitions (e.g., session ended; new session starts on the same worktree) produce a NEW WorkspaceContext record with the new execution_context_id. The prior WorkspaceContext is cited in the new record's `evidence_refs` array (mirroring ADR 0049 Decision supersession-via-evidence_refs pattern; no separate typed `prior_workspace_context_id` FK field). Prior records remain immutable in the audit chain. Cardinality discipline: `(repository_id, canonical(worktree_path), workspace_context_state == 'active')` is unique; mint of a new active WorkspaceContext for an already-bound worktree retires the prior atomically at the Layer 1 mint API (mirrors ADR 0031 v1 Mechanical Tweak #6 / Security-G Lease-uniqueness pattern).
- `repository_id` — `entityIdSchema` (**producer-asserted, kernel-verifiable** per ADR 0031 v1 §Authority discipline; the workspace-diagnose service supplies the value, Layer 1 mint API verifies against filesystem state + `GitRepositoryObservation` evidence)
- `worktree_path` — `z.string().min(1)` (**producer-asserted, kernel-verifiable** per ADR 0031 v1 §Authority discipline + Mechanical Tweak #2 / Security-D worktree_path canonicalization; the workspace-diagnose service supplies the value, Layer 1 mint API verifies via filesystem stat + canonicalization). Mirrors the `worktree` subject_ref shape in `CoordinationFact.subjectRefSchemas`.
- `workspace_context_state` — `workspaceContextStateSchema = z.enum(['active', 'retired'])` (**kernel-set**; mirrors `agentClientStateSchema` lifecycle pattern)
- `kernel_observed_at` — `isoDateTimeSchema` (kernel-set; when the kernel resolver minted this WorkspaceContext record)
- `valid_until` — `isoDateTimeSchema.nullable()` (kernel-set; null when active; set to retirement timestamp when `workspace_context_state: 'retired'`)
- `producer` — `workspaceContextProducerSchema = z.enum(['kernel_workspace_diagnose'])` (kernel-set; named enum schema chosen over `z.literal` per ontology reviewer Option 2 to anticipate forward-compatible allowlist widening without a schema_version bump; mirrors the future kind-tagged shape the registry §Producer-vs-kernel-set authority fields rule projects). The only allowlisted producer for WorkspaceContext records per the registry §Kernel-trusted producer allowlist final state extension; producer scope expanded by this ADR from "diagnostic outputs and manifest projections" to "diagnostic outputs, manifest projections, and `WorkspaceContext` identity records".
- `audit_chain_link_hash` — `sha256DigestSchema` (required, non-empty, sha256-shape-validated; mirrors `agentClientSchema.audit_chain_link_hash` and the ADR 0049 `decisionSchema.audit_chain_link_hash` co-commitment). Hash covers the canonical concatenation of `workspace_context_id || execution_context_id || repository_id || worktree_path || workspace_context_state || kernel_observed_at || (valid_until || '') || producer || canonical(evidence_refs) || prior_audit_chain_link_hash`. The `'' for null` substitution rule is binding posture jointly committed by ADR 0049 + this ADR for nullable hash-input fields. The `canonical(evidence_refs)` encoding is deferred to Ring 1 mint API per the workflow-sequencing investigation §Step 4 (matches ADR 0049 posture). `schema_version` is intentionally excluded from the canonical concatenation per ADR 0049 precedent: schema-version bumps are envelope lifecycle events, not record-content drift. Genesis WorkspaceContext policy: same `'GENESIS'` sentinel rule as Decision (per ADR 0049).
- `evidence_refs` — `z.array(evidenceRefSchema).min(1)` (kernel-set producer evidence; mirrors `agentClientSchema.evidence_refs`)

The kernel-trusted producer for WorkspaceContext is `kernel_workspace_diagnose` (already in the registry §Kernel-trusted producer allowlist final state per ADR 0036; this ADR extends the producer's scope to include `WorkspaceContext` identity records). No new producer added.

**Authority-discipline split** per ADR 0031 v1 §Authority discipline + this ADR's reconciliation:

- **Kernel-set** (Layer 1 mint API rejects producer-supplied values): `workspace_context_id`, `execution_context_id`, `workspace_context_state`, `kernel_observed_at`, `valid_until`, `producer`, `audit_chain_link_hash`, `evidence_refs`, `schema_version`
- **Producer-asserted, kernel-verifiable** (Layer 1 mint API verifies against filesystem state and observed evidence): `repository_id`, `worktree_path`

This is the **envelope-level kernel-set** posture per the registry §Producer-vs-kernel-set authority fields rule, with two field-level exceptions per ADR 0031 v1: `repository_id` and `worktree_path` are observation outputs from the workspace-diagnose service that the Layer 1 mint API verifies but does not synthesize.

**Cross-context binding** (charter inv. 19 + ADR 0031 v1 §Cross-context binding rules per Ring 1 layer): WorkspaceContext binds to ONE execution_context_id at mint time per Mechanical Tweak #8. Layer 1 mint API enforces `WorkspaceContext.execution_context_id == Session.execution_context_id` when leases are acquired against the workspace. The earlier framing (in v1 of this ADR) that "workspace identity is execution-context-independent" was incorrect against accepted ADR 0031 v1 posture and was withdrawn at v2.

## Consequences

### Accepts

- **`WorkspaceContext` Ring 0 entity introduced** at `packages/schemas/src/entities/workspace-context.ts` with `schema_version: '0.1.0'`. Closes M1 acceptance criterion #2 (`WorkspaceContext` in the canonical 22-entity list). Closes the ADR 0031 v1 §Sub-decision (a) commitment by giving the 1:1-with-worktree identity a typed entity envelope.

- **Mirrors `AgentClient` schema pattern**: `workspace_context_state: 'active' | 'retired'`, `kernel_observed_at`, nullable `valid_until`, required `audit_chain_link_hash`, kernel-set producer evidence_refs. Validated precedent reduces design risk.

- **No new kernel-trusted producer; existing `kernel_workspace_diagnose` scope expanded.** The workspace-diagnose service is already authorized per ADR 0036 to mint `DerivedSummary` records and `system.workspace.diagnose.v1` outputs. This ADR extends the producer's scope to also include `WorkspaceContext` identity records. Registry §Kernel-trusted producer allowlist final state row for `kernel_workspace_diagnose` is updated from "Mints workspace diagnostic outputs and manifest projections" to "Mints workspace diagnostic outputs, manifest projections, and `WorkspaceContext` identity records."

- **No new `Evidence.subject_kind` extension required**: `'workspace_context'` already exists in `evidenceSubjectKindSchema` (added in earlier Phase 2 work). This ADR does not modify `evidenceSubjectKindSchema` and does not bump `Evidence.schema_version`.

- **No `CoordinationFact.subjectRefSchemas.workspace_context` change**: the existing `z.object({ workspace_context_id: entityIdSchema }).strict()` shape remains. WorkspaceContext entity records are referenced by ID; the FK identity is sufficient for coordination-fact subject_ref resolution. Same applies to `audit_profile_snapshot.workspace_context_id` (per ADR 0036) and `VerificationCommandSpec.workspace_context_id` (per ADR 0036).

- **Cross-context binding committed at entity level**: WorkspaceContext binds to one execution_context_id at mint time per ADR 0031 v1 Mechanical Tweak #8 / Security-C; the kernel-set `execution_context_id` field operationalizes charter inv. 19 (boundary claims execution-context-bound) at the WorkspaceContext entity level. Layer 1 mint API enforces `WorkspaceContext.execution_context_id == Session.execution_context_id` when leases are acquired against the workspace (per ADR 0031 v1 §Cross-context binding rules per Ring 1 layer lines 567-571). The earlier framing in v1 of this ADR (that "workspace identity is execution-context-independent") conflated workspace-as-filesystem-state with WorkspaceContext-as-typed-substrate-identity and was withdrawn at v2 per architect + ontology + security review. Other entities that BIND to a WorkspaceContext (per ADR 0037 future amendment for AgentClient × WorkspaceContext) carry their own execution-context binding per inv. 19 — composing with, not replacing, the WorkspaceContext's binding.

- **Audit-chain integration**: `audit_chain_link_hash` carries the canonical concatenation of all kernel-set fields plus `prior_audit_chain_link_hash`, mirroring `Decision` (ADR 0049) and `AgentClient` precedents. Chain-link continuity is enforced by Ring 1 storage on insert (Milestone 3); the entity envelope contributes the hash structurally.

- **Registry change-set bundled into this ADR's commit (or follow-on docs commit referencing this ADR)**. Registry version bumps `v0.4.12` → `v0.4.13`. Changes:
  1. NEW §WorkspaceContext entity section (entity overview + field-shape mirror; cites ADR 0031 v1 Mechanical Tweak #8 + #2 as authority for `execution_context_id` kernel-set classification and `repository_id` + `worktree_path` producer-asserted-kernel-verifiable classification)
  2. UPDATE §Phase 2.4 Consolidation Summary §Standalone Ring 0 entities landed in Phase 2.1 — add a Phase 2.7+ row for `WorkspaceContext` (or new sub-section noting it's a M1 foundational-entity completion landed post-train per the workflow-sequencing investigation Step 1)
  3. UPDATE §Producer-vs-kernel-set authority fields — the WorkspaceContext envelope is **envelope-level kernel-set** with two field-level exceptions: `repository_id` and `worktree_path` are producer-asserted, kernel-verifiable per ADR 0031 v1 §Authority discipline (workspace-diagnose service supplies; Layer 1 mint API verifies against filesystem state). All other WorkspaceContext fields (`workspace_context_id`, `execution_context_id`, `workspace_context_state`, `kernel_observed_at`, `valid_until`, `producer`, `audit_chain_link_hash`, `evidence_refs`, `schema_version`) are kernel-set; producer-supplied values rejected at future Ring 1 mint API.
  4. UPDATE §Kernel-trusted producer allowlist final state row for `kernel_workspace_diagnose` — scope extended to include `WorkspaceContext` identity records.
  5. UPDATE §Cross-context enforcement layer — add a one-line cross-reference to ADR 0031 v1 §Cross-context binding rules per Ring 1 layer (lines 567-571), noting that `WorkspaceContext.execution_context_id` is the canonical FK that the Layer 1 mint API checks for `Lease` acquire equality.

- **D-row in `DECISIONS.md`** recording the entity introduction.

- **Charter compliance**: inv. 1 (canonical-typed-evidence — WorkspaceContext is a typed identity record, not a derived/observational artifact), inv. 4 (audit logging — WorkspaceContext records carry audit-chain-link hash for tamper-evident logging), inv. 17 (execution context declared — WorkspaceContext is the typed identity for workspace surface; inv. 17 is now operationally referenced from a Ring 0 entity rather than implicit in `Evidence.workspace_id` strings). Inv. 19 (freshness/execution-context-bound) does not apply to WorkspaceContext at the entity level (identity, not observation). All upheld.

### Rejects

- **Adding `Lease`, `ApprovalGrant`, `Run`, or `AgentClient` reference fields to WorkspaceContext** — those entities are either entity #3/#4/#5 of the workflow-sequencing investigation §Step 1 (not yet built) or have their own composition pattern (AgentClient × WorkspaceContext deferred per ADR 0037). Forward-referencing them would create unstable schema dependencies. Rejected per Option B con.

- **Adding a `bound_audit_profile_snapshots` array** — audit-profile snapshots are referenced FROM CoordinationFacts via `audit_profile_snapshot.workspace_context_id` per ADR 0036. WorkspaceContext does not need to mirror the back-reference; the existing FK direction is sufficient.

- **Producer-supplied `WorkspaceContext` records** — WorkspaceContext is kernel-set throughout. The registered enforcement (registry §Producer-vs-kernel-set authority fields, plus the new producer-allowlist row this ADR commits) rejects producer-claimed WorkspaceContext records at the future Ring 1 mint API. Schema-layer guard: Zod cannot enforce "kernel only," but the producer-allowlist registration makes the rule mint-API-checkable.

- **The framing that "workspace identity is execution-context-independent"** (the v1 §Rejects entry on `WorkspaceContext.execution_context_id`) — withdrawn at v2 per architect + ontology review. ADR 0031 v1 Mechanical Tweak #8 (Security-C, lines 65-69) and §Cross-context binding rules per Ring 1 layer (lines 567-571) explicitly commit `WorkspaceContext.execution_context_id` as a kernel-set field used for Layer 1 mint API cross-context-equality enforcement. v2 schema includes the field. The earlier v1 reasoning ("a workspace exists whether or not a session is currently operating on it") confused workspace-as-filesystem-state with WorkspaceContext-as-typed-substrate-identity: the filesystem worktree is execution-context-independent, but the typed WorkspaceContext record binds to the execution context that minted it (and lifecycle transitions produce NEW WorkspaceContext records).

- **No typed `Worktree` Ring 0 entity** — `Worktree` is not in the workflow-sequencing investigation §Step 1 foundational five (`Decision`, `WorkspaceContext`, `ApprovalGrant`, `Lease`, `Run`). The composite `(repository_id, worktree_path)` key is the canonical worktree reference posture and remains so until a separate ADR commits a typed `Worktree` Ring 0 entity. WorkspaceContext does not pre-empt that future ADR's design space; if a typed `Worktree` entity lands, WorkspaceContext schema_version may bump to add a typed `worktree_id` FK at that time (per the standard schema-extension procedure).

- **Upgrading `CoordinationFact.subjectRefSchemas.workspace_context` to `{ workspace_context_id, repository_id, worktree_path }`** — rejected. The FK-only subject_ref shape (`{ workspace_context_id }`) is sufficient because the WorkspaceContext entity record itself carries `repository_id` + `worktree_path`. Denormalizing the binding into the subject_ref creates a divergence risk where the entity's binding could drift from the subject_ref's binding without consumers noticing. Ring 1 lookup composes via FK resolution.

- **Treating WorkspaceContext entity records as host-observation `Evidence` candidates for §Subject-kind grounding requirement promotion** — rejected. WorkspaceContext is a Ring 0 identity record, not an Evidence record. ADR 0036 §Layer 1 grounding requirement governs `subject_kind: workspace_context` CoordinationFact promotion, which still requires at least one host-observation `Evidence` record (e.g., `GitRepositoryObservation` from `kernel_workspace_diagnose`) in `evidence_refs`. The WorkspaceContext entity provides typed identity for the FK target; it does not itself satisfy the grounding requirement.

- **Schema-level WorkspaceContext-immutability refinement** — like Decision (ADR 0049), WorkspaceContext records are immutable once minted; lifecycle transitions (`active → retired`) are via NEW WorkspaceContext records citing the prior in `evidence_refs`. Zod cannot enforce "this record was previously minted." This is a Ring 1 mint-API invariant, registered here as posture commitment.

- **Schema-level cross-context-equality refinement** asserting `WorkspaceContext.execution_context_id == Session.execution_context_id` at the schema layer — rejected because cross-context binding cannot be schema-validated against host state per registry §Cross-context enforcement layer §Schema validation alone is not an enforcement layer rule. The equality check requires looking up the Session record's `execution_context_id` at mint time, which is a Ring 1 mint API responsibility. The schema layer commits the field as kernel-set + required; the Layer 1 mint API enforces the equality per ADR 0031 v1 Mechanical Tweak #8. This rejection is registered explicitly to forestall reviewer churn on future schema PRs.

- **CoordinationFact FK references to retired WorkspaceContext records continuing to satisfy schema validation post-supersession** — registered as a Ring 1 mint-API / gateway re-derive concern per ontology B1-v2 review. After a WorkspaceContext lifecycle transition (retired + NEW), existing `CoordinationFact.subject_ref.workspace_context_id` references resolve to retired entity records; schema validation does not enforce subject-FK liveness. The Layer 1 mint API (when ApprovalGrant promotion is attempted) and the gateway re-derive layer (per registry §Cross-context enforcement layer three-layer model) are responsible for re-resolving subject_ref to the currently-active WorkspaceContext for the same `(repository_id, canonical(worktree_path))` and rejecting promotion if the cited workspace_context_id is retired. Mirror posture per ADR 0049 Decision supersession-via-evidence_refs pattern: Ring 0 schema does not enforce FK-liveness; Ring 1 mint-API + gateway re-derive does.

### Future amendments

- **`AgentClient × WorkspaceContext` cardinality** (ADR 0037 §Out of scope deferral) — when a single workspace's operations span multiple AgentClients with conflicting capability-class evidence, a future ADR opens this question. The future ADR can extend `WorkspaceContext` with an `active_agent_client_refs` field or use a CoordinationFact-mediated representation per the existing `subject_kind: workspace_context` mechanism. ADR 0048 dispositions for `machine_identity` / `project_substrate_contract` / backup-readiness subject_kinds inform how this future ADR composes.

- **`Lease × WorkspaceContext` lifecycle binding** (ADR 0031 v1 + ADR 0047 cleanup-plan composition) — when ADR 0051 (Lease) lands, the lease lifecycle composes with WorkspaceContext via `(repository_id, worktree_path)` shared keys. WorkspaceContext does not need a forward reference to Lease today.

- **`ApprovalGrant.scope` referencing WorkspaceContext** — when ADR 0051 ApprovalGrant entity lands, grant scope may include a `workspace_context_id` field for workspace-scoped grants. WorkspaceContext does not need to mirror the back-reference.

- **WorkspaceContext lifecycle transitions** beyond `active | retired` (e.g., `archived`, `force_broken`, `migrated`) may surface as workspace-management workflows mature. Future ADRs extend `workspaceContextStateSchema` per the standard schema-extension procedure.

- **Reopen** if usage patterns surface a need for Ring 0 fields not anticipated here (e.g., a `workspace_kind` discriminator distinguishing development vs CI vs cloud-agent workspaces; or a `containment_kind` field that's distinct from `ExecutionContext.kernel_sandbox_kind`).

## Compliance

This ADR is Ring 0 docs-only at the ADR layer; the schema PR that follows is a Ring 0 schema-change PR per `.agents/skills/hcs-schema-change`. No cross-ring imports authored. No canonical policy YAML, runtime probes, dashboard route React components, MCP adapter contracts, hook bodies, or charter invariant text changes in this commit. Registry-side changes (NEW §WorkspaceContext entity section + Phase 2.4 consolidation update + §Producer-vs-kernel-set authority fields update) are bundled into this commit or a follow-on docs commit referencing this ADR. Complies with implementation charter v1.4.0.

**Implementation-detail acknowledgments** (v3 absorbed from review):

- `prior_audit_chain_link_hash` is NOT a schema field on the WorkspaceContext record. It is an input to the `audit_chain_link_hash` canonical-concatenation computation at Ring 1 mint time. Chain-link continuity is enforced by Ring 1 storage on insert (Milestone 3 audit-events table), mirroring ADR 0049 §Decision posture. Schema PR reviewers should not expect a `prior_audit_chain_link_hash` Zod field.
- Genesis-collision defense for the same `(repository_id, canonical(worktree_path))` audit-chain root is a Milestone 3 audit-events table unique-constraint commitment, mirroring ADR 0049's Decision-side rule. The schema layer commits the `'GENESIS'` sentinel; Ring 1 storage enforces single-genesis-per-root.
- Canonical-concatenation field-order convention is per-entity: ADR 0050 places identity FKs first (`workspace_context_id`, `execution_context_id`, `repository_id`, `worktree_path`) while ADR 0049 places decision-action fields first (`decision_id`, `operation_shape_ref`, `outcome`, `reason_kind`). Each ADR commits its own canonical order; chain-integrity verifiers replay the same per-entity ordering.

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md` v1.4.0 — invariants 1, 4, 17, 19
- Decision ledger: `DECISIONS.md` (D-row to be added at acceptance)
- Related ADRs:
  - ADR 0031 v1 (Q-008(d) worktree-ownership composition; commits 1:1 cardinality with worktree)
  - ADR 0036 (Q-009 workspace manifest projection; §Layer 1 grounding requirement applies to `subject_kind: workspace_context`; reserves `audit_profile_snapshot.workspace_context_id` FK)
  - ADR 0037 (Q-010 cross-agent isolation; §Out of scope deferral for AgentClient × WorkspaceContext cardinality)
  - ADR 0048 (Phase 2.7 subject-kind grounding evaluation; dispositions inform future cardinality work)
  - ADR 0049 (Decision Ring 0 entity introduction; immediate predecessor in workflow-sequencing investigation §Step 1; audit_chain_link_hash + 'GENESIS' sentinel pattern reused here)
- Registry: `docs/host-capability-substrate/ontology-registry.md` v0.4.12 — §Subject-kind grounding requirement (line 443+), §Authority discipline (line 279+), §Kernel-trusted producer allowlist final state (line 798+), §Cross-context enforcement layer (line 546+), §Decision entity section (added by ADR 0049)
- Workflow-sequencing investigation: `docs/host-capability-substrate/research/local/2026-05-10-workflow-sequencing-investigation.md` §Step 1 entity #2 (WorkspaceContext)
- Outstanding-work sequencing workflow: `docs/host-capability-substrate/research/local/2026-05-09-outstanding-work-sequencing-workflow.md`
- Implementation rules: `IMPLEMENT.md` §Required subagent reviews
- Plan: `PLAN.md` §Milestone 1 acceptance (line 578 — 22 canonical Ring 0 entities)
- Schema source for related entities: `packages/schemas/src/entities/agent-client.ts` (schema pattern reference); `packages/schemas/src/entities/coordination-fact.ts` lines 76-83 (existing subject_ref schemas including `workspace_context` and `audit_profile_snapshot`); `packages/schemas/src/entities/verification-command-spec.ts` (existing `workspace_context_id` FK consumer)

### External

- None directly; this ADR composes existing internal posture.
