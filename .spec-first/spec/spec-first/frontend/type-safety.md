# Type Safety

> Type safety patterns in this TypeScript CLI project.

---

## Overview

This project uses TypeScript with strict mode. Strong typing is enforced throughout, with minimal use of `any`. Types are centralized in `src/types/` and derived from data where possible.

---

## Type Organization

### Central types directory

```
src/types/
├── ai-tools.ts      # Platform types and registry
└── migration.ts     # Migration types
```

### Inline types for local use

```typescript
// In the file that uses them
interface InitAnswers {
  tools: string[];
  template?: string;
}

interface TaskJson {
  id: string;
  name: string;
  status: string;
  // ...
}
```

---

## Key Patterns

### Const assertions for registries

```typescript
// Single source of truth
export const AI_TOOLS = {
  "claude-code": {
    name: "Claude Code",
    configDir: ".claude",
    // ...
  },
  // ...
} as const;

// Derived type
export type AITool = keyof typeof AI_TOOLS;
```

### Union types from const

```typescript
// From const object
export type CliFlag =
  | "claude"
  | "cursor"
  | "opencode"
  // ...

// From array
export const PLATFORM_IDS = Object.keys(AI_TOOLS) as AITool[];
```

### Type-safe config interfaces

```typescript
export interface AIToolConfig {
  name: string;
  templateDirs: TemplateDir[];
  configDir: string;
  supportsAgentSkills?: boolean;
  cliFlag: CliFlag;
  defaultChecked: boolean;
  hasPythonHooks: boolean;
}
```

---

## Compile-time Validation

### Exhaustive checks

```typescript
// Ensure all CliFlags are in InitOptions
type _AssertCliFlagsInOptions = [CliFlag] extends [keyof InitOptions]
  ? true
  : "ERROR: CliFlag has values not present in InitOptions";
const _cliFlagCheck: _AssertCliFlagsInOptions = true;
```

### Record types for registries

```typescript
export const AI_TOOLS: Record<AITool, AIToolConfig> = {
  // TypeScript ensures all AITool keys are covered
};
```

---

## Type Guards

### Error handling

```typescript
// Type-safe error handling
catch (error) {
  const message = error instanceof Error
    ? error.message
    : String(error);
}
```

### Type predicates (when needed)

```typescript
function isAITool(value: string): value is AITool {
  return value in AI_TOOLS;
}
```

---

## Forbidden Patterns

### No unchecked any

```typescript
// Bad
function process(data: any) { ... }

// Good
function process(data: unknown) {
  if (typeof data === "string") { ... }
}
```

### No type assertions without validation

```typescript
// Bad
const config = JSON.parse(content) as AIToolConfig;

// Good - validate first or use unknown
const config: AIToolConfig = JSON.parse(content);
// Or better: use a validation library for external data
```

### No non-null assertions

```typescript
// Bad
const value = options.user!;

// Good
const value = options.user ?? "default";
```

---

## Common Patterns

### Options type pattern

```typescript
interface InitOptions {
  cursor?: boolean;
  claude?: boolean;
  yes?: boolean;
  force?: boolean;
  // ...
}

// Usage
async function init(options: InitOptions): Promise<void> {
  if (options.force) { ... }
}
```

### Return type unions

```typescript
// Clear success/failure
interface SuccessResult {
  success: true;
  message: string;
  skipped?: boolean;
}

interface FailureResult {
  success: false;
  message: string;
}

type TemplateResult = SuccessResult | FailureResult;
```

---

## Examples from Codebase

| File | Pattern |
|------|---------|
| `src/types/ai-tools.ts` | Const assertion + derived types |
| `src/cli/index.ts` | Compile-time assertion |
| `src/utils/file-writer.ts` | Options interface + return type |
| `src/commands/init.ts` | Complex options interface |
