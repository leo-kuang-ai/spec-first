# 需求规格：spec-first:spec 命令优化

> Feature ID: FSREQ-20260305-SPECOPT-001
> 版本: v1.0
> 状态: Draft
> 创建时间: 2026-03-05

---

## 1. 功能需求（FR）

### FR-SPEC-OPT-001：四档复杂度分流

**描述**: `/spec-first:spec` 在进入 P2 前必须输出复杂度判定（Trivial/Simple/Moderate/Complex）及理由。

**upstream**: REQ-PRD-COMPLEXITY

**优先级**: P0

**验收标准（AC）**:

- `AC-SPECOPT-001-01` [E2E]: 每次执行都出现 `Complexity: Trivial|Simple|Moderate|Complex` 与判定依据（含量化指标：受影响文件数、歧义点数量、方案分支数、外部依赖数）
- `AC-SPECOPT-001-02` [E2E]: `Complex` 必须执行 Phase 0 + Step 0-8 全量；`Moderate` 至少执行 Phase 0 + Step 0-6 + 8

---

### FR-SPEC-OPT-002：Question Gate 强化

**描述**: 新增独立问题门禁，先判断可推导性，再提问。

**upstream**: REQ-PRD-QUESTION-GATE

**优先级**: P0

**验收标准（AC）**:

- `AC-SPECOPT-002-01` [IT]: 问题必须标记类型：`Blocking` 或 `Preference`
- `AC-SPECOPT-002-02` [E2E]: 若可由仓库推导，则禁止向用户提问

---

### FR-SPEC-OPT-003：一问一答与动态收敛

**描述**: 进入收敛阶段（Step 6）后执行"一次一问"，每轮更新需求状态。其他阶段（Step 1-5）保留"最多 3 问"以提升效率。

**upstream**: REQ-PRD-CONVERGENCE

**优先级**: P0

**验收标准（AC）**:

- `AC-SPECOPT-003-01` [E2E]: Step 6 收敛阶段：单条消息最多 1 个问题
- `AC-SPECOPT-003-02` [E2E]: Step 1-5 发散/调研阶段：单条消息最多 3 个问题
- `AC-SPECOPT-003-03` [IT]: 每轮答案都回写 `spec.md` 并更新待澄清项

---

### FR-SPEC-OPT-004：Research-first 触发器

**描述**: 技术选型类需求自动触发调研并输出选项。

**upstream**: REQ-PRD-RESEARCH

**优先级**: P1

**验收标准（AC）**:

- `AC-SPECOPT-004-01` [E2E]: 至少输出 2 个可执行方案及取舍
- `AC-SPECOPT-004-02` [IT]: 方案选择结果回写 ADR-lite

---

### FR-SPEC-OPT-005：Expansion Sweep 标准化

**描述**: `Moderate/Complex` 必须执行发散扫描三类检查（未来演进、相关场景、失败/边界）。

**upstream**: REQ-PRD-EXPANSION

**优先级**: P0

**验收标准（AC）**:

- `AC-SPECOPT-005-01` [E2E]: 三类检查齐备：未来演进、相关场景、失败/边界（各类至少 1 条具体发现）
- `AC-SPECOPT-005-02` [IT]: 扫描结果拆分为"纳入 MVP"与"Out of Scope"

---

### FR-SPEC-OPT-006：最终确认包标准化

**描述**: 进入落盘前必须输出固定结构确认包。

**upstream**: REQ-PRD-CONFIRMATION

**优先级**: P0

**验收标准（AC）**:

- `AC-SPECOPT-006-01` [E2E]: 必含字段：Goal、Requirements、AC、DoD、Out of Scope、Implementation Plan
- `AC-SPECOPT-006-02` [E2E]: 未确认不得进入落盘与 Gate

---

### FR-SPEC-OPT-007：治理与质量基线

**描述**: 优化后保留现有 Gate/C10 与 AC 可验证性约束。

**upstream**: REQ-PRD-GOVERNANCE

**优先级**: P0

**验收标准（AC）**:

- `AC-SPECOPT-007-01` [IT]: `G-SPEC-03 (C10>=80%)` 行为不弱化
- `AC-SPECOPT-007-02` [IT]: 允许调整 AC ID 细节与 `gate check` 文案/条件，但不得降低门禁通过标准

---

### FR-SPEC-OPT-008：原生反模式硬约束

**描述**: 对齐 Trellis 原生 brainstorm 反模式，作为 spec 执行硬约束。

**upstream**: REQ-PRD-ANTI-PATTERNS

**优先级**: P0

**验收标准（AC）**:

