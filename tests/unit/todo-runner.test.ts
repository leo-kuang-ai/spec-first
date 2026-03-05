import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  initTodoState,
  loadTodoState,
  saveTodoState,
  pickNextTodo,
  pickReadyTodos,
  updateTodoStatus,
  advanceTodoIteration,
  summarizeTodoState,
} from '../../src/core/ai-orchestrator/todo-runner.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-todo-runner');
const FEAT = 'FSREQ-20260226-AUTH-001';

beforeEach(() => {
  mkdirSync(join(TMP, '.spec-first', 'meta'), { recursive: true });
  mkdirSync(join(TMP, 'specs', FEAT), { recursive: true });
  writeFileSync(join(TMP, '.spec-first', 'meta', 'config.yaml'), 'runtime:\n  max_iterations: 3\n', 'utf-8');
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('todo runner', () => {
  it('should init state from config max_iterations when not specified', () => {
    const state = initTodoState(FEAT, TMP, [
      { id: 'TASK-1', title: 'A', status: 'pending' },
    ]);
    expect(state.maxIterations).toBe(3);
  });

  it('should pick next executable todo by dependency order', () => {
    const state = initTodoState(FEAT, TMP, [
      { id: 'TASK-1', title: 'A', status: 'done' },
      { id: 'TASK-2', title: 'B', status: 'pending', dependsOn: ['TASK-1'] },
      { id: 'TASK-3', title: 'C', status: 'pending', dependsOn: ['TASK-9'] },
    ]);

    const next = pickNextTodo(state);
    expect(next?.id).toBe('TASK-2');
  });

  it('should pick contiguous parallel-ready batch when first ready todo is [P]', () => {
    const state = initTodoState(FEAT, TMP, [
      { id: 'TASK-1', title: 'A', status: 'done' },
      { id: 'TASK-2', title: '[P] B', status: 'pending', dependsOn: ['TASK-1'] },
      { id: 'TASK-3', title: '[P] C', status: 'pending', dependsOn: ['TASK-1'] },
      { id: 'TASK-4', title: 'D', status: 'pending', dependsOn: ['TASK-1'] },
    ]);

    const ready = pickReadyTodos(state, { maxParallel: 4 });
    expect(ready.map((item) => item.id)).toEqual(['TASK-2', 'TASK-3']);
  });

  it('should treat sequential todo as barrier for parallel scheduling', () => {
    const state = initTodoState(FEAT, TMP, [
      { id: 'TASK-1', title: 'A', status: 'done' },
      { id: 'TASK-2', title: 'B', status: 'pending', dependsOn: ['TASK-1'] },
      { id: 'TASK-3', title: '[P] C', status: 'pending', dependsOn: ['TASK-1'] },
    ]);

    const ready = pickReadyTodos(state, { maxParallel: 4 });
    expect(ready.map((item) => item.id)).toEqual(['TASK-2']);
  });

  it('should prioritize resuming in_progress todos before picking new pending tasks', () => {
    const state = initTodoState(FEAT, TMP, [
      { id: 'TASK-1', title: 'A', status: 'in_progress' },
      { id: 'TASK-2', title: '[P] B', status: 'pending' },
      { id: 'TASK-3', title: '[P] C', status: 'pending' },
    ]);

    const ready = pickReadyTodos(state, { maxParallel: 2 });
    expect(ready.map((item) => item.id)).toEqual(['TASK-1']);
  });

  it('should persist and resume todo state', () => {
    const state = initTodoState(FEAT, TMP, [
      { id: 'TASK-1', title: 'A', status: 'pending' },
    ]);

    saveTodoState(state, TMP);
    const resumed = loadTodoState(FEAT, TMP);

    expect(resumed?.featureId).toBe(FEAT);
    expect(resumed?.items).toHaveLength(1);
  });

  it('should halt when max_iterations reached with unfinished tasks', () => {
    let state = initTodoState(FEAT, TMP, [
      { id: 'TASK-1', title: 'A', status: 'pending' },
    ], 2);

    state = advanceTodoIteration(state);
    state = advanceTodoIteration(state);

    expect(state.halted).toBe(true);
    expect(state.haltReason).toContain('max_iterations reached');
  });

  it('should summarize todo state', () => {
    let state = initTodoState(FEAT, TMP, [
      { id: 'TASK-1', title: 'A', status: 'pending' },
      { id: 'TASK-2', title: 'B', status: 'done' },
    ]);

    state = updateTodoStatus(state, 'TASK-1', 'in_progress');
    const summary = summarizeTodoState(state);
    expect(summary).toContain('done=1');
    expect(summary).toContain('pending=1');
  });

  it('should not pick blocked tasks', () => {
    const state = initTodoState(FEAT, TMP, [
      { id: 'TASK-1', title: 'A', status: 'blocked' },
      { id: 'TASK-2', title: 'B', status: 'pending', dependsOn: ['TASK-1'] },
    ]);

    const next = pickNextTodo(state);
    expect(next).toBeUndefined();
  });
});
