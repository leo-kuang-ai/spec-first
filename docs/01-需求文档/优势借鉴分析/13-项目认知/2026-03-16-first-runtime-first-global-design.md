---
title: First Skill Runtime-First 全局优化方案
date: 2026-03-16
author: Codex
status: proposal
version: 1.0
---

# First Skill Runtime-First 全局优化方案

> 目标：在不考虑向下兼容的前提下，将 `first` 从“历史双轨文档系统”重构为“单一 canonical runtime-first 系统”。

---

## 一、执行摘要

当前 `first` 的核心问题，不是单个文档缺失，也不是单个实现 bug，而是**产品契约分裂**：

1. TypeScript Runtime 已经演进到 canonical truth + docs projection 模型。
2. `SKILL.md` 与 references 仍保留旧的 Agent 产物承诺。
3. `docs/first/` 中同时存在 canonical docs、legacy docs、未兑现承诺对应的文档名。
4. CLI / health / resume / 变更映射 / 审查口径没有完全收口到同一份 contract。

这导致系统对“什么是正式产物、什么是投影视图、什么必须健康、什么会被后续 skill 消费”没有唯一答案。

本方案给出的唯一终局是：

> `first` 只生成 canonical runtime assets，`docs/first/` 全部由 runtime 投影；系统中不再存在 legacy docs、旁路生成、孤儿 runtime 文件、未兑现产物承诺。

---

## 二、终局定义

### 2.1 产品定位

`first` 的正式定位为：

- **Project Cognition Compiler**
- 输入：项目源码、配置、依赖、目录结构、运行态元数据
- 输出：canonical runtime assets
- 投影：从 runtime 自动生成人类可读 docs
- 消费者：`spec/design/task/code/review/verify/onboarding/orchestrate`

### 2.2 单真源原则

系统唯一真源为：

`/.spec-first/runtime/first/`

`docs/first/` 的定位统一为：

- 人类可读投影视图层
- 不作为后续 skill 真源
- 不直接驱动 health 判定
- 不允许脱离 runtime 单独生成

### 2.3 终局硬约束

终局必须满足以下 8 条约束：

1. 所有 `docs/first/*.md` 都必须有 runtime 来源。
2. 所有正式 runtime 文件都必须被 registry 和 `index.json` 追踪。
3. 不允许存在孤儿 runtime 文件。
4. 不允许存在未实现但仍在规格中承诺的正式产物。
5. 后续 skill 只消费 runtime slices，不把 markdown 当真源。
6. `wrap_up/done` 的写回只更新 runtime，再统一刷新 docs projection。
7. `first` 采用单一标准模式，不再区分 quick/deep；正式资产集合始终一致。
8. CLI、SKILL、references、tests、health、resume、mapping 必须共享同一份 contract。

---

## 三、现状诊断

### 3.1 当前结构性问题

当前问题可以归纳为 5 类：

1. **Contract 分裂**
   - runtime canonical assets 已扩展到 9 个以上
   - `SKILL.md` 仍在承诺旧 Agent 产物
   - resume / help / references 仍残留旧三资产口径

2. **Docs 双轨**
   - 一部分 docs 属于 canonical projection
   - 一部分 docs 仍是 legacy 直出文档
   - 一部分文档名被承诺但从未进入正式生成链

3. **变更检测失真**
   - artifact mapping 仍引用不存在或非正式文档
   - 增量刷新目标和真实 canonical contract 不一致

4. **Runtime 管理不闭合**
   - 存在 `modules.json` 这类不在 registry 内的文件
   - Runtime 目录中存在“非 contract 文件”

5. **消费模型不彻底**
   - 一部分 skill 已消费 canonical runtime
   - 但整体产品叙述仍停留在“文档产物中心”

### 3.2 本质判断

本问题的本质不是“某个文档该不该保留”，而是：

> `first` 尚未完成从“文档生成系统”向“认知编译系统”的契约级重构。

因此最佳方案不是修补旧清单，而是**直接重定义 first 的正式 contract**。

---

## 四、目标态架构

### 4.1 Canonical Runtime Assets

建议将 `first` 的正式 runtime assets 固定为 12 个基础资产 + 1 个条件型资产：

1. `summary.json`
2. `role-views.json`
3. `stage-views.json`
4. `steering.json`
5. `conventions.json`
6. `critical-flows.json`
7. `change-map.json`
8. `entry-guide.json`
9. `reboot-guide.json`
10. `api-contracts.json`
11. `structure-overview.json`
12. `domain-model.json`
13. `database-schema.json`（条件型）

说明：

- `tech-stack` 不单独建 runtime asset，而作为 `steering.json` 的结构化投影维度。
- `codebase-overview` 不再允许旁路直出，统一转为 `structure-overview.json` 投影。
- `domain-model` 不再挂靠在 `summary.json` 的轻量字段中，而升级为独立 asset。
- `api-docs` 升格为独立 `api-contracts.json`，支撑后续 `code/review/verify` 程序化消费。
- `database-schema.json` 仅在项目存在稳定数据库 schema，且数据库是理解业务的重要部分时生成。

### 4.2 Docs Projection

建议正式投影视图固定为 16 个基础文档 + 1 个条件型文档：

1. `README.md`
2. `summary.md`
3. `role-views.md`
4. `stage-views.md`
5. `steering.md`
6. `conventions.md`
7. `critical-flows.md`
8. `change-map.md`
9. `entry-guide.md`
10. `reboot-guide.md`
11. `common-playbooks.md`
12. `known-risks-and-traps.md`
13. `tech-stack.md`
14. `api-docs.md`
15. `codebase-overview.md`
16. `domain-model.md`
17. `database-er.md`（条件型）

