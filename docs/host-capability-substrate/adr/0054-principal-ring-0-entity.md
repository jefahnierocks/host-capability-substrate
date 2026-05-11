---
adr_number: 0054
title: Principal Ring 0 entity introduction
status: proposed
date: 2026-05-11
charter_version: 1.4.0
tags: [principal, ring-0, milestone-1, foundational-entity, principal-kind, identity-binding, charter-v1-4-0, registry-v0-4-16-pending-v0-4-17, workflow-sequencing-step-3, post-step-1-source-landing, adr-0051-v4-followup, adr-0036-followup, self-approval-rejection]
---

# ADR 0054: `Principal` Ring 0 entity introduction

## Status

`proposed`

Drafted 2026-05-11 immediately after the workflow-sequencing investigation
§Step 1 schema train landed as Ring 0 source (commit `7fb7e05 schemas: land
adrs 0049-0053 ring 0 foundational entities`). Principal is identified by the
post-landing PLAN.md §Current Focus as the higher-priority of the two
remaining-M1 entities that the just-landed five forward-reference
(`Principal` + `Session`); `Session` forward-references `Principal` via
`session.principal_id`, so Principal lands first.

**Revision history**:

- **v1** (commit `85ff783`) dispatched the four required reviewers in
  parallel. All four returned blockers:
  - **Architect B1 + Policy B1 (convergent)**: §Self-approval rejection
    rule registry section is referenced as existing but does NOT exist
    as a discrete heading; only narrative mentions inside the §ADR
    0049–0053 foundational Ring 0 entity field authority subsection
    (line ~449) and §ADR 0049–0053 foundational Ring 0 entity enum
    mirrors section (line ~2394). The ADR 0051 v4 change-set #7
    originally intended a discrete section but appears not to have
    landed as one.
  - **Architect B2**: registry §ADR 0049–0053 foundational Ring 0
    entity enum mirrors actual line 2386 (not 2317); other section
    citations off by smaller margins.
  - **Ontology B-1**: schema-version-literal count is 11 currently
    landed (`evidenceSchemaVersionSchema`, `knowledgeSourceSchema
    VersionSchema`, `operationShapeSchemaVersionSchema`,
    `executionContextSchemaVersionSchema` (private),
    `boundaryObservationSchemaVersionSchema` + sibling
    `boundaryObservationEvidenceSchemaVersionSchema`,
    `credentialSourceSchemaVersionSchema` (private),
    `decisionSchemaVersionSchema`, `workspaceContextSchemaVersion
    Schema`, `approvalGrantSchemaVersionSchema`, `leaseSchema
    VersionSchema`, `runSchemaVersionSchema`); v1 ADR claimed 8
    landed and Principal as ninth co-commitment. Corrected: 11
    landed + Principal joins as twelfth (counting the
    boundary-observation sibling) or eleventh-by-entity.
  - **Ontology B-2**: "untyped-semantic `entityIdSchema` forward-reference" framing for
    `ApprovalGrant.grantor_principal_ref` is misleading; the schema
    shape is `entityIdSchema` both before AND after typed-FK closure
    (only the semantic referent changes). Reframed as "untyped-
    semantic `entityIdSchema` forward-reference" throughout.
  - **Ontology B-3**: schema-version ledger update missing from
    registry change-set.
  - **Policy B2**: §Audit-chain coverage of rejections actual line
    671 (close to v1's claim of 670+; updated).
  - **Security B1 (most serious)**: the §Compliance §Principal-id
    canonicalization rule did NOT structurally close the ADR 0051 v4
    MT-Sec-2 zero-width-character evasion. The v1 recipe specified
    "Unicode NFC + lowercase fold + leading/trailing-whitespace trim"
    — IDENTICAL to ADR 0051 v4 MT-Sec-2's acknowledged-inadequate
    recipe. NFC does not strip ZWSP (U+200B), ZWNJ (U+200C), ZWJ
    (U+200D), BOM (U+FEFF), soft-hyphen (U+00AD), or other Unicode
    general-category `Cf` (Format) characters. Moving the same
    recipe from compare-time to mint-time changes the location of
    the residual surface but does not close it. The v1 framing
    introduced "v2-of-the-same-attack under a 'closed' registry
    classification," materially worse than the v1 string-comparison
    posture's honest "limitation acknowledged" framing.

- **v2 (this revision)** absorbs all blocking findings:
  - **Recipe strengthened (Security B1)**: canonicalization recipe
    extended to include **Unicode `Cf` general-category strip** AFTER
    NFC normalization, BEFORE lowercase fold + whitespace trim. The
    `Cf` category includes ZWSP / ZWNJ / ZWJ / BOM / soft-hyphen and
    the broader set of invisible format controls; stripping the entire
    category structurally closes the MT-Sec-2 zero-width-character
    evasion surface. Closure claim now honest. Unicode version pinning
    (security N1 non-blocking) committed as a future amendment.
  - **TR39 confusable-defense reservation (Security N2)** registered
    as future amendment for principal-id homoglyph defense (e.g.,
    ASCII `a` vs Cyrillic `а` U+0430); v2 commits the closure for
    `Cf`-class invisibles and defers the broader confusable-defense
    posture.
  - **§Self-approval rejection rule registry section ADD (Architect B1
    + Policy B1)**: registry change-set item 7 reframed from UPDATE
    to ADD. v2 commits the creation of a discrete §Self-approval
    rejection rule registry section (top-level under §Cross-context
    enforcement layer or as a sibling subsection) that carries the
    typed-FK comparison form, the canonicalization-at-mint recipe
    (including the `Cf` strip), the non-readonly OperationShape.
    operation_class trigger set, the Ring 1 mint API enforcement
    commitment, and the cross-reference to ADR 0051 v4 §Rejects
    §Self-approval rejection.
  - **Schema-version literal count corrected (Ontology B-1)**:
    references-list enumeration updated to list 11 currently-landed
    literals + Principal as twelfth; "joins as the ninth co-commitment"
    framing replaced with "joins as the twelfth co-commitment
    (counting boundary-observation's two sibling literals)."
  - **"untyped-semantic `entityIdSchema` forward-reference" reframed (Ontology B-2)**:
    all instances rewritten as "untyped-semantic `entityIdSchema`
    forward-reference" or equivalent to emphasize the FK target
    *shape* doesn't change (both v1 and post-typed-FK are
    `entityIdSchema`), only the *semantic referent* gains a typed
    Ring 0 target.
  - **Schema-version ledger update added (Ontology B-3)**: registry
    change-set extended to 12 items, with the new item committing
    a row in the §Current schema-version ledger table for
    `principalSchemaVersionSchema = z.literal('0.1.0')`.
  - **Registry line citations corrected (Architect B2 + Policy B2)**:
    §ADR 0049–0053 foundational Ring 0 entity enum mirrors line 2386
    (was 2317); §Audit-chain coverage of rejections line 671 (was 670);
    §Cross-context enforcement layer line 615 (was 610); §Subject-kind
    grounding requirement line 512 (was 507); §Kernel-trusted producer
    allowlist final state line 867 (was 866).
  - **Confusable-set future amendment (Security N2)** added.
  - **Unicode version pinning future amendment (Security N1)** added.
  - **`principal_attribution_unresolvable` reason_kind reservation
    pre-commitment (Architect S3)** noted as a §Procedure rule
    consideration for the future `system_principal` Zod-defined
    extension; not committed at v2.
  - **Architect N10**: D-row commitment updated to anticipate D-042
    at acceptance.

## Date

2026-05-11

## Charter version

Written against charter v1.4.0 and `docs/host-capability-substrate/ontology-registry.md`
v0.4.16. Forward-looking citation per the established ADR-0050-introduced
pattern — ADR 0054 reserves v0.4.17 for its own registry change-set docs
commit.

## Reviews

This ADR introduces the sixth foundational Ring 0 entity (counting the
just-landed five from ADRs 0049-0053). `Principal` is M1 acceptance
criterion #3 and the typed FK target for `ApprovalGrant.grantor_principal_ref`
(currently a untyped-semantic `entityIdSchema` forward-reference per ADR 0051 v4 §Decision) and
the future `Session.principal_id` (when `Session` lands). Required reviewer
dispatch per `IMPLEMENT.md` §Required subagent reviews:

- `hcs-architect` — mandatory for any ADR
- `hcs-ontology-reviewer` — mandatory; ADR introduces a new Ring 0 entity
  with a `principal_kind` discriminator + lifecycle enum + producer
  allowlist extension + audit-chain integration
- `hcs-policy-reviewer` — mandatory; `Principal` records carry actor
  identity that is consumed by the self-approval rejection rule (ADR 0051
  v4) and by the ADR 0025 branch-deletion-proof `requesting_principal_id`
  gateway-set field; identity-binding rules are policy-adjacent even at the
  typed-envelope layer
- `hcs-security-reviewer` — mandatory; `Principal` carries authentication-
  derived identity; producer-allowlist closure protects against agent
  self-identification; ADR 0036 §Layer 1 grounding requirement governs
  synthetic-identity rejection; the typed-Principal landing closes the v1
  zero-width-character evasion limitation that ADR 0051 v4 MT-Sec-2
  acknowledged on the principal-string-comparison surface

## Context

The 2026-05-10 workflow-sequencing investigation §Step 1 named five
foundational Ring 0 entities (`Decision`, `WorkspaceContext`,
`ApprovalGrant`, `Lease`, `Run`); ADRs 0049-0053 accepted those entities
and commit `7fb7e05` (2026-05-11) landed them as Zod source. The PLAN.md
§Current Focus rewrite explicitly names **`Session` and `Principal` as the
highest-coupling remaining M1 entities** because they are forward-
referenced by Lease/Run/ApprovalGrant in three concrete ways:

- `Lease.held_by_session_id` and `Run.invoker_session_id` reference a
  Session entity that does not yet exist
- `ApprovalGrant.grantor_principal_ref` and (future)
  `Session.principal_id` reference a Principal entity that does not yet
  exist
- Per ADR 0051 v4 §Self-approval rejection + §Compliance v1
  `grantor_principal_ref` pre-typed-Principal posture, the v1 string-
  shape `grantor_principal_ref` carries a posture limitation that NFC
  normalization does not strip zero-width characters (U+200B / U+200C /
  U+200D / U+FEFF / U+00AD); typed-Principal landing structurally closes
  that evasion surface by replacing the string-comparison with UUID-byte-
  equality on principal_id surface IDs

**Pre-committed design points (must compose with):**

- **ADR 0051 v4 §Self-approval rejection (lines 244-250)**: when Principal
  lands, `ApprovalGrant.grantor_principal_ref` and (future)
  `consuming_session.principal_id` become typed FKs to Principal; the
  comparison becomes UUID-byte-equality (mirrors ADR 0052 §Identity
  comparison form for session_id). The Unicode NFC + lowercase fold +
  whitespace trim canonicalization rule survives as a normalization step
  on the surface IDs (not on the comparison itself, since FK-equality is
  byte-equality on already-canonicalized IDs).
- **ADR 0036 §Sub-decision (d) (lines 769-781)**: human-identity binding
  for cycle-history.md ratification binds to an existing `principal_id`
  resolved from the signed git commit's author identity (or a configured
  commit-signature-to-principal mapping per future Q-row). Synthetic
  identities rejected at Layer 1 mint.
