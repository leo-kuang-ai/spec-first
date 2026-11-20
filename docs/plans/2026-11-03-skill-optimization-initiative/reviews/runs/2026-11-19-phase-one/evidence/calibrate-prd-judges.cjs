const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const fixtures = path.resolve('skills/spec-prd/evals/fixtures');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'prd-judge-audit-'));
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')));
const historical = process.argv.includes('--historical');
const blocked = JSON.stringify({ can_enter_spec_plan: 'no', blocking_questions: ['OQ-1'], explanation: 'The encoding decision is open.' });
const ready = JSON.stringify({ can_enter_spec_plan: 'yes', blocking_questions: [], explanation: 'All decisions are settled.' });
try {
  for (const [fixture, judge, good, wrong, original, changed] of [
    ['large-resume', 'check-resume-identity.sh', '请确认积分的过期策略？', '请确认积分的过期策略？', '按订单金额 1%', '按订单金额 9%'],
    ['rough-prd', 'check-validate-report-only.sh', historical ? '编码兼容未定，不能进入规划。' : blocked, historical ? '全部已决定，可以进入规划。' : ready, 'CSV', 'PDF'],
  ]) {
    const cwd = path.join(scratch, fixture);
    fs.cpSync(path.join(fixtures, 'repos', fixture), cwd, { recursive: true });
    for (const args of [['git', 'init', '-q'], ['node', 'prepare-eval.cjs']]) {
      const result = spawnSync(args[0], args.slice(1), { cwd, env, encoding: 'utf8' });
      if (result.status !== 0) throw new Error(result.stderr);
    }
    const directory = path.join(cwd, 'docs/brainstorms');
    const file = path.join(directory, fs.readdirSync(directory)[0]);
    const text = fs.readFileSync(file, 'utf8');
    if (!text.includes(original)) throw new Error('夹具来源已变化');
    function probe(label, message, expected) {
      const result = spawnSync('bash', [path.join(fixtures, 'scripts', judge)], {
        cwd, env: { ...env, EVAL_EXIT_CODE: '0', EVAL_FINAL_MESSAGE: message }, encoding: 'utf8',
      });
      if (result.error || result.status === null) throw result.error || new Error('判分器未正常退出');
      console.log(`${fixture}\t${label}\t${result.status}`);
      if (!historical && result.status !== expected) process.exitCode = 1;
    }
    probe('正确对照', good, 0);
    if (fixture === 'rough-prd') probe('错误就绪结论、文件原样', wrong, 1);
    fs.writeFileSync(file, text.replace(original, changed));
    probe(fixture === 'large-resume' ? '已决定比例被改写' : '只读文件被改写', fixture === 'large-resume' ? wrong : good, 1);
    if (fixture === 'large-resume') {
      fs.writeFileSync(file, text.replace('spec_id: 2026-', 'spec_id: 2099-'));
      probe('身份改变', good, 1);
    }
  }
} finally {
  fs.rmSync(scratch, { recursive: true, force: true });
}
