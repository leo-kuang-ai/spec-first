/**
 * Auto-Loop 主循环
 * pick → execute → checkpoint → iteration
 * @see TASK-ORCH-003, V2-13§5.1
 */
import { readFileSync } from 'node:fs';
import {
  loadTodoState,
  saveTodoState,
  pickReadyTodos,
  updateTodoStatus,
  updateTodoItem,
  advanceTodoIteration,
  diagnoseStuckReason,
  createAutoLoopState,
  cascadeBlocked,
} from './todo-runner.js';
import type { TodoRunnerState, TodoItem, HaltReasonCode } from './todo-runner.js';
import { loadConfig } from '../../shared/config-schema.js';
import { exists } from '../../shared/fs-utils.js';
import type { OrchestrateArgs } from '../skill-runtime/orchestrate-args.js';
import { parseSkillFrontMatter, resolveWriteMode } from '../skill-runtime/front-matter.js';
import type { SkillFrontMatter } from '../skill-runtime/front-matter.js';
import { idempotentWrite } from '../skill-runtime/idempotent-write.js';
import { loadCompletionMarkers, runFullCompletionDetection } from './completion-detector.js';
import { checkRequiredMcps } from './mcp-checker.js';
import { loadSlopRules, runSlopCheck } from './slop-checker.js';
import { writeAuditLog } from './audit-log.js';
import { runWatchdogCheck, updateHeartbeat, updateWatchdogCheckedAt } from './watchdog.js';
import { makeRetryDecision, applyRetryToState } from './retry-controller.js';

// ─── 类型定义 ───────────────────────────────────────────

export type TaskExecutor = (task: TodoItem, state: TodoRunnerState) => Promise<TaskResult>;

export interface TaskResult {
  success: boolean;
  message: string;
  /** 产出关联 Skill 文件路径（用于 front matter 解析） */
  skillPath?: string;
  /** 生成内容（优先级高于 outputPath） */
  outputContent?: string;
  /** 生成内容文件路径（用于 completion/slop 检测） */
  outputPath?: string;
  /** 幂等写入目标路径（结合 write_mode） */
  writePath?: string;
}

export interface AutoLoopOptions {
  featureId: string;
  projectRoot: string;
  args: OrchestrateArgs;
  executor: TaskExecutor;
  onCheckpoint?: (state: TodoRunnerState) => void;
  onIteration?: (iteration: number, state: TodoRunnerState) => void;
}

export type AutoLoopStatus =
  | 'all_done'
  | 'has_blocked'
  | 'timeout'
  | 'no_state_file'
  | 'max_iterations'
  | 'incomplete';

export interface AutoLoopResult {
  halted: boolean;
  haltReason?: string;
  status: AutoLoopStatus;
  iterations: number;
  completedTasks: string[];
}

interface GuardResult {
  passed: boolean;
  reason?: string;
  /** P7: block=环境问题需人工介入, retry_with_correction=质量问题可重试 */
  policy?: 'block' | 'retry_with_correction';
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

/** P9: 进程重启后恢复中断的任务，将僵尸 in_progress 重置为 pending */
function recoverInterruptedTasks(
  state: TodoRunnerState,
  featureId: string,
  projectRoot: string
): TodoRunnerState {
  const zombies = state.items.filter((i) => i.status === 'in_progress');
  if (zombies.length === 0) return state;

  // 清理运行态
  let recovered = state;
  for (const z of zombies) {
    recovered = updateTodoStatus(recovered, z.id, 'pending');
    // 递增 retryCount 防止无限崩溃重试循环
    recovered = updateTodoItem(recovered, z.id, {
      retryCount: (z.retryCount ?? 0) + 1,
      lastFailureReason: 'process_crash_recovery',
    });
    writeAuditLog({ event: 'zombie_recovered', featureId, taskId: z.id }, projectRoot);
  }

  // 清理 autoLoop 运行态（全部 4 个瞬时字段必须重置，避免重启后 watchdog 按旧时间戳误判超时）
  const autoLoop = recovered.runtime?.autoLoop ?? createAutoLoopState();
  recovered = {
    ...recovered,
    runtime: {
      ...recovered.runtime,
      autoLoop: {
        ...autoLoop,
        currentTaskId: null,
        taskStartedAt: null,
        heartbeatAt: null,
        watchdogCheckedAt: null,
      },
    },
  };

  return recovered;
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
    return {
      halted: true,
      haltReason: 'no_state_file',
      status: 'no_state_file',
      iterations: 0,
      completedTasks: [],
    };
  }

