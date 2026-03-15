# Spec-First 产物 ID 链路一致性深度审计报告

> **审计日期**: 2026-03-14
> **审计范围**: `src/core/trace-engine/`, `src/core/process-engine/`, `src/core/ai-orchestrator/`, `src/core/gate-engine/`
> **审计维度**: 一致性、完整性、健壮性、幂等性、可恢复性

---

## 1. 审计计划

### 1.1 审计目标

验证 Spec-First 系统中 ID 关联机制在各阶段产物间的一致性，覆盖 ID 生命周期的五个阶段：
- **生成**: ID 格式校验、序号分配、原子写入
- **传播**: upstream/downstream 链路建立、传递闭包计算
- **校验**: Gate 条件评估、V-Model 配对检查、孤儿检测
- **持久化**: 矩阵 Markdown 写入、状态 JSON 序列化
- **恢复**: 进程重启后僵尸任务恢复、重试状态重建

### 1.2 审计范围

| 模块 | 核心文件 | 职责 |
|------|---------|------|
| trace-engine | `id-generator.ts`, `id-validator.ts`, `matrix.ts`, `upstream-lineage.ts` | ID 生成、格式校验、矩阵管理、传递链解析 |
| process-engine | `stage-machine.ts`, `advance.ts` | 阶段状态机、阶段推进 |
| ai-orchestrator | `auto-loop.ts`, `todo-runner.ts`, `retry-controller.ts` | 任务编排、重试逻辑、状态恢复 |
| gate-engine | `condition-registry.ts`, `gate-evaluator.ts` | Gate 条件定义与评估 |
| shared | `file-lock.ts`, `types.ts` | 原子锁、核心类型定义 |

### 1.3 ID 类型清单（14 类）

| 分类 | ID 类型 | 格式正则 |
|------|---------|---------|
| Feature | Feature | `^FSREQ-\d{8}-[A-Z][A-Z0-9]{1,15}-\d{3}$` |
| 业务链路 | FR, DS, TASK, TC | `{TYPE}-[A-Z][A-Z0-9]{1,15}-\d{3}` (TC 含级别前缀) |
| V-Model 左 | REQ, SYS, ARCH, MOD | `{TYPE}-[A-Z][A-Z0-9]{1,15}-\d{3}` |
| V-Model 右 | ATP, STP, ITP, UTP | `{TYPE}-[A-Z][A-Z0-9]{1,15}-\d{3}` |
| 变更管理 | RFC | `^RFC-\d{3}$` |

---

## 2. ID 生命周期地图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ID 生命周期 (5 阶段)                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  │  生成    │───▶│  传播    │───▶│  校验    │───▶│ 持久化   │───▶│  恢复    │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
│       │              │              │              │              │
│       ▼              ▼              ▼              ▼              ▼
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  │id-gen.ts │  │ matrix.ts│  │gate-eval │  │ matrix.md│  │auto-loop │
│  │          │  │          │  │.ts       │  │ stage-   │  │.ts       │
│  │ • abbr   │  │ • up/down│  │ • C3-C9  │  │ state.js │  │ • zombie │
│  │   归一化  │  │ • 传递链  │  │ • V-Model│  │ on       │  │   恢复   │
│  │ • seq++  │  │          │  │ • orphan │  │          │  │ • retry  │
│  │ • 文件锁  │  │          │  │          │  │          │  │   状态   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.1 生成阶段详情

```typescript
// src/core/trace-engine/id-generator.ts:30-51
export function nextId(opts: NextIdOptions): NextIdResult {
  return withFileLock(join(opts.projectRoot, 'specs', opts.featureId, '.matrix.lock'), () => {
    validateAbbr(opts.abbr);           // Step 1: 校验缩写格式
    const rows = parseMatrixIds(matrixPath);  // Step 2: 读取已有 ID
    const seq = findNextSeq(rows, opts.type, opts.abbr, opts.tcLevel);  // Step 3: 计算下一序号
    const id = assembleId(opts.type, opts.abbr, seq, opts.tcLevel);     // Step 4: 组装 ID
    const validation = validateId(id); // Step 5: 二次校验
    appendToMatrix(matrixPath, { id, ... });  // Step 6: 写入矩阵
    return { id, seq };
  });
}
```

**关键点**:
- 文件锁 `.matrix.lock` 保证原子性
- abbr 连字符归一化：`UIOPT-001` → `UIOPT001`（在 `validateAbbr` 和 `assembleId` 中）
- 序号 3 位补零：`padStart(3, '0')`

