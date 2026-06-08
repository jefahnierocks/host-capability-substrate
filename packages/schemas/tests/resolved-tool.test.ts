import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { evidenceAuthoritySchema, resolvedToolSchema } from '../src/index.ts';

// A raw machine-identifier shape (hex + hyphens) — all chars are valid entityIdSchema
// chars, and NOT a gitleaks-token shape, so it is safe as a committed literal.
const rawPlatformUuid = '564D5E2A-1234-5678-9ABC-DEF012345678';

const baseProvenance = {
  authority: 'resolved_tool_declaration',
  observed_at: '2026-06-07T00:00:00Z',
} as const;

const base = {
  schema_version: '0.1.0',
  resolved_tool_id: 'resolved-tool:hcs:node-terminal-1',
  tool_name: 'node',
  tool_installation_id: 'tool-installation:hcs:node-24.3.0',
  execution_context_id: 'execution-context:hcs:terminal-1',
  workspace_id: 'workspace:hcs:acme',
  resolution_basis_kind: 'workspace_pin',
  resolution_state: 'active',
  source_provenance: baseProvenance,
} as const;

describe('ResolvedTool schema (ADR 0069 / D-067)', () => {
  it('validates a well-formed ResolvedTool', () => {
    const rt = resolvedToolSchema.parse(base);
    expect(rt.tool_name).toBe('node');
    expect(rt.resolution_basis_kind).toBe('workspace_pin');
    expect(rt.resolution_state).toBe('active');
    expect(rt.source_provenance.authority).toBe('resolved_tool_declaration');
  });

  it('accepts each resolution_basis_kind / resolution_state value, rejects adjacent-axis values, and ACCEPTS the shared `unknown` sentinel', () => {
    for (const resolution_basis_kind of [
      'path_order',
      'workspace_pin',
      'explicit_override',
      'single_candidate',
      'fallback',
      'unknown',
    ] as const) {
      expect(resolvedToolSchema.safeParse({ ...base, resolution_basis_kind }).success).toBe(true);
    }
    for (const resolution_state of ['active', 'retired'] as const) {
      expect(resolvedToolSchema.safeParse({ ...base, resolution_state }).success).toBe(true);
    }
    // resolution_basis_kind (WHY it won) is DISJOINT from install_surface_kind (WHERE it lives):
    // the SURFACE-ONLY install_surface_kind values reject as a basis...
    for (const bad of [
      'manager_shim',
      'app_bundled',
      'host_path',
      'devcontainer',
      'cloud_image',
      'setup_script',
    ]) {
      expect(resolvedToolSchema.safeParse({ ...base, resolution_basis_kind: bad }).success).toBe(
        false,
      );
    }
    // ...as do source (manager_kind) and mechanism (install_source_kind) values.
    for (const bad of ['mise', 'homebrew', 'npm', 'pip', 'project_local']) {
      expect(resolvedToolSchema.safeParse({ ...base, resolution_basis_kind: bad }).success).toBe(
        false,
      );
    }
    // CARVE-OUT: `unknown` is the universal house sentinel shared by all four axis enums —
    // it is a VALID resolution_basis_kind value and must NOT be rejected as a surface value.
    expect(
      resolvedToolSchema.safeParse({ ...base, resolution_basis_kind: 'unknown' }).success,
    ).toBe(true);
    // resolution_state is active|retired only.
    expect(resolvedToolSchema.safeParse({ ...base, resolution_state: 'deprecated' }).success).toBe(
      false,
    );
  });

  it('tool_name (the query) pins both directions: named accept + whitespace/URI/path/secret rejects', () => {
    for (const tool_name of ['node', 'python3', 'ripgrep', 'rust-analyzer']) {
      expect(resolvedToolSchema.safeParse({ ...base, tool_name }).success).toBe(true);
    }
    for (const tool_name of ['no de', 'op://x', '/usr/bin/node', 'a:b', 'n'.repeat(65)]) {
      expect(resolvedToolSchema.safeParse({ ...base, tool_name }).success).toBe(false);
    }
  });

  it('workspace_id is optional; workspace_pin-with-id and path_order-without-id both accept (Ring 0 does NOT cross-constrain basis vs context)', () => {
    const { workspace_id: _omitted, ...withoutWs } = base;
    // a bare-surface (no workspace) resolution accepts
    expect(resolvedToolSchema.safeParse(withoutWs).success).toBe(true);
    // the worked example: path_order omits workspace_id; workspace_pin carries it — both accept
    expect(
      resolvedToolSchema.safeParse({ ...withoutWs, resolution_basis_kind: 'path_order' }).success,
    ).toBe(true);
    expect(
      resolvedToolSchema.safeParse({ ...base, resolution_basis_kind: 'workspace_pin' }).success,
    ).toBe(true);
    // Ring 0 does NOT cross-constrain basis vs context: a workspace_pin WITHOUT workspace_id
    // still accepts at Ring 0 (basis<->context cross-consistency is a Ring 1 obligation, inv. 1).
    expect(
      resolvedToolSchema.safeParse({ ...withoutWs, resolution_basis_kind: 'workspace_pin' })
        .success,
    ).toBe(true);
  });

  it('rejects injected mint / value / policy fields AND the three adjacent axis field-names (.strict())', () => {
    for (const extra of [
      { audit_chain_link_hash: `sha256:${'a'.repeat(64)}` },
      { producer: 'kernel_resolved_tool_resolver' },
      { evidence_refs: [] },
      // the three OTHER tool-axis field-names are NOT fields here (resolution_basis_kind is the real one)
      { manager_kind: 'mise' },
      { install_source_kind: 'homebrew' },
      { install_surface_kind: 'host_path' },
      { tier: 'write-local' },
      { tier: 'forbidden' },
      { approval_required_for: true },
      { value: 'secret' },
      { forbidden: true },
    ]) {
      expect(resolvedToolSchema.safeParse({ ...base, ...extra }).success).toBe(false);
    }
  });

  it('pins source_provenance.authority to resolved_tool_declaration and rejects every evidence-authority value', () => {
    expect(
      resolvedToolSchema.safeParse({
        ...base,
        source_provenance: { ...baseProvenance, extra: 'x' },
      }).success,
    ).toBe(false);
    // a sibling entity's declaration authority is also rejected
    expect(
      resolvedToolSchema.safeParse({
        ...base,
        source_provenance: {
          authority: 'tool_installation_declaration',
          observed_at: baseProvenance.observed_at,
        },
      }).success,
    ).toBe(false);
    for (const authority of evidenceAuthoritySchema.options) {
      expect(
        resolvedToolSchema.safeParse({
          ...base,
          source_provenance: { authority, observed_at: baseProvenance.observed_at },
        }).success,
      ).toBe(false);
    }
  });

  // RECORDED accept-and-trap (ADR 0069): resolved_tool_id is entityIdSchema, which accepts a
  // raw machine-identifier shape — Ring 0 cannot reject it (a Ring-0 denylist would violate
  // inv. 1). Keeping it opaque/derived is a Ring 1 producer obligation, mirroring
  // ToolInstallation/ToolProvider/HostProfile. (Not a gitleaks-token shape.)
  it('RECORDED accept-and-trap: a resolved_tool_id set to a raw machine-identifier shape is ACCEPTED at Ring 0', () => {
    expect(
      resolvedToolSchema.safeParse({ ...base, resolved_tool_id: rawPlatformUuid }).success,
    ).toBe(true);
  });

  it('lists the eight non-optional fields as required in the generated schema (workspace_id omitted)', () => {
    const schema = JSON.parse(
      readFileSync(new URL('../generated/ResolvedTool.schema.json', import.meta.url), 'utf8'),
    ) as { required: string[] };
    expect(schema.required).toEqual([
      'schema_version',
      'resolved_tool_id',
      'tool_name',
      'tool_installation_id',
      'execution_context_id',
      'resolution_basis_kind',
      'resolution_state',
      'source_provenance',
    ]);
  });
});
