# Dispatch 决策集成方案：借鉴 Superpowers Harness Engineering

> **目标**: 让 dispatch 从"纯调度器"升级为"智能调度器"，采用 Harness Engineering 模式

> **状态说明**
> 本文档保留为第一版分析稿，用于说明“为什么 spec-first 需要显式决策层”。
> 它不再代表当前推荐落地方案。
>
> 当前推荐方案见：
>
> - [dispatch-runtime完整技术方案.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/dispatch-runtime完整技术方案.md)
> - [phase-decision-guide.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/phase-decision-guide.md)
> - [decision-hints-schema.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/decision-hints-schema.md)

---

## 0. 如何阅读本文档

这篇文档的价值主要在于提出了两个正确问题：

1. `spec-first` 需要显式决策层，不能继续只靠 agent 临场判断
2. TDD、测试层级、跨层检查等工程约束，应该被文档化和结构化

但本文档的最终落点已经被后续方案修正。

### 0.1 本文仍然有效的部分

以下判断仍然成立：

1. 需要引入 Harness Engineering 思想
2. 需要把 TDD / test layer / cross-layer check 显式化
3. 需要引入 `decision_hints` 这类结构化 policy
4. 不能继续把关键工程约束完全交给 agent 自觉执行

### 0.2 本文已被修正的部分

以下落点不再推荐：

1. 不再建议让 `dispatch` 升级为“智能调度器”
2. 不再建议让 `dispatch` 成为主要决策中心
3. 不再建议把执行逻辑主要放在 `dispatch` prompt 拼装里
4. 不再建议把 `phase-decision-guide.md` 作为 `dispatch` 的执行脚本

### 0.3 当前更准确的收口

后续方案将这篇文档的核心思想重新落到了更稳定的控制面：

- `next_action` 负责 workflow topology
- `task.json.decision_hints` 负责最小 phase policy
- runtime hooks 负责 enforcement
- `dispatch` 保持纯调度

也就是说：

> Harness Engineering 的方向保留，但实现落点从 `dispatch` 下沉到了 `task metadata + runtime hooks`。

---

## 1. 什么是 Harness Engineering？

### 1.1 Superpowers 的设计模式

Superpowers 使用 **Harness Engineering** 模式：

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Harness Engineering = Harness (约束) + Engineering (工程)              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  核心: 用文档/结构约束 AI 行为，而不是靠 AI "自觉"                        │
│                                                                                 │
│  Superpowers 实现:                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐       │
│  │  using-superpowers.md (Harness 文档)                     │       │
│  │         │                                                │       │
│  │         │  定义决策规则                                      │       │
│  │         ▼                                                │       │
│  │  AI 读取文档 → 理解规则 → 按规则执行                    │       │
│  └─────────────────────────────────────────────────────────────────────┘       │
│                                                                                 │
│  关键: 决策规则写在文档里，不是靠 AI "猜"                    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Spec-First 当前的差距

```
当前 Spec-First:
┌─────────────────────────────────────────────────────────────────────────────────┐
│  dispatch.md (纯调度器)                                          │
│                                                                                 │
│  问题:                                                                  │
│  1. 每个 phase 执行方式固定 (implement 总是直接实现)                │
│  2. 没有决策文档 (用 TDD 还是直接实现？没有指导)               │
│  3. 依赖 AI 自己判断 (不可靠)                                    │
│                                                                                 │
│  缺失: Harness 层面                                            │
│   - 没有文档定义"何时用 TDD"                             │
│   - 没有文档定义"测试哪些层"                               │
│   - 没有文档定义"何时跳过测试"                             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 集成方案：三层 Harness

### 2.1 三层架构

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        三层 Harness 架构                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Layer 1: dispatch.md (流程 Harness)                           │
│   └── 定义 phase 顺序、决策传递机制                                 │
│                                                                                 │
│  Layer 2: phase-decision-guide.md (决策 Harness) [新增]           │
│   └── 定义每个 phase 的决策规则                                       │
│   └── TDD 触发条件、测试层级选择等                                     │
│                                                                                 │
│  Layer 3: implement.md / check.md (执行 Harness)               │
│   └── 定义具体执行步骤                                             │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 新增 phase-decision-guide.md

**位置**: `.claude/commands/spec/phase-decision-guide.md`

**内容**:

```markdown
# Phase Decision Guide

> This document guides dispatch on how to make decisions for each phase.
> Read this BEFORE calling any phase agent.

