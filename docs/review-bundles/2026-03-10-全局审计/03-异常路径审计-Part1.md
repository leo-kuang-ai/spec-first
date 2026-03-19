# 异常路径审计报告

**审计日期**: 2026-03-09
**审计对象**: 重试机制、循环控制、异常恢复

---

## 一、循环控制审计

### 1.1 auto-loop 循环边界

**位置**: `src/core/ai-orchestrator/auto-loop.ts:113`

```typescript
while (state.iteration < state.maxIterations && !state.halted) {
  const ready = pickReadyTodos(state, { maxParallel });

  if (ready.length === 0) {
    const unfinished = state.items.filter((i) => i.status !== 'done').length;
    if (unfinished === 0) {
      state = haltState(state, 'completed');  // ✅ 正常退出
      break;
    }
    state = advanceTodoIteration(state);  // ⚠️ 空转风险
    continue;
  }
  // ... 执行任务
}
```

**结论**: ✅ 有 maxIterations 上限保护

---

### 1.2 空转检测

**问题场景**:
```
所有任务都 blocked，但 unfinished > 0
→ ready.length === 0
→ advanceTodoIteration()
→ iteration++
→ 继续循环
→ 重复直到 maxIterations
```

**证据**: auto-loop.ts:126 无死锁检测

**风险**: 浪费 iteration 预算

---

## 二、重试机制审计

### 2.1 重试预算控制

**位置**: `src/core/ai-orchestrator/retry-controller.ts:142`

```typescript
if (isRetryBudgetExhausted(retry, config.max_total_retry_duration_ms)) {
  return {
    shouldRetry: false,
    reason: 'retry_budget_exhausted',
  };
}

if (retry.regenerateCount >= config.max_retry_per_task) {
  return {
    shouldRetry: false,
    reason: `max_retry_per_task reached`,
  };
}
```

**结论**: ✅ 双重预算保护（总时长 + 单任务次数）

---

### 2.2 问题发现

#### 🟠 问题 9: 重试计数不准确

**位置**: retry-controller.ts:190-191

```typescript
if (decision.errorCategory !== 'permanent' && decision.shouldRetry) {
  updatedRetry.regenerateCount = retry.regenerateCount + 1;
  updatedRetry.totalRetryDurationMs = retry.totalRetryDurationMs + decision.backoffMs;
}
```

**问题**: totalRetryDurationMs 累加的是 backoffMs（预计等待时间），而非实际重试耗时

**影响**: 预算计算不准确

---

