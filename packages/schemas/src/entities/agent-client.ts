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
    audit_chain_link_hash: sha256DigestSchema.describe(
      "AgentClient audit-chain link hash. ADR 0059 (D-058) canonical-hash amendment — non-version-bumping, so schema_version stays 0.1.0. The hash covers the length-prefix-encoded canonical concatenation of these inputs in this exact order: agent_client_id || product_family || surface || app_build || dep_bundle_version || permission_mode || containment_mechanism || agent_client_state || kernel_observed_at || (valid_until || '') || canonical(evidence_refs) || prior_audit_chain_link_hash. schema_version is excluded from the canonical concatenation (ADR 0049-0055 precedent); audit_chain_link_hash is excluded because it is the computation output; producer attribution is excluded because AgentClient carries no producer field. The || operator denotes length-prefix-encoded concatenation: every variable-length component is encoded as varint(byte_length) || field_bytes using a shortest-form unsigned varint codec, and naive byte concatenation is forbidden. Nullable fields use the empty-string substitution for null, and the empty byte string is still length-prefix encoded. evidence_refs encodes as an array length followed by each element in persisted array order (reordering evidence refs changes the hash); each evidence reference encodes a fixed seven-slot sequence in evidenceRefSchema order: evidence_id, source, observed_at, valid_until, authority, parser_version, confidence — optional or nullable slots are never omitted, so absent valid_until, null valid_until, and absent parser_version normalize to the empty byte string (still length-prefix encoded). GENESIS: the first link for a given agent_client_id uses the literal GENESIS sentinel in place of prior_audit_chain_link_hash, classified from storage/audit-event metadata and never producer-asserted; the chain root is agent_client_id, so a new app_build mints a new AgentClient ID while retirement appends to the existing chain. model_ref is likewise excluded from this canonical concatenation — an attribution-field posture matching Decision.model_ref and Run.invoker_model_ref, distinct from the producer exclusion above (producer is excluded for lack of a field; model_ref is excluded because it is attribution, not identity): a configured-model re-pin is recorded as a new AgentClient observation distinguished by its already-hashed kernel_observed_at, never an input to this hash, so existing chains stay valid (ADR 0078 / D-081).",
    ),
    evidence_refs: z.array(evidenceRefSchema).min(1),
    model_ref: entityIdSchema
      .nullable()
      .optional()
      .describe(
        'ADR 0078 / D-081: typed ATTRIBUTION FK to the Model (ADR 0076) the client was configured to invoke by default at kernel_observed_at — the resolved default-model pin (e.g. the `.claude/settings.json` `model` alias resolved to a Model record). Single-valued PER OBSERVATION: a configured-model re-pin is recorded as a NEW AgentClient observation (fresh kernel_observed_at, a hashed slot), never an in-place mutation, so the client identity (agent_client_id chain root) spans model swaps. Additive nullable-optional `entityIdSchema`; no AgentClient.schema_version bump (ADR 0059 established AgentClient canonical-hash amendments are non-bumping; this additive field is strictly weaker). EXCLUDED from the audit_chain_link_hash canonical concatenation (attribution-field posture like Decision.model_ref / Run.invoker_model_ref — NOT identity-in-the-hash; existing chains stay valid). Producer-asserted by kernel_agent_client_resolver; FK existence, the pin->Model resolution, and binding to a `subject_kind: model` Evidence record are Ring 1 obligations.',
      ),
  })
  .strict()
  .describe(
    'Ring 0 AgentClient entity from ADR 0037 and ADR 0038 Phase 2.1.1. ADR 0059 (D-058) commits AgentClient to the mint/audit-service audit-chain commitment list — joining Decision, ApprovalGrant, Lease, Run, Principal, and Session for seven-entity coverage — by pinning the canonical field order, GENESIS handling, and length-prefix discipline documented on audit_chain_link_hash; the amendment is non-version-bumping, so schema_version stays 0.1.0. Producer attribution is service-path authority, NOT a record field: kernel_agent_client_resolver is the sole trusted producer path, gated on the authenticated resolver and recorded in append/rejection audit-event metadata, and payloads that self-assert resolver authority reject.',
  );

export type AgentClient = z.infer<typeof agentClientSchema>;
export type AgentClientProductFamily = z.infer<typeof agentClientProductFamilySchema>;
export type AgentClientPermissionMode = z.infer<typeof agentClientPermissionModeSchema>;
export type AgentClientContainmentMechanism = z.infer<typeof agentClientContainmentMechanismSchema>;
export type AgentClientState = z.infer<typeof agentClientStateSchema>;
