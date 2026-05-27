#!/usr/bin/env bash
# Point this repo at .githooks/ for Git hooks.
# Run once after cloning. Idempotent.

set -euo pipefail

cd "$(dirname "$0")/.."

git config core.hooksPath .githooks
chmod +x .githooks/* 2>/dev/null || true

echo "[install-hooks] core.hooksPath set to .githooks"
echo "[install-hooks] active hooks:"
ls -1 .githooks/ | grep -v "^README" || echo "  (none)"
