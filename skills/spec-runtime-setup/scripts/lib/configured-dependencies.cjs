'use strict';

const fs = require('node:fs');
const path = require('node:path');

function scanConfiguredDependencies({
  repoRoot,
  registry = {},
  env = process.env,
  factsTools = {},
  factsSourcePath,
} = {}) {
  const root = path.resolve(repoRoot || process.cwd());
  const lookup = declaredCommands(registry);
  const dependencyStatusFor = createDependencyStatusResolver(env);
  const configuredDependencies = scanFactsMcp(
    factsTools,
    factsSourcePath || path.join(root, '.spec-first', 'config', 'tool-facts.json'),
  );
  let scanFailed = false;

  for (const source of [
    { path: path.join(root, '.claude', 'settings.json'), scan: scanClaudeSettings },
    { path: path.join(root, '.codex', 'hooks.json'), scan: scanCodexHooks },
  ]) {
    const state = readJsonState(source.path);
    if (state.status === 'missing') continue;
    if (state.status === 'unreadable') {
      scanFailed = true;
      configuredDependencies.push(problemEntry(source.path, 'configured-source-unreadable'));
      continue;
    }
    configuredDependencies.push(...source.scan(state.value, source.path, lookup, dependencyStatusFor));
  }

  const packagePath = path.join(root, 'package.json');
  const packageState = readJsonState(packagePath);
  if (packageState.status === 'unreadable') {
    scanFailed = true;
    configuredDependencies.push(problemEntry(packagePath, 'configured-source-unreadable'));
  } else if (packageState.status === 'read') {
    configuredDependencies.push(...scanPackageScripts(packageState.value, packagePath, lookup, dependencyStatusFor));
  }

  const profilePath = path.join(root, 'spec-first.verification.json');
  const profileState = readJsonState(profilePath);
  if (profileState.status === 'unreadable') {
    scanFailed = true;
    configuredDependencies.push(problemEntry(profilePath, 'profile-unreadable'));
  } else if (profileState.status === 'read') {
    configuredDependencies.push(...scanVerificationProfile(profileState.value, profilePath, lookup, dependencyStatusFor));
  }

  return {
    schema_version: 'configured-dependency-scan.v1',
    repo_root: root,
    status: scanFailed ? 'scan-failed' : 'ok',
    reason_code: scanFailed ? 'configured-dependency-scan-failed' : 'configured-dependency-scan-complete',
    configured_dependencies: configuredDependencies,
  };
}

function scanFactsMcp(tools, sourcePath) {
  if (!tools || typeof tools !== 'object' || Array.isArray(tools)) return [];
  return Object.entries(tools).map(([id, value = {}]) => {
    const dependency = value.dependency_status || (value.status === 'ready' ? 'ready' : 'unknown');
    const configured = value.host_config_status
      || value.configured_status
      || (value.status === 'ready' ? 'ready' : 'unknown');
    const readyConfiguredStatuses = new Set(['ready', 'fallback-active', 'not-required', 'not-applicable']);
    const result = dependency === 'ready' && readyConfiguredStatuses.has(configured)
      ? 'ready'
      : (dependency === 'ready' && configured === 'registry-args-drift' ? 'degraded' : 'action-required');
    return {
      id: `mcp-config:${id}`,
      kind: 'mcp-config',
      source_path: sourcePath,
      command: id,
      args_shape: 'registry',
      declared_tool_id: id,
      declared_status: 'declared',
      dependency_status: dependency,
      configured_status: configured,
      result,
      reason_code: configured === 'registry-args-drift'
        ? 'host-config-version-drift'
        : 'configured-dependency-from-mcp-registry',
    };
  });
}

function declaredCommands(registry) {
  const commands = new Map([
    ['node', 'node'],
    ['npm', 'npm'],
    ['npx', 'npx'],
    ['git', 'git'],
    ['rg', 'rg'],
    ['bash', 'bash'],
    ['sh', 'sh'],
    ['pwsh', 'pwsh'],
    ['powershell', 'powershell'],
    ['spec-first', 'spec-first'],
  ]);
  for (const entry of registry.helpers || []) {
    const detection = entry.detection || {};
    if (detection.command) commands.set(detection.command, entry.id);
    if (detection.fallback_command) commands.set(detection.fallback_command, entry.id);
  }
  for (const entry of registry.external_dependencies || []) {
    if (entry.command) commands.set(entry.command, entry.id);
  }
  for (const entry of registry.providers || []) {
    if (entry.detection && entry.detection.command) commands.set(entry.detection.command, entry.id);
  }
  for (const entry of registry.tools || []) {
    for (const dependency of entry.dependencies || []) commands.set(dependency, dependency);
    if (entry.host_config && entry.host_config.command) commands.set(entry.host_config.command, entry.id);
  }
  return commands;
}

