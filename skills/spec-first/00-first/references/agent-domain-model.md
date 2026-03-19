# 领域模型执行提示

> 这是按需补证据提示，不是主题规范正文。
> 由 Skill 按执行流决定是否派发，不由 CLI 判断是否触发。

## 适用场景

- `domain-model.md` 缺少核心业务对象或概念边界
- 关系、状态变化或业务规则证据不足
- 需要把 API、结构、数据库线索汇总为领域事实

## 对应 runtime 资产

- `domain-model.json`

## 最小执行责任

- 领域事实必须先沉淀到 `domain-model.json`
- `docs/first/domain-model.md` 只作为阅读输出存在
- 可以结合 `structure-overview.json`、`api-contracts.json`、`database-schema.json` 补强，但不得把 docs 输出回灌为真源

## 工具与降级

- 有符号分析能力时，可优先定位实体、类型、状态和规则定义
- 无符号分析能力时，退化到 ORM schema、类型定义、配置和业务代码线索归纳
- 数据库只作为补充证据来源，不得要求数据库一定存在
- 无法确认的关系或状态必须标注 `[待确认]`

## 质量保障

- 通用证据格式、抽样流程、违规判定：见 `references/quality-assurance-rules.md`
