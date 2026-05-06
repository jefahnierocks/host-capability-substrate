import { z } from 'zod';
import {
  entityIdSchema,
  evidenceAuthoritySchema,
  evidenceConfidenceSchema,
  evidenceRefSchema,
  isoDateTimeSchema,
} from '../common.ts';
import { mcpServerKindSchema } from './boundary-observation.ts';
import { evidenceRedactionModeSchema, evidenceSchemaVersionSchema } from './evidence.ts';

const canonicalSourceControlPathPattern =
  /^(?:\$\{(?:HOME|USERS_SHARED|TMPDIR|WORKSPACE|XDG_CACHE_HOME|XDG_DATA_HOME|XDG_CONFIG_HOME)\}\/.+|~\/.+|\/workspace\/.+|\/workspaces\/.+|\/repo\/.+|\/private\/tmp\/.+|\/tmp\/.+|\/opt\/.+)$/;

const canonicalGitRemoteUrlPattern =
  /^(?:[A-Za-z0-9._-]+@[A-Za-z0-9._-]+:[A-Za-z0-9._~/-]+(?:\.git)?|ssh:\/\/[A-Za-z0-9._-]+@[A-Za-z0-9._-]+\/[A-Za-z0-9._~/-]+(?:\.git)?|https?:\/\/[A-Za-z0-9._-]+\/[A-Za-z0-9._~/-]+(?:\.git)?|git:\/\/[A-Za-z0-9._-]+\/[A-Za-z0-9._~/-]+(?:\.git)?)$/;

const evidenceSubtypeBaseFields = {
  schema_version: evidenceSchemaVersionSchema,
  evidence_id: entityIdSchema,
  source: z.string().min(1),
  observed_at: isoDateTimeSchema,
  valid_until: isoDateTimeSchema.nullable(),
  confidence: evidenceConfidenceSchema,
  parser_version: z.string().min(1),
  producer: z.string().min(1).optional(),
  host_id: entityIdSchema.optional(),
  workspace_id: entityIdSchema.optional(),
  execution_context_id: entityIdSchema.optional(),
  session_id: entityIdSchema.optional(),
  run_id: entityIdSchema.optional(),
  redaction_mode: evidenceRedactionModeSchema.optional(),
} as const;

const sourceControlSubjectRefSchema = (subjectKind: string, description: string) =>
  z
    .object({
      subject_kind: z.literal(subjectKind),
      subject_id: z.string().min(1),
      relation: z.string().min(1).optional(),
    })
    .strict()
    .describe(description);

const withEvidenceAuthorityVariants = <T extends z.core.$ZodLooseShape>(
  baseSchema: z.ZodObject<T>,
) => {
  const nonSandboxSchema = baseSchema
    .extend({
      authority: evidenceAuthoritySchema.exclude(['sandbox-observation']),
      source_ref: z.string().min(1).optional(),
    })
    .strict();

  const sandboxBaseSchema = baseSchema.extend({
    authority: z.literal('sandbox-observation'),
    execution_context_id: entityIdSchema,
  });

  return z.union([
    sandboxBaseSchema
      .extend({
        source_ref: z.string().min(1),
      })
      .strict(),
    sandboxBaseSchema
      .extend({
        source_ref: z.string().min(1).optional(),
        session_id: entityIdSchema,
      })
      .strict(),
    sandboxBaseSchema
      .extend({
        source_ref: z.string().min(1).optional(),
        run_id: entityIdSchema,
      })
      .strict(),
    nonSandboxSchema,
  ]);
};

export const sourceControlCanonicalPathSchema = z
  .string()
  .min(1)
  .regex(canonicalSourceControlPathPattern)
  .describe(
    'Canonical source-control path using a placeholder root or accepted non-user system root.',
  );

export const gitCommitShaSchema = z
  .string()
  .regex(/^[a-f0-9]{40}$/)
  .describe('Lowercase full Git commit SHA.');

export const gitBranchRefSchema = z
  .string()
  .regex(/^refs\/heads\/[^~^:?*[\]\\]+$/)
  .describe('Canonical Git branch ref in refs/heads/<name> form.');

export const gitRefNameSchema = z
  .string()
  .min(1)
  .regex(/^(?:refs\/(?:heads|remotes|tags|notes|replace|bisect)\/[^~^:?*[\]\\]+|refs\/stash)$/)
  .describe('Canonical Git ref name in an accepted refs/ namespace.');

export const gitRemoteNameSchema = z
  .string()
  .min(1)
  .regex(/^[A-Za-z0-9._-]+$/)
  .describe('Git remote name.');

export const gitRemoteUrlSchema = z
  .string()
  .min(1)
  .regex(canonicalGitRemoteUrlPattern)
  .describe('Canonical Git remote URL with credentials stripped.');

export const githubMutationAuthorityKindSchema = z
  .enum(['human_pat', 'github_app', 'oidc', 'actions_token', 'unknown'])
  .describe('ADR 0033 GitHub mutation authority discriminator.');

