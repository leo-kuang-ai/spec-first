import { existsSync } from 'node:fs';
import { join, posix } from 'node:path';
import { readJson, writeJson } from '../../shared/fs-utils.js';
import { logFirstRuntimeWarning, toErrorMessage } from './first-runtime-observability.js';
import type {
  FirstApiContracts,
  FirstChangeMap,
  FirstConventions,
  FirstCriticalFlows,
  FirstDatabaseSchema,
  FirstDomainModel,
  FirstEntryGuide,
  FirstRebootGuide,
  FirstSteering,
  FirstStructureOverview,
  FirstRuntimeConditionalAssetIndexEntry,
  FirstRuntimeAssetIndexEntry,
  FirstRuntimeIndex,
  FirstRuntimeSummary,
  FirstRoleViews,
  FirstStageViews,
} from './first-runtime-types.js';

export const FIRST_RUNTIME_DIR = '.spec-first/runtime/first';
export const FIRST_RUNTIME_INDEX_FILE = 'index.json';
export const FIRST_RUNTIME_SUMMARY_FILE = 'summary.json';
export const FIRST_RUNTIME_ROLE_VIEWS_FILE = 'role-views.json';
export const FIRST_RUNTIME_STAGE_VIEWS_FILE = 'stage-views.json';
export const FIRST_RUNTIME_STEERING_FILE = 'steering.json';
export const FIRST_RUNTIME_CONVENTIONS_FILE = 'conventions.json';
export const FIRST_RUNTIME_CRITICAL_FLOWS_FILE = 'critical-flows.json';
export const FIRST_RUNTIME_CHANGE_MAP_FILE = 'change-map.json';
export const FIRST_RUNTIME_ENTRY_GUIDE_FILE = 'entry-guide.json';
export const FIRST_RUNTIME_REBOOT_GUIDE_FILE = 'reboot-guide.json';
export const FIRST_RUNTIME_API_CONTRACTS_FILE = 'api-contracts.json';
export const FIRST_RUNTIME_STRUCTURE_OVERVIEW_FILE = 'structure-overview.json';
export const FIRST_RUNTIME_DOMAIN_MODEL_FILE = 'domain-model.json';
export const FIRST_RUNTIME_DATABASE_SCHEMA_FILE = 'database-schema.json';
export const FIRST_PROJECT_COGNITION_UPDATES_FILE = 'project-cognition-updates.jsonl';

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

export function getFirstSteeringPath(projectRoot: string): string {
  return join(getFirstRuntimeDir(projectRoot), FIRST_RUNTIME_STEERING_FILE);
}

export function getFirstConventionsPath(projectRoot: string): string {
  return join(getFirstRuntimeDir(projectRoot), FIRST_RUNTIME_CONVENTIONS_FILE);
}

export function getFirstCriticalFlowsPath(projectRoot: string): string {
  return join(getFirstRuntimeDir(projectRoot), FIRST_RUNTIME_CRITICAL_FLOWS_FILE);
}

export function getFirstChangeMapPath(projectRoot: string): string {
  return join(getFirstRuntimeDir(projectRoot), FIRST_RUNTIME_CHANGE_MAP_FILE);
}

export function getFirstEntryGuidePath(projectRoot: string): string {
  return join(getFirstRuntimeDir(projectRoot), FIRST_RUNTIME_ENTRY_GUIDE_FILE);
}

export function getFirstRebootGuidePath(projectRoot: string): string {
  return join(getFirstRuntimeDir(projectRoot), FIRST_RUNTIME_REBOOT_GUIDE_FILE);
}

export function getFirstApiContractsPath(projectRoot: string): string {
  return join(getFirstRuntimeDir(projectRoot), FIRST_RUNTIME_API_CONTRACTS_FILE);
}

export function getFirstStructureOverviewPath(projectRoot: string): string {
  return join(getFirstRuntimeDir(projectRoot), FIRST_RUNTIME_STRUCTURE_OVERVIEW_FILE);
}

export function getFirstDomainModelPath(projectRoot: string): string {
  return join(getFirstRuntimeDir(projectRoot), FIRST_RUNTIME_DOMAIN_MODEL_FILE);
}

