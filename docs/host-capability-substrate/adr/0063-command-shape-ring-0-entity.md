---
adr_number: 0063
title: CommandShape Ring-0 entity
status: proposed
version: v1
date: 2026-05-30
charter_version: 1.4.1
tags: [command-shape, ring-0, operation-shape, argv, env, non-minted, m1-entity]
---

# ADR 0063: CommandShape Ring-0 entity

## Status

`proposed`

Drafted 2026-05-30 as the third and last entity in the
`PolicyRule → Capability → CommandShape` policy-registry / operation-pipeline
chain (PolicyRule = ADR 0060 / D-057; Capability = ADR 0062 / D-060, both
landed). This ADR is design-only. It does not modify Zod source, generated
JSON Schema, tests, registry docs, other ADRs, live policy, generated
snapshots, system-config, or Ring 1 implementation code. The follow-up schema
PR follows only after ADR acceptance per `.agents/skills/hcs-schema-change`.

v1 is dispatched to four reviewers (`hcs-architect`, `hcs-ontology-reviewer`,
`hcs-policy-reviewer`, `hcs-security-reviewer`), matching the
PolicyRule/Capability entity-review discipline. `hcs-security-reviewer` is
load-bearing here: CommandShape is the first entity to carry an argv vector
and an env profile (charter inv. 2 and inv. 5). `hcs-ontology-reviewer` is
mandatory per the meta-ADR FK-table rule (typed FK to OperationShape).

## Date

2026-05-30

## Charter version

Written against implementation charter v1.4.1 and
`docs/host-capability-substrate/ontology-registry.md` v0.4.22 on `main`
(after the Capability schema PR #13). The entity is constrained by charter
invariants 1 (no policy decision in schema), 2 (typed operation over shell
strings — the defining CommandShape constraint), 5 (no secrets at rest; env
variable names only, never resolved values), 7 (no universal shell execution;
no execute lane before the approval-grant + dashboard-review + broker stack),
10 (live policy canonical in system-config), and 11 (deprecated verbs are not
rendered).

## Context

`CommandShape` is defined in `docs/host-capability-substrate/ontology.md` as
"a concrete argv + env + cwd + timeout plan derived from an Operation". It is
one of the 22 canonical M1 entities, a Q-011 review-grammar bucket-2 entity
(standalone Ring 0, durable identity), and is currently unbuilt — no
`command-shape.ts`, no `command_shape_schema_version`.

CommandShape is the argv-rendered counterpart of `OperationShape` (ADR 0029):
`OperationShape` is the semantic operation proposal (verb + scope + risk);
`CommandShape` is the concrete plan rendered from an accepted OperationShape.
It is the typed input the future (blocked) execution broker (ADR 0012 / 0040 /
0043) would consume.

### Central boundary: a typed plan, not an execution authorization

The defining statement of this ADR: **CommandShape is a typed plan, not an
execution authorization, and carries no execution semantics.** Typing the plan
at Ring 0 does not create, imply, or unblock an execute lane. The execution
broker stays blocked until the approval-grant + dashboard-review stack exists
(charter inv. 7); CommandShape only gives that future stack a typed object to
reason about.

Two charter invariants are the structural crux of the entity:

- **inv. 2** — operations are typed, never raw shell strings as primary
  intent. `argv` is a typed string **vector** (`argv[0]` = executable), and
  the schema admits **no** shell-string field. A `command: string` convenience
  field is an explicit anti-pattern this ADR rejects.
- **inv. 5** — no secrets at rest; environment variable **names** may be
  recorded, **never resolved values**. The `env` profile carries names plus a
  typed value **source reference**, never an inline resolved value.

## Options considered

### Option A: Non-minted typed plan, argv vector + reference-only env (chosen)

`CommandShape` is a non-minted Ring 0 typed plan rendered from an
OperationShape: `argv` (typed vector), `env` (names + value-source references,
no inline values), `cwd` (traversal-free path), `timeout_seconds` (bounded),
and `operation_shape_ref` (the render source / provenance). No
`audit_chain_link_hash`, no producer-mint field, no `evidence_refs`; absent
from the ADR 0057 mint scope. No execution semantics.

**Pros:**

- Matches the ontology definition (argv + env + cwd + timeout) and the
  OperationShape→CommandShape render relationship.
- Structurally embodies inv. 2 (typed argv vector, no shell string) and inv. 5
  (env names + references, no resolved values).
- Non-minted, like its peers OperationShape/PolicyRule/Capability; provenance
  is the typed `operation_shape_ref`, not an audit-chain hash or evidence.
- Reuses `envVariableNameSchema` (names only) and `entityIdSchema` (FKs); no
  new secret-bearing primitive.

**Cons:**

- The Ring 0 schema cannot enforce deprecated-verb render-refusal (inv. 11),
  lease/approval/dashboard gating, env value resolution, or SecretReference FK
  closure — all Ring 1 renderer/broker obligations (consistent with inv. 1 /
  inv. 7).

### Option B: Minted, audit-chain-committed entity

Give CommandShape an `audit_chain_link_hash` + producer + mint path.

**Cons:**

- A render of an already-evidenced OperationShape is not a per-authorization
  mint event; its provenance is the `operation_shape_ref`, not a chain hash.
- ADR 0057's mint scope is the six audit-chain entities (+ AgentClient via ADR
  0059); adding a rendered plan is a category error, splitting it from its
  non-minted peers.

