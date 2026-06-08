---
adr_number: 0068
title: ToolInstallation Ring-0 entity
status: proposed
version: v2
date: 2026-06-08
charter_version: 1.4.1
tags: [tool-installation, ring-0, non-minted, tool-resolution, tool-provider-followup, authority-surface]
---

# ADR 0068: ToolInstallation Ring-0 entity

## Status

`proposed`

Drafted 2026-06-08 as the next entity in the tool-resolution chain (per PLAN.md
§Current Focus order, after `ToolProvider`): the durable per-install record — the
MIDDLE of `ToolProvider → ToolInstallation → ResolvedTool`. This ADR is
design-only. It does not land Zod source, generated JSON Schema, tests,
ontology/registry edits, live policy, generated snapshots, system-config, or
Ring 1 implementation code. The schema PR follows only after ADR acceptance per
`.agents/skills/hcs-schema-change`.

The operator confirmed the entity shape (2026-06-08): a **self-contained
non-minted record carrying an explicit authority-surface axis** (`tool_provider_id`
FK + `tool_name` + `version` + `install_path` + a NEW `install_surface_kind`
enum + `installation_state` + `source_provenance`), with `ToolProvenance` (ADR
0034) remaining the separate, richer Evidence observation.

ADR 0068 v1 was dispatched to all five reviewers for round 1 on 2026-06-08
(`hcs-ontology-reviewer` load-bearing for the three-axis disambiguation). All
five returned `yes` or `yes_with_mechanical_tweaks` with **zero blockers**:
architect, ontology, policy, and eval returned `yes`; security returned
`yes_with_mechanical_tweaks`. The three-axis distinctness (`manager_kind` /
`install_source_kind` / `install_surface_kind`), the `install_path` reuse
correctness (the genuine inverse of ADR 0067's bare-root case), and the
`Evidence.subject_kind: 'tool_installation'` pre-reservation were all confirmed
against source. v2 folds every mechanical tweak: it pins `version` to the shipped
`hostProfileOsVersionSchema` charset precedent and carries the three-axis contrast
into the `install_surface_kind` `.describe()` + the enum-order-verbatim registry
mirror + named accept cases per new primitive (schema-PR rigor); adds a §Fields
clarification that `install_surface_kind` is a descriptive authority-surface FACT
(a read-only Ring 1 policy INPUT, never policy content, inv. 1); and states in
§Follow-up that `install_path` inherits `ToolProvenance`'s exact canonicalization
posture (no stronger claim). Because round 1 returned zero blockers, no confirming
round 2 was required (mechanical-tweaks-at-acceptance, ADR 0058 precedent).

## Date

2026-06-08

## Charter version

Written against implementation charter v1.4.1 and
`docs/host-capability-substrate/ontology-registry.md` v0.4.28. `ToolInstallation`
is constrained by charter invariant 1 (no live-policy content in Ring 0 — an
installed tool is a fact, not a tier) and invariant 8 (the host-authoritative
facts must be observed, never promoted from a sandbox observation — a Ring 1
producer obligation, not encoded here).

## Context

`ToolProvider` (ADR 0067 / D-065) landed the head of the tool-resolution chain —
the durable "source of tools" record. `ToolInstallation` is the next link: **a
specific instance of a tool on this host** (ontology §Entities), e.g. `node`
`24.3.0` installed by a `mise` provider at
`${HOME}/.local/share/mise/installs/node/24.3.0/bin/node`. `ResolvedTool` (a
later ADR) is the authoritative answer to "what tool X resolves to in this
context"; it will reference `ToolInstallation`.

Two disambiguation problems define this entity's design (mirroring the way ADR
0067's core work was disambiguating `manager_kind` from its namesakes):

**1. `ToolInstallation` (durable record) vs `ToolProvenance` (Evidence
observation, ADR 0034).** `ToolProvenance` is a direct `Evidence` subtype for
"tool path/shim/version facts" — an OBSERVATION (with `install_source_kind`,
shim-chain hops, version-drift, `provider_observed_via`, and a polymorphic
`tool_or_provider_ref`). `ToolInstallation` is the durable RECORD that an install
exists. They are complementary, not redundant: the record is the stable subject;
the provenance Evidence corroborates it. `Evidence.subject_kind: 'tool_installation'`
is ALREADY Zod-defined (`evidence.ts`), so this ADR fulfills a pre-reserved
subject kind WITHOUT modifying `evidenceSubjectKindSchema` or bumping
`Evidence.schema_version` (the Principal / HostProfile precedent).

**2. Three distinct tool axes.** The research (`research/local/2026-05-01-agentic-tool-isolation-synthesis.md`,
`research/external/README.md`) is explicit that app-managed dependency bundles,
devcontainer images, cloud base images, setup-script-installed tools,
Homebrew/mise shims, and PATH tools are **different authority surfaces**, and
that a resolved tool "should point to the surface that resolved it, not just a
binary name." That surface distinction is a THIRD axis, distinct from the two
already in the schema set:

| Axis | Field | Entity | Question it answers | Values |
|---|---|---|---|---|
| Source / manager | `manager_kind` | `ToolProvider` (ADR 0067) | WHICH source manages a family of tools | `mise` `homebrew` `system` `project_local` `unknown` |
| Install mechanism | `install_source_kind` | `ToolProvenance` (ADR 0034) | HOW a tool was installed | `homebrew` `mise` `asdf` `npm` `pip` `uv` `system_package_manager` `manual` `unknown` |
| Authority surface | `install_surface_kind` | `ToolInstallation` (THIS ADR) | WHERE/HOW the install is exposed as an authority surface | `host_path` `manager_shim` `app_bundled` `devcontainer` `cloud_image` `setup_script` `unknown` |

Worked example — `node` `24.3.0` managed by `mise`: the `ToolProvider` has
`manager_kind: mise`; a `ToolProvenance` Evidence record has
`install_source_kind: mise` plus the shim chain; the `ToolInstallation` has
`install_surface_kind: manager_shim` (a `mise` shim on PATH). Contrast the
Codex-app-bundled Node (Workspace Dependencies): same `tool_name`, but
`install_surface_kind: app_bundled` — a different authority surface that is NOT
host PATH truth (the research's central point).

## Decision

Choose **Option A**. `ToolInstallation` is a non-minted Ring-0 entity that is a
self-contained durable record carrying the authority-surface axis.

### Entity shape (design sketch; exact Zod lands in the schema PR)

```text
ToolInstallation (non-minted Ring 0; structural peer of ToolProvider/HostProfile)
  schema_version       z.literal('0.1.0')
  tool_installation_id entityIdSchema
  tool_provider_id     entityIdSchema            // REQUIRED FK to ToolProvider (ADR 0067)
  tool_name            toolInstallationToolNameSchema   // bounded name; no path/URI/secret shape
  version              toolInstallationVersionSchema    // bounded version-shaped string
  install_surface_kind enum: host_path | manager_shim | app_bundled |
                             devcontainer | cloud_image | setup_script | unknown
  install_path         toolProvenanceCanonicalPathSchema.optional()  // REUSE of ADR 0034's
                                                            // tool-FILE-path primitive (correct here:
                                                            // an install path IS a tool file path)
  installation_state   enum: active | retired
  source_provenance    { authority: 'tool_installation_declaration', observed_at }
```

`.strict()` envelope. NO `audit_chain_link_hash`, NO producer-mint field, NO
`evidence_refs`; absent from the ADR 0057 mint scope. Reuses `entityIdSchema` and
`isoDateTimeSchema` (`common.ts`) and `toolProvenanceCanonicalPathSchema`
(`tool-provenance.ts`, ADR 0034) for `install_path`.

### Fields

- `tool_provider_id` — a REQUIRED typed FK to `ToolProvider` (ADR 0067). Every
  install comes from some provider; a `system` / `manual` install is recorded
  against a `ToolProvider` whose `manager_kind` is `system` / `unknown`. FK
  existence is a Ring 1 obligation (Ring 0 only types the reference).
- `tool_name` — a bounded tool identifier (e.g. `node`, `python3`, `ripgrep`),
  no path / URI / secret shape. The exact grammar lands in the schema PR.
- `version` — a bounded version-shaped string (e.g. `24.3.0`, `v18.16.0`,
  `1.2.3-beta.1`, `3.12`). A version FACT, not an identity or a sink: no
  whitespace / path / URI / secret shape; bounded length. The exact regex lands
  in the schema PR.
- `install_surface_kind` — the NEW authority-surface enum (see §Context axis
  table): `host_path` | `manager_shim` | `app_bundled` | `devcontainer` |
  `cloud_image` | `setup_script` | `unknown`. Distinct in NAME from the shipped
  connection-`surface` fields (`AgentClient.surface`, `ExecutionContext.surface`,
  `surface_id`, `owning_surface`) and from `credential…authority_surface_kind`;
  distinct in AXIS from `ToolProvider.manager_kind` and ADR 0034
  `ToolProvenance.install_source_kind`. The surface value is a descriptive FACT
  that Ring 1 policy READS as input (e.g. `app_bundled` is not host-PATH truth) —
  never a trust verdict or policy content the entity carries (inv. 1). Widening
  (e.g. `nix_profile`) via the registered §Procedure rule.
- `installation_state` — `active` | `retired`; a materially-changed install
  produces a NEW `active` record and retires the prior (a Ring 1 supersession
  obligation); `retired` is a valid historical record, not a policy-denied state.
  Mirrors `ToolProvider.provider_state` / `HostProfile.host_state`.
- `source_provenance` — a `.strict()` declaration-site binding (`authority`
  literal `tool_installation_declaration`, disjoint from `evidenceAuthoritySchema`
  and conferring no authority by itself; `observed_at`), mirroring the
  `ToolProvider` / `HostProfile` / `Capability` / `SecretReference` non-minted
  provenance pattern.

#### `install_path` reuses the ADR 0034 tool-file-path primitive (correct here)

`install_path` is OPTIONAL and REUSES ADR 0034's `toolProvenanceCanonicalPathSchema`.
This is a genuine, correct reuse — NOT the mistake ADR 0067 §`root_path` avoided.
ADR 0067 needed a provider ROOT directory (bare `/usr/local`), for which the
tool-FILE-path primitive was wrong (it requires a subpath and rejects the bare
root), so ADR 0067 defined a sibling. Here the grain is the OPPOSITE: an install
path is a concrete tool FILE under a whitelisted root (e.g.
`${HOME}/.local/share/mise/installs/node/24.3.0/bin/node`), which is EXACTLY what
`toolProvenanceCanonicalPathSchema` validates. The primitive's `.+` tail does not
structurally reject mid-path `..` (canonicalization is assumed upstream); that is
the SAME Ring-1-canonicalization posture `ToolProvenance` itself carries for its
own paths, so reuse keeps `ToolInstallation` and `ToolProvenance` paths
consistent rather than introducing a second path grammar. `install_path` is
OPTIONAL because `app_bundled` / `cloud_image` surfaces may have no canonical
host file path at Ring 0.

### What stays in Ring 1 (not this schema)

- Observing the install (installed-runtime, e.g. `mise ls` / `brew list` /
  shim introspection) and NOT promoting a sandbox observation to a
  host-authoritative `ToolInstallation` (charter inv. 8).
- FK existence: `tool_provider_id → ToolProvider` and the future
  `ResolvedTool → ToolInstallation` reference.
- `tool_installation_id` opacity (see §Consequences accept-and-trap).
- `install_path` deep canonicalization (`..` resolution) and the
  surface-vs-PATH-truth reconciliation the research describes.
- `ToolInstallation` supersession (active → retired lifecycle).

## Consequences

### Accepts

- HCS gains the durable per-install record as a clean non-minted peer; the middle
  of `ToolProvider → ToolInstallation → ResolvedTool`.
- The authority-surface grain (`install_surface_kind`) is captured explicitly and
  is distinct in name and axis from `ToolProvider.manager_kind`, ADR 0034
  `ToolProvenance.install_source_kind`, and the connection-`surface` fields.
- `install_path` reuses the ADR 0034 tool-file-path primitive (the correct grain
  for a tool file), keeping install paths consistent with `ToolProvenance`.
- `ToolInstallation` fulfills the pre-reserved `Evidence.subject_kind:
  'tool_installation'` with NO `evidenceSubjectKindSchema` change and NO
  `Evidence.schema_version` bump.

### Rejects

- A thin identity record that offloads path/surface to a `tool_provenance_ref`
  (Option B) — splits one install's facts across two records and couples Ring-0
  `ToolInstallation` to an Evidence FK.
- Dropping `install_surface_kind` (Option C) — loses the app-bundled / devcontainer
  / cloud-image authority-surface distinction the research repeatedly demands.
- Minting (Option D) — over-couples a lower-coupling fact entity to the
  mint/audit service; an installed tool is a fact, not an audit-chain identity.
- A live-policy/tier field anywhere (an installed tool is a fact, inv. 1).
- Any live-policy, generated-snapshot, system-config, ADR 0034, or Ring 1
  implementation change in this ADR slice.

### Future amendments

- `install_surface_kind` enum widening (e.g. `nix_profile`) via the registered
  §Procedure rule as new surfaces appear.
- `ResolvedTool` (last in the chain) references `ToolInstallation`; its own ADR +
  schema slice.

## Options considered

### Option A: Self-contained non-minted record + authority-surface enum (CHOSEN)

The durable record stands alone with `install_surface_kind`; `ToolProvenance`
remains the separate richer Evidence observation. **Pros:** matches the
self-contained non-minted peer pattern (`ToolProvider` / `HostProfile`); captures
the research-mandated surface distinction at the entity layer; one record per
install. **Cons:** `install_path` / `version` overlap with what a `ToolProvenance`
Evidence record may also observe (acceptable — record vs observation are
different roles).

### Option B: Thin identity + `tool_provenance_ref`

`ToolInstallation` carries only identity + a typed FK to `ToolProvenance` for
path/surface facts. **Cons:** splits a single install's facts across two records;
couples Ring-0 `ToolInstallation` to an Evidence FK; the non-minted peers are all
self-contained.

### Option C: Self-contained, no surface enum

Like A but derive the surface from the provider's `manager_kind`. **Cons:**
`manager_kind` (source) cannot express `app_bundled` / `devcontainer` /
`cloud_image` — exactly the surfaces the research says must be distinguished.

### Option D: Minted typed-identity envelope

Model `ToolInstallation` like AgentClient/Principal with an audit-chain hash.
**Cons:** over-couples a lower-coupling fact entity to the mint/audit service
(ADR 0057 scope amendment + canonical-hash design) before it exists; an installed
tool is a fact, not an audit-chain-anchored identity.

## Out of scope

This ADR explicitly does not authorize:

- Zod source, generated JSON Schema, tests, or ontology/registry edits (the
  schema PR per `.agents/skills/hcs-schema-change` follows).
- Edits to ADR 0034 (`ToolProvenance`), ADR 0067 (`ToolProvider`), or any other
  ADR; any `evidenceSubjectKindSchema` or `Evidence.schema_version` change.
- Live policy, `tiers.yaml`, generated-snapshot, or system-config edits.
- Ring 1 tool-resolution / host-state code or install probing.
- `ResolvedTool` design (a separate future ADR).
- Execution broker, gateway, capability registration, or dashboard behavior.

## Implementation plan (for the schema PR that follows acceptance)

1. Add `packages/schemas/src/entities/tool-installation.ts`:
   `toolInstallationSchemaVersionSchema = z.literal('0.1.0')`; the
   `install_surface_kind` (7 values in the §Context-table order:
   `host_path` / `manager_shim` / `app_bundled` / `devcontainer` / `cloud_image` /
   `setup_script` / `unknown`) and `installation_state` enums — the
   `install_surface_kind` `.describe()` MUST name all three axes (source
   `manager_kind` / mechanism `install_source_kind` / authority-surface
   `install_surface_kind`), mirroring how `tool-provider.ts` spells out its axis
   contrast inline; a `toolInstallationToolNameSchema` (bounded name, no
   path/URI/secret shape) and a `toolInstallationVersionSchema` — both pinned to
   the shipped `hostProfileOsVersionSchema` precedent
   (`z.string().min(1).max(64).regex(/^[A-Za-z0-9._+-]+$/)`, which bars whitespace
   / `/` / `:` so no `://` / `op://`; the version examples `24.3.0` / `v18.16.0` /
   `1.2.3-beta.1` / `3.12` and tool names `node` / `python3` / `ripgrep` all
   satisfy that charset); the `toolInstallationSourceProvenanceSchema` `.strict()`
   sub-object (`authority` literal `tool_installation_declaration`, its
   `.describe()` mirroring `host-profile.ts` — disjoint from `evidenceAuthoritySchema`,
   confers no authority by itself, installed-runtime + non-sandbox sourcing per
   inv. 8 is a Ring 1 obligation "not encoded here"); and the `.strict()`
   `toolInstallationSchema`. Reuse `entityIdSchema` + `isoDateTimeSchema` from
   `common.ts` and `toolProvenanceCanonicalPathSchema` from `tool-provenance.ts`
   for the OPTIONAL `install_path` (a tool FILE path — the correct grain).
2. Register in `packages/schemas/src/index.ts` (alphabetical export block) and
   `packages/schemas/scripts/generate-json-schemas.ts` (import + `schemaEntries`),
   then regenerate `ToolInstallation.schema.json`.
3. Add `packages/schemas/tests/tool-installation.test.ts`: a well-formed install
   accepts; each `install_surface_kind` / `installation_state` value accepts and
   out-of-enum rejects; `installation_state: 'retired'` accepts; `install_path`
   accepts a canonical tool-file path and rejects a URI / whitespace / non-rooted
   shape and is omittable; `version` and `tool_name` pin BOTH directions —
   named accept cases (`version` accepts `24.3.0` / `v18.16.0` / `1.2.3-beta.1` /
   `3.12`; `tool_name` accepts `node` / `python3` / `ripgrep`) AND reject
   whitespace / URI / path / secret shapes (mirroring how `tool-provider.test.ts`
   pins both the accept and reject sets for `root_path`); `.strict()` rejects
   injected
   mint / value / policy fields AND the adjacent axis field-names by name
   (`audit_chain_link_hash`, `producer`, `evidence_refs`, `tier`,
   `approval_required_for`, `manager_kind`, `install_source_kind`,
   `install_surface_kind` is the real field so it is NOT in the reject list);
   `source_provenance` wrong-authority + non-strict reject; the
   `tool_installation_id` raw-shape accept-and-trap.
4. Update `docs/host-capability-substrate/ontology.md` (the `### ToolInstallation`
   entity section + version + change log) and
   `docs/host-capability-substrate/ontology-registry.md` (a
   §Current-schema-version-ledger row at `'0.1.0'`, a §Schema-enum-mirrors
   `ToolInstallation` subsection for `install_surface_kind` / `installation_state`
   (reproducing the `install_surface_kind` enum in the EXACT §Context-table order,
   since the registry mirror keeps enum order load-bearing) WITH the three-axis
   disambiguation note — `manager_kind` vs `install_source_kind` vs
   `install_surface_kind`, a §References row, version + change log).
5. Extend the `scripts/ci/forbidden-string-scan.sh` documentary note to
   `ToolInstallation` (the `tool_installation_id` accept-and-trap; `install_path`
   reuses the ToolProvenance primitive's committed-fixture backstop).

## Follow-up regression coverage

| Failure class | Coverage |
|---|---|
| Authority-surface axis vs source/mechanism confusion | Schema tests assert `.strict()` rejects an injected `manager_kind` AND `install_source_kind` on ToolInstallation and that `install_surface_kind` accepts only the surface-grain values; the registry §axis note documents the three-way distinction. |
| `install_surface_kind` field-name collision | Verified at design time: no shipped `install_surface_kind` / `surface_kind` field; distinct from `surface` / `surface_id` / `owning_surface` / `authority_surface_kind`. |
| `version` / `tool_name` as a smuggled path/URI/secret | Both pinned to the shipped `hostProfileOsVersionSchema` charset precedent (`/^[A-Za-z0-9._+-]+$/`, max 64 — no whitespace / `/` / `:`); schema tests assert named accept cases AND whitespace / URI / path / secret rejects. |
| `install_path` traversal / URI shape | Reuses the ADR 0034 tool-file-path primitive, inheriting `ToolProvenance`'s EXACT canonicalization posture — it structurally rejects URI/whitespace (requires an anchored root) but its `.+` tail does not reject a mid-path `..`, so `install_path` makes no stronger claim than `ToolProvenance` does for its own paths; deep `..` resolution is a Ring-1 obligation, and the `tool-provenance` suite covers the `..`-tail / URI cases separately. |
| `tool_installation_id` raw-identifier shape | Recorded accept-and-trap: `entityIdSchema` accepts a raw shape (a Ring-0 denylist would violate inv. 1); id-opacity is a Ring 1 obligation, backstopped by `forbidden-string-scan`. Schema test asserts the Ring-0 accept. |
| Sandbox-sourced install facts | Ring 1 producer obligation (charter inv. 8); implementation-test obligation when the tool-resolution service lands; no Ring 0 coverage now. |

## Acceptance criteria

- Operator confirms the v1 scope and the self-contained-non-minted + surface-enum
  shape (Option A) — confirmed 2026-06-08.
- `hcs-architect`, `hcs-ontology-reviewer`, `hcs-policy-reviewer`,
  `hcs-security-reviewer`, and `hcs-eval-reviewer` complete review and all
  blocking findings are absorbed or explicitly rejected by the operator;
  `hcs-ontology-reviewer` is load-bearing for the three-axis disambiguation.
- `ToolInstallation` stays non-minted and carries no live-policy/tier field.
- `install_surface_kind` is a distinct authority-surface axis (not a redefinition
  of `manager_kind` or `install_source_kind`) and a clear field name.
- `install_path` reuses `toolProvenanceCanonicalPathSchema` (the correct
  tool-file-path grain), and the ADR does NOT modify `evidenceSubjectKindSchema`
  or bump `Evidence.schema_version`.
- The ADR keeps the schema-change boundary: no Zod source, generated JSON Schema,
  ontology, registry, test, fixture, live-policy, generated-snapshot,
  system-config, or Ring 1 implementation changes in the acceptance slice.
- `just verify` remains green.

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md` v1.4.1 —
  invariant 1 (no live-policy content in Ring 0); invariant 8 (no sandbox
  promotion to host-authoritative).
- ADR 0067 / D-065: `docs/host-capability-substrate/adr/0067-tool-provider-ring-0-entity.md`
  — `ToolProvider` (chain head), the `manager_kind` source axis, and the
  `root_path` sibling-primitive precedent this ADR's `install_path` reuse
  deliberately contrasts with.
- ADR 0034:
  `docs/host-capability-substrate/adr/0034-q-007-b-f-boundary-evidence-composition-quality-gate-posture.md`
  — `ToolProvenance` (Evidence observation), its `install_source_kind`
  install-mechanism axis, and `toolProvenanceCanonicalPathSchema` (reused here for
  `install_path`).
- ADR 0062 / D-060 + ADR 0065 / D-063 + ADR 0066 / D-064: non-minted Ring-0
  entity + `source_provenance` precedent (Capability / SecretReference /
  HostProfile).
- `packages/schemas/src/entities/evidence.ts` — the pre-reserved
  `Evidence.subject_kind: 'tool_installation'` this ADR fulfills without change.
- Ontology: `docs/host-capability-substrate/ontology.md` §Entities
  (`ToolProvider` / `ToolInstallation` / `ResolvedTool` / `ToolProvenance`).
- Ontology registry:
  `docs/host-capability-substrate/ontology-registry.md` —
  `Current schema-version ledger`, `Naming suffix discipline`.
- Schema-change workflow: `.agents/skills/hcs-schema-change/SKILL.md`.

### External

- `research/local/2026-05-01-agentic-tool-isolation-synthesis.md` §`ToolInstallation`
  / `ResolvedTool` — app-managed bundles, devcontainer images, cloud base images,
  setup-script tools, Homebrew/mise shims, and PATH tools as DIFFERENT authority
  surfaces (the basis for `install_surface_kind`).
