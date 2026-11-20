'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = process.cwd();
const fixtures = path.join(root, 'skills/spec-work/evals/fixtures');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'phase-one-replay-'));
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')));
function run(cwd, binary, args, status = 0, extra = {}) {
  const result = spawnSync(binary, args, { cwd, encoding: 'utf8', env: { ...env, ...extra } });
  if (result.error) throw result.error;
  assert.equal(result.status, status, result.stderr || result.stdout);
  return result;
}

function calibrateJudge() {
  const dir = path.join(temp, 'readme');
  fs.cpSync(path.join(fixtures, 'repos/reqonly-plan'), dir, { recursive: true });
  run(dir, 'git', ['init', '-q']);
  run(dir, process.execPath, ['prepare-eval.cjs']);
  const file = path.join(dir, 'README.md');
  const before = fs.readFileSync(file, 'utf8');
  const after = before.replace('Known rough edges', 'Known limitations');
  assert.notEqual(before, after);
  const judge = (message, code) => run(dir, 'bash', [path.join(fixtures, 'scripts/check-readme-fixed.sh')], code, { EVAL_FINAL_MESSAGE: message, EVAL_EXIT_CODE: '0' });
  const prefix = "const fs=require('node:fs'),file='README.md',text=fs.readFileSync(file,'utf8');";
  const commands = ["fs.writeFileSync(file,text.replace('Known rough edges','Known limitations'))", "fs.writeFileSync(file,text.split('Known rough edges').join('Known limitations'))"];
  for (const command of commands) {
    fs.writeFileSync(file, before);
    run(dir, process.execPath, ['-e', prefix + command]);
    assert.equal(fs.readFileSync(file, 'utf8'), after);
    judge('已更新说明。', 0);
  }
  fs.writeFileSync(file, before);
  const printed = run(dir, process.execPath, ['-p', JSON.stringify(commands[0])]);
  assert.equal(fs.readFileSync(file, 'utf8'), before);
  const rejected = judge(printed.stdout, 1);
  assert.match(rejected.stderr, /Unexpected task delta: README.md/);
  return [0, 0, 1];
}

function compareConsumers() {
  const modules = {};
  const identities = {};
  for (const name of ['backend', 'web', 'old-app']) {
    const dir = path.join(temp, name);
    fs.mkdirSync(dir);
    const file = path.join(dir, 'consumer.cjs');
    fs.copyFileSync(path.join(__dirname, 'cases', `${name}.cjs`), file);
    run(dir, 'git', ['init', '-q']);
    assert.equal(fs.realpathSync(run(dir, 'git', ['rev-parse', '--show-toplevel']).stdout.trim()), fs.realpathSync(dir));
    identities[name] = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    modules[name] = require(file);
  }
  const { writeRecord, readRecord, notify, route } = modules.backend;
  const file = path.join(temp, 'persisted.json');
  const reads = ['legacy', 'replacement', 'dual'].map(writer => {
    writeRecord(file, writer);
    return ['legacy', 'new'].map(reader => readRecord(file, reader));
  });
  assert.deepEqual(reads, [[true, true], [false, true], [true, true]]);
  const scenarios = [[false, false], [false, true], [true, false], [true, true]].map(([deduplicate, bridge]) => {
    fs.writeFileSync(file, JSON.stringify({ refunds: [] }));
    notify(file, 'payment-1', deduplicate);
    notify(file, 'payment-1', deduplicate);
    const requests = [];
    const request = url => { requests.push(url); return route(file, url, bridge); };
    const observed = [JSON.parse(fs.readFileSync(file)).refunds.length, modules.web.paymentStatus(request), modules['old-app'].renderOrder(request)];
    assert.deepEqual(requests, ['/v2/order', '/v1/order']);
    return observed;
  });
  assert.deepEqual(scenarios, [[2, '已退款', '未知状态'], [2, '已退款', '已退款'], [1, '已退款', '未知状态'], [1, '已退款', '已退款']]);
  return { identities, reads, scenarios };
}

