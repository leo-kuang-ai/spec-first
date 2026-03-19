/**
 * Manifest 加载与校验
 * 加载 YAML 格式的迁移清单，校验其结构完整性
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { exists } from '../../shared/fs-utils.js';
import yaml from 'js-yaml';
import type { MigrationManifest, ValidationResult, VersionRange } from './manifest-schema.js';

// ─── 常量定义 ───────────────────────────────────────────

/** 支持的清单 schema 版本 */
const SUPPORTED_SCHEMA_VERSIONS = ['1.0'];

/** 清单文件扩展名 */
const MANIFEST_EXTENSIONS = ['.yaml', '.yml'];

// ─── 核心函数 ───────────────────────────────────────────

/**
 * 加载单个迁移清单
 * @param path 清单文件路径（绝对路径）
 * @returns 迁移清单对象
 * @throws 文件不存在、格式错误或 schema 版本不支持
 */
export function loadManifest(path: string): MigrationManifest {
  if (!exists(path)) {
    throw new Error(`清单文件不存在：${path}`);
  }

  const raw = readFileSync(path, 'utf-8');
  const parsed = yaml.load(raw, { schema: yaml.JSON_SCHEMA });

  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`清单文件格式错误：${path}`);
  }

  const manifest = parsed as Record<string, unknown>;

  // 校验 schema 版本
  const schemaVersion = manifest.schemaVersion;
  if (typeof schemaVersion !== 'string' || !SUPPORTED_SCHEMA_VERSIONS.includes(schemaVersion)) {
    throw new Error(
      `不支持的清单 schema 版本：${schemaVersion}（支持：${SUPPORTED_SCHEMA_VERSIONS.join(', ')}）`
    );
  }

  // 校验必需字段
  if (!manifest.versionRange || typeof manifest.versionRange !== 'object') {
    throw new Error(`清单缺少 versionRange 字段：${path}`);
  }
  if (!manifest.description || typeof manifest.description !== 'string') {
    throw new Error(`清单缺少 description 字段：${path}`);
  }
  if (!Array.isArray(manifest.steps)) {
    throw new Error(`清单缺少 steps 数组：${path}`);
  }

  return manifest as unknown as MigrationManifest;
}

/**
 * 校验清单结构完整性
 * @param manifest 迁移清单
 * @returns 校验结果
 */