- **ADR 0036 §Future amendments (lines 1017-1022)**: the resolution rule
  for synthesizing `principal_id` from a signed git commit's author
  identity, including configured signature-to-principal mappings, defers
  to a future Q-row. This ADR commits the typed envelope; the future
  Q-row commits the resolution rules.
- **ADR 0025 §Branch deletion proof (line 149, 368)**: gateway-set
  `requesting_principal_id` from the authenticated session.
- **ADR 0019 v3 §Chain-promotion rule**: synthetic identities cannot
  promote via derived/observation chains; Ring 1 producer allowlist
  enforces.
- **`Evidence.subject_kind: 'principal'` already exists** in
  `evidenceSubjectKindSchema` (verified at
  `packages/schemas/src/entities/evidence.ts:23`). This ADR does NOT
  modify `evidenceSubjectKindSchema` and does NOT bump
  `Evidence.schema_version`. Mirrors ADR 0051 v4 / ADR 0052 / ADR 0053
  framing for existing subject_kinds.
- **MachineIdentityBindingObservation (ADR 0043)** carries
  `machine_identity_kind: 'provider_principal' | 'federated_subject' |
  'runner_principal'` and a `machine_identity_ref`. Service-principal
  Principal records cite MachineIdentityBindingObservation records via
  `evidence_refs` to bind the typed envelope to the observed machine
  identity.
- **`GitIdentityBinding` (ADR 0034)** carries signed-git-commit author
  identity binding. Human Principal records cite `GitIdentityBinding`
  records via `evidence_refs` to bind the typed envelope to the signed
  commit identity (the specific binding rule lands in the future Q-row).

**Current state.** Without a Ring 0 `Principal` schema:

- `ApprovalGrant.grantor_principal_ref` remains a string-shape forward-
  reference with the ADR 0051 v4 MT-Sec-2 zero-width-character evasion
  posture limitation
- `Session.principal_id` cannot be typed when Session lands
- `requesting_principal_id` gateway-set fields (ADR 0025, ADR 0036, future
  Q-rows) have no typed target
- M1 acceptance criterion #3 (`Principal` in the canonical 22-entity
  list) remains unmet

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

The constraint stack: charter v1.4.0 inv. 1 (canonical-typed-evidence),
inv. 4 (audit logging), inv. 5 (no resolved secret material — Principal
carries identity references, never secrets), inv. 8 (no sandbox→stronger
— `evidence_refs` chain-walk rejection of sandbox-observation authority
deferred to Ring 1 producer-allowlist enforcement, mirroring the
WorkspaceContext / AgentClient typed-identity-envelope precedent), inv. 17
(execution context declared — Principal records are kernel-resolved but do
NOT carry execution_context_id since Principal identity is
execution-context-independent at the entity layer; binding evidence
records carry their own execution_context_id per inv. 19), inv. 18 (chain-
walk rejection — deferred to Ring 1 producer-allowlist enforcement per the
typed-identity-envelope precedent), inv. 19 (freshness-bound — `valid_
until` non-null when retired).

## Options considered

### Option A — Minimal entity with `principal_kind` enum; binding evidence cited via `evidence_refs` (this ADR's choice)

`principalKindSchema = z.enum(['human', 'service_principal'])` at v1.
Binding evidence (signed git commit, machine identity observation,
etc.) is cited via `evidence_refs` using the existing `evidenceRefSchema`
shape (mirrors `AgentClient` / `WorkspaceContext` typed-identity-envelope
precedent). The specific binding-rule taxonomy lives at Ring 1 mint API
+ future Q-row (per ADR 0036 §Future amendments).

**Pros:**

- Smallest v1 scope; aligns with foundational-entity v1 minimality
  discipline (ADRs 0049-0053 pattern)
- Mirrors the proven `AgentClient` / `WorkspaceContext` typed-identity-
  envelope pattern (Phase 2.1.1 + ADR 0050 precedents)
- Avoids the "enum value committed without binding semantics" trap from
  ADR 0051 v2/v3 (inherited_from_gate) by NOT pre-committing detailed
  binding shapes per kind
- Defers detailed binding-resolution rules to the future Q-row per ADR
  0036 §Future amendments, avoiding premature schema commitment
