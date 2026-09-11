'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { writeFileAtomic, writeFileAtomicIfAbsent } = require('../atomic-write');
const { validateAgainstSchema } = require('../../contracts/schema-validator');
const { isExactRepoRelativePath } = require('./secret-deny-patterns');

const SCHEMA_VERSION = 'spec-first-session.v1';
const SESSION_DIR_REL = path.join('.spec-first', 'sessions');
const SCHEMA_PATH = path.join(__dirname, '..', 'contracts', 'session', 'spec-first-session.schema.json');

// Schema-known keys; extras are preserved verbatim on heartbeat instead of
// failing additionalProperties, so records written by older/newer versions
// with extra fields keep beating rather than being frozen out.
const KNOWN_RECORD_FIELDS = [
  'schema_version', 'session_id', 'agent_kind', 'host_marker_path',
  'started_at', 'last_heartbeat_at', 'scope_hint', 'pid',
];
const STALE_MS = 24 * 60 * 60 * 1000;
const ID_PATTERN = /^[A-Za-z0-9._-]+$/;
const ALLOWED_AGENT_KINDS = ['claude-code', 'codex', 'other'];
const SCOPE_HINT_FORBIDDEN_PATTERN = /[\x00-\x1F\x7F]|\\|^\s*\/|^[A-Za-z]:|(^|\/)\.\.(\/|$)/;

let cachedSchema = null;

function getSchema() {
  if (!cachedSchema) {
    cachedSchema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  }
  return cachedSchema;
}

function getSessionDir(repoRoot) {
  return path.join(repoRoot, SESSION_DIR_REL);
}

function ensureSessionDir(repoRoot) {
  const dir = getSessionDir(repoRoot);
  const containment = validateSessionPathContainment(repoRoot, path.join(dir, 'containment-probe.json'));
  if (!containment.ok) {
    throw new Error(containment.errors.join('; '));
  }
  fs.mkdirSync(dir, { recursive: true });
  const postMkdirContainment = validateSessionPathContainment(repoRoot, path.join(dir, 'containment-probe.json'));
  if (!postMkdirContainment.ok) {
    throw new Error(postMkdirContainment.errors.join('; '));
  }
  return dir;
}

function getSessionFile(repoRoot, sessionId) {
  return path.join(getSessionDir(repoRoot), `${sessionId}.json`);
}

function isValidSessionId(value) {
  return typeof value === 'string' && value.length >= 1 && value.length <= 128 && ID_PATTERN.test(value);
}

function isValidAgentKind(value) {
  return ALLOWED_AGENT_KINDS.includes(value);
}

function normalizeOptionalString(value) {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function validateAdvisoryFields(options = {}) {
  const errors = [];
  const hostMarkerPath = normalizeOptionalString(options.host_marker_path);
  const scopeHint = normalizeOptionalString(options.scope_hint);

  if (hostMarkerPath !== null && !isExactRepoRelativePath(hostMarkerPath)) {
    errors.push('host_marker_path must be an exact repo-relative path');
  }
  if (scopeHint !== null && SCOPE_HINT_FORBIDDEN_PATTERN.test(scopeHint)) {
    errors.push('scope_hint must not contain absolute paths, drive paths, parent traversal, backslashes, or control characters');
  }

  return {
    ok: errors.length === 0,
    errors,
    fields: {
      host_marker_path: hostMarkerPath,
      scope_hint: scopeHint,
    },
  };
}

function nowIso() {
  return new Date().toISOString();
}

function generateSessionId() {
  // crypto.randomUUID 生成 UUIDv4；本协议接受任何匹配 ID_PATTERN 的字符串
  return crypto.randomUUID();
}

function readRecord(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return null;
    }
    return { __invalid__: true, __reason__: error instanceof Error ? error.message : String(error) };
  }
}

function validateRecord(record) {
  const result = validateAgainstSchema(getSchema(), record);
  return result.valid ? { valid: true, errors: [] } : { valid: false, errors: result.errors };
}

function isStale(record, now = Date.now()) {
  if (!record || typeof record.last_heartbeat_at !== 'string') return true;
  const ts = Date.parse(record.last_heartbeat_at);
  if (Number.isNaN(ts)) return true;
  return now - ts > STALE_MS;
}

