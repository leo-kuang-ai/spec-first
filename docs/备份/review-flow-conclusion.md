# Spec-First 流程深度审查结论

> 审查日期: 2026-02-06
> 审查人: Leo
> 版本: v2.0（深度重构版）
> 参考标准: Spec-Kit、Autospec、ISO/IEC 12207、V-Model、SAFe
> 核心结论: **当前 18 节点的根本问题不是"缺什么"，而是混了两个维度——主流程与支撑机制未分离。建议重构为"7 阶段 + 3 横切机制"模型。**

---

## 📊 审查维度

| 维度 | 评分 | 说明 |
|------|------|------|
| 完整性 | ⚠️ 6/10 | 缺少测试、部署、API 设计等关键节点 |
| 逻辑性 | ✅ 8/10 | 节点间流转逻辑清晰，但闭环不完整 |
| 可执行性 | ⚠️ 7/10 | 部分节点产出物定义明确，但缺少工具支撑 |
| 可追溯性 | ✅ 9/10 | Spec-as-Code 思路清晰，追溯链完整 |

---

## 🔴 关键缺口（必须补充）

### 1. 测试节点缺失

| 节点 | 英文名称 | 产出物 | 优先级 |
|------|---------|--------|--------|
| 测试用例设计 | `spec-first-Test-Design` | Test Case Matrix (AC → Case 映射) | **P0** |
| 测试执行 | `spec-first-Test-Execution` | Test Report, Coverage Matrix | **P0** |
| 验收测试 | `spec-first-UAT` | UAT Sign-off | **P0** |

**问题**: AC 定义在 PRD 中，但缺少将 AC 转化为可执行测试用例的环节。

### 2. API 契约节点缺失

| 节点 | 英文名称 | 产出物 | 优先级 |
|------|---------|--------|--------|
| API 设计 | `spec-first-API-Design` | OpenAPI Spec, Schema Definitions | **P0** |

**问题**: API 是前后端/微服务的核心契约，应独立设计并评审。
**归属**: 设计阶段（Technical-Design 之后）。依据 Spec-Kit 标准，`contracts/` 与 `data-model.md` 同属 plan 阶段 Phase 1: Design 的产出物，而非需求阶段。

---

## 🟡 次要缺口（建议补充）

### 4. 质量保障节点

| 节点 | 英文名称 | 产出物 | 优先级 |
|------|---------|--------|--------|
| 安全评审 | `spec-first-Security-Review` | Security Audit Report | **P1** |
| 性能测试 | `spec-first-Performance-Test` | Perf Benchmark Report | **P2** |
| 数据建模 | `spec-first-Data-Modeling` | ERD, State Machine Diagram | **P2** |

### 5. 流程闭环节点

| 节点 | 英文名称 | 产出物 | 优先级 |
|------|---------|--------|--------|
| 规范质量检查 | `spec-first-Spec-Quality-Check` | Spec Completeness Report | **P1** |
| 项目复盘 | `spec-first-Retrospective` | Retro Report, Action Items | **P2** |
| 规范版本管理 | `spec-first-Spec-Versioning` | Spec Change Log, Version Mapping | **P1** |

---

## ⚪ 流程优化建议

### 1. Project-Scaffolding 位置调整

**现状**: 作为第 11 个节点
**建议**: 移至流程起始，作为前置节点（第 0 步）

### 2. 节点合并建议

| 原节点 | 建议合并为 | 理由 |
|--------|-----------|------|
| Requirements-Analysis + Structured-PRD | `spec-first-Spec-Definition` | 分析与文档化是连续过程 |
| Task-Decomposition + Task-Review | `spec-first-Planning` | 拆解与评审通常在同一会议 |

### 3. 产出物标准化

建议为每个节点定义标准产出物模板：
- `.spec.md` - 规范定义
- `.adr.md` - 架构决策记录
- `.test.md` - 测试用例
- `.rfc.md` - 变更请求

---

## 📋 完整节点清单（修订后）

```
前置阶段:
├── 00. Project-Scaffolding (项目脚手架)

需求阶段:
├── 01. Requirements-Analysis (需求分析)
├── 02. Structured-PRD (结构化 PRD)
└── 03. Requirements-Review (需求评审)

设计阶段:
├── 04. Technical-Design (技术设计)
├── 05. API-Design (API 契约设计) [新增，参考 Spec-Kit contracts/]
├── 06. Data-Modeling (数据建模) [新增，参考 Spec-Kit data-model.md]
└── 07. Design-Compliance-Review (设计评审)

规划阶段:
├── 08. Task-Decomposition (任务拆解)
├── 09. Task-Review (任务评审)
└── 10. Spec-Quality-Check (规范质量检查) [新增]

开发阶段:
├── 11. Spec-Driven-Dev (规范驱动开发)
└── 12. Spec-Code-CR (代码评审)

测试阶段:
├── 13. Test-Design (测试用例设计) [新增]
├── 14. Test-Execution (测试执行) [新增]
├── 15. Security-Review (安全评审) [新增]
└── 16. UAT (验收测试) [新增]

收尾阶段:
├── 17. Change-Management (变更管理)
└── 18. Retrospective (复盘与文档整理) [新增]

⚠️ 发布阶段（Deployment / Release / Observability）由现有 DevOps 系统承载，在收尾阶段之后执行。
```

