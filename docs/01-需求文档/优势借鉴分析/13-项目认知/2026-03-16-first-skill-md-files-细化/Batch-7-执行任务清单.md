---
title: First Skill MD 重构 Batch 7 执行任务清单
date: 2026-03-16
author: Codex
status: proposal
version: 1.0
parent: ./实施批次清单.md
---

# First Skill MD 重构 Batch 7 执行任务清单

> Batch 7 目标：将数据库认知能力从遗留 ER 文档升级为 runtime-first 下的条件型正式能力，使数据驱动项目获得稳定的数据结构理解入口。

---

## 一、范围

Batch 7 聚焦以下条件型能力：

1. `database-schema.json`（条件型 runtime asset）
2. `docs/first/database-er.md`（条件型专题投影视图）
3. `skills/spec-first/00-first/references/agent-database.md`
4. `skills/spec-first/00-first/references/database-config.md`

虽然这里只直接重构一个 docs 文件，但它依赖一整套条件型数据库能力规则，因此需要单独成批次。

---

## 二、目标

Batch 7 完成后，文档层面必须达成以下结果：

1. 数据库项目可以得到正式的数据结构认知能力。
2. 非数据库项目不会被强制生成低质量 ER 文档。
3. `database-er.md` 不再是历史遗留文档，而是条件型专题视图。
4. `database-schema.json` 成为 `database-er.md` 的唯一正式真源。

---

## 三、任务拆解

### T7.1 定义数据库适用性判定

目标：

- 明确什么项目应生成数据库认知能力

修改点：

1. 识别以下 schema 来源：
   - Prisma schema
   - TypeORM entity / config
   - Sequelize model / migration
   - Knex migration
   - 原生 SQL DDL / migration
2. 定义“不适用项目”：
   - 纯前端项目
   - 纯 CLI 工具
   - 无显式数据库 schema 的轻量工具项目
3. 明确“数据库虽存在，但不是项目理解关键部分”时可不生成

完成标准：

- 可以清晰判断 `database-er.md` 是否适用

### T7.2 定义 `database-schema.json` 的正式定位

目标：

- 建立数据库认知的正式真源

修改点：

1. 定义 schema 主要结构：
   - entities / tables
   - fields
   - relationships
   - constraints
   - risks
2. 区分：
   - 结构化真源字段
   - 可选业务解释字段
3. 明确：
   - `database-er.md` 只从该资产投影
   - 其他文档若引用数据库信息，也必须以该资产为源

完成标准：

- 数据库认知不再依赖临时分析文

### T7.3 重写 `agent-database.md`

目标：

- 让数据库分析规范与条件型能力一致

修改点：

1. 改写旧 D/E 直出文档逻辑
2. 明确抽取流程：
   - schema 识别
   - 表与字段抽取
   - 关系识别
   - 风险识别
3. 明确 LLM 仅用于业务意义补充，不参与确定性结构发明
4. 增加失败降级规则：
   - 关系不清晰时只输出表结构
   - schema 不完整时不生成 ER 文档

完成标准：

- 数据库专题能力具备明确输入、输出和失败处理规范

### T7.4 重写 `database-config.md`

目标：

- 建立数据库条件能力的支撑规范

修改点：

1. 说明支持的数据库配置来源
2. 说明 schema 来源优先级
3. 说明是否允许访问真实数据库
4. 说明安全边界与不适用场景

完成标准：

- `database-config.md` 能作为数据库专题能力的操作约束

### T7.5 重写 `database-er.md`

目标：

- 把 ER 文档从历史遗留文档升级为条件型专题投影视图

修改点：

1. 明确只从 `database-schema.json` 投影
2. 章节收口为：
   - 核心数据对象
   - 关系图 / ER 关系
   - 关键字段
   - 数据风险与改动提示
3. 删除所有旧 Agent 直出语义
4. 明确文档生成条件与“不适用”状态展示

完成标准：

- `database-er.md` 仅在条件满足时生成
- 对数据驱动项目具备显著项目认知价值

### T7.6 建立数据库认知与其他资产的边界

目标：

- 防止数据库信息与领域模型、变更导航重复冲突

修改点：

1. 明确 `domain-model` 负责业务语义对象
2. 明确 `database-schema` 负责物理/结构化数据模型
3. 明确 `change-map` 负责数据改动影响提示
4. 明确 `database-er.md` 是数据结构专题视图，而不是领域模型替代品

完成标准：

- 数据结构认知与业务语义认知边界清晰

---

## 四、删除项清单

Batch 7 中必须显式删除的旧内容包括：

1. 将 `database-er.md` 视为历史遗留文档的旧描述
2. 未区分适用/不适用项目的旧逻辑
3. 将数据库直连分析或自由总结当作默认路径的旧表述

---

## 五、输入依赖

Batch 7 执行前应参考以下文档：

1. `2026-03-16-first-runtime-first-global-design.md`
2. `2026-03-16-first-skill-md-files-重构改造清单.md`
3. `2026-03-16-first-skill-md-files-细化/docs-first/database-er.md`
4. `2026-03-16-first-skill-md-files-细化/skill-docs/agent-database.md`
5. `2026-03-16-first-skill-md-files-细化/skill-docs/database-config.md`
6. `2026-03-16-first-skill-md-files-细化/Batch-3-执行任务清单.md`

---

## 六、输出结果

Batch 7 应产出：

1. 条件型数据库能力的正式契约
2. `database-er.md` 的正式投影契约
3. 一份验收记录，至少说明：
   - 哪些项目生成数据库认知能力
   - 哪些项目不生成
   - 失败时如何降级

---

## 七、验收问题

Batch 7 完成后，必须回答：

1. `database-er.md` 是否已经有唯一正式真源？
2. 是否已明确哪些项目不生成数据库认知能力？
3. `database-schema` 与 `domain-model` 的边界是否已经清楚？
4. 是否仍存在把数据库认知当作默认必选文档的旧逻辑？

只要其中任一问题答案是否定，Batch 7 就不算完成。

---

## 八、结论

Batch 7 的本质不是“单独补一篇 ER 文档”，而是：

> **把数据库认知从遗留分析文升级为条件型正式能力，使数据驱动项目在新流程下仍然保有高价值的数据结构理解入口。**
