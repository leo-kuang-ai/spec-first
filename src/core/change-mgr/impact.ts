/**
 * Impact Analysis & Query Interface
 * 基于追踪矩阵的变更影响分析
 */
import type { MatrixRow } from '../../shared/types.js';
import { parseMatrix } from '../trace-engine/matrix.js';
import { getRfc, listRfc } from './rfc.js';
import { getDefect, getEscapeRate, listDefects } from './defect.js';

export interface ImpactResult {
  changedIds: string[];
  directImpact: MatrixRow[];
  indirectImpact: MatrixRow[];
  allAffected: string[];
  summary: string;
}

/** 分析变更影响范围：基于追踪矩阵的上下游传播 */
export function analyzeImpact(
  featureId: string,
  changedIds: string[],
  projectRoot: string
): ImpactResult {
  const rows = parseMatrix(featureId, projectRoot);
  const rowMap = new Map(rows.map((r) => [r.id, r]));

  const visited = new Set<string>(changedIds);
  const directImpact: MatrixRow[] = [];
  const indirectImpact: MatrixRow[] = [];

  // BFS: 从 changedIds 出发，沿 upstream/downstream 传播
  const queue = [...changedIds];
  const directSet = new Set<string>();

  // 第一层：直接影响（上下游邻居）
  for (const id of queue) {
    const row = rowMap.get(id);
    if (!row) continue;
    collectNeighbors(row, rowMap, visited, directImpact, directSet);
  }

  // 第二层：间接影响（邻居的邻居）
  const indirectQueue = directImpact.map((r) => r.id);
  for (const id of indirectQueue) {
    const row = rowMap.get(id);
    if (!row) continue;
    collectNeighbors(row, rowMap, visited, indirectImpact, new Set());
  }

  const allAffected = [
    ...new Set([
      ...changedIds,
      ...directImpact.map((r) => r.id),
      ...indirectImpact.map((r) => r.id),
    ]),
  ];

  return {
    changedIds,
    directImpact,
    indirectImpact,
    allAffected,
    summary: `Changed: ${changedIds.length}, Direct: ${directImpact.length}, Indirect: ${indirectImpact.length}, Total: ${allAffected.length}`,
  };
}

function collectNeighbors(
  row: MatrixRow,
  rowMap: Map<string, MatrixRow>,
  visited: Set<string>,
  result: MatrixRow[],
  resultSet: Set<string>
): void {
  const neighbors = [...(row.upstream ?? []), ...(row.downstream ?? [])];
  for (const nId of neighbors) {
    if (visited.has(nId)) continue;
    visited.add(nId);
    const neighbor = rowMap.get(nId);
    if (neighbor && !resultSet.has(nId)) {
      result.push(neighbor);
      resultSet.add(nId);
    }
  }
}

// Re-export query interfaces for convenience
export { getRfc, listRfc, getDefect, listDefects, getEscapeRate };
