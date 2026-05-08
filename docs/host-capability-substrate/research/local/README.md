---
title: HCS local research artifacts
category: research
component: host_capability_substrate
status: active
version: 1.13.0
last_updated: 2026-05-07
tags: [research, local, host-evidence, github, version-control, quality-management, codex, worktree, branch-cleanup, diagnostics, workspace-context, isolation, ontology, process-inspection, project-substrate, runner-substrate, backup-readiness, runner-readiness, alert-delivery, regression-corpus, adr-0039, charter-v1-4-0]
priority: medium
---

# Local research artifacts

This directory preserves first-party host investigations that inform HCS design.
These reports are observed evidence and planning intake, not accepted
architecture decisions. Reconciled decisions belong in `DECISIONS.md`, ADRs,
the implementation charter, and schemas.

## Status discipline

Local research can include runtime observations, installed config shapes,
command output summaries, and repo state. Treat each observation as freshness
bounded. If runtime state changes, the newer probed evidence wins.

Do not commit resolved secret values, private key material, or raw process
arguments that contain credential-shaped strings. Use secret references,
existence-only checks, names-only lists, hashes, or classified/redacted
summaries.

## Contents

| File | Source date | Scope |
|---|---:|---|
| `2026-04-29-github-version-control-agentic-surface.md` | 2026-04-29 | Deeper local and GitHub API investigation of GitHub, Git, SSH, MCP, repo settings, Actions, and local remote identity surfaces. Queues Q-006 for the GitHub/version-control authority model. |
| `2026-04-29-quality-management-synthesis.md` | 2026-04-29 | Synthesis of two `/private/tmp` reports on research method and HCS quality-management needs across macOS filesystem/app boundaries, Git/GitHub, package managers, multiple identities, and boundary uncertainty. Queues Q-007. |
| `2026-04-30-codex-scopecam-exchange-synthesis.md` | 2026-04-30 | Synthesis of a user-submitted Codex/ScopeCam exchange report covering tool-symptom diagnosis, execution-mode conflation, destructive branch cleanup, worktree ownership, branch-flow drift, auth probes, PR body quoting, and secret-safe diagnostics. Queues Q-008. |
| `2026-04-30-hcs-evidence-planning-synthesis.md` | 2026-04-30 | Synthesis of a user-submitted HCS evidence/planning report covering runtime diagnostics, the D-028 secret contract, workspace manifests, safe process inspection, docs cleanup classification, and claim reconciliation. Queues Q-009. |
| `2026-05-01-agentic-tool-isolation-synthesis.md` | 2026-05-01 | Synthesis of a user-submitted agentic coding tool isolation report. Separates permission gating, worktree/file isolation, local kernel sandboxing, container/VM isolation, and remote cloud execution. Queues Q-010. |
| `2026-05-01-version-control-authority-consult-synthesis.md` | 2026-05-01 | Synthesis of a user-submitted version-control authority consult. Refines Q-006 around source-control continuity, expected check source identity, branch deletion proof, Actions posture, and split GitHub credential surfaces. |
| `2026-05-01-ontology-promotion-receipt-dedupe-plan.md` | 2026-05-01 | Cross-Q planning document for ontology promotion buckets, candidate receipt dedupe, naming discipline, and dependency order before additional Ring 0 schema work. Queues Q-011. |
| `2026-05-01-codex-import-dialog-hang.md` | 2026-05-01 | Live Codex macOS app import-dialog hang investigation. Corrects stale repo-target assumptions, records app/log/process evidence, and reinforces Q-009 safe process inspection for app-managed MCP children. |
| `2026-05-05-credential-plane-integration-synthesis.md` | 2026-05-05 | Synthesis of the 1Password credential-plane research plus Citadel guidance. Records Q-013 acceptance via ADR 0040 at posture level only, blocks implementation pending follow-on acceptance, and defines the approval contract for future HCS-side implementation. |
| `2026-05-06-phase-2-7-deferred-lane-sequencing-plan.md` | 2026-05-06 | Docs-only sequencing plan tying the accepted Q-013, Q-014, and Q-015 deferred implementation lanes together. Keeps ADR 0038 intact, records the landed first schema/evidence slices plus the Citadel readiness compatibility follow-up, and requires separate accepted authority for follow-on runtime, policy, gate, provider, dashboard, adapter, or execution lanes. |
| `2026-05-06-q-013-implementation-lane-plan.md` | 2026-05-06 | Q-013 lane plan updated through ADR 0043 acceptance and schema landing. Records landed credential-plane Ring 0 evidence scope plus deferred follow-ups, while keeping policy, broker, runtime, reconciler, OpenTofu, service-account, vault, provider mutation, operation registration, and credential material work blocked. |
| `2026-05-06-project-substrate-compatibility-synthesis.md` | 2026-05-06 | Synthesis of Citadel PR #37 project-substrate admission standard. Maps contract fields to HCS vocabulary, records ADR 0041 accepted posture around ADR 0036 composition / evidence cohorts / sequencing, and blocks schema, policy, runner, Proxmox, OpenTofu, identity, adapter, dashboard, hook, project workload, and runtime implementation until follow-on implementation acceptance. |
| `2026-05-06-q-014-implementation-lane-plan.md` | 2026-05-06 | Q-014 lane plan updated through ADR 0044 acceptance and schema landing. Records landed project-substrate Ring 0 evidence scope plus deferred follow-ups, while keeping policy, validator, adapter, dashboard, hook, runner, Proxmox, OpenTofu, identity issuance, project workload, provider mutation, gate behavior, and runtime work blocked. |
| `2026-05-06-q-015-backup-readiness-intake.md` | 2026-05-06 | Intake and HCS framing for backup-readiness posture. Preserves the advisor directive, records ADR 0042 accepted posture, keeps `pending` -> `configured` -> `usable` -> `ready` lifecycle discipline, and blocks schema, registry, policy, validator, adapter, dashboard, hook, runner, Proxmox, Hetzner, OpenTofu, machine-identity, backup/restore execution, project workload, and runtime work pending a future implementation ADR. |
| `2026-05-07-q-015-implementation-lane-plan.md` | 2026-05-07 | Q-015 lane plan updated through ADR 0045 acceptance and schema landing. Records landed Ring 0 backup-readiness evidence scope plus deferred follow-ups, while keeping policy, validator, adapter, dashboard, hook, runner, Proxmox, Hetzner, OpenTofu, machine-identity, backup/restore execution, project workload, provider mutation, gate behavior, and runtime work blocked. |
| `2026-05-07-citadel-readiness-compatibility-followup.md` | 2026-05-07 | Follow-up Citadel compatibility intake for runner readiness, backup readiness lifecycle discipline, alert-delivery evidence, file/meta versus VM/CT image backup distinction, and cross-repo evidence receipts. Records future-policy/schema inputs only; no live readiness, schema, ontology, policy, or runtime authority. |
| `2026-05-07-trap-scaffold-audit.md` | 2026-05-07 | Phase 2.6 audit classifying the 22 unscaffolded seeds in `packages/evals/regression/seed.md` against the no-synthetic-traps rule in `.agents/skills/hcs-regression-trap/SKILL.md`. Two seeds are Ready (#17, #44), five are Blocked on Codex/ScopeCam transcript prerequisites (#39–#43), fifteen are No-citation (#1–#15). Docs only; no scaffold authoring, no seed-md changes, no schema or policy effect. |
| `2026-05-07-adr-0039-forward-looking-obs-audit.md` | 2026-05-07 | Audit walking the 13 forward-looking observations deferred by ADR 0039 (charter v1.4.0 amendment) against landed Phase 2.x work. Two Owed (#1 ADR 0019 v3 four-class alignment; #3 registry §Producer-vs-kernel-set five-FK extension), one Effectively handled (#2), one Active sequencing dependency (#5 evidenceAuthoritySchema enum extension), five Deferred (#4, #6, #7, #8, #9), two Closed at acceptance (#10, #11). Docs only; no schema, registry, charter, or policy effect. |

## Change Log

| Version | Date | Change |
|---|---:|---|
| 1.13.0 | 2026-05-07 | Added the ADR 0039 forward-looking observations absorption audit memo. |
| 1.12.0 | 2026-05-07 | Added the Phase 2.6 trap scaffold completeness audit memo. |
| 1.11.1 | 2026-05-07 | Updated the Phase 2.7 sequencing-plan index entry after adding the Citadel readiness compatibility follow-up. |
| 1.11.0 | 2026-05-07 | Added Citadel readiness compatibility follow-up and updated Q-015 intake/lane pointers. |
| 1.10.9 | 2026-05-07 | Updated Q-013 and Q-014 implementation-lane index entries after ADR 0043 and ADR 0044 schema/evidence landing. |
| 1.10.8 | 2026-05-07 | Updated the Phase 2.7 sequencing-plan index entry after ADR 0045 schema/evidence landing and follow-on lane reblocking. |
| 1.10.7 | 2026-05-07 | Updated the Q-015 implementation-lane index entry after ADR 0045 acceptance and schema landing. |
| 1.10.6 | 2026-05-07 | Added the Q-015 implementation-lane plan after ADR 0042 acceptance. |
| 1.10.5 | 2026-05-07 | Added Q-015 backup-readiness intake to the index and updated the Phase 2.7 sequencing description after ADR 0042 acceptance. |
| 1.10.4 | 2026-05-06 | Added the Phase 2.7 deferred-lane sequencing plan for Q-013 and Q-014. |
| 1.10.3 | 2026-05-06 | Added the Q-013 implementation-lane plan and corrected this index version. |
| 1.10.2 | 2026-05-06 | Aligned project-substrate synthesis to accepted ADR 0041 and added the Q-014 implementation-lane plan. |
| 1.10.1 | 2026-05-06 | Noted Q-014 pre-deliberation commitments in the project-substrate synthesis. |
| 1.10.0 | 2026-05-06 | Added project-substrate compatibility synthesis and Q-014 planning posture. |
| 1.9.1 | 2026-05-05 | Noted the credential-plane synthesis approval contract for future HCS-side implementation. |
| 1.9.0 | 2026-05-05 | Updated credential-plane synthesis to accepted-posture state after ADR 0040 acceptance; implementation remains blocked. |
| 1.8.0 | 2026-05-05 | Added credential-plane integration synthesis and linked Q-013 planning posture. |
| 1.7.0 | 2026-05-01 | Added Codex import-dialog hang and safe process-inspection memo. |
| 1.6.0 | 2026-05-01 | Added ontology promotion and receipt dedupe plan and linked Q-011. |
| 1.5.0 | 2026-05-01 | Added version-control authority consult synthesis and Q-006 refinement. |
| 1.4.0 | 2026-05-01 | Added agentic tool isolation synthesis and linked Q-010. |
| 1.3.0 | 2026-04-30 | Added HCS evidence/planning synthesis and linked Q-009. |
| 1.2.0 | 2026-04-30 | Added Codex/ScopeCam exchange synthesis and linked Q-008. |
| 1.1.0 | 2026-04-29 | Added quality-management synthesis from the two `/private/tmp` reports and linked Q-007. |
| 1.0.0 | 2026-04-29 | Initial local research index. |