export function getFirstDatabaseSchemaPath(projectRoot: string): string {
  return join(getFirstRuntimeDir(projectRoot), FIRST_RUNTIME_DATABASE_SCHEMA_FILE);
}

export function getFirstProjectCognitionUpdatesPath(projectRoot: string): string {
  return join(getFirstRuntimeDir(projectRoot), FIRST_PROJECT_COGNITION_UPDATES_FILE);
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

/**
 * 校验路径是否为有效的 First Runtime 路径
 * 防止因硬编码错误路径导致的文件写入到错误位置
 * @see docs/first/incident-2026-03-16-json-generation-error.md
 */
export function validateFirstRuntimePath(targetPath: string): boolean {
  const normalizedTarget = posix.normalize(targetPath.replaceAll('\\', '/'));
  const targetSegments = normalizedTarget.split('/').filter(Boolean);
  const runtimeSegments = FIRST_RUNTIME_DIR.split('/');

  for (let i = 0; i <= targetSegments.length - runtimeSegments.length; i++) {
    const matches = runtimeSegments.every((segment, offset) => targetSegments[i + offset] === segment);
    if (matches) {
      return true;
    }
  }

  return false;
}

/**
 * 断言路径为有效的 First Runtime 路径，无效时抛出错误
 */
export function assertValidFirstRuntimePath(targetPath: string): void {
  if (!validateFirstRuntimePath(targetPath)) {
    throw new Error(
      `Invalid First Runtime path: "${targetPath}". ` +
        `Expected path to contain "${FIRST_RUNTIME_DIR}". ` +
        `This error prevents accidental writes to wrong directories (e.g., ".config-first/"). ` +
        `Use getFirstRuntimeDir(projectRoot) or getFirst*Path(projectRoot) functions to construct paths.`
    );
  }
}

function writeRuntimeJson(path: string, data: unknown): void {
  assertValidFirstRuntimePath(path);
  try {
    writeJson(path, data);
  } catch (error) {
    throw new Error(`写入 runtime 资产失败: ${path} (${toErrorMessage(error)})`, { cause: error });
  }
}

function makeSyntheticAsset(
  projectRoot: string,
  path: string,
  lastUpdated: string
): FirstRuntimeAssetIndexEntry {
  const healthy = existsSync(join(projectRoot, path));
  return {
    path,
    fileHash: 'legacy-runtime',
    lastUpdated,
    healthy,
    issues: healthy ? undefined : ['file missing'],
  };
}

function makeSyntheticConditionalAsset(
  projectRoot: string,
  path: string,
  lastUpdated: string,
  status: FirstRuntimeConditionalAssetIndexEntry['status']
): FirstRuntimeConditionalAssetIndexEntry {
  return {
    ...makeSyntheticAsset(projectRoot, path, lastUpdated),
    healthy: status === 'healthy',
    status,
  };
}

function normalizeCanonicalRuntimeIndex(
  projectRoot: string,
  rawIndex: FirstRuntimeIndex
): FirstRuntimeIndex {
  const lastUpdated = rawIndex.lastRun ?? new Date(0).toISOString();
  const steering =
    rawIndex.steering ??
    makeSyntheticAsset(projectRoot, '.spec-first/runtime/first/steering.json', lastUpdated);
  const conventions =
    rawIndex.conventions ??
    makeSyntheticAsset(projectRoot, '.spec-first/runtime/first/conventions.json', lastUpdated);
  const criticalFlows =
    rawIndex.criticalFlows ??
    makeSyntheticAsset(projectRoot, '.spec-first/runtime/first/critical-flows.json', lastUpdated);
  const changeMap =
    rawIndex.changeMap ??
    makeSyntheticAsset(projectRoot, '.spec-first/runtime/first/change-map.json', lastUpdated);
  const entryGuide =
    rawIndex.entryGuide ??
    makeSyntheticAsset(projectRoot, '.spec-first/runtime/first/entry-guide.json', lastUpdated);
  const rebootGuide =
    rawIndex.rebootGuide ??
    makeSyntheticAsset(projectRoot, '.spec-first/runtime/first/reboot-guide.json', lastUpdated);
  const apiContracts =
    rawIndex.apiContracts ??
    makeSyntheticAsset(projectRoot, '.spec-first/runtime/first/api-contracts.json', lastUpdated);
  const structureOverview =
    rawIndex.structureOverview ??
    makeSyntheticAsset(projectRoot, '.spec-first/runtime/first/structure-overview.json', lastUpdated);
  const domainModel =
    rawIndex.domainModel ??
    makeSyntheticAsset(projectRoot, '.spec-first/runtime/first/domain-model.json', lastUpdated);
  const databaseSchema =
    rawIndex.databaseSchema ??
    makeSyntheticConditionalAsset(
      projectRoot,
      '.spec-first/runtime/first/database-schema.json',
      lastUpdated,
      'not_applicable'
    );
  const status =
    rawIndex.summary?.healthy &&
    rawIndex.roleViews?.healthy &&
    rawIndex.stageViews?.healthy &&
    steering.healthy &&
    conventions.healthy &&
    criticalFlows.healthy &&
    changeMap.healthy &&
    entryGuide.healthy &&
    rebootGuide.healthy &&
    apiContracts.healthy &&
    structureOverview.healthy &&
    domainModel.healthy &&
    databaseSchema.status !== 'degraded'
      ? 'current'
      : 'stale';

  return {
    ...rawIndex,
    steering,
    conventions,
    criticalFlows,
    changeMap,
    entryGuide,
    rebootGuide,
    apiContracts,
    structureOverview,
    domainModel,
    databaseSchema,
    status,
    staleReason:
      status === 'current'
        ? undefined
        : [
            ...(!rawIndex.summary?.healthy ? ['summary unhealthy'] : []),
            ...(!rawIndex.roleViews?.healthy ? ['role-views unhealthy'] : []),
            ...(!rawIndex.stageViews?.healthy ? ['stage-views unhealthy'] : []),
            ...(!steering.healthy ? ['steering unhealthy'] : []),
            ...(!conventions.healthy ? ['conventions unhealthy'] : []),
            ...(!criticalFlows.healthy ? ['critical-flows unhealthy'] : []),
            ...(!changeMap.healthy ? ['change-map unhealthy'] : []),
            ...(!entryGuide.healthy ? ['entry-guide unhealthy'] : []),
            ...(!rebootGuide.healthy ? ['reboot-guide unhealthy'] : []),
            ...(!apiContracts.healthy ? ['api-contracts unhealthy'] : []),
            ...(!structureOverview.healthy ? ['structure-overview unhealthy'] : []),
            ...(!domainModel.healthy ? ['domain-model unhealthy'] : []),
            ...(databaseSchema.status === 'degraded' ? ['database-schema degraded'] : []),
          ].join('；'),
  };
}

export function readFirstRuntimeIndex(projectRoot: string): FirstRuntimeIndex | null {
  const raw = readRuntimeJson<FirstRuntimeIndex>(getFirstRuntimeIndexPath(projectRoot));
  return raw === null ? null : normalizeCanonicalRuntimeIndex(projectRoot, raw);
}

export function readFirstRuntimeSummary(projectRoot: string): FirstRuntimeSummary | null {
  return readRuntimeJson<FirstRuntimeSummary>(getFirstRuntimeSummaryPath(projectRoot));
}

export function readFirstApiContracts(projectRoot: string): FirstApiContracts | null {
  return readRuntimeJson<FirstApiContracts>(getFirstApiContractsPath(projectRoot));
}

export function readFirstStructureOverview(projectRoot: string): FirstStructureOverview | null {
  return readRuntimeJson<FirstStructureOverview>(getFirstStructureOverviewPath(projectRoot));
}

export function readFirstDomainModel(projectRoot: string): FirstDomainModel | null {
  return readRuntimeJson<FirstDomainModel>(getFirstDomainModelPath(projectRoot));
}

export function readFirstDatabaseSchema(projectRoot: string): FirstDatabaseSchema | null {
  return readRuntimeJson<FirstDatabaseSchema>(getFirstDatabaseSchemaPath(projectRoot));
}

export function readFirstRoleViews(projectRoot: string): FirstRoleViews | null {
  return readRuntimeJson<FirstRoleViews>(getFirstRoleViewsPath(projectRoot));
}

export function readFirstStageViews(projectRoot: string): FirstStageViews | null {
  return readRuntimeJson<FirstStageViews>(getFirstStageViewsPath(projectRoot));
}

export function readFirstSteering(projectRoot: string): FirstSteering | null {
  return readRuntimeJson<FirstSteering>(getFirstSteeringPath(projectRoot));
}

export function readFirstConventions(projectRoot: string): FirstConventions | null {
  return readRuntimeJson<FirstConventions>(getFirstConventionsPath(projectRoot));
}

export function readFirstCriticalFlows(projectRoot: string): FirstCriticalFlows | null {
  return readRuntimeJson<FirstCriticalFlows>(getFirstCriticalFlowsPath(projectRoot));
}

export function readFirstChangeMap(projectRoot: string): FirstChangeMap | null {
  return readRuntimeJson<FirstChangeMap>(getFirstChangeMapPath(projectRoot));
}

export function readFirstEntryGuide(projectRoot: string): FirstEntryGuide | null {
  return readRuntimeJson<FirstEntryGuide>(getFirstEntryGuidePath(projectRoot));
}

export function readFirstRebootGuide(projectRoot: string): FirstRebootGuide | null {
  return readRuntimeJson<FirstRebootGuide>(getFirstRebootGuidePath(projectRoot));
}

export function writeFirstRuntimeIndex(projectRoot: string, index: FirstRuntimeIndex): void {
  writeRuntimeJson(getFirstRuntimeIndexPath(projectRoot), index);
}

export function writeFirstRuntimeSummary(projectRoot: string, summary: FirstRuntimeSummary): void {
  writeRuntimeJson(getFirstRuntimeSummaryPath(projectRoot), summary);
}

export function writeFirstApiContracts(projectRoot: string, apiContracts: FirstApiContracts): void {
  writeRuntimeJson(getFirstApiContractsPath(projectRoot), apiContracts);
}

export function writeFirstStructureOverview(
  projectRoot: string,
  structureOverview: FirstStructureOverview
): void {
  writeRuntimeJson(getFirstStructureOverviewPath(projectRoot), structureOverview);
}

export function writeFirstDomainModel(projectRoot: string, domainModel: FirstDomainModel): void {
  writeRuntimeJson(getFirstDomainModelPath(projectRoot), domainModel);
}

export function writeFirstDatabaseSchema(
  projectRoot: string,
  databaseSchema: FirstDatabaseSchema
): void {
  writeRuntimeJson(getFirstDatabaseSchemaPath(projectRoot), databaseSchema);
}

export function writeFirstRoleViews(projectRoot: string, roleViews: FirstRoleViews): void {
  writeRuntimeJson(getFirstRoleViewsPath(projectRoot), roleViews);
}

export function writeFirstStageViews(projectRoot: string, stageViews: FirstStageViews): void {
  writeRuntimeJson(getFirstStageViewsPath(projectRoot), stageViews);
}

export function writeFirstSteering(projectRoot: string, steering: FirstSteering): void {
  writeRuntimeJson(getFirstSteeringPath(projectRoot), steering);
}

export function writeFirstConventions(projectRoot: string, conventions: FirstConventions): void {
  writeRuntimeJson(getFirstConventionsPath(projectRoot), conventions);
}

export function writeFirstCriticalFlows(
  projectRoot: string,
  criticalFlows: FirstCriticalFlows
): void {
  writeRuntimeJson(getFirstCriticalFlowsPath(projectRoot), criticalFlows);
}

export function writeFirstChangeMap(projectRoot: string, changeMap: FirstChangeMap): void {
  writeRuntimeJson(getFirstChangeMapPath(projectRoot), changeMap);
}

export function writeFirstEntryGuide(projectRoot: string, entryGuide: FirstEntryGuide): void {
  writeRuntimeJson(getFirstEntryGuidePath(projectRoot), entryGuide);
}

export function writeFirstRebootGuide(projectRoot: string, rebootGuide: FirstRebootGuide): void {
  writeRuntimeJson(getFirstRebootGuidePath(projectRoot), rebootGuide);
}
