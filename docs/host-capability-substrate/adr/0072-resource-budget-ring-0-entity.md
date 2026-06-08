---
adr_number: 0072
title: ResourceBudget Ring-0 entity
status: accepted
version: v2
date: 2026-06-08
charter_version: 1.4.1
tags: [resource-budget, ring-0, non-minted, storage-primitive, observation-disambiguation, m1-final]
---

# ADR 0072: ResourceBudget Ring-0 entity

## Status

`accepted`

Drafted 2026-06-08 as the **last** M1 canonical Ring-0 entity (per PLAN.md
§Current Focus order): the third "storage primitive" (`Artifact` + `Lock`
landed; `ResourceBudget` here). Accepting + landing this entity closes the M1
22-entity Ring-0 set at the source layer. This ADR is design-only. It does not
land Zod source, generated JSON Schema, tests, ontology/registry edits, live
policy, generated snapshots, system-config, or Ring 1 implementation code. The
schema PR follows only after ADR acceptance per `.agents/skills/hcs-schema-change`.

The operator confirmed the entity shape (2026-06-08): a **non-minted,
per-dimension allocation record** — `resource_budget_id` + a required `session_id`
FK + a `resource_kind` enum + a `limit_value` + a `limit_unit` enum + a
`budget_state` (`active` | `retired`) + `source_provenance`.

ADR 0072 v1 was dispatched to all five reviewers for round 1 on 2026-06-08
(`hcs-ontology-reviewer` load-bearing for the allocation-vs-Observation
disambiguation). All five returned `yes` or `yes_with_mechanical_tweaks` with
**zero blockers**: policy, security, and eval returned `yes`; ontology and
architect returned `yes_with_mechanical_tweaks`. The `ResourceBudget` (durable
allocation) vs `ResourceBudgetObservation` (shipped Evidence pressure-reading)
disambiguation, the pre-reserved `Evidence.subject_kind: 'resource_budget'`, the
collision-free field/export names, and the `session_id` Session FK were all
confirmed against source. v2 folds every mechanical tweak. The load-bearing one
(architect): the lifecycle field is **renamed `budget_status` → `budget_state`**
for peer consistency — every landed lifecycle field uses the `_state` suffix
(`resolution_state` / `installation_state` / `provider_state` / `host_state` /
`capability_state` / `lease_state` / …), and unlike Lock's `lock_status` (which
avoided a real shipped `lock_state` collision) there is NO `budget_state` collision
forcing `_status`; the operator's substantive choice (an `active` | `retired`
lifecycle) is unchanged. v2 also records the field-name collision sweep; pins the
three enum-schema export identifiers (`resourceBudgetResourceKindSchema` /
`resourceBudgetLimitUnitSchema` / `resourceBudgetStateSchema`); adds the
synthetic-UUID-only accept-and-trap fixture discipline + a sibling-declaration-authority
reject probe to the schema-PR test plan; flags flipping the stale ontology
`future ResourceBudget` forward-reference (the CommandShape `timeout_seconds`
narrative) when the schema PR lands; and affirms the no-secret-slot scan note.
Because round 1 returned zero blockers, no confirming round 2 was required
(mechanical-tweaks-at-acceptance, ADR 0058 precedent).

ADR 0072 is accepted 2026-06-08 as D-070. Round 1 returned zero blockers and v2
folded every mechanical tweak (notably the `budget_status` → `budget_state` rename
for `_state`-suffix peer consistency), so no confirming round 2 was required. It
establishes the third and final M1 storage primitive: a non-minted, per-dimension
per-session resource allocation — `resource_budget_id` + a required `session_id`
FK + a `resource_kind` enum + a `limit_value` + a `limit_unit` enum + a
`budget_state` (`active` | `retired`) + `source_provenance` — the durable
ALLOCATION distinct from the shipped `ResourceBudgetObservation` (the Evidence
pressure reading that feeds it), fulfilling the pre-reserved
`Evidence.subject_kind: 'resource_budget'` with no `Evidence` schema change, and
leaving the `resource_kind` ↔ `limit_unit` consistency as a Ring 1 obligation. The
follow-on schema PR (`resource-budget.ts` + generated + tests + ontology/registry,
incl. the `resourceBudget*` enum exports, the `resource_kind` ↔ `limit_unit`
accept-and-trap, the `resource_budget_id` accept-and-trap, and the flip of the
stale ontology `future ResourceBudget` CommandShape forward-reference) **closes the
M1 22-entity Ring-0 set** at the source layer. The Ring 1 obligations (`session_id`
FK existence, `resource_kind` ↔ `limit_unit` consistency, sandbox non-promotion per
inv. 8, `resource_budget_id` opacity, supersession, and budget enforcement against
`ResourceBudgetObservation` pressure) remain future work.

