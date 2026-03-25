#!/usr/bin/env bash
set -euo pipefail

if [ "${1:-}" = "" ]; then
  echo "Usage: $0 <skill-file>"
  exit 1
fi

SAMPLE_FILE="$1"
if [ ! -f "$SAMPLE_FILE" ]; then
  echo "❌ File not found: $SAMPLE_FILE"
  exit 1
fi

TEMP_FILE="$(mktemp)"
trap 'rm -f "$TEMP_FILE"' EXIT
cp "$SAMPLE_FILE" "$TEMP_FILE"

python3 - "$TEMP_FILE" <<'PY'
from __future__ import annotations

import sys
from pathlib import Path

path = Path(sys.argv[1])
text = path.read_text(encoding="utf-8")
for old, new in [
    ("spec init", "spec-first init"),
    ("spec update", "spec-first update"),
    ("spec --version", "spec-first --version"),
]:
    text = text.replace(old, new)
path.write_text(text, encoding="utf-8")
PY

echo "📝 Previewing changes for: $SAMPLE_FILE"
diff -u "$SAMPLE_FILE" "$TEMP_FILE" || true
