# 调用链分析

> **模式**: deep
> **生成时间**: 2026-03-09
> **分析范围**: CLI 命令执行、Skill 分发、阶段状态机

---

## 1. CLI 命令执行流程

### 1.1 入口到路由分发

```mermaid
sequenceDiagram
    participant User
    participant CLI as cli/index.ts
    participant Router as cli/router.ts
    participant Handler as cli/commands/*

    User->>CLI: spec-first <command> [args]
    CLI->>CLI: registerCommand() 注册所有命令
    CLI->>Router: dispatch(process.argv.slice(2))
    Router->>Router: 解析命令名和参数

    alt 帮助或版本
        Router->>Router: printHelp() / printVersion()
        Router-->>User: 输出帮助信息
    else 未知命令
        Router-->>User: 错误：未知命令
    else 已注册命令
        Router->>Router: 检查 requiresConfirmation
        alt 需要确认且无 --yes
            Router->>Router: resolveConfirmPolicy()
            Router-->>User: 错误：需要 --yes 确认
        else 确认通过
            Router->>Handler: entry.handler(subArgs)
            Handler-->>Router: ExitCode
            Router-->>CLI: ExitCode
            CLI-->>User: process.exit(code)
        end
    end
```

**证据源**:
- `src/cli/index.ts:83` - `dispatch(process.argv.slice(2))`
- `src/cli/router.ts:68-105` - `dispatch()` 函数实现
- `src/cli/router.ts:28-35` - `registerCommand()` 注册逻辑

---

## 2. Skill 分发流程（三层路由）

### 2.1 Skill 命令解析与路由

```mermaid
sequenceDiagram
    participant User
    participant Dispatcher as skill-runtime/dispatcher.ts
    participant Resolver as resolveSkillPath()
    participant Loader as loadSkill()
    participant Runtime as Skill Runtime

    User->>Dispatcher: /spec-first:skillName [args]
    Dispatcher->>Dispatcher: dispatchCommand(input, projectRoot)

    alt 语义映射命中
        Dispatcher->>Dispatcher: SEMANTIC_MAP 查找
        Note over Dispatcher: 例: "rfc approve" → "rfc transition approved"
        Dispatcher-->>Runtime: route='runtime', command, args
    else Runtime 命令
        Dispatcher->>Dispatcher: RUNTIME_COMMANDS.has(skillName)
        Note over Dispatcher: id, matrix, stage, rfc, defect, etc.
        Dispatcher-->>Runtime: route='runtime', command, args
    else Skill 路由
        Dispatcher->>Resolver: resolveSkillPath(skillName, projectRoot)

        alt Extension Skill
            Resolver->>Resolver: parseExtensionSkillName()
            Resolver->>Resolver: 查找 ext.skillsDir
        else 项目本地 Skill
            Resolver->>Resolver: 查找 skills/spec-first/NN-name/
        else 包级 Skill
            Resolver->>Resolver: 查找包内 skills/spec-first/
        end

        Resolver-->>Dispatcher: skillPath

        alt Skill 找到
            Dispatcher->>Dispatcher: validateLayerArgs()
            alt skillName === 'orchestrate'
                Dispatcher->>Dispatcher: validateOrchestrateArgs()
                Dispatcher->>Dispatcher: resolveOrchestrateBackgroundGuidance()
            else skillName === 'first'
                Dispatcher->>Dispatcher: validateFirstArgs()
                Dispatcher->>Dispatcher: resolveFirstConfirmPolicy()
            end
            Dispatcher-->>Runtime: route='skill', skillPath, args
        else Skill 未找到
            Dispatcher-->>Runtime: route='error', SKILL_NOT_FOUND
        end
    end
```

**证据源**:
- `src/core/skill-runtime/dispatcher.ts:219-326` - `dispatchCommand()` 主流程
- `src/core/skill-runtime/dispatcher.ts:41-47` - `SEMANTIC_MAP` 语义映射表
- `src/core/skill-runtime/dispatcher.ts:50-54` - `RUNTIME_COMMANDS` 集合
- `src/core/skill-runtime/dispatcher.ts:332-362` - `resolveSkillPath()` 三层查找

