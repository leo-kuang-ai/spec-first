/**
 * Health Score Calculation
 * H1 = (w1×C1 + ... + w9×C9) × 100 - penalty(Q1)
 * 含 E1 周期时间和 Q1 缺陷逃逸率
 */
import type { CoverageMetrics } from '../../shared/types.js';

export interface HealthScore {
  H1: number; // 综合健康分 0-100
  E1: number; // 周期时间（天）
  Q1: number; // 缺陷逃逸率
  breakdown: Record<string, number>;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

/** 默认权重 - 只包含 C3/C4/C6/C8/C9 */
const DEFAULT_WEIGHTS: Record<string, number> = {
  C3: 0.25,
  C4: 0.20,
  C6: 0.25,
  C8: 0.15,
  C9: 0.15,
};

/** 严格模式权重 - 包含全部 C1-C9 */
const STRICT_WEIGHTS: Record<string, number> = {
  C1: 0.08,
  C2: 0.08,
  C3: 0.20,
  C4: 0.15,
  C5: 0.08,
  C6: 0.20,
  C7: 0.06,
  C8: 0.10,
  C9: 0.05,
};

/** 计算综合健康分 */
export function calcHealthScore(
  coverage: CoverageMetrics,
  cycleTimeDays: number,
  escapeRate: number,
  profile: string = 'default-simplified'
): HealthScore {
  const weights = profile === 'strict' ? STRICT_WEIGHTS : DEFAULT_WEIGHTS;
  const record = coverage as unknown as Record<string, number>;
  let weighted = 0;
  const breakdown: Record<string, number> = {};

  for (const [key, weight] of Object.entries(weights)) {
    const val = Math.min(record[key] ?? 0, 1.0);
    breakdown[key] = val * weight * 100;
    weighted += val * weight;
  }

  // penalty: Q1 逃逸率惩罚（每 1% 扣 2 分）
  const penalty = Math.min(escapeRate * 200, 50);
  const H1 = Math.max(0, Math.min(100, weighted * 100 - penalty));

  return {
    H1: Math.round(H1 * 10) / 10,
    E1: cycleTimeDays,
    Q1: escapeRate,
    breakdown,
    grade: getGrade(H1),
  };
}

function getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}
