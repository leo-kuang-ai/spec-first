# Auto Loop 增强方案

> **文档版本**: 1.0.0 | **日期**: 2026-03-15
> **对应任务**: Gap Closure Plan T1（补强 Auto Loop）+ T2（引入超时监督骨架）
> **状态**: 设计阶段

---

## 一、现状分析

### 1.1 当前架构（线图）

```
用户调用: spec-first orchestrate [featureId] [--auto] [--auto-advance]
                │
                ▼
        orchestrate.ts (handleOrchestrate)
                │
                ├─ isAutoMode? ──YES──► runAutoLoop()  ◄── 任务级循环（TASK粒度）
                │                            │
                │                    ┌───────▼────────────────────────┐
                │                    │       auto-loop.ts              │
                │                    │  while (iteration < maxIter)    │
                │                    │    pickReadyTodos()             │
                │                    │      │                          │
                │                    │      ▼                          │
                │                    │    executor(task)  ──Promise.race──► TIMEOUT
                │                    │      │                          │
                │                    │      ▼                          │
                │                    │    watchdog check               │
                │                    │      │                          │
                │                    │      ▼                          │
                │                    │    runPostWriteGuards()         │
                │                    │      │                          │
                │                    │      ├─ MCP check               │
                │                    │      ├─ completion markers      │
                │                    │      └─ slop rules              │
                │                    │      │                          │
                │                    │      ▼                          │
                │                    │    retry / block / done         │
                │                    │      │                          │
                │                    │      ▼                          │
                │                    │    checkpoint (saveTodoState)   │
                │                    └────────────────────────────────┘
                │                            │
                │                    AutoLoopResult { status, iterations, completedTasks }
                │
                ▼
        decideNextStep()  ◄── 每次 orchestrate 调用只决策一次
                │
                ├─ BLOCKED          → 打印阻塞原因，退出
                ├─ SUGGEST_NEXT     → 打印建议命令，退出
                ├─ READY_TO_ADVANCE → 等待用户手动执行 stage advance
                └─ AUTO_ADVANCE ────► advance()  ◄── Gate → 依赖检查 → 推进 Stage
                                         │
                                         └─ 推进完毕，退出（不继续下一 Stage）
```

### 1.2 现有能力清单（已实现）

| 能力 | 文件 | 状态 | 说明 |
|------|------|------|------|
| 任务级主循环 | `auto-loop.ts` | ✅ 完整 | pick → execute → checkpoint → advance iteration |
| 任务超时 (Promise.race) | `auto-loop.ts` | ✅ 完整 | max_task_duration_ms 配置 |
| Heartbeat 停滞检测 | `watchdog.ts` | ✅ 完整 | heartbeat_timeout_ms 配置 |
| 指数退避重试 | `retry-controller.ts` | ✅ 完整 | 错误分类 + fingerprint + 预算 |
| 崩溃恢复 (zombie) | `auto-loop.ts` | ✅ 完整 | in_progress → pending，retryCount++ |
| 级联阻塞传播 | `todo-runner.ts` | ✅ 完整 | cascadeBlocked() |
| MCP 依赖检查 | `mcp-checker.ts` | ✅ 完整 | required_mcps 校验 |
| Completion markers | `completion-detector.ts` | ✅ 完整 | Skill front matter 驱动 |
| Slop 检查 | `slop-checker.ts` | ✅ 完整 | 项目级规则预加载 |
| Stage 级决策 | `next-step-decider.ts` | ✅ 完整 | decideNextStep 多阶段差异化 |
| Gate 校验 + 推进 | `advance.ts` | ✅ 完整 | 依赖检查 → Gate → 状态写入 |
| 审计日志 | `audit-log.ts` | ✅ 完整 | 每个关键事件写 JSONL |

### 1.3 核心缺口（T1 需要补强的）

| 缺口 | 影响 | 优先级 |
|------|------|--------|
| **无 Stage 级自动链路** | 每次 orchestrate 只处理一个阶段，跨 Stage 需用户反复调用 | 🔴 P0 |
| **无 Stage 级超时监督** | 只有任务级 timeout，没有阶段级 soft/idle/hard 监督 | 🔴 P0 |
| **无暂停/恢复标记** | 长时间无人值守时无法在安全点暂停 | 🟠 P1 |
| **进度可视化弱** | 只有任务粒度进度，无阶段维度展示 | 🟡 P2 |
| **Steering 上下文未注入** | Auto Loop 没有把项目级 steering context 注入 skill | 🟡 P2（T3 负责）|

