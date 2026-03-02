# /spec-first:spec 命令优化需求文档（参考 Trellis Brainstorm）

> 版本: v1.5  
> 日期: 2026-03-01  
> 状态: Draft（可直接进入 01_specify 评审）  
> 范围: 覆盖 `/spec-first:spec` 全流程优化（节点、提问、调研、反模式、输出模板、阶段衔接），仅保留 Trellis 原生交互模式，不改命令名

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
7. 缺少“Step 0 首次产出 PRD”硬要求，导致需求理解与后续 FR/AC 的承接不稳定。
8. 缺少针对两类场景（0-1 新需求 / 迭代需求）的 PRD 分支模板。

### 3.2 优化原则

1. 强化发现流程，不弱化现有 Gate 治理。
2. 保持命令接口稳定（仍是 `/spec-first:spec`）。
3. 所有新增节点必须可落盘、可检查、可回放。
4. 交互优先：关键决策点必须由用户确认，不允许 AI 默默跨过确认节点。

---

## 4. 目标流程：Trellis 原生四档分流 + 九节点

## 4.0 Step 0 必须先产出 PRD（阻断约束）

`/spec-first:spec` 的第一步不是直接写 FR，而是先生成清晰的需求理解 PRD。

强制要求：

1. Step 0 必须创建或更新：`specs/{featureId}/prd.md`。
2. 未产出 PRD 或 PRD 关键字段缺失，不得进入 Step 1 及后续步骤。
3. Step 0 完成后，FR/AC 只能基于 PRD 中已确认内容生成。

Step 0 执行顺序（不可打乱）：

1. `Step 0.1` 任务锚定：明确目标问题、约束、成功标准来源（用户输入/仓库证据）。
2. `Step 0.2` 场景判定：自动判定 `greenfield`（0-1）或 `iteration`（迭代）。
3. `Step 0.3` PRD 生成：按场景模板产出 `prd.md`，包含结构化章节与开放问题。
4. `Step 0.4` PRD 自检：执行 PRD 完整性与清晰度检查，未通过即阻断。

## 4.1 原生四档复杂度分流（强制）

`/spec-first:spec` 在发现流程早期必须输出复杂度分类：

1. `Trivial`：边界清晰、改动极小。跳过深度 brainstorm，走最小澄清与快速确认。
2. `Simple`：目标清晰、低歧义。执行 1 次确认提问后进入 FR/AC 收敛。
3. `Moderate`：存在一定歧义或多文件影响。执行轻量 brainstorm（2-3 个高价值问题）。
4. `Complex`：目标模糊或存在方案分歧。执行完整九节点流程（0-8）。

交互约束：

1. 四档分流只决定探索深度，不改变“交互式确认”本质。
2. 任一档位都必须存在用户可见确认点（至少在 Step 8）。

## 4.2 Trellis Step 0-8 原样借鉴映射（强制）

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

1. `Trivial`：Step 0-2 + Step 8（最小确认包），可跳过 Step 4/5/7。
2. `Simple`：Step 0-3 + Step 6 + Step 8（1 个确认问题）。
3. `Moderate`：Step 0-6 + Step 8（2-3 个高价值问题）。
4. `Complex`：Step 0-8 全量执行，Step 7 必须落 ADR-lite。

统一约束：

1. 每个已执行节点必须有落盘痕迹（`findings.md` 或 `spec.md`）。
2. `Complex` 缺任一节点，视为 spec 过程不完整，不允许进入 P4/P5。

## 4.4 两类需求场景（Step 0 PRD 分支）

### 场景 A：无历史项目代码（0-1 新需求）

Step 0 PRD 必含：

1. 问题定义（Problem Statement）
2. 目标用户与使用场景（Persona / JTBD）
3. 业务目标与成功指标（含可量化指标）
4. MVP 范围与 Out of Scope
5. 关键假设与待验证项
6. 约束条件（时间/资源/合规/安全）

### 场景 B：有历史代码（功能迭代）

Step 0 PRD 必含：

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
   2. 需求文本包含“优化/改造/重构/扩展/兼容/回归”等迭代语义。
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

---

## 5. 功能需求（FR）与验收标准（AC）

### FR-SPEC-OPT-001：四档复杂度分流

描述：`/spec-first:spec` 在进入 P2 前必须输出复杂度判定（Trivial/Simple/Moderate/Complex）及理由。

AC：

1. 每次执行都出现 `Complexity: Trivial|Simple|Moderate|Complex` 与判定依据。
2. `Complex` 必须执行 Step 0-8 全量；`Moderate` 至少执行 Step 0-6 + 8。

### FR-SPEC-OPT-002：Question Gate 强化

描述：新增独立问题门禁，先判断可推导性，再提问。

AC：

1. 问题必须标记类型：`Blocking` 或 `Preference`。
2. 若可由仓库推导，则禁止向用户提问。

