'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const cli = path.resolve(__dirname, '../../bin/spec-first.js');

function snapshot(root) {
  const entries = {};
  function visit(directory) {
    for (const name of fs.readdirSync(directory).sort()) {
      const file = path.join(directory, name);
      const stat = fs.lstatSync(file);
      const key = path.relative(root, file);
      if (stat.isSymbolicLink()) entries[key] = `link:${fs.readlinkSync(file)}`;
      else if (stat.isDirectory()) {
        entries[key] = 'directory';
        visit(file);
      } else entries[key] = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    }
  }
  visit(root);
  return entries;
}

describe('doctor continuation in a new process', () => {
  let root;
  let target;
  let env;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'doctor-continuation-'));
    target = path.join(root, 'target with spaces');
    const home = path.join(root, 'home');
    const fakeBin = path.join(root, 'probe-bin');
    fs.mkdirSync(target);
    fs.mkdirSync(home);
    fs.mkdirSync(fakeBin);
    // 仅隔离 CLI 版本探测；这些 fixture 不构成真实宿主运行证据。
    for (const host of ['codex', 'claude']) {
      const windows = process.platform === 'win32';
      fs.writeFileSync(path.join(fakeBin, windows ? `${host}.cmd` : host),
        windows ? '@echo off\r\necho fixture-version\r\n' : '#!/bin/sh\necho fixture-version\n', { mode: 0o755 });
    }
    env = { ...process.env, HOME: home, USERPROFILE: home, CODEX_HOME: path.join(home, '.codex'),
      XDG_CONFIG_HOME: path.join(home, '.config'), PATH: `${fakeBin}${path.delimiter}${process.env.PATH}`, NO_COLOR: '1' };
    const homeProbe = spawnSync(process.execPath, ['-p', 'require("node:os").homedir()'], { env, encoding: 'utf8' });
    expect(homeProbe.status).toBe(0);
    expect(fs.realpathSync(homeProbe.stdout.trim())).toBe(fs.realpathSync(home));
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  function run(cwd, args) {
    return spawnSync(process.execPath, [cli, ...args], { cwd, env, encoding: 'utf8', timeout: 60000 });
  }
  function init(cwd, flags = []) {
    const result = run(cwd, ['init', '--codex', '-y', '-u', 'Continuation Test', '--lang', 'zh', ...flags]);
    expect(result.status).toBe(0);
  }
  function check(cwd, flags = []) {
    const before = snapshot(root);
    const result = run(cwd, ['doctor', '--codex', ...flags]);
    expect(result.error).toBeUndefined();
    // Windows 的 runner TEMP 可能给子进程返回 8.3 短路径，而 realpathSync
    // 归一为长路径；恢复目录行接受原值、realpath 与 native realpath 三个
    // 等价形式，避免断言绑定单一规范化路径。
    const printedRecoveryDir = (result.stdout.match(/恢复目录：(.+)/) || [])[1];
    expect([cwd, fs.realpathSync(cwd), fs.realpathSync.native(cwd)])
      .toContain(printedRecoveryDir && printedRecoveryDir.trim());
    expect(result.stdout).toContain('证据上限：');
    expect(result.stdout.match(/CODEX 主行动：/g)).toHaveLength(1);
    expect(snapshot(root)).toEqual(before);
    return result.stdout;
  }

  test('ordinary target resumes without init, setup or evidence writes', () => {
    init(target);
    expect(check(target)).toContain('描述真实任务');
    expect(check(target, ['--verbose'])).toContain('项目级聚合证据：');
    const before = snapshot(root);
    const result = run(target, ['doctor', '--codex', '--json']);
    expect(result.error).toBeUndefined();
    const report = JSON.parse(result.stdout);
    expect(report.platforms).toEqual(['codex']);
    expect(report.platform_checks.codex).toEqual(expect.arrayContaining([
      expect.objectContaining({ level: 'PASS', message: 'fixture-version' })
    ]));
    expect(snapshot(root)).toEqual(before);
  }, 60000);

  test('parent workspace and initialized child preserve their own targets', () => {
    const child = path.join(target, 'child');
    for (const repo of [child, path.join(target, 'pending')]) {
      fs.mkdirSync(repo);
      expect(spawnSync('git', ['init', '-q', repo], { env }).status).toBe(0);
    }
    fs.mkdirSync(path.join(target, '.spec-first'));
    fs.writeFileSync(path.join(target, '.spec-first/workspace.yaml'),
      'schema_version: workspace-manifest.v1\nrepos:\n  - path: child\n  - path: pending\n');
    init(target, ['--claude']);
    const parent = check(target, ['--claude']);
    expect(parent).toContain('[通用环境] workspace projection');
    expect(parent).toContain('CODEX 主行动：在此目录');
    expect(parent).toContain('CLAUDE 主行动：在此目录');
    init(target, ['--claude', '--repo', 'child']);
    fs.rmSync(path.join(child, '.claude/skills'), { recursive: true, force: true });
    const partial = check(child, ['--claude']);
    expect(partial).toContain('CODEX 主行动：在此目录');
    expect(partial).toContain('CLAUDE 主行动：先处理');
    const resumedParent = check(target, ['--claude']);
    expect(resumedParent).toContain('CODEX 主行动：在此目录');
    expect(resumedParent).toContain('CLAUDE 主行动：在此目录');
  }, 60000);

  test('partial multi-host projection keeps healthy host continuation and local repair', () => {
    init(target, ['--claude']);
    fs.rmSync(path.join(target, '.claude/skills'), { recursive: true, force: true });
    const output = check(target, ['--claude']);
    expect(output).toContain('CODEX 主行动：在此目录');
    expect(output).toContain('CLAUDE 主行动：先处理');
    expect(output).toContain('spec-first doctor --claude');
    expect(output).not.toContain('--all-repos');
  }, 60000);
});
