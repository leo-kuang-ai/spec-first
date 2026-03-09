---
name: "spec-first:spec"
description: "定位 Feature 并校验阶段为需求规格（01_specify）"
version: 2.2.0
last_updated: 2026-03-05
changelog: "v2.2.0: 新增 Phase 0.0/0.2/0.5 增强（Feature 快速初始化/质量扫描/PRD 补全对话）; v2.1.0: 新增自动 Feature 定位; v2.0.0: 重构为 Phase 0 + Step 0-8 流程"
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

## CLI 硬约束（强制）

**ID 类型**：
- ✅ 使用 `FR`, `DS`, `TASK`, `TC`, `REQ` 等有效类型
- ❌ 禁止使用 `REQ-PRD`（不存在此类型，应使用 `REQ`）

**Matrix 状态**：
- ✅ 使用 `Planned`, `InProgress`, `Completed`, `Verified`, `Blocked`
- ❌ 禁止使用 `pending`（应使用 `Planned`）

**确认策略**：
- `matrix update` 必须添加 `--yes`（policy=strict）
- 串行执行 matrix 操作，避免并行失败级联

详见 `references/id-types-and-status.md`

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


## Feature 定位规则

### 优先级

1. **显式参数**: 用户提供 featureId 参数时直接使用
2. **自动定位**: 读取 `.spec-first/current` 获取当前激活 Feature
3. **交互式**: 列出可用 Feature 供用户选择

### 错误处理

- `.spec-first/current` 不存在或为空 → 降级到交互式
- 指定 Feature 的阶段不匹配 → 报错并终止

## 执行流程：Phase 0 + Step 0-8

### Phase 0: PRD 必产物（前置阶段，阻断约束）

**目标**: 生成清晰的需求理解文档（PRD），作为后续 FR/AC 的基础。

**强制要求**:
1. Phase 0 必须创建或更新：`specs/{featureId}/prd.md`
2. 未产出 PRD 或 PRD 关键字段缺失，不得进入 Step 0 及后续步骤
3. Phase 0 完成后，FR/AC 只能基于 PRD 中已确认内容生成

**执行顺序**（不可打乱）:

#### Phase 0.0: Feature 快速初始化（防止信息丢失）

**目标**: 用户一提需求就立即创建 Feature，避免对话中断导致信息丢失。

**触发时机**: 用户首次描述需求时（无论描述是否完整）

**执行**:
1. 立即生成 Feature ID（格式：`FSREQ-YYYYMMDD-<ABBR>-NNN`）
2. 创建 Feature 工作区：`specs/{featureId}/`
3. 初始化 `findings.md`（记录用户原始输入）
4. 写入 `.spec-first/current`（激活 Feature）
5. 提示用户："已创建 Feature {featureId}，现在开始收集需求。"

**ABBR 生成规则**:
- 从用户描述中提取 2-4 个关键词
- 取首字母大写组合（如 "用户认证" → AUTH）
- 若无法提取，使用 FEAT 作为默认值

**输出**:
- `specs/{featureId}/findings.md`（含用户原始输入）
- `.spec-first/current`（激活标记）

**防止信息丢失承诺**:
- 用户说第一句话时就创建 Feature
- 即使对话中断，需求已保存在 findings.md
- 用户可随时通过 `spec-first:catchup` 恢复上下文

---

#### Phase 0.1: 任务锚定
- 明确目标问题、约束、成功标准来源（用户输入/仓库证据）
- 识别关键干系人与业务目标
- 记录到 `findings.md`

#### Phase 0.2: 质量扫描 + 自动上下文收集

**目标**: 在生成 PRD 前，先扫描现有信息质量并自动收集上下文。

**执行**（按顺序）:

**Step 1: 质量扫描**
- 扫描用户输入的完整度（业务目标/功能边界/约束条件/成功标准）
- 计算初始质量评分（0-100%）
- 识别缺失项并标记优先级

**质量评分规则**:
```
初始评分 = (已明确项 / 必需项总数) × 100%
必需项: 业务目标(25%) + 功能边界(25%) + 约束条件(25%) + 成功标准(25%)
```

**Step 2: 自动上下文收集**（先做后问原则）
- 读取 `constitution.md` 获取项目约束
- 扫描仓库识别相关文件（基于关键词）
- 识别外部依赖（API/数据库/第三方服务）
- 检测现有代码/文档（判定 greenfield vs iteration）

