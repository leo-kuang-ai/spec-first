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
      command: `sh -c 'FEAT=$(head -1 .spec-first/current 2>/dev/null); [ -n "$FEAT" ] && ${bin} gate check "$FEAT" || echo "spec-first: 跳过 gate 检查（无当前 feature）"'`,
    },
    {
      type: 'PostToolUse',
      matcher: 'write|edit|create',
      command: `sh -c 'FEAT=$(head -1 .spec-first/current 2>/dev/null); [ -n "$FEAT" ] && ${bin} matrix check "$FEAT" || echo "spec-first: 跳过 matrix 检查（无当前 feature）"'`,
    },
    {
      type: 'Stop',
      command: `sh -c 'FEAT=$(head -1 .spec-first/current 2>/dev/null); [ -n "$FEAT" ] && ${bin} ai stats "$FEAT" >/dev/null || true'`,
    },
  ];
}

/** 注册 AI Hook 到宿主环境配置 */
export function registerAIHooks(projectRoot: string, options?: { dryRun?: boolean }): { registered: string[]; warnings: string[] } {
  const configs = generateAIHookConfigs(projectRoot);
  const registered: string[] = [];
  const warnings: string[] = [];

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

  for (const config of configs) {
    // Migrate legacy top-level entries into hooks wrapper
    if (Array.isArray(settings[config.type])) {
      const legacy = settings[config.type] as unknown[];
      const existingInHooks = Array.isArray(hooksObj[config.type]) ? hooksObj[config.type] as unknown[] : [];
      hooksObj[config.type] = [...existingInHooks, ...legacy];
      delete settings[config.type];
    }

    const existing = Array.isArray(hooksObj[config.type]) ? hooksObj[config.type] as any[] : [];
    const filtered = existing.filter((item: any) =>
      !(item?.hooks?.some((h: any) => typeof h.command === 'string' && h.command.includes('npx spec-first'))),
    );
    hooksObj[config.type] = [...filtered, { matcher: config.matcher, hooks: [{ type: 'command' as const, command: config.command }] }];
    registered.push(config.type);
  }

  if (!options?.dryRun) {
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf-8');
  }

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
  summary: string,
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
