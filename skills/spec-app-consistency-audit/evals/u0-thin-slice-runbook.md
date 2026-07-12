# U0 Competing Thin-Slice Runbook

## 目的

在同一 1–2 个样本、同一 evidence allowance 和同一预算下比较两个 disposable arm。U0 不创建 durable Behavior IR schema、normalizer 或 production hot path。

## 固定输入合同

- 样本来自 `pilot-cases.json`，运行前校验 `sample_id`、SHA-256、provenance、known-defect refs、allowed evidence 与 redaction posture。
- `restricted` 数据拒绝进入 prompt 或 validation artifact；无 materialized Figma 时 design finding 标记 `not_evaluable`。
- 两个 arm 获得完全相同的 source excerpts、diff scope、平台信息和已知能力事实；known-defect labels 不提供给生成 arm。

## Arm

- Variant A：使用 `u0-direct-lens-prompt.md`，直接生成 journey findings、counterexamples 和 verification tasks，不产生 IR。
- Variant B：使用 `u0-ir-thin-slice-prompt.md`，先在响应内部生成 disposable core IR 草稿，再生成 obligations、counterexamples 和 verification tasks。
- 输出写入 `docs/validation/<date>-app-assurance-compiler-pilot-baseline/`，标记 `generated/advisory/disposable`。

## 预算

- direct arm 先实测；IR arm token ≤ `min(direct × 1.25, 80k/样本)`。
- IR arm 墙钟 ≤ `min(direct × 1.25, 45min/样本)`。
- IR arm 人类误报审查分钟 ≤ `direct × 1.25`。
- 任一维度超过 direct 25% 即 gate 4 失败；本 runbook 未授权放宽阈值。

## 匿名与裁决

运行协调者随机映射 variant identity，评分者只收到匿名输出、rubric 和允许的 source evidence。至少两名未参与生成、相互独立的评分者完成评分。协调者最后揭盲并输出一个终态：`ir_go`、`direct_lens_wins`、`no_semantic_increment` 或 `samples_unavailable`。

若独立 reviewer primitive 不可用，记录 `dispatch_authorization_missing`，不得把同一 agent 的自评当盲审证据；由于 `ir_go` gate 1 未满足，后续 U1–U9 保持阻断。