  state = ensureAutoLoopState(state);

  // P9 fix: 进程重启后恢复 in_progress 僵尸任务 → pending
  state = recoverInterruptedTasks(state, featureId, projectRoot);

  const completedTasks: string[] = [];
  const startIteration = state.iteration;

  // P8 fix: 循环外预加载项目级 slop 规则，避免每个任务都重新读磁盘
  // completionMarkers 不缓存：Skill 级 markers 优先于项目级，每个任务的 skillMeta 不同
  const preloadedSlopRules = loadSlopRules(projectRoot);

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

      // F-07: 检查是否有任务在退避等待中
      const now = Date.now();
      const waitingTasks = state.items.filter(
        (i) => i.status === 'pending' && i.resumeAt !== undefined && i.resumeAt > now
      );

      if (waitingTasks.length > 0) {
        // 找到最早的恢复时间
        const earliestResume = Math.min(...waitingTasks.map((t) => t.resumeAt!));
        const waitMs = earliestResume - now;

        if (waitMs > 0) {
          writeAuditLog(
            {
              event: 'backoff_wait',
              featureId,
              detail: { waitMs, waitingTaskIds: waitingTasks.map((t) => t.id) },
            },
            projectRoot
          );

          // 等待退避时间
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          continue; // 重新 pick，这次应该能拿到 ready 任务
        }
      }

      // P5 fix: 在 advance iteration 前诊断是否存在死锁
      const diagnosis = diagnoseStuckReason(state);
      if (diagnosis.type !== 'waiting_for_deps') {
        writeAuditLog(
          {
            event: 'loop_stuck',
            featureId,
            detail: { type: diagnosis.type, taskIds: diagnosis.taskIds },
          },
          projectRoot
        );
        state = haltState(state, 'blocked');
        state = {
          ...state,
          haltReason: `stuck_${diagnosis.type}${diagnosis.taskIds ? ':' + diagnosis.taskIds.join(',') : ''}`,
        };
        checkpoint(state, projectRoot, onCheckpoint);
        return buildResult(state, startIteration, completedTasks);
      }

