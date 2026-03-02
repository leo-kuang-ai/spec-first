/**
 * First Skill 增量更新变更检测
 *
 * 功能:
 * - 变更文件 → 受影响产物映射
 * - 30% 变更阈值策略决策
 * - 更新策略（增量 vs 全量）判断
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, isAbsolute, join } from 'node:path';
import { PRODUCT_NAMES } from './first-args.js';
import { readIndex } from './first-index.js';
import { sha256Hex } from '../../shared/crypto-utils.js';
import { matchArtifactsByChangedFile } from './first-artifact-mapping.js';
import { logFirstRuntimeWarning, toErrorMessage } from './first-runtime-observability.js';

const GIT_COMMAND_TIMEOUT_MS = 5_000;
const CHANGE_THRESHOLD = 0.30; // 30%

// ========== 类型定义 ==========

/** 更新策略 */
export type UpdateStrategy = 'incremental' | 'full' | 'skip';

/** 变更分析结果 */
export interface ChangeAnalysis {
  /** 变更文件数 */
  changedFiles: number;
  /** 项目总文件数 */
  totalFiles: number;
  /** 变更占比 (0~1) */
  changePercentage: number;
  /** 受影响的产物列表 */
  affectedArtifacts: string[];
  /** 建议的更新策略 */
  recommendedStrategy: UpdateStrategy;
  /** 策略原因说明 */
  reason: string;
}

/** 产物健康状态 */
export interface ProductHealth {
  /** 产物名称 */
  name: string;
  /** 是否存在 */
  exists: boolean;
  /** 最后更新时间 */
  lastUpdated?: Date;
  /** Git commit (从 frontmatter) */
  gitCommit?: string;
  /** 当前文件 hash */
  currentHash?: string;
  /** 健康问题列表 */
  issues: HealthIssue[];
}

/** 健康问题类型 */
export interface HealthIssue {
  type: 'missing' | 'expired' | 'commit_mismatch' | 'hash_mismatch' | 'format_error';
  message: string;
}

/** 产物完整状态（包含健康检查） */
export interface ProductStatus extends ProductHealth {
  /** 需要更新 */
  needsUpdate: boolean;
}

/** First Skill 更新上下文 */
export interface FirstUpdateContext {
  /** 是否已有产物 */
  hasExistingOutput: boolean;
  /** 上次更新时间 */
  lastUpdateTime?: Date;
  /** 上次更新的 Git commit */
  lastUpdateCommit?: string;
  /** 当前 Git commit */
  currentCommit?: string;
  /** 变更分析结果（如果有 Git 仓库） */
  changeAnalysis?: ChangeAnalysis;
  /** 产物状态列表 */
  productStatus: ProductStatus[];
  /** 是否有手动修改 */
  hasManualModifications: boolean;
}

// ========== 常量定义 ==========

/** 所有可能的产物列表（带 .md 后缀，派生自 PRODUCT_NAMES） */
const ALL_ARTIFACTS = PRODUCT_NAMES.map(n => n === 'README' ? 'README.md' : `${n}.md`);

// ========== 工具函数 ==========

/**
 * 执行 Git 命令
 */
