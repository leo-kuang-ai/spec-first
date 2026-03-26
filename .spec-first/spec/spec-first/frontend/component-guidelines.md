# Python Module Guidelines

> How Python modules are structured in this project.

---

## Overview

This project uses Python scripts for runtime utilities that are copied to user projects. Follow these patterns for consistent, maintainable code.

---

## Module Structure

### Standard Module Pattern

```python
#!/usr/bin/env python3
"""
Module description.

More details if needed.
"""

from __future__ import annotations

# Standard library imports (alphabetical)
import json
import sys
from pathlib import Path

# Local imports (alphabetical)
from .paths import get_repo_root
from .types import Task, TaskStatus


# Constants (at top level)
DEFAULT_VALUE = "default"
MAX_RETRIES = 3


# Private functions first
def _helper_function(value: str) -> str:
    """Private helper - not exported."""
    return value.strip()


# Public functions
def public_function(path: Path) -> dict:
    """Public function with docstring.

    Args:
        path: Path to the file.

    Returns:
        Parsed dictionary.
    """
    content = path.read_text(encoding="utf-8")
    return json.loads(content)
```

---

## Function Patterns

### Type Hints

Use Python 3.10+ union syntax:

```python
# ✅ Correct - modern syntax
def get_config(repo_root: Path | None = None) -> dict:
    ...

# ❌ Wrong - old syntax
from typing import Optional
def get_config(repo_root: Optional[Path] = None) -> dict:
    ...
```

### Error Handling

```python
# ✅ Correct - print to stderr, return code
def main() -> int:
    try:
        result = do_something()
    except FileNotFoundError:
        print("Error: File not found", file=sys.stderr)
        return 1
    return 0

# ❌ Wrong - silent failure
def main() -> int:
    try:
        result = do_something()
    except:
        pass  # Error is swallowed
    return 0
```

### Path Handling

```python
# ✅ Correct - use pathlib
from pathlib import Path

def get_config_path(repo_root: Path | None = None) -> Path:
    root = repo_root or get_repo_root()
    return root / ".spec-first" / "config.yaml"

# ❌ Wrong - string concatenation
def get_config_path(repo_root: str | None = None) -> str:
    root = repo_root or get_repo_root()
    return f"{root}/.spec-first/config.yaml"
```

---

## Common Patterns

### JSON Operations

```python
import json
from pathlib import Path

def read_json(path: Path) -> dict:
    """Read JSON file with error handling."""
    try:
        content = path.read_text(encoding="utf-8")
        return json.loads(content)
    except (OSError, json.JSONDecodeError):
        return {}

def write_json(path: Path, data: dict) -> None:
    """Write JSON file with formatting."""
    content = json.dumps(data, indent=2, ensure_ascii=False)
    path.write_text(content, encoding="utf-8")
```

### Simple YAML Parsing

```python
def parse_simple_yaml(content: str) -> dict:
    """Parse simple YAML without external dependencies."""
    result: dict = {}
    current_key: str | None = None

    for line in content.split("\n"):
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        # Simple key: value parsing
        if ":" in line and not line.startswith(" "):
            key, _, value = line.partition(":")
            result[key.strip()] = value.strip() or {}
    return result
```

---

## Common Mistakes

### 1. Missing Encoding

```python
# ❌ Wrong - platform-dependent encoding
content = path.read_text()

# ✅ Correct - explicit UTF-8
content = path.read_text(encoding="utf-8")
```

### 2. Bare Except

```python
# ❌ Wrong - catches everything
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

### 3. Mutable Default Arguments

```python
# ❌ Wrong - mutable default
def process(items: list = []) -> list:
    items.append("new")
    return items

# ✅ Correct - None default
def process(items: list | None = None) -> list:
    items = items or []
    items.append("new")
    return items
```
