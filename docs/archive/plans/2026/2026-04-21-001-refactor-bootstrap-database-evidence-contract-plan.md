---
title: 深化 bootstrap 数据库 evidence-first contract 为项目类型感知的多栈识别
type: refactor
status: superseded
date: 2026-04-21
deepened: 2026-04-21
---

# 深化 bootstrap 数据库 evidence-first contract 为项目类型感知的多栈识别

## Overview

`spec-graph-bootstrap` 当前已经开始把数据库发现从“固定配置文件白名单”推进到 `evidence-first`，但它仍然缺少一层关键能力：先识别项目类型，再按项目类型提取数据库证据。用户当前真实诉求不是“再支持几个配置文件”，而是让系统面对 Spring Boot、Python、Node.js、Rails、Go 等不同工程范式时，都能自动从代码、配置、migration、ORM schema 与少量高信噪比文档里提取数据库知识。

本轮计划因此从“证据分层”进一步深化为“项目类型感知的多栈数据库识别”。目标不是把 runtime 变成重 orchestrator，也不是把 `database-routing.json` 扩成数据库万能真源，而是让 compiler 先识别 `project_identity.primary_language / primary_frameworks`，再选择对应的 extractor profile，把连接候选、schema 来源、live route 与 static generation readiness 继续分层收口。

## Planning Anchor

- **Restated Understanding：** 需要把数据库识别从“识别某些固定配置文件”升级为“先识别项目类型，再按项目类型自动提取数据库连接与 schema 证据”，覆盖 Spring Boot、Python、Node.js 等不同工程范式，并继续保持 `轻 contract + 明确边界 + 让 LLM 决策`。
- **Current Core Goal：** 为 `spec-graph-bootstrap` 设计一套项目类型感知的多栈数据库识别方案，使 bootstrap 能为不同技术栈稳定产出更真实的数据库 decision input，并避免 narrative docs 误报。
- **Scope / Non-goals：** 只规划 `spec-graph-bootstrap` 的数据库发现、schema 来源、route / worker 触发与上下文生成边界；不新增 workflow 入口，不引入 runtime 模型执行器，不把所有数据库在本轮都做成完整 live worker。
- **Verification-as-Done：** 完成后应能证明：系统会根据项目类型选择对应数据库证据提取策略；普通说明性文档不会再伪造数据库连接；无 live route 但有 schema evidence 的仓库也能生成正确的静态数据库上下文路径。

## Problem Frame

当前问题已经不只是“`config_source` 过窄”，而是“数据库发现缺少项目范式感知”。

现状可以概括为四层：

1. `project_identity` 已经能大致识别仓库语言与框架，但数据库发现没有真正消费这些信息。
2. `fact-inventory.database[]` 负责输出静态候选连接。
3. `fact-inventory.database_schema[]` 开始承载 schema 来源。
4. `database-routing.json` 继续基于连接候选和 runtime 条件选 live route。

这条链已经比“把所有数据库语义塞回 routing artifact”更清晰，但仍存在四类核心偏差：

- **项目类型偏差：** Spring Boot 的 `application.yml` / `application.properties`、Django 的 `settings.py`、SQLAlchemy/Alembic 的 `database.py` / `alembic/versions`、Rails 的 `config/database.yml` / `db/migrate`、Go 的 `gorm.Open` / `sql.Open`，目前都没有被当作一等 extractor profile 来处理。
- **误报偏差：** narrative docs、仓库内 planning / solutions / prompt mirror 文档，可能仅因出现 `mysql`、`table`、`mermaid` 等词汇就被错误提升为数据库证据，污染 machine truth。
- **生成偏差：** 当前数据库上下文生成仍过度依赖 `selected_connections[]`。对于 schema-only 仓库或 route 暂不可达的 workspace child repo，系统会错误地把“没有 live route”当成“没有数据库知识”。
- **兼容偏差：** `config_source` 仍被部分 consumer 当作兼容视图消费。如果它不能稳定指向最可信的代码/配置证据，而是退化为首次命中的弱证据，就会误导下游。

用户已经明确指出正确方向：数据库配置不应该依赖人为指定“从哪个配置文件读”，而应该让系统自动识别项目类型并从项目代码中获取。这意味着实现标准必须从“文件白名单扩展”切换到“项目类型驱动的 extractor profile + 严格误报约束”。

