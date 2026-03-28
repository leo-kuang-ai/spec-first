# 头脑风暴 - 需求发现（AI 编码增强版）

在实现**之前**，引导 AI 进行协作式需求发现，针对 AI 编码工作流优化：

* **任务优先**（立即捕获想法）
* **行动先于询问**（减少低价值问题）
* **技术选择先研究**（避免让用户发明选项）
* **发散 → 收敛**（扩展思维，然后锁定 MVP）

---

## 何时使用

当用户从 `/spec:start` 描述开发任务时触发，特别是：

* 需求不清晰或正在演变
* 存在多种有效的实现路径
* 权衡很重要（用户体验、可靠性、可维护性、成本、性能）
* 用户可能不知道最佳选项

---

## 核心原则（不可协商）

1. **任务优先（早期捕获）**
   始终确保在开始时存在任务，以便立即记录用户的想法。

2. **行动先于询问**
   如果你可以从仓库代码、文档、配置、约定或快速研究中得出答案——先做那个。

3. **每条消息一个问题**
   永远不要用问题列表压倒用户。问一个，更新 PRD，重复。

4. **优先具体选项**
   对于偏好/决策问题，提出 2-3 个可行的、具体的方法及其权衡。

5. **技术选择先研究**
   如果决策取决于行业惯例/类似工具/既定模式，先做研究，然后提出选项。

6. **发散 → 收敛**
   初步理解后，主动考虑未来演进、相关场景和失败/边缘情况——然后收敛到带有明确范围外内容的 MVP。

7. **不要元问题**
   不要问"我应该搜索吗？"或"你能粘贴代码让我继续吗？"
   如果你需要信息：搜索/检查。如果受阻：问最小的阻塞问题。

---

## 步骤 0：确保任务存在（始终）

在任何问答之前，确保任务存在。如果不存在，立即创建一个。

* 使用从用户消息派生的**临时工作标题**。
* 标题不完美没关系——稍后在 PRD 中完善。

```bash
TASK_DIR=$(python3 ./.spec-first/scripts/task.py create "brainstorm: <short goal>" --slug <auto>)
```

立即创建/种子 `prd.md`，包含你知道的内容：

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

* Tests added/updated (unit/integration where appropriate)
* Lint / typecheck / CI green
* Docs/notes updated if behavior changes
* Rollout/rollback considered if risky

## Out of Scope (explicit)

* <what we will not do in this task>

## Technical Notes

* <files inspected, constraints, links, references>
* <research notes summary if applicable>
```

---

## 步骤 1：自动上下文（提问前先做这个）

在问"代码是什么样的？"这类问题之前，自己收集上下文：

### 仓库检查清单

* 识别可能受影响的模块/文件
* 定位现有模式（类似功能、约定、错误处理风格）
* 检查配置、脚本、现有命令定义
* 注意任何约束（运行时、依赖策略、构建工具）

### 文档检查清单

* 查找现有的 PRD/规范/模板
* 查找命令使用示例、README、ADR（如果有）

将发现写入 PRD：

* 添加到 `What I already know`
* 将约束/链接添加到 `Technical Notes`

---

## 步骤 2：分类复杂性（仍然有用，不作为任务创建的门控）

| 复杂性 | 标准 | 行动 |
| ------ | ---- | ---- |
| **琐碎** | 单行修复、错别字、明显更改 | 跳过头脑风暴，直接实现 |
| **简单** | 目标明确、1-2 个文件、范围定义良好 | 问 1 个确认问题，然后实现 |
| **中等** | 多个文件、一些歧义 | 轻度头脑风暴（2-3 个高价值问题） |
| **复杂** | 目标模糊、架构选择、多种方法 | 完整头脑风暴 |

> 注意：任务已从步骤 0 存在。分类只影响头脑风暴的深度。

---

## 步骤 3：问题门槛（只问高价值问题）

在问任何问题之前，运行以下门槛：

### 门槛 A — 我可以不需要用户就得出这个吗？

如果答案可通过以下方式获得：

* 仓库检查（代码/配置）
* 文档/规范/约定
* 快速市场/OSS 研究

→ **不要问。** 获取它，总结，更新 PRD。

### 门槛 B — 这是一个元/懒惰问题吗？

示例：

* "我应该搜索吗？"
* "你能粘贴代码让我继续吗？"
* "代码是什么样的？"（当仓库可用时）

→ **不要问。** 采取行动。

### 门槛 C — 这是什么类型的问题？

* **阻塞**：没有用户输入无法继续
* **偏好**：多种有效选择，取决于产品/UX/风险偏好
* **可推导**：应该通过检查/研究回答

→ 只问 **阻塞** 或 **偏好**。

---

## 步骤 4：先研究模式（技术选择强制）

### 触发条件（任一 → 先研究）

* 任务涉及选择方法、库、协议、框架、模板系统、插件机制或 CLI UX 约定
* 用户询问"最佳实践"、"其他人怎么做"、"推荐"
* 用户无法合理枚举选项

### 研究步骤

1. 识别 2-4 个可比较的工具/模式
2. 总结常见约定及其存在原因
3. 将约定映射到我们的仓库约束
4. 为我们的项目产生 **2-3 个可行方法**

### 研究输出格式（PRD）

在 PRD 中添加一个部分（在技术备注内或作为独立部分）：

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

**Approach C: <name>** (optional)

* ...
```

