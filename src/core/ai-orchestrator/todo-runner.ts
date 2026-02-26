import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { exists, readJson } from '../../shared/fs-utils.js';
import { loadConfig } from '../../shared/config-schema.js';

export type TodoStatus = 'pending' | 'in_progress' | 'blocked' | 'done';

export interface TodoItem {
  id: string;
  title: string;
  status: TodoStatus;
  dependsOn?: string[];
  parallel?: boolean;
}

export interface TodoRunnerState {
  featureId: string;
  iteration: number;
  maxIterations: number;
  halted: boolean;
  haltReason?: string;
  items: TodoItem[];
  updatedAt: string;
}

function getTodoStatePath(featureId: string, projectRoot: string): string {
  return join(projectRoot, 'specs', featureId, 'todo-state.json');
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

export function saveTodoState(state: TodoRunnerState, projectRoot: string): void {
  const statePath = getTodoStatePath(state.featureId, projectRoot);
  writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf-8');
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