投影关系如下：

- `tech-stack.md` ← `steering.json`
- `api-docs.md` ← `api-contracts.json`
- `codebase-overview.md` ← `structure-overview.json`
- `domain-model.md` ← `domain-model.json`
- `database-er.md` ← `database-schema.json`（条件生成）
- `common-playbooks.md` ← `conventions/change-map/entry-guide`
- `known-risks-and-traps.md` ← `critical-flows/change-map/reboot-guide`

### 4.2.1 正式文档全集 Registry

为避免后续实现再次出现“多个列表分别维护”的漂移问题，正式文档全集应在产品层定义为唯一 registry。

#### A. 基础 canonical docs

1. `README.md`
2. `summary.md`
3. `role-views.md`
4. `stage-views.md`
5. `steering.md`
6. `conventions.md`
7. `critical-flows.md`
8. `change-map.md`
9. `entry-guide.md`
10. `reboot-guide.md`
11. `common-playbooks.md`
12. `known-risks-and-traps.md`
13. `tech-stack.md`
14. `api-docs.md`
15. `codebase-overview.md`
16. `domain-model.md`

#### B. 正式专题文档

17. `architecture.md`
18. `call-graph.md`
19. `external-deps.md`
20. `local-setup.md`
21. `development-guidelines.md`

#### C. 条件型正式文档

22. `database-er.md`

约束：

1. 上述 22 个文档构成 `first` 的正式文档全集。
2. 任何正式文档的新增、删除、重命名，都必须先更新该 registry。
3. 代码中的 projection registry、health registry、治理刷新范围都必须从该产品定义收口，而不能各自扩展。

### 4.3 产物总表

下表统一列出终态正式文件、对应投影关系、生成方式与职责描述。

生成方式采用以下统一口径：

- **脚本确定性生成**：基于源码、配置、目录、类型、约定规则稳定抽取，要求可重复、可追溯、可测试。
- **LLM 自动识别 + Schema 固化**：由 LLM 做项目类型、交互边界、模式归类等高层识别，再写入受控 schema。
- **脚本抽取 + LLM 受约束归纳**：先由脚本提供结构化证据，再由 LLM 对高语义内容做有限归纳，输出仍需落入受控 schema。
- **运行时多源派生投影**：从一个或多个 runtime assets 按固定模板渲染，不直接依赖自由生成。

