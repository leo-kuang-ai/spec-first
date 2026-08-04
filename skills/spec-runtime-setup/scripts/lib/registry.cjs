'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REGISTRY_FILE = 'setup-registry.json';
const SCHEMA_FILE = 'setup-registry.schema.json';
const REGISTRY_SCHEMA_VERSION = 'setup-registry.v9';
const HOST_IDS = Object.freeze(['claude', 'codex', 'cursor', 'kiro', 'opencode', 'qoder']);
const PLATFORM_IDS = Object.freeze(['macos', 'linux', 'wsl', 'windows']);
const KIND_COLLECTIONS = Object.freeze({
  tool: 'tools',
  helper: 'helpers',
  provider: 'providers',
});

class RegistryError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'RegistryError';
    this.code = code;
    this.details = details;
  }
}

class SchemaValidationError extends Error {
  constructor(location, message) {
    super(`${location}: ${message}`);
    this.name = 'SchemaValidationError';
    this.location = location;
  }
}

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function cloneValue(value) {
  if (Array.isArray(value)) return value.map((item) => cloneValue(item));
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cloneValue(item)]),
    );
  }
  return value;
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map((item) => canonicalize(item));
  if (!isPlainObject(value)) return value;
  const result = {};
  for (const key of Object.keys(value).sort()) {
    if (value[key] !== undefined) result[key] = canonicalize(value[key]);
  }
  return result;
}

function registryPathToString(parts) {
  return parts.join('.');
}

function isSchemaDeclaredNullablePath(parts) {
  return /^(tools\.\d+\.provider_readiness\.first_generation|providers\.\d+\.first_generation)\.requirement_workspace_path$/
    .test(registryPathToString(parts));
}

function isEffectiveNullablePath(parts) {
  const joined = registryPathToString(parts);
  return joined.endsWith('provider_readiness.first_generation.requirement_workspace_path')
    || joined.endsWith('first_generation.requirement_workspace_path');
}

function mergeValue(base, override, parts, allowNull) {
  if (override === undefined) return cloneValue(base);
  if (override === null) {
    if (allowNull(parts)) return null;
    throw new RegistryError(
      'registry_null_not_allowed',
      `Registry merge 不允许 ${registryPathToString(parts) || '<root>'} 为 null。`,
      { path: registryPathToString(parts) },
    );
  }
  if (Array.isArray(override)) return cloneValue(override);
  if (isPlainObject(override)) {
    const source = isPlainObject(base) ? base : {};
    const result = {};
    const keys = new Set([...Object.keys(source), ...Object.keys(override)]);
    for (const key of [...keys].sort()) {
      result[key] = Object.prototype.hasOwnProperty.call(override, key)
        ? mergeValue(source[key], override[key], [...parts, key], allowNull)
        : cloneValue(source[key]);
    }
    return result;
  }
  return override;
}

function mergeLayerList(layers, allowNull = () => false) {
  let result = {};
  for (const layer of layers) {
    if (layer === undefined) continue;
    if (!isPlainObject(layer)) {
      throw new RegistryError(
        'registry_merge_layer_invalid',
        'Registry merge layer 必须是 plain object。',
      );
    }
    result = mergeValue(result, layer, [], allowNull);
  }
  return canonicalize(result);
}

function mergeLayers(...layers) {
  return mergeLayerList(layers);
}

function readJsonFile(filePath, code) {
  let source;
  try {
    source = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new RegistryError(code, `无法读取 ${filePath}：${error.message}`, { filePath });
  }
  try {
    return JSON.parse(source);
  } catch (error) {
    throw new RegistryError(code, `${filePath} 中的 JSON 无效：${error.message}`, { filePath });
  }
}

function resolveSchemaReference(rootSchema, reference) {
  if (!reference.startsWith('#/')) {
    throw new SchemaValidationError('$schema', `不支持的 reference ${reference}`);
  }
  let current = rootSchema;
  for (const rawPart of reference.slice(2).split('/')) {
    const part = rawPart.replaceAll('~1', '/').replaceAll('~0', '~');
    if (!isPlainObject(current) || !Object.prototype.hasOwnProperty.call(current, part)) {
      throw new SchemaValidationError('$schema', `无法解析的 reference ${reference}`);
    }
    current = current[part];
  }
  return current;
}

function schemaTypeMatches(value, expected) {
  if (expected === 'null') return value === null;
  if (expected === 'array') return Array.isArray(value);
  if (expected === 'object') return isPlainObject(value);
  if (expected === 'integer') return Number.isInteger(value);
  if (expected === 'number') return typeof value === 'number' && Number.isFinite(value);
  return typeof value === expected;
}

