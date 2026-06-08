---
adr_number: 0069
title: ResolvedTool Ring-0 entity
status: accepted
version: v2
date: 2026-06-08
charter_version: 1.4.1
tags: [resolved-tool, ring-0, non-minted, tool-resolution, tool-installation-followup, resolution-basis]
---

# ADR 0069: ResolvedTool Ring-0 entity

## Status

`accepted`

Drafted 2026-06-08 as the LAST entity in the tool-resolution chain (per PLAN.md
§Current Focus order, after `ToolInstallation`): the authoritative resolution
RESULT — the tail of `ToolProvider → ToolInstallation → ResolvedTool`. This ADR
is design-only. It does not land Zod source, generated JSON Schema, tests,
ontology/registry edits, live policy, generated snapshots, system-config, or
Ring 1 implementation code. The schema PR follows only after ADR acceptance per
`.agents/skills/hcs-schema-change`.

The operator confirmed the entity shape (2026-06-08): a **non-minted record
anchored on the resolving ExecutionContext (+ optional WorkspaceContext) and
carrying a resolution-basis axis** — `tool_name` (the query) + a required
`tool_installation_id` FK (the winning install) + a required `execution_context_id`
FK + an optional `workspace_id` FK + a NEW `resolution_basis_kind` enum +
`resolution_state` + `source_provenance`.

ADR 0069 v1 was dispatched to all five reviewers for round 1 on 2026-06-08
(`hcs-ontology-reviewer` load-bearing for the four-axis disambiguation). All five
returned `yes` or `yes_with_mechanical_tweaks` with **zero blockers**: architect,
policy, and security returned `yes`; ontology and eval returned
`yes_with_mechanical_tweaks`. The four-axis distinctness, the context-binding
choice, the three FK targets, and the `Evidence.subject_kind: 'resolved_tool'`
pre-reservation were all confirmed against source. The load-bearing tweak (raised
by four lenses): the basis enum and `install_surface_kind` share the universal
`unknown` house sentinel (present on all four axis enums), so the "value-disjoint"
claim is carved to "disjoint on the SUBSTANTIVE values," and the disjointness test
must reject surface-ONLY values (`manager_shim` / `app_bundled` / `host_path` /
`devcontainer` / `cloud_image` / `setup_script`) and must NOT assert `unknown` is
rejected (it is a valid basis value). v2 folds that carve-out plus the remaining
tweaks (both-direction enum test pinning; the inv-1 "descriptive FACT, not a trust
verdict" `.describe()` wording; the registry `unknown`-sentinel note; a §Follow-up
note that `workspace_pin`-carries-`workspace_id` vs `path_order`-omits-it is a
descriptive FACT both accepted at Ring 0, cross-consistency a Ring 1 obligation).
Because round 1 returned zero blockers, no confirming round 2 was required
(mechanical-tweaks-at-acceptance, ADR 0058 precedent).

ADR 0069 is accepted 2026-06-08 as D-067. Round 1 returned zero blockers and v2
folded every mechanical tweak, so no confirming round 2 was required. It
establishes the authoritative resolution answer as the TAIL of `ToolProvider →
ToolInstallation → ResolvedTool`, completing the tool-resolution chain at the
Ring-0 design layer: anchored on a required `execution_context_id` (+ optional
`workspace_id`), pointing at the winning `tool_installation_id`, with the new
`resolution_basis_kind` axis (WHY this install won) value-disjoint from
`install_surface_kind` on the substantive values (sharing only the universal
`unknown` sentinel), and fulfilling the pre-reserved `Evidence.subject_kind:
'resolved_tool'` with no `Evidence` schema change. The follow-on schema PR
(`resolved-tool.ts` + generated + tests + ontology/registry, including the
both-direction enum coverage with the `unknown`-sentinel carve-out and the
`resolved_tool_id` raw-shape accept-and-trap) and the Ring 1 tool-resolution
obligations (the three FKs' existence, sandbox-non-promotion per inv. 8,
`resolved_tool_id` opacity, basis↔context cross-consistency, supersession)
remain future work.

## Date

2026-06-08

## Charter version

