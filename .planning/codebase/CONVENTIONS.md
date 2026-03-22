# Coding Conventions

**Analysis Date:** 2026-03-23

## Naming Patterns

**Files:**
- TypeScript source files: `kebab-case.ts` (e.g., `browser-manager.ts`, `cookie-picker-routes.ts`)
- Test files: `kebab-case.test.ts` (e.g., `commands.test.ts`, `snapshot.test.ts`)
- Template files: `UPPERCASE.tmpl` (e.g., `SKILL.md.tmpl`)
- Generated documentation: `UPPERCASE.md` (e.g., `SKILL.md`, `CLAUDE.md`)

**Functions:**
- Handler functions: `handle<Command>` pattern (e.g., `handleSnapshot`, `handleReadCommand`, `handleWriteCommand`)
- Parser functions: `parse<Resource>` (e.g., `parseSnapshotArgs`, `parseLine`)
- Validation functions: `validate<Resource>` (e.g., `validateAuth`, `validateSkill`)
- Generator functions: `generate<Output>` (e.g., `generateCommandReference`, `generateHelpText`)
- Resolver functions: `resolve<Resource>` (e.g., `resolveConfig`, `resolveServerScript`)

**Variables:**
- Constants: `SCREAMING_SNAKE_CASE` for true constants (e.g., `AUTH_TOKEN`, `MAX_RETRIES`, `IDLE_TIMEOUT_MS`, `ROOT`)
- Local variables: `camelCase` (e.g., `testServer`, `baseUrl`, `refMap`)
- Private class members: Use `private` keyword, no underscore prefix (e.g., `private browser: Browser | null`)

**Types/Interfaces:**
- PascalCase for all type names (e.g., `BrowserManager`, `SnapshotOptions`, `RefEntry`, `ServerState`)
- No `I` prefix for interfaces (e.g., `ServerState` not `IServerState`)
- Use `Record<K, V>` for dictionary types

**Examples from `browse/src/commands.ts`:**
```typescript
export const READ_COMMANDS = new Set([
  'text', 'html', 'links', 'forms', 'accessibility',
  'js', 'eval', 'css', 'attrs',
  'console', 'network', 'cookies', 'storage', 'perf',
  'dialog', 'is',
]);

export const COMMAND_DESCRIPTIONS: Record<string, { category: string; description: string; usage?: string }> = {
  'goto': { category: 'Navigation', description: 'Navigate to URL', usage: 'goto <url>' },
  'text': { category: 'Reading', description: 'Cleaned page text' },
};
```

## Code Style

**Formatting:**
- No explicit prettier/eslint config detected — follows Bun's default formatting
- Indentation: 2 spaces
- Max line length: ~100 characters (soft limit)
- Semicolons: Used consistently
- Quotes: Single quotes for most strings, backticks for template literals

**Project-wide patterns:**
- TypeScript strict mode (inferred from code quality)
- ES modules (`"type": "module"` in package.json)
- Async/await preferred over raw promises

## Import Organization

**Order:**
1. Node.js built-ins (e.g., `import * as fs from 'fs'`, `import * as path from 'path'`)
2. External packages (e.g., `import { chromium } from 'playwright'`, `import Anthropic from '@anthropic-ai/sdk'`)
3. Internal modules with relative paths (e.g., `import { BrowserManager } from './browser-manager'`)

**Path style:**
- Relative imports for same-module files: `'./config'`, `'./commands'`
- No path aliases configured (no tsconfig.json found)
- No explicit file extensions in imports

**Example from `browse/src/server.ts`:**
```typescript
import { BrowserManager } from './browser-manager';
import { handleReadCommand } from './read-commands';
import { handleWriteCommand } from './write-commands';
import { handleMetaCommand } from './meta-commands';
import { handleCookiePickerRoute } from './cookie-picker-routes';
import { COMMAND_DESCRIPTIONS } from './commands';
import { SNAPSHOT_FLAGS } from './snapshot';
import { resolveConfig, ensureStateDir, readVersionHash } from './config';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
```

## Error Handling

**Patterns:**
- Throw descriptive `Error` objects with context: `throw new Error(\`[browse] Port ${port} is in use\`)`
- Include component prefix in error messages: `[browse]`, `[cookie-picker]`
- Catch blocks: Either handle specific errors or use empty catch with comment explaining why
- Server errors: Exit process with code 1 for fatal errors (`process.exit(1)`)
- Retries: Implement retry logic with clear limits and informative messages

