import { describe, expect, it } from 'vitest';
import {
  boundaryObservationSchema,
  cleanRoomSmokeReceiptSchema,
  evidenceSchema,
  policyPlanReceiptSchema,
  resourceBudgetObservationSchema,
  runnerHostObservationSchema,
  runnerIsolationObservationSchema,
  workflowRunReceiptSchema,
} from '../src/index.ts';

const evidenceRef = {
  evidence_id: 'evidence:runner:source',
  source: 'runner-receipts-fixture',
  observed_at: '2026-05-06T00:00:00Z',
  authority: 'host-observation',
  confidence: 'high',
} as const;

const runnerHostEvidenceRef = {
  evidence_id: 'evidence:runner-host:fixture-runner-1',
  source: 'RunnerHostObservation:fixture-runner-1',
  observed_at: '2026-05-06T00:00:00Z',
  authority: 'host-observation',
  confidence: 'high',
} as const;

const runnerIsolationEvidenceRef = {
  evidence_id: 'bo:runner-isolation:fixture-runner-1',
  source: 'RunnerIsolationObservation:fixture-runner-1',
  observed_at: '2026-05-06T00:00:00Z',
  authority: 'host-observation',
  confidence: 'high',
} as const;

const boundaryEvidenceBase = {
  source: 'runner-boundary-fixture',
  observed_at: '2026-05-06T00:00:00Z',
  valid_until: '2026-05-06T01:00:00Z',
  authority: 'host-observation',
  confidence: 'high',
  parser_version: 'runner-boundary-parser:v1',
} as const;

const toolProvenanceEvidenceRef = {
  evidence_id: 'evidence:tool-provenance:opentofu:runner',
  source: 'ToolProvenance:opentofu',
  observed_at: '2026-05-06T00:00:00Z',
  authority: 'host-observation',
  confidence: 'high',
} as const;

const sha = '0123456789abcdef0123456789abcdef01234567';
const digest = `sha256:${'a'.repeat(64)}`;