export const githubMutationAuthoritySchema = z
  .discriminatedUnion('authority_kind', [
    z
      .object({
        authority_kind: z.literal('human_pat'),
        pat_keyring_account: z.string().min(1),
      })
      .strict(),
    z
      .object({
        authority_kind: z.literal('github_app'),
        github_app_id: z.string().min(1),
      })
      .strict(),
    z
      .object({
        authority_kind: z.literal('oidc'),
        oidc_issuer: z.string().min(1),
      })
      .strict(),
    z
      .object({
        authority_kind: z.literal('actions_token'),
        actions_workflow_path: z.string().min(1),
      })
      .strict(),
    z
      .object({
        authority_kind: z.literal('unknown'),
      })
      .strict(),
  ])
  .describe('ADR 0033 inline GitHubMutationAuthority value type.');

const gitRepositorySubjectRefSchema = sourceControlSubjectRefSchema(
  'git_repository',
  'Subject reference for a GitRepositoryObservation Evidence subtype.',
);

export const gitRepositoryPayloadSchema = z
  .object({
    repository_id: entityIdSchema,
    git_dir_path: sourceControlCanonicalPathSchema,
    work_tree_path: sourceControlCanonicalPathSchema.optional(),
    default_branch: z.string().min(1).optional(),
    remote_observation_evidence_refs: z.array(evidenceRefSchema).default([]),
    detected_at: isoDateTimeSchema,
  })
  .strict()
  .describe('ADR 0027 GitRepositoryObservation typed Evidence payload.');

const gitRepositoryObservationBaseSchema = z.object({
  ...evidenceSubtypeBaseFields,
  evidence_kind: z.literal('observation'),
  subject_refs: z.array(gitRepositorySubjectRefSchema).min(1),
  payload_schema_version: z.literal('git_repository_observation:v1'),
  payload: gitRepositoryPayloadSchema,
});

export const gitRepositoryObservationSchema = withEvidenceAuthorityVariants(
  gitRepositoryObservationBaseSchema,
)
  .refine(
    (value) => value.subject_refs.some((ref) => ref.subject_id === value.payload.repository_id),
    {
      message: 'GitRepositoryObservation subject_refs must include payload.repository_id.',
      path: ['subject_refs'],
    },
  )
  .describe('ADR 0027 GitRepositoryObservation direct Evidence subtype.');

const gitRemoteSubjectRefSchema = sourceControlSubjectRefSchema(
  'git_ref',
  'Subject reference for a GitRemoteObservation Evidence subtype.',
);

export const gitRemoteRefKindSchema = z
  .enum(['branch', 'tag', 'note', 'replace', 'stash', 'bisect', 'remote_tracking', 'unknown'])
  .describe('ADR 0027 Git ref kind discriminator.');

export const gitRemoteLastFetchOutcomeSchema = z
  .enum(['ok', 'network_error', 'auth_error', 'rejected'])
  .describe('ADR 0027 last fetch outcome discriminator.');

export const gitRemoteRefStateSchema = z
  .enum(['present', 'gone', 'ambiguous', 'unknown'])
  .describe('ADR 0027 remote ref state discriminator.');

export const gitRemotePayloadSchema = z
  .object({
    repository_id: entityIdSchema,
    remote_name: gitRemoteNameSchema,
    remote_url: gitRemoteUrlSchema,
    ref_kind: gitRemoteRefKindSchema,
    ref_name: gitRefNameSchema,
    observed_commit_sha: gitCommitShaSchema.nullable(),
    last_fetch_at: isoDateTimeSchema,
    last_fetch_outcome: gitRemoteLastFetchOutcomeSchema,
    ref_state: gitRemoteRefStateSchema,
  })
  .strict()
  .refine(
    (value) =>
      (value.ref_state === 'present' && value.observed_commit_sha !== null) ||
      (value.ref_state !== 'present' && value.observed_commit_sha === null),
    {
      message:
        'GitRemoteObservation observed_commit_sha is required only when ref_state is present.',
      path: ['observed_commit_sha'],
    },
  )
  .describe('ADR 0027 GitRemoteObservation typed Evidence payload.');

const gitRemoteObservationBaseSchema = z.object({
  ...evidenceSubtypeBaseFields,
  evidence_kind: z.literal('observation'),
  subject_refs: z.array(gitRemoteSubjectRefSchema).min(1),
  payload_schema_version: z.literal('git_remote_observation:v1'),
  payload: gitRemotePayloadSchema,
});

export const gitRemoteObservationSchema = withEvidenceAuthorityVariants(
  gitRemoteObservationBaseSchema,
).describe('ADR 0027 GitRemoteObservation direct Evidence subtype.');

const gitWorktreeSubjectRefSchema = sourceControlSubjectRefSchema(
  'git_worktree',
  'Subject reference for a GitWorktreeObservation Evidence subtype.',
);

export const gitWorktreeKindSchema = z
  .enum(['primary', 'linked'])
  .describe('ADR 0030 Git worktree kind discriminator.');

