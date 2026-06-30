#!/usr/bin/env bash
# snapshot-binding-check.sh — validate generated policy snapshot binding.

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

echo "→ snapshot-binding-check"

ruby scripts/ci/policy-snapshot-binding-check.rb \
  policies/generated-snapshot/tiers.yaml \
  policies/generated-snapshot/snapshot-binding.json
