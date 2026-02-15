# Spec-First 研发流程规范 v7.1

> **版本**: v7.1 | **更新**: 2026-02-09 | **作用域**: Feature 级别
> **参考标准**: Spec-Kit、Autospec、SpecifyPlus、TypeSpec、ISO/IEC 12207、V-Model、SAFe、CMMI REQM
> **核心理念**: 规范即契约、规范即真理、全链路可追踪
> **基于**: v6.0（CLI + Skill 协同基线）+ skill-requirements-v2（Skill 指令体系）

> ⚠️ **文档状态声明**
> 本文档为 **As-Is + To-Be 混合版**。能力项标注状态如下：
> - ✅ `Implemented` — 已实现，可直接使用
> - 🔧 `Partial` — 部分实现，存在已知缺口
> - 📋 `Planned` — 规划中，尚未落地
>
> **执行基线以 As-Is 为准**，To-Be 内容仅作为架构蓝图参考。

---

## 目录

- [v7.1 变更摘要](#v71-变更摘要)
- [产品愿景与定位](#产品愿景与定位)
- [角色与用户画像](#角色与用户画像)
- [核心架构](#核心架构)
- [全链路追踪体系](#全链路追踪体系)
- [主流程：8 主阶段（00-07）+ 2 终态（08-09）](#主流程8-主阶段00-07--2-终态08-09)
- [横切机制：3 个贯穿全流程的能力](#横切机制3-个贯穿全流程的能力)
- [Skill 指令体系](#skill-指令体系)
- [CLI 命令体系](#cli-命令体系)
- [多端扩展（Layer 2）](#多端扩展layer-2)
- [产出物标准化](#产出物标准化)
- [度量与运营体系](#度量与运营体系)
- [落地路线图](#落地路线图)
- [风险提醒](#风险提醒)
- [版本演进映射](#版本演进映射v2--v5--v7)

---

## v7.1 变更摘要

> v7.1 在 v6.0 协同基线之上进行架构升级，核心定位：**Skill 驱动整个流程，CLI 提供底层原子能力**。

### 主权定义（v6 冻结继承）

| 层 | 主权 | 说明 |
|---|------|------|
| **Skill 层** | 流程编排与触发 | 所有阶段流转由 Skill 命令触发和编排，决定"何时做什么" |
| **CLI 层** | 原子执行与持久化 | 执行具体的状态变更、ID 注册、Gate 校验等确定性操作 |
| **人** | 决策与签核 | 目标确认、取舍判断、质量签核 |

> Skill 是"指挥官"，CLI 是"执行者"，人是"决策者"。

### 变更总览

| 变更类型 | 内容 | 价值 |
|---------|------|------|
| **架构升级** | 双层架构：Skill 驱动编排 + CLI 确定性执行 | Skill 负责流程推进，CLI 保证可回放 |
| **新增** | Skill 指令体系：8 个 Skill 定义、5 阶段执行模型、跨平台兼容 | 回答"AI 怎么协作" |
| **新增** | CLI 命令体系：10 个命令组、7 个核心模块（M1-M7） | 回答"工具怎么用" |
| **重构** | 主流程 8+2 阶段与 Skill/CLI 的映射关系 | 每个阶段有明确的工具支撑 |
| **精简** | 产品用例体系从 21 个详述精简为用例清单 + 关键用例详述 | 降低文档维护成本 |
| **继承** | v6.0 全部冻结决策 + v5.0 核心能力（三层体系、双模式、追踪矩阵、覆盖率算法、Gate、SCA、变更管理、度量体系） | 基线一致性 |

---

## 产品愿景与定位

### 一句话定位

**Spec-First 是面向 AI 时代的规范驱动研发流程引擎**——以结构化规范为单一真理源，通过全链路追踪 + AI 辅助 + 自动化门禁，将"需求→设计→编码→测试→交付"从人工驱动升级为规范驱动。

### 要解决的核心问题

> 以下 11 个问题覆盖 5 个问题域，是 Spec-First 立项的核心驱动力。

**A. AI 能力治理（2 项）**

| # | 问题 | 现状痛点 | Spec-First 解法 |
|---|------|---------|----------------|
| 1 | **AI 使用能力参差不齐** | 80+ 人团队中约 20% 能熟练使用 AI（效率提升 40%+），剩余 80% 要么不用、要么引入更多 bug；团队内部效率差异达 3-5 倍 | **Skill 指令体系**（8 个标准化 Skill）统一 AI 协作入口，开发者无需自己写 prompt，将个人能力差异收敛为流程标准化 |
| 2 | **团队 AI 使用缺乏标准化** | 5+ 种 AI 使用模式并存，prompt 复用率不足 10%，新人 AI 上手周期 2-4 周，最佳实践无法跨团队传播 | **Skill 指令 + Context Pack**：Skill 封装经过验证的最佳 prompt 和执行流程，Context Pack 自动注入项目上下文，实现"一个指令、统一体验" |

**B. 研发质量（3 项）**

| # | 问题 | 现状痛点 | Spec-First 解法 |
|---|------|---------|----------------|
| 3 | **AI 生成代码质量不可控** | AI 代码三类问题：幻觉（调用不存在的 API）、安全漏洞（SQL 注入、硬编码密钥）、不符合团队规范；AI 生成代码缺陷密度约为人工的 1.5-2 倍 | **三层规范体系 + Gate 自动校验 + Hook 拦截**：生成前 Context Pack 注入编码规范和接口契约，生成后 Git Hook 自动校验，不合规代码无法提交 |
| 4 | **AI 产出物无法追溯** | PR 中 AI 生成代码占比达 30-50%，但仅 5% 的团队有追踪标记；AI 相关缺陷根因定位时间比普通缺陷多 40% | **AI 产出物强制携带 traces + 反向合规率检测**：每个 AI 生成的产物必须携带 `traces: [FR-xxx]`，追踪矩阵自动记录 AI 参与度 |
| 5 | **流程形式化，Gate 检查靠人工** | Gate 人工检查遗漏率约 30-50%；设计阶段遗漏到测试阶段才发现，修复成本放大 5-10 倍 | **Hook 化 Gate 自动阻断 + 覆盖率量化**：4 个 Gate 内置自动化校验条件，不达标自动阻断，让规范成为"活契约" |

**C. 研发效率（2 项）**

| # | 问题 | 现状痛点 | Spec-First 解法 |
|---|------|---------|----------------|
| 6 | **需求到代码的断裂** | AI 不理解业务上下文，因上下文缺失导致的无效生成占 AI 总产出的 30%+；需求理解偏差导致的返工占总返工量的 35-45% | **FR/NFR 结构化 + Context Pack 自动注入**：需求以结构化 spec.md 定义（含 AC），AI 执行 Skill 时自动加载对应 FR 的完整上下文 |
| 7 | **需求失真与过度实现** | 需求失真导致的返工成本占项目总成本 15-25%；过度实现代码占比约 10-20%，长期维护成本是开发成本的 3-5 倍 | **反向合规率 + 孤儿项率自动检测**：每个 TASK/TC/PR 必须 traces 到 FR，系统自动检测无需求依据的"孤儿"产物并告警 |

**D. 全流程 AI 融合（3 项）**

| # | 问题 | 现状痛点 | Spec-First 解法 |
|---|------|---------|----------------|
| 8 | **AI 上下文丢失与会话断裂** | 长会话（>20 轮）后 AI 输出质量下降约 30%；会话中断后恢复上下文平均耗时 15-30 分钟；上下文重建占总 AI 交互时间的 20-30% | **Session Catchup + Context Pack 持久化**：会话恢复时 Skill 自动加载 Context Pack，AI 在 30 秒内恢复完整上下文 |
| 9 | **变更管理中 AI 角色缺失** | 需求变更后下游产物未同步更新的比例高达 50-70%；变更引发的回归缺陷占总缺陷的 20-30% | **三级变更管理 + ID 链自动影响分析**：RFC 流程中系统自动通过 traces 链定位所有受影响产物，AI 辅助生成更新建议 |
| 10 | **研发全流程 AI 融合不足** | AI 在编码环节渗透率约 60-70%，但在需求/设计/测试/发布环节不足 15%；全流程 AI 覆盖率仅 20-30% | **8 阶段全覆盖的 Skill 指令体系**：从初始化到发布，每个阶段都有对应 Skill，AI 执行工时占比目标达 45% |

**E. 知识管理（1 项）**

| # | 问题 | 现状痛点 | Spec-First 解法 |
|---|------|---------|----------------|
| 11 | **AI 辅助过程中知识沉淀缺失** | 技术决策复用率不足 15%；同类问题在不同团队重复调研比例约 40%；新人理解历史决策平均耗时 2-5 天/个 | **结构化产出物模板 + 追踪矩阵**：每个阶段产出物有标准化模板，决策过程、方案对比作为必填字段沉淀，追踪矩阵记录完整决策链路 |

**问题总结**：上述 11 个问题的共性根因归结为三点——**AI 协作无标准**（个人各自为战，能力参差、流程混乱）、**规范与实现脱节**（需求/设计/代码/测试之间缺乏结构化追踪链路）、**过程知识不沉淀**（AI 辅助过程中的决策和产出物散落在聊天记录中）。Spec-First 的整体解决思路：以结构化规范为单一真理源，通过 Skill 指令体系统一 AI 协作入口，通过全链路 ID 追踪 + Gate 自动校验确保规范一致性，通过 Context Pack + Session Catchup 解决上下文断裂，实现从"人驱动 AI"到"规范驱动 AI"的范式升级。

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
| 流程定义 | 8 主阶段（00-07）+ 2 终态（08_done / 09_cancelled）、Gate、横切机制 | 项目管理（排期、资源分配） |
| 规范标准 | 产出物模板、ID 体系、追踪矩阵 | 具体业务领域建模 |
| 工具实现 | CLI 工具链（10 命令）+ Skill 指令体系（8 个 Skill） | IDE 插件、Jira 深度定制 |
| AI 协作 | Skill 执行模型、Context Pack、Session Catchup | AI 模型训练、私有化部署 |
| 度量体系 | 覆盖率、合规率、返工率、Gate 通过率 | 人效评估、绩效考核 |

### 与外部系统关系

```
┌──────────────────────────────────────────────────────────────────┐
│                      Spec-First v7.1                              │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    Skill 指令层（AI 推理）                     │  │
│  │  8 个 .md Skill 文件 → Claude Code / Codex CLI 加载执行      │  │
│  └──────────────────────────┬──────────────────────────────────┘  │
│                              │ 调用                                │
│  ┌──────────────────────────▼──────────────────────────────────┐  │
│  │                    CLI 确定性层（TypeScript）                  │  │
│  │  ┌───────────┐ ┌──────────┐ ┌───────────────────┐          │  │
│  │  │ 流程引擎   │ │ 追踪引擎  │ │ 质量门禁引擎       │          │  │
│  │  │ M1        │ │ M2       │ │ M3               │          │  │
│  │  └─────┬─────┘ └────┬─────┘ └────────┬──────────┘          │  │
│  │  ┌─────┴─────┐ ┌────┴─────┐ ┌────────┴──────────┐          │  │
│  │  │ 变更管理   │ │ AI 编排   │ │ 度量引擎           │          │  │
│  │  │ M4        │ │ M5       │ │ M6               │          │  │
│  │  └───────────┘ └──────────┘ └───────────────────┘          │  │
│  │                 ┌──────────┐                                │  │
│  │                 │ 工具集成   │                                │  │
│  │                 │ M7       │                                │  │
│  │                 └──────────┘                                │  │
│  └─────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│                          对接层                                    │
│  ┌─────────┐  ┌──────────┐  ┌──────────────────┐                │
│  │  Jira   │  │ Git/CI   │  │ Claude Code /    │                │
│  │ Status  │  │ Hook +   │  │ Codex CLI        │                │
│  │ 映射    │  │ Pipeline │  │ Skill 宿主       │                │
│  └─────────┘  └──────────┘  └──────────────────┘                │
└──────────────────────────────────────────────────────────────────┘
```

### 流程适用边界

**适用场景**：

- 需要多人协作的 Feature 开发（≥2 人参与）
- 涉及 API 变更、数据模型变更的功能
- 跨团队依赖的功能开发
- 需要长期维护和追溯的核心业务功能

**不适用场景**：

| 场景 | 替代方案 |
|------|---------|
| 紧急 Hotfix（线上故障修复） | 直接修复 → 事后补 RFC |
| 纯配置变更（环境变量、开关） | 走 DevOps 变更流程 |
| 文档修正（非规范文档） | 直接 PR |
| 技术债务清理（无功能变更） | 简化为 Init → Plan → Implement → Verify |
| 单人 1 天内可完成的微调 | 简化为 Specify → Implement → Verify |

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
| **A6** | AI Agent（AI 辅助代理） | 系统 | 通过 Skill 指令执行规范生成、代码辅助、自动校验 | 01-06 全阶段（辅助） |
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
| **使用频率** | 01 Specify 阶段评审 AC 可测试性（Consulted）；05 Verify 阶段全程主导 |
| **技术水平** | 需要理解 TC ID 规则、verifies 引用、覆盖率算法 |

#### A5: Architect（架构师）

| 维度 | 描述 |
|------|------|
| **日常工作** | 架构评审、技术选型、ADR 编写、跨模块设计协调 |
| **核心痛点** | ① 架构决策缺乏结构化记录 ② 设计方案与需求脱节 ③ L 规模项目缺乏系统性评审机制 |
| **期望收益** | DS ID 使设计章节可追踪；ADR 强制记录决策理由；Design Review Gate 确保架构质量 |
| **使用频率** | 02 Design 阶段深度参与（L 规模必须参与）；其他阶段按需咨询 |
| **技术水平** | 需要理解 DS/API/ADR ID 规则、Design Review Gate 标准 |

#### A6: AI Agent（AI 辅助代理）

| 维度 | 描述 |
|------|------|
| **运行环境** | Claude Code CLI（通过 `/skill` 调用）/ Codex CLI（原生 SKILL.md 加载） |
| **能力边界** | 可通过 Skill 指令生成规范、代码、测试；不可做架构决策终审、UAT 签核 |
| **协作模式** | Skill 加载 → AI 推理生成 → 人类审核 → AI 修正 → 人类签核 |
| **约束条件** | 所有产出物必须携带 traces；必须经人类 Sign-off；标记 `[AI-GENERATED]` |
| **工具依赖** | 通过 Skill 内嵌的 CLI 命令（如 `spec-id next`、`spec-gate check`）完成确定性操作 |

### 产品用例清单

> v7 精简为用例清单 + 关键用例详述，完整用例描述参见 v5.0。

#### A. 主流程用例（8 个）

| 用例 ID | 名称 | 主 Actor | 对应阶段 | 对应 Skill |
|---------|------|---------|---------|-----------|
| UC-001 | Feature 初始化 | A2 Tech Lead | 00 Init | CLI: `spec-first init` |
| UC-002 | 需求规格化 | A1 PM + A6 AI | 01 Specify | 01-spec-write |
| UC-003 | 技术设计 | A2 Tech Lead + A6 AI | 02 Design | 02-design-write |
| UC-004 | 技术调研 | A2 Tech Lead + A6 AI | 02 Design | 03-research |
| UC-005 | 任务拆解 | A2 Tech Lead + A6 AI | 03 Plan | 04-task-decompose |
| UC-006 | 规范驱动开发 | A3 Developer + A6 AI | 04 Implement | 05-code-trace |
| UC-007 | 测试验证 | A4 QA Lead + A6 AI | 05 Verify | 06-test-design |
| UC-008 | 归档复盘 | A2 Tech Lead + A6 AI | 06 Wrap-up | 07-archive |

#### B. 横切用例（5 个）

| 用例 ID | 名称 | 主 Actor | 触发条件 |
|---------|------|---------|---------|
| UC-009 | Gate 校验 | A7 CI/CD + A2 | 阶段切换时 |
| UC-010 | Commit 合规校验 | A7 CI/CD | Git commit 时 |
| UC-011 | 一致性校验（SCA） | A7 CI/CD | 5 个触发时机 |
| UC-012 | 变更管理（RFC） | A1 PM + A2 | 需求/设计变更时 |
| UC-013 | 缺陷管理 | A4 QA Lead | 缺陷发现时 |

#### C. AI 协作用例（3 个）

| 用例 ID | 名称 | 主 Actor | 触发条件 | 对应 Skill |
|---------|------|---------|---------|-----------|
| UC-014 | 会话恢复 | A6 AI Agent | 会话中断后 | 00-session-catchup |
| UC-015 | Context Pack 生成 | A6 AI Agent | Agent 委派时 | CLI: `spec-ai context` |
| UC-016 | AI 编码统计 | A7 CI/CD | AI 会话结束时 | CLI: `spec-ai stats` |

#### D. 运维用例（2 个）

| 用例 ID | 名称 | 主 Actor | 触发条件 |
|---------|------|---------|---------|
| UC-017 | 度量报告 | A2 Tech Lead | Feature 完成后 |
| UC-018 | 环境诊断 | A3 Developer | 首次使用时 |

---

## 核心架构

### 双层架构（v7.1 核心升级）

v7.1 将 Spec-First 的工具实现分为两个协作层：**Skill 驱动整个流程，CLI 提供底层能力**。

```
┌────────────────────────────────────────────────────────────────┐
│                    人类（PM/TL/Dev/QA）                         │
│  决策、确认、签核                                               │
└───────────────┬────────────────────────────────────────────────┘
                │
┌───────────────▼────────────────────────────────────────────────┐
│                Skill 层（流程编排与触发）                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  3 个协同 Skill：/plan  /verify  /orchestrate           │   │
│  │  8 个阶段 Skill：00-session-catchup ~ 07-archive        │   │
│  │  宿主：Claude Code（/skill）/ Codex CLI（原生加载）      │   │
│  │  职责：流程编排、阶段流转触发、交互引导、内容生成         │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                              │ 调用 CLI 命令                    │
│  ┌──────────────────────────▼──────────────────────────────┐   │
│  │  CLI 层（确定性原子能力）                                │   │
│  │  10 个命令组 × 7 个核心模块（M1-M7）                     │   │
│  │  职责：ID 生成、Gate 校验、状态变更执行、度量计算         │   │
│  │  ⚠️ CLI 不主动编排流程，仅响应 Skill 或人的调用          │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

**分层原则**：

| 维度 | Skill 指令层（驱动层） | CLI 确定性层（能力层） |
|------|----------------------|---------------------|
| **定位** | 流程的"指挥官"，决定何时做什么 | 流程的"执行者"，保证操作确定性 |
| **实现形式** | `.md` 文件（YAML frontmatter + Markdown 指令） | TypeScript ESM 模块 |
| **执行主体** | AI Agent（Claude / GPT / Codex） | Node.js 运行时 |
| **职责边界** | 编排流程、触发阶段流转、推理生成、交互引导 | 执行状态变更、ID 注册、Gate 校验、度量计算 |
| **确定性** | 非确定性（AI 推理结果可能不同） | 确定性（相同输入 = 相同输出） |
| **可测试性** | 通过场景验证 | 通过单元测试 + 集成测试 |
| **跨平台** | Claude Code + Codex CLI 双平台兼容 | 任何 Node.js 20+ 环境 |

### 三层规范体系

```text
┌─────────────────────────────────────────────────┐
│  Layer 0: 通用流程框架（8+2）                      │
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

**合并示例**：Feature `FEAT-AUTH`，Mode N，Size M，涉及端 H5 + Java Backend

```text
spec-first init --feat AUTH --mode N --size M --platforms h5,java-backend

Layer 0（通用基线）:
  阶段: 00-07 全流程 + 08/09 终态
  Gate: 8 个标准 Gate
  追踪: 9 项覆盖率全量计算

Layer 1（Mode N × Size M 裁剪）:
  产出物深度:
    spec.md      — 完整 FR/NFR + AC
    design.md    — 架构设计 + 技术选型
    api-contract — 必须（因涉及接口变更）
    task_plan.md — 含依赖关系
    test-plan.md — 必须
  Gate 策略: 标准 Gate 全量执行
  协作模式: /plan -> 执行 -> /verify full

Layer 2（从 .spec-first/layer2/ 读取端规范文件叠加）:
  读取: .spec-first/layer2/h5.yaml
    gate_conditions:
      04_implement: L2-H5-IMPL-001(ESLint), L2-H5-IMPL-002(BundleSize)
      05_verify: L2-H5-VERIFY-001(Lighthouse ≥ 80), L2-H5-VERIFY-002(浏览器兼容)
    extra_deliverables:
      02_design: responsive-spec.md
      05_verify: browser-compat-report.md
  读取: .spec-first/layer2/java-backend.yaml
    gate_conditions:
      04_implement: L2-JAVA-IMPL-001(SonarQube), L2-JAVA-IMPL-002(Checkstyle)
      05_verify: L2-JAVA-VERIFY-001(P99 ≤ 200ms), L2-JAVA-VERIFY-002(OWASP)

合并结果（该 Feature 实例 → stage-state.json）:
  阶段: 00-07 不跳过
  产出物: spec.md + design.md + responsive-spec.md + api-contract.yaml
          + task_plan.md + test-plan.md + test-report.md + browser-compat-report.md
  Gate 条件:
    04_implement: 标准 Gate + ESLint + BundleSize + SonarQube + Checkstyle
    05_verify: 标准 Gate + Lighthouse + 浏览器兼容 + P99 + OWASP
  覆盖率: 9 项全量 + AC 级覆盖率 ≥ 90%
  质量阈值: code_coverage ≥ 80%, bundle_size ≤ 500KB, api_p99 ≤ 200ms
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

### 流程总览

```text
00. Init (Feature Kickoff + Constitution 读取)
     │
     ▼
01. Specify (Analysis + PRD + Clarify + ID 分配)  ← Skill: 01-spec-write
     │                    ← Exit Gate: DoR Sign-off
     │                    ← SCA（内部一致性）
     ▼
02. Design (Research + Tech + API + Data Model)    ← Skill: 02-design-write / 03-research
     │                    ← Exit Gate: Design Review
     │                    ← SCA（spec ↔ design）
     ▼
03. Plan (Tasks + Dependencies + Checklist)        ← Skill: 04-task-decompose
     │                    ← Exit Gate: Task Review + 追踪覆盖率校验
     │                    ← SCA（spec ↔ tasks）
     ▼
04. Implement (Spec-Driven Dev + TDD + CR)         ← Skill: 05-code-trace
     │                    ← Exit Gate: Code CR + 追踪合规率校验
     │                    ← SCA（spec ↔ code）
     ▼
05. Verify (Integration Test + Security + UAT)     ← Skill: 06-test-design
     │                    ← Exit Gate: UAT Sign-off + 测试覆盖率校验
     │                    ← SCA（spec ↔ test results）
     ▼
06. Wrap-up (Retrospective + Docs + 矩阵归档)     ← Skill: 07-archive
     │
     ▼
07. Release (Build + Smoke Test + Submit to DevOps)

横切机制（贯穿全流程）:
├── A. Quality Gate — 每个阶段的准出条件（含追踪覆盖率）
├── B. SCA — 跨产物一致性校验（5 个触发时机）
└── C. Change-Management — 变更管理（分级处理，任何阶段可触发）

会话恢复（任意阶段）: ← Skill: 00-session-catchup
```

### 流程速查表

| 阶段 | 活动 | 产出物 | Exit Gate | 追踪校验项 | Skill / CLI |
|------|------|--------|-----------|-----------|-------------|
| 00 Init | Feature 启动 + Constitution 读取 | Feature 目录、元数据 | 目录就绪，Mode/Size/端已确认 | — | CLI: `spec-first init` |
| 01 Specify | 需求分析 → PRD → ID 分配 → Clarify | `spec.md`, 矩阵初始化 | DoR Sign-off，无歧义标记 | 所有 FR/NFR 已分配 ID | Skill: 01-spec-write |
| 02 Design | Research → 技术选型 → API 契约 → 数据建模 | `design.md`, `contracts/`, ADR | Design Review + API 覆盖率 = 100% | API 覆盖率 = 100% | Skill: 02-design-write, 03-research |
| 03 Plan | 任务拆解 → 依赖分析 → Checklist | `task_plan.md`, `checklist.md` | Task Review | Task 覆盖率 = 100%，Task 合规率 = 100% | Skill: 04-task-decompose |
| 04 Implement | 按 TASK 开发 → TDD → Code Review | 代码、单元测试、CR Report | Code CR + 代码覆盖率 ≥ 80% | PR 合规率 = 100% | Skill: 05-code-trace |
| 05 Verify | 测试设计 → 执行 → 安全扫描 → UAT | Test Report, UAT Sign-off | UAT Sign-off + 安全无高危 | Test 覆盖率 = 100%，TC 合规率 = 100% | Skill: 06-test-design |
| 06 Wrap-up | 复盘 → 归档 → 矩阵校验 | `retro.md`, 完整矩阵 | 文档完整性 + 归档清单 | 实现覆盖率 = 100%，矩阵全 Accepted | Skill: 07-archive |
| 07 Release | 构建 → Smoke Test → 提交 DevOps 平台 | Release Note, Smoke Test 报告 | Smoke Test + 核心指标无异常 | — | — |

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
| `FR` | Functional Requirement | `FR-<FEAT>-NNN` | `FR-AUTH-001` | `^FR-[A-Z][A-Z0-9]{1,15}-\d{3}$` | 01 Specify |
| `NFR` | Non-Functional Req | `NFR-<DIM>-NNN` | `NFR-SEC-001` | `^NFR-[A-Z][A-Z0-9]{1,7}-\d{3}$` | 01 Specify |
| `DS` | Design Section | `DS-<FEAT>-NNN` | `DS-AUTH-001` | `^DS-[A-Z][A-Z0-9]{1,15}-\d{3}$` | 02 Design |
| `API` | API Endpoint | `API-<SVC>-NNN` | `API-AUTH-001` | `^API-[A-Z][A-Z0-9]{1,15}-\d{3}$` | 02 Design |
| `TASK` | Implementation Task | `TASK-<FEAT>-NNN` | `TASK-AUTH-001` | `^TASK-[A-Z][A-Z0-9]{1,15}-\d{3}$` | 03 Plan |
| `TC` | Test Case | `TC-<LVL>-<FEAT>-NNN` | `TC-E2E-AUTH-001` | `^TC-(UT\|IT\|E2E\|ST)-[A-Z][A-Z0-9]{1,15}-\d{3}$` | 05 Verify |
| `ADR` | Architecture Decision | `ADR-NNN` | `ADR-001` | `^ADR-\d{3}$` | 02 Design |
| `RFC` | Request for Change | `RFC-NNN` | `RFC-001` | `^RFC-\d{3}$` | 横切机制 C |

**说明**：

- `<FEAT>` 为 Feature 缩写（2-16 位大写字母+数字，首位必须为字母），如 AUTH、PAY、ORDER。**FEAT 缩写必须全局唯一**，通过 FEAT 注册表治理
- `<DIM>` 为 2-8 位维度缩写。推荐枚举：`PERF`（性能）、`SEC`（安全）、`REL`（可靠性）、`AVAIL`（可用性）、`OBS`（可观测性）
- `<LVL>` 固定枚举：`UT`（单元测试）、`IT`（集成测试）、`E2E`（端到端测试）、`ST`（静态分析测试）
- `<SVC>` 为服务/模块缩写，与 `<FEAT>` 规则相同
- NNN 为三位数字，从 001 开始递增
- **ID 生成**：通过 CLI 命令 `spec-id next <type> <featAbbr>` 自动生成，禁止手动编造

#### FEAT 注册表

为确保 `<FEAT>` 缩写全局唯一，项目须维护 FEAT 注册表文件 `specs/.feat-registry.md`。

**治理规则**：

1. **Init 内联校验**：00 Init 阶段必须检查新 FEAT 缩写是否与注册表中已有条目冲突，冲突则阻塞
2. **先注册后使用**：任何 FR/TASK/TC/API 使用新 FEAT 缩写前，必须先在注册表中登记
3. **禁止歧义缩写**：同一业务域不得注册多个缩写
4. **废弃不复用**：FEAT 缩写废弃后标记 `Deprecated`，不得被新 Feature 复用

#### 跨产物引用规则

| 引用场景 | 格式 | 示例 |
|---------|------|------|
| 产出物正文中引用 | 直接写 ID | "本设计实现 FR-AUTH-001 的注册功能" |
| 结构化元数据引用 | `traces: [ID, ...]` | `traces: [FR-AUTH-001, FR-AUTH-002]` |
| AC 级别引用 | `ID/AC-N` | `FR-AUTH-001/AC-2` |
| 代码注释引用 | `// implements: ID` | `// implements: TASK-AUTH-001` |
| Git Commit 引用 | `[ID] message` | `[TASK-AUTH-001] 实现用户注册接口` |
| PR 描述引用 | `Implements: ID` | `Implements: TASK-AUTH-001` |

**强制规则**：

- 每个 TASK 必须有 `traces` 字段，引用至少 1 个 FR 或 NFR
- 每个 TC 必须有 `verifies` 字段，引用至少 1 个 FR/AC 或 NFR
- 每个 PR 描述中必须包含至少 1 个 TASK ID
- 无 traces 的 TASK 视为"过度实现"，需在 CR 中说明理由

### 追踪矩阵

追踪矩阵（Traceability Matrix）是全链路追踪的核心产出物，记录 FR/NFR 从需求到代码的完整映射链路。

**产出物**：`traceability-matrix.md`，存放于 Feature 目录根下。

#### 矩阵格式

```markdown
# 追踪矩阵 — <Feature Name>

| 需求 ID | Design Ref | API/Data Ref | Task Ref | Test Case Ref | PR Ref | Status |
|---------|-----------|-------------|----------|--------------|--------|--------|
| FR-AUTH-001 | DS-AUTH-001 | API-AUTH-001 | TASK-AUTH-001 | TC-E2E-AUTH-001 | #123 | Accepted |
```

**Status 状态枚举**：

| 状态 | 含义 | 典型阶段 |
|------|------|---------|
| Planned | 需求已录入，尚未开始设计/实现 | 01 Specify |
| Implemented | 已有 TASK 和 PR，尚未测试验证 | 04 Implement |
| Verified | 已有 TC 且测试通过 | 05 Verify |
| Accepted | UAT 签核通过，正式验收 | 06 Wrap-up |
| Deferred | 需求推迟到后续版本 | 任何阶段 |
| Cancelled | 需求已取消（需记录取消原因） | 任何阶段 |
| Exception | 需求因客观原因豁免（已登记 Known Exception List） | 任何阶段 |

#### 矩阵生命周期

| 阶段 | 矩阵操作 | 填充列 |
|------|---------|--------|
| 01 Specify | 创建矩阵，填入所有 FR/NFR | 需求 ID |
| 02 Design | 填充设计引用和 API/Data 引用 | Design Ref, API/Data Ref |
| 03 Plan | 填充任务引用 | Task Ref |
| 04 Implement | 填充 PR 引用 | PR Ref |
| 05 Verify | 填充测试用例引用，更新 Status | Test Case Ref, Status |
| 06 Wrap-up | 更新 Status 为 Accepted | Status |

### 覆盖率算法

#### 正向覆盖率（需求是否被实现）

| 指标 | 公式 | 校验阶段 | Gate 阈值 |
|------|------|---------|----------|
| **Task 覆盖率** | Active FR∪NFR with ≥1 TASK / Active FR+NFR × 100% | Gate 2 | = 100% |
| **Test 覆盖率(FR级)** | Active FR∪NFR with ≥1 TC / Active FR+NFR × 100% | Gate 3 | = 100% |
| **Test 覆盖率(AC级)** | Active AC with ≥1 TC / Active AC 总数 × 100% | Gate 3 | ≥ 90%（M/L） |
| **实现覆盖率** | Active FR∪NFR with ≥1 PR / Active FR+NFR × 100% | Gate 3 | = 100% |
| **API 覆盖率** | FR(需API) with ≥1 API / Total FR(需API) × 100% | Gate 1 | = 100% |

**Active 定义**：Active FR+NFR = Total FR+NFR 中排除 Status 为 Deferred、Cancelled 和 Exception 的条目。

**解读**：正向覆盖率 < 100% = 存在**遗漏需求**。

#### 反向合规率（实现是否有需求依据）

| 指标 | 公式 | 校验阶段 | Gate 阈值 |
|------|------|---------|----------|
| **Task 合规率** | TASK with ≥1 FR/NFR ref / Total TASK × 100% | Gate 2 | = 100% |
| **TC 合规率** | TC with ≥1 FR/NFR ref / Total TC × 100% | Gate 3 | = 100% |
| **PR 合规率** | PR with ≥1 TASK ref / Total PR × 100% | Gate 2 | = 100% |

**解读**：反向合规率 < 100% = 存在**过度实现**。

#### 综合指标

| 指标 | 公式 | 目标 |
|------|------|------|
| **孤儿项率** | 未关联 FR/NFR 的 (TASK+TC+PR) 数 / 全部 (TASK+TC+PR) 数 × 100% | = 0% |

#### Known Exception List（已知豁免清单）

当某些 FR/NFR 因客观原因无法在当前版本实现或测试时，可通过豁免机制处理：

1. 在 `specs/known-exceptions.md` 中登记豁免条目，包含：豁免 ID、原因、风险评估、解除时间
2. 豁免条目在追踪矩阵中标记 Status = `Exception`
3. Gate 校验时，Exception 条目从覆盖率分母中排除
4. 每个 Sprint/迭代结束时复审豁免清单，过期未解除的豁免升级为 P0 风险

**约束**：

- 豁免比例上限：单次 Gate 豁免条目不得超过 Active FR+NFR 总数的 **10%**
- 豁免必须有明确的解除时间，不允许无限期豁免
- 所有豁免记录纳入 06. Wrap-up 复盘审计

#### AC 级覆盖缺口管理

当 AC 级覆盖率未达 100% 时（M/L 规模阈值 ≥ 90%），未覆盖的 AC 须逐条记录在 Test Report 中，包含未覆盖原因和风险评估。高风险 AC 未覆盖时 Gate Owner 须额外审批。所有未覆盖 AC 记录纳入 06. Wrap-up 复盘。

> **说明**：Size S 规模不强制 AC 级覆盖率校验，FR 级覆盖率 = 100% 已足够。

#### 流程健康度指标

| 指标 | 公式 | 目标 |
|------|------|------|
| **返工率** | (Gate 驳回次数 + PR Request Changes 次数) / (Gate 触发总数 + PR 总数) × 100% | < 10% |
| **Gate 首次通过率** | 首次触发即通过的 Gate 次数 / Gate 触发总数 × 100% | > 85% |
| **缺陷逃逸率** | 生产环境发现的 Bug 数 / (生产 Bug + 测试 Bug) × 100% | < 2%（S1/S2 = 0%） |

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

## 主流程：8 主阶段（00-07）+ 2 终态（08-09）

### 00. Init（Feature 启动）

| 维度 | 内容 |
|------|------|
| **目标** | 启动 Feature，确定 Mode/Size/涉及端，创建工作空间 |
| **活动** | 读取 Constitution → 确定 Mode（N/I）→ 确定 Size（S/M/L）→ 确定涉及端 → 创建 Feature 目录 → 初始化运行态三文件 |
| **产出物** | Feature 目录结构、Feature 元数据（mode, size, platforms）、`task_plan.md` / `findings.md` / `progress.md`（初始化） |
| **Exit Gate** | 目录结构就绪，Mode/Size/涉及端已确认并记录 |
| **工具支撑** | CLI: `spec-first init <featureId> --mode <N|I> --size <S|M|L>` |

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

---

### 01. Specify（需求规格化）

| 维度 | 内容 |
|------|------|
| **目标** | 将业务意图转化为带唯一 ID 的结构化需求契约 |
| **活动** | 需求分析 → 结构化 PRD → ID 分配（FR/NFR）→ Clarify |
| **产出物** | `spec.md`（含 FR-FEAT-NNN, NFR-DIM-NNN）、`traceability-matrix.md`（初始化） |
| **Exit Gate** | DoR Sign-off + 无 `[NEEDS CLARIFICATION]` 标记 + 所有 FR/NFR 已分配 ID |
| **工具支撑** | Skill: `01-spec-write` / CLI: `spec-id next FR <abbr>` |

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
| **活动** | Research → 技术选型 → 架构设计 → API 契约设计（分配 API-SVC-NNN）→ 数据建模 |
| **产出物** | `research.md`, `design.md`, `contracts/`, `data-model.md`, ADR |
| **Exit Gate** | 设计评审 + Spec-Consistency-Analysis + API 覆盖率 = 100% |
| **工具支撑** | Skill: `02-design-write`, `03-research` / CLI: `spec-id next DS <abbr>` |

**子产出物**：

1. **Research**：技术可行性调研、备选方案对比（含 Trade-off 分析）、第三方依赖评估
2. **Technical-Design**：架构决策与技术选型（ADR + 系统架构图 + Decisions & Rationale）
3. **API-Design**：OpenAPI Spec / GraphQL Schema，每个端点分配 `API-<SVC>-NNN`
4. **Data-Modeling**：ERD、State Machine Diagram、数据字典

**追踪矩阵更新**：填充 Design Ref 和 API/Data Ref 列。

---

### 03. Plan（任务规划）

| 维度 | 内容 |
|------|------|
| **目标** | 将技术设计拆解为带 ID 的可执行任务清单 |
| **活动** | 任务拆解（分配 TASK-FEAT-NNN）→ 依赖分析 → Checklist 生成 |
| **产出物** | `task_plan.md`（含 TASK-FEAT-NNN + traces）, `checklist.md` |
| **Exit Gate** | 任务评审 + Task 覆盖率 = 100% + Task 合规率 = 100% |
| **工具支撑** | Skill: `04-task-decompose` / CLI: `spec-id next TASK <abbr>` |

**任务拆解标准**：

- 每个任务分配 `TASK-<FEAT>-NNN`，必须包含 `traces: [FR-<FEAT>-NNN, ...]`
- 任务粒度：单人 1-3 天可完成
- 依赖关系显式标注：`depends_on: [TASK-<FEAT>-NNN]`
- 可并行任务标记：`parallel: true`

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
| **工具支撑** | Skill: `05-code-trace` / CLI: `spec-gate check` |

**开发规范**：

- 每个 TASK 开发前，重读对应 FR 条目
- TDD：先写测试（基于 AC），再写实现
- 代码关键位置标注追踪引用：`// implements: TASK-AUTH-001, traces: FR-AUTH-001`
- Git Commit 格式：`[TASK-<FEAT>-NNN] 提交描述`
- PR 描述必须包含：`Implements: TASK-<FEAT>-NNN, TASK-<FEAT>-NNN`

**并行执行与隔离**：

- 标记 `parallel: true` 的 TASK 可并行开发，每个并行 TASK 使用独立 Git 分支
- 高风险并行任务推荐使用 Git Worktree 隔离
- 并行 TASK 合并前必须通过增量 Spec-Consistency-Analysis

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
| **工具支撑** | Skill: `06-test-design` / CLI: `spec-id next TC <abbr>`, `spec-metrics coverage` |

**子活动**：

1. **Test-Design**：每个 TC 分配 `TC-<LVL>-<FEAT>-NNN`，必须包含 `verifies: [FR-<FEAT>-NNN/AC-N]`
2. **Test-Execution**：集成测试 + 回归测试 + Coverage Matrix
3. **Security-Review**（按 Size 分级）：

   | Size | 必须 | 推荐 |
   |------|------|------|
   | S | OWASP Top 10 + SCA 依赖扫描 | — |
   | M | OWASP Top 10 + SCA + SAST | DAST |
   | L | OWASP Top 10 + SCA + SAST + DAST | 渗透测试 |

   > 当 Feature 存在 `NFR-SEC-*` 时，无论 Size，SAST 为必须项。

4. **UAT**：基于 AC 的端到端验收，UAT Sign-off 作为本阶段 Exit Gate

**Mode I 额外活动**：回归验证 → 产出 `regression-report.md`。

**追踪矩阵更新**：填充 Test Case Ref 列，校验 Test 覆盖率。

---

### 06. Wrap-up（收尾）

| 维度 | 内容 |
|------|------|
| **目标** | 复盘交付，归档文档，确保追踪矩阵完整闭环 |
| **活动** | 复盘 → 文档归档 → Spec 同步 → 追踪矩阵最终校验 |
| **产出物** | `retro.md`, 更新后的 Spec 文档, 完整的 `traceability-matrix.md` |
| **Exit Gate** | 文档完整性 + 实现覆盖率 = 100% + 追踪矩阵 Status 全部为 Accepted 或 Cancelled |
| **工具支撑** | Skill: `07-archive` / CLI: `spec-metrics coverage`, `spec-gate check` |

**关键活动**：

- Retrospective：回顾流程执行情况
- 文档归档：按归档清单逐项检查
- Spec 同步：如有实现偏差，更新 Spec 使其与最终实现一致
- 追踪矩阵最终校验：确认所有 FR/NFR 的 Status 为 Accepted 或 Cancelled
- Action Items：提炼改进项

**归档清单**（19 项，Exit Gate 检查依据）：

| 来源阶段 | 归档文件 | 检查标准 |
|---------|---------|---------|
| 00 Init | `constitution.md` | 版本与实际执行一致 |
| 01 Specify | `spec.md` | 与最终实现对齐，无过期 AC |
| 01 Specify | `traceability-matrix.md` | 所有行 Status 为 Accepted 或 Cancelled |
| 02 Design | `design.md` | 与最终实现对齐 |
| 02 Design | `contracts/*.yaml` | 与实际 API 签名一致 |
| 02 Design | `data-model.md` | 与实际 Schema 一致 |
| 02 Design | `adr/*.adr.md` | 决策记录完整 |
| 03 Plan | `task_plan.md` | 所有 Task 状态已闭合 |
| 04 Implement | 代码 + 单元测试 | CR 通过，代码覆盖率 ≥ 80% |
| 05 Verify | `tests/*.test.md` | 测试用例已归档 |
| 05 Verify | `reports/test-report.md` | 测试执行报告已归档 |
| 05 Verify | `reports/security-scan.md` | 安全扫描报告已归档 |
| 05 Verify | `reports/uat-signoff.md` | 验收签核记录已归档 |
| 横切 C | `rfc/*.rfc.md` | 所有变更请求已闭合 |
| 06 Wrap-up | `retro.md` | 复盘完成，Action Items 已提炼 |
| 全阶段 | `task_plan.md` | 规划记录完整 |
| 全阶段 | `findings.md` | 过程发现已归档 |
| 全阶段 | `progress.md` | 进度记录完整 |

---

### 07. Release（发布）

| 维度 | 内容 |
|------|------|
| **目标** | 将已验收的 Feature 构建并提交发布，确保构建产物通过 Smoke Test |
| **活动** | 构建 → Smoke Test → 提交公司 DevOps 平台发布 |
| **产出物** | Release Note, Smoke Test 报告 |
| **Exit Gate** | Smoke Test 通过 + 核心指标无异常 |
| **工具支撑** | — （构建由 CI 承载，部署由公司 DevOps 平台承载） |

> **边界说明**：部署策略（蓝绿/金丝雀等）、回滚方案、发布后观察窗口均由公司内部 DevOps 平台管理，不在 Spec-First 范围内。

---

### 终态定义（08_done / 09_cancelled）

> 终态一旦进入，不可逆转。

| 终态 | 进入条件 | 进入路径 | 审计要求 |
|------|---------|---------|---------|
| **08_done** | 07 Release 的 Exit Gate 通过（Smoke Test + 核心指标无异常） | `spec-first stage advance` 从 07_release 推进 | 追踪矩阵全部 Accepted/Cancelled；归档清单全部勾选 |
| **09_cancelled** | 项目决策取消该 Feature（必须记录取消原因） | `spec-first stage cancel <featureId> --reason "<reason>"`，任何阶段均可触发 | 取消原因存档；已产出物保留不删除；追踪矩阵标记 Cancelled |

**不可逆规则**：

- 进入 `08_done` 或 `09_cancelled` 后，禁止再次 `advance` 或修改阶段状态
- 如需对已完成的 Feature 进行变更，应创建新的 Feature（Mode I）引用原 Feature ID
- 代码常量定义见 `src/shared/constants.ts:55-67`

---

## 横切机制：3 个贯穿全流程的能力

### A. Quality Gate（质量门禁）

> Review 不是独立节点，而是每个阶段的准出条件。Gate 中嵌入追踪覆盖率校验。

| 阶段 | Gate 内容 | 追踪校验项 | Gate Owner |
|------|----------|-----------|------------|
| 00. Init | 目录就绪，Mode/Size/端已确认 | — | Tech Lead |
| 01. Specify | DoR Sign-off，无歧义标记 | 所有 FR/NFR 已分配 ID | Tech Lead |
| 02. Design | 设计评审 + Baseline Locking | API 覆盖率 = 100% | Tech Lead / Architect |
| 03. Plan | 任务评审 | Task 覆盖率 = 100%，Task 合规率 = 100% | Tech Lead |
| 04. Implement | Code CR + 代码覆盖率 ≥ 80% | PR 合规率 = 100% | Tech Lead / Peer |
| 05. Verify | UAT Sign-off + 安全无高危 | Test 覆盖率 = 100%，TC 合规率 = 100% | QA Lead + PM |
| 06. Wrap-up | 文档完整性 + 归档清单 | 实现覆盖率 = 100%，矩阵全 Accepted | Tech Lead |
| 07. Release | Smoke Test + 核心指标无异常 | — | Tech Lead |

**执行原则**：

- Gate 未通过，不得进入下一阶段
- Gate 结果记录在对应阶段的产出物中
- Gate 与 SCA 的关系：Quality Gate 的"追踪校验项"通过调用 SCA（横切机制 B）执行，两者是调用关系而非独立并行
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
| commit-msg | Git 提交时 | Commit message 含合法 ID 标签 | 格式不符时拒绝提交 |
| pre-push | Git 推送前 | 增量 Spec-Consistency-Analysis | 不一致时拒绝推送 |
| CI Pipeline | PR 创建/更新时 | 全量一致性校验 + 追踪覆盖率 | 不通过时阻止合并 |

> **纯人工场景适配**：Layer A 不存在时，所有 Gate 校验由 Layer B 承载。Layer A 仅作为实时反馈的增强层。

**执行层次**：Hook 自动校验（Layer A 实时 + Layer B 提交时） → 不通过则阻断 → Gate Owner 人工终审放行。

---

### B. Spec-Consistency-Analysis（规范一致性校验）

**定位**：跨产物一致性校验，基于 ID 追踪链确保 spec ↔ design ↔ tasks ↔ code ↔ test 始终对齐。

| # | 触发时机 | 校验内容 | 基于 ID 的校验规则 |
|---|---------|---------|-------------------|
| 1 | Specify 完成后 | spec 内部一致性 | AC 是否覆盖所有 FR、NFR 是否量化、FR 间无矛盾 |
| 2 | Design 完成后 | spec ↔ design | 每个 FR 有对应设计方案，API 覆盖所有需要接口的 FR |
| 3 | Plan 完成后 | spec ↔ tasks | Task 覆盖率 = 100%，Task 合规率 = 100% |
| 4 | Implement 完成后 | spec ↔ code | PR 合规率 = 100%，API 实现与契约一致 |
| 5 | Verify 完成后 | spec ↔ test results | Test 覆盖率 = 100%，所有 AC 有对应 TC 且通过 |

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
| **Minor** | 影响 ≤2 个产物，不需重新触发已通过的 Gate | Tech Lead 审批 | 快速通道：直接修改 + 增量校验 |
| **Major** | 影响 3-5 个产物，或需重新触发已通过的 Gate | Tech Lead + PM 审批 | 标准流程：RFC → Impact Analysis → 执行 |
| **Critical** | 涉及 Constitution 或架构变更 | Tech Lead + PM + Architect 审批 | 完整流程：RFC → 全量 Impact Analysis → 评审会 → 执行 |

**判定规则**：两个维度取较高级别。

---

## Skill 指令体系

### 设计理念

Skill 是 Spec-First 双层架构中的 **驱动层**，以 `.md` 文件形式定义 AI Agent 在每个阶段的行为指令。Skill 负责流程编排与阶段流转触发，封装经过验证的最佳实践 prompt 和执行流程，消除个体 AI 使用差异。

### Skill 文件规范

每个 Skill 文件遵循统一格式：

```yaml
---
name: <skill-name>           # 唯一标识
description: <one-line-desc>  # 一句话描述
---
```

文件体为 Markdown 格式的指令内容，包含：角色定义、上下文加载步骤、执行步骤、输出规范、完成后动作。

### 8 个 Skill 定义

| Skill ID | 名称 | 对应阶段 | 职责 | 状态 |
|----------|------|---------|------|------|
| `00-session-catchup` | 会话恢复 | 任意阶段 | 会话中断后恢复上下文，同步追踪产物 | 🔧 Partial |
| `01-spec-write` | 需求规格化 | 01 Specify | 辅助生成结构化 spec.md，分配 FR/NFR ID | 🔧 Partial |
| `02-design-write` | 技术设计 | 02 Design | 辅助生成 design.md、contracts/、data-model.md | 🔧 Partial |
| `03-research` | 技术调研 | 02 Design | 辅助技术可行性调研，生成 research.md | 🔧 Partial |
| `04-task-decompose` | 任务拆解 | 03 Plan | 辅助生成 task_plan.md，分配 TASK ID | 🔧 Partial |
| `05-code-trace` | 规范驱动开发 | 04 Implement | 辅助按 TASK 编码，确保追踪注释 | 🔧 Partial |
| `06-test-design` | 测试设计 | 05 Verify | 辅助生成测试用例，计算测试覆盖率 | 🔧 Partial |
| `07-archive` | 归档复盘 | 06 Wrap-up | 执行归档审计，生成复盘报告 | 🔧 Partial |

> 🔧 8 个阶段 Skill 的 SKILL.md 已编写初版指令（每个 77-98 行，含角色定义、输入输出、执行步骤），待联调验收后接入入口。
> 当前已可用的 Skill 为 3 个协同 Skill：`/plan`、`/verify`、`/orchestrate`（存放于 `.claude/commands/`）。

### 5 阶段执行模型

每个 Skill 遵循相同的 5 阶段执行流程：

```text
Phase 1 — 上下文加载
  ├── spec-ai context <featureId>（获取 Context Pack）
  └── 读取阶段相关交付物

Phase 2 — AI 推理生成
  └── 根据 SKILL.md 指令生成内容（纯 AI 推理，无 CLI 调用）

Phase 3 — 用户确认
  └── 展示生成内容，等待用户确认 / 修改 / 拒绝

Phase 4 — 写入交付物
  ├── 写入目标文件
  └── spec-id next <type> <abbr>（注册新 ID）

Phase 5 — 副作用执行
  ├── spec-matrix check <featureId>（更新追踪矩阵）
  ├── spec-gate check <featureId>（校验 Gate）
  └── 更新运行态三文件（progress.md / findings.md / task_plan.md）
```

**强制约束**：

- Phase 3 不可跳过：AI 生成内容后必须展示给用户确认，确认后才写入文件
- Phase 4 中所有新 ID 必须通过 `spec-id next` 注册，禁止手动编造
- Phase 5 中 Gate 校验失败时，提示用户修正而非自动跳过

### Skill 使用路径映射表（Claude Code 视角）

> 在 Claude Code 中，用户有两类入口调用 Spec-First Skill。

**入口一：3 个协同 Skill（`.claude/commands/`）** ✅ 已可用

| 命令 | 文件 | 职责 | 调用方式 |
|------|------|------|---------|
| `/plan` | `.claude/commands/plan.md` | 阶段规划编排 | `/plan <featureId> "<task>"` |
| `/verify` | `.claude/commands/verify.md` | 校验与质量评估 | `/verify <featureId> [quick\|full]` |
| `/orchestrate` | `.claude/commands/orchestrate.md` | 全流程编排 | `/orchestrate <featureId> "<task>"` |

**入口二：8 个阶段 Skill（`skills/spec-first/*/SKILL.md`）** 📋 Planned

| Skill ID | 调用方式 | 对应协同 Skill |
|----------|---------|---------------|
| `00-session-catchup` | `/skill spec-first/00-session-catchup` | 独立（任意阶段可用） |
| `01-spec-write` | `/skill spec-first/01-spec-write` | 由 `/plan` 在 01_specify 阶段调用 |
| `02-design-write` | `/skill spec-first/02-design-write` | 由 `/plan` 在 02_design 阶段调用 |
| `03-research` | `/skill spec-first/03-research` | 由 `/plan` 在 02_design 阶段调用 |
| `04-task-decompose` | `/skill spec-first/04-task-decompose` | 由 `/plan` 在 03_plan 阶段调用 |
| `05-code-trace` | `/skill spec-first/05-code-trace` | 由 `/orchestrate` 在 04_implement 阶段调用 |
| `06-test-design` | `/skill spec-first/06-test-design` | 由 `/verify` 在 05_verify 阶段调用 |
| `07-archive` | `/skill spec-first/07-archive` | 由 `/verify` 在 06_wrap_up 阶段调用 |

**调用优先级**：日常使用优先用协同 Skill（`/plan`、`/verify`、`/orchestrate`），仅需单阶段精细操作时才直接调用阶段 Skill。

### 跨平台兼容

Skill 文件设计为平台无关，支持两种 AI 宿主：

| 宿主 | 加载方式 | 调用方式 |
|------|---------|---------|
| **Claude Code** | 通过 `/skill` 命令加载 | `/skill 01-spec-write` |
| **Codex CLI** | 原生 `SKILL.md` 自动加载 | 自动识别 `skills/` 目录 |

**兼容性约束**：

- Skill 文件中不得使用任何平台特有语法
- CLI 命令调用统一使用 Bash 代码块，两个平台均可执行
- 交互确认统一使用自然语言提示，不依赖特定 UI 组件

### Context Pack 标准

跨 Agent 委派时，必须携带统一格式的上下文包，确保任意 Agent 可恢复完整语境。

```yaml
# context-pack.yaml — 跨 Agent 统一输入格式（<2KB）
context_pack:
  version: "1.0"
  feature_meta:
    id: "FSREQ-123456-user-auth"
    title: "用户认证模块"
    mode: N
    size: S
    platforms: [H5, Backend]
  artifacts:
    spec: "specs/<featureId>/spec.md"
    design: "specs/<featureId>/design.md"
    tasks: "specs/<featureId>/task_plan.md"
    matrix: "specs/<featureId>/traceability-matrix.md"
  constitution: "constitution.md"
  current_phase: "04_implement"
  current_task: "TASK-AUTH-001"
```

**强制约束**：

- 每次 Agent 委派必须生成 Context Pack，禁止口头传递上下文
- Context Pack 中的 `artifacts` 路径必须指向实际存在的文件
- `current_phase` 和 `current_task` 必须与 `progress.md` 记录一致

### Session Catchup 机制

**触发条件**：`/clear` 命令、上下文窗口截断、IDE 重启或网络中断后重连。

**恢复流程**（7 步）：

1. 读取 `stage-state.json`（当前阶段）
2. 读取 `task_plan.md`（当前规划状态）
3. 读取 `progress.md`（已完成进度）
4. 读取 `findings.md`（已有发现）
5. 读取 `traceability-matrix.md`（追踪状态）
6. 定位当前阶段和当前 TASK
7. 输出恢复摘要到终端，继续执行

**恢复后强制校验**：三文件与实际产出物是否一致，追踪矩阵是否与最新代码同步。

---

## CLI 命令体系

### 设计理念

CLI 是 Spec-First 双层架构中的 **能力层**，以 TypeScript ESM 模块实现，提供相同输入必定产生相同输出的确定性操作。CLI 负责 ID 生成、Gate 校验、状态变更执行、度量计算等不应由 AI 推理完成的操作。CLI 不主动编排流程，仅响应 Skill 或人的调用。

### 7 个核心模块

| 模块 | 名称 | 职责 | 状态 |
|------|------|------|------|
| **M1** | ProcessEngine（流程引擎） | 阶段状态机、三层规范合并、裁剪引擎 | ✅ Implemented |
| **M2** | TraceEngine（追踪引擎） | ID 注册/校验、追踪矩阵管理、覆盖率计算 | ✅ Implemented |
| **M3** | GateEngine（质量门禁引擎） | Gate 条件评估、SCA 校验、Hook 调度 | 🔧 Partial（自动条件解析链路未完成） |
| **M4** | ChangeMgr（变更管理） | RFC 状态机、缺陷管理、影响分析 | ✅ Implemented |
| **M5** | AIOrchestrator（AI 编排） | Context Pack 生成、Session Catchup、AI 统计 | 🔧 Partial（类型签名漂移） |
| **M6** | MetricsEngine（度量引擎） | 12 项指标计算、健康分、瓶颈分析 | ✅ Implemented |
| **M7** | ToolIntegration（工具集成） | Git Hook 安装、CI 模板生成 | 📋 Planned |

### 10 个命令组

> **命名规范**：所有命令统一使用 `spec-first <group> <subcommand>` 格式。
> 文档中 `spec-id`、`spec-gate` 等简写仅为阅读便利，实际执行必须使用 `spec-first id`、`spec-first gate` 等完整形式。
> bin 入口唯一：`spec-first`（来自 `package.json:bin`）。

#### 1. `spec-first init` ✅ Implemented

初始化 Feature 工作区。

```bash
# 实际命令签名（以代码 src/commands/init.ts 为准）
spec-first init --feat <abbr> --mode <N|I> --size <S|M|L> [--platform <github|gitlab>] [--feature-id <id>]
```

- `--feat <abbr>`（必填）：Feature 缩写，大写字母开头，1-16 字符
- `--mode <N|I>`（默认 N）：开发模式
- `--size <S|M|L>`（默认 M）：项目规模
- `--platform <github|gitlab>`（默认 github）：平台（⚠️ 当前不支持 azure-devops）
- `--feature-id <id>`（可选）：指定 Feature ID，默认自动生成

**产出**：创建 `specs/<featureId>/` 目录、`stage-state.json`、`constitution.md` 模板、注册 FEAT 缩写。

#### 2. `spec-first id` ✅ Implemented

ID 生成与校验（M2 TraceEngine）。

```bash
spec-first id next <type> <featAbbr> --feature <featureId>   # 生成下一个 ID（--feature 运行时必填）
spec-first id validate <id>                                   # 校验 ID 格式（<10ms SLA）
spec-first id list --feature <featureId> [--type <type>]      # 列出已注册 ID（--feature 运行时必填）
```

支持 8 种 ID 类型：FR / NFR / DS / API / TASK / TC / ADR / RFC。

#### 3. `spec-first gate` 🔧 Partial

Gate 条件评估（M3 GateEngine）。

```bash
spec-first gate check <featureId> [--stage <stageId>]   # 校验当前阶段 Gate
spec-first gate conditions <stageId>                      # 查看 Gate 条件定义
spec-first gate history <featureId>                       # 查看评估历史
```

评估结果：`PASS`（通过）| `FAIL`（阻断）| `WARN`（警告但放行）。

> ⚠️ Gate 自动条件解析器注入链路未完成，Gate 自动评估存在已知缺口。

#### 4. `spec-first stage` ✅ Implemented

阶段生命周期管理（M1 ProcessEngine）。

```bash
spec-first stage current <featureId>                      # 查看当前阶段
spec-first stage advance <featureId>                      # 推进到下一阶段（需 Gate PASS）
spec-first stage cancel <featureId> --reason "<reason>"   # 取消 Feature
```

> 阶段流转由 Skill 编排触发，CLI 负责原子执行。

#### 5. `spec-first matrix` ✅ Implemented

追踪矩阵管理（M2 TraceEngine）。

```bash
spec-first matrix check <featureId>                                # 校验矩阵完整性
spec-first matrix export <featureId> [--format <markdown|yaml>]    # 导出追踪矩阵
```

> ⚠️ `--format` 可选值为 `markdown | yaml`（非 `md | yaml`）。

#### 6. `spec-first metrics` ✅ Implemented

覆盖率与度量（M2 + M6）。

```bash
spec-first metrics coverage <featureId>                   # 计算 9 项覆盖率
spec-first metrics report <featureId>                     # 生成度量报告
```

#### 7. `spec-first ai` 🔧 Partial

AI 辅助工具（M5 AIOrchestrator）。

```bash
spec-first ai context <featureId>                         # 生成 Context Pack（<2KB YAML）
spec-first ai catchup <featureId>                         # 会话恢复（7 步恢复）
spec-first ai stats <featureId>                           # AI 调用统计
```

> ⚠️ 命令签名存在与核心模块的类型漂移，`pnpm typecheck` 当前不通过。

#### 8. `spec-first rfc` ✅ Implemented

变更请求管理（M4 ChangeMgr）。

```bash
# 实际命令签名（以代码 src/commands/rfc.ts 为准）
spec-first rfc create <featureId> --title "<title>" [--level <Minor|Major|Critical>] [--by <submittedBy>] [--motivation "<motivation>"] [--description "<description>"]
spec-first rfc submit <rfcId> --feature <featureId>        # 提交进入评审（--feature 运行时必填）
spec-first rfc transition <rfcId> <status> --feature <featureId>  # 状态流转（--feature 运行时必填）
spec-first rfc list <featureId>                            # 列出 RFC
spec-first rfc get <rfcId> --feature <featureId>           # 查看详情（--feature 运行时必填）
```

> ⚠️ 参数为 `--title`/`--level`/`--motivation`，**无** `--impact` 参数。

RFC 11 状态 FSM：`draft → submitted → reviewing → approved → planning → executing → verifying → closing → closed`，可从任意状态 → `rejected` / `withdrawn`。

#### 9. `spec-first defect` ✅ Implemented

缺陷管理（M4 ChangeMgr）。

```bash
# 实际命令签名（以代码 src/commands/defect.ts 为准）
spec-first defect register <featureId> --title "<title>" --severity <S1|S2|S3|S4> --reporter "<reporter>" [--description "<desc>"] [--discovered-in <stage>]
spec-first defect update <defectId> <status> [--actor <actor>]
spec-first defect list <featureId>                         # 列出缺陷
spec-first defect get <defectId>                           # 查看详情
spec-first defect escape-rate <featureId>                  # 计算缺陷逃逸率
```

> ⚠️ 严重级别为 `S1/S2/S3/S4`（非 `critical/major/minor`）。

#### 10. `spec-first doctor` ✅ Implemented

环境诊断。

```bash
spec-first doctor
```

检查项：Node.js 版本（≥20）、pnpm 可用性、Git 配置、`specs/` 目录状态、CLI 版本。

### Exit Code 规范

> 以 `src/shared/types.ts` ExitCode enum 为准。

| Code | 常量名 | 含义 |
|------|--------|------|
| 0 | `SUCCESS` | 成功 |
| 1 | `GATE_FAILED` | Gate 校验失败 |
| 2 | `VALIDATION_ERROR` | 参数/ID 校验失败 |
| 3 | `CONFIG_ERROR` | 配置错误 |
| 4 | `IO_ERROR` | 文件 I/O 错误 |
| 5 | `UNKNOWN_ERROR` | 未知错误 |

---

## 多端扩展（Layer 2）

> ⚠️ Layer 2 包含两个独立维度：**技术端规范**（H5/Java Backend 等各端质量标准）和 **CI 平台集成**（GitHub/GitLab 的 CI/CD 模板）。两者互不依赖，按需配置。

### 概念澄清

```text
Layer 2 = 技术端规范（端特有质量标准） + CI 平台集成（CI/CD 运行环境）

技术端规范（TechStack）          CI 平台集成（CIPlatform）
├── H5 前端                      ├── GitHub Actions
├── Java Backend                 ├── GitLab CI
├── APP (Android/iOS)            └── Azure Pipelines
├── PC 桌面端
└── 自定义端...
```

| 维度 | 技术端规范 | CI 平台集成 |
|------|----------|------------|
| **解决什么** | 各端"做到什么标准" | CI/CD"在哪里跑" |
| **谁维护** | 各端技术负责人 | DevOps / Tech Lead |
| **何时生效** | Feature init 时合并到流程实例 | 项目初始化时一次性配置 |
| **影响范围** | Gate 条件叠加、额外产出物、质量阈值 | Workflow 模板、Hook 脚本 |

---

### A. 技术端规范（Layer 2 核心） 📋 Planned

#### 目录约定

端规范文件统一存放于项目根目录 `.spec-first/layer2/`，每端一个 YAML 文件：

```text
.spec-first/
├── config.yaml                    # 项目全局配置
└── layer2/                        # 端规范目录
    ├── h5.yaml                    # H5 前端端规范
    ├── java-backend.yaml          # Java 后端端规范
    ├── app-android.yaml           # Android 端规范
    ├── app-ios.yaml               # iOS 端规范
    └── pc.yaml                    # PC 桌面端规范
```

**命名规则**：文件名即端标识（kebab-case），与 `spec-first init --platforms h5,java-backend` 参数对应。

#### 端规范文件标准格式

```yaml
# .spec-first/layer2/h5.yaml
# Layer 2 端规范 — H5 前端
name: H5 前端
description: H5/移动端 Web 特有的质量标准与检查清单

# ── Gate 叠加条件 ──
# 合并到对应阶段的 Gate，与 Layer 0 Gate 条件叠加（AND 关系）
gate_conditions:
  04_implement:
    - id: L2-H5-IMPL-001
      description: "ESLint + Stylelint 零 error"
      type: auto                    # auto | manual | hybrid
      command: "pnpm lint"          # auto 类型的执行命令
    - id: L2-H5-IMPL-002
      description: "Bundle Size ≤ 500KB (gzipped)"
      type: auto
      command: "pnpm build && bundlesize"
      threshold: 500
  05_verify:
    - id: L2-H5-VERIFY-001
      description: "Lighthouse Performance ≥ 80"
      type: auto
      command: "lighthouse --output json"
      threshold: 80
    - id: L2-H5-VERIFY-002
      description: "浏览器兼容性验证（Chrome/Safari/Firefox 最新 2 版本）"
      type: manual                  # 需人工确认
    - id: L2-H5-VERIFY-003
      description: "Lighthouse Accessibility ≥ 90"
      type: auto
      threshold: 90

# ── 额外产出物 ──
# 合并到对应阶段的 deliverables 列表
extra_deliverables:
  02_design:
    - name: responsive-spec.md
      required: true
      description: "响应式设计规范（断点定义、布局策略）"
  05_verify:
    - name: browser-compat-report.md
      required: true
      description: "浏览器兼容性测试报告"

# ── 质量阈值 ──
# 覆盖或追加 Layer 0 的默认阈值
quality_thresholds:
  code_coverage_min: 80             # 单元测试覆盖率 ≥ 80%
  lighthouse_performance: 80
  lighthouse_accessibility: 90
  bundle_size_kb: 500
```

```yaml
# .spec-first/layer2/java-backend.yaml
# Layer 2 端规范 — Java Backend
name: Java 后端
description: Java/Spring Boot 后端特有的质量标准与检查清单

gate_conditions:
  04_implement:
    - id: L2-JAVA-IMPL-001
      description: "SonarQube Quality Gate 通过"
      type: auto
      command: "mvn sonar:sonar && sonar-gate-check"
    - id: L2-JAVA-IMPL-002
      description: "无 Critical/Blocker 级 Checkstyle 违规"
      type: auto
      command: "mvn checkstyle:check"
  05_verify:
    - id: L2-JAVA-VERIFY-001
      description: "API P99 延迟 ≤ 200ms"
      type: manual
      threshold: 200
    - id: L2-JAVA-VERIFY-002
      description: "无 OWASP Top 10 高危漏洞"
      type: auto
      command: "mvn dependency-check:check"

extra_deliverables:
  02_design:
    - name: api-performance-budget.md
      required: false
      description: "API 性能预算（P50/P99 目标值）"

quality_thresholds:
  code_coverage_min: 80
  api_p99_ms: 200
  sonarqube_gate: pass
  critical_violations: 0
```

#### 合并机制

```text
Feature Init 时的三层合并流程：

spec-first init --feat AUTH --mode N --size M --platforms h5,java-backend
     │
     ▼
┌─ Layer 0 ──────────────────────────────┐
│  8 主阶段基线 Gate + 基线产出物          │
└──────────────────┬─────────────────────┘
                   │
┌─ Layer 1 ────────▼─────────────────────┐
│  Mode N × Size M 裁剪                   │
│  产出物深度调整、Gate 条件调整            │
└──────────────────┬─────────────────────┘
                   │
┌─ Layer 2 ────────▼─────────────────────┐
│  读取 .spec-first/layer2/h5.yaml       │
│  读取 .spec-first/layer2/java-backend.yaml │
│  ┌──────────────────────────────────┐  │
│  │ 合并策略：                        │  │
│  │ 1. gate_conditions → 叠加到阶段   │  │
│  │ 2. extra_deliverables → 追加      │  │
│  │ 3. quality_thresholds → 取严格值  │  │
│  └──────────────────────────────────┘  │
└──────────────────┬─────────────────────┘
                   │
                   ▼
          specs/<featureId>/stage-state.json
          （含完整的合并后 Gate 条件和产出物清单）
```

**合并规则**：

| 字段 | 合并策略 | 示例 |
|------|---------|------|
| `gate_conditions` | 各端条件**叠加**到同一阶段（AND 关系） | H5 的 Lighthouse + Java 的 SonarQube 同时出现在 05_verify |
| `extra_deliverables` | **追加**到阶段产出物列表 | 02_design 多出 responsive-spec.md 和 api-performance-budget.md |
| `quality_thresholds` | 多端冲突时**取较严格值** | H5 要求覆盖率 80%，Java 要求 85% → 最终 85% |

**CLI 实现锚点**：`SpecMerger.applyPlatformRules()`（`src/core/process-engine/spec-merger.ts:86`，当前为 TODO）。

#### 新增端规范流程

1. 在 `.spec-first/layer2/` 下创建 `<tech-stack>.yaml`
2. 按标准格式定义 `gate_conditions` / `extra_deliverables` / `quality_thresholds`
3. `spec-first init` 时通过 `--platforms` 引用端标识
4. SpecMerger 自动读取并合并

---

### B. CI 平台集成（M7 ToolIntegration） 📋 Planned

> CI 平台集成不属于 Layer 2 三层体系，而是 M7 ToolIntegration 模块的能力。

#### 已支持平台

| CI 平台 | CI 模板 | Hook 集成 | 状态 |
|---------|---------|-----------|------|
| **GitHub** | GitHub Actions（2 个 workflow） | pre-commit + commit-msg + pre-push | 📋 Planned |
| **GitLab** | `.gitlab-ci.yml` | 同上 | 📋 Planned |

> 当前 `--platform` 参数仅支持 `github | gitlab`，代码层面仅影响 CI 模板生成，不影响流程逻辑。

#### GitHub Actions 集成示例

**Workflow 1: PR Gate**（每次 PR 触发）

- 运行 `spec-first gate check` 校验当前阶段 Gate（含 Layer 2 叠加条件）
- 运行 `spec-first matrix check` 校验追踪矩阵
- 运行 SCA 增量校验（`git diff` 模式）
- 校验 commit message 格式（`TASK-XXX-NNN` 关联）

**Workflow 2: Release Gate**（合并到 main 触发）

- 运行 `spec-first metrics coverage` 全量覆盖率
- 运行 SCA 全量校验
- 生成度量报告
- 归档检查

#### 扩展接口

新 CI 平台接入需实现 `PlatformAdapter` 接口：

```typescript
interface PlatformAdapter {
  generateCITemplate(featureId: string, config: StageConfig): string;
  installHooks(projectRoot: string): void;
}
```

---

## 产出物标准化

### 目录结构

```text
.spec-first/                        # 项目级配置目录
├── config.yaml                     # 全局配置（可选）
└── layer2/                         # Layer 2 端规范目录
    ├── h5.yaml                     # H5 前端端规范
    ├── java-backend.yaml           # Java 后端端规范
    └── ...                         # 各端独立维护，按需补录

specs/                              # Feature 工作区根目录
├── .feat-registry.md               # FEAT 缩写注册表（全局唯一）
└── <featureId>/                    # 单个 Feature 目录
    ├── stage-state.json            # 阶段状态机（M1 管理）
    ├── constitution.md             # 项目原则（00_init 生成）
    ├── spec.md                     # 需求规格（01_specify）
    ├── design.md                   # 技术设计（02_design）
    ├── research.md                 # 技术调研（02_design 可选）
    ├── contracts/*.yaml            # API 契约（02_design）
    ├── data-model.md               # 数据模型（02_design M/L）
    ├── adr/*.adr.md                # 架构决策记录
    ├── task_plan.md                # 任务拆解与执行计划（03_plan 产出，运行态持续更新）
    ├── checklist.md                # 验证清单（03_plan）
    ├── tests/*.test.md             # 测试用例（05_verify）
    ├── reports/                    # 报告目录
    │   ├── test-report.md          # 测试报告
    │   ├── security-scan.md        # 安全扫描报告
    │   └── uat-signoff.md          # 验收签核记录
    ├── retro.md                    # 复盘报告（06_wrap_up）
    ├── traceability-matrix.md      # 追踪矩阵（或 .yaml）
    ├── progress.md                 # 进度记录（运行态）
    ├── findings.md                 # 过程发现（运行态）
    ├── gate-history.jsonl          # Gate 评估历史
    ├── ai-stats.jsonl              # AI 调用统计
    └── metrics.jsonl               # 度量数据
```

**产物命名**：任务拆解产物统一命名为 `task_plan.md`，不再支持 `tasks.md`。

### 文件格式规范

| 文件类型 | 格式 | 解析方式 |
|----------|------|----------|
| 规范文档（spec/design/task_plan） | Markdown + YAML frontmatter | remark AST |
| API 契约 | OpenAPI 3.x YAML | js-yaml |
| 状态数据 | JSON | 原生 JSON.parse |
| 时序数据（gate/metrics/ai-stats） | JSONL（每行一条 JSON） | 逐行解析 |
| 追踪矩阵 | Markdown 表格 或 YAML | remark / js-yaml |

### 运行态三文件

Skill 执行过程中持续更新的 3 个文件，用于 Session Catchup 和进度追踪：

| 文件 | 用途 | 更新时机 |
|------|------|----------|
| `progress.md` | 记录每个阶段的完成状态和关键里程碑 | 每个 Step 完成后 |
| `findings.md` | 记录过程中的发现、决策、风险 | 发现问题时随时追加 |
| `task_plan.md` | 当前正在执行的任务计划和进度 | 任务开始/完成时 |

### 模板系统

所有初始化文件通过 Handlebars 模板生成，模板存放于 `templates/` 目录：

```text
templates/
├── init/                           # 项目初始化模板
│   ├── stage-state.json.hbs       ✅ 已存在
│   └── constitution.md.hbs        ✅ 已存在
├── matrix/                         # 追踪矩阵模板
│   ├── traceability-matrix.md.hbs ✅ 已存在
│   └── traceability-matrix.yaml.hbs ✅ 已存在
├── gate/                           # Gate 报告模板
│   └── gate-report.md.hbs        ✅ 已存在
└── metrics/                        # 度量报告模板
    └── health-report.md.hbs      ✅ 已存在
```

---

## 度量与运营体系

### 12 项核心指标

分 4 类，覆盖研发全链路：

**A 类：覆盖率指标（9 项）**

| 指标 | 公式 | 目标 |
|------|------|------|
| C1 Design Coverage | 被 DS 覆盖的 FR / 总 FR | 100% |
| C2 API Coverage | 需接口的 FR 被 API 覆盖 / 需接口的 FR | 100% |
| C3 Task Coverage | 被 TASK 覆盖的 FR / 总 FR | 100% |
| C4 Test Coverage (FR) | 被 TC 覆盖的 FR / 总 FR | 100% |
| C5 Test Coverage (AC) | 被 TC 覆盖的 AC / 总 AC | ≥90% (M/L) |
| C6 Impl Coverage | 已完成 TASK / 总 TASK | 100% |
| C7 PR Compliance | 关联 TASK ID 的 PR / 总 PR | 100% |
| C8 Task Compliance | 关联 DS/FR 的 TASK / 总 TASK | 100% |
| C9 TC Compliance | 关联 AC/FR 的 TC / 总 TC | 100% |

**B 类：效率指标（1 项）**

| 指标 | 公式 | 用途 |
|------|------|------|
| E1 Stage Cycle Time | 各阶段实际耗时 | 识别瓶颈阶段 |

**C 类：质量指标（1 项）**

| 指标 | 公式 | 目标 |
|------|------|------|
| Q1 Defect Escape Rate | 上线后缺陷 / 总缺陷 | ≤5% |

**D 类：综合指标（1 项）**

| 指标 | 公式 | 用途 |
|------|------|------|
| H1 Health Score | 加权综合分 | 项目健康度一览 |

### 健康分计算公式

```text
H1 = w1×C1 + w2×C2 + w3×C3 + w4×C4 + w5×C5 + w6×C6 + w7×C7 + w8×C8 + w9×C9 - penalty(Q1)

默认权重（可配置）：
  w1=0.10, w2=0.10, w3=0.10, w4=0.15, w5=0.10,
  w6=0.15, w7=0.10, w8=0.10, w9=0.10
  penalty(Q1) = max(0, (Q1 - 0.05)) × 100

健康等级：
  ≥90 → 🟢 Healthy
  ≥70 → 🟡 Warning
  <70 → 🔴 Critical
```

### 瓶颈分析规则

M6 MetricsEngine 内置 5 条瓶颈检测规则：

| 规则 | 触发条件 | 建议 |
|------|----------|------|
| R1 设计瓶颈 | C1 < 80% 且阶段 ≥ 03_plan | 补充 DS 覆盖 |
| R2 测试瓶颈 | C4 < 100% 且阶段 ≥ 05_verify | 补充 TC |
| R3 实现滞后 | C6 < 50% 且阶段停留 > 阈值 | 检查任务拆解粒度 |
| R4 合规缺口 | C7 或 C8 < 90% | 检查 PR/TASK 关联 |
| R5 缺陷逃逸 | Q1 > 10% | 加强测试设计 |

### 度量数据存储

- **格式**：JSONL（每行一条 JSON 记录）
- **文件**：`specs/<featureId>/metrics.jsonl`
- **轮转策略**：月度轮转，历史文件归档为 `metrics-YYYY-MM.jsonl`
- **单条记录结构**：

```json
{
  "timestamp": "2026-02-08T10:30:00Z",
  "featureId": "user-auth",
  "stage": "03_plan",
  "metrics": { "C1": 1.0, "C2": 0.85, "C3": 1.0, "..." : "..." },
  "healthScore": 87.5,
  "healthLevel": "warning"
}
```

---

## 落地路线图

> 截至 2026-02-09 的实际状态，分三栏呈现。

### 已交付（As-Is）

| 模块/能力 | 状态 | 说明 |
|----------|------|------|
| M1 ProcessEngine | ✅ | 阶段状态机、init/stage 命令可用 |
| M2 TraceEngine | ✅ | ID 注册/校验、追踪矩阵管理、覆盖率计算 |
| M4 ChangeMgr | ✅ | RFC 状态机 + 缺陷管理（rfc/defect 命令） |
| M6 MetricsEngine | ✅ | 覆盖率计算 + 度量报告 |
| CLI 10 个命令组 | ✅ | 全部注册，可调用（个别子命令有类型漂移） |
| 3 个协同 Skill | ✅ | `/plan`、`/verify`、`/orchestrate` 可用 |
| Handlebars 模板系统 | ✅ | 6 个模板文件就位 |
| Session hooks + CI 校验 | ✅ | `pnpm validate:ai-assets` 可运行 |

### 在修复（Known Issues）

| 模块/能力 | 状态 | 问题 |
|----------|------|------|
| M3 GateEngine | 🔧 | Gate 自动条件解析器注入链路未完成，`--force` 有滥用风险 |
| M5 AIOrchestrator | 🔧 | 命令层与核心模块签名漂移，`pnpm typecheck` 不通过 |
| CLI 类型一致性 | 🔧 | gate/ai/defect 命令存在类型错误，需修复到 typecheck 归零 |

### 待建设（To-Be）

| 模块/能力 | 优先级 | 说明 |
|----------|--------|------|
| 8 个阶段 Skill 联调验收 | P0 | SKILL.md 初版指令已编写（77-98 行/个），待联调验收并接入入口 |
| M7 ToolIntegration | P1 | Git Hook 安装 + CI 模板生成 |
| Hook 化 Gate 双层体系 | P1 | Layer A（AI Runtime）+ Layer B（Git/CI） |
| Layer 2 多端扩展 | P2 | Azure DevOps 适配、GitLab CI 模板 |
| 性能优化 SLA 达标 | P2 | `validateId` < 10ms, `getCoverage` < 50ms, `evaluateGate` < 200ms |
| 端到端集成测试 | P2 | 核心流程自动化验证 |

---

## 风险提醒

### 风险矩阵

| # | 风险 | 概率 | 影响 | 等级 | 缓解措施 |
|---|------|------|------|------|----------|
| R1 | 流程过重导致团队抵触 | 高 | 高 | 🔴 | Mode×Size 裁剪：S 模式仅保留核心 Gate，跳过非必要阶段 |
| R2 | AI 生成内容质量不可控 | 中 | 高 | 🟡 | SCA 三检查点 + 人在回路强制确认 + Gate 阻断机制 |
| R3 | 规范与实现渐行渐远 | 中 | 高 | 🟡 | 追踪矩阵实时校验 + PR Gate 自动检查 + 覆盖率阈值 |
| R4 | 上下文丢失致 AI 重复劳动 | 中 | 中 | 🟡 | Context Pack + Session Catchup + 运行态三文件 |
| R5 | 工具链学习成本过高 | 中 | 中 | 🟡 | Skill 封装复杂度 + CLI 统一入口 + doctor 自检 |

### 风险应对原则

1. **渐进式推行** — 先在 1-2 个试点 Feature 验证，再逐步推广
2. **裁剪优先** — 默认使用最轻量配置（S + I），按需升级
3. **工具兜底** — 所有人工判断环节都有 CLI 自动化兜底
4. **快速反馈** — Gate 校验失败时给出明确修复建议，而非仅报错

---

## 版本演进映射

### v2 → v5 → v6 → v7.1 演进脉络

| 维度 | v2 | v5 | v6 | v7.1（本版本） |
|------|-----|-----|-----|---------------|
| 定位 | 需求规范模板 | CLI 工具链规范 | CLI + Skill 协同基线 | Skill 驱动 + CLI 底层能力 |
| 架构 | 无 | CLI 单层 | CLI + Skill 双层（明确主权） | 继承 v6 主权 + 架构细化 |
| 阶段 | 6 阶段 | 8+2 阶段 | 8+2（继承 v5） | 8+2（继承，补终态定义） |
| ID 体系 | 4 种 | 8 种 | 8 种（继承 v5） | 8 种（继承） |
| 追踪 | 手动矩阵 | 自动化矩阵 + 9 覆盖率 | 继承 v5 | 继承 + 健康分 |
| Gate | 无 | 8 Gate + SCA | 继承 v5 | 继承 + Hook 化双层体系 |
| AI 协作 | 无 | Context Pack + Catchup | 3 协同 Skill | 3 协同 + 8 阶段 Skill |
| 变更管理 | 无 | RFC + Defect FSM | 继承 v5 | 继承 |
| 度量 | 无 | 9 覆盖率 | 继承 v5 | 12 指标 + 健康分 + 瓶颈分析 |
| 多端 | 无 | GitHub/GitLab/Azure | 继承 v5 | 继承 + PlatformAdapter |
| 裁剪 | 无 | Mode×Size | 三层合并 | 继承 v6（含合并示例） |

### v7.1 相对 v6 的核心增量

1. **8 个阶段 Skill 定义**（全新）— 每个阶段有对应的 AI 辅助 Skill + 5 阶段执行模型
2. **双层架构细化** — 在 v6 主权定义基础上，细化 7 个核心模块（M1-M7）和职责边界
3. **度量体系增强** — 从 9 项覆盖率扩展到 12 项指标 + 健康分 + 瓶颈分析
4. **Hook 化 Gate 体系**（细化）— Layer A（AI Runtime）+ Layer B（Git/CI）双层 Hook
5. **Context Pack 标准化**（细化）— YAML 格式定义 + <2KB 约束
6. **终态定义补全** — 08_done / 09_cancelled 的进入条件、审计要求、不可逆规则
7. **As-Is/To-Be 标签** — 每项能力标注实际状态，避免预期失真

---

## 附录

### A. 术语表

| 术语 | 含义 |
|------|------|
| FR | Functional Requirement（功能需求） |
| NFR | Non-Functional Requirement（非功能需求） |
| DS | Design Specification（设计规格） |
| AC | Acceptance Criteria（验收标准） |
| TC | Test Case（测试用例） |
| ADR | Architecture Decision Record（架构决策记录） |
| RFC | Request for Change（变更请求） |
| SCA | Spec-Consistency-Analysis（规范一致性分析） |
| Gate | Quality Gate（质量门禁） |
| FEAT | Feature Abbreviation（功能缩写） |

### B. 参考文档

- `docs/01需求文档/spec-first-v5.md` — v5 完整规范（本文档的前序版本）
- `docs/02技术方案/` — 技术设计文档
- `skills/spec-first/AGENTS.md` — Skill 全局指令
- `skills/spec-first/*/SKILL.md` — 各 Skill 指令文件

---

*文档结束 — spec-first-v7.1.md（2026-02-09 基线收敛版）*
