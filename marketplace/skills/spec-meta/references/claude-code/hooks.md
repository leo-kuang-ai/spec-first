# Hooks System

Claude Code / iFlow hooks for automatic context injection and quality enforcement, plus task lifecycle hooks configured in config.yaml.

---

## Overview

There are two types of hooks in spec-first:

1. **Platform hooks** (Claude Code / iFlow) — Intercept AI lifecycle events via `settings.json`
2. **Task lifecycle hooks** (all platforms) — Shell commands triggered by task.py operations via `config.yaml`

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      PLATFORM HOOK LIFECYCLE                             │
│                                                                          │
│  Session Start ──► SessionStart hook ──► Inject workflow + task status  │
│  (startup/clear/compact)                                                │
│                                                                          │
│  Agent() called ──► PreToolUse:Agent hook ──► Inject specs from JSONL  │
│  Task() called  ──► PreToolUse:Task hook  ──► (same, legacy matcher)   │
│                                                                          │
│  Agent stops ──► SubagentStop hook ──► Ralph Loop verification          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      TASK LIFECYCLE HOOKS                                 │
│                                                                          │
│  task.py create  ──► after_create  ──► e.g. Create Linear issue        │
│  task.py start   ──► after_start   ──► e.g. Update status              │
│  task.py finish  ──► after_finish  ──► e.g. Mark done                  │
│  task.py archive ──► after_archive ──► e.g. Close issue                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Platform Hook Configuration

