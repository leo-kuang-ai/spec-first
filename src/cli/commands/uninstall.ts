/**
 * uninstall CLI 命令
 * spec-first uninstall [--dry-run] [--keep-mcp]
 *
 * 清理 spec-first 注册的全部宿主配置（Skills/Hooks/命令入口）。
 * 用于卸载前或手动清理场景。
 */
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ExitCode } from '../../shared/types.js';
import { detectHostPaths } from '../../shared/host-paths.js';
import { uninstallHooks } from '../../core/tool-integration/hook-installer.js';
import { isManagedSessionStartEntry } from '../../core/tool-integration/session-hook-managed.js';

export function handleUninstall(args: string[]): number {
  if (args.includes('--help') || args.includes('-h')) {
    console.log('用法: spec-first uninstall [--dry-run] [--keep-mcp]\n');
    console.log('清理 spec-first 注册的全部宿主配置。\n');
    console.log('选项:');
    console.log('  --dry-run     仅输出将清理的内容，不执行删除');
    console.log('  --keep-mcp    保留 MCP 配置（sequential-thinking 等为通用服务）');
    return ExitCode.SUCCESS;
  }

  const dryRun = args.includes('--dry-run');
  const keepMcp = args.includes('--keep-mcp');

  try {
    return runUninstall({ dryRun, keepMcp });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`uninstall 失败：${msg}`);
    return ExitCode.UNKNOWN_ERROR;
  }
}

interface UninstallOptions {
  dryRun: boolean;
  keepMcp: boolean;
}

interface HookCommand {
  command?: unknown;
}

interface HookEntry {
  hooks?: HookCommand[];
}

function runUninstall({ dryRun, keepMcp }: UninstallOptions): number {
  const cwd = process.cwd();
  const prefix = dryRun ? '[dry-run] ' : '';
  const paths = detectHostPaths();

  console.log('spec-first uninstall — 清理宿主配置\n');

  // 1. 清理全局 Skills 缓存
  removeDir(`${prefix}Skills 缓存`, join(paths.specFirstSkillsDir, 'spec-first'), dryRun);

  // 2. 清理 Claude 命令入口
  removeDir(`${prefix}Claude 命令`, join(paths.claudeCommandsDir, 'spec-first'), dryRun);

  // 3. 清理 Codex skills
  removeDir(`${prefix}Codex skills`, join(paths.codexSkillsDir, 'spec-first'), dryRun);

  // 4. 清理 CC Switch skills
  if (paths.ccSwitchInstalled) {
    removeDir(`${prefix}CC Switch skills`, join(paths.ccSwitchSkillsDir, 'spec-first'), dryRun);
  }

  // 5. 清理全局 SessionStart Hook
  removeSessionHook(paths.claudeHomeDir, dryRun, prefix);

  // 6. 清理项目 AI Runtime Hooks
  removeAIHooks(cwd, dryRun, prefix);

  // 7. 清理 Git hooks
  removeGitHooks(cwd, dryRun, prefix);

  // 8. MCP 配置提示
  if (keepMcp) {
    console.log(`${prefix}MCP 配置: 已保留（--keep-mcp）`);
  } else {
    console.log(`${prefix}MCP 配置: sequential-thinking/context7/serena/fetch/playwright-mcp 为通用服务，已保留`);
    console.log('  如需清理，请手动编辑:');
    for (const f of paths.claudeConfigFiles) {
      console.log(`    ${f}`);
    }
    console.log(`    ${paths.codexConfigPath}`);
  }

  console.log('');
  if (dryRun) {
    console.log('（dry-run 模式，未执行任何删除）');
  } else {
    console.log('清理完成。运行以下命令完成卸载：');
    console.log('  npm uninstall -g spec-first');
    console.log('  # 或 pnpm remove --global spec-first');
  }

  return ExitCode.SUCCESS;
}

/** 删除目录（如存在） */
function removeDir(label: string, dirPath: string, dryRun: boolean): void {
  if (!existsSync(dirPath)) {
    console.log(`${label}: 不存在，跳过`);
    return;
  }
  if (!dryRun) {
    rmSync(dirPath, { recursive: true, force: true });
  }
  console.log(`${label}: ${dirPath} — 已清理`);
}