function validateSchemaValue(value, schema, rootSchema, location = '$') {
  if (!isPlainObject(schema)) {
    throw new SchemaValidationError(location, 'schema node 必须是 object');
  }
  if (schema.$ref) {
    validateSchemaValue(value, resolveSchemaReference(rootSchema, schema.$ref), rootSchema, location);
  }
  if (Array.isArray(schema.allOf)) {
    for (const item of schema.allOf) validateSchemaValue(value, item, rootSchema, location);
  }
  if (Array.isArray(schema.anyOf)) {
    const matches = schema.anyOf.some((item) => {
      try {
        validateSchemaValue(value, item, rootSchema, location);
        return true;
      } catch (error) {
        if (error instanceof SchemaValidationError) return false;
        throw error;
      }
    });
    if (!matches) throw new SchemaValidationError(location, '不匹配任何允许的 schema');
  }
  if (schema.const !== undefined && value !== schema.const) {
    throw new SchemaValidationError(location, `必须等于 ${JSON.stringify(schema.const)}`);
  }
  if (Array.isArray(schema.enum) && !schema.enum.includes(value)) {
    throw new SchemaValidationError(location, `必须是以下值之一：${schema.enum.join(', ')}`);
  }
  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((type) => schemaTypeMatches(value, type))) {
      throw new SchemaValidationError(location, `类型必须是 ${types.join(' 或 ')}`);
    }
  }
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      throw new SchemaValidationError(location, `长度必须 >= ${schema.minLength}`);
    }
    if (schema.pattern && !(new RegExp(schema.pattern)).test(value)) {
      throw new SchemaValidationError(location, `必须匹配 ${schema.pattern}`);
    }
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      throw new SchemaValidationError(location, `至少必须包含 ${schema.minItems} 项`);
    }
    if (schema.uniqueItems) {
      const serialized = value.map((item) => JSON.stringify(canonicalize(item)));
      if (new Set(serialized).size !== serialized.length) {
        throw new SchemaValidationError(location, '必须只包含唯一项');
      }
    }
    if (schema.items) {
      value.forEach((item, index) => {
        validateSchemaValue(item, schema.items, rootSchema, `${location}[${index}]`);
      });
    }
  }
  if (isPlainObject(value)) {
    if (schema.minProperties !== undefined && Object.keys(value).length < schema.minProperties) {
      throw new SchemaValidationError(location, `至少必须包含 ${schema.minProperties} 个 property`);
    }
    const properties = isPlainObject(schema.properties) ? schema.properties : {};
    for (const required of schema.required || []) {
      if (!Object.prototype.hasOwnProperty.call(value, required)) {
        throw new SchemaValidationError(location, `缺少必需 property ${required}`);
      }
    }
    for (const [key, item] of Object.entries(value)) {
      if (Object.prototype.hasOwnProperty.call(properties, key)) {
        validateSchemaValue(item, properties[key], rootSchema, `${location}.${key}`);
        continue;
      }
      if (schema.additionalProperties === false) {
        throw new SchemaValidationError(location, `未知 property ${key}`);
      }
      if (isPlainObject(schema.additionalProperties)) {
        validateSchemaValue(
          item,
          schema.additionalProperties,
          rootSchema,
          `${location}.${key}`,
        );
      }
    }
  }
}

function assertNoIllegalNull(value, parts = []) {
  if (value === null) {
    if (isSchemaDeclaredNullablePath(parts)) return;
    throw new RegistryError(
      'registry_null_not_allowed',
      `Schema 未声明 ${registryPathToString(parts)} 可为 null。`,
      { path: registryPathToString(parts) },
    );
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoIllegalNull(item, [...parts, String(index)]));
    return;
  }
  if (isPlainObject(value)) {
    for (const [key, item] of Object.entries(value)) {
      assertNoIllegalNull(item, [...parts, key]);
    }
  }
}

function assertUniqueIds(entries, collection) {
  const seen = new Set();
  for (const entry of entries) {
    if (seen.has(entry.id)) {
      throw new RegistryError(
        'registry_duplicate_id',
        `Duplicate id ${entry.id} in ${collection}.`,
        { collection, id: entry.id },
      );
    }
    seen.add(entry.id);
  }
}

function normalizePlatform(platform = process.platform) {
  const normalized = {
    darwin: 'macos',
    win32: 'windows',
    macos: 'macos',
    linux: 'linux',
    wsl: 'wsl',
    windows: 'windows',
  }[String(platform).toLowerCase()];
  if (!normalized) {
    throw new RegistryError(
      'registry_unknown_platform',
      `未知的 setup registry platform：${platform}。`,
      { platform },
    );
  }
  return normalized;
}

