/**
 * update CLI 命令
 * spec-first update [--dry-run] [--skip-mcp] [--skip-hooks] [--from-postinstall]
 *
 * 升级后刷新 Skill/MCP/Hooks，合并原 setup --global 功能。
 */
import { existsSync } from 'node:fs';
import { ExitCode } from '../../shared/types.js';
import { getCliVersion } from '../router.js';
import { ensureSkillCommands } from '../../shared/skill-commands.js';
import { ensureHostBootstrap } from '../../shared/host-bootstrap.js';
import { installHooks } from '../../core/tool-integration/hook-installer.js';
import { registerAIHooks } from '../../core/tool-integration/ai-runtime-hook.js';
import { registerSessionHooks } from '../../core/tool-integration/session-hook.js';

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
    console.log('  --from-postinstall  静默模式（postinstall 调用）');
    return ExitCode.SUCCESS;
  }

  try {
    return runUpdate({ dryRun, skipMcp, skipHooks, quiet });
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
}

function runUpdate({ dryRun, skipMcp, skipHooks, quiet }: UpdateOptions): number {
  const cwd = process.cwd();
  const log = quiet ? () => {} : console.log.bind(console);
  const prefix = dryRun ? '[dry-run] ' : '';

  // 1. 版本升级检查（fire-and-forget，notify 读缓存文件，实际检查在 detached 子进程）
  void checkForUpdates();

  // 2. 输出当前版本号
  log(`spec-first v${getCliVersion()}`);

  // 3. 刷新 Skill 命令
  const skills = ensureSkillCommands(cwd, { global: true, dryRun });
  log(`${prefix}Skill: ${skills.claude.length} claude, ${skills.codex.length} codex`);

  // 4. MCP 配置补齐
  if (!skipMcp) {
    const mcp = ensureHostBootstrap({ dryRun });
    const fixed = mcp.results.filter(r => r.level === 'FIXED').length;
    const errors = mcp.results.filter(r => r.level === 'ERROR').length;
    log(`${prefix}MCP: ${mcp.results.length} checked, ${fixed} fixed, ${errors} errors`);
  } else {
    log(`${prefix}MCP: skipped`);
  }

  // 5. Git hooks
  if (!skipHooks && existsSync('.git')) {
    const hooks = installHooks(cwd, { dryRun });
    log(`${prefix}Git Hooks: ${hooks.length} installed`);
  } else {
    log(`${prefix}Git Hooks: skipped${!skipHooks ? '（非 Git 仓库）' : ''}`);
  }

  // 6. AI Runtime Hooks
  const ai = registerAIHooks(cwd, { dryRun });
  log(`${prefix}AI Hooks: ${ai.registered.length} registered`);
  for (const w of ai.warnings) log(`  ⚠ ${w}`);

  // 7. SessionStart Hook
  const session = registerSessionHooks({ dryRun });
  log(`${prefix}Session Hook: ${session.registered.length} registered`);
  for (const w of session.warnings) log(`  ⚠ ${w}`);

  // 8. 摘要
  if (dryRun) {
    console.log('\n（dry-run 模式，未写入任何文件）');
  }

  return ExitCode.SUCCESS;
}

async function checkForUpdates(): Promise<void> {
  try {
    // update-notifier 为可选依赖，动态 import 避免 ESM/CJS 混用
    const mod = await (import('update-notifier' as string) as Promise<{ default: Function }>);
    const pkg = { name: 'spec-first', version: getCliVersion() };
    mod.default({ pkg, updateCheckInterval: 1000 * 60 * 60 * 24 }).notify();
  } catch {
    // update-notifier 不可用，静默跳过
  }
}