function runGit(projectRoot: string, args: string[]): string {
  return execFileSync('git', args, {
    cwd: projectRoot,
    encoding: 'utf-8',
    timeout: GIT_COMMAND_TIMEOUT_MS,
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

/**
 * 计算百分比（零分母安全）
 */
function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 10000) / 10000;
}

/**
 * 解析产物的 frontmatter
 */
function parseProductFrontmatter(content: string): {
  last_updated?: string;
  git_commit?: string;
  mode?: 'quick' | 'deep';
} {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return {};

  const frontmatter: Record<string, string> = {};
  for (const line of frontmatterMatch[1].split('\n')) {
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (match) {
      frontmatter[match[1]] = match[2].trim();
    }
  }

  return {
    last_updated: frontmatter.last_updated,
    git_commit: frontmatter.git_commit,
    mode: frontmatter.mode as 'quick' | 'deep',
  };
}

/**
 * 检查是否有 Git 仓库
 */
function hasGitRepo(projectRoot: string): boolean {
  return existsSync(join(projectRoot, '.git'));
}

/**
 * 获取当前 HEAD commit
 */
export function getCurrentCommit(projectRoot: string): string | undefined {
  if (!hasGitRepo(projectRoot)) return undefined;
  try {
    return runGit(projectRoot, ['rev-parse', 'HEAD']);
  } catch (error) {
    logFirstRuntimeWarning('change-detector.getCurrentCommit', '读取 Git commit 失败', error);
    return undefined;
  }
}

// ========== 主要导出函数 ==========

/**
 * 分析变更并确定更新策略
 */
export function analyzeChanges(
  projectRoot: string,
  lastUpdateCommit?: string,
): ChangeAnalysis {
  if (!hasGitRepo(projectRoot)) {
    // 无 Git 仓库，默认全量更新
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
    // 获取当前 commit
    const currentCommit = getCurrentCommit(projectRoot) || 'HEAD';

    // 使用 lastUpdateCommit 或默认比较范围
    const compareCommit = lastUpdateCommit || 'HEAD~10'; // 默认比较最近 10 个 commit

    // 获取项目总文件数
    const totalOutput = runGit(projectRoot, ['ls-files']);
    const totalFiles = totalOutput.split('\n').filter(f => f.trim()).length;

    // 获取变更文件列表
    const diffOutput = runGit(projectRoot, [
      'diff', '--name-only', `${compareCommit}..${currentCommit}`
    ]);
    const changedFiles = diffOutput.split('\n').filter(f => f.trim());

    // 计算变更百分比
    const changePercentage = pct(changedFiles.length, totalFiles);

    // 计算受影响的产物
    const affectedSet = new Set<string>();
    for (const file of changedFiles) {
      const artifacts = matchArtifactsByChangedFile(file);
      for (const artifact of artifacts) {
        affectedSet.add(artifact);
      }
    }
    const affectedArtifacts = Array.from(affectedSet);

    // 决定更新策略
    let recommendedStrategy: UpdateStrategy;
    let reason: string;

    if (changedFiles.length === 0) {
      recommendedStrategy = 'skip';
      reason = '无文件变更，跳过更新';
    } else if (changePercentage > CHANGE_THRESHOLD) {
      recommendedStrategy = 'full';
      reason = `变更文件占比 ${(changePercentage * 100).toFixed(1)}% 超过 30% 阈值（${changedFiles.length}/${totalFiles} 个文件），建议全量更新`;
    } else if (affectedArtifacts.length >= ALL_ARTIFACTS.length) {
      recommendedStrategy = 'full';
      reason = `变更影响所有产物（${affectedArtifacts.length} 个），建议全量更新`;
    } else {
      recommendedStrategy = 'incremental';
      reason = `变更规模适中（${changedFiles.length}/${totalFiles} 个文件，${(changePercentage * 100).toFixed(1)}%），受影响 ${affectedArtifacts.length} 个产物，使用增量更新`;
    }

    return {
      changedFiles: changedFiles.length,
      totalFiles,
      changePercentage,
      affectedArtifacts,
      recommendedStrategy,
      reason,
    };
  } catch (error) {
    logFirstRuntimeWarning('change-detector.analyzeChanges', 'Git 变更分析失败，回退到全量更新', error);
    // Git 操作失败，默认全量更新
    return {
      changedFiles: 0,
      totalFiles: 0,
      changePercentage: 1.0,
      affectedArtifacts: ALL_ARTIFACTS.slice(),
      recommendedStrategy: 'full',
      reason: `变更检测失败: ${toErrorMessage(error)}，使用全量更新`,
    };
  }
}

/**
 * 检查单个产物的健康状态
 */
export function checkProductHealth(
  productPath: string,
  currentCommit: string | undefined,
  storedHash?: string,
): ProductHealth {
  const issues: HealthIssue[] = [];
  const name = basename(productPath);
  const STALE_DAYS = 7;

  // 1. 存在性检查
  if (!existsSync(productPath)) {
    return {
      name,
      exists: false,
      issues: [{ type: 'missing', message: '产物文件不存在' }],
    };
  }

  // 2. 读取内容
  let content: string;
  try {
    content = readFileSync(productPath, 'utf-8');
  } catch (error) {
    logFirstRuntimeWarning('change-detector.checkProductHealth', `读取产物失败: ${productPath}`, error);
    return {
      name,
      exists: true,
      issues: [{ type: 'format_error', message: '无法读取文件内容' }],
    };
  }

  // 3. 解析 frontmatter
  const frontmatter = parseProductFrontmatter(content);
  const lastUpdated = frontmatter.last_updated
    ? new Date(frontmatter.last_updated)
    : undefined;
  const productCommit = frontmatter.git_commit;

  // 4. 过期检查（7 天）
  if (lastUpdated) {
    const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate > STALE_DAYS) {
      issues.push({
        type: 'expired',
        message: `产物已过期（距今 ${Math.floor(daysSinceUpdate)} 天）`,
      });
    }
  }

  // 5. Git commit 匹配检查
  if (currentCommit && productCommit && productCommit !== currentCommit) {
    issues.push({
      type: 'commit_mismatch',
      message: `Git commit 不匹配（产物: ${productCommit.slice(0, 7)}, 当前: ${currentCommit.slice(0, 7)}）`,
    });
  }

  // 6. 格式校验
  try {
    if (!content.trim().startsWith('#') && !content.trim().startsWith('---')) {
      issues.push({ type: 'format_error', message: 'Markdown 格式异常（缺少标题）' });
    }
  } catch (error) {
    logFirstRuntimeWarning('change-detector.checkProductHealth', `解析产物内容失败: ${productPath}`, error);
    issues.push({ type: 'format_error', message: '无法解析文件内容' });
  }

  // 7. 哈希比对检测手动修改
  const currentHash = sha256Hex(content);
  if (storedHash && currentHash !== storedHash) {
    issues.push({ type: 'hash_mismatch', message: '文件内容与索引记录不一致（可能被手动修改）' });
  }

  return {
    name,
    exists: true,
    lastUpdated,
    gitCommit: productCommit,
    currentHash,
    issues,
  };
}

