---
name: "spec-first:spec"
description: "Use when a feature is in 01_specify and you need to turn a raw request into structured requirements, acceptance criteria, and traceable spec outputs."
version: 3.0.0
last_updated: 2026-03-09
changelog: "v3.0.0: Progressive Disclosure 重构，精简到 ~200 行; v2.2.0: 新增 Phase 0.0/0.2/0.5 增强; v2.1.0: 新增自动 Feature 定位; v2.0.0: 重构为 Phase 0 + Step 0-8 流程"
user-invocable: true
allowed-tools: "Read, Write, Edit, Bash"
---

# Skill: spec

定义需求规格，通过 Phase 0（PRD）+ Step 0-8 流程生成 FR 功能需求与验收标准（AC）。

- Command: `/spec-first:spec [featureId]`

## Announce at Start

```
I'm using the spec skill to define requirements for [Feature].
```

---

## 核心流程

### Phase 0: PRD 生成

详见 [Phase 0 PRD 工作流](references/phase0-prd-workflow.md)

**快速概览**:
- **Phase 0.0**: Feature 快速初始化（防止信息丢失）
- **Phase 0.1**: 任务锚定
- **Phase 0.2**: 质量扫描 + 自动上下文收集
- **Phase 0.3**: PRD 生成（文档提取 or 口述）
- **Phase 0.4**: PRD 自检（C-PRD >= 85%）
- **Phase 0.5**: PRD 补全对话（两道门禁 + 一问一答）
- **Phase 0.6**: PRD 用户确认

**门禁**: C-PRD >= 85%

---

### Step 0-8: FR/AC 定义

详见 [Step 0-8 工作流](references/steps-fr-ac-workflow.md)

**快速概览**:
- **Step 0**: 任务存在性检查
- **Step 1**: [已合并到 Phase 0.2]
- **Step 2**: 复杂度判定（详见 [复杂度表](references/complexity-matrix.md)）
- **Step 3**: 提问门禁（先推导再提问）
- **Step 4**: 调研模式（技术选型前调研）
- **Step 5**: 发散扫描（边界/失败场景/NFR）
- **Step 6**: 收敛确认（逐项确认 FR/AC）
- **Step 7**: ADR 决策记录（Complex 时）
- **Step 8**: 最终确认 + Gate Check

---

## 流程总览（ASCII）

```text
Phase 0: PRD 生成
  0.0 初始化 Feature
  0.1 任务锚定
  0.2 质量扫描 + 自动上下文收集
      - 完整度扫描
      - constitution / 仓库 / 依赖收集
      - [ASSUMED] / [NEEDS CLARIFICATION]
      - 初步复杂度判定 + 质量门禁
  0.3 PRD 生成
  0.4 PRD 自检 (C-PRD >= 85%)
  0.5 PRD 补全对话
      - 先推导再提问
      - 风险排序: 范围 > 安全 > 合规 > UX > 技术偏好
      - 最多 5 轮, 每轮最多 3 问
  0.6 用户确认 PRD
           │
           v
Step 0: Ensure Task Exists
           │
           v
Step 2: Complexity Calibration
           │
           v
        ┌──────────────────────────────────────────────┐
        │ Complexity Path                              │
        │ Trivial  -> 0 + 2 + 8                        │
        │ Simple   -> 0 + 2-3 + 6 + 8                 │
        │ Moderate -> 0 + 2-6 + 8 (Step 7 optional)   │
        │ Complex  -> 0 + 2-8                         │
        └──────────────────────────────────────────────┘
           │
           v
Step 3: Question Gate
           │
           v
Step 4: Research-first Mode (Moderate/Complex)
           │
           v
Step 5: Expansion Sweep
           │
           v
Step 6: Converge Q&A -> FR/AC
           │
           v
P1.5 Constitution Check
           │
           v
Step 7: ADR-lite (if needed)
           │
           v
Step 8: Final Confirmation + Gate Check
           │
           v
spec-review / design / next stage
```

---

## 复杂度自适应跳过规则

| 复杂度 | 执行路径 |
|--------|---------|
| Trivial | Phase 0 + Step 0 + Step 2 + Step 8 |
| Simple | Phase 0 + Step 0 + Step 2-3 + Step 6 + Step 8 |
| Moderate | Phase 0 + Step 0 + Step 2-6 + Step 8（可选 Step 7） |
| Complex | Phase 0 + Step 0 + Step 2-8 |

