/**
 * RFC CRUD 操作
 * 创建、提交、流转、获取、列出 RFC
 */
import { join } from 'node:path';
import { readdirSync } from 'node:fs';
import type { RfcStatus, RfcLevel, RfcRecord, RfcWaiver } from '../../shared/types.js';
import {
  readJson,
  writeJson,
  exists,
  ensureDir,
  readMarkdown,
  writeMarkdown,
} from '../../shared/fs-utils.js';
import { assertRfcTransition } from './rfc-machine.js';

// ─── 类型 ────────────────────────────────────────────────

export interface RfcCreateOptions {
  title: string;
  level?: RfcLevel;
  by: string;
  motivation?: string;
  description?: string;
  impactIds?: string[];
  waivers?: RfcWaiver[];
}

// ─── 路径工具 ────────────────────────────────────────────

function rfcDir(projectRoot: string, featureId: string): string {
  return join(projectRoot, 'specs', featureId, 'rfc');
}

function rfcPath(projectRoot: string, featureId: string, rfcId: string): string {
  return join(rfcDir(projectRoot, featureId), `${rfcId}.rfc.json`);
}

// ─── 序号管理 ────────────────────────────────────────────

/** 扫描 rfc/ 目录，返回下一个可用序号 */
function nextRfcSeq(projectRoot: string, featureId: string): number {
  const dir = rfcDir(projectRoot, featureId);
  if (!exists(dir)) return 1;

  let maxSeq = 0;
  for (const entry of readdirSync(dir)) {
    const m = entry.match(/^RFC-(\d+)\.rfc\.json$/);
    if (m) {
      const seq = parseInt(m[1], 10);
      if (seq > maxSeq) maxSeq = seq;
    }
  }
  return maxSeq + 1;
}

function formatRfcId(seq: number): string {
  return `RFC-${String(seq).padStart(3, '0')}`;
}

// ─── CRUD ────────────────────────────────────────────────

/** 创建 RFC，自动分配 RFC-NNN ID */
export function createRfc(
  featureId: string,
  opts: RfcCreateOptions,
  projectRoot: string,
): RfcRecord {
  const dir = rfcDir(projectRoot, featureId);
  ensureDir(dir);

  const seq = nextRfcSeq(projectRoot, featureId);
  const id = formatRfcId(seq);
  const now = new Date().toISOString();

  const record: RfcRecord = {
    id,
    featureId,
    title: opts.title,
    level: opts.level ?? 'Minor',
    status: 'draft',
    motivation: opts.motivation,
    description: opts.description,
    impactIds: opts.impactIds ?? [],
    waivers: opts.waivers,
    by: opts.by,
    approvals: [],
    createdAt: now,
    updatedAt: now,
  };

  writeJson(rfcPath(projectRoot, featureId, id), record);
  return record;
}

/** 获取单个 RFC */
export function getRfc(
  rfcId: string,
  featureId: string,
  projectRoot: string,
): RfcRecord {
  const p = rfcPath(projectRoot, featureId, rfcId);
  if (!exists(p)) {
    throw new Error(`未找到 RFC：${rfcId}（${featureId}）`);
  }
  return readJson<RfcRecord>(p);
}

/** RFC 状态流转 */
export function transitionRfc(
  rfcId: string,
  status: RfcStatus,
  featureId: string,
  projectRoot: string,
): RfcRecord {
  const record = getRfc(rfcId, featureId, projectRoot);
  assertRfcTransition(record.status, status);

  record.status = status;
  record.updatedAt = new Date().toISOString();

  writeJson(rfcPath(projectRoot, featureId, rfcId), record);
  return record;
}

/** 便捷入口：draft → approved */
export function submitRfc(
  rfcId: string,
  featureId: string,
  projectRoot: string,
): RfcRecord {
  const approved = transitionRfc(rfcId, 'approved', featureId, projectRoot);
  syncKnownExceptionsFromWaivers(approved, projectRoot);
  return approved;
}

/** 列出 Feature 下所有 RFC */
export function listRfc(
  featureId: string,
  projectRoot: string,
): RfcRecord[] {
  const dir = rfcDir(projectRoot, featureId);
  if (!exists(dir)) return [];

  const records: RfcRecord[] = [];
  for (const entry of readdirSync(dir)) {
    if (!entry.endsWith('.rfc.json')) continue;
    const p = join(dir, entry);
    records.push(readJson<RfcRecord>(p));
  }

  return records.sort((a, b) => a.id.localeCompare(b.id));
}

function syncKnownExceptionsFromWaivers(record: RfcRecord, projectRoot: string): void {
  const waivers = record.waivers ?? [];
  if (waivers.length === 0) return;

  const path = join(projectRoot, 'specs', record.featureId, 'known-exceptions.md');
  if (!exists(path)) {
    writeMarkdown(path, knownExceptionsHeader());
  }

  const content = readMarkdown(path);
  const rows = content.split('\n');
  const existingPairs = new Set<string>();
  let maxSeq = 0;

  for (const line of rows) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || trimmed.startsWith('|--') || trimmed.startsWith('| ID')) {
      continue;
    }
    const cells = trimmed.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.length < 3) continue;
    const id = cells[0];
    const match = id.match(/^EX-(\d{3})$/);
    if (match) {
      const seq = parseInt(match[1], 10);
      if (!Number.isNaN(seq)) maxSeq = Math.max(maxSeq, seq);
    }
    existingPairs.add(`${cells[1]}::${cells[2]}`);
  }

  const now = new Date().toISOString();
  const appendLines: string[] = [];
  for (const waiver of waivers) {
    const pair = `${record.id}::${waiver.frId}`;
    if (existingPairs.has(pair)) continue;
    maxSeq += 1;
    const exId = `EX-${String(maxSeq).padStart(3, '0')}`;
    appendLines.push(
      `| ${exId} | ${record.id} | ${waiver.frId} | ${waiver.reason} | ${waiver.expiresAt} | ${waiver.rollbackPoint} | ${waiver.approvedBy ?? record.by} | ${waiver.approvedAt ?? now} |`,
    );
  }

  if (appendLines.length === 0) return;
  writeMarkdown(path, content + appendLines.join('\n') + '\n');
}

function knownExceptionsHeader(): string {
  return [
    '| ID | RFC | FR | Reason | ExpiresAt | RollbackPoint | ApprovedBy | ApprovedAt |',
    '|----|-----|-----|--------|-----------|---------------|------------|------------|',
    '',
  ].join('\n');
}
