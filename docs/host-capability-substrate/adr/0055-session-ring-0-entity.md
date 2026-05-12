---
adr_number: 0055
title: Session Ring 0 entity introduction
status: accepted
date: 2026-05-11
charter_version: 1.4.0
tags: [session, ring-0, milestone-1, foundational-entity, session-kind, identity-binding, charter-v1-4-0, registry-v0-4-17-pending-v0-4-18, workflow-sequencing-step-3, post-step-1-source-landing, adr-0031-followup, adr-0051-v4-followup, adr-0054-followup, attribution-discipline]
---

# ADR 0055: `Session` Ring 0 entity introduction

## Status

`accepted`

Accepted 2026-05-11 (v2 ready-for-acceptance from all four required
reviewers: `hcs-architect`, `hcs-ontology-reviewer`,
`hcs-policy-reviewer`, `hcs-security-reviewer`). Two mechanical tweaks
at acceptance: (MT-1, architect N-1 absorbed) §Status v2 absorption
block arrow notation clarified — the v1 broken-citation LHS in the
"Architect B3 + Ontology B-2/B-3" bullets was lost when v1→v2
`replace_all` corrections were applied; v2 absorption text now reads
`(v1: lease.ts:101) → (v2-verified: lease.ts:103)` and similar for
run.ts to preserve the historical record. (MT-2, architect F-2 +
ontology F-1 absorbed) D-044 row added to DECISIONS.md recording both
v1 dispatch + v2 absorption cycle per the established foundational-
entity-train discipline. v1 dispatch (commit `4e8fe23`) returned
architect blockers (B1 lifecycle naming-and-precedent divergence; B3
schema-source line citations stale; B4 registry line citations stale)
+ ontology blockers (B-2/B-3 schema-source line citation drift;
B-4/B-6/B-7/B-8/B-9 registry line citation drift, 7 total stale
citations); policy + security returned ready-for-acceptance on v1
outright. v2 (commit `1ba8a2c`) absorbed all 11 blockers (architect 4
+ ontology 7 — Architect B2 was withdrawn as verified-accurate on
review). v2 ready-for-acceptance from architect + ontology + policy +
security with no new blockers. Cycle-time: 2 revisions (matches ADR
0049 + ADR 0052 + ADR 0054 efficiency tier). D-044 records.

Drafted 2026-05-11 immediately after the workflow-sequencing investigation
§Step 3 entity #1 (Principal, ADR 0054 / D-043) landed as Ring 0 source
(commit `8382194 schemas: land adr 0054 principal + self-approval rejection
rule registry section ADD`). Session is the second of two highest-coupling
remaining M1 entities per the post-Step-1-source-landing PLAN.md §Current
Focus rewrite.

(Original "## Status / `proposed`" header retained below in the
revision history block for historical clarity.)

## Status (original proposed-stage content; retained for revision history)

`proposed` (superseded by `accepted` above)

Drafted 2026-05-11 immediately after the workflow-sequencing investigation
§Step 3 entity #1 (Principal, ADR 0054 / D-043) landed as Ring 0 source
(commit `8382194 schemas: land adr 0054 principal + self-approval rejection
rule registry section ADD`). Session is the second of two highest-coupling
remaining M1 entities per the post-Step-1-source-landing PLAN.md §Current
Focus rewrite.

**Revision history**:

- **v1** (commit `4e8fe23`) dispatched the four required reviewers in
  parallel. Architect + ontology returned blockers; policy + security
  returned ready-for-acceptance. v2 absorbs:
  - **Architect B1 (lifecycle naming-and-precedent divergence)**: v1
    repeatedly claimed `sessionStateSchema = z.enum(['active',
    'ended'])` "mirrors `agentClientStateSchema` /
    `workspaceContextStateSchema` / `principalStateSchema` lifecycle
    patterns." Verification: all three of those entities use
    `['active', 'retired']`, NOT `['active', 'ended']`. The v1
    "mirrors" framing was value-name-wrong. v2 reframes as a
    **deliberate divergence**: Session lifecycle uses `ended`
    (not `retired`) because Session is a **transient invocation**
    (single-execution-context-bound; ends when the agent disconnects
    / CLI exits / IDE workspace closes) rather than a **long-lived
    identity** (AgentClient is an agent product/build; WorkspaceContext
    is a worktree binding; Principal is an actor identity — all three
    are reusable across invocations and "retire" when their referent
    becomes inactive across the wider substrate). Session shares
    cardinality with the three long-lived precedents (1 active + 1
    terminal at v1) but the value-name divergence reflects the
    semantic divergence. Mirror claims rewritten to cite cardinality-
    mirror only and explicitly contrast value semantics.
  - **Architect B3 + Ontology B-2**: v1 cited `lease.ts:101`; actual
    is `lease.ts:103` (held_by_session_id). Corrected to
    `lease.ts:103` throughout v2. Stale citation; mechanical fix.
  - **Architect B3 + Ontology B-3**: v1 cited `run.ts:110`; actual is
    `run.ts:104` (invoker_session_id). Corrected to `run.ts:104`
    throughout v2. Stale citation; mechanical fix.
  - **Architect B4 + Ontology B-4/B-6/B-7/B-8/B-9**: registry line
    citations drifted past current section headings. v2 corrected:
    §Kernel-trusted producer allowlist final state line 867 → 899;
    `kernel_principal_resolver` row line 893 → 910; §ADR 0049-0054
    enum mirrors line 2493 → 2504; §Self-approval rejection rule line
    2408 → 2419; §Audit-chain coverage of rejections line 671 → 686;
    §Current schema-version ledger line 871 → 882; §Subject-kind
    grounding requirement line 512 → 527; §Cross-context enforcement
    layer line 615 → 630. All citation drift was systematic (+11 to
    +27 in the lower half), consistent with drafting off a
    pre-Principal-landing snapshot.
  - **Security N1 absorbed**: NEW §Implementation-detail
    acknowledgment naming the `kernel_session_resolver` Ring 1
    sandbox-source rejection guard requirement explicitly (invocation
    evidence must carry non-sandbox `authority` per inv. 8 / inv. 18).
  - **Security N4 absorbed**: NEW §Implementation-detail
    acknowledgment that Ring 1 mint API at
    `packages/kernel/src/session/` will reject Session creation if
    any cited binding evidence carries `authority: 'sandbox-observation'`
    or `authority: 'self-asserted'`.

- **v2 (this revision)** preserves all v1 substantive design decisions
  (single-value `session_kind` v1 enum, YES execution_context_id on
  envelope, NO chain-walk envelope superRefine, envelope-only-kernel-
  set posture, NEW `kernel_session_resolver` producer, 4 NEW
  Decision.reason_kind reservations, length-prefix discipline
  extension to ADRs 0049-0055, 14-item registry change-set, 7-step
  §Procedure rule). Only the v1 mechanical-citation and lifecycle-
  framing imprecisions changed.

## Date

2026-05-11

## Charter version

Written against charter v1.4.0 and `docs/host-capability-substrate/ontology-registry.md`
v0.4.17. Forward-looking citation per the established pattern — ADR 0055
reserves v0.4.18 for its own registry change-set docs commit.

