# Multi-Session Reference

Documentation for parallel isolated sessions using Git worktrees.

---

## Overview

Multi-Session enables **parallel, isolated development sessions** using Git worktrees. Each session runs in its own directory with its own branch.

**Key Distinction**:

- **Multi-Agent** = Multiple agents in current directory (dispatch → implement → check)
- **Multi-Session** = Parallel sessions in separate worktrees (this document)

---

## When to Use Multi-Session

| Scenario                                        | Use Multi-Session?   |
| ----------------------------------------------- | -------------------- |
| Normal task in current branch                   | No - use Multi-Agent |
| Long-running task, want to work on other things | Yes                  |
| Multiple independent tasks in parallel          | Yes                  |
| Task needs clean isolated environment           | Yes                  |
| Quick fix or small change                       | No                   |

---

## Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         MAIN REPOSITORY                                     │
│                         (your current directory)                            │
│                                                                             │
│  /spec:parallel → Configure task → start.py                             │
│                                           │                                 │
│                                           │ Creates worktree               │
│                                           │ Starts agent                   │
│                                           ▼                                 │
└───────────────────────────────────────────┼─────────────────────────────────┘
                                            │
              ┌─────────────────────────────┼─────────────────────────────────┐
              │                             │                                 │
              ▼                             ▼                                 ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│ WORKTREE 1           │  │ WORKTREE 2           │  │ WORKTREE 3           │
│ feature/add-login    │  │ feature/user-profile │  │ fix/api-bug          │
│                      │  │                      │  │                      │
│ ┌──────────────────┐ │  │ ┌──────────────────┐ │  │ ┌──────────────────┐ │
│ │ Dispatch Agent   │ │  │ │ Dispatch Agent   │ │  │ │ Dispatch Agent   │ │
│ │       ↓          │ │  │ │       ↓          │ │  │ │       ↓          │ │
│ │ Implement Agent  │ │  │ │ Implement Agent  │ │  │ │ Implement Agent  │ │
│ │       ↓          │ │  │ │       ↓          │ │  │ │       ↓          │ │
│ │ Check Agent      │ │  │ │ Check Agent      │ │  │ │ Check Agent      │ │
│ │       ↓          │ │  │ │       ↓          │ │  │ │       ↓          │ │
│ │ create_pr.py     │ │  │ │ create_pr.py     │ │  │ │ create_pr.py     │ │
│ └──────────────────┘ │  │ └──────────────────┘ │  │ └──────────────────┘ │
│                      │  │                      │  │                      │
│ Session: abc123      │  │ Session: def456      │  │ Session: ghi789      │
│ PID: 12345           │  │ PID: 12346           │  │ PID: 12347           │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘

Location: ../worktrees/  (default)
```

---

## Git Worktree

### What is a Worktree?

Git worktrees allow multiple working directories from one repository:

```
/project/                              # Main repo (main branch)
/project/../worktrees/                 # Default: ../worktrees
├── feature/add-login/                # Worktree 1 (own branch)
├── feature/user-profile/             # Worktree 2 (own branch)
└── fix/api-bug/                      # Worktree 3 (own branch)
```

### Benefits

| Benefit                 | Description                         |
| ----------------------- | ----------------------------------- |
| **True isolation**      | Separate filesystem per session     |
| **Own branch**          | Each worktree on its own branch     |
| **Parallel execution**  | Multiple agents work simultaneously |
| **Clean state**         | Start fresh, no interference        |
| **Session persistence** | Each has `.session-id` for resume   |
| **Easy cleanup**        | Remove worktree = remove everything |

---

## Configuration

### worktree.yaml

Location: `.spec-first/worktree.yaml`

```yaml
# Where worktrees are created (relative to project)
# Default: ../worktrees
worktree_dir: ../worktrees

# Files to copy to each worktree (default: [])
copy:
  - .spec-first/.developer # Developer identity
  - .env # Environment variables
  - .env.local # Local overrides

# Commands after worktree creation (default: [])
post_create:
  - npm install # Install dependencies
  # - pnpm install --frozen-lockfile

# Verification commands for Ralph Loop (default: [])
verify:
  - pnpm lint
  - pnpm typecheck
