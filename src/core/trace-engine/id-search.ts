/**
 * ID 搜索
 * 基于源文档内容与预留登记，不再依赖外部关系表。
 */
import type { IdType } from './id-taxonomy.js';
import { validateId } from './id-validator.js';
import { collectKnownIds } from './id-generator.js';

export interface SearchResult {
  id: string;
  type: IdType;
}

export function searchId(
  query: string,
  featureId: string,
  projectRoot: string,
  type?: IdType
): SearchResult[] {
  if (!query) return [];
  const upperQuery = query.toUpperCase();
  return listIds(featureId, projectRoot, type).filter(
    (result) =>
      result.id.toUpperCase().startsWith(upperQuery) ||
      result.id.toUpperCase().includes(upperQuery)
  );
}

export function listIds(featureId: string, projectRoot: string, type?: IdType): SearchResult[] {
  return collectKnownIds(projectRoot, featureId)
    .map((id) => {
      const validation = validateId(id);
      return validation.valid && validation.type
        ? { id, type: validation.type }
        : undefined;
    })
    .filter((result): result is SearchResult => Boolean(result))
    .filter((result) => (type ? result.type === type : true));
}
