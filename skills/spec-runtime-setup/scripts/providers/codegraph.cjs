'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  assertContainedPath,
} = require('../lib/path-safety.cjs');
const {
  providerLimitation,
  providerResult,
  run,
  succeeded,
  text,
  versionOutputMatches,
} = require('./common.cjs');

const METADATA = {
  id: 'codegraph',
  kind: 'code-structure',
  profile: 'minimal',
  capability_class: 'code-graph',
  capabilities: ['code-graph', 'impact-candidates', 'affected-tests-candidates'],
  native_interfaces: ['mcp', 'cli'],
  first_generation: {
    owner: 'runtime-setup',
    status: 'not-run',
    scope: 'project',
    requires_explicit_gate: false,
    requirement_workspace_path: null,
    artifact_root: '.codegraph',
  },
  steady_state: {
    refresh_owner: 'provider-native',
    refresh_mode: 'watcher',
    hook_default: false,
    usage_owner: 'downstream-skill',
  },
  fallback: {
    available: true,
    methods: ['rg', 'ast-grep', 'direct-source-read'],
    reason_code: 'code-graph-provider-unavailable',
  },
  usage_note: '使用 CodeGraph MCP 工具获取 impact/call graph candidate。`codegraph serve --mcp` 负责 provider-native Auto-Sync freshness；结论需由 source/test/log/contract/user evidence 确认。',
};
const CONFIG_UNKNOWN_ACTION = '通过当前 host 的 spec-runtime-setup --verify-only 确认 CodeGraph MCP 配置。';
const CONFIG_REPAIR_ACTION = '运行 spec-runtime-setup --only codegraph，配置 CodeGraph MCP entry。';

function plan(context = {}) {
  const repoRoot = path.resolve(context.repoRoot || process.cwd());
  if (!context.selected) {
    return {
      schema_version: 'provider-action-plan.v1',
      provider: 'codegraph',
      mutation: false,
      blocked: false,
      reason_code: 'provider-not-selected',
      actions: [],
      non_actions: ['未显式选择 --only codegraph 时，不得安装、初始化、sync 或重新索引 CodeGraph。'],
    };
  }
  try {
    assertCodegraphArtifactRoot(repoRoot);
  } catch (error) {
    return {
      schema_version: 'provider-action-plan.v1',
      provider: 'codegraph',
      repo_root: repoRoot,
      mutation: false,
      blocked: true,
      reason_code: error.reason_code || 'codegraph-artifact-root-unsafe',
      actions: [],
      non_actions: ['Artifact containment 未确认时，不得运行任何 CodeGraph 命令。'],
    };
  }
  const actions = [];
  const dependencyReady = context.probeDependency === true
    && versionReady(
      run(context, 'codegraph', ['--version'], { cwd: repoRoot, timeoutMs: 10000 }),
      context.dependency && context.dependency.version,
    );
  if (!dependencyReady && context.dependency && context.dependency.package && context.dependency.version) {
    actions.push({
      kind: 'install-dependency',
      command: 'npm',
      args: ['install', '-g', `${context.dependency.package}@${context.dependency.version}`, '--no-audit', '--no-fund', '--loglevel=error'],
    });
  }
  actions.push(
    { kind: 'initialize-if-missing', command: 'codegraph', args: ['init'] },
    { kind: 'verify-status', command: 'codegraph', args: ['status'] },
    {
      kind: 'verify-query',
      command: 'codegraph',
      args: ['query', '__spec_first_readiness_probe__', '--limit', '1', '--json'],
    },
  );
  return {
    schema_version: 'provider-action-plan.v1',
    provider: 'codegraph',
    repo_root: repoRoot,
    dependency_version: context.dependency && context.dependency.version ? context.dependency.version : null,
    dependency_ready: dependencyReady,
    mutation: true,
    blocked: false,
    reason_code: null,
    actions,
    non_actions: ['Setup 不得启动 codegraph serve --mcp 或任何 watcher。'],
  };
}

