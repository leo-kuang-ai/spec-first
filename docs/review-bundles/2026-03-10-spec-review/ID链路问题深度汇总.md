# 产物 ID 链路问题深度汇总（基于当前代码）

- 生成日期：2026-03-10
- 范围：以运行时代码为准，聚焦 `ID 生成 → 传播 → 校验 → 持久化 → 恢复`
- 说明：以下为**逐条问题**的根因、证据、修复方案与检查点；文档仅作为“规则分裂”证据

---

## F-01 规则源分裂：spec 规则禁止 REQ-PRD，但运行时要求 REQ-PRD

### 根因
运行时 `checkMatrix()` 强制 FR 上游必须包含 `REQ-PRD-*`，但 spec 规则明确禁止 `REQ-PRD` 并要求使用 `REQ-*`，导致同一规则被两套源定义。

### 证据
- 运行时硬编码 `REQ-PRD-*`：`src/core/trace-engine/matrix.ts:68`
- spec 规则禁止 `REQ-PRD`：`skills/spec-first/03-spec/SKILL.md:101`

### 修复方案
- 在 `checkMatrix()` 中将上游要求统一为 `REQ-*`，**不再兼容** `REQ-PRD-*`。
- 在 `validate matrix` 中检测 `REQ-PRD-*` 并直接报错（开发阶段不保留过渡期）。
- 统一规则源：新增 `src/shared/id-rules.ts`（或 `trace-rules.ts`），由 runtime/skill/docs 共同引用。

### 检查点
- `matrix check` 对 `REQ-*` 通过，对 `REQ-PRD-*` 直接失败（开发阶段无兼容期）。
- `validateId('REQ-PRD-001')` 返回 `{ valid: false }`。

---

## F-02 非法 ID 被静默降级为 Feature，断链/漏链被吞掉

### 根因
`parseMatrixContent()` 对 `validateId()` 失败的 ID 直接降级为 `Feature`，造成非法 ID 在运行时继续流转且不会触发告警。

### 证据
- `validateId()` 未命中时回退为 `Feature`：`src/core/trace-engine/matrix.ts:159`
- `validateId()` 仅支持有限类型（无 `AC`、`TC` 必带级别）：`src/core/trace-engine/id-validator.ts:8`

### 修复方案
- `parseMatrixContent()` 对非法 ID **直接抛错并阻断**，不再降级。
- 添加 `AC` 到 `IdType` 与 `validateId`；对 `TC` 无级别直接报错。
- 将 `validate matrix` 作为强制前置（gate 中加入）并阻断无效 ID。

### 检查点
- 矩阵中出现 `AC-*` 或无级别 `TC-*` 时，`validate matrix` 必须失败。
- `parseMatrix()` 输出的 `MatrixRow.type` 不应出现 `Feature` 作为非法 ID 的降级结果。

---

## F-03 `trace fix` 写入文件路径污染链路字段

### 根因
`trace fix` 将 `src/core/**/task-id.ts` 作为 downstream 填充，导致链路字段混入非 ID 值。

### 证据
- downstream 被写入路径占位：`src/cli/commands/trace.ts:51`

### 修复方案
- 移除该自动修复逻辑，或新增专用字段（如 `Artifacts` 列）存储路径。
- 在 `validate matrix` 中校验 upstream/downstream 仅允许合法 ID。

### 检查点
- 运行 `trace fix` 后 matrix 不应出现 `src/**` 之类路径。
- `validate matrix` 对 downstream 任何非合法 ID 必须失败。

---

## F-04 `validate format` 只检查 ID 列，漏掉 upstream/downstream 及未知类型

### 根因
格式校验仅扫描矩阵 ID 列，并跳过 `validateId()` 不通过的项，导致非法 ID 类型无法暴露；同时 upstream/downstream 完全未校验。

