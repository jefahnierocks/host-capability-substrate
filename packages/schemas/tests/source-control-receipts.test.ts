import { describe, expect, it } from 'vitest';
import {
  boundaryObservationSchema,
  branchProtectionObservationSchema,
  evidenceSchema,
  gitBranchAncestryObservationSchema,
  gitDirtyStateObservationSchema,
  githubMutationAuthoritySchema,
  gitRemoteObservationSchema,
  gitRepositoryObservationSchema,
  gitWorktreeInventoryObservationSchema,
  gitWorktreeObservationSchema,
  mcpCredentialAudienceObservationSchema,
  pullRequestAbsenceReceiptSchema,
  pullRequestReceiptSchema,
  repositoryIdentityReconciliationObservationSchema,
  rulesetObservationSchema,
  statusCheckSourceObservationSchema,
} from '../src/index.ts';

const sha = '0123456789abcdef0123456789abcdef01234567';
const sha2 = 'abcdef0123456789abcdef0123456789abcdef01';
const repositoryId = 'repo:hcs:first-commit';
const observedAt = '2026-05-06T00:00:00Z';
const validUntil = '2026-05-06T01:00:00Z';

const evidenceRef = {
  evidence_id: 'evidence:source-control:fixture',
  source: 'source-control-fixture',
  observed_at: observedAt,
  authority: 'host-observation',
  confidence: 'high',
} as const;

const credentialEvidenceRef = {
  evidence_id: 'credential-source:github:fixture',
  source: 'credential-source-fixture',
  observed_at: observedAt,
  authority: 'host-observation',
  confidence: 'high',
} as const;

const baseEvidence = {
  schema_version: '0.7.0',
  source: 'source-control-fixture',
  observed_at: observedAt,
  valid_until: validUntil,
  authority: 'host-observation',
  confidence: 'high',
  parser_version: 'source-control-parser:v1',
} as const;

