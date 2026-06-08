import { z } from 'zod';
import { entityIdSchema, isoDateTimeSchema } from '../common.ts';
import { toolProvenanceCanonicalPathSchema } from './tool-provenance.ts';

export const toolInstallationSchemaVersionSchema = z
  .literal('0.1.0')
  .describe(
    'ToolInstallation schema version (ADR 0068; non-minted Ring 0 entity; D-066). New entities start at 0.1.0.',
  );

export const toolInstallationToolNameSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9._+-]+$/)
  .describe(
    'The installed tool identifier (e.g. `node`, `python3`, `ripgrep`, `rust-analyzer`). A bounded fact, never an identity or a sink: no whitespace, no `/`, no `:` (so no `://` / `op://`), no path/secret shape; bounded length. Pinned to the shipped `hostProfileOsVersionSchema` charset precedent.',
  );

export const toolInstallationVersionSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9._+-]+$/)
  .describe(
    'The installed tool version string (e.g. `24.3.0`, `v18.16.0`, `1.2.3-beta.1`, `3.12`). A version FACT, never an identity or a sink: no whitespace, no `/`, no `:` (so no `://` / `op://`), no path/secret shape; bounded length. Pinned to the shipped `hostProfileOsVersionSchema` charset precedent.',
  );

export const toolInstallationInstallSurfaceKindSchema = z
  .enum([
    'host_path',
    'manager_shim',
    'app_bundled',
    'devcontainer',
    'cloud_image',
    'setup_script',
    'unknown',
  ])
  .describe(
    'The authority SURFACE the install is exposed on (ADR 0068): WHERE/HOW the tool is reachable as an authority surface. This is a THIRD axis, distinct from `ToolProvider.manager_kind` (the SOURCE/manager grain — which source manages a family of tools) and from ADR 0034 `ToolProvenance.install_source_kind` (the install-MECHANISM grain — how a tool was installed). `host_path` = a binary on the host PATH; `manager_shim` = a mise/asdf/brew shim; `app_bundled` = ships in an app dependency bundle (e.g. Codex Workspace Dependencies — NOT host-PATH truth); `devcontainer` / `cloud_image` = a devcontainer or cloud base-image tool; `setup_script` = installed by a CI/setup script. A descriptive FACT that Ring 1 policy READS as input, never a trust verdict or policy content the entity carries (inv. 1). Widening (e.g. `nix_profile`) via the registered §Procedure rule.',
  );

export const toolInstallationStateSchema = z
  .enum(['active', 'retired'])
  .describe(
    'ToolInstallation lifecycle. A materially-changed install produces a NEW `active` ToolInstallation and retires the prior (a Ring 1 supersession obligation); `retired` is a valid historical record, NOT a policy-denied state.',
  );

export const toolInstallationSourceProvenanceSchema = z
  .object({
    authority: z
      .literal('tool_installation_declaration')
      .describe(
        'Declaration-site marker (a durable record, NOT an observation); deliberately DISJOINT from evidenceAuthoritySchema and conferring no authority by itself. Installed-runtime sourcing (e.g. `mise ls` / `brew list` / shim introspection) + non-sandbox authority (charter inv. 8) are Ring 1 producer obligations, not encoded here.',
      ),
    observed_at: isoDateTimeSchema,
  })
  .strict()
  .describe(
    'Binds a ToolInstallation declaration to its declaration site. Carries no secret/sensitive material. Mirrors the ToolProvider / HostProfile / Capability / SecretReference non-minted provenance pattern.',
  );

export const toolInstallationSchema = z
  .object({
    schema_version: toolInstallationSchemaVersionSchema,
    tool_installation_id: entityIdSchema.describe(
      'Stable ToolInstallation id. SHOULD be opaque/derived — `entityIdSchema` accepts a raw machine-ish shape, which Ring 0 cannot reject (a Ring-0 denylist would violate inv. 1), so id-opacity is a Ring 1 producer obligation (recorded accept-and-trap, mirroring ToolProvider.tool_provider_id / HostProfile.host_profile_id).',
    ),
    tool_provider_id: entityIdSchema.describe(
      'REQUIRED FK to the ToolProvider (ADR 0067) this install comes from. A `system` / `manual` install is recorded against a ToolProvider whose `manager_kind` is `system` / `unknown`. FK existence is a Ring 1 obligation; Ring 0 only types the reference.',
    ),
    tool_name: toolInstallationToolNameSchema,
    version: toolInstallationVersionSchema,
    install_surface_kind: toolInstallationInstallSurfaceKindSchema,
    install_path: toolProvenanceCanonicalPathSchema
      .optional()
      .describe(
        'OPTIONAL canonical tool FILE path (REUSES the ADR 0034 `toolProvenanceCanonicalPathSchema` — an install path IS a tool file under a whitelisted root, the correct grain, the inverse of ToolProvider.root_path). Optional because `app_bundled` / `cloud_image` surfaces may have no canonical host file path at Ring 0. Inherits the ToolProvenance canonicalization posture: it rejects URI/whitespace by requiring an anchored root but does not structurally reject a mid-path `..` (deep `..` resolution is a Ring 1 obligation).',
      ),
    installation_state: toolInstallationStateSchema,
    source_provenance: toolInstallationSourceProvenanceSchema,
  })
  .strict()
  .describe(
    'Ring 0 ToolInstallation entity from ADR 0068 (D-066). A NON-MINTED durable per-install record (structural peer of ToolProvider/HostProfile/Capability/SecretReference) — the MIDDLE of the tool-resolution chain ToolProvider -> ToolInstallation -> ResolvedTool. Carries the authority-surface axis `install_surface_kind` (distinct from ToolProvider.manager_kind source axis and ADR 0034 install_source_kind mechanism axis); a REQUIRED tool_provider_id FK to ToolProvider; tool_name + version bounded facts; an OPTIONAL install_path reusing the ADR 0034 tool-file-path primitive. Fulfills the pre-reserved Evidence.subject_kind `tool_installation` with no Evidence schema change. No `audit_chain_link_hash`, no producer-mint field, no `evidence_refs`; absent from the ADR 0057 mint scope. An installed tool is a FACT and a read-only policy INPUT to Ring 1, never policy content (inv. 1). Install observation (installed-runtime, non-sandbox per inv. 8), tool_provider_id FK existence, install_path deep canonicalization, tool_installation_id opacity, and supersession are Ring 1 obligations.',
  );

export type ToolInstallation = z.infer<typeof toolInstallationSchema>;
export type ToolInstallationToolName = z.infer<typeof toolInstallationToolNameSchema>;
export type ToolInstallationVersion = z.infer<typeof toolInstallationVersionSchema>;
export type ToolInstallationInstallSurfaceKind = z.infer<
  typeof toolInstallationInstallSurfaceKindSchema
>;
export type ToolInstallationState = z.infer<typeof toolInstallationStateSchema>;
export type ToolInstallationSourceProvenance = z.infer<
  typeof toolInstallationSourceProvenanceSchema
>;
