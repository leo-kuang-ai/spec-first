/**
 * Manifest 迁移执行引擎
 * 执行迁移清单中的各个步骤
 */
import {
  existsSync,
  mkdirSync,
  renameSync,
  rmSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import yaml from 'js-yaml';
import { execSync } from 'node:child_process';
import { ensureDir } from '../../shared/fs-utils.js';
import type {
  MigrationManifest,
  MigrationStep,
  StepResult,
  ExecutionResult,
} from './manifest-schema.js';
import { ConflictStrategy } from './manifest-schema.js';
import {
  isMkdirStep,
  isRenameStep,
  isDeleteStep,
  isCopyStep,
  isPatchStep,
  isExecuteStep,
} from './manifest-schema.js';

// ─── 路径安全校验 ───────────────────────────────────────────

/**
 * 解析相对路径并校验不逃逸 projectRoot
 * SEC-002: 防止路径遍历攻击（../../../etc/passwd）
 */
function resolveSafePath(projectRoot: string, relativePath: string): string {
  const root = resolve(projectRoot);
  const target = resolve(root, relativePath);
  if (!target.startsWith(root + '/') && target !== root) {
    throw new Error(`路径遍历被拒绝：${relativePath} 逃逸了项目根目录`);
  }
  return target;
}

// ─── 步骤执行 ───────────────────────────────────────────

/**
 * 执行单个迁移步骤
 */
export function executeStep(
  step: MigrationStep,
  projectRoot: string,
  conflictStrategy: ConflictStrategy = ConflictStrategy.Skip
): StepResult {
  try {
    if (isMkdirStep(step)) {
      return executeMkdir(step, projectRoot);
    } else if (isRenameStep(step)) {
      return executeRename(step, projectRoot, conflictStrategy);
    } else if (isDeleteStep(step)) {
      return executeDelete(step, projectRoot);
    } else if (isCopyStep(step)) {
      return executeCopy(step, projectRoot, conflictStrategy);
    } else if (isPatchStep(step)) {
      return executePatch(step, projectRoot, conflictStrategy);
    } else if (isExecuteStep(step)) {
      return executeCommand(step, projectRoot);
    } else {
      return {
        step,
        success: false,
        message: `未知的步骤类型：${(step as { type: string }).type}`,
      };
    }
  } catch (err) {
    return {
      step,
      success: false,
      message: err instanceof Error ? err.message : String(err),
      error: err as Error,
    };
  }
}

/**
 * 执行 mkdir 步骤
 */
function executeMkdir(step: MigrationStep, projectRoot: string): StepResult {
  if (!isMkdirStep(step)) throw new Error('Invalid step type');

  const targetPath = resolveSafePath(projectRoot, step.path);

  if (existsSync(targetPath)) {
    return {
      step,
      success: true,
      message: `目录已存在，跳过：${step.path}`,
    };
  }

  mkdirSync(targetPath, { recursive: true, mode: step.mode ?? 0o755 });

  return {
    step,
    success: true,
    message: `创建目录：${step.path}`,
  };
}

/**
 * 执行 rename 步骤
 */
function executeRename(
  step: MigrationStep,
  projectRoot: string,
  conflictStrategy: ConflictStrategy
): StepResult {
  if (!isRenameStep(step)) throw new Error('Invalid step type');

  const fromPath = resolveSafePath(projectRoot, step.from);
  const toPath = resolveSafePath(projectRoot, step.to);

  if (!existsSync(fromPath)) {
    return {
      step,
      success: false,
      message: `源文件不存在：${step.from}`,
    };
  }

  if (existsSync(toPath)) {
    if (step.overwrite === true) {
      // 删除目标后重命名
      rmSync(toPath, { recursive: true });
    } else {
      switch (conflictStrategy) {
        case ConflictStrategy.Skip:
          return {
            step,
            success: true,
            message: `目标已存在，跳过：${step.to}`,
          };
        case ConflictStrategy.Overwrite:
          rmSync(toPath, { recursive: true });
          break;
        case ConflictStrategy.Abort:
          return {
            step,
            success: false,
            message: `目标已存在，中止：${step.to}`,
          };
        case ConflictStrategy.Prompt:
          // 暂不支持交互式提示，默认跳过
          return {
            step,
            success: true,
            message: `目标已存在，跳过（Prompt 模式暂不支持自动执行）：${step.to}`,
          };
      }
    }
  }

  // 确保目标目录存在
  ensureDir(dirname(toPath));

  renameSync(fromPath, toPath);

  return {
    step,
    success: true,
    message: `重命名：${step.from} -> ${step.to}`,
  };
}

/**
 * 执行 delete 步骤
 */
function executeDelete(step: MigrationStep, projectRoot: string): StepResult {
  if (!isDeleteStep(step)) throw new Error('Invalid step type');

  const targetPath = resolveSafePath(projectRoot, step.path);

  if (!existsSync(targetPath)) {
    return {
      step,
      success: true,
      message: `文件不存在，跳过删除：${step.path}`,
    };
  }

  rmSync(targetPath, { recursive: step.recursive ?? true, force: true });

  return {
    step,
    success: true,
    message: `删除：${step.path}`,
  };
}

/**
 * 执行 copy 步骤
 */
function executeCopy(
  step: MigrationStep,
  projectRoot: string,
  conflictStrategy: ConflictStrategy
): StepResult {
  if (!isCopyStep(step)) throw new Error('Invalid step type');

  const fromPath = resolveSafePath(projectRoot, step.from);
  const toPath = resolveSafePath(projectRoot, step.to);

  if (!existsSync(fromPath)) {
    return {
      step,
      success: false,
      message: `源文件不存在：${step.from}`,
    };
  }

  if (existsSync(toPath)) {
    if (step.overwrite === true) {
      // 删除目标后复制
      rmSync(toPath, { recursive: true });
    } else {
      switch (conflictStrategy) {
        case ConflictStrategy.Skip:
          return {
            step,
            success: true,
            message: `目标已存在，跳过：${step.to}`,
          };
        case ConflictStrategy.Overwrite:
          rmSync(toPath, { recursive: true });
          break;
        case ConflictStrategy.Abort:
          return {
            step,
            success: false,
            message: `目标已存在，中止：${step.to}`,
          };
        case ConflictStrategy.Prompt:
          return {
            step,
            success: true,
            message: `目标已存在，跳过（Prompt 模式暂不支持自动执行）：${step.to}`,
          };
      }
    }
  }

  // 确保目标目录存在
  ensureDir(dirname(toPath));

  // 根据是否是目录选择复制方式
  const statResult = statSync(fromPath);
  if (statResult.isDirectory() && step.recursive !== false) {
    copyDirectory(fromPath, toPath);
  } else {
    copyFileSync(fromPath, toPath);
  }

  return {
    step,
    success: true,
    message: `复制：${step.from} -> ${step.to}`,
  };
}

/**
 * 递归复制目录
 */
function copyDirectory(source: string, target: string): void {
  ensureDir(target);

  const entries = readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(source, entry.name);
    const tgtPath = join(target, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, tgtPath);
    } else {
      copyFileSync(srcPath, tgtPath);
    }
  }
}

