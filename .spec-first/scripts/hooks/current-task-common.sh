#!/usr/bin/env sh
# Shared helpers for legacy shell hooks that now consume .current-task.

set -eu

spec_first_find_root() {
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

spec_first_current_task_rel() {
  root="${1:-}"
  [ -n "$root" ] || return 1

  file="$root/.spec-first/.current-task"
  [ -f "$file" ] || return 1

  task="$(sed -n '1p' "$file" 2>/dev/null | tr -d '\r' | awk '{$1=$1; print}')"
  [ -n "$task" ] || return 1

  printf '%s' "$task"
}

spec_first_current_task_dir() {
  root="${1:-}"
  [ -n "$root" ] || return 1

  task_rel="$(spec_first_current_task_rel "$root")" || return 1

  case "$task_rel" in
    /*) printf '%s' "$task_rel" ;;
    *) printf '%s/%s' "$root" "$task_rel" ;;
  esac
}

spec_first_task_json_path() {
  task_dir="${1:-}"
  [ -n "$task_dir" ] || return 1
  printf '%s/task.json' "$task_dir"
}

spec_first_task_metadata() {
  task_json_path="${1:-}"
  task_dir_path="${2:-}"
  [ -n "$task_json_path" ] || return 1
  [ -n "$task_dir_path" ] || return 1

  python3 - "$task_json_path" "$task_dir_path" <<'PY'
from __future__ import annotations

import json
import shlex
import sys
from pathlib import Path

task_json = Path(sys.argv[1])
task_dir = Path(sys.argv[2])

try:
    data = json.loads(task_json.read_text(encoding="utf-8"))
except (OSError, json.JSONDecodeError, UnicodeDecodeError):
    sys.exit(1)

title = data.get("title") or data.get("name") or task_dir.name
status = data.get("status") or "unknown"
phase = data.get("current_phase", 0)
try:
    phase = int(phase)
except (TypeError, ValueError):
    phase = 0

next_actions = data.get("next_action")
if not isinstance(next_actions, list):
    next_actions = []

action_labels: list[str] = []
for entry in next_actions:
    if not isinstance(entry, dict):
        continue
    action = entry.get("action")
    phase_num = entry.get("phase")
    if action is None and phase_num is None:
        continue
    if phase_num is None:
        action_labels.append(str(action))
    elif action is None:
        action_labels.append(str(phase_num))
    else:
        action_labels.append(f"{phase_num}:{action}")

remaining = max(0, len(next_actions) - phase)
has_implement = (task_dir / "implement.jsonl").is_file()
has_check = (task_dir / "check.jsonl").is_file()
has_debug = (task_dir / "debug.jsonl").is_file()

context_summary = "implement.jsonl {imp} | check.jsonl {chk} | debug.jsonl {dbg}".format(
    imp="✓" if has_implement else "✗",
    chk="✓" if has_check else "✗",
    dbg="✓" if has_debug else "✗",
)

def emit(name: str, value: object) -> None:
    print(f"{name}={shlex.quote(str(value))}")

emit("task_dir_name", task_dir.name)
emit("task_title", title)
emit("task_status", status)
emit("task_phase", phase)
emit("task_next_action_count", len(next_actions))
emit("task_next_actions", ", ".join(action_labels))
emit("task_remaining_actions", remaining)
emit("task_terminal", "1" if remaining == 0 else "0")
emit("task_context_summary", context_summary)
emit("task_has_implement", "1" if has_implement else "0")
emit("task_has_check", "1" if has_check else "0")
emit("task_has_debug", "1" if has_debug else "0")
PY
}
