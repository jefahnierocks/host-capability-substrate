---
adr_number: 0070
title: Artifact Ring-0 entity
status: accepted
version: v2
date: 2026-06-08
charter_version: 1.4.1
tags: [artifact, ring-0, non-minted, storage-primitive, run-followup, content-addressed]
---

# ADR 0070: Artifact Ring-0 entity

## Status

`accepted`

Drafted 2026-06-08 as the next lower-coupling M1 entity (per PLAN.md §Current
Focus order, after the tool-resolution chain): the first of the remaining
"storage primitive" entities (`Artifact` / `Lock` / `ResourceBudget`). This ADR
is design-only. It does not land Zod source, generated JSON Schema, tests,
ontology/registry edits, live policy, generated snapshots, system-config, or
Ring 1 implementation code. The schema PR follows only after ADR acceptance per
`.agents/skills/hcs-schema-change`.

The operator confirmed the entity shape (2026-06-08): a **non-minted,
digest-addressed, IMMUTABLE descriptor** of a run's output — `run_id` FK +
`artifact_kind` + `content_sha256` (the content address) + `byte_size` +
`source_provenance`, with NO inline content, NO storage-location pointer, and NO
lifecycle state field.

ADR 0070 v1 was dispatched to all five reviewers for round 1 on 2026-06-08
(`hcs-security-reviewer` load-bearing for the no-bytes/no-secret-at-rest posture).
All five returned `yes` or `yes_with_mechanical_tweaks` with **zero blockers**:
security, ontology, and eval returned `yes`; policy and architect returned
`yes_with_mechanical_tweaks`. The digest-addressed-descriptor discipline (no
bytes/value/storage-pointer; `content_sha256` is the only content surface, a
non-reversible digest), the immutable no-state choice, and the
`Evidence.subject_kind: 'artifact'` pre-reservation were all confirmed against
source. v2 folds every mechanical tweak: it qualifies the non-minted-peer claim
(Artifact omits the `active`/`retired` lifecycle the resolution/install peers
carry — immutability replaces in-place state, also the policy-cleaner choice);
names the `run_id` `_id`-not-`_ref` suffix rationale; adds the
`byte_size`↔`content_sha256` cross-consistency and the canonical-encoding rule to
the Ring-1 obligations; and pins the schema-PR rigor (`artifact_kind` `.describe()`
carries the inv-1 "descriptive FACT, not a verdict" clause; the `.strict()`
reject-list adds `value`/`payload`; the registry enum-mirror carries the
`unknown`-sentinel + §Procedure-widening note). Because round 1 returned zero
blockers, no confirming round 2 was required (mechanical-tweaks-at-acceptance,
ADR 0058 precedent).

ADR 0070 is accepted 2026-06-08 as D-068. Round 1 returned zero blockers and v2
folded every mechanical tweak, so no confirming round 2 was required. It
establishes the first storage-primitive entity: a non-minted, digest-addressed,
IMMUTABLE descriptor of a run output — a required `run_id` FK + `artifact_kind` +
`content_sha256` (the content address) + `byte_size` + `source_provenance`, with
no inline bytes, no storage-location pointer, no inline value, and no lifecycle
state (the `sha256` digest IS the identity; the bytes + storage location are Ring 1
runtime state). Fulfills the pre-reserved `Evidence.subject_kind: 'artifact'` with
no `Evidence` schema change. The follow-on schema PR (`artifact.ts` + generated +
tests + ontology/registry, incl. the `artifact_id` accept-and-trap and the
`.strict()` content/value/payload reject probes) and the Ring 1 obligations
(`run_id` FK existence, digest verification + the `byte_size`↔digest
cross-consistency, the canonical-encoding rule, sandbox-non-promotion per inv. 8,
`artifact_id` opacity, retention/GC) remain future work.

## Date

2026-06-08

## Charter version

Written against implementation charter v1.4.1 and
`docs/host-capability-substrate/ontology-registry.md` v0.4.30. `Artifact` is
constrained by charter invariant 1 (no live-policy content in Ring 0 — an output
record is a fact, not a tier), invariant 5 (no secret-shaped values at rest — the
bytes are never inlined), invariant 8 (the output must be observed/produced from
host-authoritative inputs, not promoted from a sandbox observation — a Ring 1
producer obligation), and the charter rule that **no runtime state / blobs live
in the repo** (they live under `~/Library/Application Support/host-capability-substrate/`).