function verify(context = {}) {
  const repoRoot = path.resolve(context.repoRoot || process.cwd());
  try {
    assertCodegraphArtifactRoot(repoRoot);
  } catch (error) {
    return degraded(context, repoRoot, error.reason_code || 'codegraph-artifact-root-unsafe', {
      skipArtifactProbe: true,
    });
  }
  const versionResult = run(context, 'codegraph', ['--version'], { cwd: repoRoot });
  const installed = versionReady(versionResult, context.dependency && context.dependency.version);
  const artifactPath = path.join(repoRoot, '.codegraph', 'codegraph.db');
  const hasArtifact = fs.existsSync(artifactPath);
  const statusResult = installed && hasArtifact
    ? run(context, 'codegraph', ['status'], { cwd: repoRoot })
    : null;
  const statusOutput = statusResult ? text(statusResult) : '';
  const indexed = Boolean(statusResult
    && succeeded(statusResult)
    && !statusNeedsSync(statusOutput)
    && !statusNeedsReindex(statusOutput));
  const queryResult = indexed
    ? run(context, 'codegraph', ['query', '__spec_first_readiness_probe__', '--limit', '1', '--json'], {
      cwd: repoRoot,
      timeoutMs: 10000,
    })
    : null;
  const queryVerified = Boolean(queryResult && succeeded(queryResult));
  const serverReachable = context.serverReachable === true;
  const nextActions = [];
  if (!installed) nextActions.push('显式运行 spec-runtime-setup --only codegraph，安装 pinned CodeGraph CLI。');
  if (installed && !hasArtifact) nextActions.push('依赖 code-graph candidate 前，先显式执行 CodeGraph first generation。');
  if (installed && hasArtifact && !indexed) {
    nextActions.push('运行 spec-runtime-setup --only codegraph，修复 CodeGraph index/query readiness。');
  }
  if (installed && hasArtifact && !serverReachable) nextActions.push('将 server_reachable 视为 true 前，先运行 CodeGraph server/probe 验证。');
  if (indexed && !queryVerified) nextActions.push('运行 spec-runtime-setup --only codegraph，重新执行 bounded CodeGraph query probe。');
  appendConfigurationAction(nextActions, context);
  return providerResult(METADATA, {
    installed,
    configured: context.configured === true,
    initialized: hasArtifact,
    indexed,
    artifactExists: hasArtifact,
    serverReachable,
    queryVerified,
    readinessStatus: codegraphReadinessStatus(context, {
      installed,
      initialized: hasArtifact,
      indexed,
      queryVerified,
    }),
    repoAligned: 'unknown',
    firstGenerationStatus: hasArtifact ? 'completed' : 'not-run',
    artifactRefs: hasArtifact ? ['.codegraph/codegraph.db'] : [],
    nextActions,
  });
}