- §Procedure rule for new principal_kind values reuses the established
  template from ADRs 0049 / 0051 v4 / 0052 / 0053

**Cons:**

- Detailed binding-evidence-source taxonomy lives in Ring 1 mint API
  rules + future Q-row, not in the Ring 0 schema layer (this is
  intentional per the typed-identity-envelope precedent but worth
  acknowledging)

### Option B — Discriminated `binding` union with typed payload per principal_kind

Per `human` branch: typed FK to `GitIdentityBinding` + signed-commit-
author canonical email; per `service_principal` branch: typed FK to
`MachineIdentityBindingObservation` + audience/issuer fields.

**Pros:**

- Per-kind binding shape committed at the schema layer; stronger typed
  binding from day one
- Future binding extensions land via discriminated union widening

**Cons:**

- Encodes binding-resolution logic at the Ring 0 layer; binding is a
  Ring 1 mint API + policy concern per ADR 0036 §Future amendments
- Requires committing concrete binding shapes for both kinds at v1
  without operational evidence to validate the shape (premature design
  risk — ADR 0051 v2/v3 hit this precise trap with `inherited_from_gate`)
- Future binding-evidence subtypes (OAuth tokens, SSH keys, API-key
  hashes) would force schema_version bumps to extend each branch
- Forks the typed-identity-envelope pattern that AgentClient and
  WorkspaceContext established

### Option C — No `principal_kind` discriminator at v1

A monolithic `Principal` entity with just identity + lifecycle, no kind
discriminator. Defers kind classification to future ADRs.

**Pros:**

- Smallest possible v1 schema

**Cons:**

- Self-approval rejection at Ring 1 mint API benefits from kind-aware
  comparison (humans vs service principals have different escalation
  surfaces) — losing the discriminator weakens future Ring 1 rules
- ADR 0036 cycle-history.md ratification anticipates kind-aware verifier-
  identity binding; no-kind framing defers necessary structure
- Discriminator-at-v1 is the established pattern for foundational
  entities (Decision.outcome, ApprovalGrant.grant_kind, Lease.lease_kind,
  Run.run_kind) — losing it breaks pattern consistency

**Rejected.**

## Decision

**Option A.** Minimal `Principal` Ring 0 entity with `principalKindSchema
= z.enum(['human', 'service_principal'])` at v1; binding evidence cited
via `evidence_refs` using the existing `evidenceRefSchema` shape;
detailed binding-resolution rules deferred to Ring 1 mint API + future
Q-row per ADR 0036 §Future amendments.

v1 Principal entity carries:

- `schema_version` — entity-specific literal `'0.1.0'` via
  `principalSchemaVersionSchema = z.literal('0.1.0')`. Joins the
  established sibling-co-commitment cohort of
  `decisionSchemaVersionSchema`, `workspaceContextSchemaVersionSchema`,
  `approvalGrantSchemaVersionSchema`, `leaseSchemaVersionSchema`,
  `runSchemaVersionSchema` (all landed at commit `7fb7e05`).
- `principal_id` — `entityIdSchema` (kernel-set). Closes the typed FK
  target for `ApprovalGrant.grantor_principal_ref` (currently a
  untyped-semantic `entityIdSchema` forward-reference per ADR 0051 v4) and the future
  `Session.principal_id`.
- `principal_kind` — `principalKindSchema = z.enum(['human',
  'service_principal'])` (kernel-set; v1 closed enum, 2 values;
  extensible per the registered §Procedure rule. Registry-canonical
  reservations for `pseudo_principal` (cycle-history.md ratification
  verifier-identity binding per ADR 0036 §Sub-decision (d) future Q-row)
  and `system_principal` (if a kernel-emitted record needs principal
  attribution, e.g., automated retention/cleanup events) remain pending
  future schema PRs.)
- `principal_state` — `principalStateSchema = z.enum(['active',
  'retired'])` (kernel-set; mirrors `agentClientStateSchema` /
  `workspaceContextStateSchema` lifecycle patterns; 2 values).
- `kernel_observed_at` — `isoDateTimeSchema` (kernel-set; when the
  kernel resolver minted this Principal record from binding evidence).
- `valid_until` — `isoDateTimeSchema.nullable()` (kernel-set; null when
  `principal_state == 'active'`; set to retirement timestamp when
  `principal_state == 'retired'`). Same-record refinement enforces the
  state ↔ valid_until correlation (mirrors WorkspaceContext per ADR 0050).
- `producer` — `principalProducerSchema = z.enum(['kernel_principal_
  resolver'])` (kernel-set; named enum schema chosen over `z.literal`
  per the ADR 0050 v3 Option 2 forward-compatible-allowlist-widening
  pattern + ADR 0051 v4 / ADR 0052 / ADR 0053 sibling precedents).
  v1 allowlist is the single-value `kernel_principal_resolver`. NEW
  producer added to registry §Kernel-trusted producer allowlist final
  state; named after the ADR 0037 `kernel_agent_client_resolver`
  precedent (which mints `AgentClient` records from product/build
  evidence). Future producers (e.g., `kernel_dashboard` for human-
  dashboard-minted Principal records) land via separate coordinated
  change-set ADRs per the established discipline.
- `audit_chain_link_hash` — `sha256DigestSchema` (required, non-empty,
  sha256-shape-validated; mirrors prior foundational-entity
  audit_chain_link_hash co-commitments). Hash covers the canonical
  concatenation of `principal_id || principal_kind || principal_state
  || kernel_observed_at || (valid_until || '') || producer ||
  canonical(evidence_refs) || prior_audit_chain_link_hash`. **The `||`
  notation denotes length-prefix-encoded concatenation** per the ADR
  0051 v4 retroactive posture rule covering ADRs 0049-0053 (now
  extended to ADR 0054). `schema_version` is intentionally excluded
  from the canonical concatenation per the established precedent.
  Genesis Principal policy: same `'GENESIS'` sentinel rule.
- `evidence_refs` — `z.array(evidenceRefSchema).min(1)` (kernel-set
  producer evidence; mirrors `AgentClient` / `WorkspaceContext` plain-
  evidenceRefSchema pattern). The chain-walk rejection refinement is
  **NOT** present at the schema layer (mirrors `AgentClient` and
  `WorkspaceContext` typed-identity-envelope precedent); inv. 8 + inv.
  18 enforcement deferred to Ring 1 mint API via producer-allowlist
  closure on `kernel_principal_resolver` (kernel-trusted producers
  cannot accept sandbox-observation authority as binding evidence by
  definition).

**Authority-discipline posture**: Principal is **envelope-level
kernel-set with NO field-level exceptions** (mirrors Decision +
ApprovalGrant + Run posture; cleaner than Lease's mixed split per ADR
0031 v1). All 9 fields are kernel-set; producer-supplied Principal
records are rejected at the Ring 1 mint API per the producer-allowlist
closure on `kernel_principal_resolver`.

**Execution-context binding (charter inv. 17 + inv. 19):** Principal
records do NOT carry `execution_context_id` at the entity layer.
Principal identity is execution-context-independent (a human or service
principal IS the same identity regardless of which execution context
they operate through). Binding evidence records (`GitIdentityBinding`,
`MachineIdentityBindingObservation`, etc.) cited in `evidence_refs`
carry their own `execution_context_id` per inv. 19 where applicable.
This framing mirrors AgentClient (no `execution_context_id` at the
entity layer; observed by binding evidence). Cross-context substitution
defense at the Principal record layer is therefore trivially satisfied:
no binding to forge.

This framing diverges from `WorkspaceContext` (which DOES carry
`execution_context_id` per ADR 0031 v1 Mechanical Tweak #8 / Security-C
because workspace identity binds to the session that minted it). The
divergence is intentional: a workspace's typed identity is mint-bound to
its session; a principal's typed identity is binding-evidence-bound
(signed commit, machine identity observation) and is reused across
sessions and execution contexts.

