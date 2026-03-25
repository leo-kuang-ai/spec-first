# Backend Development Guidelines

> Best practices for backend development in this project.

---

## Overview

This directory contains guidelines for the TypeScript CLI backend. Guidelines are based on actual codebase patterns.

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Module organization and file layout | ✅ Filled |
| [Database Guidelines](./database-guidelines.md) | File-based state (no database) | ✅ Filled |
| [Error Handling](./error-handling.md) | Error types, handling strategies | ✅ Filled |
| [Quality Guidelines](./quality-guidelines.md) | Code standards, forbidden patterns | ✅ Filled |
| [Logging Guidelines](./logging-guidelines.md) | CLI output with chalk | ✅ Filled |

---

## Pre-Development Checklist

Before implementing backend features, read:

- [ ] [Directory Structure](./directory-structure.md) - Understand module organization
- [ ] [Error Handling](./error-handling.md) - Learn error patterns
- [ ] [Quality Guidelines](./quality-guidelines.md) - Review forbidden patterns

---

## Quick Reference

### File Naming

```
kebab-case.ts    // All files
```

### Import Style

```typescript
import fs from "node:fs";                    // Node built-ins
import chalk from "chalk";                   // External
import { init } from "../commands/init.js";  // Internal (.js!)
```

### Function Pattern

```typescript
export async function command(options: Options): Promise<void> {
  try {
    // Implementation
  } catch (error) {
    console.error(
      chalk.red("Error:"),
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
}
```

---

**Language**: All documentation written in **English**.
