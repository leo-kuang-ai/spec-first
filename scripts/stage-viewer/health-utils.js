/**
 * 健康分数计算 — server.js 与 task-parser.ts 共享
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';

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
  const linksPath = join(projectRoot, 'specs', featureId, 'document-links.yaml');
  const metrics = { C3: 0, C4: 0, C6: 0, C8: 1, C9: 1 };

  if (!existsSync(linksPath)) {
    return metrics;
  }

  try {
    const parsed = yaml.load(readFileSync(linksPath, 'utf-8')) || {};
    const documents = Array.isArray(parsed.documents) ? parsed.documents : [];
    const declaredDocCount = documents.length;
    if (declaredDocCount === 0) return metrics;

    const declaredPaths = new Set(
      documents
        .map((doc) => (typeof doc?.path === 'string' ? doc.path.trim() : ''))
        .filter(Boolean)
    );
    const existingDocCount = documents.filter((doc) => typeof doc?.path === 'string' && doc.path.trim()).length;
    const linkedDocCount = documents.filter((doc) => Array.isArray(doc?.references) && doc.references.length > 0).length;
    const brokenReferenceCount = documents.reduce((count, doc) => {
      if (!Array.isArray(doc?.references)) return count;
      return (
        count +
        doc.references.filter((ref) => typeof ref === 'string' && !declaredPaths.has(ref.trim())).length
      );
    }, 0);

    metrics.C3 = Math.min(existingDocCount / declaredDocCount, 1);
    metrics.C4 = Math.min(linkedDocCount / declaredDocCount, 1);
    metrics.C6 = declaredDocCount === 0 ? 1 : Math.min(existingDocCount / declaredDocCount, 1);
    metrics.C8 = Math.max(0, 1 - brokenReferenceCount / declaredDocCount);
    metrics.C9 = Math.max(0, 1 - Math.max(declaredDocCount - linkedDocCount, 0) / declaredDocCount);
  } catch {
    // 回退到保守默认值
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
