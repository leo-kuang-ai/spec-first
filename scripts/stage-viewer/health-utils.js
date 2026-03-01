/**
 * 健康分数计算 — server.js 与 task-parser.ts 共享
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const METRIC_DEFS = [
  { key: 'C1', name: '设计覆盖率', target: 0.8 },
  { key: 'C2', name: 'API 覆盖率', target: 0.8 },
  { key: 'C3', name: '任务覆盖率', target: 0.8 },
  { key: 'C4', name: '测试覆盖率 (FR)', target: 0.8 },
  { key: 'C5', name: '测试覆盖率 (AC)', target: 0.6 },
  { key: 'C6', name: '实现覆盖率', target: 0.8 },
  { key: 'C7', name: 'PR 合规率', target: 0.9 },
  { key: 'C8', name: '任务合规率', target: 0.8 },
  { key: 'C9', name: 'TC 合规率', target: 0.8 },
];

const WEIGHTS = {
  C1: 0.12, C2: 0.10, C3: 0.10, C4: 0.15,
  C5: 0.10, C6: 0.13, C7: 0.10, C8: 0.10, C9: 0.10,
};

function getGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export function getDefaultMetrics(featureId, projectRoot) {
  const matrixPath = join(projectRoot, 'specs', featureId, 'traceability-matrix.md');
  const metrics = { C1: 0, C2: 0, C3: 0, C4: 0, C5: 0, C6: 0, C7: 1, C8: 1, C9: 1 };

  if (existsSync(matrixPath)) {
    const content = readFileSync(matrixPath, 'utf-8');
    const frCount = (content.match(/\| FR-/g) || []).length;
    const dsCount = (content.match(/\| DS-/g) || []).length;
    const taskCount = (content.match(/\| TASK-/g) || []).length;
    const tcCount = (content.match(/\| TC-/g) || []).length;

    if (frCount > 0) {
      metrics.C1 = Math.min(dsCount / frCount, 1);
      metrics.C2 = metrics.C1;
      metrics.C3 = Math.min(taskCount / frCount, 1);
      metrics.C4 = Math.min(tcCount / frCount, 1);
      metrics.C5 = metrics.C4;
    }
    if (taskCount > 0) {
      const implemented = (content.match(/Implemented|Verified|Accepted/g) || []).length;
      metrics.C6 = Math.min(implemented / taskCount, 1);
    }
  }

  return metrics;
}

export function calcHealthScore(coverage, escapeRate = 0) {
  let weighted = 0;
  const breakdown = {};

  for (const [key, weight] of Object.entries(WEIGHTS)) {
    const val = Math.min(coverage[key] ?? 0, 1.0);
    breakdown[key] = val * weight * 100;
    weighted += val * weight;
  }

  const penalty = Math.min(escapeRate * 200, 50);
  const rawH1 = Math.max(0, Math.min(100, weighted * 100 - penalty));
  const H1 = Math.round(rawH1 * 10) / 10;

  return { H1, grade: getGrade(H1), breakdown };
}
