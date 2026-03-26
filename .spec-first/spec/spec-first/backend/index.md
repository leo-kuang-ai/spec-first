# Backend Development Guidelines

> Best practices for TypeScript/Node.js development in this project.

---

## Overview

spec-first is a multi-platform AI coding workflow CLI tool. The backend consists of:

- **TypeScript/Node.js CLI** (`packages/cli/src/`)
- **Python scripts** (`.spec-first/scripts/`)

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Module organization and file layout | ✅ Filled |
| [Database Guidelines](./database-guidelines.md) | File-based data storage patterns | ✅ Filled |
| [Error Handling](./error-handling.md) | Error types, handling strategies | ✅ Filled |
| [Quality Guidelines](./quality-guidelines.md) | Code standards, forbidden patterns | ✅ Filled |
| [Logging Guidelines](./logging-guidelines.md) | Console output, JSONL audit logs | ✅ Filled |

---

## Pre-Development Checklist

Before starting backend work, read:

1. [Directory Structure](./directory-structure.md) - Understand module organization
2. [Quality Guidelines](./quality-guidelines.md) - Know the forbidden patterns
3. [Error Handling](./error-handling.md) - Use consistent error patterns

---

## Quick Reference

### TypeScript Conventions

```typescript
// Use node: prefix for built-ins
import fs from "node:fs";
import path from "node:path";

// Use .js extension for local imports
import { writeFile } from "../utils/file-writer.js";

// Use as const for registries
export const AI_TOOLS = { ... } as const;

// Use chalk for error messages
console.error(chalk.red("Error: Something went wrong"));
```

### Python Conventions

```python
# Use pathlib for paths
from pathlib import Path

# Use type hints
def get_config(repo_root: Path | None = None) -> dict:
    ...

# Print errors to stderr
print(f"Error: {message}", file=sys.stderr)
```

---

## Development Commands

```bash
pnpm build      # Compile TypeScript
pnpm test       # Run tests
pnpm lint       # Check code style
pnpm typecheck  # Type check
```
