---
adr_number: 0038
title: Phase 2 schema-landing sequence
status: accepted
date: 2026-05-04
charter_version: 1.3.2
tags: [meta-adr, phase-2, schema-sequencing, dependency-order, registry-mirror, charter-amendment-wave]
---

# ADR 0038: Phase 2 schema-landing sequence

## Status

accepted (v2 + 3 mechanical tweaks at acceptance)

## Date

2026-05-04 (v1, draft); 2026-05-04 (v2, closes 4 architect blockers
+ folds 9 non-blocking observations from `hcs-architect` review of
v1); 2026-05-04 (v2 accepted with 3 mechanical tweaks at
acceptance).

## Acceptance note

`hcs-architect` returned READY-FOR-ACCEPTANCE on v2 with no
blocking findings — the cleanest first-round outcome among Phase 1
meta-ADRs. Three mechanical tweaks were folded at acceptance to
close non-blocking observations:

1. **NN-1 (FK-table row 2.1.3 AgentClient hedge).** Tightened to
   "(no entity FK; CoordinationFact authoring authority is
   producer-class-shaped per ADR 0019 v3 §Promotion audit-record
   completeness, not a typed AgentClient FK)" to remove the
   latent typed-FK reading. Required-prior-phases for row 2.1.3
   correspondingly tightened from "2.0; 2.1.1" to "2.0" (no FK
   dependency on Phase 2.1.1; in-phase order is bounded-
   reviewer-load only).

2. **NN-2 (citation span imprecision in v2 Revision history).**
   Updated B1 closure citations from lines 349 and 411-413 to
   lines 347-349 (GitIdentityBinding) and 407-415 (ToolProvenance)
   per the actual `evidenceSchema`-direct framing locations in
   ADR 0034 v2.

3. **NN-3 (FK-table row 2.3.1 over-strong dependency).** Tightened
   "Required prior phases" to "2.1" only (Phase 2.3.1 is direct
   Evidence subtypes per B1 closure; does not FK to Phase 2.2.3
   boundary dimensions). Added column-semantics note above the FK
   dependency table clarifying that phase-level pre-conditions
   are captured in §Phase 2.x prose, not duplicated in the FK
   table.

One forward-looking observation deferred to future meta-ADR
practice: meta-ADRs containing FK dependency tables or entity-
name references should dispatch `hcs-ontology-reviewer` alongside
`hcs-architect`. NN-1 was an ontology-precision miss that
ontology-reviewer would have caught faster. The IMPLEMENT.md
required-reviewer rule remains a floor; future Phase 3 sequencing
meta-ADRs (queued in §Future amendments A1) should follow this
practice without a rule amendment unless the miss recurs.

## Revision history

- **v1 (2026-05-04)**: initial draft per user-approved foundation-
  first sequence after Phase 1 synthesis-window closure.
- **v2 (2026-05-04)**: closes 4 `hcs-architect` blockers and folds
  9 non-blocking observations:
  - **B1** — Phase 2.3.1 `ToolProvenance` + `GitIdentityBinding`
    re-classified as **direct Evidence subtypes (Q-011 bucket 1)**
    per ADR 0034 v2 §Sub-decision (c) Composition partners table
    (lines 344-345) and `evidenceSchema`-direct typed payload
    sections (lines 347-349 for GitIdentityBinding, lines 407-415
    for ToolProvenance). They are NOT BoundaryObservation envelope
    payloads. Phase 2.3 dependency story restated: 2.3.1 has no FK
    to Phase 2.2.3.
  - **B2** — `runner_isolation` boundary_dimension addition moved
    from Phase 2.2.3 to Phase 2.3.2. Per ADR 0032 (lines 82, 255,
    280, 435), `runner_isolation` is owned by Q-005, not by ADR
    0036's Phase 2.2.3 cohort. Phase 2.3.2 is the only consumer;
    landing the boundary_dimension addition with the receipt PR
    keeps attribution coherent.
  - **B3** — Phase 2.1 internal order revised. New order: AgentClient
    (2.1.1) → VerificationCommandSpec (2.1.2) → Knowledge+Coordination
    subgraph (2.1.3) → QualityGate (2.1.4). Reason: invariant 18
    (derived retrieval ≠ gate authority) is encoded into QualityGate
    as a Zod refinement that walks `evidence_refs` chains looking
    for `KnowledgeChunk` references and unpromoted `DerivedSummary`
    references (per ADR 0019 v3 §Chain promotion rule, lines
    638-662). The refinement requires typed FK to those entities;
    landing QualityGate before the Knowledge subgraph forces a
    name-string-based refinement with a follow-up promote-to-typed-FK
    PR.
  - **B4** — Phase 2.1.3 (formerly 2.1.4) Knowledge+Coordination
    subgraph-as-one-PR rationale rewritten on review-coherence
    grounds, not atomicity grounds. Per ADR 0019 v3 §Chain promotion
    rule, the rule is enforced at the Layer 1 mint API when
    minting/promoting `DerivedSummary`; it does not require the four
    entities to land atomically. Subgraph-PR remains because four
    entities share tight authority-discipline coupling
    (`allowed_for_gate`, chain-promotion, visibility-authority) and
    review-quality is materially better with one ontology-reviewer
    pass over the coupled vocabulary.
  - **N1** — QualityGate identity triple citation corrected.
  - **N2** — `subject_kind: agent_client` already-present
    confirmation made positive.
  - **N3** — Phase 2.1 strict-serialization rationale restated on
    bounded-reviewer-load grounds.
  - **N4** — Phase 2.2.1 cache-field deferred-payload-validation
    note added.
  - **N5** — Phase 2.5 parallel-drafting note added.
  - **N7** — `hcs-eval-reviewer` named as trap-numbering
    deconfliction owner at Phase 2.6.
  - **N8** — Phase 2.3.3 ADR attribution clarified (stage-1 +
    stage-2 receipts vs Q-006 (b)-(g) types).
  - **N9** — Phase 2.0 ADR number hint replaced with "numbered at
    authoring time."
  - Added **§FK dependency table** per architect suggested
    follow-up: one row per Phase 2.x PR with FK targets needed +
    required prior phases.

