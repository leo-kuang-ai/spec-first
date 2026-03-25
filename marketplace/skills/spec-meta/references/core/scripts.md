# Core Scripts

Platform-independent Python scripts for spec-first automation.

---

## Overview

These scripts work on all platforms — they only read/write files and don't require Claude Code's hook system.

```
.spec-first/scripts/
├── common/                  # Shared utilities (19 modules)
│   ├── __init__.py
│   ├── paths.py             # Path constants
│   ├── types.py             # Core type definitions (TaskData, AgentRecord)
│   ├── developer.py         # Developer management
│   ├── config.py            # config.yaml reader
│   ├── io.py                # I/O utilities
│   ├── log.py               # Logging with colors
│   ├── git.py               # Git command utilities
│   ├── git_context.py       # Git and session context shim
│   ├── session_context.py   # Session context generation
│   ├── packages_context.py  # Package discovery (monorepo)
│   ├── tasks.py             # Task loading and iteration
│   ├── task_utils.py        # Task utilities (resolve, hooks)
│   ├── task_store.py        # Task store ops (create, archive, subtasks)
│   ├── task_queue.py        # Task queue (list by status/assignee)
│   ├── task_context.py      # JSONL context management
│   ├── phase.py             # Phase tracking
│   ├── registry.py          # Agent registry (registry.json)
│   ├── worktree.py          # Worktree utilities
│   └── cli_adapter.py       # Multi-platform CLI adapter
│
├── hooks/                   # Task lifecycle hook scripts
│   └── linear_sync.py       # Linear issue sync
│
├── init_developer.py        # Initialize developer
├── get_developer.py         # Get developer name
├── get_context.py           # Get session context
├── task.py                  # Task management CLI (16 subcommands)
├── add_session.py           # Record session
└── create_bootstrap.py      # First-time spec bootstrap
```

---

## Developer Scripts

### `init_developer.py`

Initialize developer identity.

```bash
python3 .spec-first/scripts/init_developer.py <name>
```

**Creates:**

- `.spec-first/.developer`
- `.spec-first/workspace/<name>/`
- `.spec-first/workspace/<name>/index.md`
- `.spec-first/workspace/<name>/journal-1.md`

---

### `get_developer.py`

Get current developer name.

```bash
python3 .spec-first/scripts/get_developer.py
# Output: taosu
```

**Exit codes:**

- `0` - Success
- `1` - Not initialized

---

## Context Scripts

### `get_context.py`

Get session context for AI consumption.

```bash
python3 .spec-first/scripts/get_context.py              # Default mode (text)
python3 .spec-first/scripts/get_context.py --json        # JSON output
python3 .spec-first/scripts/get_context.py --mode record    # For record-session
python3 .spec-first/scripts/get_context.py --mode packages  # Package info only
```

**Modes:**

| Mode | Output |
|------|--------|
| `default` | Full context: developer, git status, current task, active tasks, journal, packages, paths |
| `record` | Focused context with MY ACTIVE TASKS shown first |
| `packages` | Package names, paths, types, and spec layers only |

**Output includes:**

- Developer identity
- Git status and recent commits
- Current task (if any)
- Active tasks list
- Workspace summary
- Package info (monorepo)

---

### `add_session.py`

Record session entry to journal.

```bash
python3 .spec-first/scripts/add_session.py \
  --title "Session Title" \
  --commit "hash1,hash2" \
  --summary "Brief summary"
```

**Options:**

- `--title` - Session title (required)
- `--commit` - Comma-separated commit hashes
- `--summary` - Brief summary
- `--content-file` - Path to file with detailed content
- `--no-commit` - Skip auto-commit of workspace changes
- `--package` - Package name (monorepo)

**Actions:**

1. Appends to current journal
2. Updates index markers
3. Rotates journal if >max_journal_lines
4. Auto-commits `.spec-first/workspace` changes (unless `--no-commit`)

---

### `create_bootstrap.py`

Create a bootstrap task for first-time setup.

```bash
python3 .spec-first/scripts/create_bootstrap.py
```

Creates a task that guides filling in project-specific spec guidelines.

---

## Task Scripts

### `task.py`

Task management CLI with 16 subcommands.

#### Create Task

```bash
python3 .spec-first/scripts/task.py create "Task name" --slug task-slug
```

**Options:**

- `--slug` - URL-safe identifier
- `--assignee` - Developer name (default: current)
- `--priority` - Priority level (P0, P1, P2, P3)
- `--description` - Task description
- `--parent` - Parent task directory (for subtasks)
- `--package` - Package name (monorepo)

#### List Tasks

```bash
python3 .spec-first/scripts/task.py list
python3 .spec-first/scripts/task.py list --mine          # My tasks only
python3 .spec-first/scripts/task.py list --status active  # Filter by status
```

#### Start / Finish Task

```bash
python3 .spec-first/scripts/task.py start <task-dir>   # Set .current-task
python3 .spec-first/scripts/task.py finish              # Clear .current-task
```

#### Initialize Context

```bash
python3 .spec-first/scripts/task.py init-context <task-dir> <dev-type>
```

**Dev types:** `frontend`, `backend`, `fullstack`, `test`, `docs`

Creates JSONL files with appropriate spec references. After initialization, outputs available spec files as hints.

