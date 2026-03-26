# Spec-First Agent & Skill 汇总

> 本文档汇总 spec-first 项目中所有 Agent 和 Skill 定义

---

## 阅读路径

如果你关注的是当前这轮关于 `dispatch / runtime / workflow topology / decision_hints` 的方案演进，建议按下面顺序阅读：

### 方案总入口

1. [整体方案-目标架构与三阶段实施.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/整体方案-目标架构与三阶段实施.md)
   - 当前主方案文档
   - 已收口总体目标、终局架构、Phase 1/2/3 可执行拆分
   - 已明确：
     - Phase 1 最小字段只有 `implement.mode` 和 `check.verify_commands`
     - `workflow_type` 只管 topology
     - `--preset` 只管 policy enhancement
     - 当前正确收口点是 `task_store.py` 作为 task compiler 入口

2. [Phase1-代码实施清单.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/Phase1-代码实施清单.md)
   - Phase 1 的逐文件实施清单
   - 已拆到新增模块、必改文件、验证清单、成功标准
   - 适合在开始改代码前直接对照执行

3. [dispatch-runtime完整技术方案.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/dispatch-runtime完整技术方案.md)
   - 当前推荐的总方案
   - 更偏架构总览与设计 reasoning
   - 适合看整体背景、原则和技术权衡

### 规则与契约

4. [phase-decision-guide.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/phase-decision-guide.md)
   - phase policy 语义说明
   - 明确哪些规则属于 implement/check/debug/finish

5. [decision-hints-schema.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/decision-hints-schema.md)
   - `task.json.decision_hints` 的最小契约
   - 明确 hard policy / soft policy / fallback / 生产者与消费者

### 流程配置化

6. [next_action-工作流配置化最小可行版.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/next_action-工作流配置化最小可行版.md)
   - `next_action` 的最小 topology 配置化方案
   - 只保留 `default / quick-fix / docs-only`

7. [第二阶段快速集成方案.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/第二阶段快速集成方案.md)
   - 第一阶段完成后如何快速接入 `with-tdd` 和 `debug`
   - 明确为什么暂不快速接 `with-review` 和 `research`
   - 当前应结合总方案中的 `--preset` 分层一起理解

### 历史分析稿

以下文档可作为背景材料阅读，但不再代表当前推荐落地方案：

8. [dispatch-de决策集成方案.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/dispatch-de决策集成方案.md)
   - 第一版思路，强调“要显式决策层”

9. [next_action-工作流配置化技术方案.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/next_action-工作流配置化技术方案.md)
   - 更大一版 workflow 配置化思路
   - 适合对比为什么当前选择最小可行版

### 辅助背景

10. [tdd-analysis.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/tdd-analysis.md)
11. [tdd-best-practice.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/tdd-best-practice.md)
12. [implement-agent.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/implement-agent.md)
13. [skill-spec-first分析.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/skill-spec-first分析.md)

### 当前推荐结论

当前推荐路线可以浓缩为四句话：

1. `next_action` 只管 workflow topology
2. `decision_hints` 只管最小 phase policy
3. runtime hooks 执行最关键 gate
4. LLM 自主性保留在 phase execution layer

当前推荐实施顺序可以浓缩为三句话：

1. Phase 1 先落 `workflow_type + next_action + decision_hints`
2. Phase 2 再通过 `--preset` 接入 `with-tdd / debug`
3. Phase 3 最后才扩 schema、能力和多平台收口

---

## 统计概览

| 类型 | 数量 | 说明 |
|------|------|------|
| **Agents** | 6 | 核心 Agent 类型（跨平台复用） |
| **Skills/Commands** | 16 | 核心 Skill 定义（跨平台复用） |
| **支持平台** | 8 | Claude, Cursor, Codex, Kiro, Qoder, iFlow, OpenCode, CodeBuddy |

---

## 1. Agents 汇总

