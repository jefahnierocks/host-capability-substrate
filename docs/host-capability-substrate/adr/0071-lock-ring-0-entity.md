---
adr_number: 0071
title: Lock Ring-0 entity
status: proposed
version: v2
date: 2026-06-08
charter_version: 1.4.1
tags: [lock, ring-0, non-minted, storage-primitive, coordination, lease-disambiguation]
---

# ADR 0071: Lock Ring-0 entity

## Status

`proposed`

Drafted 2026-06-08 as the next lower-coupling M1 entity (per PLAN.md §Current
Focus order): the second "storage primitive" (`Artifact` landed; `Lock` here;
`ResourceBudget` next). This ADR is design-only. It does not land Zod source,
generated JSON Schema, tests, ontology/registry edits, live policy, generated
snapshots, system-config, or Ring 1 implementation code. The schema PR follows
only after ADR acceptance per `.agents/skills/hcs-schema-change`.

The operator confirmed the entity shape (2026-06-08): a **non-minted coarse-mutex
record** — `lock_id` + a closed `lock_kind` enum + a required `held_by_session_id`
FK + a `lock_status` (`held` | `released`) + `source_provenance`.

ADR 0071 v1 was dispatched to all five reviewers for round 1 on 2026-06-08
(`hcs-ontology-reviewer` load-bearing for the Lock-vs-Lease + `lock_status`-collision
calls). All five returned `yes` with **zero blockers**. The shipped-`lock_state`
collision (so `lock_status` is the right call), the `held_by_session_id` Lease-FK
reuse (same semantic), the non-minted-vs-minted-`Lease` distinction, and the
`Evidence.subject_kind: 'lock'` pre-reservation were all confirmed against source.
v2 folds the mechanical tweaks: §Rejects names the rejected `tier` /
`approval_required_for` pair; the inv-8 non-promotion posture is stated for
`lock_status` as well as `held_by_session_id`; §Context notes the shipped
`lock_state` is also a semantically-DIFFERENT enum
(`unlocked`/`locked`/`held_by_other_session`) — reinforcing, not just same-named;
and the schema-PR plan adds the no-Lease-bypass `.strict()` reject probes (`scope`
+ `force_break_grant_id`), the verbatim disjoint-from-`evidenceAuthoritySchema`
provenance `.describe()` clause, the inline six-required-field enumeration, and the
registry `released`-value-overlap + lower_snake_case mirror notes. Because round 1
returned zero blockers, no confirming round 2 was required
(mechanical-tweaks-at-acceptance, ADR 0058 precedent).

## Date

2026-06-08

## Charter version

Written against implementation charter v1.4.1 and
`docs/host-capability-substrate/ontology-registry.md` v0.4.31. `Lock` is
constrained by charter invariant 1 (no live-policy content in Ring 0 — a lock is
a coordination fact, not a tier) and invariant 8 (the holder/status must be
observed from host-authoritative coordination state, not promoted from a sandbox
observation — a Ring 1 obligation).

## Context

`Lock` is "a coarser mutex (e.g., 'package-manager global')" (ontology §Entities).
It is the second of the lower-coupling "storage primitive" entities
(`Artifact` / `Lock` / `ResourceBudget`).

Two disambiguation points define this entity:

**1. `Lock` (non-minted coarse mutex) vs `Lease` (minted per-resource hold).**
`Lease` (ADR 0052) is a MINTED, audit-chain-committed, time-bounded hold on a
SPECIFIC resource (e.g. a worktree), with `held_by_session_id` /
`held_by_agent_client_id`, a `lease_kind`/`scope`/`valid_until`, and an
envelope-level chain-walk superRefine. `Lock` is the COARSE, non-minted cousin: a
named global/coarse mutex (e.g. the package-manager global lock), a lighter
coordination record absent from the ADR 0057 mint scope (no `audit_chain_link_hash`,
no producer-mint field, no `evidence_refs`). It reuses `Lease`'s `held_by_session_id`
FK NAME for the same semantic (held by a `Session`), which is deliberate
consistency, not a collision.

**2. `lock_status`, NOT `lock_state` (a shipped same-name field).** The lifecycle
field is `lock_status`, NOT the `<entity>_state` form the peers use
(`provider_state` / `installation_state` / `host_state`), because `lock_state` is
ALREADY a shipped field — `GitWorktreeObservation.payload.lock_state`
(`gitWorktreeLockStateSchema` = `unlocked` / `locked` / `held_by_other_session`, a
semantically DIFFERENT git-worktree posture — so this is a same-NAME-different-MEANING
clash, which reinforces the rename). To avoid the same-name collision (the ADR 0067
`provider_kind` lesson), `Lock` names its lifecycle field `lock_status`.

