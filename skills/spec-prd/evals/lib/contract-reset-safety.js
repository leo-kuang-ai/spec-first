'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { TextDecoder } = require('node:util');

const UTF8_DECODER = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });
const SENSITIVE_CONTENT_PATTERNS = [
  /SPEC_FIRST_CANARY_[A-Z0-9_-]+/i,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
  /\bsk-[A-Za-z0-9_-]{16,}\b/,
  /\b(?:gh[pousr]_[A-Za-z0-9_]{12,}|github_pat_[A-Za-z0-9_]{12,}|xox[baprs]-[A-Za-z0-9-]{12,})\b/i,
  /\b(?:Authorization\s*:\s*)?(?:Bearer|Basic)\s+[A-Za-z0-9._~+\/=:-]{8,}/i,
  /(?:["']?\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret|client[_-]?secret|private[_-]?key)["']?)\s*[:=]\s*["']?[^\s"',}<]{8,}/i,
  /[?&](?:access_token|token|api_key|apikey|secret)=[^&#\s]{6,}/i,
];
const SENSITIVE_JSON_KEYS = new Set([
  'apikey',
  'accesstoken',
  'refreshtoken',
  'password',
  'secret',
  'clientsecret',
  'privatekey',
  'authorization',
  'credential',
  'credentials',
]);

function withReason(message, reasonCode) {
  const error = new Error(message);
  error.reason_code = reasonCode;
  return error;
}

function isWithinRoot(candidatePath, rootPath) {
  const relative = path.relative(path.resolve(rootPath), path.resolve(candidatePath));
  return relative === '' || (relative && !relative.startsWith('..') && !path.isAbsolute(relative));
}

function pathsOverlap(firstPath, secondPath) {
  return isWithinRoot(firstPath, secondPath) || isWithinRoot(secondPath, firstPath);
}

function ensurePrivateDir(directory) {
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  fs.chmodSync(directory, 0o700);
}

function writePrivateFile(filePath, contents, options = {}) {
  const mode = options.mode === undefined ? 0o600 : options.mode;
  ensurePrivateDir(path.dirname(filePath));
  fs.writeFileSync(filePath, contents, { mode });
  fs.chmodSync(filePath, mode);
}

function opaqueNamespaceId(sessionId) {
  return `ns-${crypto.createHash('sha256').update(String(sessionId)).digest('hex').slice(0, 20)}`;
}

function createRootContext(rootPath, label = 'run root') {
  const absolute = path.resolve(rootPath);
  const stat = fs.lstatSync(absolute);
  if (stat.isSymbolicLink()) {
    throw withReason(`${label} must not be a symlink: ${rootPath}`, 'path_symlink_forbidden');
  }
  if (!stat.isDirectory()) {
    throw withReason(`${label} must be a directory: ${rootPath}`, 'path_type_invalid');
  }
  return {
    absolute,
    real: fs.realpathSync.native(absolute),
    label,
  };
}

function resolveConfinedPath(rootContext, filePath, label, options = {}) {
  const absolute = path.isAbsolute(filePath)
    ? path.resolve(filePath)
    : path.resolve(rootContext.absolute, filePath);
  if (!isWithinRoot(absolute, rootContext.absolute)) {
    throw withReason(`${label} escapes the ${rootContext.label}: ${filePath}`, 'path_root_escape');
  }

  const relative = path.relative(rootContext.absolute, absolute);
  const segments = relative ? relative.split(path.sep).filter(Boolean) : [];
  let current = rootContext.absolute;
  let missing = false;
  for (const segment of segments) {
    current = path.join(current, segment);
    let stat;
    try {
      stat = fs.lstatSync(current);
    } catch (error) {
      if (error && error.code === 'ENOENT') {
        missing = true;
        break;
      }
      throw error;
    }
    if (stat.isSymbolicLink()) {
      throw withReason(`${label} has a symlink ancestor: ${filePath}`, 'path_symlink_forbidden');
    }
    const real = fs.realpathSync.native(current);
    if (!isWithinRoot(real, rootContext.real)) {
      throw withReason(`${label} resolves outside the ${rootContext.label}: ${filePath}`, 'path_real_root_escape');
    }
  }

  if (options.mustExist !== false) {
    if (missing) {
      throw withReason(`${label} does not exist: ${filePath}`, 'path_missing');
    }
    const stat = fs.lstatSync(absolute);
    if (stat.isSymbolicLink()) {
      throw withReason(`${label} must not be a symlink: ${filePath}`, 'path_symlink_forbidden');
    }
    const typeValid = options.allowDirectory === true
      ? stat.isFile() || stat.isDirectory()
      : stat.isFile();
    if (!typeValid) {
      throw withReason(`${label} has an unsupported file type: ${filePath}`, 'path_type_invalid');
    }
    const real = fs.realpathSync.native(absolute);
    if (!isWithinRoot(real, rootContext.real)) {
      throw withReason(`${label} resolves outside the ${rootContext.label}: ${filePath}`, 'path_real_root_escape');
    }
  }
  return absolute;
}

function assertExactRelativePath(value, label) {
  if (typeof value !== 'string' || !value || path.isAbsolute(value)) {
    throw withReason(`${label} must be an exact relative path`, 'path_relative_required');
  }
  const normalized = path.posix.normalize(value.replaceAll('\\', '/'));
  if (normalized !== value.replaceAll('\\', '/') || normalized === '.' || normalized.startsWith('../')) {
    throw withReason(`${label} must be an exact relative path: ${value}`, 'path_relative_required');
  }
  return normalized;
}

function decodeUtf8Strict(label, bytes) {
  const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  let text;
  try {
    text = UTF8_DECODER.decode(buffer);
  } catch (_error) {
    throw withReason(`invalid UTF-8 in ${label}`, 'retained_evidence_invalid_utf8');
  }
  if (!Buffer.from(text, 'utf8').equals(buffer)) {
    throw withReason(`UTF-8 round-trip changed bytes in ${label}`, 'retained_evidence_invalid_utf8');
  }
  return text;
}

function assertNoSensitiveContent(label, bytes) {
  const text = Buffer.isBuffer(bytes) ? bytes.toString('utf8') : String(bytes);
  const matched = SENSITIVE_CONTENT_PATTERNS.find((pattern) => pattern.test(text));
  if (matched) {
    throw withReason(
      `sensitive content detected in ${label}; durable evidence write refused`,
      'retained_evidence_sensitive_content',
    );
  }
}

function assertNoSensitiveJson(label, value) {
  function visit(current) {
    if (Array.isArray(current)) {
      current.forEach(visit);
      return;
    }
    if (!current || typeof current !== 'object') return;
    for (const [key, child] of Object.entries(current)) {
      const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (SENSITIVE_JSON_KEYS.has(normalizedKey) && child !== null && child !== '') {
        throw withReason(
          `sensitive content detected in ${label}; durable evidence write refused`,
          'retained_evidence_sensitive_content',
        );
      }
      visit(child);
    }
  }
  visit(value);
}

function parseJsonBytes(label, bytes) {
  const text = decodeUtf8Strict(label, bytes);
  assertNoSensitiveContent(label, text);
  let value;
  try {
    value = JSON.parse(text);
  } catch (_error) {
    throw withReason(`${label} must be valid JSON`, 'retained_evidence_json_invalid');
  }
  assertNoSensitiveJson(label, value);
  return value;
}

function assertPlainObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw withReason(`${label} must be an object`, 'contract_shape_invalid');
  }
}

function assertAllowedFields(value, allowedFields, label) {
  assertPlainObject(value, label);
  const unexpected = Object.keys(value).filter((key) => !allowedFields.has(key));
  if (unexpected.length > 0) {
    throw withReason(
      `${label} has unsupported field: ${unexpected.sort().join(',')}`,
      'contract_field_not_allowed',
    );
  }
}

function listTreeFiles(rootPath) {
  const root = createRootContext(rootPath, 'tree root');
  const files = [];
  function visit(current, relative = '') {
    for (const name of fs.readdirSync(current).sort()) {
      const absolute = path.join(current, name);
      const nextRelative = relative ? `${relative}/${name}` : name;
      const stat = fs.lstatSync(absolute);
      if (stat.isSymbolicLink()) {
        throw withReason(`tree contains a symlink: ${nextRelative}`, 'path_symlink_forbidden');
      }
      const real = fs.realpathSync.native(absolute);
      if (!isWithinRoot(real, root.real)) {
        throw withReason(`tree entry escapes root: ${nextRelative}`, 'path_real_root_escape');
      }
      if (stat.isDirectory()) visit(absolute, nextRelative);
      else if (stat.isFile()) files.push(nextRelative.split(path.sep).join('/'));
      else throw withReason(`tree entry has unsupported type: ${nextRelative}`, 'path_type_invalid');
    }
  }
  visit(root.absolute);
  return files;
}

function computeTreeHash(rootPath, sourcePaths) {
  const root = createRootContext(rootPath, 'source tree');
  const files = Array.isArray(sourcePaths)
    ? sourcePaths.map((entry) => assertExactRelativePath(entry, 'source file')).sort()
    : listTreeFiles(root.absolute);
  const hash = crypto.createHash('sha256');
  for (const relativePath of files) {
    const absolute = resolveConfinedPath(root, relativePath, `source file ${relativePath}`);
    const stat = fs.lstatSync(absolute);
    const bytes = fs.readFileSync(absolute);
    hash.update(relativePath);
    hash.update('\0');
    hash.update(String(stat.mode & 0o777));
    hash.update('\0');
    hash.update(String(bytes.length));
    hash.update('\0');
    hash.update(bytes);
    hash.update('\0');
  }
  return `sha256:${hash.digest('hex')}`;
}

module.exports = {
  assertAllowedFields,
  assertExactRelativePath,
  assertNoSensitiveContent,
  assertNoSensitiveJson,
  computeTreeHash,
  createRootContext,
  decodeUtf8Strict,
  ensurePrivateDir,
  isWithinRoot,
  listTreeFiles,
  opaqueNamespaceId,
  parseJsonBytes,
  pathsOverlap,
  resolveConfinedPath,
  writePrivateFile,
};
