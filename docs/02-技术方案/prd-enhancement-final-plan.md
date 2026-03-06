# spec-first PRD 流程说明（As-Is 对齐版）

> **版本**: v2.2.4-as-is
> **日期**: 2026-03-06
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
Phase 0.0 Feature 快速初始化
Phase 0.1 任务锚定
Phase 0.2 质量扫描 + 自动上下文收集
Phase 0.3 PRD 生成
Phase 0.4 PRD 自检（C-PRD）
Phase 0.5 PRD 补全对话（Question Gate）
Phase 0.6 PRD 用户确认
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

- `Phase 0.5` 是 **PRD 补全对话**，`Phase 0.6` 才是 **PRD 用户确认**。
- 需求澄清问答发生在：
  - `Phase 0.5: PRD 补全对话`
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
2. `## 2. 功能需求`
3. `## 3. 非功能需求`

并要求元信息（front matter）包含：

- `scenario`（greenfield/iteration）
- `scenario_reason`
- `evidence_paths`
- `complexity`

### 4.2 章节校验一致性（已统一）

`format-validator` 已与 `prd-validator` 对齐，统一检查：

- `## 1. 业务目标`
- `## 2. 功能需求`
- `## 3. 非功能需求`

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

- [x] Phase 0.0-0.6 + Step 0-8 流程（skill 定义）
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

## 9. To-Be 增强（实现细化方案，不视为现状）

以下内容为“可开发实现方案”，不是当前已实现能力。实现完成前，As-Is 口径仍以前文第 2-8 章为准。

### 9.1 目标与边界

目标：

- 支持多格式输入（`md/txt/docx/xlsx/pdf`）并统一为 `raw-requirement.md`
- 支持条件触发的图片需求提取（Phase 0.1.5）
- 保证失败可恢复、降级可追溯，不阻断主流程推进

边界（本期不做）：

- 不做 OCR 大模型自训练
- 不做复杂版式还原（仅需求语义提取）
- 不改变现有 `G-SPEC-00` 门禁逻辑（仍由 `prd-validator` + `gate-evaluator` 判定）

### 9.2 架构落点（与现有代码对齐）

遵循“新增模块 + 最小侵入”原则，落在现有 `src/core` 与 `src/cli` 架构内：

```text
输入文件/文本
  -> requirement-ingest pipeline（新增）
      -> parser adapters（docx/xlsx/pdf/md/txt）
      -> requirement normalizer
      -> image extractor（可选，Phase 0.1.5）
      -> artifacts writer
  -> specs/{featureId}/raw-requirement.md
  -> specs/{featureId}/image-requirements.md（可选）
  -> findings.md 过程记录
```

建议新增目录：

- `src/core/requirement-ingest/types.ts`
- `src/core/requirement-ingest/parsers/{md,txt,docx,xlsx,pdf}-parser.ts`
- `src/core/requirement-ingest/normalizer.ts`
- `src/core/requirement-ingest/image-extractor.ts`
- `src/core/requirement-ingest/pipeline.ts`

建议新增命令入口（可选，但推荐）：

- `src/cli/commands/prd.ts`（`spec-first prd ingest <featureId> [--input ...]`）
- `src/cli/index.ts` 注册 `prd` 命令

说明：若不新增 CLI，也可先由 `spec-first:spec` skill 内部调用 pipeline；两者可并存，CLI 用于可测试与可回放。

### 9.3 数据契约（新增产物定义）

`raw-requirement.md`（必产物）：

- front matter：
  - `feature_id`
  - `source_type`（text|md|docx|xlsx|pdf|mixed）
  - `source_paths`
  - `parser_summary`（成功/失败统计）
  - `generated_at`
- body：
  - `## 1. 原始需求摘录`
  - `## 2. 结构化要点`
  - `## 3. 待澄清项（自动标注）`

`image-requirements.md`（可选产物）：

- front matter：
  - `vision_model`
  - `strategy`（all|sample|skip）
  - `image_count_total`
  - `image_count_processed`
  - `generated_at`
- body：
  - 每张图片一条结构化记录：`IMG-XXX`、位置、提取结论、置信度、失败原因（如有）

`findings.md`（过程审计增强）：

