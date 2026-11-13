# Phase 0 执行指南 - 真实任务流程追踪

日期：2026-11-03  
版本：v4（研发流程导向）  
预计时间：36 小时（5 个工作日）  
预计费用：$0

---

## 目标

**不再是**：单独评估代码质量、返工率、审查有效性  
**而是**：选择代表性任务，沿完整流程找出阻力点

---

## 核心方法

### 代表性任务分类（共 11 个）

| 任务类型 | 数量 | 典型流程 | 关键检查点 |
|---|---|---|---|
| **小功能开发** | 3 | 理解 → 需求 → 方案 → 实施 → 审查 → 提交 | 是否理解项目规则？是否遗漏边界？ |
| **跨模块需求** | 2 | 需求 → 方案 → 任务拆分 → 实施 → 集成 → 验证 | 模块间衔接是否顺畅？是否遗漏集成测试？ |
| **缺陷修复** | 2 | 理解问题 → 定位根因 → 修复 → 验证 → 提交 | 是否治标不治本？是否举一反三？ |
| **PR 反馈处理** | 2 | 理解反馈 → 修改 → 重新验证 → 推送 | 是否真正解决问题？是否引入新问题？ |
| **跨会话续做** | 2 | 恢复上下文 → 继续实施 → 完成 | 是否丢失决策？是否重新询问？ |

---

## 步骤 0：选择代表性任务（2 小时）

### 任务选择标准

1. **真实性**：必须是实际执行过的任务
2. **完整性**：从需求到交付的完整流程
3. **可追溯**：有完整的聊天记录或文档
4. **代表性**：覆盖不同类型、不同复杂度
5. **最近性**：最近 1-3 个月内的任务

### 任务来源

- Git 历史记录（最近的 commits 和 PRs）
- Slack/文档中的任务记录
- 项目管理工具（如果有）
- 会话历史记录

### 输出

`phase0-results/selected-tasks.yaml`

```yaml
tasks:
  - task_id: small-feature-001
    type: 小功能开发
    description: "为用户列表增加分页功能"
    date: "2026-10-15"
    source: "PR #123"
    chat_log: "path/to/chat-log.md"
  
  - task_id: small-feature-002
    type: 小功能开发
    description: "增加用户头像上传功能"
    date: "2026-10-20"
    source: "PR #125"
    chat_log: "path/to/chat-log.md"
  
  # ... 共 11 个任务
```

---

## 步骤 1：端到端流程追踪（20 小时，每个任务约 2 小时）

### 对每个任务执行

#### 1.1 重建完整流程

从第一条用户消息开始，到最终交付（PR merged 或代码部署），记录：

- 每个阶段使用的 Skill
- 每个阶段的输入与输出
- 用户介入的点
- 等待时间
- 遇到的问题

#### 1.2 标注阻力点

识别四类问题：

1. **信息丢失**：上游已确定，下游未使用
2. **信息重复**：上游已确定，下游又询问
3. **验证缺失**：声称完成但实际未验证
4. **衔接断裂**：A 输出不符合 B 输入

#### 1.3 记录格式

`phase0-results/task-flow-traces/small-feature-001.yaml`

