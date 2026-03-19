import { join } from 'node:path';
import { writeFileSync, renameSync } from 'node:fs';
import { exists, readJson } from '../../shared/fs-utils.js';
import { loadConfig } from '../../shared/config-schema.js';
import { withFileLock } from '../../shared/file-lock.js';

export type TodoStatus = 'pending' | 'in_progress' | 'blocked' | 'done';

/** run-level haltReason 规范码（用于解析/聚合） @see V2-13§7.5 */
export type HaltReasonCode =
  | 'completed'
  | 'max_iterations_reached'
  | 'blocked'
  | 'stalled_timeout'
  | 'task_timeout'
  | 'permanent_error'
  | 'retry_budget_exhausted';

export interface TodoItem {
  id: string;
  title: string;
  status: TodoStatus;
  dependsOn?: string[];
  parallel?: boolean;
  /** 重试恢复时间戳（毫秒），用于退避等待 @see F-07 */
  resumeAt?: number;
  /** P4: 当前任务的重试次数（任务级隔离） */
  retryCount?: number;
  /** P4: 当前任务的最后失败原因 */
  lastFailureReason?: string;
  /** P3+P4: 连续相同失败次数（用于加速退避） */
  consecutiveErrorCount?: number;
}

/** auto-loop 重试状态 @see V2-13§4.3 */
export interface AutoLoopRetry {
  regenerateCount: number;
  autoRetryCount: number;
  manualRevisionCount: number;
  totalRetryDurationMs: number;
  lastFailureReason: string | null;
}

/** auto-loop 上一轮结果 */
export interface AutoLoopLastResult {
  taskId: string;
  outcome: TodoStatus;
  message: string;
}

/** runtime.autoLoop 命名空间 @see V2-13§4.3 */
export interface AutoLoopState {
  currentTaskId: string | null;
  taskStartedAt: string | null;
  heartbeatAt: string | null;
  watchdogCheckedAt: string | null;
  retry: AutoLoopRetry;
  lastResult: AutoLoopLastResult | null;
}

export interface TodoRunnerState {
  kind: 'todo-runner-state';
  version: 1;
  featureId: string;
  iteration: number;
  maxIterations: number;
  halted: boolean;
  haltReason?: string;
  runtime?: {
    autoLoop?: AutoLoopState;
  };
  items: TodoItem[];
  updatedAt: string;
}

function getTodoStatePath(featureId: string, projectRoot: string): string {
  return join(projectRoot, 'specs', featureId, 'todo-state.json');
}

function isTodoStatus(value: unknown): value is TodoStatus {
  return value === 'pending' || value === 'in_progress' || value === 'blocked' || value === 'done';
}

function isTodoItem(value: unknown): value is TodoItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  if (typeof item.id !== 'string' || typeof item.title !== 'string' || !isTodoStatus(item.status)) {
    return false;
  }
  if (
    item.dependsOn !== undefined &&
    (!Array.isArray(item.dependsOn) || item.dependsOn.some((dep) => typeof dep !== 'string'))
  ) {
    return false;
  }
  if (item.parallel !== undefined && typeof item.parallel !== 'boolean') {
    return false;
  }
  if (item.resumeAt !== undefined && typeof item.resumeAt !== 'number') {
    return false;
  }
  // P4: 新增可选字段校验
  if (item.retryCount !== undefined && typeof item.retryCount !== 'number') {
    return false;
  }
  if (item.lastFailureReason !== undefined && typeof item.lastFailureReason !== 'string') {
    return false;
  }
  if (item.consecutiveErrorCount !== undefined && typeof item.consecutiveErrorCount !== 'number') {
    return false;
  }
  return true;
}

function isAutoLoopRetry(value: unknown): value is AutoLoopRetry {
  if (!value || typeof value !== 'object') return false;
  const retry = value as Record<string, unknown>;
  return (
    typeof retry.regenerateCount === 'number' &&
    typeof retry.autoRetryCount === 'number' &&
    typeof retry.manualRevisionCount === 'number' &&
    typeof retry.totalRetryDurationMs === 'number' &&
    (typeof retry.lastFailureReason === 'string' || retry.lastFailureReason === null)
  );
}

