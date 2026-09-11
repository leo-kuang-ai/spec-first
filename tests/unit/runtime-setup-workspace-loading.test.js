'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const entrypoint = path.resolve(__dirname, '../../skills/spec-runtime-setup/scripts/setup.cjs');

test.each([{ argv: [] }, { argv: ['--check'] }])('普通诊断 $argv 不加载 workspace build/clean/status 实现或创建 state', ({ argv }) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'setup-lazy-workspace-'));
  try {
    const result = JSON.parse(execFileSync(process.execPath, ['-e', `
      const { runSetup } = require(process.argv[1]);
      const result = runSetup({ argv: [...JSON.parse(process.argv[3]), '--folder', process.argv[2]], cwd: process.argv[2], homeDir: process.argv[2], env: {},
        runner: () => ({ exit_code: 0, status: 0, stdout: '', stderr: '' }) });
      process.stdout.write(JSON.stringify({ mode: result.mode, loaded: Object.keys(require.cache).filter((key) => /workspace-graph-(executor|clean|status)\\.cjs$/.test(key)) }));
    `, entrypoint, root, JSON.stringify(argv)], { encoding: 'utf8', timeout: 10000 }));
    expect(['bare', 'check']).toContain(result.mode);
    expect(result.loaded).toEqual([]);
    expect(fs.existsSync(path.join(root, '.spec-first', 'workspace'))).toBe(false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