```yaml
task_id: small-feature-001
task_type: 小功能开发
description: "为用户列表增加分页功能"
start_time: "2026-10-15 10:00"
end_time: "2026-10-15 14:30"
total_duration: "4.5 小时"
user_interventions: 3

stages:
  - stage: 1_project_understanding
    skills_used: [spec-runtime-setup, using-spec-first]
    duration: "20 分钟"
    input: "用户请求：增加分页功能"
    output: "理解项目结构，确认使用 spec-work"
    user_intervention: false
    issues:
      - type: "不必要工作"
        description: "runtime-setup 重复检查已存在的配置"
        severity: P2
        estimated_waste: "5 分钟"
    smooth: false  # 有问题
  
  - stage: 2_requirement
    skills_used: [spec-prd]
    duration: "30 分钟"
    input: "用户需求：分页"
    output: "PRD：每页 20 条，支持跳页"
    user_intervention: true  # 用户澄清了一次
    issues:
      - type: "隐含需求遗漏"
        description: "未主动询问：总数显示？加载状态？"
        severity: P1
        estimated_waste: "后期补充需 30 分钟"
    smooth: false
    handoff_to_next: true  # PRD 传递给 Plan
  
  - stage: 3_planning
    skills_used: [spec-plan]
    duration: "40 分钟"
    input: "PRD"
    output: "技术方案：后端分页 API + 前端组件"
    user_intervention: false
    issues:
      - type: "信息重复"
        description: "重新询问了 PRD 已确定的每页条数"
        severity: P2
        estimated_waste: "5 分钟"
        source_stage: 2_requirement
        lost_info: "每页 20 条"
      
      - type: "边界遗漏"
        description: "未考虑边界：数据为空、只有一页"
        severity: P0
        estimated_waste: "返工需 1 小时"
    smooth: false
    handoff_to_next: true  # Plan 传递给 Work
  
  - stage: 4_implementation
    skills_used: [spec-work]
    duration: "2 小时"
    input: "Plan"
    output: "代码实现"
    user_intervention: false
    issues:
      - type: "信息丢失"
        description: "Plan 提到的边界条件，Work 阶段未实现"
        severity: P0
        estimated_waste: "返工需 1 小时"
        source_stage: 3_planning
        lost_info: "边界条件：数据为空、只有一页"
      
      - type: "验证缺失"
        description: "缺少单元测试"
        severity: P1
        estimated_waste: "后期补充需 30 分钟"
    smooth: false
    handoff_to_next: true  # Code 传递给 Review
  
  - stage: 5_review
    skills_used: [spec-code-review]
    duration: "30 分钟"
    input: "代码"
    output: "审查通过"
    user_intervention: false
    issues:
      - type: "验证缺失"
        description: "未发现 Work 阶段遗漏的边界条件"
        severity: P0
        estimated_waste: "导致返工"
        missed_issue: "边界条件未实现"
      
      - type: "验证缺失"
        description: "未发现缺少测试"
        severity: P1
        missed_issue: "单元测试缺失"
    smooth: false
    handoff_to_next: true  # 传递给 Commit
  
  - stage: 6_commit
    skills_used: [spec-commit-push-pr]
    duration: "10 分钟"
    input: "代码"
    output: "推送到 PR"
    user_intervention: false
    issues: []
    smooth: true

overall_quality:
  delivered: true
  correct: false  # 缺少边界处理
  complete: false  # 缺少测试
  rework_needed: true
  user_satisfaction: 3 / 5  # 需要返工

friction_summary:
  total_friction_points: 6
  by_type:
    信息丢失: 1
    信息重复: 1
    验证缺失: 3
    不必要工作: 1
  
  total_estimated_waste: "2 小时 40 分钟"
  actual_rework_time: "1.5 小时"

root_causes:
  - skill: spec-plan
    issue: "缺少边界系统化检查"
    impact: "导致 Work 阶段遗漏边界"
  
  - skill: spec-work
    issue: "未强制验证 Plan 的验收条件"
    impact: "Plan 提到的边界未实现"
  
  - skill: spec-code-review
    issue: "审查深度不足"
    impact: "未发现边界遗漏和测试缺失"
```

---

## 步骤 2：跨任务模式识别（6 小时）

### 目标

汇总 11 个任务的流程追踪，识别高频问题模式。

### 2.1 信息丢失模式

```yaml
pattern: 信息丢失
frequency: 7 / 11 任务（64%）
typical_stages:
  - from: 3_planning
    to: 4_implementation
    lost_info_types:
      - "边界条件"
      - "验收条件"
      - "非功能需求"
    frequency: 5 / 7

  - from: 2_requirement
    to: 5_review
    lost_info_types:
      - "业务约束"
      - "用户体验要求"
    frequency: 2 / 7

impact:
  rework_rate: 70%  # 7 个任务中有 5 个需要返工
  estimated_waste_per_task: "1-2 小时"

root_causes:
  - "Plan 的验收条件未被 Work 明确检查"
  - "PRD 的业务约束未被 Review 审查"
```

