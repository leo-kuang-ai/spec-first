'use strict';

const { checkPlatformCli } = require('../../src/cli/commands/doctor');

describe('doctor host CLI version probes', () => {
  test('uses cmd.exe only for Windows fixed-command version probes', () => {
    const calls = [];
    const result = checkPlatformCli('codex', {
      platform: 'win32',
      comSpec: 'C:\\Windows\\System32\\cmd.exe',
      runner(command, args) {
        calls.push({ command, args });
        return { status: 0, stdout: 'codex 1.0\n' };
      },
    });
    expect(result.level).toBe('PASS');
    expect(calls).toEqual([{
      command: 'C:\\Windows\\System32\\cmd.exe',
      args: ['/d', '/s', '/c', 'codex --version'],
    }]);
  });

  test('keeps direct shell-free invocation on non-Windows platforms', () => {
    const calls = [];
    checkPlatformCli('claude', {
      platform: 'darwin',
      runner(command, args) {
        calls.push({ command, args });
        return { status: 0, stdout: 'claude 1.0\n' };
      },
    });
    expect(calls).toEqual([{ command: 'claude', args: ['--version'] }]);
  });
});