### 2.2 Skill 加载与增强

```mermaid
sequenceDiagram
    participant Runtime
    participant Loader as loadSkill()
    participant Template as loadSkillTemplate()
    participant Assembler as assemblePrompt()
    participant Guards as Hard Gate & Scope Guard
    participant Notices as Runtime Notices

    Runtime->>Loader: loadSkill(skillPath, options)
    Loader->>Template: loadSkillTemplate(skillPath)
    Template->>Template: 读取 SKILL.md
    Template->>Template: 合并 SHARED.md（如有）
    Template-->>Loader: content

    Loader->>Loader: ensureNextStepsPolicy(content)
    Note over Loader: 确保包含 Next Steps 章节

    alt enableAssembly
        Loader->>Assembler: assemblePrompt(content, ctx)
        Assembler->>Assembler: 动态变量替换
        Assembler-->>Loader: assembled content
    end

    Loader->>Loader: validateKvCacheStability()
    alt KV-Cache 不稳定 && hard_gate
        Loader-->>Runtime: throw KV-CACHE-HARD-GATE
    end

    Loader->>Guards: evaluateSkillHardGate(skillName)
    alt Hard Gate BLOCKED
        Loader-->>Runtime: throw HardGateBlockedError
    end

    Loader->>Guards: evaluateRuntimeScopeGuard(skillName)
    alt Scope Guard blocked
        Loader-->>Runtime: throw ScopeGuardBlockedError
    end

    Loader->>Notices: buildScopeGuardRuntimeNotice()
    Loader->>Notices: buildHardGateRuntimeNotice()

    alt skillName 特定通知
        Loader->>Notices: buildFirstRuntimeNotice() / buildOrchestrateRuntimeNotice() / etc.
        Note over Notices: first, orchestrate, onboarding, spec, design, task, code, review, plan, verify, spec-review
    end

    Loader->>Loader: 前置注入所有 notices
    Loader-->>Runtime: enhanced content
```

**证据源**:
- `src/core/skill-runtime/dispatcher.ts:384-511` - `loadSkill()` 完整流程
- `src/core/skill-runtime/dispatcher.ts:942-959` - `loadSkillTemplate()` 模板加载
- `src/core/skill-runtime/dispatcher.ts:60-70` - `ensureNextStepsPolicy()` 策略注入
- `src/core/skill-runtime/dispatcher.ts:413-421` - Hard Gate 校验
- `src/core/skill-runtime/dispatcher.ts:418-421` - Scope Guard 校验
- `src/core/skill-runtime/dispatcher.ts:433-510` - 各 Skill 专属 Runtime Notice 构建

---

## 3. 阶段状态机流程

### 3.1 阶段推进（stage advance）