| 文件 | 对应投影 | 生成方式 | 真源质量 | 阅读质量 | 文件描述 |
|------|----------|----------|----------|----------|----------|
| `summary.json` | `summary.md`, `README.md` | LLM 自动识别 + Schema 固化 + 脚本校验 | 高 | 中 | 项目摘要、能力、入口、风险、证据索引的基础真源 |
| `role-views.json` | `role-views.md`, `README.md` | 脚本确定性生成 | 高 | 中 | 面向不同角色的阅读入口、关注点与优先资料 |
| `stage-views.json` | `stage-views.md`, `README.md` | 脚本确定性生成 | 高 | 中 | 面向不同阶段的上下文切片与推荐读取路径 |
| `steering.json` | `steering.md`, `tech-stack.md`, `README.md` | LLM 自动识别 + Schema 固化 | 中高 | 高 | 项目产品导向、技术栈、技术约束、结构边界与权威规则 |
| `conventions.json` | `conventions.md`, `common-playbooks.md`, `README.md` | 脚本抽取 + LLM 受约束归纳 | 中高 | 高 | 从配置、脚本、测试与代码模式中抽取证据，再归纳项目规范与实践 |
| `critical-flows.json` | `critical-flows.md`, `known-risks-and-traps.md`, `README.md` | 脚本抽取 + LLM 受约束归纳 | 中 | 高 | 基于入口、调用路径、阶段流转与关键文件关系归纳核心业务链路 |
| `change-map.json` | `change-map.md`, `common-playbooks.md`, `known-risks-and-traps.md`, `README.md` | 脚本确定性生成 | 高 | 中 | 变更入口、影响范围、常见修改路径与回归关注点的结构化索引 |
| `entry-guide.json` | `entry-guide.md`, `common-playbooks.md`, `README.md` | LLM 自动识别 + Schema 固化 | 中高 | 高 | 新会话进入项目时的最小阅读顺序与起步建议 |
| `reboot-guide.json` | `reboot-guide.md`, `known-risks-and-traps.md`, `README.md` | LLM 自动识别 + Schema 固化 | 中高 | 高 | 会话恢复、上下文重建与重启工作时的引导信息 |
| `api-contracts.json` | `api-docs.md` | 脚本确定性生成为主，必要时 LLM 只做说明补全 | 高 | 中高 | API 契约、路由、handler、参数与返回结构的结构化真源 |
| `structure-overview.json` | `codebase-overview.md` | 脚本确定性生成 | 高 | 中 | 代码结构、模块划分、关键目录、入口关系与阅读导航 |
| `domain-model.json` | `domain-model.md` | 脚本抽取 + LLM 受约束归纳 | 中 | 高 | 基于类型、模型、实体定义与调用证据归纳业务实体、关系与概念边界 |
| `database-schema.json`（条件型） | `database-er.md` | 脚本确定性生成为主，LLM 只做业务视角补充 | 高 | 高 | 数据表、字段、关系、主外键与核心业务数据结构的结构化真源 |
| `README.md` | Runtime 多源投影 | 运行时多源派生投影 | 继承真源 | 高 | `docs/first/` 总入口，汇总所有正式认知资产 |
| `summary.md` | `summary.json` 投影 | 运行时多源派生投影 | 继承真源 | 中高 | 面向人的项目摘要视图 |
| `role-views.md` | `role-views.json` 投影 | 运行时多源派生投影 | 继承真源 | 中高 | 面向人的角色视角导航文档 |
| `stage-views.md` | `stage-views.json` 投影 | 运行时多源派生投影 | 继承真源 | 中高 | 面向人的阶段视角导航文档 |
| `steering.md` | `steering.json` 投影 | 运行时多源派生投影 | 继承真源 | 高 | 项目导向、技术约束与结构原则的人类可读说明 |
| `tech-stack.md` | `steering.json` 投影 | 运行时多源派生投影 | 继承真源 | 高 | 技术栈与关键技术约束的专门视图 |
| `conventions.md` | `conventions.json` 投影 | 运行时多源派生投影 | 继承真源 | 高 | 项目规范的集中阅读视图 |
| `critical-flows.md` | `critical-flows.json` 投影 | 运行时多源派生投影 | 继承真源 | 高 | 关键业务链路与关键流程的人类可读说明 |
| `change-map.md` | `change-map.json` 投影 | 运行时多源派生投影 | 继承真源 | 中高 | 常见变更点与影响分析的人类可读导航 |
| `entry-guide.md` | `entry-guide.json` 投影 | 运行时多源派生投影 | 继承真源 | 高 | 项目进入路径与首次阅读建议 |
| `reboot-guide.md` | `reboot-guide.json` 投影 | 运行时多源派生投影 | 继承真源 | 高 | 会话恢复与重新上手指导 |
| `api-docs.md` | `api-contracts.json` 投影 | 运行时多源派生投影 | 继承真源 | 高 | API 契约的人类可读文档 |
| `codebase-overview.md` | `structure-overview.json` 投影 | 运行时多源派生投影 | 继承真源 | 高 | 代码结构概览、关键目录和阅读入口文档 |
| `domain-model.md` | `domain-model.json` 投影 | 运行时多源派生投影 | 继承真源 | 高 | 业务领域模型的人类可读说明 |
| `database-er.md`（条件型） | `database-schema.json` 投影 | 运行时多源派生投影 | 继承真源 | 高 | 数据结构 ER 视图，帮助理解核心业务对象及其关系 |
| `common-playbooks.md` | `conventions.json` + `change-map.json` + `entry-guide.json` 投影 | 运行时多源派生投影 | 继承真源 | 高 | 常见任务模板、操作套路与推荐执行路径 |
| `known-risks-and-traps.md` | `critical-flows.json` + `change-map.json` + `reboot-guide.json` 投影 | 运行时多源派生投影 | 继承真源 | 高 | 已知风险、常见陷阱与规避建议汇总 |

### 4.4 单一标准模式

`first` 不再区分 quick / deep，而采用单一标准模式。

该模式的原则如下：

1. **正式 runtime assets 全量生成**
   - 所有 canonical assets 都应按统一 contract 生成
   - 不再允许因模式不同而缺失正式资产

2. **条件型资产按项目特征生成**
   - 例如 `database-schema.json` 与 `database-er.md`
   - 只有在检测到明确数据库 schema 且其对业务理解有价值时才生成

3. **专题型文档按统一策略生成**
   - 例如 `architecture.md`、`call-graph.md`、`external-deps.md`、`local-setup.md`
   - 它们不再由模式控制，而由 runtime 资产和生成策略决定

4. **性能优化依赖增量更新，不依赖少生成资产**
   - 真正需要优化的是扫描、抽取、投影成本
   - 不是通过削弱项目级认知来换取速度

这样可以彻底消除“quick 一套产物、deep 一套产物”的契约歧义，并让 `first` 真正成为稳定的项目认知输入层。

---

## 五、关键设计决策

### 5.1 直接废弃 legacy 语义

不考虑向下兼容，意味着以下旧概念直接废弃：

1. “legacy docs”
2. “Agent 直接生成但不进入 runtime”
3. “SKILL 承诺但实现暂未跟上，先保留文档名”
4. “runtime 目录可以有未注册文件”

### 5.2 `modules.json` 的处理

`modules.json` 不升格为正式资产，建议直接删除。

原因：

1. 它本质只是结构概览的一部分，不具备独立产品语义。
2. 如果升格，会让 asset contract 粒度失衡。
3. 它当前没有明确消费方，也不应单独进入 health 与治理链。

替代策略：

- 将其内容合并进 `structure-overview.json`
- 由 `codebase-overview.md` 从 `structure-overview.json` 投影

### 5.3 正式专题文档的定位

以下旧文档名具有较高认知价值，应保留为**正式专题文档**：

- `architecture.md`
- `call-graph.md`
- `external-deps.md`
- `local-setup.md`
- `development-guidelines.md`

它们的定位不是基础 canonical docs，也不是旁路分析文，而是：

1. **正式专题投影视图**
   - 属于 runtime-first 正式体系
   - 由一个或多个 runtime assets 派生生成

2. **高价值阅读层**
   - 主要服务新手接手老项目、设计评审、代码修改前的结构理解
   - 强调“更好读”，但不成为真源

