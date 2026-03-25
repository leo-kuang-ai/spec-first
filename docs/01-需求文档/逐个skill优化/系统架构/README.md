# Spec-First 系统架构规范

> 文档版本：2026-03-25
>
> 适用范围：`spec-first` 仓库当前代码实现与后续重构约束
>
> 目的：基于现有源码深度审查，给出一套可长期执行的理想架构规范与目录规范，避免“命令、流程、运行时、宿主适配、文档治理”继续交叉污染。

## 1. 结论先行

`spec-first` 当前不是单纯的 CLI 工具，也不是纯技能仓库，而是一个由以下几类能力共同组成的规范驱动研发引擎：

- CLI 命令入口
- Feature 生命周期状态机
- Skill 运行时与路由
- 质量门禁与追溯体系
- AI 编排与上下文恢复
- 工具集成与宿主适配
- 文档与产物治理

从代码看，系统已经形成了清晰的“入口层 + 核心能力层 + 共享层 + 项目资产层”骨架，但各层边界并不完全干净，主要问题集中在两点：

- `skill-runtime` 和 `ai-orchestrator` 内部混合了路由、策略、上下文投影、守卫、提示词拼装、恢复逻辑。
- `shared` 层已经开始反向依赖 `core` 的 ID 体系，说明基础层和领域层的依赖方向存在穿透风险。

因此，这份规范的目标不是重写系统，而是把现有实现收敛到一个更稳定的结构上：

1. CLI 只做命令入口和参数分发。
2. Core 只做可测试、可组合的业务能力。
3. Shared 只放最小公共原语和纯工具。
4. Skills、templates、specs、docs 作为独立资产层，不能被核心逻辑污染。

## 2. 现状架构审查

### 2.1 入口层已经基本成型

CLI 入口在 [`src/cli/index.ts`](/Users/kuang/xiaobu/spec-first/src/cli/index.ts) 中统一注册命令，再交给 [`src/cli/router.ts`](/Users/kuang/xiaobu/spec-first/src/cli/router.ts) 处理帮助、版本、参数校验和确认策略。

这套设计的优点是：

- 顶层命令定义集中，可读性高。
- `dispatch()` 统一处理错误和退出码。
- `requiresConfirmation` 机制把高风险命令显式化。

但它也有一个明显问题：

- `src/cli/index.ts` 逐个注册命令，已经接近“命令清单文件”，长期会变得臃肿。

### 2.2 Feature 生命周期以文件系统作为真源

Feature 状态主要由两个位置承载：

- `specs/<featureId>/stage-state.json`
- `.spec-first/current`

核心实现集中在 [`src/core/process-engine/feature.ts`](/Users/kuang/xiaobu/spec-first/src/core/process-engine/feature.ts) 和 [`src/core/process-engine/transition.ts`](/Users/kuang/xiaobu/spec-first/src/core/process-engine/transition.ts)。

这一层的设计是合理的：

- 状态文件是单一真源。
- Feature 列表、切换、读取都围绕 `specs/` 展开。
- 阶段迁移是显式状态变更，而不是隐式推断。

同时也要注意：

- [`src/core/process-engine/stage-machine.ts`](/Users/kuang/xiaobu/spec-first/src/core/process-engine/stage-machine.ts) 已明确定义 8 个业务阶段加 2 个终态。
- [`src/core/process-engine/advance.ts`](/Users/kuang/xiaobu/spec-first/src/core/process-engine/advance.ts) 已经标注为过渡实现，不应继续作为正式推进入口。

理想态应以 `transition.ts` 作为唯一 canonical 迁移入口。

### 2.3 Skill runtime 已经超出“渲染器”定位

[`src/core/skill-runtime/dispatcher.ts`](/Users/kuang/xiaobu/spec-first/src/core/skill-runtime/dispatcher.ts) 不只是命令分发器，它同时承担了：

- `spec-first:*` 路由解析
- skill / runtime 分流
- semantic map 映射
- review / verify 分层参数约束
- orchestrate 参数与背景输入治理
- prompt 和上下文注入前置判断

这意味着 `skill-runtime` 实际上是一个“策略层 + 路由层 + 上下文层 + 守卫层”的混合体，而不是单一职责模块。

理想态应该拆成四个明确子职责：

- 解析器：负责把命令和参数解析成结构化请求
- 选择器：负责判定走 skill 路由还是 runtime 路由
- 策略器：负责背景输入、风险级别、确认策略
- 渲染器：负责 prompt/context 组装

