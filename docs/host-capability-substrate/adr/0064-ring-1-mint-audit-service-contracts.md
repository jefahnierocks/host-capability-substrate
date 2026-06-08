---
adr_number: 0064
title: Ring 1 mint/audit service interface contracts
status: accepted
version: v2
date: 2026-06-07
charter_version: 1.4.1
tags: [ring-1, mint-api, audit-chain, audit-event, contracts, producer-attribution, adr-0057-followup]
---

# ADR 0064: Ring 1 mint/audit service interface contracts

## Status

`accepted`

Drafted 2026-06-07 as the ADR 0057 follow-up that types the mint/audit
service's interface contracts. This ADR is design-only. It does not
implement the service, change schemas, land Zod source, create storage,
vendor snapshots, change policy, or expose agent-callable mutation
endpoints. It composes the already-accepted ADR 0057 service boundary,
the ADR 0058 depth-overflow reason kind, the ADR 0059 AgentClient
canonical-hash amendment, and the ADR 0061 Decision rule-attribution pair
into a stable typed contract surface that future Ring 1 services (broker,
gateway, dashboard) and the future audit-events/storage ADR can depend
on.

ADR 0064 v1 was dispatched to all five reviewers for round 1 on
2026-06-07. All five returned `yes_with_mechanical_tweaks` with **zero
blockers**: the contract layer stays Ring-1 design-only with no
runtime/storage/endpoint/schema/policy leakage; the AgentClient mint-block
lift was confirmed evidence-backed (ADR 0059 schema landed; `agent-client.ts`
carries the canonical-hash text); the per-entity mint contract, producer
paths, canonical-hash authorities, and Zod-defined-vs-registry-canonical
reason-kind split all reconcile against the landed schemas and the registry
allowlist; and the B-1/B-2 obligations are homed faithfully per ADR 0061.
v2 absorbs every mechanical tweak: it restates the
sandbox-observation / self-asserted / unpromoted / KnowledgeChunk
transitive rejection on the bounded walk (security); pins `resolved_context`
as service-path-constructed, never deserialized from a request body
(security); ties the rejection-class examples to the registry taxonomy
(security/ontology); aligns the B-2 wording to "the bound, verified snapshot
digest" and states the B-1/B-2 fail-closed coupling so attribution is never
recorded against an unverified digest (policy); reframes the ADR 0057
relationship as completing its prose interface-contract layer rather than a
discrete deferred amendment item (architect); guards the Decision row
against a producer x reason-kind cartesian reading and marks its reason
kinds a representative subset of the Decision-borne union
(architect/ontology); adds the AgentClient non-operation-bearing fail-closed
caveat and de-circularizes the seven-entity wording (ontology); marks
WorkspaceContext as hash-bearing-but-not-in-the-seven (ontology); and
corrects the dispatch-plan "trap" wording to "test obligation" (eval). No
blocker required a re-review; v2 is presented for acceptance under the
mechanical-tweaks-at-acceptance discipline (ADR 0058 precedent).

ADR 0064 is accepted 2026-06-07 as D-062. Round 1 returned zero blockers
and v2 folded every mechanical tweak, so no confirming round 2 was required.
It completes ADR 0057's interface-contract layer (left as prose in ADR 0057
§Service boundary) and discharges ADR 0061's routed B-1 / B-2 open-items;
AgentClient joins as the seventh audit-chain-committed mint entity. The
follow-on schema PR (any contract Zod types), the audit-events/storage ADR
(persistence, atomic per-chain-root append, unique-genesis), and the
consuming broker/gateway/dashboard ADRs remain future work.

## Date

2026-06-07

## Charter version

Written against implementation charter v1.4.1 and
`docs/host-capability-substrate/ontology-registry.md` v0.4.25. The
contracts rely on invariants 1 (policy stays in live policy, not in this
service's schema layer), 4 (audit is the integrity surface and is
internal), 6 (forbidden tiers stay non-escalable), 7 (no mutating
execution endpoint may exist before the approval/lease/audit/dashboard
stack is operational — so this ADR stays design/contract-only), 8 and 18
(sandbox/self-asserted authority does not promote; chain-walk rejection),
17 (execution context is declared, not inferred), and 19 (boundary claims
remain freshness-bound and execution-context-bound). Invariant 7 keeps
this ADR to interface/contract scope: it specifies what the mint/audit
service accepts, returns, and records, but adds no runnable mint endpoint,
no persistence, and no execution path.

