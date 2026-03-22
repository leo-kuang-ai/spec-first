# 新项目 / 增量需求 / 混合型需求：ASCII 流程图版

文档日期：2026-03-22
适用场景：
- 公司内多人协作研发
- 多端项目：App / H5 / Backend / 后台
- 同时覆盖新项目 / 新业务建设、存量项目增量迭代、以及混合型需求
- 同时考虑多人分端模式与全栈整包模式

## 1. 核心结论

```text
当前一期主线应理解为:

产品需求评审完成
  -> 各端识别受影响 git 工程
  -> 各端创建 workspace
  -> 各端在 workspace 下拆自己负责模块的需求
  -> 输出自己负责的需求范围
  -> handoff 给 gstack
  -> gstack 继续做澄清 / 方案设计 / 开发 / 测试 / 发布

这条主线最适合:
  存量项目 / 增量需求

不能直接完整覆盖:
  新项目 / 新业务
  混合型需求

此外还要区分:
  - 多人分端模式
  - 全栈整包模式
```

## 2. 为什么不能直接覆盖新项目

```text
新项目里，常见情况:

1. 工程还没建
   - App repo 还没有
   - H5 repo 还没有
   - Backend service 还没拆

2. 端边界还没定
   - 先做 App 还是 H5？
   - 后端是单体还是服务化？

3. 接口边界还没定
   - 哪些规则前端做？
   - 哪些规则后端统一？

4. 组织边界也未必定
   - 谁是 owner？
   - 哪个团队负责哪个模块？
```

所以：

```text
新项目不能直接从
“各端识别受影响 git 工程”
这一步开始
```

## 3. 新项目流程

```text
                 新项目 / 新业务
                        |
                        v
               +----------------------+
               | 需求澄清 / 立项       |
               +----------------------+
                        |
                        v
               +----------------------+
               | 跨端职责划分         |
               | App/H5/Backend      |
               +----------------------+
                        |
                        v
               +----------------------+
               | 工程拓扑设计         |
               | 仓库/服务/模块边界   |
               +----------------------+
                        |
                        v
               +----------------------+
               | 接口边界设计         |
               | 契约 / 协议 / 数据流 |
               +----------------------+
                        |
                        v
        +---------------+---------------+
        |               |               |
        v               v               v
   App workspace     H5 workspace    Backend workspace
        |               |               |
        v               v               v
   本端模块需求范围    本端模块需求范围   本端模块需求范围
        \               |               /
         \              |              /
          +-------------+-------------+
                        |
                        v
                  handoff 给 gstack
                        |
                        v
          gstack 澄清 / 方案设计 / 开发执行
```

### 新项目关键点

```text
先做:
  - 跨端职责划分
  - 工程拓扑设计
  - 接口边界设计

再做:
  - 各端 workspace
  - 本端模块需求范围
  - handoff 给 gstack
```

## 4. 存量项目 / 增量需求流程

```text
               存量项目 / 增量需求
                        |
                        v
               +----------------------+
               | 产品需求评审完成     |
               +----------------------+
                        |
        +---------------+---------------+
        |               |               |
        v               v               v
   App 识别工程      H5 识别工程      Backend 识别工程
        |               |               |
        v               v               v
   App workspace     H5 workspace    Backend workspace
        |               |               |
        v               v               v
   本端模块需求范围    本端模块需求范围   本端模块需求范围
        \               |               /
         \              |              /
          +-------------+-------------+
                        |
                        v
                  handoff 给 gstack
                        |
                        v
          gstack 澄清 / 方案设计 / 开发 / 测试 / 发布
```

### 增量需求关键点

```text
因为已存在:
  - 仓库
  - owner
  - 端边界
  - 服务边界
  - 接口风格

所以可以直接进入:
  “识别受影响工程 -> workspace -> 本端模块需求范围 -> handoff”
```

## 5. 混合型需求流程

```text
混合型需求
= 存量项目工程代码更新
+ 新工程创建
```

典型场景：

