import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  agentClientSchema,
  evidenceRefSchema,
  executionContextSurfaceSchema,
} from '../src/index.ts';

const readGeneratedAgentClientSchema = () =>
  JSON.parse(
    readFileSync(new URL('../generated/AgentClient.schema.json', import.meta.url), 'utf8'),
  ) as {
    description: string;
    properties: Record<string, { description?: string; const?: string }>;
  };

const canonicalConcatenation =
  "agent_client_id || product_family || surface || app_build || dep_bundle_version || permission_mode || containment_mechanism || agent_client_state || kernel_observed_at || (valid_until || '') || canonical(evidence_refs) || prior_audit_chain_link_hash";

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

describe('AgentClient canonical-hash amendment (ADR 0059 / D-058)', () => {
  it('keeps schema_version at 0.1.0 — ADR 0059 is non-version-bumping', () => {
    const generated = readGeneratedAgentClientSchema();
    expect(generated.properties.schema_version?.const).toBe('0.1.0');
    expect(generated.description).toContain('schema_version stays 0.1.0');
  });

  it('exposes the exact canonical field order on the generated audit_chain_link_hash description', () => {
    const desc =
      readGeneratedAgentClientSchema().properties.audit_chain_link_hash?.description ?? '';
    expect(desc).toContain(canonicalConcatenation);
    expect(desc).toContain('schema_version is excluded');
    expect(desc).toContain('audit_chain_link_hash is excluded');
  });

  it('documents GENESIS handling and the shortest-form unsigned varint length-prefix codec', () => {
    const desc =
      readGeneratedAgentClientSchema().properties.audit_chain_link_hash?.description ?? '';
    expect(desc).toContain('GENESIS');
    expect(desc).toContain('varint(byte_length) || field_bytes');
    expect(desc).toContain('shortest-form unsigned varint');
    expect(desc).toMatch(/length-prefix/i);
  });

  it('pins the fixed-slot evidence-ref encoding to evidenceRefSchema field set and order (not only the top-level order)', () => {
    const desc =
      readGeneratedAgentClientSchema().properties.audit_chain_link_hash?.description ?? '';
    const evidenceRefOrder = Object.keys(evidenceRefSchema.shape);
    expect(evidenceRefOrder).toEqual([
      'evidence_id',
      'source',
      'observed_at',
      'valid_until',
      'authority',
      'parser_version',
      'confidence',
    ]);
    expect(desc).toContain(evidenceRefOrder.join(', '));
    expect(desc).toContain('never omitted');
  });

  it('keeps producer attribution service-path (kernel_agent_client_resolver), not a record field', () => {
    const generated = readGeneratedAgentClientSchema();
    expect(generated.description).toContain('kernel_agent_client_resolver');
    expect(Object.keys(generated.properties)).not.toContain('producer');
  });

  it('locks the AgentClient envelope field set — prior_audit_chain_link_hash is a computation input, never a record field', () => {
    const fields = Object.keys(readGeneratedAgentClientSchema().properties);
    expect(fields).toEqual([
      'schema_version',
      'agent_client_id',
      'product_family',
      'surface',
      'app_build',
      'dep_bundle_version',
      'permission_mode',
      'containment_mechanism',
      'agent_client_state',
      'kernel_observed_at',
      'valid_until',
      'audit_chain_link_hash',
      'evidence_refs',
    ]);
    expect(fields).not.toContain('prior_audit_chain_link_hash');
    expect(fields).not.toContain('producer');
  });

  it('keeps the documented canonical order in sync with the live AgentClient field shape (drift guard)', () => {
    const recordHashInputs = Object.keys(agentClientSchema.shape).filter(
      (key) => key !== 'schema_version' && key !== 'audit_chain_link_hash',
    );
    const derivedCanonical = [
      ...recordHashInputs.map((key) =>
        key === 'valid_until'
          ? "(valid_until || '')"
          : key === 'evidence_refs'
            ? 'canonical(evidence_refs)'
            : key,
      ),
      'prior_audit_chain_link_hash',
    ].join(' || ');
    // A future AgentClient field add/reorder would desync the record shape from the describe text.
    expect(derivedCanonical).toBe(canonicalConcatenation);
    const desc =
      readGeneratedAgentClientSchema().properties.audit_chain_link_hash?.description ?? '';
    expect(desc).toContain(derivedCanonical);
  });
});
