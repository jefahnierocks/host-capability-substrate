---
adr_number: 0076
title: "Model Ring-0 entity — model identity/spec/lifecycle as a typed object (completes ADR 0075)"
status: proposed
version: v2
date: 2026-06-23
charter_version: 1.6.0
tags: [model, ring-0, non-minted, model-identity, model-card, taxonomy, lifecycle, provenance, alias-resolution, de-versioning, adr-0075-completion]
---

# ADR 0076: Model Ring-0 entity — model identity/spec/lifecycle as a typed object

## Status

`proposed`

Design-only. This ADR does **not** land Zod source, generated JSON Schema, tests,
ontology/registry edits, live policy, generated snapshots, system-config, or Ring 1
implementation code. The schema PR follows only after acceptance, per
`.agents/skills/hcs-schema-change`.

**Operator-confirmed scope (2026-06-23): the minimal first slice.** A single
non-minted Ring-0 `Model` entity (identity + lifecycle + alias-resolution +
provenance, including `context_window`), plus `evidenceSubjectKindSchema += 'model'`
and two additive nullable-optional attribution FKs — `Decision.model_ref` and
`Run.invoker_model_ref`. The operator explicitly **deferred**: `AgentClient.model_ref`
(the canonical-hash fork), the full model-card attributes (modalities, knowledge
cutoff, pricing, released/retracted dates), and the `AliasResolution` / eval
results-ledger sibling entities.

**v2 folds the round-1 five-lens review (zero charter violations; three settled
design commitments lifted from "open" to committed):**
1. **Minted-entity canonical-hash disposition (architect B-1).** `Decision` and `Run`
   are minted (`audit_chain_link_hash`); `Decision.model_ref` and `Run.invoker_model_ref`
   are **excluded from the canonical `audit_chain_link_hash` concatenation** (the
   attribution-field posture — `AgentClient` excludes `producer` likewise), so existing
   serialized chains stay valid. The exact canonical-encoding confirmation is routed to
   the mint/audit implementation.
2. **`Evidence.schema_version` bump (ontology B1).** Adding the genuinely-new `'model'`
   subject kind **bumps `Evidence.schema_version` `0.10.0 → 0.11.0`** — every prior
   genuinely-new `evidenceSubjectKind` value bumped (`ontology.md` history); the no-bump
   cases were all pre-reserved values. (The `Decision.reason_kind` additive-no-bump
   precedent is a different enum and does not govern this one.)
3. **`decision_ref` → `decision_ledger_row` (ontology B2).** The field holds a
   `DECISIONS.md` row id (e.g. `D-075`), not a typed FK to the `Decision` entity; the
   `_ref` suffix is reserved for typed Ring-0 entity FKs, so it is renamed to avoid the
   collision.

Non-blocking folds also incorporated: `Run.invoker_model_ref` stated as settled
(additive nullable-optional, no `Run.schema_version` bump); the `boundedTokenSchema`
sketch annotated as inlined-charset shorthand; the model-attribution producer-asserted
trust boundary + the FK-resolver backing-Evidence check added to §What stays in Ring 1;
the `source_provenance` inv-14 rung mapping noted; the eval `runtime_family`
wording corrected (the `model_coverage` tags are classified run-scope but not yet
de-versioned); the regression table marked a deferred seed sketch.

## Date

2026-06-23

## Charter version

Written against implementation charter **v1.6.0** (invariant 12 amended by ADR 0075 /
D-076 — the tool/model baseline is single-sourced and alias-pinned) and
`docs/host-capability-substrate/ontology-registry.md` v0.4.35. `Model` is constrained
by charter invariant 1 (no live-policy content in Ring 0 — a model is a *fact* Ring 1
reads, never a tier), invariant 8 (an observed model fact must not be promoted from a
sandbox observation — a Ring 1 obligation), and invariant 14 (model identity is a
config-spec claim and carries observed-runtime provenance).

## Context

The LLM/agent **model** is currently a *string in five places with no typed home* —
the ad-hoc handling the operator named. A model-as-object audit (2026-06-23, 8 parallel
auditors, tree-verified) confirmed there is **no `Model` entity** among the canonical 22,
and the nearest entity, `AgentClient`, models the *harness/product*
(`product_family` / `app_build` / `dep_bundle_version`) and carries **no model field**.

The five untyped surfaces:

| Surface | Where | Authority class |
|---|---|---|
| Harness pin (main) | `.claude/settings.json` `"model": "opus"` | live selector, untyped |
| Harness pins (×6 reviewers) | `.claude/agents/hcs-*.md` `model: opus` | live selector, untyped |
| Single-source prose | `AGENTS.md` §Tool baseline | **authority of record** (inv. 12 / ADR 0075) |
| Ledger rows | `DECISIONS.md` D-054/D-071/D-072/D-075/D-076 | dated authority of record |
| Eval run-scope tags | `packages/evals/regression/*.md` `model_coverage:` | run-scope metadata, consumed by nothing |

**ADR 0075 fixed *where the string lives*** (a prose single-source + alias-pin
discipline) but explicitly did **not** make the model an object. The residual,
load-bearing gaps it left:

- **G1 — No model-identity object.** Vendor / runtime-family / tier / alias / exact-id
  are collapsed into one untyped string per surface; you cannot query "what tier" or
  "which vendor."
- **G2 — Unattributable in the audit chain.** `Run.invoker_agent_client_id` and
  `Decision.decided_by` record the *client*, not the model. Two `claude_code` sessions
  on different models (Opus vs the retracted Fable 5) are **indistinguishable at Ring 0**
  — which silently weakens the reviewer-calibration trust property (six reviewers
  pinned to `opus`).
- **G3 — No lifecycle/retraction state.** Lifecycle enums exist for `Capability`
  (`active|deprecated|retired`) and `AgentClient` (`active|retired`), but no model
  state. The Fable-5 ship→retract-in-four-days was a **four-decision prose scramble**
  (D-071→D-072→D-075→D-076), not one typed transition.
- **G4 — No typed alias→concrete resolution.** ADR 0075 Facet 2's alias-pin *fails open*
  on a silent vendor rollover; inv. 14 makes it detectable-at-next-observation, not
  prevented. There is no typed `{pin_form, pin_value, resolved_model_name, observed_at}`
  record, so a rollover leaves **zero ontological trace**.
- **G5 — No model in provenance.** Inv. 14 mandates `{source, observed_at, …}` for
  config-spec claims; the model is exactly such a claim, yet "Opus 4.8 observed" is
  asserted in prose with no per-attribute provenance and no `Evidence` backing
  (`evidenceSubjectKindSchema` has **no `model` value** today).
- **G6 — Drift is hand-counted.** D-075 hand-counted "84 hits"; D-076 had to correct it
  to "85 / 46 files." A typed field makes the inventory *derivable*, not corrected one
  ledger row later.

This ADR **completes** ADR 0075. It does **not** supersede it: ADR 0075's `AGENTS.md`
§Tool baseline + its `DECISIONS.md` re-baseline row remain the **live-baseline authority
of record**; the typed `Model` record is the *observed mirror* and the *taxonomy shape*
that pins/tags/observations validate against — **never a competing baseline authority**
(mirroring the `project.yaml` "never a competing status authority" framing per
the meta-inventory interop spec).

## Decision

Adopt **Option A.** Introduce one **non-minted Ring-0 `Model` entity** — a structural
peer of `HostProfile` / `ToolProvider` / `Capability` (a host/vendor fact Ring 1 reads,
never policy content, never minted) — plus a `model` Evidence subject kind and two
additive attribution FKs.

### Why one entity (not a family), first-class (not an Evidence subtype), non-minted

- **One entity, not a family.** The conceptual sub-objects (`ModelIdentity`,
  `ModelCard`/`ModelSpec`, `AliasResolution`, a results-ledger) share one grain — a
  concrete served model — and differ only in which fields are populated and which
  provenance source applies. Splitting now manufactures FK ceremony before any consumer
  exists. Start with one entity carrying a provenance authority split; promote siblings
  later only when a real consumer needs the join.
- **First-class, not an Evidence subtype.** The model is a *standing fact with a
  lifecycle* (`active`→`retracted`, supersede links) and a *named FK target* for
  `Decision` / `Run`. Evidence subtypes are observations *about* a subject, not the
  subject. So `Model` is the entity; its observations (an alias resolving to a concrete
  model at a point in time) are carried as `Evidence` with the new `model` subject kind —
  exactly how `ToolInstallation` / `ResolvedTool` are entities observed via Evidence.
- **Non-minted.** Like `HostProfile` / `ToolProvider`, a `Model` is a host/vendor fact
  and a read-only policy input to Ring 1 — never a tier (inv. 1), never minted with its
  own audit chain (absent from the ADR 0057 mint scope). It carries `source_provenance`,
  not `audit_chain_link_hash`.

