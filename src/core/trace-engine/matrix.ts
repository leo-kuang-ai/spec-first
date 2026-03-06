/**
 * 追踪矩阵管理
 * 矩阵的读取、解析、完整性校验、导出
 */
import { join } from 'node:path';
import type { MatrixRow, MatrixStatus, IdType } from '../../shared/types.js';
import { readMarkdown, writeMarkdown, exists, parseMarkdownTable } from '../../shared/fs-utils.js';
import { validateId } from './id-validator.js';
import { buildRowIndex, hasAnyUpstreamAncestor } from './upstream-lineage.js';

/** 矩阵校验结果 */
export interface MatrixCheckResult {
  total: number;
  orphans: MatrixRow[];
  brokenChains: Array<{ frId: string; missing: string[] }>;
  vModelPairs: Array<{ id: string; direction: 'forward' | 'backward'; expected: string; detail: string }>;
  warnings: string[];
}

const V_MODEL_FORWARD: Readonly<Record<'REQ' | 'SYS' | 'ARCH' | 'MOD', 'ATP' | 'STP' | 'ITP' | 'UTP'>> = {
  REQ: 'ATP',
  SYS: 'STP',
  ARCH: 'ITP',
  MOD: 'UTP',
};

const V_MODEL_BACKWARD: Readonly<Record<'ATP' | 'STP' | 'ITP' | 'UTP', 'REQ' | 'SYS' | 'ARCH' | 'MOD'>> = {
  ATP: 'REQ',
  STP: 'SYS',
  ITP: 'ARCH',
  UTP: 'MOD',
};

/** 解析矩阵 Markdown 表格为结构化数据 */
export function parseMatrix(featureId: string, projectRoot: string): MatrixRow[] {
  const matrixPath = getMatrixPath(projectRoot, featureId);
  if (!exists(matrixPath)) return [];

  const content = readMarkdown(matrixPath);
  return parseMatrixContent(content);
}

/** 校验矩阵完整性：孤儿项 + 断链 */
export function checkMatrix(featureId: string, projectRoot: string): MatrixCheckResult {
  const rows = parseMatrix(featureId, projectRoot);
  const warnings: string[] = [];
  const rowIndex = buildRowIndex(rows);

  // 孤儿项：非 FR/Feature/REQ 类型且无 upstream
  const orphans = rows.filter(r =>
    r.type !== 'Feature' && r.type !== 'FR' && r.type !== 'REQ' && (!r.upstream || r.upstream.length === 0),
  );
  for (const o of orphans) {
    warnings.push(`Orphan: ${o.id} has no upstream reference`);
  }

  // 断链：FR 无 DS/TASK/TC downstream 或无 PRD upstream
  const frRows = rows.filter(r => r.type === 'FR');
  const brokenChains: MatrixCheckResult['brokenChains'] = [];
  for (const fr of frRows) {
    const missing: string[] = [];
    const hasPrd = (fr.upstream ?? []).some(u => u.startsWith('REQ-PRD-'));
    const hasDs = rows.some(r => r.type === 'DS' && r.upstream?.includes(fr.id));
    const hasTask = rows.some((r) => {
      if (r.type !== 'TASK') return false;
      return hasAnyUpstreamAncestor(r.id, new Set([fr.id]), rowIndex);
    });
    const hasTc = rows.some(r => r.type === 'TC' && r.upstream?.includes(fr.id));
    if (!hasPrd) missing.push('REQ-PRD-*');
    if (!hasDs) missing.push('DS');
    if (!hasTask) missing.push('TASK');
    if (!hasTc) missing.push('TC');
    if (missing.length > 0) {
      brokenChains.push({ frId: fr.id, missing });
      warnings.push(`Broken chain: ${fr.id} missing ${missing.join(', ')} mapping`);
    }
  }

  const vModelPairs = checkVModelPairs(rows);
  for (const issue of vModelPairs) {
    warnings.push(`V-Model ${issue.direction}: ${issue.id} missing ${issue.expected} (${issue.detail})`);
  }

  return { total: rows.length, orphans, brokenChains, vModelPairs, warnings };
}

/** 导出矩阵为 Markdown 或 YAML */
export function exportMatrix(
  featureId: string,
  projectRoot: string,
  format: 'markdown' | 'yaml' = 'markdown',
): string {
  const rows = parseMatrix(featureId, projectRoot);

  if (format === 'yaml') {
    return exportAsYaml(rows);
  }
  return exportAsMarkdown(rows);
}

/** 更新矩阵中某行的状态 */
export function updateMatrixRow(
  featureId: string,
  projectRoot: string,
  id: string,
  updates: Partial<Pick<MatrixRow, 'status' | 'title' | 'upstream' | 'downstream'>>,
): void {
  const matrixPath = getMatrixPath(projectRoot, featureId);
  const rows = parseMatrix(featureId, projectRoot);
  const idx = rows.findIndex(r => r.id === id);
  if (idx === -1) throw new Error(`ID not found in matrix: ${id}`);

  // 使用 !== undefined 而非 truthiness，允许设置空字符串或空数组
  if (updates.status !== undefined) rows[idx].status = updates.status;
  if (updates.title !== undefined) rows[idx].title = updates.title;
  if (updates.upstream !== undefined) rows[idx].upstream = updates.upstream;
  if (updates.downstream !== undefined) rows[idx].downstream = updates.downstream;

  writeMarkdown(matrixPath, rowsToMarkdown(rows));
}

