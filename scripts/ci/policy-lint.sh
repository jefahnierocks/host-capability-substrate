#!/usr/bin/env bash
# policy-lint.sh — validate HCS policy snapshot policy-shape compatibility.
#
# Canonical live policy lives in system-config. This repo owns only the
# generated snapshot fixture and its compatibility with HCS schemas.
# Live-to-vendored source binding is checked by snapshot-binding-check.sh.

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

snapshot_dir="policies/generated-snapshot"
snapshot_binding="policies/generated-snapshot/snapshot-binding.json"

echo "→ policy-lint"

if [ ! -d "$snapshot_dir" ]; then
  echo "  ✗ missing $snapshot_dir/" >&2
  exit 1
fi

if find policies -maxdepth 1 -type f \( -name "*.yaml" -o -name "*.yml" \) 2>/dev/null | grep -q .; then
  echo "  ✗ live policy YAML found at policies/ root — canonical location is system-config" >&2
  exit 1
fi

if ! find "$snapshot_dir" -type f \( -name "*.yaml" -o -name "*.yml" \) 2>/dev/null | grep -q .; then
  echo "  ✓ no generated snapshot YAML present; snapshot compatibility checks skipped"
  exit 0
fi

if [ ! -f "$snapshot_binding" ]; then
  echo "  ✗ missing $snapshot_binding" >&2
  exit 1
fi

ruby scripts/ci/policy-snapshot-compat-check.rb "$snapshot_dir"

while IFS= read -r path; do
  rel="${path#./}"
  ruby -ryaml -rjson -e 'puts JSON.generate(YAML.safe_load(File.read(ARGV.fetch(0)), permitted_classes: [], aliases: false))' "$path" |
    node --experimental-strip-types scripts/ci/policy-rule-zod-check.ts \
      "$path" \
      "$snapshot_binding" \
      "$rel"
done < <(find "$snapshot_dir" -type f \( -name "*.yaml" -o -name "*.yml" \) | sort)

echo "  ✓ generated policy snapshot compatibility OK"
