# planning-with-files 项目架构篇

文档日期：2026-03-22
分析对象：`/Users/kuang/xiaobu/planning-with-files`
版本基线：`README.md` 标注版本 `2.18.2`，`SKILL.md` metadata 显示 `2.21.0`
分支基线：`master`

## 1. 项目一句话定义

`planning-with-files` 不是一个通用 agent 框架，而是一套“把任务规划、研究发现和会话进度持久化到 3 个 markdown 文件里”的 Manus 风格上下文工程 skill。

它由四部分组成：

1. 一个核心 `planning-with-files` skill。
2. 一组自动 hooks，用于在关键时刻反复读取计划、提醒更新状态、检查是否完成。
3. 三个固定模板文件：`task_plan.md`、`findings.md`、`progress.md`。
4. 少量辅助脚本，用于初始化规划文件、会话恢复、完成检查和多 IDE 目录同步。

可以把它理解为：

```text
         planning-with-files
                  |
   +--------------+--------------+----------------+
   |                             |                |
单 skill 工作流层             Hook 自动提醒层      文件记忆层
   |                             |                |
何时建计划/何时写发现           重读计划/提醒更新/完结检查  task_plan/findings/progress
   |                             |                |
让 agent 按 3 文件模式工作       防止目标漂移            把上下文从内存转移到磁盘
```

## 2. 顶层目录结构

```text
planning-with-files/
├── README.md                                项目定位、安装、工作原理、平台支持
├── skills/planning-with-files/              核心 skill 目录
│   ├── SKILL.md
│   ├── reference.md
│   ├── examples.md
│   ├── templates/
│   │   ├── task_plan.md
│   │   ├── findings.md
│   │   └── progress.md
│   └── scripts/
│       ├── init-session.sh / .ps1
│       ├── session-catchup.py
│       └── check-complete.sh / .ps1
├── commands/                                Claude Code 插件命令入口
├── scripts/                                 仓库级辅助脚本与多 IDE 同步
├── docs/                                    各 IDE 安装说明、工作流图、评估结果
├── templates/                               根目录同构模板
└── examples/                                示例项目
```

核心判断：

- 核心资产是 `skills/planning-with-files/SKILL.md`。
- 这个项目是“单 skill + hooks + 模板”的体系，不是多 skill 编排系统。
- `docs/evals.md` 说明它把“workflow fidelity” 当成一个可量化卖点。
- 根目录 `templates/` 与 skill 目录下 `templates/` 并存，说明它同时服务技能安装和仓库开发维护。

### 2.1 核心能力 / 文件功能表

| 能力 / 文件 | 类别 | 主要功能 | 典型输入 | 典型输出 |
| --- | --- | --- | --- | --- |
| `planning-with-files` | 核心 skill | 对复杂任务强制启用 3 文件规划工作流 | 多步骤任务、研究任务、预计 >5 次工具调用的工作 | `task_plan.md`、`findings.md`、`progress.md` |
| `task_plan.md` | 规划文件 | 记录目标、当前阶段、阶段状态、决策和错误 | 当前任务目标、阶段拆分 | 计划骨架、phase 状态、错误表 |
| `findings.md` | 研究文件 | 记录研究发现、技术决策、资源和问题 | 搜索结果、代码发现、文档总结 | 结构化 findings |
| `progress.md` | 进度文件 | 记录会话日志、动作、测试结果和错误 | 本轮动作、执行结果 | 进度日志 |
| `commands/plan.md` | 命令入口 | 通过 `/plan` 或相关命令触发 skill 并初始化 3 文件 | Claude Code 命令调用 | planning session 启动 |
| `commands/status.md` | 命令入口 | 读取 `task_plan.md` 并生成简短状态摘要 | 现有 planning files | phase 状态摘要 |
| `init-session.sh` | 辅助脚本 | 快速初始化 3 个规划文件 | 项目目录、可选项目名 | 初始 markdown 文件 |
| `session-catchup.py` | 会话恢复 | 扫描前一轮会话记录，恢复被 `/clear` 或上下文截断丢失的上下文 | 项目路径、Claude/OpenCode session 存储 | catchup report |
| `check-complete.sh` | 完成检查 | 检查 `task_plan.md` 所有 phase 是否完成 | `task_plan.md` | 完成/未完成状态提示 |
| `check-continue.sh` | 集成检查 | 检查 Continue IDE 所需集成文件是否齐全 | Continue 安装目录 | 集成是否完整的检查结果 |

## 3. 核心设计思想

### 3.1 用文件系统代替易失上下文

这个项目最核心的设计思想就是 README 和 `reference.md` 反复强调的：

```text
Context Window = RAM
Filesystem = Disk
```

换句话说：

- 上下文窗口是易失、有限的。
- 文件系统是持久、可反复读取的。
- 所以只要重要，就必须写到磁盘，而不是仅存在会话里。

