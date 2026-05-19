---
adr_number: 0057
title: Ring 1 mint/audit service
status: accepted
version: v3
date: 2026-05-18
charter_version: 1.4.1
tags: [ring-1, mint-api, audit-chain, foundational-entities, producer-attribution, charter-v1-4-1]
---

# ADR 0057: Ring 1 mint/audit service

## Status

`accepted`

Drafted 2026-05-18 as the first Ring 1 service ADR after the
foundational Ring 0 entity train and the generated-snapshot lane landed.
This ADR is design-only. It does not implement the service, change
schemas, change policy, vendor snapshots, dispatch reviewers, or expose
agent-callable mutation endpoints.

v1 was dispatched to all five reviewers and returned round-1 blockers.
v2 absorbs all seven operator-scoped blocker classes:

- **Architect + security KnowledgeChunk blocker**: §Sandbox-source
  rejection now rejects any KnowledgeChunk reference anywhere in the
  consumed authority graph, while preserving non-authority retrieval and
  display use as out of scope.
- **Policy rejection-reason blocker**: §Producer allowlist enforcement
  now carries a service-wide reason-kind discipline for every rejection
  class.
- **Security audit-attribution blocker**: §Audit-chain integrity rules
  now require kernel-resolved attribution on every append and rejection
  audit event.
- **Policy ApprovalGrant-clearing blocker**: §Cross-record refinements
  now names grant-kind equality, snapshot grant-kind compatibility,
  null/non-clearable rejection, and `operation_class_unregistered`
  null-only handling.
- **Ontology depth-overflow blocker**: §Audit-chain integrity rules and
  the ADR 0056 row now reserve `audit_chain_corruption_detected` for
  cycle detection only; depth overflow fails closed until a distinct
  reason_kind lands.
- **Ontology FK-closure blocker**: v2 adds a standalone §FK-closure
  inventory rather than mixing closure facts into runtime-validation
  rows.
- **Ontology AgentClient audit-chain blocker**: operator scope call
  excludes AgentClient from this ADR's audit-chain commitments and
  defers AgentClient canonical-hash posture to a future narrow ADR.

v2 also absorbs the clear mechanical non-blockers from architect,
ontology, policy, security, and eval review. v2 is ready for round-2
reviewer dispatch after operator confirmation.

v2 was dispatched to round-2 reviewers. Round 2 returned one architect
blocker (AgentClient boundary contradiction), one unresolved ontology
finding (FK-closure inventory incomplete), and one eval non-blocker
(chain-cycle coverage wording). v3 absorbs all three per operator scope:
AgentClient minting is blocked pending the future AgentClient
canonical-hash amendment ADR while `kernel_agent_client_resolver` remains
as a forward producer reservation; the ApprovalGrant and Lease
FK-closure rows now include the missing evidence/context refs from Zod
source; and the chain-cycle coverage row now carries the same no-incident
trap guard as the surrounding rows. v3 is ready for round-3 reviewer
dispatch after operator confirmation.

ADR 0057 v3 was dispatched to all five reviewers for round 3 on
2026-05-18. All five returned `yes` ready-for-acceptance with 0 new
round-3 blockers and 0 new round-3 non-blockers; all prior round-1 and
round-2 findings were confirmed absorbed cleanly. ADR 0057 is accepted
2026-05-18 as D-052. The three-cycle absorption record is: seven
round-1 blockers, one round-2 blocker, one unresolved-after-round-1
ontology finding, and several non-blockers were absorbed without scope
reversal. Operator scope calls were preserved: round-1 Blocker 7
excluded AgentClient from audit-chain commitments, and the round-2
architect blocker resolved by blocking AgentClient minting pending a
future amendment while preserving `kernel_agent_client_resolver` as a
forward producer reservation.

## Date

2026-05-18

## Charter version

Written against implementation charter v1.4.1. The mint/audit
requirements rely on invariants 1, 4, 6, 7, 8, 17, 18, and 19. The
v1.4.1 hook-policy clarification does not change the v1.4.0 invariants
that ADRs 0049-0056 used, but it reinforces that hook bodies are not the
policy or minting authority.

## Reviewer dispatch plan

Reviewer dispatch is deferred until the operator confirms this v3 scope.
When dispatch is authorized, use all five reviewers:

- `hcs-architect` -- service boundary, ring discipline, and ADR
  consistency across the first Ring 1 service design.
