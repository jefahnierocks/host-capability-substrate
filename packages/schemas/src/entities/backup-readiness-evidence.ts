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
import { knowledgeSourceKindSchema } from './knowledge-source.ts';

const backupReadinessRedactionModeSchema = evidenceRedactionModeSchema
  .exclude(['none'])
  .describe('ADR 0045 backup-readiness records require an explicit non-none redaction mode.');

const backupReadinessEvidenceBaseFields = {
  schema_version: evidenceSchemaVersionSchema,
  evidence_id: entityIdSchema,
  source: z.string().min(1),
  source_ref: z.string().min(1).optional(),
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
  authority: evidenceAuthoritySchema.exclude(['sandbox-observation']),
  redaction_mode: backupReadinessRedactionModeSchema,
} as const;

const backupReadinessSubjectRefFor = (subjectKind: string, description: string) =>
  z
    .object({
      subject_kind: z.literal(subjectKind),
      subject_id: entityIdSchema,
      relation: z.string().min(1).optional(),
    })
    .strict()
    .describe(description);

const workspaceSubjectRefSchema = backupReadinessSubjectRefFor(
  'workspace',
  'Workspace subject reference for ADR 0045 backup-readiness evidence.',
);

const knowledgeSourceSubjectRefSchema = backupReadinessSubjectRefFor(
  'knowledge_source',
  'KnowledgeSource subject reference for ADR 0045 backup-readiness evidence.',
);

const credentialSourceSubjectRefSchema = backupReadinessSubjectRefFor(
  'credential_source',
  'CredentialSource subject reference for ADR 0045 backup-readiness evidence.',
);

const providerObjectSubjectRefSchema = backupReadinessSubjectRefFor(
  'provider_object',
  'Provider object subject reference for ADR 0045 backup-readiness evidence.',
);

const externalControlPlaneSubjectRefSchema = backupReadinessSubjectRefFor(
  'external_control_plane',
  'External control-plane subject reference for ADR 0045 backup-readiness evidence.',
);

const backupSurfaceSubjectRefSchema = z.union([
  workspaceSubjectRefSchema,
  providerObjectSubjectRefSchema,
  externalControlPlaneSubjectRefSchema,
]);

const backupCustodySubjectRefSchema = z.union([
  credentialSourceSubjectRefSchema,
  workspaceSubjectRefSchema,
  providerObjectSubjectRefSchema,
  externalControlPlaneSubjectRefSchema,
]);

const projectRequirementSubjectRefSchema = z.union([
  workspaceSubjectRefSchema,
  knowledgeSourceSubjectRefSchema,
]);

const evidenceRefArraySchema = z.array(evidenceRefSchema).default([]);
const requiredEvidenceRefArraySchema = z.array(evidenceRefSchema).min(1);

export const backupStorageClassKindSchema = z
  .enum([
    'object_store',
    'nfs_backup_target',
    'vps_native_snapshot',
    'backup_repository',
    'filesystem_snapshot',
    'unknown',
  ])
  .describe('ADR 0045 provider-neutral backup storage class discriminator.');

export const backupReadinessStateKindSchema = z
  .enum(['pending', 'configured', 'usable', 'ready', 'expired', 'unknown'])
  .describe('ADR 0045 backup readiness lifecycle state.');

export const backupEvidenceTombstoneStateKindSchema = z
  .enum(['not_tombstoned', 'tombstoned', 'unknown'])
  .describe('ADR 0045 tombstone state for backup-readiness evidence.');

export const backupVerificationStateKindSchema = z
  .enum(['verified', 'failed', 'not_observed', 'unknown'])
  .describe('ADR 0045 restore-drill verification state.');

export const backupDrillResultKindSchema = z
  .enum(['succeeded', 'failed', 'partial', 'unknown'])
  .describe('ADR 0045 restore drill result discriminator.');

export const backupCleanupDispositionKindSchema = z
  .enum(['cleanup_completed', 'cleanup_pending', 'retained_for_review', 'unknown'])
  .describe('ADR 0045 restore-drill cleanup disposition.');

