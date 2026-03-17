---
title: First Skill 完整性、一致性、合理性审查报告
date: 2026-03-16
author: Claude
status: review
version: 1.0
---

# First Skill 完整性、一致性、合理性审查报告

## 一、审查范围

| 类别 | 文件数 | 审查内容 |
|------|--------|----------|
| **规格定义** | 13 | SKILL.md + 12 个 references 文件 |
| **运行时实现** | 30 | `src/core/skill-runtime/first-*.ts` |
| **实际产物** | 27 | 10 Runtime JSON + 16 Docs + 1 index |
| **映射定义** | 1 | `first-artifact-mapping.ts` |

---

## 二、完整性审查

### 2.1 SKILL.md 定义的产物 vs 实际产物

| SKILL.md 定义 | 模式 | 实际 Runtime | 实际 Docs | 状态 |
|--------------|------|-------------|----------|------|
| `README.md` | quick+deep | N/A（投影聚合） | ✅ 存在 | ✅ 完整 |
| `tech-stack.md` | quick | ❌ 无 | ✅ 存在（Legacy） | ⚠️ 无 Runtime |
| `api-docs.md` | quick | ❌ 无 | ✅ 存在（Legacy） | ⚠️ 无 Runtime |
| `codebase-overview.md` | quick | ❌ 无 | ✅ 存在（Legacy） | ⚠️ 无 Runtime |
| `domain-model.md` | quick | ❌ 无 | ✅ 存在（Legacy） | ⚠️ 无 Runtime |
| `database-er.md` | quick（条件） | ❌ 无 | ❌ 不存在 | ❌ **缺失** |
| `call-graph.md` | deep | ❌ 无 | ❌ 不存在 | ❌ **缺失** |
| `architecture.md` | deep | ❌ 无 | ❌ 不存在 | ❌ **缺失** |
| `external-deps.md` | deep | ❌ 无 | ❌ 不存在 | ❌ **缺失** |
| `local-setup.md` | deep | ❌ 无 | ❌ 不存在 | ❌ **缺失** |
| `development-guidelines.md` | deep | ❌ 无 | ❌ 不存在 | ❌ **缺失** |

### 2.2 实际存在但 SKILL.md 未定义的产物

| 实际产物 | 来源 | SKILL.md 应更新 |
|----------|------|-----------------|
| `summary.md` | `summary.json` 投影 | ✅ 需添加 |
| `role-views.md` | `role-views.json` 投影 | ✅ 需添加 |
| `stage-views.md` | `stage-views.json` 投影 | ✅ 需添加 |
| `steering.md` | `steering.json` 投影 | ✅ 需添加 |
| `conventions.md` | `conventions.json` 投影 | ✅ 需添加 |
| `critical-flows.md` | `critical-flows.json` 投影 | ✅ 需添加 |
| `change-map.md` | `change-map.json` 投影 | ✅ 需添加 |
| `entry-guide.md` | `entry-guide.json` 投影 | ✅ 需添加 |
| `reboot-guide.md` | `reboot-guide.json` 投影 | ✅ 需添加 |
| `common-playbooks.md` | 多源派生 | ✅ 需添加 |
| `known-risks-and-traps.md` | 多源派生 | ✅ 需添加 |

### 2.3 Agent 规格文件定义的产物 vs 实现

| Agent | 规格文件定义 | Runtime 实现 | 状态 |
|-------|-------------|-------------|------|
| A1 | `codebase-overview.md` + 模块清单 | ❌ 无 Runtime | ⚠️ Legacy |
| A2 | `architecture.md` | ❌ 无 Runtime + 无 Docs | ❌ **未实现** |
| A3 | `call-graph.md` | ❌ 无 Runtime + 无 Docs | ❌ **未实现** |
| B | `api-docs.md` | ❌ 无 Runtime | ⚠️ Legacy |
| C1 | `external-deps.md` | ❌ 无 Runtime + 无 Docs | ❌ **未实现** |
| C2 | `development-guidelines.md` + `local-setup.md` | ❌ 无 Runtime + 无 Docs | ❌ **未实现** |
| D | `database-er.md` | ❌ 无 Runtime + 无 Docs | ❌ **未实现** |
| A4 | `domain-model.md` | ❌ 无 Runtime | ⚠️ Legacy |
| E | `database-er.md`（条件） | ❌ 无 Runtime + 无 Docs | ❌ **未实现** |

### 2.4 Runtime 资产完整性

