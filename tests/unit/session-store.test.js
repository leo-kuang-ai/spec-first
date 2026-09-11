'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  SCHEMA_VERSION,
  STALE_MS,
  getSessionFile,
  isStale,
  isValidSessionId,
  validateAdvisoryFields,
  listSessions,
  registerSession,
  heartbeatSession,
  unregisterSession,
} = require('../../src/cli/helpers/session-store');

const ISO_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const SESSIONS_DIR_PARTS = ['.spec-first', 'sessions'];

const tempRoots = [];

function makeRepoRoot(prefix = 'session-store-') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempRoots.push(root);
  return root;
}

function sessionsDir(repoRoot) {
  return path.join(repoRoot, ...SESSIONS_DIR_PARTS);
}

function validRecord(overrides = {}) {
  return {
    schema_version: SCHEMA_VERSION,
    session_id: 'sess-fixture',
    agent_kind: 'other',
    host_marker_path: null,
    started_at: '2026-01-02T03:04:05.000Z',
    last_heartbeat_at: '2026-01-02T03:04:05.000Z',
    scope_hint: null,
    pid: null,
    ...overrides,
  };
}

function writeRawSession(repoRoot, sessionId, record) {
  const filePath = getSessionFile(repoRoot, sessionId);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(record, null, 2)}\n`);
  return filePath;
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

describe('registerSession write path', () => {
  test('writes a schema-valid record that round-trips through listSessions', () => {
    const repoRoot = makeRepoRoot();
    const result = registerSession(repoRoot, {
      session_id: 'sess-alpha',
      agent_kind: 'claude-code',
      host_marker_path: '.claude/settings.local.json',
      scope_hint: 'src/cli helpers',
      pid: 4321,
    });

    expect(result.ok).toBe(true);
    expect(result.session_id).toBe('sess-alpha');
    expect(result.path).toBe(getSessionFile(repoRoot, 'sess-alpha'));
    expect(result.path.startsWith(sessionsDir(repoRoot))).toBe(true);

    const raw = fs.readFileSync(result.path, 'utf8');
    expect(raw.endsWith('\n')).toBe(true);
    expect(JSON.parse(raw)).toEqual(result.record);
    expect(result.record).toMatchObject({
      schema_version: SCHEMA_VERSION,
      session_id: 'sess-alpha',
      agent_kind: 'claude-code',
      host_marker_path: '.claude/settings.local.json',
      scope_hint: 'src/cli helpers',
      pid: 4321,
    });

    const sessions = listSessions(repoRoot);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({
      session_id: 'sess-alpha',
      agent_kind: 'claude-code',
      stale: false,
      path: result.path,
    });
  });

  test('defaults to a generated id, agent kind other, and null advisory fields', () => {
    const repoRoot = makeRepoRoot();
    const first = registerSession(repoRoot, { pid: -5 });
    const second = registerSession(repoRoot);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(isValidSessionId(first.session_id)).toBe(true);
    // 生成的 id 必须彼此不同,否则两个并发注册会互相覆盖
    expect(first.session_id).not.toBe(second.session_id);
    expect(first.record).toMatchObject({
      agent_kind: 'other',
      host_marker_path: null,
      scope_hint: null,
      pid: null,
    });
    expect(first.record.started_at).toMatch(ISO_TIMESTAMP_PATTERN);
    expect(first.record.last_heartbeat_at).toMatch(ISO_TIMESTAMP_PATTERN);
  });

  test.each([
    ['session id with a path separator', { session_id: '../escape' }, 'session-id-invalid'],
    ['session id with a disallowed character', { session_id: 'sess beta' }, 'session-id-invalid'],
    ['session id longer than 128 chars', { session_id: 'a'.repeat(129) }, 'session-id-invalid'],
    ['unknown agent kind', { agent_kind: 'cursor' }, 'agent-kind-invalid'],
    ['absolute host marker path', { host_marker_path: '/etc/passwd' }, 'session-field-invalid'],
    ['parent traversal scope hint', { scope_hint: '../outside' }, 'session-field-invalid'],
  ])('rejects %s without creating any state file', (_name, options, reasonCode) => {
    const repoRoot = makeRepoRoot();
    const result = registerSession(repoRoot, options);

    expect(result.ok).toBe(false);
    expect(result.reason_code).toBe(reasonCode);
    if (options.session_id !== undefined) {
      expect(result.session_id).toBe(options.session_id);
    }
    expect(fs.existsSync(path.join(repoRoot, '.spec-first'))).toBe(false);
    expect(listSessions(repoRoot)).toEqual([]);
  });
});

describe('missing and corrupt state files', () => {
  test('listSessions returns an empty array when the sessions directory does not exist', () => {
    const repoRoot = makeRepoRoot();

    expect(listSessions(repoRoot)).toEqual([]);
    expect(fs.existsSync(sessionsDir(repoRoot))).toBe(false);
  });

  test('heartbeatSession and unregisterSession report session-not-found for missing state files', () => {
    const repoRoot = makeRepoRoot();

    expect(heartbeatSession(repoRoot, 'ghost')).toEqual({
      ok: false,
      reason_code: 'session-not-found',
      session_id: 'ghost',
    });
    expect(unregisterSession(repoRoot, 'ghost')).toEqual({
      ok: false,
      reason_code: 'session-not-found',
      session_id: 'ghost',
    });
  });

  test('listSessions flags corrupt JSON with the file-name session id and parse reason', () => {
    const repoRoot = makeRepoRoot();
    const filePath = getSessionFile(repoRoot, 'sess-corrupt');
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, '{not json\n');

    const sessions = listSessions(repoRoot);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({
      session_id: 'sess-corrupt',
      invalid: true,
      path: filePath,
    });
    expect(typeof sessions[0].reason).toBe('string');
    expect(sessions[0].reason.length).toBeGreaterThan(0);
  });

  test('heartbeatSession refuses a corrupt state file with session-schema-invalid and the parse reason', () => {
    const repoRoot = makeRepoRoot();
    const filePath = getSessionFile(repoRoot, 'sess-corrupt');
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, 'not json at all\n');

    const result = heartbeatSession(repoRoot, 'sess-corrupt');
    expect(result.ok).toBe(false);
    expect(result.reason_code).toBe('session-schema-invalid');
    expect(result.session_id).toBe('sess-corrupt');
    expect(typeof result.reason).toBe('string');
    expect(result.reason.length).toBeGreaterThan(0);
    expect(fs.readFileSync(filePath, 'utf8')).toBe('not json at all\n');
  });

  test('listSessions flags records that fail the session schema', () => {
    const repoRoot = makeRepoRoot();
    const missingKeyRecord = validRecord({ session_id: 'sess-missing-key' });
    delete missingKeyRecord.started_at;
    writeRawSession(repoRoot, 'sess-missing-key', missingKeyRecord);
    writeRawSession(repoRoot, 'sess-extra-key', validRecord({
      session_id: 'sess-extra-key',
      unexpected: 'field',
    }));

    const sessions = listSessions(repoRoot);
    expect(sessions).toHaveLength(2);
    for (const entry of sessions) {
      expect(entry.invalid).toBe(true);
      expect(entry.reason).toBe('session-schema-invalid');
      expect(Array.isArray(entry.errors)).toBe(true);
      expect(entry.errors.length).toBeGreaterThan(0);
    }
    const sessionIds = sessions.map((entry) => entry.session_id).sort();
    expect(sessionIds).toEqual(['sess-extra-key', 'sess-missing-key']);
  });
});

describe('staleness handling', () => {
  test('listSessions hides stale sessions unless includeStale is passed', () => {
    const repoRoot = makeRepoRoot();
    writeRawSession(repoRoot, 'sess-old', validRecord({
      session_id: 'sess-old',
      started_at: '2020-01-01T00:00:00.000Z',
      last_heartbeat_at: '2020-01-01T00:00:00.000Z',
    }));
    writeRawSession(repoRoot, 'sess-fresh', validRecord({
      session_id: 'sess-fresh',
      started_at: new Date().toISOString(),
      last_heartbeat_at: new Date().toISOString(),
    }));

    const defaultList = listSessions(repoRoot);
    expect(defaultList.map((entry) => entry.session_id)).toEqual(['sess-fresh']);
    expect(defaultList[0].stale).toBe(false);

    const fullList = listSessions(repoRoot, { includeStale: true });
    expect(fullList.map((entry) => entry.session_id)).toEqual(['sess-old', 'sess-fresh']);
    expect(fullList[0]).toMatchObject({ session_id: 'sess-old', stale: true });
    expect(fullList[1]).toMatchObject({ session_id: 'sess-fresh', stale: false });
  });

  test('listSessions honors an injected now for staleness classification', () => {
    const repoRoot = makeRepoRoot();
    const now = Date.parse('2026-06-01T00:00:00.000Z');
    writeRawSession(repoRoot, 'sess-clock', validRecord({
      session_id: 'sess-clock',
      started_at: new Date(now - 60000).toISOString(),
      last_heartbeat_at: new Date(now - 60000).toISOString(),
    }));

    expect(listSessions(repoRoot, { now })).toHaveLength(1);

    const futureNow = now + STALE_MS + 1000;
    expect(listSessions(repoRoot, { now: futureNow })).toEqual([]);
    const staleList = listSessions(repoRoot, { now: futureNow, includeStale: true });
    expect(staleList).toHaveLength(1);
    expect(staleList[0]).toMatchObject({ session_id: 'sess-clock', stale: true });
  });

  test.each([
    ['a missing record', null, true],
    ['a record without heartbeat', { agent_kind: 'other' }, true],
    ['a non-parsable heartbeat', { last_heartbeat_at: 'not-a-date' }, true],
    ['a fresh heartbeat', { last_heartbeat_at: new Date(1700000000000).toISOString() }, false],
    ['a heartbeat exactly STALE_MS old', { last_heartbeat_at: new Date(1700000000000 - STALE_MS).toISOString() }, false],
    ['a heartbeat one ms past STALE_MS', { last_heartbeat_at: new Date(1700000000000 - STALE_MS - 1).toISOString() }, true],
  ])('isStale returns %s as %p', (_name, record, expected) => {
    expect(isStale(record, 1700000000000)).toBe(expected);
  });
});

describe('concurrent overwrite semantics', () => {
  test('registerSession refuses to overwrite an existing session file', () => {
    const repoRoot = makeRepoRoot();
    const first = registerSession(repoRoot, {
      session_id: 'sess-dup',
      agent_kind: 'claude-code',
      pid: 111,
    });
    expect(first.ok).toBe(true);
    const originalRaw = fs.readFileSync(first.path, 'utf8');

    const second = registerSession(repoRoot, {
      session_id: 'sess-dup',
      agent_kind: 'codex',
      pid: 222,
    });

    expect(second).toMatchObject({
      ok: false,
      reason_code: 'session-already-registered',
      session_id: 'sess-dup',
      path: first.path,
    });
    expect(fs.readFileSync(first.path, 'utf8')).toBe(originalRaw);
  });

  test('heartbeatSession rewrites the full record without dropping sibling registrations', () => {
    const repoRoot = makeRepoRoot();
    const registered = registerSession(repoRoot, {
      session_id: 'sess-live',
      agent_kind: 'claude-code',
      host_marker_path: '.claude/settings.local.json',
      scope_hint: 'src/cli',
      pid: 4321,
    });
    const startedAt = registered.record.started_at;

    const firstBeat = heartbeatSession(repoRoot, 'sess-live');
    const secondBeat = heartbeatSession(repoRoot, 'sess-live');
    expect(firstBeat.ok).toBe(true);
    expect(secondBeat.ok).toBe(true);

    const finalRecord = JSON.parse(fs.readFileSync(registered.path, 'utf8'));
    expect(finalRecord).toMatchObject({
      schema_version: SCHEMA_VERSION,
      session_id: 'sess-live',
      agent_kind: 'claude-code',
      host_marker_path: '.claude/settings.local.json',
      scope_hint: 'src/cli',
      pid: 4321,
      started_at: startedAt,
    });
    expect(finalRecord.last_heartbeat_at).toMatch(ISO_TIMESTAMP_PATTERN);
    expect(finalRecord.last_heartbeat_at >= firstBeat.record.last_heartbeat_at).toBe(true);

    // 原子写只应留下最终的 .json 文件,不得残留 .tmp 中间文件
    expect(fs.readdirSync(sessionsDir(repoRoot)).sort()).toEqual(['sess-live.json']);
    // heartbeat 不会重置注册守卫:重复注册仍然被拒
    expect(registerSession(repoRoot, { session_id: 'sess-live' }).reason_code).toBe('session-already-registered');
  });

  test('heartbeatSession preserves unknown keys instead of freezing the record out', () => {
    const repoRoot = makeRepoRoot();
    // 修复后语义:heartbeat 只重校验 schema 已知字段投影,未知字段原样保留,
    // 旧/新版本写入的额外字段不会再使状态文件永远无法心跳。
    const filePath = writeRawSession(repoRoot, 'sess-strict', validRecord({
      session_id: 'sess-strict',
      unexpected: 'field',
    }));

    const result = heartbeatSession(repoRoot, 'sess-strict');

    expect(result.ok).toBe(true);
    expect(result.record.unexpected).toBe('field');
    expect(typeof result.record.last_heartbeat_at).toBe('string');
    const onDisk = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    expect(onDisk.unexpected).toBe('field');
  });

  test('unregisterSession removes the state file and later reads report session-not-found', () => {
    const repoRoot = makeRepoRoot();
    const registered = registerSession(repoRoot, { session_id: 'sess-gone' });
    expect(registered.ok).toBe(true);

    const removed = unregisterSession(repoRoot, 'sess-gone');
    expect(removed).toMatchObject({
      ok: true,
      session_id: 'sess-gone',
      path: registered.path,
    });
    expect(fs.existsSync(registered.path)).toBe(false);
    expect(listSessions(repoRoot)).toEqual([]);
    expect(heartbeatSession(repoRoot, 'sess-gone').reason_code).toBe('session-not-found');
  });
});

describe('path containment', () => {
  test('registerSession and listSessions fail closed when the repo root cannot be resolved', () => {
    const missingRoot = path.join(os.tmpdir(), `session-store-missing-${process.pid}-${Date.now()}`);
    expect(fs.existsSync(missingRoot)).toBe(false);

    const registerResult = registerSession(missingRoot, { session_id: 'sess-x' });
    expect(registerResult.ok).toBe(false);
    expect(registerResult.reason_code).toBe('session-path-escape');
    expect(registerResult.errors[0]).toEqual(expect.stringContaining('repo root realpath failed'));

    const listResult = listSessions(missingRoot);
    expect(listResult).toHaveLength(1);
    expect(listResult[0]).toMatchObject({
      session_id: 'session-store',
      invalid: true,
      reason: 'session-path-escape',
    });
  });

  test('a symlinked sessions directory is rejected as a path escape', () => {
    const repoRoot = makeRepoRoot();
    const outsideRoot = makeRepoRoot('session-store-outside-');
    fs.mkdirSync(path.join(repoRoot, '.spec-first'), { recursive: true });
    fs.symlinkSync(outsideRoot, path.join(repoRoot, '.spec-first', 'sessions'));

    const registerResult = registerSession(repoRoot, { session_id: 'sess-sym' });
    expect(registerResult.ok).toBe(false);
    expect(registerResult.reason_code).toBe('session-path-escape');

    const listResult = listSessions(repoRoot);
    expect(listResult).toHaveLength(1);
    expect(listResult[0].reason).toBe('session-path-escape');
  });
});

describe('listSessions entry hygiene and ordering', () => {
  test('sorts by started_at ascending and ignores non-json files and directories', () => {
    const repoRoot = makeRepoRoot();
    writeRawSession(repoRoot, 'sess-late', validRecord({
      session_id: 'sess-late',
      started_at: '2026-03-01T00:00:00.000Z',
      last_heartbeat_at: '2026-03-01T00:00:00.000Z',
    }));
    writeRawSession(repoRoot, 'sess-early', validRecord({
      session_id: 'sess-early',
      started_at: '2026-02-01T00:00:00.000Z',
      last_heartbeat_at: '2026-02-01T00:00:00.000Z',
    }));
    fs.writeFileSync(path.join(sessionsDir(repoRoot), 'notes.txt'), 'ignore me\n');
    fs.mkdirSync(path.join(sessionsDir(repoRoot), 'backup.json'), { recursive: true });

    const sessions = listSessions(repoRoot, { includeStale: true });
    expect(sessions.map((entry) => entry.session_id)).toEqual(['sess-early', 'sess-late']);
    expect(sessions.every((entry) => entry.invalid !== true)).toBe(true);
  });
});

describe('validateAdvisoryFields', () => {
  test.each([
    [{ host_marker_path: '.claude/settings.local.json' }, true],
    [{ host_marker_path: '' }, true],
    [{ host_marker_path: '/etc/passwd' }, false],
    [{ host_marker_path: '../outside' }, false],
    [{ host_marker_path: 'C:\\things' }, false],
    [{ scope_hint: 'src/cli helpers' }, true],
    [{ scope_hint: '/abs/path' }, false],
    [{ scope_hint: 'docs/..' }, false],
    [{ scope_hint: 'back\\slash' }, false],
  ])('classifies %p as ok=%p', (options, expectedOk) => {
    const result = validateAdvisoryFields(options);
    expect(result.ok).toBe(expectedOk);
    expect(Array.isArray(result.errors)).toBe(true);
    if (expectedOk) {
      expect(result.errors).toEqual([]);
      expect(result.fields).toEqual({
        host_marker_path: options.host_marker_path || null,
        scope_hint: options.scope_hint || null,
      });
    } else {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  test('normalizes absent and non-string advisory options to null fields', () => {
    const result = validateAdvisoryFields(undefined);
    expect(result).toEqual({
      ok: true,
      errors: [],
      fields: { host_marker_path: null, scope_hint: null },
    });
  });
});


  test('register does not overwrite when the existence check misses a concurrent write (EEXIST path)', () => {
    const repoRoot = makeRepoRoot();
    const first = registerSession(repoRoot, { session_id: 'sess-race' });
    expect(first.ok).toBe(true);
    const before = fs.readFileSync(first.path, 'utf8');
    // Force the pre-check to miss the file, simulating a concurrent registrant
    // winning the check-then-write window.
    const realExistsSync = fs.existsSync;
    jest.spyOn(fs, 'existsSync').mockImplementation((p) => (p === first.path ? false : realExistsSync(p)));
    try {
      const second = registerSession(repoRoot, { session_id: 'sess-race' });
      expect(second.ok).toBe(false);
      expect(second.reason_code).toBe('session-already-registered');
    } finally {
      jest.restoreAllMocks();
    }
    expect(fs.readFileSync(first.path, 'utf8')).toBe(before);
  });


describe('write-failure reason codes', () => {
  test('a genuine write failure is reported as session-write-failed, not a path escape', () => {
    const repoRoot = makeRepoRoot();
    // .spec-first occupied by a regular file -> ensureSessionDir cannot create the dir
    fs.mkdirSync(path.dirname(path.join(repoRoot, '.spec-first')), { recursive: true });
    fs.writeFileSync(path.join(repoRoot, '.spec-first'), 'not a directory');

    const result = registerSession(repoRoot, { session_id: 'sess-write' });
    expect(result.ok).toBe(false);
    expect(result.reason_code).toBe('session-write-failed');
    expect(result.errors[0]).toEqual(expect.any(String));
  });
});
