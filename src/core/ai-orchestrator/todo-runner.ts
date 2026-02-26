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
  if (state.halted) return undefined;

  const inProgress = state.items.find((item) => item.status === 'in_progress');
  if (inProgress) return inProgress;

  const doneSet = new Set(
    state.items.filter((item) => item.status === 'done').map((item) => item.id),
  );

  return state.items.find((item) => {
    if (item.status !== 'pending') return false;
    const deps = item.dependsOn ?? [];
    return deps.every((dep) => doneSet.has(dep));
  });
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
