# Spec-First 研发流程规范 v2.0

> **版本**: v2.0 | **更新**: 2026-02-06 | **作用域**: Feature 级别
> **参考标准**: Spec-Kit、Autospec、ISO/IEC 12207、V-Model、SAFe
> **核心理念**: 规范即契约、规范即真理

---

## 核心架构：7 阶段 + 3 横切机制

| 维度 | 定义 | 数量 |
|------|------|------|
| **主流程阶段** | Feature 从需求到交付的线性推进路径 | 7 个 |
| **横切机制** | 贯穿全流程的质量保障能力，任何阶段均可触发 | 3 个 |

**设计原则**：
- 主流程与支撑机制分离（对标 ISO/IEC 12207）
- Review 降级为 Quality Gate（对标 Spec-Kit、SAFe DoD）
- Change-Management 升级为横切机制（对标 CMMI REQM）
- 节点粒度统一为"阶段"级别，子活动内嵌于阶段中

---

## 流程总览

```
00. Init (Scaffolding + Constitution)
     │                    初始化：搭建项目骨架 + 定义项目宪法
     │                    → 产出物: 项目骨架、constitution.md
     ▼
01. Specify (Analysis + PRD + Clarify)
     │                    需求规格化：需求分析 + 结构化PRD + 澄清歧义
     │                    → 产出物: spec.md（User Stories, AC, NFS, Key Entities）
     │                    ← Exit Gate: DoR Sign-off（需求就绪签核）
     ▼
02. Design (Tech + API + Data Model)
     │                    技术设计：技术选型 + API契约 + 数据建模
     │                    → 产出物: plan.md, contracts/*.yaml, data-model.md, ADR
     │                    ← Exit Gate: Design Review（设计评审）
     │                    ← Spec-Consistency-Analysis（规范一致性校验）
     ▼
03. Plan (Tasks + Dependencies + Estimation)
     │                    任务规划：任务拆解 + 依赖分析 + 工作量估算
     │                    → 产出物: tasks.md（WBS, Dependency Map, Velocity）
     │                    ← Exit Gate: Task Review（任务评审）
     │                    ← Spec-Consistency-Analysis（规范一致性校验）
     ▼
04. Implement (Spec-Driven Dev + TDD + CR)
     │                    规范驱动开发：按任务开发 + 测试驱动 + 代码评审
     │                    → 产出物: 代码实现、单元测试、CR Report
     │                    ← Exit Gate: Code CR（代码评审通过 + 测试覆盖率达标）
     │                    ← Spec-Consistency-Analysis（规范一致性校验）
     ▼
05. Verify (Integration Test + Security + UAT)
     │                    验证：集成测试 + 安全扫描 + 用户验收测试
     │                    → 产出物: Test Report, Security Scan Report, UAT Sign-off
     │                    ← Exit Gate: UAT Sign-off（验收测试签核）
     ▼
06. Wrap-up (Retrospective + Docs)
     │                    收尾：复盘 + 文档整理 + 规范同步
     │                    → 产出物: Retro Report, 更新后的 Spec 文档
     ▼
  DevOps Release        发布：交由DevOps系统执行发布流程

横切机制（贯穿全流程）:
├── A. Quality Gate — 每个阶段的准出条件（质量门禁）
├── B. Spec-Consistency-Analysis — 跨产物一致性校验（规范对齐）
└── C. Change-Management — 变更管理（任何阶段可触发）
```

### 流程速查表

