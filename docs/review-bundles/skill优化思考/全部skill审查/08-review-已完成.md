# 08-review 审查

## 角色定位

- 实现阶段的辅助 review skill；负责合规与质量双阶段审查。

## 现状证据

- `skills/spec-first/08-review/SKILL.md:13`-`skills/spec-first/08-review/SKILL.md:21` 已定义两阶段审查协议。
- `skills/spec-first/08-review/SKILL.md:61`-`skills/spec-first/08-review/SKILL.md:67` 已定义 layer 选择。
- 当前文档没有 `code-view`、`background_input_status` 或 orchestrate 风险信号。

## 结论

- review 方法论不错，但与新的背景治理体系还是割裂的。

## 主要优化点

- ~~P1（推断性建议）：在 review 前展示 `backgroundInputStatus` 与 `code-view` 摘要，特别是高风险 review。~~ ✅ **已完成** (v0.5.126) — dispatcher 自动注入 code-view 摘要和背景状态
- ~~P1（推断性建议）：让 review 能读到 orchestrate 的 `riskCategory / riskSignals`，避免”只看 diff，不看阶段风险”。~~ ✅ **已完成** (v0.5.126) — 高风险场景自动注入 riskCategory 和 riskSignals