3. **不额外制造真源分叉**
   - 若现有 runtime assets 足以支撑，就优先做专题投影
   - 只有在后续出现明确程序化消费需求时，才考虑升格为独立 runtime asset

补充说明：

- `database-er.md` 不属于一般专题文档，而属于**条件型正式文档**。
- 若项目存在明确数据库 schema，且数据库是理解业务的重要部分，则应通过 `database-schema.json` 进入 canonical contract，并以条件型投影视图形式保留 `database-er.md`。

原则：

> 保留专题文档的认知价值，但不保留它们作为旁路真相的历史角色。

### 5.4 旧专题文档融入新流程的模式

原有以下专题文档具有较高认知价值，不应简单删除：

- `architecture.md`
- `call-graph.md`
- `external-deps.md`
- `local-setup.md`
- `development-guidelines.md`
- `database-er.md`

但它们必须从“LLM 直接总结文档”升级为“runtime-first 体系下的投影视图”。

建议融入模式如下：

| 文档 | 是否保留 | 新模式定位 | Runtime 来源 | 生成方式 | 主要服务对象 |
|------|----------|------------|--------------|----------|--------------|
| `architecture.md` | 保留 | 专题型 derived projection | `structure-overview.json` + `steering.json` + `critical-flows.json` | 运行时多源派生投影 | `onboarding`, `design`, `code`, `review` |
| `call-graph.md` | 保留 | 专题型 derived projection | `critical-flows.json` + `change-map.json` + `structure-overview.json` | 运行时多源派生投影 | `design`, `code`, `review`, `verify` |
| `external-deps.md` | 保留 | 专题型 derived projection | `summary.json` + `steering.json` + `conventions.json` | 运行时多源派生投影 | `onboarding`, `design`, `code` |
| `local-setup.md` | 保留 | 专题型 onboarding projection | `entry-guide.json` + `conventions.json` + `steering.json` | 运行时多源派生投影 | `onboarding`, `code` |
| `development-guidelines.md` | 保留 | 专题型规范投影视图 | `conventions.json` | 运行时投影生成 | `code`, `review`, `verify` |
| `database-er.md` | 保留 | 条件型 canonical projection | `database-schema.json` | 运行时投影生成 | `onboarding`, `design`, `code`, `review`, `verify` |

设计原则：

1. **保留文档名，但改变数据来源**
   - 文档名可以延续，降低认知迁移成本
   - 事实来源必须迁移到 runtime assets

2. **优先做投影视图，谨慎增加独立 asset**
   - `architecture/call-graph/external-deps/local-setup` 先作为专题型 projection
   - 若后续出现明确程序化消费需求，再考虑升格为独立 runtime asset

3. **数据库认知作为条件型正式能力**
   - `database-er.md` 对数据驱动项目价值较高
   - 因此应进入条件型 canonical contract，而不是简单降级为专题文档

4. **专题文档不允许成为旁路真相**
   - 不允许再次由 LLM 直接自由生成 Markdown
   - 必须以 runtime assets 为输入统一投影

### 5.5 专题型文档生成策略

在单一标准模式下，专题型文档不再由 quick/deep 控制，而采用显式生成策略。

建议策略如下：

| 文档 | 生成策略 | 触发条件 | 说明 |
|------|----------|----------|------|
| `development-guidelines.md` | 默认生成 | 始终生成 | 属于项目规范核心视图，对 `code/review/verify` 和新手开发均有直接价值 |
| `architecture.md` | 默认生成 | Runtime 基础资产完整时生成 | 属于高价值结构视图，可帮助新手快速建立系统边界感知 |
| `call-graph.md` | 条件生成 | 检测到可稳定抽取入口链路、调用关系、关键流时生成 | 对部分项目价值很高，但不同语言/框架下抽取质量差异较大 |
| `external-deps.md` | 默认生成 | 始终生成 | 外部依赖和第三方服务是老项目迭代中的常见风险源 |
| `local-setup.md` | 默认生成 | 始终生成 | 新手开发快速进入项目的关键文档 |
| `database-er.md` | 条件生成 | 检测到稳定数据库 schema 且数据库是业务核心组成时生成 | 数据驱动项目的高价值认知文档，不适用于所有项目 |

补充规则：

1. **默认生成**
   - 表示属于高频、高价值、跨项目普遍适用的专题视图
   - 不依赖用户显式请求

2. **条件生成**
   - 只有在输入证据充分、生成质量可接受时才进入正式输出
   - 条件不满足时，应在 runtime 中记录 “not_applicable” 或同类状态，而不是输出低质量文档

3. **按显式请求生成**
   - 当前方案不把这类文档纳入首批正式 contract
   - 仅保留未来扩展空间，例如某些调试型、一次性分析型专题文档

4. **生成策略优先级高于历史文档习惯**
   - 不因为过去存在某个文档名，就强制所有项目都生成
   - 是否生成只取决于其认知价值与生成质量是否可达标

### 5.6 专题文档章节与 Runtime 来源映射

为了让专题文档真正进入 runtime-first 体系，必须明确“每个专题文档的章节从哪里来”。

建议映射如下：

