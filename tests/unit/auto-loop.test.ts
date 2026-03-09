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

/** 创建失败执行器 */
const failExecutor: TaskExecutor = async () => ({ success: false, message: 'fail' });

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
    const skillDir = join(TMP, 'skills', 'spec-first', '99-guard');
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

    const skillDir = join(TMP, 'skills', 'spec-first', '99-guard');
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
    seedState(makeItems(['T1']));

    const skillDir = join(TMP, 'skills', 'spec-first', '99-guard');
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
