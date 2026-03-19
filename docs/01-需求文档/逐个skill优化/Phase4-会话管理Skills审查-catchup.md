# Phase 4.1: catchup Skill 审查报告

**审查日期**: 2026-03-18
**Skill 名称**: catchup (会话恢复)
**版本**: v1.1.0
**优先级**: P1（Tier 1 关键路径）
**审查状态**: ❌ **不通过** — 存在 2 个 P0 阻断问题

---

## 执行摘要

### 审查覆盖
- **审查文件数**: 4 (SKILL.md + 3 references)
- **发现问题数**: 8 (P0: 2, P1: 3, P2: 3)

### 关键发现
1. **P0-1**: 缺少 Skill 类型声明与 P0-P5 例外说明
2. **P0-2**: confirm_policy 字段缺失
3. **P1-1**: 执行阶段 P0-P5 与 SHARED.md 定义冲突
4. **P1-2**: 缺少与 SHARED.md 一致性声明
5. **P1-3**: findings.md 写入时机不明确

### 总体评级
- **流程完整性**: ⭐⭐⭐⭐⭐ (5/5)
- **文档完整性**: ⭐⭐⭐ (3/5)
- **一致性**: ⭐⭐ (2/5)
- **可执行性**: ⭐⭐⭐⭐ (4/5)

---

## 问题清单

### P0 问题（阻断性）

#### [P0-1] 缺少 Skill 类型声明与 P0-P5 例外说明
- **文件**: `skills/spec-first/02-catchup/SKILL.md`
- **证据**:
  - SHARED.md L128-136 定义了 Skill 类型例外表，catchup 属于"路由控制型"
  - SHARED.md L134 说明："路由控制型 Skill 不强制套用 `id next` 或产物生成流程"
  - 但 catchup SKILL.md 未在任何章节声明其 Skill 类型
  - 未说明是否遵循默认 P0-P5 执行模型
- **影响**:
  - AI 可能误认为 catchup 需要遵循产物生成型流程
  - 可能尝试执行 P4_WRITE（写入交付物）和 P5_SIDE_EFFECT（注册 ID）
  - 违反 SHARED.md 的统一约束
- **整改建议**:
  1. 在 SKILL.md 增加"Skill 类型"章节
  2. 明确声明：catchup 属于"路由控制型"
  3. 说明：不遵循默认 P0-P5 执行模型，使用自定义的信息源优先级（Priority-0/1/2）
  4. 引用 SHARED.md L128-136 的 Skill 类型例外表
- **验证方法**:
  ```bash
  grep -i "skill.*type\|类型" skills/spec-first/02-catchup/SKILL.md
  # 预期：有输出
  ```

#### [P0-2] confirm_policy 字段缺失
- **文件**: `skills/spec-first/02-catchup/SKILL.md:1-34`
- **证据**:
  - YAML frontmatter 包含：name, description, version, last_updated, changelog, user-invocable, allowed-tools, hooks, metadata
  - 但缺少 `confirm_policy` 字段
  - 虽然正文第 439 行有"推荐: assisted"，但元数据不完整
- **影响**:
  - AI runtime 无法通过机器解析获取确认策略
  - 可能默认使用 auto 策略，跳过用户确认
  - 与 SHARED.md L139-149 的确认策略定义不一致
- **整改建议**:
  1. 在 YAML frontmatter 增加 `confirm_policy: assisted`
  2. 或在"确认策略"章节明确说明：catchup 使用 assisted 策略
- **验证方法**:
  ```bash
  grep "confirm_policy" skills/spec-first/02-catchup/SKILL.md
  # 预期：有输出
  ```

---

### P1 问题（重要）

#### [P1-1] 执行阶段 P0-P5 与 SHARED.md 定义冲突
- **文件**: `skills/spec-first/02-catchup/SKILL.md:200-250`
- **证据**:
  - catchup 的 P0-P5 是"信息源优先级"：
    - P0: `.spec-first/current`
    - P1: `specs/{featureId}/stage-state.json`
    - P2: `specs/{featureId}/task_plan.md`
    - P3: `specs/{featureId}/findings.md`
    - P4: `git log`
    - P5: 用户输入
  - SHARED.md L96-124 的 P0-P5 是"执行阶段"：
    - P0_LOCATE: 定位与校验
    - P1_CONTEXT: 上下文加载
    - P2_GENERATE: AI 推理生成
    - P3_CONFIRM: 用户确认
    - P4_WRITE: 写入交付物
    - P5_SIDE_EFFECT: 副作用执行
- **影响**:
  - 相同标记但语义完全不同，造成严重混淆
  - AI 可能误解 catchup 的执行流程
  - 违反 SHARED.md 的统一约束