```mermaid
sequenceDiagram
    participant User
    participant StageCmd as cli/commands/stage.ts
    participant Advance as process-engine/advance.ts
    participant Machine as process-engine/stage-machine.ts
    participant DepCheck as dependency-checker.ts
    participant Gate as gate-engine/gate-evaluator.ts
    participant State as stage-state.json

    User->>StageCmd: spec-first stage advance <featureId>
    StageCmd->>Advance: advance(featureId, projectRoot)

    Advance->>Advance: resetConfigCache()
    Advance->>Advance: loadState(featureId, projectRoot)
    Advance->>State: 读取 stage-state.json
    State-->>Advance: StageState

    Advance->>Machine: isTerminal(from)
    alt 已是终态
        Advance-->>User: 错误：已处于终态
    end

    Advance->>Advance: nextStageInChain(from)
    Note over Advance: 获取下一阶段

    Advance->>Machine: assertTransitionAllowed(from, to)
    alt 转换非法
        Machine-->>Advance: throw TransitionError
    end

    Advance->>DepCheck: checkDependencies(featureId, to, projectRoot)
    DepCheck-->>Advance: { pass, missing }
    alt 依赖检查失败
        Advance->>Advance: appendFindings()
        Advance-->>User: throw GateFailedError
    end

    Advance->>Gate: evaluateGate(featureId, projectRoot)
    Gate-->>Advance: { status }

    alt Gate FAIL
        Advance-->>User: throw GateFailedError
    else Gate 异常
        alt pilot_mode=true
            Advance->>Advance: gateResult='PILOT_PASS'
            Advance->>Advance: appendFindings()
        else pilot_mode=false
            Advance-->>User: throw GateUnavailableError
        end
    else Gate PASS
        Advance->>Advance: gateResult='PASS'
    end

    Advance->>Advance: 更新 state.currentStage = to
    Advance->>Advance: state.history.push(entry)
    Advance->>Machine: isTerminal(to)
    Machine-->>Advance: terminal flag
    Advance->>Advance: state.terminal = terminal

    Advance->>State: saveState()
    Advance->>Advance: writeLog(gate-history.jsonl)

    alt from === Stage.DESIGN
        Advance->>Advance: syncAgentContextFromDesign()
        Advance->>Advance: appendFindings()
    end

    Advance-->>StageCmd: { from, to, gateResult }
    StageCmd-->>User: 已推进：from → to
```

**证据源**:
- `src/cli/commands/stage.ts:189-217` - `handleAdvance()` 入口
- `src/core/process-engine/advance.ts:107-205` - `advance()` 完整流程
- `src/core/process-engine/stage-machine.ts:30-38` - `assertTransitionAllowed()` 转换校验
- `src/core/process-engine/advance.ts:126-133` - 依赖检查逻辑
- `src/core/process-engine/advance.ts:135-173` - Gate 校验与降级策略
- `src/core/process-engine/advance.ts:194-202` - Design 阶段特殊处理

### 3.2 阶段状态机转换规则

```mermaid
stateDiagram-v2
    [*] --> 00_init
    00_init --> 01_specify
    01_specify --> 02_design
    02_design --> 03_plan
    03_plan --> 04_implement
    04_implement --> 05_verify
    05_verify --> 06_wrap_up
    06_wrap_up --> 07_release
    07_release --> 08_done
    08_done --> [*]

    00_init --> 09_cancelled
    01_specify --> 09_cancelled
    02_design --> 09_cancelled
    03_plan --> 09_cancelled
    04_implement --> 09_cancelled
    05_verify --> 09_cancelled
    06_wrap_up --> 09_cancelled
    07_release --> 09_cancelled
    09_cancelled --> [*]

    note right of 08_done: 终态（不可逆）
    note right of 09_cancelled: 终态（不可逆）
```

**证据源**:
- `src/core/process-engine/stage-machine.ts:8-17` - `TRANSITIONS` 转换表定义
- `src/shared/types.ts` - `Stage` 枚举定义
- `src/core/process-engine/stage-machine.ts:41-44` - `isTerminal()` 终态判断

---

## 4. Orchestrate 编排流程

### 4.1 Orchestrate 命令执行

