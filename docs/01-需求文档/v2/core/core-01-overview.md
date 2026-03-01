# Spec-First v7.1 — 产品概览与角色

> **模块**: 核心研发流程 #1 | **拆分自**: spec-first-v7.md L1-316
> **版本**: v7.1 | **更新**: 2026-02-09

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

**用户入口约束**：用户（人类 + AI Agent）恒通过 `/spec-first:*` 统一入口操作（含 Skill 路由与 Runtime 路由），**不直接裸调 CLI 命令**。CLI 仅作为 Skill 内部实现和 Git/CI Hook 的底层调用目标。纯自动化场景（Hook、CI Pipeline）可直接调用 CLI。

### 变更总览

| 变更类型 | 内容 | 价值 |
|---------|------|------|
| **架构升级** | 双层架构：Skill 驱动编排 + CLI 确定性执行 | Skill 负责流程推进，CLI 保证可回放 |
| **新增** | Skill 指令体系：16 个 Skill 定义（统一 `/spec-first:xxxx`）、6 阶段执行模型（Phase 0-5）、跨平台兼容 | 回答"AI 怎么协作" |
| **新增** | CLI 命令体系：13 个命令组、7 个核心模块（M1-M7） | 回答"工具怎么用" |
| **重构** | 主流程 8+2 阶段与 Skill/CLI 的映射关系 | 每个阶段有明确的工具支撑 |
| **精简** | 产品用例体系从 21 个详述精简为用例清单 + 关键用例详述 | 降低文档维护成本 |
| **继承** | v6.0 全部冻结决策 + v5.0 核心能力 | 基线一致性 |

---

## 产品愿景与定位

### 一句话定位

**Spec-First 是面向 AI 时代的规范驱动研发流程引擎**——以结构化规范为单一真理源，通过全链路追踪 + AI 辅助 + 自动化门禁，将"需求→设计→编码→测试→交付"从人工驱动升级为规范驱动。

### 要解决的核心问题

> 以下 11 个问题覆盖 5 个问题域，是 Spec-First 立项的核心驱动力。

**A. AI 能力治理（2 项）**

| # | 问题 | 现状痛点 | Spec-First 解法 |
|---|------|---------|----------------|
| 1 | **AI 使用能力参差不齐** | 80+ 人团队中约 20% 能熟练使用 AI，剩余 80% 要么不用、要么引入更多 bug；效率差异达 3-5 倍 | **Skill 指令体系**（16 个标准化 `/spec-first:xxxx` Skill）统一 AI 协作入口，将个人能力差异收敛为流程标准化 |
| 2 | **团队 AI 使用缺乏标准化** | 5+ 种 AI 使用模式并存，prompt 复用率不足 10%，新人上手周期 2-4 周 | **Skill 指令 + Context Pack**：封装最佳 prompt 和执行流程，自动注入项目上下文 |

**B. 研发质量（3 项）**

| # | 问题 | 现状痛点 | Spec-First 解法 |
|---|------|---------|----------------|
| 3 | **AI 生成代码质量不可控** | 幻觉、安全漏洞、不符合规范；AI 代码缺陷密度约为人工 1.5-2 倍 | **三层规范 + Gate 自动校验 + Hook 拦截** |
| 4 | **AI 产出物无法追溯** | PR 中 AI 代码占 30-50%，仅 5% 有追踪标记；AI 缺陷根因定位多 40% | **强制携带 traces + 反向合规率检测** |
| 5 | **Gate 检查靠人工** | 人工检查遗漏率 30-50%；设计遗漏到测试才发现，修复成本放大 5-10 倍 | **Hook 化 Gate 自动阻断 + 覆盖率量化** |

**C. 研发效率（2 项）**

| # | 问题 | 现状痛点 | Spec-First 解法 |
|---|------|---------|----------------|
| 6 | **需求到代码的断裂** | 上下文缺失导致无效生成占 30%+；需求偏差返工占 35-45% | **FR/NFR 结构化 + Context Pack 自动注入** |
| 7 | **需求失真与过度实现** | 返工成本占 15-25%；过度实现占 10-20%，维护成本 3-5 倍 | **反向合规率 + 孤儿项率自动检测** |

**D. 全流程 AI 融合（3 项）**

