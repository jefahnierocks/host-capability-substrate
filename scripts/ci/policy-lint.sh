#!/usr/bin/env bash
# policy-lint.sh — validate HCS policy snapshot compatibility.
#
# Canonical live policy lives in system-config. This repo owns only the
# generated snapshot fixture and its compatibility with HCS schemas.

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

snapshot_dir="${HCS_POLICY_SNAPSHOT_DIR:-policies/generated-snapshot}"

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

ruby - "$snapshot_dir" <<'RUBY'
require 'json'
require 'set'
require 'yaml'

SNAPSHOT_SOURCE_PATH = 'policies/host-capability-substrate/tiers.yaml'
OPERATION_SHAPE_SCHEMA = 'packages/schemas/generated/OperationShape.schema.json'
DECISION_SCHEMA = 'packages/schemas/generated/Decision.schema.json'

@failed = false

def lint_error(path, message)
  warn "  ✗ #{path}: #{message}"
  @failed = true
end

def present?(value)
  !value.nil? && !(value.respond_to?(:empty?) && value.empty?)
end

def mapping?(value)
  value.is_a?(Hash)
end

def sha256?(value)
  value.is_a?(String) && value.match?(/\A(?:sha256:)?[a-f0-9]{64}\z/)
end

def commit_sha?(value)
  value.is_a?(String) && value.match?(/\A[a-f0-9]{7,40}\z/)
end

def collect_property_values(node, property_name)
  values = []
  case node
  when Hash
    property = node.dig('properties', property_name)
    if property.is_a?(Hash)
      values << property['const'] if property.key?('const')
      values.concat(property['enum']) if property['enum'].is_a?(Array)
    end
    node.each_value { |child| values.concat(collect_property_values(child, property_name)) }
  when Array
    node.each { |child| values.concat(collect_property_values(child, property_name)) }
  end
  values.compact.uniq
end

def collect_reason_kind_values(node)
  values = []
  case node
  when Hash
    node.each do |key, value|
      if key == 'reason_kind' || key.end_with?('_reason_kind')
        values << value if value.is_a?(String)
        values.concat(value) if value.is_a?(Array)
      else
        values.concat(collect_reason_kind_values(value))
      end
    end
  when Array
    node.each { |child| values.concat(collect_reason_kind_values(child)) }
  end
  values.compact.uniq
end

def relative_path(path)
  path.sub(%r{\A\./}, '')
end

snapshot_dir = ARGV.fetch(0)
operation_shape_schema = JSON.parse(File.read(OPERATION_SHAPE_SCHEMA))
decision_schema = JSON.parse(File.read(DECISION_SCHEMA))

operation_classes = collect_property_values(operation_shape_schema, 'operation_class').to_set
decision_reason_kinds = collect_property_values(decision_schema, 'reason_kind').to_set
operation_shape_versions = collect_property_values(operation_shape_schema, 'schema_version').to_set
decision_versions = collect_property_values(decision_schema, 'schema_version').to_set

Dir.glob(File.join(snapshot_dir, '**', '*.{yaml,yml}')).sort.each do |path|
  rel = relative_path(path)

  begin
    policy = YAML.load_file(path)
  rescue Psych::Exception => e
    lint_error(rel, "YAML parse failed: #{e.message}")
    next
  end

  unless mapping?(policy)
    lint_error(rel, 'snapshot document must be a YAML mapping')
    next
  end

  lint_error(rel, 'missing required root field schema_version') unless present?(policy['schema_version'])

  binding = policy['snapshot_binding']
  unless mapping?(binding)
    lint_error(rel, 'missing required snapshot_binding mapping')
    next
  end

  unless commit_sha?(binding['system_config_commit'])
    lint_error(rel, 'snapshot_binding.system_config_commit must be a Git commit SHA')
  end

  unless binding['source_policy_path'] == SNAPSHOT_SOURCE_PATH
    lint_error(
      rel,
      "snapshot_binding.source_policy_path must be #{SNAPSHOT_SOURCE_PATH.inspect}",
    )
  end

  unless sha256?(binding['source_policy_sha256'])
    lint_error(rel, 'snapshot_binding.source_policy_sha256 must be a sha256 digest')
  end

  if present?(binding['hcs_snapshot_path']) && binding['hcs_snapshot_path'] != rel
    lint_error(rel, "snapshot_binding.hcs_snapshot_path must match #{rel.inspect}")
  end

  schema_refs = policy['schema_refs']
  if mapping?(schema_refs)
    expected_operation_version = operation_shape_versions.to_a.fetch(0)
    expected_decision_version = decision_versions.to_a.fetch(0)

    if schema_refs['operation_shape_schema_version'] != expected_operation_version
      lint_error(
        rel,
        "schema_refs.operation_shape_schema_version must be #{expected_operation_version.inspect}",
      )
    end

    if schema_refs['decision_schema_version'] != expected_decision_version
      lint_error(
        rel,
        "schema_refs.decision_schema_version must be #{expected_decision_version.inspect}",
      )
    end
  else
    lint_error(rel, 'missing required schema_refs mapping')
  end

  defaults = policy['operation_class_defaults']
  if mapping?(defaults)
    snapshot_classes = defaults.keys.to_set
    missing = (operation_classes - snapshot_classes).to_a.sort
    extra = (snapshot_classes - operation_classes).to_a.sort

    lint_error(rel, "operation_class_defaults missing #{missing.join(', ')}") unless missing.empty?
    lint_error(rel, "operation_class_defaults has unknown #{extra.join(', ')}") unless extra.empty?
  else
    lint_error(rel, 'missing required operation_class_defaults mapping')
  end

  collect_reason_kind_values(policy).sort.each do |reason_kind|
    next if decision_reason_kinds.include?(reason_kind)

    lint_error(rel, "reason_kind #{reason_kind.inspect} is not in generated Decision schema")
  end
end

exit(@failed ? 1 : 0)
RUBY

echo "  ✓ generated policy snapshot compatibility OK"
