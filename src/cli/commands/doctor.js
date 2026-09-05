const fs = require('node:fs');
const path = require('node:path');
const { inspectInstalledAssets, listBundledCommands, loadPluginManifest } = require('../plugin');
const { readDeveloperFile, getGlobalDeveloperPath } = require('../developer');
const { isCommandTimeout, spawnSyncWithTimeout } = require('../external-command');
const { isLegacyManagedState, readState, readStateFileRaw } = require('../state');
const { getAdapter, getSupportedPlatforms } = require('../adapters');
const { inspectInstructionBootstrap } = require('../instruction-bootstrap');
const { formatInitGuidance } = require('../init-guidance');
const { inspectManagedClaudeHooks } = require('../claude-settings');
const { detectGlobalCodexHookPollution } = require('../adapters/codex');
const { resolveWorkflowArtifactDir, slugifyArtifactPathSegment } = require('../../verification/artifact-paths');
const { validateAgainstSchema } = require('../../contracts/schema-validator');
const { computeDecisionInputHealth } = require('../helpers/setup-facts');

const VERIFICATION_EVIDENCE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const VERIFICATION_EVIDENCE_SCHEMA_PATH = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'docs',
  'contracts',
  'verifiers',
  'verification-evidence.schema.json'
);

function runDoctor(argv) {
  const args = [...argv];
  const parsed = parseDoctorArgs(args);

  if (parsed.help) {
    printHelp();
    return 0;
  }

  if (parsed.unknown.length > 0) {
    console.error('Usage: spec-first doctor [--claude|--codex|--cursor|--kiro|--qoder|--opencode|--zcode|--pi] [--json] [--verbose]');
    return 2;
  }

  const projectRoot = process.cwd();

  // 确定要检查的平台：解析层已按 registry 生成宿主 flag，这里直接收集命中项。
  let platforms = getSupportedPlatforms().filter((platform) => parsed[platform]);
  const selectionMode = platforms.length > 0 ? 'explicit' : 'auto';

  // 无参数时自动检测
  if (platforms.length === 0) {
    platforms = detectPlatforms(projectRoot);
  }

  if (platforms.length === 0) {
    if (parsed.json) {
      printDoctorJson(buildDoctorReport({ projectRoot, platforms, selectionMode }));
      return 0;
    }

    console.log('No spec-first platform detected in this project.');
    console.log('Run `spec-first init` and select Claude Code, Codex, Cursor, Kiro, Qoder, and/or OpenCode when prompted to initialize.');
    return 0;
  }

  const report = buildDoctorReport({ projectRoot, platforms, selectionMode });

  if (parsed.json) {
    printDoctorJson(report);
    return report.has_error ? 3 : 0;
  }

  printDoctorHumanReport(report, { verbose: parsed.verbose });
  return report.has_error ? 3 : 0;
}

function printDoctorHumanReport(report, options) {
  for (const line of formatDoctorHumanReport(report, options)) {
    console.log(line);
  }
}

function formatDoctorHumanReport(report, { verbose = false } = {}) {
  const platforms = Array.isArray(report.platforms)
    ? report.platforms
    : Object.keys(report.platform_checks || {});
  const commonChecks = Array.isArray(report.common_checks) ? report.common_checks : [];
  const platformChecks = report.platform_checks || {};
  const hostSupport = report.host_support || {};
  const selectionMode = report.selection_mode === 'explicit' ? 'explicit' : 'auto';
  const allChecks = [
    ...commonChecks,
    ...platforms.flatMap((platform) => platformChecks[platform] || []),
  ];
  const hasError = report.has_error === true || allChecks.some((check) => check.level === 'ERROR');
  const attentionItems = [
    ...commonChecks
      .filter(isDoctorAttentionCheck)
      .map((check) => ({ scope: '通用环境', check })),
    ...platforms.flatMap((platform) => (platformChecks[platform] || [])
      .filter(isDoctorAttentionCheck)
      .map((check) => ({ scope: platform.toUpperCase(), check }))),
  ].map((item) => {
    const projection = buildRuntimeStatusProjection(item.check, {
      scope: item.scope,
      selectionMode,
    });
    return { ...item, disposition: projection.disposition, projection };
  });
  const requiredItems = attentionItems.filter((item) => item.disposition === 'action-required');
  const optionalItems = attentionItems.filter((item) => item.disposition === 'optional');
  const limitationItems = attentionItems.filter((item) => item.disposition === 'known-limitation');
  const degradedItems = attentionItems.filter((item) => item.disposition === 'degraded');
  const notRunItems = attentionItems.filter((item) => item.disposition === 'not-run');
  const result = hasError
    ? '不可用'
    : requiredItems.length > 0
      ? '可用，但需处理'
      : '可用';
  const lines = [
    `诊断结果：${result}`,
    '',
    '宿主状态：',
  ];

  if (platforms.length === 0) {
    lines.push('  未检测到宿主');
  } else {
    for (const platform of platforms) {
      lines.push(`  ${platform.toUpperCase()}：${describeDoctorPlatformStatus(
        platformChecks[platform] || [],
        {
          selectionMode,
          hostSupport: hostSupport[platform] || {},
        },
      )}`);
    }
  }

  appendDoctorAttentionSection(lines, '需要处理', requiredItems, 'required');
  appendDoctorAttentionSection(lines, '按需配置', optionalItems, 'optional');
  appendDoctorAttentionSection(lines, '已知限制', limitationItems, 'limitation');
  appendDoctorAttentionSection(lines, '降级状态', degradedItems, 'degraded');
  appendDoctorAttentionSection(lines, '未执行', notRunItems, 'not-run');

  if (!verbose) return lines;

  lines.push('', '详细检查：');
  appendDoctorCheckDetails(lines, '通用环境', commonChecks, { selectionMode });
  for (const platform of platforms) {
    appendDoctorCheckDetails(lines, platform.toUpperCase(), platformChecks[platform] || [], {
      selectionMode,
    });
  }
  return lines;
}

function isDoctorAttentionCheck(check) {
  return check.level === 'WARNING' || check.level === 'ERROR';
}

function resolveDoctorDisposition(check, { selectionMode = 'auto' } = {}) {
  if (check.level === 'ERROR') return 'action_required';
  if (check.level !== 'WARNING') return null;
  if (
    selectionMode === 'explicit'
    && typeof check.reasonCode === 'string'
    && check.reasonCode.endsWith('_cli_not_found')
  ) {
    return 'action_required';
  }
  if (
    check.disposition === 'action_required'
    || check.disposition === 'optional'
    || check.disposition === 'known_limitation'
  ) {
    return check.disposition;
  }
  if (check.degradedByDesign === true) return 'known_limitation';
  return 'action_required';
}

function buildRuntimeStatusProjection(check = {}, { scope = 'common', selectionMode = 'auto' } = {}) {
  const declaredStatus = check.runtimeStatus || check.runtime_status;
  const allowedStatuses = new Set([
    'ready',
    'no-change',
    'would-change',
    'apply-failed',
    'action-required',
    'optional',
    'known-limitation',
    'degraded',
    'not-run',
  ]);
  let status = allowedStatuses.has(declaredStatus) ? declaredStatus : null;
  if (!status) {
    if (check.level === 'PASS') status = 'ready';
    else if (check.level === 'ERROR') status = 'action-required';
    else if (check.level === 'WARNING') {
      const legacyDisposition = resolveDoctorDisposition(check, { selectionMode });
      status = legacyDisposition === 'action_required'
        ? 'action-required'
        : legacyDisposition === 'known_limitation'
          ? 'known-limitation'
          : legacyDisposition || 'degraded';
    } else {
      status = 'not-run';
    }
  }
  const disposition = ['ready', 'no-change'].includes(status)
    ? 'ready'
    : ['would-change', 'apply-failed', 'action-required'].includes(status)
      ? 'action-required'
      : status;
  return {
    schema_version: 'runtime-status-projection/v1',
    status,
    reason_code: check.reasonCode || check.reason_code || `doctor-${status}`,
    disposition,
    scope,
    artifact_refs: Array.isArray(check.artifact_refs)
      ? [...check.artifact_refs]
      : (Array.isArray(check.artifactRefs) ? [...check.artifactRefs] : []),
    next_action: check.fix || check.next_action || null,
  };
}

function appendDoctorAttentionSection(lines, title, items, kind) {
  if (items.length === 0) {
    if (kind === 'required') lines.push('', `${title}：无`);
    return;
  }

  lines.push('', `${title}：`);
  for (const { scope, check } of items) {
    lines.push(`  [${scope}] ${check.name}: ${check.message}`);
    if (kind === 'optional') {
      if (check.fix) lines.push(`    按需操作：${check.fix}`);
      continue;
    }
    if (kind === 'limitation') {
      if (check.fix) {
        lines.push(`    验证建议：${check.fix}`);
      } else {
        lines.push('    说明：当前为已知限制，无需手工修改用户配置。');
      }
      continue;
    }
    if (kind === 'degraded' || kind === 'not-run') {
      if (check.fix) lines.push(`    下一步：${check.fix}`);
      else lines.push(`    说明：${kind === 'degraded' ? '能力已降级，当前结论受限。' : '本项尚未执行，不能作为完成证据。'}`);
      continue;
    }
    if (check.fix) {
      lines.push(`    修复：${check.fix}`);
    } else {
      lines.push('    需要人工处理：此检查未提供可安全执行的修复建议；请根据诊断谨慎处理用户拥有的配置。');
    }
  }
}

