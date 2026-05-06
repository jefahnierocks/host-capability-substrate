import { z } from 'zod';
import {
  entityIdSchema,
  evidenceAuthoritySchema,
  evidenceConfidenceSchema,
  isoDateTimeSchema,
  schemaVersionSchema,
} from '../common.ts';
import {
  allowedForGateSchema,
  coordinationTargetRefSchema,
  promotedAtSchema,
  promotionFieldsSchema,
  promotionGrantIdSchema,
} from './coordination-common.ts';

export const derivedSummaryKindSchema = z
  .enum([
    'intervention_summary',
    'closeout_narrative',
    'release_summary',
    'audit_summary',
    'operational_summary',
  ])
  .describe('Summary kind for an ADR 0019 DerivedSummary.');

export const derivedSummarySourceRecordKindSchema = z
  .enum(['evidence', 'coordination_fact', 'derived_summary', 'knowledge_chunk'])
  .describe('Closed source-record kind for DerivedSummary.derived_from references.');

export const derivedSummarySourceRefSchema = z
  .object({
    source_record_kind: derivedSummarySourceRecordKindSchema,
    source_record_id: entityIdSchema,
    source: z.string().min(1),
    observed_at: isoDateTimeSchema,
    valid_until: isoDateTimeSchema.nullable().optional(),
    authority: evidenceAuthoritySchema,
    parser_version: z.string().min(1).optional(),
    confidence: evidenceConfidenceSchema,
  })
  .strict()
  .describe('Kind-tagged source reference for a DerivedSummary. Not a gate-authority substitute.');

export const derivedSummarySchema = z
  .object({
    schema_version: schemaVersionSchema,
    derived_summary_id: entityIdSchema,
    derived_from: z.array(derivedSummarySourceRefSchema).min(1),
    generated_by: z.string().min(1),
    generated_at: isoDateTimeSchema,
    summary_kind: derivedSummaryKindSchema,
    summary_text: z.string().min(1),
    authority: z.literal('derived'),
    confidence: z.literal('best-effort'),
    allowed_for_gate: allowedForGateSchema,
    promoted_at: promotedAtSchema,
    promotion_grant_id: promotionGrantIdSchema,
    execution_context_id: entityIdSchema,
    target_refs: z.array(coordinationTargetRefSchema).default([]),
  })
  .strict()
  .superRefine((value, ctx) => {
    const promotionResult = promotionFieldsSchema.safeParse({
      allowed_for_gate: value.allowed_for_gate,
      promoted_at: value.promoted_at,
      promotion_grant_id: value.promotion_grant_id,
    });

    if (!promotionResult.success) {
      for (const issue of promotionResult.error.issues) {
        ctx.addIssue({
          code: 'custom',
          message: issue.message,
          path: issue.path,
        });
      }
    }

    if (!value.allowed_for_gate) {
      return;
    }

    if (
      value.derived_from.some(
        (ref) => ref.source_record_kind === 'evidence' && ref.authority === 'sandbox-observation',
      )
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'DerivedSummary promotion cannot cite sandbox-observation authority.',
        path: ['derived_from'],
      });
    }

    if (value.derived_from.some((ref) => ref.source_record_kind === 'knowledge_chunk')) {
      ctx.addIssue({
        code: 'custom',
        message: 'DerivedSummary promotion cannot cite KnowledgeChunk records.',
        path: ['derived_from'],
      });
    }
  })
  .describe('Ring 0 DerivedSummary entity from ADR 0019 and ADR 0038 Phase 2.1.3.');

export type DerivedSummaryKind = z.infer<typeof derivedSummaryKindSchema>;
export type DerivedSummarySourceRecordKind = z.infer<typeof derivedSummarySourceRecordKindSchema>;
export type DerivedSummarySourceRef = z.infer<typeof derivedSummarySourceRefSchema>;
export type DerivedSummary = z.infer<typeof derivedSummarySchema>;