export const gitWorktreeLockStateSchema = z
  .enum(['unlocked', 'locked', 'held_by_other_session'])
  .describe('ADR 0030 Git worktree lock state discriminator.');

export const gitWorktreePayloadSchema = z
  .object({
    repository_id: entityIdSchema,
    worktree_path: sourceControlCanonicalPathSchema,
    worktree_kind: gitWorktreeKindSchema,
    attached_branch_ref: gitBranchRefSchema.nullable(),
    head_commit_sha: gitCommitShaSchema,
    lock_state: gitWorktreeLockStateSchema,
    lease_id: entityIdSchema.nullable().optional(),
    owning_session_id: entityIdSchema.nullable().optional(),
    last_lease_check_at: isoDateTimeSchema.nullable().optional(),
  })
  .strict()
  .describe('ADR 0030 GitWorktreeObservation typed Evidence payload.');

const gitWorktreeObservationBaseSchema = z.object({
  ...evidenceSubtypeBaseFields,
  evidence_kind: z.literal('observation'),
  subject_refs: z.array(gitWorktreeSubjectRefSchema).min(1),
  payload_schema_version: z.literal('git_worktree_observation:v1'),
  payload: gitWorktreePayloadSchema,
});

export const gitWorktreeObservationSchema = withEvidenceAuthorityVariants(
  gitWorktreeObservationBaseSchema,
).describe('ADR 0030 GitWorktreeObservation direct Evidence subtype.');

const gitWorktreeInventorySubjectRefSchema = sourceControlSubjectRefSchema(
  'git_worktree_inventory',
  'Subject reference for a GitWorktreeInventoryObservation Evidence subtype.',
);

export const gitWorktreeInventoryCompletenessKindSchema = z
  .enum(['complete', 'partial_with_reason'])
  .describe('ADR 0030 worktree inventory completeness discriminator.');

const gitWorktreeInventoryPayloadBaseSchema = z.object({
  repository_id: entityIdSchema,
  branch_ref: gitBranchRefSchema,
  worktree_observations: z.array(evidenceRefSchema),
  observed_via: z.literal('git_worktree_list'),
});

export const gitWorktreeInventoryPayloadSchema = z
  .discriminatedUnion('inventory_completeness_kind', [
    gitWorktreeInventoryPayloadBaseSchema
      .extend({
        inventory_completeness_kind: z.literal('complete'),
      })
      .strict(),
    gitWorktreeInventoryPayloadBaseSchema
      .extend({
        inventory_completeness_kind: z.literal('partial_with_reason'),
        partial_reason: z.string().min(1),
      })
      .strict(),
  ])
  .describe('ADR 0030 GitWorktreeInventoryObservation typed Evidence payload.');

const gitWorktreeInventoryObservationBaseSchema = z.object({
  ...evidenceSubtypeBaseFields,
  evidence_kind: z.literal('observation'),
  subject_refs: z.array(gitWorktreeInventorySubjectRefSchema).min(1),
  payload_schema_version: z.literal('git_worktree_inventory_observation:v1'),
  payload: gitWorktreeInventoryPayloadSchema,
});

export const gitWorktreeInventoryObservationSchema = withEvidenceAuthorityVariants(
  gitWorktreeInventoryObservationBaseSchema,
).describe('ADR 0030 GitWorktreeInventoryObservation direct Evidence subtype.');

const gitBranchAncestrySubjectRefSchema = sourceControlSubjectRefSchema(
  'git_branch_ancestry',
  'Subject reference for a GitBranchAncestryObservation Evidence subtype.',
);

export const gitBranchAncestryKindSchema = z
  .enum(['ancestry', 'patch_equivalence', 'vacuous'])
  .describe('ADR 0030 branch ancestry discriminator.');

export const gitBranchAncestryEvidenceSchema = z
  .object({
    merge_base_sha: gitCommitShaSchema,
    linear_chain_commit_shas: z.array(gitCommitShaSchema).min(1),
  })
  .strict()
  .describe('Positive ancestry proof payload.');

export const gitPatchEquivalenceEvidenceSchema = z
  .object({
    merge_base_sha: gitCommitShaSchema,
    equivalent_commit_shas: z.array(gitCommitShaSchema).min(1),
    patch_id: z.string().min(1).optional(),
  })
  .strict()
  .describe('Patch-equivalence proof payload.');

export const gitEmptyBranchEvidenceSchema = z
  .object({
    merge_base_sha: gitCommitShaSchema,
    candidate_commit_count: z.literal(0),
  })
  .strict()
  .describe('Positive empty-branch proof payload.');

const gitBranchAncestryPayloadBaseSchema = z.object({
  repository_id: entityIdSchema,
  candidate_ref: gitRefNameSchema,
  base_ref: gitRefNameSchema,
  candidate_head_sha: gitCommitShaSchema,
  base_head_sha: gitCommitShaSchema,
});

