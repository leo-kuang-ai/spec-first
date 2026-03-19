# Spec-First 研发流程规范 v3.0

> **版本**: v3.0 | **更新**: 2026-02-06 | **作用域**: Feature 级别
> **参考标准**: Spec-Kit、Autospec、SpecifyPlus、TypeSpec、ISO/IEC 12207、V-Model、SAFe
> **核心理念**: 规范即契约、规范即真理、全链路可追踪
> **基于**: v2.0 + 审查报告 13 项改进 + 双模式多端扩展设计 + 全链路追踪体系

---

## v3.0 变更摘要

| 变更类型 | 内容 | 来源 |
|---------|------|------|
| **新增** | 全链路追踪体系（ID 规范 + 追踪矩阵 + 覆盖率算法） | 本次需求 |
| **新增** | 三层规范体系（Layer 0/1/2） | dual-mode-design.md |
| **新增** | 双模式定义（Mode N / Mode I） | dual-mode-design.md |
| **新增** | 规模分级（S/M/L）替代轻量模式 | dual-mode-design.md, P1-3 |
| **新增** | 多端扩展机制（APP/PC/H5/Backend） | dual-mode-design.md |
| **新增** | Design 阶段 Research 子步骤 | P0-2 |
| **新增** | Plan 阶段 Checklist 子产出物 | P1-1 |
| **修复** | Init 阶段项目级/Feature 级边界明确 | P0-1 |
| **修复** | Spec-Consistency-Analysis 触发时机扩展为 5 个 | P0-3 |
| **修复** | 目录结构对齐业界 | P1-4 |
| **优化** | Constitution 模板扩展为 5 维度 | P2-1 |
| **优化** | 任务模板增加并行化标记 | P2-3 |
| **优化** | 产出物模板预留决策记录区域 | P2-4 |

---

## 核心架构

### 三层规范体系

```
┌─────────────────────────────────────────────────┐
│  Layer 0: 通用流程框架（7+3）                      │
│  所有团队、所有模式、所有规模共享                    │
│  定义：流程骨架、阶段定义、横切机制、追踪体系        │
├─────────────────────────────────────────────────┤
│  Layer 1: 模式 × 规模 规则                         │
│  Mode N (New Feature) / Mode I (Iteration)       │
│  Size S / M / L                                  │
│  定义：每种组合下的阶段行为和产出物深度              │
├─────────────────────────────────────────────────┤
│  Layer 2: 端特有规范                               │
│  APP / PC / H5 / Java Backend / ...              │
│  定义：各端的技术约束、质量标准、检查清单            │
│  各端独立维护，按需补录                             │
└─────────────────────────────────────────────────┘
```

- Layer 0 定义"做什么"（流程骨架 + 追踪规则）
- Layer 1 定义"怎么做"（模式差异、产出物深度）
- Layer 2 定义"做到什么标准"（端特有质量标准）

**执行时合并**：Feature 启动时，确定 Mode + Size + 涉及端 → 读取 Layer 0 + 应用 Layer 1 规则 + 合并 Layer 2 规则 = 该 Feature 的定制化流程实例。

### 双模式定义

| 维度 | Mode N（New Feature） | Mode I（Iteration） |
|------|----------------------|---------------------|
| **定义** | 全新功能开发，无历史产物 | 基于已有功能的变更 |
| **起点** | 从空白开始 | 从历史产物开始 |
| **产出物** | 全新创建 | 增量更新（diff 模式） |
| **子类型** | — | Enhancement / Optimization / Bug Fix / Refactoring |

Mode I 相比 Mode N 多出 3 个必须处理的环节：

| 增量 | 说明 | 嵌入位置 |
|------|------|---------|
| **历史产物定位** | 找到并理解已有的 spec/plan/contracts/code | 00. Init |
| **Impact Analysis** | 评估变更影响哪些产物和模块 | 01. Specify |
| **回归验证** | 确保变更不破坏现有功能 | 05. Verify |

> 各阶段的 Mode N / Mode I 差异详见附属文档 `dual-mode-design.md`。

### 规模分级：S / M / L

**核心原则**：不跳过阶段，而是调节每个阶段的产出物深度。

| 维度 | S（Small） | M（Medium） | L（Large） |
|------|-----------|------------|-----------|
| 涉及端点数 | 1-2 个 | 3-5 个 | 6+ 个 |
| AC 数量 | ≤ 5 | 6-15 | 16+ |
| API 变更 | 无或 1 个接口 | 2-5 个接口 | 6+ 个接口或新增服务 |
| 数据模型变更 | 无 | 字段级变更 | 表级变更或新增实体 |
| 跨团队依赖 | 无 | 1 个团队 | 2+ 个团队 |

**判定规则**：5 个维度取最高级别。

> 产出物深度矩阵、Mode × Size 组合示例详见附属文档 `dual-mode-design.md`。

---

## 流程总览