### 2.4 追溯、门禁、变更、度量已经形成能力簇

当前核心能力簇已经比较完整：

- 追溯：[`src/core/trace-engine/id-generator.ts`](/Users/kuang/xiaobu/spec-first/src/core/trace-engine/id-generator.ts)
- 门禁：[`src/core/gate-engine/gate-evaluator.ts`](/Users/kuang/xiaobu/spec-first/src/core/gate-engine/gate-evaluator.ts)
- 变更：[`src/core/change-mgr/rfc-machine.ts`](/Users/kuang/xiaobu/spec-first/src/core/change-mgr/rfc-machine.ts)
- 度量：[`src/core/metrics-engine/health-score.ts`](/Users/kuang/xiaobu/spec-first/src/core/metrics-engine/health-score.ts)
- 模板：[`src/core/template/renderer.ts`](/Users/kuang/xiaobu/spec-first/src/core/template/renderer.ts)
- 工具集成：[`src/core/tool-integration/hook-installer.ts`](/Users/kuang/xiaobu/spec-first/src/core/tool-integration/hook-installer.ts)

这些模块说明系统已经不是“单一流程引擎”，而是一个带治理能力的研发操作系统。

### 2.5 当前最需要收敛的结构性问题

1. `shared` 层不应依赖 `core` 的领域定义。
2. `skill-runtime` 不应同时承担路由、策略、上下文、守卫。
3. `ai-orchestrator` 不应同时承担调度、执行、恢复、检查点、告警、产物写入。
4. `cli/index.ts` 不应继续承受无限增长的命令注册表。
5. 过渡文件如 `advance.ts` 不应继续被外部入口依赖。

## 3. 理想架构规范

### 3.1 总体分层

理想架构建议保持现有仓库形态，但按“职责层”重新约束：

```text
用户 / 宿主 Agent
  ↓
CLI 入口层
  ↓
应用编排层
  ↓
核心领域层
  ↓
基础设施层
  ↓
项目资产层
```

### 3.2 各层职责

#### CLI 入口层

建议范围：

- `src/cli/index.ts`
- `src/cli/router.ts`
- `src/cli/commands/*`

职责：

- 命令注册
- 帮助与版本输出
- 参数校验
- 风险命令确认
- 命令到应用层的转发

禁止：

- 直接读写 `specs/` 的业务规则
- 直接做 Gate / Trace / Transition 的核心判断
- 直接拼装复杂 prompt 或上下文

#### 应用编排层

建议范围：

- `src/core/ai-orchestrator/*`
- `src/core/skill-runtime/*`
- `src/core/batch-executor/*`

职责：

- 组合多个领域能力完成单次工作流
- 决策下一步执行哪个核心能力
- 管理恢复、重试、自动循环、checkpoint
- 将上下文、风险、门禁、产物交给领域层处理

要求：

- 应用层只做流程编排，不做规则定义。
- 应用层可以有策略，但策略必须是可替换的、可测试的。

#### 核心领域层

建议范围：

- `src/core/process-engine/*`
- `src/core/trace-engine/*`
- `src/core/gate-engine/*`
- `src/core/change-mgr/*`
- `src/core/metrics-engine/*`
- `src/core/validators/*`
- `src/core/rules/*`

职责：

- 阶段状态与迁移
- 追溯 ID 和关系
- 门禁条件与判定
- RFC / Defect 状态管理
- 健康度与瓶颈分析
- 格式与一致性校验
- 真理源规则定义

要求：

- 领域层优先保持纯函数、显式输入输出、无 UI 依赖。
- 领域层不直接依赖 CLI。
- 领域层尽量不依赖宿主适配和外部命令。

#### 基础设施层

建议范围：

- `src/core/template/*`
- `src/core/tool-integration/*`
- `src/core/host-adapters/*`
- `src/core/migrations/*`
- `src/shared/*`
- `src/config/*`

职责：

- 文件系统读写
- 模板渲染
- 宿主适配
- Hook 安装
- 状态迁移
- 配置加载
- 通用工具

要求：

- 基础设施层只实现“怎么做”，不定义“应该做什么”。
- 基础设施层应通过接口向上层暴露能力。

#### 项目资产层

建议范围：

- `skills/`
- `templates/`
- `specs/`
- `docs/`
- `.spec-first/`

职责：

