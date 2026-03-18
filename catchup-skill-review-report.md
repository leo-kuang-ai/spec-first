# Phase 4.1: catchup Skill 审查结果

**审查时间**: 2026-03-18
**审查版本**: catchup v1.1.0
**审查范围**: SKILL.md + 3 references

---

## 审查摘要

- **审查文件数**: 4 (SKILL.md + 3 references)
- **发现问题数**: 8 (P0: 2, P1: 3, P2: 3)
- **审查状态**: ❌ 不通过（存在 P0 级别问题）

---

## 问题清单

### P0 级别问题（阻塞性缺陷）

#### P0-1: 缺少 Skill 类型声明与 P0-P5 例外说明

**位置**: `SKILL.md` 元数据区域

**问题描述**:
- catchup 属于"路由控制型" Skill，但 SKILL.md 中未明确声明其 Skill 类型
- 未声明对 SHARED.md 中 P0-P5 默认执行模型的例外情况
- SHARED.md 明确要求："路由型、只读诊断型和宿主修复型 skill 必须在各自 `SKILL.md` 中声明例外"

**影响**:
- AI 可能误认为 catchup 需要遵循产物生成型的 P0-P5 流程
- 与 SHARED.md 的 Skill 类型例外表不一致
- 缺少明确的执行模型边界定义

**修复建议**:
在 SKILL.md 的元数据区域或"执行阶段"章节前增加：

```markdown
## Skill 类型声明

**类型**: 路由控制型

**P0-P5 例外说明**:
- 本 Skill 不遵循 SHARED.md 中产物生成型的默认 P0-P5 执行模型
- 采用自定义的 P0-P5 流程（见"执行阶段"章节）
- P3_CONFIRM: 采用 assisted 策略（见"确认策略"章节）
- P4_WRITE: 仅写入运行态文件（findings.md），不写入 Feature 交付物
- stage advance: 不允许（仅 orchestrate 允许）
```

---

#### P0-2: confirm_policy 字段缺失

**位置**: `SKILL.md` 元数据区域（YAML frontmatter）

**问题描述**:
- SHARED.md 定义了三种确认策略：auto / assisted / strict
- catchup SKILL.md 第 439 行有"推荐: assisted"，但元数据区域缺少 `confirm_policy` 字段
- 其他 Skill（如 orchestrate）在元数据中明确声明了 confirm_policy

**影响**:
- 元数据不完整，无法通过机器解析获取确认策略
- 与其他 Skill 的元数据规范不一致
- AI runtime 可能无法正确识别确认策略

**修复建议**:
在 YAML frontmatter 中增加：

```yaml
confirm_policy: assisted
```

---

### P1 级别问题（重要缺陷）

#### P1-1: 执行阶段 P0-P5 与 SHARED.md 定义冲突

**位置**: `SKILL.md` 第 419-424 行

**问题描述**:
- catchup 定义的 P0-P5 是"信息源优先级"（P0=`.spec-first/current`, P1=`stage-state.json`...）
- SHARED.md 定义的 P0-P5 是"执行阶段"（P0_LOCATE, P1_CONTEXT, P2_GENERATE...）
- 两者使用相同的标记（P0-P5）但语义完全不同，造成混淆

**影响**:
- AI 可能混淆"信息源优先级"与"执行阶段"
- 与 SHARED.md 的统一术语体系冲突
- 降低文档可读性和可维护性

**修复建议**:
将信息源优先级改用不同的标记体系，例如：
- P0 → **Priority-0** 或 **Tier-0**
- P1 → **Priority-1** 或 **Tier-1**
- 或直接使用"高/中/低"优先级标记

同时在"执行阶段"章节明确说明：
```markdown
## 执行阶段

本 Skill 采用自定义流程，不遵循 SHARED.md 的 P0-P5 默认模板：

- **Step 0**: 定位 Feature（读取 `.spec-first/current`）
- **Step 1**: 加载上下文（按优先级读取文件）
- **Step 2**: 识别信息缺口
- **Step 3**: 生成恢复报告
- **Step 4**: 执行 5-Question Test
- **Step 5**: 写入 findings.md（需用户确认）
```

---

#### P1-2: 缺少与 SHARED.md 一致性声明

**位置**: `SKILL.md` 全文

**问题描述**:
- SHARED.md 定义了多项统一约束（字面即精神、文件系统即外部记忆、2-Action Rule、Handoff Next Steps 等）
- catchup SKILL.md 中部分重复了这些规则（如字面即精神、反合理化守卫），但未明确声明与 SHARED.md 的关系
- 缺少"本 Skill 遵守 SHARED.md 的以下约束"的明确声明

