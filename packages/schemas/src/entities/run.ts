import { z } from 'zod';
import { entityIdSchema, isoDateTimeSchema, sha256DigestSchema } from '../common.ts';
import { qualityGateEvidenceRefSchema } from './quality-gate.ts';

export const runSchemaVersionSchema = z
  .literal('0.1.0')
  .describe(
    'Run schema version (ADR 0053; M1 foundational entity #5; D-041; final entity in workflow-sequencing investigation §Step 1).',
  );

export const runKindSchema = z
  .enum(['operation_execution'])
  .describe(
    'Run run_kind values (ADR 0053 v1; closed enum, single value). `system_task` and `diagnostic` are registry-canonical reservations; future schema PRs add them per the registered §Procedure rule.',
  );

export const runStateSchema = z
  .enum(['active', 'succeeded', 'failed', 'aborted', 'timeout'])
  .describe(
    'Lifecycle state for a Run record (ADR 0053; 1 active + 4 terminal). Terminal states carry distinct semantic + operational implications: succeeded = expected completion; failed = operation-internal failure with diagnostic Evidence; aborted = explicit cancellation; timeout = bounded-window expiry.',
  );

export const runProducerSchema = z
  .enum(['mint_api', 'kernel_broker'])
  .describe(
    'Kernel-trusted producer allowlist for Run.recorded_by (ADR 0053). `kernel_gateway` intentionally excluded (gateway re-derive does not record Runs). `kernel_dashboard` deferred to its own producer ADR.',
  );

export const runOperationExecutionScopeSchema = z
  .object({
    run_kind: z.literal('operation_execution'),
    operation_shape_ref: entityIdSchema,
    authorizing_decision_id: entityIdSchema,
  })
  .strict()
  .describe(
    'Run scope branch for operation_execution runs (ADR 0053). `authorizing_decision_id` is a typed FK to the Decision with outcome:"allow" that authorized this Run; Layer 1 mint API verifies outcome at Run creation time.',
  );

export const runScopeSchema = z
  .discriminatedUnion('run_kind', [runOperationExecutionScopeSchema])
  .describe('Polymorphic Run scope payload selected by run_kind (ADR 0053 v1).');

const retrievalArtifactIdPattern = /^(knowledge-chunk|derived-summary):/;

function chainWalkRefineRunEvidenceRef(
  ref: z.infer<typeof qualityGateEvidenceRefSchema>,
  ctx: z.RefinementCtx,
  index: number,
): void {
  if (retrievalArtifactIdPattern.test(ref.evidence_id)) {
    ctx.addIssue({
      code: 'custom',
      message:
        'Run evidence_refs must not cite KnowledgeChunk or DerivedSummary records directly (charter inv. 18).',
      path: ['evidence_refs', index],
    });
  }
  if (ref.authority === 'sandbox-observation' || ref.authority === 'self-asserted') {
    ctx.addIssue({
      code: 'custom',
      message:
        'Run evidence_refs cannot carry sandbox-observation or self-asserted authority (charter inv. 8 + inv. 18).',
      path: ['evidence_refs', index, 'authority'],
    });
  }
  for (const [chainIndex, chainRef] of ref.evidence_chain_refs.entries()) {
    if (chainRef.record_kind === 'knowledge_chunk') {
      ctx.addIssue({
        code: 'custom',
        message: 'Run evidence-chain refs must not cite KnowledgeChunk records.',
        path: ['evidence_refs', index, 'evidence_chain_refs', chainIndex, 'record_kind'],
      });
    }
    if (chainRef.authority === 'sandbox-observation' || chainRef.authority === 'self-asserted') {
      ctx.addIssue({
        code: 'custom',
        message:
          'Run evidence-chain refs cannot carry sandbox-observation or self-asserted authority.',
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
          'Run evidence-chain refs cannot cite unpromoted coordination_fact or derived_summary records.',
        path: ['evidence_refs', index, 'evidence_chain_refs', chainIndex, 'allowed_for_gate'],
      });
    }
  }
}

export const runSchema = z
  .object({
    schema_version: runSchemaVersionSchema,
    run_id: entityIdSchema,
    run_kind: runKindSchema,
    scope: runScopeSchema,
    invoker_session_id: entityIdSchema,
    invoker_agent_client_id: entityIdSchema,
    recorded_by: runProducerSchema,
    started_at: isoDateTimeSchema,
    ended_at: isoDateTimeSchema.nullable(),
    execution_context_id: entityIdSchema,
    run_state: runStateSchema,
    audit_chain_link_hash: sha256DigestSchema,
    evidence_refs: z.array(qualityGateEvidenceRefSchema).min(1),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.run_kind !== value.scope.run_kind) {
      ctx.addIssue({
        code: 'custom',
        message: 'scope.run_kind must equal envelope run_kind.',
        path: ['scope', 'run_kind'],
      });
    }

    if (value.ended_at !== null && Date.parse(value.ended_at) < Date.parse(value.started_at)) {
      ctx.addIssue({
        code: 'custom',
        message:
          'ended_at must be greater than or equal to started_at (ADR 0053 §Decision Zod superRefine; reason_kind run_started_at_after_ended_at).',
        path: ['ended_at'],
      });
    }

    if (value.run_state === 'active' && value.ended_at !== null) {
      ctx.addIssue({
        code: 'custom',
        message: 'active Run records must have ended_at null.',
        path: ['ended_at'],
      });
    }
    if (value.run_state !== 'active' && value.ended_at === null) {
      ctx.addIssue({
        code: 'custom',
        message: `Run records in terminal state '${value.run_state}' must carry ended_at.`,
        path: ['ended_at'],
      });
    }

    for (const [index, ref] of value.evidence_refs.entries()) {
      chainWalkRefineRunEvidenceRef(ref, ctx, index);
    }
  })
  .describe(
    'Ring 0 Run entity from ADR 0053. Typed envelope for the execution receipt of every authorized operation. Envelope-only kernel-set (no producer-asserted exceptions; cleaner than Lease per ADR 0031 v1 mixed split). Chain-walk rejection at envelope superRefine fires unconditionally (charter inv. 18). Same-record schema refinement enforces ended_at >= started_at and run_state ↔ ended_at correlation. Cross-record refinements (invoker_session.execution_context_id == Run.execution_context_id, authorizing_decision.execution_context_id == Run.execution_context_id, authorizing_decision.outcome == "allow", terminal-state mutation prevention, D-037 producer-disjointness) live at Ring 1 mint API per registry §Cross-context enforcement layer. Closes the long-pending typed FK target for Evidence.run_id (12 Phase 2 evidence subtypes per ADR 0053 MT-3 at acceptance).',
  );

export type Run = z.infer<typeof runSchema>;
export type RunKind = z.infer<typeof runKindSchema>;
export type RunState = z.infer<typeof runStateSchema>;
export type RunProducer = z.infer<typeof runProducerSchema>;
export type RunScope = z.infer<typeof runScopeSchema>;
