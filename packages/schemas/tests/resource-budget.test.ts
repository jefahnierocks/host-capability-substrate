import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { evidenceAuthoritySchema, resourceBudgetSchema } from '../src/index.ts';

// A raw machine-identifier shape (hex + hyphens) — valid entityIdSchema chars, NOT a
// gitleaks-token shape, so it is safe as a committed literal.
const rawPlatformUuid = '564D5E2A-1234-5678-9ABC-DEF012345678';

const baseProvenance = {
  authority: 'resource_budget_declaration',
  observed_at: '2026-06-08T00:00:00Z',
} as const;

const base = {
  schema_version: '0.1.0',
  resource_budget_id: 'resource-budget:hcs:session-1:cpu',
  session_id: 'session:hcs:agent-1',
  resource_kind: 'cpu',
  limit_value: 4,
  limit_unit: 'cores',
  budget_state: 'active',
  source_provenance: baseProvenance,
} as const;

describe('ResourceBudget schema (ADR 0072 / D-070)', () => {
  it('validates a well-formed ResourceBudget', () => {
    const b = resourceBudgetSchema.parse(base);
    expect(b.resource_kind).toBe('cpu');
    expect(b.limit_value).toBe(4);
    expect(b.limit_unit).toBe('cores');
    expect(b.budget_state).toBe('active');
    expect(b.session_id).toBe('session:hcs:agent-1');
    expect(b.source_provenance.authority).toBe('resource_budget_declaration');
  });

  it('accepts each resource_kind value and rejects out-of-enum', () => {
    for (const resource_kind of [
      'cpu',
      'memory',
      'network',
      'sandbox_concurrency',
      'unknown',
    ] as const) {
      expect(resourceBudgetSchema.safeParse({ ...base, resource_kind }).success).toBe(true);
    }
    // not the ResourceBudgetObservation pressure-payload vocabulary:
    for (const bad of ['cpu_pressure_pct', 'disk', 'gpu', 'cache_size_bytes', '']) {
      expect(resourceBudgetSchema.safeParse({ ...base, resource_kind: bad }).success).toBe(false);
    }
  });

  it('accepts each limit_unit value and rejects out-of-enum', () => {
    for (const limit_unit of [
      'cores',
      'bytes',
      'bytes_per_sec',
      'count',
      'percent',
      'unknown',
    ] as const) {
      expect(resourceBudgetSchema.safeParse({ ...base, limit_unit }).success).toBe(true);
    }
    for (const bad of ['gb', 'mb', 'cpu', 'seconds', '']) {
      expect(resourceBudgetSchema.safeParse({ ...base, limit_unit: bad }).success).toBe(false);
    }
  });

  it('accepts each budget_state value and rejects out-of-enum', () => {
    for (const budget_state of ['active', 'retired'] as const) {
      expect(resourceBudgetSchema.safeParse({ ...base, budget_state }).success).toBe(true);
    }
    // budget_state is active|retired — uses the _state lifecycle convention,
    // NOT a _status vocab and NOT a held|released / locked vocab. It deliberately
    // does NOT carry the `unknown` house sentinel that resource_kind / limit_unit do:
    // lifecycle is a closed binary, not an open/extensible dimension.
    for (const bad of ['held', 'released', 'expired', 'denied', 'unknown']) {
      expect(resourceBudgetSchema.safeParse({ ...base, budget_state: bad }).success).toBe(false);
    }
  });

  it('requires limit_value to be a non-negative integer', () => {
    expect(resourceBudgetSchema.safeParse({ ...base, limit_value: 0 }).success).toBe(true);
    for (const bad of [-1, 1.5, '4', null]) {
      expect(resourceBudgetSchema.safeParse({ ...base, limit_value: bad }).success).toBe(false);
    }
  });

  // RECORDED accept-and-trap (ADR 0072): Ring 0 does NOT cross-constrain
  // resource_kind <-> limit_unit. A cpu budget measured in bytes is structurally
  // ACCEPTED at Ring 0; dimension<->unit consistency is a Ring 1 obligation
  // (mirrors the ResolvedTool basis<->context non-cross-constraint).
  it('RECORDED accept-and-trap: a mismatched resource_kind/limit_unit pair is ACCEPTED at Ring 0', () => {
    expect(
      resourceBudgetSchema.safeParse({ ...base, resource_kind: 'cpu', limit_unit: 'bytes' })
        .success,
    ).toBe(true);
    expect(
      resourceBudgetSchema.safeParse({ ...base, resource_kind: 'memory', limit_unit: 'cores' })
        .success,
    ).toBe(true);
  });

  it('rejects injected mint / value / policy fields AND the ResourceBudgetObservation payload fields (.strict())', () => {
    for (const extra of [
      { audit_chain_link_hash: `sha256:${'a'.repeat(64)}` },
      { producer: 'kernel_resource_budget_resolver' },
      { evidence_refs: [] },
      { tier: 'write-local' },
      { tier: 'forbidden' },
      { approval_required_for: true },
      // the shipped namesake (ResourceBudgetObservation) pressure-reading fields are NOT fields here:
      { cpu_pressure_pct: 50 },
      { memory_pressure_pct: 50 },
      { active_jobs_count: 1 },
      { runner_host_id: 'runner-host:hcs:1' },
      { value: 'secret' },
      { forbidden: true },
    ]) {
      expect(resourceBudgetSchema.safeParse({ ...base, ...extra }).success).toBe(false);
    }
  });

  it('pins source_provenance.authority to resource_budget_declaration and rejects every evidence-authority value', () => {
    expect(
      resourceBudgetSchema.safeParse({
        ...base,
        source_provenance: { ...baseProvenance, extra: 'x' },
      }).success,
    ).toBe(false);
    // a sibling entity's declaration authority is also rejected
    expect(
      resourceBudgetSchema.safeParse({
        ...base,
        source_provenance: {
          authority: 'lock_declaration',
          observed_at: baseProvenance.observed_at,
        },
      }).success,
    ).toBe(false);
    for (const authority of evidenceAuthoritySchema.options) {
      expect(
        resourceBudgetSchema.safeParse({
          ...base,
          source_provenance: { authority, observed_at: baseProvenance.observed_at },
        }).success,
      ).toBe(false);
    }
  });

  // RECORDED accept-and-trap (ADR 0072): resource_budget_id is entityIdSchema, which accepts a
  // raw machine-identifier shape — Ring 0 cannot reject it (a Ring-0 denylist would violate inv. 1).
  // Keeping it opaque/derived is a Ring 1 producer obligation, mirroring the storage-primitive peers.
  it('RECORDED accept-and-trap: a resource_budget_id set to a raw machine-identifier shape is ACCEPTED at Ring 0', () => {
    expect(
      resourceBudgetSchema.safeParse({ ...base, resource_budget_id: rawPlatformUuid }).success,
    ).toBe(true);
  });

  // .strict() rejects EXTRA keys; this guards the inverse — a DROPPED required key.
  // Most material here is a missing `session_id`: it is the only structural guarantee
  // that a ResourceBudget is per-session, so silently losing it would turn a per-session
  // allocation into a global one.
  it('rejects an instance with any required field omitted (esp. the per-session session_id)', () => {
    for (const key of [
      'schema_version',
      'resource_budget_id',
      'session_id',
      'resource_kind',
      'limit_value',
      'limit_unit',
      'budget_state',
      'source_provenance',
    ]) {
      const incomplete: Record<string, unknown> = { ...base };
      delete incomplete[key];
      expect(resourceBudgetSchema.safeParse(incomplete).success).toBe(false);
    }
  });

  it('rejects a schema_version other than the pinned 0.1.0 literal', () => {
    for (const bad of ['0.2.0', '1.0.0', '0.1', '', '0.1.0 ']) {
      expect(resourceBudgetSchema.safeParse({ ...base, schema_version: bad }).success).toBe(false);
    }
  });

  it('rejects a malformed or missing source_provenance.observed_at', () => {
    for (const bad of ['2026-06-08', '2026-06-08T00:00:00', 'not-a-date', '']) {
      expect(
        resourceBudgetSchema.safeParse({
          ...base,
          source_provenance: { authority: 'resource_budget_declaration', observed_at: bad },
        }).success,
      ).toBe(false);
    }
    // observed_at is REQUIRED within the .strict() provenance object
    expect(
      resourceBudgetSchema.safeParse({
        ...base,
        source_provenance: { authority: 'resource_budget_declaration' },
      }).success,
    ).toBe(false);
  });

  it('lists the eight fields as required in the generated schema (no optional fields)', () => {
    const schema = JSON.parse(
      readFileSync(new URL('../generated/ResourceBudget.schema.json', import.meta.url), 'utf8'),
    ) as { required: string[] };
    expect(schema.required).toEqual([
      'schema_version',
      'resource_budget_id',
      'session_id',
      'resource_kind',
      'limit_value',
      'limit_unit',
      'budget_state',
      'source_provenance',
    ]);
  });
});
