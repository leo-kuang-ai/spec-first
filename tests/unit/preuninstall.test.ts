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
});