### `.claude/settings.json`

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/session-start.py\"",
            "timeout": 10
          }
        ]
      },
      {
        "matcher": "clear",
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/session-start.py\"",
            "timeout": 10
          }
        ]
      },
      {
        "matcher": "compact",
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/session-start.py\"",
            "timeout": 10
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Task",
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/inject-subagent-context.py\"",
            "timeout": 30
          }
        ]
      },
      {
        "matcher": "Agent",
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/inject-subagent-context.py\"",
            "timeout": 30
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "matcher": "check",
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/ralph-loop.py\"",
            "timeout": 300
          }
        ]
      }
    ]
  }
}
```

**Note**: PreToolUse matches both `Task` and `Agent` because Claude Code renamed the Task tool to Agent in v2.1.63. Both matchers are kept for backward compatibility.

---

## SessionStart Hook

### Purpose

Inject initial context when a Claude Code session starts, clears, or compacts.

### Matchers

| Matcher | When |
|---------|------|
| `startup` | Session first starts |
| `clear` | User runs `/clear` |
| `compact` | Context window compresses |

### Script: `session-start.py`

**Injects:**

- Developer identity from `.spec-first/.developer`
- Git status and recent commits
- Current task info (if `.spec-first/.current-task` exists)
- `workflow.md` content
- All dynamically discovered `spec/*/index.md` files (supports monorepo layout)
- Spec guideline indexes
- Start instructions
- **Task status tag** (`<task-status>`) with structured state:
  - `NO ACTIVE TASK` — no current task set
  - `NOT READY` — task exists but no JSONL context files
  - `READY` — task has context, ready to implement
  - `COMPLETED` — task is done

**Dynamic spec discovery**: The hook iterates `spec/` subdirectories at runtime instead of hardcoding `frontend/backend/guides`. This means adding a new spec category requires no hook modification.

**Output format:**

```json
{
  "result": "continue",
  "message": "# Session Context\n\n## Developer\ntaosu\n\n<task-status>Status: READY\n...</task-status>"
}
```

---

## PreToolUse:Agent Hook

### Purpose

Inject relevant specs when a subagent is invoked.

### Script: `inject-subagent-context.py`

**Trigger:** When `Agent(subagent_type="...")` or `Task(subagent_type="...")` is called.

**Flow:**

1. Read `subagent_type` from tool input
2. Find current task from `.spec-first/.current-task`
3. Load `{subagent_type}.jsonl` from task directory
4. Read each file listed in JSONL
5. Build augmented prompt with context
6. Update `task.json` with current phase

**Output format:**

```json
{
  "result": "continue",
  "updatedInput": {
    "prompt": "# Implement Agent Task\n\n## Context\n...\n\n## Your Task\n..."
  }
}
```

### JSONL Format

```jsonl
{"file": ".spec-first/spec/cli/backend/index.md", "reason": "Backend guidelines"}
{"file": "src/services/auth.ts", "reason": "Existing pattern"}
{"file": ".spec-first/tasks/03-24-add-login/prd.md", "reason": "Requirements"}
```

---

## SubagentStop Hook

### Purpose

Quality enforcement via Ralph Loop.

### Script: `ralph-loop.py`

**Trigger:** When Check Agent tries to stop.

**Flow:**

1. Read verify commands from `worktree.yaml`
2. Execute each command (pnpm lint, pnpm typecheck, etc.)
3. If all pass → allow stop
4. If any fail → block stop, agent continues

→ See [ralph-loop.md](./ralph-loop.md) for details.

---

## Task Lifecycle Hooks

### Purpose

Run shell commands after task lifecycle events. Works on all platforms (file-based, no hook system required).

### Configuration (config.yaml)

```yaml
hooks:
  after_create:
    - python3 .spec-first/scripts/hooks/linear_sync.py create
  after_start:
    - python3 .spec-first/scripts/hooks/linear_sync.py start
  after_finish:
    - python3 .spec-first/scripts/hooks/linear_sync.py finish
  after_archive:
    - python3 .spec-first/scripts/hooks/linear_sync.py archive
```

### Events

| Event | Trigger | Example Use Case |
|-------|---------|------------------|
| `after_create` | `task.py create` | Create Linear/Jira issue |
| `after_start` | `task.py start` | Update issue to "In Progress" |
| `after_finish` | `task.py finish` | Mark issue complete |
| `after_archive` | `task.py archive` | Close external issue |

### Environment Variable

| Variable | Description |
|----------|-------------|
| `TASK_JSON_PATH` | Absolute path to the task's `task.json` file |

### Built-in: Linear Sync Hook

Ships with `hooks/linear_sync.py` that syncs task events to Linear via the `linearis` CLI tool.

---

## Codex SessionStart Hook

Codex has its own optional SessionStart hook at `.codex/hooks/session-start.py` configured via `.codex/hooks.json`.

**Requires**: `codex_hooks = true` in `~/.codex/config.toml`

**Injects**: Same spec-first context as the Claude Code hook (workflow, guidelines, task status).

---

## Hook Scripts Location

```
.claude/hooks/                          # Claude Code platform hooks
├── session-start.py                    # SessionStart handler
├── inject-subagent-context.py          # PreToolUse:Agent/Task handler
└── ralph-loop.py                       # SubagentStop:check handler

.spec-first/scripts/hooks/                 # Task lifecycle hooks (all platforms)
└── linear_sync.py                      # Linear issue sync

.codex/hooks/                           # Codex platform hooks (optional)
├── session-start.py                    # Codex SessionStart handler
└── hooks.json                          # Codex hook configuration
```

---

## Environment Variables

Available in platform hook scripts:

| Variable             | Description                                 |
| -------------------- | ------------------------------------------- |
| `CLAUDE_PROJECT_DIR` | Project root directory                      |
| `HOOK_EVENT`         | Event type (SessionStart, PreToolUse, etc.) |
| `TOOL_NAME`          | Tool being called (for PreToolUse)          |
| `TOOL_INPUT`         | JSON string of tool input                   |
| `SUBAGENT_TYPE`      | Agent type (for SubagentStop)               |

---

## Hook Response Format

### Continue (allow operation)

```json
{
  "result": "continue",
  "message": "Optional message to inject"
}
```

### Continue with modified input

```json
{
  "result": "continue",
  "updatedInput": {
    "prompt": "Modified prompt..."
  }
}
```

### Block (prevent operation)

```json
{
  "result": "block",
  "message": "Reason for blocking"
}
```

---

## Debugging Hooks

### View hook output

```bash
# Check if hooks are configured
cat .claude/settings.json | grep -A 20 '"hooks"'

# Test session-start manually
python3 .claude/hooks/session-start.py

# Test inject-context (needs TOOL_INPUT env var)
TOOL_INPUT='{"subagent_type":"implement","prompt":"test"}' \
  python3 .claude/hooks/inject-subagent-context.py
```

### Common Issues

| Issue               | Cause                        | Solution                            |
| ------------------- | ---------------------------- | ----------------------------------- |
| Hook not running    | Wrong matcher                | Check settings.json (both Task+Agent) |
| Timeout             | Script too slow              | Increase timeout or optimize        |
| No context injected | Missing .current-task        | Run `task.py start`                 |
| JSONL not found     | Wrong task directory         | Check .current-task path            |
| Import warnings     | IDE Pyright/Pylance          | `# type: ignore[import-not-found]` added |
