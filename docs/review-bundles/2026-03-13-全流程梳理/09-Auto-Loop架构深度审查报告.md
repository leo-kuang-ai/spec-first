---
title: "Auto-Loop 架构深度审查报告"
date: 2026-03-13
version: spec-first v0.5.78
scope: src/core/ai-orchestrator/
mode: architecture-audit
---

# Auto-Loop 架构深度审查报告

> **审查范围**：`src/core/ai-orchestrator/`（auto-loop.ts · todo-runner.ts · retry-controller.ts · watchdog.ts · completion-detector.ts · slop-checker.ts）
> **代码基准**：v0.5.78，以源码为唯一事实来源
> **审查视角**：顶尖架构师，以生产可靠性为最高标准

---

## 执行摘要

| # | 问题 | 严重性 | 类型 | 修复代价 |
|---|------|--------|------|---------|
| P1 | Watchdog 无法中断运行中的 executor | 🔴 严重 | 功能性缺陷 | 中 |
| P2 | `watchdog_interval_ms` 配置但从未使用 | 🔴 严重 | 死配置 | 低 |
| P3 | `buildFailureInjection` 系死代码，从未调用 | 🔴 严重 | 死代码 | 低 |
| P4 | Retry 计数器全局共享，跨任务互相抢占预算 | 🟠 高 | 状态设计缺陷 | 高 |
| P5 | 依赖死锁静默消耗 maxIterations | 🟠 高 | 功能性缺陷 | 中 |
| P6 | 错误分类依赖字符串匹配，`unknown` 默认重试 | 🟠 高 | 设计缺陷 | 中 |
| P7 | Guard 失败直接 `blocked`，语义与内容质量场景不符 | 🟠 高 | 语义错误 | 中 |
| P8 | Slop 规则和完成标记每次任务都从磁盘重新加载 | 🟡 中 | 性能 | 低 |
| P9 | `in_progress` 在进程重启后语义歧义 | 🟡 中 | 健壮性 | 中 |
| P10 | `stop_on_blocked=false` 时下游一致性无保障 | 🟡 中 | 设计缺陷 | 中 |

**整体评价**：骨架设计优秀，关注点分离清晰，审计日志完善。但有 3 处**已写入配置/接口但从未被调用的死代码**（P2/P3），以及 1 处**根本无法实现其声称保障的机制**（P1）。这两类问题的危险性在于：它们制造了一种"系统已有超时保护"的假象，实际上面对挂起的 executor 系统完全无防。

---

## 一、P1 — Watchdog 无法中断运行中的 executor（🔴 严重）

### 问题描述

**代码证据**（`auto-loop.ts:161-194`）：

```typescript
// ❌ executor 是 await，一旦挂起则永远卡在这里
const result = await executor(task, state);

// Watchdog 检查在 await 之后 —— executor 不返回则永远不会执行
state = updateHeartbeat(state);
const watchdogResult = runWatchdogCheck(state, cfg.runtime.auto_orchestrate);
```

**`markTaskStarted`** 确实在任务开始时设置了 `heartbeatAt` 和 `taskStartedAt`（`auto-loop.ts:450-465`）。但 **`updateHeartbeat()`** 只在 `executor()` 返回后才被调用，而 **`runWatchdogCheck()`** 也只在 `executor()` 返回后才被调用。

两个结论：
1. `heartbeatAt` 在任务执行期间**永远不会被更新**（executor 中没有任何 updateHeartbeat 调用路径）
2. 超时检测只能在**两次任务之间**触发，无法中断正在执行的任务

即：`max_task_duration_ms = 600s` 和 `heartbeat_timeout_ms = 300s` 对于一个挂起的 executor 而言形同虚设。

### 决策思考

**为什么会这样**：这是 async/await 单线程模型下的经典陷阱。原始设计意图是"executor 完成后检查是否超时"，本质上是一种**事后感知**（after-the-fact detection）而非**主动中断**（preemptive interruption）。

**权衡**：
- **Option A（当前）**：executor 返回后检查。简单但无效——对挂起的 executor 毫无保护。
- **Option B**：`Promise.race` + timeout。轻量有效，但无法真正终止 executor 内部的异步操作（已发出的 API 请求仍在运行）。
- **Option C**：`AbortController` 贯穿 executor。最彻底，但需要 executor 接口接受 `signal`，改造代价较高。
- **Option D**：独立的 interval watchdog（`watchdog_interval_ms` 的正确用法）。与主循环解耦，主动检测 + 强制 halt state，最符合 Watchdog 设计模式。

