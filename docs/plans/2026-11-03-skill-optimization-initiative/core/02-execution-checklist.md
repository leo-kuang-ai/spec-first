# Skill 优化项目 - 统一执行清单

**日期**：2026-11-03  
**版本**：v4（研发流程导向）  
**目标**：让需求到可信交付的整条研发链路更顺畅、更自主、更可靠  
**方法**：真实任务追踪 → 识别阻力 → 数据驱动优化

**本文档整合**：QUICK-START.md + 02-phase0-execution-guide.md + EXECUTION-CHECKLIST.md

---

## 🚀 第 1 部分：快速开始（3 分钟）

**适用于**：想立即开始执行，不想读长文档的人

### 🎯 目标是什么？

让需求到可信交付的整条研发链路更顺畅、更自主、更可靠。

**不是**：优化 Skill 性能  
**而是**：让真实任务能高质量、完整地交付

### 📍 现在在哪里？

**Phase 0**：真实任务流程追踪（当前阶段，36 小时）

目的：找出真实的阻力点，用数据决定优化哪些 Skill

### 🚀 接下来做什么？

#### 今天（2 小时）

**1. 选择 11 个真实任务**

从最近 1-2 个月的 Git/PR 记录中选择：
- 3 个小功能开发
- 2 个跨模块需求
- 2 个缺陷修复
- 2 个 PR 反馈处理
- 2 个跨会话续做

```bash
# 查看最近任务
git log --since="2 months ago" --oneline --all | head -30
gh pr list --state merged --limit 30
```

**2. 创建工作目录**

```bash
mkdir -p docs/plans/2026-11-03-skill-optimization-initiative/phase0-results/task-flow-traces
touch docs/plans/2026-11-03-skill-optimization-initiative/phase0-results/task-selection.md
```

#### 本周（20 小时）

追踪 6 个任务的完整流程（每个约 2 小时）

#### 下周（16 小时）

完成剩余 5 个任务 + 分析

### ⚠️ 3 个关键原则

1. **✅ 基于数据，不凭主观** - 每个结论都有具体任务证据支持
2. **✅ 真实任务，不造假** - 必须是已完成的真实任务，有 Git/PR 可追溯
3. **✅ Layer 3 → Layer 2 → Layer 1** - 先看端到端质量，再追查衔接问题，最后定位 Skill 根因

---

## 📍 第 2 部分：当前状态

- **阶段**：Phase 0 - 真实任务流程追踪
- **状态**：准备启动
- **进度**：0% (0 / 11 任务)
- **预计时间**：36 小时（5 个工作日）

---

## ✅ Phase 0 执行清单（36 小时）

### 📚 准备工作（2 小时）

#### ✅ 理解核心文档（必读，30 分钟）

- [ ] 阅读 `00-goals-and-success-criteria.md`（必读入口，15 分钟）
  - 理解三层标准：Layer 3 > Layer 2 > Layer 1
  - 理解完成标准：正确率 >90%、返工率 <10%、用户介入 <3 次
  
- [ ] 阅读 `02-phase0-execution-guide.md`（执行指南，15 分钟）
  - 理解 11 个任务分类
  - 理解 YAML 追踪模板
  - 理解四类阻力点

#### ✅ 选择 11 个代表性真实任务（1.5 小时）

**任务要求**：
- 已完成的真实任务（有完整记录）
- 最近 1-2 个月内
- 有 Git 历史或 PR 记录可追溯

**任务分类清单**：

```bash
# 1. 查看最近的 Git 提交和 PR
cd /Users/kuang/xiaobu/spec-first
git log --since="2 months ago" --oneline --all | head -50
gh pr list --state merged --limit 30

# 2. 创建任务清单文件
mkdir -p docs/plans/2026-11-03-skill-optimization-initiative/phase0-results/task-flow-traces
touch docs/plans/2026-11-03-skill-optimization-initiative/phase0-results/task-selection.md
```

**填写任务清单**（保存到 `phase0-results/task-selection.md`）：

