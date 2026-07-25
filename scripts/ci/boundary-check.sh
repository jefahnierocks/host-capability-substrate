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
#
#    Ring 2 is packages/adapters/** AND packages/dashboard (see header) — the
#    old rule guarded on packages/adapters only, leaving dashboard→kernel
#    unenforced entirely.
#
#    Stage 1 matches every syntax that can reach kernel internals: `from`,
#    bare side-effect `import`, `require()`, and dynamic `import()`, in both
#    the @hcs alias form and relative traversal (`../../kernel/src/x`). The
#    alias-only pattern would miss traversal, which is the likelier form
#    before tsconfig path aliases are wired.
ring2_importers=()
[ -d packages/adapters ] && ring2_importers+=(packages/adapters)
[ -d packages/dashboard ] && ring2_importers+=(packages/dashboard)

if [ ${#ring2_importers[@]} -gt 0 ]; then
  rule2_rc=0
  # The specifier must be QUOTED. Every import form quotes it — `from "x"`,
  # `import "x"`, `require("x")`, `await import("x")` — while prose that names
  # the path in backticks does not. Without this anchor the rule flags its own
  # documentation, which it did the first time it had a real subject.
  rule2_hits="$(grep_gate grep -rE "['\"](@hcs/kernel(/src)?/|[.][.]?/[^'\"]*kernel/src/)" "${ring2_importers[@]}")" || rule2_rc=$?

  if [ "$rule2_rc" -ge 2 ]; then
    err "rule 2 could not execute (grep rc=$rule2_rc) — treating as FAILED"
  elif [ "$rule2_rc" -eq 0 ]; then
    # Subtract the PUBLIC surface. charter:84 declares packages/kernel/src/api/
    # the legal path, so both @hcs/kernel/api/ and @hcs/kernel/src/api/ are
    # permitted — subtracting only the former would flag the charter's own
    # declared public path as a violation.
    # The trailing-slash form alone is WRONG: charter:84 declares
    # `@hcs/kernel/api` legal, and `/api/` only matches deeper paths like
    # `@hcs/kernel/api/policy`. Anchoring on a quote, slash, or end-of-token
    # accepts both the barrel and a deep public path while still rejecting
    # `@hcs/kernel/apifoo`. Found the first time this rule had a real subject.
    rule2_private="$(printf '%s\n' "$rule2_hits" | gate_filter "(@hcs/kernel(/src)?/api([\"'/]|\$)|kernel/src/api/)")"
    if [ -n "$rule2_private" ]; then
      printf '%s\n' "$rule2_private" >&2
      err "Ring 2 importing kernel private internals (use @hcs/kernel/api instead)"
    fi
  fi
fi

# 3. Ring 1 (kernel) must not import Ring 2 (adapters/dashboard).
#    charter:87 carves out ONE exception: "Dashboard view contracts
#    (packages/dashboard/src/contracts/) are importable by kernel for
#    rendering; kernel modules other than rendering helpers must not import
#    dashboard internals." The old rule forbade all of it, contracts included —
#    stricter than the charter, and it would have made the permitted path
#    unbuildable at Ring-1 start.
if [ -d packages/kernel ]; then
  gate_forbid "kernel importing adapters — Ring 1 cannot depend on Ring 2" \
    grep -rE "@hcs/adapters" packages/kernel

  rule3_rc=0
  rule3_hits="$(grep_gate grep -rE "(@hcs/dashboard|[.][.]?/[^\"']*dashboard/src/)" packages/kernel)" || rule3_rc=$?

  if [ "$rule3_rc" -ge 2 ]; then
    err "rule 3 could not execute (grep rc=$rule3_rc) — treating as FAILED"
  elif [ "$rule3_rc" -eq 0 ]; then
    rule3_internals="$(printf '%s\n' "$rule3_hits" | gate_filter "(@hcs/dashboard(/src)?/contracts/|dashboard/src/contracts/)")"
    if [ -n "$rule3_internals" ]; then
      printf '%s\n' "$rule3_internals" >&2
      err "kernel importing dashboard internals — only src/contracts/ is permitted (charter §Package boundary enforcement)"
    fi
  fi
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
  rule5_real="$(printf '%s\n' "$rule5_hits" | gate_filter "unsafe_shell_proposal")"
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