### 2.2 传播阶段详情

```typescript
// src/core/trace-engine/upstream-lineage.ts:20-41
const getAncestors = (id: string, stack = new Set<string>()): ReadonlySet<string> => {
  if (stack.has(id)) return new Set<string>();  // 环检测
  stack.add(id);
  const ancestors = new Set<string>();
  for (const upstreamId of row?.upstream ?? []) {
    ancestors.add(upstreamId);
    const upstreamAncestors = getAncestors(upstreamId, stack);  // 递归
    for (const ancestorId of upstreamAncestors) {
      ancestors.add(ancestorId);
    }
  }
  cache.set(id, ancestors);
  return ancestors;
};
```

**关键点**:
- 递归解析传递闭包
- 环检测：`stack.has(id)` 返回空集合
- 结果缓存：避免重复计算

---

## 3. 主流程审计

### 3.1 ID 生成与校验一致性

#### ✅ 通过项

| 检查项 | 位置 | 结果 |
|--------|------|------|
| 14 类 ID 正则覆盖 | `id-validator.ts:8-23` | ✅ 完整 |
| 生成后二次校验 | `id-generator.ts:43-46` | ✅ 调用 `validateId` |
| 文件锁超时机制 | `file-lock.ts:5` | ✅ 2s 超时 |
| 序号补零 | `id-generator.ts:65` | ✅ `padStart(3, '0')` |

#### ⚠️ 问题发现

| 问题 | 位置 | 风险 |
|------|------|------|
| **P1**: abbr 归一化不一致 | `id-generator.ts:56,64` vs `id-validator.ts` | 🔴 高 |

**P1 详情**: `validateAbbr` 和 `assembleId` 会移除连字符（`abbr.replace(/-/g, '')`），但 `id-validator.ts` 的正则期望 `[A-Z][A-Z0-9]{1,15}`，无连字符。

**实际影响**: 由于归一化在组装前完成，生成的 ID 不含连字符，因此验证通过。但若外部传入含连字符的 ID（如用户手动编辑矩阵），验证会失败。这是一种防御性行为，但文档未说明。

**建议**: 在文档中明确说明 abbr 连字符会被自动移除。

### 3.2 矩阵链路完整性

#### ✅ 通过项

| 检查项 | 位置 | 结果 |
|--------|------|------|
| 孤儿检测 | `matrix.ts:60-69` | ✅ 非 FR/Feature/REQ 且无 upstream |
| 断链检测 | `matrix.ts:71-91` | ✅ FR 缺失 REQ/DS/TASK/TC |
| V-Model 配对 | `matrix.ts:248-300` | ✅ REQ↔ATP, SYS↔STP, ARCH↔ITP, MOD↔UTP |
| 状态归一化 | `matrix.ts:180-187` | ✅ `normalizeStatus` |

#### ⚠️ 问题发现

| 问题 | 位置 | 风险 |
|------|------|------|
| **P2**: 传递链环静默返回空集 | `upstream-lineage.ts:23` | 🟠 中 |

**P2 详情**: 当检测到环时，`getAncestors` 返回空集合而非抛出错误。

```typescript
if (stack.has(id)) return new Set<string>();  // 静默返回
```

**影响**: 环路数据会导致覆盖率计算失准，但不会报错。用户可能在 Gate 检查时发现覆盖率异常，但难以定位根因。

**建议**: 添加审计日志记录环路检测，或提供 `strict` 模式抛出错误。

### 3.3 覆盖率计算逻辑

#### C3 (Task 覆盖 FR) - 传递链支持

```typescript
// src/core/gate-engine/condition-registry.ts:371-376
if (downstreamType === 'TASK') {
  const coveredFrIds = trace.lineage.collectCoveredTargetIds(
    trace.rows.filter((row) => row.type === 'TASK').map((row) => row.id),
    trace.frIds
  );
  for (const frId of coveredFrIds) covered.add(frId);
}
```

**设计**: TASK → upstream → ... → FR 传递链被正确解析。

#### C4 (TC 覆盖 FR) - 直接链接

```typescript
// src/core/gate-engine/condition-registry.ts:377-384
} else {
  const downstreamRows = rows.filter((r) => r.type === downstreamType);
  for (const row of downstreamRows) {
    for (const upstreamId of row.upstream ?? []) {
      covered.add(upstreamId);
    }
  }
}
```

**设计**: TC 仅检查 `upstream` 字段，**不支持传递链**。这是有意设计（测试用例应直接关联 FR），但文档未明确说明。