- 老 App / H5 / Backend 要继续改
- 同时新增一个 service / BFF / SDK / repo / module
- 旧系统继续承载主流程，但部分新能力需要落到新的工程承载体

```text
                  混合型需求
                        |
                        v
               +----------------------+
               | 产品需求评审完成     |
               +----------------------+
                        |
                        v
               +----------------------+
               | 识别存量受影响工程   |
               +----------------------+
                        |
                        v
               +----------------------+
               | 识别需新增的工程承载体|
               +----------------------+
                        |
                        v
               +----------------------+
               | 局部工程落位设计     |
               | 新 service / BFF 等  |
               +----------------------+
                        |
                        v
               +----------------------+
               | 统一 workspace 上下文|
               +----------------------+
                        |
                        v
        +---------------+---------------+
        |               |               |
        v               v               v
   本端模块需求范围    本端模块需求范围   本端模块需求范围
        \               |               /
         \              |              /
          +-------------+-------------+
                        |
                        v
                  handoff 给 gstack
                        |
                        v
           gstack 澄清 / 方案设计 / 开发 / 测试
```

### 混合型需求关键点

```text
它不是纯新项目
也不是纯增量需求

而是:
  增量主线
  + 局部新工程落位
```

因此需要：

- 先识别旧工程改动面
- 再识别哪些能力需要新工程承载
- 对新增工程做局部落位设计
- 然后统一 workspace 并输出各端模块需求范围
- 后续交给 gstack 承担方案设计和执行链路

## 6. 全栈开发者如何适配

```text
这套流程可以适配全栈开发者
但不能简单照搬“多人分端版”

要改成:
  按职责边界拆
  按交付切片拆
  保留 workspace 与模块需求范围
  然后 handoff 给 gstack
```

### 单人全栈 / 全栈整包流程

```text
                单人全栈开发者
                       |
                       v
               +----------------------+
               | 需求评审完成         |
               +----------------------+
                       |
                       v
               +----------------------+
               | 识别受影响工程       |
               +----------------------+
                       |
                       v
               +----------------------+
               | 创建全栈 workspace   |
               +----------------------+
                       |
                       v
      +----------------+----------------+----------------+
      |                |                |                |
      v                v                v                v
 App 模块需求范围   H5 模块需求范围   Backend 模块需求范围  open questions
      |                |                |                |
      +----------------+----------------+----------------+
                       |
                       v
               +----------------------+
               | 生成 fullstack       |
               | handoff bundle       |
               +----------------------+
                       |
                       v
               +----------------------+
               | /plan-ceo-review     |
               +----------------------+
                       |
                       v
               +----------------------+
               | /plan-eng-review     |
               +----------------------+
                       |
                       v
               开发 / 自测 / 联调 / 提测
```

### 团队里存在全栈开发者时

```text
主流程仍按团队协作流程走
只是某些切片由全栈开发者承接
```

```text
                 一个需求 / 一个 feature
                           |
                           v
                +----------------------+
                | 总需求 / 总范围      |
                +----------------------+
                           |
           +---------------+------------------+
           |                                  |
           v                                  v
+--------------------------+       +--------------------------+
| 切片 A: 全栈开发者负责   |       | 切片 B: 多人协作负责     |
| App + H5 + Backend       |       | 分端 / 分模块            |
+--------------------------+       +--------------------------+
           |                                  |
           v                                  v
+--------------------------+       +--------------------------+
| 输出本切片 workspace /   |       | 输出本切片 workspace /   |
| 模块需求范围 / handoff   |       | 模块需求范围 / handoff   |
+--------------------------+       +--------------------------+
           |                                  |
           +---------------+------------------+
                           |
                           v
                统一进入 gstack 下游链
                           |
                           v
                     CEO Review -> Eng Review
                           |
                           v
                     开发 / 联调 / 提测
```

## 7. 统一入口分流图

