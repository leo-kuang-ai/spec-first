/**
 * Todo Status 归一化测试
 * @see TASK-ORCH-002 状态分层与状态词汇统一
 */
import { describe, it, expect } from 'vitest';
import {
  normalizeTodoStatus,
  createAutoLoopState,
  getAutoLoopState,
} from '../../src/core/ai-orchestrator/todo-runner.js';
import type { TodoRunnerState } from '../../src/core/ai-orchestrator/todo-runner.js';

describe('normalizeTodoStatus', () => {
  it('done → done', () => {
    expect(normalizeTodoStatus('done')).toBe('done');
  });

  it('complete → done', () => {
    expect(normalizeTodoStatus('complete')).toBe('done');
  });

  it('verified → done', () => {
    expect(normalizeTodoStatus('verified')).toBe('done');
  });

  it('in progress → in_progress', () => {
    expect(normalizeTodoStatus('in progress')).toBe('in_progress');
  });

  it('in_progress → in_progress', () => {
    expect(normalizeTodoStatus('in_progress')).toBe('in_progress');
  });

  it('pending → pending', () => {
    expect(normalizeTodoStatus('pending')).toBe('pending');
  });

  it('blocked → blocked', () => {
    expect(normalizeTodoStatus('blocked')).toBe('blocked');
  });

  it('大小写不敏感: Complete → done', () => {
    expect(normalizeTodoStatus('Complete')).toBe('done');
  });

  it('未知状态原样返回', () => {
    expect(normalizeTodoStatus('unknown_status')).toBe('unknown_status');
  });
});

describe('createAutoLoopState', () => {
  it('返回空初始状态', () => {
    const state = createAutoLoopState();
    expect(state.currentTaskId).toBeNull();
    expect(state.taskStartedAt).toBeNull();
    expect(state.heartbeatAt).toBeNull();
    expect(state.watchdogCheckedAt).toBeNull();
    expect(state.retry.regenerateCount).toBe(0);
    expect(state.retry.totalRetryDurationMs).toBe(0);
    expect(state.retry.lastFailureReason).toBeNull();
    expect(state.lastResult).toBeNull();
  });
});

describe('getAutoLoopState', () => {
  it('有 runtime.autoLoop 时返回', () => {
    const state: TodoRunnerState = {
      featureId: 'FSREQ-001',
      iteration: 0,
      maxIterations: 10,
      halted: false,
      items: [],
      updatedAt: new Date().toISOString(),
      runtime: { autoLoop: createAutoLoopState() },
    };
    expect(getAutoLoopState(state)).toBeDefined();
    expect(getAutoLoopState(state)!.currentTaskId).toBeNull();
  });

  it('无 runtime 时返回 undefined（legacy 兼容）', () => {
    const state: TodoRunnerState = {
      featureId: 'FSREQ-001',
      iteration: 0,
      maxIterations: 10,
      halted: false,
      items: [],
      updatedAt: new Date().toISOString(),
    };
    expect(getAutoLoopState(state)).toBeUndefined();
  });
});