### Lifecycle (2 typed states; supersession-via-evidence_refs)

A Principal begins life in `principal_state: 'active'` at Layer 1
`kernel_principal_resolver` mint. Transition to `retired` produces a
NEW Principal record citing the prior in `evidence_refs` (mirrors ADR
0049 + ADR 0050 + ADR 0051 + ADR 0052 + ADR 0053 supersession-via-
evidence_refs pattern). `valid_until` is set to the retirement timestamp
on transition.

Retirement triggers (Ring 1 mint API responsibility — not schema-
enforced): credential rotation, machine identity rotation, human-
identity revocation, dashboard-initiated retirement. The retirement
audit chain links to the prior Principal record.

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

## Consequences

### Accepts

- **`Principal` Ring 0 entity introduced** at `packages/schemas/src/
  entities/principal.ts` with `schema_version: '0.1.0'`. Closes M1
  acceptance criterion #3 (`Principal` in the canonical 22-entity list).
  Closes the typed FK target for `ApprovalGrant.grantor_principal_ref`
  (currently a untyped-semantic `entityIdSchema` forward-reference) and the future
  `Session.principal_id`.

- **Initial `principalKindSchema` Zod-defined enum** with two values
  (`human`, `service_principal`). Registry-canonical reservations for
  `pseudo_principal` (cycle-history.md ratification per ADR 0036 future
  Q-row) and `system_principal` (kernel-emitted record attribution)
  remain pending future schema PRs per the registered §Procedure rule.
  Mirrors the conservative-Zod-defined-enum pattern of ADRs 0049-0053.

- **Principal lifecycle (2 transitions, supersession-via-evidence_refs)**:
  `null → active → retired`. Lifecycle transitions are immutable: state
  changes via NEW Principal record citing the prior in `evidence_refs`
  (mirrors ADRs 0049-0053). Same-record schema-level refinement enforces
  `principal_state == 'active' iff valid_until == null` (mirrors
  WorkspaceContext per ADR 0050).

- **Authority-discipline posture (envelope-level kernel-set with NO
  field-level exceptions)**: all 9 envelope-level fields are kernel-set:
  `schema_version`, `principal_id`, `principal_kind`, `principal_state`,
  `kernel_observed_at`, `valid_until`, `producer`, `audit_chain_link_
  hash`, `evidence_refs`. Mirrors Decision + ApprovalGrant + Run
  envelope-only posture (cleaner than Lease's mixed split per ADR 0031
  v1; cleaner than WorkspaceContext's 2-exception split per ADR 0031 v1
  §Authority discipline).

- **No execution-context binding at the entity layer**: Principal
  records do NOT carry `execution_context_id`. Principal identity is
  execution-context-independent (mirrors AgentClient framing). Binding
  evidence records carry their own `execution_context_id` per inv. 19
  where applicable. Cross-context substitution defense is trivially
  satisfied at the Principal layer.

- **NEW kernel-trusted producer `kernel_principal_resolver`** added to
  registry §Kernel-trusted producer allowlist final state. The Ring 1
  service that resolves Principal records from binding evidence
  (`GitIdentityBinding`, `MachineIdentityBindingObservation`, future
  Q-row commit-signature-to-principal mappings). Mirrors the ADR 0037
  `kernel_agent_client_resolver` precedent.

- **`Evidence.subject_kind: 'principal'` already exists** in
  `evidenceSubjectKindSchema` (verified at
  `packages/schemas/src/entities/evidence.ts:23`). This ADR does not
  modify `evidenceSubjectKindSchema` and does not bump
  `Evidence.schema_version`. Mirrors ADR 0051 v4 / ADR 0052 / ADR 0053
  framing for existing subject_kinds.

- **Audit-chain integrity with length-prefix discipline**: the
  `audit_chain_link_hash` canonical-concatenation uses length-prefix-
  encoded `||` per the ADR 0051 v4 retroactive posture rule (now
  extended to ADR 0054). The `'' for null` substitution rule applies
  to `valid_until` per the jointly-committed posture.

- **No envelope-level superRefine chain-walk on `evidence_refs`**:
  Principal is a typed-identity envelope (mirrors AgentClient +
  WorkspaceContext precedents); inv. 8 + inv. 18 enforcement deferred
  to Ring 1 mint API via producer-allowlist closure on
  `kernel_principal_resolver`. This explicit non-commitment is registered
  here to forestall reviewer churn on future schema PRs — the Principal
  evidence_refs are NOT subject to the qualityGateSchema chain-walk
  pattern, by design (no `qualityGateEvidenceRefSchema` shape import).

- **Self-approval rejection typed-FK closure**: per ADR 0051 v4 §Rejects
  §Self-approval rejection, the v1 canonicalization-aware string-
  comparison surface (with the MT-Sec-2 zero-width-character evasion
  posture limitation) **closes structurally** when this ADR lands. The
  follow-up schema PR on `approval-grant.ts` gives `grantor_principal_
  ref` its typed-Ring-0 FK target (Principal); the field shape remains
  `entityIdSchema` (no shape change), and `approvalGrantSchema.schema_
  version` remains `'0.1.0'`. The comparison becomes UUID-byte-equality
  on principal_id surface IDs canonicalized at Principal mint time per
  the §Compliance §Principal-id canonicalization rule 4-step recipe
  (NFC + Cf-category strip + Unicode-aware lowercase fold + leading/
  trailing-whitespace trim). The `Cf`-strip step (step 2) structurally
  closes the ADR 0051 v4 MT-Sec-2 zero-width-character evasion surface
  (v1 recipe was NFC + lowercase + whitespace trim, which carried the
  invisibles surface forward; v2 recipe strips the entire Unicode
  general-category `Cf` after NFC, eliminating the evasion class).
  **Schema PR for this follow-up commitment lands together with this
  ADR's schema PR per `.agents/skills/hcs-schema-change`** (single
  coordinated slice; ApprovalGrant schema_version remains `'0.1.0'`
  because the FK target shape doesn't change — both before and after
  are `entityIdSchema`; only the typed semantic referent changes).
  Confusable-substitution defense (Unicode TR39 skeleton normalization
  or ASCII-only restriction) reserved as future amendment per security
  N2 v2 deferral.

- **`requesting_principal_id` typed-FK closure (ADR 0025 / ADR 0036)**:
  gateway-set `requesting_principal_id` fields in ADR 0025 §Branch
  deletion proof line 149 and ADR 0036 §Sub-decision (d) line 771+ gain
  a typed Ring 0 target. Schema PR work to update those references to
  typed FKs (when their respective entities are built) follows the
  established pattern.

- **NEW §Procedure for adding a new principal_kind value rule**
  registered in `ontology-registry.md` mirroring §Procedure rule
  patterns from ADRs 0048 / 0049 / 0051 v4 / 0052 / 0053. Future schema
  PRs extending the enum:
  1. Cite the source ADR / charter rule that the principal_kind
     enforces
  2. **Identify the binding-evidence source** (which evidence subtype
     records bind this kind; e.g., `GitIdentityBinding` for `human`,
     `MachineIdentityBindingObservation` for `service_principal`)
  3. **Classify authority-binding posture**: Layer 1 mint API binding-
     evidence verification rule (host-observation-grounded vs derived
     vs human-observed), synthetic-identity rejection rule
  4. **Commit lifecycle transitions** (default: same `active | retired`
     pattern; new principal_kinds may extend if needed)
  5. Update registry §Principal.principal_kind status table (Zod-
     defined vs registry-canonical, with binding-evidence-source column)
     at the same change-set
  6. Pass `hcs-ontology-reviewer` (always); `hcs-policy-reviewer`
     (always — identity-binding rules are policy-adjacent);
     `hcs-security-reviewer` (always — authority-binding posture +
     synthetic-identity-rejection rule); `hcs-architect` (always)

