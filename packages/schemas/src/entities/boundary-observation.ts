import { z } from 'zod';
import { entityIdSchema, evidenceRefSchema } from '../common.ts';
import { sandboxProfileSchema } from './execution-context.ts';

const boundaryObservationSchemaVersionSchema = z
  .literal('0.3.0')
  .describe(
    'BoundaryObservation schema version after ADR 0032 runner_isolation payload branch landed in Phase 2.3.2.',
  );

const boundaryObservationEvidenceSchemaVersionSchema = z
  .string()
  .min(1)
  .describe('Base Evidence schema version used by BoundaryObservation component evidence.');

export const boundaryDimensionSchema = z
  .enum([
    'bundle_identity',
    'check_source',
    'containment_class',
    'credential_routing',
    'egress_observed',
    'egress_policy',
    'filesystem_authority',
    'filesystem_inheritance',
    'filesystem_protected_paths',
    'launch_context',
    'mcp_authorization',
    'mcp_canonical_authority',
    'origin_access_validation',
    'path_coverage',
    'runner_isolation',
    'sandbox',
    'tcc',
    'volume_authority',
    'worktree_ownership',
  ])
  .describe(
    'Singular boundary dimension from ADR 0022. Registered values mirror docs/host-capability-substrate/ontology-registry.md.',
  );

export const boundaryObservationStateSchema = z
  .enum(['proven', 'denied', 'pending', 'stale', 'contradictory', 'inapplicable', 'unknown'])
  .describe(
    'Seven-state boundary vocabulary from ADR 0022. unknown is not false; missing or unobservable evidence is distinct from denied.',
  );

export const boundaryDiscrepancyClassSchema = z
  .enum([
    'observed_matches_expected',
    'observed_differs_from_expected',
    'expected_unobservable',
    'observed_without_expected',
    'expected_without_observed',
    'unknown',
  ])
  .describe(
    'Optional discrepancy summary between observed_payload and expected_payload. Initial set; ontology-registry workflow may extend it.',
  );

export const containmentKindSchema = z
  .enum([
    'none',
    'kernel_sandbox',
    'container',
    'vm',
    'remote_cloud_sandbox',
    'ide_host_isolation',
    'terminal_no_isolation',
  ])
  .describe('Runtime containment discriminator for containment_class payloads.');

export const containmentNetworkEgressPostureSchema = z
  .enum(['none', 'restricted', 'open', 'unknown'])
  .describe('Observed network egress posture for a containment_class payload.');

export const containmentFilesystemWriteScopeSchema = z
  .enum(['none', 'workspace_write', 'full_access', 'unknown'])
  .describe('Observed filesystem write scope for a containment_class payload.');

export const containmentKeychainAccessSchema = z
  .enum(['none', 'tcc_scoped', 'app_managed_bundle', 'unknown'])
  .describe('Observed keychain access posture for a containment_class payload.');

export const containerRuntimeKindSchema = z
  .enum(['docker', 'podman', 'nerdctl', 'orbstack', 'colima', 'unknown'])
  .describe('Container runtime kind for containment_class payloads.');

export const vmKindSchema = z
  .enum(['local_vm_snapshot', 'local_vm_persistent', 'unknown'])
  .describe('VM containment kind for containment_class payloads.');

export const remoteCloudKindSchema = z
  .enum(['vendor_managed_vm', 'vendor_managed_container', 'self_hosted_runner_class', 'unknown'])
  .describe('Remote cloud containment kind for containment_class payloads.');

const containmentClassCommonPayloadSchema = z.object({
  network_egress_posture: containmentNetworkEgressPostureSchema,
  filesystem_write_scope: containmentFilesystemWriteScopeSchema,
  keychain_access: containmentKeychainAccessSchema,
});

export const containmentClassPayloadSchema = z
  .discriminatedUnion('containment_kind', [
    containmentClassCommonPayloadSchema
      .extend({
        containment_kind: z.literal('none'),
      })
      .strict(),
    containmentClassCommonPayloadSchema
      .extend({
        containment_kind: z.literal('kernel_sandbox'),
        kernel_sandbox_profile: sandboxProfileSchema,
      })
      .strict(),
    containmentClassCommonPayloadSchema
      .extend({
        containment_kind: z.literal('container'),
        container_runtime_kind: containerRuntimeKindSchema,
      })
      .strict(),
    containmentClassCommonPayloadSchema
      .extend({
        containment_kind: z.literal('vm'),
        vm_kind: vmKindSchema,
      })
      .strict(),
    containmentClassCommonPayloadSchema
      .extend({
        containment_kind: z.literal('remote_cloud_sandbox'),
        remote_cloud_kind: remoteCloudKindSchema,
      })
      .strict(),
    containmentClassCommonPayloadSchema
      .extend({
        containment_kind: z.literal('ide_host_isolation'),
      })
      .strict(),
    containmentClassCommonPayloadSchema
      .extend({
        containment_kind: z.literal('terminal_no_isolation'),
      })
      .strict(),
  ])
  .describe('ADR 0037 containment_class BoundaryObservation payload.');

