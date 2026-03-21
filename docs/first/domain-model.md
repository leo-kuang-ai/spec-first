# Spec-First 领域模型文档

> 基于运行时分析生成 | 生成时间: 2026-03-20

---

## 概述

Spec-First 是一个基于文件存储的 AI 工作流引擎，核心领域围绕 **Feature 生命周期管理**、**质量门禁（Gate）** 和 **追溯性（Traceability）** 三大支柱构建。

### 核心领域概念

- **Feature**：顶层特性单元，代表一个完整的功能开发周期
- **Stage**：Feature 生命周期阶段，通过状态机驱动
- **Gate**：质量门禁，守护 Stage 推进
- **Traceability**：追溯 ID 体系，建立需求与实现的完整链路
- **Coverage**：覆盖率指标，衡量质量完整性

---

## 核心实体

### 1. Feature（特性）

**定义**：顶层特性单元，代表一个完整的功能开发周期

**标识符格式**：`FSREQ-{YYYYMMDD}-{ABBR}-{SEQ}`

**示例**：`FSREQ-20260319-WEBSITE-001`

**核心属性** (`src/shared/types.ts:239-247` — FeatureSummary 接口定义 — `[显式]`):
- `featureId`：唯一标识符
- `title`：特性标题
- `mode`：开发模式
- `size`：特性规模
- `platforms`：目标平台
- `currentStage`：当前阶段
- `terminal`：是否已终止

**生命周期**：由 process-engine 管理，从 `00_init` 到 `08_done/09_cancelled` (`src/core/process-engine/feature.ts` — Feature 管理逻辑 — `[显式]`)

---

### 2. Stage（阶段）

**定义**：Feature 生命周期阶段，单向不可逆状态机

**类型**：枚举（enum）

**阶段列表** (`src/shared/types.ts:7-18` — Stage 枚举定义 — `[显式]`):

| 阶段 | 名称 | 类型 | 说明 |
|------|------|------|------|
| 00_init | 初始化 | Active | Feature 创建，目录初始化 |
| 01_specify | 需求定义 | Active | 编写 spec.md、prd.md |
| 02_design | 技术设计 | Active | 编写 design.md，定义 DS |
| 03_plan | 任务规划 | Active | 编写 task_plan.md，生成 TASK |
| 04_implement | 代码实现 | Active | 执行 TASK，编写代码 |
| 05_verify | 测试验证 | Active | 执行 TC，验证质量 |
| 06_wrap_up | 收尾归档 | Active | 产物整理，文档归档 |
| 07_release | 发布上线 | Active | 生成 release-note，执行发布 |
| 08_done | 完成 | Terminal | 终态，Feature 生命周期结束 |
| 09_cancelled | 已取消 | Terminal | 终态，Feature 被取消 |

**不变量**：终态不可逆，只能向前推进或取消 (`src/core/process-engine/stage-machine.ts:30-38` — assertTransitionAllowed 校验 — `[显式]`)

---

### 3. StageState（阶段状态）

**定义**：Feature 的阶段状态持久化对象，存储在 stage-state.json

**文件路径**：`specs/{featureId}/stage-state.json`

**核心属性** (`src/shared/types.ts:77-102` — StageState 接口定义 — `[显式]`):
- `featureId`：关联的 Feature ID
- `mode`：开发模式
- `size`：特性规模
- `platforms`：目标平台
- `currentStage`：当前阶段
- `history`：阶段推进历史
- `terminal`：是否已终止
- `createdAt` / `updatedAt`：时间戳
- `mergedRules`：合并后的规则
- `stageStatus`：各阶段状态
- `autoAdvancePolicy`：自动推进策略

**编辑限制**：只能通过 CLI 操作，禁止手动编辑 (`CLAUDE.md:9-27` — 状态文件禁止手动编辑规则 — `[显式]`)

---

### 4. Gate（质量门禁）

**定义**：阶段质量门禁，评估是否可以推进到下一阶段

**结果状态** (`src/shared/types.ts:105-132` — GateResult, ConditionResult 接口 — `[显式]`):
- `PASS`：通过，可以推进
- `PASS_WITH_WAIVER`：通过豁免，有条件推进
- `FAIL`：失败，不可推进

**条件统计** (`src/core/gate-engine/condition-registry.ts:41-278` — GATE_CONDITIONS 定义 — `[显式]`):
- 总条件数：19 条
- Blocking 条件：16 条
- Warning 条件：3 条

