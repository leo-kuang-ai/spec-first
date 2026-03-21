#!/usr/bin/env sh
# Spec-First AI Runtime Hook - Progress Sync
# Requires: POSIX sh, Git (optional for root detection)

set -eu

# 跨平台项目根目录发现
find_root() {
  dir="$(pwd)"
  while [ "$dir" != "/" ] && [ -n "$dir" ]; do
    [ -d "$dir/.spec-first" ] && printf '%s' "$dir" && return 0
    parent="$(dirname "$dir")"
    [ "$parent" = "$dir" ] && break
    dir="$parent"
  done
  git rev-parse --show-toplevel 2>/dev/null && return 0
  return 1
}

ROOT="$(find_root)" || exit 0
cd "$ROOT" 2>/dev/null || exit 0

FEAT="$(head -1 .spec-first/current 2>/dev/null || true)"
FILE="specs/$FEAT/task_plan.md"
[ -n "$FEAT" ] && [ -f "$FILE" ] || exit 0

echo "=== 进度同步提醒 ==="
echo "文件已修改。如果此次修改完成了一个 TASK 或 AC，请检查是否需要更新 task_plan.md 中的完成状态。"
echo "当前 in_progress TASK:"
awk -F'|' '
  BEGIN { found=0 }
  /^\|/ && !/---/ {
    taskid=""; title=""; status=""
    for (i=1; i<=NF; i++) {
      c=$i; gsub(/^[ \t]+|[ \t]+$/, "", c)
      s=tolower(c)
      if (c ~ /^TASK-/ && taskid == "") taskid=c
      if (s=="in_progress" || s=="in progress") status=c
      if (title=="" && c!~/^TASK-/ && s!="status" && s!="in_progress" && s!="in progress" && c!="") title=c
    }
    if (taskid!="" && status!="") {
      printf("  - %s | %s | %s\n", taskid, title, status)
      found=1
      exit
    }
  }
  END {
    if (!found) print "  (无 in_progress TASK)"
  }
' "$FILE"
