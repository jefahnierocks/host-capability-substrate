---
title: HCS Ontology
category: reference
component: host_capability_substrate
status: partial
version: 1.21.0
last_updated: 2026-06-07
tags: [ontology, entities, schemas, evidence, operation-shape, execution-context, agent-client, verification-command-spec, knowledge-source, knowledge-chunk, coordination-fact, derived-summary, quality-gate, isolation, github, version-control, boundary-observation, ci-runner, credential-plane, machine-identity, project-substrate, teardown, backup-readiness, restore-drill, authority-discipline, self-asserted, cleanup-plan, decision, workspace-context, approval-grant, lease, run, principal, session, foundational-ring-0, policy-rule, capability, command-shape]
priority: high
---

# HCS Ontology

Authoritative human-facing reference for HCS Ring 0 entities. The original
canonical entity list is the Milestone 1 target, with accepted Phase 2.1
standalone additions documented below as they land. The first Phase 1 shell/env
schema slice has landed for ADRs 0016, 0017, and 0018, the base `Evidence`
entity has landed for ADR 0023, `ExecutionContext` is on the canonical list per
ADR 0021 invariant 17 (charter v1.3.0), `AgentClient` landed as Phase 2.1.1
per ADR 0037 / ADR 0038, and `VerificationCommandSpec` landed as Phase 2.1.2
per ADR 0036 / ADR 0038. The ADR 0019 knowledge and coordination subgraph
landed as Phase 2.1.3 per ADR 0038, and `QualityGate` landed as Phase 2.1.4
per ADR 0035 / ADR 0038. Phase 2.2.1 added `ExecutionContext` containment
cache fields, Phase 2.2.2 landed the canonical `OperationShape` schema with
ADR 0036 deletion-authority fields, and Phase 2.2.3 landed typed
`BoundaryObservation` payloads for the ADR 0036 / ADR 0037 boundary bundle.
Phase 2.3.1 landed the ADR 0034 direct Evidence subtype pair:
`GitIdentityBinding` and `ToolProvenance`. Phase 2.3.2 landed the ADR 0032
Q-005 runner/check evidence cohort and the typed `runner_isolation`
`BoundaryObservation` branch. Phase 2.3.3 landed the ADR 0027 / ADR 0030 /
ADR 0033 Q-006 source-control evidence cohort and the typed
`branch_protection` `BoundaryObservation` branch. Phase 2.3.4 landed the ADR
0037 Q-010 remote-agent evidence cohort. Phase 2.7 now opens with ADR 0043's
Q-013 credential-plane schema/evidence slice, ADR 0044's Q-014
project-substrate schema/evidence slice, and ADR 0045's Q-015 backup-readiness
schema/evidence slice.

Canonical research plan sketch: `~/Organizations/jefahnierocks/system-config/docs/host-capability-substrate-research-plan.md` §2 (Ontology) and §Appendix A.

## Entities

```
HostProfile          canonical host identity + stable facts
WorkspaceContext     project/workspace identity (workspace.toml-derived)
Principal            a human or automated actor with an identity
AgentClient          connected MCP/A2A/hook client with version + identity
Session              one agent-client connection with declared/measured context
ToolProvider         a source of tools: mise, brew, system, project-local
ToolInstallation     a specific instance of a tool on this host
ResolvedTool         the authoritative answer for "what tool X in this context"
Capability           a declared kernel operation (e.g., service.activate)
OperationShape       semantic operation proposal with target + mutation scope
CommandShape         argv vector + env (names + refs) + cwd + timeout — typed plan from OperationShape
VerificationCommandSpec producer-asserted workspace verify command spec
Evidence             a fact with provenance, freshness, authority, confidence
GitIdentityBinding   direct Evidence subtype for Git author/signing identity
ToolProvenance       direct Evidence subtype for tool path/shim/version facts
GitRepositoryObservation direct Evidence observation for repository identity
GitRemoteObservation direct Evidence observation for remote/ref state
GitWorktreeObservation direct Evidence observation for worktree state
GitWorktreeInventoryObservation direct Evidence observation for branch worktrees
GitBranchAncestryObservation direct/derived Evidence observation for merge proof
GitDirtyStateObservation direct Evidence observation for worktree dirty state
PullRequestReceipt   direct Evidence receipt for PR existence/state
PullRequestAbsenceReceipt direct Evidence receipt for positive PR absence
RulesetObservation   direct Evidence observation for GitHub rulesets
RepositoryIdentityReconciliationObservation direct Evidence observation for five-plane repo identity
MCPCredentialAudienceObservation direct Evidence observation for MCP credential audience
StatusCheckSourceObservation direct Evidence observation for check source identity
BranchProtectionObservation BoundaryObservation subtype for branch protection posture
RunnerHostObservation direct Evidence subtype for CI runner host identity/posture
RunnerIsolationObservation BoundaryObservation subtype for runner isolation posture
WorkflowRunReceipt   direct Evidence receipt for GitHub Actions workflow runs
CleanRoomSmokeReceipt direct Evidence receipt for hosted clean-room smoke runs
ResourceBudgetObservation direct Evidence observation feeding ResourceBudget
PolicyPlanReceipt    direct Evidence receipt for redacted OpenTofu/conftest plans
CredentialAuthorityObservation direct Evidence observation for credential-source authority posture
MachineIdentityBindingObservation direct Evidence observation for machine identity binding posture
ProjectSubstrateContractValidationReceipt direct Evidence receipt for project-substrate contract structure
ProjectSubstrateAdmissionObservation direct Evidence observation for project-substrate admission posture
ProjectTeardownPlanReceipt direct Evidence receipt for project-scoped teardown planning
ProjectTeardownCompletionReceipt direct Evidence receipt for project-scoped teardown completion
BackupReadinessObservation direct Evidence observation for backup storage-class readiness
RestoreDrillReceipt direct Evidence receipt for restore drill events
BackupCredentialCustodyObservation direct Evidence observation for backup credential custody
ProjectSubstrateBackupRequirementObservation direct Evidence observation for project backup requirements
ProjectAdmissionAuthorityObservation BoundaryObservation subtype for project admission authority posture
KnowledgeSource      canonical source indexed for retrieval, never gate authority
KnowledgeChunk       display-only chunk derived from a KnowledgeSource
CoordinationFact     promoted gateable assertion about cross-session state
DerivedSummary       derived narrative projection, gateable only after promotion
QualityGate          durable evidence-aggregated gate state
ExecutionContext     a named runtime surface and startup phase
PolicyRule           a tier/destructive-pattern/approval rule (YAML or Rego)
Decision             gateway output: allowed | requires_approval | denied
ApprovalGrant        scoped, expiring, replay-resistant authorization
Run                  one execution of an approved operation through the broker
Artifact             a run's structured output (diff, log chunks, exit code, signed summary)
Lease                exclusive or shared resource lock
Lock                 coarser mutex (e.g., "package-manager global")
SecretReference      op:// URI, never the value
ResourceBudget       per-session CPU/memory/network/sandbox-concurrency allocation
```

`EnvProvenance`, `CredentialSource`, and `StartupPhase` remain Phase 1
supplemental entities until Q-011-guided ontology review promotes them.

Each entity carries a `schema_version`. Entity schema versions are independent of adapter tool-name versions (MCP tool names follow `system.{namespace}.{verb}.v{N}` in adapter surfaces).

## Phase 2.1 Standalone Entities

### `AgentClient`

Source: `packages/schemas/src/entities/agent-client.ts`

Describes a connected agent client as a durable lifecycle entity. `AgentClient`
is a no-suffix Ring 0 entity per Q-011 bucket 2 and ADR 0037. It is the
authority target for agent product/build identity and capability-class
containment posture; runtime containment for a specific launch still composes
through `ExecutionContext` and future containment boundary evidence.

Identity grain is `(product_family, surface, app_build)`. A new `app_build`
mints a new `AgentClient`; `agent_client_id` does not mutate in place. Retired
records remain queryable for audit-chain reconstruction.

Key fields:

- `product_family` is a closed enum for the agent product family:
  `claude_code`, `codex`, `cursor`, `copilot`, `devin`, `windsurf`,
  `augment`, `amp`, `opencode`, `warp`, `vscode_native`, or `unknown`.
- `surface` reuses `ExecutionContext.surface`, including the Phase 2.1.1
  `remote_cloud_agent` extension.
- `app_build` and `dep_bundle_version` are opaque normalized build strings
  observed by the kernel.
- `permission_mode` records the product-specific permission posture as
  `default`, `yolo`, `approve_all`, `read_only`, or `unknown`. The producer may
  declare this field, but the kernel verifies it against observed config.
- `containment_mechanism` is capability-class evidence naming what the product
  can provide, not what a particular launch currently has.
- `agent_client_state` is `active` or `retired`.
- `kernel_observed_at`, `valid_until`, `audit_chain_link_hash`, and
  `evidence_refs` bind the record to observed runtime, freshness, audit-chain
  continuity, and provenance.

`AgentClient` does not add policy tiers, adapter behavior, broker behavior, or
runtime execution endpoints. Gate behavior such as narrower-wins composition
between product capability and runtime containment remains Ring 1 / policy work
queued by ADR 0037.

### `VerificationCommandSpec`

Source: `packages/schemas/src/entities/verification-command-spec.ts`

Describes the producer-asserted shape of a workspace verification command.
`VerificationCommandSpec` is a Ring 0 spec entity per ADR 0036 and ADR 0038
Phase 2.1.2. It records the command shape that the kernel can later verify and
re-run; it does not execute the command, record command output, or introduce a
new runtime endpoint. Per-execution verification results remain separate future
Evidence records.

Key fields:

- `verification_command_spec_id` is the stable local identifier for the spec.
- `workspace_context_id` binds the spec to the workspace context it verifies.
- `command_shape` remains a narrowed inline OperationShape-like payload for
  workspace verification. It carries `operation_class: "workspace_verify"`,
  `mutation_scope: "verify_workspace"`, a typed `argv` array, and `env_refs`
  entries that name environment variables without values.
- `command_shape.env_refs.env_capture_mode` is `name_only` or
  `existence_only`. Secret-shaped env var references in `argv` must have an
  explicit `env_refs` entry; raw env values are not representable.
- `expected_exit_codes` separates success codes from allowed failure codes.
- `output_evidence_kind` is `verification_receipt` or `diagnostic_report`.
- `verification_command_spec_state` is `active`, `deprecated`, or `retired`.
- `author_session_id` and `author_agent_client_id` are kernel-set at mint per
  ADR 0036; producers cannot self-attribute verifier identity.
- `kernel_observed_at`, `valid_until`, and `evidence_refs` bind the spec to
  observed runtime, freshness, and provenance.

Phase 2.1.2 also widens `Evidence.subject_kind` with
`verification_command_spec`, bumping the Evidence schema to `0.2.0`.
`BoundaryObservation.evidence_schema_version` is now an independent non-empty
version string so envelopes can cite the Evidence base contract they compose
against rather than inheriting the generic new-entity `0.1.0` literal.

`VerificationCommandSpec` does not add policy tiers, canonical policy YAML,
adapter behavior, broker behavior, command execution, or the Phase 2.2.2
cleanup operation runtime. The canonical `OperationShape` schema now carries
the ADR 0036 `deletion_authority_source_ref` extension separately.

### `KnowledgeSource`

Source: `packages/schemas/src/entities/knowledge-source.ts`

Registers a canonical source for the retrieval index. `KnowledgeSource` is a
Ring 0 no-suffix peer entity from ADR 0019 and ADR 0038 Phase 2.1.3. It names
what was indexed and the source-content hash observed by the kernel; it is not
a policy rule, live source of truth, or gate authority by itself.

Key fields:

- `knowledge_source_id` is the stable local identifier.
- `schema_version` is currently `0.2.0`; ADR 0045 bumped it because
  `source_kind: "threat_model"` widens the existing `KnowledgeSource` enum
  contract.
- `uri` is the canonical location string for the source.
- `content_hash` is a `sha256:` digest of the source content at index time.
- `source_kind` is one of `charter`, `adr`, `decision_ledger`, `runbook`,
  `vendor_doc`, `audit_summary`, `schema`, `code`, `audit_profile_yaml`,
  `cycle_history`, `project_substrate_contract`, or `threat_model`.
- `security_label` is `public`, `internal`, `confidential`,
  `secret_pointer`, or `secret_referenced`. `secret_pointer` covers
  reference-form pointers such as `op://...`; resolved secret material remains
  forbidden.
- `indexable`, `indexed_at`, `execution_context_id`, `target_refs`, and
  `evidence_refs` bind the source to index state, context, and provenance.

The Q-014 `project_substrate_contract` source kind composes with ADR 0036's
Layer 2 source model. Contract chunks remain display-only retrieval artifacts;
gate-consumed project admission facts come from typed validation receipts and
observations that cite the source content hash.

The Q-015 `threat_model` source kind is also Layer 2 source material.
Project-specific accepted-risk content stays in the owning repo or private
source; HCS public schemas and fixtures cite the source by reference and do
not inline accepted-risk lists.

### `KnowledgeChunk`

Source: `packages/schemas/src/entities/knowledge-chunk.ts`

Represents a display-only chunk derived from a `KnowledgeSource`.
`KnowledgeChunk` records are retrieval/index artifacts. They do not carry
`allowed_for_gate`, and consumer code must not convert chunk content into
gate-consumed typed records.

Key fields:

- `knowledge_chunk_id` is the stable local identifier.
- `knowledge_source_id` links the chunk to its source.
- `source_content_hash` binds the chunk to the source version it was derived
  from.
- `chunk_index`, `text_hash`, `heading_path`, `token_count`, `chunk_kind`, and
  `metadata` describe the derived chunk.
- `embedding_ref` is a local reference only. When `security_label` is
  `secret_referenced`, `embedding_ref` must be `null`.
- `security_label`, `execution_context_id`, `target_refs`, and `evidence_refs`
  carry the source label, context binding, and provenance.

### `CoordinationFact`

Source: `packages/schemas/src/entities/coordination-fact.ts`

Represents a typed assertion about cross-session, cross-workspace, or
cross-surface state. A `CoordinationFact` starts unpromoted and becomes
gate-eligible only when the kernel-set promotion fields show
`allowed_for_gate: true`, `promoted_at`, and `promotion_grant_id`.

Key fields:

