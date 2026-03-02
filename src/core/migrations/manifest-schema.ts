/**
 * Manifest 迁移结构定义
 * 声明化版本迁移动作，确保升级过程可重复、可回放
 */

// ─── 类型定义 ───────────────────────────────────────────

/**
 * 冲突策略
 * 当迁移目标已存在时的处理方式
 */
export enum ConflictStrategy {
  /** 跳过此步骤，保留现有文件 */
  Skip = 'skip',
  /** 直接覆盖现有文件 */
  Overwrite = 'overwrite',
  /** 中止整个迁移过程 */
  Abort = 'abort',
  /** 提示用户选择 */
  Prompt = 'prompt',
}

/**
 * 版本范围类型
 * 支持语义化版本区间匹配
 */
export interface VersionRange {
  /** 起始版本（不包含） */
  from: string;
  /** 目标版本（包含） */
  to: string;
  /** 是否包含起始版本 */
  fromInclusive?: boolean;
  /** 是否包含目标版本 */
  toInclusive?: boolean;
}

/**
 * 迁移步骤类型
 * 定义单个迁移操作的类型和参数
 */
export type MigrationStep =
  | MkdirStep
  | RenameStep
  | DeleteStep
  | CopyStep
  | PatchStep
  | ExecuteStep;

/** 创建目录 */
export interface MkdirStep {
  type: 'mkdir';
  path: string;
  mode?: number; // 权限模式（八进制）
}

/** 重命名/移动文件或目录 */
export interface RenameStep {
  type: 'rename';
  from: string;
  to: string;
  overwrite?: boolean;
}

/** 删除文件或目录 */
export interface DeleteStep {
  type: 'delete';
  path: string;
  recursive?: boolean;
}

/** 复制文件或目录 */
export interface CopyStep {
  type: 'copy';
  from: string;
  to: string;
  overwrite?: boolean;
  recursive?: boolean;
}

/** 补丁文件（JSON/YAML 合并） */
export interface PatchStep {
  type: 'patch';
  file: string;
  patch: Record<string, unknown>; // 合并到目标文件的键值对
  mergeStrategy?: 'merge' | 'replace'; // merge: 合并, replace: 替换整个对象
}

/** 执行 shell 命令 */
export interface ExecuteStep {
  type: 'execute';
  command: string;
  args?: string[];
  cwd?: string;
  ignoreErrors?: boolean;
}

/**
 * 迁移清单
 * 定义从一个版本到另一个版本的所有迁移动作
 */
export interface MigrationManifest {
  /** 清单版本格式 */
  schemaVersion: string;
  /** 版本区间 */
  versionRange: VersionRange;
  /** 清单描述 */
  description: string;
  /** 迁移步骤列表 */
  steps: MigrationStep[];
  /** 默认冲突策略（可被步骤级覆盖） */
  defaultConflictStrategy?: ConflictStrategy;
  /** 前置条件检查 */
  prerequisites?: string[]; // 文件或目录路径，必须存在才能执行
}

/**
 * 步骤执行结果
 */
export interface StepResult {
  step: MigrationStep;
  success: boolean;
  message: string;
  error?: Error;
}

/**
 * 清单执行结果
 */
export interface ExecutionResult {
  manifest: MigrationManifest;
  success: boolean;
  executedSteps: number;
  skippedSteps: number;
  failedSteps: number;
  results: StepResult[];
  error?: Error;
}

/**
 * 清单校验结果
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ─── 类型守卫 ───────────────────────────────────────────

export function isMkdirStep(step: MigrationStep): step is MkdirStep {
  return step.type === 'mkdir';
}

export function isRenameStep(step: MigrationStep): step is RenameStep {
  return step.type === 'rename';
}

export function isDeleteStep(step: MigrationStep): step is DeleteStep {
  return step.type === 'delete';
}

export function isCopyStep(step: MigrationStep): step is CopyStep {
  return step.type === 'copy';
}

export function isPatchStep(step: MigrationStep): step is PatchStep {
  return step.type === 'patch';
}

export function isExecuteStep(step: MigrationStep): step is ExecuteStep {
  return step.type === 'execute';
}
