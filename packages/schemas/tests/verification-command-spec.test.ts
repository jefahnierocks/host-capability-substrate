import { describe, expect, it } from 'vitest';
import { evidenceSchema, verificationCommandSpecSchema } from '../src/index.ts';

const evidenceRef = {
  evidence_id: 'evidence:verification-command-spec-source',
  source:
    'docs/host-capability-substrate/adr/0036-q-009-workspace-manifest-projection-and-diagnostic-surface.md',
  observed_at: '2026-05-04T00:00:00Z',
  authority: 'host-observation',
  confidence: 'high',
} as const;

const validSpec = {
  schema_version: '0.1.0',
  verification_command_spec_id: 'verification-command-spec:hcs:just-verify',
  workspace_context_id: 'workspace-context:host-capability-substrate',
  command_shape: {
    operation_class: 'workspace_verify',
    mutation_scope: 'verify_workspace',
    argv: ['just', 'verify'],
    env_refs: [],
  },
  expected_exit_codes: {
    success_codes: [0],
    allowed_failure_codes: [1],
  },
  output_evidence_kind: 'verification_receipt',
  verification_command_spec_state: 'active',
  author_session_id: 'session:phase-2-1-2',
  author_agent_client_id: 'agent-client:codex-cli:0.125.0',
  kernel_observed_at: '2026-05-04T00:00:00Z',
  valid_until: null,
  evidence_refs: [evidenceRef],
} as const;

describe('VerificationCommandSpec schema', () => {
  it('validates the Phase 2.1.2 producer-asserted verification command spec shape', () => {
    const spec = verificationCommandSpecSchema.parse(validSpec);

    expect(spec.command_shape.operation_class).toBe('workspace_verify');
    expect(spec.command_shape.argv).toEqual(['just', 'verify']);
    expect(spec.verification_command_spec_state).toBe('active');
  });

  it('rejects free-form shell strings in place of typed command_shape argv', () => {
    expect(
      verificationCommandSpecSchema.safeParse({
        ...validSpec,
        command_shape: 'just verify',
      }).success,
    ).toBe(false);
  });

  it('requires secret-shaped env var references in argv to be declared by name only', () => {
    expect(
      verificationCommandSpecSchema.safeParse({
        ...validSpec,
        verification_command_spec_id: 'verification-command-spec:hcs:secret-unsafe',
        command_shape: {
          operation_class: 'workspace_verify',
          mutation_scope: 'verify_workspace',
          argv: ['printenv', '$HCS_SECRET_ACCOUNT'],
          env_refs: [],
        },
      }).success,
    ).toBe(false);

    expect(
      verificationCommandSpecSchema.parse({
        ...validSpec,
        verification_command_spec_id: 'verification-command-spec:hcs:secret-safe',
        command_shape: {
          operation_class: 'workspace_verify',
          mutation_scope: 'verify_workspace',
          argv: ['test', '-n', '$HCS_SECRET_ACCOUNT'],
          env_refs: [
            {
              variable_name: 'HCS_SECRET_ACCOUNT',
              env_capture_mode: 'existence_only',
              required: true,
            },
          ],
        },
      }).command_shape.env_refs[0]?.env_capture_mode,
    ).toBe('existence_only');
  });

  it('rejects overlapping success and allowed-failure exit codes', () => {
    expect(
      verificationCommandSpecSchema.safeParse({
        ...validSpec,
        expected_exit_codes: {
          success_codes: [0, 2],
          allowed_failure_codes: [2],
        },
      }).success,
    ).toBe(false);
  });

  it('keeps verification_command_spec as an Evidence subject kind with current Evidence schema', () => {
    const evidence = evidenceSchema.parse({
      schema_version: '0.9.0',
      evidence_id: 'evidence:verification-command-spec:just-verify',
      evidence_kind: 'observation',
      subject_refs: [
        {
          subject_kind: 'verification_command_spec',
          subject_id: 'verification-command-spec:hcs:just-verify',
          relation: 'describes_spec',
        },
      ],
      source:
        'docs/host-capability-substrate/adr/0036-q-009-workspace-manifest-projection-and-diagnostic-surface.md',
      observed_at: '2026-05-04T00:00:00Z',
      valid_until: null,
      authority: 'host-observation',
      confidence: 'high',
      parser_version: 'human-review:v1',
      redaction_mode: 'reference_only',
    });

    expect(evidence.subject_refs[0]?.subject_kind).toBe('verification_command_spec');
  });
});