---

## 二、优化后的理想架构

### 2.1 目标架构（线图）

```
用户调用: spec-first orchestrate [featureId] [--auto] [--auto-advance] [--max-stages N]
                │
                ▼
        orchestrate.ts (handleOrchestrate)
                │
                ▼
        ┌───────────────────────────────────────────────────────────────┐
        │              Stage-Level Auto Loop (新增)                      │
        │         src/core/auto-loop/stage-loop.ts                      │
        │                                                               │
        │  while (stageCount < maxStages && !halted)                    │
        │    │                                                          │
        │    ├─ 1. stageTimeoutSupervisor.check()  ◄── 三层超时监督      │
        │    │       soft → warn LLM to wrap up                        │
        │    │       idle → detect stalled                              │
        │    │       hard → force halt                                  │
        │    │                                                          │
        │    ├─ 2. deriveNextAction(featureId)  ◄── 新增核心函数         │
        │    │       读 stage-state.json                                │
        │    │       evaluateGate()                                     │
        │    │       decideNextStep()                                   │
        │    │       → Action: RUN_SKILL / ADVANCE_STAGE / STOP        │
        │    │                                                          │
        │    ├─ 3a. Action = RUN_SKILL                                  │
        │    │       │                                                  │
        │    │       ▼                                                  │
        │    │   ┌───────────────────────────────────────────────┐     │
        │    │   │     Task-Level Auto Loop (现有，已完整)         │     │
        │    │   │     src/core/ai-orchestrator/auto-loop.ts      │     │
        │    │   │                                               │     │
        │    │   │   pickReadyTodos → executor → guards          │     │
        │    │   │   retry / block / done → checkpoint           │     │
        │    │   └───────────────────────────────────────────────┘     │
        │    │                                                          │
        │    ├─ 3b. Action = ADVANCE_STAGE                              │
        │    │       advance(featureId)                                 │
        │    │       Gate → 依赖检查 → stage-state.json 更新            │
        │    │       stageCount++                                       │
        │    │                                                          │
        │    └─ 3c. Action = STOP                                       │
        │           haltReason: gate_failed / max_stages / user_pause   │
        │           break                                               │
        │                                                               │
        │  StageLoopResult { stagesAdvanced, haltReason, auditLog }    │
        └───────────────────────────────────────────────────────────────┘
                │
                ▼
        打印 Stage 级进度摘要
        (推进了 N 个 Stage，当前阶段: X，原因: Y)
```

### 2.2 新增模块结构

```
src/core/auto-loop/                   ← 新目录（T1 产出）
├── index.ts                          ← 公开导出
├── stage-loop.ts                     ← Stage 级主循环
├── derive-next-action.ts             ← 核心决策函数
├── stage-timeout-supervisor.ts       ← Stage 级三层超时（T2）
└── auto-loop.types.ts                ← 类型定义

src/core/ai-orchestrator/             ← 现有目录（已完整，基本不改）
├── auto-loop.ts                      ← 任务级循环（复用）
├── watchdog.ts                       ← 任务级超时（复用）
├── retry-controller.ts               ← 重试控制（复用）
├── todo-runner.ts
├── completion-detector.ts
├── slop-checker.ts
├── audit-log.ts
├── catchup.ts
└── ...
```

### 2.3 两层循环关系

```
Stage Loop (新增, src/core/auto-loop/stage-loop.ts)
  │
  │  控制 Stage 间的推进节奏
  │  负责 Stage 级超时监督
  │  负责 deriveNextAction 决策
  │
  └──► Task Loop (现有, src/core/ai-orchestrator/auto-loop.ts)
         │
         │  控制 Stage 内部的任务执行
         │  负责任务级超时（watchdog）
         │  负责重试、checkpoint、slop 检查
         │
         └──► executor(task)  ← Skill 执行（由 AI runtime 提供）
```

---

## 三、核心新增模块详细设计

### 3.1 `derive-next-action.ts`

**职责**：读取当前 Stage 状态，综合 Gate 结果和 Todo 状态，输出下一步动作。

