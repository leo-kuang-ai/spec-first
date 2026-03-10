/**
 * ID 生成与注册
 * 扫描矩阵已有 ID → 最大序号+1 → 组装 → 校验 → 写入矩阵
 */
import { join } from 'node:path';
import type { NextIdType, TcLevel, MatrixRow } from '../../shared/types.js';
import { readMarkdown, writeMarkdown, exists } from '../../shared/fs-utils.js';
import { withFileLock } from '../../shared/file-lock.js';
import { validateId } from './id-validator.js';
import { parseMatrixIds } from './matrix.js';

/** nextId 参数 */
export interface NextIdOptions {
  type: NextIdType;
  abbr: string;
  featureId: string;
  /** TC 专用：级别前缀 */
  tcLevel?: TcLevel;
  /** 项目根目录 */
  projectRoot: string;
}

/** nextId 返回值 */
export interface NextIdResult {
  id: string;
  seq: number;
}

/** 生成下一个 ID 并写入矩阵 */
export function nextId(opts: NextIdOptions): NextIdResult {
  return withFileLock(join(opts.projectRoot, 'specs', opts.featureId, '.matrix.lock'), () => {
    validateAbbr(opts.abbr);
    if (opts.type === 'TC' && !opts.tcLevel) {
      throw new Error('TC 类型必须提供 tcLevel（UT|IT|E2E|ST）');
    }

    const matrixPath = getMatrixPath(opts.projectRoot, opts.featureId);
    const rows = parseMatrixIds(matrixPath);

    const seq = findNextSeq(rows, opts.type, opts.abbr, opts.tcLevel);
    const id = assembleId(opts.type, opts.abbr, seq, opts.tcLevel);

    const validation = validateId(id);
    if (!validation.valid) {
      throw new Error(`生成了无效 ID：${id} — ${validation.error}`);
    }

    appendToMatrix(matrixPath, { id, type: opts.type, title: '', status: 'Planned' });

    return { id, seq };
  });
}

/** 校验缩写格式：1-16 位大写字母+数字，首字符必须是字母（连字符会被自动移除） */
function validateAbbr(abbr: string): void {
  const normalized = abbr.replace(/-/g, '');
  if (!/^[A-Z][A-Z0-9]{0,15}$/.test(normalized)) {
    throw new Error(
      `无效缩写 "${abbr}"：移除连字符后必须为 1-16 位、以 A-Z 开头、且仅包含 A-Z0-9`,
    );
  }
}

/** 组装 ID 字符串 */
function assembleId(type: NextIdType, abbr: string, seq: number, tcLevel?: TcLevel): string {
  const normalizedAbbr = abbr.replace(/-/g, '');
  const seqStr = String(seq).padStart(3, '0');
  if (type === 'TC') {
    return `TC-${tcLevel!}-${normalizedAbbr}-${seqStr}`;
  }
  if (type === 'RFC') {
    return `RFC-${seqStr}`;
  }
  return `${type}-${normalizedAbbr}-${seqStr}`;
}

/** 从矩阵中提取匹配的最大序号，返回下一个序号 */
function findNextSeq(ids: string[], type: NextIdType, abbr: string, tcLevel?: TcLevel): number {
  let maxSeq = 0;

  for (const id of ids) {
    const seq = extractSeq(id, type, abbr, tcLevel);
    if (seq !== null && seq > maxSeq) {
      maxSeq = seq;
    }
  }

  return maxSeq + 1;
}

/** 从 ID 中提取序号（匹配类型+缩写时） */
function extractSeq(id: string, type: NextIdType, abbr: string, tcLevel?: TcLevel): number | null {
  const normalizedAbbr = abbr.replace(/-/g, '');
  let prefix: string;
  if (type === 'TC') {
    prefix = `TC-${tcLevel!}-${normalizedAbbr}-`;
  } else if (type === 'RFC') {
    prefix = 'RFC-';
  } else {
    prefix = `${type}-${normalizedAbbr}-`;
  }

  if (!id.startsWith(prefix)) return null;

  const seqStr = id.slice(prefix.length);
  const seq = parseInt(seqStr, 10);
  return isNaN(seq) ? null : seq;
}

/** 获取矩阵文件路径 */
function getMatrixPath(projectRoot: string, featureId: string): string {
  return join(projectRoot, 'specs', featureId, 'traceability-matrix.md');
}

/** 追加一行到矩阵 Markdown 表格 */
function appendToMatrix(
  matrixPath: string,
  row: Pick<MatrixRow, 'id' | 'type' | 'title' | 'status'>,
): void {
  if (!exists(matrixPath)) {
    const header = '| ID | Type | Title | Status | Upstream | Downstream |\n'
      + '|----|------|-------|--------|----------|------------|\n';
    writeMarkdown(matrixPath, header);
  }

  const content = readMarkdown(matrixPath);
  const existingIds = parseMatrixIds(matrixPath);
  if (existingIds.includes(row.id)) return;
  const newRow = `| ${row.id} | ${row.type} | ${row.title} | ${row.status} |  |  |\n`;
  writeMarkdown(matrixPath, content + newRow);
}
