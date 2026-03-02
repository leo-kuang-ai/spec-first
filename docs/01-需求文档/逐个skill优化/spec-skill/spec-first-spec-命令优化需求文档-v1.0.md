# /spec-first:spec 命令优化需求文档（参考 Trellis Brainstorm）

> 版本: v1.1
> 日期: 2026-03-02
> 状态: Draft（R2 审查修复后）
> 范围: 覆盖 `/spec-first:spec` 全流程优化（节点、提问、调研、反模式、输出模板、阶段衔接），仅保留 Trellis 原生交互模式，不改命令名
> 修订: R2 审查修复 — AC 标准 ID 格式、测试层级标注、复杂度时序悖论、PRD→FR 追溯映射、规则废止清单、Step 级恢复、C-PRD 用户确认点、抽样规则、FR 依赖标注、NFR 度量精确化

---

## 1. 背景与目标

`/spec-first:spec` 当前已具备结构化歧义消解、动态澄清、AC 可验证性与 Gate 校验能力，但在“需求发现节奏”上仍有提升空间。  
Trellis 的 `brainstorm` 在 Task-first、Question Gate、Research-first、Diverge→Converge 方面提供了可借鉴的流程化经验。

本次优化目标：

1. 在不削弱现有治理（Gate/Hard-Gate/traceability）的前提下，提升 `/spec-first:spec` 的需求发现质量与效率。
2. 引入 Trellis 原生“四档复杂度分流 + 九节点流程”，让不同复杂度任务有可执行、可审计的统一路径。
3. 产出可落地的 FR/AC 与实施改造清单，直接指导后续实现。
4. 明确采用“人机交互式决策”为唯一模式：AI 负责推导与方案准备，关键偏好与边界由用户确认。

非目标：

1. 不重命名命令，不改 `spec-first` 总体阶段模型（8+2）。
2. 明确不做向下兼容约束（开发阶段允许破坏性演进）。
3. 不保留“AI 自助决策模式”相关设计分支。

---

## 2. 当前实现基线（代码证据）

### 2.1 `/spec-first:spec` 现有能力

1. 已有结构化歧义消解与 `[NEEDS CLARIFICATION]` 机制  
证据: `/Users/kuang/xiaobu/spec-first/skills/spec-first/03-spec/SKILL.md:48`
2. 已有动态澄清问题生成规则（每轮最多 3 问）  
证据: `/Users/kuang/xiaobu/spec-first/skills/spec-first/03-spec/SKILL.md:82`
3. 已定义执行阶段 P0-P5  
证据: `/Users/kuang/xiaobu/spec-first/skills/spec-first/03-spec/SKILL.md:168`
4. 01_specify 阶段 Gate 已包含 C10 质量门禁（>=80%）  
证据: `/Users/kuang/xiaobu/spec-first/src/core/gate-engine/gate-evaluator.ts:72`
5. 当前尚未把 `prd.md` 作为 spec 阶段必产物（输出路径仍是 `spec.md` + `traceability-matrix.md`）  
证据: `/Users/kuang/xiaobu/spec-first/skills/spec-first/03-spec/SKILL.md:182`

### 2.2 系统级能力（可复用）

1. 已有 Hook 自动化（PreToolUse/PostToolUse/Stop）  
证据: `/Users/kuang/xiaobu/spec-first/src/core/tool-integration/ai-runtime-hook.ts:39`
2. 已有跨产物一致性分析 `analyze` + SCA  
证据: `/Users/kuang/xiaobu/spec-first/src/cli/commands/analyze.ts:11`  
证据: `/Users/kuang/xiaobu/spec-first/src/core/gate-engine/sca.ts:176`
3. 已有编排器与上下文裁剪规则  
证据: `/Users/kuang/xiaobu/spec-first/skills/spec-first/13-orchestrate/SKILL.md:82`

### 2.3 Trellis 对照基线

1. `brainstorm` 为 Step 0-8（共 9 节点）  
证据: `/Users/kuang/xiaobu/Trellis/.claude/commands/trellis/brainstorm.md:49`  
证据: `/Users/kuang/xiaobu/Trellis/.claude/commands/trellis/brainstorm.md:349`

---

## 3. 差距诊断（As-Is vs To-Be）

### 3.1 当前不足

1. 缺少“复杂度驱动的显式四档分流入口”，当前 P0-P5 对不同任务复杂度区分不够直观。
2. 缺少独立“Question Gate”节点（先判断可推导再提问）。
3. 缺少“Expansion Sweep（发散扫描）”标准动作，边界/失败场景常依赖个人经验。
4. 缺少“ADR-lite 决策落盘”硬性结构，技术取舍可追溯性不够强。
5. 缺少原生反模式硬约束（No meta questions / 不向用户索要可推导信息等）。
6. 末端确认模板不够结构化，Goal/Requirements/AC/DoD/OOS/实施计划的完整确认不稳定。
7. 缺少”Phase 0 首次产出 PRD”硬要求，导致需求理解与后续 FR/AC 的承接不稳定。
8. 缺少针对两类场景（0-1 新需求 / 迭代需求）的 PRD 分支模板。