### 2.2 信息重复模式

```yaml
pattern: 信息重复
frequency: 6 / 11 任务（55%）
typical_stages:
  - from: 2_requirement
    to: 3_planning
    repeated_questions:
      - "每页多少条？"
      - "是否支持排序？"
      - "性能要求？"
    frequency: 6 / 6

impact:
  estimated_waste_per_task: "5-10 分钟"
  user_annoyance: "中"

root_causes:
  - "Plan 未直接消费 PRD 输出"
  - "Plan 的 prompt 包含重新询问的模板"
```

### 2.3 验证缺失模式

```yaml
pattern: 验证缺失
frequency: 9 / 11 任务（82%）
typical_stages:
  - stage: 4_implementation
    missing_verification:
      - "单元测试"
      - "边界条件验证"
      - "集成测试"
    frequency: 7 / 9
  
  - stage: 5_review
    missing_verification:
      - "边界条件审查"
      - "测试覆盖率检查"
      - "性能影响评估"
    frequency: 6 / 9

impact:
  rework_rate: 78%  # 9 个任务中有 7 个需要返工
  estimated_waste_per_task: "1-3 小时"

root_causes:
  - "Work 没有强制的自查清单"
  - "Review 审查深度不足，只看语法"
```

### 2.4 衔接断裂模式

```yaml
pattern: 衔接断裂
frequency: 4 / 11 任务（36%）
typical_scenarios:
  - from: 3_planning
    to: 4_implementation
    mismatch:
      - "Plan 用抽象描述，Work 不知道具体怎么做"
      - "Plan 提到的依赖，Work 阶段缺失"
    frequency: 3 / 4
  
  - from: 6_commit
    to: PR_feedback
    mismatch:
      - "提交了但反馈说缺关键功能"
    frequency: 1 / 4

impact:
  rework_rate: 100%  # 4 个任务全部需要返工
  estimated_waste_per_task: "2-4 小时"

root_causes:
  - "Plan 的输出格式与 Work 的输入期望不匹配"
  - "缺少整体交付验证"
```

### 输出

`phase0-results/friction-pattern-analysis.md`

---

## 步骤 3：Skill 覆盖与问题定位（4 小时）

### 目标

根据流程追踪，评估每个研发环节的 Skill 覆盖与问题。

### 3.1 按研发环节分析