## Date

2026-06-08

## Charter version

Written against implementation charter v1.4.1 and
`docs/host-capability-substrate/ontology-registry.md` v0.4.32. `ResourceBudget` is
constrained by charter invariant 1 (no live-policy content in Ring 0 — a budget
allocation is a fact Ring 1 reads, not a tier) and invariant 8 (the allocation
must be sourced from host-authoritative state, not promoted from a sandbox
observation — a Ring 1 obligation).

## Context

`ResourceBudget` is "per-session CPU/memory/network/sandbox-concurrency
allocation" (ontology §Entities). It is the third and final lower-coupling M1
"storage primitive" (`Artifact` / `Lock` / `ResourceBudget`), and the last entity
in the canonical M1 22-entity set.

Two disambiguation points:

**1. `ResourceBudget` (the durable allocation) vs `ResourceBudgetObservation` (the
Evidence pressure reading).** `ResourceBudgetObservation` (a shipped direct
`Evidence` subtype) observes runner resource PRESSURE — `cpu_pressure_pct`,
`memory_pressure_pct`, `disk_pressure_pct`, `active_jobs_count`, `cache_size_bytes`
— over a window, keyed to `runner_host_id`; the ontology already states it "feeds
the durable `ResourceBudget` entity rather than duplicating it." `ResourceBudget`
is the durable per-session ALLOCATION (a LIMIT), not the pressure reading. They
are complementary: the observation feeds the budget. `Evidence.subject_kind:
'resource_budget'` is ALREADY Zod-defined (`evidence.ts`), so this ADR fulfills a
pre-reserved subject kind WITHOUT modifying `evidenceSubjectKindSchema` or bumping
`Evidence.schema_version` (the Artifact / Lock precedent).

**2. Per-dimension records, not one all-dimensions record.** A `ResourceBudget`
is one allocation for one (session, resource) pair: `resource_kind` (cpu / memory
/ network / sandbox_concurrency / unknown) + a numeric `limit_value` + a
`limit_unit` (cores / bytes / bytes_per_sec / count / percent / unknown). A session
has several `ResourceBudget` records, one per resource. This is uniform (a new
dimension widens the enum via the registered §Procedure rule, not a schema
version bump) and consistent with the house enum pattern
(`manager_kind` / `install_surface_kind` / `lock_kind`). The heterogeneous units
across dimensions are made explicit by `limit_unit` rather than implied.

`ResourceBudget` carries a `budget_state` (`active` | `retired`): a re-allocation
produces a NEW `active` record and retires the prior (a Ring 1 supersession
obligation); `retired` is a valid historical record, not a policy-denied state.

## Decision

Choose **Option A**. `ResourceBudget` is a non-minted Ring-0 per-dimension,
per-session allocation record with a `budget_state` lifecycle.

### Entity shape (design sketch; exact Zod lands in the schema PR)

```text
ResourceBudget (non-minted Ring 0; the third storage primitive)
  schema_version     z.literal('0.1.0')
  resource_budget_id entityIdSchema
  session_id         entityIdSchema             // REQUIRED FK to Session (ADR 0055)
  resource_kind      enum: cpu | memory | network | sandbox_concurrency | unknown
  limit_value        z.number().int().min(0)    // a numeric allocation FACT
  limit_unit         enum: cores | bytes | bytes_per_sec | count | percent | unknown
  budget_state      enum: active | retired
  source_provenance  { authority: 'resource_budget_declaration', observed_at }
```

`.strict()` envelope. NO `audit_chain_link_hash`, NO producer-mint field, NO
`evidence_refs`; absent from the ADR 0057 mint scope. Reuses `entityIdSchema` and
`isoDateTimeSchema` (`common.ts`).

### Fields

- `session_id` — a REQUIRED typed FK to `Session` (ADR 0055): the session the
  budget is allocated to ("per-session"). The `_id` (not `_ref`) suffix is correct
  (required, monomorphic, target exists). FK existence is a Ring 1 obligation.
- `resource_kind` — the budgeted dimension: `cpu` | `memory` | `network` |
  `sandbox_concurrency` | `unknown`. A descriptive FACT Ring 1 reads, never a
  verdict (inv. 1). Widening via the registered §Procedure rule.