- **整改建议**:
  1. 将 catchup 的信息源优先级改用不同标记（Priority-0/1/2 或 Tier-0/1/2）
  2. 或在"信息源优先级"章节明确说明：这里的 P0-P5 与 SHARED.md 的执行阶段 P0-P5 不同
  3. 推荐使用 Priority-0/1/2 避免混淆
- **验证方法**:
  ```bash
  grep -E "P[0-5]:" skills/spec-first/02-catchup/SKILL.md | head -10
  ```

#### [P1-2] 缺少与 SHARED.md 一致性声明
- **文件**: `skills/spec-first/02-catchup/SKILL.md`
- **证据**:
  - catchup SKILL.md 包含"字面即精神原则"章节（L46-58）
  - 包含"反合理化守卫"章节（L59-70）
  - 但这些内容与 SHARED.md L11-25 高度重复
  - 未明确声明与 SHARED.md 的关系
- **影响**:
  - 违背 SHARED.md 消除 25% 重复的设计初衷
  - 维护成本高，容易出现不一致
  - 未明确声明遵守哪些 SHARED.md 约束
- **整改建议**:
  1. 删除 catchup SKILL.md 中的"字面即精神原则"和"反合理化守卫"章节
  2. 增加"统一约束"章节，引用 SHARED.md
  3. 明确声明：catchup 遵守 SHARED.md 的字面即精神原则、反合理化守卫、文件系统即外部记忆、Handoff Next Steps
- **验证方法**:
  ```bash
  grep -i "SHARED.md\|统一约束" skills/spec-first/02-catchup/SKILL.md
  # 预期：有输出
  ```

#### [P1-3] findings.md 写入时机不明确
- **文件**: `skills/spec-first/02-catchup/SKILL.md`
- **证据**:
  - L439 说明："推荐: assisted"（确认策略）
  - SHARED.md L145 说明："assisted 和 strict 的 Skill 在用户拒绝时必须回退至 P2 重新生成"
  - 但 catchup SKILL.md 未明确说明：
    - 用户拒绝确认时是否写入 findings.md
    - 写入完整报告还是摘要
    - 是否需要标记"用户拒绝"状态
- **影响**:
  - 用户拒绝后的行为不明确
  - findings.md 可能包含未确认的内容
  - 与 assisted 确认策略的行为定义不一致
- **整改建议**:
  1. 在"确认策略"章节补充用户拒绝时的行为
  2. 说明：用户拒绝时不写入 findings.md，回退至信息收集阶段
  3. 说明：用户确认后写入完整的 6 步恢复报告
- **验证方法**:
  ```bash
  grep -A 5 "用户拒绝\|reject" skills/spec-first/02-catchup/SKILL.md
  ```

---

### P2 问题（改进建议）

#### [P2-1] 恢复报告模板与实际执行步骤编号冲突
- **文件**: `skills/spec-first/02-catchup/SKILL.md`
- **证据**:
  - L96-150 定义了"6 步标准格式"（Step 1-6）
  - L200-250 定义了"信息源优先级"（P0-P5）
  - L300-400 定义了"执行步骤"（Step 1-8）
  - 三个编号体系混用，容易混淆
- **影响**:
  - AI 可能混淆"报告结构"与"执行步骤"
  - 用户可能不清楚当前在哪个步骤
- **整改建议**:
  1. 统一编号体系：报告结构使用 Section 1-6，执行步骤使用 Step 1-8
  2. 或明确区分：报告结构（Output Step 1-6）vs 执行步骤（Execution Step 1-8）

#### [P2-2] 5-Question 框架缺少失败处理示例
- **文件**: `skills/spec-first/02-catchup/SKILL.md:150-200`
- **证据**:
  - L150-200 定义了 5-Question 框架
  - 但未提供信息缺失场景的完整示例
  - 未说明如何处理"无法回答某个问题"的情况
- **影响**:
  - AI 可能在信息不足时强行回答
  - 恢复报告质量可能不达标
- **整改建议**:
  1. 在 references 中补充"信息缺失场景示例"
  2. 说明：无法回答时标记 [信息缺失]，并给出补齐方案

#### [P2-3] hooks 配置缺少实际执行机制说明
- **文件**: `skills/spec-first/02-catchup/SKILL.md:12-30`
- **证据**:
  - YAML frontmatter 定义了 hooks 配置（PreToolUse, PostToolUse, Stop）
  - 但未说明这些 hooks 如何被执行
  - 未说明 hooks 是否由 AI runtime 自动触发
- **影响**:
  - 用户可能不清楚 hooks 的作用
  - AI 可能不清楚何时触发 hooks
