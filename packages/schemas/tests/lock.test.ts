import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { evidenceAuthoritySchema, lockSchema } from '../src/index.ts';

// A raw machine-identifier shape (hex + hyphens) — valid entityIdSchema chars, NOT a
// gitleaks-token shape, so it is safe as a committed literal.
const rawPlatformUuid = '564D5E2A-1234-5678-9ABC-DEF012345678';

const baseProvenance = {
  authority: 'lock_declaration',
  observed_at: '2026-06-07T00:00:00Z',
} as const;

const base = {
  schema_version: '0.1.0',
  lock_id: 'lock:hcs:package-manager-global',
  lock_kind: 'package_manager_global',
  held_by_session_id: 'session:hcs:agent-1',
  lock_status: 'held',
  source_provenance: baseProvenance,
} as const;

describe('Lock schema (ADR 0071 / D-069)', () => {
  it('validates a well-formed Lock', () => {
    const l = lockSchema.parse(base);
    expect(l.lock_kind).toBe('package_manager_global');
    expect(l.lock_status).toBe('held');
    expect(l.held_by_session_id).toBe('session:hcs:agent-1');
    expect(l.source_provenance.authority).toBe('lock_declaration');
  });

  it('accepts each lock_kind value and rejects out-of-enum', () => {
    for (const lock_kind of [
      'package_manager_global',
      'host_mutation_global',
      'unknown',
    ] as const) {
      expect(lockSchema.safeParse({ ...base, lock_kind }).success).toBe(true);
    }
    for (const bad of ['global', 'mutex', 'worktree', 'package_manager']) {
      expect(lockSchema.safeParse({ ...base, lock_kind: bad }).success).toBe(false);
    }
  });

  it('accepts each lock_status value and rejects out-of-enum (incl. the shipped lock_state vocab)', () => {
    for (const lock_status of ['held', 'released'] as const) {
      expect(lockSchema.safeParse({ ...base, lock_status }).success).toBe(true);
    }
    // lock_status is held|released — NOT the gitWorktreeLockStateSchema vocab
    // (unlocked/locked/held_by_other_session) of the shipped lock_state field.
    for (const bad of ['active', 'locked', 'unlocked', 'held_by_other_session']) {
      expect(lockSchema.safeParse({ ...base, lock_status: bad }).success).toBe(false);
    }
  });

  it('rejects injected mint / value / policy fields, the shipped lock_state, AND the Lease-only authorization fields (.strict())', () => {
    for (const extra of [
      { audit_chain_link_hash: `sha256:${'a'.repeat(64)}` },
      { producer: 'kernel_lock_resolver' },
      { evidence_refs: [] },
      { tier: 'write-local' },
      { tier: 'forbidden' },
      { approval_required_for: true },
      // the shipped same-name field (GitWorktreeObservation.payload.lock_state) is NOT a field here:
      { lock_state: 'locked' },
      // the Lease-only authorization fields are NOT fields here (Lock is not a Lease bypass):
      { scope: { worktree_path: '/x' } },
      { force_break_grant_id: 'approval-grant:hcs:1' },
      { value: 'secret' },
      { forbidden: true },
    ]) {
      expect(lockSchema.safeParse({ ...base, ...extra }).success).toBe(false);
    }
  });

  it('pins source_provenance.authority to lock_declaration and rejects every evidence-authority value', () => {
    expect(
      lockSchema.safeParse({ ...base, source_provenance: { ...baseProvenance, extra: 'x' } })
        .success,
    ).toBe(false);
    // a sibling entity's declaration authority is also rejected
    expect(
      lockSchema.safeParse({
        ...base,
        source_provenance: {
          authority: 'artifact_declaration',
          observed_at: baseProvenance.observed_at,
        },
      }).success,
    ).toBe(false);
    for (const authority of evidenceAuthoritySchema.options) {
      expect(
        lockSchema.safeParse({
          ...base,
          source_provenance: { authority, observed_at: baseProvenance.observed_at },
        }).success,
      ).toBe(false);
    }
  });

  // RECORDED accept-and-trap (ADR 0071): lock_id is entityIdSchema, which accepts a raw
  // machine-identifier shape — Ring 0 cannot reject it (a Ring-0 denylist would violate inv. 1).
  // Keeping it opaque/derived is a Ring 1 producer obligation, mirroring the storage-primitive peers.
  it('RECORDED accept-and-trap: a lock_id set to a raw machine-identifier shape is ACCEPTED at Ring 0', () => {
    expect(lockSchema.safeParse({ ...base, lock_id: rawPlatformUuid }).success).toBe(true);
  });

  it('lists the six fields as required in the generated schema (no optional fields)', () => {
    const schema = JSON.parse(
      readFileSync(new URL('../generated/Lock.schema.json', import.meta.url), 'utf8'),
    ) as { required: string[] };
    expect(schema.required).toEqual([
      'schema_version',
      'lock_id',
      'lock_kind',
      'held_by_session_id',
      'lock_status',
      'source_provenance',
    ]);
  });
});