export const gitBranchAncestryPayloadSchema = z
  .discriminatedUnion('ancestry_kind', [
    gitBranchAncestryPayloadBaseSchema
      .extend({
        ancestry_kind: z.literal('ancestry'),
        ancestry_evidence: gitBranchAncestryEvidenceSchema,
      })
      .strict(),
    gitBranchAncestryPayloadBaseSchema
      .extend({
        ancestry_kind: z.literal('patch_equivalence'),
        patch_equivalence_evidence: gitPatchEquivalenceEvidenceSchema,
      })
      .strict(),
    gitBranchAncestryPayloadBaseSchema
      .extend({
        ancestry_kind: z.literal('vacuous'),
        empty_branch_evidence: gitEmptyBranchEvidenceSchema,
      })
      .strict(),
  ])
  .describe('ADR 0030 GitBranchAncestryObservation typed Evidence payload.');

const gitBranchAncestryObservationBaseSchema = z.object({
  ...evidenceSubtypeBaseFields,
  evidence_kind: z.enum(['observation', 'derived']),
  subject_refs: z.array(gitBranchAncestrySubjectRefSchema).min(1),
  payload_schema_version: z.literal('git_branch_ancestry_observation:v1'),
  payload: gitBranchAncestryPayloadSchema,
});

export const gitBranchAncestryObservationSchema = withEvidenceAuthorityVariants(
  gitBranchAncestryObservationBaseSchema,
).describe('ADR 0030 GitBranchAncestryObservation direct Evidence subtype.');

const gitDirtyStateSubjectRefSchema = sourceControlSubjectRefSchema(
  'git_dirty_state',
  'Subject reference for a GitDirtyStateObservation Evidence subtype.',
);

export const gitDirtyStateKindSchema = z
  .enum(['clean', 'dirty_uncommitted', 'dirty_with_untracked', 'dirty_with_ignored_only'])
  .describe('ADR 0030 Git dirty-state discriminator.');

const gitDirtyStatePayloadBaseSchema = z.object({
  repository_id: entityIdSchema,
  worktree_path: sourceControlCanonicalPathSchema,
  observed_via: z.literal('git_status_porcelain'),
});

export const gitDirtyStatePayloadSchema = z
  .discriminatedUnion('dirty_state_kind', [
    gitDirtyStatePayloadBaseSchema
      .extend({
        dirty_state_kind: z.literal('clean'),
        uncommitted_path_count: z.literal(0),
        untracked_path_count: z.literal(0),
        ignored_path_count: z.number().int().min(0),
      })
      .strict(),
    gitDirtyStatePayloadBaseSchema
      .extend({
        dirty_state_kind: z.literal('dirty_uncommitted'),
        uncommitted_path_count: z.number().int().min(1),
        untracked_path_count: z.number().int().min(0),
        ignored_path_count: z.number().int().min(0),
      })
      .strict(),
    gitDirtyStatePayloadBaseSchema
      .extend({
        dirty_state_kind: z.literal('dirty_with_untracked'),
        uncommitted_path_count: z.literal(0),
        untracked_path_count: z.number().int().min(1),
        ignored_path_count: z.number().int().min(0),
      })
      .strict(),
    gitDirtyStatePayloadBaseSchema
      .extend({
        dirty_state_kind: z.literal('dirty_with_ignored_only'),
        uncommitted_path_count: z.literal(0),
        untracked_path_count: z.literal(0),
        ignored_path_count: z.number().int().min(1),
      })
      .strict(),
  ])
  .describe('ADR 0030 GitDirtyStateObservation typed Evidence payload.');

const gitDirtyStateObservationBaseSchema = z.object({
  ...evidenceSubtypeBaseFields,
  evidence_kind: z.literal('observation'),
  subject_refs: z.array(gitDirtyStateSubjectRefSchema).min(1),
  payload_schema_version: z.literal('git_dirty_state_observation:v1'),
  payload: gitDirtyStatePayloadSchema,
});

export const gitDirtyStateObservationSchema = withEvidenceAuthorityVariants(
  gitDirtyStateObservationBaseSchema,
).describe('ADR 0030 GitDirtyStateObservation direct Evidence subtype.');

export const pullRequestProviderKindSchema = z
  .literal('github')
  .describe('ADR 0030 PR provider discriminator.');

export const pullRequestProviderObservedViaSchema = z
  .enum(['github_api_v3', 'github_api_v4', 'gh_cli', 'github_mcp'])
  .describe('ADR 0030 PR provider observation method.');

const pullRequestSubjectRefSchema = sourceControlSubjectRefSchema(
  'pull_request',
  'Subject reference for a PullRequestReceipt Evidence subtype.',
);

export const pullRequestStateKindSchema = z
  .enum(['open', 'merged', 'closed_unmerged'])
  .describe('ADR 0030 PR state discriminator. Positive absence is a separate receipt.');

