# Spec-First 研发流程规范 v4.3 (Final)

> **版本**: v4.3-Final | **状态**: 正式发布 | **属性**: 核心契约
> **定位**: 面向 AI Agent 的可执行研发标准 (Executable Specification)
> **核心理念**: 规范即真理 (Single Source of Truth)、过程即数据 (Process as Data)
> **作者**: Leo (况雨平) | **生效日期**: 2026-02-08

---

## 1. 产品概述

### 1.1 背景与目标
在 AI 辅助编码 (AI Coding) 从辅助工具转向自主 Agent 的背景下，传统的“文档归档”模式已失效。我们需要一套**结构化、机器可读、全链路追踪**的研发协议，使 AI 能在人类约束下自主完成端到端开发。

**核心目标**：
1.  **消除幻觉**：通过刚性 ID 追踪链，确保 AI 写的每行代码都有据可依。
2.  **机器可读**：通过 YAML Front Matter + Markdown，让文档同时服务于人类阅读与 AI 解析。
3.  **状态保持**：通过“运行态三文件”，解决 AI 上下文丢失问题，实现长程任务接力。

### 1.2 核心架构 (The System)

我们采用 **"7+3+1"** 架构体系：

*   **7 个主阶段**：全生命周期闭环。
*   **3 个横切机制**：质量门禁 (Gate)、一致性校验 (SCA)、变更管理 (CM)。
*   **1 个运行时环境**：基于文件的 AI 协作上下文 (Runtime Context)。

---

## 2. 运行时定义 (Engineering Runtime)

> **v4.3 核心升级**：将“纸面规范”升级为 AI 可操作的“实体对象”。

### 2.1 运行态三文件 (The Runtime Trinity)
每个 Feature 目录下**必须**包含以下三个动态文件，作为 AI 的“短期记忆”与“工作区”：

| 文件名 | 属性 | 职责 | 更新频率 |
| :--- | :--- | :--- | :--- |
| **`task_plan.md`** | **规划态** | 记录当前的任务编排、依赖关系、执行顺序。是 `tasks.md` 的实例化快照。 | 阶段切换时 |
| **`progress.md`** | **执行态** | 记录流水账日志：已完成步骤、失败尝试、下一步计划。用于 Session 恢复。 | 每个操作后 |
| **`findings.md`** | **知识态** | 记录开发过程中的技术发现、坑点、临时决策。用于更新 Design 或作为复盘输入。 | 随时 |

### 2.2 结构化协议 (YAML Front Matter)
为解决 Markdown 对 AI 语义模糊的问题，核心产出物**必须**包含 YAML 头。

**Spec 文件 (`spec.md`) 标准头：**
```yaml
---
feature_id: "FR-AUTH-001"
title: "用户登录模块"
mode: N          # N=新建 / I=迭代
size: S          # S/M/L
status: draft    # draft -> approved
requirements:
  functional:
    - id: FR-AUTH-001-01
      priority: P0
      ac_refs: [AC-01, AC-02]
  non_functional:
    - id: NFR-SEC-001
      type: security
---
```

**Task 文件 (`tasks.md`) 标准头：**
```yaml
---
execution_mode: parallel  # serial / parallel
context_pack: "v1.0"
tasks:
  - id: TASK-01
    traces: [FR-AUTH-001-01]
    agent_skill: "codeagent-wrapper"
    worktree: true        # 是否使用独立工作树隔离
---
```

---

## 3. 全链路追踪体系 (Traceability)

### 3.1 刚性 ID 链
所有产出物必须通过 ID 强关联，禁止“隐式”引用。

| 层级 | ID 格式 | 定义阶段 | 示例 |
| :--- | :--- | :--- | :--- |
| **需求** | `FR-<FEAT>-NNN` | 01 Specify | `FR-USER-001` |
| **设计** | `API-<SVC>-NNN` | 02 Design | `API-AUTH-LOGIN` |
| **任务** | `TASK-<FEAT>-NNN` | 03 Plan | `TASK-USER-001` |
| **测试** | `TC-<TYPE>-NNN` | 05 Verify | `TC-E2E-001` |

