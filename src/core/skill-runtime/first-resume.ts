/**
 * First Skill 会话恢复逻辑
 *
 * 功能:
 * - 检测已有 runtime 产物并生成恢复提示
 * - 过期检测与提醒
 * - 已有 runtime 产物的恢复与重建建议
 */

import { existsSync } from 'node:fs';
import { classifyProjectMaturity, detectPlatformType } from './first-platform-detector.js';
import {
  getFirstRuntimeDir,
  readFirstDocsIndex,
  readFirstRuntimeIndex,
  readFirstRuntimeSummary,
} from './first-runtime-store.js';

export type ResumeOption =
  | 'view_summary'
  | 'skip';

export interface ResumeRecommendation {
  hasExistingProducts: boolean;
  lastMode?: 'deep';
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
        options: ['skip'],
        recommendedOption: 'skip',
        message: '⚠️ 检测到空项目或新建项目，建议先由 Skill 产出 final runtime/docs outputs',
      };
    }

    return {
      hasExistingProducts: false,
      isStale: false,
      commitMismatch: false,
      options: ['skip'],
      recommendedOption: 'skip',
      message: '✅ 首次运行，将检查 Skill 产出的 final runtime/docs outputs',
    };
  }

  const runtimeIndex = readFirstRuntimeIndex(projectRoot);
  if (!runtimeIndex) {
    return {
      hasExistingProducts: true,
      isStale: true,
      staleReason: 'runtime 索引文件缺失，产物目录已存在',
      commitMismatch: false,
      options: ['view_summary', 'skip'],
      recommendedOption: 'view_summary',
      message: '⚠️ 检测到已有 runtime 产物但索引文件缺失，建议先查看摘要并确认 final outputs',
    };
  }

  const runtimeSummary = readFirstRuntimeSummary(projectRoot);
  const staleCheck = checkRuntimeIndexStale(runtimeIndex.lastRun);
  const lastRunTime = new Date(runtimeIndex.lastRun);
  const daysSince = Math.floor((Date.now() - lastRunTime.getTime()) / (1000 * 60 * 60 * 24));
  const detectedPlatform = detectPlatformType(projectRoot);
  const platformType =
    runtimeSummary?.project.platformType ??
    (detectedPlatform.subType
      ? `${detectedPlatform.type}/${detectedPlatform.subType}`
      : detectedPlatform.type);
  const options: ResumeOption[] = ['view_summary', 'skip'];
  const recommendedOption: ResumeOption = 'view_summary';

  return {
    hasExistingProducts: true,
    lastMode: 'deep',
    lastRunTime,
    isStale: staleCheck.stale,
    staleReason: staleCheck.reason,
    commitMismatch: false,
    options,
    recommendedOption,
    message: `📋 检测到已有 00-first runtime 产物 | 端类型: ${platformType} | 距今: ${daysSince} 天`,
  };
}

export function formatResumePrompt(recommendation: ResumeRecommendation): string {
  const lines: string[] = [];

  lines.push(recommendation.message);
  lines.push('');

  if (recommendation.hasExistingProducts) {
    lines.push('**产物清单**:');
  }

  lines.push('');
  lines.push('**选项**:');

  const optionLabels: Record<ResumeOption, string> = {
    view_summary: '查看产物摘要',
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

  return lines.join('\n');
}

export function formatProductSummary(projectRoot: string): string {
  const runtimeIndex = readFirstRuntimeIndex(projectRoot);
  const runtimeSummary = readFirstRuntimeSummary(projectRoot);
  const docsIndex = readFirstDocsIndex(projectRoot);
  if (!runtimeIndex) {
    return '❌ 未找到 runtime 索引文件';
  }

  const runtimeAssets = [
    runtimeIndex.summary.path,
    runtimeIndex.steering.path,
    runtimeIndex.conventions.path,
    runtimeIndex.criticalFlows.path,
    runtimeIndex.entryGuide.path,
    runtimeIndex.apiContracts.path,
    runtimeIndex.structureOverview.path,
    runtimeIndex.domainModel.path,
    runtimeIndex.databaseSchema.path,
  ];

  const lines: string[] = [];
  lines.push('📋 **00-first runtime 摘要**');
  lines.push('');
  lines.push(`- 上次更新: ${runtimeIndex.lastRun.slice(0, 19).replace('T', ' ')}`);
  if (runtimeSummary?.project.name) {
    lines.push(`- 项目名称: ${runtimeSummary.project.name}`);
  }
  if (runtimeSummary?.project.platformType) {
    lines.push(`- 端类型: ${runtimeSummary.project.platformType}`);
  }
  lines.push('');
  lines.push(`**runtime-assets** (${runtimeAssets.length} 个):`);
  for (const asset of runtimeAssets) {
    lines.push(`  - ${asset}`);
  }

  if (docsIndex?.quickStart.length) {
    lines.push('');
    lines.push(`**docs_quick_start** (${docsIndex.quickStart.length} 个):`);
    for (const docPath of docsIndex.quickStart.slice(0, 4)) {
      lines.push(`  - ${docPath}`);
    }
  }

  const primaryDocs = docsIndex?.entries.filter((entry) => entry.priority === 'primary').slice(0, 4);
  if (primaryDocs && primaryDocs.length > 0) {
    lines.push('');
    lines.push('**docs_reference_index**:');
    for (const entry of primaryDocs) {
      lines.push(`  - ${entry.path} | ${entry.title} | ${entry.purpose}`);
    }
  }
  return lines.join('\n');
}
