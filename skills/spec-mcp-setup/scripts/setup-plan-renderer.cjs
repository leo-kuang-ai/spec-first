#!/usr/bin/env node
'use strict';

const path = require('node:path');
const fs = require('node:fs');

const REVIEW_RISK_FLAGS = [
  'unpinned-npx',
  'global-npx-execution',
  'global-npm-install',
  'global-cargo-install',
  'global-install',
  'browser-runtime-install',
  'unpinned-latest',
];

const SKILL_DIR = path.resolve(__dirname, '..');
const MCP_TOOLS_JSON = path.join(SKILL_DIR, 'mcp-tools.json');
const PROVIDER_TOOLS_JSON = path.join(SKILL_DIR, 'provider-tools.json');
const HELPER_TOOLS_JSON = path.join(SKILL_DIR, 'helper-tools.json');

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_error) {
    return fallback;
  }
}

function dependencyFor(registry, ref) {
  const dependencies = registry && Array.isArray(registry.external_dependencies)
    ? registry.external_dependencies
    : [];
  return dependencies.find((dependency) => dependency && dependency.id === ref) || null;
}

function hydrateTool(registry, tool) {
  if (!tool || typeof tool !== 'object') return tool;
  const dependency = dependencyFor(registry, tool.dependency_ref || tool.id) || {};
  return {
    ...tool,
    package: tool.package || dependency.package || '',
    version: tool.version || dependency.version || '',
  };
}

function hydrateProvider(mcpRegistry, provider) {
  if (!provider || typeof provider !== 'object') return provider;
  const installation = provider.installation && typeof provider.installation === 'object'
    ? provider.installation
    : {};
  const dependency = dependencyFor(mcpRegistry, installation.dependency_ref || provider.id) || {};
  return {
    ...provider,
    installation: {
      ...installation,
      ecosystem: installation.ecosystem || dependency.ecosystem || '',
      package: installation.package || dependency.package || '',
      version_pin: installation.version_pin || dependency.version || '',
    },
  };
}

function expandDependencyTemplate(value, installation = {}) {
  return String(value || '')
    .replace(/\{\{package\}\}/g, installation.package || '')
    .replace(/\{\{version\}\}/g, installation.version_pin || '');
}

function expandProviderTemplates(provider) {
  const installation = provider.installation || {};
  const commandsDisplay = {};
  for (const [key, value] of Object.entries(installation.commands_display || {})) {
    commandsDisplay[key] = expandDependencyTemplate(value, installation);
  }
  return {
    ...provider,
    installation: {
      ...installation,
      commands_display: commandsDisplay,
      next_action: expandDependencyTemplate(installation.next_action, installation),
    },
    safety: {
      ...(provider.safety || {}),
      install_effect: expandDependencyTemplate(provider.safety && provider.safety.install_effect, installation),
    },
  };
}

function providerPackageSpec(installation = {}) {
  if (!installation.package || !installation.version_pin) return '';
  if (installation.ecosystem === 'npm') {
    return `${installation.package}@${installation.version_pin}`;
  }
  return `${installation.package}==${installation.version_pin}`;
}

function loadHelperRegistry() {
  return {
    registry: readJson(HELPER_TOOLS_JSON, { helpers: [] }),
  };
}

function parseArgs(argv) {
  const args = {
    mode: 'plan',
    only: '',
    repoRoot: process.cwd(),
    requirementWorkspace: '',
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--mode') {
      args.mode = argv[index + 1] || args.mode;
      index += 1;
    } else if (arg === '--only') {
      args.only = argv[index + 1] || '';
      index += 1;
    } else if (arg === '--repo-root') {
      args.repoRoot = argv[index + 1] || args.repoRoot;
      index += 1;
    } else if (arg === '--requirement-workspace') {
      args.requirementWorkspace = argv[index + 1] || '';
      index += 1;
    }
  }
  return args;
}