/**
 * 执行 patch 步骤
 */
function executePatch(
  step: MigrationStep,
  projectRoot: string,
  _conflictStrategy: ConflictStrategy
): StepResult {
  if (!isPatchStep(step)) throw new Error('Invalid step type');

  const filePath = resolveSafePath(projectRoot, step.file);

  if (!existsSync(filePath)) {
    return {
      step,
      success: false,
      message: `目标文件不存在：${step.file}`,
    };
  }

  const content = readFileSync(filePath, 'utf-8');
  let data: unknown;

  try {
    data = JSON.parse(content);
  } catch {
    try {
      data = yaml.load(content, { schema: yaml.JSON_SCHEMA }) as unknown;
    } catch {
      return {
        step,
        success: false,
        message: `无法解析文件（非 JSON/YAML）：${step.file}`,
      };
    }
  }

  if (typeof data !== 'object' || data === null) {
    return {
      step,
      success: false,
      message: `文件内容不是对象类型：${step.file}`,
    };
  }

  // 合并或替换
  const result =
    step.mergeStrategy === 'replace'
      ? step.patch
      : deepMerge(data as Record<string, unknown>, step.patch);

  writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf-8');

  return {
    step,
    success: true,
    message: `补丁：${step.file} (${step.mergeStrategy ?? 'merge'})`,
  };
}

