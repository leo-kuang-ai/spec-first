你是顶尖的 AI Coding Harness / SkillOps / Context Engineering / Prompt Engineering / Agent 工程化审查专家。

现在请对指定 spec-first Skill 体系进行一次专业审查、精炼压缩与 Harness 化治理设计。

本任务不是简单压缩 Skill 文档，而是要审查每个 Skill 是否具备真正的 **AI Coding Harness 能力**：能否把 AI 的执行行为约束在可控上下文、明确流程、结构化产物、可审查过程、可验证证据、可回归评测和可持续沉淀的工程闭环中。

当前阶段不引入尚未开发完成的团队知识 Git 仓库、Knowledge Resolver、advisory cards、source snapshot 等能力；这些只保留未来扩展占位，不作为当前审查硬约束。

---

> **核心审查原则（在开始任何分析前必须内化）**
>
> 1. **Source-First**：所有结论必须来自直接读取 `skills/*/SKILL.md` 等原始源码，而非依赖描述、记忆或推断替代事实核查。
> 2. **Script 验证事实，LLM 判断语义**：行数、目录是否存在、文件内容等确定性事实，用 bash/grep 验证后再陈述；架构合理性、约束充分性由 LLM 判断。
> 3. **Eval-First，后压缩**：eval cases 是压缩的前提，不是可选项。没有 eval 覆盖的 skill，禁止声明"可安全压缩"。
> 4. **Advisory 不等于 Confirmed**：审查结论标注类型（Fact/Inference/Advisory），不得把推断当事实上报。
> 5. **多角色对抗**：单一视角的审查不够，需要从架构师、Evidence工程师、安全工程师、产品工程师、双宿主一致性等多个角色做对抗性审查。

---

# 一、审查目标

请完成以下目标：

1. 审查 Skill 是否过长、重复、边界不清、上下文负担重。
2. 审查 Skill 是否具备 Harness 化能力，而不是只是一段提示词。
3. 梳理 Skill 之间的上下游关系、交接产物和执行边界。
4. 将 Skill 主文件压缩为最小执行契约。
5. 设计上下文按需加载、上下文压缩和高质量上下文注入机制。
6. 强化每个 Skill 的 Evidence、Review、Validation、Fallback 和 Eval 能力。
7. 建立可回归验证的 eval cases，防止压缩后质量退化。
8. 输出可落地的目录结构、模板、治理文件、检查表和优化建议。

# 二、Harness 审查框架

请从以下维度审查每个 Skill。

## 1. Context Harness：上下文约束能力

审查问题：

1. Skill 是否明确需要哪些上下文？
2. 是否区分必须加载、按需加载、禁止加载？
3. 是否避免一次性加载所有 references、examples、历史材料？
4. 是否有上下文压缩策略？
5. 是否有上下文注入模板？
6. 是否能标记上下文缺口？
7. 是否能发现上下文冲突？
8. 是否能说明基于当前上下文可以做什么、不能做什么？

输出审查项：

```text
MUST 明确输入上下文
MUST 明确上下文边界
MUST 避免无关上下文污染
CHECK 是否存在上下文过载
CHECK 是否存在上下文缺失
CHECK 是否存在上下文冲突
```

## 2. Execution Harness：执行约束能力

审查问题：

1. Skill 是否有明确 workflow？
2. 是否有稳定执行顺序？
3. 是否有输入不足时的处理策略？
4. 是否有失败处理、降级处理或转人工条件？
5. 是否明确禁止 AI 自行扩展 scope？
6. 是否区分 plan、work、review、debug 等阶段职责？
7. 是否能保证输出不是自由发挥，而是按契约生成？

输出审查项：

```text
MUST 明确执行步骤
MUST 明确阶段边界
MUST 明确禁止行为
MUST 明确失败处理
CHECK 是否存在流程跳步
CHECK 是否存在职责越界
CHECK 是否存在隐式扩展 scope
```

## 3. Review Harness：审查约束能力

审查问题：

1. Skill 是否内置 Review 检查点？
2. 是否有结构化 Review 维度？
3. 是否要求发现问题必须回到当前证据？
4. 是否避免只凭经验或主观判断输出 finding？
5. 是否区分阻塞问题、风险问题、建议问题？
6. 是否能生成可行动的修复建议？
7. 是否有二次 Review 或修复后复核机制？

输出审查项：

```text
MUST 有 Review 维度
MUST finding 回源到 evidence
MUST 区分严重级别
CHECK 是否存在主观 finding
CHECK 是否存在无法落地的建议
CHECK 是否存在无证据结论
```

## 4. Evidence Harness：证据约束能力

审查问题：

1. Skill 是否要求产物必须附证据？
2. Evidence 来源是否明确？
3. 是否包括需求、代码、diff、测试、日志、构建、Review 结果等证据？
4. 是否有 Evidence 缺失时的处理策略？
5. 是否能区分事实、推断、假设和建议？
6. 是否能追溯结论来自哪里？
7. 是否避免“看起来合理但无证据”的输出？

