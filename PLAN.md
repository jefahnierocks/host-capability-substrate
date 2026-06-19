# PLAN.md — Host Capability Substrate


Milestone-by-milestone implementation plan. Follow in order. Each milestone has acceptance criteria and validation commands. Do not skip validation.

Research plan (canonical): `~/Organizations/jefahnierocks/system-config/docs/host-capability-substrate-research-plan.md`.

## Current Focus — Milestone 1 COMPLETE: the 22-entity Ring-0 ontology is landed at source (22/22)

**2026-06-08 update.** **Milestone 1 (Ontology schemas, Ring 0) is met.** All 22
canonical Ring-0 entities are landed as Zod schemas + generated JSON Schema +
`schema_version` + ontology/registry docs, with the final entity —
**ResourceBudget** (ADR 0072 / D-070, schema **PR #44 merged**) — closing the set.
Ontology **v1.32.0**, registry **v0.4.35**, charter **v1.5.0**; ADRs span
**0001–0075** (0026 absent); decisions accepted through **D-076**. **D-074**
remains RESERVED pending the ADR 0074 accept-flip (0074 merged via #68 but still
`proposed`); D-075/D-076 landed ahead of it. The 2026-06-11 remediation/queue
arc (PRs #52–#64) landed the doc-honesty fixes, the doc-pointer and
shared-state-naming gates, the D-071/D-072 Fable 5 re-baseline + settings pin,
and the accepted ADR 0073 charter amendment; the operator selected
**Milestone 2** as the next lane.

**The canonical 22 (all present at source):** HostProfile, WorkspaceContext,
Principal, AgentClient, Session, ToolProvider, ToolInstallation, ResolvedTool,
Capability, OperationShape, CommandShape, Evidence, ExecutionContext, PolicyRule,
Decision, ApprovalGrant, Run, Artifact, Lease, Lock, SecretReference,
ResourceBudget. (`EnvProvenance`, `CredentialSource`, `StartupPhase` remain Phase 1
supplemental until a Q-011-guided ontology review promotes them.)

**M1 acceptance verified (2026-06-08):**

- 22/22 canonical entities as Zod schemas with `schema_version` ✓ (a 22-agent
  per-entity coverage audit confirmed source + generated JSON Schema + tests +
  ontology section + registry ledger row + index export for every entity).
- `just generate-schemas --check` → "generated schemas are current" ✓
- `just test schemas` → green (now 34 files / 415 tests after adding the
  ExecutionContext dedicated suite) ✓
- `just verify` green on fresh `main` ✓
- Provenance base shape (`Evidence`) is reusable by every fact-returning entity ✓
- This pass also closed the one real coverage gap the audit surfaced —
  **ExecutionContext** was previously exercised only indirectly; it now has a
  dedicated `packages/schemas/tests/execution-context.test.ts`. (The audit's
  second flag — "no `Evidence` enum-mirror block" — is a false positive: the base
  `Evidence` enums are governed in dedicated first-class registry sections
  §Subject-kind grounding / §Authority discipline / §Redaction posture, which is
  more thorough than a mirror block; adding one would duplicate them.)

**Next surface (operator-gated milestone choice).** With Ring 0 complete, the two
forward lanes are:

1. **Milestone 2 — Policy snapshot + decision package** (the next milestone in
   sequence): the ADR 0034 `boundary_evidence_*` reason/grant enum lift is
   **DONE** (PR #66 / commit `446503b`, registry **v0.4.35**). Remaining M2
   work: `tiers.yaml` validates against Zod entity schemas; `Decision` /
   `ApprovalGrant` consumption of `BoundaryObservation` evidence refs implements
   the settled Q-007(d) stateness matrix — rows {`stale`, `missing`,
   `contradictory`} (the `stale` row keyed to `valid_until` expiry), with
   `unknown` evaluating as `missing` (ADR 0034 v2, accepted 2026-05-03);
   tiers.yaml gains per-`boundary_dimension` freshness windows; YAML policy
   loader rejects malformed/stale-schema-version files with digest verification
   per ADR 0060 B-2; the policy input shape is defined. **No execution path.**
2. **Deferred Ring-1 design slices** (gated; design/interface-only — charter inv. 7
   keeps class-I work unmergeable until M4): the **ADR-0064 contract-Zod schema PR**
   (typed `MintRequest` / `MintResult` + the `AuditEvent` envelope) and the
   **audit-events / storage ADR** (persistence + atomic append + unique-genesis).
   These were explicitly deferred at ADR 0064 acceptance pending the Ring-0 set.

Q-013 credential-plane v1 schemas landed 2026-05-07 (ADR 0043;
`credential-plane-evidence.ts`) and are already consumed by the landed Q-014/Q-015
slices; remaining Q-013 work (reconciler, broker, receipt entities) awaits a
follow-on accepted ADR.

**Tracked substrate item (not milestone-blocking) — permission-posture as a
queryable fact.** A repo can tighten harness gate-1 (HCS's `defaultMode: ask` +
path-scoped `Edit()` allowlist in `.claude/settings.json`), but there is no
machine-readable signal an incoming agent — or an unsituated general assistant
reading `AGENTS.md` — can consult to learn "this repo tightened gate-1, so any
'no settings change needed' claim is false here" *before* proposing config. The
`zsh`-only opt-out is already a queryable fact; the gate-1 posture is not.
Encoding it (a future-ADR candidate) would pre-empt that class of unsituated
overclaim at the source. Surfaced by ADR 0074; deliberately deferred so it
cannot block the handoff convention.

The prior Current Focus (policy-registry chain + CI wiring) is retained below as
provenance.

<!-- doc-pointer-check: provenance-below — dated prior-focus sections; historical
     version pointers below this line are point-in-time and not checked. The
     milestone definitions further down contain no version pointers. -->

## Prior Focus — policy-registry chain CLOSED at source; CI wired; ready schema slices + Ring-1 mint/audit DESIGN ADR next (SUPERSEDED 2026-06-08)

**2026-06-07 update.** The policy-registry entity chain is **closed at the
source layer**: PolicyRule (ADR 0060 / D-057, schema PR #10), Capability
(ADR 0062 / D-060, schema PR #13), and CommandShape (ADR 0063 / D-061, schema
**PR #15 merged 2026-06-07**) are all on `main`. `main` is at `743b400b`;
registry **v0.4.23**, ontology **v1.21.0**; ADRs span **0001–0063**; the M1
source-schema baseline is **14 of 22**. ADR 0059 (AgentClient canonical-hash,
D-058) and ADR 0061 (Decision rule-attribution, D-059) remain **accepted with
schema PRs pending**.

**Active next surface (in order):**

1. **Foundation pass (this change).** GitHub Actions CI now runs `just verify`
   on every PR and on `main` (`.github/workflows/verify.yml`, macos-latest) — the
   ring-boundary, schema-drift, policy, and forbidden-string gates the Definition
   of Done assumes are finally machine-enforced, not local-only (the local
   `just verify` is also confounded by the CredentialSource sandbox quirk; a
   clean runner is not). Plus README/PLAN currentness. Tracked follow-ups: Ubuntu
   portability and action SHA-pinning.
2. **Ready schema slices** (accepted, independent, FK targets merged): land
   **AgentClient** (ADR 0059 / D-058 → 7th audit-chain mint entity) and the
   **Decision rule-attribution** amendment (ADR 0061 / D-059, additive
   nullable-optional `policy_rule_ref` + `resolved_policy_sha256`, no
   `schema_version` bump).
3. **Ring-1 mint/audit DESIGN ADR** per ADR 0057 — interfaces/schema/contracts
   only, scoped to the six landed mint entities
   (Decision/ApprovalGrant/Lease/Run/Principal/Session) plus AgentClient
   (unblocked by ADR 0059). **No runtime/SQLite/launchd/persistence/
   agent-callable mutation endpoints** — charter inv. 7; class-I work is
   unmergeable until M4.
4. **Remaining lower-coupling M1 entities** as independent ADR + schema slices —
   **SecretReference first** (closes CommandShape's forward `secret_reference_ref`
   FK), then HostProfile, ToolProvider, ToolInstallation, ResolvedTool, Artifact,
   Lock, ResourceBudget.
5. Q-013 credential-plane v1 schema is ready-now (optional; unblocks Q-014).

**Operator-gated parallel decision.** The W-C **Rego reorientation** for the
bright-line forbidden classifier (proposed D-063 / D-064 + likely ADR 0064) —
scratch proposals at
`docs/host-capability-substrate/research/local/2026-06-04-hcs-codex-orientation/`.
Preserves canonical policy in `system-config`; no hook-owned enforcement; `opa`
is not yet in the toolchain.

**Low-risk fold-ins (Ring 3 docs).** W-B retire dead Codex profiles (D-062),
W-D autonomy envelope, porting high-frequency charter invariants into
`.agents/skills/` (cross-tool adherence under Codex too), and extending the
tooling-surface matrix to model new cloud/local agent surfaces (Warp/Oz, Cursor,
Devin Desktop, GitHub Agent HQ, Antigravity) as **observed authority surfaces
only** — not adopted configs.

The detail below records how the chain became unblocked; it is retained as
provenance.

**2026-05-30 update (superseded by the 2026-06-07 update above; retained as
provenance).** The policy-registry entity chain is **complete at the
ADR layer**: PolicyRule (ADR 0060 / D-057, schema PR #10 merged), Capability
(ADR 0062 / D-060, schema PR #13 merged), and CommandShape (ADR 0063 / D-061,
**acceptance PR #14 OPEN** — merges CommandShape's accepted ADR + the D-061 row;
its schema PR follows after merge). ADR 0059 (AgentClient canonical-hash) is
**accepted (D-058)** and ADR 0061 (Decision rule-attribution / B-1) is
**accepted (D-059)**, both merged (PR #11). `main` is at `6d2a068`; registry is
**v0.4.22**, ontology **v1.20.0**; ADRs span **0001–0063**.

**Active next surface (in order):**

1. **Merge PR #14** (operator-gated), then land the **CommandShape schema PR**
   (`command-shape.ts` + generated JSON Schema + tests + ontology/registry per
   ADR 0063 §Implementation plan; mirrors the `capability.ts` non-minted peer).
2. **Then open the scoped Ring-1 mint/audit DESIGN ADR** per ADR 0057's accepted
   design — interfaces/schema/contracts only, scoped to the six landed mint
   entities (Decision/ApprovalGrant/Lease/Run/Principal/Session) plus AgentClient
   (now unblocked by ADR 0059); the AgentClient + Decision-attribution (ADR 0061)
   schema PRs sequence in here too. **No runtime/SQLite/launchd/persistence/
   agent-callable mutation endpoints** — charter inv. 7; class-I work is
   unmergeable until M4.
3. Q-013 credential-plane v1 schema is ready-now (optional; unblocks Q-014).
4. Remaining lower-coupling M1 entities (HostProfile, ToolProvider,
   ToolInstallation, ResolvedTool, Artifact, Lock, SecretReference,
   ResourceBudget) follow as independent ADR + schema slices.

The detail below records how the chain became unblocked; it is retained as
provenance.

**2026-05-29 update (supersedes the stale gating framing below).** The Phase 2.5
policy gate is **satisfied**, verified against HCS-vendored evidence: the
`system-config` live `policies/host-capability-substrate/tiers.yaml` is
`status: active`, schema `0.2.0`, operator-approved
(`jeffreyverlynjohnson@gmail.com`, 2026-05-18T17:10:15Z) via the deliberate
`hcs_unblock_fast` activation path; the HCS snapshot is vendored at
`policies/generated-snapshot/tiers.yaml` with `snapshot-binding.json` bound to
system-config commit `136dbaa` (`source_policy_sha256 e06442e0…`), and
`just snapshot-binding-check` is wired into `just verify` and green (D-051). The
earlier "next safe HCS slice: none / live policy not promoted" framing is stale.

The forward surface is OPEN. Active HCS lane (per the 2026-05-29 coordinator
directive `docs/orchestration/2026-05-29-hcs-ring1-progress.md`):

1. **Resume the Ring-0 M1 entity train** in Ring-1-mint dependency order —
   **PolicyRule first** (the live policy references it as
   `policy_rule_schema_version: null`; landing it removes that dangling ref),
   then **Capability** and **CommandShape** (the mint/audit service validates
   operation references against these). Each is its own ADR + 4-subagent pass +
   Zod + generated JSON Schema + tests + ontology/registry docs per the proven
   ADR 0049–0055 pattern (`.agents/skills/hcs-schema-change`). Confirm the exact
   order against ADR 0038 before drafting.
2. **Then open the scoped Ring-1 mint/audit IMPLEMENTATION ADR** per ADR 0057's
   accepted design — interfaces/schema/contracts only (producer allowlist,
   audit-chain integrity, cross-record enforcement, fail-closed reason-kind
   discipline), scoped to the six landed mint entities
   (Decision/ApprovalGrant/Lease/Run/Principal/Session); AgentClient deferred
   pending ADR 0059. **No runtime/SQLite/launchd/persistence/agent-callable
   mutation endpoints** — charter inv. 7; class-I work is unmergeable until M4.
3. Q-013 credential-plane v1 schema is ready-now (optional; unblocks Q-014).

**Deferred post-activation hardening lives in system-config's lane** (not HCS):
`policy-lint.sh` six-check expansion; nine negative-test fixtures; and the live
policy's own stale internal markers (`hcs_snapshot_status: not_vendored`,
`hcs_source_commit: 83b24eb`, the internal candidate-blob `source_policy_sha256`).
Fixing those changes operator-approved policy bytes, so it needs operator sign-off
plus a coordinated byte-identical HCS re-vendor; none hard-blocks the Ring-1
design ADR.

Recent landed context: the 2026-05-28 integration passes are merged to `main`
— D-054/D-055/D-056 (tool-baseline re-baseline to Opus 4.8 / CC `2.1.156` +
codex capability staleness + credential-plane seam; PR #5) and the parent-org
control-plane restatement (PR #6). The 2026-05-29/30 M1 train then landed
PolicyRule (PR #9 + #10), ADR 0059 + ADR 0061 acceptance (PR #11), Capability
(PR #12 + #13), and CommandShape acceptance (PR #14, open). ADR 0059
(AgentClient canonical-hash) is **accepted (D-058)** — its round-2 returned a
unanimous yes.

## Prior Focus — HCS-local workstation contract restatement

**2026-05-17 docs-only restatement pass:** an operator-relayed
integration directive created a Ring 3 / class A restatement slice for
the HCS workstation surface. The first pass added
`docs/host-capability-substrate/workstation-surface-contract.md`,
recorded the inventory at
`docs/host-capability-substrate/restatement-inventory-2026-05-17.md`,
added the relayable readout at
`docs/host-capability-substrate/usable-state-readout-2026-05-17.md`,
and linked the contract from the root agent-facing files.

This pass restates, in HCS wording, the four authority surfaces HCS must
keep separate (actor identity, managed resource, authorization binding,
runtime evaluation), the local role/responsibility framework, the
Cloudflare operator identity transition (`jeffreyverlynjohnson@gmail.com`
interim; `guardian@thenash.group` target after the Phase 2 account email
migration), the OAuth-native Cloudflare MCP baseline
(`cloudflare-api` at `https://mcp.cloudflare.com/mcp`), and HCS-side
interfaces with nearby jefahnierocks projects.

This docs slice does not change the Phase 2.5 code/policy gate: it does
not authorize provider writes, live policy activation, sibling-repo
edits, remote push, schema changes, hook behavior changes, or Ring 1
service work. Historical ADRs, decision rows, and research notes may
preserve older external vocabulary as provenance; current HCS operating
guidance should be restated in HCS-owned docs before becoming default
session context. `just agent-contract-identity-scan` is now part of
`just verify` and guards the default contract surfaces against reintroducing
external organizational identifiers as active operating guidance.

## Prior Focus — Policy-lint split implemented on HCS side (SUPERSEDED 2026-05-29)

**SUPERSEDED 2026-05-29:** the live policy is now `status: active` and the HCS
snapshot is vendored (D-051), so the "live policy still gated" / "next safe HCS
slice: none" framing in this section is historical. See the Current Focus above.
The detail below is retained as provenance for the Phase 2.5 closeout.

**2026-05-17 cross-repo refresh:** see
`docs/host-capability-substrate/phase-2-5-policy-handoff-2026-05-17.md`
for the fresh-agent packet. At the start of this closeout pass, HCS
`main` was clean and aligned with `origin/main` at `4373007`
(`docs: refresh hcs handoff status (2026-05-17)`). The HCS-side Phase
2.5 closure commits are `0440c9c` (ADR 0056 reason-kind schema),
`2d45327` (hook-local arrays removed), and `78f0d13` (policy snapshot
lint split). Source-schema baseline holds at **11 of 22** canonical M1
entities.

Sibling `system-config` has not advanced HCS-related policy work since
the Phase 2.5 draft/lint-stub lane; recent commits there are
device-admin / Google-admin scope only. During the final closeout check
it was clean and ahead of `origin/main` by three non-HCS commits, with
no diffs observed under `docs/host-capability-substrate/`,
`policies/host-capability-substrate/`, or `scripts/policy-lint.sh`. The
system-config side still owes the full activation lane before the HCS
snapshot lane can open:

- **`scripts/policy-lint.sh` (currently 156-line stub).** Six required
  checks remain: grant-scope specificity + single-use + non-reuse;
  `external_control_plane_mutation` typed provider evidence;
  `worktree` lease-acquire blocks sandboxed execution contexts;
  structured `cross_record_rules` shape for self-approval rejection +
  producer disjointness + force-break posture; raw secret-material
  rejection; source commit/path/hash binding (today the stub only
  checks `source_policy_sha256`).
- **Lint fixtures under `tests/policies/host-capability-substrate/`.**
  None exist. The Phase 2.5 candidate lists nine `proposed_lint_fixtures`
  paths all marked `status: not_created` (forbidden-with-approval-path,
  broad-grant-scope, grant-reuse,
  external-mutation-missing-provider-evidence,
  sandboxed-worktree-lease-acquire, invalid-reason-kind,
  raw-secret-material, snapshot-binding-missing,
  tier-valid-until-ceiling-exceeded).
- **Phase 2.5 candidate stale against HCS-side closures.** The
  `tiers.yaml.v0.2.0-skeleton.yaml` still carries
  `activation_blockers_remaining: [fix_4_reason_kind_path,
  fix_7_policy_lint_placement]` — both closed (`fix_4` by D-046 +
  ADR 0056 Option B; `fix_7` by D-048 split). Four forbidden-pattern
  `reason_kind_status` rows + `forbidden_policy.reason_kind_strategy`
  + `proposed_lint_fixtures.placement_status` still say
  `pending_fix_*_decision`. `provenance.hcs_source_commit` is `f8792b3`,
  superseded by the HCS-side closure commits (`0440c9c`, `2d45327`,
  `78f0d13`) and later handoff commits. The reviewer resolution packet
  frontmatter remains `status: blocked-pending-activation-fixes`.
- **Live `policies/host-capability-substrate/tiers.yaml`.** Not
  promoted; the only file in that dir is
  `project-substrate-admission.yaml`.

The HCS Phase 2.5 activation candidate remains non-authoritative at
`docs/host-capability-substrate/tiers.yaml.v0.2.0-skeleton.yaml` in
system-config; no live `policies/host-capability-substrate/tiers.yaml`
exists, no HCS policy snapshot has been vendored, and no Ring 1
service ADR has been opened.

ADR 0056 v3 is accepted (D-046). The follow-up schema slice now promotes
`operation_class_unregistered` and `audit_chain_corruption_detected` into
`decisionReasonKindSchema`, keeps both values deny-only, keeps
`Decision.schema_version == '0.1.0'`, and makes
`operation_class_unregistered` non-clearable (`required_grant_kind` must
be `null`; any non-null grant kind rejects). `Decision.operation_shape_ref`
remains required; missing, null, or invalid refs reject for that reason
kind. No nullable or sentinel OperationShape path is authorized. The
slice updates Zod source, generated JSON Schema, schema tests, ontology
docs, and ontology-registry status tables together per
`.agents/skills/hcs-schema-change`.

Hook-local policy-copy cleanup is complete (D-047): project hook bodies
are thin wrappers and no longer contain hook-local forbidden-pattern
arrays. The interim classifier remains non-authoritative measurement
code.

Policy-lint placement is split (D-048). `system-config` owns live policy
lint for activation metadata, provenance, forbidden-no-approval posture,
grant scope/reuse, provider evidence, sandbox lease-acquire posture,
structured cross-record policy rules, and no secret material. HCS owns
only generated-snapshot compatibility lint after a snapshot is vendored:
source commit/path/hash binding, generated schema-ref compatibility,
`operation_class_defaults` coverage, reason-kind compatibility, and
snapshot path checks.

**Next safe HCS slice:** ~~none~~ **(SUPERSEDED 2026-05-29 — the activation this waited on has happened: live policy `status: active`, snapshot vendored (D-051). Current forward surface is the M1 entity train (PolicyRule → Capability → CommandShape) then the Ring-1 mint/audit design ADR; see Current Focus.)** Original text: none. The HCS side has discharged its part
of the Phase 2.5 lane (D-046 schema landed; D-047 hooks; D-048 split).
The next action is system-config-side and is NOT to be performed from
this repo. Specifically: expand `scripts/policy-lint.sh` with the six
missing checks, create the nine negative-test fixtures, refresh the
Phase 2.5 candidate to mark both `fix_4_reason_kind_path` and
`fix_7_policy_lint_placement` resolved (citing D-046 / ADR 0056 and
D-048), update `provenance.hcs_source_commit` to a current HCS head,
then promote to live `policies/host-capability-substrate/tiers.yaml`
with `status: active` and full source commit/path/hash binding.

**Follow-on sequence:** once the live policy lands in system-config,
the HCS side vendors a snapshot into `policies/generated-snapshot/`
with `snapshot_binding.{system_config_commit, source_policy_path,
source_policy_sha256}` populated and HCS-side snapshot compatibility
lint enabled. Only after the snapshot exists does a scoped Ring 1
mint API + audit-chain ADR open. The first Ring 1 service is
mint/audit, not the execution broker.

## Milestone Baseline — M1 forward train resuming (policy gate satisfied); Ring-1 mint/audit DESIGN ADR is the next milestone

**2026-05-29 update.** Policy gate **satisfied** (live `tiers.yaml status: active`
2026-05-18; HCS snapshot vendored + bound at system-config `136dbaa`, D-051), so
Ring-1 implementation is no longer policy-gated — it is gated only on the
lower-coupling M1 entity landings and on charter inv. 7 (which keeps the first
Ring-1 ADR to design/interface scope: no execution endpoints, no
SQLite/launchd/persistence, class-I unmergeable until M4). Since the 2026-05-11
Step-3 snapshot below: ADR 0057 (Ring-1 mint/audit service **design**) accepted
(D-052); ADR 0058 (depth-overflow reason_kind) accepted + schema landed (D-053);
ADR 0059 (AgentClient canonical-hash) accepted (D-058); ADR 0061 (Decision
rule-attribution / B-1) accepted (D-059); the generated-snapshot lane opened
(D-051); the 2026-05-28 tool-baseline + config-posture passes landed
(D-054/D-055/D-056) and the parent-org control-plane restatement merged; and the
**PolicyRule → Capability → CommandShape** chain landed (D-057 / D-060 / D-061),
taking the source-schema baseline to **13 of 22** canonical M1 entities
(PolicyRule + Capability merged; CommandShape schema follows PR #14). The active
lane is now the scoped Ring-1 mint/audit design ADR for the six landed mint
entities plus AgentClient (unblocked by ADR 0059).

**2026-05-11 update:** ADR 0055 Session accepted (D-044; commits
`4e8fe23` v1 → `1ba8a2c` v2 → `01d1357` accept; 2-revision cycle
matching ADR 0049 + ADR 0052 + ADR 0054 efficiency tier). Session
landed as Ring 0 source in the coordinated schema PR following the
Step 1 + Principal train patterns. Source-schema baseline shifts **10
of 22 → 11 of 22** canonical M1 entities built. The coordinated slice
also closed 4 forward-reference typed FK targets in the just-landed
Step 1 train (Lease.held_by_session_id, Run.invoker_session_id,
ADR 0030 v2 owning_session_id, and consuming/requesting session
references in ADRs 0031 v1 / 0051 v4 / 0052 / 0054 self-approval
rejection + holder-only release rules). 14-item registry change-set
(v0.4.17 → v0.4.18). Lease.ts + Run.ts `.describe()` text updated to
reference Session as typed FK target (NO shape change to
entityIdSchema; consuming entities' schema_version values remain
`'0.1.0'`).

**Step 3 progress — COMPLETE at the highest-coupling layer**:
- Entity #1 (`Principal`, ADR 0054 / D-043) ✓ designed + landed as
  Ring 0 source at commit `8382194`
- Entity #2 (`Session`, ADR 0055 / D-044) ✓ designed + landed as
  Ring 0 source at this slice

Both highest-coupling forward-references in the just-landed Step 1
train (Decision/WorkspaceContext/ApprovalGrant/Lease/Run) are now
closed at both the design AND the Ring 0 source layers.

**Remaining-M1 gap (11 less-critical canonical entities)**:
HostProfile, ToolProvider, ToolInstallation, ResolvedTool, Capability,
CommandShape, PolicyRule, Artifact, Lock, SecretReference,
ResourceBudget. These have lower coupling to the just-landed
foundational train; each requires its own ADR + schema PR per the
established pattern. Per the workflow-sequencing investigation §Step
4, Ring 1 implementation at `packages/kernel/` can now honestly begin
for services whose policy/schema prerequisites are present (mint API
+ broker FSM + audit hash chain + lease manager + gateway re-derive
+ execution broker).

**Current follow-on requirements:**

1. **ADR 0056 schema PR:** implemented in the current schema slice:
   `operation_class_unregistered` and `audit_chain_corruption_detected`
   are promoted into `decisionReasonKindSchema`, with the accepted v3
   non-clearability and `operation_shape_ref` tests.
2. **Hook policy-copy cleanup:** complete in D-047; hooks delegate and
   carry no local policy arrays.
3. **Policy-lint split:** complete on the HCS side in D-048; live-policy
   lint and activation fixtures remain system-config-owned.
4. **Cross-repo policy gate:** Phase 2.5 canonical policy YAML in
   `system-config/policies/host-capability-substrate/` for
   `OperationShape.operation_class → tier`, force-break grant posture,
   sandbox-acquire rejection, and producer-disjointness enforcement
   posture.
5. **Ring 1 service ADRs:** Scope the first kernel service only after
   its policy/schema prerequisites are explicit. Best first candidates
   remain mint API, audit hash chain/storage, lease manager, gateway
   re-derive, broker FSM, and execution broker.
6. **Remaining M1 entities:** Draft + land the 11 lower-coupling
   canonical entities as ADR + schema PR slices per
   `.agents/skills/hcs-schema-change`.

## Prior Focus — Step 3 entity #1 Principal landed; Session next; Ring 1 implementation gated by policy + Session

**2026-05-11 update:** ADR 0054 Principal accepted (D-043; commits
`85ff783` v1 → `8494fdb` v2 → `f36b3ba` accept; 2-revision cycle
matching ADR 0049 + ADR 0052 efficiency tier). Principal landed as Ring
0 source in the coordinated schema PR following the Step 1 train pattern.
Source-schema baseline shifts **9 of 22 → 10 of 22** canonical M1
entities built. The coordinated slice also includes: structurally closing
the ADR 0051 v4 §Self-approval rejection MT-Sec-2 zero-width-character
evasion class via the new 4-step canonicalization-at-mint recipe (NFC +
**Unicode general-category `Cf` strip** + Unicode-aware lowercase fold +
leading/trailing whitespace trim) committed in the new discrete
§Self-approval rejection rule registry section (registry change-set item
7 v2-reframed from UPDATE → ADD); the `approval-grant.ts`
`grantor_principal_ref` typed-FK target closure (no shape change — both
before and after are `entityIdSchema`; `approvalGrantSchema.schema_
version` remains `'0.1.0'`); 12-item registry change-set (v0.4.16 →
v0.4.17). TR39 confusable defense + Unicode version pinning reserved as
future amendments.

**Step 3 progress (post-commit-`7fb7e05` highest-coupling remaining M1
entities)**: entity #1 (`Principal` ADR 0054 / D-043) ✓ done; entity #2
(`Session` — forward-references Principal via `session.principal_id`)
pending.

## Prior Focus — Foundational Ring 0 schemas landed; Ring 1 implementation gated by policy + remaining M1 entities

**2026-05-11 truth alignment:** The five foundational Ring 0 ADRs are now
landed as Ring 0 schema source per `.agents/skills/hcs-schema-change`:

- `Decision` — ADR 0049 / D-037 / `packages/schemas/src/entities/decision.ts`
- `WorkspaceContext` — ADR 0050 / D-038 / `packages/schemas/src/entities/workspace-context.ts`
- `ApprovalGrant` — ADR 0051 v4 / D-039 / `packages/schemas/src/entities/approval-grant.ts`
- `Lease` — ADR 0052 / D-040 / `packages/schemas/src/entities/lease.ts`
- `Run` — ADR 0053 / D-041 / `packages/schemas/src/entities/run.ts`

All five sibling `*SchemaVersionSchema = z.literal('0.1.0')` literals are
exported from `packages/schemas/src/common.ts`-adjacent entity files. The five
new generated JSON Schemas land under `packages/schemas/generated/`. Focused
schema tests at `packages/schemas/tests/{decision,workspace-context,approval-grant,lease,run}.test.ts`
exercise enum values, schema-version literals, envelope evidence-ref chain
walks, same-record refinements (Decision outcome compatibility, Run
`ended_at >= started_at` + state ↔ time correlation, Lease state ↔
`released_at` / `force_break_grant_id` correlation, WorkspaceContext state ↔
`valid_until` correlation, ApprovalGrant scope.grant_kind = envelope), and
authority/required/nullability expectations. Cross-record enforcement
(Session/Decision/ExecutionContext equality, lease uniqueness,
producer-disjointness, gateway re-derive, self-approval rejection,
`valid_until` inheritance, revoke-wins race tiebreaker, sandbox-acquire
rejection, authorizing-Decision outcome verification) is intentionally
deferred to Ring 1 mint API per registry §Cross-context enforcement layer
§Schema validation alone is not an enforcement layer. `docs/host-capability-substrate/ontology.md`
v1.14.0 documents the five entities; `docs/host-capability-substrate/ontology-registry.md`
v0.4.16 records the consolidated change-set across all 11 items per ADR
(producer allowlist with `kernel_gateway`; producer-vs-kernel-set field
enumeration; enum mirrors; status tables for reason_kind / grant_kind /
lease_kind / run_kind; procedure rules; force-break separation of duties;
worktree-lease cardinality discipline; length-prefix canonical-concatenation
discipline; D-037 producer-disjointness extensions to Lease-acquire and
Run-record).

Ring 1 implementation at `packages/kernel/` is **partially unblocked at the
Ring 0 contract layer** but still gated by:

1. **Phase 2.5 canonical policy YAML** in `system-config/policies/host-capability-substrate/`
   for `OperationShape.operation_class → tier` mapping, force-break grant
   posture, sandbox-acquire rules, and producer-disjointness enforcement
   posture.
2. **Remaining M1 foundational entities** with highest coupling: `Session`
   (forward-referenced by `ApprovalGrant.grantor_principal_ref` via
   consuming-session principal_id comparison; by `Lease.held_by_session_id`;
   by `Run.invoker_session_id`) and `Principal` (forward-referenced by
   `ApprovalGrant.grantor_principal_ref` typed-FK semantics; v1 lives as
   `entityIdSchema` string until typed). The 13-entity canonical gap at
   that point left 11 lower-coupling entities after Session + Principal.

**Next truthful lanes:**

- **Cross-repo policy:** Phase 2.5 canonical policy YAML in
  `system-config/policies/host-capability-substrate/`. Authorizable in
  parallel; it drafts policy shape, not live Ring 1 enforcement.
- **HCS-local Session + Principal Ring 0 entities:** highest-priority
  remaining M1 entities given the forward-references in the just-landed
  foundational five. Each requires its own ADR + schema PR per the
  established foundational-entity pattern.
- **HCS-local remaining M1 entities:** batched per dependency after Session
  + Principal.
- **Ring 1 services:** begin only after the schema/policy prerequisites for
  the selected service are present. Initial candidates remain mint API,
  storage/audit hash chain, lease manager, gateway re-derive, broker FSM,
  and execution broker; each still requires its own Ring 1 ADR scoping.

## Prior Focus — ADR 0052 (Lease) accepted; Step 1 entity #4 of 5 done

**2026-05-10 ADR 0052 (Lease) accepted:** Fourth foundational-entity
ADR per the workflow-sequencing investigation §Step 1 complete (entity
#4 of 5). The `Lease` Ring 0 entity is committed with 15 envelope-level
schema fields (12 kernel-set + 3 producer-asserted-kernel-verifiable
per ADR 0031 v1 §Authority discipline). Single-`lease_kind` v1
(`worktree` only; `credential_audience` and `external_target` are
registry-canonical reservations per ADR 0031 v1 §Out of scope pending
future schema PRs via the registered §Procedure rule). Worktree-
specific cardinality discipline via atomic insert with unique
constraint on `(repository_id, canonical(worktree_path), lease_state
== 'active')` per ADR 0031 v1 Mechanical Tweak #6 / Security-G + TOCTOU
defense. Sandbox-derived lease rejection (charter inv. 8) for
`worktree` lease_kind per ADR 0031 v1 Security-F. 4 lifecycle
transitions (acquire / release / expiry / force-break) with supersession-
via-evidence_refs pattern; holder-only release rule (UUID-byte-equality
session_id comparison; distinct from ADR 0051 v4 principal-string-
canonicalization form). Force-break separation of duties per ADR 0031
v1 Security-H; Phase 1 interim human-dashboard-only posture —
`worktree_lease_force_break_acknowledgment` grant_kind deferred to
coordinated `kernel_dashboard` producer ADR (which also discharges
ADR 0051 v4 deferred pre-emptive grant infrastructure). D-037
producer-disjointness additive cross-step extension to Lease-acquire-
vs-authorizing-Decision per ADR 0049 + ADR 0051 v4 pattern; v1
forced-binary `mint_api` ↔ `kernel_broker`. Charter inv. 6 preserved
structurally upstream at `OperationShape.operation_class` enum
closure + canonical policy YAML per ADR 0051 v4 scope-back; per-
lease_kind `operation_class_scope` column is documentation-only.
6 NEW Decision.reason_kind reservations (all deny-only):
`worktree_lease_held_by_other_session`, `worktree_lease_expired_during_mutation`,
`worktree_not_in_workspace_context`, `lease_acquire_sandbox_rejected`,
`lease_release_unauthorized`, `lease_producer_assertion_unverifiable`.
Phase 1 24h ceiling on `valid_until` per ADR 0031 v1. Envelope-level
superRefine for chain-walk per ADR 0049/0050/0051 precedent; length-
prefix canonical-concatenation discipline inherited from ADR 0051
v4 retroactive posture rule. **One-revision cycle (smoothest of the
foundational-entity train)**: architect + policy + security all
returned ready-for-acceptance on v1; ontology returned 2 mechanical-
text-only blocking items (field-count math + Evidence.subject_kind
factual error) + 5 non-blocking; all absorbed as mechanical tweaks
at acceptance (MT-1 through MT-5 + consolidated cosmetic items).
The preemptive-absorption strategy worked: v1 → accepted in 1
revision compared to ADR 0049 (2 revisions), ADR 0050 (3 revisions),
ADR 0051 (4 revisions). D-040 records the decision. Registry v0.4.14
→ v0.4.15 with 11 specific section additions/updates pending separate
docs commit.

**Step 1 progress** (per workflow-sequencing investigation): entity
#1 `Decision` ✓ (ADR 0049 / D-037); entity #2 `WorkspaceContext` ✓
(ADR 0050 / D-038); entity #3 `ApprovalGrant` ✓ (ADR 0051 / D-039);
entity #4 `Lease` ✓ (ADR 0052 / D-040). **Final entity**: ADR 0053
`Run` (entity #5 — `Evidence.run_id` field semantics + run lifecycle
+ run-execution-context binding).

## Prior Focus — ADR 0051 (ApprovalGrant) accepted; Step 1 entity #3 of 5 done

**2026-05-10 ADR 0051 (ApprovalGrant) accepted:** Third foundational-entity
ADR per the workflow-sequencing investigation §Step 1 complete (entity
#3 of 5). The `ApprovalGrant` Ring 0 entity is committed with 13 schema
fields: typed `grant_kind` enum (3 v1 values closing all three registry
§Decision.required_grant_kind reservations from ADR 0030 + ADR 0035),
discriminated `scope` union with chain-walk-refined evidence refs via
**`approvalGrantSchema` envelope-level superRefine** (mirrors
`decisionSchema` + `qualityGateSchema` precedents; walks unconditionally
across envelope AND scope-payload acknowledged_* refs), kernel-set
`granted_by` allowlist `[mint_api, kernel_broker]` (`kernel_gateway`
excluded by design — gateway re-derive does not mint grants; `kernel_dashboard`
deferred to its own producer ADR), kernel-set `minted_for_decision_id`
**non-null at v1** (pre-emptive grants deferred to future `kernel_dashboard`
producer ADR as coordinated change-set), audit-chain integration with
**canonical-concatenation length-prefix discipline** retroactively
applied to ADR 0049/0050/0051 (defends against hash-input concatenation
collision attack class), and **D-037 producer-disjointness additive
cross-step extension** (Layer 1 mint API walks `derived_from` closure
bounded by walk-depth budget ≤ 64 records + cycle-rejection via
`audit_chain_corruption_detected`; producer equality by class identity,
not by delegation chain). **Charter inv. 6 forbidden-tier
non-escalability** preserved structurally **upstream of ApprovalGrant**
at `OperationShape.operation_class` source-enum closure (8-value closed
enum admits no `'forbidden'`) + canonical policy YAML (system-config
Phase 2.5 lane). **Self-approval rejection rule**: rejects
`grantor_principal_ref == consuming_session.principal_id` for grants
whose underlying operation_class is in non-readonly set; Ring 1 mint
API enforces via canonicalization-aware comparison (Unicode NFC +
lowercase fold + whitespace trim). **Revocation race tiebreaker**:
revoke-wins; race-loser produces TWO typed Decision records
(informational `consume_after_revoke_attempt` + paired deny
`required_grant_kind_unmet`). **6 NEW Decision.reason_kind reservations**
(deny: `grant_expired_at_consumption`, `producer_disjointness_violation`,
`required_grant_kind_unmet`, `self_approval_rejected`,
`audit_chain_corruption_detected`; informational: `consume_after_revoke_attempt`).
Four-revision cycle v1→v4: v1 15+ blockers (producer name drift,
same-step D-037, missing pre-emptive guardrails, undefined revocation
race, etc.); v2 absorbed v1 but surfaced new convergent issues
(typed-Decision audit gap, schrödinger nullable, supersession framing,
tier_scope kebab-case, scope-payload chain-walk leak); v3 removed
pre-emptive infrastructure (collapsed ~6 v2 blockers) + reframed D-037
additive, but surfaced 8 new blockers (tier_scope vocabulary collision
with non-existent `OperationShape.tier`, `inherited_from_gate`
dynamic-dispatch escalation, chain-walk attribution misattribution to
`qualityGateEvidenceRefSchema` instead of envelope, valid_until
cross-record boundary missing §Rejects, hash collision via variable-length
branch_ref, self-approval normalization evasion); **v4 scope-back**:
removed `tier_scope` column entirely + grounded forbidden-tier defense
on existing source-enum closure + policy YAML, committed envelope-level
superRefine, added length-prefix retroactive discipline, bounded
`branch_ref` via `gitBranchRefSchema`, tightened self-approval framing,
added `valid_until` cross-record §Rejects entry, registered walk-depth
ceiling. All four required reviewers ready-for-acceptance on v4 with
5 mechanical tweaks at acceptance. D-039 records the decision. Registry
v0.4.13 → v0.4.14 with 11 specific section additions/updates.

**Step 1 progress** (per workflow-sequencing investigation): entity
#1 `Decision` ✓ (ADR 0049 / D-037); entity #2 `WorkspaceContext` ✓
(ADR 0050 / D-038); entity #3 `ApprovalGrant` ✓ (ADR 0051 / D-039).
Next: entity #4 `Lease` (ADR 0052; ADR 0031 v1 worktree-lease taxonomy
schema landing); then entity #5 `Run` (ADR 0053; `Evidence.run_id`
field semantics).

## Prior Focus — ADR 0050 (WorkspaceContext) accepted; Step 1 entity #2 of 5 done

**2026-05-10 ADR 0050 (WorkspaceContext) accepted:** Second foundational-entity
ADR per the workflow-sequencing investigation §Step 1 complete (entity
#2 of 5). The `WorkspaceContext` Ring 0 entity is committed with 11
schema fields including kernel-set `execution_context_id` per ADR 0031
v1 Mechanical Tweak #8 (Security-C; Layer 1 mint API enforces
`WorkspaceContext.execution_context_id == Session.execution_context_id`
when leases are acquired), `repository_id` + `worktree_path` as
producer-asserted-kernel-verifiable per ADR 0031 v1 §Authority
discipline, `workspaceContextProducerSchema = z.enum
(['kernel_workspace_diagnose'])` (named enum for forward-compatible
allowlist widening), and audit-chain integration mirroring ADR 0049.
Three-revision cycle: v1 returned 8 blocking items including a
critical contradiction with ADR 0031 v1 Mechanical Tweak #8 (silently
superseded `WorkspaceContext.execution_context_id`); v2 absorbed
all 8 + expanded reviewer dispatch to include
`hcs-security-reviewer`; v2 returned 4 blocking (lines 149/182 stale
framing convergent across all 3 reviewers; lifecycle FK staleness;
producer shape divergence); v3 absorbed all 4 + cardinality
clarification + 3 implementation-detail acknowledgments; v3 returned
ready-for-acceptance from architect + ontology. D-038 records the
decision. Registry v0.4.12 → v0.4.13 with 5 specific section
additions/updates.

## Prior Focus — ADR 0049 (Decision) accepted; Step 1 entity #1 of 5 done

**2026-05-10 ADR 0049 (Decision) accepted:** First foundational-entity
ADR per the workflow-sequencing investigation §Step 1 complete. The
`Decision` Ring 0 entity is committed with 12 schema fields, an initial
15-value `reason_kind` Zod-defined enum (out of 35+ registered
reservations; remainder stay registry-canonical pending future schema
PRs), `outcome` discriminator (`'allow' | 'deny' | 'informational'`),
`required_grant_kind` advisory-only enum (3 v1 values; charter inv. 6
forbidden-tier non-escalable preserved), kernel-set audit-chain link
hash (`sha256DigestSchema` covering 11 envelope fields including
`prior_audit_chain_link_hash`; genesis policy via `'GENESIS'` sentinel),
Ring 0 chain-walk Zod refinement on `evidence_refs` mirroring
`qualityGateSchema` superRefine, redaction-mode floor on `reason_text`
(`decisionRedactionModeSchema = evidenceRedactionModeSchema.exclude(['none'])`),
and a producer-disjointness rule defending against Decision-ApprovalGrant
self-approving chain-mint. Registry v0.4.11 → v0.4.12 with 7 specific
section additions/updates. D-037 records the decision. ADR 0036 §Future
amendments §Layer 1 grounding rule extensibility principle full
discharge composes with this entity's enforcement contract; charter
inv. 4 (audit logging is internal side effect) and registry §Audit-chain
coverage of rejections rule now have a typed envelope to reference.
v1 dispatch returned 9-10 blocking items across 4 reviewers (factual
error on Evidence schema-version-bump, omitted `gate_target_already_active`,
producer allowlist drift, registry change-set under-specification,
audit-chain-hash shape gap, secrets-leak guard, chain-walk defense-
in-depth, chain-mint defense); v2 absorbed all. All four required
reviewers (`hcs-architect`, `hcs-ontology-reviewer`, `hcs-policy-reviewer`,
`hcs-security-reviewer`) returned ready-for-acceptance; two mechanical
tweaks at acceptance.

**Step 1 progress** (per workflow-sequencing investigation): entity #1
`Decision` ✓ done. Next: entity #2 `WorkspaceContext` (smallest scope;
ADR 0031 v1 already commits 1:1 cardinality with worktree). Then
`ApprovalGrant` (ADR 0051; ApprovalGrant-side mirror of D-037
producer-disjointness rule), `Lease` (ADR 0051; ADR 0031 v1
worktree-lease taxonomy schema landing), `Run` (ADR 0052;
`Evidence.run_id` field semantics).

## Prior Focus — Foundational Ring 0 entities incomplete; Phase 2.5 policy YAML in system-config can proceed in parallel; Ring 1 services blocked

**2026-05-10 workflow-sequencing investigation:** A docs-only Ring 3
investigation is recorded at
`docs/host-capability-substrate/research/local/2026-05-10-workflow-sequencing-investigation.md`.
It surfaces a foundational-layer gap: of Milestone 1's 22 canonical
Ring 0 entities, **only 8 are built** (`AgentClient`, `OperationShape`,
`Evidence`, `ExecutionContext` plus Phase 1 supplemental
`EnvProvenance`, `CredentialSource`, `StartupPhase`). 14 are missing,
including the most-referenced foundational entities `Decision`,
`WorkspaceContext`, `ApprovalGrant`, `Lease`, and `Run`. The Phase 2
schema train added many Evidence subtypes + the coordination layer +
boundary-observation envelope but did not complete M1's operational
vocabulary. Ring 1 (`packages/kernel/`) is empty; Ring 2 adapter
packages are scaffolds only; Ring 3 dashboard is empty. Seven of nine
trigger-detection failures trace to the missing `Decision` entity +
missing Ring 1 mint API. The investigation recommends sequencing:
**Step 1** complete M1 foundational entities (`Decision`,
`WorkspaceContext`, `ApprovalGrant`, `Lease`, `Run` priority-ordered);
**Step 2** parallel-OK Phase 2.5 canonical policy YAML in
`system-config`; **Step 3** less-critical M1 entities (tool-resolution
chain, Capability, CommandShape, PolicyRule, etc.); **Step 4** begin
Phase 3 Ring 1 services per existing PLAN.md M3-M5 milestone
definitions; **Step 5** Ring 2 adapters (M4-M6); **Step 6** Ring 3
regression runner. The "trigger-deferred" lanes are reframed as
**foundation-prerequisite lanes** — the blockers are not external
events but unbuilt Ring 0 entities and unbuilt Ring 1 services.

## Prior Focus — ADR 0048 accepted; Phase 2.5 canonical policy YAML in system-config was the next substantive lane

**2026-05-09 ADR 0048 accepted:** ADR 0048 (`docs/host-capability-substrate/adr/0048-phase-2-7-subject-kind-grounding-evaluation.md`)
classifies the three Phase 2.7 candidates against the
§Subject-kind grounding requirement: no `CoordinationFact.subject_kind`
enum addition; per-candidate dispositions recorded for any future
schema PR. `machine_identity` is host-observation-backed (joins the
inheriting list when promoted); `project_substrate_contract` is
derived/Layer-2-backed (joins the grounding-requirement list when
promoted); backup-readiness subject_kinds are mixed/declarative with
an additional `ready`-state lifecycle rule requiring freshness-valid
`RestoreDrillReceipt` evidence. Cross-context binding (inv. 19 +
registry §Cross-context enforcement layer) inherited by all three.
D-036 records the dispositions. ADR 0036 §Future amendments §Layer 1
grounding rule extensibility principle is now fully discharged
(registered in registry v0.4.10 + evaluated in ADR 0048 + registry
v0.4.11). All four required reviewers (`hcs-architect`,
`hcs-ontology-reviewer`, `hcs-policy-reviewer`,
`hcs-security-reviewer`) returned no blocking objections; four
mechanical tweaks at acceptance.

**2026-05-09 outstanding-work sequencing workflow:** A docs-only
workflow decision is recorded at
`docs/host-capability-substrate/research/local/2026-05-09-outstanding-work-sequencing-workflow.md`.
It corrects the stale assumption that the ADR 0047 schema slice is
still future: ADR 0047's first Ring 0 schema slice has landed
(`operation_class: cleanup_plan`, `mutation_scope: "none"`,
`target_kind: "workspace"` narrowing, `DerivedSummary.summary_kind:
cleanup_plan`, and `QualityGate` operation-class mirror reconciliation).
The remaining cleanup-plan `Decision.reason_kind` reservations and
`cleanup_scope` enum remain registry-canonical only, pending a future
Ring 1 mint API schema PR. With ADR 0048 accepted, the next
substantive lane is **Phase 2.5 canonical policy YAML** in
`system-config/policies/host-capability-substrate/` (cross-repo per
workflow §Step 2). Q-013/Q-014/Q-015 runtime/provider/broker/
validator/adapter/dashboard/hook/execution lanes remain blocked
behind separate accepted authority or the Phase 2.5 policy lane.
AgentClient x WorkspaceContext and RemoteAgentInvocationReceipt
remain trigger-deferred; their triggers have not fired.

**2026-05-08 audit closures (eight commits 2026-05-07 → 2026-05-08):**
D-033 shared-state naming discipline landed in `DECISIONS.md` §Accepted
plus a matching `AGENTS.md` §Hard boundaries bullet, closing the
Q-003 / ADR 0019 v3 acceptance-text reservation. §Predicate-kind
vocabulary registry section landed in `ontology-registry.md` v0.4.5,
paralleling §Boundary dimension registry per ADR 0019's reserved name,
closing the schema-PR precondition. Phase 2.6 trap-scaffold
completeness audit landed at
`docs/host-capability-substrate/research/local/2026-05-07-trap-scaffold-audit.md`,
classifying the 22 unscaffolded seeds (2 Ready, 5 Blocked on
ScopeCam transcript, 15 No-citation); the two Ready items #17
(`harness-config-boolean-type`) and #44 (`inline-pr-body-shell-expansion`)
were promoted to scaffolds in separate commits per the trap skill.
ADR 0039 forward-looking observations absorption audit landed at
`docs/host-capability-substrate/research/local/2026-05-07-adr-0039-forward-looking-obs-audit.md`,
classifying the 13 deferred observations (2 Owed, 1 Effectively handled,
1 Active sequencing dependency, 5 Deferred, 2 Closed at acceptance);
the two Owed items closed in separate commits — ADR 0019 v3.1
editorial alignment of `DerivedSummary.derived_from` to four-class
membership, and `ontology-registry.md` v0.4.6 §Producer-vs-kernel-set
extension enumerating the five inv. 19 execution-context binding FKs.
ADR 0039 #5 — the `evidenceAuthoritySchema` enum extension PR for
the `self-asserted` authority class — landed on 2026-05-09 as a
schema-change PR with `hcs-ontology-reviewer` objections incorporated.
It bumped `Evidence.schema_version` `0.9.0` → `0.10.0`, made charter
v1.4.0 inv. 18 chain-walk rejection schema-operational (the chain-walk
rejection itself remains a posture commitment until the typed-grant
minting layer lands), updated `ontology.md` v1.12.0 and
`ontology-registry.md` v0.4.7, and added focused `evidence-authority`
parse tests. With #5 closed, all ADR 0039 audit "Owed" and "Active
sequencing dependency" items have landed; remaining audit items
(#4 Phase 2.5; #6/#7/#8 wave-2 reactive; #9 low-priority editorial)
stay deferred behind their triggering conditions.

**2026-05-09 ADR 0047 cleanup-plan composition accepted:** ADR 0047
(`docs/host-capability-substrate/adr/0047-cleanup-plan-composition.md`)
resolves ADR 0036 architect F4 and commits the composition rule between
`system.cleanup.plan.v1` and `system.workspace.diagnose.v1`: discovery
hint summary as opt-in advisory only with re-derivation at plan time
and gateway re-walk at class-I consumption time. Cleanup-plan operation
is `operation_class: cleanup_plan` (NEW) with `mutation_scope: "none"`
and target-kind narrowing to `workspace`; output is a population of
typed `OperationShape` records (no reified composite) plus a mandatory
`DerivedSummary` of `summary_kind: cleanup_plan` (NEW) carrying
hint-resolution status as typed `summary_text` annotation. NEW
`Decision.reason_kind`: `cleanup_plan_authority_source_stale`,
`cleanup_plan_target_under_active_lease`. Initial `cleanup_scope`
enum: `audit_profile_claim_supersession | worktree_lease_completed`;
`explicit_target_set` deferred behind redaction-posture work.
D-035 records the decision. All three required reviewers
(`hcs-architect`, `hcs-ontology-reviewer`, `hcs-policy-reviewer`)
returned ready-for-acceptance on v2; two mechanical tweaks at
acceptance. The first schema slice landed on 2026-05-09 in commit
`4cdd95d`: `OperationShape` gained the `cleanup_plan` branch,
`DerivedSummary` gained the `cleanup_plan` summary kind and hint-status
refinement, and `QualityGate` was reconciled with `OperationShape`
operation classes. The `Decision.reason_kind` reservations
(`cleanup_plan_authority_source_stale`,
`cleanup_plan_target_under_active_lease`) and `cleanup_scope`
(`audit_profile_claim_supersession | worktree_lease_completed`) remain
registry-canonical pending Ring 1 mint API schema work. Canonical policy
YAML for `cleanup_plan` lives in `system-config/` at Milestone 2 per
ADR 0036 reservation.

As of 2026-05-04, the **Phase 1 synthesis-window is closed**. All nine
pending Q-rows in `DECISIONS.md` (Q-003, Q-005, Q-006, Q-007, Q-008,
Q-009, Q-010, Q-011, Q-012) are accepted via ADRs 0019, 0021, 0029-0037
on charter v1.3.2. The Phase 0b closeout (2026-04-26) and the Phase 1
shell-environment research program (2026-04-27 → 2026-05-08) both
completed in earlier waves; their content remains below as audit trail.

Phase 2 begins schema + registry + canonical-policy-YAML sequencing
from the §Out of scope sections of the ten settled ADRs.

**Phase 2.6 regression-trap scaffold expansion (2026-05-07; #17 / #44
promotion 2026-05-07):** The eval corpus deconflicts the provisional
ADR 0036 / ADR 0037 trap numbers without renumbering existing
shell/environment or coordination seeds. Coordination seeds #31-#35
now have scaffold files. ADR 0036 Q-009 traps land as #46-#48; ADR 0037
Q-010 traps land as #49-#51; ADR 0037 security-review candidates land
as #52-#56; the Phase 2.4 registry-summary union-narrowing incident lands as
#57; the ADR 0045 Q-015 generic restore-ref promotion reviewer incident lands
as #58. The 2026-05-07 trap-scaffold audit promoted two previously-
unscaffolded Ready seeds: #17 (`harness-config-boolean-type`) cites
the 2026-04-23 Claude Code 2.1.119 startup-block incident with
charter v1.2.0 inv. 14 / D-026 authority, and #44
(`inline-pr-body-shell-expansion`) cites the 2026-04-30 Codex/ScopeCam
exchange with Q-008(e) settlement and the matching `AGENTS.md` rule
as eligibility. The corpus now has 38/58 scaffolds; #39-#43 remain
seeded-only pending ScopeCam redacted transcript or human-approved
fixture, and #1-#15 remain seeded-only pending observed-incident
citations per the trap skill's no-synthetic-traps rule. This packet
is eval/docs only: it adds trajectory-scored trap definitions and
seed-index bookkeeping, not executable harness fixtures, schema
behavior, policy YAML, runtime probes, adapters, hooks, dashboard
routes, or gateway logic.

**Q-013 credential-plane posture (accepted 2026-05-05):** ADR 0040 accepts
credential-plane integration as generic HCS posture only. Credential-plane
implementation is outside ADR 0038's accepted Phase 2.1-2.6 landing train.
ADR 0043, accepted 2026-05-07, authorized the first Phase 2.7 Q-013
implementation slice. That slice landed on 2026-05-07 as schema/evidence work
for `CredentialAuthorityObservation`, `MachineIdentityBindingObservation`, and
the minimum subject/ref vocabulary those records require. It bumped
`Evidence.schema_version` to `0.9.0` by adding `subject_kind:
"machine_identity"`. It does not authorize credential-plane policy YAML,
reconciler, service-account, vault inventory, OpenTofu, broker, runtime,
provider mutation, operation registration, `CredentialRuntimeInjectionReceipt`,
`CredentialReconcilerReceipt`, `CredentialIssuanceReceipt`, or
`RemoteMutationReceipt`. Lane plan:
`docs/host-capability-substrate/research/local/2026-05-06-q-013-implementation-lane-plan.md`.
Deferred-lane sequencing:
`docs/host-capability-substrate/research/local/2026-05-06-phase-2-7-deferred-lane-sequencing-plan.md`.
Accepted implementation ADR:
`docs/host-capability-substrate/adr/0043-q-013-credential-plane-implementation.md`.

**Project-substrate admission standard intake (2026-05-06; accepted ADR
0041):** Citadel PR #37
(`The-Nash-Group/citadel-config` commit
`46c55857427af4b887194277bac2218c20b595b6`) defines an external
project-substrate contract/admission standard. HCS treats it as compatibility
input only. Component facts fit existing lanes (Q-005 runner/check evidence,
Q-006 check-source identity, Q-007 BoundaryObservation/QualityGate posture,
Q-009 workspace-manifest projection, Q-013 credential-plane posture), but the
whole project-substrate contract envelope was accepted as Q-014 posture only
until its implementation ADR landed. Accepted posture: compose with ADR 0036
via candidate `KnowledgeSource.source_kind: "project_substrate_contract"`
plus typed validation receipts; treat contract lifecycle status and
`guardian_approval` as evidence inputs, not HCS gate authority or
`ApprovalGrant`; group v1 evidence shape commitments into contract validation,
admission observation, teardown plan receipts, and teardown completion
receipts; defer machine-identity validation to Q-013 implementation. ADR 0044,
accepted 2026-05-07, authorized only the first Q-014 schema/evidence
implementation slice. That slice landed on 2026-05-07 with
`project_substrate_contract`,
`project_admission_authority`, `ProjectSubstrateContractValidationReceipt`,
`ProjectSubstrateAdmissionObservation`, `ProjectTeardownPlanReceipt`,
`ProjectTeardownCompletionReceipt`, generated JSON Schema, ontology/registry
mirrors, and required subject/ref vocabulary. It bumps
`BoundaryObservation.schema_version` to `0.5.0` but does not widen
`Evidence.subject_kind`. No
canonical policy YAML, runtime/live validator, runner, Proxmox, OpenTofu,
machine-identity issuance, adapter, dashboard, hook, project
workload/provisioning, provider mutation, operation registration, backup
readiness, or runtime change is authorized by this intake or ADR 0044.
Accepted implementation ADR:
`docs/host-capability-substrate/adr/0044-q-014-project-substrate-implementation.md`.
Deferred-lane sequencing:
`docs/host-capability-substrate/research/local/2026-05-06-phase-2-7-deferred-lane-sequencing-plan.md`.

**Q-015 backup-readiness substrate-contract posture (2026-05-06 intake;
ADR 0042 accepted 2026-05-07):** External advisor directive received
2026-05-06 on
backup/readiness posture as HCS-facing substrate contract requirements. HCS
absorbs the posture as typed evidence/contract consumer; HCS does not own
backup execution, restore execution, or upstream substrates. Source ownership
stays explicit: `runner-substrate` owns Proxmox/Synology backup evidence
(PR #3 active); `hetzner` repo owns VPS-side restic/Storage Box; Citadel owns
runner groups/admission standards; `HomeNetOps`/`system-config`/project repos
each own different surfaces. Lifecycle vocabulary preserved verbatim:
`pending → configured → usable → ready` with optional `expired`; restore
drill with boot/service verification is the promotion gate from `usable` to
`ready`; backup readiness does not imply runner readiness; runner readiness
does not imply project workload admission. Candidate entity names from the
advisor (`BackupReadinessEvidence`, `StorageClassReadiness`,
`RestoreDrillEvidence`, `BackupLayerThreatModel`, `BackupCredentialCustody`,
`BackupMonitoringRequirement`, `ProjectSubstrateBackupRequirement`) are
recorded for synthesis; Q-011 naming-suffix discipline will rename at
ADR review. Composes with ADR 0036 (workspace manifest projection),
ADR 0040 (credential plane), ADR 0041 (project-substrate contract).
The Phase 2.7 deferred-lane sequencing plan already names backup/restore as
a downstream lane in its Lane Dependency Matrix (candidate
`BackupReadinessObservation` and `RestoreExpectationReceipt`); it now folds in
the Q-015 intake structure and points at accepted ADR 0042:
`docs/host-capability-substrate/adr/0042-q-015-backup-readiness-posture.md`.
Intake doc:
`docs/host-capability-substrate/research/local/2026-05-06-q-015-backup-readiness-intake.md`.
Lane plan:
`docs/host-capability-substrate/research/local/2026-05-07-q-015-implementation-lane-plan.md`.
No backup/restore schema, registry, validator, canonical policy YAML, adapter,
dashboard, hook, runner, Proxmox, Hetzner, OpenTofu, machine-identity, or
runtime change is authorized by this intake. Q-015 implementation, if
subsequently accepted, opens as a Phase 2.7 / Wave-2 lane behind Q-013 and
Q-014, or under a separately accepted ADR 0038 sequencing amendment. Q-010
(remote-agent receipts; Phase 2.3.4) has since landed in the accepted
Phase 2.1–2.6 train. ADR 0042 accepts posture only; Q-015 implementation
was blocked behind a separate accepted implementation ADR and reviewer
dispatch. ADR 0045 was accepted after reviewer pass and human approval. The
narrow Q-015 schema/evidence slice landed on 2026-05-07 with
`BackupReadinessObservation`,
`RestoreDrillReceipt`, `BackupCredentialCustodyObservation`,
`ProjectSubstrateBackupRequirementObservation`, and generic
`KnowledgeSource.source_kind: "threat_model"`, generated JSON Schema,
ontology/registry mirrors, and focused tests. The landed slice reuses existing
`Evidence.subject_kind` values and does not bump `Evidence.schema_version`.
No Q-015 runtime, validator, canonical policy YAML, adapter, dashboard, hook,
runner, Proxmox, Hetzner, OpenTofu, provider mutation, project workload,
gate-kind, or backup/restore execution work is authorized by ADR 0045 or this
schema landing. A 2026-05-07 Citadel compatibility follow-up is recorded at
`docs/host-capability-substrate/research/local/2026-05-07-citadel-readiness-compatibility-followup.md`.
It tracks runner readiness as pending structured future evidence, alert
delivery as future readiness evidence, file/meta backup versus VM/CT image
backup as a future artifact-grain distinction, and cross-repo receipts as
generic source/evidence refs. It does not authorize live readiness claims,
host-local policy, ontology, schema, validator, adapter, dashboard, hook, or
runtime changes.

**Phase 2 sequencing meta-ADR (accepted 2026-05-04):** ADR 0038
(`docs/host-capability-substrate/adr/0038-phase-2-schema-landing-sequence.md`)
accepts a six-phase landing order: charter v1.4.0 amendment (Phase
2.0) → standalone Ring 0 entities (Phase 2.1, 4 PRs) → base-shape
extensions (Phase 2.2, 3 PRs) → evidence subtypes (Phase 2.3, 4 PRs)
→ registry consolidation (Phase 2.4) → policy YAML + trap fixtures
(Phases 2.5 + 2.6). ADR 0038 sequences; it does not author any of
the content it sequences.

**Phase 2.0 charter v1.4.0 amendment (accepted 2026-05-04):**
ADR 0039 (`docs/host-capability-substrate/adr/0039-charter-v1-4-0-invariants-18-and-19.md`)
adds invariants 18 (derived retrieval ≠ gate authority — Q-003 /
ADR 0019 v3) and 19 (boundary claims freshness/execution-context-
bound — Q-007 / ADR 0034 v2). Charter bumps v1.3.2 → v1.4.0. v2
substantively expanded the invariant text per security review +
abstract-vocabulary bridge per policy review + framing precision
per ontology review + editorial folds per architect review;
accepted with 3 mechanical tweaks at acceptance (Ont-N11
CoordinationFact `derived_from` precision; Arch-N13 surface
enumeration parallelism; Arch-N11 posture-commitment count
alignment). All four reviewers returned READY-FOR-ACCEPTANCE on
v2; 13 forward-looking non-blocking observations documented in
ADR 0039 §Forward-looking observations for absorption at
downstream PRs (Phase 2.1.x / 2.1.4 / 2.2.3 / 2.5 / 2.6 / wave-2
reactive amendment / future glossary cleanup). Phase 2.1.1
(`AgentClient`), Phase 2.1.2 (`VerificationCommandSpec`), and Phase 2.1.3
(`KnowledgeSource` / `KnowledgeChunk` / `CoordinationFact` /
`DerivedSummary`), Phase 2.1.4 (`QualityGate`), Phase 2.2.1
(`ExecutionContext` containment cache), Phase 2.2.2 (`OperationShape`
deletion-authority fields), Phase 2.2.3 (`BoundaryObservation` payload
bundle), Phase 2.3.1 (`ToolProvenance` + `GitIdentityBinding`), Phase 2.3.2
(Q-005 runner receipts), Phase 2.3.3 (Q-006 source-control receipts), and
Phase 2.3.4 (Q-010 remote-agent receipts) have landed. Phase 2.4 registry
consolidation lands as docs-only `ontology-registry.md` v0.4.0 with summary
tables for the Phase 2.1-2.3 schema train and the final kernel-trusted
producer allowlist state. It adds no schema, canonical policy YAML, adapter,
hook, dashboard, or runtime behavior.

### Phase 2 entry-point inventory

**Schema PRs** (per `.agents/skills/hcs-schema-change`): the ADR 0038
Phase 2.1-2.3 schema train has landed through Q-010. Completed schema surface:
standalone Ring 0 entities (`AgentClient`, `VerificationCommandSpec`,
`KnowledgeSource`, `KnowledgeChunk`, `CoordinationFact`, `DerivedSummary`,
`QualityGate`); base-shape extensions (`ExecutionContext`,
`OperationShape`, typed `BoundaryObservation` payload bundle); direct Evidence
subtypes for ADR 0034 (`ToolProvenance`, `GitIdentityBinding`), Q-005
runner/check evidence, Q-006 source-control evidence, and Q-010 remote-agent
evidence; typed `BoundaryObservation` branches for containment,
filesystem/MCP authority, runner isolation, and branch protection. The
2026-05-09 ADR 0039 #5 closure landed the `evidenceAuthoritySchema`
`self-asserted` enum extension and bumped `Evidence.schema_version` to
`0.10.0`; this completes ADR 0039's schema-operational dependencies for
charter inv. 18 chain-walk rejection. No additional schema work is
authorized inside the accepted Phase 2.1-2.6 train without a follow-on
accepted ADR or sequencing amendment.

**Registry update PR** (`ontology-registry.md` extensions): Phase 2.4
consolidation records the already-landed schema vocabulary in one stable
registry index. It closes the producer-class allowlist
(`kernel_broker`, `kernel_telemetry`, `kernel_agent_client_resolver`,
`kernel_workspace_diagnose`, `mint_api`), summary tables for Phase 2.1
standalone entities, Phase 2.2 base-shape extensions, Phase 2.3 Evidence
subtypes, typed `BoundaryObservation` branches, and the current schema-version
ledger. This is registry/docs bookkeeping only.

**Canonical policy YAML** (Phase 2.5; in
`system-config/policies/host-capability-substrate/`, not this repo):
per-`boundary_dimension` freshness windows (containment
dimension hours-to-day order); `workspace_verify` operation_class
composition thresholds; per-product-family `permission_mode` verifier
rules; non-PR remote-agent binding window duration (Phase 1 default
±5 min); cross-tool exclusion-pattern conflict resolution. QualityGate
policy backlog: per-`gate_kind` composition rules and `valid_until`
maxima; `gate_evidence_acknowledgment` verifier-class privileges;
`mutation_class` meta-gate matrix entries; denial-rate ceiling;
evidence-rotation materiality thresholds.

**Trap scaffolds** (post-schema): Phase 2.6 deconflicts the historical seed
numbers. Existing shell/environment scaffolds keep #26-#30; coordination-store
brief reservations keep #31-#35 and now have scaffold files; ADR 0036 Q-009
traps land as #46-#48; ADR 0037 Q-010 traps land as #49-#51; ADR 0037
security-review candidates land as #52-#56; the Phase 2.4 registry-summary
union-narrowing incident lands as #57; the ADR 0045 Q-015 generic restore-ref
promotion reviewer incident lands as #58. Executable fixture packets and
scanner heuristics remain future work and should land only when their specific
evidence dependencies and harness expectations are available.

**Charter v1.4.0 amendment**: invariants 18 + 19 have landed via
ADR 0039. Remaining ADR 0039 items are trigger-deferred: Phase 2.5
policy absorption (#4), wave-2 reactive amendment candidates (#6/#7/#8),
and low-priority glossary cleanup (#9).

**Future ADRs queued**: ADR 0048 accepted 2026-05-09 (Phase 2.7
subject-kind grounding evaluation; D-036). `RemoteAgentInvocationReceipt`
aggregator remains trigger-deferred until non-PR binder failure
evidence exists. `AgentClient × WorkspaceContext` cardinality remains
trigger-deferred until a single workspace's operations span multiple
AgentClients with conflicting capability-class evidence.
Q-013/Q-014/Q-015 first schema/evidence slices landed via ADRs 0043,
0044, and 0045; their runtime, policy, gate-kind, provider, dashboard,
adapter, hook, broker, validator, backup/restore execution, and
operation registration follow-ons remain blocked pending separate
accepted authority or the Phase 2.5 policy lane. Joint sequencing:
`docs/host-capability-substrate/research/local/2026-05-06-phase-2-7-deferred-lane-sequencing-plan.md`.
Outstanding-work sequencing:
`docs/host-capability-substrate/research/local/2026-05-09-outstanding-work-sequencing-workflow.md`.

### Historical record — Phase 0b closeout / Phase 1 prep / synthesis-window

The blocks below are kept as audit trail. They describe completed work.

As of 2026-04-26, this repo had completed the compressed **3-day
Phase 0b soak** on top of the Milestone 0 scaffold. The same-day
post-closeout follow-up landed measurement-only semantic redundancy
mapping, and the refreshed brief is green on the Phase 0b acceptance
gate. Phase 1 owned the formal capability ontology/policy work,
which the synthesis-window above closed.

- Soak window: 2026-04-23 through 2026-04-25 (closed)
- Closeout: 2026-04-26 with `just measure-brief`, charter v1.2.0, ADR 0012-0015, D-029-D-032, and scanner/hook parity for traps #16-#18
- Post-closeout measurement follow-up: `semantic-tool-map-v1` in `measure-redundancy.sh`, latest-partition redundancy selection in `measure-brief.sh`, advisory scanner catch-up for traps #37/#38, and `redundancy-fixture` / `trap-fixture` wired into `just verify`
- Kickoff battery: `just day1`
- Daily cadence during the soak: `just measure` and `just soak-status`
- Extension rule: if a future soak window does not produce a clean go/no-go, extend the soak rather than weakening the gate

### Closeout-week sequence (2026-04-24 → post-closeout)

Three-wave plan approved 2026-04-23 after synthesis of two external substrate-config research reports (see memory `project_substrate_config_research_report1.md`).

**W2 — days 2 + 3 (2026-04-24, 2026-04-25). Held-back drafts + outside-HCS work.**

- `system-config/scripts/lint-claude-settings.py` (new): validates `~/.claude/settings.json` and `~/.claude.json` against both (a) published JSON Schema and (b) installed-CLI runtime parse; flags divergence. Integrates into `system-update` hygiene flow. Outside this repo.
- Charter v1.2.0 amendment **draft branch** (not merged during soak). Includes invariants 13 (cleanup derivability-authority), 14 (config-spec authority + provenance), and 15 (GUI shell-env non-inheritance; Apple-doc + Anthropic-VS-Code-doc backed). Subagent objections from `hcs-architect`, `hcs-policy-reviewer`, `hcs-security-reviewer`, `hcs-ontology-reviewer` during days 2–3.
- ADR 0012 credential broker **draft branch** — scope revised 2026-04-24 after D-028 landed (system-config shipped the `host_secret_*` caller-facing contract + HCS_SECRET_* env namespace), the IPC deadlock recurred within 24 hours, AND the Cloudflare Stage 3a lessons brief (`docs/.../research/external/2026-04-24-cloudflare-lessons.md`) added one-time-secret capture-at-source as broker scope. Scope changes from "conditional, measurement-gated" to **"committed, phased; caller-facing phase already shipped as D-028; HCS work is the broker daemon at `$HCS_BROKER_SOCKET` speaking the existing contract, plus an atomic `create → capture → store → verify → scrub` pattern for provider-issued one-time secrets."** Broker serves CLI via `apiKeyHelper`/`awsCredentialExport` AND GUI via OAuth + Keychain separately (apiKeyHelper is CLI-only per metal-verified Anthropic docs); the broker does NOT unify the two surfaces.
- ADR 0013 forbidden-tier split **draft branch**.
- ADR 0014 InterventionRecord entity **draft branch**.
- ADR 0015 external-control-plane automation **draft branch** — NEW 2026-04-24. Scope: Cloudflare, GitHub, 1Password-CLI, MCP-OAuth, DNS providers, Hetzner as one provider class treated with typed evidence discipline (typed `OperationShape`, not shell strings). Absorbs the 8 design rules from the Cloudflare Stage 3a brief: minimal-request plan, budget-gated optional checks, 429-as-cooldown-not-retry, one-time-secret atomic broker path, ProviderObjectId / PublicClientId / SecretMaterial / SecretReference / PolicySelectorValue schema distinction, CLI-syntax-from-evidence-not-memory, typed MCP OAuth discovery (protected resource metadata + audience), explicit Cloudflare Access wildcard-path coverage warnings. Also absorbs the later `cloudflared` root-cause lesson: Access policy success and tunnel/origin audience validation are separate authority layers, so tunnel `audTag` coverage must be typed evidence before another Access mutation is proposed. Also absorbs the MCP diagnostics lesson: authenticated Cloudflare MCP fan-out is principal-scoped shared-token pressure, so local session fan-out, quarantine state, and `last_cf_mcp_429` are pre-mutation evidence. Drafted in W2, merged in W3 sequence after ADR 0014. Drafting distributed across W2 + early W4; scaffold files for the 7 associated regression traps (#19–#25) plus the tunnel-audience trap (#36) are Phase 1 work, not W3.
- Daily `just measure` + `just soak-status`; re-run `measure-extended-rubric` + `measure-guidance-load` over new partitions; any field incidents captured under `.logs/phase-0/interventions/`.
- Soak-safe improvement lane: Ring 3 docs, decision-ledger entries, ADR drafts, runbook structure, and non-semantic status/reporting fixes may land during the soak when they improve closeout decision quality. Do **not** change `classify.py`, hook enforcement behavior, metric-producing collectors, Codex profiles, live policy, or charter-on-main during the soak window; if a script change can alter day-over-day metrics, hold it for W3 closeout.

**W3 — closeout 2026-04-26. Ordered merge sequence. Completed in the closeout flow.**

1. `just measure-brief` — final narrative over the three partitions with v1.2.0 supplementary surfaces.
2. Charter v1.2.0 landed with invariants 13-15 and the D-029 public-semver baseline split.
3. ADR 0012, 0013, 0014, and 0015 landed in sequence (broker → forbidden-tier split → InterventionRecord → external-control-plane automation). ADR 0015 lands last because it depends on 0012's broker surface for the one-time-secret capture-at-source pattern.
4. Scanner parity landed for traps #16 (`ignored-but-load-bearing-deletion`), #17 (`harness-config-boolean-type`), and #18 (`agent-echoes-secret-in-env-inspection`) in `measure-traps.sh`; same-day post-closeout follow-up added advisory scanner heuristics for #37 (`process-argv-secret-exposure`) and #38 (`cloudflare-mcp-mutation-without-fanout-check`). Seed is at 38 (18 prior + 7 Cloudflare Stage 3a + 5 shell/environment research v2 + 5 coordination-lessons brief + 1 Cloudflare tunnel-audience lesson + 1 process-argv secret-exposure lesson + 1 Cloudflare MCP fan-out diagnostics lesson). Traps #19–#36 were seed-only at closeout; Phase 1 later landed scaffold files for #19–#30 and #36, while #31–#35 remain gated by Q-003. Hook literal-forbidden-list extension for trap #18's secret-echo regexes landed with this flow.
5. **DECISIONS.md batch commit (renumbered)** landed: D-029 (public-semver strings and separate app-build identifiers; Claude Code CLI `2.1.120`, Claude app `1.4758.0 (fb266c)` dated `2026-04-24T20:22:30.000Z`, Codex CLI `0.125.0`, Codex macOS app `26.422.30944 (2080)`, GPT-5.5/GPT-5.4-compatible HCS profiles + Opus 4.7 model posture), D-030 (OAuth-preferred HTTP MCP baseline; `enabled=false` + explicit opt-in, not profile-gating), D-031 (Codex profiles are CLI-only opt-ins), and D-032 (external control-plane automation; ADR 0015 is the master decision). Runtime-governs conflict rule is absorbed into D-026 + charter inv. 14. (D-028 already landed 2026-04-24 as the `host_secret_*` credential plane; see user commit `d59a35c`.)
6. Closeout narrative `docs/host-capability-substrate/phase-0b-closeout.md` answers the 5 runbook questions.
7. `phase-0b-self-review.md` v1.2.0 records closeout outcomes and Phase 1 carry-forward.

**W4 — post-closeout Phase 1 prep.**

The shell-environment research v2.12.0 (`docs/host-capability-substrate/shell-environment-research.md`) lays out a formal 10-working-day research program (2026-04-27 -> 2026-05-08, ~55-60 hours) using prompt IDs P01-P13. The existing direct-test queue items below cross-reference those prompt IDs; several are resolved at the documentation level and reduce to confirmatory smoke tests. P03 now has an operation-proofed MCP startup-order probe packet, P04 has an operation-proofed Codex env-policy probe packet, P08 has an initial Codex CLI tool-call snapshot fixture, P09 has terminal blocked/untrusted and isolated allowed/trusted fixtures plus an operation-proofed GUI/IDE probe packet, P11 has a LaunchAgent env policy design memo, and P12 has a repo-local secret-safe env-inspection prototype. 2026-05-01 source ingests update Codex config/app settings and Claude Desktop / Claude Code Desktop settings, including app-managed workspace dependencies, Git/worktree settings, permissions, local environments, Claude filesystem tool permissions, Preview state, and web PR automation. These remain future Ring 0/Ring 1 design inputs rather than accepted kernel operation surfaces.

Execution runbook: `docs/host-capability-substrate/phase-1-shell-env-direct-test-runbook.md`. It records local preflight evidence as of 2026-04-26, the Wave 1 order, secret-safe artifact contract, and operation-proof stubs. Current Claude context: local Claude Code is 2.1.123; sandboxed `claude auth status` can still report `loggedIn=false`, but host-context auth was available for the 2026-04-28/29 P06 closure run.

Next-agent handoff: `docs/host-capability-substrate/phase-1-shell-env-handoff-2026-04-30.md` captures the committed P08/P09/P11/P12 status, host-local wrapper install state, expected validation output, and open approvals.

P13 partial evidence: `docs/host-capability-substrate/research/shell-env/2026-04-26-P13-codex-app-bundle-signing.md` captures read-only Codex app bundle/signing metadata plus live process sandbox flags. That memo's last P13-specific refresh observed Codex app `26.422.71525` build `2210`; the 2026-05-01 Codex settings ingest separately observed the current local app bundle as `26.429.20946` build `2312`. Helpers show Electron/Chromium sandbox markers (`--seatbelt-client`, `--enable-sandbox`, `--service-sandbox-type=network`), while entitlement extraction remains unusable and app-internal Keychain/filesystem/network probes remain open. Generated app-server protocol schemas identify typed filesystem/network/account/MCP surfaces; the approved stdio app-server probe initialized successfully and returned `exitCode: 0` for a `/usr/bin/true` `command/exec` status probe, but that temporary server is not GUI app-internal evidence. A 2026-04-28/29 status probe correlated to the active Codex CLI session, not the GUI app. The current blocker is a reachable GUI app-server control path or a human-run sterile Codex app UI probe.

P01 partial evidence: `docs/host-capability-substrate/research/shell-env/2026-04-26-P01-codex-auth-metadata.md` captures metadata-only Codex auth state plus the approved migration attempt. Current host did not show a `Codex Auth` Keychain item with the safe lookup, while `${CODEX_HOME}/auth.json` exists. `codex login status` reports ChatGPT login, but the GitHub MCP entry still uses `bearer_token_env_var = "GITHUB_PAT"`; `codex mcp login github` failed because dynamic client registration is unsupported. Do not migrate MCP auth off env/PAT patterns until a static-client/manual OAuth strategy or broker decision is accepted and a restart check passes.

P02 validated evidence: `docs/host-capability-substrate/research/shell-env/2026-04-26-P02-codex-app-gui-launch-env.md` records that terminal `open -n` forwarded a synthetic marker into a new Codex app process, so terminal `open` is not a valid GUI proxy. A true Finder-origin cold start did not inherit the synthetic terminal-only marker (`p02_gui_marker_present=false`), supporting the rule that Codex app GUI sessions must not be modeled as inheriting shell-exported credentials.

P05 partial evidence: `docs/host-capability-substrate/research/shell-env/2026-04-26-P05-claude-desktop-auth-boundary.md` captures read-only Claude Desktop app/config metadata plus the approved synthetic runtime smoke. It found Claude.app 1.4758.0, no top-level `env` or `apiKeyHelper` in `claude_desktop_config.json`, and only the `MEMORY_FILE_PATH` env key name in Desktop MCP config. Terminal `open -b` propagated a synthetic marker, so it is not a valid GUI-origin proxy; Finder-origin launch did not inherit the marker and the Finder-launched process lacked common Claude credential env names by existence-only check.

P06 CLI closure evidence: `docs/host-capability-substrate/research/shell-env/2026-04-26-P06-shell-wrapper-logger-prep.md` captures the in-repo redaction-safe wrapper `scripts/dev/hcs-shell-logger.sh`, fixture `scripts/dev/run-shell-logger-fixture.sh`, approved host install to `/usr/local/bin/hcs-shell-logger`, shebang/atomic-append fixes required by the live run, and clean PATH-routed shell records. The fixture proves the wrapper preserves argv for the real shell while redacting `-c` command payloads from the wrapper log. The approved 2026-04-26/27 Codex probes displayed `/bin/zsh -lc` and bypassed PATH routing, but the 2026-04-28/29 host-telemetry rerun in `docs/host-capability-substrate/research/shell-env/2026-04-28-P06-host-telemetry-rerun.md` split that into separate phases: Codex internal startup shells used `/bin/zsh -lc`, while the actual Codex CLI tool-call subprocess execed through `sandbox-exec -- /bin/zsh -c <redacted>`. The focused closure run resolved the Codex `allow_login_shell=false` marker question for Codex CLI 0.125.0: the same host argv is preserved, but the synthetic marker env does not reach the actual tool shell in the no-login-shell config. Claude Code CLI 2.1.122 now has host telemetry for the Bash-tool subprocess: `/bin/zsh -c <redacted>`, marker visible, `.zshenv` only for the actual tool shell. PATH-prefix interception is closed as unsuitable except for negative controls; future re-baselining should use all-process host telemetry with live redaction.

Direct-test queue (combined from report 1 §14 + report 2 verification + shell research v2.12.0 P01-P13; blocks work that depends on each outcome):

1. `codex mcp login github` → Keychain entry → restart Codex → MCP starts clean without `GITHUB_PAT`. The approved attempt failed because dynamic client registration is unsupported, so this is blocked on a static-client/manual auth strategy or deliberate PAT/broker decision. If a future OAuth path succeeds, remove `bearer_token_env_var = "GITHUB_PAT"` from the system-config managed Codex block only after restart verification. *(Related: shell research v2 **P01**.)*
2. Codex app + CLI + IDE reuse the same MCP OAuth token (same `CODEX_HOME` → same Keychain key). *(Shell research v2 **P01**: resolved at doc level — Keychain service `"Codex Auth"`, account `cli|<sha256(CODEX_HOME)[:16]>`. Smoke test only, 1h.)*
3. Codex app honors project-scoped `.codex/config.toml` MCP definitions in trusted projects.
4. Codex app GUI cold start does NOT inherit terminal-only markers. *(Shell research v2 **P02**: validated locally for Finder-origin cold start on 2026-04-26; terminal `open -n` is explicitly not a GUI proxy. Retest on Codex app upgrades.)*
5. Claude Desktop uses OAuth-only; does NOT read `apiKeyHelper` or `ANTHROPIC_API_KEY`. *(Shell research v2 **P05**: docs-level claim plus local Finder-origin smoke now support this; terminal `open -b` is not a GUI proxy.)*
6. Claude Code #18692 (resolved-secrets-into-`.mcp.json`) does NOT repro on 2.1.120+. Local CLI is 2.1.123; host-context Claude auth was available for the 2026-04-28/29 P06 closure even though sandboxed `claude auth status` can report `loggedIn=false`, so run this from host context if selected.
7. `shell_environment_policy.include_only` reliably exposes named var on Codex CLI 0.125.0+ and current Codex macOS app `26.429.20946` build `2312`. *(Shell research v2 **P04**: schema documented but cross-surface behavior undocumented; issue #3064 suggests divergence. `scripts/dev/prepare-codex-env-policy-matrix.sh` and `just codex-env-policy-probe-fixture` now provide the probe packet and redaction-contract check. Runtime CLI/app/IDE rows remain open and require an approved observation path.)*
8. Verify `apiKeyHelper` CLI-only scope statement against live Anthropic docs. *(Shell research v2 §2.3 confirms at doc level.)*
9. Confirm D-031 surface coverage: `[profiles.hcs-*]` are CLI-only opt-ins unless a future Codex app/IDE probe proves otherwise.
10. Codex app MCP startup happens before worktree setup scripts. *(Shell research v2 **P03**: genuinely undocumented; marker-based timing test with synthetic repo, 8h. `scripts/dev/prepare-codex-mcp-startup-order.sh` and `just codex-mcp-startup-probe-fixture` now provide the setup/MCP startup-order packet and redaction-contract check. Runtime rows remain open and require an approved Codex app/control path.)*
11. **NEW — P06**: Shell wrapper-log validation and provenance closure. P06 is closed for Codex CLI and Claude Code CLI as of the 2026-04-28/29 host-telemetry closure run. In-repo wrapper, redaction fixture, and `/usr/local/bin/hcs-shell-logger` host install exist; approved PATH-routed probes confirmed the wrapper can capture `bash -lc`, `sh -c`, and `zsh -lc` safely after the shebang/atomic-append fixes. Cross-surface runtime evidence now has a sharper Codex split: internal Codex startup shells can use `/bin/zsh -lc`, but the actual Codex CLI tool-call subprocess is `sandbox-exec -- /bin/zsh -c <redacted>`. The focused matrix resolved the Codex `allow_login_shell=false` question for this version/config: no-login-shell preserves the same tool subprocess argv while preventing the synthetic marker env from reaching the actual tool shell. Claude Code CLI Bash-tool subprocess is now host-observed as `/bin/zsh -c <redacted>` with marker propagation and `.zshenv` only. App/IDE surfaces remain separate P02/P03/P04/P13 work, not P06 blockers.
12. **NEW — P13**: Codex app sandbox boundary characterization (new `ExecutionContext` class). Static bundle/signing plus live helper process flags are captured; generated schema and stdio app-server status probe are complete; app-internal Keychain/filesystem/network status-code probes remain open. Current state is open/narrowed because the GUI app-server control socket is unavailable from this session and Computer Use cannot operate `com.openai.codex`; next proof requires a reachable GUI app-server control path or a human-run sterile Codex app UI turn.
13. **NEW — P08**: Provenance snapshot — initial Codex CLI tool-call subprocess fixture landed as `packages/fixtures/provenance-snapshot-2026-04-30.json`, generated by `scripts/dev/capture-provenance-snapshot.py` and validated by `just provenance-snapshot-fixture`. The fixture captures PATH/SHELL/HOME/PWD/TMPDIR/CODEX_HOME value/provenance tags for this surface only with `authority: sandbox-observation`; additional surfaces still require their own snapshots. Original scope: commit `packages/fixtures/provenance-snapshot-YYYY-MM-DD.json` golden data. 6h.
14. **NEW — P09**: direnv + mise cross-surface visibility. Terminal fixtures landed for both blocked/untrusted and isolated allowed/trusted paths. `scripts/dev/run-direnv-mise-fixture.sh` validates no marker visibility before allow/trust; `scripts/dev/run-direnv-mise-terminal-fixture.sh` validates marker visibility after temp-scoped `direnv allow` and `mise trust`. Both use synthetic repos plus sanitized temp `HOME`/`DIRENV_CONFIG`/`MISE_*` state. `scripts/dev/prepare-direnv-mise-gui-matrix.sh` and `just direnv-mise-gui-probe-fixture` now provide the GUI/IDE probe packet and redaction-contract check. GUI/IDE runtime rows remain open and require explicit approval for launch/app state and any real trust-store writes.

Phase 1 work items (queued, unordered here — sequenced in ADR 0012, ADR 0015, ADR 0016/0017/0018, and the Phase 1 research plan):

- If W4-1 succeeds: migrate all HTTP MCP servers with OAuth support off `bearer_token_env_var` patterns (per D-028).
- Sparkle intervention F-08 (kernel RPC for typed per-section diagnostics) — permanent fix for `pipefail+head` class.
- Sparkle intervention F-09 (hook-decision schema v2 with version field + rotation).
- Extended-rubric formalization into primary scoring schema (Phase 1 cross-agent layer).
- `just verify-baseline` recipe — operationalizes charter inv. 14's "retest on upgrade" cadence.
- Formal semantic capability identity — extend beyond the measurement-only `semantic-tool-map-v1` into Ring 0 ontology/policy schema so equivalent operation surfaces are first-class substrate facts.
- Remaining Sparkle follow-ups F-01/F-02/F-03/F-07/F-11/F-13.
- **Ring-0 entity additions from ADR 0015 scope** (Milestone 1 20-entity list expands; design choice of new entity vs. Evidence subtype remains a Phase 1 schema decision): `RateLimitObservation`, `RemoteMutationReceipt`, `CredentialIssuanceReceipt`, `ProviderObjectReference`, `PathCoverage`, `McpAuthorizationSurface`, `OriginAccessValidator` with nested/linked `AudienceValidationBinding` semantics (resolved by ADR 0015; motivated by `cloudflared` `audTag` mismatch), and `McpSessionObservation` / `ControlPlaneBackoffMarker` candidates (or Evidence subtypes) for authenticated MCP fan-out and `last_cf_mcp_429` diagnostics.
- **Ring-0 entity additions from shell research v2 (ADRs 0016/0017/0018)**: initial Zod schemas, generated JSON Schema, ontology docs, and tests landed for `ExecutionContext`, `EnvProvenance`, `CredentialSource`, and `StartupPhase`. The slice preserves per-surface execution-context evidence, devcontainer-style env timing, Codex env-policy vocabulary, durable credential-source preference, and the 14-phase startup timeline. Remaining Ring 0 work: reconcile these shell/env entities with the 20 core Milestone 1 entities, add `ToolResolution`, and fold ADR 0015 external-control-plane evidence entities into the same schema package without moving policy into adapters.
- **Trap scaffold expansion for #19–#30 and #36** — Cloudflare/external-control-plane traps #19–#25, shell research traps #26–#30, and tunnel-audience trap #36 now have scaffold files under `packages/evals/regression/`, matching the #16/#18/#37 scaffold format. Executable fixtures remain future work: #19–#25 need provider-shape/rate-limit/credential/MCP auth fixtures, #36 needs live-provider/tunnel fixture design, and #31–#35 remain gated by Q-003.
- **Cloudflare Stage 3a eval fixture** — `cloudflare-access-stage3a-rate-limit-and-secret-capture.fixture.md` encoding the real trajectory. Seed trajectory in the Cloudflare lessons brief.
- **Cloudflare tunnel-audience eval fixture** — `cloudflare-access-tunnel-audience-mismatch.fixture.md` encoding the child Access app AUD accepted by Access but rejected by `cloudflared` because `audTag` listed only the parent app AUD. Seed trajectory in the Cloudflare lessons addendum.
- **Cloudflare MCP fan-out eval fixture** — `cloudflare-mcp-fanout-and-quarantine.fixture.md` encoding multiple authenticated `mcp-remote` sessions against one account-scoped token, recent `last_cf_mcp_429`, authenticated-wrapper quarantine, and docs-MCP degraded mode. Seed trajectory in the Cloudflare MCP diagnostics addendum.
- **Codex/ScopeCam eval fixture candidates #39–#44** — seed-only until a redacted primary transcript or human-approved fixture exists. Trap families: `tool-symptom-as-environment-diagnosis`, `execution-mode-conflation`, `remote-gone-branch-deletion-without-proof`, `worktree-ownership-ignored`, `branch-flow-ancestry-ignored`, and `inline-pr-body-shell-expansion`. Q-008 owns whether these become full scaffolds and which typed evidence receipts they require.
- **`hcs env-inspect` prototype** (shell research v2 §V.P12, 10h). Initial repo-local prototype landed as `scripts/dev/hcs-env-inspect.py` with fixture recipe `just env-inspect-fixture`; modes are `names_only | existence_check | classified | hashed`. Classifiers report "present + looks like JWT" / "present + looks like AWS key" / "present + non-secret shape" without echoing values. Includes regression coverage for the `printenv | grep` anti-pattern. First-class operational surface for trap #18 defense-in-depth remains future Ring 1 work (text rule + hook + operation-shape).
- **Typed process-inspection operation** — close trap #37 by separating host process reads from generic shell. Default to pid/name-only fields (`comm`), require redaction before transcript persistence for argv, and treat termination as a separate mutating operation requiring approval.
- **Semantic ontology + resource-pressure research intake** — use `docs/host-capability-substrate/semantic-ontology-resource-research-plan.md` to collect official-source findings before Phase 1 Ring-0 schema work and ResourceBudget enforcement. Scope includes W3C-style semantic practices, Covenant/Citadel governance materials as citation inputs, and test-runner/memory-pressure limits for Vitest, pytest/xdist, Node, Python, Playwright, Jest, Go, Cargo, Gradle, and macOS host signals.
- **2026-04-26 research execution intake** — run the semantic/resource program as source-bound discovery before synthesis. Use the source-class taxonomy, worker result template, output registry, and verification gates added in `semantic-ontology-resource-research-plan.md` v1.1.0. If capacity is limited, start with Wave 1C/1D: Vitest, Jest, pytest/xdist, Node, Playwright, Go, Cargo, Gradle, package managers, containers, macOS memory pressure, and macOS process limits.
- **Runner architecture compatibility intake** — preserve HCS/Citadel boundaries from `docs/host-capability-substrate/local-first-ci-opentofu-runner-design.md` and `docs/host-capability-substrate/research/external/2026-04-26-proposed-runner-architecture.md`: GitHub schedules and gates, Citadel/OpenTofu/PaC owns desired runner/workflow state, Proxmox/Linux x64 is the trusted self-hosted appliance class, hosted smoke remains the clean-room sentinel, MacBook runner use stays manual-only, and HCS consumes runner/check/resource/credential evidence rather than becoming a CI control plane. Q-005 gates any CI-specific entity or policy work.
- **GitHub/version-control authority intake** — preserve the 2026-04-29 local report at `docs/host-capability-substrate/research/local/2026-04-29-github-version-control-agentic-surface.md`. Q-006 gates schema/policy work that would model GitHub as an authority surface. Core lesson: GitHub on this host spans SSH transport aliases, Git signing/authorship config, `gh` keyring sessions, GitHub MCP PAT/OAuth/Copilot auth, per-workspace env overrides, repo settings/rulesets/Actions, check status sources, and local worktree/remote state. Do not collapse these into a single "GitHub auth" fact.
- **Version-control authority consult intake** — preserve the 2026-05-01 inline consult source note at `docs/host-capability-substrate/research/external/2026-05-01-version-control-authority-consult.md` and synthesis at `docs/host-capability-substrate/research/local/2026-05-01-version-control-authority-consult-synthesis.md`. Q-006 now explicitly includes source-control continuity, expected check source identity, Actions posture, `BranchDeletionProof`, split GitHub credential surfaces, and read-only dashboard posture before any GitHub mutation lane. Core lesson: green check names, `gh` login state, MCP tool availability, branch UI state, and local Git observations are all partial evidence, not authority by themselves.
- **ADR 0020 accepted posture** — `docs/host-capability-substrate/adr/0020-version-control-authority.md` records the accepted limited Q-006 direction: version control is a typed authority surface, Git/GitHub facts start as evidence subtypes/receipts, check consumption requires expected-source identity, branch cleanup requires `BranchDeletionProof`, Actions posture is separate evidence, and source-control continuity is freshness-bound. Its receipt list is split into five load-bearing Q-006 review names (`GitConfigResolution`, `GitIdentityBinding`, `BranchDeletionProof`, `StatusCheckSourceObservation`, `SourceControlContinuityReceipt`) plus a broader deferred inventory. ADR 0020 accepts no GitHub mutation and does not displace Q-005/Q-008/Q-009.
- **ADR 0027 Q-006 stage-1 expansion accepted; schema landed in Phase 2.3.3 (2026-05-06)** — `docs/host-capability-substrate/adr/0027-q-006-stage-1-source-control-evidence-subtypes.md` commits three foundational receipts: `GitRepositoryObservation` and `GitRemoteObservation` as `evidenceSchema`-direct typed payloads (Q-011 bucket 1; no new envelopes), and `BranchProtectionObservation` as a `BoundaryObservation` payload for the `branch_protection` dimension. `GitRemoteObservation` adopts per-(repository, remote_name, ref) grain so "remote-gone" becomes a typed observation rather than an agent assertion (closes the ScopeCam motivating failure at the receipt-shape layer). `GitRepositoryObservation.repository_id` is resolved by a Ring 1 service from `WorkspaceContext`; agent-supplied `repository_id` rejected at the observation-mint API. Multi-remote repositories (fork + upstream + mirror) are first-class via `remote_observation_evidence_refs`. Phase 2.3.3 also lands ADR 0030 stage-2 source-control receipts and ADR 0033 GitHub authority/identity evidence; no source-control mutation lane, hook behavior, or canonical policy YAML is authorized by the schema slice.
- **Ontology promotion and receipt dedupe planning** — `docs/host-capability-substrate/research/local/2026-05-01-ontology-promotion-receipt-dedupe-plan.md` records the cross-Q review rule before additional Ring 0 schema work: observed facts start as evidence subtypes, durable lifecycle objects become standalone entities, and proof composites / authored coordination facts need their own sub-rules. Q-011 is human-approved for the promotion buckets, naming convention, duplicate dispositions, dependency order, full `Evidence` base-shape prerequisite, `boundary_dimension` registry location, and `ExecutionContext.sandbox` coexistence/migration. No schema or policy changes are accepted from this planning doc.
- **Version-control posture dashboard planning** — `docs/host-capability-substrate/dashboard-contracts.md` v0.2.3 adds a candidate read-only `VersionControlPosture` view model, `/source-control` route sketch, and canonical per-surface capability state vocabulary (`proven`, `denied`, `pending`, `stale`, `contradictory`, `inapplicable`, `unknown`). It is planning only: no dashboard route, schema, API endpoint, policy tier, GitHub setting, or mutation lane exists yet. The view exists to keep Q-006 evidence dashboard-renderable before any source-control mutation operation is designed.
- **Quality-management boundary intake** — preserve the 2026-04-29 synthesis at `docs/host-capability-substrate/research/local/2026-04-29-quality-management-synthesis.md` and source reports at `docs/host-capability-substrate/research/external/2026-04-29-github-boundaries-research.md` / `docs/host-capability-substrate/research/external/2026-04-29-hcp-quality-management.md`. Q-007 gates schema/policy/dashboard work for `QualityGate`, `BoundaryObservation`, macOS app/TCC/filesystem evidence, package-manager/shim provenance, and boundary uncertainty. Core lesson: boundaries are loose by nature on macOS/GitHub/package-manager surfaces, so HCS should model stale, missing, contradictory, and context-bound evidence explicitly rather than pretending the boundary is stable.
- **ADR 0022 accepted (2026-05-02)** — `docs/host-capability-substrate/adr/0022-boundary-observation-envelope.md` accepts the Q-007a direction: model `BoundaryObservation` as a freshness-bound `Evidence` subtype envelope first, keep `QualityGate` deferred, and use the envelope to reconcile macOS/TCC/app-bundle, package-manager, runner, source-control, execution-mode, and remote-agent boundary claims without making adapters or dashboards own policy. The accepted field block makes version composition, target references, singular `boundary_dimension` taxonomy discipline, primary-target binding, `observed_payload` / `expected_payload` domain-payload ownership, and linked-observation semantics explicit. Version/build/dependency changes are freshness invalidation signals for specific dimensions, not a generic `version_drift` dimension. ADR 0022 acceptance commits envelope shape only; the `boundary_dimension` registry at `docs/host-capability-substrate/ontology-registry.md`, `BoundaryObservation` Zod source and generated JSON Schema, policy tier, dashboard route, regression-trap, and runtime probe remain follow-up work.
- **BoundaryObservation regression candidates** — the hcs-architect review recommends traps for "anything uncertain" boundary envelopes, multi-dimension envelopes, authority promotion, and version drift as dimension. Do not scaffold these as regression files until ADR 0022 is accepted and each trap satisfies `.agents/skills/hcs-regression-trap/SKILL.md`'s no-synthetic-trap rule. The observed `version_drift` candidate-dimension misstep is eligible for future trap review with commits `c6d3183` / `c9661b6` as citation; the other three need an observed incident or human-approved fixture source before entering `packages/evals/regression/seed.md`.
- **Charter v1.3 amendment cycle waves 2 + 3 landed (2026-05-02; ADR 0024)** — charter v1.3.1 added 3 boundary-enforcement bullets and 6 forbidden-pattern entries operationalizing invariants 16 and 17 (wave-2). Charter v1.3.2 closed gaps identified by the post-merge `hcs-security-reviewer`: 3 new forbidden patterns (cross-context evidence reuse, fabricated `BoundaryObservation`, `ExecutionContext` misclassification), extended surface enumeration on the parent-context-inheritance forbidden pattern (added Warp, Zed external agent, Cursor, Windsurf, JetBrains AI Assistant, GitHub Copilot CLI, launchd `EnvironmentVariables`), extended inheritance-dimension list (added egress, filesystem authority, `BoundaryObservation` records), and tightened the rate-limit-as-retry-trigger pattern to cover agent-self-implemented backoff and require a `Decision`-referencing-observation record (wave-3). ADR 0024 records the authority for both waves and closes the change-policy compliance question raised by the `hcs-policy-reviewer`. Invariant text unchanged across both waves. CI implementation of the new bullets is queued separately: the policy-lint check that "every `OperationShape` carries a resolved `ExecutionContext` reference" requires a kernel `OperationShape` schema first (Milestone 1 expansion); the `provider_kind != "local"` evidence-shape declaration check requires capability-manifest schema work (Milestone 2 / 4); the typed-slot distinction check (`ProviderObjectReference` vs `PublicClientId` vs `PolicySelectorValue` vs `SecretReference`) requires the schema slice that introduces those types. Charter prose is binding; CI plumbing follows the supporting schemas.
- **`BoundaryObservation.evidence_refs` migration** — the BoundaryObservation Zod schema currently uses the lightweight `evidenceRefSchema` for `evidence_refs`. ADR 0022's stated precondition that the full `Evidence` base entity must land before envelope acceptance has been met (commit `760a5b6`); migration to typed pointers or full `evidenceSchema` references should be tracked. Hold for ontology review on whether `evidenceRefSchema` remains the canonical inter-entity reference for all evidence subtypes or whether a typed pointer-by-id pattern is preferred. Coordinated with `EnvProvenance`, `CredentialSource`, `ExecutionContext`, and `StartupPhase` which use the same lightweight reference today.
- **`evidence_schema_version` typing follow-up resolved in Phase 2.3.3 (2026-05-06)** — the BoundaryObservation envelope's `evidence_schema_version` field now uses a dedicated non-empty string schema so envelope and base-Evidence schema versions can move independently. Continue coordinating future Evidence schema bumps through generated-schema drift checks.
- **BoundaryObservation envelope-level freshness/redaction posture resolved in Phase 2.3.3 (2026-05-06)** — the envelope now carries Evidence-base provenance/freshness fields (`source`, optional `source_ref`, `observed_at`, non-null `valid_until`, `authority`, `confidence`, `parser_version`, optional `producer`, optional `redaction_mode`) in addition to linked `evidence_refs`. This implements charter invariant 19 for `BoundaryObservation`; Q-007 still owns gate behavior for stale, contradictory, or missing boundary observations.
- **Codex/ScopeCam execution-reality intake** — preserve the 2026-04-30 report at `docs/host-capability-substrate/research/external/2026-04-30-codex-scopecam-exchange-lessons.md` and synthesis at `docs/host-capability-substrate/research/local/2026-04-30-codex-scopecam-exchange-synthesis.md`. Q-008 gates schema/policy/eval work for `ToolInvocationReceipt`, `CommandCaptureReceipt`, `ExecutionModeObservation`, branch-flow invariants, and worktree ownership. Q-008(e) (`gh --body-file` renderer / agent-guidance discipline) is settled (2026-05-02) and recorded in `AGENTS.md`; trap #44 (inline-pr-body-shell-expansion) is now eligible for scaffold promotion against the ScopeCam exchange as observed-incident citation. Q-008(c) accepted via ADR 0025 (revision 2, accepted 2026-05-02; `docs/host-capability-substrate/adr/0025-branch-deletion-proof.md`): Ring 0 proof composite (Q-011 bucket 3) **minted by a Ring 1 kernel service** with five-layer defense-in-depth enforcement (Ring 1 mint API → Zod structural guard → gateway/policy authoritative non-escalable per inv. 6, re-checked at execution time → `hcs-hook` substrate interception against literal-protected-list → broker FSM force-flag binding + single-use + contradictory-evidence rejection); discriminator-and-array pattern (`merge_proof_kind`, `pr_state_kind`) per ontology-registry v0.2.1 §Naming suffix discipline replaces v1's collapsed-OR fields; positive-absence `PullRequestAbsenceReceipt` required for `pr_state_kind = absent`; multi-worktree branches require `worktree_inventory_evidence_refs`; composite participates in audit hash chain. Schema implementation gated on Q-006 component evidence subtypes (`GitRepositoryObservation`, `GitWorktreeObservation`, `GitWorktreeInventoryObservation`, `GitBranchAncestryObservation`, `GitRemoteObservation`, `GitDirtyStateObservation`, `PullRequestReceipt`, `PullRequestAbsenceReceipt`) landing first. **ADR 0026 queued**: substrate hook architecture for non-literal protected-branch classification (lands once `BranchProtectionObservation` schema exists from ADR 0027 stage-1 acceptance + schema implementation). Q-008(a) accepted via ADR 0028 (revision 4, accepted 2026-05-03; `docs/host-capability-substrate/adr/0028-q-008-a-execution-mode-receipts.md`) after a four-revision review cycle. All three receipts (`ToolInvocationReceipt`, `CommandCaptureReceipt`, `ExecutionModeObservation`) use `evidenceSchema` directly as typed payloads (Q-011 bucket 1; no new envelopes); authority-class fields (`captured_by`, `observed_via`) are kernel-set per registry v0.3.2; `Evidence.producer` is kernel-set when its value names a kernel-trusted class (`kernel_broker` | `kernel_telemetry` | `mint_api`); the new `self-asserted` authority class (registry v0.3.0) is the canonical class for unverified producer claims and cannot be promoted. `CommandCaptureReceipt.capture_status: empty` is the typed positive empty-capture receipt closing the ScopeCam motivating failure at the receipt-shape layer. Producer-crash kernel watchdog: broker FSM emits synthetic `ToolInvocationReceipt` via `kqueue EVFILT_PROC NOTE_EXIT` (macOS) when broker-mediated producers exit without a closing receipt; watchdog scope covers broker-spawned/supervised/MCP-via-broker exec paths, with agent-harness-spawned tools relying on agent-side closing + mint-API session-close pairing, and daemon/double-fork-detached children explicitly out-of-scope for Phase 1. `argv_capture_mode` (renamed from v1's `argv_redaction_mode`); excerpt byte cap committed at `<= 1024 bytes`; capture-status × redaction-mode matrix explicit; `mode` enum value `sandbox_observation` renamed to `sandboxed` to break the collision with `sandbox-observation` authority class; `mode: unknown` BLOCKS at gateway; mode-agnostic operations are policy-declared in canonical policy (never producer-asserted) and remain subject to inv. 7 mutation_scope rules. `parent_invocation_id` lives in `subject_refs[relation="parent"]` per registry v0.2.1; cross-context parent linkage requires `ContextInheritanceReceipt` (queued for stage-2 ontology) carrying `host-observation` authority. Schema implementation gated on Q-008(b) blocking thresholds (now proposed in ADR 0029, see below), the `tool_invocation` evidence-subject enum extension, the `Evidence.producer` schema-side tightening (free-form string → kind-tagged shape), and the `self-asserted` authority class enum extension. Q-008(b) (anomalous-command-capture blocking thresholds) is **proposed in ADR 0029** (`docs/host-capability-substrate/adr/0029-q-008-b-anomalous-capture-blocking-thresholds.md`, 2026-05-03): three-state matrix (`block` | `approval_required` | `warn`) crossed with seven anomalous-capture combinations and six operation classes; `block` cells non-escalable per inv. 6; `approval_required` consumes `ApprovalGrant`; `warn` produces typed `Decision` audit-chain records. Proof composites (ADR 0025 v2's `BranchDeletionProof`) consume the matrix at composition time. ADR 0029 awaits human acceptance and reviewer-subagent re-pass. Q-008(d) worktree-ownership remains gated on Q-003. Core lesson: a command symptom is not a diagnosis; no-output/tool failures must stop destructive Git cleanup and implementation until execution mode is classified.
- **HCS diagnostic surface and workspace manifest intake** — preserve the normalized 2026-04-30 report at `docs/host-capability-substrate/research/external/2026-04-30-hcs-evidence-planning-report-1.md` and synthesis at `docs/host-capability-substrate/research/local/2026-04-30-hcs-evidence-planning-synthesis.md`. Q-009 gates schema/policy/adapter work for candidate surfaces `system.runtime.diagnose.v1`, `system.git.diagnose.v1`, `system.workspace.diagnose.v1`, `system.process.inspect_safe.v1`, `system.docs.diagnose.v1`, `system.cleanup.plan.v1`, and `system.claims.reconcile.v1`; only D-028's `host_secret_*` compatibility contract is accepted today. Core lesson: HCS should expose typed, redacted, provenance-carrying diagnostics and workspace-profile inputs rather than letting target repos reinvent host reality checks.
- **Agentic tool isolation compatibility intake** — preserve the 2026-05-01 report at `docs/host-capability-substrate/research/external/2026-05-01-agentic-coding-tool-isolation-report.md` and synthesis at `docs/host-capability-substrate/research/local/2026-05-01-agentic-tool-isolation-synthesis.md`. Q-010 gates schema/policy/tooling-matrix work for cross-agent containment vocabulary. Core lesson: permission gating, worktree/file isolation, local kernel sandboxing, container/VM isolation, and remote cloud execution are separate evidence dimensions. Do not import the report's `SharedAgentPolicySchema` as canonical HCS shape; reconcile the useful vocabulary through `ExecutionContext`, `AgentClient`, `ToolInstallation`, `ResolvedTool`, `CredentialSource`, `WorkspaceContext`, `ResourceBudget`, and future `BoundaryObservation` candidates.
- **Provenance snapshot data** (shell research v2 §V.P08, 6h) — initial Codex CLI tool-call fixture committed as `packages/fixtures/provenance-snapshot-2026-04-30.json`; re-snapshot on tool version changes per charter inv. 14 and add separate fixtures for app/IDE surfaces after their execution context probes exist.
- **Codex official config/app-settings ingest** — `docs/host-capability-substrate/research/shell-env/2026-05-01-codex-official-config-app-settings-ingest.md` preserves the 2026-05-01 official config basics and macOS app settings intake. Key implications: CLI flags/profiles/project/user/system/default config precedence; untrusted projects skip `.codex/` project layers; managed `requirements.toml` is an admin constraint source, not HCS live policy; Workspace Dependencies are app-managed toolchain evidence; app Git/worktree settings can prune worktrees but do not prove branch deletion safety; local environments are worktree/bootstrap scope, not startup-auth authority.
- **Claude Desktop / Claude Code Desktop settings ingest** — `docs/host-capability-substrate/research/shell-env/2026-05-01-claude-desktop-code-settings-ingest.md` preserves the 2026-05-01 app settings intake. Key implications: Claude Desktop MCP config lives at `~/Library/Application Support/Claude/claude_desktop_config.json`; filesystem tool `ask` prompts are app-mediated permissions, not HCS `ApprovalGrant` records; bypass mode and auto permissions mode are app postures, not kernel policy; persisted Preview sessions may contain cookies/local storage/login state; `.claude/worktrees` is generated but potentially load-bearing state; web PR/autofix automation belongs to the GitHub/external-control-plane authority workstream.
- **LaunchAgent env policy table** (shell research v2 §V.P11, 6h) — design-only memo landed at `docs/host-capability-substrate/research/shell-env/2026-04-30-P11-launchagent-env-policy-table.md`; ADR acceptance remains future synthesis work.
- **Charter v1.3.0 invariant 16 (active 2026-05-02)** — Charter v1.3.0 landed with "external-control-plane evidence-first": operations against remote control planes must produce typed evidence before provider-side mutations, distinguish provider object references / public client IDs / policy selector values / secret references / secret material, model separable provider validator surfaces before mutations that depend on them, and treat rate-limit/backoff state as evidence rather than retry pressure. Typed evidence is necessary, not sufficient, and does not bypass policy/gateway, approvals, broker FSM, audit, dashboard review, or leases.
- **Charter v1.3.0 invariant 17 (active 2026-05-02)** — Charter v1.3.0 landed with "execution-context is declared, not inferred": every operation carries a resolved `ExecutionContext.surface` reference; agents must not assume a subprocess inherits any sandbox, capability, environment, or credential scope from the parent context unless intentional inheritance is represented by typed evidence bound to the target context and the exact dimension asserted. Codex `inherit` / `include_only` is environment-materialization evidence only; it does not prove credential authority, sandbox scope, app/TCC permission, provider mutation authority, or HCS `ApprovalGrant` status.
- **ADR 0021 accepted** — `docs/host-capability-substrate/adr/0021-charter-v1-3-wave-1.md` packages charter v1.3.0 wave 1: invariant 16 and invariant 17 only, with invariants 18-20 deferred to Q-003/Q-007/Q-008. The charter-edit PR landed 2026-05-02; invariants 16 and 17 are now active in `implementation-charter.md` v1.3.0.
- **Principal-level `ResourceBudget` rollup** — the Cloudflare 5-minute/1200-request limit is a user-level budget cumulative across dashboard/API-key/API-token/MCP surfaces. Principal-scoped `ResourceBudget` abstraction queued in ADR 0015, with broker enforcement consuming MCP fan-out diagnostics and `last_cf_mcp_429` markers before mutations.
- **Charter v1.3.0 candidate invariant 19** — "boundary claims are freshness-bound and execution-context-bound": HCS must model contradictory or missing boundary evidence explicitly and must not promote a boundary inference across macOS app, shell, package-manager, Git/GitHub, or MCP surfaces without a matching observed context. Queue-only; Q-007 decides whether this becomes a charter invariant or remains a Phase 1 design principle.
- **Charter v1.3.0 candidate invariant 20** — "command symptoms are not diagnoses": HCS-mediated agents must distinguish tool/runtime failure from command failure, must not promote command evidence across unmatched execution modes, and must block destructive Git cleanup unless branch/worktree safety is proven by typed evidence. Queue-only; Q-008 decides whether this becomes a charter invariant or remains an agent operating-contract rule.

### CI runner compatibility items (Q-005 settled by ADR 0032 v2; entries below are pre-settlement audit trail)

The 2026-04-26 runner architecture brief is for a separate CI/runner project,
but HCS must stay compatible with it. Treat the report as Ring 3 planning and
do not implement runner infrastructure from this repo.

- **Boundary rule:** HCS observes and gates HCS-mediated local host operations; GitHub/Citadel own CI scheduling, branch/ruleset gates, runner group desired state, workflow policy, and Proxmox runner definitions.
- **Evidence candidates:** `RunnerHostObservation`, `RunnerIsolationObservation`, `WorkflowRunReceipt`, `CleanRoomSmokeReceipt`, `ResourceBudgetObservation`, and `PolicyPlanReceipt` should be considered as `Evidence` subtypes before adding standalone Ring-0 entities.
- **Policy candidates:** public fork code on self-hosted runners, generic `runs-on: self-hosted`, MacBook always-on CI, runner tokens in OpenTofu state, personal credentials on CI hosts, and Docker socket exposure to untrusted jobs are forbidden/non-escalable candidates, but tier entries belong in canonical system-config policy after review.
- **Regression-trap candidates:** `public-fork-self-hosted-runner`, `macbook-ambient-credential-runner`, `persistent-runner-workspace-authority`, `ci-cache-promoted-to-evidence`, `runner-token-in-opentofu-state`, `status-check-from-wrong-source`, `docker-socket-on-untrusted-runner`, and `workflow-yaml-as-build-system`. Do not add them to the committed corpus until a concrete observed failure or human-approved trap expansion exists.
- **Phase 1 synthesis dependency:** fold runner observations into ResourceBudget/external-control-plane synthesis after Wave 1C/1D verification, not before.

### Coordination / shared-state items (Q-003 settled by ADR 0019 v3; entries below are pre-settlement audit trail)

The 2026-04-24 coordination-lessons brief (`docs/host-capability-substrate/research/external/2026-04-24-coordination-lessons.md`) proposes a three-layer shared-state architecture. The brief is highly aligned with existing HCS posture (charter inv. 1/2/5/7/8/10, D-025/D-026, ADR 0004/0010/0011), but committing to the architecture is a whole-system design commitment. **Five sub-decisions are bundled as Q-003 in DECISIONS.md pending** and must be resolved before any of the items below land on main:

- **ADR 0019 — HCS Knowledge and Coordination Store (candidate).** Three-layer taxonomy: (1) authoritative operational store (existing SQLite WAL, M3); (2) coordination state layer (NEW — typed gateable coordination facts); (3) retrieval/RAG index (NEW — derived, never authoritative). Plus the promotion workflow (agent proposes → verifier promotes). Drafting window: **post-Phase-1 synthesis (2026-05-08) or later** — not Week 1 of Phase 1, because ADR 0019 is a larger commitment than 0016/0017/0018.
- **Four Ring-0 entity candidates (Q-003 sub-decision b reconciles vs existing `Evidence`):** `KnowledgeSource` (indexable canonical source: charter / ADR / decision-ledger / runbook / vendor-doc / receipt / code / schema / audit-summary), `KnowledgeChunk` (derived chunk with stable content hash), `CoordinationFact` (subject/predicate/object gateable state with `evidence_ids`, `authority`, `confidence`, `valid_until`), `DerivedSummary` (agent-authored summary with `allowed_for_gate: false` until promoted).
- **Charter v1.3.0 invariant 18 candidate** — "Derived retrieval results are never decision authority. A retrieved chunk may guide the agent to a source, probe, receipt, or schema, but policy/gateway decisions and release gates consume only typed evidence, approved decisions, receipts, leases, and live observations." Extends charter inv. 8 (sandbox observations cannot be promoted) to the retrieval/RAG surface. Q-003 sub-decision (e) is whether this warrants a new invariant or remains a strong guideline under inv. 8.
- **Five regression trap seeds #31–#35** (stale-rag-release-gate, detached-worktree-false-regression, agent-summary-overclaim, stale-ssh-alias, auth-surface-conflation) — seeded in `packages/evals/regression/seed.md`. Scaffolds require the coordination/knowledge substrate which is gated by Q-003 resolution.
- **D-033 candidate** — "HCS shared memory is typed evidence + coordination state + derived retrieval index, not agent memory." **NOT in the W3 closeout batch** (D-029/D-030/D-031/D-032 only); D-033 lands on a post-Phase-1 decisions sweep once Q-003 is resolved.
- **Promotion workflow formalization** (Q-003 sub-decision d): agent writes `candidate_memory` with `requires_verification`; verifier promotes to `coordination_fact` with `evidence_ids` and `allowed_for_gate: true`. Open question: is this a parallel track to the approval-grant pattern (M2) or reuse with a different target entity?
- **Dashboard views** (Milestone 5+ additions, gated by Q-003): `/evidence`, `/coordination`, `/knowledge`, `/interventions`, `/reconciliation`. Should show when a model used a retrieved chunk vs. when a gate used typed evidence — the distinction visible to the human reviewer.
- **Storage posture** (aligns with existing D-003/ADR 0004 — no divergence): SQLite WAL remains the authority store; SQLite FTS is sufficient for the first retrieval layer; embeddings are a derived index rebuildable from `KnowledgeSource` + `KnowledgeChunk`; hosted vector stores are NOT acceptable for private runtime state (aligns with charter inv. 10 + D-018); Postgres/pgvector only becomes worth it when HCS goes multi-host or multi-writer.

### Phase 1 shell/environment research program (shell research v2.12.0, 2026-04-27 -> 2026-05-08)

Formal 10-working-day research program from `docs/host-capability-substrate/shell-environment-research.md` §IV. Secret-safe testing constraint throughout: existence-only checks, name-only capture, hashes, or classified/redacted — no raw secret values in transcripts. Grounded in trap #18 + NIST SP 800-92 + CWE-532/200 + OWASP logging guidance.

| Wave | Days | Prompts | Hours | Deliverable |
|------|------|---------|-------|-------------|
| Foundation | Mon 04-27 | — | 4 | Redaction-safe harness, synthetic repo, evidence template, redaction rules |
| Wave 1 — resolved/near-resolved | 04-27 → 04-29 | P01, P05, P02, P13, P06 | 12 | Five memos + wrapper logs + sandbox characterization |
| Wave 2 - genuinely open | 04-30 -> 05-06 | P04, P03, P09 GUI/IDE; P08 surface expansion as available | 30 | Cross-surface matrix + MCP/setup-script trace + direnv/mise matrix; initial Codex CLI provenance snapshot, P03/P04/P09 probe packets, and P09 terminal fixtures landed |
| Wave 3 - design + prototype (parallel with Wave 2) | 04-29 -> 05-06 | P12 Ring 1 design later | 16-20 | LaunchAgent-env policy table and repo-local `hcs env-inspect` prototype landed |
| Synthesis | 05-07 -> 05-08 | - | 6 | ADR 0016 + 0017 + 0018 accepted, regression trap scaffolds #26-#30 landed, initial shell/env Ring-0 schemas landed; core reconciliation remains next |

**ADR candidates from synthesis (scoped by shell research v2 §VIII):**

- **ADR 0016 — Shell/environment ownership boundaries.** Accepted at `docs/host-capability-substrate/adr/0016-shell-environment-boundaries.md`. It records policy conclusions 1–11 from shell research v2 §VI: shell-exported secrets are CLI convenience only, project config and shell/bootstrap config are separate planes, agent command shell persistence cannot be assumed, helper scripts declare shell ownership, HCS adopts Codex `shell_environment_policy` vocabulary and devcontainer env typing, `CLAUDE_ENV_FILE` is best-effort, and subagent isolation is preserved. Trap #29 (`packages/evals/regression/claude-env-file-durability.md`) is the existing canonical trap for `CLAUDE_ENV_FILE` durability; do not add a duplicate.
- **ADR 0017 — Codex app as distinct ExecutionContext.** Accepted at `docs/host-capability-substrate/adr/0017-codex-app-execution-context.md`. It models Codex app as `codex_app_sandboxed` with identity, launch, app-setting, and host-visible process evidence separated from pending app-internal Keychain/filesystem/network capability rows. It blocks the "Codex is Codex" mental model while keeping P13 runtime rows open. Dashboard-facing capability rows should use the shared seven-state capability vocabulary from `dashboard-contracts.md` / ADR 0022.
- **ADR 0018 — Durable credential source preference.** Accepted at `docs/host-capability-substrate/adr/0018-durable-credential-preference.md` with schema-field-only posture. It preserves tool-native OAuth + OS storage where first-party and verified, but prefers brokered `SecretReference` values, long-lived setup-token-style credentials, API keys, or service accounts for HCS-integrated/headless/non-OAuth/one-time-secret flows. Shell env remains a compatibility rendering, not the durable credential source. Future credential-source schema review should preserve audience and mutation-scope posture without pre-accepting the Q-006 GitHub MCP read/mutation split.

**Remaining unknowns** (shell research v2 §VII — upstream questions, not blocking Phase 1):

- `apiKeyHelper` Windows behavior (PowerShell vs cmd inconsistency).
- `CLAUDE_ENV_FILE` path uniqueness across parallel Claude Code sessions.
- Whether Codex `shell_snapshot` captures credential-shaped env vars under the default exclude filter.
- Whether `mise activate` runs in a non-TTY ACP session (Zed → Claude Agent).
- Whether Codex app Seatbelt profile is strictly tighter than CLI's.
- Claude Desktop Keychain service name vs CLI's `"Claude Code-credentials"`.

Discipline for W2–W3: no changes to `classify.py`, `.claude/hooks/`, `just measure` collectors, Codex profiles, `tiers.yaml`, or charter-on-main during the soak window (2026-04-24 and 2026-04-25). Draft-in-branch is permitted; merges land on 2026-04-26 in the ordered sequence above.

---

## Milestone 0 — Repository scaffold

**Goal:** The repo enforces its own discipline from commit 1.

**Acceptance:**

- Package layout exists (`packages/schemas`, `packages/kernel`, `packages/adapters`, `packages/dashboard`, `packages/evals`, `packages/fixtures`)
- `just verify` runs (even if it only runs lint + boundary-check + forbidden-string-scan + no-runtime-state-in-repo)
- Schema package compiles (empty but typed)
- `docs/host-capability-substrate/` exists with charter (v1.3.0+), tooling-surface-matrix, ADR template, and accepted ADRs 0001-0015 through closeout
- `AGENTS.md`, `CLAUDE.md`, `PLAN.md`, `IMPLEMENT.md`, `DECISIONS.md` in place
- `.agents/skills/` has the six canonical workflow skills (hcs-adr-review, hcs-draft-adr, hcs-regression-trap, hcs-operation-proof, hcs-policy-tier-entry, hcs-schema-change)
- `.claude/agents/` has six subagents (architect, ontology-reviewer, policy-reviewer, security-reviewer, hook-integrator, eval-reviewer)
- `.claude/skills/` empty at Phase 0a
- `.claude/settings.json` present with model=opus, deny-list for forbidden literals, hook wiring
- `.claude/hooks/hcs-hook` present in log-only mode
- No `WARP.md`, no `.windsurf/`, no `.copilot/`
- CI boundary checks wired (strict from M0): boundary-check, policy-lint, schema-drift, forbidden-string-scan, no-live-secrets, no-runtime-state-in-repo

**Validation:**

```bash
just verify
```

---

## Milestone 1 — Ontology schemas (Ring 0)

**Goal:** 22 canonical entities are real and versioned.

**Acceptance:**

- 22 canonical entities (HostProfile, WorkspaceContext, Principal, AgentClient, Session, ToolProvider, ToolInstallation, ResolvedTool, Capability, OperationShape, CommandShape, Evidence, ExecutionContext, PolicyRule, Decision, ApprovalGrant, Run, Artifact, Lease, Lock, SecretReference, ResourceBudget) as Zod schemas. `ExecutionContext` is on the canonical list per ADR 0021 invariant 17 forward binding (charter v1.3.0); `EnvProvenance`, `CredentialSource`, and `StartupPhase` remain Phase 1 supplemental entities until Q-011-guided ontology review promotes them.
- JSON Schema generated from Zod
- Every entity has `schema_version`
- Provenance schema (`Evidence`) is reusable by every fact-returning service
- Docs autogenerated or hand-written and verified against schemas

**Validation:**

```bash
just test schemas
just generate-schemas --check
```

---

## Milestone 2 — Policy snapshot + decision package

**Goal:** Policy can be evaluated against structured inputs without a running kernel.

**2026-06-10 re-sync.** This block predated the Q-007(d) resolution and was
re-synced to settled decisions. The original text named `ApprovalRequest` — an early
research-sketch concept (2026-04-29 intake) that the canonical ontology split into
`Decision` + `ApprovalGrant`, both landed in M1; no binding doc defines an
`ApprovalRequest` object (ADRs 0057/0064 use `ApprovalGrant` exclusively). It also
framed Q-007(d) as open with a four-state `observation_state` gate set; Q-007(d) was
settled 2026-05-03 by ADR 0034 v2, whose matrix is keyed to `valid_until` expiry, not
`observation_state`. M2 implements that decision; it does not re-open it.

**Acceptance:**

- `tiers.yaml` schema validates against Zod entity schemas
- `Decision.reason_kind` gains the three reserved `boundary_evidence_*` values
  (`_stale` / `_missing` / `_contradictory`, with `divergent_evidence_ref_pair` —
  an exactly-two `evidence_ref` pair — co-recorded on contradiction) and
  `Decision.required_grant_kind` gains the three reserved single-use
  acknowledgment grant kinds (`boundary_evidence_freshness_override` /
  `boundary_evidence_contradiction_acknowledgment` /
  `boundary_evidence_absence_acceptance`), with the matching `ApprovalGrant.scope`
  per-class boundary-evidence binding extension — the ADR 0034 posture-only
  reservations get their schema enum lift per `.agents/skills/hcs-schema-change`
- `Decision` / `ApprovalGrant` consumption of `BoundaryObservation` evidence refs
  implements the accepted Q-007(d) stateness matrix (ADR 0034 §Sub-decision (d)):
  rows {`stale`, `missing`, `contradictory`} × the six ADR-0029-v2 operation
  classes, with the `stale` row keyed to `valid_until` window expiry — NOT to the
  producer's `observation_state` field; an `unknown` observation that a consuming
  operation requires evaluates as `missing` (per ADR 0034, the matrix takes only
  the three anomaly rows, so the remaining observer-enum states — including
  `inapplicable` — are not matrix inputs and stay observer-side)
- tiers.yaml gains per-`boundary_dimension` `valid_until` freshness windows
  (ADR 0034: policy-set in tiers.yaml at Milestone 2 — a live-policy edit in
  system-config plus a coordinated byte-identical re-vendor of the snapshot)
- YAML policy loader exists and rejects malformed or stale-schema-version files,
  verifying `source_provenance.source_policy_sha256` against the bound snapshot
  digest before any rule influences a `Decision` (loader requirement per ADR 0060
  B-2; the test obligation — assert rejection at the digest-verification
  checkpoint, not merely final-Decision rejection — per ADR 0061 §Follow-up
  regression coverage, carried in ADR 0064's implementation-test table)
- Policy input shape (principal + session + host + workspace + operation + resolved_tools + evidence + requested_capability + time) is defined
- **No execution path exists yet.** No `system.exec.*`, no approval endpoints.

**Validation:**

```bash
just test policy
just policy-lint
```

---

## Milestone 3 — SQLite audit/facts bootstrap

**Goal:** Visible state and audit state are both persisted and queryable, independently.

**Acceptance:**

- `storage.sql` applied to a temp SQLite DB with WAL mode
- `audit_events` append implemented with hash chain (row_hash = sha256(prev_hash || canonical(row)))
- Checkpoint table exists (checkpoints not yet written to `op://`)
- `facts` + `fact_observations` split implemented
- Read-only `recent_events(limit, filter)` query exists
- Power-cut mid-write test passes (WAL integrity)

**Validation:**

```bash
just test storage
just test audit-chain
```

---

## Milestone 4 — First MCP read tools

**Goal:** First adapter surface live. Five read-only capabilities callable from Claude Code, Codex, etc.

**Acceptance:**

- `system.host.profile.v1` exposes structured output matching `HostProfile` schema
- `system.session.current.v1` returns live `Session` + `SessionContext`
- `system.tool.resolve.v1` walks mise → project-local → brew → system and returns `ResolvedTool` with provenance
- `system.tool.help.v1` caches `--help` with provenance + parser version
- `system.policy.classify_operation.v1` accepts `OperationShape`, returns `Decision`
- **No mutating endpoints.** Charter invariant 7 enforced by absence.
- MCP stdio adapter wires these 5 tools with strict tool schemas
- Audit log records every call

**Validation:**

```bash
just test mcp
just test integration:claude-code
```

---

## Milestone 5 — Gateway propose + dashboard summary

**Goal:** Full slice-1 surface live; dashboard shows live state.

**Acceptance:**

- `system.gateway.propose.v1` creates a proposal, returns decision package, does not execute
- `system.audit.recent.v1` queries visible state
- `system.dashboard.summary.v1` returns summary payload + local dashboard URL
- Dashboard has read-only views: `/health`, `/sessions`, `/tools`, `/policy`, `/audit`, `/dashboard-summary.json`
- View-model contracts match `DashboardSummary`, `LiveSessionRow`, `HostFactCard`, `ToolResolutionTrace`, `PolicyDecisionCard`, `OperationProposalCard`, `AuditTimelineEvent`, `CacheEntryCard`, `HealthStatus`
- Dashboard never bypasses policy — calls through the same gateway

**Validation:**

```bash
just test dashboard
just test integration:end-to-end-readonly
```

---

## Milestone 6 — Hooks wired + regression corpus runner

**Goal:** Agent behavior is shaped by substrate from session 1.

**Acceptance:**

- Claude Code PreToolUse hook calls `resolve` + `classify_operation` with 50ms timeout and cache fallback
- Codex hook (where supported) logs advisory signals and blocks forbidden Bash patterns
- Regression corpus runner executes the seed 15 traps against at least Claude Opus
- Acceptance criteria from research plan §6 Phase 3 measurable:
  - ≥50% reduction in redundant `--help` probes across agents vs baseline (top 10)
  - cache-hit p50 < 20ms, p99 < 80ms
  - cache-miss overhead < 50ms above underlying CLI
  - graceful degradation when kernel down
  - ≥1 documented substrate-beats-raw-shell case

**Validation:**

```bash
just test evals
just measure       # run daily during the active soak window
just measure-brief # consolidate partitions into the metrics diff
```

---

## Stop-and-fix rules

- If `just verify` fails, fix before proceeding to the next milestone.
- If a boundary-check rule is violated, the PR does not merge — even if tests pass.
- If a regression trap is triggered by substrate changes, add the trap to the corpus and fix in the same PR.
- If a schema changes, regenerate JSON Schema in the same commit.

## Architecture notes

- Ring 0 (schemas) ships first. Every other ring builds on it.
- Ring 1 (kernel) ships before any adapter. Never the reverse.
- Dashboard view contracts land with Ring 1 services — kernel output must be dashboard-renderable from day 1.
- Execute lane (mutations) is blocked until Milestone M4-Month-4 of the full roadmap in research plan §6 Phase 4 (charter invariant 7) — enforced by operator review, not a CI gate; no CI check reads change class today.

## Out of scope for initial build (explicit)

- Execute lane endpoints
- Approval grant creation/consumption
- Sandbox executor
- Remote (non-localhost) MCP
- A2A facade
- MCP Apps UI embeds

These belong in later milestones after the read-only substrate has demonstrated value under soak.
