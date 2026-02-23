#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

node "$ROOT_DIR/scripts/stage-viewer/bootstrap.js" --source codex --open >/dev/null 2>&1 || true

command codex "$@"
