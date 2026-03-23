/**
 * Impact Analysis & Query Interface
 * 基于文档关联的变更影响分析。
 */
import { loadDocumentLinks } from '../document-links.js';
import { getRfc, listRfc } from './rfc.js';
import { getDefect, getEscapeRate, listDefects } from './defect.js';

export interface ImpactNode {
  path: string;
  kind: string;
  stage: string;
}

export interface ImpactResult {
  changedIds: string[];
  directImpact: ImpactNode[];
  indirectImpact: ImpactNode[];
  allAffected: string[];
  summary: string;
}

export function analyzeImpact(
  featureId: string,
  changedIds: string[],
  projectRoot: string
): ImpactResult {
  const links = loadDocumentLinks(featureId, projectRoot);
  const docMap = new Map(links.documents.map((document) => [document.path, document]));
  const reverseMap = new Map<string, string[]>();

  for (const document of links.documents) {
    for (const reference of document.references) {
      const existing = reverseMap.get(reference) ?? [];
      existing.push(document.path);
      reverseMap.set(reference, existing);
    }
  }

  const visited = new Set<string>(changedIds);
  const directImpact = collectImpacts(changedIds, docMap, reverseMap, visited);
  const indirectImpact = collectImpacts(
    directImpact.map((node) => node.path),
    docMap,
    reverseMap,
    visited
  );
  const allAffected = [...new Set([...changedIds, ...directImpact.map((node) => node.path), ...indirectImpact.map((node) => node.path)])];

  return {
    changedIds,
    directImpact,
    indirectImpact,
    allAffected,
    summary: `Changed: ${changedIds.length}, Direct: ${directImpact.length}, Indirect: ${indirectImpact.length}, Total: ${allAffected.length}`,
  };
}

function collectImpacts(
  sourcePaths: string[],
  docMap: Map<string, { path: string; kind: string; stage: string; references: string[] }>,
  reverseMap: Map<string, string[]>,
  visited: Set<string>
): ImpactNode[] {
  const results: ImpactNode[] = [];
  const seen = new Set<string>();

  for (const path of sourcePaths) {
    const references = docMap.get(path)?.references ?? [];
    const reverseRefs = reverseMap.get(path) ?? [];
    const neighbors = [...references, ...reverseRefs];

    for (const neighborPath of neighbors) {
      if (visited.has(neighborPath) || seen.has(neighborPath)) continue;
      const neighbor = docMap.get(neighborPath);
      if (!neighbor) continue;
      visited.add(neighborPath);
      seen.add(neighborPath);
      results.push({
        path: neighbor.path,
        kind: neighbor.kind,
        stage: neighbor.stage,
      });
    }
  }

  return results;
}

export { getRfc, listRfc, getDefect, listDefects, getEscapeRate };
