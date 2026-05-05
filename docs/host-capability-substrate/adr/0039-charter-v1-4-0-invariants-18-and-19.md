---
adr_number: 0039
title: Charter v1.4.0 amendment — invariants 18 (derived retrieval) + 19 (boundary claims)
status: accepted
date: 2026-05-04
charter_version: 1.3.2
tags: [charter, charter-amendment, invariant-18, invariant-19, derived-retrieval, boundary-claims, freshness, execution-context, phase-2]
---

# ADR 0039: Charter v1.4.0 amendment — invariants 18 + 19

## Status

accepted (v2 + 3 mechanical tweaks at acceptance)

## Date

2026-05-04 (v1, draft); 2026-05-04 (v2, substantive expansion of
invariant text per security review + abstract-vocabulary bridge per
policy review + framing precision per ontology review + editorial
folds per architect review); 2026-05-04 (v2 accepted with 3
mechanical tweaks at acceptance).

## Acceptance note

All four reviewers (`hcs-architect`, `hcs-policy-reviewer`,
`hcs-security-reviewer`, `hcs-ontology-reviewer`) returned
READY-FOR-ACCEPTANCE on v2. The synthesis-window v1 → v2 cycle
closed all 12 v1 blockers (5 security + 4 ontology + 3 policy)
without forcing one-pass convergence per the user's drafting
Guardrail 3 ("Plan for v3 explicitly, don't promise v2
convergence").

Three mechanical tweaks were folded at acceptance to close
non-blocking observations:

1. **Ont-N11 (CoordinationFact `derived_from` precision).**
   Charter inv. 18 text and ADR §Charter-committed semantics #3
   corrected to scope the closed-`derived_from`-membership rule
   to `DerivedSummary` only, matching ADR 0019 v3's chain-
   promotion rule (which is specifically about
   `DerivedSummary.derived_from`). Per ADR 0019 v3 §CoordinationFact
   domain shape (lines 511-587), `CoordinationFact` carries
   `evidence_refs` (constrained to `Evidence` records only), not
   `derived_from`; the v2 wording incorrectly grouped the two
   entities. Fix: changed "Records carrying a `derived_from`
   graph (`CoordinationFact` and `DerivedSummary`)" to
   "`DerivedSummary` records restrict their `derived_from`
   graph to references of typed `Evidence`, `CoordinationFact`,
   `DerivedSummary`, and `KnowledgeChunk` records only" with a
   parenthetical noting `CoordinationFact.evidence_refs` is
   structurally constrained by its domain shape.

2. **Arch-N13 (surface enumeration idiom parallelism).** Inv. 19
   text "or other surfaces" → "or any other surface" for parallel
   structure with charter v1.3.2 line 140 forbidden-pattern entry
   idiom ("or any equivalent operator"). Tighter open-enumeration
   phrasing.

3. **Arch-N11 (posture-commitment count alignment).** Charter
   v1.4.0 changelog entry posture-commitments enumeration
   aligned with §Posture commitments 4-item list (was 3 with
   conflated typed-grant entity-name + minting-layer-rejection;
   now 4 explicit items).

Sixteen forward-looking non-blocking observations across the four
reviewers are documented in §Forward-looking observations for
absorption at downstream PRs (Phase 2.1.x, Phase 2.2.3, Phase
2.5, Phase 2.6, future glossary cleanup, registry update PR,
wave-2 reactive amendment). They do not block this PR's scope.

Two security partial closures (Sec-B1 Layer 2/3 re-derive timing;
Sec-B3 `valid_until` per-dimension max-window) are aligned with
the user's drafting Guardrail 1 (charter-committed semantics vs
ADR-elaborated mechanics partition); both reviewers explicitly
state they do not compel v3. Operational backstop is the Phase
2.6 trap fixture corpus per ADR 0038.

## Revision history

- **v1 (2026-05-04)**: initial draft per ADR 0038 §Phase 2.0
  sequencing. Verbatim-or-near-verbatim invariant text from ADR
  0019 v3 §Sub-decision (e) (inv. 18) and ADR 0034 v2 §Sub-decision
  (f) (inv. 19). Returned READY-FOR-ACCEPTANCE from architect; 3
  NEEDS-REVISION from security (5 blockers), ontology (4 blockers),
  policy (3 blockers).

