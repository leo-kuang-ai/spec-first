---
title: "CRG + spec-graph-bootstrap 终局优化技术方案"
type: archive
status: superseded
created: 2026-04-15
archived_at: 2026-06-14
archive_reason: "legacy plan-status backfill; retained as historical evidence only, not an active implementation plan"
---
# CRG + spec-graph-bootstrap 终局优化技术方案

> Lifecycle: historical plan archive. This document is retained as historical evidence only and is not an active implementation plan.

> 日期：2026-04-15
> 状态：Draft
> 范围：`src/crg/`、`skills/spec-graph-bootstrap/`、`docs/contexts/<slug>/`、`.spec-first/workflows/bootstrap/<slug>/`
> 目标：把 `CRG` 从“本地 AST 图工具”升级为“任务可消费的代码事实与检索底座”，把 `spec-graph-bootstrap` 从“文档生成工作流”升级为“Compiled Context Compiler”，并建立可验证、可维护、可迭代的整体闭环

## 1. 方案要解决的核心问题

当前 `spec-first` 已完成 `CRG` 与 `spec-graph-bootstrap` 的主要代码开发，但如果以终为始审视，真正的问题不是：

- “功能有没有做出来”
- “文档能不能生成”
- “某个 command 能不能跑通”

而是：

1. `src/crg/` 是否已经成为高质量的代码库理解底座
2. `skills/spec-graph-bootstrap` 是否已经成为高质量的上下文编译器
3. 两者组合后，是否真的能让 `plan / work / review / verify` 更稳、更快、更准
4. 这一套系统是否适合团队长期维护、增量更新、持续演进

本方案不再围绕“补某几个点”展开，而是直接定义：

- 正确终局应该是什么
- 当前实现与终局差距在哪里
- 下一阶段应该如何分层优化
- 每一层的 contract、产物、接口、评测如何设计

## 2. 结论先行

当前系统的方向是对的，但终局定位需要进一步收口：

- `CRG` 的正确定位不是“代码图工具”，而是 **代码事实编译器 + 任务检索底座**
- `spec-graph-bootstrap` 的正确定位不是“Stage-0 文档生成器”，而是 **Compiled Context Compiler**
- 二者组合后的正确终局不是“更多上下文文件”，而是 **最小上下文分发系统**

因此，后续优化不能继续以“增加产物数量”为主，而应改为五层闭环：

1. **Index Layer**：可信、可增量、可回滚的代码事实索引
2. **Retrieval Layer**：任务感知的最小上下文检索、扩图、重排、打包
3. **Compiled Context Layer**：稳定、可维护、可 lint 的上下文编译层
4. **Workflow Layer**：`plan / work / review / verify` 的确定性消费接口
5. **Eval Layer**：证明这套系统确实提升代码库理解、上下文效率与任务质量

当前最关键的不是补更多分析器，而是优先打通三条主链：

1. `CRG` 的 **generation 化 + retrieval 化**
2. `spec-graph-bootstrap` 的 **machine-first compiled context contract**
3. 整体系统的 **benchmark / regression / freshness / drift 闭环**

## 3. 现状诊断：以当前代码实现为准

以下判断严格基于当前仓库实现，而不是按设计意图推断。

## 3.1 `src/crg/` 已具备的能力

从 [src/crg/cli/build.js](/Users/kuang/xiaobu/spec-first/src/crg/cli/build.js)、[src/crg/incremental.js](/Users/kuang/xiaobu/spec-first/src/crg/incremental.js)、[src/crg/parser.js](/Users/kuang/xiaobu/spec-first/src/crg/parser.js)、[src/crg/migrations.js](/Users/kuang/xiaobu/spec-first/src/crg/migrations.js)、[src/crg/graph.js](/Users/kuang/xiaobu/spec-first/src/crg/graph.js) 可以确认，当前 `CRG` 已经不是原型，而是具备以下成熟特征：

- 输入收敛较严格，默认排除了 `.spec-first/**`、`node_modules/**`、二进制与敏感文件
- 使用文件 `SHA256` 做增量检测，具备 `changed / unchanged / deleted` 分类
- 解析层是 `AST-first`，支持多语言 tree-sitter，并具备 graceful degradation
- 持久化层基于 SQLite + WAL，有 schema version、migrations、外键和基础索引
- 边解析有显式 unresolved 审计，不会因为局部解析失败阻塞整体 build
- 后处理已有 communities / flows / review-context / impact 等能力雏形

这说明当前 `CRG` 已经是一个工程上合格的本地索引底座。

## 3.2 `src/crg/` 的核心缺口

从 [src/crg/search.js](/Users/kuang/xiaobu/spec-first/src/crg/search.js)、[src/crg/cli/context.js](/Users/kuang/xiaobu/spec-first/src/crg/cli/context.js)、[src/crg/flows.js](/Users/kuang/xiaobu/spec-first/src/crg/flows.js)、[src/crg/changes.js](/Users/kuang/xiaobu/spec-first/src/crg/changes.js)、[src/crg/commands/review-context.js](/Users/kuang/xiaobu/spec-first/src/crg/commands/review-context.js) 可以确认，当前主要缺口集中在四类：

### A. 代际发布缺失

当前是对单一 `graph.db` 做就地更新，而不是：

- build 到新 generation
- 校验通过后 promote
- 保留 last-known-good generation

这会直接影响：

- 失败隔离
- 退化可见性
- workflow 绑定稳定快照

### B. 检索层偏弱

当前搜索主要还是：

- FTS5 lexical search
- 图上轻量启发式扩展
- review 场景的专用脚本

但缺少：

- node/chunk 级 `retrieval_text`
- summary / signature / tags 等语义字段
- 统一 retrieval API
- hybrid retrieval / rerank / packing
- token-budget 约束

### C. flow / risk / community 仍是 v1 heuristic

当前 `flows.js` 与 `changes.js` 的评分逻辑是合理的一版工程启发式，但还不是足够稳定的“代码库理解信号系统”。主要问题是：

- 过于依赖局部结构特征
- 缺少跨任务统一校准
- 缺少评测驱动的参数回推

### D. 缺少价值证明

现在能看见的是：

- build 是否成功
- unresolved 数量
- graph stats

但看不见的是：

- 哪些任务因为 `CRG` 读得更少
- 哪些 review 因为 `CRG` 命中了更准的证据
- 哪些 plan 因为 `CRG` 更少漏掉依赖或测试面

## 3.3 `skills/spec-graph-bootstrap` 已具备的能力

从 [skills/spec-graph-bootstrap/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-graph-bootstrap/SKILL.md)、[.spec-first/workflows/bootstrap/spec-first/artifact-manifest.json](/Users/kuang/xiaobu/spec-first/.spec-first/workflows/bootstrap/spec-first/artifact-manifest.json)、[.spec-first/workflows/bootstrap/spec-first/fact-inventory.json](/Users/kuang/xiaobu/spec-first/.spec-first/workflows/bootstrap/spec-first/fact-inventory.json)、[docs/contexts/spec-first/injection-index.yaml](/Users/kuang/xiaobu/spec-first/docs/contexts/spec-first/injection-index.yaml) 可以确认，当前 Stage-0 已经有明显底座：

- Phase 0-4 的流程定义已经较完整
- 有 artifact manifest、fact inventory、risk signals、test surface 等 machine artifacts
- 有 `docs/contexts/<slug>/` 作为 durable context assets
- 有 `injection-index.yaml` 作为 workflow 注入入口
- `spec-plan / spec-work / spec-code-review` 已经接入预载约定

这意味着 Stage-0 已经不是概念设计，而是可运行的 supporting workflow。

## 3.4 `skills/spec-graph-bootstrap` 的核心缺口

当前最关键的问题不是“文档不够多”，而是四个系统级缺口：

### A. source skill 与样本产物存在 drift

当前 source contract 与 checked-in sample 之间仍有字段漂移，例如 `updated_at` 等字段口径未完全锁死。

### B. `injection-index.yaml` 还是“文件路由表”，不是“任务上下文求值器”

它描述了应该读什么，但没有真正的 deterministic evaluator 来执行：

- 规则求值
- 文件存在性检查
- 去重排序
- fallback reason
- token budget 策略