`Evidence.subject_kind: 'lock'` is ALREADY Zod-defined (`evidence.ts`), so this
ADR fulfills a pre-reserved subject kind WITHOUT modifying `evidenceSubjectKindSchema`
or bumping `Evidence.schema_version` (the Artifact / ResolvedTool precedent).

The locked resource is identified by a CLOSED `lock_kind` enum of coarse mutex
classes (the whole point of a "coarse" mutex is that there are few of them),
distinct from `Lease`'s per-resource scope; it widens via the registered
§Procedure rule and carries the `unknown` house sentinel.

## Decision

Choose **Option A**. `Lock` is a non-minted Ring-0 coarse-mutex record with a
closed `lock_kind` enum, a required `held_by_session_id` FK, and a `lock_status`.

### Entity shape (design sketch; exact Zod lands in the schema PR)

```text
Lock (non-minted Ring 0; the coarse-mutex cousin of the minted Lease)
  schema_version      z.literal('0.1.0')
  lock_id             entityIdSchema
  lock_kind           enum: package_manager_global | host_mutation_global | unknown
  held_by_session_id  entityIdSchema            // REQUIRED FK to Session (ADR 0055);
                                                // reuses Lease's FK name (same semantic)
  lock_status         enum: held | released     // NOT lock_state (collides with
                                                // GitWorktreeObservation.payload.lock_state)
  source_provenance   { authority: 'lock_declaration', observed_at }
```

`.strict()` envelope. NO `audit_chain_link_hash`, NO producer-mint field, NO
`evidence_refs`; absent from the ADR 0057 mint scope. Reuses `entityIdSchema` and
`isoDateTimeSchema` (`common.ts`).

### Fields

- `lock_kind` — the CLOSED coarse-mutex class: `package_manager_global` |
  `host_mutation_global` | `unknown` (the `package_manager_global` from the
  ontology one-liner; `host_mutation_global` a plausible host-wide write mutex;
  the `unknown` house sentinel). A descriptive FACT Ring 1 reads, never a verdict
  (inv. 1). Widening via the registered §Procedure rule. Distinct from `Lease`'s
  per-resource scope (a coarse named mutex, not a specific resource).
- `held_by_session_id` — a REQUIRED typed FK to `Session` (ADR 0055): who holds
  the lock. Reuses `Lease.held_by_session_id` (same semantic — held by a session);
  the `_id` (not `_ref`) suffix is correct (required, monomorphic, target exists).
  FK existence is a Ring 1 obligation.
- `lock_status` — `held` | `released`. Named `lock_status`, NOT `lock_state`, to
  avoid the shipped `GitWorktreeObservation.payload.lock_state` same-name
  collision. A `released` lock is a valid historical record, not a policy-denied
  state.
- `source_provenance` — a `.strict()` declaration-site binding (`authority`
  literal `lock_declaration`, disjoint from `evidenceAuthoritySchema` and
  conferring no authority by itself; `observed_at`), mirroring the
  `Artifact` / `ToolInstallation` non-minted provenance pattern.

### What stays in Ring 1 (not this schema)

- Mutual-exclusion ENFORCEMENT (only one `held` `Lock` per `lock_kind` at a time),
  acquire/release transitions, and holder-only release — coordination logic, not a
  Ring-0 shape constraint.
- `held_by_session_id` FK existence; NOT promoting a sandbox-observed holder OR a
  sandbox-observed `lock_status` to a host-authoritative `Lock` (charter inv. 8).
- `lock_id` opacity (see §Consequences accept-and-trap).
- Supersession (a `released` lock retired; a new `held` lock recorded) and any
  acquire timestamp / expiry, if a future amendment adds them.

## Consequences

### Accepts

- HCS gains the coarse-mutex coordination record as a clean non-minted peer; the
  second storage primitive.
- The `Lock` (coarse, non-minted) vs `Lease` (per-resource, minted) distinction is
  explicit; `Lock` reuses `held_by_session_id` for holder consistency.
- `lock_status` avoids the shipped `lock_state` same-name collision.
- `Lock` fulfills the pre-reserved `Evidence.subject_kind: 'lock'` with NO
  `evidenceSubjectKindSchema` change and NO `Evidence.schema_version` bump.

### Rejects

- A free-form `lock_scope` string (Option B) — loses the closed vocabulary a
  coarse mutex wants; risks ad-hoc drift.
- A typed scope DESCRIPTOR (Option C) — overlaps `Lease`'s per-resource scope and
  blurs the Lock-vs-Lease line.
- Holder-only / declaration-only shapes (Options D/E) — the operator chose an
  explicit `held_by_session_id` + `lock_status` coordination record.
- Minting (Option F) — `Lock` is the non-minted coarse cousin of `Lease`; it is
  absent from the ADR 0057 mint scope by design.