- **v2 (2026-05-04)**: substantive expansion of invariant text to
  preserve source-ADR semantic commitments per security review;
  abstract-vocabulary bridge applied recursively per policy
  review; registry §3 framing precision per ontology review;
  editorial enumeration per architect review. Designed to
  converge v2 structurally; if v2 surfaces fresh tensions on the
  new tightenings, expect v3 rather than forcing one-pass
  convergence.

  - **Sec-B1** (mutation-after-cite laundering window) — folded
    as **operational mechanic** in §ADR-elaborated mechanics
    (Layer 2/3 re-derive timing belongs to mint API / broker FSM
    / gateway implementation, not invariant text). Invariant 18
    text adjusted to reference the typed-grant minting layer and
    typed-grant-consuming layer abstractly so the layer-walk
    composition is implicit; ADR 0019 v3 §Chain promotion rule
    lines 638-662 retains the operational detail.

  - **Sec-B2** (closed `derived_from` membership) — folded as
    **charter-committed semantic** in invariant 18 text. The
    `derived_from` graph is restricted to typed Evidence,
    CoordinationFact, DerivedSummary, and KnowledgeChunk
    references; references to Run, Decision, Lease, or other
    Ring 0 records in `derived_from` are forbidden. Closes the
    Run/Decision/Lease laundering-layer surface that would
    otherwise let chain-walk terminate prematurely.

  - **Sec-B3** (`valid_until` bounding by `observed_at + max-window`)
    — folded as **operational mechanic** in §ADR-elaborated
    mechanics. Per-`boundary_dimension` maximum windows are
    canonical-policy-YAML scope per ADR 0035 v2 §Acceptance note
    + ADR 0038 §Phase 2.5; charter invariant text references
    only the principle ("freshness-bound") without bundling
    numeric windows.

  - **Sec-B4** (kernel-set discipline for execution-context
    binding fields) — folded as **charter-committed semantic**
    in invariant 19 text. The five binding fields are kernel-set
    per registry v0.3.2 §Producer-vs-kernel-set; producer-supplied
    values are rejected at the typed-grant minting layer.

  - **Sec-B5** (payload-level freshness anchors inherit envelope
    binding) — folded as **charter-committed semantic** in
    invariant 19 text. Payload-level freshness anchors (e.g.,
    `provider_verified_at`, `last_health_check_at`) inherit the
    envelope's execution-context binding and are bounded by the
    envelope's `valid_until`.

  - **Ont-B1** (`self-asserted` enum forward-reference) — folded
    as **disclosure** in §Posture commitments (the actual
    `evidenceAuthoritySchema` enum extension lands in a separate
    schema-change PR per `.agents/skills/hcs-schema-change`;
    until then, `self-asserted` is registry-canonical only per
    registry v0.3.3 §Authority discipline). Invariant text retains
    the reference; CI gate construction is sequenced behind the
    enum extension.

  - **Ont-B2** (`valid_until` envelope tightening over base
    Evidence nullable) — folded as **disclosure** in §Posture
    commitments + §Charter changes. Invariant 19's "must carry
    `valid_until`" tightens base `Evidence.valid_until`'s
    `nullable()` shape for the BoundaryObservation envelope and
    related Evidence subtype envelopes; Phase 2.2.3 encodes the
    non-null requirement.

  - **Ont-B3** (registry §3 "primary target reference" framing) —
    folded as **framing precision**. The ADR's §Invariant 19 text
    annotation now reads "registry §3 enumerates as available
    primary or supplemental target references" rather than
    importing per-dimension "primary" semantics onto the
    invariant level.

  - **Ont-B4 / Arch-N1** (text drift not fully enumerated) —
    folded as **framing precision**. The §Invariant 19 text
    annotation now lists all four textual changes from ADR 0034
    v2 source: (a) trailing-period normalization; (b) explicit
    naming of all five binding fields; (c) "envelope" matches
    ADR 0022 envelope vocabulary; (d) "at least one" matches
    registry v0.3.3 §3 + the existing
    `boundaryObservationSchema.refine(...)` clause language.

  - **Pol-B1** (posture-only-during-deferral disclaimer) —
    folded as **permanent disclosure** in §Posture commitments
    + v1.4.0 change log entry. Per Guardrail 2: posture
    commitments are a permanent feature of charter wave-1, not
    a temporary patch. The change log entry explicitly
    distinguishes charter-committed semantics (binding now;
    schema must conform when it lands) from posture
    commitments (describing future operational behavior;
    operationally enforceable once Phase 2.1.4 / 2.2.3 schema
    PRs land).

  - **Pol-B2** (envelope `valid_until` field absent at v1.4.0
    landing) — folded as **disclosure**. Same root as Ont-B2;
    handled by §Posture commitments + §Charter changes.

  - **Pol-B3** (promotion grant entity name reserved) — folded
    as **abstract vocabulary** per Guardrail 3. Invariant 18
    text uses functional/role language ("the typed grant
    authorizing allowed_for_gate transitions") throughout
    rather than naming the unsettled entity. Future-proofs
    against the grant-naming follow-up ADR.

  - **Arch-N2** (inv. 18 source attribution) — folded as
    citation expansion. §Invariant 18 text annotation now
    credits §`allowed_for_gate` discipline (lines 588-602) +
    §Sub-decision (e) (lines 196-201) + §Chain promotion rule
    (lines 638-662).

  - **Arch-N3** (inv. 19 ↔ inv. 16 composition novel) — folded
    as **explicit extension**. §Composition with existing
    invariants now states "extends ADR 0034 v2's composition
    list with inv. 16, since boundary observations against
    external control planes are exactly the inv. 16 typed-
    evidence territory" with reference to ADR 0015's
    `OriginAccessValidator` / `AudienceValidationBinding`
    precedent.

  - **Arch-N4** (inv. 18 ↔ inv. 4 composition thin) — folded
    as composition refinement; cites ADR 0019 v3 §Promotion
    audit-record completeness lines 752-780.

  - **Arch-N5** (IMPLEMENT.md update enumerated) — folded.
    §Charter changes now lists the IMPLEMENT.md citation-
    version update as a fourth item.

  - **Arch-N6** (six-question discipline doesn't apply) —
    folded as **explicit out-of-scope statement** in §Out of
    scope.

  - **Arch-N7** (re-review trigger broadening) — folded.
    §Future amendments §Re-review of inv. 19 now reads "if the
    registration-rules registry §3 list of binding fields
    changes (added, removed, merged, or renamed) beyond the
    current five."

  - **Arch-N8** (citation accuracy) — folded. §References
    refined: ADR 0022 (BoundaryObservation envelope), ADR 0036
    v2 (`mcp_canonical_authority` + `filesystem_*` payload
    variants), ADR 0037 v2 (remote-agent + containment payload
    variants); collectively constitute the Phase 2.2.3
    BoundaryObservation payload bundle that Zod-encodes inv.
    19.

  - **Arch-N9** (wave-2 deferral framing) — folded as
    acknowledgement. §Future amendments now notes the wave-2
    ADR may be reactive (post-merge review on Phase 2.1.4 /
    2.2.3 schema PRs surfaces gaps) rather than scheduled,
    matching ADR 0024's reactive cadence.

  - **Recommended traps** from all three NEEDS-REVISION
    reviewers (Sec 1-9; Pol 1-18; Ont 1-4) deferred to Phase
    2.6 trap-fixture PR per ADR 0038. Invariant text changes
    expose new trap surfaces (e.g., closed `derived_from`
    membership rejection, kernel-set binding-field forgery
    rejection, payload-level freshness escape rejection); these
    enrich the Phase 2.6 fixture inventory documented in
    `project_phase_2_queue.md`.

## Charter version

Written against charter v1.3.2. Authorizes the v1.4.0 amendment
landing in this same PR per ADR 0024 wave-3 prospective-amendment
precedent.

## Context

ADR 0038 §Phase 2.0 sequences this charter amendment as the first
PR in Phase 2 schema-landing work. Invariants 18 and 19 will be
encoded as Zod refinements on `QualityGate` (Phase 2.1.4 per
ADR 0035) and on the `BoundaryObservation` payload bundle
(Phase 2.2.3 per ADRs 0036 / 0037). Encoding Zod refinements
before the charter states the corresponding invariants inverts
the authority direction (schema asserts; charter follows) and
contradicts charter §Change policy. The Phase 2.0 PR therefore
authorizes the invariant text **first**; schema enforcement
follows in Phases 2.1.4 / 2.2.3.

Both invariants were operationalized as ADR-level posture during
the Phase 1 synthesis-window:

- **Invariant 18 candidate** — Q-003 / ADR 0019 v3 §Sub-decision
  (e) (lines 196-201) drafted the candidate text;
  §`allowed_for_gate` discipline (lines 588-602, 632-636)
  operationalized it for `CoordinationFact` and `DerivedSummary`;
  §Chain promotion rule (lines 638-662) tightened the rule at v3
  (Policy B2 closure) to forbid promotion of summaries whose
  `derived_from` graph contains any `KnowledgeChunk` (since
  retrieval-derived content is never gate authority).

- **Invariant 19 candidate** — Q-007 / ADR 0034 v2 §Sub-decision
  (f) (lines 731-784) drafted the candidate text; §Authority
  discipline (lines 788-805) + §Cross-context binding rules per
  Ring 1 layer (lines 808-823) operationalized it for
  `BoundaryObservation` and the new `GitIdentityBinding` /
  `ToolProvenance` direct Evidence subtypes. Linked-observation
  discipline (lateral context reuse requires fresh observation,
  not substitution) was tightened at v2 acceptance.

ADR 0021 originally queued invariants 18 + 19 + 20 behind their
parent Q-rows. Q-003 (inv. 18) and Q-007 (inv. 19) closed in the
synthesis-window. Q-008 (inv. 20: "command symptoms are not
diagnoses") closed via ADR 0029 v2 + ADR 0031 v1, but its
operationalization sits at the policy / matrix layer rather than
at the Ring 0 entity-shape layer — its charter promotion is
deferred to a future wave (see §Future amendments).

This ADR is **charter-and-bookkeeping-only** per ADR 0021 / ADR
0024 precedent. It does not author Zod schemas, JSON Schema,
canonical policy YAML, MCP adapter contracts, dashboard routes,
or trap fixtures. It does, however, expand the charter invariant
text to faithfully encode the load-bearing semantic commitments
of ADR 0019 v3 + ADR 0034 v2 — a thinner version that strips
those commitments would create a charter-discipline regression
where the source ADRs are stronger references than the charter
that elevates them.

## Options considered

### Option A: Land both invariants together in v1.4.0 wave (RECOMMENDED)

Single ADR + single charter edit; both invariants ship together.

**Pros:**
- Matches ADR 0038 §Phase 2.0 single-PR sequencing.
- Both invariants share the v1.4.0 amendment cadence; both have
  ADR-level posture commitments closed in the synthesis-window.
- Reduces administrative churn (one charter version bump, one
  reviewer pass, one acceptance cycle).
- Both invariants compose with existing inv. 6, 7, 8, 16, 17
  consistently (per ADR 0034 v2 §Composition with existing
  invariants and ADR 0019 v3 §Cross-context binding rules).

**Cons:**
- Couples two independent invariant votes; if reviewers reject
  one, the other still has to land (partial-acceptance carve-out
  per ADR 0021 §Partial acceptance pattern).
- Single PR slightly larger than two narrower PRs.

### Option B: Land only inv. 18, defer inv. 19

Inv. 18 ships in v1.4.0; inv. 19 deferred to v1.5.0 or later.

**Pros / Cons:** Symmetric to Option C. See common analysis below.

### Option C: Land only inv. 19, defer inv. 18

Inv. 19 ships in v1.4.0; inv. 18 deferred to v1.5.0 or later.

**Common Pros (B + C):**
- Smallest possible PR.
- Lets each invariant receive independent review.

**Common Cons (B + C):**
- The deferred invariant's downstream phase (Phase 2.1.4 for B;
  Phase 2.2.3 for C) cannot encode its Zod refinement at landing
  — forces a follow-up refinement PR after the deferred invariant
  lands.
- Both invariants are equally settled at the ADR level; no
  technical reason to split them.
- Doubles administrative overhead (two charter PRs instead of
  one).
- A future structural option exists (split into two parallel
  ADRs, each with its own charter version path) but is reserved
  per §Future amendments A4; preemptive split is not justified.

### Option D: Defer both to a later wave

No v1.4.0 amendment in this PR; both invariants stay at ADR-level
posture only.

**Pros:**
- Zero charter churn during Phase 2.

**Cons:**
- Phase 2.1.4 + Phase 2.2.3 cannot encode invariants in Zod
  refinements without inverting the authority direction (schema
  asserts; charter follows).
- Forces ad-hoc workarounds at schema PR time (name-string-based
  refinements with promote-to-typed-FK follow-ups).
- Contradicts ADR 0038 §Phase 2.0 explicit sequencing.

## Decision

Choose Option A. Charter v1.4.0 lands invariants 18 + 19 together
in this PR. Charter version bumps from 1.3.2 to 1.4.0.

The invariant text encodes **charter-committed semantics**
(load-bearing now; schemas must conform when they land) and
**posture commitments** (describing future operational behavior;
operationally enforceable once Phase 2.1.4 / 2.2.3 schema PRs
land). Both classes are charter-binding text; the distinction
clarifies the *enforcement window* without weakening the
authority of either class.

If reviewers return blocking objections on only one of the two
invariants, ADR 0021 §Partial acceptance precedent applies: the
charter PR may land only the accepted invariant, with the other
deferred to a later wave.

### Charter-committed semantics vs ADR-elaborated mechanics

Per the v2 drafting guardrail "distinguish charter-committed
semantics from ADR-elaborated mechanics," the invariant text
encodes the load-bearing semantic commitments of the source ADRs.
Operational mechanics (timing, numeric windows, layer-walk
implementation details) are **not** in the invariant text; they
remain in the source ADRs and will be operationalized at schema /
canonical-policy / Zod-refinement layers.

**Charter-committed semantics encoded in inv. 18 text:**

1. Gates consume only typed Evidence or CoordinationFact records
   with kernel-set `allowed_for_gate: true`. (Source: ADR 0019 v3
   §Sub-decision (e) line 196-201; §`allowed_for_gate` discipline
   line 588-602.)
2. KnowledgeChunk records are never gate authority directly.
   (Source: ADR 0019 v3 §`KnowledgeChunk` `allowed_for_gate` rule
   lines 479-481.)
3. `DerivedSummary` records restrict their `derived_from` graph
   to references of typed Evidence, CoordinationFact,
   DerivedSummary, and KnowledgeChunk records only; references to
   Run, Decision, Lease, or other Ring 0 records in `derived_from`
   are forbidden. (`CoordinationFact.evidence_refs` is
   structurally constrained to `Evidence` records by its domain
   shape per ADR 0019 v3 lines 551-559 and inherits the same
   closed-membership posture.) (Source: ADR 0019 v3
   §`DerivedSummary` domain shape lines 608-630, derived from the
   chain-promotion rule's coverage at lines 638-662; Ont-N11
   precision tweak at acceptance.)
4. The typed grant authorizing `allowed_for_gate` transitions is
   rejected when the candidate's `derived_from` graph
   (transitively at any depth) contains any of the four
   forbidden-ancestor classes. (Source: ADR 0019 v3 §Chain
   promotion rule lines 638-662.)

**ADR-elaborated mechanics deferred to schema / canonical policy
/ Zod refinement layers:**

- Layer 1 mint API graph-walk implementation details, traversal
  cycle detection, and traversal depth bounds — Phase 2.1.3
  schema PR + Phase 2.1.4 QualityGate Zod refinement +
  canonical policy YAML at Phase 2.5.
- Layer 2 broker FSM re-derivation cadence and Layer 3 gateway
  re-derive authoritative-cycle timing (ADR 0019 v3 line 659-662)
  — Ring 1 broker / gateway implementation; out of scope for
  Ring 0 charter text.
- Promotion-grant audit-record completeness fields (ADR 0019 v3
  Security B-3 closure, lines 752-780) — Phase 2.1.3 +
  Decision/audit infrastructure ADRs.

**Charter-committed semantics encoded in inv. 19 text:**

1. Every BoundaryObservation envelope and every related Evidence
   subtype envelope carries a non-null `valid_until` and at
   least one execution-context binding (one of five fields).
   (Source: ADR 0034 v2 §Sub-decision (f) lines 738-753.)
2. The five execution-context binding fields are kernel-set;
   producer-supplied values for these fields are rejected at the
   typed-grant minting layer. (Source: ADR 0034 v2 §Authority
   discipline lines 793-797 + registry v0.3.2 §Producer-vs-
   kernel-set.)
3. Payload-level freshness anchors (e.g., `provider_verified_at`,
   `last_health_check_at`) inherit the envelope's execution-
   context binding and are bounded by the envelope's
   `valid_until`. (Source: ADR 0034 v2 §Authority discipline
   lines 793-794 [kernel-set freshness fields]; §Charter inv.
   17/18-candidate/19-candidate freshness-precedence rule lines
   841-854.)
4. Contradictory, missing, and stale boundary evidence are
   distinct states; none promote to false negatives or
   unknown-as-false. (Source: ADR 0034 v2 §Sub-decision (f) lines
   746-748.)
5. Boundary inference cannot cross macOS app, shell,
   package-manager, Git/GitHub, MCP, or other surfaces without a
   matching observed context record; the named surface
   enumeration is an authority floor, not a ceiling. (Source:
   ADR 0034 v2 §Sub-decision (f) lines 748-750; "authority floor
   not ceiling" idiom from charter v1.3.2 forbidden-pattern
   entry at line 136.)
6. Linked BoundaryObservation records sharing target references
   may represent multi-surface facts; lateral context reuse
   (borrowing evidence from an unrelated context) requires fresh
   observation, not substitution. (Source: ADR 0034 v2 §Sub-
   decision (f) lines 750-754.)

**ADR-elaborated mechanics deferred to schema / canonical policy
/ Zod refinement layers:**

- Per-`boundary_dimension` `valid_until` maximum windows (e.g.,
  containment dimension hours-to-day order per ADR 0037) —
  canonical policy YAML at Phase 2.5; out of scope for charter
  invariant text per ADR 0035 v2 §Acceptance note (Milestone 2
  policy authoring).
- Specific Zod schema field definitions (envelope-level
  `valid_until` non-null requirement; per-payload freshness
  anchor types; cross-context binding `.refine()` rule
  expansion) — Phase 2.2.3 schema PR.
- Layer 1 mint API rejection `Decision.reason_kind` enum values
  for inv. 19 violations — registry update PR at Phase 2.4 +
  Phase 2.2.3 schema PR.

### Posture commitments

Per the v2 drafting guardrail "disclosure notes are part of the
structure, not workarounds," the charter v1.4.0 wave-1 invariant
text contains posture commitments — text describing future
operational behavior whose operational enforcement is not yet
live. Posture commitments are **charter-binding text** (they
constrain implementation) and are NOT mechanical placeholders.
The "operationally enforceable once schema lands" framing is
permanent, not temporary.

Specific posture commitments in v1.4.0 invariant text:

- Inv. 18 references **the typed grant authorizing
  `allowed_for_gate` transitions**. The grant entity's name is
  reserved per ADR 0019 v3 §Promotion workflow shape lines
  688-696 (candidate names: PromotionGrant, CoordinationGrant,
  VerificationGrant; final selection per ontology review).
  Charter inv. 18 uses functional vocabulary (the role) rather
  than naming the entity, future-proofing against the
  grant-naming follow-up ADR. When that ADR lands, no charter
  amendment is required to track the entity name.

- Inv. 18 references **`authority: self-asserted`** as a
  forbidden-ancestor class. The actual `evidenceAuthoritySchema`
  enum extension lands in a separate schema-change PR per
  `.agents/skills/hcs-schema-change`; until then,
  `self-asserted` is registry-canonical only per registry v0.3.3
  §Authority discipline lines 318-343. Inv. 18's `self-asserted`
  clause is operationally unreachable until the enum extension
  PR lands (any test fixture trying to construct an Evidence
  record with `authority: 'self-asserted'` fails at Zod parsing
  rather than at the chain-walk rejection layer); the charter
  binds the rule, the enum extension PR makes it operationally
  enforceable.

- Inv. 19 says BoundaryObservation envelopes "carry a non-null
  `valid_until`." The current `boundaryObservationSchema`
  (`packages/schemas/src/entities/boundary-observation.ts`) does
  NOT carry `valid_until` as a top-level field; freshness is
  currently carried indirectly via `evidence_refs`. Phase 2.2.3
  encodes the envelope-level non-null `valid_until` requirement,
  tightening base `Evidence.valid_until`'s `nullable()` shape
  (`packages/schemas/src/entities/evidence.ts` line 73) for the
  BoundaryObservation envelope and related Evidence subtype
  envelopes.

- Inv. 18 + inv. 19 reference **the typed-grant minting layer**
  rejection behavior. Layer-walk implementation timing (Layer 1
  graph-walk + Layer 2 broker FSM re-check + Layer 3 gateway
  re-derive per ADR 0019 v3 lines 659-662) is operational
  mechanics, not invariant text; the invariant binds the rule
  ("rejected when..."), the implementation PRs at Phase 2.1.4 /
  2.2.3 + Ring 1 broker / gateway materialize the layer-walk.

### Invariant 18 text (accepted v2 + Ont-N11 mechanical tweak)

```text
18. Derived retrieval results are never decision authority. Gates
consume only typed Evidence or CoordinationFact records with
kernel-set allowed_for_gate: true. KnowledgeChunk records
(retrieval-derived content) are never gate authority directly.
DerivedSummary records restrict their derived_from graph to
references of typed Evidence, CoordinationFact, DerivedSummary,
and KnowledgeChunk records only; references to Run, Decision,
Lease, or other Ring 0 record kinds in derived_from are
forbidden. (CoordinationFact.evidence_refs is structurally
constrained to Evidence records by its domain shape and inherits
the same closed-membership posture.) The typed grant authorizing
allowed_for_gate transitions is rejected when the candidate's
derived_from graph (transitively at any depth) contains an
unpromoted DerivedSummary, an unpromoted CoordinationFact, an
Evidence record with authority: sandbox-observation or authority:
self-asserted, or any KnowledgeChunk reference.
```

**Source attribution:** ADR 0019 v3 §`allowed_for_gate`
discipline (lines 588-602, 632-636) + §Sub-decision (e)
(lines 196-201) + §Chain promotion rule (lines 638-662, the
Policy B2 closure at v3) + §`KnowledgeChunk` `allowed_for_gate`
rule (lines 479-481). The "closed `derived_from` membership"
sentence is new in v2 to close the security-reviewer-identified
Run/Decision/Lease laundering surface; the underlying constraint
is implicit in ADR 0019 v3's domain shape (line 611-613:
"`derived_from` — array of `evidenceRefSchema` references to
source `Evidence` / `CoordinationFact` / `KnowledgeChunk` records")
and the chain-promotion rule's enumerated coverage. The
"DerivedSummary" addition to the closed list reflects ADR 0019
v3's chain-promotion language at line 645 ("an unpromoted
`DerivedSummary` at any depth") which implies DerivedSummary may
appear in `derived_from` graphs.

### Invariant 19 text (accepted v2 + Arch-N13 mechanical tweak)

```text
19. Boundary claims are freshness-bound and execution-context-
bound. Every BoundaryObservation envelope and every related
Evidence subtype envelope carries a non-null valid_until and at
least one execution-context binding (execution_context_id,
surface_id, workspace_id, credential_source_id, or
tool_or_provider_ref). The execution-context binding fields are
kernel-set; producer-supplied values for these fields are
rejected at the typed-grant minting layer. Payload-level
freshness anchors (e.g., provider_verified_at,
last_health_check_at) inherit the envelope's execution-context
binding and are bounded by the envelope's valid_until. HCS must
model contradictory, missing, and stale boundary evidence as
distinct states; none of them promote to false negatives or
unknown-as-false. Boundary inference cannot cross macOS app,
shell, package-manager, Git/GitHub, MCP, or any other surface
without a matching observed context record; the named surface
enumeration is an authority floor, not a ceiling. Linked
BoundaryObservation records sharing target references may
represent multi-surface facts; lateral context reuse (borrowing
evidence from an unrelated context) requires fresh observation,
not substitution.
```

**Source attribution:** ADR 0034 v2 §Sub-decision (f)
(lines 738-753) + §Authority discipline (lines 793-797 [kernel-
set discipline], lines 793-794 [payload-level freshness anchor
naming]) + §Cross-context binding rules per Ring 1 layer
(lines 808-823) + §Charter inv. 17/18-candidate/19-candidate
freshness-precedence rule (lines 841-854).

**Text drift from ADR 0034 v2 source enumerated:**

(a) Trailing-period normalization.

(b) Explicit naming of all five execution-context binding fields.
Registry v0.3.3 §Registration rules §3 (lines 49-54) enumerates
five fields as available primary or supplemental target
references; ADR 0034 v2 §Sub-decision (f) named four. v2 adds
`tool_or_provider_ref` to match the registry §3 enumeration
without importing per-dimension "primary" semantics onto the
invariant level (per ontology review B-3 framing precision).

(c) "BoundaryObservation envelope" matches ADR 0022 envelope
vocabulary (ADR 0034 v2 source said "BoundaryObservation"; v2
specifies "envelope" so the inv. 19 scope is unambiguous given
the envelope-vs-payload distinction codified by ADR 0022).

(d) "At least one" matches registry v0.3.3 §3 + the existing
`boundaryObservationSchema.refine(...)` clause language at
`packages/schemas/src/entities/boundary-observation.ts` lines
65-79. ADR 0034 v2 source said "an execution-context binding"
which is functionally identical to "at least one"; v2 makes the
multiplicity explicit.

(e) **NEW IN v2**: "kernel-set; producer-supplied values for
these fields are rejected at the typed-grant minting layer"
sentence added to encode ADR 0034 v2 §Authority discipline
lines 793-797's kernel-set commitment. This is charter-committed
semantic content that the source ADR commits but the v1
candidate text truncated.

(f) **NEW IN v2**: "Payload-level freshness anchors (e.g.,
`provider_verified_at`, `last_health_check_at`) inherit the
envelope's execution-context binding and are bounded by the
envelope's `valid_until`" sentence added to close the payload-
vs-envelope freshness scope ambiguity per security review B-5.

(g) **NEW IN v2**: "or other surfaces" + "the named surface
enumeration is an authority floor, not a ceiling" added to
prevent the closed-enumeration misreading flagged by security
review N6, mirroring the "authority floor not ceiling" idiom
already present in charter v1.3.2 forbidden-pattern entry
(line 136).

### Composition with existing invariants

**Invariant 18 composes with:**

- **inv. 1** (no policy in adapter): inv. 18 is enforced at the
  typed-grant minting layer (Ring 1 mint API + graph-walk + Ring
  1 gateway re-derive), not in adapters. Consistent.

- **inv. 4** (audit logging is internal side-effect): typed-grant
  records authorizing `allowed_for_gate` transitions are audited
  with `agent_client_id`, `session_id`, `promotion_layer`,
  candidate `evidence_id`, `verification_evidence_refs`, and
  resulting grant identifier per ADR 0019 v3 §Promotion audit-
  record completeness (lines 752-780); audit-write tools remain
  non-agent-callable. Consistent and load-bearing for inv. 18's
  Layer 3 gateway re-derive cycle.

- **inv. 6** (forbidden tier non-escalable): rejection of an
  unpromoted record's authority elevation cannot be approved via
  grant. Consistent.

- **inv. 7** (execution lane full stack): typed-grant records
  authorizing transitions flow through ApprovalGrant
  infrastructure when approval surfaces exist (Milestone 2+);
  inv. 18 does not bypass this. Consistent.

- **inv. 8** (sandbox no promotion): inv. 18 generalizes the
  sandbox-observation non-promotion pattern to retrieval-derived
  and agent-authored aggregation; the chain-walk's
  `authority: sandbox-observation` rejection clause is the direct
  manifestation. Consistent and complementary.

- **inv. 17** (execution context declared): records carrying
  `derived_from` graphs participate in cross-context binding
  rules per registry v0.3.0 §Cross-context enforcement layer.
  Consistent.

**Invariant 19 composes with:**

- **inv. 1** (no policy in adapter): freshness/context-binding
  enforcement lives in Ring 0 schema + Ring 1 mint/gateway, not
  in adapters. Consistent.

- **inv. 6** (forbidden tier non-escalable): contradictory or
  stale boundary evidence on destructive-class operations maps
  to `block` in the degrade-to-warn matrix per ADR 0034 v2.
  Consistent.

- **inv. 7** (execution lane full stack): boundary evidence
  gates destructive operations only when the full stack exists.
  Consistent.

- **inv. 8** (sandbox no promotion): sandbox-sourced boundary
  observations carry `authority: sandbox-observation` and cannot
  clear `approval_required` cells per ADR 0029 v2 + ADR 0034 v2.
  Inv. 19's "kernel-set binding fields" sentence does not affect
  inv. 8's coverage; sandbox-sourced observations remain blocked
  on the authority dimension regardless of whether their binding
  fields are well-formed. Consistent.

- **inv. 16** (external-control-plane evidence-first): inv. 19
  generalizes the typed-evidence requirement to all boundary
  observations, not just provider-side mutations. **Extends ADR
  0034 v2's composition list with inv. 16**, since boundary
  observations against external control planes are exactly the
  inv. 16 typed-evidence territory (per ADR 0015's
  `OriginAccessValidator` / `AudienceValidationBinding`
  precedent). Consistent and complementary; the inv. 19 ↔ inv.
  16 composition was operationalized at ADR 0034 v2 review time
  but not enumerated in ADR 0034 v2 §Composition.

- **inv. 17** (execution context declared): inv. 19 generalizes
  inv. 17 from `ExecutionContext` records to all boundary
  observations and related Evidence subtype envelopes.
  Consistent and complementary.

**Invariants 18 and 19 compose with each other:**

A QualityGate consuming a BoundaryObservation envelope (inv. 19
target) via `evidence_refs` is itself subject to inv. 18 (derived
retrieval ≠ gate authority). The Phase 2.1.4 QualityGate Zod
refinement type-references both rule sets: it walks
`evidence_refs` chains looking for `KnowledgeChunk` /
unpromoted `DerivedSummary` references (inv. 18) AND validates
that referenced BoundaryObservation records carry `valid_until`
+ execution-context binding (inv. 19). The composition surfaces
a regression-trap candidate at Phase 2.6: a QualityGate whose
`evidence_refs` contains a BoundaryObservation whose
`evidence_refs` contains an Evidence record whose `derived_from`
contains a KnowledgeChunk should be rejected (graph-walk through
both rule sets reaches the KnowledgeChunk).

### Charter changes

This PR amends the charter as follows:

1. **Frontmatter:** `version: 1.3.2 → 1.4.0`; `last_updated:
   2026-05-02 → 2026-05-04`.

2. **§Non-negotiable invariants:** Append invariants 18 + 19 with
   the proposed v2 text above. Each entry carries the
   *(added in v1.4.0)* parenthetical per the v1.1.0+ convention.

3. **§Change log:** Add a v1.4.0 entry citing this ADR;
   summarizing the two invariants; explicitly distinguishing
   charter-committed semantics (binding now; schemas must conform
   when they land) from posture commitments (describing future
   operational behavior; operationally enforceable once Phase
   2.1.4 / 2.2.3 schema PRs land); and noting the v1.4.x wave-2
   ADR will be reactive (post-merge review on Phase 2.1.4 / 2.2.3
   schema PRs surfaces gaps), matching ADR 0024's reactive
   cadence rather than a scheduled wave.

4. **§How to cite this charter:** Update the example citation
   from `v1.3.2` to `v1.4.0`.

In `IMPLEMENT.md`:

5. **§Required subagent reviews:** Update the citation version
   from `Per charter v1.3.2:` to `Per charter v1.4.0:`. This is
   citation-version maintenance; in-scope for charter-and-
   bookkeeping-only by parallel to charter §How to cite this
   charter example.

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

## Consequences

### Accepts

- Inv. 18 (derived retrieval ≠ gate authority) and inv. 19
  (boundary claims freshness/context-bound) become binding
  charter language rather than only ADR-level posture.
- Charter v1.4.0 invariant text is a faithful encoder of ADR
  0019 v3 + ADR 0034 v2 load-bearing semantic commitments;
  charter-discipline is preserved (charter is not weaker than
  the source ADRs).
- Phase 2.1.4 (QualityGate) and Phase 2.2.3 (BoundaryObservation
  payload bundle) Zod refinements can encode the invariants
  without inverting the authority direction.
- ADR 0019 v3's chain-promotion rule (closed `derived_from`
  membership; four-class blocklist) and ADR 0034 v2's cross-
  context binding rules (kernel-set binding fields; payload-
  level freshness anchor inheritance) now have charter-level
  authority in addition to ADR-level posture.