- `hcs-ontology-reviewer` -- cross-record checks touch Decision,
  ApprovalGrant, Lease, Run, Principal, Session, AgentClient,
  WorkspaceContext, and producer-attribution semantics.
- `hcs-policy-reviewer` -- producer-disjointness, approval-grant
  clearing, forbidden-tier non-escalability, and snapshot/live-policy
  boundary preservation.
- `hcs-security-reviewer` -- sandbox-source rejection, synthetic
  identity rejection, audit-chain integrity, walk-depth and cycle
  rejection, and producer-spoof prevention.
- `hcs-eval-reviewer` -- this service creates regression-trap surfaces
  for stale producer claims, sandbox-evidence laundering, chain
  corruption, and runtime-check omissions.

## Context

ADRs 0049-0055 landed the foundational Ring 0 entity shapes for
Decision, WorkspaceContext, ApprovalGrant, Lease, Run, Principal, and
Session. Those ADRs deliberately kept cross-record refinements out of
Zod schemas because schema validation can check shape but cannot resolve
host state, prior records, execution-context equality, live policy
classification, or audit-chain continuity. The ontology registry records
that these checks live at the Ring 1 mint API under the cross-context
enforcement layer.

The generated-snapshot lane now exists in HCS per D-048 and D-051. That
means HCS can test policy/schema compatibility locally, but live policy
authority still lives outside this repo. The next Ring 1 design should
therefore define the service that mints authoritative records and
maintains the tamper-evident audit chain, without yet adding the gateway,
execution broker, host-state service, tool-resolution service, capability
registration service, or human dashboard approval flows.

Mint/audit comes before the execution broker because charter invariant 7
requires approval grants, dashboard review, tamper-evident audit, and
lease manager to exist before any capability with `mutation_scope !=
"none"` becomes callable. The broker cannot safely execute host
operations until record minting, producer attribution, audit-chain
continuity, approval grants, leases, and rejection recording have a
single Ring 1 authority.

## Options considered

### Option A: Implement broker and gateway before mint/audit

**Pros:**

- Would create an execution path sooner.
- Would let adapter and hook surfaces integrate against a visible
  operation route early.

**Cons:**

- Violates charter invariant 7 by putting operation execution ahead of
  the approval/audit/dashboard/lease stack.
- Forces broker and gateway code to duplicate record-minting,
  audit-chain, and producer-allowlist logic before the authority surface
  exists.
- Makes rejection and audit behavior harder to verify because the
  append-only record authority is not yet isolated.

### Option B: Make every Ring 1 service mint its own records

**Pros:**

- Keeps local code near each service's domain.
- Avoids an early shared service boundary.

**Cons:**

- Duplicates producer-attribution and audit-chain logic across services.
- Increases the chance that one service accepts producer-supplied
  kernel fields, bypasses chain-walk, or computes a different canonical
  hash.
- Makes cross-record refinements such as producer-disjointness,
  self-approval rejection, and cross-context equality inconsistent.
- Undercuts the ontology-registry placement that names the mint API as
  the primary Ring 1 cross-context enforcement layer.

### Option C: Standalone Ring 1 mint/audit service first

**Pros:**

- Gives all future Ring 1 services one authority for mint-time
  validation, producer attribution, audit-chain link creation, and
  rejection recording.
- Absorbs the deferred runtime checks from ADRs 0049-0055 without
  changing settled M1 schemas.
- Lets the future execution broker, gateway, host-state service, tool
  resolution service, capability registration service, and dashboard
  approval flows depend on a stable record-minting contract.
- Preserves the live-policy boundary from D-048 and D-051: the service
  may consume an authorized/hash-bound runtime policy snapshot or cache
  sourced from system-config live policy, but this ADR does not move live
  policy authority into HCS.

**Cons:**

- Adds a shared kernel service boundary before visible operation
  execution exists.
- Requires careful reviewer coverage because this service touches many
  entity contracts and producer allowlists at once.

## Decision

Choose Option C. HCS will design a standalone Ring 1 mint/audit service
as the first Ring 1 service. The service owns authoritative record
minting, producer allowlist enforcement, audit-chain link computation,
chain validation, sandbox-source rejection, bounded authority-chain
walks, and the cross-record refinements that ADRs 0049-0055 deferred out
of Ring 0 schemas. The service is consumed by trusted Ring 1 service
paths and producer resolvers, not by agents directly.