## Charter version

Written against charter v1.3.2 and
`docs/host-capability-substrate/ontology-registry.md` v0.3.3.

This is a **meta-ADR** governing process and sequencing under
IMPLEMENT.md §Rules ("Meta-ADRs are permitted when they govern
process or sequencing, such as a charter amendment wave; they must
stay `proposed` until human approval and must not bundle the
underlying charter/schema/policy change"). ADR 0038 declares an
ordering and inter-PR dependency contract; it does **not** author
the schemas, registry edits, charter amendment, policy YAML, or
trap fixtures it sequences.

## Context

The Phase 1 synthesis-window closed 2026-05-04 with ten ADRs
landing across the cohort (`project_phase_1_synthesis_outcome.md`):
0019 v3 (Q-003), 0029 v2 (Q-008 b/c), 0030 v2 (Q-006 stage-2),
0031 v1 (Q-008 d), 0032 v2 (Q-005), 0033 v2 (Q-006 b–g), 0034 v2
(Q-007 b–f), 0035 v2 (Q-007 g), 0036 v2 (Q-009), 0037 v2 (Q-010).
Each ADR's §Out of scope and §Future amendments sections defer
schema, registry, canonical policy YAML, and trap-fixture work to
Phase 2.

The aggregate Phase 2 inventory (mirrored in PLAN.md §Current
Focus and `project_phase_2_queue.md`):

- **Standalone Ring 0 entities (4):** `AgentClient` (ADR 0037),
  `QualityGate` (ADR 0035), `VerificationCommandSpec` (ADR 0036),
  and the Knowledge+Coordination subgraph `KnowledgeSource` /
  `KnowledgeChunk` / `CoordinationFact` / `DerivedSummary`
  (ADR 0019 v3).
- **Base-shape extensions (3):** `ExecutionContext` cache refactor
  (ADR 0037), `OperationShape.deletion_authority_source_ref` +
  `deletion_authority_kind` enum (ADR 0036), and the
  `BoundaryObservation` payload bundle (containment_class +
  three filesystem dimensions + `mcp_canonical_authority` —
  ADRs 0036 / 0037).
- **Evidence subtypes (~22 across four cohorts):** Q-007 direct
  Evidence subtypes `ToolProvenance` + `GitIdentityBinding`
  (ADR 0034), six Q-005 runner receipts (ADR 0032), ten Q-006
  source-control receipts (ADRs 0027 / 0030 / 0033), and three
  Q-010 remote-agent subtypes (ADR 0037).
- **Registry consolidation:** producer-class allowlist additions
  (`kernel_workspace_diagnose`, `kernel_agent_client_resolver`)
  plus ~20 closed-enum extensions across `subject_kind`,
  `predicate_kind`, `source_kind`, `security_label`,
  `reason_kind`, `surface`, `boundary_dimension`, `operation_class`,
  `mutation_scope`, `deletion_authority_kind`, `claim_kind`,
  `path_authority_kind`, AgentClient identity-axis enums, and
  `secret_injection_kind`.
- **Canonical policy YAML** (out of repo, in
  `system-config/policies/host-capability-substrate/`).
- **Trap fixtures** (#26–#28 from ADR 0036; #29–#31 plus 5
  candidates from ADR 0037; coordination-store reservations
  #31–#35 with deconfliction noted in policy NB-5 of ADR 0037 v2
  review).
- **Charter v1.4.0 amendment candidates:** invariant 18 (derived
  retrieval is not gate authority — Q-003 / ADR 0019 v3) and
  invariant 19 (boundary claims are freshness-bound and
  execution-context-bound — Q-007 / ADR 0034 v2). Synthesis-window
  operationalized both as ADR-level posture without amending the
  charter.

This volume cannot land as a single PR (per
`.agents/skills/hcs-schema-change` "One PR per schema change") and
is not naturally orderless: registry §7 mirror discipline,
foundation-before-extension FK ordering, and the charter-amendment
prerequisite for Zod refinement constraints all impose hard
sequencing. Without an authored sequence, a future implementer
risks landing extensions before their FK targets or encoding
invariants into Zod that the charter has not yet stated, both of
which create rework cycles paid in reviewer time.

## Options considered

### Option A: Free-order PRs (no sequence ADR)

Each Phase 2 PR picks its own landing slot; reviewers catch
ordering errors during PR review.

**Pros:**
- Zero meta-overhead; no ADR to author or maintain.
- Reviewer subagents are already required per IMPLEMENT.md and
  will catch obvious dependency violations.

**Cons:**
- Reviewer load is N PRs × M dependency checks; each PR re-derives
  the dependency graph from first principles.
- Charter v1.4.0 amendment may be skipped or land out-of-band,
  forcing retroactive Zod refinement edits on QualityGate and
  BoundaryObservation payloads.
- Cross-PR vocabulary alignment (registry §7 mirror) drifts when
  parallel schema PRs each add overlapping enum values without
  cross-reference.
- "Why this order" lives only in commit messages and reviewer
  comments; future implementers re-litigate sequencing.

### Option B: Single mega-PR

Land all schemas, registry edits, charter amendment, and traps in
one atomic PR.

**Pros:**
- Atomic landing eliminates inter-PR dependency reasoning.
- Registry §7 mirror discipline trivially satisfied.

**Cons:**
- Violates `.agents/skills/hcs-schema-change` "One PR per schema
  change."
- Reviewer surface explodes: ontology + policy + security +
  architect each face ~25 entity surfaces in one pass; review
  quality degrades.
- No incremental validation of the schema-change pipeline (Zod →
  JSON Schema → ontology.md → tests → fixtures) on smaller
  surfaces before the cohort lands.
- Bisecting a regression after merge becomes infeasible.
- Bundles meta-decision (charter amendment) with object-level
  decisions (schemas), violating IMPLEMENT.md meta-ADR rule.

### Option C: Foundation-first dependency-ordered sequence

Author this meta-ADR specifying a six-phase landing order with
explicit dependency contracts. Each phase delivers narrowly-scoped
PRs that exercise the full schema-change pipeline before the next
phase begins.

**Pros:**
- Reviewer load stays bounded per PR.
- Charter v1.4.0 amendment lands first, so Zod refinements on
  QualityGate / BoundaryObservation can encode invariants at
  authoring time.
- Foundation-first order means downstream PRs can FK to entities
  already in `main` rather than to staged-but-unmerged work.
- Each PR cites ADR 0038 §<phase> for sequencing rationale, so
  reviewers verify dependency rather than re-deriving it.
- Re-sequencing requires an amendment to ADR 0038, preserving the
  dependency reasoning across decision iterations.
- Compatible with `.agents/skills/hcs-schema-change` "One PR per
  schema change" (with one stated subgraph exception).

**Cons:**
- Meta-overhead: one ADR + cross-references in PRs.
- Strict ordering serializes some work that is internally
  parallel-safe (e.g., within Phase 2.3 once Phase 2.3.1 is in).
- Sequence becomes load-bearing; an unforeseen dependency forces
  ADR 0038 amendment rather than ad-hoc reordering.

## Decision

Choose Option C. Phase 2 lands across six phases (2.0 through
2.6) per the dependency contracts below. Charter v1.4.0
amendment lands first; standalone Ring 0 entities second;
base-shape extensions third; evidence subtypes fourth; registry
consolidation fifth; canonical policy YAML and trap fixtures sixth.

ADR 0038 stays `proposed` until `hcs-architect` review completes
and the human owner accepts. ADR 0038 does not author any of the
content it sequences; each phase's PRs author their own content
and cite ADR 0038 §<phase> for the dependency contract.

## Sequence

### Phase 2.0 — Charter v1.4.0 amendment (1 PR)

Single ADR (numbered at authoring time) authorizing charter v1.4.0
with two new invariants:

- **Invariant 18:** Derived retrieval is not gate authority.
  (Operationalized at ADR level by ADR 0019 v3 §Chain promotion
  rule and `allowed_for_gate` discipline; promotes to charter for
  QualityGate Zod refinement encoding.)
- **Invariant 19:** Boundary claims are freshness-bound and
  execution-context-bound. (Operationalized at ADR level by
  ADR 0034 v2 §Authority discipline; promotes to charter for
  BoundaryObservation payload Zod refinement encoding.)

**Why first:** Both invariants will be encoded as Zod refinements
on QualityGate (Phase 2.1.4) and the BoundaryObservation payload
bundle (Phase 2.2.3). Encoding refinements before the charter
states the invariant inverts the authority direction (schema
asserts, charter follows) and contradicts charter §Change policy.

**Pre-conditions:** None (synthesis-window closed; both
invariants already operationalized as ADR-level posture).

**Validation:** `just verify`; no schema files change in this PR;
boundary check confirms charter-and-bookkeeping-only scope per
ADR 0021 / ADR 0024 precedent.

### Phase 2.1 — Standalone Ring 0 entities (4 PRs)

Each PR introduces one new Ring 0 entity (or, for 2.1.3, one
internally-cohesive subgraph) with no upward FKs to other Phase 2.1
entities except as noted. Each PR carries its own Zod source,
generated JSON Schema, ontology.md update, tests, fixtures, and
registry §7 mirror edits per `.agents/skills/hcs-schema-change`.

**2.1.1 — `AgentClient`** (ADR 0037). Six identity axes;
identity-grain `(product_family, surface, app_build)`; lifecycle
`active | retired`; `audit_chain_link_hash` participation field.
Most-referenced new entity; FK target for Phase 2.3.4 remote-agent
receipts. Registry mirror: AgentClient identity-axis enums
(`product_family` 12 values, `permission_mode` 5 values,
`containment_mechanism` 8 values in all-`_capable` form,
`agent_client_state` 2 values), `secret_injection_kind` (5
values), surface enum extension `remote_cloud_agent`.
**Note:** `subject_kind: agent_client` is already present in
`evidenceSubjectKindSchema` (`packages/schemas/src/entities/evidence.ts`
line 19); no extension needed.

**2.1.2 — `VerificationCommandSpec`** (ADR 0036).
Producer-asserted spec entity with `command_shape` carrying the
argv-env scrubber pattern. Producer class
`kernel_workspace_diagnose` added to registry allowlist. Small
spec entity; lights up the producer-class allowlist code path
before Phase 2.2.3 needs it.

**2.1.3 — Knowledge + Coordination subgraph** (ADR 0019 v3).
`KnowledgeSource` → `KnowledgeChunk` → `CoordinationFact` →
`DerivedSummary` as one cohesive PR. Lands as a subgraph for
**review-coherence reasons:** the four entities share tight
authority-discipline coupling — `allowed_for_gate` derivation,
chain-promotion rule (ADR 0019 v3 §Chain promotion rule, lines
638-662), and visibility-authority traversal — and a single
ontology-reviewer pass over the coupled vocabulary materially
improves review quality vs. four separate passes that each
re-establish the shared discipline. The chain-promotion rule
itself is enforced at the Layer 1 mint API only when minting /
promoting `DerivedSummary` records (ADR 0019 v3 line 638-662);
it does not technically require atomic landing of the four
entities, but the authority-discipline coupling does motivate
single-PR review. The four entities are also internally linked
by `derived_from` references that benefit from unified
ontology.md cross-reference authoring.

**2.1.4 — `QualityGate`** (ADR 0035). Gate identity triple
`(gate_id, gate_kind, target_subject_ref)` (per ADR 0035 §1
Gate identity, line 217-218) plus duplicate-target uniqueness
constraint over `(target_subject_ref, gate_kind, execution_context_id)`
(per S-B2 closure). Six `gate_kind` values; four `gate_state`
values; six new `Decision.reason_kind` reservations
(`gate_provisional`, `gate_denied`, `gate_expired`,
`gate_evidence_insufficient`, `gate_target_already_active`,
`gate_evidence_stale_reuse`); one `Decision.required_grant_kind`
reservation (`gate_evidence_acknowledgment`). Encodes invariant
18 (derived retrieval ≠ gate authority) at the Zod refinement
layer via typed FK validation against `KnowledgeChunk` and
unpromoted `DerivedSummary` references in `evidence_refs` chains
— the refinement requires Phase 2.1.3 entities to be present
in the type system.

**Why this internal order:**
- AgentClient first because it is FK target for Phase 2.3.4 and
  the most-referenced entity; landing it first maximizes
  downstream "land into main" work.
- VerificationCommandSpec second because it is small (single
  spec entity), warms up the producer-class allowlist code path,
  and is referenced by Phase 2.2.3 (mcp_canonical_authority
  payload requires the producer-class to be allowlisted).
- Knowledge+Coordination subgraph third because QualityGate
  (2.1.4) Zod refinement on invariant 18 type-references
  `KnowledgeChunk` / `DerivedSummary` (B3 fix; see Revision
  history v2).
- QualityGate last because it depends on the Knowledge subgraph
  for invariant-18 typed refinement.

**Pre-conditions:** Phase 2.0 accepted and merged.

**Per-PR validation:** `just verify`, `just test schemas`,
`just generate-schemas --check`. Required reviewers per
IMPLEMENT.md table: `hcs-ontology-reviewer` (always),
`hcs-policy-reviewer` if `policy_rule` / `gate_state` shapes
change, `hcs-security-reviewer` if Evidence authority,
ApprovalGrant scope, or audit event shapes change.

### Phase 2.2 — Base-shape extensions (3 PRs)

Each PR modifies an existing Ring 0 entity rather than introducing
a new one. Per `.agents/skills/hcs-schema-change`, additive
changes with defaults skip `schema_version` bump; structural
changes bump and cite the originating ADR.

**2.2.1 — `ExecutionContext` cache refactor** (ADR 0037).
Additive: `latest_containment_evidence_ref` and
`kernel_sandbox_kind` cache fields. Lowest-risk modify-existing-
entity path; smokes the Edit-existing-Zod pipeline before the
denser Phase 2.2.3 bundle. **Note:** at 2.2.1 landing time, the
`latest_containment_evidence_ref` field is structurally a
polymorphic `evidenceRefSchema` reference with full payload-shape
validation deferred to Phase 2.2.3 (which lands the
`containment_class` BoundaryObservation payload that the field
points at). The structural FK is still useful at 2.2.1 because
the kernel sandbox cache update path is independent of payload
shape validation.

**2.2.2 — `OperationShape` deletion-authority extension**
(ADR 0036). Adds `deletion_authority_source_ref` polymorphic FK
plus `deletion_authority_kind` closed enum (4 values). Locks
deletion-authority discipline at the operation-shape layer.

**2.2.3 — `BoundaryObservation` payload bundle** (ADRs 0036 +
0037). One PR adding four `boundary_dimension` payloads:
`containment_class` (closes ADR 0022 Q-011(i) deferral without
ADR 0022 amendment), `filesystem_inheritance`,
`filesystem_protected_paths` (both ADR 0036), and
`mcp_canonical_authority` (ADR 0036). The
`filesystem_path_authority_check` dimension is reserved-only
stage-2 per ADR 0036 §Out of scope; do not land its payload
here. The `runner_isolation` boundary_dimension (Q-005 / ADR
0032) is **not** in this bundle — it lands with its sole
consumer at Phase 2.3.2 (B2 fix; see Revision history v2).
Registry §7 mirror edits land in the same commit.

**Why this internal order:** ExecutionContext is the smallest
modify-existing-entity edit (additive cache fields); it lights up
the modify pipeline. OperationShape extension introduces the
polymorphic-FK-plus-discriminator pattern (per registry §Naming
suffix discipline sub-rule 4) that Phase 2.2.3 reuses across four
payload variants. Phase 2.2.3 exercises registry §7 mirror
discipline at scale (four enum values mirrored to four payload
shapes) once the smaller PRs have validated the pipeline.

**Pre-conditions:** Phase 2.1 complete (specifically: Phase 2.1.2
VerificationCommandSpec required for Phase 2.2.3 producer-class
allowlist verification on `mcp_canonical_authority`).

### Phase 2.3 — Evidence subtypes (4 PRs)

Each PR introduces a cohort of `Evidence` records — either direct
Evidence subtypes (Q-011 bucket 1, `evidenceSchema`-direct typed
payload) or BoundaryObservation envelope payloads — composing via
the base envelope from ADR 0023 plus, where applicable, the
boundary-observation envelope from ADR 0022.

**2.3.1 — Q-007 direct Evidence subtypes** (ADR 0034).
`ToolProvenance` and `GitIdentityBinding` as **direct Evidence
subtypes** (Q-011 bucket 1, `evidenceSchema`-direct typed payload
per ADR 0034 v2 §Sub-decision (c) Composition partners table line
344-345 and §Sub-decision (c) typed-payload sections lines 349,
411-413). They are NOT BoundaryObservation envelope payloads.
Land first within Phase 2.3 because Phase 2.3.2 and 2.3.3
reference these records via `evidence_refs` for runner identity
and source-control identity respectively — the FK direction is
2.3.2 / 2.3.3 → 2.3.1, not vice versa.

**2.3.2 — Q-005 runner receipts** (ADR 0032). Six subtypes:
`RunnerHostObservation`, `RunnerIsolationObservation`,
`WorkflowRunReceipt`, `CleanRoomSmokeReceipt`,
`ResourceBudgetObservation`, `PolicyPlanReceipt`. **This PR also
carries the `runner_isolation` boundary_dimension addition**
(Q-005 / ADR 0032 ownership; B2 fix), since 2.3.2 is the sole
consumer and intra-PR landing keeps attribution coherent.
References Phase 2.3.1 `ToolProvenance` via `evidence_refs`.

**2.3.3 — Q-006 source-control receipts.** Stage-1 receipts
(ADR 0027) plus stage-2 receipts (ADR 0030) plus Q-006 (b)–(g)
types `GitHubMutationAuthority`, `RulesetObservation`,
`RepositoryIdentityReconciliation`, `MCPCredentialAudienceObservation`,
`StatusCheckSourceObservation` (ADR 0033). The first two cohorts
(stage-1 + stage-2) author Git observation receipts; the Q-006
(b)–(g) types are GitHub authority and identity records authored
in ADR 0033 separately. One PR because all share the FK pattern
to `GitRepository` / `GitRef` and reuse Phase 2.3.1
`GitIdentityBinding`. Splitting by stage forces three rounds of
"patterns the reviewer already saw" without proportional
review-quality gain.

**2.3.4 — Q-010 remote-agent receipts** (ADR 0037).
`RemoteAgentBaseImageObservation`, `RemoteAgentSetupReceipt`,
`RemoteAgentNetworkPostureObservation`. FK to AgentClient (Phase
2.1.1); references `containment_class` boundary_dimension from
Phase 2.2.3.

**Internal parallelism:** Phase 2.3.2 / 2.3.3 / 2.3.4 may land in
any order once 2.3.1 is in. They do not FK to each other within
the phase.

**Pre-conditions:** Phase 2.2 complete (Phase 2.2.3 boundary
dimensions are FK target for 2.3.3 + 2.3.4); Phase 2.3.1 must
precede 2.3.2 / 2.3.3 / 2.3.4.

### Phase 2.4 — Registry consolidation PR (1 PR)

Single PR sweeping `ontology-registry.md` for discipline-level
cleanup. Per registry §7 mirror rule, individual schema PRs in
Phases 2.1–2.3 have already mirrored their relevant enum
extensions and producer-class additions in the same commit as the
schema change. This PR is **not** a place to land net-new
vocabulary — it is the consolidation pass that:

- Adds summary tables for new entities and evidence subtypes.
- Adds naming-discipline updates surfaced during 2.1–2.3 review.
- Records the producer-class allowlist final state
  (`kernel_workspace_diagnose`, `kernel_agent_client_resolver`).
- Resolves any cross-reference inconsistencies that surface only
  when all entities are present.
- Bumps registry version (e.g., v0.3.3 → v0.4.0).

**Why distinct from per-PR mirror edits:** Registry §7 mirror
discipline ensures Zod and registry move together at the
enum-value level. Discipline-level prose (review grammar, naming
sub-rules, summary indices) is a different unit of change and is
better captured in one consolidation pass than spread across ~12
schema PRs.

**Pre-conditions:** All Phase 2.1–2.3 PRs merged.

### Phase 2.5 — Canonical policy YAML

Out-of-repo work in `system-config/policies/host-capability-substrate/`.
Not a PR in this repo. Landing scope per
`project_phase_2_queue.md`:

- Per-`boundary_dimension` freshness windows (containment
  dimension hours-to-day order per ADR 0037).
- `workspace_verify` operation-class composition thresholds.
- Per-product-family `permission_mode` verifier rules (Codex
  `--yolo`, Claude Code `--dangerously-skip-permissions`, Cursor
  cloud auto-mode all map differently).
- Non-PR remote-agent binding window duration (Phase 1 default
  ±5 min; ADR 0037 §Authority discipline).
- Cross-tool exclusion-pattern conflict resolution (ripgrep vs
  biome patterns).
- Per-`(producer, target_subject_ref, gate_kind)` denial-rate
  ceiling (ADR 0035 §Acceptance note tweak 2).
- Per-`gate_kind` evidence-rotation materiality rule (ADR 0035).

**Pre-conditions:** Phase 2.4 complete for *finalized* canonical
policy YAML (it cites registry-stable enum values and entity
names). However, **drafting** of policy YAML can proceed in
parallel with Phases 2.1–2.3 once entity names are committed in
their respective ADRs; the parallel-drafting lane just cannot
finalize until Phase 2.4 stabilizes the registry summary tables
and resolves any cross-reference inconsistencies.

**Out of scope for ADR 0038:** Specific YAML contents — those are
authored in `system-config` per its own change-management process.
ADR 0038 sequences only the dependency between this repo's
schema/registry state and `system-config`'s policy authoring.

### Phase 2.6 — Trap fixtures (1–2 PRs)

Last because traps verify behavior across the full Phase 2 stack.
Landing scope:

- Traps #26–#28 from ADR 0036 (Q-009).
- Traps #29–#31 from ADR 0037 (Q-010) plus 5 candidate traps from
  ADR 0037 v2 acceptance.
- Coordination-store brief reservations #31–#35 (per legacy
  memory `project_coordination_lessons_shared_state.md`),
  **with deconfliction at fixture-landing PR per the numbering
  collision flagged in ADR 0037 v2 review §Policy NB-5**.
  `hcs-eval-reviewer` is the deconfliction owner per the
  IMPLEMENT.md required-reviewer rule for `packages/evals/` +
  `packages/fixtures/` write-scope.