function detectRuntimePlatform({
  platform = process.platform,
  env = process.env,
  procVersion,
} = {}) {
  const normalized = normalizePlatform(platform);
  if (normalized !== 'linux') return normalized;
  if (env.WSL_DISTRO_NAME || env.WSL_INTEROP) return 'wsl';
  let version = procVersion;
  if (version === undefined) {
    try {
      version = fs.readFileSync('/proc/version', 'utf8');
    } catch (_error) {
      version = '';
    }
  }
  return /microsoft|wsl/i.test(String(version || '')) ? 'wsl' : 'linux';
}

function resolveConfigPath(configPath, platform) {
  if (typeof configPath === 'string') return configPath;
  if (isPlainObject(configPath) && typeof configPath[platform] === 'string') {
    return configPath[platform];
  }
  throw new RegistryError(
    'registry_platform_value_missing',
    `未为 platform ${platform} 定义 config path。`,
    { platform },
  );
}

function resolveHostConfigPlatform(hostConfig, platform) {
  if (!isPlainObject(hostConfig) || !isPlainObject(hostConfig.targets)) return hostConfig;
  const targets = {};
  for (const [targetId, target] of Object.entries(hostConfig.targets)) {
    targets[targetId] = {
      ...cloneValue(target),
      config_path: resolveConfigPath(target.config_path, platform),
      ...(Array.isArray(target.precedence_guards) ? {
        precedence_guards: target.precedence_guards.map((guard) => ({
          ...cloneValue(guard),
          config_path: resolveConfigPath(guard.config_path, platform),
        })),
      } : {}),
    };
  }
  return canonicalize({ ...cloneValue(hostConfig), targets });
}

function assertNoDuplicateHostTargets(registry) {
  for (const hostId of HOST_IDS) {
    const hostConfig = registry.hosts[hostId].defaults.tool.host_config;
    const targetIds = Object.keys(hostConfig.targets || {});
    for (const platform of PLATFORM_IDS) {
      const seen = new Map();
      for (const targetId of targetIds) {
        const target = hostConfig.targets[targetId];
        const configPath = resolveConfigPath(target.config_path, platform);
        const fingerprint = path.normalize(configPath).toLowerCase();
        if (seen.has(fingerprint)) {
          throw new RegistryError(
            'registry_duplicate_host_target',
            `Host ${hostId} 的 target ${seen.get(fingerprint)} 与 ${targetId} 在 ${platform} 上都解析为 ${configPath}。`,
            { host: hostId, platform, targetId, duplicateOf: seen.get(fingerprint), configPath },
          );
        }
        seen.set(fingerprint, targetId);
        for (const [guardIndex, guard] of (target.precedence_guards || []).entries()) {
          const guardPath = resolveConfigPath(guard.config_path, platform);
          const guardFingerprint = path.normalize(guardPath).toLowerCase();
          if (seen.has(guardFingerprint)) {
            throw new RegistryError(
              'registry_duplicate_host_target',
              `Host ${hostId} 的 target ${seen.get(guardFingerprint)} 与 ${targetId}.precedence_guards.${guardIndex} 在 ${platform} 上都解析为 ${guardPath}。`,
              { host: hostId, platform, targetId, duplicateOf: seen.get(guardFingerprint), configPath: guardPath },
            );
          }
          seen.set(guardFingerprint, `${targetId}.precedence_guards.${guardIndex}`);
        }
      }
    }
    for (const targetId of [
      ...(hostConfig.fallback_order || []),
      ...(hostConfig.uninstall_targets || []),
    ]) {
      if (!Object.prototype.hasOwnProperty.call(hostConfig.targets, targetId)) {
        throw new RegistryError(
          'registry_unknown_host_target',
          `Host ${hostId} 引用了未知 target ${targetId}。`,
          { host: hostId, targetId },
        );
      }
    }
  }
}

function assertOverrideKeys(registry) {
  for (const collection of Object.values(KIND_COLLECTIONS)) {
    for (const entry of registry[collection]) {
      for (const [host, override] of Object.entries(entry.host_overrides || {})) {
        if (!HOST_IDS.includes(host)) {
          throw new RegistryError(
            'registry_unknown_host_override',
            `${collection}.${entry.id} 包含未知 host override ${host}。`,
          );
        }
        if (Object.prototype.hasOwnProperty.call(override, 'id')) {
          throw new RegistryError(
            'registry_conflicting_override',
            `${collection}.${entry.id} 的 host override ${host} 不能替换 id。`,
          );
        }
      }
      for (const [platform, override] of Object.entries(entry.platform_overrides || {})) {
        if (!PLATFORM_IDS.includes(platform)) {
          throw new RegistryError(
            'registry_unknown_platform_override',
            `${collection}.${entry.id} 包含未知 platform override ${platform}。`,
          );
        }
        if (Object.prototype.hasOwnProperty.call(override, 'id')) {
          throw new RegistryError(
            'registry_conflicting_override',
            `${collection}.${entry.id} 的 platform override ${platform} 不能替换 id。`,
          );
        }
      }
    }
  }
}