## Context

`Artifact` is "a run's structured output (diff, log chunks, exit code, signed
summary)" (ontology §Entities). It is the first of the remaining lower-coupling
M1 "storage primitives" (`Artifact` / `Lock` / `ResourceBudget`).

The defining design tension: a run output is content (a diff, a log chunk, a
signed summary), but **Ring 0 must not hold runtime blobs** (charter: runtime
state lives under `~/Library/Application Support/…`, not the repo / Ring-0 schema)
and must not hold secret-shaped values at rest (inv. 5). The resolution: `Artifact`
is a typed **descriptor** of a run output — content-ADDRESSED by a `sha256` digest
— not the bytes. The digest is the artifact's content identity; the bytes and
their storage location are Ring 1 runtime state.

Two disambiguation points:

**1. `Artifact` (the durable descriptor) vs `Evidence` (an observation about an
artifact).** `Evidence.subject_kind: 'artifact'` is ALREADY Zod-defined
(`evidence.ts`), so this ADR fulfills a pre-reserved subject kind WITHOUT
modifying `evidenceSubjectKindSchema` or bumping `Evidence.schema_version` (the
Principal / HostProfile / ToolInstallation / ResolvedTool precedent). `Artifact`
is the stable subject; an `Evidence` record may corroborate it.

**2. Descriptor vs payload.** `Artifact` carries `content_sha256` (the content
address) + `byte_size` (a fact) + `artifact_kind` (the output shape) + the owning
`run_id`. It carries NO inline bytes, NO storage-location pointer (a Ring-1
runtime detail that can move), and NO small inline value (e.g. an `exit_code`
integer): even a tiny structured output is addressed by the digest of its
canonical encoding, with the value resolvable from runtime state via that digest —
a Ring 1 concern. This keeps the entity uniform across all kinds and free of any
inline/secret surface.

`Artifact` is IMMUTABLE: produced once by a run and identified by its digest; a
corrected or re-run output is a NEW `Artifact` with a NEW digest. It therefore
carries NO `active`/`retired` lifecycle field — retention/GC is a Ring 1 concern,
not an entity-layer state transition. `Artifact` is thus a non-minted peer of the
resolution/install entities (`ToolInstallation` / `ResolvedTool`) MINUS that
lifecycle state: immutability replaces in-place supersession. The omission is also
the policy-cleaner choice — with no state field, there is no value a policy reader
could misread as a policy-denied state (the precedents carry that disambiguation
note precisely because they DO hold state).

## Decision

Choose **Option A**. `Artifact` is a non-minted, digest-addressed, immutable
Ring-0 descriptor of a run output.

### Entity shape (design sketch; exact Zod lands in the schema PR)

```text
Artifact (non-minted Ring 0; structural peer of ToolInstallation/HostProfile)
  schema_version     z.literal('0.1.0')
  artifact_id        entityIdSchema
  run_id             entityIdSchema                    // REQUIRED FK to Run (ADR 0053)
  artifact_kind      enum: command_diff | log_chunk | exit_code |
                           signed_summary | unknown
  content_sha256     sha256DigestSchema                // the content ADDRESS (not the bytes)
  byte_size          z.number().int().min(0)           // a size FACT
  source_provenance  { authority: 'artifact_declaration', observed_at }
```

`.strict()` envelope. NO `audit_chain_link_hash`, NO producer-mint field, NO
`evidence_refs`; absent from the ADR 0057 mint scope. NO inline content, NO
storage-location pointer, NO lifecycle-state field. Reuses `entityIdSchema`,
`isoDateTimeSchema`, and `sha256DigestSchema` (`common.ts`).

### Fields

- `run_id` — a REQUIRED typed FK to `Run` (ADR 0053): the run that produced the
  output. The `_id` (not `_ref`) suffix is deliberate per the registry field-name
  discipline — the reference is required, monomorphic, and its target (`Run`)
  already exists, so `_id` (not the optional/forward/polymorphic `_ref` form)
  applies, matching the peer FKs `ToolInstallation.tool_provider_id` /
  `ResolvedTool.tool_installation_id`. FK existence is a Ring 1 obligation; Ring 0
  only types the reference.
