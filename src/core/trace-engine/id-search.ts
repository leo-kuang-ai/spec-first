/**
 * ID 模糊搜索
 * 支持前缀匹配和缩写匹配的 ID 搜索
 */
import { join } from 'node:path';
import type { IdType } from '../../shared/types.js';
import { exists } from '../../shared/fs-utils.js';
import { validateId } from './id-validator.js';
import { parseMatrixIds } from './matrix.js';

export interface SearchResult {
  id: string;
  type: IdType;
}

/** 搜索矩阵中匹配的 ID */
export function searchId(
  query: string,
  featureId: string,
  projectRoot: string,
  type?: IdType
): SearchResult[] {
  if (!query) return [];

  const matrixPath = join(projectRoot, 'specs', featureId, 'traceability-matrix.md');
  if (!exists(matrixPath)) return [];

  const ids = parseMatrixIds(matrixPath);
  const upperQuery = query.toUpperCase();

  const results: SearchResult[] = [];
  for (const id of ids) {
    const validation = validateId(id);
    if (!validation.valid || !validation.type) continue;

    // 类型过滤
    if (type && validation.type !== type) continue;

    // 前缀匹配: "FR-AUTH" → 匹配 "FR-AUTH-001"
    // 缩写匹配: "AUTH" → 匹配所有含 AUTH 的 ID
    if (id.toUpperCase().startsWith(upperQuery) || id.toUpperCase().includes(upperQuery)) {
      results.push({ id, type: validation.type });
    }
  }

  return results;
}

/** 列出 Feature 下所有 ID（可按类型过滤） */
export function listIds(featureId: string, projectRoot: string, type?: IdType): SearchResult[] {
  const matrixPath = join(projectRoot, 'specs', featureId, 'traceability-matrix.md');
  if (!exists(matrixPath)) return [];

  const ids = parseMatrixIds(matrixPath);
  const results: SearchResult[] = [];

  for (const id of ids) {
    const validation = validateId(id);
    if (!validation.valid || !validation.type) continue;
    if (type && validation.type !== type) continue;
    results.push({ id, type: validation.type });
  }

  return results;
}
