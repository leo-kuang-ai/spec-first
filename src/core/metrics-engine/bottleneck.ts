/**
 * 文档流瓶颈分析
 */
import type { DocumentMetrics } from './health-score.js';

export interface Bottleneck {
  rule: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  suggestion: string;
}

export function detectBottlenecks(metrics: DocumentMetrics): Bottleneck[] {
  const result: Bottleneck[] = [];

  if (metrics.declaredDocCount === 0) {
    result.push({
      rule: 'R1',
      description: 'No declared documents in document-links.yaml',
      severity: 'high',
      suggestion: '补齐 document-links.yaml 的 documents 列表',
    });
    return result;
  }

  const missingCount = metrics.declaredDocCount - metrics.existingDocCount;
  if (missingCount > 0) {
    result.push({
      rule: 'R1',
      description: 'Declared documents are missing on disk',
      severity: missingCount >= 2 ? 'high' : 'medium',
      suggestion: '补齐缺失文档，或删除无效声明',
    });
  }

  if (metrics.brokenReferenceCount > 0) {
    result.push({
      rule: 'R2',
      description: 'Broken document references exist',
      severity: metrics.brokenReferenceCount >= 2 ? 'high' : 'medium',
      suggestion: '修复 document-links.yaml 中的错误引用',
    });
  }

  if (metrics.linkedDocCount === 0 && metrics.declaredDocCount > 1) {
    result.push({
      rule: 'R3',
      description: 'Documents are isolated without references',
      severity: 'medium',
      suggestion: '补齐 design/spec/task_plan 之间的引用关系',
    });
  }

  return result;
}

export function calcReworkRate(totalTasks: number, reopenedTasks: number): number {
  if (totalTasks === 0) return 0;
  return reopenedTasks / totalTasks;
}

export function calcGateFirstPassRate(totalGates: number, firstPassGates: number): number {
  if (totalGates === 0) return 1;
  return firstPassGates / totalGates;
}
