/**
 * 依赖检查器
 * stage advance 前检查下一阶段依赖项
 * 支持通过 config.yaml 配置依赖项
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Stage } from '../../shared/types.js';
import { loadConfig } from '../../shared/config-schema.js';

export interface StageDependency {
  stage: Stage;
  npmScripts?: string[];
  files?: string[];
  envVars?: string[];
}

export interface DependencyCheckResult {
  pass: boolean;
  missing: string[];
}

/** 内置默认依赖配置（fallback） */
const DEFAULT_STAGE_DEPENDENCIES: StageDependency[] = [
  {
    stage: Stage.DESIGN,
    files: ['specs/{featureId}/prd.md', 'specs/{featureId}/spec.md'],
  },
  {
    stage: Stage.IMPLEMENT,
    npmScripts: ['test', 'build'],
  },
  {
    stage: Stage.VERIFY,
    npmScripts: ['test'],
  },
  {
    stage: Stage.RELEASE,
    files: ['specs/{featureId}/reports/smoke-test-report.md'],
  },
];

/** 阶段枚举到配置 key 的映射 */
const STAGE_TO_CONFIG_KEY: Record<Stage, string> = {
  [Stage.INIT]: '00_init',
  [Stage.SPECIFY]: '01_specify',
  [Stage.DESIGN]: '02_design',
  [Stage.PLAN]: '03_plan',
  [Stage.IMPLEMENT]: '04_implement',
  [Stage.VERIFY]: '05_verify',
  [Stage.WRAP_UP]: '06_wrap_up',
  [Stage.RELEASE]: '07_release',
  [Stage.DONE]: '08_done',
  [Stage.CANCELLED]: '09_cancelled',
};

/**
 * 从配置文件获取依赖项，回退到内置默认值
 */
function getStageDependencies(
  targetStage: Stage,
  projectRoot: string
): StageDependency | null {
  // 先尝试从配置文件读取
  try {
    const config = loadConfig(projectRoot);
    if (config.dependencies?.autoCheck === false) {
      return null; // 配置禁用依赖检查
    }

    const configKey = STAGE_TO_CONFIG_KEY[targetStage];
    const stageConfig = config.dependencies?.stages?.[configKey];

    if (stageConfig) {
      return {
        stage: targetStage,
        npmScripts: stageConfig.npmScripts,
        files: stageConfig.files,
        envVars: stageConfig.envVars,
      };
    }
  } catch {
    // 配置读取失败，使用内置默认值
  }

  // 回退到内置默认值
  return DEFAULT_STAGE_DEPENDENCIES.find(d => d.stage === targetStage) ?? null;
}

export function checkDependencies(
  featureId: string,
  targetStage: Stage,
  projectRoot: string
): DependencyCheckResult {
  const deps = getStageDependencies(targetStage, projectRoot);
  if (!deps) return { pass: true, missing: [] };

  const missing: string[] = [];

  // 检查 npm scripts
  if (deps.npmScripts) {
    const pkgPath = join(projectRoot, 'package.json');
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { scripts?: Record<string, string> };
      for (const script of deps.npmScripts) {
        if (!pkg.scripts?.[script]) {
          missing.push(`npm script: ${script}`);
        }
      }
    }
  }

  // 检查文件
  if (deps.files) {
    for (const file of deps.files) {
      const path = file.replace('{featureId}', featureId);
      if (!existsSync(join(projectRoot, path))) {
        missing.push(`file: ${path}`);
      }
    }
  }

  // 检查环境变量
  if (deps.envVars) {
    for (const envVar of deps.envVars) {
      if (!process.env[envVar]) {
        missing.push(`env var: ${envVar}`);
      }
    }
  }

  return { pass: missing.length === 0, missing };
}