| 阶段 | 活动 | 产出物 | Exit Gate | Gate Owner |
|------|------|--------|-----------|------------|
| 00 Init | 脚手架生成 + Constitution 定义 | 项目骨架、`constitution.md` | 骨架可运行，原则已评审 | Tech Lead |
| 01 Specify | 需求分析 → 结构化 PRD → Clarify | `spec.md`（User Stories, AC, NFS） | DoR Sign-off | PM |
| 02 Design | 技术选型 → 架构设计 → API 契约 → 数据建模 | `plan.md`, `contracts/*.yaml`, `data-model.md`, ADR | Design Review + Spec 一致性校验 | Tech Lead / Architect |
| 03 Plan | 任务拆解 → 依赖分析 → 工作量估算 | `tasks.md`（WBS, Dependency Map） | Task Review + Spec 一致性校验 | Tech Lead |
| 04 Implement | 按 Task 开发 → TDD → Code Review | 代码实现、单元测试、CR Report | Code CR + 测试覆盖率达标 | Tech Lead / Peer |
| 05 Verify | 集成测试 → 安全扫描 → UAT | Test Report, Security Scan Report, UAT Sign-off | UAT Sign-off | QA Lead + PM |
| 06 Wrap-up | 复盘 → 文档整理 → 规范同步 | Retro Report, 更新后的 Spec 文档 | 文档完整性检查 | Tech Lead |

---

## 主流程：7 个阶段

### 00. Init（初始化）

> 对标：Spec-Kit `init` + `constitution`

| 维度 | 内容 |
|------|------|
| **目标** | 建立项目骨架与不可违背的项目原则 |
| **活动** | 项目脚手架生成 + Constitution 定义 |
| **产出物** | 项目骨架、`constitution.md` |
| **Exit Gate** | 项目结构可运行，原则文档已评审 |

**Constitution（项目宪法）包含**：
- 性能底线（如 P99 < 200ms）
- 安全红线（如 OWASP Top 10 零容忍）
- 技术偏好（如语言、框架、依赖约束）
- 架构原则（如微服务边界、数据所有权）
- **角色映射表**（各项目自行定义）

**角色映射表模板**（在 `constitution.md` 中维护）：

| 角色类型 | 职责 | 映射到（示例） |
|---------|------|--------------|
| PM | 需求签核、UAT 验收 | 张三 |
| Tech Lead | 设计评审、任务评审、代码 CR 终审 | 李四 |
| Architect | 架构决策评审（L 规模必须参与） | 王五 |
| QA Lead | 测试方案评审、UAT 签核 | 赵六 |
| Dev（Peer） | 代码 CR | 按任务分配 |

> 角色映射表为项目级配置，各项目在 `constitution.md` 中自行填写。Gate Owner 引用角色类型，不绑定具体人名。

**RACI 矩阵模板**（在 `constitution.md` 中维护，可选）：

> R=Responsible(执行), A=Accountable(负责), C=Consulted(咨询), I=Informed(知会)

| 活动 | PM | Tech Lead | Architect | QA Lead | Dev |
|------|:--:|:---------:|:---------:|:-------:|:---:|
| Specify - 需求分析 | **A** | C | C | I | I |
| Specify - DoR Sign-off | **R** | C | — | I | — |
| Design - 架构设计 | I | **A** | **R** | I | C |
| Design - API 契约 | I | **R** | C | I | C |
| Plan - 任务拆解 | C | **A** | I | I | **R** |
| Implement - 开发 | I | C | — | — | **R** |
| Implement - Code CR | — | **A** | C | — | **R** |
| Verify - UAT | **R** | I | — | **A** | C |
| Wrap-up - 复盘 | C | **A** | C | C | **R** |

> RACI 矩阵为可选配置。小团队可不填，大团队按需细化。每行有且仅有一个 A（Accountable）。

**关键实践**：
- Constitution 一旦确立，变更需走 Change-Management 横切机制
- 后续所有阶段的决策不得违背 Constitution

---

### 01. Specify（需求规格化）

> 对标：Spec-Kit `specify` + `clarify`

| 维度 | 内容 |
|------|------|
| **目标** | 将业务意图转化为机器可读、人读无歧义的需求契约 |
| **活动** | 需求分析 → 结构化 PRD → 需求澄清（Clarify） |
| **产出物** | `spec.md`（User Stories, AC, NFS, Key Entities） |
| **Exit Gate** | DoR Sign-off，无 `[NEEDS CLARIFICATION]` 标记 |

**子步骤**：