## Reviews

This ADR introduces the seventh foundational Ring 0 entity (counting the
just-landed five from ADRs 0049-0053 plus Principal from ADR 0054).
`Session` is M1 acceptance criterion #5 and the typed FK target for:

- `Lease.held_by_session_id` (ADR 0031 v1 + ADR 0052)
- `Run.invoker_session_id` (ADR 0053)
- The "consuming session" reference in ADR 0051 v4 §Self-approval
  rejection rule (consuming session's `principal_id` is compared
  against `ApprovalGrant.grantor_principal_ref` per the now-typed-FK
  closure committed by ADR 0054)
- The "requesting session" reference in ADR 0031 v1 §Holder-only
  release rule (UUID-byte-equality comparison per ADR 0052 §Identity
  comparison form)
- ADR 0030 v2 §`owning_session_id` source-control evidence binding

Required reviewer dispatch per `IMPLEMENT.md` §Required subagent reviews:

- `hcs-architect` — mandatory for any ADR
- `hcs-ontology-reviewer` — mandatory; ADR introduces a new Ring 0
  entity with a `session_kind` discriminator + lifecycle enum + producer
  allowlist extension + audit-chain integration; closes 4 forward-
  reference typed FK targets across ADRs 0030/0031/0051 v4/0052/0053
- `hcs-policy-reviewer` — mandatory; `Session` records carry the
  authenticated identity that holds leases, invokes runs, and is
  compared in self-approval rejection; identity-binding rules are
  policy-adjacent
- `hcs-security-reviewer` — mandatory; `Session` carries authentication-
  derived identity binding (FK to Principal + AgentClient +
  ExecutionContext); producer-allowlist closure protects against agent
  self-identification; ADR 0036 §Layer 1 grounding requirement governs
  synthetic-identity rejection; the typed-FK closure for the
  consuming-session principal_id surface in ADR 0051 v4 §Self-approval
  rejection rule depends on Session landing

## Context

The 2026-05-10 workflow-sequencing investigation §Step 3 names `Session`
as the second of two highest-coupling remaining M1 entities after
Principal (ADR 0054 / D-043). With Principal landed at commit `8382194`,
Session is the next entity to land per the §Step 3 priority order.

**Pre-committed design points (must compose with)**:

- **ADR 0031 v1 §Acceptance note Mechanical Tweak #8 (Security-C; lines
  65-69)** explicitly commits `Session.execution_context_id` as the
  authoritative FK that Layer 1 mint API checks for cross-context
  equality with WorkspaceContext when leases are acquired. Reaffirmed
  in §Cross-context binding rules per Ring 1 layer (lines 567-571).
  This ADR composes with that commitment: Session records carry
  `execution_context_id` set at mint time, and the Layer 1 mint API
  enforces equality with the requesting session's execution_context_id
  for Lease acquire (per ADR 0052 §Decision §scope.worktree fields) +
  Run invocation (per ADR 0053 §Decision §Cross-context binding
  triple-equality).
- **ADR 0031 v1 §Authority discipline (lines 595-607)** classifies the
  Session-related fields as kernel-set: `session_id`,
  `held_by_session_id` (on Lease, references this Session), `owning_
  session_id` (on source-control evidence, references this Session).
- **ADR 0030 v2 §Stage-2 source-control evidence (line 245)** commits
  `owning_session_id` as kernel-set, referencing this Session entity
  for source-control evidence-event ownership.
- **ADR 0051 v4 §Self-approval rejection rule (lines 244-250)** + ADR
  0054 §Decision §Cross-record commitments deferred to Ring 1 mint
  API §3 commit the comparison rule `ApprovalGrant.grantor_principal_
  ref == consuming_session.principal_id` for non-readonly
  OperationShape.operation_class. The "consuming session" reference
  gains a typed Ring 0 target when this ADR lands; its `principal_id`
  becomes a typed FK to Principal (closes ADR 0054 §Future amendments
  §Session Ring 0 entity introduction).
- **ADR 0052 §Decision §Holder-only release rule (lines 119-122)**
  commits the `requesting_session_id == held_by_session_id` UUID-byte-
  equality comparison at Layer 1 mint API. The "requesting session"
  reference gains a typed Ring 0 target when this ADR lands.
- **ADR 0053 §Decision §Cross-context binding (lines 122-128)** commits
  the triple cross-context equality `Run.execution_context_id ==
  invoker_session.execution_context_id == authorizing_decision.
  execution_context_id`. The "invoker session" reference is the
  `Run.invoker_session_id` typed FK to this Session entity. Layer 1
  mint API enforces the equality at Run creation time; rejection emits
  `Decision.reason_kind: 'run_invoker_session_mismatch'` (already
  reserved per ADR 0053).
- **ADR 0037 §AgentClient × Session attribution (per ADR 0053 §Decision
  §invoker_agent_client_id)** commits that every Session carries an
  `agent_client_id` FK to AgentClient (the agent product/build that
  the session is invoked from). Mirrors the Lease.held_by_agent_
  client_id pattern per ADR 0031 v1 line 270-272.
- **`Evidence.subject_kind: 'session'` already exists** in
  `evidenceSubjectKindSchema` (verified at
  `packages/schemas/src/entities/evidence.ts:28`). This ADR does NOT
  modify `evidenceSubjectKindSchema` and does NOT bump
  `Evidence.schema_version`. Mirrors ADR 0054 / ADR 0053 / ADR 0052 /
  ADR 0051 v4 framing for existing subject_kinds.
- **M1 acceptance criterion #5**: `Session` in the canonical 22-entity
  list (PLAN.md line 672+).

**Current state.** Without a Ring 0 `Session` schema:

- `Lease.held_by_session_id` (ADR 0052) has an `entityIdSchema`-shape
  forward reference with no typed Ring 0 target
- `Run.invoker_session_id` (ADR 0053) has the same forward-reference
  posture
- The "consuming session" reference in ADR 0051 v4 + ADR 0054 §Self-
  approval rejection rule has no typed Ring 0 target for the
  `principal_id` lookup
- ADR 0030 v2 `owning_session_id` source-control evidence binding has
  no typed Ring 0 target
- M1 acceptance criterion #5 (Session in the canonical 22-entity list)
  remains unmet

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

The constraint stack: charter v1.4.0 inv. 1 (canonical-typed-evidence),
inv. 4 (audit logging), inv. 5 (no resolved secret material — Session
carries typed identity FKs only, never secrets), inv. 8 (no
sandbox→stronger — Ring 1 producer-allowlist closure on
`kernel_session_resolver`; chain-walk-on-binding-evidence deferred to
Ring 1 mint API per the typed-identity-envelope precedent), inv. 17
(execution context declared — `Session.execution_context_id` is
kernel-set, required), inv. 18 (chain-walk rejection — deferred to
Ring 1 per the typed-identity-envelope precedent), inv. 19 (freshness-
bound — `ended_at` non-null when ended).

## Options considered

### Option A — Minimal entity with `session_kind` enum + execution_context binding at the envelope (this ADR's choice)

