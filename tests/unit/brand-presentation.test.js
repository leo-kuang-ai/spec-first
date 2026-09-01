'use strict';

// 品牌展示契约：首次安装（init/quickstart）与后续更新（update）入口
// 都必须呈现 spec-first logo。形态语义：首次安装 fullArt，刷新 wordmark，
// update fullArt；quickstart 以 wordmark 让位给转发目标 init 的主 logo。

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const FULLART_MARK = '██████';
const WORDMARK_PREFIX = '─ spec-first v';

function makeRepo() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-brand-'));
  const repo = path.join(home, 'repo');
  fs.mkdirSync(repo, { recursive: true });
  jest.doMock('../../src/cli/developer', () => ({
    ...jest.requireActual('../../src/cli/developer'),
    getGlobalDeveloperPath: () => path.join(home, 'none-developer'),
  }));
  return { home, repo };
}

function withCapturedLogs() {
  const lines = [];
  const logSpy = jest.spyOn(console, 'log').mockImplementation((line) => lines.push(String(line)));
  const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  return {
    lines,
    restore: () => {
      logSpy.mockRestore();
      errSpy.mockRestore();
    },
  };
}

describe('brand presentation contract', () => {
  afterEach(() => {
    jest.dontMock('../../src/cli/developer');
    jest.dontMock('../../src/cli/commands/doctor');
    jest.dontMock('../../src/cli/commands/init');
    jest.resetModules();
  });

  test('init -y first install renders the full logo', async () => {
    const { repo } = makeRepo();
    const originalCwd = process.cwd();
    const capture = withCapturedLogs();
    try {
      process.chdir(repo);
      const { runInit } = require('../../src/cli/commands/init');
      const exitCode = await runInit(['--codex', '-y', '-u', 'tester', '--lang', 'zh']);
      expect(exitCode).toBe(0);
      const output = capture.lines.join('\n');
      expect(output).toContain(FULLART_MARK);
      expect(output).toContain('Spec-First v');
    } finally {
      capture.restore();
      process.chdir(originalCwd);
    }
  });

  test('init -y refresh renders the compact wordmark', async () => {
    const { repo } = makeRepo();
    const originalCwd = process.cwd();
    const first = withCapturedLogs();
    let refreshLines = [];
    try {
      process.chdir(repo);
      const { runInit } = require('../../src/cli/commands/init');
      await runInit(['--codex', '-y', '-u', 'tester', '--lang', 'zh']);
      first.restore();
      const second = withCapturedLogs();
      try {
        const exitCode = await runInit(['--codex', '-y', '-u', 'tester', '--lang', 'zh']);
        expect(exitCode).toBe(0);
        refreshLines = second.lines;
      } finally {
        second.restore();
      }
      const output = refreshLines.join('\n');
      expect(output).toContain(WORDMARK_PREFIX);
      expect(output).not.toContain(FULLART_MARK);
    } finally {
      first.restore();
      process.chdir(originalCwd);
    }
  });

  test('quickstart entry shows the wordmark before environment checks', async () => {
    jest.resetModules();
    jest.doMock('../../src/cli/commands/doctor', () => ({
      checkNodeVersion: () => ({ level: 'PASS', name: 'Node.js', message: 'v22' }),
      checkGit: () => ({ level: 'PASS', name: 'Git', message: 'git 2.40' }),
      checkPlatformCli: () => ({ level: 'WARNING', name: 'stub', message: 'not found' }),
    }));
    jest.doMock('../../src/cli/commands/init', () => ({
      runInit: jest.fn().mockResolvedValue(0),
    }));
    const capture = withCapturedLogs();
    try {
      const { runQuickstart } = require('../../src/cli/commands/quickstart');
      await runQuickstart([], {}, { resolveLang: () => 'zh' });
      const output = capture.lines.join('\n');
      expect(output).toContain(WORDMARK_PREFIX);
    } finally {
      capture.restore();
    }
  });

  test('update opens with the full logo and reports the installed version', async () => {
    jest.resetModules();
    const { home } = makeRepo();
    // readInstalledVersion 从注入的 cliPath 推 package 根并读 manifest；
    // fixture 提供真实文件，npm 调用全部被 deps mock 绕开。
    const globalPkgRoot = path.join(home, 'global', 'node_modules', 'spec-first');
    fs.mkdirSync(path.join(globalPkgRoot, 'bin'), { recursive: true });
    fs.writeFileSync(path.join(globalPkgRoot, 'package.json'), '{"version":"9.9.9"}');
    fs.writeFileSync(path.join(globalPkgRoot, 'bin', 'spec-first.js'), '#!/usr/bin/env node\n');
    const capture = withCapturedLogs();
    try {
      const update = require('../../src/cli/commands/update');
      const exitCode = await update.runUpdate([], {
        runInstall: () => ({ status: 0, errorCode: null }),
        runRuntimeRefresh: () => ({ status: 0, errorCode: null }),
        resolveRuntimeRefreshCommand: () => ({ args: ['init', '-y'], cwd: process.cwd(), reason_code: 'test' }),
        resolveInstalledCliPath: () => ({ ok: true, cliPath: path.join(globalPkgRoot, 'bin', 'spec-first.js') }),
        clearVersionReminderCooldown: () => {},
        resolveLang: () => 'zh',
      });
      expect(exitCode).toBe(0);
      const output = capture.lines.join('\n');
      expect(output).toContain(FULLART_MARK);
      expect(output).toContain('已升级到 v9.9.9');
    } finally {
      capture.restore();
    }
  });
});
