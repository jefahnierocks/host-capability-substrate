#!/usr/bin/env bash
# run-policy-loader-rejection-fixtures.sh — negative fixtures for policy snapshot loader gates.

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
tmp_dir="$(mktemp -d "${TMPDIR:-/tmp}/hcs-policy-loader-fixture.XXXXXX")"

cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

snapshot_src="$repo_root/policies/generated-snapshot/tiers.yaml"
binding_src="$repo_root/policies/generated-snapshot/snapshot-binding.json"
schema_ref_fields=(
  operation_shape_schema_version
  decision_schema_version
  approval_grant_schema_version
  lease_schema_version
  run_schema_version
  principal_schema_version
  session_schema_version
  policy_rule_schema_version
)

make_case() {
  local name="$1"
  local case_dir="$tmp_dir/$name"
  mkdir -p "$case_dir"
  cp "$snapshot_src" "$case_dir/tiers.yaml"
  cp "$binding_src" "$case_dir/snapshot-binding.json"
  refresh_binding "$case_dir"
}

refresh_binding() {
  local case_dir="$1"
  ruby - "$case_dir/tiers.yaml" "$case_dir/snapshot-binding.json" <<'RUBY'
require 'digest'
require 'json'

snapshot_path, binding_path = ARGV
binding = JSON.parse(File.read(binding_path))
binding['snapshot_file'] = snapshot_path
binding['source_policy_sha256'] = "sha256:#{Digest::SHA256.file(snapshot_path).hexdigest}"
File.write(binding_path, "#{JSON.pretty_generate(binding)}\n")
RUBY
}

run_policy_lint() {
  local case_dir="$1"
  (
    cd "$repo_root"
    ruby scripts/ci/policy-snapshot-compat-check.rb "$case_dir" || exit
    while IFS= read -r path; do
      ruby -ryaml -rjson -e 'puts JSON.generate(YAML.safe_load(File.read(ARGV.fetch(0)), permitted_classes: [], aliases: false))' "$path" |
        node --experimental-strip-types scripts/ci/policy-rule-zod-check.ts \
          "$path" \
          "$case_dir/snapshot-binding.json" \
          "$path" || exit
    done < <(find "$case_dir" -type f \( -name "*.yaml" -o -name "*.yml" \) | sort)
  )
}

run_snapshot_binding_check() {
  local case_dir="$1"
  (
    cd "$repo_root"
    ruby scripts/ci/policy-snapshot-binding-check.rb \
      "$case_dir/tiers.yaml" \
      "$case_dir/snapshot-binding.json"
  )
}

run_primary_policy_lint_with_ignored_env() {
  local case_dir="$1"
  (
    cd "$repo_root"
    HCS_POLICY_SNAPSHOT_DIR="$case_dir" \
      HCS_POLICY_SNAPSHOT_BINDING_PATH="$case_dir/snapshot-binding.json" \
      bash scripts/ci/policy-lint.sh
  )
}

run_primary_snapshot_binding_check_with_ignored_env() {
  local case_dir="$1"
  (
    cd "$repo_root"
    HCS_POLICY_SNAPSHOT_PATH="$case_dir/tiers.yaml" \
      HCS_POLICY_BINDING_PATH="$case_dir/snapshot-binding.json" \
      HCS_POLICY_EXPECTED_SOURCE_POLICY_PATH="not/canonical/tiers.yaml" \
      bash scripts/ci/snapshot-binding-check.sh
  )
}

expect_fail() {
  local label="$1"
  local expected="$2"
  shift 2
  local log="$tmp_dir/$label.log"

  if "$@" >"$log" 2>&1; then
    echo "expected $label to fail" >&2
    cat "$log" >&2
    exit 1
  fi

  if ! grep -Fq "$expected" "$log"; then
    echo "$label failed, but did not include expected text: $expected" >&2
    cat "$log" >&2
    exit 1
  fi
}

make_case good
run_policy_lint "$tmp_dir/good" >/dev/null
run_snapshot_binding_check "$tmp_dir/good" >/dev/null

make_case stale-schema
ruby - "$tmp_dir/stale-schema/tiers.yaml" <<'RUBY'
require 'yaml'

