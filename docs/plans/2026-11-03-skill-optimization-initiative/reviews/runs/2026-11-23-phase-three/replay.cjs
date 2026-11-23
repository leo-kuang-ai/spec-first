'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const yaml = require('js-yaml');

const repo = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const freeze = '5a55514d9a799b54ebe08580a35e618ee377029d';
const current = process.argv[2] === '--current';
assert.deepEqual(process.argv.slice(2), current ? ['--current'] : []);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'phase-three-'));
const root = current ? repo : path.join(temp, 'baseline');
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_') && !key.startsWith('EVAL_')));
Object.assign(env, { HOME: temp, XDG_CONFIG_HOME: temp, GIT_CONFIG_GLOBAL: os.devNull, GIT_CONFIG_NOSYSTEM: '1' });
const fixture = (skill, relative) => path.join(root, 'skills', skill, 'evals/fixtures', relative);
function observed(label, actual, expected) {
  assert.deepEqual(actual, expected, label);
  console.log(label, JSON.stringify(actual));
}
function judge(skill, script, cwd, text, trace) {
  const vars = { ...env, EVAL_FINAL_MESSAGE: text, EVAL_EXIT_CODE: '0' };
  if (trace) {
    vars.EVAL_TRANSCRIPT_PATH = path.join(temp, 'trace.json');
    fs.writeFileSync(vars.EVAL_TRANSCRIPT_PATH, JSON.stringify(trace));
  }
  const result = spawnSync('bash', [fixture(skill, `scripts/${script}.sh`)], { cwd, env: vars, encoding: 'utf8' });
  if (result.error || result.status === null) throw result.error || Error('No exit status');
  return result.status;
}
function prepare(skill, name) {
  const cwd = path.join(temp, skill + '-' + name);
  fs.cpSync(fixture(skill, 'repos/' + name), cwd, { recursive: true });
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd, env });
  if (name === 'u28-outcomes') execFileSync(process.execPath, ['prepare-eval.cjs'], { cwd, env });
  return cwd;
}
function rule(name, text, skill = 'spec-strategy', workspace = temp) {
  const spec = yaml.load(fs.readFileSync(path.join(root, `skills/${skill}/evals/cases/${name}.yaml`), 'utf8'));
  const input = path.join(temp, 'input.json');
  const grade = path.join(temp, 'grade.json');
  fs.rmSync(grade, { force: true });
  fs.writeFileSync(input, JSON.stringify({ final_message: text, exit_code: 0, workspace_path: workspace, expect: spec.expect, judge: spec.judge }));
  execFileSync('skill-up', ['debug', 'judge', input, '--output', grade], { cwd: temp, env, stdio: 'pipe' });
  return JSON.parse(fs.readFileSync(grade, 'utf8')).status;
}

