import { z } from 'zod';
import {
  entityIdSchema,
  evidenceAuthoritySchema,
  evidenceConfidenceSchema,
  evidenceRefSchema,
  isoDateTimeSchema,
} from '../common.ts';
import { evidenceRedactionModeSchema, evidenceSchemaVersionSchema } from './evidence.ts';

const runnerHostSubjectRefSchema = z
  .object({
    subject_kind: z.literal('runner_host'),
    subject_id: entityIdSchema,
    relation: z.string().min(1).optional(),
  })
  .strict()
  .describe('Subject reference for a RunnerHostObservation Evidence subtype.');

export const runnerHostSubstrateKindSchema = z
  .enum(['github_hosted', 'self_hosted_proxmox', 'self_hosted_macbook', 'self_hosted_other'])
  .describe('ADR 0032 runner host substrate kind.');

export const runnerHostRepoAccessKindSchema = z
  .enum(['public', 'private', 'fork_isolated'])
  .describe('ADR 0032 repository access posture for a runner host.');

export const runnerHostPayloadSchema = z
  .object({
    runner_host_id: entityIdSchema,
    registration_epoch: z.string().min(1),
    substrate_kind: runnerHostSubstrateKindSchema,
    os: z.string().min(1),
    arch: z.string().min(1),
    labels: z.array(z.string().min(1)).default([]),
    repo_access_kind: runnerHostRepoAccessKindSchema,
    last_seen_at: isoDateTimeSchema,
    tool_provenance_evidence_refs: z.array(evidenceRefSchema).default([]),
  })
  .strict()
  .describe('ADR 0032 RunnerHostObservation typed Evidence payload.');

const runnerHostObservationBaseSchema = z.object({
  schema_version: evidenceSchemaVersionSchema,
  evidence_id: entityIdSchema,
  evidence_kind: z.literal('observation'),
  subject_refs: z.array(runnerHostSubjectRefSchema).min(1),
  source: z.string().min(1),
  observed_at: isoDateTimeSchema,
  valid_until: isoDateTimeSchema.nullable(),
  confidence: evidenceConfidenceSchema,
  parser_version: z.string().min(1),
  producer: z.string().min(1).optional(),
  host_id: entityIdSchema
    .optional()
    .describe(
      'Optional FK to the durable HostProfile entity (built by ADR 0066 / D-064); the transient observation points at the canonical host record. FK existence is a Ring 1 obligation.',
    ),
  workspace_id: entityIdSchema.optional(),
  execution_context_id: entityIdSchema.optional(),
  session_id: entityIdSchema.optional(),
  run_id: entityIdSchema.optional(),
  payload_schema_version: z.literal('runner-host-observation:v1'),
  payload: runnerHostPayloadSchema,
  redaction_mode: evidenceRedactionModeSchema.optional(),
});

const nonSandboxRunnerHostObservationSchema = runnerHostObservationBaseSchema
  .extend({
    authority: evidenceAuthoritySchema.exclude(['sandbox-observation']),
    source_ref: z.string().min(1).optional(),
  })
  .strict();

const sandboxRunnerHostObservationBaseSchema = runnerHostObservationBaseSchema.extend({
  authority: z.literal('sandbox-observation'),
  execution_context_id: entityIdSchema,
});

export const runnerHostObservationSchema = z
  .union([
    sandboxRunnerHostObservationBaseSchema
      .extend({
        source_ref: z.string().min(1),
      })
      .strict(),
    sandboxRunnerHostObservationBaseSchema
      .extend({
        source_ref: z.string().min(1).optional(),
        session_id: entityIdSchema,
      })
      .strict(),
    sandboxRunnerHostObservationBaseSchema
      .extend({
        source_ref: z.string().min(1).optional(),
        run_id: entityIdSchema,
      })
      .strict(),
    nonSandboxRunnerHostObservationSchema,
  ])
  .refine(
    (value) => value.subject_refs.some((ref) => ref.subject_id === value.payload.runner_host_id),
    {
      message: 'RunnerHostObservation subject_refs must include payload.runner_host_id.',
      path: ['subject_refs'],
    },
  )
  .describe('ADR 0032 RunnerHostObservation direct Evidence subtype.');

export type RunnerHostSubstrateKind = z.infer<typeof runnerHostSubstrateKindSchema>;
export type RunnerHostRepoAccessKind = z.infer<typeof runnerHostRepoAccessKindSchema>;
export type RunnerHostPayload = z.infer<typeof runnerHostPayloadSchema>;
export type RunnerHostObservation = z.infer<typeof runnerHostObservationSchema>;
