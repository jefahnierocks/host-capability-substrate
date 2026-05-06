import { z } from 'zod';
import {
  entityIdSchema,
  evidenceAuthoritySchema,
  evidenceConfidenceSchema,
  isoDateTimeSchema,
} from '../common.ts';
import { evidenceRedactionModeSchema, evidenceSchemaVersionSchema } from './evidence.ts';

const resourceBudgetSubjectRefSchema = z
  .object({
    subject_kind: z.literal('resource_budget'),
    subject_id: entityIdSchema,
    relation: z.string().min(1).optional(),
  })
  .strict()
  .describe('Subject reference for a ResourceBudgetObservation Evidence subtype.');

export const resourceBudgetObservationWindowSchema = z
  .object({
    window_start_at: isoDateTimeSchema,
    window_end_at: isoDateTimeSchema,
  })
  .strict()
  .refine((value) => Date.parse(value.window_start_at) <= Date.parse(value.window_end_at), {
    message: 'ResourceBudgetObservation window_end_at must be at or after window_start_at.',
    path: ['window_end_at'],
  })
  .describe('Observation window for runner resource pressure readings.');

export const resourceBudgetPayloadSchema = z
  .object({
    runner_host_id: entityIdSchema,
    observation_window: resourceBudgetObservationWindowSchema,
    cpu_pressure_pct: z.number().min(0).max(100),
    memory_pressure_pct: z.number().min(0).max(100),
    disk_pressure_pct: z.number().min(0).max(100),
    active_jobs_count: z.number().int().min(0),
    cache_size_bytes: z.number().int().min(0),
  })
  .strict()
  .describe('ADR 0032 ResourceBudgetObservation typed Evidence payload.');

const resourceBudgetObservationBaseSchema = z.object({
  schema_version: evidenceSchemaVersionSchema,
  evidence_id: entityIdSchema,
  evidence_kind: z.literal('observation'),
  subject_refs: z.array(resourceBudgetSubjectRefSchema).min(1),
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
  payload_schema_version: z.literal('resource-budget-observation:v1'),
  payload: resourceBudgetPayloadSchema,
  redaction_mode: evidenceRedactionModeSchema.optional(),
});

const nonSandboxResourceBudgetObservationSchema = resourceBudgetObservationBaseSchema
  .extend({
    authority: evidenceAuthoritySchema.exclude(['sandbox-observation']),
    source_ref: z.string().min(1).optional(),
  })
  .strict();

const sandboxResourceBudgetObservationBaseSchema = resourceBudgetObservationBaseSchema.extend({
  authority: z.literal('sandbox-observation'),
  execution_context_id: entityIdSchema,
});

export const resourceBudgetObservationSchema = z
  .union([
    sandboxResourceBudgetObservationBaseSchema
      .extend({
        source_ref: z.string().min(1),
      })
      .strict(),
    sandboxResourceBudgetObservationBaseSchema
      .extend({
        source_ref: z.string().min(1).optional(),
        session_id: entityIdSchema,
      })
      .strict(),
    sandboxResourceBudgetObservationBaseSchema
      .extend({
        source_ref: z.string().min(1).optional(),
        run_id: entityIdSchema,
      })
      .strict(),
    nonSandboxResourceBudgetObservationSchema,
  ])
  .describe('ADR 0032 ResourceBudgetObservation direct Evidence subtype.');

export type ResourceBudgetObservationWindow = z.infer<typeof resourceBudgetObservationWindowSchema>;
export type ResourceBudgetPayload = z.infer<typeof resourceBudgetPayloadSchema>;
export type ResourceBudgetObservation = z.infer<typeof resourceBudgetObservationSchema>;
