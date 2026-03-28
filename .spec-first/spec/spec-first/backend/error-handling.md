# Error Handling

> How errors are handled in this project.

---

## Overview

This is a CLI tool, so error handling focuses on:
- User-friendly error messages with `chalk.red()`
- Graceful exit with `process.exit(1)` for fatal errors
- Clear validation messages for invalid inputs
- No custom error classes - use standard Error with descriptive messages

---

## Error Types

No custom error classes. Use standard `Error` with descriptive messages.

---

## Error Handling Patterns

### CLI Validation Errors

```typescript
// Pattern: Validate input, show error with chalk.red(), exit with code 1
if (!isValid) {
  console.log(chalk.red("Error: Invalid input"));
  process.exit(1);
}
```

**Example:** `src/cli/index.ts:167-171`

```typescript
if (global && !updatePlatform) {
  console.log(chalk.red("Error: --global requires -u <name>"));
  process.exit(1);
}
```

### Command Execution Errors

```typescript
// Pattern: Try-catch around command logic, show error, exit
try {
  await executeCommand();
} catch (error) {
  console.log(chalk.red("Error:"), error.message);
  process.exit(1);
}
```

**Example:** `src/cli/index.ts:185-188`

---

## API Error Responses

N/A - This is a CLI tool, not an API server.

---

## Common Mistakes

### ❌ Don't: Throw errors without user-friendly messages

```typescript
throw new Error("ENOENT");
```

### ✅ Do: Provide clear, actionable error messages

```typescript
console.log(chalk.red(`Error: ${BRAND.displayName} is not initialized in this directory.`));
console.log(chalk.yellow(`Run '${BRAND.cliName} init' first.`));
process.exit(1);
```

### ❌ Don't: Silent failures

```typescript
if (!fileExists) return;
```

### ✅ Do: Exit with error code for failures

```typescript
if (!fileExists) {
  console.log(chalk.red("Error: Required file not found"));
  process.exit(1);
}
```