/** 从 ~/.claude/settings.json 移除 spec-first SessionStart 条目 */
function removeSessionHook(claudeHomeDir: string, dryRun: boolean, prefix: string): void {
  const settingsPath = join(claudeHomeDir, 'settings.json');
  if (!existsSync(settingsPath)) {
    console.log(`${prefix}SessionStart Hook: settings.json 不存在，跳过`);
    return;
  }

  try {
    const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
    const hooks = settings.hooks;
    if (!hooks || !Array.isArray(hooks.SessionStart)) {
      console.log(`${prefix}SessionStart Hook: 无 spec-first 条目，跳过`);
      return;
    }

    const before = hooks.SessionStart.length;
    hooks.SessionStart = hooks.SessionStart.filter((item: unknown) => !isManagedSessionStartEntry(item));
    const removed = before - hooks.SessionStart.length;

    if (removed === 0) {
      console.log(`${prefix}SessionStart Hook: 无 spec-first 条目，跳过`);
      return;
    }

    // 清理空数组
    if (hooks.SessionStart.length === 0) {
      delete hooks.SessionStart;
    }

    if (!dryRun) {
      writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf-8');
    }
    console.log(`${prefix}SessionStart Hook: 移除 ${removed} 条 — ${settingsPath}`);
  } catch {
    console.log(`${prefix}SessionStart Hook: 解析 settings.json 失败，跳过`);
  }
}

/** 从项目 .claude/settings.json 移除 spec-first AI Runtime Hooks */
function removeAIHooks(projectRoot: string, dryRun: boolean, prefix: string): void {
  const settingsPath = join(projectRoot, '.claude', 'settings.json');
  if (!existsSync(settingsPath)) {
    console.log(`${prefix}AI Hooks: .claude/settings.json 不存在，跳过`);
    return;
  }

  try {
    const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
    const hooks = settings.hooks;
    if (!hooks || typeof hooks !== 'object') {
      console.log(`${prefix}AI Hooks: 无 hooks 配置，跳过`);
      return;
    }

    const hookTypes = ['PreToolUse', 'PostToolUse', 'Stop'] as const;
    let totalRemoved = 0;

    for (const hookType of hookTypes) {
      if (!Array.isArray(hooks[hookType])) continue;
      const currentEntries = hooks[hookType] as HookEntry[];
      const before = currentEntries.length;
      hooks[hookType] = currentEntries.filter((item: HookEntry) =>
        !item?.hooks?.some((h: HookCommand) =>
          typeof h.command === 'string' && (
            h.command.includes('npx spec-first')
            || h.command.includes('sh .spec-first/hooks/')
          ),
        ),
      );
      const removed = before - (hooks[hookType] as HookEntry[]).length;
      totalRemoved += removed;

      if ((hooks[hookType] as HookEntry[]).length === 0) {
        delete hooks[hookType];
      }
    }

    // 同时清理 SessionStart/SessionEnd
    for (const hookType of ['SessionStart', 'SessionEnd'] as const) {
      if (!Array.isArray(hooks[hookType])) continue;
      const currentEntries = hooks[hookType] as HookEntry[];
      const before = currentEntries.length;
      hooks[hookType] = currentEntries.filter((item: unknown) => {
        if (hookType === 'SessionStart') return !isManagedSessionStartEntry(item);
        return !(item as HookEntry | undefined)?.hooks?.some((hook) =>
          typeof hook?.command === 'string'
          && hook.command.includes('session-end'),
        );
      });
      totalRemoved += before - (hooks[hookType] as HookEntry[]).length;
      if ((hooks[hookType] as HookEntry[]).length === 0) {
        delete hooks[hookType];
      }
    }

    if (totalRemoved === 0) {
      console.log(`${prefix}AI Hooks: 无 spec-first 条目，跳过`);
      return;
    }

    if (!dryRun) {
      writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf-8');
    }
    console.log(`${prefix}AI Hooks: 移除 ${totalRemoved} 条 — ${settingsPath}`);
  } catch {
    console.log(`${prefix}AI Hooks: 解析 settings.json 失败，跳过`);
  }
}

/** 清理 Git hooks */
function removeGitHooks(projectRoot: string, dryRun: boolean, prefix: string): void {
  if (!existsSync(join(projectRoot, '.git'))) {
    console.log(`${prefix}Git Hooks: 非 Git 仓库，跳过`);
    return;
  }

  if (dryRun) {
    console.log(`${prefix}Git Hooks: 将移除 spec-first 相关 hook 块`);
    return;
  }

  const removed = uninstallHooks(projectRoot);
  if (removed.length > 0) {
    console.log(`${prefix}Git Hooks: 移除 ${removed.length} 个 — ${removed.join(', ')}`);
  } else {
    console.log(`${prefix}Git Hooks: 无 spec-first hook，跳过`);
  }
}
