#!/usr/bin/env bash
# doc-link-check.sh — fail on broken intra-repo documentation references.
#
# Two recurrence guards for rot classes fixed in the post-M1 housekeeping pass:
#   1. ADR citations: every `adr/NNNN-slug.md` path token resolves to a real
#      file under docs/host-capability-substrate/adr/ (catches stale pre-rename
#      sibling-ADR slugs).
#   2. Relative links: every Markdown `](./x)` / `](../x)` target resolves
#      relative to the containing file (catches dead links like the removed
#      charter `./templates/`).
#
# Scope: tracked Markdown EXCLUDING docs/host-capability-substrate/research/ —
# those are dated, often externally-captured provenance whose links reflect
# authoring-time state and are deliberately not kept link-current.
#
# Inline-code spans (`...`) are stripped before the relative-link check so a
# documented/quoted dead link (e.g. a change-log row recording a removal) is not
# a false positive. The ADR-citation check keeps code spans because the canonical
# citation form is a backtick'd path; the required `adr/` prefix keeps bare
# provenance filenames (e.g. a Revision-history note) out of scope.

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

echo "→ doc-link-check"

adr_dir="docs/host-capability-substrate/adr"
fail=0

files=()
while IFS= read -r f; do
  case "$f" in
    */research/*) continue ;;
  esac
  files+=("$f")
done < <(git ls-files '*.md')

if [ ${#files[@]} -eq 0 ]; then
  echo "  (no tracked Markdown found)"
  exit 0
fi

for f in "${files[@]}"; do
  # Check 1 — ADR path citations resolve to a real ADR file.
  while IFS= read -r ref; do
    [ -n "$ref" ] || continue
    if [ ! -f "$adr_dir/${ref#adr/}" ]; then
      echo "  ✗ $f: ADR citation does not resolve: $ref" >&2
      fail=1
    fi
  done < <(grep -oE 'adr/[0-9]{4}-[a-z0-9-]+\.md' "$f" | sort -u)

  # Check 2 — relative Markdown links resolve (inline code spans stripped).
  dir="$(dirname "$f")"
  while IFS= read -r tgt; do
    [ -n "$tgt" ] || continue
    tgt="${tgt%% *}" # drop any "title" suffix after the path
    if [ ! -e "$dir/$tgt" ]; then
      echo "  ✗ $f: relative link target does not exist: $tgt" >&2
      fail=1
    fi
    # First sed strips inline-code spans (literal backticks, single-quoted on
    # purpose); grep extracts ./ or ../ link targets; second sed drops the "](".
  done < <(sed -E 's/`[^`]*`//g' "$f" | grep -oE '\]\(\.\.?/[^)#]*' | sed -E 's/^\]\(//')
done

if [ "$fail" -ne 0 ]; then
  echo "✗ doc-link-check found broken intra-repo references" >&2
  echo "  Repoint to the current on-disk filename, or remove the dead reference." >&2
  exit 1
fi

echo "  ✓ ADR citations and relative doc links resolve"