describe('ADR 0027/0030/0033 Q-006 source-control evidence subtypes', () => {
  it('validates GitRepositoryObservation and rejects raw user-home paths', () => {
    const obs = gitRepositoryObservationSchema.parse({
      ...baseEvidence,
      evidence_id: 'evidence:git-repository:hcs',
      evidence_kind: 'observation',
      subject_refs: [{ subject_kind: 'git_repository', subject_id: repositoryId }],
      payload_schema_version: 'git_repository_observation:v1',
      payload: {
        repository_id: repositoryId,
        git_dir_path: '~/Organizations/jefahnierocks/host-capability-substrate/.git',
        work_tree_path: '~/Organizations/jefahnierocks/host-capability-substrate',
        default_branch: 'main',
        remote_observation_evidence_refs: [evidenceRef],
        detected_at: observedAt,
      },
      redaction_mode: 'redacted',
    });

    expect(obs.payload.repository_id).toBe(repositoryId);
    expect(
      gitRepositoryObservationSchema.safeParse({
        ...obs,
        evidence_id: 'evidence:git-repository:raw-path',
        payload: {
          ...obs.payload,
          git_dir_path:
            '/Users/verlyn13/Organizations/jefahnierocks/host-capability-substrate/.git',
        },
      }).success,
    ).toBe(false);
  });

  it('validates GitRemoteObservation and enforces ref_state to commit-sha consistency', () => {
    const obs = gitRemoteObservationSchema.parse({
      ...baseEvidence,
      evidence_id: 'evidence:git-remote:origin:main',
      evidence_kind: 'observation',
      subject_refs: [{ subject_kind: 'git_ref', subject_id: `${repositoryId}:origin:main` }],
      payload_schema_version: 'git_remote_observation:v1',
      payload: {
        repository_id: repositoryId,
        remote_name: 'origin',
        remote_url: 'git@github.com:jefahnierocks/host-capability-substrate.git',
        ref_kind: 'remote_tracking',
        ref_name: 'refs/remotes/origin/main',
        observed_commit_sha: sha,
        last_fetch_at: observedAt,
        last_fetch_outcome: 'ok',
        ref_state: 'present',
      },
    });

    expect(obs.payload.ref_state).toBe('present');
    expect(
      gitRemoteObservationSchema.safeParse({
        ...obs,
        evidence_id: 'evidence:git-remote:origin:gone-with-sha',
        payload: {
          ...obs.payload,
          ref_state: 'gone',
        },
      }).success,
    ).toBe(false);
    expect(
      gitRemoteObservationSchema.safeParse({
        ...obs,
        evidence_id: 'evidence:git-remote:origin:secret-url',
        payload: {
          ...obs.payload,
          remote_url: 'https://token@github.com/jefahnierocks/host-capability-substrate.git',
        },
      }).success,
    ).toBe(false);
  });

  it('validates BranchProtectionObservation as a typed BoundaryObservation branch', () => {
    const obs = branchProtectionObservationSchema.parse({
      schema_version: '0.4.0',
      evidence_schema_version: '0.7.0',
      source: 'source-control-boundary-fixture',
      observed_at: observedAt,
      valid_until: validUntil,
      authority: 'host-observation',
      confidence: 'high',
      parser_version: 'source-control-boundary-parser:v1',
      payload_schema_version: 'branch_protection:v1',
      boundary_observation_id: 'bo:branch-protection:hcs-main',
      tool_or_provider_ref: 'repo:hcs:first-commit:origin:main',
      boundary_dimension: 'branch_protection',
      observed_payload: {
        repository_id: repositoryId,
        remote_name: 'origin',
        ref_name: 'refs/heads/main',
        protection_kind: 'both',
        ruleset_id: 'ruleset:123',
        ruleset_version: 'v1',
        required_check_names: ['verify'],
        required_review_count: 1,
        restrictions_push: 'blocked',
        restrictions_delete: 'blocked',
        restrictions_force_push: 'blocked',
        bypass_actor_count: 0,
        linear_history_required: true,
        last_observed_at: observedAt,
      },
      observation_state: 'proven',
      evidence_refs: [evidenceRef],
    });

    expect(obs.boundary_dimension).toBe('branch_protection');
    expect(
      boundaryObservationSchema.safeParse({
        ...obs,
        boundary_observation_id: 'bo:branch-protection:bad',
        observed_payload: {
          branch_protected: true,
        },
      }).success,
    ).toBe(false);
    expect(
      branchProtectionObservationSchema.safeParse({
        ...obs,
        boundary_observation_id: 'bo:branch-protection:ruleset-without-id',
        observed_payload: {
          ...obs.observed_payload,
          protection_kind: 'ruleset',
          ruleset_id: undefined,
        },
      }).success,
    ).toBe(false);
  });

  it('validates GitWorktreeObservation and GitWorktreeInventoryObservation', () => {
    const worktree = gitWorktreeObservationSchema.parse({
      ...baseEvidence,
      evidence_id: 'evidence:git-worktree:hcs-main',
      evidence_kind: 'observation',
      subject_refs: [{ subject_kind: 'git_worktree', subject_id: 'git-worktree:hcs-main' }],
      execution_context_id: 'ctx:source-control:hcs',
      payload_schema_version: 'git_worktree_observation:v1',
      payload: {
        repository_id: repositoryId,
        worktree_path: '~/Organizations/jefahnierocks/host-capability-substrate',
        worktree_kind: 'primary',
        attached_branch_ref: 'refs/heads/main',
        head_commit_sha: sha,
        lock_state: 'unlocked',
        lease_id: null,
        owning_session_id: null,
        last_lease_check_at: null,
      },
      redaction_mode: 'redacted',
    });

    const inventory = gitWorktreeInventoryObservationSchema.parse({
      ...baseEvidence,
      evidence_id: 'evidence:git-worktree-inventory:hcs-main',
      evidence_kind: 'observation',
      subject_refs: [
        { subject_kind: 'git_worktree_inventory', subject_id: 'git-worktree-inventory:hcs-main' },
      ],
      execution_context_id: 'ctx:source-control:hcs',
      payload_schema_version: 'git_worktree_inventory_observation:v1',
      payload: {
        repository_id: repositoryId,
        branch_ref: 'refs/heads/main',
        worktree_observations: [evidenceRef],
        observed_via: 'git_worktree_list',
        inventory_completeness_kind: 'complete',
      },
    });

    expect(worktree.payload.lock_state).toBe('unlocked');
    expect(inventory.payload.inventory_completeness_kind).toBe('complete');
    expect(
      gitWorktreeInventoryObservationSchema.safeParse({
        ...inventory,
        evidence_id: 'evidence:git-worktree-inventory:partial-without-reason',
        payload: {
          repository_id: repositoryId,
          branch_ref: 'refs/heads/main',
          worktree_observations: [],
          observed_via: 'git_worktree_list',
          inventory_completeness_kind: 'partial_with_reason',
        },
      }).success,
    ).toBe(false);
  });

  it('validates GitBranchAncestryObservation discriminator siblings', () => {
    const obs = gitBranchAncestryObservationSchema.parse({
      ...baseEvidence,
      evidence_id: 'evidence:git-branch-ancestry:hcs-main',
      evidence_kind: 'observation',
      subject_refs: [
        { subject_kind: 'git_branch_ancestry', subject_id: 'git-branch-ancestry:hcs-main' },
      ],
      payload_schema_version: 'git_branch_ancestry_observation:v1',
      payload: {
        repository_id: repositoryId,
        candidate_ref: 'refs/heads/feature',
        base_ref: 'refs/heads/main',
        candidate_head_sha: sha,
        base_head_sha: sha2,
        ancestry_kind: 'ancestry',
        ancestry_evidence: {
          merge_base_sha: sha2,
          linear_chain_commit_shas: [sha],
        },
      },
    });

    expect(obs.payload.ancestry_kind).toBe('ancestry');
    expect(
      gitBranchAncestryObservationSchema.parse({
        ...obs,
        evidence_id: 'evidence:git-branch-ancestry:patch-equivalence',
        payload: {
          repository_id: repositoryId,
          candidate_ref: 'refs/heads/squash-merged',
          base_ref: 'refs/heads/main',
          candidate_head_sha: sha,
          base_head_sha: sha2,
          ancestry_kind: 'patch_equivalence',
          patch_equivalence_evidence: {
            merge_base_sha: sha2,
            equivalent_commit_shas: [sha],
            patch_id: 'patch-id:fixture',
          },
        },
      }).payload.ancestry_kind,
    ).toBe('patch_equivalence');
    expect(
      gitBranchAncestryObservationSchema.parse({
        ...obs,
        evidence_id: 'evidence:git-branch-ancestry:vacuous',
        payload: {
          repository_id: repositoryId,
          candidate_ref: 'refs/heads/empty',
          base_ref: 'refs/heads/main',
          candidate_head_sha: sha2,
          base_head_sha: sha2,
          ancestry_kind: 'vacuous',
          empty_branch_evidence: {
            merge_base_sha: sha2,
            candidate_commit_count: 0,
          },
        },
      }).payload.ancestry_kind,
    ).toBe('vacuous');
    expect(
      gitBranchAncestryObservationSchema.safeParse({
        ...obs,
        evidence_id: 'evidence:git-branch-ancestry:bad-sibling',
        payload: {
          ...obs.payload,
          patch_equivalence_evidence: {
            merge_base_sha: sha2,
            equivalent_commit_shas: [sha],
          },
        },
      }).success,
    ).toBe(false);
  });

  it('validates GitDirtyStateObservation count invariants', () => {
    const clean = gitDirtyStateObservationSchema.parse({
      ...baseEvidence,
      evidence_id: 'evidence:git-dirty-state:hcs-main',
      evidence_kind: 'observation',
      subject_refs: [{ subject_kind: 'git_dirty_state', subject_id: 'git-dirty-state:hcs-main' }],
      payload_schema_version: 'git_dirty_state_observation:v1',
      payload: {
        repository_id: repositoryId,
        worktree_path: '~/Organizations/jefahnierocks/host-capability-substrate',
        observed_via: 'git_status_porcelain',
        dirty_state_kind: 'clean',
        uncommitted_path_count: 0,
        untracked_path_count: 0,
        ignored_path_count: 0,
      },
      redaction_mode: 'redacted',
    });

    expect(clean.payload.dirty_state_kind).toBe('clean');
    for (const payload of [
      {
        ...clean.payload,
        dirty_state_kind: 'dirty_uncommitted',
        uncommitted_path_count: 2,
      },
      {
        ...clean.payload,
        dirty_state_kind: 'dirty_with_untracked',
        untracked_path_count: 1,
      },
      {
        ...clean.payload,
        dirty_state_kind: 'dirty_with_ignored_only',
        ignored_path_count: 1,
      },
    ] as const) {
      expect(
        gitDirtyStateObservationSchema.parse({
          ...clean,
          evidence_id: `evidence:git-dirty-state:${payload.dirty_state_kind}`,
          payload,
        }).payload.dirty_state_kind,
      ).toBe(payload.dirty_state_kind);
    }
    expect(
      gitDirtyStateObservationSchema.safeParse({
        ...clean,
        evidence_id: 'evidence:git-dirty-state:bad-clean',
        payload: {
          ...clean.payload,
          untracked_path_count: 1,
        },
      }).success,
    ).toBe(false);
  });

  it('validates PullRequestReceipt without PR content and positive PullRequestAbsenceReceipt', () => {
    const receipt = pullRequestReceiptSchema.parse({
      ...baseEvidence,
      evidence_id: 'evidence:pull-request:hcs:123',
      evidence_kind: 'receipt',
      subject_refs: [{ subject_kind: 'pull_request', subject_id: 'pull-request:hcs:123' }],
      payload_schema_version: 'pull_request_receipt:v1',
      payload: {
        repository_id: repositoryId,
        provider_kind: 'github',
        pr_number: 123,
        pr_state_kind: 'merged',
        head_sha: sha,
        base_ref: 'refs/heads/main',
        merge_commit_sha: sha2,
        provider_observed_via: 'github_api_v4',
      },
    });

    const absence = pullRequestAbsenceReceiptSchema.parse({
      ...baseEvidence,
      evidence_id: 'evidence:pull-request-absence:hcs:feature',
      evidence_kind: 'receipt',
      subject_refs: [
        { subject_kind: 'pull_request_absence', subject_id: 'pull-request-absence:hcs:feature' },
      ],
      payload_schema_version: 'pull_request_absence_receipt:v1',
      payload: {
        repository_id: repositoryId,
        provider_kind: 'github',
        head_ref: 'refs/heads/feature',
        base_ref: 'refs/heads/main',
        absence_observed_at: observedAt,
        query_observed_via: 'github_api_v4_pull_requests',
      },
    });

    expect(receipt.payload.pr_state_kind).toBe('merged');
    expect(absence.payload.head_ref).toBe('refs/heads/feature');
    expect(
      pullRequestReceiptSchema.parse({
        ...receipt,
        evidence_id: 'evidence:pull-request:hcs:124',
        payload: {
          repository_id: repositoryId,
          provider_kind: 'github',
          pr_number: 124,
          pr_state_kind: 'open',
          head_sha: sha,
          base_ref: 'refs/heads/main',
          provider_observed_via: 'github_api_v3',
        },
      }).payload.pr_state_kind,
    ).toBe('open');
    expect(
      pullRequestReceiptSchema.parse({
        ...receipt,
        evidence_id: 'evidence:pull-request:hcs:125',
        payload: {
          repository_id: repositoryId,
          provider_kind: 'github',
          pr_number: 125,
          pr_state_kind: 'closed_unmerged',
          head_sha: sha,
          base_ref: 'refs/heads/main',
          closed_unmerged_reason_kind: 'superseded',
          provider_observed_via: 'github_mcp',
        },
      }).payload.pr_state_kind,
    ).toBe('closed_unmerged');
    expect(
      pullRequestReceiptSchema.safeParse({
        ...receipt,
        evidence_id: 'evidence:pull-request:hcs:raw-content',
        payload: {
          ...receipt.payload,
          title: 'PR content must not persist',
        },
      }).success,
    ).toBe(false);
    expect(
      pullRequestReceiptSchema.safeParse({
        ...receipt,
        evidence_id: 'evidence:pull-request:hcs:absent-state',
        payload: {
          ...receipt.payload,
          pr_state_kind: 'absent',
        },
      }).success,
    ).toBe(false);
  });

  it('validates ADR 0033 GitHub authority and identity evidence', () => {
    expect(
      githubMutationAuthoritySchema.parse({
        authority_kind: 'github_app',
        github_app_id: '12345',
      }).authority_kind,
    ).toBe('github_app');

    const ruleset = rulesetObservationSchema.parse({
      ...baseEvidence,
      evidence_id: 'evidence:ruleset:hcs:main',
      evidence_kind: 'observation',
      subject_refs: [{ subject_kind: 'ruleset', subject_id: 'ruleset:hcs:main' }],
      payload_schema_version: 'ruleset_observation:v1',
      payload: {
        repository_id: repositoryId,
        ruleset_id: '123',
        ruleset_kind: 'branch',
        target_pattern: 'refs/heads/main',
        enforcement_kind: 'active',
        rule_summary: {
          require_signed: true,
          require_linear_history: true,
          restrict_pushes: true,
          restrict_deletions: true,
          required_review_count: 1,
        },
        bypass_actor_count: 0,
        provider_observed_via: 'github_api_v3_rulesets',
      },
    });

    const identity = repositoryIdentityReconciliationObservationSchema.parse({
      ...baseEvidence,
      evidence_id: 'evidence:repository-identity:hcs',
      evidence_kind: 'observation',
      subject_refs: [
        {
          subject_kind: 'repository_identity_reconciliation',
          subject_id: 'repository-identity:hcs',
        },
      ],
      payload_schema_version: 'repository_identity_reconciliation:v1',
      payload: {
        repository_id: repositoryId,
        local_path_canonical: '~/Organizations/jefahnierocks/host-capability-substrate',
        remote_url_canonical: 'git@github.com:jefahnierocks/host-capability-substrate.git',
        ssh_host_alias: 'github.com',
        signing_principal_evidence_ref: credentialEvidenceRef,
        credential_account_identity: 'jefahnierocks',
        provider_observed_via: 'gh_auth_status',
        reconciliation_verdict_kind: 'all_planes_consistent',
      },
      redaction_mode: 'redacted',
    });

    expect(ruleset.payload.enforcement_kind).toBe('active');
    expect(identity.payload.reconciliation_verdict_kind).toBe('all_planes_consistent');
    expect(
      repositoryIdentityReconciliationObservationSchema.parse({
        ...identity,
        evidence_id: 'evidence:repository-identity:plane-disagreement',
        payload: {
          ...identity.payload,
          reconciliation_verdict_kind: 'plane_disagreement',
          plane_disagreements: ['ssh_alias_missing'],
        },
      }).payload.reconciliation_verdict_kind,
    ).toBe('plane_disagreement');
    expect(
      repositoryIdentityReconciliationObservationSchema.safeParse({
        ...identity,
        evidence_id: 'evidence:repository-identity:bad-plane-disagreement',
        payload: {
          ...identity.payload,
          reconciliation_verdict_kind: 'plane_disagreement',
        },
      }).success,
    ).toBe(false);
  });

  it('validates MCPCredentialAudienceObservation and rejects free-form scope text', () => {
    const obs = mcpCredentialAudienceObservationSchema.parse({
      ...baseEvidence,
      evidence_id: 'evidence:mcp-credential-audience:github-read',
      evidence_kind: 'observation',
      subject_refs: [
        {
          subject_kind: 'mcp_credential_audience',
          subject_id: 'mcp-credential-audience:github-read',
        },
      ],
      payload_schema_version: 'mcp_credential_audience_observation:v1',
      payload: {
        mcp_server_kind: 'github_mcp',
        credential_audience_kind: 'read_only',
        credential_scope_tokens: ['metadata:read', 'contents:read', 'pull_requests:read'],
        credential_source_evidence_ref: credentialEvidenceRef,
        provider_verified_at: observedAt,
        query_observed_via: 'github_api_permissions',
      },
    });

    expect(obs.payload.credential_audience_kind).toBe('read_only');
    expect(
      mcpCredentialAudienceObservationSchema.parse({
        ...obs,
        evidence_id: 'evidence:mcp-credential-audience:github-mutation',
        payload: {
          ...obs.payload,
          credential_audience_kind: 'mutation',
          credential_scope_tokens: ['contents:write', 'pull_requests:write'],
        },
      }).payload.credential_audience_kind,
    ).toBe('mutation');
    expect(
      mcpCredentialAudienceObservationSchema.parse({
        ...obs,
        evidence_id: 'evidence:mcp-credential-audience:github-unscoped',
        payload: {
          ...obs.payload,
          credential_audience_kind: 'unscoped',
          credential_scope_tokens: [],
        },
      }).payload.credential_audience_kind,
    ).toBe('unscoped');
    expect(
      mcpCredentialAudienceObservationSchema.safeParse({
        ...obs,
        evidence_id: 'evidence:mcp-credential-audience:read-with-write-scope',
        payload: {
          ...obs.payload,
          credential_scope_tokens: ['contents:write'],
        },
      }).success,
    ).toBe(false);
    expect(
      mcpCredentialAudienceObservationSchema.safeParse({
        ...obs,
        evidence_id: 'evidence:mcp-credential-audience:free-form',
        payload: {
          ...obs.payload,
          credential_scope_tokens: ['contents: read from op://secret'],
        },
      }).success,
    ).toBe(false);
  });

  it('validates StatusCheckSourceObservation freshness and expected-source identity', () => {
    const obs = statusCheckSourceObservationSchema.parse({
      ...baseEvidence,
      evidence_id: 'evidence:status-check-source:hcs:verify',
      evidence_kind: 'observation',
      subject_refs: [
        { subject_kind: 'status_check_source', subject_id: 'status-check-source:hcs:verify' },
      ],
      payload_schema_version: 'status_check_source_observation:v1',
      payload: {
        repository_id: repositoryId,
        commit_sha: sha,
        check_name: 'verify',
        expected_workflow_path: '.github/workflows/verify.yml',
        conclusion_kind: 'success',
        concluded_at: observedAt,
        valid_until: validUntil,
        source_kind: 'actions_workflow',
        provider_observed_via: 'github_api_v4_checkruns',
        provider_verified_at: observedAt,
      },
    });

    expect(obs.payload.source_kind).toBe('actions_workflow');
    expect(
      statusCheckSourceObservationSchema.safeParse({
        ...obs,
        evidence_id: 'evidence:status-check-source:no-source',
        payload: {
          ...obs.payload,
          expected_workflow_path: undefined,
        },
      }).success,
    ).toBe(false);
    expect(
      statusCheckSourceObservationSchema.safeParse({
        ...obs,
        evidence_id: 'evidence:status-check-source:stale-window',
        valid_until: '2026-05-08T00:00:00Z',
        payload: {
          ...obs.payload,
          valid_until: '2026-05-08T00:00:00Z',
        },
      }).success,
    ).toBe(false);
  });

  it('widens Evidence.subject_kind for Q-006 source-control records', () => {
    for (const subjectKind of [
      'ruleset',
      'repository_identity_reconciliation',
      'mcp_credential_audience',
      'status_check_source',
      'git_worktree',
      'git_worktree_inventory',
      'git_branch_ancestry',
      'git_dirty_state',
      'pull_request',
      'pull_request_absence',
    ] as const) {
      expect(
        evidenceSchema.parse({
          schema_version: '0.7.0',
          evidence_id: `evidence:subject-kind:${subjectKind}`,
          evidence_kind: 'observation',
          subject_refs: [
            {
              subject_kind: subjectKind,
              subject_id: `${subjectKind}:fixture`,
            },
          ],
          source: 'source-control-subject-kind-fixture',
          observed_at: observedAt,
          valid_until: null,
          authority: 'host-observation',
          confidence: 'high',
          parser_version: 'schema-test:v1',
        }).subject_refs[0]?.subject_kind,
      ).toBe(subjectKind);
    }
  });
});