### Option C: argv-or-shell-string / inline env values for convenience

Allow a `command: string` shell form or inline env values.

**Cons:**

- Directly violates inv. 2 (shell string as primary intent) and inv. 5
  (resolved values at rest). This is the precise anti-pattern HCS exists to
  prevent; rejected outright.

## Decision

Choose **Option A**. The follow-up schema PR adds
`packages/schemas/src/entities/command-shape.ts` with a `.strict()` envelope:

- `schema_version`: `commandShapeSchemaVersionSchema = z.literal('0.1.0')`.
- `command_shape_id`: `entityIdSchema`.
- `operation_shape_ref`: `entityIdSchema` — typed FK to the `OperationShape`
  this plan was rendered from (the render source and provenance). A bare
  format-validated id at Ring 0; FK existence + the
  `OperationShape.operation_class` linkage (so the gateway can resolve the
  governing PolicyRule/Capability) are Ring 1 obligations. `operation_class`
  is **not** echoed onto CommandShape — it is derivable via this FK and would
  otherwise duplicate live-policy-adjacent content and add a cross-record
  consistency burden (inv. 1).
- `argv`: `z.array(z.string().min(1)).min(1)` — the typed argv vector;
  `argv[0]` is the executable; every element is a non-empty string. There is
  **no** shell-string field anywhere on the entity (inv. 2).
- `env`: `z.array(commandShapeEnvEntrySchema)` (may be empty), where
  `commandShapeEnvEntrySchema` is a `.strict()` object
  `{ name: envVariableNameSchema, value_source: commandShapeEnvValueSourceSchema }`.
  `commandShapeEnvValueSourceSchema` is a discriminated union on `kind`:
  - `{ kind: 'secret_reference', secret_reference_ref: entityIdSchema }` — a
    forward reference to a `SecretReference` (unbuilt; FK closure deferred to
    Ring 1); the broker resolves the value at execution time;
  - `{ kind: 'execution_context_inherited' }` — the value is inherited from
    the target execution context's environment at execution time; **no value
    is stored**.
  No variant carries an inline resolved value string (inv. 5). A same-record
  refinement requires env `name` values to be unique within the array.
- `cwd`: `commandShapeCwdSchema` — a working-directory path, regex
  `^(?!.*\.\.)\/?[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$` (optional leading `/`
  for absolute; no `..` traversal; no URI scheme / secret shape).
- `timeout_seconds`: `z.number().int().positive().max(86400)` — a bounded
  positive timeout (≤ 24h), a plan parameter, not an execution trigger.

`CommandShape` carries **no** `audit_chain_link_hash`, **no** producer-mint
field, **no** `evidence_refs` (its provenance is `operation_shape_ref`, a
render of an already-evidenced OperationShape), and **no** execution
semantics. `CommandShape.schema_version` is its own literal; no existing entity
changes.

A same-record `superRefine` enforces only the structural invariant that `env`
entry `name`s are unique within the array. The schema enforces field formats,
the argv/env typing, and env-name uniqueness — nothing else.

### What stays in Ring 1 (not this schema)

- **Execution itself** — CommandShape is a plan; the execution broker stays
  blocked until the approval-grant + dashboard-review stack exists (inv. 7).
  Nothing here is executable.
