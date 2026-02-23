import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { ExitCode } from '../../src/shared/types.js';

const { execFileSyncMock } = vi.hoisted(() => ({
  execFileSyncMock: vi.fn(),
}));

vi.mock('node:child_process', () => ({
  execFileSync: execFileSyncMock,
}));

import { handleCommit } from '../../src/cli/commands/commit.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-commit');

function withCwd(dir: string, fn: () => number): number {
  const originalCwd = process.cwd;
  process.cwd = () => dir;
  try {
    return fn();
  } finally {
    process.cwd = originalCwd;
  }
}

beforeEach(() => {
  mkdirSync(TMP, { recursive: true });
  execFileSyncMock.mockReset();
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('handleCommit', () => {
  it('should commit using argv to avoid shell interpretation', () => {
    execFileSyncMock.mockReturnValue('');
    const message = 'feat: $(touch /tmp/pwned)';
    const taskId = 'TASK-ABC-1';

    const code = withCwd(TMP, () => handleCommit(['--message', message, '--task', taskId]));

    expect(code).toBe(ExitCode.SUCCESS);
    expect(execFileSyncMock).toHaveBeenCalledTimes(1);
    expect(execFileSyncMock).toHaveBeenCalledWith(
      'git',
      ['commit', '-m', `[${taskId}] ${message}\n\ntraces: ${taskId}`],
      expect.objectContaining({
        cwd: TMP,
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: 30_000,
      }),
    );
  });

  it('should return IO_ERROR when git commit fails', () => {
    execFileSyncMock.mockImplementation(() => {
      throw new Error('nothing to commit, working tree clean');
    });

    const code = withCwd(TMP, () => handleCommit(['--message', 'test', '--task', 'TASK-123']));

    expect(code).toBe(ExitCode.IO_ERROR);
    expect(execFileSyncMock).toHaveBeenCalledTimes(1);
  });
});