## Reviewer dispatch plan

Proposed reviewer dispatch after operator scope confirmation; all five,
matching the ADR 0057 / ADR 0058 mint/audit review discipline:

- `hcs-architect` -- verify the contract layer does not reopen ADR 0057's
  boundary, stays Ring 1 design-only with no runtime/storage/endpoint
  leakage, lifts the AgentClient mint-block correctly per ADR 0059, and
  keeps the audit-event contract distinct from the deferred storage ADR.
- `hcs-ontology-reviewer` -- verify the per-entity mint contract matches
  the landed entity schemas and `.describe()` text, the canonical-hash
  references match ADRs 0049-0055 + 0059, the producer paths reconcile
  with the registry `Kernel-trusted producer allowlist final state`, and
  the audit-event attribution fields are typed FKs to the right entities.
- `hcs-policy-reviewer` -- verify no live-policy duplication, no
  tier/grant escalation, that B-1 mandatory-attribution and B-2 digest
  verification stay Ring 1 obligations referencing (never copying)
  system-config live policy, and that the snapshot-binding boundary
  (D-051) is preserved.
- `hcs-security-reviewer` -- verify producer-spoof prevention stays
  service-path-based, audit-write stays internal (no agent-callable
  surface), sandbox/self-asserted/KnowledgeChunk rejection is preserved
  transitively, the rejection contract fails closed, and the audit-event
  attribution cannot be payload-asserted.
- `hcs-eval-reviewer` -- verify the contract creates implementation-test
  obligations (including the ADR 0061 B-2 intermediate-checkpoint test
  obligation) without seeding synthetic traps or implying a runnable
  harness before one exists.

## Context

ADR 0057 (D-052) accepted the first Ring 1 service boundary: the
mint/audit service owns authoritative record minting, producer allowlist
enforcement, audit-chain link computation and validation, sandbox-source
rejection, bounded authority-chain walks, and the cross-record
refinements that ADRs 0049-0055 deferred out of Ring 0 schemas. ADR 0057
specified that boundary in prose — "the service owns X", "check Y
executes here" — and deliberately deferred three things:

1. **The typed interface contracts.** ADR 0057 named the producer
   allowlist, the audit-event attribution fields, and the cross-record
   checks, but did not type the shapes a trusted service path submits
   (the mint request), receives (the mint result), or the append/rejection
   audit event itself. Each future consumer (broker FSM, gateway
   re-derive, dashboard producer, the audit-events/storage ADR) would
   otherwise re-derive these shapes independently — exactly the
   duplication ADR 0057 Option B rejected.

2. **AgentClient minting.** ADR 0057 blocked AgentClient mint attempts
   pending a narrow canonical-hash amendment, while keeping
   `kernel_agent_client_resolver` as a forward producer reservation. That
   amendment is now **landed**: ADR 0059 (D-058) committed AgentClient's
   canonical field order, GENESIS handling, and length-prefix discipline,
   and its schema PR merged (registry v0.4.24). The mint-block can now
   lift without re-scoping ADR 0057.

3. **The Decision attribution population.** ADR 0061 (D-059) added the
   additive nullable-optional `policy_rule_ref` + `resolved_policy_sha256`
   pair to `Decision` and explicitly routed two obligations to "the
   mint/audit implementation ADR's open-items": **B-1** mandatory
   attribution by `reason_kind` / `outcome`, and **B-2** verification of
   `resolved_policy_sha256` against the bound, verified live-policy
   snapshot digest. ADR 0061 §Future amendments states this deferral
   "must not evaporate." This ADR is that open-items home.

ADR 0058 (D-053) supplied the typed depth-overflow reason kind
(`authority_chain_walk_depth_exceeded`) that the rejection contract
needs, keeping `audit_chain_corruption_detected` cycle-only.

The generated-snapshot lane exists (D-048, D-051): the service may
consume an authorized, hash-bound runtime policy snapshot/cache sourced
from system-config live policy, but live policy authority stays outside
this repo. This ADR preserves that boundary; it references the bound
snapshot digest, it does not author or duplicate policy.

This ADR does not begin Ring 1 implementation. Per charter invariant 7,
no mutating endpoint may exist before approval grants, leases,
tamper-evident audit, and dashboard review are operational. A typed
contract is the artifact that lets those land in dependency order without
each one re-deciding the mint/audit shape.

