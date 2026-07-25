#!/usr/bin/env bash
# no-live-secrets.sh — secret scan. gitleaks is required, not optional.
#
# Per charter invariant 5: secrets never in repo, only op:// references.
# Per charter invariant 10 and ADR 0011: no runtime tokens, audit-signing
# material, or resolved 1Password content in the public repo.
#
# HISTORY OF THIS GATE'S FAILURES (all hand-verified 2026-07-25)
#
# 1. gitleaks was absent from .mise.toml, and CI provisions tools solely via
#    mise-action, so gitleaks had NEVER run in CI. Every CI run silently took
#    the weaker regex fallback.
# 2. `gitleaks ... | tail -20` meant `$?` was tail's status, so the
#    "gitleaks detected secrets" branch was unreachable even locally.
# 3. The fallback's private-key pattern begins with '-', so grep parsed it as
#    an option bundle and exited 2. Under `if grep ...; then` that read as
#    "no private keys found". That check had never once executed.
# 4. The fallback's remaining patterns used `\s`, a GNU extension absent from
#    POSIX ERE. CI runs macos-latest (BSD grep), so they could not have matched
#    there either.
#
# The fallback has therefore been REMOVED rather than repaired. It was never a
# working second line of defense — it was an unexecuted one that made the gate
# look layered. A scan that cannot run must fail, not degrade to a weaker scan
# whose own defects are invisible. Removing it also removes the secret-echo
# path it had: it printed matched LINES, which for a real hit means printing
# the credential into the CI log of a public repository.

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

echo "→ no-live-secrets"

if ! command -v gitleaks >/dev/null 2>&1; then
  echo "  ✗ gitleaks not installed — it is pinned in .mise.toml; run 'mise install'" >&2
  echo "    This gate has no fallback by design. A scan that cannot run is a FAILED" >&2
  echo "    gate, never a passed one." >&2
  exit 1
fi

# `git` is the modern verb. gitleaks 8.30.1 --help lists: completion, dir, git,
# help, stdin, version — `detect` is no longer advertised. Charter invariant 11
# forbids deprecated syntax where a modern replacement exists; invariant 14
# requires the observed installed runtime, not model memory, as the authority.
#
# `git` mode scans committed history, so it inherently respects .gitignore and
# will not walk node_modules/ or the 2 GB .logs/ tree. It does NOT see staged-
# but-uncommitted content; that is a known scope limit, not an oversight.
#
# --config is explicit because allowlists must key on content shape, not on a
# commit:file:rule:line fingerprint. This repo squash-merges (every merge
# rewrites the SHA) and CI checks out at depth 1 (one synthetic commit), so
# fingerprint-keyed entries can never match in CI. See .gitleaks.toml.
#
# --redact is load-bearing: findings are printed into CI logs of a public repo.
#
# Status is captured BEFORE any pipe. `cmd | tail` yields tail's status.
gitleaks_status=0
gitleaks_out="$(gitleaks git --no-banner "$repo_root" \
  --config "$repo_root/.gitleaks.toml" \
  --redact \
  --exit-code 1 2>&1)" || gitleaks_status=$?

printf '%s\n' "$gitleaks_out" | tail -30

if [ "$gitleaks_status" -ne 0 ]; then
  echo "✗ gitleaks detected secrets (exit $gitleaks_status)" >&2
  exit 1
fi

echo "  ✓ gitleaks clean"
exit 0