| 资产 | `FIRST_RUNTIME_ARTIFACTS` | 实际文件 | `index.json` 追踪 |
|------|---------------------------|----------|-------------------|
| `summary.json` | ✅ | ✅ | ✅ |
| `role-views.json` | ✅ | ✅ | ✅ |
| `stage-views.json` | ✅ | ✅ | ✅ |
| `steering.json` | ✅ | ✅ | ✅ |
| `conventions.json` | ✅ | ✅ | ✅ |
| `critical-flows.json` | ✅ | ✅ | ✅ |
| `change-map.json` | ✅ | ✅ | ✅ |
| `entry-guide.json` | ✅ | ✅ | ✅ |
| `reboot-guide.json` | ✅ | ✅ | ✅ |
| `modules.json` | ❌ **缺失** | ✅ 存在 | ❌ **孤儿** |

---

## 三、一致性审查

### 3.1 Agent 派发波次一致性

**SKILL.md 定义**：
```
quick: A, B, C, D 并行 → E 条件派发
deep: 波1(A1,A3,B,C1,C2) → 波2(A2,D) → 波3(A4)
```

**execution-flow.md 定义**：
```
quick: 波1(A,B,C,D) → 波2(E)
deep: 波1(A1,A3,B,C1,C2) → 波2(A2,D) → 波3(A4)
```

**一致性**：✅ 一致

### 3.2 超时策略一致性

| 文档 | quick 单 Agent | quick 总 | deep 单 Agent | deep 总 |
|------|---------------|----------|---------------|---------|
| SKILL.md | 60s | 120s | 60s | 300s |
| subagent-architecture.md | 60s | 120s | 60s | 300s |

**一致性**：✅ 一致

### 3.3 证据标注规则一致性

| 文档 | 要求 |
|------|------|
| SKILL.md | deep 模式核心结论必须有证据 |
| quality-assurance-rules.md | 定义 3 种证据类型 + 抽样规模 |
| agents-*.md | 各 Agent 定义具体抽样规模 |

**一致性**：✅ 一致

### 3.4 端类型检测一致性

| 文档 | 端类型数量 |
|------|-----------|
| detection-rules.md | 7 种（backend, frontend, mobile, cross-platform, desktop, monorepo, mixed） |
| execution-flow.md | 7 种 |
| platform-document-mapping.md | 7 种 |

**一致性**：✅ 一致

### 3.5 不一致项汇总

| ID | 问题 | 位置 | 严重程度 |
|----|------|------|----------|
| C1 | `modules.json` 孤儿文件 | Runtime | 🔴 高 |
| C2 | SKILL.md 产物清单与实际不符 | SKILL.md | 🔴 高 |
| C3 | 6 个 deep 产物未实现 | Agent 规格 | 🟠 中 |
| C4 | 4 个 quick 产物无 Runtime | Agent 规格 | 🟠 中 |
| C5 | `PREFIX_FILE_TO_ARTIFACT_MAP` 引用不存在文件 | first-artifact-mapping.ts | 🟡 低 |

---

## 四、合理性审查

### 4.1 架构设计合理性

#### ✅ 合理的设计

| 设计 | 说明 |
|------|------|
| **Runtime → Docs 投影** | 真源在 Runtime，Docs 作为投影，支持增量更新 |
| **Agent 并行派发** | 提升执行效率，quick <5min，deep <5min |
| **Serena 降级策略** | LSP 不可用时降级到静态分析，保证可用性 |
| **证据标注规则** | deep 模式要求证据，提升可信度 |
| **幂等检测** | 增量更新避免重复生成 |

#### ⚠️ 需要改进的设计

| 设计 | 问题 | 建议 |
|------|------|------|
| **Legacy 产物路径** | 4 个产物走独立路径，架构不一致 | 纳入 Runtime 体系 |
| **modules.json 孤儿** | 存在但未被体系追踪 | 纳入或删除 |
| **Deep 产物承诺** | 定义了 6 个产物但未实现 | 标注"规划中"或实现 |

### 4.2 Agent 分工合理性

#### ✅ 合理的分工

| Agent | 职责 | 合理性 |
|-------|------|--------|
| A1 → A2 → A4 | 代码分析链 | 有依赖关系，分波派发合理 |
| B | API 分析 | 独立，可并行 |
| C1/C2 | 外部依赖 + 规范 | 独立，可并行 |
| D | 数据库分析 | 条件派发，有 DB 时才执行 |

#### ⚠️ 需要改进的分工

| Agent | 问题 | 建议 |
|-------|------|------|
| A4 | 依赖 A2+B+D，但 B/D 可能失败 | 已有降级策略，✅ |
| E | 与 D 职责重叠（都是 DB） | 合并为 D |

### 4.3 产物清单合理性

#### ✅ 合理的产物