- `subject_kind` selects the subject domain: `release`, `branch`, `worktree`,
  `ruleset`, `credential_audience`, `deployment`, `external_target`,
  `workspace_context`, or `audit_profile_snapshot`.
- `subject_ref` is validated against `subject_kind`; for example `worktree`
  requires `{repository_id, worktree_path}`, `workspace_context` requires
  `{workspace_context_id}`, and `audit_profile_snapshot` requires
  `{workspace_context_id, audit_profile_revision_date}`.
- `predicate_kind` is the ontology-controlled assertion vocabulary, including
  ADR 0019 values (`blocked_until`, `depends_on`, `gate_token`, `phase_lock`,
  `release_phase`, `scope_assertion`), ADR 0031 values (`leased_to`,
  `attached_to`, `held_by`), and ADR 0036 values (`claimed_to_contain`,
  `confirmed_to_contain`, `claim_superseded_by_snapshot`).
- `object_kind` is `status_block`, `dependency`, `gate_token`, or
  `scoped_assertion`; `object` carries the structured payload selected by that
  kind. ADR 0031 worktree ownership facts use `predicate_kind: "leased_to"`,
  `object_kind: "scoped_assertion"`, and object `{session_id, lease_id,
  valid_until, lease_acquired_at}`.
- `evidence_refs`, `authority`, `confidence`, `valid_until`,
  `execution_context_id`, and `target_refs` bind the fact to evidence,
  freshness, authority, and context.
- Promoted `workspace_context` and `audit_profile_snapshot` facts require at
  least one `host-observation` evidence reference. Sandbox-observation facts
  cannot be promoted for gate use.

### `DerivedSummary`

Source: `packages/schemas/src/entities/derived-summary.ts`

Represents a derived narrative projection over multiple sources. It is always
`authority: "derived"` and `confidence: "best-effort"`. Like
`CoordinationFact`, it starts with `allowed_for_gate: false`; promotion is a
separate typed workflow.

Key fields:

- `derived_summary_id` is the stable local identifier.
- `derived_from` lists kind-tagged source references used by the summary.
  `source_record_kind` is closed to `evidence`, `coordination_fact`,
  `derived_summary`, or `knowledge_chunk`.
- `generated_by`, `generated_at`, `summary_kind`, and `summary_text` describe
  the projection. `summary_kind` includes ADR 0019 values plus ADR 0047
  `cleanup_plan` (the audit-chain entry produced by `system.cleanup.plan.v1`).
- `allowed_for_gate`, `promoted_at`, and `promotion_grant_id` are kernel-set
  promotion fields.
- `execution_context_id` and `target_refs` bind the summary to context.

Promoted summaries cannot cite sandbox-observation authority or
`KnowledgeChunk` records in `derived_from`; this encodes the ADR 0019
promotion-laundering guard at the schema layer.

When `summary_kind: cleanup_plan`, `summary_text` carries a typed
hint-resolution status from the closed-enum vocabulary
`hint_resolved | hint_ignored_stale | hint_ignored_workspace_mismatch | hint_unresolvable | no_hint_provided`
per ADR 0047. The schema layer enforces the closed-enum membership via Zod
refinement; for all other `summary_kind` values, `summary_text` remains
free-form display prose.

### `QualityGate`

Source: `packages/schemas/src/entities/quality-gate.ts`

Represents a durable evidence-aggregated gate state. `QualityGate` is a Ring 0
no-suffix peer entity from ADR 0035 and ADR 0038 Phase 2.1.4. It is an
aggregation/identity layer over typed evidence and matrix checks; it does not
introduce policy thresholds, runtime probes, canonical policy YAML, dashboard
behavior, adapter behavior, or approval-grant scope schema.

Key fields:

- `gate_id` is the stable local identifier.
- `gate_kind` is one of `identity_binding`, `credential_shadow`,
  `signing_identity`, `filesystem_trust`, `tool_provenance`, or
  `mutation_class`.
- `target_subject_ref` is validated against `gate_kind`; for example
  `credential_shadow` requires `{credential_source_id}`, `tool_provenance`
  requires `{tool_or_provider_ref}`, and `mutation_class` requires
  `{operation_class}` where `operation_class` is one of the six ADR 0029
  operation classes.
- `gate_state` is `provisional`, `proven`, `expired`, or `denied`.
- `evidence_refs` carries the supporting evidence references plus a typed
  `evidence_chain_refs` preview for invariant checks. Direct `KnowledgeChunk`
  and `DerivedSummary` entity IDs are rejected; chain previews that touch
  `KnowledgeChunk`, sandbox-observation authority, or unpromoted
  `CoordinationFact` / `DerivedSummary` records cannot support `proven` or
  `expired` gates. Every chain preview node carries an `authority` value so
  transitive sandbox authority cannot be hidden by omission.
- `valid_until`, `provisional_at`, `proven_at`, `expired_at`, and `denied_at`
  encode the current lifecycle state. `proven` and `expired` gates require
  `valid_until`; timestamp combinations must match `gate_state`.
- `execution_context_id` binds the gate to its context.

Per-gate-kind composition rules, duplicate-target checks, re-mint
evidence-rotation materiality, `gate_evidence_acknowledgment`, and
Decision-transition audit event shapes remain Ring 1 / canonical-policy work
queued by ADR 0035.

## Phase 2.2 Base Shape Extensions

### `OperationShape`

Source: `packages/schemas/src/entities/operation-shape.ts`

Describes a semantic operation proposal before any command rendering. It is the
Ring 0 upstream shape for `CommandShape`: shells, argv renderers, adapters, and
hooks must consume typed operation intent rather than treating shell strings as
the primary object. Phase 2.2.2 lands the narrow canonical schema plus ADR 0036
deletion-authority fields. It does not add a gateway, renderer, cleanup
operation, approval-grant schema, policy YAML, adapter behavior, hook behavior,
or runtime execution endpoint.

Key fields:

- `operation_shape_id` is the stable local identifier for the proposed
  operation shape.
- `operation_class` is one of the six ADR 0029 classes
  (`read_only_diagnostic`, `agent_internal_state`, `destructive_git`,
  `external_control_plane_mutation`, `worktree_mutation`, `merge_or_push`) plus
  ADR 0036 `workspace_verify` and ADR 0047 `cleanup_plan`.
- `mutation_scope` is paired with `operation_class`; `read_only_diagnostic`
  and `cleanup_plan` use `none` (both are Ring 1 read-only operations producing
  typed records without executing mutations), `workspace_verify` uses
  `verify_workspace`, and the mutation classes use their class-level mutation
  scopes until future capability schemas introduce narrower per-operation
  scopes.
- `execution_context_id` is required by charter invariant 17.
- `target_ref` is a typed `{target_kind, target_id}` reference. It records the
  primary target without embedding shell arguments or resolved secret material.
  `target_kind: "unknown"` is valid only for read-only diagnostics; mutating
  operations require a resolved target kind. The initial schema also applies
  class-specific target narrowing: `agent_internal_state` targets an
  `execution_context`, `external_control_plane_mutation` targets a
  `provider_object` or `external_control_plane`, `destructive_git` and
  `merge_or_push` target a `repository`, `worktree_mutation` targets a
  `worktree`, and `workspace_verify` targets a `workspace`.
- `deletion_authority_kind` and `deletion_authority_source_ref` are required
  nullable fields. Set both to `null` when no deletion authority applies; when
  deletion authority applies, both must be non-null and structurally matched.
  `gitignore` is not a valid authority kind.
- `deletion_authority_kind` values are
  `filesystem_protected_paths_observation`, `coordination_fact`,
  `human_dashboard_grant`, and `runtime_state_classification`. Each kind has a
  matching typed source-ref shape: `boundary_observation_id`,
  `coordination_fact_id`, `approval_grant_id`, or `evidence_id`.
- Read-only diagnostics and workspace verification operations cannot carry
  deletion authority.
- `evidence_refs` is required to bind the shape to its provenance.

The schema structurally validates operation/mutation pairing, resolved-target
requirements for mutating operations, and deletion discriminator/ref
consistency. Layer 1 mint-time validation remains responsible for resolving
polymorphic refs and enforcing ADR 0036 grounding rules, including the
requirement that `coordination_fact` deletion authority cite host-observation
grounding.

## Phase 1 Shell/Env Entities

The first committed Zod schemas are additive Ring 0 entities that make shell
and credential boundary claims explicit. They do not add kernel policy,
adapter behavior, hooks, or execution endpoints.

Generated JSON Schema lives in `packages/schemas/generated/` and is checked by
`just generate-schemas --check`.

### `ExecutionContext`

Source: `packages/schemas/src/entities/execution-context.ts`

Describes a named runtime surface and startup phase. Initial `surface` values
include `codex_cli`, `codex_app_sandboxed`, `codex_ide_ext`,
`claude_code_cli`, `claude_desktop`, `claude_code_ide_ext`,
`zed_external_agent`, `warp_terminal`, `mcp_server`, `setup_script`, and
`app_integrated_terminal`; Phase 2.1.1 adds `remote_cloud_agent` and bumps the
entity schema to `0.2.0`.

Key fields:

- `surface`, `kind`, and `phase` identify the context being described.
- `shell` records carrier, shell path, argv flags, startup files, and marker
  visibility for that phase.
- `latest_containment_evidence_ref` is a kernel-set pointer to the latest
  accepted `containment_class` `BoundaryObservation` for the same
  `execution_context_id`. At Phase 2.2.1 this is structurally an
  `evidenceRefSchema` reference; full payload-shape validation lands with the
  Phase 2.2.3 containment payload bundle.
- `kernel_sandbox_kind` is a kernel-set cache of the kernel-sandbox class
  resolved from `latest_containment_evidence_ref`. It is only a
  kernel-sandbox shortcut: consumers that need container, VM, remote-cloud, IDE,
  or terminal containment semantics must dereference the boundary observation.
- `sandbox` is retained as a read-only legacy projection of coarse filesystem,
  network, and Keychain capability status as `observed_allowed`,
  `observed_denied`, `pending`, `unknown`, or `not_applicable`.
- `env_inheritance` records whether terminal shell inheritance was observed or
  rejected for that surface.
- `evidence_refs` is required; CLI evidence must not satisfy GUI app or IDE
  claims unless the evidence names that exact surface.

### `EnvProvenance`

Source: `packages/schemas/src/entities/env-provenance.ts`

Records why an environment variable name is present, absent, classified, or
hashed for a specific `ExecutionContext`. It adopts the devcontainer timing
classes `baked`, `runtime_applied`, and `probed`, plus Codex operator-policy
terms such as `inherit`, `include_only`, `exclude`, `set`, `overrides`, and
`ignore_default_excludes`.

The schema intentionally has no raw `value` field. Acceptable observation
modes are `name_only`, `existence_only`, `classified`, `hash_only`, `absent`,
and `not_observed`.

### `CredentialSource`

Source: `packages/schemas/src/entities/credential-source.ts`

Describes durable credential authority without exposing credential material.
Initial `source_type` values include `macos_keychain`, `codex_home_file`,
`claude_credentials_file`, `oauth_device_flow`, `subscription_oauth`,
`api_key_env`, `api_key_helper`, `onepassword`, `infisical`, `vault`,
`devenv_secretspec`, `long_lived_setup_token`, `service_account`, and
`brokered_secret_reference`.

Phase 2.1.1 bumps the entity schema to `0.2.0` because `owning_surface` shares
the `ExecutionContext.surface` enum and now accepts `remote_cloud_agent`.

Key fields:

- `storage_plane`, `durability`, `scope`, `rotation`, and `health` capture the
  operational posture of the source.
- `secret_ref` is an opaque reference only, such as an `op://` or `hcs://`
  reference. It is not secret material.
- `env_var_name` may describe a compatibility rendering, but shell env is not
  the durable source unless evidence says so for that surface.

### `StartupPhase`

Source: `packages/schemas/src/entities/startup-phase.ts`

Defines the 14-phase temporal ordering from ADR 0016:

1. `boot`
2. `launchd_user_session`
3. `gui_app_exec`
4. `terminal_emulator_launch`
5. `shell_login_init`
6. `shell_interactive_init`
7. `direnv_chpwd`
8. `mise_activate`
9. `agent_launch`
10. `agent_env_policy_apply`
11. `agent_session_hook`
12. `mcp_server_init`
13. `subagent_spawn`
14. `tool_call_subprocess`

The Zod schema validates that `order` matches the named phase. This protects
P03/P04/P09 reasoning from treating setup scripts, MCP startup, and tool-call
subprocesses as interchangeable timing points.

## Phase 1 Evidence Base

### `Evidence`

Source: `packages/schemas/src/entities/evidence.ts`

Defines the canonical Ring 0 fact base entity from ADR 0023. Evidence records
are freshness-bound facts, receipts, fixtures, derived facts, or human-decision
records with shared provenance fields.

Key fields:

- `evidence_kind` distinguishes `observation`, `receipt`, `derived`,
  `human_decision`, and `fixture`.
- `subject_refs` names what the evidence is about. Each reference has a
  `subject_kind`, `subject_id`, and optional relation.
- `source`, `source_ref`, `observed_at`, `valid_until`, `authority`,
  `confidence`, and `parser_version` form the shared provenance and freshness
  contract.
- `host_id`, `workspace_id`, `execution_context_id`, `session_id`, and
  `run_id` bind evidence to the surfaces that produced or scoped it.
- `payload_schema_version`, `payload`, and `redaction_mode` carry optional
  JSON-compatible payload data after redaction, classification, hashing, or
  reference-only handling.

Sandbox observations are deliberately constrained. If `authority` is
`sandbox-observation`, the record must name `execution_context_id` and include
at least one trace reference: `session_id`, `run_id`, or `source_ref`. Sandbox
evidence remains sandbox-authority evidence; a stronger fact requires a
separate non-sandbox evidence record.

Phase 2.1.3 widens `Evidence.subject_kind` with `knowledge_source`,
`knowledge_chunk`, `coordination_fact`, and `derived_summary`, bumping the
Evidence schema to `0.3.0`.

Phase 2.1.4 widens `Evidence.subject_kind` with `quality_gate`, bumping the
Evidence schema to `0.4.0`.

Phase 2.3.1 widens `Evidence.subject_kind` with `git_identity_binding` and
`tool_provenance`, bumping the Evidence schema to `0.5.0`.

Phase 2.3.2 widens `Evidence.subject_kind` with `runner_host`,
`runner_isolation`, `workflow_run`, `clean_room_smoke`, and `policy_plan`,
and reuses the existing `resource_budget` subject kind for
`ResourceBudgetObservation`, bumping the Evidence schema to `0.6.0`.