| # | 问题 | 现状痛点 | Spec-First 解法 |
|---|------|---------|----------------|
| 8 | **AI 上下文丢失与会话断裂** | 长会话后输出质量下降 30%；恢复上下文耗时 15-30 分钟 | **Session Catchup + Context Pack 持久化** |
| 9 | **变更管理中 AI 角色缺失** | 变更后下游未同步 50-70%；变更引发回归缺陷占 20-30% | **三级变更管理 + ID 链自动影响分析** |
| 10 | **研发全流程 AI 融合不足** | AI 在编码渗透率 60-70%，需求/设计/测试不足 15% | **8 阶段全覆盖 Skill 指令体系** |

**E. 知识管理（1 项）**

| # | 问题 | 现状痛点 | Spec-First 解法 |
|---|------|---------|----------------|
| 11 | **AI 辅助过程中知识沉淀缺失** | 技术决策复用率不足 15%；同类问题重复调研 40% | **结构化产出物模板 + 追踪矩阵** |

**问题总结**：共性根因三点——**AI 协作无标准**、**规范与实现脱节**、**过程知识不沉淀**。解决思路：以结构化规范为单一真理源，通过 Skill 统一 AI 协作入口，通过全链路 ID 追踪 + Gate 自动校验确保一致性，通过 Context Pack + Session Catchup 解决上下文断裂。

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
| 流程定义 | 8 主阶段 + 2 终态、Gate、横切机制 | 项目管理（排期、资源分配） |
| 规范标准 | 产出物模板、ID 体系、追踪矩阵 | 具体业务领域建模 |
| 工具实现 | CLI（13 命令组）+ Skill（16 个） | IDE 插件（v7.1 不含，vNext 可选扩展）、Jira 深度定制 |
| AI 协作 | Skill 执行模型、Context Pack、Session Catchup、confirm_policy（三档确认） | AI 模型训练、私有化部署 |
| 度量体系 | 覆盖率、合规率、返工率、Gate 通过率 | 人效评估、绩效考核 |

### 流程适用边界

**适用**：多人协作 Feature（≥2 人）、API/数据模型变更、跨团队依赖、核心业务功能。

**不适用**：

| 场景 | 替代方案 |
|------|---------|
| 紧急 Hotfix | 直接修复 → 事后补 RFC |
| 纯配置变更 | 走 DevOps 变更流程 |
| 文档修正 | 直接 PR |
| 技术债务清理 | 简化为 Init → Plan → Implement → Verify |
| 单人 1 天内微调 | 简化为 Specify → Implement → Verify |

---

## 角色与用户画像

### Actor 总览

| Actor ID | 角色 | 类型 | 核心职责 | 参与阶段 |
|----------|------|------|---------|---------|
| **A1** | PM（产品经理） | 人类 | 需求定义、优先级判定、UAT 验收 | 01, 05, 06 |
| **A2** | Tech Lead | 人类 | 架构决策、Gate 终审、流程守护 | 00-06 全阶段 |
| **A3** | Developer | 人类 | 编码实现、单元测试、Code Review | 03, 04, 05 |
| **A4** | QA Lead | 人类 | 测试设计/执行、安全扫描 | 01(C), 02(C), 05 |
| **A5** | Architect | 人类 | 架构评审（L 规模必须参与） | 02 |
| **A6** | AI Agent | 系统 | Skill 指令执行规范生成、代码辅助 | 01-06（辅助） |
| **A7** | CI/CD System | 系统 | 自动化校验、流水线执行 | 04, 05 |

### 用户画像摘要

| Actor | 核心痛点 | 期望收益 |
|-------|---------|---------|
| **A1 PM** | 需求做偏了上线才发现；变更影响不可知；验收无法确认全覆盖 | FR 可追踪到代码和测试；变更影响自动定位；矩阵一目了然 |
| **A2 Tech Lead** | Gate 靠人工易遗漏；不知哪些 TASK 无需求依据；多端追踪混乱 | Gate 自动阻断；覆盖率/合规率量化；并行隔离保障 |
| **A3 Developer** | 不清楚 TASK 对应哪条需求；Commit/PR 格式易忘；AI 代码是否合规 | TASK traces 到 FR；Hook 自动校验；AI 代码携带追踪注释 |
| **A4 QA Lead** | 测试是否覆盖所有需求；漏测背锅；回归范围难界定 | Test 覆盖率 = 100% 硬指标；TC verifies FR/AC；变更自动定位回归范围 |
| **A5 Architect** | 架构决策无结构化记录；设计与需求脱节 | DS ID 可追踪；ADR 强制记录；Design Review Gate |
| **A6 AI Agent** | — | Skill 加载→推理→审核→修正→签核；产出物强制携带 traces |

