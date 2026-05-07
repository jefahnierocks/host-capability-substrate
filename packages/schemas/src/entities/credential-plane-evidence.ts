import { z } from 'zod';
import {
  entityIdSchema,
  evidenceAuthoritySchema,
  evidenceConfidenceSchema,
  evidenceRefSchema,
  isoDateTimeSchema,
} from '../common.ts';
import {
  credentialHealthStatusSchema,
  credentialSourceTypeSchema,
  credentialStoragePlaneSchema,
} from './credential-source.ts';
import { evidenceRedactionModeSchema, evidenceSchemaVersionSchema } from './evidence.ts';

const jwtLikePattern = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

const credentialPlaneRedactionModeSchema = evidenceRedactionModeSchema
  .exclude(['none'])
  .describe('ADR 0043 credential-plane records require an explicit non-none redaction mode.');

const machineIdentityRefSchema = entityIdSchema
  .refine((value) => !jwtLikePattern.test(value), {
    message: 'machine_identity_ref must be a reference id, not a JWT/assertion-shaped value.',
  })
  .describe('ADR 0043 non-secret machine identity reference.');

const credentialPlaneEvidenceBaseFields = {
  schema_version: evidenceSchemaVersionSchema,
  evidence_id: entityIdSchema,
  evidence_kind: z.literal('observation'),
  source: z.string().min(1),
  observed_at: isoDateTimeSchema,
  valid_until: isoDateTimeSchema,
  confidence: evidenceConfidenceSchema,
  parser_version: z.string().min(1),
  producer: z.string().min(1).optional(),
  host_id: entityIdSchema.optional(),
  workspace_id: entityIdSchema.optional(),
  execution_context_id: entityIdSchema.optional(),
  session_id: entityIdSchema.optional(),
  run_id: entityIdSchema.optional(),
  redaction_mode: credentialPlaneRedactionModeSchema,
} as const;

const credentialPlaneSubjectRefSchema = (subjectKind: string, description: string) =>
  z
    .object({
      subject_kind: z.literal(subjectKind),
      subject_id: entityIdSchema,
      relation: z.string().min(1).optional(),
    })
    .strict()
    .describe(description);

const withEvidenceAuthorityVariants = <T extends z.core.$ZodLooseShape>(
  baseSchema: z.ZodObject<T>,
) => {
  const nonSandboxSchema = baseSchema
    .extend({
      authority: evidenceAuthoritySchema.exclude(['sandbox-observation']),
      source_ref: z.string().min(1).optional(),
    })
    .strict();

  const sandboxBaseSchema = baseSchema.extend({
    authority: z.literal('sandbox-observation'),
    execution_context_id: entityIdSchema,
  });

  return z.union([
    sandboxBaseSchema
      .extend({
        source_ref: z.string().min(1),
      })
      .strict(),
    sandboxBaseSchema
      .extend({
        source_ref: z.string().min(1).optional(),
        session_id: entityIdSchema,
      })
      .strict(),
    sandboxBaseSchema
      .extend({
        source_ref: z.string().min(1).optional(),
        run_id: entityIdSchema,
      })
      .strict(),
    nonSandboxSchema,
  ]);
};

export const credentialAuthoritySurfaceKindSchema = z
  .enum([
    'credential_authority',
    'secret_store',
    'identity_provider',
    'broker',
    'provider_control_plane',
    'local_host',
    'unknown',
  ])
  .describe('ADR 0043 credential authority surface discriminator.');

export const credentialScopePostureKindSchema = z
  .enum(['least_privilege', 'bounded', 'broad', 'unknown'])
  .describe('ADR 0043 credential scope/audience posture discriminator.');

export const credentialExpiryPostureKindSchema = z
  .enum(['expires', 'non_expiring', 'unknown'])
  .describe('ADR 0043 credential expiry posture discriminator.');

export const credentialRotationPostureKindSchema = z
  .enum(['rotating', 'manual', 'not_observed', 'unknown'])
  .describe('ADR 0043 credential rotation posture discriminator.');

export const credentialAuditabilityKindSchema = z
  .enum(['audit_log_available', 'audit_log_partial', 'not_observed', 'unknown'])
  .describe('ADR 0043 credential authority auditability discriminator.');

export const credentialAudiencePostureKindSchema = z
  .enum(['single_audience', 'multiple_audience', 'wildcard', 'unknown'])
  .describe('ADR 0043 credential or identity audience posture discriminator.');

const credentialSourceSubjectRefSchema = credentialPlaneSubjectRefSchema(
  'credential_source',
  'Subject reference for a CredentialAuthorityObservation Evidence subtype.',
);

export const credentialAuthorityPayloadSchema = z
  .object({
    credential_source_id: entityIdSchema,
    credential_source_type: credentialSourceTypeSchema,
    credential_storage_plane: credentialStoragePlaneSchema,
    authority_surface_kind: credentialAuthoritySurfaceKindSchema,
    authority_surface_ref: entityIdSchema,
    scope_posture_kind: credentialScopePostureKindSchema,
    audience_posture_kind: credentialAudiencePostureKindSchema,
    expiry_posture_kind: credentialExpiryPostureKindSchema,
    rotation_posture_kind: credentialRotationPostureKindSchema,
    health_status: credentialHealthStatusSchema,
    health_checked_at: isoDateTimeSchema.nullable().optional(),
    auditability_kind: credentialAuditabilityKindSchema,
    credential_source_evidence_ref: evidenceRefSchema.optional(),
    boundary_evidence_refs: z.array(evidenceRefSchema).default([]),
  })
  .strict()
  .describe('ADR 0043 CredentialAuthorityObservation typed Evidence payload.');

