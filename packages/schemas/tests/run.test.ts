import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { runSchema } from '../src/index.ts';

const baseChainAwareEvidenceRef = {
  evidence_id: 'evidence:run:test',
  source: 'docs/host-capability-substrate/adr/0053-run-ring-0-entity.md',
  observed_at: '2026-05-11T00:00:00Z',
  authority: 'host-observation',
  confidence: 'high',
  evidence_chain_refs: [],
} as const;

const auditHash = 'sha256:0000000000000000000000000000000000000000000000000000000000000000';

const baseActiveOperationExecutionRun = {
  schema_version: '0.1.0',
  run_id: 'run:hcs:test-1',
  run_kind: 'operation_execution',
  scope: {
    run_kind: 'operation_execution',
    operation_shape_ref: 'operation-shape:hcs:test-op',
    authorizing_decision_id: 'decision:hcs:test-1',
  },
  invoker_session_id: 'session:hcs:test',
  invoker_agent_client_id: 'agent-client:hcs:test',
  recorded_by: 'mint_api',
  started_at: '2026-05-11T00:00:00Z',
  ended_at: null,
  execution_context_id: 'ctx:hcs:test',
  run_state: 'active',
  audit_chain_link_hash: auditHash,
  evidence_refs: [baseChainAwareEvidenceRef],
} as const;