### Entity shape (design sketch; exact Zod lands in the schema PR)

```text
Model (non-minted Ring 0)
  schema_version        z.literal('0.1.0')
  model_id              entityIdSchema              // opaque/derived; id-opacity a Ring 1 obligation (HostProfile precedent)
  vendor                modelVendorSchema           // anthropic | openai | google | unknown
  runtime_family        modelRuntimeFamilySchema    // claude | codex | gemini_adk | unknown
  tier                  boundedTokenSchema?         // opus | sonnet | haiku | ... ; nullable; /^[A-Za-z0-9._+-]+$/
  pin_form              modelPinFormSchema          // alias | exact_id | profile_handle   (the Fable lesson, typed)
  pin_value             boundedTokenSchema          // 'opus' | 'claude-opus-4-8' | 'hcs-implement'
  resolved_model_name   boundedTokenSchema?         // 'claude-opus-4-8'; null until observed (alias/profile case)
  context_window        z.number().int().positive()? // types the '[1m]' suffix as DATA, not a bracketed substring
  model_state           modelStateSchema            // announced | active | deprecated | retracted | superseded
  supersedes_model_id   entityIdSchema?             // self-FK; reproduces the re-baseline chain as queryable history
  decision_ledger_row          boundedTokenSchema?         // the DECISIONS.md re-baseline row id (e.g. 'D-075') — the ADR 0075 anchor, typed
  source_provenance     .strict() { authority: modelSourceAuthoritySchema, observed_at, valid_until? }
```

`.strict()` envelope. NO `audit_chain_link_hash`, NO producer-mint field, NO embedded
`evidence_refs` (observed-runtime backing is carried by separate `Evidence` records with
`subject_kind: 'model'`, the ResolvedTool/ToolInstallation pattern); absent from the
ADR 0057 mint scope. Reuses `entityIdSchema` + `isoDateTimeSchema` (`common.ts`).
(`boundedTokenSchema` in the sketch is **shorthand**, not a `common.ts` symbol: each such
field is inlined on the existing `/^[A-Za-z0-9._+-]+$/` charset with an explicit
`.min(1).max(64)` cap — the `hostProfileOsVersionSchema` / `toolInstallationToolName`
precedent.)

### Fields

- `model_id` — `entityIdSchema`, opaque. Ring 0 accepts a raw shape (a Ring-0 denylist
  would violate inv. 1); id-opacity is a Ring 1 obligation, backstopped by
  `forbidden-string-scan` (the HostProfile / storage-primitive accept-and-trap).
- `vendor` / `runtime_family` — the two durable taxonomy axes the prose conflates. A
  descriptive FACT Ring 1 reads, never a verdict (inv. 1). `runtime_family` includes
  `gemini_adk` even though Gemini is not yet a host-session `product_family` — it is a
  first-class **eval** target (see §Out of scope re. `agentClientProductFamilySchema`).
  Widening via the registered §Procedure rule.
- `tier` — nullable bounded token (`opus`/`sonnet`/`haiku`/…); the queryable capability
  rung previously buried in the string. Reuses the established `/^[A-Za-z0-9._+-]+$/`
  charset (`tool_name` / `version` / `hostProfileOsVersion` precedent).
- `pin_form` + `pin_value` + `resolved_model_name` — **the entire Fable lesson, typed.**
  `pin_form` ∈ `{alias, exact_id, profile_handle}`; an **alias** pin (`opus`) survives
  retraction and resolves at runtime (the post-D-075 default); an **exact_id** pin
  (`claude-opus-4-8`) fails closed and is the rationale-bearing exception (inv. 12); a
  **profile_handle** (`hcs-implement`) is the Codex resolution mechanism. `pin_value` is
  what is configured; `resolved_model_name` is what it resolves to (nullable until
  observed). The inv-12 rule "an exact pin requires a rationale ledger row" is encoded as
  a Ring 1 obligation: `pin_form = exact_id` ⇒ `decision_ledger_row` present (Ring 0 accepts the
  combination as a recorded accept-and-trap, mirroring the ResolvedTool non-cross-constraint).
- `context_window` — nullable positive integer; **types the `[1m]` context suffix as
  data.** `claude-fable-5[1m]` *broke* on retraction precisely as an opaque bracketed
  string (`[` / `]` are outside the value charset); parsing the window into a field is
  the spec's answer (D-072's exact-string brittleness, structurally fixed). No other
  card attribute (modalities / cutoff / pricing) is in this slice — deferred.