- **Registry change-set bundled into this ADR's commit (or follow-on
  docs commit referencing this ADR)**. Registry version bumps `v0.4.16`
  → `v0.4.17`. Changes:
  1. NEW §Principal entity section (entity overview + field-shape
     mirror + v1 2-value principal_kind + envelope-only-kernel-set
     framing + no-chain-walk-refinement note + no-execution-context-
     binding note)
  2. NEW §Principal.principal_kind status table (2 Zod-defined values +
     2 registry-canonical reservations from this ADR + binding-evidence-
     source column)
  3. NEW §Principal.principal_state enum mirror (2 values)
  4. NEW §Procedure for adding a new principal_kind value rule (binding-
     evidence-source + authority-binding-posture + lifecycle declarations)
  5. UPDATE §Kernel-trusted producer allowlist final state — add row for
     `kernel_principal_resolver` (kernel owner: Ring 1 principal
     resolver; mints Principal records from binding evidence)
  6. UPDATE §ADR 0049–0053 foundational Ring 0 entity field authority
     subsection (added by ADR 0054's predecessor work at commit
     `7fb7e05`) — rename to §ADR 0049–0054 foundational Ring 0 entity
     field authority; add Principal envelope-only-kernel-set sub-entry
  7. **ADD §Self-approval rejection rule registry section** (v2 reframed
     from UPDATE to ADD per Architect B1 + Policy B1: ADR 0051 v4
     change-set #7 intended a discrete §Self-approval rejection rule
     section but appears not to have landed as one; the only registry
     presences are narrative mentions inside §ADR 0049–0053 foundational
     Ring 0 entity field authority subsection at line ~449 and §ADR
     0049–0053 foundational Ring 0 entity enum mirrors section at line
     ~2394). ADR 0054's change-set creates the discrete §Self-approval
     rejection rule section (sibling to §Cross-context enforcement
     layer or under §ADR 0049–0054 foundational Ring 0 entity enum
     mirrors per reviewer preference), carrying: (a) the typed-FK
     comparison form (UUID-byte-equality post-Principal landing); (b)
     the 4-step canonicalization-at-mint recipe (NFC + `Cf`-category
     strip + Unicode-aware lowercase fold + leading/trailing whitespace
     trim) — see §Compliance §Principal-id canonicalization rule for
     the full recipe; (c) the non-readonly OperationShape.operation_
     class trigger set per ADR 0051 v4 §Rejects §Self-approval
     rejection; (d) the Ring 1 mint API enforcement commitment; (e)
     cross-references to ADR 0051 v4 §Rejects §Self-approval rejection
     + ADR 0054 §Decision §Cross-record commitments deferred to Ring 1
     mint API; (f) the future-amendment commitments for Unicode version
     pinning and TR39 confusable defense.
  8. UPDATE §Audit-chain coverage of rejections — add cross-reference
     to Principal.audit_chain_link_hash semantic
  9. UPDATE §ADR 0049–0053 foundational Ring 0 entity enum mirrors
     section title — rename to §ADR 0049–0054 foundational Ring 0
     entity enum mirrors; add Principal sub-section with enum mirrors +
     procedure rule + envelope-level kernel-set framing
  10. UPDATE the length-prefix canonical-concatenation discipline
      posture rule registration — extend coverage from ADRs 0049-0053
      to ADRs 0049-0054 (Principal inherits the same hash-collision
      defense)
  11. UPDATE registry change log
  12. **UPDATE §Current schema-version ledger (Ontology B-3 absorption)**
      — add row for `Principal` entity at `schema_version: '0.1.0'`,
      citing this ADR as authority. Joins the per-entity ledger rows
      established by ADRs 0036 (`OperationShape`), 0037 + 0038
      (`AgentClient` and Phase 2.1 entities), 0043/0044/0045
      (Phase 2.7 entities), and the commit-`7fb7e05` foundational
      entity train (Decision/WorkspaceContext/ApprovalGrant/Lease/Run).

- **D-row in `DECISIONS.md`** recording the entity introduction.

- **Charter compliance**: inv. 1 (canonical-typed-evidence — Principal
  is a typed identity envelope, not a derived/observational artifact),
  inv. 4 (audit logging — Principal records carry audit-chain-link hash
  for tamper-evident lifecycle), inv. 5 (no resolved secret material —
  Principal carries typed identity references only, never secrets), inv.
  8 (no sandbox→stronger — Ring 1 producer-allowlist closure on
  `kernel_principal_resolver` enforces binding-evidence trust class;
  schema layer mirrors AgentClient / WorkspaceContext typed-identity-
  envelope precedent in deferring chain-walk to Ring 1), inv. 17
  (execution context declared — Principal identity is execution-context-
  independent at the entity layer, mirrors AgentClient; binding evidence
  carries its own execution_context_id where applicable), inv. 18
  (chain-walk rejection — deferred to Ring 1 per the typed-identity-
  envelope precedent), inv. 19 (freshness-bound — `valid_until` non-null
  when retired). All upheld.

### Rejects

- **Discriminated `binding` union with typed payload per principal_kind**
  (Option B) — encodes binding-resolution logic at the Ring 0 layer;
  rejected. Binding is a Ring 1 mint API + policy concern per ADR 0036
  §Future amendments. Schema PRs that try to add typed binding payloads
  to Principal would need to first land the relevant binding-evidence-
  source ADR / Q-row + the canonical policy YAML rule + the Ring 1 mint
  API verification rule, then update Principal via the §Procedure rule.

- **No `principal_kind` discriminator at v1** (Option C) — rejected per
  the discriminator-at-v1 established pattern (Decision.outcome,
  ApprovalGrant.grant_kind, Lease.lease_kind, Run.run_kind). The
  discriminator is needed even at v1 because self-approval rejection at
  Ring 1 mint API + ADR 0036 cycle-history.md ratification verifier-
  identity binding both anticipate kind-aware comparison.

- **Producer-supplied `Principal` records** — Principal is envelope-
  only-kernel-set throughout. Producer attempts at the future Ring 1
  mint API to set any field are rejected with the standard kernel-set
  producer enforcement per registry §Producer-vs-kernel-set authority
  fields. The producer-allowlist closure on `kernel_principal_resolver`
  is the structural defense.

- **Principal records carrying raw secret values, inline credentials,
  signing key material, OAuth tokens, SSH private keys, recovery codes,
  or provider item bodies** — `principal_id` and `evidence_refs` are
  typed reference fields; raw secret material is forbidden per charter
  inv. 5. Identity binding lives in `evidence_refs` cited binding
  evidence subtypes (`GitIdentityBinding`, `MachineIdentityBinding
  Observation`, future Q-row evidence types), each of which has its
  own redaction posture.

- **Schema-level cross-record refinements** (binding-evidence
  verification, synthetic-identity rejection, self-approval rejection
  cross-record comparison, `requesting_principal_id` FK liveness, etc.)
  — all rejected at the schema layer because cross-record equality
  cannot be schema-validated against host state per registry §Cross-
  context enforcement layer §Schema validation alone is not an
  enforcement layer rule (mirrors ADRs 0050 / 0051 v4 / 0052 / 0053
  pattern). The schema commits the field shapes; Ring 1 mint API
  performs cross-record checks.

- **Schema-level Principal-immutability refinement** — Principal
  records are immutable once minted; lifecycle transitions produce NEW
  Principal records via supersession-via-evidence_refs. Schema-level
  immutability refinement is Ring 1 mint-API responsibility (Zod
  cannot reach prior storage state).

