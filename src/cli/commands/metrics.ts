import { ExitCode } from '../../shared/types.js';
import {
  findBrokenDocumentReferences,
  listMissingDocumentFiles,
  loadDocumentLinks,
} from '../../core/document-links.js';

export interface DocumentMetrics {
  declaredDocCount: number;
  existingDocCount: number;
  linkedDocCount: number;
  brokenReferenceCount: number;
}

export function handleMetrics(_args: string[]): number {
  console.error('spec-first metrics 已退场，请改用 spec-first status 查看节点与任务概览。');
  return ExitCode.VALIDATION_ERROR;
}

export function getDocumentMetrics(featureId: string, projectRoot: string): DocumentMetrics {
  const links = loadDocumentLinks(featureId, projectRoot);
  const missingFiles = listMissingDocumentFiles(links, featureId, projectRoot);
  const brokenReferences = findBrokenDocumentReferences(links);

  return {
    declaredDocCount: links.documents.length,
    existingDocCount: links.documents.length - missingFiles.length,
    linkedDocCount: links.documents.filter((doc) => doc.references.length > 0).length,
    brokenReferenceCount: brokenReferences.length,
  };
}
