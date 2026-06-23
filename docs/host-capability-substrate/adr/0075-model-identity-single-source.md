---
adr_number: 0075
title: "Single-source the model/tool identity; pin aliases, not exact strings; de-name the model from charter inv. 12"
status: accepted
date: 2026-06-15
charter_version: 1.5.0
tags: [tool-baseline, model-identity, charter-amendment, inv-12, inv-14, single-source, alias-pinning, eval-corpus, churn-resilience]
---

# ADR 0075: Single-source the model/tool identity; pin aliases, not exact strings; de-name the model from charter inv. 12

## Status

`accepted`

## Date

2026-06-15

## Charter version

Written against charter v1.5.0. This ADR **proposes a charter amendment** to
invariant 12; on acceptance it bumps the charter (per §Change policy, in its own
charter-only PR) and requires `hcs-policy-reviewer` + `hcs-security-reviewer`
objections plus human approval.

## Context

**The forcing function.** Anthropic shipped Fable 5; the repo did a careful
two-step re-baseline *to* it (D-071 record + D-072 pinning the exact string
`claude-fable-5[1m]` in `.claude/settings.json`); four days later Fable 5 was
retracted, forcing the inverse re-baseline **D-075** (PR #69, merged), which
reverted the pin to the resilient `opus` alias. A model whose entire lifecycle
in this repo was five days exposed a standing structural weakness that D-075
fixed tactically but not structurally: **the repo encodes a specific model
identity by hand across five authority tiers and ~10 locations**, so every model
change requires a manual sweep across all of them, and the sweeps keep coming up
short.

The five tiers, today (post-D-075):

1. **Harness pins** — `.claude/settings.json` `model` key (now the `opus` alias,
   per D-075) + six reviewer subagent `model: opus` pins.
2. **Contract prose** — `AGENTS.md`, `CLAUDE.md`, `README.md` §Tool baseline
   (swept to Opus by D-075).
3. **A binding invariant** — charter inv. 12, which still hard-codes
   `Claude Opus 4.7`.
4. **A reference doc** — `tooling-surface-matrix.md:20,247` (still `Opus 4.7`).
5. **The eval corpus** — `model_coverage` frontmatter in the regression traps
   (38 files still `claude-opus-4-7`, 2 already `claude-opus-4-8`).

The drift is measurable: **`Opus 4.7` / `claude-opus-4-7` appears 85 times across
46 binding files** (tracked Markdown/TOML/YAML, excluding this ADR, `research/`,
and `.logs/`) — two baselines after the live model moved off 4.7. At the D-075
moment the repo named *three* Claude generations (4.7, 4.8, Fable 5) as "the
baseline" somewhere. **This is a recurring class: a single-sourceable fact
hand-copied across many surfaces, which drifts.** (A related instance is the
permission-posture-as-queryable-fact item — a `PLAN.md` backlog note surfaced by
the ADR 0074 handoff work — where a fact that should be machine-consultable is not
single-sourced at all.) Model identity is the fastest-churning instance.

Two charter invariants already point at the fix but are not yet applied here:

- **inv. 14** (config-spec claims require authority provenance; observed runtime
  > static docs > schema > model memory) — the live model identity should be
  *observed* and recorded once, not hand-restated.
- **inv. 12** (tool version baseline is explicit) — correct to require an explicit
  baseline, but it hard-codes a *specific model name* (`Opus 4.7`) into invariant
  text, which is why the invariant is perpetually stale. A binding rule should not
  carry a value with a five-day half-life.

D-075 also produced the concrete pinning lesson this ADR generalizes: D-072 had
moved the settings pin *from* the resilient `opus` alias *to* the exact string
`claude-fable-5[1m]`, and that exact string is what the retraction broke; D-075
reverted to the alias. The installed CLI's own `--model` help documents aliases
(`opus`, `sonnet`, …) as "an alias for the latest model" — the alias absorbs
retraction/rename; an exact string does not. (Per inv. 14, that alias behavior is
a static-help claim to be verified against the installed build before relying on
it; the installed CLI 2.1.177 `--help` notably still lists a `fable` alias for a
retracted model, so client help lags server-side reality — observed runtime
governs.)

## Options considered

### Facet 1 — where the live model/tool identity lives

**Option A (chosen): single-source it; other surfaces point, never restate.** One
canonical, observed-runtime-sourced statement of the current baseline lives in
`AGENTS.md` §Tool baseline (already the fullest), anchored to its latest
`DECISIONS.md` re-baseline row (the row is the **dated authority of record**;
`AGENTS.md` restates it and must match). `CLAUDE.md` and `README.md` stop
restating the model name + CLI version + D-number and instead point ("see
`AGENTS.md` §Tool baseline"). A model change then edits one prose site + a new
ledger row — not five tiers; the alias pin (Facet 2) needs no edit at all.

- **Pros:** one update site for the live fact; eliminates the drift class;
  consistent with inv. 14 and with the repo's canonical-then-point discipline
  (live policy canonical in system-config; `.cursor/rules`/`WARP.md` pointer-only;
  the tooling-surface-matrix's own "canonical or generated" column).
- **Cons:** a reader of `CLAUDE.md`/`README.md` follows one hop. Acceptable —
  those are lighter surfaces; `AGENTS.md` is the canonical contract.
- **Implementation notes (for the follow-on PR):** (i) the single-source statement
  must *retain* the explicit "the six reviewer subagents pin `model: opus`;
  reviewer calibration is deliberately held" sentence — it is the only prose home
  for the calibration rule once `CLAUDE.md`/`README.md` stop restating it; (ii) the
  `AGENTS.md`→ledger anchor should be a durable `D-0NN` reference the
  `doc-link`/`doc-pointer` gates can see, so the single source cannot silently
  drift from its own ledger row; (iii) `tooling-surface-matrix.md` §Tool baseline
  (`:20,247`) is a sixth restatement — it becomes a pointer too (it is a reference
  doc, not a second authority).

**Option B: keep restating in each surface, add a CI consistency gate.**

- **Pros:** catches drift mechanically.
- **Cons:** still N copies to edit on every change; the gate is itself
  maintenance; polices the disease rather than removing it. (A *minimal*
  pointer-presence gate remains a cheap future option — see Consequences.)

**Option C: status quo (hand-maintain N copies).** Rejected — it is the disease.

### Facet 2 — the pin form (alias vs exact string)

**Option A (chosen): pin aliases; an exact model string requires explicit operator
rationale in a ledger row.** `.claude/settings.json` `model` and the six reviewer
`model:` pins use aliases (`opus`), which the CLI resolves to the latest matching
model and which survive retraction/rename. (This is already the live state
post-D-075; this ADR makes it the standing *rule*, not a one-off.)

- **Pros:** resilient to exactly the failure that triggered this ADR; matches what
  the reviewers already do and what the repo used pre-D-072.
- **Cons:** an alias does not reproduce a *specific* historical model. And it takes
  on one **trust assumption worth naming**: alias-pinning delegates "which concrete
  model the reviewers run on" to the CLI vendor's "latest" resolution, which fails
  *open* on a silent vendor-side rollover (an exact pin fails *closed* — a bad swap
  just will not load). This is accepted because (i) it is the pre-D-072 status quo
  the reviewers never left, and (ii) inv. 14 requires the baseline to be
  observed-and-recorded, so a rollover is detectable at the next observation rather
  than prevented. Exact reproducibility, when needed, is the rationale-bearing
  exception below.

**Option B: pin exact model strings for reproducibility.** Rejected — D-072
demonstrated the brittleness in four days; reproducibility is better served by the
ledger record than by a live pin that breaks on every retraction.

### Facet 3 — charter inv. 12

**Option A (chosen): keep the floors and the explicit-baseline requirement; remove
the named model; bind the baseline *record*.** See the drafted replacement text in
the Decision. The load-bearing property is preserved as a *stronger* provenance
demand: an unrecorded, sub-floor, or model-memory-guessed baseline is a violation.

- **Pros:** the invariant stops going stale by construction; subsumes the
  long-deferred inv-12 named-model amendment (D-054/D-071 lineage) and resolves the
  `4.7` drift at its root.
- **Cons:** invariant text gets slightly more abstract (binds a record rather than
  naming a model). That abstraction is the point.

**Option B: just bump `4.7` → `4.8` in inv. 12.** Rejected — treats the symptom;
goes stale on the next retraction (which, per the forcing function, may be days
away).

**Option C: leave inv. 12 naming a model.** Rejected — perpetual staleness in a
binding invariant.

### Facet 4 — the eval corpus

**Important correction (from `hcs-eval-reviewer` round 1):** `model_coverage` is
defined in `.agents/skills/hcs-regression-trap/SKILL.md` as the models a trap is
**in scope to be run against** — forward-looking *run-scope* metadata (several
traps list GPT-5.5 / Gemini-ADK, which postdate authoring). It is **not** a record
of what a trap was observed against, and it is consumed by nothing today (no
harness exists). So the v1 framing of this facet ("freeze it as authoring
provenance") misdescribed the field and is withdrawn.

**Option A (chosen): classify, don't rewrite.** The eval-corpus model names are
**run-scope metadata, not the live baseline**; the traps are trajectory-scored and
model-agnostic, so `model_coverage` is low-value per-file metadata regardless.
Therefore: it is **out of scope** for Facet-1 single-sourcing, and it is **not
bulk-rewritten** on a model change. The one genuine live-baseline restatement
inside the corpus — `seed.md`'s Cadence line ("pre-merge run against Claude Opus
4.7") — **does** point at the single source per Facet 1. The deeper questions the
eval reviewer raised (separating authoring-origin from run-scope; where per-run
results live — a future harness results ledger keyed by trap × model × date ×
verdict; reconciling the post-seed trap whose change log promised a corpus-wide
refresh, and a second that anchors its coverage to the superseded D-054 baseline)
are real but belong to the **eval lane** (`hcs-eval-reviewer`
write scope); this ADR defers them and does **not** claim to "resolve" the
eval-corpus naming.

- **Pros:** reaches the no-bulk-edit outcome everyone agrees on; correctly
  classifies the field; repoints the one true live-baseline line; defers
  field-semantics surgery to its owner.
- **Cons:** leaves the "which traps ran against the current model" need unmet — but
  that need belongs in harness run-output, not trap frontmatter, and the harness
  does not exist yet.

**Option B: a single shared coverage variable.** Rejected here — one update site,
but it erases the per-trap run-scope intent and still does not capture per-run
results.

## Decision

Adopt **Option A on all four facets**, as a design ratification. Concrete changes
land in follow-on PRs after acceptance (propose → accept-flip → implement), so this
ADR changes no file but itself.

1. **Single-source (Facet 1):** `AGENTS.md` §Tool baseline is the canonical live
   statement, anchored to its latest `DECISIONS.md` re-baseline row (ledger row =
   dated authority of record); `CLAUDE.md`/`README.md` refactor to point at it; the
   tooling-surface-matrix §Tool baseline becomes a pointer; the calibration
   sentence and a durable ledger anchor are retained per the Facet-1 implementation
   notes.
2. **Alias-pinning (Facet 2):** `.claude/settings.json` `model` and reviewer
   `model:` pins use aliases; an exact model string is an exception requiring a
   rationale-bearing ledger row.
3. **inv. 12 amendment (Facet 3):** replace the invariant body. **Non-normative
   draft** (exact wording finalized in the charter-only PR; floors carry over
   verbatim):

   > **Tool version baseline is explicit.** HCS work requires a baseline that is
   > (a) explicitly recorded in the single-source baseline statement (`AGENTS.md`
   > §Tool baseline, anchored to its `DECISIONS.md` re-baseline row), (b)
   > observed-runtime-sourced per invariant 14, and (c) pinned by **alias** (e.g.
   > `opus`), not an exact model string — an exact pin is an exception requiring a
   > rationale-bearing ledger row. The CLI floors bind: Claude Code CLI
   > ≥ `2.1.120`, Codex CLI ≥ `0.125.0`. A baseline that is unrecorded, below a
   > floor, or asserted from model memory is a violation. The specific current
   > model is named only in the single-source statement, never in this invariant.
   > App build identifiers are tracked separately. Subsequent minor updates are
   > acceptable; re-baseline after material version changes.

   This keeps the floors as a hard gate, **closes the default-allow hole** (an
   unrecorded baseline is a violation — the alias is the *pin mechanism*, never a
   substitute for the recorded baseline), and removes only the churning literal.
4. **Eval corpus (Facet 4):** classify `model_coverage` as run-scope metadata
   (out of scope, no bulk rewrite); repoint the `seed.md` Cadence model reference
   to the single source; defer the field-semantics and harness-results questions to
   `hcs-eval-reviewer`.

The residual `Opus 4.7` drift is handled accordingly: live-fact sites point at the
single source (charter inv. 12 via the amendment; the matrix line via repoint); the
`seed.md` Cadence line repoints; `model_coverage` is classified as run-scope (no
sweep). The separate `.codex/agents/hcs-eval-reviewer.toml` "Codex Opus" string is a
**live-fact error** (it names a nonexistent model in reviewer prose), distinct from
`model_coverage`; it gets a small correction (two lines), not classification —
handed to the eval/hook lanes.

## Consequences

### Accepts

- One update site for the live baseline; model churn stops costing a five-tier
  sweep. The next retraction is a one-PR event (ledger row + one prose edit; the
  alias pin needs no change).
- A more abstract inv. 12 (binds a record, not a name); a one-hop indirection in
  `CLAUDE.md`/`README.md`; and the named alias-resolution trust assumption (Facet 2).

### Rejects

- Does **not** mass-rewrite historical model mentions in `DECISIONS.md`,
  `research/`, or the eval-corpus `model_coverage` run-scope tags.
- Does **not** add a model-consistency CI gate now (Facet 1 Option B). A *minimal*
  pointer-presence guard — assert `CLAUDE.md`/`README.md` carry the pointer phrase
  and no model-version string — remains a cheap future option if restatement creeps
  back (the Fable episode was a restatement-creep event).
- Does **not** pin exact model strings by default, and does **not** redefine the
  eval `model_coverage` field in this ADR (deferred to the eval lane).

### Future amendments

- If the CLI changes alias semantics (an alias stops resolving to "latest", or a
  silent rollover degrades reviewer calibration), Facet 2 reopens; the
  alias-resolution behavior should be recorded as observed evidence in the single
  source when Facet 1 lands, not asserted from this ADR.
- If exact-model reproducibility becomes a hard requirement (e.g. a certified eval
  run), the rationale-bearing exact-pin exception is defined then.

### Suggested regression coverage (carried to the implementing PRs / eval lane)

- **Floor still binds with the model de-named:** a baseline naming a current model
  but a CLI below a floor must still fail.
- **Missing single-source record = violation** (the default-allow guard).
- **Exact-string pin without a rationale ledger row = flagged;** alias = clean.
- **Reviewer-pin drift** (a reviewer on an exact string) = flagged.
- **Stale-name-in-invariant regression:** a future inv. 12 reintroducing a model
  name = flagged.
- **`model_coverage` bulk-rewrite = flagged; append = clean** (final shape per the
  eval lane).
- **Restated-live-fact-drift trap** (the class, not just this instance; the
  permission-posture-as-queryable-fact `PLAN.md` item is a related instance) and a
  **provenance self-consistency meta-check** (an amendment ADR's cited ledger rows
  and sibling-ADR *titles* must resolve — the check this ADR's own v2 failed).

### Charter amendment (per §Change policy)

This ADR amends invariant 12. On acceptance: `hcs-policy-reviewer` +
`hcs-security-reviewer` objections (filed and addressed), human approval, a charter
version bump, and the charter edit in its own charter-only PR (the D-073
precedent). The accept-flip adds ledger row **D-076** (at this ADR's acceptance
time, D-074 was reserved for the ADR 0074 handoff/record-class accept-flip; D-075
was the merged re-baseline that surfaced this ADR). ADR 0074 is now accepted as
**D-074** (2026-06-23), closing that reserved gap. This accept-flip should also
close the long-deferred inv-12 named-model tracking item (D-054/D-071 lineage),
which Facet 3 subsumes.

## References

### Internal

- Charter: `docs/host-capability-substrate/implementation-charter.md` v1.5.0 —
  invariant 12 (line 64), invariant 14, §Change policy (lines ~160–169)
- Decision ledger: `DECISIONS.md` D-075 (the merged Fable-retraction re-baseline
  that surfaced this), D-071/D-072 (the Fable re-baseline + exact pin), D-054, D-029
  (CLI-semver vs app-build split); D-076 added on acceptance
- Related ADRs: 0073 (charter-amendment precedent: amend ADR → charter-only PR),
  0074 (*Operator handoffs are a record-class surface* — now accepted as D-074;
  at this ADR's acceptance time it had not yet been accept-flipped; its "Tracked
  separately" section logged the permission-posture `PLAN.md` backlog item, a
  *related* single-source/queryability instance — 0074 is not itself a
  single-source ADR)
- Eval field authority: `.agents/skills/hcs-regression-trap/SKILL.md` (the
  `model_coverage` = run-scope definition); `packages/evals/regression/seed.md`
  (Cadence line — the one live-baseline restatement in the corpus)
- Drift inventory: charter inv. 12; `tooling-surface-matrix.md:20,247`; 38
  `claude-opus-4-7` + 2 `claude-opus-4-8` `model_coverage` traps;
  `.codex/agents/hcs-eval-reviewer.toml` "Codex Opus" (a separate live-fact error)

### External

- Claude Code `--model` help (installed CLI 2.1.177): aliases (`opus`, `sonnet`, …)
  documented as "an alias for the latest model" — the basis for Facet 2. Per inv. 14,
  verify against the installed build before relying on specific alias behavior; note
  the same help still lists `fable` (a retracted model), demonstrating client help
  lags server reality.

## Revision history

- 2026-06-15: Initial proposal (v1).
- 2026-06-15 (v2): Folded the four-lens round-1 review. Provenance blockers
  (architect B1/B2, policy B1 — citing D-075/ADR-0074 before they existed) resolved
  by the merge of PR #68/#69; ADR rebased onto that main. Corrected the drift
  inventory (architect B3): dropped `measure-protocol-features.sh` (no model
  strings — CLI floors + surface keys only); fixed the eval figure (38
  `claude-opus-4-7` + 2 `claude-opus-4-8`, not "40 × 4-7"); replaced the
  unreproducible "84" with a reproducible occurrence/file count. Added the
  **drafted replacement inv-12 text** binding the baseline *record* and closing the
  default-allow hole (policy B2). **Reframed Facet 4** (eval-reviewer reject):
  `model_coverage` is run-scope metadata, not frozen provenance — classify + repoint
  the `seed.md` Cadence line + defer field-semantics/harness to the eval lane; no
  "resolved" overclaim. Folded security wording: named the alias-resolution
  fails-open trust assumption (2a) and moved the inv-14 verify-first caveat next to
  the alias claim (2d); added the calibration-sentence + durable-anchor Facet-1
  implementation notes (2b/2c). Fixed numbering (accept-flip → D-076; D-074 was
  reserved at the time for the ADR 0074 accept-flip; closed by D-074 on
  2026-06-23).
- 2026-06-15 (v3): Folded the confirming round-2 review. Corrected the drift count
  to **85 occurrences across 46 files** (the v2 "91/47" was computed before the
  rebase settled D-075's merged row, which itself carries `Opus 4.7` references;
  now stated with explicit self-exclusion) — architect. Fixed the ADR 0074
  mis-citation (policy): 0074 is the handoff/record-class ADR, and
  permission-posture-as-queryable-fact is a `PLAN.md` backlog item it logged — a
  *related* instance, not a single-source sibling ADR or charter-amendment
  precedent (the ADR thereby failed its own proposed provenance self-consistency
  meta-check; v3 fixes it). Corrected "two post-seed traps promised a refresh" to
  one (the second anchors to the superseded D-054 baseline) and the `.codex`
  "Codex Opus" correction to two lines — eval. Round-2 verdicts: eval `confirm`
  (`confirms_round1_fixes: true`); architect and policy `changes-needed` on these
  factual/citation points only — the drafted inv-12 text, alias-pinning,
  single-source design, and Facet-4 reframe were each confirmed sound.
- 2026-06-15 (accepted): Operator merged the proposal (PR #70, `95ba45c`) and
  directed proceed; status flipped `proposed` → `accepted` with the D-076 ledger
  row. The §Change-policy reviewer requirement was satisfied pre-acceptance
  (`hcs-policy-reviewer` confirm + `hcs-security-reviewer` approve +
  `hcs-eval-reviewer` confirm; the architect residuals were folded across three
  rounds). Design-only acceptance — no charter/settings/prose/eval byte change.
  Carries forward: the charter-only inv-12 amendment PR, the single-source
  implementing PR(s), and the eval-lane work.