### 3.2 优化原则

1. 强化发现流程，不弱化现有 Gate 治理。
2. 保持命令接口稳定（仍是 `/spec-first:spec`）。
3. 所有新增节点必须可落盘、可检查、可回放。
4. 交互优先：关键决策点必须由用户确认，不允许 AI 默默跨过确认节点。

---

## 4. 目标流程：Trellis 原生四档分流 + 九节点

## 4.0 Phase 0：PRD 必产物（前置阶段，阻断约束）

**编号说明**：为避免与 Trellis Step 0-8 冲突，PRD 产出阶段命名为 "Phase 0"，作为进入 Step 0 前的前置阶段。

`/spec-first:spec` 的第一步不是直接写 FR，而是先生成清晰的需求理解 PRD。

强制要求：

1. Phase 0 必须创建或更新：`specs/{featureId}/prd.md`。
2. 未产出 PRD 或 PRD 关键字段缺失，不得进入 Step 0 及后续步骤。
3. Phase 0 完成后，FR/AC 只能基于 PRD 中已确认内容生成。

Phase 0 执行顺序（不可打乱）：

1. `Phase 0.1` 任务锚定：明确目标问题、约束、成功标准来源（用户输入/仓库证据）。
2. `Phase 0.2` 场景判定：自动判定 `greenfield`（0-1）或 `iteration`（迭代）。
3. `Phase 0.3` PRD 生成：按场景模板产出 `prd.md`，包含结构化章节与开放问题。
4. `Phase 0.4` PRD 自检：执行 PRD 完整性与清晰度检查，未通过即阻断。
5. `Phase 0.5` PRD 用户确认：向用户展示 PRD 摘要 + C-PRD 评分，用户确认后方可进入 Step 0。

## 4.1 原生四档复杂度分流（强制）

`/spec-first:spec` 在发现流程早期必须输出复杂度分类：

1. `Trivial`：边界清晰、改动极小。跳过深度 brainstorm，走最小澄清与快速确认。
2. `Simple`：目标清晰、低歧义。执行 1 次确认提问后进入 FR/AC 收敛。
3. `Moderate`：存在一定歧义或多文件影响。执行轻量 brainstorm（2-3 个高价值问题）。
4. `Complex`：目标模糊或存在方案分歧。执行完整九节点流程（Step 0-8）。

### 四档判定标准（可量化）

判定维度（多维取最高档：任一维度命中高档即按该档执行，不降档）：

| 档位 | 受影响文件数 | 歧义点数量 | 方案分支数 | 外部依赖 | 典型特征 |
|------|------------|----------|----------|---------|---------|
| Trivial | ≤1 | 0 | 1 | 无 | 单文件微调、文案修改、配置变更 |
| Simple | 2-3 | 1-2 | 1 | 无或已明确 | 单模块功能、清晰边界、无架构影响 |
| Moderate | 4-8 | 3-5 | 2 | 1-2 个 | 跨模块协作、存在技术选型、需轻量调研 |
| Complex | ≥9 | ≥6 | ≥3 | ≥3 个 | 架构级变更、多方案权衡、需深度调研 |

判定流程：
1. 自动扫描仓库，统计受影响文件数（基于需求关键词匹配 + 依赖分析）
2. 识别需求文本中的歧义点（未定义术语、多解语义、缺失边界等）
3. 检测是否存在技术选型或方案分歧（关键词：或者/可选/待定/考虑）
4. 统计外部依赖数量（API/数据库/第三方服务）
5. 按表格规则判定档位，边界情况向上取整（保守策略）

交互约束：

1. 四档分流只决定探索深度，不改变”交互式确认”本质。
2. 任一档位都必须存在用户可见确认点（至少在 Step 8）。

## 4.2 基于 Trellis 的 Step 0-8 适配映射（强制）

以下 9 个节点在 spec-first 中必须可追踪，不允许降级为“泛化 brainstorm”：

1. Step 0: Ensure Task Exists (ALWAYS)
2. Step 1: Auto-Context (DO THIS BEFORE ASKING QUESTIONS)
3. Step 2: Classify Complexity (still useful, not gating task creation)
4. Step 3: Question Gate (Ask ONLY high-value questions)
5. Step 4: Research-first Mode (Mandatory for technical choices)
6. Step 5: Expansion Sweep (DIVERGE) — Required after initial understanding
7. Step 6: Q&A Loop (CONVERGE)
8. Step 7: Propose Approaches + Record Decisions (Complex tasks)
9. Step 8: Final Confirmation + Implementation Plan

## 4.3 四档对应节点深度（执行规则）