Phase 2.3.3 widens `Evidence.subject_kind` with Q-006 source-control subjects:
`ruleset`, `repository_identity_reconciliation`, `mcp_credential_audience`,
`status_check_source`, `git_worktree`, `git_worktree_inventory`,
`git_branch_ancestry`, `git_dirty_state`, `pull_request`, and
`pull_request_absence`; it reuses `git_repository` and `git_ref`, bumping the
Evidence schema to `0.7.0`.

Phase 2.3.4 widens `Evidence.subject_kind` with Q-010 remote-agent subjects:
`remote_agent_base_image`, `remote_agent_setup`, and
`remote_agent_network_posture`, bumping the Evidence schema to `0.8.0`.

Phase 2.7 widens `Evidence.subject_kind` with Q-013 `machine_identity` for
`MachineIdentityBindingObservation`; `CredentialAuthorityObservation` reuses
the existing `credential_source` subject kind. This bumps the Evidence schema
to `0.9.0`.

ADR 0044 Q-014 project-substrate records reuse existing `workspace` and
`knowledge_source` subject kinds, so they do not bump the base `Evidence`
schema. Their record-specific schemas carry typed `payload_schema_version`
values and Zod target-binding refinements.

The `evidenceAuthoritySchema` enum extension closing ADR 0039
§Forward-looking observations #5 adds `self-asserted` as the lowest authority
class — producer claims with no observation behind them — bumping the
Evidence schema to `0.10.0`. Charter v1.4.0 inv. 18 chain-walk rejection now
references a schema-operational authority class; the chain-walk rejection
itself remains a posture commitment until the typed-grant minting layer
lands. See ontology-registry §`self-asserted` authority class for the trust
ordering.

ADR 0047 cleanup-plan composition lands its first schema slice as additive
enum widenings (no entity schema-version bumps). `OperationShape` adds the
`cleanup_plan` operation_class with a `mutation_scope: "none"` discriminated
branch and `target_kind: "workspace"` narrowing, mirroring the
`workspace_verify` precedent. `DerivedSummary` adds the `cleanup_plan`
summary_kind with a Zod refinement constraining `summary_text` to the closed
hint-status vocabulary
(`hint_resolved | hint_ignored_stale | hint_ignored_workspace_mismatch | hint_unresolvable | no_hint_provided`).
`QualityGate.target_subject_ref.operation_class` is reconciled with
`operationShapeOperationClassSchema` (adds both `workspace_verify` — closing
the pre-existing ADR 0036 reconciliation gap — and `cleanup_plan`). New
`Decision.reason_kind` reservations (`cleanup_plan_authority_source_stale`,
`cleanup_plan_target_under_active_lease`) and the `cleanup_scope` enum
(`audit_profile_claim_supersession | worktree_lease_completed`) remain
registry-canonical pending the Ring 1 mint API schema PR; they are not yet
Zod-source-defined. Canonical policy YAML for `cleanup_plan` lives in
`system-config/policies/host-capability-substrate/` at Milestone 2 per
ADR 0036 reservation.

The legacy `evidenceRefSchema` remains as a lightweight reference or embedded
provenance preview for entities that have not yet been migrated to full
Evidence records. It is not a competing fact model.

## Phase 2.3 Direct Evidence Subtypes

### `GitIdentityBinding`

Source: `packages/schemas/src/entities/git-identity-binding.ts`

Implements the ADR 0034 direct Evidence subtype for Git identity binding.
`GitIdentityBinding` is not a `BoundaryObservation` payload. It is an
`Evidence`-shape record with `evidence_kind: observation`,
`subject_kind: git_identity_binding`, and a typed payload.

Key fields:

- `workspace_id` and payload `surface_id` bind the observation to the
  workspace and surface where Git config was resolved.
- `git_user_name` and `git_user_email` are observed Git config values and are
  scrubber-eligible identity fields.
- `git_signing_format_kind` is `openpgp`, `x509`, `ssh`, or `none`.
- Signed bindings require `git_signing_key_id` as a typed `CredentialSource`
  FK (`cred:*` or `credential-source:*`) plus
  `credential_source_evidence_ref`; unsigned bindings set both fields to
  `null`.
- `provider_observed_via` is `git_config_read`, `ssh_config_resolution`, or
  `1password_op_cli_introspection`; `provider_verified_at` is the freshness
  anchor.
- `redaction_mode` is required and cannot be `none`, preserving ADR 0034's
  subtype-level redaction floor.

This schema records identity evidence only. Cross-surface rejection, freshness
re-check, sandbox-promotion rejection, and operation gating remain Ring 1 /
policy responsibilities.

### `ToolProvenance`

Source: `packages/schemas/src/entities/tool-provenance.ts`

Implements the ADR 0034 direct Evidence subtype for tool provenance.
`ToolProvenance` is not a `BoundaryObservation` payload. It is an
`Evidence`-shape record with `evidence_kind: observation`,
`subject_kind: tool_provenance`, and a typed payload.

Key fields:

- `tool_or_provider_ref` and `execution_context_id` define the grain.
- `installed_path` and every `shim_chain` path must be canonicalized into
  recognized placeholder roots with a path segment (`${HOME}`, `${TMPDIR}`,
  `${XDG_CACHE_HOME}`, `${XDG_DATA_HOME}`, `${XDG_CONFIG_HOME}`,
  `${USERS_SHARED}`) or accepted system roots (`/usr/local`, `/opt`,
  `/Library/Frameworks`).
- `shim_chain` records `{shim_path, target_path}` hops; `shim_depth` must equal
  `shim_chain.length`.
- `install_source_kind` is `homebrew`, `mise`, `asdf`, `npm`, `pip`, `uv`,
  `system_package_manager`, `manual`, or `unknown`.
- `version_drift_kind` is `matches_lockfile`, `ahead_of_lockfile`,
  `behind_lockfile`, `no_lockfile`, or `unknown`.
- `provider_observed_via` is `which_command`, `shim_introspection`, or
  `package_manager_query`; `provider_verified_at` is the freshness anchor.

This schema records typed provenance facts only. It does not execute tools,
query package managers, mutate PATH, or create gate authority by itself.
Sandbox-authority records preserve the base `Evidence` trace rule and remain
non-promotable until Ring 1 / policy re-checks supply host-authoritative
evidence.

## Phase 2.3 Q-005 Runner/Check Evidence

ADR 0032 lands the Q-005 runner/check evidence model as schemas only. These
records observe runner/check facts and plan outcomes; they do not register
runners, mutate GitHub runner groups, provision infrastructure, dispatch
workflows, author Citadel OPA, or make HCS a CI control plane.

### `RunnerHostObservation`

Source: `packages/schemas/src/entities/runner-host-observation.ts`

Direct `Evidence` observation with `subject_kind: runner_host`. The payload
records `runner_host_id`, Citadel-signaled `registration_epoch`,
`substrate_kind`, `os`, `arch`, scrubber-eligible `labels`,
`repo_access_kind`, `last_seen_at`, and optional
`tool_provenance_evidence_refs`. The schema requires `subject_refs` to include
the payload `runner_host_id` and preserves the sandbox-observation trace rule.

### `RunnerIsolationObservation`

Source: `packages/schemas/src/entities/boundary-observation.ts`

Typed `BoundaryObservation` branch with `boundary_dimension:
runner_isolation`. The payload is flat, not a top-level discriminator:
`job_environment_kind`, `workspace_cleanup_kind`,
`docker_socket_exposure_kind`, `network_egress_kind`, and
`host_filesystem_access` are independent posture fields. This branch bumps
`BoundaryObservation.schema_version` to `0.3.0`.

### `WorkflowRunReceipt`

Source: `packages/schemas/src/entities/workflow-run-receipt.ts`

Direct `Evidence` receipt with `subject_kind: workflow_run`. The payload
records `repository_id`, `workflow_run_id`, full `commit_sha`, `actor_login`,
scrubber-eligible `workflow_path`, `conclusion_kind`, `started_at`,
`completed_at`, and nullable `runner_host_evidence_ref`. Timestamp order is
structurally checked. Linked runner-host evidence remains subject to Ring 1 /
gateway authority re-check before gate consumption.

### `CleanRoomSmokeReceipt`

Source: `packages/schemas/src/entities/clean-room-smoke-receipt.ts`

Direct `Evidence` receipt with `subject_kind: clean_room_smoke`. The payload
records the hosted workflow run, invoked script reference, dependency-install
outcome, `artifact_hash`, timestamps, and `runner_isolation_evidence_ref`.
This is a receipt, not a proof composite; promotion to proof is a future ADR if
a mutation gate consumes it as authority.

### `ResourceBudgetObservation`

Source: `packages/schemas/src/entities/resource-budget-observation.ts`

Direct `Evidence` observation using the existing `subject_kind:
resource_budget`. The payload records `runner_host_id`, an observation window,
CPU/memory/disk pressure percentages, active job count, and cache size. It
feeds the durable `ResourceBudget` entity rather than duplicating it as a
runner-specific standalone entity.

### `PolicyPlanReceipt`

Source: `packages/schemas/src/entities/policy-plan-receipt.ts`

Direct `Evidence` receipt with `subject_kind: policy_plan`. The payload names
the IaC `repository_id`, `opentofu_plan_hash` computed over redacted plan
output, `conftest_outcome_kind`, scrubber-eligible `policy_ids`,
`workspace_id_ref`, provider versions, and required
`tool_provenance_evidence_refs`. `redaction_mode` is required and cannot be
`none`; raw plan content is rejected by the strict payload shape.

## Phase 2.3 Q-006 Source-Control Evidence

ADR 0027, ADR 0030, and ADR 0033 land the Q-006 source-control evidence model
as schemas only. These records observe Git/GitHub/source-control facts; they
do not mutate repositories, edit GitHub rulesets, register hooks, provision
GitHub Apps, or create operation authority by themselves.

### `GitRepositoryObservation`

Source: `packages/schemas/src/entities/source-control-evidence.ts`

Direct `Evidence` observation with `subject_kind: git_repository`. The payload
records first-commit-SHA-rooted `repository_id`, canonicalized `git_dir_path`,
optional canonicalized `work_tree_path`, optional `default_branch`, remote
observation evidence refs, and `detected_at`. Raw user-home paths are rejected;
paths must be placeholder-root or accepted non-user system-root forms.

### `GitRemoteObservation`

Direct `Evidence` observation with `subject_kind: git_ref`. The payload is
per-(repository, remote, ref), records credential-stripped `remote_url`,
`ref_kind`, `ref_name`, `last_fetch_at`, `last_fetch_outcome`, and `ref_state`.
`observed_commit_sha` is present only when `ref_state` is `present`; stale or
ambiguous gateway behavior remains Ring 1 / policy work.

### `BranchProtectionObservation`

Source: `packages/schemas/src/entities/boundary-observation.ts`

Typed `BoundaryObservation` branch with `boundary_dimension:
branch_protection`. The payload records classic protection / ruleset posture,
required checks/reviews, push/delete/force-push restrictions, bypass count,
linear-history posture, and `last_observed_at`. This branch bumps
`BoundaryObservation.schema_version` to `0.4.0`.

### `GitWorktreeObservation`

Direct `Evidence` observation with `subject_kind: git_worktree`. The payload
records canonical `worktree_path`, `worktree_kind`, nullable
`attached_branch_ref`, `head_commit_sha`, `lock_state`, and optional
lease/session freshness fields. Q-008(d) owns later composition with durable
worktree ownership.

### `GitWorktreeInventoryObservation`

Direct `Evidence` observation with `subject_kind: git_worktree_inventory`. The
payload records per-(repository, branch_ref) worktree evidence refs and an
`inventory_completeness_kind` discriminator. `partial_with_reason` requires a
typed reason string; positive zero-worktree inventories are represented by an
empty `worktree_observations` array with `complete`.

### `GitBranchAncestryObservation`

Direct or derived `Evidence` observation with `subject_kind:
git_branch_ancestry`. The payload uses `ancestry_kind` to select exactly one
proof sibling: `ancestry_evidence`, `patch_equivalence_evidence`, or
`empty_branch_evidence`.

### `GitDirtyStateObservation`

Direct `Evidence` observation with `subject_kind: git_dirty_state`. The
payload is per-worktree and records canonical `worktree_path`,
`dirty_state_kind`, path counts, and `observed_via: git_status_porcelain`.
The strict schema enforces the count invariants for clean, untracked,
uncommitted, and ignored-only states.

### `PullRequestReceipt`

Direct `Evidence` receipt with `subject_kind: pull_request`. The payload
records GitHub provider state for `open`, `merged`, or `closed_unmerged` PRs.
`merge_commit_sha` is required only for merged PRs and
`closed_unmerged_reason_kind` is required only for closed-unmerged PRs. PR
titles, bodies, descriptions, reviews, and comments are intentionally outside
the payload schema.

### `PullRequestAbsenceReceipt`

Direct `Evidence` receipt with `subject_kind: pull_request_absence`. This is
the positive absence receipt for "no PR exists" for a head/base ref pair. It
records `absence_observed_at` and `query_observed_via`; missing PR evidence is
not itself authority.

### `RulesetObservation`

Direct `Evidence` observation with `subject_kind: ruleset`. The payload
records GitHub ruleset id/kind, target pattern, enforcement kind, structured
rule axes, bypass actor count, and provider observation method. It coexists
with `BranchProtectionObservation`; consuming logic unions restriction axes
rather than picking one envelope as more authoritative.

### `RepositoryIdentityReconciliationObservation`

Direct `Evidence` observation with `subject_kind:
repository_identity_reconciliation`. The payload records the five-plane
identity check: canonical local path, canonical remote URL, nullable SSH alias,
signing-principal evidence ref, credential account identity, provider
observation method, and a verdict discriminator. Plane disagreements are a
closed enum; operation-time re-checks remain Ring 1 / gateway work.

### `MCPCredentialAudienceObservation`

Direct `Evidence` observation with `subject_kind: mcp_credential_audience`.
The payload records `mcp_server_kind: github_mcp`,
`credential_audience_kind`, closed credential scope tokens,
`credential_source_evidence_ref`, `provider_verified_at`, and
`query_observed_via`. Free-form credential scope text is rejected to avoid
secret-bearing paste vectors.

### `StatusCheckSourceObservation`

