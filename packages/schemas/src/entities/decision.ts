import { z } from 'zod';
import { entityIdSchema, isoDateTimeSchema, sha256DigestSchema } from '../common.ts';
import { approvalGrantKindSchema } from './approval-grant.ts';
import { evidenceRedactionModeSchema } from './evidence.ts';
import { qualityGateEvidenceRefSchema } from './quality-gate.ts';

export const decisionSchemaVersionSchema = z
  .literal('0.1.0')
  .describe(
    'Decision schema version (ADR 0049; M1 foundational entity #1; D-037). ADR 0056 adds Decision.reason_kind values by additive enum widening without bumping this literal.',
  );

export const decisionOutcomeSchema = z
  .enum(['allow', 'deny', 'informational'])
  .describe(
    'Decision outcome discriminator (ADR 0049). `informational` supports non-blocking flag events; `allow` and `deny` carry standard gate-decision semantics.',
  );

export const decisionReasonKindSchema = z
  .enum([
    'coordination_promotion_no_layer1_grounding',
    'deletion_authority_kind_ref_mismatch',
    'cleanup_plan_authority_source_stale',
    'cleanup_plan_target_under_active_lease',
    'worktree_lease_held_by_other_session',
    'operation_class_unregistered',
    'gate_provisional',
    'gate_denied',
    'gate_expired',
    'gate_evidence_insufficient',
    'gate_target_already_active',
    'gate_evidence_stale_reuse',
    'agent_client_axis_self_asserted',
    'containment_evidence_absent',
    'containment_evidence_producer_supplied',
    'containment_runtime_capability_exceeded',
    'audit_chain_corruption_detected',
  ])
  .describe(
    'Zod-defined Decision.reason_kind union (ADR 0049 v1 plus ADR 0056 additive promotions; 17 values). Remaining reservations stay registry-canonical-pending per the registered §Procedure rule.',
  );

export const decisionRequiredGrantKindSchema = approvalGrantKindSchema.describe(
  'Decision.required_grant_kind alias for the canonical approvalGrantKindSchema. Shared source prevents enum drift between Decision and ApprovalGrant (ADR 0049 + ADR 0051 v4 cross-reference commitment).',
);

export const decisionRedactionModeSchema = evidenceRedactionModeSchema
  .exclude(['none'])
  .describe(
    'Decision.reason_text_redaction_mode (ADR 0049). Excludes `none` per the §Decision §Redaction-mode floor rule; bounded length 256 chars enforced separately.',
  );

export const decisionProducerSchema = z
  .enum(['mint_api', 'kernel_broker', 'kernel_gateway'])
  .describe(
    'Kernel-trusted producer allowlist for Decision.decided_by (ADR 0049). `kernel_gateway` is NEW for Decision (gateway re-derive emits Decisions); `mint_api` + `kernel_broker` from ADR 0028.',
  );

type DecisionReasonKindLiteral = z.infer<typeof decisionReasonKindSchema>;
type DecisionOutcomeLiteral = z.infer<typeof decisionOutcomeSchema>;

const decisionReasonKindCompatibleOutcomes: Record<
  DecisionReasonKindLiteral,
  ReadonlyArray<DecisionOutcomeLiteral>
> = {
  coordination_promotion_no_layer1_grounding: ['deny'],
  deletion_authority_kind_ref_mismatch: ['deny'],
  cleanup_plan_authority_source_stale: ['deny'],
  cleanup_plan_target_under_active_lease: ['deny'],
  worktree_lease_held_by_other_session: ['deny'],
  operation_class_unregistered: ['deny'],
  gate_provisional: ['informational'],
  gate_denied: ['deny'],
  gate_expired: ['deny'],
  gate_evidence_insufficient: ['deny'],
  gate_target_already_active: ['deny'],
  gate_evidence_stale_reuse: ['deny'],
  agent_client_axis_self_asserted: ['deny'],
  containment_evidence_absent: ['deny'],
  containment_evidence_producer_supplied: ['deny'],
  containment_runtime_capability_exceeded: ['deny'],
  audit_chain_corruption_detected: ['deny'],
};

const retrievalArtifactIdPattern = /^(knowledge-chunk|derived-summary):/;

