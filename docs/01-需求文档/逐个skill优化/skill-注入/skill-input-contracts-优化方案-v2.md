# Skill 输入上下文注入策略优化方案

> **视角**: 顶尖 Google 研发体系
> **核心原则**: 只喂能提升决策质量的最小充分上下文
> **日期**: 2026-03-23

---

## 1. 设计原则

### 1.1 反模式警示

❌ **"多喂上下文总是更好"** — 这是当前配置的隐性倾向

✅ **"最小充分上下文"** — 只注入能提升决策质量的信息

### 1.2 分类框架（按能力属性）

| 类型 | 定义 | 上下文需求 | 典型特征 |
|------|------|-----------|----------|
| **工具型** | 聚焦动作本身，尽量去项目化 | 极简或无 | 不理解项目也能正确执行 |
| **流程型** | 服务研发阶段推进 | 完整上下文 | 需要理解项目才能做正确决策 |
| **质量增强型** | 有上下文时质量明显提升 | 可选上下文 | 能跑，但有了上下文跑得更好 |
| **元治理型** | 关注系统状态、流程一致性 | 轻量上下文 | 只需知道"状态在哪"，不需要"理解内容" |

---

## 2. Skill 重新分类

### 2.1 工具型 (5 个)

| Skill | 职责 | 为什么是工具型 |
|-------|------|----------------|
| `init` | 初始化配置 | 操作文件系统，不需要理解项目 |
| `first` | 生成认知产物 | 它本身就是上下文生成源 |
| `doctor` | 环境诊断 | 检查安装状态，与项目内容无关 |
| `onboarding` | 工具引导 | 教的是 spec-first 用法，不是项目内容 |
| `feature` | Feature 查询/切换 | 操作的是索引，不需要理解项目 |

**注入策略**: `required: []`，可选保留少量 recommended 用于增强提示

### 2.2 流程型 (8 个)

| Skill | 职责 | 为什么是流程型 |
|-------|------|----------------|
| `spec` | 需求规格 | 需要理解业务背景才能写出正确规格 |
| `spec-review` | 规格审查 | 需要理解领域才能评审质量 |
| `design` | 技术设计 | 需要理解架构约束才能做正确设计 |
| `research` | 技术调研 | 需要理解项目上下文才能定向调研 |
| `task` / `plan` | 任务拆解 | 需要理解代码结构才能正确拆解 |
| `orchestrate` | 执行编排 | 需要理解项目状态才能正确编排 |
| `code` | 代码实现 | 需要理解规范、约束、模式才能正确实现 |
| `review` | 实现审查 | 需要理解规范才能判断实现是否正确 |
| `verify` | 阶段验收 | 需要理解需求才能判断是否满足 |
| `catchup` | 恢复上下文 | 需要理解项目历史才能正确恢复 |

**注入策略**: `required: [summary]`，根据具体职责补充 recommended

### 2.3 质量增强型 (2 个)

| Skill | 职责 | 为什么是质量增强型 |
|-------|------|-------------------|
| `analyze` | 一致性分析 | 能分析任何产物，但有项目背景时能发现更深层问题 |
| `archive` | 归档复盘 | 能归档任何 Feature，但有项目背景时能提供更有价值的复盘 |

**注入策略**: `required: []`，`recommended` 提供上下文以提升质量

### 2.4 元治理型 (3 个)

| Skill | 职责 | 为什么是元治理型 |
|-------|------|------------------|
| `sync` | 同步索引 | 操作的是状态文件索引，不需要理解内容 |
| `status` | 输出状态 | 读取并展示状态，不需要理解内容 |
| `archive` | 归档复盘 | 移动文件、更新索引，不需要理解内容 |

**注入策略**: `required: []`，轻量 recommended 用于提供更丰富的状态展示

---

## 3. 配置变更方案

### 3.1 工具型 — 去项目化

```yaml
# init — 跳过注入（在 first 之前执行）
# first — 跳过注入（本身就是上下文生成源）

# doctor — 环境诊断，与项目内容无关
doctor:
  required: []
  recommended: []
  optional: [summary]  # 仅用于提供更精准的诊断建议

# onboarding — 工具使用引导，关注 spec-first 用法
onboarding:
  required: []
  recommended: []
  optional: [summary]  # 仅用于了解项目类型，提供针对性引导

# feature — 操作索引，不需要理解项目
feature:
  required: []
  recommended: []
  optional: [summary, structure-overview]
```

