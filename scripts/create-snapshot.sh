#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

usage() {
  cat <<'EOF'
Usage:
  scripts/create-snapshot.sh <type> <stage> [project-root]

Arguments:
  type   pre | post | emergency
  stage  S1 | S2 | S3 | S4
  project-root  Optional. Defaults to the repo root containing this script.

Example:
  scripts/create-snapshot.sh pre S1
EOF
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  usage
  exit 0
fi

TYPE="${1:-}"
STAGE="${2:-}"
PROJECT_ROOT="${3:-${PROJECT_ROOT_OVERRIDE:-$DEFAULT_PROJECT_ROOT}}"
BACKUP_PREFIX="$(dirname "$PROJECT_ROOT")/$(basename "$PROJECT_ROOT").backup"

case "$TYPE" in
  pre|post|emergency) ;;
  *)
    usage
    exit 1
    ;;
esac

case "$STAGE" in
  S1|S2|S3|S4) ;;
  *)
    usage
    exit 1
    ;;
esac

require_cmd cp
require_cmd date
require_cmd dirname
require_cmd du
require_cmd node

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
SNAPSHOT_NAME="${TYPE}-${STAGE}.${TIMESTAMP}"
SNAPSHOT_DIR="${BACKUP_PREFIX}.${SNAPSHOT_NAME}"

if [ ! -d "$PROJECT_ROOT" ]; then
  echo "Project root not found: $PROJECT_ROOT" >&2
  exit 1
fi

if [ -e "$SNAPSHOT_DIR" ]; then
  echo "Snapshot already exists: $SNAPSHOT_DIR" >&2
  exit 1
fi

cp -R "$PROJECT_ROOT" "$SNAPSHOT_DIR"

SIZE_MB="$(du -sm "$SNAPSHOT_DIR" | awk '{print $1}')"
CREATED_AT="$(date +%Y-%m-%dT%H:%M:%S%z)"
NODE_VERSION="$(node --version)"
PNPM_VERSION="$(pnpm --version 2>/dev/null || echo unavailable)"
CREATOR="$(whoami)"

SNAPSHOT_NAME="$SNAPSHOT_NAME" \
STAGE="$STAGE" \
TYPE="$TYPE" \
CREATED_AT="$CREATED_AT" \
CREATOR="$CREATOR" \
PROJECT_ROOT="$PROJECT_ROOT" \
SNAPSHOT_DIR="$SNAPSHOT_DIR" \
SIZE_MB="$SIZE_MB" \
NODE_VERSION="$NODE_VERSION" \
PNPM_VERSION="$PNPM_VERSION" \
node --input-type=module <<'EOF'
import { writeFileSync } from "node:fs";

const meta = {
  snapshotName: process.env.SNAPSHOT_NAME,
  stage: process.env.STAGE,
  type: process.env.TYPE,
  createdAt: process.env.CREATED_AT,
  creator: process.env.CREATOR,
  repoMode: "filesystem-only",
  protocolBaseline: "spec-first",
  projectRoot: process.env.PROJECT_ROOT,
  snapshotPath: process.env.SNAPSHOT_DIR,
  sizeMB: process.env.SIZE_MB,
  nodeVersion: process.env.NODE_VERSION,
  pnpmVersion: process.env.PNPM_VERSION,
};

writeFileSync(
  `${process.env.SNAPSHOT_DIR}/.snapshot-meta.json`,
  `${JSON.stringify(meta, null, 2)}\n`,
);
EOF

echo "Created snapshot: ${SNAPSHOT_DIR}"
