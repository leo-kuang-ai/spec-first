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
    execFileSyncMock.mockImplementation((_cmd: string, args: string[]) => {
      if (args[0] === 'diff') return 'src/core/auth.ts\nCHANGELOG.md\nCLAUDE.md\n';
      return '';
    });
    const message = 'feat: $(touch /tmp/pwned)';

    const code = withCwd(TMP, () => handleCommit(['--message', message]));

    expect(code).toBe(ExitCode.SUCCESS);
    expect(execFileSyncMock).toHaveBeenCalledTimes(2);
    expect(execFileSyncMock).toHaveBeenNthCalledWith(
      1,
      'git',
      ['diff', '--cached', '--name-only', '--diff-filter=ACMRD'],
      expect.objectContaining({
        cwd: TMP,
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: 30_000,
      }),
    );
    expect(execFileSyncMock).toHaveBeenNthCalledWith(
      2,
      'git',
      ['commit', '-m', message],
      expect.objectContaining({
        cwd: TMP,
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: 30_000,
      }),
    );
  });

  it('should return IO_ERROR when git commit fails', () => {
    execFileSyncMock.mockImplementation((_cmd: string, args: string[]) => {
      if (args[0] === 'diff') return 'src/core/auth.ts\nCHANGELOG.md\nCLAUDE.md\n';
      throw new Error('nothing to commit, working tree clean');
    });

    const code = withCwd(TMP, () => handleCommit(['--message', 'test']));

    expect(code).toBe(ExitCode.IO_ERROR);
    expect(execFileSyncMock).toHaveBeenCalledTimes(2);
  });

  it('should return VALIDATION_ERROR when source changes miss CHANGELOG.md', () => {
    execFileSyncMock.mockImplementation((_cmd: string, args: string[]) => {
      if (args[0] === 'diff') return 'src/core/auth.ts\nCLAUDE.md\n';
      return '';
    });

    const code = withCwd(TMP, () => handleCommit(['--message', 'feat: auth']));

    expect(code).toBe(ExitCode.VALIDATION_ERROR);
    expect(execFileSyncMock).toHaveBeenCalledTimes(1);
  });

  it('should return VALIDATION_ERROR when source changes miss CLAUDE.md', () => {
    execFileSyncMock.mockImplementation((_cmd: string, args: string[]) => {
      if (args[0] === 'diff') return 'src/core/auth.ts\nCHANGELOG.md\n';
      return '';
    });

    const code = withCwd(TMP, () => handleCommit(['--message', 'feat: auth']));

    expect(code).toBe(ExitCode.VALIDATION_ERROR);
    expect(execFileSyncMock).toHaveBeenCalledTimes(1);
  });

  it('should allow docs-only commits without governance files', () => {
    execFileSyncMock.mockImplementation((_cmd: string, args: string[]) => {
      if (args[0] === 'diff') return 'docs/guide.md\nREADME.md\n';
      return '';
    });

    const code = withCwd(TMP, () => handleCommit(['--message', 'docs: update guide']));

    expect(code).toBe(ExitCode.SUCCESS);
    expect(execFileSyncMock).toHaveBeenCalledTimes(2);
  });

  it('should include deleted source files in governance check', () => {
    execFileSyncMock.mockImplementation((_cmd: string, args: string[]) => {
      if (args[0] === 'diff') return 'src/core/auth.ts\n';
      return '';
    });

    const code = withCwd(TMP, () => handleCommit(['--message', 'refactor: delete auth']));

    expect(code).toBe(ExitCode.VALIDATION_ERROR);
    expect(execFileSyncMock).toHaveBeenCalledWith(
      'git',
      ['diff', '--cached', '--name-only', '--diff-filter=ACMRD'],
      expect.objectContaining({ cwd: TMP }),
    );
    expect(execFileSyncMock).toHaveBeenCalledTimes(1);
  });
});
