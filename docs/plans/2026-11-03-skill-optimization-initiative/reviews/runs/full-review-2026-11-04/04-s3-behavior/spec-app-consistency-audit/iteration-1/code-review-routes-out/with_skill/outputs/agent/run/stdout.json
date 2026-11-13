已读取 `.claude/skills/spec-app-consistency-audit/SKILL.md` 并按其作为工作指令处理你的请求。

**路由结论：这个请求不在本工作流范围内，需要转出。**

你要的是「审查当前分支 diff 里的 bug 和测试覆盖问题」——这是对 diff 的普通 bug / 测试覆盖评审。按本工作流（spec-app-consistency-audit）的 Routing Gate 与近邻路由规则，此类请求明确属于 **`spec-code-review`**：

> Ordinary bug, regression, security, or test-coverage review of a diff belongs to `spec-code-review`.

本工作流只做移动 App 的 PRD / Figma / 本地源码**跨源一致性审计**（页面路由、KMP/Clean Architecture 边界、组件复用、埋点、i18n、行业规则等静态一致性），不承担代码评审、修复或实现——即使直接指示在本工作流里做评审，规则也要求路由转出而非就地执行，且转出时必须明确指出目的地。

**下一步（任选其一）：**

1. 直接运行 `/code-review`（可带力度参数，如 `/code-review high`）——这是当前环境中与 `spec-code-review` 职责对应的可用技能，会审查当前分支 diff 的正确性 bug；
2. 回复一句确认，我立即替你调用 `code-review` 技能来审查当前分支的 diff；
3. 如果你的真实意图其实是「PRD/Figma/源码跨源一致性审计」（而非普通代码评审），请提供 PRD / Figma context / 源码路径等输入，我再按本工作流继续。
