import { z } from 'zod';
import { entityIdSchema, evidenceRefSchema, schemaVersionSchema } from '../common.ts';

export const operationShapeOperationClassSchema = z
  .enum([
    'read_only_diagnostic',
    'agent_internal_state',
    'destructive_git',
    'external_control_plane_mutation',
    'worktree_mutation',
    'merge_or_push',
    'workspace_verify',
  ])
  .describe('OperationShape operation_class values from ADR 0029 and ADR 0036.');

export const operationShapeMutationScopeSchema = z
  .enum([
    'none',
    'agent_internal_state',
    'destructive_git',
    'external_control_plane_mutation',
    'worktree_mutation',
    'merge_or_push',
    'verify_workspace',
  ])
  .describe('Initial OperationShape mutation_scope values from ADR 0029 and ADR 0036.');

export const operationShapeTargetKindSchema = z
  .enum([
    'workspace',
    'execution_context',
    'repository',
    'worktree',
    'filesystem_path',
    'tool_or_provider',
    'provider_object',
    'external_control_plane',
    'unknown',
  ])
  .describe('Typed target kind for an OperationShape target_ref.');

export const operationShapeResolvedTargetKindSchema = operationShapeTargetKindSchema
  .exclude(['unknown'])
  .describe('Resolved OperationShape target kind; excludes unknown for non-diagnostic use.');

export const operationShapeTargetRefSchema = z
  .object({
    target_kind: operationShapeTargetKindSchema,
    target_id: entityIdSchema,
  })
  .strict()
  .describe('Primary typed target reference for an OperationShape.');

export const operationShapeResolvedTargetRefSchema = z
  .object({
    target_kind: operationShapeResolvedTargetKindSchema,
    target_id: entityIdSchema,
  })
  .strict()
  .describe('Resolved typed target reference for non-diagnostic OperationShapes.');

export const repositoryOperationTargetRefSchema = z
  .object({
    target_kind: z.literal('repository'),
    target_id: entityIdSchema,
  })
  .strict()
  .describe('Repository target reference for Git-class OperationShapes.');

export const executionContextOperationTargetRefSchema = z
  .object({
    target_kind: z.literal('execution_context'),
    target_id: entityIdSchema,
  })
  .strict()
  .describe('ExecutionContext target reference for agent-internal OperationShapes.');

export const externalControlPlaneOperationTargetRefSchema = z
  .union([
    z
      .object({
        target_kind: z.literal('provider_object'),
        target_id: entityIdSchema,
      })
      .strict(),
    z
      .object({
        target_kind: z.literal('external_control_plane'),
        target_id: entityIdSchema,
      })
      .strict(),
  ])
  .describe('Provider object or external control-plane target reference.');

export const workspaceOperationTargetRefSchema = z
  .object({
    target_kind: z.literal('workspace'),
    target_id: entityIdSchema,
  })
  .strict()
  .describe('Workspace target reference for workspace verification OperationShapes.');

export const worktreeOperationTargetRefSchema = z
  .object({
    target_kind: z.literal('worktree'),
    target_id: entityIdSchema,
  })
  .strict()
  .describe('Worktree target reference for worktree mutation OperationShapes.');

export const deletionAuthorityKindSchema = z
  .enum([
    'filesystem_protected_paths_observation',
    'coordination_fact',
    'human_dashboard_grant',
    'runtime_state_classification',
  ])
  .describe('ADR 0036 deletion_authority_kind values for cleanup authority.');

export const filesystemProtectedPathsObservationAuthorityRefSchema = z
  .object({
    boundary_observation_id: entityIdSchema,
  })
  .strict()
  .describe('Deletion authority source ref for filesystem_protected_paths_observation.');

export const coordinationFactDeletionAuthorityRefSchema = z
  .object({
    coordination_fact_id: entityIdSchema,
  })
  .strict()
  .describe('Deletion authority source ref for coordination_fact.');

export const humanDashboardGrantDeletionAuthorityRefSchema = z
  .object({
    approval_grant_id: entityIdSchema,
  })
  .strict()
  .describe('Deletion authority source ref for human_dashboard_grant.');

export const runtimeStateClassificationDeletionAuthorityRefSchema = z
  .object({
    evidence_id: entityIdSchema,
  })
  .strict()
  .describe('Deletion authority source ref for runtime_state_classification.');

export const deletionAuthoritySourceRefSchema = z
  .union([
    filesystemProtectedPathsObservationAuthorityRefSchema,
    coordinationFactDeletionAuthorityRefSchema,
    humanDashboardGrantDeletionAuthorityRefSchema,
    runtimeStateClassificationDeletionAuthorityRefSchema,
  ])
  .describe('Polymorphic deletion authority source reference from ADR 0036.');