| 文档 | 章节 | Runtime 来源字段 | 说明 |
|------|------|------------------|------|
| `architecture.md` | 系统概览 | `summary.project.*`, `steering.product.*` | 说明系统目标、核心能力、主要边界 |
| `architecture.md` | 技术架构与边界 | `steering.tech.*`, `steering.structure.*` | 说明技术栈、技术边界、模块边界 |
| `architecture.md` | 关键路径与核心协作关系 | `critical-flows.flows[*]`, `structure-overview.entryPoints` | 展示系统中最重要的交互关系 |
| `architecture.md` | 风险与架构注意点 | `summary.risks[*]`, `known-risks-and-traps` 的来源字段 | 汇总高层风险与结构性注意点 |
| `call-graph.md` | 入口清单 | `structure-overview.entryPoints`, `change-map.entries` | 展示主要调用入口 |
| `call-graph.md` | 关键调用链 | `critical-flows.flows[*]`, `change-map.impactPaths[*]` | 展示需求改动最常触及的调用路径 |
| `call-graph.md` | 高风险扩散点 | `change-map.hotspots[*]`, `critical-flows.risks[*]` | 标出改动容易扩散的位置 |
| `external-deps.md` | 第三方依赖概览 | `summary.dependencies[*]`, `steering.tech.stack[*]` | 列出核心依赖与技术组件 |
| `external-deps.md` | 外部服务与集成点 | `steering.tech.integrations[*]`, `api-contracts.externalBoundaries[*]` | 说明外部系统依赖与服务交互 |
| `external-deps.md` | 依赖风险与注意事项 | `conventions.dependencyRules[*]`, `summary.risks[*]` | 提醒升级、兼容、服务耦合风险 |
| `local-setup.md` | 环境要求 | `steering.tech.stack[*]`, `conventions.setup.requirements[*]` | 说明本地运行所需环境 |
| `local-setup.md` | 安装与启动步骤 | `entry-guide.bootstrapSteps[*]`, `conventions.setup.commands[*]` | 给出新手的最小启动路径 |
| `local-setup.md` | 常见问题与排查 | `reboot-guide.commonIssues[*]`, `known-risks-and-traps` 的来源字段 | 汇总本地开发易踩坑 |
| `development-guidelines.md` | 代码规范 | `conventions.codeRules[*]` | 说明编码、目录、命名等规则 |
| `development-guidelines.md` | 测试与验证规范 | `conventions.testingRules[*]`, `change-map.validationHints[*]` | 说明改动后的验证标准 |
| `development-guidelines.md` | 配置与提交流程 | `conventions.configRules[*]`, `conventions.deliveryRules[*]` | 说明配置、提交、发布协作方式 |
| `database-er.md` | 核心数据对象 | `database-schema.entities[*]`, `domain-model.entities[*]` | 展示核心表或模型及业务意义 |
| `database-er.md` | 表关系 / ER 图 | `database-schema.relationships[*]` | 展示主外键和核心关联关系 |
| `database-er.md` | 关键字段说明 | `database-schema.entities[*].fields[*]` | 展示约束、状态字段、业务关键字段 |
| `database-er.md` | 数据风险与改动提示 | `database-schema.risks[*]`, `change-map.dataImpact[*]` | 提醒数据迁移、约束变更和影响面 |

实现要求：

1. 章节必须只从 runtime 字段读取，不允许章节层再次自由推导新事实。
2. 若某章节所需字段缺失，应降级为空章节或显示“暂无足够证据”，而不是生成臆断内容。
3. 每个专题文档都应支持“字段缺失但文档仍可投影”的局部降级能力。

### 5.6.1 正式专题文档最低内容 Contract

为了避免专题文档“有名字、有来源、但内容过空”，每个正式专题文档都必须满足最低内容要求。

| 文档 | 最低必需章节 | 最低必需字段 | 最低可用标准 |
|------|--------------|--------------|--------------|
| `architecture.md` | 系统概览、技术边界、关键协作关系 | `summary.project.*`、`steering.tech.*`、`steering.structure.*`、至少 1 条 `critical-flows` | 至少能回答“系统由哪些核心部分组成、边界在哪里” |
| `call-graph.md` | 入口清单、关键调用链 | 至少 1 个入口、至少 1 条关键链路 | 至少能回答“从哪里进入、调用链怎么走” |
| `external-deps.md` | 第三方依赖、外部服务、风险提示 | 至少 1 组依赖或外部服务信息 | 至少能回答“系统依赖了什么外部能力” |
| `local-setup.md` | 环境要求、安装步骤、启动步骤 | 至少 1 组环境要求、至少 1 条启动命令 | 至少能让新手完成本地启动 |
| `development-guidelines.md` | 代码规范、测试规范、提交流程 | 至少 1 条代码规则、1 条测试规则、1 条协作/交付规则 | 至少能回答“按什么规则开发和提交” |
| `database-er.md` | 核心数据对象、关系、关键字段 | 至少 1 个数据对象、1 条关系或关键字段集合 | 至少能回答“核心数据对象及其关系是什么” |

补充约束：

1. 若未满足最低可用标准，则该文档不得标记为 `healthy`。
2. 对默认生成的正式专题文档，未达最低可用标准时应标记为 `degraded`，并进入治理告警。
3. 对条件生成的专题文档，未达最低可用标准时可选择不生成，但必须记录原因。

### 5.7 后续 skill 消费统一 runtime slices

下游 skill 的消费方向建议如下：

- `spec/design`：`summary / steering / conventions / critical-flows`
- `task/plan/orchestrate`：`change-map / entry-guide / structure-overview`
- `code/review/verify`：`conventions / api-contracts / domain-model / critical-flows / change-map / database-schema（条件）`
- `onboarding`：`role-views / reboot-guide / entry-guide / structure-overview`

由此保证新增 asset 都有明确消费方，不出现“为了文档而文档”的情况。

