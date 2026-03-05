# plan 与 task 的区别

> **版本**: v1.0.0 | **更新**: 2026-03-05

## 快速理解

| 维度 | plan | task |
|------|------|------|
| **定位** | 编排前置 - 决策"做什么" | 阶段执行 - 拆解"怎么做" |
| **使用时机** | orchestrate 自动调用 | 03_plan 阶段手动调用 |
| **输入** | 当前状态 + Gate/Metrics | FR + DS |
| **输出** | 执行计划 + 风险评估 | 任务清单 + 依赖关系 |
| **产物** | `findings.md`（计划摘要） | `task_plan.md`（任务明细） |
| **粒度** | 宏观（阶段级别） | 微观（2-4h 任务） |

## plan - 编排决策器

### 职责
生成当前阶段的执行计划，评估风险与下一步步骤。

### 使用场景

**1. orchestrate 自动调用（最常见）**
```bash
用户执行: /spec-first:orchestrate
  ↓
Step 1: 自动执行 plan（分析 + 决策）
  ↓
Step 2: 根据 plan 结论调度对应 skill
  - 01_specify → 调度 spec
  - 02_design → 调度 design
  - 03_plan → 调度 task
  - 04_implement → 调度 code
  ↓
Step 3: 执行 verify
  ↓
Step 4: Gate 通过后 stage advance
```

**2. 手动规划（独立使用）**
- 进入新阶段时
- 发现阻塞问题时
- 需要重新规划时

### 输出内容

写入 `specs/{featureId}/findings.md`：

```markdown
## 计划摘要

- **目标阶段**: 01_specify
- **下一步动作**: 生成 FR 定义
- **阻塞项**: AC-AUTH-001-01 存在歧义
- **风险等级**: MEDIUM
- **建议命令**: /spec-first:spec

## 风险评估

| 风险项 | 等级 | 影响 | 缓解措施 | 状态 |
|--------|------|------|----------|------|
| AC 歧义 | HIGH | 阻塞设计 | 标记 NEEDS CLARIFICATION | OPEN |
```

## task - 任务拆解器

### 职责
将需求拆解为可执行的 TASK 任务清单。

### 使用场景

**仅在 03_plan 阶段使用**：
- 完成需求规格（spec）后
- 完成技术设计（design）后
- 准备开始实现（code）前

### 触发方式

```bash
# 方式 1: 手动调用
/spec-first:task

# 方式 2: orchestrate 自动调度
# 当前阶段为 03_plan 时，orchestrate 会自动调用 task
```

### 输出内容

写入 `specs/{featureId}/task_plan.md`：

```markdown
## 任务明细

| Task ID | 标题 | Owner | 预计工期 | traces | depends_on | 验收标准 | 状态 |
|---------|------|-------|----------|--------|------------|----------|------|
| TASK-AUTH-002 | 发送验证码 API | BE | 1d | FR-AUTH-001 | - | API 可调用 | planned |
| TASK-AUTH-003 | 验证码登录 API | BE | 1d | FR-AUTH-001 | TASK-AUTH-002 | 正确登录 | planned |

### TASK-AUTH-002: 发送验证码 API

**Owner**: BE
**预计工期**: 1d
**traces**: FR-AUTH-001,DS-AUTH-001
**depends_on**: -

**执行步骤**:

**Step 1: 创建文件**
- Create `src/auth/sms.ts`
- 预期输出: 文件创建成功

**Step 2: 实现发送逻辑**
- 实现 `sendSmsCode()` 函数
- 预期输出: 函数可调用

**Step 3: 验证**
```bash
npm test auth/sms.test.ts
```
```

## 协同关系

```
plan（战略规划）
  ↓
findings.md（计划摘要）
  ↓
orchestrate（编排执行）
  ↓
task（战术拆解）
  ↓
task_plan.md（任务清单）
  ↓
code（具体实现）
```

## 为什么分开？

### 1. 关注点分离

- **plan**: 跨阶段使用，负责"决策"
- **task**: 单阶段使用，负责"拆解"

### 2. 复用性不同

- **plan**: 任何阶段需要规划时都可用
- **task**: 仅在 03_plan 阶段有意义

### 3. 产物不同

- **plan**: findings.md（决策记录）
- **task**: task_plan.md（执行契约）

### 4. 粒度不同

- **plan**: 宏观（阶段级别、风险评估）
- **task**: 微观（2-4h 任务、具体步骤）

## 常见问题

### Q1: 什么时候用 plan？

**A**: 通常不需要手动调用，orchestrate 会自动使用。仅在以下情况手动调用：
- 发现阻塞需要重新规划
- 进入新阶段前想先评估风险
- 需要独立的决策分析

### Q2: 什么时候用 task？

**A**: 当你完成了 spec 和 design，准备开始写代码时：
```bash
# 确认当前阶段
spec-first stage current
# 输出: 03_plan

# 执行任务拆解
/spec-first:task
```

### Q3: 能跳过 plan 直接用 task 吗？

**A**: 不建议。orchestrate 的标准流程是 `plan → skill → verify → advance`，跳过 plan 会缺少风险评估和阻塞检查。

### Q4: task 拆解后如何执行？

**A**: 有三种方式：
1. **当前会话执行** - task 完成后在当前会话逐个执行
2. **新会话执行** - 使用 `/spec-first:code` 在新会话执行
3. **并行执行** - 标记 `[P]` 的任务可并行处理

## 实际使用流程

### 标准流程（推荐）

```bash
# 1. 执行编排（自动包含 plan）
/spec-first:orchestrate

# orchestrate 内部流程：
# - 自动执行 plan 分析当前状态
# - 根据阶段调度对应 skill（如 task）
# - 执行 verify 验证
# - Gate 通过后 stage advance
```

### 手动流程（特殊场景）

```bash
# 1. 先规划
/spec-first:plan
# 输出: findings.md 包含下一步建议

# 2. 根据建议执行对应 skill
/spec-first:task
# 输出: task_plan.md 包含任务清单

# 3. 执行任务
/spec-first:code
```

## 总结

- **plan** 是 orchestrate 的"大脑"，负责决策"做什么、有什么风险"
- **task** 是 03_plan 阶段的"执行器"，负责拆解"怎么做、谁来做"
- 两者职责清晰、产物不同、使用时机不同，分开设计是合理的
- 日常使用推荐 `orchestrate`，它会自动协调 plan 和其他 skill
