#!/usr/bin/env bash
# agent-contract-identity-scan.sh — keep default HCS agent-facing surfaces in HCS voice.

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

echo "→ agent-contract-identity-scan"

# Surface list is shared with shared-state-naming-scan.sh — one list, two
# gates, no drift.
# shellcheck source=scripts/ci/lib/agent-facing-surfaces.sh
source "$repo_root/scripts/ci/lib/agent-facing-surfaces.sh"

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

pattern='The Nash Group|Nash Group|(^|[^[:alnum:]_])Nash([^[:alnum:]_]|$)|Covenant|Citadel|Nexus|Shield|Tartan|Philosopher|Judge|Gardener|Explorer|Immortals|Mentors|Watchers|the-covenant|the-citadel|the-nexus|the-shield|the-tartan|parent_l0|ORG-001|SEC-[0-9]{3}|GOV-[0-9]{3}|Principle [0-9]+'

hits="$(grep -nE "$pattern" "${files[@]}" 2>/dev/null || true)"

if [ -n "$hits" ]; then
  printf "%s\n" "$hits" >&2
  echo "✗ default HCS agent-facing surface contains external organizational identifiers" >&2
  echo "  Restate active guidance in HCS-local vocabulary or move provenance to a non-default historical record." >&2
  exit 1
fi

echo "  ✓ default HCS agent-facing surfaces stay in HCS vocabulary"
