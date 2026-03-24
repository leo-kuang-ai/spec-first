/**
 * 格式校验器
 * 校验 PRD 章节、基础产物与必需字段
 */
import { join } from 'node:path';
import { exists, readMarkdown } from '../../shared/fs-utils.js';

export interface FormatValidationResult {
  pass: boolean;
  errors: string[];
}

export function validateFormat(featureId: string, projectRoot: string): FormatValidationResult {
  const errors: string[] = [];
  errors.push(...validatePrdFormat(featureId, projectRoot));
  errors.push(...validateFilePaths(featureId, projectRoot));
  errors.push(...validateRequiredFields(featureId, projectRoot));
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
  const requiredFiles = ['spec.md'];

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
