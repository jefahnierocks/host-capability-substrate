import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  backupCredentialCustodyObservationSchema,
  backupReadinessObservationSchema,
  knowledgeSourceKindSchema,
  projectSubstrateBackupRequirementObservationSchema,
  restoreDrillReceiptSchema,
} from '../src/index.ts';

const observedAt = '2026-05-07T00:00:00Z';
const validUntil = '2026-05-08T00:00:00Z';
const workspaceId = 'workspace:host-capability-substrate';
const providerObjectRef = 'provider-object:backup:hcs';
const credentialSourceId = 'credential-source:backup:hcs';
const knowledgeSourceId = 'knowledge-source:threat-model:hcs';
const contractHash = 'sha256:abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd';

const proofEvidenceRef = {
  evidence_id: 'evidence:backup:proof',
  source: 'backup-readiness-fixture',
  observed_at: observedAt,
  valid_until: validUntil,
  authority: 'host-observation',
  confidence: 'high',
  parser_version: 'backup-readiness-parser:v1',
} as const;

const backupOperationEvidenceRef = {
  ...proofEvidenceRef,
  evidence_id: 'evidence:backup-operation:hcs',
} as const;

const monitoringEvidenceRef = {
  ...proofEvidenceRef,
  evidence_id: 'evidence:backup-monitoring:hcs',
} as const;

const restoreDrillEvidenceRef = {
  ...proofEvidenceRef,
  evidence_id: 'evidence:restore-drill:hcs',
  payload_schema_version: 'restore_drill_receipt:v1',
} as const;

const sourceArtifactEvidenceRef = {
  ...proofEvidenceRef,
  evidence_id: 'evidence:backup-source-artifact:hcs',
} as const;

const bootVerificationEvidenceRef = {
  ...proofEvidenceRef,
  evidence_id: 'evidence:restore-drill:boot-verification',
} as const;

const serviceVerificationEvidenceRef = {
  ...proofEvidenceRef,
  evidence_id: 'evidence:restore-drill:service-verification',
} as const;

const cleanupEvidenceRef = {
  ...proofEvidenceRef,
  evidence_id: 'evidence:restore-drill:cleanup',
} as const;

const secretReferenceEvidenceRef = {
  ...proofEvidenceRef,
  evidence_id: 'evidence:backup-secret-reference:hcs',
} as const;

const credentialAuthorityEvidenceRef = {
  ...proofEvidenceRef,
  evidence_id: 'evidence:backup-credential-authority:hcs',
} as const;

const machineIdentityBindingEvidenceRef = {
  ...proofEvidenceRef,
  evidence_id: 'evidence:backup-machine-identity-binding:hcs',
} as const;

const credentialCustodyEvidenceRef = {
  ...proofEvidenceRef,
  evidence_id: 'evidence:backup-credential-custody:hcs',
  payload_schema_version: 'backup_credential_custody_observation:v1',
} as const;

const projectBackupRequirementEvidenceRef = {
  ...proofEvidenceRef,
  evidence_id: 'evidence:project-backup-requirement:hcs',
  payload_schema_version: 'project_substrate_backup_requirement_observation:v1',
} as const;

const backupReadinessEvidenceRef = {
  ...proofEvidenceRef,
  evidence_id: 'evidence:backup-readiness:hcs',
  payload_schema_version: 'backup_readiness_observation:v1',
} as const;

const contractValidationEvidenceRef = {
  ...proofEvidenceRef,
  evidence_id: 'evidence:project-substrate-contract-validation:hcs',
  payload_schema_version: 'project_substrate_contract_validation_receipt:v1',
} as const;

const admissionEvidenceRef = {
  ...proofEvidenceRef,
  evidence_id: 'evidence:project-substrate-admission:hcs',
  payload_schema_version: 'project_substrate_admission_observation:v1',
} as const;

const teardownEvidenceRef = {
  ...proofEvidenceRef,
  evidence_id: 'evidence:project-teardown-completion:hcs',
  payload_schema_version: 'project_teardown_completion_receipt:v1',
} as const;

