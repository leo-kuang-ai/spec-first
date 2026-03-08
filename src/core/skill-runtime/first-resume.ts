/**
 * First Skill 会话恢复逻辑
 *
 * 功能:
 * - 检测已有 runtime 产物并生成恢复提示
 * - 过期检测与提醒
 * - 渐进式升级提示 (quick → deep)
 */

import { existsSync } from 'node:fs';
import { checkFirstUpdateContext } from './first-change-detector.js';
import { classifyProjectMaturity, detectPlatformType } from './first-platform-detector.js';
import { resolveFirstConfirmPolicy, resolveFirstModePolicy, validateFirstArgs } from './first-args.js';
import { logFirstRuntimeWarning } from './first-runtime-observability.js';
import {
  getFirstRuntimeDir,
  readFirstRuntimeIndex,
  readFirstRuntimeSummary,
} from './first-runtime-store.js';

export type ResumeOption =
  | 'view_summary'
  | 'incremental'
  | 'upgrade_deep'
  | 'full_regenerate'
  | 'skip';

export interface ResumeRecommendation {
  hasExistingProducts: boolean;
  lastMode?: 'quick' | 'deep';
  lastRunTime?: Date;
  isStale: boolean;
  staleReason?: string;
  commitMismatch: boolean;
  options: ResumeOption[];
  recommendedOption: ResumeOption;
  message: string;
}

const STALE_DAYS = 7;

function checkRuntimeIndexStale(lastRun: string): { stale: boolean; reason?: string } {
  const daysSinceLastRun = (Date.now() - new Date(lastRun).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceLastRun > STALE_DAYS) {
    return {
      stale: true,
      reason: `产物已过期（距今 ${Math.floor(daysSinceLastRun)} 天）`,
    };
  }
  return { stale: false };
}

export function generateResumeRecommendation(projectRoot: string): ResumeRecommendation {
  const runtimeDir = getFirstRuntimeDir(projectRoot);
  const hasExistingProducts = existsSync(runtimeDir);

  if (!hasExistingProducts) {
    if (existsSync(projectRoot) && classifyProjectMaturity(projectRoot) === 'greenfield') {
      return {
        hasExistingProducts: false,
        isStale: false,
        commitMismatch: false,
        options: ['skip', 'full_regenerate'],
        recommendedOption: 'skip',
        message: '⚠️ 检测到空项目或新建项目，建议先创建代码后再运行 /spec-first:first',
      };
    }

    return {
      hasExistingProducts: false,
      isStale: false,
      commitMismatch: false,
      options: ['full_regenerate'],
      recommendedOption: 'full_regenerate',
      message: '✅ 首次运行，将生成项目认知文档',
    };
  }

  const runtimeIndex = readFirstRuntimeIndex(projectRoot);
  if (!runtimeIndex) {
    return {
      hasExistingProducts: true,
      isStale: true,
      staleReason: 'runtime 索引文件缺失，产物目录已存在',
      commitMismatch: false,
      options: ['view_summary', 'full_regenerate', 'skip'],
      recommendedOption: 'full_regenerate',
      message: '⚠️ 检测到已有 runtime 产物但索引文件缺失，建议全量重新生成以重建索引',
    };
  }

  const runtimeSummary = readFirstRuntimeSummary(projectRoot);
  const updateContext = checkFirstUpdateContext(projectRoot);
  const staleCheck = checkRuntimeIndexStale(runtimeIndex.lastRun);
  const lastRunTime = new Date(runtimeIndex.lastRun);
  const daysSince = Math.floor((Date.now() - lastRunTime.getTime()) / (1000 * 60 * 60 * 24));
  const detectedPlatform = detectPlatformType(projectRoot);
  const platformType = runtimeSummary?.project.platformType
    ?? (detectedPlatform.subType ? `${detectedPlatform.type}/${detectedPlatform.subType}` : detectedPlatform.type);
  const options: ResumeOption[] = ['view_summary'];

  if (runtimeIndex.mode === 'quick') {
    options.push('upgrade_deep');
  }
  if ((updateContext.changeAnalysis?.changedFiles ?? 0) > 0) {
    options.push('incremental');
  }
  options.push('full_regenerate', 'skip');

  let recommendedOption: ResumeOption = 'skip';
  if (staleCheck.stale || updateContext.changeAnalysis?.recommendedStrategy === 'full') {
    recommendedOption = 'full_regenerate';
  } else if (runtimeIndex.mode === 'quick' && updateContext.productStatus.some(product => product.issues.length > 0)) {
    recommendedOption = 'upgrade_deep';
  }

  return {
    hasExistingProducts: true,
    lastMode: runtimeIndex.mode,
    lastRunTime,
    isStale: staleCheck.stale,
    staleReason: staleCheck.reason,
    commitMismatch: false,
    options,
    recommendedOption,
    message: `📋 检测到已有 00-first runtime 产物 | 模式: ${runtimeIndex.mode} | 端类型: ${platformType} | 距今: ${daysSince} 天`,
  };
}