function listSessions(repoRoot, { includeStale = false, now = Date.now() } = {}) {
  const dir = getSessionDir(repoRoot);
  const containment = validateSessionPathContainment(repoRoot, path.join(dir, 'containment-probe.json'));
  if (!containment.ok) {
    return [{
      session_id: 'session-store',
      invalid: true,
      reason: 'session-path-escape',
      errors: containment.errors,
      path: dir,
    }];
  }
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'));

  const sessions = [];
  for (const entry of entries) {
    const filePath = path.join(dir, entry.name);
    const record = readRecord(filePath);
    if (!record || record.__invalid__) {
      sessions.push({
        session_id: entry.name.replace(/\.json$/, ''),
        invalid: true,
        reason: record && record.__reason__ ? record.__reason__ : 'unreadable',
        path: filePath,
      });
      continue;
    }
    const validation = validateRecord(record);
    if (!validation.valid) {
      sessions.push({
        session_id: typeof record.session_id === 'string' ? record.session_id : entry.name.replace(/\.json$/, ''),
        invalid: true,
        reason: 'session-schema-invalid',
        errors: validation.errors,
        path: filePath,
      });
      continue;
    }
    const stale = isStale(record, now);
    if (stale && !includeStale) continue;
    sessions.push({ ...record, stale, path: filePath });
  }
  sessions.sort((a, b) => {
    const aTs = a.started_at || '';
    const bTs = b.started_at || '';
    if (aTs < bTs) return -1;
    if (aTs > bTs) return 1;
    return 0;
  });
  return sessions;
}

function registerSession(repoRoot, options = {}) {
  const sessionId = options.session_id || generateSessionId();
  if (!isValidSessionId(sessionId)) {
    return { ok: false, reason_code: 'session-id-invalid', session_id: sessionId };
  }
  const agentKind = options.agent_kind || 'other';
  if (!isValidAgentKind(agentKind)) {
    return { ok: false, reason_code: 'agent-kind-invalid', session_id: sessionId };
  }
  const filePath = getSessionFile(repoRoot, sessionId);
  const containment = validateSessionPathContainment(repoRoot, filePath);
  if (!containment.ok) {
    return { ok: false, reason_code: 'session-path-escape', session_id: sessionId, errors: containment.errors };
  }
  if (fs.existsSync(filePath)) {
    return { ok: false, reason_code: 'session-already-registered', session_id: sessionId, path: filePath };
  }
  const advisory = validateAdvisoryFields(options);
  if (!advisory.ok) {
    return { ok: false, reason_code: 'session-field-invalid', session_id: sessionId, errors: advisory.errors };
  }
  const record = {
    schema_version: SCHEMA_VERSION,
    session_id: sessionId,
    agent_kind: agentKind,
    host_marker_path: advisory.fields.host_marker_path,
    started_at: nowIso(),
    last_heartbeat_at: nowIso(),
    scope_hint: advisory.fields.scope_hint,
    pid: typeof options.pid === 'number' && options.pid > 0 ? options.pid : null,
  };
  const validation = validateRecord(record);
  if (!validation.valid) {
    return { ok: false, reason_code: 'session-schema-invalid', session_id: sessionId, errors: validation.errors };
  }
  try {
    ensureSessionDir(repoRoot);
    writeFileAtomicIfAbsent(filePath, `${JSON.stringify(record, null, 2)}\n`);
  } catch (error) {
    if (error.code === 'EEXIST') {
      return { ok: false, reason_code: 'session-already-registered', session_id: sessionId, path: filePath };
    }
    return { ok: false, reason_code: 'session-write-failed', session_id: sessionId, errors: [error.message] };
  }
  return { ok: true, session_id: sessionId, path: filePath, record };
}