- **Charter inv. 11** — the renderer that produces a CommandShape MUST refuse
  to render a `Capability` whose `capability_state` is `deprecated`/`retired`.
  The schema does not do the render and carries no capability reference.
- **SecretReference FK closure + env value resolution** — the Ring 1 broker
  resolves `secret_reference` env values from the bound SecretReference at
  execution time; the schema only carries the typed reference.
- **`operation_shape_ref` FK existence + operation_class linkage**, and
  **lease / approval / dashboard gating** for destructive plans — Ring 1
  obligations.

## Consequences

### Accepts

- `CommandShape` lands as a non-minted Ring 0 typed plan after the follow-up
  schema PR; M1 source-schema progress advances one entity and closes the
  `PolicyRule → Capability → CommandShape` chain.
- inv. 2 is structurally embodied (typed argv vector, no shell-string field).
- inv. 5 is structurally embodied (env names + value-source references, no
  inline resolved values).
- `CommandShape.schema_version` is `0.1.0`; no other entity changes.

### Rejects

- A minted / audit-chain-committed CommandShape (Option B) and its inclusion
  in ADR 0057 mint scope.
- Any shell-string `command` field or inline env value (Option C; inv. 2 /
  inv. 5).
- Echoing `operation_class` onto CommandShape (derivable via
  `operation_shape_ref`; avoids duplication + a consistency burden).
- Encoding execution semantics, an execute lane, or deprecated-verb
  render-refusal at Ring 0 (inv. 7 / inv. 11; Ring 1).
- Any live-policy, generated-snapshot, system-config, other-ADR, or Ring 1
  implementation change in this ADR slice.

### Future amendments

- An explicit `execution_lane` / surface classification (if the broker needs
  one beyond what `operation_shape_ref → OperationShape.execution_context_id`
  provides) is a future additive amendment; v1 deliberately tracks the
  ontology definition (argv + env + cwd + timeout) and defers the lane.
- A `literal_non_secret` env `value_source` variant (a producer-asserted,
  forbidden-string-scanned non-secret literal) may be added additively if
  operational evidence shows reference-only env is too restrictive; v1 omits it
  to keep the inv. 5 surface maximally tight.
- A direct `execution_context_id` echo, or an `argv` element-shape refinement,
  may be added additively if needed.

## Out of scope

This ADR explicitly does not authorize:

- schema source edits in `packages/schemas/src/entities/command-shape.ts`;
- generated JSON Schema regeneration;
- ontology or ontology-registry edits;
- test or fixture edits;
- edits to other ADRs;
- live policy, `tiers.yaml`, or generated-snapshot changes;
- system-config edits;
- Ring 1 rendering, execution-broker, lease/approval/dashboard, secret
  resolution, gateway, tool-resolution, or host-state behavior;
- any execution semantics or execute lane (inv. 7);
- adding `CommandShape` to the ADR 0057 mint scope.

## Implementation plan after acceptance

The follow-up schema PR, and only that PR, should:

1. Add `packages/schemas/src/entities/command-shape.ts`:
   - `commandShapeSchemaVersionSchema`, `commandShapeEnvValueSourceSchema`
     (discriminated union), `commandShapeEnvEntrySchema`, `commandShapeCwdSchema`,
     and the `.strict()` `commandShapeSchema` with the env-name-uniqueness
     `superRefine`, reusing `envVariableNameSchema` + `entityIdSchema` from
     `../common.ts`;
   - a `.describe()` recording that `argv` is a typed vector that by
     construction cannot be a shell string (inv. 2) and that `env` carries
     names + value-source references only, never resolved values (inv. 5);
   - type exports for each schema.
2. Register in `packages/schemas/src/index.ts` and
   `packages/schemas/scripts/generate-json-schemas.ts`; regenerate
   `packages/schemas/generated/CommandShape.schema.json`.
3. Add `packages/schemas/tests/command-shape.test.ts` proving:
   - a well-formed CommandShape accepts (argv ≥ 1, env with both value_source
     kinds, valid cwd + timeout);
   - empty `argv`, an empty-string argv element, and any top-level
     shell-string field (`command`) reject;
   - an `env` entry with an inline value (e.g. a `value` string field) rejects
     (.strict()), and each `value_source` discriminated variant accepts;
   - duplicate `env` names reject (superRefine);
   - an invalid env `name` (not matching `envVariableNameSchema`) rejects;
   - a `..`-traversal, URI-scheme, or empty `cwd` rejects; an absolute and a
     relative valid cwd accept;
   - a zero / negative / over-max `timeout_seconds` rejects;
   - an injected `audit_chain_link_hash` / producer / `evidence_refs` /
     `operation_class` / `tier` top-level field rejects (.strict(); non-minted,
     no policy/mint leak);
   - an unknown top-level field rejects.
