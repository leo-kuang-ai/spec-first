# Data Persistence

> How data is persisted in Python scripts.

---

## Overview

This project uses file-based persistence for all data. There is no database or in-memory state management beyond the script execution.

---

## Data Storage Locations

| Data Type | Location | Format |
|-----------|----------|--------|
| Configuration | `.spec-first/config.yaml` | YAML |
| Developer identity | `.spec-first/.developer` | Plain text |
| Current task | `.spec-first/.current-task` | Plain text |
| Task definitions | `.spec-first/tasks/*/task.json` | JSON |
| Task PRDs | `.spec-first/tasks/*/prd.md` | Markdown |
| Session journals | `.spec-first/workspace/*/journal-*.md` | Markdown |
| Context files | `.spec-first/*.jsonl` | JSONL |

---

## File-Based State Patterns

### Reading State

```python
from pathlib import Path
import json

def get_current_task(repo_root: Path) -> str | None:
    """Get current task slug from .current-task file."""
    current_task_file = repo_root / ".spec-first" / ".current-task"
    if current_task_file.exists():
        return current_task_file.read_text(encoding="utf-8").strip()
    return None

def get_task_data(repo_root: Path, task_slug: str) -> dict:
    """Read task.json for a task."""
    task_file = repo_root / ".spec-first" / "tasks" / task_slug / "task.json"
    if task_file.exists():
        return json.loads(task_file.read_text(encoding="utf-8"))
    return {}
```

### Writing State

```python
def set_current_task(repo_root: Path, task_slug: str) -> None:
    """Set current task in .current-task file."""
    current_task_file = repo_root / ".spec-first" / ".current-task"
    current_task_file.write_text(task_slug, encoding="utf-8")

def update_task_status(repo_root: Path, task_slug: str, status: str) -> None:
    """Update task status in task.json."""
    task_file = repo_root / ".spec-first" / "tasks" / task_slug / "task.json"
    data = json.loads(task_file.read_text(encoding="utf-8"))
    data["status"] = status
    task_file.write_text(json.dumps(data, indent=2), encoding="utf-8")
```

---

## JSONL Append Pattern

For audit logs and context files, use append-only JSONL:

```python
def append_to_jsonl(repo_root: Path, filename: str, entry: dict) -> None:
    """Append entry to JSONL file."""
    jsonl_path = repo_root / ".spec-first" / filename
    line = json.dumps(entry, ensure_ascii=False)
    with open(jsonl_path, "a", encoding="utf-8") as f:
        f.write(line + "\n")

def read_jsonl(repo_root: Path, filename: str) -> list[dict]:
    """Read all entries from JSONL file."""
    jsonl_path = repo_root / ".spec-first" / filename
    if not jsonl_path.exists():
        return []

    entries = []
    with open(jsonl_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                entries.append(json.loads(line))
    return entries
```

---

## Task Switching Contract

When setting the current task (`task.py start`), the following validation is **required**:

### Validation Requirements

```python
def cmd_start(args: argparse.Namespace) -> int:
    """Set current task with validation."""
    repo_root = get_repo_root()
    full_path = resolve_task_dir(args.dir, repo_root)

    # 1. Must be a directory
    if not full_path.is_dir():
        print(f"Error: Task not found: {args.dir}", file=sys.stderr)
        return 1

    # 2. Must contain task.json (validates it's a real task directory)
    task_json_path = full_path / "task.json"
    if not task_json_path.is_file():
        print(f"Error: Not a valid task directory (missing task.json): {args.dir}", file=sys.stderr)
        return 1

    # 3. task.json must be readable and valid JSON
    try:
        data = json.loads(task_json_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as e:
        print(f"Error: Invalid task.json: {e}", file=sys.stderr)
        return 1

    # Now safe to set current task
    set_current_task(task_dir, repo_root)
    return 0
```

### Why This Matters

- **Prevents wrong state**: Without validation, any directory can become "current task"
- **Hook safety**: Session hooks read `.current-task` and expect valid task structure
- **Context injection**: Agent context depends on valid task.jsonl paths in task directory

### Wrong vs Correct

```python
# ❌ Wrong - only checks if directory exists
if not full_path.is_dir():
    return 1
set_current_task(str(full_path), repo_root)

# ✅ Correct - validates task directory structure
if not full_path.is_dir():
    return 1
task_json = full_path / "task.json"
if not task_json.is_file():
    print("Error: Not a valid task directory (missing task.json)", file=sys.stderr)
    return 1
set_current_task(str(full_path.relative_to(repo_root)), repo_root)
```

---

## Concurrency Considerations

Since CLI tools are typically single-user:

- **No locking needed** - One user at a time
- **Atomic writes** - Write complete file at once
- **No transactions** - Each operation is independent

---

## Common Mistakes

### 1. Not Checking File Existence

```python
# ❌ Wrong - will crash
data = json.loads(Path("task.json").read_text())

# ✅ Correct
task_file = Path("task.json")
data = json.loads(task_file.read_text()) if task_file.exists() else {}
```

### 2. Missing Encoding

```python
# ❌ Wrong - platform-dependent
content = path.read_text()

# ✅ Correct
content = path.read_text(encoding="utf-8")
```

### 3. Not Creating Parent Directories

```python
# ❌ Wrong - fails if directory doesn't exist
Path("new/dir/file.txt").write_text("content")

# ✅ Correct
path = Path("new/dir/file.txt")
path.parent.mkdir(parents=True, exist_ok=True)
path.write_text("content", encoding="utf-8")
```
