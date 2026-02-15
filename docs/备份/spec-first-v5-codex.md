# Spec-First 研发流程规范 v5.0（Codex）

> **版本**: v5.0-codex | **更新**: 2026-02-06 | **作用域**: Feature 级别
> **兼容基线**: 完整兼容 v3.0（含双模式、多端、全链路追踪）
> **核心理念**: 规范即契约、规范即真理、全链路可追踪、门禁可机器判定
> **关键词约定**: `MUST`（必须）、`SHOULD`（推荐）、`MAY`（可选）

---

## v5.0 变更摘要（相对 v3.0）

| 变更类型 | 内容 | 目标 |
|---------|------|------|
| **继承** | 三层规范体系（Layer 0/1/2） | 保留 v3 的可扩展结构 |
| **继承** | 双模式（Mode N / Mode I）+ S/M/L 分级 | 保留 v3 的流程弹性 |
| **继承** | 全链路 ID 体系 + 追踪矩阵 + 覆盖率算法 | 保留 v3 的可追踪主干 |
| **增强** | Quality Gate 五元组量化（输入/检查器/阈值/责任人/失败动作） | 消除“评审通过”主观性 |
| **增强** | API 兼容性门禁（OpenAPI Diff + SemVer + Consumer Contract） | 降低接口演进风险 |
| **增强** | 安全基线（OWASP ASVS 控制项映射） | 从“扫漏洞”升级到“控风险” |
| **增强** | NFR 证据化（性能/可用性/可靠性/可观测） | 提升非功能验收可信度 |
| **增强** | Change-Management 紧急通道 SLA（24h 补录） | 兼顾事故响应与审计完整性 |
| **增强** | 分支与发布规则（Branch/Tag/Release Note） | 打通流程与交付流水线 |
| **增强** | AI 统计并入 Retro 与质量看板 | 让统计数据进入治理闭环 |

---

## 核心架构

### 三层规范体系（保留 v3）

```text
Layer 0: 通用流程框架（7+3）
  - 定义流程骨架、阶段目标、横切机制、追踪体系

Layer 1: 模式 × 规模规则
  - Mode N / Mode I
  - Size S / M / L
  - 定义每种组合的产出物深度和校验强度

Layer 2: 端特有规范
  - APP / PC / H5 / Backend / ...
  - 定义端约束、端交付物、端 Gate 附加项
```

**执行合并规则（MUST）**：
- Feature 启动时必须确定 `mode`、`size`、`platforms`。
- 执行实例 = Layer 0 基线 + Layer 1 组合规则 + Layer 2 涉及端规则。

### 双模式定义（保留 v3）

| 维度 | Mode N（New Feature） | Mode I（Iteration） |
|------|----------------------|---------------------|
| 起点 | 无历史产物 | 基于已有产物增量变更 |
| 产出方式 | 全新创建 | 增量更新（diff） |
| 必要附加环节 | — | 历史产物定位、Impact Analysis、回归验证 |

**Mode I 强制项（MUST）**：
- `00.Init` 必须定位历史产物。
- `01.Specify` 必须产出 `impact-analysis.md`。
- `05.Verify` 必须产出 `regression-report.md`。

### 规模分级 S/M/L（保留 v3）

| 维度 | S | M | L |
|------|---|---|---|
| 端点数 | 1-2 | 3-5 | 6+ |
| AC 数量 | ≤5 | 6-15 | 16+ |
| API 变更 | 0-1 | 2-5 | 6+ 或新增服务 |
| 数据模型 | 无 | 字段级 | 表级/新增实体 |
| 跨团队依赖 | 无 | 1 团队 | 2+ 团队 |

**判定规则（MUST）**：5 维度取最高级别。

---

## 流程总览（7 阶段）

```text
00 Init      Feature 启动（Mode/Size/端确认）
01 Specify   需求规格化（FR/NFR + Clarify + 矩阵初始化）
02 Design    研究与技术设计（Research + Plan + Contract + Data）
03 Plan      任务规划（TASK + 依赖 + Checklist）
04 Implement 规范驱动开发（TDD + CR + 追踪合规）
05 Verify    验证（TC + 安全 + UAT + 回归）
06 Wrap-up   收尾（归档 + 复盘 + 矩阵闭环）
```