#### ⚠️ 问题发现

| 问题 | 位置 | 风险 |
|------|------|------|
| **P3**: C4 传递链语义与 C3 不一致 | `condition-registry.ts:377-384` | 🟡 低 |

**P3 详情**: C3 使用传递链，C4 仅使用直接链接。这种不一致可能导致用户困惑。

**建议**: 在文档中明确说明 C4 仅支持直接链接，或提供配置项支持传递链。

---

## 4. 异常路径和边界场景审计

### 4.1 文件锁边界场景

```typescript
// src/shared/file-lock.ts:12-41
export function withFileLock<T>(lockPath: string, action: () => T, ...): T {
  while (true) {
    try {
      const fd = openSync(lockPath, 'wx');  // 排他创建
      try {
        writeFileSync(lockPath, `${process.pid}\n`, 'utf-8');
        return action();
      } finally {
        closeSync(fd);
        unlinkSync(lockPath);  // 释放锁
      }
    } catch (error) {
      if (code !== 'EEXIST') throw error;
      if (Date.now() - startedAt >= timeoutMs) {
        throw new Error(`获取文件锁超时：${lockPath}`);
      }
      sleepMs(retryMs);
    }
  }
}
```

#### ⚠️ 问题发现

| 问题 | 位置 | 风险 |
|------|------|------|
| **P4**: 僵尸锁未清理 | `file-lock.ts` | 🟠 中 |

**P4 详情**: 若进程在持有锁期间被强制终止（kill -9），锁文件会残留，导致后续操作永久阻塞直到 2s 超时。

**建议**:
1. 检测锁文件创建时间，超过阈值自动清理
2. 或在锁文件中写入时间戳，启动时检查过期锁

### 4.2 进程重启恢复

```typescript
// src/core/ai-orchestrator/auto-loop.ts:96-136
function recoverInterruptedTasks(state, featureId, projectRoot): TodoRunnerState {
  const zombies = state.items.filter((i) => i.status === 'in_progress');
  for (const z of zombies) {
    recovered = updateTodoStatus(recovered, z.id, 'pending');
    recovered = updateTodoItem(recovered, z.id, {
      retryCount: (z.retryCount ?? 0) + 1,
      lastFailureReason: 'process_crash_recovery',
    });
    writeAuditLog({ event: 'zombie_recovered', ... }, projectRoot);
  }
  // 清理 autoLoop 运行态
  recovered = {
    ...recovered,
    runtime: {
      autoLoop: {
        currentTaskId: null,
        taskStartedAt: null,
        heartbeatAt: null,
        watchdogCheckedAt: null,
        // ...
      }
    }
  };
}
```

#### ✅ 通过项

| 检查项 | 结果 |
|--------|------|
| 僵尸任务重置为 pending | ✅ |
| 递增 retryCount 防止无限崩溃重试 | ✅ |
| 记录 lastFailureReason | ✅ |
| 清理全部 4 个瞬时字段 | ✅ |
| 审计日志记录 | ✅ |

### 4.3 Blocked 级联传播

```typescript
// src/core/ai-orchestrator/todo-runner.ts:421-451
export function cascadeBlocked(state): { state: TodoRunnerState; cascaded: string[] } {
  const blockedIds = new Set(state.items.filter((i) => i.status === 'blocked').map((i) => i.id));
  const cascaded: string[] = [];

  let changed = true;
  while (changed) {
    changed = false;
    const newlyBlocked: string[] = [];  // P10 修复：收集本轮新增
    for (const item of state.items) {
      if (item.status !== 'pending') continue;
      if (deps.some((dep) => blockedIds.has(dep))) {
        blockedIds.add(item.id);
        newlyBlocked.push(item.id);
        changed = true;
      }
    }
    for (const id of newlyBlocked) {
      state = updateTodoStatus(state, id, 'blocked');  // 更新 state
      cascaded.push(id);
    }
  }
  return { state, cascaded };
}
```

#### ✅ 通过项 (P10 修复后)

| 检查项 | 结果 |
|--------|------|
| 多轮传播直到无新增 | ✅ |
| 每轮用最新 state.items 遍历 | ✅ |
| 避免重复处理已 blocked 任务 | ✅ |

### 4.4 重试控制器

