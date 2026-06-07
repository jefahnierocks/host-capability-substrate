---
title: HCS Ontology Registry
category: reference
component: host_capability_substrate
status: partial
version: 0.4.23
last_updated: 2026-06-07
tags: [ontology, registry, registry-consolidation, phase-2-4, phase-2-7, boundary-observation, evidence, operation-shape, agent-client, verification-command-spec, knowledge-source, knowledge-chunk, coordination-fact, derived-summary, quality-gate, ci-runner, remote-agent, credential-plane, machine-identity, project-substrate, teardown, backup-readiness, restore-drill, naming-discipline, authority-discipline, cross-context-binding, audit-integrity, enum-value-casing, q-011, decision, workspace-context, approval-grant, lease, run, principal, session, foundational-ring-0, workflow-sequencing-step-1, workflow-sequencing-step-3, self-approval-rejection-rule, policy-rule, capability, command-shape]
priority: high
---

# HCS Ontology Registry

Authoritative registry for ontology-controlled vocabulary used inside HCS Ring 0
schemas. Initial scope is the `boundary_dimension` taxonomy that ADR 0022 names
as a precondition for `BoundaryObservation` schema implementation.

This file is a living registry. Entries are draft until `hcs-ontology-reviewer`
has filed objections and a human owner has accepted them. Adding, removing, or
renaming a registered value is itself a schema-change-workflow PR.

## Scope

In scope:

- Closed enumerations referenced by Ring 0 schemas where the values carry
  ontology meaning beyond an ad-hoc string (e.g., `boundary_dimension`).
- Naming-discipline rules for receipts, observations, and proof composites that
  Q-011 owns.

Out of scope:

- Live policy tiers, gateway rules, or canonical YAML — those remain in
  `system-config/policies/host-capability-substrate/`.
- Per-domain payload schemas. Domain payloads are owned by domain-specific
  evidence subtypes; the registry only fixes the discriminator vocabulary.
- Adapter-only enums (MCP tool names, dashboard view names). Those live with
  their adapter contracts.

## Registration rules

1. **Singular discriminator.** A boundary fact carries one
   `boundary_dimension`. Genuinely multi-dimensional facts are represented as
   linked `BoundaryObservation` records that share target references, not as
   one envelope with multiple dimensions.
2. **Narrowest matching dimension.** When multiple registered values could
   apply, emit the narrowest one. Umbrella values such as `containment_class`
   apply only when no narrower dimension fits.
3. **Primary target reference is mandatory per dimension.** Each entry below
   names the primary target reference (`surface_id`, `execution_context_id`,
   `workspace_id`, `credential_source_id`, or `tool_or_provider_ref`) that
   binds the observation to the host model. At least one target reference must
   be present on every `BoundaryObservation`; the per-dimension primary is the
   one that should normally be used.
4. **Supplemental target references are listed explicitly.** Adapters and
   producers may attach additional target references when they help downstream
   consumers, but only the ones the registry approves for that dimension.
5. **Version, build, and dependency drift are freshness signals, not
   dimensions.** A version bump, build change, or dependency change invalidates
   prior observations that depended on the changed surface; it does not become
   a `boundary_dimension` value unless the registry later approves a narrower
   entry. `BoundaryObservation` carries no `version_drift` dimension.
6. **One status per registered value.** A registered dimension is `proposed`,
   `accepted`, or `deferred`. Implementation work on `BoundaryObservation`
   payloads consumes only `accepted` dimensions; `proposed` values must clear
   ontology review first.
7. **Schema enum is a mirror of this registry.** The Zod
   `boundaryDimensionSchema` enum and this file must move together. Drift
   between them is a `just verify` failure once the schema lands.

## Q-011 review grammar (review buckets, not registry entries)

Q-011 governs which Ring 0 names land as evidence subtypes, standalone
entities, or proof composites. The same buckets apply when a dimension's
domain payload is later proposed:

- **Evidence subtype.** A freshness-bound observation that wraps the base
  `Evidence` provenance with a domain-specific payload. Most boundary
  dimensions live here.
- **Standalone Ring 0 entity.** A durable lifecycle object with its own
  identity and ownership. `BoundaryObservation` is the envelope that lets
  evidence subtypes share a discriminator without becoming standalone
  entities.
- **Proof composite.** An authored decision artifact (for example
  `BranchDeletionProof`) that aggregates multiple evidence records into a
  single gating shape. Dimensions never sit in this bucket; their associated
  domain payloads might.

## Naming suffix discipline

Per Q-011 sub-decision (d) (approved 2026-05-01,
`docs/host-capability-substrate/human-decision-report-2026-05-01.md`), Ring 0
entity and field names follow a closed suffix discipline. This codifies the
convention already in use across `packages/schemas/src/entities/` and
`docs/host-capability-substrate/adr/`.

### Entity-name suffixes

- **`*Observation`** — a freshness-bound observation. Typically an `Evidence`
  subtype envelope or a domain-specific observation record. Examples:
  `BoundaryObservation`, candidate `GitRepositoryObservation`,
  `GitWorktreeObservation`, `StatusCheckSourceObservation`,
  `GitBranchAncestryObservation`.
- **`*Receipt`** — a typed receipt of a definite event or a positive
  existence claim, including positive-absence claims. Typically an `Evidence`
  subtype envelope. Examples: candidate `CleanRoomSmokeReceipt`,
  `WorkflowRunReceipt`, `PullRequestReceipt`, `PullRequestAbsenceReceipt`,
  `SourceControlContinuityReceipt`.
- **`*Proof`** — an authored decision composite (Q-011 review-grammar bucket
  3) that aggregates multiple evidence records into a single gating shape.
  Examples: candidate `BranchDeletionProof`.
- **no suffix** — a standalone Ring 0 entity (Q-011 review-grammar bucket 2)
  with durable identity and lifecycle. Examples: `HostProfile`,
  `WorkspaceContext`, `Evidence`, `ExecutionContext`, `Capability`,
  `Decision`, `ApprovalGrant`, `Run`, `Artifact`, `Lease`, `Lock`,
  `SecretReference`.

Sub-rules:

1. **Mixing suffix categories on a single entity name is forbidden.** No
   `BranchDeletionProofObservation` and no `BoundaryObservationReceipt`. A
   name carries at most one suffix.
2. **Positive-absence claims are explicit `*Receipt`s.** "No PR exists for
   this branch" is a `PullRequestAbsenceReceipt`, not a missing field. A
   missing field is structurally undefined; absence is itself an observation
   that must be produced, dated, and authority-tagged.
3. **`*Proof` composites do not subtype `Evidence`.** They reference
   `Evidence` records; they are not themselves freshness-bound observations.
   Proof composites carry their own authoring metadata
   (`*_authored_at`, `*_valid_until`, authoring-service identity, requesting
   principal identity).

### Field-name suffixes (single-FK and reference-array conventions)

- **`<entity>_id`** — a single typed FK to a specific Ring 0 entity by its
  primary key. Used when the entity kind is fixed by the field's name.
  Examples in current schemas: `evidence_id`, `workspace_id`,
  `execution_context_id`, `credential_source_id`, `boundary_observation_id`.
- **`<thing>_ref`** — a single typed FK that is polymorphic or kind-tagged.
  Used when the field can resolve to one of several entity kinds, with a
  separate discriminator field naming the kind. Example in current schemas:
  `tool_or_provider_ref` on `BoundaryObservation`.
- **`<thing>_evidence_refs`** (or `subject_refs`, `evidence_refs`) — an
  array of typed reference objects with embedded provenance preview, using
  the `evidenceRefSchema` shape from `packages/schemas/src/common.ts`.
  Component evidence on a proof composite uses this pattern; a single
  evidence record is the degenerate case (`min(1)`).

Sub-rules:

4. **Singular `_evidence_ref` is reserved for polymorphic single-FK use.**
   Component evidence on a composite uses the plural `_evidence_refs` form
   even when only one record is required, so the schema can later carry
   multiple supporting records without renaming the field.
5. **Discriminator fields name the kind, not the count.** A field like
   `merge_proof_kind: "ancestry" | "patch_equivalence" | "vacuous"` selects
   which sibling `_evidence_refs` array is required. Discriminator-and-array
   pairs are the recommended pattern when an OR-shape would otherwise
   collapse two ontologically distinct facts into one field.
6. **`_kind` is the canonical discriminator suffix.** Discriminator fields
   use `<thing>_kind` (e.g., `merge_proof_kind`, `pr_state_kind`,
   `evidence_kind`, `reason_kind`, `required_grant_kind`). `_class` and
   `_code` are *not* codified discriminator suffixes and must not be
   used; future schemas using `_class` or `_code` for a discriminator
   role fail ontology review.

   The single existing exception is `containment_class` from ADR 0022,
   which is itself part of an umbrella-dimension entity name (boundary
   dimension), not a payload discriminator. No corresponding exception
   exists for `_code`.

   Discriminator fields on `Decision` and `ApprovalGrant` follow the
   same rule: rejection-class discriminators are `reason_kind` (not
   `reason_code`); required-grant-class discriminators are
   `required_grant_kind` (not `required_grant_class`). This codifies
   the surface surfaced during the post-merge review of ADR 0029 v1.
7. **Subject-kind enum values name the underlying subject, not the
   evidence envelope.** When an `evidenceSubjectKindSchema` enum is
   extended for a new subject (e.g., a tool invocation), the value names
   the subject itself (`tool_invocation`), not the corresponding receipt
   shape (`tool_invocation_receipt`). The receipt envelope is a separate
   concern; the subject is the event/object being observed.
8. **`_mode` is the canonical suffix for orthogonal-layer
   discriminators.** `_kind` (Sub-rule 6) discriminates within a single
   receipt-family axis (which sibling `_evidence_refs` array applies,
   which subtype variant). `_mode` discriminates across orthogonal
   layers — for example, capture-time vs persistence-time treatment
   of the same content. Pattern: `<thing>_<layer>_mode` (e.g.,
   `argv_capture_mode`, `argv_persistence_mode` if both layers carry
   per-payload discipline). The base `Evidence.redaction_mode` is the
   single persistence-layer mode field; per §Redaction posture, payload
   subtypes must not introduce a parallel `<thing>_redaction_mode`
   shadow. New `_mode` field names require an ontology-reviewer pass.

   Bare-noun discriminators (e.g., `mode`, `capture_status`,
   `observation_state`) are permitted when they are the receipt's
   *central* discriminator — the substantive concept the receipt
   exists to record — rather than an orthogonal-layer modifier on a
   payload field. The receipt name itself (`ExecutionModeObservation`)
   already names the central concept; the field name is bare. This is
   the existing precedent for `boundary_dimension` on
   `BoundaryObservation` and `merge_proof_kind` on `BranchDeletionProof`.
9. **Stable enum values use `lower_snake_case`.** Enum values that
   appear in canonical policy YAML, schema enums, audit-chain records,
   and `Decision.reason_kind` / `Decision.required_grant_kind` use
   `lower_snake_case`. Mixed-case forms (`PascalCase`, `camelCase`,
   `kebab-case`) are forbidden for new enum values. Numeric prefixes
   (`1_first_state`) are permitted only when ordering is part of the
   value's meaning and the ordering must be stable across versions.

   Examples (compliant): `empty_apparent_success`, `capture_failure`,
   `abnormal_termination`, `mode_unknown`, `destructive_git`,
   `read_only_diagnostic`, `approval_required`, `block`, `warn`,
   `cross_context_target_mismatch`.

   Existing exceptions are grandfathered and not extended:

   - `evidenceAuthoritySchema` enum values use `kebab-case`
     (`project-local`, `workspace-local`, `user-global`, `system`,
     `derived`, `sandbox-observation`, `host-observation`,
     `vendor-doc`, `installed-runtime`, `human-observed`,
     `self-asserted`). The casing predates this rule; new authority
     classes added to that enum may continue to use `kebab-case` for
     enum-internal consistency, but no other enum may adopt
     `kebab-case`.
   - `policyRuleTierSchema` enum values use `kebab-case`
     (`read-safe`, `write-local`, `write-project`, `write-destructive`,
     `forbidden`) because they mirror the operator-approved live policy
     `tiers:` keys verbatim (ADR 0060 / D-057). The casing is inherited from
     the live-policy keys, not chosen; new tier values may continue
     `kebab-case` for live-policy fidelity, but no other enum may adopt
     `kebab-case`.

   New enum values added to any other Ring 0 enum require
   `lower_snake_case`; an `hcs-ontology-reviewer` pass before the
   schema PR using the new value lands enforces the rule.

### Version-field naming

Schema entities, evidence subtype envelopes, and proof composites carry up
to three independent version fields. Their names and semantics are fixed:

- **`schema_version`** — names the entity, envelope, or composite schema
  itself. Required on every Ring 0 entity, evidence subtype envelope, and
  proof composite. Schema versions are entity-local: new entities start at
  `'0.1.0'`, while an existing entity bumps when its accepted schema contract
  changes. For example, Phase 2.1.1 keeps new `AgentClient` at `'0.1.0'` and
  bumps `ExecutionContext` / `CredentialSource` to `'0.2.0'` because the
  shared `surface` enum widened to include `remote_cloud_agent`.
- **`evidence_schema_version`** — names the version of the base `Evidence`
  contract (ADR 0023) under which component evidence references were
  composed. Required on evidence subtype envelopes and proof composites
  whose validity depends on the base contract; the broker may reject
  records whose `evidence_schema_version` does not match the current
  accepted base contract.
- **`payload_schema_version`** — names the domain payload schema family
  when an evidence subtype envelope (or any composite) carries a
  discriminated domain payload field (such as
  `BoundaryObservation.observed_payload`). Optional and absent when the
  envelope or composite has no separate domain payload field; in that
  case the composite *is* the field block.

Sub-rule:

6. **No fourth version field without registry update.** A composite that
   needs a fourth independent version (for example a tier-specific window
   version, or a discriminator-payload-kind version) must add a new
   registry entry naming the field, the contract it tracks, and the
   freshness/composition semantics. Otherwise composites must reuse the
   three canonical fields and accept the current scope of each. This
   sub-rule prevents the asymmetry surfaced during ADR 0025 v2 review,
   where a composite without a domain payload had drifted to a redundant
   `proof_schema_version` field.

### Adding a new suffix or convention

A new suffix or field-name convention requires:

- a citation in `DECISIONS.md` showing the design intent (typically a Q-011
  sub-decision or a downstream Q-* sub-decision approval);
- a registry update like this section, before any schema PR uses the new
  convention;
- an `hcs-ontology-reviewer` pass before the first schema PR using the new
  convention lands.

## Authority discipline

Authority is the trust class of evidence. ADR 0023's `Evidence` base
contract defines the authority enum (`evidenceAuthoritySchema` in
`packages/schemas/src/common.ts`). Charter invariant 8 forbids promoting
`sandbox-observation` to a stronger authority class; that rule extends
across evidence subtype envelopes (per ADR 0022 inheritance) and proof
composites (per ADR 0025 component-evidence binding).

This section codifies two rules surfaced during the post-merge review of
ADR 0027 and ADR 0028: the trust class for unverified producer claims,
and which authority-class fields may live in producer payload versus
the kernel/mint API.

### Authority class ladder

The current `evidenceAuthoritySchema` enum has eleven values:

```text
project-local
workspace-local
user-global
system
derived
sandbox-observation
host-observation
vendor-doc
installed-runtime
human-observed
self-asserted
```

Trust ordering (high to low, for promotion checks):

```text
host-observation > installed-runtime > vendor-doc > system >
user-global > workspace-local > project-local > human-observed >
derived > sandbox-observation > self-asserted
```

Per inv. 8, no class promotes to a higher class without a separate
evidence record at the higher class.

### `self-asserted` authority class

The class `self-asserted` lives below `sandbox-observation`. Producers
that supply observation data without backing telemetry — typical case:
an agent claiming "I am running in normal mode" with no kernel /
sandbox / host telemetry — emit `self-asserted` authority. The class
is below `sandbox-observation` because sandbox observations are real
observations bounded by sandbox visibility, while self-assertion is a
producer claim with no observation behind it.

`self-asserted` cannot be promoted to any higher class. Per inv. 8 and
charter v1.3.2 wave-3's fabricated-evidence-envelope forbidden pattern,
a separate evidence record at the higher class is required to substitute
for the self-assertion.

Charter v1.4.0 inv. 18 chain-walk rejection treats
`Evidence.authority: "self-asserted"` as a stop class for typed-grant
minting on `allowed_for_gate` transitions. The schema-level enum landed
on 2026-05-09 (`Evidence.schema_version` `0.10.0`); the chain-walk
rejection itself remains a posture commitment until the typed-grant
minting layer lands. Closes ADR 0039 §Forward-looking observations
#5 (Arch-N12 / Pol-N2 / Sec-N-v2-2).

### Producer-vs-kernel-set authority fields

Authority-class signals — fields whose value determines or strongly
implies the evidence record's authority — are set by the kernel/mint
API based on execution context, never by the producer. Producer-supplied
authority-class fields are forbidden in evidence payloads.

Examples surfaced during the ADR 0027 / ADR 0028 review cycle:

- ADR 0027's `detected_by` (would have been:
  `kernel_probe | host_telemetry | sandbox_marker`): kernel-set only.
- ADR 0028's `captured_by` (would have been:
  `agent_harness | kernel_broker | sandbox_marker`): kernel-set only.
- ADR 0028's `observed_via` (would have been:
  `kernel_observation | sandbox_marker | host_telemetry | self_assertion`):
  kernel-set only.
- ADR 0037's `ExecutionContext.latest_containment_evidence_ref` and
  `ExecutionContext.kernel_sandbox_kind`: kernel-set containment cache fields
  projected from accepted `containment_class` `BoundaryObservation` records.

Examples committed by charter v1.4.0 invariant 19 (Phase 2.2.3
`BoundaryObservation` payload bundle and related Evidence subtype
envelopes):

- `BoundaryObservation.execution_context_id`: kernel-set FK to the
  `ExecutionContext` the observation binds to. Producer-supplied values
  are rejected at the typed-grant minting layer per inv. 19.
- `BoundaryObservation.surface_id`: kernel-set FK to the surface
  (e.g., `AgentClient.surface`-resolved record) the observation binds
  to. Producer-supplied values rejected.
- `BoundaryObservation.workspace_id`: kernel-set FK to the
  `WorkspaceContext` the observation binds to. Producer-supplied values
  rejected.
- `BoundaryObservation.credential_source_id`: kernel-set FK to the
  `CredentialSource` the observation binds to. Producer-supplied values
  rejected.
- `BoundaryObservation.tool_or_provider_ref`: kernel-set typed reference
  to the tool or provider the observation binds to. Producer-supplied
  values rejected.

These five execution-context binding fields are charter-binding under
invariant 19 and apply to `BoundaryObservation` envelopes plus the
related Evidence subtype envelopes that inv. 19 covers (any envelope
whose semantic asserts a boundary, freshness, or context-bound claim).
At least one binding must be present per inv. 19; the binding fields
present are kernel-set without exception. Cross-context substitution
(claiming a forged binding to launder evidence into a different
execution context) fails at the kernel-set rule before the cross-
context-evidence-reuse rule (charter v1.3.2 line 140) is consulted.

**`Evidence.producer` is kernel-set when its value names a
kernel-trusted producer class.** Per the post-merge re-review of
ADR 0028 v3, the existing `Evidence.producer` field
(`packages/schemas/src/entities/evidence.ts`,
`z.string().min(1).optional()`) is producer-supplied free-form by
schema. Producer-supplied values that name a *kernel-trusted producer
class* are forbidden. The kernel-only value allowlist is:

- `kernel_broker` — the Ring 1 broker FSM (per ADR 0028 v3+
  producer-crash watchdog).
- `kernel_telemetry` — direct kernel telemetry sources (kqueue,
  ptrace, host process telemetry).
- `kernel_agent_client_resolver` — the Ring 1 resolver that mints
  `AgentClient` axes from launchd, process-tree, installed-binary, and
  remote-cloud execution-context evidence per ADR 0037.
- `kernel_workspace_diagnose` — the Ring 1 workspace-diagnose service
  that mints `system.workspace.diagnose.v1` outputs per ADR 0036.
- `mint_api` — Ring 1 mint API setting producer when minting
  synthetic or derived records.

Producer-supplied values naming an agent-side or
sandbox-observer class (e.g., `agent_harness`,
`sandbox_observer`, `producer_self`, or any tool-specific name)
remain producer-asserted but must be kernel-verifiable.

Schema-side enforcement: a follow-up schema-change PR tightens
`Evidence.producer` from free-form `z.string().min(1).optional()` to
a kind-tagged shape distinguishing kernel-set values (validated against
the allowlist) from producer-asserted values. Until that PR lands,
the registry-canonical rule is: producer-supplied
`producer: "kernel_broker"` (or any other allowlist value) is rejected
at the mint API per §Cross-context enforcement layer layer 1.

Operational claims that are not authority-class
(`last_fetch_outcome`, `termination_reason`, `capture_status`,
`ref_state`) may remain producer-asserted, but must be
kernel-verifiable via separate evidence (transport receipts, process
exit codes, syscall traces, etc.). The rule is: claims about *trust
class* are kernel-set; claims about *operational state* are
producer-asserted but verifiable.

Adding a new authority-class field to a payload requires:

1. A registry update naming it as kernel-set or documenting a
   producer-claim + kernel-verification split with clear rationale.
2. An `hcs-ontology-reviewer` pass before the schema PR using the new
   field lands.

### ADR 0049–0055 foundational Ring 0 entity field authority