### 1.1 Agent 架构图

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SPEC-FIRST AGENT 架构                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

                          ┌──────────────────────┐
                          │   用户请求/任务       │
                          └──────────┬───────────┘
                                     │
                                     ▼
                    ┌────────────────────────────────┐
                    │         plan Agent             │
                    │  ─────────────────────────────│
                    │  • 分析需求，生成任务目录        │
                    │  • 可拒绝不合理需求             │
                    │  • 输出: 配置好的任务目录        │
                    └────────────────┬───────────────┘
                                     │
                                     ▼
                    ┌────────────────────────────────┐
                    │       dispatch Agent           │
                    │  ─────────────────────────────│
                    │  • 纯调度器，无业务逻辑          │
                    │  • 按阶段顺序调用 subagent      │
                    │  • 不读取 specs                │
                    └────────────────┬───────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              ▼                      ▼                      ▼
    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
    │  research Agent │    │ implement Agent │    │   check Agent   │
    │  ───────────────│    │  ───────────────│    │  ───────────────│
    │  • 纯研究        │    │  • 代码实现      │    │  • 代码质量检查  │
    │  • 不修改代码    │    │  • 禁止 commit   │    │  • 自我修复问题  │
    │  • 搜索/分析     │    │  • 遵循 specs    │    │  • 验证规范遵循  │
    └─────────────────┘    └─────────────────┘    └─────────────────┘
                                     │
                                     ▼ (如果发现问题)
                          ┌──────────────────────┐
                          │    debug Agent       │
                          │  ────────────────────│
                          │  • 精确修复问题       │
                          │  • 不重构            │
                          │  • 验证修复          │
                          └──────────────────────┘
