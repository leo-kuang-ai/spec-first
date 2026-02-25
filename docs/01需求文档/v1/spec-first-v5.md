# Spec-First 研发流程规范 v5.0（终版）

> **版本**: v5.0 | **更新**: 2026-02-08 | **作用域**: Feature 级别
> **参考标准**: Spec-Kit、Autospec、SpecifyPlus、TypeSpec、ISO/IEC 12207、V-Model、SAFe、CMMI REQM
> **核心理念**: 规范即契约、规范即真理、全链路可追踪
> **基于**: v4.2 + 产品用例体系 + 度量运营整合

---

## 目录

- [产品愿景与定位](#产品愿景与定位)
- [角色与用户画像](#角色与用户画像)
- [产品用例体系](#产品用例体系)
- [流程适用边界](#流程适用边界)
- [核心架构](#核心架构)
- [全链路追踪体系](#全链路追踪体系)
- [主流程：8 个阶段（00-07）](#主流程8-个阶段00-07)
- [横切机制：3 个贯穿全流程的能力](#横切机制3-个贯穿全流程的能力)
- [多端扩展（Layer 2）](#多端扩展layer-2)
- [产出物标准化](#产出物标准化)
- [流程裁剪指南](#流程裁剪指南)
- [工具链映射](#工具链映射)
- [AI 协作编排规范](#ai-协作编排规范)
- [度量与运营体系](#度量与运营体系)
- [落地路线图（3 步）](#落地路线图3-步)
- [风险提醒](#风险提醒)
- [版本演进映射](#版本演进映射v2--v3--v4--v5)
- [参考标准](#参考标准)

---

## v5.0 变更摘要

> v5.0 定位为**终版**：在 v4.2 全部能力基础上，补齐产品视角（愿景、角色、用例），将"流程规范"升级为"规范驱动研发流程方法论"。

| 变更类型 | 内容 | 价值 |
|---------|------|------|
| **新增** | 产品愿景与定位：明确产品边界、目标用户、核心价值主张 | 回答"为什么做" |
| **新增** | 角色与用户画像：7 类 Actor 定义 + 痛点 + 期望 | 回答"为谁做" |
| **新增** | 产品用例体系：4 大类 21 个用例（含用例图、详述、验收标准） | 回答"做什么" |
| **新增** | 度量与运营体系：整合散落指标为运营闭环 | 回答"怎么衡量" |
| **整合** | v4.0→v4.2 中间版本变更摘要合并为版本演进表 | 终版去噪 |
| **继承** | v4.2 全部核心能力（三层体系、双模式、追踪矩阵、覆盖率算法、AI 协作编排等） | 100% 向后兼容 |

---

## 产品愿景与定位

### 一句话定位

**Spec-First 是面向 AI 时代的规范驱动研发流程引擎**——以结构化规范为单一真理源，通过全链路追踪 + AI 辅助 + 自动化门禁，将"需求→设计→编码→测试→交付"从人工驱动升级为规范驱动。

### 要解决的核心问题

| # | 问题 | 现状痛点 | Spec-First 解法 |
|---|------|---------|----------------|
| 1 | **需求失真** | 需求口头传递、PRD 与代码脱节，上线后发现"做的不是要的" | FR/NFR 结构化 + 全链路 ID 追踪，任何产物可反向追溯到需求 |
| 2 | **过度实现** | 开发者自行加功能，无人知道哪些代码没有需求依据 | 反向合规率 + 孤儿项率，自动检测无需求依据的 TASK/TC/PR |
| 3 | **变更失控** | 需求变更口头通知，下游产物未同步更新 | 三级变更管理 + ID 链自动定位受影响产物 |
| 4 | **AI 生成不可控** | AI 生成代码无法追溯到需求，质量无法度量 | AI 产出物强制携带 traces，Hook 自动校验合规性 |
| 5 | **流程形式化** | 流程文档写了没人看，Gate 检查靠人工 | Hook 化 Gate 自动阻断 + 覆盖率量化，让规范成为"活契约" |

### 目标用户

| 用户群 | 团队规模 | 典型场景 |
|--------|---------|---------|
| **核心用户** | 10-50 人研发团队 | 多端协作、金融级质量要求、AI 辅助开发 |
| **扩展用户** | 5-10 人小团队 | Size S 裁剪模式，轻量使用 |
| **暂不适用** | 1-3 人或 100+ 人 | 过小无需流程，过大需企业级 PLM |

### 核心价值主张

```
对 PM：        需求不再"说了等于没说"——每条 FR 可追踪到代码和测试
对 Tech Lead： 设计不再"评审完就忘"——Gate 自动校验设计与实现一致性
对 Developer：  开发不再"猜着做"——每个 TASK 明确 traces 到 FR，AC 即测试用例
对 QA：        测试不再"漏测背锅"——Test 覆盖率 = 100% 是 Gate 硬指标
对 管理层：     交付不再"黑盒"——追踪矩阵 + 度量体系，全程可视可量化
```

### 产品边界

| 范围 | 包含 | 不包含 |
|------|------|--------|
| 流程定义 | 8+2 阶段流程（8 个主阶段 + 2 个终态）、Gate、横切机制 | 项目管理（排期、资源分配） |
| 规范标准 | 产出物模板、ID 体系、追踪矩阵 | 具体业务领域建模 |
| 工具集成 | Git Hook、CI Pipeline、Claude Code Hook | IDE 插件、Jira 深度定制 |
| AI 协作 | Agent 路由、Context Pack、Session Catchup | AI 模型训练、私有化部署 |
| 度量体系 | 覆盖率、合规率、返工率、Gate 通过率 | 人效评估、绩效考核 |

### 与外部系统关系

```
┌─────────────────────────────────────────────────────┐
│                  Spec-First v5.0                     │
│  ┌───────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │ 流程引擎   │ │ 追踪引擎  │ │ AI 协作引擎       │  │
│  │ 8+2 阶段   │ │ ID + 矩阵 │ │ Agent 路由 + Hook │  │
│  └─────┬─────┘ └────┬─────┘ └────────┬──────────┘  │
├────────┼────────────┼────────────────┼──────────────┤
│        ▼            ▼                ▼    对接层     │
│  ┌─────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │  Jira   │  │ Git/CI   │  │ Claude Code      │   │
│  │ Status  │  │ Hook +   │  │ Hooks + SubAgent │   │
│  │ 映射    │  │ Pipeline │  │ + Context Pack   │   │
│  └─────────┘  └──────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 角色与用户画像

### Actor 总览

| Actor ID | 角色 | 类型 | 核心职责 | 参与阶段 |
|----------|------|------|---------|---------|
| **A1** | PM（产品经理） | 人类 | 需求定义、优先级判定、UAT 验收 | 01 Specify, 05 Verify, 06 Wrap-up |
| **A2** | Tech Lead（技术负责人） | 人类 | 架构决策、Gate 终审、流程守护 | 00-06 全阶段 |
| **A3** | Developer（开发者） | 人类 | 编码实现、单元测试、Code Review | 03 Plan, 04 Implement, 05 Verify |
| **A4** | QA Lead（测试负责人） | 人类 | 测试设计、测试执行、安全扫描、需求/设计可测试性评审 | 01 Specify（C）, 02 Design（C）, 05 Verify |
| **A5** | Architect（架构师） | 人类 | 架构评审（L 规模必须参与） | 02 Design |
| **A6** | AI Agent（AI 辅助代理） | 系统 | 规范生成、代码生成、自动校验 | 01-06 全阶段（辅助） |
| **A7** | CI/CD System（持续集成系统） | 系统 | 自动化校验、流水线执行 | 04 Implement, 05 Verify |

### 用户画像详述

#### A1: PM（产品经理）

| 维度 | 描述 |
|------|------|
| **日常工作** | 收集业务需求、编写 PRD、与研发对齐、验收交付 |
| **核心痛点** | ① 需求写了但开发"做偏了"，上线后才发现 ② 需求变更后不知道影响了哪些代码 ③ 验收时无法确认所有需求都被实现 |
| **期望收益** | 每条 FR 可追踪到代码和测试；变更影响自动定位；验收时追踪矩阵一目了然 |
| **使用频率** | 每个 Feature 的 Specify 和 Verify 阶段深度参与，其他阶段知会 |
| **技术水平** | 不需要理解 ID 体系细节，只需按模板填写 spec.md |

#### A2: Tech Lead（技术负责人）

| 维度 | 描述 |
|------|------|
| **日常工作** | 技术方案评审、任务分配、Code Review、流程推进 |
| **核心痛点** | ① Gate 检查靠人工，容易遗漏 ② 不知道哪些 TASK 没有需求依据（过度实现） ③ 多端并行开发时追踪混乱 |
| **期望收益** | Gate 自动化阻断 + 人工终审；覆盖率/合规率量化可视；并行执行有隔离保障 |
| **使用频率** | 全阶段参与，是流程的核心守护者 |
| **技术水平** | 需要理解完整 ID 体系、追踪矩阵、Hook 配置 |

#### A3: Developer（开发者）

| 维度 | 描述 |
|------|------|
| **日常工作** | 按 TASK 编码、写单元测试、提交 PR、参与 Code Review |
| **核心痛点** | ① 不清楚 TASK 对应哪条需求，"猜着做" ② Commit/PR 格式要求多，容易忘 ③ AI 生成代码后不知道是否符合规范 |
| **期望收益** | 每个 TASK 明确 traces 到 FR；Pre-commit Hook 自动校验格式；AI 生成代码自动携带追踪注释 |
| **使用频率** | 主要在 04 Implement 阶段，每日使用 |
| **技术水平** | 需要理解 TASK traces 规则、Commit 格式、PR 关联规范 |

#### A4: QA Lead（测试负责人）

| 维度 | 描述 |
|------|------|
| **日常工作** | 设计测试用例、执行测试、安全扫描、UAT 协调 |
| **核心痛点** | ① 不确定测试是否覆盖了所有需求 ② 漏测后背锅 ③ 回归测试范围难以界定 |
| **期望收益** | Test 覆盖率 = 100% 是 Gate 硬指标；TC 强制 verifies FR/AC/NFR；变更时自动定位回归范围 |
| **使用频率** | 01 Specify 阶段评审 AC 可测试性（Consulted）；02 Design 阶段评审架构可测试性（Consulted）；05 Verify 阶段全程主导 |
| **技术水平** | 需要理解 TC ID 规则、verifies 引用、覆盖率算法 |

#### A5: Architect（架构师）

| 维度 | 描述 |
|------|------|
| **日常工作** | 架构评审、技术选型、ADR 编写、跨模块设计协调 |
| **核心痛点** | ① 架构决策缺乏结构化记录，后人不知"为什么这样设计" ② 设计方案与需求脱节，上线后才发现遗漏 ③ L 规模项目缺乏系统性评审机制 |
| **期望收益** | DS ID 使设计章节可追踪；ADR 强制记录决策理由；Design Review Gate 确保架构质量；追踪矩阵自动校验 Design 覆盖率 |
| **使用频率** | 02 Design 阶段深度参与（L 规模必须参与）；其他阶段按需咨询 |
| **技术水平** | 需要理解 DS/API/ADR ID 规则、Design Review Gate 标准、追踪矩阵 Design Ref 列 |

#### A6: AI Agent（AI 辅助代理）

| 维度 | 描述 |
|------|------|
| **运行环境** | Claude Code CLI / SubAgent / Hook Runtime |
| **能力边界** | 可生成规范、代码、测试；不可做架构决策终审、UAT 签核 |
| **协作模式** | AI 生成 → 人类审核 → AI 修正 → 人类签核 |
| **约束条件** | 所有产出物必须携带 traces；必须经人类 Sign-off；标记 `[AI-GENERATED]` |

---

## 产品用例体系

### 用例图（Use Case Map）

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Spec-First v5.0                              │
│                                                                     │
│  ┌─ A. 主流程用例 ──────────────────────────────────────────────┐  │
│  │                                                               │  │
│  │  UC-001        UC-002        UC-003        UC-004             │  │
│  │  Feature       编写需求       技术设计       任务规划           │  │
│  │  启动          规格                                           │  │
│  │     │             │             │             │                │  │
│  │     ▼             ▼             ▼             ▼                │  │
│  │  UC-005        UC-006        UC-007        UC-008             │  │
│  │  规范驱动       验证与         收尾归档       流程裁剪           │  │
│  │  开发          验收                          选择              │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─ B. 横切用例 ────────────────────────────────────────────────┐  │
│  │  UC-010 质量门禁校验    UC-011 一致性校验    UC-012 变更管理   │  │
│  │  UC-013 缺陷管理                                              │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─ C. AI 辅助用例 ─────────────────────────────────────────────┐  │
│  │  UC-020 AI 生成规范     UC-021 AI 生成代码   UC-022 AI 生成测试│  │
│  │  UC-023 Agent 路由分派  UC-024 会话恢复      UC-025 AI 统计采集│  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─ D. 度量与管理用例 ──────────────────────────────────────────┐  │
│  │  UC-030 追踪矩阵管理   UC-031 覆盖率计算    UC-032 度量看板   │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

外部 Actor:
  [A1 PM]  [A2 Tech Lead]  [A3 Developer]  [A4 QA Lead]  [A5 Architect]
  [A6 AI Agent]  [A7 CI/CD System]
```

### 用例清单

| 用例 ID | 用例名称 | 主 Actor | 阶段映射 | 优先级 |
|---------|---------|---------|---------|-------|
| **A. 主流程用例** | | | | |
| UC-001 | Feature 启动 | A2 Tech Lead | 00 Init | P0 |
| UC-002 | 编写需求规格 | A1 PM | 01 Specify | P0 |
| UC-003 | 技术设计 | A2 Tech Lead | 02 Design | P0 |
| UC-004 | 任务规划 | A2 Tech Lead | 03 Plan | P0 |
| UC-005 | 规范驱动开发 | A3 Developer | 04 Implement | P0 |
| UC-006 | 验证与验收 | A4 QA Lead | 05 Verify | P0 |
| UC-007 | 收尾归档 | A2 Tech Lead | 06 Wrap-up | P0 |
| UC-008 | 流程裁剪选择 | A2 Tech Lead | 00 Init | P0 |
| **B. 横切用例** | | | | |
| UC-010 | 质量门禁校验 | A7 CI/CD | 全阶段 | P0 |
| UC-011 | 规范一致性校验 | A7 CI/CD | 01-05 | P0 |
| UC-012 | 变更管理 | A2 Tech Lead | 任意阶段 | P0 |
| UC-013 | 缺陷管理 | A4 QA Lead | 横切（05 Verify + 生产） | P0 |
| **C. AI 辅助用例** | | | | |
| UC-020 | AI 辅助生成规范 | A6 AI Agent | 01 Specify | P1 |
| UC-021 | AI 辅助生成代码 | A6 AI Agent | 04 Implement | P1 |
| UC-022 | AI 辅助生成测试 | A6 AI Agent | 05 Verify | P1 |
| UC-023 | Agent 路由分派 | A6 AI Agent | 01-06 | P1 |
| UC-024 | 会话恢复（Session Catchup） | A6 AI Agent | 任意阶段 | P1 |
| UC-025 | AI 编码统计采集 | A6 AI Agent | 04 Implement | P2 |
| **D. 度量与管理用例** | | | | |
| UC-030 | 追踪矩阵管理 | A2 Tech Lead | 01-06 | P0 |
| UC-031 | 覆盖率计算与校验 | A7 CI/CD | 03-06 | P0 |
| UC-032 | 度量看板查看 | A2 Tech Lead | 06 Wrap-up | P2 |

### 用例详述

#### A. 主流程用例

---

##### UC-001: Feature 启动

| 维度 | 描述 |
|------|------|
| **用例 ID** | UC-001 |
| **主 Actor** | A2 Tech Lead |
| **辅助 Actor** | A1 PM |
| **阶段映射** | 00 Init |
| **触发条件** | PM 提出新 Feature 需求，或 Tech Lead 发起技术改进 |

**前置条件**：
1. `constitution.md` 已存在（项目级一次性产物）
2. Feature 需求已在 Jira 或口头确认

**主流程**：

| 步骤 | Actor | 动作 | 产出物 |
|------|-------|------|--------|
| 1 | A2 | 读取 `constitution.md`，确认项目约束和质量标准 | — |
| 2 | A2 | 判定 Mode：N（全新）或 I（迭代） | Feature 元数据 |
| 3 | A2 | 判定 Size：按 5 维度取最高级别（S/M/L） | Feature 元数据 |
| 4 | A2 | 确定涉及端：APP / PC / H5 / Backend | Feature 元数据 |
| 5 | A2 | 注册 FEAT 缩写：在 `specs/.feat-registry.md` 中登记，校验全局唯一性 | 注册表更新 |
| 6 | A2 | 创建 Feature 目录 `specs/<feishu-demand-id>-<feature-name>/` | 目录结构 |
| 7 | A2 | 初始化运行态三文件：`task_plan.md` / `findings.md` / `stage-state.json` | 三文件 |

**备选流程**：
- **2a. Mode I**：额外执行"历史产物定位"——找到并理解已有 spec/plan/contracts/code
- **3a. Size 判定有争议**：Tech Lead 与 PM 协商，取较高级别（宁可过度准备）

**后置条件**：
- Feature 目录结构就绪
- Mode / Size / 涉及端已确认并记录
- 运行态三文件已初始化

**Exit Gate**：目录结构就绪，Mode/Size/涉及端已确认，FEAT 缩写已注册且唯一 → **Gate Owner: A2 Tech Lead**

**验收标准**：
- [ ] Feature 目录符合标准命名规范
- [ ] 元数据（mode, size, platforms）已记录
- [ ] 三文件已初始化且非空（含初始模板内容）
- [ ] FEAT 缩写已在 `specs/.feat-registry.md` 中注册，且与已有条目无冲突

---

##### UC-002: 编写需求规格

| 维度 | 描述 |
|------|------|
| **用例 ID** | UC-002 |
| **主 Actor** | A1 PM |
| **辅助 Actor** | A2 Tech Lead, A4 QA Lead（评审 AC 可测试性）, A6 AI Agent（可选） |
| **阶段映射** | 01 Specify |
| **触发条件** | UC-001 完成（Init 内联校验通过） |

**前置条件**：
1. Feature 目录已创建
2. Mode / Size / 涉及端已确认

**主流程**：

| 步骤 | Actor | 动作 | 产出物 |
|------|-------|------|--------|
| 1 | A1 | 需求分析：逻辑解构，剥离视觉表现，专注业务规则 | Domain Model, Logic Flow |
| 2 | A1 | 编写结构化 PRD：User Stories（As-I-So）+ AC（Given-When-Then） | `spec.md` 草稿 |
| 3 | A1/A2 | 为每条需求分配 ID：FR-FEAT-NNN / NFR-DIM-NNN | `spec.md` 含 ID |
| 4 | A1 | Clarify：扫描 `[NEEDS CLARIFICATION]` 标记，消除所有歧义 | `spec.md` 无歧义 |
| 5 | A1 | 初始化追踪矩阵：填入所有 FR/NFR ID | `traceability-matrix.md` |
| 6 | A2 | DoR Sign-off：确认需求完整、无歧义、ID 已分配 | Sign-off 记录 |

**备选流程**：
- **2a. AI 辅助**（→ UC-020）：AI Agent 基于业务意图生成 `spec.md` 草稿，PM 审核修正
- **4a. Mode I 额外活动**：执行 Impact Analysis → 产出 `impact-analysis.md`

**异常流程**：
- **6x. DoR 未通过**：PM 修正 spec.md 后重新提交 Sign-off，不得进入 Design

**后置条件**：
- `spec.md` 完整，所有 FR/NFR 已分配 ID
- `traceability-matrix.md` 已初始化
- 无 `[NEEDS CLARIFICATION]` 标记

**Exit Gate**：DoR Sign-off + 无歧义标记 + 所有 FR/NFR 已分配 ID → **Gate Owner: A2 Tech Lead**

**验收标准**：
- [ ] 每条 FR 有唯一 ID（`FR-FEAT-NNN`）且含 AC（Given-When-Then）
- [ ] 每条 NFR 有唯一 ID（`NFR-DIM-NNN`）且含量化指标
- [ ] 追踪矩阵已初始化，行数 = FR 数 + NFR 数
- [ ] 零 `[NEEDS CLARIFICATION]` 标记

---

##### UC-003: 技术设计

| 维度 | 描述 |
|------|------|
| **用例 ID** | UC-003 |
| **主 Actor** | A2 Tech Lead |
| **辅助 Actor** | A5 Architect（L 规模必须参与）, A4 QA Lead（评审架构可测试性）, A6 AI Agent（可选） |
| **阶段映射** | 02 Design |
| **触发条件** | UC-002 完成（DoR Sign-off 通过） |

**前置条件**：
1. `spec.md` 已通过 DoR Sign-off
2. 所有 FR/NFR 已分配 ID

**主流程**：

| 步骤 | Actor | 动作 | 产出物 |
|------|-------|------|--------|
| 1 | A2 | Research：技术可行性调研、备选方案对比 | `research.md` |
| 2 | A2 | 技术选型 + 架构设计 | `design.md`, ADR |
| 3 | A2 | API 契约设计：每个端点分配 `API-SVC-NNN` | `contracts/*.yaml` |
| 4 | A2 | 数据建模：ERD、状态机、数据字典 | `data-model.md` |
| 5 | A2 | 更新追踪矩阵：填充 Design Ref 和 API/Data Ref 列 | 矩阵更新 |
| 6 | A2/A5 | Design Review + Baseline Locking | 评审记录 |

**备选流程**：
- **1a. Size S**：`research.md` 可省略，关键决策直接记录在 `design.md`
- **3a. Size S 且无 API 变更**：`contracts/` 可内嵌于 `design.md`
- **4a. 无数据模型变更**：`data-model.md` 可省略

**异常流程**：
- **6x. Design Review 未通过**：修正设计后重新评审，不得进入 Plan

**后置条件**：
- 技术方案已评审通过
- API 覆盖率 = 100%（所有需要接口的 FR 均有对应 API）
- 追踪矩阵 Design Ref 和 API/Data Ref 列已填充

**Exit Gate**：Design Review + Baseline Locking + API 覆盖率 = 100% → **Gate Owner: A2 Tech Lead / A5 Architect**

**验收标准**：
- [ ] 每个需要接口的 FR 有对应 API-SVC-NNN
- [ ] `design.md` 含 Decisions & Rationale 章节
- [ ] 追踪矩阵 Design Ref 列无空行（排除不需要设计的 NFR）
- [ ] L 规模：Architect 已参与评审并签核

---

##### UC-004: 任务规划

| 维度 | 描述 |
|------|------|
| **用例 ID** | UC-004 |
| **主 Actor** | A2 Tech Lead |
| **辅助 Actor** | A3 Developer, A6 AI Agent（可选） |
| **阶段映射** | 03 Plan |
| **触发条件** | UC-003 完成（Design Review 通过） |

**前置条件**：
1. `design.md` 已通过 Design Review
2. API 契约已 Baseline Locking

**主流程**：

| 步骤 | Actor | 动作 | 产出物 |
|------|-------|------|--------|
| 1 | A2 | 任务拆解：每个 TASK 分配 `TASK-FEAT-NNN`，粒度 1-3 天 | `tasks.md` |
| 2 | A2 | 为每个 TASK 填写 `traces: [FR-FEAT-NNN, ...]` | `tasks.md` 含 traces |
| 3 | A2 | 依赖分析：标注 `depends_on` 和 `[P]` 并行标记 | 依赖图 |
| 4 | A2 | 生成 Checklist：从 AC 派生验证场景清单 | `checklist.md` |
| 5 | A2 | 更新追踪矩阵：填充 Task Ref 列 | 矩阵更新 |
| 6 | A2 | Task Review：校验 Task 覆盖率 = 100% + Task 合规率 = 100% | 评审记录 |

**备选流程**：
- **1a. Size S**：`checklist.md` 可内嵌于 `tasks.md`
- **3a. Size M/L**：标记 `[P]` 的 TASK 可并行执行，需评估文件交叉风险

**异常流程**：
- **6x. 覆盖率 < 100%**：存在遗漏需求，补充 TASK 后重新校验
- **6y. 合规率 < 100%**：存在无需求依据的 TASK，删除或补充 traces

**后置条件**：
- 所有 FR/NFR 至少有 1 个 TASK 覆盖（Task 覆盖率 = 100%）
- 所有 TASK 至少引用 1 个 FR/NFR（Task 合规率 = 100%）

**Exit Gate**：Task Review + Task 覆盖率 = 100% + Task 合规率 = 100% → **Gate Owner: A2 Tech Lead**

**验收标准**：
- [ ] 每个 TASK 有唯一 ID 且含 `traces` 字段
- [ ] Task 覆盖率 = 100%（无遗漏需求）
- [ ] Task 合规率 = 100%（无过度实现）
- [ ] 依赖关系显式标注，可并行 TASK 已标记 `[P]`

---

##### UC-005: 规范驱动开发

| 维度 | 描述 |
|------|------|
| **用例 ID** | UC-005 |
| **主 Actor** | A3 Developer |
| **辅助 Actor** | A2 Tech Lead（CR 终审）, A6 AI Agent（可选） |
| **阶段映射** | 04 Implement |
| **触发条件** | UC-004 完成（Task Review 通过） |

**前置条件**：
1. `tasks.md` 已通过 Task Review
2. Task 覆盖率 = 100%，Task 合规率 = 100%

**主流程**：

| 步骤 | Actor | 动作 | 产出物 |
|------|-------|------|--------|
| 1 | A3 | 领取 TASK，重读对应 FR 条目和 AC | — |
| 2 | A3 | TDD：先写测试（基于 AC），再写实现 | 单元测试 + 代码 |
| 3 | A3 | 代码关键位置标注：`// implements: TASK-FEAT-NNN, traces: FR-FEAT-NNN` | 追踪注释 |
| 4 | A3 | Git Commit：`[TASK-FEAT-NNN] 提交描述` | Commit |
| 5 | A3 | 创建 PR：描述含 `Implements: TASK-FEAT-NNN` | PR |
| 6 | A3 | 更新 `stage-state.json`：记录完成状态和关键决策 | 过程记录 |
| 7 | A2/A3 | Code Review：功能正确性 + 契约一致性 + 追踪合规 | CR Report |
| 8 | A2 | 更新追踪矩阵：填充 PR Ref 列 | 矩阵更新 |

**备选流程**：
- **2a. AI 辅助**（→ UC-021）：AI Agent 按 TASK 生成代码 + 单元测试，Developer 审核
- **并行执行**（Size M/L）：标记 `[P]` 且无文件交叉的 TASK 使用 Git Worktree 隔离并行开发

**异常流程**：
- **4x. Pre-commit Hook 拦截**：Commit message 不含 TASK ID → 修正格式后重新提交
- **7x. CR 未通过**：修正代码后重新提交 PR

**后置条件**：
- 所有 PR 关联了 TASK ID（PR 合规率 = 100%）
- Code Review 通过，单元测试代码覆盖率达标

**Exit Gate**：Code CR 通过 + 单元测试代码覆盖率 ≥ 80%（行覆盖率） + PR 合规率 = 100% → **Gate Owner: A2 Tech Lead / Peer**

**验收标准**：
- [ ] 每个 PR 描述含至少 1 个 TASK ID
- [ ] PR 合规率 = 100%
- [ ] 代码关键位置有追踪注释
- [ ] `stage-state.json` 已更新本阶段工作记录

---

##### UC-006: 验证与验收

| 维度 | 描述 |
|------|------|
| **用例 ID** | UC-006 |
| **主 Actor** | A4 QA Lead |
| **辅助 Actor** | A1 PM（UAT 签核）, A3 Developer（修复）, A6 AI Agent（可选） |
| **阶段映射** | 05 Verify |
| **触发条件** | UC-005 完成（Code CR 通过） |

**前置条件**：
1. Code Review 通过，PR 合规率 = 100%
2. `spec.md` 中所有 AC 可用于测试设计

**主流程**：

| 步骤 | Actor | 动作 | 产出物 |
|------|-------|------|--------|
| 1 | A4 | 测试设计：每个 TC 分配 `TC-LVL-FEAT-NNN`，含 `verifies: [FR/AC 或 NFR]` | `tests/*.test.md` |
| 2 | A4 | 测试执行：集成测试 + 回归测试 | Test Report |
| 3 | A4 | 安全扫描：OWASP Top 10 + 依赖漏洞扫描 | Security Report |
| 4 | A1 | UAT：基于 AC 的端到端验收 | UAT Sign-off |
| 5 | A4 | 更新追踪矩阵：填充 Test Case Ref 列，Status → ✅ Verified | 矩阵更新 |

**备选流程**：
- **1a. AI 辅助**（→ UC-022）：AI Agent 基于 AC 生成 TC 草稿，QA 审核修正
- **Mode I 额外活动**：回归验证 → 产出 `regression-report.md`

**Mode I 回归测试范围推导**（基于追踪矩阵）：

1. 从 `impact-analysis.md` 获取变更的 FR/NFR ID 集合
2. 在追踪矩阵中查找这些 FR/NFR 关联的所有 TC（直接覆盖）
3. 查找与变更 FR/NFR 共享 TASK、PR **或 API/Data Ref** 的其他 FR/NFR，纳入其 TC（间接影响）
4. 合并去重后得到回归 TC 集合，作为回归测试的最小必要范围

> **原则**：回归范围 = 直接覆盖 TC ∪ TASK/PR 间接影响 TC ∪ API/Data 间接影响 TC。Size S 可人工判断，Size M/L 建议脚本自动推导。

**异常流程**：
- **2x. 测试失败**：A3 Developer 修复 → 重新执行测试
- **3x. 安全高危漏洞**：阻断发布，修复后重新扫描
- **4x. UAT 未通过**：回退到 Implement 修复，重新走 Verify

**后置条件**：
- Test 覆盖率 = 100%（所有 FR/NFR 至少有 1 个 TC）
- TC 合规率 = 100%（所有 TC 引用了 FR/AC）
- 安全无高危漏洞
- UAT Sign-off 通过

**Exit Gate**：UAT Sign-off + 安全无高危 + Test 覆盖率 = 100% + TC 合规率 = 100% → **Gate Owner: A4 QA Lead + A1 PM**

**验收标准**：
- [ ] 每个 TC 有唯一 ID 且含 `verifies` 字段（引用 FR/AC 或 NFR）
- [ ] Test 覆盖率 = 100%（含 NFR），TC 合规率 = 100%
- [ ] 安全扫描报告无高危/严重漏洞
- [ ] UAT Sign-off 记录已归档

---

##### UC-007: 收尾归档

| 维度 | 描述 |
|------|------|
| **用例 ID** | UC-007 |
| **主 Actor** | A2 Tech Lead |
| **辅助 Actor** | A1 PM, A3 Developer |
| **阶段映射** | 06 Wrap-up |
| **触发条件** | UC-006 完成（UAT Sign-off 通过） |

**前置条件**：
1. UAT Sign-off 通过
2. 安全扫描无高危漏洞

**主流程**：

| 步骤 | Actor | 动作 | 产出物 |
|------|-------|------|--------|
| 1 | A2/A3 | Retrospective：回顾流程执行情况 | `retro.md` |
| 2 | A2 | 文档归档：按归档清单逐项检查 | 归档确认 |
| 3 | A2 | Spec 同步：如有实现偏差，更新 Spec 使其与最终实现一致 | `spec.md` 更新 |
| 4 | A2 | 追踪矩阵最终校验：所有 Status → 🎯 Accepted 或 🚫 Cancelled | 矩阵终版 |
| 5 | A2 | 提炼 Action Items | 改进清单 |

**后置条件**：
- 实现覆盖率 = 100%
- 追踪矩阵 Status 全部为 🎯 Accepted 或 🚫 Cancelled
- 归档清单全部通过

**Exit Gate**：文档完整性 + 实现覆盖率 = 100% + 矩阵全 🎯 → **Gate Owner: A2 Tech Lead**

**验收标准**：
- [ ] 归档清单 18 项全部通过（详见产出物标准化章节）
- [ ] 追踪矩阵无 ❌ Not Implemented 状态
- [ ] `retro.md` 含 Action Items

---

##### UC-008: 流程裁剪选择

| 维度 | 描述 |
|------|------|
| **用例 ID** | UC-008 |
| **主 Actor** | A2 Tech Lead |
| **辅助 Actor** | A1 PM |
| **阶段映射** | 00 Init（嵌入 UC-001） |
| **触发条件** | Feature 启动时，确定 Mode + Size 后 |

**前置条件**：
1. Mode（N/I）和 Size（S/M/L）已确定

**主流程**：

| 步骤 | Actor | 动作 | 产出物 |
|------|-------|------|--------|
| 1 | A2 | 根据 Size 查询产出物深度矩阵，确定每个产出物的深度级别 | 裁剪方案 |
| 2 | A2 | 根据 Mode 确定额外产出物（Mode I：`impact-analysis.md`、`regression-report.md`） | 裁剪方案 |
| 3 | A2 | 根据涉及端合并 Layer 2 规则 | 端规则合并结果 |
| 4 | A2 | 记录裁剪决策到 Feature 元数据 | 元数据更新 |

**裁剪决策矩阵**（核心参考）：

| 产出物 | Size S | Size M | Size L |
|--------|--------|--------|--------|
| `spec.md` | 简版：Stories + AC | 标准版：完整 PRD | 完整版：含 Domain Model |
| `research.md` | 可省略 | 简版 | 完整版 |
| `design.md` | 简版：核心决策 | 标准版：架构图 + ADR | 完整版：含部署图 |
| `contracts/` | 内嵌于 design.md | 独立 YAML | 独立 YAML + Mock |
| `data-model.md` | 可省略 | 简版：ERD | 完整版 |
| `tasks.md` | 简版：列表 + traces | 标准版：含依赖图 | 完整版：含里程碑 |
| `tests/*.test.md` | 核心路径 TC | 含边界条件 | 含异常 + 性能 |
| `traceability-matrix.md` | 必须（简化列） | 必须（完整列） | 必须（完整 + 跨端） |

**核心原则**：不跳过阶段，只调节产出物深度。

**验收标准**：
- [ ] 裁剪方案已记录在 Feature 元数据中
- [ ] 团队成员已知晓本 Feature 的产出物深度要求

---

#### B. 横切用例

---

##### UC-010: 质量门禁校验

| 维度 | 描述 |
|------|------|
| **用例 ID** | UC-010 |
| **主 Actor** | A7 CI/CD System |
| **辅助 Actor** | A2 Tech Lead（终审放行） |
| **阶段映射** | 全阶段（每个阶段 Exit Gate） |
| **触发条件** | 阶段产出物提交时 / AI 会话结束时 / PR 创建时 |

**前置条件**：
1. **Layer B（必须）**：Git Hook（commit-msg / pre-push）+ CI Pipeline 已集成校验脚本
2. **Layer A（可选）**：Claude Code Hook 已配置（PreToolUse / PostToolUse / Stop）——仅 AI 辅助场景

**主流程**：

| 步骤 | Actor | 动作 | 产出物 |
|------|-------|------|--------|
| 1 | A7 | Hook 自动触发：检查当前阶段 Gate 条件 | 校验结果 |
| 2 | A7 | 条件不满足 → 自动阻断（阻止写操作或提示修正） | 阻断通知 |
| 3 | A3/A2 | 修正产出物，重新提交 | 修正后产出物 |
| 4 | A2 | Gate Owner 人工终审放行 | 放行记录 |

**双层 Hook 体系**（按执行环境拆分）：

**Layer A — AI Runtime Hook**（仅 AI 辅助开发场景生效，依赖 Claude Code Runtime）：

| Hook 类型 | 触发时机 | 校验内容 |
|----------|---------|---------|
| PreToolUse | AI 执行写操作前 | 当前阶段前置 Gate 是否满足 |
| PostToolUse | AI 执行写操作后 | 产出物 ID 格式、traces 完整性 |
| Stop | AI 会话结束时 | 三文件完成度 + 追踪产物同步 |

**Layer B — Git/CI Hook**（所有开发场景均生效，不依赖 AI Runtime）：

| Hook 类型 | 触发时机 | 校验内容 |
|----------|---------|---------|
| commit-msg | Git 提交时 | Commit message 包含合法 ID 标签（见下方阶段感知规则） |
| pre-push | Git 推送前 | Spec-Consistency-Analysis（增量校验） |
| CI Pipeline | PR 创建/更新时 | 全量一致性校验 + 追踪覆盖率 |

> **commit-msg 阶段感知规则**：TASK ID 在 03 Plan 阶段才产生，因此 commit-msg Hook 需根据提交路径识别阶段，允许对应的 ID 标签格式：
>
> | 提交路径匹配 | 允许的标签格式 | 适用阶段 |
> |-------------|--------------|---------|
> | `spec.md`, `research.md` | `[SPEC-<FEAT>]` | 00 Init / 01 Specify |
> | `design.md`, `contracts/*`, `data-model.md` | `[DESIGN-<FEAT>]` | 02 Design |
> | `tasks.md`, `task_plan.md` | `[PLAN-<FEAT>]` | 03 Plan |
> | 其他文件 | `[TASK-<FEAT>-NNN]` | 04+ 阶段（默认规则） |
>
> 当提交包含多阶段文件时，取最高阶段的标签格式。`<FEAT>` 须在 FEAT 注册表中已注册。

> **场景适配**：纯人工开发场景下 Layer A 不存在，所有 Gate 校验由 Layer B（Git/CI Hook）承载。AI 辅助场景下两层叠加，Layer A 提供实时反馈，Layer B 作为最终防线。

**验收标准**：
- [ ] Gate 未通过时自动阻断，不可绕过
- [ ] Gate 结果记录在对应阶段产出物中
- [ ] Hook 自动校验 + 人工终审双轨制运行
- [ ] 纯人工场景下 Git/CI Hook 可独立完成所有 Gate 校验

---

##### UC-011: 规范一致性校验（Spec-Consistency-Analysis）

| 维度 | 描述 |
|------|------|
| **用例 ID** | UC-011 |
| **主 Actor** | A7 CI/CD System |
| **辅助 Actor** | A2 Tech Lead（不一致项修复决策） |
| **阶段映射** | 01-05（5 个触发时机） |
| **触发条件** | 每个阶段产出物完成后自动触发 |

**前置条件**：
1. 当前阶段产出物已提交
2. ID 体系已在产出物中正确声明

**主流程**：

| 步骤 | Actor | 动作 | 产出物 |
|------|-------|------|--------|
| 1 | A7 | 根据当前阶段确定校验范围（见下表） | — |
| 2 | A7 | 基于 ID 追踪链执行跨产物一致性校验 | Consistency Report |
| 3 | A7 | 不一致项标记并输出报告 | 不一致项清单 |
| 4 | A2/A3 | 修复不一致项（当前阶段内修复，不得带入下一阶段） | 修正后产出物 |

**5 个触发时机与校验内容**：

| # | 触发时机 | 校验内容 |
|---|---------|---------|
| 1 | Specify 完成后 | spec 内部一致性：AC 覆盖所有 FR、NFR 量化、FR 间无矛盾 |
| 2 | Design 完成后 | spec ↔ design：每个 FR 有设计方案，API 覆盖需接口的 FR |
| 3 | Plan 完成后 | spec ↔ tasks：Task 覆盖率 = 100%，Task 合规率 = 100% |
| 4 | Implement 完成后 | spec ↔ code：PR 合规率 = 100%，API 实现与契约一致 |
| 5 | Verify 完成后 | spec ↔ test：Test 覆盖率 = 100%，所有 AC 有对应 TC 且通过 |

**验收标准**：
- [ ] 5 个时机均可自动触发校验
- [ ] 不一致项在当前阶段修复，不带入下一阶段
- [ ] 支持增量校验（仅校验本次变更涉及的产物）

---

##### UC-012: 变更管理

| 维度 | 描述 |
|------|------|
| **用例 ID** | UC-012 |
| **主 Actor** | A2 Tech Lead |
| **辅助 Actor** | A1 PM（Major/Critical 审批）, A5 Architect（Critical 审批） |
| **阶段映射** | 任意阶段均可触发 |
| **触发条件** | 需求变更 / 设计变更 / 实现偏差 / Constitution 变更 |

**前置条件**：
1. 变更需求已明确
2. 追踪矩阵可用于影响分析

**主流程（Major/Critical）**：

| 步骤 | Actor | 动作 | 产出物 |
|------|-------|------|--------|
| 1 | A2 | 判定变更级别：Minor / Major / Critical | 变更分级 |
| 2 | A2 | 提交 RFC（`rfc/NNN-*.rfc.md`） | RFC 文档 |
| 3 | A2 | Impact Analysis：基于 ID 链自动定位受影响产物 | 影响范围清单 |
| 4 | A2/A1/A5 | 审批（按级别决定审批人） | 审批记录 |
| 5 | A3 | 执行变更：更新受影响产物 + 同步追踪矩阵 | 更新后产物 |
| 6 | A7 | 触发 Spec-Consistency-Analysis 重新校验 | 校验报告 |

**备选流程（Minor 快速通道）**：
- 直接修改 + Tech Lead 审批 + 触发增量 SCA，无需提交 RFC

**变更分级标准**：

| 级别 | 定义 | 审批要求 |
|------|------|---------|
| Minor | 影响 ≤2 个产物，不需重新触发已通过 Gate | A2 审批 |
| Major | 影响 3-5 个产物，或需重新触发已通过 Gate | A2 + A1 审批 |
| Critical | 涉及 Constitution 或架构变更 | A2 + A1 + A5 审批 |

**验收标准**：
- [ ] 变更级别判定有明确依据
- [ ] Major/Critical 变更有 RFC 记录
- [ ] 受影响产物全部更新，追踪矩阵同步

---

##### UC-013: 缺陷管理

| 维度 | 描述 |
|------|------|
| **用例 ID** | UC-013 |
| **主 Actor** | A4 QA Lead |
| **辅助 Actor** | A2 Tech Lead（严重等级终审）, A3 Developer（修复） |
| **阶段映射** | 横切——05 Verify 及生产环境均可触发 |
| **触发条件** | 测试阶段发现缺陷 / 生产环境报告缺陷 |

**前置条件**：
1. Bug Tracker（Jira 或等效工具）已配置
2. 追踪矩阵可用于缺陷溯源

**缺陷生命周期**：

```
New → Confirmed → Assigned → Fixing → Fixed → Verified → Closed
                                  ↘ Won't Fix → Closed
                                  ↘ Deferred → (下一迭代重新进入)
```

**缺陷严重等级**：

| 等级 | 定义 | SLA（修复时限） |
|------|------|----------------|
| S1-Critical | 系统不可用 / 数据丢失 / 安全漏洞 | 4 小时内响应，24 小时内修复 |
| S2-Major | 核心功能不可用，无 workaround | 8 小时内响应，3 工作日内修复 |
| S3-Minor | 功能异常但有 workaround | 1 工作日内响应，下一迭代修复 |
| S4-Trivial | UI 瑕疵 / 文案错误 | 下一迭代修复 |

**主流程**：

| 步骤 | Actor | 动作 | 产出物 |
|------|-------|------|--------|
| 1 | A4 | 登记缺陷：关联 `verifies` 字段溯源到 FR/AC/NFR | Bug Ticket |
| 2 | A4 | 判定严重等级（S1-S4），S1/S2 需 Tech Lead 确认 | 等级标记 |
| 3 | A2 | 分配修复责任人 | Ticket 更新 |
| 4 | A3 | 修复缺陷，PR 关联 Bug Ticket ID | 修复代码 + PR |
| 5 | A4 | 验证修复，更新追踪矩阵 | 验证记录 |
| 6 | A4 | 关闭缺陷，统计缺陷逃逸率 | 缺陷报告 |

**缺陷逃逸率定义**：

```
缺陷逃逸率 = 生产环境发现的缺陷数 / (测试阶段发现 + 生产环境发现) × 100%
```

- **统计窗口**：发布后 30 天
- **目标阈值**：≤ 2%（S1/S2 缺陷逃逸率 = 0%）
- **小样本替代**：总缺陷数 < 10 时，改用绝对值指标（生产缺陷 ≤ 1 个）

**与 Spec-First 体系的集成**：
- 生产缺陷通过 `verifies` 字段反向溯源到 FR/AC/NFR，定位追踪链断裂点
- S1/S2 缺陷触发 RFC 变更流程（UC-012），补充遗漏的 AC 或 TC
- 缺陷修复后更新追踪矩阵，确保覆盖率指标反映真实状态

**验收标准**：
- [ ] 每个缺陷有唯一 Ticket ID 且关联到 FR/AC/NFR
- [ ] 严重等级判定有明确依据
- [ ] S1/S2 缺陷修复后触发回归测试
- [ ] 缺陷逃逸率在 Wrap-up 阶段统计并记录

---

#### C. AI 辅助用例

---

##### UC-020: AI 辅助生成规范

| 维度 | 描述 |
|------|------|
| **用例 ID** | UC-020 |
| **主 Actor** | A6 AI Agent |
| **辅助 Actor** | A1 PM（审核签核） |
| **阶段映射** | 01 Specify |
| **触发条件** | PM 提供业务意图描述，委派 AI 生成 spec 草稿 |

**前置条件**：
1. Feature 已初始化（UC-001 完成）
2. PM 提供了业务意图的自然语言描述

**主流程**：

| 步骤 | Actor | 动作 | 产出物 |
|------|-------|------|--------|
| 1 | A1 | 输入业务意图描述（自然语言） | 业务意图 |
| 2 | A6 | 需求分析：逻辑解构，识别业务规则 | Domain Model 草稿 |
| 3 | A6 | 生成结构化 PRD：User Stories + AC + ID 分配 | `spec.md` 草稿 `[AI-GENERATED]` |
| 4 | A6 | 歧义检测：标记 `[NEEDS CLARIFICATION]` | 歧义清单 |
| 5 | A1 | 审核：修正 AI 生成内容，消除歧义 | `spec.md` `[HUMAN-REVIEWED]` |
| 6 | A6 | 初始化追踪矩阵 | `traceability-matrix.md` |

**AI 能力边界**：
- **可做**：结构化 PRD 生成、ID 分配、歧义检测（AI 生成占比 60-70%）
- **不可做**：业务意图确认、优先级判定（必须人类决策）

**验收标准**：
- [ ] AI 生成内容标记 `[AI-GENERATED]`
- [ ] PM 审核后标记 `[HUMAN-REVIEWED]`
- [ ] 最终 spec.md 通过 DoR Sign-off

---

##### UC-021: AI 辅助生成代码

| 维度 | 描述 |
|------|------|
| **用例 ID** | UC-021 |
| **主 Actor** | A6 AI Agent |
| **辅助 Actor** | A3 Developer（审核）, A2 Tech Lead（CR 终审） |
| **阶段映射** | 04 Implement |
| **触发条件** | Developer 委派 AI 按 TASK 生成代码 |

**前置条件**：
1. `tasks.md` 已通过 Task Review
2. 当前 TASK 的 traces 和 AC 已明确

**主流程**：

| 步骤 | Actor | 动作 | 产出物 |
|------|-------|------|--------|
| 1 | A3 | 选择 TASK，生成 Context Pack（→ UC-023） | context-pack.yaml |
| 2 | A6 | 读取 TASK + AC + 相关 FR，理解实现要求 | — |
| 3 | A6 | TDD：基于 AC 生成测试用例 | 单元测试 `[AI-GENERATED]` |
| 4 | A6 | 生成实现代码，标注追踪注释 | 代码 `[AI-GENERATED]` |
| 5 | A6 | 生成 Commit message：`[TASK-FEAT-NNN] 描述` | Commit |
| 6 | A3 | 审核 AI 生成的代码和测试 | 审核意见 |
| 7 | A3 | 修正后创建 PR：`Implements: TASK-FEAT-NNN` | PR |

**AI 能力边界**：
- **可做**：代码生成、单元测试、追踪注释（AI 生成占比 70-80%）
- **不可做**：Code CR 终审、安全审查（必须人类决策）

**验收标准**：
- [ ] AI 生成代码含追踪注释 `// implements: TASK-FEAT-NNN`
- [ ] 单元测试基于 AC 生成，覆盖主路径
- [ ] Developer 审核通过后方可提交 PR

---

##### UC-022: AI 辅助生成测试

| 维度 | 描述 |
|------|------|
| **用例 ID** | UC-022 |
| **主 Actor** | A6 AI Agent |
| **辅助 Actor** | A4 QA Lead（审核） |
| **阶段映射** | 05 Verify |
| **触发条件** | QA 委派 AI 基于 AC 生成测试用例 |

**前置条件**：
1. `spec.md` 中 AC 已完整（Given-When-Then 格式）
2. 代码实现已通过 Code CR

**主流程**：

| 步骤 | Actor | 动作 | 产出物 |
|------|-------|------|--------|
| 1 | A6 | 读取 spec.md 中所有 FR/AC | — |
| 2 | A6 | 为每个 AC 生成 TC，分配 `TC-LVL-FEAT-NNN`，含 `verifies` | `tests/*.test.md` 草稿 |
| 3 | A6 | 生成边界条件和异常路径测试用例 | 补充 TC |
| 4 | A4 | 审核 TC 完整性和正确性 | 审核意见 |
| 5 | A4 | 补充 AI 遗漏的业务场景 TC | 最终 TC |

**AI 能力边界**：
- **可做**：TC 生成、边界条件推导（AI 生成占比 60-70%）
- **不可做**：UAT 验收、安全扫描终审

**验收标准**：
- [ ] 每个 TC 含 `verifies` 字段引用 FR/AC 或 NFR
- [ ] QA 审核通过后方可用于测试执行

---

##### UC-023: Agent 路由分派

| 维度 | 描述 |
|------|------|
| **用例 ID** | UC-023 |
| **主 Actor** | A6 AI Agent（编排层） |
| **辅助 Actor** | A2 Tech Lead（路由规则配置） |
| **阶段映射** | 01-06 全阶段 |
| **触发条件** | AI 辅助任务需要委派给专业 Agent 时 |

**前置条件**：
1. 代理路由矩阵已配置
2. Context Pack 标准已定义

**主流程**：

| 步骤 | Actor | 动作 | 产出物 |
|------|-------|------|--------|
| 1 | A6 | 识别当前任务类型（需求分析/架构设计/编码/测试等） | 任务分类 |
| 2 | A6 | 查询路由矩阵，确定目标 Agent | Agent 选择 |
| 3 | A6 | 生成 Context Pack（feature_meta + artifacts + current_phase） | context-pack.yaml |
| 4 | A6 | 委派任务给目标 Agent，携带 Context Pack | 委派指令 |
| 5 | A6 | 目标 Agent 执行任务，产出物回传 | Agent 产出物 |

**能力路由矩阵**（规范层只定义能力类型，具体 Agent 映射外置到 `constitution.md` 的 `agent-registry` 节）：

| 任务类型 | 所需能力 | 输入 | 期望产出 |
|---------|---------|------|---------|
| 需求分析 | 业务理解 + 结构化输出 | 业务意图、领域知识 | `spec.md` 草稿 |
| 架构设计 | 系统设计 + 技术选型 | `spec.md`、技术约束 | `design.md` 草稿 |
| 任务编排 | 任务分解 + 依赖分析 | `design.md`、FR 列表 | `tasks.md` |
| 代码生成 | 编码 + 测试生成 | TASK 定义、API 契约 | 源码 + 单元测试 |
| 代码搜索 | 代码库索引 + 语义检索 | 搜索意图 | 相关代码片段 |
| 文档生成 | 技术写作 + 格式化 | 源码、设计文档 | 技术文档 |

> **具体 Agent 映射示例**（维护在 `constitution.md` 中，非规范约束）：
> ```yaml
> # constitution.md → agent-registry
> capabilities:
>   需求分析: { agent: "oracle", source: "omo-skills" }
>   架构设计: { agent: "sisyphus", source: "omo-skills" }
>   任务编排: { agent: "do", source: "myclaude" }
>   代码生成: { agent: "codeagent-wrapper", source: "myclaude" }
>   代码搜索: { agent: "explore", source: "omo-skills" }
>   文档生成: { agent: "document-writer", source: "omo-skills" }
> ```

**路由规则**：
1. Size S 仅使用默认 Agent，不启用多代理路由
2. Size M/L 或跨端场景启用专业 Agent 分工
3. 所有 Agent 产出物必须经人类 Sign-off

**验收标准**：
- [ ] 每次委派携带完整 Context Pack
- [ ] Context Pack 中路径指向实际存在的文件
- [ ] `current_phase` 与 `stage-state.json` 一致

---

##### UC-024: 会话恢复（Session Catchup）

| 维度 | 描述 |
|------|------|
| **用例 ID** | UC-024 |
| **主 Actor** | A6 AI Agent |
| **辅助 Actor** | A3 Developer（触发恢复） |
| **阶段映射** | 任意阶段 |
| **触发条件** | `/clear` 执行 / 上下文窗口截断 / IDE 重启 |

**前置条件**：
1. 运行态三文件存在且有内容
2. 追踪矩阵已有部分填充

**主流程**：

| 步骤 | Actor | 动作 | 产出物 |
|------|-------|------|--------|
| 1 | A6 | 读取 `task_plan.md`（当前规划状态） | 规划上下文 |
| 2 | A6 | 读取 `stage-state.json`（已完成进度） | 进度上下文 |
| 3 | A6 | 读取 `findings.md`（已有发现） | 发现上下文 |
| 4 | A6 | 读取 `traceability-matrix.md`（追踪状态） | 追踪上下文 |
| 5 | A6 | 定位当前阶段（`current_phase`）和当前 TASK | 恢复定位 |
| 6 | A6 | **按 `current_phase` 动态加载阶段核心文件**（见下表） | 阶段上下文 |
| 7 | A6 | 输出恢复摘要到终端 | 恢复报告 |
| 8 | A6 | 校验三文件与实际产出物一致性 | 一致性检查 |

**动态加载文件矩阵**（步骤 6 按 `current_phase` 选择）：

| current_phase | 必须加载 | 可选加载 |
|---------------|---------|---------|
| 01 Specify | `constitution.md` | — |
| 02 Design | `spec.md` | `research.md` |
| 03 Plan | `spec.md`, `design.md` | `contracts/*.yaml` |
| 04 Implement | `tasks.md`, `checklist.md` | `design.md` |
| 05 Verify | `spec.md`, `tasks.md` | `tests/*.test.md` |
| 06 Wrap-up | `spec.md` | 全部产出物 |

**异常流程**：
- **7x. 不一致**：如 stage-state.json 记录已完成但代码未提交 → 立即修正

**验收标准**：
- [ ] 恢复后可准确定位当前阶段和 TASK
- [ ] 三文件与实际产出物一致
- [ ] 恢复摘要输出到终端

---

##### UC-025: AI 编码统计采集

| 维度 | 描述 |
|------|------|
| **用例 ID** | UC-025 |
| **主 Actor** | A6 AI Agent（Layer A Stop Hook 触发） |
| **辅助 Actor** | A7 CI/CD System（Layer B pre-push 兜底采集）, A2 Tech Lead（统计查看） |
| **阶段映射** | 04 Implement |
| **触发条件** | AI 会话结束时（Stop Hook 自动触发） |

**前置条件**：
1. Start Hook 已记录 baseline commit hash
2. 分支命名遵循 `feature/<FR-ID>-<description>` 规范

**主流程**：

| 步骤 | Actor | 动作 | 产出物 |
|------|-------|------|--------|
| 1 | A6 | 读取 baseline commit（`.spec-first/.baseline`） | baseline |
| 2 | A6 | 采集开发人员（`git config user.name`） | 人员信息 |
| 3 | A6 | 解析分支名提取需求 ID | FR-ID |
| 4 | A6 | 统计代码变更：文件数、+additions / -deletions | 代码统计 |
| 5 | A6 | 统计文档变更：.md 文件数、+additions / -deletions | 文档统计 |
| 6 | A6 | 追加记录到 `.spec-first/ai-stats.jsonl` | 统计记录 |
| 7 | A6 | 终端输出统计摘要 | 摘要输出 |

**验收标准**：
- [ ] 每次 AI 会话结束自动采集统计
- [ ] 统计记录含 session/developer/requirement/phase/code/docs 字段
- [ ] 终端输出格式：`AI Stats | Leo | FR-AUTH-001 | 04-implement | Code: 5 files +127 -34`

**`ai-stats.jsonl` 运维策略**：

| 维度 | 策略 | 说明 |
|------|------|------|
| **Git 管理** | `.gitignore` 排除，定期归档 | JSONL 文件频繁追加，不适合逐次提交；按 Sprint/月度归档到 `stats/` 目录后纳入 Git |
| **文件轮转** | 按月自动轮转（Stop Hook 驱动） | 文件名格式 `ai-stats-YYYY-MM.jsonl`，每月 1 日自动创建新文件，旧文件归档。**执行机制**：Layer A Stop Hook 在每次写入前检查当前月份，若目标文件不存在则自动创建；同时维护 `ai-stats.jsonl` 作为指向当月文件的软链接。Layer B pre-push Hook 作为兜底，检测到跨月未轮转时触发归档 |
| **并发写入** | 文件锁 + 追加模式 | 使用 `flock`（Linux）或等效机制确保多 Agent 并发写入不丢数据；写入模式为 append-only |
| **容量上限** | 单文件 ≤ 10MB | 超过阈值自动轮转，避免 JSONL 文件过大影响解析性能 |
| **数据清理** | 保留最近 6 个月 | 超过 6 个月的归档文件可压缩存储或移至外部存储 |

---

#### D. 度量与管理用例

---

##### UC-030: 追踪矩阵管理

| 维度 | 描述 |
|------|------|
| **用例 ID** | UC-030 |
| **主 Actor** | A2 Tech Lead |
| **辅助 Actor** | A6 AI Agent（自动填充）, A7 CI/CD（自动校验） |
| **阶段映射** | 01-06（渐进填充） |
| **触发条件** | 每个阶段产出物完成后 |

**主流程**：

| 步骤 | Actor | 动作 | 产出物 |
|------|-------|------|--------|
| 1 | A2/A6 | 01 Specify：创建矩阵，填入所有 FR/NFR ID | 矩阵初始化 |
| 2 | A2/A6 | 02 Design：填充 Design Ref 和 API/Data Ref 列 | 矩阵更新 |
| 3 | A2/A6 | 03 Plan：填充 Task Ref 列 | 矩阵更新 |
| 4 | A2/A6 | 04 Implement：填充 PR Ref 列 | 矩阵更新 |
| 5 | A2/A6 | 05 Verify：填充 Test Case Ref 列，Status → ✅ | 矩阵更新 |
| 6 | A2 | 06 Wrap-up：Status → 🎯 Accepted，最终校验 | 矩阵终版 |

**验收标准**：
- [ ] 矩阵在每个阶段渐进填充，无跳跃
- [ ] 最终矩阵所有行 Status 为 🎯 或 🚫
- [ ] 矩阵格式符合标准（7 列）

---

##### UC-031: 覆盖率计算与校验

| 维度 | 描述 |
|------|------|
| **用例 ID** | UC-031 |
| **主 Actor** | A7 CI/CD System |
| **辅助 Actor** | A2 Tech Lead（结果审阅） |
| **阶段映射** | 03-06（Gate 嵌入） |
| **触发条件** | Gate 校验时自动触发 |

**覆盖率指标体系**：

| 指标 | 公式 | 校验阶段 | 阈值 |
|------|------|---------|------|
| Task 覆盖率 | Active FR∪NFR with ≥1 TASK / Active FR+NFR | 03 Plan | = 100% |
| API 覆盖率 | FR(需API) with ≥1 API / Total FR(需API) | 02 Design | = 100% |
| Test 覆盖率(FR级) | Active FR∪NFR with ≥1 TC / Active FR+NFR | 05 Verify | = 100% |
| Test 覆盖率(AC级) | Active AC with ≥1 TC / Active AC 总数 | 05 Verify | ≥ 90%(M/L） |
| 实现覆盖率 | Active FR∪NFR with ≥1 PR / Active FR+NFR | 06 Wrap-up | = 100% |
| Task 合规率 | TASK with ≥1 FR/NFR ref / Total TASK | 03 Plan | = 100% |
| TC 合规率 | TC with ≥1 FR/NFR ref / Total TC | 05 Verify | = 100% |
| PR 合规率 | PR with ≥1 TASK ref / Total PR | 04 Implement | = 100% |
| 孤儿项率 | 未关联 FR/NFR 的(TASK+TC+PR) / 全部(TASK+TC+PR) | 06 Wrap-up | = 0% |

**验收标准**：
- [ ] 正向覆盖率 < 100% 时输出遗漏需求清单
- [ ] 反向合规率 < 100% 时输出过度实现清单
- [ ] 孤儿项率 > 0% 时输出未关联产物清单
- [ ] 支持 Known Exception List 豁免机制（豁免条目从分母排除，豁免比例 ≤ 10%）

---

##### UC-032: 度量看板查看

| 维度 | 描述 |
|------|------|
| **用例 ID** | UC-032 |
| **主 Actor** | A2 Tech Lead |
| **辅助 Actor** | A1 PM（业务视角） |
| **阶段映射** | 06 Wrap-up（复盘时） |
| **触发条件** | Feature 交付后复盘，或管理层要求查看 |

**度量指标体系**：

| 类别 | 指标 | 数据来源 | 目标 |
|------|------|---------|------|
| 质量 | 返工率 | Gate 驳回 + PR Request Changes | < 10% |
| 质量 | Gate 首次通过率 | 流程引擎统计 | > 85% |
| 质量 | 缺陷逃逸率 | Bug 跟踪系统 | < 2% |
| 追踪 | 正向覆盖率 | 追踪矩阵 | = 100% |
| 追踪 | 反向合规率 | 追踪矩阵 | = 100% |
| 追踪 | 孤儿项率 | 追踪矩阵 | = 0% |
| AI | AI 代码生成量 | ai-stats.jsonl | 仅统计，无阈值 |
| AI | AI 文档生成量 | ai-stats.jsonl | 仅统计，无阈值 |

**验收标准**：
- [ ] 度量数据可按 Feature 维度聚合
- [ ] 返工率、Gate 通过率可自动计算
- [ ] 复盘时可输出度量摘要报告

---

### 用例间关系矩阵

```
UC-001 Feature启动
  ├── UC-008 流程裁剪选择（嵌入）
  └── UC-002 编写需求规格
        ├── UC-020 AI辅助生成规范（可选）
        ├── UC-011 一致性校验（自动）
        ├── UC-030 追踪矩阵管理（渐进）
        └── UC-003 技术设计
              ├── UC-011 一致性校验（自动）
              └── UC-004 任务规划
                    ├── UC-031 覆盖率计算（自动）
                    └── UC-005 规范驱动开发
                          ├── UC-021 AI辅助生成代码（可选）
                          ├── UC-023 Agent路由分派（可选）
                          ├── UC-010 质量门禁校验（自动）
                          ├── UC-025 AI编码统计（自动）
                          └── UC-006 验证与验收
                                ├── UC-022 AI辅助生成测试（可选）
                                └── UC-007 收尾归档
                                      └── UC-032 度量看板（复盘）

横切：UC-012 变更管理（任意阶段可触发）
横切：UC-013 缺陷管理（05 Verify + 生产环境触发）
横切：UC-024 会话恢复（任意中断后触发）
```

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
| 01 Specify | 需求分析 → PRD → ID 分配 → Clarify | `spec.md`, `traceability-matrix.md`(初始化) | DoR Sign-off，无歧义标记 | 所有 FR/NFR 已分配 ID | Tech Lead |
| 02 Design | Research → 技术选型 → API 契约 → 数据建模 | `research.md`, `design.md`, `contracts/`, `data-model.md`, ADR | Design Review + Baseline Locking | API 覆盖率 = 100% | Tech Lead / Architect |
| 03 Plan | 任务拆解 → 依赖分析 → Checklist | `tasks.md`, `checklist.md` | Task Review | Task 覆盖率 = 100%，Task 合规率 = 100% | Tech Lead |
| 04 Implement | 按 TASK 开发 → TDD → Code Review | 代码、单元测试、CR Report | Code CR + 代码覆盖率 ≥ 80% | PR 合规率 = 100% | Tech Lead / Peer |
| 05 Verify | 测试设计 → 执行 → 安全扫描 → UAT | Test Report, Security Report, UAT Sign-off | UAT Sign-off + 安全无高危 | Test 覆盖率 = 100%，TC 合规率 = 100% | QA Lead + PM |
| 06 Wrap-up | 复盘 → 归档 → Spec 同步 → 矩阵校验 | Retro Report, 完整 `traceability-matrix.md` | 文档完整性 + 归档清单通过 | 实现覆盖率 = 100%，矩阵全 🎯 | Tech Lead |

---

## 全链路追踪体系

### 设计目标

解决"需求遗漏"和"过度实现"两大核心问题：通过统一 ID 体系 + 追踪矩阵 + 覆盖率算法，实现以 FR/NFR 为中心的星型追踪网络（FR↔DS、FR↔API、FR↔TASK、FR↔TC、TASK↔PR），全链路可追踪、可量化、可审计。

### ID 规范

#### 设计原则

- **稳定性**：ID 一次分配，终身不改；需求废弃后不得复用
- **可解析**：统一前缀和序号位数，支持正则校验
- **全局可识别**：ID 携带 Feature/Domain 缩写，脱离目录上下文仍可识别来源

#### ID 类型定义

| 前缀 | 全称 | 格式 | 示例 | 正则 | 定义阶段 |
|------|------|------|------|------|---------|
| `FR` | Functional Requirement | `FR-<FEAT>-NNN` | `FR-AUTH-001` | `^FR-[A-Z][A-Z0-9]{1,15}-\d{3}$` | 01. Specify |
| `NFR` | Non-Functional Req | `NFR-<DIM>-NNN` | `NFR-SEC-001` | `^NFR-[A-Z][A-Z0-9]{1,7}-\d{3}$` | 01. Specify |
| `DS` | Design Section | `DS-<FEAT>-NNN` | `DS-AUTH-001` | `^DS-[A-Z][A-Z0-9]{1,15}-\d{3}$` | 02. Design |
| `API` | API Endpoint | `API-<SVC>-NNN` | `API-AUTH-001` | `^API-[A-Z][A-Z0-9]{1,15}-\d{3}$` | 02. Design |
| `TASK` | Implementation Task | `TASK-<FEAT>-NNN` | `TASK-AUTH-001` | `^TASK-[A-Z][A-Z0-9]{1,15}-\d{3}$` | 03. Plan |
| `TC` | Test Case | `TC-<LVL>-<FEAT>-NNN` | `TC-E2E-AUTH-001` | `^TC-(UT\|IT\|E2E\|ST)-[A-Z][A-Z0-9]{1,15}-\d{3}$` | 05. Verify |
| `ADR` | Architecture Decision | `ADR-NNN` | `ADR-001` | `^ADR-\d{3}$` | 02. Design |
| `RFC` | Request for Change | `RFC-NNN` | `RFC-001` | `^RFC-\d{3}$` | 横切机制 C |

**说明**：

- `<FEAT>` 为 Feature 缩写（2-16 位大写字母+数字，首位必须为字母），如 AUTH、PAY、ORDER。**FEAT 缩写必须全局唯一**，通过 FEAT 注册表治理（见下方）
- `<DIM>` 为 2-8 位大写字母或数字的维度缩写。推荐枚举：`PERF`（性能）、`SEC`（安全）、`REL`（可靠性）、`AVAIL`（可用性）、`OBS`（可观测性）；可按需扩展：`MAINT`（可维护性）、`SCALE`（可扩展性）、`COMPAT`（兼容性）、`COMP`（合规性）、`I18N`（国际化）等
- `<LVL>` 固定枚举：`UT`（单元测试）、`IT`（集成测试）、`E2E`（端到端测试）、`ST`（静态分析测试）
- `<SVC>` 为服务/模块缩写，与 `<FEAT>` 规则相同
- `DS` 为 Design Section ID，在 `design.md` 中为每个设计章节分配结构化 ID，替代非结构化的章节号引用（如 `§2.1`），确保追踪链在 Design 层可正则校验且不随编辑漂移
- NNN 为三位数字，从 001 开始递增
- ADR/RFC 为文件名 ID（一个文件对应一个 ID），与 FR/TASK/TC 的条目级 ID（一个文件包含多个 ID）不同
- **正则注意**：表格中 TC 正则的 `\|` 是 Markdown 表格转义，实际正则为 `^TC-(UT|IT|E2E|ST)-[A-Z][A-Z0-9]{1,15}-\d{3}$`

#### FEAT 注册表

为确保 `<FEAT>` 缩写全局唯一，项目须维护 FEAT 注册表文件 `specs/.feat-registry.md`：

```markdown
# FEAT 注册表

| FEAT 缩写 | 全称 | 注册人 | 注册日期 | 状态 |
|-----------|------|--------|---------|------|
| AUTH | Authentication | Leo | 2026-01-15 | Active |
| AUTHZ | Authorization | Leo | 2026-01-15 | Active |
| PAY | Payment | Leo | 2026-01-20 | Active |
| ORDER | Order Management | Leo | 2026-02-01 | Deprecated |
```

**治理规则**：

1. **Init 内联校验强制校验**：UC-001 Init 阶段必须检查新 FEAT 缩写是否与注册表中已有条目冲突，冲突则阻塞
2. **先注册后使用**：任何 FR/TASK/TC/API 使用新 FEAT 缩写前，必须先在注册表中登记
3. **禁止歧义缩写**：同一业务域不得注册多个缩写（如 Authentication 不可同时注册 AUTH 和 AUTHN）
4. **废弃不复用**：FEAT 缩写废弃后标记 `Deprecated`，不得被新 Feature 复用

#### ID 声明格式

**spec.md 中声明 FR/NFR**：

```markdown
### 功能需求

#### FR-AUTH-001: 用户邮箱注册
**As** 用户 **I want** 通过邮箱注册 **So that** 我可以使用系统

**Acceptance Criteria**:
- AC-1: Given 有效邮箱，When 提交注册，Then 创建账户并发送验证邮件
- AC-2: Given 已注册邮箱，When 提交注册，Then 提示"邮箱已注册"

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
```

**tests/*.test.md 中声明 TC 并引用 FR/NFR**：

```markdown
#### TC-E2E-AUTH-001: 验证邮箱注册成功
- **verifies**: FR-AUTH-001/AC-1
- **type**: E2E
- **steps**: ...
- **expected**: 账户创建成功，验证邮件已发送

#### TC-IT-AUTH-002: 验证注册接口性能
- **verifies**: NFR-PERF-001
- **type**: IT (Performance)
- **method**: 压测工具（如 k6/JMeter）模拟 1000 QPS 并发
- **steps**: 1. 配置压测脚本 2. 执行 60s 持续压测 3. 采集 P99 延迟
- **expected**: P99 < 200ms，错误率 < 0.1%
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

**design.md 中声明 DS（Design Section）**：

```markdown
## 2. 详细设计

### DS-AUTH-001: 用户注册流程设计
- **traces**: [FR-AUTH-001, FR-AUTH-002]
- **概述**: 描述用户注册的完整流程，包括邮箱验证、密码加密、账户创建

#### 2.1 流程图
...

### DS-AUTH-002: 认证令牌管理设计
- **traces**: [FR-AUTH-003, NFR-SEC-001]
- **概述**: 描述 JWT 令牌的生成、刷新和撤销机制
```

> **说明**：每个设计章节以 `DS-<FEAT>-NNN` 作为标题前缀，通过 `traces` 字段引用对应的 FR/NFR。追踪矩阵的 Design Ref 列填写 DS-ID（如 `DS-AUTH-001`），替代非结构化的章节号引用（如 `§2.1`），确保 Design 层追踪链可正则校验且不随编辑漂移。

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
- 每个 TC 必须有 `verifies` 字段，引用至少 1 个 FR/AC 或 NFR（如 `verifies: [FR-AUTH-001/AC-1]` 或 `verifies: [NFR-PERF-001]`）
- 每个 PR 描述中必须包含至少 1 个 TASK ID
- 无 traces 的 TASK 视为"过度实现"，需在 CR 中说明理由
- **跨 Feature 引用**：ID 自带 Feature 缩写（如 `FR-AUTH-001`），脱离目录上下文即可识别来源

#### 跨 Feature 依赖登记

当一个 Feature 的 FR/TASK 依赖另一个 Feature 的产出物时，必须显式登记依赖关系，避免隐式耦合导致变更遗漏。

**依赖登记位置**：`specs/cross-feature-deps.md`（项目级，所有 Feature 共享）。

**登记格式**：

| 依赖方 | 被依赖方 | 依赖类型 | 说明 | 状态 |
|--------|---------|---------|------|------|
| FR-PAY-003 | FR-AUTH-001 | 功能依赖 | 支付需要认证令牌 | 🟢 已就绪 |
| TASK-REPORT-002 | API-USER-001 | 接口依赖 | 报表需调用用户查询接口 | 🟡 开发中 |

**依赖类型枚举**：

| 类型 | 说明 |
|------|------|
| 功能依赖 | FR 级别，一个功能需求依赖另一个功能需求已实现 |
| 接口依赖 | API/契约级别，需调用另一个 Feature 的 API |
| 数据依赖 | 共享数据模型或数据库表 |
| 部署依赖 | 部署顺序有先后要求 |

**治理规则**：

- Init 阶段识别依赖 → 登记到 `cross-feature-deps.md`
- 被依赖方发生变更时，通过依赖表反查所有依赖方，纳入 Impact Analysis
- ★ Gate 3: Release Ready 校验：所有依赖项状态必须为 🟢 已就绪，否则阻塞

### 追踪矩阵

#### 定义

追踪矩阵（Traceability Matrix）是全链路追踪的核心产出物，记录 FR/NFR 从需求到代码的完整映射链路。

**产出物**：`traceability-matrix.md`，存放于 Feature 目录根下。

#### 矩阵格式

```markdown
# 追踪矩阵 — <Feature Name>

| 需求 ID | Design Ref | API/Data Ref | Task Ref | Test Case Ref | PR Ref | Status |
|---------|-----------|-------------|----------|--------------|--------|--------|
| FR-AUTH-001 | DS-AUTH-001 | API-AUTH-001 | TASK-AUTH-001, TASK-AUTH-002 | TC-E2E-AUTH-001 | #123 | 🎯 Accepted |
| FR-AUTH-002 | DS-AUTH-002 | API-AUTH-002 | TASK-AUTH-003 | TC-IT-AUTH-001 | #124 | 🎯 Accepted |
| NFR-PERF-001 | DS-AUTH-003 | — | TASK-AUTH-004 | TC-IT-AUTH-002 | #125 | 🎯 Accepted |
```

**格式选择建议**（按 Size 裁剪）：

| Size | 推荐格式 | 说明 |
|------|---------|------|
| S | Markdown 表格 | 需求少（≤10 FR），人工维护成本低 |
| M | YAML 结构化 | 需求中等（11-30 FR），便于脚本解析和自动化校验 |
| L | JSON/YAML + 自动化工具 | 需求多（>30 FR），必须配合 CI 脚本自动校验覆盖率 |

M/L 规模 YAML 格式示例：

```yaml
# traceability-matrix.yaml
requirements:
  - id: FR-AUTH-001
    design_ref: DS-AUTH-001
    api_ref: API-AUTH-001
    tasks: [TASK-AUTH-001, TASK-AUTH-002]
    test_cases: [TC-E2E-AUTH-001]
    pr_ref: "#123"
    status: accepted
```

> **注**：S 规模项目仍使用上述 Markdown 表格格式；M/L 规模项目建议迁移到 YAML/JSON 以支持自动化校验脚本。两种格式的字段语义完全一致。

**Status 状态枚举**：

| 状态 | 含义 | 典型阶段 |
|------|------|---------|
| 📋 Planned | 需求已录入，尚未开始设计/实现 | 01. Specify |
| 🔨 Implemented | 已有 TASK 和 PR，尚未测试验证 | 04. Implement |
| ✅ Verified | 已有 TC 且测试通过 | 05. Verify |
| 🎯 Accepted | UAT 签核通过，正式验收 | 06. Wrap-up |
| ⏸️ Deferred | 需求推迟到后续版本 | 任何阶段 |
| 🚫 Cancelled | 需求已取消（需记录取消原因） | 任何阶段 |
| ⚠️ Exception | 需求因客观原因豁免（已登记 Known Exception List） | 任何阶段 |
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
| **Task 覆盖率** | \|Active FR∪NFR with ≥1 TASK\| / \|Active FR + NFR\| × 100% | ★ Gate 2 | = 100% |
| **Test 覆盖率(FR级)** | \|Active FR∪NFR with ≥1 TC\| / \|Active FR + NFR\| × 100% | ★ Gate 3 | = 100% |
| **Test 覆盖率(AC级)** | \|Active AC with ≥1 TC\| / \|Active AC 总数\| × 100% | ★ Gate 3 | ≥ 90%（M/L） |
| **实现覆盖率** | \|Active FR∪NFR with ≥1 PR\| / \|Active FR + NFR\| × 100% | ★ Gate 3 | = 100% |
| **API 覆盖率** | \|FR(需API) with ≥1 API\| / \|Total FR(需API)\| × 100% | ★ Gate 1 | = 100% |

**Active 定义**：Active FR+NFR = Total FR+NFR 中排除 Status 为 ⏸️ Deferred、🚫 Cancelled 和 ⚠️ Exception 的条目。已推迟、已取消或已豁免的需求不计入覆盖率分母，避免因非活跃需求导致覆盖率永远无法达标。

**解读**：正向覆盖率 < 100% = 存在**遗漏需求**（含遗漏的非功能需求）。

#### 反向合规率（实现是否有需求依据）

| 指标 | 公式 | 校验阶段 | Gate 阈值 |
|------|------|---------|----------|
| **Task 合规率** | \|TASK with ≥1 FR/NFR ref\| / \|Total TASK\| × 100% | ★ Gate 2 | = 100% |
| **TC 合规率** | \|TC with ≥1 FR/NFR ref\| / \|Total TC\| × 100% | ★ Gate 3 | = 100% |
| **PR 合规率** | \|PR with ≥1 TASK ref\| / \|Total PR\| × 100% | ★ Gate 2 | = 100% |

**解读**：反向合规率 < 100% = 存在**过度实现**。

#### 综合指标

| 指标 | 公式 | 目标 |
|------|------|------|
| **孤儿项率** | 未关联 FR/NFR 的 (TASK + TC + PR) 数 / 全部 (TASK + TC + PR) 数 × 100% | = 0% |

**解读**：孤儿项率 > 0% = 存在未与需求关联的产物，是反向合规率的综合视角补充。

#### Known Exception List（已知豁免清单）

当特定 FR/NFR 因客观原因无法在当前阶段达到 100% 覆盖时，可通过 **Known Exception List** 机制进行豁免登记，避免 Gate 因不可控因素永久阻塞。

**豁免条件**（满足任一即可申请）：

| 条件 | 示例 |
|------|------|
| 第三方依赖未就绪 | 外部 API 未上线，对应 FR 无法编写集成测试 |
| 技术限制 | 硬件相关 NFR 在 CI 环境无法验证 |
| 阶段性延迟 | 需求已拆分为多期交付，当期仅实现部分 |

**豁免流程**：

1. 申请人在追踪矩阵中将对应条目 Status 标记为 `⚠️ Exception`
2. 在 `specs/known-exceptions.md` 中登记豁免记录：
   ```markdown
   | ID | 豁免需求 | 原因分类 | 说明 | 预计解除时间 | 审批人 |
   |-----|---------|---------|------|------------|--------|
   | EX-001 | NFR-PERF-003 | 第三方依赖 | 压测环境未就绪 | Sprint 5 | Tech Lead |
   ```
3. Gate Owner 审批后，该条目从覆盖率分母中排除（与 Deferred 同等处理）
4. 每个 Sprint/迭代结束时复审豁免清单，过期未解除的豁免升级为 P0 风险

**约束**：

- 豁免比例上限：单次 Gate 豁免条目不得超过 Active FR+NFR 总数的 **10%**
- 豁免必须有明确的解除时间，不允许无限期豁免
- 所有豁免记录纳入 06. Wrap-up 复盘审计

#### AC 级覆盖缺口管理

当 AC 级覆盖率未达 100% 时（M/L 规模阈值 ≥ 90%），未覆盖的 AC 须通过以下机制进行追踪审计，避免覆盖缺口成为质量盲区：

1. **逐条记录**：在 Test Report 中列出所有未被 TC 覆盖的 AC，格式如下：
   ```markdown
   | FR ID | AC 编号 | AC 描述 | 未覆盖原因 | 风险评估 |
   |-------|---------|---------|-----------|---------|
   | FR-AUTH-001 | AC-3 | 连续失败5次锁定账户 | 依赖第三方风控系统未就绪 | 中（生产环境有人工兜底） |
   ```
2. **风险评估**：每条未覆盖 AC 须标注风险等级（高/中/低），高风险 AC 未覆盖时 Gate Owner 须额外审批
3. **复盘纳入**：所有未覆盖 AC 记录纳入 06. Wrap-up 复盘，分析是否存在系统性跳过高难度 AC 的倾向

> **说明**：Size S 规模不强制 AC 级覆盖率校验，FR 级覆盖率 = 100% 已足够。

#### 流程健康度指标

| 指标 | 公式 | 采集方式 | 目标 |
|------|------|---------|------|
| **返工率** | (Gate 驳回次数 + PR Request Changes 次数) / (Gate 触发总数 + PR 总数) × 100% | CI/CD 流水线统计 | < 10% |
| **Gate 首次通过率** | 首次触发即通过的 Gate 次数 / Gate 触发总数 × 100% | 流程引擎统计 | > 85% |
| **缺陷逃逸率** | 生产环境发现的 Bug 数 / (生产 Bug + 测试 Bug) × 100% | Bug 跟踪系统 | < 2%（S1/S2 = 0%） |

**解读**：

- **返工率**：反映上游（Specify/Design/Plan）的质量。Implement 阶段返工高，通常是 Specify 或 Design 没做好
- **Gate 首次通过率**：反映团队对准出标准的理解和执行力。低通过率意味着"碰运气"心态严重
- **缺陷逃逸率**：统计窗口为发布后 30 天；总缺陷数 < 10 时改用绝对值（生产缺陷 ≤ 1 个）；详见 UC-013 缺陷管理

### 追踪链路全景

```
01. Specify          02. Design           03. Plan          04. Implement      05. Verify
┌──────────┐     ┌──────────────┐     ┌───────────┐     ┌────────────┐    ┌──────────┐
│FR-AUTH-001│────▶│ DS-AUTH-001 │────▶│TASK-AUTH-001────▶│ PR #123    │    │TC-E2E-AUTH-001
│FR-AUTH-002│────▶│ API-AUTH-001 │────▶│TASK-AUTH-002────▶│ PR #123    │    │TC-IT-AUTH-001
│NFR-PERF-001───▶│ DS-AUTH-003 │────▶│TASK-AUTH-003────▶│ PR #124    │    │TC-IT-AUTH-002
└──────────┘     └──────────────┘     └───────────┘     └────────────┘    └──────────┘
     │                                      │                                   │
     └──────────────────────────────────────┴───────────────────────────────────┘
                              traceability-matrix.md（汇总）
```

---

## 主流程：8 个阶段（00-07）

### 00. Init（Feature 启动）

| 维度 | 内容 |
|------|------|
| **目标** | 启动 Feature，确定 Mode/Size/涉及端，创建工作空间 |
| **活动** | 读取 Constitution → 确定 Mode（N/I）→ 确定 Size（S/M/L）→ 确定涉及端 → 创建 Feature 目录 → **初始化运行态三文件** |
| **产出物** | Feature 目录结构、Feature 元数据（mode, size, platforms）、`task_plan.md` / `findings.md` / `stage-state.json`（初始化） |
| **Exit Gate** | 目录结构就绪，Mode/Size/涉及端已确认并记录 |

**Mode I 额外活动**：定位历史 Feature 产物，读取已有 spec/plan/contracts。

**Constitution（项目宪法）** 为项目级一次性产物，存放于项目根目录，包含 6 个维度：

| 维度 | 示例内容 |
|------|---------|
| 技术约束 | 语言、框架、依赖上限 |
| 质量标准 | 测试覆盖率底线、代码复杂度上限 |
| 流程约束 | API 必须先定义契约再实现 |
| 简洁性原则 | 依赖数量上限、抽象层级限制 |
| 协作规范 | PR 必须有 review、文档与代码同步 |
| 角色与职责 | 角色映射表 + RACI 矩阵 |

**角色映射表模板**（在 `constitution.md` 中维护）：

| 角色类型 | 职责 | 映射到（示例） |
|---------|------|--------------|
| PM | 需求签核、UAT 验收 | 张三 |
| Tech Lead | 设计评审、任务评审、代码 CR 终审 | 李四 |
| Architect | 架构决策评审（L 规模必须参与） | 王五 |
| QA Lead | 测试方案评审、UAT 签核 | 赵六 |
| Dev（Peer） | 代码 CR | 按任务分配 |

**RACI 矩阵模板**（在 `constitution.md` 中维护，可选）：

> R=Responsible(执行), A=Accountable(负责), C=Consulted(咨询), I=Informed(知会)

| 活动 | PM | Tech Lead | Architect | QA Lead | Dev |
|------|:--:|:---------:|:---------:|:-------:|:---:|
| Specify - 需求分析 | **A** | C | C | C | I |
| Specify - DoR Sign-off | I | **R/A** | — | C | — |
| Design - 架构设计 | I | **A** | **R** | C | C |
| Design - API 契约 | I | **R** | C | C | C |
| Plan - 任务拆解 | C | **A** | I | I | **R** |
| Implement - 开发 | I | C | — | — | **R** |
| Implement - Code CR | — | **A** | C | — | **R** |
| Verify - UAT | **R** | I | — | **A** | C |
| Wrap-up - 复盘 | C | **A** | C | C | **R** |

> RACI 矩阵为可选配置。小团队可不填，大团队按需细化。每行有且仅有一个 A。

---

### 01. Specify（需求规格化）

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

| 维度 | 内容 |
|------|------|
| **目标** | 将需求规格转化为可实现的技术方案，API 端点分配唯一 ID |
| **活动** | **Research** → 技术选型 → 架构设计 → API 契约设计（分配 API-SVC-NNN）→ 数据建模 |
| **产出物** | `research.md`, `design.md`, `contracts/`, `data-model.md`, ADR |
| **Exit Gate** | 设计评审 + Spec-Consistency-Analysis + API 覆盖率 = 100% |

**子产出物**：

1. **Research**：技术可行性调研、备选方案对比（含 Trade-off 分析）、未知项清单及解决方案、第三方依赖评估

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
- 可并行任务标记：`[P]`（展示标签，对应结构化字段 `parallel: true`）

**Checklist**：从 AC 派生的验证场景清单，作为 Implement 和 Verify 的输入。

**追踪矩阵更新**：填充 Task Ref 列，校验 Task 覆盖率。

---

### 04. Implement（规范驱动开发）

| 维度 | 内容 |
|------|------|
| **目标** | 按任务清单实现代码，确保每行代码可追溯到需求 |
| **活动** | 按 TASK 开发 → TDD → Code Review（含追踪合规审查） |
| **产出物** | 代码实现、单元测试、CR Report |
| **Exit Gate** | Code CR 通过 + 单元测试代码覆盖率 ≥ 80% + PR 合规率 = 100% |

**开发规范**：

- 每个 TASK 开发前，重读对应 FR 条目
- TDD：先写测试（基于 AC），再写实现
- 代码关键位置标注追踪引用：`// implements: TASK-AUTH-001, traces: FR-AUTH-001`
- Git Commit 格式：`[TASK-<FEAT>-NNN] 提交描述`
- PR 描述必须包含：`Implements: TASK-<FEAT>-NNN, TASK-<FEAT>-NNN`

**并行执行与隔离**：

- 标记 `[P]` 的 TASK 可并行开发，每个并行 TASK 使用独立 Git 分支
- 高风险并行任务（涉及共享模块或数据模型变更）推荐使用 Git Worktree 隔离
- 并行 TASK 合并前必须通过增量 Spec-Consistency-Analysis
- AI 辅助场景下，可通过 codeagent-wrapper 等工具实现多 Agent 并行执行

**过程记录**：

- 每个 TASK 完成后更新 `stage-state.json`，记录完成状态和关键决策
- 开发过程中的技术发现记录到 `findings.md`

**Code Review 标准**：

- 功能正确性：是否满足 AC
- 契约一致性：代码是否与 API Spec / Data Model 一致
- Constitution 合规：是否违背项目原则
- **追踪合规**：PR 是否关联了 TASK ID，TASK 是否有 FR 依据

**追踪矩阵更新**：填充 PR Ref 列。

---

### 05. Verify（验证）

| 维度 | 内容 |
|------|------|
| **目标** | 验证实现是否满足所有 AC 和 NFR，每个 TC 可追溯到需求 |
| **活动** | 测试设计（分配 TC-LVL-FEAT-NNN）→ 测试执行 → 安全扫描 → UAT |
| **产出物** | Test Report, Security Report, UAT Sign-off |
| **Exit Gate** | 全部 AC 通过 + 安全无高危 + Test 覆盖率 = 100% + TC 合规率 = 100% |

**子活动**：

1. **Test-Design**：测试用例设计
   - 每个 TC 分配 `TC-<LVL>-<FEAT>-NNN`，必须包含 `verifies: [FR-<FEAT>-NNN/AC-N]` 或 `verifies: [NFR-<DIM>-NNN]`
   - AC → Test Case 映射矩阵
   - 边界条件、异常路径覆盖
   - **NFR 测试方法矩阵**（按 NFR 维度选择对应测试方法）：

     | NFR 维度 | TC 类型 | 测试方法 | 工具示例 |
     |----------|---------|----------|----------|
     | PERF（性能） | IT (Performance) | 压测/基准测试，验证 P99 延迟、吞吐量等指标 | k6, JMeter, wrk |
     | SEC（安全） | IT (Security) | OWASP Top 10 检查 + SAST 静态扫描 + SCA 依赖扫描 | SonarQube, Snyk, OWASP ZAP |
     | REL（可靠性） | IT (Reliability) | 故障注入/混沌测试，验证降级、熔断、恢复能力 | Chaos Monkey, Litmus |
     | SCALE（可扩展性） | IT (Scalability) | 阶梯式负载测试，验证水平扩展线性度 | k6, Locust |
     | MAINT（可维护性） | ST (Static) | 代码复杂度、重复率、依赖耦合度静态分析 | SonarQube, CodeClimate |
     | AVAIL（可用性） | IT (Availability) | 故障切换/HA 验证，验证 RTO/RPO 指标 | Chaos Monkey, Gremlin, LitmusChaos |
     | OBS（可观测性） | IT (Observability) | 日志/指标/链路追踪完整性验证 | Grafana, Jaeger, OpenTelemetry |

2. **Test-Execution**：集成测试 + 回归测试 + Coverage Matrix

3. **Security-Review**（按 Size 分级）：

   | Size | 必须 | 推荐 | 可选 |
   |------|------|------|------|
   | S | OWASP Top 10 检查 + SCA 依赖扫描 | — | — |
   | M | OWASP Top 10 + SCA + SAST 静态扫描 | DAST 动态扫描 | — |
   | L | OWASP Top 10 + SCA + SAST + DAST | 渗透测试（Pentest） | 威胁建模（Threat Modeling） |

   > **安全风险叠加规则**：当 Feature 存在 `NFR-SEC-*` 类型的非功能需求时，无论 Size 大小，SAST 静态扫描为**必须项**。即 Size S + NFR-SEC 场景下，安全测试要求上浮为"OWASP Top 10 + SCA + SAST"。Size 决定基线，安全风险决定上浮。

4. **UAT**：基于 AC 的端到端验收，UAT Sign-off 作为本阶段 Exit Gate

**Mode I 额外活动**：回归验证 → 产出 `regression-report.md`。

**追踪矩阵更新**：填充 Test Case Ref 列，校验 Test 覆盖率。

---

### 06. Wrap-up（收尾）

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
| 01 Specify | `traceability-matrix.md` | 所有行 Status 为 🎯 Accepted 或 🚫 Cancelled |
| 02 Design | `design.md` | 与最终实现对齐 |
| 02 Design | `contracts/*.yaml` | 与实际 API 签名一致 |
| 02 Design | `data-model.md` | 与实际 Schema 一致 |
| 02 Design | `adr/*.adr.md` | 决策记录完整 |
| 03 Plan | `tasks.md` | 所有 Task 状态已闭合 |
| 04 Implement | 代码 + 单元测试 | CR 通过，代码覆盖率 ≥ 80% |
| 05 Verify | `tests/*.test.md` | 测试用例已归档 |
| 05 Verify | `reports/test-report.md` | 测试执行报告已归档 |
| 05 Verify | `reports/security-scan.md` | 安全扫描报告已归档 |
| 05 Verify | `reports/uat-signoff.md` | 验收签核记录已归档 |
| 横切 C | `rfc/*.rfc.md` | 所有变更请求已闭合 |
| 06 Wrap-up | `retro.md` | 复盘完成，Action Items 已提炼 |
| 全阶段 | `task_plan.md` | 规划记录完整，与 tasks.md 一致 |
| 全阶段 | `findings.md` | 过程发现已归档 |
| 全阶段 | `stage-state.json` | 进度记录完整，所有阶段有连续记录 |

**完成后** → 进入 07. Release 阶段

---

### 07. Release（发布）

| 维度 | 内容 |
|------|------|
| **目标** | 将已验收的 Feature 安全、可控地发布到生产环境，确保可回滚 |
| **活动** | 构建 → 部署 → 发布后验证（Smoke Test）→ 监控观察 |
| **产出物** | Release Note, 部署记录, 发布后验证报告 |
| **Exit Gate** | Smoke Test 通过 + 核心指标无异常 + 回滚方案就绪 → **Gate Owner: A2 Tech Lead + Ops** |

**前置条件**：
1. 06. Wrap-up Exit Gate 已通过
2. 所有归档文件已就绪

**主流程**：

| 步骤 | Actor | 动作 | 产出物 |
|------|-------|------|--------|
| 1 | A2/Ops | 构建制品：基于已通过 CR 的代码分支执行 CI 构建 | 构建产物（Docker Image / JAR / Bundle） |
| 2 | A2/Ops | 编写 Release Note：变更摘要 + 关联 FR/TASK ID | `release-note.md` |
| 3 | Ops | 部署到 Staging 环境，执行 Smoke Test | Smoke Test 报告 |
| 4 | A2 | Staging 验证通过后，审批生产发布 | 发布审批记录 |
| 5 | Ops | 执行生产部署（按部署策略） | 部署记录 |
| 6 | Ops | 发布后验证：核心接口 Smoke Test + 监控指标观察 | 发布后验证报告 |
| 7 | A2 | 确认发布成功，关闭 Feature | Feature 状态更新 |

**部署策略**（按 Size 裁剪）：

| Size | 推荐策略 | 说明 |
|------|---------|------|
| S | 直接部署（Rolling Update） | 低风险，快速上线 |
| M | 蓝绿部署（Blue-Green） | 支持快速切换回滚 |
| L | 金丝雀发布（Canary） | 灰度放量，逐步验证 |

**回滚方案**：

1. **回滚触发条件**：Smoke Test 失败 / 核心指标异常（错误率 > 1%、P99 延迟劣化 > 50%）/ S1 级缺陷
2. **回滚执行**：切换到上一稳定版本（蓝绿切换 / 金丝雀回退 / Rolling Rollback）
3. **回滚后动作**：触发 UC-013 缺陷管理流程，记录根因，更新追踪矩阵

**发布后观察窗口**：

| Size | 观察时长 | 监控重点 |
|------|---------|---------|
| S | 30 分钟 | 错误率、核心接口响应时间 |
| M | 2 小时 | 错误率、P99 延迟、业务指标 |
| L | 24 小时 | 全量监控指标 + 业务漏斗转化率 |

**验收标准**：
- [ ] 构建产物可追溯到具体 commit 和 TASK ID
- [ ] Release Note 包含所有关联 FR/TASK 变更摘要
- [ ] Smoke Test 通过（Staging + Production）
- [ ] 回滚方案已验证可执行
- [ ] 观察窗口内核心指标无异常

---

## 横切机制：3 个贯穿全流程的能力

### A. Quality Gate（质量门禁）

> Review 不是独立节点，而是每个阶段的准出条件。Gate 中嵌入追踪覆盖率校验，补回 Gate Owner。

| 阶段 | Gate 内容 | 追踪校验项 | Gate Owner |
|------|----------|-----------|------------|
| 00. Init | 目录就绪，Mode/Size/端已确认 | — | Tech Lead |
| 01. Specify | DoR Sign-off，无歧义标记 | 所有 FR/NFR 已分配 ID | Tech Lead |
| 02. Design | 设计评审 + Baseline Locking | API 覆盖率 = 100% | Tech Lead / Architect |
| 03. Plan | 任务评审 | Task 覆盖率 = 100%，Task 合规率 = 100% | Tech Lead |
| 04. Implement | Code CR + 代码覆盖率 ≥ 80% | PR 合规率 = 100% | Tech Lead / Peer |
| 05. Verify | UAT Sign-off + 安全无高危 | Test 覆盖率 = 100%，TC 合规率 = 100% | QA Lead + PM |
| 06. Wrap-up | 文档完整性 + 归档清单 | 实现覆盖率 = 100%，矩阵全 🎯 | Tech Lead |
| 07. Release | Smoke Test + 核心指标无异常 | 回滚方案就绪，观察窗口通过 | Tech Lead + Ops |

**执行原则**：

- Gate 未通过，不得进入下一阶段
- Gate 结果记录在对应阶段的产出物中
- **Gate 与 SCA 的关系**：Quality Gate 的"追踪校验项"通过调用 Spec-Consistency-Analysis（横切机制 B）执行，两者是调用关系而非独立并行
- Gate Owner 负责最终放行决策；角色到人的映射见 `constitution.md`

**Hook 化 Gate 自动执行**（双层体系）：

Gate 校验通过双层 Hook 体系实现自动阻断，确保 AI 辅助和纯人工场景均可运行：

**Layer A — AI Runtime Hook**（Claude Code Hooks，仅 AI 辅助场景）：

| Hook 类型 | 触发时机 | Gate 校验内容 | 阻断行为 |
|----------|---------|-------------|---------|
| PreToolUse | AI 执行写操作前 | 当前阶段 Gate 前置条件是否满足 | 条件不满足时阻止写操作 |
| PostToolUse | AI 执行写操作后 | 产出物是否符合当前阶段规范 | 不符合时提示修正 |
| Stop | AI 会话结束时 | 完成度校验（三文件 + 追踪产物同步） | 输出完成度报告 |

**Layer B — Git/CI Hook**（所有场景均生效）：

| Hook 类型 | 触发时机 | Gate 校验内容 | 阻断行为 |
|----------|---------|-------------|---------|
| commit-msg | Git 提交时 | Commit message 含合法 ID 标签（阶段感知，见 UC-010） | 格式不符时拒绝提交 |
| pre-push | Git 推送前 | 增量 Spec-Consistency-Analysis | 不一致时拒绝推送 |
| CI Pipeline | PR 创建/更新时 | 全量一致性校验 + 追踪覆盖率 | 不通过时阻止合并 |

> **纯人工场景适配**：Layer A 不存在时，所有 Gate 校验由 Layer B 承载。每个 Gate 校验项必须在 Layer B 中有对应实现，Layer A 仅作为实时反馈的增强层。

**执行层次**：Hook 自动校验（Layer A 实时 + Layer B 提交时） → 不通过则阻断 → Gate Owner 人工终审放行。Hook 是 Gate 的"自动化执行层"，不替代人工审核。

---

### B. Spec-Consistency-Analysis（规范一致性校验）

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

**定位**：任何阶段均可触发的变更处理机制。

| 触发条件 | 动作 | 基于 ID 的影响定位 |
|---------|------|-------------------|
| 需求变更 | RFC → Impact Analysis → Spec 更新 | 通过 FR-FEAT-NNN 追踪链定位受影响的 TASK/TC/API/PR |
| 设计变更 | ADR 更新 → 下游产物同步 | 通过 API-SVC-NNN 定位受影响的 TASK 和 TC |
| 实现偏差 | 评估是否需要更新 Spec | 通过 TASK-FEAT-NNN 反向追溯到 FR |
| Constitution 变更 | 全流程影响评估 | 所有产物重新校验 |

**变更分级**：

| 级别 | 定义 | 审批要求 | 流程 |
|------|------|---------|------|
| **Minor** | 影响 ≤2 个产物，且不需要重新触发已通过的 Gate | Tech Lead 审批 | 快速通道：直接修改 + 触发增量校验 |
| **Major** | 影响 3-5 个产物，或需要重新触发已通过的 Gate | Tech Lead + PM 审批 | 标准流程：RFC → Impact Analysis → 执行 |
| **Critical** | 涉及 Constitution 或架构变更 | Tech Lead + PM + Architect 审批 | 完整流程：RFC → 全量 Impact Analysis → 评审会 → 执行 |

**判定规则**：两个维度取较高级别。

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

每个端在 8 个阶段（00-07）中可定义 3 类扩展：**Entry Criteria**（准入条件）、**Deliverables**（额外产出物）、**Exit Gate Items**（额外检查项）。

各端维护独立的 `platform-rules/<platform>-rules.md`，Feature 启动时按涉及端动态合并。

**端规则标准 Schema**（每个 `<platform>-rules.md` 必须遵循）：

```yaml
# platform-rules/<platform>-rules.md
platform: APP          # 端标识（APP/PC/H5/Backend）
version: "1.0"
maintainer: "<Tech Lead Name>"

stages:
  "01_specify":
    entry_criteria: []       # 额外准入条件
    deliverables: []         # 额外产出物
    exit_gate_items: []      # 额外检查项
  "02_design":
    entry_criteria: []
    deliverables:
      - "UI 适配方案（多分辨率）"
    exit_gate_items:
      - "性能预算评审通过"
  # ... 其余阶段同结构
```

**冲突解决机制**（多端规则合并时）：

| 冲突类型 | 解决规则 | 示例 |
|---------|---------|------|
| 同一阶段同类规则重复 | 取并集（全部保留） | APP 和 H5 都要求"兼容性测试" → 两条均保留 |
| 阈值类规则冲突 | 取严格值（较高标准） | APP 要求 P99<100ms，Backend 要求 P99<200ms → 各端各自适用 |
| 互斥规则 | 由 Tech Lead 在 Init 阶段裁定，记录到 `constitution.md` | — |

**优先级**：Layer 0（全局）< Layer 1（Size/Mode）< Layer 2（端特有）。当 Layer 2 与 Layer 0/1 冲突时，Layer 2 优先，但必须在端规则文件中标注 `overrides: "<被覆盖规则描述>"`。

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
| 过程规划 | `task_plan.md` | 运行态三文件之一 |
| 过程发现 | `findings.md` | 运行态三文件之一 |
| 过程进度 | `stage-state.json` | 运行态三文件之一 |

### Feature 目录命名规范（手动输入）

`spec-first init feature <feature-name>` 中的 `<feature-name>` 统一采用：

`<飞书需求ID>-<需求名称>`

约束：

1. 飞书需求 ID 保持原样（建议全大写，允许字母/数字/连字符）。
2. 需求名称支持中文、英文字母、数字，允许使用 `-` 连接，不建议空格。
3. 完整目录名示例：`FSREQ-000000-数字货币项目`、`FSREQ-123456-user-auth-login`。

### 目录结构

```
project-root/
├── constitution.md                    # 项目级：项目宪法
├── .spec-first/                       # 运行态元数据目录
│   ├── .baseline                      # baseline commit SHA（Init 内联校验写入）
│   └── ai-stats.jsonl                 # AI 编码统计（Stop Hook 追加写入）
├── platform-rules/                    # 项目级：各端规范（Layer 2）
│   ├── app-rules.md
│   ├── pc-rules.md
│   ├── h5-rules.md
│   └── backend-rules.md
│
└── specs/                             # Feature 级产物根目录
    ├── .feat-registry.md              # FEAT 缩写注册表（全局唯一性治理）
    ├── cross-feature-deps.md          # 跨 Feature 依赖登记
    ├── known-exceptions.md            # 已知豁免清单（Known Exception List）
    └── <feishu-demand-id>-<feature-name>/   # 例如 FSREQ-000000-数字货币项目
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
        ├── task_plan.md               # 过程规划（运行态三文件）
        ├── findings.md                # 过程发现（运行态三文件）
        └── stage-state.json                # 过程进度（运行态三文件）
```

---

## 流程裁剪指南

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

### Mode I 额外产出物深度

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
| 01. Specify | `SPECIFYING` | Init 内联校验通过 |
| 02. Design | `DESIGNING` | DoR Sign-off |
| 03. Plan | `PLANNING` | Design Review 通过 |
| 04. Implement | `IN_PROGRESS` | Task Review 通过 |
| 05. Verify | `IN_TESTING` | Code CR 通过 |
| 06. Wrap-up | `WRAPPING_UP` | UAT Sign-off |
| 07. Release | `RELEASING` | 文档完整性检查通过 |
| 完成 | `DONE` | 发布成功 + 观察窗口通过 |

**集成方式**（按团队成熟度选择）：

| 方式 | 适用场景 | 实现路径 |
|------|---------|---------|
| **手动同步** | MVP 阶段 / 小团队 | Gate 通过后由 PM 手动流转 Jira Status |
| **半自动（Webhook）** | 增强阶段 | Git Hook 或 CI Pipeline 通过后调用 Jira REST API 自动流转，失败时降级为手动 |
| **全自动（双向同步）** | 全量阶段 | Jira Automation Rule 监听 Status 变更 → 触发 Gate 校验；Gate 通过 → 回写 Jira Status |

**Jira 自动化集成要点**：

- **API 调用**：使用 Jira REST API v3 `POST /rest/api/3/issue/{issueKey}/transitions`
- **状态机约束**：Jira Workflow 需预配置上述 9 个 Status 及合法流转路径
- **失败处理**：API 调用失败时记录到 `findings.md`，不阻塞开发流程
- **权限**：使用 Service Account Token，最小权限原则（仅 Transition Issue）

| Hook | 触发时机 | 校验内容 |
|------|---------|---------|
| commit-msg | 提交信息写入后 | Commit message 包含合法 ID 标签（阶段感知，见 UC-010） |
| Pre-push | 推送前 | Spec-Consistency-Analysis（增量） |
| CI Pipeline | PR 创建时 | 全量一致性校验 + 追踪覆盖率 |

### 追踪体系工具化支撑

| 校验项 | 自动化方式 | 触发时机 |
|--------|-----------|---------|
| ID 格式校验 | Regex lint | Pre-commit |
| TASK traces 完整性 | 脚本扫描 tasks.md 中无 traces 的 TASK | ★ Gate 2 |
| TC verifies 完整性 | 脚本扫描 tests/ 中无 verifies 的 TC | ★ Gate 3 |
| 正向覆盖率计算 | 脚本对比 spec.md FR 集合 vs tasks.md traces 集合 | ★ Gate 2 / Gate 3 |
| 反向合规率计算 | 脚本对比 tasks.md TASK 集合 vs traces 非空集合 | ★ Gate 2 |
| PR 关联校验 | CI 检查 PR description 是否包含 TASK ID | PR 创建时 |
| Commit message 校验 | Git hook 检查合法 ID 标签格式（阶段感知） | commit-msg |

### AI 编码统计（Claude Code Hooks）

**Hook 类型**：Claude Code `Stop` hook（AI 会话结束时触发）

**统计维度**：

| 类别 | 指标 | 采集方式 |
|------|------|---------|
| 代码变更 | 文件数、`+additions` / `-deletions` | `git diff HEAD --numstat` |
| 文档变更 | `.md` 文件数、`+additions` / `-deletions` | `git diff HEAD --numstat` 过滤 `*.md` |
| 新建文件 | 文件数、总行数 | `git diff HEAD --numstat --diff-filter=A` |

**分支命名规范**（AI 统计的前置依赖）：

```
feature/<FR-ID>-<description>
示例：feature/FR-AUTH-001-user-login
```

**统计记录格式**（JSONL，追加到 `.spec-first/ai-stats.jsonl`）：

```json
{"session":"abc123","ts":"2026-02-06T14:30:00Z","developer":"Leo","requirement":"FR-AUTH-001","branch":"feature/FR-AUTH-001-user-login","phase":"04-implement","code":{"files":5,"additions":127,"deletions":34},"docs":{"files":2,"additions":89,"deletions":12}}
```

### 会话恢复机制 — Session Catchup

> AI 辅助开发中，会话中断是常态。恢复后必须同步追踪产物。

**触发条件**：`/clear` 命令、上下文窗口截断、IDE 重启或网络中断后重连。

**恢复流程**：

```text
会话恢复触发
  → 读取 task_plan.md（当前规划状态）
  → 读取 stage-state.json（已完成进度）
  → 读取 findings.md（已有发现）
  → 读取 traceability-matrix.md（追踪状态）
  → 定位当前阶段和当前 TASK
  → 输出恢复摘要到终端
  → 继续执行
```

**恢复后强制校验**：

- 三文件与实际产出物是否一致
- 追踪矩阵是否与最新代码同步
- 不一致项必须在恢复后立即修正

---

## AI 协作编排规范

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
    id: "FSREQ-123456-user-auth"
    title: "用户认证模块"
    mode: N            # N=新建 / I=迭代
    size: S            # S/M/L
    platforms: [H5, Backend]
  artifacts:
    spec: "specs/FSREQ-123456-user-auth/spec.md"
    design: "specs/FSREQ-123456-user-auth/design.md"
    tasks: "specs/FSREQ-123456-user-auth/tasks.md"
    matrix: "specs/FSREQ-123456-user-auth/traceability-matrix.md"
    task_plan: "specs/FSREQ-123456-user-auth/task_plan.md"
    progress: "specs/FSREQ-123456-user-auth/stage-state.json"
    findings: "specs/FSREQ-123456-user-auth/findings.md"
  constitution: "constitution.md"
  current_phase: "04-implement"
  current_task: "TASK-AUTH-001"
```

**强制约束**：

- 每次 Agent 委派必须生成 Context Pack，禁止口头传递上下文
- Context Pack 中的 `artifacts` 路径必须指向实际存在的文件
- `current_phase` 和 `current_task` 必须与 `stage-state.json` 记录一致

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

**运行态三文件并发写入保护**：

并行 Agent 同时操作 `task_plan.md` / `findings.md` / `stage-state.json` 时，采用 **append-only + 合并** 策略：

| 策略 | 说明 |
|------|------|
| **Append-Only 写入** | 并行 Agent 只追加内容，不修改已有行。每条追加记录包含 `[TASK-FEAT-NNN]` 前缀标识来源 |
| **时间戳排序** | 每条追加记录附带 ISO 8601 时间戳，合并时按时间排序 |
| **合并窗口** | 并行 TASK 全部完成后，由主 Agent 执行一次合并整理，消除重复、解决冲突 |
| **冲突检测** | 若两个 Agent 修改了同一行（非追加），合并时标记 `[CONFLICT]` 由人工裁决 |

**追踪矩阵并发更新策略**：

并行 Worktree 中各 Agent 独立更新追踪矩阵的各自行，合并时需特殊处理：

| 场景 | 策略 |
|------|------|
| 各 TASK 对应不同 FR 行 | 直接合并，无冲突（各改各的行） |
| 多个 TASK 对应同一 FR 行 | 最后完成的 TASK 负责合并该行的 Task Ref / PR Ref 列 |
| Status 列更新 | 以最低状态为准（如一个 TASK 已 Verified 但另一个仍 Implemented，则保持 Implemented） |

**合并流程**：并行 TASK 全部完成 → 主分支执行 `git merge` → 若矩阵冲突则由 Tech Lead 手动合并 → 运行覆盖率校验脚本确认一致性。

---

## 度量与运营体系

> v5 新增。将 v4.2 分散在各章节的度量指标整合为统一的运营闭环，支撑持续改进。

### 度量指标全景

| 类别 | 指标 | 公式/定义 | 采集方式 | 目标 |
|------|------|----------|---------|------|
| **需求覆盖** | Task 覆盖率 | Active FR∪NFR with ≥1 TASK / Active FR+NFR | 脚本自动计算 | = 100% |
| **需求覆盖** | Test 覆盖率 | Active FR∪NFR with ≥1 TC / Active FR+NFR | 脚本自动计算 | = 100% |
| **需求覆盖** | 实现覆盖率 | Active FR∪NFR with ≥1 PR / Active FR+NFR | 脚本自动计算 | = 100% |
| **实现合规** | Task 合规率 | TASK with ≥1 FR/NFR ref / Total TASK | 脚本自动计算 | = 100% |
| **实现合规** | PR 合规率 | PR with ≥1 TASK ref / Total PR | CI 自动校验 | = 100% |
| **实现合规** | 孤儿项率 | 未关联产物数 / 全部产物数 | 脚本自动计算 | = 0% |
| **流程健康** | 返工率 | (Gate 驳回 + PR Changes) / 总触发数 | CI 统计 | < 10% |
| **流程健康** | Gate 首次通过率 | 首次通过 Gate 数 / Gate 总数 | 流程引擎 | > 85% |
| **流程健康** | 缺陷逃逸率 | 生产 Bug / (生产 Bug + 测试 Bug) | Bug 系统 | < 2% |
| **AI 效能** | AI 代码生成量 | 代码 additions + deletions | Stop Hook | 持续采集 |
| **AI 效能** | AI 文档生成量 | .md 文件 additions + deletions | Stop Hook | 持续采集 |
| **AI 效能** | 会话恢复成功率 | 成功恢复次数 / 恢复触发次数 | Session Catchup | > 95% |

### 运营闭环

```
采集 → 分析 → 改进 → 验证
  │       │       │       │
  │       │       │       └── 下一个 Feature 验证改进效果
  │       │       └── 调整流程裁剪深度 / Gate 检查项
  │       └── 识别瓶颈阶段（返工率最高的阶段）
  └── 每个 Feature 完成后自动汇总度量数据
```

**运营节奏**：

| 频率 | 活动 | 参与者 |
|------|------|--------|
| 每个 Feature | 度量数据自动采集 + Wrap-up 复盘 | Tech Lead + Dev |
| 每月 | 度量趋势分析 + 流程优化建议 | Tech Lead + PM |
| 每季度 | 流程裁剪深度校准 + Gate 标准调整 | 全团队 |

---

## 落地路线图（3 步）

> 从 v3 的 5 步精简为 3 步，降低推行阻力。每步有明确验收标准，验证后再推进。

### 第一步：MVP — 跑通 8 阶段 + ID 体系 + 追踪矩阵（对应 P0，3-4 周）

分两个子步骤推进，降低一次性验证风险：

#### 子步骤 1A：流程骨架验证（第 1-2 周）

用一个真实 S 规模 Feature 走完 00-06 全流程，验证阶段划分 + 产出物模板可行性。

| 动作 | 验证点 | 集成项 |
|------|-------|-------|
| 选择一个 S 规模 Feature | 覆盖所有 7 个阶段，试错成本低 | — |
| 按阶段产出标准化文档 | 产出物模板可用 | — |
| 为 FR/NFR/TASK/TC 分配 ID | ID 命名规则可执行 | — |
| 手动维护追踪矩阵 | 矩阵格式合理、维护成本可接受 | — |
| 在 ★ Gate 2 / Gate 3 试行覆盖率校验 | 能发现遗漏需求和过度实现 | — |

**1A 验收标准**：一个 Feature 从 spec 到 PR 全链路可追溯，追踪矩阵覆盖率 = 100%。

#### 子步骤 1B：运行态机制验证（第 3-4 周）

在 1A 验证通过的基础上，叠加 AI 运行态三文件 + Hook Gate + 会话恢复。

| 动作 | 验证点 | 集成项 |
|------|-------|-------|
| **初始化三文件运行态** | 每个 Feature 目录含 `task_plan.md` / `findings.md` / `stage-state.json` | P0 三文件 |
| **部署最小 Hook Gate** | Pre-commit ID 格式校验 + Stop 完成度校验可自动执行 | P0 Hook 化 Gate |
| **验证会话恢复** | `/clear` 后可通过 Session Catchup 恢复上下文 | P0 Session Catchup |

**1B 验收标准**：AI 辅助开发场景下三文件运行态可用，Hook Gate 可自动拦截不合规提交，会话恢复后上下文完整。

**超时策略**：若第 4 周结束仍未通过验收 → 召开回顾会，二选一：(A) 缩减验证范围（如仅验证 00-04 阶段），延长 1 周；(B) 暂停推行，输出《MVP 阻塞分析报告》，待阻塞项解决后重启。

### 第二步：增强 — 自动化校验 + Change-Management + AI 协作（对应 P1，3-4 周）

| 动作 | 验证点 | 集成项 |
|------|-------|-------|
| 基于 ID 体系编写校验脚本 | 脚本可稳定执行 | — |
| 在 5 个时机试运行一致性校验 | 能发现真实不一致问题 | — |
| 集成到 CI Pipeline | 自动化校验可用 | — |

**校验脚本实现路径**：

| 层次 | 技术方案 | 说明 |
|------|---------|------|
| **Markdown 解析** | 正则提取 + remark/unified AST | S 规模用正则匹配 ID 模式；M/L 规模用 remark 解析 Markdown AST 提取表格结构 |
| **YAML 解析** | js-yaml / PyYAML | M/L 规模追踪矩阵采用 YAML 格式时直接解析 |
| **校验引擎** | Node.js 脚本（`scripts/spec-check.mjs`） | 统一入口，按 Gate 阶段分模块：`check-coverage.mjs`、`check-compliance.mjs`、`check-id-format.mjs` |
| **CI 集成** | GitHub Actions / GitLab CI | 在 PR 触发时自动运行，输出校验报告为 PR Comment |
| **输出格式** | JSON + Markdown Summary | 机器可读（JSON）+ 人工可读（Markdown 摘要） |
| 定义 RFC 模板和变更分级 | 变更流程标准化 | — |
| 基于追踪矩阵做 Impact Analysis | 能自动定位受影响产物 | — |
| **定义 Context Pack 标准** | 跨 Agent 委派携带统一上下文包，可复现同等结果 | P1 Context Pack |
| **建立代理路由矩阵** | 研究/架构/实现/文档四类任务有明确 Agent 选择规则 | P1 代理路由 |
| **启用并行执行 + Worktree 隔离** | 可并行 TASK 默认并行，高风险 TASK 默认 Worktree | P1 并行执行 |

**增强验收标准**：CI Pipeline 自动阻断不合规 PR，变更分级流程可执行，跨 Agent 委派上下文零丢失。

**超时策略**：若第 4 周结束仍未通过验收 → 二选一：(A) 将未完成项降级为 P2（如并行执行），核心校验脚本先上线；(B) 延长 2 周，但必须每周输出进度报告并获 Tech Lead 确认。

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
| **度量运营闭环** | 12 项度量指标可自动采集，运营节奏可执行 | P2 度量体系 |

**全量验收标准**：多端 Feature 全流程可跑通，度量数据可自动采集并驱动流程优化。

**超时策略**：若第 8 周结束仍未通过验收 → 按端拆分推行（优先 Backend + 一个前端），未就绪的端延后至下一季度；若超过 12 周仍未全量落地，启动流程复盘，评估是否需要简化规范。

---

## 风险提醒

### ID 体系的维护成本

ID 分配和追踪矩阵维护需要额外工作量。初期手动维护，验证价值后再工具化。

**应对**：第一步只强制 FR/TASK 追踪（最小闭环），验证可行后再扩展到 API/TC/PR。

### 追踪矩阵的"形式化"风险

矩阵可能沦为"填表"而非真正的质量保障工具。

**应对**：覆盖率校验嵌入 Gate，不通过则阻塞流程——让矩阵成为"活文档"而非"死表格"。

### 完美主义陷阱

v5 内容量进一步增加（新增产品用例、度量体系），切忌一次性全量推行。

**应对**：严格按落地路线图 3 步渐进引入，每步验证后再推进。产品用例作为理解框架，不作为交付检查项。

### 流程过重风险

| 信号 | 应对 |
|------|------|
| 团队抱怨流程拖慢交付 | 简化 Gate 检查项，保留核心项 |
| 产出物沦为形式 | 减少模板字段，聚焦高价值内容 |
| 小 Feature 走完太重 | 按 Size S 裁剪，参考流程裁剪指南 |

### AI 幻觉导致规范污染（v5 新增）

AI 生成的 spec/design/tasks 中可能包含看似合理但实际错误的需求、接口或依赖关系，若未经人类审核直接进入追踪矩阵，将导致"垃圾进垃圾出"。

**应对**：
- 每个阶段切换必须有人类 Sign-off（Quality Gate 已有此设计，必须严格执行）
- AI 生成内容标记 `[AI-GENERATED]`，与人类确认内容 `[HUMAN-REVIEWED]` 区分
- 追踪矩阵中 AI 生成的链接关系需人工抽检（建议抽检率 ≥ 30%）

### 风险矩阵总览

| 风险 | 等级 | 影响 | 缓解核心 |
|------|------|------|---------|
| ID 维护成本 | 🟡中 | 额外工作量 | 最小闭环 + 渐进扩展 |
| 追踪形式化 | 🟡中 | 矩阵失效 | Gate 嵌入 + 活文档 |
| 完美主义 | 🔴高 | 交付延迟 | 3 步渐进 + 时间盒 |
| 流程过重 | 🔴高 | 团队抵触 | Size S 裁剪 + 收益驱动 |
| AI 幻觉 | 🔴高 | 规范污染 | 人类 Sign-off + 抽检 |

---

## 版本演进映射：v2 → v3 → v4 → v5

| 内容 | v2 | v3 | v4 | v5 | 变更来源 |
|------|----|----|-----|-----|---------|
| 文档定位 | 流程规范 | 流程规范 | 流程规范 | **规范驱动研发流程方法论** | v5 升级 |
| 产品愿景 | 无 | 无 | 无 | **新增** | v5 新增 |
| 角色与用户画像 | 无 | 无 | 无 | **7 角色画像** | v5 新增 |
| 产品用例 | 无 | 无 | 无 | **21 个用例** | v5 新增 |
| 度量运营体系 | 无 | 无 | 散落各处 | **12 指标 + 运营闭环** | v5 新增 |
| 流程骨架 | 7+3 | 7+3 | 7+3（不变） | 7+3（不变） | — |
| Init 边界 | 项目级/Feature 级混合 | Feature 级（修复 P0-1） | Feature 级（不变） | Feature 级（不变） | v3 修复 |
| Design Research | 无 | 新增（修复 P0-2） | 保留 | 保留 | v3 修复 |
| 一致性校验触发 | 3 个 | 5 个（修复 P0-3） | 5 个（不变） | 5 个（不变） | v3 修复 |
| Checklist | 无 | 新增（修复 P1-1） | 保留 | 保留 | v3 修复 |
| 规模分级 | 轻量模式跳过阶段 | S/M/L 调节深度（修复 P1-3） | S/M/L + 裁剪指南 | S/M/L + 裁剪指南（不变） | v3 修复 + v4 增强 |
| Constitution | 4 项 | 5 维度（优化 P2-1） | 6 维度（+角色与职责） | 6 维度（不变） | v3 优化 + v4 增强 |
| 双模式 | 无 | Mode N / Mode I | 保留 | 保留 | v3 新增 |
| 多端扩展 | 无 | Layer 2 | 保留 | 保留 | v3 新增 |
| ID 体系 | `FR-AUTH-001`（全局） | `FR-001`（Feature 内） | `FR-AUTH-001`（全局，回归 v2） | 全局（不变） | v4 回归 |
| 覆盖率算法 | 有（简版） | 有（完整版） | 保留 + 孤儿项率 | 保留（不变） | v4 补回 |
| 流程速查表 | 有 | **丢失** | **补回**（升级版） | 保留（不变） | v4 补回 |
| 角色映射+RACI | 有 | **丢失** | **补回** | 保留（不变） | v4 补回 |
| AI 编码统计 | 有 | **丢失** | **补回**（含执行流程+终端示例+前置约定） | 保留（不变） | v4 补回 |
| 变更分级 | 无 | 无 | **v4 新增** | 保留（不变） | v4 新增 |
| 流程裁剪指南 | 无 | 无 | **v4 新增** | 保留（不变） | v4 新增 |
| 适用边界 | 无 | 无 | **v4 新增** | 保留（不变） | v4 新增 |
| AI 协作编排 | 无 | 无 | **v4.2 新增** | 保留（不变） | v4.2 新增 |
| Hook 化 Gate | 无 | 无 | **v4.2 新增** | 保留（不变） | v4.2 新增 |
| Session Catchup | 无 | 无 | **v4.2 新增** | 保留（不变） | v4.2 新增 |

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

## 参考标准

| 标准 | 借鉴内容 |
|------|---------|
| **Spec-Kit** | specify/clarify/plan/analyze/tasks/implement 命令体系，Constitution，FR 编号 |
| **SpecifyPlus** | Constitution Gates，[P] 并行标记，PHR 决策溯源 |
| **Autospec** | YAML-first artifacts，tasks.yaml dependencies 字段 |
| **TypeSpec** | API-first 设计，single source of truth |
| **OpenSpec** | Token 高效的轻量规范设计，棕地迭代模式 |
| **Specmatic** | 契约驱动测试，API 向后兼容性验证，MCP 集成 |
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
| `spec-first-v4.md` | v4.2 文档（历史参考） | 归档 |

---

**作者**: Leo (况雨平)
**文档版本**: v5.0
**创建日期**: 2026-02-08
**基于版本**: v4.2 + SDD 业界对标分析 + 产品用例体系
**关联文档**: dual-mode-design.md, review-spec-first-v2.md, spec-first-v4-优先集成清单.md, sdd-benchmark-analysis.md