### 3.2 流程型 — 完整上下文

```yaml
# 需求/设计阶段 — 需要理解业务和领域
spec:
  required: [summary]
  recommended: [domain-model, conventions, critical-flows]
  optional: []

spec-review:
  required: [summary]
  recommended: [domain-model, conventions, critical-flows]
  optional: []

design:
  required: [summary]
  recommended: [structure-overview, api-contracts, critical-flows, conventions]
  optional: [steering]

research:
  required: [summary]
  recommended: [critical-flows, api-contracts, domain-model]
  optional: []

# 执行阶段 — 需要理解代码结构和规范
task:
  required: [summary]
  recommended: [entry-guide, critical-flows, structure-overview, conventions]
  optional: [api-contracts]

plan:
  required: [summary]
  recommended: [entry-guide, critical-flows, structure-overview, conventions]
  optional: [api-contracts]

orchestrate:
  required: [summary]
  recommended: [entry-guide, critical-flows, structure-overview, conventions]
  optional: [api-contracts]

code:
  required: [summary]
  recommended: [conventions, entry-guide, structure-overview, critical-flows]
  optional: [api-contracts]

review:
  required: [summary]
  recommended: [conventions, entry-guide, structure-overview, critical-flows]
  optional: [api-contracts]

# 验收阶段 — 需要理解需求
verify:
  required: [summary]
  recommended: [critical-flows, conventions, entry-guide]
  optional: [database-schema]

# 上下文恢复 — 需要理解项目历史
catchup:
  required: [summary]
  recommended: [entry-guide, structure-overview, steering, conventions]
  optional: []
```

### 3.3 质量增强型 — 可选上下文提升质量

```yaml
# analyze — 有上下文时能发现更深层问题
analyze:
  required: []
  recommended: [summary, critical-flows, structure-overview]
  optional: [domain-model]

# archive — 有上下文时能提供更有价值的复盘
archive:
  required: []
  recommended: [summary, structure-overview]
  optional: [domain-model]
```

### 3.4 元治理型 — 轻量上下文

```yaml
# sync — 操作索引，不需要理解内容
sync:
  required: []
  recommended: [entry-guide, structure-overview]
  optional: [api-contracts]

# status — 读取并展示状态，不需要理解内容
status:
  required: []
  recommended: [critical-flows, structure-overview]
  optional: [domain-model, summary]
```

---

## 4. 变更对比

| Skill | 旧配置 required | 新配置 required | 理由 |
|-------|-----------------|-----------------|------|
| `doctor` | `[summary]` | `[]` | 工具型，与项目内容无关 |
| `feature` | `[summary]` | `[]` | 工具型，操作索引 |
| `sync` | `[summary]` | `[]` | 元治理型，操作索引 |
| `status` | `[summary]` | `[]` | 元治理型，读取状态 |
| `archive` | `[summary]` | `[]` | 质量增强型，可选提升 |
| `analyze` | `[summary]` | `[]` | 质量增强型，可选提升 |
| `catchup` | `[summary]` | `[summary]` | 流程型，需要理解项目 |
| `spec` | `[summary]` | `[summary]` | 流程型，需要理解项目 |
| `design` | `[summary]` | `[summary]` | 流程型，需要理解项目 |
| `code` | `[summary]` | `[summary]` | 流程型，需要理解项目 |
| `review` | `[summary]` | `[summary]` | 流程型，需要理解项目 |
| `verify` | `[summary]` | `[summary]` | 流程型，需要理解项目 |

---

## 5. 完整配置文件