## Requirements Trace

- R1. 数据库发现必须先识别项目类型，再按项目类型选择数据库 extractor profile，而不是单纯依赖固定文件名或路径白名单。
- R1a. 项目类型识别输入应优先来自 repo/profile 证据，例如语言、依赖声明、构建文件、框架标记、常见 import / annotation / initializer 模式；具体数据库配置文件只应在 profile 已命中后作为 extractor 目标，而不是反过来充当项目分类器。
- R2. 首批 extractor profile 至少应覆盖：Node.js / TypeScript、Spring Boot、Python（Django / SQLAlchemy / Alembic）、Rails、Go 的常见数据库配置与 schema 证据模式。
- R3. `fact-inventory` 必须继续把连接候选与 schema 来源拆成不同语义层；`database-routing.json` 只回答 live route / fallback / provenance。
- R4. narrative docs、内部治理文档、prompt mirror、plans / solutions 等说明性文档不得直接产出数据库连接候选；文档只能在高信噪比命名与结构化信号下贡献 schema evidence。
- R5. database worker / database context generation 必须区分 `live introspection` 与 `static schema synthesis`，不能再把“能否连数据库”和“是否有数据库知识”绑成一个条件。
- R6. `config_source` 作为兼容字段必须稳定指向当前最强连接证据，不能退化成首次命中的弱证据或 narrative docs 路径。
- R7. source skill、prompt mirror、phase1 references、schema/sample、compiler/tests 必须同步更新，不能只改 compiler 而让治理面继续停在旧语义。
- R8. 任何新增 contract 都不得写入 secret 值、完整连接串、用户名明文或 runtime probe 历史。

## Scope Boundaries

- 不新增 `spec-*` 或 `spec-*` workflow 入口。
- 不把 `database-routing.json` 扩成同时承载 schema 来源、静态解析结果、worker readiness 与 live route 的重对象。
- 不在本轮为 PostgreSQL / MongoDB / Redis / Elasticsearch 等全部类型引入完整 live worker；本轮重点是 detection / schema synthesis / routing boundary。
- 不要求 `src/bootstrap-compiler/` 引入 runtime LLM 调用器；继续保持 deterministic compiler posture。
- 不把 `docs/contexts/` 生成产物重新拉回 source-of-truth。

### Deferred to Separate Tasks

- 为各数据库类型分别补完整 live introspection worker：后续独立规划。
- 基于真实数据库 catalog 做 lineage / freshness / semantic relation 深层分析：后续独立规划。
- 跨仓 workspace 场景下基于 host-specific tooling 自动拿 secret 与实时连接：后续独立规划。

## Context & Research

### Relevant Code and Patterns

- `src/bootstrap-compiler/derive-bootstrap-facts.js`
- `src/bootstrap-compiler/compile-routing.js`
- `src/bootstrap-compiler/compile-machine-artifacts.js`
- `src/bootstrap-compiler/run-bootstrap.js`
- `src/bootstrap-compiler/sample-generator.js`
- `skills/spec-graph-bootstrap/SKILL.md`
- `skills/spec-graph-bootstrap/references/artifact-schemas.md`
- `skills/spec-graph-bootstrap/references/phase1-degraded-extraction.md`
- `skills/spec-graph-bootstrap/references/phase1-crg-extraction.md`
- `skills/spec-graph-bootstrap/references/database-worker.md`
- `docs/10-prompt/skills/spec-graph-bootstrap/SKILL.md`
- `docs/contracts/spec-graph-bootstrap/fact-inventory.schema.json`
- `docs/contracts/spec-graph-bootstrap/database-routing.schema.json`
- `tests/unit/spec-graph-bootstrap-contracts.test.js`
- `tests/unit/spec-graph-bootstrap-compiler.test.js`
- `tests/e2e/spec-graph-bootstrap-mainline.sh`
- `tests/fixtures/bootstrap/spec-first-bootstrap-sample.js`

### Institutional Learnings

- `docs/solutions/workflow-issues/modify-source-not-artifacts-2026-04-13.md`
  - 规划与实现必须从 `skills/` / `docs/contracts/` / compiler 真源出发，不能反向修改 runtime 生成物。

### Internal References

