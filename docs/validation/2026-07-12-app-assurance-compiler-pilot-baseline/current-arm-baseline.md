# Current-Arm Baseline

在两个只有 journey、platform 和 symbol 名称的 synthetic fixture 上：

- Current `spec-code-review`：`not_run / insufficient diff evidence`。没有 file/line/diff，confirmed/actionable findings 均为 0，不能给 merge verdict。
- Current App Audit runner：source-confirmed 行为是 `issue_synthesis_status:not_run` 和 `Verdict: Awaiting LLM audit`。
- Current App Audit expert chain：仅按现有 prompt contract 投射，可能提出 duplicate submit、error recovery、permission Settings return 和 platform ownership 的候选检查，但不是实际执行结果。
- Figma coverage：`not_evaluable`。
- Known defects used as generation input：`false`。

主要盲点：Code Review 以 changed code/merge risk 为中心，不主动建立跨来源 journey；当前 App Audit runner 与 LLM 语义链断开，extractors 只提供 regex/path/name candidate facts。
