import { z } from 'zod';
import {
  entityIdSchema,
  evidenceAuthoritySchema,
  evidenceConfidenceSchema,
  evidenceRefSchema,
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

export const coordinationSubjectKindSchema = z
  .enum([
    'release',
    'branch',
    'worktree',
    'ruleset',
    'credential_audience',
    'deployment',
    'external_target',
    'workspace_context',
    'audit_profile_snapshot',
  ])
  .describe('Subject kind for an ADR 0019 CoordinationFact.');

export const coordinationPredicateKindSchema = z
  .enum([
    'blocked_until',
    'depends_on',
    'gate_token',
    'phase_lock',
    'release_phase',
    'scope_assertion',
    'leased_to',
    'attached_to',
    'held_by',
    'claimed_to_contain',
    'confirmed_to_contain',
    'claim_superseded_by_snapshot',
  ])
  .describe('Ontology-controlled predicate kind for an ADR 0019 CoordinationFact.');

export const coordinationObjectKindSchema = z
  .enum(['status_block', 'dependency', 'gate_token', 'scoped_assertion'])
  .describe('Object payload kind for an ADR 0019 CoordinationFact.');

const auditProfileRevisionDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .describe('Audit profile revision date in YYYY-MM-DD form.');

const subjectRefSchemas = {
  release: z.object({ release_id: entityIdSchema }).strict(),
  branch: z.object({ repository_id: entityIdSchema, branch_ref: z.string().min(1) }).strict(),
  worktree: z
    .object({
      repository_id: entityIdSchema,
      worktree_path: z.string().min(1),
    })
    .strict(),
  ruleset: z.object({ provider: z.string().min(1), ruleset_id: entityIdSchema }).strict(),
  credential_audience: z
    .object({
      credential_source_id: entityIdSchema.optional(),
      audience: z.string().min(1),
    })
    .strict(),
  deployment: z.object({ deployment_id: entityIdSchema }).strict(),
  external_target: z.object({ external_target_id: entityIdSchema }).strict(),
  workspace_context: z.object({ workspace_context_id: entityIdSchema }).strict(),
  audit_profile_snapshot: z
    .object({
      workspace_context_id: entityIdSchema,
      audit_profile_revision_date: auditProfileRevisionDateSchema,
    })
    .strict(),
} as const;

export const coordinationStatusBlockObjectSchema = z
  .object({
    status: z.string().min(1),
    reason: z.string().min(1).optional(),
    valid_until: isoDateTimeSchema.nullable().optional(),
  })
  .strict()
  .describe('Structured status-block object payload for CoordinationFact.');

export const coordinationDependencyObjectSchema = z
  .object({
    dependency_refs: z.array(coordinationTargetRefSchema).min(1),
  })
  .strict()
  .describe('Structured dependency object payload for CoordinationFact.');

export const coordinationGateTokenObjectSchema = z
  .object({
    token_kind: z.string().min(1),
    token_ref: z.string().min(1),
    valid_until: isoDateTimeSchema.nullable().optional(),
  })
  .strict()
  .describe('Structured gate-token object payload for CoordinationFact.');

export const coordinationLeasedToObjectSchema = z
  .object({
    session_id: entityIdSchema,
    lease_id: entityIdSchema,
    valid_until: isoDateTimeSchema.nullable(),
    lease_acquired_at: isoDateTimeSchema,
  })
  .strict()
  .describe('ADR 0031 leased_to object payload for worktree CoordinationFacts.');

export const coordinationScopedAssertionObjectSchema = z
  .union([
    z
      .object({
        assertion: z.record(z.string(), z.json()),
      })
      .strict(),
    coordinationLeasedToObjectSchema,
  ])
  .describe('Structured scoped-assertion object payload for CoordinationFact.');

export const coordinationObjectSchema = z
  .union([
    coordinationStatusBlockObjectSchema,
    coordinationDependencyObjectSchema,
    coordinationGateTokenObjectSchema,
    coordinationScopedAssertionObjectSchema,
  ])
  .describe('Structured object payload selected by CoordinationFact.object_kind.');

const objectSchemas = {
  status_block: coordinationStatusBlockObjectSchema,
  dependency: coordinationDependencyObjectSchema,
  gate_token: coordinationGateTokenObjectSchema,
  scoped_assertion: coordinationScopedAssertionObjectSchema,
} as const;

export const coordinationFactSchema = z
  .object({
    schema_version: schemaVersionSchema,
    coordination_fact_id: entityIdSchema,
    subject_kind: coordinationSubjectKindSchema,
    subject_ref: z.json(),
    predicate_kind: coordinationPredicateKindSchema,
    object_kind: coordinationObjectKindSchema,
    object: coordinationObjectSchema,
    evidence_refs: z.array(evidenceRefSchema).min(1),
    authority: evidenceAuthoritySchema,
    confidence: evidenceConfidenceSchema,
    valid_until: isoDateTimeSchema.nullable(),
    allowed_for_gate: allowedForGateSchema,
    promoted_at: promotedAtSchema,
    promotion_grant_id: promotionGrantIdSchema,
    execution_context_id: entityIdSchema,
    target_refs: z.array(coordinationTargetRefSchema).default([]),
  })
  .strict()
  .superRefine((value, ctx) => {
    const subjectRefSchema = subjectRefSchemas[value.subject_kind];
    const subjectRefResult = subjectRefSchema.safeParse(value.subject_ref);

    if (!subjectRefResult.success) {
      ctx.addIssue({
        code: 'custom',
        message: `subject_ref does not match subject_kind ${value.subject_kind}.`,
        path: ['subject_ref'],
      });
    }

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

    if (value.allowed_for_gate && value.authority === 'sandbox-observation') {
      ctx.addIssue({
        code: 'custom',
        message: 'sandbox-observation CoordinationFacts cannot be promoted for gate use.',
        path: ['authority'],
      });
    }

    if (
      value.allowed_for_gate &&
      (value.subject_kind === 'workspace_context' ||
        value.subject_kind === 'audit_profile_snapshot') &&
      !value.evidence_refs.some((ref) => ref.authority === 'host-observation')
    ) {
      ctx.addIssue({
        code: 'custom',
        message:
          'workspace_context and audit_profile_snapshot promotions require host-observation grounding.',
        path: ['evidence_refs'],
      });
    }

    const objectResult = objectSchemas[value.object_kind].safeParse(value.object);

    if (!objectResult.success) {
      ctx.addIssue({
        code: 'custom',
        message: `object does not match object_kind ${value.object_kind}.`,
        path: ['object'],
      });
    }

    if (value.predicate_kind === 'leased_to') {
      if (value.subject_kind !== 'worktree') {
        ctx.addIssue({
          code: 'custom',
          message: 'leased_to CoordinationFacts require subject_kind worktree.',
          path: ['subject_kind'],
        });
      }

      if (value.object_kind !== 'scoped_assertion') {
        ctx.addIssue({
          code: 'custom',
          message: 'leased_to CoordinationFacts require object_kind scoped_assertion.',
          path: ['object_kind'],
        });
      }

      const leasedToObjectResult = coordinationLeasedToObjectSchema.safeParse(value.object);

      if (!leasedToObjectResult.success) {
        ctx.addIssue({
          code: 'custom',
          message:
            'leased_to CoordinationFacts require object {session_id, lease_id, valid_until, lease_acquired_at}.',
          path: ['object'],
        });
      }
    }
  })
  .describe('Ring 0 CoordinationFact entity from ADR 0019 and ADR 0038 Phase 2.1.3.');

export type CoordinationSubjectKind = z.infer<typeof coordinationSubjectKindSchema>;
export type CoordinationPredicateKind = z.infer<typeof coordinationPredicateKindSchema>;
export type CoordinationObjectKind = z.infer<typeof coordinationObjectKindSchema>;
export type CoordinationObject = z.infer<typeof coordinationObjectSchema>;
export type CoordinationFact = z.infer<typeof coordinationFactSchema>;
