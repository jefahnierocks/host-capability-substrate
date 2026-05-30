---
adr_number: 0062
title: Capability Ring-0 entity
status: proposed
version: v1
date: 2026-05-29
charter_version: 1.4.1
tags: [capability, ring-0, policy-registry, operation-class, non-minted, m1-entity]
---

# ADR 0062: Capability Ring-0 entity

## Status

`proposed`

Drafted 2026-05-29 as the second of the remaining-11 M1 canonical Ring-0
entities, in the `PolicyRule → Capability → CommandShape` policy-registry
order (PolicyRule landed as ADR 0060 / D-057). This ADR is design-only. It
does not modify Zod source, generated JSON Schema, tests, registry docs,
other ADRs, live policy, generated snapshots, system-config, or Ring 1
implementation code. The follow-up schema PR follows only after ADR
acceptance per `.agents/skills/hcs-schema-change`.

v1 is dispatched to four reviewers (`hcs-architect`,
`hcs-ontology-reviewer`, `hcs-policy-reviewer`, `hcs-security-reviewer`),
matching the PolicyRule (ADR 0060) entity-review discipline; the entity
reuses a closed enum and references a typed operation taxonomy, so
`hcs-ontology-reviewer` is mandatory per the meta-ADR FK-table rule.

## Date

2026-05-29

## Charter version

Written against implementation charter v1.4.1 and
`docs/host-capability-substrate/ontology-registry.md` v0.4.20 on `main`
(v0.4.21 once the PolicyRule schema PR lands). The entity is constrained by
charter invariants 1 (no policy decision in an adapter/schema), 2 (typed
operation over shell strings), 6 (forbidden operations are not registered as
capabilities), 10 (live policy is canonical in system-config), and 11 (the
capability registry refuses to render deprecated verbs).

## Context

`Capability` is defined in `docs/host-capability-substrate/ontology.md` as
"a declared kernel operation (e.g., `service.activate`)". It is one of the 22
canonical M1 entities and a Q-011 review-grammar bucket-2 entity — a
standalone Ring 0 entity with durable identity and lifecycle. No
`capability.ts` schema source exists yet; no `capability_schema_version`
literal is registered. It is the registry declaration that a specific kernel
operation is known, and (via its operation class) which policy governs it.

`Capability` sits in the policy-registry layer next to `PolicyRule` (ADR
0060) and `CommandShape` (the next M1 entity):

- `PolicyRule` classifies an `OperationShape.operation_class` into a tier and
  approval shape.
- `Capability` declares that a specific operation (`service.activate`) is a
  registered, known kernel operation, tagged with the `operation_class` that
  governs it.
- `CommandShape` renders an operation into an argv vector + env profile +
  execution lane; charter inv. 11 says the capability registry refuses to
  render deprecated verbs.

### The three "capability" senses (disambiguation)

HCS overloads the word "capability" across three unrelated dimensions. This
ADR defines **only the third**, and the schema must not conflate it with the
other two:

1. **capability-class** — the `AgentClient.containment_mechanism` axis (ADR
   0037), a closed `*_capable` enum (`kernel_sandbox_capable`,
   `container_capable`, …) naming what a product family **can contain**. This
   is an axis on another entity, not the `Capability` entity.
2. **capability-state vocabulary** — the `BoundaryObservation.observation_state`
   enum (ADR 0022 / ADR 0017): `proven | denied | pending | stale |
   contradictory | inapplicable | unknown`, plus the per-surface
   `contextCapabilityStatus` on `ExecutionContext`. These label **observations
   at gate-evaluation time**, not the registry record. They do **not** belong
   on the `Capability` entity.
3. **Capability entity (this ADR)** — the durable, non-minted registry
   declaration of a known kernel operation. It says "operation `X` is
   registered, of operation class `C`, and is `active` / `deprecated` /
   `retired`." It carries no observation state and no containment-class axis.

## Options considered

### Option A: Non-minted typed registry declaration (chosen)

`Capability` is a non-minted Ring 0 declaration, structurally a peer of
`PolicyRule`: a typed shape of one registered kernel operation, carrying the
operation name, its governing `operation_class`, a registry lifecycle state,
and `source_provenance` binding the declaration to the capability-registry
blob it was read from. No `audit_chain_link_hash`, no producer-mint field, no
`evidence_refs`; absent from the ADR 0057 mint scope.

**Pros:**

- Matches the ontology definition ("a declared kernel operation") and the
  policy-registry layer it shares with PolicyRule and CommandShape.