### C. machine-first 资产与 narrative 资产分层不够清楚

当前既有 JSON，也有文档，但“哪个是 source-of-truth、哪个是导航视图、哪个是任务卡片”尚未完全固定。

### D. 还不是 compiled wiki / compiled context system

离真正成熟的 compiled context layer，当前还缺：

- `index / overview / log / lint / freshness / contradictions`
- source traceability
- consumer compatibility
- stale claim 管理

## 3.5 `spec-graph-bootstrap` 整个 Skill 的当前执行逻辑

这一节不讨论“应该怎样”，只描述 **当前 `skills/spec-graph-bootstrap/SKILL.md` 定义下，这个 skill 是如何一步一步执行的**。

## 3.5.1 入口与总目标

调用入口：

```text
spec-graph-bootstrap [target-repo-path]
```

若不传 `target-repo-path`，则默认取当前工作目录。

这个 skill 的当前目标是：

1. 检测当前项目能否使用 `CRG` 和/或 Serena
2. 根据可用能力决定 `Full / Enhanced / Basic` 模式
3. 生成 Stage-0 机器产物
4. 生成 `docs/contexts/<slug>/` 下的人类可读上下文资产
5. 生成 `injection-index.yaml`，供 `plan / work / review` 消费

## 3.5.2 总执行链路

当前 skill 的真实执行顺序可以概括为：

```text
用户调用 spec-graph-bootstrap
  -> 计算 slug 与产物路径
  -> Phase 0 就绪探测与模式判定
  -> 首次写 artifact-manifest.json (in_progress)
  -> 若旧 docs/contexts/<slug>/ 存在则执行 backup
  -> Phase 1 抽取事实层（CRG / Serena / Built-in）
  -> 写 fact-inventory.json / risk-signals.json / test-surface.json
  -> 写入后校验 schema 必备字段
  -> Phase 2 为固定产物生成任务规划
  -> Phase 3 仅基于事实层生成文档层
  -> Phase 4 生成 injection-index.yaml
  -> 二次写 artifact-manifest.json (complete)
  -> 清理 backup 或失败回滚
```

## 3.5.3 ASCII 总流程图

```text
+---------------------------------------------------------------+
| spec-graph-bootstrap [target]                                |
| 产物: 无                                                      |
| 说明: 用户触发 Stage-0 bootstrap 工作流                       |
+---------------------------------------------------------------+
                              |
                              v
+---------------------------------------------------------------+
| Phase 0: Readiness Detection                                   |
| - slug                                                         |
| - host setup / MCP marker / Serena probe                       |
| - CRG CLI availability                                         |
| - graph.db exists? stats ok? stale?                            |
| - decide Full / Enhanced / Basic                               |
| 产物: slug, analyzer_mode, graph_support_state                 |
| 说明: 决定后续走 Full / Enhanced / Basic 哪条链路              |
+---------------------------------------------------------------+
                              |
                              v
+---------------------------------------------------------------+
| artifact-manifest.json (status=in_progress)                    |
| 产物: .spec-first/workflows/bootstrap/<slug>/artifact-manifest.json |
| 说明: 首次写控制面清单, 标记本轮生成开始                       |
+---------------------------------------------------------------+
                              |
                              v
+---------------------------------------------------------------+
| Optional Backup                                                |
| docs/contexts/<slug>/ -> .spec-first/workflows/bootstrap/...   |
| 产物: backup_<timestamp>/                                      |
| 说明: 保护已有上下文文档, 防止 Phase 3/4 失败时半覆盖          |
+---------------------------------------------------------------+
                              |
                              v
+---------------------------------------------------------------+
| Phase 1: Fact Extraction                                       |
| Stage A -> Stage B Round1 -> Stage B Round2 ->                 |
| Stage B Round3 -> Stage C                                      |
| 产物: 中间事实数据集合                                         |
| 说明: 从 CRG/Serena/Built-in 抽取项目身份、入口、模块、测试、风险 |
+---------------------------------------------------------------+
                              |
                              v
+---------------------------------------------------------------+
| Write Machine Fact Artifacts                                   |
| - fact-inventory.json                                          |
| - risk-signals.json                                            |
| - test-surface.json                                            |
| - JSON/schema validation                                       |
| 产物:                                                          |
|   - fact-inventory.json: 项目事实总表                          |
|   - risk-signals.json: 风险信号与图指标                        |
|   - test-surface.json: 测试面与覆盖缺口                        |
| 说明: 形成后续 compiler/evaluator 消费的 machine-first 输入     |
+---------------------------------------------------------------+
                              |
                              v
+---------------------------------------------------------------+
| Phase 2: Task Planning                                         |
| map facts -> fixed context assets                              |
| 产物: 固定文档任务映射关系                                     |
| 说明: 把事实字段映射到 summary/module-map/test-map 等固定产物  |
+---------------------------------------------------------------+
                              |
                              v
+---------------------------------------------------------------+
| Phase 3: Document Generation                                   |
| facts only -> docs/contexts/<slug>/...                         |
| 产物:                                                          |
|   - README.md: 上下文总入口                                    |
|   - 00-summary.md: 仓库摘要                                    |
|   - architecture/module-map.md: 模块结构图                     |
|   - pitfalls/index.md: 风险与陷阱                              |
|   - code-facts/public-entrypoints.md: 公共入口                 |
|   - code-facts/test-map.md: 测试映射                           |
|   - code-facts/high-risk-modules.md: 高风险模块                |
|   - context-packs/review-change.md: review 变更包              |
| 说明: 仅基于事实层编译 narrative/context 资产, 不回扫源码      |
+---------------------------------------------------------------+
                              |
                              v
+---------------------------------------------------------------+
| Phase 4: Routing Generation                                    |
| -> injection-index.yaml                                        |
| 产物: docs/contexts/<slug>/injection-index.yaml                |
| 说明: 声明 always/stages/selection_rules/advice 路由入口       |
+---------------------------------------------------------------+
                              |
                              v
+---------------------------------------------------------------+
| artifact-manifest.json (status=complete)                       |
| cleanup backup / rollback on failure                           |
| 产物: artifact-manifest.json 完整版                            |
| 说明: 记录最终 outputs/depends_on, 并在成功后清理 backup       |
+---------------------------------------------------------------+
```

## 3.5.4 Phase 0：就绪探测与模式判定

当前 skill 的 Phase 0 不是简单做环境检查，而是在做 **能力编排判定**。

它会顺序完成：

1. 计算 `slug`
2. 确定控制面路径与文档路径
3. 读取宿主 `host-setup.json`
4. 判断 `crg.cli_available`
5. 判断 `crg.native_modules`
6. 检查 `graph.db` 是否存在
7. 如果存在则执行 `spec-first crg stats --repo=<target>`
8. 判断图是否为空、是否 degraded
9. 需要时提示用户是否执行 `spec-first crg build --repo=<target>`
10. 若存在旧 manifest，则做 stale 对比
11. 最终判定 `Full / Enhanced / Basic`

当前模式判定逻辑：

```text
if crg.indexed == true
  => Full
else if serena.ready == true
  => Enhanced
else
  => Basic
```

配套语义是：

- `Full`: 本地 CRG 图可用，代码事实置信度最高
- `Enhanced`: CRG 不可用或未索引，但 Serena 可用
- `Basic`: 退回内置模式，依赖 glob / grep / read / metadata inference

## 3.5.5 Phase 0 ASCII 判定图

```text
                    +----------------------+
                    | Start Phase 0        |
                    +----------------------+
                               |
                               v
                    +----------------------+
                    | resolve slug         |
                    +----------------------+
                               |
                               v
                    +----------------------+
                    | read host-setup.json |
                    +----------------------+
                               |
                               v
              +------------------------------------------+
              | crg.cli_available == true ?              |
              +------------------------------------------+
                   | yes                          | no
                   v                              v
      +---------------------------+     +------------------------+
      | graph.db exists?          |     | Serena ready ?         |
      +---------------------------+     +------------------------+
          | yes         | no              | yes         | no
          v             v                 v             v
+----------------+  +----------------+  +-----------+  +--------+
| crg stats ok ? |  | ask build?     |  | Enhanced  |  | Basic  |
+----------------+  +----------------+  +-----------+  +--------+
   | yes   | no         | yes | no
   v       v            v     v
+--------+ +----------+ +----+ +-----------+
| Full   | | fallback | |Full| | Enhanced/ |
|        | | Enhanced | |    | | Basic     |
+--------+ +----------+ +----+ +-----------+
```