`watchdog_interval_ms` 已在配置中存在（默认 10s，有范围校验），**但在整个 `src/core/ai-orchestrator/` 目录中完全没有被使用**（见 P2）。这是一个已有设计意图但未完成实现的功能。

### 最佳实践方案

**近期方案（低成本）**：用 `Promise.race` 竞争，至少让 Auto-Loop 不再永久卡死：

```typescript
// auto-loop.ts — 替换 executor 调用
const timeoutMs = cfg.runtime.auto_orchestrate.max_task_duration_ms;

const result = await Promise.race([
  executor(task, state),
  new Promise<TaskResult>((_, reject) =>
    setTimeout(() => reject(new Error(`TASK_TIMEOUT:${task.id}:${timeoutMs}ms`)), timeoutMs)
  ),
]).catch((err: Error): TaskResult => ({
  success: false,
  message: err.message,
}));
```

同时将 `TASK_TIMEOUT:` 前缀加入 `PERMANENT_ERROR_PATTERNS`（超时不应重试，应立即 blocked）。

**完整方案（中成本）**：激活 `watchdog_interval_ms`，实现独立轮询 Watchdog：

```typescript
// watchdog-runner.ts（新建）
export function startWatchdog(
  getState: () => TodoRunnerState,
  onTimeout: (taskId: string) => void,
  intervalMs: number,
  config: AutoOrchestrateConfig
): NodeJS.Timeout {
  return setInterval(() => {
    const state = getState();
    const result = runWatchdogCheck(state, config);
    if (result?.event === 'task_timeout' || result?.event === 'heartbeat_stalled') {
      onTimeout(result.taskId);
    }
  }, intervalMs);
}

// auto-loop.ts 中
const watchdogTimer = startWatchdog(
  () => state,
  (taskId) => { abortController.abort(); },
  cfg.runtime.auto_orchestrate.watchdog_interval_ms,
  cfg.runtime.auto_orchestrate
);
try {
  const result = await executor(task, state, { signal: abortController.signal });
} finally {
  clearInterval(watchdogTimer);
}
```

---

## 二、P2 — `watchdog_interval_ms` 配置但从未使用（🔴 严重）

### 问题描述

**代码证据**（`config-schema.ts:87,365-368`）：

```typescript
// 配置定义
auto_orchestrate: {
  watchdog_interval_ms: 10_000,  // 默认 10 秒，有范围校验 1000-60000
}

// 范围校验
if (ao.watchdog_interval_ms < 1_000 || ao.watchdog_interval_ms > 60_000) {
  errors.push(`auto_orchestrate.watchdog_interval_ms must be 1000-60000...`);
}
```

全局搜索 `watchdog_interval_ms` 在 `src/core/ai-orchestrator/` 中**零引用**——既没有在 `auto-loop.ts` 中读取，也没有在 `watchdog.ts` 中使用。这个字段被定义、被校验、被文档化，但**从未被使用**。

### 决策思考

两种可能：
1. **未完成实现**：设计时预留了 interval watchdog 的配置字段，但对应实现尚未完成，属于"配置先于实现"的遗留。
2. **实现已删除**：曾经有 interval watchdog 的实现，后来被删除，但配置字段遗留。

无论哪种，现状是：用户配置这个字段后什么都不会发生，但不会报错——这是**静默无效配置**，是严重的可靠性文档问题。

### 最佳实践方案

**短期**：在配置加载时明确标注（代码注释 + doc）此字段为 `reserved, not yet implemented`，或在 `loadConfig` 后打印 warning。

**中期**：与 P1 方案联动，真正实现 interval watchdog（见 P1 完整方案）。`watchdog_interval_ms` 将成为实际生效的配置项。

```typescript
// config-schema.ts — 短期处理
// TODO(P2): watchdog_interval_ms is validated but NOT YET IMPLEMENTED.
// It is reserved for a future interval-based watchdog polling loop.
// See: https://github.com/.../issues/XXX
watchdog_interval_ms: 10_000,
```

---

## 三、P3 — `buildFailureInjection` 系死代码（🔴 严重）

### 问题描述

**死代码清单**（`retry-controller.ts`）：