- `docs/01-需求分析/spec-graph-bootstrap需求/阶段2-集成方案.md`
  - 仓库内已经存在按语言分类的数据库 / cache / MQ / auth 库清单，可直接作为项目类型感知 extractor 的启发式输入。
- `skills/spec-graph-bootstrap/references/phase1-degraded-extraction.md`
  - 当前降级路径已经列出 `package.json / requirements.txt / go.mod / pom.xml` 的数据库依赖检测思路，但还停留在粗粒度 DB 依赖识别，没有真正进入框架 profile。

### External References

- 本次未做外部 research。原因是需求主要围绕仓库内 contract、compiler 边界、既有 phase1 参考资料与现有代码路径优化，当前价值最高的是内生模式收口而不是通用框架文档扩展。

## Key Technical Decisions

- **决策 1：把“项目类型识别”作为数据库发现的前置输入，而不是旁路启发式。**
  - 原因：用户的真实需求是“不同类型项目自动识别数据库配置”。现有 `project_identity.primary_language / primary_frameworks` 已经存在，不应继续让数据库发现忽略它们。

- **决策 2：采用“extractor profile registry”而不是继续堆文件白名单。**
  - 原因：Spring Boot、Django、SQLAlchemy、Rails、Go GORM 的证据来源不同，继续堆白名单只会让误报和遗漏一起扩大。更稳妥的方式是：先识别 profile，再执行 profile 对应的 connection/schema extractor。
  - 约束：profile selector 的判断应以 repo/profile 级证据为主，例如 `pom.xml` / `build.gradle*` + Spring 依赖、`pyproject.toml` / `requirements*.txt` + Django 或 SQLAlchemy 依赖、`package.json` + Prisma / TypeORM / Sequelize 依赖、`Gemfile`、`go.mod` 等；`application.yml`、`settings.py`、`config/database.yml` 等属于 profile 命中后的 extractor 读取面，不应倒置为项目分类真源。

- **决策 3：文档只能贡献严格受限的 schema evidence，不能再直接贡献连接候选。**
  - 原因：review 已经证明普通 narrative docs 会污染 `fact-inventory.database[]`。文档型证据要么进入 `database_schema[]`，要么直接忽略。

- **决策 4：`config_source` 保留，但明确为“最强连接证据投影”。**
  - 原因：兼容层仍然需要存在一段时间，但它必须稳定指向更强的连接证据（代码配置 > 配置文件 > env template > 其他弱证据），不能继续被 narrative docs 抢占。

- **决策 5：保持 `database-routing.json` 边界不变。**
  - 原因：routing artifact 继续只解释 live route。项目类型识别、schema 来源、worker static path readiness 都应留在 `fact-inventory` 侧或 worker 侧，不回流为重 routing object。

- **决策 6：首批支持“广 detection，窄 live generation”。**
  - 原因：用户要的是先能识别不同项目范式并生成数据库上下文，不是本轮把所有数据库 live worker 一次做完。首批 detection / static synthesis 可以广一点，live worker 继续窄一点。

## Open Questions

### Resolved During Planning

- **是否应该通过新增大量“指定从哪些配置文件读取”的规则来满足需求？**
  - 结论：不应。那只是扩展白名单，不是项目类型感知识别。

- **是否应该把项目类型识别做成单独 runtime artifact？**
  - 结论：当前不必。优先复用 `project_identity.primary_language / primary_frameworks` 作为 selection input，避免新建一层不必要 contract。

- **docs 是否还应该参与连接候选提取？**
  - 结论：不应。docs 只能在严格命名 + 结构化信号下贡献 `database_schema[]`，不能直接进入连接候选。

### Deferred to Implementation

- **Spring Boot 首批要覆盖到 `application.yml` / `application.properties` 之外的哪些 Java 配置写法？**
  - 原因：需要根据实现复杂度决定第一批是否纳入 `@Bean DataSource` / `@ConfigurationProperties`。

- **Python 首批是先做 Django / SQLAlchemy / Alembic，还是进一步纳入 Tortoise / Peewee？**
  - 原因：要结合 repo 里已有依赖启发式与测试夹具成本来定，规划阶段不强行拍板。

- **是否需要给每条 evidence 增加显式 `extractor_profile` 字段？**
  - 原因：可能有助于 explainability，但也可能让 contract 变重；需要在实现阶段权衡。

