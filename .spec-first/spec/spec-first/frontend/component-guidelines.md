# Component Guidelines

> How components are built in this project.

---

## Overview

**Note**: This is a CLI project with no traditional UI components (React/Vue/etc.). The patterns below apply to the modular organization of CLI features.

---

## CLI "Components"

In this CLI context, "components" are feature modules:

```
feature/
├── index.ts          # Public API (like component export)
├── types.ts          # Types (like props interface)
├── implementation.ts # Core logic (like component body)
└── utils.ts          # Helpers (like utility functions)
```

---

## Module Interface Pattern

### Public API

```typescript
// feature/index.ts - Public interface
export { mainFunction, helperFunction } from "./implementation.js";
export type { FeatureOptions, FeatureResult } from "./types.js";
```

### Options pattern (like Props)

```typescript
// feature/types.ts
export interface FeatureOptions {
  required: string;
  optional?: boolean;
  withDefault?: number;  // Provide default
}

export interface FeatureResult {
  success: boolean;
  data?: string;
  error?: string;
}
```

---

## Implementation Patterns

### Function signature

```typescript
// Clear, typed function with options
export async function runFeature(
  options: FeatureOptions,
): Promise<FeatureResult> {
  const { required, optional = false, withDefault = 0 } = options;

  // Implementation

  return { success: true, data: "result" };
}
```

### Error handling

```typescript
// Return error in result, don't throw
export async function safeOperation(): Promise<FeatureResult> {
  try {
    // ...
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

---

## Common Mistakes

### Don't: Export everything

```typescript
// Bad: Exposing internals
export * from "./implementation.js";
```

### Do: Explicit public API

```typescript
// Good: Controlled interface
export { mainFunction } from "./implementation.js";
export type { Options } from "./types.js";
```

---

## Examples from Codebase

| Module | Pattern |
|--------|---------|
| `src/configurators/` | Registry pattern with platform-specific modules |
| `src/utils/file-writer.ts` | Options + result pattern |
| `src/templates/extract.ts` | Pure functions with clear types |
