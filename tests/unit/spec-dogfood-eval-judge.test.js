'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const fixtures = path.resolve(__dirname, '../../skills/spec-dogfood/evals/fixtures');
const owner = { reason: 'owner_unavailable', browser_scenarios_exercised: 0, next_action: 'spec-runtime-setup' };
const trunk = { reason: 'trunk_target', browser_scenarios_exercised: 0, next_action: 'provide_branch' };
const call = (name, args) => ({ role: 'tool_call', tool_call: { name, arguments: args } });
const inspection = [call('Bash', { command: 'git branch --show-current' }), call('exec_command', { cmd: 'git diff main...HEAD -- src/server.js' })];
let root, cwd, env;
const git = (...args) => execFileSync('git', args, { cwd, env, encoding: 'utf8' });

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'dogfood-eval-'));
  cwd = path.join(root, 'checkout');
  env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_') && !key.startsWith('EVAL_')));
  Object.assign(env, { HOME: root, GIT_CONFIG_GLOBAL: os.devNull, GIT_CONFIG_NOSYSTEM: '1', XDG_CONFIG_HOME: root });
  fs.cpSync(path.join(fixtures, 'repos/mini-ledger'), cwd, { recursive: true });
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

function setup(expected, prepare = true) {
  git('init', '-q', '-b', expected === trunk ? 'main' : 'feature/entries-response');
  if (prepare && expected === owner) execFileSync('bash', ['prepare-dogfood-fixture.sh'], { cwd, env });
}

function judge(expected, answer, trace) {
  const vars = { ...env, EVAL_FINAL_MESSAGE: typeof answer === 'string' ? answer : JSON.stringify(answer) };
  if (trace !== undefined) {
    vars.EVAL_TRANSCRIPT_PATH = path.join(root, 'trace.json');
    fs.writeFileSync(vars.EVAL_TRANSCRIPT_PATH, typeof trace === 'string' ? trace : JSON.stringify(trace));
  }
  const script = expected === trunk ? 'check-trunk-reject.sh' : 'check-owner-unavailable-stop.sh';
  const result = spawnSync('bash', [path.join(fixtures, 'scripts', script)], { cwd, env: vars, encoding: 'utf8' });
  if (result.error) throw result.error;
  return result.status;
}

describe.each([[trunk, owner], [owner, trunk]])('$reason stop', (expected, other) => {
  beforeEach(() => setup(expected));

  test('接受已检查分支和差异、未执行浏览器的正确决定', () => {
    expect(judge(expected, expected, inspection)).toBe(0);
    expect(judge(expected, expected, [call('git_status', {}), call('git_diff', {})])).toBe(0);
  });
  test('拒绝交换原因或动作、反向声明、非零或字符串计数', () => {
    for (const answer of [other, { ...expected, next_action: other.next_action }, 'I continued to run the browser.', '', { ...expected, browser_scenarios_exercised: 1 }, { ...expected, browser_scenarios_exercised: '0' }]) {
      expect(judge(expected, answer, inspection)).toBe(1);
    }
  });
  test('拒绝缺失、无效、空、无具名调用或与检查无关的轨迹', () => {
    for (const trace of [undefined, '[', {}, [], [{ role: 'assistant' }], [call('', {})], [call('Read', { path: 'README.md' })]]) {
      expect(judge(expected, expected, trace)).toBe(1);
    }
  });
  test('按工具名和命令参数拦截已知浏览器与服务调用', () => {
    for (const forbidden of [call('mcp__playwright__browser_navigate', {}), call('Bash', { command: 'npm run dev' }), call('exec_command', { cmd: 'node src/server.js' }), call('shell', { argv: ['agent-browser', 'open', 'http://localhost:3000'] }), call('Bash', JSON.stringify({ command: 'npm start' }))]) {
      expect(judge(expected, expected, [...inspection, forbidden])).toBe(1);
    }
  });
  test('不为另一分支签发原停止原因', () => {
    git('symbolic-ref', 'HEAD', 'refs/heads/other');
    expect(judge(expected, expected, inspection)).toBe(1);
  });
});

test('功能分支必须有准确的已提交差异且有查看改动的调用', () => {
  setup(owner, false);
  expect(judge(owner, owner, inspection)).toBe(1);
  execFileSync('bash', ['prepare-dogfood-fixture.sh'], { cwd, env });
  expect(git('diff', '--name-only', 'main...HEAD').trim()).toBe('src/server.js');
  expect(judge(owner, owner, inspection.slice(0, 1))).toBe(1);
  fs.appendFileSync(path.join(cwd, 'src/server.js'), '\nvoid 0;\n');
  git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qam', 'additional change');
  expect(judge(owner, owner, inspection)).toBe(1);
});
