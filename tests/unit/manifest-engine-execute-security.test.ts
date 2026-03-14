import { beforeEach, describe, expect, it, vi } from 'vitest';
import { join } from 'node:path';
import { mkdirSync, rmSync } from 'node:fs';

const execFileSyncMock = vi.fn();
const execSyncMock = vi.fn();

vi.mock('node:child_process', () => ({
  execFileSync: execFileSyncMock,
  execSync: execSyncMock,
}));

const { executeStep } = await import('../../src/core/migrations/manifest-engine.js');

const TMP = join(process.cwd(), 'tests', 'fixtures', '.tmp-manifest-engine-execute-security');

beforeEach(() => {
  execFileSyncMock.mockReset();
  execSyncMock.mockReset();
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });
});

describe('manifest-engine execute security', () => {
  it('should execute command with execFileSync and argument array', () => {
    execFileSyncMock.mockReturnValue('');

    const result = executeStep(
      {
        type: 'execute',
        command: 'echo',
        args: ['hello', '&&', 'rm', '-rf', '/'],
      },
      TMP
    );

    expect(result.success).toBe(true);
    expect(execSyncMock).not.toHaveBeenCalled();
    expect(execFileSyncMock).toHaveBeenCalledWith('echo', ['hello', '&&', 'rm', '-rf', '/'], {
      cwd: TMP,
      stdio: 'ignore',
    });
  });
});