```yaml
research_stages:
  - stage: 1_项目理解与环境准备
    involved_skills:
      - spec-runtime-setup
      - using-spec-first
      - spec-project-rules (低频)
    coverage: 良好
    issues:
      - skill: spec-runtime-setup
        problem: "重复检查已有配置"
        frequency: 6 / 11
        severity: P2
        root_cause: "没有状态记忆"
    
    recommendations:
      - "增加配置缓存，避免重复检查"
  
  - stage: 2_方向与需求定义
    involved_skills:
      - spec-ideate (低频)
      - spec-brainstorm (中频)
      - spec-prd (高频)
    coverage: 基本覆盖
    issues:
      - skill: spec-prd
        problem: "未主动挖掘隐含需求"
        frequency: 7 / 11
        severity: P1
        root_cause: "缺少系统化的需求挖掘清单"
      
      - skill: spec-brainstorm
        problem: "重复访谈相同问题"
        frequency: 3 / 11
        severity: P2
        root_cause: "未记录已确认的答案"
    
    recommendations:
      - "spec-prd 增加隐含需求挖掘清单"
      - "spec-brainstorm 记录已确认信息"
  
  - stage: 3_方案与任务拆分
    involved_skills:
      - spec-plan (高频)
      - spec-write-tasks (低频)
    coverage: 基本覆盖
    issues:
      - skill: spec-plan
        problem: "重复询问 PRD 已确定内容"
        frequency: 6 / 11
        severity: P2
        root_cause: "未直接消费 PRD 输出"
      
      - skill: spec-plan
        problem: "边界条件系统化不足"
        frequency: 7 / 11
        severity: P0
        root_cause: "缺少边界检查清单"
      
      - skill: spec-plan
        problem: "验收条件不明确"
        frequency: 5 / 11
        severity: P1
        root_cause: "验收条件是可选的，不是强制的"
    
    recommendations:
      - "spec-plan 直接消费 PRD 输出，避免重复询问"
      - "spec-plan 增加边界系统化检查清单"
      - "spec-plan 强制输出明确的验收条件"
  
  - stage: 4_实施与问题处理
    involved_skills:
      - spec-work (高频)
      - spec-debug (高频)
      - spec-simplify-code (低频)
      - spec-worktree (低频)
    coverage: 基本覆盖
    issues:
      - skill: spec-work
        problem: "未验证 Plan 的验收条件"
        frequency: 7 / 11
        severity: P0
        root_cause: "没有强制的验收条件检查"
      
      - skill: spec-work
        problem: "缺少单元测试"
        frequency: 7 / 11
        severity: P1
        root_cause: "测试不是强制的"
      
      - skill: spec-debug
        problem: "治标不治本"
        frequency: 3 / 11
        severity: P1
        root_cause: "缺少根因分析和举一反三"
    
    recommendations:
      - "spec-work 增加验收条件强制检查"
      - "spec-work 增加代码质量自查清单"
      - "spec-debug 增加举一反三检查"
  
  - stage: 5_质量验证
    involved_skills:
      - spec-code-review (高频)
      - spec-test-browser (低频)
      - spec-test-xcode (低频)
    coverage: 不足
    issues:
      - skill: spec-code-review
        problem: "审查深度不足，只看语法"
        frequency: 6 / 11
        severity: P0
        root_cause: "缺少分层审查策略"
      
      - skill: spec-code-review
        problem: "未发现边界遗漏"
        frequency: 5 / 11
        severity: P0
        root_cause: "缺少边界条件审查清单"
      
      - skill: spec-code-review
        problem: "未发现测试缺失"
        frequency: 6 / 11
        severity: P1
        root_cause: "测试覆盖率不是审查项"
      
      - coverage_gap: "缺少通用测试策略 Skill"
        frequency: 9 / 11 任务缺少测试
        severity: P0
        impact: "代码质量无保障"
    
    recommendations:
      - "spec-code-review 增加分层审查策略"
      - "spec-code-review 增加边界条件审查清单"
      - "新增 spec-test-design Skill"
  
  - stage: 6_提交与反馈闭环
    involved_skills:
      - spec-commit (高频)
      - spec-commit-push-pr (高频)
      - spec-resolve-pr-feedback (中频)
    coverage: 基本覆盖
    issues:
      - skill: spec-resolve-pr-feedback
        problem: "修复后未重新验证"
        frequency: 2 / 2（所有 PR 反馈任务）
        severity: P1
        root_cause: "缺少修复后的验证步骤"
    
    recommendations:
      - "spec-resolve-pr-feedback 增加修复后验证"
  
  - stage: 7_恢复与知识复用
    involved_skills:
      - spec-handoff (中频)
      - spec-compound (低频)
      - spec-compound-refresh (低频)
    coverage: 基本覆盖
    issues:
      - skill: spec-handoff
        problem: "恢复后丢失决策"
        frequency: 1 / 2
        severity: P1
        root_cause: "handoff artifact 不完整"
    
    recommendations:
      - "spec-handoff 增加决策记录检查"
  
  - stage: 8_跨阶段协调
    involved_skills:
      - using-spec-first (高频)
      - spec-lfg (低频)
    coverage: 基本覆盖
    issues:
      - skill: using-spec-first
        problem: "路由不准确，反复转交"
        frequency: 3 / 11
        severity: P2
        root_cause: "入口规则不清晰"
    
    recommendations:
      - "using-spec-first 优化路由规则"
```

