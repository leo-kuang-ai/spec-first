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
| P6 | 错误分类依赖字符串匹配，`unknown` 被静默丢弃为 blocked | 🔴 严重 | 功能性缺陷 | 低 |
| P7 | Guard 失败直接 `blocked`，语义与内容质量场景不符 | 🟠 高 | 语义错误 | 中 |
| P8 | Slop 规则和完成标记每次任务都从磁盘重新加载 | 🟡 中 | 性能 | 低 |
| P9 | `in_progress` 在进程重启后语义歧义 | 🟡 中 | 健壮性 | 中 |
| P10 | `stop_on_blocked=false` 时下游一致性无保障 | 🟡 中 | 设计缺陷 | 中 |

**整体评价**：骨架设计优秀，关注点分离清晰，审计日志完善。但有三类高危问题：一是 **P1 根本无法实现其声称保障的机制**——面对挂起的 executor，所有超时配置形同虚设；二是 **P3 死代码** + **P2 死配置**制造了"系统已有连续失败检测和超时轮询"的假象；三是 **P6 `unknown` 错误被静默丢弃**——`makeRetryDecision` 返回 `shouldRetry: true` 但调用方 `auto-loop.ts:254` 只认 `temporary`，导致 `unknown` 错误被当作 permanent 处理且白消耗重试预算，属于契约违反 bug。

---

## 一、P1 — Watchdog 无法中断运行中的 executor（🔴 严重）

### 问题描述

**代码证据**（`auto-loop.ts:172-184`）：

```typescript
// auto-loop.ts:172 — 标记任务开始（设置 heartbeatAt / taskStartedAt）
state = markTaskStarted(state, task.id);

// auto-loop.ts:178 — ❌ executor 是 await，一旦挂起则永远卡在这里
const result = await executor(task, state);

// auto-loop.ts:181-184 — Watchdog 检查在 await 之后，executor 不返回则永远不会执行
state = updateHeartbeat(state);
state = updateWatchdogCheckedAt(state);
const watchdogResult = runWatchdogCheck(state, cfg.runtime.auto_orchestrate);
```

**`markTaskStarted`**（`auto-loop.ts:451-466`）确实在任务开始时设置了 `heartbeatAt` 和 `taskStartedAt`。但 **`updateHeartbeat()`** 只在 `executor()` 返回后才被调用（`auto-loop.ts:181`），**`runWatchdogCheck()`** 也只在 `executor()` 返回后才被调用（`auto-loop.ts:184`）。

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

**近期方案（止血，不是完整取消）**：用 `Promise.race` 竞争，至少让 Auto-Loop 主循环不再永久卡死：

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

这个方案的边界必须写清：它只能让 `runAutoLoop()` 先返回超时结果，**不能自动终止** executor 内部已经发出的异步操作。若 executor 内部已调用 LLM API、文件流、子进程或网络请求，这些操作仍可能继续运行。

因此，`TASK_TIMEOUT:` 前缀可以加入错误分类，但不应被描述为"真正中断任务"。

**完整方案（最佳实践）**：将 `AbortController` 作为统一取消契约贯穿 executor，再用 watchdog/timeout 驱动 `abort()`：

```typescript
// watchdog-runner.ts（新建）
export function startWatchdog(
  getState: () => TodoRunnerState,
  onTimeout: () => void,
  intervalMs: number,
  config: AutoOrchestrateConfig
): NodeJS.Timeout {
  return setInterval(() => {
    const state = getState();
    const result = runWatchdogCheck(state, config);
    if (result?.event === 'task_timeout' || result?.event === 'heartbeat_stalled') {
      onTimeout();
    }
  }, intervalMs);
}

// auto-loop.ts 中
const abortController = new AbortController();
const watchdogTimer = startWatchdog(
  () => state,
  () => { abortController.abort(); },
  cfg.runtime.auto_orchestrate.watchdog_interval_ms,
  cfg.runtime.auto_orchestrate
);
try {
  const result = await executor(task, state, { signal: abortController.signal });
} finally {
  clearInterval(watchdogTimer);
}
```

注意：**仅有 interval watchdog 仍不够**。如果 executor 及其下游 API 不接受 `AbortSignal`，watchdog 依旧只能"检测并标记超时"，不能真正停止工作。Node 运行时的通用最佳实践是把 `AbortSignal` 传给具体异步 API，并在 abort 时得到 `AbortError`；watchdog 负责触发 abort，而不是代替取消契约本身。

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

