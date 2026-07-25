import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import {
  LOADER_CHECKPOINTS,
  type LoaderCheckpoint,
  loadPolicySnapshot,
} from '../src/policy/snapshot-loader.ts';

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));
const realSnapshot = join(repoRoot, 'policies/generated-snapshot/tiers.yaml');
const realBinding = join(repoRoot, 'policies/generated-snapshot/snapshot-binding.json');

const scratchDirs: string[] = [];
afterAll(() => {
  for (const dir of scratchDirs) rmSync(dir, { recursive: true, force: true });
});

/** Build an isolated snapshot+binding pair under $TMPDIR. Never mutates the repo. */
function stage(opts: {
  snapshotBody?: string;
  bindingBody?: string;
  /** When true, the binding digest is recomputed to match snapshotBody. */
  rebind?: boolean;
}): { snapshotPath: string; bindingPath: string } {
  const dir = mkdtempSync(join(tmpdir(), 'hcs-loader-'));
  scratchDirs.push(dir);

  const snapshotBody = opts.snapshotBody ?? readFileSync(realSnapshot, 'utf8');
  const snapshotPath = join(dir, 'tiers.yaml');
  writeFileSync(snapshotPath, snapshotBody);

  let bindingBody: string;
  if (opts.bindingBody !== undefined) {
    bindingBody = opts.bindingBody;
  } else {
    const binding = JSON.parse(readFileSync(realBinding, 'utf8')) as Record<string, unknown>;
    if (opts.rebind) {
      binding.source_policy_sha256 = `sha256:${createHash('sha256')
        .update(Buffer.from(snapshotBody))
        .digest('hex')}`;
    }
    bindingBody = JSON.stringify(binding, null, 2);
  }
  const bindingPath = join(dir, 'snapshot-binding.json');
  writeFileSync(bindingPath, bindingBody);

  return { snapshotPath, bindingPath };
}

function rejectedAt(result: ReturnType<typeof loadPolicySnapshot>): LoaderCheckpoint | 'ok' {
  return result.ok ? 'ok' : result.rejectedAt;
}

describe('policy snapshot loader — happy path', () => {
  it('loads the real vendored snapshot and reports the bound digest', () => {
    const result = loadPolicySnapshot({ snapshotPath: realSnapshot, bindingPath: realBinding });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const binding = JSON.parse(readFileSync(realBinding, 'utf8')) as {
      source_policy_sha256: string;
    };
    expect(result.boundDigest).toBe(binding.source_policy_sha256);
    expect(result.policyRuleSchemaVersion).toBe('0.1.0');
    expect(result.rules.length).toBeGreaterThan(0);
  });

  it('projects every operation_class_defaults entry through policyRuleSchema', () => {
    const result = loadPolicySnapshot({ snapshotPath: realSnapshot, bindingPath: realBinding });
    if (!result.ok) throw new Error(`expected load to succeed: ${result.reason}`);
    // Matches the count policy-lint reports today (8 rules).
    expect(result.rules).toHaveLength(8);
  });
});

/**
 * ADR 0061 §Follow-up regression coverage, "Self-asserted resolved digest":
 *
 *   the trust check ... MUST assert the loader rejects at the
 *   digest-verification step (an intermediate trajectory checkpoint, when
 *   `resolved_policy_sha256` != the bound, verified snapshot digest), NOT
 *   merely that the final Decision is rejected.
 *
 * These are the tests that discharge that obligation. Asserting `ok === false`
 * alone would not.
 */
describe('ADR 0061 B-2 — rejection is asserted AT the digest checkpoint', () => {
  it('rejects mutated bytes at binding_digest, not at a later checkpoint', () => {
    const body = `${readFileSync(realSnapshot, 'utf8')}\n# tamper\n`;
    const { snapshotPath, bindingPath } = stage({ snapshotBody: body }); // no rebind
    const result = loadPolicySnapshot({ snapshotPath, bindingPath });

    expect(rejectedAt(result)).toBe('binding_digest');
  });

  it('NEVER produces rules when the digest fails', () => {
    const body = `${readFileSync(realSnapshot, 'utf8')}\n# tamper\n`;
    const { snapshotPath, bindingPath } = stage({ snapshotBody: body });
    const result = loadPolicySnapshot({ snapshotPath, bindingPath });

    expect(result.ok).toBe(false);
    expect(result).not.toHaveProperty('rules');
  });

  it('rejects at binding_digest even when the snapshot is unparseable — digest precedes parse', () => {
    // If ordering ever regressed to parse-first, this would surface as 'parse'.
    const { snapshotPath, bindingPath } = stage({ snapshotBody: 'this: [is: not: valid: yaml' });
    const result = loadPolicySnapshot({ snapshotPath, bindingPath });

    expect(rejectedAt(result)).toBe('binding_digest');
  });

  it('rejects a self-asserted authority literal when the digest does not match', () => {
    // ADR 0060: `authority: system_config_live_policy` carries no authority on
    // its own assertion. The snapshot below still declares it; the digest does
    // not match, so the declaration buys nothing.
    const body = readFileSync(realSnapshot, 'utf8').replace(
      'status: active',
      'status: active # mutated after signing',
    );
    const { snapshotPath, bindingPath } = stage({ snapshotBody: body });
    const result = loadPolicySnapshot({ snapshotPath, bindingPath });

    expect(rejectedAt(result)).toBe('binding_digest');
  });
});

