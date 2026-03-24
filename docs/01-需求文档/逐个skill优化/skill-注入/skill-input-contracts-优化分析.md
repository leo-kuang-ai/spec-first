# Skill 输入上下文配置优化分析

> **分析视角**: 顶尖 Google 研发专家
> **日期**: 2026-03-23
> **目标文件**: `skills/spec-first/skill-input-contracts.yaml`

---

## 1. 分类框架

从职责本质出发，将 17 个 skill 分为三层：

| 层级 | 类型 | 特征 | 需要项目信息？ |
|------|------|------|----------------|
| **L1** | 纯工具 | 操作宿主/系统环境，不关心项目内容 | ❌ 不需要 |
| **L2** | 轻量工具 | 需知道"当前在哪个项目"即可执行 | ⚠️ 可选 |
| **L3** | 研发流程 | 需理解项目背景、约束、代码结构才能正确执行 | ✅ 必需 |

---

## 2. 逐层分析与当前配置评估

### L1: 纯工具类 (4 个)

| Skill | 职责 | 当前配置 | 问题 | 建议配置 |
|-------|------|----------|------|----------|
| `init` | 初始化 spec-first 配置 | `skip_injection` | ✅ 正确 | 保持 |
| `first` | 生成项目认知产物 | `skip_injection` | ✅ 正确 | 保持 |
| `doctor` | 环境诊断 | `required: [summary]` | ❌ **错误** | `required: []` |
| `onboarding` | 工具使用引导 | `required: [], optional: [summary]` | ✅ 正确 | 保持 |

**`doctor` 问题分析**：
- doctor 检查的是"spec-first 是否正确安装"、"宿主配置是否完整"、"CLI 是否可用"
- 这些检查与项目内容无关，即使空目录也能运行
- 强制 `summary` 导致新用户在没有运行 `first` 之前就无法使用 `doctor`，这是不合理的设计

### L2: 轻量工具类 (5 个)

| Skill | 职责 | 当前配置 | 问题 | 建议配置 |
|-------|------|----------|------|----------|
| `feature` | Feature 查询/切换 | `required: [summary]` | ⚠️ 过重 | `required: []` |
| `sync` | 同步文档索引 | `required: [summary]` | ⚠️ 过重 | `required: []` |
| `status` | 输出状态概览 | `required: [summary]` | ⚠️ 过重 | `required: []` |
| `archive` | 归档复盘 | `required: [summary]` | ⚠️ 过重 | `required: []` |
| `analyze` | 一致性分析 | `required: [summary]` | ⚠️ 偏重 | 可保留 |

**问题分析**：
- 这些 skill 的核心操作是"读取 `.spec-first/` 下的状态文件"
- 它们不依赖对项目的"理解"，只依赖状态文件的存在
- `summary` 是认知产物，用于"理解项目"，不是"定位文件"的必要条件
- 当前配置把它们当作 L3 处理，增加了不必要的启动成本

### L3: 研发流程类 (8 个)

| Skill | 职责 | 当前配置 | 评估 |
|-------|------|----------|------|
| `catchup` | 恢复上下文 | `required: [summary]` | ✅ 合理 |
| `spec` | 需求规格 | `required: [summary]` | ✅ 合理 |
| `spec-review` | 规格审查 | `required: [summary]` | ✅ 合理 |
| `design` | 技术设计 | `required: [summary]` | ✅ 合理 |
| `research` | 技术调研 | `required: [summary]` | ✅ 合理 |
| `task` / `plan` | 任务拆解 | `required: [summary]` | ✅ 合理 |
| `orchestrate` | 执行编排 | `required: [summary]` | ✅ 合理 |
| `code` | 代码实现 | `required: [summary]` | ✅ 合理 |
| `review` | 实现审查 | `required: [summary]` | ✅ 合理 |
| `verify` | 阶段验收 | `required: [summary]` | ✅ 合理 |

**评估**：L3 skill 需要理解项目才能正确执行，`summary` 作为必需项是合理的。

---

## 3. 优化建议

### P0: 紧急修复 - `doctor` 配置错误

**现状**：
```yaml
doctor:
  required: [summary]
```

**问题**：doctor 检查的是安装状态，与项目内容无关。强制 summary 导致新用户无法使用。