const credentialAuthorityObservationBaseSchema = z.object({
  ...credentialPlaneEvidenceBaseFields,
  subject_refs: z.array(credentialSourceSubjectRefSchema).min(1),
  payload_schema_version: z.literal('credential_authority_observation:v1'),
  payload: credentialAuthorityPayloadSchema,
});

export const credentialAuthorityObservationSchema = withEvidenceAuthorityVariants(
  credentialAuthorityObservationBaseSchema,
)
  .refine(
    (value) =>
      value.subject_refs.some((ref) => ref.subject_id === value.payload.credential_source_id),
    {
      message:
        'CredentialAuthorityObservation subject_refs must include payload.credential_source_id.',
      path: ['subject_refs'],
    },
  )
  .describe('ADR 0043 CredentialAuthorityObservation direct Evidence subtype.');

export const machineIdentityKindSchema = z
  .enum(['provider_principal', 'federated_subject', 'runner_principal'])
  .describe('ADR 0043 machine identity reference discriminator.');

export const machineIdentityIssuerPostureKindSchema = z
  .enum(['platform_native', 'federated', 'service_account', 'runner_registration', 'unknown'])
  .describe('ADR 0043 machine identity issuer/source posture discriminator.');

export const machineIdentityBindingStatusKindSchema = z
  .enum(['observed_bound', 'observed_absent', 'contradictory', 'unknown'])
  .describe('ADR 0043 machine identity to credential-source binding status.');

const machineIdentitySubjectRefSchema = credentialPlaneSubjectRefSchema(
  'machine_identity',
  'Subject reference for a MachineIdentityBindingObservation Evidence subtype.',
);

const machineIdentityBindingSubjectRefSchema = z.union([
  machineIdentitySubjectRefSchema,
  credentialSourceSubjectRefSchema,
]);

export const machineIdentityBindingPayloadSchema = z
  .object({
    machine_identity_kind: machineIdentityKindSchema,
    machine_identity_ref: machineIdentityRefSchema,
    credential_source_id: entityIdSchema,
    authority_surface_kind: credentialAuthoritySurfaceKindSchema,
    authority_surface_ref: entityIdSchema,
    issuer_posture_kind: machineIdentityIssuerPostureKindSchema,
    audience_posture_kind: credentialAudiencePostureKindSchema,
    expiry_posture_kind: credentialExpiryPostureKindSchema,
    rotation_posture_kind: credentialRotationPostureKindSchema,
    binding_status_kind: machineIdentityBindingStatusKindSchema,
    execution_context_id: entityIdSchema,
    identity_observed_at: isoDateTimeSchema,
    credential_authority_evidence_ref: evidenceRefSchema,
    boundary_evidence_refs: z.array(evidenceRefSchema).default([]),
  })
  .strict()
  .describe('ADR 0043 MachineIdentityBindingObservation typed Evidence payload.');

const machineIdentityBindingObservationBaseSchema = z.object({
  ...credentialPlaneEvidenceBaseFields,
  execution_context_id: entityIdSchema,
  subject_refs: z.array(machineIdentityBindingSubjectRefSchema).min(2),
  payload_schema_version: z.literal('machine_identity_binding_observation:v1'),
  payload: machineIdentityBindingPayloadSchema,
});

export const machineIdentityBindingObservationSchema = withEvidenceAuthorityVariants(
  machineIdentityBindingObservationBaseSchema,
)
  .refine((value) => value.execution_context_id === value.payload.execution_context_id, {
    message: 'MachineIdentityBindingObservation execution_context_id must match payload.',
    path: ['payload', 'execution_context_id'],
  })
  .refine(
    (value) =>
      value.subject_refs.some(
        (ref) =>
          ref.subject_kind === 'machine_identity' &&
          ref.subject_id === value.payload.machine_identity_ref,
      ),
    {
      message:
        'MachineIdentityBindingObservation subject_refs must include payload.machine_identity_ref.',
      path: ['subject_refs'],
    },
  )
  .refine(
    (value) =>
      value.subject_refs.some(
        (ref) =>
          ref.subject_kind === 'credential_source' &&
          ref.subject_id === value.payload.credential_source_id,
      ),
    {
      message:
        'MachineIdentityBindingObservation subject_refs must include payload.credential_source_id.',
      path: ['subject_refs'],
    },
  )
  .describe('ADR 0043 MachineIdentityBindingObservation direct Evidence subtype.');

export type CredentialAuthoritySurfaceKind = z.infer<typeof credentialAuthoritySurfaceKindSchema>;
export type CredentialScopePostureKind = z.infer<typeof credentialScopePostureKindSchema>;
export type CredentialExpiryPostureKind = z.infer<typeof credentialExpiryPostureKindSchema>;
export type CredentialRotationPostureKind = z.infer<typeof credentialRotationPostureKindSchema>;
export type CredentialAuditabilityKind = z.infer<typeof credentialAuditabilityKindSchema>;
export type CredentialAudiencePostureKind = z.infer<typeof credentialAudiencePostureKindSchema>;
export type CredentialAuthorityPayload = z.infer<typeof credentialAuthorityPayloadSchema>;
export type CredentialAuthorityObservation = z.infer<typeof credentialAuthorityObservationSchema>;
export type MachineIdentityKind = z.infer<typeof machineIdentityKindSchema>;
export type MachineIdentityIssuerPostureKind = z.infer<
  typeof machineIdentityIssuerPostureKindSchema
>;
export type MachineIdentityBindingStatusKind = z.infer<
  typeof machineIdentityBindingStatusKindSchema
>;
export type MachineIdentityBindingPayload = z.infer<typeof machineIdentityBindingPayloadSchema>;
export type MachineIdentityBindingObservation = z.infer<
  typeof machineIdentityBindingObservationSchema
>;
