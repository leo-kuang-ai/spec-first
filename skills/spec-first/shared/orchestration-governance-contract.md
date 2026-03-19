# Orchestration Governance Contract

## Purpose

编排治理 contract 用于统一 `spec-first` 在 plan / orchestrate 两个路由节点上对依赖强度、风险类别、高风险信号与推荐动作的最小公共语义。

## Scope

本 contract 只覆盖：

- `11-plan`
- `13-orchestrate`

不替代 `background-quality-contract.md`：

- `backgroundInputStatus`
- `background_input_status`
- `runtime 真源`
- `docs 输出`
- `同步状态`

仍由 `background-quality-contract.md` 负责。

## Naming Layers

### Plan 输入层 / runtime metadata

plan 侧治理信号输入字段使用 camelCase：

- `dependencyStrength`
- `riskCategory`
- `riskSignals`

plan 的背景输入完整度字段继续使用：

- `backgroundInputStatus`

### Orchestrate 内部 runtime 结构

orchestrate 运行时内部结构允许使用 camelCase：

- `backgroundStatus`
- `dependencyStrength`
- `riskCategory`
- `riskSignals`
- `recommendedAction`

### Orchestrate 展示层 / user-visible guidance

orchestrate 输出给用户的展示层字段统一使用 snake_case：

- `background_status`
- `dependency_strength`
- `risk_category`
- `risk_signals`
- `recommended_action`

## Canonical Enums

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

- `background_status=blind`：必须优先提示补跑 `/spec-first:first`，且 `recommended_action` 不得弱于 `backfill-first`
- `background_status=degraded` 且 `dependency_strength=L2/L3`：不得静默推进，应显式提示风险评估
- 检测到高风险信号且当前阶段映射到高依赖门槛时，展示层应输出 `risk_category` 与 `risk_signals`
- `11-plan` 负责承接输入层治理信号，不负责把治理字段改写成 snake_case 展示协议
- `13-orchestrate` 负责把治理信号投影为用户可见的 snake_case 字段

## Non-Goals

本 contract 不做以下事情：

- 不定义 runtime 真源
- 不替代 `background-quality-contract.md`
- 不修改现有 runtime 计算逻辑
- 不新增风险类别
- 不把治理信号扩散到全部 skill
