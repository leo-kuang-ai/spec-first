# V2-13 Orchestrate Auto Loop 开发任务清单

> **对齐来源**: `docs/02技术方案/V2/v2-13-orchestrate-auto-loop.md` (v2.1.0)
> **版本**: v1.2.0 | **日期**: 2026-02-27 | **原则**: MVP 优先，渐进增强
> **预估总工时**: 3.5 周 | **TASK 总数**: 44
> **变更说明**: 修复统计口径（44 TASK）；Front Matter 解析层调整到 Phase B；修正配置与解析层目标文件路径；补齐 retry-budget E2E 测试映射

---

## 1. 总览

| Phase | 周期 | 优先级 | TASK 数 | 核心目标 | 产出 |
|-------|------|--------|---------|----------|------|
| **Phase A** | 1.5 周 | P0/P1 | 16 | 最小可运行闭环 | `--auto` 可连续推进多 TASK，可恢复、可停止 |
| **Phase B** | 1 周 | P1 | 16 | 完成可靠性 | 完成检测 + 回退重试 + 幂等性 |
| **Phase C** | 1 周 | P2 | 12 | 质量与治理 | slop 检测 + _context.md + MCP 声明 |

---

## 2. Phase A：最小可运行闭环（1.5周，P0/P1）

> **目标**: 实现 `/spec-first:orchestrate --auto` 的基础自迭代执行，支持恢复、超时保护和审计追溯。

### A1. 基础设施与类型（2-3天）

---

#### TASK-A1-1：Todo 状态词汇统一

| 属性 | 值 |
|------|-----|
| **优先级** | P0 |
| **工时** | 0.5 天 |
| **对齐方案** | §7.5 Todo 状态词汇统一 |

**描述**：

统一 Todo 状态词汇，以 `done` 为 canonical 状态，在 Hook 脚本中做兼容映射，解决当前 `done/complete/verified` 并存的问题。

**验收标准**：

```gherkin
Given 当前代码中存在多种完成状态词汇（done/complete/verified）
When 调用 normalizeTodoStatus() 函数
Then 所有词汇均归一为 "done"
And 该函数可用于 Hook 脚本中的状态映射
```

**技术要点**：

```typescript
// src/core/ai-orchestrator/todo-types.ts
type TodoStatus = 'pending' | 'in_progress' | 'done' | 'blocked';

function normalizeTodoStatus(input: string): TodoStatus {
  const map: Record<string, TodoStatus> = {
    'done': 'done',
    'complete': 'done',
    'verified': 'done',
    'in progress': 'in_progress',
    'pending': 'pending',
    'blocked': 'blocked',
  };
  return map[input.toLowerCase()] ?? input;
}
```

**依赖**：无

---

#### TASK-A1-2：配置 Schema 扩展

| 属性 | 值 |
|------|-----|
| **优先级** | P0 |
| **工时** | 1 天 |
| **对齐方案** | §6.1 配置 Schema 变更表 |

**描述**：

扩展 `SpecFirstConfig` 类型，支持方案第 6 节定义的 18 个 runtime 扩展配置项。

**验收标准**（覆盖 18 个配置项）：

```gherkin
# auto_orchestrate 配置项 (9 个)
Given 用户配置 runtime.auto_orchestrate.enabled = true
When 启动 CLI 并加载配置
Then 配置被正确解析为布尔值
Given 用户配置 runtime.auto_orchestrate.max_task_duration_ms = 300000
When 启动 CLI 并加载配置
Then 配置被正确解析为数值，且在 60000-3600000 范围内
Given 用户配置 runtime.auto_orchestrate.heartbeat_timeout_ms = 180000
When 启动 CLI 并加载配置
Then 配置被正确解析为数值
Given 用户配置 runtime.auto_orchestrate.watchdog_interval_ms = 5000
When 启动 CLI 并加载配置
Then 配置被正确解析为数值，且在 1000-60000 范围内
Given 用户配置 runtime.auto_orchestrate.max_retry_per_task = 5
When 启动 CLI 并加载配置
Then 配置被正确解析为数值
Given 用户配置 runtime.auto_orchestrate.retry_backoff_ms = 1000
When 启动 CLI 并加载配置
Then 配置被正确解析为数值，且在 100-30000 范围内
Given 用户配置 runtime.auto_orchestrate.max_total_retry_duration_ms = 600000
When 启动 CLI 并加载配置
Then 配置被正确解析为数值，且在 60000-7200000 范围内
Given 用户配置 runtime.auto_orchestrate.max_parallel = 2
When 启动 CLI 并加载配置
Then 配置被正确解析为数值，且在 1-4 范围内
Given 用户配置 runtime.auto_orchestrate.stop_on_blocked = true
When 启动 CLI 并加载配置
Then 配置被正确解析为布尔值

# completion_guard 配置项 (1 个)
Given 用户配置 runtime.completion_guard.enabled = true
When 启动 CLI 并加载配置
Then 配置被正确解析为布尔值

# slop_check 配置项 (1 个)
Given 用户配置 runtime.slop_check.enabled = true
When 启动 CLI 并加载配置
Then 配置被正确解析为布尔值

# audit_log 配置项 (5 个)
Given 用户配置 runtime.audit_log.enabled = true
When 启动 CLI 并加载配置
Then 配置被正确解析为布尔值
Given 用户配置 runtime.audit_log.tamper_proof = 'hash_chain'
When 启动 CLI 并加载配置
Then 配置被正确解析为枚举值（none/hash_chain）
Given 用户配置 runtime.audit_log.rotation_size_mb = 20
When 启动 CLI 并加载配置
Then 配置被正确解析为数值，且在 1-100 范围内
Given 用户配置 runtime.audit_log.max_files = 10
When 启动 CLI 并加载配置
Then 配置被正确解析为数值，且在 1-20 范围内
Given 用户配置 runtime.audit_log.compression = true
When 启动 CLI 并加载配置
Then 配置被正确解析为布尔值

# context_pack 配置项 (2 个)
Given 用户配置 runtime.context_pack.merge_strategy = 'closest'
When 启动 CLI 并加载配置
Then 配置被正确解析为枚举值（all/closest/parent-only）
Given 用户配置 runtime.context_pack.review_on_first_generate = true
When 启动 CLI 并加载配置
Then 配置被正确解析为布尔值

# 默认值回退
Given 用户配置文件不包含 runtime.auto_orchestrate.max_task_duration_ms
When 启动 CLI 并加载配置
Then 使用默认值 600000

# 超范围校验
Given 用户配置 runtime.auto_orchestrate.max_parallel = 10（超过上限）
When 启动 CLI 并加载配置
Then 触发校验错误并提示范围 1-4
```

**技术要点**：

```typescript
// src/shared/config-schema.ts
interface SpecFirstConfig {
  runtime: {
    // 现有配置...
    auto_orchestrate: {
      enabled: boolean;
      stop_on_blocked: boolean;
      max_task_duration_ms: number;        // 默认 600000
      heartbeat_timeout_ms: number;         // 默认 300000
      watchdog_interval_ms: number;         // 默认 10000
      max_retry_per_task: number;           // 默认 3
      retry_backoff_ms: number;             // 默认 2000
      max_total_retry_duration_ms: number;  // 默认 900000
      max_parallel: number;                 // 默认 1
    };
    completion_guard: {
      enabled: boolean;
    };
    slop_check: {
      enabled: boolean;
    };
    audit_log: {
      enabled: boolean;
      tamper_proof: 'none' | 'hash_chain';
      rotation_size_mb: number;             // 默认 10
      max_files: number;                    // 默认 5
      compression: boolean;
    };
    context_pack: {
      merge_strategy: 'all' | 'closest' | 'parent-only';
      review_on_first_generate: boolean;
    };
  };
}
```

**依赖**：TASK-A1-1

---

> 注：Front Matter 统一解析层按技术方案 v2.1.0 调整到 **Phase B** 执行，见 `TASK-B0-1`。

### A2. 状态管理（1-2天）

---

#### TASK-A2-1：todo-state.json 扩展