- `artifact_kind` — the output shape: `command_diff` | `log_chunk` | `exit_code` |
  `signed_summary` | `unknown` (the ontology one-liner's set + the house sentinel).
  Widening via the registered §Procedure rule.
- `content_sha256` — the content ADDRESS (`sha256DigestSchema`, `sha256:` +
  64 hex): a non-reversible digest of the output's canonical bytes. NEVER the
  bytes; NEVER a secret value (inv. 5). The digest is the artifact's identity.
- `byte_size` — a non-negative integer size FACT (the encoded byte length); a
  descriptive fact Ring 1 reads, carrying no value/secret.
- `source_provenance` — a `.strict()` declaration-site binding (`authority`
  literal `artifact_declaration`, disjoint from `evidenceAuthoritySchema` and
  conferring no authority by itself; `observed_at`), mirroring the
  `ToolInstallation` / `ResolvedTool` / `HostProfile` non-minted provenance pattern.

### What stays in Ring 1 (not this schema)

- The actual bytes and their storage location (under
  `~/Library/Application Support/host-capability-substrate/`), and resolving a
  digest → bytes.
- Producing the output from host-authoritative inputs and NOT promoting a sandbox
  observation to a host-authoritative `Artifact` (charter inv. 8).
- `run_id` FK existence; `content_sha256` digest verification against stored bytes;
  the `byte_size`↔`content_sha256` cross-consistency (the recorded size must equal
  the encoded length of the bytes that hash to the digest — Ring 0 cannot see the
  bytes, so a truthful digest with a false `byte_size` is a Ring-1 integrity check);
  and the canonical-encoding rule the digest is taken over (so equivalent outputs —
  including a small structured `exit_code` — produce the same digest).
- `artifact_id` opacity (see §Consequences accept-and-trap).
- Retention / GC of superseded outputs (there is no entity-layer lifecycle state).

## Consequences

### Accepts

- HCS gains the durable run-output descriptor as a clean non-minted peer; the
  first storage primitive.
- Content-addressing keeps Ring 0 free of runtime blobs and secret-shaped values
  at rest (inv. 1 / 5): the digest is the identity, the bytes stay in Ring 1.
- Immutability matches content-addressing (a new output is a new digest = a new
  `Artifact`); no lifecycle state the entity never exercises.
- `Artifact` fulfills the pre-reserved `Evidence.subject_kind: 'artifact'` with NO
  `evidenceSubjectKindSchema` change and NO `Evidence.schema_version` bump.

### Rejects

- A storage-location pointer field (Option B) — a Ring-1 runtime detail that can
  move, and a path-sink surface Ring 0 would have to guard.
- An optional small inline value (Option C) — forces Ring 0 to adjudicate
  "small enough to inline" and adds a per-kind value union + an inline surface.
- An `active`/`retired` lifecycle field (Option E) — a content-addressed immutable
  output has no in-place lifecycle; retention is a Ring 1 concern.
- Minting (Option D) — over-couples a fact descriptor to the mint/audit service;
  an output record is a fact, not an audit-chain identity.
- A live-policy/tier field anywhere (an output is a fact, inv. 1).
- Any live-policy, generated-snapshot, system-config, ADR 0053, or Ring 1
  implementation change in this ADR slice.

### Future amendments

- `artifact_kind` enum widening via the registered §Procedure rule as new output
  shapes appear.
- A content-reference / storage-handle field IF a future Ring-1 storage design
  needs the location modeled at the entity layer (deferred; the digest suffices
  at v1).

## Options considered

### Option A: Non-minted digest-addressed immutable descriptor (CHOSEN)

`run_id` + `artifact_kind` + `content_sha256` + `byte_size` + `source_provenance`;
no bytes, no storage pointer, no inline value, no state. **Pros:** charter-aligned
(no blobs / no secret values at rest); uniform across kinds; the digest is the
identity. **Cons:** the bytes/location are not resolvable from Ring 0 alone (by
design — that is Ring 1).

### Option B: Digest + content reference

Adds a `content_ref` storage-handle pointer. **Cons:** models a Ring-1 runtime
location that can move; reintroduces a path-sink surface (cf. ToolProvider/
ToolInstallation path guards).

### Option C: Digest + optional small inline value

Adds an optional bounded inline value for structured kinds (e.g. `exit_code`).
**Cons:** forces Ring 0 to adjudicate inline-vs-reference + a per-kind value union;
an inline surface inv. 5 would rather avoid entirely.

### Option D: Minted typed-identity envelope

Model `Artifact` like AgentClient/Run with an audit-chain hash. **Cons:**
over-couples a fact descriptor to the mint/audit service; an output is a fact, not
an audit-chain-anchored identity.

### Option E: Carry an active/retired state

**Cons:** a content-addressed immutable output has no in-place lifecycle to model;
retirement is a Ring 1 retention/GC concern, not an entity-layer transition.

## Out of scope

This ADR explicitly does not authorize:

- Zod source, generated JSON Schema, tests, or ontology/registry edits (the schema
  PR per `.agents/skills/hcs-schema-change` follows).
- Edits to ADR 0053 (`Run`) or any other ADR; any `evidenceSubjectKindSchema` /
  `Evidence.schema_version` change.
- Live policy, `tiers.yaml`, generated-snapshot, or system-config edits.
- Ring 1 artifact storage / digest-verification / retention code.
- `Lock` / `ResourceBudget` design (separate future ADRs).
- Execution broker, gateway, capability registration, or dashboard behavior.

## Implementation plan (for the schema PR that follows acceptance)

1. Add `packages/schemas/src/entities/artifact.ts`:
   `artifactSchemaVersionSchema = z.literal('0.1.0')`; the `artifact_kind` enum
   (5 values in the §Context order; its `.describe()` carries the inv-1 clause
   "A descriptive FACT that Ring 1 policy READS as input, never a trust verdict or
   policy content the entity carries (inv. 1)", matching the
   `resolution_basis_kind` / `install_surface_kind` precedent); a `byte_size`
   non-negative integer
   (`z.number().int().min(0)`); the `artifactSourceProvenanceSchema` `.strict()`
   sub-object (`authority` literal `artifact_declaration`, `.describe()` mirroring
   the peer non-minted provenance — disjoint, confers no authority,
   sandbox-non-promotion per inv. 8 a Ring 1 obligation "not encoded here"); and
   the `.strict()` `artifactSchema`. Reuse `entityIdSchema` + `isoDateTimeSchema`
   + `sha256DigestSchema` from `common.ts`.
2. Register in `packages/schemas/src/index.ts` (alphabetical export block) and
   `packages/schemas/scripts/generate-json-schemas.ts` (import + `schemaEntries`),
   then regenerate `Artifact.schema.json`.
3. Add `packages/schemas/tests/artifact.test.ts`: a well-formed artifact accepts;
   each `artifact_kind` value accepts and out-of-enum rejects; `content_sha256`
   accepts a valid `sha256:`-prefixed digest and rejects a raw hex / non-prefixed /
   token shape (reusing the `sha256DigestSchema` guarantees); `byte_size` accepts
   `0` and a positive int and rejects a negative / non-integer / string; `.strict()`
   rejects injected mint / value / policy / lifecycle fields by name
   (`audit_chain_link_hash`, `producer`, `evidence_refs`, `tier`,
   `approval_required_for`, `artifact_state`, `content`, `content_ref`, `value`,
   `payload`); `source_provenance` wrong-authority + non-strict reject; the `artifact_id`
   raw-shape accept-and-trap; the generated `required` set is the seven fields
   (no optional fields).
4. Update `docs/host-capability-substrate/ontology.md` (the `### Artifact` entity
   section + version + change log) and
   `docs/host-capability-substrate/ontology-registry.md` (a
   §Current-schema-version-ledger row at `'0.1.0'`, a §Schema-enum-mirrors
   `Artifact` subsection for `artifact_kind` (reproducing the enum in §Context
   order, recording the `unknown` house sentinel + that `artifact_kind` widens via
   the registered §Procedure rule) WITH the descriptor-not-bytes + immutable +
   Evidence-subject-kind-fulfilled notes, a §References row, version + change log).
5. Extend the `scripts/ci/forbidden-string-scan.sh` documentary note to `Artifact`
   (the `artifact_id` accept-and-trap; the entity holds a digest, never bytes/secrets).

## Follow-up regression coverage

| Failure class | Coverage |
|---|---|
| Bytes / secret value smuggled into Ring 0 | Schema has NO content/value field; `content_sha256` is `sha256DigestSchema` (a non-reversible digest, "not reversible secret material"); `.strict()` rejects an injected `content` / `content_ref` field. |
| `artifact_id` raw-identifier shape | Recorded accept-and-trap: `entityIdSchema` accepts a raw shape (a Ring-0 denylist would violate inv. 1); id-opacity is a Ring 1 obligation, backstopped by `forbidden-string-scan`. Schema test asserts the Ring-0 accept. |
| `byte_size` negative / non-integer | `byte_size` is an ACCEPTED field whose VALUE is range-checked (NOT a `.strict()`-rejected key): the schema test asserts `z.number().int().min(0)` rejects negatives / floats / strings and accepts `0`. |
| Injected lifecycle / storage field | `.strict()` rejects an injected `artifact_state` / `content_ref` (the deliberately-omitted Options C/E/B fields) by name. |
| Sandbox-sourced artifact | Ring 1 producer obligation (charter inv. 8); implementation-test obligation when the artifact-storage service lands; no Ring 0 coverage now. |

## Acceptance criteria

- Operator confirms the v1 scope and the non-minted digest-addressed immutable
  descriptor shape (Option A; no storage pointer, no inline value, no state) —
  confirmed 2026-06-08.
- `hcs-architect`, `hcs-ontology-reviewer`, `hcs-policy-reviewer`,
  `hcs-security-reviewer`, and `hcs-eval-reviewer` complete review and all blocking
  findings are absorbed or explicitly rejected by the operator;
  `hcs-security-reviewer` is load-bearing for the no-bytes/no-secret-at-rest posture.
- `Artifact` stays non-minted and carries no live-policy/tier field, no inline
  content, no storage-location pointer, and no lifecycle state.
- The digest is the content identity (`content_sha256` = `sha256DigestSchema`); the
  ADR does NOT modify `evidenceSubjectKindSchema` or bump `Evidence.schema_version`.
- The ADR keeps the schema-change boundary: no Zod source, generated JSON Schema,
  ontology, registry, test, fixture, live-policy, generated-snapshot, system-config,
  or Ring 1 implementation changes in the acceptance slice.
- `just verify` remains green.

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md` v1.4.1 —
  invariant 1 (no live-policy content in Ring 0); invariant 5 (no secret-shaped
  values at rest); invariant 8 (no sandbox promotion to host-authoritative); and
  the no-runtime-state-in-repo rule.
- ADR 0053: `docs/host-capability-substrate/adr/0053-run-ring-0-entity.md` — `Run`,
  the FK target of `run_id` (the run that produced the artifact).
- ADR 0062 / D-060 + ADR 0066 / D-064 + ADR 0068 / D-066 + ADR 0069 / D-067:
  non-minted Ring-0 entity + `source_provenance` precedent (Capability / HostProfile
  / ToolInstallation / ResolvedTool).
- `packages/schemas/src/common.ts` — `sha256DigestSchema` ("not reversible secret
  material"), reused for `content_sha256`.
- `packages/schemas/src/entities/evidence.ts` — the pre-reserved
  `Evidence.subject_kind: 'artifact'` this ADR fulfills without change.
- Ontology: `docs/host-capability-substrate/ontology.md` §Entities (`Artifact`).
- Ontology registry: `docs/host-capability-substrate/ontology-registry.md` —
  `Current schema-version ledger`, `Naming suffix discipline`.
- Schema-change workflow: `.agents/skills/hcs-schema-change/SKILL.md`.

### External

- None directly. Run outputs (diffs, logs, exit codes, signed summaries) are
  produced by a future Ring 1 execution/run service and stored as runtime state.
