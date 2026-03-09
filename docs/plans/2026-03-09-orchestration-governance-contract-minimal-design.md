# Orchestration Governance Contract Minimal Design

**Date:** 2026-03-09
**Scope:** 为 `11-plan` 与 `13-orchestrate` 增加最小共享治理信号约定，避免 `dependencyStrength / riskCategory / riskSignals` 继续手工漂移。

## Problem

当前 `background-quality-contract` 已覆盖背景输入完整度与展示命名，但 `orchestrate` 相关治理信号仍分散在：

- `skills/spec-first/11-plan/SKILL.md`
- `skills/spec-first/13-orchestrate/SKILL.md`
- `src/core/skill-runtime/orchestrate-args.ts`
- `src/core/skill-runtime/dispatcher.ts`
- 多个 runtime / dispatcher 单测

现状问题不是“实现缺失”，而是“共享文档约定缺失”：

1. `11-plan` 以输入层 camelCase 暴露 `dependencyStrength / riskCategory / riskSignals`
2. `13-orchestrate` 以用户可见 snake_case 暴露 `background_status / dependency_strength / risk_category / risk_signals / recommended_action`
3. 两者已经形成事实标准，但还没有独立 contract 承接
4. 若继续只靠 skill 文档局部描述，后续极易再次漂移

## Existing Truth Source

本次设计必须严格贴合已有实现，不引入新字段语义：

- `src/core/skill-runtime/orchestrate-args.ts`
  - `BackgroundInputGuidance`
  - `dependencyStrength`
  - `riskCategory`
  - `riskSignals`
  - `recommendedAction`
- `src/core/skill-runtime/dispatcher.ts`
  - `buildOrchestrateRuntimeNotice()` 输出：
    - `background_status`
    - `dependency_strength`
    - `recommended_action`
    - `risk_category`
    - `risk_signals`
  - `buildPlanRuntimeNotice()` 输出：
    - `backgroundInputStatus`
    - `dependencyStrength`
    - `riskCategory`
    - `riskSignals`

因此，本次只把“已存在的稳定语义”抽成共享文档，不改 runtime 行为。

## Options

### Option A — 最小共享 contract（推荐）

新增 `skills/spec-first/shared/orchestration-governance-contract.md`，只覆盖：

- orchestrate 治理信号字段
- plan 的输入层字段命名
- orchestrate 的展示层字段命名
- 最小语义与边界说明

并只 patch：

- `skills/spec-first/11-plan/SKILL.md`
- `skills/spec-first/13-orchestrate/SKILL.md`
- 对应文档测试

**优点**
- 变更最小
- 与当前实现完全一致
- 风险低，收益高
- 不扰动已完成的 `background-quality-contract`

**缺点**
- 仍保留两个相邻 contract，需要理解“背景质量”和“治理信号”是两个层次

### Option B — 把 review/code 也并入治理信号 contract

让 `08-review` / `07-code` 也显式引用新的治理信号 contract。

**优点**
- 覆盖面更大

**缺点**
- 容易把“背景输入 contract”和“编排治理 contract”混在一起
- 超出当前 runtime 真正稳定的 consumer 边界

### Option C — 连 runtime 字段一起统一重命名

把 plan/orchestrate 内部字段全部重新收敛到一套命名。

**优点**
- 表面上更统一

**缺点**
- 会直接扰动已存在实现与测试
- 风险高，明显违反最小补丁原则

## Decision

采用 **Option A**。

## Contract Shape

建议新增共享文档：`skills/spec-first/shared/orchestration-governance-contract.md`

### Scope

只覆盖以下 consumer / router：

- `11-plan`
- `13-orchestrate`

不覆盖：

- `00-first`（truth source producer）
- `00-onboarding`（入口裁剪器）
- `08-review` / `07-code`（本轮不作为治理信号 contract consumer）

### Naming Layers

#### Plan 输入层 / metadata / runtime 上下文

使用 camelCase：

- `dependencyStrength`
- `riskCategory`
- `riskSignals`

并继续沿用 `background-quality-contract.md` 中的：

- `backgroundInputStatus`

#### Orchestrate 展示层 / user-visible guidance

使用 snake_case：

- `background_status`
- `dependency_strength`
- `risk_category`
- `risk_signals`
- `recommended_action`

#### Orchestrate 内部 runtime 结构

允许继续使用已有 camelCase：

- `backgroundStatus`
- `dependencyStrength`
- `riskCategory`
- `riskSignals`
- `recommendedAction`

## Enums

### `background_status`

- `full`
- `degraded`
- `blind`

### `dependency_strength`

- `L1`
- `L2`
- `L3`

### `risk_category`

- `formal-design-review`
- `high-risk-implementation`
- `pre-release-verification`

### `recommended_action`

- `proceed`
- `review-risk`
- `backfill-first`

## Minimal Semantics

- `background_status=blind`：必须优先提示补跑 `/spec-first:first`，且 `recommended_action` 不应弱于 `backfill-first`
- `background_status=degraded` 且 `dependency_strength=L2/L3`：不得静默推进，应给出风险评估提示
- 若存在高风险信号且当前阶段映射到高依赖门槛，orchestrate 展示层应显式输出 `risk_category` 与 `risk_signals`
- `11-plan` 负责承接输入层治理信号，不负责把这些字段改写成 snake_case 展示协议
- `13-orchestrate` 负责把治理信号投影为用户可见的 snake_case 字段

## Non-Goals

本轮不做：

- 不修改 runtime 计算逻辑
- 不新增风险类别
- 不把 `background_input_status` 并入本 contract
- 不把 `orchestrate` 的治理信号扩散到全部 skill
- 不引入模板系统或 include 机制

## Testing Strategy

采用文档 TDD：

1. 新增共享 contract 测试，校验 contract 文件存在且包含最小字段与枚举
2. 新增/扩展 plan skill docs 测试，校验其显式引用新 contract，并声明 camelCase 输入层字段边界
3. 新增 orchestrate skill docs 测试，校验其显式引用新 contract，并声明 snake_case 展示层字段边界
4. 复用现有 runtime 单测作为实现真相，不改动其断言语义

## Expected Outcome

完成后将形成清晰分层：

- `background-quality-contract.md`：背景输入完整度 / runtime 真源 / docs 投影视图 / 同步状态
- `orchestration-governance-contract.md`：编排治理信号 / 依赖强度 / 风险类别 / 推荐动作

这样后续再改 `11-plan`、`13-orchestrate` 或相关测试时，不需要再次手工推断字段命名与边界。
