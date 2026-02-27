/**
 * 重试控制器测试 + 失败路径补齐
 * @see TASK-ORCH-011 (重试计数), TASK-ORCH-012 (失败注入), TASK-ORCH-013 (backoff + budget), TASK-ORCH-021
 */
import { describe, it, expect } from 'vitest';
import {
  classifyError,
  computeFingerprint,
  buildFailureInjection,
  computeBackoffMs,
  isRetryBudgetExhausted,
  migrateLegacyRetryCount,
  makeRetryDecision,
  applyRetryToState,
} from '../../src/core/ai-orchestrator/retry-controller.js';
import type { AutoLoopRetry, TodoRunnerState } from '../../src/core/ai-orchestrator/todo-runner.js';
import { createAutoLoopState } from '../../src/core/ai-orchestrator/todo-runner.js';
import type { AutoOrchestrateConfig } from '../../src/shared/config-schema.js';
import { DEFAULT_SPEC_FIRST_CONFIG } from '../../src/shared/config-schema.js';

const defaultConfig = DEFAULT_SPEC_FIRST_CONFIG.runtime.auto_orchestrate;

function makeRetry(overrides?: Partial<AutoLoopRetry>): AutoLoopRetry {
  return {
    regenerateCount: 0,
    autoRetryCount: 0,
    manualRevisionCount: 0,
    totalRetryDurationMs: 0,
    lastFailureReason: null,
    ...overrides,
  };
}

// ─── classifyError ───────────────────────────────────────

describe('classifyError', () => {
  it('ENOENT → permanent', () => {
    expect(classifyError('ENOENT: no such file')).toBe('permanent');
  });

  it('SyntaxError → permanent', () => {
    expect(classifyError('SyntaxError: unexpected token')).toBe('permanent');
  });

  it('timeout → temporary', () => {
    expect(classifyError('request timeout after 30s')).toBe('temporary');
  });

  it('rate limit → temporary', () => {
    expect(classifyError('rate limit exceeded')).toBe('temporary');
  });

  it('未知错误 → unknown', () => {
    expect(classifyError('something went wrong')).toBe('unknown');
  });

  // ─── 失败路径补齐（ORCH-021） ──────────────────────────
  it('EACCES → permanent', () => {
    expect(classifyError('EACCES: permission denied')).toBe('permanent');
  });

  it('MODULE_NOT_FOUND → permanent', () => {
    expect(classifyError('MODULE_NOT_FOUND: cannot find module')).toBe('permanent');
  });

  it('econnrefused → temporary', () => {
    expect(classifyError('connect ECONNREFUSED 127.0.0.1:3000')).toBe('temporary');
  });

  it('schema validation failed → permanent', () => {
    expect(classifyError('schema validation failed: missing field')).toBe('permanent');
  });
});

// ─── computeFingerprint ──────────────────────────────────

describe('computeFingerprint', () => {
  it('数字归一化', () => {
    const a = computeFingerprint('error at line 42 col 10');
    const b = computeFingerprint('error at line 99 col 5');
    expect(a).toBe(b);
  });

  it('空白归一化', () => {
    const a = computeFingerprint('error  in   module');
    const b = computeFingerprint('error in module');
    expect(a).toBe(b);
  });

  it('截断到 100 字符', () => {
    const long = 'x'.repeat(200);
    expect(computeFingerprint(long).length).toBe(100);
  });
});

// ─── buildFailureInjection ───────────────────────────────

describe('buildFailureInjection', () => {
  it('首次失败 consecutiveCount=1', () => {
    const result = buildFailureInjection('error A', null);
    expect(result.consecutiveCount).toBe(1);
    expect(result.forceBackoff).toBe(false);
  });

  it('不同原因 consecutiveCount=1', () => {
    const result = buildFailureInjection('error A', 'error B');
    expect(result.consecutiveCount).toBe(1);
    expect(result.forceBackoff).toBe(false);
  });

  it('相同指纹连续 2 次 → forceBackoff', () => {
    const result = buildFailureInjection('error at line 1', 'error at line 2');
    expect(result.consecutiveCount).toBe(2);
    expect(result.forceBackoff).toBe(true);
  });
});

// ─── computeBackoffMs ────────────────────────────────────

describe('computeBackoffMs', () => {
  it('第 1 次 = base', () => {
    expect(computeBackoffMs(2000, 1)).toBe(2000);
  });

  it('第 2 次 = base * 2', () => {
    expect(computeBackoffMs(2000, 2)).toBe(4000);
  });

  it('第 3 次 = base * 4', () => {
    expect(computeBackoffMs(2000, 3)).toBe(8000);
  });

  it('上限 30s', () => {
    expect(computeBackoffMs(2000, 10)).toBe(30_000);
  });
});

// ─── isRetryBudgetExhausted ──────────────────────────────