| 属性 | 值 |
|------|-----|
| **优先级** | P0 |
| **工时** | 0.5 天 |
| **对齐方案** | §4.3 状态文件统一策略 |

**描述**：

在现有 `todo-state.json` 中引入 `runtime.autoLoop` 命名空间，不新增独立状态文件，完成运行态字段分层。

**验收标准**：

```gherkin
Given 读取现有的 todo-state.json
When 调用 extendTodoStateForAutoLoop()
Then 状态文件包含 runtime.autoLoop.* 字段
And 保留 halted/haltReason/iteration 等顶层字段
And 支持向后兼容读取（缺失 runtime.autoLoop 时回退读取 legacy 顶层字段）
```

**技术要点**：

```typescript
// src/core/ai-orchestrator/todo-state-types.ts
interface TodoState {
  featureId: string;
  iteration: number;
  maxIterations: number;
  halted: boolean;
  haltReason: string | null;
  runtime: {
    autoLoop: {
      currentTaskId: string | null;
      taskStartedAt: string | null;        // ISO 8601
      heartbeatAt: string | null;          // ISO 8601
      watchdogCheckedAt: string | null;    // ISO 8601
      retry: {
        regenerateCount: number;
        autoRetryCount: number;
        manualRevisionCount: number;
        totalRetryDurationMs: number;
        lastFailureReason: string | null;
      };
      lastResult: {
        taskId: string | null;
        outcome: 'done' | 'blocked' | 'timeout';
        message: string | null;
      };
    };
  };
  items: TodoItem[];
  updatedAt: string;  // ISO 8601，复用作为 lastCheckpointAt
}
```

**依赖**：TASK-A1-2

---

#### TASK-A2-2：原子写入保护机制

| 属性 | 值 |
|------|-----|
| **优先级** | P0 |
| **工时** | 0.5 天 |
| **对齐方案** | §5.1 原子写入保护 |

**描述**：

实现 write-then-rename 模式，防止中途 kill 导致状态文件损坏。

**验收标准**：

```gherkin
Given 需要写入 todo-state.json
When 调用 atomicWriteState(path, content)
Then 内容先写入 .tmp 临时文件
Then 通过 renameSync 原子替换原文件
And 若中途 kill，原文件保持完整
```

**技术要点**：

```typescript
// src/core/ai-orchestrator/todo-state-writer.ts
function atomicWriteState(statePath: string, state: TodoState): void {
  const tmpPath = statePath + '.tmp';
  writeFileSync(tmpPath, JSON.stringify(state, null, 2));
  renameSync(tmpPath, statePath);
}
```

**依赖**：TASK-A2-1

---

### A3. 参数入口（1天）

---

#### TASK-A3-1：orchestrate args 解析器

| 属性 | 值 |
|------|-----|
| **优先级** | P0 |
| **工时** | 0.5 天 |
| **对齐方案** | §4.5 参数入口协议 |

**描述**：

实现 `/spec-first:orchestrate --auto/--resume` 参数解析，区分 single/auto 模式。

**验收标准**：

```gherkin
Given 用户执行 /spec-first:orchestrate --auto
When skill runtime 解析参数
Then 返回 { mode: 'auto', resume: false }
Given 用户执行 /spec-first:orchestrate --auto --resume
When skill runtime 解析参数
Then 返回 { mode: 'auto', resume: true }
Given 用户执行 /spec-first:orchestrate（无参数）
When skill runtime 解析参数
Then 返回 { mode: 'single', resume: false }
```

**技术要点**：

```typescript
// src/core/skill-runtime/dispatcher.ts
type OrchestrateMode = 'single' | 'auto';
interface OrchestrateArgs {
  mode: OrchestrateMode;
  resume: boolean;
}

function parseOrchestrateArgs(args: string[]): OrchestrateArgs;
```

**依赖**：TASK-A1-2

---

#### TASK-A3-2：参数校验契约

| 属性 | 值 |
|------|-----|
| **优先级** | P0 |
| **工时** | 0.5 天 |
| **对齐方案** | §4.5 参数校验契约 |

**描述**：

实现参数校验，禁止未知参数，确保 `--resume` 仅在 `mode=auto` 时合法。

**验收标准**：

```gherkin
Given 用户传入未知参数（如 --verbose）
When 调用 validateOrchestrateArgs(args)
Then 返回 E_ORCH_ARGS_UNKNOWN 错误并停止
Given 用户仅传入 --resume（无 --auto）
When 调用 validateOrchestrateArgs(args)
Then 返回 E_ORCH_ARGS_RESUME_WITHOUT_AUTO 错误并停止
Given 用户重复参数（如 --auto --auto）
When 调用 validateOrchestrateArgs(args)
Then 按一次处理，并记录 warning
```

**技术要点**：

```typescript
// src/core/skill-runtime/orchestrate-validator.ts
type OrchestrateErrorCode =
  | 'E_ORCH_ARGS_UNKNOWN'
  | 'E_ORCH_ARGS_RESUME_WITHOUT_AUTO';

interface ValidationResult {
  valid: boolean;
  error?: OrchestrateErrorCode;
  warnings: string[];
}

function validateOrchestrateArgs(args: OrchestrateArgs): ValidationResult;
```

**依赖**：TASK-A3-1

---

### A4a. 循环框架（1天）

---

#### TASK-A4a-1：主循环骨架

| 属性 | 值 |
|------|-----|
| **优先级** | P1 |
| **工时** | 1 天 |
| **对齐方案** | §5.1 循环算法 |

**描述**：

实现 auto-loop 主循环骨架，集成 pickReadyTodos、iteration 控制和完成检测。

**验收标准**：

```gherkin
Given 执行 /spec-first:orchestrate --auto
When 进入主循环
Then 循环条件为 iteration < maxIterations
And 每轮调用 pickReadyTodos(maxParallel=max_auto_parallel)

# 无可执行任务分支
And 无可执行任务时：
  - unfinished==0 → 设置 halted=false，退出循环（正常完成）
  - unfinished>0 → advance iteration，继续下一轮

# 达到迭代上限分支（对齐 §14.4 Halt 路径）
Given iteration 达到 maxIterations
And 仍有 TASK 未完成
When 循环条件判断
Then 设置 halted=true
And 设置 haltReason='max_iterations_reached: {current}/{max}'
And 退出循环，不再 advance iteration

# watchdog 启动与停止
Given 进入主循环前
When 调用 startWatchdog(config)
Then watchdog 后台启动
Given 退出主循环后
When 调用 watchdog.stop()
Then watchdog 后台停止
```

**技术要点**：

```typescript
// src/core/ai-orchestrator/auto-loop-runner.ts
async function runAutoLoop(config: {
  maxIterations: number;
  maxAutoParallel: number;
  featureId: string;
}): Promise<void> {
  const state = loadTodoState(featureId);
  const watchdog = startWatchdog(config);

  while (state.iteration < state.maxIterations) {
    const readyTasks = pickReadyTodos(state.items, {
      maxParallel: config.maxAutoParallel,
    });

    if (readyTasks.length === 0) {
      const unfinished = state.items.filter(t => t.status !== 'done').length;
      if (unfinished === 0) {
        state.halted = false;
        break;
      } else {
        state.iteration++;
        continue;
      }
    }

    await executeRound(readyTasks);
    await checkpoint(state);
    state.iteration++;
  }

  await watchdog.stop();
}
```

**依赖**：TASK-A2-2, TASK-A3-2

---

### A4b. 可靠性增强（2-3天）

---

#### TASK-A4b-1：active heartbeat 机制

| 属性 | 值 |
|------|-----|
| **优先级** | P1 |
| **工时** | 0.5 天 |
| **对齐方案** | §5.1 Heartbeat 超时检测 |

**描述**：

在每轮循环与 TASK 进度回调时更新 `heartbeatAt` 时间戳。

**验收标准**：

```gherkin
Given auto-loop 正在运行
When 每轮循环开始
Then 更新 runtime.autoLoop.heartbeatAt = 当前时间
When TASK 进度回调触发
Then 更新 runtime.autoLoop.heartbeatAt = 当前时间
```

**技术要点**：

