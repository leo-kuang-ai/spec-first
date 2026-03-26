# Python Scripts Directory Structure

> How Python scripts are organized in this project.

---

## Overview

The `.spec-first/scripts/` directory contains Python utilities for task management, context retrieval, and session recording. These scripts are copied to user projects during `spec-first init`.

---

## Directory Layout

```
.spec-first/scripts/
├── __init__.py              # Package init
├── task.py                  # Task management CLI
├── get_context.py           # Session context retrieval
├── get_developer.py         # Developer identity
├── init_developer.py        # Initialize developer identity
├── add_session.py           # Record session to journal
├── create_bootstrap.py      # Create bootstrap task
├── common/                  # Shared utilities
│   ├── __init__.py
│   ├── paths.py             # Path utilities
│   ├── config.py            # Config reader
│   ├── developer.py         # Developer management
│   ├── git.py               # Git operations
│   ├── git_context.py       # Git context
│   ├── log.py               # Logging utilities
│   ├── io.py                # File I/O
│   ├── types.py             # Type definitions
│   ├── task_store.py        # Task persistence
│   ├── task_context.py      # Task context
│   ├── task_utils.py        # Task utilities
│   ├── task_queue.py        # Task queue
│   ├── tasks.py             # Task operations
│   ├── phase.py             # Phase management
│   ├── session_context.py   # Session context
│   ├── packages_context.py  # Monorepo packages
│   ├── worktree.py          # Git worktree
│   ├── registry.py          # Spec registry
│   └── cli_adapter.py       # CLI output adapter
├── multi_agent/             # Multi-agent pipeline
│   ├── __init__.py
│   ├── _bootstrap.py        # Bootstrap
│   ├── start.py             # Start agent
│   ├── status.py            # Agent status
│   ├── status_display.py    # Status display
│   ├── status_monitor.py    # Status monitor
│   ├── plan.py              # Plan pipeline
│   ├── create_pr.py         # Create PR
│   └── cleanup.py           # Cleanup worktree
└── hooks/                   # Event hooks
    └── linear_sync.py       # Linear integration
```

---

## Module Organization

### Adding a New Script

1. Create script file in appropriate directory
2. Add imports from `common/` for shared utilities
3. Use `argparse` for CLI arguments
4. Follow the existing patterns

### Script Structure Template

```python
#!/usr/bin/env python3
"""
Script description.

Usage: python3 .spec-first/scripts/script_name.py [args]
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .common.paths import get_repo_root
from .common.io import read_json, write_json


def main() -> int:
    parser = argparse.ArgumentParser(description="Script description")
    parser.add_argument("positional", help="Positional argument")
    parser.add_argument("--optional", default="value", help="Optional argument")
    args = parser.parse_args()

    # Implementation
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

---

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| File names | `snake_case.py` | `task_store.py`, `git_context.py` |
| Function names | `snake_case` | `get_repo_root()`, `read_json()` |
| Class names | `PascalCase` | `TaskStore`, `SessionContext` |
| Constants | `SCREAMING_SNAKE_CASE` | `DEFAULT_MAX_LINES`, `CONFIG_FILE` |
| Private functions | `_leading_underscore` | `_load_config()`, `_get_path()` |

---

## Import Patterns

```python
# ✅ Correct - use relative imports within package
from .paths import get_repo_root
from .config import get_packages

# ✅ Correct - use absolute imports from stdlib
from pathlib import Path
import json
import sys

# ❌ Wrong - mixing styles
import common.paths  # Should be relative
```

---

## Examples

### Well-organized modules

- **`common/paths.py`** - Centralized path utilities
- **`common/config.py`** - Configuration reading with defaults
- **`task.py`** - CLI with subcommands pattern

### Key patterns

1. **Path handling**: Always use `pathlib.Path`, never string concatenation
2. **Error handling**: Print to stderr, return non-zero exit code
3. **Type hints**: Use modern Python 3.10+ syntax (`Path | None`)
