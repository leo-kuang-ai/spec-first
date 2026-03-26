# Error Handling

> How errors are handled in this project.

---

## Overview

This CLI tool uses a straightforward error handling approach optimized for developer experience:

- Use `chalk.red()` for error messages to make them visually distinct
- Use `process.exit(1)` for fatal errors
- Handle expected errors gracefully with informative messages
- Let unexpected errors propagate with full stack traces

---

## Error Patterns

### CLI Error Messages

Use `chalk.red()` for error output:

```typescript
import chalk from "chalk";

// ✅ Correct - clear error message with chalk
console.error(chalk.red("Error: Template not found"));
process.exit(1);

// ❌ Wrong - no visual distinction
console.error("Error: Template not found");
process.exit(1);
```

### File Operation Errors

Handle file system errors with context:

```typescript
// From src/utils/file-writer.ts
export async function writeFile(
  filePath: string,
  content: string,
  options?: { executable?: boolean },
): Promise<boolean> {
  const exists = fs.existsSync(filePath);

  if (!exists) {
    fs.writeFileSync(filePath, content);
    return true;
  }

  // Handle conflicts based on mode
  const existingContent = fs.readFileSync(filePath, "utf-8");
  if (existingContent === content) {
    return false; // Skip silently if identical
  }

  // Interactive prompt for conflicts
  // ...
}
```

### Configuration Errors

Validate and report configuration issues:

```typescript
// From .spec-first/scripts/common/config.py
def validate_package(package: str, repo_root: Path | None = None) -> bool:
    """Check if a package name is valid in this project."""
    packages = get_packages(repo_root)
    if packages is None:
        return True  # Single-repo, no validation needed
    return package in packages
```

---

## Error Types

This project uses simple error handling without custom error classes:

| Situation | Pattern |
|-----------|---------|
| Invalid CLI arguments | Print usage + `process.exit(1)` |
| File not found | `chalk.red()` + `process.exit(1)` |
| Network errors | Retry with timeout, then fail |
| Configuration errors | Warning message + graceful fallback |

---

## Logging Patterns

### Console Output

```typescript
// Success messages
console.log(chalk.green("✓ Created: .claude/"));

// Warning messages
console.log(chalk.yellow("  ↻ Overwritten: .claude/settings.json"));

// Info messages
console.log(chalk.blue("  + Appended: .spec-first/workflow.md"));

// Skip messages
console.log(chalk.gray("  ○ Skipped: .claude/commands/ (already exists)"));

// Error messages
console.error(chalk.red("Error: Failed to fetch templates"));
```

### Python Scripts

```python
import sys

# Warning to stderr
print(f"Warning: {message}", file=sys.stderr)

# Error and exit
print(f"Error: {message}", file=sys.stderr)
sys.exit(1)
```

---

## Common Mistakes

### 1. Silent Failures

```typescript
// ❌ Wrong - silent failure
try {
  fs.writeFileSync(path, content);
} catch {
  // Error is swallowed
}

// ✅ Correct - report the error
try {
  fs.writeFileSync(path, content);
} catch (error) {
  console.error(chalk.red(`Failed to write ${path}: ${error}`));
  process.exit(1);
}
```

### 2. Missing Error Context

```typescript
// ❌ Wrong - no context
console.error(chalk.red("Failed to fetch"));

// ✅ Correct - includes context
console.error(chalk.red(`Failed to fetch template from ${url}: ${error.message}`));
```

### 3. Incorrect Exit Codes

```typescript
// ❌ Wrong - continues after error
if (!config) {
  console.error(chalk.red("Config not found"));
}
// Code continues...

// ✅ Correct - exits on fatal error
if (!config) {
  console.error(chalk.red("Config not found"));
  process.exit(1);
}
```
