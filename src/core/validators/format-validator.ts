/**
 * 格式校验器
 * 校验 PRD 章节格式、ID 格式、文件路径等
 */
import { join } from 'node:path';
import { exists, readMarkdown } from '../../shared/fs-utils.js';

export interface FormatValidationResult {
  pass: boolean;
  errors: string[];
}

export function validateFormat(featureId: string, projectRoot: string): FormatValidationResult {
  const errors: string[] = [];

  // 1. PRD 章节格式校验
  const prdErrors = validatePrdFormat(featureId, projectRoot);
  errors.push(...prdErrors);

  // 2. ID 格式校验
  const idErrors = validateIdFormat(featureId, projectRoot);
  errors.push(...idErrors);

  // 3. 文件路径校验
  const pathErrors = validateFilePaths(featureId, projectRoot);
  errors.push(...pathErrors);

  // 4. 必需字段校验
  const fieldErrors = validateRequiredFields(featureId, projectRoot);
  errors.push(...fieldErrors);

  return { pass: errors.length === 0, errors };
}

function validatePrdFormat(featureId: string, projectRoot: string): string[] {
  const prdPath = join(projectRoot, 'specs', featureId, 'prd.md');
  if (!exists(prdPath)) return [];

  const content = readMarkdown(prdPath);
  const errors: string[] = [];

  // 与 prd-validator 统一：检查 PRD 必需章节
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

function validateIdFormat(featureId: string, projectRoot: string): string[] {
  const matrixPath = join(projectRoot, 'specs', featureId, 'traceability-matrix.md');
  if (!exists(matrixPath)) return [];

  const content = readMarkdown(matrixPath);
  const errors: string[] = [];

  // 检查 ID 中是否包含多余连字符（如 FR-SPEC-OPT-001 应为 FR-SPECOPT-001）
  const idPattern = /\| ([A-Z]+-[A-Z]+-[A-Z]+-[A-Z0-9]+) \|/g;
  const matches = content.matchAll(idPattern);

  for (const match of matches) {
    const id = match[1];
    const parts = id.split('-');
    if (parts.length > 3) {
      errors.push(`ID 格式错误：${id}（应移除中间连字符）`);
    }
  }

  return errors;
}

function validateFilePaths(featureId: string, projectRoot: string): string[] {
  const errors: string[] = [];
  const specDir = join(projectRoot, 'specs', featureId);

  // 检查核心产物路径
  const requiredFiles = ['spec.md', 'traceability-matrix.md'];

  for (const file of requiredFiles) {
    const filePath = join(specDir, file);
    if (!exists(filePath)) {
      errors.push(`缺少必需文件：specs/${featureId}/${file}`);
    }
  }

  return errors;
}

function validateRequiredFields(featureId: string, projectRoot: string): string[] {
  const specPath = join(projectRoot, 'specs', featureId, 'spec.md');
  if (!exists(specPath)) return [];

  const content = readMarkdown(specPath);
  const errors: string[] = [];

  // 检查必需元信息
  if (!content.includes('Feature ID:')) {
    errors.push('spec.md 缺少 Feature ID 字段');
  }

  return errors;
}
