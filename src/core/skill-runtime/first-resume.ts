/**
 * First Skill 会话恢复逻辑
 *
 * 功能:
 * - 检测已有产物并生成恢复提示
 * - 过期检测与提醒
 * - 渐进式升级提示 (quick → deep)
 */

import { existsSync } from 'node:fs';
import {
  checkFirstUpdateContext,
  getCurrentCommit,
} from './first-change-detector.js';
import {
  classifyProjectMaturity,
  detectPlatformType,
} from './first-platform-detector.js';
import {
  readIndex,
  writeIndex,
  createIndex,
  type ProductIndex,
  type ProductIndexEntry,
} from './first-index.js';
import { resolveFirstConfirmPolicy, resolveFirstModePolicy, validateFirstArgs } from './first-args.js';
import { sha256Hex } from '../../shared/crypto-utils.js';
import { logFirstRuntimeWarning } from './first-runtime-observability.js';

// ========== 类型定义 ==========

/** 会话恢复选项 */
export type ResumeOption =
  | 'view_summary'      // 查看产物摘要
  | 'incremental'       // 增量更新
  | 'upgrade_deep'      // 升级到 deep 模式
  | 'full_regenerate'   // 全量重新生成
  | 'skip';             // 跳过，使用现有产物

/** 会话恢复建议 */
export interface ResumeRecommendation {
  /** 是否已有产物 */
  hasExistingProducts: boolean;
  /** 上次运行模式 */
  lastMode?: 'quick' | 'deep';
  /** 上次运行时间 */
  lastRunTime?: Date;
  /** 是否过期 */
  isStale: boolean;
  /** 过期原因 */
  staleReason?: string;
  /** Git commit 是否匹配 */
  commitMismatch: boolean;
  /** 建议的操作选项 */
  options: ResumeOption[];
  /** 推荐选项 */
  recommendedOption: ResumeOption;
  /** 用户提示文本 */
  message: string;
}

// ========== 常量 ==========

const STALE_DAYS = 7;

// ========== 主要导出函数 ==========

/**
 * 生成会话恢复建议
 *
 * @param firstDir 产物目录
 * @param projectRoot 项目根目录（可选，用于获取 Git 状态）
 * @returns 会话恢复建议
 */