```text
需求评审完成
   |
   v
+------------------------------+
| 判断需求类型                 |
| - 新项目 / 新业务            |
| - 存量项目 / 增量需求        |
| - 混合型需求                |
+------------------------------+
          |
   +------+------+ 
   |      |      |
   v      v      v
新项目主线  增量主线  混合型主线
   |      |      |
   |      |      +--> 识别存量受影响工程
   |      |      +--> 识别需新增工程承载体
   |      |      +--> 局部工程落位设计
   |      |      +--> 再进入 workspace / handoff 主线
   |      |
   |      +--> 判断交付模式
   |      |    - 多人分端
   |      |    - 全栈整包
   |      |
   |      +--> workspace
   |      +--> 模块需求范围 / handoff
   |
   +--> 跨端职责划分
   +--> 工程拓扑设计
   +--> 仓库/服务边界设计
   +--> 接口边界设计
   +--> 再进入交付模式分流
```

## 8. 真正的分界点

```text
分界点不是:
  这个项目是不是“新项目”

真正分界点是:
  是否已经存在稳定的工程承载体
```

### 工程承载体包括

```text
- repo 是否已存在
- 端边界是否已存在
- owner 是否明确
- 接口风格是否稳定
- 服务边界是否稳定
```

### 判断结果

```text
如果这些都已存在:
  -> 走增量需求流程

如果这些不存在或不稳定:
  -> 先做工程落位
  -> 再进入各端 workspace 流程
```

## 9. 最终建议

```text
不要试图用一条“增量需求流程”覆盖所有场景

而是:
先判断需求类型
新项目先做工程落位
增量需求再判断交付模式
  - 多人分端
  - 全栈整包
```

## 10. 各节点可抽象的原子 Skill

下面把整条流程压成可工程化实现的原子 skill 表。

### 10.1 总表

这张总表是完整能力地图，不等于第一阶段全部实现范围。  
为便于落地，增加一列“实现阶段”：

- `L1`：主链路，第一阶段优先实现
- `L2`：增强能力，第二阶段补强
- `L3`：治理能力，第三阶段完善

