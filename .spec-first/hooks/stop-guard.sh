#!/usr/bin/env sh
# Spec-First AI Runtime Hook - Stop Guard
# Requires: POSIX sh, Git (optional for root detection)

set -eu

. "$(dirname "$0")/current-task-common.sh"

ROOT="$(spec_first_find_root)" || exit 0
cd "$ROOT" 2>/dev/null || exit 0

TASK_DIR="$(spec_first_current_task_dir "$ROOT")" || exit 0
TASK_JSON="$(spec_first_task_json_path "$TASK_DIR")"
[ -f "$TASK_JSON" ] || exit 0

TASK_META="$(spec_first_task_metadata "$TASK_JSON" "$TASK_DIR")" || exit 0
eval "$TASK_META"

if [ "${task_terminal:-1}" = "1" ] || [ "${task_status:-unknown}" = "planning" ]; then
  exit 0
fi

# 只输出提醒，不返回错误码（避免触发 AI 死循环）
echo "💡 提示：当前任务仍未结束，建议先完成或更新状态：" >&2
echo "  - ${task_title:-unknown} (${task_dir_name:-unknown})" >&2
echo "  - Status: ${task_status:-unknown}" >&2
echo "  - Current phase: ${task_phase:-0}/${task_next_action_count:-0}" >&2
if [ -n "${task_next_actions:-}" ]; then
  echo "  - Next actions: ${task_next_actions}" >&2
fi

exit 0
