# spec-first 记忆体系分析

spec-first 的“记忆”不是模型自身的记忆，而是外置在文件系统中的可恢复状态体系。

它的目标很明确：

- 让 AI 能恢复上一次会话的工作状态
- 让项目规范不会丢失
- 让任务执行可以暂停、继续、追溯
- 让每次 session 都有历史记录

---

## 0. 总图

```text
                +--------------------------+
                |   .spec-first/spec/         |
                |  长期项目知识记忆        |
                +-----------+--------------+
                            |
                before-dev / check / finish-work
                            |
                            v
                +--------------------------+
                |   task.json + PRD        |
                |   implement/check/debug  |
                |   任务记忆               |
                +-----------+--------------+
                            |
                   task start / start.py
                            |
                            v
                +--------------------------+
                | .current-task            |
                | .agent-log               |
                | .session-id              |
                | worktree                 |
                | 会话执行记忆             |
                +-----------+--------------+
                            |
                    add_session / record
                            |
                            v
                +--------------------------+
                | journal-N.md             |
                | index.md                 |
                | 历史沉淀记忆             |
                +-----------+--------------+
                            |
                     get_context / start
                            |
                            v
                 下一次会话重新恢复
```

---

## 1. 记忆分层

### 1.1 项目知识记忆

位置：

- `.spec-first/spec/`
- `.spec-first/spec/guides/`

内容：

- 项目目录结构与层级约定
- 编码规范、命名规范、模块边界
- 错误处理、日志、异常约束
- 质量标准、检查清单、review 要点
- 跨层思考指南和复用原则
- 不同包/层的专属规范索引
- 反模式、常见坑、禁止事项
- 需要长期保留的设计决策和共识

职责：

- 这是项目的长期知识库
- `before-dev` 和 `check` 会优先读取这里
- 适合存“应该怎么做”，不适合存“这次任务做到哪一步”

通常不放：

- 当前任务进度
- 当前 session 临时决策
- 一次性调试过程
- 仅对某个需求有效的短期结论

参考：

