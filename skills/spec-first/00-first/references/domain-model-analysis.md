# 领域模型分析主题

> **当前正式 contract**：单一标准模式 runtime-first。
> 正式真源以 `domain-model.json` 为准；`domain-model.md` 为该真源的投影视图。

## 1. 输入来源

- `summary.json`
- `structure-overview.json`
- `api-contracts.json`
- `database-schema.json`（如适用）
- 代码与配置中的业务概念证据

## 2. 正式输出

### runtime truth

- `domain-model.json`

### projection docs

- `docs/first/domain-model.md`

## 3. 必须回答的问题

- 核心业务对象有哪些
- 概念边界如何划分
- 关键关系和状态变化是什么
- 哪些规则是不可破坏的

## 4. 输出约束

- 先沉淀结构化领域事实，再投影 Markdown
- 允许归纳，但不得脱离代码和配置证据自由发挥
- 数据库证据只作为补充来源，不得要求数据库一定存在
- 默认中文输出，术语、路径、代码标识符保留英文原文

## 5. 降级策略

- 缺少数据库证据时，仅基于代码与接口归纳领域模型
- 无法确认的关系或状态必须标注 `[待确认]`
- 不得虚构状态机、关系图或业务规则

## 6. 质量保障

- 通用证据格式、抽样流程、违规判定：见 `references/quality-assurance-rules.md`
