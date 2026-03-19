# Step 0-8: FR/AC 定义流程

本文档详细说明 Step 0-8 的执行流程，用于生成功能需求（FR）和验收标准（AC）。

---

## Step 0: Ensure Task Exists (ALWAYS)

**目标**: 确认 Feature 已初始化，工作区完整。

**执行**:
1. 检查 `specs/{featureId}/` 目录存在
2. 检查 `stage-state.json` 阶段为 `01_specify`
3. 检查 `constitution.md` 存在
4. 检查 `traceability-matrix.md` 存在

**输出**:
- `findings.md` 记录 Step 0 完成

---

## Step 1: [已合并到 Phase 0.2]

此步骤的功能已合并到 Phase 0.2，不再单独执行。

**原功能**: 自动收集上下文（读取 PRD、constitution、扫描仓库、识别依赖）

**现状**: 这些功能已在 Phase 0.2 的 "Step 2: 自动上下文收集" 中完成。

---

## Step 2: Classify Complexity (复杂度校准)

**目标**: 基于 PRD 内容校准复杂度判定，决定后续执行深度。

**执行**:
1. 回顾 Phase 0.2 的初步复杂度判定
2. 基于 PRD 内容补充判定维度：
   - 歧义点数量（扫描 PRD 中的未定义术语/多解语义/缺失边界）
   - 方案分支数（关键词：或者/可选/待定/考虑）
3. 综合判定最终复杂度档位（多维取最高档）

**四档判定标准**（多维取最高档）:

| 档位 | 受影响文件数 | 歧义点数量 | 方案分支数 | 外部依赖 | 典型特征 |
|------|------------|----------|----------|---------|---------|
| Trivial | ≤1 | 0 | 1 | 无 | 单文件微调、文案修改、配置变更 |
| Simple | 2-3 | 1-2 | 1 | 无或已明确 | 单模块功能、清晰边界、无架构影响 |
| Moderate | 4-8 | 3-5 | 2 | 1-2 个 | 跨模块协作、存在技术选型、需轻量调研 |
| Complex | ≥9 | ≥6 | ≥3 | ≥3 个 | 架构级变更、多方案权衡、需深度调研 |

**判定流程**:
1. 回顾 Phase 0.2 的初步判定（受影响文件数、外部依赖数量）
2. 基于 PRD 补充判定：
   - 识别歧义点数量（扫描 PRD 中的未定义术语/多解语义/缺失边界）
   - 检测方案分支数（关键词：或者/可选/待定/考虑）
3. 综合判定最终档位，边界情况向上取整
4. 若与 Phase 0.2 初步判定不一致，记录校准理由

**四档对应执行深度**:
- `Trivial`: Phase 0 + Step 0 + Step 2 + Step 8（跳过 Step 3-7）
- `Simple`: Phase 0 + Step 0 + Step 2-3 + Step 6 + Step 8（跳过 Step 4-5, 7）
- `Moderate`: Phase 0 + Step 0 + Step 2-6 + Step 8（跳过 Step 7）
- `Complex`: Phase 0 + Step 0 + Step 2-8 全量执行

**输出**:
- `findings.md` 记录复杂度档位与判定依据
- 更新 `findings.md` 状态头 `complexity` 字段

---

## Step 3: Question Gate (Ask ONLY high-value questions)

**目标**: 先判断可推导再提问，避免无效提问。

**执行**:
1. 检查 Phase 0.2 收集的上下文是否足够回答当前歧义
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

## Step 4: Research-first Mode (Mandatory for technical choices)

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

## Step 5: Expansion Sweep (DIVERGE)

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

## Step 6: Q&A Loop (CONVERGE)

**目标**: 收敛确认，逐项确认 FR/AC。

**执行**:
1. 基于 PRD + Step 2-5 的发现，生成 FR 列表
2. 每个 FR 生成 AC（使用 AC ID 规范）
3. **分组呈现 + 逐组确认**（借鉴 brainstorming）:
   - 按模块/功能域分组（如：认证模块、数据模块、UI 模块）
   - 每组包含 2-4 个相关 FR
   - 每组提供设计权衡说明（为什么这样设计/有哪些替代方案）
   - 用户确认一组后再呈现下一组
4. 用户确认后写入 `spec.md`

**确认策略**:
- **默认：一次一个 FR**（推荐）
  - 呈现 1 个 FR + 其所有 AC
  - 说明设计理由和权衡
  - 用户确认后再呈现下一个
- **可选：分组批量**（效率优先）
  - 独立 FR 可批量确认（2-3 个）
  - 依赖 FR 必须串行确认
  - FR 确认后再确认其 AC
- 允许用户修订，修订后重新确认

**AC ID 规范**:
- 命名：`AC-<ABBR>-<FRSEQ>-<NN>`
- 示例：`FR-AUTH-001` 下的第 1 条 AC 为 `AC-AUTH-001-01`
- 约束：一个 AC ID 只能映射一条可验证断言

**输出**:
- `spec.md` 完整 FR/AC 列表
- `findings.md` 记录确认过程

