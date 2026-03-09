# Background Quality Contract

## Purpose

背景质量 contract 用于统一 `spec-first` 多个 skill 对背景输入完整度、runtime 真源、docs 投影视图和同步状态的最小公共语义。

## Naming Layers

- 内部字段名（runtime / code / JSON）：`backgroundInputStatus`
- 文档输出字段名（report / dashboard / skill docs）：`background_input_status`

## Canonical Output Fields

当 skill 输出背景状态卡片或背景质量结论时，必须包含以下字段：

- `background_input_status`
- `runtime 真源`
- `docs 投影视图`
- `同步状态`

如输出完整结论块，建议补充：

- `建议动作`

## Enums

### `background_input_status`

- `full`
- `degraded`
- `blind`

### `runtime 真源`

- `healthy`
- `degraded`
- `missing`

### `docs 投影视图`

- `synced`
- `stale`
- `drifted`

### `同步状态`

- `in_sync`
- `stale`
- `drifted`

## Minimal Semantics

- `background_input_status=full`：背景输入完整，可支持高置信结论。
- `background_input_status=degraded`：背景输入部分可用，但完整性不足。
- `background_input_status=blind`：缺少关键背景输入，不应直接给出高置信判断。
- `runtime 真源=missing`：无法确认 runtime 事实真源。
- `docs 投影视图=drifted`：docs 与 runtime 已明显偏离。
- `同步状态!=in_sync`：输出中必须给出建议动作。

## Severity Floor

- `background_input_status=blind` → 不得低于 `HIGH`
- `runtime 真源异常 / missing` → 不得低于 `HIGH`
- `docs 投影视图=drifted` → 不得低于 `MEDIUM`
- `同步状态=stale/drifted` → 不得低于 `MEDIUM`
