# Frontend Development Guidelines

> Best practices for frontend/CLI development in this project.

---

## Overview

**Note**: This is a CLI project without traditional frontend UI. These guidelines cover TypeScript patterns used throughout the codebase.

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Module organization and file layout | ✅ Filled |
| [Component Guidelines](./component-guidelines.md) | Module interface patterns | ✅ Filled |
| [Hook Guidelines](./hook-guidelines.md) | CLI hooks (Python scripts) | ✅ Filled |
| [State Management](./state-management.md) | File-based state patterns | ✅ Filled |
| [Quality Guidelines](./quality-guidelines.md) | Code standards, forbidden patterns | ✅ Filled |
| [Type Safety](./type-safety.md) | TypeScript conventions | ✅ Filled |

---

## Pre-Development Checklist

Before implementing features, read:

- [ ] [Type Safety](./type-safety.md) - Understand typing patterns
- [ ] [Directory Structure](./directory-structure.md) - Know where files go
- [ ] [Quality Guidelines](./quality-guidelines.md) - Review standards

---

## Quick Reference

### Type Pattern

```typescript
// Const assertion for registries
export const AI_TOOLS = {
  "claude-code": { ... },
} as const;

export type AITool = keyof typeof AI_TOOLS;
```

### Options Pattern

```typescript
interface FeatureOptions {
  required: string;
  optional?: boolean;
  withDefault?: number;
}

export async function feature(options: FeatureOptions): Promise<Result> {
  const { required, optional = false, withDefault = 0 } = options;
  // ...
}
```

### Return Type Union

```typescript
type Result =
  | { success: true; data: string }
  | { success: false; error: string };
```

---

**Language**: All documentation written in **English**.
