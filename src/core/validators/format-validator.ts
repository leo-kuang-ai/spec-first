/**
 * 格式校验器
 * 校验 PRD 章节、文档关联文件、必需字段
 */
import { join } from 'node:path';
import { exists, readMarkdown } from '../../shared/fs-utils.js';
import { loadDocumentLinks, validateDocumentLinksData } from '../document-links.js';
import yaml from 'js-yaml';

export interface FormatValidationResult {
  pass: boolean;
  errors: string[];
}

export function validateFormat(featureId: string, projectRoot: string): FormatValidationResult {
  const errors: string[] = [];
  errors.push(...validatePrdFormat(featureId, projectRoot));
  errors.push(...validateFilePaths(featureId, projectRoot));
  errors.push(...validateRequiredFields(featureId, projectRoot));
  errors.push(...validateDocumentLinksFormat(featureId, projectRoot));
  return { pass: errors.length === 0, errors };
}

function validatePrdFormat(featureId: string, projectRoot: string): string[] {
  const prdPath = join(projectRoot, 'specs', featureId, 'prd.md');
  if (!exists(prdPath)) return [];

  const content = readMarkdown(prdPath);
  const errors: string[] = [];
  const requiredChapters = [
    { pattern: /^## 1\. 业务目标/m, name: '1. 业务目标' },
    { pattern: /^## 2\. 功能需求/m, name: '2. 功能需求' },
    { pattern: /^## 3\. 非功能需求/m, name: '3. 非功能需求' },
  ];

  for (const chapter of requiredChapters) {
    if (!chapter.pattern.test(content)) {
      errors.push(`PRD 缺少章节：${chapter.name}`);
    }
  }

  return errors;
}

function validateFilePaths(featureId: string, projectRoot: string): string[] {
  const specDir = join(projectRoot, 'specs', featureId);
  const requiredFiles = ['spec.md', 'document-links.yaml'];

  return requiredFiles
    .filter((file) => !exists(join(specDir, file)))
    .map((file) => `缺少必需文件：specs/${featureId}/${file}`);
}

function validateRequiredFields(featureId: string, projectRoot: string): string[] {
  const specPath = join(projectRoot, 'specs', featureId, 'spec.md');
  if (!exists(specPath)) return [];

  const content = readMarkdown(specPath);
  const hasFeatureIdField = /^(?:\*\*)?Feature ID(?:\*\*)?\s*:/m.test(content);
  return hasFeatureIdField ? [] : ['spec.md 缺少 Feature ID 字段'];
}

function validateDocumentLinksFormat(featureId: string, projectRoot: string): string[] {
  const filePath = join(projectRoot, 'specs', featureId, 'document-links.yaml');
  if (!exists(filePath)) return [];

  try {
    const raw = readMarkdown(filePath);
    const parsed = yaml.load(raw, { schema: yaml.JSON_SCHEMA });
    const result = validateDocumentLinksData(parsed);
    return result.valid ? [] : result.errors;
  } catch (error) {
    return [`document-links.yaml 解析失败：${error instanceof Error ? error.message : String(error)}`];
  }
}

export function validateLinks(featureId: string, projectRoot: string): FormatValidationResult {
  try {
    loadDocumentLinks(featureId, projectRoot);
    return { pass: true, errors: [] };
  } catch (error) {
    return {
      pass: false,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}
