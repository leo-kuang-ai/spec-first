# Phase 2.2: spec Skill 审查报告

**审查日期**: 2026-03-18
**Skill 名称**: spec (需求规格定义)
**版本**: v3.0.0
**优先级**: P0（核心工作流）
**审查状态**: ✅ **通过**（有改进建议）

---

## 执行摘要

### 审查覆盖
- **审查文件数**: 21 (SKILL.md + 20 references)
- **发现问题数**: 8 (P0: 0, P1: 3, P2: 5)
- **References 引用率**: 60% (12/20 被引用)

### 关键发现
1. **P1-1**: 7 个 references 文件未被 SKILL.md 引用（文档孤岛）
2. **P1-2**: spec.md 产物格式未明确定义
3. **P1-3**: FR ID 生成规则未明确

### 总体评级
- **流程完整性**: ⭐⭐⭐⭐⭐ (5/5)
- **文档完整性**: ⭐⭐⭐⭐ (4/5)
- **一致性**: ⭐⭐⭐⭐⭐ (5/5)
- **可执行性**: ⭐⭐⭐⭐ (4/5)

---

## 问题清单

### P1 问题（需修复）

#### [P1-1] References 文件未被 SKILL.md 引用
- **文件**: 7 个 references 文件未被 SKILL.md 引用
- **影响**: 文档孤岛，用户无法发现这些参考资料
- **未被引用的文件**:
  1. `complexity-classification.md` (与 `complexity-matrix.md` 重复)
  2. `convergence-qa-rules.md`
  3. `expansion-sweep-rules.md`
  4. `final-confirmation-template.md`
  5. `findings-state-header.md`
  6. `prd-extraction-prompt.md`
  7. `question-gate-rules.md`
- **整改建议**:
  - 在 SKILL.md 的"参考文档"章节补充引用，或
  - 删除冗余文件（如 `complexity-classification.md` 与 `complexity-matrix.md` 内容高度重复）
- **验证方法**:
  ```bash
  grep -r "convergence-qa-rules\|expansion-sweep-rules\|final-confirmation-template\|findings-state-header\|prd-extraction-prompt\|question-gate-rules" skills/spec-first/03-spec/SKILL.md
  # 预期：有输出
  ```

#### [P1-2] spec.md 产物格式未明确定义
- **文件**: `skills/spec-first/03-spec/SKILL.md`
- **位置**: 成功标准章节
- **问题**: 成功标准提到"spec.md 包含所有 FR/AC"，但未定义 spec.md 的必需章节结构
- **当前状态**:
  - PRD 有明确章节要求（1. 业务目标 / 2. 功能需求 / 3. 非功能需求）
  - spec.md 格式未定义
- **影响**:
  - AI 生成的 spec.md 格式可能不一致
  - 下游 design skill 无法依赖固定的章节结构
  - validators/ 无法校验 spec.md 格式
- **整改建议**:
  1. 在 SKILL.md 或 references 中补充 spec.md 模板定义
  2. 定义必需章节（如：1. 功能需求 FR / 2. 验收标准 AC / 3. 非功能需求 NFR / 4. 边界与约束）
  3. 在 `src/core/validators/` 中添加 spec.md 格式校验
- **验证方法**:
  ```bash
  # 检查是否有 spec.md 模板定义
  find skills/spec-first/03-spec/references -name "*spec*template*"
  ```

#### [P1-3] FR ID 生成规则未明确
- **文件**: `skills/spec-first/03-spec/SKILL.md`
- **位置**: 成功标准章节
- **问题**: 成功标准提到"所有 FR 已通过 `id next FR` 注册"，但未说明 FR ID 格式规则
- **当前状态**:
  - 引用了 `references/id-types-and-status.md`
  - 但 SKILL.md 未明确说明 FR ID 格式（如 `FR-<ABBR>-<NNN>`）
- **影响**:
  - AI 可能生成不符合规范的 FR ID
  - 追踪矩阵无法正确解析 FR ID
  - 覆盖率计算可能失败
