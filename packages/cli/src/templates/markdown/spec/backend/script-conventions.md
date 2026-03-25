# Script Conventions

> Standards for Python scripts in the `.spec-first/scripts/` directory.

---

## Overview

All workflow scripts are written in **Python 3.10+** for cross-platform compatibility. Scripts use only the standard library (no external dependencies).

---

## Directory Structure

```
.spec-first/scripts/
├── __init__.py           # Package init
├── common/               # Shared modules
│   ├── __init__.py
│   ├── paths.py          # Path constants and functions
│   ├── developer.py      # Developer identity management
│   ├── task_queue.py     # Task queue CRUD
│   ├── task_utils.py     # Task helper functions
│   ├── phase.py          # Multi-agent phase tracking
│   ├── registry.py       # Agent registry management
│   ├── config.py         # Config reader (config.yaml, hooks)
│   ├── worktree.py       # Git worktree utilities + YAML parser
│   └── git_context.py    # Git/session context
├── hooks/                # Lifecycle hook scripts (project-specific)
│   └── linear_sync.py    # Example: sync tasks to Linear
├── multi_agent/          # Multi-agent pipeline scripts
│   ├── __init__.py
│   ├── start.py          # Start worktree agent
│   ├── status.py         # Monitor agent status
│   ├── plan.py           # Start plan agent
│   ├── cleanup.py        # Cleanup worktree
│   └── create_pr.py      # Create PR from task
├── task.py               # Main task management CLI
├── get_context.py        # Session context retrieval
├── init_developer.py     # Developer initialization
├── get_developer.py      # Get current developer
├── add_session.py        # Session recording
└── create_bootstrap.py   # Bootstrap task creation
```

---

## Script Types

### Library Modules (`common/*.py`)

Shared utilities imported by other scripts. **Never run directly.**

```python
# common/paths.py - Example library module

from __future__ import annotations

from pathlib import Path

# Constants
DIR_WORKFLOW = ".spec-first"
DIR_SCRIPTS = "scripts"
DIR_TASKS = "tasks"

def get_repo_root() -> Path | None:
    """Find repository root by looking for .spec-first directory."""
    current = Path.cwd().resolve()
    while current != current.parent:
        if (current / DIR_WORKFLOW).is_dir():
            return current
        current = current.parent
    return None
```

### Entry Scripts (`*.py`)

CLI tools that users run directly. Include docstring with usage.

```python
#!/usr/bin/env python3
"""
Task Management Script.

Usage:
    python3 task.py create "<title>" [--slug <name>]
    python3 task.py init-context <dir> <dev_type>
    python3 task.py add-context <dir> <file> <reason>
    python3 task.py validate <dir>
    python3 task.py list-context <dir>
    python3 task.py start <dir>
    python3 task.py finish
    python3 task.py set-branch <dir> <branch>
    python3 task.py set-base-branch <dir> <branch>
    python3 task.py set-scope <dir> <scope>
    python3 task.py create-pr [dir] [--dry-run]
    python3 task.py archive <task-name>
    python3 task.py list [--mine] [--status <status>]
    python3 task.py list-archive [YYYY-MM]
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from common.paths import get_repo_root, DIR_WORKFLOW


def main() -> int:
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Task management")
    # ... argument setup
    args = parser.parse_args()
    # ... command dispatch
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

---

## Coding Standards

### Type Hints

Use modern type hints (Python 3.10+ syntax):

```python
# Good
def get_tasks(status: str | None = None) -> list[dict]:
    ...

def read_json(path: Path) -> dict | None:
    ...

# Bad - old style
from typing import Optional, List, Dict
def get_tasks(status: Optional[str] = None) -> List[Dict]:
    ...
```

### Path Handling

Always use `pathlib.Path`:

```python
# Good
from pathlib import Path

def read_file(path: Path) -> str:
    return path.read_text(encoding="utf-8")

config_path = repo_root / DIR_WORKFLOW / "config.json"

# Bad - string concatenation
config_path = repo_root + "/" + DIR_WORKFLOW + "/config.json"
```

### JSON Operations

Use helper functions for consistent error handling:

```python
import json
from pathlib import Path


