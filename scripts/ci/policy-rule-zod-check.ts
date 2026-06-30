#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { policyRuleSchema } from '../../packages/schemas/src/entities/policy-rule.ts';

type JsonRecord = Record<string, unknown>;

const [snapshotPath, bindingPath, displayPath = snapshotPath] = process.argv.slice(2);

if (!snapshotPath || !bindingPath) {
  process.stderr.write(
    'usage: policy-rule-zod-check.ts <snapshot-yaml-path> <binding-json-path> [display-path]\n',
  );
  process.exit(1);
}

let failed = false;

function fail(message: string): void {
  process.stderr.write(`  ✗ ${displayPath}: ${message}\n`);
  failed = true;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function record(value: unknown, label: string): JsonRecord {
  if (isRecord(value)) {
    return value;
  }
  fail(`${label} must be a mapping`);
  return {};
}

function optionalRecord(value: unknown, label: string): JsonRecord | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  return record(value, label);
}

function stringValue(value: unknown, label: string): string {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  fail(`${label} must be a non-empty string`);
  return '';
}

function booleanFlag(value: unknown): boolean {
  return value === true;
}

function stringArray(value: unknown, label: string): string[] {
  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
    return value;
  }
  fail(`${label} must be a string array`);
  return [];
}

function kebab(value: string): string {
  return value.replaceAll('_', '-');
}

function normalizeSha256(value: string): string {
  return value.startsWith('sha256:') ? value.slice('sha256:'.length) : value;
}

const policy = record(JSON.parse(readFileSync(0, 'utf8')), 'policy');
const binding = record(JSON.parse(readFileSync(bindingPath, 'utf8')), 'snapshot binding');
const schemaRefs = record(policy.schema_refs, 'schema_refs');
const defaults = record(policy.operation_class_defaults, 'operation_class_defaults');
const provenance = record(policy.provenance, 'provenance');
const snapshotDigest = `sha256:${createHash('sha256')
  .update(readFileSync(snapshotPath))
  .digest('hex')}`;
const bindingDigest = stringValue(
  binding.source_policy_sha256,
  'snapshot_binding.source_policy_sha256',
);
if (normalizeSha256(bindingDigest) !== normalizeSha256(snapshotDigest)) {
  fail(
    `snapshot_binding.source_policy_sha256 must match snapshot digest ${snapshotDigest}, found ${bindingDigest}`,
  );
}
const sourcePolicyPath = stringValue(
  binding.source_policy_path,
  'snapshot_binding.source_policy_path',
);
const observedAt = stringValue(provenance.approved_at, 'provenance.approved_at');
const schemaVersion = stringValue(
  schemaRefs.policy_rule_schema_version,
  'schema_refs.policy_rule_schema_version',
);

let checkedCount = 0;

for (const [operationClass, rawRule] of Object.entries(defaults)) {
  const rule = record(rawRule, `operation_class_defaults.${operationClass}`);
  const approvalDetails = optionalRecord(
    rule.approval_required_details,
    `operation_class_defaults.${operationClass}.approval_required_details`,
  );
  const requiredEvidence = optionalRecord(
    rule.required_pre_execution_evidence,
    `operation_class_defaults.${operationClass}.required_pre_execution_evidence`,
  );

  const approval =
    approvalDetails === undefined
      ? {
          approval_required: false,
          approval_path_allowed: false,
        }
      : {
          approval_required: true,
          approval_path_allowed: true,
          required_grant_kind: stringValue(
            approvalDetails.required_grant_kind,
            `operation_class_defaults.${operationClass}.approval_required_details.required_grant_kind`,
          ),
          allowed_grant_kinds: stringArray(
            record(
              approvalDetails.grant_kind_compatibility,
              `operation_class_defaults.${operationClass}.approval_required_details.grant_kind_compatibility`,
            ).allowed_grant_kinds,
            `operation_class_defaults.${operationClass}.approval_required_details.grant_kind_compatibility.allowed_grant_kinds`,
          ),
          producer_allowlist: stringArray(
            approvalDetails.producer_allowlist,
            `operation_class_defaults.${operationClass}.approval_required_details.producer_allowlist`,
          ),
          dashboard_visibility: stringValue(
            approvalDetails.dashboard_visibility,
            `operation_class_defaults.${operationClass}.approval_required_details.dashboard_visibility`,
          ),
          single_use: approvalDetails.single_use === true,
          evidence_bound_scope: stringValue(
            approvalDetails.evidence_bound_scope,
            `operation_class_defaults.${operationClass}.approval_required_details.evidence_bound_scope`,
          ),
        };

  const candidate = {
    schema_version: schemaVersion,
    policy_rule_id: `policy-rule:hcs:${kebab(operationClass)}`,
    operation_class: operationClass,
    tier: stringValue(rule.default_tier, `operation_class_defaults.${operationClass}.default_tier`),
    classification_basis: stringValue(
      rule.primary_classification,
      `operation_class_defaults.${operationClass}.primary_classification`,
    ),
    requires_active_lease: booleanFlag(rule.requires_active_lease),
    requires_deletion_authority: booleanFlag(rule.requires_deletion_authority),
    requires_typed_provider_evidence: requiredEvidence?.typed_provider_evidence_required === true,
    approval,
    valid_until_ceiling:
      approvalDetails === undefined
        ? 'not_applicable'
        : stringValue(
            approvalDetails.valid_until_ceiling,
            `operation_class_defaults.${operationClass}.approval_required_details.valid_until_ceiling`,
          ),
    valid_until_ceiling_source_ref:
      approvalDetails === undefined
        ? 'not_applicable'
        : stringValue(
            approvalDetails.valid_until_ceiling_source_ref,
            `operation_class_defaults.${operationClass}.approval_required_details.valid_until_ceiling_source_ref`,
          ),
    source_provenance: {
      authority: 'system_config_live_policy',
      source_policy_path: sourcePolicyPath,
      source_policy_sha256: snapshotDigest,
      source_policy_sha256_basis: 'live_policy_blob',
      observed_at: observedAt,
    },
  };

  const parsed = policyRuleSchema.safeParse(candidate);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const issuePath = issue.path.length > 0 ? issue.path.join('.') : '<root>';
      fail(`PolicyRule projection for ${operationClass} failed at ${issuePath}: ${issue.message}`);
    }
    continue;
  }

  checkedCount += 1;
}

if (failed) {
  process.exit(1);
}

process.stdout.write(`  ✓ PolicyRule Zod projection OK (${checkedCount} rules)\n`);
