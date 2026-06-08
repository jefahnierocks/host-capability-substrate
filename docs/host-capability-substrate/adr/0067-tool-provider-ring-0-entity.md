---
adr_number: 0067
title: ToolProvider Ring-0 entity
status: proposed
version: v2
date: 2026-06-08
charter_version: 1.4.1
tags: [tool-provider, ring-0, non-minted, tool-resolution, tool-provenance-followup]
---

# ADR 0067: ToolProvider Ring-0 entity

## Status

`proposed`

Drafted 2026-06-08 as the next lower-coupling M1 Ring-0 entity (per PLAN.md
§Current Focus order, after `HostProfile`): the durable "source of tools"
declaration and the head of the tool-resolution chain `ToolProvider →
ToolInstallation → ResolvedTool`. This ADR is design-only. It does not land Zod
source, generated JSON Schema, tests, ontology/registry edits, live policy,
generated snapshots, system-config, or Ring 1 implementation code. The schema PR
follows only after ADR acceptance per `.agents/skills/hcs-schema-change`.

ADR 0067 v1 was dispatched to all five reviewers for round 1 on 2026-06-08. Four
returned `blocker` (architect, ontology, security, eval) and policy returned
ready-for-acceptance — converging on **two** real round-1 blockers, both absorbed
in v2:

- **Field-name collision (ontology).** `provider_kind` is already SHIPPED on
  `PullRequestReceipt.payload.provider_kind` (a VCS-host axis) and RESERVED by
  charter invariant 16 for `Capability.provider_kind` (the external-control-plane
  axis). v1's "distinct axis" proof addressed only the differently-named
  `toolProvenanceInstallSourceKindSchema` and missed the same-NAME collisions. v2
  RENAMES the field to **`manager_kind`** and cross-references all three usages.
- **Wrong `root_path` primitive (architect + security + eval).** v1 reused ADR
  0034's `toolProvenanceCanonicalPathSchema` verbatim, but that is a tool-FILE-path
  validator: its `/usr/local` branch is `\/usr\/local\/.+`, so it REJECTS the bare
  directory `/usr/local` (the real Intel-Homebrew prefix) while accepting
  `/opt/homebrew`, and its `.+` tail does not structurally reject mid-path `..`
  (the "no traversal" claim was an overclaim). v2 replaces it with a NEW
  provider-ROOT primitive **`toolProviderRootPathSchema`** that accepts bare
  provider roots and GENUINELY forbids `..`, documented as a deliberate sibling
  (root-grain vs file-grain), not drift.

v2 also folds the mechanical tweaks (name the no-suffix durable-identity
classification; strengthen the axis-confusion + injected-field tests; cross-ref
the existing tool-provenance path-primitive coverage). Because round 1 carried
blockers, v2 is dispatched for a confirming round 2 before acceptance.

## Date

2026-06-08

## Charter version

Written against implementation charter v1.4.1 and
`docs/host-capability-substrate/ontology-registry.md` v0.4.27. `ToolProvider` is
constrained by charter invariant 1 (no live-policy content in Ring 0 — a tool
source is a fact, not a tier) and invariant 8 (the host-authoritative facts must
not be promoted from sandbox observations — a Ring 1 producer obligation).

## Context

`ontology.md` §Entities lists the tool-resolution chain:

- `ToolProvider` — "a source of tools: mise, brew, system, project-local".
- `ToolInstallation` — "a specific instance of a tool on this host".
- `ResolvedTool` — "the authoritative answer for 'what tool X in this context'".

and the existing direct-Evidence observation:

- `ToolProvenance` (ADR 0034) — tool path / shim-chain / version facts at an
  execution context, carrying `install_source_kind`
  (`homebrew`/`mise`/`asdf`/`npm`/`pip`/`uv`/`system_package_manager`/`manual`/
  `unknown`) and a polymorphic `tool_or_provider_ref`.

`ToolProvider` is the head of the chain: the durable declaration of a tool
SOURCE/manager. It is a structural peer of `Capability` (ADR 0062),
`SecretReference` (ADR 0065), and `HostProfile` (ADR 0066): a NON-MINTED Ring-0
entity with no `audit_chain_link_hash`, no producer-mint field, and no
`evidence_refs`; absent from the ADR 0057 mint scope. It is one of the things the
polymorphic `ToolProvenance.tool_or_provider_ref` can resolve to, and the future
`ToolInstallation` will reference a `ToolProvider`. Per the registry §Naming-suffix
discipline, `ToolProvider` is a no-suffix standalone entity with durable identity
and lifecycle — the same bucket as `HostProfile` / `Capability`.

