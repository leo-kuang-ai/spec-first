/**
 * 状态映射器
 * 支持常见状态变体自动映射到标准 MatrixStatus 值
 */
import type { MatrixStatus } from './types.js';

/** 有效的矩阵状态值 */
export const VALID_MATRIX_STATUSES: readonly MatrixStatus[] = [
  'Planned',
  'Implemented',
  'Verified',
  'Accepted',
  'Deferred',
  'Cancelled',
  'Exception',
] as const;

/** 状态别名映射（小写 → 标准值） */
const STATUS_ALIASES: Record<string, MatrixStatus> = {
  // Planned 的常见变体
  'planned': 'Planned',
  'pending': 'Planned',
  'todo': 'Planned',
  'backlog': 'Planned',
  'new': 'Planned',
  'open': 'Planned',
  'draft': 'Planned',

  // Implemented 的常见变体
  'implemented': 'Implemented',
  'in_progress': 'Implemented',
  'in-progress': 'Implemented',
  'doing': 'Implemented',
  'active': 'Implemented',
  'started': 'Implemented',
  'wip': 'Implemented',

  // Verified 的常见变体
  'verified': 'Verified',
  'tested': 'Verified',
  'passed': 'Verified',
  'reviewed': 'Verified',

  // Accepted 的常见变体
  'accepted': 'Accepted',
  'approved': 'Accepted',
  'done': 'Accepted',
  'completed': 'Accepted',
  'closed': 'Accepted',
  'finished': 'Accepted',
  'complete': 'Accepted',

  // Deferred 的常见变体
  'deferred': 'Deferred',
  'blocked': 'Deferred',
  'postponed': 'Deferred',
  'onhold': 'Deferred',
  'on-hold': 'Deferred',
  'waiting': 'Deferred',
  'hold': 'Deferred',

  // Cancelled 的常见变体
  'cancelled': 'Cancelled',
  'canceled': 'Cancelled',
  'aborted': 'Cancelled',
  'dropped': 'Cancelled',
  'rejected': 'Cancelled',
  'won\'t do': 'Cancelled',
  'wontdo': 'Cancelled',

  // Exception 的常见变体
  'exception': 'Exception',
  'error': 'Exception',
  'failed': 'Exception',
  'skip': 'Exception',
  'skipped': 'Exception',
  'na': 'Exception',
  'n/a': 'Exception',
};

/**
 * 将状态值规范化为标准 MatrixStatus
 * @param input 用户输入的状态值
 * @returns 规范化后的标准状态值，如果无法识别则返回 null
 */
export function normalizeStatus(input: string): MatrixStatus | null {
  // 空值返回默认状态
  if (!input || input.trim() === '') {
    return 'Planned';
  }

  const trimmed = input.trim();

  // 直接匹配标准值（大小写敏感）
  if (VALID_MATRIX_STATUSES.includes(trimmed as MatrixStatus)) {
    return trimmed as MatrixStatus;
  }

  // 尝试别名映射（小写）
  const lower = trimmed.toLowerCase();
  if (STATUS_ALIASES[lower]) {
    return STATUS_ALIASES[lower];
  }

  // 尝试首字母大写后匹配
  const capitalized = lower.charAt(0).toUpperCase() + lower.slice(1);
  if (VALID_MATRIX_STATUSES.includes(capitalized as MatrixStatus)) {
    return capitalized as MatrixStatus;
  }

  return null;
}

/**
 * 验证状态值是否有效
 * @param input 状态值
 * @returns 是否为有效状态
 */
export function isValidStatus(input: string): boolean {
  return normalizeStatus(input) !== null;
}

/**
 * 获取状态的帮助信息
 * @returns 包含所有有效状态值和常见别名的帮助文本
 */
export function getStatusHelpText(): string {
  return `有效状态值：
  - Planned (默认，已规划)
  - Implemented (已实现)
  - Verified (已验证)
  - Accepted (已验收)
  - Deferred (已延期)
  - Cancelled (已取消)
  - Exception (例外处理)

支持的别名：
  - Planned: pending, todo, backlog, new, open, draft
  - Implemented: in_progress, doing, active, wip
  - Verified: tested, passed, reviewed
  - Accepted: approved, done, completed, closed
  - Deferred: blocked, postponed, onhold, waiting
  - Cancelled: canceled, aborted, dropped, rejected
  - Exception: error, failed, skipped, n/a`;
}

/**
 * 获取所有有效状态值的逗号分隔列表
 */
export function getValidStatusList(): string {
  return VALID_MATRIX_STATUSES.join(', ');
}