```mermaid
sequenceDiagram
    participant User
    participant OrchestrateCmd as cli/commands/orchestrate.ts
    participant ArgsValidator as orchestrate-args.ts
    participant AutoLoop as ai-orchestrator/auto-loop.ts
    participant Decider as next-step-decider.ts
    participant Advance as advance.ts

    User->>OrchestrateCmd: spec-first orchestrate [--auto] [--auto-advance]
    OrchestrateCmd->>OrchestrateCmd: resetConfigCache()
    OrchestrateCmd->>ArgsValidator: validateOrchestrateArgs(args)
    ArgsValidator-->>OrchestrateCmd: { mode, autoAdvance, resume }

    OrchestrateCmd->>OrchestrateCmd: resolveFeatureOrCurrent()

    alt mode === 'auto' && executor 存在
        OrchestrateCmd->>AutoLoop: runAutoLoop({ featureId, projectRoot, args, executor })
        AutoLoop->>AutoLoop: 执行任务循环
        AutoLoop-->>OrchestrateCmd: { status, haltReason }
        OrchestrateCmd->>OrchestrateCmd: 输出 auto_loop_status
    end

    OrchestrateCmd->>OrchestrateCmd: getFeatureState(featureId)
    OrchestrateCmd->>Decider: decideNextStep({ currentStage, stageStatus, ... })
    Decider-->>OrchestrateCmd: { decision, suggestedCommand, reasons }

    OrchestrateCmd->>OrchestrateCmd: printDecision()

    alt autoAdvance && (READY_TO_ADVANCE || AUTO_ADVANCE)
        OrchestrateCmd->>Advance: advance(featureId, projectRoot)
        Advance-->>OrchestrateCmd: { from, to, gateResult }
        OrchestrateCmd->>OrchestrateCmd: 输出推进结果
    end

    OrchestrateCmd-->>User: ExitCode.SUCCESS
```

**证据源**:
- `src/cli/commands/orchestrate.ts:52-112` - `handleOrchestrate()` 完整流程
- `src/core/skill-runtime/orchestrate-args.ts` - `validateOrchestrateArgs()` 参数校验
- `src/cli/commands/orchestrate.ts:64-74` - Auto Loop 执行分支
- `src/cli/commands/orchestrate.ts:92-97` - Auto Advance 执行分支

---

## 5. 关键数据流

### 5.1 Feature 状态数据流

```
specs/<featureId>/
├── stage-state.json          ← 阶段状态（currentStage, history, terminal）
├── gate-history.jsonl        ← Gate 评估历史
├── findings.md               ← 问题发现记录
├── spec.md                   ← 需求规范
├── design.md                 ← 设计文档
├── traceability-matrix.md    ← 追溯矩阵
└── ...
```

**读写路径**:
- `advance.ts:45-55` - 状态文件路径解析
- `advance.ts:57-61` - `loadState()` 读取
- `advance.ts:99-101` - `saveState()` 写入
- `advance.ts:185-192` - `writeLog()` 追加日志

### 5.2 配置加载与缓存

```
项目根目录/
├── .spec-first/
│   ├── config.yml            ← 主配置文件
│   └── current               ← 当前 Feature ID
└── specs/
    └── <featureId>/
        └── stage-state.json
```

**配置流程**:
1. `config-schema.ts` - `loadConfig()` 读取并校验
2. `resetConfigCache()` - 清除缓存（在关键操作前调用）
3. 配置影响：`pilot_mode`, `kv_cache_hard_gate`, `auto_advance_policy` 等

**证据源**:
- `src/cli/commands/stage.ts:16` - `resetConfigCache()` 调用
- `src/core/process-engine/advance.ts:112` - advance 前重置缓存
- `src/core/process-engine/advance.ts:148-158` - pilot_mode 降级策略

---

## 6. 循环依赖检测

**分析结果**: 未检测到循环依赖。

**模块依赖层级**:
```
cli/
  ├─→ cli/router.ts
  └─→ cli/commands/*.ts
       ├─→ core/process-engine/*
       ├─→ core/skill-runtime/*
       ├─→ core/gate-engine/*
       └─→ shared/*

core/skill-runtime/
  ├─→ core/process-engine/*
  ├─→ core/gate-engine/*
  └─→ shared/*

core/process-engine/
  ├─→ core/gate-engine/*
  ├─→ core/tool-integration/*
  └─→ shared/*

core/gate-engine/
  └─→ shared/*

shared/
  └─→ (无依赖)
```

**依赖原则**: 自底向上单向依赖，`shared/` 为最底层，`cli/` 为最顶层。

---

## 7. 关键调用路径汇总

### 7.1 用户命令 → 阶段推进

