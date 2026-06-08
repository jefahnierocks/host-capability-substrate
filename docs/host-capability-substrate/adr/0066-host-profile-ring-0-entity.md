---
adr_number: 0066
title: HostProfile Ring-0 entity
status: proposed
version: v2
date: 2026-06-07
charter_version: 1.4.1
tags: [host-profile, ring-0, non-minted, host-identity, privacy, runner-host-observation-followup]
---

# ADR 0066: HostProfile Ring-0 entity

## Status

`proposed`

Drafted 2026-06-07 as the next lower-coupling M1 Ring-0 entity (per PLAN.md
§Current Focus order, after `SecretReference`): the canonical host identity +
stable facts record, closing `RunnerHostObservation.host_id` (ADR 0032). This
ADR is design-only. It does not land Zod source, generated JSON Schema, tests,
ontology/registry edits, live policy, generated snapshots, system-config, or
Ring 1 implementation code. The schema PR follows only after ADR acceptance
per `.agents/skills/hcs-schema-change`.

ADR 0066 v1 was dispatched to all five reviewers for round 1 on 2026-06-07
(`hcs-security-reviewer` load-bearing for the never-the-raw-identifier posture).
All five returned ready-for-acceptance or `yes_with_mechanical_tweaks` with
**zero blockers**: policy and eval returned ready-for-acceptance; architect,
ontology, and security returned `yes_with_mechanical_tweaks`. The non-minted
peer shape, the `RunnerHostObservation.host_id` FK closure with no shape change,
and the structural `sha256:` bar on `host_identity.digest` were all confirmed.
v2 absorbs every mechanical tweak. The load-bearing one (ontology → security):
the "a raw machine identifier cannot land" guarantee was **overclaimed** — it
holds for `host_identity.digest` (structural `sha256:`) but NOT for
`host_profile_id` (typed `entityIdSchema`, whose regex accepts a raw
`IOPlatformUUID`); v2 scopes the claim to the digest and adds a Ring-1
obligation that `host_profile_id` be opaque/derived. v2 also renames the
provenance authority literal `host_profile_observation` → `host_profile_declaration`
(matching the durable-not-observation thesis and the peer site-noun convention);
tightens `os_version` to a bounded version-shaped regex (a bare
`z.string().min(1)` cannot reject a smuggled machine-id / URI / path / secret
shape); clarifies that `host_identity` is required and its `digest` always a real
`sha256:` value (`install_id_sha256` is the always-derivable fallback; `unknown`
= unclassified-but-still-hashed, not empty); records the
`RunnerHostObservation.host_id → HostProfile.host_profile_id` FK mapping; and
adds the policy-input clarification plus the `.strict()` / authority / retired /
host_profile_id schema-test obligations. No blocker required a re-review; v2 is
presented for acceptance under the mechanical-tweaks-at-acceptance discipline
(ADR 0058 precedent).

## Date

2026-06-07

## Charter version

Written against implementation charter v1.4.1 and
`docs/host-capability-substrate/ontology-registry.md` v0.4.26. `HostProfile`
is constrained by charter invariant 8 (sandbox observations do not promote to
host-authoritative evidence — a HostProfile is host-authoritative, so its
facts must not be sandbox-derived), the installed-runtime-evidence rule
(host config values require installed-runtime / config-spec evidence, not
schema/doc-only claims), and the secret/sensitive-data discipline (no raw
secret or sensitive identifier at rest; the workspace treats personal
infrastructure facts as sensitive by default).

## Context

`ontology.md` §Entities lists `HostProfile` as "canonical host identity +
stable facts" — a no-suffix standalone Ring-0 entity with durable identity and
lifecycle (registry §Naming-suffix discipline). It is one of the remaining
lower-coupling M1 entities.

The host already appears in HCS as a TRANSIENT observation:
`RunnerHostObservation` (ADR 0032) is a direct `Evidence` subtype recording a
CI runner host's substrate kind, os, arch, labels, and repo-access posture at
an observation time, and it carries an OPTIONAL `host_id` FK (a forward
reference to the durable host record). `HostProfile` is that durable record:
the canonical, stable identity + facts of a host machine, distinct from a
point-in-time runner observation. Landing it closes
`RunnerHostObservation.host_id` (the FK target now exists; FK existence
verification stays a Ring 1 obligation, with NO `RunnerHostObservation` shape
change — mirroring the ADR 0055 Session and ADR 0065 SecretReference
typed-FK-closure precedent).

