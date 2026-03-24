/**
 * Auto-Loop 主循环单元测试
 * @see TASK-ORCH-003 auto-loop 主循环接入
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  initTodoState,
  saveTodoState,
  loadTodoState,
} from '../../src/core/ai-orchestrator/todo-runner.js';
import type { TodoItem, TodoRunnerState } from '../../src/core/ai-orchestrator/todo-runner.js';
import { runAutoLoop } from '../../src/core/ai-orchestrator/auto-loop.js';
import type { TaskExecutor } from '../../src/core/ai-orchestrator/auto-loop.js';
import { resetConfigCache } from '../../src/shared/config-schema.js';
import { clearAvailableMcps, registerAvailableMcp } from '../../src/core/ai-orchestrator/mcp-checker.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-auto-loop');
const FEAT = 'FSREQ-AUTO-001';

beforeEach(() => {
  resetConfigCache();
  clearAvailableMcps();
  mkdirSync(join(TMP, 'specs', FEAT), { recursive: true });
  mkdirSync(join(TMP, '.spec-first'), { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  clearAvailableMcps();
  resetConfigCache();
});

/** 创建成功执行器 */
const successExecutor: TaskExecutor = async () => ({ success: true, message: 'ok' });

/** 创建失败执行器（permanent 错误，直接 blocked 不走重试） */
const failExecutor: TaskExecutor = async () => ({ success: false, message: 'ENOENT: no such file' });

function makeItems(ids: string[], deps?: Record<string, string[]>): TodoItem[] {
  return ids.map((id) => ({
    id,
    title: `Task ${id}`,
    status: 'pending' as const,
    dependsOn: deps?.[id],
  }));
}

function seedState(items: TodoItem[], maxIterations = 10): void {
  const state = initTodoState(FEAT, TMP, items, maxIterations);
  saveTodoState(state, TMP);
}

const autoArgs = { mode: 'auto' as const, resume: false };

// ─── (a) 连续推进 ≥2 个无依赖 TASK ─────────────────────

describe('auto-loop happy path', () => {
  it('连续推进 2 个无依赖 TASK，iteration 正确递增', async () => {
    seedState(makeItems(['T1', 'T2']));

    const result = await runAutoLoop({
      featureId: FEAT,
      projectRoot: TMP,
      args: autoArgs,
      executor: successExecutor,
    });

    expect(result.completedTasks).toEqual(['T1', 'T2']);
    expect(result.halted).toBe(true);
    expect(result.haltReason).toBe('completed');
    expect(result.status).toBe('all_done');

    const final = loadTodoState(FEAT, TMP)!;
    expect(final.items.every((i) => i.status === 'done')).toBe(true);
    expect(final.iteration).toBeGreaterThanOrEqual(2);
  });

  it('有依赖链的 TASK 按序推进', async () => {
    seedState(makeItems(['T1', 'T2'], { T2: ['T1'] }));

    const order: string[] = [];
    const trackExecutor: TaskExecutor = async (task) => {
      order.push(task.id);
      return { success: true, message: 'ok' };
    };

    await runAutoLoop({
      featureId: FEAT,
      projectRoot: TMP,
      args: autoArgs,
      executor: trackExecutor,
    });

    expect(order).toEqual(['T1', 'T2']);
  });
});

// ─── (b) checkpoint 写入后 loadTodoState 可正确读取 ────

describe('auto-loop checkpoint', () => {
  it('每轮 checkpoint 写入后 loadTodoState 可正确读取', async () => {
    seedState(makeItems(['T1', 'T2']));

    const snapshots: TodoRunnerState[] = [];
    await runAutoLoop({
      featureId: FEAT,
      projectRoot: TMP,
      args: autoArgs,
      executor: successExecutor,
      onCheckpoint: () => {
        const snap = loadTodoState(FEAT, TMP);
        if (snap) snapshots.push(structuredClone(snap));
      },
    });

    // 至少有多次 checkpoint（markStarted + advance 各一次 per task）
    expect(snapshots.length).toBeGreaterThanOrEqual(2);
    // 最终 checkpoint 应全部 done
    const last = snapshots[snapshots.length - 1];
    expect(last.items.every((i) => i.status === 'done')).toBe(true);
  });

  it('checkpoint 文件为合法 JSON', async () => {
    seedState(makeItems(['T1']));

    await runAutoLoop({
      featureId: FEAT,
      projectRoot: TMP,
      args: autoArgs,
      executor: successExecutor,
    });

    const raw = readFileSync(
      join(TMP, 'specs', FEAT, 'todo-state.json'),
      'utf-8',
    );
    expect(() => JSON.parse(raw)).not.toThrow();
  });
});