Written against implementation charter v1.4.1 and
`docs/host-capability-substrate/ontology-registry.md` v0.4.29. `ResolvedTool` is
constrained by charter invariant 1 (no live-policy content in Ring 0 — a
resolution answer is a fact, not a tier) and invariant 8 (the resolution must be
observed/computed from host-authoritative inputs, never promoted from a sandbox
observation — a Ring 1 producer obligation, not encoded here).

## Context

`ToolProvider` (ADR 0067 / D-065) and `ToolInstallation` (ADR 0068 / D-066) landed
the head and middle of the tool-resolution chain. `ResolvedTool` is the tail:
**the authoritative answer to "what tool X resolves to in this context"**
(ontology §Entities). A `ResolvedTool` record says: for query `tool_name`, in a
given execution context (and optionally a workspace), the answer is
`ToolInstallation` I, and it won on basis B.

The research (`research/local/2026-05-01-agentic-tool-isolation-synthesis.md`) is
explicit: "A `ResolvedTool` should point to the SURFACE that resolved it, not just
a binary name" — app-managed bundles, devcontainer images, cloud base images,
setup-script tools, manager shims, and PATH tools resolve differently, so the
record must capture the resolving surface and the winning install, not just a name.

Three disambiguation points shape this entity:

**1. `ResolvedTool` (the answer) vs `ToolInstallation` (the install) vs
`ToolProvenance` (the Evidence observation).** `ToolInstallation` is the durable
record that an install EXISTS; `ResolvedTool` is the durable record that, in a
context, a query RESOLVES to one of them; `ToolProvenance` is the Evidence that
corroborates an install's path/shim/version. `ResolvedTool` references a
`ToolInstallation` (the winner); it does not duplicate the install's facts.
`Evidence.subject_kind: 'resolved_tool'` is ALREADY Zod-defined (`evidence.ts`),
so this ADR fulfills a pre-reserved subject kind WITHOUT modifying
`evidenceSubjectKindSchema` or bumping `Evidence.schema_version` (the Principal /
HostProfile / ToolInstallation precedent).