## Service boundary

The Ring 1 mint/audit service owns:

- The only accepted path for minting authoritative Decision,
  ApprovalGrant, Lease, Run, Principal, Session, AgentClient, and
  WorkspaceContext records once their source schemas are available.
- Any future M1 entity that carries kernel-set authority fields,
  producer attribution, audit-chain link hashes, execution-context
  binding, approval/lease/run lifecycle state, or mint-time cross-record
  checks.
- Producer allowlist enforcement. A producer value is accepted only when
  the request reached the service through the matching trusted service
  path. Payloads that self-assert kernel producer values are rejected.
- Audit-chain link computation, audit-chain continuity validation, and
  rejection recording.
- Cross-record refinement checks that require lookup of prior records,
  host state, authorized/hash-bound runtime policy snapshots or caches
  sourced from system-config live policy, execution contexts,
  worktree/filesystem state, or audit-chain history.

The service does not own gateway decision re-derive, broker execution,
tool resolution, capability registration, host state observation,
dashboard UX, adapter policy, hook policy, live policy authoring, or
provider mutation.

ExecutionContext minting remains with the future host-state/resolver
service. This ADR's mint/audit service verifies ExecutionContext FK
liveness and context equality when consumed by Decision, WorkspaceContext,
Lease, Run, Session, or related records; it does not mint
ExecutionContext records.

The mint/audit service mints AgentClient records through
`kernel_agent_client_resolver`, but that minting functionality is blocked
pending the future AgentClient canonical-hash amendment ADR. Until that
amendment commits AgentClient canonical field order and GENESIS handling,
AgentClient mint attempts MUST be rejected: a schema-valid AgentClient
record requires `audit_chain_link_hash`, and the canonical hash
computation is not yet specified. The producer allowlist retains
`kernel_agent_client_resolver` as a forward reservation; when the
amendment lands, the block lifts without re-scoping ADR 0057.

## Producer allowlist enforcement

The mint/audit service enforces both entity-level producer allowlists and
service-path provenance. Entity-envelope producers:

| Producer | Trusted service path | Mint scope |
|---|---|---|
| `mint_api` | Internal mint/audit service path | Synthetic or derived Decision, ApprovalGrant, Lease, and Run records when no narrower producer owns the transition. |
| `kernel_broker` | Future broker FSM path | Decision, ApprovalGrant, Lease, and Run records for broker-mediated transitions, once the broker ADR lands. |
| `kernel_gateway` | Future gateway re-derive path | Decision records only; never ApprovalGrant, Lease, or Run records. |
| `kernel_agent_client_resolver` | Agent-client resolver path | AgentClient axes and remote-cloud execution-context surfaces per registry scope; agents cannot self-claim this producer. |
| `kernel_workspace_diagnose` | Workspace-diagnose path | Workspace diagnostic outputs, manifest projections, and WorkspaceContext identity records. |
| `kernel_principal_resolver` | Principal resolver path | Principal records from verified binding evidence. |
| `kernel_session_resolver` | Session resolver path | Session records from invocation evidence. |

Evidence-only trusted producers:

| Producer | Trusted service path | Scope |
|---|---|---|
| `kernel_telemetry` | Telemetry reader path | Host process, kqueue, ptrace, and equivalent host telemetry evidence; not a foundational entity envelope producer by itself. |

`kernel_dashboard` remains deferred. This ADR does not add it to any
producer enum, authorize pre-emptive grant minting, or make dashboard
human approval flows operational.

Producer name and trusted service path must match. The service path is
kernel-resolved and authenticated, not producer-asserted. If a
producer-submitted payload names any kernel-trusted producer class
without arriving through the matching service path, minting rejects.

Rejection reason-kind discipline applies service-wide. Every rejection
class emits a typed Decision only when an applicable Zod-defined,
outcome-compatible `reason_kind` exists. If no registered reason_kind
exists for the rejection class, the implementation fails closed as a
schema/registry gap and uses the audit rejection path without inventing
an ad hoc reason_kind or borrowing an unrelated one.

## Cross-record refinements owned by this service

The following deferred rules move into the Ring 1 mint/audit runtime
scope. This ADR does not change M1 schemas; it names where the already
committed checks execute.