const restoreDrillEvidenceRefWithoutFreshness = {
  evidence_id: 'evidence:restore-drill:missing-valid-until',
  source: 'backup-readiness-fixture',
  observed_at: observedAt,
  authority: 'host-observation',
  confidence: 'high',
  parser_version: 'backup-readiness-parser:v1',
  payload_schema_version: 'restore_drill_receipt:v1',
} as const;

const targetRef = {
  target_kind: 'provider_object',
  target_ref: providerObjectRef,
} as const;

const threatModelSourceRef = {
  knowledge_source_id: knowledgeSourceId,
  source_kind: 'threat_model',
  content_hash: contractHash,
} as const;

const readinessObservation = {
  schema_version: '0.9.0',
  evidence_id: 'evidence:backup-readiness:hcs',
  evidence_kind: 'observation',
  subject_refs: [
    {
      subject_kind: 'workspace',
      subject_id: workspaceId,
    },
    {
      subject_kind: 'provider_object',
      subject_id: providerObjectRef,
    },
  ],
  source: 'backup-readiness-fixture',
  observed_at: observedAt,
  valid_until: validUntil,
  authority: 'host-observation',
  confidence: 'high',
  parser_version: 'backup-readiness-parser:v1',
  workspace_id: workspaceId,
  payload_schema_version: 'backup_readiness_observation:v1',
  payload: {
    workspace_id: workspaceId,
    provider_object_ref: providerObjectRef,
    storage_class_ref: 'storage-class:backup-repository:hcs',
    storage_class_kind: 'backup_repository',
    readiness_state_kind: 'ready',
    readiness_observed_at: observedAt,
    tombstone_state_kind: 'not_tombstoned',
    restore_drill_evidence_refs: [restoreDrillEvidenceRef],
    backup_operation_evidence_refs: [backupOperationEvidenceRef],
    monitoring_evidence_refs: [monitoringEvidenceRef],
    credential_custody_evidence_refs: [credentialCustodyEvidenceRef],
    threat_model_source_refs: [threatModelSourceRef],
    project_backup_requirement_evidence_refs: [projectBackupRequirementEvidenceRef],
  },
  redaction_mode: 'reference_only',
} as const;

type GeneratedSchemaObject = Record<string, unknown>;

const asRecord = (value: unknown): GeneratedSchemaObject =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as GeneratedSchemaObject)
    : {};

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const recordAt = (value: unknown, key: string): GeneratedSchemaObject =>
  asRecord(asRecord(value)[key]);

const readGeneratedSchema = (file: string): GeneratedSchemaObject =>
  JSON.parse(
    readFileSync(new URL(`../generated/${file}`, import.meta.url), 'utf8'),
  ) as GeneratedSchemaObject;

const generatedPayloadProperties = (schema: GeneratedSchemaObject): GeneratedSchemaObject =>
  recordAt(recordAt(recordAt(schema, 'properties'), 'payload'), 'properties');

const findGeneratedPayloadGuard = (
  schema: GeneratedSchemaObject,
  discriminatorField: string,
  discriminatorValue: string,
): GeneratedSchemaObject | undefined =>
  asArray(schema.allOf)
    .map(asRecord)
    .find((guard) => {
      const ifPayloadProperties = recordAt(
        recordAt(recordAt(guard, 'if'), 'properties'),
        'payload',
      );
      return recordAt(ifPayloadProperties, 'properties')[discriminatorField] instanceof Object
        ? recordAt(recordAt(ifPayloadProperties, 'properties'), discriminatorField).const ===
            discriminatorValue
        : false;
    });