**影响**:
- 规则重复导致维护成本增加（SHARED.md 更新时需同步修改）
- 未明确声明的约束（如 2-Action Rule、Handoff Next Steps）可能被忽略
- 与 SHARED.md 的设计初衷（消除 25% 重复）不一致

**修复建议**:
在 SKILL.md 开头增加：

```markdown
## 统一约束

本 Skill 遵守 `SHARED.md` 的以下约束：
- ✅ 字面即精神原则（Literal is Spirit）
- ✅ 文件系统即外部记忆（Filesystem as External Memory）
- ✅ 2-Action Rule（每 2 个关键动作后更新 findings.md）
- ✅ Handoff Next Steps（输出时必须提供下一步命令）
- ⚠️ P0-P5 执行模型：采用自定义流程（见"Skill 类型声明"）

详细规则见 `skills/spec-first/SHARED.md`。
```

---

#### P1-3: findings.md 写入时机不明确

**位置**: `SKILL.md` 第 435-447 行

**问题描述**:
- "输出路径"章节说明写入 `specs/{featureId}/findings.md`
- "成功标准"第 5 条说"用户确认后恢复摘要已追加到 `findings.md`"
- 但未明确说明：
  1. 是否每次执行 catchup 都必须写入 findings.md？
  2. 如果用户拒绝确认，是否仍需写入？
  3. 写入的是完整的 6 步报告还是摘要？

**影响**:
- AI 可能在用户未确认时就写入 findings.md
- 或者在用户确认后不写入，导致上下文丢失
- 与 assisted 确认策略的行为不一致

**修复建议**:
在"确认策略"章节明确说明：

```markdown
## 确认策略

- **策略**: assisted
- **行为**:
  1. 生成 6 步恢复报告后，展示摘要供用户审阅
  2. 用户确认后，将完整报告追加到 `specs/{featureId}/findings.md`
  3. 用户拒绝时，不写入 findings.md，根据反馈重新生成
  4. 用户修改后，写入修改后的版本
- **写入格式**:
  - 使用 H2 标题：`## Context Recovery Report - {timestamp}`
  - 包含完整的 6 步报告 + 5-Question 回答
```

---

### P2 级别问题（改进建议）

#### P2-1: 恢复报告模板与实际执行步骤不一致

**位置**: `catchup-report-template.md` vs `SKILL.md` 第 419-424 行

**问题描述**:
- SKILL.md 定义的执行阶段是 P0-P5（6 个步骤）
- catchup-report-template.md 定义的报告结构是 6 步（Feature 信息、任务进度、最近发现、文件完整性、风险识别、建议下一步）
- 两者的"6 步"含义不同，但都使用数字编号，容易混淆

**影响**:
- AI 可能混淆"执行步骤"与"报告结构"
- 降低文档一致性

**修复建议**:
- 将报告结构的"6 步"改为"6 个章节"或使用不同的编号体系
- 或在 SKILL.md 中明确说明："执行阶段 P0-P5"与"恢复报告 6 步结构"是两个不同的概念

---

#### P2-2: 5-Question 框架缺少失败处理示例

**位置**: `reboot-test-checklist.md`

**问题描述**:
- 每个 Question 都定义了"失败处理"和"常见失败原因"
- 但 catchup-report-template.md 的示例中，所有 5 个 Question 都是"✅ 已回答"
- 缺少"部分 Question 无法回答"的完整示例

**影响**:
- AI 可能认为所有 Question 都必须回答成功
- 缺少信息缺口场景的参考示例

**修复建议**:
在 catchup-report-template.md 末尾增加"示例 2：部分信息缺失"：

```markdown
## 示例 2：部分信息缺失场景

### Q1: 当前 Feature 与阶段是什么？
✅ 已回答
Feature: FSREQ-20260305-AUTH-001 - 短信验证码登录
阶段: 04_implement (代码实现)

### Q2: 当前 in_progress TASK 是什么？
⚠️ 无进行中任务
建议: 从 task_plan.md 选择下一个 planned 任务

### Q3: 上次中断前最后一个有效结论是什么？
❌ 无法回答
原因: findings.md 为空
补齐方案: 执行 `/spec-first:status` 获取当前状态

### Q4: 当前最大阻塞是什么？
❌ 无法回答
原因: 缺少 findings.md，无法识别阻塞项
补齐方案: 先补齐 Q3，再重新评估

