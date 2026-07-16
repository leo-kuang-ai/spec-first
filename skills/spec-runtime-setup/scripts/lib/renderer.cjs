'use strict';

const REVIEW_RISK_FLAGS = new Set([
  'unpinned-npx',
  'global-npx-execution',
  'global-npm-install',
  'global-cargo-install',
  'global-install',
  'browser-runtime-install',
  'unpinned-latest',
]);

function renderInstallPlan(plan = {}) {
  const blocked = plan.blocked === true;
  const selectedIds = selectedProviderIds(plan);
  const safety = Array.isArray(plan.safety) ? plan.safety.map((entry) => ({ ...entry })) : [];
  const plannedOperations = normalizePlannedOperations(plan.actions, safety);
  const providerSelection = normalizeProviderSelection(plan, selectedIds, safety, plannedOperations);
  return {
    schema_version: 'setup-install-plan.v1',
    generated_at: new Date().toISOString(),
    mutation: false,
    blocked,
    overall_status: plan.overall_status || (blocked ? 'action-required' : 'ready'),
    reason_code: plan.reason_code || null,
    mode: plan.mode || 'plan',
    optional_provider_selection: normalizeOptionalProviderSelection(plan, selectedIds, blocked),
    provider_selection: providerSelection,
    planned_operations: plannedOperations,
    safety,
    target: plan.target || null,
    host: plan.host || null,
    next_action: plan.next_action || null,
  };
}

function selectedProviderIds(plan) {
  const explicit = Array.isArray(plan.selected_ids)
    ? plan.selected_ids
    : (plan.optional_provider_selection && Array.isArray(plan.optional_provider_selection.selected_ids)
      ? plan.optional_provider_selection.selected_ids
      : []);
  const fromSelection = Array.isArray(plan.provider_selection)
    ? plan.provider_selection.flatMap((entry) => {
      if (typeof entry === 'string') return [entry];
      if (entry && entry.selected === true) return [entry.provider || entry.id].filter(Boolean);
      return [];
    })
    : [];
  const unknownIds = new Set([
    ...(Array.isArray(plan.unknown_ids) ? plan.unknown_ids : []),
    ...((plan.optional_provider_selection && Array.isArray(plan.optional_provider_selection.unknown_ids))
      ? plan.optional_provider_selection.unknown_ids
      : []),
  ].map(String));
  return [...new Set([...explicit, ...fromSelection].map(String).filter(Boolean))]
    .filter((id) => !unknownIds.has(id));
}

function normalizeOptionalProviderSelection(plan, selectedIds, blocked) {
  const source = plan.optional_provider_selection && typeof plan.optional_provider_selection === 'object'
    ? plan.optional_provider_selection
    : {};
  const unknownIds = Array.isArray(source.unknown_ids)
    ? source.unknown_ids
    : (Array.isArray(plan.unknown_ids) ? plan.unknown_ids : []);
  const blockedEntries = Array.isArray(source.blocked)
    ? source.blocked
    : (blocked
      ? unknownIds.map((id) => ({
        id,
        reason_code: plan.reason_code || 'unknown-optional-provider-selection',
        next_action: plan.next_action || null,
      }))
      : []);
  return {
    selection_source: source.selection_source
      || plan.selection_source
      || (selectedIds.length > 0 ? 'explicit-only' : 'plan-diagnose'),
    selected_ids: selectedIds,
    unknown_ids: unknownIds,
    requires_confirmation: source.requires_confirmation === true,
    confirmation_prompt: source.confirmation_prompt || null,
    workspace_root: source.workspace_root
      || (plan.target && (plan.target.workspace_root || plan.target.target_root))
      || null,
    blocked: blockedEntries,
  };
}

function normalizeProviderSelection(plan, selectedIds, safety, plannedOperations) {
  const selected = new Set(selectedIds);
  const supplied = Array.isArray(plan.provider_selection)
    ? plan.provider_selection.filter((entry) => entry && typeof entry === 'object')
    : [];
  const suppliedById = new Map(supplied.map((entry) => [entry.provider || entry.id, entry]));
  const providerIds = new Set([
    ...selectedIds,
    ...suppliedById.keys(),
    ...plannedOperations.map((entry) => entry.provider).filter(Boolean),
  ]);
  return [...providerIds].map((id) => {
    const detail = suppliedById.get(id) || {};
    const safetyEntry = safety.find((entry) => entry.id === id || entry.provider === id) || {};
    const isSelected = Object.prototype.hasOwnProperty.call(detail, 'selected')
      ? detail.selected === true
      : selected.has(id);
    return {
      ...detail,
      provider: id,
      selected: isSelected,
      selection_source: detail.selection_source
        || plan.selection_source
        || (isSelected ? 'explicit-only' : 'not-selected'),
      requires_confirmation: detail.requires_confirmation === true,
      ...installSafetyFields(safetyEntry),
      planned_operations: plannedOperations.filter((entry) => entry.provider === id),
    };
  });
}