- [`workflow.md`](/Users/kuang/xiaobu/spec-first/.spec-first/workflow.md#L119)
- [`before-dev`](/Users/kuang/xiaobu/spec-first/.agents/skills/before-dev/SKILL.md#L1)

### 1.2 任务记忆

位置：

- `.spec-first/tasks/<task>/task.json`
- `.spec-first/tasks/<task>/prd.md`
- `.spec-first/tasks/<task>/implement.jsonl`
- `.spec-first/tasks/<task>/check.jsonl`
- `.spec-first/tasks/<task>/debug.jsonl`

内容：

- 任务 ID、标题、所属 package
- 任务目标和需求范围
- 当前阶段和阶段状态
- 优先级、负责人、基线分支
- 下一步动作和 `next_action`
- 任务关联文件和依赖关系
- PRD 中的验收标准
- 实现 / 检查 / 调试时要注入的上下文
- 任务级上下文清单（implement / check / debug）

职责：

- 这是单个任务的工作包
- 它决定当前任务怎么执行、怎么检查、怎么结束
- 适合存“这次要完成什么”，不适合存长期规范

通常不放：

- 项目级通用规范
- 跨任务复用的设计原则
- 会话日志和复盘结果
- Git 以外的历史大总结

参考：

- [`task_store.py`](/Users/kuang/xiaobu/spec-first/.spec-first/scripts/common/task_store.py#L147)
- [`task_context.py`](/Users/kuang/xiaobu/spec-first/.spec-first/scripts/common/task_context.py#L149)

### 1.3 会话记忆

位置：

- `.spec-first/.current-task`
- `.agent-log`
- `.session-id`
- worktree 内工作目录

内容：

- 当前绑定哪个任务
- 当前代理会话是什么
- 当前 worktree 在哪里
- 当前分支 / 当前 session ID
- 当前运行日志是什么
- 当前执行器或 agent 的临时状态
- 任务启动后生成的临时控制信息
- 恢复时需要的最小定位信息

职责：

- 让会话知道自己当前处理的是哪个任务
- 让代理可以恢复或继续执行
- 适合存“这次正在跑什么”，不适合存完整结论

通常不放：

- 需求全文
- 完整设计文档
- 已确认的项目规范
- 长期沉淀的复盘知识

参考：

- [`start.py`](/Users/kuang/xiaobu/spec-first/.spec-first/scripts/multi_agent/start.py#L240)

### 1.4 历史记忆

位置：

- `.spec-first/workspace/<developer>/journal-N.md`
- `.spec-first/workspace/<developer>/index.md`

内容：

- session 总结
- branch / commit hash
- main changes
- testing 结果
- 阻塞点与已解决问题
- next steps
- 这次 session 的关键判断
- 适合回顾的经验和教训
- 必要时补充的规范修订线索

职责：

- 把每次 session 的工作结果固化下来
- 让后续 `get_context` 能重新读到过去发生了什么
- 适合存“已经发生过什么”，不适合存执行中的临时状态

通常不放：

- 仍在进行中的任务细节
- 尚未确认的猜测
- 需要立即作用于当前会话的临时命令
- 只对本次 session 有效的中间草稿

参考：

- [`workspace/index.md`](/Users/kuang/xiaobu/spec-first/.spec-first/workspace/index.md#L64)
- [`add_session.py`](/Users/kuang/xiaobu/spec-first/.spec-first/scripts/add_session.py#L141)

---

## 2. 记忆是如何流动的

```text
项目规范记忆 (.spec-first/spec)
        |
        v
before-dev / check
        |
        v
任务记忆 (task.json + prd.md + jsonl)
        |
        v
task start / start.py
        |
        v
会话记忆 (.current-task + .agent-log + worktree)
        |
        v
add_session
        |
        v
历史记忆 (journal + index)
        |
        v
get_context
        |
        v
下一次会话重新读取
```

这条链路的核心是：

- 写入一次
- 可恢复
- 可追溯
- 可复用

更具体地说，每一层都解决不同问题：

- `spec` 解决“规则是什么”
- `task` 解决“这次要做什么”
- `session` 解决“现在跑到哪一步了”
- `history` 解决“之前做过什么、学到了什么”

---

## 3. 各节点分别记什么

### 3.1 `get_context.py`

作用：

- 恢复短期工作状态

记忆内容：

- developer
- branch
- git 状态
- 最近提交
- 活跃任务
- journal 文件和行数

参考：

- [`session_context.py`](/Users/kuang/xiaobu/spec-first/.spec-first/scripts/common/session_context.py#L115)

### 3.2 `before-dev`

作用：

- 注入项目知识记忆

记忆内容：

- `spec/<package>/<layer>/index.md`
- `spec/guides/index.md`

参考：

- [`before-dev`](/Users/kuang/xiaobu/spec-first/.agents/skills/before-dev/SKILL.md#L1)

### 3.3 `task create`

作用：

- 创建任务的初始记忆实体

记忆内容：

- `status = planning`
- `base_branch`
- `next_action`
- `package`
- `assignee`

参考：

- [`task_store.py`](/Users/kuang/xiaobu/spec-first/.spec-first/scripts/common/task_store.py#L147)

### 3.4 `task init-context`

作用：

- 把任务上下文拆成实现、检查、调试三种注入文件

记忆内容：

- `implement.jsonl`
- `check.jsonl`
- `debug.jsonl`

参考：

- [`task_context.py`](/Users/kuang/xiaobu/spec-first/.spec-first/scripts/common/task_context.py#L149)

### 3.5 `task start` / `start.py`

作用：

- 把任务变成当前会话的执行中心

记忆内容：

- `.current-task`
- `worktree_path`
- `.agent-log`
- `.session-id`
- 更新后的 `task.json.status`

参考：

- [`task.py`](/Users/kuang/xiaobu/spec-first/.spec-first/scripts/task.py#L68)
- [`start.py`](/Users/kuang/xiaobu/spec-first/.spec-first/scripts/multi_agent/start.py#L240)

### 3.6 `add_session.py`

作用：

- 把会话变成可检索的历史记录

记忆内容：

- session 标题
- package
- branch
- summary
- main changes
- commits
- testing
- status

同时更新：

- `journal-N.md`
- `index.md`

参考：

- [`add_session.py`](/Users/kuang/xiaobu/spec-first/.spec-first/scripts/add_session.py#L141)

---

## 4. 记忆体系为什么有效

### 4.1 它不依赖聊天窗口

聊天窗口会丢失，上下文会被截断，但文件不会。

### 4.2 它把不同类型的记忆分开存

- 规范归规范
- 任务归任务
- 会话归会话
- 历史归历史

这样系统恢复时不会把“长期知识”和“当前任务”混在一起。

### 4.3 它支持重启和续写

因为有：

- `task.json`
- `.current-task`
- `journal-N.md`
- `index.md`

所以 AI 下一次进入时可以恢复到上次的状态，而不是从零开始。

### 4.4 它支持增量强化

项目知识不是写死一次就完了，而是会随着 session 继续增强：

- 新发现的项目规则可以写回 spec
- 新的 bug 根因可以写回 break-loop
- 新的工作模式可以写回 workspace journal

所以这个系统不是静态记忆库，而是“边做边长”的记忆系统。

---

## 5. 记忆与 skill 的对应关系

spec-first 的 skill 不是独立记忆，而是“读取或刷新某一层记忆”的入口。

| Skill | 主要消费的记忆层 | 作用 |
|---|---|---|
| `/spec:start` | 会话记忆 + 历史记忆 | 恢复当前工作状态 |
| `/spec:before-dev` | 项目知识记忆 | 注入项目规范 |
| `/spec:brainstorm` | 项目知识记忆 + 任务记忆 | 先澄清需求再进入任务 |
| `/spec:check` | 项目知识记忆 + 任务记忆 | 对照规范检查实现 |
| `/spec:check-cross-layer` | 项目知识记忆 + 任务记忆 + 代码产物 | 检查跨层影响 |
| `/spec:finish-work` | 项目知识记忆 + 任务记忆 + 会话记忆 | 做最终交付复核 |
| `/spec:record-session` | 会话记忆 + 历史记忆 | 固化 session 结果 |
| `/spec:break-loop` | 历史记忆 + 项目知识记忆 | 把 bug 经验反写回规范 |

---

## 6. 第一次接入已有项目时最重要的记忆动作

首次接入时，最重要的不是先做功能，而是先把记忆底座补齐：

1. 初始化 developer 和记忆目录
2. 读取当前上下文
3. 检查 spec 是否可注入
4. 如果 spec 为空，先 bootstrap
5. 再进入第一轮任务和会话记录

如果跳过这一步，项目就会只剩下“当前对话窗口”这一层临时记忆，后续开发很容易退化成通用模型行为。

---

## 7. 读写矩阵

| 组件 | 写入者 | 读取者 | 何时更新 |
|---|---|---|---|
| `.spec-first/spec/` | bootstrap、update-spec、人工维护 | before-dev、check、finish-work | 新规范发现、bug 复盘、流程改进 |
| `task.json` | task create、start.py、create-pr | start.py、status、phase 工具 | 创建任务、推进阶段、完成交付 |
| `prd.md` | brainstorm、人工编辑、bootstrap | start.py、任务执行者 | 需求确认后、进入实现前 |
| `implement.jsonl` | task init-context | implement 阶段 | 创建任务上下文时 |
| `check.jsonl` | task init-context | check / finish-work | 创建任务上下文时 |
| `debug.jsonl` | task init-context | debug / check | 创建任务上下文时 |
| `.current-task` | task start、start.py | get_context、代理执行器 | 切换当前任务时 |
| `.agent-log` | start.py | status、watch、debug | 启动代理时 |
| `.session-id` | start.py | status、resume | 启动代理时 |
| `journal-N.md` | add_session | get_context、人工回顾 | 会话结束时 |
| `index.md` | add_session | get_context、workspace 导览 | 会话结束时 |

---

## 8. 失效模式

### 8.1 spec 为空

现象：

- `before-dev` 没有可注入的项目知识
- AI 开始写通用代码

修复：

- 先 bootstrap
- 再补齐 spec

### 8.2 task.json 缺失或不完整

现象：

- 无法进入 start
- 无法建立 worktree
- phase 无法推进

修复：

- 重新创建任务或修复 task.json

### 8.3 没有 add_session

现象：

- 本次工作不会进入 journal
- 下一次会话无法从历史里恢复

修复：

- 补录 session
- 必要时更新 workspace index

### 8.4 current-task 没有写入 worktree

现象：

- 代理启动了，但不知道当前正在处理哪个任务
- 上下文漂移到错误任务

修复：

- 重新执行 `task start`
- 检查 worktree 路径和 `.current-task`

---

## 9. Field-Level Examples

### 9.1 `task.json` typically stores

```json
{
  "id": "task-orchestrator",
  "title": "Task 编排状态机：status/next/advance/log 四命令",
  "status": "planning",
  "package": "cli",
  "dev_type": "backend",
  "scope": "task",
  "priority": "P1",
  "creator": "taosu",
  "assignee": "taosu",
  "base_branch": "feat/v0.4.0-beta",
  "current_phase": 0,
  "next_action": [
    { "phase": 1, "action": "implement" },
    { "phase": 2, "action": "check" },
    { "phase": 3, "action": "finish" }
  ],
  "relatedFiles": [
    ".spec-first/scripts/task.py",
    ".claude/commands/spec/start.md"
  ]
}
```

What this file remembers:

- identity of the task
- current lifecycle stage
- owner and branch baseline
- next execution steps
- task-linked files

### 9.2 `journal-N.md` typically stores

```md
## Session 104: Decouple .agents/skills as shared layer + Codex .codex support

**Date**: 2026-03-24
**Task**: Decouple .agents/skills as shared layer + Codex .codex support
**Package**: cli
**Branch**: `feat/v0.4.0-beta`

### Summary

Major architecture change: decoupled .agents/skills/ from Codex platform...

### Main Changes

- `.agents/skills/` decoupled from Codex
- Added full `.codex/` directory support

### Git Commits

| Hash | Message |
|------|---------|
| `ba75c30` | (see git log) |

### Testing

- [OK] 516 tests pass

### Status

[OK] **Completed**

### Next Steps

- None - task complete
```

What this file remembers:

- what happened in the session
- what changed
- how it was validated
- what remains to do next

### 9.3 `.spec-first/workspace/index.md` typically stores

- active developers
- last active date
- session counts
- pointers to each developer's active journal file
- onboarding and journal rotation rules

This file is the directory-level index, not the detailed history itself.

### 9.4 `.spec-first/spec/` typically stores

- workflow rules and execution conventions
- code style and naming guidance
- guides for cross-layer thinking
- quality and error-handling constraints
- anti-patterns and reusable patterns

This layer should answer: “What is the project standard?”

### 9.5 `.current-task`, `.agent-log`, `.session-id`

These files store only the minimum runtime state needed to continue work:

- which task is currently active
- which session owns the work
- where the execution log is
- which worktree is bound to the session

They are intentionally small and ephemeral.

---

## 10. Update Timing and Ownership

This section explains **who updates each memory layer** and **when it should change**.

| Layer / File | Typical Writer | Update Trigger | Notes |
|---|---|---|---|
| `.spec-first/spec/` | `before-dev`, `break-loop`, manual spec maintenance | New project rule, recurring bug insight, quality standard change | Long-term knowledge; update only when the project standard changes |
| `.spec-first/spec/guides/` | `before-dev`, `break-loop` | New cross-layer or cross-platform lesson | Used to improve future thinking, not task execution |
| `.spec-first/tasks/<task>/task.json` | `task create`, `task start`, `start.py` | Create task, change phase, set branch, finish task | Task state must stay aligned with execution |
| `.spec-first/tasks/<task>/prd.md` | `brainstorm`, manual authoring, bootstrap | Requirement clarified or bootstrap PRD created | Should reflect the current task intent |
| `.spec-first/tasks/<task>/*.jsonl` | `task init-context` | Task context prepared for implement/check/debug | These are injection files, not narrative docs |
| `.spec-first/.current-task` | `task start`, `start.py` | Current task changes | Must always point to the active task |
| `.agent-log` | `start.py` | Agent session starts / status changes | Runtime log, usually short-lived |
| `.session-id` | `start.py` | New agent session starts | Used for resuming and traceability |
| `.spec-first/workspace/<developer>/journal-N.md` | `add_session.py` | Session ends, commit recorded, or note worth preserving | Append-only history for the developer |
| `.spec-first/workspace/<developer>/index.md` | `add_session.py` | New journal created, session history updated | Directory index, not the detailed diary |

### Recommended Maintenance Rule

- Update `spec` when you discover a stable rule
- Update `task` when the task’s execution state changes
- Update `session` when work starts, resumes, or switches tasks
- Update `history` when a session is complete enough to be reused later

### What Not to Do

- Do not put task-specific noise into `spec`
- Do not store long-term standards in `journal`
- Do not treat `.current-task` as a source of truth for project status
- Do not use session logs as a substitute for task state

---

## 11. Spec-First Can Borrow From spec-first

The following design choices from `spec-first` are worth borrowing into spec-first because they reduce ambiguity and improve recovery quality without turning the workflow into a heavy state machine.

| Borrowable Idea | What spec-first Does | Why It Helps spec-first |
|---|---|---|
| Four-layer memory split | `Runtime / Feature / Recovery-Audit / Auxiliary` | Makes it easier to separate permanent knowledge from runtime state and recovery data |
| `stage-state + audit + trace` split | `stage-state.json`, `gate-history.jsonl`, `traceability-matrix.md` each own one concern | spec-first can reduce file overload by assigning one job per file |
| Explicit "store / do not store" rules | Each layer documents what belongs there and what does not | Prevents memory contamination and accidental context drift |
| Update timing and ownership | Clarifies who updates each layer and when | Useful for keeping multi-agent work synchronized |
| File-level examples | Shows real `task.json` and journal shapes | Makes onboarding faster and reduces interpretation errors |
| Lightweight recovery path | `ai catchup` reconstructs context from truth files | spec-first can add a lighter, daily recovery entry point |
| Project-vs-host boundary | Separates project memory from host config | Helps spec-first keep project memory scoped correctly |

### What spec-first Should Take, Not Copy Blindly

- Borrow the clarity, not the extra ceremony.
- Keep spec-first lightweight where it already works.
- Add a fast recovery snapshot if day-to-day recovery becomes too expensive.
- Add per-layer update ownership if multiple agents start editing the same memory surface.

---

## 12. 一句话总结

spec-first 的记忆体系本质上是一个四层外置状态系统：

- `spec` 负责长期知识
- `task.json + jsonl` 负责任务记忆
- `.current-task + worktree` 负责会话执行记忆
- `workspace/journal/index` 负责历史沉淀

它的价值不是“记住更多”，而是“每次都能准确恢复该记什么”。
