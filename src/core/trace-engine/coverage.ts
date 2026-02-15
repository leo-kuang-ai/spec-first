/**
 * 覆盖率计算
 * 基于追踪矩阵计算 C1-C9 九项指标
 * 指标值统一为 0~1（比例）
 */
import { join } from 'node:path';
import { readdirSync } from 'node:fs';
import type { CoverageMetrics, MatrixRow, MatrixStatus } from '../../shared/types.js';
import { parseMatrix } from './matrix.js';
import { validateExceptions } from './exception-validator.js';
import { exists, readJson } from '../../shared/fs-utils.js';

/** 排除状态：不计入有效分母 */
const EXCLUDED_STATUSES: ReadonlySet<MatrixStatus> = new Set([
  'Deferred', 'Cancelled',
]);

/** 计算 C1-C9 覆盖率指标 */
export function getCoverage(featureId: string, projectRoot: string): CoverageMetrics {
  const rows = parseMatrix(featureId, projectRoot);
  const validExceptionFrIds = loadValidExceptionFrIds(featureId, projectRoot);
  const active = rows.filter((r) => {
    if (EXCLUDED_STATUSES.has(r.status)) return false;
    if (r.status !== 'Exception') return true;
    return !validExceptionFrIds.has(r.id);
  });

  const frRows = active.filter(r => r.type === 'FR');
  const dsRows = active.filter(r => r.type === 'DS');
  const taskRows = active.filter(r => r.type === 'TASK');
  const tcRows = active.filter(r => r.type === 'TC');

  return {
    C1: calcDesignCoverage(frRows, dsRows),
    C2: calcApiCoverage(frRows, dsRows),
    C3: calcTaskCoverage(frRows, taskRows),
    C4: calcTestCoverageFR(frRows, tcRows),
    C5: calcTestCoverageAC(frRows, tcRows),
    C6: calcImplCoverage(taskRows),
    C7: calcPrCompliance(taskRows),
    C8: calcTaskCompliance(taskRows, frRows),
    C9: calcTcCompliance(tcRows, frRows),
  };
}

// ─── 正向覆盖率（C1-C6）─────────────────────────────────

/** C1: Design Coverage — FR 中有 DS 映射的比例 */
function calcDesignCoverage(frRows: MatrixRow[], dsRows: MatrixRow[]): number {
  return calcUpstreamCoverage(frRows, dsRows);
}

/** C2: API Coverage — FR 中有 API 相关 DS 映射的比例（同 C1，DS 含 API 设计） */
function calcApiCoverage(frRows: MatrixRow[], dsRows: MatrixRow[]): number {
  return calcUpstreamCoverage(frRows, dsRows);
}

/** C3: Task Coverage — FR 中有 TASK 映射的比例 */
function calcTaskCoverage(frRows: MatrixRow[], taskRows: MatrixRow[]): number {
  return calcUpstreamCoverage(frRows, taskRows);
}

/** C4: Test Coverage (FR) — FR 中有 TC 映射的比例 */
function calcTestCoverageFR(frRows: MatrixRow[], tcRows: MatrixRow[]): number {
  return calcUpstreamCoverage(frRows, tcRows);
}

/** C5: Test Coverage (AC) — 同 C4（AC 级别细化留给 Phase B） */
function calcTestCoverageAC(frRows: MatrixRow[], tcRows: MatrixRow[]): number {
  return calcUpstreamCoverage(frRows, tcRows);
}

/** C6: Impl Coverage — TASK 中状态为 Implemented/Verified/Accepted 的比例 */
function calcImplCoverage(taskRows: MatrixRow[]): number {
  if (taskRows.length === 0) return 1;
  const implemented = taskRows.filter(r =>
    r.status === 'Implemented' || r.status === 'Verified' || r.status === 'Accepted',
  );
  return pct(implemented.length, taskRows.length);
}

// ─── 反向合规率（C7-C9）─────────────────────────────────

/** C7: PR Compliance — TASK 中有上游 FR 关联的比例 */
function calcPrCompliance(taskRows: MatrixRow[]): number {
  if (taskRows.length === 0) return 1;
  const linked = taskRows.filter(r => r.upstream && r.upstream.length > 0);
  return pct(linked.length, taskRows.length);
}

/** C8: Task Compliance — TASK 有上游 FR 的比例（反向：无孤儿 TASK） */
function calcTaskCompliance(taskRows: MatrixRow[], frRows: MatrixRow[]): number {
  if (taskRows.length === 0) return 1;
  const frIds = new Set(frRows.map(r => r.id));
  const compliant = taskRows.filter(r =>
    r.upstream?.some(u => frIds.has(u)),
  );
  return pct(compliant.length, taskRows.length);
}

/** C9: TC Compliance — TC 有上游 FR 的比例（反向：无孤儿 TC） */
function calcTcCompliance(tcRows: MatrixRow[], frRows: MatrixRow[]): number {
  if (tcRows.length === 0) return 1;
  const frIds = new Set(frRows.map(r => r.id));
  const compliant = tcRows.filter(r =>
    r.upstream?.some(u => frIds.has(u)),
  );
  return pct(compliant.length, tcRows.length);
}

// ─── 辅助函数 ────────────────────────────────────────────

/** 计算 FR 被下游类型覆盖的比例 */
function calcUpstreamCoverage(frRows: MatrixRow[], downstreamRows: MatrixRow[]): number {
  if (frRows.length === 0) return 1;
  const coveredFrIds = new Set<string>();
  for (const row of downstreamRows) {
    if (row.upstream) {
      for (const u of row.upstream) coveredFrIds.add(u);
    }
  }
  const covered = frRows.filter(r => coveredFrIds.has(r.id));
  return pct(covered.length, frRows.length);
}

/** 比例（0~1，保留 4 位小数） */
function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 1;
  return Math.round((numerator / denominator) * 10000) / 10000;
}

interface RfcStatusFile {
  id: string;
  status: string;
}

function loadValidExceptionFrIds(featureId: string, projectRoot: string): Set<string> {
  const rfcStatuses = loadRfcStatuses(featureId, projectRoot);
  const { valid } = validateExceptions(featureId, projectRoot, rfcStatuses);
  return new Set(valid.map((ex) => ex.frId));
}

function loadRfcStatuses(featureId: string, projectRoot: string): Map<string, string> {
  const rfcDir = join(projectRoot, 'specs', featureId, 'rfc');
  if (!exists(rfcDir)) return new Map();

  const statuses = new Map<string, string>();
  for (const entry of readdirSync(rfcDir)) {
    if (!entry.endsWith('.rfc.json')) continue;
    const fullPath = join(rfcDir, entry);
    const rfc = readJson<RfcStatusFile>(fullPath);
    if (!rfc.id || !rfc.status) continue;
    statuses.set(rfc.id, rfc.status);
  }
  return statuses;
}