**各阶段条件分布**:

| 阶段 | 条件 ID | 数量 |
|------|---------|------|
| 00_init | G-INIT-01, G-INIT-02, G-INIT-03 | 3 |
| 01_specify | G-SPEC-00, G-SPEC-01, G-SPEC-02, G-SPEC-03 | 4 |
| 02_design | G-DESIGN-01, G-DESIGN-03 | 2 |
| 03_plan | G-PLAN-01, G-PLAN-02, G-PLAN-03 | 3 |
| 04_implement | G-IMPL-01 | 1 |
| 05_verify | G-VERIFY-01, G-VERIFY-03 | 2 |
| 06_wrap_up | G-WRAP-01, G-WRAP-02 | 2 |
| 07_release | G-REL-01, G-REL-02 | 2 |

---

### 5. TraceabilityMatrix（追溯矩阵）

**定义**：追溯矩阵，管理所有 ID 之间的上下游关系

**文件路径**：`specs/{featureId}/traceability-matrix.md`

**列结构** (`src/shared/types.ts:199-208` — MatrixRow 接口定义 — `[显式]`):
- `ID`：追溯 ID
- `Type`：ID 类型（FR/DS/TASK/TC 等）
- `Title`：标题
- `Status`：状态（Planned/Implemented/Verified 等）
- `Upstream`：上游引用
- `Downstream`：下游引用

**完整性校验** (`src/core/trace-engine/matrix.ts:54-101` — checkMatrix 完整性校验 — `[显式]`):
- 非 FR/Feature/REQ 类型必须有 upstream 引用
- 避免"孤儿项"（无上游引用的矩阵行）

---

### 6. TraceabilityId（追溯 ID）

**定义**：14 种追溯 ID 类型，分为业务链路、V-Model、测试链路三类

**ID 类型分类** (`src/shared/types.ts:24-38` — NextIdType, IdType 定义 — `[显式]`):

| 分类 | ID 类型 | 说明 |
|------|---------|------|
| 业务链路 | FR, DS, TASK, TC, RFC | 功能需求 → 设计 → 任务 → 测试 |
| V-Model 链路 | REQ, SYS, ARCH, MOD | 需求层级（系统/架构/模块） |
| 测试链路 | ATP, STP, ITP, UTP | 验收/系统/集成/单元测试 |
| 顶层 | Feature | Feature 级别 |

**ID 格式规范** (`src/core/trace-engine/id-validator.ts:8-23` — ID_PATTERNS 正则 — `[显式]`):

| ID 类型 | 格式 | 示例 |
|---------|------|------|
| Feature | `FSREQ-{YYYYMMDD}-{ABBR}-{SEQ}` | FSREQ-20260319-WEBSITE-001 |
| FR | `FR-{ABBR}-{SEQ}` | FR-WEBSITE-001 |
| DS | `DS-{ABBR}-{SEQ}` | DS-WEBSITE-001 |
| TASK | `TASK-{ABBR}-{SEQ}` | TASK-WEBSITE-001 |
| TC | `TC-{LEVEL}-{ABBR}-{SEQ}` | TC-UT-WEBSITE-001 |
| RFC | `RFC-{SEQ}` | RFC-001 |

**缩写规则**：1-16 位大写字母+数字，首字符必须是字母

---

### 7. MatrixStatus（矩阵行状态）

**定义**：矩阵行状态，标识 ID 的生命周期状态

**类型**：枚举

**状态列表** (`src/shared/types.ts:183-190` — MatrixStatus 类型定义 — `[显式]`):

| 状态 | 说明 | 是否终态 |
|------|------|----------|
| Planned | 已规划 | 否 |
| Implemented | 已实现 | 否 |
| Verified | 已验证 | 否 |
| Accepted | 已验收 | ✅ 是 |
| Deferred | 已延期 | 否 |
| Cancelled | 已取消 | ✅ 是 |
| Exception | 例外 | ✅ 是 |

**终态**：`Accepted`, `Cancelled`, `Exception` (`src/shared/types.ts:193-197` — TERMINAL_STATUSES 常量 — `[显式]`)

---

### 8. RFC（变更请求）

**定义**：变更请求（Request For Change），管理需求变更和豁免

**状态状态机** (`src/core/change-mgr/rfc-machine.ts:9-17` — RFC_TRANSITIONS 状态机 — `[显式]`):

