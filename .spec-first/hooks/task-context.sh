#!/usr/bin/env sh
# Spec-First AI Runtime Hook - Task Context
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

echo "=== TASK 上下文刷新 ==="
echo "Current Task: ${task_title:-unknown} (${task_dir_name:-unknown})"
echo "Status: ${task_status:-unknown}"
echo "Current Phase: ${task_phase:-0}/${task_next_action_count:-0}"
if [ -n "${task_next_actions:-}" ]; then
  echo "Next Actions: ${task_next_actions}"
fi
echo "Context Files: ${task_context_summary:-implement.jsonl ✗ | check.jsonl ✗ | debug.jsonl ✗}"

if [ "${task_terminal:-0}" = "1" ]; then
  echo "Task State: terminal"
else
  echo "Task State: active"
fi
