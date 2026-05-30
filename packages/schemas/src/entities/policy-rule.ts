import { z } from 'zod';
import {
  entityIdSchema,
  isoDateTimeSchema,
  isoDurationSchema,
  sha256DigestSchema,
} from '../common.ts';
import { approvalGrantKindSchema, approvalGrantProducerSchema } from './approval-grant.ts';
import { operationShapeOperationClassSchema } from './operation-shape.ts';

export const policyRuleSchemaVersionSchema = z
  .literal('0.1.0')
  .describe(
    'PolicyRule schema version (ADR 0060; first non-minted Ring 0 entity; D-057). New-entity introduction at 0.1.0; not a breaking bump.',
  );

export const policyRuleTierSchema = z
  .enum(['read-safe', 'write-local', 'write-project', 'write-destructive', 'forbidden'])
  .describe(
    'PolicyRule tier (ADR 0060). Five active tiers mirroring the live policy `tiers:` keys verbatim; `write-host` was removed from live policy v0.1.0 and is a registry-canonical reservation. kebab-case mirrors the live-policy keys (registry §Naming-suffix-discipline Sub-rule 9 grandfather extension; no other Ring 0 enum may adopt kebab-case). `forbidden` is non-escalable per charter inv. 6, enforced structurally by the envelope superRefine.',
  );

export const policyRuleDashboardVisibilitySchema = z
  .enum(['not_required', 'required_before_grant_consumption'])
  .describe(
    'PolicyRule approval dashboard-visibility posture (ADR 0060; mirrors the live policy `policy_local_enums.dashboard_visibility`).',
  );

export const policyRuleScopeDescriptorSchema = z
  .string()
  .regex(/^[a-z0-9_]+$/)
  .describe(
    'Evidence-bound scope descriptor token (ADR 0060). Descriptor identifiers only (lower_snake) — never resolved values, secret material, or `op://`- / path-shaped strings (charter inv. 5; the forbidden-string scan covers committed fixtures).',
  );

