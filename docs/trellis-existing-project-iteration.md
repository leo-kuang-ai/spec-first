# 已存在项目需求迭代流程分析

本文档只分析“存量项目需求迭代”这条流程，不包含 0-1 新项目 bootstrap。

目标是回答四件事：

1. 流程怎么走
2. 每个节点产出什么
3. 上下文怎么分层管理
4. 过程记录写到哪里、写什么

---

## 0. 适用范围

适用场景：

- 修 bug
- 加功能
- 重构
- 性能优化
- 文档或规范迭代

不展开内容：

- 新项目 0-1 初始化
- 具体业务实现细节
- 平台差异化命令适配

---

## 1. 统一流程图

```text
                           +-----------------------------+
                           |   已存在项目需求进入        |
                           +-----------------------------+
                                         |
                                         v
                           +-----------------------------+
                           | 需求澄清 / 复杂度判断      |
                           | ctx: 原始需求、风险、范围  |
                           +-----------------------------+
                                         |
                         +---------------+---------------+
                         |                               |
                         v                               v
          +-----------------------------+   +-----------------------------+
          | brainstorm(复杂/不清晰)     |   | 直接建任务(简单/明确)       |
          | ctx: 需求、研究结果、方案   |   | ctx: 需求摘要               |
          +-----------------------------+   +-----------------------------+
                         |                               |
                         +---------------+---------------+
                                         |
                                         v
                           +-----------------------------+
                           | task create                |
                           | ctx: task.json             |
                           | planning + next_action     |
                           | + base_branch              |
                           +-----------------------------+
                                         |
                                         v
                           +-----------------------------+
                           | write PRD                  |
                           | ctx: Goal/Req/AC/Tech     |
                           +-----------------------------+
                                         |
                                         v
                           +-----------------------------+
                           | task init-context          |
                           | ctx: implement/check/debug |
                           +-----------------------------+
                                         |
                                         v
                           +-----------------------------+
                           | task start                 |
                           | ctx: current task + hooks  |
                           +-----------------------------+
                                         |
                                         v
                           +-----------------------------+
                           | plan/start execution       |
                           | ctx: task.json + prd.md    |
                           | + worktree + .current-task |
                           +-----------------------------+
                                         |
                         +---------------+---------------+
                         |                               |
                         v                               v
          +-----------------------------+   +-----------------------------+
          | implement                   |   | check / finish-work         |
          | ctx: workflow + spec        |   | ctx: 检查清单 + 代码状态     |
          +-----------------------------+   +-----------------------------+
                         |                               |
                         +---------------+---------------+
                                         |
                                         v
                           +-----------------------------+
                           | record session              |
                           | ctx: commit + summary +    |
                           | testing + branch           |
                           +-----------------------------+
                                         |
                                         v
                           +-----------------------------+
                           | archive / create PR        |
                           | ctx: 任务关闭、PR 信息      |
                           +-----------------------------+
```

---

## 2. 流程分段说明

### 2.1 需求进入与分流

这一段的目标不是立刻写代码，而是判断这次需求属于哪种复杂度：

- 简单且边界清晰，直接进入任务创建
- 复杂、存在多方案、需要技术选型，先 brainstorm

这一步的输入一般来自：

- 用户口头需求
- issue
- PR 评论
- 现有任务拆分出来的子任务

产物：

- 分流决策
- 初步任务标题
- 约束和疑点列表

### 2.2 任务创建

`task create` 会把自然语言需求变成可追踪的任务目录和 `task.json`。

关键字段：

- `status = planning`
- `base_branch = 当前 Git 分支`
- `current_phase = 0`
- `next_action = implement -> check -> finish -> create-pr`
- `package`
- `priority`
- `assignee`

产物：

- `.spec-first/tasks/<date>-<slug>/task.json`
- 任务目录本体

参考实现：

