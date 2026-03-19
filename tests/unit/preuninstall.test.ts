import { describe, expect, it } from 'vitest';

import { isGlobalInstall } from '../../src/preuninstall.js';

describe('preuninstall', () => {
  it('should not treat local pnpm source install as global', () => {
    expect(
      isGlobalInstall({
        env: {
          PNPM_HOME: '/Users/test/Library/pnpm',
          INIT_CWD: '/work/spec-first',
        },
        argv: ['node', '/work/spec-first/dist/preuninstall.js'],
        execPath: '/Users/test/Library/pnpm/node',
        currentFile: '/work/spec-first/dist/preuninstall.js',
        pathExists: (target) => target === '/work/spec-first/package.json',
      }),
    ).toBe(false);
  });

  it('should treat pnpm remove --global as global (npm_config_global=true)', () => {
    // pnpm remove --global 执行时，pnpm 会设置 npm_config_global=true
    // preuninstall 应触发清理，不得跳过
    expect(
      isGlobalInstall({
        env: {
          PNPM_HOME: '/Users/test/Library/pnpm',
          INIT_CWD: '/work/spec-first',
          npm_config_global: 'true',
        },
        argv: ['node', '/work/spec-first/dist/preuninstall.js'],
        execPath: '/Users/test/Library/pnpm/node',
        currentFile: '/work/spec-first/dist/preuninstall.js',
        pathExists: (target) => target === '/work/spec-first/package.json',
      }),
    ).toBe(true);
  });

  it('should treat npm uninstall -g as global', () => {
    // npm uninstall -g 的标准全局路径场景
    expect(
      isGlobalInstall({
        env: { npm_config_global: 'true' },
        argv: ['node', '/usr/local/lib/node_modules/spec-first/dist/preuninstall.js'],
        currentFile: '/usr/local/lib/node_modules/spec-first/dist/preuninstall.js',
        pathExists: () => false,
      }),
    ).toBe(true);
  });
});