| 符号 | 行 | 引用数 |
|------|----|--------|
| `FailureInjection` (interface) | 23-28 | 0（仅声明） |
| `computeFingerprint()` | 60-63 | 1（仅在 buildFailureInjection 内部） |
| `buildFailureInjection()` | 69-83 | 0（全项目无调用） |

**`buildFailureInjection`** 的功能是：比对当前失败指纹与上次失败指纹，若相同则标记 `forceBackoff: true`。这是一个有价值的"连续同类失败检测"机制，但**它从未被插入 `makeRetryDecision` 或 `applyRetryToState` 的调用路径中**。

当前实际运行的连续失败检测为 `null`——相同错误重复发生时不会触发额外退避，只有 `max_retry_per_task` 计数耗尽才会停止。

### 决策思考

这是一个**设计完成但集成未完成**的功能。原始意图清晰且正确：对连续相同错误应施加更激进的退避，避免对固定问题反复快速重试。实现上需要将 `buildFailureInjection` 接入 `makeRetryDecision` 的输入参数中，并在退避计算时考虑 `forceBackoff`。

### 最佳实践方案

**集成路径**（修改 `makeRetryDecision` 签名 + `applyRetryToState`）：

```typescript
// retry-controller.ts
export function makeRetryDecision(
  failureMessage: string,
  retry: AutoLoopRetry,
  config: AutoOrchestrateConfig
): RetryDecision {
  const category = classifyError(failureMessage);
  if (category === 'permanent') return noRetry(category, failureMessage);
  if (isRetryBudgetExhausted(retry, config.max_total_retry_duration_ms))
    return noRetry(category, 'retry_budget_exhausted');
  if (retry.regenerateCount >= config.max_retry_per_task)
    return noRetry(category, 'max_retry_per_task reached');

  // ✅ 集成连续失败检测
  const injection = buildFailureInjection(failureMessage, retry.lastFailureReason);
  const backoffMultiplier = injection.forceBackoff ? 3 : 1;  // 连续同类失败：3× 退避
  const backoffMs = Math.min(
    computeBackoffMs(config.retry_backoff_ms, retry.regenerateCount + 1) * backoffMultiplier,
    30_000
  );

  return { shouldRetry: true, reason: 'retryable', backoffMs, errorCategory: category };
}
```

同时将 `consecutiveCount` 改为真实的递增计数（见 P6 改进）。

---

## 四、P4 — Retry 计数器全局共享，跨任务争抢预算（🟠 高）

### 问题描述

**代码证据**（`todo-runner.ts:28-34` + `retry-controller.ts:171-198`）：

```typescript
export interface AutoLoopRetry {
  regenerateCount: number;    // ← 全 loop 共享，非按任务隔离
  totalRetryDurationMs: number;
  lastFailureReason: string | null;
  // ...
}

// applyRetryToState 中
updatedRetry.regenerateCount = retry.regenerateCount + 1;  // 累加到全局
```

`AutoLoopRetry` 挂在 `state.runtime.autoLoop.retry`（全局单例），每次任何任务失败都累加 `regenerateCount`。

**实际后果**：

```
场景：max_retry_per_task = 3，3 个任务 A/B/C

1. TASK-A 遇临时网络错误，重试 3 次  → regenerateCount = 3
2. TASK-B 开始执行，第一次就失败
3. makeRetryDecision 检查: retry.regenerateCount(3) >= max_retry_per_task(3) → 直接 blocked
   → TASK-B 没有任何重试机会
```

`totalRetryDurationMs` 是全局时间预算，语义正确（全局 15 分钟重试时间上限）。但 `regenerateCount` 代表"每任务最多重试次数"却在全局累加，是语义错误。

### 决策思考

**为什么这样设计**：最初 Auto-Loop 可能设计为单任务场景（`max_parallel=1`，任务串行），在此前提下"全局计数 = 当前任务计数"。随着功能扩展支持多任务，计数器的语义变成了错误的全局累加。

**修改代价**：改变状态数据结构，需要同时修改 `TodoRunnerState`、`applyRetryToState`、`makeRetryDecision`，以及状态文件的版本迁移。代价中等。

### 最佳实践方案

方案一：**最小改动**——在 `TodoItem` 中增加 `retryCount` 字段，`regenerateCount` 降级为任务级计数：

