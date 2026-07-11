'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {
  assertContainedPath,
  ensureContainedDirectory,
} = require('./path-safety.cjs');
const {
  commandSucceeded,
} = require('./process-runner.cjs');
const {
  renderJson,
} = require('./renderer.cjs');

const INSTALL_SOURCE = Object.freeze({
  OFFICIAL: 'official',
  MIRROR: 'mirror',
  BOTH_FAILED: 'both-failed',
});

function probeRegistry(context, repoRoot, { selectedIds }) {
  return {
    toolResults: (context.effectiveRegistry.tools || []).map((entry) => probeTool(context, repoRoot, entry, selectedIds)),
    helperResults: (context.effectiveRegistry.helpers || []).map((entry) => probeHelper(context, repoRoot, entry)),
  };
}

function probeTool(context, repoRoot, entry, selectedIds) {
  const optional = entry.required === false;
  if (optional && !selectedIds.includes(entry.id)) {
    return {
      id: entry.id,
      kind: entry.category || 'mcp',
      status: 'skipped',
      verified: true,
      source: 'read-only-probe',
      reason_code: 'optional-capability-not-selected',
      configured_status: 'not-required',
      next_action: `运行 spec-mcp-setup --only ${entry.id}，执行显式 setup。`,
    };
  }
  const dependencies = Array.isArray(entry.dependencies) ? entry.dependencies : [];
  const failures = [];
  for (const dependency of dependencies) {
    const result = execute(context, dependency, ['--version'], { cwd: repoRoot, timeoutMs: 10000 });
    if (!commandSucceeded(result)) failures.push(dependency);
  }
  if (entry.installation && entry.installation.verify_command) {
    const probe = entry.installation.verify_command;
    const result = execute(context, probe.command, probe.args || [], { cwd: repoRoot, timeoutMs: 10000 });
    if (!commandSucceeded(result)) failures.push(probe.command);
  }
  return {
    id: entry.id,
    kind: entry.category || 'mcp',
    status: failures.length === 0 ? 'ready' : 'missing',
    verified: true,
    source: 'read-only-probe',
    reason_code: failures.length === 0 ? 'ready' : 'missing_dependency',
    configured_status: entry.host_config_required === false ? 'not-applicable' : 'not-checked',
    next_action: failures.length === 0 ? '' : `Install or repair: ${failures.join(', ')}`,
  };
}

function probeHelper(context, repoRoot, entry) {
  const detection = entry.detection || {};
  if (detection.kind === 'global-skill') {
    const ready = globalSkillInstalled(context.homeDir, detection.skill_name);
    return helperProbe(entry, ready ? 'ready' : 'missing', ready ? 'ready' : 'global-skill-missing');
  }
  const command = detection.command;
  if (!command) return helperProbe(entry, 'missing', 'helper-detection-invalid');
  const result = execute(context, command, ['--version'], { cwd: repoRoot, timeoutMs: 10000 });
  const commandReady = commandSucceeded(result);
  if (detection.kind === 'agent-browser') {
    const marker = path.join(context.homeDir, '.agent-browser', 'spec-first-install.json');
    const skillReady = globalSkillInstalled(context.homeDir, detection.skill_name || 'agent-browser');
    if (commandReady && fs.existsSync(marker) && skillReady) return helperProbe(entry, 'ready', 'ready');
    return helperProbe(entry, 'skipped', commandReady ? 'agent-browser-manual-setup-incomplete' : 'agent-browser-not-installed');
  }
  if (!commandReady && detection.fallback_command) {
    const fallback = execute(context, detection.fallback_command, ['--version'], { cwd: repoRoot, timeoutMs: 10000 });
    if (commandSucceeded(fallback)) return helperProbe(entry, 'degraded', 'helper-fallback-active');
  }
  return helperProbe(entry, commandReady ? 'ready' : 'missing', commandReady ? 'ready' : 'missing_dependency');
}