1. **Requirements-Analysis**：逻辑解构，剥离视觉表现，专注业务规则
   - 产出：Domain Model, Logic Flow
   - 核心原则：*Think in Constraints, not in UI*

2. **Structured-PRD**：结构化需求文档
   - User Stories（As-I-So 格式）
   - Acceptance Criteria（Given-When-Then 格式）
   - Non-Functional Specifications（性能/安全/可靠性）

3. **Clarify**：系统化歧义消除
   - 自动扫描 `[NEEDS CLARIFICATION]` 标记
   - 生成结构化问题清单
   - 所有歧义必须在本阶段消除，不得带入 Design

---

### 02. Design（技术设计）

> 对标：Spec-Kit `plan`（Phase 0: Research + Phase 1: Design）

| 维度 | 内容 |
|------|------|
| **目标** | 将需求规格转化为可实现的技术方案 |
| **活动** | 技术选型 → 架构设计 → API 契约设计 → 数据建模 |
| **产出物** | `plan.md`, `contracts/`, `data-model.md`, ADR |
| **Exit Gate** | 设计评审通过 + Spec-Consistency-Analysis 通过 |

**子产出物**：

1. **Technical-Design**：架构决策与技术选型
   - Architecture Decision Records（ADR）
   - 技术选型依据与 Trade-off 分析
   - 系统架构图（组件图、部署图）

2. **API-Design**：API 契约设计（对标 Spec-Kit `contracts/`）
   - OpenAPI Spec / GraphQL Schema
   - 接口版本策略
   - 错误码规范

3. **Data-Modeling**：数据建模（对标 Spec-Kit `data-model.md`）
   - ERD（实体关系图）
   - State Machine Diagram（状态机）
   - 数据字典

**关键实践**：
- API-Design 和 Data-Modeling 是 Design 的子产出物，不是独立阶段
- 设计完成后触发 Spec-Consistency-Analysis（spec ↔ design 一致性）
- Baseline Locking：设计评审通过后锁定基线，变更需走 Change-Management

---

### 03. Plan（任务规划）

> 对标：Spec-Kit `tasks`、Autospec `tasks`

| 维度 | 内容 |
|------|------|
| **目标** | 将技术设计拆解为可执行的任务清单 |
| **活动** | 任务拆解 → 依赖分析 → 工作量估算 |
| **产出物** | `tasks.md`（WBS, Dependency Map, Velocity） |
| **Exit Gate** | 任务评审通过 + Spec-Consistency-Analysis 通过 |

**任务拆解标准**：
- 每个任务对应明确的 Spec 条目（可追溯）
- 任务粒度：单人 1-3 天可完成
- 依赖关系显式标注（Dependency Map）
- 每个任务包含：描述、AC 映射、预估工时、前置依赖

**关键实践**：
- 拆解完成后触发 Spec-Consistency-Analysis（spec ↔ tasks 覆盖率）
- 确保每个 Functional Requirement 至少有一个对应 Task
- 估算基于历史 Velocity，非主观判断

---

### 04. Implement（规范驱动开发）

> 对标：Spec-Kit `implement`（TDD）、Autospec `implement`

| 维度 | 内容 |
|------|------|
| **目标** | 按任务清单实现代码，确保代码与规范一致 |
| **活动** | 按 Task 开发 → TDD → Code Review |
| **产出物** | 代码实现、单元测试、CR Report |
| **Exit Gate** | Code CR 通过 + 测试覆盖率达标 |

**开发规范**：
- 每个 Task 开发前，重读对应 Spec 条目
- TDD：先写测试（基于 AC），再写实现
- 代码中标注 Spec 引用（注释或 metadata）

**Code Review 标准**：
- 功能正确性：是否满足 AC
- 契约一致性：代码是否与 API Spec / Data Model 一致
- Constitution 合规：是否违背项目原则
- 测试覆盖：关键路径是否有测试

---

### 05. Verify（验证）

> 对标：V-Model 系统测试 + 验收测试

