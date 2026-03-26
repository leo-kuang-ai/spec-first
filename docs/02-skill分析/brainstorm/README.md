# Brainstorm 深度分析

> 源文件: `/packages/cli/src/templates/claude/commands/spec/brainstorm.md`

---

## 1. Skill 概述

### 1.1 核心定位

**brainstorm** 是需求发现命令，在实现前引导 AI 进行协作式需求发现。

| 维度 | 描述 |
|------|------|
| **目标** | 在实现前发现和澄清需求 |
| **触发时机** | 从 `/spec:start` 触发 |
| **特点** | 任务优先、行动优先、研究优先 |

### 1.2 核心原则

```
┌─────────────────────────────────────────────────────────────┐
│                    核心原则（不可协商）                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   1. Task-first (早捕获) - 确保任务在开始时就存在           │
│   2. Action before asking - 能推导就不问                    │
│   3. One question per message - 不用多个问题淹没用户        │
│   4. Prefer concrete options - 偏好具体选项                 │
│   5. Research-first for technical - 技术选择先研究          │
│   6. Diverge → Converge - 先扩展思考，再收敛到 MVP          │
│   7. No meta questions - 不问"应该搜索吗？"                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 执行流程

### 2.1 完整流程图

```
┌─────────────────────────────────────────────────────────────┐
│                   brainstorm 执行流程                        │
└─────────────────────────────────────────────────────────────┘

  ┌─────────────────┐
  │ Step 0: 确保任务│
  │ 存在（总是）    │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ Step 1: 自动上下│
  │ 文（问前先做）  │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ Step 2: 分类复杂│
  │ 度              │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ Step 3: 问题门控│
  │ （只问高价值）  │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ Step 4: 研究优先│
  │ 模式（技术选择）│
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ Step 5: 扩展扫描│
  │ （发散）        │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ Step 6: Q&A 循环│
  │ （收敛）        │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ Step 7: 提出方法│
  │ + 记录决策      │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ Step 8: 最终确认│
  │ + 实现计划      │
  └─────────────────┘
```

---

## 3. 步骤详解

### Step 0: 确保任务存在（总是）

在任何 Q&A 之前，确保任务存在。

```bash
TASK_DIR=$(python3 ./.spec-first/scripts/task.py create "brainstorm: <short goal>" --slug <auto>)
```

**立即创建/种子 `prd.md`**：

```markdown
# brainstorm: <short goal>

## Goal
<one paragraph: what + why>

## What I already know
* <facts from user message>
* <facts discovered from repo/docs>

## Assumptions (temporary)
* <assumptions to validate>

## Open Questions
* <ONLY Blocking / Preference questions; keep list short>

## Requirements (evolving)
* <start with what is known>

## Acceptance Criteria (evolving)
* [ ] <testable criterion>

## Definition of Done (team quality bar)
* Tests added/updated
* Lint / typecheck / CI green
* Docs/notes updated if behavior changes
* Rollout/rollback considered if risky

## Out of Scope (explicit)
* <what we will not do in this task>

## Technical Notes
* <files inspected, constraints, links, references>
```

### Step 1: 自动上下文（问前先做）

在问问题前，自己收集上下文：

**仓库检查清单**:
- 识别可能受影响的模块/文件
- 定位现有模式（类似功能、约定、错误处理风格）
- 检查配置、脚本、现有命令定义
- 记录任何约束（运行时、依赖策略、构建工具）

**文档检查清单**:
- 查找现有 PRD/specs/templates
- 查找命令使用示例、README、ADR

**写入 PRD**:
- 添加到 `What I already know`
- 添加约束/链接到 `Technical Notes`

### Step 2: 分类复杂度

| 复杂度 | 标准 | 动作 |
|--------|------|------|
| **Trivial** | 单行修复、拼写、明显变更 | 跳过 brainstorm，直接实现 |
| **Simple** | 目标明确、1-2 文件、范围清晰 | 问 1 个确认问题，然后实现 |
| **Moderate** | 多文件、有些模糊 | 轻量 brainstorm（2-3 高价值问题） |
| **Complex** | 目标模糊、架构选择、多种方法 | 完整 brainstorm |

### Step 3: 问题门控（只问高价值问题）

**Gate A — 能否不问用户就推导？**

如果答案可通过以下获得：
- 仓库检查（代码/配置）
- 文档/specs/约定
- 快速市场/OSS 研究

→ **不要问。** 获取、总结、更新 PRD。

**Gate B — 这是元问题/懒惰问题吗？**

示例：
- "应该搜索吗？"
- "能粘贴代码让我继续吗？"
- "代码长什么样？"（仓库可用时）

→ **不要问。** 采取行动。

**Gate C — 问题类型是什么？**

- **Blocking**: 没有用户输入无法继续
- **Preference**: 多种有效选择，取决于产品/UX/风险偏好
- **Derivable**: 应通过检查/研究回答

→ 只问 **Blocking** 或 **Preference**。

### Step 4: 研究优先模式（技术选择强制）

**触发条件（任一 → 研究优先）**:
- 任务涉及选择方法、库、协议、框架、模板系统、插件机制或 CLI UX 约定
- 用户询问"最佳实践"、"其他人怎么做"、"推荐"
- 用户无法合理枚举选项

**研究步骤**:
1. 识别 2-4 个可比较的工具/模式
2. 总结常见约定及其存在原因
3. 将约定映射到我们的仓库约束
4. 为我们的项目产出 **2-3 个可行方法**

**研究输出格式（PRD）**:

```markdown
## Research Notes

### What similar tools do
* ...
* ...

### Constraints from our repo/project
* ...

### Feasible approaches here