---

## 全链路追踪体系（保留并增强 v3）

### ID 作用域与类型

| ID | 定义阶段 | 位置 | 示例 |
|----|---------|------|------|
| `FR-NNN` | 01 | `spec.md` | `FR-001` |
| `NFR-NNN` | 01 | `spec.md` | `NFR-001` |
| `API-NNN` | 02 | `contracts/*.yaml` | `API-001` |
| `TASK-NNN` | 03 | `tasks.md` | `TASK-001` |
| `TC-NNN` | 05 | `tests/*.test.md` | `TC-001` |
| `ADR-NNN` | 02 | `adr/NNN-*.adr.md` | `ADR-001` |
| `RFC-NNN` | 横切 C | `rfc/NNN-*.rfc.md` | `RFC-001` |

**规则（MUST）**：
- ID 在单 Feature 内唯一且不可复用。
- `TASK` 必须关联至少一个 `FR/NFR`。
- `TC` 必须关联至少一个 `FR/AC`。
- PR 必须关联至少一个 `TASK`。
- 跨 Feature 引用使用 `Feature-NNN:ID`（示例：`001:FR-003`）。

### 跨产物引用格式（保留并增强 v3）

| 场景 | 格式 | 示例 |
|------|------|------|
| tasks 引用需求 | `traces: [FR-NNN, ...]` | `traces: [FR-001, NFR-001]` |
| 测试引用 AC | `verifies: [FR-NNN/AC-N]` | `verifies: [FR-001/AC-2]` |
| 代码注释 | `implements: TASK-NNN, traces: FR-NNN` | `// implements: TASK-001, traces: FR-001` |
| Commit Message | `[TASK-NNN] <message>` | `[TASK-001] implement signup api` |
| PR 描述 | `Implements: TASK-NNN` | `Implements: TASK-001, TASK-002` |
| 跨 Feature 引用 | `Feature-NNN:ID` | `001:FR-003` |

### 追踪矩阵

**标准文件**：`traceability-matrix.md`

| 需求 ID | Design Ref | API/Data Ref | Task Ref | Test Ref | PR Ref | 状态 |
|---------|------------|--------------|----------|----------|--------|------|
| FR-001 | plan.md §2.1 | API-001 | TASK-001 | TC-001 | #123 | ✅ |

**生命周期（MUST）**：
- 01 创建需求行。
- 02 补齐设计与契约映射。
- 03 补齐任务映射。
- 05 补齐测试映射。
- 04~06 补齐 PR 与最终状态。

### 覆盖率与合规率（增强）

| 指标 | 公式 | Gate |
|------|------|------|
| Task 覆盖率 | `FR(>=1 TASK) / FR 总数` | 03 |
| Test 覆盖率 | `FR(>=1 TC) / FR 总数` | 05 |
| 实现覆盖率 | `FR(>=1 PR) / FR 总数` | 06 |
| API 覆盖率 | `FR(需API且>=1 API) / FR(需API)` | 02 |
| Task 合规率 | `TASK(>=1 FR/NFR) / TASK 总数` | 03 |
| TC 合规率 | `TC(>=1 FR/AC) / TC 总数` | 05 |
| PR 合规率 | `PR(>=1 TASK) / PR 总数` | 04 |
| NFR 证据覆盖率 | `有验证证据 NFR / NFR 总数` | 05/06 |
| 孤儿项率 | `无需求依据项 / 总实现项` | 03~06 |

**默认阈值（MUST）**：
- 覆盖率与合规率 = `100%`
- 孤儿项率 = `0%`

---

## 主流程细则

### 00. Init（Feature 启动）

- **目标**：初始化 Feature 实例并冻结流程参数。
- **输入**：需求简述、项目 Constitution、平台规则。
- **产出**：`feature.yaml`（新增）、Feature 目录骨架。
- **Gate**：Mode/Size/Platforms 已确认。

`feature.yaml` 示例：

```yaml
feature_id: 001
name: user-auth
mode: I
size: M
platforms: [H5, Backend]
owners:
  pm: zhangsan
  tech_lead: lisi
```

