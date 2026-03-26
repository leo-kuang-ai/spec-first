#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Current Task Selector.

Unified entrypoint for inspecting active tasks and switching the current task
pointer without exposing suffix-based lookup rules.

Usage:
    python3 ./.spec-first/scripts/current_task.py list
    python3 ./.spec-first/scripts/current_task.py switch <selection>

Selection rules:
    - numeric index from the printed task list
    - exact task directory name
    - exact repo-relative task path (e.g. .spec-first/tasks/03-25-my-task)
    - absolute path to a task directory inside the repository
"""

from __future__ import annotations

import argparse
from pathlib import Path

from common.log import Colors, colored
from common.paths import (
    FILE_TASK_JSON,
    get_current_task,
    get_repo_root,
    get_tasks_dir,
    set_current_task,
)
from common.task_utils import run_task_hooks
from common.tasks import children_progress, get_all_statuses, iter_active_tasks, load_task
from common.types import TaskInfo


def _task_relative_path(task_dir: Path, repo_root: Path) -> str:
    try:
        return str(task_dir.relative_to(repo_root))
    except ValueError:
        return str(task_dir)


def _collect_visible_tasks(tasks_dir: Path):
    tasks = {task.dir_name: task for task in iter_active_tasks(tasks_dir)}
    statuses = get_all_statuses(tasks_dir)
    rows: list[tuple[int, TaskInfo, int]] = []

    def visit(dir_name: str, indent: int = 0) -> None:
        task = tasks[dir_name]
        rows.append((len(rows) + 1, task, indent))
        for child_name in task.children:
            if child_name in tasks:
                visit(child_name, indent + 1)

    for dir_name in sorted(tasks):
        if not tasks[dir_name].parent:
            visit(dir_name)

    return rows, tasks, statuses


def _print_task_list(repo_root: Path) -> int:
    tasks_dir = get_tasks_dir(repo_root)
    current_task = get_current_task(repo_root)
    rows, _, statuses = _collect_visible_tasks(tasks_dir)

    print(colored("Active tasks:", Colors.BLUE))
    print()

    if not rows:
        print("  (no active tasks)")
        print()
        print("Total: 0 task(s)")
        return 0

    for number, task, indent in rows:
        task_path = _task_relative_path(task.directory, repo_root)
        marker = ""
        if task_path == current_task:
            marker = f" {colored('<- current', Colors.GREEN)}"

        progress = children_progress(task.children, statuses)
        pkg_tag = f" @{task.package}" if task.package else ""
        prefix = "  " * indent
        print(
            f"{prefix}{number}. {task.dir_name}/ ({task.status}) "
            f"[{task_path}]{pkg_tag}{progress}{marker}"
        )

    print()
    print(f"Total: {len(rows)} task(s)")
    return 0


def _resolve_selection(
    selection: str,
    repo_root: Path,
) -> Path | None:
    tasks_dir = get_tasks_dir(repo_root)
    rows, tasks, _ = _collect_visible_tasks(tasks_dir)

    token = selection.strip().rstrip("/")
    if not token:
        return None

    if token.isdigit():
        index = int(token)
        if 1 <= index <= len(rows):
            return rows[index - 1][1].directory
        return None

    for task in tasks.values():
        if task.dir_name == token:
            return task.directory

    candidate = Path(token)
    if not candidate.is_absolute():
        candidate = repo_root / candidate

    try:
        candidate = candidate.resolve()
    except (OSError, RuntimeError):
        return None

    if not candidate.is_dir():
        return None

    try:
        candidate.relative_to(tasks_dir.resolve())
    except ValueError:
        return None

    if load_task(candidate) is None:
        return None

    return candidate


def _context_summary(task_dir: Path) -> tuple[str, bool]:
    files = ["implement.jsonl", "check.jsonl", "debug.jsonl"]
    parts = []
    complete = True

    for name in files:
        exists = (task_dir / name).is_file()
        parts.append(f"{name} {'✓' if exists else '✗'}")
        complete = complete and exists

    return " | ".join(parts), complete


def _switch_to_task(task_dir: Path, repo_root: Path) -> int:
    task_json_path = task_dir / FILE_TASK_JSON
    if not task_json_path.is_file():
        print(colored(f"Error: task.json not found: {_task_relative_path(task_dir, repo_root)}", Colors.RED))
        return 1

    task_data = load_task(task_dir)
    if task_data is None:
        print(colored(f"Error: invalid task.json: {_task_relative_path(task_dir, repo_root)}", Colors.RED))
        return 1

    task_path = _task_relative_path(task_dir, repo_root)
    current_task = get_current_task(repo_root)
    if current_task == task_path:
        print(colored(f"✓ Already current task: {task_path}", Colors.GREEN))
        return 0

    if not set_current_task(task_path, repo_root):
        print(colored("Error: failed to set current task", Colors.RED))
        return 1

    print(colored(f"✓ Current task set to: {task_data.dir_name}", Colors.GREEN))
    print(f"  Path: {task_path}")

    run_task_hooks("after_start", task_json_path, repo_root)

    context_summary, complete = _context_summary(task_dir)
    print(f"  Context: {context_summary}")
    if not complete:
        print("  Hint: context is incomplete, run init-context next")

    return 0


def cmd_list(args: argparse.Namespace) -> int:
    repo_root = get_repo_root()
    return _print_task_list(repo_root)


def cmd_switch(args: argparse.Namespace) -> int:
    repo_root = get_repo_root()
    selection = getattr(args, "selection", None)

    if not selection:
        return _print_task_list(repo_root)

    task_dir = _resolve_selection(selection, repo_root)
    if not task_dir:
        print(colored(f"Error: task not found: {selection}", Colors.RED))
        print(
            "Hint: choose a number from `./.spec-first/scripts/current_task.py list`, or pass an exact task directory/path",
        )
        return 1

    return _switch_to_task(task_dir, repo_root)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="List and switch the current task pointer")
    subparsers = parser.add_subparsers(dest="command")

    subparsers.add_parser("list", help="List active tasks")

    switch_parser = subparsers.add_parser("switch", help="Switch to a selected task")
    switch_parser.add_argument("selection", nargs="?", help="Task number, exact name, or exact path")

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    command = args.command or "list"
    if command == "list":
        return cmd_list(args)
    if command == "switch":
        return cmd_switch(args)

    parser.print_help()
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