```
draft → approved → closed
  ↓         ↓
rejected  rejected
```

**状态说明**:

| 状态 | 说明 | 是否终态 |
|------|------|----------|
| draft | 草稿 | 否 |
| approved | 已批准 | 否 |
| closed | 已关闭 | ✅ 是 |
| rejected | 已拒绝 | ✅ 是 |

**变更等级**：Minor（小）, Major（中）, Critical（大）

**核心属性** (`src/shared/types.ts:135-161` — RfcStatus, RfcLevel, RfcRecord 接口 — `[显式]`):
- `id`：RFC ID
- `featureId`：关联的 Feature
- `title`：变更标题
- `level`：变更等级
- `status`：当前状态
- `impactIds`：受影响的 ID 列表
- `waivers`：豁免列表
- `approvals`：审批记录

---

### 9. Defect（缺陷）

**定义**：缺陷记录，管理 Bug 的生命周期

**状态状态机** (`src/core/change-mgr/defect-machine.ts:10-19` — DEFECT_TRANSITIONS 状态机 — `[显式]`):

```
open → fixing → fixed → verified
  ↓      ↓       ↓
wontfix  open   open
```

**状态说明**:

| 状态 | 说明 | 是否终态 |
|------|------|----------|
| open | 打开 | 否 |
| fixing | 修复中 | 否 |
| fixed | 已修复 | 否 |
| verified | 已验证 | ✅ 是 |
| wontfix | 不修复 | ✅ 是 |

**严重等级**：S1（严重）, S2（高）, S3（中）, S4（低）

**核心属性** (`src/shared/types.ts:164-180` — DefectStatus, DefectRecord 接口 — `[显式]`):
- `seq`：序号
- `featureId`：关联的 Feature
- `severity`：严重等级
- `title`：缺陷标题
- `status`：当前状态
- `linkedFr`：关联的 FR
- `linkedTc`：关联的 TC

---

### 10. Waiver（豁免）

**定义**：Gate 条件豁免，通过 RFC 授权绕过特定 Gate 条件

**作用范围**：只匹配 blocking failures (`src/core/gate-engine/gate-evaluator.ts:159-186` — 豁免匹配逻辑 — `[显式]`)

**核心属性** (`src/shared/types.ts:118-123` — WaiverRef 接口 — `[显式]`):
- `exceptionId`：例外 ID
- `rfcId`：关联的 RFC ID
- `expiresAt`：过期时间
- `rollbackPoint`：回滚点

**不变量**：豁免必须关联已批准的 RFC (`src/shared/types.ts:138-145` — RfcWaiver 接口 — `[显式]`)

---

### 11. CoverageMetrics（覆盖率指标）

**定义**：5 项核心覆盖率指标，用于 Gate 评估和健康分计算

**指标说明** (`src/core/trace-engine/coverage.ts:18-40` — getCoverage 计算逻辑 — `[显式]`):

| 指标 | 名称 | 说明 | 目标值 |
|------|------|------|--------|
| C3 | Task Coverage | FR 中有 TASK 映射的比例（支持传递链） | 100% |
| C4 | Test Coverage (FR) | FR 中有 TC 直接映射的比例（不支持传递） | 可配置阈值 |
| C6 | Implementation Coverage | TASK 中状态为 Implemented/Verified/Accepted 的比例 | 100% |
| C8 | Task Compliance | TASK 有上游 FR/NFR/DS 的比例（无孤儿 TASK） | 100% |
| C9 | TC Compliance | TC 有上游 FR 的比例（无孤儿 TC） | 100% |

**取值范围**：0~1（比例）

---

### 12. HealthScore（健康评分）

**定义**：Feature 综合健康评分

**计算公式** (`src/core/metrics-engine/health-score.ts:26-53` — calcHealthScore 计算逻辑 — `[显式]`):

```
H1 = (w1*C3 + w2*C4 + w3*C6 + w4*C8 + w5*C9) * 100 - penalty(Q1)
```

**权重配置** (`src/core/metrics-engine/health-score.ts:17-23` — CORE_WEIGHTS 权重 — `[显式]`):
- C3: 0.25
- C4: 0.2
- C6: 0.25
- C8: 0.15
- C9: 0.15

**等级划分**:

| 等级 | 分数范围 |
|------|----------|
| A | >= 90 |
| B | >= 80 |
| C | >= 70 |
| D | >= 60 |
| F | < 60 |