## 3.5.6 Phase 1：事实抽取的阶段依赖

当前 Phase 1 的内部不是单段脚本，而是一个严格有依赖关系的多阶段 DAG。

### Stage A

负责项目身份、数据形状、分层、数据库检测。

### Stage B Round1

在 Stage A 之后执行，负责：

- `crg flows`
- `crg communities`
- `crg architecture`
- integration 候选库初筛

### Stage B Round2

在 Round1 之后执行，负责：

- top-5 flow 深挖
- communities 深挖
- integration 精确 search

### Stage B Round3

在 Round2 之后执行，负责：

- `importers_of` 查询，形成 integration facts

### Stage C

在 Round3 之后执行，负责：

- `tests_for`
- `impact`
- `large-functions`
- `god-nodes`
- `dependents_of`

最终汇总为：

- `fact-inventory.json`
- `risk-signals.json`
- `test-surface.json`

## 3.5.7 Phase 1 ASCII 阶段依赖图

```text
Phase 1
  |
  +--> Stage A
  |     - project identity
  |     - data shapes
  |     - layer detection
  |     - database detection
  |
  +--> Stage B Round1
  |     - flows
  |     - communities
  |     - architecture
  |     - integration prefilter
  |
  +--> Stage B Round2
  |     - flow details
  |     - community details
  |     - integration node search
  |
  +--> Stage B Round3
  |     - importers_of
  |
  +--> Stage C
        - tests_for
        - impact
        - large-functions
        - god-nodes
        - dependents_of
        |
        v
  +---------------------------+
  | fact-inventory.json       |
  | risk-signals.json         |
  | test-surface.json         |
  +---------------------------+
```

## 3.5.8 Phase 2：任务规划

当前 skill 的 Phase 2 不是实现任务分解，而是做 **固定产物映射**。

它把事实层映射到固定文档：

- `00-summary.md` <- `project_identity`
- `architecture/module-map.md` <- `modules + data_shapes`
- `pitfalls/index.md` <- `risk_signals + integrations`
- `code-facts/public-entrypoints.md` <- `entrypoints`
- `code-facts/test-map.md` <- `testing_surface + test-surface.json`
- `code-facts/high-risk-modules.md` <- `risk_signals`
- `context-packs/review-change.md` <- entrypoints/risk/test 的静态组装

也就是说，当前 skill 在这一阶段已经隐含了一层 **compiler mapping**：

```text
事实字段 -> 固定文档产物
```

## 3.5.9 Phase 3：文档生成

当前 skill 的一个重要设计原则是：

**Phase 3 不回扫源码。**

它只消费：

- `fact-inventory.json`
- `risk-signals.json`
- `test-surface.json`

然后生成 `docs/contexts/<slug>/` 下文档。

这是当前实现中很重要的一条正确原则，因为它意味着：

- 文档层不再和源码重新耦合
- 事实层与 narrative 层开始分离
- 文档层更像 compiled output，而不是二次分析器

## 3.5.10 Phase 4：路由生成

当前 skill 最后的 Phase 4 负责生成：

- `docs/contexts/<slug>/injection-index.yaml`

它当前的角色是：

- `always`
- `stages`
- `selection_rules`
- `advice`

也就是说，它本质上是 **workflow 消费提示与路由表**。

当前问题不在于它没有价值，而在于：

- 它还是“静态路由声明”
- 还没有配套 deterministic evaluator

## 3.5.11 产物与消费链路 ASCII 图

```text
CRG / Serena / Built-in facts
          |
          v
+-------------------------------+
| .spec-first/workflows/...     |
| - fact-inventory.json         |
| - risk-signals.json           |
| - test-surface.json           |
| - artifact-manifest.json      |
+-------------------------------+
          |
          v
+-------------------------------+
| docs/contexts/<slug>/         |
| - 00-summary.md               |
| - module-map.md               |
| - pitfalls/index.md           |
| - public-entrypoints.md       |
| - test-map.md                 |
| - high-risk-modules.md        |
| - review-change.md            |
| - injection-index.yaml        |
+-------------------------------+
          |
          v
+-------------------------------+
| Consumer Workflows            |
| - spec-plan                   |
| - spec-work                   |
| - spec-code-review                 |
+-------------------------------+
```

## 3.5.12 当前 skill 的本质

把整个 skill 串起来看，当前 `spec-graph-bootstrap` 的本质可以压成一句话：

**它当前是一个“模式判定 + 事实抽取 + 文档编译 + 路由声明”的 Stage-0 supporting workflow。**

这也是为什么它方向是对的，但还没有到终局。

因为终局还需要补上：

- deterministic evaluator
- retrieval-aware minimal context assets
- freshness / compatibility / lint
- benchmark / regression

## 3.5.13 “当前 skill 执行逻辑 vs 正确终局执行逻辑” 对照 ASCII 图

下面这组图的目标不是重复前文，而是把：

- **当前 skill 实际怎么跑**
- **正确终局应该怎么跑**
- **两者核心差异在哪里**

用一眼能看懂的方式压缩出来。

### A. 当前 skill 执行逻辑

```text
+------------------------------+
| User runs graph-bootstrap    |
| 产物: 无                     |
| 说明: 用户触发 Stage-0       |
+------------------------------+
               |
               v
+------------------------------+
| Phase 0 readiness            |
| - host setup                 |
| - CRG availability           |
| - Serena availability        |
| - decide Full/Enhanced/Basic |
| 产物: slug / analyzer_mode   |
| 说明: 决定后续使用哪种能力链 |
+------------------------------+
               |
               v
+------------------------------+
| Write manifest (in_progress) |
| 产物: artifact-manifest.json |
| 说明: 控制面开始记录         |
+------------------------------+
               |
               v
+------------------------------+
| Backup old docs context      |
| 产物: backup_<timestamp>/    |
| 说明: 旧上下文回滚点         |
+------------------------------+
               |
               v
+------------------------------+
| Phase 1 fact extraction      |
| A -> B1 -> B2 -> B3 -> C     |
| 产物: 中间事实结果           |
| 说明: 抽取入口/模块/测试/风险 |
+------------------------------+
               |
               v
+------------------------------+
| Write machine facts          |
| - fact-inventory             |
| - risk-signals               |
| - test-surface               |
| 产物: 3 个 machine artifacts |
| 说明: 文档层和路由层的输入   |
+------------------------------+
               |
               v
+------------------------------+
| Phase 2 fixed task mapping   |
| 产物: 固定映射关系           |
| 说明: 事实 -> 文档任务       |
+------------------------------+
               |
               v
+------------------------------+
| Phase 3 generate docs        |
| from facts only              |
| 产物: README / 00-summary /  |
| module-map / test-map / ...  |
| 说明: 编译 docs/contexts     |
+------------------------------+
               |
               v
+------------------------------+
| Phase 4 generate routing     |
| - injection-index.yaml       |
| 产物: injection-index.yaml   |
| 说明: workflow 注入路由表    |
+------------------------------+
               |
               v
+------------------------------+
| Write manifest (complete)    |
| cleanup / rollback           |
| 产物: complete manifest      |
| 说明: 写 outputs + 收尾      |
+------------------------------+
               |
               v
+------------------------------+
| plan/work/review read docs   |
| mostly via prompt contract   |
| 产物: 消费侧注入文件列表     |
| 说明: 主要靠 prompt 约定读取 |
+------------------------------+
```

当前逻辑的本质是：

```text
readiness
  -> fact extraction
  -> docs compilation
  -> static routing declaration
  -> prompt-level consumption
```

### B. 正确终局执行逻辑

