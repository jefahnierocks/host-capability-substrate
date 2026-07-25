import { loadBoundPolicyRules, resolveBoundSnapshotPath } from '@hcs/kernel/api';

/**
 * `hcs policy status` — read-only.
 *
 * Renders what the kernel loader reports about the bound policy snapshot.
 *
 * THIS ADAPTER DECIDES NOTHING (charter inv. 1). It performs no classification,
 * applies no tier logic, and reaches no verdict of its own. Every value printed
 * below comes from the loader's result object; the adapter's entire job is
 * formatting. If you find yourself adding an `if` on a tier name here, that
 * logic belongs in Ring 1 and this file is the wrong place for it.
 *
 * It imports only `@hcs/kernel/api`. The kernel's exports map publishes that
 * path and nothing deeper, so a kernel internal is not reachable from here even
 * by accident (ERR_PACKAGE_PATH_NOT_EXPORTED).
 */

export interface CommandResult {
  readonly exitCode: number;
  readonly lines: readonly string[];
}

function pad(value: string, width: number): string {
  return value.length >= width ? value : value + ' '.repeat(width - value.length);
}

export function policyStatus(): CommandResult {
  const result = loadBoundPolicyRules();
  const lines: string[] = [];

  lines.push(`snapshot  ${resolveBoundSnapshotPath()}`);

  if (!result.ok) {
    lines.push(`status    REJECTED at ${result.rejectedAt}`);
    lines.push(`reason    ${result.reason}`);
    // Non-zero: a snapshot the kernel refuses is an operator-visible failure,
    // not an informational note.
    return { exitCode: 1, lines };
  }

  lines.push(`status    loaded`);
  lines.push(`digest    ${result.observedDigest}  (observed, not verified — see ADR 0079)`);
  lines.push(`schema    policy_rule_schema_version ${result.policyRuleSchemaVersion}`);
  lines.push(`rules     ${result.rules.length}`);
  lines.push('');
  lines.push(
    `  ${pad('OPERATION CLASS', 32)}${pad('TIER', 19)}${pad('APPROVAL', 10)}${pad('PATH', 7)}CEILING`,
  );

  for (const rule of result.rules) {
    lines.push(
      `  ${pad(rule.operation_class, 32)}${pad(rule.tier, 19)}` +
        `${pad(String(rule.approval.approval_required), 10)}` +
        `${pad(String(rule.approval.approval_path_allowed), 7)}` +
        `${rule.valid_until_ceiling}`,
    );
  }

  return { exitCode: 0, lines };
}
