/**
 * update CLI 命令
 * spec-first update [--dry-run] [--skip-mcp] [--skip-hooks] [--from-postinstall]
 *
 * 升级后刷新 Skill/MCP/Hooks，合并原 setup --global 功能。
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ExitCode } from '../../shared/types.js';
import { getCliVersion } from '../router.js';
import { ensureSkillCommands, type SkillHostTarget } from '../../shared/skill-commands.js';
import { ensureHostBootstrap } from '../../shared/host-bootstrap.js';
import { detectHostPaths } from '../../shared/host-paths.js';
import { installHooks } from '../../core/tool-integration/hook-installer.js';
import { registerAIHooks } from '../../core/tool-integration/ai-runtime-hook.js';
import { registerSessionHooks } from '../../core/tool-integration/session-hook.js';
import { renderDefaultConfigYaml } from '../../shared/config-schema.js';
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

  if (args.includes('--help') || args.includes('-h')) {
    console.log('用法: spec-first update [--dry-run] [--skip-mcp] [--skip-hooks]\n');
    console.log('升级后刷新 Skill/MCP/Hooks。\n');
    console.log('选项:');
    console.log('  --dry-run         仅输出将发生的变更，不写文件');
    console.log('  --skip-mcp        跳过 MCP 配置补齐');
    console.log('  --skip-hooks      跳过 Git hooks 刷新');
    console.log('  --host <target>   仅刷新指定宿主（claude|codex|generic|all，可多次/逗号分隔）');
    console.log('  --from-postinstall  静默模式（postinstall 调用）');
    return ExitCode.SUCCESS;
  }

  const hosts = parseHostTargets(args);

  try {
    return await runUpdate({ dryRun, skipMcp, skipHooks, quiet, hosts });
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
}

async function runUpdate({ dryRun, skipMcp, skipHooks, quiet, hosts }: UpdateOptions): Promise<number> {
  const cwd = process.cwd();
  const log = quiet ? () => {} : console.log.bind(console);
  const prefix = dryRun ? '[dry-run] ' : '';

  // 1. 版本升级检查（fire-and-forget，notify 读缓存文件，实际检查在 detached 子进程）
  void checkForUpdates();

  // 2. 输出当前版本号
  log(`spec-first v${getCliVersion()}`);

  // 3. 安装场景补齐项目基础配置（仅缺失时创建）
  ensureProjectInstallScaffold({ cwd, dryRun, log, prefix });

  // 3.5. 模板哈希比对与变更检测（T1 集成）
  await checkTemplateChanges({ cwd, dryRun, log, prefix });

  // 3.6. Manifest 迁移执行（T2 集成）
  checkAndExecuteManifests({ cwd, dryRun, log, prefix });

  // 4-8. 宿主集成刷新（Skills/MCP/Hooks）
  refreshHostIntegrations({ cwd, dryRun, skipMcp, skipHooks, hosts, log, prefix });

  // 9. 摘要
  if (dryRun) {
    console.log('\n（dry-run 模式，未写入任何文件）');
  }

  return ExitCode.SUCCESS;
}

/** 刷新宿主集成：Skills 同步、MCP 配置、Git/AI/Session Hooks */
function refreshHostIntegrations({ cwd, dryRun, skipMcp, skipHooks, hosts, log, prefix }: {
  cwd: string; dryRun: boolean; skipMcp: boolean; skipHooks: boolean;
  hosts?: SkillHostTarget[]; log: (...args: unknown[]) => void; prefix: string;
}): void {
  // Skills 同步
  const hostPaths = detectHostPaths();
  const skills = ensureSkillCommands(cwd, { global: true, dryRun, hosts });
  const genericCount = skills.generic?.length ?? 0;
  log(`${prefix}Skill: ${skills.claude.length} claude, ${skills.codex.length} codex, ${genericCount} generic → ${hostPaths.specFirstSkillsDir}`);
  if (skills.codexWarnings.length > 0) {
    log(`  ⚠ Codex skill 验证失败 (${skills.codexWarnings.length}):`);
    for (const w of skills.codexWarnings) log(`    - ${w}`);
  }

  // MCP 配置补齐
  if (!skipMcp) {
    // update 仅做“存在性检查 + 缺失补齐”，不做二进制探测（避免 npx/uvx 网络阻塞）
    const mcp = ensureHostBootstrap({ dryRun, checkBinaries: false });
    const fixed = mcp.results.filter(r => r.level === 'FIXED').length;
    const errors = mcp.results.filter(r => r.level === 'ERROR').length;
    log(`${prefix}MCP: ${mcp.results.length} checked, ${fixed} fixed, ${errors} errors`);
  } else {
    log(`${prefix}MCP: skipped`);
  }

  // Git hooks
  if (!skipHooks && existsSync('.git')) {
    const hooks = installHooks(cwd, { dryRun });
    log(`${prefix}Git Hooks: ${hooks.length} installed`);
  } else {
    log(`${prefix}Git Hooks: skipped${!skipHooks ? '（非 Git 仓库）' : ''}`);
  }

  // AI Runtime Hooks
  const ai = registerAIHooks(cwd, { dryRun });
  log(`${prefix}AI Hooks: ${ai.registered.length} registered`);
  for (const w of ai.warnings) log(`  ⚠ ${w}`);

  // SessionStart Hook
  const session = registerSessionHooks({ dryRun });
  log(`${prefix}Session Hook: ${session.registered.length} registered`);
  for (const w of session.warnings) log(`  ⚠ ${w}`);
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
  log(`${prefix}Templates: ${batchDecision.summary.autoUpdate} auto, ${batchDecision.summary.prompt} prompt, ${batchDecision.summary.block} block`);

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

  log(`${prefix}Migrations: found ${manifest.description} (${manifest.versionRange.from} -> ${manifest.versionRange.to})`);

  // 执行迁移
  const conflictStrategy = dryRun ? ConflictStrategy.Skip : ConflictStrategy.Skip;
  const result = executeManifest(manifest, cwd, conflictStrategy);

  // 输出结果
  log(`${prefix}Migrations: ${result.executedSteps} executed, ${result.skippedSteps} skipped, ${result.failedSteps} failed`);

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
    const mod = await import('update-notifier' as string) as { default: (options: unknown) => { notify: () => void } };
    const pkg = { name: 'spec-first', version: getCliVersion() };
    mod.default({ pkg, updateCheckInterval: 1000 * 60 * 60 * 24 }).notify();
  } catch {
    // update-notifier 不可用，静默跳过
  }
}

const HOST_TARGETS = new Set<SkillHostTarget>(['claude', 'codex', 'generic', 'all']);

function parseHostTargets(args: string[]): SkillHostTarget[] | undefined {
  const values: SkillHostTarget[] = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] !== '--host') continue;
    const raw = args[i + 1];
    if (!raw || raw.startsWith('--')) {
      throw new Error('参数错误：--host 需要一个目标值（claude|codex|generic|all）');
    }
    i += 1;
    const targets = raw.split(',').map((item) => item.trim()).filter(Boolean);
    for (const target of targets) {
      if (!HOST_TARGETS.has(target as SkillHostTarget)) {
        throw new Error(`参数错误：未知 host "${target}"，可选值: claude|codex|generic|all`);
      }
      values.push(target as SkillHostTarget);
    }
  }
  return values.length > 0 ? values : undefined;
}
