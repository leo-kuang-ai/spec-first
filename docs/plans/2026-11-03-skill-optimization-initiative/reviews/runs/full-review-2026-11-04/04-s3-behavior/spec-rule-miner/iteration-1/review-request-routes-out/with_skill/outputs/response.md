已读取 `spec-rule-miner` 的定义并完成路由判断：

**这是代码质量评审请求，属于 `spec-code-review`，不是 `spec-rule-miner` 的职责范围。**

依据 skill 自身的边界约定：

- **When Not To Use** 明确排除「审查当前 diff、修复代码、重构、调试」这类工作——`spec-rule-miner` 只做一件事：从仓库真实代码中挖掘项目级编码规则，写入独立规则文件并让 `AGENTS.md`/`CLAUDE.md` 引用。
- 近邻路由规则要求：命中代码评审请求时，正确动作是**点名目的地 skill（`spec-code-review`）并交还路由**，不得在本会话内代行评审——即使你直接说「帮我审了」，也不构成跨 workflow 代行授权。

所以我不会在这里直接输出对 `src/server.js` 的评审结论。请通过 `spec-code-review` 入口发起这次评审。

如果你之后想做的事其实是——分析这个仓库的编码习惯、生成项目规则文件（供 AI 编码时遵循），那就正好落在 `spec-rule-miner` 范围内，随时告诉我即可。