| 维度 | 内容 |
|------|------|
| **目标** | 验证实现是否满足所有 AC 和 NFS |
| **活动** | 集成测试 → 安全扫描 → UAT |
| **产出物** | Test Report, Security Scan Report, UAT Sign-off |
| **Exit Gate** | 全部 AC 通过 + 安全扫描无高危 |

**子活动**：

1. **Test-Design**：测试用例设计
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

---

### 06. Wrap-up（收尾）

> 对标：SAFe Sprint Retrospective

| 维度 | 内容 |
|------|------|
| **目标** | 复盘本次 Feature 交付，整理文档，确保规范与代码一致 |
| **活动** | 复盘 → 文档整理 → 规范同步 |
| **产出物** | Retro Report, 更新后的 Spec 文档 |
| **Exit Gate** | 文档完整性检查通过，规范与代码一致 |

**关键活动**：
- Retrospective：回顾本次 Feature 的流程执行情况
- 文档归档：按归档清单逐项检查，确保所有产出物版本一致、可检索
- Spec 同步：如实现过程中有偏差，更新 Spec 使其与最终实现一致
- Action Items：提炼改进项，输入下一个 Feature 的 Init 阶段

**归档清单**（Exit Gate 检查依据）：

| 来源阶段 | 归档文件 | 检查标准 |
|---------|---------|---------|
| 00 Init | `constitution.md` | 版本与实际执行一致 |
| 01 Specify | `spec.md` | 与最终实现对齐，无过期 AC |
| 02 Design | `plan.md` | 与最终实现对齐 |
| 02 Design | `contracts/*.yaml` | 与实际 API 签名一致 |
| 02 Design | `data-model.md` | 与实际 Schema 一致 |
| 02 Design | `adr/*.adr.md` | 决策记录完整 |
| 03 Plan | `tasks.md` | 所有 Task 状态已闭合 |
| 04 Implement | 代码 + 单元测试 | CR 通过，覆盖率达标 |
| 05 Verify | `tests/*.test.md` | 测试用例已归档 |
| 05 Verify | `reports/test-report.md` | 测试执行报告已归档 |
| 05 Verify | `reports/security-scan.md` | 安全扫描报告已归档 |
| 05 Verify | `reports/uat-signoff.md` | 验收签核记录已归档 |
| 横切 B | `traceability-matrix.md` | 追踪矩阵覆盖率达标 |
| 横切 C | `rfc/*.rfc.md` | 所有变更请求已闭合 |
| 06 Wrap-up | `retro.md` | 复盘完成，Action Items 已提炼 |

**完成后** → 交由 DevOps 系统执行发布流程

---

## 横切机制：3 个贯穿全流程的能力

### A. Quality Gate（质量门禁）

> Review 不是独立节点，而是每个阶段的准出条件（对标 ISO 12207 支撑过程、SAFe DoD）

| 阶段 | Gate 内容 | 准出标准 | Gate Owner |
|------|----------|---------|-----------|
| 00. Init | 项目结构评审 | 骨架可运行，Constitution 已确认 | Tech Lead |
| 01. Specify | DoR Sign-off | 无歧义标记，AC 完整，NFS 量化 | PM |
| 02. Design | 设计评审 + Baseline Locking | ADR 完整，API/Data Model 评审通过 | Tech Lead / Architect |
| 03. Plan | 任务评审 + 估算确认 | 每个 FR 有对应 Task，依赖无环 | Tech Lead |
| 04. Implement | Code CR + 覆盖率 | CR 通过，单测覆盖率达标 | Tech Lead / Peer |
| 05. Verify | UAT Sign-off | 全部 AC 通过，安全扫描无高危 | QA Lead + PM |
| 06. Wrap-up | 文档完整性检查 | 规范与代码一致，Retro 完成 | Tech Lead |

**执行原则**：
- Gate 未通过，不得进入下一阶段
- Gate 结果记录在对应阶段的产出物中
- Gate 可由工具自动化执行（CI/CD 集成）
- Gate Owner 负责最终放行决策；角色类型到具体人的映射见 `constitution.md` 角色映射表

---