- **整改建议**:
  1. 在 Step 6 或成功标准章节明确 FR ID 格式
  2. 补充示例：`FR-AUTH-001`, `FR-UIOPT-002`
  3. 说明 ABBR 的生成规则（从 Feature ID 提取或用户指定）
- **验证方法**:
  ```bash
  # 检查 id-types-and-status.md 是否定义了 FR ID 格式
  grep "FR-" skills/spec-first/03-spec/references/id-types-and-status.md
  ```

---

### P2 问题（改进建议）

#### [P2-1] 复杂度判定文件重复
- **文件**: `complexity-matrix.md` vs `complexity-classification.md`
- **问题**: 两个文件内容高度重复（都定义四档判定标准和执行路径）
- **影响**: 维护成本高，容易出现不一致
- **整改建议**:
  - 合并为一个文件，或
  - 明确区分用途（如 matrix 用于判定，classification 用于说明）
- **验证方法**:
  ```bash
  diff skills/spec-first/03-spec/references/complexity-matrix.md \
       skills/spec-first/03-spec/references/complexity-classification.md
  ```

#### [P2-2] AC 格式未明确定义
- **文件**: `skills/spec-first/03-spec/SKILL.md`
- **问题**: 成功标准提到"所有 AC 使用统一 AC ID 规范"，但未定义 AC 格式
- **影响**:
  - AC 可能无法自动转化为测试用例
  - 测试覆盖率计算困难
- **整改建议**:
  - 补充 AC 格式示例（如 Given-When-Then 或可自动转化为测试用例的格式）
  - 示例：`AC-FR-AUTH-001-01: Given 用户未登录, When 访问受保护页面, Then 重定向到登录页`

#### [P2-3] Step 1 合并说明不够清晰
- **文件**: `skills/spec-first/03-spec/references/steps-fr-ac-workflow.md`
- **问题**: Step 1 标记为"已合并到 Phase 0.2"，但 SKILL.md 的复杂度自适应表仍显示"Step 1 已合并"
- **影响**: 用户可能困惑 Step 1 的状态
- **整改建议**: 在 SKILL.md 的快速概览中明确说明 Step 1 已废弃

#### [P2-4] 隐含假设机制未在 references 中详细说明
- **文件**: `skills/spec-first/03-spec/SKILL.md` 第 84-95 行
- **问题**: SKILL.md 提到隐含假设清单机制（[ASSUMED] vs [NEEDS CLARIFICATION]），但未在 references 中详细说明
- **影响**: AI 可能不清楚如何正确使用这两个标记
- **整改建议**:
  - 在 `phase0-prd-workflow.md` 或新建 `assumption-tracking.md` 详细说明
  - 补充示例：何时使用 [ASSUMED]，何时使用 [NEEDS CLARIFICATION]

#### [P2-5] CLI 依赖列表不完整
- **文件**: `skills/spec-first/03-spec/SKILL.md`
- **问题**: CLI 依赖章节未列出所有依赖的 CLI 命令
- **当前列出**: `spec-first id next FR`, `spec-first gate check`
- **缺失**: `spec-first matrix sync`, `spec-first feature current`
- **整改建议**: 补全 CLI 依赖列表

---

## References 完整性检查

