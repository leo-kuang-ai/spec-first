# 首次接入已有项目的 spec-first 流程分析

本文档描述的是一种特殊场景：

- 项目本身已经存在
- 但这是第一次接入 spec-first
- 团队还没有形成可复用的 `.spec-first/spec/` 项目规范

这类场景的关键不是“先做第一个需求”，而是“先把项目接入 spec-first 的工作系统”，然后再进入正常迭代。

---

## 0. 核心判断

第一次接入已有项目时，先判断一件事：

> `.spec-first/spec/` 是否已经有真实的项目规范，而不是空模板。

这个判断决定流程分支：

- 如果 spec 还是空的，先 bootstrap
- 如果 spec 已经可用，直接进入常规需求迭代

也就是说，首次接入时常见的真实顺序是：

1. 初始化 developer
2. 读取当前上下文
3. 检查 spec 状态
4. 必要时先 bootstrap
5. 再开始第一轮需求迭代

---

## 1. 统一流程图

```text
                          +-----------------------------+
                          |   已有项目首次接入 spec-first   |
                          +-----------------------------+
                                        |
                                        v
                          +-----------------------------+
                          | init_developer              |
                          | ctx: developer + workspace  |
                          +-----------------------------+
                                        |
                                        v
                          +-----------------------------+
                          | get_context                 |
                          | ctx: git + tasks + journal  |
                          +-----------------------------+
                                        |
                                        v
                          +-----------------------------+
                          | 检查 .spec-first/spec/         |
                          | ctx: spec 是否可注入        |
                          +-----------------------------+
                               |                     |
                     spec 为空/模板             spec 已可用
                               |                     |
                               v                     v
                 +-------------------------+   +--------------------------+
                 | bootstrap task          |   | 直接进入需求迭代         |
                 | ctx: spec paths + PRD   |   | ctx: 第一需求/issue      |
                 +-------------------------+   +--------------------------+
                               |                     |
                               +----------+----------+
                                          |
                                          v
                          +-----------------------------+
                          | 创建首个可交付任务          |
                          | ctx: task.json + PRD       |
                          +-----------------------------+
                                        |
                                        v
                          +-----------------------------+
                          | task init-context           |
                          | ctx: implement/check/debug  |
                          +-----------------------------+
                                        |
                                        v
                          +-----------------------------+
                          | task start                  |
                          | ctx: current task + hooks   |
                          +-----------------------------+
                                        |
                                        v
                          +-----------------------------+
                          | plan/start execution        |
                          | ctx: worktree + .current    |
                          +-----------------------------+
                                        |
                                        v
                          +-----------------------------+
                          | implement -> check          |
                          | ctx: spec + PRD + jsonl     |
                          +-----------------------------+
                                        |
                                        v
                          +-----------------------------+
                          | add_session                 |
                          | ctx: commit + summary + log |
                          +-----------------------------+
                                        |
                                        v
                          +-----------------------------+
                          | archive / create PR         |
                          +-----------------------------+
```

---

## 2. 第一次接入的执行顺序

### 2.1 初始化开发者身份

第一步是让系统知道当前是谁在接入这个项目。

产物：

- `.spec-first/.developer`
- `.spec-first/workspace/<developer>/`
- 个人 `index.md`
- 初始 `journal-N.md`

作用：

- 建立会话归属
- 让后续记录能持续累积

参考：