export const filesystemInheritancePayloadSchema = z
  .discriminatedUnion('inheritance_held', [
    z
      .object({
        inheritance_held: z.literal(false),
        inheritance_evidence_refs: z.array(evidenceRefSchema).default([]),
      })
      .strict(),
    z
      .object({
        inheritance_held: z.literal(true),
        inheritance_evidence_refs: z.array(evidenceRefSchema).min(1),
      })
      .strict(),
  ])
  .describe('ADR 0036 filesystem_inheritance BoundaryObservation payload.');

export const pathAuthorityKindSchema = z
  .enum(['rule_binding', 'lease_scope', 'tcc_scoped', 'human_dashboard_grant'])
  .describe('Authority source kind for filesystem_protected_paths entries.');

export const filesystemProtectedPathSchema = z
  .object({
    path: z.string().min(1),
    path_authority_kind: pathAuthorityKindSchema,
    path_authority_source_evidence_ref: evidenceRefSchema,
  })
  .strict()
  .describe('Single D-025 protected path assertion in placeholder or canonical path form.');

export const filesystemProtectedPathsPayloadSchema = z
  .object({
    protected_paths: z.array(filesystemProtectedPathSchema).default([]),
  })
  .strict()
  .describe('ADR 0036 filesystem_protected_paths BoundaryObservation payload.');

export const mcpServerKindSchema = z
  .enum(['github_mcp'])
  .describe('MCP server kind enum from ADR 0033; future values require registry extension.');

export const mcpCanonicalInstallSourceKindSchema = z
  .enum([
    'homebrew',
    'mise',
    'asdf',
    'npm',
    'pip',
    'uv',
    'system_package_manager',
    'manual',
    'unknown',
  ])
  .describe('Canonical install source kind for mcp_canonical_authority payloads.');

export const mcpCanonicalAuthorityKindSchema = z
  .enum(['system_install', 'user_install', 'homebrew', 'mise', 'direnv_provided'])
  .describe('Authority class naming the canonical MCP install or config source.');

export const mcpCanonicalAuthorityPayloadSchema = z
  .object({
    mcp_server_kind: mcpServerKindSchema,
    canonical_install_source_kind: mcpCanonicalInstallSourceKindSchema,
    canonical_credential_source_evidence_ref: evidenceRefSchema,
    shim_chain_evidence_ref: evidenceRefSchema,
    canonical_authority_kind: mcpCanonicalAuthorityKindSchema,
    redaction_mode: z.literal('reference_only'),
  })
  .strict()
  .describe('ADR 0036 mcp_canonical_authority BoundaryObservation payload.');

export const runnerJobEnvironmentKindSchema = z
  .enum(['host', 'container', 'disposable_vm'])
  .describe('ADR 0032 runner job environment kind.');

export const runnerWorkspaceCleanupKindSchema = z
  .enum(['always_clean', 'checkout_clean_only', 'persistent'])
  .describe('ADR 0032 runner workspace cleanup posture.');

export const runnerDockerSocketExposureKindSchema = z
  .enum(['none', 'host_workflow_only', 'all_workflows', 'unknown'])
  .describe('ADR 0032 runner Docker socket exposure kind.');

export const runnerNetworkEgressKindSchema = z
  .enum(['internet_full', 'internet_restricted', 'vpn_only', 'egress_blocked'])
  .describe('ADR 0032 runner network egress posture.');

export const runnerHostFilesystemAccessSchema = z
  .enum(['isolated', 'shared_workspace', 'shared_host'])
  .describe('ADR 0032 runner host filesystem access posture.');

export const runnerIsolationPayloadSchema = z
  .object({
    job_environment_kind: runnerJobEnvironmentKindSchema,
    workspace_cleanup_kind: runnerWorkspaceCleanupKindSchema,
    docker_socket_exposure_kind: runnerDockerSocketExposureKindSchema,
    network_egress_kind: runnerNetworkEgressKindSchema,
    host_filesystem_access: runnerHostFilesystemAccessSchema,
  })
  .strict()
  .describe('ADR 0032 runner_isolation BoundaryObservation payload.');

const typedBoundaryDimensions = [
  'containment_class',
  'filesystem_inheritance',
  'filesystem_protected_paths',
  'mcp_canonical_authority',
  'runner_isolation',
] as const;

const genericBoundaryDimensionSchema = boundaryDimensionSchema.exclude(typedBoundaryDimensions);

const boundaryObservationBaseSchema = z.object({
  schema_version: boundaryObservationSchemaVersionSchema,
  evidence_schema_version: boundaryObservationEvidenceSchemaVersionSchema,
  payload_schema_version: z.string().min(1).optional(),
  boundary_observation_id: entityIdSchema,
  surface_id: entityIdSchema.optional(),
  execution_context_id: entityIdSchema.optional(),
  workspace_id: entityIdSchema.optional(),
  credential_source_id: entityIdSchema.optional(),
  tool_or_provider_ref: entityIdSchema.optional(),
  observation_state: boundaryObservationStateSchema,
  discrepancy_class: boundaryDiscrepancyClassSchema.optional(),
  evidence_refs: z.array(evidenceRefSchema).min(1),
});