1. `Trivial`：Phase 0 + Step 0-2 + Step 8（最小确认包），可跳过 Step 4/5/7。
2. `Simple`：Phase 0 + Step 0-3 + Step 6 + Step 8（1 个确认问题）。
3. `Moderate`：Phase 0 + Step 0-6 + Step 8（2-3 个高价值问题）。
4. `Complex`：Phase 0 + Step 0-8 全量执行，Step 7 必须落 ADR-lite。

统一约束：

1. 每个已执行节点必须有落盘痕迹（`specs/{featureId}/findings.md` 或 `spec.md`）。
2. 被跳过的节点必须在 `findings.md` 中记录 `SKIPPED` 状态及跳过理由（如 `Step 4: SKIPPED — Trivial 路径无需调研`）。
3. `Complex` 缺任一节点（含已执行和已记录跳过），视为 spec 过程不完整，不允许进入 P4/P5。

### findings.md 结构定义

路径：`specs/{featureId}/findings.md`

用途：记录需求发现过程中的关键发现、决策依据、待澄清项，作为 spec 过程的审计日志。

必含字段：
- 当前节点（Phase 0 / Step 0-8）
- 节点结论（本节点确定的关键信息）
- 证据路径（仓库文件路径或外部文档链接）
- 待决策项（需用户确认的问题清单）
- 下一步动作（下一节点或命令）

结构化状态头（供 catchup Step 级恢复读取）：
```yaml
---
current_step: "Step 3"
completed_steps: ["Phase 0", "Step 0", "Step 1", "Step 2"]
skipped_steps: []
next_step: "Step 4"
complexity: "Moderate"
scenario: "iteration"
last_updated: "2026-03-02T10:00:00Z"
---
```

生命周期：
- Phase 0 开始时创建
- 每个节点完成后追加一条记录
- Step 8 完成后归档，不再修改
- 若需求变更，创建新版本 `findings-v2.md`

## 4.4 两类需求场景（Phase 0 PRD 分支）

### 场景 A：无历史项目代码（0-1 新需求）

Phase 0 PRD 必含：

1. 问题定义（Problem Statement）
2. 目标用户与使用场景（Persona / JTBD）
3. 业务目标与成功指标（含可量化指标）
4. MVP 范围与 Out of Scope
5. 关键假设与待验证项
6. 约束条件（时间/资源/合规/安全）

### 场景 B：有历史代码（功能迭代）

Phase 0 PRD 必含：

1. 当前行为基线（As-Is）与痛点
2. 变更目标（To-Be）与收益
3. 影响范围清单（模块/接口/数据/配置）
4. 现有实现证据（文件路径与关键片段）
5. 风险与回滚策略（开发阶段可破坏性演进，不做向下兼容承诺）
6. 验证策略（回归点与新增验收点）

## 4.5 场景判定规则（自动化）

`/spec-first:spec` 必须先自主判定场景，不将判定责任转嫁给用户。

1. 命中以下信号优先判定为 `iteration`：
   1. 仓库存在可执行代码目录（如 `src/`、`app/`、`packages/`）且存在构建文件（如 `package.json`、`pyproject.toml`、`go.mod`）。
   2. 需求文本包含迭代语义关键词（中文：优化/改造/重构/扩展/兼容/回归；英文：optimize/refactor/extend/migrate/backward-compatible）。
   3. 能定位到受影响的现有文件、模块、接口或数据结构。
2. 命中以下信号且不存在迭代信号时判定为 `greenfield`：
   1. 无历史业务代码或仅有脚手架空目录。
   2. 需求目标是新业务域、新产品线或全新工作流。
3. 判定不确定时默认使用 `iteration`（保守策略，优先保护已有系统）。
4. 判定结果必须写入 PRD 头部元信息：`scenario`、`scenario_reason`、`evidence_paths`。

## 4.6 PRD 清晰度定义（阻断标准）

“清晰 PRD”必须可被第三方工程师直接用于继续生成 FR/AC，无需回看会话上下文。

1. 完整性：场景必填章节齐全（100%）。
2. 可验证性：`Requirements Draft` 中每条需求具备可验证结果或量化阈值。
3. 可追溯性：迭代场景必须引用现有实现证据（文件路径 + 当前行为描述）。
4. 边界明确：`Out of Scope` 不得为空，且与 `MVP Scope/To-Be` 无冲突。
5. 开放问题可收敛：`Open Questions` 仅保留会改变 FR/AC 的问题。

### C-PRD 评分算法

评分维度与权重（等权分配）：

> **注意**：PRD YAML 头部的 `complexity` 字段不纳入完整性评分，该字段在 Phase 0 阶段默认为 `"pending"`，由 Step 2 独立校验后回填。

| 维度 | 权重 | 评分标准 |
|------|------|---------|
| 完整性 | 20% | 场景必填章节齐全度（缺 1 章节扣 20%） |
| 可验证性 | 20% | Requirements Draft 中可验证需求占比 |
| 可追溯性 | 20% | iteration 场景：现有实现证据条数 ≥3 得满分；greenfield 场景：可量化成功指标 ≥1 得满分 |
| 边界明确性 | 20% | Out of Scope 非空且与 MVP/To-Be 无冲突 |
| 可收敛性 | 20% | Open Questions 中阻断级问题占比（≤20% 得满分） |