### B. Spec-Consistency-Analysis（规范一致性校验）

> 对标：Spec-Kit `/speckit.analyze`，Spec-First 体系最核心的横切能力

**定位**：跨产物一致性校验，确保 spec ↔ design ↔ tasks ↔ code 始终对齐。

| 触发时机 | 校验内容 | 校验规则 |
|---------|---------|---------|
| Design 完成后 | spec ↔ design | 每个 FR 有对应设计方案，API 覆盖所有 User Story |
| Plan 完成后 | spec ↔ tasks | 每个 FR 有对应 Task，无遗漏需求 |
| Implement 完成后 | spec ↔ code | 代码实现与 API Spec 一致，契约审计通过 |

**校验维度**：
- **需求覆盖率**：FR → Task 映射完整性
- **契约一致性**：API Spec ↔ 实际接口签名
- **Constitution 合规**：所有产物不违背项目原则
- **数据模型一致**：Data Model ↔ 实际 Schema

**关键实践**：
- 校验结果生成 Consistency Report
- 不一致项必须在当前阶段修复，不得带入下一阶段
- 支持增量校验（仅校验本次变更涉及的产物）

---

### C. Change-Management（变更管理）

> 对标：ISO 12207 支撑过程、CMMI REQM，贯穿全生命周期

**定位**：任何阶段均可触发的变更处理机制，不是线性节点。

| 触发条件 | 动作 | 影响范围 |
|---------|------|---------|
| 需求变更 | RFC → Impact Analysis → Spec 更新 | 受影响阶段回退重新执行 |
| 设计变更 | ADR 更新 → 下游产物同步 | Plan / Implement / Verify |
| 实现偏差 | 评估是否需要更新 Spec | Spec / Design 可能需同步 |
| Constitution 变更 | 全流程影响评估 | 所有阶段产物重新校验 |

**变更流程**：
1. 提交 RFC（Request for Change）
2. Impact Analysis：评估变更影响的阶段和产物
3. 审批：根据影响范围决定审批级别
4. 执行：更新受影响的产物
5. 触发 Spec-Consistency-Analysis 重新校验

**关键实践**：
- 变更记录纳入版本管理（`git diff` 可追溯）
- 小变更（不跨阶段）可快速通道处理
- 大变更（跨阶段）必须走完整 RFC 流程

---

## Traceability 执行细则（支撑机制 B）

> 定位：本节是 `Spec-Consistency-Analysis` 的落地规则，用于实现可自动化、可审计的一致性校验。

### 设计原则

- **稳定性**：ID 一次分配，终身不改；需求废弃后不得复用。
- **可解析**：统一前缀和序号位数，支持正则校验。
- **低耦合**：ID 不携带可变业务文案，仅保留 Feature/Domain 缩写。

### 全链路 ID 规范

| 类型 | 格式 | 示例 | 正则 |
|------|------|------|------|
| Functional Requirement | `FR-<FEATURE>-<NNN>` | `FR-AUTH-001` | `^FR-[A-Z][A-Z0-9]{1,15}-\d{3}$` |
| Non-Functional Requirement | `NFR-<DIM>-<NNN>` | `NFR-SEC-001` | `^NFR-(PERF\|SEC\|REL\|AVAIL\|OBS)-\d{3}$` |
| API Contract Item | `API-<SERVICE>-<NNN>` | `API-AUTH-001` | `^API-[A-Z][A-Z0-9]{1,15}-\d{3}$` |
| Task | `TASK-<FEATURE>-<NNNN>` | `TASK-AUTH-0001` | `^TASK-[A-Z][A-Z0-9]{1,15}-\d{4}$` |
| Test Case | `TC-<LEVEL>-<FEATURE>-<NNNN>` | `TC-E2E-AUTH-0007` | `^TC-(UT\|IT\|E2E)-[A-Z][A-Z0-9]{1,15}-\d{4}$` |
| ADR | `ADR-<NNN>` | `ADR-014` | `^ADR-\d{3}$` |

