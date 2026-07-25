import { policyStatus } from './commands/policy-status.ts';

/**
 * `hcs` — read-only CLI adapter (Ring 2).
 *
 * Per ADR 0080: this surface is read-only by construction. It registers no
 * capability, accepts and emits no `OperationShape`, mints and consumes no
 * `ApprovalGrant`, and executes nothing. Adding a verb that mutates host state
 * makes this file class I and gates it behind charter invariant 7.
 *
 * Dispatch is an exhaustive match over a closed verb list — not a lookup that
 * falls through to a default handler — so an unrecognised verb exits non-zero
 * rather than doing something approximate.
 */

const VERBS = ['policy status'] as const;

function usage(): string[] {
  return ['usage: hcs <verb>', '', 'verbs:', ...VERBS.map((v) => `  ${v}`)];
}

export function run(argv: readonly string[]): { exitCode: number; lines: readonly string[] } {
  const verb = argv.join(' ').trim();

  switch (verb) {
    case 'policy status':
      return policyStatus();
    case '':
    case 'help':
    case '--help':
    case '-h':
      return { exitCode: 0, lines: usage() };
    default:
      return { exitCode: 2, lines: [`unknown verb: ${verb}`, '', ...usage()] };
  }
}

const { exitCode, lines } = run(process.argv.slice(2));
for (const line of lines) process.stdout.write(`${line}\n`);
process.exitCode = exitCode;