- `limit_value` — a non-negative integer allocation FACT (the limit magnitude); a
  fact Ring 1 reads, carrying no secret/value-at-rest.
- `limit_unit` — the unit of `limit_value`: `cores` | `bytes` | `bytes_per_sec` |
  `count` | `percent` | `unknown`. Made explicit because units are heterogeneous
  across dimensions. Ring 0 does NOT cross-constrain `resource_kind` ↔ `limit_unit`
  (e.g. a `cpu` budget recorded with `limit_unit: bytes` is structurally ACCEPTED
  at Ring 0 — a recorded accept-and-trap; the dimension↔unit consistency is a
  Ring 1 obligation, mirroring the ResolvedTool basis↔context non-cross-constraint,
  inv. 1).
- `budget_state` — `active` | `retired`; a re-allocation supersedes (Ring 1).
  `retired` is a valid historical record, not a policy-denied state. Uses the `_state`
  lifecycle-suffix convention (peer of `resolution_state` / `installation_state` /
  …); a design-time collision sweep confirmed `resource_budget_id` / `resource_kind` /
  `limit_value` / `limit_unit` / `budget_state` are collision-free across the schema
  set, and the export names (`resourceBudget*`) are disjoint from the shipped
  `resourceBudgetObservation*` Evidence subtype.
- `source_provenance` — a `.strict()` declaration-site binding (`authority`
  literal `resource_budget_declaration`, disjoint from `evidenceAuthoritySchema`
  and conferring no authority by itself; `observed_at`), mirroring the
  `Artifact` / `Lock` / `ToolInstallation` non-minted provenance pattern.

### What stays in Ring 1 (not this schema)

- The `resource_kind` ↔ `limit_unit` consistency check (a `cpu` budget should not
  carry `bytes`), and budget-vs-`ResourceBudgetObservation`-pressure evaluation.
- `session_id` FK existence; NOT promoting a sandbox-observed allocation to a
  host-authoritative `ResourceBudget` (charter inv. 8).
- `resource_budget_id` opacity (see §Consequences accept-and-trap).
- Budget supersession (a `retired` budget; a new `active` budget) and any
  enforcement of the limit against actual consumption.

## Consequences

### Accepts

- HCS gains the durable per-session resource allocation as a clean non-minted
  peer; the third and final storage primitive — closing the M1 22-entity Ring-0 set.
- The per-dimension shape is uniform + extensible (a new dimension widens the enum,
  not the schema version), consistent with the house enum pattern.
- The `ResourceBudget` (allocation) vs `ResourceBudgetObservation` (pressure
  reading) distinction is explicit; `ResourceBudget` fulfills the pre-reserved
  `Evidence.subject_kind: 'resource_budget'` with NO `evidenceSubjectKindSchema`
  change and NO `Evidence.schema_version` bump.

### Rejects

- An all-dimensions-in-one record (Option B) — heterogeneous fields, awkward
  optionality, and a schema-version bump per new dimension.
- An immutable / no-state shape (Option C) — a budget allocation changes over a
  session; a `budget_state` makes current-vs-superseded legible (a budget is not
  content-addressed like Artifact).
- Minting (Option D) — an allocation is a fact, not an audit-chain identity;
  absent from the ADR 0057 mint scope.
- A live-policy/tier field anywhere (a budget is a fact Ring 1 reads, inv. 1).
- A `resource_kind` ↔ `limit_unit` cross-constraint at Ring 0 (it is a Ring 1
  obligation, inv. 1).
- Any live-policy, generated-snapshot, system-config, ADR 0045 (the Observation),
  or Ring 1 implementation change in this ADR slice.

### Future amendments

- `resource_kind` / `limit_unit` enum widening via the registered §Procedure rule.
- A budget window / valid-until field IF Ring-1 enforcement needs it modeled at the
  entity layer (deferred; `source_provenance.observed_at` suffices at v1).

## Options considered

### Option A: Non-minted per-dimension allocation + budget_state (CHOSEN)

`session_id` + `resource_kind` + `limit_value` + `limit_unit` + `budget_state` +
`source_provenance`. **Pros:** uniform + extensible; explicit units; clean
allocation-vs-observation distinction; `budget_state` for supersession. **Cons:**
a session's full allocation spans multiple records (acceptable — one per resource).

### Option B: All-dimensions-in-one record

