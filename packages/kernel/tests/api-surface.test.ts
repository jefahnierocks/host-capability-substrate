import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The ring boundary between Ring 2 (adapters, dashboard) and Ring 1 (kernel) is
 * enforced by two independent mechanisms. This suite guards the one that cannot
 * regress silently.
 *
 * `scripts/ci/boundary-check.sh` rule 2 is a grep. Greps fail open: that exact
 * rule used a PCRE lookahead under `grep -E`, exited rc=2, had its diagnostic
 * silenced by `2>/dev/null`, and reported "ring boundaries intact" for three
 * months without ever executing. It was repaired in PR #93, but the class of
 * failure is inherent to grep-based enforcement.
 *
 * The `exports` map is not a grep. If `@hcs/kernel/src/policy/x` is not
 * published, Node refuses to resolve it — no CI gate needs an opinion. These
 * assertions exist so that a future PR cannot quietly widen the map to make a
 * convenient deep import work.
 */

const manifestPath = fileURLToPath(new URL('../package.json', import.meta.url));
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
  name: string;
  type: string;
  exports: Record<string, string>;
};

describe('@hcs/kernel public API surface', () => {
  it('publishes exactly the two documented entry points', () => {
    expect(Object.keys(manifest.exports).sort()).toEqual(['.', './api']);
  });

  it('routes every entry point through src/api/', () => {
    for (const target of Object.values(manifest.exports)) {
      expect(target).toBe('./src/api/index.ts');
    }
  });

  it('publishes no wildcard or deep-path export', () => {
    // A "./src/*" or "./*" entry would make every kernel internal importable
    // from Ring 2, downgrading a hard boundary to a linted one.
    for (const specifier of Object.keys(manifest.exports)) {
      expect(specifier).not.toContain('*');
      expect(specifier).not.toContain('src');
    }
  });

  it('is an ESM package named @hcs/kernel', () => {
    expect(manifest.name).toBe('@hcs/kernel');
    expect(manifest.type).toBe('module');
  });

  it('exposes no runtime symbols yet — the scaffold is deliberately empty', async () => {
    const api = await import('../src/api/index.ts');
    // Ring-1 services land here one at a time, each with its own ADR. The first
    // is the read-only policy-snapshot loader (ADR 0060 / ADR 0061).
    expect(Object.keys(api)).toEqual([]);
  });
});
