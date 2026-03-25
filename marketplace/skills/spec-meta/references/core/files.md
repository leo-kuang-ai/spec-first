# spec-first File Reference

Complete reference of all files in the `.spec-first/` directory.

---

## Directory Structure

```
.spec-first/
├── .developer              # Developer identity (gitignored)
├── .current-task           # Active task pointer (gitignored)
├── .ralph-state.json       # Ralph Loop state (gitignored)
├── .template-hashes.json   # Template version tracking
├── .version                # Installed spec-first version
├── .gitignore              # Git ignore rules
├── workflow.md             # Main workflow documentation
├── config.yaml             # Project-level configuration (packages, hooks, etc.)
├── worktree.yaml           # Multi-session configuration
│
├── workspace/              # Developer workspaces
├── tasks/                  # Task tracking (with subtask support)
├── spec/                   # Coding guidelines (monorepo: per-package)
└── scripts/                # Automation scripts
    ├── common/             # Shared utilities (19 modules)
    ├── hooks/              # Task lifecycle hook scripts
    └── multi_agent/        # Multi-agent pipeline scripts
```

---

## Root Files

### `.developer`

**Purpose**: Store current developer identity.

**Created by**: `init_developer.py`

**Format**: Plain text, single line with developer name.

```
taosu
```

**Gitignored**: Yes - each machine has its own identity.

---

### `.current-task`

**Purpose**: Point to the active task directory.

**Created by**: `task.py start <task-dir>`

**Format**: Plain text, relative path to task directory.

```
.spec-first/tasks/01-31-add-login-taosu
```

**Gitignored**: Yes - each developer works on different tasks.

**Used by**:

- Hooks read this to find task context
- Scripts use this for current task operations

---

### `.ralph-state.json`

**Purpose**: Track Ralph Loop iteration state.

**Created by**: `ralph-loop.py` (Claude Code only)

**Format**: JSON

```json
{
  "task": ".spec-first/tasks/01-31-add-login",
  "iteration": 2,
  "started_at": "2026-01-31T10:30:00"
}
```

**Gitignored**: Yes - runtime state.

**Fields**:

| Field        | Type     | Description             |
| ------------ | -------- | ----------------------- |
| `task`       | string   | Task directory path     |
| `iteration`  | number   | Current iteration (1-5) |
| `started_at` | ISO date | When loop started       |

---

### `.template-hashes.json`

**Purpose**: Track template file versions for `spec update`.

**Created by**: `spec init` or `spec update`

**Format**: JSON object mapping file paths to SHA-256 hashes.

```json
{
  ".spec-first/workflow.md": "028891d1fe839a266...",
  ".claude/hooks/session-start.py": "0a9899e80f6bfe15...",
  ".claude/commands/start.md": "d1276dcbff880299..."
}
```

**Used by**:

- `spec update` - Detect which files have been modified
- Determines if files can be auto-updated or need conflict resolution

**Behavior**:

- File hash matches template → Safe to update
- File hash differs → User modified, needs manual merge

---

### `.version`

**Purpose**: Track installed spec-first CLI version.

**Created by**: `spec init` or `spec update`

**Format**: Plain text, semver version string.

```
0.4.0-beta.8
```

**Used by**:

- `spec update` - Determine if update is needed
- Version mismatch detection

---

### `.gitignore`

**Purpose**: Define which files to exclude from git.

**Default content**:

```gitignore
# Developer identity (local only)
.developer

# Current task pointer
.current-task

# Ralph Loop state
.ralph-state.json

# Agent runtime files
.agents/
.agent-log
.agent-runner.sh
.session-id

# Task directory runtime files
.plan-log

# Atomic update temp files
*.tmp
.backup-*
*.new

# Python cache
**/__pycache__/
**/*.pyc
```

---

### `workflow.md`

**Purpose**: Main workflow documentation for developers and AI.

**Created by**: `spec init`

**Content sections**:

1. Quick Start guide
2. Workflow overview
3. Session start process
4. Development process
5. Session end
6. File descriptions
7. Best practices

**Injected by**: `session-start.py` hook (Claude Code)

**For Cursor**: Read manually at session start.

---

### `config.yaml`

**Purpose**: Project-level spec-first configuration.

**Created by**: `spec init`

**Format**: YAML

