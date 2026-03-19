/**
 * uninstall CLI 命令
 * spec-first uninstall [--dry-run] [--keep-mcp] [--host <target>]
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
import type { HostId } from '../../core/tool-integration/tool-types.js';

export function handleUninstall(args: string[]): number {
  if (args.includes('--help') || args.includes('-h')) {
    console.log('用法: spec-first uninstall [--dry-run] [--keep-mcp] [--host <target>]\n');
    console.log('清理 spec-first 注册的全部宿主配置。\n');
    console.log('选项:');
    console.log('  --dry-run     仅输出将清理的内容，不执行删除');
    console.log('  --keep-mcp    保留 MCP 配置（sequential-thinking 等为通用服务）');
    console.log(
      '  --host <target> 仅清理指定宿主（claude|codex|gemini|cursor|all，可多次/逗号分隔）'
    );
    return ExitCode.SUCCESS;
  }

  const dryRun = args.includes('--dry-run');
  const keepMcp = args.includes('--keep-mcp');

  try {
    const { hosts, fullUninstall } = parseHostTargets(args);
    return runUninstall({ dryRun, keepMcp, hosts, fullUninstall });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`uninstall 失败：${msg}`);
    if (msg.startsWith('参数错误：')) {
      return ExitCode.CONFIG_ERROR;
    }
    return ExitCode.UNKNOWN_ERROR;
  }
}

interface UninstallOptions {
  dryRun: boolean;
  keepMcp: boolean;
  hosts?: HostId[];
  fullUninstall: boolean;
}

interface HookCommand {
  command?: unknown;
}

interface HookEntry {
  hooks?: HookCommand[];
}

function runUninstall({ dryRun, keepMcp, hosts, fullUninstall }: UninstallOptions): number {
  const cwd = process.cwd();
  const prefix = dryRun ? '[dry-run] ' : '';
  const paths = detectHostPaths();
  const scopedHosts = fullUninstall ? undefined : hosts;

  console.log('spec-first uninstall — 清理宿主配置\n');

  removeHostUserArtifacts(paths, dryRun, prefix, scopedHosts);
  removeClaudeHomeArtifacts(paths.claudeHomeDir, dryRun, prefix, scopedHosts);
  if (scopedHosts && scopedHosts.length > 0) {
    console.log(`${prefix}Project-local Hooks: 检测到 --host 定向卸载，已跳过`);
  } else {
    removeProjectLocalArtifacts(cwd, dryRun, prefix);
  }

  // 9. MCP 配置提示
  if (keepMcp) {
    console.log(`${prefix}MCP 配置: 已保留（--keep-mcp）`);
  } else {
    console.log(
      `${prefix}MCP 配置: sequential-thinking/context7/serena/fetch/playwright-mcp 为通用服务，已保留`
    );
    console.log('  如需清理，请手动编辑:');
    for (const f of paths.claudeConfigFiles) {
      console.log(`    ${f}`);
    }
    console.log(`    ${paths.codexConfigPath}`);
    console.log(`    ${paths.geminiSettingsPath}`);
    console.log(`    ${paths.cursorMcpConfigPath}`);
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

function removeHostUserArtifacts(
  paths: ReturnType<typeof detectHostPaths>,
  dryRun: boolean,
  prefix: string,
  hosts?: HostId[]
): void {
  if (!hosts || hosts.length === 0) {
    removeDir(`${prefix}Skills 缓存`, join(paths.specFirstSkillsDir, 'spec-first'), dryRun);
  } else {
    console.log(`${prefix}Skills 缓存: 检测到 --host 定向卸载，已跳过`);
  }
  if (shouldIncludeHost(hosts, 'claude')) {
    removeDir(`${prefix}Claude 命令`, join(paths.claudeCommandsDir, 'spec-first'), dryRun);
  } else {
    console.log(`${prefix}Claude 命令: 当前宿主集合不包含 claude，跳过`);
  }
  if (shouldIncludeHost(hosts, 'codex')) {
    removeDir(`${prefix}Codex skills`, join(paths.codexSkillsDir, 'spec-first'), dryRun);
  } else {
    console.log(`${prefix}Codex skills: 当前宿主集合不包含 codex，跳过`);
  }
  if (shouldIncludeHost(hosts, 'gemini')) {
    removeDir(`${prefix}Gemini skills`, join(paths.geminiHomeDir, 'skills', 'spec-first'), dryRun);
  } else {
    console.log(`${prefix}Gemini skills: 当前宿主集合不包含 gemini，跳过`);
  }
  if (shouldIncludeHost(hosts, 'cursor')) {
    removeDir(`${prefix}Cursor skills`, join(paths.cursorHomeDir, 'skills', 'spec-first'), dryRun);
  } else {
    console.log(`${prefix}Cursor skills: 当前宿主集合不包含 cursor，跳过`);
  }

  if (paths.ccSwitchInstalled && (!hosts || hosts.length === 0)) {
    removeDir(`${prefix}CC Switch skills`, join(paths.ccSwitchSkillsDir, 'spec-first'), dryRun);
  } else if (paths.ccSwitchInstalled) {
    console.log(`${prefix}CC Switch skills: 检测到 --host 定向卸载，已跳过`);
  }
}

function removeClaudeHomeArtifacts(
  claudeHomeDir: string,
  dryRun: boolean,
  prefix: string,
  hosts?: HostId[]
): void {
  if (!shouldIncludeHost(hosts, 'claude')) {
    console.log(`${prefix}SessionStart Hook: 当前宿主集合不包含 claude，跳过`);
    return;
  }
  removeSessionHook(claudeHomeDir, dryRun, prefix);
}

function removeProjectLocalArtifacts(projectRoot: string, dryRun: boolean, prefix: string): void {
  removeAIHooks(projectRoot, dryRun, prefix);
  removeGitHooks(projectRoot, dryRun, prefix);
}

/** 删除目录（如存在） */
function removeDir(label: string, dirPath: string, dryRun: boolean): void {
  if (!existsSync(dirPath)) {
    console.log(`${label}: 不存在，跳过`);
    return;
  }
  if (!dryRun) {
    rmSync(dirPath, { recursive: true, force: true });
    console.log(`${label}: ${dirPath} — 已清理`);
    return;
  }
  console.log(`${label}: ${dirPath} — 将清理`);
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
    hooks.SessionStart = hooks.SessionStart.filter(
      (item: unknown) => !isManagedSessionStartEntry(item)
    );
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
      hooks[hookType] = currentEntries.filter(
        (item: HookEntry) =>
          !item?.hooks?.some(
            (h: HookCommand) =>
              typeof h.command === 'string' &&
              (h.command.includes('npx spec-first') || h.command.includes('sh .spec-first/hooks/'))
          )
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
        return !(item as HookEntry | undefined)?.hooks?.some(
          (hook) => typeof hook?.command === 'string' && hook.command.includes('session-end')
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

function parseHostTargets(args: string[]): { hosts?: HostId[]; fullUninstall: boolean } {
  const values: HostId[] = [];
  let hostFlagSeen = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] !== '--host') continue;
    hostFlagSeen = true;
    const raw = args[i + 1];
    if (!raw || raw.startsWith('--')) {
      throw new Error('参数错误：--host 需要一个目标值（claude|codex|gemini|cursor|all）');
    }
    i += 1;
    for (const part of raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)) {
      if (part === 'all') {
        return { fullUninstall: true };
      }
      if (part !== 'claude' && part !== 'codex' && part !== 'gemini' && part !== 'cursor') {
        throw new Error(`参数错误：未知 host "${part}"，可选值: claude|codex|gemini|cursor|all`);
      }
      values.push(part);
    }
  }

  if (!hostFlagSeen) return { fullUninstall: true };
  if (values.length === 0) {
    throw new Error('参数错误：--host 需要一个目标值（claude|codex|gemini|cursor|all）');
  }
  return { hosts: [...new Set(values)], fullUninstall: false };
}

function shouldIncludeHost(hosts: readonly HostId[] | undefined, host: HostId): boolean {
  return !hosts || hosts.length === 0 || hosts.includes(host);
}
