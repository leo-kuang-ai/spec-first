import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { exists } from '../shared/fs-utils.js';
import { Stage } from '../shared/types.js';

export interface DocumentLinkEntry {
  path: string;
  kind: string;
  stage: Stage;
  references: string[];
}

export interface DocumentLinksFile {
  version: 1;
  featureId: string;
  documents: DocumentLinkEntry[];
}

export interface DocumentLinksValidationResult {
  valid: boolean;
  errors: string[];
}

export interface DocumentStageCheckResult {
  pass: boolean;
  detail: string;
}

const VALID_STAGES = new Set<string>(Object.values(Stage));

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isDocumentLinksFile(value: unknown): value is DocumentLinksFile {
  if (!isRecord(value)) return false;
  if (value.version !== 1) return false;
  if (typeof value.featureId !== 'string') return false;
  if (!Array.isArray(value.documents)) return false;

  return value.documents.every((item) => {
    if (!isRecord(item)) return false;
    return (
      typeof item.path === 'string' &&
      typeof item.kind === 'string' &&
      typeof item.stage === 'string' &&
      VALID_STAGES.has(item.stage) &&
      Array.isArray(item.references) &&
      item.references.every((ref) => typeof ref === 'string')
    );
  });
}

export function validateDocumentLinksData(value: unknown): DocumentLinksValidationResult {
  if (!isDocumentLinksFile(value)) {
    return {
      valid: false,
      errors: ['document-links.yaml 结构非法'],
    };
  }

  const seenPaths = new Set<string>();
  const definedPaths = new Set(value.documents.map((doc) => doc.path));
  const errors: string[] = [];

  for (const doc of value.documents) {
    if (seenPaths.has(doc.path)) {
      errors.push(`document-links.yaml 包含重复文档路径：${doc.path}`);
    } else {
      seenPaths.add(doc.path);
    }
  }

  for (const doc of value.documents) {
    for (const ref of doc.references) {
      if (!definedPaths.has(ref)) {
        errors.push(`document-links.yaml 存在缺失引用：${doc.path} -> ${ref}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function buildDocumentMap(file: DocumentLinksFile): Map<string, DocumentLinkEntry> {
  return new Map(file.documents.map((doc) => [doc.path, doc]));
}

export function hasDocumentReference(
  file: DocumentLinksFile,
  sourcePath: string,
  targetPath: string
): boolean {
  const source = buildDocumentMap(file).get(sourcePath);
  if (!source) return false;
  return source.references.includes(targetPath);
}

export function loadDocumentLinks(featureId: string, projectRoot: string): DocumentLinksFile {
  const filePath = join(projectRoot, 'specs', featureId, 'document-links.yaml');
  if (!exists(filePath)) {
    throw new Error(`未找到 document-links.yaml：${filePath}`);
  }

  const raw = readFileSync(filePath, 'utf-8');
  const parsed = yaml.load(raw, { schema: yaml.JSON_SCHEMA });
  const result = validateDocumentLinksData(parsed);
  if (!result.valid) {
    throw new Error(result.errors.join('\n'));
  }
  return parsed as DocumentLinksFile;
}

export function listMissingDocumentFiles(
  file: DocumentLinksFile,
  featureId: string,
  projectRoot: string
): string[] {
  return file.documents
    .filter((doc) => !exists(join(projectRoot, 'specs', featureId, doc.path)))
    .map((doc) => doc.path);
}

export function findBrokenDocumentReferences(file: DocumentLinksFile): string[] {
  const known = new Set(file.documents.map((doc) => doc.path));
  const broken: string[] = [];

  for (const doc of file.documents) {
    for (const ref of doc.references) {
      if (!known.has(ref)) {
        broken.push(`${doc.path} -> ${ref}`);
      }
    }
  }

  return broken;
}

export function listFeatureTextArtifacts(featureId: string, projectRoot: string): string[] {
  const featureDir = join(projectRoot, 'specs', featureId);
  if (!exists(featureDir)) return [];

  const results: string[] = [];
  walk(featureDir, '', results);
  return results;
}

export function documentMentionsPath(
  featureId: string,
  projectRoot: string,
  sourcePath: string,
  targetPath: string
): boolean {
  const sourceFullPath = join(projectRoot, 'specs', featureId, sourcePath);
  if (!exists(sourceFullPath)) return false;
  return readFileSync(sourceFullPath, 'utf-8').includes(targetPath);
}

export function validateStageDocumentLinks(
  file: DocumentLinksFile,
  stage: Stage
): DocumentStageCheckResult {
  switch (stage) {
    case Stage.SPECIFY:
      return requireDocuments(file, 'spec.md');
    case Stage.DESIGN:
      return requireDocumentsAndReferences(file, ['design.md'], [['design.md', 'spec.md']]);
    case Stage.PLAN:
      return requireDocumentsAndReferences(file, ['task_plan.md'], [
        ['task_plan.md', 'spec.md'],
        ['task_plan.md', 'design.md'],
      ]);
    default:
      return { pass: true, detail: `${stage} 无文档关联约束` };
  }
}

function requireDocuments(file: DocumentLinksFile, ...paths: string[]): DocumentStageCheckResult {
  const map = buildDocumentMap(file);
  const missing = paths.filter((path) => !map.has(path));
  return missing.length === 0
    ? { pass: true, detail: `已声明：${paths.join(', ')}` }
    : { pass: false, detail: `document-links.yaml 缺少文档：${missing.join(', ')}` };
}

function requireDocumentsAndReferences(
  file: DocumentLinksFile,
  docs: string[],
  refs: Array<[string, string]>
): DocumentStageCheckResult {
  const docResult = requireDocuments(file, ...docs);
  if (!docResult.pass) return docResult;

  const missingRefs = refs.filter(([source, target]) => !hasDocumentReference(file, source, target));
  return missingRefs.length === 0
    ? {
        pass: true,
        detail: `已声明引用：${refs.map(([source, target]) => `${source} -> ${target}`).join(', ')}`,
      }
    : {
        pass: false,
        detail: `document-links.yaml 缺少引用：${missingRefs.map(([source, target]) => `${source} -> ${target}`).join(', ')}`,
    };
}

function walk(root: string, relativePath: string, results: string[]): void {
  const currentPath = relativePath ? join(root, relativePath) : root;
  for (const entry of readdirSync(currentPath, { withFileTypes: true })) {
    const nextRelativePath = relativePath ? join(relativePath, entry.name) : entry.name;
    if (entry.isDirectory()) {
      walk(root, nextRelativePath, results);
      continue;
    }
    if (!/\.(md|ya?ml|json)$/i.test(entry.name)) continue;
    results.push(nextRelativePath.replace(/\\/g, '/'));
  }
}
