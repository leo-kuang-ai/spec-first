'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync, spawn } = require('node:child_process');

const script = path.resolve(__dirname, '../../skills/spec-sweep/scripts/sweep-state.py');
const now = '2026-10-29T00:00:00Z';
const loader = 'import importlib.util,sys,types,os\ns=importlib.util.spec_from_file_location("sweep",sys.argv[1]);m=importlib.util.module_from_spec(s);s.loader.exec_module(m)\n';
const pythonEnv = { ...process.env, PYTHONDONTWRITEBYTECODE: '1' };
let root;
let state;
beforeEach(() => {
  root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sweep-safety-')));
  state = path.join(root, 'state.yml');
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

function invoke(command, args = [], env = {}) {
  const result = spawnSync('python3', [script, command, '--state', state, ...args], { encoding: 'utf8', env: { ...pythonEnv, ...env }, timeout: 5000 });
  expect(result.status).toBe(0);
  expect(result.stderr).not.toContain('Traceback');
  return result.stdout.trim().split('\n');
}
function acquire() { return invoke('lease-acquire', ['--writer', 'owner', '--now', now]); }
function upsert(data) { return invoke('upsert-item', ['--writer', 'owner', '--source', 'fixture', '--id', '1', '--now', now, '--json', JSON.stringify(data)]); }

test('first write in a new parent directory creates a real lock file', () => {
  state = path.join(root, 'fresh', 'state.yml');
  expect(acquire()[0]).toBe('OK');
  expect(fs.statSync(`${state}.lock`).isFile()).toBe(true);
  expect(acquire()[0]).toBe('OK');
});

test.each(['directory', 'symlink', 'hardlink', 'fifo'])('a %s lock fails without changing state or sentinel bytes', (kind) => {
  const sentinel = path.join(root, 'sentinel');
  fs.writeFileSync(sentinel, 'KEEP');
  if (kind === 'directory') fs.mkdirSync(`${state}.lock`);
  if (kind === 'symlink') fs.symlinkSync(sentinel, `${state}.lock`);
  if (kind === 'hardlink') fs.linkSync(sentinel, `${state}.lock`);
  if (kind === 'fifo') expect(spawnSync('python3', ['-c', 'import os,sys;os.mkfifo(sys.argv[1])', `${state}.lock`]).status).toBe(0);
  expect(acquire()[0]).toBe('ERROR');
  expect(fs.existsSync(state)).toBe(false);
  expect(fs.readFileSync(sentinel, 'utf8')).toBe('KEEP');
});

test('flock failure never enters the handler', () => {
  const code = loader + `
def fail(*args): raise OSError('lock fixture failure')
m.fcntl.flock=fail
m._run_locked(lambda args: print('HANDLER_CALLED'), types.SimpleNamespace(state=sys.argv[2]))
`;
  const result = spawnSync('python3', ['-c', code, script, state], { encoding: 'utf8', env: pythonEnv });
  expect(result.status).toBe(0);
  expect(result.stdout).toContain('state-lock-unavailable');
  expect(result.stdout).not.toContain('HANDLER_CALLED');
  expect(fs.existsSync(state)).toBe(false);
});

test('unavailable locking prevents mutation while reads remain available', () => {
  const code = loader + `
m._HAS_FCNTL=False
m._HANDLERS['lease-acquire']=lambda args: (_ for _ in ()).throw(AssertionError('HANDLER_CALLED'))
m.main(['sweep','lease-acquire','--state',sys.argv[2],'--writer','owner'])
m.main(['sweep','read','--state',sys.argv[2]])
`;
  const result = spawnSync('python3', ['-c', code, script, state], { encoding: 'utf8', env: pythonEnv });
  expect(result.status).toBe(0);
  expect(result.stderr).not.toContain('HANDLER_CALLED');
  expect(result.stdout.trim().split('\n').filter(line => !line.startsWith('{'))).toEqual(['ERROR', 'NO-STATE']);
  expect(fs.existsSync(state)).toBe(false);
});

test.each([
  'schema_version: 2\nsources: {}\nitems: {}\nfuture_field: "keep"\n',
  'schema_version: true\nsources: {}\nitems: {}\n',
  'schema_version: 1\nsources: []\nitems: {}\n',
  'schema_version: 1\nsources: {}\nitems: {}\n  orphan: "keep"\n',
  'schema_version: 1\nschema_version: 2\n',
  'schema_version: 1\nitems:\n  bad: []\n',
])('preserves future versions and malformed structures: %s', (contents) => {
  fs.writeFileSync(state, contents);
  expect(acquire()[0]).toBe('CORRUPT');
  expect(fs.readFileSync(state, 'utf8')).toBe(contents);
});

test('rejects new invalid closed items, preserves valid evidence and unknown fields, and repairs historical invalid state', () => {
  acquire();
  const before = fs.readFileSync(state);
  for (const value of [{ status: 'closed' }, { status: 'closed', fix_ref: [], verified_merge_sha: true, verified_at: 'yesterday' }]) {
    expect(upsert(value)[0]).toBe('REFUSED');
    expect(fs.readFileSync(state)).toEqual(before);
  }
  expect(upsert({ status: 'closed', fix_ref: 'commit:fixture', verified_merge_sha: 'a'.repeat(40), verified_at: now, future_field: { keep: true } })[0]).toBe('OK');
  let item = JSON.parse(invoke('read')[1]).items['fixture:1'];
  expect(item).toMatchObject({ status: 'closed', future_field: { keep: true } });
  fs.writeFileSync(state, fs.readFileSync(state, 'utf8').replace('verified_at: "2026-10-29T00:00:00Z"', 'verified_at: "invalid"'));
  expect(JSON.parse(invoke('validate')[1]).downgraded).toEqual(['fixture:1']);
  item = JSON.parse(invoke('read')[1]).items['fixture:1'];
  expect(item).toMatchObject({ status: 'fix_pending', future_field: { keep: true } });
});

test('UTF-8 state round-trips under an ASCII locale; invalid encoding is preserved', () => {
  fs.writeFileSync(state, 'schema_version: 1\nsources: {}\nitems: {}\nextra: "\u4e2d\u6587"\n');
  expect(invoke('lease-acquire', ['--writer', 'owner', '--now', now], { LC_ALL: 'C', LANG: 'C', PYTHONUTF8: '0', PYTHONCOERCECLOCALE: '0' })[0]).toBe('OK');
  expect(fs.readFileSync(state, 'utf8')).toContain('\u4e2d\u6587');
  const invalid = Buffer.from([0xff, 0xfe, 0x00]);
  fs.writeFileSync(state, invalid);
  expect(acquire()[0]).toBe('CORRUPT');
  expect(fs.readFileSync(state)).toEqual(invalid);
});

test('lease acquisition reports historical closed repairs before validate runs', () => {
  fs.writeFileSync(state, 'schema_version: 1\nsources: {}\nitems:\n  historical:\n    status: "closed"\n    note: "preserve"\n');
  const result = acquire();
  expect(result[0]).toBe('OK');
  expect(JSON.parse(result[1]).downgraded).toEqual(['historical']);
  expect(JSON.parse(invoke('read')[1]).items.historical).toMatchObject({ status: 'fix_pending', note: 'preserve' });
});

test('real process locking covers the entire handler and reuses the lock file', async () => {
  const trace = path.join(root, 'trace');
  const code = loader + `
import time
def handler(args):
    with open(sys.argv[3], 'a') as f: f.write('start:'+sys.argv[4]+'\\n')
    time.sleep(0.04)
    with open(sys.argv[3], 'a') as f: f.write('end:'+sys.argv[4]+'\\n')
m._run_locked(handler, types.SimpleNamespace(state=sys.argv[2]))
`;
  await Promise.all([1, 2, 3].map(id => new Promise((resolve, reject) => {
    const child = spawn('python3', ['-c', code, script, state, trace, String(id)], { env: pythonEnv });
    let stderr = '';
    child.stderr.on('data', data => { stderr += data; });
    child.on('error', reject);
    child.on('close', status => status === 0 ? resolve() : reject(new Error(stderr)));
  })));
  const lines = fs.readFileSync(trace, 'utf8').trim().split('\n');
  expect(lines).toHaveLength(6);
  for (let i = 0; i < 6; i += 2) expect(lines[i + 1]).toBe(lines[i].replace('start:', 'end:'));
  expect(fs.statSync(`${state}.lock`).isFile()).toBe(true);
});