---

## 🔬 深度审查：结构性问题（对标 Spec-Kit / Autospec / ISO 12207）

> 以下审查基于 Spec-Kit、Autospec、ISO/IEC 12207、V-Model、SAFe 等标准框架的交叉对比。

### 问题 1：主流程与支撑机制混为一体

**现象**：18 个节点中有 6 个是 Review/Check 类节点（占 1/3）。

| 类型 | 节点 |
|------|------|
| Review | 03. Requirements-Review, 07. Design-Compliance-Review, 09. Task-Review, 12. Spec-Code-CR |
| Check | 10. Spec-Quality-Check, 15. Security-Review |

**对标**：
- **ISO/IEC 12207**：评审属于"支撑过程"，不是"主过程"
- **Spec-Kit**：只有 1 个 `analyze` 节点，Review 是阶段出口的 Quality Gate
- **SAFe**：Review 内嵌在 Definition of Done 中，不是独立 Sprint 活动

**结论**：Review 应该是阶段间的**准出条件（Exit Criteria）**，不是独立的顶级节点。

### 问题 2：节点粒度不一致

**现象**：有些是"阶段"级别，有些是"活动"级别，有些是"检查点"级别。

| 级别 | 节点示例 | 说明 |
|------|---------|------|
| 阶段 | Requirements-Analysis, Technical-Design | 正确粒度 |
| 活动 | API-Design, Data-Modeling | 是 Technical-Design 的子产出物 |
| 检查点 | Spec-Quality-Check, Security-Review | 是 Quality Gate，不是独立阶段 |

**对标 Spec-Kit**：`plan` 阶段内部包含 Phase 0: Research 和 Phase 1: Design（data-model.md, contracts/）。它不会把 data-model 和 contracts 拆成独立的顶级节点。

**结论**：API-Design 和 Data-Modeling 应该是 Technical-Design 的**子产出物**，不是平级节点。

### 问题 3：Change-Management 不应是线性节点

**现象**：Change-Management 放在收尾阶段（17号），暗示"变更只在最后处理"。

**对标**：
- **ISO 12207**：变更管理是"支撑过程"，贯穿全生命周期
- **CMMI REQM**：需求管理是持续活动，不是阶段节点
- **Spec-Kit**：无独立 Change-Management 节点，通过 `git diff` + spec 版本管理自然处理

**结论**：Change-Management 是**横切关注点（Cross-cutting Concern）**，任何阶段都可能触发，不应固定在某个位置。

### 问题 4：缺少 Spec-Kit 的 Constitution 和 Clarify 概念

**Constitution（项目宪法）**：
- Spec-Kit 在一切开始前定义不可违背的项目原则（性能底线、安全红线、技术偏好）
- 当前 00. Scaffolding 只生成代码骨架，缺少"原则定义"环节

**Clarify（需求澄清）**：
- Spec-Kit 在 specify 之后自动扫描 `[NEEDS CLARIFICATION]` 标记，生成结构化问题
- 当前 PRD 写完直接进 Review，缺少系统化的歧义消除环节

**结论**：Constitution 应融入 Init 阶段，Clarify 应作为 Specify 阶段的子步骤。

### 问题 5：缺少 Spec-Consistency-Analysis（Spec-First 最该有的节点）

**Spec-Kit 的 `/speckit.analyze` 做什么**：
- spec.md ↔ plan.md ↔ tasks.md ↔ data-model.md ↔ contracts/ 跨产物一致性校验
- 需求覆盖率检查（每个 FR 是否有对应 Task）
- Constitution 合规检查

**当前流程**：10. Spec-Quality-Check 定位模糊，仅在规划阶段出现一次。

**结论**：应重新定义为 **Spec-Consistency-Analysis**，作为可在多个阶段触发的横切校验机制，而非固定位置的节点。

### 问题 6：流程作用域未定义

**现象**：18 个节点是严格线性排列，隐含瀑布模型假设。

**对标**：
- **Spec-Kit / Autospec**：流程是 **Feature 级别**的，每个 Feature 独立走一遍
- **SAFe / Scrum**：以 Sprint 为单位迭代