function apply(context = {}, actionPlan = plan(context)) {
  if (!actionPlan || actionPlan.blocked || !actionPlan.mutation) return verify(context);
  const repoRoot = path.resolve(context.repoRoot || actionPlan.repo_root || process.cwd());
  try {
    assertCodegraphArtifactRoot(repoRoot);
  } catch (error) {
    return degraded(context, repoRoot, error.reason_code || 'codegraph-artifact-root-unsafe', {
      skipArtifactProbe: true,
    });
  }
  for (const action of actionPlan.actions || []) {
    if (action.kind === 'install-dependency') {
      const result = run(context, action.command, action.args, { cwd: repoRoot, timeoutMs: 120000 });
      if (!succeeded(result)) return degraded(context, repoRoot, 'codegraph-install-failed', {
        versionPin: actionPlan.dependency_version,
      });
      const installed = run(context, 'codegraph', ['--version'], { cwd: repoRoot, timeoutMs: 10000 });
      if (!versionReady(installed, actionPlan.dependency_version)) {
        return degraded(context, repoRoot, 'codegraph-version-pin-mismatch', {
          versionPin: actionPlan.dependency_version,
        });
      }
    }
  }
  const artifactPath = path.join(repoRoot, '.codegraph', 'codegraph.db');
  if (!fs.existsSync(artifactPath)) {
    try {
      assertCodegraphArtifactRoot(repoRoot);
    } catch (error) {
      return degraded(context, repoRoot, error.reason_code || 'codegraph-artifact-root-unsafe', {
        skipArtifactProbe: true,
      });
    }
    const initResult = run(context, 'codegraph', ['init'], { cwd: repoRoot, timeoutMs: 120000 });
    if (!succeeded(initResult)) return degraded(context, repoRoot, 'codegraph-init-failed');
  }

  let statusResult = run(context, 'codegraph', ['status'], { cwd: repoRoot });
  let statusText = text(statusResult);
  if (succeeded(statusResult) && statusNeedsSync(statusText)) {
    const syncResult = run(context, 'codegraph', ['sync'], { cwd: repoRoot, timeoutMs: 120000 });
    if (!succeeded(syncResult)) return degraded(context, repoRoot, 'codegraph-sync-failed');
    statusResult = run(context, 'codegraph', ['status'], { cwd: repoRoot });
    statusText = text(statusResult);
  }
  if (succeeded(statusResult) && statusNeedsSync(statusText)) {
    return degraded(context, repoRoot, 'codegraph-sync-incomplete');
  }
  if (succeeded(statusResult) && statusNeedsReindex(statusText)) {
    const indexResult = run(context, 'codegraph', ['index', '-f'], { cwd: repoRoot, timeoutMs: 120000 });
    if (!succeeded(indexResult)) return degraded(context, repoRoot, 'codegraph-reindex-failed');
    statusResult = run(context, 'codegraph', ['status'], { cwd: repoRoot });
    statusText = text(statusResult);
  }
  if (!succeeded(statusResult)
    || statusNeedsSync(statusText)
    || statusNeedsReindex(statusText)
    || !fs.existsSync(artifactPath)) {
    return degraded(context, repoRoot, 'codegraph-post-mutation-probe-failed');
  }
  try {
    assertCodegraphArtifactRoot(repoRoot);
  } catch (error) {
    return degraded(context, repoRoot, error.reason_code || 'codegraph-artifact-root-unsafe', {
      skipArtifactProbe: true,
    });
  }
  const versionResult = run(context, 'codegraph', ['--version'], { cwd: repoRoot });
  if (!versionReady(versionResult, actionPlan.dependency_version)) {
    return degraded(context, repoRoot, 'codegraph-post-mutation-version-probe-failed');
  }
  const queryResult = run(
    context,
    'codegraph',
    ['query', '__spec_first_readiness_probe__', '--limit', '1', '--json'],
    { cwd: repoRoot, timeoutMs: 10000 },
  );
  if (!succeeded(queryResult)) {
    return degraded(context, repoRoot, 'codegraph-query-probe-failed');
  }
  return providerResult(METADATA, {
    installed: true,
    configured: context.configured === true,
    initialized: true,
    indexed: true,
    artifactExists: true,
    serverReachable: context.serverReachable === true,
    queryVerified: true,
    readinessStatus: codegraphReadinessStatus(context, {
      installed: true,
      initialized: true,
      indexed: true,
      queryVerified: true,
    }),
    repoAligned: 'unknown',
    firstGenerationStatus: 'completed',
    artifactRefs: ['.codegraph/codegraph.db'],
    nextActions: configurationActions(context),
  });
}

function codegraphReadinessStatus(context, lifecycle) {
  if (!lifecycle.installed) return 'not-run';
  if (!lifecycle.initialized || !lifecycle.indexed || !lifecycle.queryVerified) return 'degraded';
  if (typeof context.configured !== 'boolean') return 'unknown';
  return context.configured ? 'fresh' : 'degraded';
}

function configurationActions(context) {
  const actions = [];
  appendConfigurationAction(actions, context);
  return actions;
}

