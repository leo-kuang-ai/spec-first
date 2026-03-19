/**
 * Auto-Loop E2E 场景测试
 * timeout / stalled / retry-budget / audit-hash-chain
 * @see TASK-ORCH-022
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { createAutoLoopState } from '../../src/core/ai-orchestrator/todo-runner.js';
import type { TodoRunnerState } from '../../src/core/ai-orchestrator/todo-runner.js';
import { checkTaskTimeout, checkHeartbeatStalled, runWatchdogCheck } from '../../src/core/ai-orchestrator/watchdog.js';
import { makeRetryDecision, applyRetryToState } from '../../src/core/ai-orchestrator/retry-controller.js';
import { writeAuditLog, readAuditLog, verifyAuditChain } from '../../src/core/ai-orchestrator/audit-log.js';
import { DEFAULT_SPEC_FIRST_CONFIG } from '../../src/shared/config-schema.js';

const TMP = join(import.meta.dirname, '../fixtures/.tmp-e2e-auto-loop');
const FEAT = 'FSREQ-E2E-001';
const aoConfig = DEFAULT_SPEC_FIRST_CONFIG.runtime.auto_orchestrate;

/** 构造带 autoLoop 的 TodoRunnerState */
function makeState(autoLoopOverrides?: Partial<ReturnType<typeof createAutoLoopState>>): TodoRunnerState {
  const autoLoop = { ...createAutoLoopState(), ...autoLoopOverrides };
  return {
    featureId: FEAT,
    iteration: 0,
    maxIterations: 5,
    halted: false,
    items: [],
    updatedAt: new Date().toISOString(),
    runtime: { autoLoop },
  };
}

