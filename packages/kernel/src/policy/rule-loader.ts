import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import {
  operationShapeOperationClassSchema,
  type PolicyRule,
  policyRuleSchema,
} from '@hcs/schemas';
import { parse as parseYaml } from 'yaml';

/**
 * Ring-1 policy-snapshot RULE-SHAPE loader.
 *
 * Scope, per ADR 0079: parse the vendored snapshot, project each
 * `operation_class_defaults` entry into a `PolicyRule`, and validate it against
 * the Ring-0 schema. Nothing else.
 *
 * NOT IN SCOPE — provenance/digest verification. ADR 0060 §Out of scope
 * expressly declines to authorize "the §Provenance-verification implementation
 * (Ring-1, gated by charter inv. 7)" and defers it to a follow-up gateway ADR
 * that does not yet exist. `scripts/ci/snapshot-binding-check.sh` continues to
 * verify binding integrity in CI. This loader answers a disjoint question —
 * "is the rule shape valid?" — so the two checkers do not overlap and there is
 * no inv-1 duplication surface between them.
 *
 * The digest below is recorded as an OBSERVATION of the bytes this loader read.
 * It is not a verification and confers no authority. Do not add a binding
 * comparison here without the gateway ADR.
 *
 * DERIVE, NEVER INFER
 *
 * An earlier draft of this module derived approval posture from the PRESENCE of
 * an `approval_required_details` block. That is a restatement of policy in
 * kernel source, and it failed open: in YAML, `approval_required_details:` with
 * no value parses to `null`, "not a mapping" read as "absent", and absent
 * projected `approval_required: false` — on a `write-destructive` class.
 *
 * Every field below is read from a place the policy actually declares it. Where
 * policy is silent, this module REJECTS rather than picking a value, with one
 * recorded exception documented at `approvalPathAllowed` below.
 */

export const LOADER_CHECKPOINTS = ['parse', 'schema_refs', 'rule_projection'] as const;
export type LoaderCheckpoint = (typeof LOADER_CHECKPOINTS)[number];

export interface LoadedRules {
  readonly ok: true;
  /** Digest of the bytes read. An observation, NOT a verification. */
  readonly observedDigest: string;
  readonly policyRuleSchemaVersion: string;
  readonly rules: readonly PolicyRule[];
}

export interface RejectedRules {
  readonly ok: false;
  readonly rejectedAt: LoaderCheckpoint;
  readonly reason: string;
}

export type LoadResult = LoadedRules | RejectedRules;

