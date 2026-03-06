import type { MatrixRow } from '../../shared/types.js';

/** 构建 ID → MatrixRow 索引 */
export function buildRowIndex(rows: MatrixRow[]): Map<string, MatrixRow> {
  return new Map(rows.map((row) => [row.id, row]));
}

/** 收集某个条目的全部上游祖先 ID（传递闭包） */
export function collectUpstreamAncestors(
  startId: string,
  rowIndex: ReadonlyMap<string, MatrixRow>,
): Set<string> {
  const ancestors = new Set<string>();
  const queue: string[] = [startId];
  const visited = new Set<string>([startId]);

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId) break;
    const row = rowIndex.get(currentId);
    if (!row?.upstream?.length) continue;

    for (const upstreamId of row.upstream) {
      ancestors.add(upstreamId);
      if (!visited.has(upstreamId)) {
        visited.add(upstreamId);
        queue.push(upstreamId);
      }
    }
  }

  return ancestors;
}

/** 判断某条目是否可追溯到目标 ID 集合（支持传递上游） */
export function hasAnyUpstreamAncestor(
  startId: string,
  targetIds: ReadonlySet<string>,
  rowIndex: ReadonlyMap<string, MatrixRow>,
): boolean {
  if (targetIds.size === 0) return false;
  const queue: string[] = [startId];
  const visited = new Set<string>([startId]);

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId) break;
    const row = rowIndex.get(currentId);
    if (!row?.upstream?.length) continue;

    for (const upstreamId of row.upstream) {
      if (targetIds.has(upstreamId)) return true;
      if (!visited.has(upstreamId)) {
        visited.add(upstreamId);
        queue.push(upstreamId);
      }
    }
  }

  return false;
}
