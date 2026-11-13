已按技能执行 `--check`，退出码为 0；当前 readiness 尚未确认：

- 基线及 generated runtime manifest：`unknown`，setup facts 缺失。
- MCP 配置：CodeGraph、Context7、sequential-thinking 均未验证。
- CodeGraph：项目未初始化，查询未验证。
- Graphify：未安装，查询未验证。
- agent-browser：`degraded`，能力探测无效；可选 ast-grep skill 也为 `degraded`。
- 其余所列 helper：`ready`。
- 项目配置：示例和 gitignore 规则缺失，本地配置使用默认值。

本次仅检查状态，未安装、修改 host 配置或写入 setup facts，也未运行 `--verify-only`。