```typescript
// todo-runner.ts
export interface TodoItem {
  id: string;
  title: string;
  status: TodoStatus;
  dependsOn?: string[];
  parallel?: boolean;
  resumeAt?: number;
  retryCount?: number;      // ✅ 新增：当前任务的重试次数（任务隔离）
  lastFailureReason?: string; // ✅ 新增：当前任务的最后失败原因
}
```

```typescript
// auto-loop.ts 中失败路径
// 替换 applyRetryToState（全局）为按任务更新
state = updateTodoItem(state, task.id, {
  retryCount: (task.retryCount ?? 0) + 1,
  lastFailureReason: result.message,
});

// makeRetryDecision 接收任务级计数
const retryDecision = makeRetryDecision(
  result.message,
  { regenerateCount: task.retryCount ?? 0, ... },  // 使用任务级计数
  cfg.runtime.auto_orchestrate
);
```

全局 `AutoLoopRetry.regenerateCount` 可退化为历史统计字段，`totalRetryDurationMs` 保留为全局时间预算（语义正确）。

---

## 五、P5 — 依赖死锁静默消耗 maxIterations（🟠 高）

### 问题描述

**代码证据**（`todo-runner.ts:327-346` + `auto-loop.ts:130-144`）：

```typescript
// ready.length == 0 且 unfinished > 0 时：
const waitingTasks = state.items.filter(
  i => i.status === 'pending' && i.resumeAt !== undefined && i.resumeAt > now
);

if (waitingTasks.length > 0) {
  await sleep(waitMs);  // 有退避任务：等待
  continue;
}

// 否则：直接 advanceTodoIteration()，推进计数，什么都不做
state = advanceTodoIteration(state);
```

当 `ready.length == 0` 且没有退避等待任务，代码**静默推进 iteration**。在以下两种情况下会导致无意义的迭代消耗：

**情况 A — 全部 blocked**：
```
TASK-A → blocked, TASK-B → blocked
unfinished = 2（blocked ≠ done）
waitingTasks = 0
→ advanceTodoIteration() × maxIterations 次，每次什么都不做
→ 最终 haltReason = 'max_iterations reached: 5/5'
→ 用户完全不知道是 A 和 B blocked 导致的
```

**情况 B — 依赖循环**：
```
TASK-A.dependsOn = [TASK-B]
TASK-B.dependsOn = [TASK-A]
两者都是 pending，但 doneSet 永远不包含对方
→ readyPending 永远为空
→ 同上，静默消耗 maxIterations
```

### 决策思考

`advanceTodoIteration` 的原意是处理"本轮无任务可执行，等下轮依赖完成"的正常场景。但它无法区分"依赖尚未完成（下轮可能有）"与"依赖永远不会完成（死锁）"。缺少死锁检测是一个主动设计决策还是遗漏？从代码看是遗漏——因为有完备的 `dependsOn` 图信息，完全可以检测。

### 最佳实践方案

**在 `advanceTodoIteration` 调用前增加死锁诊断**：

```typescript
// auto-loop.ts — ready.length == 0 且 !waitingTasks 分支
function diagnoseStuckReason(state: TodoRunnerState): StuckDiagnosis {
  const pending = state.items.filter(i => i.status === 'pending');
  const blocked = state.items.filter(i => i.status === 'blocked');
  const doneIds = new Set(state.items.filter(i => i.status === 'done').map(i => i.id));

  // 情况 A：所有未完成任务都已 blocked
  if (pending.length === 0 && blocked.length > 0) {
    return { type: 'all_blocked', blockedIds: blocked.map(i => i.id) };
  }

  // 情况 B：存在 pending 任务但依赖未满足（依赖 blocked 或循环依赖）
  const unresolvable = pending.filter(item => {
    const deps = item.dependsOn ?? [];
    return deps.some(dep => {
      const depItem = state.items.find(i => i.id === dep);
      return depItem?.status === 'blocked' || !depItem; // 依赖已 blocked 或不存在
    });
  });
  if (unresolvable.length > 0) {
    return { type: 'dependency_blocked', taskIds: unresolvable.map(i => i.id) };
  }

  // 情况 C：循环依赖（拓扑排序检测）
  if (hasCyclicDependency(pending)) {
    return { type: 'cyclic_dependency' };
  }

  return { type: 'waiting_for_deps' }; // 正常情况，继续迭代
}

// 在调用 advanceTodoIteration 前
const diagnosis = diagnoseStuckReason(state);
if (diagnosis.type !== 'waiting_for_deps') {
  writeAuditLog({ event: 'loop_stuck', featureId, detail: diagnosis }, projectRoot);
  state = haltState(state, `stuck_${diagnosis.type}`);
  checkpoint(state, projectRoot, onCheckpoint);
  return buildResult(state, startIteration, completedTasks);
}
```

