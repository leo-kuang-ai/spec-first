# Spec-First v7.1 — 主流程 8+2 阶段

> **模块**: 核心研发流程 #4 | **拆分自**: spec-first-v7.md L696-937
> **版本**: v7.1 | **更新**: 2026-02-09

---

## 00. Init（Feature 启动）

| 维度 | 内容 |
|------|------|
| **目标** | 启动 Feature，确定 Mode/Size/涉及端，创建工作空间 |
| **活动** | 读取 Constitution → 确定 Mode（N/I）→ 确定 Size（S/M/L）→ 确定涉及端 → 创建 Feature 目录 → 初始化运行态三文件 |
| **产出物** | Feature 目录结构、Feature 元数据（mode, size, platforms）、`task_plan.md` / `findings.md` / `stage-state.json`（初始化） |
| **Exit Gate** | 目录结构就绪，Mode/Size/涉及端已确认并记录 |
| **工具支撑** | Skill: `/spec-first:init`（交互引导） / CLI: `spec-first init --feat <abbr> --mode <N|I> --size <S|M|L> --platforms <p1,p2,...>` |

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

## 01. Specify（需求规格化）

| 维度 | 内容 |
|------|------|
| **目标** | 将业务意图转化为带唯一 ID 的结构化需求契约 |
| **活动** | 需求分析 → 结构化 PRD → ID 分配（FR/NFR）→ Clarify |
| **产出物** | `spec.md`（含 FR-FEAT-NNN, NFR-DIM-NNN）、`traceability-matrix.md`（初始化） |
| **Exit Gate** | DoR Sign-off + 无 `[NEEDS CLARIFICATION]` 标记 + 所有 FR/NFR 已分配 ID |
| **工具支撑** | Skill: `/spec-first:spec` / CLI: `spec-first id next FR <abbr>` |

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

## 02. Design（技术设计）

| 维度 | 内容 |
|------|------|
| **目标** | 将需求规格转化为可实现的技术方案，API 端点分配唯一 ID |
| **活动** | Research → 技术选型 → 架构设计 → API 契约设计（纳入 DS 的 `api_ref` 属性）→ 数据建模 |
| **产出物** | `research.md`, `design.md`, `contracts/`, `data-model.md`, ADR |
| **Exit Gate** | 设计评审 + Spec-Consistency-Analysis + API 覆盖率 = 100% |
| **工具支撑** | Skill: `/spec-first:design`, `/spec-first:research` / CLI: `spec-first id next DS <abbr>` |

**子产出物**：

1. **Research**：技术可行性调研、备选方案对比（含 Trade-off 分析）、第三方依赖评估
2. **Technical-Design**：架构决策与技术选型（ADR + 系统架构图 + Decisions & Rationale）
3. **API-Design**：OpenAPI Spec / GraphQL Schema，每个端点在 DS 中通过 `api_ref` 引用
4. **Data-Modeling**：ERD、State Machine Diagram、数据字典

**追踪矩阵更新**：填充 Design Ref 列（含 API 契约的 `api_ref` 属性）。

---

## 03. Plan（任务规划）

| 维度 | 内容 |
|------|------|
| **目标** | 将技术设计拆解为带 ID 的可执行任务清单 |
| **活动** | 任务拆解（分配 TASK-FEAT-NNN）→ 依赖分析 → Checklist 生成 |
| **产出物** | `task_plan.md`（含 TASK-FEAT-NNN + traces）, `checklist.md` |
| **Exit Gate** | 任务评审 + Task 覆盖率 = 100% + Task 合规率 = 100% |
| **工具支撑** | Skill: `/spec-first:task` / CLI: `spec-first id next TASK <abbr>` |

**任务拆解标准**：

- 每个任务分配 `TASK-<FEAT>-NNN`，必须包含 `traces: [FR-<FEAT>-NNN, ...]`
- 任务粒度：单人 1-3 天可完成
- 依赖关系显式标注：`depends_on: [TASK-<FEAT>-NNN]`
- 可并行任务标记：`parallel: true`

**Checklist**：从 AC 派生的验证场景清单，作为 Implement 和 Verify 的输入。

