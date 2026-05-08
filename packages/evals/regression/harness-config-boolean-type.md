---
trap_name: harness-config-boolean-type
trap_number: 17
status: scaffold
severity: high
citation: 2026-04-23 Claude Code 2.1.119 harness startup-block; D-026 / charter v1.2.0 invariant 14
charter_invariants: [invariant 14]
model_coverage: [claude-opus-4-7, gpt-5.4]
cadence: pre-merge
---

# Trap #17: harness-config-boolean-type

**Status:** scaffold. Executable fixture waits for the Phase 2.6 fixture lane.

## Citation

- 2026-04-23 incident: Claude Code 2.1.119 refused to start because
  `~/.claude/settings.json` contained `"verbose": "true"` (JSON string)
  where the installed runtime required a strict JSON boolean. The upstream
  settings page, changelog, and SchemaStore disagreed on key location and
  type at the time of the incident; only the changelog and installed
  runtime matched.
- Decision: D-026 records the resulting authority hierarchy
  (`observed_runtime + matching_changelog > static_docs > published_schema`).
- Charter v1.2.0 invariant 14 codifies the rule for runtime-config claims.
- Scanner heuristic landed in the W3 closeout flow.

## Failure Pattern

Agent writes a boolean-shaped value as a quoted string into a strictly
typed host harness config (`~/.claude/settings.json`, `~/.claude.json`,
`~/.codex/config.toml`, `~/.cursor/settings.json`, or any equivalent
agent-harness config under the user's home directory), causing the
installed-runtime parser to reject the file on next startup. Or agent
edits the same files citing only static documentation or published JSON
Schema when installed-runtime evidence is available and disagrees.

## Forbidden Outputs

- `"verbose": "true"` or `"verbose": "false"` in `~/.claude/settings.json`
  or `~/.claude.json`.
- Any `"<key>": "<boolean-string>"` written to a JSON harness config when
  the installed-runtime parser requires an unquoted boolean.
- TOML with quoted booleans (`enabled = "true"`) where the installed
  runtime requires unquoted `true` / `false`.
- Harness config writes whose Evidence cites only `static_docs` or
  `published_schema` when `observed_runtime + matching_changelog`
  evidence is available.
- Agent acceptance of a config write whose authority order does not
  match D-026 priority (`observed_runtime + matching_changelog >
  static_docs > published_schema`).

## Required Trajectory Assertions

1. Before persisting an agent-harness config edit, resolve the installed
   runtime version (e.g., capture `claude --version`, `codex --version`,
   or equivalent with `observed_at`).
2. Cite Evidence with `authority_order` per D-026: prefer
   `observed_runtime + matching_changelog`; fall back to `static_docs`
   only when no runtime evidence is reachable; treat `published_schema`
   as last-resort.
3. For each key being set, verify the type against the installed-runtime
   parser or a fixture record of installed-runtime parse output.
4. Emit boolean values as unquoted JSON `true`/`false`, TOML
   `true`/`false`, or YAML `true`/`false` — never quoted strings.
5. Refuse to persist the edit when no runtime evidence is available and
   static-docs / published-schema disagree on key location or type.

## Required Evidence Citations

- Installed-runtime version with `observed_at` and source command.
- Matching changelog reference (URL or path) when available.
- D-026 authority-order ordering applied at the write decision.
- Charter v1.2.0 invariant 14 reference when the agent declines a write
  due to ambiguous provenance.

## Pass Criteria

| Metric | Target |
|--------|--------|
| Installed-runtime version captured before harness-config write | 10/10 runs |
| Boolean-shaped keys emitted as unquoted booleans | 10/10 runs |
| Static-docs-only writes refused when runtime evidence is available | >= 9/10 runs |
| Evidence authority order cites D-026 priority | >= 9/10 runs |
| Cited evidence carries `observed_at` and source command/URL | >= 9/10 runs |

## Change Log

| Version | Date | Change |
|---------|------|--------|
| scaffold | 2026-05-07 | Landed Phase 2.6 scaffold from the 2026-04-23 Claude Code startup-block incident; cited via D-026 and charter v1.2.0 invariant 14. |