- A `lock_state` field (the shipped same-name collision); any live-policy field —
  no `tier`, no `approval_required_for` (a lock is a coordination fact, not a tier;
  inv. 1; the `.strict()` envelope rejects them by name).
- Any live-policy, generated-snapshot, system-config, ADR 0052, or Ring 1
  implementation change in this ADR slice.

### Future amendments

- `lock_kind` enum widening via the registered §Procedure rule as new coarse
  mutexes appear.
- An acquire-timestamp / expiry field IF Ring-1 coordination needs it modeled at
  the entity layer (deferred; `source_provenance.observed_at` suffices at v1).

## Options considered

### Option A: Non-minted, closed lock_kind enum + held_by_session_id + lock_status (CHOSEN)

**Pros:** closed coarse vocabulary; explicit holder + status; consistent with
`Lease`'s holder FK; clean Lock-vs-Lease distinction. **Cons:** the starter
`lock_kind` set is partly speculative beyond `package_manager_global` (mitigated by
§Procedure widening + `unknown`).

### Option B: Free-form lock_scope string

**Cons:** no closed vocabulary the kernel can switch on; ad-hoc scope-name drift.

### Option C: Typed scope descriptor

**Cons:** overlaps `Lease`'s per-resource scope; premature for a coarse mutex.

### Option D: Holder FK only, no status

**Cons:** a reader cannot tell `held` from `released` from the entity alone.

### Option E: Declaration only (no holder/status at Ring 0)

**Cons:** the entity says nothing about who holds the lock now; the operator wanted
the coordination record at the entity layer.

### Option F: Minted typed-identity envelope

**Cons:** `Lock` is deliberately the non-minted coarse cousin of the minted
`Lease`; minting it would erase that distinction and over-couple it to the
mint/audit service.

## Out of scope

This ADR explicitly does not authorize:

- Zod source, generated JSON Schema, tests, or ontology/registry edits (the schema
  PR per `.agents/skills/hcs-schema-change` follows).
- Edits to ADR 0052 (`Lease`), ADR 0055 (`Session`), or any other ADR; any
  `evidenceSubjectKindSchema` / `Evidence.schema_version` change.
- Live policy, `tiers.yaml`, generated-snapshot, or system-config edits.
- Ring 1 lock acquire/release/mutual-exclusion enforcement code.
- `ResourceBudget` design (a separate future ADR).
- Execution broker, gateway, capability registration, or dashboard behavior.

## Implementation plan (for the schema PR that follows acceptance)

1. Add `packages/schemas/src/entities/lock.ts`:
   `lockSchemaVersionSchema = z.literal('0.1.0')`; the `lock_kind` enum (3 values
   in the §Context order; its `.describe()` carries the inv-1 "descriptive FACT,
   never a verdict (inv. 1)" clause + names the `unknown` house sentinel + the
   distinct-from-Lease-scope note) and the `lock_status` enum (`held` | `released`;
   `.describe()` notes the deliberate `lock_status`-not-`lock_state` collision
   avoidance + that `released` is a historical record, not policy-denied); the
   `lockSourceProvenanceSchema` `.strict()` sub-object (`authority` literal
   `lock_declaration`, `.describe()` carrying the verbatim peer clause that the
   authority is DISJOINT from `evidenceAuthoritySchema` and confers no authority by
   itself, with holder + `lock_status` sandbox-non-promotion (inv. 8) a Ring 1
   obligation "not encoded here"); and the `.strict()` `lockSchema` (required
   `held_by_session_id` FK). Reuse
   `entityIdSchema` + `isoDateTimeSchema` from `common.ts`.
2. Register in `packages/schemas/src/index.ts` (alphabetical export block) and
   `packages/schemas/scripts/generate-json-schemas.ts` (import + `schemaEntries`),
   then regenerate `Lock.schema.json`.
3. Add `packages/schemas/tests/lock.test.ts`: a well-formed lock accepts; each
   `lock_kind` / `lock_status` value accepts and out-of-enum rejects; `.strict()`
   rejects injected mint / value / policy fields, the shipped same-name `lock_state`
   field, AND the Lease-only authorization fields by name (`audit_chain_link_hash`,
   `producer`, `evidence_refs`, `tier`, `approval_required_for`, `lock_state`,
   `scope`, `force_break_grant_id` — the last two making "Lock is not a Lease
   bypass" a tested invariant); `source_provenance` wrong-authority + non-strict
   reject; the `lock_id` raw-shape accept-and-trap; the generated `required` set
   equals exactly the six fields (`schema_version`, `lock_id`, `lock_kind`,
   `held_by_session_id`, `lock_status`, `source_provenance`; no optional fields).
4. Update `docs/host-capability-substrate/ontology.md` (the `### Lock` entity
   section + version + change log) and
   `docs/host-capability-substrate/ontology-registry.md` (a
   §Current-schema-version-ledger row at `'0.1.0'`, a §Schema-enum-mirrors `Lock`
   subsection for `lock_kind` / `lock_status` WITH the Lock-vs-Lease + the
   `lock_status`-not-`lock_state` notes, the "all lower_snake_case (NO Sub-rule 9
   grandfather needed)" assertion, and a note that the `released` VALUE overlap with
   `Lease.lease_state` is intentional and harmless (different entity/field, same
   meaning), a §References row, version + change log).