- **`config_source` 的彻底退役时机是什么？**
  - 原因：要先确认下游 consumer 是否全部切到 `evidence_sources[]` / `database_schema[]`。

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

```text
Repo files
  -> project_identity detection
     -> extractor profile selection
        -> stack-specific connection extractors
        -> stack-specific schema extractors
           -> normalized evidence bundle
              -> fact-inventory.database[]         # connection candidates only
              -> fact-inventory.database_schema[]  # schema sources only
                 -> compile-routing.js
                    -> database-routing.json       # live route only
                 -> database worker
                    -> live introspection path
                    -> static schema synthesis path
```

首批 extractor profile 目标：

| Profile | Connection evidence | Schema evidence |
|---|---|---|
| Node.js / TypeScript | `src/lib/db.ts`, `knexfile`, Prisma / TypeORM / Sequelize config, env wrapper | `prisma/schema.prisma`, `migrations/*.sql`, ORM schema |
| Spring Boot | `application.yml`, `application.properties`, `spring.datasource.*`, `DataSource` config | `db/migration`, Flyway, Liquibase, JPA / MyBatis 相关结构证据 |
| Python | Django `settings.py` / `DATABASES`, SQLAlchemy `create_engine`, Alembic env/config | Django migrations, Alembic versions, ORM model / schema |
| Rails | `config/database.yml`, `establish_connection` | `db/migrate`, `schema.rb`, ActiveRecord model |
| Go | `gorm.Open`, `sql.Open`, env / config loader | `migrations/`, sqlc/schema, GORM model |

设计约束：

- `fact-inventory.database[]` 只表达连接候选
- `fact-inventory.database_schema[]` 只表达 schema 来源
- `database-routing.json` 只消费连接候选与 runtime 条件
- docs 证据默认不参与连接候选，只在高信噪比命名和结构化语义下进入 schema 来源
- narrative docs / internal governance docs / prompt mirrors 一律不应污染 machine truth

## Implementation Units

- [ ] **Unit 1: 把 contract 与 phase1 文档升级为项目类型感知数据库识别语义**

**Goal:** 先把“先识别项目类型，再按项目类型提取数据库证据”的边界写进 source-of-truth 文档和 schema，避免实现仍被旧白名单思维牵着走。

**Requirements:** R1, R2, R3, R4, R6, R7, R8

**Dependencies:** None

**Files:**
- Modify: `skills/spec-graph-bootstrap/references/artifact-schemas.md`
- Modify: `skills/spec-graph-bootstrap/references/phase1-degraded-extraction.md`
- Modify: `skills/spec-graph-bootstrap/references/phase1-crg-extraction.md`
- Modify: `skills/spec-graph-bootstrap/SKILL.md`
- Modify: `docs/10-prompt/skills/spec-graph-bootstrap/SKILL.md`
- Modify: `docs/contracts/spec-graph-bootstrap/fact-inventory.schema.json`
- Modify: `docs/contracts/spec-graph-bootstrap/database-routing.schema.json`
- Modify: `CHANGELOG.md`
- Modify: `docs/08-版本更新/README.md`
- Test: `tests/unit/spec-graph-bootstrap-contracts.test.js`

**Approach:**
- 在 phase1 文档中把数据库发现改写为 `project_identity -> extractor profile -> connection/schema evidence normalization` 的顺序，而不是“读几个固定文件看看”。
- 在 contract 文档中明确三层边界：
  - `database[]` = connection candidates
  - `database_schema[]` = schema sources
  - `database-routing.json` = live route only
- 把 docs 误报边界写成 contract：docs 只能在严格命名与结构化信号下贡献 schema evidence，且 narrative / internal docs 不得贡献连接候选。
- 明确 `config_source` 是 compatibility view，表达当前最强连接证据投影，而不是“任意首个命中文件”。

**Execution note:** contract-first

**Starting point:** `skills/spec-graph-bootstrap/references/phase1-degraded-extraction.md`

**Patterns to follow:**
- `docs/contracts/spec-graph-bootstrap/fact-inventory.schema.json`
- `docs/01-需求分析/spec-graph-bootstrap需求/阶段2-集成方案.md`