```text
+----------------------------------+
| User / Workflow requests context |
| 产物: context request            |
| 说明: 某个任务向系统请求最小上下文 |
+----------------------------------+
                 |
                 v
+----------------------------------+
| Context Control Plane            |
| - repo slug                      |
| - host capability                |
| - consumer contract version      |
| - freshness / compatibility      |
| 产物: run-meta / compatibility / |
| freshness 状态                   |
| 说明: 先判定当前上下文是否可用   |
+----------------------------------+
                 |
                 v
+----------------------------------+
| CRG Generation Resolver          |
| - current generation             |
| - last-known-good fallback       |
| - build health / parser quality  |
| 产物: generation_id / build-report |
| 说明: 选择健康且可消费的图快照   |
+----------------------------------+
                 |
                 v
+----------------------------------+
| Retrieval Layer                  |
| - seed                           |
| - graph expansion                |
| - rerank                         |
| - token-budget packing           |
| 产物: ranked_context / evidence pack |
| 说明: 生成任务最小证据包         |
+----------------------------------+
                 |
                 v
+----------------------------------+
| Compiled Context Compiler        |
| - machine artifacts              |
| - minimal-context cards          |
| - narrative assets               |
| - freshness/lint/contradictions  |
| 产物:                            |
| - context-routing.json           |
| - minimal-context/*.json         |
| - lint-report.json               |
| - docs/contexts/<slug>/*         |
| 说明: 同时编译机器资产与人类资产 |
+----------------------------------+
                 |
                 v
+----------------------------------+
| Deterministic Evaluator          |
| - stage/profile resolution       |
| - asset selection                |
| - fallback reason                |
| - selected evidence pack         |
| 产物: selected_assets /          |
| fallback_reason / advice         |
| 说明: 精确决定本次任务该读什么   |
+----------------------------------+
                 |
                 v
+----------------------------------+
| Consumer Workflow                |
| - plan                           |
| - work                           |
| - review                         |
| - verify                         |
| 产物: 最终注入上下文集合         |
| 说明: workflow 确定性消费上下文  |
+----------------------------------+
                 |
                 v
+----------------------------------+
| Eval + Telemetry                 |
| - retrieval quality              |
| - context efficiency             |
| - benchmark regression           |
| - freshness / drift incidents    |
| 产物: benchmark 报告 / telemetry |
| 说明: 用数据反哺 retrieval/compiler |
+----------------------------------+
```

终局逻辑的本质是：

```text
control plane
  -> stable generation
  -> task-aware retrieval
  -> compiled context
  -> deterministic consumption
  -> eval feedback loop
```

### C. 当前 vs 终局：核心差异收口图

```text
CURRENT
-------
environment check
  -> extract facts
     产物: fact-inventory.json / risk-signals.json / test-surface.json
  -> generate docs
     产物: docs/contexts/<slug>/*.md
  -> generate routing yaml
     产物: injection-index.yaml
  -> let downstream skills "try to read correctly"
     产物: prompt-level 注入行为

TARGET
------
control plane + compatibility
  -> resolve healthy generation
     产物: generation_id / build health
  -> retrieve minimal evidence
     产物: ranked_context / evidence pack
  -> compile machine/human context
     产物: minimal-context/*.json / docs assets / lint reports
  -> evaluator selects exact assets
     产物: selected_assets / fallback_reason
  -> workflow consumes deterministically
     产物: 实际注入上下文集合
  -> eval feeds back into retrieval/compiler
     产物: benchmark / telemetry / regression reports
```

### D. 差异焦点 ASCII 图

```text
Current Skill
-------------
facts ------------------> docs ------------------> routing yaml
  \                                                /
   \---------------- prompt conventions ----------/

Target System
-------------
facts --> retrieval --> minimal evidence packs --> evaluator --> workflow
   \            \              \                      |
    \            \              -> compiled context --+
     \----------------------------------------------> eval
```

### E. 一句话对照总结

可以把两者差异压成一句话：

**当前 skill 是“先抽事实、再生成文档、最后声明路由”；正确终局是“先解析控制面与健康状态，再做任务检索与上下文编译，最后由 evaluator 精确分发，并用 eval 持续反哺系统”。**

## 4. 外部最佳实践提炼

以下判断结合了当前公开资料与本地参照物，重点不是照搬方案，而是抽出对本项目最相关的原则。

## 4.1 工程实践启发

### Sourcegraph：检索与排序必须独立建模

Sourcegraph 的相关文章明确把 context engine 分成 retrieval 和 ranking 两阶段，并强调 latency SLA 与 token budget 是一等约束。  
来源：<https://sourcegraph.com/blog/lessons-from-building-ai-coding-assistants-context-retrieval-and-evaluation>

对本项目的直接启发：

- `CRG` 不能只停在“查图”
- Stage-0 不能只停在“产文档”
- 必须引入明确的 retrieval / ranking / packing 分层

### Qodo Aware：复杂代码库理解是系统问题，不是单一 prompt 问题

Qodo 的系统文强调，多 context provider、分级复杂度处理、宽度优先探索与跨领域收敛是复杂代码理解的关键。其 benchmark 文档也给出了基于真实代码库问题集的评测思路。  
来源：

- <https://www.qodo.ai/blog/code-aware-agentic-ai-the-system-approach/>
- <https://docs.qodo.ai/qodo-aware/core/benchmark>
- <https://github.com/qodo-ai/aware-swe-agent>

对本项目的直接启发：

- `CRG` 应成为可组合的 context provider，而不是唯一入口
- `spec-graph-bootstrap` 应成为长生命周期知识层，而不是单轮 prompt 产物
- Eval 必须从一开始就进入设计，而不是最后补

### graphify：持久图谱 + 渐进披露 + 增量重建

`graphify` 强调 persistent graph、增量处理、one-page report、查询式深入、hook 驱动优先读图。  
来源：<https://github.com/safishamsi/graphify>

对本项目的直接启发：

- `CRG` 必须有稳定快照和可重复消费入口
- Stage-0 需要 one-page map + deeper query 的结构，而不是平铺更多 narrative
- 需要明确“先读编译后的上下文，而不是先扫原始文件”

### code-review-graph：最小上下文优先、token 效率优先、eval 优先

`code-review-graph` 在公开 README 中给出了显式的 token 减少效果，并配套自动化评测。  
来源：<https://github.com/tirth8205/code-review-graph>

对本项目的直接启发：

- 必须把 “reads only what matters” 作为明确目标
- 需要 review-specific retrieval，而不是通用搜索的简单包装
- 需要离线 benchmark 和可重现评测 runner

### llm_wiki：知识应被编译和维护，而不是每次重新发现

`llm_wiki` 把 Karpathy 的 LLM Wiki 模式产品化，核心是 persistent wiki、持续 ingest、知识增量维护。  
来源：

- <https://github.com/nashsu/llm_wiki>
- <https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f>

对本项目的直接启发：

- `spec-graph-bootstrap` 的正确终局是 compiled knowledge layer
- Stage-0 的高价值资产应当是“会维护的知识”，不是“一次性生成的说明文档”

### get-shit-done：上下文工程必须接入 workflow 主链并对抗 context rot

`get-shit-done` 的重点不是图谱算法，而是 workflow orchestration、context rot 防控和 planning context rebuild。  
来源：<https://github.com/gsd-build/get-shit-done>

对本项目的直接启发：

- Stage-0 不仅要“生成”，还要“被稳定消费”
- 必须记录何时需要 rebuild context
- 必须把 context freshness 纳入质量门禁

## 4.2 学术启发

### RepoCoder：检索应当是迭代式的

RepoCoder 提出 iterative retrieval-generation pipeline，并配套 RepoEval。  
来源：<https://arxiv.org/abs/2303.12570>

启发：

- retrieval 不应只发生一次
- `review` / `plan` / `work` 需要 `seed -> expand -> refine` 的多轮链路

### RepoHyper：图扩展与 refine 排序是 retrieval 主链，而不是附属功能

RepoHyper 明确提出 `Search-Expand-Refine`，并以 repo-level semantic graph 为核心。  
来源：<https://arxiv.org/abs/2403.06095>

启发：

- 当前 `2-hop BFS` 是方向正确但远未完成的 v1
- 后续应把 graph expansion 正式纳入 retrieval pipeline

### Repoformer：检索应具有选择性

