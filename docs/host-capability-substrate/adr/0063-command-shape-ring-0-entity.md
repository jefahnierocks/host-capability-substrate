---
adr_number: 0063
title: CommandShape Ring-0 entity
status: accepted
version: v2
date: 2026-05-30
charter_version: 1.4.1
tags: [command-shape, ring-0, operation-shape, argv, env, non-minted, m1-entity]
---

# ADR 0063: CommandShape Ring-0 entity

## Status

`accepted`

Drafted 2026-05-30 as the third and last entity in the
`PolicyRule → Capability → CommandShape` policy-registry / operation-pipeline
chain (PolicyRule = ADR 0060 / D-057; Capability = ADR 0062 / D-060, both
landed). This ADR is design-only. It does not modify Zod source, generated
JSON Schema, tests, registry docs, other ADRs, live policy, generated
snapshots, system-config, or Ring 1 implementation code. The follow-up schema
PR follows only after ADR acceptance per `.agents/skills/hcs-schema-change`.

v1 was dispatched to four reviewers (`hcs-architect`, `hcs-ontology-reviewer`,
`hcs-policy-reviewer`, `hcs-security-reviewer`), matching the
PolicyRule/Capability entity-review discipline. `hcs-security-reviewer` is
load-bearing here: CommandShape is the first entity to carry an argv vector
and an env profile (charter inv. 2 and inv. 5). `hcs-ontology-reviewer` is
mandatory per the meta-ADR FK-table rule (typed FK to OperationShape). Round 1
returned **zero blockers**: `hcs-architect` and `hcs-policy-reviewer` returned
`yes`; `hcs-ontology-reviewer` and `hcs-security-reviewer` returned
`yes-with-mechanical-tweaks`. (Each reviewer's prematurely-emitted
StructuredOutput `no` during an empty-read window was explicitly superseded by
its authoritative verdict; disregard those.) The reviewers confirmed the
central boundary, the non-minted Option A, the `operation_shape_ref`
provenance, and — explicitly — that deferring an `execution_lane` field is the
correct v1 call (the lane is reachable transitively via `operation_shape_ref →
OperationShape.execution_context_id`).

v2 folds every mechanical tweak, so no confirming round 2 was required
(mechanical-tweaks-at-acceptance, ADR 0058/0060/0061/0062 precedent): it cites
charter line 98 (the gateway argument-class distinction) + the
forbidden-pattern clause as controlling text and names **argv-secret-inlining
as an explicit, seeded-trap Ring-1 obligation** (see §Typed argument classes);
adds **cwd absolute-root confinement** to the Ring-1 obligations; reconciles
the `execution_lane` ontology one-liner; records the `secret_reference_ref`
forward-reference naming choice and its non-secret describe() obligation;
records the `timeout_seconds` ceiling rationale; and extends the schema-PR test
list + regression-coverage table. v2 is presented for the operator acceptance
gate.

ADR 0063 is accepted 2026-05-30 as D-061. Round 1 returned zero blockers and v2
folded every mechanical tweak, so no confirming round 2 was required. This
closes the `PolicyRule → Capability → CommandShape` policy-registry chain at
the ADR layer. The follow-up schema PR (`command-shape.ts` + generated schema +
tests + ontology/registry) lands per `.agents/skills/hcs-schema-change`; the
Ring-1 obligations — the typed argument-class distinction (charter line 98),
`cwd` absolute-root confinement, deprecated-verb render refusal (inv. 11),
SecretReference FK closure + env value resolution, `operation_shape_ref` FK
closure, and lease/approval/dashboard gating — are carried forward to the
relevant Ring-1 ADRs (gateway / renderer / broker).

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

Charter boundary-enforcement line 98 governs argument typing directly:
*"`OperationShape` and `CommandShape` argument schemas distinguish
`ProviderObjectReference`, `PublicClientId`, `PolicySelectorValue`,
`SecretReference`, and raw secret material as separate typed slots. Collapsing
two or more of those into a single untyped string field fails CI."* — and the
forbidden-pattern clause forbids conflating those classes or raw secret
material in `CommandShape` rendered output. That argument-class distinction is a
**gateway (Ring 1)** obligation (the gateway resolves every operation through
tool resolution); resolving whether a given `argv` string is a
`SecretReference` versus raw secret material requires host state the Ring 0
schema does not have. See §Typed argument classes for how v1 handles this
honestly: a flat typed `argv` vector at Ring 0, with the argument-class
refinement named as a seeded-trap Ring-1 obligation rather than left implied.

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
  positive timeout. The `86400` (24h) bound is a hard **ceiling**, not a
  default and not an authorization; the `.describe()` records this and notes
  the Ring 1 broker is expected to apply its own tighter per-operation budget
  (cross-referencing the future `ResourceBudget` entity). It is a plan
  parameter, never an execution trigger.

