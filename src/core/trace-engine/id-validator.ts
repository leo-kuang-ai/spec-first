/**
 * ID 格式校验
 * 校验任意 ID 字符串的格式合法性，返回类型识别结果
 */
import type { IdValidationResult } from '../../shared/types.js';
import { ID_PATTERNS } from './id-taxonomy.js';

/** 校验 ID 格式，返回 { valid, type?, error? } */
export function validateId(id: string): IdValidationResult {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'ID 必须是非空字符串' };
  }

  for (const { type, regex } of ID_PATTERNS) {
    if (regex.test(id)) {
      return { valid: true, type };
    }
  }

  return { valid: false, error: `未知 ID 格式："${id}"` };
}

/** 导出正则供其他模块使用 */
export { ID_PATTERNS };
