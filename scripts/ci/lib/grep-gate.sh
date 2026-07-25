#!/usr/bin/env bash
# grep-gate.sh — make grep-based gates fail closed.
#
# THE DEFECT CLASS THIS EXISTS TO PREVENT
#
# Every grep gate in this repo was written as:
#
#     if grep -rE "$pattern" "$path" 2>/dev/null; then err "violation"; fi
#
# grep has three exit codes, not two:
#   0 — matches found
#   1 — no matches
#   2 — ERROR (bad pattern, unreadable path, unknown option)
#
# `if` treats 1 and 2 identically as false, and `2>/dev/null` deletes the
# diagnostic. So a gate whose pattern is malformed reports "no violations
# found" and prints its success line — forever, in CI as well as locally.
#
# This was not hypothetical. `boundary-check.sh` rule 2 (the rule enforcing
# charter invariants 1 and 3) used a PCRE lookahead `(?!api/)` under `grep -E`,
# which BSD grep rejects with "repetition-operator operand invalid" and rc=2.
# The rule never executed once. A planted violation passed green.
#
# Gates route through the helpers below instead. A gate that cannot execute
# is a FAILED gate, never a passed one.
#
# This file is sourced, not executed. Callers must define `err()`.

# grep_gate <argv...>
#   Runs the given command, forwarding its stdout.
#   Returns 0 (matched), 1 (clean), or >=2 (could not execute — diagnosed on
#   stderr rather than swallowed). Callers must not use `2>/dev/null`.
grep_gate() {
  local stdout_file stderr_file rc=0

  stdout_file="$(mktemp "${TMPDIR:-/tmp}/hcs-grep-gate.out.XXXXXX")"
  stderr_file="$(mktemp "${TMPDIR:-/tmp}/hcs-grep-gate.err.XXXXXX")"

  if "$@" >"$stdout_file" 2>"$stderr_file"; then
    rc=0
  else
    rc=$?
  fi

  if [ "$rc" -ge 2 ]; then
    printf '  ✗ GATE ERROR — grep exited %d. This is an execution failure, not "no match".\n' "$rc" >&2
    printf '      argv: %s\n' "$*" >&2
    sed 's/^/      grep: /' "$stderr_file" >&2
  else
    cat "$stdout_file"
  fi

  rm -f "$stdout_file" "$stderr_file"
  return "$rc"
}

# gate_forbid <message> <argv...>
#   The common case: any match is a violation.
#   Fails on match (rc 0) AND on execution error (rc >= 2).
#   Passes only on a clean scan that actually ran (rc 1).
gate_forbid() {
  local message="$1"
  shift
  local rc=0

  grep_gate "$@" || rc=$?

  case "$rc" in
    0) err "$message" ;;
    1) : ;;
    *) err "gate could not execute (grep rc=$rc) — treating as FAILED: $message" ;;
  esac
}
