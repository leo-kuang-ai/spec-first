# spec-first Workflow Analysis

本文档分析当前项目中两种常见场景的流程编排：

1. `0-1` 新项目初始化
2. 已存在项目的需求迭代

结论先行：

- 这套系统本质上只有一条主线流程，差异在于起点不同。
- `0-1` 场景的第一优先级是建立项目规范，把真实代码模式沉淀到 `.spec-first/spec/`。
- 存量迭代场景的第一优先级是把需求变成可执行任务，并把规范注入到任务上下文中。
- 两者最终都会收敛到同一条链路：`任务 -> 上下文 -> 执行 -> 检查 -> 记录 -> 归档`。

---

## 0. 适用范围与术语

### 0.1 适用范围

本文档适用于两类场景：

- 新项目从 0 到 1 初始化 spec-first 流程
- 已有项目在 spec-first 体系下做需求迭代

不展开的内容：

- 具体业务代码实现
- 某个 package 的详细开发规范
- 平台差异化适配细节

### 0.2 术语定义

为了避免把“需求文档”和“任务说明”混为一谈，这里统一定义：

- `bootstrap PRD`：新项目初始化阶段生成的 PRD，目标是补齐 `.spec-first/spec/`
- `功能 PRD`：存量项目迭代阶段生成的 PRD，目标是交付某个需求
- `task.json`：spec-first 任务元数据，描述任务状态、分支、阶段、package 等
- `implement.jsonl`：实现阶段上下文注入配置
- `check.jsonl`：检查阶段上下文注入配置
- `debug.jsonl`：调试阶段上下文注入配置
- `spec`：项目规范知识库，后续 AI 开发会优先读取
- `workspace`：会话记录区，保存 journal 和 session 历史

---

## 1. 总体流程图

```text
                                  +-----------------------------+
                                  |      spec-first 开始工作       |
                                  +-----------------------------+
                                                |
                         +----------------------+----------------------+
                         |                                             |
                         v                                             v
              +-----------------------+                     +-----------------------+
              | 0-1 新项目初始化      |                     | 已存在项目需求迭代    |
              +-----------------------+                     +-----------------------+
                         |                                             |
                         v                                             v
              +-----------------------+                     +-----------------------+
              | init_developer        |                     | 需求输入              |
              | ctx: developer +      |                     | ctx: requirement text |
              | workspace             |                     +-----------------------+
              +-----------------------+                               |
                         |                                             v
                         v                               +-----------------------------+
              +-----------------------+                | brainstorm / direct creation |
              | get_context           |                | ctx: clarified scope         |
              | ctx: git/tasks/journal|                +-----------------------------+
              +-----------------------+                               |
                         |                                             v
                         v                               +-----------------------+
              +-----------------------+                | task create            |
              | bootstrap task        |                | ctx: task.json         |
              | ctx: task.json +      |                | planning + next_action  |
              | prd.md + spec paths   |                | + base_branch          |
              +-----------------------+                +-----------------------+
                         |                                             |
                         v                                             v
              +-----------------------+                +-----------------------+
              | fill spec             |                | write PRD              |
              | ctx: real code        |                | ctx: goal/req/AC/tech  |
              | samples + guidelines  |                +-----------------------+
              +-----------------------+                               |
                         |                                             v
                         v                               +-----------------------+
              +-----------------------+                | init-context           |
              | finish + archive      |                | ctx: implement/check/  |
              | ctx: session + spec   |                | debug jsonl            |
              +-----------------------+                +-----------------------+
                         |                                             |
                         v                                             v
              +-----------------------------+           +-----------------------+
              | future iteration tasks      |           | task start            |
              | ctx: spec available         |           | ctx: current task +   |
              +-----------------------------+           | hooks                 |
                                                        +-----------------------+
                                                                  |
                                                                  v
                                                        +-----------------------+
                                                        | plan/start exec       |
                                                        | ctx: task.json + prd  |
                                                        | + worktree + .current |
                                                        +-----------------------+
                                                                  |
                                                                  v
                                                        +-----------------------+
                                                        | implement             |
                                                        | ctx: workflow + spec  |
                                                        | + task jsonl          |
                                                        +-----------------------+
                                                                  |
                                                                  v
                                                        +-----------------------+
                                                        | check                 |
                                                        | ctx: finish-work +    |
                                                        | check spec            |
                                                        +-----------------------+
                                                                  |
                                                                  v
                                                        +-----------------------+
                                                        | record session        |
                                                        | ctx: commit + summary |
                                                        | + testing + journal   |
                                                        +-----------------------+
                                                                  |
                                                                  v
                                                        +-----------------------+
                                                        | archive or PR         |
                                                        | ctx: task closure     |
                                                        +-----------------------+
```

