/**
 * update CLI 命令
 * spec-first update [--dry-run] [--skip-mcp] [--skip-hooks] [--host <target>] [--component <set>] [--from-postinstall]
 *
 * 升级后刷新 Skill/MCP/Hooks，合并原 setup --global 功能。
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ExitCode } from '../../shared/types.js';
import {
  formatBullet,
  formatKeyValue,
  formatSubBullet,
  icon,
  joinSections,
  renderBrandBanner,
  renderSection,
} from '../../shared/cli-output.js';
import { getCliVersion } from '../router.js';
import { ensureSkillCommands, type SkillHostTarget } from '../../shared/skill-commands.js';
import { ensureHostBootstrap } from '../../shared/host-bootstrap.js';
import { detectHostPaths, formatHostPathSummary } from '../../shared/host-paths.js';
import { REQUIRED_MCP_SERVERS, REQUIRED_SKILLS } from '../../config/bootstrap-manifest.js';
import { installHooks } from '../../core/tool-integration/hook-installer.js';
import { registerAIHooks } from '../../core/tool-integration/ai-runtime-hook.js';
import { registerSessionHooks } from '../../core/tool-integration/session-hook.js';
import {
  buildInstallPlan,
  type InstallComponent as UpdateComponent,
} from '../../core/tool-integration/install-plan.js';
import { renderDefaultConfigYaml } from '../../shared/config-schema.js';
import {
  formatHostUpdateRemediation,
  formatHostUpdateSummary,
} from '../../core/host-adapters/format.js';
import { resolveHostAdapterStatuses } from '../../core/host-adapters/registry.js';
import type { HostId } from '../../core/tool-integration/tool-types.js';
import {
  computeTemplateHashes,
  loadHashRegistry,
  saveHashRegistry,
  compareHashes,
} from '../../core/template/hash-registry.js';
import { decideBatchUpdate, formatDecisionSummary } from '../../core/template/update-decision.js';
import {
  findManifestForVersion,
  executeManifest,
  ConflictStrategy,
} from '../../core/migrations/index.js';

export async function handleUpdate(args: string[]): Promise<number> {
  const dryRun = args.includes('--dry-run');
  const skipMcp = args.includes('--skip-mcp');
  const skipHooks = args.includes('--skip-hooks');
  const fromPostinstall = args.includes('--from-postinstall');
  const quiet = fromPostinstall;
  const components = parseComponents(args);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(
      '用法: spec-first update [--dry-run] [--skip-mcp] [--skip-hooks] [--host <target>] [--component <set>]\n'
    );
    console.log('升级后刷新 Skill/MCP/Hooks。\n');
    console.log('选项:');
    console.log('  --dry-run         仅输出将发生的变更，不写文件');
    console.log('  --skip-mcp        跳过 MCP 配置补齐');
    console.log('  --skip-hooks      跳过 Git hooks 刷新');
    console.log(
      '  --host <target>   仅刷新指定宿主（claude|codex|gemini|cursor|generic|all，可多次/逗号分隔）'
    );
    console.log('  --component <set> 组件安装计划（skills|mcp|hooks|viewer，可多次/逗号分隔）');
    console.log('  --from-postinstall  静默模式（postinstall 调用）');
    return ExitCode.SUCCESS;
  }

  const hosts = parseHostTargets(args);

  try {
    return await runUpdate({ dryRun, skipMcp, skipHooks, quiet, hosts, components });
  } catch (err) {
    if (fromPostinstall) return ExitCode.SUCCESS;
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`update 失败：${msg}`);
    return ExitCode.UNKNOWN_ERROR;
  }
}

interface UpdateOptions {
  dryRun: boolean;
  skipMcp: boolean;
  skipHooks: boolean;
  quiet: boolean;
  hosts?: SkillHostTarget[];
  components?: UpdateComponent[];
}

async function runUpdate({
  dryRun,
  skipMcp,
  skipHooks,
  quiet,
  hosts,
  components,
}: UpdateOptions): Promise<number> {
  const cwd = process.cwd();
  const log = quiet ? () => {} : console.log.bind(console);

  // 1. 版本升级检查（fire-and-forget，notify 读缓存文件，实际检查在 detached 子进程）
  void checkForUpdates();

  // 2. 输出品牌头与当前版本
  log(renderBrandBanner('更新'));

  // 3. 安装场景补齐项目基础配置（仅缺失时创建）
  ensureProjectInstallScaffold({ cwd, dryRun, log, prefix: dryRun ? '[DRY-RUN] ' : '' });

  // 3.5. 模板哈希比对与变更检测（T1 集成）
  await checkTemplateChanges({ cwd, dryRun, log, prefix: dryRun ? '[DRY-RUN] ' : '' });

  // 3.6. Manifest 迁移执行（T2 集成）
  checkAndExecuteManifests({ cwd, dryRun, log, prefix: dryRun ? '[DRY-RUN] ' : '' });

  // 4-8. 宿主集成刷新（Skills/MCP/Hooks）
  refreshHostIntegrations({ cwd, dryRun, skipMcp, skipHooks, hosts, components, log });

  // 9. 摘要
  if (dryRun) {
    console.log(renderSection(`${icon('dry')} Dry run preview`, [formatBullet('No files were written.')]));
  }

  // 10. 打印完整安装路径清单
  if (!quiet) {
    const hostPaths = detectHostPaths();
    console.log(
      joinSections(
        renderSection(`${icon('info')} 安装路径:`, formatHostPathSummary(hostPaths).map(formatBullet)),
      )
    );
  }

  return ExitCode.SUCCESS;
}

/** 刷新宿主集成：Skills 同步、MCP 配置、Git/AI/Session Hooks */
function refreshHostIntegrations({
  cwd,
  dryRun,
  skipMcp,
  skipHooks,
  hosts,
  components,
  log,
}: {
  cwd: string;
  dryRun: boolean;
  skipMcp: boolean;
  skipHooks: boolean;
  hosts?: SkillHostTarget[];
  components?: UpdateComponent[];
  log: (...args: unknown[]) => void;
}): void {
  // Skills 同步
  const hostPaths = detectHostPaths();
  const installPlan = buildInstallPlan(components);
  const skills = ensureSkillCommands(cwd, { global: true, dryRun, hosts });
  const selectedHostIds = normalizeHostIds(hosts);
  const shouldApplyClaudeHome = shouldApplyClaudeHomeAction(selectedHostIds);
  const genericCount = skills.generic?.length ?? 0;
  const geminiCount = skills.gemini?.length ?? 0;
  const cursorCount = skills.cursor?.length ?? 0;
  const sections: string[] = [];
  sections.push(
    renderSection(`${icon('info')} 更新概览:`, [
      formatKeyValue('version', `v${getCliVersion()}`),
      formatKeyValue('sync root', hostPaths.specFirstSkillsDir),
    ])
  );
  sections.push(
    renderSection(`${icon('info')} 组件计划:`, [
      formatKeyValue('baseline', installPlan.baseline.join(', ')),
      formatKeyValue('optional', installPlan.optional.length > 0 ? installPlan.optional.join(', ') : '(none)'),
    ])
  );
  sections.push(
    renderSection(`${icon('ok')} 能力同步:`, [
      formatKeyValue('external-required', `${REQUIRED_SKILLS.length} baseline`),
      formatKeyValue(
        'spec-first-builtins',
        `claude=${skills.claude.length}, codex=${skills.codex.length}, gemini=${geminiCount}, cursor=${cursorCount}, generic=${genericCount}`
      ),
    ])
  );

  if (!skipMcp) {
    // update 仅做“存在性检查 + 缺失补齐”，不做二进制探测（避免 npx/uvx 网络阻塞）
    const mcp = ensureHostBootstrap({ dryRun, hosts: selectedHostIds, checkBinaries: false });
    const requiredMcpNames = new Set(REQUIRED_MCP_SERVERS.map((entry) => entry.name));
    const mcpEntries = mcp.results.filter(
      (r) => r.category === 'MCP' && r.host !== 'Common' && requiredMcpNames.has(r.name)
    );
    const skillEntries = mcp.results.filter((r) => r.category === 'Skill');
    const fixed = mcpEntries.filter((r) => r.level === 'FIXED').length;
    const warnings = mcpEntries.filter((r) => r.level === 'WARNING').length;
    const errors = mcpEntries.filter((r) => r.level === 'ERROR').length;
    const skillFixed = skillEntries.filter((r) => r.level === 'FIXED').length;
    const skillWarnings = skillEntries.filter((r) => r.level === 'WARNING').length;
    const skillErrors = skillEntries.filter((r) => r.level === 'ERROR').length;
    const mcpHostCount = new Set(
      mcpEntries.map((entry) => entry.host).filter((host) => host !== 'Common')
    ).size;
    sections.push(
      renderSection(`${icon('ok')} 基线补齐:`, [
        formatKeyValue(
          'skills',
          `${skillEntries.length} checked, ${skillFixed} fixed, ${skillWarnings} warnings, ${skillErrors} errors`
        ),
        formatKeyValue(
          'mcp',
          `${mcpEntries.length}/${REQUIRED_MCP_SERVERS.length * mcpHostCount} host entries checked, ${fixed} fixed, ${warnings} warnings, ${errors} errors`
        ),
      ])
    );
  } else {
    sections.push(renderSection(`${icon('skip')} 基线补齐:`, [formatBullet('MCP: skipped')]));
  }

  const hostLines: string[] = [];
  for (const status of resolveHostAdapterStatuses(selectedHostIds)) {
    hostLines.push(formatBullet(formatHostUpdateSummary(status)));
    const remediation = formatHostUpdateRemediation(status);
    if (remediation) hostLines.push(formatSubBullet(remediation));
  }
  if (hostLines.length > 0) {
    sections.push(renderSection(`${icon('info')} 宿主状态:`, hostLines));
  }

  const shouldRunHooks = !skipHooks && installPlan.optional.includes('hooks');
  const shouldRunViewer = installPlan.optional.includes('viewer');
  const integrationLines: string[] = [];

  // Git hooks
  if (shouldRunHooks && existsSync(join(cwd, '.git'))) {
    const hooks = installHooks(cwd, { dryRun });
    integrationLines.push(formatKeyValue('Git hooks', `${hooks.length} installed`));
  } else {
    integrationLines.push(
      formatKeyValue('Git hooks', `skipped${shouldRunHooks ? ' (not a git repo)' : ' (component disabled)'}`)
    );
  }

  // AI Runtime Hooks
  if (shouldRunHooks) {
    const ai = registerAIHooks(cwd, { dryRun });
    integrationLines.push(formatKeyValue('AI hooks', `${ai.registered.length} registered`));
    for (const w of ai.warnings) integrationLines.push(formatSubBullet(`WARN: ${w}`));
  } else {
    integrationLines.push(formatKeyValue('AI hooks', 'skipped (component disabled)'));
  }

  // SessionStart Hook
  if (shouldRunViewer && shouldApplyClaudeHome) {
    const session = registerSessionHooks({ dryRun });
    integrationLines.push(formatKeyValue('Session hook', `${session.registered.length} registered`));
    for (const w of session.warnings) integrationLines.push(formatSubBullet(`WARN: ${w}`));
  } else if (shouldRunViewer) {
    integrationLines.push(formatKeyValue('Session hook', 'skipped (claude is not selected)'));
  } else {
    integrationLines.push(formatKeyValue('Session hook', 'skipped (component disabled)'));
  }

  if (shouldRunViewer && shouldApplyClaudeHome) {
    integrationLines.push(formatKeyValue('Viewer', 'managed by viewer command, no extra install step'));
  } else if (shouldRunViewer) {
    integrationLines.push(formatKeyValue('Viewer', 'skipped (claude is not selected)'));
  }

  sections.push(renderSection(`${icon('info')} Hooks 与 Viewer:`, integrationLines));

  if (skills.codexWarnings.length > 0) {
    sections.push(
      renderSection(`${icon('warn')} Codex Skill 校验:`, [
        formatKeyValue('warnings', `${skills.codexWarnings.length}`),
        ...skills.codexWarnings.map((w) => formatBullet(w)),
      ])
    );
  }

  log(joinSections(...sections));
}