Repoformer 强调 retrieval 不是越多越好，而要学会“必要时才检索”。  
来源：<https://arxiv.org/abs/2403.10059>

启发：

- 不能对所有任务默认做大规模扩图
- 需要 retrieval policy / task profile / budget policy

### cAST：结构化 chunking 是 retrieval 基本盘

cAST 证明 AST-aware chunking 能显著提升 retrieval 和 generation。  
来源：<https://aclanthology.org/2025.findings-emnlp.430/>

启发：

- 在 `CRG` 里优先补 AST chunking，收益往往高于仓促引入向量库

### CodeRAG-Bench / CodeRepoQA / AACR-Bench / SWE-CI：必须把理解、检索、维护做成评测对象

来源：

- <https://arxiv.org/abs/2406.14497>
- <https://arxiv.org/abs/2412.14764>
- <https://arxiv.org/abs/2601.19494>
- <https://arxiv.org/abs/2603.03823>

启发：

- 需要 repo QA benchmark
- 需要 automated code review benchmark
- 需要长期 maintainability benchmark
- 需要把 retrieval quality 与 end-to-end agent success 分开评估

## 5. 终局架构定义

## 5.1 全局分层

终局架构建议收敛为如下五层：

```text
Raw Repo / Workflow Assets / Docs
  -> CRG Index Layer
  -> CRG Retrieval Layer
  -> Stage-0 Compiled Context Layer
  -> Workflow Consumption Layer
  -> Eval / Governance Layer
```

五层职责分别为：

### Index Layer

从代码中抽取可信、可审计、可增量、可回滚的结构化事实。

### Retrieval Layer

把图谱事实变成任务可消费的最小证据包。

### Compiled Context Layer

把高价值理解编译为长生命周期的机器资产与人类可读资产。

### Workflow Layer

让 `plan / work / review / verify` 拿到正确上下文，并记录消费行为。

### Eval Layer

衡量理解质量、token 效率、路由命中率、review 召回率、长期维护性。

## 5.2 正确的模块定位

### `src/crg/` 的正确定位

`CRG` 应只做三类事：

1. 代码事实编译
2. 任务上下文检索
3. 基础分析与可解释信号输出

不应承担的事：

- narrative 文档直接生成
- workflow prompt 拼装
- 复杂的业务知识编辑逻辑

### `spec-graph-bootstrap` 的正确定位

Stage-0 应只做四类事：

1. 编译 `CRG` 与仓库其他来源生成的 machine artifacts
2. 生成最小且稳定的 compiled context assets
3. 生成可被 workflow evaluator 消费的 routing contract
4. 生成 freshness / lint / drift / provenance 资产

不应承担的事：

- 再实现一套索引器
- 在 skill 文本中硬编码越来越复杂的消费规则
- 用 narrative 去替代 machine-first 事实层

## 6. `CRG v2` 详细优化方案

## 6.1 目标

把 `CRG` 从“本地 AST 图构建器”升级成“高质量 context engine 的底座”。

## 6.2 架构升级点

### 6.2.1 引入 Generation Model

当前：

- 单一 `graph.db`

建议升级：

```text
.spec-first/graph/
  generations/
    2026-04-15T20-00-00Z/
      graph.db
      build-report.json
      retrieval-cache.json
  current.json
  last-known-good.json
```

设计要求：

- 每次 build 生成独立 generation
- 只有 health checks 通过后才 promote 为 `current`
- 保留至少一代 `last-known-good`
- workflow 读取时优先绑定 `current`
- 若 `current` 不健康，则自动回退到 `last-known-good`

这样做的价值：

- 构建失败与消费解耦
- 退化构建可追溯
- 便于 benchmark 对比不同 generation

### 6.2.2 扩展 Schema：从 node/edge facts 升级为 retrieval-ready facts

当前 `nodes` 表不足以支撑高质量检索。建议扩展为：

- `summary`
- `signature_text`
- `retrieval_text`
- `tags_json`
- `parser_quality`
- `generation_id`
- `file_sha`
- `symbol_hash`

新增 `chunks` 表：

- `chunk_id`
- `node_id`
- `file_path`
- `chunk_kind`
- `start_line`
- `end_line`
- `token_estimate`
- `retrieval_text`
- `summary`

新增 `retrieval_features` 表：

- `item_id`
- `item_type` (`node` / `chunk` / `file`)
- `risk_score`
- `test_coverage_score`
- `flow_score`
- `community_score`
- `freshness_score`

设计原则：

- `nodes` 仍是结构事实源
- `chunks` 是 retrieval 最小单元
- `retrieval_features` 是排序特征层，不污染事实层

### 6.2.3 引入 AST-aware Chunking

建议以 `cAST` 风格实现 chunking：

- 默认以 function / method / class 为主 chunk
- oversized symbol 递归切成 AST 子块
- 小型 sibling node 可在 size limit 内合并
- chunk 必须保留父级 symbol、路径、摘要、边界

对当前仓库的直接好处：

- `search.js` 不再只按 `name` 查
- retrieval 可以直接返回语义上完整的代码块
- packing 能控制粒度，不必总是整文件注入

### 6.2.4 正式建立 Retrieval Layer

建议新增目录：

```text
src/crg/retrieval/
  seed.js
  expand.js
  rerank.js
  pack.js
  policy.js
  api.js
```

推荐 pipeline：

1. `seed`
   - lexical FTS / BM25
   - direct symbol hits
   - diff/file hints
2. `expand`
   - call graph expansion
   - import graph expansion
   - flow/community/risk/test priors
3. `rerank`
   - heuristic ranking v1
   - optional encoder rerank v2
4. `pack`
   - token-budget packing
   - dedupe
   - evidence diversity
   - fallback policy

统一 API 建议：

```json
{
  "task_type": "review",
  "query": "check auth-related blast radius",
  "budget_tokens": 2400,
  "seed_candidates": [],
  "expanded_candidates": [],
  "ranked_context": [],
  "pack_summary": {
    "selected_items": 9,
    "estimated_tokens": 2130,
    "packing_reason": [
      "lexical_hit",
      "call_graph_expansion",
      "test_coverage_gap"
    ],
    "fallback_reason": []
  }
}
```

### 6.2.5 将 `review-context` 从专用脚本升级为 profile-based retrieval

建议定义四类 profile：

- `review`
- `plan`
- `work`
- `qa`

差异不在“读不同文件”这么简单，而在：

- 初始 seed 来源不同
- graph expansion 半径不同
- test/risk 权重不同
- pack 优先级不同

例如：

- `review` 更强调 blast radius、risk、candidate tests
- `plan` 更强调 entrypoints、module boundaries、integrations
- `work` 更强调 target files、adjacent tests、data shapes
- `qa` 更强调 directly answerable evidence 和 traceability

### 6.2.6 信号层升级

当前 `flow/risk/community` 是 v1 启发式，建议分两阶段升级：

#### v2 工程升级

- 参数收口到统一 config
- 所有权重可测、可回放
- 输出 explainability 字段

#### v3 数据驱动升级

- 基于 benchmark 回推权重
- 使用 retrieval labels 做弱监督
- 仅在数据足够时考虑更复杂模型

原则：

- 先把 heuristic 做到稳、可解释、可测试
- 不急于引入复杂 GNN 或端到端学习排序

## 7. `spec-graph-bootstrap v2` 详细优化方案

## 7.1 目标

把 Stage-0 从“文档和 JSON 的流水线”升级为“Compiled Context Compiler”。

## 7.2 产物分层重构

建议把 Stage-0 产物拆成三层。

### 7.2.1 Control Plane

路径：

```text
.spec-first/workflows/bootstrap/<slug>/
```

建议保留并增强的产物：

- `artifact-manifest.json`
- `run-meta.json`
- `freshness.json`
- `lint-report.json`
- `compatibility.json`

职责：

- 记录 build 来源、版本、依赖、staleness、fallback、errors

### 7.2.2 Machine Context Plane

物理落点：

```text
.spec-first/workflows/bootstrap/<slug>/
```

建议新增或增强：