| 文件名 | 存在 | 被引用 | 状态 |
|--------|------|--------|------|
| phase0-prd-workflow.md | ✅ | ✅ | ✅ |
| steps-fr-ac-workflow.md | ✅ | ✅ | ✅ |
| complexity-matrix.md | ✅ | ✅ | ✅ |
| complexity-classification.md | ✅ | ❌ | ⚠️ 未引用（与 complexity-matrix.md 重复） |
| anti-rationalization-guards.md | ✅ | ✅ | ✅ |
| prd-extraction-prompt.md | ✅ | ❌ | ⚠️ 未引用 |
| quality-gates.md | ✅ | ✅ | ✅ |
| findings-state-header.md | ✅ | ❌ | ⚠️ 未引用 |
| cli-commands-reference.md | ✅ | ✅ | ✅ |
| spec-review-checklist.md | ✅ | ✅ | ✅ |
| test-level-glossary.md | ✅ | ✅ | ✅ |
| constitution-authority.md | ✅ | ✅ | ✅ |
| prd-template-greenfield.md | ✅ | ✅ | ✅ |
| prd-template-iteration.md | ✅ | ✅ | ✅ |
| adr-lite-template.md | ✅ | ✅ | ✅ |
| id-types-and-status.md | ✅ | ✅ | ✅ |
| convergence-qa-rules.md | ✅ | ❌ | ⚠️ 未引用 |
| expansion-sweep-rules.md | ✅ | ❌ | ⚠️ 未引用 |
| final-confirmation-template.md | ✅ | ❌ | ⚠️ 未引用 |
| question-gate-rules.md | ✅ | ❌ | ⚠️ 未引用 |

**统计**:
- 总文件数: 20
- 被引用: 12 (60%)
- 未被引用: 7 (35%)
- 重复文件: 1 (5%)

---

## 流程完整性评估

### Phase 0 (PRD): ✅ 完整
7 个子阶段（0.0-0.6）全部定义清晰：
- **Phase 0.0**: Feature 快速初始化（防信息丢失）
- **Phase 0.1**: 任务锚定
- **Phase 0.2**: 质量扫描 + 自动上下文收集（>= 40% 门禁）
- **Phase 0.3**: PRD 生成（文档提取 or 口述）
- **Phase 0.4**: PRD 自检（C-PRD >= 85% 门禁）
- **Phase 0.5**: PRD 补全对话（两道门禁 + 一问一答）
- **Phase 0.6**: PRD 用户确认

### Step 0-8 (FR/AC): ✅ 完整
9 个步骤全部定义：
- **Step 0**: 任务存在性检查
- **Step 1**: [已合并到 Phase 0.2]
- **Step 2**: 复杂度判定
- **Step 3**: 提问门禁（先推导再提问）
- **Step 4**: 调研模式（技术选型前调研）
- **Step 5**: 发散扫描（边界/失败场景/NFR）
- **Step 6**: 收敛确认（逐项确认 FR/AC）
- **Step 7**: ADR 决策记录（Complex 时）
- **Step 8**: 最终确认 + Gate Check

### 复杂度自适应: ✅ 合理
四档判定标准清晰：

| 复杂度 | 执行路径 |
|--------|---------|
| Trivial | Phase 0 + Step 0 + Step 2 + Step 8 |
| Simple | Phase 0 + Step 0 + Step 2-3 + Step 6 + Step 8 |
| Moderate | Phase 0 + Step 0 + Step 2-6 + Step 8（可选 Step 7） |
| Complex | Phase 0 + Step 0 + Step 2-8 |

### 质量门禁: ✅ 可执行
- **Phase 0.2**: 质量扫描门禁（>= 40%）
- **Phase 0.4**: PRD 自检门禁（C-PRD >= 85%）
- **Step 8**: Gate Check 门禁（所有产物完整性）

---

## 一致性检查

### 与 truth-source.ts 一致性
- ✅ **Stage 要求一致**: spec/spec-review 均要求 01_specify 阶段
- ✅ **SKILL_STAGE_REQUIREMENTS 一致**:
  ```typescript
  spec: '01_specify',
  'spec-review': '01_specify',
  ```

### 与 SHARED.md 一致性
- ✅ **P0-P5 执行模型**: 遵守产物生成型 skill 的默认流程
- ✅ **字面即精神原则**: 引用了 anti-rationalization-guards.md
- ✅ **反合理化守卫**: spec 专属守卫表完整
- ✅ **2-Action Rule**: Phase 0.2 和 Step 5 后必须更新 findings.md
- ✅ **Handoff Next Steps**: 成功标准中明确下一步命令