计算公式：
```
C-PRD = Σ(维度得分 × 权重)
阈值：C-PRD >= 85% 才允许进入 Step 0
```

示例：
- 完整性：10/10 章节齐全 = 100% × 20% = 20%
- 可验证性：8/10 需求可验证 = 80% × 20% = 16%
- 可追溯性：提供 3 条证据 = 100% × 20% = 20%
- 边界明确性：Out of Scope 完整无冲突 = 100% × 20% = 20%
- 可收敛性：1/10 问题阻断 = 90% × 20% = 18%
- **总分：94%（通过）**

---

## 5. 功能需求（FR）与验收标准（AC）

### FR-SPEC-OPT-001：四档复杂度分流

描述：`/spec-first:spec` 在进入 P2 前必须输出复杂度判定（Trivial/Simple/Moderate/Complex）及理由。

AC：

1. `AC-SPECOPT-001-01`: 每次执行都出现 `Complexity: Trivial|Simple|Moderate|Complex` 与判定依据（含量化指标：受影响文件数、歧义点数量、方案分支数、外部依赖数）。`[E2E]`
2. `AC-SPECOPT-001-02`: `Complex` 必须执行 Phase 0 + Step 0-8 全量；`Moderate` 至少执行 Phase 0 + Step 0-6 + 8。`[E2E]`

### FR-SPEC-OPT-002：Question Gate 强化

描述：新增独立问题门禁，先判断可推导性，再提问。

AC：

1. `AC-SPECOPT-002-01`: 问题必须标记类型：`Blocking` 或 `Preference`。`[IT]`
2. `AC-SPECOPT-002-02`: 若可由仓库推导，则禁止向用户提问。`[E2E]`

### FR-SPEC-OPT-003：一问一答与动态收敛

描述：进入收敛阶段（Step 6）后执行”一次一问”，每轮更新需求状态。其他阶段（Step 1-5）保留”最多 3 问”以提升效率。

AC：

1. `AC-SPECOPT-003-01`: Step 6 收敛阶段：单条消息最多 1 个问题。`[E2E]`
2. `AC-SPECOPT-003-02`: Step 1-5 发散/调研阶段：单条消息最多 3 个问题（与现有基线一致）。`[E2E]`
3. `AC-SPECOPT-003-03`: 每轮答案都回写 `spec.md` 并更新待澄清项。`[IT]`

### FR-SPEC-OPT-004：Research-first 触发器

描述：技术选型类需求自动触发调研并输出选项。

AC：

1. `AC-SPECOPT-004-01`: 至少输出 2 个可执行方案及取舍。`[E2E]`
2. `AC-SPECOPT-004-02`: 方案选择结果回写 ADR-lite。`[IT]`

### FR-SPEC-OPT-005：Expansion Sweep 标准化

描述：`Moderate/Complex` 必须执行发散扫描三类检查。

三类检查具体定义：
- **未来演进**：识别当前设计在未来 2-3 个迭代可能需要扩展的点（如接口兼容性、数据结构可扩展性）。
- **相关场景**：识别与当前需求有交集的其他功能/模块（如共享数据、共享组件、共享 API）。
- **失败/边界**：识别极端输入、并发、超时、权限不足等异常路径。

AC：

1. `AC-SPECOPT-005-01`: 三类检查齐备：未来演进、相关场景、失败/边界（各类至少 1 条具体发现）。`[E2E]`
2. `AC-SPECOPT-005-02`: 扫描结果拆分为”纳入 MVP”与”Out of Scope”。`[IT]`

### FR-SPEC-OPT-006：最终确认包标准化

描述：进入落盘前必须输出固定结构确认包。

AC：

1. `AC-SPECOPT-006-01`: 必含字段：Goal、Requirements、AC、DoD、Out of Scope、Implementation Plan。`[E2E]`
2. `AC-SPECOPT-006-02`: 未确认不得进入落盘与 Gate。`[E2E]`

### FR-SPEC-OPT-007：治理与质量基线

描述：优化后保留现有 Gate/C10 与 AC 可验证性约束。

AC：

1. `AC-SPECOPT-007-01`: `G-SPEC-03 (C10>=80%)` 行为不弱化。`[IT]`
2. `AC-SPECOPT-007-02`: 允许调整 AC ID 细节与 `gate check` 文案/条件，但调整范围限定为 ID 编号规则与提示文案，不得降低门禁通过标准或移除已有检查维度。`[IT]`

### FR-SPEC-OPT-008：原生反模式硬约束

描述：对齐 Trellis 原生 brainstorm 反模式，作为 spec 执行硬约束。

AC：

