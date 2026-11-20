const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const cli = fs.realpathSync('bin/spec-first.js');
const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'ae7-'));
const runRoot = `.spec-first/workflows/spec-work/${path.basename(workspace).toLowerCase()}/calibration`;
const write = (name, value) => fs.writeFileSync(path.join(workspace, name), value);
const digest = () => crypto.createHash('sha256').update(fs.readFileSync(path.join(workspace, 'order.json'))).digest('hex');
const run = args => spawnSync(process.execPath, args, { cwd: workspace, encoding: 'utf8' });
function machine(args) {
  const result = run([cli, 'internal', ...args, '--target-repo', workspace, '--json']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}
try {
  assert.equal(spawnSync('git', ['init', '-q'], { cwd: workspace }).status, 0);
  fs.mkdirSync(path.join(workspace, runRoot, 'logs'), { recursive: true });
  write('order.json', JSON.stringify({ id: 'A01', order_id: 'A01' }));
  const before = digest();
  const checks = ['id', 'order_id'].map(field => {
    const args = ['-e', `require('node:assert/strict').equal(require('./order.json').${field},'A01'); console.log('OK')`];
    const result = run(args);
    assert.equal(result.status, 0);
    const log = `${runRoot}/logs/${field}.log`;
    write(log, result.stdout);
    return { args, check: { id: field, service: 'node', command: [process.execPath, ...args].map(JSON.stringify).join(' '), status: 'passed', exit_code: result.status, ran: true, required_tools: ['node'], missing_tools: [], log_path: log, reason_code: 'executed', redaction_status: 'none-required' } };
  });
  write(`${runRoot}/input.json`, JSON.stringify({ profile: { source: 'explicit', name: 'AE7', path: null }, checks: checks.map(entry => entry.check) }));
  const summary = machine(['verification-run-summary', 'record', '--input', `${runRoot}/input.json`, '--run-id', 'calibration']);
  write(`${runRoot}/claims.json`, JSON.stringify({ run_summary_ref: summary.run_summary_ref, claims: checks.map(({ check }) => ({ claim_type: 'validation', asserted_status: 'passed', evidence_refs: [`verification-run-summary:${check.id}`] })) }));
  const validate = () => machine(['honest-closeout', 'validate', '--input', `${runRoot}/claims.json`]).overall;
  const original = validate();
  write('order.json', JSON.stringify({ id: 'A01' }));
  const after = digest();
  assert.notEqual(after, before);
  const reused = validate();
  const rerun = checks.map(entry => run(entry.args).status);
  console.log(JSON.stringify({ before, after, original, reused, rerun }));
  assert.equal(original, 'verified');
  assert.deepEqual(rerun, [0, 1]);
} finally {
  fs.rmSync(workspace, { recursive: true, force: true });
}