## Options considered

### Option A: Type the mint/audit interface contracts now (design-only)

Specify the mint request/result contract, the audit-event contract, the
rejection/reason-kind resolution contract, and the per-entity mint
contract (including AgentClient, now unblocked) as typed design shapes.
Land no Zod source, no storage, no runtime, no endpoints.

**Pros:**

- Gives the future broker, gateway, dashboard, and audit-events/storage
  ADRs one typed contract to depend on, matching ADR 0057 Option C's
  rationale at the interface layer.
- Lifts ADR 0057's AgentClient mint-block cleanly, now that ADR 0059
  landed, without re-scoping ADR 0057.
- Gives ADR 0061's B-1 / B-2 obligations a durable, typed home so the
  deferral does not evaporate.
- Keeps Ring 0 schemas and live policy unchanged; preserves charter
  invariant 7 (design-only, no execution path).

**Cons:**

- Adds a contract ADR before any runtime exists, so the contract is
  validated by review and future implementation tests rather than by a
  running service.
- Touches many entity and producer contracts at once, requiring full
  five-reviewer coverage.

### Option B: Defer the contracts to implementation time

Leave ADR 0057's prose boundary as the only contract and let the first
mint/audit implementation PR define the request/result/audit-event
shapes.

**Pros:**

- No contract ADR now; the shapes land with code.

**Cons:**

- Each consuming service (broker, gateway, dashboard, storage) would face
  an untyped boundary and re-derive shapes, risking drift — the failure
  ADR 0057 Option B already rejected.
- ADR 0061's B-1 / B-2 obligations stay homeless and risk evaporating.
- The AgentClient mint-block lift would land tangled with implementation
  rather than as a reviewed design decision.

### Option C: Bundle the audit-event storage table into this ADR

Define the audit-event contract and its persistent storage (table shape,
atomic per-chain-root append, unique-genesis enforcement) together.

**Pros:**

- One ADR covers both the event shape and its persistence.

**Cons:**

- Reverses ADR 0057's explicit deferral of atomic append and
  unique-genesis to "the future audit-events/storage ADR."
- Persistence is runtime/storage work; pulling it in risks charter
  invariant 7 (class-I, unmergeable until M4) and the "no
  SQLite/launchd/persistence" scope this milestone holds.

## Decision

Choose **Option A**. This ADR types the mint/audit service interface
contracts as design-only artifacts, lifts the AgentClient mint-block per
ADR 0059, and carries ADR 0061's B-1 / B-2 obligations. It lands no Zod
source, no storage, no runtime, and no endpoints. A follow-on schema PR
(per `.agents/skills/hcs-schema-change`) may later land any contract Zod
types named here (for example an `AuditEvent` envelope or typed
`MintRequest` / `MintResult` discriminated unions); the persistent
audit-events store remains the separate audit-events/storage ADR.

The shapes below are **design sketches**, not committed schema source.
They name fields and discriminators; exact Zod encodings land in the
follow-on schema PR.

## Mint request / result contract

The mint/audit service exposes one internal mint entry point, reached
only through trusted Ring 1 service paths and producer resolvers, never
by agents (ADR 0057 §Service boundary; charter inv. 7 keeps it
non-agent-callable).

A **mint request** carries:

```text
MintRequest
  entity_kind        : one of { decision, approval_grant, lease, run,
                                principal, session, agent_client,
                                workspace_context }
  candidate_payload  : the producer-supplied, schema-valid Ring 0 record
                       WITHOUT kernel-set fields the service computes
                       (audit_chain_link_hash is service-computed; the
                       prior-link input is storage/audit metadata, never
                       a candidate field)
  resolved_context   : kernel-resolved, service-path-supplied, NEVER
                       payload-asserted:
                         resolved_producer    (the authenticated producer
                                               class for this service path)
                         resolved_attribution (agent_client_id?,
                                               session_id?, principal_id?,
                                               or explicit unknown)
                         prior_link_ref       (storage/audit metadata
                                               reference for chain
                                               continuity; not a record
                                               field)
                         bound_snapshot_ref   (the bound, verified
                                               live-policy snapshot digest
                                               this request resolves rules
                                               against, where applicable)
```