function helperProbe(entry, status, reasonCode) {
  return {
    id: entry.id,
    kind: entry.kind || 'helper',
    status,
    verified: true,
    source: 'read-only-probe',
    reason_code: reasonCode,
    configured_status: 'not-applicable',
    next_action: status === 'ready' ? '' : ((entry.installation && entry.installation.next_action) || ''),
  };
}

function installBaselineTools(context, repoRoot) {
  const results = new Map();
  for (const entry of context.effectiveRegistry.tools || []) {
    if (entry.required === false) continue;
    const installation = resolveInstallation(entry, context.platform);
    if (!installation || !installation.command) continue;
    const dependency = dependencyFor(context, entry.dependency_ref);
    const args = interpolateArgs(installation.args || [], dependency);
    if (installation.kind === 'warmup' && warmupCacheHit(context, repoRoot, entry, installation.command, args)) {
      results.set(entry.id, {
        status: 'ready',
        verified: true,
        source: 'post-mutation-probe',
        reason_code: 'warmup-cache-hit',
      });
      continue;
    }
    const result = executeInstallWithMirror(context, installation.command, args, {
      cwd: repoRoot,
      timeoutMs: 120000,
    });
    if (commandSucceeded(result)) {
      if (installation.kind === 'warmup') writeWarmupCache(context, repoRoot, entry, installation.command, args);
      results.set(entry.id, {
        status: 'ready',
        verified: true,
        source: 'post-mutation-probe',
        reason_code: 'ready',
        ...installProvenance(result),
      });
    } else {
      results.set(entry.id, {
        status: 'failed',
        verified: true,
        source: 'post-mutation-probe',
        reason_code: 'tool-install-failed',
        ...installProvenance(result),
      });
    }
  }
  return results;
}

function warmupCacheHit(context, repoRoot, entry, command, args) {
  if (context.env.SPEC_FIRST_FORCE_WARMUP === '1' || context.env.SPEC_FIRST_DISABLE_WARMUP_CACHE === '1') {
    return false;
  }
  const cachePath = warmupCachePath(context, repoRoot, entry.id);
  try {
    assertContainedPath(repoRoot, cachePath, { reasonCode: 'warmup-cache-symlink-escape' });
    if (!fs.existsSync(cachePath)) return false;
    const value = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    if (value.schema_version !== 'mcp-warmup-cache.v1'
      || value.tool_id !== entry.id
      || value.host !== context.host
      || value.platform !== context.platform
      || value.command_hash !== warmupCommandHash(command, args)
      || value.exit_code !== 0) return false;
    const ttl = warmupTtlSeconds(context, command, args);
    return ttl === 0 || (Number(value.last_success_epoch) + ttl) >= Math.floor(Date.now() / 1000);
  } catch (_error) {
    return false;
  }
}

function writeWarmupCache(context, repoRoot, entry, command, args) {
  const cachePath = warmupCachePath(context, repoRoot, entry.id);
  let temp = null;
  try {
    const directory = ensureContainedDirectory(repoRoot, path.dirname(cachePath), {
      reasonCode: 'warmup-cache-symlink-escape',
      mode: 0o700,
    });
    assertContainedPath(repoRoot, cachePath, { reasonCode: 'warmup-cache-symlink-escape' });
    temp = path.join(directory, `.${entry.id}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`);
    const now = new Date();
    const payload = {
      schema_version: 'mcp-warmup-cache.v1',
      tool_id: entry.id,
      host: context.host,
      platform: context.platform,
      command,
      args,
      command_hash: warmupCommandHash(command, args),
      package_spec: entry.package && entry.version ? `${entry.package}@${entry.version}` : '',
      last_success_at: now.toISOString(),
      last_success_epoch: Math.floor(now.getTime() / 1000),
      exit_code: 0,
    };
    fs.writeFileSync(temp, renderJson(payload), { flag: 'wx', mode: 0o600 });
    assertContainedPath(repoRoot, cachePath, { reasonCode: 'warmup-cache-symlink-escape' });
    assertContainedPath(repoRoot, temp, { reasonCode: 'warmup-cache-symlink-escape' });
    fs.renameSync(temp, cachePath);
  } catch (_error) {
    // Cache 失败仅为 advisory；已确认的命令结果仍是权威证据。
  } finally {
    try {
      if (temp && fs.existsSync(temp)) fs.rmSync(temp, { force: true });
    } catch (_error) {
      // Cache 清理仍是 advisory。
    }
  }
}

