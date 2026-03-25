#!/bin/bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/diff-snapshots.sh <snapshot-a> <snapshot-b> [--full] [--output <file>] [--strict]

Options:
  --full           Print full recursive diff instead of summary mode
  --output <file>  Write diff output to a file
  --strict         Return non-zero when differences are found
EOF
}

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  usage
  exit 0
fi

if [ "$#" -lt 2 ]; then
  usage
  exit 1
fi

SNAPSHOT_A="$1"
SNAPSHOT_B="$2"
shift 2

MODE="summary"
OUTPUT_FILE=""
STRICT_MODE=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --full)
      MODE="full"
      shift
      ;;
    --output)
      OUTPUT_FILE="${2:-}"
      if [ -z "$OUTPUT_FILE" ]; then
        echo "Missing value for --output" >&2
        exit 1
      fi
      shift 2
      ;;
    --strict)
      STRICT_MODE=1
      shift
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

for dir in "$SNAPSHOT_A" "$SNAPSHOT_B"; do
  if [ ! -d "$dir" ]; then
    echo "Snapshot directory not found: $dir" >&2
    exit 1
  fi
done

DIFF_ARGS=(-r --exclude=node_modules --exclude=.snapshot-meta.json)
if [ "$MODE" = "summary" ]; then
  DIFF_ARGS=(-qr --exclude=node_modules --exclude=.snapshot-meta.json)
fi

TMP_OUTPUT="$(mktemp)"
trap 'rm -f "$TMP_OUTPUT"' EXIT

set +e
diff "${DIFF_ARGS[@]}" "$SNAPSHOT_A" "$SNAPSHOT_B" >"$TMP_OUTPUT"
DIFF_EXIT=$?
set -e

if [ "$DIFF_EXIT" -gt 1 ]; then
  cat "$TMP_OUTPUT" >&2
  echo "Snapshot comparison failed." >&2
  exit "$DIFF_EXIT"
fi

if [ -n "$OUTPUT_FILE" ]; then
  cp "$TMP_OUTPUT" "$OUTPUT_FILE"
fi

echo "Comparing snapshots:"
echo "  A: $SNAPSHOT_A"
echo "  B: $SNAPSHOT_B"
echo

if [ "$MODE" = "summary" ]; then
  if [ "$DIFF_EXIT" -eq 0 ]; then
    echo "No differences found."
  else
    echo "Differences found:"
    head -20 "$TMP_OUTPUT"
    echo
    echo "Run with --full for the complete recursive diff."
  fi
else
  cat "$TMP_OUTPUT"
fi

if [ -n "$OUTPUT_FILE" ]; then
  echo
  echo "Diff written to: $OUTPUT_FILE"
fi

if [ "$DIFF_EXIT" -eq 1 ] && [ "$STRICT_MODE" -eq 0 ]; then
  exit 0
fi

exit "$DIFF_EXIT"
