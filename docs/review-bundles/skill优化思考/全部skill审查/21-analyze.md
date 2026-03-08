# 21-analyze 审查

## 角色定位

- 背景治理的分析层；负责把背景质量纳入一致性分析。

## 现状证据

- `skills/spec-first/21-analyze/SKILL.md:58`-`skills/spec-first/21-analyze/SKILL.md:59` 已要求分析 `background_input_status` 与 runtime/docs 漂移。
- `skills/spec-first/21-analyze/references/analysis-rules.md:204`-`skills/spec-first/21-analyze/references/analysis-rules.md:206` 已写明背景质量规则。
- `src/core/gate-engine/sca.ts:38`-`src/core/gate-engine/sca.ts:115` 真正实现了 degraded background、stage-views unhealthy、docs 投影视图漂移的 finding。
- `tests/unit/analyze-background-quality.test.ts:25`-`tests/unit/analyze-background-quality.test.ts:67` 已覆盖背景质量 finding。

## 结论

- analyze 已经和最佳设计基本闭环，是本轮较成熟的治理 skill。

## 主要优化点

- P1：把 analyze 的背景质量 finding 与 orchestrate 的推荐动作进一步打通，形成“发现问题 → 给出推进/回补建议”的闭环。