The seven foundational Ring 0 entities (five workflow-sequencing
investigation §Step 1 entities + ADR 0054 §Step 3 entity #1 Principal
+ ADR 0055 §Step 3 entity #2 Session) each commit an envelope-level
authority-discipline posture per their respective ADRs. Cross-record enforcement (Session/Decision/ExecutionContext
equality, lease uniqueness, producer-disjointness, gateway re-derive,
self-approval rejection, valid_until inheritance, revoke-wins race
tiebreaker, sandbox-acquire rejection, authorizing-Decision outcome
verification, principal-binding-evidence verification, synthetic-identity
rejection) lives at Ring 1 mint API per §Cross-context enforcement layer
§Schema validation alone is not an enforcement layer.

**`Decision` (ADR 0049):** envelope-level kernel-set with NO field-level
exceptions. All 14 fields are kernel-set; producer-supplied Decision records
are rejected at the future Ring 1 mint API:
`schema_version`, `decision_id`, `operation_shape_ref`, `outcome`,
`reason_kind`, `reason_text`, `reason_text_redaction_mode`, `evidence_refs`,
`decided_by`, `decided_at`, `valid_until`, `execution_context_id`,
`audit_chain_link_hash`, `required_grant_kind`.

**`WorkspaceContext` (ADR 0050):** envelope-level kernel-set with **two
field-level exceptions** per ADR 0031 v1 §Authority discipline:

- Kernel-set (9 fields): `schema_version`, `workspace_context_id`,
  `execution_context_id`, `workspace_context_state`, `kernel_observed_at`,
  `valid_until`, `producer`, `audit_chain_link_hash`, `evidence_refs`.
- Producer-asserted, kernel-verifiable (2 fields): `repository_id`,
  `worktree_path`. Layer 1 mint API verifies via filesystem stat +
  `worktree_path` canonicalization per ADR 0031 v1 Mechanical Tweak #2 /
  Security-D before cardinality checks. Rejection emits `Decision.reason_kind:
  'lease_producer_assertion_unverifiable'` (per ADR 0052 reservation).

**`ApprovalGrant` (ADR 0051 v4):** envelope-level kernel-set with NO
field-level exceptions. All 13 fields are kernel-set; producer-supplied
ApprovalGrant records are rejected at the future Ring 1 mint API:
`schema_version`, `approval_grant_id`, `grant_kind`, `scope`,
`minted_for_decision_id`, `grantor_principal_ref`, `granted_by`,
`granted_at`, `valid_until`, `execution_context_id`, `grant_state`,
`audit_chain_link_hash`, `evidence_refs`.

**`Lease` (ADR 0052):** envelope-level kernel-set with **three field-level
exceptions** per ADR 0031 v1 §Authority discipline:

- Kernel-set (12 envelope-level fields): `schema_version`, `lease_id`,
  `held_by_session_id`, `held_by_agent_client_id`, `acquired_by`,
  `acquired_at`, `released_at`, `execution_context_id`, `lease_state`,
  `force_break_grant_id`, `audit_chain_link_hash`, `evidence_refs`.
- Producer-asserted, kernel-verifiable (3 envelope-level fields):
  `lease_kind`, `scope` (the discriminated-union envelope field; for the
  worktree branch internally carries `repository_id` + `workspace_context_id`
  + `worktree_path` as sub-field producer-asserted-kernel-verifiable per the
  granular-authority-declaration convention), `valid_until`. Layer 1 mint
  API verifies per ADR 0031 v1 §Authority discipline; rejection emits
  `Decision.reason_kind: 'lease_producer_assertion_unverifiable'`.

**`Run` (ADR 0053):** envelope-level kernel-set with NO field-level
exceptions (cleaner than Lease per ADR 0031 v1 mixed split because Run is
purely kernel-observed). All 13 envelope-level fields are kernel-set:
`schema_version`, `run_id`, `run_kind`, `scope`, `invoker_session_id`,
`invoker_agent_client_id`, `recorded_by`, `started_at`, `ended_at`,
`execution_context_id`, `run_state`, `audit_chain_link_hash`,
`evidence_refs`.

**`Principal` (ADR 0054):** envelope-only-kernel-set with NO field-level
exceptions; **NO `execution_context_id` field on the envelope** (Principal
identity is execution-context-independent at the entity layer; mirrors
AgentClient framing). All 9 envelope-level fields are kernel-set:
`schema_version`, `principal_id`, `principal_kind`, `principal_state`,
`kernel_observed_at`, `valid_until`, `producer`, `audit_chain_link_hash`,
`evidence_refs`. Producer-allowlist closure on `kernel_principal_resolver`
is the structural defense; producer-supplied Principal records rejected
at Ring 1 mint API. Cross-context binding evidence cited via
`evidence_refs` carries its own execution_context_id per inv. 19 where
applicable (e.g., `MachineIdentityBindingObservation`). Same-record
refinement enforces `principal_state == 'active' iff valid_until == null`.

**`Session` (ADR 0055):** envelope-only-kernel-set with NO field-level
exceptions; **YES `execution_context_id` field on the envelope**
(Session is execution-context-BOUND at the entity layer, mirrors
WorkspaceContext per ADR 0031 v1 Mechanical Tweak #8 / Security-C;
DIVERGES from Principal). All 12 envelope-level fields are kernel-set:
`schema_version`, `session_id`, `session_kind`, `session_state`,
`agent_client_id`, `principal_id`, `execution_context_id`, `started_at`,
`ended_at`, `producer`, `audit_chain_link_hash`, `evidence_refs`.
Producer-allowlist closure on `kernel_session_resolver` is the
structural defense; producer-supplied Session records rejected at Ring
1 mint API. The Ring 1 resolver MUST enforce sandbox-source rejection +
transitive chain-walk rejection per security N1 + N4 v2 absorptions of
ADR 0055. Same-record refinements enforce `session_state == 'active'
iff ended_at == null` AND `ended_at == null || ended_at >= started_at`.
Session identity is **transient invocation**, not long-lived identity:
the value-name `ended` (not `retired`) reflects the divergent
semantics; cardinality (1 active + 1 terminal at v1) mirrors the long-
lived precedents. Sessions that cross execution contexts are NEW
Session records.

Schema-side enforcement: Zod cannot reach kernel state, so the producer-
allowlist registration above + the per-entity `*ProducerSchema` enums (each
of which excludes producers not authorized for that envelope) form the
schema-checkable posture. Layer 1 mint API enforces the kernel-set
allowlist + the producer-asserted-kernel-verifiable verification per the
registered rules.

## Subject-kind grounding requirement

Authority for this rule: ADR 0036 §Future amendments §Layer 1 grounding
rule extensibility principle (registered here 2026-05-09). The rule is
charter-binding via ADR 0036's acceptance + ADR 0019 v3 §Chain promotion
rule + charter v1.4.0 inv. 18 chain-walk rejection.

### Rule

A `CoordinationFact.subject_kind` value whose typical `evidence_refs`
array is **primarily backed by derived-content or Layer-2 evidence**
(audit-framework outputs, retrieval-projection outputs, summarization
outputs, contract-validation outputs) cannot be promoted to
`allowed_for_gate: true` unless the `evidence_refs` array contains at
least one `Evidence` record with `authority: "host-observation"` (or
`"provider-asserted-kernel-verifiable"` per charter inv. 16). Layer 1
mint API enforces the rule at promotion-grant minting; on missing
host-observation grounding, mint rejects with
`Decision.reason_kind: coordination_promotion_no_layer1_grounding`
(per ADR 0036 §Sub-decision (b) §Layer 1 grounding requirement, line
738-739).

This is distinct from — and composes with — ADR 0019 v3's chain-promotion
rule, which structurally rejects promotion when `derived_from` cites
`KnowledgeChunk` records or `sandbox-observation` authority. The
chain-promotion rule guards **how** evidence composes; the grounding
requirement guards **whether** the subject_kind is promotion-eligible
at all on derived-only chains.

### Subject-kinds subject to the grounding requirement

Subject-kinds primarily backed by derived-content or Layer-2 content
(MUST cite at least one host-observation `Evidence` record before
promotion):

- `workspace_context` (committed by ADR 0036)
- `audit_profile_snapshot` (committed by ADR 0036)

### Subject-kinds inheriting ADR 0019 v3's chain-promotion rule only

Subject-kinds primarily backed by direct host-observation `Evidence`
(promotion-eligible on the chain-promotion rule alone, no additional
grounding requirement):

- `release` (ADR 0019 v3)
- `branch` (ADR 0019 v3)
- `worktree` (ADR 0019 v3 + ADR 0031 v1)
- `ruleset` (ADR 0019 v3 + ADR 0033 v2)
- `credential_audience` (ADR 0019 v3)
- `deployment` (ADR 0019 v3)
- `external_target` (ADR 0019 v3)

### Procedure for adding a new subject_kind value

A schema PR introducing a new `CoordinationFact.subject_kind` value
MUST include in its commit / PR description:

1. A classification statement: is the subject_kind primarily backed by
   host-observation Evidence (inherits ADR 0019 v3 only), or primarily
   backed by derived-content / Layer-2 Evidence (requires the additional
   grounding rule)?
2. If the classification is "primarily derived/Layer-2," the schema PR
   updates this registry section to add the new value to the
   §Subject-kinds subject to the grounding requirement list, AND the
   Ring 1 mint API enforcement is updated in the same change-set or in
   a follow-on PR explicitly cited.
3. If the classification is "primarily host-observation," no registry
   update is required; this section's §inheriting list documents the
   classification at acceptance.
4. An `hcs-ontology-reviewer` pass before the schema PR lands; reviewer
   confirms the classification and the matching enforcement disposition.

### Phase 2.7 candidate dispositions (ADR 0048)

Phase 2.7 introduced typed `Evidence.subject_kind` values for credential
plane (`machine_identity` per ADR 0043 Q-013), project-substrate
(`project_substrate_contract` as `KnowledgeSource.source_kind` plus
typed receipt subject kinds per ADR 0044 Q-014), and backup readiness
(`BackupReadinessObservation` family per ADR 0045 Q-015). None of those
values are present in `coordinationSubjectKindSchema` today; the
§Subject-kind grounding requirement governs `CoordinationFact.subject_kind`,
not `Evidence.subject_kind`.

ADR 0048 records the dispositions for each candidate IF a future schema
PR promotes it into `CoordinationFact.subject_kind`; this ADR does not
itself widen the enum. Default for all three: no enum addition unless
a concrete coordination need surfaces.

| Candidate | Disposition | Promotion rule when added |
|---|---|---|
| `machine_identity` (ADR 0043 Q-013) | Host-observation-backed | Joins §Subject-kinds inheriting ADR 0019 v3's chain-promotion rule only. Promotion to `allowed_for_gate: true` requires `evidence_refs` to include at least one `CredentialAuthorityObservation` or `MachineIdentityBindingObservation` with `authority: "host-observation"` (or `"provider-asserted-kernel-verifiable"` per inv. 16); ADR 0019 v3 chain-promotion + charter inv. 18 chain-walk jointly enforce per-record rejection of `sandbox-observation` / `self-asserted` authority. Cross-context binding (inv. 19 + §Cross-context enforcement layer) inherited. |
| `project_substrate_contract` (ADR 0044 Q-014) | Derived/Layer-2-backed | Joins the §Subject-kinds subject to the grounding requirement list; promotion to `allowed_for_gate: true` requires at least one host-observation (or `provider-asserted-kernel-verifiable` per inv. 16) `Evidence` record beyond the source contract YAML and structural validation — typed `ProjectSubstrateContractValidationReceipt` with kernel-set producer + host-observation authority, or a `BoundaryObservation` of `boundary_dimension: project_admission_authority`. Cross-context binding (inv. 19 + §Cross-context enforcement layer) inherited. |
| backup-readiness subject_kinds (ADR 0045 Q-015) | Mixed/declarative | Joins the §Subject-kinds subject to the grounding requirement list; standard host-observation-grounding rule applies to all promotions. Additional lifecycle-state rule: when the CoordinationFact's *object payload* asserts the workspace's backup-readiness lifecycle is in the `ready` state, promotion additionally requires a freshness-valid `RestoreDrillReceipt` with boot/service verification per ADR 0042/0045. Other lifecycle states (`pending` / `configured` / `usable` / `expired`) need only the standard rule. Cross-context binding (inv. 19 + §Cross-context enforcement layer) inherited. |

These dispositions are preconditions for any future schema PR that brings
a candidate into `coordinationSubjectKindSchema`; the schema PR
re-validates the disposition against current evidence usage at acceptance
time per the §Procedure for adding a new subject_kind value rule above
(`hcs-ontology-reviewer` confirms the classification).

Currently no Phase 2.7 candidate is in `coordinationSubjectKindSchema`;
they remain represented as `Evidence.subject_kind` values only.

## Cross-context enforcement layer

Charter v1.3.2 wave-3 forbids cross-context evidence reuse: a
`BoundaryObservation` whose primary target reference does not match the
consuming `OperationShape`'s execution context fails composition. The
same rule applies to evidence subtype envelopes and proof composites
(per ADR 0025 component-evidence binding).

This section codifies *where* cross-context binding rejection happens.
The post-merge review of ADR 0027 and ADR 0028 surfaced that the
forbidden-pattern language said "fails" without naming the enforcement
layer.

The enforcement is **defense-in-depth across three Ring 1 layers**:

1. **Mint API.** When a Ring 1 service mints an evidence record (or a
   proof composite), it rejects any input whose target references do
   not resolve consistently with the requesting session's
   `ExecutionContext`. This is the primary enforcement layer; producer
   inputs that fail here are returned as typed mint-rejection
   `Decision` records, not silent failures.

2. **Broker FSM re-check.** When a broker consumes a proof composite
   or evidence envelope at operation-execution time, it re-verifies
   cross-context binding. A proof that was valid at mint time can
   become invalid if the execution context has changed (per ADR 0025
   v2's mint-time-and-execution-time re-check rule). The broker's
   re-check catches policy drift between mint and execution.

3. **Gateway re-derive.** The gateway re-derives the binding from
   execution-context evidence at decision time. This is the
   authoritative non-escalable layer per inv. 6.

Schema (Zod) validation alone is **not** an enforcement layer for
cross-context binding. Schema validates structure (required fields,
enum membership, primitive types) but cannot validate that two
references resolve consistently against host state. Cross-context
binding is a Ring 1 invariant.

ADRs that propose new evidence subtypes or proof composites must name
which of the three layers each cross-context binding rule lives at.
Defaults: layer 1 (mint API) for binding-time invariants; layer 2
(broker re-check) for execution-time invariants; layer 3 (gateway) for
forbidden-tier non-escalable rules per inv. 6.

### Layer-disagreement tiebreaker

When the three layers reach different conclusions about the same
binding (mint API accepts, but the gateway re-derives a different
binding at decision time, for example because policy or
`ExecutionContext` changed between mint and execution), **the gateway
wins**. Mint-time acceptance does not bind the gateway. The broker FSM
is the intermediate enforcement point and rejects when its re-check
reveals drift, but the gateway's re-derive is the authoritative
non-escalable answer per inv. 6.

### Audit-chain coverage of rejections

Rejection at any of the three layers emits an audit event. Per charter
inv. 4, audit integrity requires recording rejections, not just
successes. The audit event carries:

- `agent_client_id` (or `principal_id` for the requesting principal),
- `session_id`,
- the rejecting layer (`mint_api` | `broker_fsm` | `gateway`),
- the rejection-class discriminator (e.g.,
  `cross_context_target_mismatch`,
  `force_protected_combination`,
  `authority_class_promotion_attempt`),
- the typed `Decision` record returned to the requester (per layer 1
  mint-rejection rule).

Audit-chain participation of rejection events is a Ring 1 invariant;
producers do not opt out. ADRs proposing new evidence subtypes or
proof composites do not need to re-name this requirement; it applies
by inheritance from this section.

**Principal-attribution typed-FK closure (ADR 0054)**: `principal_id`
in the audit event is a typed FK to a `Principal` Ring 0 entity
(per ADR 0054 / D-043 post-2026-05-11 schema landing). The
`requesting_principal_id` references in ADR 0025 §Branch deletion
proof and ADR 0036 §Sub-decision (d) cycle-history.md ratification
verifier-identity gain typed Ring 0 targets at the same landing.
The Principal entity carries `audit_chain_link_hash` per the
length-prefix discipline; principal lifecycle transitions (active →
retired) emit their own typed audit chain entries via
`kernel_principal_resolver`.

## Redaction posture

ADR 0023's `Evidence` base contract names `redaction_mode` as the
canonical redaction discipline for persisted evidence payloads. The
enum (`evidenceRedactionModeSchema` in
`packages/schemas/src/entities/evidence.ts`) has six values:
`none | redacted | classified | hash_only | reference_only | mixed`.

Per ADR 0023 §Decision: "Evidence payloads may contain redacted,
classified, hashed, or reference-only data. They must not contain raw
secret material."

This section codifies two rules surfaced during the post-merge review
of ADR 0028.

### Persistence redaction is canonical

`Evidence.redaction_mode` is the single canonical redaction-mode field
on every evidence record. Persistence redaction describes how the
record's payload was sanitized before storage. New evidence subtypes
must not introduce a parallel `<thing>_redaction_mode` field at the
payload level whose semantics overlap with the base `redaction_mode`.

ADR 0036 has one accepted fixed-literal exception:
`mcp_canonical_authority.observed_payload.redaction_mode` is always
`reference_only`. It names the reference-only content discipline for that
payload and is not a persistence sanitizer choice. New payload families must
not copy this exception without their own ADR and ontology-review pass.

If a domain payload needs a redaction-related field whose semantics
genuinely differ from persistence redaction, the field must:

1. Use a name that does not contain `redaction_mode` (avoiding
   semantic collision).
2. Document the layer it operates at (capture-time vs persistence-time
   vs transmission-time).
3. Receive an `hcs-ontology-reviewer` pass before the schema PR using
   the new field lands.

### Capture-mode vs persistence-redaction

ADR 0028 originally proposed `argv_redaction_mode` on
`ToolInvocationReceipt`'s payload, with overlapping enum vocabulary
against the base `redaction_mode`. The corrected name is
`argv_capture_mode`: how argv was captured at tool invocation time
(and how secret-shaped content was handled at capture). The base
`redaction_mode` then describes how the receipt's payload (including
the argv data) was sanitized before persistence. The two layers are
orthogonal: capture is about what the producer observed; persistence
redaction is about what the kernel/store committed to disk.

The pattern for similar receipts: payload-level `<thing>_capture_mode`
fields are permitted when they describe capture-time discipline;
`redaction_mode` at the Evidence base level describes persistence-time
discipline. The two compose, they don't substitute.

### Field-level scrubber rule

When `redaction_mode != none`, every string-typed payload field on the
record must pass the same secret-shape scrubber the base contract
applies. The redaction-mode classification at the record level does
not exempt individual payload fields from scrubbing. A receipt with
`redaction_mode: redacted` whose `last_fetch_outcome` field carries a
URL with embedded basic-auth credentials is in violation of charter
inv. 5 even though the record's redaction_mode is set correctly.

ADRs proposing new evidence subtypes or proof composites must declare
which payload fields the scrubber applies to. The scrubber's
implementation is canonical-policy-driven; the rule that *every*
string-typed payload field is scrubbed when `redaction_mode != none`
is registry-canonical.

### Capture-status × redaction-mode matrix

Receipts that carry both a capture-time discriminator (`*_capture_mode`
or equivalent) and the base `Evidence.redaction_mode` enforce a
permitted-combination matrix at the mint API. The matrix codifies
which combinations make semantic sense (e.g., a `capture_status:
empty` receipt has nothing to redact at persistence time, so
`redaction_mode: redacted` would be misleading and is rejected).

The canonical matrix originated in ADR 0028 v2 §`CommandCaptureReceipt`
§Capture-status × redaction-mode matrix and is generic to other
receipt families with similar capture-vs-persistence layers. ADRs
proposing new such receipts inherit the matrix discipline and must
name any deviations explicitly.

## Phase 2.4 Consolidation Summary

Source: ADR 0038 Phase 2.4. This section is a registry summary only. It
introduces no new schema enum values, no new Zod payloads, no canonical policy
YAML, and no runtime behavior. It records the Phase 2.1-2.3 vocabulary already
landed in schema PRs so Phase 2.5 policy drafting and Phase 2.6 trap fixture
work can cite one stable registry index.

### Standalone Ring 0 entities landed in Phase 2.1

| Entity | Phase | Source ADR | Schema source | Generated schema | Registry notes |
|---|---:|---|---|---|---|
| `AgentClient` | 2.1.1 | ADR 0037 | `packages/schemas/src/entities/agent-client.ts` | `packages/schemas/generated/AgentClient.schema.json` | Identity-axis enum mirrors and `remote_cloud_agent` surface extension recorded. |
| `VerificationCommandSpec` | 2.1.2 | ADR 0036 | `packages/schemas/src/entities/verification-command-spec.ts` | `packages/schemas/generated/VerificationCommandSpec.schema.json` | `workspace_verify` operation-class posture and `kernel_workspace_diagnose` producer class recorded. |
| `KnowledgeSource` | 2.1.3 | ADR 0019 v3 + ADR 0045 | `packages/schemas/src/entities/knowledge-source.ts` | `packages/schemas/generated/KnowledgeSource.schema.json` | Source-kind and security-label mirrors recorded; `KnowledgeChunk` output remains display-only; `schema_version` is `0.2.0` after the ADR 0045 `threat_model` source-kind extension. |
| `KnowledgeChunk` | 2.1.3 | ADR 0019 v3 | `packages/schemas/src/entities/knowledge-chunk.ts` | `packages/schemas/generated/KnowledgeChunk.schema.json` | Not gate authority directly per charter invariant 18. |
| `CoordinationFact` | 2.1.3 | ADR 0019 v3 | `packages/schemas/src/entities/coordination-fact.ts` | `packages/schemas/generated/CoordinationFact.schema.json` | Promotion vocabulary and coordination subject/object/predicate mirrors recorded. |
| `DerivedSummary` | 2.1.3 | ADR 0019 v3 | `packages/schemas/src/entities/derived-summary.ts` | `packages/schemas/generated/DerivedSummary.schema.json` | Derived graph record-kind mirror recorded; promotion constraints stay Ring 1 / gate consumption posture. |
| `QualityGate` | 2.1.4 | ADR 0035 | `packages/schemas/src/entities/quality-gate.ts` | `packages/schemas/generated/QualityGate.schema.json` | Gate-kind, gate-state, evidence-chain, and reason-kind mirrors recorded. |

### Existing Ring 0 shapes extended in Phase 2.2

| Shape | Phase | Source ADR | Schema source | Version / field movement | Registry notes |
|---|---:|---|---|---|---|
| `ExecutionContext` | 2.2.1 | ADR 0037 | `packages/schemas/src/entities/execution-context.ts` | Added `latest_containment_evidence_ref`; renamed cache to `kernel_sandbox_kind`; schema version `0.2.0`. | Cache fields are kernel-set authority fields. |
| `OperationShape` | 2.2.2 | ADR 0036 | `packages/schemas/src/entities/operation-shape.ts` | Added `deletion_authority_kind` and `deletion_authority_source_ref`; schema version `0.2.0`. | Deletion-authority enum mirrors recorded; no execute lane behavior authorized. |
| `BoundaryObservation` | 2.2.3, 2.3.2, 2.3.3, 2.7 | ADR 0022, ADR 0036, ADR 0037, ADR 0032, ADR 0027, ADR 0044 | `packages/schemas/src/entities/boundary-observation.ts` | Typed payload bundle and later branch additions; current schema version `0.5.0`. | Accepted typed branches are summarized below. |

### Direct Evidence subtypes landed through Phase 2.7

| Evidence subtype | Phase | Source ADR | `evidence_kind` | `subject_kind` | Payload version |
|---|---:|---|---|---|---|
| `GitIdentityBinding` | 2.3.1 | ADR 0034 | `observation` | `git_identity_binding` | implementation-specific optional string |
| `ToolProvenance` | 2.3.1 | ADR 0034 | `observation` | `tool_provenance` | implementation-specific optional string |
| `RunnerHostObservation` | 2.3.2 | ADR 0032 | `observation` | `runner_host` | `runner-host-observation:v1` |
| `WorkflowRunReceipt` | 2.3.2 | ADR 0032 | `receipt` | `workflow_run` | `workflow-run-receipt:v1` |
| `CleanRoomSmokeReceipt` | 2.3.2 | ADR 0032 | `receipt` | `clean_room_smoke` | `clean-room-smoke-receipt:v1` |
| `ResourceBudgetObservation` | 2.3.2 | ADR 0032 | `observation` | `resource_budget` | `resource-budget-observation:v1` |
| `PolicyPlanReceipt` | 2.3.2 | ADR 0032 | `receipt` | `policy_plan` | `policy-plan-receipt:v1` |
| `GitRepositoryObservation` | 2.3.3 | ADR 0027 | `observation` | `git_repository` | `git_repository_observation:v1` |
| `GitRemoteObservation` | 2.3.3 | ADR 0027 | `observation` | `git_ref` | `git_remote_observation:v1` |
| `GitWorktreeObservation` | 2.3.3 | ADR 0030 | `observation` | `git_worktree` | `git_worktree_observation:v1` |
| `GitWorktreeInventoryObservation` | 2.3.3 | ADR 0030 | `observation` | `git_worktree_inventory` | `git_worktree_inventory_observation:v1` |
| `GitBranchAncestryObservation` | 2.3.3 | ADR 0030 | `observation` or `derived` | `git_branch_ancestry` | `git_branch_ancestry_observation:v1` |
| `GitDirtyStateObservation` | 2.3.3 | ADR 0030 | `observation` | `git_dirty_state` | `git_dirty_state_observation:v1` |
| `PullRequestReceipt` | 2.3.3 | ADR 0030 | `receipt` | `pull_request` | `pull_request_receipt:v1` |
| `PullRequestAbsenceReceipt` | 2.3.3 | ADR 0030 | `receipt` | `pull_request_absence` | `pull_request_absence_receipt:v1` |
| `RulesetObservation` | 2.3.3 | ADR 0033 | `observation` | `ruleset` | `ruleset_observation:v1` |
| `RepositoryIdentityReconciliationObservation` | 2.3.3 | ADR 0033 | `observation` | `repository_identity_reconciliation` | `repository_identity_reconciliation:v1` |
| `MCPCredentialAudienceObservation` | 2.3.3 | ADR 0033 | `observation` | `mcp_credential_audience` | `mcp_credential_audience_observation:v1` |
| `StatusCheckSourceObservation` | 2.3.3 | ADR 0033 | `observation` | `status_check_source` | `status_check_source_observation:v1` |
| `RemoteAgentBaseImageObservation` | 2.3.4 | ADR 0037 | `observation` | `remote_agent_base_image` | `remote-agent-base-image-observation:v1` |
| `RemoteAgentSetupReceipt` | 2.3.4 | ADR 0037 | `receipt` | `remote_agent_setup` | `remote-agent-setup-receipt:v1` |
| `RemoteAgentNetworkPostureObservation` | 2.3.4 | ADR 0037 | `observation` | `remote_agent_network_posture` | `remote-agent-network-posture-observation:v1` |
| `CredentialAuthorityObservation` | 2.7 | ADR 0043 | `observation` | `credential_source` | `credential_authority_observation:v1` |
| `MachineIdentityBindingObservation` | 2.7 | ADR 0043 | `observation` | `machine_identity` | `machine_identity_binding_observation:v1` |
| `ProjectSubstrateContractValidationReceipt` | 2.7 | ADR 0044 | `receipt` | `workspace` + `knowledge_source` | `project_substrate_contract_validation_receipt:v1` |
| `ProjectSubstrateAdmissionObservation` | 2.7 | ADR 0044 | `observation` | `workspace` + `knowledge_source` | `project_substrate_admission_observation:v1` |
| `ProjectTeardownPlanReceipt` | 2.7 | ADR 0044 | `receipt` | `workspace` + optional `knowledge_source` | `project_teardown_plan_receipt:v1` |
| `ProjectTeardownCompletionReceipt` | 2.7 | ADR 0044 | `receipt` | `workspace` | `project_teardown_completion_receipt:v1` |
| `BackupReadinessObservation` | 2.7 | ADR 0045 | `observation` | `workspace` / `provider_object` / `external_control_plane` | `backup_readiness_observation:v1` |
| `RestoreDrillReceipt` | 2.7 | ADR 0045 | `receipt` | `workspace` / `provider_object` / `external_control_plane` | `restore_drill_receipt:v1` |
| `BackupCredentialCustodyObservation` | 2.7 | ADR 0045 | `observation` | `credential_source` + optional surface subjects | `backup_credential_custody_observation:v1` |
| `ProjectSubstrateBackupRequirementObservation` | 2.7 | ADR 0045 | `observation` | `workspace` + `knowledge_source` | `project_substrate_backup_requirement_observation:v1` |

### Typed `BoundaryObservation` branches landed through Phase 2.7

| Boundary dimension | Phase | Source ADR | Primary target | Payload schema | Current status |
|---|---:|---|---|---|---|
| `containment_class` | 2.2.3 | ADR 0037 | `execution_context_id` | `containmentClassPayloadSchema` | accepted |
| `filesystem_inheritance` | 2.2.3 | ADR 0036 | `execution_context_id` | `filesystemInheritancePayloadSchema` | accepted |
| `filesystem_protected_paths` | 2.2.3 | ADR 0036 | `workspace_id` | `filesystemProtectedPathsPayloadSchema` | accepted |
| `mcp_canonical_authority` | 2.2.3 | ADR 0036 | `execution_context_id` | `mcpCanonicalAuthorityPayloadSchema` | accepted |
| `runner_isolation` | 2.3.2 | ADR 0032 | `execution_context_id` | `runnerIsolationPayloadSchema` | accepted |
| `branch_protection` | 2.3.3 | ADR 0027 | `tool_or_provider_ref` | `branchProtectionPayloadSchema` | accepted |
| `project_admission_authority` | 2.7 | ADR 0044 | `workspace_id` | `projectAdmissionAuthorityPayloadSchema` | accepted |

### Current schema-version ledger

| Schema family | Current version | Last Phase 2 change | Notes |
|---|---:|---|---|
| `Evidence` | `0.10.0` | `evidenceAuthoritySchema` `self-asserted` enum extension (closes ADR 0039 §Forward-looking observations #5) | Direct Evidence subtype payloads use the base envelope and their own `payload_schema_version` values; prior Q-015 (ADR 0045) reused existing subject kinds and did not bump this contract. |
| `BoundaryObservation` | `0.5.0` | Phase 2.7 Q-014 `project_admission_authority` branch | `evidence_schema_version` is an independent envelope field that cites the base `Evidence` contract; current fixtures use the base `Evidence` version without requiring future lockstep bumps. |
| `KnowledgeSource` | `0.2.0` | Phase 2.7 Q-015 `threat_model` source-kind extension | The enum contract widened after the Phase 2.1.3 introduction; ADR 0045 owns this schema-version bump. |
| `ExecutionContext` | `0.2.0` | Phase 2.2.1 containment-cache refactor | Cache is kernel-set and points to typed containment evidence. |
| `OperationShape` | `0.2.0` | Phase 2.2.2 deletion-authority extension | Source-vs-ledger version drift closed 2026-05-09 by introducing `operationShapeSchemaVersionSchema = z.literal('0.2.0')` in source (was previously sharing the generic `schemaVersionSchema = z.literal('0.1.0')` from `common.ts`); ADR 0036 is the existing authority. ADR 0047 cleanup_plan addition treated as additive enum widening per schema-change skill, no further bump. No mutation/execute behavior is authorized by this registry record. |
| `Decision` | `0.1.0` | ADR 0049 / D-037 foundational-entity introduction; ADR 0056 / D-046 and ADR 0058 / D-053 additive reason-kind promotions | `decisionSchemaVersionSchema = z.literal('0.1.0')`. Landed at commit `7fb7e05` with Step 1 foundational train. ADR 0056 adds `operation_class_unregistered` + `audit_chain_corruption_detected` to `decisionReasonKindSchema`; ADR 0058 adds `authority_chain_walk_depth_exceeded`. Both slices are additive enum widening with no version bump. |
| `WorkspaceContext` | `0.1.0` | ADR 0050 / D-038 foundational-entity introduction | `workspaceContextSchemaVersionSchema = z.literal('0.1.0')`. Landed at commit `7fb7e05`. |
| `ApprovalGrant` | `0.1.0` | ADR 0051 v4 / D-039 foundational-entity introduction | `approvalGrantSchemaVersionSchema = z.literal('0.1.0')`. Landed at commit `7fb7e05`. ADR 0054 typed-FK closure for `grantor_principal_ref` does NOT bump (FK shape unchanged at `entityIdSchema`). |
| `Lease` | `0.1.0` | ADR 0052 / D-040 foundational-entity introduction | `leaseSchemaVersionSchema = z.literal('0.1.0')`. Landed at commit `7fb7e05`. |
| `Run` | `0.1.0` | ADR 0053 / D-041 foundational-entity introduction | `runSchemaVersionSchema = z.literal('0.1.0')`. Landed at commit `7fb7e05`. |
| `Principal` | `0.1.0` | ADR 0054 / D-043 foundational-entity introduction (post-Step-1-source-landing) | `principalSchemaVersionSchema = z.literal('0.1.0')`. Closes ApprovalGrant.grantor_principal_ref + future Session.principal_id + ADR 0025 requesting_principal_id + ADR 0036 verifier-identity typed FK targets. Cf-category-strip canonicalization recipe structurally closes ADR 0051 v4 MT-Sec-2 zero-width-character evasion. |
| `Session` | `0.1.0` | ADR 0055 / D-044 foundational-entity introduction (Step 3 entity #2 of 2 highest-coupling) | `sessionSchemaVersionSchema = z.literal('0.1.0')`. Closes 4 forward-reference typed FK targets: Lease.held_by_session_id (ADR 0052), Run.invoker_session_id (ADR 0053), ADR 0030 v2 owning_session_id, and consuming/requesting session references in ADRs 0031 v1 / 0051 v4 / 0052 / 0054. Execution-context-bound at entity layer (mirrors WorkspaceContext per ADR 0031 v1 Mechanical Tweak #8; DIVERGES from Principal which is execution-context-independent). |
| `PolicyRule` | `0.1.0` | ADR 0060 / D-057 introduction (first of the remaining-11 M1 entities in the resumed forward train; first NON-MINTED Ring 0 entity) | `policyRuleSchemaVersionSchema = z.literal('0.1.0')`. NON-MINTED — no `audit_chain_link_hash`, no producer-mint field, no `evidence_refs`; absent from the ADR 0057 mint scope. Keyed to `OperationShape.operation_class`; reuses `operationShapeOperationClassSchema` + `approvalGrantKindSchema` + `approvalGrantProducerSchema`. New narrow `isoDurationSchema` primitive added to `common.ts`. Structural superRefine enforces charter inv. 6 forbidden non-escalability (`nonEscalableTiers` set) + `required_grant_kind ∈ allowed_grant_kinds`; never the `operation_class → tier` mapping (live-policy content, inv. 1/10). Landing flips live policy `policy_rule_schema_version` `null → '0.1.0'`. Named Ring-1 deps: B-1 `Decision` attribution amendment, B-2 loader digest-verification. |
| `Capability` | `0.1.0` | ADR 0062 / D-060 introduction (second of the remaining-11 M1 entities in the resumed forward train; structural peer of `PolicyRule`) | `capabilitySchemaVersionSchema = z.literal('0.1.0')`. NON-MINTED — no `audit_chain_link_hash`, no producer-mint field, no `evidence_refs`, no observation-state enum, no containment-class axis, no `superRefine`; absent from the ADR 0057 mint scope. A registry declaration of a known kernel operation keyed to `operation_name` + `operation_class`; reuses `operationShapeOperationClassSchema` (never redefined). `capability_state` (`active`/`deprecated`/`retired`) is registry lifecycle; `deprecated`/`retired` render-refusal is a CommandShape-renderer obligation (charter inv. 11), not schema-enforced. `source_provenance.authority: 'capability_registry'` is disjoint from `evidenceAuthoritySchema`; `source_registry_sha256` is format-only at Ring 0, the digest-trust check is a Ring 1 capability-registration obligation. Three-senses disambiguation: NOT the `AgentClient` containment-class axis, NOT the `BoundaryObservation` capability-state observation vocabulary. |
| `CommandShape` | `0.1.0` | ADR 0063 / D-061 introduction (third and last entity in the `PolicyRule → Capability → CommandShape` chain) | `commandShapeSchemaVersionSchema = z.literal('0.1.0')`. NON-MINTED — no `audit_chain_link_hash`, no producer-mint field, no `evidence_refs`; absent from the ADR 0057 mint scope. A typed PLAN (`argv` + `env` + `cwd` + `timeout_seconds`) rendered from an `OperationShape` (`operation_shape_ref` provenance); a typed plan, NOT an execution authorization (no execution semantics, no execute lane, charter inv. 7). Embodies inv. 2 (typed `argv` vector, no shell-string field) + inv. 5 (`env` names + value-source references via a `secret_reference` / `execution_context_inherited` discriminated union, no resolved values). Envelope `superRefine` enforces env-name uniqueness only. `operation_class` is NOT echoed (derivable via `operation_shape_ref`, inv. 1). Deferred Ring-1 obligations: deprecated-verb render-refusal (inv. 11), cwd absolute-root confinement, SecretReference FK closure + env value resolution, operation_shape_ref FK existence, and the argv argument-class distinction (charter line 98, recorded as a seeded accept-and-trap fixture). |
| Other standalone Phase 2.1 entities | `0.1.0` | Phase 2.1 entity introductions | Uses common `schemaVersionSchema`; future breaking changes require their own ADR. |

### Kernel-trusted producer allowlist final state

Phase 2.4 restates the authority-discipline allowlist above for producer
values that are kernel-set when present in `Evidence.producer`:

| Producer value | Source ADR | Kernel owner | Notes |
|---|---|---|---|
| `kernel_broker` | ADR 0028 | Ring 1 broker FSM | Broker-mediated invocation / watchdog producer class. Authorized on `ApprovalGrant.granted_by`, `Lease.acquired_by`, `Run.recorded_by`, `Decision.decided_by`. |
| `kernel_gateway` | ADR 0049 | Ring 1 gateway re-derive | Gateway re-derive emits `Decision` records (`Decision.decided_by` allowlist). Intentionally EXCLUDED from `ApprovalGrant.granted_by`, `Lease.acquired_by`, and `Run.recorded_by` — the gateway is the non-escalable layer per §Layer-disagreement tiebreaker. |
| `kernel_telemetry` | ADR 0028 | Ring 1 telemetry readers | Host process, kqueue, ptrace, and equivalent host telemetry. |
| `kernel_agent_client_resolver` | ADR 0037 | Ring 1 agent-client resolver | Resolves AgentClient axes and remote-cloud execution-context surfaces. |
| `kernel_principal_resolver` | ADR 0054 | Ring 1 principal resolver | Mints `Principal` records from binding evidence (`GitIdentityBinding` for `human`; `MachineIdentityBindingObservation` for `service_principal`; future Q-row commit-signature-to-principal mappings per ADR 0036 §Future amendments). Canonicalizes `principal_id` surface IDs at mint per ADR 0054 §Compliance §Principal-id canonicalization rule 4-step recipe (NFC + Cf-category strip + Unicode-aware lowercase fold + leading/trailing whitespace trim). Mirrors `kernel_agent_client_resolver` precedent. |
| `kernel_session_resolver` | ADR 0055 | Ring 1 session resolver | Mints `Session` records from invocation evidence (MCP server connection / CLI invocation / IDE workspace open kernel-observation paths). MUST enforce sandbox-source rejection (invocation evidence MUST NOT carry `authority: 'sandbox-observation'` or `'self-asserted'`) + transitive chain-walk rejection via `derived_from` per ADR 0019 v3 with walk-depth budget ≤ 64 + cycle-rejection via `audit_chain_corruption_detected` (security N1 + N4 v2 absorptions of ADR 0055). Mirrors `kernel_agent_client_resolver` (ADR 0037) + `kernel_principal_resolver` (ADR 0054) precedents. |
| `kernel_workspace_diagnose` | ADR 0036, ADR 0050 | Ring 1 workspace diagnose service | Mints workspace diagnostic outputs, manifest projections, and `WorkspaceContext` identity records. |
| `mint_api` | ADR 0028 | Ring 1 mint API | Kernel-set producer for synthetic or derived records. Authorized on `ApprovalGrant.granted_by`, `Lease.acquired_by`, `Run.recorded_by`, `Decision.decided_by`. |

Producer-supplied values matching any row above remain rejected at the mint API
until the future `Evidence.producer` kind-tagged schema lands. This table does
not authorize agents or adapters to self-identify as kernel producers.

### Phase 2.4 follow-on boundary

Phase 2.4 closes only registry summary and cross-reference consolidation for
the accepted Phase 2.1-2.3 schema train. Remaining work stays in the lanes ADR
0038 already names:

- Phase 2.5 canonical policy YAML lives in
  `system-config/policies/host-capability-substrate/`, not this repo.
- Phase 2.6 trap fixtures land after policy dependencies and trap-number
  deconfliction.
- Q-013, Q-014, and Q-015 remain Phase 2.7 / Wave-2 or separately amended
  lanes; their posture docs do not add schema vocabulary here.

## Schema enum mirrors

This section mirrors ontology-controlled enum values that are not
`boundary_dimension` values. Per Registration rule 7, Zod enums and this
registry move together when the enum carries Ring 0 ontology meaning.

### `AgentClient` identity-axis enums

Source: ADR 0037 and ADR 0038 Phase 2.1.1.

`AgentClient.product_family`:

- `claude_code`
- `codex`
- `cursor`
- `copilot`
- `devin`
- `windsurf`
- `augment`
- `amp`
- `opencode`
- `warp`
- `vscode_native`
- `unknown`

`AgentClient.permission_mode`:

- `default`
- `yolo`
- `approve_all`
- `read_only`
- `unknown`

`AgentClient.containment_mechanism`:

- `terminal_no_isolation_capable`
- `ide_host_isolation_capable`
- `app_managed_bundle_capable`
- `kernel_sandbox_capable`
- `container_capable`
- `vm_capable`
- `remote_cloud_managed_capable`
- `unknown`

`AgentClient.agent_client_state`:

- `active`
- `retired`

`ExecutionContext.surface` Phase 2.1.1 extension:

- `remote_cloud_agent`

`RemoteAgentSetupReceipt.secret_injection_kind`:

- `env_at_setup`
- `env_at_runtime`
- `mounted_secret_volume`
- `brokered_at_request`
- `none_required`

Mirror notes:

- `containment_mechanism` values are capability-class values. Runtime
  containment values are a separate future `containment_class` payload axis.
- `unknown` remains the unsuffixed sentinel value per existing enum convention.
- `remote_cloud_agent` is the umbrella surface value for managed cloud-agent
  products. Per-product cloud-agent surface values remain matrix-only until a
  future ADR accepts first-class per-product surfaces.

### `VerificationCommandSpec` enum mirrors

Source: ADR 0036 and ADR 0038 Phase 2.1.2.

`Evidence.subject_kind` Phase 2.1.2 extension:

- `verification_command_spec`

`VerificationCommandSpec.command_shape.operation_class`:

- `workspace_verify`

`VerificationCommandSpec.command_shape.mutation_scope`:

- `verify_workspace`

`VerificationCommandSpec.command_shape.env_refs.env_capture_mode`:

- `name_only`
- `existence_only`

`VerificationCommandSpec.output_evidence_kind`:

- `verification_receipt`
- `diagnostic_report`

`VerificationCommandSpec.verification_command_spec_state`:

- `active`
- `deprecated`
- `retired`

Mirror notes:

- `command_shape` is an OperationShape-like payload local to
  `VerificationCommandSpec`. The canonical `OperationShape` schema now lands
  in Phase 2.2.2, but `VerificationCommandSpec.command_shape` remains a
  narrowed inline shape for workspace verification because it carries typed argv
  and the ADR 0036 argv/env scrubber pattern. It does not introduce a
  shell-string command surface.

### `OperationShape` enum mirrors

Source: ADR 0029, ADR 0036, ADR 0038 Phase 2.2.2, and ADR 0047.

`OperationShape.operation_class`:

- `read_only_diagnostic`
- `agent_internal_state`
- `destructive_git`
- `external_control_plane_mutation`
- `worktree_mutation`
- `merge_or_push`
- `workspace_verify`
- `cleanup_plan`

`OperationShape.mutation_scope`:

- `none`
- `agent_internal_state`
- `destructive_git`
- `external_control_plane_mutation`
- `worktree_mutation`
- `merge_or_push`
- `verify_workspace`

`OperationShape.target_ref.target_kind`:

- `workspace`
- `execution_context`
- `repository`
- `worktree`
- `filesystem_path`
- `tool_or_provider`
- `provider_object`
- `external_control_plane`
- `unknown`

`OperationShape.deletion_authority_kind`:

- `filesystem_protected_paths_observation`
- `coordination_fact`
- `human_dashboard_grant`
- `runtime_state_classification`

Mirror notes:

- `deletion_authority_source_ref` is a polymorphic FK whose object shape must
  match `deletion_authority_kind`: `boundary_observation_id`,
  `coordination_fact_id`, `approval_grant_id`, or `evidence_id`.
- `unknown` target kind is valid only for read-only diagnostics; mutating
  operations and deletion-authority operations require a resolved target kind.
- The Phase 2.2.2 schema narrows targets by operation class:
  `agent_internal_state` → `execution_context`,
  `external_control_plane_mutation` → `provider_object |
  external_control_plane`, `destructive_git | merge_or_push` →
  `repository`, `worktree_mutation` → `worktree`,
  `workspace_verify` → `workspace`, and ADR 0047 `cleanup_plan` → `workspace`.
- `cleanup_plan` carries `mutation_scope: "none"` per ADR 0047 §Accepts and
  charter v1.4.0 inv. 7 — the operation produces typed records but does not
  execute deletions. `deletion_authority_kind` and `deletion_authority_source_ref`
  are explicit `null` on `cleanup_plan` records (the deletion-authority fields
  belong to the *output* OperationShape records, not the cleanup-plan
  operation itself).
- `deletion_authority_kind` and `deletion_authority_source_ref` are required
  nullable fields on serialized `OperationShape` records. Use explicit `null`
  for both when no deletion authority applies.
- `gitignore` is intentionally not a valid deletion authority kind per D-025.
- `filesystem_protected_paths_observation` points structurally at a
  `BoundaryObservation`; full payload validation for
  `boundary_dimension: filesystem_protected_paths` lands in Phase 2.2.3.
- `coordination_fact` deletion authority requires Layer 1 host-observation
  grounding at mint time; Zod validates only the structural ref pairing.

### `BoundaryObservation` payload enum mirrors

Source: ADR 0036, ADR 0037, and ADR 0038 Phase 2.2.3.

`BoundaryObservation.schema_version`:

- `0.2.0`

`BoundaryObservation.boundary_dimension` Phase 2.2.3 extensions:

- `filesystem_inheritance`
- `filesystem_protected_paths`
- `mcp_canonical_authority`

`BoundaryObservation.boundary_dimension` reserved-only value:

- `filesystem_path_authority_check`

`containment_class.observed_payload.containment_kind`:

- `none`
- `kernel_sandbox`
- `container`
- `vm`
- `remote_cloud_sandbox`
- `ide_host_isolation`
- `terminal_no_isolation`

`containment_class.observed_payload.container_runtime_kind`:

- `docker`
- `podman`
- `nerdctl`
- `orbstack`
- `colima`
- `unknown`

`containment_class.observed_payload.vm_kind`:

- `local_vm_snapshot`
- `local_vm_persistent`
- `unknown`

`containment_class.observed_payload.remote_cloud_kind`:

- `vendor_managed_vm`
- `vendor_managed_container`
- `self_hosted_runner_class`
- `unknown`

`containment_class.observed_payload.network_egress_posture`:

- `none`
- `restricted`
- `open`
- `unknown`

`containment_class.observed_payload.filesystem_write_scope`:

- `none`
- `workspace_write`
- `full_access`
- `unknown`

`containment_class.observed_payload.keychain_access`:

- `none`
- `tcc_scoped`
- `app_managed_bundle`
- `unknown`

`filesystem_protected_paths.observed_payload.path_authority_kind`:

- `rule_binding`
- `lease_scope`
- `tcc_scoped`
- `human_dashboard_grant`

`mcp_canonical_authority.observed_payload.mcp_server_kind`:

- `github_mcp`

`mcp_canonical_authority.observed_payload.canonical_install_source_kind`:

- `homebrew`
- `mise`
- `asdf`
- `npm`
- `pip`
- `uv`
- `system_package_manager`
- `manual`
- `unknown`

`mcp_canonical_authority.observed_payload.canonical_authority_kind`:

- `system_install`
- `user_install`
- `homebrew`
- `mise`
- `direnv_provided`

Mirror notes:

- `filesystem_path_authority_check` remains reserved-only and is not present
  in the Zod `boundary_dimension` enum. Stage-2 work may add it if per-path
  operation authority becomes a Ring 1 service.
- `BoundaryObservation.schema_version` bumps to `0.2.0` because the Phase
  2.2.3 schema structurally narrows accepted payloads for the typed
  dimensions.
- `mcp_server_kind` intentionally lands only `github_mcp`, the ADR 0033
  accepted value. Other MCP server kinds require a later registry extension.
- `mcp_canonical_authority` payloads require
  `redaction_mode: "reference_only"` and carry only evidence references to
  credential/tool records, never resolved credential content.

### Knowledge and coordination enum mirrors

Source: ADR 0019, ADR 0031, ADR 0036, and ADR 0038 Phase 2.1.3.

`Evidence.subject_kind` Phase 2.1.3 extensions:

- `knowledge_source`
- `knowledge_chunk`
- `coordination_fact`
- `derived_summary`

`KnowledgeSource.source_kind`:

- `charter`
- `adr`
- `decision_ledger`
- `runbook`
- `vendor_doc`
- `audit_summary`
- `schema`
- `code`
- `audit_profile_yaml`
- `cycle_history`
- `project_substrate_contract`
- `threat_model`

`KnowledgeSource.security_label`:

- `public`
- `internal`
- `confidential`
- `secret_pointer`
- `secret_referenced`

`KnowledgeChunk.chunk_kind`:

- `prose`
- `code`
- `schema_block`
- `table`
- `audit_record`

`CoordinationFact.subject_kind`:

- `release`
- `branch`
- `worktree`
- `ruleset`
- `credential_audience`
- `deployment`
- `external_target`
- `workspace_context`
- `audit_profile_snapshot`

`CoordinationFact.predicate_kind`:

- `blocked_until`
- `depends_on`
- `gate_token`
- `phase_lock`
- `release_phase`
- `scope_assertion`
- `leased_to`
- `attached_to`
- `held_by`
- `claimed_to_contain`
- `confirmed_to_contain`
- `claim_superseded_by_snapshot`

`CoordinationFact.object_kind`:

- `status_block`
- `dependency`
- `gate_token`
- `scoped_assertion`

`CoordinationFact` object-shape notes:

- `object_kind: "status_block"` carries `{status, reason?, valid_until?}`.
- `object_kind: "dependency"` carries `{dependency_refs}`.
- `object_kind: "gate_token"` carries `{token_kind, token_ref, valid_until?}`.
- `object_kind: "scoped_assertion"` carries `{assertion}` for generic scoped
  assertions or, for ADR 0031 `predicate_kind: "leased_to"`, exactly
  `{session_id, lease_id, valid_until, lease_acquired_at}`.
- `subject_kind: "worktree"` carries `subject_ref: {repository_id,
  worktree_path}`; `workspace_context_id` belongs on the Lease/WorkspaceContext
  composition, not in the worktree subject reference.

`DerivedSummary.summary_kind`:

- `intervention_summary`
- `closeout_narrative`
- `release_summary`
- `audit_summary`
- `operational_summary`
- `cleanup_plan` (added by ADR 0047)

`DerivedSummary.summary_text` (typed closed-enum vocabulary when
`summary_kind: "cleanup_plan"`; free-form display prose otherwise):

- `hint_resolved`
- `hint_ignored_stale`
- `hint_ignored_workspace_mismatch`
- `hint_unresolvable`
- `no_hint_provided`

The closed-enum vocabulary captures hint-resolution status for the
`system.cleanup.plan.v1` operation per ADR 0047. The schema layer enforces
the membership via Zod refinement on `derivedSummarySchema` when
`summary_kind === 'cleanup_plan'`. For all other `summary_kind` values
`summary_text` remains free-form.

`DerivedSummary.derived_from.source_record_kind`:

- `evidence`
- `coordination_fact`
- `derived_summary`
- `knowledge_chunk`

`coordinationTargetRef.target_kind`:

- `host`
- `workspace_context`
- `execution_context`
- `session`
- `repository`
- `worktree`
- `branch`
- `ruleset`
- `credential_audience`
- `deployment`
- `external_target`
- `filesystem_path`
- `provider_object`
- `unknown`

Mirror notes:

- `project_substrate_contract` is a Layer 2 `KnowledgeSource` kind for Q-014
  contract intake. Contract chunks are retrieval/display records; gateable
  claims come from typed evidence records that cite the source hash.
- `threat_model` is a Layer 2 `KnowledgeSource` kind for Q-015 backup
  readiness. Project-specific accepted-risk content remains in owning repos or
  private sources; HCS public schemas cite the source and do not inline risk
  lists.
- `secret_pointer` is distinct from `secret_referenced`: pointer-form
  references may remain indexable, while resolved secret material is forbidden
  and `secret_referenced` chunks cannot carry `embedding_ref`.
- `CoordinationFact.predicate_kind` folds accepted ADR 0019, ADR 0031, and ADR
  0036 reservations into the first schema mirror so downstream facts do not
  need to re-open the base vocabulary.

### `QualityGate` enum mirrors

Source: ADR 0035 and ADR 0038 Phase 2.1.4.

`Evidence.subject_kind` Phase 2.1.4 extension:

- `quality_gate`

`QualityGate.gate_kind`:

- `identity_binding`
- `credential_shadow`
- `signing_identity`
- `filesystem_trust`
- `tool_provenance`
- `mutation_class`

`QualityGate.gate_state`:

- `provisional`
- `proven`
- `expired`
- `denied`

`QualityGate.target_subject_ref.operation_class` (mirrors
`operationShapeOperationClassSchema`; ADR 0029, ADR 0036, ADR 0047):

- `read_only_diagnostic`
- `agent_internal_state`
- `destructive_git`
- `external_control_plane_mutation`
- `worktree_mutation`
- `merge_or_push`
- `workspace_verify` (mirror reconciliation; closes the pre-existing
  ADR 0036 enum-mirror gap surfaced during ADR 0047 review)
- `cleanup_plan` (added by ADR 0047)

`QualityGate.evidence_chain_refs.record_kind`:

- `evidence`
- `boundary_observation`
- `coordination_fact`
- `derived_summary`
- `knowledge_chunk`
- `quality_gate`

`Decision.reason_kind` reservations from ADR 0035:

- `gate_provisional`
- `gate_denied`
- `gate_expired`
- `gate_evidence_insufficient`
- `gate_target_already_active`
- `gate_evidence_stale_reuse`

`Decision.reason_kind` reservations from ADR 0047 (registry-canonical
pending Ring 1 mint API schema PR; not yet Zod-source-defined):

- `cleanup_plan_authority_source_stale` — Layer 1 mint rejects an output
  `OperationShape` whose `deletion_authority_source_ref` is stale or whose
  underlying observation has been superseded; also surfaces at gateway
  re-walk during class-I consumption per ADR 0047 §Accepts.
- `cleanup_plan_target_under_active_lease` — Layer 1 mint refuses to
  *propose* deletion of a candidate target under any active worktree
  `Lease` regardless of session ownership. Distinct from ADR 0031's
  `worktree_lease_held_by_other_session`, which names the worktree-mutation
  surface where another session holds the lease.

`cleanup_scope` enum reservation from ADR 0047 (registry-canonical
pending Ring 1 mint API schema PR; not yet Zod-source-defined):

- `audit_profile_claim_supersession` — cleanup driven by an audit-profile
  snapshot supersession (`KnowledgeSource.content_hash` change with
  `predicate_kind: "claim_superseded_by_snapshot"`).
- `worktree_lease_completed` — cleanup driven by a worktree lease reaching
  `lease_state: "released"`, `"force_broken"`, or `"expired"` per ADR 0031 v1
  (the three terminal-non-active states).

Per registry §Naming-discipline §Sub-rule 8 (bare-noun central-concept
discriminator), `cleanup_scope` is the central-concept discriminator and
does not take a `_kind` suffix. `explicit_target_set` is deferred behind
redaction-posture work per ADR 0047 §Future amendments.

`Decision.required_grant_kind` reservation from ADR 0035:

- `gate_evidence_acknowledgment`

Mirror notes:

- This schema slice does not author a `Decision`, `ApprovalGrant.scope`, or
  canonical policy YAML schema. The reservations above are documented for
  vocabulary continuity only.
- `QualityGate.evidence_refs` remains a single evidence-reference array, with
  each item extending the common `evidenceRefSchema` preview by adding
  `evidence_chain_refs`. Each chain ref requires `authority`. The chain
  preview lets Zod enforce the ADR 0038 / charter invariant 18 guard: direct
  retrieval artifacts are rejected, and `proven` / `expired` gates cannot cite
  sandbox-observation authority or unpromoted `CoordinationFact` /
  `DerivedSummary` records in the transitive evidence chain.

### ADR 0034 direct Evidence subtype enum mirrors

Source: ADR 0034 and ADR 0038 Phase 2.3.1.

`Evidence.schema_version`:

- `0.5.0`

`Evidence.subject_kind` Phase 2.3.1 extensions:

- `git_identity_binding`
- `tool_provenance`

`GitIdentityBinding.payload.git_signing_format_kind`:

- `openpgp`
- `x509`
- `ssh`
- `none`

`GitIdentityBinding.payload.provider_observed_via`:

- `git_config_read`
- `ssh_config_resolution`
- `1password_op_cli_introspection`

`ToolProvenance.payload.install_source_kind`:

- `homebrew`
- `mise`
- `asdf`
- `npm`
- `pip`
- `uv`
- `system_package_manager`
- `manual`
- `unknown`

`ToolProvenance.payload.version_drift_kind`:

- `matches_lockfile`
- `ahead_of_lockfile`
- `behind_lockfile`
- `no_lockfile`
- `unknown`

`ToolProvenance.payload.provider_observed_via`:

- `which_command`
- `shim_introspection`
- `package_manager_query`

Mirror notes:

- `GitIdentityBinding.redaction_mode` excludes `none` per ADR 0034's
  subtype-level redaction floor.
- `GitIdentityBinding.payload.git_signing_key_id` is a typed
  `CredentialSource` FK, not a raw signing-key identifier.
- `ToolProvenance.payload.installed_path` and `shim_chain` paths use canonical
  placeholder-root-with-path or accepted system-root form; raw user paths,
  bare placeholder roots, and temp seeds are not valid payload values.
- The direct subtype schemas preserve the base `Evidence` sandbox-observation
  trace rule. Sandbox-authority subtype records are observations only and do
  not become gate authority without Ring 1 / policy re-checks.
- These two records are direct Evidence subtypes, not `BoundaryObservation`
  payloads.

### ADR 0032 Q-005 runner/check evidence enum mirrors

Source: ADR 0032 and ADR 0038 Phase 2.3.2.

`Evidence.schema_version`:

- `0.6.0`

`Evidence.subject_kind` Phase 2.3.2 extensions:

- `runner_host`
- `runner_isolation`
- `workflow_run`
- `clean_room_smoke`
- `policy_plan`

Existing `Evidence.subject_kind` reused by Phase 2.3.2:

- `resource_budget`

`BoundaryObservation.schema_version`:

- `0.3.0`

`RunnerHostObservation.payload.substrate_kind`:

- `github_hosted`
- `self_hosted_proxmox`
- `self_hosted_macbook`
- `self_hosted_other`

`RunnerHostObservation.payload.repo_access_kind`:

- `public`
- `private`
- `fork_isolated`

`RunnerIsolationObservation.observed_payload.job_environment_kind`:

- `host`
- `container`
- `disposable_vm`

`RunnerIsolationObservation.observed_payload.workspace_cleanup_kind`:

- `always_clean`
- `checkout_clean_only`
- `persistent`

`RunnerIsolationObservation.observed_payload.docker_socket_exposure_kind`:

- `none`
- `host_workflow_only`
- `all_workflows`
- `unknown`

`RunnerIsolationObservation.observed_payload.network_egress_kind`:

- `internet_full`
- `internet_restricted`
- `vpn_only`
- `egress_blocked`

`RunnerIsolationObservation.observed_payload.host_filesystem_access`:

- `isolated`
- `shared_workspace`
- `shared_host`

`WorkflowRunReceipt.payload.conclusion_kind`:

- `success`
- `failure`
- `cancelled`
- `skipped`
- `neutral`
- `timed_out`
- `action_required`

`CleanRoomSmokeReceipt.payload.dependency_install_outcome_kind`:

- `success`
- `failure`

`PolicyPlanReceipt.payload.conftest_outcome_kind`:

- `pass`
- `fail`
- `warn`

`Decision.reason_kind` reservations from ADR 0032:

- `runner_isolation_unverified`
- `runner_substrate_forbidden`
- `status_check_source_required`
- `workflow_run_evidence_drift`
- `policy_plan_outcome_failed`
- `runner_observation_stale_post_deregistration`
- `runner_capability_registration_forbidden`

Mirror notes:

- `RunnerIsolationObservation` is a typed `BoundaryObservation` branch, not a
  direct Evidence payload branch.
- `ResourceBudgetObservation` uses the existing `resource_budget` subject kind
  and feeds the durable `ResourceBudget` entity; it is not a duplicate
  standalone entity.
- `PolicyPlanReceipt.redaction_mode` excludes `none`. The payload carries a
  redacted-plan hash and summary identifiers only; raw plan content is outside
  the strict schema.
- The five forbidden runner families from ADR 0032 are policy/gateway
  vocabulary. These schemas may record forbidden states; they do not enforce
  operation rejection or duplicate Citadel OPA.
- This schema slice does not author a `Decision`, `ApprovalGrant.scope`, GitHub
  runner registration behavior, canonical policy YAML, or Citadel policy.

### ADR 0027/0030/0033 Q-006 source-control evidence enum mirrors

Source: ADR 0027, ADR 0030, ADR 0033, and ADR 0038 Phase 2.3.3.

`Evidence.schema_version`:

- `0.7.0`

`Evidence.subject_kind` Phase 2.3.3 extensions:

- `ruleset`
- `repository_identity_reconciliation`
- `mcp_credential_audience`
- `status_check_source`
- `git_worktree`
- `git_worktree_inventory`
- `git_branch_ancestry`
- `git_dirty_state`
- `pull_request`
- `pull_request_absence`

Existing `Evidence.subject_kind` values reused by Phase 2.3.3:

- `git_repository`
- `git_ref`

`BoundaryObservation.schema_version`:

- `0.4.0`

`BoundaryObservation.boundary_dimension` Phase 2.3.3 extension:

- `branch_protection`

`GitRemoteObservation.payload.ref_kind`:

- `branch`
- `tag`
- `note`
- `replace`
- `stash`
- `bisect`
- `remote_tracking`
- `unknown`

`GitRemoteObservation.payload.last_fetch_outcome`:

- `ok`
- `network_error`
- `auth_error`
- `rejected`

`GitRemoteObservation.payload.ref_state`:

- `present`
- `gone`
- `ambiguous`
- `unknown`

`BranchProtectionObservation.observed_payload.protection_kind`:

- `classic_protection`
- `ruleset`
- `both`
- `none`
- `unknown`

`BranchProtectionObservation.observed_payload.restrictions_*`:

- `blocked`
- `allowed`
- `bypass_only`

`GitWorktreeObservation.payload.worktree_kind`:

- `primary`
- `linked`

`GitWorktreeObservation.payload.lock_state`:

- `unlocked`
- `locked`
- `held_by_other_session`

`GitWorktreeInventoryObservation.payload.inventory_completeness_kind`:

- `complete`
- `partial_with_reason`

`GitWorktreeInventoryObservation.payload.observed_via`:

- `git_worktree_list`

`GitBranchAncestryObservation.payload.ancestry_kind`:

- `ancestry`
- `patch_equivalence`
- `vacuous`

`GitDirtyStateObservation.payload.dirty_state_kind`:

- `clean`
- `dirty_uncommitted`
- `dirty_with_untracked`
- `dirty_with_ignored_only`

`GitDirtyStateObservation.payload.observed_via`:

- `git_status_porcelain`

`PullRequestReceipt.payload.provider_kind` and
`PullRequestAbsenceReceipt.payload.provider_kind`:

- `github`

`PullRequestReceipt.payload.pr_state_kind`:

- `open`
- `merged`
- `closed_unmerged`

`PullRequestReceipt.payload.closed_unmerged_reason_kind`:

- `abandoned`
- `superseded`
- `manual_close`
- `unknown`

`PullRequestReceipt.payload.provider_observed_via`:

- `github_api_v3`
- `github_api_v4`
- `gh_cli`
- `github_mcp`

`PullRequestAbsenceReceipt.payload.query_observed_via`:

- `github_api_v3_pr_search`
- `github_api_v4_pull_requests`
- `gh_pr_list`
- `github_mcp_pr_search`

`GitHubMutationAuthority.authority_kind`:

- `human_pat`
- `github_app`
- `oidc`
- `actions_token`
- `unknown`

`RulesetObservation.payload.ruleset_kind`:

- `branch`
- `tag`
- `push`

`RulesetObservation.payload.enforcement_kind`:

- `active`
- `evaluate`
- `disabled`

`RulesetObservation.payload.provider_observed_via`:

- `github_api_v3_rulesets`
- `github_api_v4_rulesets`
- `gh_cli`
- `github_mcp`

`RepositoryIdentityReconciliationObservation.payload.reconciliation_verdict_kind`:

- `all_planes_consistent`
- `plane_disagreement`

`RepositoryIdentityReconciliationObservation.payload.plane_disagreements`:

- `local_path_mismatch`
- `remote_url_mismatch`
- `ssh_alias_missing`
- `ssh_alias_mismatch`
- `signing_principal_unmapped`
- `signing_principal_mismatch`
- `credential_account_mismatch`
- `credential_account_unverified`
- `organization_mismatch`

`RepositoryIdentityReconciliationObservation.payload.provider_observed_via`:

- `gh_auth_status`
- `git_config_read`
- `ssh_config_resolution`
- `mcp_introspection`

`MCPCredentialAudienceObservation.payload.mcp_server_kind`:

- `github_mcp`

`MCPCredentialAudienceObservation.payload.credential_audience_kind`:

- `read_only`
- `mutation`
- `unscoped`

`MCPCredentialAudienceObservation.payload.credential_scope_tokens`:

- `metadata:read`
- `contents:read`
- `contents:write`
- `pull_requests:read`
- `pull_requests:write`
- `actions:read`
- `actions:write`
- `checks:read`
- `checks:write`
- `administration:read`
- `administration:write`
- `workflows:read`
- `workflows:write`

`MCPCredentialAudienceObservation.payload.query_observed_via`:

- `gh_token_list`
- `github_api_permissions`
- `mcp_introspection`
- `unknown`

`StatusCheckSourceObservation.payload.conclusion_kind`:

- `success`
- `failure`
- `skipped`
- `cancelled`
- `neutral`
- `timed_out`
- `action_required`

`StatusCheckSourceObservation.payload.source_kind`:

- `actions_workflow`
- `github_app`
- `third_party_service`
- `native`

`StatusCheckSourceObservation.payload.provider_observed_via`:

- `github_api_v3_checks`
- `github_api_v4_checkruns`
- `gh_cli`
- `github_mcp`

`Decision.reason_kind` reservations from ADR 0030:

- `worktree_attachment_drift`
- `worktree_inventory_partial`
- `ancestry_proof_invalid`
- `dirty_state_blocks_destructive_op`
- `pr_state_drift`
- `pr_absence_stale`

`Decision.required_grant_kind` reservations from ADR 0030:

- `worktree_clean_acknowledgment`
- `pr_absence_acknowledgment`

`Decision.reason_kind` reservations from ADR 0033:

- `github_mutation_authority_unverified`
- `ruleset_baseline_unmet`
- `repository_identity_mismatch`
- `mcp_credential_audience_mismatch`
- `status_check_source_unverified`
- `status_check_source_app_drift`

Mirror notes:

- `BranchProtectionObservation` is a typed `BoundaryObservation` branch.
  `StatusCheckSourceObservation` is a direct Evidence subtype; ADR 0033
  explicitly rejects a `BoundaryObservation` envelope for it.
- `GitHubMutationAuthority` is an inline value type, not a standalone Ring 0
  entity and not a Q-011 bucket member. It still has a generated reusable JSON
  Schema so future operation-shape / `ApprovalGrant.scope` consumers can cite
  the same value contract.
- `PullRequestReceipt` does not carry `absent`; positive absence is
  `PullRequestAbsenceReceipt`.
- PR titles, bodies, descriptions, review comments, token values, GitHub App
  private keys, PATs, OIDC token bytes, and resolved secret material are
  outside the strict Q-006 payload schemas.
- This schema slice does not author a `Decision`, `ApprovalGrant.scope`,
  canonical policy YAML, GitHub mutation operation, GitHub App provisioning,
  or source-control hook behavior.

### ADR 0037 Q-010 remote-agent evidence enum mirrors

Source: ADR 0037 and ADR 0038 Phase 2.3.4.

`Evidence.schema_version`:

- `0.8.0`

`Evidence.subject_kind` Phase 2.3.4 extensions:

- `remote_agent_base_image`
- `remote_agent_setup`
- `remote_agent_network_posture`

`RemoteAgentBaseImageObservation.payload.base_image_kind`:

- `vendor_runtime`
- `container_image`
- `vm_image`
- `self_hosted_runner_image`
- `unknown`

`RemoteAgentBaseImageObservation.payload.base_image_provenance`:

- `vendor_managed`
- `user_specified`
- `unknown`

`RemoteAgentSetupReceipt.payload.secret_injection_kind`:

- `env_at_setup`
- `env_at_runtime`
- `mounted_secret_volume`
- `brokered_at_request`
- `none_required`

`RemoteAgentNetworkPostureObservation.payload.egress_kind`:

- `none`
- `allowlist_only`
- `proxy_mediated`
- `open`
- `unknown`

`RemoteAgentNetworkPostureObservation.payload.firewall_kind`:

- `none`
- `vendor_managed`
- `user_managed`
- `unknown`

`Decision.reason_kind` reservations from ADR 0037:

- `containment_evidence_absent`
- `containment_evidence_producer_supplied`
- `containment_runtime_capability_exceeded`
- `agent_client_axis_self_asserted`
- `remote_agent_evidence_authority_overreach`
- `non_pr_remote_agent_binding_partial`

Mirror notes:

- The three Q-010 remote-agent records are direct Evidence subtypes, not
  `BoundaryObservation` payloads.
- `RemoteAgentSetupReceipt.secret_injection_kind` had an early mirror under
  the ADR 0037 AgentClient section because ADR 0038 listed it with Phase
  2.1.1. Phase 2.3.4 is the schema consumer that now implements the field.
- Remote-agent records require `authority: derived` and non-null freshness in
  the subtype schemas. Stronger authority requires linked host-observation
  evidence at Ring 1 / policy consumption time.
- Checkout commit identity is outside `RemoteAgentBaseImageObservation`; it
  composes through source-control evidence to avoid duplicate commit facts.
- `RemoteAgentInvocationReceipt` remains a future ADR. Phase 2.3.4 preserves
  the ADR 0037 `(execution_context_id, observed_at window)` binding posture
  without authoring the aggregator.
- This schema slice does not author a `Decision`, `ApprovalGrant.scope`,
  canonical policy YAML, vendor API adapter, remote-agent invocation broker, or
  provider mutation operation.

### ADR 0043 Q-013 credential-plane evidence enum mirrors

Source: ADR 0043.

`Evidence.schema_version`:

- `0.9.0`

`Evidence.subject_kind` Phase 2.7 extension:

- `machine_identity`

`CredentialAuthorityObservation.payload.authority_surface_kind` and
`MachineIdentityBindingObservation.payload.authority_surface_kind`:

- `credential_authority`
- `secret_store`
- `identity_provider`
- `broker`
- `provider_control_plane`
- `local_host`
- `unknown`

`CredentialAuthorityObservation.payload.scope_posture_kind`:

- `least_privilege`
- `bounded`
- `broad`
- `unknown`

`CredentialAuthorityObservation.payload.audience_posture_kind` and
`MachineIdentityBindingObservation.payload.audience_posture_kind`:

- `single_audience`
- `multiple_audience`
- `wildcard`
- `unknown`

`CredentialAuthorityObservation.payload.expiry_posture_kind` and
`MachineIdentityBindingObservation.payload.expiry_posture_kind`:

- `expires`
- `non_expiring`
- `unknown`

`CredentialAuthorityObservation.payload.rotation_posture_kind` and
`MachineIdentityBindingObservation.payload.rotation_posture_kind`:

- `rotating`
- `manual`
- `not_observed`
- `unknown`

`CredentialAuthorityObservation.payload.auditability_kind`:

- `audit_log_available`
- `audit_log_partial`
- `not_observed`
- `unknown`

`MachineIdentityBindingObservation.payload.machine_identity_kind`:

- `provider_principal`
- `federated_subject`
- `runner_principal`

`MachineIdentityBindingObservation.payload.issuer_posture_kind`:

- `platform_native`
- `federated`
- `service_account`
- `runner_registration`
- `unknown`

`MachineIdentityBindingObservation.payload.binding_status_kind`:

- `observed_bound`
- `observed_absent`
- `contradictory`
- `unknown`

Mirror notes:

- `CredentialAuthorityObservation` reuses existing `subject_kind:
  "credential_source"` and does not add a credential-authority subject kind.
- `MachineIdentityBindingObservation` requires both `machine_identity` and
  `credential_source` subject refs. The subject kind names the nonhuman
  identity subject, not the evidence envelope.
- `machine_identity_ref` is kind-tagged by `machine_identity_kind`, uses
  `entityIdSchema`-compatible reference form, and never carries token, private
  key, provider item body, assertion, JWT body, recovery code, or human
  SSH-agent state.
- Credential-plane records require a non-`none` `redaction_mode`. The Zod
  schemas also reject common JWT-shaped `machine_identity_ref` values; future
  Ring 1 minting must still run the secret-shape scrubber because generated
  JSON Schema cannot encode every semantic secret pattern.
- Generated JSON Schema is not sufficient by itself for Q-013 target binding.
  Subject-ref-to-payload and `execution_context_id` matching are enforced by
  Zod refinements and must be preserved at the mint API.
- `CredentialRuntimeInjectionReceipt`, `CredentialReconcilerReceipt`,
  `CredentialIssuanceReceipt`, `RemoteMutationReceipt`, `ApprovalGrant.scope`,
  `QualityGate.gate_kind`, `allowed_for_gate`, canonical policy YAML,
  broker/runtime behavior, provider mutation, and operation registration remain
  outside this schema slice.

### ADR 0044 Q-014 project-substrate evidence enum mirrors

Source: ADR 0044.

`KnowledgeSource.source_kind` Phase 2.7 extension:

- `project_substrate_contract`

`BoundaryObservation.schema_version`:

- `0.5.0`

`BoundaryObservation.boundary_dimension` Phase 2.7 extension:

- `project_admission_authority`

`ProjectSubstrateContractValidationReceipt.payload.validation_outcome_kind`:

- `valid`
- `invalid`
- `warning`
- `unknown`

`ProjectSubstrateContractValidationReceipt.payload.secret_reference_posture_kind`:

- `none_observed`
- `reference_only`
- `resolved_secret_detected`
- `unknown`

`ProjectSubstrateAdmissionObservation.payload.contract_lifecycle_status` and
`ProjectAdmissionAuthorityObservation.observed_payload.observed_lifecycle_status`:

- `draft`
- `accepted`
- `provisionable`
- `active`
- `suspended`
- `retired`
- `unknown`

`ProjectSubstrateAdmissionObservation.payload.admission_state_kind`:

- `observed_admissible`
- `observed_not_admissible`
- `pending`
- `suspended`
- `retired`
- `unknown`

`ProjectAdmissionAuthorityObservation.observed_payload.approval_status_kind`:

- `asserted_approved`
- `asserted_not_approved`
- `not_observed`
- `contradictory`
- `unknown`

`ProjectTeardownPlanReceipt.payload.teardown_scope_kind`:

- `full_project`
- `partial_resource`
- `unknown`

`ProjectTeardownPlanReceipt.payload.retention_expectation_kind`:

- `delete`
- `retain`
- `tombstone`
- `mixed`
- `unknown`

`ProjectTeardownPlanReceipt.payload.data_minimization_posture_kind`:

- `minimal`
- `bounded`
- `not_observed`
- `unknown`

`ProjectTeardownCompletionReceipt.payload.completion_state_kind`:

- `completed`
- `partially_completed`
- `failed`
- `unknown`

`ProjectTeardownCompletionReceipt.payload.residual_risk_kind`:

- `none`
- `accepted`
- `present`
- `unknown`

`ProjectTeardownCompletionReceipt.payload.tombstone_state_kind`:

- `not_applicable`
- `tombstone_recorded`
- `retained_until_expiry`
- `unknown`

Mirror notes:

- Q-014 direct evidence records reuse `workspace` and `knowledge_source`
  subject kinds. This schema slice does not widen base `Evidence.subject_kind`
  and therefore does not bump `Evidence.schema_version`.
- `project_admission_authority` is a typed `BoundaryObservation` branch with
  `workspace_id` as the primary target. `knowledge_source_id` and
  `contract_content_hash` are typed payload fields, not new envelope targets.
- Contract lifecycle status is producer-asserted evidence input, not
  `QualityGate.gate_state` or HCS authorization by itself.
- `guardian_approval`-style source facts are modeled as admission authority
  evidence and may be cited by future operation-specific `ApprovalGrant`
  records. They are not `ApprovalGrant` records directly.
- The Zod schemas enforce structural/reference/hash/provenance/no-secret
  constraints only. Runtime/live validators, OPA policy, canonical policy
  YAML, `QualityGate.gate_kind`, `ApprovalGrant.scope`, `allowed_for_gate`,
  broker/runtime behavior, provider mutation, runner registration, project
  workload provisioning, and backup readiness remain outside this schema
  slice.
- Sandbox-authority contract validation receipts are parser observations only.
  Sandbox observations cannot satisfy admission readiness, deletion authority,
  teardown completion, or gate authority.

### ADR 0045 Q-015 backup-readiness evidence enum mirrors

Source: ADR 0045.

`KnowledgeSource.source_kind` Phase 2.7 extension:

- `threat_model`

`KnowledgeSource.schema_version`:

- `0.2.0`

`BackupReadinessObservation.payload.storage_class_kind` and
`ProjectSubstrateBackupRequirementObservation.payload.required_storage_class_kind`:

- `object_store`
- `nfs_backup_target`
- `vps_native_snapshot`
- `backup_repository`
- `filesystem_snapshot`
- `unknown`

`BackupReadinessObservation.payload.readiness_state_kind` and
`ProjectSubstrateBackupRequirementObservation.payload.required_readiness_state_kind`:

- `pending`
- `configured`
- `usable`
- `ready`
- `expired`
- `unknown`

`BackupReadinessObservation.payload.tombstone_state_kind`:

- `not_tombstoned`
- `tombstoned`
- `unknown`

`RestoreDrillReceipt.payload.drill_result_kind`:

- `succeeded`
- `failed`
- `partial`
- `unknown`

`RestoreDrillReceipt.payload.boot_verification_kind` and
`RestoreDrillReceipt.payload.service_verification_kind`:

- `verified`
- `failed`
- `not_observed`
- `unknown`

`RestoreDrillReceipt.payload.cleanup_disposition_kind`:

- `cleanup_completed`
- `cleanup_pending`
- `retained_for_review`
- `unknown`

`BackupCredentialCustodyObservation.payload.custody_posture_kind`:

- `reference_only`
- `brokered_runtime_read`
- `break_glass_only`
- `not_observed`
- `unknown`

`BackupCredentialCustodyObservation.payload.expiry_posture_kind`:

- `expires`
- `non_expiring`
- `unknown`

`BackupCredentialCustodyObservation.payload.rotation_posture_kind`:

- `rotating`
- `manual`
- `not_observed`
- `unknown`

`BackupCredentialCustodyObservation.payload.auditability_kind`:

- `audit_log_available`
- `audit_log_partial`
- `not_observed`
- `unknown`

`ProjectSubstrateBackupRequirementObservation.payload.persistent_data_kind`:

- `persistent_data_present`
- `no_persistent_data`
- `disposable_rebuildable`
- `unknown`

`ProjectSubstrateBackupRequirementObservation.payload.data_minimization_posture_kind`:

- `minimal`
- `bounded`
- `not_observed`
- `unknown`

`ProjectSubstrateBackupRequirementObservation.payload.retention_expectation_kind`:

- `retain`
- `delete_after_expiry`
- `tombstone`
- `mixed`
- `unknown`

`ProjectSubstrateBackupRequirementObservation.payload.teardown_expectation_kind`:

- `teardown_required`
- `not_required`
- `unknown`

`RestoreDrillReceipt.payload.*_ref.target_kind` and
`BackupCredentialCustodyObservation.payload.backup_surface_ref.target_kind`:

- `workspace`
- `provider_object`
- `external_control_plane`
- `unknown`

Mirror notes:

- Q-015 direct evidence records reuse existing `workspace`,
  `provider_object`, `external_control_plane`, `credential_source`, and
  `knowledge_source` subject kinds. This schema slice does not widen base
  `Evidence.subject_kind` and therefore does not bump
  `Evidence.schema_version`.
- `BackupReadinessObservation` is a direct Evidence subtype, not a
  `BoundaryObservation` branch and not a standalone `StorageClassReadiness`
  entity.
- `ready` requires typed, freshness-bearing restore-drill receipt evidence
  refs and `not_tombstoned`; `configured`, `usable`, `expired`, and
  `unknown` are not gate authority by themselves.
- Q-015 proof-bearing nested evidence refs exclude `sandbox-observation`,
  require non-null `valid_until` and `parser_version`, and require
  `payload_schema_version` where a specific Q-013/Q-014/Q-015 subtype is the
  load-bearing referenced record.
- Backup-operation and monitoring evidence refs are references to separately
  accepted upstream/external evidence if present. ADR 0045 does not accept a
  Q-015 backup execution receipt or monitoring entity.
- `RestoreDrillReceipt.restored_environment_ref` is a typed reference only;
  restored payloads, dumps, environment values, secret material, and raw data
  samples are not schema fields.
- `BackupCredentialCustodyObservation.break_glass_recovery_path_source_ref`
  is a `KnowledgeSource` reference. Recovery procedures, recovery codes,
  provider item bodies, token fragments, shell history, and resolved secret
  material are not schema fields.
- `ProjectSubstrateBackupRequirementObservation` records contract requirement
  evidence only. It is not project admission, `QualityGate.gate_kind`,
  `ApprovalGrant.scope`, `allowed_for_gate`, or policy behavior.

### Self-approval rejection rule

ADDED by ADR 0054 (D-043) as a discrete registry section per ADR 0051 v4
change-set item 7 intent. Prior to ADR 0054, the rule lived only as
narrative mentions inside §ADR 0049–0053 foundational Ring 0 entity field
authority subsection and §ADR 0049–0053 foundational Ring 0 entity enum
mirrors section. ADR 0054 promotes the rule to a discoverable discrete
section per architect + policy reviewer convergence.

**Rule.** At Ring 1 mint API, an `ApprovalGrant` consume request is
rejected when:

```
ApprovalGrant.grantor_principal_ref == consuming_session.principal_id
```

AND the grant's underlying `OperationShape.operation_class` is in the
**non-readonly set** `{destructive_git, external_control_plane_mutation,
worktree_mutation, merge_or_push, cleanup_plan}`. Self-approval IS
permitted when the underlying `operation_class` is in the **readonly
set** `{read_only_diagnostic, agent_internal_state, workspace_verify}`
(no-op-strength operations; an agent acknowledging its own diagnostic-
tier observation is not a substrate-state escalation).

**Comparison form (post-ADR 0054 typed-FK closure).** The comparison is
**UUID-byte-equality** on `principal_id` surface IDs (mirrors ADR 0052
§Identity comparison form for session_id). Both
`ApprovalGrant.grantor_principal_ref` and `Session.principal_id` (when
Session lands) are `entityIdSchema`-typed FKs to Principal.

**Principal-id canonicalization-at-mint recipe (ADR 0054 v2).** When
`kernel_principal_resolver` mints a Principal record, the `principal_id`
surface ID is canonicalized via this 4-step recipe BEFORE insertion:

1. **Unicode NFC normalization**
2. **Unicode general-category `Cf` (Format Control) strip** — removes
   ALL characters in Unicode `Cf` category including ZWSP (U+200B),
   ZWNJ (U+200C), ZWJ (U+200D), LRM/RLM (U+200E/U+200F), word joiner
   (U+2060), invisible operators (U+2062-U+2064), LRI/RLI/FSI/PDI
   (U+2066-U+2069), BOM (U+FEFF), interlinear annotation anchors
   (U+FFF9-U+FFFB), soft-hyphen (U+00AD), Arabic format controls
   (U+0600-U+0605, U+061C, U+06DD, U+070F, U+0890-U+0891, U+08E2),
   Mongolian vowel separator (U+180E), bidirectional controls
   (U+202A-U+202E), and supplementary-plane Cf characters
3. **Unicode-aware lowercase fold** (per Unicode case-folding tables;
   not ASCII tolower)
4. **Leading/trailing-whitespace trim** (Unicode `\p{White_Space}`
   category) ONLY. Embedded whitespace produces a structurally-distinct
   principal_id by design.

The Cf-strip step **structurally closes** the ADR 0051 v4 §Self-approval
rejection MT-Sec-2 zero-width-character evasion class. Closure happens
at MINT, not at COMPARE: the FK-equality comparison consumes already-
canonicalized surface IDs, so byte-equality is sufficient.

**Ring 1 mint API enforcement commitment.** The rule lives at Ring 1
mint API (`packages/kernel/src/mint/` per workflow-sequencing
investigation §Step 4). Rejection emits `Decision.reason_kind:
'self_approval_rejected'` (already in §Decision.reason_kind status
table; reservation from ADR 0051 v4).

**Future amendments**:

- **Unicode TR39 confusable defense** (security N2 v2 of ADR 0054) —
  reserves a future amendment to commit one of: (a) TR39 skeleton
  normalization as a step 2.5 in the canonicalization recipe; (b)
  ASCII-only restriction on principal_id surface IDs; (c) hybrid
  posture with bilingual identity binding. v2 closes the invisibles
  surface; homoglyph attacks (ASCII vs Cyrillic `а`, etc.) remain a
  posture limitation until that future ADR lands.
- **Unicode version pinning** (security N1 v2 of ADR 0054) — reserves
  a future amendment to commit an explicit Unicode version pinning
  rule if platform-inherited version becomes insufficient.

**Cross-references**:

- ADR 0051 v4 §Rejects §Self-approval rejection (original rule
  commitment + MT-Sec-2 v1 string-comparison posture acknowledgment)
- ADR 0054 §Decision §Cross-record commitments deferred to Ring 1 mint
  API §3 (typed-FK closure + canonicalization recipe details)
- ADR 0054 §Compliance §Principal-id canonicalization rule (4-step
  recipe with `Cf`-category strip)
- §Decision.reason_kind status table (`self_approval_rejected`
  registry-canonical reservation pending Ring 1 mint API Zod lift)

### ADR 0049–0055 foundational Ring 0 entity enum mirrors

The 2026-05-10 workflow-sequencing investigation §Step 1 landed five
foundational Ring 0 entities (`Decision`, `WorkspaceContext`, `ApprovalGrant`,
`Lease`, `Run`) via ADRs 0049 through 0053 (D-037 through D-041); ADR 0054 /
D-043 (2026-05-11) added **Principal** as the sixth foundational entity (Step 3
entity #1 of 2 highest-coupling — first entity drafted post-Step-1-source-
landing); ADR 0055 / D-044 (2026-05-11) added **Session** as the seventh
foundational entity (Step 3 entity #2 of 2 highest-coupling — closes 4
forward-reference typed FK targets in the just-landed Step 1 train).
Each entity ships its own `*SchemaVersionSchema = z.literal('0.1.0')`
literal so version bumps stay per-entity. Cross-record refinements
(execution-context binding equality, lease uniqueness, producer-disjointness,
gateway re-derive, self-approval rejection, valid_until inheritance,
revoke-wins race tiebreaker, sandbox-acquire rejection, authorizing-Decision
outcome verification, principal-binding-evidence verification, synthetic-
identity rejection, Session FK liveness verification + cross-context
binding equality enforcement at consuming-record mint) live at Ring 1
mint API per §Cross-context enforcement layer §Schema validation alone
is not an enforcement layer.

The four authorization envelopes (Decision, ApprovalGrant, Lease, Run) commit
an envelope-level Zod `superRefine` that mirrors `qualityGateSchema`'s
chain-walk rejection on `evidence_refs` (and, for ApprovalGrant, scope-payload
acknowledged_* refs). WorkspaceContext + Principal + Session do not carry the
chain-walk superRefine; all three are typed-identity envelopes mirroring
AgentClient.

**Canonical-concatenation length-prefix discipline** (ADR 0051 v4 retroactive
posture rule, extended to ADRs 0049/0050/0051/0052/0053/0054/0055 by ADR 0055):
the `||` operator in any `audit_chain_link_hash` canonical-concatenation
expression denotes length-prefix-encoded concatenation (each variable-length
field encoded as `varint(byte_length) || field_bytes`). Defends against the
concatenation-collision attack class. `'' for null` substitution applies to
nullable hash-input fields. `schema_version` is excluded from the canonical
concatenation per the jointly-committed posture.

#### `Decision.outcome` enum mirror (ADR 0049)

```
allow | deny | informational
```

`informational` supports non-blocking flag events. `deny`-only `reason_kind`
values reject when paired with `informational` per the outcome-compatibility
refinement (closes audit-chain-launder surface).

#### `Decision.decided_by` allowlist (ADR 0049)

```
mint_api | kernel_broker | kernel_gateway
```

`kernel_gateway` is NEW from ADR 0049 (gateway re-derive emits Decisions
without minting Grants/Leases/Runs).

#### `Decision.reason_kind` status table (after ADRs 0049–0058)

18 Zod-defined values from ADRs 0049, 0056, and 0058 + 20 registry-canonical
reservations from ADRs 0051 v4 (5 remaining), 0052 (6), 0053 (5), and
0055 (4); 38 total. Future schema PRs Zod-lift the remaining reservations
alongside the Ring 1 service or schema that consumes each.

| Value | Source ADR | State | Outcome compatibility |
|---|---|---|---|
| `coordination_promotion_no_layer1_grounding` | 0036 / 0049 | Zod-defined | deny-only |
| `deletion_authority_kind_ref_mismatch` | 0036 / 0049 | Zod-defined | deny-only |
| `cleanup_plan_authority_source_stale` | 0047 / 0049 | Zod-defined | deny-only |
| `cleanup_plan_target_under_active_lease` | 0047 / 0049 | Zod-defined | deny-only |
| `worktree_lease_held_by_other_session` | 0031 / 0049 + 0052 | Zod-defined | deny-only |
| `operation_class_unregistered` | 0029 / 0056 | Zod-defined | deny-only |
| `gate_provisional` | 0035 / 0049 | Zod-defined | informational-only |
| `gate_denied` | 0035 / 0049 | Zod-defined | deny-only |
| `gate_expired` | 0035 / 0049 | Zod-defined | deny-only |
| `gate_evidence_insufficient` | 0035 / 0049 | Zod-defined | deny-only |
| `gate_target_already_active` | 0035 / 0049 | Zod-defined | deny-only |
| `gate_evidence_stale_reuse` | 0035 / 0049 | Zod-defined | deny-only |
| `agent_client_axis_self_asserted` | 0037 / 0049 | Zod-defined | deny-only |
| `containment_evidence_absent` | 0037 / 0049 | Zod-defined | deny-only |
| `containment_evidence_producer_supplied` | 0037 / 0049 | Zod-defined | deny-only |
| `containment_runtime_capability_exceeded` | 0037 / 0049 | Zod-defined | deny-only |
| `grant_expired_at_consumption` | 0051 v4 | registry-canonical | deny-only |
| `producer_disjointness_violation` | 0051 v4 (+ 0052, 0053 extensions) | registry-canonical | deny-only |
| `consume_after_revoke_attempt` | 0051 v4 | registry-canonical | informational-only |
| `required_grant_kind_unmet` | 0051 v4 | registry-canonical | deny-only |
| `self_approval_rejected` | 0051 v4 | registry-canonical | deny-only |
| `audit_chain_corruption_detected` | 0051 v4 / 0056 | Zod-defined | deny-only |
| `authority_chain_walk_depth_exceeded` | 0057 / 0058 (D-053) | Zod-defined | deny-only |
| `worktree_lease_expired_during_mutation` | 0031 / 0052 | registry-canonical | deny-only |
| `worktree_not_in_workspace_context` | 0031 / 0052 | registry-canonical | deny-only |
| `lease_acquire_sandbox_rejected` | 0031 / 0052 (Sec-F) | registry-canonical | deny-only |
| `lease_release_unauthorized` | 0031 / 0052 (Sec-H) | registry-canonical | deny-only |
| `lease_producer_assertion_unverifiable` | 0052 | registry-canonical | deny-only |
| `coordination_fact_worktree_drift` | 0031 (pre-0052) | registry-canonical | deny-only |
| `run_execution_context_unresolvable` | 0053 | registry-canonical | deny-only |
| `run_authorizing_decision_unresolvable` | 0053 | registry-canonical | deny-only |
| `run_invoker_session_mismatch` | 0053 | registry-canonical | deny-only |
| `run_terminal_state_mutation_attempt` | 0053 | registry-canonical | deny-only |
| `run_started_at_after_ended_at` | 0053 | registry-canonical | deny-only |
| `session_agent_client_unresolvable` | 0055 | registry-canonical | deny-only |
| `session_principal_unresolvable` | 0055 | registry-canonical | deny-only |
| `session_execution_context_unresolvable` | 0055 | registry-canonical | deny-only |
| `session_started_at_after_ended_at` | 0055 | registry-canonical | deny-only |

ADR 0056 makes `operation_class_unregistered` non-clearable:
`required_grant_kind` must be `null`, and any non-null grant kind rejects.
`Decision.operation_shape_ref` remains required for that reason kind; no
nullable or sentinel OperationShape is authorized.

ADR 0058 makes `authority_chain_walk_depth_exceeded` non-clearable:
`required_grant_kind` must be `null`, and any non-null grant kind rejects.
Producer scope is reason-specific: only `mint_api` and `kernel_broker` may
emit it; `kernel_gateway` is excluded despite the general
`Decision.decided_by` allowlist until a future gateway ADR accepts equivalent
bounded-walk semantics. Typed Decision emission also requires a valid
`operation_shape_ref`; non-operation mint overflows and pure chain-validation
overflows remain on the audit rejection path without typed Decision emission.

#### Procedure for adding a new `Decision.reason_kind` value (ADR 0049)

1. Cite the source ADR / charter rule that the reason_kind enforces.
2. Classify outcome compatibility: deny-only, informational-only, or
   `'either'` with a documented consumer for each variant.
3. Update §Decision.reason_kind status table (Zod-defined vs
   registry-canonical) at the same change-set.
4. Pass `hcs-ontology-reviewer` (always); `hcs-policy-reviewer` if the
   reason_kind classifies operations or gates; `hcs-security-reviewer` if the
   reason_kind touches authority-discipline boundaries; `hcs-architect`
   always.

#### `WorkspaceContext` envelope (ADR 0050)

- **Authority posture**: envelope-level kernel-set with two field-level
  exceptions per ADR 0031 v1 §Authority discipline — `repository_id` and
  `worktree_path` are producer-asserted, kernel-verifiable. All other fields
  are kernel-set.
- **Producer**: `workspaceContextProducerSchema = z.enum(['kernel_workspace_diagnose'])`
  (named enum schema chosen over `z.literal` per ADR 0050 v3 to anticipate
  forward-compatible allowlist widening).
- **Lifecycle**: `workspace_context_state` is `active | retired`;
  supersession-via-evidence_refs. Same-record refinement enforces
  `valid_until == null` ↔ `state == 'active'`.
- **Cross-context binding**: `execution_context_id` is the kernel-set FK
  the Layer 1 mint API checks for `Lease` acquire equality per ADR 0031 v1
  Mechanical Tweak #8 / Security-C.

#### `ApprovalGrant.grant_kind` enum mirror (ADR 0051 v4)

```
gate_evidence_acknowledgment | worktree_clean_acknowledgment | pr_absence_acknowledgment
```

Closes all three registry §Decision.required_grant_kind reservations from
ADRs 0030 + 0035. The `approvalGrantKindSchema` Zod source is re-used by
`Decision.required_grant_kind` (single source of truth; no enum drift).

| grant_kind | operation_class_scope (documentation) | Source ADR |
|---|---|---|
| `gate_evidence_acknowledgment` | union of `qualityGateOperationClassSchema` values | 0035 |
| `worktree_clean_acknowledgment` | `destructive_git` | 0030 |
| `pr_absence_acknowledgment` | `destructive_git` | 0030 |

`operation_class_scope` is reviewer-discretion documentation; the structural
defense for forbidden-tier non-escalability (charter inv. 6) lives upstream at
`OperationShape.operation_class` enum closure (8-value closed enum, no
`'forbidden'` value) + canonical policy YAML (Phase 2.5 / system-config).

#### `ApprovalGrant.grant_state` enum mirror (ADR 0051 v4)

```
active | consumed | expired | revoked
```

#### `ApprovalGrant.granted_by` allowlist (ADR 0051 v4)

```
mint_api | kernel_broker
```

`kernel_gateway` intentionally excluded (gateway re-derive does not mint
grants; gateway-decided Decisions inherit the gateway non-escalability
layer). `kernel_dashboard` deferred to its own producer ADR coordinated
change-set (which also re-introduces pre-emptive grants via nullable
`minted_for_decision_id`).

#### Procedure for adding a new `ApprovalGrant.grant_kind` value (ADR 0051 v4)

1. Cite the source ADR / charter rule the grant_kind enforces.
2. Identify `operation_class_scope` (which `OperationShape.operation_class`
   values the grant can clear); confirm no `forbidden`-tier clearing path
   opens (anchored to the enum closure).
3. Classify outcome compatibility for any paired Decision.reason_kind
   reservations (deny-only / informational-only / either).
4. Declare single-use semantics + lifecycle transitions.
5. Commit the typed scope shape (discriminated union branch); use
   `qualityGateEvidenceRefSchema` for chain-aware preview; extend the
   `approvalGrantSchema` envelope-level superRefine to walk the new
   branch's evidence refs.
6. Update §ApprovalGrant.grant_kind status table + paired
   reason_kind reservations at the same change-set.
7. Pass `hcs-ontology-reviewer`, `hcs-policy-reviewer`,
   `hcs-security-reviewer`, `hcs-architect` (all four required).

#### `Lease.lease_kind` status table (ADR 0052)

| lease_kind | State | operation_class_scope (documentation) | Sandbox-acquire posture | Phase 1 valid_until ceiling |
|---|---|---|---|---|
| `worktree` | Zod-defined v1 | `{worktree_mutation, destructive_git, merge_or_push}` | blocked (charter inv. 8 / ADR 0031 v1 Security-F; rejection emits `lease_acquire_sandbox_rejected`) | 24h past `acquired_at` |
| `credential_audience` | registry-canonical (ADR 0031 v1 §Out of scope) | TBD | TBD (future schema PR MUST commit "blocked" or "permitted with rationale" per §Procedure step 5) | TBD |
| `external_target` | registry-canonical (ADR 0031 v1 §Out of scope) | TBD | TBD (future schema PR MUST commit "blocked" or "permitted with rationale" per §Procedure step 5) | TBD |

#### `Lease.lease_state` enum mirror (ADR 0052)

```
active | expired | released | force_broken
```

#### `Lease.acquired_by` allowlist (ADR 0052)

```
mint_api | kernel_broker
```

`kernel_gateway` excluded by design (gateway re-derive does not mint leases).

#### Worktree-lease cardinality discipline (ADR 0052 / ADR 0031 v1 Mechanical Tweak #6 / Security-G)

For `lease_kind: 'worktree'`, at most one `active` Lease per
`(repository_id, canonical(worktree_path))`. Layer 1 mint API enforces via
atomic insert with unique constraint on `(repository_id,
canonical(worktree_path), lease_state == 'active')`. TOCTOU defense:
check-then-insert is non-conformant; atomic-insert-then-on-conflict is
required.

#### Force-break separation of duties (ADR 0052 / ADR 0031 v1 Security-H)

Layer 1 mint API rejects force-break grants whose minter equals the target
lease's `held_by_session_id`. Phase 1 interim posture: force-break grants are
human-dashboard-minted only (not agent-mintable). The
`worktree_lease_force_break_acknowledgment` grant_kind extension is deferred
to the future `kernel_dashboard` producer ADR coordinated change-set (which
also re-introduces pre-emptive grants).

#### Procedure for adding a new `Lease.lease_kind` value (ADR 0052)

1. Cite the source ADR / charter rule the lease_kind enforces.
2. Identify `operation_class_scope` (anchored to the OperationShape enum
   closure for forbidden-tier defense).
3. Commit the typed scope shape; extend the `leaseSchema` envelope-level
   superRefine to walk any scope-payload evidence refs (mirror of ADR 0051
   v4 ApprovalGrant precedent — ADR 0052 MT-4 forward-look).
4. Commit per-`lease_kind` cardinality discipline (1:1 with target resource,
   or other shape).
5. Commit per-`lease_kind` sandbox-acquire rule explicitly: "blocked" OR
   "permitted with rationale". "No sandbox-acquire rule" is NOT a valid
   §Procedure outcome (ADR 0052 MT-5).
6. Commit per-`lease_kind` `valid_until` ceiling (Phase 1 default for
   worktree is 24h).
7. Update §Lease.lease_kind status table at the same change-set.
8. Pass `hcs-ontology-reviewer`, `hcs-policy-reviewer`,
   `hcs-security-reviewer`, `hcs-architect` (all four required).

#### `Run.run_kind` status table (ADR 0053)

| run_kind | State | Authorizing Decision | Invoker | operation_class_scope (documentation) |
|---|---|---|---|---|
| `operation_execution` | Zod-defined v1 | required (`outcome: 'allow'`) | session-invoker required | any of 8 `OperationShape.operation_class` values |
| `system_task` | registry-canonical | TBD per future ADR | TBD per future ADR | TBD |
| `diagnostic` | registry-canonical | TBD per future ADR | TBD per future ADR | TBD |

#### `Run.run_state` enum mirror (ADR 0053)

```
active | succeeded | failed | aborted | timeout
```

5 values total: 1 active + 4 terminal. Same-record refinement enforces
`ended_at == null` ↔ `run_state == 'active'` and `ended_at != null` ↔
terminal state.

#### `Run.recorded_by` allowlist (ADR 0053)

```
mint_api | kernel_broker
```

`kernel_gateway` excluded by design (gateway re-derive does not record Runs).

#### `Evidence.run_id` typed FK target (ADR 0053)

Closes the long-pending typed FK target referenced by 12 Phase 2 evidence
subtypes (`credential-plane-evidence`, `backup-readiness-evidence`,
`clean-room-smoke-receipt`, `project-substrate-evidence`,
`runner-host-observation`, `resource-budget-observation`,
`remote-agent-evidence`, `tool-provenance`, `source-control-evidence`,
`git-identity-binding`, `policy-plan-receipt`, `workflow-run-receipt`) plus
the `Evidence` base envelope's `run_id` field at `evidence.ts:114` and `:138`.
ADR 0053 does NOT modify `evidenceSubjectKindSchema` (`'run'` was already
Zod-defined at `evidence.ts:39`) and does NOT bump `Evidence.schema_version`;
the FK shape was already producer-asserted `entityIdSchema`.

Charter inv. 18 §Run-forbidden-in-derived_from rule remains unchanged: Run
records cannot be cited as authority for DerivedSummary promotion. The
`runSchema` envelope-level superRefine applies inv. 18 chain-walk rejection
to Run's own `evidence_refs`.

Charter inv. 17 §Forbidden patterns clause (charter v1.3.1 line 138)
operationalizes Run execution-context traceability: emitting a Run whose
execution context cannot be traced to a Ring 0 `ExecutionContext` is
forbidden. Closed structurally via kernel-set `Run.execution_context_id` +
Ring 1 mint API verification of ExecutionContext resolution +
`run_execution_context_unresolvable` reason_kind.

#### Procedure for adding a new `Run.run_kind` value (ADR 0053)

1. Cite the source ADR / charter rule the run_kind enforces.
2. Identify `operation_class_scope` (or commit "no operation_class binding"
   for kernel-initiated run_kinds).
3a. Commit the typed scope shape.
3b. Commit envelope-level superRefine chain-walk extension for any scope
   branch's evidence refs (per ADR 0052 MT-4 forward-look; committing only
   the shape without the walk extension would silently lose inv. 18
   enforcement).
4. Commit authorizing-Decision requirement (required vs not; valid outcomes).
5. Commit invoker requirement (session-invoker vs kernel-as-invoker).
6. Commit sandbox-execution rule explicitly: "blocked" OR "permitted with
   rationale". "No sandbox-execution rule" is NOT a valid §Procedure outcome
   (ADR 0052 MT-5 / ADR 0053 forward-look).
7. Commit terminal-state set (v1 `operation_execution`: `{succeeded, failed,
   aborted, timeout}`; future run_kinds may narrow or extend).
8. Update §Run.run_kind status table at the same change-set.
9. Pass `hcs-ontology-reviewer`, `hcs-policy-reviewer`,
   `hcs-security-reviewer`, `hcs-architect` (all four required).

#### D-037 producer-disjointness rule (ADRs 0049 + 0051 v4 + 0052 + 0053)

A `Decision` with non-null `required_grant_kind` MUST NOT be satisfied by an
`ApprovalGrant` whose `granted_by` producer class equals the `Decision.decided_by`
producer class. Extended to:

- **Lease-acquire** (ADR 0052): a Lease MUST NOT be acquired by a producer
  class equal to the `Decision.decided_by` of the Decision authorizing the
  underlying operation when both records share a chain-relation.
- **Run-record** (ADR 0053): a Run MUST NOT be recorded by a producer class
  equal to the `Decision.decided_by` of the `authorizing_decision_id`-
  referenced Decision when both records share a chain-relation.

Producer equality is checked by class identity, not by delegation chain.
Ring 1 mint API enforces by walking the `derived_from` closure (walk-depth
budget ≤ 64 records; cycle-rejection via
`audit_chain_corruption_detected`). Both the same-step rule (ADR 0049) and
the cross-step extension (ADR 0051 v4) survive as facets of the same
disjointness invariant.

#### `Principal.principal_kind` status table (ADR 0054)

| principal_kind | State | Binding-evidence source | Authority-binding posture |
|---|---|---|---|
| `human` | Zod-defined v1 | `GitIdentityBinding` (signed-commit-author per ADR 0036 §Sub-decision (d) future Q-row); future binding-evidence subtypes via §Procedure rule | host-observation-grounded (signed-commit verification); synthetic-identity rejection at Ring 1 mint per ADR 0019 v3 + ADR 0036 §Layer 1 grounding requirement |
| `service_principal` | Zod-defined v1 | `MachineIdentityBindingObservation` (provider/federated/runner principal per ADR 0043) | host-observation-grounded via MachineIdentityBindingObservation; synthetic-identity rejection at Ring 1 mint |
| `pseudo_principal` | registry-canonical (ADR 0054 reservation) | cycle-history.md ratification verifier-identity per ADR 0036 future Q-row | TBD (future ADR commits resolution rule + authority-binding posture per §Procedure rule) |
| `system_principal` | registry-canonical (ADR 0054 reservation) | kernel-emitted-record attribution (e.g., automated retention/cleanup audit events) | TBD (future ADR commits §Procedure rule + `principal_attribution_unresolvable` reason_kind reservation per ADR 0054 §Future amendments) |

#### `Principal.principal_state` enum mirror (ADR 0054)

```
active | retired
```

#### `Principal.producer` allowlist (ADR 0054)

```
kernel_principal_resolver
```

NEW kernel-trusted producer added per ADR 0054 mirroring ADR 0037
`kernel_agent_client_resolver` precedent. `kernel_dashboard` deferred to
coordinated future ADR per ADRs 0051 v4 / 0052 / 0053 / 0054 scope
discipline.

#### Procedure for adding a new `Principal.principal_kind` value (ADR 0054)

1. Cite the source ADR / charter rule that the principal_kind enforces.
2. **Identify the binding-evidence source**: list the Evidence subtype(s)
   (e.g., `GitIdentityBinding`, `MachineIdentityBindingObservation`,
   future binding-evidence subtypes) whose records bind this kind. The
   §Procedure step also commits the schema-PR coordination — extending
   `Principal.principal_kind` requires a coordinated schema PR + future
   binding-evidence subtype ADR if the existing subtypes don't cover the
   new kind.
3. **Classify authority-binding posture**: host-observation-grounded vs
   derived vs human-observed. Commit the synthetic-identity rejection
   rule per ADR 0019 v3 §Chain-promotion rule + ADR 0036 §Layer 1
   grounding requirement.
4. **Commit lifecycle transitions** (default: same `active | retired`
   pattern; new principal_kinds may extend if needed).
5. Update §Principal.principal_kind status table (Zod-defined vs
   registry-canonical, with binding-evidence-source column +
   authority-binding-posture column) at the same change-set.
6. Pass `hcs-ontology-reviewer`, `hcs-policy-reviewer`,
   `hcs-security-reviewer`, `hcs-architect` (all four required).

#### `Session.session_kind` status table (ADR 0055)

| session_kind | State | Invocation-evidence source | Required FK fields | Producer attribution |
|---|---|---|---|---|
| `agent_invocation` | Zod-defined v1 | MCP server connection / CLI invocation / IDE workspace open (kernel-observed via broker FSM / process telemetry / IDE-host probe) | `agent_client_id` + `principal_id` + `execution_context_id` all required | `kernel_session_resolver` |
| `dashboard` | registry-canonical (ADR 0055 reservation; paired with future `kernel_dashboard` producer ADR) | dashboard tab open (future `kernel_dashboard` producer) | TBD per future ADR | TBD (future `kernel_dashboard`) |
| `system_task` | registry-canonical (ADR 0055 reservation; paired with `system_principal` per ADR 0054) | kernel-initiated background work | `agent_client_id` may be relaxed to nullable; `principal_id` + `execution_context_id` required | TBD per future ADR |

#### `Session.session_state` enum mirror (ADR 0055)

```
active | ended
```

**Cardinality matches** AgentClient/WorkspaceContext/Principal long-lived
precedents (1 active + 1 terminal at v1). **Value-name diverges
intentionally**: Session uses `ended` (not `retired`) because Session is a
transient invocation rather than a long-lived identity (per ADR 0055 v2
architect B1 absorption).

#### `Session.producer` allowlist (ADR 0055)

```
kernel_session_resolver
```

NEW kernel-trusted producer added per ADR 0055 mirroring ADR 0037
`kernel_agent_client_resolver` + ADR 0054 `kernel_principal_resolver`
precedents. `kernel_dashboard` deferred to coordinated future ADR per
ADRs 0051 v4 / 0052 / 0053 / 0054 / 0055 scope discipline.

#### Procedure for adding a new `Session.session_kind` value (ADR 0055)

1. Cite the source ADR / charter rule that the session_kind enforces.
2. **Identify the invocation-evidence source**: which evidence
   subtype(s) bind this kind (e.g., MCP server connection / CLI
   invocation / IDE workspace open for `agent_invocation`; dashboard
   tab open for future `dashboard`; kernel-initiated background work
   for future `system_task`).
3. **Identify the required FK fields per session_kind**: `agent_client_id`
   (default yes for `agent_invocation`; future `system_task` may relax
   to nullable per ADR 0054 §Future amendments `system_principal`
   pairing), `principal_id` (default yes — every session has an
   authenticated identity), `execution_context_id` (always yes per
   inv. 17).
4. **Commit lifecycle transitions** (default: same `active | ended`
   pattern; new session_kinds may extend with `terminated`, `crashed`,
   etc. per operational evidence).
5. **Commit per-`session_kind` producer attribution**: which kernel-
   trusted producer mints this session_kind (`agent_invocation` →
   `kernel_session_resolver`; `dashboard` → future `kernel_dashboard`
   (deferred); `system_task` → future producer (deferred)).
6. Update §Session.session_kind status table (Zod-defined vs registry-
   canonical, with invocation-evidence-source + required-FK-fields +
   producer-attribution columns) at the same change-set.
7. Pass `hcs-ontology-reviewer`, `hcs-policy-reviewer`,
   `hcs-security-reviewer`, `hcs-architect` (all four required).

#### `Decision.reason_kind` reservations from ADR 0055

The following 4 reason_kind values are reserved registry-canonical, with
Zod-defined values to land at a future Ring 1 mint API schema PR per
ADR 0049 §Procedure rule. They are included in the current
§Decision.reason_kind status table above. All deny-only:

- `'session_agent_client_unresolvable'` — Layer 1 mint API cannot
  resolve `Session.agent_client_id` to an active AgentClient.
- `'session_principal_unresolvable'` — Layer 1 mint API cannot resolve
  `Session.principal_id` to an active Principal.
- `'session_execution_context_unresolvable'` — Layer 1 mint API cannot
  resolve `Session.execution_context_id` to an active ExecutionContext
  (operationalizes charter §Forbidden patterns line 138 / inv. 17
  analogous to `run_execution_context_unresolvable` per ADR 0053).
- `'session_started_at_after_ended_at'` — schema-level Zod superRefine
  rejects when `ended_at < started_at` (temporal inconsistency; mirrors
  `run_started_at_after_ended_at` per ADR 0053).

At ADR 0055 landing, these extended the registry §Decision.reason_kind
status table from 32 (after ADR 0053) to **36 total reservations**. ADR
0056 later extends the table to **37 total reservations** while Zod-lifting
`audit_chain_corruption_detected`; ADR 0058 extends it to **38 total
reservations** while Zod-lifting `authority_chain_walk_depth_exceeded`.

### `PolicyRule` enum mirrors (ADR 0060)

PolicyRule (ADR 0060 / D-057) is non-minted and reuses
`operationShapeOperationClassSchema`, `approvalGrantKindSchema`, and
`approvalGrantProducerSchema` (no new mirror needed for those — they move with
their owning entities). Its two own closed enums mirror here:

#### `PolicyRule.tier` enum mirror (ADR 0060)

```
read-safe | write-local | write-project | write-destructive | forbidden
```

#### `PolicyRule.approval.dashboard_visibility` enum mirror (ADR 0060)

```
not_required | required_before_grant_consumption
```

### `Capability` enum mirrors (ADR 0062)

Capability (ADR 0062 / D-060) is non-minted and reuses
`operationShapeOperationClassSchema` (no new mirror needed — it moves with its
owning entity). Its one own closed enum mirrors here:

#### `Capability.capability_state` enum mirror (ADR 0062)

```
active | deprecated | retired
```

This vocabulary is the registry lifecycle and is deliberately disjoint from the
`AgentClient` containment-class axis (sense 2) and the `BoundaryObservation`
capability-state observation vocabulary (sense 3). Per ADR 0062, NO Sub-rule 9
grandfather is needed: Sub-rule 9 governs enum values, and `capability_state`
(`active`/`deprecated`/`retired`) and the `capability_registry` authority literal
are `lower_snake_case`/single-token; the free-form `operation_name` regex is not
an enum.

### `CommandShape` enum mirrors (ADR 0063)

CommandShape (ADR 0063 / D-061) is non-minted. Its one own closed enum is the
`env` value-source discriminator; `operation_class` is NOT echoed (it reuses no
enum — it is derivable via `operation_shape_ref`, inv. 1).

#### `CommandShape.env[].value_source.kind` enum mirror (ADR 0063)

```
secret_reference | execution_context_inherited
```

Both literals are `lower_snake_case` (NO Sub-rule 9 grandfather needed). The
discriminated union carries no inline resolved value (charter inv. 5):
`secret_reference` holds an opaque `secret_reference_ref` (a forward reference to
the unbuilt `SecretReference` entity — not a dangling typo; FK closure is a
Ring 1 obligation), and `execution_context_inherited` stores no value.

## Boundary dimension registry

Entries are alphabetised by name. Status reflects ontology review on this
registry, not the surrounding ADRs.

### `bundle_identity`

- Status: proposed
- Description: macOS app-bundle identity and signing facts for a surface,
  including bundle identifier, codesign team identifier, signature state
  (notarized, ad-hoc, broken), and observed bundle version/build.
- Primary target: `execution_context_id`
- Supplemental targets: `tool_or_provider_ref`
- Overlap notes: distinct from `launch_context` (how the process started) and
  `sandbox` (the named profile applied to the running bundle).
- Source: P13 research, 2026-04-29 quality-management synthesis.
- Sample observed payload sketch (illustrative only):
  `{ bundle_id, codesign_team_id, signature_state, version_observed, build_observed }`.

### `branch_protection`

- Status: accepted (typed payload landed in Phase 2.3.3)
- Description: Branch protection posture for a repository/ref target, including
  classic branch protection, GitHub rulesets, required checks/reviews, push /
  delete / force-push restrictions, bypass count, and linear-history posture.
- Primary target: `tool_or_provider_ref`
- Supplemental targets: `workspace_id`
- Overlap notes: distinct from `RulesetObservation`, which records a GitHub
  ruleset object as direct Evidence. `BranchProtectionObservation` records the
  target branch/ref boundary posture and composes with `RulesetObservation`
  by unioning restriction axes.
- Source: ADR 0027, ADR 0033, Phase 2.3.3 schema implementation.
- Observed payload schema: `BranchProtectionObservation.observed_payload`
  (`branch_protection:v1`).

### `check_source`

- Status: proposed
- Description: GitHub check expected-source identity for a check name, including
  source app/integration, expected workflow path, commit SHA binding, and
  observed freshness.
- Primary target: `tool_or_provider_ref` (provider object reference for the
  check or workflow).
- Supplemental targets: `workspace_id`, `surface_id`.
- Overlap notes: legacy candidate retained for registry continuity only.
  ADR 0033 commits `StatusCheckSourceObservation` as a direct Evidence subtype
  and explicitly rejects a `BoundaryObservation` envelope for status-check
  source binding.
- Source: ADR 0020, 2026-05-01 version-control authority consult synthesis.
- Sample observed payload sketch:
  `{ check_name, source_app_id, expected_workflow_path, commit_sha, observed_at }`.

### `containment_class`

- Status: accepted (umbrella; typed payload landed in Phase 2.2.3)
- Description: Cross-agent isolation posture for a surface, when no narrower
  dimension fits. ADR 0037 fixes the payload around `containment_kind`:
  `none`, `kernel_sandbox`, `container`, `vm`, `remote_cloud_sandbox`,
  `ide_host_isolation`, and `terminal_no_isolation`.
- Primary target: `execution_context_id`
- Supplemental targets: `surface_id`, `workspace_id`
- Overlap notes: per ADR 0022, prefer the narrower dimensions
  (`sandbox`, `egress_policy`, `egress_observed`, `filesystem_authority`,
  `runner_isolation`, `worktree_ownership`) before falling back to
  `containment_class`.
- Source: Q-010, ADR 0037, 2026-05-01 agentic tool isolation synthesis.
- Sample observed payload sketch:
  `{ containment_kind, network_egress_posture, filesystem_write_scope, keychain_access }`
  plus the discriminator-specific runtime field.

### `credential_routing`

- Status: proposed
- Description: Which credential source a surface picks for a given audience —
  `apiKeyHelper` resolution, OS Keychain item, env-var compatibility rendering,
  brokered `SecretReference`, or chained helpers.
- Primary target: `credential_source_id`
- Supplemental targets: `execution_context_id`, `tool_or_provider_ref`
- Overlap notes: never carries credential material. Distinct from observing a
  credential's value or rotating it; observation only.
- Source: ADR 0018, shell research v2 §V.P10.
- Sample observed payload sketch:
  `{ resolved_source_type, audience, helper_chain, observed_via }`.

### `egress_observed`

- Status: proposed
- Description: Observed network egress for a surface — DNS lookups, established
  connections, denial events, and "allowed but unused" markers.
- Primary target: `execution_context_id`
- Supplemental targets: `run_id`
- Overlap notes: complementary to `egress_policy` (declared rule). Distinct
  from `mcp_authorization` (provider-side identity for an MCP session) and
  `path_coverage` (provider-config scope coverage).
- Source: ADR 0015, ADR 0017, quality-management synthesis.
- Sample observed payload sketch:
  `{ destinations_observed, denied_attempts, observed_via, observation_window }`.

### `egress_policy`

- Status: proposed
- Description: Declared or configured network egress policy for a surface —
  Codex `network_access`, Claude Code permission rules, sandbox-exec policy,
  IDE extension allow/deny rules.
- Primary target: `execution_context_id`
- Supplemental targets: `workspace_id`
- Overlap notes: complementary to `egress_observed`. Records the rule, not the
  observed traffic.
- Source: ADR 0016, ADR 0017.
- Sample observed payload sketch:
  `{ policy_source, allow_default, deny_list, allow_list, last_modified }`.

### `filesystem_authority`

- Status: proposed
- Description: Filesystem read/write authority for a surface — bundled
  filesystem scope, sandbox path-write policy, Claude Code filesystem-tool
  permission set, app `Files & Folders` posture.
- Primary target: `execution_context_id`
- Supplemental targets: `workspace_id`, `surface_id`
- Overlap notes: distinct from `volume_authority` (mount-class facts) and
  `worktree_ownership` (lease/session ownership of a Git worktree). ADR 0036
  split inherited authority and protected-path cleanup authority into
  `filesystem_inheritance` and `filesystem_protected_paths`; this legacy
  dimension remains for generic per-context path-scope observations until a
  later ADR deprecates or narrows it.
- Source: ADR 0016, Codex sandbox docs, Claude Code filesystem permission
  research, quality-management synthesis.
- Sample observed payload sketch:
  `{ allowed_roots, denied_paths, read_scope, write_scope }`.

### `filesystem_inheritance`

- Status: accepted (typed payload landed in Phase 2.2.3)
- Description: Whether a child execution context inherits filesystem authority
  from a parent context. Non-default inheritance requires linked evidence.
- Primary target: `execution_context_id`
- Supplemental targets: `workspace_id`, `surface_id`.
- Overlap notes: distinct from `filesystem_protected_paths`, which records
  workspace protected-path cleanup authority, and from
  `filesystem_authority`, which remains the generic per-context path-scope
  observation.
- Source: ADR 0036.
- Sample observed payload sketch:
  `{ inheritance_held, inheritance_evidence_refs }`.

### `filesystem_protected_paths`

- Status: accepted (typed payload landed in Phase 2.2.3)
- Description: Workspace paths protected by D-025 deletion-authority discipline
  and the evidence source that grants that authority classification.
- Primary target: `workspace_id`
- Supplemental targets: `execution_context_id`, `surface_id`.
- Overlap notes: distinct from `filesystem_inheritance`; cleanup operations
  cite this observation as deletion authority through
  `OperationShape.deletion_authority_source_ref`. The per-operation,
  per-path `filesystem_path_authority_check` dimension is reserved-only and
  intentionally absent from the schema enum in this slice.
- Source: ADR 0036.
- Sample observed payload sketch:
  `{ protected_paths: [{ path, path_authority_kind, path_authority_source_evidence_ref }] }`.

### `launch_context`

- Status: proposed
- Description: Process launch source — Finder origin, `open -n`, terminal
  child, IDE task, MCP server, launchd. Captures *how* the surface started.
- Primary target: `execution_context_id`
- Supplemental targets: `surface_id`
- Overlap notes: distinct from `bundle_identity` (the bundle that was
  launched).
- Source: P02 (`open -n` and Finder-origin probes), P05 (Claude Desktop
  launch-origin probe), shell research v2.
- Sample observed payload sketch:
  `{ launch_source, launcher_pid, launch_evidence_kind }`.

### `mcp_authorization`

- Status: proposed
- Description: MCP authorization surface — OAuth resource metadata, audience,
  principal-scoping, fan-out diagnostics, recent rate-limit markers (e.g.
  `last_cf_mcp_429`).
- Primary target: `tool_or_provider_ref` (MCP server reference).
- Supplemental targets: `execution_context_id`, `credential_source_id`.
- Overlap notes: distinct from `credential_routing` (local helper resolution).
  Specific to an MCP session's auth posture.
- Source: ADR 0015, Cloudflare MCP fan-out diagnostics addendum.
- Sample observed payload sketch:
  `{ mcp_server_ref, auth_kind, principal_audience, fan_out_state, last_429_at }`.

### `mcp_canonical_authority`

- Status: accepted (typed payload landed in Phase 2.2.3)
- Description: Canonical MCP install/config authority for an execution context
  and MCP server kind. The payload names the canonical install source,
  credential-source evidence reference, shim-chain evidence reference, and
  authority class.
- Primary target: `execution_context_id`
- Supplemental targets: `tool_or_provider_ref`, `credential_source_id`.
- Overlap notes: distinct from `mcp_authorization`, which records provider-side
  session authorization. `mcp_canonical_authority` is reference-only
  canonicality evidence and must not inline resolved credential content.
- Source: ADR 0036 and ADR 0033.
- Sample observed payload sketch:
  `{ mcp_server_kind, canonical_install_source_kind, canonical_credential_source_evidence_ref, shim_chain_evidence_ref, canonical_authority_kind, redaction_mode }`.

### `origin_access_validation`

- Status: proposed
- Description: Origin/tunnel validation evidence — Cloudflare `cloudflared`
  `audTag` allowlist, similar provider-side audience binding for an origin's
  reachability claim.
- Primary target: `tool_or_provider_ref` (validator/origin reference).
- Supplemental targets: `execution_context_id`.
- Overlap notes: distinct from `mcp_authorization`. Specific to origin/tunnel
  binding rather than client-session auth.
- Source: ADR 0015, Cloudflare tunnel-audience addendum.
- Sample observed payload sketch:
  `{ provider, validator_id, audience_allowlist, audience_observed, binding_state }`.

### `path_coverage`

- Status: proposed
- Description: Provider-side scope coverage gaps — Cloudflare Access wildcard
  coverage, GitHub ruleset path inclusion, MCP resource-scope coverage.
- Primary target: `tool_or_provider_ref`
- Supplemental targets: `workspace_id`
- Overlap notes: complementary to `origin_access_validation`. `path_coverage`
  is the ruleset's path scope; `origin_access_validation` is the validator
  binding.
- Source: ADR 0015 (Cloudflare Stage 3a).
- Sample observed payload sketch:
  `{ provider, ruleset_id, covered_paths, uncovered_paths, observed_at }`.

### `project_admission_authority`

- Status: accepted (typed payload landed in Phase 2.7)
- Description: Reference-only project-substrate admission authority evidence
  for a workspace and contract content hash, including the source guardian
  authority reference, authority source reference, asserted approval status,
  and observed contract lifecycle status.
- Primary target: `workspace_id`
- Supplemental targets: `tool_or_provider_ref` only when a future producer
  needs a provider object reference; `knowledge_source_id` remains inside the
  typed payload to avoid widening the BoundaryObservation envelope.
- Overlap notes: distinct from `ApprovalGrant`, which authorizes a specific
  runtime operation. `project_admission_authority` records project-level
  authority posture that later gates may cite as one evidence input.
- Source: ADR 0044, Phase 2.7 schema implementation.
- Observed payload schema: `ProjectAdmissionAuthorityObservation.observed_payload`
  (`project_admission_authority:v1`).

### `runner_isolation`

- Status: accepted
- Description: CI runner-host isolation observation — clean-room versus
  persistent runner, multi-tenant exposure, ephemeral filesystem state, runner
  network egress class.
- Primary target: `execution_context_id` (runner host as context).
- Supplemental targets: `tool_or_provider_ref` (runner provider/group).
- Overlap notes: distinct from `sandbox` (process-level on developer host) and
  `containment_class` (umbrella). Q-005 settled this dimension as an accepted
  typed `BoundaryObservation` branch.
- Source: ADR 0032.
- Sample observed payload sketch:
  `{ job_environment_kind, workspace_cleanup_kind, docker_socket_exposure_kind, network_egress_kind, host_filesystem_access }`.

### `sandbox`

- Status: proposed
- Description: Named OS-level sandbox profile applied to a surface — macOS
  Seatbelt profile, Codex `sandbox-exec` policy, Claude Code app sandbox,
  Electron sandbox flags. Records the profile identity and coarse capability
  outcomes.
- Primary target: `execution_context_id`
- Supplemental targets: `surface_id`, `workspace_id`
- Overlap notes: distinct from `egress_policy` (declared egress rules) and
  `filesystem_authority` (per-context path scope).
- Source: ADR 0017, P13 Codex app bundle/sandbox probe, quality-management
  synthesis.
- Sample observed payload sketch:
  `{ profile_name, profile_source, fs_scope, network_scope, keychain_scope }`.

### `tcc`

- Status: proposed
- Description: macOS TCC permission grants observed for an app surface —
  Camera, Microphone, Full Disk Access, Accessibility, Automation, Files &
  Folders, etc.
- Primary target: `execution_context_id`
- Supplemental targets: `surface_id`
- Overlap notes: distinct from `sandbox` (sandbox is the named profile; TCC
  records per-permission grants visible to that profile).
- Source: 2026-04-29 quality-management synthesis.
- Sample observed payload sketch:
  `{ tcc_service, grant_state, observed_via }` where `grant_state` is one of
  `granted | denied | not_determined | restricted`.

### `volume_authority`

- Status: proposed (speculative — needs primary citation in ontology review)
- Description: Filesystem volume / mount authority observation — encryption
  state, network mount, removable, snapshot-protected. Captures the volume the
  observed paths live on.
- Primary target: `workspace_id`
- Supplemental targets: `execution_context_id`
- Overlap notes: distinct from `filesystem_authority` (per-context path-scope
  rules). This dimension is listed in ADR 0022's candidate set without a
  strong motivating incident; ontology review should validate the dimension or
  remove it before any payload work begins.
- Source: ADR 0022 candidate list (motivation pending).
- Sample observed payload sketch:
  `{ volume_id, mount_point, encryption_state, mount_class }`.

### `worktree_ownership`

- Status: proposed (gated by Q-008)
- Description: Git worktree ownership — which session/lease/agent owns a
  worktree, observed worktree-to-branch attachment, ownership conflict state.
- Primary target: `workspace_id`
- Supplemental targets: `surface_id`, `execution_context_id`
- Overlap notes: distinct from `filesystem_authority`. Source-control receipts
  for the worktree-as-Git-object live under Q-006/ADR 0020 names; this
  dimension records the ownership/lease binding.
- Source: 2026-04-30 ScopeCam exchange synthesis, Q-008.
- Sample observed payload sketch:
  `{ worktree_path, attached_branch, lease_id, owning_session, lock_state }`.

## Adding or removing a dimension

Changes to this registry follow the schema-change workflow at
`.agents/skills/hcs-schema-change`:

1. Open a PR that updates this file and any matching enum in
   `packages/schemas/src/entities/boundary-observation.ts`.
2. Cite the motivating ADR or synthesis source. Speculative additions without a
   primary citation cannot be promoted from `proposed` and remain ineligible
   for downstream payload work.
3. `hcs-ontology-reviewer` files objections before human review.
4. Status moves from `proposed` to `accepted` only after human acceptance.
5. Removing or renaming a dimension requires evidence that no
   `BoundaryObservation` payload depends on it, plus an explicit deprecation
   note in this registry.

## Predicate-kind vocabulary

Authoritative registry for `CoordinationFact.predicate_kind` values. ADR 0019
reserved this registry section name as the closed-enum vocabulary store for
the predicate axis, paralleling §Boundary dimension registry from ADR 0022.
Entries are alphabetised by name. Status reflects ontology review on this
registry, not the surrounding ADRs. The schema enum mirror lives in §Schema
enum mirrors → §Knowledge and coordination enum mirrors and must stay in sync
with this registry; per registry §Adding a new suffix or convention, registry
updates land before any schema PR using a new `predicate_kind`.

Per-`predicate_kind` maximum freshness windows, verifier-class privileges,
and promotion-grant scope detail are canonical-policy concerns owned by
`system-config/policies/host-capability-substrate/` and are not duplicated
here. See ADR 0019 §Promotion workflow shape for the kernel-side gateway
re-derivation rules and registry §Cross-context enforcement layer for the
mint API / broker FSM / gateway discipline applied at decision time.

### `attached_to`

- Status: reserved (schema enum landed Phase 2.1.3; no committed use yet)
- Description: Generic attachment relationship between a subject and an
  object — reserved for future use such as branch-worktree attachment as
  a separately gateable assertion.
- Subject-kind compatibility: reserved; ADR 0031 names `branch` / `worktree`
  as candidate subject kinds when this predicate is committed.
- Object-kind compatibility: reserved; expected `scoped_assertion`.
- Overlap notes: distinct from `leased_to` (lease-shaped ownership with
  kernel-set holder fields) and `held_by` (generic ownership; also reserved).
  No `CoordinationFact` may be minted with `predicate_kind: "attached_to"`
  until a follow-up ADR commits the subject/object shape.
- Source: ADR 0031 §Predicate-kind reservations.
- Sample assertion sketch: deferred until a committing ADR lands.

### `blocked_until`

- Status: accepted (schema enum landed Phase 2.1.3; canonical-policy
  freshness windows deferred to Milestone 2)
- Description: A subject is blocked from advancing until a stated condition
  is met. Used for release/feature gates, deployment holds, and cross-repo
  coordination handoffs (e.g., a webui release tag blocked until a producer
  pod reaches a specific phase).
- Subject-kind compatibility: `release`, `branch`, `deployment`,
  `external_target`.
- Object-kind compatibility: `status_block` (carries
  `{status, reason?, valid_until?}`).
- Overlap notes: distinct from `phase_lock` (subject is positively at a
  named phase, not negatively blocked) and `gate_token` (the gate is
  represented by a typed token, not a status object).
- Source: ADR 0019 §Domain shape, candidate value list.
- Sample assertion sketch (illustrative only):
  `{ subject_kind: "release", subject_ref: <release-id>,
     predicate_kind: "blocked_until", object_kind: "status_block",
     object: { status: "blocked", reason: "producer-phase4-not-green",
               valid_until: "<iso>" } }`.

### `claim_superseded_by_snapshot`

- Status: reserved (schema enum landed Phase 2.1.3; tied to ADR 0036
  audit-profile snapshot lifecycle)
- Description: A prior claim record (typically `claimed_to_contain`) is
  superseded by a newer audit-profile snapshot. Renamed from ADR 0036 v1's
  ambiguous `superseded_by`; binding is claim-level only — it is not the
  generic `CoordinationFact` lifecycle supersession marker, and it is not
  the `KnowledgeSource` re-index lifecycle marker.
- Subject-kind compatibility: `audit_profile_snapshot`.
- Object-kind compatibility: `scoped_assertion` carrying the superseding
  snapshot reference and the prior-claim reference.
- Overlap notes: claim-level only. Does not signal `CoordinationFact`
  expiry, `KnowledgeSource.content_hash` change, or `Evidence` rotation.
- Source: ADR 0036 §Predicate-kind reservations.
- Sample assertion sketch: deferred until ADR 0036 schema implementation
  PR commits the audit-profile snapshot subject shape.

### `claimed_to_contain`

- Status: reserved (schema enum landed Phase 2.1.3; tied to ADR 0036
  audit-profile snapshot lifecycle)
- Description: An audit profile claims that a workspace contains a specific
  bounded context. Default `allowed_for_gate: false` until promoted via
  Q-003 verifier workflow with Layer 1 host-observation grounding.
- Subject-kind compatibility: `audit_profile_snapshot`, `workspace_context`.
- Object-kind compatibility: `scoped_assertion` (workspace bounded-context
  claim).
- Overlap notes: composes with `confirmed_to_contain` (host-grounded
  confirmation) and `claim_superseded_by_snapshot` (newer snapshot wins).
  ADR 0036 §Layer 1 host-observation grounding requirement: a
  `CoordinationFact` cited via `deletion_authority_kind:
  "coordination_fact"` MUST also cite host-grounded Evidence; a bare
  `claimed_to_contain` fact is not deletion authority by itself.
- Source: ADR 0036 §Predicate-kind reservations.
- Sample assertion sketch: deferred until ADR 0036 schema implementation
  PR commits the audit-profile snapshot subject shape.

### `confirmed_to_contain`

- Status: reserved (schema enum landed Phase 2.1.3; tied to ADR 0036
  audit framework smoke-test)
- Description: The audit framework's smoke-test (ADR 0036 Phase 10.5)
  confirmed a prior `claimed_to_contain` assertion through Layer 1
  evidence. Composes with the verifier visibility-authority rule
  (ADR 0019 §Verifier visibility-authority).
- Subject-kind compatibility: `audit_profile_snapshot`, `workspace_context`.
- Object-kind compatibility: `scoped_assertion` (host-grounded confirmation
  of the prior claim).
- Overlap notes: a `confirmed_to_contain` fact must additionally cite
  host-grounded Evidence (e.g., `GitRepositoryObservation` proving the
  workspace is the one named in the claim). Without that grounding, the
  fact remains `derived` and not gate-eligible.
- Source: ADR 0036 §Predicate-kind reservations.
- Sample assertion sketch: deferred until ADR 0036 schema implementation
  PR commits the audit-profile snapshot subject shape.

### `depends_on`

- Status: accepted (schema enum landed Phase 2.1.3; canonical-policy
  freshness windows deferred to Milestone 2)
- Description: A typed dependency relationship between coordination
  subjects — release-on-release, deployment-on-release, branch-on-branch,
  or cross-repo dependency assertions consumed by gates that need to
  know whether a referenced dependency is satisfied.
- Subject-kind compatibility: `release`, `branch`, `deployment`,
  `external_target`.
- Object-kind compatibility: `dependency` (carries `{dependency_refs}`).
- Overlap notes: distinct from `Evidence` linkage (`evidence_refs` cite
  observed facts, not relationships between coordination subjects).
- Source: ADR 0019 §Domain shape, candidate value list.
- Sample assertion sketch (illustrative only):
  `{ subject_kind: "release", subject_ref: <release-id>,
     predicate_kind: "depends_on", object_kind: "dependency",
     object: { dependency_refs: [<other-release-id>] } }`.

### `gate_token`

- Status: accepted (schema enum landed Phase 2.1.3; canonical-policy
  token semantics deferred to Milestone 2)
- Description: A token-shaped gate authority asserts that a named token
  is the current authority for a release/deployment gate. Consumers
  dereference the token reference; the typed object form carries
  `token_kind`, `token_ref`, and optional `valid_until`.
- Subject-kind compatibility: `release`, `deployment`, `external_target`.
- Object-kind compatibility: `gate_token` (carries
  `{token_kind, token_ref, valid_until?}`).
- Overlap notes: distinct from `ApprovalGrant` (an `ApprovalGrant` is a
  typed grant scoped to an operation; a `gate_token` `CoordinationFact`
  is a typed assertion that a token is the current authority).
- Source: ADR 0019 §Domain shape, candidate value list.
- Sample assertion sketch (illustrative only):
  `{ subject_kind: "release", subject_ref: <release-id>,
     predicate_kind: "gate_token", object_kind: "gate_token",
     object: { token_kind: "<kind>", token_ref: <ref>,
               valid_until: "<iso>" } }`.

### `held_by`

- Status: reserved (schema enum landed Phase 2.1.3; no committed use yet)
- Description: Generic ownership predicate, less specific than
  `leased_to`. Reserved for future use; ADR 0031 records that any
  generic ownership semantics belong here, while lease-shaped ownership
  with kernel-set holder fields belongs on `leased_to`.
- Subject-kind compatibility: reserved.
- Object-kind compatibility: reserved.
- Overlap notes: distinct from `leased_to` (lease has kernel-set
  `held_by_session_id` / `held_by_agent_client_id` plus a typed force-break
  grant path). No `CoordinationFact` may be minted with
  `predicate_kind: "held_by"` until a follow-up ADR commits the
  subject/object shape.
- Source: ADR 0031 §Predicate-kind reservations.
- Sample assertion sketch: deferred until a committing ADR lands.

### `leased_to`

- Status: accepted (committed by ADR 0031; canonical-policy
  per-`lease_kind` windows deferred to Milestone 2)
- Description: A worktree (or other lease-shaped subject) is leased to
  a named session for a bounded period. The `object` form carries the
  lease holder identity, lease identifier, freshness anchor, and lease
  acquisition time per registry §Naming suffix discipline Sub-rule 5.
- Subject-kind compatibility: `worktree` (subject_ref:
  `{repository_id, worktree_path}`).
- Object-kind compatibility: `scoped_assertion` carrying exactly
  `{session_id, lease_id, valid_until, lease_acquired_at}` per ADR 0031.
- Overlap notes: a worktree-mutation operation is gated against the
  active lease's `held_by_session_id`; non-holders cannot release leases
  except via the typed force-break-glass grant path. The
  `worktree_lease_held_by_other_session` rejection class is registered
  on `Decision.reason_kind` per ADR 0031 / registry §Cross-context
  enforcement layer.
- Source: ADR 0031 (Q-008(d) worktree-ownership composition).
- Sample assertion sketch (illustrative only):
  `{ subject_kind: "worktree",
     subject_ref: { repository_id: <id>, worktree_path: <path> },
     predicate_kind: "leased_to", object_kind: "scoped_assertion",
     object: { session_id: <id>, lease_id: <id>,
               valid_until: "<iso>", lease_acquired_at: "<iso>" } }`.

### `phase_lock`

- Status: accepted (schema enum landed Phase 2.1.3; canonical-policy
  freshness windows deferred to Milestone 2)
- Description: A subject is locked at a named phase — a positive
  assertion of phase-lock state for a release or deployment, distinct
  from a negative `blocked_until` assertion.
- Subject-kind compatibility: `release`, `deployment`.
- Object-kind compatibility: `status_block` (carries
  `{status, reason?, valid_until?}`).
- Overlap notes: distinct from `release_phase` (which names the current
  lifecycle phase as ground state) and `blocked_until` (which names a
  blocking condition rather than a positive lock).
- Source: ADR 0019 §Domain shape, candidate value list.
- Sample assertion sketch (illustrative only):
  `{ subject_kind: "release", subject_ref: <release-id>,
     predicate_kind: "phase_lock", object_kind: "status_block",
     object: { status: "locked-at-phase-5", valid_until: "<iso>" } }`.

### `release_phase`

- Status: accepted (schema enum landed Phase 2.1.3; canonical-policy
  freshness windows deferred to Milestone 2)
- Description: A subject's current release-lifecycle phase as a typed
  assertion (e.g., "phase 5", "phase 6"). The motivating Q-003 incident
  row 1 ("docs say Phase 6, live stack says pre-Phase-1") is the
  canonical failure-class this predicate exists to prevent —
  `release_phase` facts must come from typed evidence and live probes,
  never from retrieved prose.
- Subject-kind compatibility: `release`, `deployment`.
- Object-kind compatibility: `status_block` (carries
  `{status, reason?, valid_until?}`).
- Overlap notes: distinct from `phase_lock` (lock-at-phase is a stronger
  assertion). Charter invariant 18 (derived retrieval ≠ gate authority)
  applies: a retrieved chunk asserting "Phase 6 complete" cannot be
  promoted to a `release_phase` fact without typed evidence and Layer 1
  grounding.
- Source: ADR 0019 §Domain shape, candidate value list; coordination-
  lessons brief incident row 1.
- Sample assertion sketch (illustrative only):
  `{ subject_kind: "release", subject_ref: <release-id>,
     predicate_kind: "release_phase", object_kind: "status_block",
     object: { status: "phase-5", valid_until: "<iso>" } }`.

### `scope_assertion`

- Status: accepted (schema enum landed Phase 2.1.3; canonical-policy
  freshness windows deferred to Milestone 2)
- Description: Generic scoped assertion predicate for cases where the
  more specific predicates do not apply. The accompanying object form
  is `scoped_assertion` carrying free-form `{assertion}` content.
- Subject-kind compatibility: any registered `subject_kind`.
- Object-kind compatibility: `scoped_assertion`.
- Overlap notes: should not be used as a catch-all for facts that
  belong under a more specific predicate. New predicate values are
  preferable to overloading `scope_assertion`. The promotion workflow
  rejects `scope_assertion` facts whose semantic could be expressed by
  one of the typed predicate values registered above.
- Source: ADR 0019 §Domain shape, candidate value list.
- Sample assertion sketch (illustrative only):
  `{ subject_kind: "external_target", subject_ref: <ref>,
     predicate_kind: "scope_assertion", object_kind: "scoped_assertion",
     object: { assertion: "<typed-domain-statement>" } }`.

## Adding or removing a predicate_kind

Changes to this registry follow the schema-change workflow at
`.agents/skills/hcs-schema-change`:

1. Open a PR that updates this file and any matching enum in
   `packages/schemas/src/entities/coordination-fact.ts`.
2. Cite the motivating ADR or synthesis source. Speculative additions
   without a primary citation cannot be promoted from `reserved` and
   remain ineligible for `CoordinationFact` minting.
3. `hcs-ontology-reviewer` files objections before human review.
4. Status moves from `reserved` to `accepted` only after a follow-up
   ADR commits the subject-kind / object-kind shape and a human owner
   accepts the registry change.
5. Removing or renaming a `predicate_kind` value requires evidence that
   no `CoordinationFact` record depends on it, plus an explicit
   deprecation note in this registry. Per registry §Cross-context
   enforcement layer, deprecated values remain rejected at the mint
   API even after schema enum removal.

## References

- ADR 0019: `docs/host-capability-substrate/adr/0019-knowledge-and-coordination-store.md`
- ADR 0022: `docs/host-capability-substrate/adr/0022-boundary-observation-envelope.md`
- ADR 0023: `docs/host-capability-substrate/adr/0023-evidence-base-shape.md`
- ADR 0031: `docs/host-capability-substrate/adr/0031-q-008-d-worktree-ownership-composition.md`
- ADR 0034: `docs/host-capability-substrate/adr/0034-q-007-b-f-boundary-evidence-composition-quality-gate-posture.md`
- ADR 0036: `docs/host-capability-substrate/adr/0036-q-009-workspace-manifest-projection-and-diagnostic-surface.md`
- ADR 0037: `docs/host-capability-substrate/adr/0037-q-010-cross-agent-isolation-and-compatibility-taxonomy.md`
- ADR 0038: `docs/host-capability-substrate/adr/0038-phase-2-schema-landing-sequence.md`
- ADR 0043: `docs/host-capability-substrate/adr/0043-q-013-credential-plane-implementation.md`
- ADR 0044: `docs/host-capability-substrate/adr/0044-q-014-project-substrate-implementation.md`
- ADR 0045: `docs/host-capability-substrate/adr/0045-q-015-backup-readiness-implementation.md`
- ADR 0049: `docs/host-capability-substrate/adr/0049-decision-ring-0-entity.md`
- ADR 0051: `docs/host-capability-substrate/adr/0051-approvalgrant-ring-0-entity.md`
- ADR 0055: `docs/host-capability-substrate/adr/0055-session-ring-0-entity.md`
- ADR 0056: `docs/host-capability-substrate/adr/0056-promote-reason-kinds-operation-class-unregistered-and-audit-chain-corruption-detected.md`
- ADR 0058: `docs/host-capability-substrate/adr/0058-depth-overflow-reason-kind-promotion.md`
- ADR 0060: `docs/host-capability-substrate/adr/0060-policy-rule-ring-0-entity.md`
- ADR 0062: `docs/host-capability-substrate/adr/0062-capability-ring-0-entity.md`
- ADR 0063: `docs/host-capability-substrate/adr/0063-command-shape-ring-0-entity.md`
- Q-011: `DECISIONS.md`
- Ontology overview: `docs/host-capability-substrate/ontology.md`
- Schema-change skill: `.agents/skills/hcs-schema-change/SKILL.md`

## Change log

| Version | Date | Change |
|---------|------|--------|
| 0.4.23 | 2026-06-07 | Recorded `CommandShape` (ADR 0063 / D-061), the third and last entity in the `PolicyRule → Capability → CommandShape` chain and a non-minted Ring 0 typed plan (`argv` + `env` + `cwd` + `timeout_seconds`) rendered from an `OperationShape`. Change-set: NEW §Current-schema-version-ledger row (`CommandShape @ '0.1.0'`, non-minted — no `audit_chain_link_hash` / producer / `evidence_refs`; absent from ADR 0057 mint scope); NEW §Schema-enum-mirrors `CommandShape` subsection (`CommandShape.env[].value_source.kind` 2 values: `secret_reference` / `execution_context_inherited`); NEW §References row for ADR 0063. Central boundary: a typed plan, NOT an execution authorization (no execution semantics, no execute lane, charter inv. 7). Embodies inv. 2 (typed `argv` vector, no shell-string field) + inv. 5 (`env` names + value-source references, no resolved values). `operation_class` is NOT echoed (derivable via `operation_shape_ref`, inv. 1); `secret_reference_ref` is a forward reference to the unbuilt `SecretReference` entity (FK closure deferred to Ring 1). Deferred Ring-1 obligations: deprecated-verb render-refusal (inv. 11), cwd absolute-root confinement, SecretReference FK closure + env value resolution, operation_shape_ref FK existence, and the argv argument-class distinction (charter line 98) — recorded as a seeded accept-and-trap regression fixture paired with a `forbidden-string-scan.sh` committed-fixture backstop extended to CommandShape argv/env/cwd. |
| 0.4.22 | 2026-05-29 | Recorded `Capability` (ADR 0062 / D-060), a non-minted Ring 0 registry declaration of a known kernel operation and a structural peer of `PolicyRule` (second of the remaining-11 M1 entities in the resumed forward train). Change-set: NEW §Current-schema-version-ledger row (`Capability @ '0.1.0'`, non-minted — no `audit_chain_link_hash` / producer / `evidence_refs` / observation-state enum / containment-class axis / `superRefine`; absent from ADR 0057 mint scope); NEW §Schema-enum-mirrors `Capability` subsection (`Capability.capability_state` 3 values: `active`/`deprecated`/`retired`); NEW §References row for ADR 0062. Reuses `operationShapeOperationClassSchema` (never redefined; no enum drift). `operation_name` is a free-form lowercase dotted-identifier regex (≥2 segments), intentionally distinct from `operation_class` and verb-agnostic (no forbidden-literal denylist at Ring 0). `capability_state` registry lifecycle; `deprecated`/`retired` render-refusal is a CommandShape-renderer obligation (charter inv. 11), not schema-enforced. `source_provenance.authority: 'capability_registry'` is disjoint from `evidenceAuthoritySchema`; `source_registry_sha256` is format-only at Ring 0 (the digest-vs-bound-registry trust check is a Ring 1 capability-registration obligation). NO Sub-rule 9 grandfather needed: Sub-rule 9 governs enum values, and `capability_state` / the `capability_registry` authority literal are `lower_snake_case`/single-token; the `operation_name` regex is not an enum. Three-senses disambiguation: NOT the `AgentClient` containment-class axis (sense 2), NOT the `BoundaryObservation` capability-state observation vocabulary (sense 3). |
| 0.4.21 | 2026-05-29 | Recorded `PolicyRule` (ADR 0060 / D-057), the first non-minted Ring 0 entity and first of the remaining-11 M1 entities in the resumed forward train. Change-set: NEW §Current-schema-version-ledger row (`PolicyRule @ '0.1.0'`, non-minted — no `audit_chain_link_hash` / producer / `evidence_refs`; absent from ADR 0057 mint scope); NEW §Schema-enum-mirrors `PolicyRule` subsection (`PolicyRule.tier` 5 values + `PolicyRule.approval.dashboard_visibility` 2 values); EXTENDED §Naming-suffix-discipline Sub-rule 9 kebab-case grandfather list to `policyRuleTierSchema` (mirrors the operator-approved live policy `tiers:` keys verbatim; second grandfathered enum after `evidenceAuthoritySchema`). Reuses `operationShapeOperationClassSchema` + `approvalGrantKindSchema` + `approvalGrantProducerSchema` (no enum drift); new narrow `isoDurationSchema` primitive in `common.ts`. The schema encodes only structural invariants (forbidden non-escalability via `nonEscalableTiers` set + `required_grant_kind ∈ allowed_grant_kinds`); it never encodes the `operation_class → tier` mapping (live-policy content owned by system-config, charter inv. 1 / inv. 10). Landing flips live policy `policy_rule_schema_version` `null → '0.1.0'` (operator + system-config lane). Two named Ring-1 dependencies of the non-minted posture: B-1 a `Decision` schema amendment (add `policy_rule_ref` + resolved `source_policy_sha256` for audit attribution), B-2 a Ring-1 loader digest-verification obligation. |
| 0.4.20 | 2026-05-19 | Landed ADR 0058 / D-053 Decision.reason_kind status update: `authority_chain_walk_depth_exceeded` is a Zod-defined deny-only value in `decisionReasonKindSchema`, with no `Decision.schema_version` bump. The value is non-clearable (`required_grant_kind == null`; non-null rejects), producer-scoped to `mint_api` + `kernel_broker` with `kernel_gateway` excluded pending a future gateway ADR, and typed Decision emission remains gated on a valid `operation_shape_ref`; non-operation and pure chain-validation overflows stay audit-rejection-only. The status table now reads after ADRs 0049–0058 with 18 Zod-defined + 20 registry-canonical values, 38 total. |
| 0.4.19 | 2026-05-12 | Landed ADR 0056 / D-046 Decision.reason_kind status update: `operation_class_unregistered` and `audit_chain_corruption_detected` are Zod-defined deny-only values in `decisionReasonKindSchema`, with no `Decision.schema_version` bump. `operation_class_unregistered` is registered as non-clearable (`required_grant_kind == null`; non-null rejects), and `Decision.operation_shape_ref` remains required with no nullable or sentinel OperationShape. Also reconciles the ADR 0055 session denial reservations into the status table body that v0.4.18 had already claimed to extend. |
| 0.4.18 | 2026-05-11 | Recorded the seventh foundational Ring 0 entity (`Session`) per ADR 0055 / D-044 (workflow-sequencing investigation §Step 3 entity #2 of 2 highest-coupling — closes 4 forward-reference typed FK targets in the just-landed Step 1 train: Lease.held_by_session_id, Run.invoker_session_id, ADR 0030 v2 owning_session_id, and "consuming/requesting session" references in ADRs 0031 v1 / 0051 v4 / 0052 / 0054 self-approval rejection + holder-only release rules). Fourteen-item change-set: NEW §Session.session_kind status table (1 Zod-defined value `agent_invocation` + 2 registry-canonical reservations `dashboard` + `system_task`; invocation-evidence-source + required-FK-fields + producer-attribution columns); NEW §Session.session_state enum mirror (2 values; cardinality matches AgentClient/WorkspaceContext/Principal but value-name `ended` diverges from `retired` because Session is transient invocation not long-lived identity); NEW §Session.producer allowlist (`kernel_session_resolver`); NEW §Procedure for adding a new session_kind value rule (7 steps including invocation-evidence-source identification + required-FK-fields-per-kind + per-kind producer attribution + all-4-reviewer dispatch); NEW Decision.reason_kind reservations (4 deny-only: `session_agent_client_unresolvable`, `session_principal_unresolvable`, `session_execution_context_unresolvable`, `session_started_at_after_ended_at`); extends registry §Decision.reason_kind status table from 32 to 36 total reservations. UPDATE §Kernel-trusted producer allowlist final state — added `kernel_session_resolver` row (mirrors ADR 0037 `kernel_agent_client_resolver` + ADR 0054 `kernel_principal_resolver` precedents; MUST enforce sandbox-source rejection + transitive chain-walk rejection at Ring 1 per security N1 + N4 v2 absorptions). Renamed §ADR 0049–0054 foundational Ring 0 entity field authority subsection → §ADR 0049–0055 + added Session envelope-only-kernel-set entry contrasting with Principal (YES execution_context_id on envelope; Session is execution-context-BOUND at entity layer, mirrors WorkspaceContext per ADR 0031 v1 Mechanical Tweak #8). Renamed §ADR 0049–0054 foundational Ring 0 entity enum mirrors → §ADR 0049–0055 + body prose extended to 7 entities + Session sub-section with status table + state mirror + producer allowlist + §Procedure rule. Extended length-prefix canonical-concatenation discipline coverage from ADRs 0049-0054 to ADRs 0049-0055. Schema-version ledger (§Current schema-version ledger) gained a new Session row at `'0.1.0'`. The Session schema PR commits typed-FK closure for Lease.held_by_session_id + Run.invoker_session_id describe-text (NO shape change at consuming entities; `approvalGrantSchema.schema_version` / `leaseSchema.schema_version` / `runSchema.schema_version` all remain `'0.1.0'`). The §Self-approval rejection rule registry section (added by ADR 0054) gains the typed-FK consummation: the consuming-session `principal_id` reference becomes a typed FK via `Session.principal_id`; comparison form remains UUID-byte-equality on principal_id surface IDs canonicalized at Principal mint per the ADR 0054 4-step recipe (Cf-strip closure preserved). |
| 0.4.17 | 2026-05-11 | Recorded the sixth foundational Ring 0 entity (`Principal`) per ADR 0054 / D-043 (workflow-sequencing investigation §Step 3 entity #1 of 2 highest-coupling; first entity drafted post-Step-1-source-landing). Twelve-item change-set: NEW §Self-approval rejection rule discrete registry section (ADD from item 7 v2-reframe — was UPDATE in v1 of ADR 0054, but the section did NOT exist as a discrete heading in v0.4.16, only narrative mentions inside §ADR 0049–0053 foundational Ring 0 entity field authority + §ADR 0049–0053 enum mirrors); NEW §Principal.principal_kind status table (2 Zod-defined values `human` + `service_principal`; 2 registry-canonical reservations `pseudo_principal` + `system_principal`); NEW §Principal.principal_state enum mirror (`active` + `retired`); NEW §Principal.producer allowlist (single-value `kernel_principal_resolver`); NEW §Procedure for adding a new `Principal.principal_kind` value rule (6 steps including binding-evidence source identification + authority-binding-posture classification with synthetic-identity rejection rule + all-4-reviewer dispatch). Updated §Kernel-trusted producer allowlist final state — added `kernel_principal_resolver` row (mirrors ADR 0037 `kernel_agent_client_resolver` precedent). Renamed §ADR 0049–0053 foundational Ring 0 entity field authority subsection → §ADR 0049–0054 + added Principal envelope-only-kernel-set entry (NO `execution_context_id` field on envelope; identity is execution-context-independent at the entity layer mirroring AgentClient). Renamed §ADR 0049–0053 foundational Ring 0 entity enum mirrors → §ADR 0049–0054 + added Principal sub-section with status table + state enum mirror + producer allowlist + §Procedure rule. Added Principal cross-reference to §Audit-chain coverage of rejections. Extended the length-prefix canonical-concatenation discipline coverage from ADRs 0049-0053 to ADRs 0049-0054 (Principal inherits the same hash-collision defense per ADR 0051 v4 retroactive posture rule). Schema-version ledger (§Current schema-version ledger) gained six new rows for the foundational entities (Decision/WorkspaceContext/ApprovalGrant/Lease/Run/Principal) at `'0.1.0'` — closes the pre-existing ledger drift noted by architect non-blocking observation post-ADR 0054 v2 (the prior-cohort entries existed only as the "Other standalone Phase 2.1 entities" generic row before this change-set). The §Self-approval rejection rule registry section commits the typed-FK comparison form (UUID-byte-equality), the 4-step canonicalization-at-mint recipe (NFC + Cf-category strip + Unicode-aware lowercase fold + leading/trailing-whitespace trim per ADR 0054 v2; the Cf-category strip structurally closes the ADR 0051 v4 §Self-approval rejection MT-Sec-2 zero-width-character evasion class), the non-readonly OperationShape.operation_class trigger set per ADR 0051 v4 §Rejects §Self-approval rejection, the Ring 1 mint API enforcement commitment, cross-references to ADRs 0051 v4 + 0054, and future-amendment commitments for Unicode version pinning (security N1) and Unicode TR39 confusable defense (security N2). |
| 0.4.16 | 2026-05-11 | Recorded the workflow-sequencing investigation §Step 1 foundational Ring 0 entities (`Decision`, `WorkspaceContext`, `ApprovalGrant`, `Lease`, `Run`) per ADRs 0049–0053 / D-037–D-041. New §ADR 0049–0053 foundational Ring 0 entity enum mirrors section consolidates: §Decision.outcome enum mirror, §Decision.decided_by allowlist (adds `kernel_gateway`), §Decision.reason_kind status table (15 Zod-defined + 17 registry-canonical = 32 total reservations), §Decision §Procedure rule for new reason_kind values, §WorkspaceContext envelope (envelope-level kernel-set with 2 producer-asserted-kernel-verifiable exceptions per ADR 0031 v1), §ApprovalGrant.grant_kind enum mirror (3 Zod-defined), §ApprovalGrant.grant_state enum mirror, §ApprovalGrant.granted_by allowlist (excludes `kernel_gateway`), §ApprovalGrant §Procedure rule, §Lease.lease_kind status table (1 Zod-defined `worktree` + 2 registry-canonical reservations from ADR 0031 v1), §Lease.lease_state enum mirror, §Lease.acquired_by allowlist (excludes `kernel_gateway`), §Worktree-lease cardinality discipline (atomic-insert uniqueness per ADR 0031 v1 Mechanical Tweak #6 / Security-G), §Force-break separation of duties (ADR 0031 v1 Security-H; Phase 1 human-dashboard-only posture), §Lease §Procedure rule, §Run.run_kind status table (1 Zod-defined `operation_execution` + 2 registry-canonical reservations), §Run.run_state enum mirror, §Run.recorded_by allowlist (excludes `kernel_gateway`), §Evidence.run_id typed FK target closure (12 Phase 2 evidence subtypes per ADR 0053 MT-3), §Run §Procedure rule, §D-037 producer-disjointness rule (extended to Lease-acquire and Run-record cases). Updated §Kernel-trusted producer allowlist final state: added `kernel_gateway` row; extended `kernel_workspace_diagnose` scope to include `WorkspaceContext` identity records; clarified per-producer entity-field authorization scope across the new envelopes. Length-prefix canonical-concatenation discipline registered as a posture rule covering all foundational entity `audit_chain_link_hash` computations (ADR 0051 v4 retroactive). All cross-record refinements (Session/Decision/ExecutionContext equality, lease uniqueness, producer-disjointness, gateway re-derive, self-approval rejection, valid_until inheritance, revoke-wins race tiebreaker, sandbox-acquire rejection, authorizing-Decision outcome verification) remain Ring 1 mint API responsibility per §Cross-context enforcement layer §Schema validation alone is not an enforcement layer. |
| 0.4.11 | 2026-05-09 | Replaced §Open follow-up evaluations with §Phase 2.7 candidate dispositions per ADR 0048 (proposed). Records the per-candidate classification for `machine_identity`, `project_substrate_contract`, and backup-readiness subject_kinds IF a future schema PR promotes them into `coordinationSubjectKindSchema`; default for all three is no enum addition unless a concrete coordination need surfaces. Currently none of the three are in `coordinationSubjectKindSchema`. |
| 0.4.10 | 2026-05-09 | Added §Subject-kind grounding requirement section registering the ADR 0036 §Future amendments §Layer 1 grounding rule extensibility principle as a discoverable registry rule. Catalogues current `CoordinationFact.subject_kind` values per the rule (two derived/Layer-2-backed values committed by ADR 0036; seven host-observation-backed values inheriting ADR 0019 v3's chain-promotion rule), commits the procedure for future schema PRs introducing new subject_kind values, and notes open follow-up evaluations for Phase 2.7 subject_kinds (`machine_identity`, `project_substrate_contract`, backup-readiness). Authority is the existing ADR 0036; no new ADR. Matches the recent §Predicate-kind vocabulary registry-promotion pattern. |
| 0.4.9 | 2026-05-09 | Closed pre-existing source-vs-ledger drift on `OperationShape.schema_version`: introduced entity-specific `operationShapeSchemaVersionSchema = z.literal('0.2.0')` in source to match the registry-ledger row that has read `0.2.0` since Phase 2.2.2. Authority is the existing ADR 0036 Phase 2.2.2 deletion-authority extension; no new ADR. Registry-ledger row Notes column tightened to record the closure and the no-bump treatment of the ADR 0047 cleanup_plan addition. |
| 0.4.8 | 2026-05-09 | Recorded ADR 0047 cleanup-plan composition first schema slice. §`OperationShape` enum mirrors adds `cleanup_plan` to operation_class with `mutation_scope: "none"` and `target_kind: "workspace"` narrowing notes; §DerivedSummary summary_kind enum mirrors adds `cleanup_plan` plus the new `summary_text` typed closed-enum vocabulary (`hint_resolved | hint_ignored_stale | hint_ignored_workspace_mismatch | hint_unresolvable | no_hint_provided`); §QualityGate operation_class enum mirror reconciled with `operationShapeOperationClassSchema` (adds both `workspace_verify` — closing the pre-existing ADR 0036 enum-mirror gap — and `cleanup_plan`). New `Decision.reason_kind` reservations and `cleanup_scope` enum recorded as registry-canonical pending Ring 1 mint API schema PR. |
| 0.4.7 | 2026-05-09 | Recorded the `evidenceAuthoritySchema` `self-asserted` enum extension landing. Updated §Authority class ladder from ten to eleven values; reframed §`self-asserted` authority class from "(new; schema landing pending)" to landed, citing the schema-operational state and clarifying that charter v1.4.0 inv. 18 chain-walk rejection at the typed-grant minting layer remains a posture commitment until that layer lands. Bumped the `Evidence` schema-version-ledger row to `0.10.0`. Closes ADR 0039 §Forward-looking observations #5 (Arch-N12 / Pol-N2 / Sec-N-v2-2) per the 2026-05-07 absorption audit. |
| 0.4.6 | 2026-05-07 | Extended §Producer-vs-kernel-set authority fields to enumerate the five charter v1.4.0 invariant 19 execution-context binding FKs (`execution_context_id`, `surface_id`, `workspace_id`, `credential_source_id`, `tool_or_provider_ref`) as kernel-set on `BoundaryObservation` envelopes and related Evidence subtype envelopes. Aligns the registry with inv. 19 charter authority and the Phase 2.2.3 `BoundaryObservation` payload bundle landing. Closes ADR 0039 §Forward-looking observations Ont-N9 per the 2026-05-07 absorption audit. |
| 0.4.5 | 2026-05-07 | Added §Predicate-kind vocabulary section authoritative for `CoordinationFact.predicate_kind` values, paralleling §Boundary dimension registry per ADR 0019 reservation. Documents twelve currently-landed predicates (six ADR 0019 candidates accepted at enum level; `leased_to` accepted via ADR 0031; `attached_to`, `held_by`, `claimed_to_contain`, `confirmed_to_contain`, `claim_superseded_by_snapshot` reserved). Adds matching §Adding or removing a predicate_kind procedure note. ADR 0019 / ADR 0031 added to §References. Closes the Q-003 / ADR 0019 reservation that named this section as a schema-PR precondition. |
| 0.4.4 | 2026-05-07 | Recorded `KnowledgeSource.schema_version` `0.2.0` for the ADR 0045 `threat_model` source-kind extension and tightened Q-015 proof-bearing nested evidence-ref registry notes. |
| 0.4.3 | 2026-05-07 | Added ADR 0045 Q-015 backup-readiness enum mirrors, recorded `threat_model` as a `KnowledgeSource.source_kind`, added the backup readiness/restore drill/credential custody/project backup requirement direct Evidence subtypes, and noted that Q-015 reuses existing `Evidence.subject_kind` values without an Evidence schema-version bump. |
| 0.4.2 | 2026-05-07 | Added ADR 0044 Q-014 project-substrate enum mirrors, recorded `project_substrate_contract` as a `KnowledgeSource.source_kind`, promoted `project_admission_authority` as a typed `BoundaryObservation` branch, added the project teardown receipt mirrors, and bumped `BoundaryObservation.schema_version` to `0.5.0`. |
| 0.4.1 | 2026-05-07 | Added ADR 0043 Q-013 credential-plane enum mirrors for `CredentialAuthorityObservation` and `MachineIdentityBindingObservation`, recorded `machine_identity` as an `Evidence.subject_kind`, and bumped `Evidence.schema_version` to `0.9.0`. |
| 0.4.0 | 2026-05-07 | Phase 2.4 registry consolidation: added summary tables for Phase 2.1 standalone entities, Phase 2.2 base-shape extensions, Phase 2.3 direct Evidence subtypes, typed `BoundaryObservation` branches, schema-version ledger, and kernel-trusted producer allowlist final state; aligned frontmatter with the Q-010 `0.3.14` registry state; recorded `kernel_agent_client_resolver` in the producer allowlist per ADR 0037. |
| 0.3.14 | 2026-05-07 | Added Phase 2.3.4 enum mirrors for ADR 0037 Q-010 remote-agent Evidence subtypes and recorded `Evidence.schema_version` `0.8.0`. |
| 0.3.13 | 2026-05-06 | Added Phase 2.3.3 enum mirrors for ADR 0027/0030/0033 Q-006 source-control evidence, promoted `branch_protection` to accepted, corrected `check_source` overlap notes to the ADR 0033 direct-Evidence posture, recorded `Evidence.schema_version` `0.7.0`, recorded `BoundaryObservation.schema_version` `0.4.0`, and aligned the BoundaryObservation envelope with charter invariant 19 by requiring envelope-level provenance plus non-null freshness. |
| 0.3.12 | 2026-05-06 | Added Phase 2.3.2 enum mirrors for ADR 0032 Q-005 runner/check evidence, promoted `runner_isolation` to accepted, recorded `Evidence.schema_version` `0.6.0`, and recorded `BoundaryObservation.schema_version` `0.3.0`. |
| 0.3.11 | 2026-05-06 | Added Phase 2.3.1 enum mirrors for ADR 0034 `GitIdentityBinding` and `ToolProvenance` direct Evidence subtypes and recorded the Evidence schema bump to `0.5.0`. |
| 0.3.10 | 2026-05-06 | Added Phase 2.2.3 `BoundaryObservation` payload enum mirrors and accepted registry entries for `filesystem_inheritance`, `filesystem_protected_paths`, and `mcp_canonical_authority`; updated `containment_class` to the ADR 0037 typed payload vocabulary; recorded the `BoundaryObservation.schema_version` bump to `0.2.0`. |
| 0.3.9 | 2026-05-06 | Added the Phase 2.2.2 `OperationShape` enum mirror for operation_class, mutation_scope, target_kind, and deletion_authority_kind. |
| 0.3.8 | 2026-05-06 | Added the Phase 2.2.1 `ExecutionContext.latest_containment_evidence_ref` and `ExecutionContext.kernel_sandbox_kind` kernel-set containment cache fields to the authority-field registry. |
| 0.3.7 | 2026-05-06 | Added the Phase 2.1.4 `QualityGate` enum mirror, `quality_gate` Evidence subject kind, and ADR 0035 reason_kind / required_grant_kind reservations. |
| 0.3.6 | 2026-05-06 | Added the Phase 2.1.3 knowledge and coordination enum mirror, Evidence subject-kind extensions, `secret_pointer` security label, and ADR 0019/0031/0036 CoordinationFact vocabulary. |
| 0.3.5 | 2026-05-05 | Added the Phase 2.1.2 `VerificationCommandSpec` enum mirror, `verification_command_spec` Evidence subject kind, and `kernel_workspace_diagnose` producer-class allowlist extension. |
| 0.3.4 | 2026-05-05 | Added the Phase 2.1.1 `AgentClient` identity-axis enum mirror, `remote_cloud_agent` surface extension, and `secret_injection_kind` mirror. |
| 0.3.3 | 2026-05-03 | Two additions surfaced during the post-merge review of ADR 0029 v1 (Q-008(b) anomalous-capture blocking thresholds). §Naming suffix discipline §Sub-rule 6 amended to forbid `_code` as a discriminator suffix in addition to the existing `_class` rejection; rejection-class fields on `Decision` and required-grant-class fields on `ApprovalGrant` are `reason_kind` and `required_grant_kind` respectively (not `reason_code` / `required_grant_class`). §Sub-rule 9 codifies enum-value casing: stable enum values that appear in canonical policy YAML, schema enums, audit-chain records, and Decision/ApprovalGrant kind discriminators use `lower_snake_case`; mixed-case forms (`PascalCase`, `camelCase`, `kebab-case`) are forbidden for new enum values. The existing `evidenceAuthoritySchema` `kebab-case` exception is grandfathered for that enum only; no other enum may adopt `kebab-case`. Used as a precondition for ADR 0029 v2 revision. |
| 0.3.2 | 2026-05-02 | Two additions surfaced during the post-merge re-review of ADR 0028 v3. §Naming suffix discipline §Sub-rule 8 codifies `_mode` as the canonical suffix for orthogonal-layer discriminators (capture-vs-persistence layers; e.g., `argv_capture_mode`); `_kind` (Sub-rule 6) remains canonical for receipt-family discriminators. Bare-noun discriminators (`mode`, `capture_status`, `observation_state`, `boundary_dimension`) are permitted when they are the receipt's central concept rather than an orthogonal-layer modifier. §Authority discipline §Producer-vs-kernel-set authority fields amended to enumerate `Evidence.producer` as kernel-set when its value names a kernel-trusted producer class; the kernel-only allowlist is `kernel_broker`, `kernel_telemetry`, `mint_api`. Producer-supplied values naming a kernel-trusted class are rejected at the mint API; agent-side / sandbox-observer values remain producer-asserted but kernel-verifiable. A follow-up schema-change PR tightens `Evidence.producer` from `z.string().min(1).optional()` to a kind-tagged shape. Used as a precondition for ADR 0028 v4 revision. |
| 0.3.1 | 2026-05-02 | Five additions surfaced during the post-merge re-review of ADR 0027 v2 + ADR 0028 v2. §Naming suffix discipline §Sub-rule 6 codifies `_kind` as the canonical discriminator suffix; `_class` is not codified and is forbidden as a discriminator suffix (one existing exception: `containment_class` from ADR 0022 as part of an umbrella-dimension entity name). §Sub-rule 7 codifies that subject-kind enum values name the underlying subject (e.g., `tool_invocation`), not the receipt envelope (`tool_invocation_receipt`). §Cross-context enforcement layer §Layer-disagreement tiebreaker names the gateway as authoritative when layers disagree; mint-time acceptance does not bind the gateway. §Cross-context enforcement layer §Audit-chain coverage of rejections codifies that rejections at any of the three layers emit audit events with named fields (rejecting layer + rejection-class discriminator + typed Decision record), per charter inv. 4. §Redaction posture §Field-level scrubber rule codifies that when `redaction_mode != none`, every string-typed payload field passes the secret-shape scrubber; record-level redaction does not exempt fields. §Redaction posture §Capture-status × redaction-mode matrix promotes the per-ADR matrix from ADR 0028 v2 to a generic registry sub-rule applicable to any receipt family with capture-vs-persistence layers. Used as a precondition for ADR 0027 v2 acceptance and ADR 0028 v3 revision. |
| 0.3.0 | 2026-05-02 | Added three top-level discipline sections codifying cross-cutting rules surfaced during the post-merge review of ADR 0027 (Q-006 stage-1) and ADR 0028 (Q-008(a)). §Authority discipline names the explicit ten-class trust ladder, introduces the new `self-asserted` authority class below `sandbox-observation` for unverified producer claims (schema enum extension lands in a follow-up schema-change PR), and codifies the kernel-only rule for authority-class fields (`detected_by`, `captured_by`, `observed_via`); operational claims that are not authority-class remain producer-asserted but must be kernel-verifiable. §Cross-context enforcement layer names the canonical Ring 1 defense-in-depth: mint API + broker FSM re-check + gateway re-derive; Zod schema is structurally validating only, not an enforcement layer for cross-context binding. §Redaction posture codifies that `Evidence.redaction_mode` is the canonical persistence-redaction field; new evidence subtypes must not introduce parallel `<thing>_redaction_mode` payload fields whose semantics overlap; capture-mode vs persistence-redaction are orthogonal layers (e.g., ADR 0028 v2 renames `argv_redaction_mode` to `argv_capture_mode`). Used as a precondition for ADR 0027 v2 and ADR 0028 v2 acceptance. |
| 0.2.1 | 2026-05-02 | Added the §Version-field naming subsection codifying the three canonical version fields (`schema_version`, `evidence_schema_version`, `payload_schema_version`) and Sub-rule 6 (no fourth version field without registry update). Resolves the BoundaryObservation/BranchDeletionProof asymmetry surfaced during ADR 0025 v2 review, where a composite without a domain payload had drifted to a redundant `proof_schema_version` field. Used as a precondition for ADR 0025 acceptance. |
| 0.2.0 | 2026-05-02 | Added the §Naming suffix discipline section codifying Q-011 sub-decision (d) (approved 2026-05-01): closed `*Observation` / `*Receipt` / `*Proof` / no-suffix entity-name discipline, plus `<entity>_id` / `<thing>_ref` / `<thing>_evidence_refs` field-name discipline. Codifies the convention already in use across `packages/schemas/src/entities/` and `docs/host-capability-substrate/adr/`; resolves the `hcs-ontology-reviewer` finding that the suffix grammar was referenced but uncodified. Used as a precondition for ADR 0025 v2. |
| 0.1.0 | 2026-05-02 | Initial registry. Sixteen `boundary_dimension` candidates listed as proposed; Q-011 review grammar and registration rules captured. Created as the named registry for ADR 0022. |
