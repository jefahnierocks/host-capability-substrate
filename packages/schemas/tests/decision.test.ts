import { describe, expect, it } from 'vitest';
import { decisionSchema } from '../src/index.ts';

const baseChainAwareEvidenceRef = {
  evidence_id: 'evidence:decision:test',
  source: 'docs/host-capability-substrate/adr/0049-decision-ring-0-entity.md',
  observed_at: '2026-05-11T00:00:00Z',
  authority: 'host-observation',
  confidence: 'high',
  evidence_chain_refs: [],
} as const;

const auditHash = 'sha256:0000000000000000000000000000000000000000000000000000000000000000';

const baseDenyDecision = {
  schema_version: '0.1.0',
  decision_id: 'decision:hcs:test-1',
  operation_shape_ref: 'operation-shape:hcs:test-op',
  outcome: 'deny',
  reason_kind: 'gate_denied',
  reason_text: 'Test denial — gate not yet proven.',
  reason_text_redaction_mode: 'reference_only',
  evidence_refs: [baseChainAwareEvidenceRef],
  decided_by: 'mint_api',
  decided_at: '2026-05-11T00:00:00Z',
  valid_until: '2026-05-11T01:00:00Z',
  execution_context_id: 'ctx:hcs:test',
  audit_chain_link_hash: auditHash,
  required_grant_kind: null,
} as const;

describe('Decision schema (ADR 0049 / D-037)', () => {
  it('validates a deny Decision with a deny-only reason_kind', () => {
    const decision = decisionSchema.parse(baseDenyDecision);
    expect(decision.outcome).toBe('deny');
    expect(decision.reason_kind).toBe('gate_denied');
  });

  it('validates an informational Decision with gate_provisional reason_kind', () => {
    const decision = decisionSchema.parse({
      ...baseDenyDecision,
      outcome: 'informational',
      reason_kind: 'gate_provisional',
    });
    expect(decision.outcome).toBe('informational');
    expect(decision.reason_kind).toBe('gate_provisional');
  });

  it('rejects informational outcome paired with a deny-only reason_kind (audit-chain-launder defense)', () => {
    expect(
      decisionSchema.safeParse({
        ...baseDenyDecision,
        outcome: 'informational',
        reason_kind: 'gate_denied',
      }).success,
    ).toBe(false);
  });

  it('rejects deny outcome paired with the informational-only gate_provisional reason_kind', () => {
    expect(
      decisionSchema.safeParse({
        ...baseDenyDecision,
        outcome: 'deny',
        reason_kind: 'gate_provisional',
      }).success,
    ).toBe(false);
  });

  it('rejects allow outcome at v1 (no allow-compatible reason_kind in the v1 enum)', () => {
    expect(
      decisionSchema.safeParse({
        ...baseDenyDecision,
        outcome: 'allow',
        reason_kind: 'gate_denied',
      }).success,
    ).toBe(false);
  });

  it('accepts required_grant_kind as one of the three ApprovalGrant kinds', () => {
    const decision = decisionSchema.parse({
      ...baseDenyDecision,
      required_grant_kind: 'gate_evidence_acknowledgment',
    });
    expect(decision.required_grant_kind).toBe('gate_evidence_acknowledgment');
  });

  it('rejects required_grant_kind values outside the ApprovalGrant enum', () => {
    expect(
      decisionSchema.safeParse({
        ...baseDenyDecision,
        required_grant_kind: 'cleanup_plan_acknowledgment',
      }).success,
    ).toBe(false);
  });

  it('rejects reason_text_redaction_mode of `none` (decisionRedactionModeSchema floor)', () => {
    expect(
      decisionSchema.safeParse({
        ...baseDenyDecision,
        reason_text_redaction_mode: 'none',
      }).success,
    ).toBe(false);
  });

  it('rejects reason_text longer than 256 characters', () => {
    expect(
      decisionSchema.safeParse({
        ...baseDenyDecision,
        reason_text: 'x'.repeat(257),
      }).success,
    ).toBe(false);
  });

  it('rejects evidence_refs with sandbox-observation authority (charter inv. 8 + inv. 18)', () => {
    expect(
      decisionSchema.safeParse({
        ...baseDenyDecision,
        evidence_refs: [
          {
            ...baseChainAwareEvidenceRef,
            authority: 'sandbox-observation',
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('rejects evidence_refs with self-asserted authority', () => {
    expect(
      decisionSchema.safeParse({
        ...baseDenyDecision,
        evidence_refs: [
          {
            ...baseChainAwareEvidenceRef,
            authority: 'self-asserted',
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('rejects evidence_refs citing KnowledgeChunk records directly', () => {
    expect(
      decisionSchema.safeParse({
        ...baseDenyDecision,
        evidence_refs: [
          {
            ...baseChainAwareEvidenceRef,
            evidence_id: 'knowledge-chunk:hcs:retrieved-0',
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('rejects evidence-chain refs citing unpromoted derived_summary records', () => {
    expect(
      decisionSchema.safeParse({
        ...baseDenyDecision,
        evidence_refs: [
          {
            ...baseChainAwareEvidenceRef,
            evidence_chain_refs: [
              {
                record_kind: 'derived_summary',
                record_id: 'derived-summary:hcs:unpromoted',
                authority: 'derived',
                allowed_for_gate: false,
              },
            ],
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('accepts kernel_gateway as decided_by (gateway re-derive emits Decisions)', () => {
    const decision = decisionSchema.parse({
      ...baseDenyDecision,
      decided_by: 'kernel_gateway',
    });
    expect(decision.decided_by).toBe('kernel_gateway');
  });

  it('rejects non-literal schema_version values', () => {
    expect(
      decisionSchema.safeParse({
        ...baseDenyDecision,
        schema_version: '0.2.0',
      }).success,
    ).toBe(false);
  });

  it('requires valid_until non-null per inv. 19', () => {
    expect(
      decisionSchema.safeParse({
        ...baseDenyDecision,
        valid_until: null,
      }).success,
    ).toBe(false);
  });

  it('rejects unknown reason_kind values not yet Zod-defined', () => {
    expect(
      decisionSchema.safeParse({
        ...baseDenyDecision,
        reason_kind: 'producer_disjointness_violation',
      }).success,
    ).toBe(false);
  });
});
