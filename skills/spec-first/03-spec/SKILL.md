---
name: "spec-first:spec"
description: "定位 Feature 并校验阶段为需求规格（01_specify）"
version: 2.0.0
last_updated: {{DATE}}
changelog: "v2.0.0: 重构为 Phase 0 + Step 0-8 流程，新增四档复杂度分流、PRD 必产物、findings.md 状态头"
user-invocable: true
allowed-tools: "Read, Write, Edit, Bash"
---

# Skill: spec

定义需求规格，通过 Phase 0（PRD）+ Step 0-8 流程生成 FR 功能需求与验收标准（AC）。

## Announce at Start

```
I'm using the spec skill to define requirements for [Feature].
```

## 字面即精神原则

**Violating the letter of these rules is violating the spirit of these rules.**

### 字面即精神反合理化表

| AI 的借口 | 封堵 |
|-----------|------|
| "我理解核心思想，可以灵活执行" | 字面规则的违反就是精神的违反，不存在灵活变通 |
| "这是精神而非仪式" | 仪式（字面规则）是精神的体现，跳过仪式就是违背精神 |
| "实质重于形式" | 在流程守卫上，形式（字面规则）= 实质（精神） |
| "具体情况具体分析" | 规则已考虑常见情况，例外需明确讨论而非自行变通 |

## 反合理化守卫

当你产生以下念头时，立即停止并回到流程：

| AI 的借口 | 封堵 |
|-----------|------|
| "需求很清楚，不需要澄清" | 你认为清楚 != 无歧义，检查 NEEDS CLARIFICATION 项 |
| "AC 用自然语言就够了" | 自然语言 AC 难以自动转化为测试用例 |
| "这个 NFR 不重要，先跳过" | 跳过 NFR = 埋下技术债，至少标记为 P2 |
| "用户没提到边界情况" | 用户不提 != 不存在，主动识别是 spec 的职责 |
| "先写个大概，后面再细化" | 模糊 spec 会放大后续设计与实现成本 |
| "这个需求和上次项目一样" | 上下文不同，直接类比会引入错误假设 |
| "PRD 可以跳过，直接写 FR" | PRD 是 FR 的基础，跳过 PRD = 缺失需求理解 |
| "复杂度判定不重要" | 复杂度决定执行深度，误判会导致质量问题 |

## 模板驱动约束

spec 阶段只定义 WHAT，不定义 HOW：
- 必须写：业务目标、边界、验收标准、NFR、风险与约束
- 禁止写：模块实现细节、类/函数级算法、具体库选型
- 若出现实现细节，必须重写为可验证的需求或约束条款
- 自我修正上限：3 轮；超过上限必须停止并请求用户澄清
- `[NEEDS CLARIFICATION]` 同一轮最多 3 项；优先级：范围 > 安全 > 合规 > UX > 技术偏好

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

歧义分类标签：
- `BOUNDARY`（边界值）
- `ERROR`（异常处理）
- `PRIORITY`（优先级冲突）
- `SEMANTIC`（语义多解）
- `DEPENDENCY`（外部依赖缺失）
- `METRIC`（成功指标缺失）
- `TERM`（术语未定义）
- `ROLE`（角色/权限不清）
- `TEMPORAL`（时序/时限不清）
- `DATA`（数据来源/质量不清）

标记格式：
`[NEEDS CLARIFICATION][<TYPE>] FR-XXX-001: 具体问题？候选范围 A/B/C`

澄清轮次约束：
- 最多 5 轮澄清，每轮最多 3 个问题
- 每轮结束必须把确认结果回写 `spec.md`
- 若 5 轮后仍存在阻断级歧义，停止推进并标记为 `[BLOCKED]`

## Dynamic Clarification Questions

每轮澄清问题必须按以下 5 步动态生成，禁止固定模板硬问：
1. 读取当前轮未闭环的 `[NEEDS CLARIFICATION]`，按风险排序（范围/安全/合规优先）
2. 仅保留"会改变 FR/AC/NFR 结果"的问题，删除不会影响输出的问题
3. 每个问题提供 2-3 个可执行候选（A/B/C），避免开放式泛问
4. 合并重复语义问题，保证一轮最多 3 问
5. 本轮结束后把答案写回 `spec.md`，并更新剩余歧义列表再进入下一轮

