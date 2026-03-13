/**
 * 健康分数计算 — server.js 与 task-parser.ts 共享
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const WEIGHTS = {
  C3: 0.25, C4: 0.20, C6: 0.25, C8: 0.15, C9: 0.15,
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
  const metrics = { C3: 0, C4: 0, C6: 0, C8: 1, C9: 1 };

  if (existsSync(matrixPath)) {
    const content = readFileSync(matrixPath, 'utf-8');
    const frCount = (content.match(/\| FR-/g) || []).length;
    const taskCount = (content.match(/\| TASK-/g) || []).length;
    const tcCount = (content.match(/\| TC-/g) || []).length;

    if (frCount > 0) {
      metrics.C3 = Math.min(taskCount / frCount, 1);
      metrics.C4 = Math.min(tcCount / frCount, 1);
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