`HostProfile` is a structural peer of `PolicyRule` (ADR 0060), `Capability`
(ADR 0062), `CommandShape` (ADR 0063), and `SecretReference` (ADR 0065): a
NON-MINTED Ring-0 entity with no `audit_chain_link_hash`, no producer-mint
field, and no `evidence_refs`; absent from the ADR 0057 mint scope.

## Options considered

### Option A: Non-minted facts + provenance profile (chosen)

`HostProfile` carries a stable host identity (as a non-reversible digest), the
stable OS/arch facts, an `active`/`retired` lifecycle, and a `.strict()`
`source_provenance`. It is non-minted, like the rest of the lower-coupling M1
train.

**Pros:**

- Consistent with the other lower-coupling non-minted M1 entities (Capability /
  CommandShape / SecretReference); a self-contained, low-coupling slice.
- Closes `RunnerHostObservation.host_id` without re-scoping any service.
- Does not enlarge the ADR 0057 mint/audit scope or require a canonical-hash
  design.

**Cons:**

- A non-minted profile is not itself audit-chain-anchored; durable
  attribution of WHO recorded a HostProfile, if later required, is a Ring 1
  mint/audit concern, not a Ring 0 field here.

### Option B: Minted typed-identity envelope

Model `HostProfile` like `AgentClient` / `Principal` / `Session`: add
`audit_chain_link_hash`, `evidence_refs`, a new `kernel_host_resolver`
producer, and a canonical field-order / GENESIS design, and add HostProfile to
the ADR 0057 mint/audit scope.

**Pros:**

- Matches "canonical identity + durable lifecycle" most literally; audit-chain
  anchored.

**Cons:**

- Heavier: requires a canonical-hash design (an ADR 0059-style commitment) and
  a future-amendment to the ADR 0057 mint scope (which currently enumerates
  Decision/ApprovalGrant/Lease/Run/Principal/Session/AgentClient/WorkspaceContext).
- Over-couples a lower-coupling M1 entity to the mint/audit service before that
  service exists.

### Option C: Reuse / extend RunnerHostObservation

Treat the transient `RunnerHostObservation` as the only host record and retarget
`host_id` at it.

**Pros:**

- One fewer entity.

**Cons:**

- Conflates a point-in-time CI-runner observation with the durable canonical
  host identity; `RunnerHostObservation` is an Evidence subtype with
  observation lifecycle, not a stable profile.
- Contradicts the M1 entity list, which names `HostProfile` as a distinct
  no-suffix durable-identity entity.

## Decision

Choose **Option A**. `HostProfile` is a non-minted Ring-0 entity. It closes
`RunnerHostObservation.host_id` (FK target now exists; no
`RunnerHostObservation` shape change).

### Entity shape (design sketch; exact Zod lands in the schema PR)

```text
HostProfile (non-minted Ring 0; structural peer of Capability/SecretReference)
  schema_version     z.literal('0.1.0')
  host_profile_id    entityIdSchema
  host_state         enum: active | retired
  os_name            enum: macos | linux | windows | unknown
  os_version         string (bounded; version-shaped regex — no whitespace,
                     no `/`, no `://`, no `op://`, no secret/path shape)
  arch               enum: arm64 | x86_64 | unknown
  host_identity      REQUIRED { kind:   platform_uuid_sha256 | install_id_sha256
                                      | unknown,
                               digest: sha256DigestSchema }  // NON-REVERSIBLE digest,
                                                             // ALWAYS present (install_id_sha256
                                                             // is the always-derivable fallback);
                                                             // NEVER a raw serial / UUID
  source_provenance  { authority: 'host_profile_declaration', observed_at }
