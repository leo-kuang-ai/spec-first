# Quality Guidelines

> Code quality standards for backend development.

---

## Overview

This project emphasizes clean, maintainable TypeScript code with strong typing and clear patterns. Code should be self-documenting with minimal comments needed.

---

## Forbidden Patterns

### Never use `any` without justification

```typescript
// Bad
function process(data: any) { ... }

// Good
function process(data: Record<string, unknown>) { ... }
// Or define a proper type
interface ProcessData { ... }
function process(data: ProcessData) { ... }
```

### Never ignore TypeScript errors

```typescript
// Bad
// @ts-ignore
someUntypedCall();

// Good: Fix the type or use proper assertion
(someUntypedCall() as ExpectedType);
```

### Never use `var`

```typescript
// Bad
var x = 1;

// Good
const x = 1;
let y; // Only if reassignment needed
```

### Never mix CommonJS and ESM

```typescript
// Bad
const fs = require("fs");
module.exports = { ... };

// Good
import fs from "node:fs";
export { ... };
```

---

## Required Patterns

### Use const assertions for readonly data

```typescript
// Good
const AI_TOOLS = {
  "claude-code": { ... },
} as const;

type AITool = keyof typeof AI_TOOLS;
```

### Use explicit return types for public functions

```typescript
// Good
export function getConfiguredPlatforms(cwd: string): Set<AITool> {
  // ...
}

// Also good for async
export async function init(options: InitOptions): Promise<void> {
  // ...
}
```

### Use type guards for error handling

```typescript
// Good
catch (error) {
  console.error(
    chalk.red("Error:"),
    error instanceof Error ? error.message : error,
  );
}
```

### Use descriptive variable names

```typescript
// Bad
const d = detectMonorepo(cwd);
for (const p of d) { ... }

// Good
const detectedPackages = detectMonorepo(cwd);
for (const pkg of detectedPackages) { ... }
```

---

## Testing Requirements

### Test file location

```
packages/cli/
├── src/
│   └── utils/
│       └── compare-versions.ts
└── test/
    └── compare-versions.test.ts
```

### Test naming

```typescript
// Test file: {module}.test.ts
describe("compareVersions", () => {
  it("should return positive when a > b", () => {
    expect(compareVersions("2.0.0", "1.0.0")).toBeGreaterThan(0);
  });
});
```

---

## Code Review Checklist

- [ ] No `any` types without justification
- [ ] Imports use `.js` extension for ESM
- [ ] Error messages use `chalk.red()` and are user-friendly
- [ ] Functions have explicit return types
- [ ] No unused variables or imports
- [ ] Constants use `UPPER_SNAKE_CASE`
- [ ] Files use `kebab-case`
- [ ] No console.log in library code (use chalk for CLI output)
- [ ] Try-catch wraps operations that may fail
- [ ] Early returns used to reduce nesting

---

## Linting

Run before committing:

```bash
npm run lint
npm run typecheck
```

---

## Common Mistakes

### Forgetting `.js` extension in imports

```typescript
// Bad - will fail at runtime
import { init } from "../commands/init";

// Good
import { init } from "../commands/init.js";
```

### Not handling undefined

```typescript
// Bad
const name = options.user.trim();

// Good
const name = options.user?.trim() ?? "default";
```

### Overly nested code

```typescript
// Bad
if (condition1) {
  if (condition2) {
    if (condition3) {
      doSomething();
    }
  }
}

// Good
if (!condition1 || !condition2 || !condition3) return;
doSomething();
```