| 实现阶段 | 流程阶段 | 流程节点 | 节点目标 | 建议原子 skill | 主要输入 | 主要输出 | 适用模式 | 可直接复用的 gstack skill |
|---|---|---|---|---|---|---|---|---|
| L1 | 需求阶段 | 需求类型判断 | 判断是新项目、增量需求还是混合型需求 | `detect-demand-type` | 产品需求、项目状态 | `new_project` / `incremental` / `hybrid`、判断依据 | 全部 | `-` |
| L1 | 需求阶段 | 交付模式判断 | 判断多人分端还是全栈整包 | `detect-delivery-mode` | owner、端划分、组织方式 | `multi-team-by-end` / `fullstack-owner` | 增量、新项目后期 | `-` |
| L1 | 需求阶段 | 需求澄清 / 立项 | 统一业务目标与范围 | `clarify-product-scope` | 产品需求、场景、目标 | 统一需求说明、范围、验收标准 | 新项目 | `/office-hours` |
| L1 | 需求阶段 | 产品需求按端拆分 | 形成本端需求文档 | `split-product-demand-by-end` | 总产品需求 | App/H5/后台本端需求文档 | 增量、全栈 | `-` |
| L1 | 需求阶段 | 后端能力域拆分 | 后端按能力域拆，而不是跟前端拆 | `split-backend-by-capability-domain` | 总需求、后端现有能力域 | Backend 能力域文档 | 增量、新项目 | `-` |
| L1 | 方案阶段 | 新项目工程落位设计 | 明确职责边界、工程拓扑和接口边界 | `design-project-foundation` | 产品需求、用户场景、组织边界 | 端职责边界、仓库/服务/模块边界、接口边界 | 新项目 | `/plan-eng-review` |
| L1 | 方案阶段 | 受影响工程识别 | 找出本次涉及哪些 repo 和服务 | `detect-affected-repos` | 产品需求、历史类似功能、系统结构 | repo / service 列表、`direct_change/dependency_review/integration_only` | 增量 | `-` |
| L1 | 方案阶段 | 混合型需求局部工程落位 | 为存量系统中的新增工程承载体做局部落位设计 | `design-incremental-foundation-extension` | 产品需求、存量系统结构、待新增工程承载体 | 新增 service / BFF / SDK / repo / module 的边界设计 | 混合型需求 | `/plan-eng-review` |
| L1 | 方案阶段 | workspace 上下文组装 | 为多人分端或全栈整包准备分析与开发上下文 | `assemble-workspace-context` | repo 列表、端划分或整包范围 | App/H5/Backend workspace 或全栈 workspace | 多人分端、全栈整包 | `-` |
| L1 | 方案阶段 | 本端方案设计 | 生成各端技术方案与改动点 | `design-end-solution` | 本端需求文档、workspace、归属信息 | 本端技术方案、改动点、风险 | 全部 | `/plan-eng-review` |
| L2 | 方案阶段 | 跨端集成设计 | 定义跨端依赖与联调顺序 | `design-cross-end-integration` | 各端方案、能力域方案 | 跨端依赖图、联调顺序 | 多人分端、全栈 | `/plan-eng-review` |
| L1 | 协议阶段 | 接口协议草案 | 产出接口文档 / 协议草案 | `draft-api-contract` | 各端改动点、后端能力域方案 | API 契约、字段变更、兼容性说明 | 全部 | `-` |
| L2 | 协议阶段 | 接口一致性检查 | 检查前后端协议是否一致 | `review-api-contract-consistency` | App/H5/Backend 方案、API 契约 | 协议冲突清单、缺失项 | 全部 | `/plan-eng-review` |
| L1 | 评审阶段 | 跨端技术方案评审 | 做技术方案门禁评审 | `review-cross-end-solution` | 各端方案、API 契约、联调依赖 | 评审结论、风险项、待补充项 | 全部 | `/plan-eng-review` |
| L2 | 评审阶段 | 工程影响面复核 | 在设计评审后确认会改哪些模块和目录 | `review-implementation-impact` | 已识别 repo、设计结果、repo/目录/owner | 模块 / 目录级改动面确认结果 | 全部 | `/review` |
| L3 | 文档治理阶段 | 文档状态同步 | 同步需求、方案、协议、任务文档状态 | `sync-demand-doc-status` | 各类文档、当前流程状态 | 文档状态更新、缺失项标记 | 全部 | `/document-release` |
| L3 | 文档治理阶段 | 文档一致性检查 | 检查需求/方案/协议/任务是否漂移 | `check-doc-consistency` | 总需求文档、本端需求文档、方案、协议、任务 | 一致性问题清单、漂移点 | 全部 | `/document-release` |
| L1 | 开发阶段 | 任务包生成 | 生成可分配的研发任务，并带出依赖与串并行关系 | `generate-task-packages` | 设计结果、repo/owner/边界 | App/H5/Backend/联调任务文档、依赖与开发顺序 | 全部 | `-` |
| L3 | 开发阶段 | 交付状态跟踪 | 跟踪各端任务执行状态 | `track-delivery-status` | 任务包、执行反馈、owner | 状态看板、阻塞状态、完成度 | 全部 | `-` |
| L3 | 开发阶段 | 阻塞与依赖检测 | 识别接口、环境、上游能力阻塞 | `detect-blockers-and-dependencies` | 任务状态、接口依赖、环境状态 | 阻塞清单、依赖链路 | 全部 | `/investigate` |
| L3 | 变更控制阶段 | 需求变更影响分析 | 分析需求变更会影响哪些端和文档 | `analyze-demand-change-impact` | 新旧需求、现有方案、任务、协议 | 变更影响面、受影响文档和任务 | 全部 | `-` |
| L3 | 变更控制阶段 | 任务包重算 | 基于需求变更重新生成任务依赖 | `rebase-task-packages-on-change` | 变更影响分析、旧任务包 | 更新后的任务包、依赖调整 | 全部 | `-` |
| L2 | 测试阶段 | 自测清单生成 | 为各端生成自测 checklist | `generate-self-test-checklist` | 本端任务文档、接口契约、风险点 | 自测 checklist | 全部 | `/qa` |
| L2 | 测试阶段 | 联调清单生成 | 生成联调与提测清单 | `generate-integration-test-checklist` | 各端任务文档、API 契约、联调顺序 | 联调 checklist、提测 checklist | 全部 | `/qa` |
| L2 | 测试阶段 | 验收包生成 | 生成产品/测试可直接使用的验收材料 | `generate-acceptance-pack` | 需求文档、任务状态、接口协议、环境信息 | 验收包、验收路径、风险说明 | 全部 | `/qa`、`/qa-only` |
| L3 | 发布反馈阶段 | 发布影响总结 | 总结本次需求最终影响范围与关闭风险 | `summarize-release-impact` | 需求、方案、任务、测试、发布结果 | 发布影响总结、复盘输入 | 全部 | `/retro` |

