# 领域模型资产生成规范

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

约束：
- `domain-model.md` 只作为投影视图存在
- 领域事实必须先沉淀到 `domain-model.json`

## 3. 资产生成要求

- 核心业务对象有哪些
- 概念边界如何划分
- 关键关系和状态变化是什么
- 哪些规则是不可破坏的

## 4. LLM 归纳边界

- 先沉淀结构化领域事实，再投影 Markdown
- 允许归纳，但不得脱离代码和配置证据自由发挥
- 数据库证据只作为补充来源，不得要求数据库一定存在
- 无法确认的关系或状态必须标注 `[待确认]`

## 5. schema 约束

- `domain-model.json` 至少应包含：
  - entities
  - glossary
  - evidence
- 实体/概念、关系、状态、规则都必须能回溯到证据
- 不得把投影视图中的叙述回灌为真源

## 6. 冲突处理

- 接口证据与代码证据冲突时，以代码/配置为先
- 数据库 schema 与领域概念不完全一致时，允许记录“存储模型 ≠ 领域模型”
- 冲突项必须进入 `domain-model.json.evidence` 或待确认说明

## 7. 投影要求

- `domain-model.md` 只负责把 `domain-model.json` 结构化事实转成可读文档
- 不得在投影层补充 runtime truth 中不存在的新事实
- 默认中文输出，术语、路径、代码标识符保留英文原文

## 8. 质量保障

- 通用证据格式、抽样流程、违规判定：见 `references/quality-assurance-rules.md`