**额外指标**:
- E1：周期时间（天）
- Q1：缺陷逃逸率（每 1% 扣 2 分）(`src/core/metrics-engine/health-score.ts:43` — 健康分惩罚机制 — `[显式]`)

---

### 13. Bottleneck（瓶颈检测）

**定义**：瓶颈检测规则 R1-R5

**规则说明** (`src/core/metrics-engine/bottleneck.ts:25-80` — detectBottlenecks 规则实现 — `[显式]`):

| 规则 | 条件 | 说明 | 严重度 |
|------|------|------|--------|
| R1 | C3 < 0.6 | 需求瓶颈：低任务覆盖率 | high/medium |
| R2 | C4 < 0.6 | 测试瓶颈：测试覆盖不足 | high/medium |
| R3 | C6 < 0.7 | 实现滞后：任务未完全实现 | high/medium |
| R4 | C8 < 0.7 | 合规缺口：任务合规率低于阈值 | medium |
| R5 | C9 < 0.7 | 测试追溯缺口：低测试合规率 | medium |

---

### 14. KnownException（已知例外）

**定义**：已知例外记录，通过 RFC 授权的特定 FR 豁免

**核心属性** (`src/shared/types.ts:220-229` — KnownException 接口 — `[显式]`):
- `id`：例外 ID
- `rfcId`：关联的 RFC ID
- `frId`：豁免的 FR ID
- `reason`：原因说明
- `expiresAt`：过期时间
- `rollbackPoint`：回滚点
- `approvedBy`：审批人
- `approvedAt`：审批时间

**验证规则**：必须关联状态为 approved 的 RFC (`src/core/trace-engine/exception-validator.ts:16` — validateExceptions 校验 — `[显式]`)

---

### 15. Skill（技能）

**定义**：AI 交互技能定义，三层路由分发

**路由层次** (`CLAUDE.md:184-189` — Skill 三层路由说明 — `[显式]`):
1. Semantic Map（复合命令映射）
2. Runtime Route（RUNTIME_COMMANDS 集合）
3. Skill File（skills/spec-first/NN-name/SKILL.md）

**调用格式**：`/spec-first:<skill-name>`

**阶段-Skill 映射** (`src/core/rules/truth-source.ts:1-11` — PRIMARY_STAGE_SKILL 映射 — `[显式]`):

| 阶段 | Skill |
|------|-------|
| 00_init | init |
| 01_specify | spec |
| 02_design | design |
| 03_plan | task |
| 04_implement | code |
| 05_verify | verify |
| 06_wrap_up | archive |
| 07_release | golive |

**总数**：20 个 Skill

---

## 实体关系

### 核心关系图

```
Feature (1) ←→ (1) StageState
    ↓
  Stage (1..8) ←→ (1) Gate
    ↓
TraceabilityMatrix (1) ←→ (N) TraceabilityId
    ↓
CoverageMetrics → HealthScore
    ↓
RFC → Waiver
```

### 关系详情

1. **Feature-Stage**（组合关系）
   - Feature 包含一个当前 Stage，Stage 推进驱动 Feature 生命周期
   - 约束：Stage 只能向前推进或取消，不可回退 (`src/core/process-engine/stage-machine.ts` — `[显式]`)

2. **Feature-StageState**（持久化关系）
   - StageState 是 Feature 的持久化状态快照
   - 文件：`specs/{featureId}/stage-state.json` (`src/shared/types.ts:77-102` — `[显式]`)

3. **Feature-TraceabilityMatrix**（组合关系）
   - Feature 拥有一个追溯矩阵，管理所有 ID 关系
   - 文件：`specs/{featureId}/traceability-matrix.md` (`src/core/trace-engine/matrix.ts` — `[显式]`)

4. **FR-TASK-TC**（追溯链路）
   - 业务链路追溯：FR → DS → TASK → TC
   - upstream/downstream 引用机制 (`src/core/trace-engine/upstream-lineage.ts` — `[显式]`)

5. **REQ-ATP (V-Model)**（V-Model 配对）
   - V-Model 正向追溯：REQ→ATP, SYS→STP, ARCH→ITP, MOD→UTP (`src/core/trace-engine/matrix.ts:26-42` — `[显式]`)

6. **Gate-Stage**（守卫关系）
   - Gate 守护 Stage 推进，必须通过 Gate 才能 advance (`src/core/gate-engine/gate-evaluator.ts:101-224` — `[显式]`)