Per-dimension typed limit fields on a single per-session record. **Cons:**
heterogeneous fields; awkward optionality; a schema-version bump per new dimension.

### Option C: Immutable, no budget_state

**Cons:** a budget changes over a session; without a status a reader cannot tell a
current allocation from a superseded one; not content-addressed (unlike Artifact).

### Option D: Minted typed-identity envelope

**Cons:** an allocation is a fact, not an audit-chain-anchored identity; absent from
the ADR 0057 mint scope by design.

## Out of scope

This ADR explicitly does not authorize:

- Zod source, generated JSON Schema, tests, or ontology/registry edits (the schema
  PR per `.agents/skills/hcs-schema-change` follows).
- Edits to ADR 0045 (`ResourceBudgetObservation`), ADR 0055 (`Session`), or any
  other ADR; any `evidenceSubjectKindSchema` / `Evidence.schema_version` change.
- Live policy, `tiers.yaml`, generated-snapshot, or system-config edits.
- Ring 1 budget enforcement / consumption-evaluation / resource_kind↔limit_unit
  validation code.
- Execution broker, gateway, capability registration, or dashboard behavior.

## Implementation plan (for the schema PR that follows acceptance)

1. Add `packages/schemas/src/entities/resource-budget.ts`:
   `resourceBudgetSchemaVersionSchema = z.literal('0.1.0')`; the `resource_kind`
   (5 values; export `resourceBudgetResourceKindSchema`), `limit_unit` (6 values;
   export `resourceBudgetLimitUnitSchema`), and `budget_state` (`active`/`retired`;
   export `resourceBudgetStateSchema`) enums (entity-prefixed per the house pattern,
   distinct from the shipped `resourceBudgetObservation*` symbols) — each
   `.describe()` carrying the inv-1 "descriptive FACT, never a verdict
   (inv. 1)" clause + the `unknown` house-sentinel note; a `limit_value`
   non-negative integer (`z.number().int().min(0)`); the
   `resourceBudgetSourceProvenanceSchema` `.strict()` sub-object (`authority`
   literal `resource_budget_declaration`, `.describe()` mirroring the peer
   non-minted provenance — disjoint, confers no authority, sandbox non-promotion
   per inv. 8 a Ring 1 obligation "not encoded here"); and the `.strict()`
   `resourceBudgetSchema` (required `session_id` FK). Reuse `entityIdSchema` +
   `isoDateTimeSchema` from `common.ts`. Export names are `resourceBudget*` (the
   existing `resourceBudgetObservation*` exports are the distinct Evidence subtype).
2. Register in `packages/schemas/src/index.ts` (alphabetical export block) and
   `packages/schemas/scripts/generate-json-schemas.ts` (import + `schemaEntries`),
   then regenerate `ResourceBudget.schema.json`.
3. Add `packages/schemas/tests/resource-budget.test.ts`: a well-formed budget
   accepts; each `resource_kind` / `limit_unit` / `budget_state` value accepts and
   out-of-enum rejects; `limit_value` accepts `0` and a positive int and rejects a
   negative / float / string; the `resource_kind`↔`limit_unit` cross-combination is
   NOT constrained (a `cpu` + `bytes` combination ACCEPTS — the recorded
   accept-and-trap); `.strict()` rejects injected mint / value / policy fields by
   name (`audit_chain_link_hash`, `producer`, `evidence_refs`, `tier`,
   `approval_required_for`); `source_provenance` wrong-authority (every
   `evidenceAuthoritySchema` option AND a sibling declaration authority, e.g.
   `artifact_declaration`, mirroring `lock.test.ts`) + non-strict reject; the
   `resource_budget_id` raw-shape accept-and-trap (a SYNTHETIC UUID fixture only,
   per the storage-primitive peers); the generated `required` set is the eight
   fields (no optional fields).
4. Update `docs/host-capability-substrate/ontology.md` (the `### ResourceBudget`
   entity section + version + change log) and
   `docs/host-capability-substrate/ontology-registry.md` (a
   §Current-schema-version-ledger row at `'0.1.0'`, a §Schema-enum-mirrors
   `ResourceBudget` subsection for `resource_kind` / `limit_unit` / `budget_state`
   WITH the allocation-vs-`ResourceBudgetObservation` + the dimension↔unit
   non-cross-constraint notes, a §References row, version + change log). Also flip
   the stale `future ResourceBudget entity` forward-reference in the ontology
   CommandShape `timeout_seconds` narrative to a built cross-reference (same
   stale-forward-reference class the SecretReference schema PR fixed in CommandShape).
   Note in the change log that this CLOSES the M1 22-entity Ring-0 set.