**Examples from codebase:**
```typescript
// Descriptive error with context and component prefix
throw new Error(`[browse] Server failed to start within ${MAX_START_WAIT / 1000}s`);

// Graceful degradation with cleanup (empty catch with reason)
try {
  await page.evaluate(() => {
    document.querySelectorAll('.__browse_annotation__').forEach(el => el.remove());
  });
} catch {
  // Element may be offscreen or hidden — skip
}

// Retry with limit and clear messaging
if (retries >= 1) throw new Error('[browse] Server crashed twice in a row — aborting');
console.error('[browse] Server connection lost. Restarting...');
const newState = await startServer();
return sendCommand(newState, command, args, retries + 1);

// Usage errors with helpful syntax hints
if (!url) throw new Error('Usage: browse goto <url>');
```

**Error propagation:**
- Server → CLI: HTTP status codes + JSON error objects with `error` and optional `hint` fields
- CLI → user: Print to stderr, exit with code 1
- Try to parse JSON errors before falling back to raw text

## Logging

**Framework:** Bun's console (no logging library)

**Patterns:**
- Prefix all logs with component name: `[browse]`, `[cookie-picker]`
- Use `console.error()` for operational messages and errors (visible to user)
- Use `console.log()` for help text and success output
- Include relevant data in log messages: counts, URLs, paths, PIDs

**When to log:**
- Server startup: port, PID, state file location, idle timeout
- Lifecycle events: shutdown, restart, idle timeout, binary updates
- Errors: always log before throwing or exiting
- Progress: long-running operations (e.g., "Starting server...")

**Examples from codebase:**
```typescript
console.error('[browse] Binary updated, restarting server...');
console.log(`[browse] Server running on http://127.0.0.1:${port} (PID: ${process.pid})`);
console.log(`[browse] State file: ${config.stateFile}`);
console.log(`[browse] Idle timeout: ${IDLE_TIMEOUT_MS / 1000}s`);
console.log(`[cookie-picker] Imported ${result.count} cookies for ${Object.keys(result.domainCounts).length} domains`);
console.error(`[browse] ${err.message}`);
```

**Structured logging:**
- Console/network/dialog buffers use structured `LogEntry` types
- Flushed to disk asynchronously in JSON format
- Path pattern: `.spec-first/browse-{console,network,dialog}.log`

## Comments

**When to Comment:**
- File headers: Explain module purpose and architecture (see `browse/src/commands.ts`, `browse/src/snapshot.ts`)
- Complex algorithms: Explain the "why" not the "what"
- Non-obvious constraints: Platform differences, timeout values, edge cases
- Public APIs: Document parameters, return types, side effects

**JSDoc/TSDoc:**
- Used sparingly — prefer self-documenting code
- Interface/type definitions often have brief descriptions
- Function-level docs when behavior is complex or non-obvious

**Example file header from `browse/src/commands.ts`:**
```typescript
/**
 * Command registry — single source of truth for all browse commands.
 *
 * Dependency graph:
 *   commands.ts ──▶ server.ts (runtime dispatch)
 *                 ──▶ gen-skill-docs.ts (doc generation)
 *                 ──▶ skill-parser.ts (validation)
 *                 ──▶ skill-check.ts (health reporting)
 *
 * Zero side effects. Safe to import from build scripts and tests.
 */
```

**Example function doc from `browse/src/snapshot.ts`:**
```typescript
/**
 * Snapshot flag metadata — single source of truth for CLI parsing and doc generation.
 *
 * Imported by:
 *   - gen-skill-docs.ts (generates {{SNAPSHOT_FLAGS}} tables)
 *   - skill-parser.ts (validates flags in SKILL.md examples)
 */
```

**Section separators:**
- Use comment blocks for major sections: `// ─── Section Name ────────`

## Function Design

**Size:** Functions typically 10-50 lines; complex handlers may reach 100-200 lines

**Parameters:**
- Prefer 1-3 parameters; use options object for more
- Type annotations required on all parameters
- Default values via destructuring or explicit checks

**Return Values:**
- Async functions return `Promise<T>`
- Synchronous functions return direct values
- Error cases: throw exceptions (no Result/Either types)

**Example from `browse/src/snapshot.ts`:**
```typescript
export async function handleSnapshot(
  args: string[],
  bm: BrowserManager
): Promise<string> {
  const opts = parseSnapshotArgs(args);
  const page = bm.getPage();
  // ... implementation
  return output.join('\n');
}
```

