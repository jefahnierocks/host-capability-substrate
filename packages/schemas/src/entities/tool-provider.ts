import { z } from 'zod';
import { entityIdSchema, isoDateTimeSchema } from '../common.ts';

export const toolProviderSchemaVersionSchema = z
  .literal('0.1.0')
  .describe(
    'ToolProvider schema version (ADR 0067; non-minted Ring 0 entity; D-065). New entities start at 0.1.0.',
  );

export const toolProviderManagerKindSchema = z
  .enum(['mise', 'homebrew', 'system', 'project_local', 'unknown'])
  .describe(
    'The tool-SOURCE/manager grain: WHICH source manages a family of tools. Named `manager_kind`, NOT `provider_kind`, to avoid the two existing `provider_kind` field names — the SHIPPED `PullRequestReceipt.payload.provider_kind` (VCS-host axis) and the charter-inv-16-RESERVED `Capability.provider_kind` (external-control-plane axis). It is also a DISTINCT AXIS from ADR 0034 `ToolProvenance.install_source_kind` (the install-MECHANISM grain: homebrew/mise/asdf/npm/pip/uv/system_package_manager/manual/unknown): `manager_kind` carries provider-grain `system`/`project_local` and omits the per-tool `npm`/`pip`/`uv`/`asdf`/`manual` mechanisms. Widening (e.g. `nix`, `devbox`) via the registered §Procedure rule.',
  );

export const toolProviderStateSchema = z
  .enum(['active', 'retired'])
  .describe(
    'ToolProvider lifecycle. A materially-changed provider produces a NEW `active` ToolProvider and retires the prior (a Ring 1 supersession obligation); `retired` is a valid historical record, NOT a policy-denied state.',
  );

export const toolProviderRootPathSchema = z
  .string()
  .min(1)
  .max(512)
  .regex(
    /^(?!.*\.\.)(?:\$\{(?:HOME|USERS_SHARED|TMPDIR|XDG_[A-Z_]+)\}|\/usr\/local|\/opt|\/Library\/Frameworks)(?:\/[A-Za-z0-9._+-]+)*$/,
  )
  .describe(
    'A provider ROOT DIRECTORY. A deliberate SIBLING of ADR 0034 `toolProvenanceCanonicalPathSchema` (root-directory grain vs tool-FILE-path grain), NOT a verbatim reuse: ADR 0034 validates a tool file UNDER a whitelisted root (its `\\/usr\\/local\\/.+` branch REJECTS the bare `/usr/local` Intel-Homebrew prefix, and its `.+` tail does not structurally reject `..`). This primitive (1) ACCEPTS canonical provider roots — a `${HOME}` / `${USERS_SHARED}` / `${TMPDIR}` / `${XDG_*}` placeholder root (a project-local provider root is expressed via `${HOME}/...`), `/usr/local`, `/opt/...`, `/Library/Frameworks/...` — bare or with a subpath; (2) GENUINELY forbids `..` via a `(?!.*\\.\\.)` negative lookahead (the ADR 0063 CommandShape.cwd no-traversal precedent), so the no-traversal claim is structurally honest at Ring 0; (3) forbids URI schemes (`op://` / `https://`), whitespace, and bare token shapes by requiring an anchored provider root. A path segment that resembles a long token under a real root is backstopped by `forbidden-string-scan`. It is not a secret value.',
  );

export const toolProviderSourceProvenanceSchema = z
  .object({
    authority: z
      .literal('tool_provider_declaration')
      .describe(
        'Declaration-site marker (a durable record, NOT an observation); deliberately DISJOINT from evidenceAuthoritySchema and conferring no authority by itself. Installed-runtime sourcing (e.g. `mise`/`brew` introspection) + non-sandbox authority (charter inv. 8) are Ring 1 producer obligations, not encoded here.',
      ),
    observed_at: isoDateTimeSchema,
  })
  .strict()
  .describe(
    'Binds a ToolProvider declaration to its declaration site. Carries no secret/sensitive material. Mirrors the Capability / SecretReference / HostProfile non-minted provenance pattern.',
  );

export const toolProviderSchema = z
  .object({
    schema_version: toolProviderSchemaVersionSchema,
    tool_provider_id: entityIdSchema.describe(
      'Stable ToolProvider id. SHOULD be opaque/derived — `entityIdSchema` accepts a raw machine-ish shape, which Ring 0 cannot reject (a Ring-0 denylist would violate inv. 1), so id-opacity is a Ring 1 producer obligation (recorded accept-and-trap, mirroring HostProfile.host_profile_id).',
    ),
    manager_kind: toolProviderManagerKindSchema,
    provider_state: toolProviderStateSchema,
    root_path: toolProviderRootPathSchema
      .optional()
      .describe(
        'OPTIONAL provider root directory; `system` / `unknown` providers may have no single root.',
      ),
    source_provenance: toolProviderSourceProvenanceSchema,
  })
  .strict()
  .describe(
    'Ring 0 ToolProvider entity from ADR 0067 (D-065). A NON-MINTED durable tool-source record (structural peer of Capability/SecretReference/HostProfile) — the head of the tool-resolution chain ToolProvider -> ToolInstallation -> ResolvedTool. The tool-source field is `manager_kind` (NOT `provider_kind`, avoiding the shipped PullRequestReceipt + charter-inv-16-reserved Capability collisions; a distinct AXIS from ADR 0034 install_source_kind). `root_path` uses a provider-ROOT sibling primitive that accepts bare provider roots and genuinely forbids `..`. No `audit_chain_link_hash`, no producer-mint field, no `evidence_refs`; absent from the ADR 0057 mint scope. A tool source is a FACT and a read-only policy INPUT to Ring 1, never policy content (inv. 1). Provider observation (installed-runtime, non-sandbox per inv. 8), `tool_provider_id` opacity, FK existence (`ToolProvenance.tool_or_provider_ref`, future `ToolInstallation`), and supersession are Ring 1 obligations.',
  );

export type ToolProvider = z.infer<typeof toolProviderSchema>;
export type ToolProviderManagerKind = z.infer<typeof toolProviderManagerKindSchema>;
export type ToolProviderState = z.infer<typeof toolProviderStateSchema>;
export type ToolProviderSourceProvenance = z.infer<typeof toolProviderSourceProvenanceSchema>;
