---
title: First Skill MD 重构 Batch 3 执行任务清单
date: 2026-03-16
author: Codex
status: proposal
version: 1.0
parent: ./实施批次清单.md
---

# First Skill MD 重构 Batch 3 执行任务清单

> Batch 3 目标：收口 `first` 的五类专题能力规范，使代码结构、API、环境与规范、领域模型、数据库认知都转入 runtime-first 的统一生成体系。

---

## 一、范围

Batch 3 覆盖以下 6 个文件：

1. `skills/spec-first/00-first/references/agents-code-analysis.md`
2. `skills/spec-first/00-first/references/agents-api-deps.md`
3. `skills/spec-first/00-first/references/agent-guidelines-setup.md`
4. `skills/spec-first/00-first/references/agent-domain-model.md`
5. `skills/spec-first/00-first/references/agent-database.md`
6. `skills/spec-first/00-first/references/database-config.md`

这些文件共同决定专题型资产与专题型文档的来源、边界与条件生成规则。

---

## 二、目标

Batch 3 完成后，文档层面必须达成以下结果：

1. 五类专题能力都从“直接生成 markdown”转成“先生成 runtime truth，再投影专题文档”。
2. 每类专题能力都明确：
   - 证据来源
   - 结构化 schema
   - LLM 是否参与
   - 条件生成规则
   - 对应 docs/first 文档
3. `database-er.md` 被正式纳入条件型能力，而不是遗留文档。
4. 每类专题能力都能说明其对下游 skill 的价值。

---

## 三、任务拆解

### T3.1 重写 `agents-code-analysis.md`

目标：

- 把代码分析链从旧 A1/A2/A3 文档输出改成结构化资产 + 专题投影

修改点：

1. 删除旧产物承诺：
   - `codebase-overview.md`
   - `architecture.md`
   - `call-graph.md`
   作为真源输出的表述
2. 定义 `structure-overview.json` 的抽取范围：
   - 模块
   - 关键目录
   - 入口点
   - 结构边界
3. 定义 `architecture.md` 的专题投影规则
4. 定义 `call-graph.md` 的条件投影规则

完成标准：

- 代码分析主产物变成 `structure-overview.json`
- `architecture.md` 与 `call-graph.md` 都只是投影

### T3.2 重写 `agents-api-deps.md`

目标：

- 把 API 与外部依赖能力收口到 runtime-first

修改点：

1. 定义 `api-contracts.json` 的抽取规则：
   - 入口边界
   - handler
   - 参数
   - 返回结构
   - 外部边界
2. 定义 `api-docs.md` 的投影规则
3. 定义 `external-deps.md` 的专题投影规则
4. 明确哪些依赖属于“外部服务/第三方集成”，哪些仅属于内部依赖

完成标准：

- `api-docs.md` 明确只从 `api-contracts.json` 投影
- `external-deps.md` 明确只作为专题文档存在

### T3.3 重写 `agent-guidelines-setup.md`

目标：

- 把研发规范和环境搭建能力转成 runtime 来源 + 专题视图

修改点：

1. 定义 `conventions.json` 的规范来源：
   - 配置
   - 测试脚本
   - 项目约定
   - 交付规则
2. 定义 `development-guidelines.md` 的专题投影规则
3. 定义 `local-setup.md` 的专题投影规则
4. 区分：
   - `conventions.md` 为规范总览
   - `development-guidelines.md` 为专题展开

完成标准：

- 规范与环境不再通过旧 C2 直接产文档

### T3.4 重写 `agent-domain-model.md`

目标：

- 把领域模型从自然语言产物转为受约束高语义资产

修改点：

1. 定义领域证据抽取来源：
   - type / interface
   - entity / model / schema
   - 关键 service 关系
   - 业务命名聚类
2. 定义 `domain-model.json` schema
3. 定义 LLM 归纳边界：
   - 可归纳
   - 不可虚构
   - 冲突标注
4. 定义 `domain-model.md` 的投影规则

完成标准：

- `domain-model.md` 不再是 LLM 直写文档
- `domain-model.json` 成为正式真源

### T3.5 重写 `agent-database.md`

目标：

- 把数据库认知转为条件型正式能力

修改点：

1. 定义数据库适用性检测：
   - ORM schema
   - migration
   - SQL ddl
   - config evidence
2. 定义 `database-schema.json` schema：
   - entities
   - fields
   - relationships
   - constraints
   - risks
3. 定义 `database-er.md` 的条件投影规则
4. 明确数据库不适用项目的降级行为

完成标准：

- `database-er.md` 只在条件满足时生成

### T3.6 重写 `database-config.md`

目标：

- 为数据库专题能力提供支持性规则

修改点：

1. 说明支持的 schema 来源优先级
2. 说明连接信息是否允许使用
3. 说明无数据库 / 弱数据库项目如何处理
4. 说明数据库文档与领域模型的边界

完成标准：

- `database-config.md` 能作为 `agent-database.md` 的支撑规范

---

## 四、删除项清单

Batch 3 中必须显式删除的旧内容包括：

1. 按 Agent 直接承诺生成 `architecture/call-graph/api-docs/development-guidelines/local-setup/database-er` 的表述
2. 将 markdown 文档视为分析结果主产物的叙述
3. 未区分条件型与默认型能力的旧规则

---

## 五、输入依赖

Batch 3 执行前应参考以下文档：

1. `2026-03-16-first-runtime-first-global-design.md`
2. `2026-03-16-first-skill-md-files-重构改造清单.md`
3. `2026-03-16-first-skill-md-files-细化/skill-docs/*.md`
4. `2026-03-16-first-skill-md-files-细化/docs-first/*.md`

---

## 六、输出结果

Batch 3 应产出：

1. 新版 `agents-code-analysis.md`
2. 新版 `agents-api-deps.md`
3. 新版 `agent-guidelines-setup.md`
4. 新版 `agent-domain-model.md`
5. 新版 `agent-database.md`
6. 新版 `database-config.md`

以及一份验收记录，至少说明：

- 每个专题能力的 runtime truth 是什么
- 每个专题文档的投影来源是什么
- 哪些文档默认生成，哪些条件生成

---

## 七、验收问题

Batch 3 完成后，必须回答：

1. 是否还有任何专题能力以 markdown 文档作为真源？
2. `api-docs.md`、`domain-model.md` 是否已经有明确 runtime truth？
3. `database-er.md` 是否已经从“遗留文档”转为“条件型能力”？
4. `architecture.md`、`call-graph.md`、`external-deps.md`、`local-setup.md`、`development-guidelines.md` 是否都已有清晰投影来源？

只要其中任一问题答案是否定，Batch 3 就不算完成。

---

## 八、结论

Batch 3 的本质不是“改 6 个专题 references”，而是：

> **把 first 中最有价值、也最容易失控的专题能力，全部从旧 Agent 文档体系迁移到 runtime-first 专题能力体系。**

只有 Batch 3 完成，后续 `docs/first` 的专题文档重构才不会失去 runtime 来源。