### 10.2 实施策略：先 Skill，后编排层

当前更合适的落地方式是：

```text
先 skill
后编排层
```

原因是：

- 这套流程的原子能力边界还在收敛
- 输入输出文档比上层编排关系更容易先稳定
- 如果太早做编排层，容易和 skill 重复
- 先做 skill，更容易验证、重跑和逐步替换

因此建议：

- 第一阶段先实现 skill
- 第二阶段再引入更上层的流程编排能力

### 10.3 最小可落地 Skill 集合

如果不想一次性实现太多 skill，建议优先做下面 11 个：

| 优先级 | skill | 解决的问题 |
|---|---|---|
| P0 | `detect-demand-type` | 先判断该走新项目、增量还是混合型流程 |
| P0 | `detect-delivery-mode` | 在增量流程里先判断多人分端还是全栈整包 |
| P0 | `detect-affected-repos` | 找出本次会改哪些工程 |
| P0 | `split-product-demand-by-end` | 把总需求拆成各端需求文档 |
| P0 | `split-backend-by-capability-domain` | 防止后端跟着前端页面碎片化 |
| P0 | `design-project-foundation` | 为新项目一次性完成职责、拓扑和接口边界设计 |
| P0 | `design-incremental-foundation-extension` | 为混合型需求中的新增工程承载体做局部落位设计 |
| P0 | `assemble-workspace-context` | 为多人分端或全栈整包准备统一 workspace 上下文 |
| P0 | `design-end-solution` | 输出本端技术方案和改动点 |
| P0 | `draft-api-contract` | 形成跨端协作的接口协议 |
| P0 | `generate-task-packages` | 把方案固化成开发任务文档 |

### 10.4 Skill 依赖关系图

```text
detect-demand-type
   |
   +--> 新项目
   |      -> clarify-product-scope
   |      -> design-project-foundation
   |
   +--> 增量需求
   |      -> detect-delivery-mode
   |      -> detect-affected-repos
   |      -> assemble-workspace-context
   |
   +--> 混合型需求
          -> detect-affected-repos
          -> design-incremental-foundation-extension
          -> assemble-workspace-context

split-product-demand-by-end
   -> split-backend-by-capability-domain
   -> assemble-workspace-context
   -> design-end-solution
   -> draft-api-contract
   -> review-api-contract-consistency
   -> review-implementation-impact
   -> review-cross-end-solution
   -> generate-task-packages
   -> generate-self-test-checklist
   -> generate-integration-test-checklist
```

### 10.4.1 关键边界说明

为避免 skill 重叠，下面几组能力边界需要明确区分：

