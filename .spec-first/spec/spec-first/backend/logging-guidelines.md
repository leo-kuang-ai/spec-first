# Logging Guidelines

> Structured logging patterns for this CLI project.

---

## Overview

This is a CLI tool, so logging = console output. We use `chalk` for colored, user-friendly messages. Logging should be informative but not verbose.

---

## Log Levels

### Info (blue)

For progress updates and successful operations:

```typescript
console.log(chalk.blue("📁 Creating workflow structure..."));
console.log(chalk.blue("📝 Configuring Claude Code..."));
console.log(chalk.blue("👤 Developer:"), chalk.gray(developerName));
```

### Success (green)

For completed operations:

```typescript
console.log(chalk.green("   ✓ All files created successfully"));
console.log(chalk.green(`   ${result.message}`));
```

### Warning (yellow)

For non-fatal issues or important notices:

```typescript
console.log(chalk.yellow("No tools selected. At least one tool is required."));
console.log(chalk.yellow(`  ↻ Overwritten: ${displayPath}`));
console.log(chalk.yellow('📌 Windows detected: Using "python" for hooks'));
```

### Error (red)

For failures that stop execution:

```typescript
console.error(chalk.red("Error:"), error instanceof Error ? error.message : error);
console.log(chalk.red("Error: Could not reach registry. Check your connection."));
```

### Muted (gray)

For secondary information:

```typescript
console.log(chalk.gray("   Using proxy: proxy.example.com"));
console.log(chalk.gray("   This may take a moment on slow connections."));
```

---

## Formatting Patterns

### Status Icons

```typescript
console.log(chalk.green("  ✓"), "Success message");
console.log(chalk.yellow("  ↻"), "Overwritten");
console.log(chalk.blue("  +"), "Appended");
console.log(chalk.gray("  ○"), "Skipped");
console.log(chalk.red("  ✗"), "Error message");
```

### Key-Value Pairs

```typescript
// Good: Label + value
console.log(chalk.blue("👤 Developer:"), chalk.gray(developerName));
console.log(chalk.gray(`   - ${pkg.name}`) + chalk.gray(` (${pkg.path})`));
```

---

## What NOT to Log

### Don't log sensitive data

```typescript
// Bad
console.log(`API key: ${apiKey}`);

// Good
console.log(`Using proxy: ${maskProxyUrl(proxyUrl)}`);
```

### Don't log raw objects

```typescript
// Bad
console.log(result);

// Good
console.log(chalk.green(`   ${result.message}`));
```

### Don't log in library code

```typescript
// Bad in utility functions
export function writeFile() {
  console.log("Writing file...");  // Too verbose
}

// Good: Let caller decide what to log
export async function writeFile(): Promise<boolean> {
  // ... silent operation, return status
}
```

---

## Common Patterns

### Progress indicator

```typescript
// Ticker for long operations
const ticker = setInterval(() => {
  elapsed++;
  process.stdout.write(`\r${chalk.gray(`Loading... ${elapsed}s/${timeout}s`)}`);
}, 1000);
// ... operation ...
clearInterval(ticker);
process.stdout.write("\r\x1b[2K");  // Clear line
```

### Silent mode

```typescript
// Use stdio: "pipe" for silent operations
execSync(command, { stdio: "pipe" });
```

---

## Examples from Codebase

| File | Usage |
|------|-------|
| `src/cli/index.ts` | Command startup, version check |
| `src/commands/init.ts` | Progress through init steps |
| `src/utils/file-writer.ts` | File operation status |