### 3.2 不追求“什么都记”，而追求“三类信息分仓”

这个项目没有用一个大文件保存一切，而是显式拆成三种职责：

- `task_plan.md`：目标、阶段、决策、错误
- `findings.md`：研究和发现
- `progress.md`：会话日志和测试结果

这体现出一个非常明确的上下文工程取舍：

- 计划和状态分开
- 事实发现和过程日志分开
- 这样 agent 在需要时可以只读取最相关的文件

### 3.3 hooks 不是附属功能，而是注意力管理机制

`SKILL.md` 里定义的 hooks 非常关键：

- `PreToolUse`：在 `Write|Edit|Bash|Read|Glob|Grep` 前自动读取 `task_plan.md` 前 30 行
- `PostToolUse`：在写文件后提醒更新 phase 状态
- `Stop`：在停止时检查所有 phase 是否完成

这些 hook 的本质不是“自动化炫技”，而是：

- 把目标重新推回最近注意力窗口
- 防止做完了工作却忘了更新状态
- 防止还没完成就草率停止

### 3.4 这是编码偏好 skill，不是能力增强 skill

`docs/evals.md` 已经点明：这是一个 **encoded preference skill**。

也就是说：

- agent 原本就有能力规划任务
- 但没有这个 skill 时，它不会稳定采用 3 文件结构
- skill 的价值在于“强制 agent 采用特定 workflow”

所以这个项目的本质是：

- 固化偏好
- 强化纪律
- 提高结构化输出一致性

## 4. 项目运行主链路

### 4.1 安装链路

README 展示了两条主要路径：

1. Agent Skills / `npx skills add`
2. Claude Code plugin marketplace

这说明项目本身支持两种形态：

- 作为跨 agent skill 安装
- 作为 Claude Code 插件安装

设计含义：

- Skill 本体是可移植的。
- Claude plugin 只是增强模式，主要用于命令别名和 hooks 集成。

### 4.2 会话启动 / task 启动链路

典型启动流程如下：

```text
用户发起复杂任务
  -> agent 命中 planning-with-files skill
  -> 检查是否存在上一轮 session 未同步上下文
  -> 若需要则运行 session-catchup.py
  -> 创建 task_plan.md / findings.md / progress.md
  -> 进入工作循环
```

这说明它和普通 planning skill 的不同点在于：

- 真正开始前先做 session recovery
- 把“接上次没做完的工作”当成一等能力

### 4.3 工作循环链路

`docs/workflow.md` 把它描述得很清楚：

```text
PreToolUse
  -> 自动重读 task_plan.md
  -> 执行研究 / 实现 /搜索 / 编辑
  -> 把研究写到 findings.md
  -> 把动作写到 progress.md
  -> phase 完成后更新 task_plan.md
  -> 如有错误，记录在 task_plan.md 和 progress.md
  -> 继续下一轮
```

这不是完整的 agent OS，而是一个非常聚焦的 “attention refresh loop”。

### 4.4 结束链路

结束时 `Stop` hook 会运行：

```text
check-complete.sh
  -> 统计总 phase 数
  -> 统计 complete / in_progress / pending
  -> 输出当前任务是否全部完成
```

它不会阻止退出，但会给出状态反馈。

因此结束闭环是：

- 不强制拦截
- 但强制做完成度提示

## 5. 会话流程自动化

### 5.1 自动化不是多技能接力，而是单技能内循环

和 `superpowers` 最大的不同在于，`planning-with-files` 的自动化几乎都发生在一个 skill 内部。

它的抽象是：

```text
任务触发
  -> 建 3 个文件
  -> 每次操作前重读计划
  -> 每次关键发现写 findings
  -> 每次阶段进展写 progress/task_plan
  -> 停止前检查完成度
```

所以它不是“跨多个 skill 的 stage machine”，而是“单 skill 的持久化工作循环”。

### 5.2 自动化阶段表

| 阶段 | 自动化动作 | 人工介入点 | 产物 |
| --- | --- | --- | --- |
| 会话恢复 | 扫描旧 session 并输出 catchup 报告 | 判断是否同步旧上下文 | catchup report |
| 规划初始化 | 建立 3 个 planning 文件 | 给任务描述或确认任务 | `task_plan.md`、`findings.md`、`progress.md` |
| 注意力刷新 | 每次关键工具调用前自动重读 `task_plan.md` | 无 | 最近目标重新进入上下文 |
| 发现沉淀 | 每 2 次 view/search/browser 操作后要求写 findings | 决定如何总结发现 | `findings.md` |
| 进度记录 | 每次阶段推进后更新状态和进度日志 | 标记 phase 是否完成 | `task_plan.md`、`progress.md` |
| 错误持久化 | 每次错误发生时记录错误与解决方案 | 决定下一种尝试方式 | 错误表 |
| 完成检查 | 结束时统计 phase 完成度 | 判断是否继续 | 完成度摘要 |

