/**
 * 格式校验器
 * 校验 PRD 章节格式、ID 格式、文件路径等
 */
import { join } from 'node:path';
import { exists, readMarkdown } from '../../shared/fs-utils.js';
import { validateId } from '../trace-engine/id-validator.js';

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

  const seen = new Set<string>();
  const dupes = new Set<string>();
  // 只匹配 ID 列（第1列）：行首 | ID | 格式
  for (const line of content.split('\n')) {
    // 跳过表头和分隔线
    if (line.startsWith('| ID |') || line.match(/^\|[-\s|]+\|$/)) continue;
    // 只匹配第1列的ID
    const match = line.match(/^\|\s*([A-Z][A-Z0-9-]{2,40})\s*\|/);
    if (!match) continue;
    const id = match[1];
    const validation = validateId(id);
    if (!validation.valid) {
      errors.push(`非法 ID 格式：${id} - ${validation.error}`);
      continue;
    }
    if (seen.has(id)) dupes.add(id);
    seen.add(id);

    // 校验 upstream/downstream 列（第5、6列）
    const cells = line.split('|').map((c) => c.trim());
    if (cells.length >= 6) {
      const upstream = cells[5];
      const downstream = cells[6];
      validateRefList(upstream, 'upstream', id, errors);
      validateRefList(downstream, 'downstream', id, errors);
    }
  }
  for (const id of dupes) {
    errors.push(`重复 ID：${id}`);
  }

  return errors;
}

/** 校验引用列表（upstream/downstream）中的 ID 格式 */
function validateRefList(refList: string, field: string, rowId: string, errors: string[]): void {
  if (!refList || refList.trim() === '') return;

  const refs = refList
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean);
  for (const ref of refs) {
    // 跳过占位符（如 src/** 路径）
    if (ref.includes('/') || ref.includes('*')) {
      errors.push(`${rowId} ${field} 包含非法引用：${ref}（应为合法 ID）`);
      continue;
    }

    const validation = validateId(ref);
    if (!validation.valid) {
      errors.push(`${rowId} ${field} 包含非法 ID：${ref} - ${validation.error}`);
    }
  }
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

  // 检查必需元信息：支持字段普通写法和 Markdown 加粗写法
  const hasFeatureIdField = /^(?:\*\*)?Feature ID(?:\*\*)?\s*:/m.test(content);

  if (!hasFeatureIdField) {
    errors.push('spec.md 缺少 Feature ID 字段');
  }

  return errors;
}