### 与 orchestrate skill-mapping 一致性
- ✅ **无冲突**: orchestrate 的 Stage → Skill 映射中，01_specify → 03-spec

---

## 设计亮点

1. **Progressive Disclosure 重构成功**: v3.0.0 精简到 ~260 行，核心流程清晰
2. **Phase 0 防信息丢失机制**: Phase 0.0 立即创建 Feature，避免对话中断导致信息丢失
3. **复杂度自适应跳过规则**: 四档判定标准清晰，执行路径合理
4. **质量门禁分层**: Phase 0.2 (40%) → Phase 0.4 (85%) → Step 8 (Gate Check)，逐步提升质量要求
5. **隐含假设清单机制**: [ASSUMED] vs [NEEDS CLARIFICATION] 标记，避免静默假设
6. **Question Gate 两道门禁**: 影响性过滤 + 优先级排序，避免无效提问
7. **一问一答策略**: 默认每次只问 1 个问题，提供 2-3 个候选答案，提升交互质量

---

## 改进建议优先级

### 立即修复（P1）
1. **补充 spec.md 产物格式定义** — 预计 1 小时
   - 在 references 中新建 `spec-template.md`
   - 定义必需章节结构
   - 在 SKILL.md 中引用
2. **明确 FR ID 生成规则** — 预计 30 分钟
   - 在 Step 6 或成功标准章节补充 FR ID 格式示例
   - 说明 ABBR 的生成规则
3. **处理未引用的 references 文件** — 预计 1 小时
   - 在 SKILL.md 引用有价值的文件
   - 删除或合并重复文件

### 建议改进（P2）
1. **合并复杂度判定文件** — 预计 30 分钟
2. **补充 AC 格式示例** — 预计 30 分钟
3. **详细说明隐含假设机制** — 预计 1 小时
4. **明确 Step 1 已废弃** — 预计 15 分钟
5. **补全 CLI 依赖列表** — 预计 15 分钟

**总预计工时**: 5 小时

---

## 总体评价

### 优势
- ✅ 流程设计完整，Phase 0 + Step 0-8 覆盖从 PRD 到 FR/AC 的全流程
- ✅ 复杂度自适应机制合理，四档判定标准清晰
- ✅ 质量门禁分层清晰，逐步提升质量要求
- ✅ 与 truth-source.ts 和 SHARED.md 一致性良好
- ✅ Progressive Disclosure 重构成功，文档精简易读
- ✅ 防信息丢失机制设计巧妙
- ✅ Question Gate 两道门禁避免无效提问

### 不足
- ⚠️ 部分 references 文件未被引用，存在文档孤岛
- ⚠️ spec.md 产物格式未明确定义
- ⚠️ FR ID 和 AC 格式规则未明确
- ⚠️ 部分文件内容重复

### 结论
spec skill 的需求规格定义流程完整性良好，核心流程清晰可执行，质量门禁合理。建议修复 P1 问题后即可投入使用。

---

## 附录

### 关键文件路径
- SKILL.md: `/Users/kuang/xiaobu/spec-first/skills/spec-first/03-spec/SKILL.md`
- References: `/Users/kuang/xiaobu/spec-first/skills/spec-first/03-spec/references/`
- Truth Source: `/Users/kuang/xiaobu/spec-first/src/core/rules/truth-source.ts`

### 验证命令
```bash
# 检查 references 引用情况
cd /Users/kuang/xiaobu/spec-first
for file in skills/spec-first/03-spec/references/*.md; do
  filename=$(basename "$file")
  if grep -q "$filename" skills/spec-first/03-spec/SKILL.md; then
    echo "✅ $filename"
  else
    echo "❌ $filename"
  fi
done

# 检查 spec.md 模板是否存在
find skills/spec-first/03-spec/references -name "*spec*template*"

# 检查 FR ID 格式定义
grep "FR-" skills/spec-first/03-spec/references/id-types-and-status.md
```
