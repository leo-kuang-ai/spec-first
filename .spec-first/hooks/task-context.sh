#!/usr/bin/env sh
# Spec-First AI Runtime Hook - Task Context
# Requires: POSIX sh, Git (optional for root detection)

set -eu

# 跨平台项目根目录发现
find_root() {
  # 方法1: 向上查找包含 specs/ 目录的项目根
  dir="$(pwd)"
  while [ "$dir" != "/" ] && [ -n "$dir" ]; do
    # 检查是否为真正的项目根（同时有 .spec-first 和 specs 目录）
    if [ -d "$dir/.spec-first" ] && [ -d "$dir/specs" ]; then
      printf '%s' "$dir"
      return 0
    fi
    parent="$(dirname "$dir")"
    [ "$parent" = "$dir" ] && break
    dir="$parent"
  done
  # 方法2: Git root (Windows Git Bash / macOS / Linux)
  if git rev-parse --show-toplevel 2>/dev/null; then
    return 0
  fi
  return 1
}

ROOT="$(find_root)" || exit 0
cd "$ROOT" 2>/dev/null || exit 0

FEAT="$(head -1 .spec-first/current 2>/dev/null || true)"
FILE="specs/$FEAT/task_plan.md"
STAGE_FILE="specs/$FEAT/stage-state.json"
[ -n "$FEAT" ] && [ -f "$FILE" ] || exit 0

echo "=== TASK 上下文刷新 ==="
if [ -f "$STAGE_FILE" ]; then
  STAGE="$(awk -F'"' '/"currentStage"[[:space:]]*:/ {print $4; exit}' "$STAGE_FILE" 2>/dev/null || true)"
  [ -n "$STAGE" ] && echo "Current Stage: $STAGE"
fi

OPEN_TASKS="$(
  awk -F'|' '
    BEGIN { count=0 }
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
      if (s == "complete" || s == "verified") s="done"
      if (s != "done") count++
    }
    END { print count + 0 }
  ' "$FILE"
)"
echo "Open TASKs: $OPEN_TASKS"

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