## AC ID 规范

- 命名：`AC-<ABBR>-<FRSEQ>-<NN>`
- 示例：`FR-AUTH-001` 下的第 1 条 AC 为 `AC-AUTH-001-01`
- 约束：一个 AC ID 只能映射一条可验证断言，禁止一条 AC 混合多个断言

## 触发条件
- 阶段: 01_specify
- Command: `/spec-first:spec`

## 执行流程：Phase 0 + Step 0-8

### Phase 0: PRD 必产物（前置阶段，阻断约束）

**目标**: 生成清晰的需求理解文档（PRD），作为后续 FR/AC 的基础。

**强制要求**:
1. Phase 0 必须创建或更新：`specs/{featureId}/prd.md`
2. 未产出 PRD 或 PRD 关键字段缺失，不得进入 Step 0 及后续步骤
3. Phase 0 完成后，FR/AC 只能基于 PRD 中已确认内容生成

**执行顺序**（不可打乱）:

#### Phase 0.1: 任务锚定
- 明确目标问题、约束、成功标准来源（用户输入/仓库证据）
- 识别关键干系人与业务目标
- 记录到 `findings.md`

#### Phase 0.2: 场景判定
- 自动判定 `greenfield`（0-1 新需求）或 `iteration`（迭代需求）
- 判定依据：
  - greenfield: 无现有代码/文档，全新功能
  - iteration: 基于现有功能的增强/修改
- 记录场景类型到 `findings.md`

#### Phase 0.3: PRD 生成
- 按场景模板产出 `prd.md`
- greenfield 模板：目标/用户故事/边界/约束/成功标准
- iteration 模板：现状/问题/改进目标/影响范围/回归风险
- 包含结构化章节与开放问题

#### Phase 0.4: PRD 自检
- 执行 PRD 完整性检查（章节完整性/场景清晰度）
- 计算 C-PRD 评分（>=85% 通过）
- 未通过即阻断，返回 Phase 0.3 修正

#### Phase 0.5: PRD 用户确认
- 向用户展示 PRD 摘要 + C-PRD 评分
- 用户确认后方可进入 Step 0
- 确认内容写入 `findings.md`

**输出**:
- `specs/{featureId}/prd.md`
- `findings.md` 更新（Phase 0 完成标记）

---

### Step 0: Ensure Task Exists (ALWAYS)

**目标**: 确认 Feature 已初始化，工作区完整。

**执行**:
1. 检查 `specs/{featureId}/` 目录存在
2. 检查 `stage-state.json` 阶段为 `01_specify`
3. 检查 `constitution.md` 存在
4. 检查 `traceability-matrix.md` 存在

**输出**:
- `findings.md` 记录 Step 0 完成

---

### Step 1: Auto-Context (DO THIS BEFORE ASKING QUESTIONS)

**目标**: 自动收集上下文，避免向用户索要可推导信息。

**执行**:
1. 读取 `prd.md` 获取需求理解
2. 读取 `constitution.md` 获取项目约束
3. 扫描仓库识别相关文件（基于关键词）
4. 识别外部依赖（API/数据库/第三方服务）
5. 统计受影响文件数

**输出**:
- `findings.md` 记录上下文摘要
- 受影响文件列表
- 外部依赖列表

---

### Step 2: Classify Complexity

**目标**: 判定需求复杂度，决定后续执行深度。

**四档判定标准**（多维取最高档）:

| 档位 | 受影响文件数 | 歧义点数量 | 方案分支数 | 外部依赖 | 典型特征 |
|------|------------|----------|----------|---------|---------|
| Trivial | ≤1 | 0 | 1 | 无 | 单文件微调、文案修改、配置变更 |
| Simple | 2-3 | 1-2 | 1 | 无或已明确 | 单模块功能、清晰边界、无架构影响 |
| Moderate | 4-8 | 3-5 | 2 | 1-2 个 | 跨模块协作、存在技术选型、需轻量调研 |
| Complex | ≥9 | ≥6 | ≥3 | ≥3 个 | 架构级变更、多方案权衡、需深度调研 |