**Pre-conditions:** Phase 2.4 complete; Phase 2.5 in progress or
complete (some traps assert policy-tier behavior and require live
policy YAML to evaluate).

## FK dependency table

One row per Phase 2.x PR. Reviewer verifies the dependency graph
at-a-glance instead of re-deriving from prose.

**Column semantics:** "Required prior phases" = phases this PR
has FK or refinement-type dependencies into. Phase-level
pre-conditions (e.g., "Phase 2.3 requires Phase 2.2 complete")
are captured in §Phase 2.x prose, not duplicated here.

| Phase | PR scope | New entities/payloads | FK targets needed | Required prior phases |
|-------|----------|------------------------|---------------------|------------------------|
| 2.0 | Charter v1.4.0 amendment | (no schema; charter inv. text only) | (none) | none |
| 2.1.1 | `AgentClient` | `AgentClient` Ring 0 entity + identity-axis enums | (no entity FK; new identity grain) | 2.0 |
| 2.1.2 | `VerificationCommandSpec` | `VerificationCommandSpec` Ring 0 entity; producer-class `kernel_workspace_diagnose` | (no entity FK) | 2.0 |
| 2.1.3 | Knowledge + Coordination subgraph | `KnowledgeSource`, `KnowledgeChunk`, `CoordinationFact`, `DerivedSummary` | `KnowledgeSource` (intra-subgraph FK from `KnowledgeChunk`); no entity FK to `AgentClient` (`CoordinationFact` authoring authority is producer-class-shaped per ADR 0019 v3 §Promotion audit-record completeness, not a typed AgentClient FK) | 2.0 |
| 2.1.4 | `QualityGate` | `QualityGate` entity + 6 reason_kind + 1 required_grant_kind reservations | `KnowledgeChunk` / `DerivedSummary` (invariant-18 Zod refinement type-references) | 2.0; 2.1.3 |
| 2.2.1 | `ExecutionContext` cache refactor | `latest_containment_evidence_ref` + `kernel_sandbox_kind` cache fields | Polymorphic `evidenceRefSchema` (structural; `containment_class` payload-shape validation deferred to 2.2.3) | 2.1 |
| 2.2.2 | `OperationShape` extension | `deletion_authority_source_ref` polymorphic FK + `deletion_authority_kind` enum (4 values) | (no entity FK; polymorphic ref) | 2.1 |
| 2.2.3 | `BoundaryObservation` payload bundle | `containment_class`, `filesystem_inheritance`, `filesystem_protected_paths`, `mcp_canonical_authority` payloads | `VerificationCommandSpec` (`mcp_canonical_authority` producer-class allowlist) | 2.1.2; 2.2.1 (for cache-field payload-shape validation) |
| 2.3.1 | Q-007 direct Evidence subtypes | `ToolProvenance`, `GitIdentityBinding` (Q-011 bucket 1) | (no envelope FK; direct Evidence subtypes) | 2.1 |
| 2.3.2 | Q-005 runner receipts | 6 receipt subtypes + `runner_isolation` boundary_dimension payload | `ToolProvenance` (via `evidence_refs`); `runner_isolation` payload (intra-PR) | 2.3.1 |
| 2.3.3 | Q-006 source-control receipts | ~10 subtypes (stage-1 + stage-2 + Q-006 (b)–(g)) | `GitIdentityBinding` (via `evidence_refs`); `filesystem_*` boundary_dimensions | 2.2.3; 2.3.1 |
| 2.3.4 | Q-010 remote-agent receipts | 3 subtypes | `AgentClient`; `containment_class` boundary_dimension | 2.1.1; 2.2.3 |
| 2.4 | Registry consolidation | (registry prose + summary tables + version bump) | (no schema) | 2.1; 2.2; 2.3 |
| 2.5 | Canonical policy YAML (out-of-repo) | (YAML in system-config) | All entity names + enum values | 2.4 (final); 2.1–2.3 (drafting in parallel permitted) |
| 2.6 | Trap fixtures | Traps #26–#31 + 5 candidates + #31–#35 deconfliction | All schemas | 2.4; 2.5 in progress or complete |