function assertOpenCodePermissionPolicyOwnership(registry) {
  const openCodePolicy = registry.hosts.opencode.defaults.tool.host_config.permission_policy;
  if (!openCodePolicy || openCodePolicy.kind !== 'opencode-governed-assets-v1') {
    throw new RegistryError(
      'registry_opencode_permission_policy_invalid_owner',
      'OpenCode host config 必须声明 opencode-governed-assets-v1 permission policy。',
    );
  }
  for (const hostId of HOST_IDS) {
    if (hostId === 'opencode') continue;
    if (registry.hosts[hostId].defaults.tool.host_config.permission_policy !== undefined) {
      throw new RegistryError(
        'registry_opencode_permission_policy_invalid_owner',
        `Host ${hostId} 不得声明 OpenCode permission policy。`,
        { host: hostId },
      );
    }
  }
  for (const collection of Object.values(KIND_COLLECTIONS)) {
    for (const entry of registry[collection]) {
      for (const [hostId, override] of Object.entries(entry.host_overrides || {})) {
        if (hostId === 'opencode') continue;
        if (override.host_config && override.host_config.permission_policy !== undefined) {
          throw new RegistryError(
            'registry_opencode_permission_policy_invalid_owner',
            `${collection}.${entry.id} 的 ${hostId} override 不得声明 OpenCode permission policy。`,
            { collection, id: entry.id, host: hostId },
          );
        }
      }
    }
  }
}

function sortEntries(entries) {
  return [...entries].sort((left, right) => left.id.localeCompare(right.id));
}

function canonicalizeRegistry(registry) {
  return canonicalize({
    ...registry,
    external_dependencies: sortEntries(registry.external_dependencies),
    tools: sortEntries(registry.tools),
    helpers: sortEntries(registry.helpers),
    providers: sortEntries(registry.providers),
    artifact_contracts: sortEntries(registry.artifact_contracts),
  });
}

function validateRegistry(registry, schema) {
  assertNoIllegalNull(registry);
  try {
    validateSchemaValue(registry, schema, schema);
  } catch (error) {
    if (!(error instanceof SchemaValidationError)) throw error;
    throw new RegistryError(
      'registry_schema_invalid',
      `Setup registry 不匹配 setup-registry.schema.json：${error.message}`,
      { location: error.location },
    );
  }
  if (registry.schema_version !== REGISTRY_SCHEMA_VERSION) {
    throw new RegistryError(
      'registry_schema_invalid',
      `预期 ${REGISTRY_SCHEMA_VERSION}，实际为 ${registry.schema_version}。`,
    );
  }
  for (const [collection, entries] of [
    ['external_dependencies', registry.external_dependencies],
    ['tools', registry.tools],
    ['helpers', registry.helpers],
    ['providers', registry.providers],
    ['artifact_contracts', registry.artifact_contracts],
  ]) {
    assertUniqueIds(entries, collection);
  }
  for (const hostId of HOST_IDS) {
    if (registry.hosts[hostId].id !== hostId) {
      throw new RegistryError(
        'registry_host_id_mismatch',
        `Host key ${hostId} 必须包含 id ${hostId}。`,
      );
    }
  }
  assertNoDuplicateHostTargets(registry);
  assertOverrideKeys(registry);
  assertOpenCodePermissionPolicyOwnership(registry);
}

function loadRegistry({ skillRoot }) {
  if (!skillRoot || typeof skillRoot !== 'string') {
    throw new RegistryError('registry_skill_root_required', 'loadRegistry 需要 skillRoot。');
  }
  const registryPath = path.join(skillRoot, REGISTRY_FILE);
  const schemaPath = path.join(skillRoot, SCHEMA_FILE);
  const schema = readJsonFile(schemaPath, 'registry_schema_unreadable');
  const registry = readJsonFile(registryPath, 'registry_unreadable');
  validateRegistry(registry, schema);
  return canonicalizeRegistry(registry);
}

