#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const skillDir = path.resolve(__dirname, '..');
const providerRegistryPath = path.join(skillDir, 'provider-tools.json');
const mcpToolsPath = path.join(skillDir, 'mcp-tools.json');

function readJson(filePath, fallback = null) {
  if (!filePath) return fallback;
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
  return {
    ...provider,
    installation: {
      ...installation,
      next_action: expandDependencyTemplate(installation.next_action, installation),
    },
    safety: {
      ...(provider.safety || {}),
      install_effect: expandDependencyTemplate(provider.safety && provider.safety.install_effect, installation),
    },
    usage_note: expandDependencyTemplate(provider.usage_note, installation),
  };
}

function hydrateProviderRegistry(providerRegistry, mcpRegistry) {
  return {
    ...providerRegistry,
    providers: (providerRegistry.providers || [])
      .map((provider) => expandProviderTemplates(hydrateProvider(mcpRegistry, provider))),
  };
}

function parseArgs(argv) {
  const args = {
    source: 'helper',
    repoRoot: process.cwd(),
    factsFile: '',
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--source') {
      args.source = argv[index + 1] || args.source;
      index += 1;
    } else if (arg === '--repo-root') {
      args.repoRoot = argv[index + 1] || args.repoRoot;
      index += 1;
    } else if (arg === '--facts-file') {
      args.factsFile = argv[index + 1] || '';
      index += 1;
    }
  }
  return args;
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function isExecutable(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return false;
  try {
    fs.accessSync(filePath, fs.constants.X_OK);
    return true;
  } catch (_error) {
    return process.platform === 'win32';
  }
}

function commandFromPath(command, pathValue = process.env.PATH) {
  if (!command) return false;
  if (process.platform === 'win32') {
    const pathEntries = String(pathValue || '').split(path.delimiter).filter(Boolean);
    const hasExtension = Boolean(path.extname(command));
    const extensions = hasExtension
      ? ['']
      : String(process.env.PATHEXT || '.COM;.EXE;.BAT;.CMD')
        .split(';')
        .map((entry) => entry.trim())
        .filter(Boolean);
    for (const entry of pathEntries) {
      for (const extension of extensions) {
        const candidate = path.join(entry, `${command}${extension}`);
        if (isExecutable(candidate)) return candidate;
      }
    }
    return null;
  }
  const result = spawnSync('/bin/sh', ['-lc', `command -v ${shellQuote(command)}`], {
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: pathValue || '',
    },
  });
  if (result.status !== 0) return null;
  return String(result.stdout || '').trim().split(/\r?\n/).find(Boolean) || command;
}

function knownCommandCandidates(command) {
  if (command !== 'graphify') return [];
  const home = process.env.HOME || process.env.USERPROFILE || os.homedir();
  const candidates = [];
  if (home) {
    candidates.push(path.join(home, '.local', 'bin', command));
    candidates.push(path.join(home, '.local', 'bin', `${command}.exe`));
    candidates.push(path.join(home, '.local', 'bin', `${command}.cmd`));
  }
  return candidates;
}

function resolveCommand(command) {
  const originalPath = process.env.SPEC_FIRST_PROVIDER_ORIGINAL_PATH || process.env.PATH || '';
  const pathCommand = commandFromPath(command, originalPath);
  if (pathCommand) {
    return { found: true, command: pathCommand, onPath: true };
  }
  for (const candidate of knownCommandCandidates(command)) {
    if (isExecutable(candidate)) {
      return { found: true, command: candidate, onPath: false };
    }
  }
  return { found: false, command: command || '', onPath: false };
}

function setupWorkflowCommand(host, args = '') {
  const suffix = args ? ` ${args}` : '';
  if (host === 'claude') return `/spec:mcp-setup${suffix}`;
  if (host === 'codex') return `$spec-mcp-setup${suffix}`;
  if (host === 'kiro') return `Kiro Agent Skill spec-mcp-setup${suffix}`;
  if (host === 'qoder') return `Qoder project command /spec:mcp-setup or Skill spec-mcp-setup${suffix}`;
  return `/spec:mcp-setup${suffix} or $spec-mcp-setup${suffix}`;
}

function commandExists(command) {
  return resolveCommand(command).found;
}