5. Extend the `scripts/ci/forbidden-string-scan.sh` documentary note to
   `ResourceBudget` (the `resource_budget_id` accept-and-trap; affirm the entity
   holds no secret slot — closed enums + a bounded int + a typed FK ref).

## Follow-up regression coverage

| Failure class | Coverage |
|---|---|
| `ResourceBudget` vs `ResourceBudgetObservation` conflation | `ResourceBudget` is non-minted with the per-dimension allocation shape (no pressure-pct payload, no `runner_host_id`); `.strict()` rejects injected mint fields; it fulfills the pre-reserved `Evidence.subject_kind: 'resource_budget'` without modifying it. Distinct export names (`resourceBudgetSchema` vs `resourceBudgetObservationSchema`). |
| `resource_kind` ↔ `limit_unit` mismatch | Recorded accept-and-trap: Ring 0 does NOT cross-constrain (a `cpu`+`bytes` combination accepts); the schema test asserts the accept, and the consistency check is a Ring 1 obligation (mirrors the ResolvedTool basis↔context non-cross-constraint). |
| `limit_value` negative / non-integer | Schema test asserts `z.number().int().min(0)` rejects negatives / floats / strings and accepts `0`. |
| `resource_budget_id` raw-identifier shape | Recorded accept-and-trap: `entityIdSchema` accepts a raw shape (a Ring-0 denylist would violate inv. 1); id-opacity is a Ring 1 obligation, backstopped by `forbidden-string-scan`. |
| Sandbox-sourced allocation | Ring 1 producer obligation (charter inv. 8); implementation-test obligation when the budget service lands; no Ring 0 coverage now. |

## Acceptance criteria

- Operator confirms the v1 scope and the non-minted per-dimension allocation +
  `budget_state` shape (Option A) — confirmed 2026-06-08.
- `hcs-architect`, `hcs-ontology-reviewer`, `hcs-policy-reviewer`,
  `hcs-security-reviewer`, and `hcs-eval-reviewer` complete review and all blocking
  findings are absorbed or explicitly rejected by the operator;
  `hcs-ontology-reviewer` is load-bearing for the allocation-vs-Observation
  disambiguation.
- `ResourceBudget` stays non-minted and carries no live-policy/tier field; Ring 0
  does not cross-constrain `resource_kind` ↔ `limit_unit`.
- The ADR does NOT modify `evidenceSubjectKindSchema` or bump
  `Evidence.schema_version`, and does not change `ResourceBudgetObservation`.
- The ADR keeps the schema-change boundary: no Zod source, generated JSON Schema,
  ontology, registry, test, fixture, live-policy, generated-snapshot, system-config,
  or Ring 1 implementation changes in the acceptance slice.
- `just verify` remains green.

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md` v1.4.1 —
  invariant 1 (no live-policy content in Ring 0); invariant 8 (no sandbox promotion
  to host-authoritative).
- ADR 0045: `docs/host-capability-substrate/adr/0045-q-015-backup-readiness-implementation.md`
  (and `packages/schemas/src/entities/resource-budget-observation.ts`) —
  `ResourceBudgetObservation`, the Evidence pressure-reading subtype that FEEDS
  this durable allocation (distinct entity, distinct export names).
- ADR 0055: `docs/host-capability-substrate/adr/0055-session-ring-0-entity.md` —
  `Session`, the `session_id` FK target.
- ADR 0069 / D-067 + ADR 0070 / D-068 + ADR 0071 / D-069: the
  non-cross-constraint precedent (ResolvedTool basis↔context) + the non-minted
  storage-primitive + `source_provenance` precedent (Artifact / Lock).
- `packages/schemas/src/entities/evidence.ts` — the pre-reserved
  `Evidence.subject_kind: 'resource_budget'` this ADR fulfills without change.
- Ontology: `docs/host-capability-substrate/ontology.md` §Entities
  (`ResourceBudget` / `ResourceBudgetObservation`).
- Ontology registry: `docs/host-capability-substrate/ontology-registry.md` —
  `Current schema-version ledger`, `Naming suffix discipline`.
- Schema-change workflow: `.agents/skills/hcs-schema-change/SKILL.md`.

### External

- None directly. Resource allocations are produced/enforced by a future Ring 1
  budget service consuming `ResourceBudgetObservation` pressure readings.
