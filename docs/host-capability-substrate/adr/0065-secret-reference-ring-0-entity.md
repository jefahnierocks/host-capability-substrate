---
adr_number: 0065
title: SecretReference Ring-0 entity
status: proposed
version: v2
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

ADR 0065 v1 was dispatched to all five reviewers for round 1 on 2026-06-07
(`hcs-security-reviewer` load-bearing: this entity is the typed handle for
secret material, so the never-the-value boundary (inv. 5) and the typed-slot
distinction (inv. 16) are the central axes). All five returned
`yes_with_mechanical_tweaks` with **zero blockers**: the never-the-value
boundary holds structurally (no value field; reference-shaped locators), the
typed-slot disjointness is preserved, the entity is a clean non-minted peer,
and the `CommandShape` FK closes with no shape change. v2 absorbs every
mechanical tweak. The load-bearing one (security): the never-the-value claim
was honest only for the structured kinds, so v2 records an explicit
accept-and-trap gap — the permissive kinds (`env_var_name`, `broker_handle`,
`hcs_uri` tails) ACCEPT a token-shaped locator at Ring 0, backstopped by
`forbidden-string-scan` + the Ring 1 deep check (mirroring ADR 0063's
argv-secret-inlining). v2 also: justifies the `credential_source_ref` `_ref`
suffix by the optional/forward cross-record-FK precedent
(architect/ontology/policy); pins `secretReferenceSourceProvenanceSchema` as
a concrete `.strict()` floor lighter than its registry-bound peers
(architect/ontology/security); distinguishes `env_var_name` from
CommandShape's `execution_context_inherited` (architect/ontology/security);
names the `reference_locator`-vs-bound-`CredentialSource` resolution
precedence as a Ring 1 obligation (architect/policy/security); adds
policy-selector + injected-field reject tests and the runtime-concatenation
fixture discipline (policy/eval); reconciles the ontology one-liner for five
kinds and the generated-schema lockstep (ontology); tightens the
typed-slot-conflation coverage wording to credit the CI backstop without
overstating CI enforcement (eval); and cites the charter by clause rather
than fragile line numbers (policy/security). No blocker required a re-review;
v2 is presented for acceptance under the mechanical-tweaks-at-acceptance
discipline (ADR 0058 precedent).

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
                            `_ref` per the optional/forward cross-record-FK
                            precedent (grantor_principal_ref, policy_rule_ref,
                            operation_shape_ref), intentionally distinct from
                            the kernel-set BoundaryObservation.credential_source_id
  source_provenance       secretReferenceSourceProvenanceSchema (pinned below)
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
path grammar, name grammar) and the absence of an inline value — and that
guarantee is honest only for the **structured** kinds. For `op_uri` and
`keychain_item`, a mis-shaped or raw-value locator is structurally rejected.
For the **permissive** kinds — `env_var_name` (the `envVariableNameSchema`
name grammar) and the opaque tails of `broker_handle` and `hcs_uri` — a
token-shaped secret VALUE can satisfy the grammar, so Ring 0 CANNOT
structurally distinguish it from a reference and **accepts** it. That is a
recorded accept-and-trap gap (mirroring ADR 0063's argv-secret-inlining),
backstopped by the `forbidden-string-scan` committed-fixture check and the
deferred Ring 1 deep check — NOT a Ring 0 guarantee. The deep "this locator
is genuinely a reference and not a secret, and resolves to an authorized
value" check, plus the actual value resolution, are Ring 1 broker
obligations (charter inv. 5; the broker stays blocked until the
approval/lease/dashboard/audit stack exists, inv. 7).

### Typed-slot distinction (charter inv. 16 / line 98)

`SecretReference` is the **secret-reference** slot and is deliberately
DISJOINT from the other four argument classes that the `OperationShape` /
`CommandShape` argument schemas must keep separate (raw secret material has
no Ring-0 slot at all — it never appears):

- NOT a `ProviderObjectReference` (a provider-side object id / ARN-like
  handle).
- NOT a `PublicClientId` (a public OAuth client identifier — not secret).
- NOT a `PolicySelectorValue` (a policy selector / tier key).
- NOT raw secret material (which never appears in Ring 0 at all).

Conflating any of these into a single untyped string fails CI (charter line
98 / forbidden-pattern line 136). `SecretReference` is the typed home for
"a pointer to a secret," nothing else.

`reference_kind: env_var_name` is also deliberately distinct from
`CommandShape.env[].value_source.kind: execution_context_inherited` (ADR
0063): the former is a typed pointer to a SECRET resolved by reading a named
env var at execution, while the latter is a non-secret same-name pass-through
that involves no `SecretReference`. The two resolution paths are distinct;
keeping them from collapsing is a Ring 1 broker obligation.

### `source_provenance`

`secretReferenceSourceProvenanceSchema` is a `.strict()` sub-object binding a
`SecretReference` declaration to its declaration site, mirroring the
`PolicyRule` / `Capability` non-minted provenance pattern but deliberately
LIGHTER: a `SecretReference` is constructed per-use rather than read from a
canonical hash-bound registry / live-policy blob, so it carries NO
`source_*_path` / `source_*_sha256` / `*_basis` digest-trust binding. The
pinned minimal floor is:

- `authority` — the literal `secret_reference_declaration`, deliberately
  DISJOINT from `evidenceAuthoritySchema` and conferring no authority by
  itself.
- `observed_at` — declaration observation timestamp.

A future schema PR MAY add an optional declaration-source reference if
reviewers find it load-bearing; if added it is format-constrained and MUST
NOT carry secret material (a `.strict()` / format constraint, not just
prose).

### What stays in Ring 1 (not this schema)

- Resolving `reference_locator` to a value at execution time (the broker;
  inv. 5 keeps the value out of Ring 0 entirely).
- Verifying `credential_source_ref` FK existence and the `CommandShape`
  `secret_reference_ref` → `SecretReference` FK existence.
- Resolution precedence when a `SecretReference` carries BOTH its own
  `reference_locator` AND a bound `credential_source_ref` whose
  `CredentialSource.secret_ref` also points at a secret: the broker MUST
  apply a named precedence rule so the two cannot drift to different targets.
  Ring 0 cannot enforce this cross-record consistency (inv. 1).
- The deep "reference, not secret" verification for the permissive locator
  kinds (`env_var_name` / `broker_handle` / `hcs_uri` tails), and
  authorization of the resolved value (provider-side; charter inv. 16
  evidence-first).
- Never persisting the resolved value anywhere (inv. 5; forbidden-pattern:
  no secret in a persisted config file; no env dumps).

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
   `credential_source_ref`. Reuse `entityIdSchema` and `envVariableNameSchema`
   from `common.ts` (the `env_var_name` locator grammar) rather than
   redefining them, per the `command-shape.ts` / `capability.ts` reuse
   discipline.
2. Register the schema in `packages/schemas/scripts/generate-json-schemas.ts`
   and `packages/schemas/src/index.ts`; regenerate
   `SecretReference.schema.json`.
3. Add `packages/schemas/tests/secret-reference.test.ts`: each
   `reference_kind` accepts its valid locator; the STRUCTURED kinds (`op_uri`,
   `keychain_item`) reject mis-shaped / raw-value / resolved-`op://` locators;
   the `superRefine` rejects a `reference_kind`/`reference_locator` mismatch; a
   `reference_locator` equal to a policy-selector / tier key
   (`write-destructive`, `forbidden`, `write-host`) rejects for every kind
   (enforcing the inv. 16 `SecretReference != PolicySelectorValue`
   distinction, not just asserting it); `.strict()` rejects injected
   mint/policy/value fields by name (`audit_chain_link_hash`, `producer`,
   `evidence_refs`, `tier`, `approval_required_for`, `grant_scope`,
   `max_uses`, `operation_class`); optional `credential_source_ref` accepts
   present/absent/null; AND a RECORDED accept-and-trap proving the permissive
   kinds (`env_var_name`, `broker_handle`, `hcs_uri` tail) ACCEPT a
   token-shaped locator at Ring 0 (the documented gap). Any token/value-shaped
   negative-test input MUST be built by RUNTIME CONCATENATION (the
   `command-shape.test.ts` discipline) so the test file does not self-trip
   `forbidden-string-scan` check #2.
4. Update `docs/host-capability-substrate/ontology.md` (the entity section,
   version, change log, AND a rewrite of the §Entities one-liner so `op://`
   reads as ONE OF the five reference kinds, not the only one) and
   `docs/host-capability-substrate/ontology-registry.md` (a
   §Current-schema-version-ledger row at `'0.1.0'`, a §Schema-enum-mirrors
   `SecretReference.reference_kind` subsection listing all five kinds
   verbatim, a §References row, a one-line §Field-name-suffixes clarification
   codifying the `optional/forward cross-record FK → _ref` sub-convention,
   retiring the stale "unbuilt `SecretReference`" note, version + change log).
   Optionally update `command-shape.ts` `secret_reference_ref.describe()` to
   note `SecretReference` now exists as the typed FK target (NO `CommandShape`
   shape change; `schema_version` stays `'0.1.0'`), mirroring the ADR 0055
   Session FK-closure precedent — if taken, regenerate
   `CommandShape.schema.json` in the SAME commit (describe-only; schemas and
   generated move together).
5. Record `SecretReference.reference_locator` under the
   `forbidden-string-scan` backstop. The scan already recurses `packages/`,
   so committed fixtures are already in scope; the change is DOCUMENTARY — a
   comment block per the ADR 0063 precedent, NOT a new `op://` grep pattern
   (an `op://vault/item/field` reference form is the ALLOWED shape and must
   not be flagged; the scan targets resolved values / gitleaks-shaped tokens,
   scan check #2).
6. Do not edit live policy, generated snapshots, system-config, Ring 1
   service code, ADR 0063, or ADR 0018 in the schema PR unless separately
   authorized.

## Follow-up regression coverage

This ADR seeds no synthetic regression traps. It records schema-test and
implementation-test obligations.

| Failure class | Coverage posture |
|---|---|
| New non-minted entity introduction | Schema tests in the follow-up schema PR; no regression trap unless an observed agent/implementation failure with cited fixture evidence appears. |
| Inline secret / resolved `op://` value in a STRUCTURED locator (`op_uri`, `keychain_item`) | Schema tests assert reject for mis-shaped / raw-value locators; the `forbidden-string-scan` committed-fixture backstop guards committed test data; no synthetic trap at ADR acceptance. |
| Token-shaped value satisfying a PERMISSIVE locator grammar (`env_var_name`, `broker_handle`, `hcs_uri` tail) | Recorded accept-and-trap (parallel to ADR 0063's argv-secret-inlining): Ring 0 ACCEPTS — it cannot structurally tell a token-shaped value from a reference for these kinds — backstopped by the `forbidden-string-scan` committed-fixture check (conservative `sk-`/`ghp_`/`xoxb-`/`AKIA` heuristic) and the deferred Ring 1 deep reference-vs-secret check. No synthetic trap now. |
| `reference_kind` / `reference_locator` mismatch | Schema tests assert the `superRefine` rejects a locator whose shape does not match its kind. |
| Typed-slot conflation (SecretReference vs the other four argument classes) | CI provides a committed-fixture `forbidden-string-scan` backstop plus structural `.strict()` / discriminated typing that separates the secret-reference slot; the FULL five-class distinction (ProviderObjectReference / PublicClientId / PolicySelectorValue / SecretReference / raw secret) is the deferred Ring 1 gateway obligation seeded by ADR 0063, NOT a Ring 0 structural CI check. |
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
  v1.4.1 -- invariant 5 (references yes, values no), invariant 1 (no
  live-policy content in Ring 0), invariant 16 + line 98 (the five separate
  typed argument slots); forbidden patterns: "Writing secrets into any
  persistent config file", "Committing resolved `op://` values or any
  secret-pattern match", and the typed-slot-conflation ban. (Cited by clause;
  charter line numbers are version-fragile.)
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