function reject(rejectedAt: LoaderCheckpoint, reason: string): RejectedRules {
  return { ok: false, rejectedAt, reason };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Reduce a thrown value to a label. Never its message — see ADR 0079 §Error hygiene. */
function classify(error: unknown): string {
  const code = (error as NodeJS.ErrnoException | undefined)?.code;
  if (typeof code === 'string') return code;
  return error instanceof Error ? error.name : 'UnknownError';
}

/**
 * Strict boolean read. `"true"` is NOT true.
 *
 * charter §Forbidden patterns (v1.2.0) bars writing boolean-like strings for
 * strict booleans; the corresponding read must be equally strict, or a policy
 * typo silently clears a security-relevant flag. Returns `undefined` when the
 * key is absent so the caller can distinguish "absent" from "declared false".
 */
function strictBoolean(value: unknown): boolean | undefined | 'invalid' {
  if (value === undefined) return undefined;
  return typeof value === 'boolean' ? value : 'invalid';
}

export interface LoadOptions {
  readonly snapshotPath: string;
}

export function loadPolicyRules(options: LoadOptions): LoadResult {
  // ---- checkpoint: parse --------------------------------------------------
  let rawBytes: Buffer;
  try {
    rawBytes = readFileSync(options.snapshotPath);
  } catch (error) {
    return reject('parse', `unreadable snapshot (${classify(error)})`);
  }
  const observedDigest = `sha256:${createHash('sha256').update(rawBytes).digest('hex')}`;

  let policy: unknown;
  try {
    // uniqueKeys guards duplicate-key shadowing; aliases are capped so an
    // anchor bomb cannot expand unbounded.
    policy = parseYaml(rawBytes.toString('utf8'), { uniqueKeys: true, maxAliasCount: 100 });
  } catch (error) {
    return reject('parse', `snapshot is not parseable YAML (${classify(error)})`);
  }
  if (!isRecord(policy)) return reject('parse', 'snapshot root is not a mapping');

  // ---- checkpoint: schema_refs --------------------------------------------
  const schemaRefs = policy.schema_refs;
  if (!isRecord(schemaRefs)) return reject('schema_refs', 'snapshot lacks a schema_refs mapping');
  const policyRuleSchemaVersion = schemaRefs.policy_rule_schema_version;
  if (typeof policyRuleSchemaVersion !== 'string' || policyRuleSchemaVersion.length === 0) {
    return reject('schema_refs', 'schema_refs lacks policy_rule_schema_version');
  }
  const provenance = policy.provenance;
  if (!isRecord(provenance) || typeof provenance.approved_at !== 'string') {
    return reject('schema_refs', 'snapshot lacks provenance.approved_at');
  }
  const sourcePolicyPath = policy.non_authority_notice;
  if (!isRecord(sourcePolicyPath) || typeof sourcePolicyPath.canonical_path !== 'string') {
    return reject('schema_refs', 'snapshot lacks non_authority_notice.canonical_path');
  }

  // ---- checkpoint: rule_projection ----------------------------------------
  const defaults = policy.operation_class_defaults;
  if (!isRecord(defaults)) {
    return reject('rule_projection', 'snapshot lacks an operation_class_defaults mapping');
  }
  const tiersBlock = isRecord(policy.tiers) ? policy.tiers : undefined;
  if (tiersBlock === undefined) return reject('rule_projection', 'snapshot lacks a tiers mapping');

  const rules: PolicyRule[] = [];

  for (const [operationClass, rawRule] of Object.entries(defaults)) {
    const at = (field: string) => `operation_class_defaults.${operationClass}.${field}`;
    if (!isRecord(rawRule)) {
      return reject('rule_projection', `${at('<root>')} is not a mapping`);
    }

    const tier = rawRule.default_tier;
    if (typeof tier !== 'string') return reject('rule_projection', `${at('default_tier')} missing`);
    const tierBlock = isRecord(tiersBlock[tier])
      ? (tiersBlock[tier] as Record<string, unknown>)
      : undefined;

    // --- approval posture: DECLARED, never inferred from block presence -----
    // Live policy states it two ways and neither is universal:
    //   * `approval_required: false`                    (non-approval classes)
    //   * `approval_required_details.status: required`  (approval classes)
    // Read both. If policy says neither, reject — silence is not `false`.
    const details = rawRule.approval_required_details;
    if (details !== undefined && !isRecord(details)) {
      // The old fail-open: null / string / array / true read as "absent".
      return reject(
        'rule_projection',
        `${at('approval_required_details')} is present but not a mapping`,
      );
    }

    const declaredRequired = strictBoolean(rawRule.approval_required);
    if (declaredRequired === 'invalid') {
      return reject('rule_projection', `${at('approval_required')} must be a boolean`);
    }

    let approvalRequired: boolean;
    if (declaredRequired !== undefined) {
      approvalRequired = declaredRequired;
    } else if (details !== undefined) {
      const status = details.status;
      // Vocabulary declared by the snapshot itself (approval_required_detail_status).
      if (status === 'required') approvalRequired = true;
      else if (status === 'not_required') approvalRequired = false;
      else {
        return reject(
          'rule_projection',
          `${at('approval_required_details.status')} must be required|not_required`,
        );
      }
    } else {
      return reject(
        'rule_projection',
        `${at('approval_required')} is undeclared and no approval_required_details.status is present — policy silence is not consent`,
      );
    }

    // `approval_path_allowed` is declared per TIER (tiers.<tier>), not per class.
    // Where the tier declares it, read it. Where it does not, default to the
    // RESTRICTIVE value: this field is inert when approval_required is false,
    // and `true` is pinned by the schema when approval_required is true, so the
    // default can only ever apply to the inert case. Recorded in ADR 0079.
    const declaredPathAllowed = strictBoolean(tierBlock?.approval_path_allowed);
    if (declaredPathAllowed === 'invalid') {
      return reject('rule_projection', `tiers.${tier}.approval_path_allowed must be a boolean`);
    }

    // Ceiling is declared per class (details) and per tier. Prefer the class.
    //
    // `not_applicable` is a sentinel the policy itself declares
    // (tiers.read-safe / write-local / forbidden). Those tiers declare no
    // `_source_ref`, because a ceiling that does not apply has no source. The
    // sentinel therefore PROPAGATES to the ref — that is reading the policy's
    // own vocabulary, not authoring a default. Any other ceiling value must
    // carry a declared ref or the projection rejects. Recorded in ADR 0079.
    const ceiling = details?.valid_until_ceiling ?? tierBlock?.valid_until_ceiling;
    const declaredRef =
      details?.valid_until_ceiling_source_ref ?? tierBlock?.valid_until_ceiling_source_ref;
    const ceilingRef = declaredRef ?? (ceiling === 'not_applicable' ? 'not_applicable' : undefined);

    const flag = (key: string): boolean | RejectedRules => {
      const v = strictBoolean(rawRule[key]);
      if (v === 'invalid') return reject('rule_projection', `${at(key)} must be a boolean`);
      return v ?? false;
    };
    const activeLease = flag('requires_active_lease');
    if (typeof activeLease !== 'boolean') return activeLease;
    const deletionAuthority = flag('requires_deletion_authority');
    if (typeof deletionAuthority !== 'boolean') return deletionAuthority;

    const evidence = rawRule.required_pre_execution_evidence;
    if (evidence !== undefined && !isRecord(evidence)) {
      return reject(
        'rule_projection',
        `${at('required_pre_execution_evidence')} is present but not a mapping`,
      );
    }
    const typedEvidence = strictBoolean(evidence?.typed_provider_evidence_required);
    if (typedEvidence === 'invalid') {
      return reject(
        'rule_projection',
        `${at('required_pre_execution_evidence.typed_provider_evidence_required')} must be a boolean`,
      );
    }

    const approval = approvalRequired
      ? {
          approval_required: true,
          approval_path_allowed: true, // schema-pinned for the required branch
          required_grant_kind: details?.required_grant_kind,
          allowed_grant_kinds: isRecord(details?.grant_kind_compatibility)
            ? (details.grant_kind_compatibility as Record<string, unknown>).allowed_grant_kinds
            : undefined,
          producer_allowlist: details?.producer_allowlist,
          dashboard_visibility: details?.dashboard_visibility,
          single_use: details?.single_use,
          evidence_bound_scope: details?.evidence_bound_scope,
        }
      : { approval_required: false, approval_path_allowed: declaredPathAllowed ?? false };

    const candidate = {
      schema_version: policyRuleSchemaVersion,
      policy_rule_id: `policy-rule:hcs:${operationClass.replaceAll('_', '-')}`,
      operation_class: operationClass,
      tier,
      classification_basis: rawRule.primary_classification,
      requires_active_lease: activeLease,
      requires_deletion_authority: deletionAuthority,
      requires_typed_provider_evidence: typedEvidence ?? false,
      approval,
      valid_until_ceiling: ceiling,
      valid_until_ceiling_source_ref: ceilingRef,
      source_provenance: {
        authority: 'system_config_live_policy',
        source_policy_path: sourcePolicyPath.canonical_path,
        source_policy_sha256: observedDigest,
        source_policy_sha256_basis: 'live_policy_blob',
        observed_at: provenance.approved_at,
      },
    };

    const parsed = policyRuleSchema.safeParse(candidate);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const path = first && first.path.length > 0 ? first.path.join('.') : '<root>';
      return reject(
        'rule_projection',
        `PolicyRule projection for ${operationClass} failed at ${path}: ${first?.message ?? 'unknown'}`,
      );
    }
    rules.push(parsed.data);
  }

  // Exact set equality against the Ring-0 enum — BOTH directions. A snapshot
  // that quietly drops a class must not load with fewer rules.
  const declared = new Set<string>(operationShapeOperationClassSchema.options);
  const present = new Set<string>(rules.map((r) => r.operation_class));
  const missing = [...declared].filter((c) => !present.has(c)).sort();
  const extra = [...present].filter((c) => !declared.has(c)).sort();
  if (missing.length > 0 || extra.length > 0) {
    return reject(
      'rule_projection',
      `operation_class coverage mismatch — missing: [${missing.join(', ')}]; unexpected: [${extra.join(', ')}]`,
    );
  }

  return { ok: true, observedDigest, policyRuleSchemaVersion, rules };
}
