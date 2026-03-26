# Logging Guidelines

> How logging is done in this project.

---

## Overview

This CLI tool uses console output for user-facing messages. The logging approach is simple and focused on developer experience:

- **No logging library** - Use `console.log/error` directly
- **Color-coded output** - Use `chalk` for visual distinction
- **Structured data** - Use JSONL files for audit logs

---

## Console Output Patterns

### TypeScript (CLI)

```typescript
import chalk from "chalk";

// Success messages (green)
console.log(chalk.green("✓ Created: .claude/"));
console.log(chalk.green("  ✓ Initialized spec-first"));

// Warning/changed files (yellow)
console.log(chalk.yellow("  ↻ Overwritten: .claude/settings.json"));

// Info/appended files (blue)
console.log(chalk.blue("  + Appended: .spec-first/workflow.md"));

// Skip messages (gray)
console.log(chalk.gray("  ○ Skipped: .claude/commands/ (already exists)"));

// Error messages (red)
console.error(chalk.red("Error: Failed to fetch templates"));
console.error(chalk.red(`Error: ${error.message}`));
```

### Python (Scripts)

```python
import sys

# Regular output
print(f"Task: {task_name}")

# Warning to stderr
print(f"Warning: {message}", file=sys.stderr)

# Error and exit
print(f"Error: {message}", file=sys.stderr)
sys.exit(1)
```

---

## Log Levels

| Level | Function | Color | When to Use |
|-------|----------|-------|-------------|
| Success | `console.log(chalk.green(...))` | Green | Operation completed successfully |
| Info | `console.log(...)` | Default | General information |
| Warning | `console.log(chalk.yellow(...))` | Yellow | Non-fatal issues, skipped files |
| Error | `console.error(chalk.red(...))` | Red | Fatal errors, failures |

---

## Structured Logging (JSONL)

For audit trails and context injection, use JSONL files:

```jsonl
// .spec-first/implement.jsonl
{"file": "src/commands/init.ts", "reason": "CLI init command implementation"}
{"file": "src/types/ai-tools.ts", "reason": "Platform registry for AI tools"}
```

```python
# Writing JSONL
import json

with open("implement.jsonl", "a", encoding="utf-8") as f:
    f.write(json.dumps({"file": path, "reason": reason}) + "\n")

# Reading JSONL
entries = []
with open("implement.jsonl", "r", encoding="utf-8") as f:
    for line in f:
        if line.strip():
            entries.append(json.loads(line))
```

---

## What to Log

### CLI Output

- File operations (created, overwritten, skipped, appended)
- Progress indicators
- Error messages with context
- Final status summary

### JSONL Audit Logs

- Files included in context for AI agents
- Task state changes
- Configuration values used

---

## What NOT to Log

- **Secrets**: API keys, tokens, passwords
- **User data**: File contents (only paths)
- **Internal state**: Debug info (use `--verbose` flag if needed)

---

## Common Mistakes

### 1. Missing Color for Errors

```typescript
// ❌ Wrong - hard to spot
console.error("Error: Failed to write file");

// ✅ Correct - visually distinct
console.error(chalk.red("Error: Failed to write file"));
```

### 2. Missing Context

```typescript
// ❌ Wrong - no context
console.error(chalk.red("Failed to fetch"));

// ✅ Correct - includes context
console.error(chalk.red(`Failed to fetch template from ${url}`));
```

### 3. Over-logging

```typescript
// ❌ Wrong - too verbose
console.log("Step 1: checking file");
console.log("Step 2: reading content");
console.log("Step 3: writing file");

// ✅ Correct - concise
console.log(chalk.green(`  ✓ Updated: ${filename}`));
```