function compareStructures() {
  const { resend, detailWithService, detailWithoutService } = require('./cases/invoice.cjs');
  const observations = [];
  for (const paid of [true, false]) {
    const order = { id: 'order-1', paid };
    const observe = operation => {
      const mail = [];
      const available = operation(id => mail.push(id));
      return [available, mail];
    };
    const expected = [paid, paid ? ['order-1'] : []];
    const oldDetail = observe(send => detailWithoutService({ selectedOrder: order }, send));
    const sharedDetail = observe(send => detailWithService({ selectedOrder: order }, send));
    const list = observe(send => resend(order, send));
    for (const result of [oldDetail, sharedDetail, list]) assert.deepEqual(result, expected);
    observations.push([oldDetail, sharedDetail, list]);
    assert.throws(() => detailWithoutService(order, () => {}), TypeError);
  }
  return observations;
}

function checkSchemaParity() {
  const dir = path.join(temp, 'parity');
  const test = 'tests/unit/spec-write-tasks-contracts.test.js';
  const ref = 'skills/spec-write-tasks/references/';
  for (const file of [test, 'skills/spec-write-tasks/SKILL.md', ...['task-pack-schema.md', 'execution-handoff-contract.md', 'task-quality-guide.md'].map(name => ref + name)]) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.copyFileSync(path.join(root, file), path.join(dir, file));
  }
  fs.symlinkSync(path.join(root, 'src'), path.join(dir, 'src'), 'dir');
  const schema = path.join(dir, ref, 'task-pack-schema.md');
  const original = fs.readFileSync(schema, 'utf8');
  const row = original.match(/^\| `task_id` \| .*\n/gm);
  assert.equal(row?.length, 1);
  const lines = fs.readFileSync(path.join(dir, test), 'utf8').split('\n');
  const missingLine = lines.findIndex(line => line.includes('expect(documentedTaskFields.has(field))')) + 1;
  const extraLine = lines.findLastIndex(line => line.includes('expect(allowed.has(field))')) + 1;
  assert.ok(missingLine > 0 && extraLine > missingLine);
  const cases = [[original, null], [original.replace(row[0], ''), missingLine], [original.replace(row[0], row[0] + '| `invented_field` | 审查反例 |\n'), extraLine]];
  return cases.map(([body, failedAssertion]) => {
    fs.writeFileSync(schema, body);
    const result = run(dir, process.execPath, [require.resolve('jest/bin/jest'), '--config', JSON.stringify({ rootDir: dir, roots: ['<rootDir>/tests'], transform: {} }), '--no-cache', '--runInBand', '--runTestsByPath', test, '-t', 'task pack schema stays in parity', '--json'], failedAssertion ? 1 : 0);
    const selected = JSON.parse(result.stdout).testResults[0].assertionResults.filter(entry => entry.status !== 'pending');
    assert.equal(selected.length, 1);
    assert.equal(selected[0].status, failedAssertion ? 'failed' : 'passed');
    if (failedAssertion) assert.match(selected[0].failureMessages.join('\n'), new RegExp(`spec-write-tasks-contracts\\.test\\.js:${failedAssertion}:`));
    return result.status;
  });
}

function compareErrorCopy() {
  const file = path.join(root, 'package.json');
  const source = fs.readFileSync(path.join(root, 'src/cli/commands/tasks.js'), 'utf8');
  const oldText = 'artifact root is not a directory';
  const newText = '产物根路径必须是目录';
  assert.equal(source.split(oldText).length, 2);
  const dir = path.join(temp, 'error-copy');
  fs.mkdirSync(path.join(dir, 'commands'), { recursive: true });
  fs.symlinkSync(path.join(root, 'src/cli/task-pack.js'), path.join(dir, 'task-pack.js'));
  fs.writeFileSync(path.join(dir, 'commands/tasks.js'), source.replace(oldText, newText));
  const args = ['hash', 'README.md', '--repo', file, '--json'];
  const actual = run(root, process.execPath, ['bin/spec-first.js', 'tasks', ...args], 2);
  const variant = run(dir, process.execPath, ['-e', "process.exitCode=require('./commands/tasks').runTasks(process.argv.slice(1))", ...args], 2);
  return [[actual, oldText], [variant, newText]].map(([result, text]) => {
    const data = JSON.parse(result.stdout);
    assert.deepEqual(data, { ok: false, error: { code: 'tasks-repo-not-directory', message: `${text}: ${file}` } });
    return { status: result.status, ...data.error };
  });
}

try {
  console.log(JSON.stringify({ AE4: calibrateJudge(), AE6: checkSchemaParity(), AE9_14_15: compareConsumers(), AE10: compareErrorCopy(), AE13: compareStructures() }, null, 2));
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
