# Error Handling

> How errors are handled in this project.

---

## Overview

This CLI project uses a straightforward error handling approach:
- Try-catch for operations that may fail
- `chalk.red()` for user-facing error messages
- `process.exit(1)` for fatal errors
- Graceful fallbacks where possible

---

## Error Patterns

### CLI Command Error Handling

```typescript
// Example from src/cli/index.ts
.action(async (options: Record<string, unknown>) => {
  try {
    await init(options);
  } catch (error) {
    console.error(
      chalk.red("Error:"),
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
});
```

### Utility Function Error Handling

```typescript
// Return boolean for success/failure, don't throw
function createBootstrapTask(cwd: string, developer: string): boolean {
  try {
    // ... operation
    return true;
  } catch {
    return false;  // Silent failure, caller handles
  }
}
```

### Detection Functions

```typescript
// Return undefined/null on failure, don't throw
function getPythonCommand(): string {
  try {
    execSync("python3 --version", { stdio: "pipe" });
    return "python3";
  } catch {
    try {
      execSync("python --version", { stdio: "pipe" });
      return "python";
    } catch {
      return "python3";  // Default, let it fail with clear error later
    }
  }
}
```

---

## Error Message Style

### User-Facing Errors

```typescript
// Good: Clear, actionable error message
console.log(
  chalk.red(
    "Error: --monorepo specified but no monorepo configuration found.",
  ),
);
return;

// Good: Suggests next action
console.log(
  chalk.red(
    "Error: Registry is a marketplace with multiple templates. " +
      "Use --template <id> to specify which one.",
  ),
);
```

### Network Errors

```typescript
// Distinguish between "not found" and "network issue"
if (probeResult.isNotFound) {
  // Expected: no index.json → direct download mode
} else {
  // Transient error → abort, don't misclassify
  console.log(
    chalk.red(
      "Error: Could not reach registry (network issue). Check your connection.",
    ),
  );
  return;
}
```

---

## Common Patterns

### Silent Fallback Pattern

```typescript
// Try to detect, fall back gracefully
let developerName = options.user;
if (!developerName) {
  try {
    developerName = execSync("git config user.name", { encoding: "utf-8" }).trim();
  } catch {
    // Git not available or no user.name configured
    // Will prompt user later
  }
}
```

### Early Return Pattern

```typescript
// Check preconditions, return early on error
if (tools.length === 0) {
  console.log(chalk.yellow("No tools selected. At least one tool is required."));
  return;
}
```

---

## Common Mistakes

### Don't: Swallow errors silently in critical paths

```typescript
// Bad: Silent failure in important operation
try {
  await criticalOperation();
} catch {
  // User never knows something went wrong
}
```

### Do: Log or return status

```typescript
// Good: Inform user or return status
try {
  await criticalOperation();
} catch (error) {
  console.log(chalk.yellow(`Warning: ${error}`));
}
```

### Don't: Throw without context

```typescript
// Bad
throw new Error("Failed");
```

### Do: Include actionable context

```typescript
// Good
console.log(
  chalk.red("Error: Could not reach registry. Check your connection and try again."),
);
```