**注**: Step 1 已合并到 Phase 0.2，所有路径都不再单独执行 Step 1。

详见 [复杂度表](references/complexity-matrix.md)

---

## 关键约束

### 字面即精神原则

不得自行变通流程。详见 [反合理化守卫](references/anti-rationalization-guards.md)

### 隐含假设清单

Phase 0.2 的质量扫描必须显式暴露隐含假设，避免把口语化默认前提静默带入 `spec.md`：
- 使用 `[ASSUMED]` 标记可接受的合理默认值
- 使用 `[NEEDS CLARIFICATION]` 标记会影响范围、合规、安全或验收结果的不确定项
- 出现 `通常 / 一般 / 默认 / 预期会` 这类表述时，必须检查是否应转化为假设条目

详见 [Phase 0 PRD 工作流](references/phase0-prd-workflow.md)。

### 模板驱动约束

- **必须写**: 业务目标、边界、验收标准、NFR、风险与约束
- **禁止写**: 模块实现细节、类/函数级算法、具体库选型
- **若出现实现细节**: 必须重写为可验证的需求或约束条款
- **自我修正上限**: 3 轮；超过上限必须停止并请求用户澄清
- **`[NEEDS CLARIFICATION]`**: 同一轮最多 3 项；优先级：范围 > 安全 > 合规 > UX > 技术偏好

### CLI 硬约束

- **ID 类型**: 使用 `FR`, `DS`, `TASK`, `TC`, `REQ`（禁止使用 `REQ-PRD`）
- **状态枚举**: 使用 `Planned`, `Implemented`, `Verified`, `Accepted`, `Deferred`, `Cancelled`, `Exception`（禁止使用 `pending`/`InProgress`/`Completed`/`Blocked`）
- **确认策略**: `docs links validate` 必须显式确认目标 Feature（policy=strict）
- **串行执行**: 文档关联索引更新串行执行，避免并行失败级联

详见 [CLI 命令参考](references/cli-commands-reference.md)

---

## 质量门禁

详见 [质量门禁](references/quality-gates.md)

**Phase 0.4**: PRD 自检（C-PRD >= 85%）
**Step 8**: Gate Check（G-SPEC-00 + 格式校验）

---

## Feature 定位规则

### 优先级

1. **显式参数**: 用户提供 featureId 参数时直接使用
2. **自动定位**: 读取 `.spec-first/current` 获取当前激活 Feature
3. **交互式**: 列出可用 Feature 供用户选择

### 错误处理

- `.spec-first/current` 不存在或为空 → 降级到交互式
- 指定 Feature 的阶段不匹配 → 报错并终止

---

## 结构化歧义消解

出现以下任一情况必须标记 `[NEEDS CLARIFICATION]`：
- 边界值不明确
- 异常处理未定义
- 优先级冲突
- 多种可能解释
- 依赖外部系统但接口缺失
- 成功标准缺失可量化指标
- 术语未定义或同词多义
- 角色/权限边界不清晰
- 时间/时序约束不明确
- 数据来源与可信度未定义

**歧义分类标签**: BOUNDARY/ERROR/PRIORITY/SEMANTIC/DEPENDENCY/METRIC/TERM/ROLE/TEMPORAL/DATA

**标记格式**:
```
[NEEDS CLARIFICATION][<TYPE>] FR-XXX-001: 具体问题？候选范围 A/B/C
```

**澄清轮次约束**:
- 最多 5 轮澄清，每轮最多 3 个问题
- 每轮结束必须把确认结果回写 `spec.md`
- 若 5 轮后仍存在阻断级歧义，停止推进并标记为 `[BLOCKED]`

---

## 宪法权威检查（P1-CON）

### P1.5: 宪法一致性检查

在 FR/AC 收敛后、进入后续设计决策前，必须执行宪法一致性检查：
- 逐条检查 FR/AC 是否违反 `constitution.md` 中的硬约束
- 发现违反时，必须标记 `[CONSTITUTION_VIOLATION]`
- 必须输出违反的具体宪法条款
- 必须给出可执行修改建议；未修正或未获确认前不得继续推进