---

## 六、P6 — 错误分类依赖字符串匹配，`unknown` 默认重试（🟠 高）

### 问题描述

**代码证据**（`retry-controller.ts:31-55`）：

```typescript
const PERMANENT_ERROR_PATTERNS = [
  'ENOENT', 'EACCES', 'EPERM', 'MODULE_NOT_FOUND',
  'SyntaxError', 'TypeError: Cannot read',
  'schema validation failed', 'missing required field',
];

export function classifyError(message: string): ErrorCategory {
  const lower = message.toLowerCase();
  for (const pattern of PERMANENT_ERROR_PATTERNS) {
    if (lower.includes(pattern.toLowerCase())) return 'permanent';
  }
  if (lower.includes('timeout') || lower.includes('econnrefused') || lower.includes('rate limit')) {
    return 'temporary';
  }
  return 'unknown';  // 既不 permanent 也不 temporary
}
```

在 `makeRetryDecision` 中，`unknown` 直接落入 `shouldRetry: true` 路径——**等同于 `temporary`**。这意味着：
- 业务逻辑错误（"Gate check failed"）→ `unknown` → 重试，浪费 retry 预算
- 规范校验失败（"spec validation error"）→ `unknown` → 重试，重试 3 次后 blocked，问题仍在
- 任何新出现的错误类型（AI 返回新格式的错误消息）→ 默认重试

此外，`computeBackoffMs` 退避上限硬编码为 30s（已在函数内），但 `retry_backoff_ms` 配置的上限是 30000ms，两者一致。然而更大的问题是，无论 `unknown` 还是 `temporary`，退避算法相同——高影响的非临时错误和临时网络错误享受同等退避策略。

### 决策思考

**Fail-open**（当前）：不确定时允许重试，避免因分类不准确导致本可恢复的错误被提前放弃。优点：宽容，适合早期系统。缺点：无效重试噪声大，消耗 retry 预算。

**Fail-close**：不确定时不重试，快速暴露错误。优点：对用户透明。缺点：可能误伤可恢复错误。

**最佳实践**：保持 fail-open，但对 `unknown` 使用**更保守的退避倍数**，并在审计日志中标记，便于分类精化。

### 最佳实践方案

**三步改进**：

```typescript
// 1. 在 ErrorCategory 中区分 unknown
export type ErrorCategory = 'permanent' | 'temporary' | 'unknown';

// 2. makeRetryDecision 中对 unknown 施加更保守的退避
const backoffMultiplier = category === 'unknown' ? 2 : 1;

// 3. 在 applyRetryToState 中记录 unknown 频次，供将来精化
if (category === 'unknown') {
  writeAuditLog({
    event: 'unclassified_error',
    featureId, taskId: task.id,
    detail: { message: failureMessage, fingerprint: computeFingerprint(failureMessage) }
  }, projectRoot);
}
```

**长期**：通过 `unclassified_error` 审计日志，定期 review 高频出现的 unknown 错误指纹，逐步补充到 `PERMANENT_ERROR_PATTERNS` 或 `temporary` 模式中，实现分类库的持续演进。

---

## 七、P7 — Guard 失败直接 `blocked`，内容质量场景语义不符（🟠 高）

### 问题描述

**代码证据**（`auto-loop.ts:192-215`）：

```typescript
if (result.success) {
  const guard = runPostWriteGuards(task, result, featureId, projectRoot);
  if (!guard.passed) {
    state = updateTodoStatus(state, task.id, 'blocked');  // ← 永久 blocked
    if (cfg.runtime.auto_orchestrate.stop_on_blocked) {
      state = haltState(state, 'blocked', task.id);
      return buildResult(...);
    }
    continue;
  }
  state = updateTodoStatus(state, task.id, 'done');
}
```

`runPostWriteGuards` 包含 3 类检查：

