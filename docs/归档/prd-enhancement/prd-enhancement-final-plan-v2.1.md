# spec-first PRD 流程说明（As-Is 对齐版）

> **版本**: v2.2.2-as-is
> **日期**: 2026-03-05
> **状态**: 已对齐当前实现（代码 + skill）

---

## 1. 文档目的

本文档描述 **当前已实现** 的 spec-first 需求规格流程，作为执行与审查基准。

- 对齐源 1：`skills/spec-first/03-spec/SKILL.md`
- 对齐源 2：`src/core/gate-engine/prd-validator.ts`
- 对齐源 3：`src/core/gate-engine/gate-evaluator.ts`
- 对齐源 4：`src/core/process-engine/init.ts`

> 说明：本文不再把目标态能力（Word/Excel/PDF 解析、图片提取）写成已实现事实。

---

## 2. 当前流程总览（唯一口径）

当前 `spec-first:spec` 流程采用：

- **Phase 0：PRD 必产物（前置阶段）**
- **Step 0-8：需求规格收敛流程**

```text
Phase 0.1 任务锚定
Phase 0.2 场景判定（greenfield/iteration）
Phase 0.3 PRD 生成
Phase 0.4 PRD 自检（C-PRD）
Phase 0.5 PRD 用户确认
    ↓
Step 0 Ensure Task Exists
Step 1 Auto-Context
Step 2 Classify Complexity
Step 3 Question Gate
Step 4 Research-first（按复杂度条件）
Step 5 Expansion Sweep（按复杂度条件）
Step 6 Q&A Loop
Step 7 ADR-lite（Complex 条件）
Step 8 Final Confirmation + Implementation Plan
```

关键澄清：

- `Phase 0.5` 是 **PRD 用户确认**，不是“补全对话”。
- 需求澄清问答发生在：
  - `Step 3: Question Gate`
  - `Step 6: Q&A Loop`

---

## 3. Gate 与阈值

### 3.1 C-PRD 阈值

当前实现阈值为：

- **C-PRD >= 85% 通过**

用于 `01_specify` 阶段 Gate 条件 `G-SPEC-00`。

### 3.2 进入下一阶段的硬条件（As-Is，显式 Gate）

从 `01_specify` 进入后续阶段前，至少满足：

- `G-SPEC-00`: `prd.md` 存在且 C-PRD >= 85%
- `G-SPEC-01`: `spec.md` 存在
- `G-SPEC-02`: 追踪矩阵存在 FR 行（FR/NFR IDs assigned）
- `G-SPEC-03`: Spec 质量分（C10）>= 80%

---

## 4. PRD 契约（当前实现）

### 4.1 `prd-validator` 当前要求

`prd-validator` 当前必需章节：

1. `## 1. 业务目标`
2. `## 2. 功能边界`
3. `## 3. 约束条件`
4. `## 4. 成功标准`

并要求元信息（front matter）包含：

- `scenario`（greenfield/iteration）
- `scenario_reason`
- `evidence_paths`
- `complexity`

### 4.2 章节校验一致性（已统一）

`format-validator` 已与 `prd-validator` 对齐，统一检查：

- `## 1. 业务目标`
- `## 2. 功能边界`
- `## 3. 约束条件`
- `## 4. 成功标准`

当前不再存在 PRD 章节命名冲突。

---

## 5. findings.md 结构（As-Is）

`findings.md` 在 spec 流程执行中按结构化状态头维护，不使用 `session_start/phase/status` 简化头。

推荐头格式：

```yaml
---
current_step: "Step 3"
completed_steps: ["Phase 0", "Step 0", "Step 1", "Step 2"]
skipped_steps: []
next_step: "Step 4"
complexity: "Moderate"
scenario: "iteration"
last_updated: "2026-03-05T10:00:00Z"
---
```

并要求：

- 每步完成后更新 `completed_steps/current_step/next_step`
- 跳过节点必须记录 `SKIPPED` 与理由

初始化衔接说明：

- `spec-first init` 生成的 `findings.md` 为表格骨架（非状态头）
- 进入 `spec-first:spec` 后，由流程在 Phase/Step 执行中补齐并持续更新状态头

---

## 6. Feature 初始化（As-Is）

当前初始化规则：

- 通过 `spec-first init` 建立 Feature 工作区
- Feature ID 规则：`FSREQ-YYYYMMDD-FEAT-NNN`
- 初始化骨架包含：
  - `stage-state.json`
  - `findings.md`
  - `task_plan.md`
  - `traceability-matrix.md`
  - `constitution.md`
  - `prd.md`（骨架）

> 不采用 `TEMP + uuid` 作为标准 ID 生成方案。

---

## 7. 复杂度、澄清约束与上下文范围（As-Is）

### 7.1 复杂度判定（多维规则）

复杂度分级：`Trivial / Simple / Moderate / Complex`，按多维取最高档。

判定维度：