function describeDoctorPlatformStatus(checks, { selectionMode = 'auto', hostSupport = {} } = {}) {
  if (!Array.isArray(checks) || checks.length === 0) return '未检测';
  if (checks.some((check) => check.level === 'ERROR')) return '有问题';
  const warningChecks = checks.filter((check) => check.level === 'WARNING');
  if (warningChecks.some((check) => (
    buildRuntimeStatusProjection(check, { selectionMode }).disposition === 'action-required'
  ))) return '需处理';
  if (warningChecks.some((check) => (
    typeof check.reasonCode === 'string' && check.reasonCode.endsWith('_cli_not_found')
  ))) return '未安装';
  if (
    hostSupport.support_state === 'preview'
    || warningChecks.some((check) => ['known-limitation', 'degraded'].includes(
      buildRuntimeStatusProjection(check, { selectionMode }).disposition,
    ))
  ) return hostSupport.support_state === 'preview' ? '预览/受限' : '受限';
  if (warningChecks.some((check) => (
    buildRuntimeStatusProjection(check, { selectionMode }).disposition === 'not-run'
  ))) return '未执行';
  return '正常';
}

function appendDoctorCheckDetails(lines, scope, checks, { selectionMode = 'auto' } = {}) {
  lines.push(`  ${scope}：`);
  for (const check of checks) {
    const label = String(check.level || 'UNKNOWN').toUpperCase().padEnd(7);
    lines.push(`    ${label} ${check.name}: ${check.message}`);
    if (check.fix) {
      const disposition = buildRuntimeStatusProjection(check, { scope, selectionMode }).disposition;
      const actionLabel = disposition === 'optional'
        ? '按需操作'
        : disposition === 'known-limitation'
          ? '验证建议'
          : ['degraded', 'not-run'].includes(disposition)
            ? '下一步'
          : '修复';
      lines.push(`             ${actionLabel}：${check.fix}`);
    } else if (buildRuntimeStatusProjection(check, { scope, selectionMode }).disposition === 'known-limitation') {
      lines.push('             说明：当前为已知限制，无需手工修改用户配置。');
    }
  }
}

function checkNodeVersion() {
  const version = process.version;
  const major = Number.parseInt(version.slice(1).split('.')[0], 10);
  if (Number.isFinite(major) && major >= 20) {
    return { level: 'PASS', name: 'Node.js', message: version };
  }

  return {
    level: 'ERROR',
    name: 'Node.js',
    message: version,
    fix: 'Install Node.js 20 or newer.',
  };
}

function checkGit() {
  const result = spawnSyncWithTimeout('git', ['--version'], { encoding: 'utf8' });
  if (result.status === 0) {
    return {
      level: 'PASS',
      name: 'Git',
      message: result.stdout.trim(),
    };
  }

  if (isCommandTimeout(result)) {
    return {
      level: 'ERROR',
      name: 'Git',
      message: 'version check timed out',
      fix: 'Run `git --version` manually and inspect PATH or shell startup scripts.',
    };
  }

  return {
    level: 'ERROR',
    name: 'Git',
    message: 'not found',
    fix: 'Install Git and ensure it is on PATH.',
  };
}

// doctor 探测的宿主 CLI 命令与显示名；未列出的宿主回退 claude/Claude Code。
const PLATFORM_CLI_PROBES = {
  opencode: { command: 'opencode', displayName: 'OpenCode' },
  codex: { command: 'codex', displayName: 'Codex' },
  cursor: { command: 'agent', displayName: 'Cursor CLI' },
  kiro: { command: 'kiro', displayName: 'Kiro' },
  qoder: { command: 'qodercli', displayName: 'Qoder' },
  zcode: { command: 'zcode', displayName: 'ZCode' },
  pi: { command: 'pi', displayName: 'Pi' },
};

function checkPlatformCli(platform, options = {}) {
  const { command, displayName } = PLATFORM_CLI_PROBES[platform]
    || { command: 'claude', displayName: 'Claude Code' };
  // Note: Codex CLI may not be available yet - this is expected during MVP phase
  const runner = options.runner || spawnSyncWithTimeout;
  const isWindows = options.platform === 'win32' || (options.platform === undefined && process.platform === 'win32');
  // Node >=20.12 rejects direct `.cmd` spawning with shell:false. Host CLIs are
  // fixed bare commands here, so use the Windows command interpreter only for
  // this version probe rather than weakening the generic process runner.
  const result = isWindows
    ? runner(options.comSpec || process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `${command} --version`], { encoding: 'utf8' })
    : runner(command, ['--version'], { encoding: 'utf8' });
  if (result.status === 0) {
    const output = result.stdout.trim();
    return {
      level: 'PASS',
      name: displayName,
      message: output || 'available',
      detectedVersion: extractDetectedVersion(output),
    };
  }

  if (isCommandTimeout(result)) {
    return {
      level: 'WARNING',
      name: displayName,
      message: 'version check timed out',
      reasonCode: `${platform}_cli_version_check_timeout`,
      disposition: options.selectionMode === 'explicit' ? 'action_required' : 'optional',
      fix: `Run \`${command} --version\` manually and inspect PATH or shell startup scripts.`,
    };
  }

  if (result.error && result.error.code === 'ENOENT') {
    return {
      level: 'WARNING',
      name: displayName,
      message: 'not found on PATH',
      reasonCode: `${platform}_cli_not_found`,
      disposition: options.selectionMode === 'explicit' ? 'action_required' : 'optional',
      fix: `Install ${displayName} and restart your shell.`,
    };
  }

  return {
    level: 'WARNING',
    name: displayName,
    message: 'could not verify version',
    reasonCode: `${platform}_cli_version_check_failed`,
    disposition: options.selectionMode === 'explicit' ? 'action_required' : 'optional',
    fix: `Run \`${command} --version\` manually to confirm the CLI works.`,
  };
}

function extractDetectedVersion(output) {
  const match = String(output || '').match(/\b\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?\b/);
  return match ? match[0] : null;
}

function checkGeneratedCommands(adapter, assetInspection) {
  if (assetInspection.error) {
    return {
      level: 'ERROR',
      name: `${adapter.commandRoot}`,
      message: formatInspectionError(assetInspection.error),
      fix: 'Reinstall the spec-first package so bundled command templates are available.',
    };
  }
  const commandStatus = assetInspection.inventory.commands;

  if (!fs.existsSync(commandStatus.targetRoot)) {
    return {
      level: 'WARNING',
      name: `${adapter.commandRoot}`,
      message: 'missing',
      fix: formatInitGuidance(adapter, 'in this project'),
    };
  }

  if (commandStatus.missing.length === 0 && (commandStatus.drifted || []).length === 0) {
    return {
      level: 'PASS',
      name: `${adapter.commandRoot}`,
      message: `found ${commandStatus.entries.length} command file(s)`,
    };
  }

  const driftMessage = formatDriftSummary(commandStatus.drifted || [], 'filename');
  if (commandStatus.missing.length === 0) {
    return {
      level: 'WARNING',
      name: `${adapter.commandRoot}`,
      message: `drifted ${driftMessage}`,
      fix: formatInitGuidance(adapter, 'to regenerate the drifted command files'),
    };
  }

  return {
    level: 'WARNING',
    name: `${adapter.commandRoot}`,
    message: [
      `missing ${commandStatus.missing.map((entry) => entry.filename).join(', ')}`,
      driftMessage ? `drifted ${driftMessage}` : null,
    ].filter(Boolean).join('; '),
    fix: formatInitGuidance(adapter, 'to regenerate the missing or drifted command files'),
  };
}

function checkInstalledSkills(adapter, assetInspection) {
  if (assetInspection.error) {
    return {
      level: 'ERROR',
      name: `${adapter.skillsRoot}`,
      message: formatInspectionError(assetInspection.error),
      fix: 'Reinstall the spec-first package so bundled skills are available.',
    };
  }
  const skillStatus = assetInspection.inventory.skills;

  if (!fs.existsSync(skillStatus.targetRoot)) {
    return {
      level: 'WARNING',
      name: `${adapter.skillsRoot}`,
      message: 'missing',
      fix: formatInitGuidance(adapter, 'in this project to install bundled skills'),
    };
  }

  if (skillStatus.missing.length === 0 && (skillStatus.drifted || []).length === 0) {
    return {
      level: 'PASS',
      name: `${adapter.skillsRoot}`,
      message: formatInstalledSkillInventory(adapter, skillStatus),
    };
  }

  const driftMessage = formatDriftSummary(skillStatus.drifted || [], 'skillName');
  if (skillStatus.missing.length === 0) {
    return {
      level: 'WARNING',
      name: `${adapter.skillsRoot}`,
      message: `drifted ${driftMessage}`,
      fix: formatInitGuidance(adapter, 'in this project to resync drifted bundled skills'),
    };
  }

  return {
    level: 'WARNING',
    name: `${adapter.skillsRoot}`,
    message: [
      `out of sync (${skillStatus.entries.length - skillStatus.missing.length}/${skillStatus.entries.length} installed)`,
      driftMessage ? `drifted ${driftMessage}` : null,
    ].filter(Boolean).join('; '),
    fix: formatInitGuidance(adapter, 'in this project to resync bundled skills'),
  };
}

