# Skill Input Contracts 最终方案

> 日期: 2026-03-24
> 范围: `skills/spec-first/skill-input-contracts.yaml`
> 目标: 产出可直接执行的最终分类与配置策略，而不是继续堆叠分析

## 1. 终态目标

这份配置的终态不是"给每个 skill 尽可能多的上下文"，而是：

1. 让真正依赖项目语境的研发流程型 skill 稳定拿到最小充分上下文
2. 让工具型 / 治理型 skill 在没有项目上下文时也能正常工作
3. 让 `SKILL.md` 注入说明和运行时上下文契约保持一致
4. 让后续新增 skill 时有清晰的判定规则，而不是靠拍脑袋加字段

一句话总结：

> 只把"会改变决策结果"的上下文放进契约，其他上下文一律降级或删除。

## 2. 最终原则

### 2.1 单一主分类

每个 skill 必须只有一个主分类，避免同一个 skill 同时被定义成"流程型"和"治理型"。

允许有"次级特征"，但配置决策只看主分类。

### 2.2 `required` 只保留硬依赖

进入 `required` 的条件只有一个：

- 缺失它时，skill 的核心判断会失真，或者核心任务无法稳定完成

如果只是"有会更好"，不得进入 `required`。

### 2.3 工具型和治理型 skill 必须允许冷启动

以下两类 skill 不能因为缺少 first 产物而失效：

- 工具型
- 治理型

因为用户很多时候正是在"上下文还没准备好"时需要它们。

### 2.4 流程型 skill 需二次分层

流程型 skill 不是铁板一块，按**职责**分为三层：

| 层级 | 职责 | Skill | 需要 summary? |
|------|------|-------|---------------|
| **定义型** | 从无到有定义需求和设计 | `spec`, `design`, `focus-requirements` | ❌ 不需要 |
| **规划型** | 基于设计拆解任务 | `task`, `plan`, `orchestrate`, `research` | ❌ 不需要 |
| **执行型** | 需要理解已有代码才能工作 | `code`, `review`, `verify` | ⚠️ 推荐但非强制 |
| **恢复型** | 恢复项目上下文 | `catchup` | ✅ 必须有 |
| **收尾型** | 归档和复盘 | `archive` | ✅ 必须有 |

**判断规则**：

- 如果 skill 的职责是"定义"（从无到有）→ `required: []`
- 如果 skill 的职责是"执行"（操作已有代码）→ `summary` 降级为 `recommended`
- 如果 skill 的职责是"恢复"或"收尾"→ `required: [summary]`

### 2.5 新项目的正确入口

**新项目不应该从 `/first` 开始**，而应该从定义阶段开始：

```text
新项目
    │
    ▼
┌─────────────────────────────────────────┐
│  /spec-first:spec                        │  ← 新项目入口
│  职责：定义需求边界和验收标准
│  产出：spec.md / prd.md
│  required: [] (不需要 summary)
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  /spec-first:design                      │
│  职责：确定架构和技术方案
│  产出：design.md
│  required: [] (不需要 summary)
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  /spec-first:task                        │
│  职责：拆解任务
│  产出：task_plan.md
│  required: [] (不需要 summary)
└─────────────────────────────────────────┘
    │
    ▼
  写代码（用户或 /code）
    │
    ▼
┌─────────────────────────────────────────┐
│  /spec-first:first                       │  ← 此时才有代码可分析
│  职责：生成项目认知
│  产出：summary + 其他上下文
└─────────────────────────────────────────┘
    │
    ▼
  后续迭代开发（此时 summary 已存在）
```

### 2.6 存量项目的上下文恢复

存量项目（有代码但无上下文）的入口是 `/first`：

```text
存量项目（无 summary）
    │
    ▼
┌─────────────────────────────────────────┐
│  /spec-first:first                       │  ← 存量项目入口
│  职责：分析代码生成项目认知
│  产出：summary + 其他上下文
└─────────────────────────────────────────┘
    │
    ▼
  后续所有流程型 skill（summary 已存在）
```

### 2.7 当前运行时只区分"必需"和"非必需"

当前实现中，`recommended` 和 `optional` 在运行时会被合并处理；两者真正的差别主要体现在：

- `SKILL.md` 注入展示
- 人类维护配置时的优先级表达

因此当前设计重心应放在：

- `required` 是否准确
- 哪些 skill 不该有 `required`

不要过度设计 `recommended` 和 `optional` 的细粒度差别。

## 3. 最终分类

### 3.1 上下文源头 / 前置入口

这些 skill 不应该被注入项目上下文：

| Skill | 主分类 | 结论 |
|-------|--------|------|
| `first` | 上下文生成源 | 保持 `skip_injection` |
| `init` | 前置入口工具 | 保持 `skip_injection` |

