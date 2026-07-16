'use strict';

const {
  CANONICAL_HOSTS,
} = require('./host-authority.cjs');
const {
  commandSucceeded,
} = require('./process-runner.cjs');

const RUNTIME_MARKERS = Object.freeze([
  ['codex', ['CODEX_CI', 'CODEX_MANAGED_BY_NPM', 'CODEX_THREAD_ID', 'CODEX_SANDBOX']],
  ['claude', ['CLAUDE_CODE_SSE_PORT', 'CLAUDE_CODE_SESSION_ID', 'CLAUDE_PROJECT_DIR']],
]);

const HOST_CLI_COMMANDS = Object.freeze({
  claude: ['claude'],
  codex: ['codex'],
  cursor: ['agent'],
  kiro: ['kiro'],
  qoder: ['qodercli', 'qoder'],
});

function advisoryHostCandidates({ env = {}, runner } = {}) {
  const candidates = [];
  for (const value of [env.MCP_SETUP_HOST, env.SPEC_FIRST_PROVIDER_HOST]) {
    if (CANONICAL_HOSTS.includes(value)) candidates.push(value);
  }
  for (const [host, markers] of RUNTIME_MARKERS) {
    if (markers.some((key) => env[key] !== undefined && env[key] !== '')) candidates.push(host);
  }
  const distinct = [...new Set(candidates)];
  if (distinct.length > 0 || typeof runner !== 'function') return distinct;

  const visible = [];
  for (const host of CANONICAL_HOSTS) {
    const commands = HOST_CLI_COMMANDS[host] || [];
    if (commands.some((command) => commandSucceeded(runner(command, ['--version'], { timeoutMs: 10000 })))) {
      visible.push(host);
      if (visible.length > 1) return [];
    }
  }
  return visible.length === 1 ? visible : [];
}

function diagnosticNextActions(payload = {}, { liveBaselineFailures, requiredProviderIds } = {}) {
  const actions = [];
  let blocking = false;
  const project = payload.project || {};
  if (project.inside_git_repo && (
    project.example_config_status !== 'ok'
    || project.local_config_gitignore_status === 'missing'
  )) {
    actions.push('运行 spec-runtime-setup --project-config，预览并写入项目本地设置。');
    blocking = true;
  }
  const runtime = payload.runtime || {};
  const manifest = payload.generated_runtime_manifest || runtime.generated_runtime_manifest || {};
  const baselineFailures = Array.isArray(liveBaselineFailures)
    ? liveBaselineFailures
    : [
      ...(Array.isArray(payload.tools) ? payload.tools : []),
      ...(Array.isArray(payload.skills) ? payload.skills : []),
    ].filter((entry) => entry.baseline_blocking === true && entry.result !== 'ready');
  for (const entry of baselineFailures) {
    actions.push(entry.next_action
      || `运行标准 spec-runtime-setup，修复 ${entry.id || '当前缺失的 required baseline'}。`);
    blocking = true;
  }
  const persistedRuntimeReady = runtime.setup_facts_status === 'ready'
    && runtime.runtime_capabilities_status === 'ready'
    && runtime.baseline_ready === true
    && runtime.host_runtime_ready === true;
  if (!persistedRuntimeReady) {
    actions.push('运行标准 spec-runtime-setup，完成 required baseline、CodeGraph 与 Graphify setup；仅需只读复核时使用 --verify-only。');
    blocking = true;
  } else {
    const providers = Array.isArray(payload.provider_readiness)
      ? payload.provider_readiness
      : (Array.isArray(runtime.provider_readiness) ? runtime.provider_readiness : []);
    const providerById = new Map(providers.map((entry) => [entry.provider, entry]));
    const requiredIds = Array.isArray(requiredProviderIds)
      ? requiredProviderIds
      : providers.map((entry) => entry.provider);
    const providersReady = requiredIds.every((id) => providerReadyForDiagnostic(providerById.get(id)));
    if (!providersReady) {
      const requiredSet = new Set(requiredIds);
      const providerActions = providers
        .filter((entry) => requiredSet.has(entry.provider) && !providerReadyForDiagnostic(entry))
        .flatMap((entry) => entry.next_actions || []);
      if (providerActions.length > 0) actions.push(...providerActions);
      else actions.push('运行当前 host 的 spec-runtime-setup --verify-only，确认 required Provider readiness。');
      blocking = true;
    } else {
      const requiredSet = new Set(requiredIds);
      actions.push(...providers
        .filter((entry) => requiredSet.has(entry.provider)
          && entry.steady_state
          && entry.steady_state.hook_status === 'blocked')
        .flatMap((entry) => entry.next_actions || []));
    }
    if (manifest.status !== 'current') {
      actions.push('运行当前 host 的 spec-runtime-setup --verify-only，确认 required Provider readiness。');
      blocking = true;
    }
  }
  if (['stale', 'missing'].includes(manifest.status) && manifest.next_action) {
    actions.push(manifest.next_action);
    blocking = true;
  }
  if (!blocking) actions.push('必需设置项已就绪，继续目标 spec-* workflow。');
  return [...new Set(actions)];
}

