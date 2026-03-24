import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';

export interface SkillInputContract {
  required: string[];
  recommended: string[];
  optional: string[];
}

export interface SkillInputContractsConfig {
  auto_inject: boolean;
  skip_injection: string[];
  defaults: SkillInputContract;
  descriptions: Record<string, string>;
  skills: Record<string, SkillInputContract>;
}

const DEFAULT_CONFIG: SkillInputContractsConfig = {
  auto_inject: true,
  skip_injection: ['first', 'init'],
  defaults: { required: ['summary'], recommended: [], optional: [] },
  descriptions: {
    summary: '项目概览',
    steering: '产品方向',
    conventions: '编码规范',
    'entry-guide': '入口指南',
    'structure-overview': '代码结构',
    'api-contracts': 'API 契约',
    'critical-flows': '关键流程',
    'domain-model': '领域模型',
    'database-schema': '数据库结构',
  },
  skills: {},
};

let cachedConfig: SkillInputContractsConfig | null = null;

/**
 * 获取 skills root 目录（即使 YAML 不存在也返回目录）
 */
export function resolveSkillsRoot(): string | null {
  // 从当前模块向上查找 skills/ 目录
  let currentDir = import.meta.dirname;
  while (currentDir) {
    const skillsRoot = join(currentDir, 'skills');
    // 只要目录存在就返回，不要求 YAML 存在
    if (existsSync(skillsRoot)) {
      return skillsRoot;
    }
    const parentDir = join(currentDir, '..');
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }
  return null;
}

/**
 * 获取默认配置（用于 fallback）
 */
export function getDefaultConfig(): SkillInputContractsConfig {
  return { ...DEFAULT_CONFIG };
}

/**
 * 加载配置文件
 */
export function loadSkillInputContractsConfig(
  skillsRoot: string
): SkillInputContractsConfig {
  if (cachedConfig) return cachedConfig;

  const configPath = join(skillsRoot, 'skill-input-contracts.yaml');

  if (!existsSync(configPath)) {
    cachedConfig = DEFAULT_CONFIG;
    return DEFAULT_CONFIG;
  }

  const content = readFileSync(configPath, 'utf-8');
  const parsed = yaml.load(content) as Partial<SkillInputContractsConfig>;

  cachedConfig = {
    auto_inject: parsed.auto_inject ?? DEFAULT_CONFIG.auto_inject,
    skip_injection: parsed.skip_injection ?? DEFAULT_CONFIG.skip_injection,
    defaults: { ...DEFAULT_CONFIG.defaults, ...parsed.defaults },
    descriptions: { ...DEFAULT_CONFIG.descriptions, ...parsed.descriptions },
    skills: parsed.skills ?? {},
  };

  return cachedConfig!;
}

/**
 * 获取指定 skill 的输入上下文配置
 */
export function getSkillInputContract(
  skillName: string,
  skillsRoot: string
): SkillInputContract {
  const config = loadSkillInputContractsConfig(skillsRoot);
  return config.skills[skillName] ?? config.defaults;
}

/**
 * 判断是否应该注入输入上下文
 */
export function shouldInjectInputContext(
  skillName: string,
  skillsRoot: string
): boolean {
  const config = loadSkillInputContractsConfig(skillsRoot);
  if (!config.auto_inject) return false;
  return !config.skip_injection.includes(skillName);
}

/**
 * 获取产物描述
 */
export function getAssetDescription(
  assetName: string,
  skillsRoot: string
): string {
  const config = loadSkillInputContractsConfig(skillsRoot);
  return config.descriptions[assetName] ?? assetName;
}

/**
 * 清除缓存（用于测试）
 */
export function clearConfigCache(): void {
  cachedConfig = null;
}