- [`task_store.py`](/Users/kuang/xiaobu/spec-first/.spec-first/scripts/common/task_store.py#L147)

### 2.3 写 PRD

PRD 是需求到执行之间的契约。它的职责是把“想做什么”变成“怎么验收”。

标准内容：

- Goal
- Requirements
- Acceptance Criteria
- Technical Notes

如果是 brainstorm 过的任务，PRD 里通常已经包含：

- 研究结论
- 候选方案
- 选型原因
- 明确的 out-of-scope

产物：

- `prd.md`

### 2.4 初始化任务上下文

`task init-context` 是上下文注入的核心节点。它会生成 3 份 jsonl 文件：

- `implement.jsonl`
- `check.jsonl`
- `debug.jsonl`

默认注入逻辑：

- `implement.jsonl`
  - `workflow.md`
  - backend 或 frontend 的 `index.md`
- `check.jsonl`
  - `finish-work`
  - `check`
- `debug.jsonl`
  - `check`

同时它会回写 `task.json` 中的：

- `dev_type`
- `package`

产物：

- `.spec-first/tasks/<task>/implement.jsonl`
- `.spec-first/tasks/<task>/check.jsonl`
- `.spec-first/tasks/<task>/debug.jsonl`
- 更新后的 `task.json`

参考实现：

- [`task_context.py`](/Users/kuang/xiaobu/spec-first/.spec-first/scripts/common/task_context.py#L149)

### 2.5 设置当前任务

`task start` 把任务切换成当前任务，并触发 task hooks。

它的意义是：

- 从“任务目录存在”升级到“当前会话绑定该任务”
- 让后续 AI 会话自动读取这个任务的上下文

产物：

- `.spec-first/.current-task`
- after_start hook 执行结果

参考实现：

- [`task.py`](/Users/kuang/xiaobu/spec-first/.spec-first/scripts/task.py#L68)

### 2.6 进入执行态

如果走多代理路径，`start.py` 会把任务推进到真实执行态。

检查顺序大致是：

1. `task.json` 是否存在
2. `prd.md` 是否存在
3. `branch` 是否已设置
4. 是否已有可复用 worktree

然后它会：

- 创建或复用 worktree
- 写入 `.spec-first/.current-task`
- 更新 `task.json.status = in_progress`
- 启动 Dispatch Agent
- 按 `task.json.next_action` 顺序执行

产物：

- worktree 目录
- `.agent-log`
- `.session-id`
- 更新后的 `task.json`
- worktree 内的 `.spec-first/.current-task`

参考实现：

- [`start.py`](/Users/kuang/xiaobu/spec-first/.spec-first/scripts/multi_agent/start.py#L240)

### 2.7 实现

实现阶段是最典型的“上下文消费”节点。AI 执行时会优先读取：

- `workflow.md`
- 对应 package/layer 的 `spec/index.md`
- 当前任务的 `prd.md`
- 当前任务的 jsonl 上下文
- 当前 worktree 的 `.current-task`

产物：

- 代码变更
- 可能的新 spec 更新
- 可能的新任务拆分

### 2.8 检查与收尾

检查阶段不是简单跑测试，而是把交付物对齐到项目质量标准。

常见动作：

- lint
- typecheck
- 相关测试
- 手工验证
- `finish-work` 清单核对

产物：

- 检查结果
- 未解决问题列表
- 是否允许进入记录阶段的判定

### 2.9 记录会话

`add_session.py` 是过程记录的核心。它会生成 session 内容，并更新 workspace index。

记录内容包括：

- session 标题
- 日期
- task 名称
- package
- branch
- summary
- main changes
- git commits
- testing
- status
- next steps

它还会更新：

- `.spec-first/workspace/<developer>/journal-N.md`
- `.spec-first/workspace/<developer>/index.md`

如果 journal 超过上限，会自动新建下一个 journal 文件。

产物：

- journal 记录
- workspace index 更新
- 会话历史沉淀

参考实现：

- [`add_session.py`](/Users/kuang/xiaobu/spec-first/.spec-first/scripts/add_session.py#L141)

### 2.10 归档 / 创建 PR

完成后的最后一步通常是：

- 归档 task
- 创建 PR
- 或者在任务系统里标记完成

产物：

- archived task
- PR 链接
- 已完成任务历史

---

## 3. 上下文分层管理

存量迭代的上下文不是一块，而是分层管理的。

### 3.1 长期上下文

这层是“项目知识资产”，会跨任务复用。

包括：

- `.spec-first/spec/`
- `spec/guides/`
- `workflow.md`
- workspace 历史记录

用途：

- 决定项目风格
- 决定检查标准
- 决定 AI 应该优先读取什么

### 3.2 任务上下文

这层是“单个需求”的工作上下文。

包括：

- `task.json`
- `prd.md`
- `implement.jsonl`
- `check.jsonl`
- `debug.jsonl`

用途：

- 描述这一次改什么
- 定义实现/检查/调试时要注入什么
- 让任务具备可执行状态机

### 3.3 会话上下文

这层是“当前 session 正在做什么”。

包括：

- 当前 developer
- 当前 Git 状态
- 当前活跃任务
- 当前 journal
- 当前 worktree
- `.current-task`

用途：

- 让 AI 知道此刻自己在哪个任务里
- 防止上下文漂移到别的任务

### 3.4 执行上下文

这层是“当前进程实际在跑什么”。

包括：

- worktree
- `.agent-log`
- `.session-id`
- 环境变量
- 执行命令

用途：

- 让计划、执行、检查都能落到同一个工作目录
- 方便恢复、排查和回放

---

## 4. 每个节点的产物

| 节点 | 输入 | 主要产物 | 产物位置 |
|---|---|---|---|
| 需求进入 | 原始需求 | 分流决策、初步范围 | 会话上下文 |
| brainstorm | 需求 + 研究结果 | PRD 草案、方案比较、风险点 | task 目录 |
| task create | 需求标题、package、分支 | `task.json`、任务目录 | `.spec-first/tasks/...` |
| write PRD | 需求说明、约束 | `prd.md` | 任务目录 |
| init-context | task + dev_type | `implement/check/debug.jsonl` | 任务目录 |
| task start | 任务目录 | `.current-task`、hooks | worktree |
| start.py | task.json、PRD、branch | worktree、agent log、session id | worktree + task.json |
| implement | PRD + spec + jsonl | 代码变更、可能的 spec 更新 | 源码区 / spec |
| check | 代码 + 规范 | 测试结果、检查结论 | 会话输出 |
| add_session | commit + summary | journal + index 更新 | workspace |
| archive/PR | 完成结果 | archived task / PR 链接 | task 系统 |

---

## 5. 过程记录到底记录什么

这条流程里有三类记录：

### 5.1 任务记录

记录“任务本身怎么定义”。

来自：

- `task.json`
- `prd.md`
- `implement/check/debug.jsonl`

用途：

- 表达需求
- 表达阶段
- 表达上下文注入规则

### 5.2 会话记录

记录“这次 session 实际做了什么”。

来自：

- `add_session.py`
- journal 文件
- workspace index

用途：

- 留痕
- 可追溯
- 可复盘

### 5.3 执行记录

记录“运行时发生了什么”。

来自：

- `.agent-log`
- `.session-id`
- worktree
- Git 分支

用途：

- 排查失败
- 恢复执行
- 绑定代理会话

---

## 6. 常见分支与失败点

### 6.1 `prd.md` 缺失

说明 Plan 阶段没有正确完成，`start.py` 会直接停止。

### 6.2 `branch` 未设置

说明任务还没进入可执行状态，不能创建 worktree。

### 6.3 `task init-context` 没执行

说明任务缺少 jsonl 注入配置，后续 AI 只能看到最小上下文。

### 6.4 忘记 `add_session`

说明这次会话没有沉淀到 workspace，后续很难复盘。

---

## 7. 简化结论

存量项目迭代的本质是：

1. 先把需求变成任务
2. 再把任务变成可注入上下文
3. 再把上下文推进到 worktree 执行
4. 最后把结果记录到 journal 和 task 历史里

这条链路的核心不是“写代码”，而是“让每一步都有明确输入、产物和记录”。

