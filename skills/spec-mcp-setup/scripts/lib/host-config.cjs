'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

const {
  compareMcpSection,
  extractMcpSection,
  removeMcpSection,
  upsertMcpSection,
} = require('./toml-section-editor.cjs');
const { collectRedactionValues, redactText } = require('./process-runner.cjs');
const {
  isPathWithin,
  nearestExistingPath,
  reasonError,
} = require('./path-safety.cjs');
const {
  renderJson,
} = require('./renderer.cjs');

const CONFIG_FIELDS = [
  'command',
  'args',
  'type',
  'env',
  'envFile',
  'cwd',
  'enabled',
  'startup_timeout_sec',
  'startup_timeout_ms',
];
const SECRET_KEY_PATTERN = /(?:token|secret|password|passphrase|api[_-]?key|authorization|credential|private[_-]?key|access[_-]?key)/i;
const ENV_REFERENCE_PATTERN = /^(?:\$\{[A-Za-z_][A-Za-z0-9_]*\}|\$[A-Za-z_][A-Za-z0-9_]*|%[A-Za-z_][A-Za-z0-9_]*%)$/;
const DEFAULT_LOCK_TIMEOUT_MS = 10000;
const DEFAULT_LOCK_STALE_MS = 30000;
const DEFAULT_WINDOWS_REPLACE_RETRY_ATTEMPTS = 10;
const DEFAULT_WINDOWS_REPLACE_RETRY_DELAY_MS = 20;
const WINDOWS_REPLACE_RETRY_CODES = new Set(['EPERM', 'EACCES', 'EBUSY']);
const WINDOWS_REPLACE_FALLBACK_CODES = new Set(['EEXIST', ...WINDOWS_REPLACE_RETRY_CODES]);

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isExplicitAuthority(authority) {
  if (!isObject(authority)) return false;
  if (authority.explicit === true) return true;
  if (authority.status === 'ready' && authority.authority_source === 'MCP_SETUP_HOST') return true;
  return authority.authority_level === 'confirmed'
    && /^(?:runtime-pin|explicit-runtime|host-runtime-pin)$/.test(String(authority.source || ''));
}

function validateAuthority(authority, host) {
  if (!isExplicitAuthority(authority)) {
    return { ok: false, reason_code: 'host-authority-not-explicit' };
  }
  if (authority.host !== host) {
    return { ok: false, reason_code: 'host-authority-mismatch' };
  }
  if (authority.mutation_allowed !== true && authority.mutation_authorized !== true) {
    return { ok: false, reason_code: 'host-authority-mutation-denied' };
  }
  return { ok: true, reason_code: 'host-authority-confirmed' };
}

function hostConfigForEntry(entry) {
  if (!isObject(entry)) return null;
  return isObject(entry.host_config) ? entry.host_config : null;
}

function buildServerConfig(entry) {
  const hostConfig = hostConfigForEntry(entry);
  if (!hostConfig) return null;
  const source = isObject(hostConfig.server) ? hostConfig.server : hostConfig;
  const result = {};
  for (const field of CONFIG_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(source, field) && source[field] !== undefined) {
      result[field] = clone(source[field]);
    }
  }
  if (!Array.isArray(result.args)) result.args = [];
  return typeof result.command === 'string' && result.command.length > 0 ? result : null;
}

function configKeyForEntry(entry) {
  return entry && entry.detection && typeof entry.detection.key === 'string'
    ? entry.detection.key
    : entry && typeof entry.config_key === 'string'
      ? entry.config_key
      : entry && typeof entry.id === 'string'
        ? entry.id
        : '';
}

function expandConfigPath(rawPath, { repoRoot, homeDir, env = process.env }) {
  if (typeof rawPath !== 'string' || rawPath.length === 0) return null;
  let expanded = rawPath
    .replace(/^~(?=$|[\\/])/, homeDir)
    .replace(/\$\{HOME\}|\$HOME/g, homeDir)
    .replace(/\$\{PROJECT_ROOT\}|\$PROJECT_ROOT/g, repoRoot);
  expanded = expanded.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(env, name) ? String(env[name]) : match
  );
  return path.resolve(path.isAbsolute(expanded) ? expanded : path.join(repoRoot, expanded));
}

function inspectSymlinkPath(candidate, root) {
  const rootResolved = fs.realpathSync.native ? fs.realpathSync.native(root) : fs.realpathSync(root);
  const relative = path.relative(root, candidate);
  let current = root;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    let stat;
    try {
      stat = fs.lstatSync(current);
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    if (stat.isSymbolicLink()) {
      return { ok: false, reason_code: 'host-config-symlink-rejected', path: current };
    }
  }
  const ancestor = nearestExistingPath(candidate);
  const ancestorReal = fs.realpathSync.native ? fs.realpathSync.native(ancestor) : fs.realpathSync(ancestor);
  if (!isPathWithin(ancestorReal, rootResolved)) {
    return { ok: false, reason_code: 'host-config-path-escape' };
  }
  return { ok: true, canonical_root: rootResolved };
}