| 检查类型 | 失败含义 | 当前处理 | 期望处理 |
|---------|---------|---------|---------|
| `checkRequiredMcps` | MCP 工具缺失 | blocked | blocked ✅（正确，环境问题） |
| `runFullCompletionDetection` | 输出不完整（空标题等）| blocked | retry with context ❌ |
| `runSlopCheck` | 输出含 AI 废话 | blocked | retry with context ❌ |

后两类 guard 失败是**内容质量问题**，不是环境配置问题。对于 AI 生成的内容，触发修正重试（携带 "你上次输出了空标题，请修正"的上下文）比直接 blocked 更有意义。当前把所有 guard 失败一视同仁处理为 `blocked`，相当于把"第一次输出草稿不够好"等同于"任务永久失败"。

### 决策思考

Guard 检查发生在 `result.success = true` 之后，即 executor 正常返回但输出质量不达标。这类失败的本质是**需要 AI 修正输出**（self-correction），而非需要人工介入（blocked）。当前设计将这两类混为一谈。

关键区别：
- `blocked` → 需要人工介入，系统停止
- `retry with correction context` → AI 可自我修正，系统继续

### 最佳实践方案

**引入 `GuardFailurePolicy` 区分处理策略**：

```typescript
// 在 runPostWriteGuards 返回结果中携带策略
export interface GuardResult {
  passed: boolean;
  reason?: string;
  policy?: 'block' | 'retry_with_correction';  // ✅ 新增
}

// runPostWriteGuards 修改
function runPostWriteGuards(...): GuardResult {
  const mcpCheck = checkRequiredMcps(...);
  if (!mcpCheck.passed) {
    return { passed: false, reason: '...', policy: 'block' };  // 环境问题 → block
  }

  const completion = runFullCompletionDetection(output, markers);
  if (!completion.passed) {
    return { passed: false, reason: '...', policy: 'retry_with_correction' };  // 质量问题 → retry
  }

  const slop = runSlopCheck(output, loadSlopRules(projectRoot));
  if (!slop.passed) {
    return { passed: false, reason: '...', policy: 'retry_with_correction' };  // 质量问题 → retry
  }
  return { passed: true };
}

// auto-loop.ts 调用处
if (!guard.passed) {
  if (guard.policy === 'retry_with_correction') {
    // 作为带上下文的失败触发重试路径
    const syntheticResult: TaskResult = {
      success: false,
      message: `GUARD_CORRECTION:${guard.reason}`,  // GUARD_CORRECTION 前缀 → temporary
    };
    // 走正常 retry 路径，携带 guard 原因作为修正提示
    const retryDecision = makeRetryDecision(syntheticResult.message, retryState, config);
    // ...
  } else {
    state = updateTodoStatus(state, task.id, 'blocked');  // 环境问题 → blocked
  }
}
```

---

## 八、P8 — Guard 规则每次任务都从磁盘重新加载（🟡 中）

### 问题描述

**代码证据**（`auto-loop.ts:runPostWriteGuards`）：

```typescript
// 每次任务完成都调用：
const markers = loadCompletionMarkers(skillMeta, projectRoot);  // 磁盘 I/O
const slopReport = runSlopCheck(output, loadSlopRules(projectRoot));  // 磁盘 I/O
```

`loadCompletionMarkers` 尝试读取 `.spec-first/default-markers.yaml`（文件不存在时降级为 DEFAULT_MARKERS）。`loadSlopRules` 尝试读取 `.spec-first/slop-rules.yaml`。在 N 个任务的 Loop 中，这是 **2N 次文件 I/O 操作**，且每次结果相同（规则文件在 Loop 期间不会改变）。

### 最佳实践方案

在 `runAutoLoop` 初始化阶段一次性加载，传递给 `runPostWriteGuards`：

```typescript
// auto-loop.ts — 循环外预加载
const completionMarkers = loadCompletionMarkers(undefined, projectRoot);
const slopRules = loadSlopRules(projectRoot);

// runPostWriteGuards 接受 pre-loaded rules
function runPostWriteGuards(
  task, result, featureId, projectRoot,
  preloadedMarkers?: CompletionMarker[],  // ✅ 新增
  preloadedSlopRules?: SlopRule[]          // ✅ 新增
): GuardResult {
  const markers = preloadedMarkers ?? loadCompletionMarkers(skillMeta, projectRoot);
  const slopRules = preloadedSlopRules ?? loadSlopRules(projectRoot);
  // ...
}
```

