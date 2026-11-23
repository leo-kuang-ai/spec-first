'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-phase-two-'));
const skill = name => path.join(root, 'skills', name);
const fixture = (name, repo) => {
  const dest = path.join(scratch, repo);
  fs.cpSync(path.join(skill(name), 'evals/fixtures/repos', repo), dest, { recursive: true });
  return dest;
};
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^(?:GIT_|EVAL_)/i.test(key)));
Object.assign(env, { GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: os.devNull, GIT_TEMPLATE_DIR: '', EVAL_EXIT_CODE: '0' });
function run(cwd, program, args, extra = {}, expected = 0) {
  const result = spawnSync(program, args, { cwd, env: { ...env, ...extra }, encoding: 'utf8' });
  assert.equal(result.status, expected, result.error?.message || result.stderr || result.stdout);
  return result.stdout.trim();
}
function prepare(repo) {
  run(repo, 'git', ['init', '-q']);
  run(repo, 'node', ['prepare-eval.cjs']);
}
const judge = (name, file) => path.join(skill(name), 'evals/fixtures/scripts', file);

try {
  const watcher = path.join(skill('spec-lfg'), 'scripts/pr-watch-state.cjs');
  for (const [state, expected] of [['OPEN', 'no-terminal'], ['CLOSED', 'pr-closed'], ['MERGED', 'pr-merged'], ['UNKNOWN', 'pr-closed']]) {
    const stateDir = path.join(scratch, state);
    const input = path.join(scratch, 'input.json');
    fs.writeFileSync(input, JSON.stringify({ pr_number: 1, head_sha: 'a'.repeat(40), base_ref: 'main', base_oid: 'b'.repeat(40), pr_state: state, mergeable: 'MERGEABLE', merge_state_status: 'CLEAN', observed_at: '2026-11-20T01:00:00Z', checks: [], review_items: [] }));
    const prior = JSON.parse(run(scratch, 'node', [watcher, 'read', '--state-dir', stateDir]));
    const written = JSON.parse(run(scratch, 'node', [watcher, 'snapshot', '--input', input, '--state-dir', stateDir, '--expected-generation', String(prior.generation), '--expected-sha256', prior.snapshot_sha256]));
    assert.equal(written.reason_code, expected);
    console.log(state, written.terminal, written.reason_code);
  }
  const feedback = 'spec-resolve-pr-feedback';
  const local = fixture(feedback, 'mini-ledger');
  prepare(local);
  const readme = path.join(local, 'README.md');
  fs.writeFileSync(readme, fs.readFileSync(readme, 'utf8').replace('Known rough edges', 'Known limitations'));
  run(local, 'git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'fixture', '--', 'README.md']);
  const trace = path.join(scratch, 'trace.json');
  fs.writeFileSync(trace, '[]');
  for (const observation of [{}, { EVAL_TRANSCRIPT_PATH: trace }]) {
    console.log(observation.EVAL_TRANSCRIPT_PATH ? 'empty trace:' : 'no trace:', run(local, 'bash', [judge(feedback, 'check-authorized-fix.sh')], { EVAL_FINAL_MESSAGE: '仅本地提交', ...observation }));
  }
  const handoff = 'spec-handoff';
  const prior = fixture(handoff, 'mini-ledger-with-prior-handoff');
  prepare(prior);
  for (const message of ['记录没有说明哪些变更已经验证。', '全部完成，验证通过。']) {
    run(prior, 'bash', [judge(handoff, 'check-degraded-orientation.sh')], { EVAL_FINAL_MESSAGE: message });
    console.log('交接判据退出 0:', message);
  }
  const compound = 'spec-compound';
  const solved = fixture(compound, 'solved-ledger');
  const doc = path.join(solved, 'docs/solutions/input.md');
  fs.mkdirSync(path.dirname(doc), { recursive: true });
  const draft = '---\nproblem_type: logic_error\ndate: 2026-11-20\nsource_refs: []\ninvalidation_condition: ""\n---\namount\n';
  fs.writeFileSync(doc, draft);
  const publication = (dir, expected) => run(solved, 'bash', [judge(compound, 'check-solution-published.sh')], { EVAL_SKILL_DIR: dir, EVAL_FINAL_MESSAGE: 'docs/solutions/input.md' }, expected);
  publication(skill(compound), 1);
  publication(path.join(scratch, 'absent'), 0);
  console.log('空证据：正式判据退出 1；缺校验器时退出 0');
  fs.writeFileSync(doc, draft.replace('[]', '["src/server.js"]').replace('""', '"amount rules change"'));
  publication(skill(compound), 0);
  run(solved, 'node', ['--test', 'test/entries.test.js']);
  const server = path.join(solved, 'src/server.js');
  fs.writeFileSync(server, fs.readFileSync(server, 'utf8').replace("typeof amount !== 'number' || !Number.isFinite(amount)", 'false /* Number.isFinite */'));
  publication(skill(compound), 0);
  run(solved, 'node', ['--test', 'test/entries.test.js'], {}, 1);
  console.log('业务守卫改坏后：发布判据仍退出 0；业务测试退出 1');
  console.log(run(scratch, 'node', [path.join(skill(compound), 'evals/fixtures/repos/causal-auth/verify.cjs')]));
} finally {
  fs.rmSync(scratch, { recursive: true, force: true });
}
