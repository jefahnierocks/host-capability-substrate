import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { approvalGrantSchema } from '../src/index.ts';

const baseChainAwareEvidenceRef = {
  evidence_id: 'evidence:approval-grant:test',
  source: 'docs/host-capability-substrate/adr/0051-approval-grant-ring-0-entity.md',
  observed_at: '2026-05-11T00:00:00Z',
  authority: 'host-observation',
  confidence: 'high',
  evidence_chain_refs: [],
} as const;

const auditHash = 'sha256:0000000000000000000000000000000000000000000000000000000000000000';

const baseGateEvidenceAcknowledgmentGrant = {
  schema_version: '0.1.0',
  approval_grant_id: 'approval-grant:hcs:test-1',
  grant_kind: 'gate_evidence_acknowledgment',
  scope: {
    grant_kind: 'gate_evidence_acknowledgment',
    gate_id: 'quality-gate:hcs:test',
    acknowledged_evidence_refs: [baseChainAwareEvidenceRef],
  },
  minted_for_decision_id: 'decision:hcs:test-1',
  grantor_principal_ref: 'principal:hcs:test',
  granted_by: 'mint_api',
  granted_at: '2026-05-11T00:00:00Z',
  valid_until: '2026-05-11T01:00:00Z',
  execution_context_id: 'ctx:hcs:test',
  grant_state: 'active',
  audit_chain_link_hash: auditHash,
  evidence_refs: [baseChainAwareEvidenceRef],
} as const;