| Source | Runtime rule |
|---|---|
| ADR 0037 AgentClient | Reserve AgentClient minting for the agent-client resolver path; reject self-asserted agent-client axes and resolver evidence that cannot be grounded in observed launch, process, installed-binary, or remote-cloud execution-context evidence. AgentClient mint attempts MUST reject until the future AgentClient canonical-hash amendment ADR commits canonical field order and GENESIS handling. The mint/audit service still enforces producer attribution and FK liveness when other records consume AgentClient IDs. |
| ADR 0049 Decision | Reject producer-supplied Decision envelopes; set `decided_by`, `execution_context_id`, `required_grant_kind`, and `audit_chain_link_hash` through Ring 1 code; enforce Decision append-only immutability, cross-context substitution defense, audit-chain link continuity, and D-037 same-step producer-disjointness. |
| ADR 0050 WorkspaceContext | Verify `repository_id` and `worktree_path` against filesystem/Git evidence; canonicalize `worktree_path`; enforce one active WorkspaceContext per `(repository_id, canonical(worktree_path))`; bind the record to one `execution_context_id`; retire prior active records atomically by supersession. |
| ADR 0051 ApprovalGrant | Reject producer-supplied ApprovalGrant envelopes; enforce `valid_until > granted_at`, `valid_until <= Decision.valid_until`, at most one active grant per `minted_for_decision_id`, consumption-time freshness, revoke-wins race handling, self-approval rejection, same-step and cross-step producer-disjointness, immutable lifecycle transitions, and audit-pair recording for consume-after-revoke. Clearing requires `ApprovalGrant.grant_kind == Decision.required_grant_kind` and membership in `operation_class_defaults.<class>.approval_required_details.grant_kind_compatibility.allowed_grant_kinds` from the authorized/hash-bound runtime policy snapshot/cache. Clearing rejects when `Decision.required_grant_kind == null`; `operation_class_unregistered` remains null-only and non-clearable. |
| ADR 0052 Lease | Verify producer-asserted lease fields; canonicalize worktree paths before uniqueness checks; enforce `valid_until > acquired_at`, Phase 1 24-hour ceiling for worktree leases, active worktree lease uniqueness, `Lease.execution_context_id == Session.execution_context_id`, WorkspaceContext containment, sandbox-acquire rejection, holder-only release, force-break separation of duties, `valid_until` inheritance, immutable lifecycle transitions, and producer-disjointness for lease acquisition. |
| ADR 0053 Run | Verify `authorizing_decision_id` resolves to an allow Decision; enforce `Run.execution_context_id == invoker_session.execution_context_id == authorizing_decision.execution_context_id`, at most one active Run per authorizing Decision, terminal-state mutation rejection, execution-context resolvability, immutable lifecycle transitions, and producer-disjointness for Run recording. |
| ADR 0054 Principal | Accept Principal records only from `kernel_principal_resolver`; verify binding evidence by `principal_kind`; reject synthetic identities; enforce inv. 8 / inv. 18 chain-walk rejection through producer-allowlist closure on `kernel_principal_resolver`; canonicalize Principal surface IDs at mint with the ADR 0054 recipe; provide the typed-FK surface consumed by self-approval rejection; verify `requesting_principal_id` FK liveness when that FK is used. |
| ADR 0055 Session | Accept Session records only from `kernel_session_resolver`; verify `agent_client_id`, `principal_id`, and `execution_context_id` FK liveness; reject sandbox or self-asserted invocation evidence; walk cited binding evidence transitively via `derived_from`; reject cross-context substitution at consuming-record mint; preserve transient-session lifecycle immutability. |
| ADR 0056 Decision.reason_kind promotions | Treat `operation_class_unregistered` as non-clearable and keep `audit_chain_corruption_detected` as the deny-only bounded chain-walk cycle sentinel already Zod-defined for that failure class. Depth overflow is not mapped to `audit_chain_corruption_detected`; it fails closed through the audit rejection path until a distinct reason_kind is registered. |

Future M1 entity ADRs must either state that their cross-record checks
are owned by this service or explicitly justify a different Ring 1 owner.

## FK-closure inventory

This inventory records typed FK closure separately from runtime
validation rules. It is limited to the v3 audit-chain commitment scope:
Decision, ApprovalGrant, Lease, Run, Principal, and Session. AgentClient,
WorkspaceContext, ExecutionContext, OperationShape, Evidence, and
CoordinationFact are referenced by these checks, but they are not added
to this ADR's audit-chain commitment list by this section.

