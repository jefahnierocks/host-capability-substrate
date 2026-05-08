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

const evidenceRef = {
  evidence_id: 'evidence:backup:source',
  source: 'backup-readiness-fixture',
  observed_at: observedAt,
  valid_until: validUntil,
  authority: 'host-observation',
  confidence: 'high',
  parser_version: 'backup-readiness-parser:v1',
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
    restore_drill_evidence_refs: [evidenceRef],
    backup_operation_evidence_refs: [evidenceRef],
    monitoring_evidence_refs: [evidenceRef],
    credential_custody_evidence_refs: [evidenceRef],
    threat_model_source_refs: [threatModelSourceRef],
    project_backup_requirement_evidence_refs: [evidenceRef],
  },
  redaction_mode: 'reference_only',
} as const;

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
        source_artifact_evidence_refs: [evidenceRef],
        boot_verification_evidence_refs: [evidenceRef],
        service_verification_evidence_refs: [evidenceRef],
        cleanup_evidence_refs: [evidenceRef],
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
        secret_reference_evidence_refs: [evidenceRef],
        custody_posture_kind: 'brokered_runtime_read',
        expiry_posture_kind: 'expires',
        rotation_posture_kind: 'rotating',
        auditability_kind: 'audit_log_available',
        credential_authority_evidence_refs: [evidenceRef],
        machine_identity_binding_evidence_refs: [evidenceRef],
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
        contract_validation_evidence_ref: evidenceRef,
        admission_evidence_ref: evidenceRef,
        backup_readiness_evidence_refs: [evidenceRef],
        restore_drill_evidence_refs: [evidenceRef],
        teardown_evidence_refs: [evidenceRef],
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
        evidence_id: 'evidence:project-backup-requirement:gate-kind',
        payload: {
          ...requirement.payload,
          gate_kind: 'backup_readiness',
        },
      }).success,
    ).toBe(false);
  });
});