```yaml
# ============================================================
# Skill 输入上下文配置
#
# 设计原则：
#   只喂能提升决策质量的最小充分上下文
#
# 分类策略：
#   - 工具型：required: []，尽量去项目化
#   - 流程型：required: [summary]，完整上下文
#   - 质量增强型：required: []，recommended 提升质量
#   - 元治理型：required: []，轻量 recommended
# ============================================================

auto_inject: true

skip_injection:
  - first   # 本身是上下文生成源
  - init    # 在 first 之前执行

defaults:
  required: [summary]
  recommended: []
  optional: []

descriptions:
  summary: 项目概览，理解技术栈和模块划分
  steering: 产品方向和核心约束
  conventions: 编码规范，确保代码风格一致
  entry-guide: 入口指南，快速定位实现位置
  structure-overview: 代码结构，理解模块边界
  api-contracts: API 契约，理解接口规范
  critical-flows: 关键流程，理解业务链路
  domain-model: 领域模型，理解业务概念
  database-schema: 数据库结构，理解数据模型

skills:

  # ═══════════════════════════════════════════════════════════
  # 工具型 (5 个) — 聚焦动作本身，尽量去项目化
  # ═══════════════════════════════════════════════════════════

  # init: 跳过注入（在 first 之前执行）
  # first: 跳过注入（本身就是上下文生成源）

  doctor:  # 环境诊断，与项目内容无关
    required: []
    recommended: []
    optional: [summary]

  onboarding:  # 工具使用引导，关注 spec-first 用法
    required: []
    recommended: []
    optional: [summary]

  feature:  # Feature 查询/切换，操作索引
    required: []
    recommended: []
    optional: [summary, structure-overview]

  # ═══════════════════════════════════════════════════════════
  # 流程型 (10 个) — 服务研发阶段推进，必须吃项目上下文
  # ═══════════════════════════════════════════════════════════

  catchup:  # 恢复上下文
    required: [summary]
    recommended: [entry-guide, structure-overview, steering, conventions]
    optional: []

  spec:  # 需求规格
    required: [summary]
    recommended: [domain-model, conventions, critical-flows]
    optional: []

  spec-review:  # 规格审查
    required: [summary]
    recommended: [domain-model, conventions, critical-flows]
    optional: []

  design:  # 技术设计
    required: [summary]
    recommended: [structure-overview, api-contracts, critical-flows, conventions]
    optional: [steering]

  research:  # 技术调研
    required: [summary]
    recommended: [critical-flows, api-contracts, domain-model]
    optional: []

  task:  # 任务拆解
    required: [summary]
    recommended: [entry-guide, critical-flows, structure-overview, conventions]
    optional: [api-contracts]

  plan:  # 计划加载
    required: [summary]
    recommended: [entry-guide, critical-flows, structure-overview, conventions]
    optional: [api-contracts]

  orchestrate:  # 执行编排
    required: [summary]
    recommended: [entry-guide, critical-flows, structure-overview, conventions]
    optional: [api-contracts]

  code:  # 代码实现
    required: [summary]
    recommended: [conventions, entry-guide, structure-overview, critical-flows]
    optional: [api-contracts]

  review:  # 实现审查
    required: [summary]
    recommended: [conventions, entry-guide, structure-overview, critical-flows]
    optional: [api-contracts]

  verify:  # 阶段验收
    required: [summary]
    recommended: [critical-flows, conventions, entry-guide]
    optional: [database-schema]

  # ═══════════════════════════════════════════════════════════
  # 质量增强型 (2 个) — 有上下文时质量明显提升
  # ═══════════════════════════════════════════════════════════

  analyze:  # 一致性分析
    required: []
    recommended: [summary, critical-flows, structure-overview]
    optional: [domain-model]

  archive:  # 归档复盘
    required: []
    recommended: [summary, structure-overview]
    optional: [domain-model]

  # ═══════════════════════════════════════════════════════════
  # 元治理型 (2 个) — 关注系统状态，轻量上下文
  # ═══════════════════════════════════════════════════════════

  sync:  # 同步索引
    required: []
    recommended: [entry-guide, structure-overview]
    optional: [api-contracts]

  status:  # 输出状态
    required: []
    recommended: [critical-flows, structure-overview]
    optional: [domain-model, summary]
```

---

## 6. 实施检查清单

- [ ] 更新 `skill-input-contracts.yaml`
- [ ] 运行 `spec-first skill inject-context --force`
- [ ] 验证各 SKILL.md 的输入上下文章节
- [ ] 运行测试确保 fallback 链路正常

---

> **核心洞察**: "多喂上下文"不是高标准，"最小充分上下文"才是。工具型 skill 应该能在空目录运行，流程型 skill 才需要完整上下文。