`sessionKindSchema = z.enum(['agent_invocation'])` at v1 (single-value
closed enum mirroring ADR 0052 + ADR 0053 single-value v1 patterns).
`session_state = z.enum(['active', 'ended'])` lifecycle. NEW
`kernel_session_resolver` producer (mirrors ADR 0037
`kernel_agent_client_resolver` + ADR 0054 `kernel_principal_resolver`
precedents). YES `execution_context_id` field on envelope (Session is
execution-context-BOUND, mirrors WorkspaceContext, NOT Principal/
AgentClient).

**Pros**:

- Smallest v1 scope; aligns with foundational-entity v1 minimality
  discipline (ADRs 0049-0054 pattern)
- `execution_context_id` on the envelope correctly operationalizes
  ADR 0031 v1 Mechanical Tweak #8 — Layer 1 mint API has a typed FK
  field to compare against WorkspaceContext.execution_context_id and
  Run.execution_context_id
- Future session_kinds (dashboard, system_task) land via the §Procedure
  rule with their own producer attribution + lifecycle rules
- Closes 4 forward-reference typed FK targets in a single landing
- Mirrors the proven AgentClient + Principal + WorkspaceContext typed-
  identity-envelope pattern (no chain-walk envelope superRefine;
  defers inv. 8 + inv. 18 to Ring 1 producer-allowlist closure)

**Cons**:

