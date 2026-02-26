import { join } from 'node:path';
import { exists, readMarkdown } from '../../shared/fs-utils.js';
import { loadConfig } from '../../shared/config-schema.js';
import type { StageState } from '../../shared/types.js';
import { readJson } from '../../shared/fs-utils.js';

export interface PromptAssemblyContext {
  featureId: string;
  currentStage: string;
  currentTask: string;
  tokenBudget: number;
  maxIterations: number;
  maxSelfCorrection: number;
  dateIso: string;
}

const PLACEHOLDER_REPLACERS: Record<string, (ctx: PromptAssemblyContext) => string> = {
  FEATURE_ID: (ctx) => ctx.featureId,
  CURRENT_STAGE: (ctx) => ctx.currentStage,
  CURRENT_TASK: (ctx) => ctx.currentTask,
  TOKEN_BUDGET: (ctx) => String(ctx.tokenBudget),
  MAX_ITERATIONS: (ctx) => String(ctx.maxIterations),
  MAX_SELF_CORRECTION: (ctx) => String(ctx.maxSelfCorrection),
  DATE_ISO: (ctx) => ctx.dateIso,
};

/**
 * KV-Cache 模板规则（Planning-with-Files P2-2）
 *
 * KV-Cache 优化的核心原则：稳定的前缀（prompt prefix）可提高缓存命中率。
 *
 * 规则：
 * 1. 静态字段优先：FEATURE_ID, CURRENT_STAGE, CURRENT_TASK 属于"任务标识"字段，变化频率低，应放在模板前部
 * 2. 动态字段外置：DATE_ISO 等高频变化字段应放在模板尾部或作为追加参数
 * 3. 前缀稳定策略：模板前 500 字符应保持稳定，不包含时间戳等动态内容
 *
 * 示例（推荐）：
 * ```markdown
 * ## 当前上下文
 * Feature: {{FEATURE_ID}}
 * Stage: {{CURRENT_STAGE}}
 * Task: {{CURRENT_TASK}}
 *
 * [以下是动态部分]
 * 时间: {{DATE_ISO}}
 * ```
 *
 * 反例（不推荐）：
 * ```markdown
 * ## {{DATE_ISO}} 的任务报告  // ❌ 动态字段在标题中
 * Feature: {{FEATURE_ID}}
 * ```
 */
const STATIC_PREFIX_FIELDS = ['FEATURE_ID', 'CURRENT_STAGE', 'CURRENT_TASK', 'TOKEN_BUDGET', 'MAX_ITERATIONS', 'MAX_SELF_CORRECTION'] as const;
const DYNAMIC_FIELDS = ['DATE_ISO'] as const;

/** 提取模板的静态前缀部分（用于 KV-Cache 稳定性检查） */
export function extractStaticPrefix(template: string): string {
  // 找到第一个动态字段的位置
  let firstDynamicPos = template.length;
  for (const field of DYNAMIC_FIELDS) {
    const pattern = new RegExp(`\\{\\{\\s*${field}\\s*\\}\\}`);
    const match = template.match(pattern);
    if (match && match.index !== undefined && match.index < firstDynamicPos) {
      firstDynamicPos = match.index;
    }
  }
  return template.slice(0, firstDynamicPos);
}

/** 检查模板是否符合 KV-Cache 稳定性规则 */
export function validateKvCacheStability(template: string): { stable: boolean; issues: string[] } {
  const issues: string[] = [];
  const prefix = extractStaticPrefix(template);

  // 规则 1: 前 500 字符不应包含动态字段
  if (prefix.length < 500) {
    // 检查前缀是否包含动态字段
    for (const field of DYNAMIC_FIELDS) {
      const pattern = new RegExp(`\\{\\{\\s*${field}\\s*\\}\\}`);
      if (pattern.test(template.slice(0, 500))) {
        issues.push(`动态字段 {{${field}}} 出现在模板前 500 字符内，不利于 KV-Cache 稳定性`);
      }
    }
  }

  // 规则 2: 建议静态字段在动态字段之前
  const staticPositions: Record<string, number> = {};
  const dynamicPositions: Record<string, number> = {};

  for (const field of STATIC_PREFIX_FIELDS) {
    const pattern = new RegExp(`\\{\\{\\s*${field}\\s*\\}\\}`);
    const match = template.match(pattern);
    if (match && match.index !== undefined) {
      staticPositions[field] = match.index;
    }
  }

  for (const field of DYNAMIC_FIELDS) {
    const pattern = new RegExp(`\\{\\{\\s*${field}\\s*\\}\\}`);
    const match = template.match(pattern);
    if (match && match.index !== undefined) {
      dynamicPositions[field] = match.index;
    }
  }

  // 检查静态字段是否都在动态字段之前
  for (const [staticField, staticPos] of Object.entries(staticPositions)) {
    for (const [dynamicField, dynamicPos] of Object.entries(dynamicPositions)) {
      if (staticPos > dynamicPos) {
        issues.push(`静态字段 {{${staticField}}} (位置 ${staticPos}) 在动态字段 {{${dynamicField}}} (位置 ${dynamicPos}) 之后`);
      }
    }
  }

  return { stable: issues.length === 0, issues };
}

function readCurrentFeature(projectRoot: string): string {
  const currentPath = join(projectRoot, '.spec-first', 'current');
  if (!exists(currentPath)) return 'N/A';
  const value = readMarkdown(currentPath).trim();
  return value || 'N/A';
}

function readCurrentStage(projectRoot: string, featureId: string): string {
  if (!featureId || featureId === 'N/A') return 'unknown';
  const statePath = join(projectRoot, 'specs', featureId, 'stage-state.json');
  if (!exists(statePath)) return 'unknown';
  try {
    const state = readJson<StageState>(statePath);
    return state.currentStage ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

function readCurrentTask(projectRoot: string, featureId: string): string {
  if (!featureId || featureId === 'N/A') return 'N/A';
  const taskPlanPath = join(projectRoot, 'specs', featureId, 'task_plan.md');
  if (!exists(taskPlanPath)) return 'N/A';

  const lines = readMarkdown(taskPlanPath).split('\n');
  const row = lines.find((line) => {
    if (!line.trim().startsWith('|')) return false;
    const low = line.toLowerCase();
    return low.includes('in_progress') || low.includes('in progress');
  });
  if (!row) return 'N/A';

  const match = row.match(/TASK-[A-Z0-9-]+/);
  return match?.[0] ?? 'N/A';
}

export function resolvePromptAssemblyContext(projectRoot: string): PromptAssemblyContext {
  const featureId = readCurrentFeature(projectRoot);
  const cfg = loadConfig(projectRoot);

  return {
    featureId,
    currentStage: readCurrentStage(projectRoot, featureId),
    currentTask: readCurrentTask(projectRoot, featureId),
    tokenBudget: cfg.context.token_budget,
    maxIterations: cfg.runtime.max_iterations,
    maxSelfCorrection: cfg.runtime.max_self_corrections,
    dateIso: new Date().toISOString(),
  };
}

const MAX_CONTEXT_PACK_BYTES = 2048;

export function assemblePrompt(template: string, ctx: PromptAssemblyContext): string {
  const result = template.replace(/\{\{\s*([A-Z_]+)\s*\}\}/g, (full, key: string) => {
    const replacer = PLACEHOLDER_REPLACERS[key];
    if (!replacer) return full;
    return replacer(ctx);
  });
  if (result.length > MAX_CONTEXT_PACK_BYTES) {
    console.warn(`[spec-first] Context Pack 超出建议大小（${result.length} > ${MAX_CONTEXT_PACK_BYTES} bytes）`);
  }
  return result;
}