`<DIM>` 固定枚举：`PERF`（性能）、`SEC`（安全）、`REL`（可靠性）、`AVAIL`（可用性）、`OBS`（可观测性）。

### 跨产物引用规则

- `spec.md`：定义 `FR-*`/`NFR-*`，作为需求唯一来源（Source of Truth）。
- `plan.md`、`contracts/*.yaml`、`data-model.md`：每项设计必须引用至少一个 `FR-*`/`NFR-*`。
- `tasks.md`：每个 `TASK-*` 必须关联至少一个 `FR-*`/`NFR-*`。
- `tests/*.test.md`：每个 `TC-*` 必须关联至少一个 `FR-*`/`NFR-*`。
- PR 描述：必须包含 `Req IDs`（至少一个 `FR-*` 或 `NFR-*`）。

### 追踪矩阵模板

| requirement_id | design_ref | api_or_data_ref | task_ids | test_case_ids | pr_links | status |
|----------------|------------|-----------------|----------|---------------|----------|--------|
| `FR-XXX-001` | `plan.md#...` | `API-XXX-001` | `TASK-XXX-0001` | `TC-UT-XXX-0001` | `PR-123` | `planned/implemented/verified/accepted` |

### 覆盖率与审计指标

- **FR 覆盖率** = 同时具备 `Task + Test Case + 合并 PR` 的 `FR` 数 / `FR` 总数（目标：100%）。
- **NFR 覆盖率** = 具备验证证据（压测/安全/稳定性报告）的 `NFR` 数 / `NFR` 总数（目标：100%）。
- **孤儿项率** = 未关联 `FR/NFR` 的 `Task + Test Case + PR` 数 / 全部 `Task + Test Case + PR` 数（目标：0%）。

### Gate 集成规则

- `02. Design Exit Gate`：`FR/NFR -> Design/API/Data` 映射完整。
- `03. Plan Exit Gate`：`FR/NFR -> Task` 映射完整且无孤儿 Task。
- `04. Implement Exit Gate`：PR 含 `Req IDs`，且 `Req -> Task -> Code` 追踪闭环。
- `05. Verify Exit Gate`：`FR/NFR -> Test Case -> Report` 追踪闭环。

---

## 产出物标准化

### 文件命名规范

| 产出物类型 | 文件格式 | 示例 |
|-----------|---------|------|
| 规范定义 | `spec.md` | — |
| 架构决策 | `*.adr.md` | `001-jwt-vs-session.adr.md` |
| 测试用例 | `*.test.md` | `user-auth.test.md` |
| 变更请求 | `*.rfc.md` | `002-add-mfa.rfc.md` |
| 项目原则 | `constitution.md` | — |
| 技术设计 | `plan.md` | — |
| 任务清单 | `tasks.md` | — |
| API 契约 | `contracts/*.yaml` | `contracts/user-api.yaml` |
| 数据模型 | `data-model.md` | — |

### 目录结构

```
feature-name/
├── constitution.md          # 项目原则（Init 阶段）
├── spec.md                  # 需求规格（Specify 阶段）
├── plan.md                  # 技术设计（Design 阶段）
├── contracts/               # API 契约（Design 阶段）
│   └── *.yaml
├── data-model.md            # 数据模型（Design 阶段）
├── tasks.md                 # 任务清单（Plan 阶段）
├── adr/                     # 架构决策记录
│   └── *.adr.md
├── tests/                   # 测试用例（Verify 阶段）
│   └── *.test.md
├── reports/                 # 测试与安全报告（Verify 阶段）
│   ├── test-report.md
│   ├── security-scan.md
│   └── uat-signoff.md
├── traceability-matrix.md   # 追踪矩阵（横切机制 B）
├── rfc/                     # 变更请求
│   └── *.rfc.md
└── retro.md                 # 复盘报告（Wrap-up 阶段）
```

---

## 新旧节点映射：18 → 7+3