对应中文说明如下：

| 文档 / 资产 | 中文描述 | 主要消费方向 |
|------|------|------|
| `summary` | 项目总览，说明项目是什么、主要能力、入口、风险与基础证据 | `spec`, `design`, `onboarding` |
| `role-views` | 按角色组织的阅读导航，告诉不同角色先看什么、重点关注什么 | `onboarding` |
| `stage-views` | 按阶段组织的上下文切片，告诉不同阶段需要哪些项目背景 | `spec`, `design`, `task`, `code`, `verify` |
| `steering` | 项目导向与技术约束，说明技术栈、边界、权威规则与总体原则 | `spec`, `design`, `onboarding` |
| `conventions` | 项目一贯做法，沉淀编码、配置、测试、协作与交付规范 | `spec`, `design`, `code`, `review`, `verify` |
| `critical-flows` | 项目关键业务链路与高风险流程，帮助识别不可轻易破坏的核心路径 | `design`, `code`, `review`, `verify` |
| `change-map` | 变更导航图，说明改某类需求通常从哪里进入、会影响哪些区域 | `task`, `plan`, `orchestrate`, `code`, `verify` |
| `entry-guide` | 项目进入指南，提供新会话或新开发者的最小阅读路径和起步顺序 | `task`, `plan`, `orchestrate`, `onboarding` |
| `reboot-guide` | 会话恢复指南，帮助中断后快速重建上下文与继续推进工作 | `onboarding`, `orchestrate` |
| `api-contracts` | 接口契约真源，描述系统对外交互边界、参数、handler 与返回结构 | `code`, `review`, `verify` |
| `structure-overview` | 代码结构总览，描述模块划分、关键目录、入口关系与阅读导航 | `task`, `plan`, `orchestrate`, `onboarding`, `code` |
| `domain-model` | 领域模型真源，描述业务实体、概念边界、关系与核心语义对象 | `design`, `code`, `review`, `verify` |
| `database-schema` | 数据结构真源，描述表、字段、关系与核心数据约束，用于帮助理解数据驱动业务 | `design`, `code`, `review`, `verify`, `onboarding` |

---

## 六、实施策略

在不考虑兼容的前提下，推荐使用**两步硬切**，而不是渐进兼容迁移。

### Phase A：重定义 Contract

目标：让系统中所有正式说明和代码同时切换到新 contract。

范围：

1. 更新 `SKILL.md`
2. 更新所有 `references/*.md`
3. 重写 `FIRST_RUNTIME_ARTIFACTS`
4. 重写 `FIRST_RUNTIME_TO_DOCS_PROJECTION_MAP`
5. 更新 runtime types / store / bootstrap / projection / context-resolver
6. 更新 CLI help / resume / check-health 文案
7. 更新测试 fixtures 与断言

产出：

- 新 runtime registry
- 新 docs projection registry
- 新 skill consumption contract
- 新 health contract

### Phase B：删除旧世界

目标：移除所有旧路径、旧承诺、旧映射，避免系统继续分裂。

范围：

1. 删除 `modules.json` 相关逻辑
2. 删除旧 legacy docs 直出链路
3. 删除所有对不再属于正式 contract 的旧文档 mapping、help、references、tests
4. 删除“runtime 仅 3 资产”的旧文案与旧 schema
5. 删除所有不再属于正式 contract 的产物定义

产出：

- 无 legacy 概念
- 无孤儿 runtime 文件
- 无 ghost outputs
- 无双轨 docs

---

## 七、模块级改造清单

### 7.1 Runtime Contract

需要改造：

- `src/core/skill-runtime/first-runtime-types.ts`
- `src/core/skill-runtime/first-runtime-store.ts`
- `src/core/skill-runtime/first-bootstrap.ts`

目标：

- 新增 `api-contracts.json`
- 新增 `structure-overview.json`
- 新增 `domain-model.json`
- 删除或吸收 `modules.json`

### 7.2 Projection Contract

需要改造：

- `src/core/skill-runtime/first-artifact-mapping.ts`
- `src/core/skill-runtime/first-doc-projection.ts`

目标：

- docs projection 全量 runtime 化
- 清除所有对不存在文档的引用
- 清除所有 legacy 特判

### 7.3 Skill Consumption

需要改造：

- `src/core/skill-runtime/context-resolver.ts`
- 各下游 skill 的 context 解析路径

目标：

- 按 task category 注入新 assets
- 统一 required / optional / fallback 契约

### 7.4 CLI / Health / Resume

需要改造：

- `src/cli/commands/first.ts`
- `src/core/skill-runtime/first-resume.ts`
- `src/core/skill-runtime/first-change-detector.ts`

目标：

- 所有对外文案与真实 contract 一致
- health 检查只围绕正式 assets 与正式 projection docs

### 7.5 Skill 文档与 Reference

需要改造：

- `skills/spec-first/00-first/SKILL.md`
- `skills/spec-first/00-first/references/*.md`

目标：

- 文档层面不再出现旧 Agent 文档清单
- 说明重点从“派发哪些 markdown”改为“生成哪些 runtime assets 与投影”

---

## 八、质量门禁

本方案必须配套自动化门禁，否则 contract 很快会再次漂移。

### Gate 1：No Orphan Runtime Files

规则：

- `.spec-first/runtime/first/` 中除 `index.json`、`project-cognition-updates.jsonl` 外
- 所有文件都必须在 runtime registry 内

目的：