export const backupCustodyPostureKindSchema = z
  .enum(['reference_only', 'brokered_runtime_read', 'break_glass_only', 'not_observed', 'unknown'])
  .describe('ADR 0045 backup credential custody posture discriminator.');

export const backupCredentialExpiryPostureKindSchema = z
  .enum(['expires', 'non_expiring', 'unknown'])
  .describe('ADR 0045 backup credential expiry posture discriminator.');

export const backupCredentialRotationPostureKindSchema = z
  .enum(['rotating', 'manual', 'not_observed', 'unknown'])
  .describe('ADR 0045 backup credential rotation posture discriminator.');

export const backupCredentialAuditabilityKindSchema = z
  .enum(['audit_log_available', 'audit_log_partial', 'not_observed', 'unknown'])
  .describe('ADR 0045 backup credential auditability discriminator.');

export const backupRequirementDataPostureKindSchema = z
  .enum(['persistent_data_present', 'no_persistent_data', 'disposable_rebuildable', 'unknown'])
  .describe('ADR 0045 project backup data persistence posture.');

export const backupDataMinimizationPostureKindSchema = z
  .enum(['minimal', 'bounded', 'not_observed', 'unknown'])
  .describe('ADR 0045 project backup data-minimization posture.');

export const backupRetentionExpectationKindSchema = z
  .enum(['retain', 'delete_after_expiry', 'tombstone', 'mixed', 'unknown'])
  .describe('ADR 0045 backup retention expectation.');

export const backupTeardownExpectationKindSchema = z
  .enum(['teardown_required', 'not_required', 'unknown'])
  .describe('ADR 0045 project backup teardown expectation.');

export const backupTargetKindSchema = z
  .enum(['workspace', 'provider_object', 'external_control_plane', 'unknown'])
  .describe('ADR 0045 typed backup target reference kind.');

export const backupTargetRefSchema = z
  .object({
    target_kind: backupTargetKindSchema,
    target_ref: entityIdSchema,
  })
  .strict()
  .describe('ADR 0045 typed reference to a backup or restore target.');

export const backupKnowledgeSourceRefSchema = z
  .object({
    knowledge_source_id: entityIdSchema,
    source_kind: knowledgeSourceKindSchema,
    content_hash: sha256DigestSchema.optional(),
  })
  .strict()
  .describe('ADR 0045 typed reference to a KnowledgeSource by kind and optional content hash.');

export const backupThreatModelSourceRefSchema = backupKnowledgeSourceRefSchema
  .extend({
    source_kind: z.literal('threat_model'),
  })
  .describe('ADR 0045 typed reference to a threat-model KnowledgeSource.');

export const backupReadinessPayloadSchema = z
  .object({
    workspace_id: entityIdSchema.optional(),
    provider_object_ref: entityIdSchema.optional(),
    external_control_plane_ref: entityIdSchema.optional(),
    storage_class_ref: entityIdSchema,
    storage_class_kind: backupStorageClassKindSchema,
    readiness_state_kind: backupReadinessStateKindSchema,
    readiness_observed_at: isoDateTimeSchema,
    tombstone_state_kind: backupEvidenceTombstoneStateKindSchema,
    restore_drill_evidence_refs: evidenceRefArraySchema,
    backup_operation_evidence_refs: evidenceRefArraySchema,
    monitoring_evidence_refs: evidenceRefArraySchema,
    credential_custody_evidence_refs: evidenceRefArraySchema,
    threat_model_source_refs: z.array(backupThreatModelSourceRefSchema).default([]),
    project_backup_requirement_evidence_refs: evidenceRefArraySchema,
  })
  .strict()
  .describe('ADR 0045 BackupReadinessObservation typed Evidence payload.');

const backupReadinessObservationBaseSchema = z.object({
  ...backupReadinessEvidenceBaseFields,
  evidence_kind: z.literal('observation'),
  subject_refs: z.array(backupSurfaceSubjectRefSchema).min(1),
  payload_schema_version: z.literal('backup_readiness_observation:v1'),
  payload: backupReadinessPayloadSchema,
});

