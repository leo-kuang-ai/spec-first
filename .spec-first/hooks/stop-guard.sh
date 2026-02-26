#!/usr/bin/env sh
set -eu

FEAT="$(head -1 .spec-first/current 2>/dev/null || true)"
FILE="specs/$FEAT/task_plan.md"
if [ -z "$FEAT" ] || [ ! -f "$FILE" ]; then
  exit 0
fi

PENDING_IDS="$(
  awk -F'|' '
    /^\|/ {
      taskid=""; last=""
      for (i=1; i<=NF; i++) {
        c=$i
        gsub(/^[ \t]+|[ \t]+$/, "", c)
        if (c != "") {
          if (c ~ /^TASK-/ && taskid == "") taskid=c
          last=c
        }
      }
      if (taskid == "") next
      s=tolower(last)
      if (s != "complete" && s != "done" && s != "verified") print taskid
    }
  ' "$FILE"
)"

if [ -n "$PENDING_IDS" ]; then
  echo "⚠️ 仍有未完成 TASK：" >&2
  echo "$PENDING_IDS" >&2
  exit 2
fi