function splitCsv(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function safetyResult(helper) {
  const flags = helper.safety && Array.isArray(helper.safety.risk_flags) ? helper.safety.risk_flags : [];
  const source = helper.safety && helper.safety.source;
  const pinStatus = helper.safety && helper.safety.version_policy && helper.safety.version_policy.pin_status;
  if (!source || !pinStatus) {
    return { safety_result: 'blocked', reason_code: 'missing-install-safety-metadata' };
  }
  if (flags.includes('installer-script') || flags.includes('unknown-source')) {
    return { safety_result: 'blocked', reason_code: flags.includes('installer-script') ? 'installer-script' : 'unknown-source' };
  }
  if (helper.installation && helper.installation.strategy === 'manual') {
    return { safety_result: 'unsupported', reason_code: 'manual-install-only' };
  }
  // review-required 由 registry 显式 review_required 或具体高风险 flag 决定,
  // reason_code 取命中的真实 flag(机械事实),不兜底成与来源不符的 global-install。
  // pin_status 的风险已由各 helper 的 unpinned-* flag 显式编码,不在此处用 latest 一刀切。
  const matchedFlag = REVIEW_RISK_FLAGS.find((flag) => flags.includes(flag));
  if (helper.safety.review_required) {
    return { safety_result: 'review-required', reason_code: matchedFlag || 'review-required-by-registry' };
  }
  if (matchedFlag) {
    return { safety_result: 'review-required', reason_code: matchedFlag };
  }
  return { safety_result: 'safe', reason_code: 'install-safety-ready' };
}

function providerSafetyResult(safety = {}) {
  const flags = Array.isArray(safety.risk_flags) ? safety.risk_flags : [];
  if (!safety.source) {
    return { safety_result: 'blocked', reason_code: 'missing-install-safety-metadata' };
  }
  if (flags.includes('installer-script') || flags.includes('unknown-source')) {
    return { safety_result: 'blocked', reason_code: flags.includes('installer-script') ? 'installer-script' : 'unknown-source' };
  }
  const matchedFlag = REVIEW_RISK_FLAGS.find((flag) => flags.includes(flag));
  if (safety.review_required || matchedFlag) {
    return { safety_result: 'review-required', reason_code: matchedFlag || 'review-required-by-registry' };
  }
  return { safety_result: 'safe', reason_code: 'install-safety-ready' };
}

function toPosix(value) {
  return String(value || '').replace(/\\/g, '/');
}

function resolveGraphifyScope(repoRoot, requirementWorkspace) {
  const raw = toPosix(requirementWorkspace).trim();
  const artifactRoot = 'graphify-out';
  if (!raw) {
    return {
      ok: true,
      input_scope: '.',
      requirement_workspace_path: '.',
      artifact_root: artifactRoot,
      first_generation_next_action: null,
    };
  }
  if (raw.startsWith('/')) {
    return {
      ok: false,
      input_scope: raw,
      requirement_workspace_path: null,
      artifact_root: artifactRoot,
      first_generation_next_action: 'requirement-workspace-absolute',
    };
  }
  if (raw.split('/').includes('..')) {
    return {
      ok: false,
      input_scope: raw,
      requirement_workspace_path: null,
      artifact_root: artifactRoot,
      first_generation_next_action: 'requirement-workspace-escape',
    };
  }
  const workspaceAbs = path.resolve(repoRoot, raw);
  const repoAbs = path.resolve(repoRoot);
  if (!workspaceAbs.startsWith(`${repoAbs}${path.sep}`) && workspaceAbs !== repoAbs) {
    return {
      ok: false,
      input_scope: raw,
      requirement_workspace_path: null,
      artifact_root: artifactRoot,
      first_generation_next_action: 'requirement-workspace-escape',
    };
  }
  if (!require('node:fs').existsSync(workspaceAbs)) {
    return {
      ok: false,
      input_scope: raw,
      requirement_workspace_path: raw,
      artifact_root: artifactRoot,
      first_generation_next_action: 'requirement-workspace-missing',
    };
  }
  return {
    ok: true,
    input_scope: raw,
    requirement_workspace_path: raw,
    artifact_root: artifactRoot,
    first_generation_next_action: null,
  };
}

function optionalMcpProviders(mcpRegistry, repoRoot) {
  return (mcpRegistry.tools || [])
    .filter((tool) => tool.required !== true)
    .filter((tool) => tool.opt_in && tool.opt_in.explicit_consent_required === true)
    .map((tool) => hydrateTool(mcpRegistry, tool))
    .map((tool) => {
      const safety = providerSafetyResult(tool.safety || {});
      const packageSpec = tool.package && tool.version ? `${tool.package}@${tool.version}` : tool.package || tool.id;
      return {
        provider: tool.id,
        name: tool.name || tool.summary_label || tool.id,
        kind: tool.provider_readiness && tool.provider_readiness.kind ? tool.provider_readiness.kind : 'generic',
        profile: tool.provider_readiness && tool.provider_readiness.profile ? tool.provider_readiness.profile : 'optional',
        route: 'install-mcp',
        install_route: 'install-mcp',
        native_interfaces: (tool.provider_readiness && tool.provider_readiness.native_interfaces) || ['mcp'],
        package_spec: packageSpec,
        install_commands_display: [
          `npm install -g ${packageSpec}`,
          'host config: codegraph serve --mcp',
          'project bootstrap: codegraph init',
          'project status: codegraph status',
        ],
        writes_display: {
          host_config: true,
          project_artifacts: ['.codegraph/'],
          tool_install_root: null,
          cache_root: '.spec-first/cache',
          artifact_root: '.codegraph',
        },
        workspace_root: repoRoot,
        tool_install_root: null,
        cache_root: path.join(repoRoot, '.spec-first', 'cache'),
        artifact_root: path.join(repoRoot, '.codegraph'),
        first_generation_display: `cd ${repoRoot} && codegraph init && codegraph status; if status requests full rebuild, setup runs codegraph sync first and may run one codegraph index -f repair`,
        auto_refresh_display: 'codegraph serve --mcp Auto-Sync watcher (provider-owned; default debounce about 2s)',
        will_not_do: [
          'will not treat CodeGraph output as confirmed source truth',
        ],
        risk_flags: (tool.safety && tool.safety.risk_flags) || [],
        source: tool.safety && tool.safety.source,
        pin_status: tool.version ? 'pinned' : 'unknown',
        review_required: Boolean(tool.safety && tool.safety.review_required),
        ...safety,
      };
    });
}

function helperProviders(providerRegistry, mcpRegistry, repoRoot, requirementWorkspace) {
  return (providerRegistry.providers || [])
    .filter((provider) => provider.install_route === 'install-helpers')
    .map((provider) => expandProviderTemplates(hydrateProvider(mcpRegistry, provider)))
    .map((provider) => {
      const scope = provider.id === 'graphify'
        ? resolveGraphifyScope(repoRoot, requirementWorkspace)
        : {
            ok: true,
            input_scope: requirementWorkspace || '.',
            requirement_workspace_path: requirementWorkspace || '.',
            artifact_root: null,
            first_generation_next_action: null,
          };
      const safety = providerSafetyResult(provider.safety || {});
      const packageSpec = providerPackageSpec(provider.installation) || provider.id;
      return {
        provider: provider.id,
        name: provider.name || provider.id,
        kind: provider.kind || 'generic',
        profile: provider.profile || 'optional',
        route: provider.install_route,
        install_route: provider.install_route,
        native_interfaces: provider.native_interfaces || [],
        install_commands_display: provider.installation && provider.installation.commands_display
          ? provider.installation.commands_display
          : {},
        writes_display: {
          host_config: false,
          provider_runtime: [
            '.codex/skills/graphify/',
            '.codex/hooks.json',
            'AGENTS.md',
            '.claude/skills/graphify/',
            'CLAUDE.md',
            '.graphify_version',
          ],
          project_artifacts: [scope.artifact_root, '.git/hooks/post-commit', '.git/hooks/post-checkout'].filter(Boolean),
          tool_install_root: null,
          cache_root: null,
          artifact_root: scope.artifact_root,
        },
        workspace_root: repoRoot,
        tool_install_root: null,
        cache_root: null,
        artifact_root: scope.artifact_root ? path.join(repoRoot, scope.artifact_root) : null,
        requirement_workspace_path: scope.requirement_workspace_path,
        first_generation_display: scope.ok
          ? 'resolved graphify CLI -> verify/install current-host project skill; if graphify-out exists, verify install state and recommend incremental --refresh; otherwise graphify extract .; explicit --refresh runs graphify update . code-only/no-LLM (if provider refuses overwrite and suggests --force, one graphify update . --force repair)'
          : `skipped: ${scope.first_generation_next_action}`,
        auto_refresh_display: scope.ok
          ? 'resolved graphify CLI -> graphify hook install (git repo only; provider-owned post-commit/post-checkout refresh)'
          : `skipped: ${scope.first_generation_next_action}`,
        command_visibility_display: 'setup resolves graphify from the original PATH or provider-standard/npm global bin candidates; after npm install/upgrade, a stale PATH symlink may be backed up and repointed to the pinned CLI, while ordinary files stay report-only.',
        instruction_section_display: 'after provider project install, setup normalizes the AGENTS.md/CLAUDE.md ## graphify section to resolved CLI/manual-visibility/direct-source-fallback wording.',
        first_generation_next_action: scope.first_generation_next_action,
        package_spec: packageSpec,
        will_not_do: [
          'will not install Graphify MCP server',
          'will not start graphify watch',
          'setup uses scriptable graphify extract for first generation instead of assistant command syntax',
          'will not auto-add or auto-commit graphify-out',
          'will not promote generated artifacts to docs or source truth',
        ],
        risk_flags: (provider.safety && provider.safety.risk_flags) || [],
        source: provider.safety && provider.safety.source,
        pin_status: provider.safety && provider.safety.version_policy && provider.safety.version_policy.pin_status,
        review_required: Boolean(provider.safety && provider.safety.review_required),
        install_effect: provider.safety && provider.safety.install_effect,
        usage_display: '$graphify . / /graphify . after the provider project skill is installed; setup uses the resolved CLI path for extract/update/query/hook operations and reports when bare graphify is not on PATH.',
        gitignore_policy: 'spec-first init managed block ignores .codegraph/ and the whole graphify-out/ provider artifact directory; setup does not auto-add, auto-commit, or promote Graphify output to source truth.',
        ...safety,
      };
    });
}

function selectionSource(args) {
  if (args.only) return 'explicit-only';
  if (args.mode === 'guided-apply' || args.mode === 'guided-confirm') return 'bare-default-provider-pack';
  return 'plan-default-provider-pack';
}

function buildProviderSelection(args) {
  const repoRoot = path.resolve(args.repoRoot || process.cwd());
  const mcpRegistry = readJson(MCP_TOOLS_JSON, { tools: [] });
  const providerRegistry = readJson(PROVIDER_TOOLS_JSON, { providers: [] });
  const providers = [
    ...optionalMcpProviders(mcpRegistry, repoRoot),
    ...helperProviders(providerRegistry, mcpRegistry, repoRoot, args.requirementWorkspace),
  ];
  const validIds = new Set([
    ...(mcpRegistry.tools || []).map((tool) => tool.id),
    ...providers.map((provider) => provider.provider),
  ]);
  const selectedIds = splitCsv(args.only);
  const unknown = selectedIds.filter((id) => !validIds.has(id));
  const selectedSet = new Set(selectedIds.length > 0 ? selectedIds : providers.map((provider) => provider.provider));
  const source = selectionSource(args);
  return {
    selection_source: source,
    selected_ids: providers.filter((provider) => selectedSet.has(provider.provider)).map((provider) => provider.provider),
    unknown_ids: unknown,
    requires_confirmation: false,
    confirmation_prompt: null,
    workspace_root: repoRoot,
    provider_selection: providers.map((provider) => ({
      ...provider,
      selected: selectedSet.has(provider.provider),
      selection_source: selectedSet.has(provider.provider) ? source : 'not-selected',
      requires_confirmation: false,
    })),
    blocked: unknown.map((id) => ({
      id,
      reason_code: 'unknown-optional-provider-selection',
      next_action: 'Use one of: codegraph,graphify',
    })),
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const { registry } = loadHelperRegistry(path.resolve(__dirname, '..', '..', '..'));
  const planned_operations = registry.helpers.map((helper) => {
    const safety = safetyResult(helper);
    return {
      id: helper.id,
      kind: helper.kind,
      // 展示/审批用近似命令(来自 registry 静态串)。执行真相源是 install-helpers.sh
      // 的 run_install_command(环境感知:包管理器探测、brew upgrade 包装、mirror fallback)。
      // 字段名显式标注 display,避免消费端把它当成实际执行命令。
      install_commands_display: helper.installation.commands,
      risk_flags: helper.safety.risk_flags,
      source: helper.safety.source,
      pin_status: helper.safety.version_policy.pin_status,
      review_required: helper.safety.review_required,
      install_effect: helper.safety.install_effect,
      ...safety,
    };
  });
  const providerPlan = buildProviderSelection(args);
  process.stdout.write(`${JSON.stringify({
    schema_version: 'setup-install-plan.v1',
    mode: args.mode,
    mutation: args.mode === 'plan' ? false : null,
    overall_status: providerPlan.blocked.length > 0 ? 'action-required' : 'ready',
    reason_code: providerPlan.blocked.length > 0 ? 'unknown-optional-provider-selection' : 'setup-install-plan-ready',
    optional_provider_selection: {
      selection_source: providerPlan.selection_source,
      selected_ids: providerPlan.selected_ids,
      unknown_ids: providerPlan.unknown_ids,
      requires_confirmation: providerPlan.requires_confirmation,
      confirmation_prompt: providerPlan.confirmation_prompt,
      workspace_root: providerPlan.workspace_root,
      blocked: providerPlan.blocked,
    },
    provider_selection: providerPlan.provider_selection,
    planned_operations,
  }, null, 2)}\n`);
  if (providerPlan.blocked.length > 0) {
    process.exitCode = 1;
  }
}

main();
