#!/usr/bin/env bash
# Source-only consumer fixtures; no install, network, host probe or role execution.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
exec python3 -I -S -B "$repo_root/scripts/dev/project-manifest-fixtures.py"
