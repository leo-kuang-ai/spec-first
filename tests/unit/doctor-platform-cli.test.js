'use strict';

const { getAdapter } = require('../../src/cli/adapters');
const {
  buildHostSupportView,
  checkPlatformCli,
} = require('../../src/cli/commands/doctor');

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

  test('probes OpenCode with fixed argv and separates detected version from tested evidence', () => {
    const calls = [];
    const cliCheck = checkPlatformCli('opencode', {
      platform: 'darwin',
      runner(command, args) {
        calls.push({ command, args });
        return { status: 0, stdout: '1.18.7\n' };
      },
    });

    expect(calls).toEqual([{ command: 'opencode', args: ['--version'] }]);
    expect(cliCheck).toMatchObject({
      level: 'PASS',
      name: 'OpenCode',
      detectedVersion: '1.18.7',
    });
    expect(buildHostSupportView(
      getAdapter('opencode'),
      cliCheck,
      [{ reasonCode: 'opencode_generated_runtime_loader_unverified' }],
    )).toEqual({
      support_state: 'preview',
      evidence_claim: 'generated_runtime_preview',
      detected_version: '1.18.7',
      tested_versions: [],
      loader_evidence: false,
      reason_codes: ['opencode_generated_runtime_loader_unverified'],
    });
  });
});