The `env` value-source `secret_reference_ref` keeps the `_ref` suffix
deliberately: it is a forward reference to the unbuilt `SecretReference` entity
(FK closure deferred to Ring 1), following the `latest_containment_evidence_ref`
forward-reference precedent rather than the `_id` suffix used for resolvable
in-tree FKs. Its `.describe()` must carry the standard secret-adjacent note
("an opaque reference id; not a secret value, not an `op://` URI") that every
secret-adjacent field on the peer schemas carries.

`CommandShape` carries **no** `audit_chain_link_hash`, **no** producer-mint
field, **no** `evidence_refs` (its provenance is `operation_shape_ref`, a
render of an already-evidenced OperationShape), and **no** execution
semantics. `CommandShape.schema_version` is its own literal; no existing entity
changes.

A same-record `superRefine` enforces only the structural invariant that `env`
entry `name`s are unique within the array. The schema enforces field formats,
the argv/env typing, and env-name uniqueness — nothing else.

### Typed argument classes (the argv-secret-inlining boundary)

Charter line 98 requires CommandShape argument schemas to distinguish
`ProviderObjectReference`, `PublicClientId`, `PolicySelectorValue`,
`SecretReference`, and raw secret material as separate typed slots. A flat
`z.array(z.string().min(1))` `argv` **cannot make that distinction**: a secret
can sit inline in an `argv` element exactly as it could in a shell string —
superficially the same inv. 2 / inv. 5 hole the entity exists to close. This
ADR is explicit rather than implicit about how it handles that:

- The argument-class distinction is a **gateway (Ring 1) obligation**, not a
  Ring 0 schema check. Resolving whether an `argv` string is a `SecretReference`
  (or a `ProviderObjectReference`, `PublicClientId`, `PolicySelectorValue`) or
  raw secret material requires tool-resolution and host state the schema does
  not have (charter line 98: the schemas distinguish the classes, but the
  gateway resolves and records; inv. 1: no cross-record/host-state resolution
  in the schema). A typed argv-element-class discriminated union is therefore a
  **named, deferred Ring 1 obligation** (and a candidate future additive
  amendment if a Ring 0 typed argument model proves tractable), not a v1 schema
  field.
- Because Ring 0 cannot reject an inlined secret in `argv`, the gap is
  **recorded and trapped**, not left silent: the schema PR seeds a regression
  fixture asserting the current behavior (an `argv` element shaped like
  `op://vault/item/field` or a `Bearer sk-…` / `ghp_…` / `AKIA…` token is
  *accepted* by the Ring 0 schema — the documented Ring-1 gateway gap), paired
  with the `op://` / gitleaks committed-fixture scan
  (`scripts/ci/forbidden-string-scan.sh`) extension so no such value lands in a
  committed fixture undetected. The trap makes the deferral a recorded decision
  rather than an oversight.

### What stays in Ring 1 (not this schema)

- **Execution itself** — CommandShape is a plan; the execution broker stays
  blocked until the approval-grant + dashboard-review stack exists (inv. 7).
  Nothing here is executable.
- **Charter inv. 11** — the renderer that produces a CommandShape MUST refuse
  to render a `Capability` whose `capability_state` is `deprecated`/`retired`.
  The schema does not do the render and carries no capability reference.
- **Typed argument-class distinction** (charter line 98) — the gateway
  distinguishes `ProviderObjectReference` / `PublicClientId` /
  `PolicySelectorValue` / `SecretReference` / raw secret material in `argv`, and
  rejects raw secret material; Ring 0 carries a flat typed vector and traps the
  gap (see §Typed argument classes).
