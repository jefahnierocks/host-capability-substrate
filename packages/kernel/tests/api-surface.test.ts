import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
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
  dependencies?: Record<string, string>;
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

  it('declares every third-party module its source imports', () => {
    // A phantom dependency — importing a package the manifest does not declare —
    // resolves locally through workspace hoisting and fails in CI under `npm ci`.
    // That happened once already: `yaml` was imported with no declaration, local
    // verify passed on stale node_modules, and CI failed at typecheck.
    //
    // Derived from the source, not hand-listed, so it cannot drift.
    const srcDir = fileURLToPath(new URL('../src', import.meta.url));
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith('.ts')) files.push(full);
      }
    };
    walk(srcDir);

    const declared = new Set(Object.keys(manifest.dependencies ?? {}));
    const imported = new Set<string>();
    for (const file of files) {
      for (const m of readFileSync(file, 'utf8').matchAll(/from '([^']+)'/g)) {
        const spec = m[1];
        if (spec === undefined) continue;
        if (spec.startsWith('.') || spec.startsWith('node:')) continue;
        // Scoped packages keep two segments; bare packages keep one.
        const pkg = spec.startsWith('@')
          ? spec.split('/').slice(0, 2).join('/')
          : spec.split('/')[0];
        if (pkg !== undefined) imported.add(pkg);
      }
    }

    expect(imported.size).toBeGreaterThan(0);
    for (const pkg of imported) {
      expect(
        declared,
        `${pkg} is imported but not declared in packages/kernel/package.json`,
      ).toContain(pkg);
    }
  });

  it('is an ESM package named @hcs/kernel', () => {
    expect(manifest.name).toBe('@hcs/kernel');
    expect(manifest.type).toBe('module');
  });

  it('publishes exactly the intended runtime symbols', async () => {
    const api = await import('../src/api/index.ts');
    // Surface lock: adding an export without updating this turns the suite red,
    // so the public API cannot widen by accident.
    expect(Object.keys(api).sort()).toEqual(['LOADER_CHECKPOINTS', 'loadPolicyRules']);
  });

  it('exports no mint, append, consume, or revoke symbol', async () => {
    // charter inv. 4 bars an agent-callable audit-write surface and inv. 7 gates
    // callability of mutating capabilities. Ring 2 can only reach what this
    // barrel publishes, so keeping those verbs off it is structural.
    const api = await import('../src/api/index.ts');
    for (const name of Object.keys(api)) {
      expect(name).not.toMatch(/^(mint|append|consume|revoke)/i);
    }
  });
});
