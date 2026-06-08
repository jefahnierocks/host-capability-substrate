# W-D Autonomy Envelope Proposal

Directive: `NASH-DIR-HCS-CODEX-ORIENT-2026-06-04`
Status: scratch proposal only. Not an applied change.

## Status

The current repo has strong boundary rules but no compact autonomy envelope for
the new Rego direction. This proposal adds one HCS-local AGENTS.md section that
separates safe agent progress from operator-gated work.

## Evidence

- `AGENTS.md:87-101` requires target ring identification, ADR confirmation,
  scoped diffs, tests for behavior changes, `just verify`, decision updates for
  non-obvious choices, and traps for model/tooling failures.
- `docs/host-capability-substrate/implementation-charter.md:42-54` keeps policy
  out of adapters/hooks, command strings out of primary intent, audit internal,
  forbidden non-escalable, and execute lane blocked until the approval/dashboard/
  audit/lease stack exists.
- `docs/host-capability-substrate/implementation-charter.md:60` keeps live policy,
  runtime state, audit archives, tokens, and resolved secret values outside this
  repo.
- `IMPLEMENT.md:80-96` defines change classes A-I and marks mutation/approval/
  execution as blocked until the required stack exists.
- `IMPLEMENT.md:117-126` lists reviewer requirements for schema, policy,
  hook/security, agent-definition, and ADR changes.
- `docs/host-capability-substrate/workstation-surface-contract.md:14-19` says
  external directive packets can inform HCS work, but adopted rules must be
  written back into HCS-owned artifacts before they become default context.
- `docs/host-capability-substrate/workstation-surface-contract.md:50-52` says
  adapters, hooks, and agent docs translate or observe; Ring 1 owns decisions
  once the service exists.

## Proposed AGENTS.md Section

Add after `Required workflow` or before `Validation commands`:

```markdown
## Autonomy envelope

Default to the narrowest class that can produce useful progress.

### Decide and proceed

Allowed without another operator round when the work stays measurement-only or
docs/scratch-only:

- read-only repo investigation;
- scratch proposals under HCS-owned docs/research paths;
- Phase-0b schema/telemetry analysis that does not change hook behavior;
- evidence collection that is names-only, existence-only, classified, or hashed;
- docs wording that restates already accepted HCS decisions without changing
  policy, hook behavior, schema semantics, or runtime state.

### Decide and log

Allowed to draft, but record the decision/proposal path and do not apply as
runtime behavior without a follow-up operator gate:

- classifier scaffolding;
- Rego policy artifacts authored as proposals;
- generated/hash-bound policy-cache design;
- CI check proposals for policy/restatement drift;
- ADR or decision-ledger drafts that change policy language, restatement
  mechanics, or classifier input/output contracts.

### Escalate

Stop for operator approval before:

- any allow-to-block hook change;
- any hard-decision cache consumed by hooks;
- Ring 1 classifier enforcement wiring;
- execute-lane work, including leases, approvals, dashboard review, audit-write
  paths, broker execution, provider mutation, or command rendering for mutation;
- copying or runtime-reading parent-org policy files;
- editing system-config live policy or user-global Codex/Claude config;
- reading, echoing, transporting, or resolving secret values.
```

## Review Burden

- This is an AGENTS.md contract change, so it is Ring 3 docs.
- It changes agent-facing behavior, not code, and should run:
  - `just agent-contract-identity-scan`
  - `just verify`
- Because it mentions policy/hook boundaries, request `hcs-architect`,
  `hcs-policy-reviewer`, and `hcs-security-reviewer` objections before merge.
- If hook wording changes in the same PR, add `hcs-hook-integrator`.

## Proposal Path

This file is the W-D proposal path:
`docs/host-capability-substrate/research/local/2026-06-04-hcs-codex-orientation/W-D-autonomy-envelope-proposal.md`

## Boundary Adherence

No AGENTS.md edit was applied. The envelope is a proposed patch block only.

## Open Operator Decisions

- Whether to merge this into AGENTS.md directly as a small Ring 3 docs PR or
  first create an ADR/decision row for the Rego restatement lane.
- Whether "decide and proceed" should include narrow schema edits, or stay
  docs/scratch/measurement-only until the next execution directive.