### Q5: 下一步最小可执行命令是什么？
✅ 已明确
命令: /spec-first:status
目的: 生成当前状态快照，补齐 findings.md
```

---

#### P2-3: hooks 配置缺少实际执行机制说明

**位置**: `SKILL.md` 第 11-29 行（YAML frontmatter）和第 459-483 行

**问题描述**:
- hooks 配置定义了 PreToolUse、PostToolUse、Stop 三类 hooks
- 但未说明这些 hooks 是如何执行的：
  1. 是由 AI runtime 自动触发？
  2. 还是需要 AI 主动检查？
  3. 如果 AI 忽略了 hooks 提醒，有什么兜底机制？

**影响**:
- AI 可能不知道如何响应 hooks
- hooks 可能成为"装饰性配置"而不起实际作用

**修复建议**:
在"Hooks 行为规范"章节增加：

```markdown
### Hooks 执行机制

- **触发方式**: AI runtime 在匹配到对应工具调用时自动触发
- **AI 响应**: 收到 reminder 后，必须在工具调用前/后输出检查结果
- **示例**:
  ```
  [catchup] 读取上下文文件前检查：
  - ✅ 文件存在：specs/FSREQ-20260305-AUTH-001/stage-state.json
  - ✅ 路径正确

  正在读取 stage-state.json...
  ```