function warmupCachePath(context, repoRoot, toolId) {
  return path.join(repoRoot, '.spec-first', 'cache', 'mcp-warmup', context.host, context.platform, `${toolId}.json`);
}

function warmupCommandHash(command, args) {
  const hash = crypto.createHash('sha256');
  hash.update(`command=${command}\n`);
  for (const arg of args) hash.update(`arg=${arg}\n`);
  return hash.digest('hex');
}

function warmupTtlSeconds(context, command, args) {
  const joined = `${command} ${args.join(' ')}`;
  if (!joined.includes('@latest') && !joined.includes(' --upgrade ')) return 0;
  const configured = Number(context.env.SPEC_FIRST_WARMUP_LATEST_TTL_SECONDS);
  return Number.isFinite(configured) && configured >= 0 ? configured : 86400;
}

function installBaselineHelpers(context, repoRoot) {
  const results = new Map();
  for (const entry of context.effectiveRegistry.helpers || []) {
    if (entry.baseline_blocking !== true) continue;
    const before = probeHelper(context, repoRoot, entry);
    if (before.status === 'ready') continue;
    const operations = entry.installation && Array.isArray(entry.installation.operations)
      ? entry.installation.operations
      : [];
    if (operations.length === 0) {
      results.set(entry.id, {
        status: 'failed',
        verified: true,
        source: 'post-mutation-probe',
        reason_code: 'helper-install-manual-action-required',
        next_action: entry.installation && entry.installation.next_action
          ? entry.installation.next_action
          : '安装缺失的 baseline helper，然后重新运行 setup。',
      });
      continue;
    }
    let failed = false;
    const operationResults = [];
    for (const operation of operations) {
      if (!operation || typeof operation.command !== 'string' || !Array.isArray(operation.args)) {
        failed = true;
        break;
      }
      const result = executeInstallWithMirror(context, operation.command, operation.args, {
        cwd: repoRoot,
        timeoutMs: 120000,
        env: { HOME: context.homeDir },
      });
      operationResults.push(result);
      if (!commandSucceeded(result)) {
        failed = true;
        break;
      }
    }
    const after = failed ? null : probeHelper(context, repoRoot, entry);
    const provenance = combinedInstallProvenance(operationResults);
    results.set(entry.id, after && after.status === 'ready'
      ? {
        status: 'ready',
        verified: true,
        source: 'post-mutation-probe',
        reason_code: 'ready',
        ...provenance,
      }
      : {
        status: 'failed',
        verified: true,
        source: 'post-mutation-probe',
        reason_code: failed ? 'helper-install-failed' : 'helper-post-install-probe-failed',
        ...provenance,
        next_action: entry.installation && entry.installation.next_action
          ? entry.installation.next_action
          : '修复 helper 安装，然后重新运行 setup。',
      });
  }
  return results;
}

function dependencyFor(context, id) {
  return (context.effectiveRegistry.external_dependencies || []).find((entry) => entry.id === id) || null;
}

function resolveInstallation(entry, platform) {
  const installation = entry.installation || {};
  if (installation.command) return installation;
  if (platform === 'windows' && installation.windows) return installation.windows;
  return installation.unix || null;
}

function interpolateArgs(args, dependency) {
  return args.map((arg) => String(arg)
    .replaceAll('{{package}}', dependency && dependency.package ? dependency.package : '')
    .replaceAll('{{version}}', dependency && dependency.version ? dependency.version : ''));
}

