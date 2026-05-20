---
adr_number: 0059
title: AgentClient canonical-hash amendment
status: proposed
version: v1
date: 2026-05-19
charter_version: 1.4.1
tags: [agent-client, ring-0, audit-chain, canonical-hash, adr-0057-followup]
---

# ADR 0059: AgentClient canonical-hash amendment

## Status

`proposed`

Drafted 2026-05-19 as the ADR 0057 follow-up for AgentClient
canonical field order and GENESIS handling. This ADR is design-only at
v1. It does not modify Zod source, generated JSON Schema, tests,
registry docs, ADR 0037, ADR 0057, ADR 0058, live policy, generated
snapshots, system-config, or Ring 1 implementation code. The schema PR
follows only after ADR acceptance per `.agents/skills/hcs-schema-change`.

## Date

2026-05-19

## Charter version

Written against implementation charter v1.4.1 and
`docs/host-capability-substrate/ontology-registry.md` v0.4.20.
AgentClient canonical hashing is constrained by charter invariants 4, 8,
17, 18, and 19: audit logging stays internal, sandbox/self-asserted
authority does not promote, execution context is declared rather than
inferred, derived retrieval is never decision authority, and boundary
claims remain freshness-bound and execution-context-bound.

## Reviewer dispatch plan

Proposed reviewer dispatch after operator scope confirmation:

- `hcs-architect` -- verify the amendment shape, ADR 0037/0057
  consistency, service-boundary effect, and no Ring 1 implementation
  leakage.
- `hcs-ontology-reviewer` -- verify the field order against
  `agent-client.ts`, ontology-registry sections, generated-schema
  implications, and audit-chain coverage wording.
- `hcs-policy-reviewer` -- verify no live-policy duplication, no
  producer overgrant, and no expansion of gateway/broker/execution
  behavior.
- `hcs-security-reviewer` -- verify deterministic hash discipline,
  GENESIS uniqueness, producer-spoof prevention, and evidence-authority
  rejection preservation.
- `hcs-eval-reviewer` -- verify the implementation-test obligations and
  regression-coverage posture do not seed synthetic traps or imply a
  runnable harness before one exists.

## Context

ADR 0037 introduced AgentClient as a Ring 0 durable lifecycle entity for
connected agent clients. It committed the identity grain
`(product_family, surface, app_build)`, the active/retired lifecycle,
the six axis fields, and the required `audit_chain_link_hash`. It also
registered `kernel_agent_client_resolver` as the kernel-trusted producer
class that resolves AgentClient axes from launch, process-tree,
installed-binary, and remote-cloud execution-context evidence.

ADR 0057 accepted the first Ring 1 mint/audit service boundary. That ADR
kept `kernel_agent_client_resolver` in the producer allowlist as a
forward reservation, but it blocked AgentClient minting pending a narrow
canonical-hash amendment. The block exists because AgentClient already
requires `audit_chain_link_hash`, but no ADR has committed its canonical
field order or GENESIS rule. Without those commitments, the mint/audit
service cannot compute deterministic AgentClient link hashes.

ADRs 0049, 0051 v4, 0052, 0053, 0054, and 0055 form the current
canonical-hash discipline for the other audit-chain-committed Ring 0
entities. Principal and Session are the closest precedents because they
are typed identity envelopes produced by kernel resolver paths. They
exclude `schema_version` from canonical concatenation, exclude
`audit_chain_link_hash` because it is the output, use
`prior_audit_chain_link_hash` as a computation input rather than a
record schema field, and use the literal `GENESIS` sentinel for the
first link.

This ADR amends the AgentClient hash discipline only. It cites ADR 0037
as the foundational AgentClient ADR but does not edit or replace it.

## Options considered

### Option A: Commit AgentClient canonical field order and GENESIS rule

Add a narrow amendment that commits AgentClient's hash input order,
GENESIS handling, and length-prefix discipline while preserving ADR
0037's schema shape and ADR 0057's producer allowlist.

**Pros:**

- Lifts ADR 0057's blocked-pending-amendment posture without
  re-scoping the mint/audit service.
- Follows Principal and Session typed-identity-envelope precedent.
- Lets the follow-up schema PR update source descriptions, generated
  schema, ontology docs, and tests without changing AgentClient's field
  set.
- Keeps `kernel_agent_client_resolver` as the trusted service path
  without adding new producers.

**Cons:**

- Requires a reviewer pass and schema PR before AgentClient minting can
  succeed.
- Commits field-order semantics that future AgentClient shape changes
  must explicitly amend.

