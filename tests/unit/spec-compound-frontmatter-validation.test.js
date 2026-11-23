'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const skillDir = path.resolve(__dirname, '../../skills/spec-compound');
const fixture = path.join(skillDir, 'evals/fixtures/repos/solved-ledger');
const judge = path.join(skillDir, 'evals/fixtures/scripts/check-solution-published.sh');
const doc = '---\nproblem_type: logic_error\ndate: 2026-11-21\nsource_refs: ["src/server.js"]\ninvalidation_condition: "The amount contract changes"\n---\nReject string amounts before storing them.\n';
let workspace;
let solution;

beforeEach(() => {
  workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'compound-publication-'));
  fs.cpSync(fixture, workspace, { recursive: true });
  solution = path.join(workspace, 'docs/solutions/input validation.md');
  fs.mkdirSync(path.dirname(solution), { recursive: true });
  fs.writeFileSync(solution, doc);
});
afterEach(() => fs.rmSync(workspace, { recursive: true, force: true }));

function check(directory = skillDir) {
  return spawnSync('bash', [judge], { cwd: workspace, encoding: 'utf8', env: {
    ...process.env, EVAL_SKILL_DIR: directory, EVAL_FINAL_MESSAGE: 'Documentation complete',
  } });
}

test('当前来源、有效晋升元数据和唯一文件通过', () => expect(check().status).toBe(0));

test.each([
  ['---\n', ''], ['["src/server.js"]', '[]'], ['"The amount contract changes"', '""'],
  ['date: 2026-11-21\n', ''], ['problem_type: logic_error\n', ''],
])('拒绝损坏或缺失的元数据 %s', (before, after) => {
  fs.writeFileSync(solution, doc.replace(before, after));
  expect(check().status).toBe(1);
});

test('没有正式校验器时不能签收有效文档或空证据文档', () => {
  for (const text of [doc, doc.replace('["src/server.js"]', '[]')]) {
    fs.writeFileSync(solution, text);
    const result = check(path.join(workspace, 'absent'));
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/validator/i);
  }
});

test('保留守卫名称但修改实现仍被拒绝', () => {
  fs.writeFileSync(path.join(workspace, 'src/server.js'), '// Number.isFinite\n');
  expect(check().status).toBe(1);
});

test('多份文档不能由第一份代为通过', () => {
  fs.writeFileSync(path.join(path.dirname(solution), 'second.md'), doc);
  expect(check().status).toBe(1);
});