/**
 * 检查 First Skill 产物的更新上下文
 *
 * @param projectRoot 项目根目录
 * @param firstDir 产物目录（默认 docs/first）
 * @returns 更新上下文
 */
export function checkFirstUpdateContext(
  projectRoot: string,
  firstDir: string = 'docs/first',
): FirstUpdateContext {
  const firstPath = isAbsolute(firstDir) ? firstDir : join(projectRoot, firstDir);
  const hasExistingOutput = existsSync(firstPath);

  if (!hasExistingOutput) {
    return {
      hasExistingOutput: false,
      productStatus: [],
      hasManualModifications: false,
    };
  }

  // 获取当前 Git 状态
  const currentCommit = getCurrentCommit(projectRoot);

  // 读取产物目录
  const index = readIndex(firstPath);
  const productStatus: ProductStatus[] = [];
  let hasManualModifications = false;
  let lastUpdateTime: Date | undefined;
  let lastUpdateCommit: string | undefined;

  try {
    const entries = readdirSync(firstPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;

      const productPath = join(firstPath, entry.name);
      const storedHash = index?.products[entry.name]?.file_hash;
      const health = checkProductHealth(productPath, currentCommit || '', storedHash);

      const needsUpdate =
        health.issues.some(
          issue =>
            issue.type === 'missing' ||
            issue.type === 'expired' ||
            issue.type === 'commit_mismatch' ||
            issue.type === 'hash_mismatch' ||
            issue.type === 'format_error'
        );

      productStatus.push({
        ...health,
        needsUpdate,
      });

      // 跟踪最晚的更新时间
      if (health.lastUpdated) {
        if (!lastUpdateTime || health.lastUpdated > lastUpdateTime) {
          lastUpdateTime = health.lastUpdated;
        }
      }

      // 跟踪 commit
      if (health.gitCommit) {
        lastUpdateCommit = health.gitCommit;
      }
    }

    // 检查是否有 hash_mismatch 问题（手动修改）
    hasManualModifications = productStatus.some(
      p => p.issues.some(i => i.type === 'hash_mismatch')
    );
  } catch (error) {
    logFirstRuntimeWarning('change-detector.checkFirstUpdateContext', `扫描产物目录失败: ${firstPath}`, error);
  }

  // 执行变更分析
  const changeAnalysis = analyzeChanges(projectRoot, lastUpdateCommit);

  return {
    hasExistingOutput: true,
    lastUpdateTime,
    lastUpdateCommit,
    currentCommit,
    changeAnalysis,
    productStatus,
    hasManualModifications,
  };
}