| 产物 | 用途 | 合理性 |
|------|------|--------|
| `summary.json` | 项目摘要 | 核心资产，被多个 skill 消费 |
| `role-views.json` | 角色视角 | `onboarding` 消费 |
| `stage-views.json` | 阶段视角 | `spec/design/code/verify` 消费 |
| `steering.json` | 导向信息 | 项目级约束 |
| `conventions.json` | 规范 | `spec/design/code` 消费 |
| `critical-flows.json` | 关键链路 | `design/verify` 消费 |
| `change-map.json` | 变更导航 | `task/plan` 消费 |
| `entry-guide.json` | 入口指引 | `task/code` 消费 |
| `reboot-guide.json` | 恢复入口 | `onboarding` 消费 |

#### ⚠️ 需要调整的产物

| 产物 | 问题 | 建议 |
|------|------|------|
| `tech-stack.md` | 无 Runtime，信息已包含在 `steering.json` | 删除或改为投影 |
| `api-docs.md` | 无 Runtime，`code/verify` 无法消费 | 新增 `api-contracts.json` |
| `codebase-overview.md` | 无 Runtime | 可保持 Quick 模式 |
| `domain-model.md` | 无 Runtime，与 `summary.dataModels` 重复 | 合并或投影 |
| `modules.json` | 未被 `FIRST_RUNTIME_ARTIFACTS` 追踪 | 纳入或删除 |

### 4.4 映射规则合理性

#### ✅ 合理的映射

| 映射 | 说明 |
|------|------|
| `package.json` → `tech-stack.md` | 依赖变化影响技术栈 |
| `src/` → `codebase-overview.md` | 源码变化影响概览 |
| `Dockerfile` → `architecture.md` | 部署配置影响架构 |

#### ⚠️ 需要调整的映射

| 映射 | 问题 | 建议 |
|------|------|------|
| `architecture.md` | 目标文件不存在 | 删除映射或实现产物 |
| `call-graph.md` | 目标文件不存在 | 删除映射或实现产物 |
| `external-deps.md` | 目标文件不存在 | 删除映射或实现产物 |
| `database-er.md` | 目标文件不存在 | 删除映射或实现产物 |
| `development-guidelines.md` | 目标文件不存在 | 删除映射或实现产物 |
| `local-setup.md` | 目标文件不存在 | 删除映射或实现产物 |

---

## 五、问题汇总与优先级

### 🔴 严重问题（必须修复）

| ID | 问题 | 影响 | 修复建议 |
|----|------|------|----------|
| P1 | `modules.json` 孤儿文件 | 状态追踪失效 | 纳入 `FIRST_RUNTIME_ARTIFACTS` |
| P2 | SKILL.md 产物清单严重不符 | 文档误导用户 | 同步更新 SKILL.md |
| P3 | 6 个 Deep 产物未实现 | 功能承诺未兑现 | 标注"规划中"或实现 |

### 🟠 中等问题（建议修复）

| ID | 问题 | 影响 | 修复建议 |
|----|------|------|----------|
| P4 | 4 个 Quick 产物无 Runtime | 架构不一致 | 按方案 C 纳入 Runtime |
| P5 | `PREFIX_FILE_TO_ARTIFACT_MAP` 引用不存在文件 | 变更检测失效 | 清理映射 |

### 🟡 轻微问题（可选修复）

| ID | 问题 | 影响 | 修复建议 |
|----|------|------|----------|
| P6 | Agent E 与 D 职责重叠 | 理解成本 | 合并为 D |

---

## 六、修复建议优先级

```
Phase 1（紧急）:
├── P1: 处理 modules.json 孤儿
└── P2: 同步 SKILL.md 产物清单

Phase 2（重要）:
├── P3: Deep 产物标注"规划中"
└── P5: 清理无效映射

Phase 3（优化）:
├── P4: Legacy 产物纳入 Runtime
└── P6: Agent E/D 合并
```

---

## 七、结论

### 完整性评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 规格完整性 | 70% | Agent 规格完整，但产物定义与实现不符 |
| 实现完整性 | 60% | 9/15 产物已实现，6 个 Deep 产物缺失 |
| 追踪完整性 | 90% | 9/10 Runtime 资产已追踪，1 个孤儿 |

### 一致性评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 文档一致性 | 65% | SKILL.md 与实际严重不符 |
| 映射一致性 | 50% | 多处引用不存在的文件 |
| Agent 一致性 | 85% | 派发波次、超时策略一致 |

### 合理性评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 架构合理性 | 80% | Runtime → Docs 投影合理 |
| 分工合理性 | 85% | Agent 分工清晰，依赖合理 |
| 产物合理性 | 75% | 部分产物职责重叠 |

### 总评

| 指标 | 值 |
|------|-----|
| **整体评分** | **72%** |
| **主要问题** | SKILL.md 与实际脱节、6 个 Deep 产物未实现 |
| **核心优势** | Runtime → Docs 投影架构、Agent 并行派发 |
| **建议优先级** | 先修复文档一致性，再实现缺失功能 |