## Sequencing rules (dependency contracts)

The following rules are load-bearing across all Phase 2 PRs.
Re-sequencing requires an ADR 0038 amendment.

1. **Foundation-before-extension rule.** Standalone Ring 0
   entities (Phase 2.1) land before any base-shape extension
   (Phase 2.2) or evidence subtype (Phase 2.3) that FKs to them.
2. **Charter-before-Zod-refinement rule.** Invariants encoded
   into Zod refinements must be charter-stated first. Phase 2.0
   precedes Phase 2.1.4 for invariant 18 (QualityGate refinement)
   and Phase 2.0 precedes Phase 2.2.3 for invariant 19
   (BoundaryObservation payload refinement).
3. **Vocabulary-mirror rule.** Each schema PR carries its own
   registry §7 mirror edits in the same commit. The Phase 2.4
   consolidation PR does discipline-level cleanup, not net-new
   vocabulary. A schema PR that lands without its registry mirror
   edit fails `just verify` per registry §7.
4. **One-entity-per-PR rule.** Per `.agents/skills/hcs-schema-change`
   "One PR per schema change." **Stated exception:** Phase 2.1.3
   Knowledge+Coordination subgraph lands as one PR for
   review-coherence reasons (tight authority-discipline coupling
   across the four entities; one ontology-reviewer pass over the
   coupled vocabulary materially improves review quality vs. four
   separate passes).
