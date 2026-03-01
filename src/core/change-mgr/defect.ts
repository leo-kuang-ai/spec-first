/**
 * 缺陷 CRUD 操作
 * 注册、流转、获取、列出缺陷
 */
import { join } from 'node:path';
import { readdirSync } from 'node:fs';
import type { DefectStatus, SecuritySeverity, DefectRecord, Stage } from '../../shared/types.js';
import { readJson, readJsonChecked, writeJson, exists, ensureDir } from '../../shared/fs-utils.js';
import { isDefectRecord } from '../../shared/validators.js';
import { assertDefectTransition } from './defect-machine.js';

// ─── 类型 ────────────────────────────────────────────────

export interface DefectRegisterOptions {
  severity: SecuritySeverity;
  title: string;
  reporter: string;
  description?: string;
  discoveredIn?: Stage;
  linkedFr?: string;
  linkedTc?: string;
}

export interface DefectFilter {
  status?: DefectStatus;
  severity?: SecuritySeverity;
}

// ─── 路径工具 ────────────────────────────────────────────

function defectDir(projectRoot: string, featureId: string): string {
  return join(projectRoot, 'specs', featureId, 'defects');
}

function defectPath(projectRoot: string, featureId: string, seq: number): string {
  return join(defectDir(projectRoot, featureId), `defect-${String(seq).padStart(3, '0')}.json`);
}

/** 扫描 defects/ 目录，返回下一个可用序号 */
function nextDefectSeq(projectRoot: string, featureId: string): number {
  const dir = defectDir(projectRoot, featureId);
  if (!exists(dir)) return 1;

  let maxSeq = 0;
  for (const entry of readdirSync(dir)) {
    const m = entry.match(/^defect-(\d+)\.json$/);
    if (m) {
      const seq = parseInt(m[1], 10);
      if (seq > maxSeq) maxSeq = seq;
    }
  }
  return maxSeq + 1;
}

// ─── CRUD ────────────────────────────────────────────────

/** 注册缺陷，Feature 内自增序号 */
export function registerDefect(
  featureId: string,
  opts: DefectRegisterOptions,
  projectRoot: string,
): DefectRecord {
  const dir = defectDir(projectRoot, featureId);
  ensureDir(dir);

  const seq = nextDefectSeq(projectRoot, featureId);
  const now = new Date().toISOString();

  const record: DefectRecord = {
    seq,
    featureId,
    severity: opts.severity,
    title: opts.title,
    description: opts.description,
    reporter: opts.reporter,
    discoveredIn: opts.discoveredIn,
    linkedFr: opts.linkedFr,
    linkedTc: opts.linkedTc,
    status: 'open',
    createdAt: now,
    updatedAt: now,
  };

  writeJson(defectPath(projectRoot, featureId, seq), record);
  return record;
}

/** 获取单个缺陷 */
export function getDefect(
  featureId: string,
  seq: number,
  projectRoot: string,
): DefectRecord {
  const p = defectPath(projectRoot, featureId, seq);
  if (!exists(p)) {
    throw new Error(`未找到缺陷 #${seq}（${featureId}）`);
  }
  return readJsonChecked(p, isDefectRecord);
}

/** 缺陷状态流转 */
export function transitionDefect(
  featureId: string,
  seq: number,
  status: DefectStatus,
  projectRoot: string,
): DefectRecord {
  const record = getDefect(featureId, seq, projectRoot);
  assertDefectTransition(record.status, status);

  record.status = status;
  record.updatedAt = new Date().toISOString();

  writeJson(defectPath(projectRoot, featureId, seq), record);
  return record;
}

/** 列出缺陷（支持按状态/严重级别过滤） */
export function listDefects(
  featureId: string,
  projectRoot: string,
  filter?: DefectFilter,
): DefectRecord[] {
  const dir = defectDir(projectRoot, featureId);
  if (!exists(dir)) return [];

  let records: DefectRecord[] = [];
  for (const entry of readdirSync(dir)) {
    if (!entry.endsWith('.json')) continue;
    records.push(readJson<DefectRecord>(join(dir, entry)));
  }

  if (filter?.status) {
    records = records.filter((r) => r.status === filter.status);
  }
  if (filter?.severity) {
    records = records.filter((r) => r.severity === filter.severity);
  }

  return records.sort((a, b) => a.seq - b.seq);
}

/** 缺陷逃逸率：verify 之后发现的缺陷 / 总缺陷 */
export interface EscapeRateResult {
  total: number;
  escaped: number;
  rate: number;
}

const POST_VERIFY_STAGES: ReadonlySet<string> = new Set([
  '06_wrap_up', '07_release', '08_done',
]);

export function getEscapeRate(
  featureId: string,
  projectRoot: string,
): EscapeRateResult {
  const all = listDefects(featureId, projectRoot);
  const total = all.length;
  if (total === 0) return { total: 0, escaped: 0, rate: 0 };

  const escaped = all.filter(
    (d) => d.discoveredIn && POST_VERIFY_STAGES.has(d.discoveredIn),
  ).length;

  return { total, escaped, rate: escaped / total };
}