### 5.3 每个自动化部件的职责

| 部件 | 自动化职责 |
| --- | --- |
| `PreToolUse` hook | 在关键工具调用前自动重读计划，减少 goal drift |
| `PostToolUse` hook | 在文件写入后提醒更新 phase 状态 |
| `Stop` hook | 在结束时做 completion summary |
| `session-catchup.py` | 在 context clear 或新会话后恢复未同步上下文 |
| `init-session.sh` | 一键初始化 3 文件结构 |
| `commands/status.md` | 快速回答 “我现在做到哪了？” |

## 6. 脚本与命令层逻辑

### 6.1 `init-session.sh`

作用：

- 如果文件不存在，就生成 `task_plan.md`、`findings.md`、`progress.md`
- 带最小默认结构
- 给用户一个即刻可用的 planning scaffold

这是最直接的“3 文件模式脚手架”。

### 6.2 `session-catchup.py`

这是仓库里最有技术含量的脚本之一。

主要功能：

- 探测当前 IDE 类型（Claude Code / OpenCode）
- 将项目路径映射到 Claude Code session 存储路径
- 扫描历史 session 中 planning 文件的最后更新时间
- 抽取之后的消息和工具调用
- 生成 catchup 线索，帮助恢复被截断上下文

它的本质是一个“会话日志回放 / 增量恢复器”。

### 6.3 `check-complete.sh`

作用：

- 读取 `task_plan.md`
- 统计 phase 总数和状态
- 输出 “全部完成” 或 “还有多少 phase 进行中 / 待处理”

它不做严格阻断，但提供状态边界。

### 6.4 `commands/plan.md` 与 `commands/status.md`

它们不是独立逻辑，而是 skill 的轻量命令入口：

- `/plan`：启动 planning-with-files skill 并创建 3 文件
- `/plan:status`：读取 `task_plan.md` 生成 compact summary

这说明命令层是“易用性包装”，不是核心实现。

## 7. 安全边界与工程取舍

### 7.1 安全边界非常明确

`SKILL.md` 明确写了一个安全风险：

- `task_plan.md` 会被 `PreToolUse` hook 反复注入上下文
- 所以它是 prompt injection 高价值目标

因此规则是：

- 外部 web/search 内容只能写进 `findings.md`
- 不能把不可信内容写进 `task_plan.md`
- 不能对外部指令样文本直接执行

这是一个非常重要的设计点，因为它说明作者已经意识到：

- “反复重读计划”虽然有用
- 但会引入注入放大风险

### 7.2 选择“强结构”而不是“快速完成”

从 `docs/evals.md` 看，这个 skill 平均：

- token 更多
- 时间更长

但换来的是：

- 3 文件模式更稳定
- 结构化产出更一致
- workflow fidelity 显著提升

因此工程取舍非常清楚：

- 牺牲一点速度
- 换持久化结构和可恢复性

## 8. 测试与可验证性

### 8.1 测试对象是 workflow fidelity

它不像 `cc-sdd` 那样测安装正确性，也不像 `superpowers` 那样测多 skill 编排。

它测的是：

- 有没有创建 3 个文件
- `task_plan.md` 是否有 goal / phases / status / errors
- 研究内容是否写到了 `findings.md`
- 盲测输出是否比无 skill 更符合 workflow 预期

### 8.2 benchmark 是项目卖点的一部分

`docs/evals.md` 记录了：

- 30 个客观断言
- with_skill 96.7% pass rate
- without_skill 6.7%
- 3/3 blind A/B wins

这说明该项目把“skill 是否真的改变 agent 行为”当成核心证明材料。

## 9. 如何理解整个项目

如果用一句更工程化的话总结：

```text
planning-with-files = 单一文件化规划 skill
                    + 3 个持久化工作记忆文件
                    + 注意力刷新 hooks
                    + 会话恢复脚本
                    + workflow fidelity 评估体系
```

如果用工作角色来理解：

```text
用户任务
 |
 +--> task_plan.md: 目标、阶段、错误
 |
 +--> findings.md: 发现、研究、决策
 |
 +--> progress.md: 会话日志、测试结果
 |
 +--> hooks: 重读计划、提醒更新、检查完成
 |
 +--> scripts: 初始化 / 恢复 / 校验
```

## 10. 结论

这个仓库的真正价值不在“功能很多”，而在它把一个非常聚焦的上下文工程模式做得足够完整：

- 有单一明确的方法论。
- 有固定 3 文件数据模型。
- 有 hooks 做注意力管理。
- 有会话恢复能力。
- 有完成检查。
- 有基于 benchmark 的行为验证。

所以从本质上说：

- `skills` 更像 workflow 素材库。
- `superpowers` 更像多 skill 的软件工程流程框架。
- `cc-sdd` 更像 spec-driven workflow 安装器。
- `planning-with-files` 更像 “Manus 风格持久化工作记忆 skill”。