### 证据
- 仅匹配 ID 列：`src/core/validators/format-validator.ts:80`
- 非法 ID 会被直接跳过（`validateId` 失败即 continue）：`src/core/validators/format-validator.ts:88`

### 修复方案
- 扫描 matrix 全表：对 upstream/downstream 做合法 ID 校验。
- 将非法 ID 类型列为 `errors` 而非 skip。
- 对 `AC` / `TC` 做显式规则校验（配合 F-02 统一规则源）。

### 检查点
- upstream/downstream 中出现非法 ID 时，`validate format` 必须失败。
- `validate format` 能检测到非法 `AC-*` / `TC-*` 格式。

---

## F-05 C5 号称 AC Coverage，实际仍是 FR Coverage

### 根因
`calcTestCoverageAC()` 与 `calcTestCoverageFR()` 使用同一逻辑，且 matrix 没有 AC 类型，导致 C5 实际无法衡量 AC 覆盖率。

### 证据
- C5 逻辑完全复用 C4：`src/core/trace-engine/coverage.ts:80`

### 修复方案
- 将 AC 作为独立 ID 类型；`MatrixRow` 支持 `AC`。
- 新增 `AC`→`TC`/`TASK` 关联规则并计算真实 C5。
- Gate 条件中 C5 的解释同步更新，避免误导。

### 检查点
- 当 AC 为空时，C5 应为 0 或触发缺失错误。
- 当 AC 与 TC 关联完整时，C5 应为 100%。

---

## F-06 stage-state 校验过弱 + 写入无锁，恢复可靠性不足

### 根因
`isStageState()` 仅检查 `currentStage` 字段，导致损坏/不完整的 state 仍被接受；写入 `writeJson` 无锁且非原子，存在并发覆盖风险。

### 证据
- 校验过弱：`src/shared/validators.ts:11`
- 写入无锁：`src/shared/fs-utils.ts:49`

### 修复方案
- 强化 `isStageState()`：校验必需字段（featureId/mode/size/currentStage/history/updatedAt）。
- 引入 `stage-state` 文件锁或 CAS（基于 `updatedAt`）以防并发覆盖。
- 对 `advance` / `cancel` 等写路径使用原子写（tmp + rename）。

### 检查点
- 手工破坏 `stage-state.json` 后，`advance` 应立即失败并提示结构异常。
- 并发执行 `advance` 时，不允许出现历史丢失或回退。

---

## F-07 auto-loop 退避仅记录不等待 + todo-state 无锁

### 根因
重试逻辑只记录 backoff 时间，但没有实际等待；`todo-state` 写入无锁，存在多实例覆盖和自旋风险。

### 证据
- 仅记录 backoff：`src/core/ai-orchestrator/auto-loop.ts:195`
- todo-state 写入无锁：`src/core/ai-orchestrator/todo-runner.ts:204`

### 修复方案
- 在 retry scheduled 后加入 `sleep(backoffMs)` 或定时调度。
- 引入 `todo-state` 文件锁或版本号 CAS，确保并发安全。

### 检查点
- 连续重试时日志时间间隔应匹配 backoff。
- 并发执行 auto-loop 不应导致任务状态回退或重复完成。

---

## F-08 文档链路与运行时代码多处不一致，误导人工修复

### 根因
规则源头分散，文档对 ID 类型与约束描述与运行时不一致，造成使用者按文档产出但运行时拒绝或误判链路。

### 证据
- 文档禁止 `REQ-PRD`：`skills/spec-first/03-spec/SKILL.md:101`
- 文档定义 AC ID 规则：`skills/spec-first/03-spec/SKILL.md:174`
- 运行时不承认 `AC`：`src/core/trace-engine/id-validator.ts:8`

### 修复方案
- 建立单一规则源（`id-rules.ts`），由 runtime/skill/docs 引用生成。
- 在 CI 加入 “规则源一致性检查” （例如脚本对比 docs 与 runtime 规则）。