7. **Gate-CoverageMetrics**（依赖关系）
   - Gate 条件依赖 CoverageMetrics（C3/C4/C6/C8/C9） (`src/core/gate-engine/condition-registry.ts:157-237` — `[显式]`)

8. **RFC-Waiver**（授权关系）
   - RFC 批准后可创建 Waiver，豁免特定 Gate 条件 (`src/shared/types.ts:138-145` — `[显式]`)

9. **RFC-Feature**（范围关系）
   - RFC 属于特定 Feature 范围 (`src/shared/types.ts:147-161` — `[显式]`)

10. **Defect-FR-TC**（关联关系）
    - Defect 可关联 FR 和 TC (`src/shared/types.ts:167-180` — `[显式]`)

11. **CoverageMetrics-HealthScore**（计算关系）
    - CoverageMetrics 是 HealthScore 的计算输入 (`src/core/metrics-engine/health-score.ts:26-53` — `[显式]`)

---

## 状态机

### 1. Stage FSM（阶段状态机）

**描述**：Feature 生命周期阶段状态机

**状态列表**：
- Active: 00_init, 01_specify, 02_design, 03_plan, 04_implement, 05_verify, 06_wrap_up, 07_release
- Terminal: 08_done, 09_cancelled

**状态转换图** (`src/core/process-engine/stage-machine.ts:8-17` — TRANSITIONS 转换表 — `[显式]`):

```
00_init ────→ 01_specify ────→ 02_design ────→ 03_plan ────→
                                                        ↓
07_release ←── 06_wrap_up ←── 05_verify ←── 04_implement ←┘
     │
     ↓
  08_done

（任意阶段均可转换到 09_cancelled）
```

**不变量**：
- 单向不可逆
- 终态不可变更

---

### 2. RFC FSM（变更请求状态机）

**描述**：变更请求状态机

**状态列表**：
- Non-terminal: draft, approved
- Terminal: rejected, closed

**状态转换图** (`src/core/change-mgr/rfc-machine.ts:9-17` — RFC_TRANSITIONS 状态机 — `[显式]`):

```
  ┌───────┐
  │ draft │
  └───┬───┘
      │
  ┌───┴────┐
  │        │
  ↓        ↓
┌────────┐ ┌──────────┐
│approved│ │ rejected │
└────┬───┘ └──────────┘
     │
  ┌──┴───┐
  │      │
  ↓      ↓
┌─────┐ ┌──────────┐
│closed│ │ rejected │
└─────┘ └──────────┘
```

**不变量**：
- 终态不可变更

---

### 3. Defect FSM（缺陷状态机）

**描述**：缺陷生命周期状态机

**状态列表**：
- Non-terminal: open, fixing, fixed
- Terminal: verified, wontfix

**状态转换图** (`src/core/change-mgr/defect-machine.ts:10-19` — DEFECT_TRANSITIONS 状态机 — `[显式]`):

```
      ┌──────────┐
      │  wontfix │
      └────▲─────┘
           │
        ┌──┴───┐
    ┌──→│ open │←──┐
    │   └──────┘   │
    │              │
 ┌──┴───┐       ┌──┴───┐
 │fixing│       │      │
 └──┬───┘       │      │
    │        ┌──┴───┐  │
    └───────→│fixed │──┘
             └──┬───┘
                │
             ┌──┴──────┐
             │verified │
             └─────────┘
```

**不变量**：
- 终态不可变更

---

## 业务规则

### BR-001: Stage 单向推进 (`src/core/process-engine/stage-machine.ts:30-38` — `[显式]`)

**描述**：Stage 只能向前推进或取消，不可回退到之前阶段

**作用域**：全局

**强制级别**：Blocking

---

### BR-002: Gate 必须通过 (`CLAUDE.md:9-27` — `[显式]`)

**描述**：Stage 推进前必须通过当前阶段的 Gate 校验

**作用域**：全局

**强制级别**：Blocking

---

### BR-003: Waiver 需 RFC 授权 (`src/shared/types.ts:118-123` — `[显式]`)

**描述**：Gate 条件豁免必须关联已批准的 RFC

**作用域**：Gate

**强制级别**：Blocking

---

### BR-004: ID 格式规范 (`src/core/trace-engine/id-validator.ts:8-23` — `[显式]`)

**描述**：所有追溯 ID 必须符合预定义格式（正则校验）