1. `AC-SPECOPT-008-01`: 禁止向用户提问可由仓库/文档/调研直接推导的信息。`[E2E]`
2. `AC-SPECOPT-008-02`: 禁止”是否要调研”这类元问题；需要信息时直接执行检索。`[E2E]`
3. `AC-SPECOPT-008-03`: Step 6 收敛阶段禁止一次消息抛出多问题清单；Step 1-5 允许最多 3 问。`[E2E]`

### FR-SPEC-OPT-009：阶段衔接输出标准

描述：Step 8 完成后必须输出可直接进入后续阶段（design/task）的结构化衔接包。

AC：

1. `AC-SPECOPT-009-01`: 输出包含：完整需求摘要、关键决策、实施计划、Out of Scope。`[E2E]`
2. `AC-SPECOPT-009-02`: 衔接包可直接被后续阶段引用，无需重复访谈。`[ST]`

### FR-SPEC-OPT-010：交互模式唯一化

描述：spec-first:spec 仅保留 Trellis 原生交互模式，不引入 AI 自助决策模式。

AC：

1. `AC-SPECOPT-010-01`: 关键偏好、范围边界、方案选择必须经过用户确认后落盘。`[E2E]`
2. `AC-SPECOPT-010-02`: AI 可自主完成仓库检索、调研和候选方案整理，但不得跳过 Step 8 最终确认。`[E2E]`
3. `AC-SPECOPT-010-03`: 文档与实现中不再保留”无用户确认直接推进”的模式分支。`[IT]`

### FR-SPEC-OPT-011：Phase 0 PRD 必产物

描述：需求开始第一步必须生成 `prd.md`，作为后续 FR/AC 的唯一输入锚点。

upstream: `[REQ-PRD-*]`（所有 PRD 原子需求条目）

AC：

1. `AC-SPECOPT-011-01`: 执行 `/spec-first:spec` 后，`specs/{featureId}/prd.md` 必存在且有内容。`[IT]`
2. `AC-SPECOPT-011-02`: 未满足 PRD 关键字段时，流程阻断，不允许进入 Step 0+。`[IT]`

### FR-SPEC-OPT-012：两类场景 PRD 模板分支

描述：Phase 0 根据场景自动选择 PRD 模板分支（0-1 新需求 / 迭代需求）。

depends_on: `FR-SPEC-OPT-011`

AC（场景 A — 0-1 新需求）：

1. `AC-SPECOPT-012-01`: 包含问题定义（Problem Statement）。`[IT]`
2. `AC-SPECOPT-012-02`: 包含目标用户与使用场景（Persona / JTBD）。`[IT]`
3. `AC-SPECOPT-012-03`: 包含 MVP 范围定义。`[IT]`
4. `AC-SPECOPT-012-04`: 包含可量化成功指标（≥1 条）。`[IT]`
5. `AC-SPECOPT-012-05`: 包含关键假设与待验证项。`[IT]`

AC（场景 B — 迭代需求）：

6. `AC-SPECOPT-012-06`: 包含 As-Is 当前行为基线。`[IT]`
7. `AC-SPECOPT-012-07`: 包含 To-Be 变更目标。`[IT]`
8. `AC-SPECOPT-012-08`: 包含影响范围清单（模块/接口/数据/配置）。`[IT]`
9. `AC-SPECOPT-012-09`: 包含现有实现证据（≥1 条文件路径）。`[IT]`
10. `AC-SPECOPT-012-10`: 包含验证策略（回归点与新增验收点）。`[IT]`

AC（通用）：

11. `AC-SPECOPT-012-11`: 场景判断依据与结果必须写入 `prd.md` 头部元信息。`[IT]`
12. `AC-SPECOPT-012-12`: 场景不确定时默认判定 `iteration`，并记录保守判定理由。`[IT]`

### FR-SPEC-OPT-013：PRD 门禁（G-SPEC-00）

描述：在 `01_specify` 阶段新增 PRD 完整性门禁，未通过即阻断。

depends_on: `FR-SPEC-OPT-011`

AC：

1. `AC-SPECOPT-013-01`: `gate check` 在 01 阶段包含 `G-SPEC-00`（PRD exists + required sections）。`[IT]`
2. `AC-SPECOPT-013-02`: PRD 不完整时返回 `FAIL/BLOCKED`，不得”先写 spec 后补 PRD”。`[IT]`

### FR-SPEC-OPT-014：PRD 清晰度评分（C-PRD）

描述：Phase 0 完成后必须执行 PRD 清晰度评分，低于阈值时阻断进入 Step 0。

depends_on: `FR-SPEC-OPT-011`

AC：

1. `AC-SPECOPT-014-01`: 评分维度固定为：完整性、可验证性、可追溯性、边界明确性、可收敛性（等权 20% × 5）。`[UT]`
2. `AC-SPECOPT-014-02`: 评分算法：`C-PRD = Σ(维度得分 × 20%)`，详见 §4.6 C-PRD 评分算法。`[UT]`
3. `AC-SPECOPT-014-03`: `C-PRD >= 85%` 才允许进入 Step 0。`[IT]`
4. `AC-SPECOPT-014-04`: `iteration` 场景至少提供 3 条”现有实现证据（文件路径）”。`[IT]`
5. `AC-SPECOPT-014-05`: `greenfield` 场景至少提供 1 条可量化成功指标。`[IT]`

