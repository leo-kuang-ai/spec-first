'use strict';

const brand = require('../../src/cli/brand');
const { runChecks } = require('../../scripts/check-release-continuity.cjs');

describe('OpenCode 发布展示检查', () => {
  afterEach(() => jest.restoreAllMocks());

  test('接受从 registry 动态生成的 OpenCode 品牌展示', () => {
    const result = runChecks();
    expect(result.guards.find(entry => entry.guard_id === 'opencode-release-surface').result).toBe('pass');
  }, 30000);

  test('实际品牌展示缺少 OpenCode 时阻断发布', () => {
    jest.spyOn(brand, 'renderFullArt').mockReturnValue('AI coding harness for Codex');
    const result = runChecks();
    const check = result.guards.find(entry => entry.guard_id === 'opencode-release-surface');
    expect(check.result).toBe('fail');
    expect(check.reason_code).toContain('brand-output:OpenCode');
  }, 30000);
});
