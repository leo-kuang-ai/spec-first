# Quality Guidelines

> Code quality standards for frontend/CLI development.

---

## Overview

This project emphasizes clean TypeScript with strong typing, clear patterns, and self-documenting code.

---

## Forbidden Patterns

### Never use `any` without justification

```typescript
// Bad
function process(data: any) { ... }

// Good
function process(data: Record<string, unknown>) { ... }
```

### Never mix import styles

```typescript
// Bad
const fs = require("fs");
import path from "node:path";

// Good
import fs from "node:fs";
import path from "node:path";
```

### Never use `var`

```typescript
// Bad
var x = 1;

// Good
const x = 1;
```

### Never forget `.js` extension

```typescript
// Bad - ESM will fail
import { init } from "../commands/init";

// Good
import { init } from "../commands/init.js";
```

---

## Required Patterns

### Explicit return types

```typescript
// Required for public functions
export function getToolConfig(tool: AITool): AIToolConfig {
  return AI_TOOLS[tool];
}

export async function init(options: InitOptions): Promise<void> {
  // ...
}
```

### Const assertions for registries

```typescript
// Use as const for immutable data
export const AI_TOOLS = {
  "claude-code": { ... },
} as const;
```

### Error type guards

```typescript
catch (error) {
  const message = error instanceof Error
    ? error.message
    : String(error);
}
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
describe("compareVersions", () => {
  it("should return positive when a > b", () => {
    expect(compareVersions("2.0.0", "1.0.0")).toBeGreaterThan(0);
  });
});
```

---

## Code Review Checklist

- [ ] No `any` types without justification
- [ ] Imports use `.js` extension
- [ ] Functions have explicit return types
- [ ] No unused variables or imports
- [ ] Constants use `UPPER_SNAKE_CASE`
- [ ] Files use `kebab-case`
- [ ] Error handling uses type guards
- [ ] Early returns used to reduce nesting
- [ ] No console.log in library code

---

## Linting

```bash
npm run lint
npm run typecheck
```

---

## Common Mistakes

### Forgetting optional chaining

```typescript
// Bad
const name = options.user.trim();

// Good
const name = options.user?.trim() ?? "default";
```

### Overly nested code

```typescript
// Bad
if (a) {
  if (b) {
    if (c) {
      doSomething();
    }
  }
}

// Good
if (!a || !b || !c) return;
doSomething();
```

### Swallowing errors silently

```typescript
// Bad
try { ... } catch {}

// Good
try { ... } catch (e) {
  console.log(chalk.yellow(`Warning: ${e}`));
}
```