```markdown
# Phase 0 任务选择清单

## 小功能开发（3 个）

- [ ] T01: [任务描述] - [Git commit/PR]
- [ ] T02: [任务描述] - [Git commit/PR]
- [ ] T03: [任务描述] - [Git commit/PR]

## 跨模块需求（2 个）

- [ ] T04: [任务描述] - [Git commit/PR]
- [ ] T05: [任务描述] - [Git commit/PR]

## 缺陷修复（2 个）

- [ ] T06: [任务描述] - [Git commit/PR]
- [ ] T07: [任务描述] - [Git commit/PR]

## PR 反馈处理（2 个）

- [ ] T08: [任务描述] - [PR review thread]
- [ ] T09: [任务描述] - [PR review thread]

## 跨会话续做（2 个）

- [ ] T10: [任务描述] - [多个 session]
- [ ] T11: [任务描述] - [多个 session]
```

---

### 🔍 任务追踪执行（20 小时）

**每个任务约 2 小时，共 11 个任务**

#### 追踪流程（对每个任务重复）

**步骤 1：创建追踪文件**（5 分钟）

```bash
# 复制模板
cp docs/plans/2026-11-03-skill-optimization-initiative/02-phase0-execution-guide.md task-template.yaml

# 创建任务文件
touch phase0-results/task-flow-traces/T01-小功能-[简短描述].yaml
```

**步骤 2：重建完整流程**（60 分钟）

从第一条用户消息到最终交付，记录：
- 每个阶段使用的 Skill
- 每个阶段的输入和输出
- 用户介入点
- 遇到的问题和阻力点

**步骤 3：标注阻力点**（30 分钟）

四类阻力点：
1. **信息丢失**：上游已确定，下游未使用
2. **信息重复**：上游已确定，下游又询问
3. **验证缺失**：声称完成但未验证
4. **衔接断裂**：输入输出不匹配

每个阻力点记录：
- 具体位置（哪个阶段）
- 具体内容（丢失/重复了什么）
- 是否导致返工（true/false）

**步骤 4：评估三层指标**（30 分钟）

```yaml
# Layer 3：端到端交付质量
quality_assessment:
  delivered: true/false      # 是否有交付物
  correct: true/false        # 功能是否正确
  complete: true/false       # 是否包含所有需求
  tested: true/false         # 是否有测试
  documented: true/false     # 是否有文档
  overall_score: X/5

layer3_metrics:
  端到端正确: true/false
  返工次数: X
  用户介入次数: X

# Layer 2：阶段衔接
layer2_metrics:
  信息丢失: X 处
  信息重复: X 处
  验收条件落实率: X% (Y/Z)

# Layer 1：问题定位
layer1_problems:
  - skill: spec-xxx
    problem: "具体问题描述"
  - skill: spec-yyy
    problem: "具体问题描述"
```

#### 进度跟踪

**Week 1（本周）**：

- [ ] Day 1: 选择 11 个任务 + 完成 T01、T02（4 小时）
- [ ] Day 2: 完成 T03、T04（4 小时）
- [ ] Day 3: 完成 T05、T06（4 小时）

**Week 2（下周）**：

- [ ] Day 1: 完成 T07、T08（4 小时）
- [ ] Day 2: 完成 T09、T10（4 小时）
- [ ] Day 3: 完成 T11（2 小时）

---

### 📊 模式识别（6 小时）

**输入**：11 个任务的追踪文件  
**输出**：`phase0-results/friction-pattern-analysis.md`

#### 步骤 1：统计四类阻力点频率（2 小时）

```bash
# 创建统计文件
touch phase0-results/friction-pattern-analysis.md
```

**统计模板**：

```markdown
# 阻力点模式分析

## 高频阻力点（出现 ≥5 次）

### F01：[阻力点名称]
- 涉及 Skill：spec-xxx
- 出现任务：T01, T02, T04, T05, T06, T07, T09（X/11 = X%）
- 导致返工：X 个任务
- 严重程度：P0/P1/P2
- Layer 3 影响：[具体影响描述]
- Layer 2 影响：[具体影响描述]

### F02：[阻力点名称]
...

## 中频阻力点（出现 2-4 次）
...

## 低频阻力点（出现 1 次）
...

## 四类阻力点总体统计

| 阻力类型 | 总出现次数 | 平均每任务 | 导致返工占比 |
|---|---|---|---|
| 信息丢失 | X | X | X% |
| 信息重复 | X | X | X% |
| 验证缺失 | X | X | X% |
| 衔接断裂 | X | X | X% |
```