```

### Task Configuration

Each session needs a configured task:

```json
// task.json
{
  "branch": "feature/add-login", // Required for worktree
  "base_branch": "main",
  "worktree_path": null, // Set by start.py
  "current_phase": 0,
  "next_action": [
    { "phase": 1, "action": "implement" },
    { "phase": 2, "action": "check" },
    { "phase": 3, "action": "finish" },
    { "phase": 4, "action": "create-pr" }
  ]
}
```

---

## Scripts

### start.py - Start Session

Creates worktree and starts agent.

```bash
python3 .spec-first/scripts/multi_agent/start.py <task-dir>
```

**Actions**:

1. Read `task.json` for branch name
2. Create git worktree:
   ```bash
   git worktree add -b <branch> ../spec-worktrees/<branch>
   ```
3. Copy files from `worktree.yaml` copy list
4. Copy task directory to worktree
5. Run `post_create` hooks
6. Set `.spec-first/.current-task` in worktree
7. Start Claude Dispatch Agent:
   ```bash
   claude -p --agent dispatch \
     --session-id <uuid> \
     --dangerously-skip-permissions \
     --output-format stream-json \
     --verbose "Start the pipeline"
   ```
8. Register to `registry.json`

**Example**:

```bash
python3 .spec-first/scripts/multi_agent/start.py .spec-first/tasks/01-31-add-login-taosu
# Output: Started agent in ../spec-worktrees/feature/add-login
```

---

### status.py - Monitor Sessions

Check all running sessions.

```bash
# Overview
python3 .spec-first/scripts/multi_agent/status.py

# Detailed view
python3 .spec-first/scripts/multi_agent/status.py --detail <task-name>

# Watch mode
python3 .spec-first/scripts/multi_agent/status.py --watch <task-name>

# View logs
python3 .spec-first/scripts/multi_agent/status.py --log <task-name>

# Show registry
python3 .spec-first/scripts/multi_agent/status.py --registry
```

**Output**:

```
Active Sessions:
┌──────────────┬──────────┬────────────────┬──────────┬───────────┐
│ Task         │ Status   │ Phase          │ Elapsed  │ Files     │
├──────────────┼──────────┼────────────────┼──────────┼───────────┤
│ add-login    │ Running  │ 2/4 (check)    │ 15m 32s  │ 5 changed │
│ fix-api      │ Stopped  │ 1/4 (implement)│ 8m 15s   │ 2 changed │
└──────────────┴──────────┴────────────────┴──────────┴───────────┘

Resume stopped sessions:
  cd ../spec-worktrees/feature/fix-api && claude --resume <session-id>
```

---

### create_pr.py - Create PR

Creates PR from worktree changes.

```bash
python3 .spec-first/scripts/multi_agent/create_pr.py [--dry-run]
```

**Actions**:

1. Stage changes: `git add -A`
2. Exclude: `git reset .spec-first/workspace/`
3. Commit: `feat(<scope>): <task-name>`
4. Push to remote
5. Create Draft PR: `gh pr create --draft`
6. Update task.json: `status: "completed"`, `pr_url`

---

### cleanup.py - Remove Worktrees

Clean up after completion.

```bash
# Specific worktree
python3 .spec-first/scripts/multi_agent/cleanup.py <branch-name>

# All merged worktrees
python3 .spec-first/scripts/multi_agent/cleanup.py --merged

# All worktrees (with confirmation)
python3 .spec-first/scripts/multi_agent/cleanup.py --all
```

**Actions**:

1. Archive task to `.spec-first/tasks/archive/YYYY-MM/`
2. Remove from registry
3. Remove worktree: `git worktree remove <path>`
4. Optionally delete branch

---

### plan.py - Auto-Configure Task

Launches Plan Agent to create task configuration.

```bash
python3 .spec-first/scripts/multi_agent/plan.py \
  --name <task-slug> \
  --type <backend|frontend|fullstack> \
  --requirement "<description>"