function execute(context, command, args, options = {}) {
  return context.runner(command, args, options);
}

function executeInstallWithMirror(context, command, args, options = {}) {
  const primary = execute(context, command, args, {
    ...options,
    invocationSource: options.invocationSource || 'official-registry',
    mirrorAttempt: false,
  });
  const primaryAttempt = annotateInstallResult(primary, INSTALL_SOURCE.OFFICIAL, false);
  const mirrorConfig = resolveInstallMirror(context, command);
  if (commandSucceeded(primary) || !mirrorConfig) {
    return {
      ...primary,
      attempts: [primaryAttempt],
      install_source: INSTALL_SOURCE.OFFICIAL,
      mirror_used: false,
    };
  }
  const mirror = execute(context, command, args, {
    ...options,
    env: {
      ...(options.env || {}),
      ...mirrorConfig.environment,
    },
    invocationSource: 'configured-mirror',
    mirrorAttempt: true,
  });
  const mirrorAttempt = annotateInstallResult(mirror, INSTALL_SOURCE.MIRROR, true);
  return {
    ...mirror,
    attempts: [primaryAttempt, mirrorAttempt],
    install_source: commandSucceeded(mirror) ? INSTALL_SOURCE.MIRROR : INSTALL_SOURCE.BOTH_FAILED,
    mirror_used: true,
  };
}

function annotateInstallResult(result, installSource, mirrorUsed) {
  return {
    ...result,
    install_source: installSource,
    mirror_used: mirrorUsed,
  };
}

function resolveInstallMirror(context, command) {
  const normalized = path.basename(String(command || '')).replace(/\.(?:cmd|exe)$/i, '').toLowerCase();
  if (!['npm', 'npx'].includes(normalized)) return null;
  const config = context.effectiveRegistry
    && context.effectiveRegistry.install_mirrors
    && context.effectiveRegistry.install_mirrors.npm;
  if (!config || !config.environment || typeof config.environment !== 'object') return null;
  return config;
}

function installProvenance(result) {
  if (!result || !Array.isArray(result.attempts)) return {};
  return {
    attempts: result.attempts.map((attempt) => ({ ...attempt })),
    install_source: result.install_source || INSTALL_SOURCE.OFFICIAL,
    mirror_used: result.mirror_used === true,
  };
}

function combinedInstallProvenance(results) {
  const completed = (results || []).filter((result) => result && Array.isArray(result.attempts));
  if (completed.length === 0) return {};
  const mirrorUsed = completed.some((result) => result.mirror_used === true);
  const bothFailed = completed.some((result) => result.install_source === INSTALL_SOURCE.BOTH_FAILED);
  return {
    attempts: completed.flatMap((result) => result.attempts.map((attempt) => ({ ...attempt }))),
    install_source: bothFailed
      ? INSTALL_SOURCE.BOTH_FAILED
      : (mirrorUsed ? INSTALL_SOURCE.MIRROR : INSTALL_SOURCE.OFFICIAL),
    mirror_used: mirrorUsed,
  };
}

function applyInstallProvenance(target, result) {
  if (!target || !result) return;
  Object.assign(target, installProvenance(result));
}

function globalSkillInstalled(homeDir, skillName) {
  return [
    '.agents/skills',
    '.codex/skills',
    '.claude/skills',
    '.kiro/skills',
    '.qoder/skills',
  ].some((root) => fs.existsSync(path.join(homeDir, root, skillName, 'SKILL.md')));
}

module.exports = {
  applyInstallProvenance,
  combinedInstallProvenance,
  dependencyFor,
  executeInstallWithMirror,
  installBaselineHelpers,
  installBaselineTools,
  interpolateArgs,
  probeHelper,
  probeRegistry,
  resolveInstallation,
  warmupCacheHit,
};