理由：

- `first` 本身负责生成 runtime/docs 真源
- `init` 在 first 之前执行，不能依赖尚未存在的 first 产物

### 3.2 工具型

| Skill | 主分类 | 是否应关注项目信息 |
|-------|--------|-------------------|
| `onboarding` | 工具型 | 不应依赖；项目概览只作弱增强 |
| `feature` | 工具型 | 原则上不依赖；最多做轻量增强 |
| `doctor` | 工具型 | 不应依赖；项目概览只作辅助诊断 |

结论：

- 工具型 skill 应优先服务"动作本身"
- 没有项目上下文时也必须可稳定运行

### 3.3 定义型（流程型子类）

| Skill | 职责 | 是否需要 summary |
|-------|------|-----------------|
| `spec` | 定义需求边界和验收标准 | ❌ 不需要 |
| `design` | 确定架构和技术方案 | ❌ 不需要 |
| `focus-requirements` | 收敛需求到 owner 边界 | ❌ 不需要 |
| `spec-review` | 需求规格质量审查 | ❌ 不需要 |

结论：

- 这组 skill 的职责是"从无到有定义"
- 它们是新项目的入口，不应依赖已有代码的上下文
- `required: []`

### 3.4 规划型（流程型子类）

| Skill | 职责 | 是否需要 summary |
|-------|------|-----------------|
| `task` | 基于设计拆解任务 | ❌ 不需要 |
| `plan` | 加载当前阶段计划 | ❌ 不需要 |
| `orchestrate` | 执行编排 | ❌ 不需要 |
| `research` | 生成调研结论 | ❌ 不需要 |

结论：

- 这组 skill 基于定义阶段的产物工作
- 不需要理解已有代码的细节
- `required: []`

### 3.5 执行型（流程型子类）

| Skill | 职责 | 是否需要 summary |
|-------|------|-----------------|
| `code` | 代码实现 | ⚠️ 推荐但非强制 |
| `review` | 实现质量审查 | ⚠️ 推荐但非强制 |
| `verify` | 阶段验收校验 | ⚠️ 推荐但非强制 |

结论：

- 这组 skill 强烈受益于项目上下文
- 但应允许在无上下文时降级工作（通过代码探索）
- `required: []`，`summary` 放入 `recommended`

### 3.6 恢复型 / 收尾型（流程型子类）

| Skill | 职责 | 是否需要 summary |
|-------|------|-----------------|
| `catchup` | 恢复项目上下文 | ✅ 必须有 |
| `archive` | 归档和复盘 | ✅ 必须有 |

结论：

- `catchup` 的职责就是恢复上下文，必须有上下文可恢复
- `archive` 需要理解项目全貌才能正确归档
- `required: [summary]`

### 3.7 治理 / 状态型

| Skill | 主分类 | 是否应关注项目信息 |
|-------|--------|-------------------|
| `status` | 治理型 | 可增强，但不应成为依赖 |
| `sync` | 治理型 | 可增强，但不应成为依赖 |
| `analyze` | 治理型 | 强烈受益于上下文，但不应被硬绑定 |

结论：

- 这组 skill 可以吃项目上下文提升质量
- 但不该因为项目上下文缺失而不能工作

## 4. 各 Skill 最终配置

| Skill | 分类 | required | recommended | optional |
|-------|------|----------|-------------|----------|
| `first` | 上下文源 | `skip_injection` | - | - |
| `init` | 前置入口 | `skip_injection` | - | - |
| `onboarding` | 工具型 | `[]` | `[]` | `[summary]` |
| `feature` | 工具型 | `[]` | `[]` | `[summary]` |
| `doctor` | 工具型 | `[]` | `[]` | `[summary]` |
| `spec` | 定义型 | `[]` | `[domain-model, conventions, critical-flows]` | `[]` |
| `design` | 定义型 | `[]` | `[summary, structure-overview, api-contracts, critical-flows, conventions]` | `[steering]` |
| `focus-requirements` | 定义型 | `[]` | `[summary, domain-model, critical-flows, conventions]` | `[entry-guide]` |
| `spec-review` | 定义型 | `[]` | `[domain-model, conventions, critical-flows]` | `[]` |
| `task` | 规划型 | `[]` | `[summary, entry-guide, critical-flows, structure-overview, conventions]` | `[api-contracts]` |
| `plan` | 规划型 | `[]` | `[summary, entry-guide, critical-flows, structure-overview, conventions]` | `[api-contracts]` |
| `orchestrate` | 规划型 | `[]` | `[summary, entry-guide, critical-flows, structure-overview, conventions]` | `[api-contracts]` |
| `research` | 规划型 | `[]` | `[summary, critical-flows, api-contracts, domain-model]` | `[]` |
| `code` | 执行型 | `[]` | `[summary, conventions, entry-guide, structure-overview, critical-flows]` | `[api-contracts]` |
| `review` | 执行型 | `[]` | `[summary, conventions, entry-guide, structure-overview, critical-flows]` | `[api-contracts]` |
| `verify` | 执行型 | `[]` | `[summary, critical-flows, conventions, entry-guide]` | `[database-schema]` |
| `catchup` | 恢复型 | `[summary]` | `[entry-guide, structure-overview, steering, conventions]` | `[]` |
| `archive` | 收尾型 | `[summary]` | `[structure-overview, domain-model]` | `[]` |
| `status` | 治理型 | `[]` | `[summary]` | `[critical-flows, structure-overview, domain-model]` |
| `sync` | 治理型 | `[]` | `[summary]` | `[entry-guide, structure-overview, api-contracts]` |
| `analyze` | 治理型 | `[]` | `[summary, critical-flows, structure-overview]` | `[domain-model]` |

