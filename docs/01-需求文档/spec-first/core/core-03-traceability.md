# Spec-First v7.1 — 全链路追踪体系

> **模块**: 核心研发流程 #3 | **拆分自**: spec-first-v7.md L515-693
> **版本**: v7.1 | **更新**: 2026-02-09

---

## 设计目标

解决"需求遗漏"和"过度实现"两大核心问题：通过统一 ID 体系 + 追踪矩阵 + 覆盖率算法，实现以 FR/NFR 为中心的星型追踪网络（FR↔DS、FR↔API、FR↔TASK、FR↔TC、TASK↔PR），全链路可追踪、可量化、可审计。

---

## ID 规范

### 设计原则

- **稳定性**：ID 一次分配，终身不改；需求废弃后不得复用
- **可解析**：统一前缀和序号位数，支持正则校验
- **全局可识别**：ID 携带 Feature/Domain 缩写，脱离目录上下文仍可识别来源

### ID 类型定义（6 种）

> 权威定义见 v2-05-追踪矩阵与ID引擎 §2。NFR、API、ADR 不再独立编号，分别合入 FR（标签）、DS（属性）、RFC（子类型）。

| 前缀 | 全称 | 格式 | 示例 | 正则 | 定义阶段 |
|------|------|------|------|------|---------|
| `Feature` | Feature ID | `FSREQ-YYYYMMDD-<FEAT>-NNN` | `FSREQ-20260210-AUTH-001` | — | 00 Init |
| `FR` | Functional Requirement | `FR-<FEAT>-NNN` | `FR-AUTH-001` | `^FR-[A-Z][A-Z0-9]{1,15}-\d{3}$` | 01 Specify |
| `DS` | Design Section | `DS-<FEAT>-NNN` | `DS-AUTH-001` | `^DS-[A-Z][A-Z0-9]{1,15}-\d{3}$` | 02 Design |
| `TASK` | Implementation Task | `TASK-<FEAT>-NNN` | `TASK-AUTH-001` | `^TASK-[A-Z][A-Z0-9]{1,15}-\d{3}$` | 03 Plan |
| `TC` | Test Case | `TC-<LVL>-<FEAT>-NNN` | `TC-E2E-AUTH-001` | `^TC-(UT\|IT\|E2E\|ST)-[A-Z][A-Z0-9]{1,15}-\d{3}$` | 05 Verify |
| `RFC` | Request for Change | `RFC-NNN` | `RFC-001` | `^RFC-\d{3}$` | 横切机制 C |

**合并说明**：

| 原独立类型 | 合入目标 | 方式 | 示例 |
|-----------|---------|------|------|
| NFR | FR | 加 `[NFR:DIM]` 标签 | `FR-AUTH-003 [NFR:PERF]` |
| API | DS | `api_ref` 属性字段 | DS 记录中引用 `contracts/*.yaml` |
| ADR | RFC | `type: ADR` 子类型 | RFC 记录中标注 `type: ADR` |

**说明**：

- `<FEAT>` 为 Feature 缩写（2-16 位大写字母+数字，首位必须为字母），如 AUTH、PAY、ORDER。**FEAT 缩写必须全局唯一**，通过 FEAT 注册表治理
- `<LVL>` 固定枚举：`UT`（单元测试）、`IT`（集成测试）、`E2E`（端到端测试）、`ST`（静态分析测试）
- NNN 为三位数字，从 001 开始递增
- **ID 生成**：通过 CLI 命令 `spec-first id next <type> <featAbbr>` 自动生成，禁止手动编造

### FEAT 注册表

为确保 `<FEAT>` 缩写全局唯一，项目须维护 FEAT 注册表文件 `specs/.feat-registry.md`。

**治理规则**：

1. **Init 内联校验**：00 Init 阶段必须检查新 FEAT 缩写是否与注册表中已有条目冲突，冲突则阻塞
2. **先注册后使用**：任何 FR/TASK/TC/API 使用新 FEAT 缩写前，必须先在注册表中登记
3. **禁止歧义缩写**：同一业务域不得注册多个缩写
4. **废弃不复用**：FEAT 缩写废弃后标记 `Deprecated`，不得被新 Feature 复用