```

### 1.2 Agent 详细列表

| 名称 | 职责 | 权限限制 | 模型 |
|------|------|----------|------|
| **research** | 代码和技术搜索专家，纯研究不修改代码 | 只读，无修改权限 | opus |
| **plan** | 多 Agent 流水线规划器，分析需求生成任务目录 | 可拒绝不合理需求 | opus |
| **dispatch** | 多 Agent 流水线调度器，按阶段顺序调用 subagent | 纯调度，不读 specs | opus |
| **implement** | 代码实现专家，理解 specs 和需求后实现功能 | 禁止 git commit | opus |
| **check** | 代码质量检查专家，根据 specs 审查代码并自我修复 | 可修改代码 | opus |
| **debug** | 问题修复专家，精确修复问题并验证 | 不重构，精确修复 | opus |

### 1.3 平台模板分布

| 平台 | Agent 模板位置 | 格式差异 |
|------|---------------|----------|
| **Claude Code** | `packages/cli/src/templates/claude/agents/` | `model: opus` |
| **iFlow** | `packages/cli/src/templates/iflow/agents/` | `color: orange` (UI 属性) |
| **OpenCode** | `packages/cli/src/templates/opencode/agents/` | `mode: primary/subagent` |

### 1.4 Agent 工具权限矩阵

```
┌─────────────┬───────┬───────┬───────┬───────┬───────┬───────┐
│   Tool      │research│ plan │dispatch│implement│ check │ debug │
├─────────────┼───────┼───────┼───────┼───────┼───────┼───────┤
│ Read        │   ✓   │   ✓   │   ✓   │   ✓   │   ✓   │   ✓   │
│ Write       │   ✗   │   ✓   │   ✗   │   ✓   │   ✓   │   ✓   │
│ Edit        │   ✗   │   ✓   │   ✗   │   ✓   │   ✓   │   ✓   │
│ Bash        │   ✓   │   ✓   │   ✓   │   ✓   │   ✓   │   ✓   │
│ Glob        │   ✓   │   ✓   │   ✓   │   ✓   │   ✓   │   ✓   │
│ Grep        │   ✓   │   ✓   │   ✓   │   ✓   │   ✓   │   ✓   │
│ Git Commit  │   ✗   │   ✗   │   ✗   │   ✗   │   ✗   │   ✗   │
│ Task (调用) │   ✓   │   ✓   │   ✓   │   ✗   │   ✗   │   ✗   │
└─────────────┴───────┴───────┴───────┴───────┴───────┴───────┘
```

---

## 2. Skills/Commands 汇总

### 2.1 Skill 分类

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SPEC-FIRST SKILL 分类                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  【会话管理类】                                                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  start          启动 AI 开发会话，初始化上下文                                    │
│  record-session 记录完成的工作进度到日志文件                                      │
│  current-task   列出活动任务并切换当前任务指针                                    │
│  onboard        新团队成员的交互式入职培训                                        │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  【任务规划类】                                                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  brainstorm     协作需求发现，创建任务目录和种子 PRD                               │
│  parallel       多 agent 流水线编排器，分派并行任务到 worktree                    │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  【开发执行类】                                                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  before-dev     实现开始前注入项目编码规范                                        │
│  implement      (由 Agent 执行，非 Skill)                                        │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  【质量保证类】                                                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  check          根据 spec 验证最近编写的代码                                      │
│  check-cross-layer  跨层数据流和一致性检查                                        │
│  finish-work    提交前质量检查清单                                               │
│  break-loop     Bug 深度分析（五个维度）                                          │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  【知识管理类】                                                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  update-spec    将可执行契约和编码知识捕获到 spec 文档                             │
│  create-command 创建新的 skill 文件                                              │
│  integrate-skill 将外部 skill 适配到项目规范                                      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Skill 详细列表

| 名称 | 触发方式 | 描述 | 使用场景 |
|------|----------|------|----------|
| **start** | `/spec:start` | 启动 AI 开发会话，读取 workflow、身份、任务 | 每个 session 开始 |
| **brainstorm** | `/spec:brainstorm` | 协作需求发现，创建任务目录和 PRD | 需求不明确时 |
| **before-dev** | `/spec:before-dev` | 实现前注入项目编码规范 | 编码前必读 |
| **check** | `/spec:check` | 根据 spec 验证代码 | 编码后检查 |
| **check-cross-layer** | `/spec:check-cross-layer` | 跨层数据流验证 | 跨层功能开发 |
| **finish-work** | `/spec:finish-work` | 提交前质量检查清单 | commit 前 |
| **record-session** | `/spec:record-session` | 记录工作进度到日志 | commit 后 |
| **update-spec** | `/spec:update-spec` | 捕获知识到 spec 文档 | 发现新模式时 |
| **break-loop** | `/spec:break-loop` | Bug 深度分析（5 维度） | 修复 bug 后 |
| **parallel** | `/spec:parallel` | 多 agent 并行流水线 | 复杂任务拆分 |
| **current-task** | `/spec:current-task` | 列出/切换当前任务 | 任务管理 |
| **onboard** | `/spec:onboard` | 新成员入职培训 | 团队新成员 |
| **create-command** | `/spec:create-command` | 创建新 skill 文件 | 扩展功能 |
| **integrate-skill** | `/spec:integrate-skill` | 适配外部 skill | 集成外部工具 |
| **improve-ut** | `$improve-ut` | 改进单元测试覆盖率 | 测试增强 |

### 2.3 平台支持矩阵

| Skill | Claude | Cursor | Codex | Kiro | Qoder | iFlow | OpenCode | CodeBuddy |
|-------|--------|--------|-------|------|-------|-------|----------|-----------|
| start | `/spec:start` | `spec-start` | `$start` | skill | skill | `/spec:start` | `/spec:start` | `/spec:start` |
| brainstorm | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| before-dev | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| check | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| check-cross-layer | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| finish-work | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| record-session | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| update-spec | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| break-loop | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| parallel | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| current-task | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| onboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| create-command | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| integrate-skill | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| improve-ut | - | - | ✓ | ✓ | ✓ | - | - | - |

### 2.4 Skill 文件位置

```
packages/cli/src/templates/
├── claude/commands/spec/        # Claude Code 命令
│   ├── start.md
│   ├── brainstorm.md
│   ├── check.md
│   └── ...
├── codebuddy/commands/spec/     # CodeBuddy 命令
├── cursor/commands/             # Cursor 命令 (spec- 前缀)
│   ├── spec-start.md
│   ├── spec-check.md
│   └── ...
├── iflow/commands/spec/         # iFlow 命令
├── opencode/commands/spec/      # OpenCode 命令
├── codex/skills/                # Codex skill (SKILL.md 格式)
│   ├── start/SKILL.md
│   ├── check/SKILL.md
│   └── ...
├── kiro/skills/                 # Kiro skill
└── qoder/skills/                # Qoder skill
```

---

## 3. 工作流程整合

### 3.1 典型开发流程

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           典型开发流程 (Agent + Skill 协作)                       │
└─────────────────────────────────────────────────────────────────────────────────┘

     用户                                                      AI Agent
       │                                                          │
       │  1. /spec:start                                          │
       │─────────────────────────────────────────────────────────>│
       │                                     [Session 初始化]      │
       │                                     读取 workflow/specs   │
       │                                                          │
       │  2. 描述需求                                              │
       │─────────────────────────────────────────────────────────>│
       │                                     [自动分类任务类型]     │
       │                                                          │
       │  如果需求不明确:                                          │
       │  3. /spec:brainstorm                                     │
       │─────────────────────────────────────────────────────────>│
       │                                     [plan Agent]          │
       │                                     创建任务目录 + PRD     │
       │                                                          │
       │  4. /spec:before-dev                                     │
       │─────────────────────────────────────────────────────────>│
       │                                     [注入编码规范]         │
       │                                                          │
       │  5. 开始实现                                              │
       │─────────────────────────────────────────────────────────>│
       │                                     [implement Agent]     │
       │                                     遵循 specs 实现代码    │
       │                                                          │
       │  6. /spec:check                                          │
       │─────────────────────────────────────────────────────────>│
       │                                     [check Agent]         │
       │                                     验证代码 + 自我修复     │
       │                                                          │
       │  7. /spec:finish-work                                    │
       │─────────────────────────────────────────────────────────>│
       │                                     [提交前检查清单]        │
       │                                                          │
       │  8. 用户测试 + commit                                     │
       │<---------------------------------------------------------│
       │                                                          │
       │  9. /spec:record-session                                 │
       │─────────────────────────────────────────────────────────>│
       │                                     [记录到 journal]       │
       │                                                          │
       │  如果修复了 bug:                                          │
       │  10. /spec:break-loop                                    │
       │─────────────────────────────────────────────────────────>│
       │                                     [debug Agent]         │
       │                                     5 维度深度分析         │
       │                                                          │
       │  如果发现了新模式:                                        │
       │  11. /spec:update-spec                                   │
       │─────────────────────────────────────────────────────────>│
       │                                     [更新 spec 文档]       │
       │                                                          │
       ▼                                                          ▼
```