### Option B: Defer AgentClient audit-chain commitments indefinitely

Leave ADR 0057's AgentClient block in place and keep AgentClient outside
the audit-chain commitment list until a later implementation milestone.

**Pros:**

- Avoids committing AgentClient-specific hash semantics before Ring 1
  mint/audit implementation begins.
- Keeps the immediate follow-up work smaller.

**Cons:**

- Makes the operator-directed blocked-pending-amendment posture
  effectively permanent.
- Leaves a required AgentClient schema field without deterministic
  computation rules.
- Prevents full audit-chain coverage for the entity that identifies the
  agent product/build surface cited by sessions, leases, runs, evidence,
  and decisions.

### Option C: Add a producer field before hashing AgentClient

Change the AgentClient schema to add a `producer` field and then include
that field in the canonical hash, matching Principal and Session more
closely.

**Pros:**

- Producer attribution would be visible in the record envelope.
- The hash order would more closely resemble Principal and Session.

**Cons:**

- Expands schema shape beyond the amendment needed to lift ADR 0057's
  block.
- Requires a broader ADR 0037 amendment and schema migration question.
- Duplicates attribution already owned by the trusted service path and
  append/rejection audit event metadata in ADR 0057.

## Decision

Choose Option A. AgentClient joins the audit-chain commitment list by
committing canonical field order, GENESIS handling, and length-prefix
encoding for the existing AgentClient envelope. The follow-up schema PR
will update AgentClient source descriptions, generated JSON Schema,
ontology docs, registry docs, and tests, but will not add a new
AgentClient producer field or bump `schema_version` unless reviewers
identify a schema-breaking requirement.

`kernel_agent_client_resolver` remains the sole trusted producer path for
AgentClient minting. The producer name is not a producer-supplied
AgentClient field and is not part of the AgentClient canonical field
order at this amendment. The mint/audit service gates hash computation on
the authenticated resolver path and records resolver attribution in
append/rejection audit-event metadata. Payloads that self-assert resolver
authority reject.

## Canonical field order

AgentClient `audit_chain_link_hash` covers the length-prefix-encoded
canonical concatenation of the following inputs, in this exact order:

1. `agent_client_id` -- stable AgentClient entity identifier and chain
   root.
2. `product_family` -- agent product-family axis from ADR 0037.
3. `surface` -- execution surface axis reused from ExecutionContext,
   including `remote_cloud_agent`.
4. `app_build` -- observed runtime build string; a new build mints a new
   AgentClient rather than mutating the existing record.
5. `dep_bundle_version` -- observed dependency-bundle version.
6. `permission_mode` -- producer-declared but kernel-verifiable
   permission posture.
7. `containment_mechanism` -- kernel-resolved capability-class
   containment axis.
8. `agent_client_state` -- lifecycle state, `active` or `retired`.
9. `kernel_observed_at` -- kernel observation timestamp for the
   AgentClient record.
10. `(valid_until || '')` -- nullable freshness bound using the
    established empty-string substitution for null hash-input fields.
11. `canonical(evidence_refs)` -- deterministic canonical encoding of
    the evidence reference array.
12. `prior_audit_chain_link_hash` -- storage/audit metadata input, or
    the `GENESIS` sentinel for the first link.

The canonical expression is therefore:

```text
agent_client_id || product_family || surface || app_build ||
dep_bundle_version || permission_mode || containment_mechanism ||
agent_client_state || kernel_observed_at || (valid_until || '') ||
canonical(evidence_refs) || prior_audit_chain_link_hash
```

`schema_version` is intentionally excluded from the canonical
concatenation per the established ADR 0049-0055 precedent.
`audit_chain_link_hash` is excluded because it is the output of the
computation. Producer attribution is excluded because AgentClient does
not currently carry a producer field; producer authority is enforced by
the trusted resolver service path and recorded in audit-event metadata.

Future AgentClient field additions MUST say whether the new field joins
this canonical order. A future ADR that adds an AgentClient producer
field MUST also amend this canonical order.

## GENESIS handling

The first AgentClient link for a given `agent_client_id` uses the literal
`GENESIS` sentinel as the final canonical input in place of
`prior_audit_chain_link_hash`. The genesis hash is:

```text
sha256(agent_client_id || product_family || surface || app_build ||
dep_bundle_version || permission_mode || containment_mechanism ||
agent_client_state || kernel_observed_at || (valid_until || '') ||
canonical(evidence_refs) || 'GENESIS')
```