| Entity | Typed FK fields carried by the entity | FK targets closed in/to/from the entity | Mint API liveness/equality checks owned here |
|---|---|---|---|
| Decision | `operation_shape_ref`; `execution_context_id`; `evidence_refs` and chain refs. | Target of `ApprovalGrant.minted_for_decision_id`; target of `Run.scope.authorizing_decision_id`; source record for D-037 producer-disjointness. | Resolve OperationShape and ExecutionContext; resolve evidence authority graph; verify authorizing Decision freshness/outcome when consumed by ApprovalGrant and Run; enforce producer-disjointness across related records. |
| ApprovalGrant | `minted_for_decision_id`; `grantor_principal_ref`; `execution_context_id`; envelope `evidence_refs`; scope refs `gate_id`, `acknowledged_evidence_refs`, `workspace_context_id`, `acknowledged_dirty_state_evidence_ref`, `repository_id`, `branch_ref`, and `acknowledged_pr_absence_evidence_ref` where present. | Typed Principal closure for `grantor_principal_ref`; target of `Lease.force_break_grant_id`; clearing record for Decision.required_grant_kind; scope evidence refs consume the evidence authority graph. | Resolve Decision, Principal, ExecutionContext, scope targets, and evidence graph; verify grant-kind clearing compatibility; enforce grant liveness, single active grant per Decision, self-approval rejection, and consumption/revocation state. |
| Lease | `held_by_session_id`; `held_by_agent_client_id`; `scope.workspace_context_id`; `scope.repository_id`; nullable `force_break_grant_id`; `execution_context_id`; envelope `evidence_refs`. | Consumes Session closure through `held_by_session_id`; consumes AgentClient and WorkspaceContext references; may consume ApprovalGrant through `force_break_grant_id`; envelope evidence refs consume the evidence authority graph. | Resolve Session, AgentClient, WorkspaceContext, repository, ExecutionContext, optional ApprovalGrant, and evidence graph; enforce `Lease.execution_context_id == Session.execution_context_id`, holder-only release, worktree containment, and active-lease uniqueness. |
| Run | `scope.operation_shape_ref`; `scope.authorizing_decision_id`; `invoker_session_id`; `invoker_agent_client_id`; `execution_context_id`; `evidence_refs`. | Closes `Evidence.run_id` as a typed FK target; consumes Session and Decision typed FK closures. | Resolve OperationShape, authorizing Decision, Session, AgentClient, and ExecutionContext; enforce `Run.execution_context_id == invoker_session.execution_context_id == authorizing_decision.execution_context_id`; verify authorizing Decision outcome is `allow`; prevent terminal-state mutation. |
| Principal | `evidence_refs`; no `execution_context_id` envelope field. | Closes `ApprovalGrant.grantor_principal_ref`; closes `Session.principal_id`; supports `requesting_principal_id` FK liveness where that FK is used. | Resolve binding evidence per `principal_kind`; verify Principal state/liveness when consumed by ApprovalGrant and Session; canonicalize Principal surface IDs before FK comparison. |
| Session | `agent_client_id`; `principal_id`; `execution_context_id`; `evidence_refs`. | Closes `Lease.held_by_session_id`; closes `Run.invoker_session_id`; closes ADR 0030 v2 `owning_session_id`; closes the consuming/requesting-session references in ADRs 0031 v1, 0051 v4, 0052, and 0054. | Resolve AgentClient, Principal, and ExecutionContext at Session mint; verify session liveness and context equality when consumed by ApprovalGrant, Lease, Run, and related request paths. |

## Audit-chain integrity rules

This ADR's audit-chain hash commitment list is limited to Decision,
ApprovalGrant, Lease, Run, Principal, and Session. These entities have
source ADR commitments for canonical field order and GENESIS handling
that this service can consume. AgentClient is explicitly excluded until a
future AgentClient canonical-hash amendment lands; until then, AgentClient
mint attempts MUST reject even though `kernel_agent_client_resolver`
remains a forward producer reservation. WorkspaceContext keeps its
existing ADR 0050 hash-order commitment, but this ADR does not expand or
restate WorkspaceContext audit-chain behavior.

