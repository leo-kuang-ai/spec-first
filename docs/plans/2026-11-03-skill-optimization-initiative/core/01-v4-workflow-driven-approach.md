# Skill 优化方案 v4：研发流程导向

日期：2026-11-03  
版本：v4（从真实任务流程出发）  
核心转变：从"优化 Skill"到"让需求到可信交付的整条研发链路更顺畅、更自主、更可靠"

---

## 核心方法论转变

### 错误的起点（v1-v3）

```
❌ 列出 38 个 Skill → 找 12 个优化 → 分配优化方向
   ↓
   容易遗漏：阶段之间的衔接问题、整体交付质量、真实任务的完整性
```

### 正确的起点（v4）

```
✅ 选择代表性真实任务 → 沿完整流程找阻力 → 判断哪些 Skill 需要调整
   ↓
   关注：单个 Skill 有效性、阶段衔接、整体交付质量
```

---

## 目标重述

**让需求到可信交付的整条研发链路更顺畅、更自主、更可靠**

**不是**：优化 12 个 Skill 的性能  
**而是**：让真实任务能高质量、完整地交付

---

## 研发流程全景（真实任务视角）

### 一个真实需求如何走完

```
1. 项目理解与环境准备
   ├─ 理解项目结构、规则、约束
   ├─ 准备运行时环境
   └─ 获取必要上下文

2. 方向与需求定义
   ├─ 从想法到明确需求
   ├─ 识别业务约束
   └─ 确认验收标准

3. 方案与任务拆分
   ├─ 设计可执行方案
   ├─ 拆分为可验证任务
   └─ 明确依赖关系

4. 实施与问题处理
   ├─ 执行开发任务
   ├─ 处理遇到的问题
   └─ 自查代码质量

5. 质量验证
   ├─ 代码审查
   ├─ 测试验证
   └─ 真实行为确认

6. 提交与反馈闭环
   ├─ 本地提交
   ├─ 推送与 PR
   └─ 处理反馈并重新验证

7. 恢复与知识复用
   ├─ 跨会话恢复上下文
   ├─ 沉淀可复用知识
   └─ 知识及时失效

8. 跨阶段协调
   ├─ 选择正确入口
   ├─ 减少无意义转交
   └─ 确保有人负责完整目标
```

---

## 分析框架：三个层面

### Layer 1：单个 Skill 是否有效

**检查项**：
- 指令是否清晰？
- 是否包含过时约束？
- 是否让模型做了不必要的工作？
- 是否缺少必要的检查？

**评估方法**：
- 读取 Skill 源码
- 对比官方最佳实践
- 检查已知问题记录

### Layer 2：阶段之间是否衔接顺畅

**检查项**：
- PRD 已确定的需求，Plan 是否又重新询问？
- Plan 的验收条件，Work 是否落实？
- Review 的发现，是否真正修复并验证？
- 上游决策，下游是否丢失？

**评估方法**：
- 追踪真实任务的完整流程
- 记录每个阶段的输入输出
- 识别信息丢失或重复的点

### Layer 3：整个任务是否真正完成

**检查项**：
- 每个阶段都报告"通过"，是否真的可交付？
- 总体正确性如何？
- 用户介入次数多少？
- 返工率如何？
- 等待与总耗时如何？

**评估方法**：
- 端到端任务评估
- 不只看各 Skill 表现，看整体结果
- 统计用户体验指标

---

## Phase 0：真实任务流程评估（调整）

### 目标

**不再是**：单独评估代码质量、返工率、审查有效性  
**而是**：选择代表性任务，沿完整流程找出阻力点

### 代表性任务分类

| 任务类型 | 描述 | 典型流程 | 关键检查点 |
|---|---|---|---|
| **小功能开发** | 已有项目，增加小功能 | 理解 → 需求 → 方案 → 实施 → 审查 → 提交 | 是否理解项目规则？是否遗漏边界？ |
| **跨模块需求** | 涉及多个模块协作 | 需求 → 方案 → 任务拆分 → 实施 → 集成 → 验证 | 模块间衔接是否顺畅？是否遗漏集成测试？ |
| **缺陷修复** | 修复已知 Bug | 理解问题 → 定位根因 → 修复 → 验证 → 提交 | 是否治标不治本？是否举一反三？ |
| **PR 反馈处理** | 处理 Code Review 反馈 | 理解反馈 → 修改 → 重新验证 → 推送 | 是否真正解决问题？是否引入新问题？ |
| **跨会话续做** | 恢复上次未完成任务 | 恢复上下文 → 继续实施 → 完成 | 是否丢失决策？是否重新询问？ |