| 档位 | 受影响文件数 | 歧义点数量 | 方案分支数 | 外部依赖 | 典型特征 |
|------|------------|----------|----------|---------|---------|
| Trivial | <=1 | 0 | 1 | 无 | 单文件微调、文案修改、配置变更 |
| Simple | 2-3 | 1-2 | 1 | 无或已明确 | 单模块功能、清晰边界、无架构影响 |
| Moderate | 4-8 | 3-5 | 2 | 1-2 个 | 跨模块协作、存在技术选型、需轻量调研 |
| Complex | >=9 | >=6 | >=3 | >=3 个 | 架构级变更、多方案权衡、需深度调研 |

判定规则：

- 按 `Step 1` 收集的数据统计文件数和外部依赖数。
- 按 PRD/歧义项统计歧义点数量和方案分支数。
- 多维结果不一致时取最高档；边界情况向上取整。

### 7.2 执行深度映射

- `Trivial`: Phase 0 + Step 0-2 + Step 8（跳过 Step 3-7）
- `Simple`: Phase 0 + Step 0-3 + Step 6 + Step 8（跳过 Step 4-5, 7）
- `Moderate`: Phase 0 + Step 0-6 + Step 8（跳过 Step 7）
- `Complex`: Phase 0 + Step 0-8 全量

### 7.3 Question Gate 轮次与时限

已实现约束（来自 skill）：

- 每轮最多 3 问。
- 最多 5 轮澄清。
- 超过 5 轮仍有阻断级歧义，标记 `[BLOCKED]`。

流程治理约束（文档规范，待运行时工具化）：

- 单次澄清会话建议总时限 30 分钟。
- 达到时限后输出未决问题摘要，并转入人工决策或下一会话继续。

### 7.4 Auto-Context 扫描范围（执行约定）

关键词来源：

- PRD 标题与章节标题
- 已确认的术语/实体（角色、模块、外部系统）
- `[NEEDS CLARIFICATION]` 与 FR/NFR 相关条目

推荐扫描范围：

- 包含：`src/`, `apps/`, `packages/`, `services/`, `db/`, `migrations/`, `docs/`
- 排除：`node_modules/`, `dist/`, `build/`, `coverage/`, `.git/`, `.turbo/`, `.next/`

说明：

- 当前为流程执行规范，主要由 skill 执行者遵守。
- 后续可在 CLI 中工具化为可配置扫描白名单/黑名单。

---

## 8. 实现状态矩阵

### 8.1 已实现（当前可执行）

- [x] Phase 0 + Step 0-8 流程（skill 定义）
- [x] C-PRD 校验与阈值判定（>=85）
- [x] `01_specify` gate 校验接入 `prd.md`
- [x] Question Gate / Q&A Loop 一问一答策略
- [x] findings 状态头与节点跳过记录规范（由 spec 流程维护，不由 init 骨架直接提供）

### 8.2 未实现（目标态能力）

- [ ] Word 解析（`.docx`）
- [ ] Excel 解析（`.xlsx`）
- [ ] PDF 解析（`.pdf`）
- [ ] 图片需求提取与 Vision 识别
- [ ] `raw-requirement.md` / `image-requirements.md` 的标准化输入管道

> 当前 `package.json` 未包含 `mammoth/xlsx/pdf-parse` 依赖，故不应声明为已落地。

### 8.3 最近完成（已落地）

- [x] PRD 契约统一：`prd-validator` 与 `format-validator` 章节规则已合并
- [x] `validate` 相关单元测试与集成测试已对齐新契约

---

## 9. To-Be 增强（规划，不视为现状）

以下为后续规划，需经过设计评审与实现验收后方可转入 As-Is：

1. 多格式需求输入管道
- 前置条件：解析依赖与错误处理策略落地
- 影响模块：CLI 输入层、spec skill 提示、findings 记录
- 验收标准：能稳定产出 `raw-requirement.md`

2. 图片需求提取
- 前置条件：Vision 调用策略、成本控制、人工复核机制、触发条件明确定义
- 影响模块：Phase 0 输入处理、PRD 生成上下文
- 触发规则：
  - 自动检测到文档含图片后，进入候选流程
  - 无图片时自动跳过 Phase 0.1.5
  - `<=10` 张图片支持全量提取
  - `>10` 张图片采用批处理/抽样，并先询问用户策略（全量/抽样/跳过）
- 用户确认：
  - 调用 Vision 前必须用户确认（成本与隐私提示）
- 验收标准：可复现提取结果并记录证据路径

3. 错误处理与降级矩阵
- 前置条件：明确失败分类、重试次数、降级动作、阻断条件
- 影响模块：文档解析、图片提取、Phase 0 记录链路
- 基线策略：
  - 文档解析失败：最多重试 2 次，失败后降级为文本直贴模式
  - Vision API 超时/限流：指数退避重试 3 次，失败后跳过图片提取并继续文本流程
  - 部分图片失败：记录失败清单，不阻断主流程；标记为待人工补录
  - 任何降级必须写入 `findings.md`（失败原因 + 降级动作 + 影响范围）
- 验收标准：失败可恢复、降级可追溯、主流程可继续推进

---

## 10. 结论

本文件为当前实现的执行基线：

- 以 `Phase 0 + Step 0-8` 为唯一流程
- 以 `C-PRD >= 85%` 为唯一阈值口径
- 将未实现能力明确隔离为 To-Be，避免“文档先于实现”的误导