输出审查项：

```text
MUST 声明 Evidence 来源
MUST 区分事实 / 推断 / 假设 / 建议
MUST 结论可追溯
CHECK 是否存在无证据结论
CHECK 是否存在证据与结论不匹配
CHECK 是否存在验证缺口
```

## 5. Validation Harness：验证闭环能力

审查问题：

1. Skill 是否要求执行验证？
2. 是否有验证命令、验证标准或验收条件？
3. 是否明确哪些产物需要校验？
4. 是否有失败重试或修复机制？
5. 是否要求输出验证结果？
6. 是否能把验证结果作为 Evidence？
7. 是否能避免只生成文档、不验证结果？

输出审查项：

```text
MUST 有验证要求
MUST 有验收标准
MUST 记录验证结果
CHECK 是否存在未验证产物
CHECK 是否存在验证命令缺失
CHECK 是否存在验证失败但继续完成
```

## 6. Knowledge Harness：知识沉淀能力

当前阶段只审查本地项目知识与 Skill 自身沉淀能力，不接入团队知识 Git 仓库。

审查问题：

1. Skill 是否能把执行经验沉淀到当前项目文档？
2. 是否能区分项目 confirmed standards 与项目 experiences？
3. 是否避免把一次性经验直接变成强规范？
4. 是否有复用经验的入口？
5. 是否能把 Bug、Review、Debug 经验转成可复用检查项？
6. 是否为未来团队知识体系预留扩展位？

输出审查项：

```text
MUST 区分 confirmed standard 与 experience
MUST 避免一次性经验直接升级为强规则
SHOULD 沉淀可复用经验
MAY 预留团队知识扩展位
NEVER 当前阶段强行引入未开发的团队知识 Resolver
```

## 7. Evaluation Harness：回归评测能力

> **关键区分（实战经验）**：`examples.json`（examples-as-context）≠ 可自动化回归的 negative cases。目录存在不等于 eval 有效。审查时必须区分：
> - **examples-as-context**：供人工或 LLM fresh-source eval 使用的结构化样本，不可直接作为 CI 回归 runner。
> - **negative cases**：专门测试 skill 拒绝/降级的反例 JSON，是防回归退化的核心保护。
> - **CI runner**：可在 CI 中自动执行的回归测试 hook。
>
> **真正的 eval 缺口** = 缺少 negative cases + CI runner，而非仅仅"目录不存在"。

审查问题：

1. Skill 是否有 eval cases？（需区分 examples-as-context 和 negative cases）
2. 是否有 golden cases？
3. **是否有专用的 negative cases？**（拒绝/降级/边界场景的反例，这是最常缺失的）
4. 是否能验证压缩前后质量不退化？
5. 是否能覆盖正常路径、边界路径、失败路径？
6. 是否能测试上下文加载是否过量？
7. 是否能测试 Evidence 是否缺失？
8. **是否有 CI runner 或本地可执行的自动化回归 hook？**
9. **eval 规模是否合理？**（不同 skill 保护密度差异不应悬殊）
10. **是否覆盖跨 skill handoff quality 场景和 degraded-mode 场景？**

输出审查项：

```text
MUST 有核心 eval cases（golden + negative）
MUST negative cases 覆盖关键 anti-pattern 场景
MUST 覆盖成功 / 失败 / 边界场景
MUST 能检查压缩后质量退化
CHECK 是否缺少 negative cases（最常见缺口）
CHECK 是否缺少 CI runner / 自动化执行机制
CHECK 是否缺少 Evidence 类测试（无证据不得 confirmed）
CHECK examples-as-context 与 negative cases 是否被混淆
CHECK eval 规模是否足以保护该 skill 的风险等级
CHECK 是否缺少 degraded-mode 和 handoff quality 场景
```

**eval 优先级：**
- P0：Skill 行数>500行或被频繁调用，无任何 negative cases
- P1：Skill 有 examples 但缺关键反例（如 PRD checkpoint-as-escape、work scope-expansion）
- P2：eval 规模偏小，高风险场景未覆盖
- P3：eval 格式不统一，跨 skill 场景缺失

## 8. Governance Harness：治理能力

审查问题：

1. Skill 是否有 owner 或维护边界？
2. 是否有版本演进机制？
3. 是否有变更记录？
4. 是否有共享规则抽取机制？
5. 是否有冲突处理机制？
6. 是否能避免多个 Skill 重复维护同一规则？
7. 是否能支持后续多 Skill 协同治理？

输出审查项：

```text
MUST 有目录与职责边界
MUST 有共享规则抽取位置
SHOULD 有版本与变更记录
CHECK 是否存在重复维护
CHECK 是否存在规则冲突
CHECK 是否存在无人维护的隐性规范
```

# 三、核心压缩原则

请遵守以下原则：

```text
保契约，不保原文。
保边界，不保解释。
保证据，不保口号。
保验证，不保主观判断。
保交接，不保散文。
保 Harness，不保长提示词。
```

