/**
 * Context Slicing — 动态裁剪
 * 默认预算 16K tokens，L1≤20% / L2≤30% / L3≥50%
 * 降级顺序：L2非关键 → L3 Top-N → control ID-only
 */
import type { ContextRef } from './context-pack.js';
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
  tokensBefore: number;
  tokensAfter: number;
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
  const estimate = (ref: ContextRef): number => (
    typeof ref.estimatedTokens === 'number' && ref.estimatedTokens > 0
      ? ref.estimatedTokens
      : 200
  );
  const estimatedTokens = refs.reduce((sum, ref) => sum + estimate(ref), 0);
  const order = new Map(refs.map((ref, idx) => [`${ref.path}::${ref.selector ?? ''}::${ref.checksum}`, idx]));
  const sortBySourceOrder = (items: ContextRef[]): ContextRef[] => (
    [...items].sort((a, b) => (
      (order.get(`${a.path}::${a.selector ?? ''}::${a.checksum}`) ?? 0)
      - (order.get(`${b.path}::${b.selector ?? ''}::${b.checksum}`) ?? 0)
    ))
  );

  if (estimatedTokens <= config.budgetTokens) {
    return {
      refs,
      degradationLevel: 0,
      tokensBefore: estimatedTokens,
      tokensAfter: estimatedTokens,
    };
  }

  const summaryRefs = refs.filter((ref) => ref.granularity === 'summary');
  const detailRefs = refs.filter((ref) => ref.granularity !== 'summary');
  const summaryTokens = summaryRefs.reduce((sum, ref) => sum + estimate(ref), 0);

  if (summaryTokens > config.budgetTokens) {
    const keptSummary: ContextRef[] = [];
    let used = 0;
    for (const ref of summaryRefs) {
      const next = estimate(ref);
      if (keptSummary.length > 0 && used + next > config.budgetTokens) break;
      keptSummary.push(ref);
      used += next;
    }
    const refsAfter = sortBySourceOrder(keptSummary);
    return {
      refs: refsAfter,
      degradationLevel: 3,
      tokensBefore: estimatedTokens,
      tokensAfter: used,
      warning: `CONTEXT_BUDGET_EXCEEDED: Degraded to Level 3 (summary truncated, ${refs.length} → ${refsAfter.length} refs)`,
    };
  }

  const keptDetails: ContextRef[] = [];
  let usedTokens = summaryTokens;
  for (const ref of detailRefs) {
    const next = estimate(ref);
    if (usedTokens + next > config.budgetTokens) break;
    keptDetails.push(ref);
    usedTokens += next;
  }

  const refsAfter = sortBySourceOrder([...summaryRefs, ...keptDetails]);
  const level = keptDetails.length === 0 ? 2 : 1;
  return {
    refs: refsAfter,
    degradationLevel: level,
    tokensBefore: estimatedTokens,
    tokensAfter: usedTokens,
    warning: `CONTEXT_BUDGET_EXCEEDED: Degraded to Level ${level} (${refs.length} → ${refsAfter.length} refs)`,
  };
}