Genesis is not producer-asserted. The mint/audit service classifies
genesis from storage/audit-event metadata under the single-writer append
discipline, and the future audit-events/storage ADR owns the atomic
per-chain-root append and unique-genesis constraints. AgentClient's
chain root is `agent_client_id`: a new `app_build` creates a new
AgentClient ID, while retirement of an existing AgentClient appends to
that AgentClient's existing chain.

## Length-prefix encoding

The `||` operator in this ADR denotes length-prefix-encoded
concatenation. Every variable-length component is encoded as
`varint(byte_length) || field_bytes` before hashing. Naive byte
concatenation is forbidden.

Canonical encodings for AgentClient are:

- Strings, enum values, IDs, timestamps, and sha256 digests encode as
  their UTF-8 bytes after schema validation.
- Nullable fields use the established `'' for null` substitution; the
  empty byte string is still length-prefix encoded.
- `evidence_refs` encodes as an array length followed by each element's
  canonical encoding in the resolver-provided deterministic order.
  Reordering evidence refs changes the hash.
- Each evidence reference encodes fields in `evidenceRefSchema` order:
  `evidence_id`, `source`, `observed_at`, optional `valid_until`,
  `authority`, optional `parser_version`, and `confidence`, using the
  same null/absent-field discipline committed by the schema PR.
- No producer payload value participates in the canonical hash unless a
  future ADR adds a producer field to AgentClient.

## Coordinated effects

Acceptance of this ADR closes ADR 0057's AgentClient canonical-hash
future-amendment item at the design layer. AgentClient minting remains
blocked until the follow-up schema PR lands the source descriptions,
generated JSON Schema, ontology docs, registry docs, and tests that make
this amendment discoverable from the schema surface.

After that schema PR lands, ADR 0057's mint/audit service can lift the
blocked-pending-amendment rejection for AgentClient mint attempts without
re-scoping the service. AgentClient then joins the audit-chain commitment
list with Decision, ApprovalGrant, Lease, Run, Principal, and Session.
This creates seven-entity audit-chain commitment coverage for the
current mint/audit service scope.

## Follow-up regression coverage

This ADR does not seed new regression traps synthetically. It creates
implementation-test obligations for the schema PR and later mint/audit
implementation:

| Failure class | Coverage posture |
|---|---|
| AgentClient canonical field-order drift | Schema/source-description and generated-schema assertion in the follow-up schema PR; implementation test when mint/audit hashing lands. |
| GENESIS duplicate or forged genesis | Implementation test obligation for the future audit-events/storage and mint/audit service; no trap until observed incident or fixture failure. |
| Producer spoofing via payload self-assertion | Implementation test obligation for `kernel_agent_client_resolver` service-path matching; existing adjacent trap coverage remains for self-asserted AgentClient axes. |
| Evidence-ref reordering or naive concatenation collision | Implementation test obligation for deterministic hash vectors; no trap until observed incident or fixture failure. |

## Out of scope

This ADR explicitly does not authorize:

- Edits to ADR 0037. This is an amendment that cites the foundational
  AgentClient ADR, not a replacement.
- Edits to ADRs 0049-0055 or their canonical-hash rules.
- HCS source schema edits in this commit. `agent-client.ts` changes land
  only in the follow-up schema PR per `.agents/skills/hcs-schema-change`.
- Decision schema-version changes or any other entity schema-version
  bump.
- Live policy or `tiers.yaml` changes.
- `policies/generated-snapshot/` changes.
- Ring 1 mint/audit implementation code.
- New AgentClient producers. The producer allowlist remains ADR 0037 and
  ADR 0057 scoped.
- Execution broker, gateway, capability registration, tool resolution,
  host-state, dashboard, adapter, or hook behavior.
- System-config edits.
- Provider operations.

## Consequences

### Accepts

- AgentClient gets the same deterministic audit-chain hash discipline as
  the other mint/audit-committed Ring 0 entities.
- The hash order follows typed-identity-envelope precedent while
  respecting the current AgentClient field set.
- Producer attribution for AgentClient remains service-path/audit-event
  authority, not a producer-supplied record field.
- Future AgentClient field additions inherit an explicit amendment
  obligation for canonical hash participation.

### Rejects

- Permanent AgentClient exclusion from the mint/audit service.
- Adding a producer field solely to match Principal and Session.
- Treating `schema_version` or `audit_chain_link_hash` as hash inputs.
- Treating genesis as producer-supplied or payload-supplied.
- Using naive string concatenation for hash inputs.

### Future amendments