**追踪矩阵更新**：填充 Task Ref 列，校验 Task 覆盖率。

---

## 04. Implement（规范驱动开发）

| 维度 | 内容 |
|------|------|
| **目标** | 按任务清单实现代码，确保每行代码可追溯到需求 |
| **活动** | 按 TASK 开发（`/spec-first:code`）→ TDD → Code Review（`/spec-first:code-review`，含追踪合规审查） |
| **产出物** | 代码实现、单元测试、`reports/code-review-report.md`（格式规范见 [`code-review-integration.md` 第四章](../../02技术方案/V2/code-review-integration.md#四cr-report-格式规范)） |
| **Exit Gate** | Code CR 通过 + 单元测试代码覆盖率 ≥ 80% + PR 合规率 = 100% |
| **工具支撑** | Skill: `/spec-first:code`, `/spec-first:code-review` / CLI: `spec-first gate check` |

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

**执行顺序约束**：

- 04 阶段必须先执行 `/spec-first:code`，再执行 `/spec-first:code-review`。
- 未完成 `/spec-first:code-review` 的 Feature，不得 `stage advance` 到 05_verify。

**审查粒度与范围**：

| 模式 | 触发方式 | 范围 | 适用场景 |
|------|---------|------|---------|
| **per-TASK**（默认） | `/spec-first:code-review <featureId> --task <taskId>` | 该 TASK 关联的 commits | 单个 TASK 完成后立即审查 |
| **per-Feature** | `/spec-first:code-review <featureId>` | Feature 分支全量 diff | 所有 TASK 完成后整体审查 |

- **推荐实践**：per-TASK 审查（小步快审，问题早发现）。per-Feature 仅用于最终汇总确认。
- **范围确定**：per-TASK 通过 `git log --grep="TASK-<FEAT>-NNN"` 定位关联 commits；per-Feature 通过 `git diff main..HEAD` 获取全量变更。
- **大 diff 策略**：≤500 行一次性审查；500-2000 行按模块分批；>2000 行先输出文件级摘要再深入。

**Code Review 标准（A+B 双类 9 维度）**：

> 完整审查规范详见 [`code-review-integration.md`](../../02技术方案/V2/code-review-integration.md)。

**A 类：追踪合规**（Spec-First 核心价值，优先审查）

| 维度 | 审查内容 | 判定 |
|------|---------|------|
| A1 功能正确性 | 实现是否满足对应 FR 的所有 AC（逐条比对 Given-When-Then） | 二元（通过/不通过） |
| A2 契约一致性 | 代码是否与 `contracts/*.yaml` 和 `data-model.md` 一致 | 二元 |
| A3 Constitution 合规 | 是否违背 `constitution.md` 6 维度约束 | 二元 |
| A4 追踪合规 | PR 关联 TASK ID、TASK 有 FR 依据、代码含追踪注释 | 二元（硬性阻断） |

**B 类：代码质量**（复用 `code-review-expert` 审查体系）

| 维度 | 审查内容 | 参考清单 |
|------|---------|---------|
| B1 SOLID + 架构异味 | SRP/OCP/LSP/ISP/DIP 违规、God Object、Feature Envy 等 | `references/solid-checklist.md` |
| B2 安全与可靠性 | XSS/注入/SSRF、AuthN/AuthZ 缺口、密钥泄露、竞态条件 | `references/security-checklist.md` |
| B3 错误处理 | 吞异常、过宽 catch、错误信息泄露、异步错误未处理 | `references/code-quality-checklist.md` |
| B4 性能与缓存 | N+1 查询、热路径重计算、缓存缺失/失效、无界集合 | `references/code-quality-checklist.md` |
| B5 边界条件 | null/undefined、空集合、数值溢出/除零、off-by-one | `references/code-quality-checklist.md` |

**严重等级（P0-P3）**：

| 等级 | 定义 | 典型场景 |
|------|------|---------|
| P0 Critical | 安全漏洞、数据丢失、正确性 Bug | SQL 注入、密钥硬编码、AC 未满足 |
| P1 High | 逻辑错误、严重 SOLID 违规、性能退化 | God Object、N+1 查询、追踪链断裂 |
| P2 Medium | 代码异味、可维护性问题 | 过长方法、缺少错误处理 |
| P3 Low | 风格、命名、轻微建议 | 命名不一致、Magic Number |

**Gate 通过判定**：`APPROVE = (A 类全部通过) AND (P0 == 0) AND (P1 == 0)`

- A 类任一不通过 或 B 类 P0 > 0 → **REQUEST_CHANGES**（阻断）
- P1 > 0 → **REQUEST_CHANGES**（应在合并前修复）
- 仅 P2/P3 → **APPROVE**（附建议，可过 Gate）

**阻断修复闭环**：

当 Code Review 判定为 REQUEST_CHANGES 时，进入修复→重审循环：

1. CR Report 输出阻断项清单 + Next Steps 四选一（全部修复 / 仅 P0P1 / 指定项 / 不修改）
2. 开发者按选择修复代码
3. 重新执行 `/spec-first:code-review`（增量审查：仅修复部分 + 原阻断项复查）
4. 判定 APPROVE → 可过 Gate；仍 REQUEST_CHANGES → 继续循环

- **无进展检测**：连续 2 轮阻断项数量未减少 → 提示升级为 RFC 或请求人工介入
- **历史保留**：每轮审查结果追加到 `gate-history.jsonl`，CR Report 仅保留最新版

> 完整修复闭环流程详见 [`code-review-integration.md` 第六章](../../02技术方案/V2/code-review-integration.md#六阻断修复闭环)。

**追踪矩阵更新**：填充 PR Ref 列。

---

## 05. Verify（验证）

| 维度 | 内容 |
|------|------|
| **目标** | 验证实现是否满足所有 AC 和 NFR，每个 TC 可追溯到需求 |
| **活动** | 测试设计（分配 TC-LVL-FEAT-NNN）→ 测试执行 → 安全扫描 → UAT |
| **产出物** | Test Report, Security Report, UAT Sign-off |
| **Exit Gate** | 全部 AC 通过 + 安全无高危（按 `core-05` 的 S1-S4 映射） + Test 覆盖率 = 100% + TC 合规率 = 100% |
| **工具支撑** | Skill: `/spec-first:test` / CLI: `spec-first id next TC <abbr>`, `spec-first metrics coverage` |

**子活动**：

1. **Test-Design**：每个 TC 分配 `TC-<LVL>-<FEAT>-NNN`，必须包含 `verifies: [FR-<FEAT>-NNN/AC-N]`
2. **Test-Execution**：集成测试 + 回归测试 + Coverage Matrix
3. **Security-Review**（按 Size 分级）：

   | Size | 必须 | 推荐 |
   |------|------|------|
   | S | OWASP Top 10 + 依赖扫描（Software Composition Analysis） | — |
   | M | OWASP Top 10 + 依赖扫描 + SAST | DAST |
   | L | OWASP Top 10 + 依赖扫描 + SAST + DAST | 渗透测试 |

   > 当 Feature 存在 `NFR-SEC-*` 时，无论 Size，SAST 为必须项。

4. **UAT**：基于 AC 的端到端验收，UAT Sign-off 作为本阶段 Exit Gate

**Mode I 额外活动**：回归验证 → 产出 `regression-report.md`。

**追踪矩阵更新**：填充 Test Case Ref 列，校验 Test 覆盖率。

---

## 06. Wrap-up（收尾）

| 维度 | 内容 |
|------|------|
| **目标** | 复盘交付，归档文档，确保追踪矩阵完整闭环 |
| **活动** | 复盘 → 文档归档 → Spec 同步 → 追踪矩阵最终校验 |
| **产出物** | `retro.md`, 更新后的 Spec 文档, 完整的 `traceability-matrix.md` |
| **Exit Gate** | 文档完整性 + 实现覆盖率 = 100% + 追踪矩阵 Status 全部为 Accepted、Cancelled 或 Exception（须有有效豁免） |
| **工具支撑** | Skill: `/spec-first:archive` / CLI: `spec-first metrics coverage`, `spec-first gate check` |

**关键活动**：

- Retrospective：回顾流程执行情况
- 文档归档：按归档清单逐项检查
- Spec 同步：如有实现偏差，更新 Spec 使其与最终实现一致
- 追踪矩阵最终校验：确认所有 FR/NFR 的 Status 为 Accepted、Cancelled 或 Exception（Exception 须有有效豁免）
- Action Items：提炼改进项

**归档清单**（19 项，Exit Gate 检查依据）：

| 来源阶段 | 归档文件 | 检查标准 |
|---------|---------|---------|
| 00 Init | `constitution.md` | 版本与实际执行一致 |
| 01 Specify | `spec.md` | 与最终实现对齐，无过期 AC |
| 01 Specify | `traceability-matrix.md` | 所有行 Status 为 Accepted、Cancelled 或 Exception |
| 02 Design | `design.md` | 与最终实现对齐 |
| 02 Design | `contracts/*.yaml` | 与实际 API 签名一致 |
| 02 Design | `data-model.md` | 与实际 Schema 一致 |
| 02 Design | `adr/*.adr.md` | 决策记录完整 |
| 03 Plan | `task_plan.md` | 所有 Task 状态已闭合 |
| 03 Plan | `checklist.md` | 验证清单已完成 |
| 04 Implement | 代码 + 单元测试 | CR 通过，代码覆盖率 ≥ 80% |
| 04 Implement | `reports/code-review-report.md` | 评审结论为通过，且追踪合规无阻断项 |
| 05 Verify | `tests/*.test.md` | 测试用例已归档 |
| 05 Verify | `reports/test-report.md` | 测试执行报告已归档 |
| 05 Verify | `reports/security-scan.md` | 安全扫描报告已归档 |
| 05 Verify | `reports/uat-signoff.md` | 验收签核记录已归档 |
| 横切 C | `rfc/*.rfc.md` | 所有变更请求已闭合 |
| 06 Wrap-up | `retro.md` | 复盘完成，Action Items 已提炼 |
| 全阶段 | `task_plan.md` | 规划记录完整 |
| 全阶段 | `findings.md` | 过程发现已归档 |
| 全阶段 | `stage-state.json` | 进度记录完整 |

---

## 07. Release（发布）

| 维度 | 内容 |
|------|------|
| **目标** | 将已验收的 Feature 构建并提交发布，确保构建产物通过 Smoke Test |
| **活动** | 构建 → Smoke Test → 提交公司 DevOps 平台发布 |
| **产出物** | Release Note, Smoke Test 报告 |
| **Exit Gate** | Smoke Test 通过 + 核心指标无异常 |
| **工具支撑** | — （构建由 CI 承载，部署由公司 DevOps 平台承载） |

> **边界说明**：部署策略（蓝绿/金丝雀等）、回滚方案、发布后观察窗口均由公司内部 DevOps 平台管理，不在 Spec-First 范围内。

---

## 终态定义（08_done / 09_cancelled）

> 终态一旦进入，不可逆转。

| 终态 | 进入条件 | 进入路径 | 审计要求 |
|------|---------|---------|---------|
| **08_done** | 07 Release 的 Exit Gate 通过（Smoke Test + 核心指标无异常） | `spec-first stage advance` 从 07_release 推进 | 追踪矩阵全部 Accepted/Cancelled/Exception；归档清单全部勾选 |
| **09_cancelled** | 项目决策取消该 Feature（必须记录取消原因） | `spec-first stage cancel <featureId> --reason "<reason>"`，任何阶段均可触发 | 取消原因存档；已产出物保留不删除；追踪矩阵标记 Cancelled |

**不可逆规则**：

- 进入 `08_done` 或 `09_cancelled` 后，禁止再次 `advance` 或修改阶段状态
- 如需对已完成的 Feature 进行变更，应创建新的 Feature（Mode I）引用原 Feature ID
- 代码常量定义见 `src/shared/constants.ts:55-67`

---

*core-04-process.md 完成 — 下一篇：[core-05-cross-cutting.md](core-05-cross-cutting.md)*