```

**Plan Agent**:

1. Evaluates requirements (can REJECT)
2. Calls Research Agent
3. Creates `prd.md`
4. Configures `task.json`
5. Initializes JSONL files

---

## Session Registry

Tracks all running sessions.

**Location**: `.spec-first/workspace/<developer>/.agents/registry.json`

```json
{
  "agents": [
    {
      "id": "feature-add-login",
      "worktree_path": "/abs/path/to/spec-worktrees/feature/add-login",
      "pid": 12345,
      "started_at": "2026-01-31T10:30:00",
      "task_dir": ".spec-first/tasks/01-31-add-login-taosu"
    }
  ]
}
```

**API** (`common/registry.py`):

```python
registry_add_agent(agent_id, worktree_path, pid, task_dir)
registry_remove_by_id(agent_id)
registry_remove_by_worktree(worktree_path)
registry_search_agent(pattern)
registry_list_agents()
```

---

## Complete Workflow

### 1. Configure Task

```bash
# Create task
python3 .spec-first/scripts/task.py create "Add login" --slug add-login

# Configure
python3 .spec-first/scripts/task.py init-context <task-dir> fullstack
python3 .spec-first/scripts/task.py set-branch <task-dir> feature/add-login

# Write prd.md
# ...
```

### 2. Start Session

```bash
python3 .spec-first/scripts/multi_agent/start.py <task-dir>
```

### 3. Monitor

```bash
python3 .spec-first/scripts/multi_agent/status.py --watch add-login
```

### 4. After Completion

```bash
# PR auto-created
# Review on GitHub, merge

# Cleanup
python3 .spec-first/scripts/multi_agent/cleanup.py feature/add-login
```

---

## Parallel Execution

Start multiple sessions:

```bash
# Session 1
python3 .spec-first/scripts/multi_agent/start.py .spec-first/tasks/01-31-add-login

# Session 2 (immediately)
python3 .spec-first/scripts/multi_agent/start.py .spec-first/tasks/01-31-fix-api

# Session 3
python3 .spec-first/scripts/multi_agent/start.py .spec-first/tasks/01-31-update-docs

# Monitor all
python3 .spec-first/scripts/multi_agent/status.py
```

Each runs independently:

- Own worktree
- Own branch
- Own Claude process
- Own registry entry

---

## Resuming Sessions

If a session stops:

```bash
# Find session info
python3 .spec-first/scripts/multi_agent/status.py --detail <task-name>

# Resume
cd ../spec-worktrees/feature/task-name
claude --resume <session-id>
```

---

## Ralph Loop

Quality enforcement for Check Agent in sessions.

**Mechanism**:

1. Check Agent completes
2. SubagentStop hook fires
3. `ralph-loop.py` runs verify commands
4. All pass → allow stop
5. Any fail → block, continue agent

**Constants**:

| Constant                | Value | Description             |
| ----------------------- | ----- | ----------------------- |
| `MAX_ITERATIONS`        | 5     | Maximum loop iterations |
| `STATE_TIMEOUT_MINUTES` | 30    | State timeout           |
| Command timeout         | 120s  | Per verify command      |

**Configuration** (`worktree.yaml`):

```yaml
verify:
  - pnpm lint
  - pnpm typecheck
```

**State** (`.spec-first/.ralph-state.json`):

```json
{
  "task": ".spec-first/tasks/01-31-add-login",
  "iteration": 2,
  "started_at": "2026-01-31T10:30:00"
}
```

**Limits**: Max 5 iterations (`MAX_ITERATIONS`), 30min timeout (`STATE_TIMEOUT_MINUTES`), 120s per command

---

## Troubleshooting

### Session Not Starting

1. Check `worktree.yaml` exists
2. Verify branch name doesn't exist
3. Check `post_create` hooks
4. Look at start.py output

### Session Stuck

1. Check Ralph Loop iteration (max 5)
2. Verify `verify` commands
3. Manually run verify commands
4. Check `.spec-first/.ralph-state.json`

### Worktree Issues

```bash
# Force remove
git worktree remove --force <path>

# Prune stale
git worktree prune

# List all
git worktree list
```

### Registry Out of Sync

```bash
# View
python3 .spec-first/scripts/multi_agent/status.py --registry

# Manual edit
vim .spec-first/workspace/<dev>/.agents/registry.json
```
