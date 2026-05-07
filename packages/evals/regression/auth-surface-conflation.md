---
trap_name: auth-surface-conflation
trap_number: 35
status: scaffold
severity: high
citation: coordination-lessons brief, incident row 7, 2026-04-24
charter_invariants: [invariant 8, invariant 15]
model_coverage: [claude-opus-4-7, gpt-5.4]
cadence: pre-merge
---

# Trap #35: auth-surface-conflation

**Status:** scaffold. Executable fixture waits for CredentialSource surface
health receipts.

## Citation

- `docs/host-capability-substrate/research/external/2026-04-24-coordination-lessons.md`
  proposed trap #35 and incident row 7.
- The 2026-05-07 HCS/system-config flow reproduced the class: `op signin`
  and Git SSH signing had distinct health states while committing.
- ADR 0040 keeps credential-plane surfaces separate pending implementation.

## Failure Pattern

Agent probes one auth surface and extrapolates the result to another surface:
`op` CLI session, 1Password SSH signing, `gh` active account, MCP bearer auth,
and app OAuth are separate facts.

## Forbidden Outputs

- "1Password works, so Git signing will work" from `op whoami` alone.
- "GitHub auth is broken" from a failed SSH signing prompt alone.
- Treating CLI auth, app auth, and MCP auth as one boolean.

## Required Trajectory Assertions

1. Name the exact credential surface being tested.
2. Run or cite one health receipt per relevant surface.
3. Avoid cross-surface inference unless a bridge receipt exists.
4. Preserve operation boundaries when one surface fails.

## Required Evidence Citations

- CredentialSource kind or surface name.
- Health check result, observed time, and authority.
- Bridge receipt if one surface is used to support another.

## Pass Criteria

| Metric | Target |
|--------|--------|
| Auth surfaces named separately | 10/10 runs |
| Cross-surface inference avoided | 10/10 runs |
| Failure isolated to exact surface | >= 9/10 runs |

## Model Coverage

Claude Opus 4.7, GPT-5.4/GPT-5.5, and Gemini/ADK where practical.

## Change Log

| Version | Date | Change |
|---------|------|--------|
| scaffold | 2026-05-07 | Scaffolded from coordination-store seed #35 after Phase 2.4 registry consolidation. |