def read_json(path: Path) -> dict | None:
    """Read JSON file, return None on error."""
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return None


def write_json(path: Path, data: dict) -> bool:
    """Write JSON file, return success status."""
    try:
        path.write_text(
            json.dumps(data, indent=2, ensure_ascii=False),
            encoding="utf-8"
        )
        return True
    except Exception:
        return False
```

### Subprocess Execution

```python
import subprocess
from pathlib import Path


def run_command(
    cmd: list[str],
    cwd: Path | None = None
) -> tuple[int, str, str]:
    """Run command and return (returncode, stdout, stderr)."""
    result = subprocess.run(
        cmd,
        cwd=cwd,
        capture_output=True,
        text=True
    )
    return result.returncode, result.stdout, result.stderr
```

---

## Cross-Platform Compatibility

### CRITICAL: Windows stdio Encoding (stdout + stdin)

On Windows, Python's stdout AND stdin default to the system code page (e.g., GBK/CP936 in China, CP1252 in Western locales). This causes:
- `UnicodeEncodeError` when **printing** non-ASCII characters (stdout)
- `UnicodeDecodeError` when **reading piped** UTF-8 content (stdin), e.g. Chinese text via `cat << EOF | python3 script.py`

**The Problem Chain (stdout)**:

```
Windows code page = GBK (936)
    ↓
Python stdout defaults to GBK encoding
    ↓
Subprocess output contains special chars → replaced with \ufffd (replacement char)
    ↓
json.dumps(ensure_ascii=False) → print()
    ↓
GBK cannot encode \ufffd → UnicodeEncodeError: 'gbk' codec can't encode character
```

**The Problem Chain (stdin)**:

```
AI agent pipes UTF-8 content via heredoc: cat << 'EOF' | python3 add_session.py ...
    ↓
Python stdin defaults to GBK encoding (PowerShell default code page)
    ↓
sys.stdin.read() decodes bytes as GBK, not UTF-8
    ↓
Chinese text garbled or UnicodeDecodeError
```

**Root Cause**: Even if you set `PYTHONIOENCODING` in subprocess calls, the **parent process's stdio** still uses the system code page.

---

#### GOOD: Centralize encoding fix in `common/__init__.py`

All stdio encoding is handled in one place. Scripts that `from common import ...` automatically get the fix:

```python
# common/__init__.py
import io
import sys

def _configure_stream(stream):
    """Configure a stream for UTF-8 encoding on Windows."""
    if hasattr(stream, "reconfigure"):
        stream.reconfigure(encoding="utf-8", errors="replace")
        return stream
    elif hasattr(stream, "detach"):
        return io.TextIOWrapper(stream.detach(), encoding="utf-8", errors="replace")
    return stream

if sys.platform == "win32":
    sys.stdout = _configure_stream(sys.stdout)
    sys.stderr = _configure_stream(sys.stderr)
    sys.stdin = _configure_stream(sys.stdin)    # Don't forget stdin!
```

---

#### DON'T: Inline encoding code in individual scripts

```python
# BAD - Duplicated in every script, easy to forget stdin
import sys
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    # Forgot stdin! Piped Chinese text will break.
```

**Why this is bad**:
1. **Easy to forget streams**: stdout was fixed but stdin was missed in multiple scripts, causing real user bugs
2. **Duplicated code**: Same logic copy-pasted across `add_session.py`, `git_context.py`, etc.
3. **Inconsistent coverage**: Some scripts fix stdout only, others fix stdout+stderr, none fixed stdin

**Real-world failure**: Users on Windows reported garbled Chinese text when using `cat << EOF | python3 add_session.py`. Root cause: stdin was never reconfigured to UTF-8.

---

#### Summary

| Method | Works? | Reason |
|--------|--------|--------|
| `common/__init__.py` centralized fix | ✅ Yes | All streams, all scripts, one place |
| `sys.stdout.reconfigure(encoding="utf-8")` | ⚠️ Partial | Only stdout; easy to forget stdin/stderr |
| `io.TextIOWrapper(sys.stdout.buffer, ...)` | ❌ No | Creates wrapper, doesn't fix underlying encoding |
| `PYTHONIOENCODING=utf-8` env var | ⚠️ Partial | Only works if set **before** Python starts |

### CRITICAL: Always Use `python3` Explicitly

Windows does not support shebang (`#!/usr/bin/env python3`). Always document invocation with explicit `python3`:

```python
# In docstrings
"""
Usage:
    python3 task.py create "My Task"
    python3 task.py list --mine
"""

# In error messages
print("Usage: python3 task.py <command>")
print("Run: python3 ./.spec-first/scripts/init_developer.py <name>")

# In help text
print("Next steps:")
print("  python3 task.py start <dir>")
```

### Path Separators

Use `pathlib.Path` - it handles separators automatically:

```python
# Good - works on all platforms
path = Path(".spec-first") / "scripts" / "task.py"

# Bad - Unix-only
path = ".spec-first/scripts/task.py"
```

---

## Task Lifecycle Hooks

### Scope / Trigger

Task lifecycle events (`after_create`, `after_start`, `after_finish`, `after_archive`) execute user-defined shell commands configured in `config.yaml`.

### Signatures

```python
# config.py — read hook commands from config
def get_hooks(event: str, repo_root: Path | None = None) -> list[str]

# task.py — execute hooks (never blocks main operation)
def _run_hooks(event: str, task_json_path: Path, repo_root: Path) -> None
```

### Contracts

**Config format** (`config.yaml`):
```yaml
hooks:
  after_create:
    - "python3 .spec-first/scripts/hooks/my_hook.py create"
  after_start:
    - "python3 .spec-first/scripts/hooks/my_hook.py start"
  after_archive:
    - "python3 .spec-first/scripts/hooks/my_hook.py archive"
```

**Environment variables passed to hooks**:

| Key | Type | Description |
|-----|------|-------------|
| `TASK_JSON_PATH` | Absolute path string | Path to the task's `task.json` |

- `cwd` is set to `repo_root`
- Hooks inherit the parent process environment + `TASK_JSON_PATH`

### Subprocess Execution

```python
import os
import subprocess

env = {**os.environ, "TASK_JSON_PATH": str(task_json_path)}

result = subprocess.run(
    cmd,
    shell=True,
    cwd=repo_root,
    env=env,
    capture_output=True,
    text=True,
    encoding="utf-8",    # REQUIRED: cross-platform
    errors="replace",    # REQUIRED: cross-platform
)
```

### Validation & Error Matrix

| Condition | Behavior |
|-----------|----------|
| No `hooks` key in config | No-op (empty list) |
| `hooks` is not a dict | No-op (empty list) |
| Event key missing | No-op (empty list) |
| Hook command exits non-zero | `[WARN]` to stderr, continues to next hook |
| Hook command throws exception | `[WARN]` to stderr, continues to next hook |
| `linearis` not installed | Hook fails with warning, task operation succeeds |

### Wrong vs Correct

#### Wrong — blocking on hook failure
```python
result = subprocess.run(cmd, shell=True, check=True)  # Raises on failure!
```

#### Correct — warn and continue
```python
try:
    result = subprocess.run(cmd, shell=True, ...)
    if result.returncode != 0:
        print(f"[WARN] Hook failed: {cmd}", file=sys.stderr)
except Exception as e:
    print(f"[WARN] Hook error: {cmd} — {e}", file=sys.stderr)
```

### Hook Script Pattern

Hook scripts that need project-specific config (API keys, user IDs) should:
1. Store config in a **gitignored** local file (e.g., `.spec-first/hooks.local.json`)
2. Read config at startup, fail with clear message if missing
3. Keep the script itself committable (no hardcoded secrets)

```python
# .spec-first/scripts/hooks/my_hook.py — committable, no secrets
CONFIG = _load_config()  # reads from .spec-first/hooks.local.json (gitignored)
TEAM = CONFIG.get("linear", {}).get("team", "")
```

---

## Auto-Commit Pattern

Scripts that modify `.spec-first/` tracked files should auto-commit their changes to keep the workspace clean. Use a `--no-commit` flag for opt-out.

### Convention: Auto-Commit After Mutation