```

`.strict()` envelope. NO `audit_chain_link_hash`, NO producer-mint field, NO
`evidence_refs`; absent from the ADR 0057 mint scope. Reuses `entityIdSchema`,
`sha256DigestSchema`, and `isoDateTimeSchema` from `common.ts`.

### `host_identity` (the privacy heart)

A host's raw machine identifier (macOS `IOPlatformUUID`, a hardware serial, a
Linux `machine-id`) is a sensitive machine fingerprint. `HostProfile` MUST NOT
store it raw. `host_identity.digest` is a `sha256DigestSchema` value — a stable,
NON-REVERSIBLE digest of the chosen stable identifier — and `host_identity.kind`
names what was hashed (`platform_uuid_sha256` = SHA-256 of the platform UUID;
`install_id_sha256` = SHA-256 of a per-install HCS id; `unknown`).

The `sha256:` shape is STRUCTURALLY enforcing: a raw `IOPlatformUUID`
(`XXXXXXXX-XXXX-...`) or a serial does not match `^sha256:[a-f0-9]{64}$`, so a
raw identifier cannot land in the `host_identity.digest` field. Ring 0 validates
the digest SHAPE only; that the digest was actually computed over the named
stable identifier (and not, say, over a value the producer should not have read)
is a Ring 1 producer obligation.

`host_identity` is REQUIRED and its `digest` is always a real `sha256:` value:
`install_id_sha256` (the SHA-256 of a per-install HCS id) is always derivable, so
a host is never forced into an impossible "required field, nothing to hash"
state. `kind: unknown` means the hashed stable identifier is UNCLASSIFIED — not
that there is no identity or an empty digest; the digest stays present.

The structural `sha256:` guarantee covers ONLY `host_identity.digest`. It does
NOT cover `host_profile_id`, which is `entityIdSchema` and whose regex
(`^[A-Za-z0-9][A-Za-z0-9._:-]*$`) ACCEPTS a raw `IOPlatformUUID` (hex + hyphens).
So `host_profile_id` MUST NOT be the raw machine identifier — it must be an
opaque/derived id (for example derived from `host_identity.digest`, or a random
local id). Ring 0 cannot reject a raw-UUID-shaped id, so this is a Ring 1
producer obligation (recorded as an accept-and-trap in the schema PR).

### `source_provenance` and host-authoritative observation

`source_provenance` is a `.strict()` sub-object (`authority` literal
`host_profile_declaration` — a site/source noun matching the
`capability_registry` / `secret_reference_declaration` peer convention and the
entity's durable-not-observation thesis, disjoint from `evidenceAuthoritySchema`
and conferring no authority by itself; `observed_at`), mirroring the
`Capability` / `SecretReference` non-minted provenance pattern. The os/arch/version
facts are read-only policy INPUTS to a future Ring 1 PolicyRule; they never carry
tier / approval / grant semantics (charter inv. 1). Two charter
obligations attach at Ring 1 (not enforceable by the Ring 0 shape):

- The os/arch/version facts must come from INSTALLED-RUNTIME observation
  (e.g., `sw_vers`, `uname`), not schema/doc-only claims (charter
  installed-runtime-evidence rule).
- A HostProfile is HOST-AUTHORITATIVE; its facts MUST NOT be promoted from a
  sandbox observation (charter inv. 8). The Ring 1 producer enforces a
  non-sandbox source.

### What stays in Ring 1 (not this schema)

- Verifying `RunnerHostObservation.host_id` → `HostProfile` FK existence.
- Computing `host_identity.digest` over the correct stable identifier and never
  persisting the raw identifier anywhere.
- Ensuring `host_profile_id` is an opaque/derived id and NOT the raw machine
  identifier — Ring 0's `entityIdSchema` cannot reject a raw-UUID-shaped id, so
  non-raw-id is a Ring 1 producer obligation.
- Enforcing installed-runtime observation and non-sandbox authority for the
  recorded facts.
- HostProfile supersession (a materially-changed host produces a NEW
  `active` HostProfile and retires the prior) is a Ring 1 lifecycle obligation;
  Ring 0 only validates the `host_state` value.

## Consequences

### Accepts

- `RunnerHostObservation.host_id` gains a typed FK target; no
  `RunnerHostObservation` shape change.
- HCS gains the canonical durable host record as a clean non-minted peer of the
  other lower-coupling M1 entities.
- The host fingerprint is stored as a non-reversible digest in
  `host_identity.digest`; a raw machine identifier cannot land in THAT field
  (structural `sha256:` enforcement). Keeping `host_profile_id` opaque/derived —
  `entityIdSchema` cannot be structurally constrained to non-raw at Ring 0 — is a
  Ring 1 obligation (per §What stays in Ring 1).

### Rejects

- A raw serial / hardware UUID / `machine-id` field anywhere on the entity.
- Minting / audit-chain commitment for HostProfile (Option B).
- Reusing the transient `RunnerHostObservation` as the durable record (Option C).
- Any live-policy, generated-snapshot, system-config, ADR 0032, or Ring 1
  implementation change in this ADR slice.

### Future amendments

- If operational evidence shows HostProfile needs audit-chain anchoring, a
  future amendment (an ADR 0059-style canonical-hash commitment + an ADR 0057
  mint-scope addition) can promote it; this ADR does not.
- `os_name` / `arch` enum values may widen via the registered §Procedure rule
  as new host substrates appear.

## Out of scope

This ADR explicitly does not authorize:

- Zod source, generated JSON Schema, tests, or ontology/registry edits (the
  schema PR per `.agents/skills/hcs-schema-change` follows).
- Edits to ADR 0032 (RunnerHostObservation) or any other ADR.
- `RunnerHostObservation` schema shape changes (`host_id` stays
  `entityIdSchema.optional()`).
- Live policy, `tiers.yaml`, generated-snapshot, or system-config edits.
- Ring 1 host-state / resolver code, host probing, or digest computation.
- Execution broker, gateway, capability registration, tool resolution, or
  dashboard behavior.
- Provider mutations or hook behavior changes.

## Implementation plan after acceptance

The follow-up schema PR, and only that PR, should:

1. Add `packages/schemas/src/entities/host-profile.ts`:
   `hostProfileSchemaVersionSchema = z.literal('0.1.0')`; the `host_state`,
   `os_name`, `arch`, and `host_identity.kind` enums; a bounded `os_version`
   regex that forbids whitespace, `/`, `://`, `op://`, and path/secret shapes (a
   bare `z.string().min(1)` is insufficient); the `hostProfileHostIdentitySchema`
   `.strict()` sub-object (`kind` + `sha256DigestSchema` `digest`, digest always
   present); the `hostProfileSourceProvenanceSchema` `.strict()` sub-object
   (`authority` literal `host_profile_declaration`); and the `.strict()`
   `hostProfileSchema`. Reuse `entityIdSchema`, `sha256DigestSchema`, and
   `isoDateTimeSchema` from `common.ts`.