- Partial acceptance is allowed (per ADR 0021 §Partial
  acceptance precedent): if reviewers return blocking objections
  on only one invariant, the charter PR may land only the
  accepted one.

### Rejects

- Encoding inv. 18 + 19 as Zod refinements in Phase 2.1.4 +
  Phase 2.2.3 PRs before charter v1.4.0 states the invariants.
- Bundling boundary-enforcement bullets, forbidden-pattern
  entries, canonical policy YAML, schema PRs, or trap fixtures
  into this PR.
- Treating retrieval-derived content (`KnowledgeChunk`) or
  unpromoted aggregation (`CoordinationFact` /
  `DerivedSummary`) as gate authority via any composition path,
  including chain-promotion through intermediate summaries or
  laundering through `Run` / `Decision` / `Lease` references in
  `derived_from`.
- Treating boundary evidence from one execution context as
  evidence for an unrelated context without a fresh observation.
- Treating producer-supplied values for execution-context
  binding fields (`execution_context_id`, `surface_id`,
  `workspace_id`, `credential_source_id`, `tool_or_provider_ref`)
  as canonical bindings; these fields are kernel-set.
- Treating payload-level freshness anchors as independent of
  envelope-level `valid_until` and execution-context binding.

### Future amendments

- **Charter v1.4.x wave-2** — boundary-enforcement bullets and
  forbidden-pattern entries for inv. 18 + 19 after Phase 2.1.4
  and Phase 2.2.3 land. Mirrors ADR 0024's **reactive** cadence
  (post-merge review on `f9e30d4` triggered wave-2 +
  wave-3 retroactively); not a pre-scheduled wave. If the
  schema PRs surface no gaps, no wave-2 ADR is needed.