function formatInstalledSkillInventory(adapter, skillStatus) {
  if (adapter.workflowsRoot === adapter.skillsRoot) {
    return `found ${skillStatus.entries.length} skill directory(ies)`;
  }

  const standaloneCount = (skillStatus.standaloneEntries || []).length;
  const internalCount = (skillStatus.internalEntries || []).length;
  const workflowCount = (skillStatus.workflowEntries || []).length;
  const skillsRootCount = standaloneCount + internalCount;
  return `found ${skillsRootCount} standalone/internal skill directory(ies) in ${adapter.skillsRoot} and ${workflowCount} workflow mirror directory(ies) in ${adapter.workflowsRoot}`;
}

function checkInstalledAgents(adapter, assetInspection) {
  if (assetInspection.error) {
    return {
      level: 'ERROR',
      name: `${adapter.agentsRoot}`,
      message: formatInspectionError(assetInspection.error),
      fix: 'Reinstall the spec-first package so bundled agents are available.',
    };
  }
  const agentStatus = assetInspection.inventory.agents;

  if (agentStatus.entries.length === 0) {
    return {
      level: 'PASS',
      name: `${adapter.agentsRoot}`,
      message: 'no bundled agents',
    };
  }

  if (!fs.existsSync(agentStatus.targetRoot)) {
    return {
      level: 'WARNING',
      name: `${adapter.agentsRoot}`,
      message: 'missing',
      fix: formatInitGuidance(adapter, 'in this project to install bundled agents'),
    };
  }

  if (agentStatus.missing.length === 0 && (agentStatus.drifted || []).length === 0) {
    return {
      level: 'PASS',
      name: `${adapter.agentsRoot}`,
      message: `found ${agentStatus.entries.length} agent file(s)`,
    };
  }

  const driftMessage = formatDriftSummary(agentStatus.drifted || [], 'agentPath');
  if (agentStatus.missing.length === 0) {
    return {
      level: 'WARNING',
      name: `${adapter.agentsRoot}`,
      message: `drifted ${driftMessage}`,
      fix: formatInitGuidance(adapter, 'in this project to resync drifted bundled agents'),
    };
  }

  return {
    level: 'WARNING',
    name: `${adapter.agentsRoot}`,
    message: [
      `out of sync (${agentStatus.entries.length - agentStatus.missing.length}/${agentStatus.entries.length} installed)`,
      driftMessage ? `drifted ${driftMessage}` : null,
    ].filter(Boolean).join('; '),
    fix: formatInitGuidance(adapter, 'in this project to resync bundled agents'),
  };
}

function checkInstalledAgentSupportFiles(adapter, assetInspection) {
  if (assetInspection.error) {
    return {
      level: 'ERROR',
      name: `${adapter.agentsRoot} support assets`,
      message: formatInspectionError(assetInspection.error),
      fix: 'Reinstall the spec-first package so bundled agent support assets are available.',
    };
  }
  const supportStatus = assetInspection.inventory.agentSupportFiles;

  if (supportStatus.entries.length === 0) {
    return {
      level: 'PASS',
      name: `${adapter.agentsRoot} support assets`,
      message: 'no bundled support assets',
    };
  }

  if (!fs.existsSync(supportStatus.targetRoot)) {
    return {
      level: 'WARNING',
      name: `${adapter.agentsRoot} support assets`,
      message: 'missing',
      fix: formatInitGuidance(adapter, 'in this project to install bundled agent support assets'),
    };
  }

  if (supportStatus.missing.length === 0 && (supportStatus.drifted || []).length === 0) {
    return {
      level: 'PASS',
      name: `${adapter.agentsRoot} support assets`,
      message: `found ${supportStatus.entries.length} support file(s)`,
    };
  }

  const driftMessage = formatDriftSummary(supportStatus.drifted || [], 'supportPath');
  if (supportStatus.missing.length === 0) {
    return {
      level: 'WARNING',
      name: `${adapter.agentsRoot} support assets`,
      message: `drifted ${driftMessage}`,
      fix: formatInitGuidance(adapter, 'in this project to resync drifted agent support assets'),
    };
  }

  return {
    level: 'WARNING',
    name: `${adapter.agentsRoot} support assets`,
    message: [
      `out of sync (${supportStatus.entries.length - supportStatus.missing.length}/${supportStatus.entries.length} installed)`,
      driftMessage ? `drifted ${driftMessage}` : null,
    ].filter(Boolean).join('; '),
    fix: formatInitGuidance(adapter, 'in this project to resync bundled agent support assets'),
  };
}

function checkPluginManifest() {
  try {
    const manifest = loadPluginManifest();
    const commandCount = listBundledCommands().length;
    return {
      level: 'PASS',
      name: 'runtime asset manifest',
      message: `${manifest.name}@${manifest.version} with ${commandCount} command definition(s)`,
    };
  } catch (error) {
    return {
      level: 'ERROR',
      name: 'runtime asset manifest',
      message: error instanceof Error ? error.message : String(error),
      fix: 'Restore bundled governance, command templates, skills, and agents, then reinstall the package.',
    };
  }
}

function inspectRuntimeAssetInventory(projectRoot, adapter) {
  try {
    return {
      inventory: inspectInstalledAssets(projectRoot, adapter),
      error: null,
    };
  } catch (error) {
    return {
      inventory: null,
      error,
    };
  }
}

function formatInspectionError(error) {
  return error instanceof Error ? error.message : String(error);
}

function buildDoctorCommonChecks(projectRoot, options = {}) {
  const checks = [
    checkNodeVersion(),
    checkGit(),
    checkPluginManifest(),
    checkGlobalDeveloper(projectRoot),
  ];
  const workspaceReadiness = options.workspaceReadiness || buildWorkspaceReadinessView({
    projectRoot,
    platforms: options.platforms || [],
    bundledManifestVersion: options.bundledManifestVersion,
    runWorkspaceGraphStatus: options.runWorkspaceGraphStatus,
    now: options.now,
  });
  if (workspaceReadiness) {
    checks.push(...buildWorkspaceReadinessChecks(workspaceReadiness));
  }
  return checks.filter(Boolean);
}

// 非 Git 需求父目录有四个刻意分离的 readiness surface。它们是当前本地观察，
// 不替代 workspace 级 receipt；外部 MCP startup 不属于 spec-first ownership，
// 也绝不能贡献给 managed_ready。
function buildWorkspaceReadinessView({
  projectRoot,
  platforms = [],
  bundledManifestVersion,
  runWorkspaceGraphStatus,
  now = new Date(),
} = {}) {
  const targets = resolveDoctorWorkspaceTargets(projectRoot);
  if (!targets || targets.topology !== 'requirement-workspace') return null;

  const children = Array.isArray(targets.repos) ? targets.repos : [];
  const hosts = [...new Set((platforms || []).filter(Boolean))];
  const selection = {
    source: 'current-workspace-target-discovery',
    workspace_root: targets.workspace_root,
    child_ids: children.map((child) => child.repo_id),
    hosts,
    confirmed: targets.manifest_error == null
      && (!Array.isArray(targets.ambiguous) || targets.ambiguous.length === 0)
      && children.length > 0
      && children.every((child) => child.needs_confirm !== true)
      && hosts.length > 0,
  };
  const selectionReason = workspaceSelectionReason(targets, hosts);
  const observedAt = now instanceof Date ? now.toISOString() : new Date(now).toISOString();
  const bundledVersion = bundledManifestVersion || bundledManifestVersionForDoctor();
  const projection = inspectWorkspaceProjection({
    children,
    hosts,
    bundledVersion,
    selection,
    selectionReason,
    observedAt,
  });
  const managedRuntime = inspectWorkspaceManagedRuntime({
    children,
    hosts,
    projection,
    selection,
    selectionReason,
    observedAt,
  });
  const workspaceGraph = inspectWorkspaceGraphLayer({
    projectRoot,
    selection,
    observedAt,
    runWorkspaceGraphStatus,
  });
  const externalMcp = {
    layer: 'external_mcp',
    status: 'not_evaluated',
    freshness: 'not_evaluated',
    reason_code: 'external-mcp-unmanaged',
    readiness_eligible: false,
    selection,
    evidence_paths: [],
    observed_at: observedAt,
    limitations: ['external-mcp-startup-is-unmanaged-and-not-evaluated'],
  };
  const managedLayers = [projection, managedRuntime];
  return {
    selection,
    managed_ready: selection.confirmed && managedLayers.every((layer) => layer.status === 'ready'),
    ready_denominator: ['projection', 'managed_runtime'],
    excluded_from_ready_denominator: ['workspace_graph', 'external_mcp'],
    layers: {
      projection,
      managed_runtime: managedRuntime,
      workspace_graph: workspaceGraph,
      external_mcp: externalMcp,
    },
  };
}

function resolveDoctorWorkspaceTargets(projectRoot) {
  try {
    const { resolveWorkspaceTargets } = require('../../../skills/spec-runtime-setup/scripts/lib/workspace-target.cjs');
    return resolveWorkspaceTargets({ cwd: projectRoot, allowDiscovery: true });
  } catch (_error) {
    return null;
  }
}

function bundledManifestVersionForDoctor() {
  try {
    return loadPluginManifest().version || null;
  } catch (_error) {
    return null;
  }
}