2. Register in `packages/schemas/scripts/generate-json-schemas.ts` and
   `packages/schemas/src/index.ts`; regenerate `HostProfile.schema.json`.
3. Add `packages/schemas/tests/host-profile.test.ts`: a well-formed profile
   accepts; each enum value accepts and out-of-enum rejects; `host_state:
   'retired'` accepts (a retired host is a valid historical record, not a
   policy-denied state); `host_identity.digest` rejects a raw-UUID / serial /
   non-`sha256:` shape (proving a raw identifier cannot land in THAT field), and
   `kind: 'unknown'` still requires a real `sha256:` digest; `os_version` rejects
   whitespace / URI / path / `op://` / bare-machine-id shapes; `.strict()`
   rejects injected mint / value / policy fields by name (`audit_chain_link_hash`,
   `producer`, `evidence_refs`, a raw `platform_uuid` / `serial` / `machine_id`
   field, and `tier` / `approval_required_for` / `grant_scope` / `max_uses` /
   `forbidden`); `source_provenance.authority` must equal exactly
   `host_profile_declaration` and EVERY `evidenceAuthoritySchema` value rejects
   (including `host-observation` / `installed-runtime` / `sandbox-observation`),
   and a non-strict provenance rejects; AND a RECORDED accept-and-trap that a
   `host_profile_id` set to a raw-`IOPlatformUUID` shape is ACCEPTED at Ring 0
   (the documented gap — `entityIdSchema` cannot reject it; non-raw-id is the
   Ring 1 producer obligation).
4. Update `docs/host-capability-substrate/ontology.md` (the entity section +
   version + change log) and `docs/host-capability-substrate/ontology-registry.md`
   (a §Current-schema-version-ledger row at `'0.1.0'`, a §Schema-enum-mirrors
   `HostProfile` subsection for the `host_state` / `os_name` / `arch` /
   `host_identity.kind` enums, a §References row, version + change log).
   Optionally update `runner-host-observation.ts` `host_id.describe()` to note
   `HostProfile` now exists as the typed FK target (NO `RunnerHostObservation`
   shape change; regenerate its generated schema in the same commit if taken).
5. Do not edit live policy, generated snapshots, system-config, Ring 1 code, or
   ADR 0032 in the schema PR unless separately authorized.