#### 步骤 2：计算 Phase 0 基线数据（2 小时）

```markdown
## Phase 0 基线数据

### Layer 3：端到端交付质量

| 指标 | 测量值 | 目标 | 状态 |
|---|---|---|---|
| 端到端正确率 | X% (X/11) | >90% | ✅/❌ |
| 端到端返工率 | X% (X/11) | <10% | ✅/❌ |
| 用户介入次数 | X 次/任务 | <3 次 | ✅/❌ |

### Layer 2：阶段衔接顺畅度

| 指标 | 测量值 | 目标 | 状态 |
|---|---|---|---|
| 信息丢失率 | X% | <5% | ✅/❌ |
| 信息重复率 | X% | <10% | ✅/❌ |
| 验收条件落实率 | X% | >90% | ✅/❌ |

### Layer 1：单个 Skill 有效性

问题 Skill 数量：X 个
```

#### 步骤 3：识别跨任务模式（2 小时）

```markdown
## 跨任务模式

### 模式 1：边界条件系统性遗漏
- 出现频率：X/11
- 涉及阶段：需求 → 计划
- 涉及 Skill：spec-prd, spec-plan
- 典型场景：[描述]
- 建议对策：[描述]

### 模式 2：验收条件传递断裂
- 出现频率：X/11
- 涉及阶段：计划 → 实施
- 涉及 Skill：spec-plan, spec-work
- 典型场景：[描述]
- 建议对策：[描述]
```

---

### 🎯 根因分析与优先级建议（8 小时）

**输入**：阻力点模式分析  
**输出**：`phase0-results/skill-coverage-analysis.md` + `phase0-results/root-cause-and-priority.md`

#### 步骤 1：Skill 覆盖分析（4 小时）

```bash
touch phase0-results/skill-coverage-analysis.md
```

**分析模板**：

```markdown
# Skill 覆盖与根因分析

## Layer 1 定位：问题 Skill 清单

### spec-xxx（PX 问题）

**问题类型**：指令不清晰 / 有过时约束 / 不必要工作 / 完整性缺失

**证据**：
- 出现任务：T01, T02, ...（X/11 = X%）
- 具体表现：[描述]

**Layer 2 影响**：
- 信息丢失 / 信息重复 / 验证缺失 / 衔接断裂
- 量化指标：X%

**Layer 3 影响**：
- 导致返工：X 个任务
- 端到端正确率影响：-X%

**对应候选项**：O01 / NEW-01 / ...

---

### spec-yyy（PX 问题）
...

## 无问题 Skill 清单

- spec-aaa: 11 个任务中表现良好
- spec-bbb: 11 个任务中表现良好
...

## 候选项映射

| 候选编号 | Skill | Phase 0 发现 | 影响面 | 严重程度 |
|---|---|---|---|---|
| NEW-03 | spec-plan | 边界遗漏 | 7/11 = 64% | P0 |
| NEW-01 | spec-work | 验收未落实 | 6/11 = 55% | P0 |
| O04 | spec-prd | 需求遗漏 | 3/11 = 27% | P1 |
| O01 | spec-plan | 重复读取 | 0/11 = 0% | 无证据 |
| ... | ... | ... | ... | ... |
```

#### 步骤 2：优先级建议（4 小时）

```bash
touch phase0-results/root-cause-and-priority.md
```

**优先级计算公式**：

```
优先级 = 影响面 × 严重程度

影响面 = 受影响任务数 / 11
严重程度：
  - 导致返工 → P0（权重 10）
  - 影响效率但不返工 → P1（权重 5）
  - 仅浪费少量时间 → P2（权重 2）
```

**输出模板**：

