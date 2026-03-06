import type { MatrixRow } from '../../shared/types.js';

export interface UpstreamLineage {
  rowIndex: ReadonlyMap<string, MatrixRow>;
  getAncestors(id: string): ReadonlySet<string>;
  hasAnyAncestor(id: string, targetIds: ReadonlySet<string>): boolean;
  collectCoveredTargetIds(startIds: Iterable<string>, targetIds: ReadonlySet<string>): Set<string>;
}

/** 构建 ID → MatrixRow 索引 */
export function buildRowIndex(rows: MatrixRow[]): Map<string, MatrixRow> {
  return new Map(rows.map((row) => [row.id, row]));
}

/** 创建带缓存的上游传递链解析器 */
export function createUpstreamLineage(rows: MatrixRow[]): UpstreamLineage {
  const rowIndex = buildRowIndex(rows);
  const cache = new Map<string, ReadonlySet<string>>();

  const getAncestors = (id: string, stack = new Set<string>()): ReadonlySet<string> => {
    const cached = cache.get(id);
    if (cached) return cached;
    if (stack.has(id)) return new Set<string>();

    stack.add(id);
    const ancestors = new Set<string>();
    const row = rowIndex.get(id);

    for (const upstreamId of row?.upstream ?? []) {
      if (upstreamId === id) continue;
      ancestors.add(upstreamId);
      const upstreamAncestors = getAncestors(upstreamId, stack);
      for (const ancestorId of upstreamAncestors) {
        if (ancestorId !== id) ancestors.add(ancestorId);
      }
    }

    stack.delete(id);
    cache.set(id, ancestors);
    return ancestors;
  };

  return {
    rowIndex,
    getAncestors(id: string): ReadonlySet<string> {
      return getAncestors(id);
    },
    hasAnyAncestor(id: string, targetIds: ReadonlySet<string>): boolean {
      if (targetIds.size === 0) return false;
      const ancestors = getAncestors(id);
      for (const ancestorId of ancestors) {
        if (targetIds.has(ancestorId)) return true;
      }
      return false;
    },
    collectCoveredTargetIds(startIds: Iterable<string>, targetIds: ReadonlySet<string>): Set<string> {
      const covered = new Set<string>();
      if (targetIds.size === 0) return covered;

      for (const startId of startIds) {
        const ancestors = getAncestors(startId);
        for (const ancestorId of ancestors) {
          if (targetIds.has(ancestorId)) covered.add(ancestorId);
        }
      }

      return covered;
    },
  };
}