describe('Run schema (ADR 0053 / D-041)', () => {
  it('lists the canonical required fields in the generated schema', () => {
    const schema = JSON.parse(
      readFileSync(new URL('../generated/Run.schema.json', import.meta.url), 'utf8'),
    ) as { required: string[] };
    expect(schema.required).toEqual([
      'schema_version',
      'run_id',
      'run_kind',
      'scope',
      'invoker_session_id',
      'invoker_agent_client_id',
      'recorded_by',
      'started_at',
      'ended_at',
      'execution_context_id',
      'run_state',
      'audit_chain_link_hash',
      'evidence_refs',
    ]);
  });

  it('validates an active operation_execution run', () => {
    const run = runSchema.parse(baseActiveOperationExecutionRun);
    expect(run.run_kind).toBe('operation_execution');
    expect(run.run_state).toBe('active');
    expect(run.ended_at).toBeNull();
  });

  it('validates a terminal succeeded run with ended_at >= started_at', () => {
    const run = runSchema.parse({
      ...baseActiveOperationExecutionRun,
      run_state: 'succeeded',
      ended_at: '2026-05-11T00:30:00Z',
    });
    expect(run.run_state).toBe('succeeded');
    expect(run.ended_at).toBe('2026-05-11T00:30:00Z');
  });

  it('validates a terminal failed run', () => {
    const run = runSchema.parse({
      ...baseActiveOperationExecutionRun,
      run_state: 'failed',
      ended_at: '2026-05-11T00:30:00Z',
    });
    expect(run.run_state).toBe('failed');
  });

  it('validates a terminal aborted run', () => {
    const run = runSchema.parse({
      ...baseActiveOperationExecutionRun,
      run_state: 'aborted',
      ended_at: '2026-05-11T00:15:00Z',
    });
    expect(run.run_state).toBe('aborted');
  });

  it('validates a terminal timeout run', () => {
    const run = runSchema.parse({
      ...baseActiveOperationExecutionRun,
      run_state: 'timeout',
      ended_at: '2026-05-11T00:30:00Z',
    });
    expect(run.run_state).toBe('timeout');
  });

  it('validates ended_at exactly equal to started_at', () => {
    const run = runSchema.parse({
      ...baseActiveOperationExecutionRun,
      run_state: 'succeeded',
      ended_at: '2026-05-11T00:00:00Z',
    });
    expect(run.ended_at).toBe('2026-05-11T00:00:00Z');
  });

  it('rejects envelope run_kind that disagrees with scope.run_kind', () => {
    expect(
      runSchema.safeParse({
        ...baseActiveOperationExecutionRun,
        run_kind: 'operation_execution',
        scope: {
          ...baseActiveOperationExecutionRun.scope,
          run_kind: 'system_task',
        } as never,
      }).success,
    ).toBe(false);
  });

  it('rejects ended_at strictly before started_at (Zod superRefine)', () => {
    expect(
      runSchema.safeParse({
        ...baseActiveOperationExecutionRun,
        run_state: 'succeeded',
        started_at: '2026-05-11T00:30:00Z',
        ended_at: '2026-05-11T00:00:00Z',
      }).success,
    ).toBe(false);
  });

  it('rejects active run with non-null ended_at', () => {
    expect(
      runSchema.safeParse({
        ...baseActiveOperationExecutionRun,
        ended_at: '2026-05-11T00:30:00Z',
      }).success,
    ).toBe(false);
  });

  it('rejects terminal run with null ended_at', () => {
    expect(
      runSchema.safeParse({
        ...baseActiveOperationExecutionRun,
        run_state: 'succeeded',
        ended_at: null,
      }).success,
    ).toBe(false);
  });

  it('rejects kernel_gateway as recorded_by (gateway re-derive does not record Runs)', () => {
    expect(
      runSchema.safeParse({
        ...baseActiveOperationExecutionRun,
        recorded_by: 'kernel_gateway',
      }).success,
    ).toBe(false);
  });

  it('rejects unknown run_kind values (only `operation_execution` is Zod-defined at v1)', () => {
    expect(
      runSchema.safeParse({
        ...baseActiveOperationExecutionRun,
        run_kind: 'system_task',
      }).success,
    ).toBe(false);
  });

  it('rejects evidence_refs with sandbox-observation authority (charter inv. 8 + inv. 18)', () => {
    expect(
      runSchema.safeParse({
        ...baseActiveOperationExecutionRun,
        evidence_refs: [
          {
            ...baseChainAwareEvidenceRef,
            authority: 'sandbox-observation',
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('rejects evidence_refs that cite KnowledgeChunk records directly (charter inv. 18 + inv. 18 Run-forbidden-in-derived_from companion rule)', () => {
    expect(
      runSchema.safeParse({
        ...baseActiveOperationExecutionRun,
        evidence_refs: [
          {
            ...baseChainAwareEvidenceRef,
            evidence_id: 'knowledge-chunk:hcs:retrieved-0',
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('rejects evidence-chain refs with sandbox-observation authority', () => {
    expect(
      runSchema.safeParse({
        ...baseActiveOperationExecutionRun,
        evidence_refs: [
          {
            ...baseChainAwareEvidenceRef,
            evidence_chain_refs: [
              {
                record_kind: 'evidence',
                record_id: 'evidence:sandbox-source',
                authority: 'sandbox-observation',
              },
            ],
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('rejects non-literal schema_version values', () => {
    expect(
      runSchema.safeParse({
        ...baseActiveOperationExecutionRun,
        schema_version: '0.2.0',
      }).success,
    ).toBe(false);
  });

  it('rejects unknown run_state values', () => {
    expect(
      runSchema.safeParse({
        ...baseActiveOperationExecutionRun,
        run_state: 'errored',
      }).success,
    ).toBe(false);
  });
});

describe('Run.invoker_model_ref (ADR 0076 / D-077 — additive nullable-optional attribution FK)', () => {
  it('accepts invoker_model_ref absent (the base run)', () => {
    const r = runSchema.parse(baseActiveOperationExecutionRun);
    expect(r.invoker_model_ref).toBeUndefined();
  });

  it('accepts invoker_model_ref as an explicit null (unattributed)', () => {
    const r = runSchema.parse({ ...baseActiveOperationExecutionRun, invoker_model_ref: null });
    expect(r.invoker_model_ref).toBeNull();
  });

  it('accepts invoker_model_ref as a synthetic Model FK id', () => {
    const r = runSchema.parse({
      ...baseActiveOperationExecutionRun,
      invoker_model_ref: 'model:hcs:claude-opus',
    });
    expect(r.invoker_model_ref).toBe('model:hcs:claude-opus');
  });

  it('does NOT add invoker_model_ref to the generated required set (additive nullable-optional)', () => {
    const schema = JSON.parse(
      readFileSync(new URL('../generated/Run.schema.json', import.meta.url), 'utf8'),
    ) as { required: string[]; properties: Record<string, unknown> };
    expect(schema.required).not.toContain('invoker_model_ref');
    // the field IS present in the generated schema (additive), just not required
    expect(schema.properties.invoker_model_ref).toBeDefined();
  });
});