```typescript
// src/core/ai-orchestrator/heartbeat-tracker.ts
class HeartbeatTracker {
  updateHeartbeat(): void {
    state.runtime.autoLoop.heartbeatAt = new Date().toISOString();
  }
}
```

**依赖**：TASK-A4a-1

---

#### TASK-A4b-2：watchdog 后台检测

| 属性 | 值 |
|------|-----|
| **优先级** | P1 |
| **工时** | 1 天 |
| **对齐方案** | §5.1 Heartbeat 超时检测 |

**描述**：

启动后台 watchdog 定时器，定期检测 heartbeat 超时并标记 `stalled_timeout`。

**验收标准**：

```gherkin
Given heartbeatTimeoutMs = 60000（1 分钟）
Given watchdogIntervalMs = 10000（10 秒）
When watchdog 检测到 Date.now() - heartbeatAt > heartbeatTimeoutMs
Then 设置 halted=true
And 设置 haltReason='stalled_timeout'
And 触发 audit log 记录 stalled_timeout 事件
```

**技术要点**：

```typescript
// src/core/ai-orchestrator/watchdog.ts
// 注意：代码中使用 camelCase（TypeScript 约定），配置文件使用 snake_case
// heartbeatTimeoutMs 对应配置 runtime.auto_orchestrate.heartbeat_timeout_ms
// watchdogIntervalMs 对应配置 runtime.auto_orchestrate.watchdog_interval_ms

class Watchdog {
  private timer: NodeJS.Timeout | null = null;

  start(config: {
    heartbeatTimeoutMs: number;
    watchdogIntervalMs: number;
    onStalled: () => void;
  }): void {
    this.timer = setInterval(() => {
      const lastHeartbeat = new Date(state.runtime.autoLoop.heartbeatAt).getTime();
      if (Date.now() - lastHeartbeat > config.heartbeatTimeoutMs) {
        config.onStalled();
      }
    }, config.watchdogIntervalMs);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
  }
}
```

**依赖**：TASK-A4b-1

---

#### TASK-A4b-3：TASK 级超时保护

| 属性 | 值 |
|------|-----|
| **优先级** | P1 |
| **工时** | 0.5 天 |
| **对齐方案** | §5.1 TASK 级超时保护 |

**描述**：

为单 TASK 添加硬超时限制，防止卡死绕过 `max_iterations`。

**验收标准**：

```gherkin
Given maxTaskDurationMs = 30000（30 秒）
Given TASK 开始执行，记录 taskStartedAt
When TASK 执行超过 30 秒
Then 中断当前 TASK
And 设置 haltReason='task_timeout:TASK-XXX'
And 触发 audit log 记录 task_timeout 事件
```

**技术要点**：

```typescript
// src/core/ai-orchestrator/task-timeout-guard.ts
class TaskTimeoutGuard {
  private timeout: NodeJS.Timeout | null = null;

  start(taskId: string, maxDuration: number, onTimeout: () => void): void {
    this.timeout = setTimeout(() => {
      state.halted = true;
      state.haltReason = `task_timeout:${taskId}`;
      onTimeout();
    }, maxDuration);
  }

  clear(): void {
    if (this.timeout) clearTimeout(this.timeout);
  }
}
```

**依赖**：TASK-A4b-2

---

#### TASK-A4b-4：审计日志（JSONL + hash chain）

| 属性 | 值 |
|------|-----|
| **优先级** | P1 |
| **工时** | 1 天 |
| **对齐方案** | §5.1 审计日志 |

**描述**：

实现 append-only 审计日志，支持 JSONL 格式和 hash chain 防篡改。

**验收标准**：

```gherkin
Given 审计日志文件路径为 specs/{featureId}/orchestrate-audit.jsonl
When 发生 task_start 事件
Then 追加一行 JSON：{"ts":"...","event":"task_start","taskId":"...","prevHash":"0","hash":"..."}
When 发生 task_complete 事件
Then 追加一行 JSON，hash 包含前一条日志的 prevHash
When 手工修改中间某条日志
Then 运行 verifyAuditLog() 可检测到 hash chain 断裂
```

**技术要点**：

```typescript
// src/core/ai-orchestrator/audit-log.ts
interface AuditEvent {
  ts: string;              // ISO 8601
  event: 'task_start' | 'task_progress' | 'task_complete' | 'task_retry' | 'task_blocked';
  taskId: string;
  iteration: number;
  prevHash: string;
  hash: string;
}

class AuditLogger {
  private lastHash: string = '0';

  append(event: Omit<AuditEvent, 'prevHash' | 'hash'>): void {
    const content = JSON.stringify(event);
    const hash = crypto.createHash('sha256')
      .update(content + this.lastHash)
      .digest('hex');

    const entry: AuditEvent = {
      ...event,
      prevHash: this.lastHash,
      hash,
    };

    fs.appendFileSync(this.path, JSON.stringify(entry) + '\n');
    this.lastHash = hash;
  }

  verify(): boolean {
    // 读取所有行，验证 hash chain 连续性
  }
}
```

**依赖**：TASK-A4b-3

---

### A5. 状态机扩展（1天）

---

#### TASK-A5-1：TRANSITIONS 扩展

| 属性 | 值 |
|------|-----|
| **优先级** | P0 |
| **工时** | 1 天 |
| **对齐方案** | §7.3 Phase Machine TRANSITIONS 扩展 |

**描述**：

扩展 `phase-machine.ts` 的 `TRANSITIONS`，增加 `P4_WRITE -> P2_GENERATE` 回退路径。

**验收标准**：

```gherkin
Given 当前状态为 P4_WRITE
When 完成检测失败需要回退重生成
Then 状态转移为 P2_GENERATE 是合法的
And phaseMachine.transition('P4_WRITE', 'P2_GENERATE') 返回 true
```

**技术要点**：

```typescript
// src/core/skill-runtime/phase-machine.ts
const TRANSITIONS: Record<Phase, Phase[]> = {
  // ... 现有转换
  P4_WRITE: ['P5_SIDE_EFFECT', 'P2_GENERATE'],  // 新增 P2_GENERATE
};
```

**依赖**：无

---

### A6. Confirm Policy（0.5天）

---

#### TASK-A6-1：strict 策略一致性逻辑

| 属性 | 值 |
|------|-----|
| **优先级** | P1 |
| **工时** | 0.5 天 |
| **对齐方案** | §4.4 Confirm Policy 与 Auto 模式的协调 |

**描述**：

确保 `--auto` 模式不降低 confirm_policy，保持 `strict` 批次确认。

**验收标准**：

```gherkin
Given 用户执行 /spec-first:orchestrate --auto
When 进入批次边界确认
Then confirm_policy 保持 strict
And 用户必须确认才能继续下一批 TASK
```

**技术要点**：

```typescript
// src/core/skill-runtime/orchestrate-runner.ts
function getConfirmPolicy(args: OrchestrateArgs): ConfirmPolicy {
  // 无论 mode 为 single 还是 auto，都返回 strict
  return 'strict';
}
```

**依赖**：TASK-A3-2

---

### A7. 基础测试（2天）

---

#### TASK-A7-1：单元测试基础集

| 属性 | 值 |
|------|-----|
| **优先级** | P1 |
| **工时** | 1 天 |
| **对齐方案** | §8.4 契约测试清单 |

**描述**：

实现 Phase A 的核心单元测试。

**验收标准**：

```gherkin
Given 运行 npm test -- tests/unit/orchestrate-args-parser.test.ts
Then 参数解析测试全部通过
Given 运行 npm test -- tests/unit/config-schema-runtime-extensions.test.ts
Then 配置 Schema 扩展测试全部通过
Given 运行 npm test -- tests/unit/todo-status-normalize.test.ts
Then 状态归一化测试全部通过
Given 运行 npm test -- tests/unit/phase-machine-p4-rollback.test.ts
Then P4→P2 回退契约测试全部通过
```

**测试文件**：

- `tests/unit/orchestrate-args-parser.test.ts`
- `tests/unit/config-schema-runtime-extensions.test.ts`
- `tests/unit/todo-status-normalize.test.ts`
- `tests/unit/phase-machine-p4-rollback.test.ts`