**建议**：
```yaml
doctor:
  required: []
  recommended: []
  optional: [summary]  # 仅用于提供更精准的诊断建议
```

**影响**：新用户可以在运行 `first` 之前使用 `doctor` 检查安装状态。

---

### P1: 降级处理 - L2 工具类 skill

**现状**：
```yaml
feature:
  required: [summary]
sync:
  required: [summary]
status:
  required: [summary]
archive:
  required: [summary]
```

**问题**：这些 skill 只需要知道"项目在哪里"，不需要"理解项目"。

**建议**：
```yaml
feature:
  required: []
  recommended: [structure-overview]
  optional: [summary]

sync:
  required: []
  recommended: [entry-guide, structure-overview]
  optional: [api-contracts]

status:
  required: []
  recommended: [critical-flows, structure-overview]
  optional: [summary]

archive:
  required: []
  recommended: [structure-overview]
  optional: [domain-model, summary]
```

**影响**：这些工具可以在没有 `summary` 的情况下正常工作，降低启动门槛。

---

### P2: 引入轻量级上下文产物

**问题**：当前设计只有"全量理解"（summary 等 9 个产物），没有"最小定位"产物。

**建议**：考虑引入 `feature-context` 产物：

```yaml
descriptions:
  feature-context: 当前 Feature 的最小定位信息（ID、阶段、目录路径）
```

**用途**：
- L2 工具只需要 `feature-context` 即可执行
- L3 研发流程需要完整的 `summary` + 其他产物

**权衡**：
- 优点：进一步降低 L2 工具的启动成本
- 缺点：增加产物复杂度，需要评估是否值得

---

### P3: 为 L3 skill 增加阶段输入提示

**问题**：当前配置只描述"需要什么产物"，没有描述"产物应该在哪个阶段存在"。

**建议**：在 SKILL.md 模板中增加阶段提示：

```markdown
## 输入上下文

> 此 Skill 在 03_plan 阶段执行，期望以下产物已存在：
> - `summary` — 由 `first` skill 在 00_init 阶段生成
> - `entry-guide` — 由 `first` skill 在 00_init 阶段生成
```

**影响**：帮助用户理解"为什么需要这些产物"以及"什么时候生成"。

---

## 4. 配置变更清单

### 4.1 必须修改（P0）

```yaml
# 15-doctor/SKILL.md
doctor:
  required: []  # 从 [summary] 改为 []
  recommended: []
  optional: [summary]
```

### 4.2 建议修改（P1）

```yaml
# 17-feature/SKILL.md
feature:
  required: []  # 从 [summary] 改为 []
  recommended: [structure-overview]
  optional: [summary, entry-guide]

# 16-sync/SKILL.md
sync:
  required: []  # 从 [summary] 改为 []
  recommended: [entry-guide, structure-overview]
  optional: [api-contracts]

# 14-status/SKILL.md
status:
  required: []  # 从 [summary] 改为 []
  recommended: [critical-flows, structure-overview]
  optional: [domain-model, summary]

# 10-archive/SKILL.md
archive:
  required: []  # 从 [summary] 改为 []
  recommended: [structure-overview]
  optional: [domain-model, summary]
```

### 4.3 可选优化（P2-P3）

- P2: 评估是否需要 `feature-context` 轻量产物
- P3: 在模板中增加阶段提示

---

## 5. 决策矩阵

| 优先级 | 变更 | 风险 | 收益 | 建议 |
|--------|------|------|------|------|
| P0 | doctor required: [] | 低 | 高 | **立即执行** |
| P1 | L2 工具降级 | 低 | 中 | **建议执行** |
| P2 | feature-context 产物 | 中 | 中 | 需评估 |
| P3 | 阶段输入提示 | 低 | 低 | 可选 |

---

## 6. 总结

当前配置的主要问题是**过度依赖 `summary`**：

1. **L1 工具误配**：`doctor` 不需要任何项目信息即可执行
2. **L2 工具过重**：`feature/sync/status/archive` 只需要定位信息，不需要理解项目
3. **L3 配置正确**：研发流程类 skill 确实需要完整的项目认知

优化后，用户可以在更早的阶段使用更多工具，同时不影响 L3 skill 的质量保障。

---

> **下一步**：确认后执行 P0 + P1 变更，更新 `skill-input-contracts.yaml` 并重新注入 SKILL.md