// ─── (c) resume 从最近 checkpoint 恢复 ─────────────────

describe('auto-loop resume', () => {
  it('从中途状态恢复，只执行剩余 TASK', async () => {
    // 模拟 T1 已完成，T2 pending
    const items = makeItems(['T1', 'T2']);
    items[0].status = 'done';
    const state = initTodoState(FEAT, TMP, items, 10);
    saveTodoState({ ...state, iteration: 1 }, TMP);

    const order: string[] = [];
    const trackExecutor: TaskExecutor = async (task) => {
      order.push(task.id);
      return { success: true, message: 'ok' };
    };

    const result = await runAutoLoop({
      featureId: FEAT,
      projectRoot: TMP,
      args: { mode: 'auto', resume: true },
      executor: trackExecutor,
    });

    expect(order).toEqual(['T2']);
    expect(result.completedTasks).toEqual(['T2']);
    expect(result.halted).toBe(true);
    expect(result.haltReason).toBe('completed');
  });
});

// ─── (d) blocked 与 halt 场景 ──────────────────────────

describe('auto-loop blocked & halt', () => {
  it('executor 失败时 stop_on_blocked 默认触发 halt', async () => {
    seedState(makeItems(['T1', 'T2']));

    const result = await runAutoLoop({
      featureId: FEAT,
      projectRoot: TMP,
      args: autoArgs,
      executor: failExecutor,
    });

    expect(result.halted).toBe(true);
    expect(result.haltReason).toContain('blocked');
    expect(result.status).toBe('has_blocked');
    expect(result.completedTasks).toEqual([]);

    const final = loadTodoState(FEAT, TMP)!;
    expect(final.items[0].status).toBe('blocked');
  });

  it('temporary timeout failure should retry and eventually complete', async () => {
    seedState(makeItems(['T1']));

    let attempts = 0;
    const flakyExecutor: TaskExecutor = async () => {
      attempts += 1;
      if (attempts === 1) {
        return { success: false, message: 'timeout error' };
      }
      return { success: true, message: 'ok after retry' };
    };

    const result = await runAutoLoop({
      featureId: FEAT,
      projectRoot: TMP,
      args: autoArgs,
      executor: flakyExecutor,
    });

    expect(attempts).toBe(2);
    expect(result.halted).toBe(true);
    expect(result.haltReason).toBe('completed');
    expect(result.completedTasks).toEqual(['T1']);

    const final = loadTodoState(FEAT, TMP)!;
    expect(final.items[0].status).toBe('done');
    expect(final.runtime?.autoLoop?.retry.regenerateCount).toBe(1);
    expect(final.runtime?.autoLoop?.retry.lastFailureReason).toBe('timeout error');
  });

  it('maxIterations 耗尽时 halt', async () => {
    // 设置 maxIterations=1，但有 2 个有依赖的 TASK
    seedState(makeItems(['T1', 'T2'], { T2: ['T1'] }), 1);

    const result = await runAutoLoop({
      featureId: FEAT,
      projectRoot: TMP,
      args: autoArgs,
      executor: successExecutor,
    });

    // T1 完成后 advance iteration 达到 maxIterations，循环终止
    expect(result.halted).toBe(true);
    expect(result.completedTasks).toContain('T1');
  });

  it('无状态文件时返回 no_state_file', async () => {
    // 不 seedState，直接调用
    const result = await runAutoLoop({
      featureId: FEAT,
      projectRoot: TMP,
      args: autoArgs,
      executor: successExecutor,
    });

    expect(result.halted).toBe(true);
    expect(result.haltReason).toBe('no_state_file');
    expect(result.iterations).toBe(0);
  });
});

// ─── (e) post-write guards 集成（ORCH-009/010/015/019/020） ───

