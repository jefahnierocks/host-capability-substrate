import { describe, expect, it } from 'vitest';
import { evidenceSchema, operationShapeSchema } from '../src/index.ts';

const evidenceRef = {
  evidence_id: 'evidence:operation-shape-support',
  source:
    'docs/host-capability-substrate/adr/0036-q-009-workspace-manifest-projection-and-diagnostic-surface.md',
  observed_at: '2026-05-06T00:00:00Z',
  authority: 'host-observation',
  confidence: 'high',
} as const;

describe('OperationShape schema', () => {
  it('validates a destructive Git operation with typed deletion authority', () => {
    const operation = operationShapeSchema.parse({
      schema_version: '0.1.0',
      operation_shape_id: 'operation-shape:hcs:delete-branch',
      operation_class: 'destructive_git',
      mutation_scope: 'destructive_git',
      execution_context_id: 'ctx:hcs:phase-2-2-2',
      target_ref: {
        target_kind: 'repository',
        target_id: 'repository:hcs',
      },
      deletion_authority_kind: 'filesystem_protected_paths_observation',
      deletion_authority_source_ref: {
        boundary_observation_id: 'bo:hcs:filesystem-protected-paths',
      },
      evidence_refs: [evidenceRef],
    });

    expect(operation.deletion_authority_kind).toBe('filesystem_protected_paths_observation');
    expect(operation.deletion_authority_source_ref).toEqual({
      boundary_observation_id: 'bo:hcs:filesystem-protected-paths',
    });
  });

  it('uses explicit null deletion authority fields on read-only diagnostics', () => {
    const operation = operationShapeSchema.parse({
      schema_version: '0.1.0',
      operation_shape_id: 'operation-shape:hcs:diagnose',
      operation_class: 'read_only_diagnostic',
      mutation_scope: 'none',
      execution_context_id: 'ctx:hcs:phase-2-2-2',
      target_ref: {
        target_kind: 'workspace',
        target_id: 'workspace:host-capability-substrate',
      },
      deletion_authority_kind: null,
      deletion_authority_source_ref: null,
      evidence_refs: [evidenceRef],
    });

    expect(operation.deletion_authority_kind).toBeNull();
    expect(operation.deletion_authority_source_ref).toBeNull();
  });

  it('rejects gitignore and other non-ADR 0036 deletion authority kinds', () => {
    expect(
      operationShapeSchema.safeParse({
        schema_version: '0.1.0',
        operation_shape_id: 'operation-shape:hcs:gitignore-cleanup',
        operation_class: 'destructive_git',
        mutation_scope: 'destructive_git',
        execution_context_id: 'ctx:hcs:phase-2-2-2',
        target_ref: {
          target_kind: 'repository',
          target_id: 'repository:hcs',
        },
        deletion_authority_kind: 'gitignore',
        deletion_authority_source_ref: {
          boundary_observation_id: 'bo:hcs:gitignore',
        },
        evidence_refs: [evidenceRef],
      }).success,
    ).toBe(false);
  });

  it('requires deletion authority kind and source ref to appear together', () => {
    expect(
      operationShapeSchema.safeParse({
        schema_version: '0.1.0',
        operation_shape_id: 'operation-shape:hcs:missing-authority-ref',
        operation_class: 'worktree_mutation',
        mutation_scope: 'worktree_mutation',
        execution_context_id: 'ctx:hcs:phase-2-2-2',
        target_ref: {
          target_kind: 'worktree',
          target_id: 'worktree:hcs:feature-lane',
        },
        deletion_authority_kind: 'human_dashboard_grant',
        evidence_refs: [evidenceRef],
      }).success,
    ).toBe(false);

    expect(
      operationShapeSchema.safeParse({
        schema_version: '0.1.0',
        operation_shape_id: 'operation-shape:hcs:missing-authority-kind',
        operation_class: 'worktree_mutation',
        mutation_scope: 'worktree_mutation',
        execution_context_id: 'ctx:hcs:phase-2-2-2',
        target_ref: {
          target_kind: 'worktree',
          target_id: 'worktree:hcs:feature-lane',
        },
        deletion_authority_source_ref: {
          approval_grant_id: 'approval-grant:hcs:break-glass',
        },
        evidence_refs: [evidenceRef],
      }).success,
    ).toBe(false);
  });

  it('rejects deletion authority source refs that do not match the kind discriminator', () => {
    expect(
      operationShapeSchema.safeParse({
        schema_version: '0.1.0',
        operation_shape_id: 'operation-shape:hcs:mismatched-authority',
        operation_class: 'destructive_git',
        mutation_scope: 'destructive_git',
        execution_context_id: 'ctx:hcs:phase-2-2-2',
        target_ref: {
          target_kind: 'repository',
          target_id: 'repository:hcs',
        },
        deletion_authority_kind: 'coordination_fact',
        deletion_authority_source_ref: {
          boundary_observation_id: 'bo:hcs:filesystem-protected-paths',
        },
        evidence_refs: [evidenceRef],
      }).success,
    ).toBe(false);
  });

  it('rejects unresolved targets for mutating operations and deletion authority', () => {
    expect(
      operationShapeSchema.safeParse({
        schema_version: '0.1.0',
        operation_shape_id: 'operation-shape:hcs:unknown-mutating-target',
        operation_class: 'worktree_mutation',
        mutation_scope: 'worktree_mutation',
        execution_context_id: 'ctx:hcs:phase-2-2-2',
        target_ref: {
          target_kind: 'unknown',
          target_id: 'unknown:target',
        },
        deletion_authority_kind: null,
        deletion_authority_source_ref: null,
        evidence_refs: [evidenceRef],
      }).success,
    ).toBe(false);

    expect(
      operationShapeSchema.safeParse({
        schema_version: '0.1.0',
        operation_shape_id: 'operation-shape:hcs:unknown-deletion-authority-target',
        operation_class: 'read_only_diagnostic',
        mutation_scope: 'none',
        execution_context_id: 'ctx:hcs:phase-2-2-2',
        target_ref: {
          target_kind: 'unknown',
          target_id: 'unknown:target',
        },
        deletion_authority_kind: 'human_dashboard_grant',
        deletion_authority_source_ref: {
          approval_grant_id: 'approval-grant:hcs:break-glass',
        },
        evidence_refs: [evidenceRef],
      }).success,
    ).toBe(false);
  });

  it('rejects generic filesystem cleanup represented as destructive_git', () => {
    expect(
      operationShapeSchema.safeParse({
        schema_version: '0.1.0',
        operation_shape_id: 'operation-shape:hcs:filesystem-cleanup-as-git',
        operation_class: 'destructive_git',
        mutation_scope: 'destructive_git',
        execution_context_id: 'ctx:hcs:phase-2-2-2',
        target_ref: {
          target_kind: 'filesystem_path',
          target_id: 'filesystem-path:hcs:logs-partition',
        },
        deletion_authority_kind: 'runtime_state_classification',
        deletion_authority_source_ref: {
          evidence_id: 'evidence:hcs:runtime-state',
        },
        evidence_refs: [evidenceRef],
      }).success,
    ).toBe(false);
  });

  it('keeps agent-internal state scoped to execution-context targets', () => {
    expect(
      operationShapeSchema.parse({
        schema_version: '0.1.0',
        operation_shape_id: 'operation-shape:hcs:agent-state',
        operation_class: 'agent_internal_state',
        mutation_scope: 'agent_internal_state',
        execution_context_id: 'ctx:hcs:phase-2-2-2',
        target_ref: {
          target_kind: 'execution_context',
          target_id: 'ctx:hcs:phase-2-2-2',
        },
        deletion_authority_kind: null,
        deletion_authority_source_ref: null,
        evidence_refs: [evidenceRef],
      }).target_ref.target_kind,
    ).toBe('execution_context');

    expect(
      operationShapeSchema.safeParse({
        schema_version: '0.1.0',
        operation_shape_id: 'operation-shape:hcs:agent-state-filesystem',
        operation_class: 'agent_internal_state',
        mutation_scope: 'agent_internal_state',
        execution_context_id: 'ctx:hcs:phase-2-2-2',
        target_ref: {
          target_kind: 'filesystem_path',
          target_id: 'filesystem-path:hcs:logs-partition',
        },
        deletion_authority_kind: null,
        deletion_authority_source_ref: null,
        evidence_refs: [evidenceRef],
      }).success,
    ).toBe(false);
  });

  it('keeps external control-plane mutations scoped to provider targets', () => {
    expect(
      operationShapeSchema.parse({
        schema_version: '0.1.0',
        operation_shape_id: 'operation-shape:hcs:provider-mutation',
        operation_class: 'external_control_plane_mutation',
        mutation_scope: 'external_control_plane_mutation',
        execution_context_id: 'ctx:hcs:phase-2-2-2',
        target_ref: {
          target_kind: 'provider_object',
          target_id: 'provider-object:github:ruleset',
        },
        deletion_authority_kind: null,
        deletion_authority_source_ref: null,
        evidence_refs: [evidenceRef],
      }).target_ref.target_kind,
    ).toBe('provider_object');

    expect(
      operationShapeSchema.safeParse({
        schema_version: '0.1.0',
        operation_shape_id: 'operation-shape:hcs:provider-mutation-filesystem',
        operation_class: 'external_control_plane_mutation',
        mutation_scope: 'external_control_plane_mutation',
        execution_context_id: 'ctx:hcs:phase-2-2-2',
        target_ref: {
          target_kind: 'filesystem_path',
          target_id: 'filesystem-path:hcs:logs-partition',
        },
        deletion_authority_kind: null,
        deletion_authority_source_ref: null,
        evidence_refs: [evidenceRef],
      }).success,
    ).toBe(false);
  });

  it('rejects deletion authority on read-only and workspace verify operations', () => {
    expect(
      operationShapeSchema.safeParse({
        schema_version: '0.1.0',
        operation_shape_id: 'operation-shape:hcs:verify-with-delete-authority',
        operation_class: 'workspace_verify',
        mutation_scope: 'verify_workspace',
        execution_context_id: 'ctx:hcs:phase-2-2-2',
        target_ref: {
          target_kind: 'workspace',
          target_id: 'workspace:host-capability-substrate',
        },
        deletion_authority_kind: 'runtime_state_classification',
        deletion_authority_source_ref: {
          evidence_id: 'evidence:hcs:runtime-state',
        },
        evidence_refs: [evidenceRef],
      }).success,
    ).toBe(false);
  });

  it('keeps operation_class and mutation_scope paired', () => {
    expect(
      operationShapeSchema.safeParse({
        schema_version: '0.1.0',
        operation_shape_id: 'operation-shape:hcs:bad-scope',
        operation_class: 'merge_or_push',
        mutation_scope: 'destructive_git',
        execution_context_id: 'ctx:hcs:phase-2-2-2',
        target_ref: {
          target_kind: 'repository',
          target_id: 'repository:hcs',
        },
        deletion_authority_kind: null,
        deletion_authority_source_ref: null,
        evidence_refs: [evidenceRef],
      }).success,
    ).toBe(false);
  });

  it('keeps operation_shape as an Evidence subject kind with current Evidence schema', () => {
    const evidence = evidenceSchema.parse({
      schema_version: '0.7.0',
      evidence_id: 'evidence:operation-shape:delete-branch',
      evidence_kind: 'observation',
      subject_refs: [
        {
          subject_kind: 'operation_shape',
          subject_id: 'operation-shape:hcs:delete-branch',
        },
      ],
      source:
        'docs/host-capability-substrate/adr/0036-q-009-workspace-manifest-projection-and-diagnostic-surface.md',
      observed_at: '2026-05-06T00:00:00Z',
      valid_until: null,
      authority: 'host-observation',
      confidence: 'high',
      parser_version: 'human-review:v1',
      redaction_mode: 'reference_only',
    });

    expect(evidence.subject_refs[0]?.subject_kind).toBe('operation_shape');
  });
});