function isAutoLoopLastResult(value: unknown): value is AutoLoopLastResult {
  if (value === null) return true;
  if (!value || typeof value !== 'object') return false;
  const result = value as Record<string, unknown>;
  return (
    typeof result.taskId === 'string' &&
    isTodoStatus(result.outcome) &&
    typeof result.message === 'string'
  );
}

function isAutoLoopState(value: unknown): value is AutoLoopState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Record<string, unknown>;
  return (
    (typeof state.currentTaskId === 'string' || state.currentTaskId === null) &&
    (typeof state.taskStartedAt === 'string' || state.taskStartedAt === null) &&
    (typeof state.heartbeatAt === 'string' || state.heartbeatAt === null) &&
    (typeof state.watchdogCheckedAt === 'string' || state.watchdogCheckedAt === null) &&
    isAutoLoopRetry(state.retry) &&
    isAutoLoopLastResult(state.lastResult)
  );
}

function isTodoRunnerState(value: unknown): value is TodoRunnerState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Record<string, unknown>;
  const hasSchemaTag = state.kind !== undefined || state.version !== undefined;
  if (hasSchemaTag && (state.kind !== 'todo-runner-state' || state.version !== 1)) return false;
  if (
    typeof state.featureId !== 'string' ||
    typeof state.iteration !== 'number' ||
    typeof state.maxIterations !== 'number'
  ) {
    return false;
  }
  if (typeof state.halted !== 'boolean') return false;
  if (state.updatedAt !== undefined && typeof state.updatedAt !== 'string') return false;
  if (!Array.isArray(state.items) || state.items.some((item) => !isTodoItem(item))) return false;
  if (state.runtime !== undefined) {
    if (!state.runtime || typeof state.runtime !== 'object') return false;
    const runtime = state.runtime as Record<string, unknown>;
    if (runtime.autoLoop !== undefined && !isAutoLoopState(runtime.autoLoop)) return false;
  }
  return true;
}

// ─── 状态词汇归一化 @see V2-13§7.5 ────────────────────

const STATUS_NORMALIZE_MAP: Record<string, TodoStatus> = {
  done: 'done',
  complete: 'done',
  verified: 'done',
  'in progress': 'in_progress',
  in_progress: 'in_progress',
  pending: 'pending',
  blocked: 'blocked',
};

/** 将 legacy 状态词汇归一为 TodoStatus */
export function normalizeTodoStatus(input: string): TodoStatus {
  return STATUS_NORMALIZE_MAP[input.toLowerCase()] ?? (input as TodoStatus);
}

/** 创建空的 autoLoop 初始状态 */
export function createAutoLoopState(): AutoLoopState {
  return {
    currentTaskId: null,
    taskStartedAt: null,
    heartbeatAt: null,
    watchdogCheckedAt: null,
    retry: {
      regenerateCount: 0,
      autoRetryCount: 0,
      manualRevisionCount: 0,
      totalRetryDurationMs: 0,
      lastFailureReason: null,
    },
    lastResult: null,
  };
}

/** 从 state 中读取 autoLoop，兼容 legacy 缺失场景 */
export function getAutoLoopState(state: TodoRunnerState): AutoLoopState | undefined {
  return state.runtime?.autoLoop;
}

export function loadTodoState(
  featureId: string,
  projectRoot: string,
  options?: { strict?: boolean }
): TodoRunnerState | undefined {
  const statePath = getTodoStatePath(featureId, projectRoot);
  if (!exists(statePath)) return undefined;

  let parsed: unknown;
  try {
    parsed = readJson<unknown>(statePath);
  } catch (error) {
    if (options?.strict) throw error;
    return undefined;
  }

  if (!isTodoRunnerState(parsed)) {
    const schemaError = new Error(`Invalid todo-state schema at ${statePath}`);
    if (options?.strict) throw schemaError;
    return undefined;
  }

  return parsed;
}