describe('auto-loop post-write guards', () => {
  it('required_mcps 缺失时应阻断并 halt', async () => {
    seedState(makeItems(['T1']));
    const skillDir = join(TMP, 'skills', '99-guard');
    const skillPath = join(skillDir, 'SKILL.md');
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(skillPath, '---\nrequired_mcps:\n  - missing-mcp\n---\n# Guard Skill\n', 'utf-8');

    const result = await runAutoLoop({
      featureId: FEAT,
      projectRoot: TMP,
      args: autoArgs,
      executor: async () => ({
        success: true,
        message: 'ok',
        skillPath,
      }),
    });

    expect(result.halted).toBe(true);
    expect(result.haltReason).toContain('blocked');
    expect(loadTodoState(FEAT, TMP)!.items[0].status).toBe('blocked');
  });

  it('completion/slop 通过时写入成功并完成 TASK', async () => {
    seedState(makeItems(['T1']));
    registerAvailableMcp('mcp-a');

    const skillDir = join(TMP, 'skills', '99-guard');
    const skillPath = join(skillDir, 'SKILL.md');
    const outputPath = join(TMP, 'specs', FEAT, 'delivery.md');
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(
      skillPath,
      [
        '---',
        'required_mcps:',
        '  - mcp-a',
        'write_mode: overwrite',
        'completion_markers:',
        '  - contains_pattern: "## Summary"',
        '  - min_entities: 1',
        '---',
        '# Guard Skill',
        '',
      ].join('\n'),
      'utf-8',
    );

    const result = await runAutoLoop({
      featureId: FEAT,
      projectRoot: TMP,
      args: autoArgs,
      executor: async () => ({
        success: true,
        message: 'ok',
        skillPath,
        outputContent: '## Summary\n\nDelivery content',
        writePath: outputPath,
      }),
    });

    expect(result.halted).toBe(true);
    expect(result.haltReason).toBe('completed');
    expect(loadTodoState(FEAT, TMP)!.items[0].status).toBe('done');
    expect(readFileSync(outputPath, 'utf-8')).toContain('## Summary');
  });

  it('completion marker 不满足时应阻断', async () => {
    // P7: completion guard 失败走 retry_with_correction，设 max_retry_per_task=0 让重试预算立即耗尽 → 降级 blocked
    mkdirSync(join(TMP, '.spec-first', 'meta'), { recursive: true });
    writeFileSync(
      join(TMP, '.spec-first', 'meta', 'config.yaml'),
      'runtime:\n  auto_orchestrate:\n    max_retry_per_task: 0\n',
      'utf-8',
    );
    resetConfigCache();
    seedState(makeItems(['T1']));

    const skillDir = join(TMP, 'skills', '99-guard');
    const skillPath = join(skillDir, 'SKILL.md');
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(
      skillPath,
      '---\ncompletion_markers:\n  - contains_pattern: "MUST-HIT"\n---\n# Guard Skill\n',
      'utf-8',
    );

    const result = await runAutoLoop({
      featureId: FEAT,
      projectRoot: TMP,
      args: autoArgs,
      executor: async () => ({
        success: true,
        message: 'ok',
        skillPath,
        outputContent: 'no marker here',
      }),
    });

    expect(result.halted).toBe(true);
    expect(result.haltReason).toContain('blocked');
    expect(loadTodoState(FEAT, TMP)!.items[0].status).toBe('blocked');
  });
});


describe('auto-loop state schema guard', () => {
  it('should ignore batch checkpoint file path and keep todo-state separate', async () => {
    seedState(makeItems(['T1']));

    writeFileSync(
      join(TMP, 'specs', FEAT, 'batch-checkpoint.json'),
      JSON.stringify({ featureId: FEAT, currentLayer: 0, completedTasks: [], failedTasks: [], startTime: 'x', lastUpdateTime: 'x', layerResults: [] }, null, 2),
      'utf-8',
    );

    const state = loadTodoState(FEAT, TMP);
    expect(state?.items).toHaveLength(1);
  });

  it('should throw on invalid todo-state schema', () => {
    writeFileSync(
      join(TMP, 'specs', FEAT, 'todo-state.json'),
      JSON.stringify({ featureId: FEAT, currentLayer: 1, completedTasks: [] }, null, 2),
      'utf-8',
    );

    expect(() => loadTodoState(FEAT, TMP, { strict: true })).toThrow(/todo-state schema/i);
  });
});