5. Extend the `scripts/ci/forbidden-string-scan.sh` documentary note to `Lock`
   (the `lock_id` accept-and-trap).

## Follow-up regression coverage

| Failure class | Coverage |
|---|---|
| `lock_status` vs shipped `lock_state` same-name collision | Verified at design time: `lock_state` is `GitWorktreeObservation.payload.lock_state`; `Lock` uses `lock_status`. Schema test asserts `.strict()` rejects an injected `lock_state` field on `Lock`. |
| Lock-vs-Lease conflation | `Lock` is non-minted (no `audit_chain_link_hash` / producer / `evidence_refs`; `.strict()` rejects them by name); `lock_kind` is a coarse enum, not a per-resource scope; the registry §Lock note documents the distinction. |
| `lock_id` raw-identifier shape | Recorded accept-and-trap: `entityIdSchema` accepts a raw shape (a Ring-0 denylist would violate inv. 1); id-opacity is a Ring 1 obligation, backstopped by `forbidden-string-scan`. Schema test asserts the Ring-0 accept. |
| Mutual-exclusion enforcement | Ring 1 coordination obligation (one `held` Lock per `lock_kind`); not a Ring-0 shape constraint; no Ring 0 coverage now. |
| Sandbox-sourced holder | Ring 1 producer obligation (charter inv. 8); implementation-test obligation when the coordination service lands; no Ring 0 coverage now. |

## Acceptance criteria

- Operator confirms the v1 scope and the non-minted closed-`lock_kind` +
  `held_by_session_id` + `lock_status` shape (Option A) — confirmed 2026-06-08.
- `hcs-architect`, `hcs-ontology-reviewer`, `hcs-policy-reviewer`,
  `hcs-security-reviewer`, and `hcs-eval-reviewer` complete review and all blocking
  findings are absorbed or explicitly rejected by the operator;
  `hcs-ontology-reviewer` is load-bearing for the Lock-vs-Lease + `lock_status`
  collision-avoidance calls.
- `Lock` stays non-minted and carries no live-policy/tier field; the lifecycle
  field is `lock_status` (not the shipped `lock_state`).
- The ADR does NOT modify `evidenceSubjectKindSchema` or bump
  `Evidence.schema_version`.
- The ADR keeps the schema-change boundary: no Zod source, generated JSON Schema,
  ontology, registry, test, fixture, live-policy, generated-snapshot, system-config,
  or Ring 1 implementation changes in the acceptance slice.
- `just verify` remains green.

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md` v1.4.1 —
  invariant 1 (no live-policy content in Ring 0); invariant 8 (no sandbox promotion
  to host-authoritative).
- ADR 0052: `docs/host-capability-substrate/adr/0052-lease-ring-0-entity.md` —
  `Lease` (the MINTED per-resource hold `Lock` is the non-minted coarse cousin of),
  the `held_by_session_id` FK `Lock` reuses.
- ADR 0055: `docs/host-capability-substrate/adr/0055-session-ring-0-entity.md` —
  `Session`, the `held_by_session_id` FK target.
- `packages/schemas/src/entities/source-control-evidence.ts` —
  `GitWorktreeObservation.payload.lock_state` (`gitWorktreeLockStateSchema`), the
  shipped same-name field `Lock.lock_status` avoids.
- ADR 0066 / D-064 + ADR 0068 / D-066 + ADR 0070 / D-068: non-minted Ring-0 entity
  + `source_provenance` precedent (HostProfile / ToolInstallation / Artifact).
- `packages/schemas/src/entities/evidence.ts` — the pre-reserved
  `Evidence.subject_kind: 'lock'` this ADR fulfills without change.
- Ontology: `docs/host-capability-substrate/ontology.md` §Entities (`Lock`).
- Ontology registry: `docs/host-capability-substrate/ontology-registry.md` —
  `Current schema-version ledger`, `Naming suffix discipline`.
- Schema-change workflow: `.agents/skills/hcs-schema-change/SKILL.md`.

### External

- None directly. Coarse mutexes (the package-manager global lock, a host-mutation
  global lock) are acquired/released by a future Ring 1 coordination service.