4. Update `docs/host-capability-substrate/ontology.md` (a `CommandShape`
   section + the central-boundary "typed plan, not execution" statement) and
   `docs/host-capability-substrate/ontology-registry.md` (a
   `CommandShape @ '0.1.0'` schema-version-ledger row; an enum mirror for
   `commandShapeEnvValueSourceSchema` `kind`; a References row for ADR 0063).
5. Do not edit live policy, generated snapshots, system-config, other ADRs, or
   Ring 1 code in the schema PR.

## Follow-up regression coverage

| Failure class | Coverage posture |
|---|---|
| Shell-string-as-intent (inv. 2) | Schema tests assert argv is a typed vector and reject any `command` / shell-string field; no regression trap unless an observed failure with cited fixture evidence appears. |
| Inline env value / secret at rest (inv. 5) | Schema tests reject inline env values via `.strict()` + the reference-only `value_source` union; extend the `op://` / gitleaks committed-fixture scan to CommandShape `argv`, `env`, and `cwd`. |
| Duplicate env names | Schema test asserts the uniqueness `superRefine`; no synthetic trap at acceptance. |
| cwd traversal / scheme | Schema test rejects `..` / `://` / absolute-with-traversal cwd. |
| Execution implied at Ring 0 (inv. 7) | Architectural review asserts no execution field/lane is present; the broker stays blocked; mint/broker implementation tests when that stack lands. |
| Deprecated-verb rendered (inv. 11) | Ring 1 renderer implementation test when the renderer lands; no Ring 0 coverage (the schema carries no capability reference). |

## Acceptance criteria

- Operator confirms the ADR 0063 v1 scope and the non-minted typed-plan
  design.
- All four reviewers return ready-for-acceptance, or all blockers are absorbed
  in a later revision: `hcs-architect`, `hcs-ontology-reviewer`,
  `hcs-policy-reviewer`, `hcs-security-reviewer`.
- The accepted ADR keeps CommandShape non-minted, with a typed `argv` vector
  (no shell-string field, inv. 2) and a reference-only `env` profile (names +
  value-source references, no resolved values, inv. 5).
- The accepted ADR carries no execution semantics or execute lane (inv. 7) and
  defers deprecated-verb render-refusal (inv. 11), execution, and secret
  resolution to Ring 1.
- The accepted ADR preserves the schema-change boundary: no Zod source,
  generated JSON Schema, ontology, registry, test, fixture, live-policy,
  generated-snapshot, system-config, or Ring 1 implementation changes in the
  ADR acceptance slice.
- `just verify` remains green.

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md` v1.4.1
  — invariants 1, 2, 5, 7, 10, 11.
- ADR 0029: `OperationShape` — the semantic operation proposal CommandShape is
  rendered from (`operation_shape_ref`); the upstream of the
  OperationShape→CommandShape pipeline.
- ADR 0060 / D-057 and ADR 0062 / D-060: `PolicyRule` and `Capability` — the
  non-minted Ring-0 envelope peers.
- ADR 0057 / D-052: Ring 1 mint/audit service scope (CommandShape is outside
  it).
- ADR 0012 / 0040 / 0043: the execution / secret broker — blocked; the
  downstream consumer CommandShape must not unblock or imply (inv. 7).
- Ontology: `docs/host-capability-substrate/ontology.md` (`CommandShape`
  one-line definition) and `ontology-registry.md` (Q-011 bucket-2
  classification, schema-version ledger).
- Source schemas at draft time:
  `packages/schemas/src/entities/operation-shape.ts`;
  `packages/schemas/src/common.ts` (`envVariableNameSchema`, `entityIdSchema`);
  `packages/schemas/src/entities/capability.ts` (non-minted peer template).
- Schema-change workflow: `.agents/skills/hcs-schema-change/SKILL.md`.
- Decision ledger: `DECISIONS.md` — D-057, D-060.

### External

- None. This is an internal ontology/schema-design ADR.