```markdown
# Phase 0 根因分析与优先级建议

## 执行摘要

**Phase 0 完成日期**：2026-11-XX  
**追踪任务数**：11 个  
**发现问题 Skill 数**：X 个  
**推荐 Phase 1 优化数**：X 个（P0）

## Phase 0 基线数据（实际测量）

### Layer 3 指标

| 指标 | 测量值 | 目标 | 状态 | 缺口 |
|---|---|---|---|---|
| 端到端正确率 | X% | >90% | ✅/❌ | -X% |
| 端到端返工率 | X% | <10% | ✅/❌ | +X% |
| 用户介入次数 | X 次 | <3 次 | ✅/❌ | +X 次 |

**结论**：Layer 3 [通过/不通过]，主要问题是 [...]

### Layer 2 指标

| 指标 | 测量值 | 目标 | 状态 | 缺口 |
|---|---|---|---|---|
| 信息丢失率 | X% | <5% | ✅/❌ | +X% |
| 信息重复率 | X% | <10% | ✅/❌ | +X% |
| 验收条件落实率 | X% | >90% | ✅/❌ | -X% |

**结论**：Layer 2 [通过/不通过]，主要问题是 [...]

## 优先级排序（基于数据）

### P0 优化（立即启动 Phase 1）

#### 1. spec-xxx - [问题描述]（对应 [候选编号]）

**决策依据**：
- **Layer 3 问题**：导致返工率 X%，X 个任务返工
- **Layer 2 问题**：信息丢失率 X%，验收条件落实率 X%
- **Layer 1 根因**：[具体根因]
- **影响面**：X/11 = X%
- **严重程度**：P0（导致返工）
- **优先级得分**：X × 10 = X

**优化方向**：
- 增加 [具体机制]
- 强化 [具体验证门]
- 定义 [具体约束]

**预期改善**：
- Layer 3：返工率 -X%
- Layer 2：信息丢失率 -X%

#### 2. spec-yyy - [问题描述]（对应 [候选编号]）
...

### P1 优化（Phase 1 后续批次）

#### 3. spec-zzz - [问题描述]（对应 [候选编号]）
...

### P2 优化（暂缓）

#### X. spec-aaa - [问题描述]（对应 [候选编号]）

**决策依据**：
- 影响面 X%，但未导致返工
- 仅浪费少量时间（平均 X 分钟）
- Layer 3 无明显影响

**建议**：暂缓，观察后续任务

### 无证据候选项（不优化）

| 候选编号 | Skill | Phase 0 结论 | 理由 |
|---|---|---|---|
| O01 | spec-plan | 无证据 | 11 个任务中未发现重复读取问题 |
| ... | ... | ... | ... |

## Phase 1 范围建议

**推荐优化数量**：X 个 P0 Skill

**推荐优化顺序**：
1. spec-xxx（影响最大）
2. spec-yyy（影响次大）
...

**预计时间**：X 天（每个 Skill 约 X 天）

**预期收益**：
- 端到端返工率：X% → <10%
- 端到端正确率：X% → >90%
```

---

## 📋 Phase 0 完成检查清单

### 必须完成项

- [ ] 11 个任务全部追踪完成
- [ ] 每个任务都有完整的 YAML 文件
- [ ] 四类阻力点已统计
- [ ] Phase 0 基线数据已计算
- [ ] 问题 Skill 已定位
- [ ] 优先级建议已基于数据给出
- [ ] 三层指标都有明确测量值

### 质量检查

- [ ] 每个阻力点都有具体证据（不是主观猜测）
- [ ] Layer 3 → Layer 2 → Layer 1 追查链路完整
- [ ] 优先级排序有明确公式和数据支持
- [ ] 所有推荐优化都同时满足：Layer 3 有问题 + Layer 2 有衔接问题 + Layer 1 定位到根因

### 输出文件检查

- [ ] `phase0-results/task-selection.md`（11 个任务清单）
- [ ] `phase0-results/task-flow-traces/T01-T11.yaml`（11 个追踪文件）
- [ ] `phase0-results/friction-pattern-analysis.md`（阻力点模式）
- [ ] `phase0-results/skill-coverage-analysis.md`（Skill 覆盖分析）
- [ ] `phase0-results/root-cause-and-priority.md`（优先级建议）

---

## 🚀 立即开始

### 今天（2 小时）

