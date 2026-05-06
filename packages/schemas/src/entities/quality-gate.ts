import { z } from 'zod';
import {
  entityIdSchema,
  evidenceAuthoritySchema,
  evidenceRefSchema,
  isoDateTimeSchema,
  schemaVersionSchema,
} from '../common.ts';

export const qualityGateKindSchema = z
  .enum([
    'identity_binding',
    'credential_shadow',
    'signing_identity',
    'filesystem_trust',
    'tool_provenance',
    'mutation_class',
  ])
  .describe('QualityGate gate_kind values from ADR 0035.');

export const qualityGateStateSchema = z
  .enum(['provisional', 'proven', 'expired', 'denied'])
  .describe('QualityGate lifecycle state from ADR 0035.');

export const qualityGateOperationClassSchema = z
  .enum([
    'read_only_diagnostic',
    'agent_internal_state',
    'destructive_git',
    'external_control_plane_mutation',
    'worktree_mutation',
    'merge_or_push',
  ])
  .describe('ADR 0029 operation class values used by mutation_class QualityGates.');

export const identityBindingGateTargetRefSchema = z
  .object({
    workspace_id: entityIdSchema,
    surface_id: entityIdSchema,
  })
  .strict()
  .describe('Target subject ref for identity_binding QualityGate records.');

export const credentialShadowGateTargetRefSchema = z
  .object({
    credential_source_id: entityIdSchema,
  })
  .strict()
  .describe('Target subject ref for credential_shadow QualityGate records.');

export const signingIdentityGateTargetRefSchema = z
  .object({
    workspace_id: entityIdSchema,
    repository_id: entityIdSchema,
  })
  .strict()
  .describe('Target subject ref for signing_identity QualityGate records.');

export const filesystemTrustGateTargetRefSchema = z
  .object({
    execution_context_id: entityIdSchema,
    surface_id: entityIdSchema,
  })
  .strict()
  .describe('Target subject ref for filesystem_trust QualityGate records.');

export const toolProvenanceGateTargetRefSchema = z
  .object({
    tool_or_provider_ref: entityIdSchema,
  })
  .strict()
  .describe('Target subject ref for tool_provenance QualityGate records.');

export const mutationClassGateTargetRefSchema = z
  .object({
    operation_class: qualityGateOperationClassSchema,
  })
  .strict()
  .describe('Target subject ref for mutation_class QualityGate records.');

export const qualityGateTargetSubjectRefSchema = z
  .union([
    identityBindingGateTargetRefSchema,
    credentialShadowGateTargetRefSchema,
    signingIdentityGateTargetRefSchema,
    filesystemTrustGateTargetRefSchema,
    toolProvenanceGateTargetRefSchema,
    mutationClassGateTargetRefSchema,
  ])
  .describe('Polymorphic target_subject_ref selected by QualityGate.gate_kind.');

const targetSubjectRefSchemas = {
  identity_binding: identityBindingGateTargetRefSchema,
  credential_shadow: credentialShadowGateTargetRefSchema,
  signing_identity: signingIdentityGateTargetRefSchema,
  filesystem_trust: filesystemTrustGateTargetRefSchema,
  tool_provenance: toolProvenanceGateTargetRefSchema,
  mutation_class: mutationClassGateTargetRefSchema,
} as const;

const retrievalArtifactIdPattern = /^(knowledge-chunk|derived-summary):/;

export const qualityGateEvidenceChainRecordKindSchema = z
  .enum([
    'evidence',
    'boundary_observation',
    'coordination_fact',
    'derived_summary',
    'knowledge_chunk',
    'quality_gate',
  ])
  .describe('Record kind in a QualityGate evidence-chain preview.');

export const qualityGateEvidenceChainRefSchema = z
  .object({
    record_kind: qualityGateEvidenceChainRecordKindSchema,
    record_id: entityIdSchema,
    authority: evidenceAuthoritySchema,
    allowed_for_gate: z.boolean().optional(),
    gate_state: qualityGateStateSchema.optional(),
  })
  .strict()
  .describe('Typed evidence-chain preview used for QualityGate invariant checks.');

export const qualityGateEvidenceRefSchema = evidenceRefSchema
  .extend({
    evidence_chain_refs: z.array(qualityGateEvidenceChainRefSchema).default([]),
  })
  .strict()
  .describe('QualityGate evidence reference with typed transitive-chain preview.');