- AgentClient schema-shape amendments that add producer attribution,
  execution-context binding, or new identity axes must update this
  canonical order.
- The future audit-events/storage ADR must commit atomic per-chain-root
  append and unique-genesis enforcement for AgentClient alongside the
  other audit-chain-committed entities.
- If operational evidence shows AgentClient chain root should differ
  from `agent_client_id`, a narrow storage/hash amendment is required.

## Implementation plan after acceptance

The follow-up schema PR per `.agents/skills/hcs-schema-change` should:

1. Update `packages/schemas/src/entities/agent-client.ts` `.describe()`
   text to cite ADR 0059, the canonical field order, GENESIS handling,
   length-prefix discipline, and service-path producer attribution.
2. Regenerate `packages/schemas/generated/AgentClient.schema.json`.
3. Update `docs/host-capability-substrate/ontology.md` AgentClient
   narrative.
4. Update `docs/host-capability-substrate/ontology-registry.md`
   audit-chain coverage, kernel-trusted producer allowlist notes if
   needed, schema-version ledger notes if needed, and change log.
5. Add focused schema/docs tests or generated-schema assertions that
   prove the AgentClient generated schema exposes the ADR 0059 hash
   discipline and that `schema_version` remains unchanged.
6. Leave Ring 1 mint/audit implementation, hash-vector tests, and
   storage uniqueness checks to their own implementation slice after the
   schema PR lands.

## Acceptance criteria

- All five reviewers confirm the canonical field order, GENESIS rule,
  and length-prefix discipline are sufficient to lift ADR 0057's
  AgentClient block after the schema PR lands.
- `hcs-ontology-reviewer` confirms each included/excluded field matches
  `agent-client.ts`, ADR 0037, ontology docs, and registry posture.
- `hcs-security-reviewer` confirms producer-spoof prevention remains
  service-path based and genesis cannot be payload-asserted.
- `hcs-policy-reviewer` confirms no live-policy, gateway, broker, or
  provider-mutation authority is introduced.
- `hcs-eval-reviewer` confirms the regression-coverage section records
  implementation-test obligations without synthetic trap creation.
- The acceptance commit records a new decision-ledger row and states
  that ADR 0059 closes ADR 0057's AgentClient canonical-hash
  future-amendment item.

## References

### Internal

- ADR 0037:
  `docs/host-capability-substrate/adr/0037-q-010-cross-agent-isolation-and-compatibility-taxonomy.md`
  -- foundational AgentClient entity, identity grain, axes, lifecycle,
  and `kernel_agent_client_resolver`.
- ADR 0049:
  `docs/host-capability-substrate/adr/0049-decision-ring-0-entity.md`
  -- original Decision audit-chain hash and GENESIS precedent.
- ADR 0051:
  `docs/host-capability-substrate/adr/0051-approval-grant-ring-0-entity.md`
  -- ApprovalGrant canonical hash discipline and retroactive
  length-prefix posture.
- ADR 0052:
  `docs/host-capability-substrate/adr/0052-lease-ring-0-entity.md`
  -- Lease canonical hash precedent.
- ADR 0053:
  `docs/host-capability-substrate/adr/0053-run-ring-0-entity.md`
  -- Run canonical hash precedent.
- ADR 0054:
  `docs/host-capability-substrate/adr/0054-principal-ring-0-entity.md`
  -- Principal typed-identity-envelope precedent.
- ADR 0055:
  `docs/host-capability-substrate/adr/0055-session-ring-0-entity.md`
  -- Session typed-identity-envelope and resolver-producer precedent.
- ADR 0057:
  `docs/host-capability-substrate/adr/0057-ring-1-mint-audit-service.md`
  -- consuming mint/audit service and AgentClient blocked-pending-
  amendment posture.
- ADR 0058:
  `docs/host-capability-substrate/adr/0058-depth-overflow-reason-kind-promotion.md`
  -- sibling ADR 0057 follow-up amendment pattern.
- Decision ledger:
  `DECISIONS.md` D-052 and D-053.
- Charter:
  `docs/host-capability-substrate/implementation-charter.md` v1.4.1
  invariants 4, 8, 17, 18, and 19.
- Ontology:
  `docs/host-capability-substrate/ontology.md` AgentClient section.
- Ontology registry:
  `docs/host-capability-substrate/ontology-registry.md`
  sections `Producer-vs-kernel-set authority fields`,
  `Current schema-version ledger`,
  `Kernel-trusted producer allowlist final state`, `AgentClient
  identity-axis enums`, and `Canonical-concatenation length-prefix
  discipline`.