```yaml
# Session settings
session_commit_message: 'chore: record journal'
max_journal_lines: 2000

# Monorepo packages
packages:
  cli:
    path: packages/cli
    tags: [backend, unit-test]
  docs-site:
    path: docs-site
    type: submodule
    tags: [docs]
default_package: cli

# Update exclusions
update:
  skip:
    - .spec-first/spec/custom/

# Task lifecycle hooks
hooks:
  after_create:
    - python3 .spec-first/scripts/hooks/linear_sync.py create
  after_start:
    - python3 .spec-first/scripts/hooks/linear_sync.py start
  after_archive:
    - python3 .spec-first/scripts/hooks/linear_sync.py archive

# Session context scope
session:
  spec_scope: active_task
```

**Used by**: `common/config.py`

**Behavior**: All values have sensible hardcoded defaults. If config.yaml is missing or a key is absent, the default is used.

→ See `core/config.md` for full schema reference.

---

### `worktree.yaml`

**Purpose**: Configure Multi-Session and Ralph Loop.

**Created by**: `spec init`

**Format**: YAML

```yaml
worktree_dir: ../worktrees
copy:
  - .spec-first/.developer
  - .env
post_create:
  - npm install
verify:
  - pnpm lint
  - pnpm typecheck
```

→ See `claude-code/worktree-config.md` for details.

---

## Runtime Files (Gitignored)

### `.agents/`

**Purpose**: Agent registry for Multi-Session.

**Location**: `.spec-first/workspace/{developer}/.agents/`

**Content**: `registry.json` tracking running agents.

---

### `.session-id`

**Purpose**: Store Claude Code session ID for resume.

**Created by**: Multi-Session `start.py`

**Format**: UUID string.

---

### `.agent-log`

**Purpose**: Agent execution log.

**Created by**: Multi-Session scripts.

---

### `.plan-log`

**Purpose**: Plan Agent execution log.

**Location**: Task directory.

---

## Directories

### `workspace/`

Developer workspaces with journals and indexes.

→ See `core/workspace.md`

### `tasks/`

Task directories with PRDs and context files.

→ See `core/tasks.md`

### `spec/`

Coding guidelines and specifications.

→ See `core/specs.md`

### `scripts/`

Automation scripts.

→ See `core/scripts.md` and `claude-code/scripts.md`

---

## Template Files

These files are managed by `spec update`:

| File                            | Purpose                    |
| ------------------------------- | -------------------------- |
| `.spec-first/workflow.md`          | Workflow documentation     |
| `.spec-first/config.yaml`         | Project-level config       |
| `.spec-first/worktree.yaml`       | Multi-session config       |
| `.spec-first/.gitignore`          | Git ignore rules           |
| `.spec-first/scripts/**/*.py`     | All Python scripts         |
| `.claude/hooks/*.py`           | Hook scripts               |
| `.claude/commands/spec/*.md` | Slash commands (17 files) |
| `.claude/agents/*.md`          | Agent definitions (6 files) |
| `.cursor/commands/*.md`        | Cursor commands            |
| `.agents/skills/*/SKILL.md`    | Shared agent skills        |
| Platform-specific dirs          | Per-platform templates     |

**Update behavior**:

1. Compare file hash with `.template-hashes.json`
2. If unchanged → Auto-update
3. If modified → Create `.new` file for manual merge
4. If user-deleted → Skip (respects intentional deletion)
5. Update hashes after successful update

**Protected paths** (never touched by update/migration):
- `.spec-first/workspace/`
- `.spec-first/spec/`
- `.spec-first/tasks/`

**Exclusions**: Files listed in `update.skip` in config.yaml are permanently excluded.

---

## File Lifecycle

### Created by `spec init`

```
.spec-first/
├── .template-hashes.json
├── .version
├── .gitignore
├── workflow.md
├── config.yaml
├── worktree.yaml
├── spec/                    # Single repo: frontend/, backend/, guides/
│   └── ...                  # Monorepo: <package>/<layer>/, guides/
└── scripts/
    ├── common/
    ├── hooks/
    └── multi_agent/
```

### Created at runtime

```
.spec-first/
├── .developer           # init_developer.py
├── .current-task        # task.py start
├── .ralph-state.json    # ralph-loop.py
├── workspace/{dev}/     # init_developer.py
│   ├── index.md
│   ├── journal-1.md
│   └── .agents/
└── tasks/{task}/        # task.py create
    ├── task.json
    ├── prd.md
    └── *.jsonl
```

### Cleaned up

```
# After task completion
.spec-first/tasks/{task}/ → .spec-first/tasks/archive/YYYY-MM/

# After worktree removal
.agents/registry.json entries removed
```