function containmentRootForTarget(rawPath, scope, target, { repoRoot, homeDir, env }) {
  if (target && typeof target.containment_root === 'string') {
    return expandConfigPath(target.containment_root, { repoRoot, homeDir, env });
  }
  if (/^(?:~|\$HOME|\$\{HOME\})/.test(rawPath) || scope === 'user') {
    return path.resolve(homeDir);
  }
  if (path.isAbsolute(rawPath)) return path.parse(path.resolve(rawPath)).root;
  return path.resolve(repoRoot);
}

function targetRequiresUserScope(target) {
  return target.requires_user_scope === true || target.requires_user_scope_opt_in === true;
}

function targetIsWritable(configPath, writableCheck) {
  try {
    if (writableCheck === 'file-only') {
      if (!fs.existsSync(configPath)) return false;
      fs.accessSync(configPath, fs.constants.W_OK);
      return true;
    }
    const candidate = fs.existsSync(configPath) ? configPath : nearestExistingPath(path.dirname(configPath));
    fs.accessSync(candidate, fs.constants.W_OK);
    return true;
  } catch (_error) {
    return false;
  }
}

function resolveTargetRecord(scope, target, context) {
  if (!isObject(target) || typeof target.config_path !== 'string') {
    return { ok: false, reason_code: 'host-config-target-invalid', scope };
  }
  const configPath = expandConfigPath(target.config_path, context);
  const containmentRoot = containmentRootForTarget(
    target.config_path,
    scope,
    target,
    context,
  );
  if (!configPath || !containmentRoot || !isPathWithin(configPath, containmentRoot)) {
    return { ok: false, reason_code: 'host-config-path-escape', scope };
  }
  if (!fs.existsSync(containmentRoot)) {
    return { ok: false, reason_code: 'host-config-containment-root-missing', scope };
  }
  const symlink = inspectSymlinkPath(configPath, containmentRoot);
  if (!symlink.ok) return { ...symlink, scope };
  const resolved = {
    ok: true,
    scope,
    config_path: configPath,
    config_format: target.config_format || context.defaultFormat || '',
    precedence: Number.isFinite(target.precedence) ? target.precedence : 0,
    writable_check: target.writable_check || 'parent-or-file',
    requires_user_scope: targetRequiresUserScope(target),
    containment_root: containmentRoot,
    canonical_root: symlink.canonical_root,
    exists: fs.existsSync(configPath),
  };
  if (context.requireWritable !== false && !targetIsWritable(configPath, resolved.writable_check)) {
    return { ok: false, reason_code: 'host-config-target-not-writable', scope };
  }
  return resolved;
}

function resolveHostConfigTarget(options = {}) {
  const entry = options.entry;
  const host = options.host;
  const authorityResult = validateAuthority(options.authority, host);
  if (!authorityResult.ok) return authorityResult;
  const hostConfig = hostConfigForEntry(entry);
  const server = buildServerConfig(entry);
  const key = configKeyForEntry(entry);
  if (!hostConfig || !server || !key || !isObject(hostConfig.targets)) {
    return { ok: false, reason_code: 'host-config-entry-invalid' };
  }
  const repoRoot = path.resolve(options.repoRoot || process.cwd());
  const homeDir = path.resolve(options.homeDir || os.homedir());
  const context = {
    repoRoot,
    homeDir,
    env: options.env || process.env,
    defaultFormat: hostConfig.config_format || '',
    requireWritable: options.requireWritable !== false,
  };
  const requestedScope = options.scope
    || options.authority.scope
    || (options.userScope === true && hostConfig.targets.user ? 'user' : null);
  const fallbackOrder = Array.isArray(hostConfig.fallback_order)
    ? hostConfig.fallback_order
    : Object.keys(hostConfig.targets);
  const scopes = requestedScope ? [requestedScope] : fallbackOrder;
  let selected = null;
  for (const scope of scopes) {
    const target = hostConfig.targets[scope];
    if (!target) {
      if (requestedScope) return { ok: false, reason_code: 'host-config-scope-unknown', scope };
      continue;
    }
    if (targetRequiresUserScope(target) && options.userScope !== true) {
      if (requestedScope) {
        return { ok: false, reason_code: 'host-user-scope-not-authorized', scope };
      }
      continue;
    }
    const resolved = resolveTargetRecord(scope, target, context);
    if (!resolved.ok) {
      if (requestedScope) return resolved;
      continue;
    }
    selected = resolved;
    break;
  }
  if (!selected) return { ok: false, reason_code: 'host-config-target-unavailable' };

  const resolvedTargets = {};
  for (const [scope, target] of Object.entries(hostConfig.targets)) {
    const resolved = resolveTargetRecord(scope, target, { ...context, requireWritable: false });
    if (!resolved.ok) {
      if (scope === selected.scope) return resolved;
      continue;
    }
    resolvedTargets[scope] = resolved;
  }
  const configFormat = selected.config_format || (host === 'codex' ? 'toml' : 'json');
  if (!['json', 'toml'].includes(configFormat)) {
    return { ok: false, reason_code: 'host-config-format-unsupported' };
  }
  return {
    ok: true,
    reason_code: 'host-config-target-resolved',
    host,
    platform: options.platform || process.platform,
    scope: selected.scope,
    config_path: selected.config_path,
    config_format: configFormat,
    precedence: selected.precedence,
    containment_root: selected.containment_root,
    resolved_targets: resolvedTargets,
    key,
    server,
    authority_confirmed: true,
  };
}

