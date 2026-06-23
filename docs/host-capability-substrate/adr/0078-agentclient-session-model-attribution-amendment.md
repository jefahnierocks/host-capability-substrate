---
adr_number: 0078
title: AgentClient + Session model-attribution amendment
status: proposed
version: v2
date: 2026-06-23
charter_version: 1.6.0
tags: [agent-client, session, ring-0, model, audit-attribution, schema-extension, adr-0076-followup, canonical-hash-fork]
---

# ADR 0078: AgentClient + Session model-attribution amendment

## Status

`proposed`

Drafted 2026-06-23 as the deferred follow-on that ADR 0076 (Model Ring-0
entity, D-077) named in its §Future amendments: "`AgentClient.model_ref`
(the attribution-vs-canonical-hash-identity decision) and a
`Session.model_ref` — their own ADR; it cites this ADR's `Decision`/`Run`
canonical-hash-**exclusion** as the precedent for an additive model FK on a
minted entity (the attribution-alongside option), against the in-the-hash
identity option."

This ADR is design-only. It does not modify Zod source, generated JSON
Schema, tests, registry docs, ontology, ADR 0059, ADR 0055, ADR 0037, ADR
0076, live policy, generated snapshots, system-config, or Ring 1
implementation code. The follow-up schema PR follows only after acceptance
per `.agents/skills/hcs-schema-change`, and only on a tree where the
`Model` entity (ADR 0076 schema PR #78) already exists — both new fields are
typed references to a `Model` record, so the FK target must be present.

It resolves one fork shared by two minted entities: should the model link
join each entity's `audit_chain_link_hash` (identity-in-the-hash) or sit
beside it as an excluded attribution field (attribution-alongside)? ADR 0076
pre-settled the direction (attribution-alongside, against the in-the-hash
option); this ADR commits it, applies it to `AgentClient` and `Session`, and
records why identity-in-the-hash is rejected.

v1 was dispatched to the full five-lens review (`hcs-architect`,
`hcs-ontology-reviewer`, `hcs-policy-reviewer`, `hcs-security-reviewer`,
`hcs-eval-reviewer`), with `hcs-ontology-reviewer` mandatory (two FK
additions to minted entities) and `hcs-security-reviewer` load-bearing (the
amendment touches the AgentClient canonical-hash describe and the
audit-attribution surface). The five-lens mandate attaches to the follow-up
*schema* PR per IMPLEMENT.md; this ADR-only PR front-loads it (ADR 0076
precedent). Round 1 returned **zero blockers**: `hcs-security-reviewer`
returned `yes`; the other four returned `yes-with-mechanical-tweaks`. The
ontology and security lenses independently confirmed the load-bearing claim —
that appending an excluded `model_ref` is a no-op on each entity's hash
preimage and existing chains stay valid — is **true** for both entities
(AgentClient's preimage is a fixed twelve-slot enumeration `model_ref` is not
added to; `kernel_observed_at` (hashed slot 9) disambiguates any two
observations, so the "two records differing only in `model_ref` hash equal"
property is the intended safe semantics, not a collision).

v2 folds every mechanical tweak: it grounds the AgentClient `model_ref`
exclusion in the `Decision`/`Run` attribution-field precedent directly
(rather than the "AgentClient carries no producer field" rationale, which is
ADR 0059's reason for excluding *producer* specifically); names
`kernel_observed_at` as the re-pin disambiguator in the field semantics; adds
the Ring-1 obligation that a configured-model re-pin is recorded as a *new*
AgentClient observation (fresh `kernel_observed_at`), not an in-place
`model_ref` mutation; clarifies that `Session` has no inline
canonical-concatenation `describe` to amend (its exclusion note lands on the
`model_ref` field/entity describe, not on a per-field hash describe, matching
`Decision`/`Run`); and enriches the §Implementation plan + §Follow-up to name
the concrete test surfaces (the `agentClientSchema.shape`-derived
canonical-order drift guard's exclusion set, the generated-JSON-Schema
not-`required`/nullable-`anyOf` assertions, the two existing exhaustive
field-list assertions that must update, and a superRefine-independence case).
No tweak touched a design decision, so no confirming round 2 was required; v2
is presented for acceptance under the mechanical-tweaks-at-acceptance
discipline (ADR 0058 precedent).

## Date

2026-06-23

## Charter version

Written against implementation charter v1.6.0 and
`docs/host-capability-substrate/ontology-registry.md` v0.4.36 on `main`. The
follow-up schema PR bumps the registry from v0.4.36. The amendment is
constrained by charter invariants 1 (no policy decision in Ring 0 — a model
link is a fact, not a tier), 4 (audit is the integrity surface — the new
fields are attribution, recorded but never trusted at Ring 0; excluded from
the canonical hash), 12 (the model baseline is single-sourced and de-named; a
typed `Model` FK is the in-ontology expression of that rule), and the
paired **8 + 18** (the Ring-1 obligation to bind each `model_ref` to a
`subject_kind: 'model'` Evidence record that does **not** carry
`authority: sandbox-observation` or `authority: self-asserted`, and the
chain-walk rejection that enforces it — the exact "inv. 8 + inv. 18" pairing
`Decision`/`Run`/`ApprovalGrant` already cite for evidence-authority
rejection, e.g. `decision.ts:124`). Both
`Session` and `AgentClient` are minted (audit-chain-committed per ADR 0055
and ADR 0059), so the durable, audit-anchored answer to "which model ran
under this session / this client" can live on the minted envelope without a
separate record.

## Context

ADR 0076 landed `Model` as the 23rd Ring-0 entity (non-minted; a typed home
for model identity / pin form / lifecycle / provenance) and delivered model
attribution **additively** on two minted entities:

- `Decision.model_ref` — "which model decided this" (entity #1).
- `Run.invoker_model_ref` — "which model produced this run" (entity #4).

Both are additive nullable-optional `entityIdSchema` FKs to `Model`, in the
`policy_rule_ref` change class (ADR 0061): no `schema_version` bump, and
**excluded** from the `audit_chain_link_hash` canonical concatenation
("attribution-field posture, like AgentClient excludes producer; existing
chains stay valid"). The model link is producer-asserted; FK existence and
binding to a `subject_kind: 'model'` Evidence record are Ring-1 obligations.

ADR 0076 deliberately deferred two further loci, per operator direction,
because they raised a fork it did not want to gate the `Model` entity on:

- **`AgentClient.model_ref`** — adding a model link to the minted
  `AgentClient` re-opens the question ADR 0059 settled for that entity's
  canonical hash. ADR 0076 Option D ("fold model into `AgentClient`") was
  rejected *as a gating fork*, with the reasoning preserved: "reopens the ADR
  0059 canonical-hash debate (attribution vs identity-in-the-hash) as a
  *gating* fork; the operator deferred it. Model and client are distinct
  grains (one client product spans model swaps)."
- **`Session.model_ref`** — the session is the natural single-model run scope
  (a session runs one model), but it was bundled into the same deferred ADR.

This ADR is that deferred ADR. The fork is the same for both entities, so it
is resolved once: **attribution-alongside** (the model link is an excluded
attribution field), **not identity-in-the-hash** (the model link does not
join the canonical concatenation). The two FKs are then placed at the grains
where a single-valued model link is faithful.

### The grain question

A single model FK on an entity is only honest if the entity's lifetime maps
to one model:

- A **`Session`** runs one model for its lifetime (`agent_invocation`; ADR
  0055). `Session.model_ref` = "the model this session ran" is single-valued
  and faithful. It also ties together the per-invocation attribution already
  on the `Decision`s and `Run`s the session owns.
- An **`AgentClient`** *observation* (a kernel-resolved record at a fixed
  `kernel_observed_at`) likewise pins one configured/default model at that
  instant. `AgentClient.model_ref` = "the model this client was configured to
  invoke by default at `kernel_observed_at`" is single-valued *per
  observation*. The client *identity* (`agent_client_id`, chain root) spans
  model swaps — which is exactly why the model link must be **excluded** from
  the identity hash, not folded into it. A configured-model re-pin is recorded
  as a *new AgentClient observation*, distinguished by its fresh
  `kernel_observed_at` (a hashed slot, ADR 0059) — `model_ref` itself never
  enters the hash; the re-pin is not a new client identity.

This is the precise sense in which "one client product spans model swaps"
(ADR 0076 Option D) is honored: the model is recorded on each observation but
is never part of what makes the client the same client across observations.

## Decision

Add a typed model-attribution FK to each of the two remaining minted entities
named by ADR 0076, in the established additive nullable-optional,
no-`schema_version`-bump, excluded-from-the-canonical-hash change class. Both
are producer-asserted attribution; neither is identity.

### 1. `Session.model_ref`

- Type: `entityIdSchema.nullable().optional()` — a typed attribution FK to a
  `Model` record (ADR 0076).
- Semantics: "which model ran this session." Absent/null when the resolver
  cannot bind the session to a `Model`.
- **Excluded** from the `Session` `audit_chain_link_hash` canonical
  concatenation (attribution-field posture; the exact canonical encoding is
  committed by the mint/audit implementation; existing Session chains stay
  valid because excluded fields never entered the hash).
- No `Session.schema_version` bump (stays `0.1.0`; the ADR 0061
  additive-nullable-FK change class is entity-independent).
- Producer-asserted. FK existence and binding to a `subject_kind: 'model'`
  Evidence record are Ring-1 obligations (mirrors `Decision.model_ref` /
  `Run.invoker_model_ref`).
- No paired digest (unlike `policy_rule_ref` ↔ `resolved_policy_sha256`):
  model attribution carries no resolved-blob co-record, so there is no
  pair-consistency `superRefine` — the field is independently
  absent/null/present.

### 2. `AgentClient.model_ref`

- Type: `entityIdSchema.nullable().optional()` — a typed attribution FK to a
  `Model` record (ADR 0076).
- Semantics: "the model this client was configured to invoke by default at
  `kernel_observed_at`" — the resolved default-model pin (e.g. the
  `.claude/settings.json` `model` alias resolved to a `Model` record).
  Absent/null when the resolver does not observe or cannot resolve a pin.
- **Excluded** from the `AgentClient` `audit_chain_link_hash` canonical
  concatenation, in the same attribution-field posture as
  `Decision.model_ref` / `Run.invoker_model_ref` (an attribution field, not an
  identity input). The `AgentClient` hash describe (ADR 0059) — which is a
  *closed enumeration* of both the hashed slot order and the excluded set —
  gains one sentence recording `model_ref`'s exclusion, so the describe stays
  in sync with the field set; this is distinct from ADR 0059's separate reason
  for excluding *producer* ("AgentClient carries no producer field"). The
  field is appended with **no change to the hash preimage** (the twelve-slot
  order is fixed and `model_ref` is not added to it), and every existing
  AgentClient chain link stays valid. Two observations differing only in
  `model_ref` would hash equal — the intended safe semantics, since
  `kernel_observed_at` (a hashed slot) distinguishes any genuine re-pin, which
  is a fresh observation. The chain root remains `agent_client_id`; "a new
  app_build mints a new AgentClient ID while retirement appends to the
  existing chain" (ADR 0059) is unchanged — a model re-pin does **not** mint a
  new client.
- No `AgentClient.schema_version` bump (stays `0.1.0`; ADR 0059 already
  established that AgentClient canonical-hash amendments are non-version-
  bumping, and this is a strictly weaker additive-field change).
- Producer-asserted by `kernel_agent_client_resolver` (the sole trusted
  producer path; ADR 0059). FK existence, pin → `Model` resolution, and
  binding to a `subject_kind: 'model'` Evidence record are Ring-1 obligations.

### 3. The fork, resolved: attribution-alongside, not identity-in-the-hash

The model link is **excluded** from both entities' canonical hashes. It is
recorded beside the identity, never folded into it. Consequence:

- Existing `Session` and `AgentClient` audit chains remain valid with no
  re-hash and no new commitment — excluded fields never contributed to the
  preimage.
- A model swap is a **fact about** a session/client, not a change to *which*
  session/client it is. The model does not fragment identity.

Identity-in-the-hash (folding `model_ref` into the canonical concatenation,
making a model swap mint a new `AgentClient` id the way `app_build` does) is
**rejected** — see Options §B. It would amend the ADR 0059 canonical field
order (a hash-preimage change invalidating every existing AgentClient chain
link and requiring a fresh commitment), contradict "one client product spans
model swaps," and conflate a *configuration* axis (which model) with the
*build/identity* axis the hash already covers.

### Model-attribution coverage after this ADR

Four minted loci, one consistent posture (additive, excluded-from-hash,
producer-asserted, Ring-1-bound):

| Entity | Field | "which model …" |
|--------|-------|-----------------|
| `Decision` | `model_ref` (ADR 0076) | decided this |
| `Run` | `invoker_model_ref` (ADR 0076) | produced this run |
| `Session` | `model_ref` (this ADR) | ran this session |
| `AgentClient` | `model_ref` (this ADR) | this client is configured to invoke |

### What stays in Ring 1 (not this schema)

- Resolving an `AgentClient` configured-model pin (an alias such as `opus`)
  to a concrete `Model` record — a `pin_value → resolved_model_name`
  resolution, deferred by ADR 0076 to Ring 1.
- The `kernel_agent_client_resolver` obligation that a configured-model
  re-pin is recorded as a **new** AgentClient observation (fresh
  `kernel_observed_at`), never an in-place `model_ref` mutation of a prior
  observation — without which the "single-valued per observation" honesty of
  `AgentClient.model_ref` is not actually held.
- Verifying FK existence (the referenced `Model` record exists) and binding
  each `model_ref` to a `subject_kind: 'model'` Evidence record with
  non-sandbox, non-self-asserted authority (charter inv. 8 / 18).
- Any mandatory-attribution rule (when a `Session`/`AgentClient` *must* carry
  `model_ref`) — Ring-1 mint-policy, not a Ring-0 invariant.
- Any retracted/floor model guard or `reason_kind` for model rejections (a
  later policy slice; ADR 0076 out-of-scope, unchanged).

## Consequences

### Accepts

- Closes the two model-attribution loci ADR 0076 deferred, completing the
  model-as-object attribution ladder across all four minted action/identity
  entities with one uniform posture.
- Zero canonical-hash blast radius: no `schema_version` bump on either
  entity, no re-hash of existing chains, no new commitment — the additive
  excluded-field change class (ADR 0061 / ADR 0076 precedent) carries it.
- Resolves the long-standing AgentClient canonical-hash fork on the record,
  so it stops being an open "future ADR" hanging over the audit-chain design.
- Gives the configured-model pin (an `AGENTS.md`-baseline / evidence fact
  today) a typed, audit-anchored home on the client surface — the G2 "the
  audit chain cannot say which model" gap, closed at the client grain.

### Rejects

- Identity-in-the-hash for either entity (Options §B) — reopens ADR 0059,
  invalidates existing chains, fragments client identity on every model swap.
- A model link on entities whose lifetime spans multiple models at a single
  record (none here — `Session` and the per-`kernel_observed_at`
  `AgentClient` observation are each single-model scopes; a multi-model
  rollup belongs on the Sessions/Runs, not a single FK).
- A paired resolved-model digest (à la `resolved_policy_sha256`) — model
  attribution is producer-asserted with no resolved-blob co-record; adding a
  digest would manufacture pair-consistency ceremony with no source.
- Model-card attributes, an `AliasResolution` sibling, or the eval
  results-ledger — unchanged ADR 0076 deferrals, not reopened here.

### Future amendments

- A `Principal.model_ref` or any further model locus — only if a consumer
  needs it; the four loci here cover the current attribution questions.
- The Ring-1 mint/audit implementation ADR commits the exact canonical
  encoding that *excludes* these fields and the mandatory-attribution policy
  (if any), alongside the `Decision`/`Run` model_ref exclusions.
- The de-versioning CI boundary scan (ADR 0076 deferral) — orthogonal.

## Options considered

### Option A: add `Session.model_ref` + `AgentClient.model_ref`, both attribution-alongside (CHOSEN)

**Pros:** resolves the exact pair ADR 0076 named; one fork resolved once and
applied uniformly; zero canonical-hash blast radius; faithful single-model
grain on each entity (session run-model; client observation configured-pin);
completes the four-locus attribution ladder. **Cons:** two FKs rather than
one; the `AgentClient` link is a configuration fact distinct from the
per-action attribution on `Decision`/`Run`/`Session` (mitigated by precise
`describe` semantics — "configured to invoke by default at
`kernel_observed_at`," not "every model it ran").

### Option B: identity-in-the-hash (fold `model_ref` into the AgentClient canonical concatenation)

**Cons:** amends the ADR 0059 canonical field order — a hash-preimage change
that invalidates every existing AgentClient chain link and requires a new
commitment; makes every model swap mint a new `AgentClient` identity, which
contradicts ADR 0059's "a new app_build mints a new AgentClient ID while
retirement appends" (a model is not a build) and ADR 0076 Option D's "one
client product spans model swaps"; conflates the configuration axis with the
identity axis. ADR 0076 pre-settled against this. **Rejected.**

### Option C: `Session.model_ref` only (omit `AgentClient.model_ref`)

**Cons:** leaves the AgentClient surface model-blind — the configured-model
pin (a real client-surface fact the G2 gap flagged) keeps no typed home, and
the AgentClient canonical-hash fork stays an open "future ADR" rather than
being resolved on the record. Defensible as a minimal slice, but it defers
the harder half of the deferred item rather than closing it. **Rejected** in
favor of resolving the full deferred pair; the operator can trim to this at
the gate if a minimal slice is preferred.

### Option D: `AgentClient.model_ref` only (omit `Session.model_ref`)

**Cons:** the session is the natural single-model run scope that ties the
per-invocation `Decision`/`Run` attribution together; omitting it leaves a
hole at exactly the grain where "which model ran this whole invocation" is
asked. **Rejected.**

## Out of scope

This ADR explicitly does not authorize:

- Zod source, generated JSON Schema, tests, or ontology/registry edits (the
  schema PR per `.agents/skills/hcs-schema-change` follows acceptance).
- Any change to the `Decision.model_ref` / `Run.invoker_model_ref` fields,
  the `Model` entity, or the `model` Evidence subject kind (ADR 0076,
  unchanged).
- Any change to the ADR 0059 canonical field order or GENESIS rule beyond the
  one additive `describe` sentence noting `model_ref` is excluded.
- The Ring-1 pin → `Model` resolver, FK-existence verification, model-Evidence
  binding, or any mandatory-attribution rule.
- Any retracted/floor model guard, `reason_kind` for model rejections, live
  policy, `tiers.yaml`, generated-snapshot, system-config, or `AGENTS.md`
  baseline-authority edits.
- Model-card attributes, `AliasResolution`, the eval results-ledger, or
  `region_prefix` (unchanged ADR 0076 deferrals).

## Implementation plan (for the schema PR that follows acceptance)

1. `packages/schemas/src/entities/session.ts`: add `model_ref:
   entityIdSchema.nullable().optional()` with the attribution `describe`
   (mirror `Decision.model_ref`); no `schema_version` bump. Note: `Session`
   has **no** inline canonical-concatenation `describe` on its
   `audit_chain_link_hash` (it is a bare `sha256DigestSchema` deferring the
   exact order to the mint/audit impl, like `Decision`/`Run`), so the
   exclusion is recorded on the `model_ref` field `describe` (and, if useful,
   the entity-level `describe`) — do **not** invent a canonical-order list on
   `Session`.
2. `packages/schemas/src/entities/agent-client.ts`: add `model_ref:
   entityIdSchema.nullable().optional()` with the configured-pin attribution
   `describe` (naming `kernel_observed_at` as the re-pin disambiguator);
   append one sentence to the `audit_chain_link_hash` `describe` (a closed
   enumeration) recording `model_ref`'s exclusion from the canonical
   concatenation, so the describe stays in sync with the field set; no
   `schema_version` bump.
3. Regenerate JSON Schema (`just generate-schemas`); confirm both fields land
   optional + nullable + not in `required` (the not-`required` + nullable-
   `anyOf[null]` branch assertion, mirroring `decision.test.ts` ~633-642).
4. Tests: `session.test.ts` and `agent-client.test.ts` gain additive-FK
   blocks (absent / null / value accept; field excluded from the required
   set; independence — no pair-consistency refinement; `model_ref` does not
   enter the entity superRefine — e.g. a present `model_ref` does not change a
   valid/invalid Session `state ↔ ended_at` outcome), mirroring the
   `Decision.model_ref` block (`decision.test.ts` ~919-953). Two existing
   exhaustive field-list assertions **must** update or the PR fails on
   unrelated tests: the `Session` `required`-set pin (`session.test.ts`
   ~31-49) and the `AgentClient` envelope-field-set `.toEqual([...])`
   (`agent-client.test.ts` ~166-185). The `agentClientSchema.shape`-derived
   canonical-order drift guard (`agent-client.test.ts` ~187-206) must add
   `model_ref` to its excluded set (so an Option-B refactor that folds
   `model_ref` into the concatenation desyncs and fails), plus a positive
   assertion that the generated `audit_chain_link_hash.description` does
   **not** contain `model_ref`.
5. Ontology section + registry ledger rows updated for both entities; registry
   version bumped from v0.4.36.

## Follow-up regression coverage

- The excluded-field hash invariant (the Option B regression guard), realized
  as two coupled assertions on the existing canonical-order machinery rather
  than prose: (a) the `agentClientSchema.shape`-derived canonical-order drift
  guard (`agent-client.test.ts` ~187-206) excludes `model_ref`, so any future
  refactor that folds it into the concatenation desyncs and fails; (b) the
  generated `AgentClient.audit_chain_link_hash.description` does not contain
  `model_ref`. Plus a computed-vector case: two AgentClient fixtures identical
  in all twelve hashed slots (same `kernel_observed_at`) differing only in
  `model_ref` hash **equal**; the same two differing also in
  `kernel_observed_at` hash **unequal** (a real re-pin is chain-distinguishable).
- A trap asserting `Session.model_ref` / `AgentClient.model_ref` accept
  absent, null, and present independently (no pair-consistency requirement),
  distinguishing them from the `policy_rule_ref` ↔ `resolved_policy_sha256`
  paired field (`decision.ts` ~287-305), and that a present `model_ref` does
  not perturb either entity's lifecycle superRefine.
- All four model-attribution loci (`Decision`, `Run`, `Session`,
  `AgentClient`) should share one excluded-field regression family rather than
  four independent traps, so the exclusion invariant is guarded uniformly.

## Acceptance criteria

- ADR accepted with a `DECISIONS.md` row (next-free **D-081**) and
  status flipped `proposed → accepted`.
- The fork is resolved on the record: attribution-alongside, identity-in-the-
  hash rejected, with the ADR 0059 / ADR 0076 reasoning cited.
- The follow-up schema PR is sequenced after acceptance, on a tree where the
  `Model` entity exists, and bumps the registry from v0.4.36 with no
  `schema_version` bump on either `Session` or `AgentClient`.

## References

### Internal

- `docs/host-capability-substrate/adr/0076-model-ring-0-entity.md` — the
  `Model` entity; §Future amendments names this ADR; Option D states the
  distinct-grains reasoning.
- `docs/host-capability-substrate/adr/0061-decision-rule-attribution-amendment.md`
  — the additive nullable-optional attribution-FK change class (precedent).
- `docs/host-capability-substrate/adr/0059-agentclient-canonical-hash-amendment.md`
  — the AgentClient canonical field order / GENESIS / length-prefix the
  excluded `model_ref` sits beside.
- `docs/host-capability-substrate/adr/0055-session-ring-0-entity.md` — the
  minted `Session` envelope.
- `packages/schemas/src/entities/decision.ts`,
  `packages/schemas/src/entities/run.ts` — the `model_ref` /
  `invoker_model_ref` exclusion `describe` text this ADR mirrors.

### External

- None. This ADR is internal-ontology only.

## Revision history

- v1 (2026-06-23): initial draft. Resolves the deferred ADR-0076
  model-attribution fork for `AgentClient` and `Session`:
  attribution-alongside (excluded from each canonical hash, no
  `schema_version` bump), identity-in-the-hash rejected. Pending five-lens
  review.
- v2 (2026-06-23): folds the round-1 five-lens mechanical tweaks (zero
  blockers). Grounds the AgentClient `model_ref` exclusion in the
  `Decision`/`Run` attribution-field precedent (not ADR 0059's
  "no producer field" reason); names `kernel_observed_at` as the re-pin
  disambiguator; adds the Ring-1 obligation that a re-pin is a new observation
  (not an in-place mutation); clarifies `Session` has no inline
  canonical-hash describe to amend; corrects the inv-18 citation to the paired
  "inv. 8 + inv. 18" evidence-authority-rejection framing; and enriches the
  §Implementation plan + §Follow-up with the concrete test surfaces
  (canonical-order drift-guard exclusion set, generated-schema
  not-`required`/nullable assertions, the two exhaustive field-list tests that
  must update, superRefine-independence). Presented for acceptance under the
  mechanical-tweaks-at-acceptance discipline (no confirming round 2; no tweak
  altered a design decision).
