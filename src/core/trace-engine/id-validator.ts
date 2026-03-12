/**
 * ID 格式校验
 * 校验任意 ID 字符串的格式合法性，返回类型识别结果
 */
import type { IdType, IdValidationResult } from '../../shared/types.js';

/** 6 种 ID 格式正则 */
const ID_PATTERNS: ReadonlyArray<{ type: IdType; regex: RegExp }> = [
  { type: 'Feature', regex: /^FSREQ-\d{8}-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  { type: 'FR', regex: /^FR-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  { type: 'DS', regex: /^DS-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  { type: 'TASK', regex: /^TASK-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  { type: 'REQ', regex: /^REQ-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  { type: 'SYS', regex: /^SYS-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  { type: 'ARCH', regex: /^ARCH-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  { type: 'MOD', regex: /^MOD-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  { type: 'ATP', regex: /^ATP-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  { type: 'STP', regex: /^STP-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  { type: 'ITP', regex: /^ITP-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  { type: 'UTP', regex: /^UTP-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  { type: 'TC', regex: /^TC-(UT|IT|E2E|ST)-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  { type: 'RFC', regex: /^RFC-\d{3}$/ },
];

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