function workspaceSelectionReason(targets, hosts) {
  if (!hosts || hosts.length === 0) return 'doctor-host-selection-empty';
  if (targets.manifest_error) return targets.manifest_error;
  if (Array.isArray(targets.ambiguous) && targets.ambiguous.length > 0) return 'workspace-targets-ambiguous';
  if (!Array.isArray(targets.repos) || targets.repos.length === 0) return targets.reason_code || 'workspace-no-review-targets';
  if (targets.repos.some((child) => child.needs_confirm === true)) return 'workspace-repos-need-confirmation';
  return null;
}

function inspectWorkspaceProjection({ children, hosts, bundledVersion, selection, selectionReason, observedAt }) {
  if (selectionReason) return unavailableWorkspaceLayer('projection', selection, selectionReason, observedAt);
  if (!bundledVersion) return unavailableWorkspaceLayer('projection', selection, 'bundled-manifest-version-unknown', observedAt);
  const entries = [];
  for (const child of children) {
    for (const host of hosts) {
      entries.push(inspectChildProjection(child, host, bundledVersion));
    }
  }
  const incomplete = entries.filter((entry) => entry.status !== 'current');
  const stale = incomplete.some((entry) => entry.status === 'stale');
  const missing = incomplete.some((entry) => entry.status === 'missing');
  const unknown = incomplete.some((entry) => entry.status === 'unknown');
  return {
    layer: 'projection',
    status: incomplete.length === 0 ? 'ready' : (unknown ? 'unknown' : 'action_required'),
    freshness: incomplete.length === 0 ? 'current' : (stale ? 'stale' : (missing ? 'missing' : 'unknown')),
    reason_code: incomplete.length === 0 ? null : 'runtime-projection-incomplete',
    readiness_eligible: true,
    selection,
    evidence_paths: entries.map((entry) => entry.state_path),
    observed_at: observedAt,
    entries,
  };
}

function inspectChildProjection(child, host, bundledVersion) {
  const adapter = getAdapter(host);
  const statePath = path.join(child.git_root, adapter.stateFile);
  const entry = {
    child_id: child.repo_id,
    host,
    state_path: statePath,
    bundled_manifest_version: bundledVersion,
    recorded_manifest_version: null,
    status: 'unknown',
    reason_code: 'unknown-runtime-manifest-health',
  };
  const document = readDoctorJson(statePath);
  if (document.status === 'missing') return { ...entry, status: 'missing', reason_code: 'runtime-state-missing' };
  if (document.status !== 'ready') return { ...entry, reason_code: 'runtime-state-unreadable' };
  const version = document.value && typeof document.value.manifestVersion === 'string'
    ? document.value.manifestVersion
    : '';
  if (!version) return { ...entry, status: 'missing', reason_code: 'runtime-manifest-version-missing' };
  if (version !== bundledVersion) {
    return { ...entry, recorded_manifest_version: version, status: 'stale', reason_code: 'runtime-manifest-version-stale' };
  }
  return { ...entry, recorded_manifest_version: version, status: 'current', reason_code: null };
}

function inspectWorkspaceManagedRuntime({ children, hosts, projection, selection, selectionReason, observedAt }) {
  if (selectionReason) return unavailableWorkspaceLayer('managed_runtime', selection, selectionReason, observedAt);
  const projectionByScope = new Map((projection.entries || []).map((entry) => [`${entry.child_id}:${entry.host}`, entry]));
  const entries = [];
  for (const child of children) {
    for (const host of hosts) {
      entries.push(inspectChildManagedRuntime(child, host, projectionByScope.get(`${child.repo_id}:${host}`), selection));
    }
  }
  const unknown = entries.find((entry) => entry.status === 'unknown');
  const incomplete = entries.find((entry) => entry.status !== 'ready');
  return {
    layer: 'managed_runtime',
    status: incomplete ? (unknown ? 'unknown' : 'action_required') : 'ready',
    freshness: incomplete ? (unknown ? 'unknown' : 'stale') : 'current',
    reason_code: incomplete ? incomplete.reason_code : null,
    readiness_eligible: true,
    selection,
    evidence_paths: entries.flatMap((entry) => [entry.tool_facts_path, entry.runtime_capabilities_path]),
    observed_at: observedAt,
    entries,
  };
}

function inspectChildManagedRuntime(child, host, projection, selection) {
  const configDir = path.join(child.git_root, '.spec-first', 'config');
  const toolFactsPath = path.join(configDir, 'tool-facts.json');
  const runtimeCapabilitiesPath = path.join(configDir, 'runtime-capabilities.json');
  const entry = {
    child_id: child.repo_id,
    host,
    tool_facts_path: toolFactsPath,
    runtime_capabilities_path: runtimeCapabilitiesPath,
    status: 'unknown',
    reason_code: 'setup-facts-unavailable',
  };
  const toolFacts = readDoctorJson(toolFactsPath);
  if (toolFacts.status === 'missing') {
    return { ...entry, reason_code: 'setup-facts-missing' };
  }
  const runtimeCapabilities = readDoctorJson(runtimeCapabilitiesPath);
  if (runtimeCapabilities.status === 'missing') {
    return { ...entry, reason_code: 'setup-facts-missing' };
  }
  if (toolFacts.status !== 'ready' || runtimeCapabilities.status !== 'ready') {
    return { ...entry, reason_code: 'setup-facts-unreadable' };
  }
  const facts = toolFacts.value || {};
  const runtime = runtimeCapabilities.value || {};
  if (!samePath(facts.repo_root, child.git_root) || !samePath(runtime.repo_root, child.git_root)) {
    return { ...entry, reason_code: 'setup-facts-scope-mismatch' };
  }
  if (facts.host !== host || runtime.host !== host) {
    return { ...entry, reason_code: 'setup-facts-host-mismatch' };
  }
  if (!setupFactsMatchCurrentSelection(facts, selection)) {
    return { ...entry, reason_code: 'setup-facts-selection-mismatch' };
  }
  if (!hasValidTimestamp(facts.generated_at) || !hasValidTimestamp(runtime.generated_at)) {
    return { ...entry, reason_code: 'setup-facts-freshness-unknown' };
  }
  if (!projection || projection.status !== 'current') {
    return { ...entry, status: 'action_required', reason_code: 'runtime-projection-incomplete' };
  }
  const summary = runtime.setup_summary && typeof runtime.setup_summary === 'object'
    ? runtime.setup_summary
    : {};
  const manifest = summary.generated_runtime_manifest && typeof summary.generated_runtime_manifest === 'object'
    ? summary.generated_runtime_manifest
    : {};
  if (manifest.status !== 'current') {
    return { ...entry, status: 'action_required', reason_code: manifest.reason_code || 'setup-facts-runtime-manifest-not-current' };
  }
  if (summary.baseline_ready !== true || summary.host_runtime_ready !== true) {
    return { ...entry, status: 'action_required', reason_code: 'managed-runtime-action-required' };
  }
  return { ...entry, status: 'ready', reason_code: null, generated_at: runtime.generated_at };
}

function setupFactsMatchCurrentSelection(facts, selection) {
  const target = facts && facts.target;
  if (!target || typeof target !== 'object') return true;
  if (target.workspace_root && !samePath(target.workspace_root, selection.workspace_root)) return false;
  // 直接 child receipt 不声明 workspace 全量 child set；只有 all-repos receipt
  // 才有资格证明（或否定）该完整集合。
  if (target.mode !== 'workspace-all-repos' || !Array.isArray(target.candidates)) return true;
  const receiptIds = target.candidates
    .map((candidate) => candidate && (candidate.workspace_relative_path || candidate.repo_label))
    .filter(Boolean)
    .sort();
  const currentIds = selection.child_ids.slice().sort();
  return receiptIds.length === currentIds.length
    && receiptIds.every((id, index) => id === currentIds[index]);
}

function inspectWorkspaceGraphLayer({ projectRoot, selection, observedAt, runWorkspaceGraphStatus }) {
  let status;
  try {
    const runStatus = runWorkspaceGraphStatus
      || require('../../../skills/spec-runtime-setup/scripts/lib/workspace-graph-status.cjs').runWorkspaceGraphStatus;
    status = runStatus({ cwd: projectRoot, allowDiscovery: true });
  } catch (_error) {
    status = null;
  }
  if (!status) return unavailableWorkspaceLayer('workspace_graph', selection, 'workspace-graph-status-unavailable', observedAt, false);
  const workspace = status.workspace || {};
  const freshness = workspace.freshness && workspace.freshness.freshness
    ? workspace.freshness.freshness
    : (status.status === 'ready' ? 'current' : 'unknown');
  return {
    layer: 'workspace_graph',
    status: status.status || 'unknown',
    freshness,
    reason_code: status.reason_code || null,
    readiness_eligible: false,
    selection,
    evidence_paths: [workspace.state_path, workspace.merged_graph_path].filter(Boolean),
    observed_at: observedAt,
    advisory: true,
  };
}

function unavailableWorkspaceLayer(layer, selection, reasonCode, observedAt, readinessEligible = true) {
  return {
    layer,
    status: 'unknown',
    freshness: 'unknown',
    reason_code: reasonCode,
    readiness_eligible: readinessEligible,
    selection,
    evidence_paths: [],
    observed_at: observedAt,
  };
}

function readDoctorJson(filePath) {
  try {
    return { status: 'ready', value: JSON.parse(fs.readFileSync(filePath, 'utf8')) };
  } catch (error) {
    if (error && error.code === 'ENOENT') return { status: 'missing', value: null };
    return { status: 'unreadable', value: null };
  }
}