export const closedUnmergedReasonKindSchema = z
  .enum(['abandoned', 'superseded', 'manual_close', 'unknown'])
  .describe('ADR 0030 closed-unmerged PR reason discriminator.');

const pullRequestPayloadBaseSchema = z.object({
  repository_id: entityIdSchema,
  provider_kind: pullRequestProviderKindSchema,
  pr_number: z.number().int().positive(),
  head_sha: gitCommitShaSchema,
  base_ref: gitBranchRefSchema,
  provider_observed_via: pullRequestProviderObservedViaSchema,
});

export const pullRequestPayloadSchema = z
  .discriminatedUnion('pr_state_kind', [
    pullRequestPayloadBaseSchema
      .extend({
        pr_state_kind: z.literal('open'),
      })
      .strict(),
    pullRequestPayloadBaseSchema
      .extend({
        pr_state_kind: z.literal('merged'),
        merge_commit_sha: gitCommitShaSchema,
      })
      .strict(),
    pullRequestPayloadBaseSchema
      .extend({
        pr_state_kind: z.literal('closed_unmerged'),
        closed_unmerged_reason_kind: closedUnmergedReasonKindSchema,
      })
      .strict(),
  ])
  .describe('ADR 0030 PullRequestReceipt typed Evidence payload.');

const pullRequestReceiptBaseSchema = z.object({
  ...evidenceSubtypeBaseFields,
  evidence_kind: z.literal('receipt'),
  subject_refs: z.array(pullRequestSubjectRefSchema).min(1),
  payload_schema_version: z.literal('pull_request_receipt:v1'),
  payload: pullRequestPayloadSchema,
});

export const pullRequestReceiptSchema = withEvidenceAuthorityVariants(
  pullRequestReceiptBaseSchema,
).describe('ADR 0030 PullRequestReceipt direct Evidence subtype.');

const pullRequestAbsenceSubjectRefSchema = sourceControlSubjectRefSchema(
  'pull_request_absence',
  'Subject reference for a PullRequestAbsenceReceipt Evidence subtype.',
);

export const pullRequestAbsenceQueryObservedViaSchema = z
  .enum([
    'github_api_v3_pr_search',
    'github_api_v4_pull_requests',
    'gh_pr_list',
    'github_mcp_pr_search',
  ])
  .describe('ADR 0030 PR absence query observation method.');

export const pullRequestAbsencePayloadSchema = z
  .object({
    repository_id: entityIdSchema,
    provider_kind: pullRequestProviderKindSchema,
    head_ref: gitBranchRefSchema,
    base_ref: gitBranchRefSchema,
    absence_observed_at: isoDateTimeSchema,
    query_observed_via: pullRequestAbsenceQueryObservedViaSchema,
  })
  .strict()
  .describe('ADR 0030 PullRequestAbsenceReceipt typed Evidence payload.');

const pullRequestAbsenceReceiptBaseSchema = z.object({
  ...evidenceSubtypeBaseFields,
  evidence_kind: z.literal('receipt'),
  subject_refs: z.array(pullRequestAbsenceSubjectRefSchema).min(1),
  payload_schema_version: z.literal('pull_request_absence_receipt:v1'),
  payload: pullRequestAbsencePayloadSchema,
});

export const pullRequestAbsenceReceiptSchema = withEvidenceAuthorityVariants(
  pullRequestAbsenceReceiptBaseSchema,
).describe('ADR 0030 PullRequestAbsenceReceipt direct Evidence subtype.');

const rulesetSubjectRefSchema = sourceControlSubjectRefSchema(
  'ruleset',
  'Subject reference for a RulesetObservation Evidence subtype.',
);

export const rulesetKindSchema = z
  .enum(['branch', 'tag', 'push'])
  .describe('ADR 0033 GitHub ruleset kind discriminator.');

export const rulesetEnforcementKindSchema = z
  .enum(['active', 'evaluate', 'disabled'])
  .describe('ADR 0033 GitHub ruleset enforcement discriminator.');

export const rulesetRuleSummarySchema = z
  .object({
    require_signed: z.boolean().optional(),
    require_linear_history: z.boolean().optional(),
    restrict_pushes: z.boolean().optional(),
    restrict_deletions: z.boolean().optional(),
    required_review_count: z.number().int().min(0).optional(),
    dismiss_stale_reviews: z.boolean().optional(),
    codeowners_required: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'RulesetObservation rule_summary must name at least one observed rule axis.',
  })
  .describe('Structured summary of GitHub ruleset axes observed by ADR 0033.');

export const rulesetProviderObservedViaSchema = z
  .enum(['github_api_v3_rulesets', 'github_api_v4_rulesets', 'gh_cli', 'github_mcp'])
  .describe('ADR 0033 ruleset provider observation method.');

export const rulesetPayloadSchema = z
  .object({
    repository_id: entityIdSchema,
    ruleset_id: z.string().min(1),
    ruleset_kind: rulesetKindSchema,
    target_pattern: z.string().min(1),
    enforcement_kind: rulesetEnforcementKindSchema,
    rule_summary: rulesetRuleSummarySchema,
    bypass_actor_count: z.number().int().min(0),
    provider_observed_via: rulesetProviderObservedViaSchema,
  })
  .strict()
  .describe('ADR 0033 RulesetObservation typed Evidence payload.');

