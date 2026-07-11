'use strict';

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
  let dependencyStatus = status === 'ready' ? 'ready' : 'missing';
  let result = 'ready';
  let nextAction = '';

  if (status !== 'ready') {
    if (entry.id === 'agent-browser') {
      result = 'skipped';
      if (probe && probe.reason_code === 'agent-browser-manual-setup-incomplete') {
        dependencyStatus = 'ready';
      }
      nextAction = command;
    } else if (entry.id === 'ast-grep' && status === 'degraded') {
      result = 'degraded';
      nextAction = '缺少 ast-grep；回退到 rg';
    } else {
      result = baselineBlocking ? 'action-required' : 'degraded';
      nextAction = command;
    }
  }

  const normalized = {
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
    reason_code: helperReasonCode(result),
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
  return {
    inside_git_repo: true,
    local_config_status: localStatus === 'present' ? 'ok' : 'missing',
    local_config_gitignore_status: localStatus === 'present'
      ? (gitignoreStatus === 'ignored' ? 'ok' : 'missing')
      : 'skip',
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
  helperResults = [],
  projectConfigStatus,
  insideGitRepo = false,
  platform,
} = {}) {
  const effectivePlatform = platform || (registry && registry.platform) || 'linux';
  const probes = new Map(helperResults.map((entry) => [entry.id, entry]));
  const helpers = registry && Array.isArray(registry.helpers) ? registry.helpers : [];
  return {
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