function samePath(left, right) {
  return typeof left === 'string' && path.resolve(left) === path.resolve(right);
}

function hasValidTimestamp(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function buildWorkspaceReadinessChecks(view) {
  return [
    workspaceLayerCheck(view.layers.projection, 'workspace projection'),
    workspaceLayerCheck(view.layers.managed_runtime, 'workspace managed runtime'),
    workspaceLayerCheck(view.layers.workspace_graph, 'workspace graph'),
    workspaceLayerCheck(view.layers.external_mcp, 'external MCP'),
  ];
}

function workspaceLayerCheck(layer, name) {
  const ready = layer.status === 'ready';
  const unmanaged = layer.status === 'not_evaluated';
  const level = ready || unmanaged ? 'PASS' : 'WARNING';
  const disposition = level === 'PASS'
    ? undefined
    : layer.status === 'action_required'
      ? 'action_required'
      : layer.readiness_eligible === false
        ? 'optional'
        : 'known_limitation';
  const message = unmanaged
    ? 'unmanaged / not evaluated; does not contribute to managed readiness.'
    : `${layer.status} (freshness=${layer.freshness || 'unknown'}; reason=${layer.reason_code || 'none'}).`;
  return {
    level,
    name,
    message,
    reasonCode: layer.reason_code || null,
    disposition,
    advisory: layer.readiness_eligible === false,
    workspace_readiness_layer: layer,
  };
}

// U4 / CR10 — advisory workspace-graph surface for non-Git multi-repo requirement
// parents. Never ERROR: absent graphs are a setup next-action, not a host-runtime
// failure. Single-repo / git cwd projects skip this check (return null).
function checkWorkspaceGraphStatus(projectRoot, deps = {}) {
  let runStatus;
  try {
    runStatus = deps.runWorkspaceGraphStatus
      || require('../../../skills/spec-runtime-setup/scripts/lib/workspace-graph-status.cjs').runWorkspaceGraphStatus;
  } catch (_error) {
    return {
      level: 'WARNING',
      name: 'workspace graph',
      message: 'workspace-graph status module unavailable',
      fix: 'Ensure skills/spec-runtime-setup is present in this package install.',
      reasonCode: 'workspace-graph-status-unavailable',
    };
  }

  let status;
  try {
    status = runStatus({ cwd: projectRoot, allowDiscovery: true });
  } catch (error) {
    return {
      level: 'WARNING',
      name: 'workspace graph',
      message: `workspace-graph status failed: ${error instanceof Error ? error.message : String(error)}`,
      fix: 'Inspect the requirement workspace root, then retry or run `spec-runtime-setup --only codegraph,graphify --workspace-graph-status`.',
      reasonCode: 'workspace-graph-status-failed',
    };
  }

  if (!status || status.status === 'skipped') {
    // Not a requirement workspace — host doctor stays silent.
    return null;
  }

  const childReady = Array.isArray(status.repos)
    ? status.repos.filter((repo) => repo.codegraph_present).length
    : 0;
  const childTotal = Array.isArray(status.repos) ? status.repos.length : 0;
  const merged = Boolean(status.workspace && status.workspace.merged_present);
  const hasManagedWorkspaceState = Boolean(status.workspace && (
    status.workspace.graphify_present
    || status.workspace.merged_present
    || (status.workspace.state_status && status.workspace.state_status !== 'missing')
  ));
  if (status.status === 'absent' && childTotal === 0 && !hasManagedWorkspaceState) {
    return null;
  }
  const defaultPath = status.default_project_path
    ? ` default projectPath=${status.default_project_path}`
    : ' default projectPath unavailable';
  const defaultNote = status.default_project_path && status.default_project_path_contained === false
    ? ' (projectPath containment failed — advisory)'
    : '';

  if (status.status === 'ready') {
    const size = status.workspace && status.workspace.merged_size_bytes != null
      ? ` merged_size=${status.workspace.merged_size_bytes}B`
      : '';
    return {
      level: 'PASS',
      name: 'workspace graph',
      message: `ready (${childReady}/${childTotal} child CodeGraph; merged Graphify present${size}).${defaultPath}${defaultNote}. Advisory only — confirm conclusions against child source. Do not cat merged-graph.json.`,
      reasonCode: 'workspace-graph-ready',
      advisory: true,
      workspace_graph: summarizeWorkspaceGraphForDoctor(status),
    };
  }

  if (status.status === 'needs-confirmation') {
    return {
      level: 'WARNING',
      name: 'workspace graph',
      message: `child repos need confirmation before build (${(status.pending_confirm || []).join(', ') || 'discovered'}).`,
      fix: 'Pass `--repos a,b` or add `.spec-first/workspace.yaml`, then run `spec-runtime-setup --only codegraph,graphify --workspace-graph`.',
      reasonCode: 'workspace-graph-needs-confirmation',
      advisory: true,
      workspace_graph: summarizeWorkspaceGraphForDoctor(status),
    };
  }

  if (status.status === 'partial') {
    return {
      level: 'WARNING',
      name: 'workspace graph',
      message: `partial (${childReady}/${childTotal} child CodeGraph; merged=${merged}).${defaultPath}${defaultNote}. Empty/partial results have no negative authority.`,
      fix: 'Re-run `spec-runtime-setup --only codegraph,graphify --workspace-graph` from this requirement folder; use `--workspace-graph-status` for details.',
      reasonCode: 'workspace-graph-partial',
      advisory: true,
      workspace_graph: summarizeWorkspaceGraphForDoctor(status),
    };
  }

  // absent or other non-ready statuses
  return {
    level: 'WARNING',
    name: 'workspace graph',
    message: `no managed two-layer graph yet (${status.status}).${defaultPath}${defaultNote}`,
    fix: 'From this non-Git multi-repo requirement folder run `spec-runtime-setup --only codegraph,graphify --workspace-graph [--repos a,b]`. Clean with `spec-first clean --workspace-graph`.',
    reasonCode: 'workspace-graph-absent',
    advisory: true,
    workspace_graph: summarizeWorkspaceGraphForDoctor(status),
  };
}

function summarizeWorkspaceGraphForDoctor(status) {
  return {
    status: status.status,
    workspace_root: status.workspace_root,
    child_count: Array.isArray(status.repos) ? status.repos.length : 0,
    children_with_codegraph: Array.isArray(status.repos)
      ? status.repos.filter((repo) => repo.codegraph_present).length
      : 0,
    merged_present: Boolean(status.workspace && status.workspace.merged_present),
    merged_size_bytes: status.workspace && status.workspace.merged_size_bytes != null
      ? status.workspace.merged_size_bytes
      : null,
    workspace_freshness: status.workspace && status.workspace.freshness
      ? status.workspace.freshness.freshness
      : 'unknown',
    workspace_state_status: status.workspace ? status.workspace.state_status || 'unknown' : 'unknown',
    refresh_mode: status.workspace ? status.workspace.refresh_mode || 'unknown' : 'unknown',
    default_project_path: status.default_project_path || null,
    default_project_path_contained: Boolean(status.default_project_path_contained),
    default_project_path_policy: status.default_project_path_policy || '',
    server_root_default_note: status.server_root_default_note || '',
  };
}

function buildDoctorReport({ projectRoot, platforms, selectionMode = 'auto' }) {
  const workspaceReadiness = buildWorkspaceReadinessView({ projectRoot, platforms });
  const commonChecks = buildDoctorCommonChecks(projectRoot, { platforms, workspaceReadiness });
  const platformChecksByPlatform = {};
  const runtimeChecksByPlatform = {};
  const hostChecksByPlatform = {};
  const hostSupportByPlatform = {};

  for (const platform of platforms) {
    const adapter = getAdapter(platform);
    const assetInspection = inspectRuntimeAssetInventory(projectRoot, adapter);
    const platformCliCheck = checkPlatformCli(platform, { selectionMode });
    const runtimeFileChecks = adapter.inspectRuntimeFiles(projectRoot);
    const commandChecks = adapter.hasCommands ? [checkGeneratedCommands(adapter, assetInspection)] : [];
    const hostSpecificChecks = buildHostSpecificChecks(projectRoot, adapter);
    const coreRuntimeChecks = [
      checkManagedState(projectRoot, adapter),
      checkInstructionBootstrap(projectRoot, adapter),
      ...runtimeFileChecks,
      ...commandChecks,
    ];
    const inventoryChecks = [
      checkInstalledSkills(adapter, assetInspection),
      ...(adapter.supportsAgents === false
        ? []
        : [
          checkInstalledAgents(adapter, assetInspection),
          checkInstalledAgentSupportFiles(adapter, assetInspection),
        ]),
    ];
    const runtimeChecks = [
      ...coreRuntimeChecks,
      ...inventoryChecks,
    ];
    const hostChecks = [
      platformCliCheck,
      ...hostSpecificChecks,
    ];

    runtimeChecksByPlatform[platform] = runtimeChecks;
    hostChecksByPlatform[platform] = hostChecks;
    hostSupportByPlatform[platform] = buildHostSupportView(
      adapter,
      platformCliCheck,
      runtimeFileChecks,
    );
    platformChecksByPlatform[platform] = [
      platformCliCheck,
      ...coreRuntimeChecks,
      ...hostSpecificChecks,
      ...inventoryChecks,
    ];
  }

  // Workspace readiness 是独立 advisory view。缺失 child projection 不能改写
  // package/Node/Git installation health aggregate。
  const installHealth = summarizeChecks(commonChecks.filter((check) => !check.workspace_readiness_layer));
  const runtimeAssetHealth = platforms.length === 0
    ? 'not_applicable'
    : summarizeChecks(Object.values(runtimeChecksByPlatform).flat());
  const hostReadiness = platforms.length === 0
    ? 'not_applicable'
    : summarizeChecks(Object.values(hostChecksByPlatform).flat());
  const workflowRunnability = computeWorkflowRunnability({
    projectRoot,
    platforms,
    runtimeAssetHealth,
    hostReadiness,
    runtimeChecksByPlatform,
  });
  const decisionInput = computeDecisionInputHealth({
    projectRoot,
    platforms,
  });
  const allChecks = [
    ...commonChecks,
    ...Object.values(platformChecksByPlatform).flat(),
  ];
  const runtimeStatusProjections = [
    ...commonChecks.map((check) => buildRuntimeStatusProjection(check, {
      scope: 'common',
      selectionMode,
    })),
    ...platforms.flatMap((platform) => (platformChecksByPlatform[platform] || []).map((check) => (
      buildRuntimeStatusProjection(check, { scope: platform, selectionMode })
    ))),
  ];

  return {
    schema_version: 'v1',
    platforms,
    selection_mode: selectionMode,
    install_health: installHealth,
    runtime_asset_health: runtimeAssetHealth,
    host_readiness: hostReadiness,
    decision_input_health: decisionInput.status,
    decision_input_health_basis: decisionInput.basis,
    workflow_runnability: workflowRunnability.status,
    workflow_runnability_basis: workflowRunnability.basis,
    workspace_readiness: workspaceReadiness,
    host_support: hostSupportByPlatform,
    common_checks: commonChecks,
    platform_checks: platformChecksByPlatform,
    runtime_status_projections: runtimeStatusProjections,
    checks: allChecks,
    warnings: allChecks.filter((check) => check.level === 'WARNING'),
    has_error: allChecks.some((check) => check.level === 'ERROR'),
  };
}

function summarizeChecks(checks) {
  if (!Array.isArray(checks) || checks.length === 0) return 'not_applicable';
  if (checks.some((check) => check.level === 'ERROR')) return 'error';
  if (checks.some((check) => check.level === 'WARNING')) return 'warn';
  return 'pass';
}

function printDoctorJson(report) {
  console.log(JSON.stringify({
    schema_version: report.schema_version,
    platforms: report.platforms,
    selection_mode: report.selection_mode,
    install_health: report.install_health,
    runtime_asset_health: report.runtime_asset_health,
    host_readiness: report.host_readiness,
    decision_input_health: report.decision_input_health,
    decision_input_health_basis: report.decision_input_health_basis,
    workflow_runnability: report.workflow_runnability,
    workflow_runnability_basis: report.workflow_runnability_basis,
    workspace_readiness: report.workspace_readiness,
    host_support: report.host_support,
    checks: report.checks,
    common_checks: report.common_checks,
    platform_checks: report.platform_checks,
    runtime_status_projections: report.runtime_status_projections,
    warnings: report.warnings,
  }, null, 2));
}

function buildHostSupportView(adapter, platformCliCheck, runtimeFileChecks = []) {
  const reasonCodes = [...new Set(
    [platformCliCheck, ...runtimeFileChecks]
      .map((check) => check && check.reasonCode)
      .filter(Boolean),
  )];
  const testedVersions = Array.isArray(adapter.testedVersions)
    ? [...adapter.testedVersions]
    : [];
  const evidenceClaim = adapter.evidenceClaim || null;
  return {
    support_state: adapter.supportState || 'active',
    evidence_claim: evidenceClaim,
    detected_version: platformCliCheck && platformCliCheck.detectedVersion
      ? platformCliCheck.detectedVersion
      : null,
    tested_versions: testedVersions,
    loader_evidence: evidenceClaim !== 'generated_runtime_preview' && testedVersions.length > 0,
    reason_codes: reasonCodes,
  };
}

function computeWorkflowRunnability({
  projectRoot,
  platforms,
  runtimeAssetHealth,
  hostReadiness,
  runtimeChecksByPlatform,
}) {
  const evidence = readWorkflowVerificationEvidence(projectRoot);
  const basis = {
    runtime_assets_ready: runtimeAssetHealth === 'pass',
    host_readiness_ready: hostReadiness !== 'error' && hostReadiness !== 'not_applicable',
    managed_state_present: false,
    workflow_surface_resolved: false,
    execution_evidence_present: evidence.present,
    evidence_present: evidence.present,
    evidence_path: evidence.path,
    evidence_source: evidence.source,
    evidence_schema_valid: evidence.schemaValid,
    evidence_freshness: evidence.freshness,
    evidence_age_summary: evidence.ageSummary,
    fallback_reason: evidence.fallbackReason,
    reason: '',
  };

  if (platforms.length === 0) {
    basis.reason = 'No initialized platform detected, so workflow runnability is not verified.';
    return {
      status: 'not_verified',
      basis,
    };
  }

  basis.managed_state_present = platforms.every((platform) => {
    const adapter = getAdapter(platform);
    return hasPassingCheck(runtimeChecksByPlatform[platform], adapter.stateFile);
  });

  basis.workflow_surface_resolved = platforms.every((platform) => {
    const adapter = getAdapter(platform);
    const requiredChecks = [
      adapter.stateFile,
      adapter.skillsRoot,
    ];

    if (adapter.supportsAgents !== false) {
      requiredChecks.push(adapter.agentsRoot);
    }

    if (adapter.hasCommands) {
      requiredChecks.push(adapter.commandRoot);
    }

    return requiredChecks.every((checkName) => hasPassingCheck(runtimeChecksByPlatform[platform], checkName));
  });

  if (
    basis.runtime_assets_ready &&
    basis.host_readiness_ready &&
    basis.managed_state_present &&
    basis.workflow_surface_resolved
  ) {
    if (
      basis.execution_evidence_present &&
      basis.evidence_schema_valid &&
      basis.evidence_freshness === 'fresh'
    ) {
      basis.reason = hostReadiness === 'warn'
        ? 'Runtime assets and workflow surfaces are ready, host readiness only has non-blocking warnings, and execution evidence is recorded.'
        : 'Runtime assets, host readiness, and workflow surfaces are ready, and execution evidence is recorded.';
      return {
        status: 'verified',
        basis,
      };
    }

    const evidenceReason = describeEvidenceFallback(basis.fallback_reason);
    basis.reason = hostReadiness === 'warn'
      ? `Runtime assets and workflow surfaces are ready, host readiness only has non-blocking warnings, but execution evidence is not verification-grade (${evidenceReason}).`
      : `Runtime assets and workflow surfaces are ready, but execution evidence is not verification-grade (${evidenceReason}).`;
    return {
      status: 'simulated',
      basis,
    };
  }

  basis.reason = 'Workflow runnability remains unverified because runtime assets or workflow surfaces are incomplete.';
  return {
    status: 'not_verified',
    basis,
  };
}

function hasPassingCheck(checks, name) {
  return Array.isArray(checks) && checks.some((check) => check.name === name && check.level === 'PASS');
}

function formatDriftSummary(entries, key) {
  if (!Array.isArray(entries) || entries.length === 0) return '';
  return entries
    .slice(0, 3)
    .map((entry) => {
      const id = entry && entry[key] ? entry[key] : 'unknown';
      const issue = Array.isArray(entry && entry.issues) && entry.issues.length > 0
        ? entry.issues[0]
        : 'content_mismatch';
      return `${id} (${issue})`;
    })
    .join(', ');
}

function readWorkflowVerificationEvidence(projectRoot) {
  const slug = slugifyArtifactPathSegment(path.basename(path.resolve(projectRoot)), 'workspace');
  const artifactDir = resolveWorkflowArtifactDir(projectRoot, 'verification', slug);
  const evidenceFilePath = path.join(artifactDir, 'verification-evidence.json');
  const relativePath = path.relative(projectRoot, evidenceFilePath).replace(/\\/g, '/');
  const rawDocument = readJsonDocument(evidenceFilePath);
  const rawSchemaValidation = rawDocument.parsed
    ? validateAgainstSchema(loadVerificationEvidenceSchema(), rawDocument.parsed)
    : { valid: false, errors: rawDocument.exists ? ['verification evidence parse failure'] : ['verification evidence missing'] };

  const evidenceItems = rawSchemaValidation.valid && rawDocument.parsed && Array.isArray(rawDocument.parsed.evidence_items)
    ? rawDocument.parsed.evidence_items
    : [];
  const effectiveGateIds = unique(evidenceItems.flatMap((item) => Array.isArray(item.gate_ids) ? item.gate_ids : []));
  const present = rawSchemaValidation.valid && evidenceItems.length > 0;
  const freshness = determineEvidenceFreshness(evidenceItems);

  return {
    present,
    path: relativePath,
    source: rawDocument.parsed && typeof rawDocument.parsed.evidence_source === 'string'
      ? rawDocument.parsed.evidence_source
      : null,
    schemaValid: rawSchemaValidation.valid,
    freshness,
    ageSummary: buildEvidenceAgeSummary(evidenceItems),
    fallbackReason: determineEvidenceFallbackReason({
      rawDocument,
      schemaValid: rawSchemaValidation.valid,
      effectiveGateIds,
      present,
      freshness,
    }),
  };
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

let verificationEvidenceSchemaCache = null;

function loadVerificationEvidenceSchema() {
  if (!verificationEvidenceSchemaCache) {
    verificationEvidenceSchemaCache = JSON.parse(fs.readFileSync(VERIFICATION_EVIDENCE_SCHEMA_PATH, 'utf8'));
  }
  return verificationEvidenceSchemaCache;
}

function readJsonDocument(filePath) {
  if (!fs.existsSync(filePath)) {
    return {
      exists: false,
      parsed: null,
    };
  }

  try {
    return {
      exists: true,
      parsed: JSON.parse(fs.readFileSync(filePath, 'utf8')),
    };
  } catch (_error) {
    return {
      exists: true,
      parsed: null,
    };
  }
}

function determineEvidenceFreshness(evidenceItems = []) {
  if (!Array.isArray(evidenceItems) || evidenceItems.length === 0) {
    return 'missing';
  }

  const now = Date.now();
  for (const item of evidenceItems) {
    const capturedAt = item && item.captured_at;
    const capturedMs = Date.parse(capturedAt);
    if (!capturedAt || !Number.isFinite(capturedMs)) {
      return 'unknown';
    }
    if ((now - capturedMs) > VERIFICATION_EVIDENCE_MAX_AGE_MS) {
      return 'stale';
    }
  }

  return 'fresh';
}

function buildEvidenceAgeSummary(evidenceItems = []) {
  const parsedEvidence = Array.isArray(evidenceItems)
    ? evidenceItems
      .map((item) => {
        const capturedAt = item && typeof item.captured_at === 'string' ? item.captured_at : null;
        const capturedMs = capturedAt ? Date.parse(capturedAt) : Number.NaN;
        if (!capturedAt || !Number.isFinite(capturedMs)) {
          return null;
        }

        return { capturedAt, capturedMs };
      })
      .filter(Boolean)
    : [];

  if (parsedEvidence.length === 0) {
    return {
      oldest_captured_at: null,
      oldest_age_ms: null,
      newest_captured_at: null,
      newest_age_ms: null,
      max_age_ms: VERIFICATION_EVIDENCE_MAX_AGE_MS,
    };
  }

  const now = Date.now();
  let oldest = parsedEvidence[0];
  let newest = parsedEvidence[0];

  for (const evidence of parsedEvidence.slice(1)) {
    if (evidence.capturedMs < oldest.capturedMs) {
      oldest = evidence;
    }
    if (evidence.capturedMs > newest.capturedMs) {
      newest = evidence;
    }
  }

  return {
    oldest_captured_at: oldest.capturedAt,
    oldest_age_ms: now - oldest.capturedMs,
    newest_captured_at: newest.capturedAt,
    newest_age_ms: now - newest.capturedMs,
    max_age_ms: VERIFICATION_EVIDENCE_MAX_AGE_MS,
  };
}

function determineEvidenceFallbackReason({
  rawDocument,
  schemaValid,
  effectiveGateIds,
  present,
  freshness,
}) {
  if (!rawDocument.exists) return 'verification_evidence_missing';
  if (!schemaValid) return 'verification_evidence_schema_invalid';
  if (!Array.isArray(effectiveGateIds) || effectiveGateIds.length === 0) return 'verification_gates_unresolved';
  if (!present) return 'verification_evidence_not_relevant';
  if (freshness === 'stale') return 'verification_evidence_stale';
  if (freshness === 'unknown') return 'verification_evidence_freshness_unknown';
  return null;
}

function describeEvidenceFallback(fallbackReason) {
  if (fallbackReason === 'verification_evidence_missing') return 'no workflow verification evidence recorded';
  if (fallbackReason === 'verification_evidence_schema_invalid') return 'workflow verification evidence is schema-invalid';
  if (fallbackReason === 'verification_gates_unresolved') return 'effective verification gates are unresolved';
  if (fallbackReason === 'verification_evidence_not_relevant') return 'workflow verification evidence does not satisfy current effective gates';
  if (fallbackReason === 'verification_evidence_stale') return 'workflow verification evidence is stale';
  if (fallbackReason === 'verification_evidence_freshness_unknown') return 'workflow verification evidence freshness is unknown';
  return 'workflow verification evidence is incomplete';
}

function checkGlobalDeveloper(projectRoot) {
  const developerPath = getGlobalDeveloperPath();
  const displayName = '~/.spec-first/.developer';
  if (!fs.existsSync(developerPath)) {
    return {
      level: 'WARNING',
      name: displayName,
      message: 'missing',
      fix: 'Run `spec-first init` and choose a developer name and language to write the global developer profile.',
    };
  }

  const developer = readDeveloperFile(developerPath);
  if (!developer) {
    return {
      level: 'ERROR',
      name: displayName,
      message: 'invalid or empty',
      fix: 'Run `spec-first init` and choose a developer name and language to regenerate the global developer profile.',
    };
  }

  if (
    typeof developer.name !== 'string' ||
    developer.name.length === 0 ||
    typeof developer.lang !== 'string' ||
    (developer.lang !== 'zh' && developer.lang !== 'en')
  ) {
    return {
      level: 'ERROR',
      name: displayName,
      message: 'invalid or incomplete',
      fix: 'Run `spec-first init` and choose a developer name and language to regenerate the global developer profile.',
    };
  }

  return {
    level: 'PASS',
    name: displayName,
    message: `${developer.name} (${developer.lang})${developer.version ? ` ${developer.version}` : ''}`,
  };
}

function checkManagedState(projectRoot, adapter) {
  const statePath = path.join(projectRoot, adapter.stateFile);
  if (!fs.existsSync(statePath)) {
    return {
      level: 'WARNING',
      name: `${adapter.stateFile}`,
      message: 'missing',
      fix: formatInitGuidance(adapter, 'in this project to record managed assets'),
    };
  }

  try {
    const state = readState(projectRoot, adapter);
    const manifest = loadPluginManifest();
    if (!state || !state.manifestVersion) {
      return {
        level: 'WARNING',
        name: `${adapter.stateFile}`,
        message: 'invalid or empty',
        fix: formatInitGuidance(adapter, 'in this project to regenerate the managed asset state'),
      };
    }

    if (state.manifestVersion !== manifest.version) {
      return {
        level: 'WARNING',
        name: `${adapter.stateFile}`,
        message: `recorded ${state.manifestVersion}, bundled ${manifest.version}`,
        fix: formatInitGuidance(adapter, 'in this project to resync managed assets after upgrading'),
      };
    }

    return {
      level: 'PASS',
      name: `${adapter.stateFile}`,
      message: `recorded ${state.commands.length} commands, ${state.skills.length} standalone skills, ${state.workflowSkills.length} workflow skills, ${state.agents.length} agents, ${state.agentSupportFiles.length} support files`,
    };
  } catch (error) {
    const rawState = tryReadRawManagedState(projectRoot, adapter);
    if (isLegacyManagedState(rawState)) {
      return {
        level: 'WARNING',
        name: `${adapter.stateFile}`,
        message: `legacy managed state detected (${error instanceof Error ? error.message : String(error)})`,
        fix: formatInitGuidance(adapter, 'in this project to perform a managed hard reset and rebuild the current runtime'),
      };
    }

    return {
      level: 'WARNING',
      name: `${adapter.stateFile}`,
      message: error instanceof Error ? error.message : String(error),
      fix: formatInitGuidance(adapter, 'in this project to regenerate the managed asset state'),
    };
  }
}

function checkInstructionBootstrap(projectRoot, adapter) {
  const status = inspectInstructionBootstrap(projectRoot, adapter);
  if (status.status === 'installed') {
    return {
      level: 'PASS',
      name: `${adapter.instructionFile} workflow entry guidance`,
      message: status.message,
    };
  }

  return {
    level: 'WARNING',
    name: `${adapter.instructionFile} workflow entry guidance`,
    message: status.message,
    fix: formatInitGuidance(adapter, 'in this project to restore the merged language/governance block'),
  };
}

function buildHostSpecificChecks(projectRoot, adapter) {
  if (adapter.id === 'codex') {
    return buildCodexGlobalHookPollutionChecks();
  }

  if (adapter.id === 'qoder') {
    return [checkQoderLocalMcpConfig(projectRoot)];
  }

  if (adapter.id === 'cursor') {
    return [checkCursorProjectMcpConfig(projectRoot)];
  }

  if (adapter.id === 'pi') {
    return [checkPiProjectTrustGate()];
  }

  if (adapter.id !== 'claude') {
    return [];
  }

  return inspectManagedClaudeHooks(projectRoot).map((status) => {
    const check = {
      level: status.status === 'installed' ? 'PASS' : 'WARNING',
      name: `.claude/settings.json ${status.displayName}`,
      message: status.message,
    };
    if (status.status !== 'installed') {
      check.fix = formatInitGuidance('claude', `in this project to restore the managed ${status.displayName} matcher`);
    }
    return check;
  });
}

function checkPiProjectTrustGate() {
  // Pi 以项目信任门控项目级 .agents/skills 与 .pi/ 资源。未信任时投影已安装
  // 但静默不加载，因此 doctor 把激活步骤作为 preview 宿主的已知限制呈现，
  // 而非安装缺陷。
  return {
    level: 'WARNING',
    name: 'Pi project trust',
    message: 'pi loads project-level skills only after the project is trusted (skills discovery and the trust gate are live-verified on pi 0.85.0; AGENTS.md injection and model-mediated /skill: invocation remain docs-verified only)',
    reasonCode: 'pi_project_trust_gate',
    runtimeStatus: 'known-limitation',
    fix: 'Run `pi` in this project and confirm the trust prompt (or trust once with `pi -a`); project-level .agents/skills stays silent until the project is trusted.',
  };
}

function checkCursorProjectMcpConfig(projectRoot) {
  const relativePath = '.cursor/mcp.json';
  const configPath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(configPath)) {
    return {
      level: 'WARNING',
      name: relativePath,
      message: 'missing project MCP config',
      reasonCode: 'cursor_mcp_config_missing',
      disposition: 'optional',
      fix: 'Run `spec-runtime-setup` when MCP setup is required.',
    };
  }

  const document = readJsonDocument(configPath);
  if (!document.parsed || typeof document.parsed !== 'object') {
    return {
      level: 'WARNING',
      name: relativePath,
      message: 'invalid JSON',
      fix: 'Repair the project Cursor MCP config or rerun Cursor Runtime Setup.',
    };
  }

  const servers = document.parsed.mcpServers;
  const serverCount = servers && typeof servers === 'object' && !Array.isArray(servers)
    ? Object.keys(servers).length
    : 0;

  return {
    level: serverCount > 0 ? 'PASS' : 'WARNING',
    name: relativePath,
    message: serverCount > 0
      ? `found ${serverCount} project MCP server entr${serverCount === 1 ? 'y' : 'ies'}`
      : 'found project MCP config with no mcpServers entries',
    reasonCode: serverCount > 0 ? undefined : 'cursor_mcp_config_empty',
    disposition: serverCount > 0 ? undefined : 'optional',
    fix: serverCount > 0 ? undefined : 'Run `spec-runtime-setup` when MCP setup is required.',
  };
}

function checkQoderLocalMcpConfig(projectRoot) {
  const relativePath = '.qoder/settings.local.json';
  const configPath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(configPath)) {
    return {
      level: 'WARNING',
      name: relativePath,
      message: 'missing local MCP config',
      reasonCode: 'qoder_mcp_config_missing',
      disposition: 'optional',
      fix: 'Run `spec-runtime-setup` when MCP setup is required.',
    };
  }

  const document = readJsonDocument(configPath);
  if (!document.parsed || typeof document.parsed !== 'object') {
    return {
      level: 'WARNING',
      name: relativePath,
      message: 'invalid JSON',
      fix: 'Repair the local Qoder MCP config or rerun Qoder Runtime Setup.',
    };
  }

  const servers = document.parsed.mcpServers;
  const serverCount = servers && typeof servers === 'object' && !Array.isArray(servers)
    ? Object.keys(servers).length
    : 0;

  return {
    level: serverCount > 0 ? 'PASS' : 'WARNING',
    name: relativePath,
    message: serverCount > 0
      ? `found ${serverCount} local MCP server entr${serverCount === 1 ? 'y' : 'ies'}`
      : 'found local MCP config with no mcpServers entries',
    reasonCode: serverCount > 0 ? undefined : 'qoder_mcp_config_empty',
    disposition: serverCount > 0 ? undefined : 'optional',
    fix: serverCount > 0 ? undefined : 'Run `spec-runtime-setup` when MCP setup is required.',
  };
}

