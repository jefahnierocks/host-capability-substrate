import { z } from 'zod';
import { entityIdSchema, isoDateTimeSchema, sha256DigestSchema } from '../common.ts';
import { qualityGateEvidenceRefSchema } from './quality-gate.ts';

export const leaseSchemaVersionSchema = z
  .literal('0.1.0')
  .describe('Lease schema version (ADR 0052; M1 foundational entity #4; D-040).');

export const leaseKindSchema = z
  .enum(['worktree'])
  .describe(
    'Lease lease_kind values (ADR 0052 v1; closed enum, single value). `credential_audience` and `external_target` are registry-canonical reservations per ADR 0031 v1 §Out of scope; future schema PRs add them per the registered §Procedure rule.',
  );

export const leaseStateSchema = z
  .enum(['active', 'expired', 'released', 'force_broken'])
  .describe(
    'Lifecycle state for a Lease record (ADR 0052; 4 values per ADR 0031 v1; mirrors agentClientStateSchema / workspaceContextStateSchema / approvalGrantStateSchema).',
  );

export const leaseProducerSchema = z
  .enum(['mint_api', 'kernel_broker'])
  .describe(
    'Kernel-trusted producer allowlist for Lease.acquired_by (ADR 0052). `kernel_gateway` intentionally excluded (gateway re-derive does not mint leases). `kernel_dashboard` deferred to its own producer ADR.',
  );

export const leaseWorktreeScopeSchema = z
  .object({
    lease_kind: z.literal('worktree'),
    repository_id: entityIdSchema,
    workspace_context_id: entityIdSchema,
    worktree_path: z.string().min(1),
  })
  .strict()
  .describe(
    'Lease scope branch for worktree leases (ADR 0052). `worktree_path` is producer-asserted, kernel-verifiable per ADR 0031 v1 §Authority discipline; Layer 1 mint API canonicalizes per Mechanical Tweak #2 / Security-D before the uniqueness check on (repository_id, canonical(worktree_path), lease_state == active).',
  );

export const leaseScopeSchema = z
  .discriminatedUnion('lease_kind', [leaseWorktreeScopeSchema])
  .describe('Polymorphic Lease scope payload selected by lease_kind (ADR 0052 v1).');

const retrievalArtifactIdPattern = /^(knowledge-chunk|derived-summary):/;

function chainWalkRefineLeaseEvidenceRef(
  ref: z.infer<typeof qualityGateEvidenceRefSchema>,
  ctx: z.RefinementCtx,
  index: number,
): void {
  if (retrievalArtifactIdPattern.test(ref.evidence_id)) {
    ctx.addIssue({
      code: 'custom',
      message:
        'Lease evidence_refs must not cite KnowledgeChunk or DerivedSummary records directly (charter inv. 18).',
      path: ['evidence_refs', index],
    });
  }
  if (ref.authority === 'sandbox-observation' || ref.authority === 'self-asserted') {
    ctx.addIssue({
      code: 'custom',
      message:
        'Lease evidence_refs cannot carry sandbox-observation or self-asserted authority (charter inv. 8 + inv. 18).',
      path: ['evidence_refs', index, 'authority'],
    });
  }
  for (const [chainIndex, chainRef] of ref.evidence_chain_refs.entries()) {
    if (chainRef.record_kind === 'knowledge_chunk') {
      ctx.addIssue({
        code: 'custom',
        message: 'Lease evidence-chain refs must not cite KnowledgeChunk records.',
        path: ['evidence_refs', index, 'evidence_chain_refs', chainIndex, 'record_kind'],
      });
    }
    if (chainRef.authority === 'sandbox-observation' || chainRef.authority === 'self-asserted') {
      ctx.addIssue({
        code: 'custom',
        message:
          'Lease evidence-chain refs cannot carry sandbox-observation or self-asserted authority.',
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
          'Lease evidence-chain refs cannot cite unpromoted coordination_fact or derived_summary records.',
        path: ['evidence_refs', index, 'evidence_chain_refs', chainIndex, 'allowed_for_gate'],
      });
    }
  }
}

