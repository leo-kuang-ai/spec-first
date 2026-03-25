# Task System

Track work items with phase-based execution, parent-child subtasks, and lifecycle hooks.

---

## Directory Structure

```
.spec-first/tasks/
├── {MM-DD-slug}/                  # Active task directories
│   ├── task.json                  # Metadata, phases, branch, subtasks
│   ├── prd.md                     # Requirements document
│   ├── info.md                    # Technical design (optional)
│   ├── implement.jsonl            # Context for implement phase
│   ├── check.jsonl                # Context for check phase
│   ├── debug.jsonl                # Context for debug phase
│   ├── research.jsonl             # Context for research phase (optional)
│   └── cr.jsonl                   # Context for code review (optional)
│
└── archive/                       # Completed tasks
    └── {YYYY-MM}/
        └── {task-dir}/
```

---

## Task Directory Naming

Format: `{MM-DD}-{slug}`

Examples:

- `03-24-add-login`
- `03-10-fix-api-bug`

---

## task.json

Task metadata and workflow configuration.

```json
{
  "id": "03-24-add-login",
  "name": "Add user login",
  "title": "Add user login",
  "description": "Implement email/password authentication",
  "status": "planning",
  "dev_type": "fullstack",
  "scope": "auth",
  "package": "cli",
  "priority": "P1",
  "creator": "taosu",
  "assignee": "taosu",
  "createdAt": "2026-03-24T10:30:00",
  "completedAt": null,
  "branch": "feature/add-login",
  "base_branch": "main",
  "worktree_path": null,
  "current_phase": 1,
  "next_action": [
    { "phase": 1, "action": "implement" },
    { "phase": 2, "action": "check" },
    { "phase": 3, "action": "finish" }
  ],
  "commit": null,
  "pr_url": null,
  "children": [],
  "parent": null,
  "subtasks": [],
  "relatedFiles": [],
  "notes": "",
  "meta": {}
}
```

### Fields

| Field           | Type           | Description                                    |
| --------------- | -------------- | ---------------------------------------------- |
| `id`            | string         | Task identifier                                |
| `name`          | string         | Human-readable task name                       |
| `title`         | string         | Task title                                     |
| `description`   | string         | Task description                               |
| `status`        | string         | `planning`, `in_progress`, `review`, `completed` |
| `dev_type`      | string         | `frontend`, `backend`, `fullstack`, `test`, `docs` |
| `scope`         | string \| null | Scope for PR title                             |
| `package`       | string \| null | Package name (monorepo)                        |
| `priority`      | string         | `P0`, `P1`, `P2`, `P3`                        |
| `creator`       | string         | Developer who created the task                 |
| `assignee`      | string         | Assigned developer                             |
| `createdAt`     | ISO date       | Creation timestamp                             |
| `completedAt`   | ISO date\|null | Completion timestamp                           |
| `branch`        | string \| null | Git branch name                                |
| `base_branch`   | string \| null | Branch to merge into (PR target)               |
| `worktree_path` | string \| null | Worktree path (multi-session)                  |
| `current_phase` | number         | Current workflow phase                         |
| `next_action`   | array          | Workflow phases                                |
| `commit`        | string \| null | Commit hash                                    |
| `pr_url`        | string \| null | Pull request URL                               |
| `children`      | array          | Child task directory names (subtasks)          |
| `parent`        | string \| null | Parent task directory name                     |
| `subtasks`      | array          | Subtask list (legacy)                          |
| `relatedFiles`  | array          | Related file paths                             |
| `notes`         | string         | Free-form notes                                |
| `meta`          | dict           | Metadata dictionary (extensible)               |

---

## prd.md

Requirements document for the task.

```markdown
# Add User Login

## Goal
Implement user authentication with email/password.

## Requirements
- Login form with email and password fields
- Form validation
- API endpoint for authentication

## Acceptance Criteria
- [ ] User can log in with valid credentials
- [ ] Error shown for invalid credentials

## Technical Notes
- Use existing auth service pattern
```

---

## JSONL Context Files

List files to inject as context for each agent phase.

### Format