      // 有未完成但无可执行 → advance iteration 等待依赖
      state = advanceTodoIteration(state);
      checkpoint(state, projectRoot, onCheckpoint);
      onIteration?.(state.iteration, state);
      continue;
    }

    // 2) 执行每个 ready TASK
    // 设计决策：即使 pickReadyTodos 返回多个 [P] 任务，此处仍串行 await 执行。
    // 原因：(a) executor 是 LLM API 调用，受 rate limit 制约，并行收益有限；
    //       (b) AutoLoopState（currentTaskId/heartbeatAt/retry）是单任务结构，
    //           并行化需要完整重构为多任务跟踪 + fork-execute-merge 模型；
    //       (c) 默认 max_parallel=1，当前无实际并行场景。
    // 如需真正并行，参见审查报告 P10 附录中的改造路径分析。
    for (const task of ready) {
      state = markTaskStarted(state, task.id);
      checkpoint(state, projectRoot, onCheckpoint);

      // 审计：task_started
      writeAuditLog({ event: 'task_started', featureId, taskId: task.id }, projectRoot);

      // P1 fix: Promise.race 防止 executor 挂起导致主循环永久卡死
      // 注意：超时后 executor 内部已发出的异步操作仍可能继续运行，
      // 此处仅让 Auto-Loop 主循环能够继续推进，不是真正的取消机制。
      const taskTimeoutMs = cfg.runtime.auto_orchestrate.max_task_duration_ms;
      let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
      const result = await Promise.race([
        executor(task, state),
        new Promise<TaskResult>((_, reject) => {
          timeoutHandle = setTimeout(
            () => reject(new Error(`TASK_TIMEOUT:${task.id}:${taskTimeoutMs}ms`)),
            taskTimeoutMs
          );
        }),
      ])
        .catch(
          (err: Error): TaskResult => ({
            success: false,
            message: err.message,
          })
        )
        .finally(() => {
          if (timeoutHandle) clearTimeout(timeoutHandle);
        });

      // 执行后更新 heartbeat + watchdog 检查
      state = updateHeartbeat(state);
      state = updateWatchdogCheckedAt(state);

      const watchdogResult = runWatchdogCheck(state, cfg.runtime.auto_orchestrate);
      if (watchdogResult) {
        writeAuditLog(
          {
            event: watchdogResult.event,
            featureId,
            taskId: task.id,
            detail: {
              elapsedMs: watchdogResult.elapsedMs,
              thresholdMs: watchdogResult.thresholdMs,
            },
          },
          projectRoot
        );

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
        const guard = runPostWriteGuards(task, result, featureId, projectRoot, preloadedSlopRules);
        if (!guard.passed) {
          // P7: 区分 block（环境问题）和 retry_with_correction（质量问题）
          if (guard.policy === 'retry_with_correction') {
            const retryState = state.runtime?.autoLoop?.retry ?? createAutoLoopState().retry;
            const guardRetryDecision = makeRetryDecision(
              `GUARD_CORRECTION:${guard.reason}`,
              retryState,
              cfg.runtime.auto_orchestrate,
              task.retryCount ?? 0,
              task.lastFailureReason ?? null
            );

            if (guardRetryDecision.shouldRetry) {
              state = updateTodoStatus(state, task.id, 'pending');
              state = updateTodoItem(state, task.id, {
                retryCount: (task.retryCount ?? 0) + 1,
                lastFailureReason: `GUARD_CORRECTION:${guard.reason}`,
                resumeAt: Date.now() + guardRetryDecision.backoffMs,
              });
              state = updateAutoLoopLastResult(
                state,
                task.id,
                'pending',
                `guard retry scheduled (${guardRetryDecision.backoffMs}ms): ${guard.reason}`
              );
              writeAuditLog(
                {
                  event: 'guard_retry_scheduled',
                  featureId,
                  taskId: task.id,
                  detail: { reason: guard.reason, backoffMs: guardRetryDecision.backoffMs },
                },
                projectRoot
              );
              state = applyRetryToState(
                state,
                guardRetryDecision,
                `GUARD_CORRECTION:${guard.reason}`
              );
              checkpoint(state, projectRoot, onCheckpoint);
              continue;
            }
            // guard 重试预算耗尽 → 降级为 blocked
          }

          // block 策略或 retry 预算耗尽
          state = updateTodoStatus(state, task.id, 'blocked');
          state = updateAutoLoopLastResult(
            state,
            task.id,
            'blocked',
            guard.reason ?? 'post-write guard failed'
          );
          writeAuditLog(
            {
              event: 'task_blocked',
              featureId,
              taskId: task.id,
              detail: { message: guard.reason ?? 'post-write guard failed' },
            },
            projectRoot
          );

          if (cfg.runtime.auto_orchestrate.stop_on_blocked) {
            // NEW-2: cascade blocked 下游后再 halt，状态文件准确反映传播结果
            const { state: cs, cascaded: cc } = cascadeBlocked(state);
            if (cc.length > 0) {
              state = cs;
              writeAuditLog(
                { event: 'blocked_cascade', featureId, detail: { cascaded: cc } },
                projectRoot
              );
            }
            state = haltState(state, 'blocked', task.id);
            checkpoint(state, projectRoot, onCheckpoint);
            return buildResult(state, startIteration, completedTasks);
          }
          continue;
        }

        state = updateTodoStatus(state, task.id, 'done');
        state = updateAutoLoopLastResult(state, task.id, 'done', result.message);
        completedTasks.push(task.id);
        writeAuditLog({ event: 'task_done', featureId, taskId: task.id }, projectRoot);
      } else {
        const retryState = state.runtime?.autoLoop?.retry ?? createAutoLoopState().retry;
        // P4: 传入任务级 retryCount，优先于全局 regenerateCount
        // NEW-1: 传入任务级 lastFailureReason，fingerprint 比对用任务级上下文，避免多任务污染
        const retryDecision = makeRetryDecision(
          result.message,
          retryState,
          cfg.runtime.auto_orchestrate,
          task.retryCount ?? 0,
          task.lastFailureReason ?? null
        );
        state = applyRetryToState(state, retryDecision, result.message);

        if (retryDecision.shouldRetry && retryDecision.errorCategory !== 'permanent') {
          state = updateTodoStatus(state, task.id, 'pending');
          // P4: 更新任务级失败状态
          state = updateTodoItem(state, task.id, {
            retryCount: (task.retryCount ?? 0) + 1,
            lastFailureReason: result.message,
            resumeAt: Date.now() + retryDecision.backoffMs,
          });
          state = updateAutoLoopLastResult(
            state,
            task.id,
            'pending',
            `retry scheduled (${retryDecision.backoffMs}ms): ${result.message}`
          );
          writeAuditLog(
            {
              event: 'task_retry_scheduled',
              featureId,
              taskId: task.id,
              detail: {
                message: result.message,
                backoffMs: retryDecision.backoffMs,
                taskRetryCount: (task.retryCount ?? 0) + 1,
              },
            },
            projectRoot
          );
          checkpoint(state, projectRoot, onCheckpoint);
          continue;
        }

        state = updateTodoStatus(state, task.id, 'blocked');
        state = updateAutoLoopLastResult(state, task.id, 'blocked', result.message);
        writeAuditLog(
          {
            event: 'task_blocked',
            featureId,
            taskId: task.id,
            detail: { message: result.message, retryReason: retryDecision.reason },
          },
          projectRoot
        );

        if (cfg.runtime.auto_orchestrate.stop_on_blocked) {
          // NEW-2: cascade blocked 下游后再 halt，状态文件准确反映传播结果
          const { state: cs, cascaded: cc } = cascadeBlocked(state);
          if (cc.length > 0) {
            state = cs;
            writeAuditLog(
              { event: 'blocked_cascade', featureId, detail: { cascaded: cc } },
              projectRoot
            );
          }
          state = haltState(state, 'blocked', task.id);
          checkpoint(state, projectRoot, onCheckpoint);
          return buildResult(state, startIteration, completedTasks);
        }
      }
    }

    // 3) P10: blocked 级联传播 — 在本轮所有 task 处理完后统一级联
    const cascade = cascadeBlocked(state);
    if (cascade.cascaded.length > 0) {
      state = cascade.state;
      writeAuditLog(
        {
          event: 'blocked_cascade',
          featureId,
          detail: { cascaded: cascade.cascaded },
        },
        projectRoot
      );
    }

    // 4) Checkpoint + advance
    state = advanceTodoIteration(state);
    checkpoint(state, projectRoot, onCheckpoint);
    onIteration?.(state.iteration, state);
  }

  return buildResult(state, startIteration, completedTasks);
}

