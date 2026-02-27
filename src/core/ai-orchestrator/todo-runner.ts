import { join } from 'node:path';
import { writeFileSync, renameSync } from 'node:fs';
import { exists, readJson } from '../../shared/fs-utils.js';
import { loadConfig } from '../../shared/config-schema.js';

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

export function loadTodoState(featureId: string, projectRoot: string): TodoRunnerState | undefined {
  const statePath = getTodoStatePath(featureId, projectRoot);
  if (!exists(statePath)) return undefined;
  try {
    return readJson<TodoRunnerState>(statePath);
  } catch {
    return undefined;
  }
}

/** 原子写入：write-tmp-then-rename，防止中途 kill 导致文件损坏 */
export function saveTodoState(state: TodoRunnerState, projectRoot: string): void {
  const statePath = getTodoStatePath(state.featureId, projectRoot);
  const tmpPath = `${statePath}.tmp`;
  writeFileSync(tmpPath, `${JSON.stringify(state, null, 2)}\n`, 'utf-8');
  renameSync(tmpPath, statePath);
}

export function initTodoState(
  featureId: string,
  projectRoot: string,
  items: TodoItem[],
  maxIterations?: number,
): TodoRunnerState {
  const cfg = loadConfig(projectRoot);
  const resolvedMax = maxIterations ?? cfg.runtime.max_iterations;

  return {
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
  options?: { maxParallel?: number },
): TodoItem[] {
  if (state.halted) return [];
  const maxParallel = Math.max(1, options?.maxParallel ?? 4);

  const inProgress = state.items.filter((item) => item.status === 'in_progress');
  if (inProgress.length > 0) return inProgress.slice(0, maxParallel);

  const doneSet = new Set(
    state.items.filter((item) => item.status === 'done').map((item) => item.id),
  );

  const readyPending = state.items.filter((item) => {
    if (item.status !== 'pending') return false;
    const deps = item.dependsOn ?? [];
    return deps.every((dep) => doneSet.has(dep));
  });

  if (readyPending.length === 0) return [];

  // 顺序任务是天然屏障；仅当首个可执行项标记为并行时，才开启同层并行批次。
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
  status: TodoStatus,
): TodoRunnerState {
  const nextItems = state.items.map((item) => (
    item.id === todoId ? { ...item, status } : item
  ));

  return {
    ...state,
    items: nextItems,
    updatedAt: new Date().toISOString(),
  };
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
  const pending = state.items.filter((item) => item.status === 'pending' || item.status === 'in_progress').length;
  const haltPart = state.halted ? ` halted (${state.haltReason ?? 'unknown'})` : '';

  return `Todo续航: done=${done}, pending=${pending}, blocked=${blocked}, iteration=${state.iteration}/${state.maxIterations}${haltPart}`;
}
