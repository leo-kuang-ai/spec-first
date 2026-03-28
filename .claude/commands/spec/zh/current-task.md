# 当前任务 - 列出和切换焦点

当用户想要检查活动任务或切换当前工作焦点时使用此命令。

**核心规则**：此命令只读取或更新当前任务指针。它不创建任务、初始化上下文、归档工作或修改项目规范。

---

## 执行协议

**当此技能被调用时：**

1. **执行** `python3 ./.spec-first/scripts/current_task.py list --json`
2. **解析 JSON 输出**并在响应中格式化为表格
3. **显示表格**并遵循以下规则：
   - 使用 markdown 表格格式（自动宽度，不截断）
   - 列：（空用于箭头）、#、Task、Description、Status、Pri
   - 在第一列用 → 标记当前任务
   - 不要截断描述 - 让它们自然换行
   - 在表格后添加 "Total: N active task(s)" 和 "→ = Current Task"
4. **表格后**，询问："你想切换到不同的任务吗？"

---

## 此命令做什么

### `list`

获取活动任务列表作为 JSON，然后在提示响应中格式化表格。表格包括：
- 任务编号（便于选择）
- 任务名称
- 描述（来自 task.json）
- 状态（in_progress、planning、completed 等）
- 优先级（P1、P2 等）

当需要原始文本列表时使用普通的 `list`。

### `switch <selection>`

在用户从列表中选择任务后，通过更新当前指针更改活动任务。

```text
.spec-first/.current-task
```

如果目标任务是新的或缺少上下文文件，提到切换后可能需要 `task init-context`。

---

## 用户指南

当用户说：

- "list tasks"
- "show current tasks"
- "what tasks are available"
- "切换任务"
- "查看任务列表"

使用 `list`。

当用户说：

- "switch to task A"
- "change current task"
- "go back to the bugfix task"
- "切换到任务 A"

使用 `switch`。

显示 `list` 后，将用户选择的条目视为明确选择并切换到它。

如果请求的任务已经是当前任务，报告它已经活动而不是重写指针。

---

## 工作流

### 1. List tasks

```bash
python3 ./.spec-first/scripts/current_task.py list --json
```

解析 JSON 输出并在响应中渲染表格。不要向用户打印原始 JSON。

显示表格后，只需询问用户是否想切换到不同的任务或需要帮助处理当前任务。

期望的表格格式：

```
┌─ Active Tasks Overview

#    Task                           Description                         Status       Pri
──────────────────────────────────────────────────────────────────────────────────────────
★ 1   00-bootstrap-guidelines        Fill in project development gui...  in_progress  P1
  2   03-26-current-task-skill       current-task skill                  completed    P2

Total: 2 active task(s)
★ = Current Task
```

★ 符号标记当前活动任务。

使用普通的 `list` 获取原始文本输出：

```bash
python3 ./.spec-first/scripts/current_task.py list
```

### 2. Switch task from the selected entry

```bash
python3 ./.spec-first/scripts/current_task.py switch <selection>
```

示例：

```bash
python3 ./.spec-first/scripts/current_task.py switch 1
python3 ./.spec-first/scripts/current_task.py switch .spec-first/tasks/03-25-my-task
```

如果选择的条目已经是当前任务，在报告它已经活动后停止。

### 3. Optional follow-up

如果目标任务还没有上下文，建议：

```bash
python3 ./.spec-first/scripts/task.py init-context <task-dir> <dev_type>
```

除非用户明确要求，否则不要自动运行它。

---

## 行为约定

### Input

- `list`
- `switch`
- 列出后选择的任务条目

### Output

 - 对于 `list`：代理格式化的任务表格和当前任务
- 对于 `switch`：确认选定的任务和新的当前任务
- 如果目标任务应该初始化的可选说明

### Side Effects

- `list`: 无状态更改
- `switch`: 写入 `.spec-first/.current-task`
- 选择当前任务：无状态更改，报告已经活动

### No Side Effects

- 不修改 `task.json`
- 不修改 `prd.md`
- 不修改 `implement.jsonl`
- 不修改 `check.jsonl`
- 不修改 `debug.jsonl`
- 不修改 `spec/`

---

## Good Cases

- 用户想在选择之前比较任务
- 用户想恢复现有任务
- 用户想移动焦点而不重新初始化仓库

## Bad Cases

- 通过此命令创建新任务
- 不询问就自动运行 `init-context`
- 自动归档上一个任务
- 作为切换的一部分编辑任务元数据

---

## 常见错误

### 错误：混淆 list 和 switch

`list` 是只读的。`switch` 更改活动任务。

### 错误：将任务切换视为任务创建

切换只更改当前指针。它不创建任务。

### 错误：假设切换后所有上下文都存在

如果目标任务还没有 `init-context` 文件，仅切换可能无法提供完整的执行上下文。

---

## 命令参考

| Command | Purpose |
|---------|---------|
| `python3 ./.spec-first/scripts/current_task.py list --json` | 获取活动任务供代理端表格格式化 |
| `python3 ./.spec-first/scripts/current_task.py list` | 以纯文本列表格式显示活动任务 |
| `python3 ./.spec-first/scripts/current_task.py switch <selection>` | 设置当前任务 |
| `python3 ./.spec-first/scripts/task.py init-context <task> <type>` | 准备任务上下文 |
| `python3 ./.spec-first/scripts/task.py finish` | 清除当前任务 |

---

## 推荐响应模式

切换时，保持响应简短和明确：

1. 确认选定的任务
2. 显示使用的确切命令或操作
3. 说明新的当前任务
4. 提及是否建议接下来进行 `init-context`

如果选定的任务已经是当前的，明确说明不要重写指针。

示例：

```text
✓ 已切换到任务: .spec-first/tasks/03-25-my-task
  路径: .spec-first/tasks/03-25-my-task
  上下文: implement.jsonl ✓ | check.jsonl ✓ | debug.jsonl ✗
  提示: 该任务上下文不完整，建议先运行 init-context
```

如果上下文完整：

```text
✓ 已切换到任务: .spec-first/tasks/03-25-my-task
  路径: .spec-first/tasks/03-25-my-task
  上下文: implement.jsonl ✓ | check.jsonl ✓ | debug.jsonl ✓
```
