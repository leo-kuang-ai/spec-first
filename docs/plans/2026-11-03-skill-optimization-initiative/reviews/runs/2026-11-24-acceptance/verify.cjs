'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const layout = path.join(__dirname, '../2026-11-19-phase-one/design-layout');
const baseline = 'c590f74d37b2db22cb39bd9051d9b0bdbd9119b5';
const samples = {
  A: ['notification-control.md', 'f9bcb5e97b5db241b076d52e0cbc78fd33859f85cd52d24b426c1617bfc150e5'],
  B: ['notification-design-review.md', '47f57b60348f1415edf49314568a798f455d1c4f2330f7951d9fd9bc1fb00aca'],
};
const anchors = {
  development: ['样本没有给出生产仓库', '新逻辑只负责'],
  testing: ['如果根本读不到偏好', '- 允许邮件', '- 发送前关闭', '- 重放事件', '- 核对记录'],
  support: ['原有记录把事件', '偏好模块仍是订阅状态的唯一来源', '观察累计只发送一次'],
  rollout: ['先检查并按需扩展结果记录', '灰度范围、观测阈值和回退手段'],
};

function sections(text) {
  let heading;
  const rows = [];
  for (const line of text.split('\n')) {
    if (line.startsWith('## ')) heading = line.slice(3);
    else if (heading && line.trim()) rows.push({ heading, line });
  }
  return rows;
}

function preferenceTrial(hasExtraCase) {
  const cases = [['允许', 1], ['关闭', 0]];
  if (hasExtraCase) cases.push(['读取失败', 0]);
  return [false, true].map(sendOnFailure => {
    const missed = cases.filter(([preference, expectedSends]) => {
      const sends = [];
      const read = () => {
        if (preference === '读取失败') throw new Error(preference);
        return preference === '允许';
      };
      try {
        if (read()) sends.push('邮件');
      } catch {
        if (sendOnFailure) sends.push('邮件');
      }
      return sends.length !== expectedSends;
    });
    return missed.map(([preference]) => preference);
  });
}

function layoutFacts() {
  const body = {};
  const results = {};
  const extra = '- 读取失败：在发送前模拟偏好查询失败，核对该事件实际发送零次，并核对失败原因。';
  for (const [label, [name, expectedHash]] of Object.entries(samples)) {
    const bytes = fs.readFileSync(path.join(layout, name));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), expectedHash);
    const text = bytes.toString('utf8');
    const rows = sections(text);
    body[label] = rows.map(row => row.line).sort();
    const tasks = {};
    for (const [task, terms] of Object.entries(anchors)) {
      const headings = terms.map(term => {
        const matches = rows.filter(row => row.line.includes(term));
        assert.equal(matches.length, 1, term);
        return matches[0].heading;
      });
      tasks[task] = [...new Set(headings)];
    }
    const withCase = sections(text.replace(/^- 发送前关闭：.*$/m, line => `${line}\n${extra}`));
    assert.equal(withCase.length, rows.length + 1);
    const explicitCase = [rows, withCase].map(version => version.filter(row => row.line === extra).length);
    assert.deepEqual(explicitCase, [0, 1]);
    const mismatches = explicitCase.map(count => preferenceTrial(count === 1));
    assert.deepEqual(mismatches, [[[], []], [[], ['读取失败']]]);
    results[label] = { tasks, explicitCase, mismatches };
  }
  assert.deepEqual(body.A, body.B);
  return { bodyLines: body.A.length, layouts: results };
}

async function probe(historicalRoot) {
  const { maybeShowVersionReminder } = require(path.join(historicalRoot, 'src/cli/version-reminder.js'));
  const entry = fs.readFileSync(path.join(historicalRoot, 'src/cli/index.js'), 'utf8');
  assert.match(entry, /cmd === 'doctor'\s*\|\|\s*cmd === 'init'\s*\|\|\s*cmd === 'clean'\)\s*\{\s*await maybeShowVersionReminder\(/);
  const observations = [];
  for (const [delayMs, latest, expected] of [[0, '1.9.0', true], [630, '1.9.0', false], [0, '1.8.2', false]]) {
    let calls = 0;
    let aborted = false;
    let output = '';
    global.fetch = (_url, { signal }) => new Promise((resolve, reject) => {
      calls++;
      const timer = setTimeout(() => resolve({ ok: true, json: async () => ({ version: latest }) }), delayMs);
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        aborted = true;
        reject(new Error('查询超时'));
      }, { once: true });
    });
    const shown = await maybeShowVersionReminder({ packageName: 'spec-first', currentVersion: '1.8.2', output: { write: text => { output += text; } } });
    assert.equal(calls, 1);
    assert.equal(shown, expected);
    assert.equal(aborted, delayMs === 630);
    assert.equal(output.includes('1.8.2 -> 1.9.0'), expected);
    observations.push({ delayMs, latest, shown, aborted });
  }
  console.log(JSON.stringify(observations));
}

function verify() {
  const layouts = layoutFacts();
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-version-trial-'));
  try {
    const archive = execFileSync('git', ['archive', baseline, 'src', 'bin', 'package.json'], { cwd: root, maxBuffer: 32 * 1024 * 1024 });
    execFileSync('tar', ['-xf', '-', '-C', directory], { input: archive });
    const output = execFileSync(process.execPath, [__filename, '--probe', directory], { encoding: 'utf8', env: { PATH: process.env.PATH } });
    console.log(JSON.stringify({ ...layouts, baseline, reminder: JSON.parse(output) }, null, 2));
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

if (process.argv[2] === '--probe') probe(process.argv[3]).catch(error => { console.error(error); process.exitCode = 1; });
else verify();