// ─── 私有辅助函数 ─────────────────────────────────────────

function getMatrixPath(projectRoot: string, featureId: string): string {
  return join(projectRoot, 'specs', featureId, 'traceability-matrix.md');
}

/**
 * 从矩阵 Markdown 表格中解析所有 ID
 * 提取为共享函数，避免在 id-generator.ts 和 id-search.ts 中重复实现
 */
export function parseMatrixIds(matrixPath: string): string[] {
  if (!exists(matrixPath)) return [];

  const content = readMarkdown(matrixPath);
  const ids: string[] = [];
  for (const cells of parseMarkdownTable(content)) {
    if (cells.length > 0 && cells[0]) ids.push(cells[0]);
  }
  return ids;
}

/** 解析 Markdown 表格内容为 MatrixRow[] */
function parseMatrixContent(content: string): MatrixRow[] {
  const rows: MatrixRow[] = [];
  for (const cells of parseMarkdownTable(content)) {
    if (cells.length < 4) continue;
    const id = cells[0];
    const validation = validateId(id);
    const type: IdType = validation.type ?? 'Feature';
    const title = cells[2] ?? '';
    const status = (cells[3] ?? 'Planned') as MatrixStatus;
    const upstream = parseRefList(cells[4]);
    const downstream = parseRefList(cells[5]);

    let nfrTag: string | undefined;
    const nfrMatch = title.match(/\[NFR:(\w+)\]/);
    if (nfrMatch) nfrTag = nfrMatch[1];

    rows.push({ id, type, title, status, upstream, downstream, nfrTag });
  }
  return rows;
}

/** 解析引用列表（逗号分隔） */
function parseRefList(cell: string | undefined): string[] | undefined {
  if (!cell || !cell.trim()) return undefined;
  return cell.split(',').map(s => s.trim()).filter(Boolean);
}

/** MatrixRow[] → Markdown 表格 */
function rowsToMarkdown(rows: MatrixRow[]): string {
  const header = '| ID | Type | Title | Status | Upstream | Downstream |\n'
    + '|----|------|-------|--------|----------|------------|\n';

  const body = rows.map(r => {
    const up = r.upstream?.join(', ') ?? '';
    const down = r.downstream?.join(', ') ?? '';
    return `| ${r.id} | ${r.type} | ${r.title} | ${r.status} | ${up} | ${down} |`;
  }).join('\n');

  return header + body + '\n';
}

/** MatrixRow[] → YAML 格式 */
function exportAsYaml(rows: MatrixRow[]): string {
  const lines: string[] = ['matrix:'];
  for (const r of rows) {
    lines.push(`  - id: "${r.id}"`);
    lines.push(`    type: "${r.type}"`);
    lines.push(`    title: "${r.title}"`);
    lines.push(`    status: "${r.status}"`);
    if (r.upstream?.length) lines.push(`    upstream: [${r.upstream.map(u => `"${u}"`).join(', ')}]`);
    if (r.downstream?.length) lines.push(`    downstream: [${r.downstream.map(d => `"${d}"`).join(', ')}]`);
    if (r.nfrTag) lines.push(`    nfrTag: "${r.nfrTag}"`);
  }
  return lines.join('\n') + '\n';
}

/** MatrixRow[] → Markdown（导出用，同 rowsToMarkdown） */
function exportAsMarkdown(rows: MatrixRow[]): string {
  return rowsToMarkdown(rows);
}

function checkVModelPairs(rows: MatrixRow[]): MatrixCheckResult['vModelPairs'] {
  const issues: MatrixCheckResult['vModelPairs'] = [];
  const byId = new Map(rows.map((row) => [row.id, row]));

  const hasTypeLink = (source: MatrixRow, expectedType: string): boolean => {
    const byDownstream = (source.downstream ?? []).some((id) => byId.get(id)?.type === expectedType);
    if (byDownstream) return true;
    return rows.some((row) => row.type === expectedType && (row.upstream ?? []).includes(source.id));
  };

  for (const row of rows) {
    if (row.type === 'REQ' || row.type === 'SYS' || row.type === 'ARCH' || row.type === 'MOD') {
      const expected = V_MODEL_FORWARD[row.type];
      if (!hasTypeLink(row, expected)) {
        issues.push({
          id: row.id,
          direction: 'forward',
          expected,
          detail: `${row.type} -> ${expected}`,
        });
      }
      continue;
    }

    if (row.type === 'ATP' || row.type === 'STP' || row.type === 'ITP' || row.type === 'UTP') {
      const expected = V_MODEL_BACKWARD[row.type];
      const linkedUpstreamTypes = new Set<string>();
      for (const upstreamId of row.upstream ?? []) {
        const upstream = byId.get(upstreamId);
        if (upstream) linkedUpstreamTypes.add(upstream.type);
      }
      for (const candidate of rows) {
        if ((candidate.downstream ?? []).includes(row.id)) {
          linkedUpstreamTypes.add(candidate.type);
        }
      }
      if (!linkedUpstreamTypes.has(expected)) {
        issues.push({
          id: row.id,
          direction: 'backward',
          expected,
          detail: `${row.type} <- ${expected}`,
        });
      }
    }
  }

  return issues;
}
