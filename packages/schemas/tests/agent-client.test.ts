import { describe, expect, it } from 'vitest';
import { agentClientSchema, executionContextSurfaceSchema } from '../src/index.ts';

const evidenceRef = {
  evidence_id: 'evidence:agent-client-resolver-codex-cli',
  source:
    'docs/host-capability-substrate/adr/0037-q-010-cross-agent-isolation-and-compatibility-taxonomy.md',
  observed_at: '2026-05-04T00:00:00Z',
  authority: 'host-observation',
  confidence: 'high',
} as const;

describe('AgentClient schema', () => {
  it('validates the Phase 2.1.1 AgentClient identity and lifecycle shape', () => {
    const client = agentClientSchema.parse({
      schema_version: '0.1.0',
      agent_client_id: 'agent-client:codex-cli:0.125.0',
      product_family: 'codex',
      surface: 'codex_cli',
      app_build: '0.125.0',
      dep_bundle_version: 'node24.0.0',
      permission_mode: 'default',
      containment_mechanism: 'kernel_sandbox_capable',
      agent_client_state: 'active',
      kernel_observed_at: '2026-05-04T00:00:00Z',
      valid_until: '2026-05-05T00:00:00Z',
      audit_chain_link_hash:
        'sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      evidence_refs: [evidenceRef],
    });

    expect(client.product_family).toBe('codex');
    expect(client.agent_client_state).toBe('active');
  });

  it('keeps build and dependency bundle strings in the ADR 0037 opaque shape', () => {
    expect(
      agentClientSchema.safeParse({
        schema_version: '0.1.0',
        agent_client_id: 'agent-client:bad-build',
        product_family: 'claude_code',
        surface: 'claude_code_cli',
        app_build: '2.1.120 (local)',
        dep_bundle_version: 'node24.0.0',
        permission_mode: 'default',
        containment_mechanism: 'terminal_no_isolation_capable',
        agent_client_state: 'active',
        kernel_observed_at: '2026-05-04T00:00:00Z',
        valid_until: null,
        audit_chain_link_hash:
          'sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        evidence_refs: [evidenceRef],
      }).success,
    ).toBe(false);
  });

  it('accepts remote_cloud_agent as the shared surface enum extension', () => {
    expect(executionContextSurfaceSchema.parse('remote_cloud_agent')).toBe('remote_cloud_agent');

    expect(
      agentClientSchema.parse({
        schema_version: '0.1.0',
        agent_client_id: 'agent-client:devin:remote-cloud',
        product_family: 'devin',
        surface: 'remote_cloud_agent',
        app_build: '2026.05.04',
        dep_bundle_version: 'remote-managed',
        permission_mode: 'approve_all',
        containment_mechanism: 'remote_cloud_managed_capable',
        agent_client_state: 'active',
        kernel_observed_at: '2026-05-04T00:00:00Z',
        valid_until: null,
        audit_chain_link_hash:
          'sha256:abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        evidence_refs: [evidenceRef],
      }).surface,
    ).toBe('remote_cloud_agent');
  });

  it('rejects producer payload extras instead of accepting authority side channels', () => {
    expect(
      agentClientSchema.safeParse({
        schema_version: '0.1.0',
        agent_client_id: 'agent-client:extra-field',
        product_family: 'codex',
        surface: 'codex_cli',
        app_build: '0.125.0',
        dep_bundle_version: 'node24.0.0',
        permission_mode: 'yolo',
        containment_mechanism: 'kernel_sandbox_capable',
        agent_client_state: 'active',
        kernel_observed_at: '2026-05-04T00:00:00Z',
        valid_until: null,
        audit_chain_link_hash:
          'sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        evidence_refs: [evidenceRef],
        producer_asserted_product_family: 'codex',
      }).success,
    ).toBe(false);
  });
});