- `AC-SPECOPT-008-01` [E2E]: 禁止向用户提问可由仓库/文档/调研直接推导的信息
- `AC-SPECOPT-008-02` [E2E]: 禁止"是否要调研"这类元问题；需要信息时直接执行检索
- `AC-SPECOPT-008-03` [E2E]: Step 6 收敛阶段禁止一次消息抛出多问题清单；Step 1-5 允许最多 3 问

---

### FR-SPEC-OPT-009：阶段衔接输出标准

**描述**: Step 8 完成后必须输出可直接进入后续阶段（design/task）的结构化衔接包。

**upstream**: REQ-PRD-HANDOFF

**优先级**: P0

**验收标准（AC）**:

- `AC-SPECOPT-009-01` [E2E]: 输出包含：完整需求摘要、关键决策、实施计划、Out of Scope
- `AC-SPECOPT-009-02` [ST]: 衔接包可直接被后续阶段引用，无需重复访谈

---

### FR-SPEC-OPT-010：交互模式唯一化

**描述**: spec-first:spec 仅保留 Trellis 原生交互模式，不引入 AI 自助决策模式。

**upstream**: REQ-PRD-INTERACTION

**优先级**: P0

**验收标准（AC）**:

- `AC-SPECOPT-010-01` [E2E]: 关键偏好、范围边界、方案选择必须经过用户确认后落盘
- `AC-SPECOPT-010-02` [E2E]: AI 可自主完成仓库检索、调研和候选方案整理，但不得跳过 Step 8 最终确认
- `AC-SPECOPT-010-03` [IT]: 文档与实现中不再保留"无用户确认直接推进"的模式分支

---

### FR-SPEC-OPT-011：Phase 0 PRD 必产物

**描述**: 需求开始第一步必须生成 `prd.md`，作为后续 FR/AC 的唯一输入锚点。

**upstream**: REQ-PRD-MANDATORY

**优先级**: P0

**验收标准（AC）**:

- `AC-SPECOPT-011-01` [IT]: 执行 `/spec-first:spec` 后，`specs/{featureId}/prd.md` 必存在且有内容
- `AC-SPECOPT-011-02` [IT]: 未满足 PRD 关键字段时，流程阻断，不允许进入 Step 0+

---

### FR-SPEC-OPT-012：两类场景 PRD 模板分支

**描述**: Phase 0 根据场景自动选择 PRD 模板分支（0-1 新需求 / 迭代需求）。

**upstream**: REQ-PRD-TEMPLATES

**depends_on**: FR-SPEC-OPT-011

**优先级**: P0

**验收标准（AC）**:

场景 A（0-1 新需求）:
- `AC-SPECOPT-012-01` [IT]: 包含问题定义（Problem Statement）
- `AC-SPECOPT-012-02` [IT]: 包含目标用户与使用场景（Persona / JTBD）
- `AC-SPECOPT-012-03` [IT]: 包含 MVP 范围定义
- `AC-SPECOPT-012-04` [IT]: 包含可量化成功指标（≥1 条）
- `AC-SPECOPT-012-05` [IT]: 包含关键假设与待验证项

场景 B（迭代需求）:
- `AC-SPECOPT-012-06` [IT]: 包含 As-Is 当前行为基线
- `AC-SPECOPT-012-07` [IT]: 包含 To-Be 变更目标
- `AC-SPECOPT-012-08` [IT]: 包含影响范围清单（模块/接口/数据/配置）
- `AC-SPECOPT-012-09` [IT]: 包含现有实现证据（≥1 条文件路径）
- `AC-SPECOPT-012-10` [IT]: 包含验证策略（回归点与新增验收点）

通用:
- `AC-SPECOPT-012-11` [IT]: 场景判断依据与结果必须写入 `prd.md` 头部元信息
- `AC-SPECOPT-012-12` [IT]: 场景不确定时默认判定 `iteration`，并记录保守判定理由

---

### FR-SPEC-OPT-013：PRD 门禁（G-SPEC-00）

**描述**: 在 `01_specify` 阶段新增 PRD 完整性门禁，未通过即阻断。

**upstream**: REQ-PRD-GATE

**depends_on**: FR-SPEC-OPT-011

**优先级**: P0

**验收标准（AC）**:

- `AC-SPECOPT-013-01` [IT]: `gate check` 在 01 阶段包含 `G-SPEC-00`（PRD exists + required sections）
- `AC-SPECOPT-013-02` [IT]: PRD 不完整时返回 `FAIL/BLOCKED`，不得"先写 spec 后补 PRD"

---

