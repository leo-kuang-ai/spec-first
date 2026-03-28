# current-task Skill

## Goal

新增一个 `current-task` skill，让用户用 skill 语义切换当前任务，只修改当前任务锚点，不改写任务内容。

## Status

✅ **COMPLETED** - 2026-03-26

## What I already know

- 当前任务切换的唯一状态源是 `.spec-first/.current-task`
- `task.py start` 会把任务目录写进去
- 后续的上下文恢复、会话注入、任务显示，都会读取这个锚点
- skill 不需要发明新的状态存储，只要切换当前任务指针即可

## Requirements

### 核心功能

1. **无参数调用**：列出活跃任务，标记当前任务，引导用户选择
2. **`current-task list`**：显式只读模式，列出任务
3. **`current-task switch`**：等同于无参数调用
4. **`current-task <task>`**：切换到目标任务（用户明确选定后）

### 输入解析

| 输入形式 | 解析结果 |
|----------|----------|
| `current-task` | 列出任务并引导选择 |
| `current-task list` | 列出任务 |
| `current-task switch` | 列出任务并引导选择 |
| `current-task <task>` | 切换到目标任务 |

### 切换行为

- 选择项 = 当前任务 → 提示"已是当前任务"
- 任务不存在 → 提示错误并退出
- task.json 缺失/不可读 → 提示错误并退出
- 任务无上下文 → 提示先 init-context，但仍执行切换
- 当前任务有未提交变更 → 轻量提醒，不阻断切换

## Acceptance Criteria

- [x] `current-task` 无参数时列出任务并引导选择
- [x] `current-task list` 正常列出任务
- [x] `current-task switch` 无参数时等同于 `current-task`
- [x] 选择 exact 任务名后，能成功切换
- [x] 选择相对路径后，能成功切换
- [x] 选择绝对路径后，能成功切换
- [x] 当前已是目标任务时，提示"已是当前任务"
- [x] 目标任务不存在时失败退出
- [x] 目标任务无上下文时输出提醒
- [x] task.json 缺失时拒绝切换
- [x] 切换后 `.current-task` 更新
- [x] 切换后 `get_context.py` 能读到新任务

## Definition of Done

- [x] Codex skill 实现 (`packages/cli/src/templates/codex/skills/current-task/SKILL.md`) - 已存在
- [x] Claude Code 命令实现 (`packages/cli/src/templates/claude/commands/spec/current-task.md`) - ✅ 新增
- [x] Cursor 命令实现 (`packages/cli/src/templates/cursor/commands/spec-current-task.md`) - ✅ 新增
- [x] iFlow 命令实现 (`packages/cli/src/templates/iflow/commands/spec/current-task.md`) - ✅ 新增
- [x] Lint / typecheck 通过

## Out of Scope

- 新建任务（使用 `task create`）
- 自动写 PRD
- 自动生成 `implement.jsonl` / `check.jsonl` / `debug.jsonl`
- 自动归档旧任务
- 自动修改 `spec/`
- 模糊匹配任务名

## Technical Approach

### 推荐方案：方案 B + 轻量提示

1. skill 默认只负责"列出任务并让用户选"
2. 用户明确选择后，调用 `task.py start <exact-task>`
3. 如果目标任务上下文不完整，skill 只提示，不自动改写

### 实现位置

- **Codex**: `packages/cli/src/templates/codex/skills/current-task/SKILL.md` (已存在)
- **Claude Code**: `packages/cli/src/templates/claude/commands/spec/current-task.md` (新增)
- **Cursor**: `packages/cli/src/templates/cursor/commands/spec-current-task.md` (新增)
- **iFlow**: `packages/cli/src/templates/iflow/commands/spec/current-task.md` (新增)

## Technical Notes

- 参考文档: `/Users/kuang/xiaobu/spec-first/docs/01-需求分析/任务切换/技术方案.md`
- 核心依赖: `python3 ./.spec-first/scripts/task.py list` 和 `task.py start <task>`
- 状态锚点: `.spec-first/.current-task`

## Implementation Summary

为 Claude Code、Cursor 和 iFlow 平台创建了 `current-task` 命令，复用 Codex 已有的 skill 实现。

新增文件：
1. `packages/cli/src/templates/claude/commands/spec/current-task.md`
2. `packages/cli/src/templates/cursor/commands/spec-current-task.md`
3. `packages/cli/src/templates/iflow/commands/spec/current-task.md`

所有命令都遵循技术方案中的设计：
- 列出任务并引导选择
- 用户明确选择后执行切换
- 检查上下文完整性并提示
