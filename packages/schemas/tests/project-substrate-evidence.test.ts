import { describe, expect, it } from 'vitest';
import {
  evidenceSchema,
  projectSubstrateAdmissionObservationSchema,
  projectSubstrateContractValidationReceiptSchema,
  projectTeardownCompletionReceiptSchema,
  projectTeardownPlanReceiptSchema,
} from '../src/index.ts';

const observedAt = '2026-05-07T00:00:00Z';
const validUntil = '2026-05-07T01:00:00Z';
const workspaceId = 'workspace:host-capability-substrate';
const knowledgeSourceId = 'knowledge-source:project-substrate-contract:hcs';
const contractHash = 'sha256:abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd';

const evidenceRef = {
  evidence_id: 'evidence:project-substrate:source',
  source: 'project-substrate-fixture',
  observed_at: observedAt,
  valid_until: validUntil,
  authority: 'host-observation',
  confidence: 'high',
  parser_version: 'project-substrate-parser:v1',
} as const;

const deletionAuthorityEvidenceRef = {
  ...evidenceRef,
  evidence_id: 'evidence:deletion-authority:hcs',
  source: 'D-025 deletion authority fixture',
} as const;

const contractValidation = {
  schema_version: '0.10.0',
  evidence_id: 'evidence:project-substrate-contract-validation:hcs',
  evidence_kind: 'receipt',
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
  source: 'project-substrate-contract-validation-fixture',
  observed_at: observedAt,
  valid_until: validUntil,
  authority: 'host-observation',
  confidence: 'high',
  parser_version: 'project-substrate-contract-validator:v1',
  workspace_id: workspaceId,
  payload_schema_version: 'project_substrate_contract_validation_receipt:v1',
  payload: {
    workspace_id: workspaceId,
    knowledge_source_id: knowledgeSourceId,
    contract_content_hash: contractHash,
    validation_run_id: 'validation-run:project-substrate:hcs',
    standard_ref: 'standard:project-substrate:external-standard-pr-37',
    standard_version: '2026-05-06',
    validation_outcome_kind: 'valid',
    checked_field_paths: ['status', 'guardian_approval', 'secret_refs'],
    secret_reference_posture_kind: 'reference_only',
    contract_source_evidence_ref: evidenceRef,
    structural_evidence_refs: [evidenceRef],
  },
  redaction_mode: 'reference_only',
} as const;

