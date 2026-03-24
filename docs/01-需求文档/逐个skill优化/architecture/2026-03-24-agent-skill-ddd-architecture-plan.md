# Agent / Skill DDD 架构调整方案

## 目标

把当前 `spec-first` 从“skill、agent、runtime 混合实现”收敛成一个模块化单体：

```text
CLI / Skills / Viewer
        ↓
Application Use Cases
        ↓
Domain Contexts
        ↓
Infrastructure
```

目标不是拆成微服务，而是把职责边界重新切开，避免 `skill`、`agent`、`runtime`、`domain` 互相吞职责。

## 现状问题

### 1. `first` 的语义混乱

- `skills/spec-first/README.md` 把 `first` 描述成“项目认知 Skill”。
- `src/cli/commands/first.ts` 又把 CLI `first` 定义成“最小支撑层，只检查 runtime/docs 输出”。
- 结果是同一个词在 skill 层和 CLI 层表示两种不同职责。

### 2. `skill-runtime` 已经变成隐式策略层

- `src/core/skill-runtime/context-resolver.ts` 同时处理：
  - skill 输入契约
  - runtime 资产选择
  - fallback 策略
  - stage view 生成
  - summary / docs / none 的决策
- 这不是单纯的 runtime helper，而是一个混合了 policy + projection + contract 的核心策略引擎。

### 3. `ai-orchestrator` 混了调度、执行、守卫和状态存储

- `src/core/ai-orchestrator/auto-loop.ts` 同时包含：
  - 任务选择
  - 执行循环
  - checkpoint
  - retry
  - watchdog
  - slop / MCP 检查
- `src/core/ai-orchestrator/todo-runner.ts` 又继续承担状态机和持久化。
- 这会让编排层越来越像一个无法拆分的“大泥球”。

### 4. 目录层次没有按领域边界分区

- `src/core` 目前按技术命名多，按领域命名少。
- `skills/spec-first` 里既有流程契约，也有编排语义，入口与职责不够清晰。
- `specs/` 同时承载阶段状态、任务计划、发现、门禁历史和度量，但没有统一仓储边界。

## 目标分层

### 交互层

- `src/cli`
- `skills/spec-first`

职责：
- 参数解析
- 命令路由
- prompt 渲染
- skill 入口描述
- 产物呈现

禁止：
- 承担领域规则
- 承担复杂策略判断
- 承担状态机推进逻辑

### 应用层

建议收敛为：

- `feature-lifecycle`
- `cognition`
- `quality`
- `orchestration`
- `skill-delivery`

职责：
- 执行用例
- 协调领域对象
- 调用仓储和基础设施
- 组织多步流程

### 领域层

建议至少有 3 个核心上下文：

- `feature-lifecycle`
- `quality`
- `cognition`

职责：
- 阶段状态
- Gate / verify 规则
- 项目认知摘要与投影语义

### 基础设施层

职责：
- 文件系统读写
- Markdown / YAML / JSON 序列化
- prompt 模板装配
- viewer / host 集成
- 任务状态持久化

## 建议的限界上下文

### 1. `feature-lifecycle`

关注：
- Feature 初始化
- Stage 状态机
- 阶段推进
- 阶段取消
- 依赖与可推进性

建议承载文件：
- `src/core/process-engine/*`
- `src/cli/commands/init.ts` 的核心判断逻辑
- `src/cli/commands/stage.ts`
- `src/cli/commands/feature.ts` 的部分逻辑

### 2. `quality`

关注：
- Gate 条件
- 证据判定
- 文档健康
- 验收标准

建议承载文件：
- `src/core/gate-engine/*`
- `src/cli/commands/gate.ts`
- `src/cli/commands/verify.ts` 的决策部分

### 3. `cognition`

关注：
- `first`
- `summary`
- runtime 认知资产
- docs 投影与恢复

建议承载文件：
- `src/core/skill-runtime/first-*`
- `src/core/skill-runtime/context-resolver.ts` 的认知相关部分
- `src/cli/commands/first.ts`
- `src/cli/commands/status.ts` 的认知摘要读取部分

### 4. `orchestration`

关注：
- 多步任务调度
- auto-loop
- retry / watchdog
- todo 状态推进

建议承载文件：
- `src/core/ai-orchestrator/*`
- `src/cli/commands/orchestrate.ts`