function appendConfigurationAction(actions, context) {
  if (typeof context.configured !== 'boolean') {
    actions.push(CONFIG_UNKNOWN_ACTION);
  } else if (context.configured !== true) {
    actions.push(CONFIG_REPAIR_ACTION);
  }
}

function reconcileConfigured(readiness, hostResult = {}) {
  if (!readiness || !readiness.lifecycle) return readiness;
  const configured = hostResult.configured_status === 'ready';
  readiness.lifecycle.configured = configured;
  if (!configured) {
    if (['fresh', 'unknown'].includes(readiness.readiness_status)) {
      readiness.readiness_status = 'degraded';
    }
    const nextActions = (readiness.next_actions || []).filter((action) =>
      ![CONFIG_UNKNOWN_ACTION, CONFIG_REPAIR_ACTION].includes(action)
    );
    readiness.next_actions = [...new Set([
      ...nextActions,
      hostResult.next_action || CONFIG_REPAIR_ACTION,
    ])];
    return readiness;
  }
  const lifecycle = readiness.lifecycle;
  if (readiness.readiness_status === 'unknown'
    && lifecycle.installed
    && lifecycle.initialized
    && lifecycle.indexed
    && lifecycle.query_verified) {
    readiness.readiness_status = 'fresh';
  }
  readiness.next_actions = (readiness.next_actions || []).filter((action) =>
    ![CONFIG_UNKNOWN_ACTION, CONFIG_REPAIR_ACTION].includes(action)
  );
  return readiness;
}

function refresh(context = {}, actionPlan = plan({ ...context, selected: true })) {
  return apply(context, actionPlan);
}

function uninstall(context = {}) {
  return {
    schema_version: 'provider-action-plan.v1',
    provider: 'codegraph',
    mutation: false,
    blocked: false,
    reason_code: 'provider-artifact-retained',
    actions: [],
    non_actions: ['移除 host config 时，setup 不会删除项目的 .codegraph database。'],
    repo_root: path.resolve(context.repoRoot || process.cwd()),
  };
}

function degraded(context, repoRoot, reasonCode, options = {}) {
  let artifact = false;
  if (!options.skipArtifactProbe) {
    try {
      assertCodegraphArtifactRoot(repoRoot);
      artifact = fs.existsSync(path.join(repoRoot, '.codegraph', 'codegraph.db'));
    } catch (_error) {
      artifact = false;
    }
  }
  const installed = versionReady(
    run(context, 'codegraph', ['--version'], { cwd: repoRoot }),
    options.versionPin || (context.dependency && context.dependency.version),
  );
  return providerResult(METADATA, {
    installed,
    configured: context.configured === true,
    initialized: artifact,
    indexed: false,
    artifactExists: artifact,
    readinessStatus: 'degraded',
    firstGenerationStatus: 'failed',
    artifactRefs: artifact ? ['.codegraph/codegraph.db'] : [],
    limitations: [providerLimitation('failed', reasonCode, 'CodeGraph setup 失败。')],
    nextActions: ['检查 bounded CodeGraph diagnostic，并重新运行显式 setup。'],
  });
}

function assertCodegraphArtifactRoot(repoRoot) {
  const root = assertContainedPath(repoRoot, path.join(repoRoot, '.codegraph'), {
    reasonCode: 'codegraph-artifact-symlink-escape',
  });
  assertContainedPath(repoRoot, path.join(root, 'codegraph.db'), {
    reasonCode: 'codegraph-artifact-symlink-escape',
  });
  return root;
}

function versionReady(result, versionPin) {
  if (!succeeded(result)) return false;
  return versionOutputMatches(text(result), versionPin);
}

function statusNeedsSync(output) {
  return /pending changes|run\s+codegraph\s+sync/i.test(String(output || ''));
}

function statusNeedsReindex(output) {
  return /full rebuild|index\s+-f/i.test(String(output || ''));
}

module.exports = {
  apply,
  plan,
  reconcileConfigured,
  refresh,
  uninstall,
  verify,
};
