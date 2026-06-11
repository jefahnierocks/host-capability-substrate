#!/usr/bin/env bash
# shared-state-naming-scan.sh — D-033 shared-state naming discipline on
# default agent-facing surfaces.
#
# HCS shared state is typed evidence + coordination state + derived retrieval
# index (D-033 / ADR 0019 v3; AGENTS.md §Hard boundaries). Default
# agent-facing surfaces must not name it with "memory"-class aliases. The
# greppable subset gated here, space- or hyphen-separated, case-insensitive:
#
#   agent memory | shared memory | LLM memory | persistent memory |
#   long-term memory | context memory
#
# Known limitations by design (each pinned by a self-test fixture):
#   - Bare "memory" is context-dependent (model-cognition senses such as
#     "model memory" in AGENTS.md §Hard boundaries are legitimate and are a
#     DIFFERENT term) and is NOT gated; reviewer judgment still applies.
#   - Inline-code quoting does NOT exempt: a forbidden alias in backticks on
#     a default surface still teaches the alias. (Contrast doc-pointer-check,
#     which strips code spans — different rule, different semantics.)
#   - Possessive/recast forms ("the agent's memory") are not matched.
#   - The separator is the literal set {space, hyphen} — a trailing `-` in a
#     bracket expression is literal, not a range (settled empirically; fixture
#     15) — so punctuation-joined forms ("agent,memory") are not matched.
#   - Markdown emphasis inside the phrase ("agent **memory**"), multi-line
#     wraps, and unicode/typographic separators are not matched (line-oriented
#     grep; same class as doc-pointer-check's split-pointer false-negative).
# Plurals ARE matched ("agent memories" — "memories" does not contain the
# substring "memory", so the pattern carries memor(y|ies) explicitly).
#
# A line that must quote the forbidden aliases — the D-033 rule restatement
# itself — carries the marker below. The marker exempts ONLY its own line;
# PR review is the abuse control (a marker appearing in a diff is visible),
# the same posture as doc-pointer-check's provenance marker.
#
# An embedded self-test runs on every invocation before the real scan, so the
# negative test can never silently rot.

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

echo "→ shared-state-naming-scan"

# shellcheck source=scripts/ci/lib/agent-facing-surfaces.sh
source "$repo_root/scripts/ci/lib/agent-facing-surfaces.sh"

marker='shared-state-naming-scan: quoted-rule'
pattern='(agent|shared|llm|persistent|long[ -]term|context)[ -]memor(y|ies)'

# scan_one <file> — print "line:text" for each violating line; marker-bearing
# lines are exempt. Prints nothing when clean. -I skips binary files so the
# directory recursion over hook/agent dirs can never emit a bogus
# "Binary file matches" hit.
scan_one() {
  local file="$1"
  grep -nIiE "$pattern" "$file" 2>/dev/null | grep -vF "$marker" || true
}