| 原 18 节点 | 归入重构后 | 变化说明 |
|-----------|-----------|---------|
| 00. Scaffolding | **00. Init** | 增加 Constitution |
| 01. Requirements-Analysis | **01. Specify** | 合并 |
| 02. Structured-PRD | **01. Specify** | 合并 |
| 03. Requirements-Review | 01 的 **Exit Gate** | 降级为门禁 |
| 04. Technical-Design | **02. Design** | 保留 |
| 05. API-Design | 02 的**子产出物** | 降级 |
| 06. Data-Modeling | 02 的**子产出物** | 降级 |
| 07. Design-Compliance-Review | 02 的 **Exit Gate** | 降级为门禁 |
| 08. Task-Decomposition | **03. Plan** | 保留 |
| 09. Task-Review | 03 的 **Exit Gate** | 降级为门禁 |
| 10. Spec-Quality-Check | **横切机制 B** | 升级为横切 |
| 11. Spec-Driven-Dev | **04. Implement** | 保留 |
| 12. Spec-Code-CR | 04 的 **Exit Gate** | 降级为门禁 |
| 13. Test-Design | **05. Verify** | 合并 |
| 14. Test-Execution | **05. Verify** | 合并 |
| 15. Security-Review | 05 的**子活动** | 降级 |
| 16. UAT | 05 的 **Exit Gate** | 降级为门禁 |
| 17. Change-Management | **横切机制 C** | 升级为横切 |
| 18. Retrospective | **06. Wrap-up** | 保留 |

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
| Pre-commit | 代码提交前 | Spec 格式检查、命名规范 |
| Pre-push | 推送前 | Spec-Consistency-Analysis（增量） |
| CI Pipeline | PR 创建时 | 全量一致性校验 + 测试覆盖率 |

### AI 编码统计（Claude Code Hooks）

> 对标：GitHub/GitLab PR 统计风格（`+additions / -deletions`）

**目标**：自动统计 AI 编码的代码变更行数和文档产出量，为研发效能度量提供数据基础。

**Hook 类型**：Claude Code `Stop` hook（AI 会话结束时触发，单次采集）

**上下文采集**：

| 字段 | 来源 | 采集命令 | 说明 |
|------|------|---------|------|
| 开发人员 | Git 用户配置 | `git config user.name` | 与 commit author 一致，零配置 |
| 需求标识 | Git 分支名解析 | `git branch --show-current` | 正则提取 `FR-<FEATURE>-<NNN>` |

**分支命名规范**（AI 统计的前置依赖）：

```
feature/<FR-ID>-<description>

示例：
feature/FR-AUTH-001-user-login
feature/FR-PAY-003-refund-flow
```

解析规则：正则 `^feature/(FR-[A-Z][A-Z0-9]{1,15}-\d{3})` 提取需求 ID，与 Traceability 执行细则中的 FR ID 规范一致。分支名无法解析时，`requirement` 字段记录为 `unknown`。

**统计维度**：

| 类别 | 指标 | 采集方式 |
|------|------|---------|
| 代码变更 | 文件数、`+additions` / `-deletions` | `git diff --numstat`（已跟踪文件） |
| 文档变更 | `.md` 文件数、`+additions` / `-deletions` | `git diff --numstat` 过滤 `*.md` |
| 新建文件 | 文件数、总行数 | `git ls-files --others --exclude-standard` + `wc -l` |

**执行流程**：

```
AI 会话结束 (Stop hook)
  → git config user.name                        # 开发人员
  → git branch --show-current                   # 分支名 → 解析需求 ID
  → git diff --numstat                          # 已跟踪文件 +/-
  → git ls-files --others --exclude-standard    # 新建文件列表
  → wc -l 新文件                                # 新建文件行数
  → 按文件类型分类（代码 vs 文档）
  → 追加到 .spec-first/ai-stats.jsonl
  → 终端输出统计摘要
```

**统计记录格式**（JSONL，每行一条）：

```json
{"session":"abc123","ts":"2026-02-06T14:30:00Z","developer":"Leo","requirement":"FR-AUTH-001","branch":"feature/FR-AUTH-001-user-login","phase":"04-implement","code":{"files":5,"additions":127,"deletions":34},"docs":{"files":2,"additions":89,"deletions":12}}
```

