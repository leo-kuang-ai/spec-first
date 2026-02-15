/**
 * Reverse Sync Backfill
 * RFC 批准后自动回填追踪矩阵
 */
import { join } from 'node:path';
import { appendFileSync } from 'node:fs';
import type { MatrixRow, MatrixStatus } from '../../shared/types.js';
import { parseMatrix, updateMatrixRow } from '../trace-engine/matrix.js';
import { exists } from '../../shared/fs-utils.js';

export interface BackfillResult {
  updatedIds: string[];
  skippedIds: string[];
  auditLog: string[];
}

/**
 * 检测变更文件 → 反向查找关联 ID → 自动更新矩阵行状态
 * RFC 批准后触发
 */
export function syncBackfill(
  featureId: string,
  changedIds: string[],
  newStatus: MatrixStatus,
  projectRoot: string,
): BackfillResult {
  const rows = parseMatrix(featureId, projectRoot);
  const rowMap = new Map(rows.map(r => [r.id, r]));

  const updatedIds: string[] = [];
  const skippedIds: string[] = [];
  const auditLog: string[] = [];
  const now = new Date().toISOString();

  for (const id of changedIds) {
    const row = rowMap.get(id);
    if (!row) {
      skippedIds.push(id);
      auditLog.push(`[${now}] SKIP ${id}: not found in matrix`);
      continue;
    }

    if (row.status === newStatus) {
      skippedIds.push(id);
      auditLog.push(`[${now}] SKIP ${id}: already ${newStatus}`);
      continue;
    }

    const oldStatus = row.status;
    updateMatrixRow(featureId, projectRoot, id, { status: newStatus });
    updatedIds.push(id);
    auditLog.push(`[${now}] UPDATE ${id}: ${oldStatus} → ${newStatus}`);
  }

  // 写审计日志到 findings.md
  writeAuditLog(featureId, projectRoot, auditLog);

  return { updatedIds, skippedIds, auditLog };
}

/** 追加审计记录到 findings.md */
function writeAuditLog(
  featureId: string,
  projectRoot: string,
  entries: string[],
): void {
  if (entries.length === 0) return;

  const findingsPath = join(projectRoot, 'specs', featureId, 'findings.md');
  const header = exists(findingsPath) ? '' : '# Findings & Audit Log\n\n';
  const section = `\n## Backfill Sync\n\n${entries.map(e => `- ${e}`).join('\n')}\n`;

  appendFileSync(findingsPath, header + section);
}
