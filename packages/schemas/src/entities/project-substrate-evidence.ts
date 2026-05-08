import { z } from 'zod';
import {
  entityIdSchema,
  evidenceAuthoritySchema,
  evidenceConfidenceSchema,
  evidenceRefSchema,
  isoDateTimeSchema,
  sha256DigestSchema,
} from '../common.ts';
import { evidenceRedactionModeSchema, evidenceSchemaVersionSchema } from './evidence.ts';

const projectSubstrateRedactionModeSchema = evidenceRedactionModeSchema
  .exclude(['none'])
  .describe('ADR 0044 project-substrate records require an explicit non-none redaction mode.');

const projectSubstrateEvidenceBaseFields = {
  schema_version: evidenceSchemaVersionSchema,
  evidence_id: entityIdSchema,
  source: z.string().min(1),
  observed_at: isoDateTimeSchema,
  valid_until: isoDateTimeSchema,
  confidence: evidenceConfidenceSchema,
  parser_version: z.string().min(1),
  producer: z.string().min(1).optional(),
  host_id: entityIdSchema.optional(),
  workspace_id: entityIdSchema,
  execution_context_id: entityIdSchema.optional(),
  session_id: entityIdSchema.optional(),
  run_id: entityIdSchema.optional(),
  redaction_mode: projectSubstrateRedactionModeSchema,
} as const;

const projectSubstrateSubjectRefFor = (subjectKind: string, description: string) =>
  z
    .object({
      subject_kind: z.literal(subjectKind),
      subject_id: entityIdSchema,
      relation: z.string().min(1).optional(),
    })
    .strict()
    .describe(description);

const workspaceSubjectRefSchema = projectSubstrateSubjectRefFor(
  'workspace',
  'Workspace subject reference for ADR 0044 project-substrate evidence.',
);

const knowledgeSourceSubjectRefSchema = projectSubstrateSubjectRefFor(
  'knowledge_source',
  'KnowledgeSource subject reference for ADR 0044 project-substrate evidence.',
);

const projectSubstrateSubjectRefSchema = z.union([
  workspaceSubjectRefSchema,
  knowledgeSourceSubjectRefSchema,
]);

const withProjectSubstrateHostAuthority = <T extends z.core.$ZodLooseShape>(
  baseSchema: z.ZodObject<T>,
) =>
  baseSchema
    .extend({
      authority: evidenceAuthoritySchema.exclude(['sandbox-observation']),
      source_ref: z.string().min(1).optional(),
    })
    .strict();