### 5. `skill-delivery`

关注：
- skill prompt 装配
- skill 输入契约
- 输入上下文注入

建议承载文件：
- `src/core/skill-runtime/prompt-assembler.ts`
- `src/core/skill-runtime/skill-input-contracts.ts`
- `src/core/skill-runtime/skill-input-injector.ts`
- `src/cli/commands/skill.ts`

## 迁移顺序

### Phase 0: 冻结边界

目标：
- 先定义“谁负责什么”
- 不动行为

动作：
- 明确 `skill` 只负责入口、契约、产物格式
- 明确 `agent` 负责认知、推理、调度
- 明确 CLI/runtime 只负责执行、持久化、适配

验收：
- 文档中不再把 `skill` 写成“多 Agent 编排的实现者”
- `first` 的语义在 skill 与 CLI 层被清晰区分

### Phase 1: 拆 `skill-runtime`

目标：
- 把契约、上下文选择、投影生成拆开

动作：
- 从 `context-resolver.ts` 中拆出 skill 契约定义
- 分离 runtime 资产选择策略
- 分离 stage summary / docs projection 逻辑

验收：
- `skill-input-contracts` 只管契约
- `context-resolver` 不再同时承担多类策略
- `first` 认知逻辑可单独测试

### Phase 2: 拆 `ai-orchestrator`

目标：
- 把调度、执行、守卫、状态分开

动作：
- 将 `auto-loop.ts` 拆成：
  - 调度决策
  - 任务执行
  - 守卫检查
  - checkpoint / report
- 将 `todo-runner.ts` 收敛为状态存储与状态转换

验收：
- 任何单个文件都不再同时承担“循环 + 守卫 + 持久化”
- `orchestrate` 只做应用层协调，不做底层执行细节

### Phase 3: 收敛 `first`

目标：
- 把 `first` 从“混合认知+编排”改成“认知入口”

动作：
- 新项目入口继续由 `/spec`、`/design`、`/task` 承担
- `first` 只负责已有代码/脚手架后的项目认知补全
- `summary` 作为认知投影，而不是代码分析的唯一结果

验收：
- `first` 不再和新项目定义阶段抢入口
- `code` 可以推荐 `summary`，但不把它当成唯一前置

### Phase 4: 调整文档与目录索引

目标：
- 让文档结构和代码结构一致

动作：
- `skills/spec-first/README.md` 拆成：
  - 新项目定义
  - 已有项目认知
  - 执行与验证
- `AGENTS.md` 保留全局契约，但减少具体实现语义
- `skills/spec-first` 的 skill 说明只保留“入口 + 产物 + 约束”

验收：
- 用户通过目录索引就能看懂每个 skill 的边界
- 不需要读 runtime 代码才能理解职责划分

## 建议的代码映射

| 现有位置 | 建议去向 |
|---|---|
| `src/core/process-engine/*` | `feature-lifecycle` |
| `src/core/gate-engine/*` | `quality` |
| `src/core/ai-orchestrator/*` | `orchestration` |
| `src/core/skill-runtime/skill-input-contracts.ts` | `skill-delivery` |
| `src/core/skill-runtime/context-resolver.ts` | 拆分后分流到 `cognition` / `skill-delivery` |
| `src/core/skill-runtime/prompt-assembler.ts` | `skill-delivery` |
| `src/core/skill-runtime/skill-input-injector.ts` | `skill-delivery` |
| `src/cli/commands/first.ts` | `cognition` 入口 |
| `src/cli/commands/orchestrate.ts` | `orchestration` 入口 |
| `src/cli/commands/init.ts` | `feature-lifecycle` 入口 |

## 风险控制

- 不要一次性重构所有目录。
- 先拆边界，再迁移实现。
- 先移动职责最混的文件：
  - `context-resolver.ts`
  - `auto-loop.ts`
  - `todo-runner.ts`
  - `first.ts`
- 先保证测试覆盖，再做目录改名。
- 保留 CLI 兼容入口，避免用户命令断裂。

## 成功标准

- `skill`、`agent`、`runtime`、`domain` 的职责可以在文档和代码里一一对应。
- `first` 的语义不再双重。
- `context-resolver` 不再是隐式策略黑盒。
- `auto-loop` 不再同时承担调度、守卫和存储。
- 新项目定义链和已有项目认知链被清晰分离。