```bash
# 1. 阅读核心文档
cat docs/plans/2026-11-03-skill-optimization-initiative/00-goals-and-success-criteria.md
cat docs/plans/2026-11-03-skill-optimization-initiative/02-phase0-execution-guide.md

# 2. 查看最近任务
cd /Users/kuang/xiaobu/spec-first
git log --since="2 months ago" --oneline --all | head -30
gh pr list --state merged --limit 30

# 3. 创建工作目录
mkdir -p docs/plans/2026-11-03-skill-optimization-initiative/phase0-results/task-flow-traces

# 4. 开始填写任务清单
touch docs/plans/2026-11-03-skill-optimization-initiative/phase0-results/task-selection.md
```

### 本周（20 小时）

- 完成任务选择
- 完成 6 个任务追踪
- 初步统计阻力点

### 下周（16 小时）

- 完成剩余 5 个任务追踪
- 完成模式识别
- 完成根因分析
- 完成优先级建议

---

## ⚠️ 关键原则（必须遵守）

1. **✅ 基于数据，不凭主观**
   - 每个结论都有具体任务和证据支持
   - 不预设优化范围
   - 候选项只是候选，Phase 0 数据决定实际优化哪些

2. **✅ Layer 3 → Layer 2 → Layer 1 追查**
   - 先看端到端交付质量（Layer 3）
   - 再追查阶段衔接问题（Layer 2）
   - 最后定位单个 Skill 根因（Layer 1）
   - 三层都有问题才优化

3. **✅ 真实任务，不造假**
   - 必须是已完成的真实任务
   - 有 Git/PR 记录可追溯
   - 不凭记忆，重建完整流程

4. **✅ 完整追踪，不省略**
   - 从第一条用户消息到最终交付
   - 每个阶段的输入输出都记录
   - 所有阻力点都标注

---

## 📞 需要帮助？

- **不确定如何选择任务**：参考 `02-phase0-execution-guide.md` 第 2.1 节
- **不确定如何追踪流程**：参考 `02-phase0-execution-guide.md` 的 YAML 模板
- **不确定如何标注阻力点**：参考 `02-phase0-execution-guide.md` 第 3 节
- **不确定如何计算优先级**：参考本文档"优先级建议"部分的公式

---

## 📚 附录：详细模板与示例（来自 02-phase0-execution-guide.md）

### 附录 A：任务流程追踪 YAML 模板（完整版）