`resolved_context` is **constructed by the kernel-resolved, authenticated
service path**, never deserialized from an agent- or producer-supplied
request body: `resolved_producer`, `resolved_attribution`, `prior_link_ref`,
and `bound_snapshot_ref` are all kernel-resolved, not read from
`candidate_payload`. A payload that self-asserts any kernel producer class,
attribution field, or snapshot reference rejects (ADR 0057 §Producer
allowlist enforcement).

A **mint result** is a discriminated outcome:

```text
MintResult
  = MintAccepted { minted_record       (with service-computed
                                         audit_chain_link_hash),
                   audit_event_ref     (the append AuditEvent) }
  | MintRejected { decision?           (a typed Decision IFF an applicable
                                         Zod-defined, outcome-compatible
                                         reason_kind exists and a valid
                                         Decision envelope can be built),
                   audit_event_ref     (the rejection AuditEvent, ALWAYS
                                         present) }
```

Every mint attempt — accepted or rejected — produces exactly one
AuditEvent. A rejection produces a typed `Decision` only when the
rejection/reason-kind resolution contract below yields one; otherwise the
rejection is audit-only and fails closed (no invented or borrowed
reason_kind). The mint entry point is idempotent only at the storage
layer's single-writer append discipline, which is the audit-events/storage
ADR's responsibility, not this contract's.

## Audit-event contract

Per charter invariant 4, every append and every rejection records a
tamper-evident audit event with kernel-resolved attribution. ADR 0057
named the attribution fields; this ADR types the event shape. Audit
writes are internal to the service; no agent-callable audit-write surface
exists (charter forbidden-pattern; ADR 0057 §Rejects).

```text
AuditEvent
  event_kind          : one of { append, rejection }
  entity_kind         : the mint request's entity_kind
  subject_ref         : the minted record id (append) or the rejected
                        candidate's stable correlation id (rejection)
  attribution         : kernel-resolved, service-path-sourced, NEVER
                        payload-asserted:
                          agent_client_id? (typed FK -> AgentClient)
                          session_id?      (typed FK -> Session)
                          principal_id?    (typed FK -> Principal)
                          unknown          (explicit when resolution is
                                            impossible)
  rejecting_layer?    : one of { mint_api, broker_fsm, gateway } on
                        rejection (mirrors registry §Audit-chain coverage
                        of rejections)
  rejection_class?    : the typed rejection-class discriminator on
                        rejection, drawn from the registry §Audit-chain
                        coverage of rejections taxonomy (e.g.
                        cross_context_target_mismatch,
                        force_protected_combination,
                        authority_class_promotion_attempt); a free-form
                        string is not permitted
  decision_ref?       : typed FK -> the emitted Decision when MintRejected
                        carried one
  chain_link_meta     : the storage/audit metadata used as the
                        prior-link computation input — NOT a record schema
                        field (ADR 0057 audit rule 6)
  observed_at         : kernel observation timestamp
```

The audit-event contract defines the **shape**. It does **not** define
the persistent store, the atomic per-chain-root append, or the
unique-genesis constraint — those remain the audit-events/storage ADR's
scope (ADR 0057 audit rule 7; §Future amendments). Attribution is sourced
from trusted service-path and session resolution, never from producer
payload (ADR 0057 audit rule 8).

## Rejection and reason-kind resolution contract

Rejection handling is service-wide and fails closed (ADR 0057 §Producer
allowlist enforcement; ADR 0058 §Typed-Decision emission scope). For each
rejection class the service resolves a reason kind as follows:

1. If a Zod-defined, outcome-compatible `Decision.reason_kind` exists for
   the rejection class **and** a schema-valid Decision envelope can be
   built (a valid `operation_shape_ref` is available), emit a typed
   `Decision` with that reason kind and record `decision_ref` on the
   rejection AuditEvent.
2. Otherwise, record a rejection AuditEvent with a typed `rejection_class`
   and **no** Decision. The service MUST NOT invent an ad hoc reason kind
   or borrow an unrelated one.

The two bounded-authority-walk cases are fixed by ADR 0057 / ADR 0058 and
restated here as contract obligations:

| Failure class | Reason-kind contract |
|---|---|
| Cycle detected in the bounded authority/`derived_from` walk | Typed Decision with `audit_chain_corruption_detected` (deny-only) when a Decision envelope can be built. Cycle-only; never used for depth overflow. |
| Authority-walk depth budget (≤ 64) exceeded, operation-bearing mint with a valid `operation_shape_ref` | Typed Decision with `authority_chain_walk_depth_exceeded` (ADR 0058; deny-only, non-clearable, `decided_by` ∈ {`mint_api`, `kernel_broker`}). |
| Depth budget exceeded with no available `operation_shape_ref` (e.g. Principal/Session mint, pure chain validation) | Fail-closed audit rejection, **no** Decision, until a distinct reason kind lands (ADR 0058 §Typed-Decision emission scope). MUST NOT borrow `audit_chain_corruption_detected`. |

`decided_by` is necessary but not sufficient: the producer value must also
match the authenticated kernel-resolved service path (ADR 0057 / ADR 0058
service-path matching).

A rule-applying (gate) Decision whose attribution pair (B-1) is populated
MUST fail closed if `resolved_policy_sha256` cannot be verified (B-2)
against `bound_snapshot_ref` — absent or mismatched — so attribution is
never recorded against an unverified or unbound policy digest.

## Per-entity mint contract

The mint/audit service is the only accepted path for minting the
audit-chain-committed entities. For each, this contract names the
producer path, the canonical-hash authority (consumed, not redefined),
the principal cross-record checks owned by the service (ADR 0057
§Cross-record refinements — referenced, not restated in full), and the
Zod-defined rejection reason kinds available today. WorkspaceContext is
listed for completeness — it carries an `audit_chain_link_hash` (ADR 0050
hash order) but ADR 0057 deliberately keeps it OUT of the seven-entity
audit-chain commitment list and does not restate its audit-chain behavior;
ExecutionContext minting stays with the future host-state/resolver
service (ADR 0057 §Service boundary).

| Entity | Producer path | Canonical-hash authority | Principal mint-time cross-record checks (ADR 0057) | Zod-defined rejection reason_kinds available |
|---|---|---|---|---|
| Decision | `mint_api`, `kernel_broker`, `kernel_gateway` | ADR 0049 | Reject producer-supplied envelopes; set kernel-set fields; append-only immutability; cross-context substitution defense; D-037 producer-disjointness; **populate the ADR 0061 attribution pair for rule-applying decisions (B-1)**; **verify `resolved_policy_sha256` against the bound, verified snapshot digest before a rule influences the Decision (B-2)** | Representative subset of the Decision-borne `decisionReasonKindSchema` union (all 18 Zod-defined values are Decision-borne): `gate_*`, `operation_class_unregistered`, `audit_chain_corruption_detected`, `authority_chain_walk_depth_exceeded` (producer-scoped to `mint_api` / `kernel_broker` per ADR 0058, NOT `kernel_gateway`), and the shared ADR 0037 containment/axis reasons (also the AgentClient-mint rejection reasons) |
| ApprovalGrant | `mint_api`, `kernel_broker` | ADR 0051 v4 | Grant-kind clearing compatibility against the bound snapshot; single active grant per `minted_for_decision_id`; self-approval rejection (typed Principal FK, ADR 0054 canonicalization); revoke-wins; producer-disjointness; null/non-clearable handling | (grant-clearing reason kinds remain registry-canonical pending their own schema PR; fail-closed until Zod-lifted) |
| Lease | `mint_api`, `kernel_broker` | ADR 0052 | Worktree-path canonicalization; active worktree-lease uniqueness; `Lease.execution_context_id == Session.execution_context_id`; sandbox-acquire rejection; holder-only release; force-break separation; 24h ceiling | `worktree_lease_held_by_other_session` (Zod-defined); remaining lease reasons registry-canonical, fail-closed until Zod-lifted |
| Run | `mint_api`, `kernel_broker` | ADR 0053 | Authorizing Decision resolves to an `allow`; context-triple equality; one active Run per authorizing Decision; terminal-state mutation rejection; producer-disjointness | (run reason kinds registry-canonical pending their schema PR; fail-closed until Zod-lifted) |
| Principal | `kernel_principal_resolver` | ADR 0054 | Binding-evidence verification per `principal_kind`; synthetic-identity rejection; inv. 8/18 chain-walk via producer-allowlist closure; surface-id canonicalization at mint | (Principal reason kinds registry-canonical; depth-overflow here is fail-closed audit-only per ADR 0058 — no `operation_shape_ref`) |
| Session | `kernel_session_resolver` | ADR 0055 | FK liveness (`agent_client_id`, `principal_id`, `execution_context_id`); sandbox/self-asserted invocation-evidence rejection; transitive `derived_from` walk (≤ 64, cycle→`audit_chain_corruption_detected`); cross-context substitution rejection | (Session reason kinds registry-canonical; depth-overflow fail-closed audit-only per ADR 0058) |
| AgentClient | `kernel_agent_client_resolver` | **ADR 0059** (canonical order + GENESIS + length-prefix; landed D-058) | Reject self-asserted agent-client axes and resolver evidence not grounded in observed launch/process/installed-binary/remote-cloud execution-context evidence; FK liveness when consumed | `agent_client_axis_self_asserted`, `containment_evidence_absent`, `containment_evidence_producer_supplied`, `containment_runtime_capability_exceeded` (Zod-defined; but AgentClient mint is non-operation-bearing, so a rejection that cannot resolve a valid `operation_shape_ref` falls to the fail-closed audit-only branch, like Principal/Session) |
| WorkspaceContext | `kernel_workspace_diagnose` | ADR 0050 | Repository/worktree verification; canonical path; one active per `(repository_id, canonical(worktree_path))`; one `execution_context_id` binding; atomic supersession | (WorkspaceContext reason kinds registry-canonical) |