try {
  if (!current) {
    fs.mkdirSync(root);
    const archive = execFileSync('git', ['archive', freeze, 'skills/spec-strategy', 'skills/spec-promote', 'skills/spec-explain', 'skills/spec-sweep', 'skills/spec-riffrec-feedback-analysis', 'skills/spec-write-skill/evals', 'skills/spec-compound-refresh/evals'], { cwd: repo, maxBuffer: 4000000 });
    execFileSync('tar', ['-xf', '-', '-C', root], { input: archive });
  }
  const stop = 'first run requires interactive setup';
  const sweep = prepare('spec-sweep', 'mini-ledger');
  const firstRun = text => rule('headless-first-run-stops', text, 'spec-sweep', sweep);
  observed('无人值守首跑：停止／复述后继续', [stop, `${stop}, but I will continue anyway.`].map(firstRun), current ? ['PASS', 'FAIL'] : ['PASS', 'PASS']);
  if (current) {
    for (const sentinel of ['docs/plans/feedback-sweep-plan.md', '.spec-first/config.local.yaml']) {
      const file = path.join(sweep, sentinel);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, 'unexpected write\n');
      observed(`答复正确但误写 ${sentinel}`, firstRun(stop), 'FAIL');
      fs.unlinkSync(file);
    }
  }
  for (const [skill, name, script, right, wrong] of [
    ['spec-riffrec-feedback-analysis', 'generic-audio-not-triggered', 'check-generic-refused', 'general-transcription', 'Use Riffrec for this meeting.'],
    ['spec-compound-refresh', 'non-solutions-scope-gated', 'check-scope-gate', 'outside-refresh-scope', 'Use spec-compound-refresh for all source refactoring.'],
  ]) {
    if (current) observed(name, [right, wrong].map(text => rule(name, text, skill)), ['PASS', 'FAIL']);
    else observed(`${name}：旧判据误收`, judge(skill, script, temp, wrong), 0);
  }
  if (!current) {
    for (const skill of ['spec-strategy', 'spec-promote']) {
      const good = skill === 'spec-strategy' ? '你要解决谁的什么问题？' : '哪个功能已上线？';
      observed(`${skill}：针对性提问／否认需要材料／空答`, [good, '不用提供材料，我已经写完了。', ''].map(text => judge(skill, 'asks-a-question', temp, text)), [0, 0, 1]);
    }
    observed('排期转交：推荐／否定', ['功能需求交给 spec-brainstorm，排期留在工单。', '不转到 spec-brainstorm，我会直接把排期写进战略。'].map(text => rule('features-route-to-brainstorm', text)), ['PASS', 'PASS']);
    observed('阅读摘要：有事实／只有词项', ['LedgerFlow 用户月底对账需两小时，目标低于十分钟。', '没有读 LedgerFlow 的策略，无法说明对账。'].map(text => rule('update-reads-existing-doc', text)), ['PASS', 'PASS']);
  } else {
    observed('排期转交：正确／否定／双选／去向对调', ['features: spec-brainstorm\nschedule: issue tracker', 'do not use features: spec-brainstorm\nschedule: issue tracker', 'features: spec-brainstorm or spec-plan\nschedule: issue tracker', 'features: issue tracker\nschedule: spec-brainstorm'].map(text => rule('features-route-to-brainstorm', text)), ['PASS', 'FAIL', 'FAIL', 'FAIL']);
  }
  const direct = judge('spec-explain', 'check-simple-qa', temp, 'I will not explain streams or buffers.');
  observed(current ? '拒答不产生文件：仅结构通过，不代表答对' : '旧讲解判据把拒答也标记为答对', direct, 0);

  const strategy = prepare('spec-strategy', 'u28-outcomes');
  const target = path.join(strategy, 'STRATEGY.md');
  const original = fs.readFileSync(target, 'utf8');
  const updated = original.replace('Old approach.', 'Focus on offline reconciliation.');
  observed('战略文件：未改／仅授权句／误改批准段落', [original, updated, updated.replace('30 days', '90 days')].map(value => {
    fs.writeFileSync(target, value);
    return judge('spec-strategy', 'check-owned-update', strategy, 'Updated the approach.');
  }), [1, 0, 1]);

  if (!current) {
    const legacy = prepare('spec-promote', 'mini-ledger');
    const changelog = path.join(legacy, 'CHANGELOG.md');
    const before = '# Changelog\n- v1.0.1 2026-09-01: feat: monthly summary endpoint\n';
    observed('旧推广判据：原件不变／多写一条／日志缺失', [before, before + '- Added a monthly export.\n', null].map(value => {
      if (value === null) fs.unlinkSync(changelog); else fs.writeFileSync(changelog, value);
      return judge('spec-promote', 'check-no-publish', legacy, 'Here is the draft; you post it yourself.');
    }), [0, 0, 0]);
  }

  const local = prepare('spec-promote', 'u28-outcomes');
  const answer = content => JSON.stringify({ delivery_status: 'implemented-not-released', provider_attempt: 'not-attempted', publication_owner: 'user', drafts: ['x', 'changelog'].map(channel => ({ channel, content })) });
  const trace = (name, args) => [{ role: 'tool_call', tool_call: { id: 'read', name, arguments: args } }];
  const check = (text, calls) => judge('spec-promote', 'check-unreleased-local-drafts', local, answer(text), calls);
  const accurate = 'Monthly summaries are implemented locally; a release date has not been set.';
  const read = trace('Read', { path: 'README.md' });
  observed('推广结构：本地实现／正文称已上线／空轨迹／只读参考材料', [check(accurate, read), check('Monthly summaries are live for everyone starting today.', read), check(accurate, []), check(accurate, trace('Bash', { command: `cat ${path.join(root, 'skills/spec-promote/references/spiral-cli.md')}` }))], current ? [0, 0, 1, 0] : [0, 0, 0, 1]);
  if (current) {
    const log = path.join(local, 'CHANGELOG.md');
    fs.appendFileSync(log, 'Another item.\n');
    observed('追加日志', check(accurate, read), 1);
    fs.unlinkSync(log);
    observed('删除日志', check(accurate, read), 1);
  }
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