**依赖**：TASK-A2-2, TASK-A3-2, TASK-A5-1

---

#### TASK-A7-2：E2E 测试 Happy Path

| 属性 | 值 |
|------|-----|
| **优先级** | P1 |
| **工时** | 1 天 |
| **对齐方案** | §8.5 端到端集成测试计划 + §14.1 正常完成路径 |

**描述**：

实现 auto-loop Happy Path 的 E2E 测试。

**验收标准**：

```gherkin
Given Feature 有 3 个 TASK，全部依赖已满足
Given 配置 max_iterations=10, max_retry_per_task=3
When 执行 /spec-first:orchestrate --auto
Then 循环完成 TASK-1 → TASK-2 → TASK-3
And todo-state.json 的 3 个 TASK 状态均为 done
And iteration=3（实际执行 3 轮）
And orchestrate-audit.jsonl 包含 6 条记录（3 次启动 + 3 次完成）
And 任何 TASK 的 regenerateCount=0
```

**测试文件**：

- `tests/e2e/orchestrate-auto-happy.e2e.ts`

**依赖**：TASK-A4b-4, TASK-A6-1

---

#### TASK-A7-3：E2E 测试 Watchdog + Heartbeat 超时

| 属性 | 值 |
|------|-----|
| **优先级** | P1 |
| **工时** | 0.5 天 |
| **对齐方案** | §8.5 端到端集成测试计划 (第 2 项) + §14.3 Stalled 路径 |

**描述**：

实现 watchdog 与 heartbeat 超时的 E2E 测试，确保 stalled 任务能被正确检测。

**验收标准**：

```gherkin
Given Feature 有 1 个 TASK 正在执行
Given 配置 heartbeat_timeout_ms=60000（1 分钟）
Given 配置 watchdog_interval_ms=10000（10 秒）
When 执行 /spec-first:orchestrate --auto
And TASK 开始执行后停止更新 heartbeat
When watchdog 检测到 Date.now() - heartbeatAt > heartbeatTimeoutMs
Then 设置 halted=true
And 设置 haltReason='stalled_timeout'
And 审计日志记录 stalled_timeout 事件
When 执行 /spec-first:orchestrate --auto --resume
Then 输出警告："检测到上次执行可能已 stalled，从 iteration 恢复"
And 重新开始 TASK 执行，不重置 iteration
```

**测试文件**：

- `tests/e2e/orchestrate-watchdog-timeout.e2e.ts`

**依赖**：TASK-A4b-2, TASK-A7-2

---

## 3. Phase B：完成可靠性（1周，P1）

> **目标**: 实现 P4→P5 双重完成检测、有限回退重试、幂等性保证，确保任务不会"假完成"或无限重试。

### B0. Front Matter 统一解析前置（1天）

---

#### TASK-B0-1：Front Matter 统一解析层

| 属性 | 值 |
|------|-----|
| **优先级** | P1 |
| **工时** | 1 天 |
| **对齐方案** | §5.6 Skill Front Matter 统一解析层 |

**描述**：

新增统一解析层，支持 `completion_markers`、`required_mcps`、`write_mode` 等 Front Matter 字段，避免重复实现。

**验收标准**：

```gherkin
Given 一个 SKILL.md 文件包含 Front Matter
When 调用 parseSkillFrontMatter(path)
Then 返回 ParsedSkill 对象，包含 meta 和 body
And meta 包含 required_mcps、completion_markers、write_mode
And 解析失败时抛出显式错误（不 silently fallback）
```

**技术要点**：

```typescript
// src/core/skill-runtime/frontmatter-parser.ts
interface SkillMeta {
  required_mcps?: string[];
  completion_markers?: {
    target_file?: string;
    required_sections?: string[];
    min_lines?: number;
    contains_pattern?: string[];
    min_entities?: Record<string, number>;
  };
  write_mode?: 'overwrite' | 'append' | 'merge';
}

interface ParsedSkill {
  meta: SkillMeta;
  body: string;
}

function parseSkillFrontMatter(skillPath: string): ParsedSkill;
```

**依赖**：Phase A 完成

### B1. 双重完成检测（2天）

---

#### TASK-B1-1：completion_markers 契约解析

| 属性 | 值 |
|------|-----|
| **优先级** | P1 |
| **工时** | 0.5 天 |
| **对齐方案** | §5.2 Skill 完成标记契约 |

**描述**：

解析 Skill Front Matter 中的 `completion_markers` 配置。

**验收标准**：

```gherkin
Given SKILL.md 包含 completion_markers 配置
When 调用 parseCompletionMarkers(skillMeta)
Then 返回 CompletionMarkers 对象，包含：
  - target_file: 目标文件路径
  - required_sections: 必需章节列表
  - min_lines: 最小行数
  - contains_pattern: 需包含的正则模式
  - min_entities: 最小实体数量
```

**技术要点**：

```typescript
// src/core/skill-runtime/completion-guard.ts
interface CompletionMarkers {
  target_file?: string;
  required_sections?: string[];
  min_lines?: number;
  contains_pattern?: string[];
  min_entities?: Record<string, number>;
}

function parseCompletionMarkers(meta: SkillMeta): CompletionMarkers;
```

**依赖**：TASK-B0-1

---

#### TASK-B1-2：结构完整性检查

| 属性 | 值 |
|------|-----|
| **优先级** | P1 |
| **工时** | 0.5 天 |
| **对齐方案** | §5.2 完整性最低标准 |

**描述**：

实现基础结构完整性检查：文件存在、非空、最小行数。

**验收标准**：

```gherkin
Given 目标文件存在
And 文件内容非空
And 文件行数 >= min_lines
When 调用 checkStructuralIntegrity(file, markers)
Then 返回 { passed: true }
Given 目标文件不存在
When 调用 checkStructuralIntegrity(file, markers)
Then 返回 { passed: false, reason: 'file_not_found' }
```

**技术要点**：

```typescript
// src/core/skill-runtime/completion-guard.ts
interface IntegrityResult {
  passed: boolean;
  reason?: 'file_not_found' | 'file_empty' | 'min_lines_not_met';
}

function checkStructuralIntegrity(
  filePath: string,
  markers: CompletionMarkers
): IntegrityResult;
```

**依赖**：TASK-B1-1

---

#### TASK-B1-3：语义完整性检查

| 属性 | 值 |
|------|-----|
| **优先级** | P1 |
| **工时** | 0.5 天 |
| **对齐方案** | §5.2 完整性最低标准 |

**描述**：

实现语义完整性检查：必需章节、包含模式、最小实体数量。

**验收标准**：

```gherkin
Given 目标文件内容
And markers.required_sections = ["## API 契约", "## 追踪矩阵"]
When 调用 checkSemanticIntegrity(content, markers)
And 文件包含所有必需章节
Then 返回 { passed: true }
Given 文件缺少 "## API 契约" 章节
Then 返回 { passed: false, reason: 'missing_required_section', missing: ["## API 契约"] }
```

**技术要点**：

```typescript
// src/core/skill-runtime/completion-guard.ts
interface SemanticResult {
  passed: boolean;
  reason?: 'missing_required_section' | 'pattern_not_found' | 'entities_not_met';
  missing?: string[];
}

function checkSemanticIntegrity(
  content: string,
  markers: CompletionMarkers
): SemanticResult;
```

**依赖**：TASK-B1-2

---

#### TASK-B1-4：全局默认完成检测模板

| 属性 | 值 |
|------|-----|
| **优先级** | P1 |
| **工时** | 0.5 天 |
| **对齐方案** | §5.2 全局默认完成检测模板 |

**描述**：

实现双层加载机制：全局默认规则 + 项目级覆盖。

**验收标准**：

```gherkin
Given 全局默认规则位于 templates/completion/default-markers.yaml
Given 项目级规则位于 .spec-first/completion-markers.yaml
When 调用 loadCompletionMarkers(skillType)
Then 优先级为：Skill 级 > 项目级 > 全局默认
And 项目级同 ID 规则覆盖全局规则
```