**2. The context binding — what makes two `ResolvedTool` records distinct.**
Resolution is a function of the runtime SURFACE (PATH, sandbox, shell) and,
sometimes, the project. `ResolvedTool` therefore carries a REQUIRED
`execution_context_id` FK to `ExecutionContext` (ADR 0031 — the resolving surface,
matching the research's "the surface that resolved it") plus an OPTIONAL
`workspace_id` FK to `WorkspaceContext` (ADR 0050 — project-scoped resolution, e.g.
a `mise` / `.tool-versions` pin). The surface is always present; the workspace is
present only when the resolution was project-scoped. FK existence is a Ring 1
obligation.

**3. The `resolution_basis_kind` axis — WHY this install won — is distinct from
`ToolInstallation.install_surface_kind` (WHERE the install lives).** This is a new
axis recording the resolution LOGIC. To keep the axes cleanly disjoint (the very
property the operator's shape decision asked for), its values are
resolution-logic-flavored and deliberately do NOT reuse `install_surface_kind`'s
SUBSTANTIVE values: a basis of `manager_shim` / `app_bundled` would collide in
meaning with the install's surface. The two enums share only the universal
`unknown` house sentinel (present on all four axis enums — `manager_kind`,
`install_source_kind`, `install_surface_kind`, `resolution_basis_kind`), which is
a shared sentinel convention, NOT an axis overlap. The axis is:

| Axis | Field | Entity | Question | Values |
|---|---|---|---|---|
| Source / manager | `manager_kind` | ToolProvider (0067) | which source manages a family | `mise` `homebrew` `system` `project_local` `unknown` |
| Install mechanism | `install_source_kind` | ToolProvenance (0034) | how a tool was installed | `homebrew` `mise` `asdf` `npm` `pip` `uv` `system_package_manager` `manual` `unknown` |
| Authority surface | `install_surface_kind` | ToolInstallation (0068) | where the install is exposed | `host_path` `manager_shim` `app_bundled` `devcontainer` `cloud_image` `setup_script` `unknown` |
| Resolution basis | `resolution_basis_kind` | **ResolvedTool (THIS ADR)** | WHY this install won the resolution | `path_order` `workspace_pin` `explicit_override` `single_candidate` `fallback` `unknown` |

Worked example — query `node` in a terminal ExecutionContext with a project mise
pin: the `ResolvedTool` has `tool_name: node`, `tool_installation_id` → the mise
`node@24.3.0` install, `execution_context_id` → the terminal context,
`workspace_id` → the project, `resolution_basis_kind: workspace_pin` (the project
pin won). Contrast the same query with no pin: `resolution_basis_kind: path_order`.

## Decision

Choose **Option A**. `ResolvedTool` is a non-minted Ring-0 entity anchored on the
resolving ExecutionContext (+ optional WorkspaceContext) and carrying the
resolution-basis axis.

### Entity shape (design sketch; exact Zod lands in the schema PR)

```text
ResolvedTool (non-minted Ring 0; structural peer of ToolInstallation/ToolProvider)
  schema_version        z.literal('0.1.0')
  resolved_tool_id      entityIdSchema
  tool_name             resolvedToolNameSchema       // the QUERY; bounded name, no path/URI/secret
  tool_installation_id  entityIdSchema               // REQUIRED FK to the winning ToolInstallation (0068)
  execution_context_id  entityIdSchema               // REQUIRED FK to ExecutionContext (0031) — the surface
  workspace_id          entityIdSchema.optional()    // OPTIONAL FK to WorkspaceContext (0050) — project scope
  resolution_basis_kind enum: path_order | workspace_pin | explicit_override |
                              single_candidate | fallback | unknown
  resolution_state      enum: active | retired
  source_provenance     { authority: 'resolved_tool_declaration', observed_at }
```

`.strict()` envelope. NO `audit_chain_link_hash`, NO producer-mint field, NO
`evidence_refs`; absent from the ADR 0057 mint scope. Reuses `entityIdSchema` and
`isoDateTimeSchema` (`common.ts`).

### Fields

- `tool_name` — the resolution QUERY (e.g. `node`), a bounded identifier with no
  path / URI / secret shape, pinned to the `hostProfileOsVersionSchema` charset
  precedent (the same grammar `ToolInstallation.tool_name` uses; defined as its own
  `resolvedToolNameSchema` primitive per the established pin-the-charset pattern,
  not an import). The exact regex lands in the schema PR.
- `tool_installation_id` — a REQUIRED typed FK to the winning `ToolInstallation`
  (ADR 0068). `ResolvedTool` points at the install; it does not duplicate the
  install's `version` / `install_path` / `install_surface_kind` facts. FK existence
  is a Ring 1 obligation.
- `execution_context_id` — a REQUIRED typed FK to `ExecutionContext` (ADR 0031):
  the runtime surface (shell / sandbox / PATH) that resolved the query. The
  primary context anchor (the research's "the surface that resolved it").
- `workspace_id` — an OPTIONAL typed FK to `WorkspaceContext` (ADR 0050): present
  only when the resolution was project-scoped (e.g. a project pin). Absent for a
  bare-surface resolution.
- `resolution_basis_kind` — the NEW resolution-logic enum (see §Context axis
  table): WHY this install won. Deliberately disjoint from
  `install_surface_kind`'s SUBSTANTIVE values (WHERE the install lives) so the two
  axes stay cleanly separable; the two share only the universal `unknown` house
  sentinel, which is not an axis overlap. A descriptive FACT Ring 1 reads as input,
  never a trust verdict or policy content the entity carries (inv. 1). Widening via
  the registered §Procedure rule.
- `resolution_state` — `active` | `retired`; a re-resolution (the context or
  candidate set changed) produces a NEW `active` record and retires the prior (a
  Ring 1 supersession obligation); `retired` is a valid historical record, not a
  policy-denied state. Mirrors `ToolInstallation.installation_state`.
- `source_provenance` — a `.strict()` declaration-site binding (`authority`
  literal `resolved_tool_declaration`, disjoint from `evidenceAuthoritySchema` and
  conferring no authority by itself; `observed_at`), mirroring the
  `ToolInstallation` / `ToolProvider` / `HostProfile` non-minted provenance pattern.

### What stays in Ring 1 (not this schema)

- Computing the resolution (PATH walk, shim chain, project-pin lookup) from
  host-authoritative inputs and NOT promoting a sandbox observation to a
  host-authoritative `ResolvedTool` (charter inv. 8).
- FK existence: `tool_installation_id → ToolInstallation`,
  `execution_context_id → ExecutionContext`, `workspace_id → WorkspaceContext`.
- `resolved_tool_id` opacity (see §Consequences accept-and-trap).
- Resolution freshness/staleness (a `ResolvedTool` is point-in-time; recomputation
  + supersession are Ring 1).

## Consequences

### Accepts

- HCS gains the authoritative resolution answer as a clean non-minted peer; the
  tail of `ToolProvider → ToolInstallation → ResolvedTool`, completing the chain
  at the Ring-0 design layer.
- The record points at the resolving SURFACE (`execution_context_id`) + the winning
  install (`tool_installation_id`), per the research, not just a binary name.
- The `resolution_basis_kind` axis records WHY an install won, cleanly disjoint
  from `install_surface_kind` / `manager_kind` / `install_source_kind`.
- `ResolvedTool` fulfills the pre-reserved `Evidence.subject_kind: 'resolved_tool'`
  with NO `evidenceSubjectKindSchema` change and NO `Evidence.schema_version` bump.

### Rejects

- Omitting the context binding (a bare name→install pointer) — loses the "in this
  context" semantics that define the entity.
- Omitting `resolution_basis_kind` (Option B) — loses the auditable "why this won"
  the operator's shape decision called for.
- Reusing `install_surface_kind` values for the basis axis — reintroduces the
  axis-overlap the design explicitly avoids.
- Minting (Option D) — over-couples a derived fact entity to the mint/audit
  service; a resolution answer is a fact, not an audit-chain identity.
- A live-policy/tier field anywhere (a resolution answer is a fact, inv. 1).
- Any live-policy, generated-snapshot, system-config, ADR 0031/0050/0068, or Ring 1
  implementation change in this ADR slice.

### Future amendments

- `resolution_basis_kind` enum widening via the registered §Procedure rule as new
  resolution logics appear.
- A resolution-confidence / staleness field, if operational evidence warrants
  (deferred; freshness is a Ring 1 concern at v1).

## Options considered

### Option A: Non-minted, ExecutionContext-anchored (+ optional Workspace) + resolution-basis enum (CHOSEN)

Required `execution_context_id` + optional `workspace_id` + `resolution_basis_kind`.
**Pros:** matches the research ("the surface that resolved it"); captures the
"why" auditably; one record per (query, context) resolution; self-contained
non-minted peer. **Cons:** `resolution_basis_kind` is a new enum to maintain
(acceptable — it is the entity's reason for existing beyond a pointer).

### Option B: Minimal pointer (no basis enum)

`tool_name` + `tool_installation_id` + context FK(s) + state + provenance, no
`resolution_basis_kind`. **Cons:** the "why this won" is not captured at the
entity layer; an auditor cannot tell a project-pin resolution from a PATH-order
one. Rejected per the operator's shape decision.

### Option C: WorkspaceContext-anchored

Required `workspace_id`, optional `execution_context_id`. **Cons:** diverges from
the research's surface emphasis; a workspace spans multiple execution surfaces
(terminal / IDE / sandbox) that resolve differently, so the surface is the more
fundamental anchor.

### Option D: Minted typed-identity envelope

Model `ResolvedTool` like AgentClient/Principal with an audit-chain hash.
**Cons:** over-couples a derived fact entity to the mint/audit service before it
exists; a resolution answer is a fact, not an audit-chain-anchored identity.

## Out of scope

This ADR explicitly does not authorize:

- Zod source, generated JSON Schema, tests, or ontology/registry edits (the schema
  PR per `.agents/skills/hcs-schema-change` follows).
- Edits to ADR 0068 (`ToolInstallation`), ADR 0067 (`ToolProvider`), ADR 0034
  (`ToolProvenance`), ADR 0031 (`ExecutionContext`), ADR 0050 (`WorkspaceContext`),
  or any other ADR; any `evidenceSubjectKindSchema` / `Evidence.schema_version`
  change.
- Live policy, `tiers.yaml`, generated-snapshot, or system-config edits.
- Ring 1 tool-resolution code (the PATH/shim/pin resolver) or resolution probing.
- Execution broker, gateway, capability registration, or dashboard behavior.

## Implementation plan (for the schema PR that follows acceptance)

1. Add `packages/schemas/src/entities/resolved-tool.ts`:
   `resolvedToolSchemaVersionSchema = z.literal('0.1.0')`; the
   `resolution_basis_kind` (6 values in the §Context-table order) and
   `resolution_state` enums — the `resolution_basis_kind` `.describe()` MUST name
   all four tool axes (source `manager_kind` / mechanism `install_source_kind` /
   surface `install_surface_kind` / basis `resolution_basis_kind`), state the
   deliberate disjointness from `install_surface_kind`'s SUBSTANTIVE values (with
   `unknown` called out as the shared house sentinel, not an overlap), and carry
   the shipped peer's inv-1 framing verbatim ("A descriptive FACT that Ring 1
   policy READS as input, never a trust verdict or policy content the entity
   carries (inv. 1)"); a
   `resolvedToolNameSchema` pinned to the `hostProfileOsVersionSchema` charset
   precedent (`z.string().min(1).max(64).regex(/^[A-Za-z0-9._+-]+$/)`); the
   `resolvedToolSourceProvenanceSchema` `.strict()` sub-object (`authority` literal
   `resolved_tool_declaration`, `.describe()` mirroring the peer non-minted
   provenance — disjoint, confers no authority, sandbox-non-promotion per inv. 8 is
   a Ring 1 obligation "not encoded here"); and the `.strict()` `resolvedToolSchema`
   (required `tool_installation_id` + `execution_context_id` FKs, optional
   `workspace_id`). Reuse `entityIdSchema` + `isoDateTimeSchema` from `common.ts`.
2. Register in `packages/schemas/src/index.ts` (alphabetical export block) and
   `packages/schemas/scripts/generate-json-schemas.ts` (import + `schemaEntries`),
   then regenerate `ResolvedTool.schema.json`.
3. Add `packages/schemas/tests/resolved-tool.test.ts`: a well-formed resolution
   accepts; loop ALL SIX `resolution_basis_kind` values (in §Context-table order)
   for accept AND each `resolution_state` value for accept, with out-of-enum reject
   — mirroring the both-direction `tool-installation.test.ts` precedent. The
   disjointness assertion rejects the SURFACE-ONLY `install_surface_kind` values
   (`manager_shim` / `app_bundled` / `host_path` / `devcontainer` / `cloud_image` /
   `setup_script`) as `resolution_basis_kind`, proving the axes are disjoint —
   it must NOT assert `unknown` is rejected (it is a valid basis value, the shared
   sentinel). `tool_name` named-accept + whitespace/URI/path/secret rejects;
   `workspace_id` omittable; `.strict()` rejects injected mint / value / policy
   fields AND the adjacent axis field-names by name (`audit_chain_link_hash`,
   `producer`, `evidence_refs`, `tier`, `approval_required_for`, `manager_kind`,
   `install_source_kind`, `install_surface_kind`); `source_provenance`
   wrong-authority + non-strict reject; the `resolved_tool_id` raw-shape
   accept-and-trap.
4. Update `docs/host-capability-substrate/ontology.md` (the `### ResolvedTool`
   entity section + version + change log) and
   `docs/host-capability-substrate/ontology-registry.md` (a
   §Current-schema-version-ledger row at `'0.1.0'`, a §Schema-enum-mirrors
   `ResolvedTool` subsection for `resolution_basis_kind` / `resolution_state`
   reproducing the enum in the §Context-table order WITH the four-axis
   disambiguation note (the canonical home for the four-axis statement; it must
   state the `unknown`-is-shared-sentinel carve-out so the "value-disjoint" line is
   not read as absolute), a §References row, version + change log).
5. Extend the `scripts/ci/forbidden-string-scan.sh` documentary note to
   `ResolvedTool` (the `resolved_tool_id` accept-and-trap).

## Follow-up regression coverage

| Failure class | Coverage |
|---|---|
| Resolution-basis vs surface/source/mechanism axis confusion | Schema tests assert `.strict()` rejects an injected `install_surface_kind` / `manager_kind` / `install_source_kind` field on ResolvedTool and that `resolution_basis_kind` accepts all six of its resolution-logic values and rejects the SURFACE-ONLY `install_surface_kind` values (`manager_shim` / `app_bundled` / `host_path` / etc.) — but NOT the shared `unknown` sentinel, which is a valid basis value; the registry §axis note documents the four-axis distinction and the shared-sentinel carve-out. |
| `workspace_pin` resolution without `workspace_id` (or vice versa) | Ring 0 does NOT cross-constrain `resolution_basis_kind` vs `workspace_id` (inv. 1): a `workspace_pin` resolution carrying `workspace_id` and a `path_order` resolution omitting it are both descriptive FACTs accepted at Ring 0; basis↔context cross-consistency is a Ring 1 obligation. (Mirrors ToolInstallation's surface-vs-path non-cross-constraint.) |
| `resolution_basis_kind` / `resolution_state` / `resolved_tool` field-name collision | Verified at design time: no shipped `resolution_basis_kind` / `resolution_state` field; `resolved_tool` exists only as the pre-reserved `Evidence.subject_kind` value. |
| `tool_name` as a smuggled path/URI/secret | Schema tests assert the `hostProfileOsVersionSchema`-charset regex rejects whitespace / URI / path / secret shapes (named accept + reject sets). |
| Missing context binding | `execution_context_id` is required (in the generated `required` array); `tool_installation_id` is required; `workspace_id` optional. Schema test asserts the required-field set. |
| `resolved_tool_id` raw-identifier shape | Recorded accept-and-trap: `entityIdSchema` accepts a raw shape (a Ring-0 denylist would violate inv. 1); id-opacity is a Ring 1 obligation, backstopped by `forbidden-string-scan`. Schema test asserts the Ring-0 accept. |
| Sandbox-sourced resolution | Ring 1 producer obligation (charter inv. 8); implementation-test obligation when the tool-resolution service lands; no Ring 0 coverage now. |

## Acceptance criteria

- Operator confirms the v1 scope and the ExecutionContext-anchored (+ optional
  Workspace) non-minted shape with the `resolution_basis_kind` axis — confirmed
  2026-06-08 (incl. the basis-axis value refinement to stay disjoint from
  `install_surface_kind`).
- `hcs-architect`, `hcs-ontology-reviewer`, `hcs-policy-reviewer`,
  `hcs-security-reviewer`, and `hcs-eval-reviewer` complete review and all blocking
  findings are absorbed or explicitly rejected by the operator;
  `hcs-ontology-reviewer` is load-bearing for the four-axis disambiguation.
- `ResolvedTool` stays non-minted and carries no live-policy/tier field.
- `resolution_basis_kind` is a distinct resolution-logic axis with values disjoint
  from `install_surface_kind`; `execution_context_id` is required and `workspace_id`
  optional; the ADR does NOT modify `evidenceSubjectKindSchema` or bump
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
- ADR 0068 / D-066: `docs/host-capability-substrate/adr/0068-tool-installation-ring-0-entity.md`
  — `ToolInstallation` (the winning install `tool_installation_id` points at) and
  the `install_surface_kind` axis `resolution_basis_kind` stays disjoint from.
- ADR 0067 / D-065 + ADR 0034: `ToolProvider.manager_kind` (source) and
  `ToolProvenance.install_source_kind` (mechanism) — the other two tool axes.
- ADR 0031 (`ExecutionContext`) + ADR 0050 (`WorkspaceContext`) — the context FK
  targets (`execution_context_id` required, `workspace_id` optional).
- ADR 0062 / D-060 + ADR 0065 / D-063 + ADR 0066 / D-064 + ADR 0068 / D-066:
  non-minted Ring-0 entity + `source_provenance` precedent.
- `packages/schemas/src/entities/evidence.ts` — the pre-reserved
  `Evidence.subject_kind: 'resolved_tool'` this ADR fulfills without change.
- Ontology: `docs/host-capability-substrate/ontology.md` §Entities
  (`ToolProvider` / `ToolInstallation` / `ResolvedTool` / `ToolProvenance`).
- Ontology registry:
  `docs/host-capability-substrate/ontology-registry.md` —
  `Current schema-version ledger`, `Naming suffix discipline`.
- Schema-change workflow: `.agents/skills/hcs-schema-change/SKILL.md`.

### External

- `research/local/2026-05-01-agentic-tool-isolation-synthesis.md` §`ToolInstallation`
  / `ResolvedTool` — "a `ResolvedTool` should point to the surface that resolved it,
  not just a binary name" (the basis for the required `execution_context_id` anchor).