**终端输出示例**：

```
AI Stats | Leo | FR-AUTH-001 | 04-implement | 2026-02-06 14:30
Code:  5 files  +127  -34
Docs:  2 files  +89   -12
```

**前置约定**：
1. AI 会话开始前工作区建议处于 `git clean` 状态（已 commit），确保 `git diff` 结果完整反映本次 AI 会话的产出
2. 分支命名遵循 `feature/<FR-ID>-<description>` 规范，确保需求 ID 可自动解析

### Spec-as-Code 实践

所有规范文档存放在 Git 仓库中，变更可通过 `git diff` 追溯：

```bash
# 查看需求变更
git diff specs/001-user-auth/spec.md

# 查看 API 契约变更
git diff contracts/user-api.yaml
```

---

## 落地路线图

### 第一步：跑通 7 阶段

用一个真实 Feature 走完 00-06 全流程，验证可行性。

| 动作 | 验证点 |
|------|-------|
| 选择一个中等复杂度 Feature | 覆盖所有 7 个阶段 |
| 按阶段产出标准化文档 | 产出物模板可用 |
| 每个阶段执行 Exit Gate | Gate 标准合理、不过重 |

### 第二步：引入 Quality Gate

将 Exit Gate 标准化，嵌入团队日常流程。

| 动作 | 验证点 |
|------|-------|
| 定义每个 Gate 的检查清单 | 清单可执行、耗时可控 |
| Gate 结果记录到产出物 | 可追溯 |
| 尝试部分 Gate 自动化 | CI 集成可行 |

### 第三步：引入 Spec-Consistency-Analysis

在 Design / Plan / Implement 阶段后触发跨产物校验。

| 动作 | 验证点 |
|------|-------|
| 定义校验规则（手动 Checklist） | 规则覆盖核心一致性 |
| 在 3 个阶段试运行 | 能发现真实不一致问题 |
| 逐步工具化 | 自动化校验脚本可用 |

### 第四步：引入 Change-Management

建立变更处理的标准流程。

| 动作 | 验证点 |
|------|-------|
| 定义 RFC 模板 | 变更请求格式标准化 |
| 定义影响分析流程 | 能快速评估变更范围 |
| 区分快速通道与完整流程 | 小变更不过重，大变更不遗漏 |

---

## 风险提醒

### 完美主义陷阱

7+3 模型是"理想态"，切忌一次性推行全部。渐进式引入，每步验证后再推进下一步。

### 流程过重风险

| 信号 | 应对 |
|------|------|
| 团队抱怨流程拖慢交付 | 简化 Gate 检查项，保留核心项 |
| 产出物沦为形式 | 减少模板字段，聚焦高价值内容 |
| 小 Feature 走完 7 步太重 | 定义"轻量模式"：Init → Specify → Implement → Verify |

### 轻量模式（小 Feature）

对于低复杂度 Feature，可跳过部分阶段：

```
Init → Specify → Implement → Verify → DevOps
```

跳过条件：无 API 变更、无数据模型变更、无跨团队依赖。

---

## 参考标准

| 标准 | 借鉴内容 |
|------|---------|
| **Spec-Kit** | `specify` / `clarify` / `plan` / `analyze` / `tasks` / `implement` 命令体系，Constitution 概念 |
| **Autospec** | `specify` → `plan` → `tasks` → `implement` 四阶段模型 |
| **ISO/IEC 12207** | 主过程与支撑过程分离，评审归入支撑过程 |
| **V-Model** | 测试层级与设计层级对应（单测↔详设，集成↔概设，UAT↔需求） |
| **SAFe** | Definition of Done 内嵌 Review，Sprint Retrospective |
| **CMMI REQM** | 需求管理作为持续活动，变更管理贯穿全生命周期 |

---

**作者**: Leo (况雨平)
**文档版本**: v2.1
**创建日期**: 2026-02-06
**最后更新**: 2026-02-06
