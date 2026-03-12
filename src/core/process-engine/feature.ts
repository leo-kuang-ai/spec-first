/**
 * Feature 管理基础
 * 当前 Feature 读取、列表、切换
 */
import { join } from 'node:path';
import { readdirSync } from 'node:fs';
import type { StageState, FeatureSummary } from '../../shared/types.js';
import { readJson, exists, writeMarkdown, readMarkdown, ensureDir } from '../../shared/fs-utils.js';

const CURRENT_FILE = '.spec-first/current';
const FEATURE_ENV_KEYS = [
  'SPEC_FIRST_FEATURE',
  'SPEC_FIRST_CURRENT_FEATURE',
  'FEATURE_ID',
] as const;

function readValidatedFeatureState(featureDirName: string, projectRoot: string): StageState {
  const stateFile = join(projectRoot, 'specs', featureDirName, 'stage-state.json');
  const state = readJson<StageState>(stateFile);
  if (state.featureId !== featureDirName) {
    throw new Error(
      `Feature 目录名与 stage-state.featureId 不一致：目录=${featureDirName}，state=${state.featureId}`
    );
  }
  return state;
}

/** 读取当前活跃 Feature ID，不存在返回 null */
export function currentFeature(projectRoot: string): string | null {
  const p = join(projectRoot, CURRENT_FILE);
  if (!exists(p)) return null;
  return readMarkdown(p).trim() || null;
}

/** 切换当前 Feature */
export function switchFeature(featureId: string, projectRoot: string): void {
  const resolved = resolveFeatureId(featureId, projectRoot);
  ensureDir(join(projectRoot, '.spec-first'));
  writeMarkdown(join(projectRoot, CURRENT_FILE), `${resolved.featureId}\n`);
}

/** 读取指定 Feature 的 stage-state.json */
export function getFeatureState(featureId: string, projectRoot: string): StageState {
  const p = join(projectRoot, 'specs', featureId, 'stage-state.json');
  if (!exists(p)) {
    throw new Error(`Feature ${featureId} not found`);
  }
  return readValidatedFeatureState(featureId, projectRoot);
}

/** 扫描 specs/ 下所有 Feature，返回按 updatedAt 降序排列的摘要 */
export function listFeatures(projectRoot: string): FeatureSummary[] {
  const specsDir = join(projectRoot, 'specs');
  if (!exists(specsDir)) return [];

  const entries = readdirSync(specsDir, { withFileTypes: true });
  const summaries: FeatureSummary[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const stateFile = join(specsDir, entry.name, 'stage-state.json');
    if (!exists(stateFile)) continue;

    let state: StageState;
    try {
      state = readValidatedFeatureState(entry.name, projectRoot);
    } catch {
      continue;
    }
    summaries.push({
      featureId: state.featureId,
      title: state.title,
      mode: state.mode,
      size: state.size,
      currentStage: state.currentStage,
      terminal: state.terminal,
      updatedAt: state.updatedAt,
    });
  }

  return summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function resolveByExactOrPrefix(input: string, featureIds: string[]): string | undefined {
  if (featureIds.includes(input)) return input;

  const matches = featureIds.filter((id) => id.startsWith(input));
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    throw new Error(`Feature 前缀 "${input}" 存在歧义：${matches.join(', ')}`);
  }
  return undefined;
}

function listFeatureDirectoryNames(projectRoot: string): string[] {
  const specsDir = join(projectRoot, 'specs');
  if (!exists(specsDir)) return [];
  return readdirSync(specsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function getEnvOverride(env: NodeJS.ProcessEnv): string | undefined {
  for (const key of FEATURE_ENV_KEYS) {
    const value = env[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
}

export function resolveFeatureId(
  requested: string | undefined,
  projectRoot: string,
  options?: { env?: NodeJS.ProcessEnv }
): { featureId: string; source: 'exact' | 'prefix' | 'env' } {
  const featureIds = Array.from(
    new Set([
      ...listFeatures(projectRoot).map((item) => item.featureId),
      ...listFeatureDirectoryNames(projectRoot),
    ])
  );
  const input = requested?.trim();

  if (input) {
    const exactStatePath = join(projectRoot, 'specs', input, 'stage-state.json');
    if (exists(exactStatePath)) {
      getFeatureState(input, projectRoot);
      return { featureId: input, source: 'exact' };
    }

    const resolved = resolveByExactOrPrefix(input, featureIds);
    if (resolved) {
      return { featureId: resolved, source: resolved === input ? 'exact' : 'prefix' };
    }
  }

  const env = options?.env ?? process.env;
  const envFeature = getEnvOverride(env);
  if (envFeature) {
    const resolved = resolveByExactOrPrefix(envFeature, featureIds);
    if (resolved) return { featureId: resolved, source: 'env' };
    throw new Error(`环境变量 Feature 未找到：${envFeature}`);
  }

  throw new Error(`Feature ${input ?? '(empty)'} not found`);
}