5. **Phase-internal serialization rule.** Phase 2.1 and Phase 2.2
   PRs land serially within their phase for **bounded reviewer
   load** (one Ring-0 entity surface per pass), not for FK
   reasons. Within Phase 2.1, the four entities mostly do not FK
   to each other — only Phase 2.1.4 QualityGate FKs to Phase 2.1.3
   Knowledge entities (invariant-18 typed refinement). Within
   Phase 2.2, Phase 2.2.1 cache-field payload-shape validation
   defers to Phase 2.2.3, motivating internal order. Phase 2.3
   permits parallelism across 2.3.2 / 2.3.3 / 2.3.4 once 2.3.1
   is in (no intra-phase FK between those three).
6. **No-bundling rule.** ADR 0038 sequences; it does not author.
   Charter v1.4.0 amendment, schemas, registry edits, policy YAML,
   and traps each land in their own PRs per their own ADRs.
7. **Citation rule.** Each Phase 2 PR description cites
   ADR 0038 §<phase> to declare its sequence position. Reviewers
   verify dependency contract, not re-derive it.

## Consequences

- **Positive — bounded reviewer load.** Each PR exercises a small
  surface (one entity or one cohort), keeping ontology / policy /
  security / architect review feasible per pass.
- **Positive — pipeline validation cadence.** Smaller surfaces
  smoke the schema-change pipeline (Zod → JSON Schema → ontology.md
  → tests → fixtures + registry mirror) before larger ones land.