**Example with options object:**
```typescript
export async function runSkillTest(opts: {
  testName: string;
  prompt: string;
  workingDirectory: string;
  maxTurns?: number;
  timeout?: number;
  model?: string;
}): Promise<SkillTestResult>
```

## Module Design

**Exports:**
- Named exports preferred over default exports
- Group related exports: `export const READ_COMMANDS`, `export const WRITE_COMMANDS`
- Re-export from index files when needed

**Barrel files:**
- Not used extensively — direct imports preferred
- Server re-exports buffer utilities: `export { consoleBuffer, networkBuffer, ... }`

**Dependency injection:**
- Pass dependencies explicitly (e.g., `BrowserManager` passed to command handlers)
- Config resolution: Functions accept optional `env`, `metaDir` parameters for testing

**Single source of truth:**
- Command registry: `browse/src/commands.ts` defines all commands once
- Snapshot flags: `browse/src/snapshot.ts` defines `SNAPSHOT_FLAGS` array
- Both are imported by doc generators, validators, and runtime code

**Example from `browse/src/commands.ts`:**
```typescript
export const READ_COMMANDS = new Set([...]);
export const WRITE_COMMANDS = new Set([...]);
export const META_COMMANDS = new Set([...]);
export const ALL_COMMANDS = new Set([...READ_COMMANDS, ...WRITE_COMMANDS, ...META_COMMANDS]);
```

## Commit Message Conventions

**Format:**
- Type prefix: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:`
- Scope (optional): `feat(skills+cli):`, `refactor(first):`
- Imperative mood: "add feature" not "added feature"
- Brief subject line (<72 chars), body optional

**Examples from git log:**
```
feat: add language configuration for skill output (zh/en)
docs: add installation verification report
refactor(first): 第一+二阶段改造 — 资产精简与输入矩阵代码化
chore: regenerate SKILL.md files with language directive
feat(skills+cli): 全量 skill 治理收口与第三阶段基础设施
docs: update user manual with correct GitHub links and version
```

**Bisection principle (from CLAUDE.md):**
- Every commit is a single logical change
- Separate refactors from behavior changes
- Test infrastructure separate from test implementations
- Template changes separate from generated file regeneration
- Mechanical refactors separate from new features

## CHANGELOG Style

**Audience:** Users, not contributors

**Format:**
- Lead with what users can now **do** (product-focused, not implementation-focused)
- Use plain language, avoid jargon
- Never mention internal details: `TODOS.md`, eval infrastructure, tracking systems
- Group by: Added, Changed, Fixed, Removed
- Version headers with date: `## [0.9.10.0] - 2026-03-22`

**Example from CHANGELOG.md:**
```markdown
## [0.9.10.0] - 2026-03-22 — Hard Cutover to spec-first

### Changed

- **The active codebase has completed its rename from gstack to spec-first.** Runtime paths, helper commands, install locations, and generated skill output now use `spec-first` as the canonical brand.
- **`/gstack-upgrade` is now `/spec-first-upgrade`.** The upgrade flow and its generated docs now follow the new project name end to end.
```

## Platform Awareness

**Cross-platform code:**
- Check `process.platform` for OS-specific behavior
- Use `IS_WINDOWS` constants for conditional logic
- Path operations: Use `path.resolve()` and `path.join()` (not string concatenation)
- Timeout adjustments: Windows may need longer timeouts (15s vs 8s)

**Example from `browse/src/cli.ts`:**
```typescript
const IS_WINDOWS = process.platform === 'win32';
const MAX_START_WAIT = IS_WINDOWS ? 15000 : 8000; // Node+Chromium takes longer on Windows

// On Windows, Bun can't launch/connect to Playwright's Chromium
// Fall back to running the server under Node.js with Bun API polyfills
const useNode = IS_WINDOWS && NODE_SERVER_SCRIPT;
const serverCmd = useNode
  ? ['node', NODE_SERVER_SCRIPT]
  : ['bun', 'run', SERVER_SCRIPT];
```

## Platform-Agnostic Design Principle

**From CLAUDE.md:**
> Skills must NEVER hardcode framework-specific commands, file patterns, or directory structures. Instead:
> 1. **Read CLAUDE.md** for project-specific config
> 2. **If missing, AskUserQuestion** — let the user tell you or let spec-first search the repo
> 3. **Persist the answer to CLAUDE.md** so we never have to ask again

**Applies to:**
- Test commands (use `bun test` not `npm test`)
- Eval commands (read from CLAUDE.md)
- Deploy commands (read from CLAUDE.md)
- Any project-specific behavior

---

*Convention analysis: 2026-03-23*