- **Charter v1.4.x or v1.5.0 — invariant 20 promotion** — Q-008
  ("command symptoms are not diagnoses") was originally queued
  per ADR 0021 alongside inv. 18 + 19. Q-008 closed via ADR 0029
  v2 (anomalous-capture blocking thresholds) + ADR 0031 v1
  (worktree ownership composition), but its operationalization
  sits at the policy / matrix / receipt layer rather than at the
  Ring 0 entity-shape layer. Whether inv. 20 warrants charter
  promotion is deferred to a future wave once the operational
  pattern is observable across multiple incidents.

- **Re-review of inv. 18** if a follow-up Q-row materially
  changes the chain-promotion rule (e.g., extending it to cover
  `Run` records, `Decision` records, or `Lease` records as
  derived authority sources) — currently those are explicitly
  forbidden as `derived_from` graph members per the closed-
  membership rule, but a future redesign could expand the
  closed list.

- **Re-review of inv. 19** if the registration-rules registry §3
  list of binding fields changes (added, removed, merged, or
  renamed) beyond the current five (`execution_context_id`,
  `surface_id`, `workspace_id`, `credential_source_id`,
  `tool_or_provider_ref`).

- **Promotion-grant entity ADR** — when the typed grant
  authorizing `allowed_for_gate` transitions receives its
  committed entity name (per ADR 0019 v3 §Promotion workflow
  shape candidates), the charter does not require amendment
  because inv. 18 uses functional vocabulary. The promotion-
  grant ADR records the name binding only.

