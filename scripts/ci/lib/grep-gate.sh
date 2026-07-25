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

  # `|| return 2` is load-bearing. Call sites invoke this as
  # `out="$(grep_gate ...)" || rc=$?`, and bash suppresses errexit inside a
  # function on the left of `||`. Without these guards an unwritable TMPDIR
  # leaves the filenames empty, the redirection below fails, bash returns 1,
  # and the helper's own contract reads that as "clean" — a fail-open path at
  # the first statement of the helper written to abolish fail-open paths.
  # A read-only TMPDIR is ordinary in sandboxes and hardened containers, and
  # verify.sh runs four groups concurrently against the same TMPDIR.
  stdout_file="$(mktemp "${TMPDIR:-/tmp}/hcs-grep-gate.out.XXXXXX")" || {
    printf '  ✗ GATE ERROR — mktemp failed (TMPDIR=%s unwritable?)\n' "${TMPDIR:-/tmp}" >&2
    return 2
  }
  stderr_file="$(mktemp "${TMPDIR:-/tmp}/hcs-grep-gate.err.XXXXXX")" || {
    printf '  ✗ GATE ERROR — mktemp failed (TMPDIR=%s unwritable?)\n' "${TMPDIR:-/tmp}" >&2
    rm -f "$stdout_file"
    return 2
  }

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

# gate_filter <exclude-ERE> [input-on-stdin]
#   Two-stage gates subtract allowed matches from stage 1's hits. Writing that
#   as `... | grep -v X || true` reintroduces the exact defect this file
#   exists to kill, one layer down: `|| true` collapses the filter's rc=2 into
#   rc=1, so a filter that ERRORS silently discards a confirmed stage-1 hit.
#
#   Filters in bash instead of shelling out, so there is no second grep whose
#   exit status can be lost, and no dependency on `grep -v "a\|b"` BRE
#   alternation — another GNU extension that is inert under the BSD grep that
#   CI's macos-latest runner provides.
#
#   Prints surviving lines. Returns 0 always; emptiness is the caller's signal.
gate_filter() {
  local exclude="$1" line
  while IFS= read -r line; do
    [ -z "$line" ] && continue
    if ! printf '%s' "$line" | grep -qE "$exclude"; then
      printf '%s\n' "$line"
    fi
  done
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
