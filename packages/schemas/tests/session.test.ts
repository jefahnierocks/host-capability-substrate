import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { sessionSchema } from '../src/index.ts';

const baseEvidenceRef = {
  evidence_id: 'evidence:session:test',
  source: 'docs/host-capability-substrate/adr/0055-session-ring-0-entity.md',
  observed_at: '2026-05-11T00:00:00Z',
  authority: 'host-observation',
  confidence: 'high',
} as const;

const auditHash = 'sha256:0000000000000000000000000000000000000000000000000000000000000000';

const baseActiveSession = {
  schema_version: '0.1.0',
  session_id: 'session:hcs:test-1',
  session_kind: 'agent_invocation',
  session_state: 'active',
  agent_client_id: 'agent-client:hcs:test',
  principal_id: 'principal:hcs:test',
  execution_context_id: 'ctx:hcs:test',
  started_at: '2026-05-11T00:00:00Z',
  ended_at: null,
  producer: 'kernel_session_resolver',
  audit_chain_link_hash: auditHash,
  evidence_refs: [baseEvidenceRef],
} as const;

describe('Session schema (ADR 0055 / D-044)', () => {
  it('lists the canonical required fields in the generated schema', () => {
    const schema = JSON.parse(
      readFileSync(new URL('../generated/Session.schema.json', import.meta.url), 'utf8'),
    ) as { required: string[] };
    expect(schema.required).toEqual([
      'schema_version',
      'session_id',
      'session_kind',
      'session_state',
      'agent_client_id',
      'principal_id',
      'execution_context_id',
      'started_at',
      'ended_at',
      'producer',
      'audit_chain_link_hash',
      'evidence_refs',
    ]);
  });

  it('validates an active agent_invocation session', () => {
    const session = sessionSchema.parse(baseActiveSession);
    expect(session.session_kind).toBe('agent_invocation');
    expect(session.session_state).toBe('active');
    expect(session.ended_at).toBeNull();
  });

  it('validates an ended session with non-null ended_at', () => {
    const session = sessionSchema.parse({
      ...baseActiveSession,
      session_state: 'ended',
      ended_at: '2026-05-11T01:00:00Z',
    });
    expect(session.session_state).toBe('ended');
    expect(session.ended_at).toBe('2026-05-11T01:00:00Z');
  });

  it('validates ended_at exactly equal to started_at', () => {
    const session = sessionSchema.parse({
      ...baseActiveSession,
      session_state: 'ended',
      ended_at: '2026-05-11T00:00:00Z',
    });
    expect(session.ended_at).toBe('2026-05-11T00:00:00Z');
  });

  it('rejects active session with non-null ended_at (state ↔ ended_at correlation)', () => {
    expect(
      sessionSchema.safeParse({
        ...baseActiveSession,
        ended_at: '2026-05-11T01:00:00Z',
      }).success,
    ).toBe(false);
  });

  it('rejects ended session with null ended_at', () => {
    expect(
      sessionSchema.safeParse({
        ...baseActiveSession,
        session_state: 'ended',
        ended_at: null,
      }).success,
    ).toBe(false);
  });

  it('rejects ended_at strictly before started_at (Zod superRefine; session_started_at_after_ended_at)', () => {
    expect(
      sessionSchema.safeParse({
        ...baseActiveSession,
        session_state: 'ended',
        started_at: '2026-05-11T01:00:00Z',
        ended_at: '2026-05-11T00:00:00Z',
      }).success,
    ).toBe(false);
  });

  it('rejects unknown session_kind values (`dashboard` and `system_task` are registry-canonical only at v1)', () => {
    expect(
      sessionSchema.safeParse({
        ...baseActiveSession,
        session_kind: 'dashboard',
      }).success,
    ).toBe(false);

    expect(
      sessionSchema.safeParse({
        ...baseActiveSession,
        session_kind: 'system_task',
      }).success,
    ).toBe(false);
  });

  it('rejects unknown session_state values (`retired` is the long-lived-identity convention; Session uses `ended`)', () => {
    expect(
      sessionSchema.safeParse({
        ...baseActiveSession,
        session_state: 'retired',
      }).success,
    ).toBe(false);

    expect(
      sessionSchema.safeParse({
        ...baseActiveSession,
        session_state: 'terminated',
      }).success,
    ).toBe(false);
  });

  it('rejects unknown producers (`kernel_dashboard` deferred to future coordinated change-set)', () => {
    expect(
      sessionSchema.safeParse({
        ...baseActiveSession,
        producer: 'kernel_dashboard',
      }).success,
    ).toBe(false);

    expect(
      sessionSchema.safeParse({
        ...baseActiveSession,
        producer: 'mint_api',
      }).success,
    ).toBe(false);
  });

  it('rejects non-literal schema_version values', () => {
    expect(
      sessionSchema.safeParse({
        ...baseActiveSession,
        schema_version: '0.2.0',
      }).success,
    ).toBe(false);
  });

  it('requires audit_chain_link_hash with sha256: prefix and 64 hex chars', () => {
    expect(
      sessionSchema.safeParse({
        ...baseActiveSession,
        audit_chain_link_hash: 'sha256:short',
      }).success,
    ).toBe(false);
  });

  it('rejects empty evidence_refs', () => {
    expect(
      sessionSchema.safeParse({
        ...baseActiveSession,
        evidence_refs: [],
      }).success,
    ).toBe(false);
  });

  it('requires all 3 FK fields (agent_client_id, principal_id, execution_context_id) at v1', () => {
    const { agent_client_id, ...missingAgentClient } = baseActiveSession;
    expect(sessionSchema.safeParse(missingAgentClient).success).toBe(false);

    const { principal_id, ...missingPrincipal } = baseActiveSession;
    expect(sessionSchema.safeParse(missingPrincipal).success).toBe(false);

    const { execution_context_id, ...missingExecutionContext } = baseActiveSession;
    expect(sessionSchema.safeParse(missingExecutionContext).success).toBe(false);
  });

  it('carries execution_context_id at the envelope (diverges from Principal; mirrors WorkspaceContext per ADR 0031 v1 Mechanical Tweak #8)', () => {
    const session = sessionSchema.parse(baseActiveSession);
    expect(session.execution_context_id).toBe('ctx:hcs:test');
  });

  it('rejects unknown envelope fields via .strict()', () => {
    expect(
      sessionSchema.safeParse({
        ...baseActiveSession,
        valid_until: '2026-05-12T00:00:00Z',
      }).success,
    ).toBe(false);

    expect(
      sessionSchema.safeParse({
        ...baseActiveSession,
        kernel_observed_at: '2026-05-11T00:00:00Z',
      }).success,
    ).toBe(false);
  });
});