- **Possible future structural option** — split inv. 18 + inv.
  19 into two parallel charter-amendment ADRs if a future
  sequencing situation makes them progress at materially
  different paces. Not preemptively justified; v2 chose Option
  A's bundled approach per ADR 0021 inv. 16 + inv. 17 precedent.

- **v3 expectation** — v2 substantively expanded the v1
  invariant text to preserve source-ADR commitments; if v2
  re-review surfaces fresh tensions on the new tightenings
  (particularly around the closed `derived_from` membership
  formulation, the kernel-set binding-fields sentence, or the
  payload-level freshness anchor inheritance sentence), expect
  v3 rather than forcing one-pass convergence. v2 is structurally
  designed to converge but not at the cost of weak semantic
  commitments. **Outcome at acceptance:** all four reviewers
  returned READY-FOR-ACCEPTANCE on v2; convergence achieved with
  3 mechanical tweaks at acceptance and 13 forward-looking
  non-blocking observations documented below.

### Forward-looking observations from review

Sixteen non-blocking observations across the four reviewers' v2
re-reviews. Three landed as mechanical tweaks at acceptance (see
§Acceptance note); the remaining thirteen are recorded here for
absorption at downstream PRs. This ADR does not author the
changes; the receiving PRs cite this section by reference.

**Phase 2.1.x schema PR (DerivedSummary domain shape alignment):**

