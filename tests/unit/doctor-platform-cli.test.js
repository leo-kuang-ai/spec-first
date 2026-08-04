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

  test('reports Cursor as generated-runtime preview in host support metadata', () => {
    const cliCheck = {
      level: 'WARNING',
      name: 'Cursor CLI',
      message: 'not found on PATH',
      reasonCode: 'cursor_cli_not_found',
    };

    expect(buildHostSupportView(
      getAdapter('cursor'),
      cliCheck,
      [{ reasonCode: 'cursor_generated_runtime_loader_unverified' }],
    )).toEqual({
      support_state: 'preview',
      evidence_claim: 'generated_runtime_preview',
      detected_version: null,
      tested_versions: [],
      loader_evidence: false,
      reason_codes: [
        'cursor_cli_not_found',
        'cursor_generated_runtime_loader_unverified',
      ],
    });
  });

  test('makes a missing CLI action-required for an explicitly selected host', () => {
    const error = new Error('spawn agent ENOENT');
    error.code = 'ENOENT';

    expect(checkPlatformCli('cursor', {
      platform: 'darwin',
      selectionMode: 'explicit',
      runner() {
        return { status: null, stdout: '', stderr: '', error };
      },
    })).toMatchObject({
      level: 'WARNING',
      reasonCode: 'cursor_cli_not_found',
      disposition: 'action_required',
    });
  });

  test('keeps environment-scoped CLI failures machine-readable in host support', () => {
    const error = new Error('spawn kiro ENOENT');
    error.code = 'ENOENT';
    const cliCheck = checkPlatformCli('kiro', {
      platform: 'darwin',
      runner() {
        return { status: null, stdout: '', stderr: '', error };
      },
    });

    expect(cliCheck).toMatchObject({
      level: 'WARNING',
      name: 'Kiro',
      reasonCode: 'kiro_cli_not_found',
    });
    expect(buildHostSupportView(getAdapter('kiro'), cliCheck, [])).toMatchObject({
      detected_version: null,
      loader_evidence: false,
      reason_codes: ['kiro_cli_not_found'],
    });
  });

  test.each([
    [
      'timeout',
      { status: null, stdout: '', stderr: '', error: Object.assign(new Error('timed out'), { code: 'ETIMEDOUT' }), timedOut: true },
      'kiro_cli_version_check_timeout',
    ],
    [
      'nonzero exit',
      { status: 1, stdout: '', stderr: 'version unavailable' },
      'kiro_cli_version_check_failed',
    ],
  ])('classifies Kiro %s without turning it into loader evidence', (_label, runnerResult, reasonCode) => {
    const cliCheck = checkPlatformCli('kiro', {
      platform: 'darwin',
      runner() {
        return runnerResult;
      },
    });

    expect(cliCheck).toMatchObject({
      level: 'WARNING',
      reasonCode,
    });
    expect(buildHostSupportView(getAdapter('kiro'), cliCheck, [])).toMatchObject({
      detected_version: null,
      loader_evidence: false,
      reason_codes: [reasonCode],
    });
  });
});
