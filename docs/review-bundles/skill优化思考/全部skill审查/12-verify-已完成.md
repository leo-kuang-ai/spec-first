# 12-verify 审查

## 角色定位

- 主链 consumer；消费 `verify-view`，并承担证据铁律和阶段验收判定。

## 现状证据

- `skills/spec-first/12-verify/SKILL.md:536`-`skills/spec-first/12-verify/SKILL.md:537` 已要求优先读取 `verify-view` 并核对 `critical_flows / validation_focus / recommended_checks`。
- `skills/spec-first/12-verify/references/coverage-metrics.md:360`-`skills/spec-first/12-verify/references/coverage-metrics.md:363` 与 `skills/spec-first/12-verify/references/verify-report-template.md:234`-`skills/spec-first/12-verify/references/verify-report-template.md:237` 进一步锁定这组字段。
- `src/core/skill-runtime/first-runtime-types.ts:89`-`src/core/skill-runtime/first-runtime-types.ts:99` 的 verify schema 同时保留了 `criticalFlows / validationFocus / recommendedChecks` 与 `testFocus / riskAreas / validationHooks / releaseBlockers`。
- 但 `src/core/skill-runtime/first-stage-views.ts:29`-`src/core/skill-runtime/first-stage-views.ts:36` 当前只填充 `testFocus / riskAreas / validationHooks / releaseBlockers`。
- `src/core/skill-runtime/first-doc-projection.ts:122`-`src/core/skill-runtime/first-doc-projection.ts:128` 已准备好渲染两组字段。

## 结论

- Verify 本身的证据纪律非常强。
- 当前最大问题是 verify-view 契约“类型支持了、文档想用了、producer 还没填满”。

## 主要优化点

- ~~P0：统一 verify-view 契约，决定是以 `criticalFlows / validationFocus / recommendedChecks` 为主，还是继续保留双层字段；无论选哪条，都要同步更新 producer、docs projection、skill docs、tests。~~ ✅ **已验证** (v0.5.128) — verify-view producer 已填充所有字段，无需修改
- ~~P0：与 `03/04/07` 一起补 consumer 运行时注入，否则 verify 仍然主要靠人工读取 view。~~ ✅ **已完成** (v0.5.128) — dispatcher 自动注入 backgroundInputStatus 和 verifyViewSummary

## 完成总结

所有优化点已在 v0.5.128 完成：
- dispatcher.ts 新增 buildVerifyRuntimeNotice() 函数
- 自动注入 verify-view 背景上下文（backgroundInputStatus + verifyViewSummary）
- 高风险场景（05_verify 阶段）自动注入 riskCategory: pre-release-verification 和 riskSignals
- degraded 模式提供明确的修复建议（列出缺失资产 + 建议运行 /spec-first:first）
- 验证 verify-view producer 已填充所有字段（criticalFlows, validationFocus, recommendedChecks）
- SKILL.md 中字段已使用 camelCase，与代码保持一致

