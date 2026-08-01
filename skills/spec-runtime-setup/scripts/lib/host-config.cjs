'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

const {
  compareMcpSection,
  compareMcpSectionExact,
  extractMcpSection,
  removeMcpSection,
  upsertMcpSection,
} = require('./toml-section-editor.cjs');
const { collectRedactionValues, redactText } = require('./process-runner.cjs');
const { processAlive: processIsAlive, sleepSync } = require('./process-utils.cjs');
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
const DEFAULT_JSON_CONTAINER_PATH = Object.freeze(['mcpServers']);
const DEFAULT_SERVER_REPRESENTATION = 'standard';
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

function resolvedHostConfigShape(hostConfig) {
  const jsonContainerPath = Array.isArray(hostConfig && hostConfig.json_container_path)
    && hostConfig.json_container_path.length > 0
    && hostConfig.json_container_path.every((segment) => typeof segment === 'string' && segment.length > 0)
    ? [...hostConfig.json_container_path]
    : [...DEFAULT_JSON_CONTAINER_PATH];
  const serverRepresentation = hostConfig && typeof hostConfig.server_representation === 'string'
    ? hostConfig.server_representation
    : DEFAULT_SERVER_REPRESENTATION;
  return {
    json_container_path: jsonContainerPath,
    server_representation: serverRepresentation,
  };
}

