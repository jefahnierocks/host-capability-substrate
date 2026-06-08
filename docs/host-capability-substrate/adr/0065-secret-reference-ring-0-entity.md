---
adr_number: 0065
title: SecretReference Ring-0 entity
status: proposed
version: v1
date: 2026-06-07
charter_version: 1.4.1
tags: [secret-reference, ring-0, non-minted, credential-plane, command-shape-followup, inv-5, inv-16]
---

# ADR 0065: SecretReference Ring-0 entity

## Status

`proposed`

Drafted 2026-06-07 as the next lower-coupling M1 Ring-0 entity, closing
`CommandShape`'s forward `secret_reference_ref` FK (ADR 0063). This ADR is
design-only. It does not land Zod source, generated JSON Schema, tests,
ontology/registry edits, live policy, generated snapshots, system-config,
or Ring 1 implementation code. The schema PR follows only after ADR
acceptance per `.agents/skills/hcs-schema-change`.

Reviewer dispatch is deferred until the operator confirms this v1 scope.
`hcs-security-reviewer` is load-bearing: this entity is the typed handle
for secret material, so the never-the-value boundary (charter inv. 5) and
the typed-slot distinction (charter inv. 16) are the central review axes.

## Date

2026-06-07

## Charter version

Written against implementation charter v1.4.1 and
`docs/host-capability-substrate/ontology-registry.md` v0.4.25.
`SecretReference` is constrained primarily by charter invariant 5 (secrets
never live in Ring 0/1 at rest — references yes, values no) and invariant
16 / line 98 / forbidden-pattern line 136 (`SecretReference`,
`ProviderObjectReference`, `PublicClientId`, `PolicySelectorValue`, and raw
secret material are separate typed slots; collapsing them fails CI). It
also touches invariant 1 (no live-policy content in Ring 0) and the
charter's secret-handling forbidden patterns (no committed resolved
`op://` value; no secret material in any persisted field).

## Context

`CommandShape` (ADR 0063 / D-061) renders an environment profile whose
`env[].value_source` discriminated union carries a `secret_reference`
variant holding an opaque `secret_reference_ref`. ADR 0063 made that a
**forward** reference (the `_ref` suffix, not the resolvable `_id` suffix)
to "the unbuilt `SecretReference` entity," and deferred FK closure to Ring
1. The argv argument-class union (charter line 98) and the credential-plane
ADRs name `SecretReference` as the canonical secret-pointer language: ADR
0043 §Scope states "Use `SecretReference` or `credential_source_id`
language where a credential pointer is needed; never resolved secret
material." `SecretReference` is one of the 22 canonical M1 entities
(`ontology.md` §Entities: "SecretReference — op:// URI, never the value").

The credential-plane already carries a related but distinct entity:
`CredentialSource` (ADR 0018, schema v0.2.0) models a **durable credential
source** — its `source_type` (including `brokered_secret_reference`),
`storage_plane`, `durability`, `scope`, `rotation`, `health`, and an
optional opaque `secret_ref`. `CredentialSource` answers "what durable
source backs this credential, and is it healthy / rotating." It is not the
per-use pointer a single `CommandShape.env` entry or argv element needs.

This ADR introduces `SecretReference` as the typed, **non-minted** Ring-0
entity for a single secret reference — the thing the Ring 1 broker
resolves to a value at execution time, and the FK target that closes
`CommandShape.secret_reference_ref`. It is a structural peer of
`PolicyRule` (ADR 0060), `Capability` (ADR 0062), and `CommandShape` (ADR
0063): no `audit_chain_link_hash`, no producer-mint field, no
`evidence_refs`; absent from the ADR 0057 mint scope.

## Options considered

### Option A: Self-contained reference entity + optional CredentialSource link (chosen)

`SecretReference` carries its own typed reference (`reference_kind` +
`reference_locator`) and an OPTIONAL `credential_source_ref` FK to
`CredentialSource`. A reference can stand alone (an `op://` pointer with no
durable-source record) or bind to a `CredentialSource` when one exists.

**Pros:**

- Matches the ontology framing ("op:// URI, never the value") and the
  argv/env value-source model directly: the entity IS the typed reference.
- A `CommandShape` env entry can name a `SecretReference` whether or not a
  durable `CredentialSource` record has been built, keeping the
  CommandShape → broker resolution path simple.
- Binds to the durable credential-plane when useful (`credential_source_ref`)
  without forcing every per-use pointer to first mint a `CredentialSource`.
- Stays a clean non-minted structural peer of `PolicyRule` / `Capability` /
  `CommandShape`.

**Cons:**

- `reference_locator` overlaps conceptually with `CredentialSource.secret_ref`.
  Mitigated by role separation: `SecretReference` is the per-use typed
  pointer; `CredentialSource` is the durable source + lifecycle. The
  optional `credential_source_ref` makes the relationship explicit rather
  than duplicative.

