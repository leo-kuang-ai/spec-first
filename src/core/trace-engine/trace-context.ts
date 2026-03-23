import type { MatrixRow } from '../../shared/types.js';
import { createUpstreamLineage, type UpstreamLineage } from './upstream-lineage.js';
import { splitByRelationshipTier } from './relationship-graph.js';

export interface TraceContext {
  rows: MatrixRow[];
  featureRows: MatrixRow[];
  mainChainRows: MatrixRow[];
  supplementaryRows: MatrixRow[];
  untrackedRows: MatrixRow[];
  frRows: MatrixRow[];
  dsRows: MatrixRow[];
  taskRows: MatrixRow[];
  tcRows: MatrixRow[];
  frIds: ReadonlySet<string>;
  lineage: UpstreamLineage;
}

/** 统一构建追踪矩阵派生上下文，避免各模块重复筛选与建索引 */
export function createTraceContext(rows: MatrixRow[]): TraceContext {
  const { mainChainRows, supplementaryRows, untrackedRows } = splitByRelationshipTier(rows);
  const featureRows = rows.filter((row) => row.type === 'Feature');
  const frRows = rows.filter((row) => row.type === 'FR');
  const dsRows = rows.filter((row) => row.type === 'DS');
  const taskRows = rows.filter((row) => row.type === 'TASK');
  const tcRows = rows.filter((row) => row.type === 'TC');

  return {
    rows,
    featureRows,
    mainChainRows,
    supplementaryRows,
    untrackedRows,
    frRows,
    dsRows,
    taskRows,
    tcRows,
    frIds: new Set(frRows.map((row) => row.id)),
    lineage: createUpstreamLineage(rows),
  };
}
