import { describe, expect, it } from 'vitest';
import { policyRuleSchema } from '../src/index.ts';

const sha256 = 'sha256:0000000000000000000000000000000000000000000000000000000000000000';

const baseProvenance = {
  authority: 'system_config_live_policy',
  source_policy_path: 'policies/host-capability-substrate/tiers.yaml',
  source_policy_sha256: sha256,
  source_policy_sha256_basis: 'live_policy_blob',
  observed_at: '2026-05-29T00:00:00Z',
} as const;

// write-project / worktree_mutation rule (approval required) — mirrors the live policy.
const baseWorktreeRule = {
  schema_version: '0.1.0',
  policy_rule_id: 'policy-rule:hcs:worktree-mutation',
  operation_class: 'worktree_mutation',
  tier: 'write-project',
  classification_basis: 'typed_operation_class',
  requires_active_lease: true,
  requires_deletion_authority: false,
  requires_typed_provider_evidence: false,
  approval: {
    approval_required: true,
    approval_path_allowed: true,
    required_grant_kind: 'worktree_clean_acknowledgment',
    allowed_grant_kinds: ['worktree_clean_acknowledgment'],
    producer_allowlist: ['mint_api', 'kernel_broker'],
    dashboard_visibility: 'required_before_grant_consumption',
    single_use: true,
    evidence_bound_scope:
      'repository_id_workspace_context_id_worktree_path_and_acknowledged_dirty_state_evidence_ref',
  },
  valid_until_ceiling: 'PT24H',
  valid_until_ceiling_source_ref:
    'hcs:docs/host-capability-substrate/adr/0031-q-008-d-worktree-ownership-composition.md',
  source_provenance: baseProvenance,
} as const;

// read-safe / read_only_diagnostic rule (no approval).
const baseReadSafeRule = {
  schema_version: '0.1.0',
  policy_rule_id: 'policy-rule:hcs:read-only-diagnostic',
  operation_class: 'read_only_diagnostic',
  tier: 'read-safe',
  classification_basis: 'typed_operation_class',
  requires_active_lease: false,
  requires_deletion_authority: false,
  requires_typed_provider_evidence: false,
  approval: { approval_required: false, approval_path_allowed: false },
  valid_until_ceiling: 'not_applicable',
  valid_until_ceiling_source_ref: 'not_applicable',
  source_provenance: baseProvenance,
} as const;

// forbidden rule — non-escalable; the only valid forbidden shape.
const baseForbiddenRule = {
  ...baseReadSafeRule,
  policy_rule_id: 'policy-rule:hcs:forbidden-class',
  tier: 'forbidden',
} as const;