- A declaration, not an event: like PolicyRule, it is sourced from a registry
  blob and carries `source_provenance`, not an audit-chain hash.
- Reuses `operationShapeOperationClassSchema` so the registry, PolicyRule, and
  the gateway share one operation-class vocabulary with no drift, without the
  schema encoding the `operation_class → tier` mapping (inv. 1 / inv. 10).
- Keeps the three "capability" senses separate: no observation-state enum, no
  containment-class axis on the record.

**Cons:**

- The Ring 0 schema cannot enforce charter inv. 6 (forbidden operations are
  not registered) or inv. 11 (deprecated verbs are not rendered) by itself —
  those are Ring 1 capability-registration / CommandShape-rendering
  obligations, because the schema deliberately does not carry the tier or do
  the render. (Consistent with inv. 1.)

### Option B: Minted, audit-chain-committed entity

Give `Capability` an `audit_chain_link_hash`, a producer allowlist, and a
mint path, like Decision/ApprovalGrant/Lease/Run/Principal/Session.

**Pros:**

- Uniform with the minted authorization envelopes.

**Cons:**

- Conflates the registry **declaration** with capability **evidence/observation**.
  A capability is declared in a registry, not minted per authorization event.
- ADR 0057's mint scope is the six audit-chain entities (plus AgentClient via
  ADR 0059); adding a registry declaration to that scope is a category error
  and would force a producer/GENESIS/hash design the entity does not need.
- PolicyRule (the direct peer) is non-minted; minting Capability would split
  the policy-registry layer.

### Option C: Fold Capability into BoundaryObservation / an observation payload

Represent capabilities as `BoundaryObservation` payloads or per-surface
observation rows.

**Pros:**

- Reuses the observation envelope and the capability-state vocabulary.

**Cons:**

- Conflates the registry record with the capability-**state** vocabulary
  (sense 2). Observations answer "is this capability present on this surface
  right now"; the registry answers "is this operation a known, declared
  kernel operation." They have different lifetimes and authorities.
- A declared operation must persist independently of any single surface
  observation.

## Decision

Choose **Option A**. `Capability` is a non-minted Ring 0 entity. The
follow-up schema PR adds `packages/schemas/src/entities/capability.ts` with a
`.strict()` envelope:

- `schema_version`: `capabilitySchemaVersionSchema = z.literal('0.1.0')`.
- `capability_id`: `entityIdSchema` — the durable synthetic identity.
- `operation_name`: `capabilityOperationNameSchema` — the declared kernel
  operation, a lowercase dotted identifier of at least two segments
  (`service.activate`, `git.commit`), regex
  `^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9_]*)+$`. The shape forbids path/URI/secret
  shapes (`/`, `://`, `op://`) by construction.
- `operation_class`: `operationShapeOperationClassSchema` (reused, not
  redefined) — the semantic class that governs this operation, so the gateway
  can resolve the governing `PolicyRule` (keyed on the same `operation_class`)
  without the schema encoding the `operation_name → operation_class` or
  `operation_class → tier` mapping (inv. 1 / inv. 10).
- `capability_state`: `capabilityStateSchema = z.enum(['active', 'deprecated',
  'retired'])` — the registry lifecycle. `active` is renderable; `deprecated`
  is registered but render-refused (charter inv. 11); `retired` is a retained
  historical record, render-refused. (Distinct from the capability-state
  observation vocabulary of sense 2.)
- `source_provenance`: `capabilitySourceProvenanceSchema`, a `.strict()`
  sub-object mirroring `PolicyRule.source_provenance`:
  - `authority`: `z.literal('capability_registry')` (a source-of-truth marker
    deliberately disjoint from `evidenceAuthoritySchema`; it confers no
    authority by itself);
  - `source_registry_path`: `capabilitySourceRegistryPathSchema` (a relative
    path, no `..`, regex `^(?!.*\.\.)[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$`);
  - `source_registry_sha256`: `sha256DigestSchema` — the digest of the
    capability-registry blob this declaration was read from;
  - `source_registry_sha256_basis`: `z.literal('capability_registry_blob')`;
  - `observed_at`: `isoDateTimeSchema`.

`Capability` carries **no** `audit_chain_link_hash`, **no** producer-mint
field, **no** `evidence_refs`, **no** observation-state enum, and **no**
containment-class axis. `Capability.schema_version` is its own literal; no
existing entity's `schema_version` changes.

No same-record `superRefine` is required at v1: the envelope has no
cross-field coupling (unlike PolicyRule's forbidden-tier ↔ approval-path
coupling). The schema enforces only field formats and `.strict()` closure.