// Codex fires global (CODEX_HOME/hooks.json) and project SessionStart hooks additively. A
// spec-first-managed SessionStart in the global location double-injects into every project.
// Surface it as advisory (read-only); cleanup is a user action, not auto-applied.
function buildCodexGlobalHookPollutionChecks() {
  let result;
  try {
    result = detectGlobalCodexHookPollution();
  } catch {
    return [];
  }
  if (!result || !result.polluted) {
    return [];
  }
  return [{
    level: 'WARNING',
    name: 'Codex global SessionStart hook',
    message: `spec-first SessionStart hook found in the Codex global hook location (${result.hooksJsonPath}); `
      + 'it fires for every project and double-injects alongside each project\'s own hook.',
    fix: `Remove the spec-first SessionStart entry from ${result.hooksJsonPath} `
      + `(delete the file if it has no other hooks), or run \`spec-first clean --codex\` in ${result.codexHome}. `
      + 'If clean reports no managed state, remove the SessionStart entry manually.',
  }];
}

function printHelp() {
  console.log([
    '🩺 spec-first doctor',
    '',
	    '📘 Usage:',
	    '  spec-first doctor [--claude|--codex|--cursor|--kiro|--qoder|--opencode|--zcode|--pi] [--json] [--verbose]',
	    '  --verbose  在简明总览后显示所有检查明细。',
	    '',
	    '📊 JSON status fields:',
	    '  install_health: Node/Git/package-level checks for running the CLI.',
	    '  runtime_asset_health: managed Claude/Codex/Cursor/Kiro/Qoder/OpenCode/ZCode/Pi runtime assets generated by spec-first init.',
	    '  host_readiness: host CLI and host-specific project wiring checks.',
	    '  decision_input_health: pass | warn | error | stale | missing | not_checked.',
	    '  workflow_runnability: verified | simulated | not_verified.',
	    '',
	    '🧭 Workflow runnability:',
	    '  verified: runtime surface is ready and fresh verification evidence is recorded.',
	    '  simulated: runtime surface is ready, but verification evidence is missing, stale, or incomplete.',
	    '  not_verified: runtime assets or workflow surfaces are incomplete.',
	    '  workflow_runnability_basis.fallback_reason explains evidence issues such as verification_evidence_stale.',
	    '',
	    '🔎 Boundaries:',
	    '  doctor checks CLI install, managed runtime assets, host readiness, and workflow verification evidence.',
	    '  When setup facts exist, doctor reads .spec-first/config/tool-facts.json for decision_input_health.',
	    '  MCP/helper setup is handled by the matching `spec-runtime-setup` workflow entrypoint.',
	    '  Canonical entry: `spec-runtime-setup` (Claude/Qoder command `runtime-setup`); no legacy alias.',
	    '  On a non-Git multi-repo requirement parent, doctor separately reports child runtime projection, managed',
	    '  setup facts, optional workspace graph, and unmanaged external MCP. Only projection + managed facts can',
	    '  contribute to managed readiness; graph remains advisory and external MCP is not evaluated. Detail and',
	    '  mutation stay under `spec-runtime-setup --workspace-graph*` and `spec-first clean --workspace-graph`.',
	    '',
	    '🔗 Repository:',
	    '  https://github.com/sunrain520/spec-first',
	  ].join('\n'));
}

