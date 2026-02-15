# Spec-First 研发流程规范 v4.2

> **版本**: v4.2 | **更新**: 2026-02-08 | **作用域**: Feature 级别
> **参考标准**: Spec-Kit、Autospec、SpecifyPlus、TypeSpec、ISO/IEC 12207、V-Model、SAFe、CMMI REQM
> **核心理念**: 规范即契约、规范即真理、全链路可追踪
> **基于**: v4.1 + 优先集成清单（四工程能力融合）

---

## v4.2 变更摘要

> 基于优先集成清单，融合四工程能力（planning-with-files / omo-skills / myclaude / everything-claude-code），将"纸面规范"升级为"可执行运行时"。

| 变更类型 | 内容 | 集成项 | 优先级 |
|---------|------|--------|-------|
| **新增** | 三文件运行态：`task_plan.md` / `findings.md` / `progress.md` 纳入产出物标准 | P0-三文件 | P0 |
| **新增** | Hook 化 Gate：PreToolUse / PostToolUse / Stop 三类 Hook 实现 Gate 自动阻断 | P0-Hook Gate | P0 |
| **新增** | 会话恢复机制：Session Catchup 确保 AI 会话中断后可恢复上下文和追踪产物 | P0-Session Catchup | P0 |
| **新增** | AI 协作编排规范（附录）：代理路由矩阵 + Context Pack 标准 | P1-代理路由/Context Pack | P1 |
| **增强** | 并行执行 + Worktree 隔离：03 Plan 和 04 Implement 阶段补充执行模型 | P1-并行执行 | P1 |
| **增强** | 落地路线图：三步与 P0/P1/P2 集成优先级对齐 | — | — |
| **新增** | 度量体系增强：新增返工率、Gate 首次通过率、缺陷逃逸率 | 流程监控 | P1 |
| **预留** | 规则分层（common + language/platform）、Hook/插件回归测试 | P2 | P2 |

---

## v4.1 变更摘要

> 基于深度审查修复 13 项问题（CRITICAL 2 / HIGH 4 / MEDIUM 3 / LOW 2 / 优化 2）

| 变更类型 | 内容 | 问题编号 |
|---------|------|---------|
| **修复** | Status 枚举统一：矩阵示例、Gate 条件、枚举表三处对齐为 🎯 Accepted | C1 |
| **修复** | 覆盖率公式补充 NFR：正向覆盖率 FR→FR∪NFR，反向合规率同步修正 | C2 |
| **修复** | 技术设计文档重命名：`plan.md` → `design.md`，消除与 03 Plan 阶段的命名混淆（12 处） | H4 |
| **修复** | 明确 Quality Gate 与 Spec-Consistency-Analysis 的调用关系（非独立并行） | H3 |
| **修复** | NFR 维度枚举改为可扩展：正则放宽为 `[A-Z]{2,5}`，新增 MAINT/SCALE/COMPAT/COMP/I18N 推荐值 | H1 |
| **修复** | 变更分级判定标准：用"是否需重新触发已通过 Gate"替代模糊的"跨阶段" | H2 |
| **修复** | AI 编码统计 Hook：`git diff` → `git diff HEAD`，新增 baseline commit 机制 | M1 |
| **修复** | 落地路线图第一步：M 规模 → S 规模，降低试错成本 | M2 |
| **修复** | 追踪矩阵生命周期：拆分 "04→06" 为 04/05/06 三行 | M3 |
| **补充** | Layer 2 多端扩展：新增 H5 端规则模板骨架 | L1 |
| **补充** | ADR/RFC 文件级 ID 与条目级 ID 的设计差异说明 | L2 |
| **补充** | 追踪矩阵新增 ⏸️ Deferred 和 🚫 Cancelled 状态 | O1 |
| **修复** | 校验脚本 macOS 兼容：`grep -oP` → `grep -oE` | O2 |

---

## v4.0 变更摘要

| 变更类型 | 内容 | 来源 |
|---------|------|------|
| **补回** | 流程速查表（升级版，含追踪校验列 + Gate Owner） | v2 丢失内容 |
| **补回** | Constitution 完整定义（角色映射 + RACI + 6 维度） | v2 丢失内容 |
| **补回** | AI 编码统计（Claude Code Hooks） | v2 丢失内容 |
| **补回** | Spec-as-Code 实践 | v2 丢失内容 |
| **补回** | Wrap-up 归档清单 | v2 丢失内容 |
| **升级** | ID 体系：Feature 内唯一 → 全局可识别（带 Feature 缩写） | v2 ID 方案 + v3 追踪体系 |
| **新增** | 流程裁剪指南（Size × Mode 产出物深度矩阵） | v4 新增 |
| **新增** | Change-Management 变更分级（Minor/Major/Critical） | v4 新增 |
| **新增** | 流程适用边界（何时用/何时不用） | v4 新增 |
| **修正** | 规模分级"涉及端点数"改为"涉及模块数" | v3 表述修正 |
| **优化** | 落地路线图从 5 步精简为 3 步 | 降低推行阻力 |
| **保留** | v3 全部核心能力（三层体系、双模式、追踪矩阵、覆盖率算法、多端扩展） | v3 继承 |

---

## 目录

