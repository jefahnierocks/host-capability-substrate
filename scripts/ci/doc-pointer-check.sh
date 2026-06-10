#!/usr/bin/env bash
# doc-pointer-check.sh — fail on stale authority-doc version pointers.
#
# Authority docs declare their version in YAML frontmatter; live docs point at
# them ("charter v1.4.2", "ontology **v1.31.1**", "charter (v1.3.0+)"). Two
# pointer forms with different semantics:
#   exact pin  vX.Y.Z   — must equal the authority doc's current version
#   floor      vX.Y.Z+  — must be <= the current version (deliberate floors,
#                          e.g. "(v1.3.0+)", stay valid across patch bumps)
#
# Recurrence guard for the pointer-rot class fixed manually in PR #51 (PLAN.md/
# IMPLEMENT.md "charter v1.4.1" after the v1.4.2 bump) and again in PR-B2
# (.claude/agents/hcs-architect.md instructing compliance statements against
# "charter v1.1.0").
#
# Scope: tracked Markdown EXCLUDING point-in-time provenance:
#   - docs/host-capability-substrate/research/   dated, externally-captured
#   - docs/host-capability-substrate/adr/        ADRs cite the charter version
#     they were written against, by design (adr/0000-template.md)
#   - DECISIONS.md                               dated ledger rows
#   - packages/evals/regression/                 incident-time trap records
#   - the authority docs themselves              change logs / cite examples
# A file may carry a `doc-pointer-check: provenance-below` marker; lines after
# it are dated provenance and are not checked (PLAN.md prior-focus sections).
# Inline-code spans (`...`) are stripped BEFORE marker truncation, so a quoted
# historical pointer is not a false positive and a doc that merely QUOTES the
# marker in backticks does not fence itself. Known false-negatives by design:
# pointers split across line breaks, and two-segment shorthand ("v1.3+") —
# only three-segment vX.Y.Z[+] forms are matched.
#
# Check 2: the committed PR template keeps its `v{X.Y.Z}` placeholder at rest —
# authors substitute the real version in rendered PR bodies only, so the
# template file itself never carries a pin that can rot.
#
# An embedded self-test runs on every invocation before the real scan, so the
# negative test can never silently rot.

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

echo "→ doc-pointer-check"

# Authority table (parallel arrays; bash-3-safe, no associative arrays).
# name-token: the prose word a pointer attaches to, matched case-insensitively
# with up to 4 non-alphanumeric characters (space, bold markers, parens)
# between token and version. "ontology" cannot false-match inside
# "ontology-registry ... vX.Y.Z" because the hyphenated continuation puts
# alphanumerics in the gap.
authority_names=(charter ontology registry)
authority_files=(
  "docs/host-capability-substrate/implementation-charter.md"
  "docs/host-capability-substrate/ontology.md"
  "docs/host-capability-substrate/ontology-registry.md"
)

# Versioned authority-class docs excluded from scanning entirely: their change
# logs and cite examples record historical versions by design and are governed
# by their own change ceremonies.
self_governed_docs=(
  "docs/host-capability-substrate/implementation-charter.md"
  "docs/host-capability-substrate/ontology.md"
  "docs/host-capability-substrate/ontology-registry.md"
  "docs/host-capability-substrate/tooling-surface-matrix.md"
  "docs/host-capability-substrate/workstation-surface-contract.md"
)

template_file=".github/pull_request_template.md"
marker='doc-pointer-check: provenance-below'

frontmatter_version() {
  # First `version:` line within the leading frontmatter block.
  sed -n '1,15{/^version:[[:space:]]*/{s/^version:[[:space:]]*//p;q;};}' "$1"
}

ver_le() {
  # True when $1 <= $2 under version ordering. Requires `sort -V` (GNU and
  # modern macOS/BSD sort both support it); self-test fixtures 3 and 4 exercise
  # this on every run, so an unsupported sort fails loudly, never silently.
  [ "$(printf '%s\n%s\n' "$1" "$2" | sort -V | head -n 1)" = "$1" ]
}

# scan_file <file> <name-token> <current-version>
# Prints one violation line per stale pointer; prints nothing when clean.
scan_file() {
  local file="$1" name="$2" current="$3"
  local hit ver
  # Truncate at the provenance marker, then strip inline-code spans.
  while IFS= read -r hit; do
    [ -n "$hit" ] || continue
    ver="$(printf '%s' "$hit" | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+\+?$')"
    case "$ver" in
      *+)
        ver="${ver%+}"
        ver="${ver#v}"
        if ! ver_le "$ver" "$current"; then
          printf '%s: floor exceeds current %s version: "%s" (current v%s)\n' \
            "$file" "$name" "$hit" "$current"
        fi
        ;;
      *)
        ver="${ver#v}"
        if [ "$ver" != "$current" ]; then
          printf '%s: stale exact %s pin: "%s" (current v%s)\n' \
            "$file" "$name" "$hit" "$current"
        fi
        ;;
    esac
  done < <(
    sed -E 's/`[^`]*`//g' "$file" \
      | awk -v m="$marker" 'index($0, m) { exit } { print }' \
      | grep -oiE "${name}[^a-zA-Z0-9]{0,4}v[0-9]+\\.[0-9]+\\.[0-9]+\\+?" \
      || true
  )
}

