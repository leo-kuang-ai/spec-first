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

export function handleUpdate(args: string[]): number {
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
    return runUpdate({ dryRun, skipMcp, skipHooks, quiet, hosts });
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

function runUpdate({ dryRun, skipMcp, skipHooks, quiet, hosts }: UpdateOptions): number {
  const cwd = process.cwd();
  const log = quiet ? () => {} : console.log.bind(console);
  const prefix = dryRun ? '[dry-run] ' : '';

  // 1. 版本升级检查（fire-and-forget，notify 读缓存文件，实际检查在 detached 子进程）
  void checkForUpdates();

  // 2. 输出当前版本号
  log(`spec-first v${getCliVersion()}`);

  // 3. 安装场景补齐项目基础配置（仅缺失时创建）
  ensureProjectInstallScaffold({ cwd, dryRun, log, prefix });

  // 4. 同步 Skills 到用户级目录并刷新命令入口
  const hostPaths = detectHostPaths();
  const skills = ensureSkillCommands(cwd, { global: true, dryRun, hosts });
  const genericCount = skills.generic?.length ?? 0;
  log(`${prefix}Skill: ${skills.claude.length} claude, ${skills.codex.length} codex, ${genericCount} generic → ${hostPaths.specFirstSkillsDir}`);
  if (skills.codexWarnings.length > 0) {
    log(`  ⚠ Codex skill 验证失败 (${skills.codexWarnings.length}):`);
    for (const w of skills.codexWarnings) log(`    - ${w}`);
  }

  // 5. MCP 配置补齐
  if (!skipMcp) {
    const mcp = ensureHostBootstrap({ dryRun });
    const fixed = mcp.results.filter(r => r.level === 'FIXED').length;
    const errors = mcp.results.filter(r => r.level === 'ERROR').length;
    log(`${prefix}MCP: ${mcp.results.length} checked, ${fixed} fixed, ${errors} errors`);
  } else {
    log(`${prefix}MCP: skipped`);
  }

  // 6. Git hooks
  if (!skipHooks && existsSync('.git')) {
    const hooks = installHooks(cwd, { dryRun });
    log(`${prefix}Git Hooks: ${hooks.length} installed`);
  } else {
    log(`${prefix}Git Hooks: skipped${!skipHooks ? '（非 Git 仓库）' : ''}`);
  }

  // 7. AI Runtime Hooks
  const ai = registerAIHooks(cwd, { dryRun });
  log(`${prefix}AI Hooks: ${ai.registered.length} registered`);
  for (const w of ai.warnings) log(`  ⚠ ${w}`);

  // 8. SessionStart Hook
  const session = registerSessionHooks({ dryRun });
  log(`${prefix}Session Hook: ${session.registered.length} registered`);
  for (const w of session.warnings) log(`  ⚠ ${w}`);

  // 9. 摘要
  if (dryRun) {
    console.log('\n（dry-run 模式，未写入任何文件）');
  }

  return ExitCode.SUCCESS;
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
  const configPath = join(specFirstDir, 'config.yaml');
  if (!existsSync(configPath)) {
    if (!dryRun) {
      mkdirSync(specFirstDir, { recursive: true });
      writeFileSync(configPath, renderDefaultConfigYaml(), 'utf-8');
    }
    log(`${prefix}Project Scaffold: created .spec-first/config.yaml`);
  }

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