"Registry-canonical, fail-closed until Zod-lifted" means: the rejection
class is registered in the ontology-registry `Decision.reason_kind` status
table but not yet a `decisionReasonKindSchema` member, so the service
fails closed on the audit path (no typed Decision) until a future schema
PR Zod-lifts that value alongside the service or schema that consumes it.

## AgentClient mint-block lift

ADR 0057 §Service boundary and §Audit-chain integrity rules blocked
AgentClient mint attempts and excluded AgentClient from the audit-chain
hash commitment list "until a future AgentClient canonical-hash amendment
ADR commits canonical field order and GENESIS handling." That amendment
is ADR 0059 (D-058), now landed at the schema layer (registry v0.4.24).

This ADR therefore **lifts the AgentClient mint-block** at the contract
layer: the mint/audit service accepts AgentClient mint requests through
`kernel_agent_client_resolver`, computes `audit_chain_link_hash` from the
ADR 0059 canonical field order with GENESIS handling and length-prefix
encoding, and adds AgentClient as the seventh entity, joining the six
ADR 0057 committed (Decision, ApprovalGrant, Lease, Run, Principal,
Session). The lift does not re-scope ADR 0057; it consumes ADR 0057's
forward `kernel_agent_client_resolver` reservation exactly as ADR 0057
§Future amendments anticipated.

## Canonical-hash and bounded-walk contract

The service's hash and walk obligations are committed by ADR 0057
§Audit-chain integrity rules and the entity ADRs (0049-0055) plus ADR
0059 (AgentClient). This ADR restates them as interface obligations so a
consumer can rely on them without reading every entity ADR:

- Compute `audit_chain_link_hash` at mint time from the entity-specific
  canonical field order; `prior_audit_chain_link_hash` is a computation
  input sourced from storage/audit metadata, never a record schema field.
- Use the entity's `GENESIS` sentinel for the first link; validate genesis
  placement against storage metadata (never producer-asserted).
- Length-prefix every variable-length component
  (`varint(byte_length) || field_bytes`, shortest-form unsigned varint);
  naive byte concatenation is forbidden; `'' for null` substitution per
  the entity ADRs.
- Bound authority/`derived_from` walks to ≤ 64 records, separate from the
  storage-chain link computation; cycle → `audit_chain_corruption_detected`;
  depth overflow → the rejection contract above.
- Reject minting if any record in the consumed authority/`derived_from`
  graph — transitively, to the 64-record budget — carries
  `authority: sandbox-observation` or `authority: self-asserted`, is
  unpromoted for gate use where promotion is required, or is a KnowledgeChunk
  reference (ADR 0057 §Sandbox-source rejection; charter inv. 8 and 18). This
  applies anywhere in the consumed gate/promotion/mint/approval/lease/run/
  session authority graph, not only direct evidence refs.
- Atomic per-chain-root append and unique-genesis enforcement are
  **storage** obligations deferred to the audit-events/storage ADR (ADR
  0057 audit rule 7).

## Out of scope

This ADR explicitly does not authorize:

- Ring 1 mint/audit implementation code, runtime, persistence, SQLite,
  launchd, or any storage layer.
- The persistent audit-events store, atomic per-chain-root append, or
  unique-genesis enforcement (audit-events/storage ADR).