### `manager_kind`: a distinct field NAME and a distinct AXIS

The field is named **`manager_kind`**, NOT `provider_kind`. `provider_kind` is
already an overloaded field name in HCS: it is SHIPPED on
`PullRequestReceipt.payload.provider_kind` /
`PullRequestAbsenceReceipt.payload.provider_kind` (`= github`; a VCS-host axis,
`pullRequestProviderKindSchema`), and it is RESERVED by charter invariant 16 as
the `Capability.provider_kind != "local"` external-control-plane axis. A third
`provider_kind` with a tool-source meaning would collide with both (and
`Capability` is a named structural peer of `ToolProvider`), so ToolProvider uses
`manager_kind`.

`manager_kind` is also a distinct AXIS from the existing ADR 0034
`toolProvenanceInstallSourceKindSchema`. That enum is an INSTALL-MECHANISM axis:
HOW a specific tool was installed (`npm`/`pip`/`uv`/`asdf`/`manual`/...).
`manager_kind` is a tool-SOURCE/manager axis: WHICH source manages a family of
tools (`mise`/`homebrew`/`system`/`project_local`/`unknown`). They overlap on
`mise`/`homebrew` but are different grains — the install-mechanism enum has no
provider-grain `system` / `project_local`, and `manager_kind` has no
`npm`/`pip`/`uv` (per-tool install mechanisms, not tool sources). `manager_kind`
is therefore a NEW, deliberately distinct enum — NOT a redefinition of, and not
drift from, either `provider_kind` or `install_source_kind`. The schema PR's
registry §Schema-enum-mirrors note must cross-reference all three (`manager_kind`,
the PR-receipt `provider_kind`, and `install_source_kind`).

## Options considered

### Option A: Non-minted profile + new provider-class enum (chosen)

`ToolProvider` is a non-minted facts + provenance profile with a new
provider-grain `manager_kind` enum and an optional provider-root `root_path`.

**Pros:**

- Consistent with the lower-coupling non-minted M1 train (Capability /
  SecretReference / HostProfile).
- Keeps the provider/manager grain distinct from ADR 0034's install-mechanism
  axis; expresses `system` and `project_local` providers; uses `manager_kind` to
  avoid the overloaded `provider_kind` field name.

**Cons:**

- A second tool-source-adjacent enum exists; the §axis disambiguation above and a
  registry note must keep the grains/field-names explicit so a later reader does
  not read them as drift.
- `root_path` needs a provider-ROOT path primitive distinct from ADR 0034's
  tool-FILE-path `toolProvenanceCanonicalPathSchema` (see §`root_path`).

### Option B: Reuse `toolProvenanceInstallSourceKindSchema` for `manager_kind`

**Pros:**

- No new enum.

**Cons:**

- Conflates the provider/manager grain with the install-mechanism grain; cannot
  express a `project_local` or provider-grain `system` source; pulls per-tool
  mechanisms (`npm`/`pip`/`uv`/`asdf`/`manual`) into a "tool source" field where
  they do not belong.

### Option C: Minted typed-identity envelope

Model `ToolProvider` like AgentClient/Principal with an audit-chain hash + a
resolver producer.

**Cons:**

- Over-couples a lower-coupling M1 entity to the mint/audit service (ADR 0057
  scope amendment + a canonical-hash design) before that service exists; a tool
  source is a fact, not an audit-chain-anchored identity.

## Decision

Choose **Option A**. `ToolProvider` is a non-minted Ring-0 entity.

### Entity shape (design sketch; exact Zod lands in the schema PR)

