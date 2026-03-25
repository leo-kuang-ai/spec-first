# Hook Guidelines

> How hooks are used in this project.

---

## Overview

**Note**: This is a CLI project without React hooks. The patterns below describe CLI "hooks" - scripts that run at specific lifecycle events.

---

## CLI Hooks

This project supports Python hooks that run during AI tool lifecycle:

| Hook | When | Purpose |
|------|------|---------|
| `session-start.py` | Session starts | Inject context into AI |
| `inject-subagent-context.py` | Before agent calls | Add code-spec to prompts |
| `ralph-loop.py` | After responses | Detect infinite loops |

---

## Hook Structure

```python
#!/usr/bin/env python3
"""
Hook: session-start
When: At the start of each AI session
Purpose: Inject project context and guidelines
"""

import sys
import json

def main():
    # Read hook input from stdin
    input_data = json.loads(sys.stdin.read())

    # Process and respond
    response = {
        "status": "success",
        "message": "Context injected"
    }

    # Output response
    print(json.dumps(response))

if __name__ == "__main__":
    main()
```

---

## Hook Patterns

### Context Injection

```python
def inject_context():
    """Read project state and inject into AI context"""
    context = {
        "developer": get_developer(),
        "current_task": get_current_task(),
        "guidelines": read_guidelines(),
    }
    return format_context(context)
```

### Error Handling

```python
def safe_hook_operation():
    """Hooks should never crash the parent process"""
    try:
        # Operation
        return {"status": "success"}
    except Exception as e:
        # Return error, don't raise
        return {"status": "error", "message": str(e)}
```

---

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Hook files | kebab-case | `session-start.py` |
| Functions | snake_case | `get_developer()` |
| Constants | UPPER_SNAKE | `DEFAULT_TIMEOUT` |

---

## Common Mistakes

### Don't: Raise exceptions

```python
# Bad: Will crash the AI tool
def hook():
    raise Exception("Something went wrong")
```

### Do: Return error status

```python
# Good: Graceful error handling
def hook():
    try:
        # ...
        return {"status": "success"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
```

---

## Examples from Codebase

| File | Purpose |
|------|---------|
| `.claude/hooks/session-start.py` | Inject spec-first context |
| `.claude/hooks/inject-subagent-context.py` | Add code-spec to agents |
| `.claude/hooks/ralph-loop.py` | Detect conversation loops |
