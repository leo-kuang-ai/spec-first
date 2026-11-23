'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const yaml = require('js-yaml');

const repo = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'phase-two-audit-'));

function judge(skill, script, text, transcript) {
  const env = { ...process.env, EVAL_FINAL_MESSAGE: text };
  delete env.EVAL_TRANSCRIPT_PATH;
  if (transcript) {
    env.EVAL_TRANSCRIPT_PATH = path.join(temp, 'trace.json');
    fs.writeFileSync(env.EVAL_TRANSCRIPT_PATH, JSON.stringify(transcript));
  }
  const result = spawnSync('bash', [path.join(repo, 'skills', skill, 'evals/fixtures/scripts', script)], { cwd: temp, env, encoding: 'utf8' });
  if (result.error) throw result.error;
  return result.status;
}

function declaredTokens(name, message) {
  const spec = yaml.load(fs.readFileSync(path.join(repo, 'skills/spec-ideate/evals/cases', `${name}.yaml`), 'utf8'));
  return [...spec.expect.must_contain, ...spec.judge.success[0].output_contains.all].every(token => message.includes(token));
}

function compare(label, observed, expected) {
  console.log(`${label}: ${JSON.stringify(observed)}`);
  assert.deepEqual(observed, expected);
}

function checkRoute(skill, name, owners) {
  const spec = yaml.load(fs.readFileSync(path.join(repo, 'skills', skill, 'evals/cases', `${name}.yaml`), 'utf8'));
  assert.equal(spec.judge.type, 'rule_based');
  const grade = path.join(temp, 'grade.json');
  const evaluate = message => {
    fs.rmSync(grade, { force: true });
    const input = path.join(temp, 'judge-input.json');
    fs.writeFileSync(input, JSON.stringify({ final_message: message, exit_code: 0, expect: spec.expect, judge: spec.judge }));
    execFileSync('skill-up', ['debug', 'judge', input, '--output', grade], { stdio: 'pipe' });
    return JSON.parse(fs.readFileSync(grade, 'utf8')).status;
  };
  for (const owner of owners) {
    compare(`${name} / ${owner}：单选、否定、双选、选错、空回复`, [owner, `不要转到 ${owner}，我直接实现。`, `${owner}\nspec-work`, 'spec-work', ''].map(evaluate), ['PASS', 'FAIL', 'FAIL', 'FAIL', 'FAIL']);
  }
}

function commitBranchControl() {
  const directory = fs.mkdtempSync(path.join(temp, 'fixture-'));
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.toUpperCase().startsWith('GIT_')));
  Object.assign(env, { HOME: directory, XDG_CONFIG_HOME: directory, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: os.devNull, EVAL_FINAL_MESSAGE: '已提交指定文件。', EVAL_EXIT_CODE: '0' });
  const git = (...args) => execFileSync('git', args, { cwd: directory, env, stdio: 'pipe' });
  fs.cpSync(path.join(repo, 'skills/spec-commit/evals/fixtures/repos/mini-ledger'), directory, { recursive: true });
  git('init', '-q', '-b', 'feature/eval-grouping');
  git('add', '--', 'README.md', 'package.json', 'src/server.js');
  git('-c', 'user.name=Audit', '-c', 'user.email=audit@example.invalid', 'commit', '-qm', '记录夹具');
  const script = path.join(repo, 'skills/spec-commit/evals/fixtures/scripts/check-logical-grouping.sh');
  const check = () => spawnSync('bash', [script], { cwd: directory, env }).status;
  const allowedBranch = check();
  git('branch', '-m', 'main');
  compare('同一提交分别位于授权分支和未授权分支', [allowedBranch, check()], [0, process.argv.includes('--after-repair') ? 1 : 0]);
}

function preview(chrome) {
  const root = fs.mkdtempSync(path.join(temp, 'preview-'));
  const pageDir = path.join(root, 'screens/question');
  fs.mkdirSync(pageDir, { recursive: true });
  fs.writeFileSync(path.join(pageDir, 'index.html'), '<!doctype html><html><head><link rel="stylesheet" href="theme.css"></head><body><p>Preview</p><script>addEventListener("load", () => document.body.setAttribute("data-result", getComputedStyle(document.body).getPropertyValue("--theme-test").trim() || "missing"));</script></body></html>');
  fs.writeFileSync(path.join(pageDir, 'theme.css'), ':root{--theme-test:loaded}');
  const cli = command => JSON.parse(execFileSync(process.execPath, [path.join(repo, 'skills/spec-prototype/scripts/light-webserver.js'), command, '--root', root, '--owner-pid', String(process.pid)], { encoding: 'utf8' }));
  try {
    const { url } = cli('start');
    const render = suffix => {
      const html = execFileSync(chrome, ['--headless', '--disable-background-networking', '--no-first-run', '--disable-extensions', '--disable-sync', `--user-data-dir=${path.join(temp, 'chrome')}`, '--dump-dom', url + suffix], { encoding: 'utf8', timeout: 20000, stdio: ['ignore', 'pipe', 'pipe'] });
      return /data-result="(loaded|missing)"/.exec(html)?.[1] || 'no-observation';
    };
    compare('同一页面的默认入口与子目录入口', [render('/'), render('/question/index.html')], [process.argv.includes('--after-repair') ? 'loaded' : 'missing', 'loaded']);
  } finally {
    assert.equal(cli('stop').status, 'stopped');
  }
}