### 跨产物引用规则

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

---

## 追踪矩阵

追踪矩阵（Traceability Matrix）是全链路追踪的核心产出物，记录 FR/NFR 从需求到代码的完整映射链路。

**产出物**：`traceability-matrix.md`，存放于 Feature 目录根下。

### 矩阵格式

```markdown
# 追踪矩阵 — <Feature Name>

| 需求 ID | Design Ref | Task Ref | Test Case Ref | PR Ref | Status |
|---------|-----------|----------|--------------|--------|--------|
| FR-AUTH-001 | DS-AUTH-001 | TASK-AUTH-001 | TC-E2E-AUTH-001 | #123 | Accepted |
```

> API 契约引用已合入 DS 记录的 `api_ref` 属性，不再作为矩阵独立列。

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

### 矩阵生命周期

| 阶段 | 矩阵操作 | 填充列 |
|------|---------|--------|
| 01 Specify | 创建矩阵，填入所有 FR/NFR | 需求 ID |
| 02 Design | 填充设计引用（含 API 契约） | Design Ref |
| 03 Plan | 填充任务引用 | Task Ref |
| 04 Implement | 填充 PR 引用 | PR Ref |
| 05 Verify | 填充测试用例引用，更新 Status | Test Case Ref, Status |
| 06 Wrap-up | 更新 Status 为 Accepted | Status |

---

## 覆盖率算法

> C1-C9 完整公式、权重与健康分计算的权威定义见 v2-11-度量与健康分；需求侧指标总览见 aux-05-metrics。

### Gate 编号与阶段映射

| Gate 编号 | 对应阶段 | 校验时机 |
|-----------|---------|---------|
| Gate 1 | 02. Design | 设计评审准出 |
| Gate 2 | 03. Plan / 04. Implement | 任务评审 + Code CR 准出 |
| Gate 3 | 05. Verify / 06. Wrap-up | UAT + 归档准出 |

### 正向覆盖率（需求是否被实现）

| 指标 | 公式 | 校验阶段 | Gate 阈值 |
|------|------|---------|----------|
| **Design 覆盖率** | Active FR∪NFR with ≥1 DS / Active FR+NFR × 100% | Gate 1 | = 100% |
| **API 覆盖率** | FR(需API) with ≥1 API / Total FR(需API) × 100% | Gate 1 | = 100% |
| **Task 覆盖率** | Active FR∪NFR with ≥1 TASK / Active FR+NFR × 100% | Gate 2 | = 100% |
| **Test 覆盖率(FR级)** | Active FR∪NFR with ≥1 TC / Active FR+NFR × 100% | Gate 3 | = 100% |
| **Test 覆盖率(AC级)** | Active AC with ≥1 TC / Active AC 总数 × 100% | Gate 3 | ≥ 90%（M/L） |
| **实现覆盖率** | Active FR∪NFR with ≥1 PR / Active FR+NFR × 100% | Gate 3 | = 100% |

**Active 定义**：Active FR+NFR = Total FR+NFR 中排除 Status 为 Deferred、Cancelled 和 Exception 的条目。

**解读**：正向覆盖率 < 100% = 存在**遗漏需求**。

### 反向合规率（实现是否有需求依据）

| 指标 | 公式 | 校验阶段 | Gate 阈值 |
|------|------|---------|----------|
| **Task 合规率** | TASK with ≥1 FR/NFR ref / Total TASK × 100% | Gate 2 | = 100% |
| **TC 合规率** | TC with ≥1 FR/NFR ref / Total TC × 100% | Gate 3 | = 100% |
| **PR 合规率** | PR with ≥1 TASK ref / Total PR × 100% | Gate 2 | = 100% |

**解读**：反向合规率 < 100% = 存在**过度实现**。

### 综合指标

| 指标 | 公式 | 目标 |
|------|------|------|
| **孤儿项率** | 未关联 FR/NFR 的 (TASK+TC+PR) 数 / 全部 (TASK+TC+PR) 数 × 100% | = 0% |

### Known Exception List（已知豁免清单）

当某些 FR/NFR 因客观原因无法在当前版本实现或测试时，可通过豁免机制处理：