```typescript
// src/core/auto-loop/derive-next-action.ts

export type AutoLoopAction =
  | { type: 'RUN_SKILL'; skillHint: string }
  | { type: 'ADVANCE_STAGE'; from: Stage; to: Stage }
  | { type: 'STOP'; reason: StopReason };

export type StopReason =
  | 'gate_failed'          // Gate 未通过，需人工修复
  | 'max_stages_reached'   // 达到最大 Stage 推进数
  | 'terminal_stage'       // 到达终态（done / cancelled）
  | 'task_blocked'         // 任务级 auto-loop 出现 blocked
  | 'user_pause'           // 检测到 pause 标记文件
  | 'no_executor'          // 没有提供 executor，无法运行 Skill
  | 'dependency_failed'    // 阶段依赖检查失败
  | 'stage_timeout';       // Stage 级超时

export interface DeriveNextActionInput {
  featureId: string;
  projectRoot: string;
  taskLoopResult?: AutoLoopResult;  // 上一轮 Task Loop 的结果
  stagesAdvanced: number;
  maxStages: number;
}

export interface DeriveNextActionOutput {
  action: AutoLoopAction;
  stageState: FeatureState;
  gateResult?: GateResult;
  decisionDetail: string;  // 人类可读的决策说明，用于进度打印
}

/**
 * 核心决策函数
 * 三步：读状态 → 检查 gate → 选择动作
 */
export function deriveNextAction(input: DeriveNextActionInput): DeriveNextActionOutput {
  const { featureId, projectRoot, taskLoopResult, stagesAdvanced, maxStages } = input;

  // 1. 读 Stage 状态
  const stageState = getFeatureState(featureId, projectRoot);

  // 2. 终态检查
  if (isTerminal(stageState.currentStage)) {
    return { action: { type: 'STOP', reason: 'terminal_stage' }, stageState, ... };
  }

  // 3. 最大 Stage 检查
  if (stagesAdvanced >= maxStages) {
    return { action: { type: 'STOP', reason: 'max_stages_reached' }, stageState, ... };
  }

  // 4. 用户暂停检查（pause 文件）
  if (existsPauseFile(featureId, projectRoot)) {
    return { action: { type: 'STOP', reason: 'user_pause' }, stageState, ... };
  }

  // 5. Task Loop 阻塞检查
  if (taskLoopResult?.status === 'has_blocked') {
    return { action: { type: 'STOP', reason: 'task_blocked' }, stageState, ... };
  }

  // 6. 当前阶段是否需要先跑 Skill（Todo 未完成）
  const todoState = loadTodoState(featureId, projectRoot);
  const todoProgress = summarizeTodoProgress(todoState);
  if (!todoProgress.allDone && todoState) {
    const skillHint = STAGE_SKILL_MAP[stageState.currentStage] ?? 'unknown';
    return { action: { type: 'RUN_SKILL', skillHint }, stageState, ... };
  }

  // 7. Gate 检查
  const gateResult = evaluateGate(featureId, projectRoot, { persist: false });
  if (gateResult.status === 'FAIL') {
    return { action: { type: 'STOP', reason: 'gate_failed' }, stageState, gateResult, ... };
  }

  // 8. 依赖检查
  const nextStage = getNextStage(stageState.currentStage);
  if (nextStage) {
    const depCheck = checkDependencies(featureId, nextStage, projectRoot, profile);
    if (!depCheck.pass) {
      return { action: { type: 'STOP', reason: 'dependency_failed' }, stageState, ... };
    }
  }

  // 9. 可以推进
  return {
    action: { type: 'ADVANCE_STAGE', from: stageState.currentStage, to: nextStage! },
    stageState,
    gateResult,
    ...
  };
}
```

### 3.2 `stage-loop.ts`

**职责**：Stage 级主循环，协调 `deriveNextAction` 和任务级 `runAutoLoop`。