export function generateResumeRecommendation(
  firstDir: string,
  projectRoot?: string,
): ResumeRecommendation {
  // 读取索引文件
  const index = readIndex(firstDir);

  // 检查产物目录是否存在
  const hasExistingProducts = existsSync(firstDir);

  if (!hasExistingProducts) {
    if (projectRoot && classifyProjectMaturity(projectRoot) === 'greenfield') {
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

  if (!index) {
    // 目录存在但索引丢失，建议重建而非首跑
    return {
      hasExistingProducts: true,
      isStale: true,
      staleReason: '索引文件缺失，产物目录已存在',
      commitMismatch: false,
      options: ['view_summary', 'full_regenerate', 'skip'],
      recommendedOption: 'full_regenerate',
      message: '⚠️ 检测到已有产物但索引文件缺失，建议全量重新生成以重建索引',
    };
  }

  // 获取当前 Git 状态
  const currentCommit = projectRoot ? getCurrentCommit(projectRoot) : undefined;

  // 检查索引状态
  const staleCheck = checkIndexStale(index, currentCommit);

  // 分析产物更新上下文（需要 projectRoot）
  const updateContext = projectRoot
    ? checkFirstUpdateContext(projectRoot, firstDir)
    : { hasExistingOutput: false, productStatus: [], hasManualModifications: false };

  // 生成建议
  const options: ResumeOption[] = [];
  let recommendedOption: ResumeOption;
  const messageParts: string[] = [];

  messageParts.push(`📋 检测到已有 00-first 产物`);

  // 添加模式信息
  if (index.mode) {
    messageParts.push(`模式: ${index.mode}`);
  }

  // 添加端类型信息
  if (index.platform_type) {
    messageParts.push(`端类型: ${index.platform_type}`);
  } else if (projectRoot) {
    const detected = detectPlatformType(projectRoot);
    if (detected.type !== 'unknown') {
      const subType = detected.subType ? `/${detected.subType}` : '';
      messageParts.push(`端类型: ${detected.type}${subType}`);
    }
  }

  // 添加时间信息
  const lastRunTime = new Date(index.last_run);
  const daysSince = Math.floor((Date.now() - lastRunTime.getTime()) / (1000 * 60 * 60 * 24));
  messageParts.push(`距今: ${daysSince} 天`);

  const message = messageParts.join(' | ');

  // 确定可用选项
  options.push('view_summary'); // 查看摘要

  // 如果是 quick 模式，提供升级 deep 选项
  if (index.mode === 'quick') {
    options.push('upgrade_deep');
  }

  // 增量更新选项
  if (updateContext.changeAnalysis) {
    const hasChanges = updateContext.changeAnalysis.changedFiles > 0;
    if (hasChanges) {
      options.push('incremental');
    }
  }

  // 全量重新生成选项
  options.push('full_regenerate');
  options.push('skip');

  // 根据状态确定推荐选项
  if (staleCheck.stale) {
    // 过期了，推荐全量更新，移到第一个
    recommendedOption = 'full_regenerate';
    const idx = options.indexOf('full_regenerate');
    if (idx > 0) { options.splice(idx, 1); options.unshift('full_regenerate'); }
  } else if (updateContext.changeAnalysis?.recommendedStrategy === 'full') {
    // 有大规模变更，推荐全量更新
    recommendedOption = 'full_regenerate';
  } else if (index.mode === 'quick' && updateContext.productStatus.some(p => p.issues.length > 0)) {
    // quick 模式有健康问题，推荐升级 deep
    recommendedOption = 'upgrade_deep';
  } else {
    // 默认跳过
    recommendedOption = 'skip';
  }

  return {
    hasExistingProducts: true,
    lastMode: index.mode,
    lastRunTime,
    isStale: staleCheck.stale,
    staleReason: staleCheck.reason,
    commitMismatch: staleCheck.reason?.includes('不匹配') ?? false,
    options,
    recommendedOption,
    message,
  };
}

/**
 * 格式化会话恢复提示为用户交互界面
 */
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

  // 显示产物清单
  if (recommendation.hasExistingProducts) {
    lines.push('**产物清单**:');
    // 这里需要从索引获取产物列表
    // 简化处理，显示提示信息
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
    if (label) {
      const isRecommended = option === recommendation.recommendedOption;
      lines.push(`  ${optionIndex}. ${label}${isRecommended ? '（推荐）' : ''} [\`${option}\`]`);
      optionIndex++;
    }
  }

  lines.push('');
  lines.push('请选择选项或直接运行命令：');

  // 显示快捷命令提示
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

/**
 * 格式化产物摘要
 */
export function formatProductSummary(
  firstDir: string,
): string {
  const index = readIndex(firstDir);
  const lines: string[] = [];

  if (!index) {
    return '❌ 未找到产物索引文件';
  }

  lines.push('📋 **00-first 产物摘要**');
  lines.push('');

  lines.push(`- 运行模式: ${index.mode}`);
  lines.push(`- 上次更新: ${index.last_run.slice(0, 19).replace('T', ' ')}`);

  if (index.project_name) {
    lines.push(`- 项目名称: ${index.project_name}`);
  }

  if (index.platform_type) {
    lines.push(`- 端类型: ${index.platform_type}`);
  }

  if (index.git_commit) {
    lines.push(`- Git commit: ${index.git_commit.slice(0, 7)}`);
  }

  if (index.status === 'stale') {
    lines.push(`- ⚠️ 状态: ${index.stale_reason || '过期'}`);
  }

  lines.push('');
  lines.push(`**产物列表** (${Object.keys(index.products).length} 个):`);

  // 按类别分组
  const coreProducts = ['tech-stack.md', 'codebase-overview.md', 'domain-model.md'];
  const apiProducts = ['api-docs.md'];
  const dbProducts = ['database-er.md'];
  const deepProducts = ['call-graph.md', 'architecture.md', 'external-deps.md', 'local-setup.md', 'development-guidelines.md'];
  const metaProducts = ['README.md'];

  const formatProduct = (name: string, entry: ProductIndexEntry) => {
    const date = entry.last_updated ? entry.last_updated.slice(0, 10) : '未知';
    const health = entry.healthy === false ? '⚠️' : '✅';
    return `  ${health} ${name} (更新: ${date})`;
  };

  // Layer 0: quick 模式核心产物
  const quickProductsList = Object.entries(index.products)
    .filter(([name, _]) => coreProducts.includes(name) || apiProducts.includes(name) || dbProducts.includes(name));

  if (quickProductsList.length > 0) {
    lines.push('');
    lines.push('**Layer 0 (quick 模式核心产物)**:');
    for (const [name, entry] of quickProductsList) {
      lines.push(formatProduct(name, entry));
    }
  }

  // Layer 1: deep 模式追加产物
  const deepProductsList = Object.entries(index.products)
    .filter(([name, _]) => deepProducts.includes(name));

  if (deepProductsList.length > 0) {
    lines.push('');
    lines.push('**Layer 1 (deep 模式追加产物)**:');
    for (const [name, entry] of deepProductsList) {
      lines.push(formatProduct(name, entry));
    }
  }

  // 元数据产物
  const metaProductsList = Object.entries(index.products)
    .filter(([name, _]) => metaProducts.includes(name));

  if (metaProductsList.length > 0) {
    lines.push('');
    lines.push('**元数据产物**:');
    for (const [name, entry] of metaProductsList) {
      lines.push(formatProduct(name, entry));
    }
  }

  return lines.join('\n');
}

/**
 * 在产物生成完成后更新索引
 *
 * @param firstDir 产物目录
 * @param params 生成参数
 */
export function updateIndexAfterGeneration(
  firstDir: string,
  params: {
    mode: 'quick' | 'deep';
    platformType?: string;
    projectName?: string;
    gitCommit?: string;
    gitBranch?: string;
    generatedProducts: Array<{
      name: string;
      content: string;
    }>;
  },
): void {
  // 计算文件哈希
  const products = params.generatedProducts.map(p => ({
    name: p.name,
    fileHash: sha256Hex(p.content),
    mode: params.mode,
  }));

  // 读取或创建索引
  let index = readIndex(firstDir);

  if (!index) {
    // 创建新索引
    index = createIndex({
      firstDir,
      mode: params.mode,
      platformType: params.platformType,
      projectName: params.projectName,
      gitCommit: params.gitCommit,
      gitBranch: params.gitBranch,
      products,
    });
  } else {
    // 更新现有索引
    index.last_run = new Date().toISOString();
    index.mode = params.mode;
    index.platform_type = params.platformType;
    index.project_name = params.projectName;
    index.git_commit = params.gitCommit;
    index.git_branch = params.gitBranch;
    index.status = 'current';
    delete index.stale_reason;

    // 更新产品条目
    for (const product of products) {
      index.products[product.name] = {
        mode: product.mode,
        last_updated: new Date().toISOString(),
        file_hash: product.fileHash,
        healthy: true,
      };
    }
  }

  writeIndex(firstDir, index);
}

/**
 * 检查索引是否过期（辅助函数）
 */
function checkIndexStale(
  index: ProductIndex,
  currentCommit?: string,
): { stale: boolean; reason?: string } {
  const now = Date.now();
  const lastRunTime = new Date(index.last_run).getTime();
  const daysSinceLastRun = (now - lastRunTime) / (1000 * 60 * 60 * 24);

  if (daysSinceLastRun > STALE_DAYS) {
    return {
      stale: true,
      reason: `产物已过期（距今 ${Math.floor(daysSinceLastRun)} 天）`,
    };
  }

  if (currentCommit && index.git_commit && index.git_commit !== currentCommit) {
    return {
      stale: true,
      reason: `Git commit 不匹配（产物: ${index.git_commit.slice(0, 7)}, 当前: ${currentCommit.slice(0, 7)}）`,
    };
  }

  return { stale: false };
}
