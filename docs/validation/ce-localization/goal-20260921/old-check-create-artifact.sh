#!/bin/bash
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && exit 1
art=$(find .spec-first/workflows/spec-handoff -type f -name '*.md' 2>/dev/null | head -1)
[[ -n "$art" ]] || exit 1
grep -q 'spec-handoff/v1' "$art"
for field in summary source_refs freshness limitations; do line=$(grep -E "^${field}:" "$art"|head -1); [[ -n "$line" ]]; done
grep -qiE 'sha-?256' <<<"$message"
grep -q 'resume' <<<"$message"
