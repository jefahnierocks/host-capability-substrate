# IMPLEMENT.md — Host Capability Substrate


Follow `PLAN.md` milestone by milestone.

## Rules

- Do not skip validation.
- If validation fails, fix before continuing.
- Keep each PR to one milestone (ideally one ring).
- Update `DECISIONS.md` when making a tradeoff.
- Update docs whenever schema, policy, or adapter behavior changes.
- Meta-ADRs are permitted when they govern process or sequencing, such as a
  charter amendment wave; they must stay `proposed` until human approval and
  must not bundle the underlying charter/schema/policy change.
- Per-surface capability-state vocabulary is canonical in
  `docs/host-capability-substrate/dashboard-contracts.md`; ADRs may reference
  it but must not introduce competing state lists.
- Agent-facing contract/restatement changes update the inventory or readout
  when status changes and must pass `just agent-contract-identity-scan`.
- Do not implement execution, approvals, sandbox, or audit-write endpoints unless the current milestone explicitly says so.
- Honor the implementation charter at `docs/host-capability-substrate/implementation-charter.md`.

## Per-PR checklist (mirrors PR template)

**Ring changed:**

- [ ] Ontology/schema
- [ ] Kernel
- [ ] Adapter
- [ ] Dashboard
- [ ] Hook
- [ ] Eval
- [ ] Docs

**Boundary checks:**

- [ ] No policy duplicated into adapter/hook
- [ ] No universal shell execution added
- [ ] No audit-write agent endpoint added
- [ ] `OperationShape` remains upstream of `CommandShape`
- [ ] Evidence includes provenance/freshness where applicable
- [ ] Dashboard impact considered
- [ ] **Citation discipline** — a citation used as *authorization* must establish
      that the document **authorizes** the thing, not merely that it mentions it.
      Quote the ADR's own scope statement and show the cited line falls inside
      it. Checking the cited section's heading is NOT sufficient: D-085 quoted an
      `adr/0057` line sitting under "This ADR explicitly does not authorize:",
      and D-086 then cited `adr/0060` §Provenance verification — correct heading,
      correct text — while that same ADR's §Out of scope declined to authorize
      the implementation. Two failures, two different locations, one property.
- [ ] **Precedence respected** — `AGENTS.md` §Source of truth ranks `adr/` above
      `IMPLEMENT.md`. A rule stated in an accepted ADR is not relieved by
      editing `IMPLEMENT.md`; amend the ADR, then restate below it.
- [ ] **Charter text quoted verbatim or untouched** — charter edits are their own
      class and do not ride in another PR. (D-085: `charter:54`'s "is live" was
      silently weakened to "exist".)

**Validation:**

```
just verify
just test <package>
```

Scoped test targets exist only as listed in the justfile `test` recipe
(`schemas` today); unknown targets fail loudly rather than silently running the
full suite. If a scoped target does not exist yet, name the command that
actually ran.

**Agent use:**

- Implementer: (role from AGENTS.md table)
- Reviewer: (different role)
- Subagents: (optional)

## Producer/critic loop

Good:

```
1. Human chooses milestone and file ownership.
2. One agent writes implementation in one narrow area.
3. A different agent reviews boundary/policy/security implications.
4. Implementer fixes concrete issues.
5. Eval subagents run regression review.
6. Human approves ADR/policy/schema changes.
7. Merge.
```

Bad:

```
Two agents edit schemas, policy, adapters, docs in parallel.
```

Exactly one owner agent + one critic agent per PR. Critic does not edit without a follow-up assignment.

## Change classes

Every task declares its class:

```
A: docs/research only
B: schema only
C: policy only
D: kernel read path
E: adapter read path
F: dashboard read path
G: hook integration
H: eval/regression
I: mutation/approval/execution — blocked until approval grants + audit + dashboard + leases all exist
J: enforcement tooling — scripts/ci/**, .github/workflows/**, the justfile, or scripts/ci/verify.sh gate wiring
```

Class I is unmergeable until Milestone M4-Month-4 per the research plan
(charter invariant 7). Enforcement today is operator review plus the per-PR
checklist — no CI gate checks change class yet; whether to build one is an
open operator decision.

## Weekly review (≤30 minutes)

1. What traps did agents hit this week?
2. Which policy/hook/runbook duplicated knowledge?
3. Which cache/evidence answer was stale or ambiguous?
4. Which dashboard view would have made a decision easier?
5. Which `AGENTS.md`/`CLAUDE.md` rule should be added because a mistake repeated?

Update `AGENTS.md` only after repeated mistakes. Add traps to the regression corpus when a new class surfaces.

## When uncertain

- About CLI behavior → add an evidence/fixture path, do not guess
- About schema shape → open an ADR before implementing; require `hcs-ontology-reviewer` objections
- About policy tier → ask in `DECISIONS.md` pending queue, do not default-allow
- About ring boundary → consult the charter; if ambiguous, the stricter ring wins
- About skill placement → canonical is `.agents/skills/`; only add `.claude/skills/` wrapper if Claude Code cannot discover the canonical
- About runtime state → it does not belong in the repo; target `~/Library/Application Support/host-capability-substrate/` and `~/Library/Logs/host-capability-substrate/`

## Required subagent reviews

Per charter v1.6.0:

- PR touches any `packages/schemas/` file or `docs/host-capability-substrate/ontology.md` → `hcs-ontology-reviewer` objections required
- PR touches `system-config/policies/host-capability-substrate/` (via workspace) or any file that classifies operations → `hcs-policy-reviewer` objections required
- PR touches `.claude/settings.json`, `.claude/hooks/`, `.codex/config.toml`, `.codex/hooks.json`, `.codex/hooks/`, or any adapter security posture → `hcs-security-reviewer` objections required
- PR touches `.claude/hooks/`, `.codex/hooks/`, `.codex/hooks.json`, or adapter hook documentation → `hcs-hook-integrator` objections required
- PR touches `.claude/agents/**` or `.codex/agents/**` → `hcs-architect` objections required; add `hcs-security-reviewer` when permissions, hook posture, or secret-handling instructions change
- PR adds or edits ADRs → `hcs-architect` review required
- PR changes enforcement tooling (class J) — `scripts/ci/**`, `.github/workflows/**`, the `justfile`, or `scripts/ci/verify.sh` gate wiring — → `hcs-architect` objections required. Add `hcs-security-reviewer` when the change touches any invariant-enforcing gate: the secret-defense gates (`no-live-secrets`, `forbidden-string-scan` — which also carries the audit-write-exposure, universal-shell, and hook-thinness stanzas), `no-runtime-state-in-repo`, `snapshot-binding-check` (the integrity gate backing the generated-snapshot location exception), sandbox or permission-adjacent gates, or hook installation. This mandate composes with — and never displaces — the existing required-review rules: files that classify operations (for example `policy-lint.sh` and `snapshot-binding-check`) still require `hcs-policy-reviewer` objections, and changes engaging schema enums or ontology still require `hcs-ontology-reviewer` objections. *(v1.5.0; ADR 0073)*