export const leaseSchema = z
  .object({
    schema_version: leaseSchemaVersionSchema,
    lease_id: entityIdSchema,
    lease_kind: leaseKindSchema,
    scope: leaseScopeSchema,
    held_by_session_id: entityIdSchema,
    held_by_agent_client_id: entityIdSchema,
    acquired_by: leaseProducerSchema,
    acquired_at: isoDateTimeSchema,
    valid_until: isoDateTimeSchema,
    released_at: isoDateTimeSchema.nullable(),
    execution_context_id: entityIdSchema,
    lease_state: leaseStateSchema,
    force_break_grant_id: entityIdSchema.nullable(),
    audit_chain_link_hash: sha256DigestSchema,
    evidence_refs: z.array(qualityGateEvidenceRefSchema).min(1),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.lease_kind !== value.scope.lease_kind) {
      ctx.addIssue({
        code: 'custom',
        message: 'scope.lease_kind must equal envelope lease_kind.',
        path: ['scope', 'lease_kind'],
      });
    }

    if (Date.parse(value.valid_until) <= Date.parse(value.acquired_at)) {
      ctx.addIssue({
        code: 'custom',
        message: 'valid_until must be strictly later than acquired_at.',
        path: ['valid_until'],
      });
    }

    if (value.lease_state === 'active') {
      if (value.released_at !== null) {
        ctx.addIssue({
          code: 'custom',
          message: 'active Lease records must have released_at null.',
          path: ['released_at'],
        });
      }
      if (value.force_break_grant_id !== null) {
        ctx.addIssue({
          code: 'custom',
          message: 'active Lease records must have force_break_grant_id null.',
          path: ['force_break_grant_id'],
        });
      }
    } else if (value.released_at === null) {
      ctx.addIssue({
        code: 'custom',
        message: `Lease records in terminal state '${value.lease_state}' must carry released_at.`,
        path: ['released_at'],
      });
    }

    if (value.lease_state === 'force_broken') {
      if (value.force_break_grant_id === null) {
        ctx.addIssue({
          code: 'custom',
          message:
            'force_broken Lease records must carry force_break_grant_id (FK to the consuming ApprovalGrant).',
          path: ['force_break_grant_id'],
        });
      }
    } else if (value.lease_state !== 'active' && value.force_break_grant_id !== null) {
      ctx.addIssue({
        code: 'custom',
        message: 'force_break_grant_id is only populated when lease_state is force_broken.',
        path: ['force_break_grant_id'],
      });
    }

    for (const [index, ref] of value.evidence_refs.entries()) {
      chainWalkRefineLeaseEvidenceRef(ref, ctx, index);
    }
  })
  .describe(
    'Ring 0 Lease entity from ADR 0052. Typed envelope for session-scoped resource holds. Envelope-level kernel-set with three producer-asserted-kernel-verifiable field-level exceptions per ADR 0031 v1 §Authority discipline (lease_kind, scope, valid_until). `held_by_session_id` is a typed FK to Session (ADR 0055 / D-044; FK shape unchanged at entityIdSchema; only the semantic referent gains a typed Ring 0 target). `held_by_agent_client_id` continues to be a typed FK to AgentClient. Chain-walk rejection at envelope superRefine fires unconditionally (charter inv. 18). Cross-record refinements (worktree-cardinality uniqueness, sandbox-acquire rejection, holder-only release via UUID-byte-equality on Session FK target per ADR 0052 §Identity comparison form, force-break separation of duties, D-037 producer-disjointness, valid_until inheritance) live at Ring 1 mint API per registry §Cross-context enforcement layer.',
  );

export type Lease = z.infer<typeof leaseSchema>;
export type LeaseKind = z.infer<typeof leaseKindSchema>;
export type LeaseState = z.infer<typeof leaseStateSchema>;
export type LeaseProducer = z.infer<typeof leaseProducerSchema>;
export type LeaseScope = z.infer<typeof leaseScopeSchema>;