function providerReadyForDiagnostic(provider) {
  if (!provider || ['degraded', 'failed', 'blocked', 'not-run'].includes(provider.readiness_status)) return false;
  if (provider.readiness_status === 'fresh') return true;
  const lifecycle = provider.lifecycle || {};
  return ['installed', 'configured', 'initialized', 'indexed', 'artifact_exists', 'query_verified']
    .every((field) => lifecycle[field] === true);
}

function renderDiagnosticHuman(payload, pluginVersion) {
  const lines = [];
  if (pluginVersion) lines.push(`Spec-First 版本 v${pluginVersion}`, '');
  lines.push('MCP servers');
  appendItems(lines, payload.mcp_servers);
  lines.push('');
  lines.push('工具');
  appendItems(lines, payload.tools);
  lines.push('', '技能');
  appendItems(lines, payload.skills);
  lines.push('', '项目设置');
  const project = payload.project || {};
  lines.push(`- Git 仓库：${project.inside_git_repo === true ? '是' : '否'}`);
  lines.push(`- 示例配置：${project.example_config_status || 'unknown'}`);
  lines.push(`- 本地配置：${project.local_config_status || 'unknown'}`);
  lines.push(`- 本地配置 gitignore：${project.local_config_gitignore_status || 'unknown'}`);

  const runtime = payload.runtime || {};
  const manifest = payload.generated_runtime_manifest || {};
  lines.push('', '设置事实');
  lines.push(`- 工具事实：${runtime.setup_facts_status || 'missing'} (${runtime.setup_facts_reason_code || 'not-reported'})`);
  lines.push(`- Runtime 能力：${runtime.runtime_capabilities_status || 'missing'} (${runtime.runtime_capabilities_reason_code || 'not-reported'})`);
  lines.push(`- 基线就绪：${runtime.baseline_ready === null || runtime.baseline_ready === undefined ? 'unknown' : runtime.baseline_ready}`);
  lines.push(`- Generated runtime manifest：${manifest.status || 'unknown'} (${manifest.reason_code || 'not-reported'})`);

  lines.push('', 'Provider 状态');
  if (!Array.isArray(payload.provider_readiness) || payload.provider_readiness.length === 0) {
    lines.push('- 暂无已确认的 required Provider 就绪事实；运行标准 Runtime Setup 完成 CodeGraph/Graphify 准备。');
  } else {
    for (const provider of payload.provider_readiness) {
      lines.push(`- ${provider.provider || provider.id || 'unknown'}: ${provider.readiness_status || 'unknown'} (${provider.reason_code || 'not-reported'})`);
    }
  }

  lines.push('', '后续操作');
  for (const action of payload.next_actions || diagnosticNextActions(payload)) lines.push(`- ${action}`);
  return `${lines.join('\n')}\n`;
}

function appendItems(lines, items) {
  if (!Array.isArray(items) || items.length === 0) {
    lines.push('- 暂无报告项。');
    return;
  }
  for (const item of items) {
    lines.push(`- ${item.id}: ${item.result || item.dependency_status || 'unknown'} (${item.reason_code || 'not-reported'})${item.next_action ? ` -> ${item.next_action}` : ''}`);
  }
}

module.exports = {
  advisoryHostCandidates,
  diagnosticNextActions,
  renderDiagnosticHuman,
};