- **Positive — citation coherence.** PRs cite ADR 0038 §<phase>
  and the FK dependency table; the dependency reasoning is one
  read away rather than reverse-engineered from commit messages.
- **Positive — re-sequencing requires explicit re-decision.**
  Amendment to ADR 0038 forces the dependency reasoning to be
  re-stated rather than silently inverted.
- **Negative — meta-overhead.** One ADR + cross-references in
  ~13 PRs. Mitigated by reusing ADR 0038 §<phase> as the
  per-PR boilerplate and the FK dependency table as the per-PR
  pre-condition checklist.
- **Negative — serialization of internally-parallel work.** Phase
  2.1 and Phase 2.2 are strictly serial despite some entities
  being independent. Mitigated by the small per-PR surface; the
  loss is measured in days, not weeks.
- **Negative — sequence is load-bearing.** An unforeseen
  dependency forces ADR 0038 amendment rather than ad-hoc
  reordering. Mitigated by explicit dependency contracts in
  §Sequencing rules and FK table; the ADR is short and
  self-contained.

## Out of scope

- Authoring of any Phase 2 content (schemas, registry edits,
  charter v1.4.0 invariant text, canonical policy YAML, trap
  fixtures). Per IMPLEMENT.md meta-ADR rule, these land in their
  own PRs.