**技术要点**：

```typescript
// src/core/skill-runtime/completion-templates.ts
interface CompletionTemplate {
  defaults: CompletionMarkers;
  overrides?: Record<string, Partial<CompletionMarkers>>;
}

function loadCompletionMarkers(skillType: string): CompletionMarkers {
  const global = loadYaml('templates/completion/default-markers.yaml');
  const project = loadYaml('.spec-first/completion-markers.yaml');
  // 合并逻辑
}
```

**依赖**：TASK-B1-3

---

### B2. 回退与重试（2天）

---

#### TASK-B2-1：统一 regenerateCount 计数

| 属性 | 值 |
|------|-----|
| **优先级** | P1 |
| **工时** | 0.5 天 |
| **对齐方案** | §7.3 统一计数口径 |

**描述**：

统一所有回退到 P2 的路径计入 `regenerateCount`，包括 `P3→P2` 和 `P4→P2`。

**验收标准**：

```gherkin
Given P3_CONFIRM 确认失败，回退 P2
When 调用 recordRetry(P3_CONFIRM, P2_GENERATE)
Then regenerateCount += 1
Given P4_WRITE 完成检测失败，回退 P2
When 调用 recordRetry(P4_WRITE, P2_GENERATE)
Then regenerateCount += 1
And manualRevisionCount 和 autoRetryCount 分别记录观测用途
```

**技术要点**：

```typescript
// src/core/skill-runtime/retry-counter.ts
function recordRetry(fromPhase: Phase, toPhase: Phase): void {
  if (toPhase === 'P2_GENERATE') {
    state.runtime.autoLoop.retry.regenerateCount++;
    if (fromPhase === 'P3_CONFIRM') {
      state.runtime.autoLoop.retry.manualRevisionCount++;
    } else if (fromPhase === 'P4_WRITE') {
      state.runtime.autoLoop.retry.autoRetryCount++;
    }
  }
}
```

**依赖**：Phase A 完成

---

#### TASK-B2-2：有限回退机制

| 属性 | 值 |
|------|-----|
| **优先级** | P1 |
| **工时** | 0.5 天 |
| **对齐方案** | §5.2 有限回退机制 |

**描述**：

实现单 TASK 最大回退次数限制，超过后标记 `blocked`。

**验收标准**：

```gherkin
Given maxRetryPerTask = 3
Given regenerateCount = 2
When 完成检测失败，需要回退
Then 允许回退，regenerateCount = 3
Given regenerateCount = 3
When 完成检测失败，需要回退
Then 不允许回退，标记 blocked
And 设置 haltReason = 'blocked:TASK-XXX:completion_check_failed'
```

**技术要点**：

```typescript
// src/core/skill-runtime/retry-controller.ts
function canRetry(taskId: string): boolean {
  const { regenerateCount } = state.runtime.autoLoop.retry;
  return regenerateCount < config.max_retry_per_task;
}

function markBlocked(taskId: string, reason: string): void {
  const task = findTask(taskId);
  task.status = 'blocked';
  state.halted = true;
  state.haltReason = `blocked:${taskId}:${reason}`;
}
```

**依赖**：TASK-B2-1

---

#### TASK-B2-3：失败原因注入

| 属性 | 值 |
|------|-----|
| **优先级** | P1 |
| **工时** | 0.5 天 |
| **对齐方案** | §5.2 失败原因注入 |

**描述**：

在完成检测失败后，生成结构化失败原因并注入下一轮 P2 Prompt。

**验收标准**：

```gherkin
Given 完成检测失败，failure_code = 'missing_required_section'
When 生成下一轮 P2 Prompt
Then Prompt 包含"上次失败原因（必须先修复）"章节
And 包含 failure_code、failed_rule、expected、actual、fix_hint
```

**技术要点**：

```typescript
// src/core/skill-runtime/failure-injector.ts
interface FailureReason {
  failure_code: string;
  failed_rule: string;
  expected: string;
  actual: string;
  fix_hint: string;
}

function injectFailureReason(
  prompt: string,
  failure: FailureReason
): string {
  const section = `
## 上次失败原因（必须先修复）
- failure_code: ${failure.failure_code}
- failed_rule: ${failure.failed_rule}
- expected: ${failure.expected}
- actual: ${failure.actual}
- fix_hint: ${failure.fix_hint}
`;
  return section + '\n\n' + prompt;
}
```

**依赖**：TASK-B2-2

---

#### TASK-B2-4：错误分类

| 属性 | 值 |
|------|-----|
| **优先级** | P1 |
| **工时** | 0.5 天 |
| **对齐方案** | §5.2 错误分类与重试策略 |

**描述**：

区分临时错误（可重试）和永久错误（不消耗重试次数）。

**验收标准**：

```gherkin
Given 发生 ENOENT 错误（目标目录不存在）
When 调用 classifyError(error)
Then 返回 { type: 'permanent', shouldRetry: false }
Given 发生临时权限拒绝错误
When 调用 classifyError(error)
Then 返回 { type: 'transient', shouldRetry: true }
```

**技术要点**：

```typescript
// src/core/skill-runtime/error-classifier.ts
type ErrorType = 'transient' | 'permanent';

interface ErrorClassification {
  type: ErrorType;
  shouldRetry: boolean;
}

function classifyError(error: Error): ErrorClassification {
  const permanentPatterns = [
    /ENOENT/,
    /ENOSPC/,
    /EACCES.*denied/,
    /invalid.*config/,
  ];

  const isPermanent = permanentPatterns.some(p => p.test(error.message));
  return {
    type: isPermanent ? 'permanent' : 'transient',
    shouldRetry: !isPermanent,
  };
}
```

**依赖**：TASK-B2-2

---

#### TASK-B2-5：backoff 退避策略

| 属性 | 值 |
|------|-----|
| **优先级** | P1 |
| **工时** | 0.5 天 |
| **对齐方案** | §5.2 退避策略与重试成本上限 |

**描述**：

实现指数退避 + 抖动，避免高频重试放大资源消耗。

**验收标准**：

```gherkin
Given retry_backoff_ms = 2000
Given 当前重试次数 attempt = 0
When 调用 calculateBackoff(attempt)
Then 返回约 2000ms + 抖动
Given attempt = 3
When 调用 calculateBackoff(attempt)
Then 返回约 min(2000 * 2^3, 30000) + 抖动
```

**技术要点**：

```typescript
// src/core/skill-runtime/backoff-calculator.ts
function calculateBackoff(attempt: number): number {
  const baseDelay = config.retry_backoff_ms;
  const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), 30000);
  const jitter = Math.random() * 500;
  return exponentialDelay + jitter;
}
```

**依赖**：TASK-B2-3

---

#### TASK-B2-6：重试总预算

| 属性 | 值 |
|------|-----|
| **优先级** | P1 |
| **工时** | 0.5 天 |
| **对齐方案** | §5.2 退避策略与重试成本上限 |

**描述**：

实现运行级重试总耗时上限，超过后直接 `halted`。

**验收标准**：

```gherkin
Given max_total_retry_duration_ms = 900000（15 分钟）
Given totalRetryDurationMs = 800000
When 发生新的重试，耗时 200000
Then totalRetryDurationMs = 1000000
Then 触发 halted，haltReason = 'retry_budget_exhausted'
```

**技术要点**：

```typescript
// src/core/skill-runtime/retry-budget.ts
function checkRetryBudget(duration: number): boolean {
  const { totalRetryDurationMs } = state.runtime.autoLoop.retry;
  const newTotal = totalRetryDurationMs + duration;

  if (newTotal > config.max_total_retry_duration_ms) {
    state.halted = true;
    state.haltReason = 'retry_budget_exhausted';
    return false;
  }

  state.runtime.autoLoop.retry.totalRetryDurationMs = newTotal;
  return true;
}
```

**依赖**：TASK-B2-5

---

### B3. 幂等性（1天）

---

#### TASK-B3-1：write_mode 解析

| 属性 | 值 |
|------|-----|
| **优先级** | P1 |
| **工时** | 0.5 天 |
| **对齐方案** | §5.2 P4 写入幂等性保证 |

