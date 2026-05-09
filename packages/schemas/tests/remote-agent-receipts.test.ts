import { describe, expect, it } from 'vitest';
import {
  evidenceSchema,
  remoteAgentBaseImageObservationSchema,
  remoteAgentNetworkPostureObservationSchema,
  remoteAgentSetupReceiptSchema,
} from '../src/index.ts';

const observedAt = '2026-05-06T00:00:00Z';
const validUntil = '2026-05-06T00:30:00Z';
const executionContextId = 'ctx:remote-agent:task-1';
const agentClientId = 'agent-client:codex-cloud:build-1';
const digest = `sha256:${'a'.repeat(64)}`;

const containmentEvidenceRef = {
  evidence_id: 'bo:containment:remote-agent:task-1',
  source: 'containment-class-fixture',
  observed_at: observedAt,
  valid_until: validUntil,
  authority: 'derived',
  confidence: 'high',
} as const;

const vendorEvidenceRef = {
  evidence_id: 'evidence:status-check-source:remote-agent',
  source: 'status-check-source-fixture',
  observed_at: observedAt,
  valid_until: validUntil,
  authority: 'derived',
  confidence: 'high',
} as const;

const baseRemoteAgentEvidence = {
  schema_version: '0.10.0',
  source: 'remote-agent-fixture',
  observed_at: observedAt,
  valid_until: validUntil,
  authority: 'derived',
  confidence: 'high',
  parser_version: 'remote-agent-parser:v1',
  execution_context_id: executionContextId,
  workspace_id: 'workspace:hcs',
} as const;