### FR-SPEC-OPT-003：一问一答与动态收敛

描述：进入收敛阶段后执行“一次一问”，每轮更新需求状态。

AC：

1. 单条消息最多 1 个问题（Step 6）。
2. 每轮答案都回写 `spec.md` 并更新待澄清项。

### FR-SPEC-OPT-004：Research-first 触发器

描述：技术选型类需求自动触发调研并输出选项。

AC：

1. 至少输出 2 个可执行方案及取舍。
2. 方案选择结果回写 ADR-lite。

### FR-SPEC-OPT-005：Expansion Sweep 标准化

描述：`Moderate/Complex` 必须执行发散扫描三类检查。

AC：

1. 三类检查齐备：未来演进、相关场景、失败/边界。
2. 扫描结果拆分为“纳入 MVP”与“Out of Scope”。

### FR-SPEC-OPT-006：最终确认包标准化

描述：进入落盘前必须输出固定结构确认包。

AC：

1. 必含字段：Goal、Requirements、AC、DoD、Out of Scope、Implementation Plan。
2. 未确认不得进入落盘与 Gate。

### FR-SPEC-OPT-007：治理与质量基线

描述：优化后保留现有 Gate/C10 与 AC 可验证性约束。

AC：

1. `G-SPEC-03 (C10>=80%)` 行为不弱化。
2. 允许调整 AC ID 细节与 `gate check` 文案/条件，只要验证链路完整可追溯。

### FR-SPEC-OPT-008：原生反模式硬约束

描述：对齐 Trellis 原生 brainstorm 反模式，作为 spec 执行硬约束。

AC：

1. 禁止向用户提问可由仓库/文档/调研直接推导的信息。
2. 禁止“是否要调研”这类元问题；需要信息时直接执行检索。
3. 禁止一次消息抛出多问题清单；必须单问单收敛。

### FR-SPEC-OPT-009：阶段衔接输出标准

描述：Step 8 完成后必须输出可直接进入后续阶段（design/task）的结构化衔接包。

AC：

1. 输出包含：完整需求摘要、关键决策、实施计划、Out of Scope。
2. 衔接包可直接被后续阶段引用，无需重复访谈。

### FR-SPEC-OPT-010：交互模式唯一化

描述：spec-first:spec 仅保留 Trellis 原生交互模式，不引入 AI 自助决策模式。

AC：

1. 关键偏好、范围边界、方案选择必须经过用户确认后落盘。
2. AI 可自主完成仓库检索、调研和候选方案整理，但不得跳过 Step 8 最终确认。
3. 文档与实现中不再保留“无用户确认直接推进”的模式分支。

### FR-SPEC-OPT-011：Step 0 PRD 必产物

描述：需求开始第一步必须生成 `prd.md`，作为后续 FR/AC 的唯一输入锚点。

AC：

1. 执行 `/spec-first:spec` 后，`specs/{featureId}/prd.md` 必存在且有内容。
2. 未满足 PRD 关键字段时，流程阻断，不允许进入 Step 1+。

### FR-SPEC-OPT-012：两类场景 PRD 模板分支

描述：Step 0 根据场景自动选择 PRD 模板分支（0-1 新需求 / 迭代需求）。

AC：

1. 场景 A（0-1）必须包含问题定义、用户场景、MVP、成功指标、关键假设。
2. 场景 B（迭代）必须包含 As-Is、To-Be、影响范围、现有实现证据、验证策略。
3. 场景判断依据与结果必须写入 `prd.md` 头部元信息。
4. 场景不确定时默认判定 `iteration`，并记录保守判定理由。

### FR-SPEC-OPT-013：PRD 门禁（G-SPEC-00）

描述：在 `01_specify` 阶段新增 PRD 完整性门禁，未通过即阻断。

AC：

1. `gate check` 在 01 阶段包含 `G-SPEC-00`（PRD exists + required sections）。
2. PRD 不完整时返回 `FAIL/BLOCKED`，不得“先写 spec 后补 PRD”。

### FR-SPEC-OPT-014：PRD 清晰度评分（C-PRD）

描述：Step 0 完成后必须执行 PRD 清晰度评分，低于阈值时阻断进入 Step 1。

AC：

1. 评分维度固定为：完整性、可验证性、可追溯性、边界明确性、可收敛性。
2. `C-PRD >= 85%` 才允许进入 Step 1。
3. `iteration` 场景至少提供 3 条“现有实现证据（文件路径）”。
4. `greenfield` 场景至少提供 1 条可量化成功指标。

---

## 6. 非功能需求（NFR）