Direct `Evidence` observation with `subject_kind: status_check_source`. The
payload binds repository, commit, check name, expected GitHub App or workflow
path, conclusion, source kind, provider verification time, and a required
freshness window. `Evidence.valid_until` must match payload `valid_until`, and
the Phase 1 schema caps that window at 24 hours past `concluded_at`.

### `GitHubMutationAuthority`

Inline value type, not a standalone entity. It distinguishes `human_pat`,
`github_app`, `oidc`, `actions_token`, and `unknown` authority sources for
future operation-shape / `ApprovalGrant.scope` consumers. The schema records
authority shape only; canonical mutation policy and GitHub credential
provisioning remain out of scope. The generated JSON Schema set includes this
as a reusable value-type schema even though it is not a Ring 0 lifecycle entity.

## Phase 2.3 Q-010 Remote-Agent Evidence

ADR 0037 lands the Q-010 remote-agent evidence model as schemas only. These
records observe remote cloud-agent environment facts; they do not execute
remote agents, trust cloud test results by themselves, mutate vendor control
planes, grant host authority, or define per-product adapter schemas.

All three Q-010 remote-agent records require `authority: derived`, non-null
`valid_until`, `execution_context_id`, `agent_client_id` in the payload, and a
`containment_boundary_evidence_ref` pointing at the corresponding
`containment_class` boundary evidence. Remote-agent-produced evidence remains
external-control-plane evidence; stronger authority requires a linked evidence
chain through host-observation evidence at Ring 1 / policy consumption time.

### `RemoteAgentBaseImageObservation`

Source: `packages/schemas/src/entities/remote-agent-evidence.ts`

Direct `Evidence` observation with `subject_kind: remote_agent_base_image`.
The payload records `base_image_id`, `agent_client_id`,
`execution_context_id`, `containment_boundary_evidence_ref`,
`base_image_kind`, `base_image_digest`, `base_image_provenance`,
`image_published_at`, and `vendor_observed_via_evidence_ref`. Checkout commit
identity is intentionally outside the payload; it composes through
source-control evidence such as `GitRepositoryObservation` to avoid duplicate
commit facts.

### `RemoteAgentSetupReceipt`

Direct `Evidence` receipt with `subject_kind: remote_agent_setup`. The payload
records `setup_execution_id`, `agent_client_id`, `execution_context_id`,
`containment_boundary_evidence_ref`, `setup_script_evidence_ref`,
`setup_exit_code`, `setup_observed_at`, `secret_injection_kind`,
`setup_duration_ms`, and `setup_log_evidence_ref`. Setup logs are referenced as
separate evidence, not embedded inline. `secret_injection_kind` uses
`none_required` for the requirement-state absence case; bare `none` is not a
valid value for that field.

### `RemoteAgentNetworkPostureObservation`

Direct `Evidence` observation with `subject_kind:
remote_agent_network_posture`. The payload records `network_posture_id`,
`agent_client_id`, `execution_context_id`,
`containment_boundary_evidence_ref`, `egress_kind`, `firewall_kind`,
`egress_observed_via_evidence_ref`, and `network_posture_observed_at`.
Non-PR-mediated remote-agent gate consumption still requires Ring 1 / policy to
derive the `(execution_context_id, observed_at window)` binding across all
three Q-010 records; this schema does not add the future
`RemoteAgentInvocationReceipt` aggregator.

## Phase 2.7 Credential-Plane Evidence

ADR 0043 opens the first Q-013 implementation slice as schema/evidence work
only. The slice adds two direct `Evidence` observations and no policy,
broker/runtime, provider mutation, reconciler, credential issuance, operation
registration, or canonical policy YAML behavior. Both records require non-null
`valid_until`, explicit `redaction_mode`, typed target references, and
reference-only credential or identity fields.

The generated JSON Schemas are structural projections. Zod schema refinements
and the future Ring 1 mint API enforce cross-field binding, including
subject-ref-to-payload matching and `execution_context_id` consistency. A
generated-schema-only pass is not sufficient gate evidence for Q-013 or Q-014.

### `CredentialAuthorityObservation`

Source: `packages/schemas/src/entities/credential-plane-evidence.ts`

Direct `Evidence` observation with `subject_kind: credential_source`. The
payload records `credential_source_id`, `credential_source_type`,
`credential_storage_plane`, `authority_surface_kind`, `authority_surface_ref`,
scope/audience posture, expiry/rotation posture, credential health posture,
auditability posture, optional `credential_source_evidence_ref`, and
`boundary_evidence_refs`. The subject refs must include the observed
`credential_source_id`.

This record verifies credential-source authority posture without resolving
credential material. Provider labels and source types are evidence inputs, not
gate authority by themselves.

### `MachineIdentityBindingObservation`

Source: `packages/schemas/src/entities/credential-plane-evidence.ts`

Direct `Evidence` observation with `subject_kind: machine_identity` plus a
second `subject_kind: credential_source` reference. The payload records the
kind-tagged `machine_identity_kind` / `machine_identity_ref` pair,
`credential_source_id`, authority-surface reference, issuer/audience posture,
expiry/rotation posture, binding status, `execution_context_id`,
`identity_observed_at`, `credential_authority_evidence_ref`, and
`boundary_evidence_refs`.

`machine_identity_kind` is limited to generic HCS values:
`provider_principal`, `federated_subject`, and `runner_principal`. The
`machine_identity_ref` value is an `entityIdSchema`-compatible non-secret
reference target selected by that kind. It is never a token, private key,
service-account secret, provider item body, recovery code, raw assertion, JWT
body, or human SSH-agent state. HCS does not mint, rotate, retire, register, or
mutate machine identities through this evidence record.

## Phase 2.7 Project-Substrate Evidence

ADR 0044 opens the Q-014 project-substrate implementation lane as
schema/evidence work only. The slice models project-substrate contract
admission as external compatibility evidence that HCS can validate and compose.
It does not create a parallel CI control plane, approve contract lifecycle
state as gate authority, mint project identities, register runners, mutate
GitHub runner groups or repository access, run backup/restore workflows, or
provision project workloads.

All Q-014 records require non-null `valid_until`, explicit non-`none`
`redaction_mode`, workspace binding, and strict payloads. The contract itself
is represented as `KnowledgeSource.source_kind: project_substrate_contract`;
the typed evidence records cite the source hash and validation/admission
evidence chain. Contract lifecycle values such as `active` are producer
assertions inside evidence payloads, not `QualityGate.gate_state` values.

### `ProjectSubstrateContractValidationReceipt`

Source: `packages/schemas/src/entities/project-substrate-evidence.ts`

Direct `Evidence` receipt over the existing `workspace` and
`knowledge_source` subject kinds. The payload records `workspace_id`,
`knowledge_source_id`, `contract_content_hash`, `validation_run_id`,
`standard_ref`, `standard_version`, `validation_outcome_kind`,
`checked_field_paths`, `secret_reference_posture_kind`, optional
`contract_source_evidence_ref`, and `structural_evidence_refs`.

This receipt is structural/reference/hash validation. Sandbox authority is
allowed only for parser-level contract observations with the base Evidence
trace fields; it is not sufficient admission readiness or gate authority.

### `ProjectSubstrateAdmissionObservation`

Direct `Evidence` observation over `workspace` and `knowledge_source`. The
payload records the observed contract lifecycle state, the computed admission
state, validation receipt reference, project-admission-authority boundary
reference, credential and machine-identity evidence refs, boundary/runner/check
evidence refs, resource-budget/policy-plan evidence refs, and the
`no_secret_material_observed` structural assertion.

This observation does not add `QualityGate.gate_kind`,
`QualityGate.gate_state`, `ApprovalGrant.scope`, or `allowed_for_gate`.
Admission consumption remains future Ring 1 / policy work.

### `ProjectTeardownPlanReceipt`

Direct `Evidence` receipt over `workspace` and optional `knowledge_source`.
The payload records `teardown_plan_id`, teardown scope, target refs, retention
expectation, data-minimization posture, plan timestamp, required
`deletion_authority_evidence_refs`, optional contract/admission evidence refs,
and approval evidence refs.

`gitignore` is not deletion authority. The receipt records plan evidence only;
it does not execute teardown or mutate provider state.

### `ProjectTeardownCompletionReceipt`

Direct `Evidence` receipt over `workspace`. The payload records
`teardown_plan_id`, completion timestamp, completion state, completion evidence
refs, required deletion-authority evidence refs, removed and retained target
refs, residual-risk posture, and tombstone/retention state.

Completion evidence cannot promote backup readiness, admission readiness, or
gate authority by itself. It remains project-scope evidence for later deletion
authority composition.

## Phase 2.7 Backup-Readiness Evidence

ADR 0045 opens the Q-015 backup-readiness implementation lane as
schema/evidence work only. The slice models upstream backup and restore
surfaces as typed, freshness-bound evidence that HCS can compose with
project-substrate admission. It does not execute backups or restores, mutate
providers, add runtime validators, define canonical policy YAML, create
dashboard or adapter behavior, or add `QualityGate.gate_kind:
backup_readiness`.

All Q-015 records require non-null `valid_until`, explicit non-`none`
`redaction_mode`, non-sandbox authority, strict payloads, and existing
subject kinds. Proof-bearing nested evidence refs also require non-sandbox
authority, non-null `valid_until`, `parser_version`, and typed
`payload_schema_version` where the referenced subtype is load-bearing. This
schema slice does not widen base `Evidence.subject_kind` and therefore does
not bump `Evidence.schema_version`. Source/runbook/threat model material is
cited through `KnowledgeSource` references; chunks and runbooks remain
discovery inputs, not gate authority.

### `BackupReadinessObservation`

Source: `packages/schemas/src/entities/backup-readiness-evidence.ts`

Direct `Evidence` observation over one or more existing `workspace`,
`provider_object`, or `external_control_plane` subject refs. The payload
records `storage_class_ref`, provider-neutral `storage_class_kind`, lifecycle
`readiness_state_kind`, `readiness_observed_at`, `tombstone_state_kind`,
restore-drill evidence refs, separately accepted upstream backup-operation and
monitoring evidence refs, credential-custody refs, threat-model source refs,
and project backup requirement evidence refs.

`ready` requires a typed restore-drill receipt evidence ref and
`not_tombstoned`. `configured`, `usable`, `expired`, and `unknown` remain
distinct evidence states and are not gate authority by themselves. Future
policy and kernel consumers must still dereference the cited
`RestoreDrillReceipt` and verify freshness, boot verification, service
verification, and contradictions before treating readiness as positive
admission or gate evidence.

### `RestoreDrillReceipt`

Source: `packages/schemas/src/entities/backup-readiness-evidence.ts`

Direct `Evidence` receipt over a backup/restore surface. The payload records
`restore_drill_id`, typed source artifact / restore target / restored
environment refs, `restore_completed_at`, drill result, boot and service
verification states, optional RTO/RPO measurements, optional runbook source
ref, cleanup disposition, and evidence refs for the source artifact,
boot/service verification, and cleanup.

`restored_environment_ref` is a typed reference, never an inline restored
payload, database dump, environment dump, secret dump, or restored data
sample. A succeeded drill requires boot and service verification evidence.

### `BackupCredentialCustodyObservation`

Source: `packages/schemas/src/entities/backup-readiness-evidence.ts`

Direct `Evidence` observation over `credential_source` plus optional
workspace/provider/control-plane subjects. The payload records the
`credential_source_id`, backup surface ref, optional runtime-read-pattern
source ref, optional break-glass recovery path source ref, secret-reference
evidence refs, custody posture, expiry/rotation/auditability posture, and
credential-authority / machine-identity evidence refs.

Recovery procedures and break-glass paths are `KnowledgeSource` references
only. The schema does not carry procedure bodies, recovery codes, resolved
secrets, provider item bodies, shell history, environment dumps, or token
fragments.

### `ProjectSubstrateBackupRequirementObservation`

Source: `packages/schemas/src/entities/backup-readiness-evidence.ts`

Direct `Evidence` observation over `workspace` and `knowledge_source`. The
payload records the backup-shaped slice of a project-substrate contract:
`workspace_id`, `knowledge_source_id`, `contract_content_hash`, persistent
data posture, required storage class, required readiness state, whether a
restore drill is required before active use, RPO/RTO expectations, data
minimization, retention and teardown expectations, disposability declaration,
contract validation evidence, optional admission evidence, backup readiness
refs, restore drill refs, and teardown evidence refs.

Disposable/rebuildable project data requires source-declared disposability and
teardown evidence refs. Future policy decides whether that satisfies any
waiver or admission condition; this observation is not project admission or
gate authority by itself.

## Workflow-Sequencing Step 1 Foundational Ring 0 Entities

ADRs 0049–0053 introduce the five foundational Ring 0 entities the 2026-05-10
workflow-sequencing investigation §Step 1 names. Each entity ships its own
`schema_version` literal (`decisionSchemaVersionSchema`,
`workspaceContextSchemaVersionSchema`, `approvalGrantSchemaVersionSchema`,
`leaseSchemaVersionSchema`, `runSchemaVersionSchema`) so version bumps stay
per-entity. All five entities are envelope-level kernel-set; cross-record
refinements (Session/Decision/ExecutionContext equality, lease uniqueness,
producer-disjointness, gateway re-derive, valid_until inheritance,
self-approval rejection) live at Ring 1 mint API per registry §Cross-context
enforcement layer §Schema validation alone is not an enforcement layer.

The four Ring 0 entities that authorize or attribute operation execution
(`Decision`, `ApprovalGrant`, `Lease`, `Run`) commit an envelope-level
superRefine on `evidence_refs` that mirrors `qualityGateSchema`: it rejects
direct `KnowledgeChunk` / `DerivedSummary` references, `sandbox-observation`
and `self-asserted` authorities, and unpromoted `coordination_fact` /
`derived_summary` chain refs. The walk fires unconditionally (no state-gating)
because these envelopes authorize host-mutation surfaces at every lifecycle
state. `WorkspaceContext` does not carry the chain-walk refinement; it mirrors
`AgentClient` as a typed-identity envelope.

### `Decision`

Source: `packages/schemas/src/entities/decision.ts`

Typed envelope for gate-decision records (ADR 0049 / D-037). Every kernel
rejection emits a `Decision` per registry §Audit-chain coverage of rejections.

Key fields:

- `outcome` is `allow | deny | informational`. Outcome-compatibility is
  refined at the schema layer: `deny`-only `reason_kind` values reject when
  paired with `informational`, and the v1 enum has no `allow`-compatible value
  (future ADRs may add allow-compatible reason_kinds via the §Procedure rule).
- `reason_kind` is a closed Zod enum of 18 values from ADR 0049 plus ADRs
  0056 and 0058. ADR 0056 promotes `operation_class_unregistered` and
  `audit_chain_corruption_detected`; ADR 0058 promotes
  `authority_chain_walk_depth_exceeded`. These are additive enum widenings
  without bumping `Decision.schema_version`; all three promoted values are
  deny-only.
- `reason_text` is bounded to 1–256 characters; `reason_text_redaction_mode`
  uses `decisionRedactionModeSchema` (which excludes `'none'`). Resolved-
  secret substring scrubbing runs at Ring 1 mint per registry §Redaction
  posture.
- `required_grant_kind` reuses `approvalGrantKindSchema` directly (no
  duplicate enum) to prevent drift with ApprovalGrant. For
  `operation_class_unregistered` and
  `authority_chain_walk_depth_exceeded`, ADRs 0056 and 0058 make the denials
  non-clearable: `required_grant_kind` must be `null`, and any non-null grant
  kind rejects.
- `operation_shape_ref` is required for every Decision, including
  `operation_class_unregistered` and
  `authority_chain_walk_depth_exceeded`; there is no nullable or sentinel
  OperationShape path. ADR 0058 further limits typed depth-overflow Decision
  emission to requests that can cite a valid operation shape.
- `decided_by` is one of `mint_api`, `kernel_broker`, `kernel_gateway`. The
  gateway re-derive emits Decisions but does not mint Grants/Leases/Runs.
  ADR 0058 narrows `authority_chain_walk_depth_exceeded` to `mint_api` and
  `kernel_broker`; `kernel_gateway` is excluded for that reason kind until a
  future gateway ADR accepts equivalent bounded-walk semantics.
- `audit_chain_link_hash` carries the per-record chain link; the canonical
  concatenation uses length-prefix-encoded `||` per ADR 0051 v4 retroactive
  posture rule. The prior-link hash is a Ring 1 mint input, not a schema
  field.
- `valid_until` is non-null per charter inv. 19; freshness binding for
  gateway re-derive consumption.

`Decision` is envelope-level kernel-set with no field-level exceptions.
Producer-supplied `Decision` records are rejected at the future Ring 1 mint
API per registry §Producer-vs-kernel-set authority fields. Decisions are
immutable once minted; supersession is via a NEW Decision record citing the
prior in `evidence_refs`.

### `WorkspaceContext`

Source: `packages/schemas/src/entities/workspace-context.ts`

Typed identity for a 1:1 worktree binding (ADR 0050 / D-038). Closes the FK
target previously satisfied only by string identifiers in
`CoordinationFact.subjectRefSchemas.workspace_context`,
`VerificationCommandSpec.workspace_context_id`, and the ADR 0036
`audit_profile_snapshot.workspace_context_id` reference.

Key fields:

- `workspace_context_state` is `active | retired`; lifecycle transitions
  produce NEW WorkspaceContext records citing the prior in `evidence_refs`.
  Same-record refinement enforces `valid_until == null` for active records
  and `valid_until != null` for retired records.
- `execution_context_id` is kernel-set per ADR 0031 v1 Mechanical Tweak #8 /
  Security-C. Layer 1 mint API enforces `WorkspaceContext.execution_context_id
  == Session.execution_context_id` when leases are acquired.
- `repository_id` and `worktree_path` are producer-asserted,
  kernel-verifiable per ADR 0031 v1 §Authority discipline; Layer 1 verifies
  via filesystem stat + `worktree_path` canonicalization per Mechanical
  Tweak #2 / Security-D before cardinality checks.
- `producer` is a named enum (`workspaceContextProducerSchema`) limited to
  `kernel_workspace_diagnose` at v1; chosen over `z.literal` per ontology
  reviewer Option 2 for forward-compatible allowlist widening.
- `audit_chain_link_hash` and `evidence_refs` mirror the `AgentClient`
  pattern.

WorkspaceContext does not carry the chain-walk envelope superRefine; it is a
typed-identity envelope rather than an authorization envelope. The
`workspace_context` Evidence subject_kind is unchanged by this addition.

### `ApprovalGrant`

Source: `packages/schemas/src/entities/approval-grant.ts`

Typed envelope for gate-decision-override grants (ADR 0051 v4 / D-039).
Closes the three registry §Decision.required_grant_kind reservations from
ADR 0030 + ADR 0035; `approvalGrantKindSchema` is the canonical source the
Decision entity re-imports for `required_grant_kind`.

Key fields:

- `grant_kind` is a closed Zod enum: `gate_evidence_acknowledgment`,
  `worktree_clean_acknowledgment`, `pr_absence_acknowledgment`. Future
  grant_kinds (e.g., a class-I cleanup acknowledgment) follow the registered
  §Procedure rule.
- `scope` is a discriminated union on `grant_kind` carrying the typed
  acknowledged-evidence refs each branch requires:
  `acknowledged_evidence_refs[]` (gate), `acknowledged_dirty_state_evidence_ref`
  (worktree clean), or `acknowledged_pr_absence_evidence_ref` (pr absence).
  `pr_absence_acknowledgment.branch_ref` is constrained to git-ref grammar
  via `gitBranchRefSchema`.
- `minted_for_decision_id` is non-null at v1; pre-emptive grants are deferred
  to the future `kernel_dashboard` producer ADR as a coordinated change-set.
- `granted_by` is one of `mint_api`, `kernel_broker`. `kernel_gateway` is
  intentionally excluded by design (gateway re-derive is the non-escalable
  layer).
- `grant_state` is `active | consumed | expired | revoked`; lifecycle
  transitions produce NEW ApprovalGrant records via supersession.
- The envelope-level superRefine walks `evidence_refs` AND every
  scope-payload acknowledged_* ref unconditionally per charter inv. 18.
- Same-record refinement enforces `valid_until > granted_at` and
  envelope `grant_kind == scope.grant_kind`.

Cross-record rules (D-037 cross-step producer-disjointness; cardinality of
one `active` grant per `minted_for_decision_id`; self-approval rejection with
Unicode NFC + lowercase + whitespace canonicalization against consuming
session principal; `valid_until <= Decision.valid_until` inheritance;
consumption-time freshness re-check; revoke-wins tiebreaker producing
paired typed Decisions) live at Ring 1 mint API per registry §Cross-context
enforcement layer.

### `Lease`

Source: `packages/schemas/src/entities/lease.ts`

Typed envelope for session-scoped resource holds (ADR 0052 / D-040). v1
implements the worktree lease per ADR 0031 v1 §Lease entity field-shape
posture commitment.

Key fields:

- `lease_kind` is `worktree` at v1 (single-value closed enum).
  `credential_audience` and `external_target` are registry-canonical
  reservations from ADR 0031 v1 §Out of scope; future schema PRs land them
  per the registered §Procedure rule.
- `scope.worktree` carries `repository_id`, `workspace_context_id`, and
  `worktree_path` (producer-asserted, kernel-verifiable; Layer 1
  canonicalizes path per ADR 0031 v1 Mechanical Tweak #2 / Security-D before
  the cardinality check on `(repository_id, canonical(worktree_path),
  lease_state == 'active')`).
- `held_by_session_id` + `held_by_agent_client_id` attribute the holder.
- `lease_state` is `active | expired | released | force_broken`. Same-record
  refinement enforces lease_state ↔ released_at correlation and
  force_break_grant_id ↔ lease_state == 'force_broken' correlation.
- `acquired_by` is one of `mint_api`, `kernel_broker`; `kernel_gateway`
  excluded by design.
- `force_break_grant_id` is nullable at v1. The
  `worktree_lease_force_break_acknowledgment` grant_kind is deferred to the
  future `kernel_dashboard` producer ADR coordinated change-set; Ring 1
  rejects any non-null value at v1.
- The envelope-level superRefine walks `evidence_refs` unconditionally per
  charter inv. 18. v1 worktree scope has no scope-payload acknowledged_*
  refs; future lease_kinds whose scope branches add them must extend the
  envelope walk per the §Procedure rule.

Cross-record rules (atomic worktree-uniqueness insert, sandbox-acquire
rejection per charter inv. 8, holder-only release, force-break
separation-of-duties, D-037 producer-disjointness cross-step extension,
`valid_until <= 24h past acquired_at` Phase 1 ceiling, producer-assertion
verification) live at Ring 1 mint API.

### `Run`

Source: `packages/schemas/src/entities/run.ts`

Typed envelope for the execution receipt of every authorized operation
(ADR 0053 / D-041). Closes the long-pending typed FK target for
`Evidence.run_id` referenced by 12 Phase 2 evidence subtypes without
modifying `Evidence.subject_kind` or bumping `Evidence.schema_version`.

Key fields:

- `run_kind` is `operation_execution` at v1 (single-value closed enum).
  `system_task` and `diagnostic` remain registry-canonical reservations
  pending future schema PRs per the §Procedure rule.
- `scope.operation_execution` carries `operation_shape_ref` and
  `authorizing_decision_id` (a typed FK to the Decision with `outcome:
  'allow'` that authorized this Run; Layer 1 verifies outcome at Run creation
  time).
- `invoker_session_id` + `invoker_agent_client_id` attribute the invoker per
  registry attribution discipline.
- `recorded_by` is one of `mint_api`, `kernel_broker`; `kernel_gateway`
  excluded by design (gateway re-derive does not record Runs).
- `run_state` is `active | succeeded | failed | aborted | timeout` (1 active
  + 4 terminal). Same-record refinement enforces `ended_at == null` ↔
  `run_state == 'active'` and `ended_at != null` ↔ terminal state.
- Same-record refinement enforces `ended_at == null || ended_at >=
  started_at`; this is the ONE NEW schema-level refinement accepted in
  ADR 0053 (the scope/envelope `run_kind` agreement check and the
  `run_state` ↔ `ended_at` correlation are inherited patterns from
  Lease/ApprovalGrant precedent, not NEW commitments).
- The envelope-level superRefine walks `evidence_refs` unconditionally per
  charter inv. 18. v1 operation_execution scope has no scope-payload
  acknowledged_* refs; future run_kinds whose scope branches add them must
  extend the envelope walk per the §Procedure rule.
- All 13 envelope-level fields are kernel-set (no producer-asserted
  exceptions — cleaner than Lease per ADR 0031 v1 mixed split because Run is
  purely kernel-observed).

Cross-record rules (`Run.execution_context_id == invoker_session.execution_
context_id`, `Run.execution_context_id == authorizing_decision.execution_
context_id`, authorizing-Decision outcome verification, mid-run
terminal-state mutation rejection, D-037 producer-disjointness extension to
Run-vs-authorizing-Decision) live at Ring 1 mint API per registry
§Cross-context enforcement layer.

### `Principal`

Source: `packages/schemas/src/entities/principal.ts`

Typed identity for human or service-principal actors (ADR 0054 / D-043;
sixth foundational Ring 0 entity, first one drafted post-Step-1-source-
landing). Closes the typed FK target for `ApprovalGrant.grantor_principal_
ref` (no shape change — `entityIdSchema` both before and after the typed
FK closure; only the semantic referent gains a typed Ring 0 target) and
the future `Session.principal_id`. Also closes ADR 0025 §Branch deletion
proof `requesting_principal_id` and ADR 0036 §Sub-decision (d) cycle-
history.md ratification verifier-identity binding.

Key fields:

- `principal_kind` is a closed Zod enum at v1: `human`,
  `service_principal`. `pseudo_principal` (cycle-history.md ratification
  per ADR 0036 future Q-row) and `system_principal` (kernel-emitted-
  record attribution) remain registry-canonical reservations pending
  future schema PRs via the registered §Procedure rule.
- `principal_state` is `active | retired`; supersession-via-evidence_refs.
  Same-record refinement enforces `state == 'active' iff valid_until ==
  null` (mirrors WorkspaceContext).
- `producer` is `principalProducerSchema = z.enum(['kernel_principal_
  resolver'])`. NEW kernel-trusted producer mirroring ADR 0037
  `kernel_agent_client_resolver` precedent; resolves Principal records
  from binding evidence (`GitIdentityBinding` for `human`,
  `MachineIdentityBindingObservation` for `service_principal`, future
  Q-row commit-signature-to-principal mappings per ADR 0036 §Future
  amendments). `kernel_dashboard` deferred to coordinated future ADR.
- **NO `execution_context_id` field on the envelope** — Principal
  identity is execution-context-independent at the entity layer
  (mirrors AgentClient framing; a human signing a git commit is the
  same human across terminal/IDE/dashboard surfaces). Binding evidence
  cited via `evidence_refs` carries its own `execution_context_id`
  per inv. 19 where applicable.
- **NO chain-walk envelope superRefine** — Principal is a typed-
  identity envelope (mirrors AgentClient + WorkspaceContext); inv. 8 +
  inv. 18 deferred to Ring 1 mint API via producer-allowlist closure
  on `kernel_principal_resolver`.
- `audit_chain_link_hash` carries the per-record chain link with
  length-prefix discipline (retroactive posture rule per ADR 0051 v4
  now extended to ADRs 0049-0054).

**Self-approval rejection typed-FK closure (ADR 0051 v4 MT-Sec-2
absorbed)**: when Principal records exist, the self-approval rejection
comparison (per ADR 0051 v4 §Rejects §Self-approval rejection) becomes
**UUID-byte-equality** on `principal_id` surface IDs (mirrors ADR 0052
§Identity comparison form for session_id). `kernel_principal_resolver`
canonicalizes `principal_id` at MINT via a 4-step recipe: Unicode NFC
normalization → **Unicode general-category `Cf` (Format Control) strip**
(closes the invisibles surface — ZWSP / ZWNJ / ZWJ / BOM / soft-hyphen
/ LRM / RLM / word joiner / Arabic format controls / bidirectional
controls / Mongolian vowel separator / interlinear annotation anchors
/ supplementary-plane Cf) → Unicode-aware lowercase fold → leading/
trailing-whitespace trim (embedded whitespace preserved as distinct
identity by design). The Cf-strip step is the load-bearing v2 change
that structurally closes the MT-Sec-2 zero-width-character evasion
class. TR39 confusable defense + Unicode version pinning reserved as
future amendments.

