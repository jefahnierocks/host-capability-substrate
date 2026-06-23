---
adr_number: 0077
title: Audit-events store — persistence, atomic per-chain-root append, unique-genesis
status: accepted
version: v2
date: 2026-06-23
charter_version: 1.6.0
tags: [ring-1, audit-chain, audit-event, storage, persistence, atomic-append, unique-genesis, tamper-evident, sqlite, adr-0057-followup, adr-0064-followup]
---

# ADR 0077: Audit-events store — persistence, atomic per-chain-root append, unique-genesis

## Status

`accepted`

Accepted 2026-06-23 as **D-080**. Human approval = the operator merged the propose PR #82
and directed proceed. The five-lens round 1 (architect/ontology/policy/eval zero blocking;
`hcs-security-reviewer` load-bearing, one blocker B-1) was folded into v2 — the store file is
`audit-events.sqlite` (gate-matched by `no-runtime-state-in-repo`), and §5 makes the
no-SQLite-append-only-enforcement / mandatory-full-walk threat model explicit — and the
confirming security round returned `confirm`. Design-only acceptance: no DDL / runtime /
endpoint / schema byte change; the M4-gated implementation PR follows.

Design-only. This ADR designs the **persistent audit-events store** — the tamper-evident
home for the `AuditEvent` envelope ADR 0064 typed — and the **atomic per-chain-root
append** and **unique-genesis** disciplines ADR 0057 (audit rule 7) and ADR 0064
explicitly deferred to it. It lands **no** storage code, no SQLite file, no schema source,
no runtime, and no endpoint. Per charter invariant 7 the implementation is class-I
(unmergeable until the approval/audit/dashboard/lease stack lands, M4); this ADR is the
reviewed *design* those PRs build against, exactly as ADR 0064's contract layer is.

**Operator-confirmed scope (2026-06-23):** substrate = **SQLite (WAL)** (the charter
inv-10 "SQLite runtime state" default); breadth = **core store + boundaries** — the store
model, atomic per-chain-root append, unique-genesis, append-time chain-walk corruption
detection (gap/fork), the inv-10 runtime-state location, and the inv-4 internal-only +
external-testimony-separate-table boundary. Retention/GC and a storage-level corruption
reason-kind family are deferred to future amendments.

**v2 folds the round-1 five-lens review (architect/ontology/policy/eval: zero blocking;
security load-bearing: one blocker).** Settled: **(B-1, security)** the store file is named
`audit-events.sqlite` (not `.db`) so it + its WAL/SHM siblings are matched by the existing
`no-runtime-state-in-repo` gate's `*.sqlite*` patterns — the prior "already barred" claim
was false for a `.db` name; the M4 implementation must confirm the finalized filename stays
gate-matched. Non-blocking folds: §5 now states explicitly that SQLite provides **no**
append-only enforcement (a privileged-writer truncation passes the append-time head check),
so the periodic full chain-walk verification is the **mandatory** tamper-*detection*, not
optional; `recorded_seq` is store-generated/`NOT NULL`/monotonic, never payload-supplied;
the store's `entity_kind` is the **seven** committed mint entities (narrower than the
eight-value `MintRequest.entity_kind`, deliberately); and the regression table adds the
chain-truncation, gate-filename-coverage, and `recorded_seq`-monotonicity obligations.

## Date

2026-06-23

## Charter version