## Follow-up regression coverage

This ADR seeds no synthetic regression traps. It records schema-test and
implementation-test obligations.

| Failure class | Coverage posture |
|---|---|
| New non-minted entity introduction | Schema tests in the follow-up schema PR; no regression trap unless an observed agent/implementation failure with cited fixture evidence appears. |
| Raw machine identifier at rest (in `host_identity.digest`) | Schema tests assert `host_identity.digest` rejects any non-`sha256:` shape (a raw UUID/serial cannot land) and `.strict()` rejects an injected raw `platform_uuid`/`serial` field; no synthetic trap at ADR acceptance. |
| Raw machine identifier in `host_profile_id` | `entityIdSchema` accepts a raw-`IOPlatformUUID` shape, so Ring 0 cannot reject it; a recorded accept-and-trap schema test documents the gap, and keeping `host_profile_id` opaque/derived is a Ring 1 producer obligation. No synthetic trap at ADR acceptance. |
| Sandbox-sourced or doc-only host facts | Ring 1 producer obligation (charter inv. 8 + installed-runtime-evidence rule); implementation-test obligation when the host-state/resolver service lands; no Ring 0 coverage now. |
| `RunnerHostObservation.host_id` FK existence | Ring 1 implementation-test obligation; no Ring 0 coverage now. |

## Acceptance criteria

- Operator confirms the v1 scope and the non-minted facts+provenance shape
  (Option A).
- `hcs-architect`, `hcs-ontology-reviewer`, `hcs-policy-reviewer`,
  `hcs-security-reviewer`, and `hcs-eval-reviewer` complete review and all
  blocking findings are absorbed or explicitly rejected by the operator;
  `hcs-security-reviewer` is load-bearing for the never-the-raw-identifier
  posture.
- `HostProfile` stays non-minted (no `audit_chain_link_hash` / producer /
  `evidence_refs`) and stores the host fingerprint only as a non-reversible
  `sha256:` digest in `host_identity.digest` — no raw serial / UUID / `machine-id`
  field. `host_profile_id` must be opaque/derived (a Ring 1 obligation, since
  `entityIdSchema` cannot reject a raw-UUID-shaped id at Ring 0).
- The entity closes `RunnerHostObservation.host_id` with no
  `RunnerHostObservation` schema shape change.
- Installed-runtime observation and non-sandbox authority for the recorded
  facts stay Ring 1 producer obligations.
- The ADR keeps the schema-change boundary: no Zod source, generated JSON
  Schema, ontology, registry, test, fixture, live-policy, generated-snapshot,
  system-config, or Ring 1 implementation changes in the acceptance slice.
- `just verify` remains green.

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md` v1.4.1 —
  invariant 8 (sandbox observations do not promote to host-authoritative
  evidence); the installed-runtime-evidence rule for host config; the
  secret/sensitive-data forbidden patterns.
- ADR 0032:
  `docs/host-capability-substrate/adr/0032-q-005-ci-runner-evidence-model.md`
  — `RunnerHostObservation` and its `host_id` FK this entity closes.
- ADR 0062 / D-060:
  `docs/host-capability-substrate/adr/0062-capability-ring-0-entity.md` —
  non-minted Ring-0 entity + `source_provenance` precedent.
- ADR 0065 / D-063:
  `docs/host-capability-substrate/adr/0065-secret-reference-ring-0-entity.md`
  — sibling non-minted entity + the typed-FK-closure (no consumer shape change)
  precedent.
- ADR 0055 / D-044:
  `docs/host-capability-substrate/adr/0055-session-ring-0-entity.md` — typed-FK
  closure precedent (consuming entity unchanged at `entityIdSchema`).
- Ontology: `docs/host-capability-substrate/ontology.md` §Entities
  ("HostProfile — canonical host identity + stable facts").
- Ontology registry:
  `docs/host-capability-substrate/ontology-registry.md` —
  `Naming suffix discipline` (no-suffix durable-identity entity),
  `Current schema-version ledger`.
- Schema-change workflow: `.agents/skills/hcs-schema-change/SKILL.md`.

### External

- None directly. macOS `IOPlatformUUID` / `sw_vers` and Linux `machine-id` /
  `uname` are named only as observation sources hashed/parsed by a future
  Ring 1 producer, never stored raw.