**问题**：如果是 Feature 级别，18 步太重，团队会抵触。如果是项目级别，缺少迭代机制。

**结论**：需明确流程作用域为 **Feature 级别**，并区分"每次必走"的核心节点和"按需触发"的可选节点。


---

## 🎯 重构方案：7 阶段 + 3 横切机制

### 核心思路

将 18 个扁平节点重构为两个维度：

| 维度 | 定义 | 数量 |
|------|------|------|
| **主流程阶段** | 线性推进的核心步骤（Feature 级别） | 7 个 |
| **横切机制** | 贯穿全流程的质量保障能力 | 3 个 |


### 主流程：7 个阶段

#### 00. Init（初始化）

| 维度 | 内容 |
|------|------|
| **对标** | Spec-Kit `init` + `constitution` |
| **活动** | 项目脚手架生成 + 项目原则定义（Constitution） |
| **产出物** | 项目骨架、constitution.md（不可违背的原则） |
| **Exit Gate** | 项目结构可运行，原则文档已评审 |

#### 01. Specify（需求规格化）

| 维度 | 内容 |
|------|------|
| **对标** | Spec-Kit `specify` + `clarify` |
| **活动** | 需求分析 → 结构化 PRD → 需求澄清 |
| **产出物** | spec.md（User Stories, AC, NFS, Key Entities） |
| **Exit Gate** | DoR Sign-off，无 [NEEDS CLARIFICATION] 标记 |

#### 02. Design（技术设计）

| 维度 | 内容 |
|------|------|
| **对标** | Spec-Kit `plan` (Phase 0: Research + Phase 1: Design) |
| **活动** | 技术选型 → API 契约设计 → 数据建模 → 架构决策 |
| **产出物** | plan.md, contracts/, data-model.md, ADR |
| **Exit Gate** | 设计评审通过，Spec-Consistency-Analysis 通过 |

#### 03. Plan（任务规划）

| 维度 | 内容 |
|------|------|
| **对标** | Spec-Kit `tasks`、Autospec `tasks` |
| **活动** | 任务拆解 → 依赖分析 → 工作量估算 |
| **产出物** | tasks.md（WBS, Dependency Map, Velocity） |
| **Exit Gate** | 任务评审通过，Spec-Consistency-Analysis 通过 |

#### 04. Implement（规范驱动开发）

| 维度 | 内容 |
|------|------|
| **对标** | Spec-Kit `implement`（TDD）、Autospec `implement` |
| **活动** | 按任务清单开发 → TDD → Code Review |
| **产出物** | 代码实现、单元测试、Code CR Report |
| **Exit Gate** | CR 通过，测试覆盖率达标 |

#### 05. Verify（验证）

| 维度 | 内容 |
|------|------|
| **对标** | V-Model 系统测试 + 验收测试 |
| **活动** | 集成测试 → 安全扫描 → UAT |
| **产出物** | Test Report, UAT Sign-off |
| **Exit Gate** | 全部 AC 通过，安全扫描无高危 |

#### 06. Wrap-up（收尾）

| 维度 | 内容 |
|------|------|
| **对标** | SAFe Sprint Retrospective |
| **活动** | 复盘 → 文档整理 → 规范同步 |
| **产出物** | Retro Report, 更新后的 Spec 文档 |
| **Exit Gate** | 文档完整，规范与代码一致 |

→ **DevOps 发布**

### 横切机制：3 个贯穿全流程的能力

#### A. Quality Gate（质量门禁）

每个阶段的出口都有 Review 作为准出条件，不再作为独立节点。

| 阶段 | Gate 内容 |
|------|----------|
| 01. Specify | DoR Sign-off（需求评审） |
| 02. Design | 设计评审 + Baseline Locking |
| 03. Plan | 任务评审 + 估算确认 |
| 04. Implement | Code CR + 测试覆盖率 |
| 05. Verify | UAT Sign-off |
| 06. Wrap-up | 文档完整性检查 |

#### B. Spec-Consistency-Analysis（规范一致性校验）

对标 Spec-Kit `/speckit.analyze`，可在多个阶段触发：

| 触发时机 | 校验内容 |
|---------|---------|
| Design 完成后 | spec ↔ design 一致性 |
| Plan 完成后 | spec ↔ tasks 覆盖率 |
| Implement 完成后 | spec ↔ code 契约审计 |

#### C. Change-Management（变更管理）

贯穿全流程，任何阶段均可触发：

| 触发条件 | 动作 |
|---------|------|
| 需求变更 | RFC → Impact Analysis → Spec 更新 → 受影响阶段回退 |
| 设计变更 | ADR 更新 → 下游产物同步 |
| 实现偏差 | 评估是否需要更新 Spec |