改动范围小，收益明确，不影响正确性。

---

## 九、P9 — `in_progress` 进程重启后的语义歧义（🟡 中）

### 问题描述

**代码证据**（`todo-runner.ts:pickReadyTodos:264-266`）：

```typescript
const inProgress = state.items.filter(i => i.status === 'in_progress');
if (inProgress.length > 0) return inProgress.slice(0, maxParallel);
```

进程崩溃（OOM、SIGKILL、未捕获异常）时，`todo-state.json` 保留任务的 `in_progress` 状态。重启后 `pickReadyTodos` 会将其作为"仍在执行中的任务"重新执行。

**问题**：executor 是否已经产生了部分副作用？`idempotentWrite` 保障了文件写入的幂等性，但这仅覆盖了最终输出文件。如果 executor 在中途已调用外部 API、触发 CI job、发送通知，重新执行会产生重复调用。

另外，`taskStartedAt` 在重启后仍记录崩溃前的时间，`checkTaskTimeout` 在第一次 watchdog 检查时可能**立即触发超时**（距 taskStartedAt 已超过 max_task_duration_ms），导致本可成功的任务被判超时 blocked。

### 最佳实践方案

```typescript
// 在 ensureAutoLoopState 或 loadTodoState 之后，重置 stale in_progress
function recoverStaleInProgress(state: TodoRunnerState): TodoRunnerState {
  const now = Date.now();
  const staleThresholdMs = 60_000; // 启动后 1 分钟内的 in_progress 视为 stale

  const items = state.items.map(item => {
    if (item.status !== 'in_progress') return item;

    const taskStartedAt = state.runtime?.autoLoop?.taskStartedAt;
    if (!taskStartedAt) return { ...item, status: 'pending' as TodoStatus };

    const elapsed = now - new Date(taskStartedAt).getTime();
    if (elapsed > state /* max_task_duration_ms，从 config 传入 */) {
      // 已超过最大任务时长，重置为 pending，标记崩溃恢复
      writeAuditLog({ event: 'crash_recovery', taskId: item.id, detail: { elapsed } });
      return { ...item, status: 'pending' as TodoStatus, retryCount: (item.retryCount ?? 0) + 1 };
    }
    return item;
  });

  return { ...state, items };
}
```

同时将 `currentTaskId` 和 `taskStartedAt` 在重置时清空，避免 watchdog 在重启后立即误判超时。

---

## 十、P10 — `stop_on_blocked=false` 时下游任务一致性无保障（🟡 中）

### 问题描述

当 `stop_on_blocked = false`，某任务 blocked 后 loop 继续执行其他任务。若其他任务依赖 blocked 任务的产物（文件写入、ID 注册、矩阵更新），继续执行会产生：

1. **级联错误**：下游任务因缺少上游产物失败，但失败原因指向自身而非根因
2. **根因遮蔽**：审计日志中充满下游错误，真正的上游 blocked 被淹没
3. **partial success 状态**：部分任务完成但整体状态不一致，难以重入

当前 `pickReadyTodos` 只检查 `dependsOn` 字段，但 `dependsOn` 不覆盖隐式产物依赖（任务 A 写 design.md，任务 B 读 design.md 但没有声明 dependsOn A）。

### 最佳实践方案

**语义收紧**：将 `stop_on_blocked` 默认值从 `true` 改为严格语义——blocked 任务的直接和间接下游**自动 skipped**：

```typescript
// 当 stop_on_blocked = false 时，propagate blocked status to dependents
function propagateBlockedStatus(state: TodoRunnerState, blockedTaskId: string): TodoRunnerState {
  const dependents = state.items.filter(
    i => i.dependsOn?.includes(blockedTaskId) && i.status === 'pending'
  );

  let updated = state;
  for (const dep of dependents) {
    updated = updateTodoStatus(updated, dep.id, 'blocked');
    updated = propagateBlockedStatus(updated, dep.id);  // 递归传播
    writeAuditLog({ event: 'cascade_blocked', taskId: dep.id,
                    detail: { cause: blockedTaskId } }, projectRoot);
  }
  return updated;
}
```

这样 `stop_on_blocked=false` 的语义从"忽略 blocked 继续全速执行"变为"blocked 任务的下游自动跳过，无依赖任务继续执行"，既保留了并行执行的价值，又避免了级联错误。

---

## 十一、整体架构视角：根因聚类