Written against implementation charter **v1.6.0** and `ontology-registry.md` v0.4.36. The
store is governed by invariant 4 (audit logging is an internal side effect, never
agent-callable; external testimony uses a separate endpoint + a separate table, typed
untrusted), invariant 7 (no persistence/execution path before the full approval/audit/
dashboard/lease stack — this ADR stays design-only), invariant 10 (the SQLite store is
runtime state under `~/Library/Application Support/host-capability-substrate/`, never in
the repo), and invariants 8 / 18 (sandbox/self-asserted authority does not promote; the
mint service's chain-walk rejection — consumed, not redefined here).

## Context

ADR 0057 (D-052) gave the mint/audit service authoritative record minting and
audit-chain link computation and validation, and **deferred to "the future
audit-events/storage ADR"** (audit rule 7) the *atomic per-chain-root append* and
*unique-genesis* enforcement. ADR 0064 (D-062) typed the `AuditEvent` envelope (event_kind
∈ {append, rejection}, entity_kind, subject_ref, kernel-resolved attribution FKs,
rejecting_layer?, rejection_class?, decision_ref?, `chain_link_meta` = the prior-link
computation input, observed_at) and re-stated the deferral: "Atomic per-chain-root append
and unique-genesis enforcement are **storage** obligations deferred to the
audit-events/storage ADR." This ADR is that home.

**The chain model (consumed from ADR 0057/0059, not redefined).** Each
audit-chain-committed entity *instance* is a **chain root**: ADR 0059 fixes "the chain
root is `agent_client_id`; a new app_build mints a new AgentClient ID while retirement
appends to the existing chain." Generalizing across the seven committed mint entities
(Decision, ApprovalGrant, Lease, Run, Principal, Session, AgentClient), a chain root is
the genesis-rooted entity id, and its chain is the append-only sequence of audit links for
that instance. Each link's `audit_chain_link_hash` is computed by the **mint service**
(ADR 0064 canonical-hash contract) over the entity's canonical field order plus the
`prior_audit_chain_link_hash`; the first link uses the entity's `GENESIS` sentinel. The
`prior_audit_chain_link_hash` and genesis placement are **storage/audit metadata, never a
record schema field** (ADR 0057 audit rule 6; ADR 0064). This store is where that metadata
and the `AuditEvent` envelopes live.

This ADR does not compute hashes, mint records, or run anything (that is the mint
service's, ADR 0064). It designs **where the events go and how the append stays
tamper-evident, atomic, and single-genesis** — the storage half ADR 0064 could not own
without reversing ADR 0057's deferral (ADR 0064 Option C, rejected).

## Decision

Adopt **Option A.** The audit-events store is a single-writer, append-only **SQLite (WAL)**
database under the HCS runtime-state directory, organized by **chain root**, enforcing
atomic per-chain-root append and exactly one genesis per chain root, with append-time
chain-walk corruption detection. It is **internal to the mint/audit service** (inv-4); no
agent-callable audit-write surface exists. All SQL/DDL below is a **design sketch**, not
committed source — the implementation is M4-gated (inv-7).

### 1. Location + substrate (inv-10)

The store is a SQLite database at
`~/Library/Application Support/host-capability-substrate/audit/audit-events.sqlite` (with
its `audit-events.sqlite-wal` / `audit-events.sqlite-shm` WAL/SHM siblings), opened in
**WAL** journal mode with `synchronous=FULL`. The `.sqlite` extension is deliberate: the
file and its WAL/SHM siblings are matched by the existing `no-runtime-state-in-repo` gate's
`*.sqlite` / `*.sqlite-wal` / `*.sqlite-shm` patterns (a `.db` name would slip the gate — a
B-1 round-1 finding). It is **runtime state**: it never enters the repo (inv-10; the gate's
`*.sqlite*` patterns + the `$HCS_STATE_DIR` layout bar it — the M4 implementation MUST
confirm the finalized filename stays gate-matched, or extend the gate patterns first), it is
not a materialized-facts cache, and it is not gitignore-deletable (inv-13 — it is
load-bearing audit state). Archives/rotation, if ever added, are a future amendment.

### 2. The store model (design sketch)

```text
audit_events                          -- append-only; no UPDATE, no DELETE
  chain_root            TEXT NOT NULL  -- the entity-instance id (the genesis-rooted chain)
  entity_kind           TEXT NOT NULL  -- one of the seven committed mint entities
  link_index            INTEGER NOT NULL  -- 0 = genesis; strictly +1 per append on this chain_root
  prior_link_hash       TEXT NOT NULL  -- GENESIS sentinel at link_index 0; else the prior link's this_link_hash
  this_link_hash        TEXT NOT NULL  -- the service-computed audit_chain_link_hash for this link
  event_kind            TEXT NOT NULL  -- append | rejection (the AuditEvent envelope)
  subject_ref           TEXT NOT NULL  -- minted record id (append) | rejected candidate correlation id (rejection)
  attribution_*         ...            -- kernel-resolved agent_client_id?/session_id?/principal_id? | explicit unknown
  rejecting_layer       TEXT NULL      -- mint_api | broker_fsm | gateway (rejection only)
  rejection_class       TEXT NULL      -- the typed registry rejection-class discriminator (rejection only)
  decision_ref          TEXT NULL      -- FK to the emitted Decision when a MintRejected carried one
  observed_at           TEXT NOT NULL  -- kernel observation timestamp (RFC 3339)
  recorded_seq          INTEGER NOT NULL  -- STORE-GENERATED monotonic insertion order (total order across chain roots; rowid/AUTOINCREMENT-derived, NEVER payload-supplied)

  PRIMARY KEY (chain_root, link_index)
  UNIQUE      (chain_root, prior_link_hash)        -- fork guard (no two links share a parent on a chain)
  UNIQUE      (this_link_hash)                     -- global link-hash uniqueness
```

The row carries the `AuditEvent` envelope (ADR 0064) **plus** the chain-link metadata
(`link_index`, `prior_link_hash`, `this_link_hash`) that ADR 0064 names "not a record
schema field." It carries **no** secret-shaped value (inv-5): only ids, kebab/enum
discriminators, hashes, and timestamps — the same shape the Ring-0 records bind. The exact
`AuditEvent` columnization is finalized when the `AuditEvent` envelope Zod lands (ADR 0064
future amendment) and the schema-change skill is followed.

The store's `entity_kind` is the **seven** audit-chain-committed mint entities — narrower
than the eight-value `MintRequest.entity_kind` (ADR 0064): WorkspaceContext is hash-bearing
but kept OUT of the seven (ADR 0057 / 0064), so it does not append to this store. `chain_root`
and `subject_ref` carry `entityIdSchema`-shaped ids (raw-shape accept-and-trap, opacity a
Ring-1 obligation, the storage-primitive precedent) when the implementation types them.

### 3. Atomic per-chain-root append

- **Single writer.** The mint/audit service is the **sole** writer (one serialized writer
  connection). There is no agent-callable, broker, gateway, or dashboard write path into
  this store (inv-4). Readers (the dashboard, integrity verifier) open read-only.
- **One transaction per append.** Each append is a single WAL transaction: it (a) reads
  the current chain head for `chain_root` (`MAX(link_index)` and its `this_link_hash`),
  (b) asserts `prior_link_hash` of the new link **equals** that head hash and
  `link_index = head_index + 1` (no gap, no overwrite), and (c) inserts the row. A torn or
  partial write cannot leave a half-link: WAL commit is atomic, and the
  `PRIMARY KEY (chain_root, link_index)` rejects a concurrent duplicate.
- **Per-chain-root isolation.** Appends to *different* chain roots are independent; the
  single-writer + per-chain-root head check serializes appends to the *same* root without
  a global lock on the whole store.
- **Append-only.** No `UPDATE`/`DELETE` is ever issued; a correction is a **new** append
  (e.g. a retirement link), never an in-place edit — mirroring the Ring-0 entities'
  append-only immutability and the digest-addressed Artifact discipline.

### 4. Unique-genesis

Exactly **one** genesis link exists per chain root. Genesis is `link_index = 0` with
`prior_link_hash = GENESIS` (the entity's sentinel). The `PRIMARY KEY (chain_root,
link_index)` makes a second `link_index = 0` for the same `chain_root` impossible; the
service additionally rejects a `prior_link_hash = GENESIS` insert when any link already
exists for that `chain_root`. A duplicate-genesis attempt is a **fail-closed rejection**
recorded as its own rejection AuditEvent and surfaced as `audit_chain_corruption_detected`
when it indicates a forged/forked root (the existing cycle/corruption reason kind, ADR
0056/0058) — never silently merged. Genesis placement is validated against **store
metadata, never producer-asserted** (ADR 0064 canonical-hash contract).

### 5. Append-time corruption detection (gap / fork / tamper)

On every append the writer verifies, in-transaction, before commit:

- **Continuity (no gap, no overwrite):** `prior_link_hash` == the chain head's
  `this_link_hash` and `link_index` == head + 1.
- **No fork:** the `UNIQUE (chain_root, prior_link_hash)` constraint rejects a second link
  claiming the same parent; the `UNIQUE (this_link_hash)` constraint rejects a replayed
  link hash.
- **Hash agreement:** the service-supplied `this_link_hash` is the value it computed over
  the canonical fields + `prior_link_hash` (ADR 0064); a mismatch is corruption.

Any failure is **fail-closed**: the append is rejected, a rejection AuditEvent is recorded
(to the extent a clean tail allows), and the class surfaces as
`audit_chain_corruption_detected` (cycle/structural) per the ADR 0056/0058 taxonomy — this
ADR introduces **no new reason kind** (a storage-level corruption reason-kind *family* is a
deferred future amendment). A **periodic + on-read full chain-walk verification** (re-walk
each chain root genesis→head, re-checking link continuity and recomputed hashes) is a Ring-1
**service** obligation, not encoded in DDL; this store provides the ordered, immutable rows
that walk reads.

**SQLite provides no append-only enforcement.** A privileged writer or out-of-band `sqlite3`
process can `DELETE` / `UPDATE` / truncate rows, and a tail-truncation passes the append-time
head check against the now-shorter chain. The append-time constraints (`PRIMARY KEY` /
`UNIQUE` + the in-transaction head check) therefore give tamper-*resistance at write*, not
tamper-*proofing*; the **mandatory** tamper-*detection* is the periodic full chain-walk above,
which recomputes every link genesis→head and catches truncation/rewrite after the fact — a
hard Ring-1 service obligation, not optional. The strongest anti-truncation anchor is an
**external checkpoint** of each chain head (e.g. a 1Password audit-checkpoint reference); it
is a future amendment.

### 6. Internal-only + external testimony (inv-4)

This store is **internal** to the mint/audit service. There is **no agent-callable
audit-write tool** and no agent-callable audit-write endpoint (charter forbidden pattern;
ADR 0057 §Rejects). When **external testimony** is added it uses a **separate endpoint and
a separate table, typed untrusted** (inv-4) — it is **not** this `audit_events` store, does
not share its chain roots, and never appends a trusted link; designing that untrusted
table is out of scope here (a sibling ADR). Read access for the dashboard integrity view
is read-only and is the dashboard ADR's concern.

### What this ADR does NOT do

- Compute hashes, mint records, resolve producers/attribution, or run the bounded
  authority walk — those are the mint service's (ADR 0064), consumed here.
- Land SQLite/DDL/migration code, a runtime, an endpoint, or the `AuditEvent` Zod (inv-7;
  the envelope Zod is ADR 0064's separate schema PR).
- Define retention/GC, archival/rotation, a storage-level corruption reason-kind family,
  or the external untrusted-testimony table (all future amendments).

## Options considered

### Option A: Single-writer append-only SQLite (WAL), per-chain-root, unique-genesis (CHOSEN)

**Pros:** WAL gives crash-safe atomic per-append commit natively; `PRIMARY KEY (chain_root,
link_index)` + the fork/global-hash `UNIQUE` constraints give unique-genesis and
fork/replay rejection *as substrate guarantees*, not hand-rolled; SQLite is the charter
inv-10 named runtime-state substrate (one fewer dependency decision); append-only +
single-writer matches the Ring-0 records' immutability and ADR 0057's single-writer append
discipline. **Cons:** concrete substrate named at design time (acceptable — still
design-only, no code; the discipline is what binds, the substrate realizes it).

### Option B: Per-chain-root append-only log files + a derived index

**Cons:** atomic append, single-writer locking, fork detection, and unique-genesis are all
hand-rolled (fsync discipline, lockfiles, a separate index that can drift from the logs);
more moving parts to specify and more failure modes than a WAL transaction + a UNIQUE
constraint. Rejected for the core store; an export/archive format is a future-amendment
concern, not the live store.

### Option C: Substrate-abstract (discipline only, defer SQLite-vs-log)

**Cons:** leaves the unique-genesis and atomic-append *mechanism* unspecified, so the first
implementation PR re-decides the central design — the per-consumer re-derivation ADR 0057
Option B / ADR 0064 reject. The operator selected a concrete (SQLite-WAL) design.

### Option D: Bundle the store into the contracts ADR (ADR 0064)

Already rejected by ADR 0064 Option C: persistence is runtime/storage work that would pull
charter inv-7 class-I scope into the contract layer; ADR 0057 explicitly deferred atomic
append + unique-genesis to *this* ADR.

## Consequences

### Accepts

- The `AuditEvent` envelope (ADR 0064) gains a designed, tamper-evident persistent home;
  ADR 0057 audit rule 7 (atomic per-chain-root append + unique-genesis deferral) is
  discharged at the design layer.
- Atomic append, unique-genesis, and fork/gap/replay rejection are **substrate guarantees**
  (WAL transaction + PRIMARY KEY/UNIQUE constraints) plus an in-transaction head check, not
  hand-rolled invariants.
- The store is internal-only (inv-4), runtime-state-located (inv-10), append-only, and
  secret-free (inv-5) by construction.
- The mint result's `audit_event_ref` (ADR 0064) has a concrete referent: a `(chain_root,
  link_index)` row in this store.

### Rejects

- Any agent-callable audit-write surface (inv-4 forbidden pattern).
- Hand-rolled atomic-append/locking (Option B) for the live store.
- A substrate-abstract design that re-defers the central mechanism (Option C).
- Bundling persistence into the contract ADR (Option D / ADR 0064 Option C).
- Introducing a new reason kind in this ADR (storage-corruption reason-kind family is a
  future amendment; `audit_chain_corruption_detected` is reused).
- Any storage code, DDL, migration, runtime, endpoint, schema source, generated JSON
  Schema, live-policy, generated-snapshot, or system-config change in this ADR slice.

### Future amendments

- The `AuditEvent` envelope Zod schema PR (ADR 0064 future amendment) — finalizes the
  envelope columnization this store carries.
- A storage-level **corruption reason-kind family** (gap-detected, fork-detected,
  hash-mismatch, duplicate-genesis) if the implementation shows
  `audit_chain_corruption_detected` is too coarse for storage-layer diagnosis.
- **Retention / GC / archival** policy (audit is durable by default; if archival lands it
  is append-only cold storage, never deletion).
- The **external untrusted-testimony** table + endpoint (inv-4), as its own ADR.
- The **integrity-verifier** and **dashboard read** behaviors (the verifier re-walks each
  chain; the dashboard renders the chain) — consuming ADRs.
- The Ring-1 **implementation PR** (class-I, M4-gated): the SQLite DDL, the single-writer
  service, migrations, and the append/verify code.

## Out of scope

This ADR explicitly does not authorize: Ring-1 implementation code, SQLite DDL/migration,
a runtime, or an endpoint; the `AuditEvent` Zod (ADR 0064's schema PR); retention/GC,
archival/rotation, or a storage-corruption reason-kind family; the external
untrusted-testimony table; the dashboard/integrity-verifier/broker/gateway behaviors; any
Ring-0 schema or generated JSON Schema change; live-policy / `tiers.yaml` /
generated-snapshot / system-config edits; edits to ADR 0057, 0058, 0059, 0061, or 0064;
new producers (the allowlist stays the registry `Kernel-trusted producer allowlist final
state`).

## Acceptance criteria

- Operator confirms the SQLite-WAL substrate + core scope (confirmed 2026-06-23).
- `hcs-architect`, `hcs-ontology-reviewer`, `hcs-policy-reviewer`, `hcs-security-reviewer`,
  and `hcs-eval-reviewer` complete review and all blocking findings are absorbed or
  explicitly rejected by the operator; `hcs-security-reviewer` is load-bearing (audit
  integrity, internal-only, no agent-callable write, no secret at rest).
- The store stays design-only: no SQLite file, DDL, migration, runtime, endpoint, schema
  source, or generated JSON Schema in the acceptance slice.
- The design discharges ADR 0057 audit rule 7 (atomic per-chain-root append + unique
  genesis) and provides the persistent home for the ADR 0064 `AuditEvent` envelope without
  re-scoping ADR 0057/0064 or introducing a new reason kind.
- The store honors inv-4 (internal-only; external testimony separate/untrusted), inv-7
  (design-only; implementation M4-gated), inv-10 (runtime-state location, never in repo),
  and inv-5 (no secret at rest).
- The acceptance commit records a new `DECISIONS.md` row (D-080) and states that ADR 0077
  discharges ADR 0057 audit rule 7 and homes ADR 0064's deferred persistence.
- `just verify` remains green.

## Follow-up regression coverage

Design-only; seeds no synthetic traps. Records implementation-test obligations for the
M4-gated store PR:

| Failure class | Coverage posture |
|---|---|
| Duplicate genesis for a chain root | Implementation test obligation: a second `link_index = 0` / second `prior = GENESIS` for an existing `chain_root` rejects (PRIMARY KEY + service check) and records a fail-closed rejection AuditEvent. Security-load-bearing. |
| Fork (two links share a parent) | Implementation test obligation: `UNIQUE (chain_root, prior_link_hash)` rejects the second; surfaces `audit_chain_corruption_detected`. |
| Gap / out-of-order append | Implementation test obligation: an append whose `prior_link_hash` ≠ the chain head, or whose `link_index` ≠ head + 1, rejects in-transaction (no partial commit). |
| Replayed / mismatched link hash | Implementation test obligation: `UNIQUE (this_link_hash)` rejects a replay; a `this_link_hash` ≠ the recomputed canonical hash rejects. |
| Agent-callable audit-write attempt | Implementation test obligation: there is no write path reachable by an agent/broker/gateway/dashboard; only the single-writer service path appends (inv-4). Security-load-bearing. |
| Crash mid-append | Implementation test obligation: a simulated crash between read-head and commit leaves the chain at the prior head (WAL atomicity), with no half-link. |
| Secret-at-rest scan over a fixture store | Implementation test obligation: a representative store carries only ids/enums/hashes/timestamps; `forbidden-string-scan`/gitleaks find no secret. (Repo-exclusion is the separate `no-runtime-state-in-repo` gate — cited, not re-tested here — inv-10.) |
| **Chain truncation / tail-delete (after-the-fact tamper)** | Implementation test obligation, **security-load-bearing**: after an out-of-band `DELETE` of a chain tail, an append whose head check now passes against the shortened chain is STILL caught by the **periodic full chain-walk verifier** (genesis→head hash recomputation detecting the missing `link_index`). Proves tamper-*detection* is real, not merely append-time constraint enforcement (SQLite has no append-only enforcement). |
| Store filename gate coverage | Implementation test obligation: the finalized store filename + its WAL/SHM siblings are matched by `no-runtime-state-in-repo.sh` patterns — assert the *actual* filename, not a generic `*.sqlite` — permanently closing the B-1 round-1 finding. |
| `recorded_seq` total order / monotonicity | Implementation test obligation: `recorded_seq` is store-generated `NOT NULL` and gap-free-monotonic across interleaved appends to two different chain roots (the total order the DDL sketch asserts must be constrained, not just described). |

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md` v1.6.0 — invariants
  4 (audit internal; external testimony separate/untrusted), 5 (no secret at rest), 7
  (design-only; no execution path), 8 / 18 (sandbox/self-asserted non-promotion; chain-walk
  rejection — consumed), 10 (runtime-state location; SQLite runtime state not in repo), 13
  (load-bearing state is not gitignore-deletable).
- ADR 0057 / D-052: `docs/host-capability-substrate/adr/0057-ring-1-mint-audit-service.md`
  — the service boundary and **audit rule 7** (atomic per-chain-root append + unique-genesis
  deferred to this ADR).
- ADR 0064 / D-062:
  `docs/host-capability-substrate/adr/0064-ring-1-mint-audit-service-contracts.md` — the
  `AuditEvent` envelope contract this store persists; the explicit deferral of persistence /
  atomic append / unique-genesis; the canonical-hash + `chain_link_meta`-is-not-a-record-field
  framing.
- ADR 0059 / D-058:
  `docs/host-capability-substrate/adr/0059-agentclient-canonical-hash-amendment.md` — "the
  chain root is `agent_client_id`," GENESIS handling, length-prefix discipline (the chain-root
  model generalized here).
- ADR 0056 / D-046 + ADR 0058 / D-053 — `audit_chain_corruption_detected` (cycle/structural;
  reused here) and the cycle-vs-depth split.
- ADR 0070 / D-068 (Artifact) — the append-only / digest-addressed / immutable precedent for
  records that correct by appending a new entry, not editing.
- Ontology registry: `docs/host-capability-substrate/ontology-registry.md` v0.4.36 —
  `Audit-chain coverage of rejections`, `Canonical-concatenation length-prefix discipline`,
  `Kernel-trusted producer allowlist final state`.
- Decision ledger: `DECISIONS.md` — D-052, D-053, D-058, D-062; D-080 added on acceptance.

### External

- SQLite WAL mode and `synchronous=FULL` durability semantics (the substrate's atomic-commit
  and crash-recovery guarantees the design relies on). Verified against the installed SQLite
  at implementation time per inv-14; not pinned here.

## Revision history

- 2026-06-23: Initial proposal (v1). Operator-confirmed scope: SQLite (WAL) substrate; core
  store + boundaries (append/genesis/corruption-detection + the inv-4/inv-10 boundaries;
  retention/GC and a storage-corruption reason-kind family deferred).
- 2026-06-23 (v2): Folded the round-1 five-lens review (architect/ontology/policy/eval = zero
  blocking; security load-bearing = one blocker). **B-1 (security):** renamed the store file
  `audit-events.db` → `audit-events.sqlite` so it + its WAL/SHM siblings are matched by the
  `no-runtime-state-in-repo` gate's `*.sqlite*` patterns, corrected the false "already barred"
  claim, and recorded the M4 gate-confirmation obligation. Non-blocking folds: the explicit
  "SQLite has no append-only enforcement → the periodic full chain-walk is the mandatory
  tamper-detection" threat-model sentence (§5); `recorded_seq` store-generated / `NOT NULL` /
  never-payload-supplied; the seven-vs-eight `entity_kind` clarification + `entityIdSchema`-shaped
  `chain_root`/`subject_ref`; and three added implementation-test obligations (chain-truncation,
  gate-filename coverage, `recorded_seq` monotonicity).
- 2026-06-23 (accepted): Operator merged the propose PR #82 and directed proceed; status
  flipped `proposed` → `accepted` with the **D-080** ledger row. Discharges ADR 0057 audit
  rule 7 and homes ADR 0064's deferred persistence. Design-only acceptance — no DDL/runtime/
  endpoint/schema byte change; the M4-gated implementation PR follows.