**Approach A: <name>** (Recommended)
* How it works:
* Pros:
* Cons:

**Approach B: <name>**
* How it works:
* Pros:
* Cons:
```

### Step 5: 扩展扫描（发散）

在总结目标后，主动扩展思考：

**扩展类别**（每类 1-2 条）:

1. **Future evolution**
   - 这个功能 1-3 个月后可能变成什么？
   - 值得现在保留什么扩展点？

2. **Related scenarios**
   - 哪些相邻命令/流程应与此保持一致？
   - 是否有对等期望（创建 vs 更新，导入 vs 导出等）？

3. **Failure & edge cases**
   - 冲突、离线/网络失败、重试、幂等性、兼容性、回滚
   - 输入验证、安全边界、权限检查

**扩展消息模板**:

```markdown
我理解您想实现：<current goal>

在设计之前，让我快速发散考虑三个类别（以避免后续返工）：

1. Future evolution: <1–2 bullets>
2. Related scenarios: <1–2 bullets>
3. Failure/edge cases: <1–2 bullets>

对于这个 MVP，您想包含哪些（或不包含）？

1. Current requirement only (minimal viable)
2. Add <X> (reserve for future extension)
3. Add <Y> (improve robustness/consistency)
4. Other: describe your preference
```

### Step 6: Q&A 循环（收敛）

**规则**:
- 每条消息一个问题
- 尽可能使用多选题
- 每次用户回答后：
  - 立即更新 PRD
  - 将已回答项从 `Open Questions` → `Requirements`
  - 用可测试复选框更新 `Acceptance Criteria`
  - 澄清 `Out of Scope`

**问题优先级**:
1. MVP 范围边界（包含/排除什么）
2. 偏好决策（展示具体选项后）
3. 失败/边缘行为（仅 MVP 关键路径）
4. 成功指标 & 验收标准

**偏好问题格式**:

```markdown
对于 <topic>，您偏好哪种方法？

1. **Option A** — <what it means + trade-off>
2. **Option B** — <what it means + trade-off>
3. **Option C** — <what it means + trade-off>
4. **Other** — describe your preference
```

### Step 7: 提出方法 + 记录决策

需求足够清晰后，提出 2-3 个方法：

```markdown
基于当前信息，这里有 2-3 个可行方法：

**Approach A: <name>** (Recommended)
* How:
* Pros:
* Cons:

**Approach B: <name>**
* How:
* Pros:
* Cons:

您偏好哪个方向？
```

**在 PRD 中记录为 ADR-lite**:

```markdown
## Decision (ADR-lite)

**Context**: 为什么需要这个决策
**Decision**: 选择了哪种方法
**Consequences**: 权衡、风险、潜在未来改进
```

### Step 8: 最终确认 + 实现计划

开放问题解决后，确认完整需求：

```markdown
这是我对完整需求的理解：

**Goal**: <one sentence>

**Requirements**:
* ...

**Acceptance Criteria**:
* [ ] ...

**Definition of Done**:
* ...

**Out of Scope**:
* ...

**Technical Approach**:
<brief summary + key decisions>

**Implementation Plan (small PRs)**:
* PR1: <scaffolding + tests + minimal plumbing>
* PR2: <core behavior>
* PR3: <edge cases + docs + cleanup>

这看起来正确吗？如果是，我将开始实现。
```

---

## 4. 反模式（硬性避免）

| 反模式 | 描述 |
|--------|------|
| 询问用户可从仓库推导的代码/上下文 | 应自己检查 |
| 在展示具体选项前让用户选择方法 | 先研究再提问 |
| 关于是否研究的元问题 | 直接研究 |
| 狭隘停留在初始请求，不考虑演进/边缘 | 主动扩展 |
| Brainstorm 漂移而不更新 PRD | 每次回答后更新 |

---

## 5. 与 Start 工作流的集成

Brainstorm 完成后（Step 8 确认批准），流程继续到 Task Workflow 的 **Phase 2: Prepare for Implementation**：

```
Brainstorm
  Step 0: Create task directory + seed PRD
  Step 1–7: Discover requirements, research, converge
  Step 8: Final confirmation → user approves
  ↓
Task Workflow Phase 2 (Prepare for Implementation)
  Code-Spec Depth Check (if applicable)
  → Research codebase (based on confirmed PRD)
  → Configure code-spec context (jsonl files)
  → Activate task
  ↓
Task Workflow Phase 3 (Execute)
  Implement → Check → Complete
```

任务目录和 PRD 已从 brainstorm 存在，因此 Task Workflow 的 Phase 1 完全跳过。

---

## 6. PRD 目标结构

`prd.md` 应收敛到：

```markdown
# <Task Title>

## Goal
<why + what>

## Requirements
* ...

## Acceptance Criteria
* [ ] ...

## Definition of Done
* ...

## Technical Approach
<key design + decisions>

## Decision (ADR-lite)
Context / Decision / Consequences

## Out of Scope
* ...

## Technical Notes
<constraints, references, files, research notes>
```

---

## 7. 相关命令

| 命令 | 使用时机 |
|------|---------|
| `/spec:start` | 触发 brainstorm 的入口点 |
| `/spec:finish-work` | 实现完成后 |
| `/spec:update-spec` | 如果工作中出现新模式 |

---

## 8. 总结

**brainstorm** 是需求发现引擎：

```
模糊需求 → brainstorm → 清晰 PRD
               │
               ├── Task-first（早捕获）
               ├── Action-first（不懒问）
               ├── Research-first（技术选择）
               └── Diverge → Converge（扩展后收敛）
```

**核心价值**:
- 需求澄清
- 避免返工
- 知识捕获
- 决策记录