export const backupReadinessObservationSchema = backupReadinessObservationBaseSchema
  .strict()
  .refine(
    (value) => !value.payload.workspace_id || value.workspace_id === value.payload.workspace_id,
    {
      message: 'BackupReadinessObservation workspace_id must match payload when present.',
      path: ['payload', 'workspace_id'],
    },
  )
  .refine(
    (value) =>
      !value.payload.workspace_id ||
      value.subject_refs.some(
        (ref) => ref.subject_kind === 'workspace' && ref.subject_id === value.payload.workspace_id,
      ),
    {
      message: 'BackupReadinessObservation subject_refs must include payload.workspace_id.',
      path: ['subject_refs'],
    },
  )
  .refine(
    (value) =>
      !value.payload.provider_object_ref ||
      value.subject_refs.some(
        (ref) =>
          ref.subject_kind === 'provider_object' &&
          ref.subject_id === value.payload.provider_object_ref,
      ),
    {
      message: 'BackupReadinessObservation subject_refs must include payload.provider_object_ref.',
      path: ['subject_refs'],
    },
  )
  .refine(
    (value) =>
      !value.payload.external_control_plane_ref ||
      value.subject_refs.some(
        (ref) =>
          ref.subject_kind === 'external_control_plane' &&
          ref.subject_id === value.payload.external_control_plane_ref,
      ),
    {
      message:
        'BackupReadinessObservation subject_refs must include payload.external_control_plane_ref.',
      path: ['subject_refs'],
    },
  )
  .refine(
    (value) =>
      value.payload.readiness_state_kind !== 'ready' ||
      (value.payload.restore_drill_evidence_refs.length > 0 &&
        value.payload.tombstone_state_kind === 'not_tombstoned'),
    {
      message:
        'BackupReadinessObservation ready state requires restore-drill evidence and non-tombstoned state.',
      path: ['payload', 'restore_drill_evidence_refs'],
    },
  )
  .describe('ADR 0045 BackupReadinessObservation direct Evidence subtype.');

export const restoreDrillPayloadSchema = z
  .object({
    restore_drill_id: entityIdSchema,
    source_artifact_ref: backupTargetRefSchema,
    restore_target_ref: backupTargetRefSchema,
    restored_environment_ref: backupTargetRefSchema,
    restore_completed_at: isoDateTimeSchema,
    drill_result_kind: backupDrillResultKindSchema,
    boot_verification_kind: backupVerificationStateKindSchema,
    service_verification_kind: backupVerificationStateKindSchema,
    rto_seconds: z.number().int().nonnegative().optional(),
    rpo_seconds: z.number().int().nonnegative().optional(),
    runbook_source_ref: backupKnowledgeSourceRefSchema.optional(),
    cleanup_disposition_kind: backupCleanupDispositionKindSchema,
    source_artifact_evidence_refs: requiredEvidenceRefArraySchema,
    boot_verification_evidence_refs: evidenceRefArraySchema,
    service_verification_evidence_refs: evidenceRefArraySchema,
    cleanup_evidence_refs: evidenceRefArraySchema,
  })
  .strict()
  .describe('ADR 0045 RestoreDrillReceipt typed Evidence payload.');

const restoreDrillReceiptBaseSchema = z.object({
  ...backupReadinessEvidenceBaseFields,
  evidence_kind: z.literal('receipt'),
  subject_refs: z.array(backupSurfaceSubjectRefSchema).min(1),
  payload_schema_version: z.literal('restore_drill_receipt:v1'),
  payload: restoreDrillPayloadSchema,
});

