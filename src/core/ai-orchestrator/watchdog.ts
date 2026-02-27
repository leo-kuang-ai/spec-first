/**
 * Watchdog + Heartbeat + Task Timeout
 * 运行中主动检测 stalled/timeout，写入审计日志
 * @see TASK-ORCH-004 (watchdog+heartbeat), TASK-ORCH-005 (task timeout)
 */
import type { TodoRunnerState } from './todo-runner.js';
import type { AutoOrchestrateConfig } from '../../shared/config-schema.js';

// ─── 类型定义 ───────────────────────────────────────────

export type WatchdogEvent =
  | 'heartbeat_ok'
  | 'heartbeat_stalled'
  | 'task_timeout';

export interface WatchdogCheckResult {
  event: WatchdogEvent;
  taskId: string | null;
  elapsedMs: number;
  thresholdMs: number;
}

// ─── 核心检测函数 ────────────────────────────────────────

/** 检查 TASK 是否超过 max_task_duration_ms */
export function checkTaskTimeout(
  state: TodoRunnerState,
  config: AutoOrchestrateConfig,
  now?: Date,
): WatchdogCheckResult | null {
  const autoLoop = state.runtime?.autoLoop;
  if (!autoLoop?.currentTaskId || !autoLoop.taskStartedAt) return null;

  const startedAt = new Date(autoLoop.taskStartedAt).getTime();
  const currentTime = (now ?? new Date()).getTime();
  const elapsedMs = currentTime - startedAt;

  if (elapsedMs > config.max_task_duration_ms) {
    return {
      event: 'task_timeout',
      taskId: autoLoop.currentTaskId,
      elapsedMs,
      thresholdMs: config.max_task_duration_ms,
    };
  }
  return null;
}

/** 检查 heartbeat 是否超时（stalled 检测） */
export function checkHeartbeatStalled(
  state: TodoRunnerState,
  config: AutoOrchestrateConfig,
  now?: Date,
): WatchdogCheckResult | null {
  const autoLoop = state.runtime?.autoLoop;
  if (!autoLoop?.currentTaskId || !autoLoop.heartbeatAt) return null;

  const lastBeat = new Date(autoLoop.heartbeatAt).getTime();
  const currentTime = (now ?? new Date()).getTime();
  const elapsedMs = currentTime - lastBeat;

  if (elapsedMs > config.heartbeat_timeout_ms) {
    return {
      event: 'heartbeat_stalled',
      taskId: autoLoop.currentTaskId,
      elapsedMs,
      thresholdMs: config.heartbeat_timeout_ms,
    };
  }

  return {
    event: 'heartbeat_ok',
    taskId: autoLoop.currentTaskId,
    elapsedMs,
    thresholdMs: config.heartbeat_timeout_ms,
  };
}

/**
 * 综合 watchdog 检查：先查 task_timeout，再查 heartbeat_stalled
 * 返回最严重的事件，或 null 表示一切正常
 */
export function runWatchdogCheck(
  state: TodoRunnerState,
  config: AutoOrchestrateConfig,
  now?: Date,
): WatchdogCheckResult | null {
  // task timeout 优先级最高
  const timeout = checkTaskTimeout(state, config, now);
  if (timeout) return timeout;

  const heartbeat = checkHeartbeatStalled(state, config, now);
  if (heartbeat && heartbeat.event === 'heartbeat_stalled') return heartbeat;

  return null;
}

/** 更新 heartbeat 时间戳 */
export function updateHeartbeat(state: TodoRunnerState): TodoRunnerState {
  const autoLoop = state.runtime?.autoLoop;
  if (!autoLoop) return state;

  return {
    ...state,
    runtime: {
      ...state.runtime,
      autoLoop: {
        ...autoLoop,
        heartbeatAt: new Date().toISOString(),
      },
    },
  };
}

/** 更新 watchdog 检查时间戳 */
export function updateWatchdogCheckedAt(state: TodoRunnerState): TodoRunnerState {
  const autoLoop = state.runtime?.autoLoop;
  if (!autoLoop) return state;

  return {
    ...state,
    runtime: {
      ...state.runtime,
      autoLoop: {
        ...autoLoop,
        watchdogCheckedAt: new Date().toISOString(),
      },
    },
  };
}
