import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { evidenceAuthoritySchema, toolInstallationSchema } from '../src/index.ts';

// A raw machine-identifier shape (hex + hyphens) — all chars are valid entityIdSchema
// chars, and NOT a gitleaks-token shape, so it is safe as a committed literal.
const rawPlatformUuid = '564D5E2A-1234-5678-9ABC-DEF012345678';

const baseProvenance = {
  authority: 'tool_installation_declaration',
  observed_at: '2026-06-07T00:00:00Z',
} as const;

const base = {
  schema_version: '0.1.0',
  tool_installation_id: 'tool-installation:hcs:node-24.3.0',
  tool_provider_id: 'tool-provider:hcs:mise-1',
  tool_name: 'node',
  version: '24.3.0',
  install_surface_kind: 'manager_shim',
  install_path: '${HOME}/.local/share/mise/installs/node/24.3.0/bin/node',
  installation_state: 'active',
  source_provenance: baseProvenance,
} as const;

describe('ToolInstallation schema (ADR 0068 / D-066)', () => {
  it('validates a well-formed ToolInstallation', () => {
    const ti = toolInstallationSchema.parse(base);
    expect(ti.tool_name).toBe('node');
    expect(ti.install_surface_kind).toBe('manager_shim');
    expect(ti.installation_state).toBe('active');
    expect(ti.source_provenance.authority).toBe('tool_installation_declaration');
  });

  it('accepts each install_surface_kind / installation_state value and rejects out-of-enum (a distinct axis)', () => {
    for (const install_surface_kind of [
      'host_path',
      'manager_shim',
      'app_bundled',
      'devcontainer',
      'cloud_image',
      'setup_script',
      'unknown',
    ] as const) {
      expect(toolInstallationSchema.safeParse({ ...base, install_surface_kind }).success).toBe(
        true,
      );
    }
    for (const installation_state of ['active', 'retired'] as const) {
      expect(toolInstallationSchema.safeParse({ ...base, installation_state }).success).toBe(true);
    }
    // install_surface_kind is the AUTHORITY-SURFACE axis — NOT the ToolProvider.manager_kind
    // (source) axis, NOT the ADR 0034 install_source_kind (mechanism) axis: their values reject.
    for (const bad of ['mise', 'homebrew', 'system', 'project_local', 'npm', 'pip', 'asdf']) {
      expect(toolInstallationSchema.safeParse({ ...base, install_surface_kind: bad }).success).toBe(
        false,
      );
    }
    // installation_state is active|retired only (NOT Capability's three-value enum).
    expect(
      toolInstallationSchema.safeParse({ ...base, installation_state: 'deprecated' }).success,
    ).toBe(false);
  });

  it('version and tool_name pin both directions: named accept cases + whitespace/URI/path/secret rejects', () => {
    for (const version of ['24.3.0', 'v18.16.0', '1.2.3-beta.1', '3.12']) {
      expect(toolInstallationSchema.safeParse({ ...base, version }).success).toBe(true);
    }
    for (const version of ['24 3 0', 'op://v/i', '/etc/x', 'a:b', '1'.repeat(65)]) {
      expect(toolInstallationSchema.safeParse({ ...base, version }).success).toBe(false);
    }
    for (const tool_name of ['node', 'python3', 'ripgrep', 'rust-analyzer']) {
      expect(toolInstallationSchema.safeParse({ ...base, tool_name }).success).toBe(true);
    }
    for (const tool_name of ['no de', 'op://x', '/usr/bin/node', 'a:b', 'n'.repeat(65)]) {
      expect(toolInstallationSchema.safeParse({ ...base, tool_name }).success).toBe(false);
    }
  });

  it('install_path reuses the ADR 0034 tool-file-path primitive: anchored roots accept; URI / relative / bare-root / non-whitelisted reject; omittable', () => {
    for (const install_path of [
      '${HOME}/.local/share/mise/installs/node/24.3.0/bin/node',
      '/usr/local/bin/node',
      '/opt/homebrew/bin/rg',
      '${XDG_DATA_HOME}/tool/bin/x',
      '/Library/Frameworks/Python.framework/Versions/3.12/bin/python3',
    ]) {
      expect(toolInstallationSchema.safeParse({ ...base, install_path }).success).toBe(true);
    }
    for (const install_path of [
      'op://vault/item', // URI scheme
      'https://example.com',
      'node', // bare relative
      '/usr/local', // bare root, no subpath (the primitive requires `/.+`)
      '/etc/passwd', // absolute but not a whitelisted root
      '', // empty
    ]) {
      expect(toolInstallationSchema.safeParse({ ...base, install_path }).success).toBe(false);
    }
    // install_path is OPTIONAL (`app_bundled` / `cloud_image` surfaces may have no host file path).
    const { install_path: _omitted, ...withoutPath } = base;
    expect(toolInstallationSchema.safeParse(withoutPath).success).toBe(true);
    // ...and that omission ties to the surfaces the optionality exists for (an app_bundled install
    // with no canonical host file path). Ring 0 does NOT cross-constrain surface vs path (inv. 1).
    expect(
      toolInstallationSchema.safeParse({ ...withoutPath, install_surface_kind: 'app_bundled' })
        .success,
    ).toBe(true);
    // NOTE: install_path inherits ToolProvenance's canonicalization posture — its `.+` tail does
    // NOT structurally reject a mid-path `..` or whitespace; deep `..` resolution is a Ring 1
    // obligation (so this suite asserts only what the primitive actually enforces).
  });

  it('rejects injected mint / value / policy fields AND the adjacent axis field-names (.strict())', () => {
    for (const extra of [
      { audit_chain_link_hash: `sha256:${'a'.repeat(64)}` },
      { producer: 'kernel_tool_installation_resolver' },
      { evidence_refs: [] },
      // the adjacent tool-axis field-names are NOT fields here (install_surface_kind is the real one)
      { manager_kind: 'mise' },
      { install_source_kind: 'homebrew' },
      { tier: 'write-local' },
      { tier: 'forbidden' },
      { approval_required_for: true },
      { value: 'secret' },
      { forbidden: true },
    ]) {
      expect(toolInstallationSchema.safeParse({ ...base, ...extra }).success).toBe(false);
    }
  });

  it('pins source_provenance.authority to tool_installation_declaration and rejects every evidence-authority value', () => {
    expect(
      toolInstallationSchema.safeParse({
        ...base,
        source_provenance: { ...baseProvenance, extra: 'x' },
      }).success,
    ).toBe(false);
    // a sibling entity's declaration authority is also rejected
    expect(
      toolInstallationSchema.safeParse({
        ...base,
        source_provenance: {
          authority: 'tool_provider_declaration',
          observed_at: baseProvenance.observed_at,
        },
      }).success,
    ).toBe(false);
    for (const authority of evidenceAuthoritySchema.options) {
      expect(
        toolInstallationSchema.safeParse({
          ...base,
          source_provenance: { authority, observed_at: baseProvenance.observed_at },
        }).success,
      ).toBe(false);
    }
  });

  // RECORDED accept-and-trap (ADR 0068): tool_installation_id is entityIdSchema, which accepts a
  // raw machine-identifier shape — Ring 0 cannot reject it (a Ring-0 denylist would violate
  // inv. 1). Keeping it opaque/derived is a Ring 1 producer obligation, mirroring
  // ToolProvider.tool_provider_id / HostProfile.host_profile_id. (Not a gitleaks-token shape.)
  it('RECORDED accept-and-trap: a tool_installation_id set to a raw machine-identifier shape is ACCEPTED at Ring 0', () => {
    expect(
      toolInstallationSchema.safeParse({ ...base, tool_installation_id: rawPlatformUuid }).success,
    ).toBe(true);
  });

  it('lists the eight non-optional fields as required in the generated schema (install_path omitted)', () => {
    const schema = JSON.parse(
      readFileSync(new URL('../generated/ToolInstallation.schema.json', import.meta.url), 'utf8'),
    ) as { required: string[] };
    expect(schema.required).toEqual([
      'schema_version',
      'tool_installation_id',
      'tool_provider_id',
      'tool_name',
      'version',
      'install_surface_kind',
      'installation_state',
      'source_provenance',
    ]);
  });
});