function runResolved(commandInfo, args = [], options = {}) {
  if (!commandInfo || !commandInfo.found) {
    return { status: 127, stdout: '', stderr: '' };
  }
  return spawnSync(commandInfo.command, args, {
    cwd: options.cwd,
    env: process.env,
    encoding: 'utf8',
  });
}

function envFlag(name) {
  return ['1', 'true', 'yes', 'ready'].includes(String(process.env[name] || '').toLowerCase());
}

function currentProviderHost() {
  const value = String(process.env.SPEC_FIRST_PROVIDER_HOST || '').toLowerCase();
  if (value === 'claude' || value === 'codex' || value === 'kiro' || value === 'qoder') return value;
  return 'codex';
}

function versionOutputMatchesExpected(expected, output) {
  if (!expected) return true;
  const escaped = String(expected).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^0-9A-Za-z.])${escaped}([^0-9A-Za-z.]|$)`).test(String(output || ''));
}

function selfReportedStatus(providerId) {
  const envName = `SPEC_FIRST_PROVIDER_${providerId.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_SELF_REPORTED_STATUS`;
  const value = String(process.env[envName] || '').toLowerCase();
  if (value === 'stale') return 'stale';
  if (value === 'fresh') return 'unknown';
  if (value === 'degraded') return 'degraded';
  return 'unknown';
}

function envValue(providerId, suffix) {
  const envName = `SPEC_FIRST_PROVIDER_${providerId.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${suffix}`;
  return process.env[envName];
}

function envFirstGenerationOverrides(providerId) {
  const status = envValue(providerId, 'FIRST_GENERATION_STATUS');
  const requirementWorkspacePath = envValue(providerId, 'REQUIREMENT_WORKSPACE_PATH');
  const artifactRoot = envValue(providerId, 'ARTIFACT_ROOT');
  const artifactRef = envValue(providerId, 'ARTIFACT_REF');
  const nextAction = envValue(providerId, 'FIRST_GENERATION_NEXT_ACTION');
  const overrides = {};
  if (status) overrides.firstGenerationStatus = status;
  if (requirementWorkspacePath) overrides.requirementWorkspacePath = requirementWorkspacePath;
  if (artifactRoot) overrides.artifactRoot = artifactRoot;
  if (artifactRef) overrides.artifactRefs = [artifactRef];
  if (nextAction) overrides.firstGenerationNextAction = nextAction;
  return overrides;
}

function envHookOverrides(providerId) {
  const installed = envValue(providerId, 'HOOK_INSTALLED');
  const verified = envValue(providerId, 'HOOK_VERIFIED');
  const status = envValue(providerId, 'HOOK_STATUS');
  const skippedReason = envValue(providerId, 'HOOK_SKIPPED_REASON');
  const overrides = {};
  if (installed !== undefined) overrides.hookInstalled = envFlag(`SPEC_FIRST_PROVIDER_${providerId.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_HOOK_INSTALLED`);
  if (verified !== undefined) overrides.hookVerified = envFlag(`SPEC_FIRST_PROVIDER_${providerId.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_HOOK_VERIFIED`);
  if (status) overrides.hookStatus = normalizeHookStatus(status);
  if (skippedReason !== undefined) overrides.hookSkippedReason = skippedReason || null;
  return overrides;
}

function projectSkillCandidates(repoDir, providerId, host = currentProviderHost()) {
  if (host === 'claude') {
    return [
      path.join(repoDir, '.claude', 'skills', providerId, 'SKILL.md'),
    ];
  }
  if (host === 'kiro') {
    return [
      path.join(repoDir, '.kiro', 'skills', providerId, 'SKILL.md'),
    ];
  }
  if (host === 'qoder') {
    return [
      path.join(repoDir, '.qoder', 'skills', providerId, 'SKILL.md'),
    ];
  }
  return [
    path.join(repoDir, '.codex', 'skills', providerId, 'SKILL.md'),
    path.join(repoDir, '.agents', 'skills', providerId, 'SKILL.md'),
  ];
}

function projectSkillConfigured(repoDir, providerId, host = currentProviderHost()) {
  return projectSkillCandidates(repoDir, providerId, host).some((candidate) => fs.existsSync(candidate));
}

function gitHookPath(repoDir, hookName) {
  const result = spawnSync('git', ['rev-parse', '--git-path', `hooks/${hookName}`], {
    cwd: repoDir,
    encoding: 'utf8',
  });
  if (result.status === 0) {
    const raw = String(result.stdout || '').trim();
    if (raw) {
      return path.isAbsolute(raw) ? raw : path.join(repoDir, raw);
    }
  }
  return path.join(repoDir, '.git', 'hooks', hookName);
}

function hookMentionsGraphify(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8').toLowerCase().includes('graphify');
  } catch (_error) {
    return false;
  }
}

function detectGraphifyHook(repoDir, commandInfo) {
  if (commandInfo && commandInfo.found) {
    const result = runResolved(commandInfo, ['hook', 'status'], { cwd: repoDir });
    const output = `${result.stdout || ''}\n${result.stderr || ''}`.toLowerCase();
    if (result.status === 0 && output.includes('post-commit') && output.includes('post-checkout')) {
      const installed = output.includes('post-commit: installed') && output.includes('post-checkout: installed');
      return {
        hookInstalled: installed,
        hookVerified: installed,
        hookStatus: installed ? 'verified' : 'unknown',
        hookSkippedReason: null,
      };
    }
  }

  const postCommit = hookMentionsGraphify(gitHookPath(repoDir, 'post-commit'));
  const postCheckout = hookMentionsGraphify(gitHookPath(repoDir, 'post-checkout'));
  if (postCommit && postCheckout) {
    return {
      hookInstalled: true,
      hookVerified: false,
      hookStatus: 'installed',
      hookSkippedReason: null,
    };
  }
  return {};
}

function artifactExists(repoDir, artifactPaths = []) {
  return artifactPaths.some((candidate) => (
    typeof candidate === 'string'
    && candidate.length > 0
    && fs.existsSync(path.join(repoDir, candidate))
  ));
}

function existingArtifactRefs(repoDir, artifactPaths = []) {
  return artifactPaths.filter((candidate) => (
    typeof candidate === 'string'
    && candidate.length > 0
    && fs.existsSync(path.join(repoDir, candidate))
  ));
}

function stringList(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item.length > 0) : [];
}

function firstGenerationFor(provider, options = {}) {
  const source = provider.first_generation && typeof provider.first_generation === 'object'
    ? provider.first_generation
    : {};
  return {
    owner: source.owner || 'unknown',
    status: options.firstGenerationStatus || source.status || 'unknown',
    scope: source.scope || 'unknown',
    requires_explicit_gate: source.requires_explicit_gate !== undefined
      ? Boolean(source.requires_explicit_gate)
      : false,
    requirement_workspace_path: options.requirementWorkspacePath !== undefined
      ? options.requirementWorkspacePath
      : (source.requirement_workspace_path || null),
    artifact_root: options.artifactRoot !== undefined
      ? options.artifactRoot
      : (source.artifact_root || null),
    artifact_refs: stringList(options.artifactRefs || source.artifact_refs),
    next_action: options.firstGenerationNextAction || source.next_action || null,
  };
}

function normalizeHookStatus(value) {
  return ['verified', 'installed', 'failed', 'skipped', 'unknown'].includes(value) ? value : 'unknown';
}

function steadyStateFor(provider, options = {}) {
  const source = provider.steady_state && typeof provider.steady_state === 'object'
    ? provider.steady_state
    : {};
  const hookInstalled = options.hookInstalled !== undefined
    ? Boolean(options.hookInstalled)
    : (source.hook_installed !== undefined ? Boolean(source.hook_installed) : false);
  const hookVerified = options.hookVerified !== undefined
    ? Boolean(options.hookVerified)
    : (source.hook_verified !== undefined ? Boolean(source.hook_verified) : false);
  const hookStatus = normalizeHookStatus(
    options.hookStatus
      || source.hook_status
      || (hookVerified ? 'verified' : (hookInstalled ? 'installed' : 'unknown')),
  );
  return {
    refresh_owner: source.refresh_owner || 'unknown',
    refresh_mode: source.refresh_mode || 'unknown',
    hook_default: source.hook_default !== undefined ? Boolean(source.hook_default) : false,
    usage_owner: source.usage_owner || 'unknown',
    hook_installed: hookInstalled,
    hook_verified: hookVerified,
    hook_status: hookStatus,
    hook_skipped_reason: options.hookSkippedReason !== undefined
      ? options.hookSkippedReason
      : (source.hook_skipped_reason || null),
  };
}

function fallbackFor(provider) {
  return provider.fallback || {
    available: true,
    methods: ['rg', 'direct-source-read'],
    reason_code: 'provider-unavailable',
  };
}

function providerEntry(provider, options = {}) {
  const installed = Boolean(options.installed);
  const configured = Boolean(options.configured);
  const initialized = Boolean(options.initialized);
  const indexed = Boolean(options.indexed);
  const artifact = Boolean(options.artifactExists);
  const serverReachable = Boolean(options.serverReachable);
  const queryVerified = Boolean(options.queryVerified);
  const readinessStatus = options.readinessStatus || (installed ? 'unknown' : 'not-run');
  const nextActions = Array.isArray(options.nextActions) ? options.nextActions.filter(Boolean) : [];

  return {
    schema_version: 'provider-readiness.v2',
    provider: provider.id,
    kind: provider.kind || 'generic',
    profile: provider.profile || 'optional',
    readiness_status: readinessStatus,
    lifecycle: {
      installed,
      configured,
      initialized,
      indexed,
      server_reachable: serverReachable,
      artifact_exists: artifact,
      query_verified: queryVerified,
      fallback_used: false,
    },
    repo_aligned: options.repoAligned || 'unknown',
    capabilities: provider.capabilities || [provider.capability_class].filter(Boolean),
    limitations: options.limitations || [
      'provider readiness is advisory; fresh self-reports map to unknown until confirmed by source/test/log evidence',
    ],
    source_read_required: true,
    fallback: fallbackFor(provider),
    next_actions: nextActions,
    native_interfaces: stringList(provider.native_interfaces),
    first_generation: firstGenerationFor(provider, options),
    steady_state: steadyStateFor(provider, options),
    usage_note: provider.usage_note || 'Use provider-native interfaces for advisory candidates; confirm conclusions from source/test/log/contract/user evidence.',
  };
}

function helperProviderEntries(registry, repoDir) {
  return (registry.providers || [])
    .filter((provider) => provider.install_route === 'install-helpers')
    .map((provider) => {
      const command = provider.detection && provider.detection.command;
      const expectedVersion = provider.installation && provider.installation.version_pin;
      const expectedPackage = provider.installation && provider.installation.package ? provider.installation.package : provider.id;
      const versionArgs = provider.detection && Array.isArray(provider.detection.version_args)
        ? provider.detection.version_args
        : [];
      let commandInfo = resolveCommand(command);
      let stalePathCommand = null;
      let installed = commandInfo.found;
      const versionResult = installed && versionArgs.length > 0
        ? runResolved(commandInfo, versionArgs, { cwd: repoDir })
        : null;
      let versionMatches = versionResult
        ? (versionResult.status === 0 && versionOutputMatchesExpected(expectedVersion, `${versionResult.stdout || ''}\n${versionResult.stderr || ''}`))
        : true;
      if (provider.id === 'graphify' && installed && expectedVersion && !versionMatches) {
        const fallback = knownCommandCandidates(command)
          .map((candidate) => ({ found: isExecutable(candidate), command: candidate, onPath: false }))
          .find((candidate) => {
            if (!candidate.found || candidate.command === commandInfo.command) return false;
            const result = runResolved(candidate, versionArgs, { cwd: repoDir });
            return result.status === 0 && versionOutputMatchesExpected(expectedVersion, `${result.stdout || ''}\n${result.stderr || ''}`);
          });
        if (fallback) {
          stalePathCommand = commandInfo.command;
          commandInfo = fallback;
          installed = true;
          versionMatches = true;
        }
      }
      const artifactPaths = provider.detection && provider.detection.artifact_paths;
      const artifact = artifactExists(repoDir, artifactPaths);
      const artifactRefs = existingArtifactRefs(repoDir, artifactPaths);
      const currentHost = currentProviderHost();
      const configured = projectSkillConfigured(repoDir, provider.id, currentHost);
      const queryVerified = envFlag(`SPEC_FIRST_PROVIDER_${provider.id.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_QUERY_VERIFIED`);
      const firstGenerationOverrides = envFirstGenerationOverrides(provider.id);
      const hookOverrides = {
        ...(provider.id === 'graphify' ? detectGraphifyHook(repoDir, commandInfo) : {}),
        ...envHookOverrides(provider.id),
      };
      let readinessStatus = installed ? selfReportedStatus(provider.id) : 'not-run';
      const nextActions = [];
      if (!installed) {
        nextActions.push(provider.installation && provider.installation.next_action);
      }
      if (installed && !commandInfo.onPath && provider.id === 'graphify') {
        nextActions.push(`Graphify CLI is installed at ${commandInfo.command} but not on PATH; add ${path.dirname(commandInfo.command)} to PATH or use the absolute command path for manual graphify CLI calls.`);
      }
      if (stalePathCommand && provider.id === 'graphify') {
        nextActions.push(`Graphify CLI on PATH at ${stalePathCommand} does not match pinned ${expectedPackage}==${expectedVersion}; setup is using ${commandInfo.command}. Update PATH when convenient.`);
      }
      if (installed && !configured && provider.id === 'graphify') {
        if (readinessStatus === 'unknown' || readinessStatus === 'fresh') {
          readinessStatus = 'degraded';
        }
        nextActions.push(`Install the current-host Graphify project skill with \`${setupWorkflowCommand(currentHost, '--only graphify')}\` for ${currentHost}.`);
      }
      if (installed && !versionMatches && expectedVersion && provider.id === 'graphify') {
        readinessStatus = 'degraded';
        nextActions.push(`Graphify CLI version does not match pinned ${expectedPackage}==${expectedVersion}; rerun \`${setupWorkflowCommand(currentHost, '--only graphify')}\` to reinstall the pinned provider version.`);
      }
      if (installed && !artifact) {
        nextActions.push('Generate project-root graphify-out/ with graphify extract or graphify update . before using this provider as architecture navigation.');
      }
      if (installed && artifact && provider.id === 'graphify' && !queryVerified) {
        nextActions.push(`Graphify query probe has not confirmed CLI/artifact usability; rerun ${setupWorkflowCommand(currentHost, '--only graphify')} when project-graph navigation would help. For code navigation prefer \`graphify explain\`/\`path\`; \`query\` is unscored BFS and weak orientation only. Otherwise continue with bounded direct evidence.`);
      }
      if (hookOverrides.hookStatus === 'failed') {
        readinessStatus = 'degraded';
        nextActions.push(`Graphify hook setup failed; rerun \`${setupWorkflowCommand(currentHost, '--only graphify')}\` or run \`graphify hook install\` and \`graphify hook status\` from the project root.`);
      } else if (hookOverrides.hookStatus === 'skipped' && hookOverrides.hookSkippedReason === 'first-generation-not-completed') {
        nextActions.push('Complete Graphify first generation before enabling provider-native hook refresh.');
      } else if (installed && artifact && provider.steady_state && provider.steady_state.hook_default && hookOverrides.hookStatus === undefined) {
        nextActions.push('Run `graphify hook status` before treating Graphify auto-refresh as verified.');
      }
      if (firstGenerationOverrides.firstGenerationStatus === 'failed') {
        readinessStatus = 'degraded';
      }
      if (provider.id === 'graphify' && firstGenerationOverrides.firstGenerationNextAction === 'graphify-refresh-recommended') {
        nextActions.push(`Graphify install state is verified for the existing artifact; incrementally refresh graphify-out with \`${setupWorkflowCommand(currentHost, '--only graphify --refresh')}\` when you want to update the graph (runs \`graphify update .\`, no full semantic extraction).`);
      }
      return providerEntry(provider, {
        installed,
        configured,
        initialized: artifact,
        indexed: artifact,
        artifactExists: artifact,
        serverReachable: false,
        queryVerified,
        readinessStatus,
        repoAligned: artifact ? 'unknown' : 'unknown',
        nextActions,
        firstGenerationStatus: artifact ? 'completed' : 'not-run',
        artifactRefs,
        firstGenerationNextAction: installed && !artifact ? 'graphify-first-generation-required' : null,
        ...firstGenerationOverrides,
        ...hookOverrides,
      });
    });
}

