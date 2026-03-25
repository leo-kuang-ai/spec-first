---
name: current-task
description: "Lists active tasks and switches the current task pointer in .spec-first/.current-task. Use when the user wants to see available tasks, change focus to another existing task, or resume a task without creating new task data."
---

# Current Task - List and Switch Focus

Use this skill when the user wants to inspect active tasks or switch the current working focus.

**Core rule**: this skill only reads or updates the current task pointer. It does not create tasks, initialize context, archive work, or modify project specs.

---

## What This Skill Does

### `list`

Show the active task list so the user can choose where to switch next.

### `switch <task>`

Change the active task by updating:

```text
.spec-first/.current-task
```

If the target task is new or missing context files, mention that `task init-context` may be needed after switching.

---

## User Guidance

When the user says:

- "list tasks"
- "show current tasks"
- "what tasks are available"

Use `list`.

When the user says:

- "switch to task A"
- "change current task"
- "go back to the bugfix task"

Use `switch`.

If the user gives only a task name or path, treat it as `switch` by default.

---

## Workflow

### 1. List tasks

```bash
python3 ./.spec-first/scripts/task.py list
```

Use this to show active tasks and the current one.

### 2. Switch task

```bash
python3 ./.spec-first/scripts/task.py start <task-dir-or-name>
```

Examples:

```bash
python3 ./.spec-first/scripts/task.py start my-task
python3 ./.spec-first/scripts/task.py start .spec-first/tasks/03-25-my-task
```

### 3. Optional follow-up

If the target task has no context yet, suggest:

```bash
python3 ./.spec-first/scripts/task.py init-context <task-dir> <dev_type>
```

Do not run it automatically unless the user explicitly asks.

---

## Behavior Contract

### Input

- `list`
- `switch <task>`
- bare task name or task path

### Output

- For `list`: active tasks and current task
- For `switch`: confirmation of the new current task
- Optional note if the target task should be initialized

### Side Effects

- `list`: no state change
- `switch`: writes `.spec-first/.current-task`

### No Side Effects

- Does not modify `task.json`
- Does not modify `prd.md`
- Does not modify `implement.jsonl`
- Does not modify `check.jsonl`
- Does not modify `debug.jsonl`
- Does not modify `spec/`

---

## Good Cases

- The user wants to compare tasks before choosing one
- The user wants to resume an existing task
- The user wants to move focus without reinitializing the repo

## Bad Cases

- Creating a new task through this skill
- Auto-running `init-context` without asking
- Archiving the previous task automatically
- Editing task metadata as part of switching

---

## Common Mistakes

### Mistake: Confusing list and switch

`list` is read-only. `switch` changes the active task.

### Mistake: Treating task switching as task creation

Switching only changes the current pointer. It does not create a task.

### Mistake: Assuming all context exists after switch

If the target task has no `init-context` files yet, switching alone may not provide full execution context.

---

## Command Reference

| Command | Purpose |
|---------|---------|
| `python3 ./.spec-first/scripts/task.py list` | Show active tasks |
| `python3 ./.spec-first/scripts/task.py start <task>` | Set current task |
| `python3 ./.spec-first/scripts/task.py init-context <task> <type>` | Prepare task context |
| `python3 ./.spec-first/scripts/task.py finish` | Clear current task |

---

## Recommended Response Pattern

When switching, keep the response short and explicit:

1. Confirm the target task
2. Show the exact command or action used
3. State the new current task
4. Mention whether `init-context` is recommended next

Example:

```text
Current task switched to: .spec-first/tasks/03-25-my-task
If this task is new, run init-context next for full context.
```
