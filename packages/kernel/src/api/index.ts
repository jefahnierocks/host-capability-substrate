/**
 * @hcs/kernel — Ring 1 public API surface.
 *
 * THIS FILE IS THE ONLY LEGAL IMPORT PATH FOR RING 2.
 *
 * Per the implementation charter §Package boundary enforcement:
 *
 *   "packages/adapters/** cannot import from packages/kernel/src/** except
 *    through the declared public API surface (packages/kernel/src/api/)."
 *
 * That rule is enforced twice, deliberately:
 *
 *   1. `scripts/ci/boundary-check.sh` rule 2 greps for deep kernel imports in
 *      Ring 2 and subtracts the `/api/` path. That check went three months
 *      without executing once — it used a PCRE lookahead under `grep -E`,
 *      exited rc=2, and the error was silenced. Repaired in PR #93.
 *   2. This package's `exports` map. It publishes `.` and `./api` and nothing
 *      else, so `import "@hcs/kernel/src/policy/x"` is unresolvable at
 *      runtime — Node refuses it before any CI gate has an opinion.
 *
 * The second mechanism is the durable one. A grep can regress silently; a
 * missing exports entry cannot. Do not add a `"./src/*"` or wildcard entry to
 * the exports map to make an import work — that would convert a hard boundary
 * back into a linted one. `packages/kernel/tests/api-surface.test.ts` asserts
 * this and will fail if it happens.
 *
 * Ring 1 imports Ring 0 (`@hcs/schemas`) and nothing above it.
 *
 * Empty by design at this commit: this is the workspace scaffold. The first
 * service to land here is the read-only policy-snapshot loader, assigned by
 * ADR 0060 §Ring-1 policy/gateway loader and with its checkpoint-level test
 * obligation specified by ADR 0061 (reject at the digest-verification step,
 * not merely at the final Decision).
 */

export {};