const rulesetObservationBaseSchema = z.object({
  ...evidenceSubtypeBaseFields,
  evidence_kind: z.literal('observation'),
  subject_refs: z.array(rulesetSubjectRefSchema).min(1),
  payload_schema_version: z.literal('ruleset_observation:v1'),
  payload: rulesetPayloadSchema,
});

export const rulesetObservationSchema = withEvidenceAuthorityVariants(
  rulesetObservationBaseSchema,
).describe('ADR 0033 RulesetObservation direct Evidence subtype.');

const repositoryIdentitySubjectRefSchema = sourceControlSubjectRefSchema(
  'repository_identity_reconciliation',
  'Subject reference for a RepositoryIdentityReconciliationObservation Evidence subtype.',
);

export const repositoryIdentityReconciliationVerdictKindSchema = z
  .enum(['all_planes_consistent', 'plane_disagreement'])
  .describe('ADR 0033 repository identity reconciliation verdict discriminator.');

export const repositoryIdentityPlaneDisagreementKindSchema = z
  .enum([
    'local_path_mismatch',
    'remote_url_mismatch',
    'ssh_alias_missing',
    'ssh_alias_mismatch',
    'signing_principal_unmapped',
    'signing_principal_mismatch',
    'credential_account_mismatch',
    'credential_account_unverified',
    'organization_mismatch',
  ])
  .describe('Closed set of repository identity plane disagreement classes.');

export const repositoryIdentityProviderObservedViaSchema = z
  .enum(['gh_auth_status', 'git_config_read', 'ssh_config_resolution', 'mcp_introspection'])
  .describe('ADR 0033 repository identity provider observation method.');

const repositoryIdentityPayloadBaseSchema = z.object({
  repository_id: entityIdSchema,
  local_path_canonical: sourceControlCanonicalPathSchema,
  remote_url_canonical: gitRemoteUrlSchema,
  ssh_host_alias: z.string().min(1).nullable(),
  signing_principal_evidence_ref: evidenceRefSchema,
  credential_account_identity: z.string().min(1),
  provider_observed_via: repositoryIdentityProviderObservedViaSchema,
});

export const repositoryIdentityReconciliationObservationPayloadSchema = z
  .discriminatedUnion('reconciliation_verdict_kind', [
    repositoryIdentityPayloadBaseSchema
      .extend({
        reconciliation_verdict_kind: z.literal('all_planes_consistent'),
      })
      .strict(),
    repositoryIdentityPayloadBaseSchema
      .extend({
        reconciliation_verdict_kind: z.literal('plane_disagreement'),
        plane_disagreements: z.array(repositoryIdentityPlaneDisagreementKindSchema).min(1),
      })
      .strict(),
  ])
  .describe('ADR 0033 RepositoryIdentityReconciliationObservation typed Evidence payload.');

const repositoryIdentityReconciliationObservationBaseSchema = z.object({
  ...evidenceSubtypeBaseFields,
  evidence_kind: z.literal('observation'),
  subject_refs: z.array(repositoryIdentitySubjectRefSchema).min(1),
  payload_schema_version: z.literal('repository_identity_reconciliation:v1'),
  payload: repositoryIdentityReconciliationObservationPayloadSchema,
});

export const repositoryIdentityReconciliationObservationSchema = withEvidenceAuthorityVariants(
  repositoryIdentityReconciliationObservationBaseSchema,
).describe('ADR 0033 RepositoryIdentityReconciliationObservation direct Evidence subtype.');

const mcpCredentialAudienceSubjectRefSchema = sourceControlSubjectRefSchema(
  'mcp_credential_audience',
  'Subject reference for a MCPCredentialAudienceObservation Evidence subtype.',
);

export const mcpCredentialAudienceKindSchema = z
  .enum(['read_only', 'mutation', 'unscoped'])
  .describe('ADR 0033 MCP credential audience discriminator.');

export const mcpCredentialScopeTokenSchema = z
  .enum([
    'metadata:read',
    'contents:read',
    'contents:write',
    'pull_requests:read',
    'pull_requests:write',
    'actions:read',
    'actions:write',
    'checks:read',
    'checks:write',
    'administration:read',
    'administration:write',
    'workflows:read',
    'workflows:write',
  ])
  .describe('Closed GitHub MCP credential scope token enum from ADR 0033.');

export const mcpCredentialReadScopeTokenSchema = z
  .enum([
    'metadata:read',
    'contents:read',
    'pull_requests:read',
    'actions:read',
    'checks:read',
    'administration:read',
    'workflows:read',
  ])
  .describe('Read-only GitHub MCP credential scope token enum from ADR 0033.');