// ─── 内部辅助函数 ───────────────────────────────────────

function haltState(state: TodoRunnerState, code: HaltReasonCode, taskId?: string): TodoRunnerState {
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
  onCheckpoint?: (s: TodoRunnerState) => void
): void {
  saveTodoState(state, projectRoot);
  onCheckpoint?.(state);
}

function resolveTaskOutput(result: TaskResult): string | undefined {
  if (typeof result.outputContent === 'string') {
    return result.outputContent;
  }
  if (!result.outputPath || !exists(result.outputPath)) {
    return undefined;
  }
  try {
    return readFileSync(result.outputPath, 'utf-8');
  } catch {
    return undefined;
  }
}

function runPostWriteGuards(
  task: TodoItem,
  result: TaskResult,
  featureId: string,
  projectRoot: string,
  cachedSlopRules?: ReturnType<typeof loadSlopRules>
): GuardResult {
  const skillMeta: SkillFrontMatter = result.skillPath
    ? parseSkillFrontMatter(result.skillPath)
    : {};

  const requiredMcps = skillMeta.required_mcps ?? [];
  if (requiredMcps.length > 0) {
    const mcpReport = checkRequiredMcps(requiredMcps);
    writeAuditLog(
      {
        event: 'required_mcps_checked',
        featureId,
        taskId: task.id,
        detail: {
          required: requiredMcps,
          missing: mcpReport.missing,
        },
      },
      projectRoot
    );

    if (!mcpReport.passed) {
      return {
        passed: false,
        reason: `missing required_mcps: ${mcpReport.missing.join(', ')}`,
        policy: 'block',
      };
    }
  }

  const output = resolveTaskOutput(result);
  if (output == null) {
    return { passed: true };
  }

  if (result.writePath) {
    const writeMode = resolveWriteMode(skillMeta);
    const writeResult = idempotentWrite(result.writePath, output, writeMode);
    writeAuditLog(
      {
        event: 'idempotent_write',
        featureId,
        taskId: task.id,
        detail: {
          path: writeResult.path,
          mode: writeResult.mode,
          written: writeResult.written,
        },
      },
      projectRoot
    );
  }

  const markers = loadCompletionMarkers(skillMeta, projectRoot);
  const completion = runFullCompletionDetection(output, markers);
  writeAuditLog(
    {
      event: 'completion_checked',
      featureId,
      taskId: task.id,
      detail: {
        passed: completion.passed,
        failureReasons: completion.failureReasons,
      },
    },
    projectRoot
  );
  if (!completion.passed) {
    return {
      passed: false,
      reason: `completion guard failed: ${completion.failureReasons.join('; ') || 'unknown reason'}`,
      policy: 'retry_with_correction',
    };
  }

  const slopReport = runSlopCheck(output, cachedSlopRules ?? loadSlopRules(projectRoot));
  writeAuditLog(
    {
      event: 'slop_checked',
      featureId,
      taskId: task.id,
      detail: {
        passed: slopReport.passed,
        errorCount: slopReport.errorCount,
        warningCount: slopReport.warningCount,
      },
    },
    projectRoot
  );
  if (!slopReport.passed) {
    const firstError = slopReport.hits.find((hit) => hit.severity === 'error');
    return {
      passed: false,
      reason: firstError
        ? `slop error L${firstError.line}: ${firstError.message}`
        : 'slop checker failed',
      policy: 'retry_with_correction',
    };
  }

  return { passed: true };
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
  outcome: 'pending' | 'done' | 'blocked',
  message: string
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
  completedTasks: string[]
): AutoLoopResult {
  return {
    halted: state.halted,
    haltReason: state.haltReason,
    status: classifyAutoLoopStatus(state.haltReason),
    iterations: state.iteration - startIteration,
    completedTasks,
  };
}

function classifyAutoLoopStatus(haltReason: string | undefined): AutoLoopStatus {
  if (haltReason === 'completed') return 'all_done';
  if (haltReason === 'no_state_file') return 'no_state_file';
  if (haltReason?.startsWith('blocked') || haltReason?.startsWith('stuck_')) return 'has_blocked';
  if (haltReason?.startsWith('task_timeout') || haltReason?.startsWith('stalled_timeout'))
    return 'timeout';
  if (haltReason?.startsWith('max_iterations')) return 'max_iterations';
  return 'incomplete';
}
