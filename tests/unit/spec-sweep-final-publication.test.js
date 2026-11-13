'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const script = path.resolve(__dirname, '../../skills/spec-sweep/scripts/publish-final-state.py');
const engine = path.resolve(__dirname, '../../skills/spec-sweep/scripts/sweep-state.py');
const timestamp = '2026-10-29T12:00:00Z';
let root, repo, remote, lease, candidate;
const env = () => ({ ...process.env, HOME: root, USERPROFILE: root, GIT_CONFIG_GLOBAL: path.join(root, 'empty-config'), GIT_CONFIG_NOSYSTEM: '1', PYTHONDONTWRITEBYTECODE: '1' });
function git(args, cwd = repo) {
  const r = spawnSync('git', args, { cwd, env: env(), encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr);
  return r.stdout.trim();
}
function state(command, args = []) {
  const r = spawnSync('python3', [engine, command, '--state', path.join(repo, 'state.yml'), ...args], { env: env(), encoding: 'utf8' });
  expect(r.status).toBe(0);
  return r.stdout.trim().split('\n')[0];
}
function finalize() {
  expect(state('run-record', ['--writer', 'run-1', '--timestamp', timestamp, '--outcome', 'completed', '--counts', '{"ingested":1}'])).toBe('OK');
  expect(state('lease-release', ['--writer', 'run-1'])).toBe('OK');
  git(['add', '--', 'state.yml']);
  git(['commit', '-qm', 'fixture final']);
  candidate = git(['rev-parse', 'HEAD']);
}
function publish(extra = [], extraEnv = {}) {
  const r = spawnSync('python3', ['-B', script, '--repo', repo, '--state', 'state.yml', '--remote', 'origin', '--branch', 'sweep', '--writer', 'run-1', '--timestamp', timestamp, '--outcome', 'completed', '--counts', '{"ingested":1}', '--lease-commit', lease, '--candidate-commit', candidate || git(['rev-parse', 'HEAD']), '--topology', 'pushed-shared-branch', '--branch-authorized', '--landing-authorized', ...extra], { env: { ...env(), ...extraEnv }, encoding: 'utf8', timeout: 10000 });
  expect(r.stderr).not.toContain('Traceback');
  return { code: r.status, result: JSON.parse(r.stdout) };
}
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'sweep-publication-'));
  repo = path.join(root, 'repo'); remote = path.join(root, 'remote.git');
  fs.mkdirSync(repo); fs.writeFileSync(path.join(root, 'empty-config'), '');
  git(['init', '--bare', remote], root); git(['init', '-b', 'sweep']);
  git(['config', 'user.name', 'Fixture']); git(['config', 'user.email', 'fixture@example.invalid']);
  git(['remote', 'add', 'origin', remote]);
  expect(state('lease-acquire', ['--writer', 'run-1', '--now', timestamp])).toBe('OK');
  git(['add', '--', 'state.yml']); git(['commit', '-qm', 'fixture lease']);
  lease = git(['rev-parse', 'HEAD']); candidate = null;
  git(['push', '-q', 'origin', 'HEAD:refs/heads/sweep']);
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

test('publishes the actual final record and released lease, then resumes without another push', () => {
  finalize();
  const result = publish();
  expect(result).toMatchObject({ code: 0, result: { status: 'published', observed_remote_sha: candidate, release_confirmed: true } });
  const bytes = git(['show', 'refs/heads/sweep:state.yml'], remote);
  expect(bytes).toContain('writer: "run-1"'); expect(bytes).not.toContain('lease:');
  expect(publish()).toMatchObject({ code: 0, result: { status: 'published', push_attempted: false } });
});

test('missing record or unreleased lease prevents publication', () => {
  const before = git(['rev-parse', 'refs/heads/sweep'], remote);
  expect(publish()).toMatchObject({ code: 1, result: { status: 'blocked', reason_code: 'candidate-state-mismatch', push_attempted: false } });
  expect(git(['rev-parse', 'refs/heads/sweep'], remote)).toBe(before);
});

test('record failure and another writer release failure retain remote ownership', () => {
  fs.mkdirSync(path.join(repo, 'state.yml.lock.invalid'));
  fs.renameSync(path.join(repo, 'state.yml.lock'), path.join(repo, 'saved-lock'));
  fs.renameSync(path.join(repo, 'state.yml.lock.invalid'), path.join(repo, 'state.yml.lock'));
  expect(state('run-record', ['--writer', 'run-1', '--timestamp', timestamp, '--outcome', 'completed', '--counts', '{}'])).toBe('ERROR');
  fs.rmdirSync(path.join(repo, 'state.yml.lock'));
  expect(state('lease-release', ['--writer', 'other'])).toBe('LEASE-LOST');
  expect(publish().code).toBe(1);
  expect(git(['rev-parse', 'refs/heads/sweep'], remote)).toBe(lease);
});