**描述**：

解析 Skill Front Matter 中的 `write_mode` 配置。

**验收标准**：

```gherkin
Given SKILL.md 包含 write_mode: overwrite
When 调用 parseWriteMode(skillMeta)
Then 返回 'overwrite'
Given SKILL.md 未包含 write_mode
Then 返回默认值 'overwrite'
```

**技术要点**：

```typescript
// src/core/skill-runtime/frontmatter-parser.ts
type WriteMode = 'overwrite' | 'append' | 'merge';

function parseWriteMode(meta: SkillMeta): WriteMode {
  return meta.write_mode || 'overwrite';
}
```

**依赖**：TASK-B1-4

---

#### TASK-B3-2：P4 写入幂等性实现

| 属性 | 值 |
|------|-----|
| **优先级** | P1 |
| **工时** | 0.5 天 |
| **对齐方案** | §5.2 P4 写入幂等性保证 |

**描述**：

根据 `write_mode` 实现幂等写入逻辑。

**验收标准**：

```gherkin
Given write_mode = overwrite
When 重复调用 idempotentWrite(path, content, mode)
Then 文件内容为最新 content，天然幂等
Given write_mode = append
When 重复调用 idempotentWrite(path, content, mode)
Then 先删除旧文件，再写入新内容，确保幂等
```

**技术要点**：

```typescript
// src/core/skill-runtime/idempotent-writer.ts
function idempotentWrite(
  path: string,
  content: string,
  mode: WriteMode
): void {
  switch (mode) {
    case 'overwrite':
      fs.writeFileSync(path, content);
      break;
    case 'append':
      if (fs.existsSync(path)) fs.unlinkSync(path);
      fs.writeFileSync(path, content);
      break;
    case 'merge':
      // 本期不支持，抛出错误
      throw new Error('merge mode not supported yet');
  }
}
```

**依赖**：TASK-B3-1

---

### B4. catchup 增强（0.5天）

---

#### TASK-B4-1：auto-loop 状态摘要输出

| 属性 | 值 |
|------|-----|
| **优先级** | P1 |
| **工时** | 0.5 天 |
| **对齐方案** | §5.2 catchup 补 auto-loop 状态摘要 |

**描述**：

在 `catchup` 命令中增加 auto-loop 运行态摘要输出。

**验收标准**：

```gherkin
Given 执行 /spec-first:catchup
When todo-state.json 包含 runtime.autoLoop 字段
Then 输出包含：
  - 当前 TASK ID
  - heartbeat 时间
  - 重试计数
  - 上次执行结果
```

**技术要点**：

```typescript
// src/core/ai-orchestrator/catchup.ts
function formatAutoLoopSummary(state: TodoState): string {
  const { autoLoop } = state.runtime;
  return `
## Auto-Loop 状态
- 当前 TASK: ${autoLoop.currentTaskId || '无'}
- Heartbeat: ${autoLoop.heartbeatAt || '未启动'}
- 重试计数: ${autoLoop.retry.regenerateCount}
- 上次结果: ${autoLoop.lastResult.outcome}
`;
}
```

**依赖**：Phase B 全部完成

---

### B5. 完成可靠性测试（1.5天）

---

#### TASK-B5-1：单元测试 completion_guard 和 retry_controller

| 属性 | 值 |
|------|-----|
| **优先级** | P1 |
| **工时** | 0.5 天 |
| **对齐方案** | §9.2 测试验收 |

**描述**：

实现完成检测和重试控制的单元测试。

**验收标准**：

```gherkin
Given 运行 npm test -- tests/unit/completion-guard.test.ts
Then 完整性通过/失败回退测试全部通过
Given 运行 npm test -- tests/unit/retry-controller.test.ts
Then backoff 与重试预算控制测试全部通过
Given 运行 npm test -- tests/unit/skill-frontmatter-parser.test.ts
Then Front Matter 统一解析测试全部通过
```

**测试文件**：

- `tests/unit/completion-guard.test.ts`
- `tests/unit/retry-controller.test.ts`
- `tests/unit/skill-frontmatter-parser.test.ts`

**依赖**：TASK-B1-4, TASK-B2-6

---

#### TASK-B5-2：E2E 测试 Blocked/Stalled/Halt/永久错误

| 属性 | 值 |
|------|-----|
| **优先级** | P1 |
| **工时** | 1 天 |
| **对齐方案** | §8.5 + §14.2/14.3/14.4/14.5 + retry-budget |

**描述**：

实现异常场景的 E2E 测试。

**验收标准**：

```gherkin
Given 执行 Blocked 路径测试（§14.2）
Then 完成检测失败 3 次后标记 blocked
Given 执行 Stalled 路径测试（§14.3）
Then heartbeat 超时后 watchdog 检测到 stalled
Given 执行 Halt 路径测试（§14.4）
Then 达到 max_iterations 后停止
Given 执行永久错误路径测试（§14.5）
Then 永久错误不消耗 regenerateCount
Given 执行 retry-budget 路径测试（§8.5 第 4 项）
Then totalRetryDurationMs 超限后触发 halted:retry_budget_exhausted
```

**测试文件**：

- `tests/e2e/orchestrate-blocked.e2e.ts`
- `tests/e2e/orchestrate-stalled.e2e.ts`
- `tests/e2e/orchestrate-halt.e2e.ts`
- `tests/e2e/orchestrate-permanent-error.e2e.ts`
- `tests/e2e/orchestrate-retry-budget.e2e.ts`

**依赖**：TASK-B5-1

---

## 4. Phase C：质量与治理（1周，P2）

> **目标**: 实现 slop 检测、层级化上下文、MCP 声明，提升代码质量和开发体验。

### C1. slop 检测（2天）

---

#### TASK-C1-1：slop-checker 独立模块

| 属性 | 值 |
|------|-----|
| **优先级** | P2 |
| **工时** | 1 天 |
| **对齐方案** | §5.3 AI 注释 slop 检测 |

**描述**：

创建独立的 slop-checker 模块，与现有 SCA 解耦。

**验收标准**：

```gherkin
Given slop 规则文件包含 TODO 占位符检测
When 调用 checkSlop(changedFiles, patterns)
Then 返回命中规则的文件列表和位置
```

**技术要点**：

```typescript
// src/core/gate-engine/slop-checker.ts
interface SlopPattern {
  id: string;
  regex: string;
  severity: 'error' | 'warning';
}

interface SlopViolation {
  file: string;
  line: number;
  patternId: string;
  match: string;
}

function checkSlop(
  files: string[],
  patterns: SlopPattern[]
): SlopViolation[];
```

**依赖**：Phase B 完成

---

#### TASK-C1-2：全局默认规则 + 项目级覆盖

| 属性 | 值 |
|------|-----|
| **优先级** | P2 |
| **工时** | 0.5 天 |
| **对齐方案** | §5.3 规则文件：双层加载 |

**描述**：

实现 slop 规则的双层加载机制。

**验收标准**：

```gherkin
Given 全局默认规则位于 templates/sca/default-slop-patterns.yaml
Given 项目级规则位于 .spec-first/ai-slop-patterns.yaml
When 调用 loadSlopPatterns()
Then 合并全局规则和项目级规则
And 项目级同 ID 规则覆盖全局规则
```

**技术要点**：

```typescript
// src/core/gate-engine/slop-patterns.ts
function loadSlopPatterns(): SlopPattern[] {
  const global = loadYaml('templates/sca/default-slop-patterns.yaml');
  const project = loadYaml('.spec-first/ai-slop-patterns.yaml');
  // 合并逻辑，项目级覆盖全局
}
```

**依赖**：TASK-C1-1

---

#### TASK-C1-3：P4 写后拦截集成

| 属性 | 值 |
|------|-----|
| **优先级** | P2 |
| **工时** | 0.5 天 |
| **对齐方案** | §5.3 AI 注释 slop 检测 |

**描述**：

在 P4 写入后扫描本轮变更文件，命中规则则阻断进入 P5。

**验收标准**：

