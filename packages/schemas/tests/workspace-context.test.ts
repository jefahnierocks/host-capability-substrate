import { describe, expect, it } from 'vitest';
import { workspaceContextSchema } from '../src/index.ts';

const baseEvidenceRef = {
  evidence_id: 'evidence:workspace-context:test',
  source: 'docs/host-capability-substrate/adr/0050-workspace-context-ring-0-entity.md',
  observed_at: '2026-05-11T00:00:00Z',
  authority: 'host-observation',
  confidence: 'high',
} as const;

const auditHash = 'sha256:0000000000000000000000000000000000000000000000000000000000000000';

const baseWorkspaceContext = {
  schema_version: '0.1.0',
  workspace_context_id: 'workspace-context:hcs:test-1',
  execution_context_id: 'ctx:hcs:test',
  repository_id: 'repository:hcs:test',
  worktree_path: '/Users/verlyn13/Organizations/jefahnierocks/host-capability-substrate',
  workspace_context_state: 'active',
  kernel_observed_at: '2026-05-11T00:00:00Z',
  valid_until: null,
  producer: 'kernel_workspace_diagnose',
  audit_chain_link_hash: auditHash,
  evidence_refs: [baseEvidenceRef],
} as const;

describe('WorkspaceContext schema (ADR 0050 / D-038)', () => {
  it('validates an active record with the ADR 0050 worktree-binding fields', () => {
    const ctx = workspaceContextSchema.parse(baseWorkspaceContext);

    expect(ctx.workspace_context_state).toBe('active');
    expect(ctx.execution_context_id).toBe('ctx:hcs:test');
    expect(ctx.producer).toBe('kernel_workspace_diagnose');
    expect(ctx.valid_until).toBeNull();
  });

  it('validates a retired record with a non-null valid_until', () => {
    const ctx = workspaceContextSchema.parse({
      ...baseWorkspaceContext,
      workspace_context_state: 'retired',
      valid_until: '2026-05-12T00:00:00Z',
    });

    expect(ctx.workspace_context_state).toBe('retired');
    expect(ctx.valid_until).toBe('2026-05-12T00:00:00Z');
  });

  it('rejects active records with a non-null valid_until', () => {
    expect(
      workspaceContextSchema.safeParse({
        ...baseWorkspaceContext,
        valid_until: '2026-05-12T00:00:00Z',
      }).success,
    ).toBe(false);
  });

  it('rejects retired records with a null valid_until', () => {
    expect(
      workspaceContextSchema.safeParse({
        ...baseWorkspaceContext,
        workspace_context_state: 'retired',
        valid_until: null,
      }).success,
    ).toBe(false);
  });

  it('rejects unknown producers', () => {
    expect(
      workspaceContextSchema.safeParse({
        ...baseWorkspaceContext,
        producer: 'mint_api',
      }).success,
    ).toBe(false);
  });

  it('rejects non-literal schema_version values', () => {
    expect(
      workspaceContextSchema.safeParse({
        ...baseWorkspaceContext,
        schema_version: '0.2.0',
      }).success,
    ).toBe(false);
  });

  it('requires audit_chain_link_hash with sha256: prefix and 64 hex chars', () => {
    expect(
      workspaceContextSchema.safeParse({
        ...baseWorkspaceContext,
        audit_chain_link_hash: 'sha256:short',
      }).success,
    ).toBe(false);
  });

  it('rejects empty evidence_refs', () => {
    expect(
      workspaceContextSchema.safeParse({
        ...baseWorkspaceContext,
        evidence_refs: [],
      }).success,
    ).toBe(false);
  });

  it('rejects unknown lifecycle states', () => {
    expect(
      workspaceContextSchema.safeParse({
        ...baseWorkspaceContext,
        workspace_context_state: 'archived',
      }).success,
    ).toBe(false);
  });
});