**Test scenarios:**
- Happy path — source skill、prompt mirror、phase1 references、JSON schema 都明确写出项目类型感知的数据库识别语义。
- Edge case — contract 明确 docs 只进入 schema evidence，不再暗示 docs 可直接形成连接候选。
- Edge case — `config_source` 被表述为 strongest-evidence projection，而不是首个命中来源。
- Error path — 任一 source 文档仍把 database worker 触发条件写成“必须 selected route 才有数据库上下文”时，contract test 能识别 drift。
- Integration — `tests/unit/spec-graph-bootstrap-contracts.test.js` 同时覆盖 source skill、prompt mirror、phase1 文档与 schema 边界一致性。

**Verification:**
- 文档与 schema 已一致表达“项目类型识别驱动的多栈数据库发现”。
- `database-routing.json` 没有被重新扩大职责。
- 没有新增任何要求落盘 secret 的字段；若 contract 迫使 secret 明文进入 artifact，则本单元未完成。

- [ ] **Unit 2: 在 compiler 中引入数据库 extractor profile registry**

**Goal:** 让 `derive-bootstrap-facts.js` 真正先消费 `project_identity`，再按项目类型选择数据库 extractor，而不是继续靠单一全局启发式硬扫所有仓库。

**Requirements:** R1, R2, R4, R6, R8

**Dependencies:** Unit 1

**Files:**
- Modify: `src/bootstrap-compiler/derive-bootstrap-facts.js`
- Create: `src/bootstrap-compiler/database-extractor-profiles.js`
- Test: `tests/unit/spec-graph-bootstrap-compiler.test.js`

**Approach:**
- 把数据库发现逻辑拆成 profile registry，例如：
  - `node-ts-relational`
  - `spring-boot-jdbc`
  - `python-django`
  - `python-sqlalchemy`
  - `rails-activerecord`
  - `go-sql-gorm`
  - `generic-sql-migration`
- 每个 profile 输出：
  - connection evidence matchers
  - schema evidence matchers
  - doc allowlist / denylist policy
  - db_type 归一化规则
  - connection_name 聚合规则
- profile 选择优先使用 `project_identity.primary_language / primary_frameworks`，并结合 repo/profile 证据做二次确认，例如依赖声明、构建文件、框架标记、import / annotation / initializer 模式；未知场景再退回 generic extractor。
- 明确区分两层：
  - profile selector：回答“这是什么类型项目”
  - profile extractor：回答“该类型项目里数据库连接与 schema 证据通常在哪里”
- 防止倒置：`application.yml`、`settings.py`、`config/database.yml`、`knexfile` 等只能作为已命中 profile 下的 extractor 输入，不应作为跨栈通用项目分类器。
- 让 compiler 继续 deterministic：profile 只是规则表，不是运行时模型推断器。

**Execution note:** characterization-first

**Starting point:** `src/bootstrap-compiler/derive-bootstrap-facts.js`

**Patterns to follow:**
- `src/bootstrap-compiler/derive-bootstrap-facts.js` 现有的 `collect*` 聚合模式
- `docs/01-需求分析/spec-graph-bootstrap需求/阶段2-集成方案.md` 里的多语言数据库库名清单

**Test scenarios:**
- Happy path — Spring Boot fixture 仅有 `application.yml` / `application.properties` 时，也能提取 `spring.datasource.*` 连接证据。
- Happy path — Django fixture 从 `settings.py` / `DATABASES` 中提取连接证据与迁移来源。
- Happy path — SQLAlchemy / Alembic fixture 从 `create_engine` 与 `alembic/versions` 中提取 connection + schema evidence。
- Happy path — Node.js / TypeScript fixture 从 `src/lib/db.ts` / Prisma / TypeORM / Sequelize 配置中提取连接与 schema。
- Edge case — Go / Rails fixture 能命中各自主路径，而不是落回完全 generic 的弱证据。
- Error path — 未命中 profile 的仓库只允许 generic extractor 给出低置信度结果，不应虚构高置信度连接候选。

**Verification:**
- `derive-bootstrap-facts.js` 已不再用单一全局启发式负责所有栈。
- 项目分类不会退化成“先扫到哪个数据库配置文件就认定是什么项目”。
- 首批 profile 至少覆盖 Node.js / Spring Boot / Python 三类用户明确关心的项目范式。
- 未知栈能够优雅降级，而不是直接误报或静默空白。