For every minted Decision, ApprovalGrant, Lease, Run, Principal, or
Session record with `audit_chain_link_hash`, the service:

1. Computes the link hash at mint time from the entity-specific canonical
   field order committed by that entity ADR.
2. Uses `prior_audit_chain_link_hash` as an input to the computation,
   not as a schema field on the record.
3. Uses the entity's `GENESIS` sentinel rule for the first link in a
   chain and validates genesis placement against storage metadata.
4. Encodes every variable-length component using length-prefix encoding
   (`varint(byte_length) || field_bytes`) before hashing. Naive byte
   concatenation is forbidden.
5. Uses deterministic canonical encodings for arrays, discriminated
   unions, nullable fields, and evidence references. The `'' for null`
   substitution rules from ADRs 0049-0055 remain binding where those
   ADRs specify them.
6. Validates chain continuity before append and during explicit chain
   validation by recomputing the prior record link and comparing the
   prior-link computation input sourced from storage/audit-event
   metadata. This metadata is not a record schema field.
7. Rejects append attempts that fork, skip, mutate, or reuse chain links
   outside the service's single-writer ordering discipline. Atomic
   per-chain-root append and unique-genesis constraints are storage ADR
   requirements for the future audit-events/storage design.
8. Records every append and rejection audit event with kernel-resolved
   attribution fields: `agent_client_id`, `session_id`, `principal_id`,
   or explicit `unknown` when resolution is impossible. Attribution is
   sourced from trusted service-path and session resolution, never from
   producer payload.

Authority-chain and `derived_from` walks are bounded separately from the
storage-chain link computation. The service MUST NOT walk more than 64
records for these transitive authority checks. Cycle detection rejects
with `Decision.reason_kind: 'audit_chain_corruption_detected'` when a
Decision can be minted. Walk-depth overflow fails closed through the
audit rejection path and MUST NOT borrow `audit_chain_corruption_detected`
or any unrelated reason_kind. A future reason-kind amendment is required
before the service can emit a typed Decision for depth overflow.

## Sandbox-source rejection

The mint/audit service enforces charter invariant 8 and invariant 18 at
the runtime layer for any entity whose schema cannot perform the full
chain walk. The immediate mandatory case is `kernel_session_resolver`:
Session creation rejects if `Session.evidence_refs` cite invocation
evidence with `authority: 'sandbox-observation'` or `authority:
'self-asserted'`.

The same rejection extends transitively through the consumed authority
graph. The mint/audit service walks `DerivedSummary.derived_from`,
`CoordinationFact.evidence_refs`, chain-ref previews, and resolved
Evidence chains up to the 64-record budget. Minting rejects if any record
in that authority graph is sandbox-observation, self-asserted, unpromoted
for gate use where promotion is required, or a KnowledgeChunk reference.
This KnowledgeChunk rejection applies anywhere in the consumed
gate/promotion authority graph, not only direct evidence refs. Retrieval
and display uses that do not supply gate, promotion, mint, approval,
lease, run, or session authority are outside this rejection.

Decision, ApprovalGrant, Lease, and Run schemas already carry
envelope-level chain-walk refinements for their immediate evidence-ref
surfaces. The service remains responsible for storage-backed transitive
checks, typed identity envelopes, and any future entity whose schema
defers chain walking to producer-allowlist closure.

## Out of scope

This ADR explicitly does not authorize:

- Execution broker behavior or host operation execution. The execution
  broker is a separate future ADR and remains forbidden until
  mint/audit, approval grants, leases, and dashboard review are
  operational.
- Gateway behavior. The gateway receives operation intent and
  re-derives decisions in a separate future ADR.
- Capability registration service behavior.
- Tool resolution service behavior.
- Host state service behavior.
- Human-in-the-loop approval flows beyond programmatic record minting;
  dashboard signal consumption and dashboard-initiated producers are
  future work.
- Mutating endpoints exposed directly to agents. The mint API is
  consumed by Ring 1 services and trusted producers, not by agents.
- HCS source schema changes.
- Live policy or `tiers.yaml` changes.
- Generated-snapshot changes.
- System-config edits.
- Provider mutations.
- Hook behavior changes.
- Ring 1 service implementation code.

## Consequences

### Accepts

- The first Ring 1 service boundary is the record authority and audit
  authority, not the broker or gateway.