/**
 * 从更新上下文中提取受影响的产物列表
 *
 * @param context 更新上下文
 * @param forceUpdate 强制更新所有产物
 * @returns 需要更新的产物列表
 */
export function getAffectedArtifacts(
  context: FirstUpdateContext,
  forceUpdate: boolean = false,
): string[] {
  if (!context.hasExistingOutput || forceUpdate) {
    return ALL_ARTIFACTS.slice();
  }

  const affectedSet = new Set<string>();

  // 从变更分析中获取
  if (context.changeAnalysis) {
    for (const artifact of context.changeAnalysis.affectedArtifacts) {
      affectedSet.add(artifact);
    }
  }

  // 从健康检查中获取需要更新的产物
  for (const product of context.productStatus) {
    if (product.needsUpdate) {
      affectedSet.add(product.name);
    }
  }

  return Array.from(affectedSet);
}

/**
 * 格式化变更分析结果为用户友好的提示
 */
export function formatChangeAnalysis(analysis: ChangeAnalysis): string {
  const lines: string[] = [];

  lines.push('📊 **变更分析**');
  lines.push('');
  lines.push(`- 变更文件: ${analysis.changedFiles} 个`);
  lines.push(`- 变更占比: ${(analysis.changePercentage * 100).toFixed(1)}%`);
  lines.push(`- 更新策略: ${analysis.recommendedStrategy === 'incremental' ? '增量更新' : analysis.recommendedStrategy === 'full' ? '全量更新' : '跳过'}`);
  lines.push('');

  if (analysis.affectedArtifacts.length > 0 && analysis.recommendedStrategy !== 'full') {
    lines.push('🔄 **受影响的产物**:');
    for (const artifact of analysis.affectedArtifacts) {
      lines.push(`  - ${artifact}`);
    }
    lines.push('');
  }

  const unaffected = ALL_ARTIFACTS.filter(
    a => !analysis.affectedArtifacts.includes(a)
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

/**
 * 格式化产物健康检查结果为用户友好的提示
 */
export function formatHealthStatus(context: FirstUpdateContext): string {
  const lines: string[] = [];

  if (!context.hasExistingOutput) {
    return '✅ 未检测到已有产物，将执行首次生成。\n';
  }

  lines.push('📋 **检测到已有产物**');

  if (context.lastUpdateTime) {
    const daysSince = Math.floor((Date.now() - context.lastUpdateTime.getTime()) / (1000 * 60 * 60 * 24));
    lines.push(`- 上次更新: ${context.lastUpdateTime.toISOString().split('T')[0]}（距今 ${daysSince} 天）`);
  }

  if (context.lastUpdateCommit && context.currentCommit) {
    const commitMatch = context.lastUpdateCommit === context.currentCommit;
    lines.push(`- Git commit: ${commitMatch ? '✅ 匹配' : '⚠️ 不匹配'}`);
  }

  lines.push('');

  // 显示有问题的产物
  const problematic = context.productStatus.filter(p => p.issues.length > 0);
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