beforeEach(() => {
  mkdirSync(join(TMP, '.spec-first'), { recursive: true });
  mkdirSync(join(TMP, 'specs', FEAT), { recursive: true });
  // 启用审计日志的 config
  writeFileSync(join(TMP, '.spec-first', 'config.yaml'), yaml.dump({
    version: '1.0',
    runtime: { audit_log: { enabled: true, tamper_proof: 'hash_chain' } },
  }));
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

// ─── Scenario 1: Task Timeout ────────────────────────────

describe('Task Timeout 场景', () => {
  it('任务运行超过 max_task_duration_ms 触发 task_timeout', () => {
    const tenMinAgo = new Date(Date.now() - 700_000).toISOString();
    const state = makeState({
      currentTaskId: 'TASK-001',
      taskStartedAt: tenMinAgo,
      heartbeatAt: new Date().toISOString(),
    });

    const result = checkTaskTimeout(state, aoConfig);
    expect(result).not.toBeNull();
    expect(result!.event).toBe('task_timeout');
    expect(result!.taskId).toBe('TASK-001');
    expect(result!.elapsedMs).toBeGreaterThan(aoConfig.max_task_duration_ms);
  });

  it('未超时返回 null', () => {
    const state = makeState({
      currentTaskId: 'TASK-001',
      taskStartedAt: new Date().toISOString(),
      heartbeatAt: new Date().toISOString(),
    });

    expect(checkTaskTimeout(state, aoConfig)).toBeNull();
  });

  it('task_timeout 优先于 heartbeat_stalled', () => {
    const longAgo = new Date(Date.now() - 700_000).toISOString();
    const state = makeState({
      currentTaskId: 'TASK-001',
      taskStartedAt: longAgo,
      heartbeatAt: longAgo,
    });

    const result = runWatchdogCheck(state, aoConfig);
    expect(result!.event).toBe('task_timeout');
  });
});

// ─── Scenario 2: Heartbeat Stalled ───────────────────────

describe('Heartbeat Stalled 场景', () => {
  it('heartbeat 超过 heartbeat_timeout_ms 触发 stalled', () => {
    const stalledAt = new Date(Date.now() - 400_000).toISOString();
    const state = makeState({
      currentTaskId: 'TASK-002',
      taskStartedAt: new Date().toISOString(),
      heartbeatAt: stalledAt,
    });

    const result = checkHeartbeatStalled(state, aoConfig);
    expect(result).not.toBeNull();
    expect(result!.event).toBe('heartbeat_stalled');
    expect(result!.elapsedMs).toBeGreaterThan(aoConfig.heartbeat_timeout_ms);
  });

  it('heartbeat 正常返回 heartbeat_ok', () => {
    const state = makeState({
      currentTaskId: 'TASK-002',
      taskStartedAt: new Date().toISOString(),
      heartbeatAt: new Date().toISOString(),
    });

    const result = checkHeartbeatStalled(state, aoConfig);
    expect(result).not.toBeNull();
    expect(result!.event).toBe('heartbeat_ok');
  });

  it('无 currentTaskId 返回 null', () => {
    const state = makeState();
    expect(checkHeartbeatStalled(state, aoConfig)).toBeNull();
  });
});

// ─── Scenario 3: Retry Budget Exhaustion ─────────────────

describe('Retry Budget 耗尽场景', () => {
  it('连续重试直到预算耗尽', () => {
    let state = makeState({
      currentTaskId: 'TASK-003',
      taskStartedAt: new Date().toISOString(),
    });

    // 模拟连续 3 次重试（max_retry_per_task=3）
    for (let i = 0; i < 3; i++) {
      const retry = state.runtime!.autoLoop!.retry;
      const decision = makeRetryDecision('timeout error', retry, aoConfig);
      expect(decision.shouldRetry).toBe(true);
      state = applyRetryToState(state, decision, 'timeout error');
    }

    // 第 4 次应被拒绝
    const retry = state.runtime!.autoLoop!.retry;
    expect(retry.regenerateCount).toBe(3);
    const decision = makeRetryDecision('timeout error', retry, aoConfig);
    expect(decision.shouldRetry).toBe(false);
    expect(decision.reason).toContain('max_retry_per_task');
  });

  it('总时长预算耗尽也阻断', () => {
    const state = makeState({
      currentTaskId: 'TASK-003',
      taskStartedAt: new Date().toISOString(),
      retry: {
        regenerateCount: 1,
        autoRetryCount: 0,
        manualRevisionCount: 0,
        totalRetryDurationMs: 900_000,
        lastFailureReason: 'previous timeout',
      },
    });

    const decision = makeRetryDecision(
      'timeout error',
      state.runtime!.autoLoop!.retry,
      aoConfig,
    );
    expect(decision.shouldRetry).toBe(false);
    expect(decision.reason).toBe('retry_budget_exhausted');
  });
});

// ─── Scenario 4: Audit Hash Chain ────────────────────────

describe('Audit Hash Chain 场景', () => {
  it('连续写入多条日志后 hash chain 校验通过', () => {
    writeAuditLog({ event: 'task_started', featureId: FEAT, taskId: 'T-1' }, TMP);
    writeAuditLog({ event: 'task_completed', featureId: FEAT, taskId: 'T-1' }, TMP);
    writeAuditLog({ event: 'task_started', featureId: FEAT, taskId: 'T-2' }, TMP);

    const result = verifyAuditChain(FEAT, TMP);
    expect(result.valid).toBe(true);
    expect(result.totalRecords).toBe(3);
  });

  it('首条记录 prevHash 为全零', () => {
    writeAuditLog({ event: 'iteration_start', featureId: FEAT }, TMP);
    const records = readAuditLog(FEAT, TMP);
    expect(records[0].prevHash).toBe('0'.repeat(64));
  });

  it('后续记录 prevHash 等于前一条 hash', () => {
    writeAuditLog({ event: 'e1', featureId: FEAT }, TMP);
    writeAuditLog({ event: 'e2', featureId: FEAT }, TMP);
    const records = readAuditLog(FEAT, TMP);
    expect(records[1].prevHash).toBe(records[0].hash);
  });

  it('篡改记录后 hash chain 校验失败', () => {
    writeAuditLog({ event: 'e1', featureId: FEAT }, TMP);
    writeAuditLog({ event: 'e2', featureId: FEAT }, TMP);
    writeAuditLog({ event: 'e3', featureId: FEAT }, TMP);

    // 篡改第 2 条记录
    const logPath = join(TMP, 'specs', FEAT, 'audit.jsonl');
    const lines = readFileSync(logPath, 'utf-8').trim().split('\n');
    const tampered = JSON.parse(lines[1]);
    tampered.event = 'tampered_event';
    lines[1] = JSON.stringify(tampered);
    writeFileSync(logPath, lines.join('\n') + '\n', 'utf-8');

    const result = verifyAuditChain(FEAT, TMP);
    expect(result.valid).toBe(false);
    expect(result.brokenAt).toBe(1);
    expect(result.reason).toContain('hash mismatch');
  });

  it('空日志校验通过', () => {
    const result = verifyAuditChain(FEAT, TMP);
    expect(result.valid).toBe(true);
    expect(result.totalRecords).toBe(0);
  });
});