**场景判定**:
- `greenfield`: 无现有代码/文档，全新功能
- `iteration`: 基于现有功能的增强/修改

**Step 3: 生成质量报告**

若某个默认前提会影响 FR / AC / NFR 的结果，则不得保持隐含状态，必须：
- 标记为 `[ASSUMED]`，或
- 升级为 `[NEEDS CLARIFICATION][TYPE]`

出现“通常 / 一般 / 默认 / 预期会”这类表述时，必须检查是否应转化为假设条目。

```markdown
## Phase 0.2 质量扫描报告

### 初始质量评分: XX%

### 已明确项
- ✅ 业务目标: [摘要]
- ✅ 功能边界: [摘要]

### 缺失项（按优先级）
- ❌ P0 约束条件: [具体缺失内容]
- ❌ P1 成功标准: [具体缺失内容]

### 隐含假设清单
- [ASSUMED] [类别] [假设内容]
- [NEEDS CLARIFICATION][TYPE] [需要确认的问题]

### 自动收集的上下文
- 场景类型: greenfield / iteration
- 相关文件: [列表]
- 外部依赖: [列表]
- 项目约束: [摘要]
```

**输出**:
- `findings.md` 追加质量报告
- 场景类型标记（greenfield/iteration）
- 自动收集的上下文摘要

**门禁规则**:
- 质量评分 < 40%: 阻断，要求用户补充核心信息
- 质量评分 40-70%: 警告，标记缺失项但允许继续
- 质量评分 > 70%: 通过，进入 Phase 0.3

#### Phase 0.3: PRD 生成

**执行方式**（二选一）:

**方式 A: 用户已有需求文档** ⭐ 推荐
1. 询问用户："是否有需求文档（PDF/Word/图片）？"
2. 如有，提示："请上传文件，我将帮您提取结构化需求。"
3. 用户上传后，使用 PRD 提取 prompt（见 `references/prd-extraction-prompt.md`）
4. 将输出保存为 `raw-requirement.md`
5. 基于 `raw-requirement.md` 生成 `prd.md`

**方式 B: 用户口述需求**
1. 通过对话收集需求
2. 按场景模板直接生成 `prd.md`
   - greenfield 模板：业务目标/功能需求/非功能需求/开放问题
   - iteration 模板：业务目标/功能需求/非功能需求/开放问题

**硬约束**：PRD 必含 `## 1. 业务目标` / `## 2. 功能需求` / `## 3. 非功能需求`

#### Phase 0.4: PRD 自检
- 执行 PRD 完整性检查（章节完整性/场景清晰度）
- 计算 C-PRD 评分（>=85% 通过）
- 未通过即阻断，返回 Phase 0.3 修正

#### Phase 0.5: PRD 补全对话（三道门禁 + 一问一答）

**目标**: 通过结构化提问补全 PRD 缺失项，确保质量达标。

**三道门禁**（Question Gate）:

**门禁 1: 可推导性检查**
- 检查 Phase 0.2 收集的上下文是否已包含答案
- 可从代码/文档/constitution 推导的问题 → 直接补全，不问用户
- 无法推导的问题 → 进入门禁 2

**门禁 2: 影响性过滤**
- 仅保留"会改变 FR/AC/NFR 结果"的问题
- 不影响输出的问题 → 使用合理默认值，不问用户
- 影响输出的问题 → 进入门禁 3

**门禁 3: 优先级排序**
- 按风险排序：范围 > 安全 > 合规 > UX > 技术偏好
- 每轮最多 3 个问题
- 提供 2-3 个可执行候选答案（A/B/C）

**一问一答规则**:
1. 每次只问 1 个问题（禁止一次抛出多个问题）
2. 等待用户回答后，立即写入 `prd.md`
3. 继续下一个问题，直到所有 P0 问题解决

**问题格式**:
```
[NEEDS CLARIFICATION][类型] 问题描述？

候选答案：
A. [具体方案 A]
B. [具体方案 B]
C. [具体方案 C]

请选择 A/B/C，或提供其他方案。
```

**类型标签**: BOUNDARY/TERM/SEMANTIC/ERROR/PRIORITY/DEPENDENCY/METRIC/ROLE/TEMPORAL/DATA

**执行流程**:
1. 基于 Phase 0.2 质量报告，识别所有缺失项
2. 通过三道门禁过滤问题
3. 按优先级逐个提问（一问一答）
4. 每个答案立即写入 `prd.md`
5. 重新计算 C-PRD 评分
6. 评分 >= 85% → 进入用户确认；< 85% → 继续提问