```yaml
task_id: T01
task_type: 小功能开发  # 小功能开发 / 跨模块需求 / 缺陷修复 / PR反馈处理 / 跨会话续做
description: "具体任务描述，一句话说明这个任务做了什么"
git_reference: "commit hash / PR number / issue number"
date_completed: "2026-10-XX"

# 完整流程记录（从第一条用户消息到最终交付）
stages:
  - stage: 1_project_understanding
    skill_used: spec-runtime-setup / using-spec-first / 无
    input: "用户需求消息"
    output: "项目上下文理解 / 环境准备完成"
    duration_minutes: X
    user_interventions: 0  # 用户介入次数
    阻力点: []
    
  - stage: 2_requirement
    skill_used: spec-prd / spec-brainstorm / 无
    input: "用户需求"
    output: "PRD 文档 / 需求明确"
    duration_minutes: X
    user_interventions: X
    阻力点:
      - type: 信息丢失  # 信息丢失 / 信息重复 / 验证缺失 / 衔接断裂
        description: "具体描述：PRD 未明确空输入处理"
        led_to_rework: true  # 是否导致返工
        layer2_impact: "信息丢失"
        layer1_root_cause: "spec-prd 缺少边界系统化检查"
    
  - stage: 3_planning
    skill_used: spec-plan
    input: "PRD"
    output: "Plan 文档（技术方案 + 验收条件）"
    duration_minutes: X
    user_interventions: X
    阻力点:
      - type: 信息重复
        description: "Plan 又询问了 PRD 已确定的分页大小"
        led_to_rework: false
        layer2_impact: "信息重复"
        layer1_root_cause: "spec-plan 未读取 PRD 已确定信息"
    
  - stage: 4_implementation
    skill_used: spec-work
    input: "Plan"
    output: "代码实现"
    duration_minutes: X
    user_interventions: X
    阻力点:
      - type: 验证缺失
        description: "声称完成但未运行测试"
        led_to_rework: true
        layer2_impact: "验证缺失"
        layer1_root_cause: "spec-work 未执行验证门"
      - type: 衔接断裂
        description: "Plan 的 3 个验收条件只实现了 1 个"
        led_to_rework: true
        layer2_impact: "验收条件落实率 33%"
        layer1_root_cause: "spec-work 未验证 Plan 的验收条件"
    
  - stage: 5_review
    skill_used: spec-code-review
    input: "代码"
    output: "审查意见"
    duration_minutes: X
    user_interventions: X
    阻力点: []
    
  - stage: 6_submission
    skill_used: spec-commit / spec-commit-push-pr
    input: "审查通过的代码"
    output: "Git commit / PR"
    duration_minutes: X
    user_interventions: X
    阻力点: []

# 三层指标评估
quality_assessment:
  delivered: true        # 是否有交付物
  correct: false         # 功能是否正确（有 bug）
  complete: false        # 是否包含所有需求（遗漏 2 个验收条件）
  tested: false          # 是否有测试
  documented: true       # 是否有文档
  overall_score: 2/5     # 总分（5 项中通过几项）

layer3_metrics:
  端到端正确: false      # 任务是否一次完成且正确
  返工次数: 2            # 实际返工次数
  用户介入次数: 3        # 用户澄清、确认、修正次数
  总耗时_分钟: 180       # 从开始到完成的总时间

layer2_metrics:
  信息丢失次数: 2        # 上游已确定但下游未使用
  信息重复次数: 1        # 下游重复询问上游已确定信息
  验证缺失次数: 1        # 声称完成但未验证
  衔接断裂次数: 1        # 输入输出不匹配
  验收条件总数: 3        # Plan 中定义的验收条件总数
  验收条件落实数: 1      # Work 实际实现的验收条件数
  验收条件落实率: 33%    # 落实数 / 总数

layer1_problems:
  - skill: spec-prd
    problem_type: 完整性缺失  # 指令不清晰 / 有过时约束 / 不必要工作 / 完整性缺失
    problem: "缺少边界系统化检查"
    evidence: "PRD 未明确空输入、单页、多页等边界条件"
  - skill: spec-plan
    problem_type: 不必要工作
    problem: "重复询问 PRD 内容"
    evidence: "PRD 已确定分页大小，Plan 又询问"
  - skill: spec-work
    problem_type: 完整性缺失
    problem: "未验证 Plan 的验收条件"
    evidence: "Plan 的 3 个验收条件只实现了 1 个"

# 备注与反思
notes: |
  本任务主要问题：
  1. PRD 阶段遗漏边界条件，导致 Work 阶段返工
  2. Work 阶段未验证 Plan 的验收条件，导致第二次返工
  3. 总共返工 2 次，用户介入 3 次，耗时 180 分钟
```

### 附录 B：四类阻力点详细说明

#### 1. 信息丢失

**定义**：上游阶段已确定的信息，下游阶段未使用

**典型场景**：
- PRD 定义了边界条件，Plan 未考虑
- Plan 定义了验收条件，Work 未实现
- Plan 定义了技术选型，Work 用了其他方案

**如何识别**：
- 对比上游输出和下游输入
- 检查是否有"PRD 已确定，但 Plan 未提及"
- 检查是否有"Plan 已确定，但 Work 未实现"

**标注示例**：
```yaml
阻力点:
  - type: 信息丢失
    description: "PRD 定义了 3 个边界条件（空输入、单页、多页），Plan 只考虑了 1 个"
    led_to_rework: true
    layer2_impact: "信息丢失率 67%"
    layer1_root_cause: "spec-plan 缺少边界系统化检查"
```

#### 2. 信息重复

**定义**：下游阶段重复询问上游已确定的信息

**典型场景**：
- PRD 已确定分页大小，Plan 又询问
- Plan 已确定技术栈，Work 又询问
- 用户在 PRD 阶段已回答的问题，Plan 阶段又问一遍

**如何识别**：
- 检查用户是否被多次询问同一个问题
- 检查下游是否读取了上游的输出

**标注示例**：
```yaml
阻力点:
  - type: 信息重复
    description: "PRD 已确定每页 20 条，Plan 又询问用户'每页多少条？'"
    led_to_rework: false
    layer2_impact: "信息重复，浪费 5 分钟"
    layer1_root_cause: "spec-plan 未读取 PRD 已确定信息"
```