const withProjectSubstrateAuthorityVariants = <T extends z.core.$ZodLooseShape>(
  baseSchema: z.ZodObject<T>,
) => {
  const nonSandboxSchema = withProjectSubstrateHostAuthority(baseSchema);
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

const evidenceRefArraySchema = z.array(evidenceRefSchema).default([]);
const requiredEvidenceRefArraySchema = z.array(evidenceRefSchema).min(1);

export const projectSubstrateContractLifecycleStatusSchema = z
  .enum(['draft', 'accepted', 'provisionable', 'active', 'suspended', 'retired', 'unknown'])
  .describe('ADR 0044 producer-asserted project-substrate contract lifecycle status.');

export const projectSubstrateContractValidationOutcomeKindSchema = z
  .enum(['valid', 'invalid', 'warning', 'unknown'])
  .describe('ADR 0044 structural project-substrate contract validation outcome.');

export const projectSubstrateSecretReferencePostureKindSchema = z
  .enum(['none_observed', 'reference_only', 'resolved_secret_detected', 'unknown'])
  .describe('ADR 0044 secret-reference posture for project-substrate contract validation.');

export const projectSubstrateAdmissionStateKindSchema = z
  .enum([
    'observed_admissible',
    'observed_not_admissible',
    'pending',
    'suspended',
    'retired',
    'unknown',
  ])
  .describe('ADR 0044 project-substrate admission observation state.');

export const projectTeardownScopeKindSchema = z
  .enum(['full_project', 'partial_resource', 'unknown'])
  .describe('ADR 0044 project teardown scope discriminator.');

export const projectTeardownRetentionExpectationKindSchema = z
  .enum(['delete', 'retain', 'tombstone', 'mixed', 'unknown'])
  .describe('ADR 0044 project teardown retention expectation.');

export const projectTeardownDataMinimizationPostureKindSchema = z
  .enum(['minimal', 'bounded', 'not_observed', 'unknown'])
  .describe('ADR 0044 project teardown data-minimization posture.');

export const projectTeardownCompletionStateKindSchema = z
  .enum(['completed', 'partially_completed', 'failed', 'unknown'])
  .describe('ADR 0044 project teardown completion state.');

export const projectTeardownResidualRiskKindSchema = z
  .enum(['none', 'accepted', 'present', 'unknown'])
  .describe('ADR 0044 project teardown residual-risk posture.');

export const projectTeardownTombstoneStateKindSchema = z
  .enum(['not_applicable', 'tombstone_recorded', 'retained_until_expiry', 'unknown'])
  .describe('ADR 0044 project teardown tombstone/retention state.');

export const projectSubstrateContractValidationPayloadSchema = z
  .object({
    workspace_id: entityIdSchema,
    knowledge_source_id: entityIdSchema,
    contract_content_hash: sha256DigestSchema,
    validation_run_id: entityIdSchema,
    standard_ref: entityIdSchema,
    standard_version: z.string().min(1),
    validation_outcome_kind: projectSubstrateContractValidationOutcomeKindSchema,
    checked_field_paths: z.array(z.string().min(1)).default([]),
    secret_reference_posture_kind: projectSubstrateSecretReferencePostureKindSchema,
    contract_source_evidence_ref: evidenceRefSchema.optional(),
    structural_evidence_refs: evidenceRefArraySchema,
  })
  .strict()
  .describe('ADR 0044 ProjectSubstrateContractValidationReceipt typed Evidence payload.');

const projectSubstrateContractValidationReceiptBaseSchema = z.object({
  ...projectSubstrateEvidenceBaseFields,
  evidence_kind: z.literal('receipt'),
  subject_refs: z.array(projectSubstrateSubjectRefSchema).min(2),
  payload_schema_version: z.literal('project_substrate_contract_validation_receipt:v1'),
  payload: projectSubstrateContractValidationPayloadSchema,
});

export const projectSubstrateContractValidationReceiptSchema =
  withProjectSubstrateAuthorityVariants(projectSubstrateContractValidationReceiptBaseSchema)
    .refine((value) => value.workspace_id === value.payload.workspace_id, {
      message: 'ProjectSubstrateContractValidationReceipt workspace_id must match payload.',
      path: ['payload', 'workspace_id'],
    })
    .refine(
      (value) =>
        value.subject_refs.some(
          (ref) =>
            ref.subject_kind === 'workspace' && ref.subject_id === value.payload.workspace_id,
        ),
      {
        message:
          'ProjectSubstrateContractValidationReceipt subject_refs must include payload.workspace_id.',
        path: ['subject_refs'],
      },
    )
    .refine(
      (value) =>
        value.subject_refs.some(
          (ref) =>
            ref.subject_kind === 'knowledge_source' &&
            ref.subject_id === value.payload.knowledge_source_id,
        ),
      {
        message:
          'ProjectSubstrateContractValidationReceipt subject_refs must include payload.knowledge_source_id.',
        path: ['subject_refs'],
      },
    )
    .describe('ADR 0044 ProjectSubstrateContractValidationReceipt direct Evidence subtype.');

export const projectSubstrateAdmissionPayloadSchema = z
  .object({
    workspace_id: entityIdSchema,
    knowledge_source_id: entityIdSchema,
    contract_content_hash: sha256DigestSchema,
    contract_lifecycle_status: projectSubstrateContractLifecycleStatusSchema,
    admission_state_kind: projectSubstrateAdmissionStateKindSchema,
    admission_observed_at: isoDateTimeSchema,
    contract_validation_evidence_ref: evidenceRefSchema,
    project_admission_authority_boundary_ref: evidenceRefSchema,
    credential_authority_evidence_refs: evidenceRefArraySchema,
    machine_identity_binding_evidence_refs: evidenceRefArraySchema,
    boundary_evidence_refs: evidenceRefArraySchema,
    runner_evidence_refs: evidenceRefArraySchema,
    status_check_source_evidence_refs: evidenceRefArraySchema,
    resource_budget_evidence_refs: evidenceRefArraySchema,
    policy_plan_evidence_refs: evidenceRefArraySchema,
    no_secret_material_observed: z.boolean(),
  })
  .strict()
  .describe('ADR 0044 ProjectSubstrateAdmissionObservation typed Evidence payload.');

const projectSubstrateAdmissionObservationBaseSchema = z.object({
  ...projectSubstrateEvidenceBaseFields,
  evidence_kind: z.literal('observation'),
  subject_refs: z.array(projectSubstrateSubjectRefSchema).min(2),
  payload_schema_version: z.literal('project_substrate_admission_observation:v1'),
  payload: projectSubstrateAdmissionPayloadSchema,
});

export const projectSubstrateAdmissionObservationSchema = withProjectSubstrateHostAuthority(
  projectSubstrateAdmissionObservationBaseSchema,
)
  .refine((value) => value.workspace_id === value.payload.workspace_id, {
    message: 'ProjectSubstrateAdmissionObservation workspace_id must match payload.',
    path: ['payload', 'workspace_id'],
  })
  .refine(
    (value) =>
      value.subject_refs.some(
        (ref) => ref.subject_kind === 'workspace' && ref.subject_id === value.payload.workspace_id,
      ),
    {
      message:
        'ProjectSubstrateAdmissionObservation subject_refs must include payload.workspace_id.',
      path: ['subject_refs'],
    },
  )
  .refine(
    (value) =>
      value.subject_refs.some(
        (ref) =>
          ref.subject_kind === 'knowledge_source' &&
          ref.subject_id === value.payload.knowledge_source_id,
      ),
    {
      message:
        'ProjectSubstrateAdmissionObservation subject_refs must include payload.knowledge_source_id.',
      path: ['subject_refs'],
    },
  )
  .describe('ADR 0044 ProjectSubstrateAdmissionObservation direct Evidence subtype.');

export const projectTeardownPlanPayloadSchema = z
  .object({
    workspace_id: entityIdSchema,
    knowledge_source_id: entityIdSchema.optional(),
    contract_content_hash: sha256DigestSchema.optional(),
    teardown_plan_id: entityIdSchema,
    teardown_scope_kind: projectTeardownScopeKindSchema,
    target_refs: z.array(entityIdSchema).min(1),
    retention_expectation_kind: projectTeardownRetentionExpectationKindSchema,
    data_minimization_posture_kind: projectTeardownDataMinimizationPostureKindSchema,
    planned_at: isoDateTimeSchema,
    deletion_authority_evidence_refs: requiredEvidenceRefArraySchema,
    contract_validation_evidence_ref: evidenceRefSchema.optional(),
    admission_evidence_ref: evidenceRefSchema.optional(),
    approval_evidence_refs: evidenceRefArraySchema,
  })
  .strict()
  .describe('ADR 0044 ProjectTeardownPlanReceipt typed Evidence payload.');

const projectTeardownPlanReceiptBaseSchema = z.object({
  ...projectSubstrateEvidenceBaseFields,
  evidence_kind: z.literal('receipt'),
  subject_refs: z.array(projectSubstrateSubjectRefSchema).min(1),
  payload_schema_version: z.literal('project_teardown_plan_receipt:v1'),
  payload: projectTeardownPlanPayloadSchema,
});

export const projectTeardownPlanReceiptSchema = withProjectSubstrateHostAuthority(
  projectTeardownPlanReceiptBaseSchema,
)
  .refine((value) => value.workspace_id === value.payload.workspace_id, {
    message: 'ProjectTeardownPlanReceipt workspace_id must match payload.',
    path: ['payload', 'workspace_id'],
  })
  .refine(
    (value) =>
      value.subject_refs.some(
        (ref) => ref.subject_kind === 'workspace' && ref.subject_id === value.payload.workspace_id,
      ),
    {
      message: 'ProjectTeardownPlanReceipt subject_refs must include payload.workspace_id.',
      path: ['subject_refs'],
    },
  )
  .refine(
    (value) =>
      !value.payload.knowledge_source_id ||
      value.subject_refs.some(
        (ref) =>
          ref.subject_kind === 'knowledge_source' &&
          ref.subject_id === value.payload.knowledge_source_id,
      ),
    {
      message:
        'ProjectTeardownPlanReceipt subject_refs must include payload.knowledge_source_id when present.',
      path: ['subject_refs'],
    },
  )
  .describe('ADR 0044 ProjectTeardownPlanReceipt direct Evidence subtype.');

export const projectTeardownCompletionPayloadSchema = z
  .object({
    workspace_id: entityIdSchema,
    teardown_plan_id: entityIdSchema,
    teardown_completed_at: isoDateTimeSchema,
    completion_state_kind: projectTeardownCompletionStateKindSchema,
    completion_evidence_refs: requiredEvidenceRefArraySchema,
    deletion_authority_evidence_refs: requiredEvidenceRefArraySchema,
    removed_target_refs: z.array(entityIdSchema).default([]),
    retained_target_refs: z.array(entityIdSchema).default([]),
    residual_risk_kind: projectTeardownResidualRiskKindSchema,
    tombstone_state_kind: projectTeardownTombstoneStateKindSchema,
  })
  .strict()
  .describe('ADR 0044 ProjectTeardownCompletionReceipt typed Evidence payload.');

const projectTeardownCompletionReceiptBaseSchema = z.object({
  ...projectSubstrateEvidenceBaseFields,
  evidence_kind: z.literal('receipt'),
  subject_refs: z.array(workspaceSubjectRefSchema).min(1),
  payload_schema_version: z.literal('project_teardown_completion_receipt:v1'),
  payload: projectTeardownCompletionPayloadSchema,
});

export const projectTeardownCompletionReceiptSchema = withProjectSubstrateHostAuthority(
  projectTeardownCompletionReceiptBaseSchema,
)
  .refine((value) => value.workspace_id === value.payload.workspace_id, {
    message: 'ProjectTeardownCompletionReceipt workspace_id must match payload.',
    path: ['payload', 'workspace_id'],
  })
  .refine(
    (value) =>
      value.subject_refs.some(
        (ref) => ref.subject_kind === 'workspace' && ref.subject_id === value.payload.workspace_id,
      ),
    {
      message: 'ProjectTeardownCompletionReceipt subject_refs must include payload.workspace_id.',
      path: ['subject_refs'],
    },
  )
  .describe('ADR 0044 ProjectTeardownCompletionReceipt direct Evidence subtype.');

export type ProjectSubstrateContractLifecycleStatus = z.infer<
  typeof projectSubstrateContractLifecycleStatusSchema
>;
export type ProjectSubstrateContractValidationOutcomeKind = z.infer<
  typeof projectSubstrateContractValidationOutcomeKindSchema
>;
export type ProjectSubstrateSecretReferencePostureKind = z.infer<
  typeof projectSubstrateSecretReferencePostureKindSchema
>;
export type ProjectSubstrateAdmissionStateKind = z.infer<
  typeof projectSubstrateAdmissionStateKindSchema
>;
export type ProjectTeardownScopeKind = z.infer<typeof projectTeardownScopeKindSchema>;
export type ProjectTeardownRetentionExpectationKind = z.infer<
  typeof projectTeardownRetentionExpectationKindSchema
>;
export type ProjectTeardownDataMinimizationPostureKind = z.infer<
  typeof projectTeardownDataMinimizationPostureKindSchema
>;
export type ProjectTeardownCompletionStateKind = z.infer<
  typeof projectTeardownCompletionStateKindSchema
>;
export type ProjectTeardownResidualRiskKind = z.infer<typeof projectTeardownResidualRiskKindSchema>;
export type ProjectTeardownTombstoneStateKind = z.infer<
  typeof projectTeardownTombstoneStateKindSchema
>;
export type ProjectSubstrateContractValidationPayload = z.infer<
  typeof projectSubstrateContractValidationPayloadSchema
>;
export type ProjectSubstrateContractValidationReceipt = z.infer<
  typeof projectSubstrateContractValidationReceiptSchema
>;
export type ProjectSubstrateAdmissionPayload = z.infer<
  typeof projectSubstrateAdmissionPayloadSchema
>;
export type ProjectSubstrateAdmissionObservation = z.infer<
  typeof projectSubstrateAdmissionObservationSchema
>;
export type ProjectTeardownPlanPayload = z.infer<typeof projectTeardownPlanPayloadSchema>;
export type ProjectTeardownPlanReceipt = z.infer<typeof projectTeardownPlanReceiptSchema>;
export type ProjectTeardownCompletionPayload = z.infer<
  typeof projectTeardownCompletionPayloadSchema
>;
export type ProjectTeardownCompletionReceipt = z.infer<
  typeof projectTeardownCompletionReceiptSchema
>;