describe('ADR 0032 Q-005 runner/check evidence subtypes', () => {
  it('validates RunnerHostObservation as a direct Evidence subtype', () => {
    const obs = runnerHostObservationSchema.parse({
      schema_version: '0.11.0',
      evidence_id: 'evidence:runner-host:fixture-runner-1',
      evidence_kind: 'observation',
      subject_refs: [
        {
          subject_kind: 'runner_host',
          subject_id: 'runner-host:fixture-runner-1',
        },
      ],
      source: 'runner-host-fixture',
      observed_at: '2026-05-06T00:00:00Z',
      valid_until: '2026-05-06T01:00:00Z',
      authority: 'host-observation',
      confidence: 'high',
      parser_version: 'runner-host-parser:v1',
      execution_context_id: 'ctx:runner:fixture-runner-1',
      payload_schema_version: 'runner-host-observation:v1',
      payload: {
        runner_host_id: 'runner-host:fixture-runner-1',
        registration_epoch: 'epoch:2026-05-06:1',
        substrate_kind: 'self_hosted_proxmox',
        os: 'linux',
        arch: 'x64',
        labels: ['self-hosted', 'linux', 'x64', 'proxmox'],
        repo_access_kind: 'private',
        last_seen_at: '2026-05-06T00:00:00Z',
        tool_provenance_evidence_refs: [toolProvenanceEvidenceRef],
      },
      redaction_mode: 'redacted',
    });

    expect(obs.payload.substrate_kind).toBe('self_hosted_proxmox');
  });

  it('rejects RunnerHostObservation subject refs that omit the runner host id', () => {
    expect(
      runnerHostObservationSchema.safeParse({
        schema_version: '0.11.0',
        evidence_id: 'evidence:runner-host:mismatch',
        evidence_kind: 'observation',
        subject_refs: [
          {
            subject_kind: 'runner_host',
            subject_id: 'runner-host:other',
          },
        ],
        source: 'runner-host-mismatch-fixture',
        observed_at: '2026-05-06T00:00:00Z',
        valid_until: null,
        authority: 'host-observation',
        confidence: 'high',
        parser_version: 'runner-host-parser:v1',
        payload_schema_version: 'runner-host-observation:v1',
        payload: {
          runner_host_id: 'runner-host:fixture-runner-1',
          registration_epoch: 'epoch:2026-05-06:1',
          substrate_kind: 'self_hosted_proxmox',
          os: 'linux',
          arch: 'x64',
          labels: ['self-hosted', 'linux', 'x64'],
          repo_access_kind: 'private',
          last_seen_at: '2026-05-06T00:00:00Z',
        },
      }).success,
    ).toBe(false);
  });

  it('preserves the Evidence sandbox-observation trace rule on RunnerHostObservation', () => {
    const sandboxObs = runnerHostObservationSchema.parse({
      schema_version: '0.11.0',
      evidence_id: 'evidence:runner-host:sandbox',
      evidence_kind: 'observation',
      subject_refs: [
        {
          subject_kind: 'runner_host',
          subject_id: 'runner-host:sandbox',
        },
      ],
      source: 'runner-host-sandbox-fixture',
      source_ref: 'sandbox-trace:runner-host',
      observed_at: '2026-05-06T00:00:00Z',
      valid_until: null,
      authority: 'sandbox-observation',
      confidence: 'best-effort',
      parser_version: 'runner-host-parser:v1',
      execution_context_id: 'ctx:runner:sandbox',
      payload_schema_version: 'runner-host-observation:v1',
      payload: {
        runner_host_id: 'runner-host:sandbox',
        registration_epoch: 'epoch:sandbox:1',
        substrate_kind: 'self_hosted_other',
        os: 'linux',
        arch: 'x64',
        labels: ['self-hosted'],
        repo_access_kind: 'public',
        last_seen_at: '2026-05-06T00:00:00Z',
      },
      redaction_mode: 'redacted',
    });

    expect(
      runnerHostObservationSchema.safeParse({
        ...sandboxObs,
        source_ref: undefined,
      }).success,
    ).toBe(false);
  });

  it('validates RunnerIsolationObservation as a typed BoundaryObservation branch', () => {
    const obs = runnerIsolationObservationSchema.parse({
      schema_version: '0.5.0',
      evidence_schema_version: '0.11.0',
      ...boundaryEvidenceBase,
      payload_schema_version: 'runner-isolation:v1',
      boundary_observation_id: 'bo:runner-isolation:fixture-runner-1',
      execution_context_id: 'ctx:runner:fixture-runner-1',
      tool_or_provider_ref: 'github-actions:runner-group:private-trusted',
      boundary_dimension: 'runner_isolation',
      observed_payload: {
        job_environment_kind: 'disposable_vm',
        workspace_cleanup_kind: 'always_clean',
        docker_socket_exposure_kind: 'none',
        network_egress_kind: 'internet_restricted',
        host_filesystem_access: 'isolated',
      },
      observation_state: 'proven',
      evidence_refs: [evidenceRef],
    });

    expect(obs.boundary_dimension).toBe('runner_isolation');
  });

  it('rejects ad-hoc runner_isolation payloads', () => {
    expect(
      runnerIsolationObservationSchema.safeParse({
        schema_version: '0.5.0',
        evidence_schema_version: '0.11.0',
        ...boundaryEvidenceBase,
        boundary_observation_id: 'bo:runner-isolation:bad',
        execution_context_id: 'ctx:runner:bad',
        boundary_dimension: 'runner_isolation',
        observed_payload: {
          runner_class: 'persistent-host',
        },
        observation_state: 'unknown',
        evidence_refs: [evidenceRef],
      }).success,
    ).toBe(false);
  });

  it('rejects ad-hoc runner_isolation payloads through the aggregate BoundaryObservation schema', () => {
    expect(
      boundaryObservationSchema.safeParse({
        schema_version: '0.5.0',
        evidence_schema_version: '0.11.0',
        ...boundaryEvidenceBase,
        boundary_observation_id: 'bo:runner-isolation:aggregate-bad',
        execution_context_id: 'ctx:runner:aggregate-bad',
        boundary_dimension: 'runner_isolation',
        observed_payload: {
          runner_class: 'persistent-host',
        },
        observation_state: 'unknown',
        evidence_refs: [evidenceRef],
      }).success,
    ).toBe(false);
  });

  it('validates WorkflowRunReceipt with runner-host evidence linkage', () => {
    const receipt = workflowRunReceiptSchema.parse({
      schema_version: '0.11.0',
      evidence_id: 'evidence:workflow-run:hcs:123',
      evidence_kind: 'receipt',
      subject_refs: [
        {
          subject_kind: 'workflow_run',
          subject_id: 'workflow-run:hcs:123',
        },
      ],
      source: 'workflow-run-fixture',
      observed_at: '2026-05-06T00:05:00Z',
      valid_until: '2026-05-06T01:05:00Z',
      authority: 'host-observation',
      confidence: 'high',
      parser_version: 'workflow-run-parser:v1',
      payload_schema_version: 'workflow-run-receipt:v1',
      payload: {
        repository_id: 'repo:hcs:first-commit',
        workflow_run_id: '123',
        commit_sha: sha,
        actor_login: 'fixture-actor',
        workflow_path: '.github/workflows/verify.yml',
        conclusion_kind: 'success',
        started_at: '2026-05-06T00:00:00Z',
        completed_at: '2026-05-06T00:04:00Z',
        runner_host_evidence_ref: runnerHostEvidenceRef,
      },
    });

    expect(receipt.payload.conclusion_kind).toBe('success');
  });

  it('rejects WorkflowRunReceipt timestamps that invert run order', () => {
    expect(
      workflowRunReceiptSchema.safeParse({
        schema_version: '0.11.0',
        evidence_id: 'evidence:workflow-run:hcs:bad-time',
        evidence_kind: 'receipt',
        subject_refs: [
          {
            subject_kind: 'workflow_run',
            subject_id: 'workflow-run:hcs:bad-time',
          },
        ],
        source: 'workflow-run-time-fixture',
        observed_at: '2026-05-06T00:05:00Z',
        valid_until: null,
        authority: 'host-observation',
        confidence: 'high',
        parser_version: 'workflow-run-parser:v1',
        payload_schema_version: 'workflow-run-receipt:v1',
        payload: {
          repository_id: 'repo:hcs:first-commit',
          workflow_run_id: 'bad-time',
          commit_sha: sha,
          actor_login: 'fixture-actor',
          workflow_path: '.github/workflows/verify.yml',
          conclusion_kind: 'failure',
          started_at: '2026-05-06T00:05:00Z',
          completed_at: '2026-05-06T00:04:00Z',
          runner_host_evidence_ref: runnerHostEvidenceRef,
        },
      }).success,
    ).toBe(false);
  });

  it('validates CleanRoomSmokeReceipt against runner isolation evidence', () => {
    const receipt = cleanRoomSmokeReceiptSchema.parse({
      schema_version: '0.11.0',
      evidence_id: 'evidence:clean-room-smoke:hcs:123',
      evidence_kind: 'receipt',
      subject_refs: [
        {
          subject_kind: 'clean_room_smoke',
          subject_id: 'clean-room-smoke:hcs:123',
        },
      ],
      source: 'clean-room-smoke-fixture',
      observed_at: '2026-05-06T00:10:00Z',
      valid_until: '2026-05-06T01:10:00Z',
      authority: 'host-observation',
      confidence: 'high',
      parser_version: 'clean-room-smoke-parser:v1',
      payload_schema_version: 'clean-room-smoke-receipt:v1',
      payload: {
        repository_id: 'repo:hcs:first-commit',
        hosted_runner_workflow_run_id: '456',
        script_invoked: 'scripts/ci/smoke.sh',
        dependency_install_outcome_kind: 'success',
        artifact_hash: digest,
        started_at: '2026-05-06T00:00:00Z',
        completed_at: '2026-05-06T00:08:00Z',
        runner_isolation_evidence_ref: runnerIsolationEvidenceRef,
      },
    });

    expect(receipt.payload.dependency_install_outcome_kind).toBe('success');
  });

  it('validates ResourceBudgetObservation pressure windows', () => {
    const obs = resourceBudgetObservationSchema.parse({
      schema_version: '0.11.0',
      evidence_id: 'evidence:resource-budget:fixture-runner-1:window',
      evidence_kind: 'observation',
      subject_refs: [
        {
          subject_kind: 'resource_budget',
          subject_id: 'resource-budget:fixture-runner-1',
        },
      ],
      source: 'resource-budget-fixture',
      observed_at: '2026-05-06T00:15:00Z',
      valid_until: '2026-05-06T00:20:00Z',
      authority: 'host-observation',
      confidence: 'high',
      parser_version: 'resource-budget-parser:v1',
      payload_schema_version: 'resource-budget-observation:v1',
      payload: {
        runner_host_id: 'runner-host:fixture-runner-1',
        observation_window: {
          window_start_at: '2026-05-06T00:10:00Z',
          window_end_at: '2026-05-06T00:15:00Z',
        },
        cpu_pressure_pct: 42,
        memory_pressure_pct: 51,
        disk_pressure_pct: 12,
        active_jobs_count: 1,
        cache_size_bytes: 1024,
      },
    });

    expect(obs.payload.active_jobs_count).toBe(1);
  });

  it('rejects ResourceBudgetObservation pressure outside percentage bounds', () => {
    expect(
      resourceBudgetObservationSchema.safeParse({
        schema_version: '0.11.0',
        evidence_id: 'evidence:resource-budget:fixture-runner-1:bad',
        evidence_kind: 'observation',
        subject_refs: [
          {
            subject_kind: 'resource_budget',
            subject_id: 'resource-budget:fixture-runner-1',
          },
        ],
        source: 'resource-budget-pressure-fixture',
        observed_at: '2026-05-06T00:15:00Z',
        valid_until: null,
        authority: 'host-observation',
        confidence: 'high',
        parser_version: 'resource-budget-parser:v1',
        payload_schema_version: 'resource-budget-observation:v1',
        payload: {
          runner_host_id: 'runner-host:fixture-runner-1',
          observation_window: {
            window_start_at: '2026-05-06T00:10:00Z',
            window_end_at: '2026-05-06T00:15:00Z',
          },
          cpu_pressure_pct: 101,
          memory_pressure_pct: 51,
          disk_pressure_pct: 12,
          active_jobs_count: 1,
          cache_size_bytes: 1024,
        },
      }).success,
    ).toBe(false);
  });

  it('validates PolicyPlanReceipt with redacted-plan hash and tool provenance refs', () => {
    const receipt = policyPlanReceiptSchema.parse({
      schema_version: '0.11.0',
      evidence_id: 'evidence:policy-plan:fixture-policy:hash',
      evidence_kind: 'receipt',
      subject_refs: [
        {
          subject_kind: 'policy_plan',
          subject_id: 'policy-plan:fixture-policy:hash',
        },
      ],
      source: 'policy-plan-fixture',
      observed_at: '2026-05-06T00:20:00Z',
      valid_until: '2026-05-06T01:20:00Z',
      authority: 'host-observation',
      confidence: 'high',
      parser_version: 'policy-plan-parser:v1',
      payload_schema_version: 'policy-plan-receipt:v1',
      payload: {
        repository_id: 'repo:fixture-iac:first-commit',
        opentofu_plan_hash: digest,
        conftest_outcome_kind: 'pass',
        policy_ids: ['fixture-policy:no-token-state'],
        workspace_id_ref: 'workspace:fixture-policy',
        provider_versions: {
          opentofu: '1.10.0',
          conftest: '0.56.0',
        },
        tool_provenance_evidence_refs: [toolProvenanceEvidenceRef],
      },
      redaction_mode: 'hash_only',
    });

    expect(receipt.payload.conftest_outcome_kind).toBe('pass');
  });

  it('rejects PolicyPlanReceipt records with no redaction floor', () => {
    expect(
      policyPlanReceiptSchema.safeParse({
        schema_version: '0.11.0',
        evidence_id: 'evidence:policy-plan:redaction-none',
        evidence_kind: 'receipt',
        subject_refs: [
          {
            subject_kind: 'policy_plan',
            subject_id: 'policy-plan:redaction-none',
          },
        ],
        source: 'policy-plan-redaction-fixture',
        observed_at: '2026-05-06T00:20:00Z',
        valid_until: null,
        authority: 'host-observation',
        confidence: 'high',
        parser_version: 'policy-plan-parser:v1',
        payload_schema_version: 'policy-plan-receipt:v1',
        payload: {
          repository_id: 'repo:fixture-iac:first-commit',
          opentofu_plan_hash: digest,
          conftest_outcome_kind: 'pass',
          policy_ids: ['fixture-policy:no-token-state'],
          workspace_id_ref: 'workspace:fixture-policy',
          provider_versions: {},
          tool_provenance_evidence_refs: [toolProvenanceEvidenceRef],
        },
        redaction_mode: 'none',
      }).success,
    ).toBe(false);
  });

  it('rejects raw plan content on PolicyPlanReceipt payloads', () => {
    expect(
      policyPlanReceiptSchema.safeParse({
        schema_version: '0.11.0',
        evidence_id: 'evidence:policy-plan:raw-content',
        evidence_kind: 'receipt',
        subject_refs: [
          {
            subject_kind: 'policy_plan',
            subject_id: 'policy-plan:raw-content',
          },
        ],
        source: 'policy-plan-raw-content-fixture',
        observed_at: '2026-05-06T00:20:00Z',
        valid_until: null,
        authority: 'host-observation',
        confidence: 'high',
        parser_version: 'policy-plan-parser:v1',
        payload_schema_version: 'policy-plan-receipt:v1',
        payload: {
          repository_id: 'repo:fixture-iac:first-commit',
          opentofu_plan_hash: digest,
          conftest_outcome_kind: 'warn',
          policy_ids: [],
          workspace_id_ref: 'workspace:fixture-policy',
          provider_versions: {},
          tool_provenance_evidence_refs: [toolProvenanceEvidenceRef],
          raw_plan_content: 'must not persist',
        },
        redaction_mode: 'hash_only',
      }).success,
    ).toBe(false);
  });

  it('widens Evidence.subject_kind for the Q-005 runner/check records', () => {
    for (const subjectKind of [
      'runner_host',
      'runner_isolation',
      'workflow_run',
      'clean_room_smoke',
      'resource_budget',
      'policy_plan',
    ] as const) {
      expect(
        evidenceSchema.parse({
          schema_version: '0.11.0',
          evidence_id: `evidence:subject-kind:${subjectKind}`,
          evidence_kind: 'observation',
          subject_refs: [
            {
              subject_kind: subjectKind,
              subject_id: `${subjectKind}:fixture`,
            },
          ],
          source: 'runner-subject-kind-fixture',
          observed_at: '2026-05-06T00:00:00Z',
          valid_until: null,
          authority: 'host-observation',
          confidence: 'high',
          parser_version: 'schema-test:v1',
        }).subject_refs[0]?.subject_kind,
      ).toBe(subjectKind);
    }
  });
});
