import { z } from 'zod';
import {
  entityIdSchema,
  evidenceAuthoritySchema,
  evidenceConfidenceSchema,
  isoDateTimeSchema,
} from '../common.ts';
import { evidenceRedactionModeSchema, evidenceSchemaVersionSchema } from './evidence.ts';

const canonicalToolPathPattern =
  /^(?:\$\{(?:HOME|USERS_SHARED|TMPDIR|XDG_CACHE_HOME|XDG_DATA_HOME|XDG_CONFIG_HOME)\}\/.+|\/usr\/local\/.+|\/opt\/.+|\/Library\/Frameworks\/.+)$/;

const toolProvenanceSubjectRefSchema = z
  .object({
    subject_kind: z.literal('tool_provenance'),
    subject_id: entityIdSchema,
    relation: z.string().min(1).optional(),
  })
  .strict()
  .describe('Subject reference for a ToolProvenance Evidence subtype.');

export const toolProvenanceCanonicalPathSchema = z
  .string()
  .min(1)
  .regex(canonicalToolPathPattern)
  .describe('Canonicalized tool path in placeholder-root-with-path or accepted system-root form.');

export const toolProvenanceShimHopSchema = z
  .object({
    shim_path: toolProvenanceCanonicalPathSchema,
    target_path: toolProvenanceCanonicalPathSchema,
  })
  .strict()
  .describe('Single shim-chain hop with canonicalized paths.');

export const toolProvenanceInstallSourceKindSchema = z
  .enum([
    'homebrew',
    'mise',
    'asdf',
    'npm',
    'pip',
    'uv',
    'system_package_manager',
    'manual',
    'unknown',
  ])
  .describe('ADR 0034 install source discriminator for ToolProvenance.');

export const toolProvenanceVersionDriftKindSchema = z
  .enum(['matches_lockfile', 'ahead_of_lockfile', 'behind_lockfile', 'no_lockfile', 'unknown'])
  .describe('ADR 0034 version drift discriminator for ToolProvenance.');

export const toolProvenanceProviderObservedViaSchema = z
  .enum(['which_command', 'shim_introspection', 'package_manager_query'])
  .describe('Kernel-set provider observation method for ToolProvenance records.');

export const toolProvenancePayloadSchema = z
  .object({
    tool_or_provider_ref: entityIdSchema,
    execution_context_id: entityIdSchema,
    installed_path: toolProvenanceCanonicalPathSchema,
    shim_chain: z.array(toolProvenanceShimHopSchema).default([]),
    shim_depth: z.number().int().min(0),
    install_source_kind: toolProvenanceInstallSourceKindSchema,
    version_observed: z.string().min(1),
    version_drift_kind: toolProvenanceVersionDriftKindSchema,
    provider_observed_via: toolProvenanceProviderObservedViaSchema,
    provider_verified_at: isoDateTimeSchema,
  })
  .strict()
  .refine((value) => value.shim_depth === value.shim_chain.length, {
    message: 'ToolProvenance shim_depth must equal shim_chain.length.',
    path: ['shim_depth'],
  })
  .describe('ADR 0034 ToolProvenance typed Evidence payload.');

const toolProvenanceBaseSchema = z.object({
  schema_version: evidenceSchemaVersionSchema,
  evidence_id: entityIdSchema,
  evidence_kind: z.literal('observation'),
  subject_refs: z.array(toolProvenanceSubjectRefSchema).min(1),
  source: z.string().min(1),
  observed_at: isoDateTimeSchema,
  valid_until: isoDateTimeSchema.nullable(),
  confidence: evidenceConfidenceSchema,
  parser_version: z.string().min(1),
  producer: z.string().min(1).optional(),
  host_id: entityIdSchema.optional(),
  workspace_id: entityIdSchema.optional(),
  execution_context_id: entityIdSchema,
  payload_schema_version: z.string().min(1).optional(),
  payload: toolProvenancePayloadSchema,
  redaction_mode: evidenceRedactionModeSchema.optional(),
});

const nonSandboxToolProvenanceSchema = toolProvenanceBaseSchema
  .extend({
    authority: evidenceAuthoritySchema.exclude(['sandbox-observation']),
    source_ref: z.string().min(1).optional(),
    session_id: entityIdSchema.optional(),
    run_id: entityIdSchema.optional(),
  })
  .strict();

const sandboxToolProvenanceBaseSchema = toolProvenanceBaseSchema.extend({
  authority: z.literal('sandbox-observation'),
});

export const toolProvenanceSchema = z
  .union([
    sandboxToolProvenanceBaseSchema
      .extend({
        source_ref: z.string().min(1),
        session_id: entityIdSchema.optional(),
        run_id: entityIdSchema.optional(),
      })
      .strict(),
    sandboxToolProvenanceBaseSchema
      .extend({
        source_ref: z.string().min(1).optional(),
        session_id: entityIdSchema,
        run_id: entityIdSchema.optional(),
      })
      .strict(),
    sandboxToolProvenanceBaseSchema
      .extend({
        source_ref: z.string().min(1).optional(),
        session_id: entityIdSchema.optional(),
        run_id: entityIdSchema,
      })
      .strict(),
    nonSandboxToolProvenanceSchema,
  ])
  .refine((value) => value.execution_context_id === value.payload.execution_context_id, {
    message: 'ToolProvenance execution_context_id must match payload.execution_context_id.',
    path: ['payload', 'execution_context_id'],
  })
  .describe('ADR 0034 ToolProvenance direct Evidence subtype.');

export type ToolProvenanceShimHop = z.infer<typeof toolProvenanceShimHopSchema>;
export type ToolProvenanceInstallSourceKind = z.infer<typeof toolProvenanceInstallSourceKindSchema>;
export type ToolProvenanceVersionDriftKind = z.infer<typeof toolProvenanceVersionDriftKindSchema>;
export type ToolProvenanceProviderObservedVia = z.infer<
  typeof toolProvenanceProviderObservedViaSchema
>;
export type ToolProvenancePayload = z.infer<typeof toolProvenancePayloadSchema>;
export type ToolProvenance = z.infer<typeof toolProvenanceSchema>;
