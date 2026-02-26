#!/usr/bin/env sh
set -eu

FEAT="$(head -1 .spec-first/current 2>/dev/null || true)"
FILE="specs/$FEAT/task_plan.md"
[ -n "$FEAT" ] && [ -f "$FILE" ] || exit 0

echo "=== TASK 上下文刷新 ==="
awk -F'|' '
  BEGIN { found=0 }
  /^\|/ {
    n=0; taskid=""; title=""; last=""
    for (i=1; i<=NF; i++) {
      c=$i
      gsub(/^[ \t]+|[ \t]+$/, "", c)
      if (c != "") {
        n++
        if (c ~ /^TASK-/ && taskid == "") taskid=c
        if (n==1 || n==2) { if (taskid != "" && title == "") { title=c } }
        last=c
      }
    }
    if (taskid == "") next
    if (title == taskid) title=""
    s=tolower(last)
    if (s=="in_progress" || s=="in progress") {
      printf("Current TASK: %s | %s | %s\n", taskid, title, last)
      found=1
    }
  }
  END {
    if (!found) print "Current TASK: (no in_progress task found)"
  }
' "$FILE"
