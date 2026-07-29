'use strict';

const {
  isBaselineBlocking,
} = require('./baseline-policy.cjs');

function installCommand(entry, platform) {
  if (entry && entry.installation && typeof entry.installation.command === 'string') {
    return entry.installation.command;
  }
  const override = entry
    && entry.platform_overrides
    && entry.platform_overrides[platform]
    && entry.platform_overrides[platform].installation;
  return override && typeof override.command === 'string' ? override.command : '';
}

function helperReasonCode(result) {
  if (result === 'ready') return 'ready';
  if (result === 'skipped') return 'optional-skipped';
  if (result === 'degraded') return 'optional-capability-degraded';
  return 'required-runtime-action-required';
}

function normalizeHelper(entry, probe, platform) {
  const status = probe && probe.status ? probe.status : 'missing';
  const baselineBlocking = entry.baseline_blocking === true;
  const command = installCommand(entry, platform);
  const dependencyStatus = probe && probe.dependency_status
    ? probe.dependency_status
    : (status === 'ready' ? 'ready' : 'missing');
  let result = 'ready';
  let nextAction = '';

  if (status !== 'ready') {
    if (entry.id === 'agent-browser') {
      result = status === 'skipped' ? 'skipped' : 'degraded';
      nextAction = probe && typeof probe.next_action === 'string' && probe.next_action.length > 0
        ? probe.next_action
        : command;
    } else if (entry.id === 'ast-grep' && status === 'degraded') {
      result = 'degraded';
      nextAction = '缺少 ast-grep；回退到 rg';
    } else {
      result = baselineBlocking ? 'action-required' : 'degraded';
      nextAction = command;
    }
  }

  const normalized = {
    ...(probe || {}),
    id: entry.id,
    kind: entry.kind || 'helper',
    profile: Array.isArray(entry.profiles) && entry.profiles.length > 0
      ? entry.profiles[0]
      : 'minimal',
    required: entry.required !== false,
    baseline_blocking: baselineBlocking,
    dependency_status: dependencyStatus,
    host_config_status: 'not-applicable',
    project_status: 'not-applicable',
    configured_status: 'not-applicable',
    allowed: 'not-applicable',
    result,
    reason_code: entry.id === 'agent-browser' && probe && probe.reason_code
      ? probe.reason_code
      : helperReasonCode(result),
    next_action: nextAction,
    install_command: command,
    url: entry.safety && entry.safety.source_repo ? entry.safety.source_repo : '',
  };
  if (entry.kind === 'global-skill') {
    normalized.skill_name = entry.detection && entry.detection.skill_name
      ? entry.detection.skill_name
      : entry.id;
  }
  return normalized;
}

function normalizeMcp(entry, probe, hostResult) {
  const dependencyReady = probe && probe.status === 'ready';
  const configuredStatus = hostResult && hostResult.configured_status
    ? hostResult.configured_status
    : (entry.host_config_required === false ? 'not-applicable' : 'not-checked');
  const configuredReady = ['ready', 'not-applicable', 'not-required', 'fallback-active']
    .includes(configuredStatus);
  const blocking = isBaselineBlocking(entry);
  let result = 'ready';
  if (!dependencyReady) result = blocking ? 'action-required' : 'degraded';
  else if (!configuredReady) result = configuredStatus === 'not-checked' ? 'unknown' : 'action-required';
  return {
    id: entry.id,
    kind: entry.category || 'mcp',
    required: entry.required !== false,
    setup_required: entry.setup_required === true,
    baseline_blocking: blocking,
    dependency_status: dependencyReady ? 'ready' : 'missing',
    configured_status: configuredStatus,
    result,
    reason_code: !dependencyReady
      ? ((probe && probe.reason_code) || 'probe-not-ready')
      : ((hostResult && hostResult.reason_code) || (configuredReady ? 'ready' : 'host-config-not-verified')),
    next_action: (hostResult && hostResult.next_action)
      || (probe && probe.next_action)
      || '',
    config_path: hostResult && hostResult.config_path ? hostResult.config_path : null,
    config_key: hostResult && hostResult.config_key ? hostResult.config_key : null,
    conflict_fields: hostResult && Array.isArray(hostResult.conflict_fields)
      ? hostResult.conflict_fields
      : [],
  };
}

function compactProjectStatus(projectConfigStatus, insideGitRepo) {
  if (!insideGitRepo) {
    return {
      inside_git_repo: false,
      local_config_status: 'skip',
      local_config_gitignore_status: 'skip',
      example_config_status: 'skip',
    };
  }
  const status = projectConfigStatus || {};
  const localStatus = status.local_config && status.local_config.status;
  const gitignoreStatus = status.local_config_gitignore && status.local_config_gitignore.status;
  const exampleStatus = status.example_config && status.example_config.status;
  const defaultsActive = localStatus === 'defaults-active';
  return {
    inside_git_repo: true,
    local_config_status: localStatus === 'present'
      ? 'ok'
      : (defaultsActive ? 'defaults-active' : 'missing'),
    local_config_gitignore_status: localStatus === 'present'
      ? (gitignoreStatus === 'ignored' ? 'ok' : 'missing')
      : (defaultsActive
        ? (gitignoreStatus === 'ready-for-local-config' ? 'ok' : 'missing')
        : 'skip'),
    example_config_status: exampleStatus === 'current' ? 'ok' : (exampleStatus || 'missing'),
  };
}

function compactLegacyStatus(projectConfigStatus, insideGitRepo, platform) {
  if (!insideGitRepo) {
    return {
      legacy_markdown_status: 'skip',
      legacy_local_config_status: platform === 'windows' ? 'skip' : 'retired',
    };
  }
  const status = projectConfigStatus || {};
  return {
    legacy_markdown_status: status.legacy_markdown_config
      && status.legacy_markdown_config.status === 'present'
      ? 'present'
      : 'missing',
    legacy_local_config_status: 'retired',
  };
}

function buildPreflightProjection({
  registry,
  toolResults = [],
  helperResults = [],
  hostConfigResults = new Map(),
  projectConfigStatus,
  insideGitRepo = false,
  platform,
} = {}) {
  const effectivePlatform = platform || (registry && registry.platform) || 'linux';
  const probes = new Map(helperResults.map((entry) => [entry.id, entry]));
  const mcpProbes = new Map(toolResults.map((entry) => [entry.id, entry]));
  const helpers = registry && Array.isArray(registry.helpers) ? registry.helpers : [];
  const tools = registry && Array.isArray(registry.tools) ? registry.tools : [];
  return {
    mcp_servers: tools
      .filter((entry) => (entry.category || 'mcp') === 'mcp')
      .map((entry) => normalizeMcp(entry, mcpProbes.get(entry.id), hostConfigResults.get(entry.id))),
    tools: helpers
      .filter((entry) => entry.kind === 'cli' || entry.kind === 'browser-helper')
      .map((entry) => normalizeHelper(entry, probes.get(entry.id), effectivePlatform)),
    skills: helpers
      .filter((entry) => entry.kind === 'global-skill')
      .map((entry) => normalizeHelper(entry, probes.get(entry.id), effectivePlatform)),
    project: compactProjectStatus(projectConfigStatus, insideGitRepo),
    legacy: compactLegacyStatus(projectConfigStatus, insideGitRepo, effectivePlatform),
  };
}

module.exports = {
  buildPreflightProjection,
};