function chainWalkRefineDecisionEvidenceRef(
  ref: z.infer<typeof qualityGateEvidenceRefSchema>,
  ctx: z.RefinementCtx,
  index: number,
): void {
  if (retrievalArtifactIdPattern.test(ref.evidence_id)) {
    ctx.addIssue({
      code: 'custom',
      message:
        'Decision evidence_refs must not cite KnowledgeChunk or DerivedSummary records directly (charter inv. 18).',
      path: ['evidence_refs', index],
    });
  }
  if (ref.authority === 'sandbox-observation' || ref.authority === 'self-asserted') {
    ctx.addIssue({
      code: 'custom',
      message:
        'Decision evidence_refs cannot carry sandbox-observation or self-asserted authority (charter inv. 8 + inv. 18).',
      path: ['evidence_refs', index, 'authority'],
    });
  }
  for (const [chainIndex, chainRef] of ref.evidence_chain_refs.entries()) {
    if (chainRef.record_kind === 'knowledge_chunk') {
      ctx.addIssue({
        code: 'custom',
        message:
          'Decision evidence-chain refs must not cite KnowledgeChunk records (charter inv. 18).',
        path: ['evidence_refs', index, 'evidence_chain_refs', chainIndex, 'record_kind'],
      });
    }
    if (chainRef.authority === 'sandbox-observation' || chainRef.authority === 'self-asserted') {
      ctx.addIssue({
        code: 'custom',
        message:
          'Decision evidence-chain refs cannot carry sandbox-observation or self-asserted authority.',
        path: ['evidence_refs', index, 'evidence_chain_refs', chainIndex, 'authority'],
      });
    }
    if (
      (chainRef.record_kind === 'coordination_fact' ||
        chainRef.record_kind === 'derived_summary') &&
      chainRef.allowed_for_gate !== true
    ) {
      ctx.addIssue({
        code: 'custom',
        message:
          'Decision evidence-chain refs cannot cite unpromoted coordination_fact or derived_summary records (ADR 0019 v3 chain-promotion rule).',
        path: ['evidence_refs', index, 'evidence_chain_refs', chainIndex, 'allowed_for_gate'],
      });
    }
  }
}

export const decisionSchema = z
  .object({
    schema_version: decisionSchemaVersionSchema,
    decision_id: entityIdSchema,
    operation_shape_ref: entityIdSchema,
    outcome: decisionOutcomeSchema,
    reason_kind: decisionReasonKindSchema,
    reason_text: z.string().min(1).max(256),
    reason_text_redaction_mode: decisionRedactionModeSchema,
    evidence_refs: z.array(qualityGateEvidenceRefSchema).min(1),
    decided_by: decisionProducerSchema,
    decided_at: isoDateTimeSchema,
    valid_until: isoDateTimeSchema,
    execution_context_id: entityIdSchema,
    audit_chain_link_hash: sha256DigestSchema,
    required_grant_kind: decisionRequiredGrantKindSchema.nullable(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const compatibleOutcomes = decisionReasonKindCompatibleOutcomes[value.reason_kind];
    if (!compatibleOutcomes.includes(value.outcome)) {
      ctx.addIssue({
        code: 'custom',
        message: `outcome '${value.outcome}' is not compatible with reason_kind '${value.reason_kind}' (per ADR 0049 §Decision outcome-compatibility classification). At v1, no reason_kind admits outcome 'allow'; future schema PRs may add allow-compatible reason_kinds via the §Procedure rule.`,
        path: ['outcome'],
      });
    }

    if (
      value.reason_kind === 'operation_class_unregistered' &&
      value.required_grant_kind !== null
    ) {
      ctx.addIssue({
        code: 'custom',
        message:
          'operation_class_unregistered is non-clearable per ADR 0056; required_grant_kind must be null.',
        path: ['required_grant_kind'],
      });
    }

    for (const [index, ref] of value.evidence_refs.entries()) {
      chainWalkRefineDecisionEvidenceRef(ref, ctx, index);
    }
  })
  .describe(
    'Ring 0 Decision entity from ADR 0049. Typed envelope for gate-decision records. Envelope-level kernel-set; chain-walk rejection at envelope superRefine mirrors qualityGateSchema (charter inv. 8 + inv. 18). Outcome-compatibility refinement closes audit-chain-launder surface. Cross-record refinements (D-037 producer-disjointness, audit-chain link continuity, cross-context substitution defense) live at Ring 1 mint API per registry §Cross-context enforcement layer.',
  );

export type Decision = z.infer<typeof decisionSchema>;
export type DecisionOutcome = z.infer<typeof decisionOutcomeSchema>;
export type DecisionReasonKind = z.infer<typeof decisionReasonKindSchema>;
export type DecisionRequiredGrantKind = z.infer<typeof decisionRequiredGrantKindSchema>;
export type DecisionRedactionMode = z.infer<typeof decisionRedactionModeSchema>;
export type DecisionProducer = z.infer<typeof decisionProducerSchema>;