- skills：宿主可消费的工作流入口资产
- templates：模板源文件
- specs：Feature 状态、产物、追踪对象
- docs：知识沉淀与审查记录
- `.spec-first/`: 当前项目的运行时状态与本地配置

要求：

- 资产层不得混入核心逻辑。
- 资产层文件的变化必须可追踪、可审查、可回放。

## 4. 目录规范

### 4.1 仓库顶层目录规范

建议保留以下顶层目录角色：

```text
spec-first/
├── src/             # 源码，仅放实现
├── skills/          # 供宿主 agent 消费的 skill 资产
├── templates/       # 生成型模板
├── specs/           # Feature 运行时真源
├── docs/            # 文档与审查产物
├── tests/           # 测试
├── scripts/         # 操作性脚本
├── .spec-first/     # 项目级运行时状态
├── packages/        # 可选扩展包
└── website/         # 可选站点/展示层
```

### 4.2 `src/` 目录规范

#### `src/cli/`

职责只保留：

- 命令声明
- 参数路由
- help/version 输出
- CLI 级确认策略

建议子结构：

```text
src/cli/
├── index.ts
├── router.ts
├── parse-utils.ts
└── commands/
```

#### `src/core/`

建议按能力簇保留现有目录，但严格执行职责边界：

```text
src/core/
├── process-engine/
├── trace-engine/
├── gate-engine/
├── change-mgr/
├── ai-orchestrator/
├── metrics-engine/
├── tool-integration/
├── skill-runtime/
├── skill-integration/
├── template/
├── validators/
├── batch-executor/
├── migrations/
├── host-adapters/
├── rules/
└── task-plan/
```

推荐约束：

- 一个目录只表达一个能力簇。
- 一个能力簇尽量对外暴露一个稳定入口文件或少量入口文件。
- `index.ts` 只做 public API 汇总，不承载业务细节。

#### `src/shared/`

只允许放以下内容：

- `types`
- `logger`
- `fs` / `path` / `json` 等纯工具
- 配置 schema
- 不依赖业务语义的通用校验器

禁止内容：

- 领域状态机
- Gate 判定
- 路由选择
- Feature 生命周期逻辑

特别约束：

- `shared` 不应反向依赖 `core`。
- 若确需共享 ID 体系，应把 ID 规范抽象成真正的基础契约，而不是让 `shared/types.ts` 直接引用领域实现。

#### `src/config/`

只允许放：

- bootstrap manifest
- 启动级配置
- 与项目初始化直接相关的静态清单

#### `src/cli/commands/`

命名建议：

- 按能力分类，而不是按技术细节分类
- 例如：`lifecycle/`、`quality/`、`trace/`、`host/`、`skill/`

如果暂时不重构子目录，至少保持：

- 一个命令一个文件
- 文件名与命令名一致
- 命令处理函数导出名一致

### 4.3 `docs/` 目录规范

建议把文档分成四类：

```text
docs/
├── 01-需求文档/      # 需求、分析、方案
├── 02-技术方案/      # 架构、设计、实施
├── 03-开发任务/      # 任务拆解、清单
├── 04-审查报告/      # 审查、复盘、结论
├── 06-场景验证/      # 场景测试与验证
├── 07-用户文档/      # 使用手册
├── 09-项目梳理/      # 全局梳理与映射
└── 生成型索引/       # 若需要，集中索引入口
```

针对本次输出的目录 `docs/01-需求文档/逐个skill优化/系统架构/`，建议固定为：

- `README.md` 作为目录索引和总规范
- 若后续拆分子文档，再增加：
  - `architecture-review.md`
  - `directory-standard.md`
  - `module-boundary-standard.md`

### 4.4 `specs/` 目录规范

每个 Feature 目录必须具备：

- `stage-state.json`
- 当前阶段所需的正式产物
- 可回放的审计证据

禁止：

- 把通用工具脚本塞进 Feature 目录
- 把宿主安装文件塞进 Feature 目录
- 把临时调试产物长期保留为正式产物

### 4.5 `skills/` 和 `templates/` 目录规范

#### `skills/`

- 每个 skill 目录必须有明确的入口说明。
- skill 文件应尽量无状态，只描述如何调用系统能力。
- skill 不应直接承载大量实现逻辑。

#### `templates/`

- 只存模板源文件。
- 模板不应包含运行时控制流。
- 模板渲染逻辑必须在 `src/core/template/` 中完成。

## 5. 关键模块的理想职责定义

### 5.1 `process-engine`

理想职责：