### FR-SPEC-OPT-014：PRD 清晰度评分（C-PRD）

**描述**: Phase 0 完成后必须执行 PRD 清晰度评分，低于阈值时阻断进入 Step 0。

**upstream**: REQ-PRD-SCORING

**depends_on**: FR-SPEC-OPT-011

**优先级**: P0

**验收标准（AC）**:

- `AC-SPECOPT-014-01` [UT]: 评分维度固定为：完整性、可验证性、可追溯性、边界明确性、可收敛性（等权 20% × 5）
- `AC-SPECOPT-014-02` [UT]: 评分算法：`C-PRD = Σ(维度得分 × 20%)`
- `AC-SPECOPT-014-03` [IT]: `C-PRD >= 85%` 才允许进入 Step 0
- `AC-SPECOPT-014-04` [IT]: `iteration` 场景至少提供 3 条"现有实现证据（文件路径）"
- `AC-SPECOPT-014-05` [IT]: `greenfield` 场景至少提供 1 条可量化成功指标

---

### FR-SPEC-OPT-015：PRD→FR 追溯映射

**描述**: `prd.md` 中的 `REQ-PRD-xxx` 条目必须与 FR 建立显式双向追溯关系。

**upstream**: REQ-PRD-TRACEABILITY

**depends_on**: FR-SPEC-OPT-011

**优先级**: P0

**验收标准（AC）**:

- `AC-SPECOPT-015-01` [IT]: 每个 FR 定义中包含 `upstream: [REQ-PRD-xxx, ...]` 字段
- `AC-SPECOPT-015-02` [IT]: `traceability-matrix.md` 包含 PRD→FR 映射列，覆盖所有 FR
- `AC-SPECOPT-015-03` [IT]: 允许 1:1、N:1、1:N 映射关系，但每个 FR 至少有 1 条 upstream 引用

---

## 2. 非功能需求（NFR）

### NFR-001：可审计性
每个节点都有落盘痕迹（`findings.md` 或 `spec.md` 结构块）。

### NFR-002：一致性
四档分流输出字段命名一致，便于后续 analyze 读取。

### NFR-003：可恢复性
会话中断后可从最近节点继续，至少保留"当前节点 + 待决策项 + 下一步命令"。

### NFR-004：时效性
Trivial/Simple 路径不应显著增加轻量任务的单次 spec 执行时长（目标：端到端耗时增加不超过 15%）。

### NFR-005：清晰性
Phase 0 PRD 应达到"可供第三方接手继续 spec"的可读程度（不依赖会话记忆）。

### NFR-006：判定确定性
场景判定必须给出可复核的证据路径与理由，不允许"凭感觉"分类。

### NFR-007：低打扰
Phase 0 默认不向用户追问可推导信息，优先仓库证据与最佳实践决策。

---

## 3. 约束条件

### 技术约束
- Node.js 20+
- TypeScript ESM
- 单元测试覆盖率 >= 75%
- 保持现有 CLI 命令接口不变

### 流程约束
- Phase 0 必须完成才能进入 Step 0
- 跳过的 Step 必须在 findings.md 记录 SKIPPED + 理由
- C-PRD < 85% 必须阻断
- 每个 FR 至少有 1 条 REQ-PRD-* upstream 引用

### 兼容性约束
- 支持旧 Feature 渐进式迁移
- PRD 模板支持 Handlebars 变量替换
- findings.md 状态头可读性强，支持人工编辑

---

## 4. Out of Scope

- 不重命名命令（仍为 `/spec-first:spec`）
- 不改 spec-first 总体阶段模型（8+2）
- 不做向下兼容约束（开发阶段允许破坏性演进）
- 不保留"AI 自助决策模式"相关设计分支

---

## 5. 术语表

| 术语 | 定义 |
|------|------|
| PRD | Product Requirements Document，产品需求文档 |
| FR | Functional Requirement，功能需求 |
| AC | Acceptance Criteria，验收标准 |
| NFR | Non-Functional Requirement，非功能需求 |
| ADR | Architecture Decision Record，架构决策记录 |
| C-PRD | PRD 完整性评分（0-100 分） |
| G-SPEC-00 | PRD 质量门禁（C-PRD >= 85%） |

---

## 6. 参考资料

- `specs/FSREQ-20260305-SPECOPT-001/prd.md`
- `docs/01-需求文档/逐个skill优化/spec-skill/spec-first-spec-命令优化需求文档-v1.0.md`
- `skills/spec-first/03-spec/SKILL.md` (v2.0.0)
- `skills/spec-first/03-spec/references/*.md`
