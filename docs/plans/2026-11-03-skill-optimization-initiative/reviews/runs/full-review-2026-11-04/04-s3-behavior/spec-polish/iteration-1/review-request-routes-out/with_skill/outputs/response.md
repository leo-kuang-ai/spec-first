这个请求不属于 `spec-polish` 的工作范围，我按该 skill 的路由规则处理，不在本流程内执行审查。

**路由结论：静态代码审查请使用 `spec-code-review`。**

说明：

- `spec-polish` 只做浏览器交互式打磨——启动 dev server、在浏览器里实际使用功能、根据你的反馈迭代修改。静态代码审查被明确排除在该 workflow 之外（见 `.claude/skills/spec-polish/SKILL.md:18`），而且 skill 里特别指出：即使你直接要求“静态审查、不用起服务”，这仍然是路由出去的条件，不允许在本流程内做——连简化版的“快速过一遍”也不行。
- 我检查了本仓库的 `.claude/skills/` 目录，目前只安装了 `spec-polish`，`spec-code-review` 并不存在。所以现在无法直接切换到该 skill 执行。

你可以任选其一继续：

1. 提供/安装 `spec-code-review` skill，我用它来审查当前分支的改动；
2. 如果只是想现在就拿到审查结果，直接告诉我“用通用代码审查来做”，我会脱离 spec-polish 流程，用内置的 `/code-review` 对当前分支改动做静态审查（同样不需要起服务）。

在你确认之前，我不会开始任何审查工作。