export const noDeletionAuthorityFieldsSchema = z
  .object({
    deletion_authority_kind: z.null(),
    deletion_authority_source_ref: z.null(),
  })
  .strict()
  .describe('Explicit absence of deletion authority on an OperationShape.');

export const filesystemProtectedPathsObservationDeletionAuthorityFieldsSchema = z
  .object({
    deletion_authority_kind: z.literal('filesystem_protected_paths_observation'),
    deletion_authority_source_ref: filesystemProtectedPathsObservationAuthorityRefSchema,
  })
  .strict()
  .describe('Deletion authority fields for filesystem_protected_paths_observation.');

export const coordinationFactDeletionAuthorityFieldsSchema = z
  .object({
    deletion_authority_kind: z.literal('coordination_fact'),
    deletion_authority_source_ref: coordinationFactDeletionAuthorityRefSchema,
  })
  .strict()
  .describe('Deletion authority fields for coordination_fact.');

export const humanDashboardGrantDeletionAuthorityFieldsSchema = z
  .object({
    deletion_authority_kind: z.literal('human_dashboard_grant'),
    deletion_authority_source_ref: humanDashboardGrantDeletionAuthorityRefSchema,
  })
  .strict()
  .describe('Deletion authority fields for human_dashboard_grant.');

export const runtimeStateClassificationDeletionAuthorityFieldsSchema = z
  .object({
    deletion_authority_kind: z.literal('runtime_state_classification'),
    deletion_authority_source_ref: runtimeStateClassificationDeletionAuthorityRefSchema,
  })
  .strict()
  .describe('Deletion authority fields for runtime_state_classification.');

export const deletionAuthorityFieldsSchema = z
  .discriminatedUnion('deletion_authority_kind', [
    noDeletionAuthorityFieldsSchema,
    filesystemProtectedPathsObservationDeletionAuthorityFieldsSchema,
    coordinationFactDeletionAuthorityFieldsSchema,
    humanDashboardGrantDeletionAuthorityFieldsSchema,
    runtimeStateClassificationDeletionAuthorityFieldsSchema,
  ])
  .describe('Deletion authority field pair; discriminator and ref shape must match.');

const operationShapeBaseSchema = z.object({
  schema_version: schemaVersionSchema,
  operation_shape_id: entityIdSchema,
  execution_context_id: entityIdSchema,
  evidence_refs: z.array(evidenceRefSchema).min(1),
});

const readOnlyDiagnosticOperationShapeSchema = operationShapeBaseSchema
  .extend({
    operation_class: z.literal('read_only_diagnostic'),
    mutation_scope: z.literal('none'),
    target_ref: operationShapeTargetRefSchema,
    deletion_authority_kind: z.null(),
    deletion_authority_source_ref: z.null(),
  })
  .strict();

const agentInternalStateOperationShapeSchema = operationShapeBaseSchema
  .extend({
    operation_class: z.literal('agent_internal_state'),
    mutation_scope: z.literal('agent_internal_state'),
    target_ref: executionContextOperationTargetRefSchema,
    deletion_authority_kind: z.null(),
    deletion_authority_source_ref: z.null(),
  })
  .strict();

const destructiveGitOperationShapeSchema = z.discriminatedUnion('deletion_authority_kind', [
  operationShapeBaseSchema
    .extend({
      operation_class: z.literal('destructive_git'),
      mutation_scope: z.literal('destructive_git'),
      target_ref: repositoryOperationTargetRefSchema,
      deletion_authority_kind: z.null(),
      deletion_authority_source_ref: z.null(),
    })
    .strict(),
  operationShapeBaseSchema
    .extend({
      operation_class: z.literal('destructive_git'),
      mutation_scope: z.literal('destructive_git'),
      target_ref: repositoryOperationTargetRefSchema,
      deletion_authority_kind: z.literal('filesystem_protected_paths_observation'),
      deletion_authority_source_ref: filesystemProtectedPathsObservationAuthorityRefSchema,
    })
    .strict(),
  operationShapeBaseSchema
    .extend({
      operation_class: z.literal('destructive_git'),
      mutation_scope: z.literal('destructive_git'),
      target_ref: repositoryOperationTargetRefSchema,
      deletion_authority_kind: z.literal('coordination_fact'),
      deletion_authority_source_ref: coordinationFactDeletionAuthorityRefSchema,
    })
    .strict(),
  operationShapeBaseSchema
    .extend({
      operation_class: z.literal('destructive_git'),
      mutation_scope: z.literal('destructive_git'),
      target_ref: repositoryOperationTargetRefSchema,
      deletion_authority_kind: z.literal('human_dashboard_grant'),
      deletion_authority_source_ref: humanDashboardGrantDeletionAuthorityRefSchema,
    })
    .strict(),
  operationShapeBaseSchema
    .extend({
      operation_class: z.literal('destructive_git'),
      mutation_scope: z.literal('destructive_git'),
      target_ref: repositoryOperationTargetRefSchema,
      deletion_authority_kind: z.literal('runtime_state_classification'),
      deletion_authority_source_ref: runtimeStateClassificationDeletionAuthorityRefSchema,
    })
    .strict(),
]);

