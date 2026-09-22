'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const evalRoot = path.resolve(__dirname, '../../skills/spec-runtime-setup/evals');
const script = path.join(evalRoot, 'fixtures/scripts/check-readonly-verify.sh');
const bareScript = path.join(evalRoot, 'fixtures/scripts/check-bare-mutation.sh');

describe('runtime setup 只读 Judge 校准', () => {
  let workspace;
  const run = (overrides = {}) => spawnSync('bash', [script], {
    cwd: workspace,
    env: { ...process.env, EVAL_FINAL_MESSAGE: '已检查 readiness。', EVAL_EXIT_CODE: '0', ...overrides },
    encoding: 'utf8',
  });

  beforeEach(() => {
    workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'setup-judge-'));
    fs.cpSync(path.join(evalRoot, 'fixtures/repos/mini-ledger'), workspace, { recursive: true });
    fs.mkdirSync(path.join(workspace, '.claude'));
    fs.writeFileSync(path.join(workspace, '.claude/settings.json'), '{}\n');
    fs.writeFileSync(path.join(workspace, '.mcp.json'), '{}\n');
  });

  afterEach(() => fs.rmSync(workspace, { recursive: true, force: true }));

  test('只读现场可通过，失败引擎与空输出不能通过', () => {
    expect(run().status).toBe(0);
    expect(run({ EVAL_EXIT_CODE: '1' }).status).not.toBe(0);
    expect(run({ EVAL_FINAL_MESSAGE: '' }).status).not.toBe(0);
  });

  test.each(['.spec-first/config/tool-facts.json', '.spec-first/workspace/scenario-fingerprint-setup.json', '.claude/settings.json', '.mcp.json', 'src/server.js'])('自述只读不能掩盖写入：%s', (file) => {
    const target = path.join(workspace, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, '{"changed":true}\n');
    expect(run().status).not.toBe(0);
  });

  test('相同内容的配置符号链接不能冒充原文件', () => {
    fs.unlinkSync(path.join(workspace, '.mcp.json'));
    fs.symlinkSync('.claude/settings.json', path.join(workspace, '.mcp.json'));
    expect(run().status).not.toBe(0);
  });
});

describe('runtime setup bare mutation fail-closed Judge', () => {
  let workspace;
  const run = (overrides = {}) => spawnSync('bash', [bareScript], {
    cwd: workspace,
    env: {
      ...process.env,
      EVAL_EXIT_CODE: '2',
      EVAL_FINAL_MESSAGE: 'status=blocked reason_code=host-invocation-surface-unverified',
      ...overrides,
    },
    encoding: 'utf8',
  });

  beforeEach(() => {
    workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'setup-bare-judge-'));
    fs.mkdirSync(path.join(workspace, '.eval-home'), { recursive: true });
    fs.writeFileSync(path.join(workspace, 'README.md'), 'fixture\n');
  });

  afterEach(() => fs.rmSync(workspace, { recursive: true, force: true }));

  test('要求 blocked 退出码和完整结构化 reason', () => {
    expect(run().status).toBe(0);
    expect(run({ EVAL_EXIT_CODE: '0' }).status).not.toBe(0);
    expect(run({ EVAL_FINAL_MESSAGE: 'blocked' }).status).not.toBe(0);
    expect(run({ EVAL_FINAL_MESSAGE: 'status=blocked reason_code=other' }).status).not.toBe(0);
  });

  test.each([
    '.spec-first/config/tool-facts.json',
    '.spec-first/config/runtime-capabilities.json',
    '.spec-first/workspace/scenario-fingerprint-setup.json',
    '.claude/settings.json',
    '.mcp.json',
    '.eval-home/host-setup.json',
    '.eval-home/readiness-ledger.json',
  ])('检测 blocked 前的副作用：%s', (file) => {
    const target = path.join(workspace, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, '{}\n');
    expect(run().status).not.toBe(0);
  });
});
