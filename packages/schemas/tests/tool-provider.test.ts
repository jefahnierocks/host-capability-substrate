import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { evidenceAuthoritySchema, toolProviderSchema } from '../src/index.ts';

// A raw machine-identifier shape (hex + hyphens) — all chars are valid entityIdSchema
// chars, and NOT a gitleaks-token shape, so it is safe as a committed literal.
const rawPlatformUuid = '564D5E2A-1234-5678-9ABC-DEF012345678';

const baseProvenance = {
  authority: 'tool_provider_declaration',
  observed_at: '2026-06-07T00:00:00Z',
} as const;

const base = {
  schema_version: '0.1.0',
  tool_provider_id: 'tool-provider:hcs:mise-1',
  manager_kind: 'mise',
  provider_state: 'active',
  root_path: '${HOME}/.local/share/mise',
  source_provenance: baseProvenance,
} as const;

describe('ToolProvider schema (ADR 0067 / D-065)', () => {
  it('validates a well-formed ToolProvider', () => {
    const tp = toolProviderSchema.parse(base);
    expect(tp.manager_kind).toBe('mise');
    expect(tp.provider_state).toBe('active');
    expect(tp.source_provenance.authority).toBe('tool_provider_declaration');
  });

  it('accepts each manager_kind / provider_state value and rejects out-of-enum', () => {
    for (const manager_kind of [
      'mise',
      'homebrew',
      'system',
      'project_local',
      'unknown',
    ] as const) {
      expect(toolProviderSchema.safeParse({ ...base, manager_kind }).success).toBe(true);
    }
    for (const provider_state of ['active', 'retired'] as const) {
      expect(toolProviderSchema.safeParse({ ...base, provider_state }).success).toBe(true);
    }
    // manager_kind is the tool-SOURCE axis, NOT ADR 0034's install-MECHANISM axis:
    // install_source_kind values are out-of-enum here.
    for (const bad of ['npm', 'pip', 'uv', 'asdf', 'manual', 'system_package_manager']) {
      expect(toolProviderSchema.safeParse({ ...base, manager_kind: bad }).success).toBe(false);
    }
    // provider_state is active|retired only (NOT Capability's three-value enum with `deprecated`).
    expect(toolProviderSchema.safeParse({ ...base, provider_state: 'deprecated' }).success).toBe(
      false,
    );
  });

  it('root_path: accepts bare/anchored provider roots and rejects traversal / URI / whitespace / non-whitelisted / relative', () => {
    for (const root_path of [
      '/usr/local', // bare Intel-Homebrew prefix (the case ADR 0034's primitive REJECTS)
      '/opt/homebrew',
      '/Library/Frameworks/Python.framework',
      '${HOME}/code/acme/.mise', // a project-local provider root under HOME
      '${XDG_DATA_HOME}/mise',
      '${TMPDIR}/scratch',
    ]) {
      expect(toolProviderSchema.safeParse({ ...base, root_path }).success).toBe(true);
    }
    for (const root_path of [
      '/opt/../etc', // `..` traversal (the no-traversal guarantee)
      '${HOME}/x/../y', // mid-path `..`
      '/opt/..',
      'op://vault/item', // URI scheme
      'https://example.com',
      '/usr/local bin', // whitespace
      '/etc/passwd', // absolute but not a whitelisted provider root
      'mise', // bare relative (a durable record needs an anchored root)
      '/option', // anchored-prefix near-miss: must NOT match /opt as a substring prefix
      '', // empty
    ]) {
      expect(toolProviderSchema.safeParse({ ...base, root_path }).success).toBe(false);
    }
    // root_path is OPTIONAL (`system` / `unknown` providers may have no single root).
    const { root_path: _omitted, ...withoutRoot } = base;
    expect(toolProviderSchema.safeParse(withoutRoot).success).toBe(true);
    // RECORDED accept-and-trap (root_path side, symmetric with the secret-reference /
    // command-shape token fixtures): a long token-shaped FINAL segment under a real root
    // ACCEPTS at Ring 0 — the deep reference-vs-secret check is a Ring 1 obligation,
    // backstopped by forbidden-string-scan. Built by runtime concatenation so the fixture
    // documents the gap WITHOUT committing a token-shaped literal that trips the scan.
    const tokenSegmentRoot = `/opt/${'A'.repeat(40)}`;
    expect(toolProviderSchema.safeParse({ ...base, root_path: tokenSegmentRoot }).success).toBe(
      true,
    );
  });

  it('rejects injected mint / value / policy fields AND the colliding/adjacent field names (.strict())', () => {
    for (const extra of [
      { audit_chain_link_hash: `sha256:${'a'.repeat(64)}` },
      { producer: 'kernel_tool_provider_resolver' },
      { evidence_refs: [] },
      // the load-bearing name-collision rejection: provider_kind is NOT a field here
      { provider_kind: 'github' },
      { provider_kind: 'local' },
      // ADR 0034's install-mechanism field is NOT a field here either
      { install_source_kind: 'homebrew' },
      { tier: 'write-local' },
      { tier: 'forbidden' },
      { approval_required_for: true },
      { approval_required_for: { grant_kind: 'operator_dashboard' } },
      { root: '/usr/local' }, // not the real field name (root_path)
      { value: 'secret' },
      { forbidden: true },
    ]) {
      expect(toolProviderSchema.safeParse({ ...base, ...extra }).success).toBe(false);
    }
  });

  it('pins source_provenance.authority to tool_provider_declaration and rejects every evidence-authority value', () => {
    expect(
      toolProviderSchema.safeParse({
        ...base,
        source_provenance: { ...baseProvenance, extra: 'x' },
      }).success,
    ).toBe(false);
    // a sibling entity's declaration authority is also rejected
    expect(
      toolProviderSchema.safeParse({
        ...base,
        source_provenance: {
          authority: 'host_profile_declaration',
          observed_at: baseProvenance.observed_at,
        },
      }).success,
    ).toBe(false);
    for (const authority of evidenceAuthoritySchema.options) {
      expect(
        toolProviderSchema.safeParse({
          ...base,
          source_provenance: { authority, observed_at: baseProvenance.observed_at },
        }).success,
      ).toBe(false);
    }
  });

  // RECORDED accept-and-trap (ADR 0067): tool_provider_id is entityIdSchema, which accepts a
  // raw machine-identifier shape — Ring 0 cannot reject it (a Ring-0 denylist would violate
  // inv. 1). Keeping tool_provider_id opaque/derived is a Ring 1 producer obligation,
  // mirroring HostProfile.host_profile_id. (The hex-UUID is not a gitleaks-token shape.)
  it('RECORDED accept-and-trap: a tool_provider_id set to a raw machine-identifier shape is ACCEPTED at Ring 0', () => {
    expect(
      toolProviderSchema.safeParse({ ...base, tool_provider_id: rawPlatformUuid }).success,
    ).toBe(true);
  });

  it('lists the five non-optional fields as required in the generated schema (root_path omitted)', () => {
    const schema = JSON.parse(
      readFileSync(new URL('../generated/ToolProvider.schema.json', import.meta.url), 'utf8'),
    ) as { required: string[] };
    expect(schema.required).toEqual([
      'schema_version',
      'tool_provider_id',
      'manager_kind',
      'provider_state',
      'source_provenance',
    ]);
  });
});