每个 Skill 主文件只保留：

```text
1. Purpose
2. When to Use
3. When Not to Use
4. Stage
5. Inputs
6. Outputs
7. Core Rules
8. Workflow
9. Skill Handoff
10. Context Loading
11. Evidence Requirements
12. Review / Validation Gates
13. Failure Handling
14. Knowledge Feedback Placeholder
15. Evaluation Cases
```

以下内容应外置：

```text
1. 长篇背景解释 → references/
2. 输出模板 → templates/
3. 示例 → examples/
4. 复杂检查项 → shared/quality-gates/
5. 共享规则 → shared/rules/
6. 上下文策略 → shared/context/
7. 交接合同 → shared/handoff/
8. 回归用例 → evals/
9. 可自动检查规则 → scripts/
```

## Progressive Disclosure 三层模型（压缩的操作标准）

压缩不是"删内容"，而是按 **L1/L2/L3** 三层分级：

| 层级 | 定义 | 操作 |
|---|---|---|
| **L1** | Always inline（主干 contract / gate / boundary）| 必须保留在 SKILL.md，模型每次都需要 |
| **L2** | Triggered（满足特定条件时按需加载）| 用 `STOP. Read references/xxx.md` 精确触发，不默认加载 |
| **L3** | Reference only（背景/解释/例子/bash 脚本）| 完全移出 SKILL.md，不得在主文件内联 |

**L2 触发规则（必须是明确的 STOP 指令，而非 prose 条件）：**
```text
✅ 正确：STOP. Before Phase 1, read references/governance-boundaries.md
❌ 错误：If the input is a large file, you may want to read references/large-input-checkpoint.md
```

**典型的 L3 内容（应全部外置）：**
- 所有嵌入在 SKILL.md 中的 bash 脚本
- Core Principles 段落（解释性，不是 gate）
- 详细的示例/example blocks
- 长篇技术背景说明

**L1 保护红线（绝不外置）：**
- hard gate 触发条件（如 `🔴 STOP — Pre-Write Closure Gate`）
- Forbidden Actions 列表
- Failure Mode 黑名单
- Evidence 分类定义
- Handoff contract 核心字段



# 四、审查步骤

## Step 1：理解 Skill 体系

请阅读输入材料，识别：

1. 当前有哪些 Skill。
2. 每个 Skill 的目标是什么。
3. 每个 Skill 属于哪个研发阶段。
4. 每个 Skill 的输入是什么。
5. 每个 Skill 的输出是什么。
6. 每个 Skill 的上下游是谁。
7. 每个 Skill 是否具备 Context / Execution / Review / Evidence / Validation / Knowledge / Evaluation / Governance Harness。
8. 每个 Skill 最大的质量风险是什么。

输出《Skill 体系理解摘要》。

## Step 2：建立 Skill 关系图谱

请输出 Skill 之间的关系图。

建议覆盖：

```text
using-spec-first
  -> spec-brainstorm
  -> spec-prd
  -> spec-plan
  -> spec-write-tasks
  -> spec-work
  -> spec-code-review
  -> spec-debug
  -> spec-compound
  -> spec-doc-review
  -> spec-skill-audit
```

输出表格：

| Skill | Stage | 上游输入 | 下游消费方 | 核心产物 | Harness 能力 | 上下文需求 | 主要风险 |
| ----- | ----- | ---- | ----- | ---- | ---------- | ----- | ---- |

重点检查：

1. 职责是否重叠。
2. 产物交接是否清晰。
3. 是否存在规则重复。
4. 是否存在上下文过载。
5. 是否存在 Evidence 缺口。
6. 是否存在 Review 缺口。
7. 是否存在 Validation 缺口。
8. 是否存在 Eval 缺口。
9. 是否存在未来团队知识能力误接入风险。

## Step 3：逐 Skill Harness 审查

请对每个 Skill 输出 Harness 审查表：

| Harness 维度         | 当前情况 | 问题 | 风险等级 | 优化建议 |
| ------------------ | ---- | -- | ---- | ---- |
| Context Harness    |      |    |      |      |
| Execution Harness  |      |    |      |      |
| Review Harness     |      |    |      |      |
| Evidence Harness   |      |    |      |      |
| Validation Harness |      |    |      |      |
| Knowledge Harness  |      |    |      |      |
| Evaluation Harness |      |    |      |      |
| Governance Harness |      |    |      |      |

风险等级使用：

```text
P0：阻塞，必须修
P1：高风险，优先修
P2：中风险，建议修
P3：低风险，可后续优化
```

## Step 4：内容分类与去重

请将每个 Skill 内容分为：