- 防止再次出现 `modules.json` 这类非正式资产

### Gate 2：No Unprojected First Docs

规则：

- `docs/first/*.md` 中每个正式文档必须能在 projection registry 中找到来源

目的：

- 防止再次出现 legacy docs

### Gate 3：No Ghost Spec Outputs

规则：

- `SKILL.md` 与 references 中声明的正式产物
- 必须全部存在于 runtime registry 或 docs projection registry

目的：

- 防止“规格承诺”和“实际系统”再次分叉

### Gate 4：Consumption Gate

规则：

- 每个正式 runtime asset 必须至少有一个明确消费方

目的：

- 防止“无消费者资产”进入 contract

### Gate 5：Full Roundtrip Gate

规则：

- `bootstrap -> index -> refresh-docs-from-runtime -> check-health -> context-resolver`
- 必须对全量 assets 一致通过

目的：

- 确保 contract 在生成、索引、投影、检测、消费五个环节一致

---

## 九、生成规则与强制约束

为避免“表格上写得合理，落地时重新失控”，所有生成方式必须遵循统一实现规范。

### 9.1 `LLM 自动识别 + Schema 固化`

适用资产：

- `summary.json`
- `steering.json`
- `entry-guide.json`
- `reboot-guide.json`

适用场景：

- 项目类型识别
- 端类型识别
- 子类型归类（app/admin/h5/backend/cli/library 等）
- 边界识别（页面路由、命令入口、接口边界、系统交互边界）
- 阅读顺序、重启路径等高层组织信息

输入要求：

1. 必须先由脚本准备基础证据包。
2. 证据包至少包括：
   - 项目根目录结构
   - 主要配置文件
   - 入口文件列表
   - 依赖声明
   - 已识别语言/框架信号
3. LLM 不允许直接扫描全仓库后自由输出未受控字段。

输出要求：

1. 输出必须落入固定 schema。
2. 仅允许写入预定义枚举值、结构化字段和限定长度文本。
3. 必须保留 evidence refs 或 evidence summary。

强制约束：

1. LLM 只能做“识别、归类、排序、摘要”，不能发明不存在的项目能力。
2. 若无法确定分类，必须写入 `unknown` 或 `[待确认]`，不得裸推断。
3. 输出落盘前必须经过脚本校验：
   - 枚举值合法
   - 必填字段齐全
   - 引用路径存在
   - 长度限制符合要求

失败处理：

1. LLM 识别失败时，降级为最小保守结构，不阻断 runtime 生成。
2. 降级结果必须显式标记 `confidence: low` 或同类状态字段。

测试要求：

1. 同一输入证据包，多次生成后结构必须稳定。
2. 至少覆盖：
   - backend 项目
   - frontend/admin/h5 项目
   - mobile/app 项目
   - mixed/monorepo 项目

### 9.2 `脚本确定性生成`

适用资产：

- `role-views.json`
- `stage-views.json`
- `change-map.json`
- `api-contracts.json`
- `structure-overview.json`

适用场景：

- 文件枚举
- 目录结构抽取
- 命令入口、路由入口、模块入口识别
- 变更映射与影响范围索引
- 接口契约、handler、参数、返回结构抽取

输入要求：

1. 只能基于源码、配置、目录、类型定义、依赖声明、脚本约定。
2. 不依赖 LLM 判断才能完成核心字段生成。

输出要求：

1. 输出必须完全可重复。
2. 字段级内容必须可追溯到源码或配置。
3. 必须尽可能保留：
   - `sourceFile`
   - `line`
   - `evidenceType`

强制约束：

1. 不得把推断结果混入确定性字段。
2. 若证据不足，则留空或标记未知，不得自动脑补。
3. 所有确定性资产必须支持增量更新与差异计算。

失败处理：

1. 局部抽取失败时，只跳过当前节点，不得整份资产崩溃。
2. 必须记录 warning，用于 health / observability。

测试要求：

1. 核心字段使用确定性单测。
2. 变更一个文件时，受影响资产范围必须可预测。
3. 不同语言/端类型项目的同类结构必须得到一致 schema 输出。

### 9.3 `脚本抽取 + LLM 受约束归纳`

适用资产：

- `conventions.json`
- `critical-flows.json`
- `domain-model.json`

适用场景：

- 代码与配置中存在证据，但需要进一步抽象语义
- 需要识别领域对象、业务链路、项目实践模式
- 需要生成“高语义但仍可结构化”的资产

输入要求：

1. 必须先由脚本抽取候选证据集。
2. 证据集必须是可追溯的，至少包含：
   - 文件路径
   - 关键代码片段或摘要
   - 基础类型信息或引用关系
3. LLM 不能在没有证据集的情况下直接“读代码后总结”。

输出要求：

1. 输出必须落入固定 schema。
2. 每一条高语义结论都应关联证据来源。
3. 允许存在 `confidence`、`evidenceCount`、`inferenceType` 等辅助字段。

强制约束：

1. 只能归纳，不得虚构。
2. 语义对象必须能回指到证据集，而不是只给自然语言说明。
3. 涉及实体关系、关键链路、项目规范时，若证据冲突必须显式标记冲突状态。

失败处理：

1. 归纳失败时，保留脚本抽取层输出，不阻断整体 runtime。
2. 可降级为较浅层结构，不强求一次生成高完整度语义模型。

测试要求：

1. 用 golden fixtures 验证高语义资产的结构稳定性。
2. 至少做：
   - 漏项控制测试
   - 幻觉控制测试
   - evidence traceability 测试

