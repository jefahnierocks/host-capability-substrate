#!/usr/bin/env bash
# forbidden-string-scan.sh — scan for forbidden patterns and bad values.
#
# Detects:
#   - Universal shell execution tool registrations
#   - Resolved op:// values (secrets should be references, not resolved)
#   - Deprecated macOS verbs in renderer code
#   - Resurrection of banned capability names

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

echo "→ forbidden-string-scan"

fail=0

# Scan targets — everything committed except docs/adr (which may quote forbidden
# patterns as examples) and .logs (gitignored anyway).
scan_dirs="packages scripts .claude .agents .codex .cursor .vscode"

# 1. Universal shell names — banned capability identifiers.
# Allowed exception: "unsafe_shell_proposal" (the stigmatized ADR-recorded name).
for pattern in '"bash\.run"' '"shell\.exec"' '"exec\.unsafe_shell"\s*[,)]'; do
  if grep -rE "$pattern" $scan_dirs 2>/dev/null | grep -v "unsafe_shell_proposal"; then
    echo "  ✗ forbidden capability name: pattern $pattern" >&2
    fail=1
  fi
done

# 2. Resolved secret values — configs/fixtures should use op:// references, never
# resolved tokens. Heuristic: patterns like "sk-...", "ghp_...", raw-looking API keys.
# This recursive scan over $scan_dirs (incl. packages/) is the committed-fixture
# backstop for CommandShape argv/env/cwd (ADR 0063 §Follow-up regression coverage):
# the Ring 0 CommandShape schema ACCEPTS a secret-shaped argv element because the
# argument-class distinction (ProviderObjectReference / PublicClientId /
# PolicySelectorValue / SecretReference / raw secret) is a Ring 1 gateway obligation
# (charter line 98), so no resolved token may land in a committed fixture. The
# command-shape.test.ts argv-secret-inlining trap builds its token-shaped elements by
# runtime concatenation precisely so it documents that gap WITHOUT tripping this scan.
# ADR 0065 extends this same backstop to SecretReference.reference_locator: the
# permissive reference kinds (env_var_name / broker_handle / hcs_uri tails) likewise
# ACCEPT a token-shaped locator at Ring 0, and secret-reference.test.ts builds its
# token fixtures by runtime concatenation for the same reason.
# ADR 0066 likewise covers HostProfile: host_identity.digest is sha256-locked (a raw
# machine identifier cannot land there), but host_profile_id is entityIdSchema and
# accepts a raw-UUID shape — a recorded accept-and-trap routed to Ring 1; this scan is
# the committed-fixture backstop, and host-profile.test.ts uses only a synthetic UUID.
# ADR 0067 likewise covers ToolProvider: tool_provider_id is entityIdSchema and accepts a
# raw machine-ish shape (a recorded accept-and-trap routed to Ring 1, mirroring HostProfile);
# root_path forbids URI/whitespace and bare token shapes by requiring an anchored provider
# root, but a long token-shaped final segment under a real root would land — this scan is the
# committed-fixture backstop, and tool-provider.test.ts uses only synthetic anchored roots.
# ADR 0068 likewise covers ToolInstallation: tool_installation_id is entityIdSchema and accepts a
# raw machine-ish shape (a recorded accept-and-trap routed to Ring 1, mirroring ToolProvider); its
# install_path REUSES toolProvenanceCanonicalPathSchema (the same committed-fixture backstop posture)
# and tool-installation.test.ts uses only synthetic anchored roots + non-secret version/tool_name.
# ADR 0069 likewise covers ResolvedTool: resolved_tool_id is entityIdSchema and accepts a raw
# machine-ish shape (a recorded accept-and-trap routed to Ring 1, mirroring the chain peers); the
# entity holds no secret value (typed FK refs + a bounded tool_name query), and
# resolved-tool.test.ts uses only synthetic FK ids + a synthetic UUID for the accept-and-trap.
# (Phase 0a: conservative scan. Extend with gitleaks in no-live-secrets.sh.)
if grep -rE '\b(sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|xoxb-[0-9]+-[A-Za-z0-9]+|AKIA[0-9A-Z]{16})\b' $scan_dirs 2>/dev/null; then
  echo "  ✗ likely resolved secret value found" >&2
  fail=1
fi

# 3. Deprecated launchctl verbs in renderer code (not docs, not eval corpus, not comments)
# Allowed in:
#   - docs/** (documentation may describe forbidden patterns)
#   - packages/evals/regression/** (eval corpus documents what agents must NOT do)
#   - install-launchd.sh and hook docs/scripts (historical warnings and telemetry)
#   - plist template (comment-only mentions as "NEVER" warnings)
if grep -rnE '\blaunchctl\s+(load|unload)\b' packages/ scripts/ 2>/dev/null \
    | grep -v -E '(install-launchd|hcs-hook|packages/evals/regression/|/launchd/.*\.tmpl:\s*[^<]*NEVER)'; then
  echo "  ✗ deprecated launchctl verb in renderer/script code" >&2
  fail=1
fi

# 4. Audit-write endpoint exposure as agent-callable
if grep -rE '"system\.audit\.log\.v[0-9]+"' packages/ scripts/ 2>/dev/null; then
  echo "  ✗ system.audit.log.v* exposed as agent-callable (charter invariant 4)" >&2
  fail=1
fi

# 5. Project hook bodies stay thin. Canonical policy lives in system-config
# and hard decisions route through Ring 1 or an authorized generated/hash-bound
# cache, never hook-local arrays or regex tables.
for hook in .claude/hooks/hcs-hook .codex/hooks/hcs-hook; do
  if grep -nE 'forbidden_patterns=|forbidden_regexes=|grep -E[q]? .*(TOKEN|SECRET|API_KEY|PASSWORD|PASSWD|PAT)|spctl --|csrutil |rm -rf |launchctl (load|unload)' "$hook"; then
    echo "  ✗ hook-local forbidden policy pattern in $hook" >&2
    fail=1
  fi
done

if [ $fail -eq 0 ]; then
  echo "  ✓ no forbidden strings detected"
  exit 0
else
  echo "✗ forbidden-string-scan FAILED" >&2
  exit 1
fi