const genericBoundaryObservationSchema = boundaryObservationBaseSchema
  .extend({
    boundary_dimension: genericBoundaryDimensionSchema,
    observed_payload: z.json(),
    expected_payload: z.json().optional(),
  })
  .strict();

const containmentClassBoundaryObservationSchema = boundaryObservationBaseSchema
  .extend({
    execution_context_id: entityIdSchema,
    boundary_dimension: z.literal('containment_class'),
    observed_payload: containmentClassPayloadSchema,
    expected_payload: containmentClassPayloadSchema.optional(),
  })
  .strict();

const filesystemInheritanceBoundaryObservationSchema = boundaryObservationBaseSchema
  .extend({
    execution_context_id: entityIdSchema,
    boundary_dimension: z.literal('filesystem_inheritance'),
    observed_payload: filesystemInheritancePayloadSchema,
    expected_payload: filesystemInheritancePayloadSchema.optional(),
  })
  .strict();

const filesystemProtectedPathsBoundaryObservationSchema = boundaryObservationBaseSchema
  .extend({
    workspace_id: entityIdSchema,
    boundary_dimension: z.literal('filesystem_protected_paths'),
    observed_payload: filesystemProtectedPathsPayloadSchema,
    expected_payload: filesystemProtectedPathsPayloadSchema.optional(),
  })
  .strict();

const mcpCanonicalAuthorityBoundaryObservationSchema = boundaryObservationBaseSchema
  .extend({
    execution_context_id: entityIdSchema,
    boundary_dimension: z.literal('mcp_canonical_authority'),
    observed_payload: mcpCanonicalAuthorityPayloadSchema,
    expected_payload: mcpCanonicalAuthorityPayloadSchema.optional(),
  })
  .strict();

export const runnerIsolationObservationSchema = boundaryObservationBaseSchema
  .extend({
    execution_context_id: entityIdSchema,
    boundary_dimension: z.literal('runner_isolation'),
    observed_payload: runnerIsolationPayloadSchema,
    expected_payload: runnerIsolationPayloadSchema.optional(),
  })
  .strict()
  .describe('ADR 0032 RunnerIsolationObservation BoundaryObservation subtype.');

export const boundaryObservationSchema = z
  .union([
    containmentClassBoundaryObservationSchema,
    filesystemInheritanceBoundaryObservationSchema,
    filesystemProtectedPathsBoundaryObservationSchema,
    mcpCanonicalAuthorityBoundaryObservationSchema,
    runnerIsolationObservationSchema,
    genericBoundaryObservationSchema,
  ])
  .refine(
    (value) =>
      Boolean(
        value.surface_id ||
          value.execution_context_id ||
          value.workspace_id ||
          value.credential_source_id ||
          value.tool_or_provider_ref,
      ),
    {
      message:
        'BoundaryObservation requires at least one target reference: surface_id, execution_context_id, workspace_id, credential_source_id, or tool_or_provider_ref.',
      path: ['boundary_observation_id'],
    },
  )
  .describe('Ring 0 BoundaryObservation envelope from ADR 0022.');

export type BoundaryObservation = z.infer<typeof boundaryObservationSchema>;
export type BoundaryDimension = z.infer<typeof boundaryDimensionSchema>;
export type BoundaryObservationState = z.infer<typeof boundaryObservationStateSchema>;
export type BoundaryDiscrepancyClass = z.infer<typeof boundaryDiscrepancyClassSchema>;
export type ContainmentKind = z.infer<typeof containmentKindSchema>;
export type ContainmentClassPayload = z.infer<typeof containmentClassPayloadSchema>;
export type FilesystemInheritancePayload = z.infer<typeof filesystemInheritancePayloadSchema>;
export type PathAuthorityKind = z.infer<typeof pathAuthorityKindSchema>;
export type FilesystemProtectedPath = z.infer<typeof filesystemProtectedPathSchema>;
export type FilesystemProtectedPathsPayload = z.infer<typeof filesystemProtectedPathsPayloadSchema>;
export type MCPServerKind = z.infer<typeof mcpServerKindSchema>;
export type MCPCanonicalAuthorityPayload = z.infer<typeof mcpCanonicalAuthorityPayloadSchema>;
export type RunnerJobEnvironmentKind = z.infer<typeof runnerJobEnvironmentKindSchema>;
export type RunnerWorkspaceCleanupKind = z.infer<typeof runnerWorkspaceCleanupKindSchema>;
export type RunnerDockerSocketExposureKind = z.infer<typeof runnerDockerSocketExposureKindSchema>;
export type RunnerNetworkEgressKind = z.infer<typeof runnerNetworkEgressKindSchema>;
export type RunnerHostFilesystemAccess = z.infer<typeof runnerHostFilesystemAccessSchema>;
export type RunnerIsolationPayload = z.infer<typeof runnerIsolationPayloadSchema>;
export type RunnerIsolationObservation = z.infer<typeof runnerIsolationObservationSchema>;
