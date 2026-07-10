'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..', '..');
const cliPath = path.join(repoRoot, 'bin', 'spec-first.js');

function tempSandbox(prefix) {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const home = path.join(projectRoot, 'home');
  fs.mkdirSync(home, { recursive: true });
  return { projectRoot, home };
}

function runSpecFirst(args, sandbox) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: sandbox.projectRoot,
    env: { ...process.env, HOME: sandbox.home },
    encoding: 'utf8',
    timeout: 30000,
  });
}

describe('CLI smoke checks', () => {
  test('prints top-level help', () => {
    const sandbox = tempSandbox('spec-first-smoke-help-');
    const result = runSpecFirst(['--help'], sandbox);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('📘 Usage:');
    expect(result.stdout).toContain('spec-first <command> [options]');
  });

  test('previews Qoder init without writing project or user runtime files', () => {
    const sandbox = tempSandbox('spec-first-smoke-qoder-');
    const result = runSpecFirst([
      'init',
      '--qoder',
      '--dry-run',
      '-y',
      '-u',
      'smoke-test',
      '--lang',
      'zh',
    ], sandbox);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('spec-first init (qoder)');
    expect(result.stdout).toContain('不会修改文件');
    expect(fs.existsSync(path.join(sandbox.projectRoot, '.qoder'))).toBe(false);
    expect(fs.existsSync(path.join(sandbox.home, '.spec-first', '.developer'))).toBe(false);
  });
});
