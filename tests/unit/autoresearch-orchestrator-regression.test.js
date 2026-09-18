'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const script = path.resolve(__dirname, '../../skills/autoresearch/scripts/orchestrate.sh');
let temp;
beforeEach(() => { temp = fs.mkdtempSync(path.join(os.tmpdir(), 'autoresearch-regression-')); });
afterEach(() => { fs.rmSync(temp, { recursive: true, force: true }); });
const run = (...args) => spawnSync('bash', [script, ...args], { encoding: 'utf8' });
const stateRun = (command, overrides = {}) => {
  const file = path.join(temp, 'state.json');
  fs.writeFileSync(file, JSON.stringify({
    goal: 'test', archetype: 'fix-broken', mode: 'loop', pipeline: ['regression'],
    cycle_count: 1, units_remaining: [1, 0], hop_log: [],
    predicate: { command: 'true', expected: 'exit 0' }, predicate_met: true,
    terminal_choice: 'stop-at-verified', ...overrides,
  }));
  return run(command, file);
};

test.each([
  'postgresql://FAKE_USER:FAKE_PASSWORD@remote.example/prod?token=FAKE_QUERY',
  'mysql://FAKE_USER:FAKE_PASSWORD@remote.example/FAKE_PATH#FAKE_FRAGMENT',
  'postgres://FAKE_HOST.example/FAKE_PATH',
])('refusal output contains no user-supplied URL components: %s', url => {
  const result = run('screen-cmd', `db-client ${url}`);
  expect(result.status).toBe(2);
  expect(result.stdout).toContain('db-url-not-allowed');
  expect(result.stdout + result.stderr).not.toMatch(/FAKE_|remote\.example/);
});

test('resumed predicates use the same redacted refusal', () => {
  const result = stateRun('screen-state-predicate', {
    predicate: { command: 'psql postgres://FAKE_USER:FAKE_PASSWORD@remote.example/prod', expected: '0' },
  });
  expect(result.status).toBe(2);
  expect(result.stdout).toContain('db-url-not-allowed');
  expect(result.stdout + result.stderr).not.toMatch(/FAKE_|remote\.example/);
});

test.each(['postgres://localhost/prod', 'mysql://postgres-service/prod', 'postgres://remote.example/app_test'])(
  'safe DB allowlist is unchanged: %s', url => {
    expect(run('screen-cmd', `db-client ${url}`)).toMatchObject({ status: 0, stdout: 'allow\n' });
  }
);

test.each([
  [{ pending_verify: true }, 'verify', 'PENDING-VERIFY'],
  [{ hop_log: [{ outcome: 'failed' }] }, 'BLOCKED', 'BLOCKED'],
  [{ hop_log: [{ outcome: 'blocked' }] }, 'BLOCKED', 'BLOCKED'],
  [{ hop_log: [{ outcome: 'failed', retry_route: 'fix' }] }, 'fix', 'INCOMPLETE'],
  [{ last_handoff: { errors: 1 } }, 'fix', 'INCOMPLETE'],
  [{ last_handoff: { verdict: 'UNSTABLE' } }, 'regression', 'INCOMPLETE'],
  [{ last_handoff: { untested_gaps: true } }, 'debug', 'INCOMPLETE'],
  [{ units_remaining: [null, null, null] }, 'BLOCKED', 'BLOCKED'],
])('unresolved evidence cannot converge: %j', (state, hop, verdict) => {
  expect(stateRun('validate-state', state).status).toBe(0);
  expect(stateRun('next-hop', state)).toMatchObject({ status: 0, stdout: `${hop}\n` });
  const result = stateRun('verdict', state);
  expect(result.status).toBe(0);
  expect(result.stdout.split('\n')[0]).toBe(verdict);
});

test('verified recovery can converge after an older failed hop', () => {
  const state = { pending_verify: false, hop_log: [{ outcome: 'failed' }, { outcome: 'progressed' }] };
  expect(stateRun('next-hop', state).stdout).toBe('DONE\n');
  expect(stateRun('verdict', state).stdout.split('\n')[0]).toBe('CONVERGED');
});

test('verified ship remains approval-gated', () => {
  const result = stateRun('verdict', { pipeline: ['regression', 'ship'], terminal_choice: 'proceed-to-ship' });
  expect(result.stdout.split('\n')[0]).toBe('PENDING-SHIP-APPROVAL');
});

test.each(['what should I build next?', 'document the release process; do not deploy', '修复测试失败'])(
  'classification supplies advisory candidates without selecting a route: %s', goal => {
    const result = run('classify', goal);
    expect(result.status).toBe(0);
    const facts = JSON.parse(result.stdout);
    expect(facts).toMatchObject({ schema_version: 1, status: 'advisory', requires_semantic_judgment: true });
    expect(facts).not.toHaveProperty('archetype');
    expect(facts).not.toHaveProperty('mode');
    expect(Array.isArray(facts.candidates)).toBe(true);
    if (goal === '修复测试失败') expect(facts.candidates).toEqual([]);
    if (goal === 'what should I build next?') {
      expect(facts.candidates.map(c => c.archetype)).toEqual(expect.arrayContaining(['build-feature', 'what-to-build']));
    }
  }
);