### 调整后的 Phase 0 步骤

#### 步骤 0：选择代表性任务（2 小时）

从最近的真实任务中选择：
- 小功能开发：3 个
- 跨模块需求：2 个
- 缺陷修复：2 个
- PR 反馈处理：2 个
- 跨会话续做：2 个

**合计**：11 个真实任务

#### 步骤 1：端到端流程追踪（20 小时）

**对每个任务**：
1. 重建完整流程（从第一条消息到最终交付）
2. 记录每个阶段：
   - 使用的 Skill
   - 输入与输出
   - 用户介入点
   - 等待时间
   - 问题与阻力

3. 标注关键问题：
   - 信息丢失（上游已确定，下游又问）
   - 信息重复（多个阶段做同样的事）
   - 验证缺失（说完成了但实际没验证）
   - 衔接断裂（A 输出不符合 B 输入）

**输出格式**（每个任务）：
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
    issues:
      - "runtime-setup 重复检查已存在的配置（5 分钟浪费）"
    smooth: true
  
  - stage: 2_requirement
    skills_used: [spec-prd]
    duration: "30 分钟"
    input: "用户需求：分页"
    output: "PRD：每页 20 条，支持跳页"
    issues:
      - "未主动询问：总数显示？加载状态？"
    smooth: false
    衔接到下一阶段: true
  
  - stage: 3_planning
    skills_used: [spec-plan]
    duration: "40 分钟"
    input: "PRD"
    output: "技术方案：后端分页 API + 前端组件"
    issues:
      - "重新询问了 PRD 已确定的每页条数"
      - "未考虑边界：数据为空、只有一页"
    smooth: false
    衔接到下一阶段: true
  
  - stage: 4_implementation
    skills_used: [spec-work]
    duration: "2 小时"
    input: "Plan"
    output: "代码实现"
    issues:
      - "Plan 提到的边界条件，Work 阶段未实现"
      - "缺少单元测试"
    smooth: false
    衔接到下一阶段: true
  
  - stage: 5_review
    skills_used: [spec-code-review]
    duration: "30 分钟"
    input: "代码"
    output: "审查通过"
    issues:
      - "未发现 Work 阶段遗漏的边界条件"
      - "未发现缺少测试"
    smooth: false
    衔接到下一阶段: true
  
  - stage: 6_commit
    skills_used: [spec-commit-push-pr]
    duration: "10 分钟"
    input: "代码"
    output: "推送到 PR"
    issues: []
    smooth: true

overall_quality:
  delivered: true
  correct: false  # 缺少边界处理
  complete: false  # 缺少测试
  rework_needed: true

friction_points:
  - type: "信息重复"
    stages: [2_requirement, 3_planning]
    description: "Plan 重新询问 PRD 已确定的内容"
    severity: P2
    estimated_waste: "5 分钟"
  
  - type: "信息丢失"
    stages: [3_planning, 4_implementation]
    description: "Plan 提到的边界条件，Work 未实现"
    severity: P0
    estimated_waste: "需要返工 1 小时"
  
  - type: "验证缺失"
    stages: [5_review]
    description: "Review 未发现边界遗漏和测试缺失"
    severity: P0
    estimated_waste: "需要返工 1.5 小时"

root_causes:
  - "spec-plan 缺少边界系统化检查"
  - "spec-work 未强制验证 Plan 的验收条件"
  - "spec-code-review 审查深度不足"
