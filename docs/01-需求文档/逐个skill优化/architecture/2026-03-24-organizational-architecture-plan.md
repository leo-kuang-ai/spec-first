# spec-first 组织架构优化方案

## 目标

只优化组织结构，不改功能、不改命令、不改协议、不改产物语义。

目标是把当前混在一起的 `skill`、`agent`、`runtime`、`domain` 职责拆清，让目录结构本身就能表达系统分层。

## 现状问题

当前项目存在三类混合：

1. `skills/spec-first` 里同时放了技能目录、全局 agent 规则、共享约束和参考文档。
2. `src/core` 里同时放了领域规则、运行时策略、AI 编排和输入契约。
3. `first` 在 skill、CLI、runtime 三层里都有语义，读者很容易误判。

这不是功能错误，而是组织结构没有把职责边界表达清楚。

## 组织原则

### 1. skill 只负责入口与契约

- 触发条件
- 输入要求
- 输出产物
- 降级规则
- 用户可见的工作流说明

### 2. agent 只负责认知与推理

- 项目理解
- 上下文收集
- 方案比较
- 多步调度
- 不确定性收敛

### 3. runtime 只负责执行与持久化

- 文件读写
- 状态存储
- 运行时校验
- 模板渲染
- 宿主适配

### 4. domain 只负责规则与状态

- 阶段状态
- Gate 规则
- 认知投影语义
- 任务依赖与生命周期

## 现状目录图

```text
spec-first/
├── AGENTS.md
├── README.md
├── skills/
│   └── spec-first/
│       ├── README.md
│       ├── AGENTS.md
│       ├── SHARED.md
│       ├── 00-first/
│       │   ├── SKILL.md
│       │   └── references/
│       ├── 01-init/
│       ├── 02-catchup/
│       ├── 03-spec/
│       ├── 04-design/
│       ├── 05-research/
│       ├── 06-task/
│       ├── 07-code/
│       ├── 08-review/
│       ├── 10-archive/
│       ├── 11-plan/
│       ├── 12-verify/
│       ├── 13-orchestrate/
│       ├── 14-status/
│       ├── 15-doctor/
│       ├── 16-sync/
│       ├── 17-feature/
│       ├── focus-requirements/
│       ├── 20-spec-review/
│       ├── 21-analyze/
│       └── references/
├── src/
│   ├── cli/
│   ├── core/
│   │   ├── skill-runtime/
│   │   ├── ai-orchestrator/
│   │   ├── process-engine/
│   │   ├── gate-engine/
│   │   ├── batch-executor/
│   │   ├── metrics-engine/
│   │   └── ...
│   ├── shared/
│   └── config/
├── specs/
└── docs/
```

## 目标目录图

```text
spec-first/
├── AGENTS.md                     # 全局 agent policy
├── README.md                     # 项目总入口
├── skills/
│   └── spec-first/
│       ├── README.md             # skill 索引与导航
│       ├── AGENTS.md             # skill 共享约束
│       ├── SHARED.md             # 跨 skill 共享规则
│       ├── 00-first/
│       │   ├── SKILL.md
│       │   └── references/
│       ├── 01-init/
│       ├── 02-catchup/
│       ├── 03-spec/
│       ├── 04-design/
│       ├── 05-research/
│       ├── 06-task/
│       ├── 07-code/
│       ├── 08-review/
│       ├── 10-archive/
│       ├── 11-plan/
│       ├── 12-verify/
│       ├── 13-orchestrate/
│       ├── 14-status/
│       ├── 15-doctor/
│       ├── 16-sync/
│       ├── 17-feature/
│       ├── focus-requirements/
│       ├── 20-spec-review/
│       ├── 21-analyze/
│       └── references/
├── src/
│   ├── cli/                      # 命令适配层
│   ├── core/
│   │   ├── domain/
│   │   │   ├── feature-lifecycle/
│   │   │   ├── quality/
│   │   │   └── cognition/
│   │   ├── application/
│   │   │   ├── orchestration/
│   │   │   └── use-cases/
│   │   ├── infrastructure/
│   │   │   ├── skill-delivery/
│   │   │   ├── persistence/
│   │   │   └── host-integration/
│   │   └── shared/
│   ├── config/
│   └── shared/
├── specs/
│   └── <featureId>/
│       ├── stage-state.json
│       ├── spec.md
│       ├── design.md
│       ├── task_plan.md
│       ├── findings.md
│       ├── gate-history.jsonl
│       └── ...
└── docs/
    ├── 01-需求文档/
    │   └── 逐个skill优化/
    │       └── architecture/
    └── reference/
```

## 分区说明

### `skills/spec-first`

保留为技能包，不再承载运行时策略实现。

建议只放：
- `README.md`：目录索引
- `AGENTS.md`：全局 agent 规则
- `SHARED.md`：跨 skill 共享约束
- 各 skill 目录：各自契约和参考文档

不建议放：
- 复杂运行时实现说明
- 领域状态机语义
- 大段 CLI 命令实现细节

### `src/core/domain`

按业务规则组织，而不是按技术杂物组织。

建议子域：
- `feature-lifecycle`
- `quality`
- `cognition`

### `src/core/application`

放应用编排、用例协调和任务驱动逻辑。

建议子域：
- `orchestration`
- `use-cases`

### `src/core/infrastructure`

放文件系统、模板、宿主、持久化和输入注入。

建议子域：
- `skill-delivery`
- `persistence`
- `host-integration`

## 优化顺序

### 第一步：先改目录语义，不改逻辑

- 新建目标目录
- 维持旧目录可用
- 先不要做大规模文件移动

### 第二步：先收口最混的边界

优先处理：
- `skills/spec-first/README.md`
- `skills/spec-first/AGENTS.md`
- `src/core/skill-runtime/context-resolver.ts`
- `src/core/ai-orchestrator/auto-loop.ts`
- `src/core/ai-orchestrator/todo-runner.ts`
- `src/cli/commands/first.ts`

### 第三步：逐步迁移实现

- 先迁移命名和归属
- 再迁移模块拆分
- 最后才考虑符号重命名

## 不变项

本次方案明确不改变：
- 命令名
- skill 行为
- 输出格式
- runtime 协议
- 门禁规则
- 测试语义

## 成功标准

- 目录结构能直接反映职责边界
- skill / agent / runtime / domain 不再混读
- `first` 的语义可从目录位置一眼看懂
- 代码迁移前，文档就能先把组织关系讲清楚

