import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { leaseSchema } from '../src/index.ts';

const baseChainAwareEvidenceRef = {
  evidence_id: 'evidence:lease:test',
  source: 'docs/host-capability-substrate/adr/0052-lease-ring-0-entity.md',
  observed_at: '2026-05-11T00:00:00Z',
  authority: 'host-observation',
  confidence: 'high',
  evidence_chain_refs: [],
} as const;

const auditHash = 'sha256:0000000000000000000000000000000000000000000000000000000000000000';

const baseActiveWorktreeLease = {
  schema_version: '0.1.0',
  lease_id: 'lease:hcs:test-1',
  lease_kind: 'worktree',
  scope: {
    lease_kind: 'worktree',
    repository_id: 'repository:hcs:test',
    workspace_context_id: 'workspace-context:hcs:test',
    worktree_path: '/Users/verlyn13/Organizations/jefahnierocks/host-capability-substrate',
  },
  held_by_session_id: 'session:hcs:test',
  held_by_agent_client_id: 'agent-client:hcs:test',
  acquired_by: 'mint_api',
  acquired_at: '2026-05-11T00:00:00Z',
  valid_until: '2026-05-11T01:00:00Z',
  released_at: null,
  execution_context_id: 'ctx:hcs:test',
  lease_state: 'active',
  force_break_grant_id: null,
  audit_chain_link_hash: auditHash,
  evidence_refs: [baseChainAwareEvidenceRef],
} as const;

describe('Lease schema (ADR 0052 / D-040)', () => {
  it('lists the canonical required fields in the generated schema', () => {
    const schema = JSON.parse(
      readFileSync(new URL('../generated/Lease.schema.json', import.meta.url), 'utf8'),
    ) as { required: string[] };
    expect(schema.required).toEqual([
      'schema_version',
      'lease_id',
      'lease_kind',
      'scope',
      'held_by_session_id',
      'held_by_agent_client_id',
      'acquired_by',
      'acquired_at',
      'valid_until',
      'released_at',
      'execution_context_id',
      'lease_state',
      'force_break_grant_id',
      'audit_chain_link_hash',
      'evidence_refs',
    ]);
  });

  it('validates an active worktree lease', () => {
    const lease = leaseSchema.parse(baseActiveWorktreeLease);
    expect(lease.lease_kind).toBe('worktree');
    expect(lease.lease_state).toBe('active');
    expect(lease.released_at).toBeNull();
  });

  it('validates a released worktree lease with non-null released_at', () => {
    const lease = leaseSchema.parse({
      ...baseActiveWorktreeLease,
      lease_state: 'released',
      released_at: '2026-05-11T00:30:00Z',
    });
    expect(lease.lease_state).toBe('released');
    expect(lease.released_at).toBe('2026-05-11T00:30:00Z');
  });

  it('validates a force_broken worktree lease with force_break_grant_id', () => {
    const lease = leaseSchema.parse({
      ...baseActiveWorktreeLease,
      lease_state: 'force_broken',
      released_at: '2026-05-11T00:45:00Z',
      force_break_grant_id: 'approval-grant:hcs:force-break-1',
    });
    expect(lease.lease_state).toBe('force_broken');
    expect(lease.force_break_grant_id).toBe('approval-grant:hcs:force-break-1');
  });

  it('rejects envelope lease_kind that disagrees with scope.lease_kind', () => {
    expect(
      leaseSchema.safeParse({
        ...baseActiveWorktreeLease,
        lease_kind: 'worktree',
        scope: {
          ...baseActiveWorktreeLease.scope,
          lease_kind: 'credential_audience',
        } as never,
      }).success,
    ).toBe(false);
  });

  it('rejects active lease with non-null released_at', () => {
    expect(
      leaseSchema.safeParse({
        ...baseActiveWorktreeLease,
        released_at: '2026-05-11T00:30:00Z',
      }).success,
    ).toBe(false);
  });

  it('rejects terminal states with null released_at', () => {
    expect(
      leaseSchema.safeParse({
        ...baseActiveWorktreeLease,
        lease_state: 'expired',
        released_at: null,
      }).success,
    ).toBe(false);
  });

  it('rejects force_broken lease without force_break_grant_id', () => {
    expect(
      leaseSchema.safeParse({
        ...baseActiveWorktreeLease,
        lease_state: 'force_broken',
        released_at: '2026-05-11T00:45:00Z',
        force_break_grant_id: null,
      }).success,
    ).toBe(false);
  });

  it('rejects non-force_broken terminal lease with force_break_grant_id set', () => {
    expect(
      leaseSchema.safeParse({
        ...baseActiveWorktreeLease,
        lease_state: 'expired',
        released_at: '2026-05-11T01:00:00Z',
        force_break_grant_id: 'approval-grant:hcs:force-break-1',
      }).success,
    ).toBe(false);
  });

  it('rejects valid_until at or before acquired_at', () => {
    expect(
      leaseSchema.safeParse({
        ...baseActiveWorktreeLease,
        valid_until: '2026-05-11T00:00:00Z',
      }).success,
    ).toBe(false);
  });

  it('rejects kernel_gateway as acquired_by (gateway re-derive does not mint leases)', () => {
    expect(
      leaseSchema.safeParse({
        ...baseActiveWorktreeLease,
        acquired_by: 'kernel_gateway',
      }).success,
    ).toBe(false);
  });

  it('rejects unknown lease_kind values (only `worktree` is Zod-defined at v1)', () => {
    expect(
      leaseSchema.safeParse({
        ...baseActiveWorktreeLease,
        lease_kind: 'credential_audience',
      }).success,
    ).toBe(false);
  });

  it('rejects evidence_refs with sandbox-observation authority (charter inv. 8 + inv. 18)', () => {
    expect(
      leaseSchema.safeParse({
        ...baseActiveWorktreeLease,
        evidence_refs: [
          {
            ...baseChainAwareEvidenceRef,
            authority: 'sandbox-observation',
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('rejects evidence_refs that cite KnowledgeChunk records directly', () => {
    expect(
      leaseSchema.safeParse({
        ...baseActiveWorktreeLease,
        evidence_refs: [
          {
            ...baseChainAwareEvidenceRef,
            evidence_id: 'knowledge-chunk:hcs:retrieved-0',
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('rejects non-literal schema_version values', () => {
    expect(
      leaseSchema.safeParse({
        ...baseActiveWorktreeLease,
        schema_version: '0.2.0',
      }).success,
    ).toBe(false);
  });

  it('rejects unknown lease_state values', () => {
    expect(
      leaseSchema.safeParse({
        ...baseActiveWorktreeLease,
        lease_state: 'pending',
      }).success,
    ).toBe(false);
  });
});
