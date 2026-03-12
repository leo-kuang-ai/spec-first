/**
 * First Skill 增量更新变更检测
 *
 * 功能:
 * - 变更文件 → 受影响产物映射
 * - 30% 变更阈值策略决策
 * - runtime 真源健康检查
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PRODUCT_NAMES } from './first-args.js';
import { getFirstRuntimeDir, readFirstRuntimeIndex } from './first-runtime-store.js';
import { sha256Hex } from '../../shared/crypto-utils.js';
import {
  collectProjectionDocsForChangedFiles,
  matchArtifactsByChangedFile,
  matchRuntimeArtifactsByChangedFile,
} from './first-artifact-mapping.js';
import { logFirstRuntimeWarning, toErrorMessage } from './first-runtime-observability.js';

const GIT_COMMAND_TIMEOUT_MS = 5_000;
const CHANGE_THRESHOLD = 0.3;
const ALL_ARTIFACTS = PRODUCT_NAMES.map((name) => (name === 'README' ? 'README.md' : `${name}.md`));

export type UpdateStrategy = 'incremental' | 'full' | 'skip';

export interface ChangeAnalysis {
  changedFiles: number;
  totalFiles: number;
  changePercentage: number;
  affectedArtifacts: string[];
  recommendedStrategy: UpdateStrategy;
  reason: string;
}

export interface ProductHealth {
  name: string;
  exists: boolean;
  lastUpdated?: Date;
  gitCommit?: string;
  currentHash?: string;
  issues: HealthIssue[];
}

export interface HealthIssue {
  type: 'missing' | 'expired' | 'commit_mismatch' | 'hash_mismatch' | 'format_error';
  message: string;
}

export interface ProductStatus extends ProductHealth {
  needsUpdate: boolean;
}

export interface FirstUpdateContext {
  hasExistingOutput: boolean;
  lastUpdateTime?: Date;
  lastUpdateCommit?: string;
  currentCommit?: string;
  changeAnalysis?: ChangeAnalysis;
  productStatus: ProductStatus[];
  hasManualModifications: boolean;
}

function runGit(projectRoot: string, args: string[]): string {
  return execFileSync('git', args, {
    cwd: projectRoot,
    encoding: 'utf-8',
    timeout: GIT_COMMAND_TIMEOUT_MS,
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 10000) / 10000;
}

function hasGitRepo(projectRoot: string): boolean {
  return existsSync(join(projectRoot, '.git'));
}

export function getCurrentCommit(projectRoot: string): string | undefined {
  if (!hasGitRepo(projectRoot)) return undefined;
  try {
    return runGit(projectRoot, ['rev-parse', 'HEAD']);
  } catch (error) {
    logFirstRuntimeWarning('change-detector.getCurrentCommit', '读取 Git commit 失败', error);
    return undefined;
  }
}

export function analyzeChanges(projectRoot: string, lastUpdateCommit?: string): ChangeAnalysis {
  if (!hasGitRepo(projectRoot)) {
    return {
      changedFiles: 0,
      totalFiles: 0,
      changePercentage: 0,
      affectedArtifacts: ALL_ARTIFACTS.slice(),
      recommendedStrategy: 'full',
      reason: '无 Git 仓库，使用全量更新',
    };
  }

  try {
    const currentCommit = getCurrentCommit(projectRoot) || 'HEAD';
    const compareCommit = lastUpdateCommit || 'HEAD~10';
    const totalOutput = runGit(projectRoot, ['ls-files']);
    const totalFiles = totalOutput.split('\n').filter((file) => file.trim()).length;
    const diffOutput = runGit(projectRoot, [
      'diff',
      '--name-only',
      `${compareCommit}..${currentCommit}`,
    ]);
    const changedFiles = diffOutput.split('\n').filter((file) => file.trim());
    const changePercentage = pct(changedFiles.length, totalFiles);

    const affectedArtifacts = Array.from(
      new Set(changedFiles.flatMap((file) => matchArtifactsByChangedFile(file)))
    );

    if (changedFiles.length === 0) {
      return {
        changedFiles: 0,
        totalFiles,
        changePercentage,
        affectedArtifacts,
        recommendedStrategy: 'skip',
        reason: '无文件变更，跳过更新',
      };
    }

    if (changePercentage > CHANGE_THRESHOLD) {
      return {
        changedFiles: changedFiles.length,
        totalFiles,
        changePercentage,
        affectedArtifacts,
        recommendedStrategy: 'full',
        reason: `变更文件占比 ${(changePercentage * 100).toFixed(1)}% 超过 30% 阈值（${changedFiles.length}/${totalFiles} 个文件），建议全量更新`,
      };
    }

    if (affectedArtifacts.length >= ALL_ARTIFACTS.length) {
      return {
        changedFiles: changedFiles.length,
        totalFiles,
        changePercentage,
        affectedArtifacts,
        recommendedStrategy: 'full',
        reason: `变更影响所有产物（${affectedArtifacts.length} 个），建议全量更新`,
      };
    }

    return {
      changedFiles: changedFiles.length,
      totalFiles,
      changePercentage,
      affectedArtifacts,
      recommendedStrategy: 'incremental',
      reason: `变更规模适中（${changedFiles.length}/${totalFiles} 个文件，${(changePercentage * 100).toFixed(1)}%），受影响 ${affectedArtifacts.length} 个产物，使用增量更新`,
    };
  } catch (error) {
    logFirstRuntimeWarning(
      'change-detector.analyzeChanges',
      'Git 变更分析失败，回退到全量更新',
      error
    );
    return {
      changedFiles: 0,
      totalFiles: 0,
      changePercentage: 1,
      affectedArtifacts: ALL_ARTIFACTS.slice(),
      recommendedStrategy: 'full',
      reason: `变更检测失败: ${toErrorMessage(error)}，使用全量更新`,
    };
  }
}

export function checkFirstUpdateContext(projectRoot: string): FirstUpdateContext {
  const runtimeDir = getFirstRuntimeDir(projectRoot);
  if (!existsSync(runtimeDir)) {
    return {
      hasExistingOutput: false,
      productStatus: [],
      hasManualModifications: false,
    };
  }

  const currentCommit = getCurrentCommit(projectRoot);
  const runtimeIndex = readFirstRuntimeIndex(projectRoot);
  const runtimeAssets = [
    { name: 'summary.json', entry: runtimeIndex?.summary },
    { name: 'role-views.json', entry: runtimeIndex?.roleViews },
    { name: 'stage-views.json', entry: runtimeIndex?.stageViews },
  ];

  const productStatus: ProductStatus[] = runtimeAssets.map(({ name, entry }) => {
    const assetPath = join(runtimeDir, name);
    const assetExists = existsSync(assetPath);
    const issues: HealthIssue[] = [];
    let currentHash: string | undefined;

    if (!assetExists) {
      issues.push({ type: 'missing', message: 'runtime 资产文件不存在' });
    } else {
      currentHash = sha256Hex(readFileSync(assetPath, 'utf-8'));
    }

    if (!entry) {
      issues.push({ type: 'missing', message: 'runtime 索引记录缺失' });
    }

    if (entry?.healthy === false) {
      issues.push({
        type: 'format_error',
        message: entry.issues?.join('；') || 'runtime 资产状态异常',
      });
    }

    if (entry?.fileHash && currentHash && entry.fileHash !== currentHash) {
      issues.push({
        type: 'hash_mismatch',
        message: 'runtime 资产与索引记录不一致（可能被手动修改）',
      });
    }

    return {
      name,
      exists: assetExists,
      lastUpdated: entry?.lastUpdated ? new Date(entry.lastUpdated) : undefined,
      currentHash,
      issues,
      needsUpdate: issues.length > 0,
    };
  });

  const lastUpdateTime = productStatus
    .map((item) => item.lastUpdated)
    .filter((value): value is Date => value instanceof Date)
    .sort((left, right) => right.getTime() - left.getTime())[0];

  return {
    hasExistingOutput: true,
    lastUpdateTime,
    currentCommit,
    changeAnalysis: analyzeChanges(projectRoot),
    productStatus,
    hasManualModifications: productStatus.some((item) =>
      item.issues.some((issue) => issue.type === 'hash_mismatch')
    ),
  };
}

export function getAffectedArtifacts(
  context: FirstUpdateContext,
  forceUpdate: boolean = false
): string[] {
  if (!context.hasExistingOutput || forceUpdate) {
    return ALL_ARTIFACTS.slice();
  }

  const affectedSet = new Set<string>();
  if (context.changeAnalysis) {
    for (const artifact of context.changeAnalysis.affectedArtifacts) {
      affectedSet.add(artifact);
    }
  }
  for (const product of context.productStatus) {
    if (product.needsUpdate) {
      affectedSet.add(product.name);
    }
  }
  return Array.from(affectedSet);
}

export function formatChangeAnalysis(analysis: ChangeAnalysis): string {
  const lines: string[] = [];

  lines.push('📊 **变更分析**');
  lines.push('');
  lines.push(`- 变更文件: ${analysis.changedFiles} 个`);
  lines.push(`- 变更占比: ${(analysis.changePercentage * 100).toFixed(1)}%`);
  lines.push(
    `- 更新策略: ${analysis.recommendedStrategy === 'incremental' ? '增量更新' : analysis.recommendedStrategy === 'full' ? '全量更新' : '跳过'}`
  );
  lines.push('');

  if (analysis.affectedArtifacts.length > 0 && analysis.recommendedStrategy !== 'full') {
    lines.push('🔄 **受影响的产物**:');
    for (const artifact of analysis.affectedArtifacts) {
      lines.push(`  - ${artifact}`);
    }
    lines.push('');
  }

  const unaffected = ALL_ARTIFACTS.filter(
    (artifact) => !analysis.affectedArtifacts.includes(artifact)
  );
  if (unaffected.length > 0 && analysis.recommendedStrategy !== 'full') {
    lines.push('📝 **保持不变的产物**:');
    for (const artifact of unaffected) {
      lines.push(`  - ${artifact}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function formatHealthStatus(context: FirstUpdateContext): string {
  const lines: string[] = [];

  if (!context.hasExistingOutput) {
    return '✅ 未检测到已有产物，将执行首次生成。\n';
  }

  lines.push('📋 **检测到已有产物**');
  if (context.lastUpdateTime) {
    const daysSince = Math.floor(
      (Date.now() - context.lastUpdateTime.getTime()) / (1000 * 60 * 60 * 24)
    );
    lines.push(
      `- 上次更新: ${context.lastUpdateTime.toISOString().split('T')[0]}（距今 ${daysSince} 天）`
    );
  }
  if (context.lastUpdateCommit && context.currentCommit) {
    const commitMatch = context.lastUpdateCommit === context.currentCommit;
    lines.push(`- Git commit: ${commitMatch ? '✅ 匹配' : '⚠️ 不匹配'}`);
  }
  lines.push('');

  const problematic = context.productStatus.filter((product) => product.issues.length > 0);
  if (problematic.length > 0) {
    lines.push('⚠️ **产物健康检查发现问题**:');
    for (const product of problematic) {
      for (const issue of product.issues) {
        lines.push(`- ${product.name}: ${issue.message}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

export type FirstRefreshScope = 'runtime-only' | 'runtime-and-docs';

export interface FirstRefreshDecision {
  scope: FirstRefreshScope;
  runtimeArtifacts: string[];
  docsProjections: string[];
}

export function detectFirstRefreshScope(changedFiles: string[]): FirstRefreshDecision {
  const runtimeArtifacts = Array.from(
    new Set(changedFiles.flatMap((file) => matchRuntimeArtifactsByChangedFile(file)))
  );
  const docsProjections = Array.from(
    new Set(changedFiles.flatMap((file) => collectProjectionDocsForChangedFiles([file])))
  );

  return {
    scope: docsProjections.length > 0 ? 'runtime-and-docs' : 'runtime-only',
    runtimeArtifacts,
    docsProjections,
  };
}