```text
ToolProvider (non-minted Ring 0; structural peer of Capability/HostProfile)
  schema_version     z.literal('0.1.0')
  tool_provider_id   entityIdSchema
  manager_kind       enum: mise | homebrew | system | project_local | unknown
                     (NOT provider_kind — that name is taken; see §axis)
  provider_state     enum: active | retired
  root_path          toolProviderRootPathSchema.optional()  // NEW provider-ROOT primitive
                                                            // (sibling of, NOT a reuse of,
                                                            // ADR 0034's tool-FILE-path schema):
                                                            // accepts bare provider roots
                                                            // (/usr/local, /opt/homebrew,
                                                            // ${HOME}/...); GENUINELY forbids
                                                            // `..`; no URI/secret/whitespace
  source_provenance  { authority: 'tool_provider_declaration', observed_at }
```

`.strict()` envelope. NO `audit_chain_link_hash`, NO producer-mint field, NO
`evidence_refs`; absent from the ADR 0057 mint scope. Reuses `entityIdSchema` and
`isoDateTimeSchema` (`common.ts`). `root_path` uses a NEW `toolProviderRootPathSchema`
— a deliberate SIBLING of ADR 0034's `toolProvenanceCanonicalPathSchema`
(root-directory grain vs tool-file-path grain), NOT a verbatim reuse (see
§`root_path`).

### Fields

- `manager_kind` — the NEW provider-grain enum (see §axis); named `manager_kind`,
  not `provider_kind`, to avoid the shipped / charter-reserved `provider_kind`
  field-name collisions.
- `provider_state` — `active` | `retired`; a materially-changed provider produces
  a NEW `active` record and retires the prior (a Ring 1 supersession obligation);
  `retired` is a valid historical record, not a policy-denied state.
- `source_provenance` — a `.strict()` declaration-site binding (`authority`
  literal `tool_provider_declaration`, disjoint from `evidenceAuthoritySchema`
  and conferring no authority by itself; `observed_at`), mirroring the
  `Capability` / `SecretReference` / `HostProfile` non-minted provenance pattern.

#### `root_path` (a provider-ROOT primitive, not the tool-file-path reuse)

`root_path` is OPTIONAL and uses a NEW `toolProviderRootPathSchema` defined by the
schema PR — a deliberate SIBLING of ADR 0034's `toolProvenanceCanonicalPathSchema`,
NOT a verbatim reuse. ADR 0034's primitive validates a tool FILE path UNDER a
whitelisted root: its `/usr/local` branch is `\/usr\/local\/.+`, which REJECTS the
bare directory `/usr/local` (the real Intel-Homebrew prefix) while accepting
`/opt/homebrew` — wrong for a provider ROOT. It is also a "Canonicalized tool
path" whose `.+` tail does NOT structurally reject mid-path `..` (canonicalization
is assumed upstream), so reusing it cannot honestly back a "no traversal" claim.

`toolProviderRootPathSchema` therefore: (1) accepts canonical provider ROOT
DIRECTORIES — `${HOME}/...` (and the other accepted `${…}` placeholder roots),
`/usr/local`, `/opt/...`, `/Library/Frameworks/...`, and a project-local root —
bare or with a subpath; (2) GENUINELY forbids `..` via a negative lookahead
(`(?!.*\.\.)`, mirroring the ADR 0063 `CommandShape.cwd` no-traversal guard) so
the "no traversal" claim is structurally honest at Ring 0; (3) forbids URI
schemes, whitespace, and secret shapes. `root_path` is optional because `system`
/ `unknown` providers may have no single root. The exact regex lands in the schema
PR; this is documented as a sibling primitive (root-grain vs file-grain), not
primitive drift.

### What stays in Ring 1 (not this schema)

- Observing the provider (installed-runtime, e.g. `mise`/`brew` introspection) and
  NOT promoting a sandbox observation to a host-authoritative ToolProvider
  (charter inv. 8).
- The `ToolProvenance.tool_or_provider_ref → ToolProvider` FK existence (when the
  ref resolves to a provider) and the future `ToolInstallation → ToolProvider` FK.
- ToolProvider supersession (active → retired lifecycle).

## Consequences

### Accepts

- HCS gains the durable tool-source record as a clean non-minted peer; the head
  of `ToolProvider → ToolInstallation → ResolvedTool`.
- The provider/manager grain (`manager_kind`, named to avoid the overloaded
  `provider_kind`) is explicitly distinct from ADR 0034's install-mechanism axis.