- **整改建议**:
  1. 在"hooks 配置"章节补充执行机制说明
  2. 说明：hooks 由 AI runtime 自动触发，用于提醒和检查点

---

## 完整性评估

### 恢复报告模板: ✅ 完整
6 步结构清晰：
1. **当前状态快照**: Feature ID, Stage, 最近 commit
2. **最近活动摘要**: 最近 3 次会话的关键动作
3. **阻塞项识别**: 当前阻塞项及原因
4. **上下文缺口**: 缺失的关键信息
5. **5-Question 回答**: 5 个核心问题的答案
6. **下一步建议**: 具体的下一步命令

### 5-Question 框架: ✅ 完整
5 个问题都有详细定义：
- **Q1**: 我们在做什么？（Feature 目标）
- **Q2**: 当前进度如何？（Stage + 完成度）
- **Q3**: 有什么阻塞？（阻塞项 + 原因）
- **Q4**: 缺少什么信息？（信息缺口）
- **Q5**: 下一步是什么？（具体命令）

### 上下文恢复策略: ✅ 完整
信息源优先级明确（P0-P5）：
- **P0**: `.spec-first/current` (最高优先级)
- **P1**: `stage-state.json`
- **P2**: `task_plan.md`
- **P3**: `findings.md`
- **P4**: `git log`
- **P5**: 用户输入

### 信息缺口处理: ✅ 完整
5 种缺口类型都有补齐方案：
1. **Feature 不存在**: 建议执行 `spec-first init`
2. **Stage 不明确**: 建议执行 `spec-first stage current`
3. **Task 状态不清**: 建议执行 `spec-first status`
4. **Findings 缺失**: 建议补充 findings.md
5. **Git 历史不完整**: 建议查看 git log

---

## 与 SHARED.md 一致性检查

| 检查项 | 状态 | 说明 |
|--------|------|------|
| Skill 类型声明 | ❌ | 缺少"路由控制型"声明 |
| P0-P5 例外说明 | ❌ | 未说明不遵循默认执行模型 |
| confirm_policy | ❌ | YAML frontmatter 缺失 |
| 字面即精神原则 | ⚠️ | 有但重复 SHARED.md |
| 反合理化守卫 | ⚠️ | 有但重复 SHARED.md |
| 文件系统即外部记忆 | ✅ | 遵守 |
| Handoff Next Steps | ✅ | 遵守（Step 6 包含下一步建议） |

---

## 设计亮点

1. **6 步恢复报告模板**: 结构清晰，覆盖全面
2. **5-Question 框架**: 核心问题明确，易于执行
3. **信息源优先级**: P0-P5 优先级清晰，降级策略合理
4. **信息缺口处理**: 5 种缺口类型都有补齐方案
5. **hooks 配置**: PreToolUse/PostToolUse/Stop 三层检查点
6. **反合理化守卫**: 5 条守卫规则，防止 AI 跳过恢复流程

---

## 改进建议优先级

### 立即修复（P0）
1. 增加 Skill 类型声明与 P0-P5 例外说明
2. 在 YAML frontmatter 增加 `confirm_policy: assisted`

### 近期修复（P1）
3. 将信息源优先级改用不同标记（Priority-0/1/2 或 Tier-0/1/2）
4. 增加"统一约束"章节，明确与 SHARED.md 的关系
5. 明确 findings.md 写入时机与格式

### 改进优化（P2）
6. 统一"执行步骤"与"报告结构"的编号体系
7. 增加信息缺失场景的完整示例
8. 补充 hooks 执行机制说明

---

## 总体评价

**优势**: 恢复报告模板完整，5-Question 框架清晰，信息源优先级合理，信息缺口处理完善，hooks 配置细致。

**不足**: 缺少 Skill 类型声明，confirm_policy 字段缺失，P0-P5 术语与 SHARED.md 冲突，部分内容重复 SHARED.md，findings.md 写入时机不明确。

**结论**: catchup skill 的会话恢复机制设计完整，但与 SHARED.md 的一致性不足。建议修复 P0 和 P1 问题后再投入使用。

---

## 关键文件路径
- `/Users/kuang/xiaobu/spec-first/skills/spec-first/02-catchup/SKILL.md`
- `/Users/kuang/xiaobu/spec-first/skills/spec-first/02-catchup/references/catchup-report-template.md`
- `/Users/kuang/xiaobu/spec-first/skills/spec-first/02-catchup/references/context-recovery-guide.md`
- `/Users/kuang/xiaobu/spec-first/skills/spec-first/02-catchup/references/reboot-test-checklist.md`
