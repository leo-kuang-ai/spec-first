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
export function detectBottlenecks(coverage: CoverageMetrics): Bottleneck[] {
  const bottlenecks: Bottleneck[] = [];
  const c = coverage as unknown as Record<string, number>;

  // R1: 设计瓶颈 — C1 < 0.6
  if (c.C1 < 0.6) {
    bottlenecks.push({
      rule: 'R1',
      description: 'Design bottleneck: low design coverage',
      severity: c.C1 < 0.4 ? 'high' : 'medium',
      suggestion: 'Review FR→DS mapping, ensure all FRs have design specs',
    });
  }

  // R2: 测试瓶颈 — C4 < 0.6 或 C5 < 0.5
  if (c.C4 < 0.6 || c.C5 < 0.5) {
    bottlenecks.push({
      rule: 'R2',
      description: 'Test bottleneck: insufficient test coverage',
      severity: c.C4 < 0.4 ? 'high' : 'medium',
      suggestion: 'Add test cases for uncovered FRs and ACs',
    });
  }

  // R3: 实现滞后 — C6 < 0.7
  if (c.C6 < 0.7) {
    bottlenecks.push({
      rule: 'R3',
      description: 'Implementation lag: tasks not fully implemented',
      severity: c.C6 < 0.5 ? 'high' : 'medium',
      suggestion: 'Focus on completing in-progress tasks',
    });
  }

  // R4: 合规缺口 — C7 < 0.8 或 C8 < 0.7
  if (c.C7 < 0.8 || c.C8 < 0.7) {
    bottlenecks.push({
      rule: 'R4',
      description: 'Compliance gap: PR or task compliance below threshold',
      severity: 'medium',
      suggestion: 'Ensure PRs reference TASK IDs and follow commit conventions',
    });
  }

  // R5: 缺陷逃逸 — 通过外部传入的 escapeRate 判断
  // (此规则在 report 层面处理)

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