- **`cwd` absolute-root confinement** — the `cwd` regex blocks `..` traversal
  and URI schemes, but the optional leading `/` permits any absolute host path
  (`/etc`, `/Users/…/.ssh`); Ring 0 cannot know the allowed roots, so confining
  `cwd` to permitted roots is a Ring 1 broker obligation.
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
   - a `..`-traversal, URI-scheme, or empty `cwd` rejects; both a normal
     absolute (`/srv/work`) and a normal relative (`build/out`) cwd accept;
   - a zero / negative / over-max `timeout_seconds` rejects;
   - an injected `audit_chain_link_hash` / producer / `evidence_refs` /
     `operation_class` / `tier` / `approval_required` / `grant_scope` /
     `source_provenance` top-level field rejects (.strict(); non-minted, no
     policy/mint/snapshot leak);
   - an `env` `value_source` carrying an inline resolved value under a renamed
     key (`value`, `resolved`, `literal`) rejects (.strict() on each
     discriminated variant; guards the inv. 5 "secret-at-rest via a renamed
     field" class);
   - an `argv[0]` that is a deprecated verb (e.g. `launchctl` with `unload`)
     accepts — the schema is verb-agnostic; inv. 11 render-refusal is the Ring-1
     renderer's job, not a Ring 0 denylist;
   - **the recorded argv-secret-inlining gap**: an `argv` element equal to
     `op://vault/item/field` and an element shaped like a `Bearer sk-…` /
     `ghp_…` / `AKIA…` token are *accepted* by the Ring 0 schema — asserting the
     current behavior so the deferred Ring-1 argument-class gap (charter line
     98) is a recorded, trapped decision, not a silent hole; paired with the
     committed-fixture scan extension;
   - an `argv` element that is whitespace-only (`' '`, `'\n'`) — assert the
     current behavior (accepted by `z.string().min(1)`) so it is a recorded
     decision (a tighter `\S`-requiring refinement is a deferred option);
   - an unknown top-level field rejects.
4. Update `docs/host-capability-substrate/ontology.md` (a `CommandShape`
   section + the central-boundary "typed plan, not execution" statement) and
   reconcile the entity-list one-liner: today it reads "argv vector + env
   profile + execution lane (rendered from Operation)", but v1 has no
   `execution_lane` field — the one-liner must either drop "execution lane" or
   note that the lane is reachable via `operation_shape_ref →
   OperationShape.execution_context_id` and a direct echo is a deferred
   additive amendment. Update
   `docs/host-capability-substrate/ontology-registry.md`: a
   `CommandShape @ '0.1.0'` schema-version-ledger row; an enum mirror for the
   `commandShapeEnvValueSourceSchema` `kind` discriminator in the
   `## Schema enum mirrors` section listing the literals `secret_reference` and
   `execution_context_inherited` verbatim (no Sub-rule 9 grandfather — both are
   lower_snake_case); a References row for ADR 0063; and a note that
   `secret_reference_ref` is a forward reference to the unbuilt SecretReference
   entity (so it is not read as a dangling typo).
5. Do not edit live policy, generated snapshots, system-config, other ADRs, or
   Ring 1 code in the schema PR.

## Follow-up regression coverage

| Failure class | Coverage posture |
|---|---|
| Shell-string-as-intent (inv. 2) | Schema tests assert argv is a typed vector and reject any `command` / shell-string field; no regression trap unless an observed failure with cited fixture evidence appears. |
| Inline env value / secret at rest (inv. 5) | Schema tests reject inline env values via `.strict()` + the reference-only `value_source` union, including a renamed-key (`value`/`resolved`/`literal`) variant; extend the `op://` / gitleaks committed-fixture scan (`scripts/ci/forbidden-string-scan.sh`) to CommandShape `argv`, `env`, and `cwd`. |
| Argv-secret-inlining (charter line 98; argument-class gap) | **Recorded, trapped, deferred.** The argument-class distinction (`ProviderObjectReference` / `PublicClientId` / `PolicySelectorValue` / `SecretReference` / raw secret) is a Ring 1 gateway obligation. A schema-PR fixture asserts the Ring 0 schema *accepts* an `op://`- / token-shaped `argv` element (the documented gap), paired with the committed-fixture scan so no such value lands committed; a Ring-1 gateway implementation test rejects it at resolution time when that service lands. |
| Duplicate env names | Schema test asserts the uniqueness `superRefine`; no synthetic trap at acceptance. |
| cwd traversal / scheme | Schema test rejects `..` / `://` / absolute-with-traversal cwd. |
| Execution implied at Ring 0 (inv. 7) | Architectural review asserts no execution field/lane is present; the broker stays blocked; mint/broker implementation tests when that stack lands. |
| Deprecated-verb rendered (inv. 11) | Ring 1 renderer implementation test when the renderer lands; no Ring 0 coverage (the schema carries no capability reference). |

## Acceptance criteria

- Operator confirms the ADR 0063 v2 scope and the non-minted typed-plan
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
  — invariants 1, 2, 5, 7, 10, 11; boundary-enforcement line 98 (the
  `OperationShape`/`CommandShape` argument-class distinction:
  `ProviderObjectReference` / `PublicClientId` / `PolicySelectorValue` /
  `SecretReference` / raw secret material as separate typed slots) and the
  forbidden-pattern clause (no conflating those classes in `CommandShape`
  rendered output).
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