```

#### 步骤 2：跨任务模式识别（6 小时）

汇总 11 个任务的流程追踪，识别高频问题：

1. **信息丢失模式**：
   - 哪些阶段之间经常丢失信息？
   - 丢失的是什么类型的信息？
   - 频率和影响？

2. **信息重复模式**：
   - 哪些阶段之间经常重复询问？
   - 重复的是什么内容？
   - 浪费的时间？

3. **验证缺失模式**：
   - 哪些阶段声称完成但实际未验证？
   - 缺失的验证类型？
   - 导致的返工？

4. **衔接断裂模式**：
   - 哪些阶段之间输入输出不匹配？
   - 断裂的原因？

**输出**：`phase0-results/friction-pattern-analysis.md`

#### 步骤 3：Skill 覆盖与问题定位（4 小时）

根据流程追踪，评估每个环节的 Skill 覆盖：

| 研发环节 | 涉及的 Skill | 是否有 Skill 覆盖 | 当前问题 |
|---|---|---|---|
| 项目理解 | spec-runtime-setup, 项目规则 | ✅ | 重复检查已有配置 |
| 需求定义 | spec-ideate, spec-brainstorm, spec-prd | ✅ | 未主动挖掘隐含需求 |
| 方案设计 | spec-plan, spec-doc-review | ✅ | 重复询问已确定内容、边界遗漏 |
| 任务拆分 | spec-write-tasks | ✅ | 较少使用，评估不足 |
| 实施 | spec-work, spec-debug | ✅ | 未验证 Plan 的验收条件 |
| 简化 | spec-simplify-code | ⚠️ | 使用频率低，与 polish 重叠 |
| 代码审查 | spec-code-review | ✅ | 审查深度不足 |
| 测试 | spec-test-browser, spec-test-xcode | ⚠️ | 仅特定平台，缺通用测试 |
| 提交 | spec-commit, spec-commit-push-pr | ✅ | 基本正常 |
| PR 反馈 | spec-resolve-pr-feedback | ✅ | 需评估修复质量 |
| 跨会话 | spec-handoff | ✅ | 需评估上下文恢复质量 |
| 知识复用 | spec-compound, spec-compound-refresh | ✅ | 需评估知识有效性 |
| 入口路由 | using-spec-first | ✅ | 需评估路由准确性 |

**输出**：`phase0-results/skill-coverage-analysis.md`

#### 步骤 4：根因分析与优先级建议（4 小时）

基于前 3 步，回答：

1. **Layer 1（单个 Skill）问题**：
   - 哪些 Skill 的指令不清晰？
   - 哪些 Skill 包含过时约束？
   - 哪些 Skill 让模型做不必要的工作？

2. **Layer 2（阶段衔接）问题**：
   - 哪些阶段之间衔接最不顺畅？
   - 信息丢失/重复的根本原因是什么？
   - 需要在哪些 Skill 之间建立约束？

3. **Layer 3（整体交付）问题**：
   - 整体返工率多高？主要原因？
   - 用户介入次数多少？主要在哪些环节？
   - 哪些任务类型最容易出问题？

**输出**：`phase0-results/root-cause-and-priority.md`

---

## Phase 0 输出调整

```
phase0-results/
├── task-flow-traces/                   # 11 个任务的完整流程追踪
│   ├── small-feature-001.yaml
│   ├── small-feature-002.yaml
│   ├── small-feature-003.yaml
│   ├── cross-module-001.yaml
│   ├── cross-module-002.yaml
│   ├── bug-fix-001.yaml
│   ├── bug-fix-002.yaml
│   ├── pr-feedback-001.yaml
│   ├── pr-feedback-002.yaml
│   ├── session-resume-001.yaml
│   └── session-resume-002.yaml
├── friction-pattern-analysis.md        # 跨任务模式识别
├── skill-coverage-analysis.md          # Skill 覆盖与问题定位
└── root-cause-and-priority.md          # 根因分析与优先级建议
```

---

## Phase 1：调整策略

### 不再预设 12 个优化项

Phase 0 完成后，根据真实任务流程的阻力点，动态决定：

1. **哪些 Skill 需要优化？**
   - 可能是原 12 项中的部分
   - 可能是其他 Skill
   - 可能需要新增 Skill

2. **哪些 Skill 需要合并？**
   - 例如：spec-polish + spec-simplify-code
   - 例如：spec-rule-miner + spec-project-rules

3. **哪些 Skill 需要废弃？**
   - 使用频率极低
   - 与其他 Skill 完全重叠
   - 定位不清且无人使用

4. **哪些阶段需要新 Skill？**
   - 例如：通用测试策略（如果测试是高频痛点）
   - 例如：方案验证（如果 Plan 经常不可行）

5. **哪些衔接需要约束？**
   - 例如：Plan → Work 之间建立验收条件检查
   - 例如：PRD → Plan 之间避免重复询问

---

## 成功标准调整

### 不再是单个 Skill 的指标

**错误**：
- spec-plan 的 token 降幅 ≥20%
- spec-work 的代码质量评分 ≥4.0

**正确**：

### Layer 1：单个 Skill 有效性

| 指标 | 目标 | 度量方法 |
|---|---|---|
| 指令清晰度 | 无歧义、无过时约束 | 人工审查 |
| 必要性 | 不做不必要的工作 | 对比官方最佳实践 |

### Layer 2：阶段衔接顺畅度

| 指标 | 目标 | 度量方法 |
|---|---|---|
| 信息丢失率 | <5% | 统计上游已确定但下游未使用的信息 |
| 信息重复率 | <10% | 统计上游已确定但下游又询问的次数 |
| 验收条件落实率 | >90% | 统计 Plan 的验收条件在 Work 中的实现比例 |

### Layer 3：整体交付质量

| 指标 | 目标 | 度量方法 |
|---|---|---|
| 端到端正确率 | >90% | 任务声称完成且实际可交付的比例 |
| 端到端返工率 | <10% | 需要重做的任务比例 |
| 用户介入次数 | <3 次/任务 | 统计用户澄清、确认、修正的次数 |
| 端到端完成时间 | 基线 -20% | 从需求到交付的总时间 |

---

## 与 v3 的对比

| 方面 | v3（Skill 导向） | v4（流程导向） |
|---|---|---|
| **起点** | 38 个 Skill → 选 12 个优化 | 真实任务 → 找阻力点 → 决定调整哪些 Skill |
| **Phase 0** | 代码质量、返工率、审查有效性 | 11 个真实任务的端到端流程追踪 |
| **优化范围** | 预设 12 项 + 4 项 = 16 项 | 动态决定（可能更多或更少） |
| **成功标准** | 单个 Skill 指标 | 端到端交付质量 |
| **关注点** | Skill 本身 | 阶段衔接 + 整体交付 |

---

## 原 12 项的定位调整

### 保留为候选清单，但不锁死优先级

| 编号 | 原方向 | v4 定位 |
|---|---|---|
| O01 | spec-plan 读取优化 | 候选，Phase 0 后决定 |
| O02 | using-spec-first 入口 | 候选，Phase 0 后决定 |
| O03 | spec-work 风险分级 | 候选，Phase 0 后决定 |
| O04 | spec-prd 需求明确 | 候选，Phase 0 后决定 |
| O05 | spec-brainstorm 重复访谈 | 候选，Phase 0 后决定 |
| O06 | spec-debug 根因 | 候选，Phase 0 后决定 |
| O07 | spec-code-review 视角 | 候选，Phase 0 后决定 |
| O08 | spec-handoff 恢复 | 候选，Phase 0 后决定 |
| O09 | spec-compound 知识质量 | 候选，Phase 0 后决定 |
| O10 | spec-compound-refresh | 候选，Phase 0 后决定 |
| O11 | spec-commit 安全 | 候选，Phase 0 后决定 |
| O12 | spec-commit-push-pr | 候选，Phase 0 后决定 |

### 新增方向也是候选

| 编号 | 新增方向 | v4 定位 |
|---|---|---|
| NEW-04 | spec-prd 需求审查 | 候选，Phase 0 后决定 |
| NEW-05 | spec-plan 行业方案 | 候选，Phase 0 后决定 |
| NEW-06 | spec-code-review 深层 | 候选，Phase 0 后决定 |
| NEW-07 | spec-debug 举一反三 | 候选，Phase 0 后决定 |
| NEW-08 | spec-test-design | 候选，Phase 0 后决定 |
| NEW-09 | spec-test-integration | 候选，Phase 0 后决定 |
| NEW-10 | spec-release-verify | 候选，Phase 0 后决定 |
| NEW-11 | spec-security-review | 候选，Phase 0 后决定 |

**Phase 0 完成后，根据真实阻力点，可能：**
- 确认其中 5-8 项为 P0
- 发现其他需要优化的 Skill
- 合并或废弃部分 Skill

---

## 下一步

1. **确认 v4 方法论**：是否认同"从真实任务流程出发"的方法？
2. **启动 Phase 0**：选择 11 个代表性任务，进行端到端流程追踪
3. **Phase 0 后决策**：根据阻力点，动态决定 Phase 1 的优化范围

---

## 附录：为什么 v4 更合理

### v3 的问题

1. **容易遗漏阶段衔接问题**
   - 单独看 spec-prd 很好，单独看 spec-plan 也很好
   - 但 PRD → Plan 之间可能重复询问

2. **容易遗漏整体交付质量**
   - 每个 Skill 都报告"通过"
   - 但最终交付可能缺少关键功能

3. **优化方向可能偏离真实痛点**
   - 预设 12 项优化
   - 但真实任务的痛点可能在其他地方

### v4 的优势

1. **从真实痛点出发**
   - 选择代表性任务
   - 沿完整流程找阻力
   - 优化方向基于数据

2. **关注端到端质量**
   - 不只看单个 Skill 表现
   - 关注阶段衔接和整体交付

3. **灵活调整优化范围**
   - 不锁死 12 项
   - 根据 Phase 0 发现动态调整

4. **符合最终目标**
   - 目标：让需求到可信交付的整条研发链路更顺畅
   - v4 直接对齐这个目标
