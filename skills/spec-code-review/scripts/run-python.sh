#!/bin/bash
set -euo pipefail

TARGET_SCRIPT="${1:?usage: run-python.sh <script> [args...]}"
shift

resolve_python() {
  local candidate
  for candidate in python3 python; do
    if command -v "$candidate" >/dev/null 2>&1 && "$candidate" -c 'import sys; raise SystemExit(0 if sys.version_info.major == 3 else 1)' >/dev/null 2>&1; then
      PYTHON_CMD=("$candidate")
      return 0
    fi
  done
  if command -v py >/dev/null 2>&1 && py -3 -c 'import sys; raise SystemExit(0 if sys.version_info.major == 3 else 1)' >/dev/null 2>&1; then
    PYTHON_CMD=(py -3)
    return 0
  fi
  return 1
}

if ! resolve_python; then
  echo 'run-python: no runnable Python 3 interpreter found (tried python3, python, py -3)' >&2
  exit 127
fi

exec "${PYTHON_CMD[@]}" "$TARGET_SCRIPT" "$@"