- [ ] **Unit 3: 收紧 docs 误报边界并稳定 `config_source` 兼容语义**

**Goal:** 把数据库 narrative docs 误报从 machine truth 中清掉，并让 `config_source` 稳定指向当前最强连接证据。

**Requirements:** R4, R6, R8

**Dependencies:** Unit 2

**Files:**
- Modify: `src/bootstrap-compiler/derive-bootstrap-facts.js`
- Modify: `tests/unit/spec-graph-bootstrap-compiler.test.js`
- Modify: `tests/fixtures/bootstrap/spec-first-bootstrap-sample.js`
- Test: `tests/unit/spec-graph-bootstrap-compiler.test.js`

**Approach:**
- 明确两套规则：
  - connection candidate allowlist：代码配置、配置文件、env template 等
  - schema evidence allowlist：migration、ORM schema、严格命名且结构化的 DB docs
- narrative / planning / solutions / prompt-mirror docs 默认拒绝，不得直接进入连接候选。
- `config_source` 通过“证据强度排序”选 strongest connection evidence，不允许保留 docs 或其他弱证据作为兼容投影。
- 保证 `evidence_sources[]` 继续保存真实多源证据，而 `config_source` 仅作为兼容视图。

**Execution note:** test-first

**Starting point:** `tests/unit/spec-graph-bootstrap-compiler.test.js`

**Patterns to follow:**
- 当前 review 修复里已经加入的 docs-only false positive guard
- `src/bootstrap-compiler/compile-routing.js` 当前对 `config_source` 的兼容消费方式

**Test scenarios:**
- Happy path — 文档与代码并存时，`config_source` 稳定落到代码配置而不是 docs。
- Happy path — 严格命名的 `docs/database-er.md` 可进入 `database_schema[]`，但不进入 `database[]`。
- Edge case — `docs/plans`、`docs/solutions`、`docs/10-prompt`、一般 narrative docs 不会产出连接候选。
- Edge case — 仅有弱文档证据时，`database[]` 为空，但系统不会因此丢失真正的 schema evidence allowlist 场景。
- Error path — narrative docs 中出现 `mysql` / `DATABASE_URL` / SQL 示例时，不再伪造高置信度数据库连接。

**Verification:**
- 当前仓库自身运行 `deriveBootstrapInputs()` 不会再被内部文档污染出伪造数据库连接。
- docs-only false positive 与 config-source precedence 都有负向回归测试。
- 若 `config_source` 仍可能指向 narrative docs，则本单元未完成。

- [ ] **Unit 4: 让 database context generation 按 live path / static path 分离，并开始面向多栈输出**

**Goal:** 把数据库上下文生成从“selected route 驱动”改成“live route 与 schema evidence 分别驱动”，并使不同项目类型在无 live route 时也有静态数据库上下文出路。

**Requirements:** R3, R5, R7, R8

**Dependencies:** Unit 1, Unit 2, Unit 3

**Files:**
- Modify: `skills/spec-graph-bootstrap/SKILL.md`
- Modify: `skills/spec-graph-bootstrap/references/database-worker.md`
- Modify: `docs/10-prompt/skills/spec-graph-bootstrap/SKILL.md`
- Modify: `src/bootstrap-compiler/compile-routing.js`
- Modify: `tests/unit/spec-graph-bootstrap-contracts.test.js`
- Modify: `tests/unit/spec-graph-bootstrap-compiler.test.js`
- Modify: `tests/e2e/spec-graph-bootstrap-mainline.sh`
- Test: `tests/unit/spec-graph-bootstrap-contracts.test.js`
- Test: `tests/unit/spec-graph-bootstrap-compiler.test.js`
- Test: `tests/e2e/spec-graph-bootstrap-mainline.sh`

**Approach:**
- 保持 `database-routing.json` 只解释 live route，不把 static readiness 混入 routing。
- 在 worker 侧明确两条路径：
  - `live introspection`：有 selected route 时执行
  - `static schema synthesis`：无 selected route 但有足够可信 schema evidence 时执行
- 对首批多栈场景，live path 可以继续窄支持；static path 则应更广支持 relational schema 产物生成。
- 输出必须显式标记 `schema-derived` / `live-introspection` provenance，不允许伪装。