**作用域**：全局

**强制级别**：Blocking

---

### BR-005: 矩阵完整性 (`src/core/trace-engine/matrix.ts:60-69` — `[显式]`)

**描述**：非 FR/Feature/REQ 类型必须有 upstream 引用，避免孤儿项

**作用域**：TraceabilityMatrix

**强制级别**：Warning

---

### BR-006: C3/C8 100% 目标 (`src/core/gate-engine/condition-registry.ts:154-187` — `[显式]`)

**描述**：Task Coverage 和 Task Compliance 目标为 100%

**作用域**：03_plan Gate

**强制级别**：Blocking

---

### BR-007: C6 100% 目标 (`src/core/gate-engine/condition-registry.ts:239-248` — `[显式]`)

**描述**：Implementation Coverage 目标为 100%（06_wrap_up Gate）

**作用域**：06_wrap_up Gate

**强制级别**：Blocking

---

### BR-008: Release 必需产物 (`src/core/rules/truth-source.ts:45-48` — `[显式]`)

**描述**：07_release 阶段必须存在 smoke-test-report.md 和 release-note.md

**作用域**：07_release Gate

**强制级别**：Blocking

---

### BR-009: 状态文件禁止手动编辑 (`CLAUDE.md:9-27` — `[显式]`)

**描述**：stage-state.json、traceability-matrix.md 等状态文件只能通过 CLI 操作

**作用域**：全局

**强制级别**：Process

---

### BR-010: 健康分惩罚机制 (`src/core/metrics-engine/health-score.ts:43` — `[显式]`)

**描述**：缺陷逃逸率 Q1 每 1% 扣 2 分，最高扣 50 分

**作用域**：HealthScore

**强制级别**：Calculation

---

## 领域术语表

| 术语 | 英文 | 定义 |
|------|------|------|
| 功能需求 | FR (Functional Requirement) | 业务功能需求描述 |
| 非功能需求 | NFR (Non-Functional Requirement) | 性能、安全等非功能需求 |
| 设计规格 | DS (Design Specification) | 技术设计文档 |
| 测试用例 | TC (Test Case) | 测试场景定义 |
| 变更请求 | RFC (Request For Change) | 需求变更申请 |
| 质量门禁 | Gate | 阶段推进前的质量检查点 |
| 豁免 | Waiver | 通过 RFC 授权绕过特定 Gate 条件 |
| 覆盖率 | Coverage | 衡量需求被任务/测试覆盖的程度 |
| 合规率 | Compliance | 衡量下游项有上游引用的比例 |
| 可追溯性 | Traceability | 需求与实现之间的双向关联 |
| 孤儿项 | Orphan | 无上游引用的矩阵行 |
| 断链 | Broken Chain | 缺少必要下游映射的 FR |
| V-Model | V 模型 | 需求与测试的对应关系（REQ-ATP, SYS-STP 等） |
| 技能 | Skill | AI 交互技能，定义特定场景下的 AI 行为 |
| 阶段 | Stage | Feature 生命周期的状态节点 |

---

## 证据来源

本文档基于以下源代码分析生成：

- `src/shared/types.ts:1-248` — 核心类型定义（Stage, ID, Gate, RFC, Defect, Matrix, Coverage）
- `src/core/process-engine/stage-machine.ts:1-52` — Stage 状态机转换规则
- `src/core/change-mgr/rfc-machine.ts:1-48` — RFC 状态机转换规则
- `src/core/change-mgr/defect-machine.ts:1-50` — Defect 状态机转换规则
- `src/core/gate-engine/condition-registry.ts:1-407` — Gate 条件定义注册表
- `src/core/gate-engine/gate-evaluator.ts:1-253` — Gate 评估引擎
- `src/core/trace-engine/coverage.ts:1-182` — 覆盖率计算逻辑
- `src/core/trace-engine/matrix.ts:1-301` — 追踪矩阵管理
- `src/core/trace-engine/id-validator.ts:1-42` — ID 格式校验
- `src/core/trace-engine/id-generator.ts:1-131` — ID 生成逻辑
- `src/core/metrics-engine/health-score.ts:1-62` — 健康分计算
- `src/core/metrics-engine/bottleneck.ts:1-93` — 瓶颈检测规则
- `src/core/rules/truth-source.ts:1-76` — 真理源规则定义
- `CLAUDE.md:1-160` — 开发规范、工作流程、强制规则
