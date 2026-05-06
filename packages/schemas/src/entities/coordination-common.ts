import { z } from 'zod';
import { entityIdSchema, isoDateTimeSchema } from '../common.ts';

export const coordinationTargetKindSchema = z
  .enum([
    'host',
    'workspace_context',
    'execution_context',
    'session',
    'repository',
    'worktree',
    'branch',
    'ruleset',
    'credential_audience',
    'deployment',
    'external_target',
    'filesystem_path',
    'provider_object',
    'unknown',
  ])
  .describe('Generic target kind for knowledge and coordination cross-context binding.');

export const coordinationTargetRefSchema = z
  .object({
    target_kind: coordinationTargetKindSchema,
    target_id: z.string().min(1),
    relation: z.string().min(1).optional(),
  })
  .strict()
  .describe('Generic target reference for knowledge and coordination records.');

export const allowedForGateSchema = z
  .boolean()
  .describe('Kernel-set gate eligibility flag for promoted coordination records.');

export const promotedAtSchema = isoDateTimeSchema
  .nullable()
  .describe('Kernel-set timestamp for the allowed_for_gate promotion event.');

export const promotionGrantIdSchema = entityIdSchema
  .nullable()
  .describe('Kernel-set promotion grant reference, null before promotion.');

export const promotionFieldsSchema = z
  .object({
    allowed_for_gate: allowedForGateSchema,
    promoted_at: promotedAtSchema,
    promotion_grant_id: promotionGrantIdSchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.allowed_for_gate) {
      if (value.promoted_at === null) {
        ctx.addIssue({
          code: 'custom',
          message: 'promoted_at is required when allowed_for_gate is true.',
          path: ['promoted_at'],
        });
      }

      if (value.promotion_grant_id === null) {
        ctx.addIssue({
          code: 'custom',
          message: 'promotion_grant_id is required when allowed_for_gate is true.',
          path: ['promotion_grant_id'],
        });
      }

      return;
    }

    if (value.promoted_at !== null) {
      ctx.addIssue({
        code: 'custom',
        message: 'promoted_at must be null when allowed_for_gate is false.',
        path: ['promoted_at'],
      });
    }

    if (value.promotion_grant_id !== null) {
      ctx.addIssue({
        code: 'custom',
        message: 'promotion_grant_id must be null when allowed_for_gate is false.',
        path: ['promotion_grant_id'],
      });
    }
  })
  .describe('Kernel-set promotion state shared by CoordinationFact and DerivedSummary.');

export type CoordinationTargetKind = z.infer<typeof coordinationTargetKindSchema>;
export type CoordinationTargetRef = z.infer<typeof coordinationTargetRefSchema>;
export type PromotionFields = z.infer<typeof promotionFieldsSchema>;