**判定流程**:
1. 统计受影响文件数（Step 1 已收集）
2. 识别歧义点数量（扫描 PRD 中的未定义术语/多解语义/缺失边界）
3. 检测方案分支数（关键词：或者/可选/待定/考虑）
4. 统计外部依赖数量（Step 1 已收集）
5. 按表格规则判定档位，边界情况向上取整

**四档对应执行深度**:
- `Trivial`: Phase 0 + Step 0-2 + Step 8（跳过 Step 3-7）
- `Simple`: Phase 0 + Step 0-3 + Step 6 + Step 8（跳过 Step 4-5, 7）
- `Moderate`: Phase 0 + Step 0-6 + Step 8（跳过 Step 7）
- `Complex`: Phase 0 + Step 0-8 全量执行

**输出**:
- `findings.md` 记录复杂度档位与判定依据
- 更新 `findings.md` 状态头 `complexity` 字段

---

### Step 3: Question Gate (Ask ONLY high-value questions)

**目标**: 先判断可推导再提问，避免无效提问。

**执行**:
1. 检查 Step 1 收集的上下文是否足够回答当前歧义
2. 仅保留"无法从现有信息推导"的问题
3. 按优先级排序：范围 > 安全 > 合规 > UX > 技术偏好
4. 每轮最多 3 个问题，提供 2-3 个候选答案
5. 用户回答后写入 `spec.md`

**问题分类**:
- `Blocking`: 必须回答，否则无法继续（范围/安全/合规）
- `Preference`: 可选回答，影响体验但不阻断（UX/技术偏好）

**输出**:
- `findings.md` 记录提问与回答
- `spec.md` 更新确认内容

---

### Step 4: Research-first Mode (Mandatory for technical choices)

**目标**: 技术选型前先调研，避免拍脑袋决策。

**触发条件**:
- 复杂度为 Moderate 或 Complex
- 存在技术选型或方案分歧

**执行**:
1. 识别需要调研的技术点（库选型/架构模式/性能方案）
2. 执行 `/spec-first:research` 生成调研报告
3. 基于调研结果更新 `spec.md` 中的技术约束

**输出**:
- `research.md` 调研报告
- `findings.md` 记录调研结论

**跳过条件**:
- 复杂度为 Trivial 或 Simple
- 无技术选型需求
- 跳过时必须在 `findings.md` 记录 `Step 4: SKIPPED — 无技术选型需求`

---

### Step 5: Expansion Sweep (DIVERGE)

**目标**: 发散扫描，主动识别边界/失败场景/NFR。

**执行**:
1. 边界扫描：识别输入边界值（最小/最大/空值/非法值）
2. 失败场景：识别异常路径（网络失败/超时/权限不足）
3. NFR 扫描：识别性能/安全/可用性/可维护性需求
4. 依赖风险：识别外部依赖的失败影响

**输出**:
- `spec.md` 补充边界条件与失败场景
- `findings.md` 记录 NFR 清单

**跳过条件**:
- 复杂度为 Trivial
- 跳过时必须在 `findings.md` 记录 `Step 5: SKIPPED — Trivial 路径无需发散扫描`

---

### Step 6: Q&A Loop (CONVERGE)

**目标**: 收敛确认，逐项确认 FR/AC。

**执行**:
1. 基于 PRD + Step 1-5 的发现，生成 FR 列表
2. 每个 FR 生成 AC（使用 AC ID 规范）
3. 逐个向用户确认 FR/AC（一问一答）
4. 用户确认后写入 `spec.md`

**一问一答规则**:
- 每次只确认 1 个 FR
- FR 确认后再确认其 AC
- 允许用户修订，修订后重新确认

**输出**:
- `spec.md` 完整 FR/AC 列表
- `findings.md` 记录确认过程

---

### Step 7: Propose Approaches + Record Decisions

**目标**: 记录技术决策，生成 ADR-lite。

**触发条件**:
- 复杂度为 Complex
- 存在多个技术方案需要权衡

**执行**:
1. 列出候选方案（至少 2 个）
2. 对比方案优劣（性能/成本/复杂度/风险）
3. 记录决策依据
4. 生成 ADR-lite 文档

