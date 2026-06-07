import { describe, expect, it } from 'vitest';
import { commandShapeSchema } from '../src/index.ts';

// A well-formed, non-minted CommandShape typed plan (ADR 0063 / D-061):
// argv vector + env (both value_source kinds) + cwd + timeout, rendered from an
// OperationShape (operation_shape_ref). No mint/policy fields; no shell string.
const baseCommandShape = {
  schema_version: '0.1.0',
  command_shape_id: 'cmd_service_activate',
  operation_shape_ref: 'op_service_activate',
  argv: ['/usr/bin/systemctl', 'start', 'nginx'],
  env: [
    { name: 'PATH', value_source: { kind: 'execution_context_inherited' } },
    {
      name: 'API_TOKEN',
      value_source: { kind: 'secret_reference', secret_reference_ref: 'secref_api_token' },
    },
  ],
  cwd: '/srv/work',
  timeout_seconds: 300,
} as const;

describe('CommandShape schema (ADR 0063 / D-061)', () => {
  it('validates a well-formed CommandShape (argv >= 1, both value_source kinds, valid cwd + timeout)', () => {
    const plan = commandShapeSchema.parse(baseCommandShape);
    expect(plan.argv[0]).toBe('/usr/bin/systemctl');
    expect(plan.env).toHaveLength(2);
    expect(plan.timeout_seconds).toBe(300);
  });

  it('accepts each env value_source kind (secret_reference / execution_context_inherited)', () => {
    const inherited = commandShapeSchema.safeParse({
      ...baseCommandShape,
      env: [{ name: 'HOME', value_source: { kind: 'execution_context_inherited' } }],
    });
    const secret = commandShapeSchema.safeParse({
      ...baseCommandShape,
      env: [
        {
          name: 'TOKEN',
          value_source: { kind: 'secret_reference', secret_reference_ref: 'secref_x' },
        },
      ],
    });
    expect(inherited.success).toBe(true);
    expect(secret.success).toBe(true);
  });

  it('accepts an empty env array', () => {
    expect(commandShapeSchema.safeParse({ ...baseCommandShape, env: [] }).success).toBe(true);
  });

  it('rejects an empty argv array (inv. 2 — argv[0] is the executable)', () => {
    expect(commandShapeSchema.safeParse({ ...baseCommandShape, argv: [] }).success).toBe(false);
  });

  it('rejects an empty-string argv element', () => {
    expect(commandShapeSchema.safeParse({ ...baseCommandShape, argv: ['node', ''] }).success).toBe(
      false,
    );
  });

  it('rejects a top-level shell-string `command` field (inv. 2; .strict() — no shell string as intent)', () => {
    expect(
      commandShapeSchema.safeParse({ ...baseCommandShape, command: 'systemctl start nginx' })
        .success,
    ).toBe(false);
  });

  it('rejects an env value_source carrying an inline resolved value under any renamed key (inv. 5; .strict() per variant)', () => {
    for (const key of ['value', 'resolved', 'literal']) {
      // secret_reference variant + a smuggled inline value
      expect(
        commandShapeSchema.safeParse({
          ...baseCommandShape,
          env: [
            {
              name: 'TOKEN',
              value_source: {
                kind: 'secret_reference',
                secret_reference_ref: 'secref_x',
                [key]: 'inline-secret',
              },
            },
          ],
        }).success,
      ).toBe(false);
      // execution_context_inherited variant + a smuggled inline value
      expect(
        commandShapeSchema.safeParse({
          ...baseCommandShape,
          env: [
            {
              name: 'TOKEN',
              value_source: { kind: 'execution_context_inherited', [key]: 'inline-secret' },
            },
          ],
        }).success,
      ).toBe(false);
    }
  });

  it('rejects an env value_source with a missing/unknown `kind` discriminator or a secret_reference missing its ref', () => {
    for (const value_source of [
      {},
      { secret_reference_ref: 'secref_x' },
      { kind: 'literal_non_secret' },
      { kind: 'literal_non_secret', secret_reference_ref: 'secref_x' },
      { kind: 'secret_reference' },
    ]) {
      expect(
        commandShapeSchema.safeParse({ ...baseCommandShape, env: [{ name: 'X', value_source }] })
          .success,
      ).toBe(false);
    }
  });

  it('rejects an op://- or path-shaped secret_reference_ref (opacity — entityIdSchema forbids `/`; anchors the "not an op:// URI" describe)', () => {
    for (const secret_reference_ref of ['op://vault/item/field', '/abs/secret', 'a/b']) {
      expect(
        commandShapeSchema.safeParse({
          ...baseCommandShape,
          env: [
            { name: 'TOKEN', value_source: { kind: 'secret_reference', secret_reference_ref } },
          ],
        }).success,
      ).toBe(false);
    }
  });

  it('rejects an extra key on an env entry (commandShapeEnvEntrySchema .strict())', () => {
    expect(
      commandShapeSchema.safeParse({
        ...baseCommandShape,
        env: [{ name: 'X', value_source: { kind: 'execution_context_inherited' }, extra: 'y' }],
      }).success,
    ).toBe(false);
  });

  it('pins cwd regex edges: a bare `/` rejects (needs >= 1 path segment); a single `.` accepts', () => {
    expect(commandShapeSchema.safeParse({ ...baseCommandShape, cwd: '/' }).success).toBe(false);
    expect(commandShapeSchema.safeParse({ ...baseCommandShape, cwd: '.' }).success).toBe(true);
  });

  it('rejects duplicate env names (superRefine — names unique within the array)', () => {
    expect(
      commandShapeSchema.safeParse({
        ...baseCommandShape,
        env: [
          { name: 'DUP', value_source: { kind: 'execution_context_inherited' } },
          { name: 'DUP', value_source: { kind: 'execution_context_inherited' } },
        ],
      }).success,
    ).toBe(false);
  });

  it('rejects an invalid env name (must match envVariableNameSchema)', () => {
    for (const name of ['1BAD', 'has-dash', 'has.dot', '']) {
      expect(
        commandShapeSchema.safeParse({
          ...baseCommandShape,
          env: [{ name, value_source: { kind: 'execution_context_inherited' } }],
        }).success,
      ).toBe(false);
    }
  });

  it('rejects a `..`-traversal, URI-scheme, or empty cwd; accepts a normal absolute + relative cwd', () => {
    for (const cwd of ['../etc', 'a/../b', 'op://v/i/f', 'file:///x', '']) {
      expect(commandShapeSchema.safeParse({ ...baseCommandShape, cwd }).success).toBe(false);
    }
    expect(commandShapeSchema.safeParse({ ...baseCommandShape, cwd: '/srv/work' }).success).toBe(
      true,
    );
    expect(commandShapeSchema.safeParse({ ...baseCommandShape, cwd: 'build/out' }).success).toBe(
      true,
    );
  });

  it('rejects a zero / negative / over-max / non-integer timeout_seconds; accepts the 86400 ceiling', () => {
    for (const timeout_seconds of [0, -1, 86401, 1.5]) {
      expect(commandShapeSchema.safeParse({ ...baseCommandShape, timeout_seconds }).success).toBe(
        false,
      );
    }
    expect(
      commandShapeSchema.safeParse({ ...baseCommandShape, timeout_seconds: 86400 }).success,
    ).toBe(true);
  });

  it('rejects injected mint / policy / snapshot fields (.strict() — non-minted, no policy/mint/provenance/operation_class leak)', () => {
    for (const field of [
      { audit_chain_link_hash: `sha256:${'0'.repeat(64)}` },
      { producer: 'mint_api' },
      { evidence_refs: [] },
      { operation_class: 'read_only_diagnostic' },
      { tier: 'write-destructive' },
      { approval_required: true },
      { grant_scope: 'x' },
      { source_provenance: { authority: 'system_config_live_policy' } },
    ]) {
      expect(commandShapeSchema.safeParse({ ...baseCommandShape, ...field }).success).toBe(false);
    }
  });

  it('rejects an unknown top-level field (.strict())', () => {
    expect(
      commandShapeSchema.safeParse({ ...baseCommandShape, unexpected_field: 'x' }).success,
    ).toBe(false);
  });

  it('rejects a missing required field (operation_shape_ref)', () => {
    const { operation_shape_ref: _omitted, ...withoutRef } = baseCommandShape;
    expect(commandShapeSchema.safeParse(withoutRef).success).toBe(false);
  });

  // ----- Recorded-behavior asserts: documented Ring-1 deferrals, NOT bugs -----

  it('accepts a deprecated/forbidden verb as argv[0] (verb-agnostic; inv. 11 render-refusal is the Ring-1 renderer job, not a Ring 0 denylist)', () => {
    expect(
      commandShapeSchema.safeParse({ ...baseCommandShape, argv: ['launchctl', 'unload', '/x'] })
        .success,
    ).toBe(true);
  });

  it('accepts a whitespace-only / control-char / ANSI / NUL argv element at Ring 0 (z.string().min(1) passes) — RECORDED: rejecting or escaping control sequences before audit/dashboard serialization is a Ring-1 renderer obligation, not just a whitespace refinement', () => {
    const esc = String.fromCharCode(27); // ESC — ANSI sequence introducer
    const nul = String.fromCharCode(0); // NUL
    const bel = String.fromCharCode(7); // BEL
    for (const el of [' ', '\n', '\t', `${esc}[31m`, nul, bel]) {
      expect(
        commandShapeSchema.safeParse({ ...baseCommandShape, argv: ['node', el] }).success,
      ).toBe(true);
    }
  });

  it('RECORDED env-ref symmetry (charter line 98): a token-shaped `secret_reference_ref` is ACCEPTED at Ring 0 — a format-valid opaque id; resolving a registered SecretReference vs. a smuggled literal is the same deferred Ring-1 gateway obligation as the argv trap', () => {
    const tokenShapedRef = `ghp_${'a'.repeat(36)}`; // runtime-concatenated; not a committed literal
    expect(
      commandShapeSchema.safeParse({
        ...baseCommandShape,
        env: [
          {
            name: 'TOKEN',
            value_source: { kind: 'secret_reference', secret_reference_ref: tokenShapedRef },
          },
        ],
      }).success,
    ).toBe(true);
  });

  it('RECORDED argv-secret-inlining gap (charter line 98): Ring 0 ACCEPTS op:// and token-shaped argv elements — the argument-class distinction is a deferred Ring-1 gateway obligation, trapped here and paired with the forbidden-string-scan', () => {
    // Tokens are built by RUNTIME CONCATENATION on purpose so no committed literal
    // trips scripts/ci/forbidden-string-scan.sh check #2. `op://...` is an allowed
    // reference form (not a resolved secret). Do NOT inline these as committed literals.
    const ghToken = `ghp_${'a'.repeat(36)}`;
    const awsKey = `AKIA${'A'.repeat(16)}`;
    const skToken = `sk-${'a'.repeat(40)}`;
    for (const leak of ['op://vault/item/field', ghToken, awsKey, skToken]) {
      expect(
        commandShapeSchema.safeParse({ ...baseCommandShape, argv: ['curl', '-H', leak] }).success,
      ).toBe(true);
    }
  });
});