describe('ADR 0037 Q-010 remote-agent evidence subtypes', () => {
  it('validates RemoteAgentBaseImageObservation and rejects checkout commit duplication', () => {
    const obs = remoteAgentBaseImageObservationSchema.parse({
      ...baseRemoteAgentEvidence,
      evidence_id: 'evidence:remote-agent-base-image:task-1',
      evidence_kind: 'observation',
      subject_refs: [
        {
          subject_kind: 'remote_agent_base_image',
          subject_id: 'remote-agent-base-image:task-1',
        },
      ],
      payload_schema_version: 'remote-agent-base-image-observation:v1',
      payload: {
        base_image_id: 'remote-agent-base-image:task-1',
        agent_client_id: agentClientId,
        execution_context_id: executionContextId,
        containment_boundary_evidence_ref: containmentEvidenceRef,
        base_image_kind: 'container_image',
        base_image_digest: digest,
        base_image_provenance: 'vendor_managed',
        image_published_at: '2026-05-05T00:00:00Z',
        vendor_observed_via_evidence_ref: vendorEvidenceRef,
      },
      redaction_mode: 'reference_only',
    });

    expect(obs.payload.base_image_digest).toBe(digest);
    expect(
      remoteAgentBaseImageObservationSchema.safeParse({
        ...obs,
        evidence_id: 'evidence:remote-agent-base-image:with-checkout',
        payload: {
          ...obs.payload,
          checkout_commit_sha: '0123456789abcdef0123456789abcdef01234567',
        },
      }).success,
    ).toBe(false);
  });

  it('requires derived authority and non-null freshness on remote-agent records', () => {
    const receipt = {
      ...baseRemoteAgentEvidence,
      evidence_id: 'evidence:remote-agent-setup:task-1',
      evidence_kind: 'receipt',
      subject_refs: [
        {
          subject_kind: 'remote_agent_setup',
          subject_id: 'remote-agent-setup:task-1',
        },
      ],
      payload_schema_version: 'remote-agent-setup-receipt:v1',
      payload: {
        setup_execution_id: 'remote-agent-setup:task-1',
        agent_client_id: agentClientId,
        execution_context_id: executionContextId,
        containment_boundary_evidence_ref: containmentEvidenceRef,
        setup_script_evidence_ref: vendorEvidenceRef,
        setup_exit_code: 0,
        setup_observed_at: observedAt,
        secret_injection_kind: 'brokered_at_request',
        setup_duration_ms: 1200,
        setup_log_evidence_ref: vendorEvidenceRef,
      },
    } as const;

    expect(remoteAgentSetupReceiptSchema.parse(receipt).payload.secret_injection_kind).toBe(
      'brokered_at_request',
    );
    expect(
      remoteAgentSetupReceiptSchema.safeParse({
        ...receipt,
        evidence_id: 'evidence:remote-agent-setup:host-authority',
        authority: 'host-observation',
      }).success,
    ).toBe(false);
    expect(
      remoteAgentSetupReceiptSchema.safeParse({
        ...receipt,
        evidence_id: 'evidence:remote-agent-setup:stale-shape',
        valid_until: null,
      }).success,
    ).toBe(false);
  });

  it('keeps setup logs reference-only and preserves none_required naming', () => {
    const receipt = remoteAgentSetupReceiptSchema.parse({
      ...baseRemoteAgentEvidence,
      evidence_id: 'evidence:remote-agent-setup:none-required',
      evidence_kind: 'receipt',
      subject_refs: [
        {
          subject_kind: 'remote_agent_setup',
          subject_id: 'remote-agent-setup:none-required',
        },
      ],
      payload_schema_version: 'remote-agent-setup-receipt:v1',
      payload: {
        setup_execution_id: 'remote-agent-setup:none-required',
        agent_client_id: agentClientId,
        execution_context_id: executionContextId,
        containment_boundary_evidence_ref: containmentEvidenceRef,
        setup_script_evidence_ref: vendorEvidenceRef,
        setup_exit_code: 0,
        setup_observed_at: observedAt,
        secret_injection_kind: 'none_required',
        setup_duration_ms: 1,
        setup_log_evidence_ref: vendorEvidenceRef,
      },
    });

    expect(receipt.payload.secret_injection_kind).toBe('none_required');
    expect(
      remoteAgentSetupReceiptSchema.safeParse({
        ...receipt,
        evidence_id: 'evidence:remote-agent-setup:inline-log',
        payload: {
          ...receipt.payload,
          setup_log_text: 'inline logs are intentionally outside this schema',
        },
      }).success,
    ).toBe(false);
    expect(
      remoteAgentSetupReceiptSchema.safeParse({
        ...receipt,
        evidence_id: 'evidence:remote-agent-setup:none-value',
        payload: {
          ...receipt.payload,
          secret_injection_kind: 'none',
        },
      }).success,
    ).toBe(false);
  });

  it('validates RemoteAgentNetworkPostureObservation with execution-context binding', () => {
    const obs = remoteAgentNetworkPostureObservationSchema.parse({
      ...baseRemoteAgentEvidence,
      evidence_id: 'evidence:remote-agent-network-posture:task-1',
      evidence_kind: 'observation',
      subject_refs: [
        {
          subject_kind: 'remote_agent_network_posture',
          subject_id: 'remote-agent-network-posture:task-1',
        },
      ],
      payload_schema_version: 'remote-agent-network-posture-observation:v1',
      payload: {
        network_posture_id: 'remote-agent-network-posture:task-1',
        agent_client_id: agentClientId,
        execution_context_id: executionContextId,
        containment_boundary_evidence_ref: containmentEvidenceRef,
        egress_kind: 'proxy_mediated',
        firewall_kind: 'vendor_managed',
        egress_observed_via_evidence_ref: vendorEvidenceRef,
        network_posture_observed_at: observedAt,
      },
    });

    expect(obs.payload.egress_kind).toBe('proxy_mediated');
    expect(
      remoteAgentNetworkPostureObservationSchema.safeParse({
        ...obs,
        evidence_id: 'evidence:remote-agent-network-posture:wrong-context',
        payload: {
          ...obs.payload,
          execution_context_id: 'ctx:remote-agent:other',
        },
      }).success,
    ).toBe(false);
  });

  it('widens the base Evidence subject-kind enum for Q-010 subjects', () => {
    const generic = evidenceSchema.parse({
      ...baseRemoteAgentEvidence,
      evidence_id: 'evidence:remote-agent-generic:setup-subject',
      evidence_kind: 'observation',
      subject_refs: [
        {
          subject_kind: 'remote_agent_setup',
          subject_id: 'remote-agent-setup:generic',
        },
      ],
    });

    expect(generic.subject_refs[0]?.subject_kind).toBe('remote_agent_setup');
  });
});
