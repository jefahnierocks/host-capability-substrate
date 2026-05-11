import { z } from 'zod';
import {
  entityIdSchema,
  evidenceRefSchema,
  isoDateTimeSchema,
  sha256DigestSchema,
} from '../common.ts';

export const workspaceContextSchemaVersionSchema = z
  .literal('0.1.0')
  .describe('WorkspaceContext schema version (ADR 0050; M1 foundational entity #2; D-038).');

export const workspaceContextStateSchema = z
  .enum(['active', 'retired'])
  .describe(
    'Lifecycle state for a WorkspaceContext record (ADR 0050; mirrors agentClientStateSchema).',
  );

export const workspaceContextProducerSchema = z
  .enum(['kernel_workspace_diagnose'])
  .describe(
    'Kernel-trusted producer allowlist for WorkspaceContext records. Named enum schema chosen over z.literal per ADR 0050 v3 to anticipate forward-compatible allowlist widening without a schema_version bump.',
  );

export const workspaceContextSchema = z
  .object({
    schema_version: workspaceContextSchemaVersionSchema,
    workspace_context_id: entityIdSchema,
    execution_context_id: entityIdSchema,
    repository_id: entityIdSchema,
    worktree_path: z.string().min(1),
    workspace_context_state: workspaceContextStateSchema,
    kernel_observed_at: isoDateTimeSchema,
    valid_until: isoDateTimeSchema.nullable(),
    producer: workspaceContextProducerSchema,
    audit_chain_link_hash: sha256DigestSchema,
    evidence_refs: z.array(evidenceRefSchema).min(1),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.workspace_context_state === 'active' && value.valid_until !== null) {
      ctx.addIssue({
        code: 'custom',
        message: 'active WorkspaceContext records must have valid_until null.',
        path: ['valid_until'],
      });
    }
    if (value.workspace_context_state === 'retired' && value.valid_until === null) {
      ctx.addIssue({
        code: 'custom',
        message: 'retired WorkspaceContext records must carry valid_until (retirement timestamp).',
        path: ['valid_until'],
      });
    }
  })
  .describe(
    'Ring 0 WorkspaceContext entity from ADR 0050. Typed identity for a 1:1 worktree binding per ADR 0031 v1 §Sub-decision (a). Cross-context binding lives at Ring 1 mint API per registry §Cross-context enforcement layer.',
  );

export type WorkspaceContext = z.infer<typeof workspaceContextSchema>;
export type WorkspaceContextState = z.infer<typeof workspaceContextStateSchema>;
export type WorkspaceContextProducer = z.infer<typeof workspaceContextProducerSchema>;
