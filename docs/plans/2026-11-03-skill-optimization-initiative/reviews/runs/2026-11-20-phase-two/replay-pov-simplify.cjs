'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const skills = path.resolve(__dirname, '../../../../../..', 'skills');
const verdict = path.join(skills, 'spec-pov/evals/fixtures/scripts/check-r2-verdict-given.sh');
const fixtures = path.join(skills, 'spec-simplify-code/evals/fixtures');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'phase-two-ledger-'));
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')));
Object.assign(env, { HOME: temp, GIT_CONFIG_NOSYSTEM: '1', XDG_CONFIG_HOME: temp });

function check(label, command, args, cwd, extra, expected) {
  const result = spawnSync(command, args, { cwd, env: { ...env, ...extra }, encoding: 'utf8', timeout: 15000 });
  if (result.error) throw result.error;
  assert.equal(result.status, expected, `${label}: ${result.stderr}`);
  console.log(`${label}: ${result.status}`);
}

try {
  for (const [message, expected] of [['MySQL', 0], ['Hold：只有内存数组，无法确认已有 MySQL。', 0], ['仅复述问题', 1]]) {
    check(message, 'bash', [verdict], temp, { EVAL_FINAL_MESSAGE: message }, expected);
  }
  const repo = path.join(temp, 'repo');
  fs.cpSync(path.join(fixtures, 'repos/mini-ledger-guarded'), repo, { recursive: true });
  check('隔离仓库', 'git', ['init', '-q'], repo, {}, 0);
  check('捕获原始夹具', process.execPath, ['prepare-eval.cjs'], repo, {}, 0);
  const source = path.join(repo, 'src/server.js');
  const original = fs.readFileSync(source, 'utf8');
  assert.ok(original.includes('res.statusCode = 201;'));
  for (const status of [201, 200]) {
    fs.writeFileSync(source, original.replace('res.statusCode = 201;', `res.statusCode = ${status};`));
    check(`成功状态 ${status} 的原始证明`, process.execPath, ['--test', 'test/entries.test.cjs'], repo, {}, 0);
    for (const name of ['check-r2-safety-stays.sh', 'check-safety-preserved.sh']) {
      check(`${name} / ${status}`, 'bash', [path.join(fixtures, 'scripts', name)], repo,
        { EVAL_EXIT_CODE: '0', EVAL_FINAL_MESSAGE: '完成' }, 0);
    }
  }
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
