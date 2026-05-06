import { describe, expect, it } from 'vitest';
import { evidenceSchema, qualityGateSchema } from '../src/index.ts';

const evidenceRef = {
  evidence_id: 'evidence:quality-gate-support',
  source: 'docs/host-capability-substrate/adr/0035-q-007-g-quality-gate-standalone-entity.md',
  observed_at: '2026-05-04T00:00:00Z',
  authority: 'host-observation',
  confidence: 'high',
} as const;

describe('QualityGate schema', () => {
  it('validates the ADR 0035 mutation_class gate identity and proven lifecycle shape', () => {
    const gate = qualityGateSchema.parse({
      schema_version: '0.1.0',
      gate_id: 'quality-gate:hcs:merge-or-push',
      gate_kind: 'mutation_class',
      target_subject_ref: {
        operation_class: 'merge_or_push',
      },
      gate_state: 'proven',
      evidence_refs: [
        {
          ...evidenceRef,
          evidence_id: 'evidence:quality-gate:identity-binding',
        },
        {
          ...evidenceRef,
          evidence_id: 'evidence:quality-gate:tool-provenance',
        },
      ],
      valid_until: '2026-05-05T00:00:00Z',
      provisional_at: '2026-05-04T00:00:00Z',
      proven_at: '2026-05-04T00:05:00Z',
      expired_at: null,
      denied_at: null,
      execution_context_id: 'ctx:hcs:phase-2-1-4',
    });

    expect(gate.gate_kind).toBe('mutation_class');
    expect(gate.target_subject_ref).toEqual({ operation_class: 'merge_or_push' });
  });

  it('rejects target_subject_ref shapes that do not match gate_kind', () => {
    expect(
      qualityGateSchema.safeParse({
        schema_version: '0.1.0',
        gate_id: 'quality-gate:hcs:bad-target',
        gate_kind: 'credential_shadow',
        target_subject_ref: {
          workspace_id: 'workspace:host-capability-substrate',
          surface_id: 'surface:git',
        },
        gate_state: 'provisional',
        evidence_refs: [evidenceRef],
        valid_until: null,
        provisional_at: '2026-05-04T00:00:00Z',
        proven_at: null,
        expired_at: null,
        denied_at: null,
        execution_context_id: 'ctx:hcs:phase-2-1-4',
      }).success,
    ).toBe(false);
  });

  it('rejects lifecycle timestamps that contradict gate_state', () => {
    expect(
      qualityGateSchema.safeParse({
        schema_version: '0.1.0',
        gate_id: 'quality-gate:hcs:bad-proven-state',
        gate_kind: 'tool_provenance',
        target_subject_ref: {
          tool_or_provider_ref: 'tool:git',
        },
        gate_state: 'proven',
        evidence_refs: [evidenceRef],
        valid_until: null,
        provisional_at: '2026-05-04T00:00:00Z',
        proven_at: null,
        expired_at: null,
        denied_at: null,
        execution_context_id: 'ctx:hcs:phase-2-1-4',
      }).success,
    ).toBe(false);
  });

  it('keeps Q-014 project_substrate_admission out of Phase 2.1.4', () => {
    expect(
      qualityGateSchema.safeParse({
        schema_version: '0.1.0',
        gate_id: 'quality-gate:hcs:project-substrate-admission',
        gate_kind: 'project_substrate_admission',
        target_subject_ref: {
          operation_class: 'merge_or_push',
        },
        gate_state: 'provisional',
        evidence_refs: [evidenceRef],
        valid_until: null,
        provisional_at: '2026-05-04T00:00:00Z',
        proven_at: null,
        expired_at: null,
        denied_at: null,
        execution_context_id: 'ctx:hcs:phase-2-1-4',
      }).success,
    ).toBe(false);
  });

  it('keeps mutation_class target refs closed to ADR 0029 operation classes', () => {
    expect(
      qualityGateSchema.safeParse({
        schema_version: '0.1.0',
        gate_id: 'quality-gate:hcs:workspace-verify',
        gate_kind: 'mutation_class',
        target_subject_ref: {
          operation_class: 'workspace_verify',
        },
        gate_state: 'provisional',
        evidence_refs: [evidenceRef],
        valid_until: null,
        provisional_at: '2026-05-04T00:00:00Z',
        proven_at: null,
        expired_at: null,
        denied_at: null,
        execution_context_id: 'ctx:hcs:phase-2-1-4',
      }).success,
    ).toBe(false);
  });

  it('rejects direct KnowledgeChunk and DerivedSummary references as gate evidence', () => {
    const baseGate = {
      schema_version: '0.1.0',
      gate_id: 'quality-gate:hcs:retrieval-direct',
      gate_kind: 'filesystem_trust',
      target_subject_ref: {
        execution_context_id: 'ctx:hcs:phase-2-1-4',
        surface_id: 'surface:codex-cli',
      },
      gate_state: 'provisional',
      valid_until: null,
      provisional_at: '2026-05-04T00:00:00Z',
      proven_at: null,
      expired_at: null,
      denied_at: null,
      execution_context_id: 'ctx:hcs:phase-2-1-4',
    } as const;

    expect(
      qualityGateSchema.safeParse({
        ...baseGate,
        evidence_refs: [
          {
            ...evidenceRef,
            evidence_id: 'knowledge-chunk:hcs:chunk-0',
          },
        ],
      }).success,
    ).toBe(false);

    expect(
      qualityGateSchema.safeParse({
        ...baseGate,
        gate_id: 'quality-gate:hcs:summary-direct',
        evidence_refs: [
          {
            ...evidenceRef,
            evidence_id: 'derived-summary:hcs:summary-0',
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('keeps provisional gates structurally valid with sandbox evidence but blocks proven gates', () => {
    const provisionalGate = qualityGateSchema.parse({
      schema_version: '0.1.0',
      gate_id: 'quality-gate:hcs:provisional-sandbox',
      gate_kind: 'tool_provenance',
      target_subject_ref: {
        tool_or_provider_ref: 'tool:git',
      },
      gate_state: 'provisional',
      evidence_refs: [
        {
          ...evidenceRef,
          evidence_id: 'evidence:sandbox-tool-provenance',
          authority: 'sandbox-observation',
        },
      ],
      valid_until: null,
      provisional_at: '2026-05-04T00:00:00Z',
      proven_at: null,
      expired_at: null,
      denied_at: null,
      execution_context_id: 'ctx:hcs:phase-2-1-4',
    });

    expect(provisionalGate.gate_state).toBe('provisional');

    expect(
      qualityGateSchema.safeParse({
        ...provisionalGate,
        gate_id: 'quality-gate:hcs:proven-sandbox',
        gate_state: 'proven',
        valid_until: '2026-05-05T00:00:00Z',
        proven_at: '2026-05-04T00:05:00Z',
      }).success,
    ).toBe(false);
  });

  it('blocks expired gates from direct or transitive sandbox evidence', () => {
    const expiredGate = {
      schema_version: '0.1.0',
      gate_id: 'quality-gate:hcs:expired-sandbox',
      gate_kind: 'tool_provenance',
      target_subject_ref: {
        tool_or_provider_ref: 'tool:git',
      },
      gate_state: 'expired',
      valid_until: '2026-05-05T00:00:00Z',
      provisional_at: '2026-05-04T00:00:00Z',
      proven_at: '2026-05-04T00:05:00Z',
      expired_at: '2026-05-05T00:00:01Z',
      denied_at: null,
      execution_context_id: 'ctx:hcs:phase-2-1-4',
    } as const;

    expect(
      qualityGateSchema.safeParse({
        ...expiredGate,
        evidence_refs: [
          {
            ...evidenceRef,
            evidence_id: 'evidence:expired-direct-sandbox',
            authority: 'sandbox-observation',
          },
        ],
      }).success,
    ).toBe(false);

    expect(
      qualityGateSchema.safeParse({
        ...expiredGate,
        gate_id: 'quality-gate:hcs:expired-chain-sandbox',
        evidence_refs: [
          {
            ...evidenceRef,
            evidence_id: 'evidence:expired-chain-sandbox',
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

  it('rejects proven gates with retrieval artifacts or unpromoted facts in the evidence chain', () => {
    const baseGate = {
      schema_version: '0.1.0',
      gate_id: 'quality-gate:hcs:chain-walk',
      gate_kind: 'identity_binding',
      target_subject_ref: {
        workspace_id: 'workspace:host-capability-substrate',
        surface_id: 'surface:git',
      },
      gate_state: 'proven',
      valid_until: '2026-05-05T00:00:00Z',
      provisional_at: '2026-05-04T00:00:00Z',
      proven_at: '2026-05-04T00:05:00Z',
      expired_at: null,
      denied_at: null,
      execution_context_id: 'ctx:hcs:phase-2-1-4',
    } as const;

    expect(
      qualityGateSchema.safeParse({
        ...baseGate,
        evidence_refs: [
          {
            ...evidenceRef,
            evidence_id: 'evidence:retrieval-derived-chain',
            evidence_chain_refs: [
              {
                record_kind: 'derived_summary',
                record_id: 'derived-summary:hcs:workspace-diagnose',
                authority: 'derived',
                allowed_for_gate: true,
              },
              {
                record_kind: 'knowledge_chunk',
                record_id: 'knowledge-chunk:hcs:audit-profile:0',
                authority: 'derived',
              },
            ],
          },
        ],
      }).success,
    ).toBe(false);

    expect(
      qualityGateSchema.safeParse({
        ...baseGate,
        gate_id: 'quality-gate:hcs:unpromoted-fact-chain',
        evidence_refs: [
          {
            ...evidenceRef,
            evidence_id: 'evidence:unpromoted-fact-chain',
            evidence_chain_refs: [
              {
                record_kind: 'coordination_fact',
                record_id: 'coordination-fact:hcs:workspace-contains-schema',
                authority: 'host-observation',
                allowed_for_gate: false,
              },
            ],
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('requires authority on transitive QualityGate evidence-chain refs', () => {
    expect(
      qualityGateSchema.safeParse({
        schema_version: '0.1.0',
        gate_id: 'quality-gate:hcs:missing-chain-authority',
        gate_kind: 'identity_binding',
        target_subject_ref: {
          workspace_id: 'workspace:host-capability-substrate',
          surface_id: 'surface:git',
        },
        gate_state: 'proven',
        evidence_refs: [
          {
            ...evidenceRef,
            evidence_id: 'evidence:chain-missing-authority',
            evidence_chain_refs: [
              {
                record_kind: 'evidence',
                record_id: 'evidence:hidden-authority',
              },
            ],
          },
        ],
        valid_until: '2026-05-05T00:00:00Z',
        provisional_at: '2026-05-04T00:00:00Z',
        proven_at: '2026-05-04T00:05:00Z',
        expired_at: null,
        denied_at: null,
        execution_context_id: 'ctx:hcs:phase-2-1-4',
      }).success,
    ).toBe(false);
  });

  it('keeps quality_gate as an Evidence subject kind with current Evidence schema', () => {
    const evidence = evidenceSchema.parse({
      schema_version: '0.7.0',
      evidence_id: 'evidence:quality-gate:merge-or-push',
      evidence_kind: 'observation',
      subject_refs: [
        {
          subject_kind: 'quality_gate',
          subject_id: 'quality-gate:hcs:merge-or-push',
        },
      ],
      source: 'docs/host-capability-substrate/adr/0035-q-007-g-quality-gate-standalone-entity.md',
      observed_at: '2026-05-04T00:00:00Z',
      valid_until: null,
      authority: 'host-observation',
      confidence: 'high',
      parser_version: 'human-review:v1',
      redaction_mode: 'reference_only',
    });

    expect(evidence.subject_refs[0]?.subject_kind).toBe('quality_gate');
  });
});