### 9.4 `运行时多源派生投影`

适用资产：

- 全部 `docs/first/*.md`

适用场景：

- 将 runtime JSON 转换为面向人的阅读文档
- 汇总多资产信息形成 README / playbooks / risks 文档

输入要求：

1. 只能读取正式 runtime assets。
2. 不允许在投影阶段重新扫描源码或自由调用 LLM 生成新的事实。

输出要求：

1. 文档结构固定，章节可扩展但必须可重建。
2. 删除文档后，应可仅凭 runtime 重新投影恢复。

强制约束：

1. 投影层不能引入新的事实。
2. 投影层允许做：
   - 排版
   - 汇总
   - 章节重组
   - 人类可读表达优化
3. 投影层不允许做：
   - 新增无来源结论
   - 覆盖 runtime 字段含义
   - 将 markdown 修改反向写回为真源

失败处理：

1. 单文档投影失败不应破坏 runtime。
2. 可按文档粒度恢复，不要求整批重投影。

测试要求：

1. 对每个正式 docs 文件建立 projection parity tests。
2. 验证删除 docs 后可从 runtime 完整恢复。

### 9.5 统一规则

无论采用哪种生成方式，都必须满足以下全局约束：

1. 所有正式资产必须可索引、可 health check、可 refresh。
2. 所有正式资产都必须有明确消费者或明确投影去向。
3. LLM 参与的任何环节，都不得绕过 schema 校验直接写入正式真源。
4. docs 层永远不是真源，任何人工修改都应在下次投影时被覆盖。
5. 若某资产暂时无法满足上述约束，则不应进入 canonical contract。

---

## 十、验收标准

本方案完成后，必须满足以下终验收条件：

1. `first` 的正式 runtime assets 固定为新 contract 定义的 12 个。
2. `docs/first/` 中不存在任何无 runtime 来源的正式文档。
3. `modules.json` 被彻底删除或吸收，不再存在孤儿 runtime 文件。
4. `SKILL.md`、references、CLI、health、resume、tests 与新 contract 完全一致。
5. `first` 采用单一标准模式，不再声明 quick/deep 两套集合。
6. `spec/design/task/code/review/verify/onboarding/orchestrate` 至少覆盖新资产的最小消费链。
7. 全量测试通过，且新增 contract gate 测试全部通过。

### 10.1 产品级验收标准：新手接手老项目迭代

除系统正确性外，还必须满足面向真实使用场景的产品级验收标准。

以“新手开发在老需求上迭代”为目标，至少应满足以下能力：

| 能力 | 验收问题 | 对应文档 |
|------|----------|----------|
| 快速理解项目 | 新手是否能在 15-30 分钟内理解项目目标、主要模块和基本边界？ | `README.md`, `summary.md`, `steering.md`, `codebase-overview.md` |
| 快速进入开发 | 新手是否知道先读什么、先从哪里改？ | `entry-guide.md`, `role-views.md`, `local-setup.md`, `development-guidelines.md` |
| 定位老需求入口 | 新手是否能定位旧需求相关的代码入口和主要影响点？ | `change-map.md`, `codebase-overview.md`, `call-graph.md` |
| 理解业务语义 | 新手是否能理解关键业务对象、概念边界和核心链路？ | `domain-model.md`, `critical-flows.md`, `database-er.md`（如适用） |
| 控制改动风险 | 新手是否能识别哪些地方不能轻易改、哪些点最容易引发回归？ | `known-risks-and-traps.md`, `critical-flows.md`, `external-deps.md` |
| 形成最小验证闭环 | 新手是否能知道改完至少该验证什么？ | `common-playbooks.md`, `change-map.md`, `development-guidelines.md` |

最终验收应至少通过以下 3 个场景：

1. 新手首次接手项目
   - 能完成环境启动
   - 能说出项目主要模块和边界

2. 新手修改一个老需求
   - 能定位入口
   - 能识别主要影响面
   - 能给出最小验证清单

3. 新会话恢复
   - 能在短时间内恢复当前项目认知和工作上下文

---

## 十一、实施优先级

建议按以下顺序执行：

1. **P0：Contract 重定义**
   - 定义 12 个 runtime assets 与 16 个 docs projection
   - 删除旧产物承诺

2. **P1：Runtime / Projection 改造**
   - 实现 `api-contracts / structure-overview / domain-model`
   - 移除 `modules.json`

3. **P2：CLI / Health / Resume / Mapping 收口**
   - 统一帮助文案、健康检查、变更映射

4. **P3：Skill Consumption 收口**
   - 让下游 skill 全部以 runtime slices 为输入

5. **P4：Quality Gates 与测试闭环**
   - 加入 orphan / ghost / projection / roundtrip gates

---

## 十二、最终结论

在不考虑向下兼容的前提下，`first` 的最佳解决方案不是“继续规范化部分非标准产物”，而是：

> **直接重构为单一 canonical runtime-first 系统，并一次性删除所有 legacy 语义。**

这意味着：

1. `first` 不再生成“若干相互独立的 markdown 文档”。
2. `first` 只生成 canonical runtime assets。
3. 所有 `docs/first/` 都只是 runtime 的投影。
4. 所有后续 skill 都只消费 runtime。

只有这样，`first` 才能真正成为后续 `spec/design/task/code/verify` 的稳定项目认知输入层，而不是继续维持“实现一套、文档一套、审查再解释一套”的不稳定结构。