### 输出

`phase0-results/skill-coverage-analysis.md`

---

## 步骤 4：根因分析与优先级建议（4 小时）

### 目标

基于前 3 步，回答三个层面的问题，并给出 Phase 1 优化范围建议。

### 4.1 Layer 1：单个 Skill 问题

**高频问题 Skill**（出现在 ≥50% 任务中）：

1. **spec-plan**（7/11 任务）
   - 边界条件系统化不足
   - 重复询问 PRD 内容
   - 验收条件不明确

2. **spec-work**（7/11 任务）
   - 未验证 Plan 的验收条件
   - 缺少单元测试

3. **spec-code-review**（6/11 任务）
   - 审查深度不足
   - 未发现边界遗漏
   - 未发现测试缺失

4. **spec-prd**（7/11 任务）
   - 未主动挖掘隐含需求

### 4.2 Layer 2：阶段衔接问题

**高频衔接问题**：

1. **PRD → Plan**（6/11 任务）
   - 信息重复：Plan 重新询问 PRD 已确定内容

2. **Plan → Work**（7/11 任务）
   - 信息丢失：Plan 的验收条件、边界条件未被 Work 实现

3. **Work → Review**（6/11 任务）
   - 验证缺失：Review 未发现 Work 的遗漏

### 4.3 Layer 3：整体交付问题

**统计结果**（11 个任务）：

- 端到端正确率：27%（3/11）
- 端到端返工率：73%（8/11）
- 平均用户介入次数：2.8 次/任务
- 平均返工时间：1.5 小时/任务

**主要原因**：
1. 边界条件遗漏（5/8 返工任务）
2. 测试缺失（6/8 返工任务）
3. 验收条件未验证（7/8 返工任务）

### 4.4 Phase 1 优先级建议

**基于数据的优先级**（不再预设）：

**P0（必须立即优化）**：

1. **spec-plan 边界系统化**
   - 理由：7/11 任务受影响，导致 5 个任务返工
   - 对应候选：NEW-03

2. **spec-work 验收条件检查**
   - 理由：7/11 任务受影响，导致 7 个任务返工
   - 对应候选：NEW-01（部分）

3. **spec-code-review 审查深度**
   - 理由：6/11 任务受影响，导致 6 个任务返工
   - 对应候选：NEW-02 + NEW-06

4. **spec-prd 隐含需求挖掘**
   - 理由：7/11 任务受影响，导致后期补充需求
   - 对应候选：NEW-04

**P1（应该优化）**：

5. **spec-test-design**（新增）
   - 理由：9/11 任务缺少测试
   - 对应候选：NEW-08

6. **spec-debug 举一反三**
   - 理由：3/11 任务治标不治本
   - 对应候选：NEW-07

7. **using-spec-first 路由优化**
   - 理由：3/11 任务路由不准
   - 对应候选：O02

**P2（可选优化）**：

8. **spec-runtime-setup 配置缓存**
   - 理由：6/11 任务重复检查，但浪费时间较少
   - 对应候选：（新增）

9. **spec-handoff 决策记录**
   - 理由：1/2 跨会话任务丢失决策
   - 对应候选：O08

### 输出

`phase0-results/root-cause-and-priority.md`

---

## Phase 0 完成检查清单

- [ ] 步骤 0：11 个代表性任务已选择并记录
- [ ] 步骤 1：11 个任务的端到端流程追踪已完成
- [ ] 步骤 2：跨任务模式识别已完成
- [ ] 步骤 3：Skill 覆盖与问题定位已完成
- [ ] 步骤 4：根因分析与优先级建议已完成
- [ ] 所有输出文档已创建并 review

---

## 下一步

Phase 0 完成后：
1. Review 优先级建议
2. 确认 Phase 1 启动的项目（不再预设为 12 项）
3. 开始 Phase 1 实施
