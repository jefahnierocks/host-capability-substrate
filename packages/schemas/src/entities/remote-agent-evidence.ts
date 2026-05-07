import { z } from 'zod';
import {
  entityIdSchema,
  evidenceConfidenceSchema,
  evidenceRefSchema,
  isoDateTimeSchema,
  sha256DigestSchema,
} from '../common.ts';
import { evidenceRedactionModeSchema, evidenceSchemaVersionSchema } from './evidence.ts';

const remoteAgentEvidenceBaseFields = {
  schema_version: evidenceSchemaVersionSchema,
  evidence_id: entityIdSchema,
  source: z.string().min(1),
  source_ref: z.string().min(1).optional(),
  observed_at: isoDateTimeSchema,
  valid_until: isoDateTimeSchema,
  authority: z.literal('derived'),
  confidence: evidenceConfidenceSchema,
  parser_version: z.string().min(1),
  producer: z.string().min(1).optional(),
  host_id: entityIdSchema.optional(),
  workspace_id: entityIdSchema.optional(),
  execution_context_id: entityIdSchema,
  session_id: entityIdSchema.optional(),
  run_id: entityIdSchema.optional(),
  redaction_mode: evidenceRedactionModeSchema.optional(),
} as const;

const remoteAgentSubjectRefSchema = (subjectKind: string, description: string) =>
  z
    .object({
      subject_kind: z.literal(subjectKind),
      subject_id: entityIdSchema,
      relation: z.string().min(1).optional(),
    })
    .strict()
    .describe(description);

const remoteAgentPayloadBaseSchema = z.object({
  agent_client_id: entityIdSchema,
  execution_context_id: entityIdSchema,
  containment_boundary_evidence_ref: evidenceRefSchema,
});

const remoteAgentBaseImageSubjectRefSchema = remoteAgentSubjectRefSchema(
  'remote_agent_base_image',
  'Subject reference for a RemoteAgentBaseImageObservation Evidence subtype.',
);

export const remoteAgentBaseImageKindSchema = z
  .enum(['vendor_runtime', 'container_image', 'vm_image', 'self_hosted_runner_image', 'unknown'])
  .describe('ADR 0037 remote-agent base image kind.');

export const remoteAgentBaseImageProvenanceSchema = z
  .enum(['vendor_managed', 'user_specified', 'unknown'])
  .describe('ADR 0037 remote-agent base image provenance.');

export const remoteAgentBaseImagePayloadSchema = remoteAgentPayloadBaseSchema
  .extend({
    base_image_id: entityIdSchema,
    base_image_kind: remoteAgentBaseImageKindSchema,
    base_image_digest: sha256DigestSchema,
    base_image_provenance: remoteAgentBaseImageProvenanceSchema,
    image_published_at: isoDateTimeSchema,
    vendor_observed_via_evidence_ref: evidenceRefSchema,
  })
  .strict()
  .describe('ADR 0037 RemoteAgentBaseImageObservation typed Evidence payload.');

const remoteAgentBaseImageObservationBaseSchema = z.object({
  ...remoteAgentEvidenceBaseFields,
  evidence_kind: z.literal('observation'),
  subject_refs: z.array(remoteAgentBaseImageSubjectRefSchema).min(1),
  payload_schema_version: z.literal('remote-agent-base-image-observation:v1'),
  payload: remoteAgentBaseImagePayloadSchema,
});

export const remoteAgentBaseImageObservationSchema = remoteAgentBaseImageObservationBaseSchema
  .strict()
  .refine((value) => value.execution_context_id === value.payload.execution_context_id, {
    message: 'RemoteAgentBaseImageObservation execution_context_id must match payload.',
    path: ['payload', 'execution_context_id'],
  })
  .refine(
    (value) => value.subject_refs.some((ref) => ref.subject_id === value.payload.base_image_id),
    {
      message: 'RemoteAgentBaseImageObservation subject_refs must include payload.base_image_id.',
      path: ['subject_refs'],
    },
  )
  .describe('ADR 0037 RemoteAgentBaseImageObservation direct Evidence subtype.');

const remoteAgentSetupSubjectRefSchema = remoteAgentSubjectRefSchema(
  'remote_agent_setup',
  'Subject reference for a RemoteAgentSetupReceipt Evidence subtype.',
);

export const remoteAgentSecretInjectionKindSchema = z
  .enum([
    'env_at_setup',
    'env_at_runtime',
    'mounted_secret_volume',
    'brokered_at_request',
    'none_required',
  ])
  .describe('ADR 0037 remote-agent secret injection discriminator.');

export const remoteAgentSetupPayloadSchema = remoteAgentPayloadBaseSchema
  .extend({
    setup_execution_id: entityIdSchema,
    setup_script_evidence_ref: evidenceRefSchema,
    setup_exit_code: z.number().int().min(0),
    setup_observed_at: isoDateTimeSchema,
    secret_injection_kind: remoteAgentSecretInjectionKindSchema,
    setup_duration_ms: z.number().int().min(0),
    setup_log_evidence_ref: evidenceRefSchema,
  })
  .strict()
  .describe('ADR 0037 RemoteAgentSetupReceipt typed Evidence payload.');

