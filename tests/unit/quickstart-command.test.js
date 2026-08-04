'use strict';

const { runQuickstart } = require('../../src/cli/commands/quickstart');

function silenceConsole() {
  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  return () => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  };
}

describe('spec-first quickstart', () => {
  test('rejects unknown options without touching init', async () => {
    const restore = silenceConsole();
    try {
      const exitCode = await runQuickstart(['--bogus']);
      expect(exitCode).toBe(2);
    } finally {
      restore();
    }
  });

  test('prints help and exits 0 without probing anything', async () => {
    const restore = silenceConsole();
    try {
      const exitCode = await runQuickstart(['--help']);
      expect(exitCode).toBe(0);
    } finally {
      restore();
    }
  });

  test('fails fast when Node.js is below the minimum supported version', async () => {
    jest.resetModules();
    jest.doMock('../../src/cli/commands/doctor', () => ({
      checkNodeVersion: () => ({ level: 'ERROR', name: 'Node.js', message: 'v18.0.0', fix: 'Install Node.js 20 or newer.' }),
      checkGit: () => ({ level: 'PASS', name: 'Git', message: 'git version 2.40.0' }),
      checkPlatformCli: () => ({ level: 'WARNING', name: 'stub', message: 'not found on PATH' }),
    }));
    jest.doMock('../../src/cli/commands/init', () => ({
      runInit: jest.fn().mockResolvedValue(0),
    }));

    const { runQuickstart: isolatedRunQuickstart } = require('../../src/cli/commands/quickstart');
    const { runInit } = require('../../src/cli/commands/init');
    const restore = silenceConsole();
    try {
      const exitCode = await isolatedRunQuickstart([]);
      expect(exitCode).toBe(3);
      expect(runInit).not.toHaveBeenCalled();
    } finally {
      restore();
      jest.dontMock('../../src/cli/commands/doctor');
      jest.dontMock('../../src/cli/commands/init');
      jest.resetModules();
    }
  });

  test('auto-selects the single detected host and forwards it to init', async () => {
    jest.resetModules();
    jest.doMock('../../src/cli/commands/doctor', () => ({
      checkNodeVersion: () => ({ level: 'PASS', name: 'Node.js', message: 'v20.10.0' }),
      checkGit: () => ({ level: 'PASS', name: 'Git', message: 'git version 2.40.0' }),
      checkPlatformCli: (platform) => (platform === 'claude'
        ? { level: 'PASS', name: 'Claude Code', message: '1.0.0' }
        : { level: 'WARNING', name: platform, message: 'not found on PATH' }),
    }));
    const runInitMock = jest.fn().mockResolvedValue(0);
    jest.doMock('../../src/cli/commands/init', () => ({
      runInit: runInitMock,
    }));

    const { runQuickstart: isolatedRunQuickstart } = require('../../src/cli/commands/quickstart');
    const restore = silenceConsole();
    try {
      const exitCode = await isolatedRunQuickstart([]);
      expect(exitCode).toBe(0);
      expect(runInitMock).toHaveBeenCalledTimes(1);
      expect(runInitMock).toHaveBeenCalledWith(['--claude'], {});
    } finally {
      restore();
      jest.dontMock('../../src/cli/commands/doctor');
      jest.dontMock('../../src/cli/commands/init');
      jest.resetModules();
    }
  });

  test('adds -y to the forwarded init call when --yes is passed', async () => {
    jest.resetModules();
    jest.doMock('../../src/cli/commands/doctor', () => ({
      checkNodeVersion: () => ({ level: 'PASS', name: 'Node.js', message: 'v20.10.0' }),
      checkGit: () => ({ level: 'PASS', name: 'Git', message: 'git version 2.40.0' }),
      checkPlatformCli: (platform) => (platform === 'codex'
        ? { level: 'PASS', name: 'Codex', message: '1.0.0' }
        : { level: 'WARNING', name: platform, message: 'not found on PATH' }),
    }));
    const runInitMock = jest.fn().mockResolvedValue(0);
    jest.doMock('../../src/cli/commands/init', () => ({
      runInit: runInitMock,
    }));

    const { runQuickstart: isolatedRunQuickstart } = require('../../src/cli/commands/quickstart');
    const restore = silenceConsole();
    try {
      await isolatedRunQuickstart(['--yes']);
      expect(runInitMock).toHaveBeenCalledWith(['--codex', '-y'], {});
    } finally {
      restore();
      jest.dontMock('../../src/cli/commands/doctor');
      jest.dontMock('../../src/cli/commands/init');
      jest.resetModules();
    }
  });

  test('falls back to interactive init when zero hosts are detected', async () => {
    jest.resetModules();
    jest.doMock('../../src/cli/commands/doctor', () => ({
      checkNodeVersion: () => ({ level: 'PASS', name: 'Node.js', message: 'v20.10.0' }),
      checkGit: () => ({ level: 'PASS', name: 'Git', message: 'git version 2.40.0' }),
      checkPlatformCli: (platform) => ({ level: 'WARNING', name: platform, message: 'not found on PATH' }),
    }));
    const runInitMock = jest.fn().mockResolvedValue(0);
    jest.doMock('../../src/cli/commands/init', () => ({
      runInit: runInitMock,
    }));

    const { runQuickstart: isolatedRunQuickstart } = require('../../src/cli/commands/quickstart');
    const restore = silenceConsole();
    try {
      await isolatedRunQuickstart([]);
      expect(runInitMock).toHaveBeenCalledWith([], {});
    } finally {
      restore();
      jest.dontMock('../../src/cli/commands/doctor');
      jest.dontMock('../../src/cli/commands/init');
      jest.resetModules();
    }
  });

  test('falls back to interactive init when multiple hosts are detected', async () => {
    jest.resetModules();
    jest.doMock('../../src/cli/commands/doctor', () => ({
      checkNodeVersion: () => ({ level: 'PASS', name: 'Node.js', message: 'v20.10.0' }),
      checkGit: () => ({ level: 'PASS', name: 'Git', message: 'git version 2.40.0' }),
      checkPlatformCli: (platform) => (['claude', 'codex'].includes(platform)
        ? { level: 'PASS', name: platform, message: '1.0.0' }
        : { level: 'WARNING', name: platform, message: 'not found on PATH' }),
    }));
    const runInitMock = jest.fn().mockResolvedValue(0);
    jest.doMock('../../src/cli/commands/init', () => ({
      runInit: runInitMock,
    }));

    const { runQuickstart: isolatedRunQuickstart } = require('../../src/cli/commands/quickstart');
    const restore = silenceConsole();
    try {
      await isolatedRunQuickstart([]);
      expect(runInitMock).toHaveBeenCalledWith([], {});
    } finally {
      restore();
      jest.dontMock('../../src/cli/commands/doctor');
      jest.dontMock('../../src/cli/commands/init');
      jest.resetModules();
    }
  });
});
