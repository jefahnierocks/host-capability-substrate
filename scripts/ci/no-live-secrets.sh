#!/usr/bin/env bash
# no-live-secrets.sh — secret scan using gitleaks if available; fallback to regex heuristics.
#
# Per charter invariant 5: secrets never in repo, only op:// references.
# Per charter invariant 10 and ADR 0011: no runtime tokens, audit-signing material,
# or resolved 1Password content in the public repo.

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

echo "→ no-live-secrets"

if command -v gitleaks >/dev/null 2>&1; then
  # Capture status BEFORE any pipe. `cmd | tail` yields tail's status, so the
  # old form made the failure branch below unreachable: gitleaks could exit 1
  # on a real finding and this script would still report clean.
  gitleaks_status=0
  gitleaks_out="$(gitleaks detect --no-banner --source "$repo_root" --redact --exit-code 1 2>&1)" || gitleaks_status=$?

  printf '%s\n' "$gitleaks_out" | tail -20

  if [ "$gitleaks_status" -ne 0 ]; then
    echo "✗ gitleaks detected secrets" >&2
    exit 1
  fi
  echo "  ✓ gitleaks clean"
  exit 0
fi

# gitleaks is provisioned by .mise.toml. If it is missing, the scan is weaker
# than the one this gate claims to run, so the gate FAILS rather than silently
# degrading. CI provisions tools solely through mise-action, which means the
# fallback path below had been the CI path all along, unnoticed.
echo "  ✗ gitleaks not installed — provisioned by .mise.toml; run 'mise install'" >&2
echo "    Refusing to substitute the weaker regex fallback for the declared scan." >&2
echo "    Set HCS_ALLOW_WEAK_SECRET_SCAN=1 to run the fallback explicitly." >&2
if [ "${HCS_ALLOW_WEAK_SECRET_SCAN:-0}" != "1" ]; then
  exit 1
fi

# Fallback regex heuristics (weaker than gitleaks) — opt-in only.
echo "  (running fallback regex heuristics — WEAKER than gitleaks)"

fail=0

# shellcheck source=scripts/ci/lib/grep-gate.sh
. "$repo_root/scripts/ci/lib/grep-gate.sh"
err() { printf "  ✗ %s\n" "$*" >&2; fail=1; }

# Private keys.
#   `-e` is load-bearing: the pattern starts with '-', so without it grep parses
#   it as an option bundle and exits 2 ("unrecognized option"). Under the old
#   `if grep ...; then` form that read as "no private keys found" — this check
#   had never once executed.
private_key_rc=0
private_key_hits="$(grep_gate grep -rlE -e "-----BEGIN (RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----" --include='*' .)" || private_key_rc=$?

if [ "$private_key_rc" -ge 2 ]; then
  err "private-key scan could not execute (grep rc=$private_key_rc) — treating as FAILED"
elif [ "$private_key_rc" -eq 0 ]; then
  private_key_real="$(printf '%s\n' "$private_key_hits" | grep -v "\.gitignore\|scripts/ci/no-live-secrets\.sh" || true)"
  private_key_real="$(printf '%s\n' "$private_key_real" | sed '/^[[:space:]]*$/d')"
  if [ -n "$private_key_real" ]; then
    printf '%s\n' "$private_key_real" >&2
    err "private key material committed"
  fi
fi

# .env file committed
if [ -f .env ] || [ -f .env.local ]; then
  echo "  ✗ .env or .env.local committed" >&2
  fail=1
fi

# Common secret-like patterns.
#   The explicit '.' path operand is load-bearing: `grep -r` with no path is a
#   portability trap (GNU defaults to '.', BSD reads stdin), so the old form
#   was not scanning what it appeared to scan on this host.
for pattern in \
  'AWS_SECRET_ACCESS_KEY\s*[:=]\s*[A-Za-z0-9/+=]{30,}' \
  'GITHUB_TOKEN\s*[:=]\s*[A-Za-z0-9_]{30,}' \
  'OPENAI_API_KEY\s*[:=]\s*sk-[A-Za-z0-9]{20,}' \
  'ANTHROPIC_API_KEY\s*[:=]\s*sk-ant-[A-Za-z0-9]{20,}'; do
  pattern_rc=0
  pattern_hits="$(grep_gate grep -rE -e "$pattern" --include='*' .)" || pattern_rc=$?

  if [ "$pattern_rc" -ge 2 ]; then
    err "secret-literal scan could not execute (grep rc=$pattern_rc) for: $pattern"
  elif [ "$pattern_rc" -eq 0 ]; then
    pattern_real="$(printf '%s\n' "$pattern_hits" | grep -v "scripts/ci/no-live-secrets\.sh\|op://" || true)"
    pattern_real="$(printf '%s\n' "$pattern_real" | sed '/^[[:space:]]*$/d')"
    if [ -n "$pattern_real" ]; then
      printf '%s\n' "$pattern_real" >&2
      err "potential secret literal matched: $pattern"
    fi
  fi
done

if [ $fail -eq 0 ]; then
  echo "  ✓ no secret literals detected"
  exit 0
else
  echo "✗ no-live-secrets FAILED (install gitleaks for stronger scanning)" >&2
  exit 1
fi
