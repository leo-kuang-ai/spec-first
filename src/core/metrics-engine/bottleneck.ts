/**
 * Bottleneck Analysis & Metrics Report
 * R1-R5 瓶颈规则 + 健康报告生成
 */
import type { CoverageMetrics } from '../../shared/types.js';

export interface Bottleneck {
  rule: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  suggestion: string;
}

export interface MetricsReport {
  featureId: string;
  coverage: CoverageMetrics;
  healthScore: number;
  grade: string;
  bottlenecks: Bottleneck[];
  reworkRate: number;
  gateFirstPassRate: number;
}

/** R1-R5 瓶颈检测规则 */
export function detectBottlenecks(
  coverage: CoverageMetrics,
  profile: string = 'default-simplified'
): Bottleneck[] {
  const bottlenecks: Bottleneck[] = [];
  const c = coverage as unknown as Record<string, number>;
  const metricsToCheck =
    profile === 'strict'
      ? ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9']
      : ['C3', 'C4', 'C6', 'C8', 'C9'];

  // R1: 需求瓶颈 — C3 < 0.6
  if (metricsToCheck.includes('C3') && c.C3 < 0.6) {
    bottlenecks.push({
      rule: 'R1',
      description: 'Requirement bottleneck: low task coverage',
      severity: c.C3 < 0.4 ? 'high' : 'medium',
      suggestion: 'Review FR→TASK mapping, ensure all FRs are decomposed into executable tasks',
    });
  }

  // R2: 测试瓶颈 — C4 < 0.6
  if (metricsToCheck.includes('C4') && c.C4 < 0.6) {
    bottlenecks.push({
      rule: 'R2',
      description: 'Test bottleneck: insufficient test coverage',
      severity: c.C4 < 0.4 ? 'high' : 'medium',
      suggestion: 'Add test cases for uncovered FRs',
    });
  }

  // R3: 实现滞后 — C6 < 0.7
  if (metricsToCheck.includes('C6') && c.C6 < 0.7) {
    bottlenecks.push({
      rule: 'R3',
      description: 'Implementation lag: tasks not fully implemented',
      severity: c.C6 < 0.5 ? 'high' : 'medium',
      suggestion: 'Focus on completing in-progress tasks',
    });
  }

  // R4: 合规缺口 — C8 < 0.7
  if (metricsToCheck.includes('C8') && c.C8 < 0.7) {
    bottlenecks.push({
      rule: 'R4',
      description: 'Compliance gap: task compliance below threshold',
      severity: 'medium',
      suggestion: 'Ensure tasks follow conventions and reference requirements',
    });
  }

  // R5: 测试追溯缺口 — C9 < 0.7
  if (metricsToCheck.includes('C9') && c.C9 < 0.7) {
    bottlenecks.push({
      rule: 'R5',
      description: 'Traceability gap: low test compliance',
      severity: 'medium',
      suggestion: 'Ensure every TC links back to FRs and eliminate orphan test cases',
    });
  }

  return bottlenecks;
}

/** 计算返工率（目标 <10%） */
export function calcReworkRate(totalTasks: number, reopenedTasks: number): number {
  if (totalTasks === 0) return 0;
  return reopenedTasks / totalTasks;
}

/** 计算 Gate 一次通过率（目标 >85%） */
export function calcGateFirstPassRate(totalGates: number, firstPassGates: number): number {
  if (totalGates === 0) return 1;
  return firstPassGates / totalGates;
}