- 管理 Feature 生命周期
- 定义合法阶段图
- 定义推进和取消语义
- 维护 `stage-state.json` 不变量

必须保留的特性：

- 终态不可逆
- 状态变更可追踪
- 时间线可校验

### 5.2 `skill-runtime`

理想职责：

- 解析 skill 命令
- 选择 skill / runtime 路由
- 拼装上下文
- 注入必需输入
- 控制 review / verify / orchestrate 等高风险场景策略

建议拆分边界：

- `dispatcher` 只做路由
- `policy` 只做判定
- `context` 只做上下文解析
- `prompt` 只做渲染

### 5.3 `ai-orchestrator`

理想职责：

- 运行 auto-loop
- 管理 checkpoint / resume / retry
- 处理上下文压缩与恢复
- 处理任务执行状态

禁止：

- 和 Feature 生命周期状态机耦合
- 把业务规则写死在调度器里

### 5.4 `gate-engine`

理想职责：

- Gate 条件注册
- Gate 条件评估
- Gate 历史记录
- 例外与豁免逻辑

要求：

- 规则必须可枚举
- 失败原因必须可解释
- 阻塞与 warning 必须区分

### 5.5 `trace-engine`

理想职责：

- ID 生成与校验
- 关系图构建
- 追踪搜索与覆盖率
- ID 类型与编号规则

要求：

- ID 体系必须是全局稳定契约
- 所有下游模块引用时都必须显式依赖该契约

### 5.6 `tool-integration` 与 `host-adapters`

理想职责：

- 屏蔽宿主差异
- 管理 hook 安装与清理
- 管理能力矩阵
- 把宿主命令适配成统一输入输出

要求：

- 宿主相关逻辑不得污染领域层
- 每个宿主适配器必须是可独立失效的

## 6. 依赖方向规范

### 6.1 正向依赖

建议依赖顺序：

```text
CLI
  -> 应用编排层
    -> 核心领域层
      -> 基础设施层
        -> 文件系统 / 外部工具
```

### 6.2 反向依赖禁止项

以下依赖应尽量消除：

- `shared -> core`
- `cli -> core` 之外的直接跨层调用
- `template -> core business`
- `skills -> src/core implementation`
- `docs -> runtime logic`

### 6.3 允许但应收敛的例外

如果短期无法完全消除反向依赖，必须满足：

- 有明确接口隔离
- 有单独文档解释原因
- 有迁移计划
- 有测试覆盖

## 7. 命名与文件规范

### 7.1 文件命名

- 统一使用 `kebab-case.ts`
- 一个文件一个明确主题
- 避免 `utils.ts`、`helpers.ts` 这类无边界命名

### 7.2 导出规范

- 核心模块优先 named export
- `index.ts` 只做聚合，不做业务实现
- 任何“过渡入口”都应标注 `@deprecated` 并给出替代路径

### 7.3 函数职责

单个函数应只处理一种语义：

- 解析
- 校验
- 读取
- 写入
- 判定
- 渲染
- 分发

禁止把以上职责混写在一个函数里。

## 8. 迁移与演进建议

如果后续要继续重构，建议按以下优先级推进：

1. 先冻结 `transition.ts` 为阶段迁移唯一入口。
2. 再拆 `skill-runtime/dispatcher.ts` 中的路由、策略、上下文、渲染职责。
3. 再把 `ai-orchestrator` 拆成调度、执行、恢复、守卫四个子层。
4. 最后清理 `shared` 对 `core` 的反向依赖。

## 9. 验收标准

当架构符合本规范时，应满足以下条件：

- CLI 入口不再承载业务逻辑。
- 领域层可在无 CLI 的情况下单元测试。
- `shared` 不再依赖业务实现。
- `skill-runtime` 的路由与策略可独立测试。
- `process-engine` 的状态迁移只有一个 canonical 实现。
- `specs/`、`skills/`、`templates/`、`docs/` 的边界清晰且稳定。

## 10. 结语

当前实现已经具备成为“规范驱动研发引擎”的骨架，但要真正进入可维护状态，必须把“能力”与“资产”、“路由”与“策略”、“状态”与“视图”彻底分开。

这份规范的核心不是让目录看起来更整齐，而是让每一层都只做自己该做的事：

- 命令只负责入口
- 引擎只负责规则
- 适配层只负责连接外部世界
- 文档只负责表达契约

只要这个边界成立，后续的技能优化、链路优化、门禁优化和宿主适配，都会变得可控得多。