```typescript
// src/core/auto-loop/stage-loop.ts

export interface StageLoopOptions {
  featureId: string;
  projectRoot: string;
  executor?: TaskExecutor;          // 有 executor 才能跑 Skill
  maxStages?: number;               // 默认 8（覆盖所有 active stages）
  timeoutConfig?: StageTimeoutConfig;
  onStageAction?: (action: AutoLoopAction, detail: string) => void;
}

export interface StageLoopResult {
  stagesAdvanced: number;
  stageHistory: Array<{ stage: Stage; timestamp: string; gateResult: string }>;
  haltReason: StopReason;
  finalStage: Stage;
}

export async function runStageLoop(options: StageLoopOptions): Promise<StageLoopResult> {
  const { featureId, projectRoot, executor, maxStages = 8 } = options;
  const supervisor = new StageTimeoutSupervisor(options.timeoutConfig);

  let stagesAdvanced = 0;
  let lastTaskLoopResult: AutoLoopResult | undefined;
  const stageHistory: StageLoopResult['stageHistory'] = [];

  while (true) {
    // Stage 级超时检查
    const timeoutEvent = supervisor.check();
    if (timeoutEvent === 'hard') {
      return buildResult('stage_timeout', stagesAdvanced, stageHistory, featureId, projectRoot);
    }
    if (timeoutEvent === 'soft') {
      // 发送软警告（写入 audit log，不停止）
      writeAuditLog({ event: 'stage_soft_timeout', featureId }, projectRoot);
    }

    // 决策
    const { action, decisionDetail } = deriveNextAction({
      featureId, projectRoot, taskLoopResult: lastTaskLoopResult,
      stagesAdvanced, maxStages
    });

    options.onStageAction?.(action, decisionDetail);

    if (action.type === 'STOP') {
      return buildResult(action.reason, stagesAdvanced, stageHistory, featureId, projectRoot);
    }

    if (action.type === 'RUN_SKILL') {
      if (!executor) {
        return buildResult('no_executor', stagesAdvanced, stageHistory, featureId, projectRoot);
      }
      // 委托给任务级 auto-loop
      lastTaskLoopResult = await runAutoLoop({
        featureId, projectRoot,
        args: defaultOrchestrateArgs(),
        executor,
        onIteration: (iter, state) => {
          const done = state.items.filter(i => i.status === 'done').length;
          console.log(`  [task-loop] Stage ${featureId} 迭代 ${iter}: ${done}/${state.items.length}`);
        }
      });
      supervisor.resetIdle(); // 任务完成，重置 idle 计时
      continue;
    }

    if (action.type === 'ADVANCE_STAGE') {
      const advResult = advance(featureId, projectRoot);
      stageHistory.push({
        stage: advResult.from,
        timestamp: new Date().toISOString(),
        gateResult: advResult.gateResult
      });
      stagesAdvanced++;
      lastTaskLoopResult = undefined; // 新阶段清空任务级结果
      supervisor.resetIdle();
      console.log(`  [stage-loop] 推进: ${advResult.from} → ${advResult.to} (Gate: ${advResult.gateResult})`);
      continue;
    }
  }
}
```

### 3.3 `stage-timeout-supervisor.ts`（T2）

**职责**：Stage 级别的三层超时监督，独立于任务级 watchdog。

```typescript
// src/core/auto-loop/stage-timeout-supervisor.ts

export interface StageTimeoutConfig {
  softTimeoutMs: number;    // 默认 20 min：发出软警告
  idleTimeoutMs: number;    // 默认 10 min：检测停滞（无任何推进）
  hardTimeoutMs: number;    // 默认 60 min：强制停止整个 Stage Loop
}

export const DEFAULT_STAGE_TIMEOUT: StageTimeoutConfig = {
  softTimeoutMs: 20 * 60 * 1000,
  idleTimeoutMs: 10 * 60 * 1000,
  hardTimeoutMs: 60 * 60 * 1000,
};

export type StageTimeoutEvent = 'ok' | 'soft' | 'idle' | 'hard';

export class StageTimeoutSupervisor {
  private startedAt: number;
  private lastProgressAt: number;

  constructor(private config: StageTimeoutConfig = DEFAULT_STAGE_TIMEOUT) {
    this.startedAt = Date.now();
    this.lastProgressAt = Date.now();
  }

  /** 每轮循环开始时调用 */
  check(): StageTimeoutEvent {
    const now = Date.now();
    const totalElapsed = now - this.startedAt;
    const idleElapsed = now - this.lastProgressAt;

    if (totalElapsed >= this.config.hardTimeoutMs) return 'hard';
    if (idleElapsed >= this.config.idleTimeoutMs) return 'idle';
    if (totalElapsed >= this.config.softTimeoutMs) return 'soft';
    return 'ok';
  }

  /** 有进展（Stage 推进或任务完成）时重置 idle 计时 */
  resetIdle(): void {
    this.lastProgressAt = Date.now();
  }
}
```