function detectPlatforms(projectRoot) {
  return getSupportedPlatforms().filter(platform => {
    const adapter = getAdapter(platform);
    return isPlatformRuntimeDetected(projectRoot, adapter);
  });
}

function isPlatformRuntimeDetected(projectRoot, adapter) {
  // ZCode/Pi 按受管 state file 判定而非裸 runtime 目录：宿主客户端可能自建
  // 项目级 `.zcode/`/`.pi/` 内容（settings、prompts、extensions）而 spec-first
  // 并未安装。
  if (!['kiro', 'qoder', 'cursor', 'opencode', 'zcode', 'pi'].includes(adapter.id)) {
    return fs.existsSync(path.join(projectRoot, adapter.runtimeRoot));
  }

  if (adapter.id === 'qoder' || adapter.id === 'cursor' || adapter.id === 'opencode' || adapter.id === 'zcode' || adapter.id === 'pi') {
    return fs.existsSync(path.join(projectRoot, adapter.stateFile));
  }

  const runtimePaths = [
    adapter.stateFile,
    adapter.skillsRoot,
    adapter.agentsRoot,
  ];

  return runtimePaths.some((runtimePath) => fs.existsSync(path.join(projectRoot, runtimePath)));
}

// 宿主 flag 集合从 registry 派生：新增宿主时 doctor 的解析面随 getSupportedPlatforms() 自动扩展。
const DOCTOR_HOST_FLAGS = new Map(
  getSupportedPlatforms().map((platform) => [`--${platform}`, platform]),
);

