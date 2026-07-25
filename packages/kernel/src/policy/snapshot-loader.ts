import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { policyRuleSchema } from '@hcs/schemas';
import { parse as parseYaml } from 'yaml';

/**
 * Read-only policy-snapshot loader (Ring 1).
 *
 * Assigned by ADR 0060 §"Provenance verification (B-2; binding Ring-1
 * enforcement requirement)", which states normatively that the Ring-1
 * policy/gateway loader:
 *
 *   - MUST verify `PolicyRule.source_provenance.source_policy_sha256` equals
 *     the digest of the currently bound, verified snapshot ... **before** any
 *     PolicyRule influences a `Decision`; a mismatch rejects the rule; and
 *   - MUST treat the `authority: 'system_config_live_policy'` literal as
 *     carrying **no authority on its own assertion** — authority derives solely
 *     from the digest match ... never from the literal.
 *
 * This module loads and projects. It does not decide. It encodes no
 * `operation_class -> tier` and no `tier -> approval_required` mapping — those
 * live in the snapshot, whose canonical source is system-config (charter
 * inv. 1). Every value below is read from the file; none is authored here.
 *
 * CHECKPOINT ORDER IS PART OF THE CONTRACT
 *
 * The digest is verified BEFORE the bytes are parsed. Never hand unverified
 * bytes to a parser: a parser is an attack surface, and "we validated it after
 * decoding it" is not verification.
 *
 * Note this inverts the order used by the existing CI path, which shells to
 * Ruby to convert YAML->JSON and only then digests
 * (`scripts/ci/policy-lint.sh`, `scripts/ci/policy-rule-zod-check.ts:72,77`).
 * That divergence is deliberate and is why the rejection fixtures are
 * re-derived rather than mirrored — two classifiers that disagree is precisely
 * the duplication hazard inv. 1 exists to prevent, and reconciling them is the
 * follow-up that retires the Ruby port.
 */

/**
 * Ordered rejection checkpoints.
 *
 * ADR 0061 §Follow-up regression coverage makes this enum the testable
 * artifact, not an implementation detail: the loader MUST be shown to reject
 * "at the digest-verification step (an intermediate trajectory checkpoint...),
 * not merely that the final Decision is rejected."
 *
 * A test that only asserts `ok === false` does not discharge that obligation.
 */
export const LOADER_CHECKPOINTS = [
  'binding_manifest',
  'binding_digest',
  'parse',
  'schema_refs',
  'rule_projection',
] as const;

export type LoaderCheckpoint = (typeof LOADER_CHECKPOINTS)[number];

export interface LoadedSnapshot {
  readonly ok: true;
  /** The recomputed digest, `sha256:`-prefixed. Authority derives from this. */
  readonly boundDigest: string;
  readonly sourcePolicyPath: string;
  readonly policyRuleSchemaVersion: string;
  /** Projected rules. Produced ONLY on a fully successful load. */
  readonly rules: readonly unknown[];
}

export interface RejectedSnapshot {
  readonly ok: false;
  /** The checkpoint that refused. Ordered per LOADER_CHECKPOINTS. */
  readonly rejectedAt: LoaderCheckpoint;
  readonly reason: string;
}

export type LoadResult = LoadedSnapshot | RejectedSnapshot;

export interface LoadOptions {
  readonly snapshotPath: string;
  readonly bindingPath: string;
}