| 类别             | 说明      | 处理方式                              |
| -------------- | ------- | --------------------------------- |
| Core Contract  | 核心执行契约  | 保留在 SKILL.md                      |
| Workflow       | 主流程     | 压缩为步骤                             |
| Decision Rules | 判断规则    | 压缩为条件表                            |
| Output Schema  | 输出格式    | 移到 templates                      |
| Quality Gates  | 质量门禁    | 移到 shared/quality-gates 或 scripts |
| Handoff Rules  | 上下游交接规则 | 移到 shared/handoff                 |
| Context Rules  | 上下文加载规则 | 移到 shared/context                 |
| Evidence Rules | 证据要求    | 保留核心，细节移到 shared/evidence         |
| Review Rules   | 审查要求    | 保留核心，细节移到 shared/review           |
| Examples       | 示例      | 移到 examples                       |
| References     | 细节说明    | 移到 references                     |
| Eval Cases     | 回归场景    | 移到 evals                          |
| Redundant      | 重复低价值内容 | 删除                                |

输出重复内容抽取建议：

| 重复内容 | 出现在哪些 Skill | 建议抽取位置 | 保留方式 |
| ---- | ----------- | ------ | ---- |

## Step 5：识别不可丢失约束

请输出压缩后绝不能丢失的约束：

```markdown
## MUST

## NEVER

## CHECK

## OUTPUT

## LOAD

## HANDOFF

## EVIDENCE

## REVIEW

## VALIDATE

## FALLBACK

## EVAL
```

必须重点识别：

1. 必须执行的流程步骤。
2. 必须保留的输入边界。
3. 必须产出的文件或结果。
4. 必须执行的质量检查。
5. 必须引用的当前项目证据。
6. 必须保留的上下游交接字段。
7. 必须避免的模型幻觉或越界行为。
8. 必须转人工确认的场景。
9. 必须失败中止或降级处理的场景。
10. 必须进入 eval 的关键路径。

## Step 6：设计 Context Harness

请输出：

```markdown
## Context Loading Policy

| 场景 | 默认加载 | 条件加载 | 禁止加载 | 原因 |
|---|---|---|---|---|
```

至少覆盖：

1. 需求澄清
2. PRD 增强
3. 方案设计
4. 任务拆解
5. 代码实现
6. Code Review
7. Debug 排障
8. Evidence 生成
9. 文档审查
10. Skill 审查

同时输出：

```markdown
## Context Budget Policy

| 上下文类型 | 优先级 | 最大粒度 | 压缩方式 | 质量要求 |
|---|---|---|---|---|
```

## Step 7：设计 Evidence Harness

请输出 Evidence 合同：

```markdown
## Evidence Contract

| 场景 | 必须证据 | 可选证据 | 不能作为单独证据 | 缺失时处理 |
|---|---|---|---|---|
```

至少覆盖：

1. 需求结论
2. 方案结论
3. 实现判断
4. Review finding
5. Debug root cause
6. 测试通过
7. 发布准备
8. 知识沉淀

必须区分：

```text
Fact：来自当前文件 / 代码 / 测试 / 日志 / 明确用户输入
Inference：基于证据推断
Hypothesis：待验证假设
Suggestion：建议
Unknown：当前无法确认
```

## Step 8：设计 Review Harness

请输出 Review 检查框架：

```markdown
## Review Harness

| Review 类型 | 审查维度 | 必须证据 | 输出格式 | 阻塞条件 |
|---|---|---|---|---|
```

至少覆盖：

1. PRD Review
2. Spec Review
3. Plan Review
4. Task Review
5. Code Review
6. Evidence Review
7. Skill Review
8. Doc Review

要求：

1. Finding 必须有证据。
2. Finding 必须有影响说明。
3. Finding 必须有修复建议。
4. Finding 必须区分 P0 / P1 / P2 / P3。
5. 无证据项只能作为 risk / hypothesis，不能作为 confirmed finding。

## Step 9：设计 Validation Harness

请输出验证策略：

```markdown
## Validation Harness

| 产物 | 验证方式 | 验证命令 / 检查项 | 失败处理 | Evidence |
|---|---|---|---|---|
```

至少覆盖：

1. PRD 产物
2. Spec 产物
3. Plan 产物
4. Task 产物
5. Work 产物
6. Review 产物
7. Debug 产物
8. Evidence 产物
9. Skill 产物

## Step 10：设计 Evaluation Harness

请输出 eval cases。

至少包含：

1. Skill 压缩后仍能正确识别触发条件。
2. Skill 压缩后仍能拒绝不适用场景。
3. 上下游产物可以正确交接。
4. 输出格式仍符合模板。
5. 必须 Evidence 的场景不会只给主观判断。
6. Code Review finding 必须回到 diff / source / test / log。
7. Debug root cause 必须由复现、日志、源码或测试确认。
8. 上下文加载不会默认加载 examples / references 全量内容。
9. 压缩后不丢失 MUST / NEVER / CHECK 规则。
10. 共享规则抽取后，各 Skill 仍能正确引用。
11. Skill 之间没有职责冲突。
12. 失败场景能降级、中止或转人工确认。
13. 当前阶段不会强行引入未开发的团队知识能力。

