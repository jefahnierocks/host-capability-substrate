# W-C Rego Reorientation Proposal

Directive: `NASH-DIR-HCS-CODEX-ORIENT-2026-06-04`
Status: scratch proposal only. Not an applied change.

## Status

The directive says the operator has selected Rego as the policy language for the
bright-line forbidden classifier. Current HCS repo state still has a YAML
generated snapshot, a non-authoritative Python measurement classifier, and an
old D-008 "OPA adoption trigger" row. The reorientation should be recorded as a
decision and ADR before any Ring 1 classifier implementation or hook enforcement
change.

## Evidence

- `DECISIONS.md:105` / D-008 says OPA adoption was conditional on a future
  trigger.
- `docs/host-capability-substrate/adr/0006-policy-source-location.md:16-23`
  says canonical live policy lives in system-config and HCS owns only schemas plus
  generated snapshots.
- `docs/host-capability-substrate/adr/0006-policy-source-location.md:43-46`
  says OPA adoption may add Rego files to the canonical location.
- `docs/host-capability-substrate/adr/0013-forbidden-tier-split.md:86-90`
  says if OPA adoption occurs, forbidden reason families become policy outputs
  rather than hand-coded classifier constants.
- `docs/host-capability-substrate/hook-contracts.md:35-47` says the interim
  classifier is non-authoritative and future enforcement moves to
  `system.policy.classify_operation.v1`.
- `docs/host-capability-substrate/hook-contracts.md:49-64` describes Phase 3+
  RPC/cached policy behavior, but does not name Rego.
- `scripts/dev/classify.py:2-11` says it is Phase 0b interim measurement code
  and must be replaced by Ring 1 RPC or a hash-bound generated runtime
  policy/cache.
- `policies/generated-snapshot/README.md:22-31` says HCS snapshot checks validate
  binding, schema refs, operation-class coverage, reason-kind compatibility, and
  path placement.
- `policies/generated-snapshot/tiers.yaml:18-27` says primary classification is
  `OperationShape.operation_class`; regex patterns are only defense-in-depth.
- `policies/generated-snapshot/tiers.yaml:351-380` still carries a YAML
  `forbidden_policy` / `non_escalable_forbidden_patterns` structure.
- `scripts/ci/snapshot-binding-check.sh:17-20` hardcodes the current snapshot path
  and source policy path to YAML.
- `PLAN.md:1245-1250` says `system.policy.classify_operation.v1` accepts
  `OperationShape` and returns `Decision`; no mutating endpoints.
- `docs/host-capability-substrate/ontology.md:94` defines `PolicyRule` as "a
  tier/destructive-pattern/approval rule (YAML or Rego)".

## Proposed Decisions

Add two decision rows, tentatively D-063 and D-064:

1. **D-063: Bright-line forbidden policy language is Rego.**

   `The HCS bright-line forbidden classifier evaluates Rego policy, with input
   contract {surface, command, path} and denial on non-empty deny output. TypeScript
   remains appropriate for typed operation plumbing, schema validation, host-state
   lookup, command rendering, and Decision/Run envelopes, but not as the primary
   bright-line policy language. scripts/dev/classify.py remains measurement-only
   until sunset. This decision supersedes D-008's conditional OPA trigger for the
   bright-line wedge only; broader policy composition still needs its own ADR if
   it grows beyond the bright-line classifier.`

2. **D-064: Parent bright-line policy is consumed by HCS only by restatement.**

   `HCS consumes the parent bright-line policy through an HCS-owned, attributed,
   version-pinned restatement plus vendored policy artifacts and a --check drift
   gate. HCS does not runtime-read parent files. Restated artifacts are source
   inputs for generated/hash-bound runtime policy caches; live policy authority
   remains outside hooks/adapters and no enforcement flip is authorized by this
   decision.`

## Proposed Layout

Use two layers: one docs/restatement layer and one generated snapshot/test layer.

1. Restatement docs:

   - `docs/host-capability-substrate/policy-restatements/bright-line-forbidden-2026-06-04.md`
   - Contents:
     - source attribution and version pin supplied by operator;
     - explicit statement that HCS does not runtime-read parent files;
     - input contract `{surface, command, path}`;
     - output contract: `deny` array, deny if non-empty;
     - mapping to HCS `Decision.reason_kind` values;
     - boundaries: no fuzzy tier policy, no allow-to-block hook change, no execute lane.

2. Vendored generated snapshot/test artifacts:

   - `policies/generated-snapshot/bright-line-forbidden/forbidden.rego`
   - `policies/generated-snapshot/bright-line-forbidden/bright_line_patterns.json`
   - `policies/generated-snapshot/bright-line-forbidden/forbidden_test.rego`
   - `policies/generated-snapshot/bright-line-forbidden/restatement-binding.json`

   The binding file should include:

   - source decision id;
   - source artifact names;
   - source artifact SHA-256 digests;
   - HCS restatement doc path;
   - generated snapshot digest;
   - expected OPA package/query;
   - input/output contract version.

3. CI proposal:

   - Add a new `scripts/ci/rego-restatement-check.sh --check` later, not in this
     directive.
   - The check should:
     - ensure the binding manifest is present and digest-valid;
     - run `opa test` over the vendored rego/test/data if `opa` is available in
       the declared toolchain;
     - reject drift between binding digests and vendored artifacts;
     - reject runtime-parent path dependencies.

4. Ring 1 classifier proposal:

   - Future classifier loads only a generated/hash-bound runtime policy cache
     under HCS runtime state, generated from canonical policy/restatement inputs.
   - It evaluates the Rego query with input `{surface, command, path}`.
   - It emits a typed `Decision` only through the future Ring 1 mint/audit path.
   - It does not make hook-local decisions and does not bypass the approval,
     dashboard, audit, or lease gates.

## Current TypeScript/YAML Assumptions To Update Later

- `scripts/dev/classify.py` remains acceptable as measurement-only, but any text
  implying it is a policy backstop should be removed or further tightened.
- `hook-contracts.md` should mention Rego for the bright-line classifier once the
  ADR is accepted.
- `PLAN.md:1249` should eventually say the Ring 1 classifier evaluates the Rego
  bright-line policy for the forbidden wedge and returns `Decision`.
- `scripts/ci/snapshot-binding-check.sh` currently assumes a single YAML
  generated snapshot. A future change should either add a separate Rego binding
  check or generalize snapshot checks by artifact kind.
- `PolicyRule` can stay as the typed rule/provenance entity for YAML-derived
  operation-class defaults, but a future ADR should decide whether Rego artifacts
  need a `policy_artifact_kind`, separate Rego policy entity, or a widened
  `PolicyRule` source-provenance shape. Do not shoehorn Rego semantics into the
  current TypeScript schema without an ADR.

## Proposal Path

This file is the W-C proposal path:
`docs/host-capability-substrate/research/local/2026-06-04-hcs-codex-orientation/W-C-rego-reorientation-proposal.md`

## Boundary Adherence

No Rego artifact was copied from operator scratch. No parent repo file was read.
No enforcement wiring, generated snapshot, hook, classifier, or policy source was
changed. This proposal relies only on the directive text plus HCS-local evidence.

## Open Operator Decisions

- Whether to assign D-063/D-064 as the next decision numbers or combine them.
- Whether the first applied step should be a decision-ledger/docs PR or a new
  ADR 0064 covering Rego bright-line restatement plus classifier input contract.
- Whether the vendored Rego artifact belongs under `policies/generated-snapshot/`
  only, or also needs a docs-visible restatement copy for human review.