### What stays in Ring 1 (not this schema)

- **Charter inv. 6** — "forbidden operations are not registered as
  capabilities." The schema does not carry the tier and cannot know which
  `operation_class` is forbidden (that is live-policy content via PolicyRule,
  inv. 1 / inv. 10). The Ring 1 capability-registration service MUST refuse to
  register a `Capability` whose governing `PolicyRule.tier == 'forbidden'`.
- **Charter inv. 11** — the CommandShape renderer (Ring 1 / downstream) MUST
  refuse to render a `Capability` whose `capability_state` is `deprecated` or
  `retired`. The schema only carries the state.
- **`source_registry_sha256` trust** — the Ring 1 loader MUST verify the
  digest against the bound, verified capability-registry blob before a
  declaration is trusted (a B-2-style obligation mirroring ADR 0060's
  PolicyRule loader rule). The schema only validates digest format.
- **`operation_name` uniqueness** and the FK closure of `operation_class` to
  the registered class set are Ring 1 registration obligations.

## Consequences

### Accepts

- `Capability` lands as a non-minted Ring 0 registry declaration after the
  follow-up schema PR; M1 source-schema progress advances one entity.
- The policy-registry layer (PolicyRule → Capability → CommandShape) shares
  one `operation_class` vocabulary with no drift.
- The three "capability" senses are documented and kept structurally
  separate.
- `Capability.schema_version` is `0.1.0`; no other entity changes.

### Rejects

- A minted / audit-chain-committed Capability (Option B) and its inclusion in
  ADR 0057 mint scope.
- Folding Capability into BoundaryObservation / observation payloads (Option
  C).
- Putting the capability-state observation vocabulary or the containment-class
  axis on the Capability record.
- Encoding the `operation_name → operation_class` or `operation_class → tier`
  mapping in the schema (live-policy/registry content; Ring 1).
- Trusting a self-asserted `source_registry_sha256` at the Ring 0 layer.
- Any live-policy, generated-snapshot, system-config, other-ADR, or Ring 1
  implementation change in this ADR slice.

### Future amendments

- A typed linkage between `OperationShape` (or `CommandShape`) and a
  `Capability` (e.g., a `capability_ref` on the operation/command) is a
  separate amendment when the gateway/rendering path needs it — analogous to
  ADR 0061's B-1 Decision amendment.
- A `capability_kind` discriminator, a `valid_until` freshness bound, or a
  tool-scoped `tool_or_provider_ref` (forward reference to the unbuilt
  ToolProvider/ToolInstallation/ResolvedTool entities) may be added additively
  if operational evidence warrants.
- The canonical capability-registry source location and its snapshot-binding
  (the basis for `source_registry_sha256`) are owned by the future Ring 1
  capability-registration ADR.

## Out of scope

This ADR explicitly does not authorize:

- schema source edits in `packages/schemas/src/entities/capability.ts`;
- generated JSON Schema regeneration;
- ontology or ontology-registry edits;
- test or fixture edits;
- edits to other ADRs;
- live policy, `tiers.yaml`, or a capability-registry blob;
- generated-snapshot changes;
- system-config edits;
- Ring 1 capability-registration, CommandShape-rendering, gateway, broker,
  tool-resolution, host-state, or dashboard behavior;
- adding `Capability` to the ADR 0057 mint scope.

## Implementation plan after acceptance

The follow-up schema PR, and only that PR, should:

1. Add `packages/schemas/src/entities/capability.ts`:
   - `capabilitySchemaVersionSchema`, `capabilityOperationNameSchema`,
     `capabilityStateSchema`, `capabilitySourceRegistryPathSchema`,
     `capabilitySourceProvenanceSchema`, and the `.strict()` `capabilitySchema`
     reusing `operationShapeOperationClassSchema` (import) and the `common.ts`
     primitives (`entityIdSchema`, `sha256DigestSchema`, `isoDateTimeSchema`);
   - type exports for each schema.
2. Register the entity in `packages/schemas/src/index.ts` and
   `packages/schemas/scripts/generate-json-schemas.ts`; regenerate
   `packages/schemas/generated/Capability.schema.json`.