- Phase 3 work: dashboard, kernel read paths, adapter wiring,
  hook integration. Sequencing for Phase 3 is a future ADR if
  warranted.
- Re-baselining of Claude Code CLI / Codex CLI versions
  (D-029) — independent of schema sequencing.
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

## Future amendments

ADR 0038 v2+ candidates are recorded here at draft time; whether
each warrants amendment is decided at the point an unforeseen
dependency surfaces.

- **A1 — Phase 2.7 for Phase 3 entry pre-conditions** (if Phase 3
  scope reveals schema-side prerequisites not captured here).
- **A2 — Subgraph-exception list extension** (if a future cohesive
  subgraph requires the same review-coherence carve-out as Phase
  2.1.3 Knowledge+Coordination).
- **A3 — Internal-parallelism widening** (if reviewer-capacity
  evidence shows Phase 2.1 or Phase 2.2 can safely parallelize
  beyond the §Sequencing rule 5 statement).
- **A4 — Trap-numbering authoritative arbitration ADR** (if Phase
  2.6 deconfliction surfaces multiple trap sources requiring
  authoritative numbering — current scope handles via
  `hcs-eval-reviewer` at fixture-landing PR).

## References

- IMPLEMENT.md §Rules — meta-ADR permission and proposed-status
  discipline.