**Execution note:** contract-first

**Starting point:** `skills/spec-graph-bootstrap/references/database-worker.md`

**Patterns to follow:**
- `skills/spec-graph-bootstrap/references/database-worker.md` 当前 live route 错误/降级语义
- `src/bootstrap-compiler/compile-routing.js` 当前 route / blocker 输出结构

**Test scenarios:**
- Happy path — Spring Boot / Python / Node fixture 在无 selected route 但有 schema evidence 时，仍能触发 static database context path。
- Happy path — 有 selected route 时，live path 继续按现有 contract 工作，不因多栈 detection 退化。
- Edge case — live 与 static 同时存在时，输出清晰标注 live primary / static supplemental provenance。
- Edge case — 仅有低可信 schema 片段时，不伪造数据库产物，并写清 skipped reason。
- Error path — route 失败但 schema evidence 仍在时，不再把整个数据库上下文一起跳过。
- Integration — workspace child repo 在 schema-only 场景下不会再出现 README 标记 generated 但实际无 `database/` 目录的语义错位。

**Verification:**
- `database-routing.json` 仍然只解释 live route。
- schema-only 仓库或 child repo 不会再因为无 selected route 而完全丢失数据库上下文。
- worker 文档、source skill、prompt mirror 对两条路径的叙述一致。

- [ ] **Unit 5: 对齐 sample、fixtures、contract tests 与 workspace / child repo 回归验证**

**Goal:** 用 sample、fixtures 与 tests 把项目类型感知数据库识别的治理链和 workspace 真实场景一起守住。

**Requirements:** R2, R4, R5, R6, R7

**Dependencies:** Unit 1, Unit 2, Unit 3, Unit 4

**Files:**
- Modify: `src/bootstrap-compiler/sample-generator.js`
- Modify: `tests/fixtures/bootstrap/spec-first-bootstrap-sample.js`
- Modify: `tests/unit/spec-graph-bootstrap-contracts.test.js`
- Modify: `tests/unit/spec-graph-bootstrap-compiler.test.js`
- Modify: `tests/unit/asset-consistency.test.js`
- Modify: `tests/integration/e2e.sh`
- Test: `tests/unit/spec-graph-bootstrap-contracts.test.js`
- Test: `tests/unit/spec-graph-bootstrap-compiler.test.js`
- Test: `tests/unit/asset-consistency.test.js`
- Test: `tests/integration/e2e.sh`

**Approach:**
- 为 sample / fixtures 引入多栈样本，而不是只用 Node/MySQL 单一路径代表所有数据库场景。
- 对 compiler tests 补四类核心样本：
  - Spring Boot
  - Python（Django 或 SQLAlchemy/Alembic）
  - Node / TypeScript
  - docs-only / internal-doc false positive
- 加入 workspace child repo 回归测试，证明 child repo 的 database context 不再只依赖 selected route。
- 保持 deterministic sample 约束，避免多栈 profile 引入 nondeterministic 排序。

**Execution note:** test-first

**Starting point:** `tests/unit/spec-graph-bootstrap-compiler.test.js`

**Patterns to follow:**
- `tests/unit/spec-graph-bootstrap-contracts.test.js` 现有 source/mirror/schema/sample 一致性守卫
- `tests/e2e/spec-graph-bootstrap-mainline.sh` 当前 bootstrap 主链校验方式

**Test scenarios:**
- Happy path — sample generator 与 checked-in sample 体现多栈 evidence 结构，且 schema 校验通过。
- Happy path — contract tests 能识别新 extractor profile 语义、docs 误报边界与 `config_source` strongest-evidence 语义。
- Edge case — evidence list、profile match、`config_source` 排序保持 deterministic。
- Error path — 只更新 compiler、不更新 phase1 docs / skill / sample / tests 时，治理守卫能报出 drift。
- Integration — workspace child repo 在 schema-only 场景下生成正确 database context，不再出现 README 与实际产物不一致。

**Verification:**
- source skill、prompt mirror、phase1 docs、schema/sample、compiler/tests 五条链路都能共同表达新语义。
- 多栈样本和误报负样本都已进入自动化守卫。
- 若 plan 只停留在 Node/MySQL happy path，缺少 Spring Boot / Python / docs-negative coverage，则本单元未完成。