- `repo-identity.json`
- `entrypoints.json`
- `module-index.json`
- `risk-index.json`
- `test-index.json`
- `integration-index.json`
- `context-routing.json`
- `minimal-context/plan.json`
- `minimal-context/work.json`
- `minimal-context/review.json`
- `minimal-context/verify.json`
- `contradictions.json`

职责：

- 作为 workflow 与 evaluator 的 source-of-truth
- 与 `docs/contexts/<slug>/` 的 human docs 分离，避免 narrative 与 machine contract 混放

### 7.2.3 Human Context Plane

保留高 ROI 文档，不继续横向膨胀：

- `README.md`
- `00-summary.md`
- `architecture/module-map.md`
- `code-facts/public-entrypoints.md`
- `code-facts/test-map.md`
- `code-facts/high-risk-modules.md`
- `pitfalls/index.md`
- `context-packs/review-change.md`

设计原则：

- 人类文档是导航层，不是事实层
- narrative 必须从 machine artifacts 派生

## 7.3 Contract 重构

### 7.3.1 把 skill 契约从“文本说明”升级为“结构化 schema”

建议新增：

```text
docs/contracts/spec-graph-bootstrap/
  artifact-manifest.schema.json
  repo-identity.schema.json
  context-routing.schema.json
  minimal-context.schema.json
  lint-report.schema.json
```

并要求：

- `skills/spec-graph-bootstrap/SKILL.md` 只保留高层流程和字段说明
- 真正的字段 contract 由 schema 文件承载
- sample 由 generator 自动生成
- contract tests 对 schema + sample + runtime 输出三方同时校验

### 7.3.2 引入 Compatibility Contract

建议建立：

- `crg_schema_version`
- `bootstrap_schema_version`
- `consumer_api_version`

任何 workflow 消费前都应检查 compatibility matrix。

## 7.4 路由层重构：从 `injection-index.yaml` 升级为 Deterministic Evaluator

当前 `injection-index.yaml` 的价值在于表达 intent，但它不应继续承担最终执行器职责。

建议：

- 保留 `injection-index.yaml` 作为人类可读视图
- 新增 `context-routing.json` 作为 machine-first contract
- 新增 evaluator 模块执行规则求值

推荐目录：

```text
src/context-routing/
  loader.js
  evaluator.js
  fallback.js
  pack-profiles.js
```

推荐返回结果：

```json
{
  "stage": "review",
  "profile": "review-default",
  "level": "normal",
  "selected_assets": [
    "minimal-context/review.json",
    "risk-index.json",
    "test-index.json",
    "code-facts/high-risk-modules.md"
  ],
  "estimated_tokens": 1700,
  "fallback_reason": null,
  "skipped_rules": [],
  "freshness_status": "healthy"
}
```

### 7.4.1 Evaluator 的最小输入 contract

为了保证 evaluator 能先落地，再倒逼 schema 收敛，建议先把输入收敛到最小集合，而不是一开始依赖完整的 `CRG v2 schema`。

P0 阶段 evaluator 只依赖以下输入：

- `stage`
  - `plan | work | review | verify | unknown`
- `contextDir`
  - `docs/contexts/<slug>/`
- `controlPlaneDir`
  - `.spec-first/workflows/bootstrap/<slug>/`
- `context-routing.json`
  - machine-first 路由声明
- `artifact-manifest.json`
  - outputs / status / depends_on
- `freshness.json`
  - 可选；缺失时按 `unknown` 处理
- `minimal-context/*.json`
  - 可选；缺失时按文档资产降级

也就是说，P0 evaluator 不要求：

- 完整 retrieval layer 已经完成
- 完整 chunk schema 已经完成
- 所有 compiled assets 都已经完善

它只要求：

- 能判断“这次该读什么”
- 能判断“为什么降级”
- 能判断“哪些资产不存在或不新鲜”

### 7.4.2 Evaluator 的规则优先级

最重要的是优先级必须固定，否则后续很难测。

建议按以下顺序求值：

1. **健康性检查**
   - `artifact-manifest.status != complete` -> 直接降级
   - `compatibility` 不满足 -> 直接降级
   - `freshness_status == stale` -> 标记可读但降权
2. **stage/profile 解析**
   - `review` -> `review-default`
   - `work` -> `work-default`
   - `plan` -> `plan-default`
   - `verify` -> `verify-default`
   - `unknown` -> `unknown-default`
3. **always 资产加载**
   - 永远先注入 `always` 集
4. **stage 专属资产加载**
   - 加载当前 stage 对应 `stages[stage]`
5. **selection_rules 求值**
   - 按顺序求值
   - 命中的 rule 追加资产
6. **资产存在性过滤**
   - 文件不存在 -> 记录 `skipped_rules`
7. **新鲜度过滤/降权**
   - stale 资产不一定剔除，但需标记并排到后面
8. **去重与排序**
   - minimal-context JSON
   - machine facts JSON
   - human docs
9. **budget 裁剪**
   - 预算不够时先裁 narrative，再裁辅助 facts，最后保核心 minimal-context
10. **fallback reason 生成**
   - 结构化输出，而不是自由文本

### 7.4.3 Evaluator 的资产优先级

建议固定为：

1. `minimal-context/*.json`
2. `context-routing.json` 指向的 machine artifacts
3. `code-facts/*.md`
4. `architecture/*.md`
5. `README.md` / `00-summary.md`

原因：

- 先给任务卡片
- 再给结构化事实
- 再给辅助 narrative

### 7.4.4 Evaluator 的 fallback 规则

建议固定四级：

- `L0`
  - machine context + minimal context 全量可用
- `L1`
  - minimal context 缺失，但 machine artifacts 可用
- `L2`
  - machine artifacts 不完整，但核心 docs 可用
- `L3`
  - 仅剩 `README.md` + `00-summary.md`

建议 fallback reason 枚举：

- `manifest_incomplete`
- `routing_missing`
- `minimal_context_missing`
- `machine_artifact_missing`
- `freshness_stale`
- `compatibility_mismatch`
- `context_dir_missing`

### 7.4.5 Evaluator 的最小伪代码

```text
resolve(stage, slug):
  load manifest
  if manifest missing or manifest.status != complete:
    return L3(readme + summary, reason=manifest_incomplete)

  load context-routing.json
  if routing missing:
    return L2(core docs, reason=routing_missing)

  profile = resolveProfile(stage)
  assets = always + stages[profile]

  for rule in selection_rules:
    if eval(rule.condition):
      assets += rule.inject

  assets = filterExists(assets)
  assets = applyFreshness(assets)
  assets = sortByPriority(assets)
  assets = applyBudget(assets)

  if missing minimal-context:
    level = L1
  else:
    level = L0

  return { level, assets, advice, fallback_reason, skipped_rules }
```

### 7.4.6 Evaluator 的测试断言

P0 阶段至少需要覆盖：

- manifest 缺失
- manifest incomplete
- routing 缺失
- minimal-context 缺失
- freshness stale
- compatibility mismatch
- review / work / plan 三种 stage 差异
- budget 裁剪顺序

如果这部分没有写到测试可断言级别，就说明 evaluator 还没有设计完整。

## 7.5 Freshness / Lint / Drift 治理

这是当前系统能否团队化维护的关键。

建议新增三类 lint：

### A. Schema Drift Lint

检查：

- source skill vs schema
- schema vs sample
- sample vs runtime generated output

### B. Freshness Lint

检查：

- `graph_last_built`
- key input file sha
- output updated_at
- current generation 与 consumed generation 是否一致

### C. Knowledge Quality Lint

检查：

- orphan pages
- contradictory claims
- missing evidence
- stale claims
- noise pollution

其中 noise pollution 在当前仓库已经有实证，例如 `data_shapes` 混入 `skills/dspy-ruby/assets/signature-template.rb`，说明必须把“项目源码理解范围”和“仓库内 workflow 资产”做强隔离。

## 8. `CRG` 与 Stage-0 的接口 contract

这是整个系统长期健康的关键点，必须收口。

## 8.1 输入输出边界

### `CRG` 输出给 Stage-0 的内容

- `graph generation metadata`
- `repo identity facts`
- `entrypoint candidates`
- `module/community facts`
- `risk/test/integration/data-shape facts`
- `retrieval API`

