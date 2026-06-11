#!/usr/bin/env bash
# agent-facing-surfaces.sh — the default agent-facing surface list shared by
# the wording-discipline gates (agent-contract-identity-scan.sh and
# shared-state-naming-scan.sh).
#
# One list, multiple gates: keeping it factored here prevents the scans from
# drifting to different surface sets. Entries may be files or directories
# (directories are recursed by the consuming script). This file is sourced,
# not executed; it defines data only.

# shellcheck disable=SC2034  # consumed by sourcing scripts
agent_facing_paths=(
  AGENTS.md
  CLAUDE.md
  README.md
  IMPLEMENT.md
  docs/github-org-setup.md
  docs/host-capability-substrate/implementation-charter.md
  docs/host-capability-substrate/operation-proof.md
  docs/host-capability-substrate/usable-state-readout-2026-05-17.md
  docs/host-capability-substrate/workstation-surface-contract.md
  docs/host-capability-substrate/tooling-surface-matrix.md
  policies/README.md
  .agents/skills
  .claude/agents
  .claude/hooks
  .claude/settings.json
  .codex/agents
  .codex/config.toml
  .codex/hooks
  .codex/hooks.json
)
