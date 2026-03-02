/**
 * First Skill 产物索引管理
 *
 * 功能:
 * - 读写 .index.yaml 文件
 * - 产物状态查询
 * - 索引文件版本管理
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { load as yamlLoad, dump as yamlDump } from 'js-yaml';
import { logFirstRuntimeWarning } from './first-runtime-observability.js';

// ========== 类型定义 ==========

/** 产物索引条目 */
export interface ProductIndexEntry {
  /** 产物模式 */
  mode: 'quick' | 'deep';
  /** 最后更新时间 (ISO 8601) */
  last_updated: string;
  /** 文件 SHA256 哈希 */
  file_hash: string;
  /** 是否健康 */
  healthy?: boolean;
  /** 健康问题 */
  issues?: string[];
}

/** 产物索引文件结构 */
export interface ProductIndex {
  /** 索引版本 */
  version: string;
  /** 最后运行时间 (ISO 8601) */
  last_run: string;
  /** 运行模式 */
  mode: 'quick' | 'deep';
  /** 端类型 */
  platform_type?: string;
  /** 项目名称 */
  project_name?: string;
  /** Git commit */
  git_commit?: string;
  /** Git 分支 */
  git_branch?: string;
  /** 产物列表 */
  products: Record<string, ProductIndexEntry>;
  /** 索引状态 */
  status?: 'current' | 'stale';
  /** 过期原因 */
  stale_reason?: string;
}

/** 索引文件路径 */
export const INDEX_FILE_NAME = '.index.yaml';

/** 索引版本 */
export const INDEX_VERSION = '1.0.0';

// ========== 工具函数 ==========

/**
 * 获取索引文件路径
 */
export function getIndexFilePath(firstDir: string): string {
  return join(firstDir, INDEX_FILE_NAME);
}

/**
 * 检查索引文件是否存在
 */
export function indexExists(firstDir: string): boolean {
  return existsSync(getIndexFilePath(firstDir));
}

/**
 * 读取产物索引
 */
export function readIndex(firstDir: string): ProductIndex | null {
  const indexPath = getIndexFilePath(firstDir);

  if (!existsSync(indexPath)) {
    return null;
  }

  try {
    const content = readFileSync(indexPath, 'utf-8');
    const index = yamlLoad(content) as ProductIndex;
    return index;
  } catch (error) {
    logFirstRuntimeWarning('first-index.readIndex', `读取索引失败: ${indexPath}`, error);
    return null;
  }
}

/**
 * 写入产物索引
 */
export function writeIndex(firstDir: string, index: ProductIndex): void {
  const indexPath = getIndexFilePath(firstDir);

  // 确保目录存在
  if (!existsSync(firstDir)) {
    mkdirSync(firstDir, { recursive: true });
  }

  const content = yamlDump(index);
  writeFileSync(indexPath, content, 'utf-8');
}

/**
 * 创建新的产物索引并写入文件
 */
export function createIndex(params: {
  firstDir: string;
  mode: 'quick' | 'deep';
  platformType?: string;
  projectName?: string;
  gitCommit?: string;
  gitBranch?: string;
  products?: Array<{ name: string; fileHash: string; mode: 'quick' | 'deep' }>;
}): ProductIndex {
  const now = new Date().toISOString();

  const products: Record<string, ProductIndexEntry> = {};

  if (params.products) {
    for (const product of params.products) {
      products[product.name] = {
        mode: product.mode,
        last_updated: now,
        file_hash: product.fileHash,
        healthy: true,
      };
    }
  }

  const index: ProductIndex = {
    version: INDEX_VERSION,
    last_run: now,
    mode: params.mode,
    platform_type: params.platformType,
    project_name: params.projectName,
    git_commit: params.gitCommit,
    git_branch: params.gitBranch,
    products,
    status: 'current',
  };

  // 写入文件
  writeIndex(params.firstDir, index);

  return index;
}

/**
 * 更新索引中的单个产物
 */
export function updateProductInIndex(
  firstDir: string,
  productName: string,
  updates: Partial<ProductIndexEntry>,
): ProductIndex | null {
  const index = readIndex(firstDir);

  if (!index) {
    return null;
  }

  if (!index.products[productName]) {
    // 新产物条目
    index.products[productName] = {
      mode: index.mode,
      last_updated: new Date().toISOString(),
      file_hash: '',
    };
  }

  // 更新字段
  Object.assign(index.products[productName], updates);

  // 更新 last_run 时间
  index.last_run = new Date().toISOString();

  // 写回文件
  writeIndex(firstDir, index);

  return index;
}

/**
 * 获取产物的索引条目
 */
export function getProductEntry(
  firstDir: string,
  productName: string,
): ProductIndexEntry | null {
  const index = readIndex(firstDir);

  if (!index || !index.products[productName]) {
    return null;
  }

  return index.products[productName];
}

