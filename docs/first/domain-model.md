---
mode: deep
last_updated: 2026-03-08T12:00:44Z
generated_at: 2026-03-08T12:00:44Z
project: spec-first
platform_type: node-cli
---

# 业务领域模型

## 聚合根与核心对象

- `StageState` 是单个 Feature 的阶段真源，保存 `featureId/mode/size/platforms/currentStage/history/terminal`。 (`src/shared/types.ts:61` — `export interface StageState` — [显式])
- `FeatureSummary` 是 Feature 列表投影，保留当前阶段、模式、规模和更新时间。 (`src/shared/types.ts:210` — `export interface FeatureSummary` — [显式])
- `MatrixRow` 是追踪矩阵的行模型，关联 `id/type/status/upstream/downstream`。 (`src/shared/types.ts:166` — `export interface MatrixRow` — [显式])
- `GateResult` 封装阶段门禁状态、条件、豁免与建议。 (`src/shared/types.ts:99` — `export interface GateResult` — [显式])
- `RfcRecord` 建模变更请求的标题、级别、影响范围与审批记录。 (`src/shared/types.ts:121` — `export interface RfcRecord` — [显式])
- `DefectRecord` 建模缺陷的严重级别、发现阶段与关联 FR/TC。 (`src/shared/types.ts:141` — `export interface DefectRecord` — [显式])
- `CoverageMetrics` 是 C1-C9 覆盖率模型。 (`src/shared/types.ts:178` — `export interface CoverageMetrics` — [显式])

## 阶段模型

- 阶段枚举固定为 `00_init → 08_done`，另有 `09_cancelled`。 (`src/shared/types.ts:7` — `export enum Stage` — [显式])
- 终态只有 `DONE` 与 `CANCELLED`。 (`src/shared/types.ts:21` — `TERMINAL_STAGES` — [显式])
- 合法推进链由状态机单独约束，且终态不可逆。 (`src/core/process-engine/stage-machine.ts:30` — `assertTransitionAllowed` — [显式])

## 追溯模型

- ID 类型不仅覆盖 FR/DS/TASK/TC/RFC，还覆盖 `REQ/SYS/ARCH/MOD/ATP/STP/ITP/UTP`，说明系统内置 V-Model 追溯结构。 (`src/shared/types.ts:27` — `NextIdType` — [显式])
- 矩阵校验显式检查 orphan、broken chain 和 V-Model pairing。 (`src/core/trace-engine/matrix.ts:53` — `checkMatrix` — [显式])
- `REQ→ATP`、`SYS→STP`、`ARCH→ITP`、`MOD→UTP` 的映射关系在代码里被硬编码。 (`src/core/trace-engine/matrix.ts:30` — `V_MODEL_FORWARD` — [显式])

## Feature 聚合行为

- 当前 Feature 由 `.spec-first/current` 维护。 (`src/core/process-engine/feature.ts:10` — `CURRENT_FILE = '.spec-first/current'` — [显式])
- Feature 实体目录位于 `specs/<featureId>/`，其 `stage-state.json` 是关键载体。 (`src/core/process-engine/feature.ts:29` — `specs', featureId, 'stage-state.json'` — [显式])
- Feature 列表是扫描 `specs/` 下所有目录并读取状态文件得到的。 (`src/core/process-engine/feature.ts:37` — `listFeatures` — [显式])

## 变更与质量模型

- RFC 是“为什么改”的治理对象，支持 level/status/impactIds/approvals。 (`src/shared/types.ts:121` — `RfcRecord` — [显式])
- Defect 是“哪里坏了”的治理对象，支持 severity/status/discoveredIn/linkedFr/linkedTc。 (`src/shared/types.ts:141` — `DefectRecord` — [显式])
- 缺陷模型还提供“逃逸率”这一后验质量指标。 (`src/core/change-mgr/defect.ts:151` — `EscapeRateResult` — [显式])

## 当前边界判断

- 主业务模型是文件驱动的研发流程对象，而非数据库中的业务实体表。 (`src/core/process-engine/feature.ts:29` — `stage-state.json` — [推断])
- 该系统更像“规范治理引擎”，而非“用户/订单/支付”类业务系统。 (`package.json:4` — `Specification-driven development process engine` — [显式])
