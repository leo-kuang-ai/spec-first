# 规范与本地环境执行提示

> 这是按需补证据提示，不是主题规范正文。由 Skill 按执行流决定是否派发。

## 任务范围

- 只做规范与本地环境补强，沉淀到 runtime 真源
- 覆盖：规则来源、运行时版本、安装/启动命令、环境变量来源、最小验证路径

## 输入证据

- 本轮 evidence pack（配置文件、脚本、环境模板、启动与验证命令）
- Serena 可用时优先使用符号工具，`shared/summary.json` 与 `shared/context.json` 用于快速定位入口与环境线索
- 代码与配置中可见的版本约束与规则（如 package.json / toolchain / CI）

## 输出约束

- 当前任务只负责补足当前 wave 所需证据，帮助生成 `conventions.json` 与 `entry-guide.json`
- 具体输出资产定义见 `references/conventions-and-setup.md`
- 不得把长篇分析回灌主线程

## 缺口标记

- 缺少配置/示例文件时，只输出“代码中可见的最低规则/路径”，并标注 `[待确认]`
- 无法确认的步骤必须标注 `[待确认]`，不得编造可运行命令
- 证据抽样与违规判定：`references/quality-assurance-rules.md`