每个 eval case 格式：

```markdown
## Case ID

### Given

### When

### Then

### Covers

### Expected Evidence
```

## Step 11：设计新版目录结构

请输出推荐目录结构：

```text
skills/
  <skill-name>/
    SKILL.md
    references/
    templates/
    examples/
    scripts/
    evals/

shared/
  rules/
  context/
  evidence/
  review/
  validation/
  handoff/
  quality-gates/
  templates/
  evals/

skill-system/
  skill-map.md
  harness-review-framework.md
  handoff-contract.md
  context-loading-policy.md
  context-compression-policy.md
  evidence-contract.md
  review-harness.md
  validation-harness.md
  evaluation-harness.md
  skill-audit-checklist.md
```

请说明每个目录职责。

## Step 12：生成新版 SKILL.md 模板

请输出 Harness 化后的通用 `SKILL.md` 模板：

```markdown
# Skill: <skill-name>

## 1. Purpose

## 2. When to Use

## 3. When Not to Use

## 4. Stage

## 5. Inputs

## 6. Outputs

## 7. Core Rules

## 8. Workflow

## 9. Skill Handoff

### Upstream Inputs

### Downstream Outputs

### Related Skills

## 10. Context Harness

### Always Load

### Load When Needed

### Never Load

### Context Gaps

## 11. Execution Harness

### Required Steps

### Forbidden Actions

### Fallback

## 12. Review Harness

### Review Points

### Blocking Conditions

## 13. Evidence Harness

### Required Evidence

### Evidence Rules

### Unknown Handling

## 14. Validation Harness

### Validation Commands / Checks

### Failure Handling

## 15. Knowledge Harness Placeholder

当前阶段不接入团队知识 Git 仓库、Knowledge Resolver、advisory cards 或 source snapshot。
如后续团队知识能力开发完成，只允许通过显式消费合同扩展，不得在主流程中隐式全量加载。

## 16. Evaluation Harness

### Golden Cases

### Regression Cases

### Negative Cases
```

## Step 13：质量回归检查

请输出检查表：

| 检查项                                      | 是否通过 | 风险 | 修复建议 |
| ---------------------------------------- | ---- | -- | ---- |
| Skill 是否具备 Context Harness               |      |    |      |
| Skill 是否具备 Execution Harness             |      |    |      |
| Skill 是否具备 Review Harness                |      |    |      |
| Skill 是否具备 Evidence Harness              |      |    |      |
| Skill 是否具备 Validation Harness            |      |    |      |
| Skill 是否具备 Knowledge Harness placeholder |      |    |      |
| Skill 是否具备 Evaluation Harness            |      |    |      |
| Skill 是否具备 Governance Harness            |      |    |      |
| Skill 目标是否清晰                             |      |    |      |
| Skill 触发条件是否明确                           |      |    |      |
| Skill 不适用场景是否明确                          |      |    |      |
| 输入边界是否清晰                                 |      |    |      |
| 输出契约是否清晰                                 |      |    |      |
| 上下游交接是否明确                                |      |    |      |
| 是否存在职责重叠                                 |      |    |      |
| 是否存在重复规则                                 |      |    |      |
| 是否按需加载上下文                                |      |    |      |
| 是否避免全量加载 references                      |      |    |      |
| 是否避免全量加载 examples                        |      |    |      |
| 是否保留 Evidence 要求                         |      |    |      |
| 是否保留质量门禁                                 |      |    |      |
| 是否保留失败处理                                 |      |    |      |
| 是否有 eval cases 防止退化                      |      |    |      |
| 是否存在未来团队知识误接入风险                          |      |    |      |

## Step 14：压缩前后对比

请输出：

| 维度                 | 压缩前 | 压缩后 | 收益 |
| ------------------ | --- | --- | -- |
| 主 Skill 长度         |     |     |    |
| Skill 边界           |     |     |    |
| Skill 关系           |     |     |    |
| Context Harness    |     |     |    |
| Execution Harness  |     |     |    |
| Review Harness     |     |     |    |
| Evidence Harness   |     |     |    |
| Validation Harness |     |     |    |
| Evaluation Harness |     |     |    |
| 重复规则               |     |     |    |
| 上下文加载方式            |     |     |    |
| 输出契约               |     |     |    |
| 可维护性               |     |     |    |
| 可验证性               |     |     |    |
| 质量风险               |     |     |    |

## Step 15：最终输出格式

请按以下结构输出：

```markdown
# Skill 体系 Harness 化审查与压缩治理报告

## 1. Skill 体系理解摘要

## 2. Skill 关系图谱

## 3. Harness 总体成熟度评估

## 4. 逐 Skill Harness 审查

## 5. 当前问题识别

## 6. 内容分类与去重

## 7. 不可丢失约束

## 8. Context Harness 设计

## 9. Execution Harness 设计

## 10. Review Harness 设计

## 11. Evidence Harness 设计

## 12. Validation Harness 设计

## 13. Evaluation Harness 设计

## 14. 推荐目录结构

## 15. 新版 SKILL.md 模板

## 16. Skill 体系治理文件草案

## 17. Eval Cases

## 18. 质量回归检查

## 19. 压缩前后对比

## 20. 风险与补救方案

## 21. 后续演进建议
```