1. 可审计性：每个节点都有落盘痕迹（`findings.md` 或 `spec.md` 结构块）。
2. 一致性：四档分流输出字段命名一致，便于后续 analyze 读取。
3. 可恢复性：会话中断后可从最近节点继续，至少保留“当前节点 + 待决策项 + 下一步命令”。
4. 时效性：Trivial/Simple 路径不应显著增加轻量任务时长（目标增加不超过 15%）。
5. 清晰性：Step 0 PRD 应达到“可供第三方接手继续 spec”的可读程度（不依赖会话记忆）。
6. 判定确定性：场景判定必须给出可复核的证据路径与理由，不允许“凭感觉”分类。
7. 低打扰：Step 0 默认不向用户追问可推导信息，优先仓库证据与最佳实践决策。

---

## 7. 设计与实现改造点

### 7.1 主要改动文件

1. `/Users/kuang/xiaobu/spec-first/skills/spec-first/03-spec/SKILL.md`  
改动：引入四档复杂度分流、Step 0 PRD 必产物、Question Gate、Expansion Sweep、Final Confirmation 模板。
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

### 7.3 本轮交付边界（文档阶段）

1. 本文档定义需求与验收标准，不代表本轮已改动 `skills/` 或 `src/`。
2. 后续实施应基于本文档新建任务卡并执行 code/design 变更。

---

## 8. 实施计划

### 里程碑 M1（1-2 天）

1. 完成 `03-spec/SKILL.md` 四档分流与九节点规则重构。
2. 增加 Step 0 PRD 模板（场景 A/B）与最终确认模板、ADR-lite 模板。
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

1. `/spec-first:spec` 在实际执行中能稳定输出四档复杂度判定与节点进度。
2. `Complex` 执行中可观测到 Step 0-8 全节点落盘痕迹。
3. Step 0 必产出 `prd.md`，且 `G-SPEC-00` 与 `C-PRD>=85%` 通过后才允许进入后续步骤。
4. 场景 A（0-1）与场景 B（迭代）都能产出结构完整、可承接的 PRD。
5. 01_specify 阶段 Gate 通过率不下降，C10 维持现有门槛。
6. 需求变更后的 `traceability-matrix.md` 更新完整，无新增 CRITICAL 一致性问题。
7. 抽样会话中不存在反模式违规（多问并发、元问题、可推导问题外抛）。
8. 抽样会话中不存在“未确认即推进”的自助决策行为。
9. 场景自动判定结果在抽样中可复核（有 `scenario_reason` + `evidence_paths`）。

---

## 10. 风险与缓解

1. 风险：流程变长导致用户感知变慢。  
缓解：Trivial/Simple 走轻量路径，仅 Moderate/Complex 触发深度节点。
2. 风险：模板过强导致表达僵化。  
缓解：固定字段 + 可扩展附录，保留项目自定义空间。
3. 风险：新节点未被执行。  
缓解：在 Skill 中加入“节点完成检查清单”，并在 analyze 中加诊断。

---

## 11. 附：四档分流与当前 P0-P5 映射

1. P0 对应 Step 0（任务锚定）与 Step 2（复杂度分类）。
2. P1 对应 Step 1（自动上下文）与 Step 3（问题门禁）。
3. P2 对应 Step 4-7（研究、发散、收敛、方案决策），按复杂度裁剪深度。
4. P3 对应 Step 8（结构化最终确认与计划）。
5. P4 对应确认后写入 `spec.md` 与 `traceability-matrix.md`。
6. P5 对应 gate check + 可选 matrix check。

---

## 12. 原生反模式清单（Hard Avoid）

以下行为在 spec 阶段必须禁止：

1. Asking user for code/context that can be derived from repo。
2. Asking user to choose before presenting concrete options。
3. Meta questions about whether to research。
4. Letting brainstorming drift without updating PRD/spec。
5. Staying narrowly on initial request without considering evolution/edges（对 Moderate/Complex）。

执行要求：

1. 发现反模式即停止当前提问并回到 Step 1/3 重新执行。
2. 反模式修复动作必须写入 `findings.md`。

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

## 14. Step 0 PRD 模板（两类场景）

统一要求：

1. 文件路径：`specs/{featureId}/prd.md`
2. 头部必须使用 YAML 元信息：`scenario`、`scenario_reason`、`evidence_paths`、`complexity`
3. 任何场景都必须包含：Goal、Requirements Draft、Open Questions、Out of Scope
4. `Requirements Draft` 必须按 `REQ-PRD-xxx` 原子条目书写（每条只表达一个可验证需求）

### 14.1 场景 A（0-1 新需求）模板

```markdown
---
scenario: greenfield
scenario_reason: "<为何判定为 0-1 的一句话理由>"
evidence_paths: []
complexity: "Trivial|Simple|Moderate|Complex"
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

### 14.2 场景 B（有历史代码迭代）模板

```markdown
---
scenario: iteration
scenario_reason: "<为何判定为迭代的一句话理由>"
evidence_paths:
  - "src/xxx.ts"
  - "src/yyy.ts"
  - "docs/zzz.md"
complexity: "Trivial|Simple|Moderate|Complex"
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
