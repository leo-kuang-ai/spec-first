/**
 * 重试控制器：统一计数、失败原因注入、退避与预算
 * @see TASK-ORCH-011 (重试计数统一), TASK-ORCH-012 (失败原因注入), TASK-ORCH-013 (backoff + budget)
 */
import type { AutoLoopRetry, TodoRunnerState } from './todo-runner.js';
import { createAutoLoopState } from './todo-runner.js';
import type { AutoOrchestrateConfig } from '../../shared/config-schema.js';

// ─── 类型定义 ───────────────────────────────────────────

/** 错误分类：永久错误不消耗重试，临时错误计入，未知保守按临时处理 */
export type ErrorCategory = 'permanent' | 'temporary' | 'unknown';

/** 重试决策结果 */
export interface RetryDecision {
  shouldRetry: boolean;
  reason: string;
  backoffMs: number;
  errorCategory: ErrorCategory;
}

/** 失败原因注入结构 */
export interface FailureInjection {
  reason: string;
  fingerprint: string;
  consecutiveCount: number;
  forceBackoff: boolean;
}

// ─── 永久错误关键词（直接 blocked，不消耗 regenerateCount） ──

const PERMANENT_ERROR_PATTERNS = [
  'ENOENT',
  'EACCES',
  'EPERM',
  'MODULE_NOT_FOUND',
  'SyntaxError',
  'TypeError: Cannot read',
  'schema validation failed',
  'missing required field',
];

// ─── ORCH-013: 错误分类 ─────────────────────────────────

/** 错误分类：永久错误直接 blocked，临时错误计入重试，未知按临时处理 */
export function classifyError(message: string): ErrorCategory {
  const lower = message.toLowerCase();
  for (const pattern of PERMANENT_ERROR_PATTERNS) {
    if (lower.includes(pattern.toLowerCase())) return 'permanent';
  }
  // 网络/超时类视为临时
  if (lower.includes('timeout') || lower.includes('econnrefused') || lower.includes('rate limit')) {
    return 'temporary';
  }
  return 'unknown';
}

// ─── ORCH-012: 失败指纹与原因注入 ───────────────────────

/** 计算失败原因指纹（用于检测连续相同失败） */
export function computeFingerprint(reason: string): string {
  // 简化指纹：去除数字和空白差异，取前 100 字符
  return reason.replace(/\d+/g, 'N').replace(/\s+/g, ' ').trim().slice(0, 100);
}

/**
 * 构建失败原因注入结构
 * 同一 fingerprint 连续 2 次 → forceBackoff
 */
export function buildFailureInjection(
  reason: string,
  previousReason: string | null,
): FailureInjection {
  const fingerprint = computeFingerprint(reason);
  const prevFingerprint = previousReason ? computeFingerprint(previousReason) : null;
  const consecutive = fingerprint === prevFingerprint ? 2 : 1;

  return {
    reason,
    fingerprint,
    consecutiveCount: consecutive,
    forceBackoff: consecutive >= 2,
  };
}

// ─── ORCH-013: 指数退避 ─────────────────────────────────

/** 指数退避：base * 2^(attempt-1)，上限 30s */
export function computeBackoffMs(baseMs: number, attempt: number): number {
  const raw = baseMs * Math.pow(2, Math.max(0, attempt - 1));
  return Math.min(raw, 30_000);
}

// ─── ORCH-013: 预算检查 ─────────────────────────────────

/** 检查总重试时长是否超出预算 */
export function isRetryBudgetExhausted(
  retry: AutoLoopRetry,
  maxTotalMs: number,
): boolean {
  return retry.totalRetryDurationMs >= maxTotalMs;
}

// ─── ORCH-011: 统一重试计数 ─────────────────────────────

/** legacy 计数折算：将旧的 autoRetryCount + manualRevisionCount 折入 regenerateCount */
export function migrateLegacyRetryCount(retry: AutoLoopRetry): AutoLoopRetry {
  const legacyTotal = retry.autoRetryCount + retry.manualRevisionCount;
  if (legacyTotal === 0) return retry;
  return {
    ...retry,
    regenerateCount: retry.regenerateCount + legacyTotal,
    autoRetryCount: 0,
    manualRevisionCount: 0,
  };
}

// ─── 主决策函数 ──────────────────────────────────────────

/**
 * 综合重试决策：错误分类 → 预算检查 → 计数检查 → 退避计算
 * 返回是否应重试及退避时长
 */
export function makeRetryDecision(
  failureMessage: string,
  retry: AutoLoopRetry,
  config: AutoOrchestrateConfig,
): RetryDecision {
  const category = classifyError(failureMessage);

  // 永久错误：直接 blocked，不消耗 regenerateCount
  if (category === 'permanent') {
    return {
      shouldRetry: false,
      reason: `permanent error: ${failureMessage}`,
      backoffMs: 0,
      errorCategory: category,
    };
  }

  // 预算耗尽
  if (isRetryBudgetExhausted(retry, config.max_total_retry_duration_ms)) {
    return {
      shouldRetry: false,
      reason: 'retry_budget_exhausted',
      backoffMs: 0,
      errorCategory: category,
    };
  }

  // 单任务重试次数耗尽
  if (retry.regenerateCount >= config.max_retry_per_task) {
    return {
      shouldRetry: false,
      reason: `max_retry_per_task reached: ${retry.regenerateCount}/${config.max_retry_per_task}`,
      backoffMs: 0,
      errorCategory: category,
    };
  }

  // 可重试：计算退避
  const backoffMs = computeBackoffMs(config.retry_backoff_ms, retry.regenerateCount + 1);

  return {
    shouldRetry: true,
    reason: 'retryable',
    backoffMs,
    errorCategory: category,
  };
}

// ─── 状态更新辅助 ────────────────────────────────────────

/** 将重试决策应用到 state：递增 regenerateCount + 注入 lastFailureReason + 累加退避时长 */
export function applyRetryToState(
  state: TodoRunnerState,
  decision: RetryDecision,
  failureMessage: string,
): TodoRunnerState {
  const autoLoop = state.runtime?.autoLoop ?? createAutoLoopState();
  const retry = autoLoop.retry;

  const updatedRetry: AutoLoopRetry = {
    ...retry,
    lastFailureReason: failureMessage,
  };

  // 临时/未知错误才消耗 regenerateCount
  if (decision.errorCategory !== 'permanent' && decision.shouldRetry) {
    updatedRetry.regenerateCount = retry.regenerateCount + 1;
    updatedRetry.totalRetryDurationMs = retry.totalRetryDurationMs + decision.backoffMs;
  }

  return {
    ...state,
    runtime: {
      ...state.runtime,
      autoLoop: { ...autoLoop, retry: updatedRetry },
    },
    updatedAt: new Date().toISOString(),
  };
}