export const restoreDrillReceiptSchema = restoreDrillReceiptBaseSchema
  .strict()
  .refine(
    (value) =>
      value.payload.drill_result_kind !== 'succeeded' ||
      (value.payload.boot_verification_kind === 'verified' &&
        value.payload.service_verification_kind === 'verified' &&
        value.payload.boot_verification_evidence_refs.length > 0 &&
        value.payload.service_verification_evidence_refs.length > 0),
    {
      message: 'RestoreDrillReceipt succeeded result requires boot/service verification evidence.',
      path: ['payload', 'drill_result_kind'],
    },
  )
  .describe('ADR 0045 RestoreDrillReceipt direct Evidence subtype.');

export const backupCredentialCustodyPayloadSchema = z
  .object({
    credential_source_id: entityIdSchema,
    backup_surface_ref: backupTargetRefSchema,
    runtime_read_pattern_source_ref: backupKnowledgeSourceRefSchema.optional(),
    break_glass_recovery_path_source_ref: backupKnowledgeSourceRefSchema.optional(),
    secret_reference_evidence_refs: requiredEvidenceRefArraySchema,
    custody_posture_kind: backupCustodyPostureKindSchema,
    expiry_posture_kind: backupCredentialExpiryPostureKindSchema,
    rotation_posture_kind: backupCredentialRotationPostureKindSchema,
    auditability_kind: backupCredentialAuditabilityKindSchema,
    credential_authority_evidence_refs: evidenceRefArraySchema,
    machine_identity_binding_evidence_refs: evidenceRefArraySchema,
  })
  .strict()
  .describe('ADR 0045 BackupCredentialCustodyObservation typed Evidence payload.');

const backupCredentialCustodyObservationBaseSchema = z.object({
  ...backupReadinessEvidenceBaseFields,
  evidence_kind: z.literal('observation'),
  subject_refs: z.array(backupCustodySubjectRefSchema).min(1),
  payload_schema_version: z.literal('backup_credential_custody_observation:v1'),
  payload: backupCredentialCustodyPayloadSchema,
});

export const backupCredentialCustodyObservationSchema = backupCredentialCustodyObservationBaseSchema
  .strict()
  .refine(
    (value) =>
      value.subject_refs.some(
        (ref) =>
          ref.subject_kind === 'credential_source' &&
          ref.subject_id === value.payload.credential_source_id,
      ),
    {
      message:
        'BackupCredentialCustodyObservation subject_refs must include payload.credential_source_id.',
      path: ['subject_refs'],
    },
  )
  .describe('ADR 0045 BackupCredentialCustodyObservation direct Evidence subtype.');

export const projectBackupRequirementPayloadSchema = z
  .object({
    workspace_id: entityIdSchema,
    knowledge_source_id: entityIdSchema,
    contract_content_hash: sha256DigestSchema,
    persistent_data_kind: backupRequirementDataPostureKindSchema,
    required_storage_class_kind: backupStorageClassKindSchema,
    required_readiness_state_kind: backupReadinessStateKindSchema,
    require_restore_drill_before_active_use: z.boolean(),
    rpo_seconds: z.number().int().nonnegative().optional(),
    rto_seconds: z.number().int().nonnegative().optional(),
    data_minimization_posture_kind: backupDataMinimizationPostureKindSchema,
    retention_expectation_kind: backupRetentionExpectationKindSchema,
    teardown_expectation_kind: backupTeardownExpectationKindSchema,
    disposability_declared: z.boolean(),
    contract_validation_evidence_ref: evidenceRefSchema,
    admission_evidence_ref: evidenceRefSchema.optional(),
    backup_readiness_evidence_refs: evidenceRefArraySchema,
    restore_drill_evidence_refs: evidenceRefArraySchema,
    teardown_evidence_refs: evidenceRefArraySchema,
  })
  .strict()
  .describe('ADR 0045 ProjectSubstrateBackupRequirementObservation typed Evidence payload.');

const projectSubstrateBackupRequirementObservationBaseSchema = z.object({
  ...backupReadinessEvidenceBaseFields,
  evidence_kind: z.literal('observation'),
  workspace_id: entityIdSchema,
  subject_refs: z.array(projectRequirementSubjectRefSchema).min(2),
  payload_schema_version: z.literal('project_substrate_backup_requirement_observation:v1'),
  payload: projectBackupRequirementPayloadSchema,
});