### Stage-0 不应反向依赖 `CRG` 的内部表结构

正确做法：

- `CRG` 通过 stable command/API 输出结构化 envelope
- Stage-0 只依赖这些 envelope/schema
- Stage-0 不直接假定 SQLite 内部字段布局

## 8.2 统一 Envelope Contract

建议：

- 所有 `spec-first crg <command>` 输出统一 envelope
- envelope 里明确：
  - `schema_version`
  - `generation_id`
  - `degraded`
  - `warnings`
  - `data`

这样 Stage-0 才能稳定处理：

- 正常模式
- degraded 模式
- stale 模式
- fallback 模式

## 8.3 统一 Provenance Contract

Stage-0 生成的所有高价值字段都应保留：

- `confidence`
- `inference_reason`
- `evidence`
- `updated_at`
- `source_generation`

没有 provenance 的字段，不能进入高信任决策链。

## 9. 评测与质量门禁方案

如果没有 Eval Layer，就无法证明这套系统不是“更复杂的文档工程”。

## 9.1 Retrieval Benchmark

建议建立：

```text
benchmarks/retrieval/
  review/
  plan/
  work/
```

核心指标：

- Recall@k
- MRR
- evidence recall
- blast radius hit-rate
- irrelevant context ratio

## 9.2 Repo QA Benchmark

问题类型建议覆盖：

- 入口识别
- 调用链与依赖
- 数据流
- 风险点
- 测试面
- 外部集成

参考：

- CodeRepoQA
- Qodo benchmark 的真实仓库问答思路

## 9.3 Review Benchmark

建议构建：

- 变更 -> 应命中的相关文件集合
- 变更 -> 应命中的测试集合
- 变更 -> 应给出的高风险提示集合

参考：

- AACR-Bench
- code-review-graph eval

## 9.4 Context Efficiency Benchmark

衡量的不是“检索到了多少”，而是：

- 用多少 token 命中核心证据
- 是否减少无关扫描
- 是否减少整文件注入

建议指标：

- average selected tokens
- first useful evidence position
- context redundancy
- fallback rate

## 9.5 Longitudinal / Maintainability Benchmark

参考 SWE-CI 的思想，建议建立：

- generation build success rate
- stale artifact rate
- schema drift incident count
- rebuild latency
- consumer compatibility failure rate

## 10. 迭代路线图

## P0：必须先做

### P0.1 Stage-0 contract 收口 + evaluator 先跑通

这是 P0 的第一优先级，原因是：

- 当前系统最先缺的是“消费闭环”，不是“更多 schema 字段”
- evaluator 先落地，才能反过来约束 machine artifacts 最低需要提供什么
- 如果先扩 schema，再做 evaluator，极易把 schema 做成“设计上很完整，消费上并不需要”的过度工程

工作项：

- `context-routing.json` 最小 contract
- evaluator 模块
- fallback contract
- sample generator
- sample drift tests

退出标准：

- 三个 workflow 都能调用同一 evaluator
- evaluator 能输出 `level / selected_assets / fallback_reason`
- 没有 retrieval v2 时也能稳定运行

### P0.2 `CRG` generation 化

- 引入 generation snapshot
- 引入 promote / rollback
- build report 和 health report 独立落盘

### P0.3 retrieval-ready facts（按 evaluator 需要最小化扩展）

- 扩展 `nodes` schema
- 生成 `retrieval_text`
- 按需补最小 summary / parser_quality / generation_id

这里强调一个约束：

- **先只补 evaluator 和最小 retrieval 所需要的字段**
- 不在 P0 一次性把所有理想字段都做满

P0 最小建议字段：

- `generation_id`
- `parser_quality`
- `summary`
- `retrieval_text`

`chunks`、`retrieval_features`、更丰富的 tags/signature 字段进入 `P1` 更合理。

### P0.4 `CRG` generation 与 evaluator 接线

- generation 状态进入 control plane
- evaluator 能识别 current / last-known-good
- fallback reason 能表达 generation 健康状态

这是最应该优先完成的闭环。

## P1：高收益增强

### P1.1 hybrid retrieval

- lexical seed
- graph expansion
- heuristic rerank
- task-aware packing

### P1.2 freshness / lint / contradictions

- freshness.json
- lint-report.json
- contradictions.json

### P1.3 machine-first minimal context assets

- `minimal-context/plan.json`
- `minimal-context/work.json`
- `minimal-context/review.json`
- `minimal-context/verify.json`

说明：

- `verify` 属于终局 machine-first profile
- 但仅在 `verify` workflow 或明确 consumer 就绪后落地，不应先于消费方抢实现

## P2：质量闭环

### P2.1 benchmark runner

- retrieval benchmark
- repo QA benchmark
- review benchmark
- context efficiency benchmark

### P2.2 workflow telemetry

- 实际读取了哪些 assets
- 哪些 assets 被引用
- 哪些 assets 无效或过期

## P3：中长期增强

### P3.1 optional semantic retrieval / rerank

- encoder-based rerank
- vector candidate expansion

### P3.2 cross-repo / workspace level context

- 支持多 repo 知识层
- 支持组织级 compiled context

### P3.3 更强的知识编辑与治理能力

- 人工审阅队列
- source review workflow
- durable ownership

## 11. 团队协作与维护策略

这部分必须明确，因为用户目标不只是“本地能跑”，而是“团队可维护、可更新、可迭代”。

## 11.1 单一真源

以下必须严格定义 source-of-truth：

- schema：`docs/contracts/...`
- generator：`src/...`
- checked-in sample：generator 产物，不手写维护
- skill 文档：高层说明，不承载唯一字段真相

## 11.2 版本治理

建议所有核心面都带版本：

- `crg_schema_version`
- `retrieval_profile_version`
- `bootstrap_schema_version`
- `consumer_contract_version`

## 11.3 变更治理

任何变更只要涉及以下内容，必须同步更新：

- schema
- sample
- contract tests
- docs/contexts checked-in sample
- benchmark baselines

## 11.4 责任边界

建议在团队内把责任边界拆开：

- `CRG` owner：索引、检索、schema、build health
- Stage-0 owner：compiled context、routing、lint、freshness
- Workflow owner：consumer integration、fallback、telemetry
- Eval owner：benchmark、regression、quality gate

## 12. 不该做的事

为了保证方案高质量，以下事项明确不建议优先：

### A. 不要先上 vector-first 大重构

原因：

- 当前 lexical + graph + chunking 的工程基础还没打透
- benchmark 缺失时很难证明收益

### B. 不要继续横向膨胀 narrative 文档

原因：

- 当前问题不是“文档不够多”
- 而是“最小上下文分发与质量证明不足”

### C. 不要让 Stage-0 继续在 skill 文本里堆复杂逻辑

原因：

- 难测试
- 难维护
- 难回归

### D. 不要把 `CRG` 内部 SQLite 结构直接暴露给 workflow

原因：

- 会导致后续 schema 演进成本极高

## 13. 验收标准

只有满足以下标准，才能认为 `CRG + spec-graph-bootstrap` 真正接近高质量终局：

### A. 正确性

- Stage-0 schema drift 可被自动检测并阻断
- workflow 读取的上下文由 deterministic evaluator 计算，不只靠 prompt 说明

### B. 可维护性

- 任一核心 schema 变更会自动驱动 sample、tests、docs 更新
- generation build 失败不会破坏 workflow 消费

### C. 理解质量

- `review` 场景 evidence recall 提升
- `plan` 场景入口/模块/测试面命中率提升
- `work` 场景无关文件扫描下降

### D. 效率

- token 使用量显著下降
- fallback 频率下降
- rebuild latency 保持可控

### E. 长期性

- freshness / stale claim / compatibility 有明确治理
- 能在多个真实仓库上稳定运行并通过 benchmark

## 14. 最终建议

从终局目标出发，当前 `spec-first` 的正确优化路径不是“继续堆功能”，而是：

1. 先把 `CRG` 升级成 **generation-aware、retrieval-aware 的代码事实与检索底座**
2. 再把 `spec-graph-bootstrap` 升级成 **machine-first、schema-driven 的 compiled context compiler**
3. 最后把 workflow consumption 和 eval layer 接成闭环，证明它真的提升了代码库理解与 AI 编码质量