---

## 2. 0-1 新项目流程

### 2.1 起点：初始化开发者身份

新项目不是先写业务，而是先让系统知道“谁在工作”。`init_developer.py` 会创建：

- `.spec-first/.developer`
- `.spec-first/workspace/<developer>/`
- 个人 `index.md`
- 初始 `journal-N.md`

这一步的意义是建立后续 session、journal、任务记录的归属边界。

上下文注入：

- developer 身份
- workspace 路径
- 个人 journal 入口

参考：

- `.spec-first/workflow.md`
- `.spec-first/workspace/index.md`

### 2.2 收集当前上下文

`get_context.py` 会把当前状态一次性打包出来，供后续 bootstrap 或任务执行使用。

上下文注入：

- developer
- git branch
- working tree 是否干净
- 最近提交
- 活跃任务
- 当前 journal 文件与行数

这一步不是写代码，而是确认当前环境是否适合继续构建项目规范。

### 2.3 进入 bootstrap 任务

`create_bootstrap.py` 是新项目的关键入口。它会生成一个专门用于“补齐项目规范”的任务目录。

该任务的核心特征：

- `task.json` 状态为 `in_progress`
- `dev_type` 固定为 `docs`
- `relatedFiles` 指向 `.spec-first/spec/...`
- `subtasks` 是“填 backend/frontend 指南”

这里的目标不是实现业务，而是把“项目真实写法”写进规范文件，让未来的 AI 会话有稳定的注入源。

上下文注入：

- `prd.md`
- `task.json`
- `.spec-first/spec/<package>/backend/index.md`
- `.spec-first/spec/<package>/frontend/index.md`

参考：

- `.spec-first/scripts/create_bootstrap.py`

### 2.4 填写 spec

bootstrap 的实际产物不是代码，而是规范文档。

典型内容包括：

- 目录结构
- 组件/路由/服务组织方式
- 错误处理规范
- 日志规范
- 质量检查要求

这里的原则是“document reality, not ideals”：

- 不是写你希望项目怎么做
- 而是写项目现在实际怎么做

这一步完成后，后续所有新任务都会从这些 spec 获得更准确的上下文。

### 2.5 收尾

bootstrap 完成后，按标准进行：

- `task.py finish`
- `task.py archive`
- `add_session.py`

这一步会把初始化经验记录进 workspace，并让项目进入可持续迭代状态。

### 2.6 为什么新项目看起来“没有 PRD”

新项目不是没有 PRD，而是 PRD 的性质不同。

在 0-1 场景里，`create_bootstrap.py` 生成的是“bootstrap PRD”，它的作用是定义：

- 要补哪些规范文件
- 规范应该从哪里提炼
- 完成标准是什么
- 结束后如何收口

这个 PRD 的对象不是业务需求，而是“项目规范建设”本身。

因此它更像一份初始化任务说明，而不是传统意义上的功能需求文档。

存量项目迭代里的 PRD 则不同，它直接服务于某个功能、修复或重构：

- Goal
- Requirements
- Acceptance Criteria
- Technical Notes

所以在流程表现上会感觉：

- 新项目先“写规范 PRD”
- 存量项目先“写功能 PRD”

本质差异不是有没有 PRD，而是 PRD 的目标不同。

---

## 3. 存量项目迭代流程

### 3.1 起点：需求输入

存量项目的入口通常是一个明确需求：

- 修 bug
- 加功能
- 重构
- 提升质量
- 做文档或规范更新

这类任务的第一步不是动代码，而是判断：

- 这次改动属于哪个 package
- 属于 backend / frontend / fullstack 哪一层
- 是否涉及跨层
- 是否需要先做 brainstorm

### 3.2 任务创建

`task.py create` 会创建标准任务目录，并写入默认任务结构。

关键字段：

- `status: planning`
- `base_branch`: 当前 Git 分支
- `current_phase: 0`
- `next_action`: implement -> check -> finish -> create-pr
- `package`
- `priority`
- `assignee`

这一步的作用是把自然语言需求变成机器可追踪的任务实体。

上下文注入：

- 需求标题
- slug
- package
- 当前分支
- 默认阶段序列

参考：

- `.spec-first/scripts/common/task_store.py`

### 3.3 写 PRD

PRD 是需求到执行的桥梁。标准内容包括：

- Goal
- Requirements
- Acceptance Criteria
- Technical Notes

如果是复杂需求，通常先通过 brainstorm 把边界、约束和方案收敛，再进入任务创建。

上下文注入：

- 需求说明
- 目标范围
- 验收标准
- 技术约束

### 3.4 初始化任务上下文