describe('ApprovalGrant schema (ADR 0051 v4 / D-039)', () => {
  it('lists the canonical required fields in the generated schema', () => {
    const schema = JSON.parse(
      readFileSync(new URL('../generated/ApprovalGrant.schema.json', import.meta.url), 'utf8'),
    ) as { required: string[] };
    expect(schema.required).toEqual([
      'schema_version',
      'approval_grant_id',
      'grant_kind',
      'scope',
      'minted_for_decision_id',
      'grantor_principal_ref',
      'granted_by',
      'granted_at',
      'valid_until',
      'execution_context_id',
      'grant_state',
      'audit_chain_link_hash',
      'evidence_refs',
    ]);
  });

  it('validates a gate_evidence_acknowledgment grant', () => {
    const grant = approvalGrantSchema.parse(baseGateEvidenceAcknowledgmentGrant);
    expect(grant.grant_kind).toBe('gate_evidence_acknowledgment');
    expect(grant.grant_state).toBe('active');
  });

  it('validates a worktree_clean_acknowledgment grant', () => {
    const grant = approvalGrantSchema.parse({
      ...baseGateEvidenceAcknowledgmentGrant,
      grant_kind: 'worktree_clean_acknowledgment',
      scope: {
        grant_kind: 'worktree_clean_acknowledgment',
        workspace_context_id: 'workspace-context:hcs:test',
        acknowledged_dirty_state_evidence_ref: baseChainAwareEvidenceRef,
      },
    });
    expect(grant.grant_kind).toBe('worktree_clean_acknowledgment');
  });

  it('validates a pr_absence_acknowledgment grant', () => {
    const grant = approvalGrantSchema.parse({
      ...baseGateEvidenceAcknowledgmentGrant,
      grant_kind: 'pr_absence_acknowledgment',
      scope: {
        grant_kind: 'pr_absence_acknowledgment',
        repository_id: 'repository:hcs:test',
        branch_ref: 'refs/heads/main',
        acknowledged_pr_absence_evidence_ref: baseChainAwareEvidenceRef,
      },
    });
    expect(grant.grant_kind).toBe('pr_absence_acknowledgment');
  });

  it('rejects envelope grant_kind that disagrees with scope.grant_kind', () => {
    expect(
      approvalGrantSchema.safeParse({
        ...baseGateEvidenceAcknowledgmentGrant,
        grant_kind: 'worktree_clean_acknowledgment',
      }).success,
    ).toBe(false);
  });

  it('rejects pr_absence_acknowledgment with a malformed branch_ref', () => {
    expect(
      approvalGrantSchema.safeParse({
        ...baseGateEvidenceAcknowledgmentGrant,
        grant_kind: 'pr_absence_acknowledgment',
        scope: {
          grant_kind: 'pr_absence_acknowledgment',
          repository_id: 'repository:hcs:test',
          branch_ref: 'not-a-git-ref',
          acknowledged_pr_absence_evidence_ref: baseChainAwareEvidenceRef,
        },
      }).success,
    ).toBe(false);
  });

  it('rejects valid_until at or before granted_at', () => {
    expect(
      approvalGrantSchema.safeParse({
        ...baseGateEvidenceAcknowledgmentGrant,
        valid_until: '2026-05-11T00:00:00Z',
      }).success,
    ).toBe(false);
  });

  it('rejects kernel_gateway as granted_by (gateway re-derive does not mint grants)', () => {
    expect(
      approvalGrantSchema.safeParse({
        ...baseGateEvidenceAcknowledgmentGrant,
        granted_by: 'kernel_gateway',
      }).success,
    ).toBe(false);
  });

  it('rejects envelope evidence_refs with sandbox-observation authority (charter inv. 18)', () => {
    expect(
      approvalGrantSchema.safeParse({
        ...baseGateEvidenceAcknowledgmentGrant,
        evidence_refs: [
          {
            ...baseChainAwareEvidenceRef,
            authority: 'sandbox-observation',
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('rejects envelope evidence_refs with self-asserted authority', () => {
    expect(
      approvalGrantSchema.safeParse({
        ...baseGateEvidenceAcknowledgmentGrant,
        evidence_refs: [
          {
            ...baseChainAwareEvidenceRef,
            authority: 'self-asserted',
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('rejects evidence_refs that cite KnowledgeChunk records directly', () => {
    expect(
      approvalGrantSchema.safeParse({
        ...baseGateEvidenceAcknowledgmentGrant,
        evidence_refs: [
          {
            ...baseChainAwareEvidenceRef,
            evidence_id: 'knowledge-chunk:hcs:retrieved-0',
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('rejects evidence-chain refs citing unpromoted coordination_fact', () => {
    expect(
      approvalGrantSchema.safeParse({
        ...baseGateEvidenceAcknowledgmentGrant,
        evidence_refs: [
          {
            ...baseChainAwareEvidenceRef,
            evidence_chain_refs: [
              {
                record_kind: 'coordination_fact',
                record_id: 'coordination-fact:hcs:unpromoted',
                authority: 'host-observation',
                allowed_for_gate: false,
              },
            ],
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('rejects scope-payload acknowledged_evidence_refs with sandbox-observation authority', () => {
    expect(
      approvalGrantSchema.safeParse({
        ...baseGateEvidenceAcknowledgmentGrant,
        scope: {
          grant_kind: 'gate_evidence_acknowledgment',
          gate_id: 'quality-gate:hcs:test',
          acknowledged_evidence_refs: [
            {
              ...baseChainAwareEvidenceRef,
              authority: 'sandbox-observation',
            },
          ],
        },
      }).success,
    ).toBe(false);
  });

  it('rejects scope-payload acknowledged_dirty_state_evidence_ref with sandbox-observation authority', () => {
    expect(
      approvalGrantSchema.safeParse({
        ...baseGateEvidenceAcknowledgmentGrant,
        grant_kind: 'worktree_clean_acknowledgment',
        scope: {
          grant_kind: 'worktree_clean_acknowledgment',
          workspace_context_id: 'workspace-context:hcs:test',
          acknowledged_dirty_state_evidence_ref: {
            ...baseChainAwareEvidenceRef,
            authority: 'sandbox-observation',
          },
        },
      }).success,
    ).toBe(false);
  });

  it('rejects non-literal schema_version values', () => {
    expect(
      approvalGrantSchema.safeParse({
        ...baseGateEvidenceAcknowledgmentGrant,
        schema_version: '0.2.0',
      }).success,
    ).toBe(false);
  });

  it('rejects unknown grant_state values', () => {
    expect(
      approvalGrantSchema.safeParse({
        ...baseGateEvidenceAcknowledgmentGrant,
        grant_state: 'consumed_pending',
      }).success,
    ).toBe(false);
  });
});

describe('ApprovalGrant boundary_evidence_* scope branches (ADR 0034 §Sub-decision (d) / M2 entry)', () => {
  const obsRefA = { ...baseChainAwareEvidenceRef, evidence_id: 'evidence:boundary:obs-a' };
  const obsRefB = { ...baseChainAwareEvidenceRef, evidence_id: 'evidence:boundary:obs-b' };

  const boundaryGrant = (kind: string, refs: unknown[]) => ({
    ...baseGateEvidenceAcknowledgmentGrant,
    grant_kind: kind,
    scope: {
      grant_kind: kind,
      boundary_observation_evidence_refs: refs,
      execution_context_id: 'ctx:hcs:test',
    },
  });

  it('validates a boundary_evidence_freshness_override grant', () => {
    const grant = approvalGrantSchema.parse(
      boundaryGrant('boundary_evidence_freshness_override', [obsRefA]),
    );
    expect(grant.grant_kind).toBe('boundary_evidence_freshness_override');
  });

  it('validates a boundary_evidence_absence_acceptance grant', () => {
    const grant = approvalGrantSchema.parse(
      boundaryGrant('boundary_evidence_absence_acceptance', [obsRefA]),
    );
    expect(grant.grant_kind).toBe('boundary_evidence_absence_acceptance');
  });

  it('validates a boundary_evidence_contradiction_acknowledgment grant with two refs', () => {
    const grant = approvalGrantSchema.parse(
      boundaryGrant('boundary_evidence_contradiction_acknowledgment', [obsRefA, obsRefB]),
    );
    expect(grant.grant_kind).toBe('boundary_evidence_contradiction_acknowledgment');
  });

  it('rejects contradiction_acknowledgment with fewer than two refs (a contradiction needs the divergent pair)', () => {
    expect(
      approvalGrantSchema.safeParse(
        boundaryGrant('boundary_evidence_contradiction_acknowledgment', [obsRefA]),
      ).success,
    ).toBe(false);
  });

  it('rejects empty boundary_observation_evidence_refs on freshness_override', () => {
    expect(
      approvalGrantSchema.safeParse(boundaryGrant('boundary_evidence_freshness_override', []))
        .success,
    ).toBe(false);
  });

  it('rejects scope/envelope grant_kind mismatch across boundary branches', () => {
    expect(
      approvalGrantSchema.safeParse({
        ...boundaryGrant('boundary_evidence_freshness_override', [obsRefA]),
        grant_kind: 'boundary_evidence_absence_acceptance',
      }).success,
    ).toBe(false);
  });

  it('rejects unknown scope keys on boundary branches (strict)', () => {
    const grant = boundaryGrant('boundary_evidence_freshness_override', [obsRefA]);
    expect(
      approvalGrantSchema.safeParse({
        ...grant,
        scope: { ...grant.scope, operation_id: 'operation:hcs:test' },
      }).success,
    ).toBe(false);
  });

  it('applies chain-walk authority rejection to boundary_observation_evidence_refs (charter inv. 8)', () => {
    expect(
      approvalGrantSchema.safeParse(
        boundaryGrant('boundary_evidence_freshness_override', [
          { ...obsRefA, authority: 'sandbox-observation' },
        ]),
      ).success,
    ).toBe(false);
  });

  it('includes the three boundary_evidence_* kinds in the generated ApprovalGrant JSON Schema', () => {
    const schema = JSON.parse(
      readFileSync(new URL('../generated/ApprovalGrant.schema.json', import.meta.url), 'utf8'),
    ) as { properties: { grant_kind: { enum: string[] } } };
    expect(schema.properties.grant_kind.enum).toEqual(
      expect.arrayContaining([
        'boundary_evidence_freshness_override',
        'boundary_evidence_contradiction_acknowledgment',
        'boundary_evidence_absence_acceptance',
      ]),
    );
  });

  it('applies self-asserted authority rejection to boundary_observation_evidence_refs', () => {
    expect(
      approvalGrantSchema.safeParse(
        boundaryGrant('boundary_evidence_absence_acceptance', [
          { ...obsRefA, authority: 'self-asserted' },
        ]),
      ).success,
    ).toBe(false);
  });

  it('rejects an unpromoted derived_summary chain ref inside boundary_observation_evidence_refs', () => {
    expect(
      approvalGrantSchema.safeParse(
        boundaryGrant('boundary_evidence_freshness_override', [
          {
            ...obsRefA,
            evidence_chain_refs: [
              {
                record_kind: 'derived_summary',
                record_id: 'derived-summary:hcs:unpromoted',
                authority: 'derived',
                allowed_for_gate: false,
              },
            ],
          },
        ]),
      ).success,
    ).toBe(false);
  });

  it('pins minItems 2 on the contradiction scope branch in the generated schema (the grant floor — deliberately a floor, not the exactly-two Decision pair)', () => {
    const schema = JSON.parse(
      readFileSync(new URL('../generated/ApprovalGrant.schema.json', import.meta.url), 'utf8'),
    ) as {
      properties: {
        scope: { oneOf: Array<Record<string, unknown>> };
      };
    };
    const contradictionBranch = schema.properties.scope.oneOf
      .map((branch) => branch as Record<string, unknown>)
      .find((branch) => {
        const props = (branch.properties ?? {}) as Record<string, unknown>;
        const kind = (props.grant_kind ?? {}) as Record<string, unknown>;
        return kind.const === 'boundary_evidence_contradiction_acknowledgment';
      });
    expect(contradictionBranch).toBeDefined();
    const props = (contradictionBranch?.properties ?? {}) as Record<string, unknown>;
    const refs = (props.boundary_observation_evidence_refs ?? {}) as Record<string, unknown>;
    expect(refs.minItems).toBe(2);
  });
});
