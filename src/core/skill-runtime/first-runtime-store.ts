import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readJson, writeJson } from '../../shared/fs-utils.js';
import { logFirstRuntimeWarning, toErrorMessage } from './first-runtime-observability.js';
import type {
  FirstRoleViews,
  FirstRuntimeIndex,
  FirstRuntimeSummary,
  FirstStageViews,
} from './first-runtime-types.js';

export const FIRST_RUNTIME_DIR = '.spec-first/runtime/first';
export const FIRST_RUNTIME_INDEX_FILE = 'index.json';
export const FIRST_RUNTIME_SUMMARY_FILE = 'summary.json';
export const FIRST_RUNTIME_ROLE_VIEWS_FILE = 'role-views.json';
export const FIRST_RUNTIME_STAGE_VIEWS_FILE = 'stage-views.json';

export function getFirstRuntimeDir(projectRoot: string): string {
  return join(projectRoot, FIRST_RUNTIME_DIR);
}

export function getFirstRuntimeIndexPath(projectRoot: string): string {
  return join(getFirstRuntimeDir(projectRoot), FIRST_RUNTIME_INDEX_FILE);
}

export function getFirstRuntimeSummaryPath(projectRoot: string): string {
  return join(getFirstRuntimeDir(projectRoot), FIRST_RUNTIME_SUMMARY_FILE);
}

export function getFirstRoleViewsPath(projectRoot: string): string {
  return join(getFirstRuntimeDir(projectRoot), FIRST_RUNTIME_ROLE_VIEWS_FILE);
}

export function getFirstStageViewsPath(projectRoot: string): string {
  return join(getFirstRuntimeDir(projectRoot), FIRST_RUNTIME_STAGE_VIEWS_FILE);
}

function readRuntimeJson<T>(path: string): T | null {
  if (!existsSync(path)) {
    return null;
  }

  try {
    return readJson<T>(path);
  } catch (error) {
    logFirstRuntimeWarning('first-runtime-store.read', `读取 runtime 资产失败: ${path}`, error);
    return null;
  }
}

function writeRuntimeJson(path: string, data: unknown): void {
  try {
    writeJson(path, data);
  } catch (error) {
    throw new Error(`写入 runtime 资产失败: ${path} (${toErrorMessage(error)})`, { cause: error });
  }
}

export function readFirstRuntimeIndex(projectRoot: string): FirstRuntimeIndex | null {
  return readRuntimeJson<FirstRuntimeIndex>(getFirstRuntimeIndexPath(projectRoot));
}

export function readFirstRuntimeSummary(projectRoot: string): FirstRuntimeSummary | null {
  return readRuntimeJson<FirstRuntimeSummary>(getFirstRuntimeSummaryPath(projectRoot));
}

export function readFirstRoleViews(projectRoot: string): FirstRoleViews | null {
  return readRuntimeJson<FirstRoleViews>(getFirstRoleViewsPath(projectRoot));
}

export function readFirstStageViews(projectRoot: string): FirstStageViews | null {
  return readRuntimeJson<FirstStageViews>(getFirstStageViewsPath(projectRoot));
}

export function writeFirstRuntimeIndex(projectRoot: string, index: FirstRuntimeIndex): void {
  writeRuntimeJson(getFirstRuntimeIndexPath(projectRoot), index);
}

export function writeFirstRuntimeSummary(projectRoot: string, summary: FirstRuntimeSummary): void {
  writeRuntimeJson(getFirstRuntimeSummaryPath(projectRoot), summary);
}

export function writeFirstRoleViews(projectRoot: string, roleViews: FirstRoleViews): void {
  writeRuntimeJson(getFirstRoleViewsPath(projectRoot), roleViews);
}

export function writeFirstStageViews(projectRoot: string, stageViews: FirstStageViews): void {
  writeRuntimeJson(getFirstStageViewsPath(projectRoot), stageViews);
}
