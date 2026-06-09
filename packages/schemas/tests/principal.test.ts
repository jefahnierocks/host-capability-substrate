import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { principalSchema } from '../src/index.ts';

const baseEvidenceRef = {
  evidence_id: 'evidence:principal:test',
  source: 'docs/host-capability-substrate/adr/0054-principal-ring-0-entity.md',
  observed_at: '2026-05-11T00:00:00Z',
  authority: 'host-observation',
  confidence: 'high',
} as const;

const auditHash = 'sha256:0000000000000000000000000000000000000000000000000000000000000000';

const baseActiveHumanPrincipal = {
  schema_version: '0.1.0',
  principal_id: 'principal:hcs:test-1',
  principal_kind: 'human',
  principal_state: 'active',
  kernel_observed_at: '2026-05-11T00:00:00Z',
  valid_until: null,
  producer: 'kernel_principal_resolver',
  audit_chain_link_hash: auditHash,
  evidence_refs: [baseEvidenceRef],
} as const;

describe('Principal schema (ADR 0054 / D-043)', () => {
  it('lists the canonical required fields in the generated schema', () => {
    const schema = JSON.parse(
      readFileSync(new URL('../generated/Principal.schema.json', import.meta.url), 'utf8'),
    ) as { required: string[] };
    expect(schema.required).toEqual([
      'schema_version',
      'principal_id',
      'principal_kind',
      'principal_state',
      'kernel_observed_at',
      'valid_until',
      'producer',
      'audit_chain_link_hash',
      'evidence_refs',
    ]);
  });

  it('validates an active human Principal', () => {
    const principal = principalSchema.parse(baseActiveHumanPrincipal);
    expect(principal.principal_kind).toBe('human');
    expect(principal.principal_state).toBe('active');
    expect(principal.valid_until).toBeNull();
  });

  it('validates an active service_principal Principal', () => {
    const principal = principalSchema.parse({
      ...baseActiveHumanPrincipal,
      principal_kind: 'service_principal',
    });
    expect(principal.principal_kind).toBe('service_principal');
  });

  it('validates a retired Principal with a non-null valid_until', () => {
    const principal = principalSchema.parse({
      ...baseActiveHumanPrincipal,
      principal_state: 'retired',
      valid_until: '2026-05-12T00:00:00Z',
    });
    expect(principal.principal_state).toBe('retired');
    expect(principal.valid_until).toBe('2026-05-12T00:00:00Z');
  });

  it('rejects active Principal with a non-null valid_until (state ↔ valid_until correlation)', () => {
    expect(
      principalSchema.safeParse({
        ...baseActiveHumanPrincipal,
        valid_until: '2026-05-12T00:00:00Z',
      }).success,
    ).toBe(false);
  });

  it('rejects retired Principal with a null valid_until', () => {
    expect(
      principalSchema.safeParse({
        ...baseActiveHumanPrincipal,
        principal_state: 'retired',
        valid_until: null,
      }).success,
    ).toBe(false);
  });

  it('rejects unknown principal_kind values (`pseudo_principal` and `system_principal` are registry-canonical only at v1)', () => {
    expect(
      principalSchema.safeParse({
        ...baseActiveHumanPrincipal,
        principal_kind: 'pseudo_principal',
      }).success,
    ).toBe(false);

    expect(
      principalSchema.safeParse({
        ...baseActiveHumanPrincipal,
        principal_kind: 'system_principal',
      }).success,
    ).toBe(false);
  });

  it('rejects unknown principal_state values', () => {
    expect(
      principalSchema.safeParse({
        ...baseActiveHumanPrincipal,
        principal_state: 'suspended',
      }).success,
    ).toBe(false);
  });

  it('rejects unknown producers (`kernel_dashboard` deferred to future coordinated change-set)', () => {
    expect(
      principalSchema.safeParse({
        ...baseActiveHumanPrincipal,
        producer: 'kernel_dashboard',
      }).success,
    ).toBe(false);

    expect(
      principalSchema.safeParse({
        ...baseActiveHumanPrincipal,
        producer: 'mint_api',
      }).success,
    ).toBe(false);
  });

  it('rejects non-literal schema_version values', () => {
    expect(
      principalSchema.safeParse({
        ...baseActiveHumanPrincipal,
        schema_version: '0.2.0',
      }).success,
    ).toBe(false);
  });

  it('requires audit_chain_link_hash with sha256: prefix and 64 hex chars', () => {
    expect(
      principalSchema.safeParse({
        ...baseActiveHumanPrincipal,
        audit_chain_link_hash: 'sha256:short',
      }).success,
    ).toBe(false);
  });

  it('rejects empty evidence_refs', () => {
    expect(
      principalSchema.safeParse({
        ...baseActiveHumanPrincipal,
        evidence_refs: [],
      }).success,
    ).toBe(false);
  });

  it('rejects an execution_context_id field on the envelope (typed-identity-envelope precedent; mirrors AgentClient)', () => {
    expect(
      principalSchema.safeParse({
        ...baseActiveHumanPrincipal,
        execution_context_id: 'ctx:hcs:test',
      }).success,
    ).toBe(false);
  });

  it('permits binding evidence cited via evidence_refs without chain-walk envelope superRefine (Ring 1 producer-allowlist closure is the structural defense)', () => {
    const principal = principalSchema.parse({
      ...baseActiveHumanPrincipal,
      evidence_refs: [
        {
          ...baseEvidenceRef,
          evidence_id: 'evidence:git-identity-binding:test',
          source: 'GitIdentityBinding evidence for human-principal binding',
        },
      ],
    });
    expect(principal.evidence_refs).toHaveLength(1);
  });
});