function readJsonState(filePath) {
  if (!fs.existsSync(filePath)) return { status: 'missing', value: null };
  try {
    return { status: 'read', value: JSON.parse(fs.readFileSync(filePath, 'utf8')) };
  } catch (error) {
    return { status: 'unreadable', value: null, error };
  }
}

function scanClaudeSettings(settings, sourcePath, lookup, dependencyStatusFor) {
  const entries = [];
  const servers = isObject(settings.mcpServers) ? settings.mcpServers : {};
  for (const [name, config] of Object.entries(servers)) {
    const entry = makeEntry({
      kind: 'mcp-config',
      sourcePath,
      command: isObject(config) ? config.command : '',
      idSuffix: name,
    }, lookup, dependencyStatusFor);
    if (entry) entries.push(entry);
  }
  entries.push(...scanHookObject(settings.hooks, sourcePath, 'claude', lookup, dependencyStatusFor));
  const permissions = isObject(settings.permissions) ? settings.permissions : {};
  for (const permission of ['allow', 'deny']) {
    const values = Array.isArray(permissions[permission]) ? permissions[permission] : [];
    values.forEach((value, index) => {
      const match = typeof value === 'string' ? value.match(/\bBash\(([^)]*)\)/) : null;
      const entry = makeEntry({
        kind: 'permission-allowlist',
        sourcePath,
        command: match ? match[1] : '',
        idSuffix: `${permission}:${index}`,
        configuredStatus: permission === 'allow' ? 'allowed' : 'denied',
      }, lookup, dependencyStatusFor);
      if (entry) entries.push(entry);
    });
  }
  return entries;
}

function scanCodexHooks(config, sourcePath, lookup, dependencyStatusFor) {
  return scanHookObject(config.hooks, sourcePath, 'codex', lookup, dependencyStatusFor);
}

function scanHookObject(hooksValue, sourcePath, host, lookup, dependencyStatusFor) {
  const entries = [];
  const hooks = isObject(hooksValue) ? hooksValue : {};
  for (const [event, eventEntries] of Object.entries(hooks)) {
    const list = Array.isArray(eventEntries) ? eventEntries : [];
    list.forEach((hook, hookIndex) => {
      const commands = hook && Array.isArray(hook.hooks) ? hook.hooks : [];
      commands.forEach((candidate, commandIndex) => {
        const command = typeof candidate === 'string' ? candidate : candidate && candidate.command;
        if (isManagedRuntimeHookCommand(command)) return;
        const entry = makeEntry({
          kind: 'hook',
          sourcePath,
          command,
          idSuffix: `${host}:${event}:${hookIndex}:${commandIndex}`,
        }, lookup, dependencyStatusFor);
        if (entry) entries.push(entry);
      });
    });
  }
  return entries;
}

function scanPackageScripts(packageJson, sourcePath, lookup, dependencyStatusFor) {
  const scripts = isObject(packageJson.scripts) ? packageJson.scripts : {};
  return Object.entries(scripts)
    .filter(([name]) => /(^|:)(setup|bootstrap|prepare|postinstall|install)(:|$)/.test(name))
    .map(([name, command]) => makeEntry({
      kind: 'setup-script',
      sourcePath,
      command: String(command || ''),
      idSuffix: name,
    }, lookup, dependencyStatusFor))
    .filter(Boolean);
}

