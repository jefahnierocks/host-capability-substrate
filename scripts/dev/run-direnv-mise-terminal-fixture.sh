#!/usr/bin/env bash
# run-direnv-mise-terminal-fixture.sh — isolated P09 allowed/trusted terminal matrix.

set -euo pipefail

tmp_dir="$(mktemp -d "${TMPDIR:-/tmp}/hcs-direnv-mise-terminal.XXXXXX")"
trap 'rm -rf "$tmp_dir"' EXIT

# Resolve the ACTUAL interpreter, dereferencing any mise/asdf shim. These steps
# run python3 inside an isolated env (env -i + temp HOME) that intentionally lacks
# the managed mise trust store. Invoking a mise *shim* there makes mise re-resolve
# python3 and reject the checkout's .mise.toml (before the synthetic direnv allow /
# mise trust). Resolve the real binary here, in the normal env, via sys.executable,
# and refuse a shim path. Harness-only: no change to the isolated HOME/state
# contract, trusted_config_paths, or any mise trust store.
python_shim="$(command -v python3)"
python_bin="$("$python_shim" -c 'import sys; print(sys.executable)')"
case "$python_bin" in
  ""|*/shims/*)
    printf 'fixture harness error: could not resolve a non-shim python3 (got %s)\n' "${python_bin:-<empty>}" >&2
    exit 1
    ;;
esac
direnv_bin="$(command -v direnv)"
mise_bin="$(command -v mise)"

project_dir="$tmp_dir/project"
home_dir="$tmp_dir/home"
direnv_config="$tmp_dir/direnv-config"
mise_data="$tmp_dir/mise-data"
mise_cache="$tmp_dir/mise-cache"
mise_state="$tmp_dir/mise-state"
mkdir -p "$project_dir" "$home_dir" "$direnv_config" "$mise_data" "$mise_cache" "$mise_state"

direnv_marker_value="p09_direnv_terminal_marker"
mise_marker_value="p09_mise_terminal_marker"

cat > "$project_dir/.envrc" <<EOF
export HCS_DIRENV_MARKER=$direnv_marker_value
EOF

cat > "$project_dir/.mise.toml" <<EOF
[env]
HCS_MISE_MARKER = "$mise_marker_value"
EOF

path_min="/opt/homebrew/bin:/usr/bin:/bin"
direnv_allow_out="$tmp_dir/direnv-allow.out"
direnv_exec_out="$tmp_dir/direnv-exec.json"
direnv_exec_err="$tmp_dir/direnv-exec.err"
mise_trust_out="$tmp_dir/mise-trust.out"
mise_exec_out="$tmp_dir/mise-exec.json"
mise_exec_err="$tmp_dir/mise-exec.err"

env -i \
  HOME="$home_dir" \
  PATH="$path_min" \
  SHELL="/bin/zsh" \
  DIRENV_CONFIG="$direnv_config" \
  XDG_CONFIG_HOME="$tmp_dir/xdg" \
  /bin/sh -c 'cd "$1" && "$2" allow .envrc' sh "$project_dir" "$direnv_bin" \
  > "$direnv_allow_out" 2>&1

env -i \
  HOME="$home_dir" \
  PATH="$path_min" \
  SHELL="/bin/zsh" \
  DIRENV_CONFIG="$direnv_config" \
  XDG_CONFIG_HOME="$tmp_dir/xdg" \
  EXPECTED_DIRENV_MARKER="$direnv_marker_value" \
  /bin/sh -c 'cd "$1" && "$2" exec . "$3" -c '"'"'
import json
import os

name = "HCS_DIRENV_MARKER"
expected = os.environ["EXPECTED_DIRENV_MARKER"]
print(json.dumps({
    "marker_present": name in os.environ,
    "marker_value_matches": os.environ.get(name) == expected,
}, sort_keys=True))
'"'" sh "$project_dir" "$direnv_bin" "$python_bin" \
  > "$direnv_exec_out" 2> "$direnv_exec_err"

env -i \
  HOME="$home_dir" \
  PATH="$path_min" \
  SHELL="/bin/zsh" \
  MISE_DATA_DIR="$mise_data" \
  MISE_CACHE_DIR="$mise_cache" \
  MISE_STATE_DIR="$mise_state" \
  /bin/sh -c 'cd "$1" && "$2" trust .mise.toml' sh "$project_dir" "$mise_bin" \
  > "$mise_trust_out" 2>&1

env -i \
  HOME="$home_dir" \
  PATH="$path_min" \
  SHELL="/bin/zsh" \
  MISE_DATA_DIR="$mise_data" \
  MISE_CACHE_DIR="$mise_cache" \
  MISE_STATE_DIR="$mise_state" \
  EXPECTED_MISE_MARKER="$mise_marker_value" \
  /bin/sh -c 'cd "$1" && "$2" exec --no-deps -- "$3" -c '"'"'
import json
import os

name = "HCS_MISE_MARKER"
expected = os.environ["EXPECTED_MISE_MARKER"]
print(json.dumps({
    "marker_present": name in os.environ,
    "marker_value_matches": os.environ.get(name) == expected,
}, sort_keys=True))
'"'" sh "$project_dir" "$mise_bin" "$python_bin" \
  > "$mise_exec_out" 2> "$mise_exec_err"

"$python_bin" - \
  "$direnv_exec_out" "$direnv_exec_err" \
  "$mise_exec_out" "$mise_exec_err" \
  "$tmp_dir" "$direnv_marker_value" "$mise_marker_value" <<'PYEOF'
import json
import sys
from pathlib import Path

direnv_exec_out, direnv_exec_err, mise_exec_out, mise_exec_err, tmp_dir, direnv_marker, mise_marker = sys.argv[1:]

with open(direnv_exec_out) as f:
    direnv_result = json.load(f)
with open(mise_exec_out) as f:
    mise_result = json.load(f)

for label, result in {
    "direnv": direnv_result,
    "mise": mise_result,
}.items():
    if result.get("marker_present") is not True:
        raise SystemExit(f"{label} marker was not visible after isolated allow/trust")
    if result.get("marker_value_matches") is not True:
        raise SystemExit(f"{label} marker did not match expected synthetic value")

combined_text = "\n".join(
    Path(path).read_text(errors="replace")
    for path in (direnv_exec_out, direnv_exec_err, mise_exec_out, mise_exec_err)
)
for marker in (direnv_marker, mise_marker):
    if marker in combined_text:
        raise SystemExit("fixture output leaked a synthetic marker value")

if not str(Path(tmp_dir)).startswith("/"):
    raise SystemExit("fixture temp directory should be absolute")

print("  ✓ direnv/mise terminal fixture passed")
PYEOF