// ─── 模板变更检测（T1 集成）────────────────────────────────

interface TemplateCheckOptions {
  cwd: string;
  dryRun: boolean;
  log: (...args: string[]) => void;
  prefix: string;
}

/**
 * 检查模板变更并输出决策摘要
 * 1. 计算当前包模板哈希
 * 2. 加载旧注册表
 * 3. 比对差异
 * 4. 输出决策摘要
 * 5. 保存新注册表（非 dry-run 时）
 */
async function checkTemplateChanges(options: TemplateCheckOptions): Promise<void> {
  const { cwd, dryRun, log, prefix } = options;

  // 包内模板目录
  const packageTemplatesDir = join(cwd, 'node_modules', 'spec-first', 'templates');

  // 检查包内模板是否存在
  if (!existsSync(packageTemplatesDir)) {
    // 可能是开发模式或本地链接，跳过
    return;
  }

  // 1. 加载旧注册表
  const oldRegistry = await loadHashRegistry(cwd);

  // 2. 计算当前包模板哈希
  const newHashes = await computeTemplateHashes(packageTemplatesDir, packageTemplatesDir);
  const newRegistry = {
    ...oldRegistry,
    templates: newHashes,
  };

  // 3. 比对差异
  const diff = compareHashes(oldRegistry, newRegistry);

  // 4. 如果没有变更，跳过
  const hasChanges = diff.added.length > 0 || diff.modified.length > 0 || diff.deleted.length > 0;
  if (!hasChanges) {
    log(`${prefix}Templates: no changes detected`);
    return;
  }

  // 5. 批量决策
  const batchDecision = decideBatchUpdate(diff, cwd);

  // 6. 输出摘要
  log(
    `${prefix}Templates: ${batchDecision.summary.autoUpdate} auto, ${batchDecision.summary.prompt} prompt, ${batchDecision.summary.block} block`
  );

  if (batchDecision.requiresUserInput && !dryRun) {
    console.log('\n' + formatDecisionSummary(batchDecision));
    console.log('\n提示：使用 spec-first update --dry-run 查看详细信息');
  } else if (dryRun) {
    console.log('\n' + formatDecisionSummary(batchDecision));
  }

  // 7. 保存新注册表（记录当前状态，下次更新时比对）
  if (!dryRun) {
    await saveHashRegistry(newRegistry, cwd);
  }
}

