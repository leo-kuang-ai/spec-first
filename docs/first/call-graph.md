# Spec-First 模块调用关系图

> 生成时间: 2026-03-25
> 数据源: `.spec-first/runtime/first/structure-overview.json`, `.spec-first/runtime/first/critical-flows.json`

本文档使用 ASCII 文本图展示模块间调用关系与依赖方向。

---

## 整体架构分层

```
+------------------------------------------------------------------+
|                          CLI Layer                                |
|  src/cli/                                                         |
|  - index.ts (命令注册)                                            |
|  - router.ts (路由分发)                                           |
|  - commands/ (27 个命令实现)                                      |
+------------------------------------------------------------------+
                               |
                               | 调用
                               v
+------------------------------------------------------------------+
|                        Core Layer                                 |
|  src/core/                                                        |
|  +----------------------------------------------------------+    |
|  | process-engine/  (阶段状态机)                             |    |
|  | - stage-machine.ts  - advance.ts  - init.ts  - feature.ts |    |
|  +----------------------------------------------------------+    |
|                               |                                   |
|                               v                                   |
|  +----------------------------------------------------------+    |
|  | gate-engine/  (质量门禁)                                  |    |
|  | - gate-evaluator.ts  - condition-registry.ts              |    |
|  +----------------------------------------------------------+    |
|                               |                                   |
|                               v                                   |
|  +----------------------------------------------------------+    |
|  | trace-engine/  (追溯 ID)                                  |    |
|  | - id-generator.ts  - id-validator.ts  - id-taxonomy.ts    |    |
|  +----------------------------------------------------------+    |
|                               |                                   |
|                               v                                   |
|  +----------------------------------------------------------+    |
|  | skill-runtime/  (Skill 分发)                              |    |
|  | - dispatcher.ts  - prompt-assembler.ts  - hard-gate.ts    |    |
|  +----------------------------------------------------------+    |
|                               |                                   |
|                               v                                   |
|  +----------------------------------------------------------+    |
|  | ai-orchestrator/  (自动循环)                              |    |
|  | - auto-loop.ts  - catchup.ts  - todo-runner.ts            |    |
|  +----------------------------------------------------------+    |
|                               |                                   |
|                               v                                   |
|  +----------------------------------------------------------+    |
|  | 其他 core 模块:                                           |    |
|  | - change-mgr/  - template/  - tool-integration/            |    |
|  | - metrics-engine/  - validators/  - task-plan/             |    |
|  | - rules/  - batch-executor/  - migrations/                 |    |
|  +----------------------------------------------------------+    |
+------------------------------------------------------------------+
                               |
                               | 依赖
                               v
+------------------------------------------------------------------+
|                        Shared Layer                               |
|  src/shared/                                                      |
|  - types.ts (Stage/ExitCode/ID types)                            |
|  - logger.ts  - fs-utils.ts  - host-paths.ts                     |
+------------------------------------------------------------------+
```

---

## CLI 入口到命令执行

```
                        +-----------------+
                        |   src/cli/      |
                        |  index.ts:95    |
                        |  dispatch()     |
                        +--------+--------+
                                 |
                                 v
                        +--------+--------+
                        |   router.ts:78  |
                        |   dispatch()    |
                        +--------+--------+
                                 |
                                 v
                        +--------+--------+
                        | commands.get()  |
                        | 查找命令注册     |
                        +--------+--------+
                                 |
                 +---------------+---------------+
                 |               |               |
                 v               v               v
          +------+------+ +------+------+ +------+------+
          | init.ts     | | transition.ts| | gate.ts    |
          | handleInit()| | handleTrans()| | handleCheck|
          +-------------+ +-------------+ +------------+
```

**证据**: `src/cli/index.ts:95-96`, `src/cli/router.ts:78-121`, `src/cli/router.ts:111`

---

## Feature 初始化核心链

```
+-------------------+     +---------------------+     +-------------------+
| init.ts:612       | --> | init.ts:758         | --> | process-engine/   |
| handleInit()      |     | runFeatureInitTrack |     | init.ts:928       |
+-------------------+     +---------------------+     +--------+----------+
                                                               |
                                                               v
                                                     +--------+----------+
                                                     | init.ts:959       |
                                                     | writeFeatureSkeleton|
                                                     +--------+----------+
                                                               |
                                                               v
                                                     +--------+----------+
                                                     | init.ts:961       |
                                                     | commitFeatureInit |
                                                     +-------------------+
```

**证据**: `src/cli/commands/init.ts:612-830`, `src/core/process-engine/init.ts:928-982`