## 5. 关键决策说明

### 5.1 定义型 skill 必须去 `summary` 依赖

`spec`、`design`、`focus-requirements`、`spec-review` 的职责是"从无到有定义"，它们是新项目的入口。

如果这些 skill `required: [summary]`，新项目将无法启动（死锁）。

### 5.2 执行型 skill 的 `summary` 降级

`code`、`review`、`verify` 强烈受益于 `summary`，但不应强制依赖：

- **有 `summary`**：理解代码模式、编码规范，产出更高质量
- **无 `summary`**：通过代码探索工作，效率略低但能用

这样新项目在 `first` 之前也能用 `/code` 辅助写初始代码。

### 5.3 `onboarding` 必须去项目化

`onboarding` 的核心是教用户"spec-first 怎么用"，不是解释用户项目。

因此最终决策是：

- 不绑定任何 `required`
- 只把 `summary` 作为弱增强项

这样能保证：

- 新用户在没有 first 产物时也能直接获得可用引导
- 有 `summary` 时可根据项目类型提供更贴近前端 / 后端 / 全栈的建议

### 5.4 `doctor` 不应被业务上下文绑死

`doctor` 的任务是诊断宿主、MCP、skills、runtime/docs 健康，而不是做业务分析。

因此最终决策是：

- 清空 `required`
- 不再保留 `conventions` / `entry-guide` / `structure-overview` 作为主要输入
- 只保留 `summary` 作为弱增强项

### 5.5 `catchup` 和 `archive` 必须有 `summary`

- `catchup` 的职责是恢复上下文，没有 `summary` 就没有上下文可恢复
- `archive` 需要理解项目全貌才能正确归档

因此它们保持 `required: [summary]`。

### 5.6 `status` 和 `sync` 应该允许"上下文缺失时运行"

这两个 skill 很多时候正是在"上下文不完整"时被调用：

- `status` 用来确认现状
- `sync` 用来修复索引 / 链接 / 状态漂移

因此它们不应把 `summary` 放进 `required`。

### 5.7 `analyze` 应归为治理型增强节点

`analyze` 是跨产物一致性检查。它强烈受益于项目上下文，但并不要求先具备完整上下文才能工作。

因此最终决策是：

- 不设置 `required`
- 把 `summary`、`critical-flows`、`structure-overview` 提升到 `recommended`

## 6. 最终 YAML 配置