## Decision Hints

Decision hints are stored in `task.json`:

```json
{
  "decision_hints": {
    "implement": {
      "use_tdd": true,
      "test_layers": ["unit"]
    },
    "check": {
      "run_tests": true,
      "test_layers": ["unit", "integration"]
    }
  }
}
```

## implement Phase Decision

### Decision: TDD or Direct?

| Condition | Decision | Reason |
|-----------|----------|--------|
| New feature with clear spec | TDD | 有明确规范，测试可验证 |
| Bug fix | TDD (test first) | 测试复现 bug |
| Quick prototype | Direct | 速度优先 |
| UI component | Direct (snapshot) | 单元测试价值低 |
| Refactoring | Direct (existing tests) | 已有测试覆盖 |

### Decision: Test Layers

| Layer | When to Use | Speed |
|-------|------------|------|
| unit | Always (default) | Fast (< 5s) |
| integration | API / Service changes | Medium (< 30s) |
| e2e | Full flow / Critical path | Slow (< 5 min) |

### Default Hints

If no hints in task.json, apply:

```json
{
  "implement": {
    "use_tdd": true,
    "test_layers": ["unit"]
  },
  "check": {
    "run_tests": true,
    "test_layers": ["unit"]
  }
}
```

## check Phase Decision

### Decision: Which Tests to Run?

| Change Type | Test Layers |
|-------------|-------------|
| Pure function | unit |
| API endpoint | unit + integration |
| Database change | unit + integration |
| UI component | snapshot + e2e |
| Full feature | unit + integration + e2e |

### Decision: Cross-Layer Check?

| Condition | Run Cross-Layer |
| ----------- | ---------------- |
| API signature change | Yes |
| Database schema change | Yes |
| UI-only change | No |

## debug Phase Decision

### Decision: Fix Strategy

| Issue Type | Strategy |
| ------------| -------- |
| Type error | Fix directly |
| Logic error | Analyze + TDD fix |
| Integration error | Trace data flow + Fix |
| Flaky test | Isolate + Mock + Fix |
```

---

## 3. 修改 dispatch.md

### 3.1 新增 Decision Guide 引用

```markdown
## Phase Decision Guide

> **IMPORTANT**: Before calling any phase, read decision hints.
> See `.claude/commands/spec/phase-decision-guide.md` for full decision rules.

### Quick Reference

| Phase | Key Decisions |
|-------|---------------|
| implement | TDD or Direct? Test layers? |
| check | Run tests? Which layers? |
| debug | Fix strategy? Root cause analysis? |

### How to Apply Hints

1. Read task.json
2. Check decision_hints.{phase}
3. Apply hints when constructing prompt
4. Subagent follows hints for execution
```

### 3.2 修改 implement Phase Handling

```markdown
### action: "implement"

**Decision Point**: Check hints before calling.

```bash
HINTS=$(cat ${TASK_DIR}/task.json | jq -r '.decision_hints.implement // {}')
USE_TDD=$(echo $HINTS | jq -r '.use_tdd // true')
TEST_LAYERS=$(echo $HINTS | jq -r '.test_layers // ["unit"]')
```

#### If USE_TDD = true:

```
Task(
  subagent_type: "implement",
  prompt: "[TDD] Implement using Test-Driven Development.

  Decision hints: {HINTS}

  Follow Red-Green-Refactor:
  1. RED: Write failing tests for: {TEST_LAYERS}
  2. Verify RED (REQUIRED - show test output)
  3. GREEN: Write minimal implementation
  4. Verify GREEN (REQUIRED - show test output)
  5. REFACTOR: Clean up code if needed

  IMPORTANT: Do NOT skip RED verification. If you can't show test failing, the test is wrong.",
  model: "opus",
  run_in_background: true
)
```

#### Else:

```
Task(
  subagent_type: "implement",
  prompt: "Implement the feature described in prd.md.

  Decision hints: {HINTS}

  Direct implementation (TDD not required for this task).
  Test layers to cover eventually: {TEST_LAYERS}",
  model: "opus",
  run_in_background: true
)
```
```

### 3.3 修改 check Phase Handling

```markdown
### action: "check"

**Decision Point**: Check hints before calling.

```bash
HINTS=$(cat ${TASK_DIR}/task.json | jq -r '.decision_hints.check // {}')
RUN_TESTS=$(echo $HINTS | jq -r '.run_tests // true')
TEST_LAYERS=$(echo $HINTS | jq -r '.test_layers // ["unit"]')
```

