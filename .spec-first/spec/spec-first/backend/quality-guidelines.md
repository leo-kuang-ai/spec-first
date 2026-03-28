# Quality Guidelines

> Code quality standards for TypeScript/Node.js development.

---

## Overview

This project enforces quality through:

- **TypeScript strict mode** - Type safety at compile time
- **ESLint** - Code style and common mistake prevention
- **Vitest** - Unit and integration tests
- **pnpm** - Deterministic dependency management

---

## Development Commands

```bash
# Build (compile TypeScript + copy templates)
pnpm build

# Run tests
pnpm test                    # All tests
pnpm test:watch              # Watch mode
vitest run test/path.test.ts # Single test file

# Code quality
pnpm lint                    # ESLint on src/ and test/
pnpm lint:fix                # Auto-fix lint issues
pnpm typecheck               # TypeScript type check
pnpm format                  # Prettier format

# Python scripts (in .spec-first/scripts/)
pnpm lint:py                 # basedpyright on Python files
```

---

## Forbidden Patterns

### 1. Missing `.js` Extension in Imports

```typescript
// ❌ Wrong - will fail at runtime in ESM
import { writeFile } from "./utils/file-writer";

// ✅ Correct - include .js extension
import { writeFile } from "./utils/file-writer.js";
```

### 2. Using Non-Node Prefixed Built-ins

```typescript
// ❌ Wrong
import fs from "fs";
import path from "path";

// ✅ Correct - use node: prefix
import fs from "node:fs";
import path from "node:path";
```

### 3. Mutable Exports

```typescript
// ❌ Wrong - mutable export
export let config = {};

// ✅ Correct - const export
export const config = {};

// ✅ Better - function getter
export function getConfig() {
  return { ... };
}
```

### 4. Any Type

```typescript
// ❌ Wrong
function process(data: any) { ... }

// ✅ Correct - use specific type or generic
function process<T>(data: T): T { ... }
// or
function process(data: unknown) {
  if (typeof data === "string") { ... }
}
```

### 5. Synchronous File Operations in Hot Paths

```typescript
// ❌ Wrong - blocks event loop
fs.readFileSync(path, "utf-8");

// ✅ Acceptable in CLI (not performance critical)
// CLI tools are short-lived, sync is acceptable

// ✅ Correct for libraries
await fs.promises.readFile(path, "utf-8");
```

---

## Required Patterns

### 1. Const Assertions for Registries

```typescript
// ✅ Required - use as const for type inference
export const AI_TOOLS = {
  "claude-code": { ... },
  cursor: { ... },
} as const;
```

### 2. Explicit Return Types for Public Functions

```typescript
// ✅ Required - explicit return type
export async function configureClaude(cwd: string): Promise<void> {
  // ...
}

// ✅ Also acceptable for simple functions
export function getVersion(): string {
  return VERSION;
}
```

### 3. Error Handling with chalk

```typescript
// ✅ Required - use chalk for error messages
import chalk from "chalk";

console.error(chalk.red("Error: Something went wrong"));
process.exit(1);
```

---

## Testing Requirements

### Test Structure

Tests should mirror the source structure:

```
test/
├── commands/
│   └── init.test.ts      # Tests for src/commands/init.ts
├── configurators/
│   └── cursor.test.ts    # Tests for src/configurators/cursor.ts
└── utils/
    └── file-writer.test.ts
```

### Test Patterns

```typescript
// Use Vitest
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

describe("file-writer", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "test-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should write new file", async () => {
    const filePath = path.join(tempDir, "test.txt");
    await writeFile(filePath, "content");
    expect(fs.readFileSync(filePath, "utf-8")).toBe("content");
  });
});
```

### Coverage Expectations

- **New features**: Must include tests
- **Bug fixes**: Should include regression test
- **Refactors**: Existing tests should pass

---

## Dogfooding Synchronization

> This project uses spec-first itself (dogfooding). Template changes must be synced.

### Sync Checklist

When adding new scripts or templates to `packages/cli/src/templates/spec-first/`:

- [ ] Sync scripts: `cp packages/cli/src/templates/spec-first/scripts/*.py .spec-first/scripts/`
- [ ] Sync workflow: `cp packages/cli/src/templates/spec-first/workflow.md .spec-first/workflow.md`
- [ ] Verify sync: `diff -r packages/cli/src/templates/spec-first/scripts/ .spec-first/scripts/`

### Known Sync Issues

| File | Template Path | Dogfooding Path | Status |
|------|---------------|-----------------|--------|
| `current_task.py` | `templates/spec-first/scripts/` | `.spec-first/scripts/` | ✅ Synced |
| `create_bootstrap.py` | `templates/spec-first/scripts/` | `.spec-first/scripts/` | ✅ Synced |

### Prevention Mechanism

> **Root Cause**: Change Propagation Failure - new templates added but dogfooding project not updated.

**Prevention**: After adding new templates, always sync to `.spec-first/` directory.

---

## Code Review Checklist

- [ ] TypeScript compiles without errors (`pnpm typecheck`)
- [ ] ESLint passes (`pnpm lint`)
- [ ] Tests pass (`pnpm test`)
- [ ] Imports use `.js` extension
- [ ] Built-ins use `node:` prefix
- [ ] Error messages use `chalk.red()`
- [ ] Public functions have explicit return types
- [ ] Registry objects use `as const`
- [ ] Dogfooding synced (if templates changed)
