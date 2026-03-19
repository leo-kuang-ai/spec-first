# 主线程契约

> `first` 主线程的 canonical contract。
> 目标是让主线程只保留协调、裁决与验收所需的最小上下文，不再携带原始长证据正文。

## 1. 当前 Feature

- 必须明确当前 Feature ID
- 若 Feature 未知，必须先恢复或定位 Feature，再继续后续波次
- 主线程只保留 Feature 标识，不保留原始证据正文

## 2. 当前波次

- 必须明确当前处理的 wave
- wave 只描述当前阶段要做什么，不复述完整执行流
- 主线程只保留本轮 wave 名称、目标与阻断条件

## 3. 资产目标

- runtime wave 产出结构化 JSON
- docs wave 产出 Markdown 阅读产物
- 主线程只传 asset 名称与约束，不传长证据全文

## 4. 并发上限

- 并发由 `runtime.auto_orchestrate.max_parallel` 控制（默认值见配置；范围通常为 `1-4`）
- 主线程不得私自提升并发，需要调优必须通过配置变更
- 主线程只调度，不扩展并发上限，也不携带子任务长上下文

## 5. 重试规则

- 每个任务最大重试次数由 `runtime.auto_orchestrate.max_retry_per_task` 控制（默认值见配置）
- 遵守 `runtime.auto_orchestrate.retry_backoff_ms` 与 `runtime.auto_orchestrate.max_total_retry_duration_ms`
- 超限或仍失败则标记 `blocked` / `retryable`，不能伪造结果补洞

## 6. 验收条件

- runtime 资产可解析
- docs 产物可存在性检查通过
- `status / orchestrate / init / first` 不出现回归
- 所有正式结论都能追溯到 evidence path 或 runtime asset path

## 7. 禁止保留

- 禁止保留原始证据正文（主线程不得携带长证据全文）
- 原始证据正文
- 每个 agent 的完整推理过程
- runtime/docs 的冗长正文
- 任何无法追溯来源的臆测结论