```
用户输入: spec-first stage advance FEAT-001
  ↓
cli/index.ts:83 dispatch()
  ↓
cli/router.ts:68 dispatch() → 查找 'stage' 命令
  ↓
cli/commands/stage.ts:189 handleAdvance()
  ↓
core/process-engine/advance.ts:107 advance()
  ├─→ stage-machine.ts:30 assertTransitionAllowed()
  ├─→ dependency-checker.ts checkDependencies()
  ├─→ gate-engine/gate-evaluator.ts evaluateGate()
  └─→ fs-utils.ts writeJson() 保存状态
```

### 7.2 Skill 命令 → 加载执行

```
用户输入: /spec-first:code
  ↓
skill-runtime/dispatcher.ts:219 dispatchCommand()
  ↓
dispatcher.ts:332 resolveSkillPath() → 查找 SKILL.md
  ↓
dispatcher.ts:384 loadSkill()
  ├─→ dispatcher.ts:942 loadSkillTemplate() 读取模板
  ├─→ prompt-assembler.ts assemblePrompt() 动态组装
  ├─→ hard-gate.ts evaluateSkillHardGate() 校验
  ├─→ scope-guard.ts evaluateRuntimeScopeGuard() 校验
  └─→ dispatcher.ts:717 buildCodeRuntimeNotice() 注入上下文
```

### 7.3 Orchestrate 自动编排

```
用户输入: spec-first orchestrate --auto --auto-advance
  ↓
cli/commands/orchestrate.ts:52 handleOrchestrate()
  ├─→ orchestrate-args.ts validateOrchestrateArgs()
  ├─→ ai-orchestrator/auto-loop.ts runAutoLoop() [如 --auto]
  ├─→ next-step-decider.ts decideNextStep()
  └─→ advance.ts advance() [如 --auto-advance 且决策允许]
```

---

## 8. 性能关键路径

### 8.1 热路径识别

1. **命令分发**: `router.ts:dispatch()` - 每次命令执行必经
2. **状态加载**: `advance.ts:loadState()` - 频繁读取 JSON
3. **Skill 解析**: `dispatcher.ts:resolveSkillPath()` - 目录扫描
4. **配置加载**: `config-schema.ts:loadConfig()` - YAML 解析

### 8.2 优化建议

- **配置缓存**: 已实现 `resetConfigCache()`，避免重复解析
- **Skill 路径缓存**: 可考虑缓存 `resolveSkillPath()` 结果
- **状态读取**: 考虑增量更新而非全量读写

---

## 9. 错误处理链路

### 9.1 异常类型层级

```
Error (基类)
├── TransitionError (stage-machine.ts)
├── GateFailedError (advance.ts)
├── GateUnavailableError (advance.ts)
├── HardGateBlockedError (hard-gate.ts)
├── ScopeGuardBlockedError (scope-guard.ts)
└── OrchestrateArgsError (orchestrate-args.ts)
```

### 9.2 错误传播路径

```
核心模块抛出异常
  ↓
CLI 命令 handler catch
  ↓
返回对应 ExitCode
  ↓
router.ts:dispatch() 统一处理
  ↓
process.exit(code)
```

**证据源**:
- `src/cli/router.ts:98-104` - 统一错误捕获
- `src/cli/commands/stage.ts:206-217` - Stage 命令错误处理
- `src/cli/commands/orchestrate.ts:100-111` - Orchestrate 命令错误处理

---

## 附录：分析方法

**分析工具**: 静态代码分析 + 文件读取
**覆盖范围**: 19 个 CLI 命令、核心引擎模块、Skill 运行时
**证据标注**: 所有关键调用均标注文件路径和行号
**验证方式**: 交叉验证函数调用关系、参数传递、状态变更

**局限性**:
- 未包含运行时动态加载的 Extension Skill
- 未分析 AI Orchestrator 内部循环逻辑细节
- 未覆盖所有边缘错误处理分支
