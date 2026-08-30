---
adr_number: 0079
title: Ring-1 policy-rule loader — rule shape only, provenance deferred
status: accepted
version: v1
date: 2026-07-25
charter_version: 1.6.0
tags: [ring-1, kernel, policy, policy-rule, loader, adr-0060-followup, class-d]
---

# ADR 0079: Ring-1 policy-rule loader — rule shape only, provenance deferred

## Status

`accepted`

Ships in the same PR as the code it governs, per the successor rule recorded in
D-085 §What to stop: an ADR is opened only when it unblocks a named PR in the
current wave, and it lands with that PR rather than ahead of it.

## Date

2026-07-25

## Context

`packages/kernel` held nothing but a `.gitkeep` for three months. The first
service proposed for it was a policy-snapshot loader that combined two jobs:
verifying the vendored snapshot against its binding manifest, and projecting
`operation_class_defaults` into `PolicyRule` records.

That combination was withdrawn (PR #98, converted to draft). Three reviewer
lenses established two things that this ADR exists to settle:

1. **The provenance half was not authorized.** ADR 0060 §Provenance
   verification assigns the digest obligation to "the Ring-1 policy/gateway
   loader" — but the same ADR's §Out of scope states it "does not authorize:
   ... Ring-1 gateway/policy-resolution or the §Provenance-verification
   implementation (Ring-1, gated by charter inv. 7)", and §Provenance
   verification's closing sentence defers it to "the follow-up gateway ADR".
   No gateway ADR exists. Citing §Provenance verification as authorization was
   an error of the same class as regression trap #61.

2. **The projection half authored policy.** The withdrawn draft derived
   approval posture from the *presence* of an `approval_required_details`
   block. In YAML, `approval_required_details:` with no value parses to `null`;
   "not a mapping" read as "absent"; and absent projected
   `approval_required: false` — on a `write-destructive` class. The CI checker
   it was meant to replace fails closed on the same input. A one-character
   snapshot edit produced a destructive rule requiring no approval.

## Decision

A Ring-1 loader at `packages/kernel/src/policy/rule-loader.ts` that answers
exactly one question: **is the snapshot's rule shape valid, and what does it
declare?**

**In scope.** Read the vendored snapshot; parse it; project each
`operation_class_defaults` entry into a `PolicyRule`; validate every projection
against `policyRuleSchema`; assert exact `operation_class` set equality against
`operationShapeOperationClassSchema` in **both** directions.

Three ordered checkpoints, exported as `LOADER_CHECKPOINTS` so rejection can be
asserted at the step rather than only at the outcome: `parse` → `schema_refs` →
`rule_projection`.

**Derive, never infer.** Every projected value is read from a field the policy
declares. Where policy is silent the loader rejects. Three consequences of that
rule, recorded because each was previously authored in kernel source:

- **Approval posture** is declared two ways, and neither is universal:
  `approval_required: false` on the four non-approval classes, and
  `approval_required_details.status: required` on the four approval classes
  (vocabulary declared by the snapshot at `approval_required_detail_status`:
  `[not_required, required]`). The loader reads `approval_required` when
  present, falls back to `status`, and **rejects when policy declares neither**.
  A non-mapping `approval_required_details` rejects; it is never read as absent.
- **`approval_path_allowed`** is declared per *tier*, not per class, and only
  for `forbidden`. The loader reads `tiers.<tier>.approval_path_allowed` when
  declared. When undeclared it uses `false` — the restrictive value, and
  provably inert: the field is only reachable on the `approval_required: false`
  branch, since `policyRuleApprovalSchema` pins it to `true` on the other. This
  is the ADR's one authored default and it is recorded here deliberately.
- **`valid_until_ceiling`** is declared per class (details) and per tier. The
  loader prefers the class, falls back to the tier. `not_applicable` is a
  sentinel the policy itself declares; the tiers that declare it carry no
  `_source_ref`, so the sentinel **propagates** to the ref. Any other ceiling
  value must carry a declared ref or the projection rejects.

**Booleans are strict.** `"true"` is not `true`. charter §Forbidden patterns
(v1.2.0) bars writing boolean-like strings for strict booleans; the
corresponding read is equally strict, or a policy typo silently clears a
security-relevant flag.

**Error hygiene.** Rejection reasons carry a classification (`error.name` or an
errno code), never `error.message`. V8 embeds an input excerpt in
`SyntaxError.message`, the `yaml` package's default `prettyErrors` appends up to
two raw source lines, and fs errors carry absolute host paths. Reason strings
are caller-loggable.

**Parser options are explicit**, not defaulted: `uniqueKeys: true` guards
duplicate-key shadowing, `maxAliasCount: 100` bounds anchor expansion.

## Out of scope

This ADR does not authorize:

- **Provenance or digest verification of any kind.** The loader computes a
  digest of the bytes it read and records it as an *observation*; it performs no
  comparison against `snapshot-binding.json` and makes no authority claim.
  `scripts/ci/snapshot-binding-check.sh` remains the binding gate.
  Implementing ADR 0060 §Provenance verification requires the gateway ADR that
  ADR 0060 defers to, and remains gated by charter inv. 7.
- Retiring `scripts/ci/policy-snapshot-compat-check.rb` or
  `policy-rule-zod-check.ts`. With provenance out of scope, the loader and the
  Ruby lane answer **disjoint** questions — binding integrity versus rule shape
  — so there is no inv-1 duplication surface and no parity obligation between
  them. Any future retirement is its own decision and must demonstrate parity.
- Gateway behavior, `Decision` construction, capability registration, tool
  resolution, host state, or any consumer of the returned rules.
- Any live-policy or generated-snapshot byte change.
- A no-argument public form. `LoadOptions` takes a caller-supplied path, which
  is acceptable while the only callers are tests; before an adapter forwards a
  path argument, the public form must become kernel-resolved.

## Options considered

**Fix the schema instead of the loader.** Rejected as unnecessary:
`policyRuleApprovalSchema` is already a discriminated union on a required
literal and rejects absent, `null`, and `"false"` today. The defect was that the
loader never passed the snapshot's declared value to it. A schema change would
have protected nothing the schema does not already protect.

**Keep provenance verification and write the gateway ADR now.** Rejected: the
gateway ADR governs a service that does not exist, and writing it ahead of that
code is the pattern D-085 §What to stop names. Binding verification is not lost
— it stays where it already works, in CI.

**Reject on any undeclared field, with no authored defaults.** Rejected because
it makes the current snapshot unloadable: policy declares `approval_path_allowed`
only for `forbidden`. The single authored default is recorded above with its
inertness argument rather than hidden.

## Consequences

The kernel gains a service whose output is a validated `readonly PolicyRule[]`,
typed rather than `unknown[]`, so consumers need no cast at the Ring-2 boundary.

Nothing consumes it yet. The next PR is a read-only `hcs policy status` CLI verb
(class E), which is the first surface a human can invoke.

The loader is class **D** — kernel read path. It writes nothing, registers no
capability, exposes no agent-callable mutation, and mints or consumes no
`ApprovalGrant`. `@hcs/kernel`'s exports map publishes only the api barrel, and
`api-surface.test.ts` bars any `mint|append|consume|revoke` symbol from it.

## References

- ADR 0060 §Provenance verification (the deferred obligation) and §Out of scope
  (why it is deferred here)
- ADR 0061 §Follow-up regression coverage — the "self-asserted resolved digest"
  row, whose obligation belongs to the mint/audit service, **not** to this
  loader
- D-085 — the successor rule this ADR is the first test of
- Regression trap #61 — `out-of-scope-list-quoted-as-authorization`, the trap
  the withdrawn draft reproduced
- `policies/generated-snapshot/tiers.yaml` — the declared fields enumerated in
  §Decision
