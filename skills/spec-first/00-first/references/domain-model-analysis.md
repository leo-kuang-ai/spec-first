# 领域模型资产产出规范

> **当前正式 contract**：单一标准模式 runtime-first。
> 正式真源以 `domain-model.json` 为准；`domain-model.md` 为该真源的阅读输出。

## 1. 输入来源

- `summary.json`
- `structure-overview.json`
- `api-contracts.json`
- `database-schema.json`（如适用）
- 代码与配置中的业务概念证据

## 2. 正式输出

### runtime truth

- `domain-model.json`

### docs outputs

- `docs/first/domain-model.md`

约束：
- `domain-model.md` 只作为阅读输出存在
- 领域事实必须先沉淀到 `domain-model.json`

## 3. 资产产出要求

- 核心业务对象有哪些
- 概念边界如何划分
- 关键关系和状态变化是什么
- 哪些规则是不可破坏的

## 4. LLM 归纳边界

- 先沉淀结构化领域事实，再产出相应阅读文档
- 允许归纳，但不得脱离代码和配置证据自由发挥
- 数据库证据只作为补充来源，不得要求数据库一定存在
- 无法确认的关系或状态必须标注 `[待确认]`

## 5. schema 约束

- `domain-model.json` 至少应包含：
  - entities
  - glossary
  - evidence
- 实体/概念、关系、状态、规则都必须能回溯到证据
- 不得把 docs 输出中的叙述回灌为真源

## 6. 冲突处理

- 接口证据与代码证据冲突时，以代码/配置为先
- 数据库 schema 与领域概念不完全一致时，允许记录“存储模型 ≠ 领域模型”
- 冲突项必须进入 `domain-model.json.evidence` 或待确认说明

## 7. 文档产出要求

- `domain-model.md` 只负责把 `domain-model.json` 结构化事实展开成可读文档
- 不得在文档产出阶段补充 runtime truth 中不存在的新事实
- 默认中文输出，术语、路径、代码标识符保留英文原文

## 8. 质量保障

- 通用证据格式、抽样流程、违规判定：见 `references/quality-assurance-rules.md`