换句话说，正确的产物不应该是：

- 更多文档
- 更多命令
- 更多启发式脚本

而应该是：

- 更可信的事实层
- 更准确的最小上下文分发
- 更稳定的长期知识层
- 更严格的质量证明

这才是 `src/crg/` 和 `skills/spec-graph-bootstrap` 走向业界最佳实践、并达到高质量要求的正确方向。

## 15. 文件级实施落点

为了让方案能够直接指导工程实施，这里给出建议的文件级落点。目标不是在本阶段一次性实现，而是把“应该改哪里”明确下来。

## 15.1 `CRG` 改造落点

### `src/crg/cli/build.js`

建议承担：

- generation 目录创建
- build report 输出
- promote / rollback 流程编排
- 失败时不污染 `current`

建议新增：

- `prepareGenerationDir()`
- `runHealthChecks()`
- `promoteGeneration()`
- `writeBuildReport()`

### `src/crg/migrations.js`

建议承担：

- schema v2 创建
- `chunks`、`retrieval_features`、`generation_meta` 等表迁移
- 向下兼容旧库的最小迁移逻辑

### `src/crg/parser.js`

建议承担：

- node summary 基础提取
- signature_text 生成
- AST chunking
- parser_quality 细化

### `src/crg/graph.js`

建议承担：

- node/chunk 写入
- unresolved edge 与 generation 关联
- symbol_hash / file_sha 维护

### `src/crg/search.js`

建议逐步收敛为：

- seed retrieval 的底层 lexical provider
- 不再直接承担“完整任务检索层”的角色

### `src/crg/cli/context.js`

建议升级为：

- generation-aware 概览入口
- 暴露 top hubs / top communities / top flows 的同时，返回 retrieval health 摘要

### `src/crg/commands/review-context.js`

建议重构为：

- 调用统一 retrieval API 的 `review` profile
- 不再自己维护完整的 graph expansion / packing 逻辑

### 新增 `src/crg/retrieval/`

建议拆分：

- `seed.js`
- `expand.js`
- `rerank.js`
- `pack.js`
- `profiles.js`
- `api.js`

### 新增 `src/crg/generations/`

建议拆分：

- `paths.js`
- `promote.js`
- `rollback.js`
- `health.js`

## 15.2 `spec-graph-bootstrap` 改造落点

### `skills/spec-graph-bootstrap/SKILL.md`

建议保留：

- Phase 级流程
- 高层职责
- 用户交互与降级语义

建议移出：

- 过细的字段 contract
- 长篇 machine schema 细节
- 复杂路由逻辑真相

### 新增 `docs/contracts/spec-graph-bootstrap/`

建议承载：

- 事实层 schema
- routing schema
- minimal context schema
- lint schema

### 新增 `src/context-routing/`

建议承载：

- `loader.js`
- `evaluator.js`
- `profiles.js`
- `fallback.js`
- `formatters.js`

### 新增 `src/bootstrap-compiler/`

建议承载：

- `compile-machine-artifacts.js`
- `compile-human-assets.js`
- `freshness.js`
- `lint.js`
- `sample-generator.js`

### `docs/contexts/spec-first/`

建议定位为：

- checked-in reference sample
- 不再手工维护 schema 细节
- 所有样本由 compiler 或 sample generator 生成

## 15.3 Workflow 接入落点

建议后续在以下 skill 中接入 evaluator，而不是继续只写 prompt 约定：

- [skills/spec-plan/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-plan/SKILL.md)
- [skills/spec-work/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-work/SKILL.md)
- [skills/spec-code-review/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-code-review/SKILL.md)

目标是让它们统一依赖：

- `context-routing.json`
- `minimal-context/*.json`
- freshness / fallback metadata

## 16. 分阶段实施顺序

为了降低改造风险，建议按下面顺序推进，而不是并行大改。

## 16.1 第一阶段：稳定底座

优先级最高，目标是“先让系统稳定可演进”。

工作项：

- generation model
- schema v2
- sample generator
- deterministic evaluator

退出标准：

- build 失败不污染当前消费
- sample drift 可自动检测
- 三个 workflow 都能跑 evaluator

## 16.2 第二阶段：最小上下文闭环

目标是“让 retrieval 真正服务任务，而不是只做查询”。

工作项：

- AST-aware chunking
- retrieval API
- review/plan/work profile
- minimal-context assets

退出标准：

- review context 不再直接拼凑文件列表
- plan/work/review 都能拿到 task-aware evidence pack

## 16.3 第三阶段：质量闭环

目标是“让系统能被证明有效”。

工作项：

- retrieval benchmark
- repo QA benchmark
- review benchmark
- context efficiency benchmark

退出标准：

- 至少一个真实仓库建立 benchmark baseline
- 方案优化开始由数据驱动，而不是只靠主观判断

## 16.4 第四阶段：长期治理

目标是“让系统适合团队长期维护”。

工作项：

- freshness / compatibility / contradictions lint
- workflow telemetry
- long-term maintainability metrics

退出标准：

- 能识别 context rot
- 能识别 stale claim
- 能识别 schema drift 与 consumer mismatch

## 17. 测试与验证矩阵

没有测试矩阵，这份方案无法真正落地。

## 17.1 `CRG` 层测试

建议补充：

- generation promote / rollback 单测
- schema migration 回归测试
- chunking 单测
- retrieval ranking / packing 单测
- degraded parser 与 fallback 行为测试

## 17.2 Stage-0 层测试

建议补充：

- schema contract tests
- sample generator tests
- freshness / lint tests
- context-routing evaluator tests
- compatibility matrix tests

## 17.3 Workflow 层测试

建议补充：

- `spec-plan` 注入结果测试
- `spec-work` 注入结果测试
- `spec-code-review` 注入结果测试
- evaluator fallback 行为 e2e

## 17.4 Benchmark 层测试

建议补充：

- retrieval dataset smoke tests
- benchmark runner reproducibility tests
- baseline regression guards

## 18. 建议的首个里程碑交付物

如果只允许先做一轮高价值改造，我建议第一里程碑只交付以下内容：

1. `context-routing` deterministic evaluator
2. workflow Stage-0 contract 对齐到 evaluator 输出
3. `CRG` generation model
4. `minimal-context/review.json`
5. schema/sample drift tests
6. `CRG` retrieval-ready 最小 schema 扩展
7. 一套最小 review benchmark

原因很简单：

- 这七项能最直接证明系统开始从“能产文档”进化为“能稳定分发最小证据包”
- 严格顺序应为 evaluator/contract 在前，generation 与 schema 扩展在后
- 这七项完成后，再扩展 `plan / work`、freshness、lint、longitudinal eval 的性价比最高

## 19. 参考资料

### 工程实践

- Sourcegraph: <https://sourcegraph.com/blog/lessons-from-building-ai-coding-assistants-context-retrieval-and-evaluation>
- Qodo system approach: <https://www.qodo.ai/blog/code-aware-agentic-ai-the-system-approach/>
- Qodo benchmark: <https://docs.qodo.ai/qodo-aware/core/benchmark>
- aware-swe-agent: <https://github.com/qodo-ai/aware-swe-agent>
- graphify: <https://github.com/safishamsi/graphify>
- code-review-graph: <https://github.com/tirth8205/code-review-graph>
- llm_wiki: <https://github.com/nashsu/llm_wiki>
- Karpathy LLM Wiki gist: <https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f>
- get-shit-done: <https://github.com/gsd-build/get-shit-done>

### 学术论文与评测

- RepoCoder: <https://arxiv.org/abs/2303.12570>
- RepoHyper: <https://arxiv.org/abs/2403.06095>
- Repoformer: <https://arxiv.org/abs/2403.10059>
- cAST: <https://aclanthology.org/2025.findings-emnlp.430/>
- CodeRAG-Bench: <https://arxiv.org/abs/2406.14497>
- CodeRepoQA: <https://arxiv.org/abs/2412.14764>
- AACR-Bench: <https://arxiv.org/abs/2601.19494>
- SWE-CI: <https://arxiv.org/abs/2603.03823>