---

## 四、调用关系对比

### 4.1 当前调用路径

```
CLI: spec-first orchestrate --auto
  │
  └─ handleOrchestrate()
       ├─ runAutoLoop()         ← 跑当前 Stage 内的所有 Task
       └─ decideNextStep()      ← 决策一次
            └─ AUTO_ADVANCE → advance()  ← 推进一个 Stage，退出
```

**问题**：要推进多个 Stage，用户需要反复手动调用 orchestrate。

### 4.2 增强后调用路径

```
CLI: spec-first orchestrate --auto [--max-stages 8]
  │
  └─ handleOrchestrate()
       └─ runStageLoop()        ← Stage 级循环（新增）
            │
            ├─ deriveNextAction()   ← 每轮决策（新增）
            │
            ├─ RUN_SKILL → runAutoLoop()  ← 任务级循环（现有）
            │                   ← 跑完当前 Stage 所有 Task
            │
            └─ ADVANCE_STAGE → advance()  ← 推进到下一 Stage
                                ← 继续下一轮 Stage 循环
```

**效果**：一次调用可以从当前阶段自动跑完到终态（或用户设定的 maxStages 上限）。

---

## 五、测试策略（TDD 五步）

### Step 1：写失败测试

**文件**：`tests/core/auto-loop/derive-next-action.test.ts`

```typescript
describe('deriveNextAction', () => {
  it('should return RUN_SKILL when todo state is not all done', () => {
    // 模拟：当前 Stage=IMPLEMENT，Todo 未完成
    const result = deriveNextAction({ featureId: 'F1', projectRoot, stagesAdvanced: 0, maxStages: 8 });
    expect(result.action.type).toBe('RUN_SKILL');
  });

  it('should return ADVANCE_STAGE when gate passes and todos done', () => {
    // 模拟：当前 Stage=PLAN，Gate=PASS，Todo 全完成
    const result = deriveNextAction({ ... });
    expect(result.action.type).toBe('ADVANCE_STAGE');
  });

  it('should return STOP with gate_failed when gate fails', () => {
    // 模拟：Gate=FAIL
    const result = deriveNextAction({ ... });
    expect(result.action).toEqual({ type: 'STOP', reason: 'gate_failed' });
  });

  it('should return STOP with max_stages_reached', () => {
    const result = deriveNextAction({ stagesAdvanced: 3, maxStages: 3, ... });
    expect(result.action).toEqual({ type: 'STOP', reason: 'max_stages_reached' });
  });

  it('should return STOP with terminal_stage when feature is done', () => {
    // 模拟：currentStage=08_done
    const result = deriveNextAction({ ... });
    expect(result.action).toEqual({ type: 'STOP', reason: 'terminal_stage' });
  });
});
```

**文件**：`tests/core/auto-loop/stage-loop.test.ts`

```typescript
describe('runStageLoop', () => {
  it('should advance stage after task loop completes', async () => {
    const result = await runStageLoop({ featureId, projectRoot, executor: mockExecutor });
    expect(result.stagesAdvanced).toBeGreaterThan(0);
  });

  it('should stop when gate fails', async () => {
    // 模拟 Gate 失败
    const result = await runStageLoop({ ... });
    expect(result.haltReason).toBe('gate_failed');
  });

  it('should stop at max stages', async () => {
    const result = await runStageLoop({ maxStages: 2, ... });
    expect(result.stagesAdvanced).toBe(2);
    expect(result.haltReason).toBe('max_stages_reached');
  });
});
```

**文件**：`tests/core/auto-loop/stage-timeout-supervisor.test.ts`

```typescript
describe('StageTimeoutSupervisor', () => {
  it('should return soft when soft threshold exceeded', () => { ... });
  it('should return idle when no progress for idleTimeoutMs', () => { ... });
  it('should return hard when hard threshold exceeded', () => { ... });
  it('should reset idle timer on resetIdle()', () => { ... });
});
```

### Step 2：运行测试确认失败

```bash
pnpm test -- derive-next-action stage-loop stage-timeout-supervisor
# Expected: FAIL（新文件不存在）
```

### Step 3：最小实现