> **注意**：`buildFailureInjection` 的**当前签名**是 `(reason: string, previousReason: string | null)`，下方方案展示的是 P4 改造完成后的**目标签名**。建议分两步实施：先用当前签名集成（传 `retry.lastFailureReason`），再随 P4 改造一起迁移到任务级状态。

**第一步：用当前签名最小集成**（不依赖 P4）：

```typescript
// retry-controller.ts — makeRetryDecision 中插入 buildFailureInjection
export function makeRetryDecision(
  failureMessage: string,
  retry: AutoLoopRetry,
  config: AutoOrchestrateConfig
): RetryDecision {
  const category = classifyError(failureMessage);
  if (category === 'permanent') {
    return { shouldRetry: false, reason: `permanent error: ${failureMessage}`, backoffMs: 0, errorCategory: category };
  }
  if (isRetryBudgetExhausted(retry, config.max_total_retry_duration_ms)) {
    return { shouldRetry: false, reason: 'retry_budget_exhausted', backoffMs: 0, errorCategory: category };
  }
  if (retry.regenerateCount >= config.max_retry_per_task) {
    return { shouldRetry: false, reason: `max_retry_per_task reached`, backoffMs: 0, errorCategory: category };
  }

  // ✅ 集成连续失败检测（当前签名，传 retry.lastFailureReason）
  const injection = buildFailureInjection(failureMessage, retry.lastFailureReason);
  const consecutiveMultiplier = injection.forceBackoff ? 3 : 1;
  const unknownMultiplier = category === 'unknown' ? 2 : 1;
  const backoffMs = Math.min(
    computeBackoffMs(config.retry_backoff_ms, retry.regenerateCount + 1)
      * consecutiveMultiplier * unknownMultiplier,
    30_000
  );

  return { shouldRetry: true, reason: 'retryable', backoffMs, errorCategory: category };
}
```

**第二步：P4 改造后迁移到任务级状态**（目标签名）：

```typescript
// todo-runner.ts — TodoItem 补充字段（与 P4 方案合并，见下节）
export interface TodoItem {
  // ...（P4 新增的 retryCount / lastFailureReason）
  consecutiveErrorCount?: number;  // ✅ 新增：当前任务连续相同失败次数
}

// retry-controller.ts — buildFailureInjection 改为接收任务级状态
export function buildFailureInjection(
  currentMessage: string,
  task: Pick<TodoItem, 'lastFailureReason' | 'consecutiveErrorCount'>
): FailureInjection {
  const currentFp = computeFingerprint(currentMessage);
  const previousFp = task.lastFailureReason
    ? computeFingerprint(task.lastFailureReason)
    : null;

  const isSameError = currentFp === previousFp;
  const consecutiveCount = isSameError ? (task.consecutiveErrorCount ?? 0) + 1 : 1;

  return {
    forceBackoff: consecutiveCount >= 2,  // 连续 2 次同类失败触发加速退避
    consecutiveCount,
    fingerprint: currentFp,
  };
}
```

`consecutiveErrorCount` 的写入时机和写入方式见 **P4 方案**的失败路径代码（`buildFailureInjection` 调用 → `updateTodoItem` 同步更新），P3 只负责将 `buildFailureInjection` 插入 `makeRetryDecision` 调用链。

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
  retryCount?: number;            // ✅ 新增：当前任务的重试次数（任务隔离）
  lastFailureReason?: string;     // ✅ 新增：当前任务的最后失败原因
  consecutiveErrorCount?: number; // ✅ 新增：连续相同失败次数（P3 集成）
}
```

```typescript
// auto-loop.ts 中失败路径
// ⚠️ 顺序关键：先决策（用当前 retryCount 判断是否耗尽），再更新状态（写入 +1）
// 若先更新再决策，makeRetryDecision 看到的 retryCount 已是递增后的值，
// 导致第 max_retry_per_task 次失败时被误判为"超出上限"，实际少重试一次。
const injection = buildFailureInjection(result.message, task);

// Step 1: 基于当前 task（未递增）做重试决策
const retryDecision = makeRetryDecision(
  result.message,
  task,                               // 包含当前 retryCount / lastFailureReason / consecutiveErrorCount
  state.runtime.autoLoop.retry,       // 仅传递 totalRetryDurationMs（全局预算）
  cfg.runtime.auto_orchestrate
);

// Step 2: 无论是否重试，都更新任务级失败状态
state = updateTodoItem(state, task.id, {
  retryCount: (task.retryCount ?? 0) + 1,
  lastFailureReason: result.message,
  consecutiveErrorCount: injection.consecutiveCount,
});
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