describe('PolicyRule schema (ADR 0060 / D-057)', () => {
  it('validates a write-project / worktree_mutation rule with approval required', () => {
    const rule = policyRuleSchema.parse(baseWorktreeRule);
    expect(rule.tier).toBe('write-project');
    expect(rule.approval.approval_required).toBe(true);
  });

  it('validates a read-safe rule with no approval', () => {
    const rule = policyRuleSchema.parse(baseReadSafeRule);
    expect(rule.tier).toBe('read-safe');
    expect(rule.approval.approval_required).toBe(false);
  });

  it('validates the only valid forbidden shape (approval_required:false, approval_path_allowed:false)', () => {
    const rule = policyRuleSchema.parse(baseForbiddenRule);
    expect(rule.tier).toBe('forbidden');
  });

  it('validates a destructive_git rule with a two-value allowed_grant_kinds superset', () => {
    const rule = policyRuleSchema.parse({
      ...baseWorktreeRule,
      operation_class: 'destructive_git',
      tier: 'write-destructive',
      requires_active_lease: false,
      requires_deletion_authority: true,
      approval: {
        approval_required: true,
        approval_path_allowed: true,
        required_grant_kind: 'gate_evidence_acknowledgment',
        allowed_grant_kinds: ['gate_evidence_acknowledgment', 'pr_absence_acknowledgment'],
        producer_allowlist: ['mint_api', 'kernel_broker'],
        dashboard_visibility: 'required_before_grant_consumption',
        single_use: true,
        evidence_bound_scope:
          'source_ref_target_ref_commit_sha_deletion_authority_and_required_gate_evidence',
      },
      valid_until_ceiling: 'PT1H',
    });
    expect(rule.tier).toBe('write-destructive');
  });

  it('validates an external_control_plane_mutation rule with requires_typed_provider_evidence true (inv. 16 case)', () => {
    const rule = policyRuleSchema.parse({
      ...baseWorktreeRule,
      operation_class: 'external_control_plane_mutation',
      tier: 'write-destructive',
      requires_active_lease: false,
      requires_deletion_authority: false,
      requires_typed_provider_evidence: true,
      approval: {
        approval_required: true,
        approval_path_allowed: true,
        required_grant_kind: 'gate_evidence_acknowledgment',
        allowed_grant_kinds: ['gate_evidence_acknowledgment'],
        producer_allowlist: ['mint_api', 'kernel_broker'],
        dashboard_visibility: 'required_before_grant_consumption',
        single_use: true,
        evidence_bound_scope:
          'provider_target_minimal_request_plan_fanout_quota_secret_refs_typed_receipts_and_required_gate_evidence',
      },
      valid_until_ceiling: 'PT1H',
    });
    expect(rule.operation_class).toBe('external_control_plane_mutation');
    expect(rule.requires_typed_provider_evidence).toBe(true);
  });

  it('rejects a mixed producer_allowlist containing kernel_gateway', () => {
    expect(
      policyRuleSchema.safeParse({
        ...baseWorktreeRule,
        approval: {
          ...baseWorktreeRule.approval,
          producer_allowlist: ['mint_api', 'kernel_gateway'],
        },
      }).success,
    ).toBe(false);
  });

  it('permits valid_until_ceiling not_applicable regardless of tier (no ceiling↔tier binding in the schema)', () => {
    const rule = policyRuleSchema.parse({
      ...baseWorktreeRule,
      valid_until_ceiling: 'not_applicable',
    });
    expect(rule.valid_until_ceiling).toBe('not_applicable');
  });

  // --- charter inv. 6: forbidden non-escalability (the core structural guarantee) ---

  it('rejects a forbidden rule that requires approval (inv. 6)', () => {
    expect(
      policyRuleSchema.safeParse({
        ...baseForbiddenRule,
        approval: {
          approval_required: true,
          approval_path_allowed: true,
          required_grant_kind: 'gate_evidence_acknowledgment',
          allowed_grant_kinds: ['gate_evidence_acknowledgment'],
          producer_allowlist: ['mint_api'],
          dashboard_visibility: 'not_required',
          single_use: true,
          evidence_bound_scope: 'x',
        },
      }).success,
    ).toBe(false);
  });

  it('rejects a forbidden rule with a latent approval path (approval_required:false, approval_path_allowed:true) (inv. 6)', () => {
    expect(
      policyRuleSchema.safeParse({
        ...baseForbiddenRule,
        approval: { approval_required: false, approval_path_allowed: true },
      }).success,
    ).toBe(false);
  });

  // --- approval-shape structural invariants ---

  it('rejects producer_allowlist containing kernel_gateway (gateway does not mint grants)', () => {
    expect(
      policyRuleSchema.safeParse({
        ...baseWorktreeRule,
        approval: { ...baseWorktreeRule.approval, producer_allowlist: ['kernel_gateway'] },
      }).success,
    ).toBe(false);
  });

  it('rejects an empty producer_allowlist on an approvable rule (.min(1))', () => {
    expect(
      policyRuleSchema.safeParse({
        ...baseWorktreeRule,
        approval: { ...baseWorktreeRule.approval, producer_allowlist: [] },
      }).success,
    ).toBe(false);
  });

  it('rejects required_grant_kind not in allowed_grant_kinds (membership refinement)', () => {
    expect(
      policyRuleSchema.safeParse({
        ...baseWorktreeRule,
        approval: {
          ...baseWorktreeRule.approval,
          required_grant_kind: 'gate_evidence_acknowledgment',
          allowed_grant_kinds: ['worktree_clean_acknowledgment'],
        },
      }).success,
    ).toBe(false);
  });

  it('rejects grant detail on the approval_required:false branch (.strict() union member)', () => {
    expect(
      policyRuleSchema.safeParse({
        ...baseReadSafeRule,
        approval: { approval_required: false, approval_path_allowed: false, single_use: true },
      }).success,
    ).toBe(false);
  });

  // --- envelope / primitive invariants ---

  it('rejects a non-literal schema_version', () => {
    expect(
      policyRuleSchema.safeParse({ ...baseReadSafeRule, schema_version: '0.2.0' }).success,
    ).toBe(false);
  });

  it('rejects an unknown tier (write-host is a registry-canonical reservation, not in the enum)', () => {
    expect(policyRuleSchema.safeParse({ ...baseReadSafeRule, tier: 'write-host' }).success).toBe(
      false,
    );
  });

  it('rejects a classification_basis other than typed_operation_class', () => {
    expect(
      policyRuleSchema.safeParse({ ...baseReadSafeRule, classification_basis: 'shell_regex' })
        .success,
    ).toBe(false);
  });

  it('rejects an invalid valid_until_ceiling duration (bare PT)', () => {
    expect(
      policyRuleSchema.safeParse({ ...baseReadSafeRule, valid_until_ceiling: 'PT' }).success,
    ).toBe(false);
    expect(
      policyRuleSchema.safeParse({ ...baseReadSafeRule, valid_until_ceiling: '24h' }).success,
    ).toBe(false);
  });

  it('rejects an absolute or traversal source_policy_path', () => {
    expect(
      policyRuleSchema.safeParse({
        ...baseReadSafeRule,
        source_provenance: { ...baseProvenance, source_policy_path: '/etc/passwd' },
      }).success,
    ).toBe(false);
    expect(
      policyRuleSchema.safeParse({
        ...baseReadSafeRule,
        source_provenance: { ...baseProvenance, source_policy_path: 'policies/../secrets.yaml' },
      }).success,
    ).toBe(false);
  });

  it('rejects a secret-shaped evidence_bound_scope (op:// / path shapes)', () => {
    expect(
      policyRuleSchema.safeParse({
        ...baseWorktreeRule,
        approval: { ...baseWorktreeRule.approval, evidence_bound_scope: 'op://Dev/x/credential' },
      }).success,
    ).toBe(false);
  });

  it('rejects a wrong source_policy_sha256_basis literal', () => {
    expect(
      policyRuleSchema.safeParse({
        ...baseReadSafeRule,
        source_provenance: { ...baseProvenance, source_policy_sha256_basis: 'candidate_skeleton' },
      }).success,
    ).toBe(false);
  });

  it('rejects unknown envelope fields via .strict()', () => {
    expect(
      policyRuleSchema.safeParse({ ...baseReadSafeRule, audit_chain_link_hash: sha256 }).success,
    ).toBe(false);
  });
});
