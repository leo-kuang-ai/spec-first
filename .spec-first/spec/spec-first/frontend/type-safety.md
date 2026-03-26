# Python Type Safety

> Type safety patterns in Python scripts.

---

## Overview

This project uses Python 3.10+ type hints with basedpyright for type checking. All scripts should have comprehensive type annotations.

---

## Type System

### Modern Union Syntax

```python
# ✅ Correct - Python 3.10+ syntax
def get_task(repo_root: Path | None = None) -> dict | None:
    ...

# ❌ Wrong - old typing module syntax
from typing import Optional, Union
def get_task(repo_root: Optional[Path] = None) -> Optional[dict]:
    ...
```

### Collection Types

```python
# ✅ Correct - lowercase built-ins
def get_tasks() -> list[dict]:
    ...

def get_packages() -> dict[str, str]:
    ...

# ❌ Wrong - typing module (deprecated in 3.9+)
from typing import List, Dict
def get_tasks() -> List[Dict]:
    ...
```

---

## Type Organization

### Types Module

Shared types go in `common/types.py`:

```python
# common/types.py
from __future__ import annotations
from enum import Enum
from dataclasses import dataclass

class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

@dataclass
class Task:
    name: str
    slug: str
    status: TaskStatus
    created: str
    owner: str | None = None
```

### Local Types

Types used in only one module can be defined locally:

```python
def process() -> None:
    # Local type alias
    JsonValue = str | int | float | bool | None | list["JsonValue"] | dict[str, "JsonValue"]
    data: JsonValue = json.loads(content)
```

---

## Common Patterns

### Type Guards

```python
def is_valid_task(data: dict) -> bool:
    """Type guard for Task structure."""
    required = {"name", "slug", "status", "created"}
    return all(key in data for key in required)

def process_task(data: dict) -> None:
    if not is_valid_task(data):
        raise ValueError("Invalid task structure")
    # Now we know data has required fields
```

### Optional Handling

```python
def get_config(repo_root: Path | None = None) -> dict:
    """Get config with None handling."""
    root = repo_root or get_repo_root()  # Provide default
    config_path = root / "config.yaml"
    if config_path.exists():
        return parse_yaml(config_path.read_text(encoding="utf-8"))
    return {}  # Return empty dict instead of None
```

### Narrow Types

```python
def process_status(status: str) -> TaskStatus:
    """Convert string to enum with validation."""
    try:
        return TaskStatus(status)
    except ValueError:
        valid = [s.value for s in TaskStatus]
        raise ValueError(f"Invalid status: {status}. Valid: {valid}")
```

---

## Validation

### Simple Validation

```python
def validate_task(data: dict) -> Task:
    """Validate and construct Task from dict."""
    if not isinstance(data, dict):
        raise TypeError("Task must be a dict")

    name = data.get("name")
    if not isinstance(name, str):
        raise TypeError("Task.name must be a string")

    # ... more validation

    return Task(
        name=name,
        slug=data["slug"],
        status=TaskStatus(data.get("status", "pending")),
        created=data.get("created", ""),
        owner=data.get("owner"),
    )
```

---

## Forbidden Patterns

### 1. Any Type

```python
# ❌ Wrong - loses type safety
def process(data: any) -> any:
    ...

# ✅ Correct - use specific types or generics
def process(data: dict) -> dict:
    ...

# ✅ Or use unknown for truly unknown data
def parse(data: str) -> object:
    return json.loads(data)
```

### 2. Missing Return Type

```python
# ❌ Wrong - no return type
def get_task(slug):
    return tasks.get(slug)

# ✅ Correct - explicit return type
def get_task(slug: str) -> dict | None:
    return tasks.get(slug)
```

### 3. Type: Ignore Comments

```python
# ❌ Wrong - silences type checker
data = json.loads(content)  # type: ignore

# ✅ Correct - fix the underlying issue
data: dict = json.loads(content)  # Or validate at runtime
```

---

## Type Checking Commands

```bash
# Run type checker
basedpyright .spec-first/scripts/

# Check specific file
basedpyright .spec-first/scripts/task.py
```
