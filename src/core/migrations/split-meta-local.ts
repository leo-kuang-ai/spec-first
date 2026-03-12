/**
 * meta/local 分离迁移脚本
 * 将现有 .spec-first/ 内容拆分为 meta/（包级基线）和 local/（用户定制）
 *
 * 包级文件 → meta/
 * 用户定制 → local/
 * 不确定的文件 → local/（保守策略，用户可手动调整）
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { ensureDir } from '../../shared/fs-utils.js';

export interface FileClassification {
  path: string; // 相对于 .spec-first/ 的路径
  type: 'meta' | 'local' | 'skip';
  reason: string;
}

export interface MigrationReport {
  timestamp: string;
  totalFiles: number;
  classified: {
    meta: number;
    local: number;
    skip: number;
  };
  files: FileClassification[];
}

/**
 * 包级基线文件列表（已知由 spec-first 包管理的文件）
 * 这些文件应该迁移到 meta/ 目录
 */
const PACKAGE_BASELINE_FILES = new Set([
  // 由 update 命令管理的配置
  'config.yaml',
  // 示例：未来可能有更多包级文件
  // 'layer2/example.yaml',
]);

/**
 * 用户定制文件模式（正则表达式）
 * 匹配这些模式的文件被视为用户定制，应迁移到 local/
 */
const USER_CUSTOM_PATTERNS = [
  /^layer2\/.+\.yaml$/, // 用户添加的平台 YAML
  /^extensions\/.+/, // 用户安装的扩展
  /^local\//, // 已有的 local 目录（保持不变）
  /^meta\//, // 已有的 meta 目录（保持不变）
];

/**
 * 分类单个文件
 */
function classifyFile(relativePath: string): FileClassification['type'] {
  const fileName = basename(relativePath);

  // 跳过目录本身和特殊文件
  if (relativePath === '' || relativePath === '.' || fileName === 'current') {
    return 'skip';
  }

  // 已在 meta/local 目录中的文件，跳过
  if (relativePath.startsWith('meta/') || relativePath.startsWith('local/')) {
    return 'skip';
  }

  // 检查是否为包级基线文件
  if (PACKAGE_BASELINE_FILES.has(relativePath)) {
    return 'meta';
  }

  // 检查用户定制模式
  for (const pattern of USER_CUSTOM_PATTERNS) {
    if (pattern.test(relativePath)) {
      return 'local';
    }
  }

  // 默认保守策略：不确定的文件视为用户定制
  return 'local';
}

/**
 * 递归扫描目录中的所有文件
 */
function scanDirectory(dirPath: string, baseDir: string): string[] {
  const files: string[] = [];

  if (!existsSync(dirPath)) return files;

  const entries = readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    const relativePath = fullPath.slice(baseDir.length + 1);

    if (entry.isDirectory()) {
      files.push(...scanDirectory(fullPath, baseDir));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }

  return files;
}

/**
 * 迁移文件到目标目录
 */
function moveFile(sourcePath: string, targetPath: string): { success: boolean; error?: string } {
  try {
    const content = readFileSync(sourcePath, 'binary');

    // 确保目标目录存在
    ensureDir(dirname(targetPath));

    // 写入文件
    writeFileSync(targetPath, content, 'binary');

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * 执行 meta/local 分离迁移
 * @param projectRoot 项目根目录
 * @param dryRun 预演模式，不实际写入文件
 * @returns 迁移报告
 */
export function splitMetaLocal(projectRoot: string, dryRun = false): MigrationReport {
  const specFirstDir = join(projectRoot, '.spec-first');

  if (!existsSync(specFirstDir)) {
    return {
      timestamp: new Date().toISOString(),
      totalFiles: 0,
      classified: { meta: 0, local: 0, skip: 0 },
      files: [],
    };
  }

  const files = scanDirectory(specFirstDir, specFirstDir);
  const classifications: FileClassification[] = [];

  // 分类所有文件
  for (const filePath of files) {
    const type = classifyFile(filePath);
    let reason = '';

    switch (type) {
      case 'meta':
        reason = '包级基线文件';
        break;
      case 'local':
        reason = PACKAGE_BASELINE_FILES.has(filePath) ? '包级文件但已被用户修改' : '用户定制文件';
        break;
      case 'skip':
        reason = '无需迁移';
        break;
    }

    classifications.push({
      path: filePath,
      type,
      reason,
    });
  }

  // 统计
  const stats = {
    meta: classifications.filter((c) => c.type === 'meta').length,
    local: classifications.filter((c) => c.type === 'local').length,
    skip: classifications.filter((c) => c.type === 'skip').length,
  };

  // 实际迁移（非 dry-run 时）
  if (!dryRun) {
    const metaDir = join(specFirstDir, 'meta');
    const localDir = join(specFirstDir, 'local');

    for (const classification of classifications) {
      if (classification.type === 'skip') continue;

      const sourcePath = join(specFirstDir, classification.path);
      const targetDir = classification.type === 'meta' ? metaDir : localDir;
      const targetPath = join(targetDir, classification.path);

      const result = moveFile(sourcePath, targetPath);
      if (!result.success) {
        classification.reason += ` [迁移失败: ${result.error}]`;
      }
    }
  }

  return {
    timestamp: new Date().toISOString(),
    totalFiles: files.length,
    classified: stats,
    files: classifications,
  };
}

/**
 * 格式化迁移报告为可读文本
 */
export function formatMigrationReport(report: MigrationReport): string {
  const lines: string[] = [];
  lines.push('=== meta/local 分离迁移报告 ===');
  lines.push(`时间: ${report.timestamp}`);
  lines.push(`总文件数: ${report.totalFiles}`);
  lines.push('');
  lines.push('分类统计:');
  lines.push(`  meta (包级基线): ${report.classified.meta}`);
  lines.push(`  local (用户定制): ${report.classified.local}`);
  lines.push(`  skip (无需迁移): ${report.classified.skip}`);
  lines.push('');
  lines.push('文件详情:');

  for (const file of report.files) {
    if (file.type === 'skip') continue;
    const icon = file.type === 'meta' ? '📦' : '👤';
    lines.push(`  ${icon} ${file.path} -> ${file.type}/ (${file.reason})`);
  }

  return lines.join('\n');
}