- [`workflow.md`](/Users/kuang/xiaobu/spec-first/.spec-first/workflow.md#L21)
- [`workspace/index.md`](/Users/kuang/xiaobu/spec-first/.spec-first/workspace/index.md#L36)

### 2.2 收集当前上下文

接着执行 `get_context.py`，把当前环境状态拉出来。

产物：

- developer
- git branch
- working tree 状态
- 最近提交
- 活跃任务
- journal 文件状态

作用：

- 判断项目是否已经有在跑的任务
- 判断当前代码是否干净
- 判断是否已经有人写过 spec-first 相关记录

参考：

- [`workflow.md`](/Users/kuang/xiaobu/spec-first/.spec-first/workflow.md#L43)
- [`session_context.py`](/Users/kuang/xiaobu/spec-first/.spec-first/scripts/common/session_context.py#L115)

### 2.3 判断 spec 是否可用

这是首次接入的分水岭。

如果 `.spec-first/spec/` 还是空模板，说明项目还没有 spec-first 可注入的“专属知识”。这时不能直接进入普通功能开发，否则 `before-dev` 和 `check` 会失去项目约束。

判断结果：

- spec 空
- spec 只有模板
- spec 已经有真实 project-specific 内容

### 2.4 spec 为空时先 bootstrap

如果 spec 为空，就先创建 bootstrap task。

bootstrap 任务的本质：

- 不写业务功能
- 先把现有代码的真实风格写进 spec
- 让后续任务可用 `before-dev` 自动注入项目规范

bootstrap 的产物：

- `task.json`
- `prd.md`
- backend / frontend guidelines
- session 记录

bootstrap PRD 关注的是：

- 要补哪些规范文件
- 从什么真实代码中抽取规则
- 怎么判断填写完成

参考：

- [`create_bootstrap.py`](/Users/kuang/xiaobu/spec-first/.spec-first/scripts/create_bootstrap.py#L53)

### 2.5 spec 可用时直接进入第一轮需求迭代

如果项目已经有可用 spec，首次接入就可以直接进入第一轮需求。

但这里仍然要做一件事：

- 先确认 `before-dev` 要读哪些 spec index
- 再创建任务、写 PRD、初始化上下文

也就是说，哪怕 spec 已经存在，首次接入也要把“怎么使用这些规范”先跑通。

### 2.6 创建首个可交付任务

首次接入后第一条真正的需求任务，会按照标准任务流创建。

产物：

- `.spec-first/tasks/<date>-<slug>/task.json`
- 默认 `next_action`
- `base_branch`

关键点：

- 任务状态从这里开始进入 `planning`
- 任务会成为第一次真实交付的载体

参考：

- [`task_store.py`](/Users/kuang/xiaobu/spec-first/.spec-first/scripts/common/task_store.py#L147)

### 2.7 写 PRD

这一阶段会产出标准需求 PRD。

和 bootstrap PRD 的差异：

- bootstrap PRD 是“补规范”
- 功能 PRD 是“交付需求”

功能 PRD 的标准内容：

- Goal
- Requirements
- Acceptance Criteria
- Technical Notes

### 2.8 初始化任务上下文

首次接入的第一条需求任务，必须把上下文注入跑通。

产物：

- `implement.jsonl`
- `check.jsonl`
- `debug.jsonl`

默认内容：

- `implement.jsonl`
  - `workflow.md`
  - 对应 package/layer 的 `index.md`
- `check.jsonl`
  - `finish-work`
  - `check`
- `debug.jsonl`
  - `check`

这一步的意义是把“项目知识”变成可自动注入的机器可读配置。

参考：

- [`task_context.py`](/Users/kuang/xiaobu/spec-first/.spec-first/scripts/common/task_context.py#L149)

### 2.9 设置当前任务并进入执行态

接下来通过 `task start` 把任务切成当前任务。

然后如果走多代理路径，`start.py` 会：

1. 检查 `prd.md`
2. 检查 `branch`
3. 创建或复用 worktree
4. 写 `.spec-first/.current-task`
5. 启动执行代理

产物：

- worktree
- `.current-task`
- `.agent-log`
- `.session-id`
- 更新后的 `task.json`

参考：

- [`start.py`](/Users/kuang/xiaobu/spec-first/.spec-first/scripts/multi_agent/start.py#L240)

### 2.10 收尾记录

第一次接入后的首个任务，收尾时必须把经验记录下来。

`add_session.py` 会写入：

- session 标题
- 日期
- task
- package
- branch
- summary
- main changes
- commits
- testing
- status

同时更新：

- `journal-N.md`
- `workspace/index.md`

参考：

- [`add_session.py`](/Users/kuang/xiaobu/spec-first/.spec-first/scripts/add_session.py#L141)

### 2.11 每一步对应的 skill / 命令

下面这张表把“流程步骤”和“实际执行的 skill 或脚本命令”对齐。  
注意：有些步骤不是 skill，而是 spec-first 的 Python 脚本或基础命令。

| 步骤 | 对应 skill / 命令 | 类型 | 说明 |
|---|---|---|---|
| 初始化开发者身份 | `python3 ./.spec-first/scripts/init_developer.py <name>` | 脚本 | 创建 `.spec-first/.developer` 和 workspace |
| 读取当前上下文 | `python3 ./.spec-first/scripts/get_context.py` | 脚本 | 获取 git、tasks、journal 等运行时状态 |
| 发现可用 spec | `python3 ./.spec-first/scripts/get_context.py --mode packages` | 脚本 | 找到可注入的 package/layer |
| 读取规范 | `cat .spec-first/spec/<package>/<layer>/index.md` + `cat .spec-first/spec/guides/index.md` | 脚本/读取 | 进入 before-dev 的实际输入源 |
| 注入项目规范 | `/spec:before-dev` | skill | 把 spec 和 guides 注入到开发上下文 |
| 规范为空时 bootstrap | `python3 ./.spec-first/scripts/create_bootstrap.py [project-type]` | 脚本 | 生成 bootstrap task 和 bootstrap PRD |
| 复杂需求澄清 | `/spec:brainstorm` | skill | 需求不清晰、存在多个方案时使用 |
| 创建首个需求任务 | `python3 ./.spec-first/scripts/task.py create "<title>" --slug <name>` | 脚本 | 创建 task.json 和任务目录 |
| 编写 PRD | 手工编辑 `prd.md`，或由 brainstorm 产出 | 产物 | 把需求写成可执行契约 |
| 初始化任务上下文 | `python3 ./.spec-first/scripts/task.py init-context <dir> <dev_type>` | 脚本 | 生成 implement/check/debug jsonl |
| 设置当前任务 | `python3 ./.spec-first/scripts/task.py start <dir>` | 脚本 | 切换当前任务并触发 hooks |
| 进入执行阶段 | `/spec:start` 或 `python3 ./.spec-first/scripts/multi_agent/start.py <task-dir>` | skill/脚本 | 进入 worktree 执行和代理启动 |
| 再注入规范 | `/spec:before-dev` | skill | 在开始修改代码前重新加载项目规范 |
| 检查质量 | `/spec:check` | skill | 做单层质量检查和规范对齐 |
| 跨层检查 | `/spec:check-cross-layer` | skill | 检查跨层数据流、重复逻辑、路径一致性 |
| 收尾复核 | `/spec:finish-work` | skill | 做最终完整性检查和交付确认 |
| 记录会话 | `/spec:record-session` 或 `python3 ./.spec-first/scripts/add_session.py ...` | skill/脚本 | 写 journal 和 workspace index |
| 事后复盘 | `/spec:break-loop` | skill | 总结 bug 根因和防复发措施 |
| 归档 / PR | `python3 ./.spec-first/scripts/task.py archive <task>` / `task.py create-pr` | 脚本 | 结束任务生命周期 |

---

## 3. 首次接入时的上下文管理

### 3.1 长期上下文

首次接入时，长期上下文还不完整，所以最重要的是先补齐：

- `.spec-first/spec/`
- `spec/guides/`
- `workspace/` 历史记录

如果这些内容不够，后续 AI 只能依赖通用知识，结果就会偏离项目实际风格。

### 3.2 任务上下文

任务上下文是每个需求自己的“工作包”。

首次接入时，它由以下内容构成：

- `task.json`
- `prd.md`
- `implement.jsonl`
- `check.jsonl`
- `debug.jsonl`

bootstrap 任务和功能任务都遵循这个模式，只是内容目标不同。

### 3.3 会话上下文

会话上下文决定 AI 当前看到的是哪一段工作历史。

首次接入时尤其要靠这些信息防止上下文漂移：

- 当前 developer
- 当前 branch
- 当前 worktree
- 当前任务
- 最近 journal

---

## 4. 首次接入的产物清单

| 阶段 | 产物 | 位置 | 说明 |
|---|---|---|---|
| developer init | identity + workspace | `.spec-first/.developer`, `.spec-first/workspace/` | 建立会话归属 |
| context read | 当前状态 | 命令输出 | 确认项目现状 |
| bootstrap | spec 指南 + bootstrap PRD | `.spec-first/tasks/00-bootstrap-guidelines/` | 补齐项目规范 |
| first task | task.json + PRD | `.spec-first/tasks/<task>/` | 创建首个真实需求任务 |
| context init | implement/check/debug jsonl | `.spec-first/tasks/<task>/` | 固化上下文注入 |
| execution | worktree + log + current-task | worktree 内 | 进入真实研发 |
| record | journal + index | `.spec-first/workspace/<dev>/` | 沉淀经验 |

---

## 5. 一句话总结

已有项目第一次接入 spec-first 时，流程不是“直接开始写第一个需求”，而是：

1. 先建立开发者和会话上下文
2. 再判断项目规范是否已可注入
3. 如果没有，就先 bootstrap spec
4. 有了 spec 之后，再进入标准需求迭代流

本质上，第一次接入是在补“项目知识层”，之后才是补“需求执行层”。
