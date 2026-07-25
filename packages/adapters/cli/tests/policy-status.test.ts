import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { policyRuleTierSchema } from '@hcs/schemas';
import { describe, expect, it } from 'vitest';
import { policyStatus } from '../src/commands/policy-status.ts';
import { run } from '../src/main.ts';

describe('hcs policy status', () => {
  it('loads the bound snapshot and exits 0', () => {
    const result = policyStatus();
    expect(result.exitCode).toBe(0);
  });

  it('renders every rule the kernel returned', () => {
    const { lines } = policyStatus();
    const body = lines.join('\n');
    expect(body).toContain('status    loaded');
    expect(body).toContain('rules     8');
    for (const cls of ['read_only_diagnostic', 'destructive_git', 'merge_or_push']) {
      expect(body).toContain(cls);
    }
  });

  it('labels the digest as observed, not verified', () => {
    // ADR 0079 cut provenance verification from the loader's scope. The verb
    // must not imply a guarantee the kernel does not make.
    const body = policyStatus().lines.join('\n');
    expect(body).toContain('observed, not verified');
  });
});

describe('dispatch is a closed match, not a permissive lookup', () => {
  it('exits 2 on an unknown verb rather than doing something approximate', () => {
    const result = run(['policy', 'bogus']);
    expect(result.exitCode).toBe(2);
    expect(result.lines.join('\n')).toContain('unknown verb');
  });

  it('exits 0 with usage on no verb', () => {
    expect(run([]).exitCode).toBe(0);
    expect(run([]).lines.join('\n')).toContain('usage: hcs');
  });

  it('does not treat a prefix of a known verb as that verb', () => {
    // `policy` alone is not `policy status`.
    expect(run(['policy']).exitCode).toBe(2);
  });
});

/**
 * charter inv. 1 — adapters translate, they do not classify.
 *
 * Same guard shape as the kernel's, derived from the enum so it cannot drift
 * from the vocabulary it guards. If a tier name ever appears in adapter source,
 * the adapter has started making a policy decision and belongs in Ring 1.
 */
describe('inv. 1 — the adapter authors no policy vocabulary', () => {
  const sources = ['../src/commands/policy-status.ts', '../src/main.ts'].map((rel) =>
    readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, ''),
  );

  it('contains no tier literal in executable code', () => {
    expect(policyRuleTierSchema.options).toHaveLength(5);
    for (const source of sources) {
      for (const tier of policyRuleTierSchema.options) {
        expect(source).not.toContain(tier);
      }
    }
  });

  it('imports the kernel only through its public api path', () => {
    for (const source of sources) {
      for (const match of source.matchAll(/from '(@hcs\/kernel[^']*)'/g)) {
        expect(match[1]).toBe('@hcs/kernel/api');
      }
    }
  });
});
