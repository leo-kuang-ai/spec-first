# 领域模型执行提示

> 这是按需补证据提示，不是主题规范正文。由 Skill 按执行流决定是否派发。

## 任务范围

- 只做领域对象、关系、状态与业务规则的证据补强，沉淀到 runtime 真源
- 可以综合 API/结构/数据库线索，但不得把 docs 输出回灌为真源

## 输入证据

- 本轮 evidence pack（业务代码中的实体、状态、规则；类型定义；配置）
- Serena 可用时优先使用符号工具，`shared/summary.json` 可作为领域分析起点
- 相关 runtime 资产（如 `structure-overview.json`、`api-contracts.json`、`database-schema.json`）作为已确认上下文

## 输出约束

- 当前任务只负责补足当前 wave 所需证据，帮助生成 `domain-model.json`
- 具体输出资产定义见 `references/domain-model-analysis.md`
- 不得把长篇分析回灌主线程

## 缺口标记

- 无法确认的关系/状态/规则必须标注 `[待确认]`
- 不得把猜测写成确定事实
- 证据抽样与违规判定：`references/quality-assurance-rules.md`
