import { describe, expect, it } from 'vitest';
import {
  credentialAuthorityObservationSchema,
  evidenceSchema,
  machineIdentityBindingObservationSchema,
} from '../src/index.ts';

const observedAt = '2026-05-07T00:00:00Z';
const validUntil = '2026-05-07T01:00:00Z';
const credentialSourceId = 'credential-source:onepassword:hcs-ci';
const authoritySurfaceRef = 'authority-surface:secret-store:hcs-ci';
const executionContextId = 'ctx:project-substrate:admission';

const credentialSourceEvidenceRef = {
  evidence_id: 'evidence:credential-source:hcs-ci',
  source: 'CredentialSource:hcs-ci',
  observed_at: observedAt,
  valid_until: validUntil,
  authority: 'host-observation',
  confidence: 'high',
} as const;

const credentialAuthorityEvidenceRef = {
  evidence_id: 'evidence:credential-authority:hcs-ci',
  source: 'CredentialAuthorityObservation:hcs-ci',
  observed_at: observedAt,
  valid_until: validUntil,
  authority: 'host-observation',
  confidence: 'high',
} as const;

const boundaryEvidenceRef = {
  evidence_id: 'bo:credential-source:hcs-ci',
  source: 'BoundaryObservation:credential-source:hcs-ci',
  observed_at: observedAt,
  valid_until: validUntil,
  authority: 'host-observation',
  confidence: 'high',
} as const;

const credentialAuthority = {
  schema_version: '0.10.0',
  evidence_id: 'evidence:credential-authority:hcs-ci',
  evidence_kind: 'observation',
  subject_refs: [
    {
      subject_kind: 'credential_source',
      subject_id: credentialSourceId,
    },
  ],
  source: 'credential-authority-fixture',
  observed_at: observedAt,
  valid_until: validUntil,
  authority: 'host-observation',
  confidence: 'high',
  parser_version: 'credential-authority-parser:v1',
  workspace_id: 'workspace:hcs',
  payload_schema_version: 'credential_authority_observation:v1',
  payload: {
    credential_source_id: credentialSourceId,
    credential_source_type: 'onepassword',
    credential_storage_plane: 'external_secret_store',
    authority_surface_kind: 'secret_store',
    authority_surface_ref: authoritySurfaceRef,
    scope_posture_kind: 'bounded',
    audience_posture_kind: 'single_audience',
    expiry_posture_kind: 'expires',
    rotation_posture_kind: 'rotating',
    health_status: 'healthy',
    health_checked_at: observedAt,
    auditability_kind: 'audit_log_available',
    credential_source_evidence_ref: credentialSourceEvidenceRef,
    boundary_evidence_refs: [boundaryEvidenceRef],
  },
  redaction_mode: 'reference_only',
} as const;