export const projectSubstrateBackupRequirementObservationSchema =
  projectSubstrateBackupRequirementObservationBaseSchema
    .strict()
    .refine((value) => value.workspace_id === value.payload.workspace_id, {
      message: 'ProjectSubstrateBackupRequirementObservation workspace_id must match payload.',
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
          'ProjectSubstrateBackupRequirementObservation subject_refs must include payload.workspace_id.',
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
          'ProjectSubstrateBackupRequirementObservation subject_refs must include payload.knowledge_source_id.',
        path: ['subject_refs'],
      },
    )
    .refine(
      (value) =>
        value.payload.persistent_data_kind !== 'disposable_rebuildable' ||
        (value.payload.disposability_declared && value.payload.teardown_evidence_refs.length > 0),
      {
        message:
          'ProjectSubstrateBackupRequirementObservation disposable data requires declaration and teardown evidence refs.',
        path: ['payload', 'teardown_evidence_refs'],
      },
    )
    .describe('ADR 0045 ProjectSubstrateBackupRequirementObservation direct Evidence subtype.');

export type BackupStorageClassKind = z.infer<typeof backupStorageClassKindSchema>;
export type BackupReadinessStateKind = z.infer<typeof backupReadinessStateKindSchema>;
export type BackupEvidenceTombstoneStateKind = z.infer<
  typeof backupEvidenceTombstoneStateKindSchema
>;
export type BackupVerificationStateKind = z.infer<typeof backupVerificationStateKindSchema>;
export type BackupDrillResultKind = z.infer<typeof backupDrillResultKindSchema>;
export type BackupCleanupDispositionKind = z.infer<typeof backupCleanupDispositionKindSchema>;
export type BackupCustodyPostureKind = z.infer<typeof backupCustodyPostureKindSchema>;
export type BackupCredentialExpiryPostureKind = z.infer<
  typeof backupCredentialExpiryPostureKindSchema
>;
export type BackupCredentialRotationPostureKind = z.infer<
  typeof backupCredentialRotationPostureKindSchema
>;
export type BackupCredentialAuditabilityKind = z.infer<
  typeof backupCredentialAuditabilityKindSchema
>;
export type BackupRequirementDataPostureKind = z.infer<
  typeof backupRequirementDataPostureKindSchema
>;
export type BackupDataMinimizationPostureKind = z.infer<
  typeof backupDataMinimizationPostureKindSchema
>;
export type BackupRetentionExpectationKind = z.infer<typeof backupRetentionExpectationKindSchema>;
export type BackupTeardownExpectationKind = z.infer<typeof backupTeardownExpectationKindSchema>;
export type BackupTargetKind = z.infer<typeof backupTargetKindSchema>;
export type BackupTargetRef = z.infer<typeof backupTargetRefSchema>;
export type BackupKnowledgeSourceRef = z.infer<typeof backupKnowledgeSourceRefSchema>;
export type BackupThreatModelSourceRef = z.infer<typeof backupThreatModelSourceRefSchema>;
export type BackupReadinessPayload = z.infer<typeof backupReadinessPayloadSchema>;
export type BackupReadinessObservation = z.infer<typeof backupReadinessObservationSchema>;
export type RestoreDrillPayload = z.infer<typeof restoreDrillPayloadSchema>;
export type RestoreDrillReceipt = z.infer<typeof restoreDrillReceiptSchema>;
export type BackupCredentialCustodyPayload = z.infer<typeof backupCredentialCustodyPayloadSchema>;
export type BackupCredentialCustodyObservation = z.infer<
  typeof backupCredentialCustodyObservationSchema
>;
export type ProjectBackupRequirementPayload = z.infer<typeof projectBackupRequirementPayloadSchema>;
export type ProjectSubstrateBackupRequirementObservation = z.infer<
  typeof projectSubstrateBackupRequirementObservationSchema
>;
