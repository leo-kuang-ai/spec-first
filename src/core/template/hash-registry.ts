/**
 * 模板哈希注册表管理
 * 用于跟踪模板文件的 SHA256 哈希值，支持变更检测和分级更新
 */
import { join } from 'node:path';
import { readFile, writeFile, readdir, stat, mkdir, access } from 'node:fs/promises';
import { sha256Hex } from '../../shared/crypto-utils.js';
import { classifyTemplateLevel } from './template-level-classifier.js';

// ─── 类型定义 ───────────────────────────────────────────

/** 单个模板的哈希记录 */
export interface TemplateHashEntry {
  hash: string;
  level: 'Minor' | 'Major' | 'Critical';
  lastModified: string; // ISO 8601 timestamp
}

/** 哈希注册表结构 */
export interface TemplateHashRegistry {
  version: string;
  generated: string;
  templates: Record<string, TemplateHashEntry>;
}

/** 哈希变更记录 */
export interface HashChange {
  template: string;
  oldHash: string | null;
  newHash: string | null;
  level: 'Minor' | 'Major' | 'Critical';
  changeType: 'added' | 'modified' | 'deleted' | 'unchanged';
}

/** 哈希比对结果 */
export interface HashDiffResult {
  added: HashChange[];
  modified: HashChange[];
  deleted: HashChange[];
  unchanged: HashChange[];
}

// ─── 核心函数 ───────────────────────────────────────────

/**
 * 计算目录下所有模板文件的哈希值
 * @param dir 模板目录路径（绝对路径）
 * @param baseDir 基础目录，用于计算相对路径
 * @returns 模板名 -> 哈希条目的映射
 */
export async function computeTemplateHashes(
  dir: string,
  _baseDir: string,
): Promise<Record<string, TemplateHashEntry>> {
  const hashes: Record<string, TemplateHashEntry> = {};

  try {
    await access(dir);
  } catch {
    return hashes;
  }

  const traverse = async (currentDir: string, relativePath: string): Promise<void> => {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      const relPath = join(relativePath, entry.name);

      if (entry.isDirectory()) {
        await traverse(fullPath, relPath);
      } else if (entry.isFile() && entry.name.endsWith('.hbs')) {
        try {
          const content = await readFile(fullPath, 'utf-8');
          const stats = await stat(fullPath);
          const templateName = relPath.replace(/\.hbs$/, '');

          hashes[templateName] = {
            hash: sha256Hex(content),
            level: classifyTemplateLevel(templateName),
            lastModified: stats.mtime.toISOString(),
          };
        } catch {
          // 跳过无法读取的文件
        }
      }
    }
  };

  await traverse(dir, '');
  return hashes;
}

/**
 * 加载哈希注册表
 * @param projectRoot 项目根目录
 * @returns 注册表对象，不存在时返回空注册表
 */
export async function loadHashRegistry(projectRoot: string): Promise<TemplateHashRegistry> {
  const registryPath = join(projectRoot, '.spec-first', 'meta', 'template-hashes.json');

  try {
    const content = await readFile(registryPath, 'utf-8');
    return JSON.parse(content) as TemplateHashRegistry;
  } catch {
    return {
      version: '1.0.0',
      generated: new Date().toISOString(),
      templates: {},
    };
  }
}

/**
 * 保存哈希注册表
 * @param registry 注册表对象
 * @param projectRoot 项目根目录
 */
export async function saveHashRegistry(registry: TemplateHashRegistry, projectRoot: string): Promise<void> {
  const registryPath = join(projectRoot, '.spec-first', 'meta', 'template-hashes.json');
  const metaDir = join(projectRoot, '.spec-first', 'meta');
  await mkdir(metaDir, { recursive: true });

  registry.generated = new Date().toISOString();
  await writeFile(registryPath, JSON.stringify(registry, null, 2), 'utf-8');
}

/**
 * 比对两个哈希注册表的差异
 * @param oldRegistry 旧注册表
 * @param newRegistry 新注册表
 * @returns 差异结果
 */
export function compareHashes(
  oldRegistry: TemplateHashRegistry,
  newRegistry: TemplateHashRegistry,
): HashDiffResult {
  const oldTemplates = new Set(Object.keys(oldRegistry.templates));
  const newTemplates = new Set(Object.keys(newRegistry.templates));

  const added: HashChange[] = [];
  const modified: HashChange[] = [];
  const deleted: HashChange[] = [];
  const unchanged: HashChange[] = [];

  // 检测新增和修改的模板
  for (const template of newTemplates) {
    const newEntry = newRegistry.templates[template];
    const oldEntry = oldRegistry.templates[template];

    if (!oldEntry) {
      // 新增
      added.push({
        template,
        oldHash: null,
        newHash: newEntry.hash,
        level: newEntry.level,
        changeType: 'added',
      });
    } else if (oldEntry.hash !== newEntry.hash) {
      // 修改
      modified.push({
        template,
        oldHash: oldEntry.hash,
        newHash: newEntry.hash,
        level: newEntry.level,
        changeType: 'modified',
      });
    } else {
      // 未变化
      unchanged.push({
        template,
        oldHash: oldEntry.hash,
        newHash: newEntry.hash,
        level: newEntry.level,
        changeType: 'unchanged',
      });
    }
  }

  // 检测删除的模板
  for (const template of oldTemplates) {
    if (!newTemplates.has(template)) {
      const oldEntry = oldRegistry.templates[template];
      deleted.push({
        template,
        oldHash: oldEntry.hash,
        newHash: null,
        level: oldEntry.level,
        changeType: 'deleted',
      });
    }
  }

  return { added, modified, deleted, unchanged };
}

/**
 * 获取所有发生变化的模板（新增 + 修改 + 删除）
 */
export function getChangedTemplates(diff: HashDiffResult): HashChange[] {
  return [...diff.added, ...diff.modified, ...diff.deleted];
}