- `model_state` — `announced | active | deprecated | retracted | superseded`; uses the
  `_state` lifecycle-suffix convention (peer of `capability_state` / `agent_client_state`),
  extended with `retracted` (vendor un-ships — the Fable case) and `superseded` (a
  rollover). A retraction becomes **one timestamped transition + `decision_ledger_row`**, not a
  multi-doc scramble (G3). `retired`-class states are valid historical records, not
  policy-denied states.
- `supersedes_model_id` — nullable self-FK (`entityIdSchema`); reproduces
  D-054→D-071→D-072→D-075 as **queryable history** rather than prose archaeology. FK
  existence is a Ring 1 obligation.
- `decision_ledger_row` — nullable bounded token; the `DECISIONS.md` re-baseline row id (e.g.
  `D-075`) that is the authority of record for the `active` `Model`. This **types the
  AGENTS.md→D-row anchor** ADR 0075 left as prose, and is the non-competition link: the
  `Model` record points *at* the authority, it does not replace it.
- `source_provenance` — a `.strict()` declaration-site binding: `authority`
  (`modelSourceAuthoritySchema` ∈ `{vendor_published, observed_runtime, operator_attested}`,
  disjoint from `evidenceAuthoritySchema`, conferring no authority by itself),
  `observed_at`, optional `valid_until`. This types the inv-14 provenance split (G5):
  vendor-published attributes (`tier`, `context_window`) vs observed-runtime
  (`resolved_model_name` behind an alias) vs operator-attested (the 2026-06-22 GPT-5.5
  confirmation tier). The schema-PR `.describe()` records the inv-14 rung each value maps
  to — `observed_runtime` is the top rung (and the one backed by a `subject_kind:'model'`
  Evidence record), `vendor_published` maps to "static vendor docs," and
  `operator_attested` (a fresh human observation) sits **above** model-memory; the enum
  encodes no order by itself, so the order is a Ring-1 obligation. This is the **first
  non-minted entity whose declaration-site `authority` is a multi-value enum** rather than
  a single `z.literal` (`host_profile_declaration` etc.) — justified by the provenance
  split — so the `.strict()` wrong-authority reject test (every `evidenceAuthoritySchema`
  option, incl. `sandbox-observation` / `self-asserted`) is load-bearing. Mirrors the
  `HostProfile` / `Artifact` / `Lock` non-minted provenance pattern otherwise.

### Cross-entity changes (the minimal FK slice)

