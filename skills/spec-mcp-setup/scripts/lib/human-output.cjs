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

function diagnosticNextActions(payload = {}) {
  const actions = ['运行 spec-mcp-setup --verify-only，刷新已确认的设置事实。'];
  const project = payload.project || {};
  if (project.inside_git_repo && (
    project.example_config_status !== 'ok'
    || project.local_config_gitignore_status === 'missing'
  )) {
    actions.push('运行 spec-mcp-setup --project-config，预览并写入项目本地设置。');
  }
  actions.push('必需设置项就绪后，继续目标 spec-* workflow。');
  return actions;
}

function renderDiagnosticHuman(payload, pluginVersion) {
  const lines = [];
  if (pluginVersion) lines.push(`Spec-First 版本 v${pluginVersion}`, '');
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
    lines.push('- 暂无已确认的 Provider 就绪事实；可选 Provider 必须显式选择。');
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