function buildDeclaredServerConfig(entry) {
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

function buildServerConfig(entry) {
  const hostConfig = hostConfigForEntry(entry);
  const declared = buildDeclaredServerConfig(entry);
  if (!hostConfig || !declared) return null;
  const shape = resolvedHostConfigShape(hostConfig);
  if (shape.server_representation === DEFAULT_SERVER_REPRESENTATION) return declared;
  if (shape.server_representation !== 'opencode-local') return null;
  return {
    type: 'local',
    command: [declared.command, ...declared.args],
    ...(isObject(declared.env) && Object.keys(declared.env).length > 0
      ? { environment: clone(declared.env) }
      : {}),
    ...(typeof declared.enabled === 'boolean' ? { enabled: declared.enabled } : {}),
  };
}

function serverEnvironment(server) {
  if (isObject(server && server.env)) return server.env;
  if (isObject(server && server.environment)) return server.environment;
  return {};
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
  if (/\$\{[A-Za-z_][A-Za-z0-9_]*\}/.test(expanded)) return null;
  return path.resolve(path.isAbsolute(expanded) ? expanded : path.join(repoRoot, expanded));
}

function configPathEnvironment(homeDir, env = process.env) {
  return {
    ...env,
    XDG_CONFIG_HOME: typeof env.XDG_CONFIG_HOME === 'string' && env.XDG_CONFIG_HOME.length > 0
      ? env.XDG_CONFIG_HOME
      : path.join(homeDir, '.config'),
  };
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
  if (/^\$\{XDG_CONFIG_HOME\}(?=$|[\\/])/.test(rawPath)) {
    return nearestExistingPath(path.resolve(env.XDG_CONFIG_HOME));
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
  };
  const precedenceGuards = [];
  for (const guard of Array.isArray(target.precedence_guards) ? target.precedence_guards : []) {
    if (!isObject(guard) || typeof guard.config_path !== 'string') {
      return { ok: false, reason_code: 'host-config-precedence-guard-invalid', scope };
    }
    const guardPath = expandConfigPath(guard.config_path, context);
    if (!guardPath || !isPathWithin(guardPath, containmentRoot)) {
      return { ok: false, reason_code: 'host-config-path-escape', scope };
    }
    const guardSymlink = inspectSymlinkPath(guardPath, containmentRoot);
    if (!guardSymlink.ok) return { ...guardSymlink, scope };
    precedenceGuards.push({
      scope,
      config_path: guardPath,
      config_format: guard.config_format || '',
      precedence: Number.isFinite(guard.precedence) ? guard.precedence : resolved.precedence,
      reason_code: guard.reason_code || 'host-config-precedence-blocked',
    });
  }
  resolved.precedence_guards = precedenceGuards;
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
    env: configPathEnvironment(homeDir, options.env || process.env),
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
    ...resolvedHostConfigShape(hostConfig),
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

function jsonValueAtPath(value, containerPath) {
  let current = value;
  for (const segment of containerPath) {
    if (!isObject(current) || !Object.prototype.hasOwnProperty.call(current, segment)) return undefined;
    current = current[segment];
  }
  return current;
}

function ensureJsonObjectAtPath(value, containerPath) {
  let current = value;
  for (const segment of containerPath) {
    if (!isObject(current[segment])) current[segment] = {};
    current = current[segment];
  }
  return current;
}

function parseJsonConfig(text, jsonContainerPath = DEFAULT_JSON_CONTAINER_PATH) {
  const { bom, text: raw } = stripJsonBom(text);
  try {
    const value = raw.trim() === '' ? {} : JSON.parse(raw);
    if (!isObject(value)) return { ok: false, reason_code: 'host-config-json-invalid' };
    const container = jsonValueAtPath(value, jsonContainerPath);
    if (container !== undefined && !isObject(container)) {
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

function normalizeServer(server, representation = DEFAULT_SERVER_REPRESENTATION) {
  if (representation === 'opencode-local') {
    return {
      type: server && server.type,
      command: Array.isArray(server && server.command) ? [...server.command] : server && server.command,
      environment: isObject(server && server.environment) ? clone(server.environment) : undefined,
      enabled: server && server.enabled,
    };
  }
  const result = {};
  for (const field of CONFIG_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(server || {}, field) && server[field] !== undefined) {
      result[field] = server[field];
    }
  }
  if (!Array.isArray(result.args)) result.args = [];
  return result;
}

function serverMatches(actual, expected, representation = DEFAULT_SERVER_REPRESENTATION) {
  return JSON.stringify(normalizeServer(actual, representation))
    === JSON.stringify(normalizeServer(expected, representation));
}

function serverDriftFields(actual, expected, representation = DEFAULT_SERVER_REPRESENTATION) {
  const normalizedActual = normalizeServer(actual, representation);
  const normalizedExpected = normalizeServer(expected, representation);
  const fields = representation === 'opencode-local'
    ? ['type', 'command', 'environment', 'enabled']
    : CONFIG_FIELDS;
  return fields.filter((field) =>
    JSON.stringify(normalizedActual[field]) !== JSON.stringify(normalizedExpected[field])
  );
}

function canonicalComparable(value) {
  if (Array.isArray(value)) return value.map((item) => canonicalComparable(item));
  if (!isObject(value)) return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, canonicalComparable(value[key])]),
  );
}

function exactServerMatches(actual, expected) {
  return JSON.stringify(canonicalComparable(actual)) === JSON.stringify(canonicalComparable(expected));
}

function exactServerDriftFields(actual, expected, representation) {
  const drift = serverDriftFields(actual, expected, representation);
  for (const key of Object.keys(actual || {})) {
    if (!Object.prototype.hasOwnProperty.call(expected || {}, key)) drift.push(`extra:${key}`);
  }
  return [...new Set(drift)];
}

function inspectOneTarget({
  targetRecord,
  key,
  server,
  jsonContainerPath,
  serverRepresentation,
  exactMatch = false,
  jsonDocumentPolicy = null,
  operation = 'upsert',
}) {
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
    const compared = exactMatch
      ? compareMcpSectionExact(text, key, server)
      : compareMcpSection(text, key, server);
    if (!compared.ok) return { ...compared, configured: false, conflict: false };
    return compared.matches
      ? { ok: true, configured: true, conflict: false, reason_code: 'host-config-current' }
      : {
        ok: true,
        configured: false,
        conflict: true,
        reason_code: 'host-config-conflict',
        conflict_fields: compared.drift_fields || [],
      };
  }
  const parsed = parseJsonConfig(text, jsonContainerPath);
  if (!parsed.ok) return { ...parsed, configured: false, conflict: false };
  const policyInspection = jsonDocumentPolicy
    ? jsonDocumentPolicy.inspect(parsed.value, { operation })
    : null;
  if (policyInspection && !policyInspection.ok) {
    return { ...policyInspection, configured: false, conflict: false };
  }
  if (policyInspection && policyInspection.conflict) {
    return policyInspection;
  }
  const container = jsonValueAtPath(parsed.value, jsonContainerPath);
  const actual = container && container[key];
  if (actual === undefined) {
    if (operation === 'remove'
      && policyInspection
      && policyInspection.permission_mutation_required === true) {
      return {
        ...policyInspection,
        ok: true,
        configured: true,
        conflict: false,
        reason_code: policyInspection.reason_code,
      };
    }
    return {
      ...(policyInspection || {}),
      ok: true,
      configured: false,
      conflict: false,
      reason_code: 'host-config-entry-missing',
    };
  }
  const matches = exactMatch
    ? exactServerMatches(actual, server)
    : serverMatches(actual, server, serverRepresentation);
  if (!matches) {
    return {
      ...(policyInspection || {}),
      ok: true,
      configured: false,
      conflict: true,
      reason_code: 'host-config-conflict',
      conflict_fields: exactMatch
        ? exactServerDriftFields(actual, server, serverRepresentation)
        : serverDriftFields(actual, server, serverRepresentation),
    };
  }
  if (policyInspection && !policyInspection.configured) {
    return policyInspection;
  }
  return {
    ...(policyInspection || {}),
    ok: true,
    configured: true,
    conflict: false,
    reason_code: 'host-config-current',
  };
}