### 3.2 追踪矩阵 (The Matrix)
文件：`traceability-matrix.md`
**状态枚举**：`📋 Planned` → `🔨 Implemented` → `✅ Verified` → `🎯 Accepted`

| FR ID | AC Ref | Design/API | Task ID | PR/Commit | TC ID | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| FR-01 | AC-1 | API-POST-01 | TASK-01 | PR-1024 | TC-01 | ✅ |

---

## 4. 主流程标准 (7 Stages)

### 00. Init (启动)
*   **输入**：一句话需求。
*   **AI 动作**：
    1.  读取 `constitution.md` (宪法)。
    2.  确定 Mode (N/I) 和 Size (S/M/L)。
    3.  初始化目录结构及**运行态三文件**。
*   **Gate**：目录结构正确，元数据 (`feature.yaml` 或 Front Matter) 已写入。

### 01. Specify (规格)
*   **核心产出**：`spec.md` (含 YAML 头)。
*   **AI 动作**：
    1.  **Oracle Agent** 进行需求分析，生成 User Story 和 AC。
    2.  分配 FR/NFR ID。
    3.  (Mode I) 生成 `impact-analysis.md`。
*   **Gate**：无歧义标记，ID 分配完成，DoR (Definition of Ready) 签核。

### 02. Design (设计)
*   **核心产出**：`design.md`, `contracts/*.yaml`。
*   **AI 动作**：
    1.  **Sisyphus Agent** 进行架构设计。
    2.  定义 API 契约 (OpenAPI 格式) 并分配 ID。
    3.  **Librarian Agent** 记录技术调研到 `findings.md`。
*   **Gate**：API 覆盖率 100%，Design Review 通过。

### 03. Plan (规划)
*   **核心产出**：`tasks.md`。
*   **AI 动作**：
    1.  **Do Agent** 将设计拆解为 Task。
    2.  显式声明依赖关系 (`depends_on`)。
    3.  填充 `task_plan.md` 初始状态。
*   **Gate**：Task 覆盖率 100%，反向合规率 100% (无无主任务)。

### 04. Implement (实现)
*   **核心产出**：代码, 单元测试, `progress.md`。
*   **AI 动作**：
    1.  **CodeAgent** 领取 Task。
    2.  (可选) 创建 Git Worktree 进行并行开发。
    3.  TDD：先生成测试，后实现代码。
    4.  实时更新 `progress.md`。
*   **Gate**：PR 合规率 100% (Commit 包含 Task ID)，CI 通过，Hook 校验通过。

### 05. Verify (验证)
*   **核心产出**：`tests/`, 验证报告。
*   **AI 动作**：
    1.  基于 AC 生成集成/E2E 测试用例 (`TC-ID`)。
    2.  执行测试并回填矩阵状态。
*   **Gate**：TC 覆盖率 100%，无 Critical Bug。

### 06. Wrap-up (收尾)
*   **核心产出**：`retro.md`, 最终版矩阵。
*   **AI 动作**：
    1.  归档运行态三文件。
    2.  检查所有 ID 状态是否闭环。
    3.  生成 Release Note。
*   **Gate**：矩阵全绿 (`🎯 Accepted`)。

---

## 5. 产品用例 (Product Use Cases)

以下展示 Spec-First v4.3 在真实场景下的执行流。

### 用例 A：全新功能开发 (The Happy Path)
**场景**：为电商系统增加“用户收藏夹”功能。
**配置**：Mode=N (新建), Size=S (小规模)。

