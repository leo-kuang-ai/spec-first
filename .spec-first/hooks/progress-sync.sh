#!/usr/bin/env sh
# Spec-First AI Runtime Hook - Progress Sync
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

echo "=== 进度同步提醒 ==="
echo "当前任务: ${task_title:-unknown} (${task_dir_name:-unknown})"
echo "状态: ${task_status:-unknown}"
echo "当前阶段: ${task_phase:-0}/${task_next_action_count:-0}"
if [ -n "${task_next_actions:-}" ]; then
  echo "后续动作: ${task_next_actions}"
fi
echo "上下文文件: ${task_context_summary:-implement.jsonl ✗ | check.jsonl ✗ | debug.jsonl ✗}"

if [ "${task_has_implement:-0}" = "0" ] || [ "${task_has_check:-0}" = "0" ] || [ "${task_has_debug:-0}" = "0" ]; then
  echo "提示：当前任务的上下文仍不完整，必要时运行 init-context 补齐。" >&2
fi