```jsonl
{"file": ".spec-first/spec/backend/index.md", "reason": "Backend guidelines"}
{"file": "src/services/auth.ts", "reason": "Existing pattern"}
{"file": ".spec-first/tasks/03-24-add-login/prd.md", "reason": "Requirements"}
```

### Files

| File              | Phase     | Purpose                        |
| ----------------- | --------- | ------------------------------ |
| `implement.jsonl` | implement | Dev specs, patterns to follow  |
| `check.jsonl`     | check     | Quality criteria, review specs |
| `debug.jsonl`     | debug     | Debug context, error reports   |
| `research.jsonl`  | research  | Codebase analysis context      |
| `cr.jsonl`        | code review | Code review criteria          |

---

## Subtasks

Tasks can have parent-child relationships for decomposing complex work.

### Create Subtask

```bash
# Option 1: Create with --parent flag
python3 .spec-first/scripts/task.py create "Login API" --parent .spec-first/tasks/03-24-add-login

# Option 2: Link existing tasks
python3 .spec-first/scripts/task.py add-subtask <parent-dir> <child-dir>
```

### Behavior

- Parent's `children` array contains child directory names
- Child's `parent` field points to parent directory name
- `task.py list` shows subtask hierarchy
- Unlinking: `task.py remove-subtask <parent-dir> <child-dir>`

---

## Task Lifecycle Hooks

Shell commands that run automatically after task lifecycle events.

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

| Event | Trigger | Use Case |
|-------|---------|----------|
| `after_create` | `task.py create` completes | Create issue in Linear/Jira |
| `after_start` | `task.py start` completes | Update issue status |
| `after_finish` | `task.py finish` completes | Mark issue done |
| `after_archive` | `task.py archive` completes | Close external issue |

### Environment

Hook commands receive `TASK_JSON_PATH` — the absolute path to the task's `task.json`.

### Built-in Hook: Linear Sync

Ships with `hooks/linear_sync.py` that syncs task events to Linear via the `linearis` CLI tool.

---

## Current Task Pointer

### `.spec-first/.current-task`

Points to active task directory.

```
.spec-first/tasks/03-24-add-login
```

### Set Current Task

```bash
python3 .spec-first/scripts/task.py start <task-dir>
```

### Clear Current Task

```bash
python3 .spec-first/scripts/task.py finish
```

---

## Task CLI (16 Subcommands)

| Subcommand | Description |
|------------|-------------|
| `create` | Create new task (with --slug, --assignee, --priority, --parent, --package) |
| `init-context` | Initialize JSONL files (backend/frontend/fullstack/test/docs) |
| `add-context` | Add entry to JSONL (implement/check/debug) |
| `validate` | Validate JSONL files |
| `list-context` | List JSONL entries |
| `start` | Set as current task |
| `finish` | Clear current task |
| `set-branch` | Set git branch |
| `set-base-branch` | Set PR target branch |
| `set-scope` | Set scope for PR title |
| `create-pr` | Create PR from task |
| `archive` | Archive completed task (--no-commit to skip auto-commit) |
| `add-subtask` | Link child task to parent |
| `remove-subtask` | Unlink child from parent |
| `list` | List active tasks (--mine, --status filters) |
| `list-archive` | List archived tasks (optional YYYY-MM filter) |

---

## Workflow Phases

Standard phase progression:

```
1. implement  →  Write code
2. check      →  Review and fix
3. finish     →  Final verification
4. create-pr  →  Create pull request (Multi-Session only)
```

### Custom Phases

Modify `next_action` in task.json:

```json
"next_action": [
  {"phase": 1, "action": "research"},
  {"phase": 2, "action": "implement"},
  {"phase": 3, "action": "check"}
]
```

---

## Best Practices

1. **One task at a time** - Use `.current-task` to track focus
2. **Clear PRDs** - Write specific, testable requirements
3. **Relevant context** - Only include needed files in JSONL
4. **Archive completed** - Keep task directory clean
5. **Use subtasks** - Decompose complex work into trackable units
6. **Configure lifecycle hooks** - Integrate with external issue trackers