```yaml
# ============================================================
# Skill 输入上下文配置
#
# 设计原则：
#   只喂能提升决策质量的最小充分上下文
#
# 分类策略（二次分层）：
#   - 工具型：required: []，尽量去项目化
#   - 定义型：required: []，新项目入口
#   - 规划型：required: []，基于定义产物工作
#   - 执行型：required: []，summary 降级为 recommended
#   - 恢复型/收尾型：required: [summary]
#   - 治理型：required: []，轻量上下文
#
# 修改此文件后:
#   - 运行 `spec-first skill inject-context` 更新 SKILL.md
#   - 无需修改代码
# ============================================================

auto_inject: true

skip_injection:
  - first   # 00-first/SKILL.md - first 本身负责生成上下文
  - init    # 01-init/SKILL.md - init 在 first 之前执行，无上下文可用

defaults:
  required: []
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
  # 工具型 (3 个) — 聚焦动作本身，尽量去项目化
  # ═══════════════════════════════════════════════════════════

  doctor:
    required: []
    recommended: []
    optional: [summary]

  onboarding:
    required: []
    recommended: []
    optional: [summary]

  feature:
    required: []
    recommended: []
    optional: [summary]

  # ═══════════════════════════════════════════════════════════
  # 定义型 (4 个) — 新项目入口，从无到有定义
  # ═══════════════════════════════════════════════════════════

  spec:
    required: []
    recommended: [domain-model, conventions, critical-flows]
    optional: []

  design:
    required: []
    recommended: [summary, structure-overview, api-contracts, critical-flows, conventions]
    optional: [steering]

  focus-requirements:
    required: []
    recommended: [summary, domain-model, critical-flows, conventions]
    optional: [entry-guide]

  spec-review:
    required: []
    recommended: [domain-model, conventions, critical-flows]
    optional: []

  # ═══════════════════════════════════════════════════════════
  # 规划型 (4 个) — 基于定义产物工作
  # ═══════════════════════════════════════════════════════════

  task:
    required: []
    recommended: [summary, entry-guide, critical-flows, structure-overview, conventions]
    optional: [api-contracts]

  plan:
    required: []
    recommended: [summary, entry-guide, critical-flows, structure-overview, conventions]
    optional: [api-contracts]

  orchestrate:
    required: []
    recommended: [summary, entry-guide, critical-flows, structure-overview, conventions]
    optional: [api-contracts]

  research:
    required: []
    recommended: [summary, critical-flows, api-contracts, domain-model]
    optional: []

  # ═══════════════════════════════════════════════════════════
  # 执行型 (3 个) — 强烈受益于上下文，但允许降级工作
  # ═══════════════════════════════════════════════════════════

  code:
    required: []
    recommended: [summary, conventions, entry-guide, structure-overview, critical-flows]
    optional: [api-contracts]

  review:
    required: []
    recommended: [summary, conventions, entry-guide, structure-overview, critical-flows]
    optional: [api-contracts]

  verify:
    required: []
    recommended: [summary, critical-flows, conventions, entry-guide]
    optional: [database-schema]

  # ═══════════════════════════════════════════════════════════
  # 恢复型 / 收尾型 (2 个) — 必须有项目上下文
  # ═══════════════════════════════════════════════════════════

  catchup:
    required: [summary]
    recommended: [entry-guide, structure-overview, steering, conventions]
    optional: []

  archive:
    required: [summary]
    recommended: [structure-overview, domain-model]
    optional: []

  # ═══════════════════════════════════════════════════════════
  # 治理型 (3 个) — 可增强但不阻塞
  # ═══════════════════════════════════════════════════════════

  status:
    required: []
    recommended: [summary]
    optional: [critical-flows, structure-overview, domain-model]

  sync:
    required: []
    recommended: [summary]
    optional: [entry-guide, structure-overview, api-contracts]

  analyze:
    required: []
    recommended: [summary, critical-flows, structure-overview]
    optional: [domain-model]
```

## 7. 新项目 vs 存量项目入口对比

| 场景 | 入口 Skill | 后续流程 |
|------|-----------|---------|
| 新项目（无代码） | `/spec-first:spec` | spec → design → task → 写代码 → first → 后续迭代 |
| 存量项目（有代码，无上下文） | `/spec-first:first` | first → 后续所有 skill |
| 存量项目（有上下文） | `/spec-first:catchup` | catchup → 恢复上下文后继续 |

## 8. 实施顺序

### 阶段 1：更新配置真相源

修改 `skills/spec-first/skill-input-contracts.yaml`，按第 6 节的 YAML 配置更新。

### 阶段 2：同步注入展示

运行：

```bash
spec-first skill inject-context --force
```

目标：让各个 `SKILL.md` 的输入上下文章节与最终策略一致。

### 阶段 3：更新 SKILL.md 场景路由

为定义型、规划型、执行型 skill 的 SKILL.md 补充场景路由说明：

```markdown
## 适用场景

### ✅ 适用
- 新项目：从零开始定义需求/设计
- 存量项目：迭代需求/设计优化

### ❌ 不适用 → 路由到其他 skill
| 场景 | 路由到 |
|------|--------|
| 需要恢复项目上下文 | `/spec-first:catchup` |
| 需要生成项目认知 | `/spec-first:first` |
```

### 阶段 4：校验运行时语义

检查：

- `context-resolver.ts` 是否按预期消费 `required` 和 `recommended`
- 定义型 skill 在无 `summary` 时是否正常工作
- 执行型 skill 在无 `summary` 时是否降级工作

## 9. 最终结论

核心变化：

1. **流程型 skill 二次分层**：定义型/规划型/执行型/恢复型/收尾型
2. **定义型 skill 去 `summary` 依赖**：`spec`、`design`、`focus-requirements`、`spec-review` 的 `required: []`
3. **执行型 skill `summary` 降级**：`code`、`review`、`verify` 的 `required: []`，`summary` 移至 `recommended`
4. **新项目入口明确**：从 `/spec-first:spec` 开始，而非 `/first`

这是当前最稳、最清晰、最可执行的终态方案。