- Future broker, gateway, host-state, capability, and tool-resolution
  ADRs can rely on one mint/audit contract for authoritative record
  writes.
- Deferred M1 cross-record checks become an implementation checklist
  for `packages/kernel/src/mint/` and the audit-chain storage layer.
- Producer attribution is service-path-based, not merely payload-value-
  based.
- `audit_chain_corruption_detected` is the bounded chain-walk cycle
  sentinel for transitive authority checks. Depth-budget overflow remains
  fail-closed until a distinct reason_kind is registered.

### Rejects

- Schema-level cross-record enforcement. Zod remains the Ring 0 shape
  validator; it cannot query host state, audit state, or live execution
  context.
- Adapter-owned minting or hook-owned policy decisions.
- Producer self-identification as an authority mechanism.
- Agent-callable audit writes or direct mutation endpoints.
- Bundling execution broker, gateway, capability registry, tool
  resolution, host state, or dashboard approval flows into this ADR.

### Future amendments

- Execution broker ADR after mint/audit service acceptance and after the
  approval/lease/dashboard/audit stack is operational enough to preserve
  charter invariant 7.
- Gateway ADR for operation-intent routing and non-escalable re-derive.
- Capability registration, tool resolution, and host-state service ADRs.
- Dashboard producer ADR for `kernel_dashboard`, pre-emptive grant
  infrastructure, revocation attribution, and human-in-the-loop approval
  flows.
- Audit-events table/storage ADR if storage-level corruption semantics
  need a distinct reason-kind family beyond the current
  `audit_chain_corruption_detected` chain-walk sentinel.
- AgentClient canonical-hash amendment (separate ADR) -- required before
  AgentClient mint attempts can succeed and before AgentClient can join
  the audit-chain commitment list; `kernel_agent_client_resolver` remains
  a forward producer reservation until then.
- Depth-overflow reason-kind amendment (follow-up to ADR 0056 or a new
  amendment ADR) -- required before the service can emit a typed Decision
  for walk-depth overflow.
- Walk-depth budget tuning if operational evidence shows that 64 is too
  high or too low.

## Follow-up regression coverage

This ADR does not seed new regression traps synthetically. It records
coverage disposition so the implementation and eval lanes do not
overclaim runnable trajectory coverage before a harness lane exists.

| Refinement row / failure class | Current coverage disposition |
|---|---|
| AgentClient stale or self-asserted axes | Existing adjacent coverage: `packages/evals/regression/agent-client-axis-self-asserted-rejection.md`. Service-path producer spoofing remains an implementation test obligation and future trap candidate after an observed incident or fixture failure. |
| Decision append-only, cross-context substitution, audit-chain link continuity, D-037 same-step producer-disjointness | Implementation test obligation for mint/audit service; no incident yet, no trap. |
| WorkspaceContext repository/worktree verification, canonical path, active uniqueness, context binding | Existing adjacent coverage: `packages/evals/regression/cross-workspace-agent-client-reuse.md`; mint-specific checks are implementation test obligations. |
| ApprovalGrant clearing, freshness, revocation race, self-approval rejection, producer-disjointness | Implementation test obligation. Self-approval canonicalization bypass becomes a regression-trap candidate only after an observed agent/implementation failure. |
| Lease worktree uniqueness, sandbox-acquire rejection, holder-only release, force-break separation, valid_until ceiling | Implementation test obligation; no incident yet, no trap. |
| Run authorizing Decision, context triple equality, terminal-state mutation, producer-disjointness | Implementation test obligation; no incident yet, no trap. |
| Principal binding evidence, synthetic identity rejection, inv. 8 / inv. 18 chain walk, canonicalized surface IDs | Implementation test obligation; future trap only after observed failure. |
| Session sandbox-source rejection and transitive chain walk | Existing adjacent coverage: `packages/evals/regression/backup-readiness-generic-restore-ref-promotion.md` covers a sandbox-promotion shape, but not the mint/audit authority graph. Mint-specific transitive laundering is an implementation test obligation and future incident-cited trap candidate. |
| Chain cycle detection | Implementation test obligation and future trap candidate; no incident yet, no trap until observed incident or fixture failure. |
| Chain walk-depth overflow | Implementation test obligation and future reason-kind amendment; no trap until the reason-kind semantics are registered or an incident appears. |
| Producer payload value vs trusted service-path mismatch | Implementation test obligation; future trap candidate once a concrete failure class is observed. |