```gherkin
Given P4 写入完成
When 调用 checkSlop(changedFiles)
And 命中 slop 规则
Then 阻断进入 P5
And 返回修复提示并回退 P2
```

**技术要点**：

```typescript
// src/core/skill-runtime/phase-machine.ts
async function transitionToP5(): Promise<Phase> {
  const slopViolations = checkSlop(getChangedFiles());
  if (slopViolations.length > 0) {
    reportSlopViolations(slopViolations);
    return 'P2_GENERATE';  // 回退重生成
  }
  return 'P5_SIDE_EFFECT';
}
```

**依赖**：TASK-C1-2

---

### C2. 层级化上下文（3天）

---

#### TASK-C2-1：_context.md 生成器

| 属性 | 值 |
|------|-----|
| **优先级** | P2 |
| **工时** | 1 天 |
| **对齐方案** | §5.4 层级化 _context.md 自动生成与加载 |

**描述**：

实现 `_context.md` 生成器，扫描模块目录并生成上下文摘要。

**验收标准**：

```gherkin
Given src/auth/ 目录包含多个 TypeScript 文件
When 调用 generateModuleContext('src/auth')
Then 生成 src/auth/_context.md
And 内容包含：职责、公开 API、依赖关系、关键约束
```

**技术要点**：

```typescript
// src/core/context-engine/context-generator.ts
interface ModuleContext {
  name: string;
  responsibility: string;
  publicApi: string[];
  dependencies: string[];
  constraints: string[];
}

function generateModuleContext(modulePath: string): ModuleContext;
```

**依赖**：Phase B 完成

---

#### TASK-C2-2：首次生成审核流程

| 属性 | 值 |
|------|-----|
| **优先级** | P2 |
| **工时** | 0.5 天 |
| **对齐方案** | §5.4 更新策略 |

**描述**：

首次生成 `_context.md` 时触发人工审核流程。

**验收标准**：

```gherkin
Given review_on_first_generate = true
Given 首次调用 generateModuleContext()
Then 生成 diff 预览
And 提供"接受全部 / 按文件接受 / 跳过本次"选项
And 跳过时在审计日志记录 context_review_skipped
```

**技术要点**：

```typescript
// src/core/context-engine/context-review.ts
enum ReviewAction {
  AcceptAll = 'accept_all',
  AcceptPerFile = 'accept_per_file',
  Skip = 'skip',
}

function reviewGeneratedContexts(contexts: ModuleContext[]): Promise<ReviewAction>;
```

**依赖**：TASK-C2-1

---

#### TASK-C2-3：Context Pack 集成

| 属性 | 值 |
|------|-----|
| **优先级** | P2 |
| **工时** | 1 天 |
| **对齐方案** | §5.4 与 Context Pack 的集成 |

**描述**：

扩展 `buildTaskContextPack`，注入 `_context.md` 到 `moduleContexts` 字段。

**验收标准**：

```gherkin
Given code skill 执行 TASK-AUTH-001
Given TASK-AUTH-001 涉及 src/auth/ 路径
And src/auth/_context.md 存在
When 调用 buildTaskContextPack(taskId, ...)
Then 返回的 pack 包含 moduleContexts 字段
And moduleContexts 包含 src/auth/_context.md 的摘要
And contextSize 计入 moduleContexts 大小
```

**技术要点**：

```typescript
// src/core/context-engine/context-pack.ts
interface TaskContextPack {
  // 现有字段...
  moduleContexts?: string[];  // 新增字段
}

async function buildTaskContextPack(taskId: string): Promise<TaskContextPack> {
  const pack = { ...existingFields };

  // 查找相关 _context.md
  const contexts = findModuleContexts(taskId);
  if (contexts.length > 0) {
    pack.moduleContexts = contexts;
    pack.contextSize += contexts.join('').length;
  }

  return pack;
}
```

**依赖**：TASK-C2-2

---

#### TASK-C2-4：TASK→模块路径映射算法

| 属性 | 值 |
|------|-----|
| **优先级** | P2 |
| **工时** | 0.5 天 |
| **对齐方案** | §5.4 TASK→模块路径映射算法 |

**描述****

实现 TASK 到模块路径的映射算法。

**验收标准**：

```gherkin
Given TASK-AUTH-001 文本包含 "修改 src/auth/model.ts"
When 调用 resolveModulePaths(taskId)
Then 返回 ['src/auth/']
Given TASK 文本无显式路径
When 调用 resolveModulePaths(taskId)
Then 回退到矩阵中的 API 路径或 DS 绑定路径
Given 仍无路径
Then 回退到最近 git diff 的变更文件
```

**技术要点**：

```typescript
// src/core/context-engine/path-resolver.ts
function resolveModulePaths(taskId: string): string[] {
  // 1. 扫描 TASK 文本中的显式路径
  const explicitPaths = extractExplicitPaths(taskId);
  if (explicitPaths.length > 0) return explicitPaths;

  // 2. 回退到矩阵路径
  const matrixPaths = getMatrixPaths(taskId);
  if (matrixPaths.length > 0) return matrixPaths;

  // 3. 回退到 git diff
  const diffPaths = getDiffPaths(taskId);
  return diffPaths;
}
```

**依赖**：TASK-C2-3

---

#### TASK-C2-5：ContextProvider 扩展接口

| 属性 | 值 |
|------|-----|
| **优先级** | P2 |
| **工时** | 0.5 天 |
| **对齐方案** | §5.4 ContextProvider 扩展接口 |

**描述**：

抽象统一扩展接口，解耦 `TaskContextPack` 扩展点。

**验收标准**：

```gherkin
Given 新增上下文类型（如 API 契约摘要）
When 注册新的 ContextProvider
Then buildTaskContextPack 自动调用新 Provider
And 无需修改核心组装逻辑
```

**技术要点**：

```typescript
// src/core/context-engine/context-provider.ts
interface ContextProvider {
  id: string;
  collect(input: TaskContextInput): Promise<string[]>;
  estimateSize(chunks: string[]): number;
}

class ModuleContextProvider implements ContextProvider {
  id = 'module_context';
  async collect(input: TaskContextInput): Promise<string[]> {
    return findModuleContexts(input.taskId);
  }
  estimateSize(chunks: string[]): number {
    return chunks.join('').length;
  }
}

// 注册机制
const providers: ContextProvider[] = [
  new ReferencesProvider(),
  new ModuleContextProvider(),
  // 后续扩展...
];
```

**依赖**：TASK-C2-4

---

### C3. MCP 声明（1天）

---

#### TASK-C3-1：required_mcps 解析与提示注入

| 属性 | 值 |
|------|-----|
| **优先级** | P2 |
| **工时** | 0.5 天 |
| **对齐方案** | §5.5 Skill required_mcps 声明机制 |

**描述**：

解析 `required_mcps` 并注入到 Context Pack 提示。

**验收标准**：

```gherkin
Given SKILL.md 包含 required_mcps: [sequential-thinking, context7]
When 调用 parseRequiredMcps(skillMeta)
Then 返回 ['sequential-thinking', 'context7']
When 构建 Context Pack
Then 提示包含"本任务需要以下 MCP 服务：sequential-thinking, context7"
```

**技术要点**：

```typescript
// src/core/skill-runtime/frontmatter-parser.ts
function parseRequiredMcps(meta: SkillMeta): string[] {
  return meta.required_mcps || [];
}

// src/core/context-engine/context-pack.ts
function injectMcpHint(pack: TaskContextPack, mcps: string[]): void {
  if (mcps.length > 0) {
    pack.hints += `\n\n## 需要 MCP 服务\n${mcps.join(', ')}`;
  }
}
```

**依赖**：Phase B 完成

---

#### TASK-C3-2：doctor 命令 MCP 检查

| 属性 | 值 |
|------|-----|
| **优先级** | P2 |
| **工时** | 0.5 天 |
| **对齐方案** | §5.5 与 Doctor 命令集成 |

**描述**：

在 `doctor` 命令中增加 MCP 可用性检查。

**验收标准**：

```gherkin
Given 项目有 3 个 Skill，分别需要 sequential-thinking/context7/serena
Given 当前仅安装 sequential-thinking 和 serena
When 执行 /spec-first:doctor
Then 输出：
  - ✓ required MCP: sequential-thinking (available)
  - ✗ required MCP: context7 (not found)
  - ✓ required MCP: serena (available)