### FR-SPEC-OPT-015：PRD→FR 追溯映射

描述：`prd.md` 中的 `REQ-PRD-xxx` 条目必须与 §5 FR 建立显式双向追溯关系，确保 Spec-First “规范即契约” 追溯链完整。

depends_on: `FR-SPEC-OPT-011`

AC：

1. `AC-SPECOPT-015-01`: 每个 FR 定义中包含 `upstream: [REQ-PRD-xxx, ...]` 字段，声明其来源 PRD 需求条目。`[IT]`
2. `AC-SPECOPT-015-02`: `traceability-matrix.md` 包含 PRD→FR 映射列，覆盖所有 FR。`[IT]`
3. `AC-SPECOPT-015-03`: 允许 1:1、N:1、1:N 映射关系，但每个 FR 至少有 1 条 upstream 引用。`[IT]`

---

## 6. 非功能需求（NFR）

1. 可审计性：每个节点都有落盘痕迹（`specs/{featureId}/findings.md` 或 `spec.md` 结构块）。
2. 一致性：四档分流输出字段命名一致，便于后续 analyze 读取。
3. 可恢复性：会话中断后可从最近节点继续，至少保留”当前节点 + 待决策项 + 下一步命令”。
4. 时效性：Trivial/Simple 路径不应显著增加轻量任务的单次 spec 执行时长（目标：从用户输入需求到 Step 8 确认完成的端到端耗时增加不超过 15%，基线数据待 M3 试运行后回填，度量方式为同一需求在优化前后各执行 3 次取中位数）。
5. 清晰性：Phase 0 PRD 应达到”可供第三方接手继续 spec”的可读程度（不依赖会话记忆）。
6. 判定确定性：场景判定必须给出可复核的证据路径与理由，不允许”凭感觉”分类。
7. 低打扰：Phase 0 默认不向用户追问可推导信息，优先仓库证据与最佳实践决策。

---

## 7. 设计与实现改造点

### 7.1 主要改动文件

1. `/Users/kuang/xiaobu/spec-first/skills/spec-first/03-spec/SKILL.md`  
改动：引入四档复杂度分流、Phase 0 PRD 必产物、Question Gate、Expansion Sweep、Final Confirmation 模板。
2. `/Users/kuang/xiaobu/spec-first/src/core/process-engine/init.ts`  
改动：可选预置 `prd.md` 骨架；最终内容必须在 `/spec-first:spec` 的 Step 0 重新生成/补全（避免“空 PRD”误判通过）。
3. `/Users/kuang/xiaobu/spec-first/src/core/template/artifact-checker.ts`  
改动：将 `prd.md` 纳入 01_specify 阶段必需产物校验。
4. `/Users/kuang/xiaobu/spec-first/src/core/gate-engine/gate-evaluator.ts`  
改动：在 01 阶段新增 `G-SPEC-00`（PRD 完整性）与 `C-PRD` 阈值校验，并启用阻断策略。
5. `/Users/kuang/xiaobu/spec-first/src/core/gate-engine/sca.ts`  
改动：将 `prd.md` 纳入跨产物一致性分析 requiredArtifacts，并检查 PRD→spec→matrix 承接关系。
6. `/Users/kuang/xiaobu/spec-first/src/cli/commands/analyze.ts`  
改动：分析报告中展示 PRD 相关发现与严重度汇总。
7. `/Users/kuang/xiaobu/spec-first/src/core/gate-engine/prd-validator.ts`（新文件）  
改动：沉淀 PRD 章节校验、场景判定字段校验、`C-PRD` 评分逻辑，供 gate 与 analyze 复用。

### 7.2 不变项

1. 命令名与入口不变：`/spec-first:spec`
2. 当前 P0-P5 主骨架保留，仅细化节点内容
3. 现有 Hard-Gate、Gate history、matrix/update 命令链保持不变

### 7.3 被本次优化废止/修订的现有规则清单

以下现有 SKILL.md 规则在本次优化实施后将被替代：

| 现有规则 | 位置 | 替代规则 | 说明 |
|---------|------|---------|------|
| "最多 5 轮澄清，每轮最多 3 个问题" | `SKILL.md:78` | FR-003：Step 6 单问，Step 1-5 最多 3 问 | 轮次上限改为按 Step 计（每 Step 内最多 3 轮澄清），不再全局限 5 轮 |
| P0-P5 六阶段扁平执行 | `SKILL.md:169-174` | Phase 0 + Step 0-8 + P4/P5 | P0→Phase 0 + Step 0-2，P1→Step 0-3，P2→Step 4-7，P3→Step 8，P4/P5 不变 |
| 输出路径仅 spec.md + traceability-matrix.md | `SKILL.md:183-184` | 新增 prd.md、findings.md 状态头、decisions/ADR-*.md | findings.md 已存在但无结构化状态头 |
| "自我修正上限 3 轮" | `SKILL.md:45` | 保留，适用于单 Step 内 | 不变但作用域从全局缩小到单 Step |

