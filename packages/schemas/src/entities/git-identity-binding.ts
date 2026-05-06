import { z } from 'zod';
import {
  entityIdSchema,
  evidenceAuthoritySchema,
  evidenceConfidenceSchema,
  evidenceRefSchema,
  isoDateTimeSchema,
} from '../common.ts';
import { evidenceRedactionModeSchema, evidenceSchemaVersionSchema } from './evidence.ts';

const credentialSourceIdSchema = entityIdSchema
  .regex(/^(cred|credential-source):/)
  .describe('Typed FK to a CredentialSource record; raw key identifiers are not valid.');

const gitIdentityBindingSubjectRefSchema = z
  .object({
    subject_kind: z.literal('git_identity_binding'),
    subject_id: entityIdSchema,
    relation: z.string().min(1).optional(),
  })
  .strict()
  .describe('Subject reference for a GitIdentityBinding Evidence subtype.');

export const gitSigningFormatKindSchema = z
  .enum(['openpgp', 'x509', 'ssh', 'none'])
  .describe('Git signing format discriminator from ADR 0034.');

export const gitIdentityBindingProviderObservedViaSchema = z
  .enum(['git_config_read', 'ssh_config_resolution', '1password_op_cli_introspection'])
  .describe('Kernel-set provider observation method for GitIdentityBinding records.');

export const gitIdentityBindingRedactionModeSchema = evidenceRedactionModeSchema
  .exclude(['none'])
  .describe('ADR 0034 redaction floor for GitIdentityBinding records.');

const gitIdentityBindingPayloadBaseSchema = z.object({
  workspace_id: entityIdSchema,
  surface_id: entityIdSchema,
  git_user_name: z.string().min(1),
  git_user_email: z.string().min(1),
  provider_observed_via: gitIdentityBindingProviderObservedViaSchema,
  provider_verified_at: isoDateTimeSchema,
});

export const gitIdentityBindingPayloadSchema = z
  .discriminatedUnion('git_signing_format_kind', [
    gitIdentityBindingPayloadBaseSchema
      .extend({
        git_signing_format_kind: z.literal('none'),
        git_signing_key_id: z.null(),
        credential_source_evidence_ref: z.null(),
      })
      .strict(),
    gitIdentityBindingPayloadBaseSchema
      .extend({
        git_signing_format_kind: z.literal('openpgp'),
        git_signing_key_id: credentialSourceIdSchema,
        credential_source_evidence_ref: evidenceRefSchema,
      })
      .strict(),
    gitIdentityBindingPayloadBaseSchema
      .extend({
        git_signing_format_kind: z.literal('x509'),
        git_signing_key_id: credentialSourceIdSchema,
        credential_source_evidence_ref: evidenceRefSchema,
      })
      .strict(),
    gitIdentityBindingPayloadBaseSchema
      .extend({
        git_signing_format_kind: z.literal('ssh'),
        git_signing_key_id: credentialSourceIdSchema,
        credential_source_evidence_ref: evidenceRefSchema,
      })
      .strict(),
  ])
  .describe('ADR 0034 GitIdentityBinding typed Evidence payload.');

const gitIdentityBindingBaseSchema = z.object({
  schema_version: evidenceSchemaVersionSchema,
  evidence_id: entityIdSchema,
  evidence_kind: z.literal('observation'),
  subject_refs: z.array(gitIdentityBindingSubjectRefSchema).min(1),
  source: z.string().min(1),
  observed_at: isoDateTimeSchema,
  valid_until: isoDateTimeSchema.nullable(),
  confidence: evidenceConfidenceSchema,
  parser_version: z.string().min(1),
  producer: z.string().min(1).optional(),
  host_id: entityIdSchema.optional(),
  workspace_id: entityIdSchema,
  payload_schema_version: z.string().min(1).optional(),
  payload: gitIdentityBindingPayloadSchema,
  redaction_mode: gitIdentityBindingRedactionModeSchema,
});

const nonSandboxGitIdentityBindingSchema = gitIdentityBindingBaseSchema
  .extend({
    authority: evidenceAuthoritySchema.exclude(['sandbox-observation']),
    source_ref: z.string().min(1).optional(),
    execution_context_id: entityIdSchema.optional(),
    session_id: entityIdSchema.optional(),
    run_id: entityIdSchema.optional(),
  })
  .strict();

const sandboxGitIdentityBindingBaseSchema = gitIdentityBindingBaseSchema.extend({
  authority: z.literal('sandbox-observation'),
  execution_context_id: entityIdSchema,
});

export const gitIdentityBindingSchema = z
  .union([
    sandboxGitIdentityBindingBaseSchema
      .extend({
        source_ref: z.string().min(1),
        session_id: entityIdSchema.optional(),
        run_id: entityIdSchema.optional(),
      })
      .strict(),
    sandboxGitIdentityBindingBaseSchema
      .extend({
        source_ref: z.string().min(1).optional(),
        session_id: entityIdSchema,
        run_id: entityIdSchema.optional(),
      })
      .strict(),
    sandboxGitIdentityBindingBaseSchema
      .extend({
        source_ref: z.string().min(1).optional(),
        session_id: entityIdSchema.optional(),
        run_id: entityIdSchema,
      })
      .strict(),
    nonSandboxGitIdentityBindingSchema,
  ])
  .refine((value) => value.workspace_id === value.payload.workspace_id, {
    message: 'GitIdentityBinding workspace_id must match payload.workspace_id.',
    path: ['payload', 'workspace_id'],
  })
  .describe('ADR 0034 GitIdentityBinding direct Evidence subtype.');

export type GitSigningFormatKind = z.infer<typeof gitSigningFormatKindSchema>;
export type GitIdentityBindingProviderObservedVia = z.infer<
  typeof gitIdentityBindingProviderObservedViaSchema
>;
export type GitIdentityBindingPayload = z.infer<typeof gitIdentityBindingPayloadSchema>;
export type GitIdentityBinding = z.infer<typeof gitIdentityBindingSchema>;
