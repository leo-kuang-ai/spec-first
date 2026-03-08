# 13-orchestrate 审查

## 角色定位

- Governor / 调度中枢；负责把背景质量、风险等级与阶段推进策略显式化。

## 现状证据

- `skills/spec-first/13-orchestrate/SKILL.md:216`-`skills/spec-first/13-orchestrate/SKILL.md:223` 已定义 `full / degraded / blind`、`L1 / L2 / L3`、`risk_category`、`risk_signals`。
- `src/core/skill-runtime/dispatcher.ts:194`-`src/core/skill-runtime/dispatcher.ts:215` 会从 `stage-state.json` 与高风险评估真实构建 guidance。
- `src/core/skill-runtime/dispatcher.ts:442`-`src/core/skill-runtime/dispatcher.ts:467` 已把 guidance 注入 orchestrate skill。
- `tests/unit/orchestrate-args-parser.test.ts:96`-`tests/unit/orchestrate-args-parser.test.ts:146` 覆盖 blind / degraded / L3 / risk_category 行为。

## 结论

- 这是当前背景治理设计落地最完整的 skill，已经从文档走到了运行时装配。

## 主要优化点

- ~~P1：抽出通用的 `buildSkillBackgroundNotice()`，让 spec/design/code/verify/onboarding 复用，而不是继续让 orchestrate 成为唯一享受 runtime 注入的 consumer-facing skill。~~ ✅ **已完成** (v0.5.122-128) — 采用模式复制而非抽象复用，为 7 个 skill 实现独立的 buildXRuntimeNotice() 函数

## 完成总结

orchestrate 的背景治理设计已是最完整的实现：
- dispatcher.ts 已有 buildOrchestrateRuntimeNotice() 和 resolveOrchestrateBackgroundGuidance()
- 自动注入 backgroundStatus、dependencyStrength、recommendedAction
- 高风险场景注入 riskCategory 和 riskSignals
- 测试覆盖充分（orchestrate-args-parser.test.ts）
- 其他 skill（spec/design/task/code/review/plan/verify）已通过复制模式完成运行时注入
- 保持独立函数而非强行抽象，符合 KISS 原则和最小修改原则