`task.py init-context` 会生成三个关键 jsonl 文件：

- `implement.jsonl`
- `check.jsonl`
- `debug.jsonl`

默认注入逻辑如下：

- `implement.jsonl`
  - `workflow.md`
  - backend 或 frontend 的 `index.md`
- `check.jsonl`
  - `finish-work`
  - `check`
- `debug.jsonl`
  - `check`

同时它会把 `dev_type` 和 `package` 回写进 `task.json`，保证任务元数据和实际上下文一致。

这是整个系统里最重要的“上下文注入”节点之一，因为它决定了后续 AI 是否真的能看到正确的项目规范。

参考：

- `.spec-first/scripts/common/task_context.py`

### 3.5 设置当前任务

`task.py start <dir>` 会把任务设为当前任务，并触发 task hooks。

这个动作意味着当前 session 从“泛化上下文”切换到了“任务专属上下文”。

上下文注入：

- 当前任务路径
- 当前任务的 `task.json`
- jsonl 中的 implement/check/debug 注入
- after_start hook 结果

### 3.6 执行阶段

如果走多代理模式，`start.py` 会：

1. 读取 `task.json`
2. 检查 `prd.md` 是否存在
3. 检查 `branch` 是否已设置
4. 创建或复用 worktree
5. 写入 `.spec-first/.current-task`
6. 启动 Dispatch Agent
7. 按 `task.json.next_action` 顺序执行

它实际上把任务推进成一个可执行状态机。

上下文注入：

- `task.json`
- `prd.md`
- `branch`
- `base_branch`
- `worktree_path`
- `.current-task`
- `next_action`

参考：

- `.spec-first/scripts/multi_agent/start.py`

### 3.7 检查与收尾

执行结束后，标准收尾动作是：

- `finish-work`
- `add_session.py`
- 必要时更新 spec
- 必要时归档任务
- 必要时创建 PR

`add_session.py` 会把本次 session 写进 journal，并更新 workspace index。

上下文注入/记录：

- commit hash
- branch
- summary
- testing 结果
- journal 内容
- index.md session 统计

参考：

- `.spec-first/workflow.md`
- `.spec-first/scripts/add_session.py`

---

## 4. 节点上下文注入矩阵

| 节点 | 注入内容 | 目的 |
|---|---|---|
| `init_developer` | developer、workspace、journal 入口 | 建立个人开发上下文 |
| `get_context` | git、tasks、journal、recent commits | 让 AI 识别当前状态 |
| `get_context --mode packages` | package、layer、路径 | 找到正确的 spec 范围 |
| `spec/<package>/<layer>/index.md` | Pre-Dev Checklist、Quality Check | 决定读哪些细则 |
| `spec/guides/index.md` | cross-layer / reuse / cross-platform 指南 | 防止漏想边界问题 |
| `create_bootstrap` | bootstrap PRD、spec 目录映射 | 初始化项目规范 |
| `task create` | task.json、base_branch、next_action | 把需求变成任务对象 |
| `task init-context` | implement/check/debug jsonl | 固化上下文注入规则 |
| `task start` | 当前任务切换、hooks | 进入任务专属 session |
| `plan.py` | requirement、dev_type、task dir | 生成可执行 PRD |
| `start.py` | prd、branch、worktree、.current-task | 进入执行状态机 |
| `finish-work` | 代码质量检查清单 | 保证可交付 |
| `add_session.py` | commit、summary、testing、journal | 沉淀会话知识 |

---

## 5. 两种场景的差异

### 5.1 0-1 新项目

- 先补规范，再写功能
- 任务重点是 bootstrap spec
- 目标是让未来的 AI 有“正确上下文”
- 产物是 `.spec-first/spec/` 的长期知识资产

### 5.2 存量项目迭代

- 先明确需求，再建任务
- 任务重点是 PRD + context 注入
- 目标是让当前改动可执行、可检查、可记录
- 产物是代码变化 + session 记录 + 可能的 spec 更新

### 5.3 共同点

- 都必须先读 workflow 和 spec 指南
- 都要通过 task.json 管理状态
- 都要在收尾时记录 session
- 都鼓励把新发现反向写回 spec

---

## 6. 实操建议

如果你面对的是一个新仓库：

1. 先跑 developer init
2. 先 bootstrap spec
3. 再写第一批功能任务

如果你面对的是一个已有仓库：

1. 先读 `get_context`
2. 再读对应 spec index
3. 再建任务和 PRD
4. 再初始化 task context
5. 再进入实现和检查

---

## 7. 一句话总结

`0-1` 新项目是在“建规则”，存量迭代是在“按规则交付”；两者共用同一条开发流水线，只是前者先补规范，后者先补需求。