### 01. Specify（需求规格化）

- **目标**：形成可验证、可追踪的需求契约。
- **活动**：Analysis → Structured PRD → ID 分配 → Clarify。
- **产出**：`spec.md`、`traceability-matrix.md`。
- **Mode I 增量**：`impact-analysis.md`（MUST）。
- **Gate**：DoR 签核；无 `[NEEDS CLARIFICATION]`。

### 02. Design（研究与技术设计）

- **目标**：将需求映射为可实施方案与契约。
- **活动**：Research → Technical Design → API Design → Data Modeling。
- **产出**：`research.md`、`plan.md`、`contracts/`、`data-model.md`、`adr/`。
- **Gate**：设计评审通过，API 覆盖率 100%。

### 03. Plan（任务规划）

- **目标**：将设计拆解为可执行、可追踪任务。
- **活动**：TASK 分配 → 依赖分析 → Checklist 构建。
- **产出**：`tasks.md`、`checklist.md`。
- **Gate**：Task 覆盖率与 Task 合规率均为 100%。

### 04. Implement（规范驱动开发）

- **目标**：保证实现与规范一致且可回溯。
- **活动**：按 TASK 开发 → TDD → Code Review。
- **产出**：代码、单测、CR 记录。
- **约束（MUST）**：Commit/PR 均带追踪 ID。
- **Gate**：PR 合规率 100%，关键质量阈值达标。

### 05. Verify（验证）

- **目标**：确认功能、质量、风险控制均满足约束。
- **活动**：TC 设计执行 → 安全扫描 → UAT。
- **Mode I 增量**：回归验证 + `regression-report.md`（MUST）。
- **产出**：`tests/*.test.md`、`reports/test-report.md`、`reports/security-scan.md`、`reports/uat-signoff.md`。
- **Gate**：Test 覆盖率/TC 合规率/NFR 证据覆盖率均达标。

### 06. Wrap-up（收尾）

- **目标**：形成可审计闭环并沉淀改进动作。
- **活动**：归档 → 复盘 → 追踪矩阵终验。
- **产出**：`retro.md`、最终版 `traceability-matrix.md`。
- **Gate**：实现覆盖率 100%，矩阵状态全部 ✅。

---

## 横切机制（7+3）

### A. Quality Gate（量化五元组）

每个 Gate 必须以五元组记录：`输入工件`、`检查器`、`阈值`、`Gate Owner`、`失败动作`。

| 阶段 | 输入工件 | 检查器 | 阈值 | Gate Owner | 失败动作 |
|------|---------|--------|------|-----------|---------|
| 00 | `feature.yaml` | 清单检查 | 参数完整 | Tech Lead | 补全参数后重提 |
| 01 | `spec.md` | Clarify 扫描 + DoR 评分 | 歧义=0；DoR>=90 | PM | 回退 Specify |
| 02 | `plan.md`,`contracts/` | 设计评审 + API Diff | API 覆盖率=100%；无未审批 breaking | Tech Lead/Architect | 触发 RFC 或重设方案 |
| 03 | `tasks.md` | 追踪脚本 | Task 覆盖/合规=100% | Tech Lead | 回补任务或删除孤儿任务 |
| 04 | PR + 测试 | CI + CR | PR 合规=100%；单测覆盖率 S>=70/M>=80/L>=85 | Tech Lead/Peer | 驳回 PR |
| 05 | 测试与安全报告 | 测试框架 + SAST/SCA/DAST | AC 通过率=100%；无未豁免 Critical/High | QA Lead + PM | 阻断发布 |
| 06 | 全量文档与矩阵 | 归档检查 + 指标脚本 | 实现覆盖率=100%；矩阵全绿 | Tech Lead | 回退至缺失阶段 |

### B. Spec-Consistency-Analysis（5 触发时机，保留 v3）