And 提示安装命令
```

**技术要点**：

```typescript
// src/commands/doctor.ts
async function checkMcps(): Promise<void> {
  const skills = loadAllSkills();
  const requiredMcps = collectRequiredMcps(skills);
  const availableMcps = getAvailableMcps();

  for (const mcp of requiredMcps) {
    const available = availableMcps.includes(mcp);
    const icon = available ? '✓' : '✗';
    const status = available ? '(available)' : '(not found)';
    console.log(`${icon} required MCP: ${mcp} ${status}`);

    if (!available) {
      console.log(`  → 运行 'npx -y @modelcontextprotocol/create-server ${mcp}' 安装`);
    }
  }
}
```

**依赖**：TASK-C3-1

---

### C4. 质量与治理测试（2天）

---

#### TASK-C4-1：单元测试 slop/context/required_mcps

| 属性 | 值 |
|------|-----|
| **优先级** | P2 |
| **工时** | 1 天 |
| **对齐方案** | §9.2 测试验收 |

**描述**：

实现 Phase C 的单元测试。

**验收标准**：

```gherkin
Given 运行 npm test -- tests/unit/slop-checker.test.ts
Then 规则命中/白名单测试全部通过
Given 运行 npm test -- tests/unit/context-autoload.test.ts
Then _context.md 自动加载测试全部通过
Given 运行 npm test -- tests/unit/skill-frontmatter-required-mcps.test.ts
Then required_mcps 解析与注入测试全部通过
```

**测试文件**：

- `tests/unit/slop-checker.test.ts`
- `tests/unit/context-autoload.test.ts`
- `tests/unit/skill-frontmatter-required-mcps.test.ts`

**依赖**：TASK-C1-3, TASK-C2-5, TASK-C3-2

---

#### TASK-C4-2：E2E 测试并行/超时/防篡改

| 属性 | 值 |
|------|-----|
| **优先级** | P2 |
| **工时** | 1 天 |
| **对齐方案** | §8.5 + §14.6/14.7/14.8 |

**描述**：

实现高级场景的 E2E 测试。

**验收标准**：

```gherkin
Given 执行并行执行路径测试（§14.6）
Then max_parallel=2 时，2 个 TASK 并行执行
And iteration 在整批完成后递增 1
Given 执行 TASK 超时路径测试（§14.7）
Then max_task_duration_ms 超时后中断 TASK
Given 执行审计日志防篡改校验（§14.8）
Then 修改日志后 verifyAuditLog() 检测到 hash chain 断裂
```

**测试文件**：

- `tests/e2e/orchestrate-parallel.e2e.ts`
- `tests/e2e/orchestrate-task-timeout.e2e.ts`
- `tests/e2e/orchestrate-audit-hash-chain.e2e.ts`

**依赖**：TASK-C4-1

---

## 5. 验收标准汇总

### 5.1 功能验收（对齐 §9.1）

| # | 验收标准 | 对应 TASK |
|---|----------|----------|
| 1 | 单次触发可连续推进多个 TASK | A4a-1, A7-2 |
| 2 | 中断后可从断点恢复 | A3-1, A4a-1 |
| 3 | 达到上限可停止并输出未完成摘要 | A4a-1, B4-1 |
| 4 | 不完整产出可被识别并回退 | B1-4, B2-2 |
| 5 | 命中 slop 规则可阻断并提示修复 | C1-3 |
| 6 | Skill 可声明并输出 MCP 依赖 | C3-1, C3-2 |

### 5.2 测试验收（对齐 §9.2）

| 测试文件 | 对应 TASK |
|----------|----------|
| `tests/unit/orchestrate-auto-loop.test.ts` | A7-1, B5-1 |
| `tests/unit/completion-guard.test.ts` | B5-1 |
| `tests/unit/skill-frontmatter-parser.test.ts` | B0-1, B5-1 |
| `tests/unit/slop-checker.test.ts` | C4-1 |
| `tests/unit/context-autoload.test.ts` | C4-1 |
| `tests/unit/skill-frontmatter-required-mcps.test.ts` | C4-1 |
| `tests/unit/orchestrate-args-parser.test.ts` | A7-1 |
| `tests/unit/config-schema-runtime-extensions.test.ts` | A7-1 |
| `tests/unit/retry-controller.test.ts` | B5-1 |
| `tests/e2e/orchestrate-auto-happy.e2e.ts` | A7-2 |
| `tests/e2e/orchestrate-blocked.e2e.ts` | B5-2 |
| `tests/e2e/orchestrate-stalled.e2e.ts` | B5-2 |
| `tests/e2e/orchestrate-halt.e2e.ts` | B5-2 |
| `tests/e2e/orchestrate-permanent-error.e2e.ts` | B5-2 |
| `tests/e2e/orchestrate-retry-budget.e2e.ts` | B5-2 |
| `tests/e2e/orchestrate-parallel.e2e.ts` | C4-2 |
| `tests/e2e/orchestrate-task-timeout.e2e.ts` | C4-2 |
| `tests/e2e/orchestrate-audit-hash-chain.e2e.ts` | C4-2 |

---

## 6. 风险与依赖

### 6.1 关键依赖

| 依赖项 | 影响 | 缓解措施 |
|--------|------|----------|
| Phase A 完成 | Phase B/C 阻塞 | 严格按顺序实施 |
| `phase-machine.ts` TRANSITIONS 扩展 | P4→P2 回退 | TASK-A5-1 必须在 Phase B 前完成 |
| 配置 Schema 扩展 | 所有 runtime 配置 | TASK-A1-2 作为基础设施优先完成 |

### 6.2 技术风险（对齐 §10）

| # | 风险 | 控制措施 | 对应 TASK |
|---|------|----------|----------|
| 1 | 无限循环 | maxIterations 硬上限 | A4a-1 |
| 2 | 误判不完整导致回退过多 | 双阈值 + blocked/halted | B2-2, B2-6 |
| 3 | slop 误报 | 白名单 + 双层规则 | C1-2 |
| 4 | 上下文文件过期 | stale 标记机制 | C2-2 |
| 5 | 状态文件损坏 | write-then-rename | A2-2 |
| 6 | 上下文窗口溢出 | Fresh Context Per Task | A4a-1 |
| 7 | 双文件状态不一致 | 单一 source of truth | A2-1 |
| 8 | P4 回退产生重复内容 | 幂等写入 | B3-2 |
| 9 | stalled 任务无感知 | active watchdog | A4b-2 |
| 10 | 并行 checkpoint 中间态 | 原子批量写入 | A2-2, A4a-1 |
| 11 | write_mode 不匹配 | 默认 overwrite | B3-1 |
| 12 | 审计日志被删改 | hash chain | A4b-4 |
| 13 | 单 TASK 长时间卡死 | max_task_duration_ms | A4b-3 |

---

## 7. 版本历史

| 版本 | 日期 | 变更摘要 |
|------|------|----------|
| v1.2.0 | 2026-02-27 | 修复一致性问题：TASK 统计口径更正为 44（Phase A/B/C=16/16/12）；Front Matter 统一解析层调整至 Phase B（新增 TASK-B0-1）；修正配置目标文件为 `src/shared/config-schema.ts`；统一解析层目标文件为 `src/core/skill-runtime/frontmatter-parser.ts`；补齐 `tests/e2e/orchestrate-retry-budget.e2e.ts` 映射 |
| v1.1.0 | 2026-02-27 | 修复项完成：(P0) 完善 TASK-A1-2 配置 Schema 验收标准，覆盖 16 个配置项；(P1) 新增 TASK-A7-3（Watchdog E2E 测试）；(P1) 文档版本对齐技术方案 v2.1.0；(P2) TASK-A4a-1 补充 Halt 边界行为；(P3) 术语注释说明 |
| v1.0.0 | 2026-02-27 | 初始任务清单：35 个 TASK，3 个 Phase |
