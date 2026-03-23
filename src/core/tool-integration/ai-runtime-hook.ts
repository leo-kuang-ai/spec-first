/**
 * AI Runtime Hook Registration & Execution
 * PreToolUse / PostToolUse / Stop 三个 Hook
 */
import { join } from 'node:path';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { exists } from '../../shared/fs-utils.js';
import { loadEnabledExtensions } from '../process-engine/extensions.js';
import {
  TASK_CONTEXT_SCRIPT,
  STOP_GUARD_SCRIPT,
  PROGRESS_SYNC_SCRIPT,
  EXTENSION_HOOK_SCRIPT,
  MANAGED_HOOK_COMMAND_MARKERS,
  ensureManagedHookScripts,
} from './ai-runtime-hook-scripts.js';

export type AIHookType = 'PreToolUse' | 'PostToolUse' | 'Stop';

export interface AIHookConfig {
  type: AIHookType;
  matcher?: string;
  command: string;
}

export interface AIHookResult {
  type: AIHookType;
  success: boolean;
  message: string;
  softBlock?: boolean;
}

const WRITE_INTENT_MATCHER =
  'write|edit|create|update|delete|move|rename|multiedit|multi_edit|notebook_edit|str_replace|insert|append';

function wrapSoftHook(command: string, hookName: string): string {
  return `sh -c '${command} || echo "spec-first: ${hookName} hook 执行失败（已降级）" >&2'`;
}

