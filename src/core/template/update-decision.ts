/**
 * 变更决策逻辑
 * 基于 meta/local 分离和模板哈希比对，决定更新策略
 */
import { join } from 'node:path';
import { exists } from '../../shared/fs-utils.js';
import type { HashChange, HashDiffResult } from './hash-registry.js';
import type { ChangeLevel } from './change-classifier.js';

// ─── 类型定义 ───────────────────────────────────────────

export type UpdateAction = 'SKIP' | 'AUTO_UPDATE' | 'PROMPT' | 'BLOCK';

export interface UpdateDecision {
  template: string;
  action: UpdateAction;
  reason: string;
  level: ChangeLevel;
  hasLocalOverride: boolean;
}

export interface BatchUpdateDecision {
  decisions: UpdateDecision[];
  summary: {
    skip: number;
    autoUpdate: number;
    prompt: number;
    block: number;
  };
  requiresUserInput: boolean;
}

// ─── 核心函数 ───────────────────────────────────────────

/**
 * 检查本地是否有同名模板覆盖
 */
function hasLocalOverride(templateName: string, projectRoot: string): boolean {
  const localTemplatePath = join(
    projectRoot,
    '.spec-first',
    'local',
    'templates',
    `${templateName}.hbs`
  );
  return exists(localTemplatePath);
}

/**
 * 决定单个模板的更新动作
 * @param change 哈希变更记录
 * @param hasLocalOverride 本地是否有覆盖
 * @returns 更新决策
 */
export function decideUpdate(change: HashChange, hasLocalOverride: boolean): UpdateDecision {
  const { template, changeType, level } = change;

  // 未变更：跳过
  if (changeType === 'unchanged') {
    return {
      template,
      action: 'SKIP',
      reason: '模板内容未变更',
      level,
      hasLocalOverride: false,
    };
  }

  // Critical 变更：始终阻断确认
  if (level === 'Critical') {
    return {
      template,
      action: 'BLOCK',
      reason: '关键配置/规则文件变更，必须显式确认',
      level,
      hasLocalOverride,
    };
  }

  // 模板被删除
  if (changeType === 'deleted') {
    return {
      template,
      action: 'PROMPT',
      reason: '模板已从包中移除',
      level,
      hasLocalOverride,
    };
  }

  // 模板变更 + 本地有覆盖：提示用户
  if (hasLocalOverride) {
    return {
      template,
      action: 'PROMPT',
      reason: '模板内容已变更且本地有定制版本',
      level,
      hasLocalOverride: true,
    };
  }

  // 模板变更 + 本地无覆盖：自动更新
  if (changeType === 'modified' || changeType === 'added') {
    return {
      template,
      action: 'AUTO_UPDATE',
      reason: level === 'Major' ? '流程/Skill 模板变更，无本地定制' : '文档/辅助模板变更',
      level,
      hasLocalOverride: false,
    };
  }

  // 默认：跳过
  return {
    template,
    action: 'SKIP',
    reason: '无需更新',
    level,
    hasLocalOverride,
  };
}

/**
 * 批量决策多个模板的更新动作
 * @param diff 哈希比对结果
 * @param projectRoot 项目根目录
 * @returns 批量更新决策
 */
export function decideBatchUpdate(diff: HashDiffResult, projectRoot: string): BatchUpdateDecision {
  const allChanges: HashChange[] = [
    ...diff.added,
    ...diff.modified,
    ...diff.deleted,
    ...diff.unchanged,
  ];

  const decisions = allChanges.map((change) => {
    const localOverride = hasLocalOverride(change.template, projectRoot);
    return decideUpdate(change, localOverride);
  });

  const summary = {
    skip: decisions.filter((d) => d.action === 'SKIP').length,
    autoUpdate: decisions.filter((d) => d.action === 'AUTO_UPDATE').length,
    prompt: decisions.filter((d) => d.action === 'PROMPT').length,
    block: decisions.filter((d) => d.action === 'BLOCK').length,
  };

  const requiresUserInput = decisions.some((d) => d.action === 'PROMPT' || d.action === 'BLOCK');

  return {
    decisions,
    summary,
    requiresUserInput,
  };
}

/**
 * 过滤需要特定动作的决策
 */
export function filterByAction(
  batchDecision: BatchUpdateDecision,
  action: UpdateAction
): UpdateDecision[] {
  return batchDecision.decisions.filter((d) => d.action === action);
}

/**
 * 格式化决策摘要（用于终端输出）
 */
export function formatDecisionSummary(batchDecision: BatchUpdateDecision): string {
  const lines: string[] = [];
  lines.push('=== 模板更新决策摘要 ===');
  lines.push(`跳过: ${batchDecision.summary.skip}`);
  lines.push(`自动更新: ${batchDecision.summary.autoUpdate}`);
  lines.push(`需要确认: ${batchDecision.summary.prompt}`);
  lines.push(`阻断更新: ${batchDecision.summary.block}`);
  lines.push('');

  if (batchDecision.requiresUserInput) {
    const promptDecisions = filterByAction(batchDecision, 'PROMPT');
    const blockDecisions = filterByAction(batchDecision, 'BLOCK');

    if (promptDecisions.length > 0) {
      lines.push('需要用户确认的模板:');
      for (const d of promptDecisions) {
        lines.push(`  [PROMPT] ${d.template} (${d.level}) - ${d.reason}`);
      }
      lines.push('');
    }

    if (blockDecisions.length > 0) {
      lines.push('阻断更新的模板（必须显式确认）:');
      for (const d of blockDecisions) {
        lines.push(`  [BLOCK] ${d.template} (${d.level}) - ${d.reason}`);
      }
      lines.push('');
    }
  }

  const autoUpdateDecisions = filterByAction(batchDecision, 'AUTO_UPDATE');
  if (autoUpdateDecisions.length > 0) {
    lines.push('将自动更新的模板:');
    for (const d of autoUpdateDecisions) {
      lines.push(`  [AUTO] ${d.template} (${d.level})`);
    }
  }

  return lines.join('\n');
}