// ─── P9: 僵尸 in_progress 恢复 ─────────────────────────

describe('auto-loop zombie recovery (P9)', () => {
  it('进程重启后 in_progress 任务应恢复为 pending 并正常执行', async () => {
    // 模拟崩溃残留：T1 为 in_progress（僵尸态），T2 pending
    const items = makeItems(['T1', 'T2']);
    items[0].status = 'in_progress';
    const state = initTodoState(FEAT, TMP, items, 10);
    saveTodoState({
      ...state,
      runtime: {
        autoLoop: {
          currentTaskId: 'T1',
          taskStartedAt: '2026-01-01T00:00:00.000Z',
          heartbeatAt: '2026-01-01T00:00:00.000Z',
          watchdogCheckedAt: null,
          retry: { regenerateCount: 0, autoRetryCount: 0, manualRevisionCount: 0, totalRetryDurationMs: 0, lastFailureReason: null },
          lastResult: null,
        },
      },
    }, TMP);

    const order: string[] = [];
    const trackExecutor: TaskExecutor = async (task) => {
      order.push(task.id);
      return { success: true, message: 'ok' };
    };

    const result = await runAutoLoop({
      featureId: FEAT,
      projectRoot: TMP,
      args: autoArgs,
      executor: trackExecutor,
    });

    // T1 应该从 pending 重新执行，而不是被跳过
    expect(order).toContain('T1');
    expect(order).toContain('T2');
    expect(result.halted).toBe(true);
    expect(result.haltReason).toBe('completed');
    expect(result.completedTasks).toEqual(['T1', 'T2']);
  });
});

// ─── SF-4: unknown 错误路由（P6 端到端集成验证） ────────────