- 每次解析、重试、降级都写入事件行：
  - `阶段`（Phase 0.1 / 0.1.5）
  - `类型`（INFO/WARN/ERROR/DEGRADED/BLOCKED）
  - `描述`（包含失败原因、重试次数、影响范围、后续动作）

### 9.4 Phase 0 执行细化

Phase 0.1（输入处理）执行序列：

1. 检测输入类型（文件扩展名 + MIME）
2. 路由到对应 parser adapter
3. 统一归一化为 requirement blocks
4. 输出 `raw-requirement.md`
5. 写入 `findings.md`（含输入统计、失败统计）

Phase 0.1.5（图片提取）触发与确认：

- 自动触发条件：
  - parser 结果标记存在图片引用，或输入为图片文件
- 自动跳过条件：
  - 无图片
- 处理策略：
  - `<=10` 张：默认 `all`（仍需用户确认）
  - `>10` 张：默认 `sample`，必须提示用户在 `all/sample/skip` 选择
- 用户确认点（强制）：
  - 调 Vision 前提示成本与隐私；未确认则走 `skip`

### 9.5 错误处理与降级（复用现有重试能力）

错误分类：

- `permanent`：格式损坏、文件不存在、权限错误
- `temporary`：超时、限流、网络抖动
- `unknown`：无法归类，按 temporary 处理

重试与降级基线：

- 文档解析（docx/xlsx/pdf）：
  - 最多重试 2 次
  - 失败后降级为“文本直贴模式”（用户粘贴或手工摘要）
- Vision 提取：
  - 指数退避重试 3 次
  - 失败后跳过对应图片并继续主流程
- 部分成功：
  - 允许继续；失败项进入 `image-requirements.md` 的失败清单

复用建议：

- 优先复用 `src/core/ai-orchestrator/retry-controller.ts` 的分类、退避与预算逻辑
- 仅在 requirement-ingest 层做薄封装，不重复实现一套重试框架

### 9.6 配置项设计（建议新增）

在 `src/shared/config-schema.ts` 增加 `requirements_ingest` 配置段：

- `enabled_formats`: `['md','txt','docx','xlsx','pdf']`
- `parser_retry_max`: `2`
- `vision_retry_max`: `3`
- `vision_backoff_ms`: `2000`
- `image_extract_threshold`: `10`
- `image_extract_default_strategy`: `sample`
- `exclude_globs`: `['**/node_modules/**','**/dist/**','**/build/**','**/.git/**']`

要求：

- 默认值可直接运行
- 范围校验与 `auto_orchestrate` 一致（非法值启动即报错）

### 9.7 测试与验收（按现有测试体系）

单元测试（`tests/unit`）：

- parser 适配器：正常输入、空输入、损坏文件
- normalizer：多来源合并、字段缺失容错
- image extractor：阈值分支、策略分支、失败清单
- retry/降级：重试次数边界、预算耗尽、降级路径

集成测试（`tests/integration`）：

- `prd ingest` 命令到产物落盘全链路
- `findings.md` 审计记录完整性

E2E（`tests/e2e`）：

- 从原始需求到 `prd.md` 的 Phase 0 闭环
- Vision 失败但主流程继续推进

DoD（完成定义）：

- 能稳定生成 `raw-requirement.md`
- 图片提取可控触发且有用户确认
- 错误可重试、可降级、可追溯
- 不影响现有 `spec-first:spec` 主流程与 gate 结果

### 9.8 分阶段实施计划（建议）

M1（基础管道）：

- 交付 `md/txt` 解析 + normalizer + `raw-requirement.md`
- 不接 Vision

M2（多格式扩展）：

- 增加 `docx/xlsx/pdf` parser adapter
- 完成解析失败降级路径

M3（图片提取）：

- 接入 Phase 0.1.5 与用户确认机制
- 落地 `image-requirements.md`

M4（治理与稳定性）：

- 配置化、指标化、回归测试完善
- 文档从 To-Be 升级到 As-Is（仅在代码与测试完成后）

---

## 10. 结论

本文件为当前实现的执行基线：

- 以 `Phase 0.0-0.6 + Step 0-8` 为唯一流程
- 以 `C-PRD >= 85%` 为唯一阈值口径
- 将未实现能力明确隔离为 To-Be，避免“文档先于实现”的误导
