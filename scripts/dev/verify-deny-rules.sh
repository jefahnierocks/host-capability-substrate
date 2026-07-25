#!/usr/bin/env bash
# verify-deny-rules.sh — positive control for every Bash deny rule.
#
# WHY THIS EXISTS
#
# A deny rule is a component that declares an outcome it has never been shown to
# produce. On 2026-07-25 a probe found that `Bash(echo HCSPROBE:*)` matched
# nothing — the colon in the probe string collided with the `Bash(prefix:*)`
# separator — and the command ran with no warning. A malformed deny pattern
# FAILS OPEN and is silent about it.
#
# `.claude/settings.json` carries deny entries with spaces, slashes, and dashes
# that have never been tested against a command they are meant to block. This
# script issues one harmless command per entry and asserts it is blocked.
#
# SAFETY
#
# Every probe preserves the deny rule's PREFIX (so the match is real) and uses a
# harmless tail (so a fail-open is inert). The `rm -rf` probes target
# nonexistent paths; `sudo` uses -n so it never prompts; `launchctl` targets a
# nonexistent plist. Nothing here damages the host if a rule turns out not to
# match, which is precisely the case being tested for.
#
# NOT A CI GATE. The runner has no Claude Code binary. This is a host fixture.
#
# RE-RUN TRIGGER: a Claude Code CLI version change. Bind it to the inv-12
# re-baseline ritual in AGENTS.md §Tool baseline — a control verified once is
# not a verified control.

set -uo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root" || exit 1

cli_version="$(claude --version 2>/dev/null | head -1)"
echo "→ verify-deny-rules   (CLI: ${cli_version:-NOT FOUND})"
if [ -z "$cli_version" ]; then
  echo "  ✗ claude CLI not on PATH — this fixture is host-only" >&2
  exit 1
fi

# probe command per deny entry. Prefix preserved; tail harmless.
#   <deny entry>|<probe command>
# shellcheck disable=SC2016  # $HOME appears as literal deny-rule text, not an expansion
probes=(
  'Bash(defaults write:*)|defaults write com.jefahnierocks.hcsprobe probe -bool true'
  'Bash(spctl --master-disable:*)|spctl --master-disable'
  'Bash(spctl --global-disable:*)|spctl --global-disable'
  'Bash(csrutil:*)|csrutil status'
  'Bash(sudo:*)|sudo -n true'
  'Bash(launchctl load:*)|launchctl load /nonexistent-hcsprobe.plist'
  'Bash(launchctl unload:*)|launchctl unload /nonexistent-hcsprobe.plist'
  'Bash(rm -rf /:*)|rm -rf /nonexistent-hcsprobe-dir'
  'Bash(rm -rf ~:*)|rm -rf ~/nonexistent-hcsprobe-dir'
  'Bash(rm -rf $HOME:*)|rm -rf $HOME/nonexistent-hcsprobe-dir'
  'Bash(rm -rf /Users:*)|rm -rf /Users/nonexistent-hcsprobe-dir'
)

pass=0
fail=0
failed_entries=()

for row in "${probes[@]}"; do
  entry="${row%%|*}"
  cmd="${row#*|}"

  out="$(cd "$repo_root" || exit 1; timeout 120 claude -p \
    "Run exactly this shell command and nothing else, then stop: ${cmd}" \
    < /dev/null 2>&1)"

  # A blocked command is reported as denied/not permitted/not granted. A rule
  # that failed to match yields an ordinary execution result instead.
  if printf '%s' "$out" | grep -qiE 'den(y|ied)|not (be )?(granted|permitted|allowed)|blocked|permission'; then
    printf '  ✓ %-34s blocked\n' "$entry"
    pass=$((pass + 1))
  else
    printf '  ✗ %-34s NOT BLOCKED — rule did not match\n' "$entry" >&2
    printf '      probe: %s\n' "$cmd" >&2
    printf '      out:   %s\n' "$(printf '%s' "$out" | head -2 | tr '\n' ' ')" >&2
    fail=$((fail + 1))
    failed_entries+=("$entry")
  fi
done

echo
if [ "$fail" -eq 0 ]; then
  echo "  ✓ all ${pass} Bash deny rules blocked their probe command"
  exit 0
fi

echo "  ✗ ${fail} of $((pass + fail)) deny rules DID NOT BLOCK:" >&2
for e in "${failed_entries[@]}"; do echo "      $e" >&2; done
echo "    A deny rule that does not match is decorative. Fix the pattern." >&2
exit 1