function shellQuote(value: string): string {
  if (value.length === 0) return "''";
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

function encodeHookArg(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

/** 生成 AI Runtime Hook 配置（用于写入 .claude/settings.json） */
export function generateAIHookConfigs(projectRoot: string): AIHookConfig[] {
  const bin = 'npx spec-first';
  const builtins: AIHookConfig[] = [
    {
      type: 'PreToolUse',
      matcher: WRITE_INTENT_MATCHER,
      command: wrapSoftHook(`sh ${TASK_CONTEXT_SCRIPT}`, 'task-context'),
    },
    {
      type: 'PreToolUse',
      matcher: WRITE_INTENT_MATCHER,
      command: `sh -c 'FEAT=$(head -1 .spec-first/current 2>/dev/null); [ -n "$FEAT" ] && ${bin} gate check "$FEAT" || echo "spec-first: 跳过 gate 检查（无当前 feature）"'`,
    },
    {
      type: 'PostToolUse',
      matcher: WRITE_INTENT_MATCHER,
      command: `sh -c 'FEAT=$(head -1 .spec-first/current 2>/dev/null); if [ -n "$FEAT" ]; then ${bin} docs validate "$FEAT" || echo "spec-first: docs validate 执行失败（已降级）" >&2; else echo "spec-first: 跳过 docs 校验（无当前 feature）"; fi'`,
    },
    {
      type: 'PostToolUse',
      matcher: WRITE_INTENT_MATCHER,
      command: wrapSoftHook(`sh ${PROGRESS_SYNC_SCRIPT}`, 'progress-sync'),
    },
    {
      type: 'Stop',
      command: `sh -c 'FEAT=$(head -1 .spec-first/current 2>/dev/null); [ -n "$FEAT" ] && ${bin} ai stats "$FEAT" >/dev/null || true'`,
    },
    {
      type: 'Stop',
      command: wrapSoftHook(`sh ${STOP_GUARD_SCRIPT}`, 'stop-guard'),
    },
  ];

  const extHooks: AIHookConfig[] = loadEnabledExtensions(projectRoot).flatMap((ext) =>
    ext.hooks.map((hook) => ({
      type: hook.type,
      matcher: hook.matcher,
      // 通过托管脚本执行扩展 hook，避免把 namespace/command 直接插值进 shell 字符串。
      command: `${shellQuote(process.execPath)} ${shellQuote(EXTENSION_HOOK_SCRIPT)} ${shellQuote(
        encodeHookArg(ext.namespace)
      )} ${shellQuote(encodeHookArg(hook.command))}`,
    }))
  );

  return [...builtins, ...extHooks];
}

function groupHookConfigs(configs: AIHookConfig[]): Map<AIHookType, AIHookConfig[]> {
  const grouped = new Map<AIHookType, AIHookConfig[]>();
  for (const config of configs) {
    const list = grouped.get(config.type) ?? [];
    list.push(config);
    grouped.set(config.type, list);
  }
  return grouped;
}

function buildHookEntry(config: AIHookConfig): Record<string, unknown> {
  const entry: Record<string, unknown> = {
    specFirstManaged: true,
    hooks: [{ type: 'command', command: config.command }],
  };
  if (config.matcher) entry.matcher = config.matcher;
  return entry;
}

function isManagedHookEntry(item: unknown): boolean {
  const entry = item as Record<string, unknown> | undefined;
  if (entry?.specFirstManaged === true) return true;
  const hooks = entry?.hooks;
  if (!Array.isArray(hooks)) return false;
  return hooks.some(
    (hook: Record<string, unknown>) =>
      typeof hook.command === 'string' &&
      MANAGED_HOOK_COMMAND_MARKERS.some((marker) => (hook.command as string).includes(marker))
  );
}

/** 注册 AI Hook 到宿主环境配置 */
export function registerAIHooks(
  projectRoot: string,
  options?: { dryRun?: boolean }
): { registered: string[]; warnings: string[] } {
  const configs = generateAIHookConfigs(projectRoot);
  const groupedConfigs = groupHookConfigs(configs);
  const registered: string[] = [];
  const warnings: string[] = [];

  try {
    ensureManagedHookScripts(projectRoot, Boolean(options?.dryRun));
  } catch (error) {
    warnings.push(`写入托管 Hook 脚本失败：${(error as Error).message}`);
  }

  // 检查宿主环境是否支持 AI Hook
  const claudeDir = join(projectRoot, '.claude');
  if (!exists(claudeDir)) {
    warnings.push('未找到 .claude/ 目录 —— AI Hooks 需要 Claude Code 环境');
    warnings.push('已降级：Gate 校验回退为 Layer B CLI 命令');
    return { registered, warnings };
  }

  const settingsPath = join(claudeDir, 'settings.json');
  let settings: Record<string, unknown> = {};
  if (exists(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, 'utf-8')) as Record<string, unknown>;
    } catch {
      warnings.push('检测到无效 .claude/settings.json —— 将仅覆盖 spec-first hooks');
      settings = {};
    }
  }

  // Claude Code requires hooks nested under "hooks" key: {"hooks":{"PreToolUse":[...]}}
  if (!settings.hooks || typeof settings.hooks !== 'object') {
    settings.hooks = {} as Record<string, unknown>;
  }
  const hooksObj = settings.hooks as Record<string, unknown>;

  for (const [hookType, hookConfigs] of groupedConfigs) {
    // Migrate legacy top-level entries into hooks wrapper
    if (Array.isArray(settings[hookType])) {
      const legacy = settings[hookType] as unknown[];
      const existingInHooks = Array.isArray(hooksObj[hookType])
        ? (hooksObj[hookType] as unknown[])
        : [];
      hooksObj[hookType] = [...existingInHooks, ...legacy];
      delete settings[hookType];
    }

    const existing = Array.isArray(hooksObj[hookType]) ? (hooksObj[hookType] as unknown[]) : [];
    const filtered = existing.filter((item: unknown) => !isManagedHookEntry(item));
    hooksObj[hookType] = [...filtered, ...hookConfigs.map((config) => buildHookEntry(config))];
    registered.push(hookType);
  }

  if (!options?.dryRun) {
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf-8');
  }

  return { registered, warnings };
}

/** 模拟 PreToolUse Hook 执行：检查 Gate 条件 */
export function executePreToolUse(featureId: string, projectRoot: string): AIHookResult {
  // 简化实现：检查 stage-state 是否存在
  const statePath = join(projectRoot, 'specs', featureId, 'stage-state.json');
  if (!exists(statePath)) {
    return {
      type: 'PreToolUse',
      success: false,
      message: '未找到 stage-state.json —— 请先初始化 Feature',
      softBlock: true,
    };
  }

  return {
    type: 'PreToolUse',
    success: true,
    message: 'Gate 预检查通过',
  };
}

/** 模拟 Stop Hook 执行：追加 findings.md 会话摘要 */
export function executeStopHook(
  featureId: string,
  projectRoot: string,
  summary: string
): AIHookResult {
  const findingsPath = join(projectRoot, 'specs', featureId, 'findings.md');
  const timestamp = new Date().toISOString();
  const entry = `\n- [${timestamp}] Session summary: ${summary}\n`;

  try {
    appendFileSync(findingsPath, entry);
    return { type: 'Stop', success: true, message: 'findings.md 已更新' };
  } catch {
    return { type: 'Stop', success: false, message: '更新 findings.md 失败' };
  }
}