```
00. Init (Feature Kickoff + Constitution 读取)
     │
     ▼
01. Specify (Analysis + PRD + Clarify + ID 分配)
     │                    ← Exit Gate: DoR Sign-off
     │                    ← Spec-Consistency-Analysis（内部一致性）
     ▼
02. Design (Research + Tech + API + Data Model)
     │                    ← Exit Gate: Design Review
     │                    ← Spec-Consistency-Analysis（spec ↔ design）
     ▼
03. Plan (Tasks + Dependencies + Checklist)
     │                    ← Exit Gate: Task Review + 追踪覆盖率校验
     │                    ← Spec-Consistency-Analysis（spec ↔ tasks）
     ▼
04. Implement (Spec-Driven Dev + TDD + CR)
     │                    ← Exit Gate: Code CR + 追踪合规率校验
     │                    ← Spec-Consistency-Analysis（spec ↔ code）
     ▼
05. Verify (Integration Test + Security + UAT)
     │                    ← Exit Gate: UAT Sign-off + 测试覆盖率校验
     │                    ← Spec-Consistency-Analysis（spec ↔ test results）
     ▼
06. Wrap-up (Retrospective + Docs + 追踪矩阵归档)
     │
     ▼
  DevOps Release

横切机制（贯穿全流程）:
├── A. Quality Gate — 每个阶段的准出条件（含追踪覆盖率）
├── B. Spec-Consistency-Analysis — 跨产物一致性校验（5 个触发时机）
└── C. Change-Management — 变更管理（任何阶段可触发）
```

---

## 全链路追踪体系

### 设计目标

解决 v2.0 的核心缺陷：FR→Task 映射存在但缺少统一 ID 体系，导致 Spec-Consistency-Analysis 无法稳定自动化，难以审计"遗漏需求"和"过度实现"。

### ID 规范

#### ID 作用域

- **Feature 内唯一**：ID 在 `specs/<NNN-feature-name>/` 目录内唯一
- **跨 Feature 引用**：使用 `<Feature-NNN>:<ID>` 格式（如 `001:FR-003`），仅在极少数跨 Feature 依赖场景使用

#### ID 类型定义

