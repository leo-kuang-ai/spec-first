# Start 深度分析

> 源文件: `/packages/cli/src/templates/claude/commands/spec/start.md`

---

## 1. Skill 概述

### 1.1 核心定位

**start** 是会话初始化命令，用于启动 AI 开发会话并开始处理任务。

| 维度 | 描述 |
|------|------|
| **目标** | 初始化会话并开始工作 |
| **触发时机** | 会话开始时 |
| **特点** | 支持多种任务类型处理 |

### 1.2 核心原则

```
┌─────────────────────────────────────────────────────────────┐
│                    核心原则                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Code-spec context is injected, not remembered.           │
│                                                             │
│   Task Workflow 确保 agents 自动接收相关 code-spec 上下文  │
│   这比期望 AI "记住" 约定更可靠                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 初始化流程

### 2.1 流程图

```
┌─────────────────────────────────────────────────────────────┐
│                   start 初始化流程                           │
└─────────────────────────────────────────────────────────────┘

  ┌─────────────────┐
  │ Step 1: 理解    │
  │ workflow        │
  └────────┬────────┘
           │ cat .spec-first/workflow.md
           ▼
  ┌─────────────────┐
  │ Step 2: 获取    │
  │ 当前上下文      │
  └────────┬────────┘
           │ get_context.py
           ▼
  ┌─────────────────┐
  │ Step 3: 读取    │
  │ 指南索引        │
  └────────┬────────┘
           │ spec/*/index.md
           ▼
  ┌─────────────────┐
  │ Step 4: 报告并  │
  │ 询问用户        │
  └─────────────────┘
```

### 2.2 步骤详解

#### Step 1: 理解开发工作流

```bash
cat .spec-first/workflow.md
```

包含：
- 核心原则（先读后写、遵循标准等）
- 文件系统结构
- 开发流程
- 最佳实践

#### Step 2: 获取当前上下文

```bash
python3 ./.spec-first/scripts/get_context.py
```

显示：开发者身份、git 状态、当前任务（如有）、活跃任务。

#### Step 3: 读取指南索引

```bash
python3 ./.spec-first/scripts/get_context.py --mode packages
cat .spec-first/spec/<package>/<layer>/index.md
cat .spec-first/spec/guides/index.md
```

**重要**: 索引文件是导航 — 它们列出实际的指南文件。实际开发时，必须回去读取索引的 Pre-Development Checklist 中列出的具体指南文件。

#### Step 4: 报告并询问

报告学习到的内容，询问："您想做什么？"

---

## 3. 任务分类

### 3.1 分类表

| 类型 | 标准 | 工作流 |
|------|------|--------|
| **Question** | 用户问代码、架构或如何工作 | 直接回答 |
| **Trivial Fix** | 拼写修复、注释更新、单行变更 | 直接编辑 |
| **Simple Task** | 目标明确、1-2 个文件、范围清晰 | 快速确认 → 实现 |
| **Complex Task** | 目标模糊、多文件、架构决策 | **Brainstorm → Task Workflow** |

### 3.2 分类信号

**简单/琐碎指标**:
- 用户指定确切文件和变更
- "修复 X 中的拼写错误"
- "向组件 Z 添加字段 Y"
- 已有清晰的验收标准

**复杂指标**:
- "我想添加一个功能..."
- "你能帮我改进..."
- 提及多个区域或系统
- 没有明确的实现路径
- 用户似乎不确定方法

### 3.3 决策规则

> **如有疑问，使用 Brainstorm + Task Workflow。**
>
> Task Workflow 确保 code-spec 上下文被注入到 agents，产生更高质量的代码。
> 开销很小，但收益显著。

---

## 4. 任务处理工作流

### 4.1 Question / Trivial Fix

直接工作：
1. 回答问题或进行修复
2. 如果代码被更改，提醒用户运行 `/spec:finish-work`

### 4.2 Simple Task

1. 快速确认："我理解您想 [目标]。可以继续吗？"
2. 如果否，澄清并再次确认
3. **如果是：执行以下所有步骤，不停止。不在步骤间请求额外确认。**
   - 创建任务目录（Phase 1 Path B, Step 2）
   - 编写 PRD（Step 3）
   - 研究代码库（Phase 2, Step 5）
   - 配置上下文（Step 6）
   - 激活任务（Step 7）
   - 实现（Phase 3, Step 8）
   - 检查质量（Step 9）
   - 完成（Step 10）

### 4.3 Complex Task - Brainstorm First

**自动启动 brainstorm 流程** — 不要直接跳到实现。

参见 `/spec:brainstorm` 获取完整流程。摘要：
1. **确认并分类** - 陈述理解
2. **创建任务目录** - 在 `prd.md` 中跟踪演进的需求
3. **一次问一个问题** - 每个回答后更新 PRD
4. **提出方法** - 用于架构决策
5. **确认最终需求** - 获得明确批准
6. **进入 Task Workflow** - PRD 中有清晰需求

**Brainstorm 原则**:

| 原则 | 描述 |
|------|------|
| **一次一个问题** | 永远不要用多个问题淹没用户 |
| **立即更新 PRD** | 每个回答后更新文档 |
| **偏好多选题** | 用户更容易回答 |
| **YAGNI** | 挑战不必要的复杂性 |

---

## 5. Task Workflow（开发任务）

### 5.1 为什么有这个工作流？

- Research Agent 分析需要哪些 code-spec 文件
- Code-spec 文件配置在 jsonl 文件中
- Implement Agent 通过 Hook 注入接收 code-spec 上下文
- Check Agent 根据 code-spec 要求验证
- 结果：自动遵循项目约定的代码

### 5.2 概览：两个入口点

```
From Brainstorm (Complex Task):
  PRD confirmed → Research → Configure Context → Activate → Implement → Check → Complete

From Simple Task:
  Confirm → Create Task → Write PRD → Research → Configure Context → Activate → Implement → Check → Complete
```

**关键原则：Research 发生在需求清晰后（PRD 存在）。**

### 5.3 Phase 1: 建立需求

#### Path A: 从 Brainstorm（跳到 Phase 2）

PRD 和任务目录已从 brainstorm 存在。直接跳到 Phase 2。

#### Path B: 从 Simple Task

**Step 1: 确认理解**

快速确认：
- 目标是什么？
- 开发类型？（frontend / backend / fullstack）
- 任何特定需求或约束？

**Step 2: 创建任务目录**

```bash
TASK_DIR=$(python3 ./.spec-first/scripts/task.py create "<title>" --slug <name>)
```

**Step 3: 编写 PRD**

```markdown
# <Task Title>

## Goal
<我们想实现什么>

## Requirements
- <需求 1>
- <需求 2>

## Acceptance Criteria
- [ ] <标准 1>
- [ ] <标准 2>

## Technical Notes
<任何技术决策或约束>
```

### 5.4 Phase 2: 准备实现（共享）

> 两条路径在此汇合。PRD 和任务目录必须在继续前存在。

**Step 4: Code-Spec 深度检查**

如果任务涉及基础设施或跨层契约，在定义 code-spec 深度前不要开始实现。

**Step 5: 研究代码库**

调用 Research Agent：
```
Task(
  subagent_type: "research",
  prompt: "Analyze the codebase for this task...",
  model: "opus"
)
```

**Step 6: 配置上下文**

```bash
python3 ./.spec-first/scripts/task.py init-context "$TASK_DIR" <type>
python3 ./.spec-first/scripts/task.py add-context "$TASK_DIR" implement "<path>" "<reason>"
```

**Step 7: 激活任务**

```bash
python3 ./.spec-first/scripts/task.py start "$TASK_DIR"
```

设置 `.current-task` 以便 hooks 注入上下文。

### 5.5 Phase 3: 执行（共享）

**Step 8: Implement**

```
Task(
  subagent_type: "implement",
  prompt: "Implement the task described in prd.md...",
  model: "opus"
)
```

**Step 9: Check Quality**

```
Task(
  subagent_type: "check",
  prompt: "Review all code changes against code-spec requirements...",
  model: "opus"
)
```

**Step 10: Complete**

1. 验证 lint 和 typecheck 通过
2. 报告实现内容
3. 提醒用户：
   - 测试变更
   - 准备好时提交
   - 运行 `/spec:record-session` 记录会话

---

## 6. 继续现有任务

如果 `get_context.py` 显示当前任务：

1. 读取任务的 `prd.md` 理解目标
2. 检查 `task.json` 当前状态和阶段
3. 询问用户："继续处理 <task-name>？"

如果是，从适当步骤恢复（通常是 Step 7 或 8）。

---

## 7. 命令参考

### 用户命令 `[USER]`

| 命令 | 使用时机 |
|------|---------|
| `/spec:start` | 开始会话（此命令） |
| `/spec:brainstorm` | 澄清模糊需求（从 start 调用） |
| `/spec:parallel` | 需要隔离 worktree 的复杂任务 |
| `/spec:finish-work` | 提交变更前 |
| `/spec:record-session` | 完成任务后 |

### AI 脚本 `[AI]`

| 脚本 | 用途 |
|------|------|
| `get_context.py` | 获取会话上下文 |
| `task.py create` | 创建任务目录 |
| `task.py init-context` | 初始化 jsonl 文件 |
| `task.py add-context` | 添加 code-spec 到 jsonl |
| `task.py start` | 设置当前任务 |
| `task.py finish` | 清除当前任务 |
| `task.py archive` | 归档完成的任务 |

### Sub Agents `[AI]`

| Agent | 用途 | Hook 注入 |
|-------|------|-----------|
| research | 分析代码库 | 否（直接读取） |
| implement | 编写代码 | 是（implement.jsonl） |
| check | 审查并修复 | 是（check.jsonl） |
| debug | 修复特定问题 | 是（debug.jsonl） |

---

## 8. 总结

**start** 是会话入口点：

```
/spec:start
    │
    ├── 初始化上下文
    ├── 分类任务
    │      ├── Question → 直接回答
    │      ├── Trivial → 直接编辑
    │      ├── Simple → Task Workflow
    │      └── Complex → Brainstorm → Task Workflow
    │
    └── 执行工作流
```

**核心价值**:
- 统一的会话入口
- 智能任务分类
- 上下文注入机制
- 多路径支持
