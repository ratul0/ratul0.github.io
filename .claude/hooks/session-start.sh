#!/bin/bash
# Installs dependencies in Claude Code cloud sessions so build/test work immediately.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"
command -v pnpm >/dev/null || npm install -g pnpm@10
pnpm install --frozen-lockfile