- **Arch-N10 / Pol-N1 / Ont-N8** — ADR 0019 v3 §DerivedSummary
  domain shape (lines 611-613) lists `derived_from` membership as
  three classes (`Evidence` / `CoordinationFact` /
  `KnowledgeChunk`) but the chain-promotion rule (line 645)
  implies `DerivedSummary` may also appear in `derived_from`.
  Charter v1.4.0 inv. 18 commits the four-class membership (which
  matches the chain-promotion rule's coverage). At Phase 2.1.3
  schema PR, tighten ADR 0019 v3 line 611-613 to align with the
  four-class committed list, or record the alignment in
  `DECISIONS.md` as a Q-row resolution.

**Phase 2.1.4 QualityGate Zod refinement PR:**

- **Arch-N12** — The Phase 2.1.4 PR description should explicitly
  note that the inv. 18 `self-asserted` chain-walk rejection
  clause is operationally inert until the `evidenceAuthoritySchema`
  enum extension PR lands. Avoids future readers concluding the
  enum extension is dead code.

**Phase 2.2.3 BoundaryObservation payload bundle PR:**

- **Ont-N9** — Charter inv. 19 "kernel-set" for the five
  execution-context binding fields is grounded in ADR 0034 v2
  §Authority discipline but not yet enumerated in registry
  v0.3.3 §Producer-vs-kernel-set. Recommend extending registry
  §Producer-vs-kernel-set to enumerate the five FKs in a
  registry update PR before or alongside Phase 2.2.3 schema PR.

**Phase 2.5 canonical policy YAML:**

- **Pol-N4** — Phase 2.5 canonical policy YAML must NOT re-state
  inv. 18 / 19 invariant rules; that would be policy duplication
  outside the canonical source. Per-`gate_kind` and
  per-`boundary_dimension` numeric thresholds belong in policy
  YAML; the rule shapes belong in the charter. Pre-emptive note
  for the Phase 2.5 reviewer.

**Phase 2.6 trap-fixture PR:**

- **Arch-N12 / Pol-N2 / Sec-N-v2-2** — `evidenceAuthoritySchema`
  enum extension PR for `self-asserted` must land before any trap
  fixture in Phase 2.6 references `self-asserted`. Sequencing
  dependency to honor; otherwise fixtures fail at Zod parsing
  rather than at the chain-walk rejection layer.

**Wave-2 reactive amendment (if/when triggered):**

- **Sec-N-v2-1** — "The typed-grant minting layer" phrasing in
  inv. 18 + 19 reads Layer-1-leaning to a casual reader.
  Alternative phrasings ("the typed-grant lifecycle," "the
  typed-grant authorization stack," or "the Ring 1 typed-grant
  pipeline") may better convey multi-layer composition (Layer 1
  mint + Layer 2 broker FSM + Layer 3 gateway re-derive per ADR
  0019 v3 lines 659-662). Wave-2 reactive amendment can absorb
  if Phase 2.1.4 / 2.2.3 review surfaces the gap.

- **Sec-N-v2-3** — Inv. 19 surface enumeration (macOS app, shell,
  package-manager, Git/GitHub, MCP) is narrower than charter
  v1.3.2 line 140 forbidden-pattern entry's surface list (Warp,
  Zed external agent, Cursor, Windsurf, JetBrains AI Assistant,
  GitHub Copilot CLI, launchd `EnvironmentVariables`). The "or
  any other surface" + "authority floor, not a ceiling" idiom
  resolves textually; wave-2 may align the lists if reviewers
  find the disparity confusing in practice.

