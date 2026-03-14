import { beforeEach, describe, expect, it, vi } from 'vitest';
import { join } from 'node:path';
import { mkdirSync, rmSync } from 'node:fs';

const withFileLockMock = vi.fn((_: string, action: () => void) => action());

vi.mock('../../src/shared/file-lock.js', () => ({
  withFileLock: withFileLockMock,
}));

const { initTodoState, saveTodoState } = await import('../../src/core/ai-orchestrator/todo-runner.js');

const TMP = join(process.cwd(), 'tests', 'fixtures', '.tmp-todo-runner-file-lock');
const FEAT = 'FSREQ-20260314-LOCK-001';

beforeEach(() => {
  withFileLockMock.mockClear();
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(join(TMP, 'specs', FEAT), { recursive: true });
  mkdirSync(join(TMP, '.spec-first', 'meta'), { recursive: true });
});

describe('todo runner file lock', () => {
  it('should persist todo-state under file lock', () => {
    const state = initTodoState(FEAT, TMP, [{ id: 'TASK-1', title: 'A', status: 'pending' }], 3);

    saveTodoState(state, TMP);

    expect(withFileLockMock).toHaveBeenCalledTimes(1);
    expect(withFileLockMock.mock.calls[0][0]).toContain('todo-state.json.lock');
  });
});
