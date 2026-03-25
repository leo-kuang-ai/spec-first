# Configuration Reference

Complete reference for `.spec-first/config.yaml`.

---

## Overview

`config.yaml` is the project-level configuration file for spec-first. All values have sensible hardcoded defaults — if the file is missing or a key is absent, the default is used.

**Read by**: `common/config.py`

---

## Full Schema

```yaml
# --- Session ---
# Commit message used when auto-committing journal/index changes
session_commit_message: 'chore: record journal'

# Maximum lines per journal file before rotating to a new one
max_journal_lines: 2000

# --- Monorepo Packages ---
packages:
  <package-name>:
    path: <relative-path>          # Required. Path relative to repo root
    type: local                    # Optional. "local" (default) or "submodule"
    git: false                     # Optional. true if package has own git repo
    tags:                          # Optional. Tags for filtering (e.g., [backend, unit-test])
      - <tag>

# Default package when --package is omitted
default_package: <package-name>

# --- Update ---
update:
  skip:                            # Files/dirs to permanently exclude from `spec update`
    - <path>

# --- Task Lifecycle Hooks ---
hooks:
  after_create:                    # Shell commands run after task creation
    - <command>
  after_start:                     # Shell commands run after task start
    - <command>
  after_finish:                    # Shell commands run after task finish
    - <command>
  after_archive:                   # Shell commands run after task archive
    - <command>

# --- Session Context ---
session:
  spec_scope: active_task          # Control which packages' specs are scanned
                                   # Options: "active_task" | list of package names | null (all)
```

---

## Section Details

### Session Settings

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `session_commit_message` | string | `"chore: record journal"` | Commit message for `add_session.py` auto-commit |
| `max_journal_lines` | int | `2000` | Max lines per journal file before rotation |

### Monorepo Packages

Declares packages in a monorepo. If absent or empty, the project is treated as single-repo.

```yaml
packages:
  cli:
    path: packages/cli
    tags: [backend, unit-test]
  docs-site:
    path: docs-site
    type: submodule
    tags: [docs]
default_package: cli
```

**Package types**:

| Type | Description |
|------|-------------|
| `local` (default) | Regular directory in the repo |
| `submodule` | Git submodule — worktree agents auto-init it |

**`git: true`**: Marks packages with their own independent git repo. Session context shows branch, working directory status, and recent commits for these packages.

**Effect on spec system**: When packages are configured, specs live at `.spec-first/spec/<package>/<layer>/` instead of `.spec-first/spec/<layer>/`.

### Update Skip

Permanently exclude files or directories from `spec update`:

```yaml
update:
  skip:
    - .spec-first/spec/custom/
    - .claude/commands/spec/my-command.md
```

### Task Lifecycle Hooks

Shell commands executed after task lifecycle events. Task info is passed via the `TASK_JSON_PATH` environment variable.

```yaml
hooks:
  after_create:
    - python3 .spec-first/scripts/hooks/linear_sync.py create
  after_start:
    - python3 .spec-first/scripts/hooks/linear_sync.py start
  after_archive:
    - python3 .spec-first/scripts/hooks/linear_sync.py archive
```

**Events**:

| Event | Trigger | Use Case |
|-------|---------|----------|
| `after_create` | `task.py create` | Create external issue (Linear, Jira) |
| `after_start` | `task.py start` | Update issue status to "In Progress" |
| `after_finish` | `task.py finish` | Mark issue as "Done" |
| `after_archive` | `task.py archive` | Close external issue |

**Environment variables available to hook commands**:

| Variable | Description |
|----------|-------------|
| `TASK_JSON_PATH` | Absolute path to the task's `task.json` file |

### Session Spec Scope

Control which packages' specs are scanned during session start:

```yaml
session:
  spec_scope: active_task    # Only scan the package of the current task
```

| Value | Behavior |
|-------|----------|
| `"active_task"` | Scan only the active task's package |
| `["cli", "docs"]` | Scan only listed packages |
| `null` / absent | Scan all packages |

---

## Example: Full config.yaml

```yaml
session_commit_message: 'chore: record journal'
max_journal_lines: 2000

packages:
  cli:
    path: packages/cli
    tags: [backend, unit-test]
  docs-site:
    path: docs-site
    type: submodule
    tags: [docs]

default_package: cli

update:
  skip:
    - .spec-first/spec/custom-internal/

hooks:
  after_create:
    - python3 .spec-first/scripts/hooks/linear_sync.py create
  after_start:
    - python3 .spec-first/scripts/hooks/linear_sync.py start
  after_archive:
    - python3 .spec-first/scripts/hooks/linear_sync.py archive

session:
  spec_scope: active_task
```