---

## 宪法权威检查（P1.5）

在 FR/AC 收敛后、进入 Step 7 前，必须执行宪法一致性检查：

**执行**:
1. 加载 `specs/{featureId}/constitution.md`
2. 逐条检查 FR/AC 是否违反宪法原则
3. 发现违反时，必须：
   - 标记 `[CONSTITUTION_VIOLATION]`
   - 输出违反的具体宪法条款
   - 给出可执行修改建议
4. 未完成修正或未获用户确认前，不得推进后续步骤

**宪法违反示例**:

| FR/AC 内容 | 宪法条款 | 判定 |
|-----------|---------|------|
| "密码明文存储" | "敏感数据必须加密存储" | ❌ 违反 |
| "API 返回全量用户敏感字段" | "最小权限原则" | ❌ 违反 |
| "核心域模型使用 any 绕过类型约束" | "类型安全优先" | ❌ 违反 |

---

## Step 7: Propose Approaches + Record Decisions

**目标**: 记录技术决策，生成 ADR-lite。

**触发条件**:
- 复杂度为 Complex 或 Moderate（扩展到 Moderate）
- 存在多个技术方案需要权衡

**执行**:
1. 列出候选方案（至少 2 个，最多 3 个）
2. 对比方案优劣（性能/成本/复杂度/风险）
3. **说明权衡理由**（借鉴 brainstorming）:
   - 每个方案的适用场景
   - 选择该方案的优势
   - 放弃其他方案的原因
4. 记录决策依据
5. 生成 ADR-lite 文档

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
- 复杂度为 Trivial 或 Simple
- 无多方案权衡需求
- 跳过时必须在 `findings.md` 记录 `Step 7: SKIPPED — 无需 ADR`

**注**: Moderate 复杂度时，若存在明显的技术选型分歧，建议执行 Step 7

---

## Step 8: Final Confirmation + Implementation Plan

**目标**: 最终确认包，生成实施计划。

**执行**:

### 1. 生成确认包

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

### 2. 向用户展示确认包

### 3. 用户确认后生成实施计划

### 4. 注册所有 FR 到追踪矩阵

使用以下 CLI 命令：
```bash
spec-first id next FR <abbr> --feature <featureId>
spec-first matrix update <featureId> <id> --title "标题" --yes
```

**注意**:
- matrix update 需要 `--yes` 确认（policy=strict）
- 串行执行 matrix 操作，避免并行失败

**错误处理**:
- ID 生成失败: 检查 Feature 存在性 → 检查 ABBR 格式 → 重试 1 次 → 失败则标记 `[CLI_ERROR]` 并请求用户介入
- Matrix 更新失败: 检查 ID 冲突 → 使用 `--force` 覆盖 → 重试 1 次 → 失败则标记 `[CLI_ERROR]` 并请求用户介入
- 网络超时: 等待 5 秒重试 → 最多 3 次 → 失败则标记 `[CLI_ERROR]` 并请求用户介入
- **阻断规则**: 不得跳过注册，所有 FR 必须成功注册后才能执行 gate check

### 5. 执行 Gate Check（阻断门禁）

```bash
spec-first gate check <featureId>
```

**检查项**:
- PRD 存在且 C-PRD ≥ 85%
- spec.md 存在且包含所有 FR/AC
- FR 已注册到追溯矩阵
- spec-review.md 存在（如需要）

**失败处理**:
- C-PRD < 85%: 返回 Phase 0.3 修正 PRD，重新执行 Phase 0.4-0.6
- 缺少文件: 补齐后重新执行 gate check
- FR 未注册: 执行注册后重新执行 gate check
- **不得跳过 gate check 进入下一阶段**

**通过后**:
- 记录 gate check 通过时间到 `findings.md`
- 提示用户："Gate check 通过，可执行 /spec-first:design，或由 /spec-first:orchestrate 执行后续推进"
- `gate check` 只负责校验；阶段推进由 `stage advance` 或 `orchestrate` 负责

**输出**:
- `spec.md` 最终版本
- `traceability-matrix.md` 注册所有 FR
- `findings.md` 记录 Step 8 完成 + gate check 通过

**格式校验**（落盘后自动执行）:
```bash
spec-first validate format <featureId>
```

检查项：
- PRD 章节格式（1. 业务目标/2. 功能需求/3. 非功能需求）
- ID 格式（无多余连字符）
- 文件路径完整性
- 必需字段（Feature ID）
- 校验失败时阻断，需修复后重新确认

---

## findings.md 结构化状态头

路径：`specs/{featureId}/findings.md`

**必含字段**:
```yaml
---
current_step: "Step 3"
skipped_steps: []
complexity: "Moderate"
scenario: "iteration"
last_updated: "2026-03-05T10:00:00Z"
quality_score: 92
---
```

**更新时机**:
- Phase 0.2 完成后更新 `quality_score` 和 `scenario`
- Phase 0.0 开始时创建
- 每个 Step 完成后更新 `current_step`
- 跳过 Step 时更新 `skipped_steps`
- Step 8 完成后归档