```typescript
// src/core/ai-orchestrator/retry-controller.ts:122-183
export function makeRetryDecision(
  failureMessage: string,
  retry: AutoLoopRetry,
  config: AutoOrchestrateConfig,
  taskRetryCount?: number,      // P4: 任务级计数
  taskLastFailureReason?: string | null  // NEW-1: 任务级失败原因
): RetryDecision {
  const category = classifyError(failureMessage);  // permanent/temporary/unknown

  if (category === 'permanent') {
    return { shouldRetry: false, reason: `permanent error: ...`, ... };
  }

  if (isRetryBudgetExhausted(retry, config.max_total_retry_duration_ms)) {
    return { shouldRetry: false, reason: 'retry_budget_exhausted', ... };
  }

  const effectiveRetryCount = taskRetryCount ?? retry.regenerateCount;  // P4 优先级
  if (effectiveRetryCount >= config.max_retry_per_task) {
    return { shouldRetry: false, reason: `max_retry_per_task reached`, ... };
  }

  // P3 fix: 连续相同失败 → 3× 退避
  // NEW-1: fingerprint 比对用任务级上下文
  const previousReason = taskLastFailureReason !== undefined
    ? taskLastFailureReason
    : retry.lastFailureReason;
  const injection = buildFailureInjection(failureMessage, previousReason);
  const consecutiveMultiplier = injection.forceBackoff ? 3 : 1;
  // P6: unknown 错误 2× 退避
  const unknownMultiplier = category === 'unknown' ? 2 : 1;

  const backoffMs = Math.min(
    computeBackoffMs(config.retry_backoff_ms, effectiveRetryCount + 1)
      * consecutiveMultiplier * unknownMultiplier,
    30_000
  );

  return { shouldRetry: true, backoffMs, ... };
}
```

#### ✅ 通过项

| 检查项 | 结果 |
|--------|------|
| 错误分类 (permanent/temporary/unknown) | ✅ |
| 全局时间预算检查 | ✅ |
| 任务级重试计数优先 | ✅ P4 |
| 连续相同失败检测 | ✅ P3 |
| fingerprint 隔离（任务级） | ✅ NEW-1 |
| unknown 错误保守退避 | ✅ P6 |
| 退避上限 30s | ✅ |

---

## 5. 问题清单

### 5.1 高风险问题

#### P1: abbr 归一化语义不明确

| 属性 | 值 |
|------|-----|
| **位置** | `src/core/trace-engine/id-generator.ts:56,64` |
| **现象** | abbr 中的连字符被自动移除，但 `id-validator.ts` 的错误提示未说明 |
| **根因** | `validateAbbr` 使用 `abbr.replace(/-/g, '')` 归一化，但错误消息未提及 |
| **影响范围** | 用户手动编辑矩阵时可能困惑 |
| **风险等级** | 🔴 高（用户可感知） |
| **修复建议** | 1. 更新错误消息说明连字符会被移除<br>2. 在 CLAUDE.md 中明确说明 |

### 5.2 中风险问题

#### P2: 传递链环检测静默返回

| 属性 | 值 |
|------|-----|
| **位置** | `src/core/trace-engine/upstream-lineage.ts:23` |
| **现象** | 环检测返回空集合而非报错 |
| **根因** | `if (stack.has(id)) return new Set<string>();` |
| **影响范围** | 环路数据导致覆盖率失准，难以定位 |
| **风险等级** | 🟠 中 |
| **修复建议** | 添加审计日志或 strict 模式 |

#### P4: 僵尸锁未清理

| 属性 | 值 |
|------|-----|
| **位置** | `src/shared/file-lock.ts` |
| **现象** | 进程崩溃后锁文件残留 |
| **根因** | 无过期检测机制 |
| **影响范围** | 后续操作阻塞 2s 直到超时 |
| **风险等级** | 🟠 中 |
| **修复建议** | 1. 锁文件写入时间戳<br>2. 启动时检查过期锁 |

### 5.3 低风险问题

#### P3: C3/C4 传递链语义不一致

| 属性 | 值 |
|------|-----|
| **位置** | `src/core/gate-engine/condition-registry.ts:371-384` |
| **现象** | C3 支持传递链，C4 仅支持直接链接 |
| **根因** | 设计决策（TC 应直接关联 FR） |
| **影响范围** | 用户可能困惑 |
| **风险等级** | 🟡 低 |
| **修复建议** | 在文档中明确说明差异 |

---

## 6. 健壮性保障机制总结

### 6.1 已实现的健壮性机制

