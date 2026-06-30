require 'digest'
require 'json'
require 'set'
require 'yaml'

SNAPSHOT_PATH = ARGV.fetch(0)
BINDING_PATH = ARGV.fetch(1)
EXPECTED_SOURCE_POLICY_PATH = 'policies/host-capability-substrate/tiers.yaml'

SCHEMA_VERSION_SOURCES = {
  'operation_shape_schema_version' => [
    'packages/schemas/src/entities/operation-shape.ts',
    'operationShapeSchemaVersionSchema',
  ],
  'decision_schema_version' => [
    'packages/schemas/src/entities/decision.ts',
    'decisionSchemaVersionSchema',
  ],
  'approval_grant_schema_version' => [
    'packages/schemas/src/entities/approval-grant.ts',
    'approvalGrantSchemaVersionSchema',
  ],
  'lease_schema_version' => [
    'packages/schemas/src/entities/lease.ts',
    'leaseSchemaVersionSchema',
  ],
  'run_schema_version' => [
    'packages/schemas/src/entities/run.ts',
    'runSchemaVersionSchema',
  ],
  'principal_schema_version' => [
    'packages/schemas/src/entities/principal.ts',
    'principalSchemaVersionSchema',
  ],
  'session_schema_version' => [
    'packages/schemas/src/entities/session.ts',
    'sessionSchemaVersionSchema',
  ],
  'policy_rule_schema_version' => [
    'packages/schemas/src/entities/policy-rule.ts',
    'policyRuleSchemaVersionSchema',
  ],
}.freeze

$failed = false

def fail_check(message)
  warn "  x #{message}"
  $failed = true
end

def require_file(path)
  return if File.file?(path)

  fail_check("missing #{path}")
end

def normalize_sha256(value)
  value.to_s.sub(/\Asha256:/, '')
end

def commit_sha?(value)
  value.is_a?(String) && value.match?(/\A[a-f0-9]{7,40}\z/)
end

def read_json(path)
  JSON.parse(File.read(path))
rescue JSON::ParserError => e
  fail_check("#{path}: JSON parse failed: #{e.message}")
  {}
end

def read_yaml(path)
  YAML.safe_load(File.read(path), permitted_classes: [], aliases: false)
rescue Psych::Exception => e
  fail_check("#{path}: YAML parse failed: #{e.message}")
  {}
end

def literal_from_zod_source(path, const_name)
  source = File.read(path)
  match = source.match(
    /export\s+const\s+#{Regexp.escape(const_name)}\s*=\s*z\s*\.literal\(\s*['"]([^'"]+)['"]\s*\)/m,
  )
  return match[1] if match

  fail_check("#{path}: could not find #{const_name} literal")
  nil
end

def enum_from_zod_source(path, const_name)
  source = File.read(path)
  match = source.match(
    /export\s+const\s+#{Regexp.escape(const_name)}\s*=\s*z\s*\.enum\(\s*\[(.*?)\]\s*\)/m,
  )
  unless match
    fail_check("#{path}: could not find #{const_name} enum")
    return Set.new
  end

  match[1].scan(/['"]([^'"]+)['"]/).flatten.to_set
end

require_file(SNAPSHOT_PATH)
require_file(BINDING_PATH)

binding = File.file?(BINDING_PATH) ? read_json(BINDING_PATH) : {}
policy = File.file?(SNAPSHOT_PATH) ? read_yaml(SNAPSHOT_PATH) : {}

unless binding['snapshot_file'] == SNAPSHOT_PATH
  fail_check("snapshot_file must be #{SNAPSHOT_PATH.inspect}")
end

unless commit_sha?(binding['system_config_commit'])
  fail_check('system_config_commit must be a 7-40 character Git SHA')
end

unless binding['source_policy_path'] == EXPECTED_SOURCE_POLICY_PATH
  fail_check("source_policy_path must be #{EXPECTED_SOURCE_POLICY_PATH.inspect}")
end

recorded_digest = normalize_sha256(binding['source_policy_sha256'])
unless recorded_digest.match?(/\A[a-f0-9]{64}\z/)
  fail_check('source_policy_sha256 must be a SHA-256 digest, optionally prefixed with sha256:')
end

if File.file?(SNAPSHOT_PATH)
  actual_digest = Digest::SHA256.file(SNAPSHOT_PATH).hexdigest
  if recorded_digest != actual_digest
    fail_check("source_policy_sha256 mismatch: recorded #{recorded_digest}, actual #{actual_digest}")
  end
end

yaml_snapshots = Dir.glob(File.join(File.dirname(SNAPSHOT_PATH), '**', '*.{yaml,yml}')).sort
unless yaml_snapshots == [SNAPSHOT_PATH]
  fail_check("expected only #{SNAPSHOT_PATH} under #{File.dirname(SNAPSHOT_PATH)}/, found #{yaml_snapshots.join(', ')}")
end

unless policy.is_a?(Hash)
  fail_check("#{SNAPSHOT_PATH}: root document must be a mapping")
  policy = {}
end

schema_refs = policy['schema_refs']
if schema_refs.is_a?(Hash)
  schema_refs.each do |field, value|
    next if value.nil?
    next unless SCHEMA_VERSION_SOURCES.key?(field)

    path, const_name = SCHEMA_VERSION_SOURCES.fetch(field)
    expected = literal_from_zod_source(path, const_name)
    next if expected.nil?

    if value != expected
      fail_check("schema_refs.#{field} must be #{expected.inspect}, found #{value.inspect}")
    end
  end
else
  fail_check("#{SNAPSHOT_PATH}: missing schema_refs mapping")
end

operation_classes = enum_from_zod_source(
  'packages/schemas/src/entities/operation-shape.ts',
  'operationShapeOperationClassSchema',
)
defaults = policy['operation_class_defaults']
if defaults.is_a?(Hash)
  snapshot_classes = defaults.keys.to_set
  missing = (operation_classes - snapshot_classes).to_a.sort
  extra = (snapshot_classes - operation_classes).to_a.sort
  fail_check("operation_class_defaults missing #{missing.join(', ')}") unless missing.empty?
  fail_check("operation_class_defaults has unknown #{extra.join(', ')}") unless extra.empty?
else
  fail_check("#{SNAPSHOT_PATH}: missing operation_class_defaults mapping")
end

decision_reason_kinds = enum_from_zod_source(
  'packages/schemas/src/entities/decision.ts',
  'decisionReasonKindSchema',
)

referenced_reason_kinds = []
Array(policy.dig('non_escalable_forbidden_patterns', 'patterns')).each do |pattern|
  next unless pattern.is_a?(Hash)

  referenced_reason_kinds << pattern['reason_kind'] if pattern.key?('reason_kind')
end
Array(policy['cross_record_rules']).each do |rule|
  next unless rule.is_a?(Hash)

  referenced_reason_kinds << rule['cycle_rejection_reason_kind'] if rule.key?('cycle_rejection_reason_kind')
end

referenced_reason_kinds.compact.uniq.sort.each do |reason_kind|
  next if decision_reason_kinds.include?(reason_kind)

  fail_check("reason_kind #{reason_kind.inspect} is not in decisionReasonKindSchema")
end

if $failed
  exit 1
end

puts "  ✓ snapshot binding OK"
puts "  source_policy_sha256=sha256:#{recorded_digest}"
