'use strict';

// formatSupportedHostFlags 的单元测试：usage/help 文案的宿主 flag 串必须由
// adapters registry 派生。本文件锁定三件事：受支持宿主集合的稳定性、每个
// style 的精确渲染形状（flag 名与宿主一一对应）、以及未知 style 输入的
// fallback 行为（以当前实现为准：落入 switch default，按 'each' 渲染）。

const { formatSupportedHostFlags } = require('../../src/cli/helpers/supported-host-flags');
const { getSupportedPlatforms } = require('../../src/cli/adapters');

const SUPPORTED_STYLES = ['each', 'pipe', 'paren', 'slash', 'plain', 'slashpipe'];

// 锁定当前宿主集合：新增宿主应通过 adapters registry 声明，并有意更新此断言。
const CURRENT_PLATFORMS = ['claude', 'codex', 'cursor', 'kiro', 'qoder', 'opencode', 'zcode', 'pi'];

// 当前集合下每个 style 的完整用户可见渲染串（usage/help 文案的实际输出面）。
const CURRENT_RENDERINGS = {
  each: '[--claude] [--codex] [--cursor] [--kiro] [--qoder] [--opencode] [--zcode] [--pi]',
  pipe: '[--claude|--codex|--cursor|--kiro|--qoder|--opencode|--zcode|--pi]',
  paren: '(--claude|--codex|--cursor|--kiro|--qoder|--opencode|--zcode|--pi)',
  slash: '`--claude` / `--codex` / `--cursor` / `--kiro` / `--qoder` / `--opencode` / `--zcode` / `--pi`',
  plain: '--claude --codex --cursor --kiro --qoder --opencode --zcode --pi',
  slashpipe: '--claude/--codex/--cursor/--kiro/--qoder/--opencode/--zcode/--pi',
};

describe('formatSupportedHostFlags', () => {
  test('module exports exactly the formatter surface', () => {
    expect(Object.keys(require('../../src/cli/helpers/supported-host-flags'))).toEqual([
      'formatSupportedHostFlags',
    ]);
    expect(typeof formatSupportedHostFlags).toBe('function');
  });

  test('supported platform set stays stable and ordered', () => {
    expect(getSupportedPlatforms()).toEqual(CURRENT_PLATFORMS);
  });

  test('every documented style renders a non-empty string covering every supported host', () => {
    for (const style of SUPPORTED_STYLES) {
      const rendered = formatSupportedHostFlags(style);
      expect(typeof rendered).toBe('string');
      expect(rendered.length).toBeGreaterThan(0);
      for (const platform of CURRENT_PLATFORMS) {
        expect(rendered).toContain(`--${platform}`);
      }
    }
  });

  test.each(SUPPORTED_STYLES)('style %s renders its exact documented shape', (style) => {
    expect(formatSupportedHostFlags(style)).toBe(CURRENT_RENDERINGS[style]);
  });

  test('flag names map one-to-one to hosts in registry order', () => {
    // plain 用空格连接，天然是「flag 列表」的序列化形式，可无损还原映射。
    expect(formatSupportedHostFlags('plain').split(' ')).toEqual(
      getSupportedPlatforms().map((platform) => `--${platform}`)
    );
    // 反向守卫：任何 style 的渲染里都不出现宿主集合之外的 flag。
    const hostFlags = new Set(CURRENT_PLATFORMS.map((platform) => `--${platform}`));
    for (const style of SUPPORTED_STYLES) {
      const tokens = formatSupportedHostFlags(style).match(/--[a-z]+/g) || [];
      for (const token of tokens) {
        expect(hostFlags.has(token)).toBe(true);
      }
    }
  });

  test('omitting the style argument defaults to the each rendering', () => {
    expect(formatSupportedHostFlags()).toBe(CURRENT_RENDERINGS.each);
    expect(formatSupportedHostFlags(undefined)).toBe(CURRENT_RENDERINGS.each);
  });

  test('unknown style values fall back to the each rendering without throwing', () => {
    // 以实现为准：switch 无匹配（含大小写不符、空串、null、非字符串）落入
    // default 分支，静默按 'each' 渲染，不抛错、不返回空串。
    for (const unknown of ['bogus', 'EACH', '', null, 42]) {
      expect(formatSupportedHostFlags(unknown)).toBe(CURRENT_RENDERINGS.each);
    }
  });

  test('rendering derives from the adapters registry at call time', () => {
    // 用 mock registry 证明输出确由 getSupportedPlatforms() 现场派生，而非
    // 模块内缓存的第二份宿主清单（含单宿主时的最小渲染形状）。
    jest.isolateModules(() => {
      jest.doMock('../../src/cli/adapters', () => ({
        getSupportedPlatforms: () => ['alpha', 'beta'],
      }));
      const { formatSupportedHostFlags: render } = require('../../src/cli/helpers/supported-host-flags');
      expect(render('each')).toBe('[--alpha] [--beta]');
      expect(render('pipe')).toBe('[--alpha|--beta]');
      expect(render('plain')).toBe('--alpha --beta');
    });
    jest.isolateModules(() => {
      jest.doMock('../../src/cli/adapters', () => ({
        getSupportedPlatforms: () => ['solo'],
      }));
      const { formatSupportedHostFlags: render } = require('../../src/cli/helpers/supported-host-flags');
      expect(render()).toBe('[--solo]');
      expect(render('slashpipe')).toBe('--solo');
    });
    jest.dontMock('../../src/cli/adapters');
  });
});
