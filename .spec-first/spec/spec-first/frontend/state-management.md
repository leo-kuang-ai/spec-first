# State Management

> How state is managed in this project.

---

## Overview

**Note**: This is a CLI project without traditional frontend state management. State is managed through files and environment variables.

---

## State Categories

### 1. Project State (Files)

| File | State | Purpose |
|------|-------|---------|
| `.spec-first/.developer` | Developer identity | Who is working |
| `.spec-first/.current-task` | Current task path | What is being worked on |
| `.spec-first/tasks/*/task.json` | Task state | Task progress tracking |
| `.spec-first/.version` | Version | Update tracking |
| `config.yaml` | Configuration | Project settings |

### 2. Session State (In-memory)

- CLI options parsed from command line
- Write mode (ask/force/skip)
- Selected platforms
- Template choices

### 3. Environment State

```typescript
// Process-based state
const cwd = process.cwd();
const isWindows = process.platform === "win32";
const pythonCmd = getPythonCommand();  // "python3" or "python"
```

---

## File-based State Patterns

### Read state

```typescript
function getCurrentTask(cwd: string): string | null {
  const filePath = path.join(cwd, PATHS.CURRENT_TASK_FILE);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf-8").trim();
}
```

### Write state

```typescript
function setCurrentTask(cwd: string, taskPath: string): void {
  const filePath = path.join(cwd, PATHS.CURRENT_TASK_FILE);
  fs.writeFileSync(filePath, taskPath, "utf-8");
}
```

### Clear state

```typescript
function clearCurrentTask(cwd: string): void {
  const filePath = path.join(cwd, PATHS.CURRENT_TASK_FILE);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
```

---

## Global Module State

For CLI-wide settings during execution:

```typescript
// Global write mode (shared across file operations)
let globalWriteMode: WriteMode = "ask";

export function setWriteMode(mode: WriteMode): void {
  globalWriteMode = mode;
}

export function getWriteMode(): WriteMode {
  return globalWriteMode;
}
```

---

## State Flow

```
1. CLI Start
   ↓
2. Parse options → Set global state (write mode)
   ↓
3. Read project state (.developer, .current-task)
   ↓
4. Execute commands → Update files
   ↓
5. Write new state (tasks, version)
```

---

## Common Mistakes

### Don't: Store state in global variables across runs

```typescript
// Bad: Lost between CLI invocations
let currentTask = "task-1";
```

### Do: Persist to files

```typescript
// Good: Survives across sessions
fs.writeFileSync(".spec-first/.current-task", "task-1");
```

---

## Examples from Codebase

| Module | State Type |
|--------|------------|
| `src/utils/file-writer.ts` | Global write mode |
| `src/commands/init.ts` | Developer, task creation |
| `.spec-first/scripts/task.py` | Task state management |
