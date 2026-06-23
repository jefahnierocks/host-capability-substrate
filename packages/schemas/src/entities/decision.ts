import { z } from 'zod';
import { entityIdSchema, isoDateTimeSchema, sha256DigestSchema } from '../common.ts';
import { approvalGrantKindSchema } from './approval-grant.ts';
import { evidenceRedactionModeSchema } from './evidence.ts';
import { qualityGateEvidenceRefSchema } from './quality-gate.ts';

export const decisionSchemaVersionSchema = z
  .literal('0.1.0')
  .describe(
    'Decision schema version (ADR 0049; M1 foundational entity #1; D-037). ADRs 0056 and 0058 add Decision.reason_kind values by additive enum widening without bumping this literal. ADR 0061 / D-059 adds the additive nullable-optional attribution pair policy_rule_ref + resolved_policy_sha256 — an additive nullable-optional field extension (a distinct change class from additive enum widening) that likewise does not bump this literal. The M2 entry promotion lifts the three ADR 0034 §Sub-decision (d) boundary_evidence_* reason kinds (additive enum widening) and adds the additive nullable-optional divergent_evidence_ref_pair contradiction co-record — neither bumps this literal.',
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
    'authority_chain_walk_depth_exceeded',
    'boundary_evidence_stale',
    'boundary_evidence_missing',
    'boundary_evidence_contradictory',
  ])
  .describe(
    'Zod-defined Decision.reason_kind union (ADR 0049 v1 plus ADR 0056, ADR 0058, and ADR 0034 §Sub-decision (d) M2-entry additive promotions; 21 values). The three boundary_evidence_* kinds are this-invocation rejects keyed to BoundaryObservation stateness (stale = valid_until window expired at re-check; missing = a required boundary_dimension evidence_ref absent from the consuming chain, with unknown evaluating as missing; contradictory = linked observations diverging on structural facts, co-recording divergent_evidence_ref_pair). None promotes the operation to forbidden tier (ADR 0029 v2 block-vs-forbidden framing). Remaining reservations stay registry-canonical-pending per the registered §Procedure rule.',
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
  authority_chain_walk_depth_exceeded: ['deny'],
  boundary_evidence_stale: ['deny'],
  boundary_evidence_missing: ['deny'],
  boundary_evidence_contradictory: ['deny'],
};

// ADR 0034 §Sub-decision (d): each boundary_evidence_* rejection is clearable
// only by its matching single-use acknowledgment grant kind. Ring 0 enforces
// the kind pairing (null stays valid — not every rejection offers a grant
// path); single-use-per-operation_id consumption is a Ring 1 mint obligation.
const boundaryEvidenceGrantPairing: Partial<
  Record<DecisionReasonKindLiteral, z.infer<typeof decisionRequiredGrantKindSchema>>
> = {
  boundary_evidence_stale: 'boundary_evidence_freshness_override',
  boundary_evidence_missing: 'boundary_evidence_absence_acceptance',
  boundary_evidence_contradictory: 'boundary_evidence_contradiction_acknowledgment',
};

const retrievalArtifactIdPattern = /^(knowledge-chunk|derived-summary):/;