// ─── Manifest 迁移执行（T2 集成）────────────────────────────────

interface ManifestCheckOptions {
  cwd: string;
  dryRun: boolean;
  log: (...args: string[]) => void;
  prefix: string;
}

/**
 * 检查并执行适用于当前版本的迁移清单
 */
function checkAndExecuteManifests(options: ManifestCheckOptions): void {
  const { cwd, dryRun, log, prefix } = options;

  // 获取当前版本
  const currentVersion = getCliVersion();

  // 查找适用的迁移清单
  const manifestResult = findManifestForVersion(currentVersion, cwd);

  if (!manifestResult) {
    log(`${prefix}Migrations: no manifests to apply for version ${currentVersion}`);
    return;
  }

  const { manifest } = manifestResult;

  log(
    `${prefix}Migrations: found ${manifest.description} (${manifest.versionRange.from} -> ${manifest.versionRange.to})`
  );

  // 执行迁移
  const conflictStrategy = dryRun ? ConflictStrategy.Skip : ConflictStrategy.Skip;
  const result = executeManifest(manifest, cwd, conflictStrategy);

  // 输出结果
  log(
    `${prefix}Migrations: ${result.executedSteps} executed, ${result.skippedSteps} skipped, ${result.failedSteps} failed`
  );

  if (!result.success) {
    log(`${prefix}⚠ Migration completed with errors`);
    if (result.error) {
      log(`  Error: ${result.error.message}`);
    }
    for (const r of result.results) {
      if (!r.success) {
        log(`  - ${r.message}`);
      }
    }
  } else if (result.executedSteps > 0) {
    log(`${prefix}Migrations: applied successfully`);
  }
}