export const policyRulePolicyPathSchema = z
  .string()
  .regex(/^(?!.*\.\.)[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/)
  .describe(
    'system-config canonical RELATIVE path to the live policy (ADR 0060), e.g. `policies/host-capability-substrate/tiers.yaml`. No absolute paths, no `..` traversal, no secret-shaped values.',
  );

export const policyRuleValidUntilCeilingSchema = z
  .union([isoDurationSchema, z.literal('not_applicable')])
  .describe(
    'PolicyRule freshness ceiling (ADR 0060): a narrow ISO-8601 duration (e.g. `PT24H`, `PT1H`) or the literal `not_applicable` for non-gated tiers. The schema does not bind a ceiling to a tier — that mapping is live-policy content (charter inv. 1 / inv. 10).',
  );

const policyRuleApprovalNotRequiredSchema = z
  .object({
    approval_required: z.literal(false),
    approval_path_allowed: z.boolean(),
  })
  .strict();

const policyRuleApprovalRequiredSchema = z
  .object({
    approval_required: z.literal(true),
    approval_path_allowed: z.literal(true),
    required_grant_kind: approvalGrantKindSchema,
    allowed_grant_kinds: z.array(approvalGrantKindSchema).min(1),
    producer_allowlist: z.array(approvalGrantProducerSchema).min(1),
    dashboard_visibility: policyRuleDashboardVisibilitySchema,
    single_use: z.boolean(),
    evidence_bound_scope: policyRuleScopeDescriptorSchema,
  })
  .strict();

export const policyRuleApprovalSchema = z
  .discriminatedUnion('approval_required', [
    policyRuleApprovalNotRequiredSchema,
    policyRuleApprovalRequiredSchema,
  ])
  .describe(
    'PolicyRule approval requirement (ADR 0060), discriminated on `approval_required`. The false branch carries only `approval_path_allowed`; the true branch carries the grant/producer/dashboard/scope detail and pins `approval_path_allowed: true`. `producer_allowlist` reuses `approvalGrantProducerSchema` (mint_api/kernel_broker; kernel_gateway excluded per ADR 0051 v4) — the policy-permitted set, distinct from ApprovalGrant.granted_by (the actual minter), same closed domain. `required_grant_kind` must be a member of `allowed_grant_kinds` (envelope superRefine).',
  );

export const policyRuleSourceProvenanceSchema = z
  .object({
    authority: z.literal('system_config_live_policy'),
    source_policy_path: policyRulePolicyPathSchema,
    source_policy_sha256: sha256DigestSchema,
    source_policy_sha256_basis: z.literal('live_policy_blob'),
    observed_at: isoDateTimeSchema,
  })
  .strict()
  .describe(
    'PolicyRule provenance to the operator-approved live policy (ADR 0060). `authority` is a standalone literal, intentionally DISJOINT from evidenceAuthoritySchema — PolicyRule is not an Evidence record; this is a provenance tag, not an evidence trust class, and must not be wired into chain-walk logic. The digest covers the live-policy content blob bound by `snapshot-binding.json` (NOT the stale internal candidate-skeleton field carried inside the live policy). The `authority` literal confers NO authority on its own: per charter inv. 4 the Ring 1 loader MUST verify `source_policy_sha256` against the bound, verified snapshot digest before a rule influences a Decision (ADR 0060 §Provenance verification).',
  );

const policyRuleNonEscalableTiers: ReadonlySet<string> = new Set(['forbidden']);

export const policyRuleSchema = z
  .object({
    schema_version: policyRuleSchemaVersionSchema,
    policy_rule_id: entityIdSchema,
    operation_class: operationShapeOperationClassSchema,
    tier: policyRuleTierSchema,
    classification_basis: z.literal('typed_operation_class'),
    requires_active_lease: z.boolean(),
    requires_deletion_authority: z.boolean(),
    requires_typed_provider_evidence: z.boolean(),
    approval: policyRuleApprovalSchema,
    valid_until_ceiling: policyRuleValidUntilCeilingSchema,
    valid_until_ceiling_source_ref: z.string().min(1),
    source_provenance: policyRuleSourceProvenanceSchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    if (policyRuleNonEscalableTiers.has(value.tier)) {
      if (value.approval.approval_required !== false) {
        ctx.addIssue({
          code: 'custom',
          message:
            'non-escalable tier (e.g. forbidden) must use the approval_required:false variant — no approval grant per charter inv. 6.',
          path: ['approval', 'approval_required'],
        });
      } else if (value.approval.approval_path_allowed !== false) {
        ctx.addIssue({
          code: 'custom',
          message:
            'non-escalable tier (e.g. forbidden) must set approval_path_allowed:false — no approval path per charter inv. 6.',
          path: ['approval', 'approval_path_allowed'],
        });
      }
    }
    if (
      value.approval.approval_required === true &&
      !value.approval.allowed_grant_kinds.includes(value.approval.required_grant_kind)
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'required_grant_kind must be a member of allowed_grant_kinds.',
        path: ['approval', 'required_grant_kind'],
      });
    }
  })
  .describe(
    'Ring 0 PolicyRule entity from ADR 0060 (D-057). NON-MINTED typed shape of a single policy rule, keyed to OperationShape.operation_class. No audit_chain_link_hash, no producer-mint field, no evidence_refs — PolicyRule is not an audit-chain mint entity and is absent from the ADR 0057 mint scope; rule provenance is `source_provenance`, bound to the operator-approved live policy. The schema encodes ONLY structural invariants: forbidden non-escalability via the nonEscalableTiers set (charter inv. 6); approval-path consistency via the discriminated union; and required_grant_kind ∈ allowed_grant_kinds. It never encodes the operation_class→tier or tier→approval mappings, which are live-policy content owned by system-config (charter inv. 1 / inv. 10). Two named Ring-1 obligations of the non-minted posture: (B-1) a follow-up Decision schema amendment adds policy_rule_ref + the resolved source_policy_sha256 for audit attribution (Decision lacks it today); (B-2) the gateway/loader MUST verify source_provenance.source_policy_sha256 against the bound, verified snapshot digest before a rule influences a Decision. Landing this entity sets the live policy policy_rule_schema_version null→0.1.0 (operator + system-config lane).',
  );

export type PolicyRule = z.infer<typeof policyRuleSchema>;
export type PolicyRuleApproval = z.infer<typeof policyRuleApprovalSchema>;
export type PolicyRuleDashboardVisibility = z.infer<typeof policyRuleDashboardVisibilitySchema>;
export type PolicyRuleSourceProvenance = z.infer<typeof policyRuleSourceProvenanceSchema>;
export type PolicyRuleTier = z.infer<typeof policyRuleTierSchema>;
export type PolicyRuleValidUntilCeiling = z.infer<typeof policyRuleValidUntilCeilingSchema>;
