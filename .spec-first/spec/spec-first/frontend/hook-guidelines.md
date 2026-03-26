# Python Hook Guidelines

> How hooks are implemented in this project.

---

## Overview

Hooks are Python scripts that run at specific lifecycle events. They are stored in `.claude/hooks/` and configured in `.claude/settings.json`.

---

## Hook Types

| Hook | When it runs | Purpose |
|------|-------------|---------|
| `session-start.py` | At session start | Inject context into conversation |
| `inject-subagent-context.py` | Before agent spawn | Add code-spec to agent context |
| `ralph-loop.py` | After agent completion | Check for infinite loops |

---

## Hook Structure

```python
#!/usr/bin/env python3
"""
Hook description.

Runs when: [event trigger]
Purpose: [what it does]
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path


def main() -> int:
    """Main hook entry point."""
    # 1. Get context from environment or stdin
    session_file = os.environ.get("CLAUDE_SESSION_FILE")
    if not session_file:
        return 0  # No context, skip silently

    # 2. Read session data
    session_path = Path(session_file)
    if not session_path.exists():
        return 0

    session_data = json.loads(session_path.read_text(encoding="utf-8"))

    # 3. Process and output
    context = build_context(session_data)
    if context:
        print(context)

    return 0


def build_context(session: dict) -> str | None:
    """Build context string from session data."""
    # Implementation
    return None


if __name__ == "__main__":
    sys.exit(main())
```

---

## Context Injection Pattern

### Reading Current Task

```python
def get_current_task(repo_root: Path) -> dict | None:
    """Get current task from .spec-first/.current-task."""
    current_task_file = repo_root / ".spec-first" / ".current-task"
    if not current_task_file.exists():
        return None

    task_slug = current_task_file.read_text(encoding="utf-8").strip()
    task_file = repo_root / ".spec-first" / "tasks" / task_slug / "task.json"

    if task_file.exists():
        return json.loads(task_file.read_text(encoding="utf-8"))
    return None
```

### Reading JSONL Context

```python
def get_jsonl_context(repo_root: Path, filename: str) -> list[dict]:
    """Read context entries from JSONL file."""
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

### Building Context Output

```python
def build_context(repo_root: Path) -> str:
    """Build formatted context for injection."""
    task = get_current_task(repo_root)
    if not task:
        return ""

    lines = ["## Current Task\n"]
    lines.append(f"- **Name**: {task.get('name', 'Unknown')}")
    lines.append(f"- **Status**: {task.get('status', 'pending')}")

    # Add PRD if exists
    prd_path = repo_root / ".spec-first" / "tasks" / task["slug"] / "prd.md"
    if prd_path.exists():
        lines.append(f"\n### PRD\n{prd_path.read_text(encoding='utf-8')}")

    return "\n".join(lines)
```

---

## Configuration

Hooks are registered in `.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [".claude/hooks/session-start.py"]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Task",
        "hooks": [".claude/hooks/inject-subagent-context.py"]
      }
    ]
  }
}
```

---

## Best Practices

1. **Fail silently** - Hooks should not break the session on error
2. **Return 0** - Always return 0 on success, non-zero on error
3. **Use stdout** - Context output goes to stdout
4. **Use stderr** - Debug/logging goes to stderr
5. **Check file existence** - Always check before reading files

---

## Common Mistakes

### 1. Not Handling Missing Files

```python
# ❌ Wrong - will crash if file missing
data = json.loads(Path("config.json").read_text())

# ✅ Correct - handle missing files
config_path = Path("config.json")
if config_path.exists():
    data = json.loads(config_path.read_text(encoding="utf-8"))
else:
    data = {}
```

### 2. Printing to Wrong Stream

```python
# ❌ Wrong - debug output appears in context
print("Debug: processing...")

# ✅ Correct - debug goes to stderr
print("Debug: processing...", file=sys.stderr)
```

### 3. Not Returning Exit Code

```python
# ❌ Wrong - implicit None
if __name__ == "__main__":
    main()

# ✅ Correct - explicit exit code
if __name__ == "__main__":
    sys.exit(main())
```
