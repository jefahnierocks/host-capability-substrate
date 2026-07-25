#!/usr/bin/env bash
# boundary-check.sh — enforce the four-ring import discipline.
#
# Rings (see docs/host-capability-substrate/implementation-charter.md):
#   Ring 0 — packages/schemas
#   Ring 1 — packages/kernel
#   Ring 2 — packages/adapters/**, packages/dashboard
#   Ring 3 — .agents/skills, docs, AGENTS.md, CLAUDE.md, PLAN.md, etc.
#
# At Phase 0a most packages are empty (.gitkeep only). This script confirms the
# layout is correct and will catch ring violations once code lands.

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

fail=0
note() { printf "  %s\n" "$*"; }
err() { printf "  ✗ %s\n" "$*" >&2; fail=1; }

# shellcheck source=scripts/ci/lib/grep-gate.sh
. "$repo_root/scripts/ci/lib/grep-gate.sh"

echo "→ boundary-check"

# 1. Ring directories exist
for dir in \
  packages/schemas \
  packages/kernel \
  packages/adapters/mcp-stdio \
  packages/adapters/mcp-http \
  packages/adapters/dashboard-http \
  packages/adapters/cli \
  packages/adapters/claude-hooks \
  packages/adapters/codex-hooks \
  packages/dashboard \
  packages/evals \
  packages/fixtures; do
  if [ ! -d "$dir" ]; then
    err "missing ring directory: $dir"
  fi
done

# 2. Ring 2 (adapters) must not import Ring 1 (kernel) private internals
#    except through packages/kernel/src/api/ (public API).
#
#    Two stages, deliberately. The single-pattern form needs a negative
#    lookahead, which is PCRE — `grep -E` is ERE and rejects it with rc=2.
#    That is precisely how this rule sat dead: see scripts/ci/lib/grep-gate.sh.
#    Match every deep kernel import, then subtract the /api/ ones in bash, so
#    an execution failure in stage 1 can still be distinguished from "clean".
if [ -d packages/adapters ]; then
  rule2_rc=0
  rule2_hits="$(grep_gate grep -rE "from ['\"]@hcs/kernel(/src)?/" packages/adapters)" || rule2_rc=$?

  if [ "$rule2_rc" -ge 2 ]; then
    err "rule 2 could not execute (grep rc=$rule2_rc) — treating as FAILED"
  elif [ "$rule2_rc" -eq 0 ]; then
    rule2_private="$(printf '%s\n' "$rule2_hits" | grep -v "@hcs/kernel/api/" || true)"
    rule2_private="$(printf '%s\n' "$rule2_private" | sed '/^[[:space:]]*$/d')"
    if [ -n "$rule2_private" ]; then
      printf '%s\n' "$rule2_private" >&2
      err "adapters importing kernel private internals (use @hcs/kernel/api instead)"
    fi
  fi
fi

# 3. Ring 1 (kernel) must not import Ring 2 (adapters) at all
if [ -d packages/kernel ]; then
  gate_forbid "kernel importing adapters — Ring 1 cannot depend on Ring 2" \
    grep -rE "from ['\"]@hcs/adapters" packages/kernel
  gate_forbid "kernel importing dashboard — Ring 1 cannot depend on Ring 2" \
    grep -rE "from ['\"]@hcs/dashboard" packages/kernel
fi

# 4. Ring 0 (schemas) must not import anywhere above Ring 0
if [ -d packages/schemas ]; then
  gate_forbid "schemas importing kernel/adapters/dashboard — Ring 0 must be leaf" \
    grep -rE "from ['\"]@hcs/(kernel|adapters|dashboard)" packages/schemas
fi

# 5. No universal-shell tool names registered anywhere.
#    Same two-stage shape as rule 2: the `| grep -v` pipeline would otherwise
#    discard a stage-1 execution failure behind the filter's exit status.
rule5_rc=0
rule5_hits="$(grep_gate grep -rE "\"(bash\.run|shell\.exec|exec\.unsafe_shell)\"" packages/ docs/)" || rule5_rc=$?

if [ "$rule5_rc" -ge 2 ]; then
  err "rule 5 could not execute (grep rc=$rule5_rc) — treating as FAILED"
elif [ "$rule5_rc" -eq 0 ]; then
  rule5_real="$(printf '%s\n' "$rule5_hits" | grep -v "unsafe_shell_proposal" || true)"
  rule5_real="$(printf '%s\n' "$rule5_real" | sed '/^[[:space:]]*$/d')"
  if [ -n "$rule5_real" ]; then
    printf '%s\n' "$rule5_real" >&2
    err "universal shell execution tool name detected outside of stigmatized proposal"
  fi
fi

if [ $fail -eq 0 ]; then
  note "✓ ring boundaries intact"
  exit 0
else
  echo "✗ boundary-check FAILED" >&2
  exit 1
fi
