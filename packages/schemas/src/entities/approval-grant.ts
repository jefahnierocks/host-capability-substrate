import { z } from 'zod';
import { entityIdSchema, isoDateTimeSchema, sha256DigestSchema } from '../common.ts';
import { qualityGateEvidenceRefSchema } from './quality-gate.ts';
import { gitBranchRefSchema } from './source-control-evidence.ts';

export const approvalGrantSchemaVersionSchema = z
  .literal('0.1.0')
  .describe('ApprovalGrant schema version (ADR 0051 v4; M1 foundational entity #3; D-039).');

export const approvalGrantKindSchema = z
  .enum([
    'gate_evidence_acknowledgment',
    'worktree_clean_acknowledgment',
    'pr_absence_acknowledgment',
    'boundary_evidence_freshness_override',
    'boundary_evidence_contradiction_acknowledgment',
    'boundary_evidence_absence_acceptance',
  ])
  .describe(
    'ApprovalGrant grant_kind values from ADR 0051 v4 plus the three ADR 0034 §Sub-decision (d) boundary-evidence acknowledgment kinds (M2 entry promotion; additive enum widening, no ApprovalGrant.schema_version bump). The original three close the registry §Decision.required_grant_kind reservations (ADR 0030 + ADR 0035); the boundary_evidence_* three pair one-to-one with the boundary_evidence_* Decision.reason_kind rejections and are single-use per operation_id at Ring 1 mint (ADR 0030 v2 / ADR 0031 v1 acknowledgment-grant precedent). Re-used by Decision.required_grant_kind to prevent enum drift.',
  );

export const approvalGrantStateSchema = z
  .enum(['active', 'consumed', 'expired', 'revoked'])
  .describe(
    'Lifecycle state for an ApprovalGrant record (ADR 0051 v4; mirrors agentClientStateSchema / workspaceContextStateSchema).',
  );

export const approvalGrantProducerSchema = z
  .enum(['mint_api', 'kernel_broker'])
  .describe(
    'Kernel-trusted producer allowlist for ApprovalGrant records (ADR 0051 v4). `kernel_gateway` is intentionally excluded: the gateway re-derive is the authoritative non-escalable layer and does not mint grants. `kernel_dashboard` deferred to its own producer ADR.',
  );

export const approvalGrantGateEvidenceAcknowledgmentScopeSchema = z
  .object({
    grant_kind: z.literal('gate_evidence_acknowledgment'),
    gate_id: entityIdSchema,
    acknowledged_evidence_refs: z.array(qualityGateEvidenceRefSchema).min(1),
  })
  .strict()
  .describe('ApprovalGrant scope branch for gate_evidence_acknowledgment grants (ADR 0051 v4).');

export const approvalGrantWorktreeCleanAcknowledgmentScopeSchema = z
  .object({
    grant_kind: z.literal('worktree_clean_acknowledgment'),
    workspace_context_id: entityIdSchema,
    acknowledged_dirty_state_evidence_ref: qualityGateEvidenceRefSchema,
  })
  .strict()
  .describe('ApprovalGrant scope branch for worktree_clean_acknowledgment grants (ADR 0051 v4).');

export const approvalGrantPrAbsenceAcknowledgmentScopeSchema = z
  .object({
    grant_kind: z.literal('pr_absence_acknowledgment'),
    repository_id: entityIdSchema,
    branch_ref: gitBranchRefSchema,
    acknowledged_pr_absence_evidence_ref: qualityGateEvidenceRefSchema,
  })
  .strict()
  .describe('ApprovalGrant scope branch for pr_absence_acknowledgment grants (ADR 0051 v4).');

export const approvalGrantBoundaryEvidenceFreshnessOverrideScopeSchema = z
  .object({
    grant_kind: z.literal('boundary_evidence_freshness_override'),
    boundary_observation_evidence_refs: z.array(qualityGateEvidenceRefSchema).min(1),
    execution_context_id: entityIdSchema,
  })
  .strict()
  .describe(
    'ApprovalGrant scope branch for boundary_evidence_freshness_override grants (ADR 0034 §Sub-decision (d)): binds the specific stale BoundaryObservation evidence_refs being acknowledged plus the execution context whose boundary evidence is acknowledged. Scope-key disjointness preserved versus the worktree/destructive-git/merge/external-control-plane/runner per-class extensions. Scope-vs-envelope execution_context_id equality is a Ring 1 mint obligation.',
  );