describe('ADR 0043 Q-013 credential-plane evidence subtypes', () => {
  it('validates CredentialAuthorityObservation with non-null freshness', () => {
    const obs = credentialAuthorityObservationSchema.parse(credentialAuthority);

    expect(obs.payload.credential_source_id).toBe(credentialSourceId);
    expect(
      credentialAuthorityObservationSchema.safeParse({
        ...credentialAuthority,
        evidence_id: 'evidence:credential-authority:stale',
        valid_until: null,
      }).success,
    ).toBe(false);
  });

  it('rejects CredentialAuthorityObservation subject refs that omit the source id', () => {
    expect(
      credentialAuthorityObservationSchema.safeParse({
        ...credentialAuthority,
        evidence_id: 'evidence:credential-authority:mismatch',
        subject_refs: [
          {
            subject_kind: 'credential_source',
            subject_id: 'credential-source:other',
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('keeps credential authority payload strict and reference-only', () => {
    expect(
      credentialAuthorityObservationSchema.safeParse({
        ...credentialAuthority,
        evidence_id: 'evidence:credential-authority:inline-secret',
        payload: {
          ...credentialAuthority.payload,
          secret_value: 'not allowed',
        },
      }).success,
    ).toBe(false);
    expect(
      credentialAuthorityObservationSchema.safeParse({
        ...credentialAuthority,
        evidence_id: 'evidence:credential-authority:inline-provider-item',
        payload: {
          ...credentialAuthority.payload,
          provider_item_body: 'not allowed',
        },
      }).success,
    ).toBe(false);
    expect(
      credentialAuthorityObservationSchema.safeParse({
        ...credentialAuthority,
        evidence_id: 'evidence:credential-authority:no-redaction',
        redaction_mode: 'none',
      }).success,
    ).toBe(false);
  });

  it('validates MachineIdentityBindingObservation with both subject refs', () => {
    const obs = machineIdentityBindingObservationSchema.parse({
      schema_version: '0.10.0',
      evidence_id: 'evidence:machine-identity-binding:hcs-ci',
      evidence_kind: 'observation',
      subject_refs: [
        {
          subject_kind: 'machine_identity',
          subject_id: 'machine-identity:provider-principal:hcs-ci',
        },
        {
          subject_kind: 'credential_source',
          subject_id: credentialSourceId,
          relation: 'uses',
        },
      ],
      source: 'machine-identity-binding-fixture',
      observed_at: observedAt,
      valid_until: validUntil,
      authority: 'host-observation',
      confidence: 'high',
      parser_version: 'machine-identity-binding-parser:v1',
      execution_context_id: executionContextId,
      workspace_id: 'workspace:hcs',
      payload_schema_version: 'machine_identity_binding_observation:v1',
      payload: {
        machine_identity_kind: 'provider_principal',
        machine_identity_ref: 'machine-identity:provider-principal:hcs-ci',
        credential_source_id: credentialSourceId,
        authority_surface_kind: 'identity_provider',
        authority_surface_ref: authoritySurfaceRef,
        issuer_posture_kind: 'platform_native',
        audience_posture_kind: 'single_audience',
        expiry_posture_kind: 'expires',
        rotation_posture_kind: 'rotating',
        binding_status_kind: 'observed_bound',
        execution_context_id: executionContextId,
        identity_observed_at: observedAt,
        credential_authority_evidence_ref: credentialAuthorityEvidenceRef,
        boundary_evidence_refs: [boundaryEvidenceRef],
      },
      redaction_mode: 'reference_only',
    });

    expect(obs.payload.machine_identity_kind).toBe('provider_principal');
    expect(
      machineIdentityBindingObservationSchema.safeParse({
        ...obs,
        evidence_id: 'evidence:machine-identity-binding:wrong-context',
        payload: {
          ...obs.payload,
          execution_context_id: 'ctx:other',
        },
      }).success,
    ).toBe(false);
    expect(
      machineIdentityBindingObservationSchema.safeParse({
        ...obs,
        evidence_id: 'evidence:machine-identity-binding:stale',
        valid_until: null,
      }).success,
    ).toBe(false);
    expect(
      machineIdentityBindingObservationSchema.safeParse({
        ...obs,
        evidence_id: 'evidence:machine-identity-binding:no-redaction',
        redaction_mode: 'none',
      }).success,
    ).toBe(false);
    expect(
      machineIdentityBindingObservationSchema.safeParse({
        ...obs,
        evidence_id: 'evidence:machine-identity-binding:inline-secret',
        payload: {
          ...obs.payload,
          private_key: 'not allowed',
        },
      }).success,
    ).toBe(false);
  });

  it('rejects missing machine-identity subject refs and provider-specific kinds', () => {
    const binding = machineIdentityBindingObservationSchema.parse({
      schema_version: '0.10.0',
      evidence_id: 'evidence:machine-identity-binding:hcs-ci-2',
      evidence_kind: 'observation',
      subject_refs: [
        {
          subject_kind: 'machine_identity',
          subject_id: 'machine-identity:federated:hcs-ci',
        },
        {
          subject_kind: 'credential_source',
          subject_id: credentialSourceId,
        },
      ],
      source: 'machine-identity-binding-fixture',
      observed_at: observedAt,
      valid_until: validUntil,
      authority: 'host-observation',
      confidence: 'high',
      parser_version: 'machine-identity-binding-parser:v1',
      execution_context_id: executionContextId,
      payload_schema_version: 'machine_identity_binding_observation:v1',
      payload: {
        machine_identity_kind: 'federated_subject',
        machine_identity_ref: 'machine-identity:federated:hcs-ci',
        credential_source_id: credentialSourceId,
        authority_surface_kind: 'identity_provider',
        authority_surface_ref: authoritySurfaceRef,
        issuer_posture_kind: 'federated',
        audience_posture_kind: 'single_audience',
        expiry_posture_kind: 'expires',
        rotation_posture_kind: 'rotating',
        binding_status_kind: 'observed_bound',
        execution_context_id: executionContextId,
        identity_observed_at: observedAt,
        credential_authority_evidence_ref: credentialAuthorityEvidenceRef,
      },
      redaction_mode: 'reference_only',
    });

    expect(
      machineIdentityBindingObservationSchema.safeParse({
        ...binding,
        evidence_id: 'evidence:machine-identity-binding:missing-subject',
        subject_refs: [
          {
            subject_kind: 'credential_source',
            subject_id: credentialSourceId,
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      machineIdentityBindingObservationSchema.safeParse({
        ...binding,
        evidence_id: 'evidence:machine-identity-binding:provider-kind',
        payload: {
          ...binding.payload,
          machine_identity_kind: 'github_app',
        },
      }).success,
    ).toBe(false);
    expect(
      machineIdentityBindingObservationSchema.safeParse({
        ...binding,
        evidence_id: 'evidence:machine-identity-binding:jwt-ref',
        payload: {
          ...binding.payload,
          machine_identity_ref: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJjaSJ9.signature',
        },
      }).success,
    ).toBe(false);
    expect(
      machineIdentityBindingObservationSchema.safeParse({
        ...binding,
        evidence_id: 'evidence:machine-identity-binding:ssh-agent-state',
        payload: {
          ...binding.payload,
          human_ssh_agent_state: 'not allowed',
        },
      }).success,
    ).toBe(false);
  });

  it('widens the base Evidence subject-kind enum for machine identity', () => {
    const generic = evidenceSchema.parse({
      schema_version: '0.10.0',
      evidence_id: 'evidence:machine-identity:generic',
      evidence_kind: 'observation',
      subject_refs: [
        {
          subject_kind: 'machine_identity',
          subject_id: 'machine-identity:generic',
        },
      ],
      source: 'machine-identity-generic-fixture',
      observed_at: observedAt,
      valid_until: validUntil,
      authority: 'host-observation',
      confidence: 'high',
      parser_version: 'machine-identity-parser:v1',
    });

    expect(generic.subject_refs[0]?.subject_kind).toBe('machine_identity');
  });
});
