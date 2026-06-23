#!/usr/bin/env bash
# policy-lint.sh — validate HCS policy snapshot policy-shape compatibility.
#
# Canonical live policy lives in system-config. This repo owns only the
# generated snapshot fixture and its compatibility with HCS schemas.
# Live-to-vendored source binding is checked by snapshot-binding-check.sh.

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

OPERATION_SHAPE_SCHEMA = 'packages/schemas/generated/OperationShape.schema.json'
DECISION_SCHEMA = 'packages/schemas/generated/Decision.schema.json'
POLICY_RULE_SCHEMA = 'packages/schemas/generated/PolicyRule.schema.json'
BOUNDARY_OBSERVATION_SCHEMA = 'packages/schemas/generated/BoundaryObservation.schema.json'

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

def duration_seconds(value)
  return nil unless value.is_a?(String)

  match = value.match(/\AP(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?\z/)
  return nil unless match

  days, hours, minutes, seconds = match.captures.map { |capture| capture&.to_i || 0 }
  total = (days * 24 * 60 * 60) + (hours * 60 * 60) + (minutes * 60) + seconds
  total.positive? ? total : nil
end

def validate_boundary_dimension_freshness(path, policy, boundary_dimensions)
  freshness = policy['boundary_dimension_freshness_windows']
  unless mapping?(freshness)
    lint_error(path, 'missing required boundary_dimension_freshness_windows mapping')
    return
  end

  lint_error(path, 'boundary_dimension_freshness_windows.schema_ref must be set') unless present?(freshness['schema_ref'])
  unless present?(freshness['policy_source_ref'])
    lint_error(path, 'boundary_dimension_freshness_windows.policy_source_ref must be set')
  end
  unless duration_seconds(freshness['default_window'])
    lint_error(path, 'boundary_dimension_freshness_windows.default_window must be a positive ISO-8601 day/hour/minute/second duration')
  end
  unless present?(freshness['default_window_source_ref'])
    lint_error(path, 'boundary_dimension_freshness_windows.default_window_source_ref must be set')
  end

  windows = freshness['windows']
  unless mapping?(windows)
    lint_error(path, 'boundary_dimension_freshness_windows.windows must be a mapping')
    return
  end

  snapshot_dimensions = windows.keys.to_set
  missing = (boundary_dimensions - snapshot_dimensions).to_a.sort
  extra = (snapshot_dimensions - boundary_dimensions).to_a.sort

  lint_error(path, "boundary_dimension_freshness_windows.windows missing #{missing.join(', ')}") unless missing.empty?
  lint_error(path, "boundary_dimension_freshness_windows.windows has unknown #{extra.join(', ')}") unless extra.empty?

  windows.sort.each do |dimension, entry|
    unless mapping?(entry)
      lint_error(path, "boundary_dimension_freshness_windows.windows.#{dimension} must be a mapping")
      next
    end

    unless duration_seconds(entry['valid_until_window'])
      lint_error(path, "boundary_dimension_freshness_windows.windows.#{dimension}.valid_until_window must be a positive ISO-8601 day/hour/minute/second duration")
    end
    unless present?(entry['source_ref'])
      lint_error(path, "boundary_dimension_freshness_windows.windows.#{dimension}.source_ref must be set")
    end
  end
end

snapshot_dir = ARGV.fetch(0)
operation_shape_schema = JSON.parse(File.read(OPERATION_SHAPE_SCHEMA))
decision_schema = JSON.parse(File.read(DECISION_SCHEMA))
policy_rule_schema = JSON.parse(File.read(POLICY_RULE_SCHEMA))
boundary_observation_schema = JSON.parse(File.read(BOUNDARY_OBSERVATION_SCHEMA))

operation_classes = collect_property_values(operation_shape_schema, 'operation_class').to_set
decision_reason_kinds = collect_property_values(decision_schema, 'reason_kind').to_set
operation_shape_versions = collect_property_values(operation_shape_schema, 'schema_version').to_set
decision_versions = collect_property_values(decision_schema, 'schema_version').to_set
policy_rule_versions = collect_property_values(policy_rule_schema, 'schema_version').to_set
boundary_dimensions = collect_property_values(boundary_observation_schema, 'boundary_dimension').to_set

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

  schema_refs = policy['schema_refs']
  if mapping?(schema_refs)
    expected_operation_version = operation_shape_versions.to_a.fetch(0)
    expected_decision_version = decision_versions.to_a.fetch(0)
    expected_policy_rule_version = policy_rule_versions.to_a.fetch(0)

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

    if schema_refs['policy_rule_schema_version'] != expected_policy_rule_version
      lint_error(
        rel,
        "schema_refs.policy_rule_schema_version must be #{expected_policy_rule_version.inspect}",
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

  validate_boundary_dimension_freshness(rel, policy, boundary_dimensions)
end

exit(@failed ? 1 : 0)
RUBY

while IFS= read -r path; do
  rel="${path#./}"
  ruby -ryaml -rjson -e 'puts JSON.generate(YAML.safe_load(File.read(ARGV.fetch(0)), permitted_classes: [], aliases: false))' "$path" |
    node --experimental-strip-types scripts/ci/policy-rule-zod-check.ts \
      "$path" \
      "policies/generated-snapshot/snapshot-binding.json" \
      "$rel"
done < <(find "$snapshot_dir" -type f \( -name "*.yaml" -o -name "*.yml" \) | sort)

echo "  ✓ generated policy snapshot compatibility OK"
