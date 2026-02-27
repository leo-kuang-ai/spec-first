/**
 * Auto-Loop 主循环
 * pick → execute → checkpoint → iteration
 * @see TASK-ORCH-003, V2-13§5.1
 */
import {
  loadTodoState,
  saveTodoState,
  pickReadyTodos,
  updateTodoStatus,
  advanceTodoIteration,
  createAutoLoopState,
} from './todo-runner.js';
import type {
  TodoRunnerState,
  TodoItem,
  HaltReasonCode,
} from './todo-runner.js';
import { loadConfig } from '../../shared/config-schema.js';
import type { OrchestrateArgs } from '../skill-runtime/orchestrate-args.js';
import { writeAuditLog } from './audit-log.js';
import { runWatchdogCheck, updateHeartbeat, updateWatchdogCheckedAt } from './watchdog.js';

// ─── 类型定义 ───────────────────────────────────────────

export type TaskExecutor = (task: TodoItem, state: TodoRunnerState) => Promise<TaskResult>;

export interface TaskResult {
  success: boolean;
  message: string;
}

export interface AutoLoopOptions {
  featureId: string;
  projectRoot: string;
  args: OrchestrateArgs;
  executor: TaskExecutor;
  onCheckpoint?: (state: TodoRunnerState) => void;
  onIteration?: (iteration: number, state: TodoRunnerState) => void;
}

export interface AutoLoopResult {
  halted: boolean;
  haltReason?: string;
  iterations: number;
  completedTasks: string[];
}

// ─── 状态初始化 ─────────────────────────────────────────

/** 确保 state 包含 runtime.autoLoop，兼容 legacy 状态文件 */
function ensureAutoLoopState(state: TodoRunnerState): TodoRunnerState {
  if (state.runtime?.autoLoop) return state;
  return {
    ...state,
    runtime: {
      ...state.runtime,
      autoLoop: createAutoLoopState(),
    },
  };
}

// ─── 主循环 ─────────────────────────────────────────────

/**
 * Auto-loop 主循环
 * 算法：while (iteration < maxIterations)
 *   1) pickReadyTodos
 *   2) 无可执行 → done 或 advance iteration
 *   3) 执行 TASK（更新 heartbeat/taskStartedAt）
 *   4) 原子写入 checkpoint
 *   5) advance iteration
 */
