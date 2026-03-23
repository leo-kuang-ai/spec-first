# 数据库执行提示

> 这是按需补证据提示，不是主题规范正文。由 Skill 按执行流决定是否派发。

## 任务范围

- 只做数据库能力判断与 schema 事实补强，沉淀到 runtime 真源
- 只在 `databaseSchema.status === healthy` 时允许下游数据库 docs 输出（docs 仅投影，不回灌真源）

## 输入证据

- ORM schema、migrations、配置、repository/entity 线索
- Serena 可用时优先使用符号工具，`shared/summary.json` 与 `shared/context.json` 可作为数据库线索起点
- 只有在必要且安全时才做即时连接探测

## 输出约束

- 当前任务只负责补足当前 wave 所需证据，帮助生成 `database-schema.json`
- 具体输出资产定义见 `references/database-conditional-projection.md` 与 `references/database-config.md`
- 不得把长篇分析回灌主线程

## 缺口标记

- 无法确认的 schema 或 status 必须标注 `[待确认]`
- 凭证防护（强制）：最小暴露、日志脱敏（日志中敏感片段替换为 `***`）、禁止输出密码/完整连接串/长期令牌、探测结束后清理临时明文引用
- 证据抽样与违规判定：`references/quality-assurance-rules.md`