/**
 * 列出所有已索引的产物
 */
export function listIndexedProducts(firstDir: string): string[] {
  const index = readIndex(firstDir);

  if (!index) {
    return [];
  }

  return Object.keys(index.products);
}

/**
 * 检查索引是否过期
 */
export function isIndexStale(index: ProductIndex, currentCommit?: string): {
  stale: boolean;
  reason?: string;
} {
  const STALE_DAYS = 7;
  const now = Date.now();

  // 检查时间过期（7 天）
  const lastRunTime = new Date(index.last_run).getTime();
  const daysSinceLastRun = (now - lastRunTime) / (1000 * 60 * 60 * 24);

  if (daysSinceLastRun > STALE_DAYS) {
    return {
      stale: true,
      reason: `索引已过期（距今 ${Math.floor(daysSinceLastRun)} 天）`,
    };
  }

  // 检查 Git commit 匹配
  if (currentCommit && index.git_commit && index.git_commit !== currentCommit) {
    return {
      stale: true,
      reason: `Git commit 不匹配（索引: ${index.git_commit.slice(0, 7)}, 当前: ${currentCommit.slice(0, 7)}）`,
    };
  }

  return { stale: false };
}

/**
 * 标记索引为过期
 */
export function markIndexStale(
  firstDir: string,
  reason: string,
): ProductIndex | null {
  const index = readIndex(firstDir);

  if (!index) {
    return null;
  }

  index.status = 'stale';
  index.stale_reason = reason;

  writeIndex(firstDir, index);

  return index;
}

/**
 * 清除过期标记
 */
export function clearStaleMark(firstDir: string): ProductIndex | null {
  const index = readIndex(firstDir);

  if (!index) {
    return null;
  }

  index.status = 'current';
  delete index.stale_reason;

  writeIndex(firstDir, index);

  return index;
}

/**
 * 删除索引文件
 */
export function deleteIndex(firstDir: string): boolean {
  const indexPath = getIndexFilePath(firstDir);

  if (!existsSync(indexPath)) {
    return false;
  }

  try {
    unlinkSync(indexPath);
    return true;
  } catch (error) {
    logFirstRuntimeWarning('first-index.deleteIndex', `删除索引失败: ${indexPath}`, error);
    return false;
  }
}

/**
 * 同步索引与实际产物文件
 *
 * 扫描 docs/first/ 目录，更新索引以反映实际存在的产物
 */
export function syncIndex(firstDir: string): ProductIndex | null {
  const index = readIndex(firstDir);

  if (!index) {
    return null;
  }

  // TODO: 实现扫描目录并更新索引的逻辑
  // 这里需要:
  // 1. 扫描 firstDir 目录下的 .md 文件
  // 2. 对比 index.products 和实际文件
  // 3. 添加新产物，移除不存在产物的条目
  // 4. 更新索引文件

  return index;
}

/**
 * 格式化索引信息为用户可读的摘要
 */
export function formatIndexSummary(index: ProductIndex): string {
  const lines: string[] = [];

  lines.push('📋 **产物索引摘要**');
  lines.push('');

  lines.push(`- 运行模式: ${index.mode}`);
  lines.push(`- 上次运行: ${index.last_run.slice(0, 19).replace('T', ' ')}`);

  if (index.platform_type) {
    lines.push(`- 端类型: ${index.platform_type}`);
  }

  if (index.project_name) {
    lines.push(`- 项目名称: ${index.project_name}`);
  }

  if (index.git_commit) {
    lines.push(`- Git commit: ${index.git_commit.slice(0, 7)}`);
  }

  if (index.git_branch) {
    lines.push(`- Git 分支: ${index.git_branch}`);
  }

  if (index.status === 'stale') {
    lines.push(`- ⚠️ 状态: 过期 (${index.stale_reason})`);
  }

  lines.push('');
  lines.push(`**产物列表** (${Object.keys(index.products).length} 个):`);

  // 按模式分组显示
  const quickProducts = Object.entries(index.products)
    .filter(([_, entry]) => entry.mode === 'quick')
    .map(([name, _]) => name);
  const deepProducts = Object.entries(index.products)
    .filter(([_, entry]) => entry.mode === 'deep')
    .map(([name, _]) => name);

  if (quickProducts.length > 0) {
    lines.push('');
    lines.push('**Quick 模式产物**:');
    for (const name of quickProducts) {
      lines.push(`  - ${name}`);
    }
  }

  if (deepProducts.length > 0) {
    lines.push('');
    lines.push('**Deep 模式产物**:');
    for (const name of deepProducts) {
      lines.push(`  - ${name}`);
    }
  }

  return lines.join('\n');
}
