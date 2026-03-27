# Spec Kit / Spec-First / Superpowers 对比分析

本文汇总三个项目的主流程与设计差异，目标是回答三个问题：

1. 三者的主流程分别是什么
2. 它们在方法论、执行机制、技能系统上有什么不同
3. 对 `spec-first` 当前的 Claude 集成，哪些思路值得借鉴

---

## 1. 三者主流程概览

### 1.1 Spec Kit

Spec Kit 的主流程是一个标准化的 spec-driven pipeline：

```text
specify init
  -> constitution
  -> specify
  -> clarify
  -> plan
  -> tasks
  -> analyze (optional)
  -> implement
  -> finish-work
```

它的核心是把“规格 -> 方案 -> 任务 -> 实施”标准化，并通过命令把流程固化下来。

### 1.2 Spec-First

Spec-First 的主流程更偏执行系统和平台适配：

```text
/spec:start
  -> /spec:brainstorm (when needed)
  -> /before-dev
  -> dispatch
  -> implement agent
  -> check agent
  -> /spec:finish-work
```

它不只是写规格，还包含：

- hooks
- subagent pipeline
- task lifecycle
- multi-session / worktree
- 平台适配

### 1.3 Superpowers

Superpowers 的主流程是技能驱动的开发工作流：

```text
agent startup
  -> detect task
  -> brainstorming
  -> using-git-worktrees
  -> writing-plans
  -> subagent-driven-development / executing-plans
  -> test-driven-development
  -> requesting-code-review
  -> finishing-a-development-branch
```

它强调的是：**技能自动触发 + 规划/执行分离 + 证据优先**。

---

## 2. 三者的本质区别

### 2.1 Spec Kit：方法论 + 模板化生成器

Spec Kit 的重点是把 spec-driven development 变成一条清晰的“命令式方法论”。

它更像：

- 规范需求如何写
- 规范技术计划如何写
- 规范任务如何拆
- 规范实现如何开始

它偏重“流程模板”，但对运行时 agent 协作、hook 注入、任务状态控制没有 spec-first 这么重。

### 2.2 Spec-First：执行系统 + 平台适配层

Spec-First 在 Spec Kit 的方法论之上，进一步加入了：

- 任务上下文持久化
- hook 注入
- agent 角色分工
- check loop
- 平台差异适配

它更像一个**可执行的 agent 操作系统**，重点是让 AI 在真实项目里稳定执行，而不是只产出文档。

### 2.3 Superpowers：技能系统 + 工程实践库

Superpowers 的重点不在 spec 文件本身，而在于：

- 一组可组合技能
- 一个统一的开发过程
- 一套强约束的工程实践

它的命令层很多已经标记为 deprecated，主入口已经切到 skills：

- `brainstorming`
- `writing-plans`
- `executing-plans`
- `subagent-driven-development`
- `test-driven-development`
- `requesting-code-review`
- `finishing-a-development-branch`

它更像“把优秀工程实践打包成可自动触发的技能库”。

---

## 3. 流程对比

| 维度 | Spec Kit | Spec-First | Superpowers |
| --- | --- | --- | --- |
| 主入口 | `specify init` + `/speckit.*` | `/spec:start` + Claude commands | Agent startup + 自动触发 skills |
| 核心流程 | specify -> plan -> tasks -> implement | start -> brainstorm -> implement/check -> finish | brainstorm -> plan -> execute -> TDD -> review -> finish |
| 主要产物 | spec / plan / tasks | task context / hooks / agent state / specs | skills / plans / worktree flow |
| 执行机制 | 命令驱动 | 命令 + hook + agent | skill-driven, auto-triggered |
| 适配范围 | 多 agent，但偏方法论 | 多平台、多 agent、多 hook | 多技能、多工作流 |
| 重心 | 规范开发流程 | 让流程稳定执行 | 让技能在正确时机自动生效 |

---

## 4. 关键差异

### 4.1 入口层

- **Spec Kit**：从 CLI 初始化开始，命令链清晰
- **Spec-First**：从 `/spec:start` 进入，命令与 hook 绑定更深
- **Superpowers**：从 agent 启动开始，技能会自动触发

### 4.2 规划层

- **Spec Kit**：`specify -> clarify -> plan -> tasks`
- **Spec-First**：`brainstorm -> task context -> workflow -> selected skills`
- **Superpowers**：`brainstorm -> writing-plans -> executing-plans`

### 4.3 执行层

- **Spec Kit**：实现由命令引导，但执行闭环较轻
- **Spec-First**：`dispatch / implement / check` + hooks + loop，执行闭环最强
- **Superpowers**：通过 `subagent-driven-development` + `TDD` + code review 形成强工程闭环

### 4.4 技能层

- **Spec Kit**：主要是流程模板和 preset
- **Spec-First**：技能/上下文/任务状态/平台能力混合
- **Superpowers**：明确把技能当成一等公民

---

## 5. 对 Spec-First 的启发

### 5.1 可以借鉴 Spec Kit 的地方

- `specify -> plan -> tasks` 的清晰阶段化结构
- `clarify` 作为显式歧义消除步骤
- 用模板和检查清单强制生成质量

### 5.2 可以借鉴 Superpowers 的地方

- skills 作为稳定能力单元
- `brainstorming / writing-plans / TDD / code review` 的工程化拆分
- `subagent-driven-development` 的任务切分与审查方式
- “证据优先”而不是只看 agent 自述成功

### 5.3 Spec-First 自己已经做得更深的地方

- hook 注入
- task state 持久化
- check loop
- 多平台适配
- 任务生命周期控制

这部分已经超出了 Spec Kit 和 Superpowers 当前文档中的方法论层，属于执行系统层。

---

## 6. 适用边界

### 6.1 Spec Kit 适合什么

- 想把 spec-driven 方法标准化
- 想从需求、计划、任务三步走
- 想要轻量、方法论清晰的开发流程

### 6.2 Spec-First 适合什么

- 真实项目的长期执行
- 需要上下文注入、任务追踪、hook 自动化
- 需要 Claude / iFlow / Codex 等平台适配

### 6.3 Superpowers 适合什么

- 想把技能和工程实践做成可自动触发的 workflow
- 想强化 TDD、代码审查、分阶段实现
- 想要一套“技能库 + 执行纪律”的开发方式

---

## 7. 推荐结论

如果按“方法论深度 -> 执行强度 -> 可扩展性”排序：

1. **Spec Kit** 最轻，最适合作为 SDD 方法入口
2. **Superpowers** 最强调技能和工程纪律，适合做能力库参考
3. **Spec-First** 最接近真实可执行系统，最适合承接长期项目

对当前 `spec-first` 的 Claude 集成来说，最值得借鉴的组合是：

- 用 **Spec Kit** 的阶段化流程做主骨架
- 用 **Superpowers** 的技能化拆分做能力层
- 用 **Spec-First** 的 hooks / task state / platform adapter 做执行层

一句话：

**Spec Kit 定流程，Superpowers 定技能，Spec-First 定执行。**

