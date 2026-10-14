#!/usr/bin/env bash
# scripts/ci/shellcheck-scan.sh
# Runs shellcheck on every shell script in the repo.
# Wired into `just verify` so warnings surface in CI from commit 1.

set -euo pipefail

# ShellCheck is a required verify gate. Refuse before any external command so
# the missing-tool regression can exercise this entrypoint with an empty PATH.
if ! command -v shellcheck >/dev/null 2>&1; then
  echo "→ shellcheck-scan" >&2
  echo "  ✗ shellcheck not installed — run: mise install during reviewed setup" >&2
  exit 1
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

echo "→ shellcheck-scan"

# Exercise the real missing-tool branch on every gate run. The hermetic child
# exits above before root resolution or this self-test; no bypass flag is needed.
missing_tool_refusal_self_test() {
  local fixture_output fixture_status=0
  fixture_output="$(env -i PATH=/dev/null "$BASH" \
    "$repo_root/scripts/ci/shellcheck-scan.sh" 2>&1)" || fixture_status=$?
  if [ "$fixture_status" -ne 1 ] || [[ "$fixture_output" != *"shellcheck not installed"* ]]; then
    echo "  ✗ shellcheck missing-tool self-test failed: expected refusal, got exit $fixture_status" >&2
    return 1
  fi
}
missing_tool_refusal_self_test

# Find all shell scripts by extension AND shebang
targets=()
while IFS= read -r f; do
  [ -f "$f" ] || continue
  targets+=("$f")
done < <(
  {
    find scripts -type f \( -name '*.sh' -o -name '*.bash' \) 2>/dev/null
    # Also shebang-detected
    find .claude/hooks scripts -type f 2>/dev/null | while read -r g; do
      [ -f "$g" ] || continue
      case "$g" in
        *.sh|*.bash) continue ;;
      esac
      first=$(head -1 "$g" 2>/dev/null || true)
      if [[ "$first" == '#!'*bash* || "$first" == '#!'*sh* ]]; then
        echo "$g"
      fi
    done
  } | sort -u
)

if [ ${#targets[@]} -eq 0 ]; then
  echo "  (no shell scripts found)"
  exit 0
fi

fail=0
for t in "${targets[@]}"; do
  # -e SC2155 informational; focus on warning+
  if ! shellcheck -x -S warning "$t"; then
    fail=1
  fi
done

if [ $fail -eq 0 ]; then
  echo "  ✓ shellcheck clean on ${#targets[@]} scripts"
  exit 0
else
  echo "✗ shellcheck FAILED" >&2
  exit 1
fi