1.  **User**: "我需要一个用户收藏夹功能，支持增删查。"
2.  **Agent (Init)**: 创建 `specs/005-favorites/`，初始化 `task_plan.md`。
3.  **Agent (Specify)**: 生成 `spec.md`。
    *   *YAML*: `feature_id: FEAT-FAV`, `requirements: [FR-FAV-01 (Add), FR-FAV-02 (List)]`.
    *   *Markdown*: 定义 AC (如：重复收藏需报错)。
4.  **User**: "确认，但在列表页需要支持分页。" (Review)
5.  **Agent (Specify)**: 更新 `spec.md`，追加 AC。
6.  **Agent (Design)**: 生成 `contracts/fav-api.yaml` (定义 `GET /favorites?page=1`)。
7.  **Agent (Plan)**: 生成 `tasks.md`。
    *   Task 1: DB Schema (Table `favorites`).
    *   Task 2: API Implementation.
    *   Task 3: Unit Tests.
8.  **Agent (Implement)**:
    *   读取 `task_plan.md`，执行 Task 1。更新 `progress.md`: "DB migration created."
    *   执行 Task 2。更新 `progress.md`: "API endpoints scaffolding done."
    *   *Hook*: 提交代码时自动检查 Commit Message 是否包含 `[TASK-FAV-02]`。
9.  **Agent (Verify)**: 运行测试，更新矩阵状态为 `✅ Verified`。
10. **Result**: 用户获得功能完整、文档齐全、可维护的代码。

### 用例 B：复杂迭代与变更 (The Reality Check)
**场景**：修改现有的“订单计算逻辑”，增加“VIP 折扣”。
**配置**：Mode=I (迭代), Size=M (中规模)。

1.  **User**: "订单计算逻辑需要增加 VIP 95折逻辑。"
2.  **Agent (Init)**: 扫描现有代码，读取旧 `spec.md`。
3.  **Agent (Specify)**:
    *   执行 **Impact Analysis**：发现 `OrderService` 和 `PaymentGateway` 受影响。
    *   更新 `spec.md`，新增 `FR-ORDER-VIP`。
4.  **Agent (Design)**: 发现需要修改核心计费接口。
    *   **Alert**: 这是一个 Breaking Change。
    *   **Action**: 触发 **Major Change** 流程，生成 `rfc/001-vip-discount.md`。
5.  **User**: 批准 RFC。
6.  **Agent (Plan)**:
    *   生成 Task，标记 `regression_test_required: true`。
7.  **Agent (Implement)**:
    *   修改代码。
    *   在 `findings.md` 记录： "发现旧的金额计算存在精度隐患，已在本次一并修复。"
8.  **Agent (Verify)**:
    *   执行新功能测试。
    *   执行 **回归测试 (Regression Test)**，确保旧订单逻辑未崩。
9.  **Result**: 安全上线，无退化，变更历史可追溯。

---

## 6. 度量与监控 (Metrics)

为了确保流程健康，系统自动采集以下指标：

| 指标 | 定义 | 目标 | 采集源 |
| :--- | :--- | :--- | :--- |
| **孤儿项率** | 无 ID 关联的代码/任务占比 | 0% | SCA Hook |
| **返工率** | Gate 驳回次数 / 总提交数 | < 10% | CI Pipeline |
| **Gate 首次通过率** | 一次性通过 Gate 的比例 | > 85% | 流程引擎 |
| **AI 完成度** | AI 独立完成的 Task 占比 | > 70% | `progress.md` 统计 |

---

## 7. 附录：Agent 路由矩阵

为确保专业性，不同阶段由专职 Agent 技能 (Skill) 承接：

*   **Specify** $
ightarrow$ `skill:oracle` (擅长业务拆解、用户故事)
*   **Design** $
ightarrow$ `skill:sisyphus` (擅长系统架构、API 设计)
*   **Plan** $
ightarrow$ `skill:do` (擅长任务编排、依赖管理)
*   **Implement** $
ightarrow$ `skill:codeagent` (擅长编码、TDD)
*   **Verify** $
ightarrow$ `skill:explore` (擅长测试覆盖、Bug 猎杀)

---