describe('checkpoint ordering is observable and stable', () => {
  it('declares checkpoints in execution order', () => {
    expect([...LOADER_CHECKPOINTS]).toEqual([
      'binding_manifest',
      'binding_digest',
      'parse',
      'schema_refs',
      'rule_projection',
    ]);
  });

  it('rejects a malformed binding manifest before reading the snapshot at all', () => {
    const { snapshotPath, bindingPath } = stage({ bindingBody: '{ not json' });
    expect(rejectedAt(loadPolicySnapshot({ snapshotPath, bindingPath }))).toBe('binding_manifest');
  });

  it('rejects a binding manifest with no digest field', () => {
    const { snapshotPath, bindingPath } = stage({ bindingBody: JSON.stringify({ a: 1 }) });
    expect(rejectedAt(loadPolicySnapshot({ snapshotPath, bindingPath }))).toBe('binding_manifest');
  });

  it('reaches parse only once the digest matches', () => {
    const { snapshotPath, bindingPath } = stage({
      snapshotBody: 'this: [is: not: valid: yaml',
      rebind: true,
    });
    expect(rejectedAt(loadPolicySnapshot({ snapshotPath, bindingPath }))).toBe('parse');
  });

  it('reaches schema_refs only once parse succeeds', () => {
    const { snapshotPath, bindingPath } = stage({
      snapshotBody: 'kind: something\nprovenance:\n  approved_at: "2026-01-01T00:00:00Z"\n',
      rebind: true,
    });
    expect(rejectedAt(loadPolicySnapshot({ snapshotPath, bindingPath }))).toBe('schema_refs');
  });

  it('rejects a stale policy_rule_schema_version at schema_refs, after the digest passed', () => {
    const body = readFileSync(realSnapshot, 'utf8').replace(
      'policy_rule_schema_version: "0.1.0"',
      'policy_rule_schema_version: ""',
    );
    const { snapshotPath, bindingPath } = stage({ snapshotBody: body, rebind: true });
    expect(rejectedAt(loadPolicySnapshot({ snapshotPath, bindingPath }))).toBe('schema_refs');
  });

  it('reaches rule_projection only once schema_refs succeeds', () => {
    const body = readFileSync(realSnapshot, 'utf8').replace(
      /^operation_class_defaults:$/m,
      'operation_class_defaults:\n  bogus_class: not_a_mapping\n#',
    );
    const { snapshotPath, bindingPath } = stage({ snapshotBody: body, rebind: true });
    expect(rejectedAt(loadPolicySnapshot({ snapshotPath, bindingPath }))).toBe('rule_projection');
  });
});

describe('digest normalisation', () => {
  it('accepts a bare-hex bound digest as equivalent to the sha256:-prefixed form', () => {
    const binding = JSON.parse(readFileSync(realBinding, 'utf8')) as Record<string, string>;
    const bare = { ...binding, source_policy_sha256: binding.source_policy_sha256!.slice(7) };
    const { snapshotPath, bindingPath } = stage({ bindingBody: JSON.stringify(bare) });
    const result = loadPolicySnapshot({ snapshotPath, bindingPath });

    expect(result.ok).toBe(true);
  });
});

describe('inv. 1 — the loader classifies nothing', () => {
  it('encodes no operation_class -> tier mapping in kernel source', () => {
    const source = readFileSync(
      fileURLToPath(new URL('../src/policy/snapshot-loader.ts', import.meta.url)),
      'utf8',
    );
    // Tier names must never appear as literals here; they are read from the
    // snapshot, whose canonical source is system-config.
    for (const tier of ['read-only', 'write-scoped', 'write-destructive', 'forbidden']) {
      expect(source).not.toContain(`'${tier}'`);
      expect(source).not.toContain(`"${tier}"`);
    }
  });
});
