#!/bin/bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/test-rollback.sh <snapshot-dir>

Environment:
  CLI_SMOKE_COMMAND  Override CLI smoke test command
  PNPM_INSTALL_ARGS  Override pnpm install args. Default: --frozen-lockfile
  SKIP_INSTALL=1     Skip pnpm install
  SKIP_LINT=1        Skip pnpm lint
  SKIP_TYPECHECK=1   Skip pnpm typecheck
  SKIP_BUILD=1       Skip pnpm -s build
EOF
}

run_cli_smoke_test() {
  if [ -n "${CLI_SMOKE_COMMAND:-}" ]; then
    sh -c "$CLI_SMOKE_COMMAND"
    return
  fi

  if [ -f "packages/cli/dist/cli/index.js" ]; then
    node packages/cli/dist/cli/index.js --help >/dev/null
    return
  fi

  if [ -f "packages/cli/bin/spec-first.js" ]; then
    node packages/cli/bin/spec-first.js --help >/dev/null
    return
  fi

  if [ -f "packages/cli/bin/spec-first.js" ]; then
    node packages/cli/bin/spec-first.js --help >/dev/null
    return
  fi

  echo "Unable to locate a CLI entrypoint for smoke testing." >&2
  exit 1
}

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  usage
  exit 0
fi

SNAPSHOT_DIR="${1:-}"

if [ -z "$SNAPSHOT_DIR" ]; then
  usage
  exit 1
fi

if [ ! -d "$SNAPSHOT_DIR" ]; then
  echo "Snapshot directory not found: $SNAPSHOT_DIR" >&2
  exit 1
fi

if [ ! -f "${SNAPSHOT_DIR}/.snapshot-meta.json" ]; then
  echo "Snapshot metadata missing: ${SNAPSHOT_DIR}/.snapshot-meta.json" >&2
  exit 1
fi

TEMP_ROOT="$(mktemp -d /tmp/rollback-test.XXXXXX)"
TEMP_DIR="${TEMP_ROOT}/workspace"
cleanup() {
  rm -rf "$TEMP_ROOT"
}
trap cleanup EXIT

mkdir -p "$TEMP_DIR"
cp -R "${SNAPSHOT_DIR}/." "$TEMP_DIR"

cd "$TEMP_DIR"

echo "Testing snapshot in: $TEMP_DIR"

if [ "${SKIP_INSTALL:-0}" != "1" ]; then
  if [ -d node_modules ]; then
    echo "Using existing node_modules in snapshot."
  else
    pnpm install ${PNPM_INSTALL_ARGS:---frozen-lockfile}
  fi
fi

if [ "${SKIP_BUILD:-0}" != "1" ]; then
  pnpm -s build
fi

run_cli_smoke_test

if [ "${SKIP_LINT:-0}" != "1" ]; then
  pnpm lint
fi

if [ "${SKIP_TYPECHECK:-0}" != "1" ]; then
  pnpm typecheck
fi

echo "Snapshot restore test passed: $SNAPSHOT_DIR"