---

## Stage 推进链

```
+-------------------+     +-------------------+     +-------------------+
| transition.ts:24  | --> | advance.ts:59     | --> | advance.ts:67     |
| handleTransition()|     | advance()         |     | loadState()       |
+-------------------+     +-------------------+     +-------------------+
                                    |
                                    v
                          +--------+----------+
                          | advance.ts:74     |
                          | checkReadiness()  |
                          +--------+----------+
                                    |
                                    v
                          +--------+----------+
                          | advance.ts:87     |
                          | applyTransition() |
                          +--------+----------+
                                    |
                                    v
                          +--------+----------+
                          | advance.ts:88     |
                          | saveState()       |
                          +-------------------+
```

**证据**: `src/cli/commands/transition.ts:9-45`, `src/core/process-engine/advance.ts:59-100`

---

## Gate 评估链

```
+-------------------+     +------------------------+     +-------------------+
| gate.ts:71        | --> | gate-evaluator.ts:57   | --> | gate-evaluator.ts:68|
| handleCheck()     |     | evaluateGate()         |     | getConditions()    |
+-------------------+     +------------------------+     +-------------------+
                                                                     |
                                                                     v
                                                           +--------+----------+
                                                           | gate-evaluator.ts:73|
                                                           | def.evaluate(ctx)   |
                                                           +--------+----------+
                                                                    |
                                                      +-------------+-------------+
                                                      |                           |
                                                      v                           v
                                            +--------+----------+        +--------+----------+
                                            | condition-        |        | command-gate.ts:294|
                                            | registry.ts       |        | runCommandGate()   |
                                            +-------------------+        +-------------------+
```

**证据**: `src/cli/commands/gate.ts:71-151`, `src/core/gate-engine/gate-evaluator.ts:57-133`, `src/core/gate-engine/command-gate.ts:294-297`

---

## Skill 分发到渲染链

```
+----------------------+     +----------------------+     +-------------------+
| dispatcher.ts:260    | --> | dispatcher.ts:319    | --> | dispatcher.ts:419 |
| dispatchCommand()    |     | resolveSkillPath()   |     | loadSkill()       |
+----------------------+     +----------------------+     +--------+----------+
                                                                  |
                                                                  v
                                                       +----------+-----------+
                                                       | prompt-assembler.ts  |
                                                       | :177 assemblePrompt()|
                                                       +----------+-----------+
                                                                  |
                                                                  v
                                                       +----------+-----------+
                                                       | context-resolver.ts  |
                                                       | resolveSkillContext()|
                                                       +---------------------+
```

**证据**: `src/core/skill-runtime/dispatcher.ts:260-344`, `src/core/skill-runtime/dispatcher.ts:419-570`, `src/core/skill-runtime/prompt-assembler.ts:177-184`

---

## 模块依赖图

```
                        +-------------------+
                        |    cli/           |
                        | (入口层)           |
                        +--------+----------+
                                 |
         +-----------------------+-----------------------+
         |           |           |           |           |
         v           v           v           v           v
   +-----+----+ +----+-----+ +----+-----+ +----+-----+ +----+-----+
   | process- | | skill-   | | gate-    | | trace-   | | change-  |
   | engine   | | runtime  | | engine   | | engine   | | mgr      |
   +-----+----+ +----+-----+ +----+-----+ +----+-----+ +----+-----+
         |           |           |           |           |
         +-----------+-----------+-----------+-----------+
                                 |
                                 v
                        +--------+----------+
                        |    shared/        |
                        |   types.ts        |
                        | (Stage, ExitCode, |
                        |  FeatureState)    |
                        +-------------------+

                        +-------------------+
                        |    rules/         |
                        | truth-source.ts   |
                        | (独立规则层)       |
                        +-------------------+

                        +-------------------+
                        |    template/      |
                        | renderer.ts       |
                        | (独立渲染层)       |
                        +-------------------+
```

---

## 高风险区域标注

