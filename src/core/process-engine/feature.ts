/**
 * Feature 管理基础
 * 当前 Feature 读取、列表、切换
 */
import { join } from 'node:path';
import { readdirSync } from 'node:fs';
import type { StageState, FeatureSummary } from '../../shared/types.js';
import { readJson, exists, writeMarkdown, readMarkdown, ensureDir } from '../../shared/fs-utils.js';

const CURRENT_FILE = '.spec-first/current';

/** 读取当前活跃 Feature ID，不存在返回 null */
export function currentFeature(projectRoot: string): string | null {
  const p = join(projectRoot, CURRENT_FILE);
  if (!exists(p)) return null;
  return readMarkdown(p).trim() || null;
}

/** 切换当前 Feature */
export function switchFeature(featureId: string, projectRoot: string): void {
  const stateFile = join(projectRoot, 'specs', featureId, 'stage-state.json');
  if (!exists(stateFile)) {
    throw new Error(`Feature ${featureId} not found`);
  }
  ensureDir(join(projectRoot, '.spec-first'));
  writeMarkdown(join(projectRoot, CURRENT_FILE), featureId + '\n');
}

/** 读取指定 Feature 的 stage-state.json */
export function getFeatureState(featureId: string, projectRoot: string): StageState {
  const p = join(projectRoot, 'specs', featureId, 'stage-state.json');
  if (!exists(p)) {
    throw new Error(`Feature ${featureId} not found`);
  }
  return readJson<StageState>(p);
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

    const state = readJson<StageState>(stateFile);
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