**情况 B — 依赖已死（Dep Blocked/Missing）**：
```
TASK-A.dependsOn = [TASK-B]
TASK-B.status = blocked（或 TASK-B 根本不存在）
→ TASK-A 的依赖永远无法满足
→ readyPending 永远为空
→ 同上，静默消耗 maxIterations
```

**情况 C — 循环依赖（Cyclic Dependency）**：
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

  // 前提：P9 的 recoverInterruptedRun 已在 runAutoLoop 入口执行，
  // 所有崩溃残留的 in_progress 僵尸任务已重置为 pending 或 interrupted。
  // 此处不应存在 in_progress 任务——若存在，属于 P9 场景，需先处理恢复逻辑。

  // 情况 A：所有未完成任务都已 blocked（无 pending 可调度）
  if (pending.length === 0 && blocked.length > 0) {
    return { type: 'all_blocked', blockedIds: blocked.map(i => i.id) };
  }

  // 情况 B：存在 pending 任务，但某个依赖已 blocked 或根本不存在（永远无法满足）
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

  // 情况 C：依赖都是 pending，但存在环（DFS 检测）

  const visited = new Set<string>();
  const inStack = new Set<string>();
  function hasCycle(id: string): boolean {
    if (inStack.has(id)) return true;
    if (visited.has(id)) return false;
    visited.add(id); inStack.add(id);
    const item = pending.find(i => i.id === id);
    for (const dep of item?.dependsOn ?? []) {
      if (hasCycle(dep)) return true;
    }
    inStack.delete(id);
    return false;
  }
  if (pending.some(i => hasCycle(i.id))) {
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

## 六、P6 — 错误分类依赖字符串匹配，`unknown` 被静默丢弃为 blocked（🔴 严重）

### 问题描述

**代码证据一**（`retry-controller.ts:46-56`）：

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

在 `makeRetryDecision` 中，`unknown` 确实落入 `shouldRetry: true` 路径。**但问题比这更严重**——调用方 `auto-loop.ts:254` 存在一个额外的过滤条件，导致 `unknown` 的重试决策被静默丢弃：

**代码证据二**（`auto-loop.ts:254`）：

```typescript
// ❌ 只有 temporary 才进入重试分支，unknown 被静默跳过
if (retryDecision.shouldRetry && retryDecision.errorCategory === 'temporary') {
  state = updateTodoStatus(state, task.id, 'pending');
  state = setTodoResumeAt(state, task.id, Date.now() + retryDecision.backoffMs);
  // ...
  continue;
}

// unknown 虽然 shouldRetry=true，但 errorCategory≠'temporary'
// → 直接落到这里，被当作不可重试处理
state = updateTodoStatus(state, task.id, 'blocked');
```

**实际行为链**（与原报告描述相反）：

```
1. classifyError("Gate check failed") → 'unknown'
2. makeRetryDecision → { shouldRetry: true, errorCategory: 'unknown', backoffMs: 2000 }
3. applyRetryToState → regenerateCount++ （白消耗一次重试预算）
4. auto-loop.ts:254 检查: shouldRetry(true) && errorCategory === 'temporary'(false) → 跳过重试
5. → 直接 blocked
```

这意味着：
- `unknown` 错误**不是**"默认重试"，而是**被当作 permanent 处理**（直接 blocked）
- 但 `applyRetryToState` 已在第 3 步递增了 `regenerateCount`——**白消耗了一次全局重试预算**
- `makeRetryDecision` 的返回值（`shouldRetry: true`）与调用方的实际行为矛盾——这是一个**契约违反 bug**
- 业务逻辑错误、规范校验失败、AI 返回新格式错误消息 → 全部一次 blocked，零重试机会

### 决策思考

这不是 fail-open vs fail-close 的设计选择问题，而是一个**调用方与被调用方契约不一致的 bug**。`makeRetryDecision` 承诺 `shouldRetry: true` 意味着"应该重试"，但 `auto-loop.ts` 额外加了 `errorCategory === 'temporary'` 的硬过滤，等于单方面否决了 `unknown` 的重试决策。

两种可能的原因：
1. **有意为之但未文档化**：开发者认为只有明确的 `temporary` 错误才值得重试，但没有同步修改 `makeRetryDecision` 的逻辑（应该对 `unknown` 返回 `shouldRetry: false`）
2. **无意遗漏**：条件应该是 `!== 'permanent'` 而非 `=== 'temporary'`，`unknown` 被意外排除

无论哪种，当前状态都是错误的——要么修复调用方条件，要么修复 `makeRetryDecision` 的返回值，两者必须对齐。

### 最佳实践方案

**立即修复（1 行）**：将 `auto-loop.ts:254` 的条件从 `=== 'temporary'` 改为 `!== 'permanent'`：

```typescript
// auto-loop.ts:254 — 修复 unknown 错误被静默丢弃的 bug
if (retryDecision.shouldRetry && retryDecision.errorCategory !== 'permanent') {
  state = updateTodoStatus(state, task.id, 'pending');
  state = setTodoResumeAt(state, task.id, Date.now() + retryDecision.backoffMs);
  // ...
  continue;
}
```

这样 `unknown` 错误会正确进入重试路径，与 `makeRetryDecision` 的契约一致。

**进一步改进**（与 P3 联动）：对 `unknown` 使用更保守的退避倍数（2×），并在审计日志中标记，便于分类精化：

```typescript
// retry-controller.ts — makeRetryDecision 中
const unknownMultiplier = category === 'unknown' ? 2 : 1;
const backoffMs = Math.min(
  computeBackoffMs(config.retry_backoff_ms, retry.regenerateCount + 1) * unknownMultiplier,
  30_000
);

// auto-loop.ts — 失败路径中记录 unknown 频次
if (retryDecision.errorCategory === 'unknown') {
  writeAuditLog({
    event: 'unclassified_error',
    featureId, taskId: task.id,
    detail: { message: result.message }
  }, projectRoot);
}
```

**长期**：通过 `unclassified_error` 审计日志，定期 review 高频出现的 unknown 错误，逐步补充到 `PERMANENT_ERROR_PATTERNS` 或 `temporary` 模式中，实现分类库的持续演进。

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

**方向正确，但必须补齐 executor 修正输入契约**。更稳妥的做法不是把 guard 失败简单包装成普通 retry，而是显式区分：

- `block`：环境或前置条件问题，需要人工介入
- `retry_with_correction`：输出质量问题，需要把结构化纠错信息重新喂给 executor

```typescript
export interface GuardResult {
  passed: boolean;
  reason?: string;
  policy?: 'block' | 'retry_with_correction';
  correctionHint?: string;
}
```

`correctionHint` 需要持久化到任务状态，以便下次执行时 executor 能读取。在 `TodoItem` 中声明该字段：

```typescript
// todo-runner.ts — TodoItem 增加纠错字段（与 P4 的 retryCount 并排）
correctionHint?: string;  // ✅ Guard 纠错信息，executor 通过 task.correctionHint 读取
```

```typescript
export interface TaskExecutorContext {
  signal?: AbortSignal;
  correctionHint?: string;
}

export type TaskExecutor = (
  task: TodoItem,
  state: TodoRunnerState,
  context?: TaskExecutorContext
) => Promise<TaskResult>;
```

**引入 `GuardFailurePolicy` 区分处理策略**：

```typescript
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
    // 将纠错信息存储到 TodoItem.correctionHint，executor 下次执行时通过 task.correctionHint 读取
    state = updateTodoItem(state, task.id, {
      correctionHint: guard.correctionHint ?? guard.reason ?? '',
    });
    const retryDecision = makeRetryDecision(
      `GUARD_CORRECTION:${guard.reason}`,
      task,                              // 任务级 retryCount / lastFailureReason
      state.runtime.autoLoop.retry,      // 全局时间预算
      config
    );
    // ✅ 应用退避时间，将任务加入延迟重试队列
    // ⚠️ 必须同步递增 retryCount：guard correction 与普通失败共享同一重试预算，
    //    否则质量问题可无限循环重试，永远不会耗尽 max_retry_per_task。
    if (retryDecision.shouldRetry) {
      state = updateTodoItem(state, task.id, {
        resumeAt: Date.now() + retryDecision.backoffMs,
        retryCount: (task.retryCount ?? 0) + 1,
        lastFailureReason: `GUARD_CORRECTION:${guard.reason}`,
      });
    } else {
      state = updateTodoStatus(state, task.id, 'blocked');  // 重试预算耗尽 → blocked
    }
  } else {
    state = updateTodoStatus(state, task.id, 'blocked');  // 环境问题 → blocked
  }
}
```

如果不修改 executor 输入契约，只是把错误文案改成 `GUARD_CORRECTION:*`，下一次重试大概率仍会走同一条提示链路，无法保证模型真正看见纠错信息。这种做法只能算启发式补丁，不应表述为最佳实践。

---

## 八、P8 — Guard 规则每次任务都从磁盘重新加载（🟡 中）

### 问题描述

**代码证据**（`auto-loop.ts:runPostWriteGuards`）：

```typescript
// 每次任务完成都调用：
const markers = loadCompletionMarkers(skillMeta, projectRoot);  // 磁盘 I/O
const slopReport = runSlopCheck(output, loadSlopRules(projectRoot));  // 磁盘 I/O
```

`loadCompletionMarkers` 尝试读取 `.spec-first/default-markers.yaml`（文件不存在时降级为 DEFAULT_MARKERS）。`loadSlopRules` 尝试读取 `.spec-first/slop-rules.yaml`。这里需要区分两类规则：

- `slopRules`：项目级，Loop 期间通常不变，适合缓存
- `completionMarkers`：**不一定相同**，因为 `loadCompletionMarkers` 优先读取 `skillMeta.completion_markers`

因此，"每次结果相同"只对项目级 slop 规则稳定成立，对 completion markers 并不总成立。

### 最佳实践方案

应当做**分层缓存**，而不是把最终 markers 在 loop 外预加载成一份：

```typescript
// auto-loop.ts — 循环外预加载项目级规则
const slopRules = loadSlopRules(projectRoot);
const projectDefaultMarkers = loadProjectDefaultMarkers(projectRoot);

// runPostWriteGuards 内仍先尊重 skill front matter
function runPostWriteGuards(
  task, result, featureId, projectRoot,
  preloadedProjectMarkers?: CompletionMarker[],
  preloadedSlopRules?: SlopRule[]
): GuardResult {
  const markers =
    skillMeta.completion_markers?.length
      ? skillMeta.completion_markers
      : (preloadedProjectMarkers ?? loadCompletionMarkers(undefined, projectRoot));
  const slopRules = preloadedSlopRules ?? loadSlopRules(projectRoot);
  // ...
}
```

这样既减少 I/O，又不会破坏 Skill 级 markers 的优先级语义。

---

## 九、P9 — `in_progress` 进程重启后的语义歧义（🟡 中）

### 问题描述

**代码证据**（`todo-runner.ts:pickReadyTodos:264-266`）：

```typescript
const inProgress = state.items.filter(i => i.status === 'in_progress');
if (inProgress.length > 0) return inProgress.slice(0, maxParallel);
```

进程崩溃（OOM、SIGKILL、未捕获异常）时，`todo-state.json` 保留任务的 `in_progress` 状态。重启后 `pickReadyTodos` 会将其作为"仍在执行中的任务"重新执行。

**更严重的调度副作用**：`pickReadyTodos` 内部有一条早返回逻辑——只要存在任何 `in_progress` 任务，**立即返回这些任务并跳过所有 `pending` 任务**（`todo-runner.ts:264-266`）。这意味着崩溃后残留的单个 `in_progress` 僵尸任务会阻塞整个任务队列：新的 pending 任务永远不会被调度，直到该僵尸任务被手动清理或超时 blocked。

**问题**：executor 是否已经产生了部分副作用？`idempotentWrite` 保障了文件写入的幂等性，但这仅覆盖了最终输出文件。如果 executor 在中途已调用外部 API、触发 CI job、发送通知，重新执行会产生重复调用。

另外，`taskStartedAt` 在重启后仍记录崩溃前的时间，`checkTaskTimeout` 在第一次 watchdog 检查时可能**立即触发超时**（距 taskStartedAt 已超过 max_task_duration_ms），导致本可成功的任务被判超时 blocked。

### 最佳实践方案

这里不能把"超过固定阈值就重置为 pending"写成通用最佳实践，因为 executor 可能有外部副作用。更稳妥的恢复策略是**分离运行态清理**与**任务是否自动重试**两个决策。

下面的代码展示**最小可行恢复**：清空瞬时运行态 + 将任务重置为 `pending`，适用于 executor 已确认幂等的场景：

```typescript
function recoverInterruptedRun(state: TodoRunnerState): TodoRunnerState {
  const items = state.items.map((item) =>
    item.status === 'in_progress'
      ? { ...item, status: 'pending' as TodoStatus }
      : item
  );

  return {
    ...state,
    items,
    runtime: {
      ...state.runtime,
      autoLoop: state.runtime?.autoLoop
        ? {
            ...state.runtime.autoLoop,
            currentTaskId: undefined,
            taskStartedAt: undefined,
            heartbeatAt: undefined,
            watchdogCheckedAt: undefined,
          }
        : undefined,
    },
  };
}
```

若 executor 可能触发外部 API、通知、CI job，**最小可行恢复不够安全**：重新进入 `pending` 后的重试会产生重复副作用。更严格的扩展方向是引入 `interrupted` 状态（需扩展 `TodoStatus` 类型），由调度器或人工策略决定是否重试，而非自动回到队列。无论采用哪种策略，**清空运行态**（`taskStartedAt`/`heartbeatAt` 等 4 个字段）是最低要求——这能避免 watchdog 在重启后按旧时间戳立即判超时 blocked。

**调用位置**：`recoverInterruptedRun` 应在 `runAutoLoop` 入口处、读取 `todo-state.json` 之后、第一次调用 `pickReadyTodos` 之前执行。若在首次调度后才执行，僵尸 `in_progress` 任务已被 `pickReadyTodos` 捡起重新执行，恢复逻辑无意义。与 P5 的 `diagnoseStuckReason` 有依赖顺序：诊断函数假设崩溃恢复已完成，若 `recoverInterruptedRun` 未先行，`diagnoseStuckReason` 可能误判 `in_progress` 僵尸任务为"正常调度中"。

```typescript
// runAutoLoop 入口（伪代码，展示调用顺序）
let state = loadTodoState(projectRoot, featureId);
state = recoverInterruptedRun(state);      // ← P9：必须在第一次 pickReadyTodos 之前
checkpoint(state, projectRoot);            // 持久化恢复后状态
// ... 进入主循环
```

---

## 十、P10 — `stop_on_blocked=false` 时下游任务一致性无保障（🟡 中）

### 问题描述

当 `stop_on_blocked = false`，某任务 blocked 后 loop 继续执行其他任务。若其他任务依赖 blocked 任务的产物（文件写入、ID 注册、矩阵更新），继续执行会产生：

1. **级联错误**：下游任务因缺少上游产物失败，但失败原因指向自身而非根因
2. **根因遮蔽**：审计日志中充满下游错误，真正的上游 blocked 被淹没
3. **partial success 状态**：部分任务完成但整体状态不一致，难以重入

当前 `pickReadyTodos` 只检查 `dependsOn` 字段，但 `dependsOn` 不覆盖隐式产物依赖（任务 A 写 design.md，任务 B 读 design.md 但没有声明 dependsOn A）。

### 最佳实践方案

**收紧 `stop_on_blocked=false` 的下游传播语义**：当前该模式等同于"忽略 blocked 继续全速执行"，改为 blocked 任务的直接和间接下游**自动级联 blocked**：

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

这样 `stop_on_blocked=false` 的语义从"忽略 blocked 继续全速执行"变为"blocked 任务的直接/间接下游自动级联 blocked，无显式依赖的任务继续执行"，既保留了并行执行的价值，又避免了级联错误。

---

## 十一、整体架构视角：根因聚类

以上 10 个问题归根到底来自 **3 个根因**：

### 根因 A：时间保障机制存在概念漏洞

P1（Watchdog 无法中断）和 P2（`watchdog_interval_ms` 未使用）同根——系统承诺了时间上限（配置、文档、代码注释），但实现上依赖同步等待后才能检测超时。真正的修复入口不是单独增加轮询，而是建立**超时检测 + 取消契约**两层机制：watchdog 负责发现超时并触发 abort，executor 及其依赖负责响应 `AbortSignal` 并尽快停止。

### 根因 B：接口定义与调用路径脱节

P3（`buildFailureInjection` 死代码）和 P6（`unknown` 错误被静默丢弃）同属此根因。P3 是"设计完但未集成"——AI 生成了接口和逻辑，但未完成将其插入调用链的最后一步。P6 是"调用方与被调用方契约不一致"——`makeRetryDecision` 返回 `shouldRetry: true` 但 `auto-loop.ts:254` 的 `=== 'temporary'` 硬过滤单方面否决了 `unknown` 的重试决策。这两类问题在 AI 协同开发场景下尤其容易出现。**需要集成测试覆盖关键路径**：如果 `buildFailureInjection` 被设计为在 retry 路径中调用，对应的集成测试应当能发现它从未被调用；如果 `unknown` 错误预期被重试，应有测试验证 `unknown` 分类的错误最终进入 `pending`（而非 `blocked`）状态。

### 根因 C：状态设计粒度与业务语义不匹配

P4（retry 计数全局共享）、P7（guard 失败语义）、P10（blocked 传播）都源于**状态的粒度设计**：全局单例状态无法表达"per-task 的独立生命周期"，导致任务之间共享了本该隔离的资源（retry budget），或者把不同性质的失败（环境失败 vs 质量失败）映射到了同一个状态（blocked）。

---

## 十二、优化路线图

### 阶段一：快速修复（低风险，高价值）

| 改动 | 问题 | 影响范围 |
|------|------|---------|
| `Promise.race` 竞争 executor 超时（止血） | P1 | auto-loop.ts 约 10 行 |
| `TASK_TIMEOUT:` 加入 `temporary` 模式（非 permanent）—— 超时是瞬态条件，加入 permanent 会导致任务永久 blocked 但 executor 仍在后台运行 | P1 | retry-controller.ts 1 行 |
| `watchdog_interval_ms` 标注为 reserved | P2 | config-schema.ts 注释 |
| `buildFailureInjection` 集成到 makeRetryDecision（用当前签名最小集成） | P3 | retry-controller.ts 约 15 行 |
| **修复 `unknown` 错误被静默丢弃的契约违反 bug**：条件从 `=== 'temporary'` 改为 `!== 'permanent'` | **P6** | **auto-loop.ts 1 行** |
| 项目级 guard 规则缓存（保留 Skill 级 markers 优先级） | P8 | auto-loop.ts 约 5-10 行 |
| 修复 `max_parallel` 默认值一致性 | — | pickReadyTodos 1 行 |

### 阶段二：核心改造（中风险，解决系统性问题）

| 改动 | 问题 | 影响范围 |
|------|------|---------|
| `TodoItem` 新增 `retryCount` / `lastFailureReason` / `consecutiveErrorCount` 隔离 retry 状态 | P3+P4 | 状态结构 + migration |
| 死锁检测 + `haltReason: stuck_all_blocked` | P5 | todo-runner.ts 约 40 行 |
| `GuardResult.policy` 区分 block/retry，并把 correction hint 传回 executor | P7 | guard 接口 + 调用链 |
| Crash recovery：清理 runtime 运行态，并引入 interrupted/recovery 语义 | P9 | loadTodoState 后处理 |
| Blocked 级联传播 | P10 | propagateBlockedStatus 约 25 行 |

### 阶段三：完整 Watchdog（完成设计意图）

| 改动 | 问题 | 影响范围 |
|------|------|---------|
| 实现 interval watchdog 轮询 | P1/P2 | 新建 watchdog-runner.ts |
| executor 接受 `AbortSignal`，下游 API 跟进响应取消 | P1 | executor 接口 + 调用方 |
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

---

## 附录：复审记录

> **复审时间**：2026-03-14 | **复审者**：Claude Code (Opus 4.6) | **复审视角**：Google Distinguished Engineer
> **方法**：逐条对照源码验证原报告每一个断言，使用 3 个并行 subagent 交叉验证

### 复审结论

原报告质量 **82/100**。10 个问题中 8 个事实完全正确，问题定位精准，根因聚类有深度。但存在以下需修正项：

### 修正项一：P6 严重性升级 🟠→🔴，问题描述重写

**原报告描述**："`unknown` 默认重试，等同于 `temporary`"
**实际行为**（与原报告描述相反）：

`makeRetryDecision` 对 `unknown` 返回 `shouldRetry: true`，但调用方 `auto-loop.ts:254` 的条件是：

```typescript
if (retryDecision.shouldRetry && retryDecision.errorCategory === 'temporary') {
```

`unknown` 的 `errorCategory` 不等于 `'temporary'`，因此**跳过重试分支，直接落入 `blocked`**。同时 `applyRetryToState`（在条件判断之前调用，`auto-loop.ts:252`）已递增 `regenerateCount`——白消耗一次全局重试预算。

这是一个**契约违反 bug**：`makeRetryDecision` 承诺"应该重试"，调用方单方面否决。影响：所有未被 `PERMANENT_ERROR_PATTERNS` 和 `temporary` 模式匹配的错误（业务逻辑错误、规范校验失败、AI 新格式错误等）一次即 blocked，零重试机会。

**修复**：`auto-loop.ts:254` 条件从 `=== 'temporary'` 改为 `!== 'permanent'`（1 行修复）。

### 修正项二：P3 方案签名偏差标注

原报告 P3 方案中直接展示了 P4 改造完成后的目标签名 `(failureMessage, task: Pick<TodoItem, ...>)`，但 `buildFailureInjection` 的当前签名是 `(reason: string, previousReason: string | null)`。已补充分步实施说明：先用当前签名最小集成，再随 P4 改造迁移。

### 修正项三：P1 行号校正

原报告引用 `auto-loop.ts:161-194`，实际 executor 调用在 `auto-loop.ts:178`，`markTaskStarted` 在 `auto-loop.ts:451-466`。已更正。

### 补充发现

原报告未覆盖的一个关联问题：`auto-loop.ts:252` 的 `applyRetryToState` 在条件判断**之前**执行，意味着即使最终不重试（`unknown` 被丢弃），`regenerateCount` 和 `totalRetryDurationMs` 也已被递增。这导致全局重试预算被无效消耗，与 P4 的全局计数器问题叠加放大。

### 验证矩阵

| # | 事实准确性 | 行号准确性 | 方案可行性 | 备注 |
|---|-----------|-----------|-----------|------|
| P1 | ✅ | ⚠️ 已修正 | ✅ | — |
| P2 | ✅ | ✅ | ✅ | — |
| P3 | ✅ | ✅ | ⚠️ 签名偏差已标注 | 建议分步实施 |
| P4 | ✅ | ✅ | ✅ | — |
| P5 | ✅ | ✅ | ✅ | — |
| P6 | ❌ 重写 | ✅ | ✅ 修复方案已替换 | 实际比原描述更严重 |
| P7 | ✅ | ✅ | ✅ | — |
| P8 | ✅ | ✅ | ✅ | — |
| P9 | ✅ | ✅ | ✅ | — |
| P10 | ✅ | ✅ | ✅ | — |

---

## 附录二：修复实施记录

> **修复时间**：2026-03-14 | **实施者**：Claude Code (Opus 4.6) | **模式**：TDD（修复→测试→验证）
> **最终验证**：154/154 测试文件通过，1461 个测试全部通过

### 修复状态总览

| # | 问题 | 状态 | 修改文件 | 测试验证 |
|---|------|------|----------|----------|
| P1a | Promise.race 竞争 executor 超时（止血） | ✅ 已完成 | auto-loop.ts | ✅ 通过 |
| P1b | TASK_TIMEOUT 已在 temporary 模式中匹配 | ✅ 无需修改 | — | 已验证 `classifyError` 字符串匹配覆盖 |
| P2 | `watchdog_interval_ms` 标注为 @reserved | ✅ 已完成 | config-schema.ts | ✅ 通过 |
| P3 | `buildFailureInjection` 集成到 `makeRetryDecision` | ✅ 已完成 | retry-controller.ts | ✅ 33 个测试通过 |
| P4 | Retry 计数器下沉到 TodoItem 做任务级隔离 | ✅ 已完成 | todo-runner.ts, auto-loop.ts, retry-controller.ts | ✅ 通过 |
| P5 | 依赖死锁检测 `diagnoseStuckReason` | ✅ 已完成 | todo-runner.ts, auto-loop.ts | ✅ 5 个新测试通过 |
| P6 | `unknown` 错误被静默丢弃 → `!== 'permanent'` | ✅ 已完成 | auto-loop.ts (1 行) | ✅ 通过 |
| P7 | Guard 失败区分 block / retry_with_correction | ✅ 已完成 | auto-loop.ts | ✅ 通过 |
| P8 | 项目级 slop 规则缓存 | ✅ 已完成 | auto-loop.ts | ✅ 通过 |
| P9 | 进程重启后 in_progress 僵尸恢复 | ✅ 已完成 | auto-loop.ts | ✅ 1 个新测试通过 |
| P10 | blocked 状态级联传播 | ✅ 已完成 | todo-runner.ts, auto-loop.ts | ✅ 1 个新测试通过 |

### 修复过程中发现的测试适配

P6 修复 (`=== 'temporary'` → `!== 'permanent'`) 改变了 `unknown` 错误的路由：原来 `unknown` 直接 blocked，修复后走重试路径。以下测试的 `failExecutor` 消息从通用文本改为 permanent 模式 (`'ENOENT: no such file'`)，以保持"立即 blocked"的测试语义：

- `tests/unit/auto-loop.test.ts` — `failExecutor`
- `tests/unit/orchestrate-stage-integration.test.ts` — `failExecutor`
- `tests/unit/auto-loop.test.ts` — completion marker 测试增加 `max_retry_per_task: 0` 配置（P7 retry_with_correction 预算耗尽后降级 blocked）

### 阶段三（未实施，需设计评审）

以下改动涉及接口变更和新模块，建议开专项设计后实施：

- P1 完整方案：executor 接受 `AbortSignal`，实现真正的取消机制
- P2 完整方案：实现 interval watchdog 轮询（`watchdog_interval_ms` 正式生效）