describe('isRetryBudgetExhausted', () => {
  it('未超预算', () => {
    expect(isRetryBudgetExhausted(makeRetry({ totalRetryDurationMs: 100 }), 900_000)).toBe(false);
  });

  it('已超预算', () => {
    expect(isRetryBudgetExhausted(makeRetry({ totalRetryDurationMs: 900_000 }), 900_000)).toBe(true);
  });
});

// ─── migrateLegacyRetryCount ─────────────────────────────

describe('migrateLegacyRetryCount', () => {
  it('无 legacy 计数不变', () => {
    const retry = makeRetry({ regenerateCount: 2 });
    const result = migrateLegacyRetryCount(retry);
    expect(result.regenerateCount).toBe(2);
  });

  it('legacy 计数折入 regenerateCount', () => {
    const retry = makeRetry({ regenerateCount: 1, autoRetryCount: 2, manualRevisionCount: 1 });
    const result = migrateLegacyRetryCount(retry);
    expect(result.regenerateCount).toBe(4);
    expect(result.autoRetryCount).toBe(0);
    expect(result.manualRevisionCount).toBe(0);
  });
});

// ─── makeRetryDecision ──────────────────────────────────

describe('makeRetryDecision', () => {
  it('永久错误 → 不重试', () => {
    const d = makeRetryDecision('ENOENT: no such file', makeRetry(), defaultConfig);
    expect(d.shouldRetry).toBe(false);
    expect(d.errorCategory).toBe('permanent');
    expect(d.reason).toContain('permanent');
  });

  it('预算耗尽 → 不重试', () => {
    const retry = makeRetry({ totalRetryDurationMs: 900_000 });
    const d = makeRetryDecision('timeout error', retry, defaultConfig);
    expect(d.shouldRetry).toBe(false);
    expect(d.reason).toBe('retry_budget_exhausted');
  });

  it('单任务重试次数耗尽 → 不重试', () => {
    const retry = makeRetry({ regenerateCount: 3 });
    const d = makeRetryDecision('timeout error', retry, defaultConfig);
    expect(d.shouldRetry).toBe(false);
    expect(d.reason).toContain('max_retry_per_task');
  });

  it('可重试 → shouldRetry + backoff', () => {
    const d = makeRetryDecision('timeout error', makeRetry(), defaultConfig);
    expect(d.shouldRetry).toBe(true);
    expect(d.reason).toBe('retryable');
    expect(d.backoffMs).toBe(2000); // base * 2^0 for first attempt
    expect(d.errorCategory).toBe('temporary');
  });

  it('未知错误也可重试', () => {
    const d = makeRetryDecision('something weird', makeRetry(), defaultConfig);
    expect(d.shouldRetry).toBe(true);
    expect(d.errorCategory).toBe('unknown');
  });
});

// ─── applyRetryToState ──────────────────────────────────

describe('applyRetryToState', () => {
  function makeState(): TodoRunnerState {
    return {
      version: '2.0',
      featureId: 'test',
      todos: [],
      runtime: { autoLoop: createAutoLoopState() },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  it('可重试决策递增 regenerateCount', () => {
    const state = makeState();
    const decision = makeRetryDecision('timeout', makeRetry(), defaultConfig);
    const updated = applyRetryToState(state, decision, 'timeout');
    expect(updated.runtime!.autoLoop!.retry.regenerateCount).toBe(1);
  });

  it('累加 totalRetryDurationMs', () => {
    const state = makeState();
    const decision = makeRetryDecision('timeout', makeRetry(), defaultConfig);
    const updated = applyRetryToState(state, decision, 'timeout');
    expect(updated.runtime!.autoLoop!.retry.totalRetryDurationMs).toBe(decision.backoffMs);
  });

  it('设置 lastFailureReason', () => {
    const state = makeState();
    const decision = makeRetryDecision('timeout', makeRetry(), defaultConfig);
    const updated = applyRetryToState(state, decision, 'timeout happened');
    expect(updated.runtime!.autoLoop!.retry.lastFailureReason).toBe('timeout happened');
  });

  it('永久错误不递增 regenerateCount', () => {
    const state = makeState();
    const decision = makeRetryDecision('ENOENT: missing', makeRetry(), defaultConfig);
    const updated = applyRetryToState(state, decision, 'ENOENT: missing');
    expect(updated.runtime!.autoLoop!.retry.regenerateCount).toBe(0);
    expect(updated.runtime!.autoLoop!.retry.lastFailureReason).toBe('ENOENT: missing');
  });

  it('无 runtime.autoLoop 时回退到默认状态', () => {
    const state: TodoRunnerState = {
      featureId: 'test',
      items: [],
      iteration: 0,
      maxIterations: 3,
      halted: false,
      updatedAt: new Date().toISOString(),
    };
    const decision = makeRetryDecision('timeout', makeRetry(), defaultConfig);
    const updated = applyRetryToState(state, decision, 'timeout');
    expect(updated.runtime!.autoLoop).toBeDefined();
    expect(updated.runtime!.autoLoop!.retry.regenerateCount).toBe(1);
  });
});