| Change | Form | Precedent / version impact |
|---|---|---|
| `evidenceSubjectKindSchema += 'model'` | additive enum widening | lets a model fact be observed via `Evidence` (`subject_id` = `model_id`). **Bumps `Evidence.schema_version` `0.10.0 → 0.11.0`** — every prior genuinely-new `evidenceSubjectKind` value bumped (`ontology.md` subject-kind history); the no-bump cases were all *pre-reserved* values. (The `Decision.reason_kind` additive-no-bump precedent is a *different* enum and does not govern.) |
| `Decision.model_ref` | additive nullable-optional FK → `Model` | "which model produced this decision" (G2). In the **additive-nullable-optional, no-`Decision.schema_version`-bump** change class of `Decision.policy_rule_ref` (ADR 0061 / D-059). `Decision` is **minted**, so `model_ref` is **excluded from the `audit_chain_link_hash` canonical concatenation** (attribution-field posture, like `AgentClient` excludes `producer`; existing chains stay valid) — exact canonical-encoding routed to the mint/audit implementation. (ADR 0061 left `policy_rule_ref`'s own hash disposition implicit; this ADR makes the exclusion explicit.) Attribution is **producer-asserted** (no paired digest, unlike `policy_rule_ref` ↔ `resolved_policy_sha256`); binding `model_ref` to a `subject_kind:'model'` Evidence record is a Ring-1 trust obligation. |
| `Run.invoker_model_ref` | additive nullable-optional FK → `Model` | "which model authored this run" (G2). Additive nullable-optional `entityIdSchema` FK alongside `invoker_session_id` / `invoker_agent_client_id`; **no `Run.schema_version` bump** (the ADR 0061 additive-nullable-FK change-class is entity-independent). `Run` is **minted**, so `invoker_model_ref` is likewise **excluded from the canonical concatenation**; producer-asserted, Ring-1-bound as above. |

### The de-versioning rule, made a typed invariant

ADR 0075's "name runtimes/families, not versions" is prose (`AGENTS.md` §Tool baseline).
Typed, it becomes: **a model version string is legal in exactly one place —
`Model.resolved_model_name` / `Model.tier` on the `model_state = active` record (and its
`subject_kind: 'model'` Evidence). Everywhere else (`Decision` / `Run` refs, eval
`model_coverage`, role tables) references the model by `runtime_family` or by
`model_id`.** A future boundary scan (a sibling of `agent-contract-identity-scan`) then
*derives* "any exact-version string outside the active `Model` record" — turning G6's
hand-count into CI and replacing reviewer judgment. The CI gate is **future** (not this
slice). (The 40 existing `model_coverage` trap tags are classified run-scope by ADR 0075
Facet 4 but were deliberately **not** de-versioned; they are current violations the future
scan would flag and normalize to `runtime_family` when it and the eval results-ledger
land — never bulk-rewritten now, per ADR 0075's "classify, don't rewrite.")

### What stays in Ring 1 (not this schema)

- Model attribution FK existence + the `pin_form = exact_id ⇒ decision_ledger_row` rule.
- When a Ring-1 consumer resolves `Decision.model_ref` / `Run.invoker_model_ref`, it
  verifies the referenced `Model`'s backing `subject_kind:'model'` Evidence authority
  (inv. 8 / inv. 14) before trusting the attribution at host authority — model
  attribution is producer-asserted at Ring 0, integrity-bound only at Ring 1 (no paired
  digest exists at Ring 0).
- `model_id` / `supersedes_model_id` opacity (accept-and-trap).
- NOT promoting a sandbox-observed model fact to host-authoritative (inv. 8).
- A **retracted-model guard** (`model_state = retracted` ⇒ `Decision` rejects) and a
  recorded-baseline-below-floor rejection — Ring-1 policy, M4-gated; they consume the
  Ring-0 `Model` fact, they do not live in it (inv. 1). The CLI semver floors stay plain
  numeric CLI gates (they gate the CLI, not the model).
- Resolution of `pin_value → resolved_model_name`, and the eval results-ledger.

## Consequences

### Accepts

- HCS gains a first-class typed model object: identity (vendor/family/tier/alias/exact),
  lifecycle (incl. `retracted`/`superseded`), alias→concrete resolution (G4), and the
  inv-14 provenance split (G5) — as a clean non-minted peer.
- Model **attribution** in the audit chain via `Decision.model_ref` + `Run.invoker_model_ref`
  (G2) — additive, following the `Decision.policy_rule_ref` no-bump precedent, so the
  blast radius on the canonical-hash entities is zero in this slice.
- A future Fable-style retraction is **one typed `model_state` transition** with a
  `decision_ledger_row`, not a four-decision scramble (G3).
- The de-versioning rule becomes a typed invariant + a future derivable CI scan (G6),
  completing ADR 0075 without competing with its authority of record.

### Rejects

- A model **family** specified up front (multiple entities + FK ceremony before
  consumers) — deferred to additive slices.
- An Evidence-subtype-only treatment — the model needs a named FK target and a lifecycle;
  Evidence observes the subject, it is not the subject. (The `model` subject kind is added
  *for* the observations.)
- Minting (`Model` is a fact, not an audit-chain identity; absent from ADR 0057 scope).
- `AgentClient.model_ref` in this slice — the canonical-hash fork (attribution-vs-identity)
  is deliberately deferred per operator direction; model attribution is delivered via
  `Decision` / `Run` instead.
- Rich model-card attributes (modalities, knowledge cutoff, pricing, released/retracted
  dates) — no current consumer; pricing would couple to `ResourceBudget`. Deferred.
- Any live-policy / tier field on `Model` (a model is a fact Ring 1 reads, inv. 1); any
  Ring-1 guard, generated-snapshot, system-config, or `AGENTS.md` baseline-authority change.
- Re-defining ADR 0075 as a competing authority — `Model` mirrors, never replaces, the
  `AGENTS.md` §Tool baseline + the `DECISIONS.md` re-baseline row.

### Future amendments

- `vendor` / `runtime_family` / `model_state` enum widening via the §Procedure rule.
- `region_prefix` (`us.anthropic` / `bedrock` / `vertex`) when a cross-cloud model id
  first appears (HCS uses the CLIs directly today; not needed at v1).
- The model-card slice (modalities / knowledge_cutoff / pricing / released_at /
  retracted_at) when a consumer needs it.
- `AgentClient.model_ref` (the attribution-vs-canonical-hash-identity decision) and a
  `Session.model_ref` — their own ADR; it cites this ADR's `Decision`/`Run`
  canonical-hash-**exclusion** as the precedent for an additive model FK on a minted
  entity (the attribution-alongside option), against the in-the-hash identity option.
- An `AliasResolution` sibling and the eval results-ledger (`trap × model × date ×
  verdict`, keyed by `model_id`) when the eval harness lands (ADR 0075 deferral).
- The de-versioning CI boundary scan.

## Options considered

### Option A: one non-minted `Model` entity + `model` Evidence subject kind + Decision/Run attribution FKs (CHOSEN)

**Pros:** types identity/lifecycle/resolution/provenance in one peer-consistent record;
delivers audit attribution additively (zero canonical-hash blast radius); gives the next
retraction a typed home; completes ADR 0075 without competing with it; minimal review
surface. **Cons:** a model's full picture spans the `Model` record plus its
`subject_kind: 'model'` Evidence (acceptable — the standard entity-observed-via-Evidence
split).

### Option B: full model family up front (`Model` + `ModelCard` + `AliasResolution` + results-ledger)

**Cons:** manufactures FK ceremony before any consumer exists; a much larger review
surface; speculative card fields with no consumer. Deferred to additive slices.

### Option C: Evidence-subtype-only (`ModelObservation`)

**Cons:** no named FK target for `Decision` / `Run`; no lifecycle home; can't represent
`active` vs `retracted` as a queryable standing fact. Evidence observes a subject; it is
not the subject.

### Option D: fold model into `AgentClient` (a `model_ref` on the client)

**Cons:** reopens the ADR 0059 canonical-hash debate (attribution vs identity-in-the-hash)
as a *gating* fork; the operator deferred it. Model and client are distinct grains (one
client product spans model swaps). Deferred to its own ADR.

## Out of scope

This ADR explicitly does not authorize:

- Zod source, generated JSON Schema, tests, or ontology/registry edits (the schema PR per
  `.agents/skills/hcs-schema-change` follows acceptance).
- `AgentClient.model_ref` / `Session.model_ref`; model-card attributes; the
  `AliasResolution` / results-ledger siblings; `region_prefix`.
- Widening `agentClientProductFamilySchema` or `executionContextSurfaceSchema` for Gemini
  (Gemini is `runtime_family`/eval-scope only until it is a real host session).
- Any Ring-1 retracted-model guard, floor-rejection, or `pin_value → resolved_model_name`
  resolver; any `reason_kind` additions for model rejections (a later policy slice).
- Live policy, `tiers.yaml`, generated-snapshot, system-config, or `AGENTS.md`
  baseline-authority edits.

## Implementation plan (for the schema PR that follows acceptance)

1. Add `packages/schemas/src/entities/model.ts`: `modelSchemaVersionSchema =
   z.literal('0.1.0')`; the `vendor` / `runtime_family` / `pin_form` / `model_state` enums
   (entity-prefixed exports `modelVendorSchema` / `modelRuntimeFamilySchema` /
   `modelPinFormSchema` / `modelStateSchema`, each `.describe()` carrying the inv-1
   "descriptive FACT, never a verdict" clause + the `unknown` house-sentinel where
   applicable); the `modelSourceAuthoritySchema` declaration-site enum (disjoint from
   `evidenceAuthoritySchema`); the bounded-token fields (`tier` / `pin_value` /
   `resolved_model_name` / `decision_ledger_row`) on `/^[A-Za-z0-9._+-]+$/`; `context_window`
   (`z.number().int().positive()`); the self-FK `supersedes_model_id`; and the `.strict()`
   `modelSourceProvenanceSchema` + `.strict()` `modelSchema`. Reuse `entityIdSchema` +
   `isoDateTimeSchema`.
2. `evidence.ts`: add `'model'` to `evidenceSubjectKindSchema` (additive enum widening;
   `.describe()` note that a model observation's `subject_id` is a `model_id`) and **bump
   `evidenceSchemaVersionSchema` `0.10.0 → 0.11.0`** (a genuinely-new subject kind bumps —
   the `ontology.md` subject-kind history), extending the version-literal `.describe()` to
   attribute the bump to this widening (ADR 0076).
3. `decision.ts`: add `model_ref` (additive nullable-optional `entityIdSchema`;
   `.describe()` mirroring `policy_rule_ref`'s ADR 0061 additive-no-bump note + stating
   `model_ref` is **excluded from the canonical `audit_chain_link_hash` concatenation** and
   is **producer-asserted** with no paired digest); **no `Decision.schema_version` bump.**
   `run.ts`: add `invoker_model_ref` (additive nullable-optional `entityIdSchema` FK; **no
   `Run.schema_version` bump**; likewise **excluded from the canonical concatenation**).
   The exact canonical-encoding of both exclusions is confirmed against the mint/audit
   implementation (the ADR 0057 commitment list).
4. Register `model.ts` in `index.ts` + `generate-json-schemas.ts`; regenerate
   `Model.schema.json` + `Evidence.schema.json` (the new subject kind + the `0.11.0` bump)
   + `Decision`/`Run` JSON Schema (the additive FKs). Move the registry
   §Current-schema-version-ledger `Evidence` row to `0.11.0`.
5. Tests (`model.test.ts`): a well-formed `Model` accepts; each enum value accepts /
   out-of-enum rejects; `pin_form = exact_id` + absent `decision_ledger_row` ACCEPTS at Ring 0
   (the recorded accept-and-trap; the rule is a Ring 1 obligation); `context_window`
   accepts a positive int, rejects `0`/negative/float/string; `.strict()` rejects injected
   mint/policy fields by name (`audit_chain_link_hash`, `producer`, `evidence_refs`,
   `tier_classification`, `approval_required_for`); `source_provenance` wrong-authority
   (every `evidenceAuthoritySchema` option) rejects; the `model_id` /
   `supersedes_model_id` raw-shape accept-and-trap (synthetic-UUID fixtures only); plus
   `decision.test.ts` / `run.test.ts` additive-FK cases.
6. Ontology + registry: a `### Model` entity section; a §Current-schema-version-ledger row
   at `0.1.0`; §Schema-enum-mirrors subsection for the four enums + `modelSourceAuthority`;
   the `evidenceSubjectKind` mirror gains `model`; a §References row; the
   non-competition-with-ADR-0075 note; version + change log.
7. Extend `scripts/ci/forbidden-string-scan.sh` documentary note to `Model` (the id
   accept-and-traps; affirm no secret slot — closed enums + bounded tokens + a typed FK).

## Follow-up regression coverage

These are **deferred seed classes**, not authored traps. Instrumented traps (real-incident
citation + forbidden-output strings + ordered trajectory assertions + numeric pass
criteria; no synthetic traps) are authored in the eval lane post-acceptance per
`.agents/skills/hcs-regression-trap/SKILL.md`. The G2 (attribution) and G4 (rollover)
rows are real-incident-backed (the Fable D-071→D-076 scramble; the `[1m]` exact-string
break) and are strong trap candidates once the `Model` schema lands.

| Failure class | Coverage |
|---|---|
| Model identity collapsed into one string | `Model` types vendor / runtime_family / tier / pin_form / pin_value / resolved_model_name as separate fields; the schema test asserts each axis. |
| Exact-pin brittleness (the D-072 / Fable failure) | `pin_form` distinguishes `alias` (survives retraction) from `exact_id` (fails closed, rationale-bearing); `context_window` types the `[1m]` suffix that broke as an opaque string. |
| Silent alias rollover leaving no trace (G4) | The alias→concrete pair (`pin_value` / `resolved_model_name`) + a `subject_kind: 'model'` Evidence row give a rollover a typed surface at the next observation. |
| Retraction as a multi-doc scramble (G3) | `model_state` incl. `retracted` / `superseded` + `supersedes_model_id` makes it one typed transition; the schema test asserts the states + the self-FK accept-and-trap. |
| "Which model produced this" unanswerable (G2) | `Decision.model_ref` + `Run.invoker_model_ref` additive FKs; the schema tests assert additive nullable-optional (absent/null when unattributed). |
| Restated live-version drift (G6) | The de-versioning-as-typed-invariant + the future boundary scan (deferred); the active `Model` record is the one legal home for a version string. |
| Sandbox-sourced model fact | Ring 1 producer obligation (inv. 8); implementation-test obligation when the model resolver lands; no Ring 0 coverage now. |

## Acceptance criteria

- Operator confirms the minimal-slice scope (Option A) — confirmed 2026-06-23.
- `hcs-architect`, `hcs-ontology-reviewer`, `hcs-policy-reviewer`, `hcs-security-reviewer`,
  and `hcs-eval-reviewer` complete review and all blocking findings are absorbed or
  explicitly rejected by the operator; `hcs-ontology-reviewer` is load-bearing for the
  `evidenceSubjectKind` widening + the cross-entity FK table, and `hcs-policy-reviewer` is
  load-bearing because `Model` is a designed Ring-1 policy input (the retracted-model
  guard + the inv-12 floor).
- `Model` stays non-minted, carries no live-policy/tier field, and does not re-define the
  ADR 0075 baseline authority of record.
- `Decision.model_ref` / `Run.invoker_model_ref` are additive nullable-optional with no
  `Decision` / `Run` `schema_version` bump (the `policy_rule_ref` precedent) and are
  excluded from the minted-entity canonical `audit_chain_link_hash`; the genuinely-new
  `'model'` `evidenceSubjectKind` bumps `Evidence.schema_version` to `0.11.0`.
- The ADR keeps the schema-change boundary: no Zod source, generated JSON Schema,
  ontology, registry, test, fixture, live-policy, generated-snapshot, system-config, or
  Ring 1 implementation changes in the acceptance slice.
- `just verify` remains green.

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md` v1.6.0 — invariant 1
  (no live-policy content in Ring 0), invariant 8 (no sandbox promotion), invariant 12
  (single-source baseline, alias-pin), invariant 14 (config-spec provenance authority order).
- ADR 0075 / D-076: `docs/host-capability-substrate/adr/0075-model-identity-single-source.md`
  — the prose single-source + alias-pin discipline this ADR types; `AGENTS.md` §Tool
  baseline + the `DECISIONS.md` re-baseline row remain the authority of record.
- ADR 0066 / D-064 (`HostProfile`) + ADR 0072 / D-070 (`ResourceBudget`) — the non-minted,
  `source_provenance`, `entityIdSchema` accept-and-trap, `_state`-lifecycle precedents.
- ADR 0061 / D-059 — `Decision.policy_rule_ref`: the additive nullable-optional FK,
  no-schema-version-bump precedent `Decision.model_ref` follows.
- ADR 0056 / ADR 0058 — `Decision.reason_kind` additive-enum-widening (no bump) precedent
  for the `evidenceSubjectKind += 'model'` treatment.
- ADR 0053 (`Run`) + ADR 0049 (`Decision`) + ADR 0057 (mint/audit scope, which `Model` is
  absent from) — the attribution FK hosts and the non-minted boundary.
- `packages/schemas/src/entities/evidence.ts` (`evidenceSubjectKindSchema`),
  `agent-client.ts` (no model field — the gap), `decision.ts` (`policy_rule_ref`),
  `run.ts` (`invoker_*` FKs).
- Schema-change workflow: `.agents/skills/hcs-schema-change/SKILL.md`.
- Model-as-object audit (2026-06-23): the 8-dimension investigation behind this ADR.

### External

- None directly. Model facts are observed at runtime (`claude --version` / `codex
  --version`, the `--model` alias help) and published in vendor model cards; the resolver
  is a future Ring 1 service.

## Revision history

- 2026-06-23: Initial proposal (v1). Minimal-slice scope per operator direction
  (one `Model` entity + `model` Evidence subject kind + `Decision`/`Run` attribution FKs;
  `AgentClient.model_ref`, model cards, and sibling entities deferred).
- 2026-06-23 (v2): Folded the round-1 five-lens review (zero charter violations). Three
  settled commitments: `Decision.model_ref` / `Run.invoker_model_ref` **excluded** from the
  minted-entity canonical `audit_chain_link_hash` concatenation (architect B-1);
  `Evidence.schema_version` **bumps `0.10.0 → 0.11.0`** for the genuinely-new `'model'`
  subject kind (ontology B1); **`decision_ref` → `decision_ledger_row`** to clear the
  `_ref` = typed-FK convention (ontology B2). Non-blocking folds: `Run` no-bump stated;
  `boundedTokenSchema` shorthand annotated (+ `.max(64)` caps); the producer-asserted FK
  trust boundary + the Ring-1 backing-Evidence resolver check added; the inv-14 rung
  mapping + the first multi-value declaration-site authority noted; the eval
  `model_coverage`-not-yet-de-versioned clarification; the regression table marked a
  deferred seed sketch.
