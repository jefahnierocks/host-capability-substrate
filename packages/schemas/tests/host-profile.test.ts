import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { evidenceAuthoritySchema, hostProfileSchema } from '../src/index.ts';

const digest = `sha256:${'a'.repeat(64)}`;
// A raw macOS IOPlatformUUID shape (hex + hyphens). NOT a gitleaks-token shape,
// so it is safe as a committed literal (forbidden-string-scan flags sk-/ghp_/xoxb-/AKIA).
const rawPlatformUuid = '564D5E2A-1234-5678-9ABC-DEF012345678';

const baseProvenance = {
  authority: 'host_profile_declaration',
  observed_at: '2026-06-07T00:00:00Z',
} as const;

const base = {
  schema_version: '0.1.0',
  host_profile_id: 'host-profile:hcs:dev-1',
  host_state: 'active',
  os_name: 'macos',
  os_version: '26.5',
  arch: 'arm64',
  host_identity: { kind: 'platform_uuid_sha256', digest },
  source_provenance: baseProvenance,
} as const;

describe('HostProfile schema (ADR 0066 / D-064)', () => {
  it('validates a well-formed HostProfile', () => {
    const hp = hostProfileSchema.parse(base);
    expect(hp.os_name).toBe('macos');
    expect(hp.host_identity.digest).toBe(digest);
    expect(hp.source_provenance.authority).toBe('host_profile_declaration');
  });

  it('accepts each enum value and rejects out-of-enum', () => {
    for (const host_state of ['active', 'retired'] as const) {
      expect(hostProfileSchema.safeParse({ ...base, host_state }).success).toBe(true);
    }
    for (const os_name of ['macos', 'linux', 'windows', 'unknown'] as const) {
      expect(hostProfileSchema.safeParse({ ...base, os_name }).success).toBe(true);
    }
    for (const arch of ['arm64', 'x86_64', 'unknown'] as const) {
      expect(hostProfileSchema.safeParse({ ...base, arch }).success).toBe(true);
    }
    for (const kind of ['platform_uuid_sha256', 'install_id_sha256', 'unknown'] as const) {
      expect(
        hostProfileSchema.safeParse({ ...base, host_identity: { kind, digest } }).success,
      ).toBe(true);
    }
    for (const [field, value] of [
      ['host_state', 'deprecated'],
      ['os_name', 'freebsd'],
      ['arch', 'riscv64'],
    ] as const) {
      expect(hostProfileSchema.safeParse({ ...base, [field]: value }).success).toBe(false);
    }
    expect(
      hostProfileSchema.safeParse({ ...base, host_identity: { kind: 'serial_sha256', digest } })
        .success,
    ).toBe(false);
  });

  it('stores the host fingerprint only as a sha256 digest — a raw UUID/serial cannot land in host_identity.digest', () => {
    for (const bad of [rawPlatformUuid, 'C02XXXXXJGH7', `${'a'.repeat(64)}`, 'sha256:NOTHEX']) {
      expect(
        hostProfileSchema.safeParse({
          ...base,
          host_identity: { kind: 'platform_uuid_sha256', digest: bad },
        }).success,
      ).toBe(false);
    }
    // kind: unknown still requires a real sha256 digest (the digest is always present)
    expect(
      hostProfileSchema.safeParse({ ...base, host_identity: { kind: 'unknown', digest } }).success,
    ).toBe(true);
    expect(
      hostProfileSchema.safeParse({ ...base, host_identity: { kind: 'unknown', digest: '' } })
        .success,
    ).toBe(false);
  });

  it('rejects os_version whitespace / URI / path / op:// shapes (a version fact, not a sink)', () => {
    for (const os_version of [
      '26 5',
      '/etc/x',
      'op://v/i/f',
      'https://x',
      'a:b',
      `${'9'.repeat(65)}`,
    ]) {
      expect(hostProfileSchema.safeParse({ ...base, os_version }).success).toBe(false);
    }
    for (const os_version of ['26.5', '14.5.1', '6.8.0-91-generic', '11_0']) {
      expect(hostProfileSchema.safeParse({ ...base, os_version }).success).toBe(true);
    }
  });

  it('rejects injected mint / value / policy fields (.strict() on the envelope and host_identity)', () => {
    for (const extra of [
      { audit_chain_link_hash: digest },
      { producer: 'mint_api' },
      { evidence_refs: [] },
      { platform_uuid: rawPlatformUuid },
      { serial: 'C02XXXXXJGH7' },
      { machine_id: rawPlatformUuid },
      { tier: 'write-host' },
      { tier: 'forbidden' },
      { approval_required_for: true },
      { approval_required_for: { grant_kind: 'operator_dashboard' } },
      { grant_scope: 'broad' },
      { max_uses: 1 },
      { forbidden: true },
    ]) {
      expect(hostProfileSchema.safeParse({ ...base, ...extra }).success).toBe(false);
    }
  });

  it('pins source_provenance.authority to host_profile_declaration and rejects every evidence-authority value', () => {
    expect(
      hostProfileSchema.safeParse({
        ...base,
        source_provenance: { ...baseProvenance, extra: 'x' },
      }).success,
    ).toBe(false);
    for (const authority of evidenceAuthoritySchema.options) {
      expect(
        hostProfileSchema.safeParse({
          ...base,
          source_provenance: { authority, observed_at: baseProvenance.observed_at },
        }).success,
      ).toBe(false);
    }
  });

  // RECORDED accept-and-trap (ADR 0066): host_profile_id is entityIdSchema, which accepts a
  // raw-IOPlatformUUID shape — Ring 0 cannot reject it. Keeping host_profile_id opaque/derived
  // is a Ring 1 producer obligation. (The hex-UUID is not a gitleaks-token shape.)
  it('RECORDED accept-and-trap: a host_profile_id set to a raw machine-identifier shape is ACCEPTED at Ring 0', () => {
    expect(hostProfileSchema.safeParse({ ...base, host_profile_id: rawPlatformUuid }).success).toBe(
      true,
    );
  });

  it('lists all eight fields as required in the generated schema (no optional fields)', () => {
    const schema = JSON.parse(
      readFileSync(new URL('../generated/HostProfile.schema.json', import.meta.url), 'utf8'),
    ) as { required: string[] };
    expect(schema.required).toEqual([
      'schema_version',
      'host_profile_id',
      'host_state',
      'os_name',
      'os_version',
      'arch',
      'host_identity',
      'source_provenance',
    ]);
  });
});
