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

const policyPlanSubjectRefSchema = z
  .object({
    subject_kind: z.literal('policy_plan'),
    subject_id: entityIdSchema,
    relation: z.string().min(1).optional(),
  })
  .strict()
  .describe('Subject reference for a PolicyPlanReceipt Evidence subtype.');

export const conftestOutcomeKindSchema = z
  .enum(['pass', 'fail', 'warn'])
  .describe('ADR 0032 conftest policy-plan outcome kind.');

export const policyPlanRedactionModeSchema = evidenceRedactionModeSchema
  .exclude(['none'])
  .describe('ADR 0032 redaction floor for PolicyPlanReceipt records.');

export const policyPlanPayloadSchema = z
  .object({
    repository_id: entityIdSchema,
    opentofu_plan_hash: sha256DigestSchema,
    conftest_outcome_kind: conftestOutcomeKindSchema,
    policy_ids: z.array(z.string().min(1)).default([]),
    workspace_id_ref: entityIdSchema,
    provider_versions: z.record(z.string().min(1), z.string().min(1)).default({}),
    tool_provenance_evidence_refs: z.array(evidenceRefSchema).min(1),
  })
  .strict()
  .describe('ADR 0032 PolicyPlanReceipt typed Evidence payload.');

const policyPlanReceiptBaseSchema = z.object({
  schema_version: evidenceSchemaVersionSchema,
  evidence_id: entityIdSchema,
  evidence_kind: z.literal('receipt'),
  subject_refs: z.array(policyPlanSubjectRefSchema).min(1),
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
  payload_schema_version: z.literal('policy-plan-receipt:v1'),
  payload: policyPlanPayloadSchema,
  redaction_mode: policyPlanRedactionModeSchema,
});

const nonSandboxPolicyPlanReceiptSchema = policyPlanReceiptBaseSchema
  .extend({
    authority: evidenceAuthoritySchema.exclude(['sandbox-observation']),
    source_ref: z.string().min(1).optional(),
  })
  .strict();

const sandboxPolicyPlanReceiptBaseSchema = policyPlanReceiptBaseSchema.extend({
  authority: z.literal('sandbox-observation'),
  execution_context_id: entityIdSchema,
});

export const policyPlanReceiptSchema = z
  .union([
    sandboxPolicyPlanReceiptBaseSchema
      .extend({
        source_ref: z.string().min(1),
      })
      .strict(),
    sandboxPolicyPlanReceiptBaseSchema
      .extend({
        source_ref: z.string().min(1).optional(),
        session_id: entityIdSchema,
      })
      .strict(),
    sandboxPolicyPlanReceiptBaseSchema
      .extend({
        source_ref: z.string().min(1).optional(),
        run_id: entityIdSchema,
      })
      .strict(),
    nonSandboxPolicyPlanReceiptSchema,
  ])
  .describe('ADR 0032 PolicyPlanReceipt direct Evidence subtype.');

export type ConftestOutcomeKind = z.infer<typeof conftestOutcomeKindSchema>;
export type PolicyPlanRedactionMode = z.infer<typeof policyPlanRedactionModeSchema>;
export type PolicyPlanPayload = z.infer<typeof policyPlanPayloadSchema>;
export type PolicyPlanReceipt = z.infer<typeof policyPlanReceiptSchema>;