function ensureProjectInstallScaffold(options: {
  cwd: string;
  dryRun: boolean;
  log: (...args: string[]) => void;
  prefix: string;
}): void {
  const { cwd, dryRun, log, prefix } = options;
  const hasProjectSignals = existsSync(join(cwd, '.spec-first')) || existsSync(join(cwd, 'specs'));
  if (!hasProjectSignals) return;

  const specFirstDir = join(cwd, '.spec-first');
  const metaDir = join(specFirstDir, 'meta');
  const metaConfigPath = join(metaDir, 'config.yaml');

  // 确保 meta 目录存在并创建默认配置
  // 只在 meta/config.yaml 不存在时创建，避免覆盖用户可能放在那里的配置
  if (!existsSync(metaConfigPath)) {
    if (!dryRun) {
      mkdirSync(metaDir, { recursive: true });
      writeFileSync(metaConfigPath, renderDefaultConfigYaml(), 'utf-8');
    }
    log(`${prefix}Project Scaffold: created .spec-first/meta/config.yaml`);
  } else {
    log(`${prefix}Project Scaffold: .spec-first/meta/config.yaml already exists, skipping`);
  }

  // .claude/settings.json 保持原逻辑（不属于 spec-first 管理范围）
  const claudeDir = join(cwd, '.claude');
  const settingsPath = join(claudeDir, 'settings.json');
  if (!existsSync(settingsPath)) {
    if (!dryRun) {
      mkdirSync(claudeDir, { recursive: true });
      writeFileSync(settingsPath, `${JSON.stringify({ hooks: {} }, null, 2)}\n`, 'utf-8');
    }
    log(`${prefix}Project Scaffold: created .claude/settings.json`);
  }
}

