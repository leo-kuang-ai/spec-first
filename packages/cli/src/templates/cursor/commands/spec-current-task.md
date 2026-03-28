# Current Task - List and Switch Focus

Use this command when the user wants to inspect active tasks or switch the current working focus.

**Core rule**: this command only reads or updates the current task pointer. It does not create tasks, initialize context, archive work, or modify project specs.

---

## What This Command Does

### `list`

Show the active task list so the user can choose where to switch next.

### `switch <selection>`

Change the active task by updating the current pointer after the user picks a task from the list.

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
- "切换任务"
- "查看任务列表"

Use `list`.

When the user says:

- "switch to task A"
- "change current task"
- "go back to the bugfix task"
- "切换到任务 A"

Use `switch`.

After `list` is shown, treat the user's chosen entry as the explicit selection and switch to it.

If the requested task is already the current task, report that it is already active instead of rewriting the pointer.

---

## Workflow

### 1. List tasks

```bash
python3 ./.spec-first/scripts/current_task.py list
```

Use this to show active tasks and the current one.

### 2. Switch task from the selected entry

```bash
python3 ./.spec-first/scripts/current_task.py switch <selection>
```

Examples:

```bash
python3 ./.spec-first/scripts/current_task.py switch 1
python3 ./.spec-first/scripts/current_task.py switch .spec-first/tasks/03-25-my-task
```

If the selected entry is already the current task, stop after reporting that it is already active.

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
- `switch`
- selected task entry after listing

### Output

- For `list`: active tasks and current task
- For `switch`: confirmation of the selected task and the new current task
- Optional note if the target task should be initialized

### Side Effects

- `list`: no state change
- `switch`: writes `.spec-first/.current-task`
- selecting the current task: no state change, report already active

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

- Creating a new task through this command
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
| `python3 ./.spec-first/scripts/current_task.py list` | Show active tasks |
| `python3 ./.spec-first/scripts/current_task.py switch <selection>` | Set current task |
| `python3 ./.spec-first/scripts/task.py init-context <task> <type>` | Prepare task context |
| `python3 ./.spec-first/scripts/task.py finish` | Clear current task |

---

## Recommended Response Pattern

When switching, keep the response short and explicit:

1. Confirm the selected task
2. Show the exact command or action used
3. State the new current task
4. Mention whether `init-context` is recommended next

If the selected task is already current, say that explicitly and do not rewrite the pointer.

Example:

```text
✓ 已切换到任务: .spec-first/tasks/03-25-my-task
  路径: .spec-first/tasks/03-25-my-task
  上下文: implement.jsonl ✓ | check.jsonl ✓ | debug.jsonl ✗
  提示: 该任务上下文不完整，建议先运行 init-context
```

If context is complete:

```text
✓ 已切换到任务: .spec-first/tasks/03-25-my-task
  路径: .spec-first/tasks/03-25-my-task
  上下文: implement.jsonl ✓ | check.jsonl ✓ | debug.jsonl ✓
```