function normalizePlannedOperations(actions, safety) {
  return (Array.isArray(actions) ? actions : []).map((entry) => {
    const id = entry.id || entry.provider || entry.helper || entry.tool || entry.kind || 'unknown';
    const safetyEntry = safety.find((candidate) => candidate.id === id || candidate.provider === id) || {};
    const actionReasonCode = entry.reason_code || null;
    const safetyFields = installSafetyFields(safetyEntry);
    return {
      ...entry,
      id,
      install_commands_display: entry.install_commands_display || (entry.command
        ? [{ command: entry.command, args: Array.isArray(entry.args) ? [...entry.args] : [] }]
        : []),
      action_reason_code: actionReasonCode,
      ...safetyFields,
    };
  });
}

function installSafetyFields(source = {}) {
  const riskFlags = Array.isArray(source.risk_flags) ? [...source.risk_flags] : [];
  const pinStatus = source.pin_status
    || (source.version_policy && source.version_policy.pin_status)
    || null;
  let safetyResult = source.safety_result || null;
  let reasonCode = source.safety_reason_code || null;
  if (!safetyResult) {
    if (Object.keys(source).length === 0) {
      safetyResult = 'not-applicable';
      reasonCode = 'install-safety-not-applicable';
    } else if (!source.source || !pinStatus) {
      safetyResult = 'blocked';
      reasonCode = 'missing-install-safety-metadata';
    } else if (riskFlags.includes('installer-script') || riskFlags.includes('unknown-source')) {
      safetyResult = 'blocked';
      reasonCode = riskFlags.includes('installer-script') ? 'installer-script' : 'unknown-source';
    } else {
      const matchedFlag = riskFlags.find((flag) => REVIEW_RISK_FLAGS.has(flag));
      if (source.review_required === true || matchedFlag) {
        safetyResult = 'review-required';
        reasonCode = matchedFlag || 'review-required-by-registry';
      } else {
        safetyResult = 'safe';
        reasonCode = 'install-safety-ready';
      }
    }
  }
  return {
    risk_flags: riskFlags,
    source: source.source || null,
    pin_status: pinStatus,
    review_required: source.review_required === true,
    install_effect: source.install_effect || null,
    safety_result: safetyResult,
    reason_code: reasonCode,
  };
}

function renderDiagnostic({ preflight, snapshot, target, host } = {}) {
  return {
    schema_version: 'spec-runtime-setup-preflight.v2',
    generated_at: new Date().toISOString(),
    target: target || null,
    host: host || null,
    mcp_servers: preflight && Array.isArray(preflight.mcp_servers) ? preflight.mcp_servers : [],
    tools: preflight && Array.isArray(preflight.tools) ? preflight.tools : [],
    skills: preflight && Array.isArray(preflight.skills) ? preflight.skills : [],
    project: preflight && preflight.project ? preflight.project : {},
    legacy: preflight && preflight.legacy ? preflight.legacy : {},
    runtime: snapshot || null,
    generated_runtime_manifest: snapshot ? snapshot.generated_runtime_manifest : null,
    provider_readiness: snapshot ? snapshot.provider_readiness : [],
    configured_dependencies: snapshot ? snapshot.configured_dependencies : [],
  };
}