然后问 **一个** 偏好问题：

* "你更喜欢哪种方法：A / B / C（或其他）？"

---

## 步骤 5：扩展扫描（发散）— 初步理解后必需

在你能够总结目标后，在收敛之前主动扩展思维。

### 扩展类别（每个保持 1-2 个要点）

1. **未来演进**

   * 这个功能在 1-3 个月内可能变成什么？
   * 现在值得保留哪些扩展点？

2. **相关场景**

   * 哪些相邻的命令/流程应该与此保持一致？
   * 是否有奇偶期望（创建 vs 更新、导入 vs 导出等）？

3. **失败和边缘情况**

   * 冲突、离线/网络故障、重试、幂等性、兼容性、回滚
   * 输入验证、安全边界、权限检查

### 扩展消息模板（给用户）

```markdown
我理解你想实现：<current goal>。

在深入设计之前，让我快速发散考虑三个类别（以避免以后返工）：

1. 未来演进：<1–2 个要点>
2. 相关场景：<1–2 个要点>
3. 失败/边缘情况：<1–2 个要点>

对于这个 MVP，你想包含哪些（或不包含）？

1. 仅当前需求（最小可行）
2. 添加 <X>（为未来扩展保留）
3. 添加 <Y>（提高健壮性/一致性）
4. 其他：描述你的偏好
```

然后更新 PRD：

* MVP 中的内容 → `Requirements`
* 排除的内容 → `Out of Scope`

---

## 步骤 6：问答循环（收敛）

### 规则

* 每条消息一个问题
* 尽可能使用多选
* 每次用户回答后：

  * 立即更新 PRD
  * 将已回答的项目从 `Open Questions` 移至 `Requirements`
  * 用可测试的复选框更新 `Acceptance Criteria`
  * 澄清 `Out of Scope`

### 问题优先级（推荐）

1. **MVP 范围边界**（包含/排除什么）
2. **偏好决策**（在提出具体选项后）
3. **失败/边缘行为**（仅针对 MVP 关键路径）
4. **成功指标和验收标准**（证明它有效的标准）

### 首选问题格式（多选）

```markdown
对于 <topic>，你更喜欢哪种方法？

1. **Option A** — <what it means + trade-off>
2. **Option B** — <what it means + trade-off>
3. **Option C** — <what it means + trade-off>
4. **Other** — 描述你的偏好
```

---

## 步骤 7：提出方法 + 记录决策（复杂任务）

需求足够清晰后，提出 2-3 种方法（如果尚未通过先研究完成）：

```markdown
根据当前信息，这里有 2-3 种可行方法：

**Approach A: <name>** (Recommended)

* How:
* Pros:
* Cons:

**Approach B: <name>**

* How:
* Pros:
* Cons:

你更喜欢哪个方向？
```

在 PRD 中记录结果作为 ADR-lite 部分：

```markdown
## Decision (ADR-lite)

**Context**: Why this decision was needed
**Decision**: Which approach was chosen
**Consequences**: Trade-offs, risks, potential future improvements
```

---

## 步骤 8：最终确认 + 实现计划

当开放问题解决后，用结构化摘要确认完整需求：

### 最终确认格式

```markdown
这是我对完整需求的理解：

**Goal**: <one sentence>

**Requirements**:

* ...
* ...

**Acceptance Criteria**:

* [ ] ...
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

这看起来正确吗？如果是，我将继续实现。
```

### 子任务分解（复杂任务）

对于具有多个独立工作项的复杂任务，创建子任务：

```bash
# Create child tasks
CHILD1=$(python3 ./.spec-first/scripts/task.py create "Child task 1" --slug child1 --parent "$TASK_DIR")
CHILD2=$(python3 ./.spec-first/scripts/task.py create "Child task 2" --slug child2 --parent "$TASK_DIR")

# Or link existing tasks
python3 ./.spec-first/scripts/task.py add-subtask "$TASK_DIR" "$CHILD_DIR"
```

---

## PRD 目标结构（最终）

`prd.md` 应该收敛到：

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

## 反模式（坚决避免）

* 向用户索要可以从仓库推导的代码/上下文
* 在提出具体选项之前让用户选择方法
* 关于是否研究的元问题
* 狭隘地停留在初始请求上，而不考虑演进/边缘
* 让头脑风暴漂移而不更新 PRD

---

## 与开始工作流集成

头脑风暴完成后（步骤 8 确认批准），流程继续到任务工作流的 **阶段 2：准备实现**：

```text
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

任务目录和 PRD 已从头脑风暴中存在，因此任务工作流的阶段 1 被完全跳过。

---

## 相关命令

| Command | When to Use |
|---------|-------------|
| `/spec:start` | 触发头脑风暴的入口点 |
| `/spec:finish-work` | 实现完成后 |
| `/spec:update-spec` | 如果在工作期间出现新模式 |