> 完整用户画像详述参见 spec-first-v7.md L212-272。

### 产品用例清单

#### A. 主流程用例（9 个）

| 用例 ID | 名称 | 主 Actor | 对应阶段 | 对应 Skill/CLI |
|---------|------|---------|---------|---------------|
| UC-001 | Feature 初始化 | A2 Tech Lead | 00. Init | `/spec-first:init` + CLI: `spec-first init` |
| UC-002 | 需求规格化 | A1 PM + A6 AI | 01. Specify | `/spec-first:spec` + CLI: `spec-first id next FR/NFR <abbr>` |
| UC-003 | 技术设计 | A2 + A6 | 02. Design | `/spec-first:design` + CLI: `spec-first id next DS <abbr>` |
| UC-004 | 技术调研 | A2 + A6 | 02. Design | `/spec-first:research` |
| UC-005 | 任务拆解 | A2 + A6 | 03. Plan | `/spec-first:task` + CLI: `spec-first id next TASK <abbr>` |
| UC-006 | 规范驱动开发 | A3 + A6 | 04. Implement | `/spec-first:code` + CLI: `spec-first matrix check` |
| UC-020 | 代码评审 | A2 + A3 + A6 | 04. Implement | `/spec-first:code-review` + CLI: `spec-first gate check` |
| UC-007 | 测试验证 | A4 + A6 | 05. Verify | `/spec-first:test` + CLI: `spec-first metrics coverage` |
| UC-008 | 归档复盘 | A2 + A6 | 06. Wrap-up | `/spec-first:archive` + CLI: `spec-first gate check` |

#### B. 横切用例（5 个）

| 用例 ID | 名称 | 主 Actor | 触发条件 | 对应 Skill/CLI |
|---------|------|---------|---------|---------------|
| UC-009 | Gate 校验 | A7 + A2 | 阶段切换时 | `/spec-first:verify`（用户入口）→ 内部调用 CLI: `spec-first gate check` + Hook 自动触发 |
| UC-010 | Commit 合规校验 | A7 | Git commit 时 | Git Hook: `commit-msg`（自动化，非用户直调） |
| UC-011 | 一致性校验（SCA） | A7 | 5 个触发时机 | `/spec-first:verify`（用户入口）→ 内部调用 CLI: `spec-first matrix check` |
| UC-012 | 变更管理（RFC） | A1 + A2 | 需求/设计变更时 | `/spec-first:rfc`（用户入口）→ Runtime 路由到 CLI: `spec-first rfc create`；`/spec-first:orchestrate` 在编排流程中自动触发 RFC |
| UC-013 | 缺陷管理 | A4 | 缺陷发现时 | `/spec-first:verify`（用户入口）→ 内部调用 CLI: `spec-first defect register` |

#### C. AI 协作用例（3 个）

| 用例 ID | 名称 | 触发条件 | 对应 Skill/CLI |
|---------|------|---------|---------------|
| UC-014 | 会话恢复 | 会话中断后 | `/spec-first:catchup` |
| UC-015 | Context Pack 生成 | Agent 委派时 | Skill 内部调用 CLI: `spec-first ai context`（Agent 自动化，非用户直调） |
| UC-016 | AI 编码统计 | AI 会话结束时 | Skill 内部调用 CLI: `spec-first ai stats`（Agent 自动化，非用户直调） |

#### D. 运维用例（3 个）

| 用例 ID | 名称 | 触发条件 | 对应 Skill/CLI |
|---------|------|---------|---------------|
| UC-017 | 度量报告 | Feature 完成后 | `/spec-first:status` + CLI: `spec-first metrics coverage` |
| UC-018 | 环境诊断 | 首次使用时 | `/spec-first:doctor` |
| UC-019 | 反向同步（Hotfix/Sync） | 手工改动后需回填规范时 | `/spec-first:sync <file_path>`（用户入口）→ 内部调用 `matrix check + gate check`，必要时触发 RFC 草案 |

---

*core-01-overview.md 完成 — 下一篇：[core-02-architecture.md](core-02-architecture.md)*
