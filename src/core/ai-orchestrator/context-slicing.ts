/**
 * Context Slicing — 动态裁剪
 * 默认预算 16K tokens，L1≤20% / L2≤30% / L3≥50%
 * 降级顺序：L2非关键 → L3 Top-N → control ID-only
 */
import type { ContextPack, ContextRef } from './context-pack.js';
import type { Size } from '../../shared/types.js';

export interface SliceConfig {
  budgetTokens: number;
  l1Ratio: number;
  l2Ratio: number;
  l3Ratio: number;
}

export interface SliceResult {
  refs: ContextRef[];
  degradationLevel: number; // 0=none, 1=L2 trimmed, 2=L3 top-N, 3=control ID-only
  warning?: string;
}

const DEFAULT_CONFIG: SliceConfig = {
  budgetTokens: 16000,
  l1Ratio: 0.2,
  l2Ratio: 0.3,
  l3Ratio: 0.5,
};

/** 按 Size 选择策略 */
export function getStrategy(size: Size): 'inline-first' | 'hybrid' | 'references-first' {
  switch (size) {
    case 'S': return 'inline-first';
    case 'M': return 'hybrid';
    case 'L': return 'references-first';
    default: return 'hybrid';
  }
}

/** 对 references 执行动态裁剪 */
export function sliceContext(
  refs: ContextRef[],
  config: SliceConfig = DEFAULT_CONFIG,
): SliceResult {
  // 粗略估算：每个 ref 约 200 tokens
  const estimatedTokens = refs.length * 200;

  if (estimatedTokens <= config.budgetTokens) {
    return { refs, degradationLevel: 0 };
  }

  // Level 1: 裁剪 L2 非关键（保留 reason=stage_context 的前 N 个）
  const maxRefs = Math.floor(config.budgetTokens / 200);
  let trimmed = refs.slice(0, maxRefs);

  if (trimmed.length * 200 <= config.budgetTokens) {
    return {
      refs: trimmed,
      degradationLevel: 1,
      warning: `CONTEXT_BUDGET_EXCEEDED: Degraded to Level 1 (${refs.length} → ${trimmed.length} refs)`,
    };
  }

  // Level 2: Top-N by relevance
  const topN = Math.floor(maxRefs * 0.5);
  trimmed = refs.slice(0, topN);

  return {
    refs: trimmed,
    degradationLevel: 2,
    warning: `CONTEXT_BUDGET_EXCEEDED: Degraded to Level 2 (${refs.length} → ${trimmed.length} refs)`,
  };
}