| 时机 | 校验焦点 | 最低要求 |
|------|---------|----------|
| 01 后 | spec 内部一致性 | FR/AC/NFR 无冲突、无歧义 |
| 02 后 | spec ↔ design | FR 均有设计映射 |
| 03 后 | spec ↔ tasks | Task 覆盖/合规 100% |
| 04 后 | spec ↔ code | PR 合规 100%、契约一致 |
| 05 后 | spec ↔ test | Test 覆盖/TC 合规 100% |

### C. Change-Management（含紧急通道）

**标准通道（MUST）**：`RFC -> Impact Analysis -> 审批 -> 执行 -> 重校验`。

**紧急通道（MUST）**：
- 允许先修复后补文档。
- 事故修复后 `24 小时` 内必须补齐 `RFC + Impact Analysis + Retro 记录`。
- 未按时补录视为流程违规，进入治理看板。

---

## 兼容性与发布治理（新增）

### API 兼容性策略（MUST）

- API 变更必须执行 OpenAPI Diff。
- `breaking change` 必须触发 RFC，且版本号按 SemVer 升级。
- 关键消费者必须通过 Consumer Contract 测试（如 Pact `can-i-deploy` 思路）。

### 发布就绪检查（MUST）

发布前必须满足：
- Gate 00-06 全部通过。
- 兼容性检查通过。
- 安全风险处置完成（或豁免审批）。
- `release-notes.md` 已生成且关联需求 ID。

---

## 安全与 NFR 证据化（新增）

### 安全基线（MUST）

- 高风险 Feature 必须提供 `threat-model.md`。
- 安全检查需覆盖：SAST、SCA、依赖许可证、密钥泄漏、权限模型校验。
- OWASP Top 10 风险项应映射到 ASVS 控制条目。

### NFR 验证（MUST）

每条 NFR 必须具备可审计证据，存档到 `reports/nfr-evidence.md`，至少包含：
- 指标定义（如 P99、可用性、错误率、恢复时间）。
- 测试方法与环境。
- 实测结果与结论（Pass/Fail/Risk）。

---

## 多端扩展（Layer 2，保留并增强 v3）

### 扩展机制

各端维护 `platform-rules/<platform>-rules.md`，按三类扩展声明：
- `Entry Criteria`
- `Deliverables`
- `Exit Gate Items`

### 跨端协作锚点

- `contracts/` 是跨端唯一契约源（MUST）。
- 契约变更必须通知所有消费方并走 Change-Management（MUST）。
- 契约冻结后，消费方可基于 Mock 并行开发（SHOULD）。

---

## 产出物标准化

### 文件清单

| 类型 | 文件 |
|------|------|
| Feature 元数据 | `feature.yaml` |
| 需求规格 | `spec.md` |
| 追踪矩阵 | `traceability-matrix.md` |
| 影响分析（Mode I） | `impact-analysis.md` |
| 技术调研 | `research.md` |
| 技术设计 | `plan.md` |
| API 契约 | `contracts/*.yaml` |
| 数据模型 | `data-model.md` |
| 任务清单 | `tasks.md` |
| 验证清单 | `checklist.md` |
| 架构决策 | `adr/NNN-*.adr.md` |
| 测试用例 | `tests/*.test.md` |
| 变更请求 | `rfc/NNN-*.rfc.md` |
| 回归报告（Mode I） | `regression-report.md` |
| 安全与验证报告 | `reports/*.md` |
| 复盘 | `retro.md` |
| 发布说明 | `release-notes.md` |

### 目录结构

```text
project-root/
├── constitution.md
├── platform-rules/
│   ├── app-rules.md
│   ├── pc-rules.md
│   ├── h5-rules.md
│   └── backend-rules.md
├── .spec-first/
│   ├── ai-stats.jsonl
│   └── gate-results/
└── specs/
    └── NNN-feature-name/
        ├── feature.yaml
        ├── spec.md
        ├── traceability-matrix.md
        ├── impact-analysis.md
        ├── research.md
        ├── plan.md
        ├── contracts/
        ├── data-model.md
        ├── tasks.md
        ├── checklist.md
        ├── adr/
        ├── tests/
        ├── reports/
        ├── rfc/
        ├── regression-report.md
        ├── release-notes.md
        └── retro.md
```

---

## 工具链映射与自动化

### Jira Status 映射（保留 v3）

