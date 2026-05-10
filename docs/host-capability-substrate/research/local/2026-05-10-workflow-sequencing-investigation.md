---
title: Workflow Sequencing Investigation
category: research
component: host_capability_substrate
status: planning-input
version: 0.1.0
last_updated: 2026-05-10
tags: [sequencing, ring-0, ring-1, ring-2, ring-3, milestone-1, phase-3, foundational-entities, decision, approval-grant, lease, workspace-context, run, trigger-detection, enforcement-gap]
priority: high
---

# Workflow Sequencing Investigation

## Status

Docs-only Ring 3 investigation. Records the empirical state of the substrate's foundation layers and proposes a sequencing recommendation that puts foundations and detection mechanisms in place for the registered rules to actually fire.

This investigation does NOT authorize schema, canonical policy YAML, Ring 1 services, adapters, dashboard routes, hooks, broker behavior, runtime behavior, provider mutation, or execution lanes. It records the state and the recommended order. Each authorization comes from a separate accepted ADR or from `system-config`.

## Empirical Baseline (2026-05-10 sweep)

### Ring 0 — `packages/schemas/src/entities/`

27 entity files containing Zod schemas. The set divides into:

**Foundational entities from Milestone 1's 22-entity canonical list (BUILT, 8 of 22):**

- `AgentClient` (Phase 2.1.1; ADR 0037)
- `OperationShape` (Phase 2.2.2; ADR 0029, ADR 0036, ADR 0047)
- `Evidence` (Phase 1; ADR 0023 base + many subtypes)
- `ExecutionContext` (Phase 1 / Phase 2.2.1; ADR 0021, ADR 0037)