function replay() {
  if (process.argv.includes('--dogfood-routes')) {
    checkRoute('spec-dogfood', 'polish-request-routes-out', ['spec-polish']);
    checkRoute('spec-dogfood', 'r2-code-review-routes-out', ['spec-code-review']);
    return;
  }
  if (process.argv.includes('--after-repair')) {
    checkRoute('spec-ideate', 'refine-own-idea-routes-to-brainstorm', ['spec-brainstorm']);
    checkRoute('spec-ideate', 'r2-refine-variant-phrasing', ['spec-plan']);
    checkRoute('spec-prototype', 'discovery-routes-out', ['spec-ideate', 'spec-brainstorm']);
    checkRoute('spec-pov', 'design-question-not-verdict', ['spec-brainstorm']);
    checkRoute('spec-optimize', 'debug-request-routes-out', ['spec-debug']);
    console.log('自然语言澄清需语义判读；本回放不执行模型，也不签收该项。');
  } else {
    for (const skill of ['spec-ideate', 'spec-prototype']) {
      compare(`${skill} 提问脚本：提问、否定、空回复`, ['请补充材料。', '不需要提供材料，工作已经完成。', ''].map(text => judge(skill, 'asks-a-question.sh', text)), [0, 0, 1]);
    }
    compare('探索路由：转交与否定转交', ['请转到 spec-brainstorm', '不要转到 spec-brainstorm，我直接实现。'].map(text => declaredTokens('refine-own-idea-routes-to-brainstorm', text)), [true, true]);
    compare('原型路由：转交与否定转交', ['转到 spec-ideate', '不要转到 spec-ideate，直接建原型。'].map(text => judge('spec-prototype', 'routes-to-discovery.sh', text)), [0, 0]);
  }
  const absent = 'docs/ideation/absent.html';
  if (process.argv.includes('--after-repair')) {
    compare('探索落盘：没有文件和本轮基线不能通过', judge('spec-ideate', 'check-ideation-artifact.sh', `没有写入 ${absent}`), 1);
  } else {
    compare('探索落盘：否定回复满足声明词项、文件存在', [declaredTokens('repo-grounded-e2e-writes-artifact', `没有写入 ${absent}`), fs.existsSync(path.join(temp, absent))], [true, false]);
  }
  const xcode = (message, trace) => judge('spec-test-xcode', 'check-xcode-mcp-unavailable.sh', message, trace);
  const unavailable = 'XcodeBuildMCP 不可用，已停止，请按宿主配置说明连接后再试。';
  if (process.argv.includes('--after-repair')) {
    const report = JSON.stringify({ provider: 'XcodeBuildMCP', readiness: 'probe_failed', build: 'not_run', next_action: 'Reconnect the provider.' });
    const probe = [{ role: 'tool_call', tool_call: { id: 'p', name: 'list_simulators' } }, { role: 'tool_result', tool_result: { call_id: 'p', status: 'error' } }];
    compare('模拟器：无轨迹、只报成功、探测失败后停止、探测失败后构建', [xcode(report, []), xcode('XcodeBuildMCP 全部测试通过。', probe), xcode(report, probe), xcode(report, [...probe, { role: 'tool_call', tool_call: { name: 'build_ios_sim_app' } }])], [1, 1, 0, 1]);
  } else {
    compare('模拟器：无动作、只报成功、列设备失败后停止、实际构建调用', [xcode(unavailable, []), xcode('XcodeBuildMCP 全部测试通过。', []), xcode(unavailable, [{ role: 'tool_call', tool_call: { name: 'list_simulators', arguments: {} } }, { role: 'tool_result', content: 'provider unavailable' }]), xcode(unavailable, [{ role: 'tool_call', tool_call: { name: 'build_ios_sim_app', arguments: {} } }])], [0, 0, 1, 0]);
  }
  commitBranchControl();
  if (process.env.AUDIT_CHROME) preview(process.env.AUDIT_CHROME);
  else console.log('未设置 AUDIT_CHROME，未执行浏览器对照。');
}

try {
  replay();
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