---

## 📊 新旧对照：18 节点 → 7 阶段映射

| 原 18 节点 | 归入重构后 | 变化 |
|-----------|-----------|------|
| 00. Scaffolding | **00. Init** | 增加 Constitution |
| 01. Requirements-Analysis | **01. Specify** | 合并 |
| 02. Structured-PRD | **01. Specify** | 合并 |
| 03. Requirements-Review | 01. Specify 的 **Exit Gate** | 降级为门禁 |
| 04. Technical-Design | **02. Design** | 保留 |
| 05. API-Design | 02. Design 的**子产出物** | 降级 |
| 06. Data-Modeling | 02. Design 的**子产出物** | 降级 |
| 07. Design-Compliance-Review | 02. Design 的 **Exit Gate** | 降级为门禁 |
| 08. Task-Decomposition | **03. Plan** | 保留 |
| 09. Task-Review | 03. Plan 的 **Exit Gate** | 降级为门禁 |
| 10. Spec-Quality-Check | **横切机制 B** (Consistency Analysis) | 升级为横切 |
| 11. Spec-Driven-Dev | **04. Implement** | 保留 |
| 12. Spec-Code-CR | 04. Implement 的 **Exit Gate** | 降级为门禁 |
| 13. Test-Design | **05. Verify** | 合并 |
| 14. Test-Execution | **05. Verify** | 合并 |
| 15. Security-Review | 05. Verify 的**子活动** | 降级 |
| 16. UAT | 05. Verify 的 **Exit Gate** | 降级为门禁 |
| 17. Change-Management | **横切机制 C** | 升级为横切 |
| 18. Retrospective | **06. Wrap-up** | 保留 |


---

## 📊 重构后流程可视化

```
00. Init (Scaffolding + Constitution)
     │
     ▼
01. Specify (Analysis + PRD + Clarify)
     │                    ← Exit Gate: DoR Sign-off
     ▼
02. Design (Tech + API + Data Model)
     │                    ← Exit Gate: Design Review
     │                    ← Spec-Consistency-Analysis
     ▼
03. Plan (Tasks + Dependencies + Estimation)
     │                    ← Exit Gate: Task Review
     │                    ← Spec-Consistency-Analysis
     ▼
04. Implement (Spec-Driven Dev + TDD + CR)
     │                    ← Exit Gate: Code CR
     │                    ← Spec-Consistency-Analysis
     ▼
05. Verify (Integration Test + Security + UAT)
     │                    ← Exit Gate: UAT Sign-off
     ▼
06. Wrap-up (Retrospective + Docs)
     │
     ▼
☁️ DevOps Release

横切机制（贯穿全流程）:
├── A. Quality Gate — 每个阶段的准出条件
├── B. Spec-Consistency-Analysis — 跨产物一致性校验
└── C. Change-Management — 变更管理（任何阶段可触发）
```


---

## 🎯 最终结论

### 通用性评估

| 维度 | 原 18 节点 | 重构后 7+3 | 说明 |
|------|-----------|-----------|------|
| Feature 级可用性 | ❌ 过重 | ✅ 轻量 | 7 步可在单个 Feature 内闭环 |
| 团队接受度 | ⚠️ 18 步阻力大 | ✅ 核心 7 步易推行 | 门禁隐式执行，不增加负担 |
| 标准对齐 | ⚠️ 混合维度 | ✅ 对齐 ISO 12207 | 主过程与支撑过程分离 |
| Spec-First 契合度 | ⚠️ 缺 analyze | ✅ 横切机制 B | 一致性校验贯穿全流程 |
| 工具链可映射 | ⚠️ 节点过多 | ✅ 7 阶段映射 Jira | 每个阶段对应一个 Jira Status |


### 核心建议

1. **采用 7+3 模型**替代 18 节点扁平结构
2. **Review 降级为 Gate**，减少流程节点但不降低质量
3. **补充 Constitution**（项目原则）和 **Clarify**（需求澄清）
4. **Spec-Consistency-Analysis 升级为横切机制**，多阶段触发
5. **明确作用域为 Feature 级别**，项目级别通过多 Feature 迭代覆盖


### ⚠️ 风险提醒（完美主义陷阱）

当前 7+3 模型是"理想态"。落地建议：
- **第一步**：先用 7 阶段跑通一个 Feature，验证可行性
- **第二步**：逐步引入横切机制（先 Gate，再 Analyze，最后 Change-Management）
- **不要**一次性推行全部，避免过度设计

---

**审查人**: Leo (况雨平)
**文档版本**: v2.0
**更新日期**: 2026-02-06
