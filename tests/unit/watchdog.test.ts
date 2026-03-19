/**
 * Watchdog + Heartbeat + Task Timeout 测试
 * @see TASK-ORCH-004 (watchdog), TASK-ORCH-005 (timeout)
 */
import { describe, it, expect } from 'vitest';
import {
  checkTaskTimeout,
  checkHeartbeatStalled,
  runWatchdogCheck,
  updateHeartbeat,
  updateWatchdogCheckedAt,
} from '../../src/core/ai-orchestrator/watchdog.js';
import { createAutoLoopState } from '../../src/core/ai-orchestrator/todo-runner.js';
import type { TodoRunnerState } from '../../src/core/ai-orchestrator/todo-runner.js';
import type { AutoOrchestrateConfig } from '../../src/shared/config-schema.js';

const DEFAULT_CONFIG: AutoOrchestrateConfig = {
  enabled: true,
  stop_on_blocked: true,
  max_task_duration_ms: 600_000,
  heartbeat_timeout_ms: 300_000,
  watchdog_interval_ms: 10_000,
  max_retry_per_task: 3,
  retry_backoff_ms: 2_000,
  max_total_retry_duration_ms: 900_000,
  max_parallel: 1,
};

function makeState(overrides?: Partial<TodoRunnerState>): TodoRunnerState {
  return {
    featureId: 'FSREQ-WD-001',
    iteration: 0,
    maxIterations: 10,
    halted: false,
    items: [],
    updatedAt: new Date().toISOString(),
    runtime: {
      autoLoop: {
        ...createAutoLoopState(),
        currentTaskId: 'T1',
        taskStartedAt: new Date().toISOString(),
        heartbeatAt: new Date().toISOString(),
      },
    },
    ...overrides,
  };
}

// ─── ORCH-005: Task Timeout ─────────────────────────────

describe('checkTaskTimeout', () => {
  it('未超时返回 null', () => {
    const state = makeState();
    const result = checkTaskTimeout(state, DEFAULT_CONFIG);
    expect(result).toBeNull();
  });

  it('超时返回 task_timeout 事件', () => {
    const past = new Date(Date.now() - 700_000).toISOString();
    const state = makeState({
      runtime: {
        autoLoop: {
          ...createAutoLoopState(),
          currentTaskId: 'T1',
          taskStartedAt: past,
          heartbeatAt: past,
        },
      },
    });

    const result = checkTaskTimeout(state, DEFAULT_CONFIG);
    expect(result).not.toBeNull();
    expect(result!.event).toBe('task_timeout');
    expect(result!.taskId).toBe('T1');
    expect(result!.elapsedMs).toBeGreaterThan(600_000);
  });

  it('无 currentTaskId 返回 null', () => {
    const state = makeState({ runtime: undefined });
    expect(checkTaskTimeout(state, DEFAULT_CONFIG)).toBeNull();
  });
});

// ─── ORCH-004: Heartbeat Stalled ────────────────────────

describe('checkHeartbeatStalled', () => {
  it('heartbeat 正常返回 heartbeat_ok', () => {
    const state = makeState();
    const result = checkHeartbeatStalled(state, DEFAULT_CONFIG);
    expect(result).not.toBeNull();
    expect(result!.event).toBe('heartbeat_ok');
  });

  it('heartbeat 超时返回 heartbeat_stalled', () => {
    const past = new Date(Date.now() - 400_000).toISOString();
    const state = makeState({
      runtime: {
        autoLoop: {
          ...createAutoLoopState(),
          currentTaskId: 'T1',
          taskStartedAt: past,
          heartbeatAt: past,
        },
      },
    });

    const result = checkHeartbeatStalled(state, DEFAULT_CONFIG);
    expect(result).not.toBeNull();
    expect(result!.event).toBe('heartbeat_stalled');
    expect(result!.taskId).toBe('T1');
  });

  it('无 runtime 返回 null', () => {
    const state = makeState({ runtime: undefined });
    expect(checkHeartbeatStalled(state, DEFAULT_CONFIG)).toBeNull();
  });
});

// ─── 综合 watchdog 检查 ─────────────────────────────────

describe('runWatchdogCheck', () => {
  it('正常状态返回 null', () => {
    const state = makeState();
    expect(runWatchdogCheck(state, DEFAULT_CONFIG)).toBeNull();
  });

  it('task_timeout 优先于 heartbeat_stalled', () => {
    const past = new Date(Date.now() - 700_000).toISOString();
    const state = makeState({
      runtime: {
        autoLoop: {
          ...createAutoLoopState(),
          currentTaskId: 'T1',
          taskStartedAt: past,
          heartbeatAt: past,
        },
      },
    });

    const result = runWatchdogCheck(state, DEFAULT_CONFIG);
    expect(result).not.toBeNull();
    expect(result!.event).toBe('task_timeout');
  });
});

// ─── 工具函数 ───────────────────────────────────────────

describe('updateHeartbeat', () => {
  it('更新 heartbeatAt 时间戳', () => {
    const past = new Date(Date.now() - 10_000).toISOString();
    const state = makeState({
      runtime: {
        autoLoop: {
          ...createAutoLoopState(),
          currentTaskId: 'T1',
          taskStartedAt: past,
          heartbeatAt: past,
        },
      },
    });

    const updated = updateHeartbeat(state);
    expect(updated.runtime!.autoLoop!.heartbeatAt).not.toBe(past);
  });

  it('无 runtime 时原样返回', () => {
    const state = makeState({ runtime: undefined });
    const updated = updateHeartbeat(state);
    expect(updated.runtime).toBeUndefined();
  });
});

describe('updateWatchdogCheckedAt', () => {
  it('更新 watchdogCheckedAt 时间戳', () => {
    const state = makeState();
    const updated = updateWatchdogCheckedAt(state);
    expect(updated.runtime!.autoLoop!.watchdogCheckedAt).toBeTruthy();
  });
});