export const mcpCredentialAudienceQueryObservedViaSchema = z
  .enum(['gh_token_list', 'github_api_permissions', 'mcp_introspection', 'unknown'])
  .describe('ADR 0033 MCP credential-audience query observation method.');

const mcpCredentialAudiencePayloadBaseSchema = z.object({
  mcp_server_kind: mcpServerKindSchema,
  credential_source_evidence_ref: evidenceRefSchema,
  provider_verified_at: isoDateTimeSchema,
  query_observed_via: mcpCredentialAudienceQueryObservedViaSchema,
});

export const mcpCredentialAudiencePayloadSchema = z
  .discriminatedUnion('credential_audience_kind', [
    mcpCredentialAudiencePayloadBaseSchema
      .extend({
        credential_audience_kind: z.literal('read_only'),
        credential_scope_tokens: z.array(mcpCredentialReadScopeTokenSchema).min(1),
      })
      .strict(),
    mcpCredentialAudiencePayloadBaseSchema
      .extend({
        credential_audience_kind: z.literal('mutation'),
        credential_scope_tokens: z.array(mcpCredentialScopeTokenSchema).min(1),
      })
      .strict(),
    mcpCredentialAudiencePayloadBaseSchema
      .extend({
        credential_audience_kind: z.literal('unscoped'),
        credential_scope_tokens: z.array(mcpCredentialScopeTokenSchema).default([]),
      })
      .strict(),
  ])
  .describe('ADR 0033 MCPCredentialAudienceObservation typed Evidence payload.');

const mcpCredentialAudienceObservationBaseSchema = z.object({
  ...evidenceSubtypeBaseFields,
  evidence_kind: z.literal('observation'),
  subject_refs: z.array(mcpCredentialAudienceSubjectRefSchema).min(1),
  payload_schema_version: z.literal('mcp_credential_audience_observation:v1'),
  payload: mcpCredentialAudiencePayloadSchema,
});

export const mcpCredentialAudienceObservationSchema = withEvidenceAuthorityVariants(
  mcpCredentialAudienceObservationBaseSchema,
).describe('ADR 0033 MCPCredentialAudienceObservation direct Evidence subtype.');

const statusCheckSourceSubjectRefSchema = sourceControlSubjectRefSchema(
  'status_check_source',
  'Subject reference for a StatusCheckSourceObservation Evidence subtype.',
);

export const statusCheckConclusionKindSchema = z
  .enum(['success', 'failure', 'skipped', 'cancelled', 'neutral', 'timed_out', 'action_required'])
  .describe('ADR 0033 GitHub Checks API conclusion discriminator.');

export const statusCheckSourceKindSchema = z
  .enum(['actions_workflow', 'github_app', 'third_party_service', 'native'])
  .describe('ADR 0033 status-check source discriminator.');

export const statusCheckProviderObservedViaSchema = z
  .enum(['github_api_v3_checks', 'github_api_v4_checkruns', 'gh_cli', 'github_mcp'])
  .describe('ADR 0033 status-check provider observation method.');

const statusCheckSourcePayloadBaseSchema = z.object({
  repository_id: entityIdSchema,
  commit_sha: gitCommitShaSchema,
  check_name: z.string().min(1),
  conclusion_kind: statusCheckConclusionKindSchema,
  concluded_at: isoDateTimeSchema,
  valid_until: isoDateTimeSchema,
  source_kind: statusCheckSourceKindSchema,
  provider_observed_via: statusCheckProviderObservedViaSchema,
  provider_verified_at: isoDateTimeSchema,
});

export const statusCheckSourcePayloadSchema = z
  .union([
    statusCheckSourcePayloadBaseSchema
      .extend({
        expected_github_app_id: z.string().min(1),
        expected_workflow_path: z.string().min(1).optional(),
      })
      .strict(),
    statusCheckSourcePayloadBaseSchema
      .extend({
        expected_github_app_id: z.string().min(1).optional(),
        expected_workflow_path: z.string().min(1),
      })
      .strict(),
  ])
  .refine(
    (value) =>
      Date.parse(value.valid_until) <= Date.parse(value.concluded_at) + 24 * 60 * 60 * 1000,
    {
      message: 'StatusCheckSourceObservation valid_until must be within 24 hours of concluded_at.',
      path: ['valid_until'],
    },
  )
  .describe('ADR 0033 StatusCheckSourceObservation typed Evidence payload.');

const statusCheckSourceObservationBaseSchema = z.object({
  ...evidenceSubtypeBaseFields,
  evidence_kind: z.literal('observation'),
  subject_refs: z.array(statusCheckSourceSubjectRefSchema).min(1),
  payload_schema_version: z.literal('status_check_source_observation:v1'),
  payload: statusCheckSourcePayloadSchema,
});

export const statusCheckSourceObservationSchema = withEvidenceAuthorityVariants(
  statusCheckSourceObservationBaseSchema,
)
  .refine((value) => value.valid_until === value.payload.valid_until, {
    message: 'StatusCheckSourceObservation Evidence.valid_until must match payload.valid_until.',
    path: ['valid_until'],
  })
  .describe('ADR 0033 StatusCheckSourceObservation direct Evidence subtype.');