describe('auto-loop unknown error routing (SF-4 / P6)', () => {
  /**
   * TC-1: unknown 错误 → pending（不立即 blocked）
   * 验证 P6 修复：unknown 类型错误应走重试路径，而非 permanent 那样直接 blocked
   */
  it('unknown 错误首次失败应路由为 pending（重试等待），而非 blocked', async () => {
    seedState(makeItems(['T1']));

    let calls = 0;
    const executor: TaskExecutor = async () => {
      calls += 1;
      // "unexpected failure" 不匹配 PERMANENT_ERROR_PATTERNS，分类为 unknown
      if (calls === 1) return { success: false, message: 'unexpected failure from LLM' };
      return { success: true, message: 'ok on retry' };
    };

    const result = await runAutoLoop({
      featureId: FEAT,
      projectRoot: TMP,
      args: autoArgs,
      executor,
    });

    // 执行了 2 次（1次失败 + 1次重试成功）
    expect(calls).toBe(2);
    // 最终应全部完成，不应该 blocked
    expect(result.haltReason).toBe('completed');
    expect(result.completedTasks).toContain('T1');

    const final = loadTodoState(FEAT, TMP)!;
    expect(final.items[0].status).toBe('done');
    // regenerateCount 应记录 1 次重试消耗
    expect(final.runtime?.autoLoop?.retry.regenerateCount).toBe(1);
  });

  /**
   * TC-2: unknown 错误使用 2× 退避倍数（保守策略）
   * 验证 unknown 错误的 backoffMs > temporary 错误在相同 attempt 下的 backoffMs
   * 通过读取 lastResult 侧面验证（不依赖时钟）：
   * 实际验证点是 resumeAt 被设置（大于 0），且任务被设为 pending（退避等待）
   */
  it('unknown 错误应写入 resumeAt（退避等待），体现 2× 保守退避策略', async () => {
    // 设 max_retry_per_task=5 保证有重试预算
    mkdirSync(join(TMP, '.spec-first', 'meta'), { recursive: true });
    writeFileSync(
      join(TMP, '.spec-first', 'meta', 'config.yaml'),
      'runtime:\n  auto_orchestrate:\n    max_retry_per_task: 5\n    retry_backoff_ms: 100\n',
      'utf-8',
    );
    resetConfigCache();
    seedState(makeItems(['T1']));

    const beforeMs = Date.now();
    let firstFailHandled = false;

    const executor: TaskExecutor = async () => {
      if (!firstFailHandled) {
        firstFailHandled = true;
        return { success: false, message: 'something went totally wrong' }; // unknown
      }
      return { success: true, message: 'ok' };
    };

    // 用 onCheckpoint 捕获第一次失败后的状态（task 设为 pending + resumeAt）
    let capturedResumeAt: number | undefined;
    await runAutoLoop({
      featureId: FEAT,
      projectRoot: TMP,
      args: autoArgs,
      executor,
      onCheckpoint: () => {
        if (capturedResumeAt !== undefined) return;
        const snap = loadTodoState(FEAT, TMP);
        const t1 = snap?.items.find((i) => i.id === 'T1');
        if (t1?.resumeAt !== undefined && t1.resumeAt > beforeMs) {
          capturedResumeAt = t1.resumeAt;
        }
      },
    });

    // resumeAt 应被设置为未来时间（退避期）
    // unknown 退避 = base(100ms) * 2^(1-1) * 1(consecutive) * 2(unknown) = 200ms
    expect(capturedResumeAt).toBeDefined();
    expect(capturedResumeAt!).toBeGreaterThan(beforeMs);
  });

  /**
   * TC-3: unknown 错误耗尽 max_retry_per_task 后应最终 blocked
   * 验证 P6 不是"永远重试"——重试预算耗尽后正常 blocked
   */
  it('unknown 错误耗尽重试预算后应降级为 blocked', async () => {
    // max_retry_per_task=1：第一次 unknown 消耗预算，第二次达到上限 → blocked
    mkdirSync(join(TMP, '.spec-first', 'meta'), { recursive: true });
    writeFileSync(
      join(TMP, '.spec-first', 'meta', 'config.yaml'),
      'runtime:\n  auto_orchestrate:\n    max_retry_per_task: 1\n    retry_backoff_ms: 100\n',
      'utf-8',
    );
    resetConfigCache();
    seedState(makeItems(['T1']));

    let attempts = 0;
    const executor: TaskExecutor = async () => {
      attempts += 1;
      return { success: false, message: 'flaky unknown error occurred' }; // unknown，持续失败
    };

    const result = await runAutoLoop({
      featureId: FEAT,
      projectRoot: TMP,
      args: autoArgs,
      executor,
    });

    // 至少尝试过 2 次（1次 + 1次重试，第二次也失败后预算耗尽 → blocked）
    expect(attempts).toBeGreaterThanOrEqual(2);
    expect(result.halted).toBe(true);
    expect(result.haltReason).toContain('blocked');
    expect(result.status).toBe('has_blocked');

    const final = loadTodoState(FEAT, TMP)!;
    expect(final.items[0].status).toBe('blocked');
  });
});

// ─── P10: blocked 级联传播 ──────────────────────────────

describe('auto-loop blocked cascade (P10)', () => {
  it('blocked 任务的下游应被自动级联 blocked', async () => {
    // stop_on_blocked=false 才能看到级联效果
    mkdirSync(join(TMP, '.spec-first', 'meta'), { recursive: true });
    writeFileSync(
      join(TMP, '.spec-first', 'meta', 'config.yaml'),
      'runtime:\n  auto_orchestrate:\n    stop_on_blocked: false\n',
      'utf-8',
    );
    resetConfigCache();

    // T1(无依赖) → T2(依赖T1) → T3(依赖T2)
    seedState(makeItems(['T1', 'T2', 'T3'], { T2: ['T1'], T3: ['T2'] }));

    // T1 执行失败（permanent 错误）→ blocked
    const executor: TaskExecutor = async (task) => {
      if (task.id === 'T1') return { success: false, message: 'ENOENT: file not found' };
      return { success: true, message: 'ok' };
    };

    const result = await runAutoLoop({
      featureId: FEAT,
      projectRoot: TMP,
      args: autoArgs,
      executor,
    });

    const final = loadTodoState(FEAT, TMP)!;
    // T1 直接 blocked
    expect(final.items.find((i) => i.id === 'T1')!.status).toBe('blocked');
    // T2, T3 应被级联 blocked
    expect(final.items.find((i) => i.id === 'T2')!.status).toBe('blocked');
    expect(final.items.find((i) => i.id === 'T3')!.status).toBe('blocked');
  });
});