export const approvalGrantBoundaryEvidenceContradictionAcknowledgmentScopeSchema = z
  .object({
    grant_kind: z.literal('boundary_evidence_contradiction_acknowledgment'),
    boundary_observation_evidence_refs: z.array(qualityGateEvidenceRefSchema).min(2),
    execution_context_id: entityIdSchema,
  })
  .strict()
  .describe(
    'ApprovalGrant scope branch for boundary_evidence_contradiction_acknowledgment grants (ADR 0034 §Sub-decision (d)): binds the diverging BoundaryObservation evidence_refs being acknowledged (minimum two — a contradiction needs at least the divergent pair) plus the execution context. Scope-key disjointness preserved versus the other per-class extensions; scope-vs-envelope execution_context_id equality is a Ring 1 mint obligation.',
  );

export const approvalGrantBoundaryEvidenceAbsenceAcceptanceScopeSchema = z
  .object({
    grant_kind: z.literal('boundary_evidence_absence_acceptance'),
    boundary_observation_evidence_refs: z.array(qualityGateEvidenceRefSchema).min(1),
    execution_context_id: entityIdSchema,
  })
  .strict()
  .describe(
    'ApprovalGrant scope branch for boundary_evidence_absence_acceptance grants (ADR 0034 §Sub-decision (d)): binds the related BoundaryObservation evidence_refs contextualizing the accepted absence (the observations that exist around the missing required dimension) plus the execution context. Scope-key disjointness preserved versus the other per-class extensions; scope-vs-envelope execution_context_id equality is a Ring 1 mint obligation.',
  );

export const approvalGrantScopeSchema = z
  .discriminatedUnion('grant_kind', [
    approvalGrantGateEvidenceAcknowledgmentScopeSchema,
    approvalGrantWorktreeCleanAcknowledgmentScopeSchema,
    approvalGrantPrAbsenceAcknowledgmentScopeSchema,
    approvalGrantBoundaryEvidenceFreshnessOverrideScopeSchema,
    approvalGrantBoundaryEvidenceContradictionAcknowledgmentScopeSchema,
    approvalGrantBoundaryEvidenceAbsenceAcceptanceScopeSchema,
  ])
  .describe(
    'Polymorphic ApprovalGrant scope payload selected by grant_kind (ADR 0051 v4; boundary_evidence_* branches added per ADR 0034 §Sub-decision (d) at M2 entry).',
  );

const retrievalArtifactIdPattern = /^(knowledge-chunk|derived-summary):/;

function chainWalkRefineEvidenceRef(
  ref: z.infer<typeof qualityGateEvidenceRefSchema>,
  ctx: z.RefinementCtx,
  path: ReadonlyArray<string | number>,
): void {
  if (retrievalArtifactIdPattern.test(ref.evidence_id)) {
    ctx.addIssue({
      code: 'custom',
      message:
        'ApprovalGrant evidence refs must not cite KnowledgeChunk or DerivedSummary records directly (charter inv. 18).',
      path: [...path],
    });
  }
  if (ref.authority === 'sandbox-observation' || ref.authority === 'self-asserted') {
    ctx.addIssue({
      code: 'custom',
      message:
        'ApprovalGrant evidence refs cannot carry sandbox-observation or self-asserted authority (charter inv. 8 + inv. 18).',
      path: [...path, 'authority'],
    });
  }
  for (const [index, chainRef] of ref.evidence_chain_refs.entries()) {
    if (chainRef.record_kind === 'knowledge_chunk') {
      ctx.addIssue({
        code: 'custom',
        message:
          'ApprovalGrant evidence-chain refs must not cite KnowledgeChunk records (charter inv. 18).',
        path: [...path, 'evidence_chain_refs', index, 'record_kind'],
      });
    }
    if (chainRef.authority === 'sandbox-observation' || chainRef.authority === 'self-asserted') {
      ctx.addIssue({
        code: 'custom',
        message:
          'ApprovalGrant evidence-chain refs cannot carry sandbox-observation or self-asserted authority (charter inv. 8 + inv. 18).',
        path: [...path, 'evidence_chain_refs', index, 'authority'],
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
          'ApprovalGrant evidence-chain refs cannot cite unpromoted coordination_fact or derived_summary records (ADR 0019 v3 chain-promotion rule).',
        path: [...path, 'evidence_chain_refs', index, 'allowed_for_gate'],
      });
    }
  }
}