export async function runAutoLoop(options: AutoLoopOptions): Promise<AutoLoopResult> {
  const { featureId, projectRoot, executor, onCheckpoint, onIteration } = options;
  const cfg = loadConfig(projectRoot);
  const maxParallel = cfg.runtime.auto_orchestrate.max_parallel;

  // 加载或恢复状态
  let state = loadTodoState(featureId, projectRoot);
  if (!state) {
    return { halted: true, haltReason: 'no_state_file', iterations: 0, completedTasks: [] };
  }

  state = ensureAutoLoopState(state);
  const completedTasks: string[] = [];
  const startIteration = state.iteration;

  while (state.iteration < state.maxIterations && !state.halted) {
    // 1) Pick ready todos
    const ready = pickReadyTodos(state, { maxParallel });

    if (ready.length === 0) {
      const unfinished = state.items.filter((i) => i.status !== 'done').length;
      if (unfinished === 0) {
        // 全部完成
        state = haltState(state, 'completed');
        checkpoint(state, projectRoot, onCheckpoint);
        break;
      }
      // 有未完成但无可执行 → advance iteration 等待依赖
      state = advanceTodoIteration(state);
      checkpoint(state, projectRoot, onCheckpoint);
      onIteration?.(state.iteration, state);
      continue;
    }

    // 2) 执行每个 ready TASK
    for (const task of ready) {
      state = markTaskStarted(state, task.id);
      checkpoint(state, projectRoot, onCheckpoint);

      // 审计：task_started
      writeAuditLog({ event: 'task_started', featureId, taskId: task.id }, projectRoot);

      const result = await executor(task, state);

      // 执行后更新 heartbeat + watchdog 检查
      state = updateHeartbeat(state);
      state = updateWatchdogCheckedAt(state);

      const watchdogResult = runWatchdogCheck(state, cfg.runtime.auto_orchestrate);
      if (watchdogResult) {
        writeAuditLog({
          event: watchdogResult.event,
          featureId,
          taskId: task.id,
          detail: { elapsedMs: watchdogResult.elapsedMs, thresholdMs: watchdogResult.thresholdMs },
        }, projectRoot);

        if (watchdogResult.event === 'task_timeout') {
          state = updateTodoStatus(state, task.id, 'blocked');
          state = haltState(state, 'task_timeout', task.id);
          checkpoint(state, projectRoot, onCheckpoint);
          return buildResult(state, startIteration, completedTasks);
        }
        if (watchdogResult.event === 'heartbeat_stalled') {
          state = updateTodoStatus(state, task.id, 'blocked');
          state = haltState(state, 'stalled_timeout', task.id);
          checkpoint(state, projectRoot, onCheckpoint);
          return buildResult(state, startIteration, completedTasks);
        }
      }

      if (result.success) {
        state = updateTodoStatus(state, task.id, 'done');
        state = updateAutoLoopLastResult(state, task.id, 'done', result.message);
        completedTasks.push(task.id);
        writeAuditLog({ event: 'task_done', featureId, taskId: task.id }, projectRoot);
      } else {
        state = updateTodoStatus(state, task.id, 'blocked');
        state = updateAutoLoopLastResult(state, task.id, 'blocked', result.message);
        writeAuditLog({
          event: 'task_blocked', featureId, taskId: task.id,
          detail: { message: result.message },
        }, projectRoot);

        if (cfg.runtime.auto_orchestrate.stop_on_blocked) {
          state = haltState(state, 'blocked', task.id);
          checkpoint(state, projectRoot, onCheckpoint);
          return buildResult(state, startIteration, completedTasks);
        }
      }
    }

    // 3) Checkpoint + advance
    state = advanceTodoIteration(state);
    checkpoint(state, projectRoot, onCheckpoint);
    onIteration?.(state.iteration, state);
  }

  return buildResult(state, startIteration, completedTasks);
}

// ─── 内部辅助函数 ───────────────────────────────────────

function haltState(
  state: TodoRunnerState,
  code: HaltReasonCode,
  taskId?: string,
): TodoRunnerState {
  const reason = taskId ? `${code}:${taskId}` : code;
  return {
    ...state,
    halted: true,
    haltReason: reason,
    updatedAt: new Date().toISOString(),
  };
}

/** 原子写入 checkpoint */
function checkpoint(
  state: TodoRunnerState,
  projectRoot: string,
  onCheckpoint?: (s: TodoRunnerState) => void,
): void {
  saveTodoState(state, projectRoot);
  onCheckpoint?.(state);
}

function markTaskStarted(state: TodoRunnerState, taskId: string): TodoRunnerState {
  const now = new Date().toISOString();
  const updated = updateTodoStatus(state, taskId, 'in_progress');
  return {
    ...updated,
    runtime: {
      ...updated.runtime,
      autoLoop: {
        ...(updated.runtime?.autoLoop ?? createAutoLoopState()),
        currentTaskId: taskId,
        taskStartedAt: now,
        heartbeatAt: now,
      },
    },
  };
}

function updateAutoLoopLastResult(
  state: TodoRunnerState,
  taskId: string,
  outcome: 'done' | 'blocked',
  message: string,
): TodoRunnerState {
  return {
    ...state,
    runtime: {
      ...state.runtime,
      autoLoop: {
        ...(state.runtime?.autoLoop ?? createAutoLoopState()),
        currentTaskId: null,
        lastResult: { taskId, outcome, message },
      },
    },
    updatedAt: new Date().toISOString(),
  };
}

function buildResult(
  state: TodoRunnerState,
  startIteration: number,
  completedTasks: string[],
): AutoLoopResult {
  return {
    halted: state.halted,
    haltReason: state.haltReason,
    iterations: state.iteration - startIteration,
    completedTasks,
  };
}