#### Manage Context

```bash
python3 .spec-first/scripts/task.py add-context <task-dir> <agent> <path> <reason>
python3 .spec-first/scripts/task.py list-context <task-dir>
python3 .spec-first/scripts/task.py validate <task-dir>
```

**Agent types for add-context:** `implement`, `check`, `debug`

#### Branch Management

```bash
python3 .spec-first/scripts/task.py set-branch <task-dir> <branch-name>
python3 .spec-first/scripts/task.py set-base-branch <task-dir> <base-branch>
python3 .spec-first/scripts/task.py set-scope <task-dir> <scope>
```

#### Subtask Management

```bash
python3 .spec-first/scripts/task.py create "Subtask" --parent <parent-dir>
python3 .spec-first/scripts/task.py add-subtask <parent-dir> <child-dir>
python3 .spec-first/scripts/task.py remove-subtask <parent-dir> <child-dir>
```

#### Archive and PR

```bash
python3 .spec-first/scripts/task.py archive <task-dir>         # Auto-commits
python3 .spec-first/scripts/task.py archive <task-dir> --no-commit
python3 .spec-first/scripts/task.py list-archive [YYYY-MM]
python3 .spec-first/scripts/task.py create-pr <task-dir>       # Delegates to multi_agent/create_pr.py
```

---

## Hook Scripts

### `hooks/linear_sync.py`

Syncs task lifecycle events to Linear via `linearis` CLI.

```bash
# Called automatically by task lifecycle hooks in config.yaml
python3 .spec-first/scripts/hooks/linear_sync.py create
python3 .spec-first/scripts/hooks/linear_sync.py start
python3 .spec-first/scripts/hooks/linear_sync.py archive
```

**Environment variable:** `TASK_JSON_PATH` — path to the task's `task.json`.

---

## Common Utilities

### Core Types (`common/types.py`)

```python
from common.types import TaskData, TaskInfo, AgentRecord
```

- `TaskData` — TypedDict for task.json fields
- `TaskInfo` — Extended task info with directory path
- `AgentRecord` — Agent registry entry

### Paths (`common/paths.py`)

```python
from common.paths import (
    TRELLIS_DIR,      # .spec-first/
    WORKSPACE_DIR,    # .spec-first/workspace/
    TASKS_DIR,        # .spec-first/tasks/
    SPEC_DIR,         # .spec-first/spec/
)
```

### Developer (`common/developer.py`)

```python
from common.developer import (
    get_developer,     # Get current developer name
    get_workspace_dir, # Get developer's workspace directory
)
```

### Config (`common/config.py`)

```python
from common.config import (
    get_session_commit_message,  # Commit message for auto-commit
    get_max_journal_lines,       # Max lines per journal file
    get_packages,                # Monorepo package dict or None
    get_default_package,         # Default package name
    is_monorepo,                 # Check if packages are configured
    get_submodule_packages,      # Packages with type: submodule
    get_git_packages,            # Packages with git: true
    get_spec_base,               # "spec" or "spec/<package>"
    get_spec_scope,              # Session spec scope setting
)
```

### Task Modules

```python
from common.task_utils import (
    resolve_task_dir,   # Resolve task directory from name
    run_task_hooks,     # Execute task lifecycle hooks
)

from common.task_store import (
    create_task,        # Create new task directory
    archive_task,       # Archive completed task
    add_subtask,        # Link child to parent
    remove_subtask,     # Unlink child from parent
)

from common.task_queue import (
    list_by_status,     # List tasks by status
    list_by_assignee,   # List tasks by assignee
)

from common.task_context import (
    init_context,       # Create JSONL files for a task
    add_context,        # Add entry to a JSONL file
    validate_context,   # Validate JSONL files
    list_context,       # List JSONL entries
)
```

### Git (`common/git.py`)

```python
from common.git import run_git  # Execute git commands
```

### I/O and Logging

```python
from common.io import read_file, write_file  # File operations
from common.log import info, warn, error     # Colored logging
```

### Multi-Platform (`common/cli_adapter.py`)

Abstracts CLI differences between all 11 platforms for the multi-agent pipeline.

```python
from common.cli_adapter import get_cli_adapter  # Get platform-specific adapter
```

---

## Usage Examples

### Initialize New Developer

```bash
cd /path/to/project
python3 .spec-first/scripts/init_developer.py john-doe
```

### Create and Start Task

```bash
# Create task
python3 .spec-first/scripts/task.py create "Add user login" --slug add-login

# Initialize context for fullstack work
python3 .spec-first/scripts/task.py init-context \
  .spec-first/tasks/03-24-add-login fullstack

# Start task
python3 .spec-first/scripts/task.py start \
  .spec-first/tasks/03-24-add-login
```

### Create Subtask

```bash
# Create a child task under an existing parent
python3 .spec-first/scripts/task.py create "Login API endpoint" \
  --slug login-api --parent .spec-first/tasks/03-24-add-login
```

### Record Session

```bash
python3 .spec-first/scripts/add_session.py \
  --title "Implement login form" \
  --commit "abc1234" \
  --summary "Added login form, pending API integration"
```

### Archive Completed Task

```bash
python3 .spec-first/scripts/task.py archive \
  .spec-first/tasks/03-24-add-login
```