- **Ont-N10** — Composition tension between charter v1.3.2 line
  141 forbidden-pattern ("primary target reference") and inv. 19's
  "at least one" framing. A `BoundaryObservation` that satisfies
  inv. 19 (any binding present) might still fail v1.3.2 line 141's
  primary-only check if cross-context detection runs against the
  per-dimension primary reference. Wave-2 reactive amendment
  should clarify whether forbidden-pattern detection runs against
  "primary" or "at least one" target.

**Future glossary cleanup / registry v0.4.0+:**

- **Pol-N3** — "Authority floor, not a ceiling" idiom now appears
  at three textual sites (charter v1.3.2 lines 140 + 141 + v1.4.0
  inv. 19). Future glossary or ontology cleanup may canonicalize
  the phrase as a registry-defined term rather than free-form text
  repeated at three sites.

**Already documented within the ADR (no separate downstream
owner):**

- **Sec-N-v2-4** — Cross-context substitution defense composes
  with the kernel-set sentence: a producer cannot launder
  cross-context evidence by claiming a forged binding field,
  since the binding field is kernel-set. Documented in
  §Composition with existing invariants.

- **Ont-N11 (folded as mechanical tweak at acceptance)** —
  See §Acceptance note for closure detail.

## Out of scope

- **Six-question surface-boundary discipline.** Per AGENTS.md
  / charter §Authoring rules, the six-question discipline
  applies when "the PR adds a capability." This PR adds no
  capability; it amends invariant text. Six-question discipline
  is out-of-scope. (ADR 0021 + ADR 0024 also did not include
  six-question discipline; consistent precedent.)

