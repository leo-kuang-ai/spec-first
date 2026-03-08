# 00-onboarding 审查

## 角色定位

- Entry consumer；负责把 `00-first` 背景裁剪成面向角色的入口建议。

## 现状证据

- `skills/spec-first/00-onboarding/SKILL.md:33`、`skills/spec-first/00-onboarding/SKILL.md:35` 已明确“role-views 优先”和 `degraded onboarding`。
- `tests/unit/onboarding-skill-docs.test.ts:12`-`tests/unit/onboarding-skill-docs.test.ts:31` 已校验 role-views 优先与降级口径。

## 结论

- 文档口径与最佳设计一致，入口层职责清晰。
- 但目前仍偏“文档约束”，不是“运行时自动供给”。

## 主要优化点

- ~~P1：补一个通用背景注入入口~~ ✅ **已修复** (v0.5.119) — dispatcher 自动注入 role-views 可用性
- ~~P1：在输出里显式标注当前建议来源~~ ✅ **已修复** (v0.5.119) — 正常模式标注"基于项目分析"，降级模式标注"通用推荐"

