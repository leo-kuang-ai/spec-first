'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const fixture = path.resolve(__dirname, '../../skills/spec-debug/evals/fixtures/repos/mini-ledger');
const scripts = path.resolve(__dirname, '../../skills/spec-debug/evals/fixtures/scripts');
const original = fs.readFileSync(path.join(fixture, 'src/server.js'), 'utf8');
const repaired = original.replace(
  "const { amount, note } = JSON.parse(body || '{}');",
  "let data;\n      try { data = JSON.parse(body || '{}'); } catch { res.statusCode = 400; res.end('invalid JSON'); return; }\n      const { amount, note } = data;",
);

describe('spec-debug Judge 正反校准', () => {
  let workspace;
  const git = (...args) => execFileSync('git', args, { cwd: workspace, stdio: 'pipe' });
  const run = (name, overrides = {}) => spawnSync('bash', [path.resolve(scripts, name)], {
    cwd: workspace,
    env: { ...process.env, EVAL_FINAL_MESSAGE: 'JSON.parse causes the crash.', EVAL_EXIT_CODE: '0', ...overrides },
    encoding: 'utf8',
    timeout: 15000,
  });
  const writeServer = (source) => fs.writeFileSync(path.join(workspace, 'src/server.js'), source);

  beforeEach(() => {
    workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'debug-judge-'));
    fs.cpSync(fixture, workspace, { recursive: true });
    git('init', '-q');
    git('add', '.');
    git('-c', 'user.name=Judge Calibration', '-c', 'user.email=judge@example.invalid', 'commit', '-qm', 'fixture baseline');
  });
  afterEach(() => fs.rmSync(workspace, { recursive: true, force: true }));

  test('原始诊断现场通过，非零引擎退出不能通过', () => {
    expect(run('check-diagnosis-no-fix.sh').status).toBe(0);
    expect(run('check-diagnosis-no-fix.sh', { EVAL_EXIT_CODE: '1' }).status).toBe(1);
  });

  test.each(['delete', 'no-try-edit', 'staged-edit', 'extra-source', 'package', 'readme'])('诊断拒绝源码变化：%s', (kind) => {
    if (kind === 'delete') fs.unlinkSync(path.join(workspace, 'src/server.js'));
    if (kind === 'no-try-edit' || kind === 'staged-edit') writeServer(original.replace('3000', '3001'));
    if (kind === 'staged-edit') git('add', 'src/server.js');
    if (kind === 'extra-source') fs.writeFileSync(path.join(workspace, 'src/extra.js'), 'module.exports = 1;');
    if (kind === 'package') fs.appendFileSync(path.join(workspace, 'package.json'), '\n');
    if (kind === 'readme') fs.appendFileSync(path.join(workspace, 'README.md'), '\n');
    expect(run('check-diagnosis-no-fix.sh').status).toBe(1);
  });

  test('try 注释不能伪装修复', () => {
    writeServer(original + '\n// try to fix later\n');
    expect(run('check-fixed-no-commit.sh').status).toBe(1);
  });

  test('诊断不能留下 index 修改，即使工作文件恢复原字节', () => {
    writeServer(original.replace('3000', '3001'));
    git('add', 'src/server.js');
    writeServer(original);
    expect(run('check-diagnosis-no-fix.sh').status).toBe(1);
  });

  test('真实 HTTP 修复通过，但合法记账回归不能通过', () => {
    writeServer(repaired);
    const result = run('check-fixed-no-commit.sh');
    expect({ status: result.status, error: result.error?.message, output: result.stdout + result.stderr }).toEqual({
      status: 0, error: undefined, output: expect.any(String),
    });
    writeServer(repaired.replace('entries.push(', 'void('));
    expect(run('check-fixed-no-commit.sh').status).toBe(1);
  });

  test('修复后引擎失败或产生新 commit 均不能通过', () => {
    writeServer(repaired);
    expect(run('check-fixed-no-commit.sh', { EVAL_EXIT_CODE: '1' }).status).toBe(1);
    git('add', '.');
    git('-c', 'user.name=Judge Calibration', '-c', 'user.email=judge@example.invalid', 'commit', '-qm', 'unauthorized repair');
    expect(run('check-fixed-no-commit.sh').status).toBe(1);
  });

  test('Judge 脚本独立搬运后仍可执行，不依赖同目录 helper', () => {
    const standalone = path.join(workspace, 'judge-copy.sh');
    fs.copyFileSync(path.join(scripts, 'check-fixed-no-commit.sh'), standalone);
    writeServer(repaired);
    expect(run(standalone).status).toBe(0);
  });
});