### Option B: Thin pointer that always FKs a CredentialSource

`SecretReference` is a required `credential_source_ref` plus a
`field_selector`, reusing `CredentialSource.secret_ref` for the `op://`
detail.

**Pros:**

- No standalone reference locator; minimal duplication with the
  credential-plane.

**Cons:**

- Forces every secret reference to first have a `CredentialSource` record,
  which over-couples a single argv/env pointer to the durable
  source/lifecycle entity (rotation, health, storage plane) it does not
  need.
- Contradicts the canonical "op:// URI, never the value" framing, where the
  reference itself is the primary content.

### Option C: No new entity — point CommandShape at CredentialSource

Retarget `CommandShape.secret_reference_ref` at `CredentialSource` and add
no `SecretReference` entity.

**Pros:**

- One fewer entity.

**Cons:**

- Conflates the per-use reference with the durable source; a single env
  entry would carry rotation/health/storage-plane semantics it does not
  need.
- Contradicts the M1 entity list and ADR 0043, which name `SecretReference`
  as a distinct secret-pointer entity, and would require amending ADR 0063.

## Decision

Choose **Option A**. `SecretReference` is a non-minted Ring-0 entity: a
self-contained typed secret reference with an optional `CredentialSource`
binding. It closes `CommandShape.secret_reference_ref` (the FK target now
exists; FK existence verification stays a Ring 1 obligation, and
`CommandShape`'s `secret_reference_ref` schema shape is unchanged —
`entityIdSchema` before and after, mirroring the ADR 0055 Session typed-FK
closure precedent).

### Entity shape (design sketch; exact Zod lands in the schema PR)

```text
SecretReference (non-minted Ring 0; structural peer of Capability/CommandShape)
  schema_version          z.literal('0.1.0')
  secret_reference_id     entityIdSchema
  reference_kind          enum: op_uri | hcs_uri | keychain_item |
                                env_var_name | broker_handle
  reference_locator       string — an opaque REFERENCE, validated per
                          reference_kind to a reference shape, NEVER a
                          secret value (charter inv. 5)
  credential_source_ref   entityIdSchema.nullable().optional()
                          — optional FK to a CredentialSource (ADR 0018);
                            the `_ref` cross-reference suffix
  source_provenance       { authority, observed_at, ... }
```

`.strict()` envelope. NO `audit_chain_link_hash`, NO producer-mint field,
NO `evidence_refs`; absent from the ADR 0057 mint scope. There is **no
value field anywhere on the entity**.

### `reference_kind` and `reference_locator`

`reference_kind` is a closed `lower_snake_case` enum naming the reference
form; `reference_locator` is the opaque locator string, validated against
its `reference_kind` by an envelope `superRefine`:

- `op_uri` — a 1Password reference (`op://<vault>/<item>[/<field>]`). Ring 0
  validates the `op://` scheme and path structure and forbids a resolved
  value. The committed-string scan exempts `docs/adr/`; the schema PR's
  fixtures must use reference forms (`op://vault/item/field`), never
  resolved values (charter forbidden-pattern: no committed resolved `op://`).
- `hcs_uri` — an HCS broker reference (`hcs://<...>`).
- `keychain_item` — a macOS Keychain item reference (service + account
  form), never the item's secret material.
- `env_var_name` — an environment variable NAME (reuses
  `envVariableNameSchema`); the broker reads the value from the target
  execution context at execution time. A name is not a secret.
- `broker_handle` — an opaque broker-issued handle (`hcs-broker:<opaque>`),
  resolved by the Ring 1 broker.

Ring 0 enforces only the **structural** reference shape per kind (scheme,
path grammar, name grammar) and the absence of an inline value. The deep
"this locator is genuinely a reference and not a secret, and resolves to an
authorized value" check, plus the actual value resolution, are Ring 1
broker obligations (charter inv. 5; the broker stays blocked until the
approval/lease/dashboard/audit stack exists, inv. 7).

### Typed-slot distinction (charter inv. 16 / line 98)

`SecretReference` is the **secret-reference** slot and is deliberately
DISJOINT from the other four typed slots that the `OperationShape` /
`CommandShape` argument schemas must keep separate:

- NOT a `ProviderObjectReference` (a provider-side object id / ARN-like
  handle).
- NOT a `PublicClientId` (a public OAuth client identifier — not secret).
- NOT a `PolicySelectorValue` (a policy selector / tier key).
- NOT raw secret material (which never appears in Ring 0 at all).

Conflating any of these into a single untyped string fails CI (charter line
98 / forbidden-pattern line 136). `SecretReference` is the typed home for
"a pointer to a secret," nothing else.

### `source_provenance`