const externalControlPlaneMutationOperationShapeSchema = operationShapeBaseSchema
  .extend({
    operation_class: z.literal('external_control_plane_mutation'),
    mutation_scope: z.literal('external_control_plane_mutation'),
    target_ref: externalControlPlaneOperationTargetRefSchema,
    deletion_authority_kind: z.null(),
    deletion_authority_source_ref: z.null(),
  })
  .strict();

const worktreeMutationOperationShapeSchema = z.discriminatedUnion('deletion_authority_kind', [
  operationShapeBaseSchema
    .extend({
      operation_class: z.literal('worktree_mutation'),
      mutation_scope: z.literal('worktree_mutation'),
      target_ref: worktreeOperationTargetRefSchema,
      deletion_authority_kind: z.null(),
      deletion_authority_source_ref: z.null(),
    })
    .strict(),
  operationShapeBaseSchema
    .extend({
      operation_class: z.literal('worktree_mutation'),
      mutation_scope: z.literal('worktree_mutation'),
      target_ref: worktreeOperationTargetRefSchema,
      deletion_authority_kind: z.literal('filesystem_protected_paths_observation'),
      deletion_authority_source_ref: filesystemProtectedPathsObservationAuthorityRefSchema,
    })
    .strict(),
  operationShapeBaseSchema
    .extend({
      operation_class: z.literal('worktree_mutation'),
      mutation_scope: z.literal('worktree_mutation'),
      target_ref: worktreeOperationTargetRefSchema,
      deletion_authority_kind: z.literal('coordination_fact'),
      deletion_authority_source_ref: coordinationFactDeletionAuthorityRefSchema,
    })
    .strict(),
  operationShapeBaseSchema
    .extend({
      operation_class: z.literal('worktree_mutation'),
      mutation_scope: z.literal('worktree_mutation'),
      target_ref: worktreeOperationTargetRefSchema,
      deletion_authority_kind: z.literal('human_dashboard_grant'),
      deletion_authority_source_ref: humanDashboardGrantDeletionAuthorityRefSchema,
    })
    .strict(),
  operationShapeBaseSchema
    .extend({
      operation_class: z.literal('worktree_mutation'),
      mutation_scope: z.literal('worktree_mutation'),
      target_ref: worktreeOperationTargetRefSchema,
      deletion_authority_kind: z.literal('runtime_state_classification'),
      deletion_authority_source_ref: runtimeStateClassificationDeletionAuthorityRefSchema,
    })
    .strict(),
]);

const mergeOrPushOperationShapeSchema = operationShapeBaseSchema
  .extend({
    operation_class: z.literal('merge_or_push'),
    mutation_scope: z.literal('merge_or_push'),
    target_ref: repositoryOperationTargetRefSchema,
    deletion_authority_kind: z.null(),
    deletion_authority_source_ref: z.null(),
  })
  .strict();

const workspaceVerifyOperationShapeSchema = operationShapeBaseSchema
  .extend({
    operation_class: z.literal('workspace_verify'),
    mutation_scope: z.literal('verify_workspace'),
    target_ref: workspaceOperationTargetRefSchema,
    deletion_authority_kind: z.null(),
    deletion_authority_source_ref: z.null(),
  })
  .strict();

export const operationShapeSchema = z
  .discriminatedUnion('operation_class', [
    readOnlyDiagnosticOperationShapeSchema,
    agentInternalStateOperationShapeSchema,
    destructiveGitOperationShapeSchema,
    externalControlPlaneMutationOperationShapeSchema,
    worktreeMutationOperationShapeSchema,
    mergeOrPushOperationShapeSchema,
    workspaceVerifyOperationShapeSchema,
  ])
  .describe('Ring 0 OperationShape entity from ADR 0029, ADR 0036, and ADR 0038.');

export type OperationShapeOperationClass = z.infer<typeof operationShapeOperationClassSchema>;
export type OperationShapeMutationScope = z.infer<typeof operationShapeMutationScopeSchema>;
export type OperationShapeTargetKind = z.infer<typeof operationShapeTargetKindSchema>;
export type OperationShapeResolvedTargetKind = z.infer<
  typeof operationShapeResolvedTargetKindSchema
>;
export type OperationShapeTargetRef = z.infer<typeof operationShapeTargetRefSchema>;
export type DeletionAuthorityKind = z.infer<typeof deletionAuthorityKindSchema>;
export type DeletionAuthoritySourceRef = z.infer<typeof deletionAuthoritySourceRefSchema>;
export type DeletionAuthorityFields = z.infer<typeof deletionAuthorityFieldsSchema>;
export type OperationShape = z.infer<typeof operationShapeSchema>;