1. 在 `specs/<featureId>/known-exceptions.md` 中登记豁免条目
2. 豁免条目在追踪矩阵中标记 Status = `Exception`
3. Gate 校验时，Exception 条目从覆盖率分母中排除
4. 每个 Sprint/迭代结束时复审豁免清单，过期未解除的豁免升级为 P0 风险

**豁免条目必填字段**：

| 字段 | 说明 |
|------|------|
| `waiver_id` | Feature 内唯一豁免编号（如 `WVR-001`） |
| `rfc_id` | 关联 RFC（必填，禁止无 RFC 豁免） |
| `scope_ids` | 受影响 ID 列表（FR/NFR/TASK/TC/API） |
| `reason` | 豁免原因与业务背景 |
| `risk_level` | 风险等级（Low/Medium/High） |
| `mitigation` | 临时缓解措施 |
| `rollback_point` | 回滚点（commit/tag/发布批次） |
| `owner` | 责任人 |
| `approved_by` | 审批人（角色+姓名） |
| `created_at` | 创建时间（ISO 8601） |
| `expires_at` | 失效时间（必填） |
| `closure_evidence` | 关闭证据（修复 PR、回归报告、UAT 记录） |

**豁免生命周期（紧急发布闭环）**：

1. 创建/审批 RFC（不得绕过）
2. 登记 `known-exceptions.md` 并绑定 `scope_ids + rollback_point + expires_at`
3. `gate check` 输出 `PASS_WITH_WAIVER` 后，允许 `stage advance`
4. 到期前必须完成修复并补齐 `closure_evidence`，将条目标记 Closed
5. 逾期未关闭自动升级为 P0 风险，后续 Gate 强制 `FAIL`

**约束**：

- 豁免比例上限：单次 Gate 豁免条目不得超过 Active FR+NFR 总数的 **10%**
- 豁免必须有明确的解除时间，不允许无限期豁免
- 所有豁免记录纳入 06. Wrap-up 复盘审计

### AC 级覆盖缺口管理

当 AC 级覆盖率未达 100% 时（M/L 规模阈值 ≥ 90%），未覆盖的 AC 须逐条记录在 Test Report 中，包含未覆盖原因和风险评估。高风险 AC 未覆盖时 Gate Owner 须额外审批。所有未覆盖 AC 记录纳入 06. Wrap-up 复盘。

> **说明**：Size S 规模不强制 AC 级覆盖率校验，FR 级覆盖率 = 100% 已足够。

### 流程健康度指标

| 指标 | 公式 | 目标 |
|------|------|------|
| **返工率** | (Gate 驳回次数 + PR Request Changes 次数) / (Gate 触发总数 + PR 总数) × 100% | < 10% |
| **Gate 首次通过率** | 首次触发即通过的 Gate 次数 / Gate 触发总数 × 100% | > 85% |
| **缺陷逃逸率** | 生产环境发现的 Bug 数 / (生产 Bug + 测试 Bug) × 100% | < 2%（S1/S2 = 0%） |

---

## 追踪链路全景

```
01. Specify          02. Design           03. Plan          04. Implement      05. Verify
┌──────────┐     ┌──────────────┐     ┌───────────┐     ┌────────────┐    ┌──────────┐
│FR-AUTH-001│────▶│ DS-AUTH-001 │────▶│TASK-AUTH-001────▶│ PR #123    │    │TC-E2E-AUTH-001
│FR-AUTH-002│────▶│ DS-AUTH-002 │────▶│TASK-AUTH-002────▶│ PR #123    │    │TC-IT-AUTH-001
│FR-AUTH-003│────▶│ DS-AUTH-003 │────▶│TASK-AUTH-003────▶│ PR #124    │    │TC-IT-AUTH-002
│ [NFR:PERF]│     │              │     │             │     │            │    │
└──────────┘     └──────────────┘     └───────────┘     └────────────┘    └──────────┘
     │                                      │                                   │
     └──────────────────────────────────────┴───────────────────────────────────┘
                              traceability-matrix.md（汇总）
```

---

*core-03-traceability.md 完成 — 下一篇：[core-04-process.md](core-04-process.md)*