以上 10 个问题归根到底来自 **3 个根因**：

### 根因 A：时间保障机制存在概念漏洞

P1（Watchdog 无法中断）和 P2（`watchdog_interval_ms` 未使用）同根——系统承诺了时间上限（配置、文档、代码注释），但实现上依赖同步等待后才能检测超时。修复入口唯一：**独立的异步 Watchdog 轮询 + `Promise.race` 竞争超时**，激活已存在的 `watchdog_interval_ms` 配置。

### 根因 B：接口定义与调用路径脱节

P3（`buildFailureInjection` 死代码）是典型的"设计完但未集成"。这类问题在 AI 协同开发场景下尤其容易出现——AI 生成了接口和逻辑，但未完成将其插入调用链的最后一步。**需要集成测试覆盖关键路径**：如果 `buildFailureInjection` 被设计为在 retry 路径中调用，对应的集成测试应当能发现它从未被调用。

### 根因 C：状态设计粒度与业务语义不匹配

P4（retry 计数全局共享）、P7（guard 失败语义）、P10（blocked 传播）都源于**状态的粒度设计**：全局单例状态无法表达"per-task 的独立生命周期"，导致任务之间共享了本该隔离的资源（retry budget），或者把不同性质的失败（环境失败 vs 质量失败）映射到了同一个状态（blocked）。

---

## 十二、优化路线图

### 阶段一：快速修复（低风险，高价值）

| 改动 | 问题 | 影响范围 |
|------|------|---------|
| `Promise.race` 竞争 executor 超时 | P1 | auto-loop.ts 约 10 行 |
| `TASK_TIMEOUT:` 加入 PERMANENT_ERROR_PATTERNS | P1 | retry-controller.ts 1 行 |
| `watchdog_interval_ms` 标注为 reserved | P2 | config-schema.ts 注释 |
| `buildFailureInjection` 集成到 makeRetryDecision | P3 | retry-controller.ts 约 15 行 |
| Guard 规则预加载（循环外一次性读取） | P8 | auto-loop.ts 约 5 行 |
| 修复 `max_parallel` 默认值一致性 | — | pickReadyTodos 1 行 |

### 阶段二：核心改造（中风险，解决系统性问题）

| 改动 | 问题 | 影响范围 |
|------|------|---------|
| `TodoItem.retryCount` 字段隔离 retry 计数 | P4 | 状态结构 + migration |
| 死锁检测 + `haltReason: stuck_all_blocked` | P5 | todo-runner.ts 约 40 行 |
| `GuardResult.policy` 区分 block/retry | P7 | guard 接口 + 调用链 |
| Crash recovery：`in_progress` 重置 | P9 | loadTodoState 后处理 |
| Blocked 级联传播 | P10 | propagateBlockedStatus 约 25 行 |

### 阶段三：完整 Watchdog（完成设计意图）

| 改动 | 问题 | 影响范围 |
|------|------|---------|
| 实现 interval watchdog 轮询 | P1/P2 | 新建 watchdog-runner.ts |
| executor 接受 `AbortSignal` | P1 | executor 接口 + 调用方 |
| `watchdog_interval_ms` 正式生效 | P2 | runAutoLoop 初始化 |

---

## 十三、值得保留的设计亮点

这些设计值得在重构中保护：

- **`totalRetryDurationMs` 全局时间预算**：比计数限制更准确地反映"已消耗多少重试资源"，是 P4 改造中唯一应保留为全局的字段
- **`idempotentWrite`**：写操作幂等，崩溃重启安全，是 P9 问题缓解的基础
- **三层 CompletionMarker 优先级**（Skill 级 → 项目级 → 全局默认）：可扩展的规则层次设计
- **`writeAuditLog` 全覆盖**：每个状态转换均有审计记录，是 P5 死锁诊断改进的落地基础
- **`backoffMs` 指数上限 30s**：避免退避时间无限增长，对长时间运行的 loop 友好
- **`parallel: boolean` on TodoItem**：细粒度并行控制已在数据结构层面支持

---

*生成时间：2026-03-13 | 代码逐行验证 | 审查者：Claude Code (Sonnet 4.6)*
*代码证据：src/core/ai-orchestrator/（auto-loop.ts · todo-runner.ts · retry-controller.ts · watchdog.ts · completion-detector.ts · slop-checker.ts · config-schema.ts）*