/** 原子写入：write-tmp-then-rename，防止中途 kill 导致文件损坏 */
export function saveTodoState(state: TodoRunnerState, projectRoot: string): void {
  const statePath = getTodoStatePath(state.featureId, projectRoot);
  const tmpPath = `${statePath}.tmp`;
  const lockPath = `${statePath}.lock`;
  withFileLock(lockPath, () => {
    writeFileSync(tmpPath, `${JSON.stringify(state, null, 2)}\n`, 'utf-8');
    renameSync(tmpPath, statePath);
  });
}

export function initTodoState(
  featureId: string,
  projectRoot: string,
  items: TodoItem[],
  maxIterations?: number
): TodoRunnerState {
  const cfg = loadConfig(projectRoot);
  const resolvedMax = maxIterations ?? cfg.runtime.max_iterations;

  return {
    kind: 'todo-runner-state',
    version: 1,
    featureId,
    iteration: 0,
    maxIterations: resolvedMax,
    halted: false,
    items,
    updatedAt: new Date().toISOString(),
  };
}

export function pickNextTodo(state: TodoRunnerState): TodoItem | undefined {
  return pickReadyTodos(state, { maxParallel: 1 })[0];
}

function isParallelTodo(item: TodoItem): boolean {
  if (item.parallel === true) return true;
  const title = item.title.toLowerCase();
  return title.includes('[p]') || title.includes('[parallel]');
}

export function pickReadyTodos(
  state: TodoRunnerState,
  options?: { maxParallel?: number }
): TodoItem[] {
  if (state.halted) return [];
  const maxParallel = Math.max(1, options?.maxParallel ?? 4);
  const now = Date.now();

  const inProgress = state.items.filter((item) => item.status === 'in_progress');
  if (inProgress.length > 0) return inProgress.slice(0, maxParallel);

  const doneSet = new Set(
    state.items.filter((item) => item.status === 'done').map((item) => item.id)
  );

  const readyPending = state.items.filter((item) => {
    if (item.status !== 'pending') return false;
    // 退避检查：resumeAt 未到则跳过 @see F-07
    if (item.resumeAt !== undefined && item.resumeAt > now) return false;
    const deps = item.dependsOn ?? [];
    return deps.every((dep) => doneSet.has(dep));
  });

  if (readyPending.length === 0) return [];

  if (!isParallelTodo(readyPending[0])) {
    return [readyPending[0]];
  }

  const batch: TodoItem[] = [];
  for (const item of readyPending) {
    if (!isParallelTodo(item)) break;
    batch.push(item);
    if (batch.length >= maxParallel) break;
  }
  return batch;
}

export function updateTodoStatus(
  state: TodoRunnerState,
  todoId: string,
  status: TodoStatus
): TodoRunnerState {
  const nextItems = state.items.map((item) => (item.id === todoId ? { ...item, status } : item));

  return {
    ...state,
    items: nextItems,
    updatedAt: new Date().toISOString(),
  };
}

/** P4: 更新任务级字段（retryCount / lastFailureReason / consecutiveErrorCount 等） */
export function updateTodoItem(
  state: TodoRunnerState,
  todoId: string,
  patch: Partial<
    Pick<TodoItem, 'retryCount' | 'lastFailureReason' | 'consecutiveErrorCount' | 'resumeAt'>
  >
): TodoRunnerState {
  const nextItems = state.items.map((item) => (item.id === todoId ? { ...item, ...patch } : item));

  return {
    ...state,
    items: nextItems,
    updatedAt: new Date().toISOString(),
  };
}

/** 设置任务的退避恢复时间 @see F-07 */
export function setTodoResumeAt(
  state: TodoRunnerState,
  todoId: string,
  resumeAt: number | undefined
): TodoRunnerState {
  const nextItems = state.items.map((item) => (item.id === todoId ? { ...item, resumeAt } : item));

  return {
    ...state,
    items: nextItems,
    updatedAt: new Date().toISOString(),
  };
}

// ─── P5: 依赖死锁诊断 ────────────────────────────────────

export type StuckType =
  | 'all_blocked'
  | 'dependency_blocked'
  | 'cyclic_dependency'
  | 'waiting_for_deps';

export interface StuckDiagnosis {
  type: StuckType;
  taskIds?: string[];
}

