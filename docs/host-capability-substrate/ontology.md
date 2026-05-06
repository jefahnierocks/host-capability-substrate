---
title: HCS Ontology
category: reference
component: host_capability_substrate
status: partial
version: 1.1.0
last_updated: 2026-05-06
tags: [ontology, entities, schemas, evidence, execution-context, agent-client, verification-command-spec, knowledge-source, knowledge-chunk, coordination-fact, derived-summary, quality-gate, isolation, github, version-control, boundary-observation]
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
per ADR 0035 / ADR 0038.

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
CommandShape         argv vector + env profile + execution lane (rendered from Operation)
VerificationCommandSpec producer-asserted workspace verify command spec
Evidence             a fact with provenance, freshness, authority, confidence
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
- `command_shape` is an OperationShape-like payload local to this entity until
  the canonical `OperationShape` schema lands. It carries
  `operation_class: "workspace_verify"`, `mutation_scope:
  "verify_workspace"`, a typed `argv` array, and `env_refs` entries that name
  environment variables without values.
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
`OperationShape.deletion_authority_source_ref` extension.

### `KnowledgeSource`

Source: `packages/schemas/src/entities/knowledge-source.ts`

Registers a canonical source for the retrieval index. `KnowledgeSource` is a
Ring 0 no-suffix peer entity from ADR 0019 and ADR 0038 Phase 2.1.3. It names
what was indexed and the source-content hash observed by the kernel; it is not
a policy rule, live source of truth, or gate authority by itself.

Key fields:

- `knowledge_source_id` is the stable local identifier.
- `uri` is the canonical location string for the source.
- `content_hash` is a `sha256:` digest of the source content at index time.
- `source_kind` is one of `charter`, `adr`, `decision_ledger`, `runbook`,
  `vendor_doc`, `audit_summary`, `schema`, `code`, `audit_profile_yaml`, or
  `cycle_history`.
- `security_label` is `public`, `internal`, `confidential`,
  `secret_pointer`, or `secret_referenced`. `secret_pointer` covers
  reference-form pointers such as `op://...`; resolved secret material remains
  forbidden.
- `indexable`, `indexed_at`, `execution_context_id`, `target_refs`, and
  `evidence_refs` bind the source to index state, context, and provenance.

The Q-014 `project_substrate_contract` source kind is intentionally not present
in this Phase 2.1.3 schema slice; ADR 0041 keeps that as a future Phase 2.7
implementation-lane candidate.

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
  the projection.
- `allowed_for_gate`, `promoted_at`, and `promotion_grant_id` are kernel-set
  promotion fields.
- `execution_context_id` and `target_refs` bind the summary to context.

Promoted summaries cannot cite sandbox-observation authority or
`KnowledgeChunk` records in `derived_from`; this encodes the ADR 0019
promotion-laundering guard at the schema layer.

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

The legacy `evidenceRefSchema` remains as a lightweight reference or embedded
provenance preview for entities that have not yet been migrated to full
Evidence records. It is not a competing fact model.

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

`BoundaryObservation` does not introduce a new policy tier, dashboard route,
runtime probe, or mutation operation. Domain payload schemas, gate-behavior
rules for stale or contradictory observations, and dashboard rendering are
follow-up Q-007 work.

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

The 2026-05-01 version-control authority consult refines Q-006 but does not add
schema by itself. It strengthens the Milestone 1 goal that Git/GitHub facts
should be modeled as typed evidence before they become mutation authority.

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

Candidate evidence/receipt names for Phase 1 reconciliation:

- `GitRepositoryObservation`
- `GitRemoteObservation`
- `GitConfigResolution`
- `GitIdentityBinding`
- `GitWorktreeObservation`
- `GitRefObservation`
- `GitBranchAncestryObservation`
- `BranchDeletionProof`
- `GitHubRepositorySettingsObservation`
- `GitHubRulesetObservation`
- `BranchProtectionObservation`
- `WorkflowPolicyObservation`
- `CheckRunReceipt`
- `StatusCheckSourceObservation`
- `GitHubCredentialObservation`
- `GitHubMcpSessionObservation`
- `PullRequestReceipt`
- `PullRequestReviewReceipt`
- `SourceControlContinuityReceipt`

Candidate `BranchDeletionProof` should include repository identity, worktree
attachment, fresh remote state, ancestry or patch-equivalence proof, dirty-state
check, PR state, lease state, and human review for force/remote/protected or
ambiguous deletion.

Check results should not be gateable from name and conclusion alone. Gateable
check evidence should include source app/integration, commit SHA, workflow path
or provider object, observed time, and freshness.

Do not turn these names into operation endpoints or policy tiers before Q-006
decides evidence subtype versus standalone entity shape.

## Provenance on every fact

Every `Evidence` record:

```json
{
  "schema_version": "0.4.0",
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
  "authority": "project-local | workspace-local | user-global | system | derived | sandbox-observation | host-observation | vendor-doc | installed-runtime | human-observed",
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
