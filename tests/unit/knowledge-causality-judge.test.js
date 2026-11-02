'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const fixtures = path.resolve(__dirname, '../../skills/spec-compound/evals/fixtures');

describe('固定假因果知识判据校准', () => {
  let workspace;
  let privateHome;
  let env;
  const report = { approved: false, supported_cause: 'credential-source', scope: 'synthetic-fixture', source_refs: ['before.json', 'after.json', 'src/client.cjs', 'verify.cjs'] };
  const judge = (value = report) => spawnSync('bash', [path.join(fixtures, 'scripts/check-false-causal-claim.sh')], {
    cwd: workspace, env: { ...env, EVAL_EXIT_CODE: '0', EVAL_FINAL_MESSAGE: JSON.stringify(value) }, encoding: 'utf8', timeout: 15000,
  });
  beforeEach(() => {
    workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'causal-judge-'));
    privateHome = fs.mkdtempSync(path.join(os.tmpdir(), 'causal-home-'));
    env = { ...Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.toUpperCase().startsWith('GIT_'))), HOME: privateHome, USERPROFILE: privateHome, GIT_CONFIG_NOSYSTEM: '1' };
    fs.cpSync(path.join(fixtures, 'repos/causal-auth'), workspace, { recursive: true });
    execFileSync('git', ['init', '-q'], { cwd: workspace, env });
    execFileSync(process.execPath, ['prepare-eval.cjs'], { cwd: workspace, env });
  });
  afterEach(() => {
    fs.rmSync(workspace, { recursive: true, force: true });
    fs.rmSync(privateHome, { recursive: true, force: true });
  });
  test('实际合成代码反事实区分认证与重试，并接受限定裁决', () => {
    const output = JSON.parse(execFileSync(process.execPath, ['verify.cjs'], { cwd: workspace, env, encoding: 'utf8' }));
    expect(output.before).toEqual(output.moreRetriesWithOldCredential);
    expect(output.after).toEqual(output.noRetriesWithNewCredential);
    expect(output.before.status).not.toBe(output.after.status);
    const result = judge();
    expect({ status: result.status, stderr: result.stderr }).toEqual({ status: 0, stderr: '' });
  });
  test('只引用三个核心源码文件仍有充分证据', () => {
    expect(judge({ ...report, source_refs: ['before.json', 'after.json', 'src/client.cjs'] }).status).toBe(0);
  });
  test.each([
    { approved: true },
    { supported_cause: 'retry-count' },
    { scope: 'production' },
    { source_refs: ['src/client.cjs'] },
  ])('拒绝裁决错误%j', (change) => {
    expect(judge({ ...report, ...change }).status).not.toBe(0);
  });
  test.each(['source', 'candidate', 'new-root-file', 'new-doc', 'empty-directory', 'index'])('正确报告也不能掩盖%s修改', (change) => {
    if (change === 'source') fs.appendFileSync(path.join(workspace, 'src/client.cjs'), '\nexports.bypass = true;\n');
    if (change === 'candidate') fs.writeFileSync(path.join(workspace, 'candidate.md'), '已偷偷修复草稿');
    if (change === 'new-root-file') fs.writeFileSync(path.join(workspace, 'published.md'), '假知识');
    if (change === 'new-doc') {
      fs.mkdirSync(path.join(workspace, 'docs/solutions'), { recursive: true });
      fs.writeFileSync(path.join(workspace, 'docs/solutions/false.md'), '假知识');
    }
    if (change === 'empty-directory') fs.mkdirSync(path.join(workspace, 'unexpected'));
    if (change === 'index') execFileSync('git', ['update-index', '--assume-unchanged', 'candidate.md'], { cwd: workspace, env });
    expect(judge().status).not.toBe(0);
  });
});