### 7.4 本轮交付边界（文档阶段）

1. 本文档定义需求与验收标准，不代表本轮已改动 `skills/` 或 `src/`。
2. 后续实施应基于本文档新建任务卡并执行 code/design 变更。

---

## 8. 实施计划

### 里程碑 M1（1-2 天）

1. 完成 `03-spec/SKILL.md` 四档分流与九节点规则重构。
2. 增加 Phase 0 PRD 模板（场景 A/B）、最终确认模板、ADR-lite 模板、findings.md 结构定义。
3. 补充示例输出（0-1 新需求 1 例，迭代需求 1 例，Complex 1 例）。

### 里程碑 M2（1 天）

1. 在 `gate-evaluator.ts` 增加 `G-SPEC-00` + `C-PRD>=85%` 并接入 `gate check`。
2. 新增 `prd-validator.ts`，统一 PRD 章节检查与评分逻辑。
3. 在 `artifact-checker.ts` 与 `sca.ts` 纳入 `prd.md` 必需与一致性检查。

### 里程碑 M3（1 天）

1. 回归测试：`spec -> gate check -> matrix check` 全链路验证。
2. 选取 2-3 个真实 Feature 进行四档分流试运行并记录对比数据（含场景 A/B）。
3. 验证场景自动判定准确率与误判兜底策略（不确定默认 iteration）。

---

## 9. 验收标准（整体）

抽样规则：每档（Trivial/Simple/Moderate/Complex）至少 1 例，共 ≥4 例，须覆盖场景 A（greenfield）和场景 B（iteration）各至少 1 例。

1. `/spec-first:spec` 在实际执行中能稳定输出四档复杂度判定与节点进度。
2. `Complex` 执行中可观测到 Phase 0 + Step 0-8 全节点落盘痕迹。
3. Phase 0 必产出 `prd.md`，且 `G-SPEC-00` 与 `C-PRD>=85%` 通过后才允许进入后续步骤。
4. 场景 A（0-1）与场景 B（迭代）都能产出结构完整、可承接的 PRD。
5. 01_specify 阶段 Gate 通过率不下降，C10 维持现有门槛。
6. 需求变更后的 `traceability-matrix.md` 更新完整，无新增 CRITICAL 一致性问题。
7. 抽样会话中不存在反模式违规（Step 6 多问并发、元问题、可推导问题外抛）。
8. 抽样会话中不存在”未确认即推进”的自助决策行为。
9. 场景自动判定结果在抽样中可复核（有 `scenario_reason` + `evidence_paths`）。

---

## 10. 风险与缓解

1. 风险：流程变长导致用户感知变慢。
缓解：Trivial/Simple 走轻量路径，仅 Moderate/Complex 触发深度节点。
2. 风险：模板过强导致表达僵化。
缓解：固定字段 + 可扩展附录，保留项目自定义空间。
3. 风险：新节点未被执行。
缓解：在 Skill 中加入”节点完成检查清单”，并在 analyze 中加诊断。
4. 风险：PRD 门禁误杀（合理需求因格式不达标被阻断）。
缓解：提供 `--skip-prd-gate` 紧急绕行参数（需在 gate check 命令中实现），并记录豁免理由到 `findings.md`；建议仅在紧急情况下使用，事后必须补齐 PRD。

---

## 11. 附：四档分流与当前 P0-P5 映射

### 11.1 Phase 0.1 与 Step 0 职责边界

- **Phase 0.1（任务锚定）**：侧重"理解问题空间"——明确目标问题是什么、约束有哪些、成功标准来自哪里。产出物为 PRD 的 Goal 与 Problem Statement 草稿。
- **Step 0（Ensure Task Exists）**：侧重"形式化注册"——确保任务在追踪系统中存在，Feature ID 已创建，stage-state 已初始化。
- Trivial/Simple 路径可合并 Phase 0.1 与 Step 0 为单步执行（先理解再注册），以控制总步数。Complex 路径须分开执行以确保审计粒度。

### 11.2 映射关系

1. P0 对应 Phase 0（PRD 产出）与 Step 2（复杂度分类）。
2. P1 对应 Step 0（任务锚定）、Step 1（自动上下文）与 Step 3（问题门禁）。
3. P2 对应 Step 4-7（研究、发散、收敛、方案决策），按复杂度裁剪深度。
4. P3 对应 Step 8（结构化最终确认与计划）。
5. P4 对应确认后写入 `spec.md` 与 `traceability-matrix.md`。
6. P5 对应 gate check + 可选 matrix check。