test('rejected push remains pending and never reports remote cleanup', () => {
  finalize();
  fs.writeFileSync(path.join(remote, 'hooks/pre-receive'), '#!/bin/sh\nexit 1\n', { mode: 0o755 });
  expect(publish()).toMatchObject({ code: 1, result: { status: 'pending', release_confirmed: false, observed_remote_sha: lease, push_attempted: true } });
  expect(git(['rev-parse', 'HEAD'])).toBe(candidate);
});

test('a newer writer is read before recovery and never overwritten', () => {
  finalize();
  const peer = path.join(root, 'peer'); git(['clone', '-q', '-b', 'sweep', remote, peer], root);
  git(['config', 'user.name', 'Peer'], peer); git(['config', 'user.email', 'peer@example.invalid'], peer);
  fs.writeFileSync(path.join(peer, 'state.yml'), fs.readFileSync(path.join(peer, 'state.yml'), 'utf8').replace('run-1', 'run-2'));
  git(['add', '--', 'state.yml'], peer); git(['commit', '-qm', 'next writer'], peer); git(['push', '-q'], peer);
  const next = git(['rev-parse', 'HEAD'], peer);
  expect(publish()).toMatchObject({ code: 1, result: { reason_code: 'remote-state-advanced', observed_remote_sha: next, push_attempted: false } });
  expect(git(['rev-parse', 'refs/heads/sweep'], remote)).toBe(next);
});

test.each(['repo-local', 'committed-local'])('%s refuses the shared publisher without remote writes', (topology) => {
  finalize();
  expect(publish(['--topology', topology])).toMatchObject({ code: 1, result: { reason_code: 'shared-topology-required', push_attempted: false } });
  expect(git(['rev-parse', 'refs/heads/sweep'], remote)).toBe(lease);
});

test('unrelated committed files cannot hitchhike on the final publication', () => {
  finalize(); fs.writeFileSync(path.join(repo, 'unrelated'), 'private'); git(['add', '--', 'unrelated']); git(['commit', '-qm', 'unrelated']); candidate = git(['rev-parse', 'HEAD']);
  expect(publish()).toMatchObject({ code: 1, result: { reason_code: 'candidate-scope-mismatch', push_attempted: false } });
});

test('unknown push exit is reconciled from exact remote bytes before declaring success', () => {
  finalize();
  const realGit = spawnSync('which', ['git'], { encoding: 'utf8' }).stdout.trim();
  const bin = path.join(root, 'bin'); fs.mkdirSync(bin);
  fs.writeFileSync(path.join(bin, 'git'), `#!/bin/sh\n"${realGit}" "$@"\nresult=$?\nfor arg in "$@"; do if [ "$arg" = push ]; then exit 128; fi; done\nexit "$result"\n`, { mode: 0o755 });
  expect(publish([], { PATH: `${bin}:${process.env.PATH}` })).toMatchObject({ code: 0, result: { status: 'published', push_exit_code: 128, release_confirmed: true } });
});

test('reverted unrelated history is still refused', () => {
  fs.writeFileSync(path.join(repo, 'unrelated'), 'private'); git(['add', '--', 'unrelated']); git(['commit', '-qm', 'transient unrelated']);
  git(['rm', '-q', '--', 'unrelated']); git(['commit', '-qm', 'undo unrelated']); finalize();
  expect(publish()).toMatchObject({ code: 1, result: { reason_code: 'candidate-scope-mismatch', push_attempted: false } });
});

test('missing post-push readback stays pending and resumes from the observed remote', () => {
  finalize();
  const realGit = spawnSync('which', ['git'], { encoding: 'utf8' }).stdout.trim();
  const bin = path.join(root, 'bin'); fs.mkdirSync(bin); const marker = path.join(root, 'pushed');
  fs.writeFileSync(path.join(bin, 'git'), `#!/bin/sh\nfor arg in "$@"; do if [ "$arg" = ls-remote ] && [ -f "${marker}" ]; then exit 128; fi; done\n"${realGit}" "$@"\nresult=$?\nfor arg in "$@"; do if [ "$arg" = push ]; then touch "${marker}"; fi; done\nexit "$result"\n`, { mode: 0o755 });
  expect(publish([], { PATH: `${bin}:${process.env.PATH}` })).toMatchObject({ code: 1, result: { status: 'pending', release_confirmed: false, reason_code: 'git-read-failed' } });
  expect(publish()).toMatchObject({ code: 0, result: { status: 'published', push_attempted: false } });
});

test('a different push destination is refused before publication', () => {
  finalize(); git(['config', 'remote.origin.pushurl', path.join(root, 'other.git')]);
  expect(publish()).toMatchObject({ code: 1, result: { reason_code: 'remote-endpoint-mismatch', push_attempted: false } });
});

test('ambient followTags configuration cannot publish an unrelated tag', () => {
  finalize(); git(['config', 'push.followTags', 'true']); git(['tag', '-a', 'private-tag', '-m', 'fixture-only tag', candidate]);
  expect(publish().code).toBe(0);
  expect(git(['for-each-ref', '--format=%(refname)', 'refs/tags'], remote)).toBe('');
});
