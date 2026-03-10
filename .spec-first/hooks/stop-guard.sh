#!/usr/bin/env sh
set -eu

FEAT="$(head -1 .spec-first/current 2>/dev/null || true)"
[ -z "$FEAT" ] && exit 0

STAGE_FILE="specs/$FEAT/stage-state.json"
TASK_FILE="specs/$FEAT/task_plan.md"

# 仅在 04_implement 阶段检查 in_progress 任务
if [ -f "$STAGE_FILE" ]; then
  STAGE="$(awk -F'"' '/"currentStage"[[:space:]]*:/ {print $4; exit}' "$STAGE_FILE" 2>/dev/null || true)"
  [ "$STAGE" != "04_implement" ] && exit 0
fi

[ ! -f "$TASK_FILE" ] && exit 0

IN_PROGRESS_IDS="$(
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
      if (s == "in_progress" || s == "in progress") print taskid
    }
  ' "$TASK_FILE" 2>/dev/null || true
)"

# 只输出提醒，不返回错误码（避免触发 AI 死循环）
if [ -n "$IN_PROGRESS_IDS" ]; then
  echo "💡 提示：仍有进行中的 TASK，建议完成或更新状态：" >&2
  echo "$IN_PROGRESS_IDS" >&2
fi

exit 0