**最大轮次**: 5 轮（每轮最多 3 问），超过 5 轮仍未达标 → 标记 `[BLOCKED]` 并停止

**输出**:
- `prd.md` 持续更新
- `findings.md` 记录所有问答
- C-PRD 评分变化轨迹

#### Phase 0.6: PRD 用户确认
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

## 宪法权威检查（P1-CON）

### P1.5: 宪法一致性检查

在 FR/AC 收敛后、进入 Step 7 前，必须执行宪法一致性检查：

1. 加载 `specs/{featureId}/constitution.md`
2. 逐条检查 FR/AC 是否违反宪法原则
3. 发现违反时，必须：
   - 标记 `[CONSTITUTION_VIOLATION]`
   - 输出违反的具体宪法条款
   - 给出可执行修改建议
4. 未完成修正或未获用户确认前，不得推进后续步骤

### 宪法违反示例

| FR/AC 内容 | 宪法条款 | 判定 |
|-----------|---------|------|
| “密码明文存储” | “敏感数据必须加密存储” | ❌ 违反 |
| “API 返回全量用户敏感字段” | “最小权限原则” | ❌ 违反 |
| “核心域模型使用 any 绕过类型约束” | “类型安全优先” | ❌ 违反 |

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
4. 注册所有 FR 到追踪矩阵（参考 `references/id-types-and-status.md`）
   - 使用 `spec-first id next FR <abbr> --feature <featureId>` 生成 FR ID
   - 使用 `spec-first matrix update <featureId> <id> --title "标题" --yes` 注册到矩阵
   - 注意：matrix update 需要 `--yes` 确认（policy=strict）

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

**Gate Check（Step 8 完成后立即执行）**:
```bash
spec-first gate check <featureId>
```

检查项：
- PRD 存在且 C-PRD ≥ 85%
- spec.md 存在
- FR 已注册到矩阵
- spec-review.md 存在（如需要）

**失败处理**：
- C-PRD < 85%：返回 Phase 0.3 修正 PRD
- 缺少文件：补齐后重新执行 gate check

**格式校验（P4 落盘后自动执行）**:
```bash
spec-first validate format <featureId>
```

- 检查 PRD 章节格式（1. 业务目标/2. 功能需求/3. 非功能需求）
- 检查 ID 格式（无多余连字符）
- 检查文件路径完整性
- 检查必需字段（Feature ID）
- 校验失败时阻断，需修复后重新确认

---

## findings.md 结构化状态头

路径：`specs/{featureId}/findings.md`

**必含字段**:
```yaml
---
current_step: "Step 3"
completed_steps: ["Phase 0.0", "Phase 0.1", "Phase 0.2", "Phase 0.3", "Phase 0.4", "Phase 0.5", "Phase 0.6", "Step 0", "Step 1", "Step 2"]
skipped_steps: []
next_step: "Step 4"
complexity: "Moderate"
scenario: "iteration"
last_updated: "2026-03-05T10:00:00Z"
quality_score: 92
---
```

**更新时机**:
- Phase 0.2 完成后更新 `quality_score` 和 `scenario`
- Phase 0.0 开始时创建
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
- `spec-first id next REQ <abbr> --feature <featureId>`
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
- Phase 0.0-0.6 全部完成
- `prd.md` 已生成，C-PRD >= 85%
- `spec.md` 已写入，包含所有 FR 定义和验收标准（AC）
- 所有 FR 已通过 `id next FR` 注册
- 所有 FR 至少有 1 条 `REQ-*` upstream 引用
- 所有 AC 使用统一 AC ID 规范
- `traceability-matrix.md` 已更新
- `findings.md` 包含完整 Phase 0.0-0.6 + Step 0-8 记录
- `gate check` 在 `01_specify` 阶段通过（含 G-SPEC-00 和 C-PRD 校验）

## 参考文档
- `references/spec-review-checklist.md`
- `references/test-level-glossary.md`
- `references/constitution-authority.md`
- `references/prd-template-greenfield.md`
- `references/prd-template-iteration.md`
- `references/adr-lite-template.md`

## 背景输入
- 背景质量字段与枚举遵循 `../shared/background-quality-contract.md`
- 优先读取 `spec-view`
- 建议从 `.spec-first/runtime/first/stage-views.json` 的 spec-view 获取摘要
- 执行前应显式声明 `background_input_status`
- 当背景不足时进入 `degraded` 降级模式，不得静默假设上下文完整
