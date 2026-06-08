import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { decisionReasonKindSchema, decisionSchema } from '../src/index.ts';

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

const authorityChainDepthOverflowDecision = (overrides: Record<string, unknown> = {}) => ({
  ...baseDenyDecision,
  reason_kind: 'authority_chain_walk_depth_exceeded',
  ...overrides,
});

type GeneratedSchemaObject = Record<string, unknown>;

const asRecord = (value: unknown): GeneratedSchemaObject =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as GeneratedSchemaObject)
    : {};

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const readGeneratedDecisionSchema = (): GeneratedSchemaObject =>
  JSON.parse(
    readFileSync(new URL('../generated/Decision.schema.json', import.meta.url), 'utf8'),
  ) as GeneratedSchemaObject;

const generatedDecisionReasonKindEnum = (): unknown[] => {
  const schema = readGeneratedDecisionSchema();
  const properties = asRecord(schema.properties);
  const reasonKind = asRecord(properties.reason_kind);
  return asArray(reasonKind.enum);
};

describe('Decision schema (ADR 0049 / ADR 0056 / ADR 0058 / D-037 / D-046 / D-053)', () => {
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

  it('accepts operation_class_unregistered only as a deny non-clearable Decision', () => {
    const decision = decisionSchema.parse({
      ...baseDenyDecision,
      reason_kind: 'operation_class_unregistered',
      required_grant_kind: null,
    });
    expect(decision.reason_kind).toBe('operation_class_unregistered');
    expect(decision.required_grant_kind).toBeNull();
  });

  it('rejects operation_class_unregistered when any required_grant_kind is present', () => {
    expect(
      decisionSchema.safeParse({
        ...baseDenyDecision,
        reason_kind: 'operation_class_unregistered',
        required_grant_kind: 'gate_evidence_acknowledgment',
      }).success,
    ).toBe(false);
  });

  it('accepts audit_chain_corruption_detected as a deny-only Decision', () => {
    const decision = decisionSchema.parse({
      ...baseDenyDecision,
      reason_kind: 'audit_chain_corruption_detected',
    });
    expect(decision.reason_kind).toBe('audit_chain_corruption_detected');
  });

  it('accepts authority_chain_walk_depth_exceeded as a deny-only non-clearable Decision from mint_api', () => {
    const decision = decisionSchema.parse(authorityChainDepthOverflowDecision());
    expect(decision.reason_kind).toBe('authority_chain_walk_depth_exceeded');
    expect(decision.outcome).toBe('deny');
    expect(decision.required_grant_kind).toBeNull();
    expect(decision.decided_by).toBe('mint_api');
  });

  it('accepts authority_chain_walk_depth_exceeded from kernel_broker', () => {
    const decision = decisionSchema.parse(
      authorityChainDepthOverflowDecision({
        decided_by: 'kernel_broker',
      }),
    );
    expect(decision.decided_by).toBe('kernel_broker');
  });

  it('rejects required_grant_kind values outside the ApprovalGrant enum', () => {
    expect(
      decisionSchema.safeParse({
        ...baseDenyDecision,
        required_grant_kind: 'cleanup_plan_acknowledgment',
      }).success,
    ).toBe(false);
  });

  it('rejects operation_class_unregistered with an informational outcome', () => {
    expect(
      decisionSchema.safeParse({
        ...baseDenyDecision,
        outcome: 'informational',
        reason_kind: 'operation_class_unregistered',
      }).success,
    ).toBe(false);
  });

  it('rejects audit_chain_corruption_detected with an informational outcome', () => {
    expect(
      decisionSchema.safeParse({
        ...baseDenyDecision,
        outcome: 'informational',
        reason_kind: 'audit_chain_corruption_detected',
      }).success,
    ).toBe(false);
  });

  it('rejects authority_chain_walk_depth_exceeded with non-deny outcomes', () => {
    for (const outcome of ['allow', 'informational'] as const) {
      expect(
        decisionSchema.safeParse(authorityChainDepthOverflowDecision({ outcome })).success,
      ).toBe(false);
    }
  });

  it('rejects authority_chain_walk_depth_exceeded when any required_grant_kind is present', () => {
    expect(
      decisionSchema.safeParse(
        authorityChainDepthOverflowDecision({
          required_grant_kind: 'gate_evidence_acknowledgment',
        }),
      ).success,
    ).toBe(false);
  });

  it('rejects authority_chain_walk_depth_exceeded from kernel_gateway', () => {
    expect(
      decisionSchema.safeParse(
        authorityChainDepthOverflowDecision({
          decided_by: 'kernel_gateway',
        }),
      ).success,
    ).toBe(false);
  });

  it('rejects authority_chain_walk_depth_exceeded from non-Decision producers', () => {
    expect(
      decisionSchema.safeParse(
        authorityChainDepthOverflowDecision({
          decided_by: 'kernel_telemetry',
        }),
      ).success,
    ).toBe(false);
  });

  it('rejects ADR 0056 reason kinds with allow outcomes', () => {
    for (const reason_kind of [
      'operation_class_unregistered',
      'audit_chain_corruption_detected',
    ] as const) {
      expect(
        decisionSchema.safeParse({
          ...baseDenyDecision,
          outcome: 'allow',
          reason_kind,
        }).success,
      ).toBe(false);
    }
  });

  it('keeps cycle and depth-overflow reason kinds distinct and Zod-defined', () => {
    expect(decisionReasonKindSchema.parse('audit_chain_corruption_detected')).toBe(
      'audit_chain_corruption_detected',
    );
    expect(decisionReasonKindSchema.parse('authority_chain_walk_depth_exceeded')).toBe(
      'authority_chain_walk_depth_exceeded',
    );
    expect('audit_chain_corruption_detected').not.toBe('authority_chain_walk_depth_exceeded');
  });

  it('rejects operation_class_unregistered when operation_shape_ref is missing', () => {
    const decision = {
      ...baseDenyDecision,
      reason_kind: 'operation_class_unregistered',
    } as Record<string, unknown>;
    delete decision.operation_shape_ref;

    expect(decisionSchema.safeParse(decision).success).toBe(false);
  });

  it('rejects operation_class_unregistered when operation_shape_ref is null', () => {
    expect(
      decisionSchema.safeParse({
        ...baseDenyDecision,
        reason_kind: 'operation_class_unregistered',
        operation_shape_ref: null,
      }).success,
    ).toBe(false);
  });

  it('rejects operation_class_unregistered when operation_shape_ref is invalid', () => {
    expect(
      decisionSchema.safeParse({
        ...baseDenyDecision,
        reason_kind: 'operation_class_unregistered',
        operation_shape_ref: '',
      }).success,
    ).toBe(false);
  });

  it('rejects authority_chain_walk_depth_exceeded when operation_shape_ref is missing', () => {
    const decision = authorityChainDepthOverflowDecision() as Record<string, unknown>;
    delete decision.operation_shape_ref;

    expect(decisionSchema.safeParse(decision).success).toBe(false);
  });

  it('rejects authority_chain_walk_depth_exceeded when operation_shape_ref is null', () => {
    expect(
      decisionSchema.safeParse(
        authorityChainDepthOverflowDecision({
          operation_shape_ref: null,
        }),
      ).success,
    ).toBe(false);
  });

  it('rejects authority_chain_walk_depth_exceeded when operation_shape_ref is invalid', () => {
    expect(
      decisionSchema.safeParse(
        authorityChainDepthOverflowDecision({
          operation_shape_ref: '',
        }),
      ).success,
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

  it('applies evidence-ref authority rejection to authority_chain_walk_depth_exceeded', () => {
    for (const evidenceRef of [
      {
        ...baseChainAwareEvidenceRef,
        authority: 'sandbox-observation',
      },
      {
        ...baseChainAwareEvidenceRef,
        authority: 'self-asserted',
      },
      {
        ...baseChainAwareEvidenceRef,
        evidence_id: 'knowledge-chunk:hcs:retrieved-0',
      },
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
    ] as const) {
      expect(
        decisionSchema.safeParse(
          authorityChainDepthOverflowDecision({
            evidence_refs: [evidenceRef],
          }),
        ).success,
      ).toBe(false);
    }
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

  it('includes ADR 0056 and ADR 0058 reason kinds in generated Decision JSON Schema', () => {
    expect(generatedDecisionReasonKindEnum()).toEqual(
      expect.arrayContaining([
        'operation_class_unregistered',
        'audit_chain_corruption_detected',
        'authority_chain_walk_depth_exceeded',
      ]),
    );
  });
});

describe('Decision rule-attribution (ADR 0061 / D-059)', () => {
  const ruleRef = 'policy-rule:hcs:service-activate';
  const policyDigest = `sha256:${'ab'.repeat(32)}`;

  it('accepts a Decision with both attribution fields present (gate-decision case)', () => {
    const decision = decisionSchema.parse({
      ...baseDenyDecision,
      policy_rule_ref: ruleRef,
      resolved_policy_sha256: policyDigest,
    });
    expect(decision.policy_rule_ref).toBe(ruleRef);
    expect(decision.resolved_policy_sha256).toBe(policyDigest);
  });

  it('accepts a Decision with both attribution fields absent (back-compat with existing records)', () => {
    const decision = decisionSchema.parse(baseDenyDecision);
    expect(decision.policy_rule_ref).toBeUndefined();
    expect(decision.resolved_policy_sha256).toBeUndefined();
  });

  it('accepts a Decision with both attribution fields explicitly null', () => {
    const decision = decisionSchema.parse({
      ...baseDenyDecision,
      policy_rule_ref: null,
      resolved_policy_sha256: null,
    });
    expect(decision.policy_rule_ref).toBeNull();
    expect(decision.resolved_policy_sha256).toBeNull();
  });

  it('accepts the neither-attributed mixed absent/null combinations', () => {
    expect(
      decisionSchema.safeParse({ ...baseDenyDecision, resolved_policy_sha256: null }).success,
    ).toBe(true);
    expect(decisionSchema.safeParse({ ...baseDenyDecision, policy_rule_ref: null }).success).toBe(
      true,
    );
  });

  it('rejects a Decision attributed on policy_rule_ref but missing the resolved digest', () => {
    for (const resolved of [undefined, null] as const) {
      const candidate = { ...baseDenyDecision, policy_rule_ref: ruleRef } as Record<
        string,
        unknown
      >;
      if (resolved === null) {
        candidate.resolved_policy_sha256 = null;
      }
      const result = decisionSchema.safeParse(candidate);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Distinct issue paths (ADR 0061 §Implementation plan step 1): exactly the
        // digest half is flagged, never the rule half — so audit triage can tell which is absent.
        const paths = result.error.issues.map((issue) => issue.path.join('.'));
        expect(paths).toContain('resolved_policy_sha256');
        expect(paths).not.toContain('policy_rule_ref');
      }
    }
  });

  it('rejects a Decision attributed on resolved_policy_sha256 but missing the rule reference', () => {
    for (const rule of [undefined, null] as const) {
      const candidate = { ...baseDenyDecision, resolved_policy_sha256: policyDigest } as Record<
        string,
        unknown
      >;
      if (rule === null) {
        candidate.policy_rule_ref = null;
      }
      const result = decisionSchema.safeParse(candidate);
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((issue) => issue.path.join('.'));
        expect(paths).toContain('policy_rule_ref');
        expect(paths).not.toContain('resolved_policy_sha256');
      }
    }
  });

  it('rejects a malformed resolved_policy_sha256 (missing prefix, wrong length, or wrong algorithm)', () => {
    for (const bad of [
      'ab'.repeat(32),
      `sha256:${'ab'.repeat(31)}`,
      `sha512:${'ab'.repeat(32)}`,
      'md5:deadbeef',
    ]) {
      expect(
        decisionSchema.safeParse({
          ...baseDenyDecision,
          policy_rule_ref: ruleRef,
          resolved_policy_sha256: bad,
        }).success,
      ).toBe(false);
    }
  });

  it('keeps pair-consistency outcome-agnostic — informational gate_provisional carrying both fields accepts (Ring 1 owns attribution gating)', () => {
    const decision = decisionSchema.parse({
      ...baseDenyDecision,
      outcome: 'informational',
      reason_kind: 'gate_provisional',
      policy_rule_ref: ruleRef,
      resolved_policy_sha256: policyDigest,
    });
    expect(decision.outcome).toBe('informational');
    expect(decision.policy_rule_ref).toBe(ruleRef);
  });

  it('rejects an uppercase-hex digest (lowercase-only) and an empty policy_rule_ref', () => {
    expect(
      decisionSchema.safeParse({
        ...baseDenyDecision,
        policy_rule_ref: ruleRef,
        resolved_policy_sha256: `sha256:${'AB'.repeat(32)}`,
      }).success,
    ).toBe(false);
    expect(
      decisionSchema.safeParse({
        ...baseDenyDecision,
        policy_rule_ref: '',
        resolved_policy_sha256: policyDigest,
      }).success,
    ).toBe(false);
  });

  it('does not encode which reason_kind may carry attribution — a non-rule reason_kind carrying both fields accepts (Ring 1 owns that)', () => {
    const decision = decisionSchema.parse(
      authorityChainDepthOverflowDecision({
        policy_rule_ref: ruleRef,
        resolved_policy_sha256: policyDigest,
      }),
    );
    expect(decision.reason_kind).toBe('authority_chain_walk_depth_exceeded');
    expect(decision.policy_rule_ref).toBe(ruleRef);
  });

  it('performs no B-2 trust check at Ring 0 — a well-formed digest matching no bound snapshot still accepts', () => {
    const arbitraryDigest = `sha256:${'0123456789abcdef'.repeat(4)}`;
    const decision = decisionSchema.parse({
      ...baseDenyDecision,
      policy_rule_ref: ruleRef,
      resolved_policy_sha256: arbitraryDigest,
    });
    expect(decision.resolved_policy_sha256).toBe(arbitraryDigest);
  });

  it('surfaces BOTH a pair-consistency issue and a pre-existing refinement issue at once (additive, masks none)', () => {
    const result = decisionSchema.safeParse({
      ...baseDenyDecision,
      reason_kind: 'operation_class_unregistered',
      required_grant_kind: 'gate_evidence_acknowledgment',
      policy_rule_ref: ruleRef,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join('.'));
      expect(paths).toContain('required_grant_kind');
      expect(paths).toContain('resolved_policy_sha256');
    }
  });

  it('lists policy_rule_ref + resolved_policy_sha256 as nullable, optional properties absent from required (generated schema)', () => {
    const schema = readGeneratedDecisionSchema();
    expect(asArray(schema.required)).not.toContain('policy_rule_ref');
    expect(asArray(schema.required)).not.toContain('resolved_policy_sha256');
    const properties = asRecord(schema.properties);
    for (const field of ['policy_rule_ref', 'resolved_policy_sha256']) {
      const branches = asArray(asRecord(properties[field]).anyOf).map((branch) => asRecord(branch));
      expect(branches.some((branch) => branch.type === 'null')).toBe(true);
    }
  });
});