按照第三章的设计实现：
1. `src/core/auto-loop/auto-loop.types.ts` — 类型定义
2. `src/core/auto-loop/derive-next-action.ts` — 决策函数
3. `src/core/auto-loop/stage-timeout-supervisor.ts` — 三层超时
4. `src/core/auto-loop/stage-loop.ts` — Stage 级主循环
5. `src/core/auto-loop/index.ts` — 导出

修改：
- `src/cli/commands/orchestrate.ts` — 把 `runAutoLoop` 切换为 `runStageLoop`（当 executor 存在时）

### Step 4：运行测试确认通过

```bash
pnpm test -- derive-next-action stage-loop stage-timeout-supervisor
# Expected: PASS
pnpm test  # 全量回归
```

### Step 5：提交

```bash
git add src/core/auto-loop/ src/cli/commands/orchestrate.ts \
  tests/core/auto-loop/
git commit -m "feat: add stage-level auto loop with timeout supervisor"
```

---

## 六、与现有代码的集成边界

### 6.1 不改动的模块

| 模块 | 原因 |
|------|------|
| `src/core/ai-orchestrator/auto-loop.ts` | 任务级循环完整，作为 Stage Loop 的子组件复用 |
| `src/core/ai-orchestrator/watchdog.ts` | 任务级超时监督完整，Stage 级另建 supervisor |
| `src/core/ai-orchestrator/retry-controller.ts` | 重试逻辑完整，直接复用 |
| `src/core/process-engine/advance.ts` | Stage 推进完整，Stage Loop 直接调用 |
| `src/core/process-engine/next-step-decider.ts` | `decideNextStep` 仍可复用，但 `deriveNextAction` 在其基础上封装更高层决策 |
| `src/core/gate-engine/` | 直接复用 `evaluateGate` |

### 6.2 需要轻微修改的模块

| 模块 | 修改内容 |
|------|---------|
| `src/cli/commands/orchestrate.ts` | 增加 `--max-stages` 参数；在 isAutoMode + executor 存在时调用 `runStageLoop` 替代直接调 `runAutoLoop` |
| `src/shared/config-schema.ts` | 增加 `stage_loop` 配置节（maxStages、softTimeoutMs 等），默认值完全向后兼容 |

### 6.3 新增模块清单

```
src/core/auto-loop/
├── index.ts                     # 公开 API：runStageLoop, deriveNextAction
├── stage-loop.ts                # Stage 级主循环
├── derive-next-action.ts        # 核心决策（三步：状态→Gate→动作）
├── stage-timeout-supervisor.ts  # 三层超时（soft/idle/hard）
└── auto-loop.types.ts           # 类型：AutoLoopAction, StopReason, StageLoopResult

tests/core/auto-loop/
├── derive-next-action.test.ts
├── stage-loop.test.ts
└── stage-timeout-supervisor.test.ts
```

---

## 七、配置项设计

```yaml
# .spec-first/config.yaml 新增节（向后兼容，全有默认值）

runtime:
  stage_loop:
    enabled: false             # 默认关闭，--auto 参数或 auto_orchestrate.enabled=true 时启用
    max_stages: 8              # 单次调用最多推进的 Stage 数
    soft_timeout_ms: 1200000   # 20 min：软警告
    idle_timeout_ms: 600000    # 10 min：停滞检测
    hard_timeout_ms: 3600000   # 60 min：强制停止
    pause_file: ".spec-first/pause"  # 用户创建此文件可触发安全暂停
```

---

## 八、完成判定标准

对应 Gap Plan T1 + T2 的 Done Criteria：

- [ ] `spec-first orchestrate --auto` 可以在无人连续确认的前提下，自动从当前 Stage 推进多个 Stage
- [ ] Stage 级三层超时（soft/idle/hard）正常触发并写入审计日志
- [ ] 用户创建 `.spec-first/pause` 文件可以安全暂停 Stage Loop
- [ ] Gate 失败时 Stage Loop 停止并输出明确的阻断原因
- [ ] `max_stages` 到达时安全停止
- [ ] 所有新增单元测试通过（`pnpm test`）
- [ ] 全量回归测试通过，不破坏现有任务级 auto-loop 行为

---

*文档生成于 2026-03-15*
*对应 Gap Closure Plan: T1（补强 Auto Loop）+ T2（引入超时监督骨架）*
