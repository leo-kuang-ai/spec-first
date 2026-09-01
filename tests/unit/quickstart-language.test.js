'use strict';

// quickstart 用户旅程文案的双语行为：默认（zh 回退/跟随 profile）与 en 注入。
// 探测行的 name/message 来自 doctor 探测结果（技术事实），不在断言范围。

const { runQuickstart } = require('../../src/cli/commands/quickstart');

function stubEnvironment({ nodeLevel = 'PASS' } = {}) {
  jest.resetModules();
  jest.doMock('../../src/cli/commands/doctor', () => ({
    checkNodeVersion: () => ({ level: nodeLevel, name: 'Node.js', message: 'v22.0.0' }),
    checkGit: () => ({ level: 'PASS', name: 'Git', message: 'git version 2.40.0' }),
    checkPlatformCli: () => ({ level: 'WARNING', name: 'stub', message: 'not found on PATH' }),
  }));
  jest.doMock('../../src/cli/commands/init', () => ({
    runInit: jest.fn().mockResolvedValue(0),
  }));
  return require('../../src/cli/commands/quickstart');
}

describe('quickstart user-facing language', () => {
  afterEach(() => {
    jest.dontMock('../../src/cli/commands/doctor');
    jest.dontMock('../../src/cli/commands/init');
    jest.resetModules();
  });

  test('zh messages follow the profile lang', async () => {
    const { runQuickstart: isolated } = stubEnvironment();
    const logs = [];
    const spy = jest.spyOn(console, 'log').mockImplementation((m = '') => logs.push(String(m)));
    try {
      await isolated([], {}, { resolveLang: () => 'zh' });
    } finally {
      spy.mockRestore();
    }
    const output = logs.join('\n');
    expect(output).toContain('正在检查环境');
    expect(output).toContain('回退到交互式');
    expect(output).not.toContain('Checking your environment');
  });

  test('en messages when the profile lang is en', async () => {
    const { runQuickstart: isolated } = stubEnvironment();
    const logs = [];
    const spy = jest.spyOn(console, 'log').mockImplementation((m = '') => logs.push(String(m)));
    try {
      await isolated([], {}, { resolveLang: () => 'en' });
    } finally {
      spy.mockRestore();
    }
    const output = logs.join('\n');
    expect(output).toContain('Checking your environment');
    expect(output).toContain('Falling back to interactive');
    expect(output).not.toContain('正在检查环境');
  });

  test('error-path guidance is bilingual too', async () => {
    const { runQuickstart: isolated } = stubEnvironment({ nodeLevel: 'ERROR' });
    const logs = [];
    const spy = jest.spyOn(console, 'log').mockImplementation((m = '') => logs.push(String(m)));
    try {
      const exitCode = await isolated([], {}, { resolveLang: () => 'zh' });
      expect(exitCode).toBe(3);
    } finally {
      spy.mockRestore();
    }
    expect(logs.join('\n')).toContain('请先修复上述问题');
  });
});