/** P5: 诊断无任务可执行的根因（死锁 vs 正常等待） */
export function diagnoseStuckReason(state: TodoRunnerState): StuckDiagnosis {
  const pending = state.items.filter((i) => i.status === 'pending');
  const blocked = state.items.filter((i) => i.status === 'blocked');

  // 情况 A：所有未完成任务都已 blocked（无 pending 可调度）
  if (pending.length === 0 && blocked.length > 0) {
    return { type: 'all_blocked', taskIds: blocked.map((i) => i.id) };
  }

  // 情况 B：存在 pending 任务，但某个依赖已 blocked 或根本不存在
  const unresolvable = pending.filter((item) => {
    const deps = item.dependsOn ?? [];
    return deps.some((dep) => {
      const depItem = state.items.find((i) => i.id === dep);
      return depItem?.status === 'blocked' || !depItem;
    });
  });
  if (unresolvable.length > 0) {
    return { type: 'dependency_blocked', taskIds: unresolvable.map((i) => i.id) };
  }

  // 情况 C：依赖都是 pending，但存在环（DFS 检测）
  const visited = new Set<string>();
  const inStack = new Set<string>();
  function hasCycle(id: string): boolean {
    if (inStack.has(id)) return true;
    if (visited.has(id)) return false;
    visited.add(id);
    inStack.add(id);
    const item = pending.find((i) => i.id === id);
    for (const dep of item?.dependsOn ?? []) {
      if (hasCycle(dep)) return true;
    }
    inStack.delete(id);
    return false;
  }
  if (pending.some((i) => hasCycle(i.id))) {
    return { type: 'cyclic_dependency' };
  }

  return { type: 'waiting_for_deps' };
}

// ─── P10: blocked 级联传播 ──────────────────────────────

/** P10: 将 blocked 任务的直接/间接下游 pending 任务也标记为 blocked */
export function cascadeBlocked(state: TodoRunnerState): {
  state: TodoRunnerState;
  cascaded: string[];
} {
  const blockedIds = new Set(state.items.filter((i) => i.status === 'blocked').map((i) => i.id));
  const cascaded: string[] = [];

  // 多轮传播直到无新增
  // 修复：每轮先收集本轮新增（newlyBlocked），应用后再进入下一轮，
  // 避免用旧 state.items 遍历导致已 blocked 的任务被重复处理
  let changed = true;
  while (changed) {
    changed = false;
    const newlyBlocked: string[] = [];
    for (const item of state.items) {
      if (item.status !== 'pending') continue;
      const deps = item.dependsOn ?? [];
      if (deps.some((dep) => blockedIds.has(dep))) {
        blockedIds.add(item.id);
        newlyBlocked.push(item.id);
        changed = true;
      }
    }
    // 应用本轮新增，state 更新后下一轮用最新 state.items 遍历
    for (const id of newlyBlocked) {
      state = updateTodoStatus(state, id, 'blocked');
      cascaded.push(id);
    }
  }

  return { state, cascaded };
}

export function advanceTodoIteration(state: TodoRunnerState): TodoRunnerState {
  const nextIteration = state.iteration + 1;
  const unfinished = state.items.filter((item) => item.status !== 'done').length;

  if (nextIteration >= state.maxIterations && unfinished > 0) {
    return {
      ...state,
      iteration: nextIteration,
      halted: true,
      haltReason: `max_iterations reached: ${nextIteration}/${state.maxIterations}`,
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    ...state,
    iteration: nextIteration,
    updatedAt: new Date().toISOString(),
  };
}

export function summarizeTodoState(state: TodoRunnerState): string {
  const done = state.items.filter((item) => item.status === 'done').length;
  const blocked = state.items.filter((item) => item.status === 'blocked').length;
  const pending = state.items.filter(
    (item) => item.status === 'pending' || item.status === 'in_progress'
  ).length;
  const haltPart = state.halted ? ` halted (${state.haltReason ?? 'unknown'})` : '';

  return `Todo续航: done=${done}, pending=${pending}, blocked=${blocked}, iteration=${state.iteration}/${state.maxIterations}${haltPart}`;
}
