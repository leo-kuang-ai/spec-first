# Logging Guidelines

> How logging is done in this project.

---

## Overview

This is a CLI tool that uses `console.log` with `chalk` for colored output.

**No structured logging library** - Simple console output is sufficient for CLI tools.

**Color conventions:**
- `chalk.green()` - Success messages
- `chalk.red()` - Errors
- `chalk.yellow()` - Warnings
- `chalk.gray()` - Secondary info
- `chalk.cyan()` - Highlighted values
- `chalk.white()` - Normal text

---

## Log Levels

### Success (Green)

```typescript
console.log(chalk.green(`✅ Global developer initialized`));
```

Use for: Successful operations, completion messages

### Error (Red)

```typescript
console.log(chalk.red("Error: Invalid input"));
```

Use for: Validation errors, fatal errors

### Warning (Yellow)

```typescript
console.log(chalk.yellow(`Global developer already set: ${existingName}`));
```

Use for: Non-fatal issues, deprecation notices

### Info (Gray)

```typescript
console.log(chalk.gray(`  File: ${globalDevFile}`));
```

Use for: Secondary information, file paths, hints

---

## Structured Logging

N/A - This is a CLI tool using simple console output with chalk colors.

---

## What to Log

- Command execution start/completion
- File operations (created, updated, deleted)
- Configuration changes
- User prompts and responses
- Success/failure status

**Example:** `src/cli/index.ts:50-53`

```typescript
console.log(chalk.green(`✅ Global developer initialized`));
console.log(chalk.gray(`   spec-first v${VERSION}`));
console.log();
console.log(chalk.white("  👤 Developer:"), chalk.cyan(name));
```

---

## What NOT to Log

- User's file contents (may contain secrets)
- API keys or tokens
- Personal identifiable information
- Full file paths in production (use relative paths)