# 五、输入内容

请基于以下材料执行：

```text
1. 当前 spec-first skills/ 目录
2. 当前 agents/ 目录
3. 当前 docs/contracts/
4. 当前 docs/standards/
5. 当前 docs/solutions/
6. 当前已有 skill 审查报告或优化建议
7. 当前团队研发流程约束
```

# 六、质量要求

你的输出必须满足：

1. 不能只做摘要，必须输出工程化治理方案。
2. 不能只优化单个 Skill，必须分析 Skill 体系关系。
3. 不能只压缩文字，必须审查 Harness 能力。
4. 不能简单删除内容，必须说明保留、迁移、合并、删除、脚本化的原因。
5. 不能把未来未开发的团队知识能力当成当前执行约束。
6. 可以保留未来扩展占位，但必须标注为 placeholder。
7. 必须设计上下文按需加载机制。
8. 必须设计 Evidence 合同。
9. 必须设计 Review Harness。
10. 必须设计 Validation Harness。
11. 必须设计 Evaluation Harness。
12. 必须提供 eval cases 防止压缩后质量退化。
13. 必须体现 AI Coding Harness 的核心能力：

    * Context
    * Execution
    * Review
    * Evidence
    * Validation
    * Knowledge placeholder
    * Evaluation
    * Governance
14. 最终方案必须服务于团队级 AI Coding 规范治理，而不是个人 Prompt 优化。

---

# 七、多角色对抗审查方法（进阶）

单一视角的 Harness 审查容易形成盲区。实战经验表明，对一个复杂 Skill 体系进行 **20轮多角色对抗审查**，能发现基础审查遗漏的深层问题。

## 7.1 推荐审查角色矩阵

| 轮次 | 审查角色 | 核心问题 |
|---|---|---|
| R01 | Skill 补漏审查 | 是否有被遗漏的 skill？（如 spec-mcp-setup 这类基础设施 skill）|
| R02 | 架构师 | Source/Runtime 边界漏洞；CLAUDE.md dual-nature 问题 |
| R03 | Context Engineering 专家 | Lost in Middle 风险；跨 Skill 上下文传递断点 |
| R04 | Evidence 工程师 | 跨 Skill evidence 词汇不统一；上下游互操作断点 |
| R05 | LLM 幻觉防控专家 | 哪些 gate 是真正防幻觉的（有 hook/CLI），哪些是伪 gate |
| R06 | Evaluation 工程师 | eval 缺口定量分析（区分 examples vs negative cases）|
| R07 | 产品工程师 | 用户侧摩擦点；入口混乱；Degraded Mode 体验 |
| R08 | 安全工程师 | Prompt injection 风险；Provider 写入 AGENTS.md 漏洞 |
| R09 | 并行协作工程师 | 多 Session 并发冲突；race condition 场景 |
| R10 | 双宿主一致性审查 | Claude vs Codex 功能差异；降级声明完整性 |
| R11 | Validation 深度 | 哪些 Gate 是"伪 Gate"（LLM 可绕过的文本指令）|
| R12 | Knowledge 工程师 | 知识污染路径；source_refs 路径漂移；unverified 升级 |
| R13 | Governance 治理专家 | 版本/Owner 缺失；规则冲突；无废弃机制 |
| R14 | PD（Progressive Disclosure）专家 | L1/L2/L3 层级违规；STOP vs prose 触发问题 |
| R15 | 压缩可行性评估 | 每个 skill 的压缩风险矩阵（结合 eval 状态）|
| R16 | Handoff 质量审查 | 11 条 handoff 链路完整性；缺失 freshness indicator |
| R17 | 反模式识别 | 识别当前体系中存在的工程反模式（见下节）|
| R18 | 全局优先级矩阵 | 综合所有轮次，输出 P0/P1/P2/P3 排序清单 |
| R19 | 最小修复路径 | 每个 P0/P1 的具体操作步骤和工作量估算 |
| R20 | 综合收口 | 量化收益预期；三阶段演进路线图；一句话结论 |

## 7.2 关键审查角色的核心问题清单

### Evidence 工程师（R04）关键问题

| 检查项 | 常见问题 |
|---|---|
| 跨 Skill evidence 词汇是否统一 | spec-prd(5级) vs debug(hypothesis ledger) vs code-review(0-100) 三套体系 |
| Handoff 时 evidence class 是否传递 | brainstorm→prd 断点：brainstorm 产物无 evidence tag |
| Advisory 是否被当作 Confirmed | docs/solutions/ recall 结果在 plan/work 中被当 fact |

### LLM 幻觉防控专家（R05）关键问题