/**
 * 深度合并两个对象
 */
function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    const srcValue = source[key];
    const tgtValue = result[key];

    if (
      srcValue &&
      typeof srcValue === 'object' &&
      !Array.isArray(srcValue) &&
      tgtValue &&
      typeof tgtValue === 'object' &&
      !Array.isArray(tgtValue)
    ) {
      result[key] = deepMerge(
        tgtValue as Record<string, unknown>,
        srcValue as Record<string, unknown>
      );
    } else {
      result[key] = srcValue;
    }
  }

  return result;
}

/**
 * 执行 execute 步骤（shell 命令）
 */
function executeCommand(step: MigrationStep, projectRoot: string): StepResult {
  if (!isExecuteStep(step)) {
    return {
      step,
      success: false,
      message: '无效的步骤类型',
    };
  }

  try {
    const fullCommand = step.command + (step.args?.length ? ' ' + step.args.join(' ') : '');
    const cwd = step.cwd ? resolveSafePath(projectRoot, step.cwd) : projectRoot;
    execSync(fullCommand, {
      cwd,
      stdio: 'ignore',
    });
    return {
      step,
      success: true,
      message: `命令执行成功：${fullCommand}`,
    };
  } catch (err) {
    const error = err as Error;
    if (step.ignoreErrors) {
      return {
        step,
        success: true,
        message: `命令执行失败但忽略：${step.command} (${error.message})`,
      };
    }
    return {
      step,
      success: false,
      message: error.message,
      error,
    };
  }
}

// ─── 清单执行 ───────────────────────────────────────────

/**
 * 执行完整迁移清单
 */
export function executeManifest(
  manifest: MigrationManifest,
  projectRoot: string,
  conflictStrategy: ConflictStrategy = ConflictStrategy.Skip
): ExecutionResult {
  const results: StepResult[] = [];
  let executedSteps = 0;
  let skippedSteps = 0;
  let failedSteps = 0;

  // 检查前置条件
  if (manifest.prerequisites) {
    for (const prereq of manifest.prerequisites) {
      const prereqPath = resolveSafePath(projectRoot, prereq);
      if (!existsSync(prereqPath)) {
        return {
          manifest,
          success: false,
          executedSteps: 0,
          skippedSteps: 0,
          failedSteps: 0,
          results: [],
          error: new Error(`前置条件不满足：${prereq} 不存在`),
        };
      }
    }
  }

  // 执行步骤
  for (const step of manifest.steps) {
    const result = executeStep(step, projectRoot, conflictStrategy);
    results.push(result);

    if (result.success) {
      if (result.message.includes('跳过')) {
        skippedSteps++;
      } else {
        executedSteps++;
      }
    } else {
      failedSteps++;

      // 遇到失败，根据策略决定是否继续
      if (conflictStrategy === ConflictStrategy.Abort) {
        break;
      }
    }
  }

  const success = failedSteps === 0;

  return {
    manifest,
    success,
    executedSteps,
    skippedSteps,
    failedSteps,
    results,
    error: success ? undefined : new Error(`${failedSteps} 个步骤执行失败`),
  };
}