### 检查点
- 更新文档后，规则校验脚本必须通过。
- runtime 能识别文档中列出的所有 ID 类型。

---

## 总体优先级建议（开发阶段，逻辑干净优先）

1. **F-01 + F-02 + F-04**（规则统一、非法即失败）
2. **F-05**（AC 覆盖率真实可用）
3. **F-03**（链路字段纯净）
4. **F-06 + F-07**（状态可靠性/并发安全）
5. **F-08**（规则源统一，避免反复漂移）

---

## 代码变更清单（无兼容，强失败）

### F-01 REQ 规则统一（不兼容 REQ-PRD）
- 修改 `src/core/trace-engine/matrix.ts`：`hasPrd` 判断统一为 `REQ-*`，删除 `REQ-PRD-*` 例外。
- 修改 `src/core/validators/format-validator.ts`：检测 `REQ-PRD-*` 直接报错。
- （可选）新增 `src/shared/id-rules.ts`：将 `REQ` 规则与 `checkMatrix` 对齐，供后续复用。

### F-02 非法 ID 强失败 + AC 类型引入
- 修改 `src/shared/types.ts`：在 `IdType`（必要时 `NextIdType`）中新增 `AC`。
- 修改 `src/core/trace-engine/id-validator.ts`：加入 `AC` 正则；继续要求 `TC` 带级别。
- 修改 `src/core/trace-engine/matrix.ts`：`parseMatrixContent()` 对非法 ID 直接抛错，不再降级为 `Feature`。
- 修改 `src/core/validators/format-validator.ts`：对 `validateId()` 失败的 ID 直接报错，不再 skip。
- 修改 `src/core/trace-engine/trace-context.ts`：新增 `acRows`（为 C5 准备）。

### F-03 链路字段纯净（禁止写入路径）
- 修改 `src/cli/commands/trace.ts`：移除写入 `src/**` 路径到 downstream 的逻辑。
- 修改 `src/core/validators/format-validator.ts`（或 `src/core/trace-engine/matrix.ts`）：校验 upstream/downstream 仅允许合法 ID。

### F-04 校验闭环（覆盖 matrix 全表）
- 修改 `src/core/validators/format-validator.ts`：解析 matrix 全表，检查 ID 列 + upstream/downstream。
- 修改 `src/core/trace-engine/matrix.ts`：必要时返回结构化错误，统一由 `checkMatrix()` 输出。

### F-05 C5 真实 AC 覆盖率
- 修改 `src/shared/types.ts`：确保 `MatrixRow.type` 支持 `AC`。
- 修改 `src/core/trace-engine/trace-context.ts`：加入 `acRows`。
- 修改 `src/core/trace-engine/coverage.ts`：`calcTestCoverageAC()` 改为使用 `AC` 与 `TC`/`TASK` 的真实关联。
- 修改 Gate 条件定义文件（搜索 `C5`）：确保描述与计算一致。

### F-06 stage-state 强校验 + 并发写安全
- 修改 `src/shared/validators.ts`：`isStageState()` 校验完整字段结构。
- 修改 `src/shared/fs-utils.ts`：为 `writeJson` 提供原子写（临时文件 + rename）。
- 修改 `src/core/process-engine/advance.ts`：对 `stage-state.json` 写入引入文件锁或 CAS。

### F-07 auto-loop 退避生效 + todo-state 并发锁
- 修改 `src/core/ai-orchestrator/auto-loop.ts`：在 `retry scheduled` 后执行 sleep(backoffMs)。
- 修改 `src/core/ai-orchestrator/todo-runner.ts`：读写 `todo-state.json` 采用文件锁或 CAS。

### F-08 规则源统一
- 新增 `src/shared/id-rules.ts`：集中定义 ID 类型、正则、链路规则（用于 validator/matrix/coverage）。
- 修改 `src/core/trace-engine/id-validator.ts`、`matrix.ts`、`format-validator.ts`：统一引用规则源。