function parseDoctorArgs(argv) {
  const parsed = {
    json: false,
    verbose: false,
    unknown: [],
  };
  for (const platform of getSupportedPlatforms()) {
    parsed[platform] = false;
  }

  for (const arg of argv) {
    if (arg === '-h' || arg === '--help') {
      parsed.help = true;
    } else if (DOCTOR_HOST_FLAGS.has(arg)) {
      parsed[DOCTOR_HOST_FLAGS.get(arg)] = true;
    } else if (arg === '--json') {
      parsed.json = true;
    } else if (arg === '--verbose') {
      parsed.verbose = true;
    } else {
      parsed.unknown.push(arg);
    }
  }

  return parsed;
}

function tryReadRawManagedState(projectRoot, adapter) {
  try {
    return readStateFileRaw(projectRoot, adapter);
  } catch (_error) {
    return null;
  }
}

module.exports = {
  runDoctor,
  detectPlatforms,
  checkWorkspaceGraphStatus,
  buildWorkspaceReadinessView,
  buildDoctorCommonChecks,
  buildDoctorReport,
  buildRuntimeStatusProjection,
  buildHostSupportView,
  formatDoctorHumanReport,
  checkPlatformCli,
  checkNodeVersion,
  checkGit,
  parseDoctorArgs,
  readWorkflowVerificationEvidence,
};