### 3.2 并行任务流程

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           并行任务流程 (/spec:parallel)                          │
└─────────────────────────────────────────────────────────────────────────────────┘

                          ┌──────────────────────┐
                          │   用户请求复杂任务    │
                          └──────────┬───────────┘
                                     │
                                     ▼
                          ┌──────────────────────┐
                          │   /spec:parallel     │
                          └──────────┬───────────┘
                                     │
                                     ▼
                    ┌────────────────────────────────┐
                    │       plan Agent               │
                    │  • 分析任务依赖                 │
                    │  • 拆分子任务                   │
                    │  • 规划并行策略                 │
                    └────────────────┬───────────────┘
                                     │
                                     ▼
                    ┌────────────────────────────────┐
                    │     dispatch Agent             │
                    │  • 创建 worktree               │
                    │  • 分派任务到各 agent          │
                    └────────────────┬───────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              ▼                      ▼                      ▼
    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
    │ Worktree Agent 1│    │ Worktree Agent 2│    │ Worktree Agent 3│
    │  (implement)    │    │  (implement)    │    │  (implement)    │
    │  Task A         │    │  Task B         │    │  Task C         │
    └────────┬────────┘    └────────┬────────┘    └────────┬────────┘
             │                      │                      │
             └──────────────────────┼──────────────────────┘
                                    │
                                    ▼
                          ┌──────────────────────┐
                          │   check Agent        │
                          │   验证所有变更        │
                          └──────────┬───────────┘
                                     │
                                     ▼
                          ┌──────────────────────┐
                          │   创建 PR            │
                          └──────────────────────┘