self_test() {
  local t fail=0 out
  t="$(mktemp -d "${TMPDIR:-/tmp}/hcs-pointer-selftest.XXXXXX")"

  # Fixture 1 — stale exact pin must be reported.
  printf 'Complies with charter v0.0.1 here.\n' > "$t/stale-pin.md"
  out="$(scan_file "$t/stale-pin.md" charter 1.4.2)"
  [ -n "$out" ] || { echo "  self-test FAIL: stale exact pin not caught" >&2; fail=1; }

  # Fixture 2 — current exact pin must pass.
  printf 'Complies with charter v1.4.2 here.\n' > "$t/current-pin.md"
  out="$(scan_file "$t/current-pin.md" charter 1.4.2)"
  [ -z "$out" ] || { echo "  self-test FAIL: current pin flagged" >&2; fail=1; }

  # Fixture 3 — floor below current must pass; bold/paren punctuation matches.
  printf 'Honor the charter (v1.3.0+) and charter **v1.4.2** here.\n' > "$t/floor-ok.md"
  out="$(scan_file "$t/floor-ok.md" charter 1.4.2)"
  [ -z "$out" ] || { echo "  self-test FAIL: valid floor/bold pin flagged" >&2; fail=1; }

  # Fixture 4 — floor above current must be reported.
  printf 'Requires charter v9.0.0+ semantics.\n' > "$t/floor-high.md"
  out="$(scan_file "$t/floor-high.md" charter 1.4.2)"
  [ -n "$out" ] || { echo "  self-test FAIL: too-high floor not caught" >&2; fail=1; }

  # Fixture 5 — stale pin below the provenance marker must pass.
  printf 'live text\n<!-- %s -->\nold note: charter v0.0.1.\n' "$marker" > "$t/provenance.md"
  out="$(scan_file "$t/provenance.md" charter 1.4.2)"
  [ -z "$out" ] || { echo "  self-test FAIL: provenance-fenced pin flagged" >&2; fail=1; }

  # Fixture 6 — stale pin quoted in an inline-code span must pass.
  printf 'The old text said `charter v0.0.1` before the fix.\n' > "$t/code-span.md"
  out="$(scan_file "$t/code-span.md" charter 1.4.2)"
  [ -z "$out" ] || { echo "  self-test FAIL: code-span-quoted pin flagged" >&2; fail=1; }

  # Fixture 7 — registry token must not fire on the ontology token's pattern.
  printf 'See ontology-registry.md v0.0.1 row.\n' > "$t/hyphen.md"
  out="$(scan_file "$t/hyphen.md" ontology 1.31.1)"
  [ -z "$out" ] || { echo "  self-test FAIL: ontology matched across hyphen" >&2; fail=1; }

  # Fixture 8 — STALE bold pin must be reported (the PR #51 real-world form).
  printf 'On main: charter **v0.0.1** at the time.\n' > "$t/stale-bold.md"
  out="$(scan_file "$t/stale-bold.md" charter 1.4.2)"
  [ -n "$out" ] || { echo "  self-test FAIL: stale bold pin not caught" >&2; fail=1; }

  # Fixture 9 — a backtick-QUOTED marker must not fence the file: the stale
  # pin below it must still be reported (code spans strip before truncation).
  printf 'Docs may use the `%s` marker.\nstale: charter v0.0.1.\n' "$marker" > "$t/quoted-marker.md"
  out="$(scan_file "$t/quoted-marker.md" charter 1.4.2)"
  [ -n "$out" ] || { echo "  self-test FAIL: quoted marker fenced the file" >&2; fail=1; }

  # Fixture 10 — frontmatter version extraction is itself covered.
  printf -- '---\ntitle: X\nversion: 9.8.7\n---\nbody\n' > "$t/frontmatter.md"
  out="$(frontmatter_version "$t/frontmatter.md")"
  [ "$out" = "9.8.7" ] || { echo "  self-test FAIL: frontmatter version parse (got '$out')" >&2; fail=1; }

  rm -rf "$t"
  if [ "$fail" -ne 0 ]; then
    echo "✗ doc-pointer-check self-test failed — fix the linter before trusting it" >&2
    exit 1
  fi
}

self_test

fail=0

# Check 1 — authority version pointers in live docs.
for i in "${!authority_names[@]}"; do
  name="${authority_names[$i]}"
  authority_file="${authority_files[$i]}"
  current="$(frontmatter_version "$authority_file")"
  if [ -z "$current" ]; then
    echo "  ✗ cannot read frontmatter version from $authority_file" >&2
    fail=1
    continue
  fi

  while IFS= read -r f; do
    case "$f" in
      docs/host-capability-substrate/research/*) continue ;;
      docs/host-capability-substrate/adr/*) continue ;;
      DECISIONS.md) continue ;;
      packages/evals/regression/*) continue ;;
    esac
    skip=0
    for af in "${self_governed_docs[@]}"; do
      [ "$f" = "$af" ] && skip=1 && break
    done
    [ "$skip" -eq 1 ] && continue

    while IFS= read -r violation; do
      [ -n "$violation" ] || continue
      echo "  ✗ $violation" >&2
      fail=1
    done < <(scan_file "$f" "$name" "$current")
  done < <(git ls-files '*.md')
done

# Check 2 — the PR template keeps its placeholder at rest.
if [ -f "$template_file" ]; then
  if ! grep -qF 'v{X.Y.Z}' "$template_file"; then
    echo "  ✗ $template_file: missing the v{X.Y.Z} placeholder — the committed" >&2
    echo "    template must not carry a literal charter version (pins rot)" >&2
    fail=1
  fi
fi

if [ "$fail" -ne 0 ]; then
  echo "✗ doc-pointer-check found stale authority-version pointers" >&2
  echo "  Update the pointer to the authority doc's current frontmatter version," >&2
  echo "  use a floor (vX.Y.Z+) for deliberate minimums, or fence dated text" >&2
  echo "  below a 'doc-pointer-check: provenance-below' marker." >&2
  exit 1
fi

echo "  ✓ authority version pointers are current (self-test passed)"