function chainWalkRefineDecisionEvidenceRef(
  ref: z.infer<typeof qualityGateEvidenceRefSchema>,
  ctx: z.RefinementCtx,
  path: ReadonlyArray<string | number>,
): void {
  if (retrievalArtifactIdPattern.test(ref.evidence_id)) {
    ctx.addIssue({
      code: 'custom',
      message:
        'Decision evidence_refs must not cite KnowledgeChunk or DerivedSummary records directly (charter inv. 18).',
      path: [...path],
    });
  }
  if (ref.authority === 'sandbox-observation' || ref.authority === 'self-asserted') {
    ctx.addIssue({
      code: 'custom',
      message:
        'Decision evidence_refs cannot carry sandbox-observation or self-asserted authority (charter inv. 8 + inv. 18).',
      path: [...path, 'authority'],
    });
  }
  for (const [chainIndex, chainRef] of ref.evidence_chain_refs.entries()) {
    if (chainRef.record_kind === 'knowledge_chunk') {
      ctx.addIssue({
        code: 'custom',
        message:
          'Decision evidence-chain refs must not cite KnowledgeChunk records (charter inv. 18).',
        path: [...path, 'evidence_chain_refs', chainIndex, 'record_kind'],
      });
    }
    if (chainRef.authority === 'sandbox-observation' || chainRef.authority === 'self-asserted') {
      ctx.addIssue({
        code: 'custom',
        message:
          'Decision evidence-chain refs cannot carry sandbox-observation or self-asserted authority.',
        path: [...path, 'evidence_chain_refs', chainIndex, 'authority'],
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
        path: [...path, 'evidence_chain_refs', chainIndex, 'allowed_for_gate'],
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
    policy_rule_ref: entityIdSchema
      .nullable()
      .optional()
      .describe(
        'ADR 0061 / D-059: typed reference to the PolicyRule.policy_rule_id (ADR 0060) that authorized this gate decision. Additive nullable-optional — absent/null when no rule applies; no Decision.schema_version bump. Pair-consistent with resolved_policy_sha256 on attributed-ness (both present-and-non-null, or neither). FK existence + operation-class match are Ring 1 mint/audit obligations, not Ring 0.',
      ),
    resolved_policy_sha256: sha256DigestSchema
      .nullable()
      .optional()
      .describe(
        'ADR 0061 / D-059: the live-policy BLOB digest the referenced PolicyRule was resolved against — the value snapshot-binding-check recomputes over the vendored snapshot, equal to the source_provenance.source_policy_sha256 of the referenced rule (ADR 0060), and explicitly NOT the live policy stale internal snapshot_binding.source_policy_sha256 marker. Ring 0 validates format only (sha256: + 64 lowercase hex); the digest-vs-bound-snapshot trust check (B-2) is a Ring 1 loader obligation. Additive nullable-optional — absent/null when no rule applies; pair-consistent with policy_rule_ref on attributed-ness.',
      ),
    divergent_evidence_ref_pair: z
      .array(qualityGateEvidenceRefSchema)
      .length(2)
      .nullable()
      .optional()
      .describe(
        'ADR 0034 §Sub-decision (d) audit-chain attribution rule (M2 entry promotion): exactly two evidence_ref entries naming the diverging BoundaryObservation records, so audit consumers can trace which observation contradicted which without joining the underlying records. Required (present and non-null) when reason_kind is boundary_evidence_contradictory; must be absent/null for every other reason_kind. Additive nullable-optional — no Decision.schema_version bump (ADR 0061 precedent). Entries carry the same chain-walk rejection discipline as evidence_refs (charter inv. 8 + inv. 18).',
      ),
    model_ref: entityIdSchema
      .nullable()
      .optional()
      .describe(
        'ADR 0076 / D-077: typed ATTRIBUTION FK to the Model (ADR 0076) that produced this decision — "which model decided this." In the additive-nullable-optional, no-Decision.schema_version-bump change class of policy_rule_ref (ADR 0061). EXCLUDED from the audit_chain_link_hash canonical concatenation (attribution-field posture, like AgentClient excludes producer; existing chains stay valid) — the exact canonical-encoding is committed by the mint/audit implementation. Model attribution is PRODUCER-ASSERTED (no paired digest, unlike policy_rule_ref<->resolved_policy_sha256); binding model_ref to a `subject_kind: model` Evidence record is a Ring 1 trust obligation. FK existence is a Ring 1 obligation.',
      ),
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

    if (value.reason_kind === 'authority_chain_walk_depth_exceeded') {
      if (value.required_grant_kind !== null) {
        ctx.addIssue({
          code: 'custom',
          message:
            'authority_chain_walk_depth_exceeded is non-clearable per ADR 0058; required_grant_kind must be null.',
          path: ['required_grant_kind'],
        });
      }

      if (value.decided_by !== 'mint_api' && value.decided_by !== 'kernel_broker') {
        ctx.addIssue({
          code: 'custom',
          message:
            'authority_chain_walk_depth_exceeded may only be emitted by mint_api or kernel_broker per ADR 0058; kernel_gateway remains excluded pending a future gateway ADR.',
          path: ['decided_by'],
        });
      }
    }

    for (const [index, ref] of value.evidence_refs.entries()) {
      chainWalkRefineDecisionEvidenceRef(ref, ctx, ['evidence_refs', index]);
    }

    const pairedGrantKind = boundaryEvidenceGrantPairing[value.reason_kind];
    if (
      pairedGrantKind !== undefined &&
      value.required_grant_kind !== null &&
      value.required_grant_kind !== pairedGrantKind
    ) {
      ctx.addIssue({
        code: 'custom',
        message: `reason_kind '${value.reason_kind}' is clearable only by its matching single-use acknowledgment grant '${pairedGrantKind}' or null (ADR 0034 §Sub-decision (d) pairing); got '${value.required_grant_kind}'.`,
        path: ['required_grant_kind'],
      });
    }

    const divergentPairPresent =
      value.divergent_evidence_ref_pair !== undefined && value.divergent_evidence_ref_pair !== null;
    if (value.reason_kind === 'boundary_evidence_contradictory' && !divergentPairPresent) {
      ctx.addIssue({
        code: 'custom',
        message:
          'boundary_evidence_contradictory must co-record divergent_evidence_ref_pair (exactly two evidence_ref entries naming the diverging observations) per ADR 0034 §Sub-decision (d) audit-chain attribution rule.',
        path: ['divergent_evidence_ref_pair'],
      });
    }
    if (value.reason_kind !== 'boundary_evidence_contradictory' && divergentPairPresent) {
      ctx.addIssue({
        code: 'custom',
        message:
          'divergent_evidence_ref_pair is reserved for boundary_evidence_contradictory rejections; it must be absent/null for every other reason_kind.',
        path: ['divergent_evidence_ref_pair'],
      });
    }
    if (divergentPairPresent && value.divergent_evidence_ref_pair) {
      for (const [index, ref] of value.divergent_evidence_ref_pair.entries()) {
        chainWalkRefineDecisionEvidenceRef(ref, ctx, ['divergent_evidence_ref_pair', index]);
      }
    }

    const ruleAttributed = value.policy_rule_ref !== undefined && value.policy_rule_ref !== null;
    const digestAttributed =
      value.resolved_policy_sha256 !== undefined && value.resolved_policy_sha256 !== null;
    if (ruleAttributed && !digestAttributed) {
      ctx.addIssue({
        code: 'custom',
        message:
          'policy_rule_ref is attributed but resolved_policy_sha256 is absent/null; a rule-attributed Decision must also carry the resolved policy digest (ADR 0061 pair-consistency on attributed-ness).',
        path: ['resolved_policy_sha256'],
      });
    }
    if (digestAttributed && !ruleAttributed) {
      ctx.addIssue({
        code: 'custom',
        message:
          'resolved_policy_sha256 is attributed but policy_rule_ref is absent/null; a digest-attributed Decision must also carry the rule reference (ADR 0061 pair-consistency on attributed-ness).',
        path: ['policy_rule_ref'],
      });
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