- Mutating endpoints exposed to agents. The mint entry point is consumed
  by trusted Ring 1 service paths only.
- Execution broker, gateway re-derive, capability registration, tool
  resolution, host-state, or dashboard human-in-the-loop behavior.
- HCS Ring 0 schema source edits or generated JSON Schema changes
  (a follow-on schema PR lands any contract Zod types named here).
- Live policy, `tiers.yaml`, generated-snapshot, or system-config edits.
  The contract references the bound snapshot digest; it does not author or
  duplicate policy.
- Edits to ADR 0057, 0058, 0059, 0061, or ADRs 0049-0055.
- New producers. The producer allowlist remains the registry
  `Kernel-trusted producer allowlist final state` table.
- Provider mutations or hook behavior changes.

## Consequences

### Accepts

- The mint/audit service gains a typed request/result, audit-event, and
  rejection contract that future Ring 1 services and the audit-events/
  storage ADR can depend on without re-deriving shapes.
- The AgentClient mint-block lifts; AgentClient becomes the seventh
  audit-chain-committed mint entity at the contract layer.
- ADR 0061's B-1 (mandatory attribution population) and B-2 (digest
  verification against the bound snapshot) obligations have a durable,
  typed home and no longer risk evaporating.
- Producer attribution and audit attribution are service-path-resolved,
  never payload-asserted, at the contract level.
- The rejection contract makes fail-closed behavior explicit per rejection
  class, including the ADR 0058 depth-overflow split.

### Rejects

- Untyped boundary deferral to implementation time (Option B).
- Bundling the persistent audit-events store into this ADR (Option C).
- Agent-callable mint or audit-write endpoints.
- Producer or attribution self-identification as an authority mechanism.
- Duplicating live policy into the contract; only the bound snapshot
  digest is referenced.
- Any schema source, live-policy, generated-snapshot, system-config, or
  Ring 1 implementation change in this ADR slice.

### Future amendments

- Follow-on schema PR to land any contract Zod types named here
  (`AuditEvent` envelope; typed `MintRequest` / `MintResult` discriminated
  unions) per `.agents/skills/hcs-schema-change`.
- Audit-events/storage ADR for the persistent store, atomic per-chain-root
  append, unique-genesis enforcement, and any storage-level corruption
  reason-kind family.
- Execution broker ADR, gateway ADR, and dashboard producer ADR, each
  consuming this mint/audit contract.
- A reason-kind amendment for non-operation-bearing depth overflow if
  implementation evidence shows Principal/Session/pure-chain-validation
  overflow needs a typed Decision.
- Zod-lifting the registry-canonical ApprovalGrant/Lease/Run/Principal/
  Session/WorkspaceContext rejection reason kinds as their consuming
  services or schema PRs land.

## Follow-up regression coverage

This ADR seeds no synthetic regression traps. It records
implementation-test obligations for the future mint/audit service and the
follow-on schema PR.

| Failure class | Coverage posture |
|---|---|
| Producer/attribution payload self-assertion vs trusted service path | Implementation test obligation when the service lands; future trap candidate after an observed incident or fixture failure. |
| Transitive sandbox / self-asserted / unpromoted / KnowledgeChunk authority at depth N | Implementation test obligation: a record at depth N in the consumed authority/`derived_from` graph of a Decision/Lease/Run/Session mint rejects even when the direct `evidence_refs` are clean (transitive, not first-hop only); security-load-bearing, no synthetic trap now. |
| Mint result discrimination (accepted vs rejected-with-Decision vs rejected-audit-only) | Implementation test obligation; the rejection contract's fail-closed branch must assert no invented/borrowed reason kind. |
| Audit-event attribution sourced from service path, never payload | Implementation test obligation; security-load-bearing. |
| ADR 0061 B-2 digest verification | Implementation test obligation; the test MUST assert the loader rejects at the digest-verification checkpoint (an intermediate trajectory step, when `resolved_policy_sha256` != the bound, verified snapshot digest), not merely that the final Decision is rejected (per ADR 0061 §Follow-up regression coverage). |
| ADR 0061 B-1 mandatory attribution by `reason_kind` / `outcome` | Implementation test obligation; the rule-applying decisions that MUST carry the attribution pair are a mint/audit enforcement rule, not Ring 0. Checkpoint: for a rule-applying decision the pair is populated at mint before the append AuditEvent is recorded; a rule-applying decision minted without the pair is rejected. |
| AgentClient mint after block lift | Implementation test obligation: deterministic hash vectors per ADR 0059 (including present-empty vs absent `valid_until` / `parser_version` non-collision) and GENESIS/duplicate-genesis enforcement when the service and the audit-events/storage ADR land. |
| Depth-overflow cycle-vs-budget split and fail-closed non-operation path | Implementation test obligation; reuses ADR 0057 / ADR 0058 coverage disposition; no synthetic trap at ADR acceptance. |

