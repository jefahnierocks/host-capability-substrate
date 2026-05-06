import { describe, expect, it } from 'vitest';
import { evidenceSchema, gitIdentityBindingSchema, toolProvenanceSchema } from '../src/index.ts';

const credentialEvidenceRef = {
  evidence_id: 'cred:git-signing-ssh-key',
  source: 'CredentialSource:git-signing-ssh-key',
  observed_at: '2026-05-06T00:00:00Z',
  authority: 'host-observation',
  confidence: 'high',
} as const;

const homePath = '$' + '{HOME}/.local/share/mise/shims/git';
const miseTargetPath = '$' + '{HOME}/.local/share/mise/installs/git/2.46.0/bin/git';

describe('ADR 0034 direct Evidence subtypes', () => {
  it('validates GitIdentityBinding with a CredentialSource signing-key FK', () => {
    const binding = gitIdentityBindingSchema.parse({
      schema_version: '0.5.0',
      evidence_id: 'evidence:git-identity:hcs:codex-cli',
      evidence_kind: 'observation',
      subject_refs: [
        {
          subject_kind: 'git_identity_binding',
          subject_id: 'git-identity-binding:hcs:codex-cli',
        },
      ],
      source: 'git-identity-binding-fixture',
      observed_at: '2026-05-06T00:00:00Z',
      valid_until: '2026-05-07T00:00:00Z',
      authority: 'host-observation',
      confidence: 'high',
      parser_version: 'git-config-parser:v1',
      workspace_id: 'workspace:host-capability-substrate',
      execution_context_id: 'ctx:codex-cli:phase-2-3-1',
      payload_schema_version: 'git-identity-binding:v1',
      payload: {
        workspace_id: 'workspace:host-capability-substrate',
        surface_id: 'surface:codex-cli',
        git_user_name: 'Verlyn',
        git_user_email: 'verlyn@example.invalid',
        git_signing_key_id: 'cred:git-signing-ssh-key',
        git_signing_format_kind: 'ssh',
        credential_source_evidence_ref: credentialEvidenceRef,
        provider_observed_via: 'git_config_read',
        provider_verified_at: '2026-05-06T00:00:00Z',
      },
      redaction_mode: 'redacted',
    });

    expect(binding.payload.git_signing_format_kind).toBe('ssh');
    expect(binding.redaction_mode).toBe('redacted');
  });

  it('rejects GitIdentityBinding records without the ADR 0034 redaction floor', () => {
    expect(
      gitIdentityBindingSchema.safeParse({
        schema_version: '0.5.0',
        evidence_id: 'evidence:git-identity:hcs:redaction-none',
        evidence_kind: 'observation',
        subject_refs: [
          {
            subject_kind: 'git_identity_binding',
            subject_id: 'git-identity-binding:hcs:redaction-none',
          },
        ],
        source: 'git-identity-binding-redaction-fixture',
        observed_at: '2026-05-06T00:00:00Z',
        valid_until: null,
        authority: 'host-observation',
        confidence: 'high',
        parser_version: 'git-config-parser:v1',
        workspace_id: 'workspace:host-capability-substrate',
        payload: {
          workspace_id: 'workspace:host-capability-substrate',
          surface_id: 'surface:codex-cli',
          git_user_name: 'Verlyn',
          git_user_email: 'verlyn@example.invalid',
          git_signing_key_id: null,
          git_signing_format_kind: 'none',
          credential_source_evidence_ref: null,
          provider_observed_via: 'git_config_read',
          provider_verified_at: '2026-05-06T00:00:00Z',
        },
        redaction_mode: 'none',
      }).success,
    ).toBe(false);
  });

  it('rejects raw signing key identifiers in GitIdentityBinding payloads', () => {
    expect(
      gitIdentityBindingSchema.safeParse({
        schema_version: '0.5.0',
        evidence_id: 'evidence:git-identity:hcs:raw-key',
        evidence_kind: 'observation',
        subject_refs: [
          {
            subject_kind: 'git_identity_binding',
            subject_id: 'git-identity-binding:hcs:raw-key',
          },
        ],
        source: 'git-identity-binding-signing-key-fixture',
        observed_at: '2026-05-06T00:00:00Z',
        valid_until: null,
        authority: 'host-observation',
        confidence: 'high',
        parser_version: 'git-config-parser:v1',
        workspace_id: 'workspace:host-capability-substrate',
        payload: {
          workspace_id: 'workspace:host-capability-substrate',
          surface_id: 'surface:codex-cli',
          git_user_name: 'Verlyn',
          git_user_email: 'verlyn@example.invalid',
          git_signing_key_id: 'SHA256:abc123',
          git_signing_format_kind: 'ssh',
          credential_source_evidence_ref: credentialEvidenceRef,
          provider_observed_via: 'git_config_read',
          provider_verified_at: '2026-05-06T00:00:00Z',
        },
        redaction_mode: 'redacted',
      }).success,
    ).toBe(false);
  });

  it('preserves the Evidence sandbox-observation trace rule on GitIdentityBinding', () => {
    const sandboxBinding = gitIdentityBindingSchema.parse({
      schema_version: '0.5.0',
      evidence_id: 'evidence:git-identity:hcs:sandbox',
      evidence_kind: 'observation',
      subject_refs: [
        {
          subject_kind: 'git_identity_binding',
          subject_id: 'git-identity-binding:hcs:sandbox',
        },
      ],
      source: 'git-identity-binding-sandbox-fixture',
      source_ref: 'sandbox-trace:git-identity-binding',
      observed_at: '2026-05-06T00:00:00Z',
      valid_until: null,
      authority: 'sandbox-observation',
      confidence: 'best-effort',
      parser_version: 'git-config-parser:v1',
      workspace_id: 'workspace:host-capability-substrate',
      execution_context_id: 'ctx:codex-cli:sandboxed',
      payload: {
        workspace_id: 'workspace:host-capability-substrate',
        surface_id: 'surface:codex-cli',
        git_user_name: 'Verlyn',
        git_user_email: 'verlyn@example.invalid',
        git_signing_key_id: null,
        git_signing_format_kind: 'none',
        credential_source_evidence_ref: null,
        provider_observed_via: 'git_config_read',
        provider_verified_at: '2026-05-06T00:00:00Z',
      },
      redaction_mode: 'redacted',
    });

    expect(sandboxBinding.authority).toBe('sandbox-observation');
    expect(
      gitIdentityBindingSchema.safeParse({
        ...sandboxBinding,
        source_ref: undefined,
      }).success,
    ).toBe(false);
  });

  it('rejects GitIdentityBinding workspace mismatches', () => {
    expect(
      gitIdentityBindingSchema.safeParse({
        schema_version: '0.5.0',
        evidence_id: 'evidence:git-identity:hcs:workspace-mismatch',
        evidence_kind: 'observation',
        subject_refs: [
          {
            subject_kind: 'git_identity_binding',
            subject_id: 'git-identity-binding:hcs:workspace-mismatch',
          },
        ],
        source: 'git-identity-binding-workspace-fixture',
        observed_at: '2026-05-06T00:00:00Z',
        valid_until: null,
        authority: 'host-observation',
        confidence: 'high',
        parser_version: 'git-config-parser:v1',
        workspace_id: 'workspace:host-capability-substrate',
        payload: {
          workspace_id: 'workspace:other',
          surface_id: 'surface:codex-cli',
          git_user_name: 'Verlyn',
          git_user_email: 'verlyn@example.invalid',
          git_signing_key_id: null,
          git_signing_format_kind: 'none',
          credential_source_evidence_ref: null,
          provider_observed_via: 'git_config_read',
          provider_verified_at: '2026-05-06T00:00:00Z',
        },
        redaction_mode: 'redacted',
      }).success,
    ).toBe(false);
  });

  it('validates ToolProvenance with canonicalized shim paths', () => {
    const provenance = toolProvenanceSchema.parse({
      schema_version: '0.5.0',
      evidence_id: 'evidence:tool-provenance:git:codex-cli',
      evidence_kind: 'observation',
      subject_refs: [
        {
          subject_kind: 'tool_provenance',
          subject_id: 'tool-provenance:git:codex-cli',
        },
      ],
      source: 'tool-provenance-fixture',
      observed_at: '2026-05-06T00:00:00Z',
      valid_until: '2026-05-07T00:00:00Z',
      authority: 'host-observation',
      confidence: 'high',
      parser_version: 'tool-provenance-parser:v1',
      workspace_id: 'workspace:host-capability-substrate',
      execution_context_id: 'ctx:codex-cli:phase-2-3-1',
      payload_schema_version: 'tool-provenance:v1',
      payload: {
        tool_or_provider_ref: 'tool:git',
        execution_context_id: 'ctx:codex-cli:phase-2-3-1',
        installed_path: homePath,
        shim_chain: [
          {
            shim_path: homePath,
            target_path: miseTargetPath,
          },
        ],
        shim_depth: 1,
        install_source_kind: 'mise',
        version_observed: 'git version 2.46.0',
        version_drift_kind: 'matches_lockfile',
        provider_observed_via: 'shim_introspection',
        provider_verified_at: '2026-05-06T00:00:00Z',
      },
      redaction_mode: 'redacted',
    });

    expect(provenance.payload.shim_depth).toBe(1);
    expect(provenance.payload.install_source_kind).toBe('mise');
  });

  it('rejects ToolProvenance raw user paths before persistence', () => {
    expect(
      toolProvenanceSchema.safeParse({
        schema_version: '0.5.0',
        evidence_id: 'evidence:tool-provenance:git:raw-path',
        evidence_kind: 'observation',
        subject_refs: [
          {
            subject_kind: 'tool_provenance',
            subject_id: 'tool-provenance:git:raw-path',
          },
        ],
        source: 'tool-provenance-path-fixture',
        observed_at: '2026-05-06T00:00:00Z',
        valid_until: null,
        authority: 'host-observation',
        confidence: 'high',
        parser_version: 'tool-provenance-parser:v1',
        execution_context_id: 'ctx:codex-cli:phase-2-3-1',
        payload: {
          tool_or_provider_ref: 'tool:git',
          execution_context_id: 'ctx:codex-cli:phase-2-3-1',
          installed_path: '/Users/verlyn13/.local/bin/git',
          shim_chain: [],
          shim_depth: 0,
          install_source_kind: 'manual',
          version_observed: 'git version 2.46.0',
          version_drift_kind: 'unknown',
          provider_observed_via: 'which_command',
          provider_verified_at: '2026-05-06T00:00:00Z',
        },
      }).success,
    ).toBe(false);
  });

  it('rejects bare placeholder roots in ToolProvenance paths', () => {
    expect(
      toolProvenanceSchema.safeParse({
        schema_version: '0.5.0',
        evidence_id: 'evidence:tool-provenance:git:bare-placeholder',
        evidence_kind: 'observation',
        subject_refs: [
          {
            subject_kind: 'tool_provenance',
            subject_id: 'tool-provenance:git:bare-placeholder',
          },
        ],
        source: 'tool-provenance-placeholder-fixture',
        observed_at: '2026-05-06T00:00:00Z',
        valid_until: null,
        authority: 'host-observation',
        confidence: 'high',
        parser_version: 'tool-provenance-parser:v1',
        execution_context_id: 'ctx:codex-cli:phase-2-3-1',
        payload: {
          tool_or_provider_ref: 'tool:git',
          execution_context_id: 'ctx:codex-cli:phase-2-3-1',
          installed_path: '$' + '{HOME}',
          shim_chain: [],
          shim_depth: 0,
          install_source_kind: 'mise',
          version_observed: 'git version 2.46.0',
          version_drift_kind: 'unknown',
          provider_observed_via: 'shim_introspection',
          provider_verified_at: '2026-05-06T00:00:00Z',
        },
      }).success,
    ).toBe(false);
  });

  it('rejects ToolProvenance shim_depth drift from the shim_chain length', () => {
    expect(
      toolProvenanceSchema.safeParse({
        schema_version: '0.5.0',
        evidence_id: 'evidence:tool-provenance:git:bad-depth',
        evidence_kind: 'observation',
        subject_refs: [
          {
            subject_kind: 'tool_provenance',
            subject_id: 'tool-provenance:git:bad-depth',
          },
        ],
        source: 'tool-provenance-depth-fixture',
        observed_at: '2026-05-06T00:00:00Z',
        valid_until: null,
        authority: 'host-observation',
        confidence: 'high',
        parser_version: 'tool-provenance-parser:v1',
        execution_context_id: 'ctx:codex-cli:phase-2-3-1',
        payload: {
          tool_or_provider_ref: 'tool:git',
          execution_context_id: 'ctx:codex-cli:phase-2-3-1',
          installed_path: homePath,
          shim_chain: [],
          shim_depth: 1,
          install_source_kind: 'mise',
          version_observed: 'git version 2.46.0',
          version_drift_kind: 'matches_lockfile',
          provider_observed_via: 'shim_introspection',
          provider_verified_at: '2026-05-06T00:00:00Z',
        },
      }).success,
    ).toBe(false);
  });

  it('rejects ToolProvenance execution context mismatches', () => {
    expect(
      toolProvenanceSchema.safeParse({
        schema_version: '0.5.0',
        evidence_id: 'evidence:tool-provenance:git:context-mismatch',
        evidence_kind: 'observation',
        subject_refs: [
          {
            subject_kind: 'tool_provenance',
            subject_id: 'tool-provenance:git:context-mismatch',
          },
        ],
        source: 'tool-provenance-context-fixture',
        observed_at: '2026-05-06T00:00:00Z',
        valid_until: null,
        authority: 'host-observation',
        confidence: 'high',
        parser_version: 'tool-provenance-parser:v1',
        execution_context_id: 'ctx:codex-cli:top-level',
        payload: {
          tool_or_provider_ref: 'tool:git',
          execution_context_id: 'ctx:codex-cli:payload',
          installed_path: homePath,
          shim_chain: [],
          shim_depth: 0,
          install_source_kind: 'mise',
          version_observed: 'git version 2.46.0',
          version_drift_kind: 'matches_lockfile',
          provider_observed_via: 'shim_introspection',
          provider_verified_at: '2026-05-06T00:00:00Z',
        },
      }).success,
    ).toBe(false);
  });

  it('preserves the Evidence sandbox-observation trace rule on direct subtypes', () => {
    const sandboxProvenance = toolProvenanceSchema.parse({
      schema_version: '0.5.0',
      evidence_id: 'evidence:tool-provenance:git:sandbox',
      evidence_kind: 'observation',
      subject_refs: [
        {
          subject_kind: 'tool_provenance',
          subject_id: 'tool-provenance:git:sandbox',
        },
      ],
      source: 'tool-provenance-sandbox-fixture',
      source_ref: 'sandbox-trace:tool-provenance',
      observed_at: '2026-05-06T00:00:00Z',
      valid_until: null,
      authority: 'sandbox-observation',
      confidence: 'best-effort',
      parser_version: 'tool-provenance-parser:v1',
      execution_context_id: 'ctx:codex-cli:sandboxed',
      payload: {
        tool_or_provider_ref: 'tool:git',
        execution_context_id: 'ctx:codex-cli:sandboxed',
        installed_path: homePath,
        shim_chain: [],
        shim_depth: 0,
        install_source_kind: 'mise',
        version_observed: 'git version 2.46.0',
        version_drift_kind: 'unknown',
        provider_observed_via: 'which_command',
        provider_verified_at: '2026-05-06T00:00:00Z',
      },
      redaction_mode: 'redacted',
    });

    expect(sandboxProvenance.authority).toBe('sandbox-observation');
    expect(
      toolProvenanceSchema.safeParse({
        ...sandboxProvenance,
        source_ref: undefined,
      }).success,
    ).toBe(false);
  });

  it('widens Evidence.subject_kind for the Phase 2.3.1 direct subtype records', () => {
    expect(
      evidenceSchema.parse({
        schema_version: '0.5.0',
        evidence_id: 'evidence:subject-kind:tool-provenance',
        evidence_kind: 'observation',
        subject_refs: [
          {
            subject_kind: 'tool_provenance',
            subject_id: 'tool-provenance:git:codex-cli',
          },
        ],
        source: 'schema test',
        observed_at: '2026-05-06T00:00:00Z',
        valid_until: null,
        authority: 'host-observation',
        confidence: 'high',
        parser_version: 'schema-test:v1',
      }).subject_refs[0]?.subject_kind,
    ).toBe('tool_provenance');
  });
});