- **兜底机制**: Stop hook 在会话结束时强制触发 checkpoint，确保关键检查项不被遗漏
```

---

## 恢复报告模板完整性

| 步骤 | 内容 | 状态 |
|------|------|------|
| Step 1 | Feature 基本信息 | ✅ 完整 |
| Step 2 | 任务进度 | ✅ 完整 |
| Step 3 | 最近发现 | ✅ 完整 |
| Step 4 | 文件完整性检查 | ✅ 完整 |
| Step 5 | 风险识别 | ✅ 完整 |
| Step 6 | 建议下一步 | ✅ 完整 |

**评价**: 6 步报告结构完整，格式清晰，包含所有必要信息。

---

## 5-Question 框架完整性

| Question | 内容 | 状态 |
|----------|------|------|
| Q1 | 当前 Feature 与阶段是什么？ | ✅ 完整 |
| Q2 | 当前 in_progress TASK 是什么？ | ✅ 完整 |
| Q3 | 上次中断前最后一个有效结论是什么？ | ✅ 完整 |
| Q4 | 当前最大阻塞是什么？ | ✅ 完整 |
| Q5 | 下一步最小可执行命令是什么？ | ✅ 完整 |

**评价**: 5-Question 框架完整，每个 Question 都有明确的检查项、信息来源、回答格式、失败处理。

---

## 上下文恢复策略完整性

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 读取 `.spec-first/current` | ✅ | P0 优先级，定位 Feature |
| 读取 `stage-state.json` | ✅ | P1 优先级，确定阶段 |
| 读取 `task_plan.md` | ✅ | P2 优先级，了解任务进度 |
| 读取 `findings.md` | ✅ | P3 优先级，恢复工作上下文 |
| 读取 Git 历史 | ✅ | P5 优先级，可选 |
| 综合分析生成报告 | ✅ | 完整 |

**评价**: 上下文恢复策略完整，信息源优先级清晰，失败处理机制完善。

---

## 信息缺口处理完整性

| 缺口类型 | 检测方法 | 补齐方案 | 状态 |
|---------|---------|---------|------|
| Feature 未定位 | `.spec-first/current` 不存在 | `spec-first feature list/switch` | ✅ |
| 阶段状态缺失 | `stage-state.json` 不存在 | `/spec-first:init` | ✅ |
| 任务计划缺失 | `task_plan.md` 不存在 | `/spec-first:task` | ✅ |
| 发现记录为空 | `findings.md` 为空 | `/spec-first:status` | ✅ |
| 无 in_progress 任务 | 所有任务为 planned/complete | 从 task_plan.md 选择下一个 | ✅ |

**评价**: 信息缺口处理机制完善，覆盖 5 种常见缺口类型，每种都有明确的检测方法和补齐方案。

---

## 与 SHARED.md 一致性检查

| 约束项 | 状态 | 说明 |
|--------|------|------|
| 字面即精神原则 | ✅ | 已包含完整的反合理化表 |
| 反合理化守卫 | ✅ | 包含 catchup 专属守卫（5 条） |
| 文件系统即外部记忆 | ⚠️ | 隐式遵守，但未明确声明 |
| Handoff Next Steps | ✅ | "建议下一步"章节符合要求 |
| 2-Action Rule | ⚠️ | 未明确声明，但写入 findings.md 符合要求 |
| P0-P5 执行模型 | ❌ | 使用相同标记但语义不同，造成冲突（P1-1） |
| Skill 类型例外表 | ❌ | 未声明 Skill 类型和例外情况（P0-1） |

**评价**: 部分遵守 SHARED.md 约束，但缺少明确声明，且存在术语冲突。

---

## Skill 类型分类验证

| 检查项 | 预期 | 实际 | 状态 |
|--------|------|------|------|
| Skill 类型 | 路由控制型 | 未声明 | ❌ |
| P3_CONFIRM | 按各自声明 | 有声明（assisted），但缺少元数据字段 | ⚠️ |
| P4_WRITE | 只允许写运行态或控制面文件 | 符合（仅写 findings.md） | ✅ |
| findings.md | 必须按各自声明 | 符合（必须写入） | ✅ |
| stage advance | 仅 orchestrate 允许 | 符合（不涉及 stage advance） | ✅ |
| P0-P5 例外 | 必须声明例外 | 未声明 | ❌ |

**评价**: 实际行为符合"路由控制型"定义，但缺少明确的类型声明和例外说明。

---

## 决策流程图完整性

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 流程图存在 | ✅ | 第 327-403 行，使用 Mermaid 语法 |
| 覆盖主要路径 | ✅ | 包含定位 Feature、加载上下文、识别缺口、生成报告、写入 findings |
| 错误处理路径 | ✅ | 包含文件缺失、信息缺口的处理分支 |
| 与执行阶段一致 | ✅ | 流程图与 P0-P5 执行阶段对应 |

**评价**: 决策流程图完整清晰，覆盖主要路径和错误处理。

---

## 总体评价

### 优点

1. **恢复机制完整**: 6 步报告 + 5-Question 框架设计合理，覆盖全面
2. **信息源优先级清晰**: P0-P5 优先级分层明确，失败处理完善
3. **信息缺口处理**: 5 种常见缺口类型都有明确的检测和补齐方案
4. **反合理化守卫**: 包含 catchup 专属守卫，防止 AI 跳过恢复流程
5. **模板完整**: 3 个 reference 文件提供了详细的模板和指南
6. **hooks 配置**: 配置了 PreToolUse/PostToolUse/Stop hooks，强化质量

### 缺陷

1. **P0-1**: 缺少 Skill 类型声明和 P0-P5 例外说明（阻塞性）
2. **P0-2**: 元数据缺少 `confirm_policy` 字段（阻塞性）
3. **P1-1**: P0-P5 术语与 SHARED.md 冲突（重要）
4. **P1-2**: 缺少与 SHARED.md 一致性声明（重要）
5. **P1-3**: findings.md 写入时机不明确（重要）
6. **P2-1**: 执行步骤与报告结构编号混淆（改进）
7. **P2-2**: 缺少信息缺失场景的完整示例（改进）
8. **P2-3**: hooks 执行机制说明不足（改进）

---

## 修复优先级

### 立即修复（P0）

1. 在 SKILL.md 增加"Skill 类型声明"章节
2. 在 YAML frontmatter 增加 `confirm_policy: assisted`

### 近期修复（P1）

3. 将信息源优先级改用不同标记（Priority-0/1/2 或 Tier-0/1/2）
4. 增加"统一约束"章节，明确声明与 SHARED.md 的关系
5. 在"确认策略"章节明确 findings.md 写入时机和格式

### 改进优化（P2）

6. 统一"执行步骤"与"报告结构"的编号体系
7. 在 catchup-report-template.md 增加信息缺失场景示例
8. 在"Hooks 行为规范"增加执行机制说明

---

## 修复后验证清单

修复完成后，需验证：

- [ ] SKILL.md 包含"Skill 类型声明"章节
- [ ] YAML frontmatter 包含 `confirm_policy: assisted`
- [ ] 信息源优先级使用不同于 P0-P5 的标记
- [ ] 包含"统一约束"章节，引用 SHARED.md
- [ ] "确认策略"章节明确 findings.md 写入行为
- [ ] 执行步骤与报告结构使用不同编号体系
- [ ] catchup-report-template.md 包含信息缺失示例
- [ ] "Hooks 行为规范"包含执行机制说明
- [ ] 所有修改符合 CLAUDE.md 的代码变动铁律

---

## 相关文件路径

- `/Users/kuang/xiaobu/spec-first/skills/spec-first/02-catchup/SKILL.md`
- `/Users/kuang/xiaobu/spec-first/skills/spec-first/02-catchup/references/catchup-report-template.md`
- `/Users/kuang/xiaobu/spec-first/skills/spec-first/02-catchup/references/context-recovery-guide.md`
- `/Users/kuang/xiaobu/spec-first/skills/spec-first/02-catchup/references/reboot-test-checklist.md`
- `/Users/kuang/xiaobu/spec-first/skills/spec-first/SHARED.md`