`source_provenance` binds a `SecretReference` declaration to where it was
declared, mirroring the `PolicyRule` / `Capability` non-minted provenance
pattern:

- `authority` — a literal marker (proposed `secret_reference_declaration`),
  deliberately DISJOINT from `evidenceAuthoritySchema` and conferring no
  authority by itself.
- `observed_at` — declaration observation timestamp.
- an optional declaration-source reference (path or `_ref`) MAY be added in
  the schema PR if reviewers find it load-bearing; it must never carry
  secret material.

### What stays in Ring 1 (not this schema)

- Resolving `reference_locator` to a value at execution time (the broker;
  inv. 5 keeps the value out of Ring 0 entirely).
- Verifying `credential_source_ref` FK existence and the `CommandShape`
  `secret_reference_ref` → `SecretReference` FK existence.
- Deep "reference, not secret" verification and authorization of the
  resolved value (provider-side; charter inv. 16 evidence-first).
- Never persisting the resolved value anywhere (inv. 5; forbidden-pattern:
  no secret in a persisted field; no env dumps).

## Consequences

### Accepts

- `CommandShape.secret_reference_ref` gains a typed FK target; the
  CommandShape schema shape is unchanged.
- HCS gains a typed, non-minted home for a single secret reference that the
  Ring 1 broker resolves at execution time, distinct from the durable
  `CredentialSource`.
- The `SecretReference` typed slot is structurally separated from the other
  four argument-class slots (charter inv. 16).
- The never-the-value boundary (inv. 5) is enforced structurally: no value
  field exists, and `reference_locator` is validated to a reference shape.

### Rejects

- A value field, inline secret, or resolved `op://` value anywhere on the
  entity.
- Requiring a `CredentialSource` for every reference (Option B).
- Pointing `CommandShape` at `CredentialSource` instead (Option C).
- Minting / audit-chain commitment for `SecretReference` (non-minted, like
  its PolicyRule / Capability / CommandShape peers).
- Any live-policy, generated-snapshot, system-config, ADR 0063, ADR 0018,
  or Ring 1 implementation change in this ADR slice.

### Future amendments

- A future credential-plane or broker ADR may add `reference_kind` values
  (e.g. a cloud secret-manager URI) via the registered §Procedure rule.
- A future ADR may add the resolution/authorization receipt path
  (`CredentialRuntimeInjectionReceipt` per ADR 0043) that consumes a
  `SecretReference`; it requires mandatory kernel-resolved attribution and
  is out of scope here.

## Out of scope

This ADR explicitly does not authorize:

- Zod source, generated JSON Schema, tests, or ontology/registry edits
  (the schema PR per `.agents/skills/hcs-schema-change` follows).
- Edits to ADR 0063 (CommandShape), ADR 0018 (CredentialSource), ADR 0043,
  or any other ADR.
- `CommandShape` schema shape changes (`secret_reference_ref` stays
  `entityIdSchema`).
- Live policy, `tiers.yaml`, generated-snapshot, or system-config edits.
- Ring 1 broker / resolution / injection code, or any value resolution.
- Execution broker, gateway, capability registration, tool resolution,
  host-state, or dashboard behavior.
- Provider mutations or hook behavior changes.

## Implementation plan after acceptance

The follow-up schema PR, and only that PR, should:

1. Add `packages/schemas/src/entities/secret-reference.ts`:
   `secretReferenceSchemaVersionSchema = z.literal('0.1.0')`;
   `secretReferenceReferenceKindSchema` enum; the `reference_locator`
   format primitives; `secretReferenceSourceProvenanceSchema`; the
   `.strict()` `secretReferenceSchema` with the `reference_locator`-vs-
   `reference_kind` `superRefine` and the optional nullable
   `credential_source_ref`.
2. Register the schema in `packages/schemas/scripts/generate-json-schemas.ts`
   and `packages/schemas/src/index.ts`; regenerate
   `SecretReference.schema.json`.
3. Add `packages/schemas/tests/secret-reference.test.ts`: each
   `reference_kind` accepts its valid locator and rejects mismatched /
   value-shaped / inline-secret / resolved-`op://` locators; optional
   `credential_source_ref` accepts present/absent/null; `.strict()` rejects
   injected mint/value fields; no value field is accepted.
4. Update `docs/host-capability-substrate/ontology.md` (the entity section
   + version + change log) and
   `docs/host-capability-substrate/ontology-registry.md` (a
   §Current-schema-version-ledger row at `'0.1.0'`, a §Schema-enum-mirrors
   `SecretReference.reference_kind` subsection, a §References row, version +
   change log). Optionally update `command-shape.ts`
   `secret_reference_ref.describe()` to note `SecretReference` now exists as
   the typed FK target (NO `CommandShape` shape change; `schema_version`
   stays `'0.1.0'`), mirroring the ADR 0055 Session FK-closure precedent.
