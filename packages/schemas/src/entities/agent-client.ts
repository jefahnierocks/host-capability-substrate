import { z } from 'zod';
import {
  entityIdSchema,
  evidenceRefSchema,
  isoDateTimeSchema,
  schemaVersionSchema,
  sha256DigestSchema,
} from '../common.ts';
import { executionContextSurfaceSchema } from './execution-context.ts';

const agentClientOpaqueVersionSchema = z
  .string()
  .min(1)
  .regex(/^[A-Za-z0-9._+-]+$/)
  .describe('Opaque build or dependency-bundle version observed by the kernel.');

export const agentClientProductFamilySchema = z
  .enum([
    'claude_code',
    'codex',
    'cursor',
    'copilot',
    'devin',
    'windsurf',
    'augment',
    'amp',
    'opencode',
    'warp',
    'vscode_native',
    'unknown',
  ])
  .describe('Agent product family from ADR 0037.');

export const agentClientPermissionModeSchema = z
  .enum(['default', 'yolo', 'approve_all', 'read_only', 'unknown'])
  .describe('Declared permission mode; producer-asserted and kernel-verifiable.');

export const agentClientContainmentMechanismSchema = z
  .enum([
    'terminal_no_isolation_capable',
    'ide_host_isolation_capable',
    'app_managed_bundle_capable',
    'kernel_sandbox_capable',
    'container_capable',
    'vm_capable',
    'remote_cloud_managed_capable',
    'unknown',
  ])
  .describe('Capability-class containment mechanism the product can provide.');

export const agentClientStateSchema = z
  .enum(['active', 'retired'])
  .describe('Lifecycle state for an AgentClient record.');

export const agentClientSchema = z
  .object({
    schema_version: schemaVersionSchema,
    agent_client_id: entityIdSchema,
    product_family: agentClientProductFamilySchema,
    surface: executionContextSurfaceSchema,
    app_build: agentClientOpaqueVersionSchema,
    dep_bundle_version: agentClientOpaqueVersionSchema,
    permission_mode: agentClientPermissionModeSchema,
    containment_mechanism: agentClientContainmentMechanismSchema,
    agent_client_state: agentClientStateSchema,
    kernel_observed_at: isoDateTimeSchema,
    valid_until: isoDateTimeSchema.nullable(),
    audit_chain_link_hash: sha256DigestSchema,
    evidence_refs: z.array(evidenceRefSchema).min(1),
  })
  .strict()
  .describe('Ring 0 AgentClient entity from ADR 0037 and ADR 0038 Phase 2.1.1.');

export type AgentClient = z.infer<typeof agentClientSchema>;
export type AgentClientProductFamily = z.infer<typeof agentClientProductFamilySchema>;
export type AgentClientPermissionMode = z.infer<typeof agentClientPermissionModeSchema>;
export type AgentClientContainmentMechanism = z.infer<typeof agentClientContainmentMechanismSchema>;
export type AgentClientState = z.infer<typeof agentClientStateSchema>;