path = ARGV.fetch(0)
policy = YAML.safe_load(File.read(path), permitted_classes: [], aliases: false)
policy.fetch('schema_refs')['policy_rule_schema_version'] = '0.0.0'
File.write(path, policy.to_yaml)
RUBY
refresh_binding "$tmp_dir/stale-schema"
expect_fail \
  stale-schema \
  'schema_refs.policy_rule_schema_version must be "0.1.0"' \
  run_policy_lint "$tmp_dir/stale-schema"

for schema_ref_field in "${schema_ref_fields[@]}"; do
  make_case "missing-schema-ref-$schema_ref_field"
  ruby - "$tmp_dir/missing-schema-ref-$schema_ref_field/tiers.yaml" "$schema_ref_field" <<'RUBY'
require 'yaml'

path, schema_ref_field = ARGV
policy = YAML.safe_load(File.read(path), permitted_classes: [], aliases: false)
policy.fetch('schema_refs').delete(schema_ref_field)
File.write(path, policy.to_yaml)
RUBY
  refresh_binding "$tmp_dir/missing-schema-ref-$schema_ref_field"
  expect_fail \
    "missing-schema-ref-$schema_ref_field" \
    "schema_refs.$schema_ref_field must be" \
    run_policy_lint "$tmp_dir/missing-schema-ref-$schema_ref_field"
done

make_case wrong-source-path
ruby - "$tmp_dir/wrong-source-path/snapshot-binding.json" <<'RUBY'
require 'json'

path = ARGV.fetch(0)
binding = JSON.parse(File.read(path))
binding['source_policy_path'] = 'policies/not-canonical/tiers.yaml'
File.write(path, "#{JSON.pretty_generate(binding)}\n")
RUBY
expect_fail \
  wrong-source-path \
  'source_policy_path must be "policies/host-capability-substrate/tiers.yaml"' \
  run_snapshot_binding_check "$tmp_dir/wrong-source-path"

make_case digest-mismatch
ruby - "$tmp_dir/digest-mismatch/snapshot-binding.json" <<'RUBY'
require 'json'

path = ARGV.fetch(0)
binding = JSON.parse(File.read(path))
binding['source_policy_sha256'] = 'sha256:0000000000000000000000000000000000000000000000000000000000000000'
File.write(path, "#{JSON.pretty_generate(binding)}\n")
RUBY
expect_fail \
  digest-mismatch-policy-lint \
  'snapshot_binding.source_policy_sha256 must match snapshot digest' \
  run_policy_lint "$tmp_dir/digest-mismatch"
expect_fail \
  digest-mismatch-snapshot-binding \
  'source_policy_sha256 mismatch' \
  run_snapshot_binding_check "$tmp_dir/digest-mismatch"

make_case digest-mismatch-bare
ruby - "$tmp_dir/digest-mismatch-bare/snapshot-binding.json" <<'RUBY'
require 'json'

path = ARGV.fetch(0)
binding = JSON.parse(File.read(path))
binding['source_policy_sha256'] = '0000000000000000000000000000000000000000000000000000000000000000'
File.write(path, "#{JSON.pretty_generate(binding)}\n")
RUBY
expect_fail \
  digest-mismatch-bare-policy-lint \
  'snapshot_binding.source_policy_sha256 must match snapshot digest' \
  run_policy_lint "$tmp_dir/digest-mismatch-bare"
expect_fail \
  digest-mismatch-bare-snapshot-binding \
  'source_policy_sha256 mismatch' \
  run_snapshot_binding_check "$tmp_dir/digest-mismatch-bare"

run_primary_policy_lint_with_ignored_env "$tmp_dir/digest-mismatch" >/dev/null
run_primary_snapshot_binding_check_with_ignored_env "$tmp_dir/digest-mismatch" >/dev/null

make_case extra-yaml
cp "$snapshot_src" "$tmp_dir/extra-yaml/extra.yaml"
expect_fail \
  extra-yaml \
  'expected only' \
  run_snapshot_binding_check "$tmp_dir/extra-yaml"

echo "  ✓ policy loader rejection fixtures passed"
