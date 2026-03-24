# 领域模型分析

> 本文档合并了执行提示与主题规范,提供完整的领域模型分析视图。

## 1. 正式输出

### runtime truth
- `domain-model.json`

### docs outputs
- `docs/first/domain-model.md`

约束:
- `domain-model.md` 只作为阅读输出存在
- 领域事实必须先沉淀到 `domain-model.json`

## 2. 任务范围

- 只做领域对象、关系、状态与业务规则的证据补强,沉淀到 runtime 真源
- 可以综合 API/结构/数据库线索,但不得把 docs 输出回灌为真源

## 3. 输入证据

- 本轮 evidence pack(业务代码中的实体、状态、规则；类型定义；配置)
- Serena 可用时优先使用符号工具,`shared/summary.json` 可作为领域分析起点
- 相关 runtime 资产(如 `structure-overview.json`、`api-contracts.json`、`database-schema.json`)作为已确认上下文

## 4. 输入来源

- `summary.json`
- `structure-overview.json`
- `api-contracts.json`
- `database-schema.json`(如适用)
- 代码与配置中的业务概念证据

## 5. 资产产出要求

- 核心业务对象有哪些
- 概念边界如何划分
- 关键关系和状态变化是什么
- 哪些规则是不可破坏的

## 6. LLM 归纳边界

- 先沉淀结构化领域事实,再产出相应阅读文档
- 允许归纳,但不得脱离代码和配置证据自由发挥
- 数据库证据只作为补充来源,不得要求数据库一定存在
- 无法确认的关系或状态必须标注 `[待确认]`

## 7. schema 约束

- `domain-model.json` 至少应包含:
  - entities
  - glossary
  - evidence
- 实体/概念、关系、状态、规则都必须能回溯到证据
- 不得把 docs 输出中的叙述回灌为真源

## 8. 输出约束

- 当前任务只负责补足当前 wave 所需证据,帮助生成 `domain-model.json`
- 不得把长篇分析回灌主线程

## 9. 冲突处理

- 接口证据与代码证据冲突时,以代码/配置为先
- 数据库 schema 与领域概念不完全一致时,允许记录"存储模型 ≠ 领域模型"
- 冲突项必须进入 `domain-model.json.evidence` 或待确认说明

## 10. 缺口标记

- 无法确认的关系/状态/规则必须标注 `[待确认]`
- 不得把猜测写成确定事实

## 11. 文档产出要求

- `domain-model.md` 只负责把 `domain-model.json` 结构化事实展开成可读文档
- 不得在文档产出阶段补充 runtime truth 中不存在的新事实
- 默认中文输出,术语、路径、代码标识符保留英文原文

## 12. 降级策略

- 无数据库项目:允许只基于代码与配置证据
- 仅有弱线索:允许记录待确认项,不得伪造领域关系

## 13. 质量门禁引用

- 通用证据格式、抽样验证与违规判定统一遵循 `references/quality-assurance-rules.md`