export type SourceControlCanonicalPath = z.infer<typeof sourceControlCanonicalPathSchema>;
export type GitHubMutationAuthorityKind = z.infer<typeof githubMutationAuthorityKindSchema>;
export type GitHubMutationAuthority = z.infer<typeof githubMutationAuthoritySchema>;
export type GitRepositoryPayload = z.infer<typeof gitRepositoryPayloadSchema>;
export type GitRepositoryObservation = z.infer<typeof gitRepositoryObservationSchema>;
export type GitRemoteRefKind = z.infer<typeof gitRemoteRefKindSchema>;
export type GitRemoteLastFetchOutcome = z.infer<typeof gitRemoteLastFetchOutcomeSchema>;
export type GitRemoteRefState = z.infer<typeof gitRemoteRefStateSchema>;
export type GitRemotePayload = z.infer<typeof gitRemotePayloadSchema>;
export type GitRemoteObservation = z.infer<typeof gitRemoteObservationSchema>;
export type GitWorktreeKind = z.infer<typeof gitWorktreeKindSchema>;
export type GitWorktreeLockState = z.infer<typeof gitWorktreeLockStateSchema>;
export type GitWorktreePayload = z.infer<typeof gitWorktreePayloadSchema>;
export type GitWorktreeObservation = z.infer<typeof gitWorktreeObservationSchema>;
export type GitWorktreeInventoryCompletenessKind = z.infer<
  typeof gitWorktreeInventoryCompletenessKindSchema
>;
export type GitWorktreeInventoryPayload = z.infer<typeof gitWorktreeInventoryPayloadSchema>;
export type GitWorktreeInventoryObservation = z.infer<typeof gitWorktreeInventoryObservationSchema>;
export type GitBranchAncestryKind = z.infer<typeof gitBranchAncestryKindSchema>;
export type GitBranchAncestryPayload = z.infer<typeof gitBranchAncestryPayloadSchema>;
export type GitBranchAncestryObservation = z.infer<typeof gitBranchAncestryObservationSchema>;
export type GitDirtyStateKind = z.infer<typeof gitDirtyStateKindSchema>;
export type GitDirtyStatePayload = z.infer<typeof gitDirtyStatePayloadSchema>;
export type GitDirtyStateObservation = z.infer<typeof gitDirtyStateObservationSchema>;
export type PullRequestStateKind = z.infer<typeof pullRequestStateKindSchema>;
export type ClosedUnmergedReasonKind = z.infer<typeof closedUnmergedReasonKindSchema>;
export type PullRequestPayload = z.infer<typeof pullRequestPayloadSchema>;
export type PullRequestReceipt = z.infer<typeof pullRequestReceiptSchema>;
export type PullRequestAbsencePayload = z.infer<typeof pullRequestAbsencePayloadSchema>;
export type PullRequestAbsenceReceipt = z.infer<typeof pullRequestAbsenceReceiptSchema>;
export type RulesetKind = z.infer<typeof rulesetKindSchema>;
export type RulesetEnforcementKind = z.infer<typeof rulesetEnforcementKindSchema>;
export type RulesetPayload = z.infer<typeof rulesetPayloadSchema>;
export type RulesetObservation = z.infer<typeof rulesetObservationSchema>;
export type RepositoryIdentityReconciliationObservationVerdictKind = z.infer<
  typeof repositoryIdentityReconciliationVerdictKindSchema
>;
export type RepositoryIdentityPlaneDisagreementKind = z.infer<
  typeof repositoryIdentityPlaneDisagreementKindSchema
>;
export type RepositoryIdentityReconciliationObservationPayload = z.infer<
  typeof repositoryIdentityReconciliationObservationPayloadSchema
>;
export type RepositoryIdentityReconciliationObservation = z.infer<
  typeof repositoryIdentityReconciliationObservationSchema
>;
export type MCPCredentialAudienceKind = z.infer<typeof mcpCredentialAudienceKindSchema>;
export type MCPCredentialScopeToken = z.infer<typeof mcpCredentialScopeTokenSchema>;
export type MCPCredentialReadScopeToken = z.infer<typeof mcpCredentialReadScopeTokenSchema>;
export type MCPCredentialAudiencePayload = z.infer<typeof mcpCredentialAudiencePayloadSchema>;
export type MCPCredentialAudienceObservation = z.infer<
  typeof mcpCredentialAudienceObservationSchema
>;
export type StatusCheckConclusionKind = z.infer<typeof statusCheckConclusionKindSchema>;
export type StatusCheckSourceKind = z.infer<typeof statusCheckSourceKindSchema>;
export type StatusCheckSourcePayload = z.infer<typeof statusCheckSourcePayloadSchema>;
export type StatusCheckSourceObservation = z.infer<typeof statusCheckSourceObservationSchema>;