## Acceptance criteria

This ADR can move from `proposed` to `accepted` only after:

- Operator confirms the v3 service scope before round-3 reviewer
  dispatch.
- `hcs-architect`, `hcs-ontology-reviewer`, `hcs-policy-reviewer`,
  `hcs-security-reviewer`, and `hcs-eval-reviewer` complete review and
  all blocking findings are absorbed or explicitly rejected by the
  operator.
- The final ADR enumerates every cross-record refinement deferred from
  ADRs 0049-0055 and the current schema `.describe()` text.
- The final ADR keeps the §FK-closure inventory separate from runtime
  validation rules and covers the v3 audit-chain commitment scope:
  Decision, ApprovalGrant, Lease, Run, Principal, and Session.
- Producer allowlist scope is reconciled with the ontology-registry
  `Kernel-trusted producer allowlist final state` table.
- Audit-chain length-prefix discipline, chain validation, genesis
  handling, and prior-link input handling match ADRs 0049-0055 for the
  v3 audit-chain commitment scope.
- Sandbox-source rejection covers `kernel_session_resolver` and any
  typed-identity-envelope service that defers full chain walking to
  Ring 1.
- Depth overflow remains fail-closed through the audit rejection path
  until a distinct reason_kind is registered; it is not reported as
  `audit_chain_corruption_detected`.
- AgentClient remains excluded from audit-chain hash commitments and
  AgentClient mint attempts reject until a future AgentClient
  canonical-hash amendment ADR lands; `kernel_agent_client_resolver`
  remains only a forward producer reservation.
- The ADR still has no schema edits, no live-policy edits, no generated
  snapshot edits, no implementation code, no provider mutation, and no
  agent-callable mutating endpoints.
- `just verify` remains green.

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md`
  v1.4.1 -- invariants 1, 4, 6, 7, 8, 17, 18, 19; forbidden patterns
  covering audit-write exposure, sandbox promotion, execution-context
  inference, and hook-policy duplication.
- Ontology registry: `docs/host-capability-substrate/ontology-registry.md`
  -- `Producer-vs-kernel-set authority fields`,
  `ADR 0049–0055 foundational Ring 0 entity field authority`,
  `Cross-context enforcement layer`, `Audit-chain coverage of rejections`,
  `Kernel-trusted producer allowlist final state`,
  `Self-approval rejection rule`, `Decision.reason_kind status table
  (after ADRs 0049–0056)`, and `D-037 producer-disjointness rule`.
- Decision ledger: `DECISIONS.md` -- D-037, D-038, D-039, D-040,
  D-041, D-043, D-044, D-046, D-048, D-051.
- ADR 0007: Hook call pattern -- hooks call substrate and cache; hooks
  do not own hard policy or minting logic.
- ADR 0019 v3: Chain-promotion rule and `derived_from` closure posture.
- ADR 0028: `kernel_broker` and `mint_api` producer precedent.
- ADR 0029: Operation-class closure and `operation_class_unregistered`
  source authority.
- ADR 0031: Worktree lease/workspace context posture, worktree
  canonicalization, holder-only release, sandbox-acquire rejection, and
  lease cardinality.
- ADR 0037: AgentClient resolver and cross-agent isolation taxonomy.
- ADR 0049: Decision Ring 0 entity and D-037 producer-disjointness
  foundation.
- ADR 0050: WorkspaceContext Ring 0 entity.
- ADR 0051: ApprovalGrant Ring 0 entity, cross-step
  producer-disjointness, revocation tiebreaker, self-approval rejection,
  and length-prefix discipline.
- ADR 0052: Lease Ring 0 entity.
- ADR 0053: Run Ring 0 entity.
- ADR 0054: Principal Ring 0 entity and Principal-id canonicalization.
- ADR 0055: Session Ring 0 entity, sandbox-source rejection, and
  bounded chain-walk absorption.
- ADR 0056: `operation_class_unregistered` and
  `audit_chain_corruption_detected` reason-kind promotions.
- Generated-snapshot lane: `policies/generated-snapshot/README.md` and
  `policies/generated-snapshot/snapshot-binding.json` per D-048 and
  D-051; compatibility input only, not live policy authority.

### External

- None directly. This ADR composes existing HCS charter, registry,
  decision, and ADR commitments.
