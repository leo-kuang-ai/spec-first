/**
 * _context.md 首次生成审核流
 * @see TASK-ORCH-018 首次生成提供 diff 与接受策略，跳过有审计事件
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readAuditLog } from './audit-log.js';

// ─── 类型定义 ───────────────────────────────────────────

/** 接受策略 */
export type AcceptStrategy = 'auto' | 'manual' | 'skip';

/** 审核结果 */
export interface ContextReviewResult {
  /** 是否需要人工审核 */
  needsReview: boolean;
  /** 接受策略 */
  strategy: AcceptStrategy;
  /** diff 内容（仅首次生成时有值） */
  diff?: string;
  /** 跳过原因（已有审计事件时） */
  skipReason?: string;
}

// ─── 核心逻辑 ───────────────────────────────────────────

/**
 * 检查 _context.md 是否已有审计事件（已被审核过）
 */
export function hasContextAuditEvent(
  featureId: string,
  projectRoot: string,
): boolean {
  const records = readAuditLog(featureId, projectRoot);
  return records.some(r => r.event === 'context_reviewed');
}

/**
 * 生成 _context.md 的 diff 预览
 * 对比已有内容与新生成内容，返回简化 diff
 */
export function generateContextDiff(
  existingContent: string,
  newContent: string,
): string {
  const oldLines = existingContent.split('\n');
  const newLines = newContent.split('\n');

  const diff: string[] = [];
  const maxLen = Math.max(oldLines.length, newLines.length);

  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldLines[i] ?? '';
    const newLine = newLines[i] ?? '';
    if (oldLine !== newLine) {
      if (oldLine) diff.push(`- ${oldLine}`);
      if (newLine) diff.push(`+ ${newLine}`);
    }
  }

  return diff.length > 0 ? diff.join('\n') : '(no changes)';
}

/**
 * 审核 _context.md 首次生成
 * - 已有审计事件 → skip
 * - 文件不存在（首次生成） → manual review
 * - 文件已存在且有变更 → manual review with diff
 * - 文件已存在且无变更 → auto accept
 */
export function reviewContextGeneration(
  featureId: string,
  projectRoot: string,
  newContent: string,
): ContextReviewResult {
  // 已有审计事件 → 跳过审核
  if (hasContextAuditEvent(featureId, projectRoot)) {
    return {
      needsReview: false,
      strategy: 'skip',
      skipReason: 'context_reviewed event found in audit log',
    };
  }

  const contextPath = join(
    projectRoot, 'specs', featureId, '_context.md',
  );

  // 文件不存在 → 首次生成，需人工审核
  if (!existsSync(contextPath)) {
    return {
      needsReview: true,
      strategy: 'manual',
      diff: newContent.split('\n').map(l => `+ ${l}`).join('\n'),
    };
  }

  // 文件已存在 → 对比 diff
  const existing = readFileSync(contextPath, 'utf-8');
  const diff = generateContextDiff(existing, newContent);

  if (diff === '(no changes)') {
    return { needsReview: false, strategy: 'auto' };
  }

  return { needsReview: true, strategy: 'manual', diff };
}
