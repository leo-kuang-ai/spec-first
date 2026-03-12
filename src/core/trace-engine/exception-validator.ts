/**
 * Known Exception 校验
 * 校验 known-exceptions.md 中豁免条目的有效性
 */
import { join } from 'node:path';
import type { KnownException } from '../../shared/types.js';
import { readMarkdown, exists, parseMarkdownTable } from '../../shared/fs-utils.js';

/** 校验结果 */
export interface ExceptionValidationResult {
  valid: KnownException[];
  invalid: Array<{ exception: KnownException; reason: string }>;
}

/** 校验所有 Exception 条目 */
export function validateExceptions(
  featureId: string,
  projectRoot: string,
  rfcStatuses: Map<string, string>
): ExceptionValidationResult {
  const exceptionsPath = join(projectRoot, 'specs', featureId, 'known-exceptions.md');
  if (!exists(exceptionsPath)) {
    return { valid: [], invalid: [] };
  }

  const exceptions = parseExceptions(exceptionsPath);
  const valid: KnownException[] = [];
  const invalid: ExceptionValidationResult['invalid'] = [];

  for (const ex of exceptions) {
    const reasons = checkException(ex, rfcStatuses);
    if (reasons.length === 0) {
      valid.push(ex);
    } else {
      invalid.push({ exception: ex, reason: reasons.join('; ') });
    }
  }

  return { valid, invalid };
}

// ─── 私有辅助函数 ─────────────────────────────────────────

/** 校验单个 Exception 条目 */
function checkException(ex: KnownException, rfcStatuses: Map<string, string>): string[] {
  const reasons: string[] = [];

  // RFC 必须存在且已审批
  const rfcStatus = rfcStatuses.get(ex.rfcId);
  if (!rfcStatus) {
    reasons.push(`未找到 RFC ${ex.rfcId}`);
  } else if (rfcStatus !== 'approved') {
    reasons.push(`RFC ${ex.rfcId} 当前状态为 "${rfcStatus}"，预期 "approved"`);
  }

  // 必须有 expiresAt
  if (!ex.expiresAt) {
    reasons.push('缺少 expires_at');
  } else {
    const expires = new Date(ex.expiresAt);
    if (expires.getTime() < Date.now()) {
      reasons.push(`已过期：${ex.expiresAt}`);
    }
  }

  // 必须有 rollbackPoint
  if (!ex.rollbackPoint) {
    reasons.push('缺少 rollback_point');
  }

  return reasons;
}

/** 解析 known-exceptions.md 为结构化数据 */
function parseExceptions(path: string): KnownException[] {
  const content = readMarkdown(path);
  const exceptions: KnownException[] = [];

  for (const cells of parseMarkdownTable(content)) {
    if (cells.length < 7) continue;
    exceptions.push({
      id: cells[0],
      rfcId: cells[1],
      frId: cells[2],
      reason: cells[3],
      expiresAt: cells[4],
      rollbackPoint: cells[5],
      approvedBy: cells[6] ?? '',
      approvedAt: cells[7] ?? '',
    });
  }

  return exceptions;
}
