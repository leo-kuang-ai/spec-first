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
    env: {
      ...process.env,
      HOME: sandbox.home,
      USERPROFILE: sandbox.home,
      HOMEDRIVE: path.parse(sandbox.home).root,
      HOMEPATH: sandbox.home.slice(path.parse(sandbox.home).root.length),
    },
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
    expect(result.stdout).toContain('AGENTS.md');
    expect(result.stdout).toContain('.gitignore');
    expect(result.stdout).toContain('CHANGELOG.md');
    expect(result.stdout).toContain('.qoder/spec-first/state.json');
    expect(result.stdout).toContain(path.join(sandbox.home, '.spec-first', '.developer'));
    expect(fs.existsSync(path.join(sandbox.projectRoot, '.qoder'))).toBe(false);
    expect(fs.existsSync(path.join(sandbox.projectRoot, 'AGENTS.md'))).toBe(false);
    expect(fs.existsSync(path.join(sandbox.projectRoot, '.gitignore'))).toBe(false);
    expect(fs.existsSync(path.join(sandbox.projectRoot, 'CHANGELOG.md'))).toBe(false);
    expect(fs.existsSync(path.join(sandbox.projectRoot, '.agents'))).toBe(false);
    expect(fs.existsSync(path.join(sandbox.projectRoot, '.spec-first', 'workspace'))).toBe(false);
    expect(fs.existsSync(path.join(sandbox.home, '.spec-first', '.developer'))).toBe(false);
  });

  test('writes and reports one global profile for a multi-host apply', () => {
    const sandbox = tempSandbox('spec-first-smoke-multi-host-');
    const result = runSpecFirst([
      'init',
      '--claude',
      '--codex',
      '-y',
      '-u',
      'smoke-test',
      '--lang',
      'en',
    ], sandbox);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout.match(/Wrote global developer profile:/g) || []).toHaveLength(1);
    expect(fs.readFileSync(path.join(sandbox.home, '.spec-first', '.developer'), 'utf8'))
      .toContain('hosts=claude,codex\n');
    expect(fs.existsSync(path.join(sandbox.projectRoot, '.claude'))).toBe(true);
    expect(fs.existsSync(path.join(sandbox.projectRoot, '.codex'))).toBe(true);
  });

  test('global profile failure stops before project bootstrap and preserves raw evidence', () => {
    const sandbox = tempSandbox('spec-first-smoke-blocked-home-');
    const blockedHome = path.join(sandbox.projectRoot, 'blocked-home');
    fs.rmSync(sandbox.home, { recursive: true, force: true });
    fs.writeFileSync(blockedHome, 'not a directory\n', 'utf8');
    sandbox.home = blockedHome;
    const resolvedGlobalPath = path.join(blockedHome, '.spec-first', '.developer');

    const result = runSpecFirst([
      'init',
      '--codex',
      '-y',
      '-u',
      'smoke-test',
      '--lang',
      'en',
    ], sandbox);

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/ENOTDIR|EACCES|EPERM/);
    expect(result.stderr).toContain(resolvedGlobalPath);
    expect(fs.existsSync(path.join(sandbox.projectRoot, '.codex'))).toBe(false);
    expect(fs.existsSync(path.join(sandbox.projectRoot, '.agents'))).toBe(false);
    expect(fs.existsSync(path.join(sandbox.projectRoot, 'AGENTS.md'))).toBe(false);
    expect(fs.existsSync(path.join(sandbox.projectRoot, '.gitignore'))).toBe(false);
    expect(fs.existsSync(path.join(sandbox.projectRoot, 'CHANGELOG.md'))).toBe(false);
  });
});