export function formatResumePrompt(recommendation: ResumeRecommendation): string {
  const lines: string[] = [];
  const canSkipConfirm = (args: string[]): boolean => {
    try {
      const parsed = validateFirstArgs(args);
      return resolveFirstConfirmPolicy(parsed) === 'skip' && resolveFirstModePolicy(parsed) === 'manual';
    } catch (error) {
      logFirstRuntimeWarning('first-resume.formatResumePrompt', '解析恢复参数失败，降级为不显示快捷命令', error);
      return false;
    }
  };

  lines.push(recommendation.message);
  lines.push('');

  if (recommendation.hasExistingProducts) {
    lines.push('**产物清单**:');
  }

  lines.push('');
  lines.push('**选项**:');

  const optionLabels: Record<ResumeOption, string> = {
    view_summary: '查看产物摘要',
    incremental: '增量更新（基于 git diff）',
    upgrade_deep: '升级到 deep 模式（追加 6 个文档）',
    full_regenerate: '全量重新生成',
    skip: '跳过（使用现有产物）',
  };

  let optionIndex = 1;
  for (const option of recommendation.options) {
    const label = optionLabels[option];
    const isRecommended = option === recommendation.recommendedOption;
    lines.push(`  ${optionIndex}. ${label}${isRecommended ? '（推荐）' : ''} [\`${option}\`]`);
    optionIndex += 1;
  }

  lines.push('');
  lines.push('请选择选项或直接运行命令：');

  if (recommendation.options.includes('incremental')) {
    lines.push('  /spec-first:first --update=<产物列表>');
  }
  if (recommendation.options.includes('upgrade_deep') && canSkipConfirm(['--deep'])) {
    lines.push('  /spec-first:first --deep');
  }
  if (recommendation.options.includes('full_regenerate') && canSkipConfirm(['--force'])) {
    lines.push('  /spec-first:first --force');
  }
  if (recommendation.options.includes('skip') && canSkipConfirm(['--skip'])) {
    lines.push('  /spec-first:first --skip');
  }

  return lines.join('\n');
}

export function formatProductSummary(projectRoot: string): string {
  const runtimeIndex = readFirstRuntimeIndex(projectRoot);
  const runtimeSummary = readFirstRuntimeSummary(projectRoot);
  if (!runtimeIndex) {
    return '❌ 未找到 runtime 索引文件';
  }

  const lines: string[] = [];
  lines.push('📋 **00-first runtime 摘要**');
  lines.push('');
  lines.push(`- 运行模式: ${runtimeIndex.mode}`);
  lines.push(`- 上次更新: ${runtimeIndex.lastRun.slice(0, 19).replace('T', ' ')}`);
  if (runtimeSummary?.project.name) {
    lines.push(`- 项目名称: ${runtimeSummary.project.name}`);
  }
  if (runtimeSummary?.project.platformType) {
    lines.push(`- 端类型: ${runtimeSummary.project.platformType}`);
  }
  lines.push('');
  lines.push('**runtime-assets** (3 个):');
  lines.push(`  - ${runtimeIndex.summary.path}`);
  lines.push(`  - ${runtimeIndex.roleViews.path}`);
  lines.push(`  - ${runtimeIndex.stageViews.path}`);
  return lines.join('\n');
}
