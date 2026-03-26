# Database Guidelines

> Data storage patterns for this project.

---

## Overview

**This project does not use a database.**

spec-first is a CLI tool that uses the file system for all data storage:

- **Configuration**: YAML files (`.spec-first/config.yaml`)
- **Task tracking**: JSON files (`.spec-first/tasks/*/task.json`)
- **Session records**: Markdown files (`.spec-first/workspace/*/journal-*.md`)
- **Audit logs**: JSONL files (`.spec-first/*.jsonl`)

---

## File-Based Data Patterns

### Configuration Files

```yaml
# .spec-first/config.yaml
session_commit_message: "chore: record journal"
max_journal_lines: 2000

packages:
  cli:
    path: packages/cli
  docs-site:
    path: docs-site
    type: submodule
```

### Task Files

```json
// .spec-first/tasks/00-bootstrap-guidelines/task.json
{
  "name": "Bootstrap Guidelines",
  "slug": "00-bootstrap-guidelines",
  "status": "in_progress",
  "created": "2026-03-25",
  "owner": "kuang"
}
```

### JSONL Audit Logs

```jsonl
// .spec-first/implement.jsonl
{"file": ".spec-first/spec/backend/directory-structure.md", "reason": "Backend directory structure guidelines"}
{"file": ".spec-first/spec/backend/error-handling.md", "reason": "Error handling patterns"}
```

---

## Python Script Data Access

The Python scripts in `.spec-first/scripts/` handle file-based data:

```python
# From .spec-first/scripts/common/config.py
def _load_config(repo_root: Path | None = None) -> dict:
    """Load and parse config.yaml. Returns empty dict on any error."""
    config_file = _get_config_path(repo_root)
    try:
        content = config_file.read_text(encoding="utf-8")
        return parse_simple_yaml(content)
    except (OSError, IOError):
        return {}
```

---

## Data Migration Pattern

For schema changes, use migration manifests:

```json
// src/migrations/manifests/0.4.0.json
{
  "version": "0.4.0",
  "migrations": [
    {
      "type": "rename_file",
      "from": ".spec-first/commands/",
      "to": ".spec-first/claude/commands/"
    }
  ]
}
```

---

## Best Practices

1. **File locking**: Not needed - CLI is single-user
2. **Atomic writes**: Write to temp file, then rename
3. **Encoding**: Always use UTF-8
4. **Line endings**: LF (Unix style)
5. **JSON formatting**: 2-space indent