function normalizeToolStatus(value) {
  return typeof value === 'string' && value.length > 0 ? value : 'unknown';
}

function mcpProviderEntries(facts) {
  const tools = facts && facts.tools && typeof facts.tools === 'object' ? facts.tools : {};
  const codegraph = tools.codegraph;
  if (!codegraph || typeof codegraph !== 'object') return [];

  const metadata = {
    id: 'codegraph',
    kind: 'code-structure',
    profile: 'optional',
    capability_class: 'code-graph',
    capabilities: ['code-graph', 'impact-candidates', 'affected-tests-candidates'],
    native_interfaces: ['mcp', 'cli'],
    first_generation: {
      owner: 'runtime-setup',
      status: 'not-run',
      scope: 'project',
      requires_explicit_gate: true,
      requirement_workspace_path: null,
      artifact_root: '.codegraph',
    },
    steady_state: {
      refresh_owner: 'provider-native',
      refresh_mode: 'watcher',
      hook_default: false,
      usage_owner: 'downstream-skill',
    },
    usage_note: 'Use CodeGraph MCP tools for impact/call graph candidates. `codegraph serve --mcp` owns provider-native Auto-Sync freshness; confirm conclusions from source/test/log/contract/user evidence.',
    fallback: {
      available: true,
      methods: ['rg', 'ast-grep', 'direct-source-read'],
      reason_code: 'code-graph-provider-unavailable',
    },
  };
  const dependencyStatus = normalizeToolStatus(codegraph.dependency_status || codegraph.status);
  const hostStatus = normalizeToolStatus(codegraph.host_config_status || codegraph.configured_status);
  const projectStatus = normalizeToolStatus(codegraph.project_status);
  const optionalNotSelected = codegraph.reason_code === 'optional-capability-not-selected';
  const installed = !optionalNotSelected && (
    dependencyStatus === 'ready'
    || dependencyStatus === 'ok'
    || codegraph.installed === true
  );
  const configured = codegraph.configured === true
    || hostStatus === 'ready'
    || hostStatus === 'fallback-active'
    || hostStatus === 'registry-args-drift';
  const indexed = projectStatus === 'ready';
  let readinessStatus = installed ? selfReportedStatus('codegraph') : 'not-run';
  if (projectStatus === 'failed') readinessStatus = 'degraded';
  const nextActions = [];
  if (codegraph.next_action) nextActions.push(codegraph.next_action);
  if (installed && !indexed) nextActions.push('Run CodeGraph project bootstrap before relying on code-graph candidates.');
  const serverReachable = envFlag('SPEC_FIRST_PROVIDER_CODEGRAPH_SERVER_REACHABLE');
  const queryVerified = envFlag('SPEC_FIRST_PROVIDER_CODEGRAPH_QUERY_VERIFIED');
  if (installed && configured && indexed && !serverReachable) {
    nextActions.push('Run CodeGraph server/probe verification before treating server_reachable as true.');
  }
  if (serverReachable && !queryVerified) {
    nextActions.push('Run a CodeGraph query probe before treating query_verified as true.');
  }

  return [providerEntry(metadata, {
    installed,
    configured,
    initialized: indexed,
    indexed,
    artifactExists: indexed,
    serverReachable,
    queryVerified,
    readinessStatus,
    repoAligned: indexed ? 'unknown' : 'unknown',
    nextActions,
    firstGenerationStatus: projectStatus === 'failed' ? 'failed' : (indexed ? 'completed' : 'not-run'),
    artifactRefs: indexed ? ['.codegraph/codegraph.db'] : [],
  })];
}

function uniqueByProvider(entries) {
  const byProvider = new Map();
  for (const entry of entries) {
    if (!entry || !entry.provider) continue;
    byProvider.set(entry.provider, entry);
  }
  return Array.from(byProvider.values());
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const mcpRegistry = readJson(mcpToolsPath, { external_dependencies: [] });
  const registry = hydrateProviderRegistry(readJson(providerRegistryPath, { providers: [] }), mcpRegistry);
  const facts = readJson(args.factsFile, {});
  const repoDir = path.resolve(args.repoRoot || process.cwd());
  const entries = [];

  if (args.source === 'helper' || args.source === 'all') {
    entries.push(...helperProviderEntries(registry, repoDir));
  }
  if (args.source === 'mcp' || args.source === 'all') {
    entries.push(...mcpProviderEntries(facts));
  }

  process.stdout.write(`${JSON.stringify(uniqueByProvider(entries), null, 2)}\n`);
}

main();