**ADR-lite 格式**:
```markdown
## ADR-XXX: [决策标题]

**状态**: Proposed / Accepted / Deprecated

**上下文**: [为什么需要这个决策]

**候选方案**:
- 方案 A: [描述] - 优势: [X] - 劣势: [Y]
- 方案 B: [描述] - 优势: [X] - 劣势: [Y]

**决策**: 选择方案 [A/B]

**理由**: [决策依据]

**后果**: [预期影响]
```

**输出**:
- `adr/ADR-XXX.md` 决策记录
- `findings.md` 记录决策摘要

**跳过条件**:
- 复杂度为 Trivial/Simple/Moderate
- 无多方案权衡需求
- 跳过时必须在 `findings.md` 记录 `Step 7: SKIPPED — 无需 ADR`

---

### Step 8: Final Confirmation + Implementation Plan

**目标**: 最终确认包，生成实施计划。

**执行**:
1. 生成确认包（Goal/Requirements/AC/DoD/OOS）
2. 向用户展示完整确认包
3. 用户确认后生成实施计划
4. 注册所有 FR 到追踪矩阵

**确认包格式**:
```markdown
## 最终确认包

### Goal
[业务目标]

### Requirements
[FR 列表]

### Acceptance Criteria
[AC 列表]

### Definition of Done
- [ ] 所有 FR 已实现
- [ ] 所有 AC 已验证
- [ ] Gate check 通过

### Out of Scope
[明确不做的内容]

### Implementation Plan
[下一步：执行 /spec-first:design]
```

**输出**:
- `spec.md` 最终版本
- `traceability-matrix.md` 注册所有 FR
- `findings.md` 记录 Step 8 完成

---

## findings.md 结构化状态头

路径：`specs/{featureId}/findings.md`

**必含字段**:
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

**更新时机**:
- Phase 0 开始时创建
- 每个 Step 完成后更新 `completed_steps` 和 `current_step`
- 跳过 Step 时更新 `skipped_steps`
- Step 8 完成后归档

---

## 节点跳过规则

**强制记录**:
- 被跳过的节点必须在 `findings.md` 中记录 `SKIPPED` 状态及跳过理由
- 格式：`Step X: SKIPPED — [理由]`

**示例**:
```markdown
## Step 4: Research-first Mode
SKIPPED — Simple 复杂度，无技术选型需求

## Step 5: Expansion Sweep
SKIPPED — Trivial 路径无需发散扫描

## Step 7: ADR-lite
SKIPPED — Moderate 复杂度，无多方案权衡
```

---

## CLI 依赖
- `spec-first id next FR <abbr> --feature <featureId>`
- `spec-first id next REQ-PRD <abbr> --feature <featureId>`
- `spec-first matrix update <featureId> <id> --title "<title>" [--status <status>] [--upstream <ids>] [--downstream <ids>]`
- `spec-first gate check <featureId>`

## 输出路径
- `specs/{featureId}/prd.md`
- `specs/{featureId}/spec.md`
- `specs/{featureId}/traceability-matrix.md`
- `specs/{featureId}/findings.md`
- `specs/{featureId}/adr/ADR-XXX.md`（Complex 时）

## 确认策略
- 推荐: assisted（Phase 0.5 和 Step 8 需用户确认）

## 成功标准
- `prd.md` 已生成，C-PRD >= 85%
- `spec.md` 已写入，包含所有 FR 定义和验收标准（AC）
- 所有 FR 已通过 `id next FR` 注册
- 所有 FR 至少有 1 条 `REQ-PRD-*` upstream 引用
- 所有 AC 使用统一 AC ID 规范
- `traceability-matrix.md` 已更新
- `findings.md` 包含完整 Phase 0 + Step 0-8 记录
- `gate check` 在 `01_specify` 阶段通过（含 G-SPEC-00 和 C-PRD 校验）

## 参考文档
- `references/spec-review-checklist.md`
- `references/test-level-glossary.md`
- `references/constitution-authority.md`
- `references/prd-template-greenfield.md`
- `references/prd-template-iteration.md`
- `references/adr-lite-template.md`