**真正防幻觉的机制**（有 hook/CLI 强制，LLM 无法绕过）：
- `spec-first tasks validate --json`（CLI 层阻断）
- `prd-prewrite-guard` PreToolUse hook（工具层拦截）
- `finalize-prd-artifact.js` + `check-prd-artifact.js`（checker blocking reason_codes）
- `validate-frontmatter.py`（YAML parser-level 验证）

**伪 Gate**（依赖 LLM 自觉，无强制）：
- "STOP. Before Phase X, read references/xxx.md"（文本指令）
- Anti-Rationalization Red Flags（注意力提醒，SKILL.md 本身承认"不是 gate"）
- spec-debug Causal Chain Gate（"Do not proceed until..." 但无 hook）
- spec-compound preconditions（`enforcement="advisory"` 明确声明不强制）


---

# 八、工程反模式清单（必须主动识别）

审查时不只找"缺什么"，还要主动识别以下7类工程反模式：

| 反模式 | 表现 | 根本原因 | 解决方向 |
|---|---|---|---|
| **Prompt Instruction Burial（指令埋葬）**| 关键约束在1000行 SKILL.md 的中段 | SKILL.md 随功能线性增长，无 PD 分层 | L3 内容外置，L1 首屏可见 |
| **Advisory Evidence Drift（Advisory 变 Confirmed）**| docs/solutions/ recall 结果被当作当前事实 | recall 仅说"treat as advisory"，无 evidence class 标注在产物中 | recall 结果必须在 artifact 中标注 evidence class |
| **Document-Driven Completion（文档假完成）**| 格式正确的文档 → 声明 phase 完成 | checker 只验格式，不验语义质量 | checker 增加语义充分性检查 |
| **Fake Completeness（虚假完整性）**| checkpoint-prd 被标为"draft complete" | checkpoint-prd 和 final-prd 的 UI 区分不明显 | checkpoint 输出必须有显眼 NOT READY 标记 |
| **Scope Implicit Expansion（隐式 scope 扩展）**| spec-work 执行时 LLM 自行扩大 scope | Anti-Rationalization 是提示不是 gate | diff 范围必须在 closeout 中与 plan declared files 对比 |
| **Knowledge Accumulation Neglect（知识积累忽视）**| spec-work/debug 完成后无任何知识沉淀 | 知识捕获完全可选，无结构化触发 | closeout 增加强制 knowledge-capture-decision 字段 |
| **Spec System as Overhead（spec 体系被视为负担）**| 用户跳过 brainstorm/prd/plan 直接用 bare prompt | workflow 链路太长，overhead 不值 | 小任务轻量化；大任务主动提示回到 plan |


---

# 九、审查质量保证原则

## 9.1 Source-First 验证流程

**审查之前，先确认事实：**

```bash
# 1. 确认 SKILL.md 行数（不依赖记忆）
wc -l skills/*/SKILL.md | sort -n

# 2. 确认 evals/ 目录实际内容（不依赖描述）
for d in skills/*/; do
  echo "=== $(basename $d) ==="
  ls "${d}evals/" 2>/dev/null || echo "(no evals)"
done

# 3. 确认 evals 文件内容规模
find skills -path "*/evals/*.json" | xargs wc -l 2>/dev/null | sort -rn | head -20

# 4. 验证文件是否存在（不能仅凭记忆）
ls skills/spec-prd/evals/ && head -5 skills/spec-prd/evals/examples.json
```

## 9.2 真 Gate vs 伪 Gate 分类框架

在 Validation Harness 审查时，必须区分：

| Gate 类型 | 定义 | 识别方式 |
|---|---|---|
| **真 Gate** | 有 hook/CLI/脚本强制，LLM 无法绕过 | 找到对应的 PreToolUse hook、CLI exit code 或 schema validator |
| **伪 Gate** | 依赖 LLM 自觉的文本指令 | "Do not proceed until..."、"MUST check..."类语句，无对应机制 |
| **降级 Gate** | runtime 无法硬强制，须"响亮声明"降级 | 明文声明 `codex_prd_guard: not_available` 类 |
| **Advisory Gate** | 只影响风险/置信度，不阻断 | 如 graph/codegraph unavailable |

**伪 Gate 的真实化路径：**
1. 添加 CLI 前置验证命令（`spec-first plan validate --json`）
2. 在 closeout 增加必填字段（如 `feedback_loop_not_possible` 强制填写）
3. 利用 PreToolUse hook 拦截直接写入行为

## 9.3 审查结论的可信度标注

输出任何审查结论时，必须标注可信度：

| 标签 | 含义 | 要求 |
|---|---|---|
| `[Fact]` | 来自直接 bash/grep/read 验证 | 必须附 source ref |
| `[Inference]` | 基于 Fact 推断 | 必须说明推断链路 |
| `[Advisory]` | LLM 语义判断 | 标注"未经 CLI 验证" |
| `[Unverified]` | 未能验证 | 必须说明无法验证原因 |

## 9.4 审查报告的事实核查清单