const remoteAgentSetupReceiptBaseSchema = z.object({
  ...remoteAgentEvidenceBaseFields,
  evidence_kind: z.literal('receipt'),
  subject_refs: z.array(remoteAgentSetupSubjectRefSchema).min(1),
  payload_schema_version: z.literal('remote-agent-setup-receipt:v1'),
  payload: remoteAgentSetupPayloadSchema,
});

export const remoteAgentSetupReceiptSchema = remoteAgentSetupReceiptBaseSchema
  .strict()
  .refine((value) => value.execution_context_id === value.payload.execution_context_id, {
    message: 'RemoteAgentSetupReceipt execution_context_id must match payload.',
    path: ['payload', 'execution_context_id'],
  })
  .refine(
    (value) =>
      value.subject_refs.some((ref) => ref.subject_id === value.payload.setup_execution_id),
    {
      message: 'RemoteAgentSetupReceipt subject_refs must include payload.setup_execution_id.',
      path: ['subject_refs'],
    },
  )
  .describe('ADR 0037 RemoteAgentSetupReceipt direct Evidence subtype.');

const remoteAgentNetworkPostureSubjectRefSchema = remoteAgentSubjectRefSchema(
  'remote_agent_network_posture',
  'Subject reference for a RemoteAgentNetworkPostureObservation Evidence subtype.',
);

export const remoteAgentEgressKindSchema = z
  .enum(['none', 'allowlist_only', 'proxy_mediated', 'open', 'unknown'])
  .describe('ADR 0037 remote-agent egress posture.');

export const remoteAgentFirewallKindSchema = z
  .enum(['none', 'vendor_managed', 'user_managed', 'unknown'])
  .describe('ADR 0037 remote-agent firewall posture.');

export const remoteAgentNetworkPosturePayloadSchema = remoteAgentPayloadBaseSchema
  .extend({
    network_posture_id: entityIdSchema,
    egress_kind: remoteAgentEgressKindSchema,
    firewall_kind: remoteAgentFirewallKindSchema,
    egress_observed_via_evidence_ref: evidenceRefSchema,
    network_posture_observed_at: isoDateTimeSchema,
  })
  .strict()
  .describe('ADR 0037 RemoteAgentNetworkPostureObservation typed Evidence payload.');

const remoteAgentNetworkPostureObservationBaseSchema = z.object({
  ...remoteAgentEvidenceBaseFields,
  evidence_kind: z.literal('observation'),
  subject_refs: z.array(remoteAgentNetworkPostureSubjectRefSchema).min(1),
  payload_schema_version: z.literal('remote-agent-network-posture-observation:v1'),
  payload: remoteAgentNetworkPosturePayloadSchema,
});

export const remoteAgentNetworkPostureObservationSchema =
  remoteAgentNetworkPostureObservationBaseSchema
    .strict()
    .refine((value) => value.execution_context_id === value.payload.execution_context_id, {
      message: 'RemoteAgentNetworkPostureObservation execution_context_id must match payload.',
      path: ['payload', 'execution_context_id'],
    })
    .refine(
      (value) =>
        value.subject_refs.some((ref) => ref.subject_id === value.payload.network_posture_id),
      {
        message:
          'RemoteAgentNetworkPostureObservation subject_refs must include payload.network_posture_id.',
        path: ['subject_refs'],
      },
    )
    .describe('ADR 0037 RemoteAgentNetworkPostureObservation direct Evidence subtype.');

export type RemoteAgentBaseImageKind = z.infer<typeof remoteAgentBaseImageKindSchema>;
export type RemoteAgentBaseImageProvenance = z.infer<typeof remoteAgentBaseImageProvenanceSchema>;
export type RemoteAgentBaseImagePayload = z.infer<typeof remoteAgentBaseImagePayloadSchema>;
export type RemoteAgentBaseImageObservation = z.infer<typeof remoteAgentBaseImageObservationSchema>;
export type RemoteAgentSecretInjectionKind = z.infer<typeof remoteAgentSecretInjectionKindSchema>;
export type RemoteAgentSetupPayload = z.infer<typeof remoteAgentSetupPayloadSchema>;
export type RemoteAgentSetupReceipt = z.infer<typeof remoteAgentSetupReceiptSchema>;
export type RemoteAgentEgressKind = z.infer<typeof remoteAgentEgressKindSchema>;
export type RemoteAgentFirewallKind = z.infer<typeof remoteAgentFirewallKindSchema>;
export type RemoteAgentNetworkPosturePayload = z.infer<
  typeof remoteAgentNetworkPosturePayloadSchema
>;
export type RemoteAgentNetworkPostureObservation = z.infer<
  typeof remoteAgentNetworkPostureObservationSchema
>;