function reject(rejectedAt: LoaderCheckpoint, reason: string): RejectedSnapshot {
  return { ok: false, rejectedAt, reason };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeDigest(value: string): string {
  return value.startsWith('sha256:') ? value.slice('sha256:'.length) : value;
}

function kebab(value: string): string {
  return value.replaceAll('_', '-');
}

/**
 * Load and verify the digest-bound policy snapshot.
 *
 * Returns a discriminated result; throws only on programmer error, never on
 * untrusted input. A caller that ignores `ok` gets no rules.
 */
export function loadPolicySnapshot(options: LoadOptions): LoadResult {
  // ---- checkpoint 1: binding_manifest -------------------------------------
  let binding: unknown;
  try {
    binding = JSON.parse(readFileSync(options.bindingPath, 'utf8'));
  } catch (error) {
    return reject('binding_manifest', `unreadable or malformed binding manifest: ${String(error)}`);
  }
  if (!isRecord(binding)) {
    return reject('binding_manifest', 'binding manifest is not an object');
  }
  const boundDigestRaw = binding.source_policy_sha256;
  if (typeof boundDigestRaw !== 'string' || boundDigestRaw.length === 0) {
    return reject('binding_manifest', 'binding manifest lacks a source_policy_sha256 string');
  }
  const sourcePolicyPath = binding.source_policy_path;
  if (typeof sourcePolicyPath !== 'string' || sourcePolicyPath.length === 0) {
    return reject('binding_manifest', 'binding manifest lacks a source_policy_path string');
  }

  // ---- checkpoint 2: binding_digest ---------------------------------------
  // Raw bytes. Before any parse. This is the checkpoint ADR 0061 names.
  let rawBytes: Buffer;
  try {
    rawBytes = readFileSync(options.snapshotPath);
  } catch (error) {
    return reject('binding_digest', `unreadable snapshot file: ${String(error)}`);
  }
  const recomputed = `sha256:${createHash('sha256').update(rawBytes).digest('hex')}`;
  if (normalizeDigest(recomputed) !== normalizeDigest(boundDigestRaw)) {
    return reject(
      'binding_digest',
      `snapshot digest ${recomputed} does not match bound source_policy_sha256 ${boundDigestRaw}`,
    );
  }

  // ---- checkpoint 3: parse ------------------------------------------------
  let policy: unknown;
  try {
    policy = parseYaml(rawBytes.toString('utf8'));
  } catch (error) {
    return reject('parse', `snapshot is not parseable YAML: ${String(error)}`);
  }
  if (!isRecord(policy)) {
    return reject('parse', 'snapshot root is not a mapping');
  }

  // ---- checkpoint 4: schema_refs ------------------------------------------
  const schemaRefs = policy.schema_refs;
  if (!isRecord(schemaRefs)) {
    return reject('schema_refs', 'snapshot lacks a schema_refs mapping');
  }
  const policyRuleSchemaVersion = schemaRefs.policy_rule_schema_version;
  if (typeof policyRuleSchemaVersion !== 'string' || policyRuleSchemaVersion.length === 0) {
    return reject('schema_refs', 'schema_refs lacks policy_rule_schema_version');
  }

  const provenance = policy.provenance;
  if (!isRecord(provenance) || typeof provenance.approved_at !== 'string') {
    return reject('schema_refs', 'snapshot lacks provenance.approved_at');
  }
  const observedAt = provenance.approved_at;

  // ---- checkpoint 5: rule_projection --------------------------------------
  const defaults = policy.operation_class_defaults;
  if (!isRecord(defaults)) {
    return reject('rule_projection', 'snapshot lacks an operation_class_defaults mapping');
  }

  const rules: unknown[] = [];
  for (const [operationClass, rawRule] of Object.entries(defaults)) {
    if (!isRecord(rawRule)) {
      return reject(
        'rule_projection',
        `operation_class_defaults.${operationClass} is not a mapping`,
      );
    }

    const approvalDetails = isRecord(rawRule.approval_required_details)
      ? rawRule.approval_required_details
      : undefined;
    const requiredEvidence = isRecord(rawRule.required_pre_execution_evidence)
      ? rawRule.required_pre_execution_evidence
      : undefined;

    const grantCompat =
      approvalDetails !== undefined && isRecord(approvalDetails.grant_kind_compatibility)
        ? approvalDetails.grant_kind_compatibility
        : undefined;

    const approval =
      approvalDetails === undefined
        ? { approval_required: false, approval_path_allowed: false }
        : {
            approval_required: true,
            approval_path_allowed: true,
            required_grant_kind: approvalDetails.required_grant_kind,
            allowed_grant_kinds: grantCompat?.allowed_grant_kinds,
            producer_allowlist: approvalDetails.producer_allowlist,
            dashboard_visibility: approvalDetails.dashboard_visibility,
            single_use: approvalDetails.single_use === true,
            evidence_bound_scope: approvalDetails.evidence_bound_scope,
          };

    const candidate = {
      schema_version: policyRuleSchemaVersion,
      policy_rule_id: `policy-rule:hcs:${kebab(operationClass)}`,
      operation_class: operationClass,
      tier: rawRule.default_tier,
      classification_basis: rawRule.primary_classification,
      requires_active_lease: rawRule.requires_active_lease === true,
      requires_deletion_authority: rawRule.requires_deletion_authority === true,
      requires_typed_provider_evidence: requiredEvidence?.typed_provider_evidence_required === true,
      approval,
      valid_until_ceiling:
        approvalDetails === undefined ? 'not_applicable' : approvalDetails.valid_until_ceiling,
      valid_until_ceiling_source_ref:
        approvalDetails === undefined
          ? 'not_applicable'
          : approvalDetails.valid_until_ceiling_source_ref,
      source_provenance: {
        // The literal below confers NOTHING (ADR 0060). Authority for this rule
        // comes from the binding_digest checkpoint above having passed; if it
        // had not, execution never reached this line.
        authority: 'system_config_live_policy',
        source_policy_path: sourcePolicyPath,
        source_policy_sha256: recomputed,
        source_policy_sha256_basis: 'live_policy_blob',
        observed_at: observedAt,
      },
    };

    const parsed = policyRuleSchema.safeParse(candidate);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const at = first && first.path.length > 0 ? first.path.join('.') : '<root>';
      return reject(
        'rule_projection',
        `PolicyRule projection for ${operationClass} failed at ${at}: ${first?.message ?? 'unknown'}`,
      );
    }
    rules.push(parsed.data);
  }

  return {
    ok: true,
    boundDigest: recomputed,
    sourcePolicyPath,
    policyRuleSchemaVersion,
    rules,
  };
}
