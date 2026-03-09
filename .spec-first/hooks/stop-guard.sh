#!/usr/bin/env sh
set -eu

FEAT="$(head -1 .spec-first/current 2>/dev/null || true)"
FILE="specs/$FEAT/task_plan.md"

# 仅在 04_implement 阶段才检查 in_progress 任务
if [ -z "$FEAT" ] || [ ! -f "$FILE" ]; then
  exit 0
fi

# 读取阶段信息（优先 stage-state.json）
STAGE=""
if [ -f "specs/$FEAT/stage-state.json" ]; then
  STAGE="$(awk -F'"' '/"currentStage"[[:space:]]*:/ {print $4; exit}' "specs/$FEAT/stage-state.json" 2>/dev/null || true)"
fi

# 仅在 04_implement 阶段检查
[ "$STAGE" = "04_implement" ] || exit 0

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
  ' "$FILE"
)"

# 只输出提醒，不返回错误码（避免触发 AI 死循环）
if [ -n "$IN_PROGRESS_IDS" ]; then
  echo "💡 提示：仍有进行中的 TASK，建议完成或更新状态：" >&2
  echo "$IN_PROGRESS_IDS" >&2
fi

exit 0