| 机制 | 文件 | 说明 |
|------|------|------|
| 文件锁原子操作 | `file-lock.ts` | 防止并发 ID 生成冲突 |
| 生成后二次校验 | `id-generator.ts:43` | `validateId(id)` 确保格式正确 |
| 僵尸任务恢复 | `auto-loop.ts:96-136` | 进程重启后恢复中断任务 |
| blocked 级联传播 | `todo-runner.ts:421-451` | 阻塞任务下游自动标记 |
| 错误分类重试 | `retry-controller.ts` | permanent/temporary/unknown 分类 |
| 任务级重试隔离 | `retry-controller.ts:152` | P4: taskRetryCount 优先 |
| fingerprint 隔离 | `retry-controller.ts:165-167` | NEW-1: 任务级失败原因 |
| 连续失败加速退避 | `retry-controller.ts:168` | P3: 连续 2 次 → 3× 退避 |
| unknown 保守退避 | `retry-controller.ts:170` | P6: unknown → 2× 退避 |
| 环检测 | `upstream-lineage.ts:23` | 防止无限递归 |
| 结果缓存 | `upstream-lineage.ts:18` | 避免重复计算 |
| 终态保护 | `stage-machine.ts:31-33` | 终态不可逆 |
| Gate 降级 | `advance.ts:166-201` | pilot_mode 允许绕过 Gate |

### 6.2 待改进项

| 改进项 | 优先级 | 说明 |
|--------|--------|------|
| 僵尸锁清理 | P1 | 检测过期锁自动清理 |
| 环路审计日志 | P2 | 记录环路检测事件 |
| abbr 归一化文档 | P2 | 明确说明连字符行为 |
| C4 传递链文档 | P3 | 说明与 C3 的差异 |

---

## 7. 结论

### 7.1 审计结论

Spec-First 的 ID 链路一致性机制**整体健壮**，已实现：
- ✅ 原子 ID 生成（文件锁）
- ✅ 14 类 ID 格式校验
- ✅ 传递链解析与缓存
- ✅ 孤儿/断链/V-Model 检测
- ✅ 进程崩溃恢复
- ✅ 任务级重试隔离
- ✅ Blocked 级联传播

### 7.2 关键风险

1. **僵尸锁**: 进程崩溃后锁文件残留，导致 2s 阻塞
2. **环路静默**: 环路数据静默返回空集合，覆盖率失准难以定位

### 7.3 建议优先级

| 优先级 | 问题 | 建议 |
|--------|------|------|
| P1 | 僵尸锁 | 实现过期锁清理 |
| P2 | 环路静默 | 添加审计日志 |
| P2 | abbr 归一化 | 更新错误消息和文档 |
| P3 | C3/C4 差异 | 文档说明 |

---

## 附录 A: 关键代码位置索引

| 功能 | 文件 | 行号 |
|------|------|------|
| ID 生成主函数 | `id-generator.ts` | 30-51 |
| abbr 归一化 | `id-generator.ts` | 56, 64 |
| ID 正则校验 | `id-validator.ts` | 8-23, 26-38 |
| 矩阵解析 | `matrix.ts` | 160-198 |
| 孤儿检测 | `matrix.ts` | 60-69 |
| 断链检测 | `matrix.ts` | 71-91 |
| V-Model 配对 | `matrix.ts` | 248-300 |
| 传递链解析 | `upstream-lineage.ts` | 20-41 |
| 环检测 | `upstream-lineage.ts` | 23 |
| 文件锁 | `file-lock.ts` | 12-41 |
| 阶段转换校验 | `stage-machine.ts` | 30-39 |
| 僵尸任务恢复 | `auto-loop.ts` | 96-136 |
| 重试决策 | `retry-controller.ts` | 122-183 |
| 错误分类 | `retry-controller.ts` | 46-56 |
| Blocked 级联 | `todo-runner.ts` | 421-451 |
| C3 覆盖率 | `condition-registry.ts` | 371-376 |
| C4 覆盖率 | `condition-registry.ts` | 377-384 |

---

## 附录 B: 覆盖率计算差异

| 指标 | 传递链 | 实现位置 |
|------|--------|---------|
| C3 (TASK→FR) | ✅ 支持 | `collectCoveredTargetIds` |
| C4 (TC→FR) | ❌ 仅直接 | 直接读取 `upstream` |
| C6 (实现率) | — | TASK 状态统计 |
| C8 (TASK 合规) | — | TASK 有上游 |
| C9 (TC 合规) | — | TC 有上游 FR |

**设计说明**: C4 不支持传递链是故意设计（测试用例应直接关联 FR），避免间接关联导致测试覆盖虚高。

---

*审计完成时间: 2026-03-14*