3. Add `packages/schemas/tests/capability.test.ts` proving:
   - a well-formed Capability accepts;
   - each `capability_state` value accepts;
   - a non-dotted / single-segment `operation_name` rejects, and a
     path/URI/secret-shaped one (`/etc/x`, `op://v/i/f`) rejects;
   - an `operation_class` outside `operationShapeOperationClassSchema` rejects
     (proving the reuse, no local redefinition);
   - a `source_provenance` with the wrong `authority` literal, a non-`sha256:`
     digest, a `..`-bearing `source_registry_path`, or a missing field rejects;
   - an unknown top-level field rejects (`.strict()`), and the absence of
     `audit_chain_link_hash` / `evidence_refs` / producer is intentional (the
     entity is non-minted).
4. Update `docs/host-capability-substrate/ontology.md` (a `Capability`
   section) and `docs/host-capability-substrate/ontology-registry.md` (a
   `Capability @ '0.1.0'` schema-version-ledger row; enum mirrors for
   `capabilityStateSchema`; Sub-rule 9 kebab/identifier grandfather if the
   `operation_name` form requires it; a References row for ADR 0062).
5. Do not edit live policy, a capability-registry blob, generated snapshots,
   system-config, other ADRs, or Ring 1 code in the schema PR.

## Follow-up regression coverage

| Failure class | Coverage posture |
|---|---|
| Non-minted shape drift (an `audit_chain_link_hash` / producer creeping onto Capability) | Schema tests assert the envelope shape and `.strict()`; no regression trap unless an observed failure with cited fixture evidence appears. |
| `operation_name` accepting a path/URI/secret shape | Schema tests assert reject for `/`, `://`, `op://`, single-segment forms; no synthetic trap at ADR acceptance. |
| `operation_class` drift from `operationShapeOperationClassSchema` | Schema test asserts an out-of-enum class rejects (proves reuse, not redefinition). |
| Self-asserted `source_registry_sha256` trusted | Ring 0 validates digest format only; the digest-vs-bound-registry trust check is a Ring 1 capability-registration implementation test (trajectory-asserted: reject at the verification step), not a Ring 0 test or an ADR-time trap. |
| Forbidden operation registered / deprecated verb rendered | Ring 1 capability-registration / CommandShape-rendering implementation tests when those services land; no Ring 0 coverage now. |

## Acceptance criteria

- Operator confirms the ADR 0062 v1 scope and the non-minted registry-entity
  design.
- All four reviewers return ready-for-acceptance, or all blockers are absorbed
  in a later revision: `hcs-architect`, `hcs-ontology-reviewer`,
  `hcs-policy-reviewer`, `hcs-security-reviewer`.
- The accepted ADR keeps `Capability` non-minted, with no
  `audit_chain_link_hash` / producer / `evidence_refs` / observation-state /
  containment-class on the record, and keeps the three "capability" senses
  separate.
- The accepted ADR reuses `operationShapeOperationClassSchema` without
  redefinition and keeps the `operation_class → tier` mapping out of the
  schema.
- The accepted ADR routes charter inv. 6 (registration refusal), inv. 11
  (render refusal), and the `source_registry_sha256` trust check to Ring 1.
- The accepted ADR preserves the schema-change boundary: no Zod source,
  generated JSON Schema, ontology, registry, test, fixture, live-policy,
  registry-blob, generated-snapshot, system-config, or Ring 1 implementation
  changes in the ADR acceptance slice.
- `just verify` remains green.

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md` v1.4.1
  — invariants 1, 2, 6, 10, 11.
- ADR 0060 / D-057: `PolicyRule` Ring 0 entity — the non-minted
  policy-registry peer, the `source_provenance` pattern, and the
  `operationShapeOperationClassSchema` reuse precedent.
- ADR 0037: `AgentClient` — the `containment_mechanism` capability-class axis
  (sense 1) and `containment_runtime_capability_exceeded` reason kind.
- ADR 0022 / ADR 0017: `BoundaryObservation.observation_state` and the
  dashboard capability-state vocabulary (sense 2).
- ADR 0057 / D-052: Ring 1 mint/audit service scope (Capability is outside
  it) and the listed-but-unbuilt capability-registration service.
- Ontology: `docs/host-capability-substrate/ontology.md` (`Capability`
  one-line definition) and `ontology-registry.md` (Q-011 bucket-2
  classification, schema-version ledger).
- Source schemas at draft time:
  `packages/schemas/src/entities/operation-shape.ts`
  (`operationShapeOperationClassSchema`); `packages/schemas/src/common.ts`
  (`entityIdSchema`, `sha256DigestSchema`, `isoDateTimeSchema`).
- Schema-change workflow: `.agents/skills/hcs-schema-change/SKILL.md`.
- Decision ledger: `DECISIONS.md` — D-057.

### External

- None. This is an internal ontology/schema-design ADR.