describe('ADR 0044 Q-014 project-substrate evidence subtypes', () => {
  it('validates ProjectSubstrateContractValidationReceipt with contract source binding', () => {
    const receipt = projectSubstrateContractValidationReceiptSchema.parse(contractValidation);

    expect(receipt.payload.knowledge_source_id).toBe(knowledgeSourceId);
    expect(
      projectSubstrateContractValidationReceiptSchema.safeParse({
        ...contractValidation,
        evidence_id: 'evidence:project-substrate-contract-validation:missing-knowledge',
        subject_refs: [
          {
            subject_kind: 'workspace',
            subject_id: workspaceId,
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      projectSubstrateContractValidationReceiptSchema.safeParse({
        ...contractValidation,
        evidence_id: 'evidence:project-substrate-contract-validation:stale',
        valid_until: null,
      }).success,
    ).toBe(false);
    expect(
      projectSubstrateContractValidationReceiptSchema.safeParse({
        ...contractValidation,
        evidence_id: 'evidence:project-substrate-contract-validation:inline-secret',
        payload: {
          ...contractValidation.payload,
          resolved_secret_value: 'not allowed',
        },
      }).success,
    ).toBe(false);
  });

  it('allows sandbox authority only for contract parser observations', () => {
    expect(
      projectSubstrateContractValidationReceiptSchema.safeParse({
        ...contractValidation,
        evidence_id: 'evidence:project-substrate-contract-validation:sandbox-parser',
        authority: 'sandbox-observation',
        execution_context_id: 'ctx:sandbox:parser',
        source_ref: 'repo://project-substrate-contract.yaml',
      }).success,
    ).toBe(true);
  });

  it('validates ProjectSubstrateAdmissionObservation without creating gate authority', () => {
    const admission = projectSubstrateAdmissionObservationSchema.parse({
      schema_version: '0.10.0',
      evidence_id: 'evidence:project-substrate-admission:hcs',
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
      source: 'project-substrate-admission-fixture',
      observed_at: observedAt,
      valid_until: validUntil,
      authority: 'host-observation',
      confidence: 'high',
      parser_version: 'project-substrate-admission:v1',
      workspace_id: workspaceId,
      payload_schema_version: 'project_substrate_admission_observation:v1',
      payload: {
        workspace_id: workspaceId,
        knowledge_source_id: knowledgeSourceId,
        contract_content_hash: contractHash,
        contract_lifecycle_status: 'active',
        admission_state_kind: 'observed_admissible',
        admission_observed_at: observedAt,
        contract_validation_evidence_ref: evidenceRef,
        project_admission_authority_boundary_ref: evidenceRef,
        credential_authority_evidence_refs: [evidenceRef],
        machine_identity_binding_evidence_refs: [evidenceRef],
        boundary_evidence_refs: [evidenceRef],
        runner_evidence_refs: [evidenceRef],
        status_check_source_evidence_refs: [evidenceRef],
        resource_budget_evidence_refs: [evidenceRef],
        policy_plan_evidence_refs: [evidenceRef],
        no_secret_material_observed: true,
      },
      redaction_mode: 'reference_only',
    });

    expect(admission.payload.contract_lifecycle_status).toBe('active');
    expect(
      projectSubstrateAdmissionObservationSchema.safeParse({
        ...admission,
        evidence_id: 'evidence:project-substrate-admission:sandbox',
        authority: 'sandbox-observation',
        execution_context_id: 'ctx:sandbox:admission',
        source_ref: 'repo://project-substrate-contract.yaml',
      }).success,
    ).toBe(false);
    expect(
      projectSubstrateAdmissionObservationSchema.safeParse({
        ...admission,
        evidence_id: 'evidence:project-substrate-admission:gate-launder',
        allowed_for_gate: true,
      }).success,
    ).toBe(false);
    expect(
      projectSubstrateAdmissionObservationSchema.safeParse({
        ...admission,
        evidence_id: 'evidence:project-substrate-admission:approval-grant',
        payload: {
          ...admission.payload,
          approval_grant_id: 'approval-grant:guardian',
        },
      }).success,
    ).toBe(false);
  });

  it('validates teardown receipts only with deletion-authority evidence', () => {
    const plan = projectTeardownPlanReceiptSchema.parse({
      schema_version: '0.10.0',
      evidence_id: 'evidence:project-teardown-plan:hcs',
      evidence_kind: 'receipt',
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
      source: 'project-teardown-plan-fixture',
      observed_at: observedAt,
      valid_until: validUntil,
      authority: 'host-observation',
      confidence: 'high',
      parser_version: 'project-teardown-plan:v1',
      workspace_id: workspaceId,
      payload_schema_version: 'project_teardown_plan_receipt:v1',
      payload: {
        workspace_id: workspaceId,
        knowledge_source_id: knowledgeSourceId,
        contract_content_hash: contractHash,
        teardown_plan_id: 'teardown-plan:hcs',
        teardown_scope_kind: 'full_project',
        target_refs: ['provider-object:project:hcs'],
        retention_expectation_kind: 'tombstone',
        data_minimization_posture_kind: 'bounded',
        planned_at: observedAt,
        deletion_authority_evidence_refs: [deletionAuthorityEvidenceRef],
        contract_validation_evidence_ref: evidenceRef,
        admission_evidence_ref: evidenceRef,
        approval_evidence_refs: [evidenceRef],
      },
      redaction_mode: 'reference_only',
    });

    expect(plan.payload.deletion_authority_evidence_refs).toHaveLength(1);
    expect(
      projectTeardownPlanReceiptSchema.safeParse({
        ...plan,
        evidence_id: 'evidence:project-teardown-plan:no-authority',
        payload: {
          ...plan.payload,
          deletion_authority_evidence_refs: [],
        },
      }).success,
    ).toBe(false);
    expect(
      projectTeardownPlanReceiptSchema.safeParse({
        ...plan,
        evidence_id: 'evidence:project-teardown-plan:gitignore-authority',
        payload: {
          ...plan.payload,
          deletion_authority_kind: 'gitignore',
        },
      }).success,
    ).toBe(false);
    expect(
      projectTeardownPlanReceiptSchema.safeParse({
        ...plan,
        evidence_id: 'evidence:project-teardown-plan:sandbox',
        authority: 'sandbox-observation',
        execution_context_id: 'ctx:sandbox:teardown',
        source_ref: 'repo://project-substrate-contract.yaml',
      }).success,
    ).toBe(false);
  });

  it('validates ProjectTeardownCompletionReceipt without readiness promotion fields', () => {
    const completion = projectTeardownCompletionReceiptSchema.parse({
      schema_version: '0.10.0',
      evidence_id: 'evidence:project-teardown-completion:hcs',
      evidence_kind: 'receipt',
      subject_refs: [
        {
          subject_kind: 'workspace',
          subject_id: workspaceId,
        },
      ],
      source: 'project-teardown-completion-fixture',
      observed_at: observedAt,
      valid_until: validUntil,
      authority: 'host-observation',
      confidence: 'high',
      parser_version: 'project-teardown-completion:v1',
      workspace_id: workspaceId,
      payload_schema_version: 'project_teardown_completion_receipt:v1',
      payload: {
        workspace_id: workspaceId,
        teardown_plan_id: 'teardown-plan:hcs',
        teardown_completed_at: observedAt,
        completion_state_kind: 'completed',
        completion_evidence_refs: [evidenceRef],
        deletion_authority_evidence_refs: [deletionAuthorityEvidenceRef],
        removed_target_refs: ['provider-object:project:hcs'],
        retained_target_refs: ['provider-object:tombstone:hcs'],
        residual_risk_kind: 'accepted',
        tombstone_state_kind: 'tombstone_recorded',
      },
      redaction_mode: 'reference_only',
    });

    expect(completion.payload.completion_state_kind).toBe('completed');
    expect(
      projectTeardownCompletionReceiptSchema.safeParse({
        ...completion,
        evidence_id: 'evidence:project-teardown-completion:ready-launder',
        payload: {
          ...completion.payload,
          readiness_state_kind: 'ready',
        },
      }).success,
    ).toBe(false);
    expect(
      projectTeardownCompletionReceiptSchema.safeParse({
        ...completion,
        evidence_id: 'evidence:project-teardown-completion:proof-receipt',
        payload_schema_version: 'project_teardown_proof_receipt:v1',
      }).success,
    ).toBe(false);
  });

  it('does not add receipt-envelope subject kinds to base Evidence', () => {
    expect(
      evidenceSchema.safeParse({
        schema_version: '0.10.0',
        evidence_id: 'evidence:bad-project-substrate-subject',
        evidence_kind: 'receipt',
        subject_refs: [
          {
            subject_kind: 'project_substrate_contract_validation_receipt',
            subject_id: 'evidence:bad-project-substrate-subject',
          },
        ],
        source: 'bad-subject-kind-fixture',
        observed_at: observedAt,
        valid_until: validUntil,
        authority: 'host-observation',
        confidence: 'high',
        parser_version: 'bad-subject-kind:v1',
      }).success,
    ).toBe(false);
  });
});