## Acceptance criteria

This ADR can move from `proposed` to `accepted` only after:

- Operator confirms this v1 contract scope before reviewer dispatch.
- `hcs-architect`, `hcs-ontology-reviewer`, `hcs-policy-reviewer`,
  `hcs-security-reviewer`, and `hcs-eval-reviewer` complete review and all
  blocking findings are absorbed or explicitly rejected by the operator.
- The mint request/result, audit-event, and rejection contracts stay
  design-only: no Zod source, no storage, no runtime, no agent-callable
  endpoint.
- The per-entity mint contract reconciles with the landed entity schemas,
  the registry `Kernel-trusted producer allowlist final state`, and the
  canonical-hash authorities (ADRs 0049-0055 + 0059).
- The AgentClient mint-block lift cites ADR 0059 and adds AgentClient to
  the seven-entity audit-chain commitment list without re-scoping ADR
  0057.
- ADR 0061's B-1 and B-2 obligations are carried as explicit contract
  obligations / implementation-test obligations.
- The audit-event contract stays distinct from the deferred
  audit-events/storage ADR (shape here; persistence/atomic-append/
  unique-genesis there).
- The acceptance commit records a new `DECISIONS.md` row and states that
  ADR 0064 completes ADR 0057's interface-contract layer (left as prose in
  ADR 0057 §Service boundary; per-service re-derivation is what ADR 0057
  Option B rejected) and discharges ADR 0061's routed B-1 / B-2 open-items.
- `just verify` remains green.

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md`
  v1.4.1 -- invariants 1, 4, 6, 7, 8, 17, 18, 19; forbidden patterns
  covering audit-write exposure, sandbox promotion, execution-context
  inference, and hook-policy duplication.
- ADR 0057 / D-052:
  `docs/host-capability-substrate/adr/0057-ring-1-mint-audit-service.md`
  -- the service boundary, producer allowlist, cross-record refinements,
  FK-closure inventory, audit-chain integrity rules, sandbox-source
  rejection, and the AgentClient mint-block this ADR lifts.
- ADR 0058 / D-053:
  `docs/host-capability-substrate/adr/0058-depth-overflow-reason-kind-promotion.md`
  -- `authority_chain_walk_depth_exceeded`, cycle-vs-depth split, and
  typed-Decision emission scope.
- ADR 0059 / D-058:
  `docs/host-capability-substrate/adr/0059-agentclient-canonical-hash-amendment.md`
  -- AgentClient canonical field order, GENESIS handling, and length-prefix
  discipline (landed); the basis for the mint-block lift.
- ADR 0061 / D-059:
  `docs/host-capability-substrate/adr/0061-decision-rule-attribution-amendment.md`
  -- the Decision attribution pair and the routed B-1 / B-2 obligations
  this ADR homes.
- ADRs 0049-0055 -- Decision, WorkspaceContext, ApprovalGrant, Lease, Run,
  Principal, Session entity shapes and canonical-hash commitments.
- Ontology registry:
  `docs/host-capability-substrate/ontology-registry.md` v0.4.25 --
  `Kernel-trusted producer allowlist final state`,
  `Cross-context enforcement layer`,
  `Audit-chain coverage of rejections`,
  `Canonical-concatenation length-prefix discipline`,
  `Current schema-version ledger`, and the `Decision.reason_kind` status
  table.
- Decision ledger: `DECISIONS.md` -- D-037, D-046, D-051, D-052, D-053,
  D-058, D-059.
- Generated-snapshot lane: `policies/generated-snapshot/README.md` and
  `snapshot-binding.json` per D-048 and D-051; compatibility/bound-digest
  input only, not live policy authority.
- Schema-change workflow: `.agents/skills/hcs-schema-change/SKILL.md`.

### External

- None. This ADR composes existing HCS charter, registry, decision, and
  ADR commitments.