Cross-record rules (binding-evidence verification per `principal_kind`,
synthetic-identity rejection per ADR 0019 v3 + ADR 0036, self-approval
rejection FK comparison, `requesting_principal_id` FK liveness, FK-
target activeness at time of citing record) live at Ring 1 mint API
per registry §Cross-context enforcement layer §Schema validation alone
is not an enforcement layer.

### `Session`

Source: `packages/schemas/src/entities/session.ts`

Typed identity for an agent-invocation session that holds Leases,
invokes Runs, and is consumed by ApprovalGrant self-approval rejection
comparison (ADR 0055 / D-044; seventh foundational Ring 0 entity,
second of two highest-coupling remaining M1 entities per the
workflow-sequencing investigation §Step 3 priority order). Closes 4
forward-reference typed FK targets: `Lease.held_by_session_id` (ADR
0052), `Run.invoker_session_id` (ADR 0053), ADR 0030 v2
`owning_session_id`, and the "consuming session" + "requesting
session" references in ADRs 0031 v1 / 0051 v4 / 0052 / 0054.

Key fields:

- `session_kind` is a closed Zod enum at v1: `agent_invocation`.
  `dashboard` (paired with future `kernel_dashboard` producer ADR per
  ADRs 0051 v4 / 0052 / 0053 / 0054 deferral) and `system_task`
  (paired with `system_principal` Zod-defined extension per ADR 0054)
  remain registry-canonical reservations.
- `session_state` is `active | ended`. **Cardinality matches**
  AgentClient/WorkspaceContext/Principal long-lived precedents (1
  active + 1 terminal at v1) but **value-name diverges intentionally**:
  Session uses `ended` (not `retired`) because Session is a transient
  invocation rather than a long-lived identity.
- `agent_client_id`, `principal_id`, `execution_context_id` are all
  required kernel-set FKs at v1. Future `system_task` session_kind
  may relax `agent_client_id` to nullable per the §Procedure rule
  (paired with `system_principal` Zod-defined extension).
- `producer` is `sessionProducerSchema = z.enum(['kernel_session_
  resolver'])`. NEW kernel-trusted producer mirroring ADR 0037
  `kernel_agent_client_resolver` + ADR 0054 `kernel_principal_resolver`
  precedents. Ring 1 implementation at `packages/kernel/src/session/`
  MUST enforce sandbox-source rejection (invocation evidence MUST NOT
  carry `authority: 'sandbox-observation'` or `'self-asserted'`) +
  transitive chain-walk rejection via `derived_from` per ADR 0019 v3
  with walk-depth budget ≤ 64 + cycle-rejection via
  `audit_chain_corruption_detected`.
- **YES `execution_context_id` field on the envelope** — Session is
  **execution-context-BOUND at the entity layer** (mirrors
  WorkspaceContext per ADR 0031 v1 Mechanical Tweak #8 / Security-C,
  NOT Principal which is execution-context-independent). Sessions
  that cross contexts are NEW Session records; same-Session
  re-binding is not supported. Layer 1 mint API enforces cross-
  context binding equality at Lease acquire (per ADR 0052), Run
  creation (per ADR 0053 triple equality), and ApprovalGrant
  consumption (per ADR 0051 v4 + ADR 0054 self-approval rejection).
- **NO chain-walk envelope superRefine** — Session is a typed-
  identity envelope (mirrors AgentClient + WorkspaceContext +
  Principal); inv. 8 + inv. 18 deferred to Ring 1 mint API via
  producer-allowlist closure on `kernel_session_resolver`.
- Same-record refinements: `session_state == 'active' iff ended_at
  == null` (mirrors WorkspaceContext + Run + Lease state↔nullable-
  timestamp correlation patterns); `ended_at == null || ended_at >=
  started_at` (mirrors Run.ended_at >= started_at temporal refinement
  per ADR 0053).
- `audit_chain_link_hash` carries the per-record chain link with
  length-prefix discipline (retroactive posture rule per ADR 0051 v4
  now extended to ADRs 0049-0055).