| 前缀 | 全称 | 定义阶段 | 声明位置 | 格式 |
|------|------|---------|---------|------|
| `FR-NNN` | Functional Requirement | 01. Specify | spec.md | FR-001, FR-002, ... |
| `NFR-NNN` | Non-Functional Requirement | 01. Specify | spec.md | NFR-001, NFR-002, ... |
| `API-NNN` | API Endpoint | 02. Design | contracts/*.yaml | API-001, API-002, ... |
| `TASK-NNN` | Implementation Task | 03. Plan | tasks.md | TASK-001, TASK-002, ... |
| `TC-NNN` | Test Case | 05. Verify | tests/*.test.md | TC-001, TC-002, ... |
| `ADR-NNN` | Architecture Decision Record | 02. Design | adr/NNN-*.adr.md | 文件名即 ID |
| `RFC-NNN` | Request for Change | 横切机制 C | rfc/NNN-*.rfc.md | 文件名即 ID |

**说明**：
- 前 5 类（FR/NFR/API/TASK/TC）为 **inline ID**，在产出物正文中声明和引用
- 后 2 类（ADR/RFC）为 **文件名 ID**，文件名中的编号即 ID
- NNN 为三位数字，从 001 开始递增

#### ID 声明格式

**spec.md 中声明 FR/NFR**：

```markdown
### 功能需求

#### FR-001: 用户邮箱注册
**As** 用户 **I want** 通过邮箱注册 **So that** 我可以使用系统

**Acceptance Criteria**:
- AC-1: Given 有效邮箱，When 提交注册，Then 创建账户并发送验证邮件
- AC-2: Given 已注册邮箱，When 提交注册，Then 提示"邮箱已注册"

#### FR-002: 用户密码登录
...

### 非功能需求

#### NFR-001: 注册接口性能
- 指标：P99 < 200ms
- 并发：支持 1000 QPS
```

**tasks.md 中声明 TASK 并引用 FR**：

```markdown
#### TASK-001: 实现用户注册接口
- **traces**: FR-001, FR-002
- **depends_on**: —
- **parallel**: [P]
- **AC 映射**: FR-001/AC-1, FR-001/AC-2

#### TASK-002: 实现注册邮件发送
- **traces**: FR-001
- **depends_on**: TASK-001
```

**tests/*.test.md 中声明 TC 并引用 FR**：

```markdown
#### TC-001: 验证邮箱注册成功
- **verifies**: FR-001/AC-1
- **type**: Integration
- **steps**: ...
- **expected**: 账户创建成功，验证邮件已发送
```

**contracts/*.yaml 中声明 API**：

```yaml
paths:
  /api/v1/users:
    post:
      operationId: API-001
      summary: 用户注册
      x-traces: [FR-001, FR-002]  # 自定义扩展字段
```

#### 跨产物引用规则

| 引用场景 | 格式 | 示例 |
|---------|------|------|
| 产出物正文中引用 | 直接写 ID | "本设计实现 FR-001 的注册功能" |
| 结构化元数据引用 | `traces: [ID, ...]` | `traces: [FR-001, FR-002]` |
| AC 级别引用 | `ID/AC-N` | `FR-001/AC-2` |
| 代码注释引用 | `// implements: ID` | `// implements: TASK-001, traces: FR-001` |
| Git Commit 引用 | `[ID] message` | `[TASK-001] 实现用户注册接口` |
| PR 描述引用 | `Implements: ID` | `Implements: TASK-001, TASK-002` |
| 跨 Feature 引用 | `Feature-NNN:ID` | `001:FR-003` |

**强制规则**：
- 每个 TASK 必须有 `traces` 字段，引用至少 1 个 FR 或 NFR
- 每个 TC 必须有 `verifies` 字段，引用至少 1 个 FR/AC
- 每个 PR 描述中必须包含至少 1 个 TASK ID
- 无 traces 的 TASK 视为"过度实现"，需在 CR 中说明理由

### 追踪矩阵

#### 定义

追踪矩阵（Traceability Matrix）是全链路追踪的核心产出物，记录 FR/NFR 从需求到代码的完整映射链路。

**产出物**：`traceability-matrix.md`，存放于 Feature 目录根下。

#### 矩阵格式

```markdown
# 追踪矩阵 — <Feature Name>

| 需求 ID | Design Ref | API/Data Ref | Task Ref | Test Case Ref | PR Ref | Status |
|---------|-----------|-------------|----------|--------------|--------|--------|
| FR-001 | plan.md §2.1 | API-001 | TASK-001, TASK-002 | TC-001, TC-002 | #123 | ✅ Covered |
| FR-002 | plan.md §2.3 | API-002 | TASK-003 | TC-003 | #124 | ✅ Covered |
| FR-003 | plan.md §2.4 | API-003 | — | — | — | ❌ Not Implemented |
| NFR-001 | plan.md §3.1 | — | TASK-004 | TC-004 | #125 | ✅ Covered |
```

#### 矩阵生命周期

| 阶段 | 矩阵操作 | 填充列 |
|------|---------|--------|
| 01. Specify | 创建矩阵，填入所有 FR/NFR | 需求 ID |
| 02. Design | 填充设计引用和 API/Data 引用 | Design Ref, API/Data Ref |
| 03. Plan | 填充任务引用 | Task Ref |
| 05. Verify | 填充测试用例引用 | Test Case Ref |
| 04→06 | 填充 PR 引用，更新 Status | PR Ref, Status |

### 覆盖率算法

#### 正向覆盖率（需求是否被实现）

| 指标 | 公式 | 校验阶段 | Gate 阈值 |
|------|------|---------|----------|
| **Task 覆盖率** | \|FR with ≥1 TASK\| / \|Total FR\| × 100% | 03. Plan Gate | = 100% |
| **Test 覆盖率** | \|FR with ≥1 TC\| / \|Total FR\| × 100% | 05. Verify Gate | = 100% |
| **实现覆盖率** | \|FR with ≥1 PR\| / \|Total FR\| × 100% | 06. Wrap-up Gate | = 100% |
| **API 覆盖率** | \|FR(需API) with ≥1 API\| / \|Total FR(需API)\| × 100% | 02. Design Gate | = 100% |

**解读**：正向覆盖率 < 100% 意味着存在**遗漏需求**——有 FR 没有被任务、测试或代码覆盖。

#### 反向合规率（实现是否有需求依据）

| 指标 | 公式 | 校验阶段 | Gate 阈值 |
|------|------|---------|----------|
| **Task 合规率** | \|TASK with ≥1 FR ref\| / \|Total TASK\| × 100% | 03. Plan Gate | = 100% |
| **TC 合规率** | \|TC with ≥1 FR ref\| / \|Total TC\| × 100% | 05. Verify Gate | = 100% |
| **PR 合规率** | \|PR with ≥1 TASK ref\| / \|Total PR\| × 100% | 04. Implement Gate | = 100% |

**解读**：反向合规率 < 100% 意味着存在**过度实现**——有任务、测试或代码没有需求依据。

#### 覆盖率校验示例

```
Feature: 001-user-auth
FR 总数: 5 (FR-001 ~ FR-005)
NFR 总数: 2 (NFR-001 ~ NFR-002)

Plan Gate 校验:
  Task 覆盖率 = 5/5 = 100% ✅ (每个 FR 至少有 1 个 TASK)
  Task 合规率 = 8/8 = 100% ✅ (每个 TASK 都引用了 FR)

Verify Gate 校验:
  Test 覆盖率 = 5/5 = 100% ✅
  TC 合规率 = 10/10 = 100% ✅

异常示例:
  Task 覆盖率 = 4/5 = 80% ❌ → FR-005 无对应 TASK，遗漏需求
  Task 合规率 = 7/8 = 87.5% ❌ → TASK-008 无 FR 引用，过度实现
```

### 追踪链路全景

```
01. Specify          02. Design           03. Plan          04. Implement      05. Verify
┌──────────┐     ┌──────────────┐     ┌───────────┐     ┌────────────┐    ┌──────────┐
│ FR-001   │────▶│ plan.md §2.1 │────▶│ TASK-001  │────▶│ PR #123    │    │ TC-001   │
│ FR-002   │────▶│ API-001      │────▶│ TASK-002  │────▶│ PR #123    │    │ TC-002   │
│ NFR-001  │────▶│ plan.md §3.1 │────▶│ TASK-003  │────▶│ PR #124    │    │ TC-003   │
└──────────┘     └──────────────┘     └───────────┘     └────────────┘    └──────────┘
     │                                      │                                   │
     └──────────────────────────────────────┴───────────────────────────────────┘
                              traceability-matrix.md（汇总）
```

---

## 主流程：7 个阶段

### 00. Init（Feature 启动）

> 对标：Spec-Kit `init`。**v3 变更**：明确为 Feature 级启动（非项目级），解决 P0-1。

| 维度 | 内容 |
|------|------|
| **目标** | 启动 Feature，确定 Mode/Size/涉及端，创建工作空间 |
| **活动** | 读取 Constitution → 确定 Mode（N/I）→ 确定 Size（S/M/L）→ 确定涉及端 → 创建 Feature 目录 |
| **产出物** | Feature 目录结构、Feature 元数据（mode, size, platforms） |
| **Exit Gate** | 目录结构就绪，Mode/Size/涉及端已确认并记录 |

**Mode I 额外活动**：定位历史 Feature 产物，读取已有 spec/plan/contracts。

**Constitution（项目宪法）**为项目级一次性产物，存放于项目根目录，包含 5 个维度：

| 维度 | 示例内容 |
|------|---------|
| 技术约束 | 语言、框架、依赖上限 |
| 质量标准 | 测试覆盖率底线、代码复杂度上限 |
| 流程约束 | API 必须先定义契约再实现 |
| 简洁性原则 | 依赖数量上限、抽象层级限制 |
| 协作规范 | PR 必须有 review、文档与代码同步 |

---

### 01. Specify（需求规格化）

> 对标：Spec-Kit `specify` + `clarify`。**v3 变更**：新增 ID 分配活动，Mode I 新增 Impact Analysis。

| 维度 | 内容 |
|------|------|
| **目标** | 将业务意图转化为带唯一 ID 的结构化需求契约 |
| **活动** | 需求分析 → 结构化 PRD → **ID 分配（FR/NFR）** → Clarify |
| **产出物** | `spec.md`（含 FR-NNN, NFR-NNN）、`traceability-matrix.md`（初始化） |
| **Exit Gate** | DoR Sign-off + 无 `[NEEDS CLARIFICATION]` 标记 + 所有 FR/NFR 已分配 ID |

**子步骤**：

1. **Requirements-Analysis**：逻辑解构，剥离视觉表现，专注业务规则
   - 产出：Domain Model, Logic Flow
   - 核心原则：*Think in Constraints, not in UI*

2. **Structured-PRD**：结构化需求文档
   - User Stories（As-I-So 格式），每条分配 `FR-NNN`
   - Acceptance Criteria（Given-When-Then 格式），编号为 `FR-NNN/AC-N`
   - Non-Functional Specifications，每条分配 `NFR-NNN`

3. **Clarify**：系统化歧义消除
   - 自动扫描 `[NEEDS CLARIFICATION]` 标记
   - 所有歧义必须在本阶段消除，不得带入 Design

4. **追踪矩阵初始化**：创建 `traceability-matrix.md`，填入所有 FR/NFR ID

**Mode I 额外活动**：Impact Analysis → 输出 `impact-analysis.md`（影响范围清单 + 风险评估）。

---

### 02. Design（技术设计）

> 对标：Spec-Kit `plan`。**v3 变更**：新增 Research 子步骤（解决 P0-2），API 分配 ID。

| 维度 | 内容 |
|------|------|
| **目标** | 将需求规格转化为可实现的技术方案，API 端点分配唯一 ID |
| **活动** | **Research** → 技术选型 → 架构设计 → API 契约设计（分配 API-NNN）→ 数据建模 |
| **产出物** | `research.md`, `plan.md`, `contracts/`, `data-model.md`, ADR |
| **Exit Gate** | 设计评审 + Spec-Consistency-Analysis + API 覆盖率 = 100% |

**子产出物**：

1. **Research**（v3 新增，解决 P0-2）
   - 技术可行性调研
   - 备选方案对比（含 Trade-off 分析）
   - 未知项清单及解决方案
   - 第三方依赖评估

2. **Technical-Design**：架构决策与技术选型
   - ADR（`adr/NNN-*.adr.md`）
   - 系统架构图（组件图、部署图）
   - **Decisions & Rationale** 章节（解决 P2-4）

3. **API-Design**：API 契约设计
   - OpenAPI Spec / GraphQL Schema，每个端点分配 `API-NNN`
   - 接口版本策略、错误码规范

4. **Data-Modeling**：数据建模
   - ERD、State Machine Diagram、数据字典

**追踪矩阵更新**：填充 Design Ref 和 API/Data Ref 列。

---

### 03. Plan（任务规划）

> 对标：Spec-Kit `tasks`。**v3 变更**：新增 Checklist（解决 P1-1），TASK 分配 ID 并强制引用 FR，新增并行化标记（解决 P2-3）。

| 维度 | 内容 |
|------|------|
| **目标** | 将技术设计拆解为带 ID 的可执行任务清单 |
| **活动** | 任务拆解（分配 TASK-NNN）→ 依赖分析 → Checklist 生成 |
| **产出物** | `tasks.md`（含 TASK-NNN + traces）, `checklist.md` |
| **Exit Gate** | 任务评审 + Task 覆盖率 = 100% + Task 合规率 = 100% |

**任务拆解标准**：
- 每个任务分配 `TASK-NNN`，必须包含 `traces: [FR-NNN, ...]`
- 任务粒度：单人 1-3 天可完成
- 依赖关系显式标注：`depends_on: [TASK-NNN]`
- 可并行任务标记：`[P]`（解决 P2-3）

**Checklist**（v3 新增，解决 P1-1）：
- 从 AC 派生的验证场景清单
- 作为 Implement 和 Verify 的输入

**追踪矩阵更新**：填充 Task Ref 列，校验 Task 覆盖率。

---

### 04. Implement（规范驱动开发）

> 对标：Spec-Kit `implement`。**v3 变更**：PR 强制关联 TASK ID，代码注释引用规范。

| 维度 | 内容 |
|------|------|
| **目标** | 按任务清单实现代码，确保每行代码可追溯到需求 |
| **活动** | 按 TASK 开发 → TDD → Code Review（含追踪合规审查） |
| **产出物** | 代码实现、单元测试、CR Report |
| **Exit Gate** | Code CR 通过 + 覆盖率达标 + PR 合规率 = 100% |

**开发规范**：
- 每个 TASK 开发前，重读对应 FR 条目
- TDD：先写测试（基于 AC），再写实现
- 代码关键位置标注追踪引用：`// implements: TASK-001, traces: FR-001`
- Git Commit 格式：`[TASK-NNN] 提交描述`
- PR 描述必须包含：`Implements: TASK-NNN, TASK-NNN`

**Code Review 标准**：
- 功能正确性：是否满足 AC
- 契约一致性：代码是否与 API Spec / Data Model 一致
- Constitution 合规：是否违背项目原则
- **追踪合规**：PR 是否关联了 TASK ID，TASK 是否有 FR 依据

**追踪矩阵更新**：填充 PR Ref 列。

---

### 05. Verify（验证）

> 对标：V-Model 系统测试 + 验收测试。**v3 变更**：TC 分配 ID 并强制引用 FR/AC，Test 覆盖率纳入 Gate。

| 维度 | 内容 |
|------|------|
| **目标** | 验证实现是否满足所有 AC 和 NFR，每个 TC 可追溯到需求 |
| **活动** | 测试设计（分配 TC-NNN）→ 测试执行 → 安全扫描 → UAT |
| **产出物** | Test Report, Security Report, UAT Sign-off |
| **Exit Gate** | 全部 AC 通过 + 安全无高危 + Test 覆盖率 = 100% + TC 合规率 = 100% |

**子活动**：

1. **Test-Design**：测试用例设计
   - 每个 TC 分配 `TC-NNN`，必须包含 `verifies: [FR-NNN/AC-N]`
   - AC → Test Case 映射矩阵
   - 边界条件、异常路径覆盖

2. **Test-Execution**：测试执行
   - 集成测试 + 回归测试
   - Coverage Matrix（覆盖率报告）

3. **Security-Review**：安全扫描
   - OWASP Top 10 检查
   - 依赖漏洞扫描（SCA）

4. **UAT**：验收测试
   - 基于 AC 的端到端验收
   - UAT Sign-off 作为本阶段 Exit Gate

**Mode I 额外活动**：回归验证 → 产出 `regression-report.md`。

**追踪矩阵更新**：填充 Test Case Ref 列，校验 Test 覆盖率。

---

### 06. Wrap-up（收尾）

> 对标：SAFe Sprint Retrospective。**v3 变更**：追踪矩阵归档为必须产出物。

| 维度 | 内容 |
|------|------|
| **目标** | 复盘交付，归档文档，确保追踪矩阵完整闭环 |
| **活动** | 复盘 → 文档归档 → Spec 同步 → 追踪矩阵最终校验 |
| **产出物** | Retro Report, 更新后的 Spec 文档, 完整的 `traceability-matrix.md` |
| **Exit Gate** | 文档完整性 + 实现覆盖率 = 100% + 追踪矩阵 Status 全部为 ✅ |

**关键活动**：
- Retrospective：回顾流程执行情况
- 文档归档：确保所有产出物版本一致、可检索
- Spec 同步：如有实现偏差，更新 Spec 使其与最终实现一致
- **追踪矩阵最终校验**：确认所有 FR/NFR 的 Status 为 ✅ Covered
- Action Items：提炼改进项

**完成后** → 交由 DevOps 系统执行发布流程

---

## 横切机制：3 个贯穿全流程的能力

### A. Quality Gate（质量门禁）

> Review 不是独立节点，而是每个阶段的准出条件。**v3 变更**：Gate 中嵌入追踪覆盖率校验。

| 阶段 | Gate 内容 | 追踪校验项 |
|------|----------|-----------|
| 00. Init | 目录就绪，Mode/Size/端已确认 | — |
| 01. Specify | DoR Sign-off，无歧义标记 | 所有 FR/NFR 已分配 ID |
| 02. Design | 设计评审 + Baseline Locking | API 覆盖率 = 100% |
| 03. Plan | 任务评审 | Task 覆盖率 = 100%，Task 合规率 = 100% |
| 04. Implement | Code CR + 覆盖率达标 | PR 合规率 = 100% |
| 05. Verify | UAT Sign-off + 安全无高危 | Test 覆盖率 = 100%，TC 合规率 = 100% |
| 06. Wrap-up | 文档完整性 | 实现覆盖率 = 100%，矩阵全 ✅ |

**执行原则**：
- Gate 未通过，不得进入下一阶段
- Gate 结果记录在对应阶段的产出物中
- 追踪覆盖率校验可由工具自动化执行

---

### B. Spec-Consistency-Analysis（规范一致性校验）

> **v3 变更**：触发时机从 3 个扩展为 5 个（解决 P0-3），校验基于 ID 体系自动化。

**定位**：跨产物一致性校验，基于 ID 追踪链确保 spec ↔ design ↔ tasks ↔ code ↔ test 始终对齐。

| # | 触发时机 | 校验内容 | 基于 ID 的校验规则 |
|---|---------|---------|-------------------|
| 1 | **Specify 完成后** | spec 内部一致性 | AC 是否覆盖所有 FR、NFR 是否量化、FR 间无矛盾 |
| 2 | **Design 完成后** | spec ↔ design | 每个 FR 有对应设计方案，API 覆盖所有需要接口的 FR |
| 3 | **Plan 完成后** | spec ↔ tasks | Task 覆盖率 = 100%，Task 合规率 = 100% |
| 4 | **Implement 完成后** | spec ↔ code | PR 合规率 = 100%，API 实现与契约一致 |
| 5 | **Verify 完成后** | spec ↔ test results | Test 覆盖率 = 100%，所有 AC 有对应 TC 且通过 |

**自动化校验基础**：

ID 体系使得以下校验可通过脚本/工具自动执行：

```bash
# 示例：校验 Task 覆盖率
# 1. 从 spec.md 提取所有 FR-NNN
# 2. 从 tasks.md 提取所有 TASK 的 traces 字段
# 3. 计算覆盖率

grep -oP 'FR-\d{3}' spec.md | sort -u > /tmp/all-fr.txt
grep -oP 'traces:.*?(FR-\d{3})' tasks.md | grep -oP 'FR-\d{3}' | sort -u > /tmp/covered-fr.txt
comm -23 /tmp/all-fr.txt /tmp/covered-fr.txt  # 输出未覆盖的 FR
```

**关键实践**：
- 校验结果生成 Consistency Report
- 不一致项必须在当前阶段修复，不得带入下一阶段
- 支持增量校验（仅校验本次变更涉及的产物）

---

### C. Change-Management（变更管理）

> 对标：ISO 12207 支撑过程、CMMI REQM。**v3 变更**：变更影响分析基于 ID 追踪链自动定位受影响产物。

**定位**：任何阶段均可触发的变更处理机制。

| 触发条件 | 动作 | 基于 ID 的影响定位 |
|---------|------|-------------------|
| 需求变更 | RFC → Impact Analysis → Spec 更新 | 通过 FR-NNN 追踪链定位受影响的 TASK/TC/API/PR |
| 设计变更 | ADR 更新 → 下游产物同步 | 通过 API-NNN 定位受影响的 TASK 和 TC |
| 实现偏差 | 评估是否需要更新 Spec | 通过 TASK-NNN 反向追溯到 FR-NNN |
| Constitution 变更 | 全流程影响评估 | 所有产物重新校验 |

**变更流程**：
1. 提交 RFC（`rfc/NNN-*.rfc.md`）
2. Impact Analysis：基于追踪矩阵，通过 ID 链自动定位受影响的产物
3. 审批：根据影响范围决定审批级别
4. 执行：更新受影响的产物，同步更新追踪矩阵
5. 触发 Spec-Consistency-Analysis 重新校验

**ID 在变更中的价值**：
- 变更 FR-003 → 自动定位 TASK-005/TASK-006 → 定位 TC-007 → 定位 PR #128
- 无需人工逐一排查，追踪链自动给出完整影响范围

---

## 多端扩展（Layer 2）

> 详细设计见附属文档 `dual-mode-design.md`，此处仅列核心要点。

### 端分类

| 端标识 | 团队 | 技术栈特征 |
|--------|------|-----------|
| `APP` | iOS / Android | 原生开发，关注性能、包体积、兼容性 |
| `PC` | 桌面端 | Electron / 原生，关注跨平台、内存占用 |
| `H5` | 移动 Web | 前端框架，关注首屏性能、SEO、浏览器兼容 |
| `Backend` | Java 后端 | Spring 生态，关注并发、数据一致性、API 设计 |

### 扩展机制

每个端在 7 个阶段中可定义 3 类扩展：**Entry Criteria**（准入条件）、**Deliverables**（额外产出物）、**Exit Gate Items**（额外检查项）。

各端维护独立的 `platform-rules/<platform>-rules.md`，Feature 启动时按涉及端动态合并。

### 跨端协作锚点

API 契约（`contracts/`）是前后端协作的唯一真理源：
- Backend 在 Design 阶段产出契约，前端各端基于契约并行开发
- 契约变更必须通知所有消费方，走 Change-Management
- 契约确定后，前端可基于 Mock Server 并行开发

---

## 产出物标准化

### 文件命名规范

| 产出物类型 | 文件格式 | 示例 |
|-----------|---------|------|
| 需求规格 | `spec.md` | — |
| 追踪矩阵 | `traceability-matrix.md` | — |
| 影响分析 | `impact-analysis.md` | Mode I 专属 |
| 技术调研 | `research.md` | — |
| 技术设计 | `plan.md` | — |
| API 契约 | `contracts/*.yaml` | `contracts/user-api.yaml` |
| 数据模型 | `data-model.md` | — |
| 任务清单 | `tasks.md` | — |
| 验证清单 | `checklist.md` | — |
| 架构决策 | `adr/NNN-*.adr.md` | `adr/001-jwt-vs-session.adr.md` |
| 测试用例 | `tests/*.test.md` | `tests/user-auth.test.md` |
| 变更请求 | `rfc/NNN-*.rfc.md` | `rfc/001-add-mfa.rfc.md` |
| 回归报告 | `regression-report.md` | Mode I 专属 |
| 复盘报告 | `retro.md` | — |

### 目录结构

```
project-root/
├── constitution.md                    # 项目级：项目宪法
├── platform-rules/                    # 项目级：各端规范（Layer 2）
│   ├── app-rules.md
│   ├── pc-rules.md
│   ├── h5-rules.md
│   └── backend-rules.md
│
└── specs/                             # Feature 级产物根目录
    └── NNN-feature-name/              # Feature 编号 + 名称
        ├── spec.md                    # 需求规格（含 FR/NFR ID）
        ├── traceability-matrix.md     # 追踪矩阵（v3 新增）
        ├── impact-analysis.md         # Mode I 专属
        ├── research.md                # 技术调研（v3 新增）
        ├── plan.md                    # 技术设计
        ├── contracts/                 # API 契约（含 API ID）
        │   └── *.yaml
        ├── data-model.md              # 数据模型
        ├── tasks.md                   # 任务清单（含 TASK ID + traces）
        ├── checklist.md               # 验证清单（v3 新增）
        ├── adr/                       # 架构决策记录
        │   └── NNN-*.adr.md
        ├── tests/                     # 测试用例（含 TC ID + verifies）
        │   └── *.test.md
        ├── rfc/                       # 变更请求
        │   └── NNN-*.rfc.md
        ├── regression-report.md       # Mode I 专属
        └── retro.md                   # 复盘报告
```

---

## 工具链映射

### Jira Status 映射

| 阶段 | Jira Status | 触发条件 |
|------|------------|---------|
| 00. Init | `INIT` | Feature 创建 |
| 01. Specify | `SPECIFYING` | Init Gate 通过 |
| 02. Design | `DESIGNING` | DoR Sign-off |
| 03. Plan | `PLANNING` | Design Review 通过 |
| 04. Implement | `IN_PROGRESS` | Task Review 通过 |
| 05. Verify | `IN_TESTING` | Code CR 通过 |
| 06. Wrap-up | `WRAPPING_UP` | UAT Sign-off |
| DevOps | `RELEASING` | 文档完整性检查通过 |
| 完成 | `DONE` | 发布成功 |

### Git 集成

| Hook | 触发时机 | 校验内容 |
|------|---------|---------|
| Pre-commit | 代码提交前 | Commit message 包含 TASK-NNN |
| Pre-push | 推送前 | Spec-Consistency-Analysis（增量） |
| CI Pipeline | PR 创建时 | 全量一致性校验 + 追踪覆盖率 |

### 追踪体系工具化支撑

| 校验项 | 自动化方式 | 触发时机 |
|--------|-----------|---------|
| ID 格式校验 | Regex lint（`[A-Z]+-\d{3}` 格式） | Pre-commit |
| TASK traces 完整性 | 脚本扫描 tasks.md 中无 traces 的 TASK | Plan Gate |
| TC verifies 完整性 | 脚本扫描 tests/ 中无 verifies 的 TC | Verify Gate |
| 正向覆盖率计算 | 脚本对比 spec.md FR 集合 vs tasks.md traces 集合 | Plan/Verify/Wrap-up Gate |
| 反向合规率计算 | 脚本对比 tasks.md TASK 集合 vs traces 非空集合 | Plan Gate |
| PR 关联校验 | CI 检查 PR description 是否包含 TASK-NNN | PR 创建时 |
| Commit message 校验 | Git hook 检查 `[TASK-NNN]` 格式 | Pre-commit |

---

## 落地路线图

### 第一步：跑通 7 阶段 + ID 体系

用一个真实 Feature 走完 00-06 全流程，同时试行 ID 分配和追踪矩阵。

| 动作 | 验证点 |
|------|-------|
| 选择一个 M 规模 Feature | 覆盖所有 7 个阶段 |
| 按阶段产出标准化文档 | 产出物模板可用 |
| 为 FR/NFR/TASK/TC 分配 ID | ID 命名规则可执行 |
| 手动维护追踪矩阵 | 矩阵格式合理、维护成本可接受 |

### 第二步：引入 Quality Gate + 覆盖率校验

| 动作 | 验证点 |
|------|-------|
| 定义每个 Gate 的检查清单 | 清单可执行 |
| 在 Plan Gate 试行 Task 覆盖率校验 | 能发现遗漏需求 |
| 在 Verify Gate 试行 Test 覆盖率校验 | 能发现未测试的 FR |
| Gate 结果记录到产出物 | 可追溯 |

### 第三步：引入 Spec-Consistency-Analysis（5 触发时机）

| 动作 | 验证点 |
|------|-------|
| 在 5 个时机试运行一致性校验 | 能发现真实不一致问题 |
| 基于 ID 体系编写校验脚本 | 脚本可稳定执行 |
| 逐步集成到 CI Pipeline | 自动化校验可用 |

### 第四步：引入 Change-Management + 追踪链驱动影响分析

| 动作 | 验证点 |
|------|-------|
| 定义 RFC 模板 | 变更请求格式标准化 |
| 基于追踪矩阵做 Impact Analysis | 能自动定位受影响产物 |
| 区分快速通道与完整流程 | 小变更不过重，大变更不遗漏 |

### 第五步：多端扩展 + 双模式全量推行

| 动作 | 验证点 |
|------|-------|
| 各端 Tech Lead 补录 platform-rules | 端规范模板可用 |
| 试跑 Mode I + 多端 Feature | 合并流程可行 |
| 追踪矩阵在多端场景下可用 | 跨端 FR 追踪无遗漏 |

---

## 新旧版本映射：v2.0 → v3.0

| v2.0 内容 | v3.0 变化 | 变更类型 |
|-----------|----------|---------|
| 00. Init（项目级/Feature 级混合） | 明确为 Feature 级启动，Constitution 移至项目根 | 修复 P0-1 |
| 02. Design（无 Research） | 新增 Research 子步骤 | 修复 P0-2 |
| Analyze 3 个触发时机 | 扩展为 5 个触发时机 | 修复 P0-3 |
| 无 Checklist | Plan 阶段新增 checklist.md | 修复 P1-1 |
| 轻量模式跳过阶段 | Size S/M/L 调节产出物深度 | 修复 P1-3 |
| `feature-name/` 目录 | `specs/NNN-feature-name/` | 修复 P1-4 |
| Constitution 4 项 | 扩展为 5 维度 | 优化 P2-1 |
| 无并行化标记 | tasks.md 增加 `[P]` + `depends_on` | 优化 P2-3 |
| 无决策记录区域 | plan.md 增加 Decisions & Rationale | 优化 P2-4 |
| 无 ID 体系 | 全链路 ID 规范（FR/NFR/API/TASK/TC） | **v3 核心新增** |
| 无追踪矩阵 | traceability-matrix.md | **v3 核心新增** |
| 无覆盖率算法 | 正向覆盖率 + 反向合规率 | **v3 核心新增** |
| 单一模式 | Mode N / Mode I 双模式 | **v3 新增** |
| 无多端支持 | Layer 2 多端扩展机制 | **v3 新增** |

---

## 参考标准

| 标准 | 借鉴内容 |
|------|---------|
| **Spec-Kit** | specify/clarify/plan/analyze/tasks/implement 命令体系，Constitution，FR 编号 |
| **SpecifyPlus** | Constitution Gates，[P] 并行标记，PHR 决策溯源 |
| **Autospec** | YAML-first artifacts，tasks.yaml dependencies 字段 |
| **TypeSpec** | API-first 设计，single source of truth |
| **ISO/IEC 12207** | 主过程与支撑过程分离，需求可追踪性矩阵（RTM） |
| **V-Model** | 测试层级与设计层级对应 |
| **SAFe** | Definition of Done，Sprint Retrospective |
| **CMMI REQM** | 需求管理作为持续活动，双向追踪 |

---

## 附属文档

| 文档 | 内容 | 状态 |
|------|------|------|
| `dual-mode-design.md` | 双模式 + 多端扩展详细设计 | 已完成 |
| `review-spec-first-v2.md` | v2.0 深度审查报告（13 项改进） | 已完成 |
| `spec-first-v2.md` | v2.0 原始文档（历史参考） | 归档 |

---

## 风险提醒

### ID 体系的维护成本

ID 分配和追踪矩阵维护需要额外工作量。初期手动维护，验证价值后再工具化。

**应对**：第一步只强制 FR/TASK 追踪（最小闭环），验证可行后再扩展到 API/TC/PR。

### 追踪矩阵的"形式化"风险

矩阵可能沦为"填表"而非真正的质量保障工具。

**应对**：覆盖率校验嵌入 Gate，不通过则阻塞流程——让矩阵成为"活文档"而非"死表格"。

### 完美主义陷阱

v3 内容量显著增加，切忌一次性全量推行。

**应对**：严格按落地路线图 5 步渐进引入，每步验证后再推进。

---

**作者**: Leo (况雨平)
**文档版本**: v3.0
**创建日期**: 2026-02-06
**基于版本**: v2.0
**关联文档**: dual-mode-design.md, review-spec-first-v2.md