## System-Wide Impact

- **Interaction graph:** `project_identity` 的识别结果将直接影响数据库 extractor 选择，进而影响 `fact-inventory.json`、`compile-routing.js`、database worker、Stage-0 context 与 downstream plan/work/review 消费质量。
- **Error propagation:** 如果 profile 选择过宽，会把 narrative docs 或弱证据误传入 machine truth；如果 profile 选择过窄，会让 Spring Boot / Python 等真实项目继续漏检。
- **State lifecycle risks:** `config_source` 兼容期与 `evidence_sources[]` 并存，必须避免两者表达矛盾。
- **API surface parity:** `skills/spec-graph-bootstrap/*`、`docs/10-prompt/skills/spec-graph-bootstrap/*`、`docs/contracts/spec-graph-bootstrap/*`、sample generator、fixtures、tests 必须同步。
- **Integration coverage:** 仅靠 unit tests 不足以证明 workspace child repo 的 database 产物行为；需要 compiler + integration/e2e 联合守卫。
- **Unchanged invariants:** `database-routing.json` 继续是 live route / fallback / provenance 真源；secret 不落盘；`docs/contexts/` 继续是生成产物而非 source-of-truth。

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| profile registry 变成新的硬编码白名单 | 用“语言/框架 -> extractor profile”表达工程范式，而不是列举个别文件路径；unknown stack 始终有 generic fallback |
| 多栈 detection 使 docs 误报面再次放大 | 把 docs 误报边界写进 contract + negative tests，明确 docs 永不直接产出连接候选 |
| `config_source` 兼容字段继续误导下游 | 强制 strongest-evidence 选择规则，并补 precedence 回归测试 |
| schema-only path 继续被 selected route 绑死 | 在 worker contract 与 integration tests 里把 static path 作为独立完成面来验证 |
| 一次扩太多数据库 live 能力导致计划失焦 | 本轮聚焦 detection / static synthesis / routing boundary，live worker 扩展按数据库类型后续拆分 |

## Documentation / Operational Notes

- 只要涉及 source code / contract 变更，实施时必须同步更新 `CHANGELOG.md`。
- 这是显著的 workflow contract 深化，实施时也应同步更新 `docs/08-版本更新/README.md`。
- 如果本轮调整使相关数据库 learnings 发生 by-omission drift，实施尾声需要补一次窄范围 refresh。

## Verification

- 系统会根据 `project_identity` 选择对应数据库 extractor profile，而不是继续用单一固定文件白名单处理所有项目。
- Spring Boot、Python、Node.js 至少三类项目范式具备明确的 connection/schema evidence 提取路径。
- docs 误报边界清晰：普通 narrative / governance / prompt mirror 文档不会再伪造数据库连接候选。
- `config_source` 继续存在，但已被定义为 strongest-evidence compatibility view。
- `database-routing.json` 在 contract 与实现上仍然只回答 live route / fallback / provenance。
- schema-only 仓库与 workspace child repo 不会再因为无 selected route 而被误判为“没有数据库上下文”。
- source skill、prompt mirror、phase1 docs、schema/sample、unit/integration tests 全部对齐；如果其中任一条链路仍停留在旧的固定配置文件思维，本计划仍不算完成。

## Sources & References

- User request: 数据库配置应由系统基于项目类型与项目证据自动识别，而不是预设从哪些配置文件读取。
- User observation: workspace child repo 当前存在“README 标记 database generated，但实际未落盘 database/ 产物”与“无 selected route 即整体 skipped”的问题。
- Related code: `src/bootstrap-compiler/derive-bootstrap-facts.js`
- Related code: `src/bootstrap-compiler/compile-routing.js`
- Related code: `skills/spec-graph-bootstrap/references/database-worker.md`
- Related reference: `skills/spec-graph-bootstrap/references/phase1-degraded-extraction.md`
- Related reference: `skills/spec-graph-bootstrap/references/phase1-crg-extraction.md`
- Related internal matrix: `docs/01-需求分析/spec-graph-bootstrap需求/阶段2-集成方案.md`
- Related learning: `docs/solutions/workflow-issues/modify-source-not-artifacts-2026-04-13.md`