function scanVerificationProfile(profile, sourcePath, lookup, dependencyStatusFor) {
  if (!isObject(profile) || !isObject(profile.profiles) || !isObject(profile.services) || !isObject(profile.stacks)) {
    return [problemEntry(sourcePath, 'profile-schema-invalid')];
  }
  const profileName = profile.default_profile;
  const selected = profile.profiles[profileName];
  if (!isObject(selected) || !Array.isArray(selected.services) || !Array.isArray(selected.checks)) {
    return [problemEntry(sourcePath, 'profile-schema-invalid')];
  }
  const entries = [];
  for (const serviceId of selected.services) {
    const service = profile.services[serviceId];
    const stack = service && profile.stacks[service.stack];
    if (!isObject(stack) || !isObject(stack.commands)) {
      entries.push(problemEntry(sourcePath, 'profile-resolution-invalid', `${serviceId}:stack`));
      continue;
    }
    for (const checkId of selected.checks) {
      const command = stack.commands[checkId];
      if (typeof command !== 'string') {
        entries.push(problemEntry(sourcePath, 'profile-resolution-invalid', `${serviceId}:${checkId}`));
        continue;
      }
      const commandEntry = makeEntry({
        kind: 'verification-command',
        sourcePath,
        command,
        idSuffix: `${serviceId}:${checkId}`,
      }, lookup, dependencyStatusFor);
      if (commandEntry) entries.push(commandEntry);
      const requiredTools = isObject(stack.required_tools) && Array.isArray(stack.required_tools[checkId])
        ? stack.required_tools[checkId]
        : [];
      for (const tool of requiredTools) {
        const toolEntry = makeEntry({
          kind: 'verification-required-tool',
          sourcePath,
          command: tool,
          idSuffix: `${serviceId}:${checkId}:${tool}`,
        }, lookup, dependencyStatusFor);
        if (toolEntry) entries.push(toolEntry);
      }
    }
  }
  return entries;
}

function makeEntry({ kind, sourcePath, command, idSuffix, configuredStatus }, lookup, dependencyStatusFor) {
  const name = commandName(command);
  if (!name) return null;
  const declaredToolId = lookup.get(name) || null;
  const dependency = dependencyStatusFor(name);
  const undeclared = !declaredToolId;
  return {
    id: `${kind}:${idSuffix || name}`,
    kind,
    source_path: sourcePath,
    command: name,
    args_shape: argsShape(command),
    declared_tool_id: declaredToolId,
    declared_status: undeclared ? 'undeclared' : 'declared',
    dependency_status: dependency,
    configured_status: configuredStatus || 'configured',
    result: undeclared || dependency !== 'ready' ? 'action-required' : 'ready',
    reason_code: undeclared
      ? 'configured-dependency-undeclared'
      : (dependency === 'ready' ? 'configured-dependency-ready' : 'configured-dependency-missing'),
  };
}

function problemEntry(sourcePath, reasonCode, idSuffix = 'source') {
  return {
    id: `configured-scan:${idSuffix}`,
    kind: 'configured-scan',
    source_path: sourcePath,
    command: '',
    args_shape: 'unknown',
    declared_tool_id: null,
    declared_status: 'unknown',
    dependency_status: 'unknown',
    configured_status: 'invalid',
    result: 'action-required',
    reason_code: reasonCode,
  };
}

function commandName(command) {
  if (typeof command !== 'string') return '';
  const trimmed = command.trim().replace(/^(env\s+)?([A-Za-z_][A-Za-z0-9_]*=[^\s]+\s+)*/, '');
  if (!trimmed) return '';
  const first = trimmed.split(/\s+/)[0] || '';
  return path.basename(first.replace(/^['"]|['"]$/g, ''));
}

function argsShape(command) {
  if (typeof command !== 'string') return 'none';
  const parts = command.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return 'none';
  return parts.slice(1).map((part) => {
    if (/^--?[A-Za-z0-9][\w-]*(=.*)?$/.test(part)) return 'flag';
    if (/^[A-Za-z_][A-Za-z0-9_]*=.*/.test(part)) return 'env';
    return 'arg';
  }).join(',');
}

function dependencyStatus(command, env) {
  if (command === 'spec-first') return 'ready';
  if (path.isAbsolute(command)) return fs.existsSync(command) ? 'ready' : 'missing';
  const directories = String(env.PATH || '').split(path.delimiter).filter(Boolean);
  const names = process.platform === 'win32'
    ? [command, `${command}.exe`, `${command}.cmd`, `${command}.ps1`]
    : [command];
  return directories.some((directory) => names.some((name) => fs.existsSync(path.join(directory, name))))
    ? 'ready'
    : 'missing';
}

function createDependencyStatusResolver(env) {
  const cache = new Map();
  return (command) => {
    if (!cache.has(command)) cache.set(command, dependencyStatus(command, env));
    return cache.get(command);
  };
}

function isManagedRuntimeHookCommand(command) {
  if (typeof command !== 'string') return false;
  const normalized = command.replaceAll('\\', '/');
  return /(^|[\s"'/])\.(claude|codex)\/hooks\//.test(normalized)
    || /(^|[\s"'/])\.agents\/skills\//.test(normalized);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

module.exports = {
  scanConfiguredDependencies,
};