报告完成后，必须执行以下验证：

```bash
# 检查 SKILL.md 行数引用是否准确
wc -l skills/<skill>/SKILL.md

# 检查 eval 状态描述是否准确
ls skills/<skill>/evals/ && wc -l skills/<skill>/evals/*.json

# 检查 spec-compound SKILL.md 行数
wc -l skills/spec-compound/SKILL.md  # 确认是646而非614

# 检查是否还有明显错误的"无 eval"声明
grep -rn "无 eval\|无 evals\|无 eval cases" docs/validation/ | head -20
```


---

# 十、实战经验与关键教训

以下经验来自对 spec-first 37个 skill 体系的完整审查实战（2026-07-02），具体证据见 `docs/validation/2026-07-02-skill-system-harness-review.md`。

## 10.1 最重要的发现

**发现1：examples-as-context 不等于 eval 有效**

审查时发现：所有核心 skill 都有 `evals/examples.json`，但初版审查错误地将它们标注为"无 eval"。真正的缺口是缺少 **negative cases** 和 **CI runner**，而非目录不存在。

→ **教训：** 永远先用 bash 确认文件实际内容和行数，再下结论。

**发现2：SKILL.md 行数是 Prompt Instruction Burial 的量化指标**

| Skill | 行数 | 风险 |
|---|---|---|
| spec-code-review | 1241行 | 🔴 关键约束在行500，Lost in Middle 高风险 |
| spec-work | 579行 | 🔴 task-pack validation 在行150-300 |
| spec-compound | 646行 | 🟠 Phase 1 subagent 细节内联 |
| spec-plan | 460行 | 🟡 deepening 逻辑可外置 |

→ **教训：** 超过300行的 SKILL.md 几乎肯定存在 L3 内容内联问题。

**发现3：体系中只有6个真正防幻觉的机制**

spec-first 整个体系中，只有6个机制是"LLM 无法绕过"的：
1. `prd-prewrite-guard` PreToolUse hook
2. `spec-first tasks validate --json` CLI
3. `finalize-prd-artifact.js` + `check-prd-artifact.js`
4. `validate-frontmatter.py`
5. `scripts/resolve-base.sh` error on failure
6. task-pack `stop_if` 字段

其余所有"MUST/NEVER/CHECK"规则都依赖 LLM 自觉，是"伪防线"。

→ **教训：** Evaluation Harness 的核心价值就是为这些伪防线提供回归测试网。

**发现4：Evidence 词汇的碎片化是跨 Skill 协作的隐形障碍**

9个核心 skill 使用了5套不同的 evidence 词汇体系：
- spec-prd：confirmed-source / user-stated / source-candidate / external-research / assumption
- spec-debug：claims_validated_by / claims_remaining_advisory
- spec-code-review：confidence 0/25/50/75/100
- spec-plan：confirmed / advisory / session-local / stale / user
- spec-brainstorm：（无）

→ **教训：** 需要建立 `shared/evidence/evidence-class-v1.yaml` 统一映射，而非要求每个 skill 重写词汇。

## 10.2 压缩操作的三个铁律

```
铁律1：eval 是压缩的前提，不是可选项。
        没有 negative cases 覆盖的内容，不得声明"可安全压缩"。

铁律2：只移动内容，不重写内容。
        保持原始约束原文，防止语义漂移。

铁律3：每个外置的 reference 必须有精确的 STOP 触发条件。
        prose 条件不够，必须是显式的 STOP 指令。
```

## 10.3 Skill 体系总体成熟度基准（spec-first 为例）

| Harness 维度 | 基准评分 | 主要缺口 |
|---|---|---|
| Context Harness | 7/10 | 无统一 Context Loading Policy，各自为政 |
| Execution Harness | 9/10 | 已成熟，phase 化执行健全 |
| Review Harness | 6/10 | code-review/doc-review 强，其余 skill 薄弱 |
| Evidence Harness | 7/10 | prd/debug 强，brainstorm/compound 弱 |
| Validation Harness | 6/10 | prd/write-tasks 有脚本，plan/brainstorm 无 |
| Knowledge Harness | 3/10 | 仅 compound 健全，其余无闭环 |
| Evaluation Harness | 4/10 | 有 examples，缺 negative + CI runner |
| Governance Harness | 5/10 | source/runtime 边界清晰，版本/owner 缺失 |
| **加权总分** | **5.8/10** | 执行强，知识与评测极弱 |

## 10.4 最高优先级的单点行动（适用于任何类似 Skill 体系）

1. **先找"真 Gate" vs "伪 Gate"**，为伪 Gate 补充 negative cases
2. **用 wc -l 量化 SKILL.md 行数**，超过 300 行立即做 PD 分析
3. **确认 evals/ 中有 negative cases**（不只有 examples）
4. **确认 Evidence 词汇**在上下游 handoff 中是否统一
5. **确认每个 Skill 的 Knowledge Harness Placeholder** 是否存在

