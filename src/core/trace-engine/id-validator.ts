/**
 * ID 格式校验
 * 校验任意 ID 字符串的格式合法性，返回类型识别结果
 */
import type { IdType, IdValidationResult } from '../../shared/types.js';

/** 6 种 ID 格式正则 */
const ID_PATTERNS: ReadonlyArray<{ type: IdType; regex: RegExp }> = [
  { type: 'Feature', regex: /^FSREQ-\d{8}-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  { type: 'FR',      regex: /^FR-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  { type: 'DS',      regex: /^DS-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  { type: 'TASK',    regex: /^TASK-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  { type: 'TC',      regex: /^TC-(UT|IT|E2E|ST)-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  { type: 'RFC',     regex: /^RFC-\d{3}$/ },
];

/** 校验 ID 格式，返回 { valid, type?, error? } */
export function validateId(id: string): IdValidationResult {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'ID must be a non-empty string' };
  }

  for (const { type, regex } of ID_PATTERNS) {
    if (regex.test(id)) {
      return { valid: true, type };
    }
  }

  return { valid: false, error: `Unknown ID format: "${id}"` };
}

/** 导出正则供其他模块使用 */
export { ID_PATTERNS };