async function checkForUpdates(): Promise<void> {
  try {
    // update-notifier 为可选依赖，动态 import 避免 ESM/CJS 混用
    const mod = (await import('update-notifier' as string)) as {
      default: (options: unknown) => { notify: () => void };
    };
    const pkg = { name: 'spec-first', version: getCliVersion() };
    mod.default({ pkg, updateCheckInterval: 1000 * 60 * 60 * 24 }).notify();
  } catch {
    // update-notifier 不可用，静默跳过
  }
}

const HOST_TARGETS = new Set<SkillHostTarget>([
  'claude',
  'codex',
  'gemini',
  'cursor',
  'generic',
  'all',
]);
const COMPONENT_TARGETS = new Set<UpdateComponent>(['skills', 'mcp', 'hooks', 'viewer']);

function normalizeHostIds(hosts?: SkillHostTarget[]): HostId[] | undefined {
  if (!hosts || hosts.length === 0) return undefined;
  const resolved = new Set<HostId>();
  for (const host of hosts) {
    if (host === 'all') {
      resolved.add('claude');
      resolved.add('codex');
      resolved.add('gemini');
      resolved.add('cursor');
      resolved.add('generic');
      continue;
    }
    resolved.add(host);
  }
  return [...resolved];
}

function shouldApplyClaudeHomeAction(hosts?: HostId[]): boolean {
  if (!hosts || hosts.length === 0) return true;
  return hosts.includes('claude');
}

function parseHostTargets(args: string[]): SkillHostTarget[] | undefined {
  const values: SkillHostTarget[] = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] !== '--host') continue;
    const raw = args[i + 1];
    if (!raw || raw.startsWith('--')) {
      throw new Error('参数错误：--host 需要一个目标值（claude|codex|gemini|cursor|generic|all）');
    }
    i += 1;
    const targets = raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    for (const target of targets) {
      if (!HOST_TARGETS.has(target as SkillHostTarget)) {
        throw new Error(
          `参数错误：未知 host "${target}"，可选值: claude|codex|gemini|cursor|generic|all`
        );
      }
      values.push(target as SkillHostTarget);
    }
  }
  return values.length > 0 ? values : undefined;
}

function parseComponents(args: string[]): UpdateComponent[] | undefined {
  const values: UpdateComponent[] = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] !== '--component') continue;
    const raw = args[i + 1];
    if (!raw || raw.startsWith('--')) {
      throw new Error('参数错误：--component 需要一个目标值（skills|mcp|hooks|viewer）');
    }
    i += 1;
    const targets = raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    for (const target of targets) {
      if (!COMPONENT_TARGETS.has(target as UpdateComponent)) {
        throw new Error(`参数错误：未知 component "${target}"，可选值: skills|mcp|hooks|viewer`);
      }
      values.push(target as UpdateComponent);
    }
  }
  return values.length > 0 ? values : undefined;
}