function inspectHostConfig({
  entry,
  target,
  exactMatch = false,
  jsonDocumentPolicy = null,
  operation = 'upsert',
} = {}) {
  if (!target || target.ok !== true || target.authority_confirmed !== true) {
    return { ok: false, reason_code: 'host-config-target-unresolved' };
  }
  const key = configKeyForEntry(entry) || target.key;
  const server = buildServerConfig(entry) || target.server;
  const shape = hostConfigForEntry(entry)
    ? resolvedHostConfigShape(hostConfigForEntry(entry))
    : {
      json_container_path: target.json_container_path || [...DEFAULT_JSON_CONTAINER_PATH],
      server_representation: target.server_representation || DEFAULT_SERVER_REPRESENTATION,
    };
  const orderedTargets = Object.values(target.resolved_targets || {})
    .sort((left, right) => right.precedence - left.precedence);
  const blockingGuard = orderedTargets
    .flatMap((candidate) => candidate.precedence_guards || [])
    .filter((guard) => fs.existsSync(guard.config_path) && guard.precedence > target.precedence)
    .sort((left, right) => right.precedence - left.precedence)[0];
  if (blockingGuard) {
    return {
      ok: false,
      configured: false,
      conflict: false,
      reason_code: blockingGuard.reason_code,
      blocking_scope: blockingGuard.scope,
      blocking_path: blockingGuard.config_path,
    };
  }
  let selectedInspection = null;
  for (const candidate of orderedTargets) {
    const inspected = inspectOneTarget({
      targetRecord: candidate,
      key,
      server,
      jsonContainerPath: shape.json_container_path,
      serverRepresentation: shape.server_representation,
      exactMatch,
      jsonDocumentPolicy,
      operation,
    });
    if (candidate.scope === target.scope) selectedInspection = inspected;
    const higherPrecedence = candidate.precedence > target.precedence;
    if (!inspected.ok) {
      return {
        ok: false,
        reason_code: higherPrecedence
          ? 'host-config-higher-precedence-unreadable'
          : inspected.reason_code,
        blocking_scope: candidate.scope,
        blocking_path: candidate.config_path,
        cause_reason_code: inspected.reason_code,
      };
    }
    if (inspected.configured) {
      return {
        ...inspected,
        ok: true,
        configured: true,
        conflict: false,
        reason_code: higherPrecedence
          ? 'host-config-higher-precedence-current'
          : 'host-config-current',
        effective_scope: candidate.scope,
        effective_path: candidate.config_path,
      };
    }
    if (inspected.conflict) {
      return {
        ...inspected,
        ok: higherPrecedence ? false : inspected.ok,
        configured: false,
        conflict: true,
        reason_code: higherPrecedence
          ? 'host-config-higher-precedence-conflict'
          : inspected.reason_code,
        blocking_scope: candidate.scope,
        blocking_path: candidate.config_path,
        conflict_fields: inspected.conflict_fields || [],
      };
    }
  }
  const inspected = selectedInspection || inspectOneTarget({
    targetRecord: {
      scope: target.scope,
      config_path: target.config_path,
      config_format: target.config_format,
      precedence: target.precedence,
    },
    key,
    server,
    jsonContainerPath: shape.json_container_path,
    serverRepresentation: shape.server_representation,
    exactMatch,
    jsonDocumentPolicy,
    operation,
  });
  return {
    ...inspected,
    effective_scope: target.scope,
    effective_path: target.config_path,
  };
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

function renderJsonConfig(parsed, key, server, operation, jsonContainerPath, jsonDocumentPolicy) {
  const value = clone(parsed.value);
  if (operation === 'remove') {
    const container = jsonValueAtPath(value, jsonContainerPath);
    if (isObject(container)) delete container[key];
  } else {
    const container = ensureJsonObjectAtPath(value, jsonContainerPath);
    container[key] = clone(server);
  }
  const policyMutation = jsonDocumentPolicy
    ? jsonDocumentPolicy.mutate(value, { operation })
    : { ok: true, changed: false, value };
  if (!policyMutation.ok) return policyMutation;
  let text = JSON.stringify(policyMutation.value, null, 2);
  if (parsed.eol !== '\n') text = text.replaceAll('\n', parsed.eol);
  return {
    ...policyMutation,
    ok: true,
    text: `${parsed.bom}${text}${parsed.finalNewline || text.length > 0 ? parsed.eol : ''}`,
  };
}

function buildMutationText({
  originalText,
  configFormat,
  key,
  server,
  operation,
  jsonContainerPath,
  jsonDocumentPolicy,
}) {
  if (configFormat === 'json') {
    const parsed = parseJsonConfig(originalText, jsonContainerPath);
    if (!parsed.ok) return parsed;
    return renderJsonConfig(
      parsed,
      key,
      server,
      operation,
      jsonContainerPath,
      jsonDocumentPolicy,
    );
  }
  if (jsonDocumentPolicy) {
    return { ok: false, reason_code: 'host-config-json-document-policy-format-unsupported' };
  }
  return operation === 'remove'
    ? removeMcpSection(originalText, key)
    : upsertMcpSection(originalText, key, server);
}

function verifyTargetText({
  text,
  configFormat,
  key,
  server,
  operation,
  jsonContainerPath,
  serverRepresentation,
  jsonDocumentPolicy,
}) {
  if (configFormat === 'json') {
    const parsed = parseJsonConfig(text, jsonContainerPath);
    if (!parsed.ok) return parsed;
    const container = jsonValueAtPath(parsed.value, jsonContainerPath);
    const actual = container && container[key];
    const verified = operation === 'remove'
      ? actual === undefined
      : serverMatches(actual, server, serverRepresentation);
    if (!verified) return { ok: false, reason_code: 'host-config-post-write-verify-failed' };
    if (jsonDocumentPolicy) {
      const policyInspection = jsonDocumentPolicy.inspect(parsed.value, { operation });
      if (!policyInspection.ok || !policyInspection.configured || policyInspection.conflict) {
        return {
          ...policyInspection,
          ok: false,
          reason_code: policyInspection.reason_code
            || 'host-config-opencode-permission-post-write-verify-failed',
        };
      }
      return {
        ...policyInspection,
        ok: true,
        reason_code: 'host-config-post-write-verified',
      };
    }
    return { ok: true, reason_code: 'host-config-post-write-verified' };
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
  const shape = hostConfigForEntry(entry)
    ? resolvedHostConfigShape(hostConfigForEntry(entry))
    : {
      json_container_path: target.json_container_path || [...DEFAULT_JSON_CONTAINER_PATH],
      server_representation: target.server_representation || DEFAULT_SERVER_REPRESENTATION,
    };
  const secretCheck = containsLiteralSecrets(server);
  const secrets = collectRedactionValues(
    serverEnvironment(server),
    options.redactValues || [],
  );
  if (!secretCheck.ok) {
    return {
      ok: false,
      reason_code: 'host-config-literal-secret-rejected',
      secret_paths: secretCheck.paths,
    };
  }

  const jsonDocumentPolicy = options.jsonDocumentPolicy || null;
  const initial = inspectHostConfig({
    entry,
    target,
    exactMatch: operation === 'remove',
    jsonDocumentPolicy,
    operation,
  });
  if (!initial.ok && initial.reason_code !== 'host-config-conflict') return initial;
  if (operation === 'upsert' && initial.configured) {
    return {
      ...initial,
      ok: true,
      changed: false,
      reason_code: 'host-config-already-current',
      post_write_verified: true,
    };
  }
  if (operation === 'remove' && !initial.configured && !initial.conflict) {
    return { ok: true, changed: false, reason_code: 'host-config-entry-missing', post_write_verified: true };
  }
  if (operation === 'remove' && initial.conflict) {
    return {
      ok: false,
      changed: false,
      reason_code: 'host-config-uninstall-conflict',
      conflict_fields: initial.conflict_fields || [],
    };
  }
  if (operation === 'upsert' && initial.conflict && options.overwrite !== true) {
    return { ...initial, ok: false, changed: false };
  }
  if (operation === 'upsert'
    && initial.conflict
    && String(initial.reason_code || '').startsWith('host-config-opencode-permission-')) {
    return { ...initial, ok: false, changed: false };
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
    const refreshed = inspectHostConfig({
      entry,
      target,
      exactMatch: operation === 'remove',
      jsonDocumentPolicy,
      operation,
    });
    if (!refreshed.ok && refreshed.reason_code !== 'host-config-conflict') return rememberOutcome(refreshed);
    if (operation === 'upsert' && refreshed.configured) {
      return rememberOutcome({
        ...refreshed,
        ok: true,
        changed: false,
        reason_code: 'host-config-already-current',
        post_write_verified: true,
      });
    }
    if (operation === 'upsert' && refreshed.conflict && options.overwrite !== true) {
      return rememberOutcome({ ...refreshed, ok: false, changed: false });
    }
    if (operation === 'upsert'
      && refreshed.conflict
      && String(refreshed.reason_code || '').startsWith('host-config-opencode-permission-')) {
      return rememberOutcome({ ...refreshed, ok: false, changed: false });
    }
    if (operation === 'remove' && refreshed.conflict) {
      return rememberOutcome({
        ok: false,
        changed: false,
        reason_code: 'host-config-uninstall-conflict',
        conflict_fields: refreshed.conflict_fields || [],
      });
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
      jsonContainerPath: shape.json_container_path,
      jsonDocumentPolicy,
    });
    if (!mutation.ok) return rememberOutcome(mutation);
    if (mutation.text === originalText) {
      return rememberOutcome({
        ...mutation,
        ok: true,
        changed: false,
        reason_code: 'host-config-already-current',
        post_write_verified: true,
      });
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
      jsonContainerPath: shape.json_container_path,
      serverRepresentation: shape.server_representation,
      jsonDocumentPolicy,
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
      ...verified,
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
