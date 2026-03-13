/**
 * 依赖检查器
 * stage advance 前检查下一阶段依赖项
 * 支持通过 config.yaml 配置依赖项
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { Stage } from '../../shared/types.js';
import { RELEASE_REQUIRED_ARTIFACTS } from '../rules/truth-source.js';
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
    stage: Stage.WRAP_UP,
    files: ['specs/{featureId}/retro.md'],
  },
  {
    stage: Stage.RELEASE,
    files: RELEASE_REQUIRED_ARTIFACTS.map((item) => `specs/{featureId}/${item}`),
    npmScripts: ['contract:check'],
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
function getStageDependencies(targetStage: Stage, projectRoot: string): StageDependency | null {
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
  return DEFAULT_STAGE_DEPENDENCIES.find((d) => d.stage === targetStage) ?? null;
}

export function describeDependencyIssues(result: DependencyCheckResult): string[] {
  return result.missing.map((item) => {
    if (item.startsWith('file (empty):')) {
      return item.replace('file (empty):', '文件内容为空:');
    }
    return `缺少 ${item}`;
  });
}

/**
 * 过滤默认依赖项（default-simplified profile）
 * 开发期放松脚本依赖，release 保留完整校验
 */
function filterDefaultDependencies(deps: StageDependency, targetStage: Stage): StageDependency {
  // release 阶段保留全部依赖（包括 contract:check）
  if (targetStage === Stage.RELEASE) {
    return deps;
  }
  // 非 release 阶段只保留 files，去掉 npmScripts 和 envVars
  return { stage: deps.stage, files: deps.files };
}

export function checkDependencies(
  featureId: string,
  targetStage: Stage,
  projectRoot: string,
  profile: string = 'default-simplified'
): DependencyCheckResult {
  const rawDeps = getStageDependencies(targetStage, projectRoot);
  if (!rawDeps) return { pass: true, missing: [] };

  const deps = profile === 'strict' ? rawDeps : filterDefaultDependencies(rawDeps, targetStage);
  const missing: string[] = [];

  // 检查 npm scripts
  if (deps.npmScripts) {
    const pkgPath = join(projectRoot, 'package.json');
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as {
        scripts?: Record<string, string>;
      };
      for (const script of deps.npmScripts) {
        if (!pkg.scripts?.[script]) {
          missing.push(`npm script: ${script}`);
        }
      }
    }
  }

  // 检查文件（存在性 + 非空校验，单次 statSync）
  if (deps.files) {
    for (const file of deps.files) {
      const path = file.replace('{featureId}', featureId);
      const fullPath = join(projectRoot, path);
      try {
        const stat = statSync(fullPath);
        if (stat.size === 0) {
          missing.push(`file (empty): ${path}`);
        }
      } catch {
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