- **Schema PRs** for the entities referenced by the invariants
  (`AgentClient` / `VerificationCommandSpec` / Knowledge+
  Coordination subgraph / `QualityGate` at Phase 2.1.x;
  `ExecutionContext` cache / `OperationShape` extension /
  `BoundaryObservation` payload bundle at Phase 2.2.x). Per
  ADR 0038.

- **Canonical policy YAML** (Phase 2.5).

- **Trap fixtures** (Phase 2.6).

- **`evidenceAuthoritySchema` enum extension** to commit
  `self-asserted` as an enum value (separate schema-change PR;
  `self-asserted` remains registry-canonical only per registry
  v0.3.3 until that PR lands).

- **Promotion-grant entity ADR** (separate; charter inv. 18 uses
  functional vocabulary so the entity-naming ADR does not
  require charter amendment).

- **CI implementation** of the new invariants. Boundary-
  enforcement bullets and forbidden-pattern entries are deferred
  per ADR 0024 wave-2 reactive cadence; CI hooks land alongside
  the wave-2 ADR if/when reactive review surfaces gaps.

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md`
  v1.3.2 (target: v1.4.0).
- ADR 0019 v3: `docs/host-capability-substrate/adr/0019-knowledge-and-coordination-store.md`
  §Sub-decision (e) (lines 196-201); §`allowed_for_gate`
  discipline (lines 588-602, 632-636); §Chain promotion rule
  (lines 638-662, the Policy B2 closure); §Promotion audit-
  record completeness (lines 752-780); §Promotion workflow shape
  (lines 688-696 grant-name reservation).
- ADR 0034 v2: `docs/host-capability-substrate/adr/0034-q-007-b-f-boundary-evidence-composition-quality-gate-posture.md`
  §Sub-decision (f) (lines 738-753); §Authority discipline
  (lines 793-797 kernel-set discipline; lines 793-794 payload-
  level freshness anchor naming); §Cross-context binding rules
  per Ring 1 layer (lines 808-823); §Charter inv. 17/18-
  candidate/19-candidate freshness-precedence rule (lines
  841-854).
- ADR 0021: `docs/host-capability-substrate/adr/0021-charter-v1-3-wave-1.md`
  (charter-amendment ADR pattern; partial-acceptance precedent;
  inv. 18-20 originally queued; inv. 16 + 17 bundled-ADR
  precedent).
- ADR 0024: `docs/host-capability-substrate/adr/0024-charter-v1-3-wave-2-and-3.md`
  (wave-2 retroactive enforcement plumbing; wave-3 prospective
  forbidden-pattern entries; reactive cadence precedent).
- ADR 0035 v2: `docs/host-capability-substrate/adr/0035-q-007-g-quality-gate-standalone-entity.md`
  (QualityGate entity; Phase 2.1.4 home for inv. 18 Zod
  refinement; §Acceptance note for canonical policy YAML
  composition rules at Milestone 2).
- ADR 0022: `docs/host-capability-substrate/adr/0022-boundary-observation-envelope.md`
  (BoundaryObservation envelope; envelope-vs-payload distinction
  load-bearing for inv. 19's "envelope" framing).
- ADR 0023: `docs/host-capability-substrate/adr/0023-evidence-base-shape.md`
  (Evidence base shape; `valid_until` `nullable()` baseline that
  inv. 19 tightens for the envelope subset).
- ADR 0036 v2: `docs/host-capability-substrate/adr/0036-q-009-workspace-manifest-projection-and-diagnostic-surface.md`
  (`mcp_canonical_authority` + `filesystem_*` payload variants;
  Phase 2.2.3 BoundaryObservation payload bundle component).
- ADR 0037 v2: `docs/host-capability-substrate/adr/0037-q-010-cross-agent-isolation-and-compatibility-taxonomy.md`
  (remote-agent + containment payload variants; Phase 2.2.3
  BoundaryObservation payload bundle component).
- ADR 0015: `docs/host-capability-substrate/adr/0015-external-control-plane-automation.md`
  (`OriginAccessValidator` / `AudienceValidationBinding`
  precedent; inv. 19 ↔ inv. 16 composition extension reference).
- ADR 0038 v2: `docs/host-capability-substrate/adr/0038-phase-2-schema-landing-sequence.md`
  §Phase 2.0 (sequences this charter amendment as Phase 2 entry
  point).
- DECISIONS.md: Q-003, Q-007 (closed via ADR 0019 v3, ADR 0034
  v2 + ADR 0035 v2 in synthesis-window 2026-05-04).
- `ontology-registry.md` v0.3.3 §Registration rules §3 (primary
  or supplemental target reference enumeration); §Authority
  discipline lines 318-343 (`self-asserted` registry-canonical
  status); §Producer-vs-kernel-set lines per v0.3.2.
- PLAN.md §Current Focus (Phase 2 entry-point inventory).

### External

- None. Both invariants derive from internal Phase 1
  synthesis-window outcomes; no external standards or vendor
  specifications are load-bearing.
