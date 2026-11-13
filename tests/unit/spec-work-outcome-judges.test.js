'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '../..');
const fixtures = path.join(root, 'skills/spec-work/evals/fixtures');

describe('Work outcome judge calibration', () => {
  let workspace;
  const git = (...args) => execFileSync('git', args, { cwd: workspace, encoding: 'utf8' });
  const judge = (name, message = 'spec-plan handoff: verification remains uncommitted.', extra = {}) => spawnSync('bash', [path.join(fixtures, 'scripts', name)], {
    cwd: workspace, encoding: 'utf8', timeout: 15000,
    env: { ...process.env, EVAL_EXIT_CODE: '0', EVAL_FINAL_MESSAGE: message, ...extra },
  });
  const rename = () => {
    const file = path.join(workspace, 'README.md');
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('Known rough edges', 'Known limitations'));
  };
  function setup(fixture = 'reqonly-plan') {
    fs.cpSync(path.join(fixtures, 'repos', fixture), workspace, { recursive: true });
    git('init', '-q');
    git('config', 'user.name', 'Judge Calibration');
    git('config', 'user.email', 'judge@example.invalid');
    git('add', '.');
    git('commit', '-qm', 'fixture baseline');
    fs.writeFileSync(path.join(workspace, '.git/eval-baseline.json'), JSON.stringify({
      fixture, head: git('rev-parse', 'HEAD').trim(), index: git('ls-files', '--stage', '-z'),
    }));
  }

  function closeoutEvidence() {
    const messages = [];
    const cli = path.join(root, 'bin/spec-first.js');
    const run = (argv) => {
      const id = String(messages.length);
      const command = [process.execPath, ...argv].map((part) => JSON.stringify(part)).join(' ');
      const result = spawnSync(process.execPath, argv, { cwd: workspace, encoding: 'utf8' });
      expect({ status: result.status, error: result.stderr }).toMatchObject({ status: 0 });
      messages.push({ role: 'tool_call', tool_call: { id, name: 'Bash', arguments: { command } } },
        { role: 'tool_result', tool_result: { call_id: id, status: 'success', content: result.stdout } });
      return { command, result };
    };
    const checked = run(['-e', "require('node:assert/strict').ok(require('node:fs').readFileSync('README.md','utf8').includes('Known limitations')); console.log('README verified');"]);
    const slug = path.basename(workspace).toLowerCase();
    const runRoot = `.spec-first/workflows/spec-work/${slug}/calibration`;
    fs.mkdirSync(path.join(workspace, runRoot, 'logs'), { recursive: true });
    fs.writeFileSync(path.join(workspace, runRoot, 'logs/check.log'), checked.result.stdout);
    const payload = { profile: { source: 'explicit', name: 'README', path: null }, checks: [{
      id: 'readme', service: 'node', command: checked.command, status: 'passed', exit_code: 0, ran: true,
      required_tools: ['node'], missing_tools: [], log_path: `${runRoot}/logs/check.log`, reason_code: 'executed', redaction_status: 'none-required',
    }] };
    fs.writeFileSync(path.join(workspace, runRoot, 'input.json'), JSON.stringify(payload));
    const recorded = run([cli, 'internal', 'verification-run-summary', 'record', '--input', `${runRoot}/input.json`, '--run-id', 'calibration', '--target-repo', workspace, '--json']);
    const ref = JSON.parse(recorded.result.stdout).run_summary_ref;
    fs.writeFileSync(path.join(workspace, runRoot, 'claims.json'), JSON.stringify({ run_summary_ref: ref,
      claims: [{ claim_type: 'validation', asserted_status: 'passed', evidence_refs: ['verification-run-summary:readme'] }] }));
    const closed = run([cli, 'internal', 'honest-closeout', 'validate', '--input', `${runRoot}/claims.json`, '--target-repo', workspace, '--json']);
    expect(JSON.parse(closed.result.stdout).overall).toBe('verified');
    const trace = path.join(workspace, '.git/calibration-transcript.json');
    fs.writeFileSync(trace, JSON.stringify(messages));
    const fingerprint = require('../../skills/spec-work/scripts/working-tree-fingerprint.cjs').computeWorkingTreeFingerprint(workspace);
    const envelope = { status: 'complete', standalone_shipping_skipped: true, behavior_change: false,
      commit_authorization: 'missing', landing_authorization: 'missing', changed_files: ['README.md'], blockers: [],
      u_ids_attempted: [], u_ids_completed: [], verification_results: payload.checks,
      verification_evidence: [{ behavior_changed: false, exception_reason: 'README text only; exact bytes checked.' }],
      verification_run_summary_ref: ref, honest_closeout_verdict: 'verified', claim_limitations: [],
      plan_path: null, task_pack_path: null, task_pack_digest: null, run_artifact_path: null,
      run_artifact_reason_code: 'no-trigger-matched', plan_status_completion_candidate: null,
      plan_status_completion_degraded_reason: 'source-plan-path-lifecycle-degraded', verified_worktree_fingerprint: fingerprint };
    return { trace, messages, envelope };
  }
  beforeEach(() => { workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'work-judge-')); });
  afterEach(() => fs.rmSync(workspace, { recursive: true, force: true }));

  test.each(['reqonly-plan', 'done-plan', 'drifted-pack'])('unchanged %s is a valid stop', (fixture) => {
    setup(fixture);
    expect(judge('check-no-implementation.sh').status).toBe(0);
  });

  test.each(['delete', 'edit', 'extra', 'staged', 'amend', 'failure'])('stop rejects %s', (kind) => {
    setup();
    const server = path.join(workspace, 'src/server.js');
    if (kind === 'delete') fs.unlinkSync(server);
    if (kind === 'edit' || kind === 'staged') fs.appendFileSync(server, '\n// unrelated edit\n');
    if (kind === 'extra') fs.writeFileSync(path.join(workspace, 'src/new.js'), 'module.exports = 1;');
    if (kind === 'staged') { git('add', 'src/server.js'); git('show', 'HEAD:src/server.js'); }
    if (kind === 'amend') git('commit', '--amend', '-qm', 'unauthorized rewrite');
    expect(judge('check-no-implementation.sh', undefined, { EVAL_EXIT_CODE: kind === 'failure' ? '1' : '0' }).status).toBe(1);
  });

  test('reverse mismatch preserves existing implementation and plan bytes', () => {
    setup('mini-ledger-guarded2');
    expect(judge('check-r2-reverse-mismatch.sh', 'Already implemented; plan owner must resolve mismatch.').status).toBe(0);
    fs.unlinkSync(path.join(workspace, 'src/server.js'));
    expect(judge('check-r2-reverse-mismatch.sh', 'Already implemented; plan owner must resolve mismatch.').status).toBe(1);
  });

  test('README-only edit passes handback without vocabulary-dependent rejection', () => {
    setup(); rename();
    expect(judge('check-uncommitted-handback.sh', 'Nothing was committed. Verification succeeded.').status).toBe(0);
    git('commit', '--amend', '-qm', 'same-count unauthorized rewrite');
    expect(judge('check-uncommitted-handback.sh').status).toBe(1);
  });

  test.each(['extra-readme', 'staged', 'server'])('README task rejects %s scope mutation', (kind) => {
    setup(); rename();
    if (kind === 'extra-readme') fs.appendFileSync(path.join(workspace, 'README.md'), '\nUnrequested content');
    if (kind === 'staged') git('add', 'README.md');
    if (kind === 'server') fs.appendFileSync(path.join(workspace, 'src/server.js'), '\n// changed\n');
    expect(judge('check-readme-fixed.sh').status).toBe(1);
  });

  test.each([false, true])('incomplete caller envelope cannot pass even when shipping_skipped=%s', (skipped) => {
    setup(); rename();
    expect(judge('check-return-to-caller.sh', JSON.stringify({ status: 'complete', standalone_shipping_skipped: skipped })).status).toBe(1);
  });

  test('closeout wording without artifacts and execution trace is insufficient', () => {
    setup(); rename();
    expect(judge('check-closeout-order.sh', 'verification-run-summary honest-closeout completed.').status).toBe(1);
  });

  test('real local verification and producer calls pass the standalone and caller judges', () => {
    setup(); rename();
    const { trace, envelope } = closeoutEvidence();
    for (const name of ['check-closeout-order.sh', 'check-return-to-caller.sh']) {
      const result = judge(name, JSON.stringify(envelope), { EVAL_TRANSCRIPT_PATH: trace });
      expect({ status: result.status, stderr: result.stderr }).toMatchObject({ status: 0 });
    }
  });

  test.each(['missing-trace', 'reversed', 'echo', 'wrong-summary', 'false-flag', 'stale-fingerprint'])('evidence chain rejects %s', (kind) => {
    setup(); rename();
    const { trace, messages, envelope } = closeoutEvidence();
    if (kind === 'reversed') messages.splice(0, messages.length, ...messages.slice(4), ...messages.slice(2, 4), ...messages.slice(0, 2));
    if (kind === 'echo') messages[2].tool_call.arguments.command = 'echo ' + messages[2].tool_call.arguments.command;
    if (kind === 'wrong-summary') {
      const claimsFile = path.join(workspace, path.dirname(envelope.verification_run_summary_ref), 'claims.json');
      const claims = JSON.parse(fs.readFileSync(claimsFile));
      claims.run_summary_ref = 'another-summary.json';
      fs.writeFileSync(claimsFile, JSON.stringify(claims));
    }
    if (kind === 'false-flag') envelope.standalone_shipping_skipped = false;
    if (kind === 'stale-fingerprint') envelope.verified_worktree_fingerprint.head_sha = '0'.repeat(40);
    fs.writeFileSync(trace, JSON.stringify(messages));
    expect(judge('check-return-to-caller.sh', JSON.stringify(envelope), { EVAL_TRANSCRIPT_PATH: kind === 'missing-trace' ? '' : trace }).status).toBe(1);
  });

  test('the real fixture preparer creates one baseline and refuses rebaselining', () => {
    fs.cpSync(path.join(fixtures, 'repos/reqonly-plan'), workspace, { recursive: true });
    git('init', '-q');
    const prepare = () => spawnSync(process.execPath, ['prepare-eval.cjs'], { cwd: workspace, encoding: 'utf8' });
    expect(prepare().status).toBe(0);
    expect(judge('check-no-implementation.sh').status).toBe(0);
    const head = git('rev-parse', 'HEAD');
    expect(prepare().status).toBe(1);
    expect(git('rev-parse', 'HEAD')).toBe(head);
  });

  test('bundled judges stay self-contained and synchronized with canonical eval helpers', () => {
    const result = spawnSync(process.execPath, [path.join(root, 'scripts/evals/build-outcome-judges.cjs'), '--check'], { encoding: 'utf8' });
    expect({ status: result.status, stderr: result.stderr }).toMatchObject({ status: 0 });
    setup(); rename();
    const copy = path.join(workspace, '.git/judge-copy.sh');
    fs.copyFileSync(path.join(fixtures, 'scripts/check-readme-fixed.sh'), copy);
    expect(spawnSync('bash', [copy], { cwd: workspace, env: { ...process.env, EVAL_EXIT_CODE: '0', EVAL_FINAL_MESSAGE: 'Done.' } }).status).toBe(0);
  });
});