5. Extend `scripts/ci/forbidden-string-scan.sh` coverage to
   `SecretReference.reference_locator` (no resolved `op://` / secret shapes
   in committed fixtures), reusing the CommandShape argv/env/cwd backstop
   pattern.
6. Do not edit live policy, generated snapshots, system-config, Ring 1
   service code, ADR 0063, or ADR 0018 in the schema PR unless separately
   authorized.

## Follow-up regression coverage

This ADR seeds no synthetic regression traps. It records schema-test and
implementation-test obligations.

| Failure class | Coverage posture |
|---|---|
| New non-minted entity introduction | Schema tests in the follow-up schema PR; no regression trap unless an observed agent/implementation failure with cited fixture evidence appears. |
| Inline secret / resolved `op://` value in `reference_locator` | Schema tests assert reject for value-shaped locators; the `forbidden-string-scan` committed-fixture backstop guards committed test data; no synthetic trap at ADR acceptance. |
| `reference_kind` / `reference_locator` mismatch | Schema tests assert the `superRefine` rejects a locator whose shape does not match its kind. |
| Typed-slot conflation (SecretReference vs the other four slots) | Charter line 98 / line 136 are CI-guarded at the OperationShape/CommandShape argument surface; this entity is the typed home, not a conflation point. The argv argument-class distinction stays the deferred Ring 1 gateway obligation seeded by ADR 0063. |
| Broker value resolution / `credential_source_ref` FK existence | Ring 1 implementation-test obligation when the broker/credential-plane resolution service lands; no Ring 0 coverage now. |

## Acceptance criteria

- Operator confirms the v1 scope and the self-contained-reference shape
  (Option A).
- `hcs-architect`, `hcs-ontology-reviewer`, `hcs-policy-reviewer`,
  `hcs-security-reviewer`, and `hcs-eval-reviewer` complete review and all
  blocking findings are absorbed or explicitly rejected by the operator;
  `hcs-security-reviewer` is load-bearing for the never-the-value boundary.
- `SecretReference` stays non-minted (no `audit_chain_link_hash` / producer
  / `evidence_refs`) and has no value field.
- The entity closes `CommandShape.secret_reference_ref` with no
  `CommandShape` schema shape change.
- `SecretReference` is kept distinct from `ProviderObjectReference`,
  `PublicClientId`, `PolicySelectorValue`, and raw secret material (charter
  inv. 16).
- Value resolution, FK existence, and authorization stay Ring 1
  obligations.
- The ADR keeps the schema-change boundary: no Zod source, generated JSON
  Schema, ontology, registry, test, fixture, live-policy, generated-
  snapshot, system-config, or Ring 1 implementation changes in the
  acceptance slice.
- `just verify` remains green.

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md`
  v1.4.1 -- invariants 1, 5, 16; line 98 typed-slot rule; forbidden-pattern
  lines 93/129/136 (no committed resolved `op://`; no secret in a persisted
  field; no typed-slot conflation).
- ADR 0063 / D-061:
  `docs/host-capability-substrate/adr/0063-command-shape-ring-0-entity.md`
  -- the `secret_reference_ref` forward FK this entity closes and the argv
  argument-class slots.
- ADR 0062 / D-060:
  `docs/host-capability-substrate/adr/0062-capability-ring-0-entity.md`
  -- non-minted Ring-0 entity + `source_provenance` precedent.
- ADR 0060 / D-057:
  `docs/host-capability-substrate/adr/0060-policy-rule-ring-0-entity.md`
  -- first non-minted Ring-0 entity precedent.
- ADR 0018:
  `docs/host-capability-substrate/adr/0018-durable-credential-preference.md`
  -- `CredentialSource`, the durable credential source/lifecycle entity
  `credential_source_ref` optionally binds to.
- ADR 0043 / ADR 0040 / ADR 0012 -- credential-plane integration,
  implementation, and broker posture naming `SecretReference` as the
  canonical secret-pointer language.
- ADR 0055 / D-044:
  `docs/host-capability-substrate/adr/0055-session-ring-0-entity.md`
  -- typed-FK closure precedent (consuming entity unchanged at
  `entityIdSchema`).
- Ontology: `docs/host-capability-substrate/ontology.md` §Entities
  ("SecretReference — op:// URI, never the value").
- Ontology registry:
  `docs/host-capability-substrate/ontology-registry.md` --
  `Current schema-version ledger`, `Naming suffix discipline` (`_ref`
  forward-reference vs `_id` resolvable suffix), and the `CommandShape.env`
  value-source enum mirror.
- Schema-change workflow: `.agents/skills/hcs-schema-change/SKILL.md`.

### External

- None directly. `op://` is the 1Password secret-reference URI scheme,
  referenced as a reference form only, never resolved here.
