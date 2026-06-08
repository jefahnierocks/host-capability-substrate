import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { secretReferenceSchema } from '../src/index.ts';

const baseProvenance = {
  authority: 'secret_reference_declaration',
  observed_at: '2026-06-07T00:00:00Z',
} as const;

const base = {
  schema_version: '0.1.0',
  secret_reference_id: 'secret-reference:hcs:op-example',
  reference_kind: 'op_uri',
  reference_locator: 'op://vault/item/field',
  source_provenance: baseProvenance,
} as const;

describe('SecretReference schema (ADR 0065 / D-063)', () => {
  it('validates a well-formed op_uri SecretReference', () => {
    const sr = secretReferenceSchema.parse(base);
    expect(sr.reference_kind).toBe('op_uri');
    expect(sr.reference_locator).toBe('op://vault/item/field');
    expect(sr.source_provenance.authority).toBe('secret_reference_declaration');
  });

  it('accepts each reference_kind with a valid locator', () => {
    for (const c of [
      { reference_kind: 'op_uri', reference_locator: 'op://vault/item' },
      { reference_kind: 'op_uri', reference_locator: 'op://vault/item/field' },
      { reference_kind: 'hcs_uri', reference_locator: 'hcs://broker/handle-123' },
      { reference_kind: 'keychain_item', reference_locator: 'keychain://com.acme.service/account' },
      { reference_kind: 'env_var_name', reference_locator: 'MY_SECRET_TOKEN' },
      { reference_kind: 'broker_handle', reference_locator: 'hcs-broker:opaque-handle-1' },
    ] as const) {
      expect(secretReferenceSchema.safeParse({ ...base, ...c }).success).toBe(true);
    }
  });

  it('rejects a mis-shaped / raw-value locator for the STRUCTURED kinds (op_uri, keychain_item)', () => {
    for (const c of [
      { reference_kind: 'op_uri', reference_locator: 'not-a-reference' },
      { reference_kind: 'op_uri', reference_locator: 'op://vault' }, // missing item segment
      { reference_kind: 'op_uri', reference_locator: 'hcs://vault/item' }, // wrong scheme
      { reference_kind: 'keychain_item', reference_locator: 'just-a-value' },
      { reference_kind: 'keychain_item', reference_locator: 'keychain://service' }, // missing account
    ] as const) {
      const r = secretReferenceSchema.safeParse({ ...base, ...c });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues.map((issue) => issue.path.join('.'))).toContain('reference_locator');
      }
    }
  });

  it('rejects a reference_kind / reference_locator scheme mismatch (superRefine)', () => {
    expect(
      secretReferenceSchema.safeParse({
        ...base,
        reference_kind: 'op_uri',
        reference_locator: 'hcs-broker:handle',
      }).success,
    ).toBe(false);
    expect(
      secretReferenceSchema.safeParse({
        ...base,
        reference_kind: 'broker_handle',
        reference_locator: 'op://vault/item',
      }).success,
    ).toBe(false);
  });

  it('does not echo the (possibly secret-shaped) locator in the rejection message (any kind)', () => {
    const sentinel = 'do-not-echo-this-secret-shaped-locator';
    for (const reference_kind of ['op_uri', 'keychain_item', 'broker_handle'] as const) {
      const r = secretReferenceSchema.safeParse({
        ...base,
        reference_kind,
        reference_locator: sentinel,
      });
      expect(r.success).toBe(false);
      if (!r.success) {
        for (const issue of r.error.issues) {
          expect(issue.message).not.toContain(sentinel);
        }
      }
    }
  });

  it('rejects a bare policy-selector / tier token for the SCHEME-PREFIXED kinds; the SecretReference != PolicySelectorValue distinction is structural, NOT a Ring-0 denylist (inv. 1)', () => {
    for (const reference_kind of ['op_uri', 'hcs_uri', 'keychain_item', 'broker_handle'] as const) {
      for (const reference_locator of ['write-destructive', 'forbidden', 'write-host']) {
        expect(
          secretReferenceSchema.safeParse({ ...base, reference_kind, reference_locator }).success,
        ).toBe(false);
      }
    }
    // env_var_name is permissive: `forbidden` is a valid env var NAME and is accepted at
    // Ring 0. Ring 0 embeds NO policy-tier denylist (that would be inv. 1 policy content);
    // the inv. 16 SecretReference != PolicySelectorValue separation is by typed slot.
    expect(
      secretReferenceSchema.safeParse({
        ...base,
        reference_kind: 'env_var_name',
        reference_locator: 'forbidden',
      }).success,
    ).toBe(true);
  });

  it('rejects injected mint / policy / value fields (.strict())', () => {
    const sha256 = `sha256:${'0'.repeat(64)}`;
    for (const extra of [
      { audit_chain_link_hash: sha256 },
      { producer: 'mint_api' },
      { evidence_refs: [] },
      { tier: 'write-host' },
      { approval_required_for: true },
      { grant_scope: 'broad' },
      { max_uses: 1 },
      { operation_class: 'read_only_diagnostic' },
      { reference_value: 'anything' },
      { value: 'anything' },
    ]) {
      expect(secretReferenceSchema.safeParse({ ...base, ...extra }).success).toBe(false);
    }
  });

  it('accepts credential_source_ref present, absent, or null (optional FK)', () => {
    expect(
      secretReferenceSchema.safeParse({
        ...base,
        credential_source_ref: 'credential-source:hcs:op-1',
      }).success,
    ).toBe(true);
    expect(secretReferenceSchema.safeParse({ ...base, credential_source_ref: null }).success).toBe(
      true,
    );
    expect(secretReferenceSchema.safeParse(base).success).toBe(true); // absent
  });

  it('rejects the wrong source_provenance.authority literal and a non-strict provenance', () => {
    expect(
      secretReferenceSchema.safeParse({
        ...base,
        source_provenance: { ...baseProvenance, authority: 'capability_registry' },
      }).success,
    ).toBe(false);
    expect(
      secretReferenceSchema.safeParse({
        ...base,
        source_provenance: { ...baseProvenance, extra: 'x' },
      }).success,
    ).toBe(false);
  });

  // RECORDED accept-and-trap (ADR 0065; mirrors ADR 0063 argv-secret-inlining). Token-shaped
  // values are built by RUNTIME CONCATENATION so no committed literal trips
  // scripts/ci/forbidden-string-scan.sh check #2. `op://...` is an allowed reference form.
  it('RECORDED accept-and-trap: PERMISSIVE kinds ACCEPT a token-shaped locator at Ring 0 (env_var_name / broker_handle / hcs_uri tail) — the deferred Ring 1 deep check', () => {
    const awsKey = `AKIA${'A'.repeat(16)}`;
    const ghToken = `ghp_${'a'.repeat(36)}`;
    for (const c of [
      { reference_kind: 'env_var_name', reference_locator: awsKey },
      { reference_kind: 'broker_handle', reference_locator: `hcs-broker:${ghToken}` },
      { reference_kind: 'hcs_uri', reference_locator: `hcs://${ghToken}` },
    ] as const) {
      expect(secretReferenceSchema.safeParse({ ...base, ...c }).success).toBe(true);
    }
  });

  it('lists credential_source_ref as nullable, optional (absent from required) in the generated schema', () => {
    const schema = JSON.parse(
      readFileSync(new URL('../generated/SecretReference.schema.json', import.meta.url), 'utf8'),
    ) as { required: string[] };
    expect(schema.required).not.toContain('credential_source_ref');
    expect(schema.required).toEqual([
      'schema_version',
      'secret_reference_id',
      'reference_kind',
      'reference_locator',
      'source_provenance',
    ]);
  });
});