**Self-approval rejection typed-FK consummation (ADR 0051 v4 + ADR
0054 §Self-approval rejection rule)**: the consuming-session
`principal_id` reference in the §Self-approval rejection rule
registry section (added by ADR 0054's change-set item 7 ADD) becomes
a typed FK via `Session.principal_id`. The comparison form remains
UUID-byte-equality on principal_id surface IDs canonicalized at
Principal mint per the ADR 0054 4-step recipe (NFC + Cf-category
strip + Unicode-aware lowercase fold + leading/trailing whitespace
trim). Session.principal_id stores the already-canonicalized surface
ID.

Cross-record rules (FK liveness verification for `agent_client_id` /
`principal_id` / `execution_context_id` at Session mint; cross-
context binding equality enforcement for consuming records; holder-
only release UUID-byte-equality comparison per ADR 0052; self-
approval rejection FK consumption per ADR 0051 v4 + ADR 0054) live
at Ring 1 mint API per registry §Cross-context enforcement layer
§Schema validation alone is not an enforcement layer.

## PolicyRule (Ring 0 — non-minted policy-rule shape)

### `PolicyRule`

Source: `packages/schemas/src/entities/policy-rule.ts`

Typed Ring 0 shape of a single policy rule (ADR 0060 / D-057), keyed to
`OperationShape.operation_class`. PolicyRule is the **first non-minted Ring 0
entity**: it types the shape the operator-approved live policy (and the HCS
vendored snapshot) conform to, and landing it sets the live policy's
`policy_rule_schema_version` from `null` to `'0.1.0'` (an operator +
system-config edit, not performed by the schema PR). It carries **no**
`audit_chain_link_hash`, **no** producer-mint field, and **no** `evidence_refs`
— it is not an audit-chain mint entity and is absent from the ADR 0057 mint
scope. The Ring 1 gateway *decides using* rules; PolicyRule never decides
(charter inv. 1). The schema encodes only structural invariants, never the
`operation_class → tier` or `tier → approval` mappings, which are live-policy
content owned by system-config (charter inv. 1 / inv. 10).

Key fields:

- `operation_class` reuses `operationShapeOperationClassSchema` (the closed
  8-value enum); a record types exactly one operation class. Set-coverage of all
  classes is a lint concern over a collection of PolicyRule records, not a
  per-record invariant.
- `tier` is `policyRuleTierSchema` (`read-safe | write-local | write-project |
  write-destructive | forbidden`), mirroring the live policy `tiers:` keys
  verbatim (kebab-case; registry §Naming-suffix-discipline Sub-rule 9 grandfather
  extension). `write-host` is a registry-canonical reservation, removed from live
  policy v0.1.0.
- `classification_basis` is the literal `typed_operation_class` — primary intent
  is the typed enum; regex is renderer/hook/lint defense-in-depth only (inv. 2).
- `approval` is a discriminated union on `approval_required`: the `false` branch
  carries only `approval_path_allowed`; the `true` branch carries
  `required_grant_kind` + `allowed_grant_kinds` (reusing `approvalGrantKindSchema`),
  `producer_allowlist` (reusing `approvalGrantProducerSchema` — `mint_api` /
  `kernel_broker`, `kernel_gateway` excluded per ADR 0051 v4),
  `dashboard_visibility`, `single_use`, and `evidence_bound_scope` (a descriptor
  token only, never a resolved/secret value).
- `requires_active_lease`, `requires_deletion_authority`, and
  `requires_typed_provider_evidence` are booleans recording the requirement; the
  last is a deliberate lossy projection of the live policy's structured
  `required_pre_execution_evidence` block (inv. 16), enforced in detail by the
  gateway.
- `valid_until_ceiling` is a narrow `isoDurationSchema` (`PT…H/M/S`) or
  `not_applicable`; `valid_until_ceiling_source_ref` preserves the citing
  provenance.
- `source_provenance` binds the record to the operator-approved live policy:
  `authority: 'system_config_live_policy'` (a provenance tag, **disjoint** from
  `evidenceAuthoritySchema` — not an evidence trust class), `source_policy_path`
  (relative; no absolute/traversal/secret shapes), `source_policy_sha256` (the
  bound live-policy blob digest), and `source_policy_sha256_basis:
  'live_policy_blob'`.

A structural `superRefine` enforces charter inv. 6 (any tier in the
`nonEscalableTiers` set — `forbidden` at v1 — must take the no-approval variant
with `approval_path_allowed: false`; no approval path, no grant detail) and
`required_grant_kind ∈ allowed_grant_kinds`. Two Ring-1 obligations of the
non-minted posture are deferred and named in ADR 0060: **(B-1)** a follow-up
`Decision` schema amendment adds `policy_rule_ref` + the resolved
`source_policy_sha256` for audit attribution (charter inv. 4; `Decision` lacks
it today); **(B-2)** the gateway/loader MUST verify
`source_provenance.source_policy_sha256` against the bound, verified snapshot
digest before a rule influences a `Decision` — the `authority` literal confers
no authority on its own.

## Capability (Ring 0 — non-minted registry declaration)

### `Capability`

Source: `packages/schemas/src/entities/capability.ts`

A non-minted Ring 0 registry declaration of a known kernel operation (ADR 0062 /
D-060). `Capability` is a **structural peer of `PolicyRule`**: it types a single
entry in the capability registry — the set of operations the kernel knows how to
shape and render. It carries **no** `audit_chain_link_hash`, **no** producer-mint
field, and **no** `evidence_refs`; it is not an audit-chain mint entity and is
absent from the ADR 0057 mint scope. Like `PolicyRule`, its provenance is
`source_provenance`, bound to the capability-registry blob it was read from, and
it never decides anything — the Ring 1 gateway *decides using* the registry, but
`Capability` is a declaration, not a Decision (charter inv. 1).

Key fields:

- `operation_name` (`capabilityOperationNameSchema`) is a lowercase dotted
  identifier of at least two segments (e.g. `service.activate`). It is
  **intentionally distinct** from `operation_class`: the schema does not
  constrain one to the other, because one `operation_class` groups many
  `operation_name`s. The first segment forbids `_`; later segments allow it. The
  regex forbids path/URI/secret shapes by construction (no `/`, no `://`, no
  `op://`). It is verb-agnostic — there is no forbidden-literal denylist at
  Ring 0; deprecation/forbidding is a `capability_state` + policy/renderer
  concern, not a name concern.
- `operation_class` reuses `operationShapeOperationClassSchema` (the closed
  8-value enum); a record declares exactly one operation class. The schema
  reuses, never redefines, this enum.
- `capability_state` (`capabilityStateSchema`) is `active | deprecated |
  retired`: registry lifecycle. `active` = renderable; `deprecated` = registered
  but render-refused (charter inv. 11, enforced by the CommandShape renderer, not
  this schema); `retired` = retained historical record, render-refused.
- `source_provenance` binds the record to the capability-registry blob:
  `authority: 'capability_registry'` (a provenance tag, **disjoint** from
  `evidenceAuthoritySchema` — not an evidence trust class, and confers no
  authority by itself), `source_registry_path` (relative; no absolute/traversal/
  URI/secret shapes), `source_registry_sha256` (the bound registry-blob digest),
  and `source_registry_sha256_basis: 'capability_registry_blob'`. The digest is
  **format-only at Ring 0**; the digest-vs-bound-registry trust check is a Ring 1
  capability-registration obligation. Mirrors `PolicyRule.source_provenance`.

There is **no** `superRefine` — `Capability` has no cross-field coupling and no
containment-class axis. The record is a flat `.strict()` envelope.

**Three-senses disambiguation.** The word "capability" is overloaded in this
ontology across three deliberately separate senses; this entity is sense 1 only:

1. **`Capability` (this entity)** — a non-minted Ring 0 registry declaration of a
   known kernel operation, keyed to `operation_name` + `operation_class`.
2. The **`AgentClient` containment-class axis** (`containment_mechanism` /
   capability-class evidence: what a product *can* provide). NOT this entity.
3. The **`BoundaryObservation` capability-state observation vocabulary** (per-
   surface observed capability status, e.g. `proven` / `stale`). NOT this entity.

`capability_state` is therefore disjoint from both the sense-2 containment tokens
and the sense-3 observation vocabulary.

## CommandShape (Ring 0 — non-minted typed plan)

### `CommandShape`

Source: `packages/schemas/src/entities/command-shape.ts`

A non-minted Ring 0 typed **plan** — `argv` + `env` + `cwd` + `timeout_seconds`
— rendered from an `OperationShape` (ADR 0063 / D-061). `CommandShape` is the
third and last entity in the `PolicyRule → Capability → CommandShape`
policy-registry / operation-pipeline chain and a **structural peer of
`PolicyRule` and `Capability`**: it carries **no** `audit_chain_link_hash`,
**no** producer-mint field, and **no** `evidence_refs`; it is absent from the
ADR 0057 mint scope. Its provenance is the typed `operation_shape_ref` (a render
of an already-evidenced OperationShape), not an audit-chain hash.

**Central boundary: a typed plan, not an execution authorization.** Typing the
plan at Ring 0 creates, implies, and unblocks no execute lane, and carries no
execution semantics. The execution broker stays blocked until the
approval-grant + dashboard-review stack exists (charter inv. 7); `CommandShape`
only gives that future stack a typed object to reason about.

Key fields:

- `operation_shape_ref` (`entityIdSchema`) is the typed FK to the
  `OperationShape` this plan was rendered from — the render source and
  provenance. A bare format-validated id at Ring 0; FK existence and the
  `OperationShape.operation_class` linkage are Ring 1 obligations.
  `operation_class` is **not** echoed onto `CommandShape` (it is derivable via
  this FK and would otherwise duplicate live-policy-adjacent content, inv. 1).
- `argv` (`z.array(z.string().min(1)).min(1)`) is the typed argv **vector**;
  `argv[0]` is the executable, every element a non-empty string. There is **no**
  shell-string field anywhere on the entity (charter inv. 2): the plan is a
  typed vector by construction. A flat string vector cannot distinguish a
  `SecretReference` / `ProviderObjectReference` / `PublicClientId` /
  `PolicySelectorValue` / raw secret inside an element — the argument-class
  distinction (charter line 98) is a deferred **Ring 1 gateway** obligation,
  recorded by a seeded regression trap (the schema accepts an inlined
  secret-shaped element) paired with the `forbidden-string-scan` committed-
  fixture backstop.
- `env` (`z.array(commandShapeEnvEntrySchema)`, may be empty) carries variable
  **names** plus a typed value-**source** reference, never resolved values
  (charter inv. 5). `commandShapeEnvValueSourceSchema` is a discriminated union
  on `kind`: `secret_reference` (an opaque `secret_reference_ref` forward
  reference to the unbuilt `SecretReference`; the broker resolves the value at
  execution time) or `execution_context_inherited` (no value stored). No variant
  carries an inline resolved value. An envelope `superRefine` requires env
  `name`s to be unique within the array.
- `cwd` (`commandShapeCwdSchema`) is a working-directory path: optional leading
  `/` (absolute) or relative, no `..` traversal, no URI scheme, no secret shape.
  Ring 0 cannot know the allowed roots; confining `cwd` to permitted roots is a
  Ring 1 broker obligation.
- `timeout_seconds` (`z.number().int().positive().max(86400)`) is a bounded
  positive timeout. The `86400` (24h) bound is a hard **ceiling**, not a default
  and not an authorization; the Ring 1 broker applies its own tighter
  per-operation budget (cross-referencing the future `ResourceBudget` entity).

The record is a `.strict()` envelope; its only `superRefine` is env-`name`
uniqueness. Deprecated-verb render-refusal (inv. 11), `cwd` absolute-root
confinement, `SecretReference` FK closure + env value resolution,
`operation_shape_ref` FK existence, the argv argument-class distinction
(line 98), and lease / approval / dashboard gating are Ring 1 renderer / broker /
gateway obligations, not Ring 0 schema checks.

## Phase 1 Boundary Observation Envelope

### `BoundaryObservation`

Source: `packages/schemas/src/entities/boundary-observation.ts`

Implements the ADR 0022 evidence subtype envelope for contextual boundary
claims. A `BoundaryObservation` describes one freshness-bound boundary fact
about one surface, execution context, workspace, credential source, or
provider object. It does not decide policy; it carries the discriminator,
target binding, observed payload, freshness, and evidence references that
later policy/gateway services compose.

Key fields:

- `boundary_dimension` is singular and drawn from the registry at
  `docs/host-capability-substrate/ontology-registry.md`. The Zod enum mirrors
  that registry; drift between them fails `just verify`.
- `source`, optional `source_ref`, `observed_at`, non-null `valid_until`,
  `authority`, `confidence`, `parser_version`, optional `producer`, and
  optional `redaction_mode` give the envelope its own Evidence-base
  provenance and freshness posture. Linked `evidence_refs` support
  composition but do not replace envelope-level freshness.
- `observed_payload` is a domain-specific JSON value owned by the dimension's
  payload schema family. The envelope reasons over `observation_state`,
  `discrepancy_class`, freshness, and `evidence_refs`, not the payload
  internals.
- `expected_payload` is present only when the domain payload defines an
  expected target posture. It must use the same domain payload schema family
  as `observed_payload`.
- At least one target reference must be present: `surface_id`,
  `execution_context_id`, `workspace_id`, `credential_source_id`, or
  `tool_or_provider_ref`. The envelope refuses an unbound observation.
- `observation_state` carries the seven-state vocabulary from ADR 0022:
  `proven`, `denied`, `pending`, `stale`, `contradictory`, `inapplicable`, and
  `unknown`. `unknown` is not the same as `denied`; missing or unobservable
  evidence is its own state.
- `schema_version` names the envelope schema, `evidence_schema_version` names
  the base `Evidence` contract, and `payload_schema_version` names the domain
  payload when one exists. The three versions are independent; a domain
  payload bump must not force an envelope bump, and vice versa.

Multi-dimensional boundary facts are represented as linked observations that
share target references, not as a single envelope with multiple dimensions.

Phase 2.2.3 adds structural payload schemas for four dimensions:

- The structural payload narrowing bumps `BoundaryObservation.schema_version`
  to `0.2.0`. Earlier generic `0.1.0` payload records require migration or
  re-minting before they can be treated as typed Phase 2.2.3 observations.
- `containment_class` requires `execution_context_id` and carries the ADR 0037
  `containment_kind` discriminator (`none`, `kernel_sandbox`, `container`,
  `vm`, `remote_cloud_sandbox`, `ide_host_isolation`,
  `terminal_no_isolation`) plus the common posture fields
  `network_egress_posture`, `filesystem_write_scope`, and `keychain_access`.
  Discriminator-specific fields are required only for their matching kind:
  `kernel_sandbox_profile`, `container_runtime_kind`, `vm_kind`, or
  `remote_cloud_kind`.
- `filesystem_inheritance` requires `execution_context_id` and records whether
  a child execution context inherits filesystem authority.
  `inheritance_held: true` requires at least one
  `inheritance_evidence_refs` entry; the false case may carry an empty link
  array.
- `filesystem_protected_paths` requires `workspace_id` and carries
  `protected_paths[]`, where each entry has `path`, `path_authority_kind`, and
  `path_authority_source_evidence_ref`. `path_authority_kind` is one of
  `rule_binding`, `lease_scope`, `tcc_scoped`, or `human_dashboard_grant`.
- `mcp_canonical_authority` requires `execution_context_id`, carries ADR 0036
  reference-only MCP canonicality evidence, and requires
  `redaction_mode: reference_only`. The payload references
  `CredentialSource` and `ToolProvenance` evidence through `evidenceRefSchema`;
  resolved credential values are never inlined.

Phase 2.3.2 adds the ADR 0032 `runner_isolation` typed payload branch and
bumps `BoundaryObservation.schema_version` to `0.3.0`. The branch requires
`execution_context_id` and uses the flat runner posture payload documented
above.

Phase 2.3.3 adds the ADR 0027 `branch_protection` typed payload branch and
bumps `BoundaryObservation.schema_version` to `0.4.0`. The branch requires
`tool_or_provider_ref` and records branch/ruleset protection posture for a
repository/ref target.

Phase 2.7 adds the ADR 0044 `project_admission_authority` typed payload branch
and bumps `BoundaryObservation.schema_version` to `0.5.0`. The branch requires
`workspace_id` and records reference-only guardian/project-admission authority
posture for a project-substrate contract content hash. `knowledge_source_id`
and `contract_content_hash` live in the typed payload, not as new envelope
target fields.

`BoundaryObservation` does not introduce a new policy tier, dashboard route,
runtime probe, or mutation operation. Remaining generic domain payload schemas,
gate-behavior rules for stale or contradictory observations, and dashboard
rendering are follow-up Q-007 work.

## Compatibility and Isolation Vocabulary

The 2026-05-01 agentic tool isolation intake does not add schema by itself. It
does refine the vocabulary that Milestone 1 schema reconciliation should
consider.

HCS must not collapse these concepts:

- permission gating: ask/allow/deny/autopilot/bypass modes and tool rules;
- workspace write scope: open-workspace or configured-root filesystem bounds;
- worktree/file isolation: Git worktree or branch separation;
- kernel sandboxing: Seatbelt, bubblewrap, seccomp, Windows sandbox, or
  equivalent local process containment;
- container or VM isolation: devcontainer, Docker worker, VM snapshot, or
  self-hosted runner boundary;
- remote cloud execution: vendor or managed infrastructure executing the task;
- terminal inheritance: live shell/PTY/env coupling;
- app-managed dependency bundle: bundled Node/Python/toolchain separate from
  host PATH.

Candidate schema reconciliation points:

- `ExecutionContext` may need explicit containment and execution-location
  evidence, not only `surface`, shell, sandbox, and env inheritance fields.
- `AgentClient` now distinguishes product family, surface, app build,
  dependency bundle, permission mode, and containment mechanism. Future work
  composes it with `WorkspaceContext` and runtime containment evidence.
- `ToolInstallation` and `ResolvedTool` should represent app-bundled
  dependencies, cloud setup/runtime tools, devcontainer tools, and host PATH
  tools as separate authority surfaces.
- `WorkspaceContext` and `Lease` should represent worktree identity and
  ownership without implying process, network, or credential isolation.
- `CredentialSource` should distinguish session-only, build-only,
  disk-persisted, app-managed OAuth/Keychain, brokered secret reference, and
  environment compatibility renderings.
- Future `BoundaryObservation` / `QualityGate` work should decide whether
  containment posture is modeled directly on `ExecutionContext`, as `Evidence`
  subtypes, or through a separate boundary envelope.

Do not copy vendor adapter schemas into Ring 0. Vendor config and UI settings
are observation sources; HCS schemas describe host facts, evidence,
capabilities, and decisions.

## Version-Control Authority Vocabulary

The 2026-05-01 version-control authority consult refined Q-006. Phase 2.3.3
lands the accepted ADR 0027 / ADR 0030 / ADR 0033 schema portion: Git and
GitHub facts become typed evidence before any source-control mutation lane can
consume them as authority. The schemas do not add GitHub mutation endpoints,
canonical policy YAML, runner registration behavior, GitHub App provisioning,
or provider-state mutation.

HCS must not collapse these concepts:

- local repository state: path, repo root, `.git` location, current branch,
  `HEAD`, dirty state, sparse/partial clone state;
- worktree state: linked worktree path, attached branch, lock status, owning
  lease/session;
- remote/ref state: remote URL, fetch/push URL, remote `HEAD`, last fetch time,
  branch/tag/ref existence;
- Git identity: effective author email, signing key, signing program, config
  source and include order;
- SSH transport: host alias, identity source, agent/socket, known-host
  authority;
- GitHub credential source: human `gh`, SSH, GitHub App, Actions
  `GITHUB_TOKEN`, OIDC-issued token, MCP PAT/OAuth, app/web automation session;
- GitHub governance: rulesets, branch protection, required reviews, bypass
  actors, required checks, expected check source;
- Actions authority: workflow triggers, token permissions, runner labels,
  third-party action pinning, `pull_request_target`, environments, OIDC use;
- source-control continuity: protected named references, branch history,
  control start revision, and control lapse/restart evidence.

Landed direct Evidence subtypes:

- `GitRepositoryObservation`: repository identity rooted in the
  first-commit-SHA `repository_id`, with canonicalized `.git` / worktree paths
  and remote observation evidence refs.
- `GitRemoteObservation`: per-(repository, remote, ref) ref state with
  credential-stripped `remote_url`, `ref_kind`, fetch outcome, and
  `observed_commit_sha` present only when `ref_state == "present"`.
- `GitWorktreeObservation`: per-worktree path, attached branch, HEAD commit,
  lock state, and optional lease/session observation fields.
- `GitWorktreeInventoryObservation`: per-(repository, branch_ref) worktree list,
  with `complete` versus `partial_with_reason` inventory state.
- `GitBranchAncestryObservation`: `ancestry`, `patch_equivalence`, or `vacuous`
  proof using the discriminator-and-sibling pattern.
- `GitDirtyStateObservation`: per-worktree dirty-state observation with
  count invariants for uncommitted, untracked, and ignored paths.
- `PullRequestReceipt`: GitHub PR state receipt for `open`, `merged`, or
  `closed_unmerged`; PR title/body/review content is outside the strict schema.
- `PullRequestAbsenceReceipt`: positive absence receipt for "no PR exists" for
  a head/base ref pair.
- `RulesetObservation`: GitHub ruleset state, rule-axis summary, enforcement
  kind, bypass count, and provider observation method.
- `RepositoryIdentityReconciliationObservation`: five-plane repository identity check
  across local path, remote URL, SSH alias, signing principal, and credential
  account identity.
- `MCPCredentialAudienceObservation`: GitHub MCP credential audience
  (`read_only`, `mutation`, `unscoped`) with closed scope-token vocabulary.
- `StatusCheckSourceObservation`: check-source binding for repository, commit,
  check name, expected app/workflow source, conclusion, provider verification,
  and a required freshness window capped at 24 hours in this Phase 1 schema.

Landed BoundaryObservation subtype:

- `BranchProtectionObservation`: `boundary_dimension: "branch_protection"`
  typed payload for classic protection / ruleset / both / none / unknown,
  including review/check requirements, restriction posture, bypass count, and
  linear-history posture.

Landed value type:

- `GitHubMutationAuthority`: inline value type, not a standalone entity. It is
  carried by future operation-shape / `ApprovalGrant.scope` consumers and
  distinguishes `human_pat`, `github_app`, `oidc`, `actions_token`, and
  `unknown`.

Deferred names remain candidate-only until later ADR/schema lanes:
`GitConfigResolution`, `GitRefObservation`, `BranchDeletionProof`,
`GitHubRepositorySettingsObservation`, `WorkflowPolicyObservation`,
`CheckRunReceipt`, `GitHubCredentialObservation`,
`GitHubMcpSessionObservation`, `PullRequestReviewReceipt`, and
`SourceControlContinuityReceipt`.

Check results are not gateable from name and conclusion alone. Gateable check
evidence must cite source identity and freshness through
`StatusCheckSourceObservation`, and self-hosted workflow consumption composes
with `WorkflowRunReceipt` rather than replacing it.

## Provenance on every fact

Every `Evidence` record:

```json
{
  "schema_version": "0.10.0",
  "evidence_id": "evidence:example",
  "evidence_kind": "observation",
  "subject_refs": [
    {
      "subject_kind": "execution_context",
      "subject_id": "ctx:codex-cli:tool-call"
    }
  ],
  "source": "...",
  "observed_at": "...",
  "valid_until": null,
  "authority": "project-local | workspace-local | user-global | system | derived | sandbox-observation | host-observation | vendor-doc | installed-runtime | human-observed | self-asserted",
  "parser_version": "...",
  "confidence": "authoritative | high | best-effort | stale | unknown",
  "execution_context_id": "...",
  "payload_schema_version": "...",
  "payload": {
    "redacted_example": true
  },
  "redaction_mode": "redacted"
}
```

## Populated by

- `hcs-ontology-reviewer` subagent catches schema drift
- `hcs-schema-change` skill enforces "schema + docs + JSON Schema + tests move together"
- Phase 1 Thread D delivers remaining Zod schemas + JSON Schema + full entity
  docs

## References

- Research plan §2, §Appendix A
- Charter invariant 5 (secrets as references), 8 (sandbox authority downgrade), 9 (skills location)

## Change log

| Version | Date | Change |
|---------|------|--------|
| 1.21.0 | 2026-06-07 | Added `CommandShape` (ADR 0063 / D-061) — the third and last entity in the `PolicyRule → Capability → CommandShape` chain; a NON-MINTED Ring 0 typed plan (`argv` + `env` + `cwd` + `timeout_seconds`) rendered from an `OperationShape` (`operation_shape_ref` provenance). Central boundary: a typed plan, NOT an execution authorization — no execution semantics, no execute lane (charter inv. 7). Structurally embodies inv. 2 (typed `argv` vector, no shell-string field) and inv. 5 (`env` names + value-source references via a `secret_reference` / `execution_context_inherited` discriminated union, no resolved values); envelope `superRefine` enforces env-name uniqueness only. NO `audit_chain_link_hash`, NO producer-mint field, NO `evidence_refs`, NO `operation_class` echo; absent from the ADR 0057 mint scope. Reconciled the §Entities one-liner (dropped the stale "execution lane" — no such v1 field; the lane is reachable via `operation_shape_ref → OperationShape.execution_context_id`, and a direct echo is a deferred additive amendment). Deferred Ring-1 obligations: deprecated-verb render-refusal (inv. 11), cwd absolute-root confinement, SecretReference FK closure + env value resolution, operation_shape_ref FK existence, and the argv argument-class distinction (charter line 98, recorded as a seeded accept-and-trap fixture + a `forbidden-string-scan.sh` committed-fixture backstop extended to CommandShape argv/env/cwd). |
| 1.20.0 | 2026-05-29 | Added `Capability` (ADR 0062 / D-060) — a non-minted Ring 0 registry declaration of a known kernel operation and a structural peer of `PolicyRule`. Flat `.strict()` envelope: `operation_name` (lowercase dotted identifier of ≥2 segments, intentionally distinct from `operation_class` and verb-agnostic — no forbidden-literal denylist at Ring 0), `operation_class` (reuses `operationShapeOperationClassSchema`, never redefined), `capability_state` (`active`/`deprecated`/`retired` registry lifecycle; `deprecated`/`retired` render-refusal is enforced by the CommandShape renderer per charter inv. 11, not this schema), and `source_provenance` (binds to the capability-registry blob; `authority: 'capability_registry'` disjoint from `evidenceAuthoritySchema`; `source_registry_sha256` format-only at Ring 0, the digest-trust check is a Ring 1 capability-registration obligation). NO `audit_chain_link_hash`, NO producer-mint field, NO `evidence_refs`, NO observation-state enum, NO containment-class axis, NO `superRefine`; absent from the ADR 0057 mint scope. Documents the three-senses disambiguation: this entity (sense 1) is NOT the `AgentClient` containment-class axis (sense 2) nor the `BoundaryObservation` capability-state observation vocabulary (sense 3). |
| 1.19.0 | 2026-05-29 | Added `PolicyRule` (ADR 0060 / D-057) — the first non-minted Ring 0 entity. Typed shape of a single policy rule keyed to `OperationShape.operation_class`; tier / approval (discriminated union reusing `approvalGrantKindSchema` + `approvalGrantProducerSchema`) / lease-deletion-evidence flags / `valid_until_ceiling` (new narrow `isoDurationSchema` primitive in `common.ts`) / `source_provenance`. NO `audit_chain_link_hash`, NO producer-mint field, NO `evidence_refs`; absent from the ADR 0057 mint scope. Structural superRefine enforces charter inv. 6 forbidden non-escalability (`nonEscalableTiers` set) + `required_grant_kind ∈ allowed_grant_kinds`; never encodes the `operation_class → tier` mapping (live-policy content, inv. 1/10). Landing sets the live policy `policy_rule_schema_version` `null → '0.1.0'`. Two named Ring-1 dependencies: B-1 `Decision` attribution amendment, B-2 loader digest-verification. |
| 1.18.0 | 2026-05-19 | Landed the ADR 0058 / D-053 Decision.reason_kind schema update: `authority_chain_walk_depth_exceeded` is now a Zod-defined deny-only value without a `Decision.schema_version` bump. The reason kind is non-clearable (`required_grant_kind == null`; non-null rejects), producer-scoped to `mint_api` + `kernel_broker`, and typed Decision emission remains gated on a valid `operation_shape_ref`; non-operation and pure chain-validation overflows stay audit-rejection-only. `audit_chain_corruption_detected` remains cycle-only. |
| 1.17.0 | 2026-05-12 | Landed the ADR 0056 / D-046 Decision.reason_kind schema update: `operation_class_unregistered` and `audit_chain_corruption_detected` are now Zod-defined deny-only values without a `Decision.schema_version` bump. `operation_class_unregistered` is non-clearable (`required_grant_kind == null`; non-null rejects), while `Decision.operation_shape_ref` remains required with no nullable or sentinel OperationShape path. |
| 1.16.0 | 2026-05-11 | Added `Session` as the seventh foundational Ring 0 entity (ADR 0055 / D-044; second of two highest-coupling remaining M1 entities per workflow-sequencing investigation §Step 3 priority order). 12 envelope-only-kernel-set fields with NO field-level exceptions; YES `execution_context_id` at entity (Session is execution-context-BOUND mirroring WorkspaceContext, NOT Principal which is execution-context-independent); NO chain-walk envelope superRefine (typed-identity-envelope precedent). `sessionKindSchema = z.enum(['agent_invocation'])` at v1; `dashboard` + `system_task` are registry-canonical reservations. `sessionStateSchema = z.enum(['active', 'ended'])` — cardinality matches AgentClient/WorkspaceContext/Principal long-lived precedents (1 active + 1 terminal at v1) but value-name diverges intentionally (Session is transient invocation that ends; not long-lived identity that retires). NEW `kernel_session_resolver` producer (mirrors ADR 0037 + ADR 0054 precedents); Ring 1 implementation MUST enforce sandbox-source rejection + transitive chain-walk rejection per security N1 + N4 v2 absorptions. Same-record superRefines: `state ↔ ended_at` correlation + `ended_at >= started_at` temporal consistency. Closes 4 forward-reference typed FK targets: Lease.held_by_session_id (ADR 0052), Run.invoker_session_id (ADR 0053), ADR 0030 v2 owning_session_id, and "consuming/requesting session" references in ADRs 0031 v1 / 0051 v4 / 0052 / 0054 self-approval rejection rule + holder-only release rule. Lease.ts + Run.ts `.describe()` text updated to reference Session as typed FK target (NO shape change to entityIdSchema; consuming entities' schema_version values remain `'0.1.0'`). |
| 1.15.0 | 2026-05-11 | Added `Principal` as the sixth foundational Ring 0 entity (ADR 0054 / D-043; first entity drafted post-Step-1-source-landing). 9 envelope-only-kernel-set fields with NO field-level exceptions; NO `execution_context_id` at entity (mirrors AgentClient typed-identity-envelope; identity is execution-context-independent); NO chain-walk envelope superRefine (typed-identity-envelope precedent). `principalKindSchema = z.enum(['human', 'service_principal'])` at v1; `pseudo_principal` + `system_principal` are registry-canonical reservations. NEW `kernel_principal_resolver` producer (mirrors ADR 0037 `kernel_agent_client_resolver` precedent). Same-record `state ↔ valid_until` superRefine. Closes typed FK target for `ApprovalGrant.grantor_principal_ref` (no shape change — `entityIdSchema` both before and after; only semantic referent gains typed target); also closes future Session.principal_id, ADR 0025 requesting_principal_id, ADR 0036 cycle-history.md ratification verifier-identity. Structurally closes the ADR 0051 v4 §Self-approval rejection MT-Sec-2 zero-width-character evasion class via 4-step canonicalization-at-mint recipe (NFC + Cf-category strip + Unicode-aware lowercase fold + leading/trailing whitespace trim). TR39 confusable defense + Unicode version pinning reserved as future amendments. |
| 1.14.0 | 2026-05-11 | Added the workflow-sequencing investigation §Step 1 foundational Ring 0 entities (`Decision`, `WorkspaceContext`, `ApprovalGrant`, `Lease`, `Run`) per ADRs 0049–0053 / D-037–D-041. Each entity has its own `*SchemaVersionSchema` literal at `'0.1.0'`. The four authorization envelopes (Decision, ApprovalGrant, Lease, Run) commit envelope-level superRefines for charter inv. 18 chain-walk rejection; WorkspaceContext mirrors AgentClient as a typed-identity envelope. Cross-record refinements (Session/Decision/ExecutionContext equality, lease uniqueness, producer-disjointness, gateway re-derive, self-approval rejection, valid_until inheritance, revoke-wins race tiebreaker, sandbox-acquire rejection) remain Ring 1 mint API responsibility per registry §Cross-context enforcement layer §Schema validation alone is not an enforcement layer. |
| 1.13.1 | 2026-05-09 | Closed pre-existing source-vs-ledger drift on `OperationShape.schema_version`: source now exports `operationShapeSchemaVersionSchema = z.literal('0.2.0')` matching the registry ledger that has read `0.2.0` since Phase 2.2.2. ADR 0036 is the existing authority; no new ADR. |
| 1.13.0 | 2026-05-09 | Recorded ADR 0047 cleanup-plan composition first schema slice: `cleanup_plan` operation_class on `OperationShape` (with `mutation_scope: "none"` and `target_kind: "workspace"` narrowing), `cleanup_plan` summary_kind on `DerivedSummary` (with Zod refinement constraining `summary_text` to the closed hint-status enum), `qualityGateOperationClassSchema` reconciled with `operationShapeOperationClassSchema` (adds both `workspace_verify` and `cleanup_plan`). Additive enum widenings only; no entity schema-version bumps. Decision.reason_kind reservations and cleanup_scope enum remain registry-canonical pending Ring 1 mint API schema PR. |
| 1.12.0 | 2026-05-09 | Recorded the `evidenceAuthoritySchema` `self-asserted` enum extension closing ADR 0039 §Forward-looking observations #5 (Arch-N12 / Pol-N2 / Sec-N-v2-2). Added the §Phase 2.7 narrative paragraph documenting the `Evidence.schema_version` bump to `0.10.0` and the inv. 18 chain-walk linkage; updated the §Provenance on every fact JSON example to use `0.10.0` and the eleven-value authority union. |
| 1.11.1 | 2026-05-07 | Tightened Q-015 proof-bearing nested evidence ref docs and recorded `KnowledgeSource.schema_version` `0.2.0` for the ADR 0045 `threat_model` source-kind extension. |
| 1.11.0 | 2026-05-07 | Added ADR 0045 Q-015 backup-readiness Evidence subtype docs, `threat_model` KnowledgeSource source kind docs, and noted that this slice reuses existing Evidence subject kinds without an Evidence schema-version bump. |
| 1.10.0 | 2026-05-07 | Added ADR 0044 Q-014 project-substrate Evidence subtype docs, `project_substrate_contract` KnowledgeSource source kind docs, `project_admission_authority` BoundaryObservation docs, and noted the BoundaryObservation schema bump to `0.5.0`. |
| 1.9.0 | 2026-05-07 | Added ADR 0043 Q-013 credential-plane Evidence subtype docs for `CredentialAuthorityObservation` and `MachineIdentityBindingObservation`, and noted the Evidence schema bump to `0.9.0`. |
| 1.8.0 | 2026-05-07 | Added Phase 2.3.4 Q-010 remote-agent Evidence subtype docs and noted the Evidence schema bump to `0.8.0`. |
| 1.7.0 | 2026-05-06 | Added Phase 2.3.3 Q-006 source-control evidence subtype docs, documented `branch_protection`, `GitHubMutationAuthority`, noted the Evidence schema bump to `0.7.0` plus BoundaryObservation schema bump to `0.4.0`, and documented BoundaryObservation envelope-level provenance plus non-null freshness. |
| 1.6.0 | 2026-05-06 | Added Phase 2.3.2 Q-005 runner/check evidence subtype docs, documented `runner_isolation`, and noted the Evidence schema bump to `0.6.0` plus BoundaryObservation schema bump to `0.3.0`. |
| 1.5.0 | 2026-05-06 | Added Phase 2.3.1 `GitIdentityBinding` and `ToolProvenance` direct Evidence subtype docs and noted the Evidence schema bump to `0.5.0`. |
| 1.4.0 | 2026-05-06 | Added Phase 2.2.3 `BoundaryObservation` typed payload docs for `containment_class`, `filesystem_inheritance`, `filesystem_protected_paths`, and `mcp_canonical_authority`, including the `BoundaryObservation.schema_version` bump to `0.2.0`. |
| 1.3.0 | 2026-05-06 | Added the Phase 2.2.2 `OperationShape` schema docs with ADR 0036 deletion-authority fields. |
| 1.2.0 | 2026-05-06 | Added the ADR 0037 Phase 2.2.1 `ExecutionContext` containment-cache fields and documented the legacy `sandbox` projection as read-only. |
| 1.1.0 | 2026-05-06 | Added the ADR 0035 `QualityGate` Phase 2.1.4 schema docs and documented Evidence schema v0.4.0 subject-kind widening. |
| 1.0.0 | 2026-05-06 | Added the ADR 0019 `KnowledgeSource`, `KnowledgeChunk`, `CoordinationFact`, and `DerivedSummary` Phase 2.1.3 schema docs and documented Evidence schema v0.3.0 subject-kind widening. |
| 0.9.0 | 2026-05-05 | Added `VerificationCommandSpec` as the Phase 2.1.2 Ring 0 spec entity, widened `Evidence.subject_kind` with `verification_command_spec`, and documented Evidence schema v0.2.0 composition. |
| 0.8.0 | 2026-05-05 | Added `AgentClient` as the Phase 2.1.1 standalone Ring 0 entity and documented the `remote_cloud_agent` surface extension. |
| 0.7.0 | 2026-05-02 | Added the ADR 0022 `BoundaryObservation` envelope section. Cross-references the ontology-registry as the source of `boundary_dimension` values. |
| 0.6.0 | 2026-05-02 | Promoted `ExecutionContext` into the canonical entity list per ADR 0021 invariant 17 (charter v1.3.0). Header updated from "20 core" to "22 canonical". |
| 0.5.0 | 2026-05-01 | Added the ADR 0023 base `Evidence` schema documentation and updated the provenance example. |
| 0.4.0 | 2026-05-01 | Added version-control authority vocabulary from the Q-006 consult synthesis. |
| 0.3.0 | 2026-05-01 | Added compatibility/isolation vocabulary from the agentic tool isolation intake as Phase 1 schema reconciliation guidance. |
| 0.2.0 | 2026-05-01 | Added first shell/env Ring 0 schema docs for `ExecutionContext`, `EnvProvenance`, `CredentialSource`, and `StartupPhase`. |
| 0.1.0 | 2026-04-22 | Initial stub. Lists 20 entities; points to research plan for shape details. |
