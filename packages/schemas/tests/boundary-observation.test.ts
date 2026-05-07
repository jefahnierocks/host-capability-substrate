import { describe, expect, it } from 'vitest';
import { boundaryObservationSchema } from '../src/index.ts';

const evidenceRef = {
  evidence_id: 'evidence:tcc-snapshot-2026-04-29',
  source:
    'docs/host-capability-substrate/research/local/2026-04-29-quality-management-synthesis.md',
  observed_at: '2026-04-29T00:00:00Z',
  authority: 'host-observation',
  confidence: 'high',
} as const;

const boundaryEvidenceBase = {
  source: 'boundary-observation-fixture',
  observed_at: '2026-05-06T00:00:00Z',
  valid_until: '2026-05-06T01:00:00Z',
  authority: 'host-observation',
  confidence: 'high',
  parser_version: 'boundary-observation-parser:v1',
} as const;

describe('BoundaryObservation envelope', () => {
  it('parses a TCC observation bound to an execution context', () => {
    const obs = boundaryObservationSchema.parse({
      schema_version: '0.4.0',
      evidence_schema_version: '0.8.0',
      ...boundaryEvidenceBase,
      payload_schema_version: 'tcc-grant:v1',
      boundary_observation_id: 'bo:tcc:claude-code-cli:full-disk',
      execution_context_id: 'ctx:claude-code-cli:p06',
      boundary_dimension: 'tcc',
      observed_payload: {
        tcc_service: 'kTCCServiceFullDiskAccess',
        grant_state: 'granted',
      },
      expected_payload: {
        tcc_service: 'kTCCServiceFullDiskAccess',
        grant_state: 'granted',
      },
      observation_state: 'proven',
      discrepancy_class: 'observed_matches_expected',
      evidence_refs: [evidenceRef],
    });

    expect(obs.boundary_dimension).toBe('tcc');
    expect(obs.observation_state).toBe('proven');
    expect(obs.execution_context_id).toBe('ctx:claude-code-cli:p06');
  });

  it('rejects an envelope with no target reference', () => {
    expect(
      boundaryObservationSchema.safeParse({
        schema_version: '0.4.0',
        evidence_schema_version: '0.8.0',
        ...boundaryEvidenceBase,
        boundary_observation_id: 'bo:floating',
        boundary_dimension: 'sandbox',
        observed_payload: { profile_name: 'seatbelt' },
        observation_state: 'unknown',
        evidence_refs: [evidenceRef],
      }).success,
    ).toBe(false);
  });

  it('rejects an envelope without non-null freshness', () => {
    expect(
      boundaryObservationSchema.safeParse({
        schema_version: '0.4.0',
        evidence_schema_version: '0.8.0',
        ...boundaryEvidenceBase,
        valid_until: undefined,
        boundary_observation_id: 'bo:missing-freshness',
        execution_context_id: 'ctx:codex-app-sandboxed:p13',
        boundary_dimension: 'sandbox',
        observed_payload: { profile_name: 'seatbelt' },
        observation_state: 'unknown',
        evidence_refs: [evidenceRef],
      }).success,
    ).toBe(false);
  });

  it('preserves the seven-state vocabulary, including unknown is not denied', () => {
    const obs = boundaryObservationSchema.parse({
      schema_version: '0.4.0',
      evidence_schema_version: '0.8.0',
      ...boundaryEvidenceBase,
      boundary_observation_id: 'bo:unknown-sandbox',
      execution_context_id: 'ctx:codex-app-sandboxed:p13',
      boundary_dimension: 'sandbox',
      observed_payload: { profile_name: 'seatbelt' },
      observation_state: 'unknown',
      evidence_refs: [evidenceRef],
    });

    expect(obs.observation_state).toBe('unknown');
  });

  it('refuses ad-hoc boundary_dimension values such as version_drift', () => {
    expect(
      boundaryObservationSchema.safeParse({
        schema_version: '0.4.0',
        evidence_schema_version: '0.8.0',
        ...boundaryEvidenceBase,
        boundary_observation_id: 'bo:bad-dimension',
        execution_context_id: 'ctx:claude-code-cli:p06',
        boundary_dimension: 'version_drift',
        observed_payload: {},
        observation_state: 'pending',
        evidence_refs: [evidenceRef],
      }).success,
    ).toBe(false);
  });

  it('accepts a check_source observation bound to a provider object reference', () => {
    const obs = boundaryObservationSchema.parse({
      schema_version: '0.4.0',
      evidence_schema_version: '0.8.0',
      ...boundaryEvidenceBase,
      payload_schema_version: 'check-source:v1',
      boundary_observation_id: 'bo:check-source:hcs-verify',
      tool_or_provider_ref: 'gh:check:host-capability-substrate:verify',
      boundary_dimension: 'check_source',
      observed_payload: {
        check_name: 'verify',
        source_app_id: '15368',
        commit_sha: '6a4b497c9e9bfe43c0a05ed52e382b74d3ea39e3',
      },
      observation_state: 'proven',
      evidence_refs: [evidenceRef],
    });

    expect(obs.boundary_dimension).toBe('check_source');
    expect(obs.tool_or_provider_ref).toBe('gh:check:host-capability-substrate:verify');
  });

  it('parses a typed containment_class observation for a container runtime', () => {
    const obs = boundaryObservationSchema.parse({
      schema_version: '0.4.0',
      evidence_schema_version: '0.8.0',
      ...boundaryEvidenceBase,
      payload_schema_version: 'containment-class:v1',
      boundary_observation_id: 'bo:containment:codex-container',
      execution_context_id: 'ctx:codex-container:p01',
      boundary_dimension: 'containment_class',
      observed_payload: {
        containment_kind: 'container',
        container_runtime_kind: 'orbstack',
        network_egress_posture: 'restricted',
        filesystem_write_scope: 'workspace_write',
        keychain_access: 'none',
      },
      observation_state: 'proven',
      evidence_refs: [evidenceRef],
    });

    expect(obs.boundary_dimension).toBe('containment_class');
    if (obs.boundary_dimension !== 'containment_class') {
      throw new Error('expected containment_class observation');
    }
    expect(obs.observed_payload.containment_kind).toBe('container');
  });

  it('rejects containment_class payloads missing the discriminator-specific field', () => {
    expect(
      boundaryObservationSchema.safeParse({
        schema_version: '0.4.0',
        evidence_schema_version: '0.8.0',
        ...boundaryEvidenceBase,
        payload_schema_version: 'containment-class:v1',
        boundary_observation_id: 'bo:containment:bad-container',
        execution_context_id: 'ctx:codex-container:p01',
        boundary_dimension: 'containment_class',
        observed_payload: {
          containment_kind: 'container',
          network_egress_posture: 'restricted',
          filesystem_write_scope: 'workspace_write',
          keychain_access: 'none',
        },
        observation_state: 'proven',
        evidence_refs: [evidenceRef],
      }).success,
    ).toBe(false);
  });

  it('requires evidence refs when filesystem inheritance is held', () => {
    expect(
      boundaryObservationSchema.safeParse({
        schema_version: '0.4.0',
        evidence_schema_version: '0.8.0',
        ...boundaryEvidenceBase,
        payload_schema_version: 'filesystem-inheritance:v1',
        boundary_observation_id: 'bo:fs-inheritance:missing-link',
        execution_context_id: 'ctx:child-context:p01',
        boundary_dimension: 'filesystem_inheritance',
        observed_payload: {
          inheritance_held: true,
          inheritance_evidence_refs: [],
        },
        observation_state: 'proven',
        evidence_refs: [evidenceRef],
      }).success,
    ).toBe(false);
  });

  it('parses filesystem_inheritance when inherited authority has linked evidence', () => {
    const obs = boundaryObservationSchema.parse({
      schema_version: '0.4.0',
      evidence_schema_version: '0.8.0',
      ...boundaryEvidenceBase,
      payload_schema_version: 'filesystem-inheritance:v1',
      boundary_observation_id: 'bo:fs-inheritance:child',
      execution_context_id: 'ctx:child-context:p01',
      boundary_dimension: 'filesystem_inheritance',
      observed_payload: {
        inheritance_held: true,
        inheritance_evidence_refs: [evidenceRef],
      },
      observation_state: 'proven',
      evidence_refs: [evidenceRef],
    });

    expect(obs.boundary_dimension).toBe('filesystem_inheritance');
    if (obs.boundary_dimension !== 'filesystem_inheritance') {
      throw new Error('expected filesystem_inheritance observation');
    }
    expect(obs.observed_payload.inheritance_evidence_refs).toHaveLength(1);
  });

  it('parses filesystem_protected_paths with D-025 authority source refs', () => {
    const obs = boundaryObservationSchema.parse({
      schema_version: '0.4.0',
      evidence_schema_version: '0.8.0',
      ...boundaryEvidenceBase,
      payload_schema_version: 'filesystem-protected-paths:v1',
      boundary_observation_id: 'bo:protected-paths:hcs',
      workspace_id: 'workspace:host-capability-substrate',
      boundary_dimension: 'filesystem_protected_paths',
      observed_payload: {
        protected_paths: [
          {
            path: '/opt/host-capability-substrate/.logs',
            path_authority_kind: 'rule_binding',
            path_authority_source_evidence_ref: evidenceRef,
          },
        ],
      },
      observation_state: 'proven',
      evidence_refs: [evidenceRef],
    });

    expect(obs.boundary_dimension).toBe('filesystem_protected_paths');
    if (obs.boundary_dimension !== 'filesystem_protected_paths') {
      throw new Error('expected filesystem_protected_paths observation');
    }
    expect(obs.observed_payload.protected_paths[0]?.path_authority_kind).toBe('rule_binding');
  });

  it('requires reference_only redaction for mcp_canonical_authority payloads', () => {
    const base = {
      schema_version: '0.4.0',
      evidence_schema_version: '0.8.0',
      ...boundaryEvidenceBase,
      payload_schema_version: 'mcp-canonical-authority:v1',
      boundary_observation_id: 'bo:mcp-canonical:github',
      execution_context_id: 'ctx:codex-cli:p01',
      tool_or_provider_ref: 'mcp:github',
      boundary_dimension: 'mcp_canonical_authority',
      observed_payload: {
        mcp_server_kind: 'github_mcp',
        canonical_install_source_kind: 'manual',
        canonical_credential_source_evidence_ref: evidenceRef,
        shim_chain_evidence_ref: evidenceRef,
        canonical_authority_kind: 'user_install',
        redaction_mode: 'reference_only',
      },
      observation_state: 'proven',
      evidence_refs: [evidenceRef],
    } as const;

    expect(boundaryObservationSchema.parse(base).boundary_dimension).toBe(
      'mcp_canonical_authority',
    );
    expect(
      boundaryObservationSchema.safeParse({
        ...base,
        observed_payload: {
          ...base.observed_payload,
          redaction_mode: 'none',
        },
      }).success,
    ).toBe(false);
  });

  it('keeps filesystem_path_authority_check reserved out of the schema', () => {
    expect(
      boundaryObservationSchema.safeParse({
        schema_version: '0.4.0',
        evidence_schema_version: '0.8.0',
        ...boundaryEvidenceBase,
        boundary_observation_id: 'bo:fs-path-check:reserved',
        execution_context_id: 'ctx:codex-cli:p01',
        boundary_dimension: 'filesystem_path_authority_check',
        observed_payload: {},
        observation_state: 'pending',
        evidence_refs: [evidenceRef],
      }).success,
    ).toBe(false);
  });

  it('rejects extra envelope fields that are not in the strict shape', () => {
    expect(
      boundaryObservationSchema.safeParse({
        schema_version: '0.4.0',
        evidence_schema_version: '0.8.0',
        ...boundaryEvidenceBase,
        boundary_observation_id: 'bo:strict-test',
        execution_context_id: 'ctx:claude-code-cli:p06',
        boundary_dimension: 'sandbox',
        observed_payload: { profile_name: 'seatbelt' },
        observation_state: 'proven',
        evidence_refs: [evidenceRef],
        unauthorized_field: 'should-be-rejected',
      }).success,
    ).toBe(false);
  });
});