#### 3. 验证缺失

**定义**：声称完成但未验证

**典型场景**：
- Work 声称"代码已完成"，但未运行测试
- Work 声称"已处理边界条件"，但未验证边界
- Review 声称"已审查"，但遗漏明显问题

**如何识别**：
- 检查是否有"已完成"的声明但无验证证据
- 检查是否运行了测试
- 检查是否验证了边界条件

**标注示例**：
```yaml
阻力点:
  - type: 验证缺失
    description: "Work 声称'代码已完成，所有边界已处理'，但未运行测试，后续发现边界处理有 bug"
    led_to_rework: true
    layer2_impact: "验证缺失，导致返工"
    layer1_root_cause: "spec-work 未执行验证门"
```

#### 4. 衔接断裂

**定义**：上游输出与下游输入不匹配

**典型场景**：
- Plan 说"使用 Redis 缓存"（抽象），Work 需要"Redis 配置、数据结构、过期策略"（具体）
- Plan 定义了 3 个验收条件，Work 只实现了 1 个
- PRD 要求"支持导出"，Plan 未包含导出功能

**如何识别**：
- 检查下游是否能直接使用上游的输出
- 检查是否有"Plan 说要做 X，但 Work 没做"
- 检查是否有"抽象描述无法直接实施"

**标注示例**：
```yaml
阻力点:
  - type: 衔接断裂
    description: "Plan 定义了 3 个验收条件，Work 只实现了 1 个，另外 2 个被遗漏"
    led_to_rework: true
    layer2_impact: "验收条件落实率 33%"
    layer1_root_cause: "spec-work 未逐条验证 Plan 的验收条件"
```

### 附录 C：三层指标计算方法

#### Layer 3：端到端交付质量

**指标 1：端到端正确率**

```
计算公式：完全正确的任务数 / 总任务数

完全正确定义（5 项全部为 true）：
- delivered: 有交付物（代码、PR、文档等）
- correct: 功能正确（无 bug）
- complete: 包含所有需求功能点
- tested: 有测试验证
- documented: 有必要文档

示例：
11 个任务中，3 个完全正确 → 正确率 = 3/11 = 27%
```

**指标 2：端到端返工率**

```
计算公式：需要返工的任务数 / 总任务数

返工定义：
- 提交后需要修改（因为 bug、遗漏功能、测试不通过等）
- 不包括正常的 code review 修改

示例：
11 个任务中，8 个返工 → 返工率 = 8/11 = 73%
```

**指标 3：用户介入次数**

```
计算公式：总介入次数 / 总任务数

用户介入定义：
- 用户需要澄清需求
- 用户需要确认方案
- 用户需要修正理解偏差
- 不包括正常的需求输入

示例：
11 个任务，总介入 31 次 → 平均 = 31/11 = 2.8 次/任务
```

#### Layer 2：阶段衔接顺畅度

**指标 1：信息丢失率**

```
计算公式：有信息丢失的任务数 / 总任务数

示例：
11 个任务中，7 个有信息丢失 → 丢失率 = 7/11 = 64%
```

**指标 2：信息重复率**

```
计算公式：有信息重复的任务数 / 总任务数

示例：
11 个任务中，6 个有信息重复 → 重复率 = 6/11 = 55%
```

**指标 3：验收条件落实率**

```
计算公式：实现的验收条件总数 / Plan 中的验收条件总数

示例：
11 个任务，Plan 定义了 33 个验收条件，Work 实现了 10 个
→ 落实率 = 10/33 = 30%
```

#### Layer 1：单个 Skill 有效性

从 Layer 2 和 Layer 3 的问题追溯到具体 Skill：

```
Layer 3 发现：返工率 73%
  ↓ 追查 Layer 2
Layer 2 发现：信息丢失率 64%，验收条件落实率 30%
  ↓ 追查 Layer 1
Layer 1 定位：
  - spec-plan: 缺少边界系统化检查（7/11 任务）
  - spec-work: 未验证验收条件（6/11 任务）
```

---

**下一步**：执行"第 2 部分 - 今天（2 小时）"，选择第一个任务开始追踪
