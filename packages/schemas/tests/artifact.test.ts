import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { artifactSchema, evidenceAuthoritySchema } from '../src/index.ts';

const digest = `sha256:${'a'.repeat(64)}`;
// A raw machine-identifier shape (hex + hyphens) — valid entityIdSchema chars, NOT a
// gitleaks-token shape, so it is safe as a committed literal.
const rawPlatformUuid = '564D5E2A-1234-5678-9ABC-DEF012345678';

const baseProvenance = {
  authority: 'artifact_declaration',
  observed_at: '2026-06-07T00:00:00Z',
} as const;

const base = {
  schema_version: '0.1.0',
  artifact_id: 'artifact:hcs:run-42-diff',
  run_id: 'run:hcs:42',
  artifact_kind: 'command_diff',
  content_sha256: digest,
  byte_size: 2048,
  source_provenance: baseProvenance,
} as const;

describe('Artifact schema (ADR 0070 / D-068)', () => {
  it('validates a well-formed Artifact', () => {
    const a = artifactSchema.parse(base);
    expect(a.artifact_kind).toBe('command_diff');
    expect(a.byte_size).toBe(2048);
    expect(a.content_sha256).toBe(digest);
    expect(a.source_provenance.authority).toBe('artifact_declaration');
  });

  it('accepts each artifact_kind value and rejects out-of-enum', () => {
    for (const artifact_kind of [
      'command_diff',
      'log_chunk',
      'exit_code',
      'signed_summary',
      'unknown',
    ] as const) {
      expect(artifactSchema.safeParse({ ...base, artifact_kind }).success).toBe(true);
    }
    for (const bad of ['blob', 'stdout', 'diff', 'file']) {
      expect(artifactSchema.safeParse({ ...base, artifact_kind: bad }).success).toBe(false);
    }
  });

  it('content_sha256 is a digest ADDRESS: accepts sha256:+64hex, rejects raw hex / non-hex / non-prefixed / empty (never the bytes)', () => {
    expect(
      artifactSchema.safeParse({ ...base, content_sha256: `sha256:${'0'.repeat(64)}` }).success,
    ).toBe(true);
    for (const bad of [
      'a'.repeat(64), // bare hex, no sha256: prefix
      `sha256:${'A'.repeat(64)}`, // uppercase hex (the regex is lowercase-only)
      'sha256:zzz', // non-hex / too short
      'md5:abc', // wrong algorithm prefix
      '', // empty
    ]) {
      expect(artifactSchema.safeParse({ ...base, content_sha256: bad }).success).toBe(false);
    }
  });

  it('byte_size is a non-negative integer fact: accepts 0 / positive int, rejects negative / float / string', () => {
    for (const byte_size of [0, 1, 2048, 1_048_576]) {
      expect(artifactSchema.safeParse({ ...base, byte_size }).success).toBe(true);
    }
    for (const byte_size of [-1, 1.5, '100', Number.NaN]) {
      expect(artifactSchema.safeParse({ ...base, byte_size }).success).toBe(false);
    }
  });

  it('rejects injected mint / value / policy / lifecycle / storage fields by name (.strict())', () => {
    for (const extra of [
      { audit_chain_link_hash: digest },
      { producer: 'kernel_artifact_resolver' },
      { evidence_refs: [] },
      { tier: 'write-local' },
      { tier: 'forbidden' },
      { approval_required_for: true },
      // the deliberately-omitted Options B/C/E fields must NOT be smuggled in:
      { artifact_state: 'active' }, // no lifecycle state (Option E rejected)
      { content: 'the raw diff bytes' }, // no inline content
      { content_ref: 'hcs://store/x' }, // no storage-location pointer (Option B rejected)
      { value: 'secret' }, // no inline value (Option C rejected)
      { payload: { x: 1 } },
    ]) {
      expect(artifactSchema.safeParse({ ...base, ...extra }).success).toBe(false);
    }
  });

  it('pins source_provenance.authority to artifact_declaration and rejects every evidence-authority value', () => {
    expect(
      artifactSchema.safeParse({ ...base, source_provenance: { ...baseProvenance, extra: 'x' } })
        .success,
    ).toBe(false);
    // a sibling entity's declaration authority is also rejected
    expect(
      artifactSchema.safeParse({
        ...base,
        source_provenance: {
          authority: 'resolved_tool_declaration',
          observed_at: baseProvenance.observed_at,
        },
      }).success,
    ).toBe(false);
    for (const authority of evidenceAuthoritySchema.options) {
      expect(
        artifactSchema.safeParse({
          ...base,
          source_provenance: { authority, observed_at: baseProvenance.observed_at },
        }).success,
      ).toBe(false);
    }
  });

  // RECORDED accept-and-trap (ADR 0070): artifact_id is entityIdSchema, which accepts a raw
  // machine-identifier shape — Ring 0 cannot reject it (a Ring-0 denylist would violate inv. 1).
  // Keeping it opaque/derived is a Ring 1 producer obligation, mirroring the tool-chain peers.
  it('RECORDED accept-and-trap: an artifact_id set to a raw machine-identifier shape is ACCEPTED at Ring 0', () => {
    expect(artifactSchema.safeParse({ ...base, artifact_id: rawPlatformUuid }).success).toBe(true);
  });

  it('lists the seven fields as required in the generated schema (no optional fields)', () => {
    const schema = JSON.parse(
      readFileSync(new URL('../generated/Artifact.schema.json', import.meta.url), 'utf8'),
    ) as { required: string[] };
    expect(schema.required).toEqual([
      'schema_version',
      'artifact_id',
      'run_id',
      'artifact_kind',
      'content_sha256',
      'byte_size',
      'source_provenance',
    ]);
  });
});