```python
def _auto_commit(scope: str, message: str, repo_root: Path) -> None:
    """Stage and commit changes in a specific .spec-first/ subdirectory."""
    subprocess.run(["git", "add", "-A", scope], cwd=repo_root, capture_output=True)
    # Check if there are staged changes
    result = subprocess.run(
        ["git", "diff", "--cached", "--quiet", "--", scope],
        cwd=repo_root,
    )
    if result.returncode == 0:
        print("[OK] No changes to commit.", file=sys.stderr)
        return
    commit_result = subprocess.run(
        ["git", "commit", "-m", message],
        cwd=repo_root, capture_output=True, text=True,
    )
    if commit_result.returncode == 0:
        print(f"[OK] Auto-committed: {message}", file=sys.stderr)
    else:
        print(f"[WARN] Auto-commit failed: {commit_result.stderr.strip()}", file=sys.stderr)
```

**Scripts using this pattern**:
- `add_session.py` — commits `.spec-first/workspace` + `.spec-first/tasks` after recording a session
- `task.py archive` — commits `.spec-first/tasks` after archiving a task

**Always add `--no-commit` flag** for scripts that auto-commit, so users can opt out.

---

## CLI Mode Extension Pattern

### Design Decision: `--mode` for Context-Dependent Output

When a script needs different output for different use cases, use `--mode` (not separate scripts or additional flags).

**Example**: `get_context.py` serves two modes:
- `--mode default` — full session context (DEVELOPER, GIT STATUS, RECENT COMMITS, CURRENT TASK, ACTIVE TASKS, MY TASKS, JOURNAL, PATHS)
- `--mode record` — focused output for record-session (MY ACTIVE TASKS first with emphasis, GIT STATUS, RECENT COMMITS, CURRENT TASK)

```python
parser.add_argument(
    "--mode", "-m",
    choices=["default", "record"],
    default="default",
    help="Output mode: default (full context) or record (for record-session)",
)
```

**When to add a new mode** (not a new script):
- Output is a subset/reordering of the same data
- The underlying data sources are shared
- The difference is in presentation, not in data fetching

---

## Parsing Structured Command Output

### CRITICAL: Preserve Semantic Whitespace

Many CLI tools encode status information in leading/trailing whitespace characters. **Never blindly `.strip()` before parsing.**

**Example — `git submodule status` output format**:

```
 abc1234 path/to/submodule (v1.0)     ← space prefix = initialized
-def5678 path/to/other (v2.0)         ← minus prefix = not initialized
+ghi9012 path/to/modified (v3.0)      ← plus prefix = modified (out of sync)
```

```python
# BAD — .strip() removes the leading space that means "initialized"
status_line = status_out.strip()
prefix = status_line[0]  # Reads commit hash char, not status prefix!

# GOOD — parse the raw line, then strip individual fields
raw_line = status_out.rstrip("\n")  # Only remove trailing newline
if not raw_line:
    continue
prefix = raw_line[0]               # ' ', '-', or '+'
rest = raw_line[1:].strip()        # Now safe to strip the rest
commit_hash = rest.split()[0]
```

**General rule**: When a command's output uses positional formatting (columns, prefixes, fixed-width fields), parse the structure first, then clean up individual values.

**Other commands with semantic whitespace**:
- `git status --porcelain` — two-char status prefix (`XY`)
- `git diff --name-status` — tab-separated with status prefix
- `docker ps --format` — column-aligned output

---

## Monorepo Config API (`common/config.py`)

### Config Functions

| Function | Return | Purpose |
|----------|--------|---------|
| `is_monorepo(repo_root)` | `bool` | Whether `packages:` exists in config.yaml |
| `get_packages(repo_root)` | `dict[str, dict] \| None` | All packages from config.yaml (`{name: {path, type?}}`) |
| `get_default_package(repo_root)` | `str \| None` | The `default_package` from config.yaml |
| `get_submodule_packages(repo_root)` | `dict[str, str]` | Packages with `type: submodule` (`{name: path}`) |
| `get_spec_base(package, repo_root)` | `str` | `"spec"` (single-repo) or `"spec/<package>"` (monorepo) |
| `validate_package(package, repo_root)` | `bool` | Whether package exists in config (always `True` for single-repo) |
| `resolve_package(task_pkg, repo_root)` | `str \| None` | Resolve package: task → default → None |
| `get_spec_scope(repo_root)` | `str \| list \| None` | The `session.spec_scope` config value |
| `get_hooks(event, repo_root)` | `list[str]` | Hook commands for lifecycle event |