Task(
  subagent_type: "check",
  prompt: "Check code changes, fix issues yourself.

  Decision hints: {HINTS}

  Run tests: {RUN_TESTS}
  Test layers to run: {TEST_LAYERS}

  Completion markers:
  - TYPECHECK_FINISH (after typecheck passes)
  - LINT_FINISH (after lint passes)
  - TEST_FINISH (after tests pass)
  - ALL_CHECKS_FINISH (when all complete)",
  model: "opus",
  run_in_background: true
)
```
```

---

## 4. 对比

### 4.1 架构对比

```
改进前 (纯调度器):
┌─────────────────────────────────────────────────────────────────────────────────┐
│  dispatch.md                                                    │
│         │                                                    │
│         │ 固定调用，无决策                               │
│         ▼                                                    │
│  implement ──► check ──► finish                        │
│   (固定执行)    (固定执行)                             │
└─────────────────────────────────────────────────────────────────────────────────┘

改进后 (Harness Engineering):
┌─────────────────────────────────────────────────────────────────────────────────┐
│  dispatch.md (流程 Harness)                           │
│         │                                                    │
│         │ 读取 decision_hints                               │
│         ▼                                                    │
│  phase-decision-guide.md (决策 Harness) [新增]             │
│         │                                                    │
│         │  按规则决策                                │
│         ▼                                                    │
│  implement ──► check ──► finish                        │
│   (按 hints 执行)  (按 hints 执行)                     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 能力对比

| 维度 | 改进前 | 改进后 (Harness) |
|------|--------|------------------|
| **决策位置** | 无 | phase-decision-guide.md |
| **TDD 支持** | 无 | 可配置 (hints) |
| **测试层级** | 固定 | 可配置 (hints) |
| **文档化** | 低 | 高 (决策规则显式) |
| **可预测性** | 低 | 高 |

---

## 5. 实施步骤

### Step 1: 创建 phase-decision-guide.md

```bash
# 位置: .claude/commands/spec/phase-decision-guide.md
```

This is a **Skill/Command**，定义决策规则。

### Step 2: 修改 dispatch.md

添加:
1. 引用 phase-decision-guide.md
2. 每个 phase 前读取 hints
3. 按 hints 构造 prompt

### Step 3: 更新 task.json schema

添加 `decision_hints` 字段。

### Step 4: 同步到模板

更新 `packages/cli/src/templates/*/commands/spec/` 目录。

---

## 6. 总结

### 6.1 核心变化

| 改进 | 说明 |
|------|------|
| **新增 Harness 层** | phase-decision-guide.md 定义决策规则 |
| **dispatch 升级** | 从"纯调度器"变为"决策传递者" |
| **决策文档化** | 决策规则显式写在文档中，不依赖 AI 判断 |

### 6.2 与 Superpowers 对比

| 维度 | Superpowers | Spec-First (改进后) |
|------|-------------|------------------|
| **Harness 文档** | using-superpowers.md | phase-decision-guide.md |
| **决策方式** | AI 读取文档判断 | dispatch 读取 hints 传递 |
| **灵活性** | 高 | 中 (结构化) |
| **可预测性** | 中 | 高 |

### 6.3 核心理念

```
Harness Engineering = 用文档约束行为

改进前: AI 自己判断 (不可靠)
改进后: 文档定义规则 → dispatch 传递 → agent 执行 (可靠)
```

### 6.4 结合当前方案后的最终修正

如果结合当前项目代码和后续文档收敛，这篇文档的最终结论应改写为：

1. **方向正确**
   - 需要显式决策层
   - 需要引入 Harness Engineering
   - 需要把 TDD 和验证要求文档化、结构化

2. **落点修正**
   - 不让 `dispatch` 变成智能调度器
   - 不让 `dispatch` 成为 prompt 级决策中心
   - 把主要能力放到 `task.json.decision_hints + runtime hooks`

3. **工程收口**
   - `dispatch` 只保留 pure dispatcher 职责
   - `decision_hints` 只保留最小 contract
   - `check.verify_commands` 才是最关键的硬门控字段

一句话总结本文在今天的定位：

> 这是一篇提出问题很对、但最终落点已被后续方案修正的历史方案文档。

---

*文档生成时间: 2026-03-26*
