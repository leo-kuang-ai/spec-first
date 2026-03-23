/**
 * Reverse Sync Backfill
 * 改为记录文档级回填审计，不再修改矩阵状态。
 */
import { join } from 'node:path';
import { appendFileSync } from 'node:fs';
import type { MatrixStatus } from '../../shared/types.js';
import { exists } from '../../shared/fs-utils.js';
import { loadDocumentLinks } from '../document-links.js';

export interface BackfillResult {
  updatedIds: string[];
  skippedIds: string[];
  auditLog: string[];
}

export function syncBackfill(
  featureId: string,
  changedIds: string[],
  newStatus: MatrixStatus,
  projectRoot: string
): BackfillResult {
  const links = loadDocumentLinks(featureId, projectRoot);
  const knownDocuments = new Set(links.documents.map((document) => document.path));

  const updatedIds: string[] = [];
  const skippedIds: string[] = [];
  const auditLog: string[] = [];
  const now = new Date().toISOString();

  for (const id of changedIds) {
    if (!knownDocuments.has(id)) {
      skippedIds.push(id);
      auditLog.push(`[${now}] SKIP ${id}: not found in document-links`);
      continue;
    }

    updatedIds.push(id);
    auditLog.push(`[${now}] RECORD ${id}: status=${newStatus}`);
  }

  writeAuditLog(featureId, projectRoot, auditLog);
  return { updatedIds, skippedIds, auditLog };
}

function writeAuditLog(featureId: string, projectRoot: string, entries: string[]): void {
  if (entries.length === 0) return;

  const findingsPath = join(projectRoot, 'specs', featureId, 'findings.md');
  const header = exists(findingsPath) ? '' : '# Findings & Audit Log\n\n';
  const section = `\n## Backfill Sync\n\n${entries.map((entry) => `- ${entry}`).join('\n')}\n`;
  appendFileSync(findingsPath, header + section);
}