export const approvalGrantSchema = z
  .object({
    schema_version: approvalGrantSchemaVersionSchema,
    approval_grant_id: entityIdSchema,
    grant_kind: approvalGrantKindSchema,
    scope: approvalGrantScopeSchema,
    minted_for_decision_id: entityIdSchema,
    grantor_principal_ref: entityIdSchema,
    granted_by: approvalGrantProducerSchema,
    granted_at: isoDateTimeSchema,
    valid_until: isoDateTimeSchema,
    execution_context_id: entityIdSchema,
    grant_state: approvalGrantStateSchema,
    audit_chain_link_hash: sha256DigestSchema,
    evidence_refs: z.array(qualityGateEvidenceRefSchema).min(1),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.grant_kind !== value.scope.grant_kind) {
      ctx.addIssue({
        code: 'custom',
        message: 'scope.grant_kind must equal envelope grant_kind.',
        path: ['scope', 'grant_kind'],
      });
    }

    if (Date.parse(value.valid_until) <= Date.parse(value.granted_at)) {
      ctx.addIssue({
        code: 'custom',
        message: 'valid_until must be strictly later than granted_at.',
        path: ['valid_until'],
      });
    }

    for (const [index, ref] of value.evidence_refs.entries()) {
      chainWalkRefineEvidenceRef(ref, ctx, ['evidence_refs', index]);
    }

    if (value.scope.grant_kind === 'gate_evidence_acknowledgment') {
      for (const [index, ref] of value.scope.acknowledged_evidence_refs.entries()) {
        chainWalkRefineEvidenceRef(ref, ctx, ['scope', 'acknowledged_evidence_refs', index]);
      }
    } else if (value.scope.grant_kind === 'worktree_clean_acknowledgment') {
      chainWalkRefineEvidenceRef(value.scope.acknowledged_dirty_state_evidence_ref, ctx, [
        'scope',
        'acknowledged_dirty_state_evidence_ref',
      ]);
    } else if (value.scope.grant_kind === 'pr_absence_acknowledgment') {
      chainWalkRefineEvidenceRef(value.scope.acknowledged_pr_absence_evidence_ref, ctx, [
        'scope',
        'acknowledged_pr_absence_evidence_ref',
      ]);
    } else if (
      value.scope.grant_kind === 'boundary_evidence_freshness_override' ||
      value.scope.grant_kind === 'boundary_evidence_contradiction_acknowledgment' ||
      value.scope.grant_kind === 'boundary_evidence_absence_acceptance'
    ) {
      for (const [index, ref] of value.scope.boundary_observation_evidence_refs.entries()) {
        chainWalkRefineEvidenceRef(ref, ctx, [
          'scope',
          'boundary_observation_evidence_refs',
          index,
        ]);
      }
    }
  })
  .describe(
    'Ring 0 ApprovalGrant entity from ADR 0051 v4. Typed envelope for gate-decision-override grants. Envelope-level kernel-set; chain-walk rejection at envelope superRefine fires unconditionally across envelope evidence_refs and scope-payload acknowledged_* refs (charter inv. 18). `grantor_principal_ref` is a typed FK to Principal (ADR 0054 / D-043; FK shape unchanged at entityIdSchema; field continues to be entityIdSchema both before and after ADR 0054, only the semantic referent gains a typed Ring 0 target). Cross-record refinements (D-037 producer-disjointness, valid_until <= Decision.valid_until, cardinality on minted_for_decision_id, self-approval rejection via UUID-byte-equality on principal_id surface IDs canonicalized at Principal mint per ADR 0054 §Compliance §Principal-id canonicalization rule 4-step recipe with Cf-category strip closing the MT-Sec-2 zero-width-character evasion class) live at Ring 1 mint API per registry §Cross-context enforcement layer.',
  );

export type ApprovalGrant = z.infer<typeof approvalGrantSchema>;
export type ApprovalGrantKind = z.infer<typeof approvalGrantKindSchema>;
export type ApprovalGrantState = z.infer<typeof approvalGrantStateSchema>;
export type ApprovalGrantProducer = z.infer<typeof approvalGrantProducerSchema>;
export type ApprovalGrantScope = z.infer<typeof approvalGrantScopeSchema>;