- `root_path` uses a provider-ROOT sibling primitive (`toolProviderRootPathSchema`)
  that accepts bare provider roots (incl. `/usr/local`) and GENUINELY forbids
  `..`, distinct from ADR 0034's tool-file-path primitive.

### Rejects

- Reusing the ADR 0034 install-source enum (Option B); minting (Option C).
- A live-policy/tier field anywhere (a tool source is a fact, inv. 1).
- Any live-policy, generated-snapshot, system-config, ADR 0034, or Ring 1
  implementation change in this ADR slice.

### Future amendments

- `manager_kind` enum widening (e.g. `nix`, `devbox`) via the registered
  §Procedure rule as new tool sources appear.
- `ToolInstallation` (next in the chain) references `ToolProvider`; `ResolvedTool`
  follows. Each is its own ADR + schema slice.

## Out of scope

This ADR explicitly does not authorize:

- Zod source, generated JSON Schema, tests, or ontology/registry edits (the
  schema PR per `.agents/skills/hcs-schema-change` follows).
- Edits to ADR 0034 (ToolProvenance) or any other ADR.
- `ToolProvenance` schema shape changes.
- Live policy, `tiers.yaml`, generated-snapshot, or system-config edits.
- Ring 1 tool-resolution / host-state code or provider probing.
- `ToolInstallation` / `ResolvedTool` design (separate future ADRs).
- Execution broker, gateway, capability registration, or dashboard behavior.

## Implementation plan after acceptance

The follow-up schema PR, and only that PR, should:

1. Add `packages/schemas/src/entities/tool-provider.ts`:
   `toolProviderSchemaVersionSchema = z.literal('0.1.0')`; the `manager_kind`
   and `provider_state` enums; a NEW `toolProviderRootPathSchema` provider-ROOT
   primitive (accepts bare/subpath provider roots — `${…}` placeholder roots,
   `/usr/local`, `/opt/...`, `/Library/Frameworks/...`, project-local — with a
   `(?!.*\.\.)` no-traversal lookahead, no URI/whitespace/secret shape); the
   `toolProviderSourceProvenanceSchema` `.strict()` sub-object (`authority`
   literal `tool_provider_declaration`); and the `.strict()` `toolProviderSchema`.
   Reuse `entityIdSchema` + `isoDateTimeSchema` from `common.ts`. Do NOT reuse
   `toolProvenanceCanonicalPathSchema` for `root_path` (it is a tool-file-path
   validator that rejects the bare `/usr/local` root and does not structurally
   reject `..`); `toolProviderRootPathSchema` is a documented sibling.
2. Register in `packages/schemas/scripts/generate-json-schemas.ts` and
   `packages/schemas/src/index.ts`; regenerate `ToolProvider.schema.json`.
3. Add `packages/schemas/tests/tool-provider.test.ts`: a well-formed provider
   accepts; each `manager_kind` / `provider_state` value accepts and out-of-enum
   rejects; `provider_state: 'retired'` accepts; `root_path` ACCEPTS the bare
   `/usr/local` root, `/opt/homebrew`, and a `${HOME}/...` placeholder root,
   REJECTS a `..` traversal (e.g. `/opt/../etc`), a URI / `op://` scheme, and a
   whitespace/secret shape, and is omittable; `.strict()` rejects injected mint /
   value / policy fields AND the colliding/adjacent field names by name
   (`audit_chain_link_hash`, `producer`, `evidence_refs`, `tier`,
   `approval_required_for`, `provider_kind`, `install_source_kind`);
   `source_provenance` wrong-authority + non-strict reject.
4. Update `docs/host-capability-substrate/ontology.md` (the entity section +
   version + change log) and `docs/host-capability-substrate/ontology-registry.md`
   (a §Current-schema-version-ledger row at `'0.1.0'`, a §Schema-enum-mirrors
   `ToolProvider` subsection for `manager_kind` / `provider_state` whose note
   cross-references all three field names — `manager_kind` (this entity), the
   shipped `PullRequestReceipt.provider_kind`, and ADR 0034 `install_source_kind`
   — and states the provider-grain-vs-install-mechanism axis distinction, a
   §References row, version + change log).
5. Do not edit live policy, generated snapshots, system-config, Ring 1 code, or
   ADR 0034 in the schema PR unless separately authorized.

## Follow-up regression coverage

