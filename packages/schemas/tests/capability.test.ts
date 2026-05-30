import { describe, expect, it } from 'vitest';
import { capabilitySchema } from '../src/index.ts';

const sha256 = 'sha256:0000000000000000000000000000000000000000000000000000000000000000';

const baseProvenance = {
  authority: 'capability_registry',
  source_registry_path: 'capabilities/service.yaml',
  source_registry_sha256: sha256,
  source_registry_sha256_basis: 'capability_registry_blob',
  observed_at: '2026-05-29T00:00:00Z',
} as const;

// A well-formed, non-minted Capability registry declaration.
const baseCapability = {
  schema_version: '0.1.0',
  capability_id: 'cap_service_activate',
  operation_name: 'service.activate',
  operation_class: 'read_only_diagnostic',
  capability_state: 'active',
  source_provenance: baseProvenance,
} as const;

describe('Capability schema (ADR 0062 / D-060)', () => {
  it('validates a well-formed Capability', () => {
    const cap = capabilitySchema.parse(baseCapability);
    expect(cap.operation_name).toBe('service.activate');
    expect(cap.capability_state).toBe('active');
    expect(cap.source_provenance.authority).toBe('capability_registry');
  });

  it('accepts each capability_state value (active / deprecated / retired)', () => {
    for (const capability_state of ['active', 'deprecated', 'retired'] as const) {
      const cap = capabilitySchema.parse({ ...baseCapability, capability_state });
      expect(cap.capability_state).toBe(capability_state);
    }
  });

  it('rejects a single-segment / non-dotted operation_name', () => {
    expect(
      capabilitySchema.safeParse({ ...baseCapability, operation_name: 'activate' }).success,
    ).toBe(false);
  });

  it('rejects a path / URI / secret-shaped operation_name', () => {
    for (const operation_name of ['/etc/x', 'op://v/i/f', 'a/b']) {
      expect(capabilitySchema.safeParse({ ...baseCapability, operation_name }).success).toBe(false);
    }
  });

  it('rejects an operation_class outside the reused enum (no redefinition)', () => {
    expect(
      capabilitySchema.safeParse({ ...baseCapability, operation_class: 'bogus_class' }).success,
    ).toBe(false);
  });

  it('rejects source_provenance with the wrong authority literal', () => {
    expect(
      capabilitySchema.safeParse({
        ...baseCapability,
        source_provenance: { ...baseProvenance, authority: 'system_config_live_policy' },
      }).success,
    ).toBe(false);
  });

  it('rejects a non-`sha256:` source_registry_sha256', () => {
    expect(
      capabilitySchema.safeParse({
        ...baseCapability,
        source_provenance: { ...baseProvenance, source_registry_sha256: 'md5:deadbeef' },
      }).success,
    ).toBe(false);
  });

  it('rejects a traversal, absolute, or URI-scheme source_registry_path', () => {
    for (const source_registry_path of ['capabilities/../secrets.yaml', '/etc/x', 'op://v/i/f']) {
      expect(
        capabilitySchema.safeParse({
          ...baseCapability,
          source_provenance: { ...baseProvenance, source_registry_path },
        }).success,
      ).toBe(false);
    }
  });

  it('rejects a missing source_provenance field', () => {
    const { source_provenance: _omitted, ...withoutProvenance } = baseCapability;
    expect(capabilitySchema.safeParse(withoutProvenance).success).toBe(false);
  });

  it('accepts a well-formed-but-arbitrary source_registry_sha256 (format-only; Ring 0 does no digest-trust check)', () => {
    const arbitrary = `sha256:${'a1b2c3d4'.repeat(8)}`;
    const cap = capabilitySchema.parse({
      ...baseCapability,
      source_provenance: { ...baseProvenance, source_registry_sha256: arbitrary },
    });
    expect(cap.source_provenance.source_registry_sha256).toBe(arbitrary);
  });

  it('accepts an operation_name that looks like a deprecated/forbidden verb (verb-agnostic; no denylist at Ring 0)', () => {
    const cap = capabilitySchema.parse({
      ...baseCapability,
      operation_name: 'launchctl.load',
    });
    expect(cap.operation_name).toBe('launchctl.load');
  });

  it('rejects an injected top-level tier field (.strict() — no policy leak)', () => {
    expect(capabilitySchema.safeParse({ ...baseCapability, tier: 'read-safe' }).success).toBe(
      false,
    );
  });

  it('rejects injected mint / policy fields (audit_chain_link_hash, producer, evidence_refs, approval_required)', () => {
    expect(
      capabilitySchema.safeParse({ ...baseCapability, audit_chain_link_hash: sha256 }).success,
    ).toBe(false);
    expect(capabilitySchema.safeParse({ ...baseCapability, producer: 'mint_api' }).success).toBe(
      false,
    );
    expect(capabilitySchema.safeParse({ ...baseCapability, evidence_refs: [] }).success).toBe(
      false,
    );
    expect(capabilitySchema.safeParse({ ...baseCapability, approval_required: true }).success).toBe(
      false,
    );
  });

  it('rejects an unknown top-level field (.strict())', () => {
    expect(capabilitySchema.safeParse({ ...baseCapability, unexpected_field: 'x' }).success).toBe(
      false,
    );
  });

  it('rejects three-senses overload tokens for capability_state (sense-3 observation + sense-2 containment)', () => {
    for (const capability_state of ['proven', 'stale', 'kernel_sandbox_capable']) {
      expect(capabilitySchema.safeParse({ ...baseCapability, capability_state }).success).toBe(
        false,
      );
    }
  });
});
