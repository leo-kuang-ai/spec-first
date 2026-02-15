/**
 * AI Runtime Hook Registration & Execution
 * PreToolUse / PostToolUse / Stop 三个 Hook
 */
import { join } from 'node:path';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { exists } from '../../shared/fs-utils.js';

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

/** 生成 AI Runtime Hook 配置（用于写入 .claude/settings.json） */
export function generateAIHookConfigs(_projectRoot: string): AIHookConfig[] {
  const bin = 'npx spec-first';

  return [
    {
      type: 'PreToolUse',
      matcher: 'write|edit|create',
      command: `sh -c 'FEAT=$(head -1 .spec-first/current 2>/dev/null); [ -n "$FEAT" ] && ${bin} gate check "$FEAT" || echo "spec-first: skip gate check (no current feature)"'`,
    },
    {
      type: 'PostToolUse',
      matcher: 'write|edit|create',
      command: `sh -c 'FEAT=$(head -1 .spec-first/current 2>/dev/null); [ -n "$FEAT" ] && ${bin} matrix check "$FEAT" || echo "spec-first: skip matrix check (no current feature)"'`,
    },
    {
      type: 'Stop',
      command: `sh -c 'FEAT=$(head -1 .spec-first/current 2>/dev/null); [ -n "$FEAT" ] && ${bin} ai stats "$FEAT" >/dev/null || true'`,
    },
  ];
}

/** 注册 AI Hook 到宿主环境配置 */
export function registerAIHooks(projectRoot: string): { registered: string[]; warnings: string[] } {
  const configs = generateAIHookConfigs(projectRoot);
  const registered: string[] = [];
  const warnings: string[] = [];

  // 检查宿主环境是否支持 AI Hook
  const claudeDir = join(projectRoot, '.claude');
  if (!exists(claudeDir)) {
    warnings.push('No .claude/ directory found — AI Hooks require Claude Code environment');
    warnings.push('Graceful degradation: Gate validation falls back to Layer B CLI commands');
    return { registered, warnings };
  }

  const settingsPath = join(claudeDir, 'settings.json');
  let settings: Record<string, unknown> = {};
  if (exists(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, 'utf-8')) as Record<string, unknown>;
    } catch {
      warnings.push('Invalid .claude/settings.json detected — overwrite with spec-first hooks only');
      settings = {};
    }
  }

  const hooksValue = settings.hooks;
  const hooks: Record<string, Array<{ matcher?: string; command: string }>> =
    (hooksValue && typeof hooksValue === 'object')
      ? hooksValue as Record<string, Array<{ matcher?: string; command: string }>>
      : {};

  for (const config of configs) {
    const existing = Array.isArray(hooks[config.type]) ? hooks[config.type] : [];
    const filtered = existing.filter((item) =>
      !(item && typeof item.command === 'string' && item.command.includes('npx spec-first')),
    );
    hooks[config.type] = [...filtered, { matcher: config.matcher, command: config.command }];
    registered.push(config.type);
  }

  settings.hooks = hooks;
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf-8');

  return { registered, warnings };
}

/** 模拟 PreToolUse Hook 执行：检查 Gate 条件 */
export function executePreToolUse(
  featureId: string,
  projectRoot: string,
): AIHookResult {
  // 简化实现：检查 stage-state 是否存在
  const statePath = join(projectRoot, 'specs', featureId, 'stage-state.json');
  if (!exists(statePath)) {
    return {
      type: 'PreToolUse',
      success: false,
      message: 'No stage-state.json found — initialize Feature first',
      softBlock: true,
    };
  }

  return {
    type: 'PreToolUse',
    success: true,
    message: 'Gate pre-check passed',
  };
}

/** 模拟 Stop Hook 执行：追加 progress.md 摘要 */
export function executeStopHook(
  featureId: string,
  projectRoot: string,
  summary: string,
): AIHookResult {
  const progressPath = join(projectRoot, 'specs', featureId, 'progress.md');
  const timestamp = new Date().toISOString();
  const entry = `\n## Session ${timestamp}\n\n${summary}\n`;

  try {
    appendFileSync(progressPath, entry);
    return { type: 'Stop', success: true, message: 'Progress updated' };
  } catch {
    return { type: 'Stop', success: false, message: 'Failed to update progress.md' };
  }
}
