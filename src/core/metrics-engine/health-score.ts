/**
 * 文档指标健康分
 */
export interface DocumentMetrics {
  declaredDocCount: number;
  existingDocCount: number;
  linkedDocCount: number;
  brokenReferenceCount: number;
}

export interface HealthScore {
  H1: number;
  E1: number;
  Q1: number;
  breakdown: Record<string, number>;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export function calcHealthScore(
  metrics: DocumentMetrics,
  cycleTimeDays: number,
  escapeRate: number
): HealthScore {
  const existenceRatio =
    metrics.declaredDocCount === 0 ? 1 : metrics.existingDocCount / metrics.declaredDocCount;
  const linkageRatio =
    metrics.declaredDocCount === 0 ? 1 : metrics.linkedDocCount / metrics.declaredDocCount;
  const referencePenalty = metrics.brokenReferenceCount > 0 ? Math.min(0.3, metrics.brokenReferenceCount * 0.1) : 0;

  const weightedScore = Math.max(0, existenceRatio * 0.6 + linkageRatio * 0.4 - referencePenalty);
  const penalty = Math.min(escapeRate * 200, 50);
  const H1 = Math.max(0, Math.min(100, weightedScore * 100 - penalty));

  return {
    H1: Math.round(H1 * 10) / 10,
    E1: cycleTimeDays,
    Q1: escapeRate,
    breakdown: {
      existence: Math.round(existenceRatio * 60 * 10) / 10,
      linkage: Math.round(linkageRatio * 40 * 10) / 10,
      brokenReferences: Math.round(referencePenalty * 100 * 10) / 10,
    },
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