export const qualityGateSchema = z
  .object({
    schema_version: schemaVersionSchema,
    gate_id: entityIdSchema,
    gate_kind: qualityGateKindSchema,
    target_subject_ref: qualityGateTargetSubjectRefSchema,
    gate_state: qualityGateStateSchema,
    evidence_refs: z.array(qualityGateEvidenceRefSchema).min(1),
    valid_until: isoDateTimeSchema.nullable(),
    provisional_at: isoDateTimeSchema,
    proven_at: isoDateTimeSchema.nullable(),
    expired_at: isoDateTimeSchema.nullable(),
    denied_at: isoDateTimeSchema.nullable(),
    execution_context_id: entityIdSchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    const targetSubjectRefResult = targetSubjectRefSchemas[value.gate_kind].safeParse(
      value.target_subject_ref,
    );

    if (!targetSubjectRefResult.success) {
      ctx.addIssue({
        code: 'custom',
        message: `target_subject_ref does not match gate_kind ${value.gate_kind}.`,
        path: ['target_subject_ref'],
      });
    }

    if (
      value.evidence_refs.some(
        (ref) =>
          retrievalArtifactIdPattern.test(ref.evidence_id) ||
          ref.evidence_chain_refs.some((chainRef) => chainRef.record_kind === 'knowledge_chunk'),
      )
    ) {
      ctx.addIssue({
        code: 'custom',
        message:
          'QualityGate evidence_refs must not cite KnowledgeChunk or DerivedSummary records directly.',
        path: ['evidence_refs'],
      });
    }

    if (
      (value.gate_state === 'proven' || value.gate_state === 'expired') &&
      value.evidence_refs.some(
        (ref) =>
          ref.authority === 'sandbox-observation' ||
          ref.evidence_chain_refs.some(
            (chainRef) =>
              chainRef.authority === 'sandbox-observation' ||
              ((chainRef.record_kind === 'coordination_fact' ||
                chainRef.record_kind === 'derived_summary') &&
                chainRef.allowed_for_gate !== true),
          ),
      )
    ) {
      ctx.addIssue({
        code: 'custom',
        message:
          'proven or expired QualityGate records cannot cite sandbox-observation authority or unpromoted coordination/summary records.',
        path: ['evidence_refs'],
      });
    }

    if (value.gate_state === 'provisional') {
      if (value.proven_at !== null || value.expired_at !== null || value.denied_at !== null) {
        ctx.addIssue({
          code: 'custom',
          message:
            'provisional QualityGate records must not carry proven_at, expired_at, or denied_at.',
          path: ['gate_state'],
        });
      }

      return;
    }

    if (value.gate_state === 'proven') {
      if (value.proven_at === null || value.expired_at !== null || value.denied_at !== null) {
        ctx.addIssue({
          code: 'custom',
          message: 'proven QualityGate records require proven_at and no expired_at or denied_at.',
          path: ['gate_state'],
        });
      }

      if (value.valid_until === null) {
        ctx.addIssue({
          code: 'custom',
          message: 'proven QualityGate records require valid_until.',
          path: ['valid_until'],
        });
      }

      return;
    }

    if (value.gate_state === 'expired') {
      if (value.proven_at === null || value.expired_at === null || value.denied_at !== null) {
        ctx.addIssue({
          code: 'custom',
          message: 'expired QualityGate records require proven_at and expired_at only.',
          path: ['gate_state'],
        });
      }

      if (value.valid_until === null) {
        ctx.addIssue({
          code: 'custom',
          message: 'expired QualityGate records require valid_until.',
          path: ['valid_until'],
        });
      }

      return;
    }

    if (value.gate_state === 'denied') {
      if (value.proven_at !== null || value.expired_at !== null || value.denied_at === null) {
        ctx.addIssue({
          code: 'custom',
          message: 'denied QualityGate records require denied_at and no proven_at or expired_at.',
          path: ['gate_state'],
        });
      }
    }
  })
  .describe('Ring 0 QualityGate entity from ADR 0035 and ADR 0038 Phase 2.1.4.');

export type QualityGateKind = z.infer<typeof qualityGateKindSchema>;
export type QualityGateState = z.infer<typeof qualityGateStateSchema>;
export type QualityGateOperationClass = z.infer<typeof qualityGateOperationClassSchema>;
export type QualityGateTargetSubjectRef = z.infer<typeof qualityGateTargetSubjectRefSchema>;
export type QualityGateEvidenceChainRecordKind = z.infer<
  typeof qualityGateEvidenceChainRecordKindSchema
>;
export type QualityGateEvidenceChainRef = z.infer<typeof qualityGateEvidenceChainRefSchema>;
export type QualityGateEvidenceRef = z.infer<typeof qualityGateEvidenceRefSchema>;
export type QualityGate = z.infer<typeof qualityGateSchema>;