function heartbeatSession(repoRoot, sessionId) {
  if (!isValidSessionId(sessionId)) {
    return { ok: false, reason_code: 'session-id-invalid', session_id: sessionId };
  }
  const filePath = getSessionFile(repoRoot, sessionId);
  const containment = validateSessionPathContainment(repoRoot, filePath);
  if (!containment.ok) {
    return { ok: false, reason_code: 'session-path-escape', session_id: sessionId, errors: containment.errors };
  }
  const record = readRecord(filePath);
  if (!record) {
    return { ok: false, reason_code: 'session-not-found', session_id: sessionId };
  }
  if (record.__invalid__) {
    return { ok: false, reason_code: 'session-schema-invalid', session_id: sessionId, reason: record.__reason__ };
  }
  const extras = {};
  for (const key of Object.keys(record)) {
    if (!KNOWN_RECORD_FIELDS.includes(key)) extras[key] = record[key];
  }
  const known = {};
  for (const key of KNOWN_RECORD_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(record, key)) known[key] = record[key];
  }
  known.last_heartbeat_at = nowIso();
  const validation = validateRecord(known);
  if (!validation.valid) {
    return { ok: false, reason_code: 'session-schema-invalid', session_id: sessionId, errors: validation.errors };
  }
  const updated = { ...extras, ...known };
  try {
    writeFileAtomic(filePath, `${JSON.stringify(updated, null, 2)}\n`);
  } catch (error) {
    return { ok: false, reason_code: 'session-write-failed', session_id: sessionId, errors: [error.message] };
  }
  return { ok: true, session_id: sessionId, path: filePath, record: updated };
}

function unregisterSession(repoRoot, sessionId) {
  if (!isValidSessionId(sessionId)) {
    return { ok: false, reason_code: 'session-id-invalid', session_id: sessionId };
  }
  const filePath = getSessionFile(repoRoot, sessionId);
  const containment = validateSessionPathContainment(repoRoot, filePath);
  if (!containment.ok) {
    return { ok: false, reason_code: 'session-path-escape', session_id: sessionId, errors: containment.errors };
  }
  if (!fs.existsSync(filePath)) {
    return { ok: false, reason_code: 'session-not-found', session_id: sessionId };
  }
  fs.rmSync(filePath, { force: true });
  return { ok: true, session_id: sessionId, path: filePath };
}

function validateSessionPathContainment(repoRoot, targetPath) {
  const errors = [];
  let realRepoRoot;
  const resolvedRepoRoot = path.resolve(repoRoot);
  const resolvedTarget = path.resolve(targetPath);
  if (!isPathInside(resolvedRepoRoot, resolvedTarget)) {
    return { ok: false, errors: [`session path escapes repo root: ${path.relative(resolvedRepoRoot, resolvedTarget)}`] };
  }

  try {
    realRepoRoot = fs.realpathSync(resolvedRepoRoot);
  } catch (error) {
    return { ok: false, errors: [`repo root realpath failed: ${error.message}`] };
  }

  const inspectPath = fs.existsSync(resolvedTarget) ? resolvedTarget : findExistingAncestor(path.dirname(resolvedTarget), resolvedRepoRoot);
  try {
    const stat = fs.lstatSync(inspectPath);
    if (stat.isSymbolicLink()) {
      errors.push(`session path must not use symlink ancestor: ${path.relative(resolvedRepoRoot, inspectPath) || '.'}`);
    }
    const realInspectPath = fs.realpathSync(inspectPath);
    if (!isPathInside(realRepoRoot, realInspectPath)) {
      errors.push(`session path realpath escapes repo root: ${path.relative(resolvedRepoRoot, inspectPath) || '.'}`);
    }
  } catch (error) {
    errors.push(`session path cannot be inspected: ${error.message}`);
  }

  return { ok: errors.length === 0, errors };
}

function findExistingAncestor(candidate, stopAt) {
  let current = path.resolve(candidate);
  const boundary = path.resolve(stopAt);
  while (!fs.existsSync(current) && current !== boundary && path.dirname(current) !== current) {
    current = path.dirname(current);
  }
  return current;
}

function isPathInside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

module.exports = {
  SCHEMA_VERSION,
  SESSION_DIR_REL,
  STALE_MS,
  ALLOWED_AGENT_KINDS,
  generateSessionId,
  getSessionDir,
  getSessionFile,
  getSchema,
  isStale,
  isValidSessionId,
  isValidAgentKind,
  validateAdvisoryFields,
  listSessions,
  registerSession,
  heartbeatSession,
  unregisterSession,
};
