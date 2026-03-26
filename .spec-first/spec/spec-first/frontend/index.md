# Python Scripts Guidelines

> Best practices for Python scripts in this project.

---

## Overview

This directory contains guidelines for Python scripts in `.spec-first/scripts/`. These scripts provide runtime utilities for task management, context retrieval, and session recording.

**Note**: This project does not have a traditional frontend (React/Vue). The "frontend" layer here refers to Python scripts that are copied to user projects.

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Script organization and file layout | ✅ Filled |
| [Module Guidelines](./component-guidelines.md) | Module structure, function patterns | ✅ Filled |
| [Hook Guidelines](./hook-guidelines.md) | Lifecycle hooks implementation | ✅ Filled |
| [Data Persistence](./state-management.md) | File-based state patterns | ✅ Filled |
| [Quality Guidelines](./quality-guidelines.md) | Code standards, forbidden patterns | ✅ Filled |
| [Type Safety](./type-safety.md) | Type hints, validation | ✅ Filled |

---

## Pre-Development Checklist

Before working on Python scripts, read:

1. [Module Guidelines](./component-guidelines.md) - Understand module structure
2. [Quality Guidelines](./quality-guidelines.md) - Know the forbidden patterns
3. [Type Safety](./type-safety.md) - Use proper type hints

---

## Quick Reference

### Python Conventions

```python
# Use pathlib for paths
from pathlib import Path

# Use modern type hints
def get_task(slug: str) -> dict | None:
    ...

# Explicit UTF-8 encoding
content = path.read_text(encoding="utf-8")

# Print errors to stderr
print(f"Error: {message}", file=sys.stderr)
```

### CLI Script Template

```python
#!/usr/bin/env python3
"""Script description."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("arg", help="Argument")
    args = parser.parse_args()
    # Implementation
    return 0

if __name__ == "__main__":
    sys.exit(main())
```

---

## Development Commands

```bash
# Type checking
pnpm lint:py

# Run script directly
python3 .spec-first/scripts/task.py list
```