function renderHumanSummary(
  { toolFacts = {}, runtimeCapabilities = {} } = {},
  { executionSummary } = {},
) {
  const summary = runtimeCapabilities.setup_summary || {};
  const manifest = summary.generated_runtime_manifest || {};
  const execution = executionSummary || deriveExecutionSummary({ toolFacts, summary, manifest });
  const selected = (execution.selected_ids || []).join(', ') || 'none';
  const required = (execution.required_provider_ids || []).join(', ') || 'none';
  const lines = [
    '执行结果',
    `- 整体状态：${execution.overall_status} (${execution.reason_code})`,
    `- 执行范围：${execution.scope}；selected=${selected}；required=${required}`,
    `- 必需 MCP/helper 依赖：${summary.baseline_ready === true ? 'ready' : 'action-required'}`,
    `- Host runtime 配置：${summary.host_runtime_ready === true ? 'ready' : 'action-required'}`,
    `- Generated runtime manifest：${manifest.status || 'unknown'}${manifest.reason_code ? ` (${manifest.reason_code})` : ''}`,
    '',
    'MCP server / Helper 工具',
  ];
  for (const item of toolFacts.items || []) {
    const nextAction = item.result !== 'ready' && item.next_action ? ` -> ${item.next_action}` : '';
    lines.push(`- ${item.id} [${item.kind}]: ${item.result} (${item.reason_code})${nextAction}`);
    if (item.config_path && item.reason_code && item.reason_code.includes('host-config')) {
      lines.push(`  config: ${item.config_path}${item.config_key ? ` key=${item.config_key}` : ''}`);
    }
    if (Array.isArray(item.conflict_fields) && item.conflict_fields.length > 0) {
      lines.push(`  conflict_fields: ${item.conflict_fields.join(', ')}`);
    }
    if (item.blocking_path) {
      lines.push(`  blocking: ${item.blocking_path}${item.blocking_scope ? ` scope=${item.blocking_scope}` : ''}`);
    }
  }
  lines.push('', 'Provider 工具');
  for (const provider of toolFacts.provider_readiness || []) {
    const status = provider.readiness_status || 'unknown';
    const reasonCode = provider.reason_code || (status === 'fresh' ? 'ready' : 'unknown');
    lines.push(`- ${provider.provider || provider.id}: ${status} (${reasonCode})`);
    const steadyState = provider.steady_state || {};
    if (steadyState.hook_status) {
      if (steadyState.hook_status === 'blocked') {
        lines.push(`  optional_auto_refresh: unavailable-by-project-boundary; refresh=${steadyState.refresh_mode || 'manual-only'}; external_hook_execution=unverified; hook_fact=blocked${steadyState.hook_skipped_reason ? ` (${steadyState.hook_skipped_reason})` : ''}`);
      } else {
        lines.push(`  steady_state: refresh=${steadyState.refresh_mode || 'unknown'}; project_hook=${steadyState.hook_status}${steadyState.hook_skipped_reason ? ` (${steadyState.hook_skipped_reason})` : ''}`);
      }
    }
  }
  lines.push('', 'Host 已配置依赖');
  for (const dependency of toolFacts.configured_dependencies || []) {
    lines.push(`- ${dependency.id}: ${dependency.result} (${dependency.reason_code})`);
  }
  lines.push('', '后续步骤');
  const nextActions = [];
  if (manifest.status === 'stale' || manifest.status === 'missing') {
    nextActions.push('对所选 topology 运行 spec-first init，然后重新运行 spec-runtime-setup --verify-only。');
  }
  for (const item of toolFacts.items || []) {
    if (item.result !== 'ready' && item.next_action) nextActions.push(item.next_action);
  }
  for (const provider of toolFacts.provider_readiness || []) {
    const hookBlocked = provider.steady_state && provider.steady_state.hook_status === 'blocked';
    if (provider.readiness_status === 'fresh' && !hookBlocked) continue;
    for (const action of provider.next_actions || []) {
      if (action) nextActions.push(action);
    }
  }
  if (execution.overall_status === 'partial') {
    nextActions.push('当前仅完成 selected subset；运行标准 spec-runtime-setup 完成全部 required items，然后运行 spec-runtime-setup --verify-only 复核。');
  } else if (execution.overall_status === 'action-required' && nextActions.length === 0) {
    nextActions.push('修复上述 action-required 项后，重新运行 spec-runtime-setup --verify-only。');
  }
  for (const action of [...new Set(nextActions)]) lines.push(`- ${action}`);
  if (execution.overall_status === 'ready') {
    lines.push('- 继续目标 spec-* workflow。');
  }
  return `${lines.join('\n')}\n`;
}

function deriveExecutionSummary({ toolFacts, summary, manifest }) {
  const itemActionRequired = (toolFacts.items || []).some((item) => item.result === 'action-required');
  const providerActionRequired = (toolFacts.provider_readiness || []).some((provider) => (
    ['degraded', 'failed', 'blocked'].includes(provider.readiness_status)
  ));
  const actionRequired = summary.baseline_ready !== true
    || summary.host_runtime_ready !== true
    || ['stale', 'missing'].includes(manifest.status)
    || itemActionRequired
    || providerActionRequired;
  return {
    overall_status: actionRequired ? 'action-required' : 'ready',
    reason_code: actionRequired ? 'setup-action-required' : 'setup-ready',
    scope: 'full',
    selected_ids: [],
    required_provider_ids: [],
  };
}

function renderJson(payload) {
  return `${JSON.stringify(payload, null, 2)}\n`;
}

function renderBlocked(plan) {
  return renderInstallPlan({
    ...plan,
    blocked: true,
    overall_status: 'action-required',
    reason_code: plan.reason_code || 'setup-plan-blocked',
    actions: [],
  });
}

module.exports = {
  renderBlocked,
  renderDiagnostic,
  renderHumanSummary,
  renderInstallPlan,
  renderJson,
};