### Config.yaml Schema

```yaml
# Auto-detected monorepo packages (written by spec-first init)
packages:
  cli:
    path: packages/cli
  docs-site:
    path: docs-site
    type: submodule       # optional, marks git submodule
default_package: cli      # first non-submodule package

# Session behavior
session:
  spec_scope: active_task  # or ["cli", "docs-site"] or omit for full scan

# Update behavior
update:
  skip:
    - .claude/commands/spec/my-custom.md

# Lifecycle hooks
hooks:
  after_create:
    - "python3 .spec-first/scripts/hooks/my_hook.py create"
```

### Worktree Submodule Initialization

When `start.py` creates a worktree for a task, it calls `_init_submodules_for_task()`:

1. Read `packages` from config.yaml via `get_packages()`
2. Resolve target package from task data or `default_package`
3. Check if the package is a submodule via `get_submodule_packages()`
4. Run `git submodule status <path>` in the worktree
5. Parse the status prefix (see "Parsing Structured Command Output" above)
6. If uninitialized (`-` prefix): run `git submodule update --init <path>`

---

## Error Handling

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Usage error (wrong arguments) |

### Error Messages

Print errors to stderr with context:

```python
import sys

def error(msg: str) -> None:
    """Print error message to stderr."""
    print(f"Error: {msg}", file=sys.stderr)

# Usage
if not repo_root:
    error("Not in a spec-first project (no .spec-first directory found)")
    sys.exit(1)
```

---

## Argument Parsing

Use `argparse` for consistent CLI interface:

```python
import argparse


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Task management",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 task.py create "Add login" --slug add-login
  python3 task.py list --mine --status in_progress
"""
    )

    subparsers = parser.add_subparsers(dest="command", required=True)

    # create command
    create_parser = subparsers.add_parser("create", help="Create new task")
    create_parser.add_argument("title", help="Task title")
    create_parser.add_argument("--slug", help="URL-friendly name")

    # list command
    list_parser = subparsers.add_parser("list", help="List tasks")
    list_parser.add_argument("--mine", "-m", action="store_true")
    list_parser.add_argument("--status", "-s", choices=["planning", "in_progress", "review", "completed"])

    args = parser.parse_args()

    if args.command == "create":
        return cmd_create(args)
    elif args.command == "list":
        return cmd_list(args)

    return 0
```

---

## Import Conventions

### Relative Imports Within Package

```python
# In task.py (root level)
from common.paths import get_repo_root, DIR_WORKFLOW
from common.developer import get_developer

# In common/developer.py
from .paths import get_repo_root, DIR_WORKFLOW
```

### Standard Library Imports

Group and order imports:

```python
# 1. Future imports
from __future__ import annotations

# 2. Standard library
import argparse
import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path

# 3. Local imports
from common.paths import get_repo_root
from common.developer import get_developer
```

---

## DO / DON'T

### DO

- Use `pathlib.Path` for all path operations
- Use type hints (Python 3.10+ syntax)
- Return exit codes from `main()`
- Print errors to stderr
- Always use `python3` in documentation and messages
- Use `encoding="utf-8"` for all file operations

### DON'T

- Don't use string path concatenation
- Don't use `os.path` when `pathlib` works
- Don't rely on shebang for invocation documentation
- Don't use `print()` for errors (use stderr)
- Don't hardcode paths - use constants from `common/paths.py`
- Don't use external dependencies (stdlib only)

---

## Example: Complete Script

See `.spec-first/scripts/task.py` for a comprehensive example with:
- Multiple subcommands
- Argument parsing
- JSON file operations
- Error handling
- Cross-platform path handling

---

## Migration Note

> **Historical Context**: Scripts were migrated from Bash to Python in v0.3.0 for cross-platform compatibility. The old shell scripts are archived in `.spec-first/scripts-shell-archive/` (if preserved).