- Pre-commits the execution-context-binding posture for Session at the
  entity layer (vs Principal which is execution-context-independent).
  Defensible because Sessions ARE execution-context-bound by
  construction (a session runs in ONE execution context; if it crosses
  contexts, that's a new session).

### Option B — Multi-`session_kind` v1 with placeholder branches for dashboard + system_task

Commit `sessionKindSchema = z.enum(['agent_invocation', 'dashboard',
'system_task'])` at v1 with minimal placeholder shapes for the latter
two.

**Cons**:

- "Enum value without scope semantics" trap from ADR 0051 v2/v3 (the
  inherited_from_gate lesson) — the latter two kinds have no committed
  producer + invoker + lifecycle semantics at v1
- `dashboard` session_kind would require `kernel_dashboard` producer,
  which is deferred to the coordinated future ADR per ADRs 0051 v4 /
  0052 / 0053 / 0054 scope discipline
- `system_task` session_kind would require `system_principal` Zod-
  defined extension per ADR 0054 §Future amendments, which is also
  deferred
- Premature design risk

### Option C — No `session_kind` discriminator at v1 (monolithic Session entity)

A Session entity with just identity + lifecycle + FK bindings, no kind
discriminator.

**Cons**:

- Breaks the discriminator-at-v1 established pattern (Decision.outcome,
  ApprovalGrant.grant_kind, Lease.lease_kind, Run.run_kind,
  Principal.principal_kind)
- Future session_kinds would require either a schema_version bump to
  add the discriminator OR a separate Session-like entity (substrate
  fragmentation)
- The workflow-sequencing investigation §Step 3 line 244 names
  `session_kind` as anticipated future scope (per the ADR 0036
  §Sub-decision (d) cycle-history.md ratification verifier-session
  binding rule which already anticipates kind-aware identity flows)

**Rejected.**

## Decision

**Option A.** Minimal `Session` Ring 0 entity with `sessionKindSchema =
z.enum(['agent_invocation'])` at v1; YES `execution_context_id` field
on envelope; envelope-only-kernel-set posture; NO chain-walk envelope
superRefine; detailed kind-binding-resolution rules deferred to Ring 1
mint API + future Q-row + future coordinated change-set ADRs.

v1 Session entity carries:

- `schema_version` — entity-specific literal `'0.1.0'` via
  `sessionSchemaVersionSchema = z.literal('0.1.0')`. Joins the
  established sibling-co-commitment cohort (the 12 entity-specific
  literals after the ADR 0054 Principal landing at commit `8382194`).
  `sessionSchemaVersionSchema` joins as the thirteenth literal.
- `session_id` — `entityIdSchema` (kernel-set). Closes the typed FK
  target for `Lease.held_by_session_id` (ADR 0052), `Run.invoker_
  session_id` (ADR 0053), ADR 0030 v2 `owning_session_id`, and the
  "consuming session" + "requesting session" references in ADRs
  0031 v1 / 0051 v4 / 0052 / 0054.
- `session_kind` — `sessionKindSchema = z.enum(['agent_invocation'])`
  (kernel-set; v1 closed enum, single value; extensible per the
  registered §Procedure rule). Registry-canonical reservations:
  `dashboard` (paired with the future `kernel_dashboard` producer ADR
  per ADRs 0051 v4 / 0052 / 0053 / 0054 deferral) and `system_task`
  (paired with the future `system_principal` Zod-defined extension
  per ADR 0054 §Future amendments).
- `session_state` — `sessionStateSchema = z.enum(['active', 'ended'])`
  (kernel-set; **cardinality** matches AgentClient + WorkspaceContext
  + Principal (1 active + 1 terminal at v1) but **value-name diverges
  intentionally**: Session uses `ended` (not `retired`) because Session
  is a transient invocation rather than a long-lived identity — see
  §Status revision history v2 absorption of architect B1).
- `agent_client_id` — `entityIdSchema` (kernel-set; FK to the
  AgentClient that the session is invoked from). Mirrors the
  Lease.held_by_agent_client_id pattern per ADR 0031 v1 line 270-272
  and Run.invoker_agent_client_id pattern per ADR 0053 §Decision.
  Required at v1 because `session_kind: 'agent_invocation'` semantically
  implies an invoking agent; future `system_task` kind may relax this
  to nullable per the §Procedure rule.
- `principal_id` — `entityIdSchema` (kernel-set; FK to the Principal
  authenticated for this session). Closes the consuming-session
  `principal_id` typed-FK target for the ADR 0051 v4 §Self-approval
  rejection rule (per ADR 0054 §Cross-record commitments §3); the FK
  resolution becomes typed when this ADR lands.
- `execution_context_id` — `entityIdSchema` (**kernel-set**; per ADR
  0031 v1 Mechanical Tweak #8 / Security-C). Sessions are execution-
  context-BOUND at the entity layer (mirrors WorkspaceContext, NOT
  Principal/AgentClient). Layer 1 mint API enforces equality checks
  against this field per ADR 0031 v1 + ADR 0050 + ADR 0052 + ADR 0053
  cross-context binding rules. Sessions that cross execution contexts
  are NEW Session records, NOT the same Session with a re-bound
  execution_context_id.
- `started_at` — `isoDateTimeSchema` (kernel-set; the timestamp the
  session began).
- `ended_at` — `isoDateTimeSchema.nullable()` (kernel-set; null while
  `session_state == 'active'`; set on lifecycle transition to
  `'ended'`). Same-record refinement enforces the state ↔ ended_at
  correlation (the **state-↔-nullable-timestamp refinement shape**
  mirrors Run per ADR 0053 + Lease per ADR 0052 + WorkspaceContext
  per ADR 0050, even though the specific timestamp-field name and
  terminal-state name differ per entity-semantic conventions).
- `producer` — `sessionProducerSchema = z.enum(['kernel_session_
  resolver'])` (kernel-set; named enum schema for forward-compatible
  allowlist widening; mirrors `principalProducerSchema` +
  `workspaceContextProducerSchema` + `approvalGrantProducerSchema`
  patterns). NEW kernel-trusted producer added to registry §Kernel-
  trusted producer allowlist final state; mirrors the ADR 0037
  `kernel_agent_client_resolver` + ADR 0054 `kernel_principal_resolver`
  precedents. The Ring 1 service that resolves Session records from
  invocation evidence (MCP server connection, CLI invocation, IDE
  workspace open, etc.) lives at `packages/kernel/src/session/` per
  workflow-sequencing investigation §Step 4. Future producers (e.g.,
  `kernel_dashboard` for dashboard sessions) land via separate
  coordinated change-set ADRs per the established discipline.
- `audit_chain_link_hash` — `sha256DigestSchema` (required, non-empty,
  sha256-shape-validated; mirrors prior foundational-entity
  audit_chain_link_hash co-commitments). Hash covers the canonical
  concatenation of `session_id || session_kind || session_state ||
  agent_client_id || principal_id || execution_context_id ||
  started_at || (ended_at || '') || producer ||
  canonical(evidence_refs) || prior_audit_chain_link_hash`. **The
  `||` notation denotes length-prefix-encoded concatenation** per the
  ADR 0051 v4 retroactive posture rule (now extended to ADRs
  0049-0055). `schema_version` is intentionally excluded from the
  canonical concatenation per the established precedent. Genesis
  Session policy: same `'GENESIS'` sentinel rule.
- `evidence_refs` — `z.array(evidenceRefSchema).min(1)` (kernel-set
  producer evidence; mirrors AgentClient + WorkspaceContext + Principal
  plain-evidenceRefSchema pattern). The chain-walk rejection refinement
  is **NOT** present at the schema layer (mirrors the typed-identity-
  envelope precedent established by AgentClient + WorkspaceContext +
  Principal); inv. 8 + inv. 18 enforcement deferred to Ring 1 mint API
  via producer-allowlist closure on `kernel_session_resolver` (kernel-
  trusted producers cannot accept sandbox-observation authority as
  invocation evidence by definition).

**Authority-discipline posture**: Session is **envelope-only-kernel-set
with NO field-level exceptions** (mirrors Decision + ApprovalGrant + Run
+ Principal posture; cleaner than Lease's ADR 0031 v1-prescribed mixed
split + WorkspaceContext's 2-exception split). All 12 envelope-level
fields are kernel-set; producer-supplied Session records are rejected
at the Ring 1 mint API per the producer-allowlist closure on
`kernel_session_resolver`.

**Execution-context binding (charter inv. 17 + inv. 19)**: Session
records carry `execution_context_id` at the entity layer (diverges from
Principal which is execution-context-independent; mirrors
WorkspaceContext which is execution-context-bound at the entity layer
per ADR 0031 v1 Mechanical Tweak #8). The rationale: Session represents
a single invocation in a single execution context; if the same
principal+agent_client+workspace combination is invoked in a different
execution context, that's a NEW Session record. Layer 1 mint API
enforces cross-context binding equality at Lease acquire (per ADR
0031 v1 + ADR 0052), Run creation (per ADR 0053), and ApprovalGrant
consumption (per ADR 0051 v4 + ADR 0054 self-approval rejection).
Cross-context substitution defense is structurally complete at the
Session layer: cross-context binding is forge-able only by minting a
new Session record, which requires the kernel-trusted producer.

### Lifecycle (2 typed transitions, supersession-via-evidence_refs)

A Session begins life in `session_state: 'active'` at Layer 1
`kernel_session_resolver` mint. Transition to `ended` produces a NEW
Session record citing the prior in `evidence_refs` (mirrors ADRs
0049 + 0050 + 0051 + 0052 + 0053 + 0054 supersession-via-evidence_
refs pattern). `ended_at` is set to the end timestamp on transition.

End triggers (Ring 1 mint API responsibility — not schema-enforced):
agent process exit, MCP server disconnect, CLI invocation completion,
dashboard tab close, kernel-detected timeout, dashboard-initiated
termination. The end audit chain links to the prior Session record.

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

## Consequences

### Accepts

- **`Session` Ring 0 entity introduced** at `packages/schemas/src/
  entities/session.ts` with `schema_version: '0.1.0'`. Closes M1
  acceptance criterion #5 (`Session` in the canonical 22-entity list).
  Closes the typed FK target for `Lease.held_by_session_id`,
  `Run.invoker_session_id`, ADR 0030 v2 `owning_session_id`, and the
  "consuming session" + "requesting session" references in ADRs
  0031 v1 / 0051 v4 / 0052 / 0054.

- **Initial `sessionKindSchema` Zod-defined enum** with one value
  (`agent_invocation`). Registry-canonical reservations for
  `dashboard` (paired with future `kernel_dashboard` producer ADR per
  ADRs 0051 v4 / 0052 / 0053 / 0054 deferral) and `system_task`
  (paired with `system_principal` Zod-defined extension per ADR 0054)
  remain pending future schema PRs per the registered §Procedure rule.

- **Session lifecycle (2 transitions, supersession-via-evidence_refs)**:
  `null → active → ended`. Lifecycle transitions are immutable: state
  changes via NEW Session record citing the prior in `evidence_refs`
  (supersession-via-evidence_refs pattern, mirrors ADRs 0049-0054 in
  pattern shape; the specific value-name divergence is `ended` vs
  `retired` for the reasons in §Status v2 absorption). Same-record
  schema-level refinement enforces `session_state == 'active' iff
  ended_at == null` AND `ended_at == null || ended_at >= started_at`
  (the **temporal-superRefine shape** mirrors Run per ADR 0053).

- **Authority-discipline posture (envelope-only-kernel-set with NO
  field-level exceptions)**: all 12 envelope-level fields are kernel-
  set: `schema_version`, `session_id`, `session_kind`, `session_state`,
  `agent_client_id`, `principal_id`, `execution_context_id`,
  `started_at`, `ended_at`, `producer`, `audit_chain_link_hash`,
  `evidence_refs`. Mirrors Decision + ApprovalGrant + Run + Principal
  envelope-only posture (cleaner than Lease's mixed split per ADR
  0031 v1; cleaner than WorkspaceContext's 2-exception split per ADR
  0031 v1 §Authority discipline).

- **Execution-context binding at the entity layer**: Session records
  carry `execution_context_id` (diverges from Principal which is
  execution-context-independent; mirrors WorkspaceContext per ADR
  0031 v1 Mechanical Tweak #8 / Security-C). Layer 1 mint API uses
  this field as the authoritative source of the requesting/invoking/
  consuming execution-context binding when consuming records (Lease,
  Run, ApprovalGrant) are minted.

- **NEW kernel-trusted producer `kernel_session_resolver`** added to
  registry §Kernel-trusted producer allowlist final state. The Ring 1
  service that resolves Session records from invocation evidence
  (MCP server connection, CLI invocation, IDE workspace open, etc.).
  Mirrors the ADR 0037 `kernel_agent_client_resolver` + ADR 0054
  `kernel_principal_resolver` precedents.

- **`Evidence.subject_kind: 'session'` already exists** in
  `evidenceSubjectKindSchema` (verified at
  `packages/schemas/src/entities/evidence.ts:28`). This ADR does not
  modify `evidenceSubjectKindSchema` and does not bump
  `Evidence.schema_version`. Mirrors ADRs 0051 v4 / 0052 / 0053 /
  0054 framing.

- **Audit-chain integrity with length-prefix discipline**: the
  `audit_chain_link_hash` canonical-concatenation uses length-prefix-
  encoded `||` per the ADR 0051 v4 retroactive posture rule (now
  extended to ADRs 0049-0055). The `'' for null` substitution rule
  applies to `ended_at` per the jointly-committed posture.

- **No envelope-level superRefine chain-walk on `evidence_refs`**:
  Session is a typed-identity envelope (mirrors AgentClient +
  WorkspaceContext + Principal precedents); inv. 8 + inv. 18
  enforcement deferred to Ring 1 mint API via producer-allowlist
  closure on `kernel_session_resolver`. This explicit non-commitment
  is registered here to forestall reviewer churn on future schema
  PRs.

- **Self-approval rejection typed-FK closure (ADR 0054 §Future
  amendments §Self-approval rejection typed-FK closure follow-up
  consummation)**: when this ADR lands as Ring 0 schema source, the
  consuming-session `principal_id` reference in the ADR 0051 v4 §Self-
  approval rejection rule (now a discrete registry section per ADR
  0054's change-set item 7 ADD) becomes a typed FK to Principal via
  `Session.principal_id`. The comparison form remains UUID-byte-
  equality on principal_id surface IDs canonicalized at Principal
  mint per the ADR 0054 4-step recipe.

- **NEW Decision.reason_kind reservations** (all deny-only; outcome
  compatibility matches ADR 0049 format): the following 4 reason_kind
  values are reserved registry-canonical, with Zod-defined values to
  land at Ring 1 mint API schema PR per ADR 0049 §Procedure rule:
  - `'session_agent_client_unresolvable'` — Layer 1 mint API cannot
    resolve `Session.agent_client_id` to an active AgentClient.
  - `'session_principal_unresolvable'` — Layer 1 mint API cannot
    resolve `Session.principal_id` to an active Principal.
  - `'session_execution_context_unresolvable'` — Layer 1 mint API
    cannot resolve `Session.execution_context_id` to an active
    ExecutionContext (charter inv. 17 + §Forbidden patterns clause
    operationalizing inv. 17).
  - `'session_started_at_after_ended_at'` — schema-level Zod
    superRefine rejects when `ended_at < started_at` (temporal
    inconsistency; mirrors `run_started_at_after_ended_at` per ADR
    0053).

  Extends the registry §Decision.reason_kind status table from 32
  (after ADR 0053) to **36 total reservations**.

- **NEW §Procedure for adding a new session_kind value rule**
  registered in `ontology-registry.md` mirroring §Procedure rule
  patterns from ADRs 0048 / 0049 / 0051 v4 / 0052 / 0053 / 0054.
  Future schema PRs extending the enum:
  1. Cite the source ADR / charter rule that the session_kind
     enforces.
  2. **Identify the invocation-evidence source** (which evidence
     subtype(s) bind this kind; e.g., for `agent_invocation`, the
     producer evidence comes from `kernel_session_resolver` observing
     an MCP server connection / CLI invocation / IDE workspace open;
     for `dashboard`, future `kernel_dashboard` producer observes a
     dashboard tab; for `system_task`, future kernel-initiated
     background work).
  3. **Identify the required FK fields per session_kind**: does the
     session_kind require `agent_client_id` (default yes for
     `agent_invocation`; future `system_task` may relax to nullable)?
     `principal_id` (default yes — every session has an authenticated
     identity, even if it's `system_principal`)?
     `execution_context_id` (always yes per inv. 17)?
  4. **Commit lifecycle transitions** (default: same `active | ended`
     pattern; new session_kinds may extend with `terminated`,
     `crashed`, etc. per operational evidence).
  5. **Commit per-`session_kind` producer attribution**: which kernel-
     trusted producer mints this session_kind? `agent_invocation` →
     `kernel_session_resolver`; `dashboard` → future `kernel_dashboard`
     (deferred); `system_task` → future producer (deferred).
  6. Update registry §Session.session_kind status table (Zod-defined
     vs registry-canonical, with invocation-evidence-source + required-
     FK-fields + producer-attribution columns) at the same change-set.
  7. Pass `hcs-ontology-reviewer` (always); `hcs-policy-reviewer`
     (always — identity-binding rules are policy-adjacent);
     `hcs-security-reviewer` (always — authority-binding posture +
     synthetic-identity-rejection rule); `hcs-architect` (always).

- **Registry change-set bundled into this ADR's commit (or follow-on
  docs commit referencing this ADR)**. Registry version bumps
  `v0.4.17` → `v0.4.18`. Changes:
  1. NEW §Session entity section (entity overview + field-shape
     mirror + v1 single-value session_kind + envelope-only-kernel-set
     framing + execution-context-binding-at-entity-layer commitment
     contrasted with Principal)
  2. NEW §Session.session_kind status table (1 Zod-defined value + 2
     registry-canonical reservations from this ADR + invocation-
     evidence-source + required-FK-fields + producer-attribution
     columns)
  3. NEW §Session.session_state enum mirror (2 values)
  4. NEW §Session.producer allowlist (single-value
     `kernel_session_resolver`)
  5. NEW §Procedure for adding a new session_kind value rule (7 steps
     including invocation-evidence-source identification + required-
     FK-fields per kind + producer-attribution declaration)
  6. UPDATE §Kernel-trusted producer allowlist final state — add row
     for `kernel_session_resolver` (kernel owner: Ring 1 session
     resolver; mints Session records from invocation evidence)
  7. UPDATE §ADR 0049–0054 foundational Ring 0 entity field authority
     subsection — rename to §ADR 0049–0055; add Session envelope-only-
     kernel-set entry contrasted with Principal's no-execution_context
     framing
  8. UPDATE §ADR 0049–0054 foundational Ring 0 entity enum mirrors
     section title — rename to ADR 0049–0055; add Session sub-section
     with status table + state mirror + producer allowlist + §Procedure
     rule; extend body prose to cover 7 entities
  9. UPDATE §Decision.reason_kind status table — add 4 new
     reservations from this ADR (32 prior + 4 new = 36 total
     reservations; outcome compatibility classified)
  10. UPDATE length-prefix canonical-concatenation discipline coverage
      from ADRs 0049-0054 to ADRs 0049-0055
  11. UPDATE §Self-approval rejection rule registry section — cross-
      reference the typed-FK closure consummation (consuming-session
      `principal_id` is now a typed FK via `Session.principal_id`
      resolving to Principal)
  12. UPDATE §Audit-chain coverage of rejections — add Session cross-
      reference for the new reason_kind reservations + the typed FK
      closures for `requesting_principal_id` / `requesting_session_id`
  13. UPDATE §Current schema-version ledger — add Session row at
      `'0.1.0'`
  14. UPDATE registry change log

- **D-row in `DECISIONS.md`** recording the entity introduction (D-044
  reserved).

- **Charter compliance**: inv. 1 (canonical-typed-evidence — Session
  is a typed identity record), inv. 4 (audit logging —
  `audit_chain_link_hash` with length-prefix discipline), inv. 5 (no
  resolved secret material — Session carries typed identity FKs only),
  inv. 8 (no sandbox→stronger — Ring 1 producer-allowlist closure on
  `kernel_session_resolver` enforces invocation-evidence trust class;
  schema layer mirrors AgentClient / WorkspaceContext / Principal
  typed-identity-envelope precedent in deferring chain-walk to Ring
  1), inv. 17 (execution context declared — `Session.execution_
  context_id` is kernel-set, required; closes M1 typed FK target
  for ADR 0031 v1 Mechanical Tweak #8 cross-context binding rule),
  inv. 18 (chain-walk rejection — deferred to Ring 1 per typed-
  identity-envelope precedent), inv. 19 (freshness-bound — `ended_at`
  non-null when ended; session-level `valid_until` ceiling deferred
  to future amendment if operational evidence warrants). All upheld.

### Rejects

- **Multi-`session_kind` v1 with placeholder branches** (Option B) —
  rejected per the "enum value without scope semantics" lesson from
  ADR 0051 v2/v3. Future kinds (`dashboard`, `system_task`) are
  registry-canonical reservations pending future coordinated change-
  set ADRs.

- **No `session_kind` discriminator at v1** (Option C) — rejected per
  the discriminator-at-v1 established pattern (Decision.outcome,
  ApprovalGrant.grant_kind, Lease.lease_kind, Run.run_kind,
  Principal.principal_kind).

- **Producer-supplied `Session` records** — Session is envelope-only-
  kernel-set throughout. Producer attempts at the future Ring 1 mint
  API to set any field are rejected with the standard kernel-set
  producer enforcement per registry §Producer-vs-kernel-set authority
  fields. The producer-allowlist closure on `kernel_session_resolver`
  is the structural defense.

- **Session records carrying raw secret values, inline credentials,
  authentication tokens, OAuth bearer tokens, MCP session cookies,
  CLI auth tokens, or any other secret material** — Session carries
  typed identity FKs (entityIdSchema) only; raw secret material is
  forbidden per charter inv. 5. Identity binding lives in evidence_
  refs cited binding evidence subtypes (`GitIdentityBinding`,
  `MachineIdentityBindingObservation`, future Q-row session-binding
  evidence types).

- **Schema-level cross-record refinements** (FK liveness verification
  for agent_client_id / principal_id / execution_context_id at
  Session mint; cross-context binding equality enforcement for
  consuming records; holder-only release UUID-byte-equality
  comparison; self-approval rejection FK consumption) — all rejected
  at the schema layer because cross-record equality cannot be schema-
  validated against host state per registry §Cross-context enforcement
  layer §Schema validation alone is not an enforcement layer rule
  (mirrors ADRs 0050 / 0051 v4 / 0052 / 0053 / 0054 pattern).

- **Schema-level Session-immutability refinement** — Session records
  are immutable once minted; lifecycle transitions produce NEW Session
  records via supersession-via-evidence_refs. Schema-level
  immutability refinement is Ring 1 mint-API responsibility.

- **`execution_context_id` field absent from Session envelope**
  (mirroring Principal posture) — rejected. Session is execution-
  context-BOUND at the entity layer by construction (a session runs
  in one execution context; if it crosses, that's a new session).
  This intentionally diverges from Principal (which is execution-
  context-independent because principal identity persists across
  contexts) and mirrors WorkspaceContext (which is execution-context-
  bound because workspace identity binds to its mint-time session
  per ADR 0031 v1 Mechanical Tweak #8). The divergence is committed
  in §Decision §Execution-context binding for clarity.

- **Envelope-level superRefine chain-walk on `evidence_refs`** —
  rejected per the typed-identity-envelope precedent (AgentClient,
  WorkspaceContext, Principal). Session records are not authorization
  envelopes (they don't gate operations); chain-walk rejection of
  invocation evidence belongs at the Ring 1 mint API producer-
  allowlist closure on `kernel_session_resolver`.

- **`dashboard` and `system_task` session_kind Zod-defined at v1** —
  rejected per the conservative-v1-enum lesson from ADRs 0049-0054.
  Registry-canonical reservations remain pending future schema PRs
  per the §Procedure rule.

- **`kernel_dashboard` in `producer` allowlist** — rejected per the
  established deferral pattern. `kernel_dashboard` + `dashboard`
  session_kind + dashboard-initiated session-termination workflow
  all land as a single coordinated future-ADR change-set.

- **Session-level `valid_until` freshness ceiling field** — rejected
  for v1. Per-operation freshness binding lives on the consuming
  entity (Lease.valid_until, ApprovalGrant.valid_until,
  Decision.valid_until); Session is the long-lived holder. Future
  ADRs may add a session-level freshness ceiling if operational
  evidence shows it.

- **Authoring Ring 1 mint API, kernel_session_resolver
  implementation, dashboard surface for session management, or
  canonical policy YAML for session-lifecycle rules** — all out of
  scope. Per workflow-sequencing investigation §Step 4, Ring 1
  services land at `packages/kernel/`. Dashboard lands at
  `packages/dashboard/` per Milestone 5. Canonical policy YAML is
  Phase 2.5 lane at `system-config/policies/host-capability-
  substrate/`.

- **Mutable `session_state` transitions via in-place updates** —
  Session lifecycle transitions produce NEW Session records via
  supersession-via-evidence_refs (mirrors ADRs 0049-0054). In-place
  mutation is not supported by the audit-chain integrity discipline.

### Future amendments

- **`kernel_dashboard` producer + `dashboard` session_kind** —
  separate forthcoming ADR adds `kernel_dashboard` to the kernel-
  trusted producer allowlist + extends `sessionProducerSchema` enum
  + adds `dashboard` session_kind Zod-defined extension + dashboard-
  initiated session-termination workflow.

- **`system_task` session_kind + `system_principal` Zod-defined
  extension** — separate forthcoming ADRs land via schema PR per the
  §Procedure rule. `system_task` sessions may relax the
  `agent_client_id` requirement to nullable; pairs with the
  `system_principal` Zod-defined extension per ADR 0054 §Future
  amendments + the `principal_attribution_unresolvable` reason_kind
  reservation noted there.

- **Session-level lifecycle state extensions** beyond `active | ended`
  (e.g., `terminated` for kernel-forced close, `crashed` for abnormal
  exit, `suspended` for credential-rotation-in-progress) may surface
  as Ring 1 mint API operational evidence informs. Future ADRs extend
  `sessionStateSchema` per the standard schema-extension procedure.
  If future state names align more closely with the long-lived
  identity precedents (AgentClient/WorkspaceContext/Principal
  `retired`), the §Procedure rule allows that path without bumping
  `sessionSchemaVersionSchema` to a major version (additive enum
  widening per `.agents/skills/hcs-schema-change`).

- **Session-level `valid_until` freshness ceiling** — future ADR may
  add if operational evidence shows session-level freshness binding
  is needed beyond per-operation Lease/ApprovalGrant/Decision
  `valid_until` ceilings.

- **Ring 1 mint API implementation (`kernel_session_resolver`)** —
  per workflow-sequencing investigation §Step 4. Lives at
  `packages/kernel/src/session/`. Enforces FK liveness verification
  at Session mint (agent_client_id + principal_id +
  execution_context_id all active), cross-context binding equality
  at consuming-record mint (Lease.execution_context_id ==
  Session.execution_context_id; Run.execution_context_id ==
  invoker_session.execution_context_id), holder-only release
  comparison (Lease.held_by_session_id UUID-byte-equality), self-
  approval rejection FK consumption (consuming_session.principal_id
  comparison via the ADR 0054 4-step canonicalization-at-mint
  recipe).

- **Coordinated follow-up schema PRs**: Lease.held_by_session_id +
  Run.invoker_session_id + ADR 0030 v2 owning_session_id field
  descriptions update at the same schema PR as this ADR's source-
  landing slice (NO shape change; only `.describe()` text now
  references Session as typed FK target).

- **Dashboard-surfacing of Session records** (Milestone 5) per
  `PLAN.md` Milestone 5 §View-model contracts.

- **Reopen** if a future incident shows: v1 single-value `session_
  kind` enum inadequate for distinct session classes; the 2-state
  lifecycle insufficient (e.g., need a `suspended` intermediate
  state); the execution-context-binding-at-entity-layer framing
  creates operational pain (unlikely given WorkspaceContext
  precedent); the typed-FK consumption in ADR 0051 v4 self-approval
  rejection creates unintended escalation surfaces; the kernel-
  session-resolver producer concentrates authority in a way that
  warrants splitting (e.g., separate producers per session_kind).

## Compliance

This ADR is Ring 0 docs-only at the ADR layer; the schema PR that
follows is a Ring 0 schema-change PR per `.agents/skills/hcs-schema-
change`. The coordinated schema PR also lands the follow-up updates to
`lease.ts` (Lease.held_by_session_id `.describe()` text now references
Session as typed FK), `run.ts` (Run.invoker_session_id `.describe()`
text update), and any direct-Evidence subtypes that reference
`owning_session_id` (ADR 0030 v2). No cross-ring imports authored. No
canonical policy YAML, runtime probes, dashboard route React
components, MCP adapter contracts, hook bodies, charter invariant text
changes, or Ring 1 mint API implementation in this commit. Registry-
side changes (per the 14-item change-set in §Accepts) are bundled into
this commit or a follow-on docs commit referencing this ADR. Complies
with implementation charter v1.4.0.

**Implementation-detail acknowledgments** (per ADRs 0049-0054
precedents):

- `prior_audit_chain_link_hash` is NOT a schema field on the Session
  record; it is an input to the `audit_chain_link_hash` canonical-
  concatenation computation at Ring 1 mint time. Chain-link continuity
  is enforced by Ring 1 storage on insert (Milestone 3 audit-events
  table).
- Genesis-collision defense for the same `session_id` audit-chain
  root is a Milestone 3 audit-events table unique-constraint
  commitment.
- **Canonical-concatenation field-order convention** (length-prefix
  discipline inheritance): per the ADR 0051 v4 retroactive posture
  rule (now extended to ADRs 0049-0055), the `||` operator denotes
  length-prefix-encoded concatenation (`varint(byte_length) ||
  field_bytes`). ADR 0055 places identity + discriminator first
  (`session_id`, `session_kind`), followed by lifecycle (`session_
  state`), followed by binding FKs (`agent_client_id`, `principal_id`,
  `execution_context_id`), followed by temporal (`started_at`,
  `ended_at`), followed by producer (`producer`), followed by
  evidence (`canonical(evidence_refs)`), followed by the chain link
  (`prior_audit_chain_link_hash`). The `'' for null` substitution
  rule applies to `ended_at`.
- `canonical(evidence_refs)` encoding is deferred to Ring 1 mint API;
  the schema commits the typed structure (array of `evidenceRefSchema`),
  and Ring 1 commits a deterministic serialization for hash-determinism
  that applies the length-prefix rule per element.
- **Identity comparison form**: the holder-only release rule's
  `requesting_session_id == held_by_session_id` comparison at Layer
  1 mint API (per ADR 0052 §Identity comparison form) is **UUID-byte-
  equality** comparison. Both fields are `entityIdSchema`-typed
  (UUID-shape strings); the comparison is structural identity. This
  mirrors the ADR 0052 form precisely; no canonicalization needed for
  session_id (the canonicalization recipe per ADR 0054 applies to
  principal_id surface IDs, not session_id surface IDs).
- **Execution-context-binding-at-entity-layer rationale**: Sessions
  are execution-context-BOUND because a session represents a single
  invocation in a single execution context. Cross-context invocations
  are NEW Session records. This intentionally diverges from Principal
  (which is execution-context-independent because principal identity
  persists across contexts) and mirrors WorkspaceContext (which is
  execution-context-bound at the entity layer per ADR 0031 v1
  Mechanical Tweak #8 / Security-C). The divergence is registered
  explicitly to forestall reviewer churn on future schema PRs.

- **Ring 1 `kernel_session_resolver` sandbox-source rejection guard
  (security N1 v2 absorption)**: when Ring 1 implementation lands at
  `packages/kernel/src/session/`, `kernel_session_resolver` MUST
  enforce that invocation evidence cited by Session.evidence_refs
  carries non-sandbox `authority` (i.e., NOT `'sandbox-observation'`
  and NOT `'self-asserted'`). Charter inv. 8 + inv. 18 enforcement
  for Session records lives at this rejection guard, not at the
  schema layer (typed-identity-envelope precedent). Specifically,
  for `session_kind: 'agent_invocation'`, the invocation evidence
  classes are: MCP server connection evidence (kernel-observed via
  the broker FSM), CLI invocation evidence (kernel-observed via
  process telemetry), IDE workspace open evidence (kernel-observed
  via IDE-host probe). Each evidence subtype's own ADR defines its
  `authority`-class binding rules; the Ring 1 mint API rejects
  Session creation if any cited evidence carries a sandbox-class or
  self-asserted authority.

- **Ring 1 `kernel_session_resolver` chain-walk rejection guard
  (security N4 v2 absorption)**: when Ring 1 implementation lands,
  `kernel_session_resolver` MUST reject Session creation if the
  cited binding evidence transitively cites (via `derived_from`
  chain-walk per ADR 0019 v3) any record carrying `authority:
  'sandbox-observation'` or `authority: 'self-asserted'`. This is
  the same producer-allowlist-closure substitute for the chain-walk
  envelope superRefine that AgentClient + WorkspaceContext +
  Principal defer to Ring 1. The walk-depth budget ≤ 64 records +
  cycle-rejection via `audit_chain_corruption_detected` per the ADR
  0051 v4 cross-step chain-walk discipline applies.

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md`
  v1.4.0 — invariants 1, 4, 5, 8, 17, 18, 19
- Decision ledger: `DECISIONS.md` (D-044 reserved for this ADR's
  acceptance)
- Related ADRs:
  - ADR 0019 v3 (chain-promotion rule; four-class `derived_from`
    closure; cycle-rejection in chain construction)
  - ADR 0023 (Ring 0 Evidence base entity; `Evidence.subject_kind:
    'session'` already Zod-defined at `evidence.ts:28`)
  - ADR 0028 (`mint_api` + `kernel_broker` producers)
  - ADR 0030 v2 (Q-006 Stage 2 source-control evidence;
    `owning_session_id` typed FK target closure)
  - ADR 0031 v1 (Q-008(d) worktree-ownership composition; §Mechanical
    Tweak #8 commits `Session.execution_context_id` as the
    authoritative FK for cross-context binding equality; §Authority
    discipline; §Cross-context binding rules per Ring 1 layer)
  - ADR 0037 (Q-010 cross-agent isolation;
    `kernel_agent_client_resolver` producer precedent; AgentClient
    typed-identity-envelope precedent that Session mirrors with
    execution-context binding added)
  - ADR 0049 (Decision Ring 0 entity introduction; foundational-entity
    train precedent)
  - ADR 0050 (WorkspaceContext Ring 0 entity introduction; execution-
    context-binding-at-entity-layer precedent that Session mirrors
    most closely; named-enum-producer-schema pattern; same-record
    state ↔ ended_at correlation refinement pattern)
  - ADR 0051 v4 (ApprovalGrant Ring 0 entity introduction; §Self-
    approval rejection rule that this ADR closes typed-FK consumption
    for via `Session.principal_id`)
  - ADR 0052 (Lease Ring 0 entity introduction; UUID-byte-equality
    identity-comparison precedent for typed-FK session_id;
    `Lease.held_by_session_id` typed FK target closure; §Holder-only
    release rule)
  - ADR 0053 (Run Ring 0 entity introduction; `Run.invoker_session_id`
    typed FK target closure; triple cross-context-equality enforcement;
    `run_invoker_session_mismatch` reason_kind reservation)
  - ADR 0054 (Principal Ring 0 entity introduction; the entity
    immediately preceding Session in the §Step 3 priority order;
    `Session.principal_id` resolves to Principal; 4-step
    canonicalization-at-mint recipe applies to principal_id surface
    IDs that Session.principal_id references)
- Registry: `docs/host-capability-substrate/ontology-registry.md`
  v0.4.17 (current frontmatter; ADR 0055 reserves v0.4.18 pending
  docs commit). v2-verified line citations (per ontology B-2/B-3/
  B-4/B-6/B-7/B-8/B-9 + architect B4 absorption): §Authority
  discipline (line 279+), §ADR 0049–0054 foundational Ring 0 entity
  field authority subsection (line 443), §Subject-kind grounding
  requirement (line 527), §Cross-context enforcement layer (line
  630), §Audit-chain coverage of rejections (line 686), §Kernel-
  trusted producer allowlist final state (line 899; `kernel_principal_
  resolver` row from ADR 0054 at line 910), §Self-approval rejection
  rule (line 2419; added by ADR 0054 v2), §ADR 0049–0054 foundational
  Ring 0 entity enum mirrors section (line 2504; rename to ADR
  0049–0055 per registry change-set item 8), §Current schema-version
  ledger (line 882; add Session row per registry change-set item
  13), §Naming-discipline §Sub-rule 9 enum-value casing (line 203 —
  `lower_snake_case` mandate for new enum values; `sessionKindSchema`
  values comply).
- Workflow-sequencing investigation: `docs/host-capability-substrate/
  research/local/2026-05-10-workflow-sequencing-investigation.md`
  v0.1.3 (§Step 3 less-critical Ring 0 foundational entities entry
  for `Session` — entity #2 of 2 highest-coupling)
- Outstanding-work sequencing workflow: `docs/host-capability-
  substrate/research/local/2026-05-09-outstanding-work-sequencing-
  workflow.md`
- Implementation rules: `IMPLEMENT.md` §Required subagent reviews,
  §Change classes
- Plan: `PLAN.md` §Current Focus (post-commit-`8382194` reflects
  Session as next highest-coupling work); §Milestone 1 acceptance
  (line 672+ — 22 canonical Ring 0 entities; Session at position #5)
- Schema-change skill: `.agents/skills/hcs-schema-change/SKILL.md`
- Draft-ADR skill: `.agents/skills/hcs-draft-adr/SKILL.md`
- Live policy authoritative source (out-of-scope for this ADR; Phase
  2.5 lane): `~/Organizations/jefahnierocks/system-config/policies/
  host-capability-substrate/` — canonical session-lifecycle rules;
  per-`session_kind` invocation-evidence-verification rules;
  termination-trigger rules; future producer-attribution rules
- Schema source for related entities (just-landed via commits
  `7fb7e05` + `8382194`):
  - `packages/schemas/src/entities/evidence.ts:28` (`'session'`
    already in `evidenceSubjectKindSchema`; this ADR does not modify
    the enum or bump `Evidence.schema_version`)
  - `packages/schemas/src/entities/principal.ts` (typed-identity-
    envelope precedent that Session mirrors most closely with
    execution-context binding added; `principalProducerSchema`
    named-enum pattern)
  - `packages/schemas/src/entities/workspace-context.ts` (execution-
    context-binding-at-entity-layer precedent per ADR 0031 v1
    Mechanical Tweak #8 / Security-C; same-record state ↔ valid_until
    correlation refinement pattern that Session mirrors for state ↔
    ended_at)
  - `packages/schemas/src/entities/agent-client.ts` (typed-identity-
    envelope precedent; same `state: 'active' | 'retired'` /
    `'active' | 'ended'` lifecycle pattern shape)
  - `packages/schemas/src/entities/lease.ts:103` (`held_by_session_id`
    typed FK target; this ADR's coordinated schema PR updates the
    `.describe()` text to reference Session)
  - `packages/schemas/src/entities/run.ts:104` (`invoker_session_id`
    typed FK target; this ADR's coordinated schema PR updates the
    `.describe()` text to reference Session)
- Currently-landed schemaVersion literals (12 entity-specific
  literals + 1 sibling literal = 13 total after ADR 0054 Principal
  landing at commit `8382194`):
  `evidenceSchemaVersionSchema`, `knowledgeSourceSchemaVersionSchema`,
  `operationShapeSchemaVersionSchema`,
  `executionContextSchemaVersionSchema` (private const),
  `boundaryObservationSchemaVersionSchema` + sibling
  `boundaryObservationEvidenceSchemaVersionSchema`,
  `credentialSourceSchemaVersionSchema` (private const),
  `decisionSchemaVersionSchema`,
  `workspaceContextSchemaVersionSchema`,
  `approvalGrantSchemaVersionSchema`, `leaseSchemaVersionSchema`,
  `runSchemaVersionSchema`, `principalSchemaVersionSchema`.
  `sessionSchemaVersionSchema` joins as the **fourteenth** literal
  (counting the boundary-observation sibling) or thirteenth-by-
  entity co-commitment.

### External

- None directly; this ADR composes existing internal posture.