依赖关系：
- M1 → M2：M2 的 gate 改动依赖 M1 的 SKILL.md 完成（需先定义 Phase 0 与 C-PRD 评分规则）
- M2 → M3：M3 的回归测试依赖 M2 的 gate 与 validator 实现完成
- M1/M2/M3 严格串行执行

---

## 12. 原生反模式清单（Hard Avoid）

以下行为在 spec 阶段必须禁止：

1. **向用户索要可推导信息**（Asking user for code/context that can be derived from repo）
禁止向用户提问可通过仓库检索、文档分析或调研直接获取的信息。

2. **未提供选项即要求选择**（Asking user to choose before presenting concrete options）
禁止在未给出具体方案对比前要求用户做选择。

3. **元问题**（Meta questions about whether to research）
禁止询问"是否需要调研"这类元问题；需要信息时直接执行检索。

4. **发散漂移**（Letting brainstorming drift without updating PRD/spec）
禁止在发散讨论后不更新 PRD 或 spec，导致结论丢失。

5. **忽略演进与边界**（Staying narrowly on initial request without considering evolution/edges，对 Moderate/Complex）
禁止在 Moderate/Complex 任务中仅关注初始需求，不考虑未来演进和边界场景。

执行要求：

1. 发现反模式即停止当前提问并回到 Step 1/3 重新执行。
2. 反模式修复动作必须写入 `specs/{featureId}/findings.md`。

---

## 13. Step 8 最终确认包（标准模板）

在进入 P4 前必须输出以下结构：

1. Goal
2. Requirements
3. Acceptance Criteria
4. Definition of Done
5. Out of Scope
6. Technical Approach（简要）
7. Implementation Plan（小步拆分）

模板（示意）：

```markdown
Here's my understanding of the complete requirements:

Goal: <one sentence>

Requirements:
- ...

Acceptance Criteria:
- [ ] ...

Definition of Done:
- ...

Out of Scope:
- ...

Technical Approach:
- ...

Implementation Plan:
- PR1: ...
- PR2: ...
```

---

## 14. Step 7 ADR-lite 模板（Complex 任务必需）

路径：`specs/{featureId}/decisions/ADR-{YYYYMMDD}-{short-title}.md`

用途：记录 Complex 任务中的关键技术决策，确保方案选择可追溯、可复核。

模板：

```markdown
# ADR-{YYYYMMDD}: {决策标题}

## Status
Proposed / Accepted / Deprecated / Superseded

## Context
**问题背景**：描述需要决策的技术问题或业务场景。

**约束条件**：列出影响决策的关键约束（性能/成本/时间/团队技能/合规等）。

## Decision
**选择方案**：{方案名称}

**核心理由**：用 1-2 句话说明为何选择此方案。

## Alternatives Considered
| 方案 | 优势 | 劣势 | 为何未选 |
|------|------|------|---------|
| 方案 A | ... | ... | ... |
| 方案 B | ... | ... | ... |

## Consequences
**正面影响**：
- ...

**负面影响**：
- ...

**风险与缓解**：
- 风险：...
- 缓解：...

## References
- 相关文档/RFC/Issue 链接
- 技术调研报告路径
```

触发条件：
- Step 7 (Propose Approaches + Record Decisions) 执行时
- 存在 ≥2 个可执行方案需要权衡时
- 决策会影响架构、性能、安全或长期维护成本时

---

## 15. Phase 0 PRD 模板（两类场景）

统一要求：

1. 文件路径：`specs/{featureId}/prd.md`
2. 头部必须使用 YAML 元信息：`scenario`、`scenario_reason`、`evidence_paths`、`complexity`（Phase 0 阶段默认 `"pending"`，Step 2 完成后回填实际档位）
3. 任何场景都必须包含：Goal、Requirements Draft、Open Questions、Out of Scope
4. `Requirements Draft` 必须按 `REQ-PRD-xxx` 原子条目书写（每条只表达一个可验证需求）

### 15.1 场景 A（0-1 新需求）模板

```markdown
---
scenario: greenfield
scenario_reason: "<为何判定为 0-1 的一句话理由>"
evidence_paths: []
complexity: "pending"  # Phase 0 默认值，Step 2 完成后回填
---

# <feature title>

## Goal
## Problem Statement
## Target Users / JTBD
## Business Goals & Success Metrics

## MVP Scope
## Out of Scope
## Assumptions & Risks
## Open Questions
## Requirements Draft
```

### 15.2 场景 B（有历史代码迭代）模板

```markdown
---
scenario: iteration
scenario_reason: "<为何判定为迭代的一句话理由>"
evidence_paths:
  - "src/xxx.ts"
  - "src/yyy.ts"
  - "docs/zzz.md"
complexity: "pending"  # Phase 0 默认值，Step 2 完成后回填
---

# <feature title>

## Goal
## As-Is Baseline
## To-Be Goals

## Impact Scope (modules/api/data/config)
## Existing Implementation Evidence
## Risks & Rollback
## Validation Strategy
## Out of Scope
## Open Questions
## Requirements Draft
```