| skill | 负责的内容 | 不负责的内容 |
|---|---|---|
| `design-project-foundation` | 新项目的职责边界、工程拓扑、接口边界一体化设计 | 不负责增量需求的 repo 识别和局部改动面分析 |
| `detect-affected-repos` | 增量需求的 repo / service 级识别 | 不直接确认具体目录、模块和文件 |
| `design-incremental-foundation-extension` | 为混合型需求中的新增工程承载体做局部落位设计 | 不负责全量新项目的整体工程拓扑设计 |
| `assemble-workspace-context` | 按多人分端或全栈整包模式组装 workspace 上下文 | 不负责业务方案设计和接口设计判断 |
| `design-cross-end-integration` | 产出跨端依赖图、联调顺序、协同策略 | 不直接判断字段契约是否一致 |
| `review-api-contract-consistency` | 只检查协议字段、状态码、兼容性和契约冲突 | 不重新设计跨端依赖和联调顺序 |
| `review-cross-end-solution` | 作为评审门禁，确认方案是否能进入开发 | 不重新产出方案正文和协议草案 |
| `review-implementation-impact` | 在评审后做模块 / 目录级复核 | 不重新做 repo 级影响面识别 |
| `generate-task-packages` | 生成任务包，并带出 owner、依赖、串并行关系 | 不做运行中状态跟踪和变更后的二次重算 |

### 10.5 抽象原则

| 原则 | 说明 |
|---|---|
| 一个 skill 只做一件事 | 不要把识别、拆分、设计、评审、任务分配揉成一个超大 skill |
| 输入输出文档化 | 每个 skill 要明确读什么、产出什么 |
| 可单独重跑 | 例如只重跑接口协议，不必重跑需求拆分 |
| 同时适配两种模式 | 同时支持多人分端和全栈整包 |
| 先 skill 后编排层 | 先让能力边界稳定，再考虑上层流程编排 |

### 10.6 与 gstack 的对应关系

这些原子 skill 更偏：

- 需求工程化
- 多端拆分
- 文档与任务编排

而 gstack 仍然适合放在后续这些节点：

| 节点 | 更适合调用的 gstack 能力 |
|---|---|
| 产品 / 方案挑战 | `/plan-ceo-review` |
| 工程方案评审 | `/plan-eng-review` |
| 设计方案评审 | `/plan-design-review` |
| 代码实现后评审 | `/review` |
| 真实行为验证 | `/qa` |
| 发版收口 | `/ship` |

### 10.7 相对 gstack 多出来的能力

相对 gstack，这套系统额外强调的不是更多评审角色，而是更强的需求工程化、多端拆分和流程治理能力。

| 能力类别 | 这套系统新增或更强调的能力 | gstack 中的情况 |
|---|---|---|
| 需求类型分流 | `detect-demand-type`，显式区分 `new_project` / `incremental` / `hybrid` | gstack 更像统一 sprint 主线，没有显式三分流 |
| 多端需求拆分 | `split-product-demand-by-end`、`split-backend-by-capability-domain` | gstack 有 plan review，但不把多端拆分抽成核心能力 |
| 混合型需求处理 | `design-incremental-foundation-extension`，覆盖“存量改动 + 新工程创建” | gstack 没有显式建模这一类需求 |
| workspace 上下文组装 | `assemble-workspace-context`，显式处理多 repo / 多端 / 全栈整包上下文 | gstack 会读上下文，但没有把 workspace 组装抽成需求工程能力 |
| 工程影响分析 | `detect-affected-repos`、`review-implementation-impact` | gstack 会在 review / plan 中看影响面，但没有显式定义需求到工程映射能力 |
| 流程治理 | `sync-demand-doc-status`、`check-doc-consistency`、`track-delivery-status`、`detect-blockers-and-dependencies` | gstack 有部分治理动作，但没有抽成完整能力地图 |
| 变更控制 | `analyze-demand-change-impact`、`rebase-task-packages-on-change` | gstack 没有把需求变更重算显式能力化 |
| 发布反馈沉淀 | `summarize-release-impact` | gstack 有 `/retro`，但这里更强调把发布影响回写到需求工程链路 |

一句话总结：

```text
gstack 更强在角色化评审、QA 和 ship 闭环
这套系统更强在需求分流、多端拆分、工程落位、影响面分析和流程治理
```
