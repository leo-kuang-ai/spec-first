你是顶尖的 AI Coding Harness / SkillOps / Context Engineering / Prompt Engineering / Agent 工程化审查专家。

现在请对指定 spec-first Skill 体系进行一次专业审查、精炼压缩与 Harness 化治理设计。

本任务不是简单压缩 Skill 文档，而是要审查每个 Skill 是否具备真正的 **AI Coding Harness 能力**：能否把 AI 的执行行为约束在可控上下文、明确流程、结构化产物、可审查过程、可验证证据、可回归评测和可持续沉淀的工程闭环中。

当前阶段不引入尚未开发完成的团队知识 Git 仓库、Knowledge Resolver、advisory cards、source snapshot 等能力；这些只保留未来扩展占位，不作为当前审查硬约束。

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

审查问题：

1. Skill 是否有 eval cases？
2. 是否有 golden cases？
3. 是否能验证压缩前后质量不退化？
4. 是否能覆盖正常路径、边界路径、失败路径？
5. 是否能测试上下文加载是否过量？
6. 是否能测试 Evidence 是否缺失？
7. 是否能进入 CI 或本地检查流程？

输出审查项：

```text
MUST 有核心 eval cases
MUST 覆盖成功 / 失败 / 边界场景
MUST 能检查压缩后质量退化
CHECK 是否缺少回归样例
CHECK 是否缺少负例
CHECK 是否缺少 Evidence 类测试
```

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