describe('ADR 0045 Q-015 backup-readiness evidence subtypes', () => {
  it('adds threat_model as a KnowledgeSource source kind', () => {
    expect(knowledgeSourceKindSchema.parse('threat_model')).toBe('threat_model');
  });

  it('validates BackupReadinessObservation only when ready has restore evidence', () => {
    const observation = backupReadinessObservationSchema.parse(readinessObservation);

    expect(observation.payload.readiness_state_kind).toBe('ready');
    expect(
      backupReadinessObservationSchema.safeParse({
        ...readinessObservation,
        evidence_id: 'evidence:backup-readiness:ready-without-drill',
        payload: {
          ...readinessObservation.payload,
          restore_drill_evidence_refs: [],
        },
      }).success,
    ).toBe(false);
    expect(
      backupReadinessObservationSchema.safeParse({
        ...readinessObservation,
        evidence_id: 'evidence:backup-readiness:tombstoned-ready',
        payload: {
          ...readinessObservation.payload,
          tombstone_state_kind: 'tombstoned',
        },
      }).success,
    ).toBe(false);
    expect(
      backupReadinessObservationSchema.safeParse({
        ...readinessObservation,
        evidence_id: 'evidence:backup-readiness:sandbox',
        authority: 'sandbox-observation',
        execution_context_id: 'ctx:sandbox:backup-readiness',
        source_ref: 'repo://backup-readiness.yaml',
      }).success,
    ).toBe(false);
    expect(
      backupReadinessObservationSchema.safeParse({
        ...readinessObservation,
        evidence_id: 'evidence:backup-readiness:allowed-for-gate',
        allowed_for_gate: true,
      }).success,
    ).toBe(false);
    expect(
      backupReadinessObservationSchema.safeParse({
        ...readinessObservation,
        evidence_id: 'evidence:backup-readiness:sandbox-restore-ref',
        payload: {
          ...readinessObservation.payload,
          restore_drill_evidence_refs: [
            {
              ...restoreDrillEvidenceRef,
              evidence_id: 'evidence:restore-drill:sandbox-ref',
              authority: 'sandbox-observation',
            },
          ],
        },
      }).success,
    ).toBe(false);
    expect(
      backupReadinessObservationSchema.safeParse({
        ...readinessObservation,
        evidence_id: 'evidence:backup-readiness:restore-ref-without-freshness',
        payload: {
          ...readinessObservation.payload,
          restore_drill_evidence_refs: [restoreDrillEvidenceRefWithoutFreshness],
        },
      }).success,
    ).toBe(false);
    expect(
      backupReadinessObservationSchema.safeParse({
        ...readinessObservation,
        evidence_id: 'evidence:backup-readiness:wrong-restore-ref-kind',
        payload: {
          ...readinessObservation.payload,
          restore_drill_evidence_refs: [
            {
              ...restoreDrillEvidenceRef,
              evidence_id: 'evidence:restore-drill:wrong-payload-kind',
              payload_schema_version: 'backup_readiness_observation:v1',
            },
          ],
        },
      }).success,
    ).toBe(false);
  });

  it('keeps unknown and expired readiness distinct from positive ready', () => {
    const unknown = backupReadinessObservationSchema.parse({
      ...readinessObservation,
      evidence_id: 'evidence:backup-readiness:unknown',
      payload: {
        ...readinessObservation.payload,
        readiness_state_kind: 'unknown',
        restore_drill_evidence_refs: [],
      },
    });
    const expired = backupReadinessObservationSchema.parse({
      ...readinessObservation,
      evidence_id: 'evidence:backup-readiness:expired',
      payload: {
        ...readinessObservation.payload,
        readiness_state_kind: 'expired',
        restore_drill_evidence_refs: [],
      },
    });

    expect(unknown.payload.readiness_state_kind).not.toBe('ready');
    expect(expired.payload.readiness_state_kind).not.toBe('ready');
  });

  it('validates RestoreDrillReceipt with typed restored-environment refs', () => {
    const receipt = restoreDrillReceiptSchema.parse({
      schema_version: '0.9.0',
      evidence_id: 'evidence:restore-drill:hcs',
      evidence_kind: 'receipt',
      subject_refs: [
        {
          subject_kind: 'workspace',
          subject_id: workspaceId,
        },
        {
          subject_kind: 'provider_object',
          subject_id: providerObjectRef,
        },
      ],
      source: 'restore-drill-fixture',
      observed_at: observedAt,
      valid_until: validUntil,
      authority: 'host-observation',
      confidence: 'high',
      parser_version: 'restore-drill-parser:v1',
      workspace_id: workspaceId,
      payload_schema_version: 'restore_drill_receipt:v1',
      payload: {
        restore_drill_id: 'restore-drill:hcs:001',
        source_artifact_ref: targetRef,
        restore_target_ref: targetRef,
        restored_environment_ref: targetRef,
        restore_completed_at: observedAt,
        drill_result_kind: 'succeeded',
        boot_verification_kind: 'verified',
        service_verification_kind: 'verified',
        rto_seconds: 120,
        rpo_seconds: 300,
        runbook_source_ref: {
          ...threatModelSourceRef,
          source_kind: 'runbook',
        },
        cleanup_disposition_kind: 'cleanup_completed',
        source_artifact_evidence_refs: [sourceArtifactEvidenceRef],
        boot_verification_evidence_refs: [bootVerificationEvidenceRef],
        service_verification_evidence_refs: [serviceVerificationEvidenceRef],
        cleanup_evidence_refs: [cleanupEvidenceRef],
      },
      redaction_mode: 'reference_only',
    });

    expect(receipt.payload.restored_environment_ref.target_kind).toBe('provider_object');
    expect(
      restoreDrillReceiptSchema.safeParse({
        ...receipt,
        evidence_id: 'evidence:restore-drill:missing-service-proof',
        payload: {
          ...receipt.payload,
          service_verification_evidence_refs: [],
        },
      }).success,
    ).toBe(false);
    expect(
      restoreDrillReceiptSchema.safeParse({
        ...receipt,
        evidence_id: 'evidence:restore-drill:sandbox-boot-proof',
        payload: {
          ...receipt.payload,
          boot_verification_evidence_refs: [
            {
              ...bootVerificationEvidenceRef,
              evidence_id: 'evidence:restore-drill:sandbox-boot-proof',
              authority: 'sandbox-observation',
            },
          ],
        },
      }).success,
    ).toBe(false);
    expect(
      restoreDrillReceiptSchema.safeParse({
        ...receipt,
        evidence_id: 'evidence:restore-drill:service-proof-without-freshness',
        payload: {
          ...receipt.payload,
          service_verification_evidence_refs: [
            {
              evidence_id: 'evidence:restore-drill:missing-service-valid-until',
              source: 'backup-readiness-fixture',
              observed_at: observedAt,
              authority: 'host-observation',
              confidence: 'high',
              parser_version: 'backup-readiness-parser:v1',
            },
          ],
        },
      }).success,
    ).toBe(false);
    expect(
      restoreDrillReceiptSchema.safeParse({
        ...receipt,
        evidence_id: 'evidence:restore-drill:inline-dump',
        payload: {
          ...receipt.payload,
          restored_data_sample: 'not allowed',
        },
      }).success,
    ).toBe(false);
  });

  it('keeps backup credential custody reference-only', () => {
    const custody = backupCredentialCustodyObservationSchema.parse({
      schema_version: '0.9.0',
      evidence_id: 'evidence:backup-credential-custody:hcs',
      evidence_kind: 'observation',
      subject_refs: [
        {
          subject_kind: 'credential_source',
          subject_id: credentialSourceId,
        },
      ],
      source: 'backup-credential-custody-fixture',
      observed_at: observedAt,
      valid_until: validUntil,
      authority: 'host-observation',
      confidence: 'high',
      parser_version: 'backup-credential-custody-parser:v1',
      workspace_id: workspaceId,
      payload_schema_version: 'backup_credential_custody_observation:v1',
      payload: {
        credential_source_id: credentialSourceId,
        backup_surface_ref: targetRef,
        runtime_read_pattern_source_ref: {
          ...threatModelSourceRef,
          source_kind: 'runbook',
        },
        break_glass_recovery_path_source_ref: {
          ...threatModelSourceRef,
          source_kind: 'runbook',
        },
        secret_reference_evidence_refs: [secretReferenceEvidenceRef],
        custody_posture_kind: 'brokered_runtime_read',
        expiry_posture_kind: 'expires',
        rotation_posture_kind: 'rotating',
        auditability_kind: 'audit_log_available',
        credential_authority_evidence_refs: [credentialAuthorityEvidenceRef],
        machine_identity_binding_evidence_refs: [machineIdentityBindingEvidenceRef],
      },
      redaction_mode: 'reference_only',
    });

    expect(custody.payload.credential_source_id).toBe(credentialSourceId);
    expect(
      backupCredentialCustodyObservationSchema.safeParse({
        ...custody,
        evidence_id: 'evidence:backup-credential-custody:inline-procedure',
        payload: {
          ...custody.payload,
          break_glass_recovery_path: 'not allowed',
        },
      }).success,
    ).toBe(false);
    expect(
      backupCredentialCustodyObservationSchema.safeParse({
        ...custody,
        evidence_id: 'evidence:backup-credential-custody:no-redaction',
        redaction_mode: 'none',
      }).success,
    ).toBe(false);
    expect(
      backupCredentialCustodyObservationSchema.safeParse({
        ...custody,
        evidence_id: 'evidence:backup-credential-custody:sandbox-secret-ref',
        payload: {
          ...custody.payload,
          secret_reference_evidence_refs: [
            {
              ...secretReferenceEvidenceRef,
              evidence_id: 'evidence:backup-secret-reference:sandbox',
              authority: 'sandbox-observation',
            },
          ],
        },
      }).success,
    ).toBe(false);
    expect(
      backupCredentialCustodyObservationSchema.safeParse({
        ...custody,
        evidence_id: 'evidence:backup-credential-custody:secret-ref-without-freshness',
        payload: {
          ...custody.payload,
          secret_reference_evidence_refs: [
            {
              evidence_id: 'evidence:backup-secret-reference:missing-valid-until',
              source: 'backup-readiness-fixture',
              observed_at: observedAt,
              authority: 'host-observation',
              confidence: 'high',
              parser_version: 'backup-readiness-parser:v1',
            },
          ],
        },
      }).success,
    ).toBe(false);
  });

  it('validates project-substrate backup requirements without creating gate authority', () => {
    const requirement = projectSubstrateBackupRequirementObservationSchema.parse({
      schema_version: '0.9.0',
      evidence_id: 'evidence:project-backup-requirement:hcs',
      evidence_kind: 'observation',
      subject_refs: [
        {
          subject_kind: 'workspace',
          subject_id: workspaceId,
        },
        {
          subject_kind: 'knowledge_source',
          subject_id: knowledgeSourceId,
        },
      ],
      source: 'project-backup-requirement-fixture',
      observed_at: observedAt,
      valid_until: validUntil,
      authority: 'host-observation',
      confidence: 'high',
      parser_version: 'project-backup-requirement-parser:v1',
      workspace_id: workspaceId,
      payload_schema_version: 'project_substrate_backup_requirement_observation:v1',
      payload: {
        workspace_id: workspaceId,
        knowledge_source_id: knowledgeSourceId,
        contract_content_hash: contractHash,
        persistent_data_kind: 'disposable_rebuildable',
        required_storage_class_kind: 'backup_repository',
        required_readiness_state_kind: 'ready',
        require_restore_drill_before_active_use: true,
        rpo_seconds: 300,
        rto_seconds: 120,
        data_minimization_posture_kind: 'bounded',
        retention_expectation_kind: 'delete_after_expiry',
        teardown_expectation_kind: 'teardown_required',
        disposability_declared: true,
        contract_validation_evidence_ref: contractValidationEvidenceRef,
        admission_evidence_ref: admissionEvidenceRef,
        backup_readiness_evidence_refs: [backupReadinessEvidenceRef],
        restore_drill_evidence_refs: [restoreDrillEvidenceRef],
        teardown_evidence_refs: [teardownEvidenceRef],
      },
      redaction_mode: 'reference_only',
    });

    expect(requirement.payload.persistent_data_kind).toBe('disposable_rebuildable');
    expect(
      projectSubstrateBackupRequirementObservationSchema.safeParse({
        ...requirement,
        evidence_id: 'evidence:project-backup-requirement:no-teardown',
        payload: {
          ...requirement.payload,
          teardown_evidence_refs: [],
        },
      }).success,
    ).toBe(false);
    expect(
      projectSubstrateBackupRequirementObservationSchema.safeParse({
        ...requirement,
        evidence_id: 'evidence:project-backup-requirement:sandbox-teardown',
        payload: {
          ...requirement.payload,
          teardown_evidence_refs: [
            {
              ...teardownEvidenceRef,
              evidence_id: 'evidence:project-teardown:sandbox',
              authority: 'sandbox-observation',
            },
          ],
        },
      }).success,
    ).toBe(false);
    expect(
      projectSubstrateBackupRequirementObservationSchema.safeParse({
        ...requirement,
        evidence_id: 'evidence:project-backup-requirement:wrong-contract-ref-kind',
        payload: {
          ...requirement.payload,
          contract_validation_evidence_ref: {
            ...contractValidationEvidenceRef,
            payload_schema_version: 'project_substrate_admission_observation:v1',
          },
        },
      }).success,
    ).toBe(false);
    expect(
      projectSubstrateBackupRequirementObservationSchema.safeParse({
        ...requirement,
        evidence_id: 'evidence:project-backup-requirement:gate-kind',
        payload: {
          ...requirement.payload,
          gate_kind: 'backup_readiness',
        },
      }).success,
    ).toBe(false);
  });

  it('keeps generated JSON Schema guards for Q-015 conditional invariants', () => {
    const backupReadinessSchema = readGeneratedSchema('BackupReadinessObservation.schema.json');
    const readyGuard = findGeneratedPayloadGuard(
      backupReadinessSchema,
      'readiness_state_kind',
      'ready',
    );
    const readyThenPayloadProperties = recordAt(
      recordAt(recordAt(readyGuard, 'then'), 'properties'),
      'payload',
    );
    const readyThenProperties = recordAt(readyThenPayloadProperties, 'properties');

    expect(recordAt(readyThenProperties, 'restore_drill_evidence_refs').minItems).toBe(1);
    expect(recordAt(readyThenProperties, 'tombstone_state_kind').const).toBe('not_tombstoned');

    const restoreDrillRefSchema = recordAt(
      generatedPayloadProperties(backupReadinessSchema),
      'restore_drill_evidence_refs',
    );
    const restoreDrillRefItems = recordAt(restoreDrillRefSchema, 'items');
    expect(asArray(restoreDrillRefItems.required)).toEqual(
      expect.arrayContaining(['valid_until', 'parser_version', 'payload_schema_version']),
    );
    expect(
      asArray(recordAt(recordAt(restoreDrillRefItems, 'properties'), 'authority').enum),
    ).not.toContain('sandbox-observation');
    expect(
      recordAt(recordAt(restoreDrillRefItems, 'properties'), 'payload_schema_version').const,
    ).toBe('restore_drill_receipt:v1');

    const restoreSchema = readGeneratedSchema('RestoreDrillReceipt.schema.json');
    const succeededGuard = findGeneratedPayloadGuard(
      restoreSchema,
      'drill_result_kind',
      'succeeded',
    );
    const succeededThenProperties = recordAt(
      recordAt(
        recordAt(recordAt(recordAt(succeededGuard, 'then'), 'properties'), 'payload'),
        'properties',
      ),
      'boot_verification_evidence_refs',
    );
    expect(succeededThenProperties.minItems).toBe(1);

    const requirementSchema = readGeneratedSchema(
      'ProjectSubstrateBackupRequirementObservation.schema.json',
    );
    const disposableGuard = findGeneratedPayloadGuard(
      requirementSchema,
      'persistent_data_kind',
      'disposable_rebuildable',
    );
    const disposableThenProperties = recordAt(
      recordAt(recordAt(recordAt(disposableGuard, 'then'), 'properties'), 'payload'),
      'properties',
    );
    expect(recordAt(disposableThenProperties, 'disposability_declared').const).toBe(true);
    expect(recordAt(disposableThenProperties, 'teardown_evidence_refs').minItems).toBe(1);
  });
});
