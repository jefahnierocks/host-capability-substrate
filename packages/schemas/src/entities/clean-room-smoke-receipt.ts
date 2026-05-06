import { z } from 'zod';
import {
  entityIdSchema,
  evidenceAuthoritySchema,
  evidenceConfidenceSchema,
  evidenceRefSchema,
  isoDateTimeSchema,
  sha256DigestSchema,
} from '../common.ts';
import { evidenceRedactionModeSchema, evidenceSchemaVersionSchema } from './evidence.ts';

const cleanRoomSmokeSubjectRefSchema = z
  .object({
    subject_kind: z.literal('clean_room_smoke'),
    subject_id: entityIdSchema,
    relation: z.string().min(1).optional(),
  })
  .strict()
  .describe('Subject reference for a CleanRoomSmokeReceipt Evidence subtype.');

export const dependencyInstallOutcomeKindSchema = z
  .enum(['success', 'failure'])
  .describe('ADR 0032 clean-room smoke dependency-install outcome.');

export const cleanRoomSmokePayloadSchema = z
  .object({
    repository_id: entityIdSchema,
    hosted_runner_workflow_run_id: z.string().min(1),
    script_invoked: z.string().min(1),
    dependency_install_outcome_kind: dependencyInstallOutcomeKindSchema,
    artifact_hash: sha256DigestSchema,
    started_at: isoDateTimeSchema,
    completed_at: isoDateTimeSchema,
    runner_isolation_evidence_ref: evidenceRefSchema,
  })
  .strict()
  .refine((value) => Date.parse(value.started_at) <= Date.parse(value.completed_at), {
    message: 'CleanRoomSmokeReceipt completed_at must be at or after started_at.',
    path: ['completed_at'],
  })
  .describe('ADR 0032 CleanRoomSmokeReceipt typed Evidence payload.');

const cleanRoomSmokeReceiptBaseSchema = z.object({
  schema_version: evidenceSchemaVersionSchema,
  evidence_id: entityIdSchema,
  evidence_kind: z.literal('receipt'),
  subject_refs: z.array(cleanRoomSmokeSubjectRefSchema).min(1),
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
  payload_schema_version: z.literal('clean-room-smoke-receipt:v1'),
  payload: cleanRoomSmokePayloadSchema,
  redaction_mode: evidenceRedactionModeSchema.optional(),
});

const nonSandboxCleanRoomSmokeReceiptSchema = cleanRoomSmokeReceiptBaseSchema
  .extend({
    authority: evidenceAuthoritySchema.exclude(['sandbox-observation']),
    source_ref: z.string().min(1).optional(),
  })
  .strict();

const sandboxCleanRoomSmokeReceiptBaseSchema = cleanRoomSmokeReceiptBaseSchema.extend({
  authority: z.literal('sandbox-observation'),
  execution_context_id: entityIdSchema,
});

export const cleanRoomSmokeReceiptSchema = z
  .union([
    sandboxCleanRoomSmokeReceiptBaseSchema
      .extend({
        source_ref: z.string().min(1),
      })
      .strict(),
    sandboxCleanRoomSmokeReceiptBaseSchema
      .extend({
        source_ref: z.string().min(1).optional(),
        session_id: entityIdSchema,
      })
      .strict(),
    sandboxCleanRoomSmokeReceiptBaseSchema
      .extend({
        source_ref: z.string().min(1).optional(),
        run_id: entityIdSchema,
      })
      .strict(),
    nonSandboxCleanRoomSmokeReceiptSchema,
  ])
  .describe('ADR 0032 CleanRoomSmokeReceipt direct Evidence subtype.');

export type DependencyInstallOutcomeKind = z.infer<typeof dependencyInstallOutcomeKindSchema>;
export type CleanRoomSmokePayload = z.infer<typeof cleanRoomSmokePayloadSchema>;
export type CleanRoomSmokeReceipt = z.infer<typeof cleanRoomSmokeReceiptSchema>;
