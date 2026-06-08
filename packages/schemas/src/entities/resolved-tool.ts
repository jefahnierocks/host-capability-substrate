import { z } from 'zod';
import { entityIdSchema, isoDateTimeSchema } from '../common.ts';

export const resolvedToolSchemaVersionSchema = z
  .literal('0.1.0')
  .describe(
    'ResolvedTool schema version (ADR 0069; non-minted Ring 0 entity; D-067). New entities start at 0.1.0.',
  );

export const resolvedToolNameSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9._+-]+$/)
  .describe(
    'The resolution QUERY: the tool identifier asked for (e.g. `node`, `python3`, `ripgrep`). A bounded fact, never an identity or a sink: no whitespace, no `/`, no `:` (so no `://` / `op://`), no path/secret shape; bounded length. Pinned to the shipped `hostProfileOsVersionSchema` charset precedent (the same grammar `ToolInstallation.tool_name` uses).',
  );

export const resolvedToolResolutionBasisKindSchema = z
  .enum([
    'path_order',
    'workspace_pin',
    'explicit_override',
    'single_candidate',
    'fallback',
    'unknown',
  ])
  .describe(
    'The resolution BASIS (ADR 0069): WHY this install won the resolution — the resolution LOGIC. A FOURTH axis, distinct from `ToolProvider.manager_kind` (the SOURCE grain), ADR 0034 `ToolProvenance.install_source_kind` (the install-MECHANISM grain), and `ToolInstallation.install_surface_kind` (the authority-SURFACE / WHERE grain). `path_order` = first on PATH; `workspace_pin` = a project/workspace pin won (e.g. a mise `.tool-versions`); `explicit_override` = an explicit operator/config override; `single_candidate` = only one install existed; `fallback` = a default was chosen; `unknown` = unrecorded. The values are deliberately disjoint from the SUBSTANTIVE values of `install_surface_kind`; the two enums share ONLY the universal `unknown` house sentinel (present on all four axis enums), which is a shared-sentinel convention, NOT an axis overlap. A descriptive FACT that Ring 1 policy READS as input, never a trust verdict or policy content the entity carries (inv. 1). Widening via the registered §Procedure rule.',
  );

export const resolvedToolStateSchema = z
  .enum(['active', 'retired'])
  .describe(
    'ResolvedTool lifecycle. A re-resolution (the context or candidate set changed) produces a NEW `active` ResolvedTool and retires the prior (a Ring 1 supersession obligation); `retired` is a valid historical record, NOT a policy-denied state.',
  );

export const resolvedToolSourceProvenanceSchema = z
  .object({
    authority: z
      .literal('resolved_tool_declaration')
      .describe(
        'Declaration-site marker (a durable record, NOT an observation); deliberately DISJOINT from evidenceAuthoritySchema and conferring no authority by itself. Computing the resolution from host-authoritative inputs + non-sandbox authority (charter inv. 8) are Ring 1 producer obligations, not encoded here.',
      ),
    observed_at: isoDateTimeSchema,
  })
  .strict()
  .describe(
    'Binds a ResolvedTool declaration to its declaration site. Carries no secret/sensitive material. Mirrors the ToolInstallation / ToolProvider / HostProfile non-minted provenance pattern.',
  );

export const resolvedToolSchema = z
  .object({
    schema_version: resolvedToolSchemaVersionSchema,
    resolved_tool_id: entityIdSchema.describe(
      'Stable ResolvedTool id. SHOULD be opaque/derived — `entityIdSchema` accepts a raw machine-ish shape, which Ring 0 cannot reject (a Ring-0 denylist would violate inv. 1), so id-opacity is a Ring 1 producer obligation (recorded accept-and-trap, mirroring ToolInstallation/ToolProvider/HostProfile).',
    ),
    tool_name: resolvedToolNameSchema,
    tool_installation_id: entityIdSchema.describe(
      'REQUIRED FK to the winning `ToolInstallation` (ADR 0068). ResolvedTool points at the install; it does not duplicate the install version / install_path / install_surface_kind facts. FK existence is a Ring 1 obligation.',
    ),
    execution_context_id: entityIdSchema.describe(
      'REQUIRED FK to the `ExecutionContext` (ADR 0031) that resolved the query — the runtime SURFACE (shell / sandbox / PATH). The primary context anchor ("the surface that resolved it"). FK existence is a Ring 1 obligation.',
    ),
    workspace_id: entityIdSchema
      .optional()
      .describe(
        'OPTIONAL FK to the `WorkspaceContext` (ADR 0050); present only when the resolution was project-scoped (e.g. a project pin), absent for a bare-surface resolution. FK existence is a Ring 1 obligation.',
      ),
    resolution_basis_kind: resolvedToolResolutionBasisKindSchema,
    resolution_state: resolvedToolStateSchema,
    source_provenance: resolvedToolSourceProvenanceSchema,
  })
  .strict()
  .describe(
    'Ring 0 ResolvedTool entity from ADR 0069 (D-067). A NON-MINTED durable resolution-answer record (structural peer of ToolInstallation/ToolProvider/HostProfile) — the TAIL of the tool-resolution chain ToolProvider -> ToolInstallation -> ResolvedTool, the authoritative "what tool X resolves to in this context" answer. Anchored on a REQUIRED execution_context_id FK (the resolving surface) + an OPTIONAL workspace_id FK (project scope); points at the winning tool_installation_id FK; carries the resolution-basis axis resolution_basis_kind (WHY this won, value-disjoint from install_surface_kind on the substantive values, sharing only the universal unknown sentinel). Fulfills the pre-reserved Evidence.subject_kind `resolved_tool` with no Evidence schema change. No `audit_chain_link_hash`, no producer-mint field, no `evidence_refs`; absent from the ADR 0057 mint scope. A resolution answer is a FACT and a read-only policy INPUT to Ring 1, never policy content (inv. 1). Computing the resolution (non-sandbox per inv. 8), the three FK existences, resolved_tool_id opacity, basis-vs-context cross-consistency, and supersession are Ring 1 obligations.',
  );

export type ResolvedTool = z.infer<typeof resolvedToolSchema>;
export type ResolvedToolName = z.infer<typeof resolvedToolNameSchema>;
export type ResolvedToolResolutionBasisKind = z.infer<typeof resolvedToolResolutionBasisKindSchema>;
export type ResolvedToolState = z.infer<typeof resolvedToolStateSchema>;
export type ResolvedToolSourceProvenance = z.infer<typeof resolvedToolSourceProvenanceSchema>;