- `.agents/skills/hcs-schema-change` SKILL.md — "One PR per schema
  change", schema+JSON Schema+ontology.md+tests+fixtures discipline.
- `docs/host-capability-substrate/ontology-registry.md` v0.3.3
  §Registration rules §7 — mirror rule between Zod enum and
  registry.
- ADR 0019 v3 (Q-003), ADR 0029 v2 (Q-008 b/c), ADR 0030 v2
  (Q-006 stage-2), ADR 0031 v1 (Q-008 d), ADR 0032 v2 (Q-005),
  ADR 0033 v2 (Q-006 b–g), ADR 0034 v2 (Q-007 b–f),
  ADR 0035 v2 (Q-007 g), ADR 0036 v2 (Q-009), ADR 0037 v2
  (Q-010) — synthesis-window cohort whose §Out of scope sections
  define the Phase 2 inventory.
- ADR 0021 + ADR 0024 — charter amendment ADR pattern (precedent
  for Phase 2.0 charter v1.4.0 ADR shape).
- ADR 0022 — `BoundaryObservation` envelope; Phase 2.2.3 closes
  Q-011(i) deferral without amendment.
- ADR 0023 — Evidence base shape; Phase 2.3 subtypes compose via
  this envelope.
- PLAN.md §Current Focus — Phase 2 entry-point inventory.
- `project_phase_2_queue.md` (memory) — Phase 2 inventory mirror.
- `project_phase_1_synthesis_outcome.md` (memory) — synthesis-
  window outcome cited in §Context.