- [流程适用边界](#流程适用边界)
- [核心架构](#核心架构)
- [全链路追踪体系](#全链路追踪体系)
- [主流程：7 个阶段](#主流程7-个阶段)
- [横切机制：3 个贯穿全流程的能力](#横切机制3-个贯穿全流程的能力)
- [多端扩展（Layer 2）](#多端扩展layer-2)
- [产出物标准化](#产出物标准化)
- [流程裁剪指南](#流程裁剪指南v4-新增)
- [工具链映射](#工具链映射)
- [AI 协作编排规范（v4.2 新增）](#ai-协作编排规范v42-新增)
- [落地路线图](#落地路线图3-步)
- [版本演进映射](#版本演进映射v2--v3--v4)
- [风险提醒](#风险提醒)
- [参考标准](#参考标准)
- [附属文档](#附属文档)

---

## 流程适用边界

### 适用场景

- 需要多人协作的 Feature 开发（≥2 人参与）
- 涉及 API 变更、数据模型变更的功能
- 跨团队依赖的功能开发
- 需要长期维护和追溯的核心业务功能

### 不适用场景

| 场景 | 替代方案 |
|------|---------|
| 紧急 Hotfix（线上故障修复） | 直接修复 → 事后补 RFC |
| 纯配置变更（环境变量、开关） | 走 DevOps 变更流程 |
| 文档修正（非规范文档） | 直接 PR |
| 技术债务清理（无功能变更） | 简化为 Init → Plan → Implement → Verify |
| 单人 1 天内可完成的微调 | 简化为 Specify → Implement → Verify |

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

**合并示例**：

```
Feature: 用户认证模块重构
Mode: I (Iteration)  |  Size: M  |  涉及端: H5 + Backend

合并结果：
├── Layer 0: 7 阶段全走，3 横切机制全启用
├── Layer 1 (Mode I × Size M):
│   ├── Init: 需定位历史产物
│   ├── Specify: 需做 Impact Analysis，产出物深度=标准
│   ├── Design: Research 可选，产出物深度=标准
│   └── Verify: 需做回归验证
└── Layer 2:
    ├── H5: 首屏性能 < 1.5s，浏览器兼容性矩阵
    └── Backend: API 契约先行，并发压测 ≥ 1000 QPS
```

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

### 规模分级：S / M / L

**核心原则**：不跳过阶段，而是调节每个阶段的产出物深度。

| 维度 | S（Small） | M（Medium） | L（Large） |
|------|-----------|------------|-----------|
| 涉及模块数 | 1-2 个 | 3-5 个 | 6+ 个 |
| AC 数量 | ≤ 5 | 6-15 | 16+ |
| API 变更 | 无或 1 个接口 | 2-5 个接口 | 6+ 个接口或新增服务 |
| 数据模型变更 | 无 | 字段级变更 | 表级变更或新增实体 |
| 跨团队依赖 | 无 | 1 个团队 | 2+ 个团队 |

**判定规则**：5 个维度取最高级别。

> 产出物深度矩阵详见本文档「流程裁剪指南」章节。

### 流程总览

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
└── C. Change-Management — 变更管理（分级处理，任何阶段可触发）
```

### 流程速查表

| 阶段 | 活动 | 产出物 | Exit Gate | 追踪校验项 | Gate Owner |
|------|------|--------|-----------|-----------|------------|
| 00 Init | Feature 启动 + Constitution 读取 | Feature 目录、元数据 | 目录就绪，Mode/Size/端已确认 | — | Tech Lead |
| 01 Specify | 需求分析 → PRD → ID 分配 → Clarify | `spec.md`, `traceability-matrix.md`(初始化) | DoR Sign-off，无歧义标记 | 所有 FR/NFR 已分配 ID | PM |
| 02 Design | Research → 技术选型 → API 契约 → 数据建模 | `research.md`, `design.md`, `contracts/`, `data-model.md`, ADR | Design Review + Baseline Locking | API 覆盖率 = 100% | Tech Lead / Architect |
| 03 Plan | 任务拆解 → 依赖分析 → Checklist | `tasks.md`, `checklist.md` | Task Review | Task 覆盖率 = 100%，Task 合规率 = 100% | Tech Lead |
| 04 Implement | 按 TASK 开发 → TDD → Code Review | 代码、单元测试、CR Report | Code CR + 覆盖率达标 | PR 合规率 = 100% | Tech Lead / Peer |
| 05 Verify | 测试设计 → 执行 → 安全扫描 → UAT | Test Report, Security Report, UAT Sign-off | UAT Sign-off + 安全无高危 | Test 覆盖率 = 100%，TC 合规率 = 100% | QA Lead + PM |
| 06 Wrap-up | 复盘 → 归档 → Spec 同步 → 矩阵校验 | Retro Report, 完整 `traceability-matrix.md` | 文档完整性 + 归档清单通过 | 实现覆盖率 = 100%，矩阵全 🎯 | Tech Lead |

---

## 全链路追踪体系

### 设计目标

解决 v2.0 的核心缺陷：FR→Task 映射存在但缺少统一 ID 体系，导致 Spec-Consistency-Analysis 无法稳定自动化，难以审计"遗漏需求"和"过度实现"。

v4 在 v3 基础上进一步升级：采用 v2 的全局可识别 ID 格式（带 Feature 缩写），使 ID 脱离目录上下文后仍可识别来源，在 PR 描述、Commit message、跨团队沟通中更实用。

### ID 规范

#### 设计原则

- **稳定性**：ID 一次分配，终身不改；需求废弃后不得复用
- **可解析**：统一前缀和序号位数，支持正则校验
- **全局可识别**：ID 携带 Feature/Domain 缩写，脱离目录上下文仍可识别来源

#### ID 类型定义

| 前缀 | 全称 | 格式 | 示例 | 正则 | 定义阶段 |
|------|------|------|------|------|---------|
| `FR` | Functional Requirement | `FR-<FEAT>-NNN` | `FR-AUTH-001` | `^FR-[A-Z][A-Z0-9]{1,15}-\d{3}$` | 01. Specify |
| `NFR` | Non-Functional Req | `NFR-<DIM>-NNN` | `NFR-SEC-001` | `^NFR-[A-Z]{2,5}-\d{3}$` | 01. Specify |
| `API` | API Endpoint | `API-<SVC>-NNN` | `API-AUTH-001` | `^API-[A-Z][A-Z0-9]{1,15}-\d{3}$` | 02. Design |
| `TASK` | Implementation Task | `TASK-<FEAT>-NNN` | `TASK-AUTH-001` | `^TASK-[A-Z][A-Z0-9]{1,15}-\d{3}$` | 03. Plan |
| `TC` | Test Case | `TC-<LVL>-<FEAT>-NNN` | `TC-E2E-AUTH-001` | `^TC-(UT\|IT\|E2E)-[A-Z][A-Z0-9]{1,15}-\d{3}$` | 05. Verify |
| `ADR` | Architecture Decision | `ADR-NNN` | `ADR-001` | `^ADR-\d{3}$` | 02. Design |
| `RFC` | Request for Change | `RFC-NNN` | `RFC-001` | `^RFC-\d{3}$` | 横切机制 C |

**说明**：
- `<FEAT>` 为 Feature 缩写（1-16 位大写字母+数字），如 AUTH、PAY、ORDER
- `<DIM>` 为 2-5 位大写字母的维度缩写。推荐枚举：`PERF`（性能）、`SEC`（安全）、`REL`（可靠性）、`AVAIL`（可用性）、`OBS`（可观测性）；可按需扩展：`MAINT`（可维护性）、`SCALE`（可扩展性）、`COMPAT`（兼容性）、`COMP`（合规性）、`I18N`（国际化）等
- `<LVL>` 固定枚举：`UT`（单元测试）、`IT`（集成测试）、`E2E`（端到端测试）
- `<SVC>` 为服务/模块缩写，与 `<FEAT>` 规则相同
- NNN 为三位数字，从 001 开始递增
- ADR/RFC 为文件名 ID（一个文件对应一个 ID），与 FR/TASK/TC 的条目级 ID（一个文件包含多个 ID）不同。原因：ADR 和 RFC 本身是独立决策/变更记录，每份文档承载一个完整的决策或变更请求，天然以文件为粒度

#### ID 声明格式

**spec.md 中声明 FR/NFR**：

```markdown
### 功能需求

#### FR-AUTH-001: 用户邮箱注册
**As** 用户 **I want** 通过邮箱注册 **So that** 我可以使用系统

**Acceptance Criteria**:
- AC-1: Given 有效邮箱，When 提交注册，Then 创建账户并发送验证邮件
- AC-2: Given 已注册邮箱，When 提交注册，Then 提示"邮箱已注册"

#### FR-AUTH-002: 用户密码登录
...

### 非功能需求

#### NFR-PERF-001: 注册接口性能
- 指标：P99 < 200ms
- 并发：支持 1000 QPS
```

**tasks.md 中声明 TASK 并引用 FR**：

```markdown
#### TASK-AUTH-001: 实现用户注册接口
- **traces**: FR-AUTH-001, FR-AUTH-002
- **depends_on**: —
- **parallel**: [P]
- **AC 映射**: FR-AUTH-001/AC-1, FR-AUTH-001/AC-2

#### TASK-AUTH-002: 实现注册邮件发送
- **traces**: FR-AUTH-001
- **depends_on**: TASK-AUTH-001
```

**tests/*.test.md 中声明 TC 并引用 FR**：

```markdown
#### TC-E2E-AUTH-001: 验证邮箱注册成功
- **verifies**: FR-AUTH-001/AC-1
- **type**: E2E
- **steps**: ...
- **expected**: 账户创建成功，验证邮件已发送
```

**contracts/*.yaml 中声明 API**：

```yaml
paths:
  /api/v1/users:
    post:
      operationId: API-AUTH-001
      summary: 用户注册
      x-traces: [FR-AUTH-001, FR-AUTH-002]
```

#### 跨产物引用规则

| 引用场景 | 格式 | 示例 |
|---------|------|------|
| 产出物正文中引用 | 直接写 ID | "本设计实现 FR-AUTH-001 的注册功能" |
| 结构化元数据引用 | `traces: [ID, ...]` | `traces: [FR-AUTH-001, FR-AUTH-002]` |
| AC 级别引用 | `ID/AC-N` | `FR-AUTH-001/AC-2` |
| 代码注释引用 | `// implements: ID` | `// implements: TASK-AUTH-001, traces: FR-AUTH-001` |
| Git Commit 引用 | `[ID] message` | `[TASK-AUTH-001] 实现用户注册接口` |
| PR 描述引用 | `Implements: ID` | `Implements: TASK-AUTH-001, TASK-AUTH-002` |

**强制规则**：

- 每个 TASK 必须有 `traces` 字段，引用至少 1 个 FR 或 NFR
- 每个 TC 必须有 `verifies` 字段，引用至少 1 个 FR/AC
- 每个 PR 描述中必须包含至少 1 个 TASK ID
- 无 traces 的 TASK 视为"过度实现"，需在 CR 中说明理由
- **跨 Feature 引用**：v4 ID 自带 Feature 缩写（如 `FR-AUTH-001`），脱离目录上下文即可识别来源，无需 v3 的 `Feature-NNN:ID` 前缀

### 追踪矩阵

#### 定义

追踪矩阵（Traceability Matrix）是全链路追踪的核心产出物，记录 FR/NFR 从需求到代码的完整映射链路。

**产出物**：`traceability-matrix.md`，存放于 Feature 目录根下。

#### 矩阵格式

```markdown
# 追踪矩阵 — <Feature Name>

| 需求 ID | Design Ref | API/Data Ref | Task Ref | Test Case Ref | PR Ref | Status |
|---------|-----------|-------------|----------|--------------|--------|--------|
| FR-AUTH-001 | design.md §2.1 | API-AUTH-001 | TASK-AUTH-001, TASK-AUTH-002 | TC-E2E-AUTH-001 | #123 | 🎯 Accepted |
| FR-AUTH-002 | design.md §2.3 | API-AUTH-002 | TASK-AUTH-003 | TC-IT-AUTH-001 | #124 | 🎯 Accepted |
| NFR-PERF-001 | design.md §3.1 | — | TASK-AUTH-004 | TC-IT-AUTH-002 | #125 | 🎯 Accepted |
```

**Status 状态枚举**（支持矩阵生命周期中的渐进填充）：

| 状态 | 含义 | 典型阶段 |
|------|------|---------|
| 📋 Planned | 需求已录入，尚未开始设计/实现 | 01. Specify |
| 🔨 Implemented | 已有 TASK 和 PR，尚未测试验证 | 04. Implement |
| ✅ Verified | 已有 TC 且测试通过 | 05. Verify |
| 🎯 Accepted | UAT 签核通过，正式验收 | 06. Wrap-up |
| ⏸️ Deferred | 需求推迟到后续版本 | 任何阶段 |
| 🚫 Cancelled | 需求已取消（需记录取消原因） | 任何阶段 |
| ❌ Not Implemented | 需求未被实现（遗漏） | 任何阶段 |

#### 矩阵生命周期

| 阶段 | 矩阵操作 | 填充列 |
|------|---------|--------|
| 01. Specify | 创建矩阵，填入所有 FR/NFR | 需求 ID |
| 02. Design | 填充设计引用和 API/Data 引用 | Design Ref, API/Data Ref |
| 03. Plan | 填充任务引用 | Task Ref |
| 04. Implement | 填充 PR 引用 | PR Ref |
| 05. Verify | 填充测试用例引用，更新 Status 为 ✅ Verified | Test Case Ref, Status |
| 06. Wrap-up | 更新 Status 为 🎯 Accepted | Status |

### 覆盖率算法

#### 正向覆盖率（需求是否被实现）

| 指标 | 公式 | 校验阶段 | Gate 阈值 |
|------|------|---------|----------|
| **Task 覆盖率** | \|FR∪NFR with ≥1 TASK\| / \|Total FR + NFR\| × 100% | 03. Plan Gate | = 100% |
| **Test 覆盖率** | \|FR∪NFR with ≥1 TC\| / \|Total FR + NFR\| × 100% | 05. Verify Gate | = 100% |
| **实现覆盖率** | \|FR∪NFR with ≥1 PR\| / \|Total FR + NFR\| × 100% | 06. Wrap-up Gate | = 100% |
| **API 覆盖率** | \|FR(需API) with ≥1 API\| / \|Total FR(需API)\| × 100% | 02. Design Gate | = 100% |

**解读**：正向覆盖率 < 100% = 存在**遗漏需求**（含遗漏的非功能需求）。

#### 反向合规率（实现是否有需求依据）

| 指标 | 公式 | 校验阶段 | Gate 阈值 |
|------|------|---------|----------|
| **Task 合规率** | \|TASK with ≥1 FR/NFR ref\| / \|Total TASK\| × 100% | 03. Plan Gate | = 100% |
| **TC 合规率** | \|TC with ≥1 FR/NFR ref\| / \|Total TC\| × 100% | 05. Verify Gate | = 100% |
| **PR 合规率** | \|PR with ≥1 TASK ref\| / \|Total PR\| × 100% | 04. Implement Gate | = 100% |

**解读**：反向合规率 < 100% = 存在**过度实现**。

#### 综合指标

| 指标 | 公式 | 目标 |
|------|------|------|
| **孤儿项率** | 未关联 FR/NFR 的 (TASK + TC + PR) 数 / 全部 (TASK + TC + PR) 数 × 100% | = 0% |

**解读**：孤儿项率 > 0% = 存在未与需求关联的产物，是反向合规率的综合视角补充。

#### 流程健康度指标 (v4.2 新增)

| 指标 | 公式 | 采集方式 | 目标 |
|------|------|---------|------|
| **返工率** | (Gate 驳回次数 + PR Request Changes 次数) / (Gate 触发总数 + PR 总数) × 100% | CI/CD 流水线统计 | < 10% |
| **Gate 首次通过率** | 首次触发即通过的 Gate 次数 / Gate 触发总数 × 100% | 流程引擎统计 | > 85% |
| **缺陷逃逸率** | 生产环境发现的 Bug 数 / (生产 Bug + 测试 Bug) × 100% | Bug 跟踪系统 | < 2% |

**解读**：
- **返工率**：反映上游（Specify/Design/Plan）的质量。如果 Implement 阶段返工高，通常是 Specify 或 Design 没做好。
- **Gate 首次通过率**：反映团队对准出标准的理解和执行力。低通过率意味着"碰运气"心态严重。

### 追踪链路全景

```
01. Specify          02. Design           03. Plan          04. Implement      05. Verify
┌──────────┐     ┌──────────────┐     ┌───────────┐     ┌────────────┐    ┌──────────┐
│FR-AUTH-001│────▶│design.md §2.1│────▶│TASK-AUTH-001────▶│ PR #123    │    │TC-E2E-AUTH-001
│FR-AUTH-002│────▶│ API-AUTH-001 │────▶│TASK-AUTH-002────▶│ PR #123    │    │TC-IT-AUTH-001
│NFR-PERF-001───▶│design.md §3.1│────▶│TASK-AUTH-003────▶│ PR #124    │    │TC-IT-AUTH-002
└──────────┘     └──────────────┘     └───────────┘     └────────────┘    └──────────┘
     │                                      │                                   │
     └──────────────────────────────────────┴───────────────────────────────────┘
                              traceability-matrix.md（汇总）
```

---

## 主流程：7 个阶段

### 00. Init（Feature 启动）

> 对标：Spec-Kit `init`。明确为 Feature 级启动（非项目级），Constitution 为项目级一次性产物。

| 维度 | 内容 |
|------|------|
| **目标** | 启动 Feature，确定 Mode/Size/涉及端，创建工作空间 |
| **活动** | 读取 Constitution → 确定 Mode（N/I）→ 确定 Size（S/M/L）→ 确定涉及端 → 创建 Feature 目录 → **初始化运行态三文件** |
| **产出物** | Feature 目录结构、Feature 元数据（mode, size, platforms）、`task_plan.md` / `findings.md` / `progress.md`（初始化） |
| **Exit Gate** | 目录结构就绪，Mode/Size/涉及端已确认并记录 |

**Mode I 额外活动**：定位历史 Feature 产物，读取已有 spec/plan/contracts。

**Constitution（项目宪法）**为项目级一次性产物，存放于项目根目录，包含 6 个维度：

| 维度 | 示例内容 |
|------|---------|
| 技术约束 | 语言、框架、依赖上限 |
| 质量标准 | 测试覆盖率底线、代码复杂度上限 |
| 流程约束 | API 必须先定义契约再实现 |
| 简洁性原则 | 依赖数量上限、抽象层级限制 |
| 协作规范 | PR 必须有 review、文档与代码同步 |
| 角色与职责 | 角色映射表 + RACI 矩阵（见下） |

**角色映射表模板**（在 `constitution.md` 中维护）：

| 角色类型 | 职责 | 映射到（示例） |
|---------|------|--------------|
| PM | 需求签核、UAT 验收 | 张三 |
| Tech Lead | 设计评审、任务评审、代码 CR 终审 | 李四 |
| Architect | 架构决策评审（L 规模必须参与） | 王五 |
| QA Lead | 测试方案评审、UAT 签核 | 赵六 |
| Dev（Peer） | 代码 CR | 按任务分配 |

> 角色映射表为项目级配置，Gate Owner 引用角色类型，不绑定具体人名。

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

> RACI 矩阵为可选配置。小团队可不填，大团队按需细化。每行有且仅有一个 A。

**关键实践**：
- Constitution 一旦确立，变更需走 Change-Management 横切机制
- 后续所有阶段的决策不得违背 Constitution

---

### 01. Specify（需求规格化）

> 对标：Spec-Kit `specify` + `clarify`。新增 ID 分配活动，Mode I 新增 Impact Analysis。

| 维度 | 内容 |
|------|------|
| **目标** | 将业务意图转化为带唯一 ID 的结构化需求契约 |
| **活动** | 需求分析 → 结构化 PRD → **ID 分配（FR/NFR）** → Clarify |
| **产出物** | `spec.md`（含 FR-FEAT-NNN, NFR-DIM-NNN）、`traceability-matrix.md`（初始化） |
| **Exit Gate** | DoR Sign-off + 无 `[NEEDS CLARIFICATION]` 标记 + 所有 FR/NFR 已分配 ID |

**子步骤**：

1. **Requirements-Analysis**：逻辑解构，剥离视觉表现，专注业务规则
   - 产出：Domain Model, Logic Flow
   - 核心原则：*Think in Constraints, not in UI*

2. **Structured-PRD**：结构化需求文档
   - User Stories（As-I-So 格式），每条分配 `FR-<FEAT>-NNN`
   - Acceptance Criteria（Given-When-Then 格式），编号为 `FR-<FEAT>-NNN/AC-N`
   - Non-Functional Specifications，每条分配 `NFR-<DIM>-NNN`

3. **Clarify**：系统化歧义消除
   - 自动扫描 `[NEEDS CLARIFICATION]` 标记
   - 所有歧义必须在本阶段消除，不得带入 Design

4. **追踪矩阵初始化**：创建 `traceability-matrix.md`，填入所有 FR/NFR ID

**Mode I 额外活动**：Impact Analysis → 输出 `impact-analysis.md`（影响范围清单 + 风险评估）。

---

### 02. Design（技术设计）

> 对标：Spec-Kit `plan`。新增 Research 子步骤，API 分配 ID。

| 维度 | 内容 |
|------|------|
| **目标** | 将需求规格转化为可实现的技术方案，API 端点分配唯一 ID |
| **活动** | **Research** → 技术选型 → 架构设计 → API 契约设计（分配 API-SVC-NNN）→ 数据建模 |
| **产出物** | `research.md`, `design.md`, `contracts/`, `data-model.md`, ADR |
| **Exit Gate** | 设计评审 + Spec-Consistency-Analysis + API 覆盖率 = 100% |

**子产出物**：

1. **Research**
   - 技术可行性调研
   - 备选方案对比（含 Trade-off 分析）
   - 未知项清单及解决方案
   - 第三方依赖评估

2. **Technical-Design**：架构决策与技术选型
   - ADR（`adr/NNN-*.adr.md`）
   - 系统架构图（组件图、部署图）
   - **Decisions & Rationale** 章节

3. **API-Design**：API 契约设计
   - OpenAPI Spec / GraphQL Schema，每个端点分配 `API-<SVC>-NNN`
   - 接口版本策略、错误码规范

4. **Data-Modeling**：数据建模
   - ERD、State Machine Diagram、数据字典

**追踪矩阵更新**：填充 Design Ref 和 API/Data Ref 列。

---

### 03. Plan（任务规划）

> 对标：Spec-Kit `tasks`。新增 Checklist，TASK 分配 ID 并强制引用 FR，新增并行化标记。

| 维度 | 内容 |
|------|------|
| **目标** | 将技术设计拆解为带 ID 的可执行任务清单 |
| **活动** | 任务拆解（分配 TASK-FEAT-NNN）→ 依赖分析 → Checklist 生成 |
| **产出物** | `tasks.md`（含 TASK-FEAT-NNN + traces）, `checklist.md` |
| **Exit Gate** | 任务评审 + Task 覆盖率 = 100% + Task 合规率 = 100% |

**任务拆解标准**：

- 每个任务分配 `TASK-<FEAT>-NNN`，必须包含 `traces: [FR-<FEAT>-NNN, ...]`
- 任务粒度：单人 1-3 天可完成
- 依赖关系显式标注：`depends_on: [TASK-<FEAT>-NNN]`
- 可并行任务标记：`[P]`

**Checklist**：
- 从 AC 派生的验证场景清单
- 作为 Implement 和 Verify 的输入

**追踪矩阵更新**：填充 Task Ref 列，校验 Task 覆盖率。

---

### 04. Implement（规范驱动开发）

> 对标：Spec-Kit `implement`。PR 强制关联 TASK ID，代码注释引用规范。

| 维度 | 内容 |
|------|------|
| **目标** | 按任务清单实现代码，确保每行代码可追溯到需求 |
| **活动** | 按 TASK 开发 → TDD → Code Review（含追踪合规审查） |
| **产出物** | 代码实现、单元测试、CR Report |
| **Exit Gate** | Code CR 通过 + 覆盖率达标 + PR 合规率 = 100% |

**开发规范**：

- 每个 TASK 开发前，重读对应 FR 条目
- TDD：先写测试（基于 AC），再写实现
- 代码关键位置标注追踪引用：`// implements: TASK-AUTH-001, traces: FR-AUTH-001`
- Git Commit 格式：`[TASK-<FEAT>-NNN] 提交描述`
- PR 描述必须包含：`Implements: TASK-<FEAT>-NNN, TASK-<FEAT>-NNN`

**并行执行与隔离**（v4.2 新增）：

- 标记 `[P]` 的 TASK 可并行开发，每个并行 TASK 使用独立 Git 分支
- 高风险并行任务（涉及共享模块或数据模型变更）推荐使用 Git Worktree 隔离，避免工作区冲突
- 并行 TASK 合并前必须通过增量 Spec-Consistency-Analysis
- AI 辅助场景下，可通过 codeagent-wrapper 等工具实现多 Agent 并行执行

**过程记录**（v4.2 新增）：

- 每个 TASK 完成后更新 `progress.md`，记录完成状态和关键决策
- 开发过程中的技术发现记录到 `findings.md`

**Code Review 标准**：

- 功能正确性：是否满足 AC
- 契约一致性：代码是否与 API Spec / Data Model 一致
- Constitution 合规：是否违背项目原则
- **追踪合规**：PR 是否关联了 TASK ID，TASK 是否有 FR 依据

**追踪矩阵更新**：填充 PR Ref 列。

---

### 05. Verify（验证）

> 对标：V-Model 系统测试 + 验收测试。TC 分配 ID 并强制引用 FR/AC，Test 覆盖率纳入 Gate。

| 维度 | 内容 |
|------|------|
| **目标** | 验证实现是否满足所有 AC 和 NFR，每个 TC 可追溯到需求 |
| **活动** | 测试设计（分配 TC-LVL-FEAT-NNN）→ 测试执行 → 安全扫描 → UAT |
| **产出物** | Test Report, Security Report, UAT Sign-off |
| **Exit Gate** | 全部 AC 通过 + 安全无高危 + Test 覆盖率 = 100% + TC 合规率 = 100% |

**子活动**：

1. **Test-Design**：测试用例设计
   - 每个 TC 分配 `TC-<LVL>-<FEAT>-NNN`，必须包含 `verifies: [FR-<FEAT>-NNN/AC-N]`
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

> 对标：SAFe Sprint Retrospective。追踪矩阵归档为必须产出物，补回归档清单。

| 维度 | 内容 |
|------|------|
| **目标** | 复盘交付，归档文档，确保追踪矩阵完整闭环 |
| **活动** | 复盘 → 文档归档 → Spec 同步 → 追踪矩阵最终校验 |
| **产出物** | Retro Report, 更新后的 Spec 文档, 完整的 `traceability-matrix.md` |
| **Exit Gate** | 文档完整性 + 实现覆盖率 = 100% + 追踪矩阵 Status 全部为 🎯 Accepted 或 🚫 Cancelled |

**关键活动**：

- Retrospective：回顾流程执行情况
- 文档归档：按归档清单逐项检查
- Spec 同步：如有实现偏差，更新 Spec 使其与最终实现一致
- **追踪矩阵最终校验**：确认所有 FR/NFR 的 Status 为 🎯 Accepted 或 🚫 Cancelled
- Action Items：提炼改进项

**归档清单**（Exit Gate 检查依据）：

| 来源阶段 | 归档文件 | 检查标准 |
|---------|---------|---------|
| 00 Init | `constitution.md` | 版本与实际执行一致 |
| 01 Specify | `spec.md` | 与最终实现对齐，无过期 AC |
| 01 Specify | `traceability-matrix.md` | 所有行 Status 为 ✅ |
| 02 Design | `design.md` | 与最终实现对齐 |
| 02 Design | `contracts/*.yaml` | 与实际 API 签名一致 |
| 02 Design | `data-model.md` | 与实际 Schema 一致 |
| 02 Design | `adr/*.adr.md` | 决策记录完整 |
| 03 Plan | `tasks.md` | 所有 Task 状态已闭合 |
| 04 Implement | 代码 + 单元测试 | CR 通过，覆盖率达标 |
| 05 Verify | `tests/*.test.md` | 测试用例已归档 |
| 05 Verify | `reports/test-report.md` | 测试执行报告已归档 |
| 05 Verify | `reports/security-scan.md` | 安全扫描报告已归档 |
| 05 Verify | `reports/uat-signoff.md` | 验收签核记录已归档 |
| 横切 C | `rfc/*.rfc.md` | 所有变更请求已闭合 |
| 06 Wrap-up | `retro.md` | 复盘完成，Action Items 已提炼 |
| 全阶段（v4.2） | `task_plan.md` | 规划记录完整，与 tasks.md 一致 |
| 全阶段（v4.2） | `findings.md` | 过程发现已归档，关键发现已反馈到产出物 |
| 全阶段（v4.2） | `progress.md` | 进度记录完整，所有阶段有连续记录 |

**完成后** → 交由 DevOps 系统执行发布流程

---

## 横切机制：3 个贯穿全流程的能力

### A. Quality Gate（质量门禁）

> Review 不是独立节点，而是每个阶段的准出条件。Gate 中嵌入追踪覆盖率校验，补回 Gate Owner。

| 阶段 | Gate 内容 | 追踪校验项 | Gate Owner |
|------|----------|-----------|------------|
| 00. Init | 目录就绪，Mode/Size/端已确认 | — | Tech Lead |
| 01. Specify | DoR Sign-off，无歧义标记 | 所有 FR/NFR 已分配 ID | PM |
| 02. Design | 设计评审 + Baseline Locking | API 覆盖率 = 100% | Tech Lead / Architect |
| 03. Plan | 任务评审 | Task 覆盖率 = 100%，Task 合规率 = 100% | Tech Lead |
| 04. Implement | Code CR + 覆盖率达标 | PR 合规率 = 100% | Tech Lead / Peer |
| 05. Verify | UAT Sign-off + 安全无高危 | Test 覆盖率 = 100%，TC 合规率 = 100% | QA Lead + PM |
| 06. Wrap-up | 文档完整性 + 归档清单 | 实现覆盖率 = 100%，矩阵全 🎯 | Tech Lead |

**执行原则**：

- Gate 未通过，不得进入下一阶段
- Gate 结果记录在对应阶段的产出物中
- **Gate 与 SCA 的关系**：Quality Gate 的"追踪校验项"通过调用 Spec-Consistency-Analysis（横切机制 B）执行，校验结果纳入 Gate 放行判定。两者是调用关系而非独立并行
- 追踪覆盖率校验可由工具自动化执行
- Gate Owner 负责最终放行决策；角色到人的映射见 `constitution.md`

**Hook 化 Gate 自动执行**（v4.2 新增）：

Gate 校验通过 Claude Code Hooks 实现自动阻断，分三类 Hook：

| Hook 类型 | 触发时机 | Gate 校验内容 | 阻断行为 |
|----------|---------|-------------|---------|
| PreToolUse | AI 执行写操作前 | 当前阶段 Gate 前置条件是否满足 | 条件不满足时阻止写操作 |
| PostToolUse | AI 执行写操作后 | 产出物是否符合当前阶段规范 | 不符合时提示修正 |
| Stop | AI 会话结束时 | 完成度校验（三文件 + 追踪产物同步） | 输出完成度报告 |

**执行层次**：Hook 自动校验 → 不通过则阻断 → Gate Owner 人工终审放行。Hook 是 Gate 的"自动化执行层"，不替代人工审核。

---

### B. Spec-Consistency-Analysis（规范一致性校验）

> 触发时机从 v2 的 3 个扩展为 5 个，校验基于 ID 体系自动化。

**定位**：跨产物一致性校验，基于 ID 追踪链确保 spec ↔ design ↔ tasks ↔ code ↔ test 始终对齐。

| # | 触发时机 | 校验内容 | 基于 ID 的校验规则 |
|---|---------|---------|-------------------|
| 1 | **Specify 完成后** | spec 内部一致性 | AC 是否覆盖所有 FR、NFR 是否量化、FR 间无矛盾 |
| 2 | **Design 完成后** | spec ↔ design | 每个 FR 有对应设计方案，API 覆盖所有需要接口的 FR |
| 3 | **Plan 完成后** | spec ↔ tasks | Task 覆盖率 = 100%，Task 合规率 = 100% |
| 4 | **Implement 完成后** | spec ↔ code | PR 合规率 = 100%，API 实现与契约一致 |
| 5 | **Verify 完成后** | spec ↔ test results | Test 覆盖率 = 100%，所有 AC 有对应 TC 且通过 |

**关键实践**：

- 校验结果生成 Consistency Report
- 不一致项必须在当前阶段修复，不得带入下一阶段
- 支持增量校验（仅校验本次变更涉及的产物）

---

### C. Change-Management（变更管理）

> 对标：ISO 12207 支撑过程、CMMI REQM。v4 新增变更分级机制。

**定位**：任何阶段均可触发的变更处理机制。

| 触发条件 | 动作 | 基于 ID 的影响定位 |
|---------|------|-------------------|
| 需求变更 | RFC → Impact Analysis → Spec 更新 | 通过 FR-FEAT-NNN 追踪链定位受影响的 TASK/TC/API/PR |
| 设计变更 | ADR 更新 → 下游产物同步 | 通过 API-SVC-NNN 定位受影响的 TASK 和 TC |
| 实现偏差 | 评估是否需要更新 Spec | 通过 TASK-FEAT-NNN 反向追溯到 FR |
| Constitution 变更 | 全流程影响评估 | 所有产物重新校验 |

**变更分级**（v4 新增）：

| 级别 | 定义 | 审批要求 | 流程 |
|------|------|---------|------|
| **Minor** | 影响 ≤2 个产物，且不需要重新触发已通过的 Gate | Tech Lead 审批 | 快速通道：直接修改 + 触发增量校验 |
| **Major** | 影响 3-5 个产物，或需要重新触发已通过的 Gate | Tech Lead + PM 审批 | 标准流程：RFC → Impact Analysis → 执行 |
| **Critical** | 涉及 Constitution 或架构变更 | Tech Lead + PM + Architect 审批 | 完整流程：RFC → 全量 Impact Analysis → 评审会 → 执行 |

**判定规则**：两个维度取较高级别。示例：修改 spec.md 中 1 条 FR 的措辞（影响 1 个产物），但该 FR 已有对应 TASK 和 TC（需重新触发 Plan Gate 和 Verify Gate）→ 判定为 **Major**。

**变更流程**：

- **Minor**（快速通道）：直接修改 + Tech Lead 审批 + 触发增量 Spec-Consistency-Analysis，无需提交 RFC
- **Major / Critical**：
  1. 提交 RFC（`rfc/NNN-*.rfc.md`）
  2. Impact Analysis：基于追踪矩阵，通过 ID 链自动定位受影响的产物
  3. 审批：根据变更级别决定审批人
  4. 执行：更新受影响的产物，同步更新追踪矩阵
  5. 触发 Spec-Consistency-Analysis 重新校验

---

## 多端扩展（Layer 2）

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

**端规则模板**（以 H5 为例，其他端参照此结构编写）：

```markdown
# H5 端规范 — platform-rules/h5-rules.md

## Entry Criteria（准入条件）
| 阶段 | 准入条件 |
|------|---------|
| 02. Design | 确认目标浏览器兼容性矩阵（Chrome/Safari/Firefox 最近 2 个大版本） |
| 04. Implement | 已配置 Lighthouse CI 基线 |

## Deliverables（额外产出物）
| 阶段 | 额外产出物 |
|------|-----------|
| 02. Design | 响应式断点方案、首屏加载策略 |
| 05. Verify | Lighthouse 性能报告、浏览器兼容性测试报告 |

## Exit Gate Items（额外检查项）
| 阶段 | 检查项 | 阈值 |
|------|--------|------|
| 04. Implement | 首屏 LCP | < 1.5s |
| 04. Implement | Bundle Size 增量 | < 50KB (gzip) |
| 05. Verify | Lighthouse Performance Score | ≥ 90 |
| 05. Verify | 浏览器兼容性矩阵全通过 | 100% |
```

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
| 技术设计 | `design.md` | — |
| API 契约 | `contracts/*.yaml` | `contracts/user-api.yaml` |
| 数据模型 | `data-model.md` | — |
| 任务清单 | `tasks.md` | — |
| 验证清单 | `checklist.md` | — |
| 架构决策 | `adr/NNN-*.adr.md` | `adr/001-jwt-vs-session.adr.md` |
| 测试用例 | `tests/*.test.md` | `tests/user-auth.test.md` |
| 变更请求 | `rfc/NNN-*.rfc.md` | `rfc/001-add-mfa.rfc.md` |
| 回归报告 | `regression-report.md` | Mode I 专属 |
| 复盘报告 | `retro.md` | — |
| **过程规划**（v4.2） | `task_plan.md` | 运行态三文件之一 |
| **过程发现**（v4.2） | `findings.md` | 运行态三文件之一 |
| **过程进度**（v4.2） | `progress.md` | 运行态三文件之一 |

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
        ├── traceability-matrix.md     # 追踪矩阵
        ├── impact-analysis.md         # Mode I 专属
        ├── research.md                # 技术调研
        ├── design.md                  # 技术设计
        ├── contracts/                 # API 契约（含 API ID）
        │   └── *.yaml
        ├── data-model.md              # 数据模型
        ├── tasks.md                   # 任务清单（含 TASK ID + traces）
        ├── checklist.md               # 验证清单
        ├── adr/                       # 架构决策记录
        │   └── NNN-*.adr.md
        ├── tests/                     # 测试用例（含 TC ID + verifies）
        │   └── *.test.md
        ├── reports/                   # 测试与安全报告
        │   ├── test-report.md
        │   ├── security-scan.md
        │   └── uat-signoff.md
        ├── rfc/                       # 变更请求
        │   └── NNN-*.rfc.md
        ├── regression-report.md       # Mode I 专属
        ├── retro.md                   # 复盘报告
        ├── task_plan.md               # v4.2: 过程规划（运行态三文件）
        ├── findings.md                # v4.2: 过程发现（运行态三文件）
        └── progress.md                # v4.2: 过程进度（运行态三文件）
```

---

## 流程裁剪指南（v4 新增）

**核心原则**：不跳过阶段，调节产出物深度。

### 产出物深度矩阵（Size × Mode × 产出物）

| 产出物 | S（Small） | M（Medium） | L（Large） |
|--------|-----------|------------|-----------|
| `spec.md` | 简版：User Stories + AC | 标准版：完整 PRD | 完整版：含 Domain Model + Logic Flow |
| `research.md` | 可省略 | 简版：关键决策记录 | 完整版：备选方案对比 + Trade-off |
| `design.md` | 简版：核心设计决策 | 标准版：架构图 + ADR | 完整版：含部署图 + 性能方案 |
| `contracts/` | 可内嵌于 design.md | 独立 YAML 文件 | 独立 YAML + Mock Server |
| `data-model.md` | 可省略（无数据变更时） | 简版：ERD | 完整版：ERD + 状态机 + 数据字典 |
| `tasks.md` | 简版：任务列表 + traces | 标准版：含依赖图 + 并行标记 | 完整版：含里程碑 + 风险项 |
| `checklist.md` | 可内嵌于 tasks.md | 独立文件 | 独立文件 + 按端拆分 |
| `tests/*.test.md` | 简版：核心路径 TC | 标准版：含边界条件 | 完整版：含异常路径 + 性能测试 |
| `traceability-matrix.md` | 必须（简化列） | 必须（完整列） | 必须（完整列 + 跨端标注） |
| `retro.md` | 简版：3 个要点 | 标准版 | 完整版：含量化指标 |

### Mode I 额外产出物深度（Size × Mode I 增量）

Mode I 相比 Mode N 多出以下产出物，深度同样按 Size 裁剪：

| 产出物 | S（Small） | M（Medium） | L（Large） |
|--------|-----------|------------|-----------|
| `impact-analysis.md` | 简版：影响模块列表 | 标准版：影响范围 + 风险评估 | 完整版：含回归测试范围建议 + 依赖链分析 |
| `regression-report.md` | 简版：核心路径回归结果 | 标准版：含关联模块回归 | 完整版：全量回归 + 性能对比 |

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
| Pre-commit | 代码提交前 | Commit message 包含 TASK-FEAT-NNN |
| Pre-push | 推送前 | Spec-Consistency-Analysis（增量） |
| CI Pipeline | PR 创建时 | 全量一致性校验 + 追踪覆盖率 |

### 追踪体系工具化支撑

| 校验项 | 自动化方式 | 触发时机 |
|--------|-----------|---------|
| ID 格式校验 | Regex lint | Pre-commit |
| TASK traces 完整性 | 脚本扫描 tasks.md 中无 traces 的 TASK | Plan Gate |
| TC verifies 完整性 | 脚本扫描 tests/ 中无 verifies 的 TC | Verify Gate |
| 正向覆盖率计算 | 脚本对比 spec.md FR 集合 vs tasks.md traces 集合 | Plan/Verify/Wrap-up Gate |
| 反向合规率计算 | 脚本对比 tasks.md TASK 集合 vs traces 非空集合 | Plan Gate |
| PR 关联校验 | CI 检查 PR description 是否包含 TASK ID | PR 创建时 |
| Commit message 校验 | Git hook 检查 `[TASK-FEAT-NNN]` 格式 | Pre-commit |

**校验脚本示例**：

```bash
# 示例：校验 Task 覆盖率
# 1. 从 spec.md 提取所有 FR-FEAT-NNN
# 2. 从 tasks.md 提取所有 TASK 的 traces 字段中的 FR 引用
# 3. 对比计算覆盖率

grep -oE 'FR-[A-Z][A-Z0-9]{1,15}-[0-9]{3}' spec.md | sort -u > /tmp/all-fr.txt
grep -oE 'FR-[A-Z][A-Z0-9]{1,15}-[0-9]{3}' tasks.md | sort -u > /tmp/covered-fr.txt
comm -23 /tmp/all-fr.txt /tmp/covered-fr.txt  # 输出未覆盖的 FR

TOTAL=$(wc -l < /tmp/all-fr.txt)
COVERED=$(wc -l < /tmp/covered-fr.txt)
echo "Task 覆盖率: ${COVERED}/${TOTAL}"
```

### AI 编码统计（Claude Code Hooks）

> 补回 v2 内容。自动统计 AI 编码的代码变更行数和文档产出量。

**Hook 类型**：Claude Code `Stop` hook（AI 会话结束时触发）

**上下文采集**：

| 字段 | 来源 | 采集命令 |
|------|------|---------|
| 开发人员 | Git 用户配置 | `git config user.name` |
| 需求标识 | Git 分支名解析 | `git branch --show-current` |

**分支命名规范**（AI 统计的前置依赖）：

```
feature/<FR-ID>-<description>

示例：
feature/FR-AUTH-001-user-login
feature/FR-PAY-003-refund-flow
```

解析规则：正则 `^feature/(FR-[A-Z][A-Z0-9]{1,15}-\d{3})` 提取需求 ID。分支名无法解析时，`requirement` 字段记录为 `unknown`。

**统计维度**：

| 类别 | 指标 | 采集方式 |
|------|------|---------|
| 代码变更 | 文件数、`+additions` / `-deletions` | `git diff HEAD --numstat` |
| 文档变更 | `.md` 文件数、`+additions` / `-deletions` | `git diff HEAD --numstat` 过滤 `*.md` |
| 新建文件 | 文件数、总行数 | `git diff HEAD --numstat --diff-filter=A` |

**执行流程**：

```
AI 会话开始 (Start hook)
  → git rev-parse HEAD                            # 记录 baseline commit hash
  → 写入 .spec-first/.baseline                    # 持久化 baseline

AI 会话结束 (Stop hook)
  → BASELINE=$(cat .spec-first/.baseline)          # 读取 baseline
  → git config user.name                           # 开发人员
  → git branch --show-current                      # 分支名 → 解析需求 ID
  → git diff $BASELINE HEAD --numstat              # 已提交的变更 +/-
  → git diff HEAD --numstat                        # 未提交的变更 +/-（staged + unstaged）
  → 合并两组 numstat 结果
  → 按文件类型分类（代码 vs 文档）
  → 追加到 .spec-first/ai-stats.jsonl
  → 终端输出统计摘要
```

**统计记录格式**（JSONL，追加到 `.spec-first/ai-stats.jsonl`）：

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
1. Hook 通过 Start hook 自动记录 baseline commit hash（存储于 `.spec-first/.baseline`），无需手动确保 `git clean` 状态
2. 分支命名遵循 `feature/<FR-ID>-<description>` 规范，确保需求 ID 可自动解析
3. `.spec-first/.baseline` 应加入 `.gitignore`

### Claude Code Hooks — Gate 自动化（v4.2 新增）

> 将 Quality Gate 从"人工检查"升级为"Hook 自动阻断 + 人工终审"双轨制。

**Hook 配置总览**：

| Hook 类型 | 触发时机 | 校验内容 | 对应 Gate |
|----------|---------|---------|----------|
| PreToolUse | AI 执行文件写入前 | 当前阶段是否已完成前置 Gate | 全阶段 |
| PostToolUse | AI 执行文件写入后 | 产出物 ID 格式、traces 完整性 | 01-05 |
| Stop | AI 会话结束时 | 三文件完成度 + 追踪产物同步状态 | 全阶段 |

**PreToolUse 校验规则示例**：

```yaml
# 阻止在 Specify 阶段未完成时直接写 design.md
- hook: PreToolUse
  condition: "tool == 'Write' && path.endsWith('design.md')"
  check: "spec.md exists && all FR have IDs"
  action: block_with_message
```

**Stop Hook 完成度校验**：

```text
AI 会话结束时自动执行：
1. 检查 task_plan.md 是否与 tasks.md 同步
2. 检查 progress.md 是否记录了本次会话的工作内容
3. 检查 findings.md 是否记录了新发现（如有）
4. 计算当前阶段追踪覆盖率
5. 输出完成度报告到终端
```

### 会话恢复机制 — Session Catchup（v4.2 新增）

> AI 辅助开发中，会话中断是常态（上下文窗口限制、`/clear`、IDE 重启）。恢复后必须同步追踪产物。

**触发条件**：

- `/clear` 命令执行后
- AI 会话因上下文窗口限制被截断
- IDE 重启或网络中断后重新连接

**恢复流程**：

```text
会话恢复触发
  → 读取 task_plan.md（当前规划状态）
  → 读取 progress.md（已完成进度）
  → 读取 findings.md（已有发现）
  → 读取 traceability-matrix.md（追踪状态）
  → 定位当前阶段和当前 TASK
  → 输出恢复摘要到终端
  → 继续执行
```

**恢复后强制校验**：

- 三文件与实际产出物是否一致（如 progress.md 记录已完成但代码未提交）
- 追踪矩阵是否与最新代码同步
- 不一致项必须在恢复后立即修正

### Spec-as-Code 实践

> 补回 v2 内容。所有规范文档存放在 Git 仓库中，变更可通过 `git diff` 追溯。

```bash
# 查看需求变更
git diff specs/001-user-auth/spec.md

# 查看 API 契约变更
git diff specs/001-user-auth/contracts/user-api.yaml
```

---

## AI 协作编排规范（v4.2 新增）

> 将四工程能力（planning-with-files / omo-skills / myclaude / everything-claude-code）与 7+3 流程对齐，定义 AI Agent 在各阶段的角色、输入输出和协作模式。

### 代理路由矩阵

不同任务类型由不同 AI Agent 承担，避免"万能 Agent"导致的质量下降。

| 阶段 | 任务类型 | 推荐 Agent | 输入 | 输出 | 来源工程 |
|------|---------|-----------|------|------|---------|
| 01 Specify | 需求分析 | oracle | 业务意图描述 | `spec.md` + ID 分配 | omo-skills |
| 02 Design | 架构设计 | sisyphus | `spec.md` + `constitution.md` | `design.md` + `contracts/` | omo-skills |
| 02 Design | 外部调研 | librarian | 技术选型问题 | `findings.md` 更新 | omo-skills |
| 03 Plan | 任务编排 | do | `spec.md` + `design.md` | `tasks.md` + 追踪矩阵 | myclaude |
| 04 Implement | 代码生成 | codeagent-wrapper | 单个 TASK + Context Pack | 代码 + 单元测试 | myclaude |
| 04 Implement | 代码搜索 | explore | 代码库查询 | 搜索结果 + 上下文 | omo-skills |
| 05 Verify | 测试生成 | 默认 Agent | `spec.md` AC + 代码 | TC + 测试报告 | — |
| 06 Wrap-up | 文档生成 | document-writer | 全阶段产出物 | README + API 文档 | omo-skills |

**路由规则**：

1. **默认最小集**：Size S 场景仅使用默认 Agent，不启用多代理路由
2. **按需升级**：Size M/L 或跨端场景启用专业 Agent 分工
3. **人类终审**：所有 Agent 产出物必须经人类 Sign-off 后方可进入下一阶段

### Context Pack 标准

跨 Agent 委派时，必须携带统一格式的上下文包，确保任意 Agent 可恢复完整语境。

```yaml
# context-pack.yaml — 跨 Agent 统一输入格式
context_pack:
  version: "1.0"
  feature_meta:
    id: "001-user-auth"
    title: "用户认证模块"
    mode: N            # N=新建 / I=迭代
    size: S            # S/M/L
    platforms: [H5, Backend]
  artifacts:
    spec: "specs/001-user-auth/spec.md"
    design: "specs/001-user-auth/design.md"
    tasks: "specs/001-user-auth/tasks.md"
    matrix: "specs/001-user-auth/traceability-matrix.md"
    task_plan: "specs/001-user-auth/task_plan.md"
    progress: "specs/001-user-auth/progress.md"
    findings: "specs/001-user-auth/findings.md"
  constitution: "constitution.md"
  current_phase: "04-implement"
  current_task: "TASK-AUTH-001"
```

**强制约束**：

- 每次 Agent 委派必须生成 Context Pack，禁止口头传递上下文
- Context Pack 中的 `artifacts` 路径必须指向实际存在的文件
- `current_phase` 和 `current_task` 必须与 `progress.md` 记录一致

### 并行执行模型

Size M/L 场景下，独立 TASK 可并行执行以缩短周期。

| 条件 | 执行模式 | 隔离方式 |
|------|---------|---------|
| TASK 间无依赖 + 无文件交叉 | 并行执行 | Git Worktree 隔离 |
| TASK 间无依赖 + 有文件交叉 | 串行执行 | 主分支顺序提交 |
| TASK 间有依赖 | 按依赖顺序串行 | 主分支顺序提交 |

**并行执行前置条件**：

1. `tasks.md` 中已标记 `parallel: true` 且 `depends_on` 为空
2. 文件变更范围无交叉（通过 `git diff --stat` 预判）
3. 每个并行 TASK 在独立 Worktree 中执行，完成后合并回主分支

---

## 落地路线图（3 步）

> v4 从 v3 的 5 步精简为 3 步，降低推行阻力。

### 第一步：MVP — 跑通 7 阶段 + ID 体系 + 追踪矩阵（对应 P0，1-2 周）

用一个真实 S 规模 Feature 走完 00-06 全流程，验证流程骨架 + 运行态机制可行性。

| 动作 | 验证点 | 集成项 |
|------|-------|-------|
| 选择一个 S 规模 Feature | 覆盖所有 7 个阶段，试错成本低 | — |
| 按阶段产出标准化文档 | 产出物模板可用 | — |
| 为 FR/NFR/TASK/TC 分配 ID | ID 命名规则可执行 | — |
| 手动维护追踪矩阵 | 矩阵格式合理、维护成本可接受 | — |
| 在 Plan/Verify Gate 试行覆盖率校验 | 能发现遗漏需求和过度实现 | — |
| **初始化三文件运行态** | 每个 Feature 目录含 `task_plan.md` / `findings.md` / `progress.md` | P0 三文件 |
| **部署最小 Hook Gate** | Pre-commit ID 格式校验 + Stop 完成度校验可自动执行 | P0 Hook 化 Gate |
| **验证会话恢复** | `/clear` 后可通过 Session Catchup 恢复上下文 | P0 Session Catchup |

### 第二步：增强 — 自动化校验 + Change-Management + AI 协作（对应 P1，3-4 周）

| 动作 | 验证点 | 集成项 |
|------|-------|-------|
| 基于 ID 体系编写校验脚本 | 脚本可稳定执行 | — |
| 在 5 个时机试运行一致性校验 | 能发现真实不一致问题 | — |
| 集成到 CI Pipeline | 自动化校验可用 | — |
| 定义 RFC 模板和变更分级 | 变更流程标准化 | — |
| 基于追踪矩阵做 Impact Analysis | 能自动定位受影响产物 | — |
| **定义 Context Pack 标准** | 跨 Agent 委派携带统一上下文包，可复现同等结果 | P1 Context Pack |
| **建立代理路由矩阵** | 研究/架构/实现/文档四类任务有明确 Agent 选择规则 | P1 代理路由 |
| **启用并行执行 + Worktree 隔离** | 可并行 TASK 默认并行，高风险 TASK 默认 Worktree | P1 并行执行 |

### 第三步：全量 — 多端扩展 + 双模式 + 治理深化（对应 P2，5-8 周）

| 动作 | 验证点 | 集成项 |
|------|-------|-------|
| 各端 Tech Lead 补录 platform-rules | 端规范模板可用 | — |
| 试跑 Mode I + 多端 Feature | 合并流程可行 | — |
| 追踪矩阵在多端场景下可用 | 跨端 FR 追踪无遗漏 | — |
| 部署 AI 编码统计 Hook | 统计数据可采集 | — |
| 全团队推行 | 流程成为日常 | — |
| **规则分层体系** | 规则可按端/语言复用，冲突规则可定位 | P2 规则分层 |
| **Hook/插件回归测试** | hooks 与 plugin schema 变更具备自动化回归测试 | P2 回归测试 |

---

## 版本演进映射：v2 → v3 → v4

| 内容 | v2 | v3 | v4 | 变更来源 |
|------|----|----|-----|---------|
| 流程骨架 | 7+3 | 7+3 | 7+3（不变） | — |
| Init 边界 | 项目级/Feature 级混合 | Feature 级（修复 P0-1） | Feature 级（不变） | v3 修复 |
| Design Research | 无 | 新增（修复 P0-2） | 保留 | v3 修复 |
| 一致性校验触发 | 3 个 | 5 个（修复 P0-3） | 5 个（不变） | v3 修复 |
| Checklist | 无 | 新增（修复 P1-1） | 保留 | v3 修复 |
| 规模分级 | 轻量模式跳过阶段 | S/M/L 调节深度（修复 P1-3） | S/M/L + 裁剪指南 | v3 修复 + v4 增强 |
| Constitution | 4 项 | 5 维度（优化 P2-1） | 6 维度（+角色与职责） | v3 优化 + v4 增强 |
| 双模式 | 无 | Mode N / Mode I | 保留 | v3 新增 |
| 多端扩展 | 无 | Layer 2 | 保留 | v3 新增 |
| ID 体系 | `FR-AUTH-001`（全局） | `FR-001`（Feature 内） | `FR-AUTH-001`（全局，回归 v2） | v4 回归 |
| 追踪矩阵 | 有（横切机制 B） | 有（独立章节） | 保留 | — |
| 覆盖率算法 | 有（简版） | 有（完整版） | 保留 + 孤儿项率 | v4 补回 |
| 流程速查表 | 有 | **丢失** | **补回**（升级版） | v4 补回 |
| 角色映射+RACI | 有 | **丢失** | **补回** | v4 补回 |
| Gate Owner | 有 | **丢失** | **补回** | v4 补回 |
| AI 编码统计 | 有 | **丢失** | **补回**（含执行流程+终端示例+前置约定） | v4 补回 |
| Spec-as-Code | 有 | **丢失** | **补回** | v4 补回 |
| 归档清单 | 有 | **丢失** | **补回** | v4 补回 |
| 变更分级 | 无 | 无 | **v4 新增** | v4 新增 |
| 流程裁剪指南 | 无 | 无 | **v4 新增** | v4 新增 |
| 适用边界 | 无 | 无 | **v4 新增** | v4 新增 |

### 架构演进参考：v2 原始 18 节点 → 7+3 映射

> 保留此表供理解架构演进历程。

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

## 风险提醒

### ID 体系的维护成本

ID 分配和追踪矩阵维护需要额外工作量。初期手动维护，验证价值后再工具化。

**应对**：第一步只强制 FR/TASK 追踪（最小闭环），验证可行后再扩展到 API/TC/PR。

### 追踪矩阵的"形式化"风险

矩阵可能沦为"填表"而非真正的质量保障工具。

**应对**：覆盖率校验嵌入 Gate，不通过则阻塞流程——让矩阵成为"活文档"而非"死表格"。

### 完美主义陷阱

v4 内容量进一步增加，切忌一次性全量推行。

**应对**：严格按落地路线图 3 步渐进引入，每步验证后再推进。

### 流程过重风险

| 信号 | 应对 |
|------|------|
| 团队抱怨流程拖慢交付 | 简化 Gate 检查项，保留核心项 |
| 产出物沦为形式 | 减少模板字段，聚焦高价值内容 |
| 小 Feature 走完太重 | 按 Size S 裁剪，参考流程裁剪指南 |

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
| `spec-first-v4-优先集成清单.md` | 四工程集成优先级与验收标准 | 已完成 |
| `../02技术方案/sdd-benchmark-analysis.md` | SDD 业界对标分析与端到端可行性评估 | 已完成 |
| `spec-first-v2.md` | v2.0 原始文档（历史参考） | 归档 |
| `spec-first-v3.md` | v3.0 文档（历史参考） | 归档 |

---

**作者**: Leo (况雨平)
**文档版本**: v4.2
**创建日期**: 2026-02-08
**基于版本**: v3.0 + v2.0 + 优先集成清单
**关联文档**: dual-mode-design.md, review-spec-first-v2.md, spec-first-v4-优先集成清单.md, sdd-benchmark-analysis.md
