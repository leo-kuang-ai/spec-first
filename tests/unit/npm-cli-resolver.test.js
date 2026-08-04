'use strict';

const {
  getEnvValue,
  resolveNpmCliPath,
  runNpm,
} = require('../../scripts/lib/npm-cli.cjs');
const {
  buildCmdCommandLine,
  parsePackResult,
} = require('../../scripts/npm-install-matrix-smoke.cjs');

describe('shared npm CLI resolver', () => {
  test('reads Windows environment keys case-insensitively', () => {
    expect(getEnvValue({ NPM_EXECPATH: 'C:\\npm\\npm-cli.js' }, 'npm_execpath')).toBe('C:\\npm\\npm-cli.js');
  });

  test('resolves npm JavaScript entrypoints on POSIX and Windows without npm.cmd', () => {
    const existing = new Set([
      '/opt/node/lib/node_modules/npm/bin/npm-cli.js',
      'C:\\hostedtoolcache\\node\\20\\x64\\node_modules\\npm\\bin\\npm-cli.js',
    ]);
    const existsSync = (candidate) => existing.has(candidate);

    expect(resolveNpmCliPath({
      env: {}, execPath: '/opt/node/bin/node', existsSync,
    })).toBe('/opt/node/lib/node_modules/npm/bin/npm-cli.js');
    expect(resolveNpmCliPath({
      env: {}, execPath: 'C:\\hostedtoolcache\\node\\20\\x64\\node.exe', existsSync,
    })).toBe('C:\\hostedtoolcache\\node\\20\\x64\\node_modules\\npm\\bin\\npm-cli.js');
  });

  test('ignores pnpm npm_execpath and invokes npm CLI through process.execPath', () => {
    const npmCli = '/opt/node/lib/node_modules/npm/bin/npm-cli.js';
    const calls = [];
    const result = runNpm(['pack', '--dry-run'], {
      env: { npm_execpath: '/opt/pnpm/pnpm.cjs' },
      execPath: '/opt/node/bin/node',
      existsSync: (candidate) => candidate === npmCli,
      spawnSync(command, args, options) {
        calls.push({ command, args, options });
        return { status: 0, stdout: '', stderr: '' };
      },
    });

    expect(result.status).toBe(0);
    expect(calls).toEqual([expect.objectContaining({
      command: '/opt/node/bin/node',
      args: [npmCli, 'pack', '--dry-run'],
    })]);
  });

  test('builds the Windows cmd shim invocation and validates npm pack JSON', () => {
    expect(buildCmdCommandLine('C:\\prefix with spaces\\spec-first.cmd', ['--help'])).toBe(
      'call "C:\\prefix with spaces\\spec-first.cmd" "--help"',
    );
    expect(parsePackResult('[{"name":"spec-first","version":"1.0.0","filename":"spec-first-1.0.0.tgz"}]')).toMatchObject({
      name: 'spec-first',
      filename: 'spec-first-1.0.0.tgz',
    });
    expect(() => parsePackResult('{}')).toThrow('npm pack --json 返回了无效结果');
  });
});