This ADR seeds no synthetic regression traps. It records schema-test obligations.

| Failure class | Coverage posture |
|---|---|
| New non-minted entity introduction | Schema tests in the follow-up schema PR; no regression trap unless an observed agent/implementation failure with cited fixture evidence appears. |
| `manager_kind` field-name / axis confusion | Schema tests assert `.strict()` rejects an injected `provider_kind` AND `install_source_kind` field on ToolProvider and that `manager_kind` accepts only the provider-grain values; the registry §axis note cross-references all three field names. |
| `root_path` traversal / URI / secret shape | Schema tests assert `toolProviderRootPathSchema` ACCEPTS bare provider roots (incl. `/usr/local`) and REJECTS `..` (negative lookahead) / URI / whitespace; the existing `tool-provenance` suite covers the ADR 0034 file-path primitive separately. |
| Sandbox-sourced provider facts | Ring 1 producer obligation (charter inv. 8); implementation-test obligation when the tool-resolution service lands; no Ring 0 coverage now. |

## Acceptance criteria

- Operator confirms the v1 scope and the non-minted profile + new provider-class
  enum (Option A).
- `hcs-architect`, `hcs-ontology-reviewer`, `hcs-policy-reviewer`,
  `hcs-security-reviewer`, and `hcs-eval-reviewer` complete review and all
  blocking findings are absorbed or explicitly rejected by the operator;
  `hcs-ontology-reviewer` is load-bearing for the field-name + distinct-axis call.
- `ToolProvider` stays non-minted and carries no live-policy/tier field.
- The tool-source field is named `manager_kind` (not the overloaded
  `provider_kind`) and is a distinct axis from ADR 0034 `install_source_kind`; it
  collides with neither the shipped `PullRequestReceipt.provider_kind` nor the
  charter-inv-16-reserved `Capability.provider_kind`.
- `root_path` uses the provider-ROOT `toolProviderRootPathSchema` (accepts the
  bare `/usr/local` root, genuinely forbids `..`), not a verbatim reuse of the
  ADR 0034 tool-file-path primitive.
- The ADR keeps the schema-change boundary: no Zod source, generated JSON Schema,
  ontology, registry, test, fixture, live-policy, generated-snapshot,
  system-config, or Ring 1 implementation changes in the acceptance slice.
- `just verify` remains green.

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md` v1.4.1 —
  invariant 1 (no live-policy content in Ring 0); invariant 8 (no sandbox
  promotion to host-authoritative); invariant 16 reserves
  `Capability.provider_kind` for the external-control-plane axis (the
  charter-RESERVED, not-yet-shipped one of the two `provider_kind` field names
  this entity's `manager_kind` avoids — the other, `PullRequestReceipt.payload.provider_kind`,
  is shipped).
- ADR 0034:
  `docs/host-capability-substrate/adr/0034-q-007-b-f-boundary-evidence-composition-quality-gate-posture.md`
  — `ToolProvenance` (Phase 2.3.1), its `install_source_kind` (install-mechanism
  axis — a distinct axis from `manager_kind`), the polymorphic
  `tool_or_provider_ref`, and `toolProvenanceCanonicalPathSchema` (the
  tool-file-path primitive `root_path` deliberately does NOT reuse).
- `packages/schemas/src/entities/source-control-evidence.ts` —
  `pullRequestProviderKindSchema` / `PullRequestReceipt.payload.provider_kind`
  (the shipped VCS-host `provider_kind` field name `manager_kind` avoids).
- ADR 0062 / D-060 + ADR 0065 / D-063 + ADR 0066 / D-064: non-minted Ring-0
  entity + `source_provenance` precedent (Capability / SecretReference /
  HostProfile).
- Ontology: `docs/host-capability-substrate/ontology.md` §Entities
  (`ToolProvider` / `ToolInstallation` / `ResolvedTool` / `ToolProvenance`).
- Ontology registry:
  `docs/host-capability-substrate/ontology-registry.md` —
  `Current schema-version ledger`, `Naming suffix discipline`.
- Schema-change workflow: `.agents/skills/hcs-schema-change/SKILL.md`.

### External

- None directly. `mise`, `homebrew`, and a project-local toolchain are named as
  provider classes observed by a future Ring 1 tool-resolution producer.