**Phase 1 supplemental entities (BUILT, not in M1's canonical 22):**

- `EnvProvenance`
- `CredentialSource` (related to but distinct from M1's `SecretReference`)
- `StartupPhase`

**Coordination layer + envelopes + verification (BUILT, ADR 0019/0022/0036):**

- `BoundaryObservation` envelope + typed branches
- `CoordinationFact`, `DerivedSummary`, `KnowledgeSource`, `KnowledgeChunk`
- `QualityGate` (Phase 2.1.4; ADR 0035)
- `VerificationCommandSpec` (Phase 2.1.2; ADR 0036)

**Typed Evidence subtypes (BUILT, not in M1's canonical 22; introduced by Phase 2.x ADRs):**

- `RemoteAgentBaseImageObservation`, `RemoteAgentSetupReceipt`, `RemoteAgentNetworkPostureObservation` (ADR 0037)
- `RunnerHostObservation`, `RunnerIsolationObservation`, `WorkflowRunReceipt`, `CleanRoomSmokeReceipt`, `ResourceBudgetObservation`, `PolicyPlanReceipt` (ADR 0032)
- `GitIdentityBinding`, `ToolProvenance` (ADR 0034)
- Source-control receipts (ADRs 0027/0030/0033)
- `CredentialAuthorityObservation`, `MachineIdentityBindingObservation` (ADR 0043)
- Project-substrate receipts (ADR 0044)
- Backup-readiness receipts (ADR 0045)

### Ring 0 entities REQUIRED by Milestone 1 acceptance but NOT BUILT (14 of 22)

Per `PLAN.md` §Milestone 1 — Ontology schemas (Ring 0) §Acceptance, the canonical 22-entity list:

> "22 canonical entities (HostProfile, WorkspaceContext, Principal, AgentClient, Session, ToolProvider, ToolInstallation, ResolvedTool, Capability, OperationShape, CommandShape, Evidence, ExecutionContext, PolicyRule, Decision, ApprovalGrant, Run, Artifact, Lease, Lock, SecretReference, ResourceBudget) as Zod schemas."

Missing as Ring 0 Zod schemas (14):

- `HostProfile`
- `WorkspaceContext` (currently a `CoordinationFact.subject_kind` value + a string FK in `VerificationCommandSpec`; ADR 0031 v1 commits 1:1 cardinality with worktree)
- `Principal`
- `Session`
- `ToolProvider` (distinct from the `ToolProvenance` Evidence subtype)
- `ToolInstallation`
- `ResolvedTool`
- `Capability`
- `CommandShape` (downstream of OperationShape per charter inv. 2)
- `PolicyRule`
- `Decision` ←—— most-referenced missing entity
- `ApprovalGrant` ←—— second-most-referenced
- `Run`
- `Artifact`
- `Lease` ←—— third-most-referenced
- `Lock`
- `SecretReference` (distinct from `CredentialSource` entity)
- `ResourceBudget` (distinct from `ResourceBudgetObservation` Evidence subtype)

### Ring 1 — `packages/kernel/`

**Empty.** No `src/`, no source files. None of the kernel services described in charter §Ring 1 — host state, tool resolution, capability registry, policy/gateway, session ledger, evidence/cache, audit, lease manager, execution broker — exist.

### Ring 2 — `packages/adapters/`

Scaffold directories only. `mcp-stdio/`, `mcp-http/`, `dashboard-http/`, `cli/`, `claude-hooks/`, `codex-hooks/` are all empty packages. The `.claude/hooks/hcs-hook` helper script exists at the repo level but the adapter package implementations are unbuilt.

### Ring 3 — `packages/dashboard/` and `packages/evals/`

- `packages/dashboard/` — empty
- `packages/evals/regression/` — 38 trap scaffolds + `seed.md` + `trap-known-limitations.yaml`; no executable runner

## Findings

### F1: Phase 2 schema train has been Evidence-subtype expansion, not Milestone 1 completion

The Phase 2.1-2.7 schema train added many typed `Evidence` subtypes, the coordination layer (ADR 0019 v3), the boundary-observation payload bundle (Phase 2.2.3), and a handful of standalone entities (`AgentClient`, `VerificationCommandSpec`, `QualityGate`). Most of the schema work since Phase 1 has gone into *what evidence the substrate observes*, not *what the substrate decides, authorizes, runs, locks, or capabilities*.

The Milestone 1 canonical 22-entity list is roughly an **operational ontology**: it names the entities the substrate operates on (HostProfile, Principal, Session, Capability, OperationShape, CommandShape, Decision, ApprovalGrant, Run, Lease, Lock, etc.). Phase 2 added an **observational ontology** (Evidence subtypes) on top of partially-built operational foundations. The result is a substantial typed-evidence catalog but no decision/approval/run/lease records the kernel can mint.

### F2: Most "trigger-deferred" items are actually Ring-1-prerequisite

Per the 2026-05-09 trigger-detection-mechanism audit (in this conversation, prior turn):

| Trigger | Detection apparatus required | Currently exists? |
|---|---|---|
| `non_pr_remote_agent_binding_partial` rejection (ADR 0037 §c) | `Decision` entity + Ring 1 gateway + Layer 3 re-derive + producers emitting remote-agent subtypes | NO |
| `coordination_promotion_no_layer1_grounding` rejection (ADR 0036) | `Decision` entity + Ring 1 mint API + promotion-grant minting layer | NO |
| `cleanup_plan_authority_source_stale` rejection (ADR 0047) | `Decision` entity + Ring 1 mint API + gateway re-walk | NO |
| `cleanup_plan_target_under_active_lease` rejection (ADR 0047) | `Decision` entity + `Lease` entity + Ring 1 mint API | NO |
| AgentClient × WorkspaceContext conflict (ADR 0037 §Out of scope) | `WorkspaceContext` entity + Ring 1 gateway + multi-AgentClient evaluation logic | NO |
| Charter inv. 18 chain-walk rejection at typed-grant minting layer | `Decision` entity + Ring 1 mint API + `ApprovalGrant` entity | NO |
| Cleanup-plan class-I execution rejection (ADR 0047) | M4 stack: `ApprovalGrant` + `Lease` + audit hash chain + dashboard | NO |
| ADR 0039 wave-2 amendment trigger | Human post-merge review process | Soft / informal |
| Phase 2.6 executable trap fixture (with observed-incident citation) | Incident capture during agent sessions | Ad-hoc / informal |

**7 of 9 trigger-detection failures trace to the same two missing pieces: `Decision` Ring 0 entity + Ring 1 mint API.** The "trigger-deferred" framing presumes a detection apparatus that doesn't exist.

### F3: The substrate is in a registered-rules-rich, enforcement-poor state

Charter v1.4.0 has 19 invariants. Registry v0.4.11 has multiple discoverable rules: §Authority discipline, §Subject-kind grounding requirement, §Cross-context enforcement layer, §Audit-chain coverage of rejections, §Phase 2.7 candidate dispositions. 48 ADRs accepted. 36 D-rows (D-001 through D-036). Substantial vocabulary committed.

But none of those rules are operationally enforced anywhere. Enforcement requires:

- Ring 1 mint API to consume schema and emit typed Decision rejections — **doesn't exist**
- Ring 1 broker FSM to re-check at layer 2 — **doesn't exist**
- Ring 1 gateway re-derive at layer 3 — **doesn't exist**
- Audit hash chain to make rejections tamper-evident — **doesn't exist**
- Dashboard to surface state for human review — **doesn't exist**

The §Cross-context enforcement layer at registry line 476-480 explicitly says: "Schema (Zod) validation alone is **not** an enforcement layer for cross-context binding." Today, Zod validation is the only enforcement that exists. Every other layer is registered-but-unimplemented.

### F4: Phase 2.5 canonical policy YAML lane has the same prerequisite gap

The 2026-05-09 sequencing workflow names Phase 2.5 canonical policy YAML in `system-config` as the next substantive lane. That work IS authorable today (drafting tier rules, freshness windows, gate composition rules against existing Ring 0 entities + registered registry rules). But its consumer — the Ring 1 gateway / mint API that would actually evaluate operations against the policy — doesn't exist. So the policy YAML lands as another preparatory artifact until Ring 1 lands.

This isn't an argument against doing the policy YAML work. It's correctly preparatory. But the policy YAML doesn't unblock detection or enforcement on its own — it's a contract specification waiting for an enforcer.

### F5: Some Ring 0 work has been "above and beyond" while M1 itself is incomplete

The Phase 2 schema train added entities NOT in M1's canonical 22 list:

- `BoundaryObservation` (envelope + typed branches per ADR 0022)
- `KnowledgeSource`, `KnowledgeChunk`, `CoordinationFact`, `DerivedSummary` (per ADR 0019 v3)
- `QualityGate` (per ADR 0035)
- `VerificationCommandSpec` (per ADR 0036)
- ~13 typed Evidence subtypes (per various Q-row ADRs)

These are valuable, ontology-correct extensions. But M1's canonical 22 entities define what's needed for the kernel to operate, and the schema train chose to expand the observational vocabulary instead of completing the operational vocabulary. The expansion was driven by Q-row work (Q-005-Q-015) and reactive ADRs; the operational vocabulary was implicit in M2-M6 and never authored.

This isn't a criticism — the Q-row work surfaced concrete observational needs that wouldn't have been visible otherwise. But it does mean **Milestone 1 is materially incomplete** despite the appearance of substantial schema progress.

## The Sequencing Question

Phase 2 has been Ring 0 schema work focused on observations. Phase 3 (Ring 1 services) has not started. The implicit assumption was that completing the typed-evidence ontology would prepare the way for Ring 1.

But the typed-evidence ontology is not, by itself, the foundation Ring 1 needs. Ring 1 services consume:

- **Operations** (`OperationShape`) — BUILT
- **Decisions** (typed result of policy evaluation, with `reason_kind` enum) — NOT BUILT
- **Approvals** (typed authorization to proceed past a gate) — NOT BUILT
- **Runs** (typed record of an attempted execution) — NOT BUILT
- **Leases** (typed record of session-scoped resource holds) — NOT BUILT
- **Workspace context** (typed binding of session to workspace/worktree) — NOT BUILT
- **Capability registry** (typed record of what operations the substrate knows about) — NOT BUILT
- **Command shapes** (typed rendering of operations to argv) — NOT BUILT

Until at least the first 5-7 of those are built as Ring 0 schemas, no Ring 1 service can be built without leaking schema into kernel code (a charter inv. 1 violation by construction).

## Sequencing Recommendation

### Step 1 (HCS-local; foundational): complete Milestone 1's most-referenced missing entities

Priority order by dependency / number of registered rules referencing the entity:

1. **`Decision`** (priority: highest)
   - Referenced by: every `reason_kind` reservation across the registry; chain-walk rejection clause in inv. 18; cleanup-plan reason_kind reservations (ADR 0047); ADR 0029 v2 §Closed-list fail-mode tightening rule; ADR 0039 inv. 18 promotion-rejection records; §Audit-chain coverage of rejections rule
   - Schema PR scope: Zod entity (`decision_id`, `operation_shape_ref`, `reason_kind`, `actor`, `valid_until`, `audit_chain_link_hash`, `evidence_refs`) + initial reason_kind union from existing reservations + tests
   - Required reviewers: `hcs-architect`, `hcs-ontology-reviewer`, `hcs-policy-reviewer` (entity classifies operations), `hcs-security-reviewer` (audit-chain integrity)
   - Estimated: medium ADR + medium schema PR, 1-2 reviewer rounds

2. **`WorkspaceContext`** (priority: highest)
   - Referenced by: `CoordinationFact.subject_kind` value (subject_ref schema currently uses string FK); `VerificationCommandSpec.workspace_context_id` (string FK); ADR 0031 v1 (1:1 cardinality with worktree); ADR 0036 §Layer 1 grounding requirement; ADR 0037 §Out of scope (the AgentClient × WorkspaceContext deferral); ADR 0048 dispositions (cross-context binding inheritance)
   - Schema PR scope: Zod entity (`workspace_context_id`, `worktree_ref`, `repository_id`, `created_at`, `valid_until`) + upgrade `CoordinationFact.subjectRefSchemas` map + tests
   - Required reviewers: `hcs-architect`, `hcs-ontology-reviewer`
   - Estimated: small ADR + small schema PR, 1 reviewer round

3. **`ApprovalGrant`** (priority: high)
   - Referenced by: ADR 0036 `human_dashboard_grant` deletion authority kind; ADR 0035 `gate_evidence_acknowledgment` required_grant_kind; M4 stack (charter inv. 7); ADR 0047 §Future amendments cleanup execution wiring; charter inv. 18 typed-grant minting layer
   - Schema PR scope: Zod entity (`approval_grant_id`, `scope`, `grantor_principal_ref`, `valid_until`, `minted_for_decision_id`, `audit_chain_link_hash`) + scope shape per ADR 0035 + tests
   - Required reviewers: `hcs-architect`, `hcs-ontology-reviewer`, `hcs-policy-reviewer`, `hcs-security-reviewer` (approval scope shape + grant lifecycle)
   - Estimated: medium-to-large ADR + medium schema PR, 2 reviewer rounds (similar to ADR 0047 cycle)

4. **`Lease`** (priority: high)
   - Referenced by: ADR 0031 v1 worktree-lease taxonomy; `subject_kind: leased_to` FK target; ADR 0047 `cleanup_plan_target_under_active_lease` rejection; M4 stack (charter inv. 7)
   - Schema PR scope: Zod entity (`lease_id`, `lease_kind`, `lease_state` per ADR 0031, `holder_session_id`, `valid_until`, `lease_acquired_at`) + lease_kind initial enum + tests
   - Required reviewers: `hcs-architect`, `hcs-ontology-reviewer`, `hcs-security-reviewer` (session-scoped resource holds)
   - Estimated: small-to-medium ADR + small schema PR, 1-2 reviewer rounds

5. **`Run`** (priority: medium)
   - Referenced by: `Evidence.run_id` field; audit-chain coverage of executions; charter inv. 7 (mutation receipts must reference a Run); registry §Knowledge and coordination enum mirrors derived-from rules
   - Schema PR scope: Zod entity (`run_id`, `run_kind`, `invoker_session_id`, `outcome`, `started_at`, `ended_at`, `audit_chain_link_hash`) + tests
   - Required reviewers: `hcs-architect`, `hcs-ontology-reviewer`
   - Estimated: small ADR + small schema PR, 1 reviewer round

Each schema PR follows `.agents/skills/hcs-schema-change`. Total Step 1 estimated effort: 5 ADR + schema-PR cycles, paced similarly to ADR 0047 / ADR 0048 (1-2 weeks per cycle at the current cadence; faster if batched).

### Step 2 (parallel-OK; cross-repo): Phase 2.5 canonical policy YAML in `system-config`

Per the 2026-05-09 sequencing workflow §Step 2. Lives in `~/Organizations/jefahnierocks/system-config/policies/host-capability-substrate/`. Out of scope from this workspace.

This step IS parallelizable with Step 1. The policy YAML drafts against the existing Ring 0 entities + registered registry rules. When Step 1 entities land, the policy YAML can be reviewed for any necessary tightening. Both Step 1 and Step 2 are preparatory — Ring 1 enforcement requires both.

### Step 3 (HCS-local): less-critical Ring 0 foundational entities

When and only when Step 1 demonstrates the entity-introduction cadence is sustainable, batch the remaining M1 entities:

- **Tool-resolution chain**: `ToolProvider` + `ToolInstallation` + `ResolvedTool` (one ADR + one schema PR; required for M4's `system.tool.resolve.v1`)
- **Capability registry**: `Capability` (required for M4's MCP tool registration; depends on OperationShape)
- **Command rendering**: `CommandShape` (downstream of OperationShape per charter inv. 2; required for any execution-rendering work)
- **Policy schema**: `PolicyRule` (Zod schema for the canonical policy YAML in system-config; required for M2's policy loader)
- **Identity/session**: `Principal` + `Session` (required for M3-M4)
- **Storage primitives**: `Lock`, `Artifact`, `SecretReference`, `ResourceBudget`, `HostProfile` (required for various M3-M4 surfaces)

Most of these can land in batched ADRs grouping related entities.

### Step 4 (HCS-local; Phase 3): begin Ring 1 services

Precondition: Step 1 + Step 3 partial coverage of Capability/CommandShape/PolicyRule.

Order per existing `PLAN.md` Milestones 3-5:

1. **Storage layer** (Milestone 3): SQLite WAL + audit hash chain + facts table. Lives at `packages/kernel/src/storage/`.
2. **Mint API** (per ADR 0019 v3 §Three-layer enforcement model layer 1): consumes Ring 0 entities; emits Decision records; enforces grounding/chain-walk rules. Lives at `packages/kernel/src/mint/`.
3. **Lease manager**: manages Lease lifecycle. Lives at `packages/kernel/src/lease/`.
4. **Broker FSM re-check layer** (per registry §Cross-context enforcement layer layer 2): composes with mint API. Lives at `packages/kernel/src/broker/`.
5. **Gateway** (Milestone 5; the layer-3 re-derive): composes Decisions + ApprovalGrants + Lease state. Lives at `packages/kernel/src/gateway/`.
6. **Capability registry + tool resolution + host state + session ledger**: per Milestones 3-4.

Each Ring 1 service is a substantial implementation. Rough estimate: 2-3 substantial PRs per service including tests. ~15-20 PRs total for a minimum-viable Ring 1 kernel.

### Step 5 (HCS-local; Phase 4): Ring 2 adapters

Precondition: Ring 1 minimum-viable kernel.

Per the existing M4-M6 milestone definitions:

- MCP stdio adapter (M4 — first read-only tools)
- Dashboard HTTP adapter (M5 — read-only views)
- Hook integration (M6 — Claude/Codex hooks calling Ring 1)

### Step 6 (HCS-local; Phase 5): Ring 3 workflows + regression runner

Precondition: Ring 2 adapters.

Per M6 acceptance — regression corpus runner executing the seed traps against agents.

## Stop Rules

Stop and return to human review if a task tries to:

- open Ring 1 service work before the foundational Ring 0 entities (`Decision`, `WorkspaceContext`, `ApprovalGrant`, `Lease`, `Run` at minimum) land
- expand Evidence subtype work without showing a Ring 1 consumer or a registered-rule precondition (we have many Evidence subtypes already; further expansion may not unblock anything without a kernel)
- treat Phase 2.5 canonical policy YAML as a substitute for Ring 1 service implementation
- treat schema-only enforcement (Zod refinements) as a substitute for Ring 1 mint API enforcement (registry §Cross-context enforcement layer §Schema validation alone is not an enforcement layer rule explicitly forbids this)
- author registry rules without naming the Ring 1 service that will enforce them
- mark a trigger-deferred item as actionable without confirming the detection apparatus exists
- skip the entity classification step (per registry §Procedure for adding a new subject_kind value rule + ADR 0048 disposition rules) when introducing a new subject_kind

## Reframe

The substrate's "trigger-deferred" lanes are actually **foundation-prerequisite lanes**. The blockers are not external events; they are unbuilt Ring 0 entities and unbuilt Ring 1 services.

The proper next move is not "wait for triggers" but:

1. Complete Milestone 1's foundational entities (`Decision`, `WorkspaceContext`, `ApprovalGrant`, `Lease`, `Run` — and incrementally the rest of the M1 list).
2. Author Phase 2.5 canonical policy YAML in `system-config` in parallel.
3. Begin Phase 3 Ring 1 services per the existing PLAN.md M3-M5 milestone definitions.

Phase 2.5 canonical policy YAML lane CAN proceed in parallel because it's drafting policy schema, not building enforcement. Both Step 1 and Step 2 are preparatory; Ring 1 enforcement requires both.

After Ring 1 minimum-viable kernel exists, the trigger-deferred items become actually-detectable:

- `Decision`-emitting mint API surfaces all the rejection-class triggers (chain-walk, grounding, cleanup-plan-stale, target-under-lease)
- Gateway re-derive surfaces the binding-failure triggers (non-PR remote-agent partial binding, AgentClient × WorkspaceContext conflict)
- Audit hash chain surfaces audit-chain coverage triggers
- Dashboard surfaces human-review triggers (wave-2 amendment, trap fixture incidents)

The substrate's well-typed observation ontology + registered rules will then have an enforcement target. The 19 charter invariants and the registered registry rules will become operationally binding rather than posture-only.

## What this investigation does NOT do

- Author any schema (no Zod source changes)
- Author any policy YAML
- Begin any Ring 1 service implementation
- Authorize any of the M1 foundational-entity ADRs (each requires its own ADR + schema PR cycle)
- Modify the existing PLAN.md milestone definitions (the milestones remain as authored; this investigation observes that M1 is incomplete and recommends order)
- Pre-empt the Phase 2.5 sequencing workflow (which remains in force; this investigation supplements it by surfacing the Ring-1-prerequisite gap)
- Modify charter invariants, ADR dispositions, or registry vocabulary

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md` v1.4.0 — §The four rings (lines 18-38), §Non-negotiable invariants (lines 40-78), §Package boundary enforcement (lines 80-99)
- Decision ledger: `DECISIONS.md` (D-001 to D-036; 12 Q-rows accepted)
- Plan: `PLAN.md` §Milestone 0 (line 545), §Milestone 1 — Ontology schemas (Ring 0) (line 572), §Milestone 2 — Policy snapshot + decision package (line 593), §Milestone 3 — SQLite audit/facts bootstrap (line 615), §Milestone 4 — First MCP read tools (line 637), §Milestone 5 — Gateway propose + dashboard summary (line 661), §Milestone 6 — Hooks wired + regression corpus runner (line 683)
- Registry: `docs/host-capability-substrate/ontology-registry.md` v0.4.11 — §Authority discipline, §Cross-context enforcement layer (line 443+), §Audit-chain coverage of rejections (line 499+), §Subject-kind grounding requirement, §Phase 2.7 candidate dispositions
- Outstanding-work sequencing workflow: `docs/host-capability-substrate/research/local/2026-05-09-outstanding-work-sequencing-workflow.md`
- Schema-change skill: `.agents/skills/hcs-schema-change/SKILL.md`
- Implementation rules: `IMPLEMENT.md` §Required subagent reviews, §Change classes
- Schema source: `packages/schemas/src/entities/` (27 entity files; verified 2026-05-10)
- Empty Ring 1: `packages/kernel/` (verified empty 2026-05-10)
- Empty Ring 2 adapter packages: `packages/adapters/{mcp-stdio,mcp-http,dashboard-http,cli,claude-hooks,codex-hooks}/` (verified empty 2026-05-10)
- Empty Ring 3 dashboard: `packages/dashboard/` (verified empty 2026-05-10)

### External

- Upstream research plan (canonical): `~/Organizations/jefahnierocks/system-config/docs/host-capability-substrate-research-plan.md`

## Change Log

| Version | Date | Change |
|---|---:|---|
| 0.1.0 | 2026-05-10 | Initial workflow sequencing investigation. Records empirical state of Ring 0/1/2/3 layers (8 of 22 M1 canonical entities built; Ring 1/2/3 packages empty), traces 7 of 9 trigger-detection failures to the missing `Decision` entity + missing Ring 1 mint API, and recommends sequencing: complete Milestone 1 foundational entities first (`Decision`, `WorkspaceContext`, `ApprovalGrant`, `Lease`, `Run` priority-ordered), author Phase 2.5 canonical policy YAML in system-config in parallel, then begin Phase 3 Ring 1 services per existing PLAN.md milestone definitions. |
