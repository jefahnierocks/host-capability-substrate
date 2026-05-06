import { z } from 'zod';
import {
  entityIdSchema,
  evidenceAuthoritySchema,
  evidenceConfidenceSchema,
  evidenceRefSchema,
  isoDateTimeSchema,
} from '../common.ts';
import { evidenceRedactionModeSchema, evidenceSchemaVersionSchema } from './evidence.ts';

const commitShaSchema = z
  .string()
  .regex(/^[a-f0-9]{40}$/)
  .describe('Lowercase full Git commit SHA.');

const workflowRunSubjectRefSchema = z
  .object({
    subject_kind: z.literal('workflow_run'),
    subject_id: entityIdSchema,
    relation: z.string().min(1).optional(),
  })
  .strict()
  .describe('Subject reference for a WorkflowRunReceipt Evidence subtype.');

export const workflowRunConclusionKindSchema = z
  .enum(['success', 'failure', 'cancelled', 'skipped', 'neutral', 'timed_out', 'action_required'])
  .describe('ADR 0032 GitHub Actions workflow-run conclusion kind.');

export const workflowRunPayloadSchema = z
  .object({
    repository_id: entityIdSchema,
    workflow_run_id: z.string().min(1),
    commit_sha: commitShaSchema,
    actor_login: z.string().min(1),
    workflow_path: z.string().min(1),
    conclusion_kind: workflowRunConclusionKindSchema,
    started_at: isoDateTimeSchema,
    completed_at: isoDateTimeSchema,
    runner_host_evidence_ref: evidenceRefSchema.nullable(),
  })
  .strict()
  .refine((value) => Date.parse(value.started_at) <= Date.parse(value.completed_at), {
    message: 'WorkflowRunReceipt completed_at must be at or after started_at.',
    path: ['completed_at'],
  })
  .describe('ADR 0032 WorkflowRunReceipt typed Evidence payload.');

const workflowRunReceiptBaseSchema = z.object({
  schema_version: evidenceSchemaVersionSchema,
  evidence_id: entityIdSchema,
  evidence_kind: z.literal('receipt'),
  subject_refs: z.array(workflowRunSubjectRefSchema).min(1),
  source: z.string().min(1),
  observed_at: isoDateTimeSchema,
  valid_until: isoDateTimeSchema.nullable(),
  confidence: evidenceConfidenceSchema,
  parser_version: z.string().min(1),
  producer: z.string().min(1).optional(),
  host_id: entityIdSchema.optional(),
  workspace_id: entityIdSchema.optional(),
  execution_context_id: entityIdSchema.optional(),
  session_id: entityIdSchema.optional(),
  run_id: entityIdSchema.optional(),
  payload_schema_version: z.literal('workflow-run-receipt:v1'),
  payload: workflowRunPayloadSchema,
  redaction_mode: evidenceRedactionModeSchema.optional(),
});

const nonSandboxWorkflowRunReceiptSchema = workflowRunReceiptBaseSchema
  .extend({
    authority: evidenceAuthoritySchema.exclude(['sandbox-observation']),
    source_ref: z.string().min(1).optional(),
  })
  .strict();

const sandboxWorkflowRunReceiptBaseSchema = workflowRunReceiptBaseSchema.extend({
  authority: z.literal('sandbox-observation'),
  execution_context_id: entityIdSchema,
});

export const workflowRunReceiptSchema = z
  .union([
    sandboxWorkflowRunReceiptBaseSchema
      .extend({
        source_ref: z.string().min(1),
      })
      .strict(),
    sandboxWorkflowRunReceiptBaseSchema
      .extend({
        source_ref: z.string().min(1).optional(),
        session_id: entityIdSchema,
      })
      .strict(),
    sandboxWorkflowRunReceiptBaseSchema
      .extend({
        source_ref: z.string().min(1).optional(),
        run_id: entityIdSchema,
      })
      .strict(),
    nonSandboxWorkflowRunReceiptSchema,
  ])
  .describe('ADR 0032 WorkflowRunReceipt direct Evidence subtype.');

export type WorkflowRunConclusionKind = z.infer<typeof workflowRunConclusionKindSchema>;
export type WorkflowRunPayload = z.infer<typeof workflowRunPayloadSchema>;
export type WorkflowRunReceipt = z.infer<typeof workflowRunReceiptSchema>;