self_test() {
  local t fail=0 out alias
  t="$(mktemp -d "${TMPDIR:-/tmp}/hcs-naming-selftest.XXXXXX")"

  # Fixtures 1-6 — every forbidden alias must be reported.
  for alias in 'agent memory' 'shared memory' 'LLM memory' \
    'persistent memory' 'long-term memory' 'context memory'; do
    printf 'The store is %s here.\n' "$alias" > "$t/alias.md"
    out="$(scan_one "$t/alias.md")"
    [ -n "$out" ] || { echo "  self-test FAIL: alias not caught: $alias" >&2; fail=1; }
  done

  # Fixture 7 — case variant must be reported.
  printf 'Uses Agent Memory for facts.\n' > "$t/case.md"
  out="$(scan_one "$t/case.md")"
  [ -n "$out" ] || { echo "  self-test FAIL: case variant not caught" >&2; fail=1; }

  # Fixture 8 — hyphenated variant must be reported.
  printf 'A shared-memory store for agents.\n' > "$t/hyphen.md"
  out="$(scan_one "$t/hyphen.md")"
  [ -n "$out" ] || { echo "  self-test FAIL: hyphen variant not caught" >&2; fail=1; }

  # Fixture 9 — canonical names must pass.
  printf 'The evidence and coordination store, shared state, knowledge index, coordination fact, derived summary.\n' > "$t/canonical.md"
  out="$(scan_one "$t/canonical.md")"
  [ -z "$out" ] || { echo "  self-test FAIL: canonical names flagged" >&2; fail=1; }

  # Fixture 10 — model-cognition senses and bare "memory" must pass.
  printf 'Do not use CLI syntax from model memory; cite evidence, not a memory note recalled from memory.\n' > "$t/cognition.md"
  out="$(scan_one "$t/cognition.md")"
  [ -z "$out" ] || { echo "  self-test FAIL: model-cognition sense flagged" >&2; fail=1; }

  # Fixture 11 — a marker-bearing rule-quoting line must pass.
  printf 'Never call it "agent memory" or "shared memory". <!-- %s -->\n' "$marker" > "$t/quoted-rule.md"
  out="$(scan_one "$t/quoted-rule.md")"
  [ -z "$out" ] || { echo "  self-test FAIL: marker-exempt line flagged" >&2; fail=1; }

  # Fixture 12 — the marker exempts ONLY its own line, not the file.
  printf 'rule line. <!-- %s -->\nBut agent memory here must still fail.\n' "$marker" > "$t/marker-scope.md"
  out="$(scan_one "$t/marker-scope.md")"
  [ -n "$out" ] || { echo "  self-test FAIL: marker exempted a different line" >&2; fail=1; }

  # Fixture 13 — backtick quoting must NOT exempt.
  printf 'Call it `agent memory` casually.\n' > "$t/backtick.md"
  out="$(scan_one "$t/backtick.md")"
  [ -n "$out" ] || { echo "  self-test FAIL: backtick quoting exempted an alias" >&2; fail=1; }

  # Fixture 14 — plural alias must be reported ("memories" has no "memory"
  # substring; the pattern carries memor(y|ies) explicitly).
  printf 'Store these in agent memories.\n' > "$t/plural.md"
  out="$(scan_one "$t/plural.md")"
  [ -n "$out" ] || { echo "  self-test FAIL: plural alias not caught" >&2; fail=1; }

  # Fixture 15 — documented limitations pinned: possessive, punctuation
  # separator, and markdown emphasis inside the phrase must all pass clean
  # (false-negatives by design; this fixture keeps them DOCUMENTED behavior,
  # so a pattern change that flips them is caught here first).
  printf "the agent's memory; agent,memory; agent **memory**\n" > "$t/limits.md"
  out="$(scan_one "$t/limits.md")"
  [ -z "$out" ] || { echo "  self-test FAIL: documented-limitation form flagged" >&2; fail=1; }

  rm -rf "$t"
  if [ "$fail" -ne 0 ]; then
    echo "✗ shared-state-naming-scan self-test failed — fix the linter before trusting it" >&2
    exit 1
  fi
}

self_test

files=()
for path in "${agent_facing_paths[@]}"; do
  if [ -f "$path" ]; then
    files+=("$path")
  elif [ -d "$path" ]; then
    while IFS= read -r -d '' file; do
      files+=("$file")
    done < <(find "$path" -type f -print0)
  fi
done

if [ ${#files[@]} -eq 0 ]; then
  echo "  (no default agent-facing files found)"
  exit 0
fi

fail=0
for f in "${files[@]}"; do
  while IFS= read -r hit; do
    [ -n "$hit" ] || continue
    echo "  ✗ $f:$hit" >&2
    fail=1
  done < <(scan_one "$f")
done

if [ "$fail" -ne 0 ]; then
  echo "✗ default agent-facing surface names HCS shared state with a forbidden \"memory\" alias (D-033)" >&2
  echo "  Use the canonical names: \"evidence and coordination store\", \"shared state\"," >&2
  echo "  \"knowledge index\", \"coordination fact\", \"derived summary\". For model-cognition" >&2
  echo "  senses, prefer \"model memory\" phrasing. Only a D-033 rule restatement may carry" >&2
  echo "  the 'shared-state-naming-scan: quoted-rule' marker." >&2
  exit 1
fi

echo "  ✓ default agent-facing surfaces use canonical shared-state names (self-test passed)"