详见 [Step 0-8 工作流](references/steps-fr-ac-workflow.md) 与 `references/constitution-authority.md`。

## AC ID 规范

- **命名**: `AC-<ABBR>-<FRSEQ>-<NN>`
- **示例**: `FR-AUTH-001` 下的第 1 条 AC 为 `AC-AUTH-001-01`
- **约束**: 一个 AC ID 只能映射一条可验证断言，禁止一条 AC 混合多个断言

---

## CLI 依赖

```bash
spec-first id next FR <abbr> --feature <featureId>
spec-first id next REQ <abbr> --feature <featureId>
spec-first docs links validate <featureId>
spec-first gate check <featureId>
spec-first validate format <featureId>
```

详见 [CLI 命令参考](references/cli-commands-reference.md)

---

## 输出路径

- `specs/{featureId}/prd.md`
- `specs/{featureId}/spec.md`
- `specs/{featureId}/document-links.yaml`
- `specs/{featureId}/findings.md`
- `specs/{featureId}/adr/ADR-XXX.md`（Complex 时）

---

## 成功标准

- Phase 0.0-0.6 全部完成，C-PRD >= 85%
- `spec.md` 包含所有 FR/AC
- 所有 FR 已通过 `id next FR` 注册
- 所有 FR 至少有 1 条 `REQ-*` upstream 引用
- 所有 AC 使用统一 AC ID 规范
- `document-links.yaml` 已更新
- `findings.md` 包含完整 Phase 0.0-0.6 + Step 0-8 记录
- `gate check` 在 `01_specify` 阶段通过（含 G-SPEC-00 和 C-PRD 校验）

---

## 参考文档

**路径基准**: 相对于 `skills/spec-first/03-spec/` 目录

### 主文档必须发现（Primary References）

- [Phase 0 PRD 工作流](references/phase0-prd-workflow.md) - Phase 0 详细流程
- [Step 0-8 工作流](references/steps-fr-ac-workflow.md) - Step 0-8 详细流程
- [复杂度表](references/complexity-matrix.md) - 复杂度判定规则
- [反合理化守卫](references/anti-rationalization-guards.md) - 反合理化守卫
- [CLI 命令参考](references/cli-commands-reference.md) - CLI 命令参考
- [质量门禁](references/quality-gates.md) - 质量门禁详解

### 内部辅助参考（Secondary / Helper References）

以下文件仍然是有效真源，但不要求在每次主流程中都显式加载：

- `references/spec-review-checklist.md` - 规格审查清单
- `references/test-level-glossary.md` - 测试层级术语表
- `references/constitution-authority.md` - 宪法权威说明
- `references/prd-template-greenfield.md` - PRD 模板（全新功能）
- `references/prd-template-iteration.md` - PRD 模板（迭代增强）
- `references/adr-lite-template.md` - ADR-lite 模板
- `references/id-types-and-status.md` - ID 类型与状态规范
- `references/question-gate-rules.md` - 问题门禁细则
- `references/final-confirmation-template.md` - 最终确认模板
- `references/complexity-classification.md` - 复杂度分类详解
- `references/convergence-qa-rules.md` - 收敛问答规则
- `references/expansion-sweep-rules.md` - 扩展扫描规则
- `references/findings-state-header.md` - findings 状态头模板
- `references/prd-extraction-prompt.md` - PRD 抽取提示词

---

## 背景输入

- 背景质量字段与枚举遵循 `../shared/background-quality-contract.md`
- 优先读取 `spec-view`
- 建议优先读取 `.spec-first/runtime/first/summary.json`、`critical-flows.json` 与 `domain-model.json` 获取需求背景
- 执行前应显式声明 `background_input_status`

### 背景不足判定标准

**触发 degraded 降级模式的条件**（满足任一即触发）:
- PRD 不存在或为空
- constitution.md 不存在
- Feature 阶段状态不明确
- 追溯矩阵缺失或损坏
- 用户输入缺少核心要素（业务目标/功能边界/约束条件中任意 2 项缺失）

**降级模式行为**:
- 明确告知用户当前处于降级模式
- 列出缺失的背景信息
- 请求用户补充必要信息后再继续
- 不得静默假设上下文完整