- **`execution_context_id` field on Principal envelope** — rejected.
  Principal identity is execution-context-independent at the entity
  layer; binding evidence carries its own `execution_context_id` per
  inv. 19. Adding execution_context_id to Principal would (a)
  contradict the "principal identity reused across contexts" semantic
  and (b) introduce a cross-context-substitution attack surface where
  a forged execution_context_id could appear to bind a Principal to a
  different context.

- **Envelope-level superRefine chain-walk on `evidence_refs`** —
  rejected per the typed-identity-envelope precedent (AgentClient,
  WorkspaceContext). Principal records are not authorization envelopes
  (they don't gate operations); chain-walk rejection of binding
  evidence belongs at the Ring 1 mint API producer-allowlist closure on
  `kernel_principal_resolver`. The schema layer enforces the producer
  allowlist (which structurally excludes producers that could accept
  sandbox-observation authority); the chain-walk on cited evidence is
  Ring 1 + the binding-evidence subtype's own envelope refinement.

- **`pseudo_principal` and `system_principal` Zod-defined at v1** —
  rejected per the conservative-v1-enum lesson from ADRs 0049-0053.
  Registry-canonical reservations remain pending future schema PRs per
  the §Procedure rule.

- **`kernel_dashboard` in `producer` allowlist** — rejected per the
  same coordinated-change-set deferral pattern as ADRs 0051 v4 / 0052
  / 0053. `kernel_dashboard` lands in its own future ADR (along with
  pre-emptive grant infrastructure, force-break grant_kind, and any
  dashboard-initiated Principal-retirement workflow).

- **Authoring Ring 1 mint API, kernel_principal_resolver
  implementation, dashboard surface for principal management, or
  canonical policy YAML for principal-binding rules** — all out of
  scope. Per workflow-sequencing investigation §Step 4, Ring 1 services
  land at `packages/kernel/`. Dashboard lands at `packages/dashboard/`
  per Milestone 5. Canonical policy YAML is Phase 2.5 lane at
  `system-config/policies/host-capability-substrate/`.

- **Detailed identity-binding resolution rules at v1** (commit-
  signature-to-principal mapping, OAuth-token-to-principal mapping,
  SSH-key-to-principal mapping, runner-OIDC-to-principal mapping) —
  deferred to future Q-row per ADR 0036 §Future amendments. v1 commits
  the typed envelope; the binding rules land later as a separate
  ADR + Phase 2.5 canonical policy YAML lane.

### Future amendments

- **`kernel_dashboard` producer + dashboard-initiated Principal
  retirement** — separate forthcoming ADR adds `kernel_dashboard` to
  the kernel-trusted producer allowlist + extends
  `principalProducerSchema` enum + adds dashboard-mediated Principal-
  retirement workflow (e.g., for credential compromise response).

- **`pseudo_principal` and `system_principal` Zod-defined extensions**
  — separate forthcoming schema PRs land via the §Procedure rule. The
  `pseudo_principal` extension lands together with the ADR 0036 future
  Q-row commit-signature-to-principal mapping rule; the
  `system_principal` extension lands when a kernel-emitted-record
  attribution need surfaces (e.g., automated retention/cleanup audit
  events).

- **ADR 0036 future Q-row commit-signature-to-principal mapping rule**
  — separate forthcoming ADR + Phase 2.5 canonical policy YAML lane.
  Commits the resolution rules for `kernel_principal_resolver` to
  synthesize `principal_id` from signed git commit author identity
  (or configured signature-to-principal mappings). Closes ADR 0036 §Sub-
  decision (d) security NB-7.

- **Detailed binding-evidence-source taxonomy per principal_kind** —
  future schema PRs per the §Procedure rule commit binding-evidence
  source rules for each new principal_kind. The schema PR coordinates
  with the binding-evidence subtype ADR (e.g., a future OAuth-binding-
  evidence subtype ADR + the human principal_kind binding rule).

- **Ring 1 mint API implementation (`kernel_principal_resolver`)** —
  per workflow-sequencing investigation §Step 4. Lives at
  `packages/kernel/src/principal/`. Enforces binding-evidence
  verification, synthetic-identity rejection, principal_id
  canonicalization per the 4-step v2 recipe (Unicode NFC + Cf-category
  strip + Unicode-aware lowercase fold + leading/trailing-whitespace
  trim per §Compliance §Principal-id canonicalization rule), lifecycle
  transitions, audit-chain integrity.

- **Self-approval rejection typed-FK closure follow-up schema PR on
  `approval-grant.ts`** — coordinated with this ADR's schema PR: the
  typed-FK target for `ApprovalGrant.grantor_principal_ref` resolves
  to Principal; the field shape remains `entityIdSchema` (no schema
  shape change) and `approvalGrantSchema.schema_version` remains
  `'0.1.0'`. The §Self-approval rejection rule registry section
  (created by ADR 0054 change-set item 7 ADD) records the typed-FK
  closure.

- **Dashboard-surfacing of Principal records** (Milestone 5) per
  `PLAN.md` Milestone 5 §View-model contracts. May surface principal
  identity, kind, lifecycle state, binding-evidence summary.

- **`requesting_principal_id` typed-FK updates in ADR 0025 / ADR 0036
  / future Q-row referencing entities** — when each of those entities
  gains typed Ring 0 source, the `requesting_principal_id` field
  becomes a typed FK to Principal.

- **`Session` Ring 0 entity introduction** (next entity in the
  workflow-sequencing investigation Step 3 priority order) — Session
  forward-references Principal via `session.principal_id`. When Session
  lands, the typed FK target becomes operationally reachable in the
  self-approval rejection rule (currently a v1 string-comparison at
  Ring 1 mint API).

- **Unicode TR39 confusable defense future amendment (Security N2 v2
  reservation)** — the v2 canonicalization recipe closes the invisibles
  surface (Cf-category strip) but does NOT close the homoglyph surface
  (e.g., ASCII `'alice'` vs Cyrillic-а `'аlice'` U+0430). A future
  amendment commits one of:
  - **Unicode TR39 skeleton normalization** as a step 2.5 in the
    canonicalization recipe (between Cf-strip and lowercase fold); or
  - **ASCII-only restriction** on principal_id surface IDs (forces
    binding evidence sources to ASCII-canonicalize before submitting
    the principal_id assertion); or
  - **Hybrid posture**: TR39 skeleton normalization with explicit
    bilingual identity binding allowing user-controlled non-ASCII
    where TR39 skeleton-equality holds.
  Operational evidence from `kernel_principal_resolver` implementation
  + dashboard surfacing of Principal records informs which posture
  matches the producer-side identity-binding sources.

- **Unicode version pinning future amendment (Security N1 v2
  reservation)** — the Cf-category and case-folding tables vary across
  Unicode major versions (Unicode 14.0, 15.0, 15.1, 16.0+). v2 commits
  to using the platform's built-in `String.prototype.normalize('NFC')`
  + Unicode-aware `String.prototype.toLowerCase()` at the project-
  pinned Node.js LTS version; a future amendment commits an explicit
  Unicode version pinning rule (e.g., "Unicode 15.x required;
  cross-deployment Unicode version drift produces a Ring 1 mint API
  Decision rejection") if operational evidence shows the platform-
  inherited version is insufficient for cross-deployment determinism.

- **`principal_attribution_unresolvable` reason_kind reservation
  (Architect S3 v2 pre-commitment)** — when the `system_principal`
  Zod-defined extension lands per the §Procedure rule, a typed deny
  path is needed for the case where a kernel-emitted record's
  attribution cannot be resolved to a Principal (e.g., automated
  retention/cleanup event whose `system_principal` record is stale or
  missing). Reserve the reason_kind in the §Procedure rule procedure
  for `system_principal` rather than committing the Zod-defined value
  at this ADR.

- **Reopen** if a future incident shows: v1 2-value `principal_kind`
  enum inadequate for distinct identity classes that need different
  binding rules; lifecycle state-set insufficient (e.g., need a
  `suspended` intermediate state for credential-rotation-in-progress);
  the no-execution-context-binding framing creates operational pain
  (unlikely given AgentClient precedent); the typed-FK self-approval
  comparison creates unintended escalation surfaces; the kernel-
  principal-resolver producer concentrates authority in a way that
  warrants splitting.

## Compliance

This ADR is Ring 0 docs-only at the ADR layer; the schema PR that
follows is a Ring 0 schema-change PR per `.agents/skills/hcs-schema-
change`. The schema PR also includes the follow-up `ApprovalGrant.
grantor_principal_ref` string-shape → typed-FK update (coordinated per
ADR 0051 v4 §Future amendments §`Principal` Ring 0 entity, single
slice). No cross-ring imports authored. No canonical policy YAML,
runtime probes, dashboard route React components, MCP adapter contracts,
hook bodies, charter invariant text changes, or Ring 1 mint API
implementation in this commit. Registry-side changes (per the 11-item
change-set in §Accepts) are bundled into this commit or a follow-on
docs commit referencing this ADR. Complies with implementation charter
v1.4.0.

**Implementation-detail acknowledgments** (per ADRs 0049-0053
precedents):

- `prior_audit_chain_link_hash` is NOT a schema field on the Principal
  record; it is an input to the `audit_chain_link_hash` canonical-
  concatenation computation at Ring 1 mint time. Chain-link continuity
  is enforced by Ring 1 storage on insert (Milestone 3 audit-events
  table).
- Genesis-collision defense for the same `principal_id` audit-chain
  root is a Milestone 3 audit-events table unique-constraint
  commitment.
- **Canonical-concatenation field-order convention** (length-prefix
  discipline inheritance): per the ADR 0051 v4 retroactive posture rule
  (now extended to ADRs 0049-0054), the `||` operator denotes length-
  prefix-encoded concatenation (`varint(byte_length) || field_bytes`).
  ADR 0054 places identity first (`principal_id`, `principal_kind`),
  followed by lifecycle (`principal_state`, `kernel_observed_at`,
  `valid_until`), followed by producer (`producer`), followed by
  evidence (`canonical(evidence_refs)`), followed by the chain link
  (`prior_audit_chain_link_hash`). The `'' for null` substitution rule
  applies to `valid_until`.
- `canonical(evidence_refs)` encoding is deferred to Ring 1 mint API;
  the schema commits the typed structure (array of `evidenceRefSchema`),
  and Ring 1 commits a deterministic serialization for hash-determinism
  that applies the length-prefix rule per element.
- **Principal-id canonicalization rule (NEW Ring 1 commitment; v2
  recipe strengthened per security B1)**: when
  `kernel_principal_resolver` mints a Principal record, the
  `principal_id` surface ID is canonicalized via the following
  ordered recipe before insertion:
  1. **Unicode NFC normalization** — combine canonical-equivalent
     code points (e.g., `'café'` U+00E9 vs `'café'` U+0065
     U+0301 collapse to identical bytes)
  2. **Unicode general-category `Cf` strip** — remove ALL characters
     in the Unicode `Cf` (Format Control) general category, including
     but not limited to: ZWSP (U+200B), ZWNJ (U+200C), ZWJ (U+200D),
     LRM (U+200E), RLM (U+200F), word joiner (U+2060), invisible
     times/separator/plus (U+2062-U+2064), LRI/RLI/FSI/PDI (U+2066-
     U+2069), BOM/ZWNBSP (U+FEFF), interlinear annotation anchors
     (U+FFF9-U+FFFB), soft-hyphen (U+00AD), Arabic format controls
     (U+0600-U+0605, U+061C, U+06DD, U+070F, U+0890-U+0891, U+08E2),
     Mongolian vowel separator (U+180E), bidirectional controls
     (U+202A-U+202E), and supplementary-plane Cf characters
  3. **Lowercase fold** — Unicode-aware lowercase folding (per
     Unicode case-folding tables; not ASCII tolower)
  4. **Leading/trailing-whitespace trim** — strip leading and
     trailing whitespace (Unicode `\p{White_Space}` category)
  5. The output is the canonicalized surface ID inserted into the
     Principal record's `principal_id` field

  This canonicalization is at MINT, not at COMPARE: the FK-equality
  comparison in self-approval rejection (per ADR 0051 v4) is then
  byte-equality on already-canonicalized IDs. The Cf-strip step (step
  2) **structurally closes** the ADR 0051 v4 MT-Sec-2 zero-width-
  character evasion surface because invisible format controls cannot
  survive into the surface ID — a producer that submits `'alice'` and
  `'al​ice'` both canonicalize to byte-identical `'alice'` after
  step 2. The canonicalization rule is registered in the ADD §Self-
  approval rejection rule registry section (change-set item 7 v2-
  reframed as ADD, not UPDATE — see ADR 0051 v4 cross-reference note
  in registry change-set).

  **Unicode version pinning (future amendment commitment)**: the Cf-
  category and case-folding tables vary across Unicode major versions.
  v2 commits to using the platform's built-in `String.prototype.
  normalize('NFC')` and Unicode-aware `String.prototype.toLowerCase()`
  at the Node.js LTS version pinned by the project's mise/Node config;
  Unicode version drift is a future-amendment concern recorded in
  §Future amendments §Unicode version pinning. Cross-deployment
  determinism is guaranteed when all kernel processes run the same
  pinned Node.js version.

  **TR39 confusable defense out of scope at v2 (security N2 deferral)**:
  the Cf-strip closes the invisibles surface. ASCII-vs-Cyrillic-
  homoglyph and broader Unicode confusable surfaces (e.g., `'alice'`
  ASCII vs `'аlice'` with Cyrillic-а U+0430) are NOT closed by the v2
  recipe. v2 reserves a future amendment to commit Unicode TR39
  skeleton normalization OR a stronger ASCII-only restriction on
  principal_id surface IDs, after operational evidence shows which
  posture matches the producer-side identity-binding sources. The v2
  defense is "no invisible-character evasion"; the future defense is
  "no homoglyph-substitution evasion."
- **Identity comparison form**: the typed-FK self-approval comparison
  (`ApprovalGrant.grantor_principal_ref == consuming_session.
  principal_id`) is **UUID-byte-equality** comparison (mirrors ADR 0052
  §Identity comparison form for session_id). Both fields are
  `entityIdSchema`-typed; the comparison is structural byte-identity,
  not the runtime Unicode/case/whitespace canonicalization-aware
  string-comparison form that ADR 0051 v4 originally specified for the
  v1 pre-Principal posture. The 4-step canonicalization recipe (NFC +
  `Cf`-category strip + Unicode-aware lowercase fold + leading/trailing
  whitespace trim per §Compliance §Principal-id canonicalization rule)
  survives upstream at Principal mint, not at comparison. The
  `Cf`-strip step (step 2 of the v2 recipe) structurally closes the
  ADR 0051 v4 MT-Sec-2 zero-width-character evasion that the v1 ADR
  0054 recipe (NFC + lowercase + whitespace trim only) inadvertently
  carried forward.
- **No execution-context binding rationale**: Principal identity is
  execution-context-independent at the entity layer (mirrors
  AgentClient). A human signing a git commit is the same human whether
  they invoke from a terminal, an IDE, or a dashboard. A service
  principal authenticated via OIDC is the same identity across different
  runner sessions. Binding evidence carries execution-context binding
  where the binding mechanism itself is context-bound (e.g., a
  `MachineIdentityBindingObservation` carries `execution_context_id`
  per inv. 19; the Principal record cites it via evidence_refs without
  inheriting the binding).

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md`
  v1.4.0 — invariants 1, 4, 5, 8, 17, 18, 19
- Decision ledger: `DECISIONS.md` (D-row to be added at acceptance)
- Related ADRs:
  - ADR 0019 v3 (chain-promotion rule; four-class `derived_from`
    closure; cycle-rejection in chain construction; synthetic-identity
    rejection grounding)
  - ADR 0023 (Ring 0 Evidence base entity; `Evidence.subject_kind:
    'principal'` already Zod-defined at `evidence.ts:23`)
  - ADR 0025 (Branch deletion proof; gateway-set
    `requesting_principal_id` from authenticated session; closes typed
    FK target with this ADR)
  - ADR 0034 (`GitIdentityBinding` direct Evidence subtype; human-
    principal binding-evidence source)
  - ADR 0036 (Q-009 workspace manifest projection; §Sub-decision (d)
    human-identity binding for cycle-history.md ratification; §Future
    amendments commit-signature-to-principal mapping deferred to future
    Q-row; closes typed FK target for verifier-identity binding with
    this ADR)
  - ADR 0037 (Q-010 cross-agent isolation; `kernel_agent_client_
    resolver` producer precedent; AgentClient typed-identity-envelope
    precedent that Principal mirrors)
  - ADR 0043 (Q-013 credential-plane evidence;
    `MachineIdentityBindingObservation` subtype; service-principal
    binding-evidence source)
  - ADR 0049 (Decision Ring 0 entity introduction; foundational-entity
    train precedent; D-037 producer-disjointness rule pattern)
  - ADR 0050 (WorkspaceContext Ring 0 entity introduction; typed-
    identity-envelope precedent that Principal mirrors most closely;
    `*StateSchema = z.enum(['active', 'retired'])` lifecycle pattern;
    named-enum-producer-schema pattern; same-record state ↔ valid_until
    correlation refinement; envelope-level kernel-set with field-level
    exceptions framing; cross-record refinement §Rejects pattern)
  - ADR 0051 v4 (ApprovalGrant Ring 0 entity introduction; §Self-
    approval rejection rule that this ADR closes typed-FK posture for;
    MT-Sec-2 zero-width-character evasion posture limitation that this
    ADR structurally closes; canonical-concatenation length-prefix
    discipline retroactive posture rule that this ADR inherits)
  - ADR 0052 (Lease Ring 0 entity introduction; UUID-byte-equality
    identity-comparison precedent for typed FKs; preemptive-absorption
    strategy)
  - ADR 0053 (Run Ring 0 entity introduction; same-record schema-level
    refinement precedent; envelope-only-kernel-set posture)
- Registry: `docs/host-capability-substrate/ontology-registry.md`
  v0.4.16 (current frontmatter; ADR 0054 reserves v0.4.17 pending docs
  commit). v2-verified line citations (Architect B2 + Policy B2
  absorption): §Authority discipline (line 279+), §ADR 0049–0053
  foundational Ring 0 entity field authority subsection (line 443),
  §Subject-kind grounding requirement (line 512), §Cross-context
  enforcement layer (line 615), §Audit-chain coverage of rejections
  (line 671), §Kernel-trusted producer allowlist final state (line
  867), §ADR 0049–0053 foundational Ring 0 entity enum mirrors
  section (line 2386; rename to ADR 0049–0054 per registry change-set
  item 9), §Naming-discipline §Sub-rule 9 enum-value casing (line 203 —
  `lower_snake_case` mandate for new enum values; `principalKindSchema`
  values comply). **§Self-approval rejection rule** does NOT exist as a
  discrete heading in v0.4.16; only narrative mentions at lines ~449
  (inside §ADR 0049–0053 foundational Ring 0 entity field authority)
  and ~2394 (inside §ADR 0049–0053 foundational Ring 0 entity enum
  mirrors); ADR 0054 change-set item 7 (v2-reframed as ADD) creates
  the discrete section.
- Workflow-sequencing investigation: `docs/host-capability-substrate/
  research/local/2026-05-10-workflow-sequencing-investigation.md`
  v0.1.2 (§Step 3 less-critical Ring 0 foundational entities entry
  for `Principal`)
- Outstanding-work sequencing workflow: `docs/host-capability-
  substrate/research/local/2026-05-09-outstanding-work-sequencing-
  workflow.md`
- Implementation rules: `IMPLEMENT.md` §Required subagent reviews,
  §Change classes
- Plan: `PLAN.md` §Current Focus (post-commit-`7fb7e05` rewrite; names
  Session + Principal as highest-coupling remaining M1 entities);
  §Milestone 1 acceptance (line 672+ — 22 canonical Ring 0 entities;
  Principal at position #3)
- Schema-change skill: `.agents/skills/hcs-schema-change/SKILL.md`
- Draft-ADR skill: `.agents/skills/hcs-draft-adr/SKILL.md`
- Live policy authoritative source (out-of-scope for this ADR; Phase
  2.5 lane): `~/Organizations/jefahnierocks/system-config/policies/
  host-capability-substrate/` — canonical commit-signature-to-principal
  mappings; per-`principal_kind` binding-evidence-verification rules;
  retirement-trigger rules; future-Q-row resolution rules per ADR 0036
  §Future amendments
- Schema source for related entities (just-landed via commit `7fb7e05`):
  - `packages/schemas/src/entities/evidence.ts:23` (`'principal'`
    already in `evidenceSubjectKindSchema`; this ADR does not modify
    the enum or bump `Evidence.schema_version`)
  - `packages/schemas/src/entities/agent-client.ts` (typed-identity-
    envelope precedent that Principal mirrors most closely; same
    `state: 'active' | 'retired'` lifecycle pattern)
  - `packages/schemas/src/entities/workspace-context.ts` (typed-
    identity-envelope precedent; same-record state ↔ valid_until
    correlation refinement; named-enum-producer-schema pattern)
  - `packages/schemas/src/entities/approval-grant.ts:130`
    (`grantor_principal_ref` currently `entityIdSchema` string-shape
    forward-reference; coordinated schema PR closes typed-FK posture
    alongside Principal landing)
  - `packages/schemas/src/entities/credential-plane-evidence.ts`
    (`MachineIdentityBindingObservation`; service-principal binding-
    evidence source)
  - `packages/schemas/src/entities/git-identity-binding.ts`
    (`GitIdentityBinding`; human-principal binding-evidence source)
- Currently-landed schemaVersion literals (11 distinct entity-specific
  literals + 1 sibling literal = 12 total per `grep -rn
  "SchemaVersionSchema = z" packages/schemas/src/entities/`): `evidence
  SchemaVersionSchema` (evidence.ts:9), `knowledgeSourceSchemaVersion
  Schema` (knowledge-source.ts:10), `operationShapeSchemaVersionSchema`
  (operation-shape.ts:4), `executionContextSchemaVersionSchema` (private
  const, execution-context.ts:5), `boundaryObservationSchemaVersion
  Schema` (boundary-observation.ts:13) + sibling
  `boundaryObservationEvidenceSchemaVersionSchema` (boundary-
  observation.ts:19), `credentialSourceSchemaVersionSchema` (private
  const, credential-source.ts:10), and the workflow-sequencing-
  investigation §Step 1 cohort landed at commit `7fb7e05`:
  `decisionSchemaVersionSchema` (decision.ts:7),
  `workspaceContextSchemaVersionSchema` (workspace-context.ts:9),
  `approvalGrantSchemaVersionSchema` (approval-grant.ts:6),
  `leaseSchemaVersionSchema` (lease.ts:5),
  `runSchemaVersionSchema` (run.ts:5). v1 ADR incorrectly counted 8;
  ontology B-1 at v1 review corrected to 11 + sibling.
  `principalSchemaVersionSchema` joins as the **twelfth** literal
  (counting the boundary-observation sibling) or eleventh-by-entity
  co-commitment.

### External

- None directly; this ADR composes existing internal posture.
