import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { evidenceAuthoritySchema, modelSchema } from '../src/index.ts';

// A raw machine-identifier shape (hex + hyphens) — valid entityIdSchema chars, NOT a
// gitleaks-token shape, so it is safe as a committed literal.
const rawUuid = '564D5E2A-1234-5678-9ABC-DEF012345678';

const baseProvenance = {
  authority: 'observed_runtime',
  observed_at: '2026-06-23T00:00:00Z',
} as const;

const base = {
  schema_version: '0.1.0',
  model_id: 'model:hcs:claude-opus',
  vendor: 'anthropic',
  runtime_family: 'claude',
  pin_form: 'alias',
  pin_value: 'opus',
  model_state: 'active',
  source_provenance: baseProvenance,
} as const;

describe('Model schema (ADR 0076 / D-077)', () => {
  it('validates a well-formed Model', () => {
    const m = modelSchema.parse(base);
    expect(m.vendor).toBe('anthropic');
    expect(m.runtime_family).toBe('claude');
    expect(m.pin_form).toBe('alias');
    expect(m.pin_value).toBe('opus');
    expect(m.model_state).toBe('active');
    expect(m.source_provenance.authority).toBe('observed_runtime');
  });

  it('accepts each vendor value and rejects out-of-enum', () => {
    for (const vendor of ['anthropic', 'openai', 'google', 'unknown'] as const) {
      expect(modelSchema.safeParse({ ...base, vendor }).success).toBe(true);
    }
    for (const bad of ['Anthropic', 'meta', 'mistral', '']) {
      expect(modelSchema.safeParse({ ...base, vendor: bad }).success).toBe(false);
    }
  });

  it('accepts each runtime_family value and rejects out-of-enum (families, not versions)', () => {
    for (const runtime_family of ['claude', 'codex', 'gemini_adk', 'unknown'] as const) {
      expect(modelSchema.safeParse({ ...base, runtime_family }).success).toBe(true);
    }
    // runtime_family names the RUNTIME/family, never a version — a version-ish string rejects
    for (const bad of ['gpt-5.5', 'opus', 'claude-opus-4-8', 'gemini', '']) {
      expect(modelSchema.safeParse({ ...base, runtime_family: bad }).success).toBe(false);
    }
  });

  it('accepts each pin_form value and rejects out-of-enum', () => {
    for (const pin_form of ['alias', 'exact_id', 'profile_handle'] as const) {
      expect(modelSchema.safeParse({ ...base, pin_form }).success).toBe(true);
    }
    for (const bad of ['exact', 'profile', 'pin', '']) {
      expect(modelSchema.safeParse({ ...base, pin_form: bad }).success).toBe(false);
    }
  });

  it('accepts each model_state value and rejects out-of-enum (lifecycle, not a policy verdict)', () => {
    for (const model_state of [
      'announced',
      'active',
      'deprecated',
      'retracted',
      'superseded',
    ] as const) {
      expect(modelSchema.safeParse({ ...base, model_state }).success).toBe(true);
    }
    // lifecycle states are NOT policy-denied states; a verdict vocabulary rejects
    for (const bad of ['denied', 'blocked', 'forbidden', 'allowed', 'unknown', '']) {
      expect(modelSchema.safeParse({ ...base, model_state: bad }).success).toBe(false);
    }
  });

  it('pins source_provenance.authority to modelSourceAuthoritySchema and rejects every evidence-authority value', () => {
    for (const authority of [
      'vendor_published',
      'observed_runtime',
      'operator_attested',
    ] as const) {
      expect(
        modelSchema.safeParse({
          ...base,
          source_provenance: { authority, observed_at: baseProvenance.observed_at },
        }).success,
      ).toBe(true);
    }
    // disjoint from evidenceAuthoritySchema: every evidence-authority value rejects in the
    // declaration-site slot (so a model fact cannot smuggle an evidence-plane authority —
    // incl. sandbox-observation / self-asserted, the inv-8 / inv-18 classes)
    for (const authority of evidenceAuthoritySchema.options) {
      expect(
        modelSchema.safeParse({
          ...base,
          source_provenance: { authority, observed_at: baseProvenance.observed_at },
        }).success,
      ).toBe(false);
    }
    // a sibling entity's declaration authority is also rejected
    expect(
      modelSchema.safeParse({
        ...base,
        source_provenance: {
          authority: 'host_profile_declaration',
          observed_at: baseProvenance.observed_at,
        },
      }).success,
    ).toBe(false);
    // .strict() provenance rejects an extra key, and observed_at is required
    expect(
      modelSchema.safeParse({ ...base, source_provenance: { ...baseProvenance, extra: 'x' } })
        .success,
    ).toBe(false);
    expect(
      modelSchema.safeParse({ ...base, source_provenance: { authority: 'observed_runtime' } })
        .success,
    ).toBe(false);
  });

  it('accepts the nullable-optional fields as absent, null, or a value', () => {
    // absent (the base omits them)
    expect(modelSchema.safeParse(base).success).toBe(true);
    // explicit null
    expect(
      modelSchema.safeParse({
        ...base,
        tier: null,
        resolved_model_name: null,
        context_window: null,
        supersedes_model_id: null,
        decision_ledger_row: null,
      }).success,
    ).toBe(true);
    // populated
    expect(
      modelSchema.safeParse({
        ...base,
        tier: 'opus',
        resolved_model_name: 'claude-opus-4-8',
        context_window: 1000000,
        supersedes_model_id: 'model:hcs:claude-fable-5',
        decision_ledger_row: 'D-075',
      }).success,
    ).toBe(true);
  });

  it('types context_window as a positive integer (the [1m] suffix as DATA)', () => {
    expect(modelSchema.safeParse({ ...base, context_window: 200000 }).success).toBe(true);
    for (const bad of [0, -1, 1.5, '1m', '1000000', true]) {
      expect(modelSchema.safeParse({ ...base, context_window: bad }).success).toBe(false);
    }
  });

  // RECORDED accept-and-trap (ADR 0076): the inv-12 "an exact pin requires a rationale
  // ledger row" rule is a Ring 1 obligation. Ring 0 ACCEPTS pin_form: exact_id with an
  // absent/null decision_ledger_row (mirroring the ResolvedTool non-cross-constraint).
  it('RECORDED accept-and-trap: pin_form=exact_id with an absent decision_ledger_row is ACCEPTED at Ring 0', () => {
    expect(
      modelSchema.safeParse({ ...base, pin_form: 'exact_id', pin_value: 'claude-opus-4-8' })
        .success,
    ).toBe(true);
  });

  // tier is the model capability RUNG, not a policy tier — it is vocabulary-agnostic.
  it('treats tier as an opaque capability-rung token, disjoint from policy tiers', () => {
    for (const tier of ['opus', 'sonnet', 'haiku']) {
      expect(modelSchema.safeParse({ ...base, tier }).success).toBe(true);
    }
    // a policy-tier string accepts as an OPAQUE token (proving the field carries no policy
    // meaning and is not cross-wired to the live tier vocabulary)
    for (const tier of ['write-destructive', 'forbidden']) {
      expect(modelSchema.safeParse({ ...base, tier }).success).toBe(true);
    }
  });

  it('rejects path/secret shapes in the bounded-token fields', () => {
    for (const field of ['tier', 'pin_value', 'resolved_model_name', 'decision_ledger_row']) {
      for (const bad of ['op://Dev/model', 'a/b', 'a:b', 'has space', 'a'.repeat(65)]) {
        expect(modelSchema.safeParse({ ...base, [field]: bad }).success).toBe(false);
      }
    }
  });

  // The D-072 / Fable lesson, structurally fixed: a bracketed context suffix is NOT a legal
  // pin_value — the `[` / `]` are outside the charset — so `[1m]` must be parsed into the typed
  // context_window, never stored as the bracketed literal that broke on retraction.
  it('rejects a bracketed [1m]-suffix pin_value and types the context window as DATA instead', () => {
    expect(modelSchema.safeParse({ ...base, pin_value: 'claude-fable-5[1m]' }).success).toBe(false);
    // the suffix-as-data round-trip: a clean pin_value + a typed context_window accepts
    expect(
      modelSchema.safeParse({ ...base, pin_value: 'claude-fable-5', context_window: 1000000 })
        .success,
    ).toBe(true);
  });

  it('rejects injected mint / policy fields (.strict())', () => {
    for (const extra of [
      { audit_chain_link_hash: `sha256:${'a'.repeat(64)}` },
      { producer: 'kernel_model_resolver' },
      { evidence_refs: [] },
      { tier_classification: 'forbidden' },
      { approval_required_for: true },
      { forbidden: true },
      { value: 'secret' },
      { model_card: {} },
      { region_prefix: 'us.anthropic' },
    ]) {
      expect(modelSchema.safeParse({ ...base, ...extra }).success).toBe(false);
    }
  });

  // RECORDED accept-and-trap (ADR 0076): model_id / supersedes_model_id are entityIdSchema,
  // which accepts a raw shape — Ring 0 cannot reject it (a Ring-0 denylist would violate inv. 1).
  // Opacity is a Ring 1 producer obligation (synthetic fixtures only).
  it('RECORDED accept-and-trap: a raw-identifier-shaped model_id / supersedes_model_id is ACCEPTED at Ring 0', () => {
    expect(modelSchema.safeParse({ ...base, model_id: rawUuid }).success).toBe(true);
    expect(modelSchema.safeParse({ ...base, supersedes_model_id: rawUuid }).success).toBe(true);
  });

  it('rejects an instance with any required field omitted', () => {
    for (const key of [
      'schema_version',
      'model_id',
      'vendor',
      'runtime_family',
      'pin_form',
      'pin_value',
      'model_state',
      'source_provenance',
    ]) {
      const incomplete: Record<string, unknown> = { ...base };
      delete incomplete[key];
      expect(modelSchema.safeParse(incomplete).success).toBe(false);
    }
  });

  it('rejects a schema_version other than the pinned 0.1.0 literal', () => {
    for (const bad of ['0.2.0', '1.0.0', '0.1', '', '0.1.0 ']) {
      expect(modelSchema.safeParse({ ...base, schema_version: bad }).success).toBe(false);
    }
  });

  it('lists exactly the eight non-optional fields as required in the generated schema', () => {
    const schema = JSON.parse(
      readFileSync(new URL('../generated/Model.schema.json', import.meta.url), 'utf8'),
    ) as { required: string[] };
    expect(schema.required).toEqual([
      'schema_version',
      'model_id',
      'vendor',
      'runtime_family',
      'pin_form',
      'pin_value',
      'model_state',
      'source_provenance',
    ]);
  });
});