| 阶段 | Jira Status | 触发条件 |
|------|-------------|----------|
| 00. Init | `INIT` | Feature 创建 |
| 01. Specify | `SPECIFYING` | Init Gate 通过 |
| 02. Design | `DESIGNING` | DoR Gate 通过 |
| 03. Plan | `PLANNING` | Design Gate 通过 |
| 04. Implement | `IN_PROGRESS` | Plan Gate 通过 |
| 05. Verify | `IN_TESTING` | Implement Gate 通过 |
| 06. Wrap-up | `WRAPPING_UP` | Verify Gate 通过 |
| DevOps | `RELEASING` | Wrap-up Gate 通过 |
| 完成 | `DONE` | 发布成功 |

### 分支与版本策略（新增）

- 分支命名 `MUST` 使用：`feature/<feature-id>-<short-name>`。
- 若分支绑定具体需求，`SHOULD` 在分支名包含首个 FR ID。
- 发布标签 `MUST` 使用 SemVer：`vMAJOR.MINOR.PATCH`。
- `release-notes.md` `MUST` 明确本次发布关联的 FR/TASK/RFC。

### Git / CI 规则

| 触发点 | 规则 |
|-------|------|
| Pre-commit | ID 格式、Commit Message（`[TASK-NNN]`） |
| Pre-push | 增量 Spec-Consistency 校验 |
| PR CI | 全量追踪覆盖率 + 安全基线 + 兼容性检查 |
| Merge Gate | 关键指标必须全部绿灯 |

### 推荐自动化脚本

```bash
# 1) 提取需求 ID
rg -o 'FR-[0-9]{3}' specs/001-user-auth/spec.md | sort -u

# 2) 校验 TASK traces
rg -n 'TASK-[0-9]{3}|traces:' specs/001-user-auth/tasks.md

# 3) 校验 PR 描述包含 TASK ID（在 CI 中）
# 伪代码：assert /TASK-[0-9]{3}/ in PR_BODY

# 4) 兼容性检查
# openapi-diff old.yaml new.yaml
```

---

## 度量与治理闭环（新增）

### 核心看板指标

- 需求覆盖率、实现覆盖率、NFR 证据覆盖率。
- 孤儿项率、返工率、逃逸缺陷率。
- Gate 首次通过率、平均回退次数。
- 紧急变更占比、24h 补录达标率。
- AI 会话产出效率（代码/文档改动）与质量关联。

### AI 统计治理（保留并增强 v2）

- AI 统计写入 `.spec-first/ai-stats.jsonl`。
- Wrap-up 阶段必须复盘 AI 贡献与返工质量（MUST）。

---

## 落地路线图

1. **阶段 1（2 周）**：上线 ID 体系、追踪矩阵、基础覆盖率校验。
2. **阶段 2（2-4 周）**：上线 Gate 五元组与 CI 阻断。
3. **阶段 3（4-6 周）**：上线兼容性门禁、安全基线、NFR 证据化。
4. **阶段 4（持续）**：多端规则补齐、治理看板稳定运营。

---

## 风险与防偏策略

| 风险 | 表现 | 对策 |
|------|------|------|
| 形式主义 | 只填表不驱动决策 | 将关键指标绑定 Gate 阻断 |
| 过度流程化 | 小需求推进缓慢 | 通过 Size 控制深度，不跳阶段 |
| 自动化脆弱 | 脚本误报或漏报 | 先灰度、后阻断，保留人工复核 |
| 多端协作失焦 | 前后端口径分裂 | 以 `contracts/` 为唯一契约源 |

---

## 参考标准

- RFC 2119 / RFC 8174（规范术语）
- OpenAPI 3.1 + JSON Schema 2020-12
- SemVer 2.0
- Google AIP-180（向后兼容）
- Pact can-i-deploy（消费者契约发布门禁）
- OWASP ASVS（安全控制基线）
- ISO/IEC 12207、V-Model、SAFe、CMMI REQM

---

**作者**: Codex
**文档版本**: v5.0-codex
**基线来源**: `spec-first-v2.md`, `spec-first-v3.md`, `codex审查报告.md`, `dual-mode-design.md`
