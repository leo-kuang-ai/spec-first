# Python Quality Guidelines

> Code quality standards for Python scripts.

---

## Overview

Python scripts in this project should be clean, type-safe, and follow modern Python 3.10+ conventions.

---

## Development Commands

```bash
# Type checking
pnpm lint:py                 # basedpyright on Python files

# Or run directly
basedpyright .spec-first/scripts/
```

---

## Forbidden Patterns

### 1. Bare Except

```python
# ❌ Wrong - catches everything including KeyboardInterrupt
try:
    do_something()
except:
    pass

# ✅ Correct - specific exceptions
try:
    do_something()
except (OSError, IOError) as e:
    print(f"Error: {e}", file=sys.stderr)
```

### 2. Mutable Default Arguments

```python
# ❌ Wrong - shared mutable state
def process(items: list = []) -> list:
    items.append("new")
    return items

# ✅ Correct - None default
def process(items: list | None = None) -> list:
    items = items or []
    items.append("new")
    return items
```

### 3. Missing Type Hints

```python
# ❌ Wrong - no type hints
def get_config(repo_root):
    return read_yaml(repo_root / "config.yaml")

# ✅ Correct - with type hints
def get_config(repo_root: Path | None = None) -> dict:
    return read_yaml(repo_root / "config.yaml")
```

### 4. String Path Concatenation

```python
# ❌ Wrong - platform-specific
path = root + "/" + filename

# ✅ Correct - use pathlib
path = root / filename
```

### 5. Implicit Encoding

```python
# ❌ Wrong - platform-dependent encoding
content = file.read()

# ✅ Correct - explicit UTF-8
content = file.read(encoding="utf-8")
```

---

## Required Patterns

### 1. Shebang and Module Docstring

```python
#!/usr/bin/env python3
"""
Module description.

Usage: python3 .spec-first/scripts/module.py [args]
"""

from __future__ import annotations
```

### 2. Type Hints with Modern Syntax

```python
# ✅ Required - Python 3.10+ union syntax
def get_task(repo_root: Path | None = None) -> dict | None:
    ...
```

### 3. Explicit Encoding

```python
# ✅ Required - always specify encoding
content = path.read_text(encoding="utf-8")
path.write_text(content, encoding="utf-8")
```

### 4. Exit Code for CLI Scripts

```python
def main() -> int:
    """Main entry point."""
    try:
        # Do work
        return 0
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1

if __name__ == "__main__":
    sys.exit(main())
```

---

## Code Organization

### Import Order

```python
# 1. Future imports
from __future__ import annotations

# 2. Standard library (alphabetical)
import json
import sys
from pathlib import Path

# 3. Local imports (alphabetical)
from .config import get_config
from .paths import get_repo_root
```

### Module Structure

```python
# 1. Docstring
# 2. Imports
# 3. Constants
# 4. Private functions
# 5. Public functions
# 6. main() if CLI script
```

---

## Code Review Checklist

- [ ] Uses `pathlib.Path` for all paths
- [ ] Has explicit `encoding="utf-8"` for file operations
- [ ] Uses modern type hints (`Path | None` not `Optional[Path]`)
- [ ] Handles exceptions specifically (no bare except)
- [ ] Returns proper exit codes (0 for success, non-zero for error)
- [ ] No mutable default arguments
- [ ] Has module docstring