```
  +============================================================================+
  ||                        HIGH RISK AREAS                                   ||
  +============================================================================+

  [1] src/shared/types.ts
      +------------------------------------------------------------------+
      | 风险: Stage 枚举、ID 体系变更会影响所有 core 模块                 |
      | 影响: 全局                                                        |
      | 调用方: ALL core modules                                          |
      | 证据: src/shared/types.ts:9-84                                   |
      +------------------------------------------------------------------+

  [2] src/core/rules/truth-source.ts
      +------------------------------------------------------------------+
      | 风险: Gate 真理源规则变更影响 stage advance 逻辑                  |
      | 影响: 流程控制                                                    |
      | 调用方: gate-engine, process-engine                               |
      | 证据: src/core/rules/truth-source.ts:1-76                        |
      +------------------------------------------------------------------+

  [3] src/core/trace-engine/id-taxonomy.ts
      +------------------------------------------------------------------+
      | 风险: ID 类型体系变更影响追溯链和覆盖率计算                       |
      | 影响: 追溯系统                                                    |
      | 调用方: trace-engine, validators, metrics-engine                  |
      | 证据: src/core/trace-engine/id-taxonomy.ts:6-52                  |
      +------------------------------------------------------------------+

  [4] src/core/skill-runtime/dispatcher.ts
      +------------------------------------------------------------------+
      | 风险: Skill 分发逻辑变更影响所有 Skill 执行                       |
      | 影响: Skill 系统                                                  |
      | 调用方: cli/commands, ai-orchestrator                             |
      | 证据: src/core/skill-runtime/dispatcher.ts:260-570               |
      +------------------------------------------------------------------+

  [5] src/core/process-engine/stage-machine.ts
      +------------------------------------------------------------------+
      | 风险: 阶段转换规则变更影响 Feature 生命周期                       |
      | 影响: 流程控制                                                    |
      | 调用方: process-engine/advance, cli/commands/stage                |
      | 证据: src/core/process-engine/stage-machine.ts:7-16              |
      +------------------------------------------------------------------+
```

---

## 依赖方向总结

```
                    +-------------------+
                    |    src/config/    |
                    | (配置层，独立)     |
                    +-------------------+

                    +-------------------+
                    |    src/shared/    | <--- [例外: id-taxonomy.ts 被 shared/types.ts 依赖]
                    |   (工具层)         |
                    +---------+---------+
                              ^
                              |
                              | 依赖方向
                              |
+-----------------------------+-----------------------------+
|                                                           |
|                       src/core/                           |
|  (业务逻辑层，模块间可横向依赖，不依赖 cli)                |
|                                                           |
+-----------------------------+-----------------------------+
                              ^
                              |
                              | 调用
                              |
                    +---------+---------+
                    |    src/cli/       |
                    |   (入口层)         |
                    +-------------------+
```

**依赖规则**:

1. **ESM only** - 全项目 `type: module`，使用 `import/export`
2. **Named exports only** - core 模块禁止使用 default export
3. **Types centralized** - Stage/ExitCode/ID types 集中于 `src/shared/types.ts`
4. **模块边界**:
   - `cli`: 入口层，依赖 core 和 shared，不向上依赖
   - `core`: 业务逻辑层，模块间可横向依赖，不依赖 cli
   - `shared`: 工具层，仅依赖 `src/core/trace-engine/id-taxonomy.ts`，无其他业务依赖

---

## 循环依赖风险

| 模块对 | 风险描述 | 严重程度 | 建议 |
|--------|----------|----------|------|
| skill-runtime ↔ gate-engine | skill-runtime 调用 gate-engine 进行 hard-gate 校验，gate-engine 可能需要 skill 信息 | Medium | 通过 shared/types 或 rules 模块解耦 |

**证据**: `src/core/skill-runtime/dispatcher.ts`, `src/core/gate-engine/gate-evaluator.ts`

---

## 核心模块导出清单

| 模块 | 路径 | 关键导出 |
|------|------|----------|
| process-engine | `src/core/process-engine/` | `TRANSITIONS`, `getNextStages`, `isTerminal`, `advance`, `init` |
| skill-runtime | `src/core/skill-runtime/` | `dispatchCommand`, `SEMANTIC_MAP`, `RUNTIME_COMMANDS`, `loadSkill` |
| gate-engine | `src/core/gate-engine/` | `evaluateGate`, `getConditions`, `getGateHistory` |
| trace-engine | `src/core/trace-engine/` | `nextId`, `validateAbbr`, `searchId`, `collectKnownIds` |
| ai-orchestrator | `src/core/ai-orchestrator/` | `runAutoLoop`, `catchup`, `buildContextPack` |
| change-mgr | `src/core/change-mgr/` | `createRfc`, `transitionRfc`, `registerDefect` |
| rules | `src/core/rules/` | `RELEASE_REQUIRED_ARTIFACTS`, `PRIMARY_STAGE_SKILL` |

**证据**: `src/core/process-engine/stage-machine.ts:1-50`, `src/core/skill-runtime/dispatcher.ts:1-200`, `src/core/gate-engine/gate-evaluator.ts:1-100`