```

---

## 4. 关键文件索引

### 4.1 Agent 定义文件

| 文件 | 位置 |
|------|------|
| 项目级 Agent | `.claude/agents/*.md` |
| Claude 模板 | `packages/cli/src/templates/claude/agents/*.md` |
| iFlow 模板 | `packages/cli/src/templates/iflow/agents/*.md` |
| OpenCode 模板 | `packages/cli/src/templates/opencode/agents/*.md` |

### 4.2 Skill 定义文件

| 平台 | 位置 | 格式 |
|------|------|------|
| Claude Code | `.claude/commands/spec/*.md` | `/spec:<name>` |
| Cursor | `.cursor/commands/spec-*.md` | `spec-<name>` |
| Codex | `.agents/skills/<name>/SKILL.md` | `$<name>` |
| Kiro | `.kiro/skills/<name>/SKILL.md` | skill 格式 |
| Qoder | `.qoder/skills/<name>/SKILL.md` | skill 格式 |
| iFlow | `.iflow/commands/spec/*.md` | `/spec:<name>` |
| OpenCode | `.opencode/commands/spec/*.md` | `/spec:<name>` |
| CodeBuddy | `.codebuddy/commands/spec/*.md` | `/spec:<name>` |

### 4.3 Marketplace Skills

| Skill | 位置 | 描述 |
|-------|------|------|
| cc-codex-spec-bootstrap | `marketplace/skills/cc-codex-spec-bootstrap/` | Claude Code + Codex 并行流水线 |
| spec-meta | `marketplace/skills/spec-meta/` | 理解和定制 spec-first 的元 skill |

---

## 5. 扩展指南

### 5.1 添加新 Agent

1. 在 `packages/cli/src/templates/<platform>/agents/` 创建 `<name>.md`
2. 定义 frontmatter: `model`, `tools`
3. 编写 agent 描述和职责
4. 更新 `src/configurators/<platform>.ts` 注册 agent

### 5.2 添加新 Skill

1. 运行 `/spec:create-command <name>`
2. 在生成的文件中定义 skill 功能
3. 同步到各平台模板目录
4. 更新本文档的 skill 列表

---

## 6. 总结

### 6.1 设计原则

1. **职责分离** - 每个 Agent 有明确职责边界
2. **权限最小化** - research 只读，implement 禁止 commit
3. **跨平台复用** - 核心 Agent/Skill 在所有平台保持一致
4. **渐进式注入** - spec 上下文按需注入到 agent

### 6.2 数量统计

| 类别 | 数量 |
|------|------|
| 核心 Agent | 6 |
| 核心 Skill | 16 |
| 支持平台 | 8 |
| Marketplace Skill | 2 |

---

## 7. 方案文档导航

本目录中的文档现在分成 4 类阅读路径。

### 7.1 现状与问题分析

适合先理解当前系统长什么样、缺口在哪里：

- [implement-agent.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/implement-agent.md)
- [skill-spec-first分析.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/skill-spec-first分析.md)
- [tdd-analysis.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/tdd-analysis.md)
- [tdd-best-practice.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/tdd-best-practice.md)

### 7.2 旧方案草案

以下文档保留作为历史分析稿，用于说明早期思路：

- [dispatch-de决策集成方案.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/dispatch-de决策集成方案.md)

注意：

- 这份文档的主要价值是提出“应显式化决策”
- 不再建议按其原始思路，让 `dispatch` 成为主决策中心

### 7.3 新的 Policy / Schema 设计

这两份是新的中间层文档：

- [phase-decision-guide.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/phase-decision-guide.md)
  说明每个 phase 的 policy 语义、最小推荐字段、以及对 `superpowers` 的借鉴边界

- [decision-hints-schema.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/decision-hints-schema.md)
  定义 `task.json.decision_hints` 的最小可行结构、Hard/Soft policy 分层、生产者/消费者、fallback 规则

### 7.4 完整技术方案

如果只读一份方案文档，优先读：

- [dispatch-runtime完整技术方案.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/dispatch-runtime完整技术方案.md)

这份文档整合了：

- 背景与问题
- 修改前/后架构 ASCII 图
- 优势对比表
- LLM 自主决策边界
- 对 `superpowers` 的借鉴边界
- 最小可行 `decision_hints` 方案
- runtime enforcement 的落点
- 分阶段实施路径

### 7.5 推荐阅读顺序

推荐顺序：

1. [skill-spec-first分析.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/skill-spec-first分析.md)
2. [implement-agent.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/implement-agent.md)
3. [dispatch-de决策集成方案.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/dispatch-de决策集成方案.md)
4. [phase-decision-guide.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/phase-decision-guide.md)
5. [decision-hints-schema.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/decision-hints-schema.md)
6. [dispatch-runtime完整技术方案.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/dispatch-runtime完整技术方案.md)

如果时间有限，直接看：

1. [dispatch-runtime完整技术方案.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/dispatch-runtime完整技术方案.md)
2. [decision-hints-schema.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/decision-hints-schema.md)

---

## 8. Skill 深度分析文档

> 对 `/packages/cli/src/templates/claude/commands/spec/` 下 14 个 skill 的完整深度分析

### 8.1 分析文档索引

#### 基础命令

| Skill | 复杂度 | 用途 | 文档 |
|-------|--------|------|------|
| **check** | ⭐ | 代码质量验证 | [check/README.md](./check/README.md) |
| **before-dev** | ⭐ | 开发前读规范 | [before-dev/README.md](./before-dev/README.md) |
| **record-session** | ⭐⭐ | 会话记录 | [record-session/README.md](./record-session/README.md) |
| **create-command** | ⭐⭐ | 创建新命令 | [create-command/README.md](./create-command/README.md) |

#### 任务管理

| Skill | 复杂度 | 用途 | 文档 |
|-------|--------|------|------|
| **current-task** | ⭐⭐⭐ | 任务列表/切换 | [current-task/README.md](./current-task/README.md) |
| **finish-work** | ⭐⭐⭐ | 提交前检查清单 | [finish-work/README.md](./finish-work/README.md) |

#### 质量保证

| Skill | 复杂度 | 用途 | 文档 |
|-------|--------|------|------|
| **check-cross-layer** | ⭐⭐⭐ | 多维度验证 | [check-cross-layer/README.md](./check-cross-layer/README.md) |
| **break-loop** | ⭐⭐⭐ | Bug 深度分析 | [break-loop/README.md](./break-loop/README.md) |

#### 工作流编排

| Skill | 复杂度 | 用途 | 文档 |
|-------|--------|------|------|
| **start** | ⭐⭐⭐⭐ | 会话入口点 | [start/README.md](./start/README.md) |
| **brainstorm** | ⭐⭐⭐⭐⭐ | 需求发现 | [brainstorm/README.md](./brainstorm/README.md) |
| **parallel** | ⭐⭐⭐ | 多 Agent 并行 | [parallel/README.md](./parallel/README.md) |

#### 知识管理

| Skill | 复杂度 | 用途 | 文档 |
|-------|--------|------|------|
| **update-spec** | ⭐⭐⭐⭐ | Code-spec 更新 | [update-spec/README.md](./update-spec/README.md) |
| **integrate-skill** | ⭐⭐⭐ | Skill 集成 | [integrate-skill/README.md](./integrate-skill/README.md) |
| **onboard** | ⭐⭐⭐⭐⭐ | 新成员入门 | [onboard/README.md](./onboard/README.md) |

### 8.2 按工作流阶段分类

```
会话开始:
  /spec:start ──→ 初始化上下文 ──→ 任务分类

开发阶段:
  /spec:before-dev ──→ [写代码] ──→ /spec:check ──→ /spec:finish-work ──→ commit ──→ /spec:record-session

任务管理:
  /spec:current-task list | switch

知识管理:
  /spec:update-spec | /spec:integrate-skill | /spec:break-loop

并行开发:
  /spec:parallel ──→ Plan Agent ──→ worktree agent ──→ PR
```

### 8.3 核心设计原则

| 原则 | 描述 |
|------|------|
| **上下文注入，而非记忆** | Task Workflow 确保 agents 自动接收 code-spec 上下文 |
| **索引是导航，不是规范** | index.md 指向实际指南文件，不包含规范内容 |
| **Code-Spec vs Guide 区分** | Code-Spec 告诉"如何实现"，Guide 帮助"考虑什么" |

### 8.4 文档结构

每个 skill 分析文档包含：
1. **Skill 概述** - 核心定位和设计哲学
2. **执行流程** - 流程图和步骤详解
3. **设计分析** - 架构层次和模式
4. **使用场景** - 触发时机和工作流
5. **最佳实践** - 注意事项和常见错误
6. **总结** - 核心价值提炼

---

*文档生成时间: 2026-03-26*