export function validateManifest(manifest: MigrationManifest): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 校验 schema 版本
  if (!SUPPORTED_SCHEMA_VERSIONS.includes(manifest.schemaVersion)) {
    errors.push(`不支持的 schema 版本：${manifest.schemaVersion}`);
  }

  // 校验版本区间
  const versionRangeErrors = validateVersionRange(manifest.versionRange);
  errors.push(...versionRangeErrors);

  // 校验步骤
  if (!Array.isArray(manifest.steps) || manifest.steps.length === 0) {
    errors.push('清单必须包含至少一个迁移步骤');
  } else {
    manifest.steps.forEach((step, index) => {
      const stepErrors = validateStep(step, index);
      errors.push(...stepErrors);
    });
  }

  // 校验冲突策略
  if (manifest.defaultConflictStrategy) {
    const validStrategies: readonly string[] = ['skip', 'overwrite', 'abort', 'prompt'];
    if (!validStrategies.includes(manifest.defaultConflictStrategy as string)) {
      errors.push(`无效的默认冲突策略：${manifest.defaultConflictStrategy}`);
    }
  }

  // 校验前置条件
  if (manifest.prerequisites) {
    if (!Array.isArray(manifest.prerequisites)) {
      errors.push('prerequisites 必须是数组');
    } else {
      manifest.prerequisites.forEach((prereq, index) => {
        if (typeof prereq !== 'string') {
          errors.push(`prerequisites[${index}] 必须是字符串路径`);
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 校验版本区间
 */
function validateVersionRange(range: VersionRange): string[] {
  const errors: string[] = [];

  if (!range.from || typeof range.from !== 'string') {
    errors.push('versionRange.from 必须是非空字符串');
  }
  if (!range.to || typeof range.to !== 'string') {
    errors.push('versionRange.to 必须是非空字符串');
  }

  // 校验版本格式（简化版 semver 校验）
  const versionPattern = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/;
  if (range.from && !versionPattern.test(range.from)) {
    errors.push(`versionRange.from 格式无效（应为 semver）：${range.from}`);
  }
  if (range.to && !versionPattern.test(range.to)) {
    errors.push(`versionRange.to 格式无效（应为 semver）：${range.to}`);
  }

  return errors;
}

/**
 * 校验单个步骤
 */
function validateStep(step: unknown, index: number): string[] {
  const errors: string[] = [];

  if (!step || typeof step !== 'object') {
    errors.push(`steps[${index}] 必须是对象`);
    return errors;
  }

  const stepObj = step as Record<string, unknown>;

  if (!stepObj.type || typeof stepObj.type !== 'string') {
    errors.push(`steps[${index}] 缺少 type 字段`);
    return errors;
  }

  const type = stepObj.type;

  switch (type) {
    case 'mkdir':
      if (!stepObj.path || typeof stepObj.path !== 'string') {
        errors.push(`steps[${index}].type=mkdir 缺少 path 字段`);
      }
      break;

    case 'rename':
      if (!stepObj.from || typeof stepObj.from !== 'string') {
        errors.push(`steps[${index}].type=rename 缺少 from 字段`);
      }
      if (!stepObj.to || typeof stepObj.to !== 'string') {
        errors.push(`steps[${index}].type=rename 缺少 to 字段`);
      }
      break;

    case 'delete':
      if (!stepObj.path || typeof stepObj.path !== 'string') {
        errors.push(`steps[${index}].type=delete 缺少 path 字段`);
      }
      break;

    case 'copy':
      if (!stepObj.from || typeof stepObj.from !== 'string') {
        errors.push(`steps[${index}].type=copy 缺少 from 字段`);
      }
      if (!stepObj.to || typeof stepObj.to !== 'string') {
        errors.push(`steps[${index}].type=copy 缺少 to 字段`);
      }
      break;

    case 'patch':
      if (!stepObj.file || typeof stepObj.file !== 'string') {
        errors.push(`steps[${index}].type=patch 缺少 file 字段`);
      }
      if (!stepObj.patch || typeof stepObj.patch !== 'object') {
        errors.push(`steps[${index}].type=patch 缺少 patch 字段`);
      }
      break;

    case 'execute':
      if (!stepObj.command || typeof stepObj.command !== 'string') {
        errors.push(`steps[${index}].type=execute 缺少 command 字段`);
      }
      break;

    default:
      errors.push(
        `steps[${index}] 无效的 type：${type}（支持：mkdir, rename, delete, copy, patch, execute）`
      );
  }

  return errors;
}

/**
 * 列出项目中所有迁移清单
 * @param projectRoot 项目根目录
 * @returns 清单数组，按版本范围排序
 */
export function listManifests(
  projectRoot: string
): Array<{ path: string; manifest: MigrationManifest }> {
  const manifestsDir = join(projectRoot, 'templates', 'migrations');

  if (!exists(manifestsDir)) {
    return [];
  }

  const entries = readdirSync(manifestsDir, { withFileTypes: true });
  const results: Array<{ path: string; manifest: MigrationManifest }> = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const ext = entry.name.substring(entry.name.lastIndexOf('.'));
    if (!MANIFEST_EXTENSIONS.includes(ext)) continue;

    const fullPath = join(manifestsDir, entry.name);

    try {
      const manifest = loadManifest(fullPath);
      results.push({ path: fullPath, manifest });
    } catch {
      // 跳过无法加载的清单
    }
  }

  // 按 from 版本排序
  results.sort((a, b) => {
    return a.manifest.versionRange.from.localeCompare(b.manifest.versionRange.from, undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  });

  return results;
}

/**
 * 查找适用于当前版本的清单
 * @param currentVersion 当前版本
 * @param projectRoot 项目根目录
 * @returns 匹配的清单，如果没有则返回 null
 */
export function findManifestForVersion(
  currentVersion: string,
  projectRoot: string
): { path: string; manifest: MigrationManifest } | null {
  const manifests = listManifests(projectRoot);

  for (const { path, manifest } of manifests) {
    if (matchesVersionRange(currentVersion, manifest.versionRange)) {
      return { path, manifest };
    }
  }

  return null;
}

/**
 * 判断版本是否在版本区间内
 * @param version 当前版本
 * @param range 版本区间
 * @returns 是否匹配
 */
function matchesVersionRange(version: string, range: VersionRange): boolean {
  const compare = (a: string, b: string): number => {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  };

  const fromCmp = compare(version, range.from);
  const toCmp = compare(version, range.to);

  // 检查 from 边界
  const passesFrom = range.fromInclusive ? fromCmp >= 0 : fromCmp > 0;

  // 检查 to 边界
  const passesTo = range.toInclusive ? toCmp <= 0 : toCmp < 0;

  return passesFrom && passesTo;
}
