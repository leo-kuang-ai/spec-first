# Spec-First 项目 Skill 详细列表

> **版本**: 1.3.8 | **更新日期**: 2026-03-26 | **Skill 源**: `.claude/commands/spec/` + `packages/cli/src/templates/`

---

## 概述

Spec-First 项目共包含 **6 个 Agent** + **16 个 Skill/Command**，采用规范驱动的 AI 编码工作流，强调 spec 注入、上下文管理和多平台支持。

### 核心设计理念

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        Spec-First 核心理念                                       │
└─────────────────────────────────────────────────────────────────────────────────┘

  1. 规范驱动 (Spec-Driven)
     └── 所有代码实现必须遵循 .spec-first/spec/ 中的规范

  2. 上下文注入 (Context Injection)
     └── Hook 自动将 spec 和需求注入到 Agent 上下文

  3. 多平台支持 (Multi-Platform)
     └── 支持 8 个 AI 编码平台：Claude, Cursor, Codex, Kiro, Qoder, iFlow, OpenCode, CodeBuddy

  4. 职责分离 (Separation of Concerns)
     └── 每个 Agent 有明确的职责边界和权限限制
```

---

## Agent 列表

### 核心 Agents (6 个)

| 名称 | 职责 | 权限 | 模型 |
|------|------|------|------|
| **research** | 代码和技术搜索 | 只读 | opus |
| **plan** | 任务规划和目录创建 | 可写 | opus |
| **dispatch** | 多 Agent 流水线调度 | 只读 | opus |
| **implement** | 代码实现 | 禁止 commit | opus |
| **check** | 代码质量检查 (循环) | 可修改 | opus |
| **debug** | 问题修复 | 可修改 | opus |

---

## Skill 分类列表

### 入口与发现 Skills (3 个)

#### 1. start
| 属性 | 值 |
|------|-----|
| **名称** | `start` |
| **描述** | 启动 AI 开发会话，初始化完整上下文 |
| **触发条件** | 每个 session 开始时 |
| **命令** | `/spec:start` |

**核心原则**: Read Before Write - 在开始工作前必须理解完整上下文

**流程节点**:
1. 读取 workflow.md - 理解开发流程
2. 读取开发者身份 - 确认当前用户
3. 读取 git 状态 - 了解当前分支和变更
4. 读取活动任务 - 获取待处理任务
5. 读取 spec 索引 - 了解项目规范
6. 询问用户工作意图

**注入的上下文**:
- `.spec-first/workflow.md`
- `.spec-first/spec/*/index.md`
- `.spec-first/spec/guides/index.md`

---

#### 2. onboard
| 属性 | 值 |
|------|-----|
| **名称** | `onboard` |
| **描述** | 新团队成员的交互式入职培训 |
| **触发条件** | 新成员加入项目 |
| **命令** | `/spec:onboard` |

**核心原则**: 渐进式学习 - 分三部分逐步深入理解系统

**流程节点**:
1. **Part 1: Core Philosophy** - 核心理念和价值观
2. **Part 2: System Structure** - 文件组织和 Agent 机制
3. **Part 3: Command Deep Dive** - 各命令详解

---

#### 3. current-task
| 属性 | 值 |
|------|-----|
| **名称** | `current-task` |
| **描述** | 列出活动任务并切换当前任务指针 |
| **触发条件** | 需要切换或查看任务 |
| **命令** | `/spec:current-task` |

**核心原则**: 单任务专注 - 同时只处理一个任务

**流程节点**:
1. 列出所有活动任务
2. 用户选择任务
3. 更新 `.spec-first/.current-task` 文件
4. 确认切换成功

**底层脚本**: `python3 ./.spec-first/scripts/current_task.py list/switch`

---

### 创意与规划 Skills (2 个)

#### 4. brainstorm
| 属性 | 值 |
|------|-----|
| **名称** | `brainstorm` |
| **描述** | 协作需求发现，创建任务目录和种子 PRD |
| **触发条件** | 需求不明确、复杂任务、架构决策 |
| **命令** | `/spec:brainstorm` |

**核心原则**: 一次一个问题 - 避免用户认知过载

**流程节点**:
1. 确认理解 - 陈述对需求的理解
2. 创建任务目录 - `task.py create`
3. 逐个提问 - 一次一个问题
4. 更新 PRD - 每次回答后更新
5. 提出方案 - 2-3 个方案供选择
6. 确认最终需求 - 获取明确批准
7. 进入任务工作流

**Hard Gate**: 需求明确并获得用户批准后才能进入实现阶段

---

#### 5. plan (Agent)
| 属性 | 值 |
|------|-----|
| **名称** | `plan` |
| **描述** | 任务规划 Agent，分析需求生成配置好的任务目录 |
| **触发条件** | 被 parallel 或 dispatch 调用 |
| **类型** | Agent |

**核心原则**: 可拒绝不合理需求 - 规划阶段就应该发现不可能的任务

**流程节点**:
1. 评估需求有效性
2. 调用 research agent 分析代码库
3. 创建任务目录
4. 编写 prd.md
5. 配置 JSONL 上下文
6. 输出准备就绪的任务目录

**输出**: 配置好的 `.spec-first/tasks/{MM-DD-{name}/` 目录

---

### 实现与执行 Skills (3 个)

#### 6. implement (Agent)
| 属性 | 值 |
|------|-----|
| **名称** | `implement` |
| **描述** | 代码实现专家，遵循 specs 和需求实现功能 |
| **触发条件** | 被 dispatch 调用 (Phase 1) |
| **类型** | Agent |

**核心原则**: 遵循规范，禁止 commit - 代码必须由用户手动提交

**流程节点**:
1. 理解 Specs - 读取 .spec-first/spec/
2. 理解需求 - 读取 prd.md 和 info.md
3. 实现功能 - 按规范和设计编写代码
4. 自我验证 - 运行 lint 和 typecheck
5. 报告结果 - 输出修改的文件列表

**权限限制**:
- ❌ 禁止 `git commit`
- ❌ 禁止 `git push`
- ❌ 禁止 `git merge`

**执行模式**: 串行、单次、后台运行 (30 min 最大)

---

#### 7. parallel
| 属性 | 值 |
|------|-----|
| **名称** | `parallel` |
| **描述** | 多 Agent 并行流水线，分派任务到独立 worktree |
| **触发条件** | 复杂任务需要并行处理 |
| **命令** | `/spec:parallel` |

**核心原则**: 隔离工作空间 - 每个任务在独立 worktree 中执行

**流程节点**:
1. 理解需求
2. 调用 plan agent 规划任务
3. 创建 worktree
4. 派发任务到各 agent
5. 并行执行
6. 检查结果
7. 创建 PR

**架构**:
```
main repo (orchestrator)
    │
    ├── worktree-1 (agent-1: task-a)
    ├── worktree-2 (agent-2: task-b)
    └── worktree-3 (agent-3: task-c)
```

---

#### 8. dispatch (Agent)
| 属性 | 值 |
|------|-----|
| **名称** | `dispatch` |
| **描述** | 多 Agent 流水线调度器，按阶段顺序调用 subagent |
| **触发条件** | worktree 中执行任务 |
| **类型** | Agent |

**核心原则**: 纯调度器 - 不读取 specs，只负责调用

**流程节点**:
1. 读取 `.spec-first/.current-task`
2. 读取 `task.json` 获取 `next_action`
3. 按 phase 顺序执行:
   - Phase 1: implement
   - Phase 2: check (循环)
   - Phase 3: finish
   - Phase 4: create-pr

**超时设置**:
| Phase | 最大时间 | 轮询次数 |
|-------|----------|----------|
| implement | 30 min | 6 次 |
| check | 15 min | 3 次 |
| debug | 20 min | 4 次 |

---

### 质量保障 Skills (5 个)

#### 9. check (Agent + Skill)
| 属性 | 值 |
|------|-----|
| **名称** | `check` |
| **描述** | 代码质量检查，根据 spec 验证代码并自我修复 |
| **触发条件** | 被 dispatch 调用 (Phase 2) 或手动 `/spec:check` |
| **类型** | Agent + Skill |

**核心原则**: 循环验证直到通过 - 最多 5 次循环

**流程节点**:
1. 读取 check.jsonl 中的 spec 文件
2. 对照 spec 验证代码
3. 发现问题直接修复
4. 运行验证命令
5. 通过则完成，失败则继续循环

**循环控制**: `ralph-loop.py` (SubagentStop Hook)

**验证方式**:
- 方式 A: 运行 `worktree.yaml` 中配置的 verify commands
- 方式 B: 检查输出中的 completion markers (如 `LINT_FINISH`)

---

#### 10. check-cross-layer
| 属性 | 值 |
|------|-----|
| **名称** | `check-cross-layer` |
| **描述** | 跨层数据流和一致性验证 |
| **触发条件** | 功能涉及多个层级 |
| **命令** | `/spec:check-cross-layer` |

**核心原则**: 跨层功能必须验证数据流完整性

**检查维度**:
1. 跨层数据流验证
2. 代码重用分析
3. 导入路径验证
4. 同层一致性检查

---

#### 11. finish-work
| 属性 | 值 |
|------|-----|
| **名称** | `finish-work` |
| **描述** | 提交前质量检查清单 |
| **触发条件** | 代码完成准备提交前 |
| **命令** | `/spec:finish-work` |

**核心原则**: 完成前必须通过所有检查项

**检查清单**:
```markdown
### 1. Code Quality
- [ ] Lint passes (`pnpm lint`)
- [ ] TypeCheck passes (`pnpm typecheck`)
- [ ] Tests pass (`pnpm test`)

### 2. Code-Spec Sync
- [ ] Does `.spec-first/spec/backend/` need updates?
- [ ] Does `.spec-first/spec/frontend/` need updates?
- [ ] Does `.spec-first/spec/guides/` need updates?

### 3. Session Recording
- [ ] Session recorded via `add_session.py`
- [ ] Commit message follows convention

### 4. Working Directory
- [ ] Clean or WIP noted
```

---

#### 12. break-loop
| 属性 | 值 |
|------|-----|
| **名称** | `break-loop` |
| **描述** | Bug 深度分析，打破"修复-遗忘-重复"循环 |
| **触发条件** | 修复 bug 后 |
| **命令** | `/spec:break-loop` |

**核心原则**: 调试的价值不在于修复 bug，而在于让这类 bug 不再发生

**五维度分析**:
1. **Root Cause Category** - 根因分类 (A-E 五类)
2. **Why Fixes Failed** - 修复失败原因
3. **Prevention Mechanisms** - 预防机制
4. **Systematic Expansion** - 系统性扩展
5. **Knowledge Capture** - 知识捕获

**根因分类**:
| 类别 | 特征 |
|------|------|
| A. Missing Spec | 没有文档说明如何做 |
| B. Cross-Layer Contract | 层间接口不清晰 |
| C. Change Propagation Failure | 改了一处漏了其他 |
| D. Test Coverage Gap | 单元测试通过但集成失败 |
| E. Implicit Assumption | 依赖未文档化的假设 |

**必须动作**: 分析后立即更新 spec 文档

---

### 调试与修复 Skills (1 个)

#### 13. debug (Agent)
| 属性 | 值 |
|------|-----|
| **名称** | `debug` |
| **描述** | 问题修复专家，精确修复不重构 |
| **触发条件** | check 发现问题或用户报告 bug |
| **类型** | Agent |

**核心原则**: 精确修复 - 不重构，只修复问题

**流程节点**:
1. 理解问题描述
2. 读取 debug.jsonl 中的上下文
3. 定位问题根因
4. 实现最小修复
5. 验证修复有效
6. 报告修复内容

---

### 知识管理 Skills (3 个)

#### 14. update-spec
| 属性 | 值 |
|------|-----|
| **名称** | `update-spec` |
| **描述** | 将可执行契约和编码知识捕获到 spec 文档 |
| **触发条件** | 实现新功能、修复 bug、发现新模式 |
| **命令** | `/spec:update-spec` |

**核心原则**: 知识必须固化到文档才能持续发挥作用

**触发场景**:
- 实现了新功能
- 做出了设计决策
- 修复了 bug
- 发现了新模式
- 遇到了坑
- 建立了新约定

**强制触发条件** (跨层/基础设施变更):
- 新增/修改命令或 API 签名
- 数据库 schema/migration 变更
- 基础设施集成
- 跨层契约变更

**更新内容分类**:
- Design Decision (设计决策)
- Project Convention (项目约定)
- New Pattern (新模式)
- Forbidden Pattern (禁止模式)
- Common Mistake (常见错误)

---

#### 15. record-session
| 属性 | 值 |
|------|-----|
| **名称** | `record-session` |
| **描述** | 记录完成的工作进度到日志文件 |
| **触发条件** | 代码提交后 |
| **命令** | `/spec:record-session` |

**核心原则**: 每个会话必须有记录

**流程节点**:
1. 检测当前 journal 文件
2. 创建新文件 (如超过 2000 行)
3. 追加会话内容
4. 更新 index.md

**底层脚本**: `python3 ./.spec-first/scripts/add_session.py`

---

#### 16. create-command
| 属性 | 值 |
|------|-----|
| **名称** | `create-command` |
| **描述** | 创建新的 skill/command 文件 |
| **触发条件** | 需要扩展功能 |
| **命令** | `/spec:create-command` |

**核心原则**: 遵循统一的 skill 结构

**Skill 文件结构**:
```markdown
---
name: <skill-name>
description: "<详细描述>"
---

# Skill Title

## When to Use
...

## Core Pattern
...

## Quick Reference
...
```

---

### 技术工具 Skills (2 个)

#### 17. before-dev
| 属性 | 值 |
|------|-----|
| **名称** | `before-dev` |
| **描述** | 实现开始前注入项目编码规范 |
| **触发条件** | 开始编码前 |
| **命令** | `/spec:before-dev` |

**核心原则**: 编码前必须理解项目规范

**注入内容**:
- Spec 索引
- 开发前检查清单
- 共享思考指南

---

#### 18. improve-ut
| 属性 | 值 |
|------|-----|
| **名称** | `improve-ut` |
| **描述** | 分析变更文件并改进单元测试覆盖率 |
| **触发条件** | 需要提升测试覆盖率 |
| **命令** | `$improve-ut` (Codex only) |

**核心原则**: 测试覆盖变更的代码

---

## Agent & Skill 依赖关系图

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        Spec-First 依赖关系图                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

start (入口)
    │
    ├── brainstorm (需求不明确时)
    │       │
    │       ├── plan (Agent) - 创建任务目录
    │       │       │
    │       │       └── research (Agent) - 分析代码库
    │       │
    │       └── parallel (并行任务)
    │               │
    │               ├── dispatch (Agent) - 调度 phases
    │               │       │
    │               │       ├── implement (Agent) - 实现代码
    │               │       │
    │               │       ├── check (Agent) - 质量检查 (循环)
    │               │       │       │
    │               │       │       └── debug (Agent) - 修复问题
    │               │       │
    │               │       └── create-pr
    │               │
    │               └── worktree 隔离
    │
    ├── before-dev (编码前注入规范)
    │
    ├── check (手动检查)
    │
    ├── check-cross-layer (跨层检查)
    │
    ├── break-loop (Bug 深度分析)
    │       │
    │       └── update-spec (知识捕获)
    │
    ├── finish-work (完成检查清单)
    │
    ├── record-session (记录会话)
    │
    └── create-command (创建新命令)
```

---

## 与 Superpowers 项目对比

### 架构对比

| 维度 | Spec-First | Superpowers |
|------|------------|-------------|
| **Agent 数量** | 6 | 0 (纯 Skill) |
| **Skill 数量** | 16 | 14 |
| **TDD 强制** | ❌ 否 | ✅ 是 |
| **循环验证** | ✅ check agent (5次) | ✅ verification-before-completion |
| **多平台** | ✅ 8 平台 | ❌ Claude Code only |
| **知识管理** | ✅ spec 驱动 | ❌ 无 |
| **并行执行** | ✅ worktree + parallel | ✅ dispatching-parallel-agents |

### Skill 功能映射

| 功能 | Spec-First | Superpowers |
|------|------------|-------------|
| **入口发现** | start + onboard | using-superpowers |
| **需求发现** | brainstorm | brainstorming |
| **任务规划** | plan agent | writing-plans |
| **代码实现** | implement agent | executing-plans + subagent-driven-development |
| **TDD** | ❌ 缺失 | test-driven-development |
| **调试** | break-loop + debug | systematic-debugging |
| **验证** | check agent (循环) | verification-before-completion |
| **代码审查** | ❌ 缺失 | requesting/receiving-code-review |
| **完成交付** | finish-work + create-pr | finishing-a-development-branch |
| **知识管理** | update-spec + record-session | ❌ 无 |
| **元技能** | create-command | writing-skills |

### 设计哲学对比

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        设计哲学对比                                               │
└─────────────────────────────────────────────────────────────────────────────────┘

  Superpowers:
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  "严格门控" 哲学                                                             │
  │                                                                             │
  │  • TDD 强制: 没有测试就不能写代码                                            │
  │  • 验证强制: 没有证据就不能声称完成                                          │
  │  • 审查强制: 每个任务必须经过代码审查                                        │
  │                                                                             │
  │  优点: 质量高，bug 少                                                        │
  │  缺点: 速度慢，流程繁琐                                                      │
  └─────────────────────────────────────────────────────────────────────────────┘

  Spec-First:
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  "规范驱动" 哲学                                                             │
  │                                                                             │
  │  • Spec 强制: 所有代码必须遵循规范                                           │
  │  • 上下文注入: Hook 自动注入规范到 Agent                                     │
  │  • 循环验证: check agent 最多 5 次循环修复                                   │
  │                                                                             │
  │  优点: 灵活，多平台支持，知识积累                                            │
  │  缺点: TDD 缺失，代码审查缺失                                                │
  └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 改进建议

### 高优先级 (P0)

| 改进 | 说明 | 参考 Superpowers |
|------|------|------------------|
| **添加 TDD** | 在 implement 或 check 中强制运行测试 | test-driven-development |
| **添加代码审查** | 任务完成后请求代码审查 | requesting-code-review |

### 中优先级 (P1)

| 改进 | 说明 | 参考 Superpowers |
|------|------|------------------|
| **验证门控** | 声称完成前必须有验证证据 | verification-before-completion |
| **审查反馈处理** | 规范化处理审查反馈 | receiving-code-review |

### 低优先级 (P2)

| 改进 | 说明 | 参考 Superpowers |
|------|------|------------------|
| **并行调试** | 多个独立问题并行派发 | dispatching-parallel-agents |
| **Skill 测试** | 用子代理测试 skill 有效性 | writing-skills |

---

## 总结

### Spec-First 优势

1. **多平台支持** - 一次配置，8 个平台可用
2. **规范驱动** - 知识积累在 spec 文档中
3. **上下文注入** - Hook 自动注入，Agent 无需记忆
4. **职责分离** - 每个 Agent 有明确边界

### Spec-First 缺口

1. **TDD 缺失** - 没有测试驱动开发
2. **代码审查缺失** - 没有请求/接收审查流程
3. **验证门控弱** - 依赖 check agent 循环，无独立验证

### 核心差异

| Spec-First | Superpowers |
|------------|-------------|
| 规范驱动 | TDD 驱动 |
| 灵活快速 | 严格质量 |
| 多平台 | 单平台 |
| 知识积累 | 流程强制 |

---

*文档生成时间: 2026-03-26*