function requireHost(registry, host) {
  const normalized = String(host || '').toLowerCase();
  if (!HOST_IDS.includes(normalized) || !registry.hosts[normalized]) {
    throw new RegistryError(
      'registry_unknown_host',
      `未知的 setup registry host：${host}。`,
      { host },
    );
  }
  return normalized;
}

function requireKind(kind) {
  const normalized = String(kind || '').toLowerCase().replace(/s$/, '');
  if (!Object.prototype.hasOwnProperty.call(KIND_COLLECTIONS, normalized)) {
    throw new RegistryError(
      'registry_unknown_kind',
      `未知的 setup registry entry kind：${kind}。`,
      { kind },
    );
  }
  return normalized;
}

function effectiveHostDefinition(registry, host, platform) {
  const defaults = mergeLayerList([
    registry.defaults.tool,
    registry.hosts[host].defaults.tool,
  ], isEffectiveNullablePath);
  return canonicalize({
    id: host,
    host_config: resolveHostConfigPlatform(defaults.host_config, platform),
  });
}

function getEffectiveEntry(registry, { kind, id, host, platform }) {
  const normalizedKind = requireKind(kind);
  const normalizedHost = requireHost(registry, host);
  const normalizedPlatform = normalizePlatform(platform);
  const collection = KIND_COLLECTIONS[normalizedKind];
  const entry = registry[collection].find((candidate) => candidate.id === id);
  if (!entry) {
    throw new RegistryError(
      'registry_unknown_entry',
      `未知的 ${normalizedKind} registry entry：${id}。`,
      { kind: normalizedKind, id },
    );
  }
  const baseEntry = Object.fromEntries(
    Object.entries(entry).filter(([key]) => !['host_overrides', 'platform_overrides'].includes(key)),
  );
  const effective = mergeLayerList([
    registry.defaults[normalizedKind],
    registry.hosts[normalizedHost].defaults[normalizedKind],
    baseEntry,
    entry.host_overrides && entry.host_overrides[normalizedHost],
    entry.platform_overrides && entry.platform_overrides[normalizedPlatform],
  ], isEffectiveNullablePath);
  if (effective.host_config) {
    effective.host_config = resolveHostConfigPlatform(
      effective.host_config,
      normalizedPlatform,
    );
  }
  return canonicalize(effective);
}

function getEffectiveRegistry(registry, { host, platform }) {
  const normalizedHost = requireHost(registry, host);
  const normalizedPlatform = normalizePlatform(platform);
  const effectiveEntries = (kind) => registry[KIND_COLLECTIONS[kind]].map((entry) =>
    getEffectiveEntry(registry, {
      kind,
      id: entry.id,
      host: normalizedHost,
      platform: normalizedPlatform,
    })
  );
  return canonicalize({
    schema_version: registry.schema_version,
    host: normalizedHost,
    platform: normalizedPlatform,
    host_definition: effectiveHostDefinition(registry, normalizedHost, normalizedPlatform),
    install_mirrors: cloneValue(registry.install_mirrors),
    external_dependencies: cloneValue(registry.external_dependencies),
    tools: effectiveEntries('tool'),
    helpers: effectiveEntries('helper'),
    providers: effectiveEntries('provider'),
    provider_readiness_defaults: cloneValue(registry.provider_readiness_defaults),
    artifact_contracts: cloneValue(registry.artifact_contracts),
  });
}

function getDiagnosticRegistry(registry, { platform }) {
  const normalizedPlatform = normalizePlatform(platform);
  const effectiveEntries = (kind) => registry[KIND_COLLECTIONS[kind]].map((entry) => {
    const baseEntry = Object.fromEntries(
      Object.entries(entry).filter(([key]) => !['host_overrides', 'platform_overrides'].includes(key)),
    );
    return mergeLayerList([
      registry.defaults[kind],
      baseEntry,
      entry.platform_overrides && entry.platform_overrides[normalizedPlatform],
    ], isEffectiveNullablePath);
  });
  return canonicalize({
    schema_version: registry.schema_version,
    host: null,
    platform: normalizedPlatform,
    install_mirrors: cloneValue(registry.install_mirrors),
    external_dependencies: cloneValue(registry.external_dependencies),
    tools: effectiveEntries('tool'),
    helpers: effectiveEntries('helper'),
    providers: effectiveEntries('provider'),
    provider_readiness_defaults: cloneValue(registry.provider_readiness_defaults),
    artifact_contracts: cloneValue(registry.artifact_contracts),
  });
}

module.exports = {
  canonicalize,
  detectRuntimePlatform,
  getDiagnosticRegistry,
  getEffectiveEntry,
  getEffectiveRegistry,
  loadRegistry,
  mergeLayers,
  validateSchemaValue,
};