function secretFindings(value, currentPath = '$', findings = []) {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const item = value[index];
      if (typeof item === 'string') {
        if (/--?(?:token|secret|password|api[_-]?key|credential)(?:=|$)/i.test(item)) {
          const next = value[index + 1];
          const inline = item.includes('=') ? item.slice(item.indexOf('=') + 1) : next;
          if (typeof inline === 'string' && !ENV_REFERENCE_PATTERN.test(inline)) {
            findings.push(`${currentPath}[${index}]`);
          }
        }
        if (/\b(?:https?|ssh):\/\/[^\s:/@]+:[^\s/@]+@/i.test(item)) findings.push(`${currentPath}[${index}]`);
      } else {
        secretFindings(item, `${currentPath}[${index}]`, findings);
      }
    }
    return findings;
  }
  if (!isObject(value)) return findings;
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${currentPath}.${key}`;
    if (SECRET_KEY_PATTERN.test(key) && typeof child === 'string' && !ENV_REFERENCE_PATTERN.test(child)) {
      findings.push(childPath);
      continue;
    }
    secretFindings(child, childPath, findings);
  }
  return findings;
}

function containsLiteralSecrets(value) {
  const paths = secretFindings(value);
  return { ok: paths.length === 0, paths };
}

function stripJsonBom(text) {
  return text.startsWith('\uFEFF') ? { bom: '\uFEFF', text: text.slice(1) } : { bom: '', text };
}

function parseJsonConfig(text) {
  const { bom, text: raw } = stripJsonBom(text);
  try {
    const value = raw.trim() === '' ? {} : JSON.parse(raw);
    if (!isObject(value)) return { ok: false, reason_code: 'host-config-json-invalid' };
    if (value.mcpServers !== undefined && !isObject(value.mcpServers)) {
      return { ok: false, reason_code: 'host-config-json-invalid' };
    }
    return {
      ok: true,
      value,
      bom,
      eol: /\r\n/.test(text) ? '\r\n' : '\n',
      finalNewline: /(?:\r\n|\n)$/.test(text),
    };
  } catch (_error) {
    return { ok: false, reason_code: 'host-config-json-invalid' };
  }
}

function normalizeServer(server) {
  const result = {};
  for (const field of CONFIG_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(server || {}, field) && server[field] !== undefined) {
      result[field] = server[field];
    }
  }
  if (!Array.isArray(result.args)) result.args = [];
  return result;
}

function serverMatches(actual, expected) {
  return JSON.stringify(normalizeServer(actual)) === JSON.stringify(normalizeServer(expected));
}

function inspectOneTarget({ targetRecord, key, server }) {
  if (!fs.existsSync(targetRecord.config_path)) {
    return { ok: true, configured: false, conflict: false, reason_code: 'host-config-missing' };
  }
  let text;
  try {
    text = fs.readFileSync(targetRecord.config_path, 'utf8');
  } catch (_error) {
    return { ok: false, configured: false, conflict: false, reason_code: 'host-config-unreadable' };
  }
  if (targetRecord.config_format === 'toml') {
    const extracted = extractMcpSection(text, key);
    if (!extracted.ok) return { ...extracted, configured: false, conflict: false };
    if (!extracted.found) {
      return { ok: true, configured: false, conflict: false, reason_code: 'host-config-entry-missing' };
    }
    const compared = compareMcpSection(text, key, server);
    if (!compared.ok) return { ...compared, configured: false, conflict: false };
    return compared.matches
      ? { ok: true, configured: true, conflict: false, reason_code: 'host-config-current' }
      : { ok: true, configured: false, conflict: true, reason_code: 'host-config-conflict' };
  }
  const parsed = parseJsonConfig(text);
  if (!parsed.ok) return { ...parsed, configured: false, conflict: false };
  const actual = parsed.value.mcpServers && parsed.value.mcpServers[key];
  if (actual === undefined) {
    return { ok: true, configured: false, conflict: false, reason_code: 'host-config-entry-missing' };
  }
  return serverMatches(actual, server)
    ? { ok: true, configured: true, conflict: false, reason_code: 'host-config-current' }
    : { ok: true, configured: false, conflict: true, reason_code: 'host-config-conflict' };
}

function inspectHostConfig({ entry, target } = {}) {
  if (!target || target.ok !== true || target.authority_confirmed !== true) {
    return { ok: false, reason_code: 'host-config-target-unresolved' };
  }
  const key = configKeyForEntry(entry) || target.key;
  const server = buildServerConfig(entry) || target.server;
  const higherTargets = Object.values(target.resolved_targets || {})
    .filter((candidate) => candidate.scope !== target.scope && candidate.precedence > target.precedence)
    .sort((left, right) => right.precedence - left.precedence);
  for (const candidate of higherTargets) {
    const inspected = inspectOneTarget({ targetRecord: candidate, key, server });
    if (!inspected.ok) {
      return {
        ok: false,
        reason_code: 'host-config-higher-precedence-unreadable',
        blocking_scope: candidate.scope,
        blocking_path: candidate.config_path,
        cause_reason_code: inspected.reason_code,
      };
    }
    if (inspected.configured) {
      return {
        ok: true,
        configured: true,
        conflict: false,
        reason_code: 'host-config-higher-precedence-current',
        effective_scope: candidate.scope,
        effective_path: candidate.config_path,
      };
    }
    if (inspected.conflict) {
      return {
        ok: false,
        configured: false,
        conflict: true,
        reason_code: 'host-config-higher-precedence-conflict',
        blocking_scope: candidate.scope,
        blocking_path: candidate.config_path,
      };
    }
  }
  const selected = {
    scope: target.scope,
    config_path: target.config_path,
    config_format: target.config_format,
    precedence: target.precedence,
  };
  const inspected = inspectOneTarget({ targetRecord: selected, key, server });
  return {
    ...inspected,
    effective_scope: target.scope,
    effective_path: target.config_path,
  };
}

function sleepSync(milliseconds) {
  if (milliseconds <= 0) return;
  const view = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(view, 0, 0, milliseconds);
}

function processIsAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
}

function readLockOwner(lockPath) {
  const ownerPath = path.join(lockPath, 'owner.json');
  try {
    return JSON.parse(fs.readFileSync(ownerPath, 'utf8'));
  } catch (_error) {
    return null;
  }
}

function readLockSnapshot(lockPath) {
  try {
    const stat = fs.lstatSync(lockPath);
    return {
      owner: readLockOwner(lockPath),
      stat: {
        dev: stat.dev,
        ino: stat.ino,
        mtime_ms: stat.mtimeMs,
        size: stat.size,
      },
    };
  } catch (_error) {
    return null;
  }
}

function lockOwnerFingerprint(owner) {
  if (!owner || typeof owner !== 'object') return null;
  return JSON.stringify({
    pid: owner.pid || null,
    hostname: owner.hostname || null,
    token: owner.token || null,
    created_at: owner.created_at || null,
    target: owner.target || null,
  });
}

function lockSnapshotsMatch(expected, actual) {
  return Boolean(expected && actual)
    && lockOwnerFingerprint(expected.owner) === lockOwnerFingerprint(actual.owner)
    && expected.stat.dev === actual.stat.dev
    && expected.stat.ino === actual.stat.ino
    && expected.stat.mtime_ms === actual.stat.mtime_ms
    && expected.stat.size === actual.stat.size;
}

function lockSnapshotIsStale(snapshot, staleMs, now) {
  if (!snapshot) return false;
  const owner = snapshot.owner;
  let createdAt = owner && Date.parse(owner.created_at);
  if (!Number.isFinite(createdAt)) {
    createdAt = snapshot.stat.mtime_ms;
  }
  return now - createdAt > staleMs && !(owner && processIsAlive(owner.pid));
}

function quarantineStaleLock({ lockPath, snapshot, token, options }) {
  const quarantinePath = `${lockPath}.quarantine.${process.pid}.${token}`;
  const rename = typeof options.staleRename === 'function' ? options.staleRename : fs.renameSync;
  const remove = typeof options.staleRemove === 'function' ? options.staleRemove : fs.rmSync;
  try {
    rename(lockPath, quarantinePath);
  } catch (error) {
    if (error && error.code === 'ENOENT') return { status: 'contended' };
    return {
      status: 'failed',
      reason_code: 'host-config-stale-lock-quarantine-failed',
      quarantine_path: quarantinePath,
      error: safeError(error, []),
    };
  }

  const quarantined = readLockSnapshot(quarantinePath);
  if (!lockSnapshotsMatch(snapshot, quarantined)) {
    try {
      if (fs.existsSync(lockPath)) {
        return {
          status: 'failed',
          reason_code: 'host-config-stale-lock-owner-mismatch',
          quarantine_path: quarantinePath,
        };
      }
      rename(quarantinePath, lockPath);
      return { status: 'contended' };
    } catch (error) {
      return {
        status: 'failed',
        reason_code: 'host-config-stale-lock-restore-failed',
        quarantine_path: quarantinePath,
        error: safeError(error, []),
      };
    }
  }

  try {
    remove(quarantinePath, { recursive: true, force: true });
    return { status: 'recovered' };
  } catch (error) {
    return {
      status: 'failed',
      reason_code: 'host-config-stale-lock-quarantine-cleanup-failed',
      quarantine_path: quarantinePath,
      error: safeError(error, []),
    };
  }
}

function acquireConfigLock(options = {}) {
  const configPath = options.configPath;
  if (typeof configPath !== 'string' || configPath.length === 0) {
    return { ok: false, reason_code: 'host-config-lock-target-invalid' };
  }
  const timeoutMs = Number.isFinite(options.timeoutMs) ? Math.max(0, options.timeoutMs) : DEFAULT_LOCK_TIMEOUT_MS;
  const staleMs = Number.isFinite(options.staleMs) ? Math.max(0, options.staleMs) : DEFAULT_LOCK_STALE_MS;
  const intervalMs = Number.isFinite(options.intervalMs) ? Math.max(1, options.intervalMs) : 10;
  const nowFn = typeof options.now === 'function' ? options.now : Date.now;
  const lockPath = `${configPath}.spec-first.lock`;
  const token = crypto.randomBytes(12).toString('hex');
  const startedAt = nowFn();
  let staleRecovered = false;
  while (true) {
    try {
      fs.mkdirSync(lockPath, { mode: 0o700 });
      const owner = {
        pid: process.pid,
        hostname: os.hostname(),
        token,
        created_at: new Date(nowFn()).toISOString(),
        target: configPath,
      };
      fs.writeFileSync(path.join(lockPath, 'owner.json'), renderJson(owner), {
        encoding: 'utf8',
        flag: 'wx',
        mode: 0o600,
      });
      let releaseResult = null;
      const releaseRemove = typeof options.releaseRemove === 'function'
        ? options.releaseRemove
        : fs.rmSync;
      return {
        ok: true,
        reason_code: staleRecovered ? 'host-config-stale-lock-recovered' : 'host-config-lock-acquired',
        lock_path: lockPath,
        owner,
        stale_lock_recovered: staleRecovered,
        assertOwned(stage) {
          const current = readLockOwner(lockPath);
          if (current && current.token === token && current.pid === process.pid) return current;
          throw reasonError(
            'host-config-lock-ownership-lost',
            `主机配置事务在 ${stage} 阶段失去锁所有权。`,
            { lock_path: lockPath, lock_stage: stage },
          );
        },
        release() {
          if (releaseResult && releaseResult.status !== 'failed') return releaseResult;
          const current = readLockOwner(lockPath);
          if (!current || current.token !== token || current.pid !== process.pid) {
            releaseResult = {
              status: 'skipped',
              reason_code: 'host-config-lock-owner-changed',
              lock_path: lockPath,
            };
            return releaseResult;
          }
          try {
            releaseRemove(lockPath, { recursive: true, force: true });
            releaseResult = {
              status: 'released',
              reason_code: 'host-config-lock-released',
              lock_path: lockPath,
            };
          } catch (error) {
            releaseResult = {
              status: 'failed',
              reason_code: 'host-config-lock-release-failed',
              lock_path: lockPath,
              error: safeError(error, []),
            };
          }
          return releaseResult;
        },
      };
    } catch (error) {
      if (error.code !== 'EEXIST') {
        try { fs.rmSync(lockPath, { recursive: true, force: true }); } catch (_ignored) { /* 尽力清理 */ }
        return { ok: false, reason_code: 'host-config-lock-create-failed', error: safeError(error, []) };
      }
      let now = nowFn();
      const staleSnapshot = readLockSnapshot(lockPath);
      if (lockSnapshotIsStale(staleSnapshot, staleMs, now)) {
        invokeFault(options.faultInjector, 'after-stale-lock-inspection', { lockPath, snapshot: staleSnapshot });
        const recovery = quarantineStaleLock({ lockPath, snapshot: staleSnapshot, token, options });
        if (recovery.status === 'recovered') {
          staleRecovered = true;
          continue;
        }
        if (recovery.status === 'failed') return { ok: false, ...recovery };
        now = nowFn();
      }
      if (now - startedAt >= timeoutMs) {
        return { ok: false, reason_code: 'host-config-lock-timeout', lock_path: lockPath };
      }
      (options.sleep || sleepSync)(Math.min(intervalMs, Math.max(1, timeoutMs - (now - startedAt))));
    }
  }
}

function managedSiblingPath(configPath, suffix, token) {
  return path.join(
    path.dirname(configPath),
    `.${path.basename(configPath)}.spec-first.${process.pid}.${token}.${suffix}`,
  );
}

function validateContainedMutationPath(candidate, target) {
  const root = target && target.containment_root;
  if (!root || !isPathWithin(candidate, root) || !fs.existsSync(root)) {
    return { ok: false, reason_code: 'host-config-path-escape' };
  }
  const inspected = inspectSymlinkPath(candidate, root);
  if (!inspected.ok) return inspected;
  if (target.canonical_root && inspected.canonical_root !== target.canonical_root) {
    return { ok: false, reason_code: 'host-config-path-escape' };
  }
  return inspected;
}

function assertContainedMutationPath(candidate, target) {
  const validation = validateContainedMutationPath(candidate, target);
  if (validation.ok) return;
  throw reasonError(validation.reason_code, `host config mutation 路径不安全：${candidate}`);
}

function writeOwnedFile(filePath, content, mode) {
  const descriptor = fs.openSync(filePath, 'wx', mode);
  try {
    fs.writeFileSync(descriptor, content);
    fs.fsyncSync(descriptor);
  } finally {
    fs.closeSync(descriptor);
  }
  fs.chmodSync(filePath, mode);
}

function replaceRetryOptions(options = {}) {
  const attempts = Number.isInteger(options.retryAttempts)
    ? Math.min(100, Math.max(1, options.retryAttempts))
    : DEFAULT_WINDOWS_REPLACE_RETRY_ATTEMPTS;
  const delayMs = Number.isFinite(options.retryDelayMs)
    ? Math.min(1000, Math.max(0, options.retryDelayMs))
    : DEFAULT_WINDOWS_REPLACE_RETRY_DELAY_MS;
  return {
    platform: options.platform || process.platform,
    attempts,
    delayMs,
    sleep: typeof options.sleep === 'function' ? options.sleep : sleepSync,
    renameSync: typeof options.renameSync === 'function' ? options.renameSync : fs.renameSync,
  };
}

function renameWithWindowsRetry(sourcePath, destinationPath, options = {}, stage = 'replace') {
  const retry = replaceRetryOptions(options);
  const maxAttempts = retry.platform === 'win32' ? retry.attempts : 1;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      retry.renameSync(sourcePath, destinationPath, { stage, attempt });
      return { attempts: attempt };
    } catch (error) {
      if (retry.platform !== 'win32'
        || !WINDOWS_REPLACE_RETRY_CODES.has(error && error.code)
        || attempt >= maxAttempts) {
        throw error;
      }
      retry.sleep(retry.delayMs);
    }
  }
  throw new Error(`主机配置重命名重试进入不可达状态：${stage}`);
}

function replaceFile(tempPath, configPath, originalExists, token, options = {}) {
  const retry = replaceRetryOptions(options);
  try {
    renameWithWindowsRetry(tempPath, configPath, options, 'direct-replace');
    return { strategy: 'direct' };
  } catch (error) {
    if (retry.platform !== 'win32' || !originalExists || !WINDOWS_REPLACE_FALLBACK_CODES.has(error.code)) {
      throw error;
    }
  }
  const displaced = managedSiblingPath(configPath, 'replace-old', token);
  renameWithWindowsRetry(configPath, displaced, options, 'displace-original');
  try {
    renameWithWindowsRetry(tempPath, configPath, options, 'install-replacement');
    fs.rmSync(displaced, { force: true });
    return { strategy: 'displaced-original' };
  } catch (error) {
    try {
      if (fs.existsSync(configPath)) fs.rmSync(configPath, { force: true });
      renameWithWindowsRetry(displaced, configPath, options, 'restore-displaced-original');
    } catch (_ignored) {
      // 调用方的 backup restore 是最终恢复路径。
    }
    throw error;
  }
}

function renderJsonConfig(parsed, key, server, operation) {
  const value = clone(parsed.value);
  if (!isObject(value.mcpServers)) value.mcpServers = {};
  if (operation === 'remove') delete value.mcpServers[key];
  else value.mcpServers[key] = clone(server);
  let text = JSON.stringify(value, null, 2);
  if (parsed.eol !== '\n') text = text.replaceAll('\n', parsed.eol);
  return `${parsed.bom}${text}${parsed.finalNewline || text.length > 0 ? parsed.eol : ''}`;
}

function buildMutationText({ originalText, configFormat, key, server, operation }) {
  if (configFormat === 'json') {
    const parsed = parseJsonConfig(originalText);
    if (!parsed.ok) return parsed;
    return { ok: true, text: renderJsonConfig(parsed, key, server, operation) };
  }
  return operation === 'remove'
    ? removeMcpSection(originalText, key)
    : upsertMcpSection(originalText, key, server);
}

function verifyTargetText({ text, configFormat, key, server, operation }) {
  if (configFormat === 'json') {
    const parsed = parseJsonConfig(text);
    if (!parsed.ok) return parsed;
    const actual = parsed.value.mcpServers && parsed.value.mcpServers[key];
    const verified = operation === 'remove' ? actual === undefined : serverMatches(actual, server);
    return {
      ok: verified,
      reason_code: verified ? 'host-config-post-write-verified' : 'host-config-post-write-verify-failed',
    };
  }
  if (operation === 'remove') {
    const extracted = extractMcpSection(text, key);
    return extracted.ok && !extracted.found
      ? { ok: true, reason_code: 'host-config-post-write-verified' }
      : { ok: false, reason_code: extracted.reason_code || 'host-config-post-write-verify-failed' };
  }
  const compared = compareMcpSection(text, key, server);
  return compared.ok && compared.matches
    ? { ok: true, reason_code: 'host-config-post-write-verified' }
    : { ok: false, reason_code: compared.reason_code || 'host-config-post-write-verify-failed' };
}

function invokeFault(faultInjector, stage, context = {}) {
  if (typeof faultInjector === 'function') faultInjector(stage, context);
}

function safeError(error, secrets) {
  return {
    name: redactText(error && error.name ? error.name : 'Error', secrets),
    code: error && error.code ? error.code : null,
    message: redactText(error && error.message ? error.message : String(error), secrets),
  };
}

function restoreOriginal({
  configPath,
  target,
  originalExists,
  originalBytes,
  originalMode,
  token,
  faultInjector,
  replace,
  lock,
}) {
  invokeFault(faultInjector, 'before-restore', { configPath });
  lock.assertOwned('before-restore');
  assertContainedMutationPath(configPath, target);
  if (!originalExists) {
    fs.rmSync(configPath, { force: true });
    invokeFault(faultInjector, 'after-restore', { configPath });
    return { status: 'restored' };
  }
  const restoreTemp = managedSiblingPath(configPath, 'restore.tmp', token);
  try {
    assertContainedMutationPath(restoreTemp, target);
    writeOwnedFile(restoreTemp, originalBytes, originalMode);
    assertContainedMutationPath(configPath, target);
    assertContainedMutationPath(restoreTemp, target);
    replaceFile(restoreTemp, configPath, fs.existsSync(configPath), token, replace);
    assertContainedMutationPath(configPath, target);
    fs.chmodSync(configPath, originalMode);
    invokeFault(faultInjector, 'after-restore', { configPath });
    return { status: 'restored' };
  } finally {
    if (fs.existsSync(restoreTemp)) fs.rmSync(restoreTemp, { force: true });
  }
}

function applyHostConfig(options = {}) {
  const entry = options.entry;
  const target = options.target;
  const operation = options.operation === 'remove' ? 'remove' : 'upsert';
  if (!target || target.ok !== true || target.authority_confirmed !== true) {
    return { ok: false, reason_code: 'host-config-target-unresolved' };
  }
  const key = configKeyForEntry(entry) || target.key;
  const server = buildServerConfig(entry) || target.server;
  if (!key || !server) return { ok: false, reason_code: 'host-config-entry-invalid' };
  const secretCheck = containsLiteralSecrets(server);
  const secrets = collectRedactionValues(
    isObject(server.env) ? server.env : {},
    options.redactValues || [],
  );
  if (!secretCheck.ok) {
    return {
      ok: false,
      reason_code: 'host-config-literal-secret-rejected',
      secret_paths: secretCheck.paths,
    };
  }

  const initial = inspectHostConfig({ entry, target });
  if (!initial.ok && initial.reason_code !== 'host-config-conflict') return initial;
  if (operation === 'upsert' && initial.configured) {
    return { ok: true, changed: false, reason_code: 'host-config-already-current', post_write_verified: true };
  }
  if (operation === 'remove' && !initial.configured && !initial.conflict) {
    return { ok: true, changed: false, reason_code: 'host-config-entry-missing', post_write_verified: true };
  }
  if (operation === 'upsert' && initial.conflict && options.overwrite !== true) {
    return { ok: false, reason_code: 'host-config-conflict' };
  }

  const configDir = path.dirname(target.config_path);
  const initialContainment = validateContainedMutationPath(target.config_path, target);
  if (!initialContainment.ok) return initialContainment;
  try {
    fs.mkdirSync(configDir, { recursive: true, mode: 0o700 });
  } catch (error) {
    return { ok: false, reason_code: 'host-config-directory-create-failed', error: safeError(error, secrets) };
  }
  const createdContainment = validateContainedMutationPath(target.config_path, target);
  if (!createdContainment.ok) return createdContainment;
  const lock = acquireConfigLock({
    configPath: target.config_path,
    ...(options.lock || {}),
  });
  if (!lock.ok) return lock;

  const token = crypto.randomBytes(8).toString('hex');
  const tempPath = managedSiblingPath(target.config_path, 'write.tmp', token);
  const backupPath = managedSiblingPath(target.config_path, 'backup', token);
  const originalExists = fs.existsSync(target.config_path);
  let originalBytes = Buffer.alloc(0);
  let originalMode = 0o600;
  let replaced = false;
  let preserveBackup = false;
  let transactionOutcome = null;
  const rememberOutcome = (outcome) => {
    transactionOutcome = outcome;
    return outcome;
  };
  try {
    assertContainedMutationPath(target.config_path, target);
    const refreshed = inspectHostConfig({ entry, target });
    if (!refreshed.ok && refreshed.reason_code !== 'host-config-conflict') return rememberOutcome(refreshed);
    if (operation === 'upsert' && refreshed.configured) {
      return rememberOutcome({ ok: true, changed: false, reason_code: 'host-config-already-current', post_write_verified: true });
    }
    if (operation === 'upsert' && refreshed.conflict && options.overwrite !== true) {
      return rememberOutcome({ ok: false, reason_code: 'host-config-conflict' });
    }

    if (originalExists) {
      originalBytes = fs.readFileSync(target.config_path);
      originalMode = fs.statSync(target.config_path).mode & 0o777;
      writeOwnedFile(backupPath, originalBytes, 0o600);
    }
    const originalText = originalExists ? originalBytes.toString('utf8') : '';
    const mutation = buildMutationText({
      originalText,
      configFormat: target.config_format,
      key,
      server,
      operation,
    });
    if (!mutation.ok) return rememberOutcome(mutation);
    if (mutation.text === originalText) {
      return rememberOutcome({ ok: true, changed: false, reason_code: 'host-config-already-current', post_write_verified: true });
    }

    invokeFault(options.faultInjector, 'before-write-temp', { configPath: target.config_path });
    assertContainedMutationPath(tempPath, target);
    writeOwnedFile(tempPath, mutation.text, originalMode);
    invokeFault(options.faultInjector, 'after-write-temp', { configPath: target.config_path, tempPath });
    invokeFault(options.faultInjector, 'before-replace', { configPath: target.config_path, tempPath });
    lock.assertOwned('before-replace');
    assertContainedMutationPath(target.config_path, target);
    assertContainedMutationPath(tempPath, target);
    replaceFile(tempPath, target.config_path, originalExists, token, options.replace);
    replaced = true;
    assertContainedMutationPath(target.config_path, target);
    fs.chmodSync(target.config_path, originalMode);
    invokeFault(options.faultInjector, 'after-replace', { configPath: target.config_path });
    invokeFault(options.faultInjector, 'before-post-verify', { configPath: target.config_path });
    assertContainedMutationPath(target.config_path, target);
    const verified = verifyTargetText({
      text: fs.readFileSync(target.config_path, 'utf8'),
      configFormat: target.config_format,
      key,
      server,
      operation,
    });
    if (!verified.ok) {
      const error = new Error(verified.reason_code || '写入后验证失败');
      error.code = 'POST_WRITE_VERIFY_FAILED';
      throw error;
    }
    invokeFault(options.faultInjector, 'before-commit', { configPath: target.config_path });
    lock.assertOwned('before-commit');
    if (fs.existsSync(backupPath)) fs.rmSync(backupPath, { force: true });
    return rememberOutcome({
      ok: true,
      changed: true,
      reason_code: operation === 'remove' ? 'host-config-removed' : 'host-config-updated',
      config_path: target.config_path,
      scope: target.scope,
      post_write_verified: true,
      stale_lock_recovered: lock.stale_lock_recovered,
    });
  } catch (error) {
    let restore = { status: 'not-required' };
    if (replaced) {
      try {
        restore = restoreOriginal({
          configPath: target.config_path,
          target,
          originalExists,
          originalBytes,
          originalMode,
          token,
          faultInjector: options.faultInjector,
          replace: options.replace,
          lock,
        });
      } catch (restoreError) {
        const retainedBackupPath = originalExists && fs.existsSync(backupPath) ? backupPath : null;
        preserveBackup = Boolean(retainedBackupPath);
        const recovery = {
          status: 'manual-required',
          next_action: retainedBackupPath
            ? `解决文件系统错误后，将 ${retainedBackupPath} 恢复到 ${target.config_path}。`
            : `检查 ${target.config_path}；原始宿主配置备份未能保留。`,
        };
        restore = {
          status: 'failed',
          error: safeError(restoreError, secrets),
          backup_path: retainedBackupPath,
          recovery,
        };
        return rememberOutcome({
          ok: false,
          changed: true,
          reason_code: 'host-config-restore-failed',
          restore,
          backup_path: retainedBackupPath,
          recovery,
          error: safeError(error, secrets),
        });
      }
    }
    return rememberOutcome({
      ok: false,
      changed: false,
      reason_code: error.reason_code || 'host-config-write-failed',
      restore,
      error: safeError(error, secrets),
    });
  } finally {
    const cleanupPaths = preserveBackup ? [tempPath] : [tempPath, backupPath];
    for (const managedPath of cleanupPaths) {
      if (managedPath.includes(`.spec-first.${process.pid}.`) && fs.existsSync(managedPath)) {
        try { fs.rmSync(managedPath, { force: true }); } catch (_ignored) { /* 尽力清理 */ }
      }
    }
    let release;
    try {
      release = lock.release();
    } catch (error) {
      release = {
        status: 'failed',
        reason_code: 'host-config-lock-release-failed',
        lock_path: lock.lock_path,
        error: safeError(error, secrets),
      };
    }
    if (transactionOutcome) {
      transactionOutcome.lock_release_status = release && release.status ? release.status : 'unknown';
      transactionOutcome.lock_release_reason_code = release && release.reason_code
        ? release.reason_code
        : 'host-config-lock-release-status-unknown';
      if (release && release.status === 'failed') {
        transactionOutcome.lock_path = release.lock_path || lock.lock_path;
        transactionOutcome.lock_release_error = release.error || null;
        transactionOutcome.lock_release_next_action = `确认没有活跃的宿主配置写入者持有该锁后，删除 ${transactionOutcome.lock_path}。`;
      }
    }
  }
}

module.exports = {
  acquireConfigLock,
  applyHostConfig,
  inspectHostConfig,
  resolveHostConfigTarget,
};
