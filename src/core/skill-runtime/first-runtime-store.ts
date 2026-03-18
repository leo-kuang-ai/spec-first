import { existsSync } from 'node:fs';
import { join, posix } from 'node:path';
import { readJson, writeJson } from '../../shared/fs-utils.js';
import { logFirstRuntimeWarning, toErrorMessage } from './first-runtime-observability.js';
import type {
  FirstApiContracts,
  FirstConventions,
  FirstCriticalFlows,
  FirstDatabaseSchema,
  FirstDomainModel,
  FirstEntryGuide,
  FirstRuntimeAssetIndexEntry,
  FirstRuntimeConditionalAssetIndexEntry,
  FirstRuntimeIndex,
  FirstRuntimeSummary,
  FirstSteering,
  FirstStructureOverview,
} from './first-runtime-types.js';

function normalizeFirstRuntimeMode(mode: unknown): 'deep' | undefined {
  return mode === 'deep' ? 'deep' : undefined;
}

function normalizeLegacyTechStack(techStack: unknown): string[] {
  if (Array.isArray(techStack)) {
    return techStack.filter((item): item is string => typeof item === 'string');
  }
  if (techStack && typeof techStack === 'object') {
    return Object.entries(techStack)
      .filter(([, value]) => typeof value === 'string' && value.length > 0)
      .map(([key, value]) => `${key}: ${value}`);
  }
  return [];
}

function normalizeRuntimeSummary(raw: Record<string, unknown>): FirstRuntimeSummary {
  const project =
    raw.project && typeof raw.project === 'object' ? (raw.project as Record<string, unknown>) : {};
  const generatedAt =
    typeof raw.generatedAt === 'string'
      ? raw.generatedAt
      : typeof raw.generated_at === 'string'
        ? raw.generated_at
        : new Date(0).toISOString();
  const modules = Array.isArray(raw.modules)
    ? raw.modules.filter((item): item is string => typeof item === 'string')
    : Array.isArray(raw.core_modules)
      ? raw.core_modules.filter((item): item is string => typeof item === 'string')
      : [];
  const apiSurface = Array.isArray(raw.apiSurface)
    ? raw.apiSurface.filter((item): item is string => typeof item === 'string')
    : [];

  if (apiSurface.length === 0 && typeof raw.commands_count === 'number' && raw.commands_count > 0) {
    apiSurface.push('docs/first/api-docs.md');
  }

  return {
    generatedAt,
    mode: normalizeFirstRuntimeMode(raw.mode) ?? 'deep',
    project: {
      name: typeof project.name === 'string' ? project.name : 'unknown-project',
      platformType:
        typeof project.platformType === 'string'
          ? project.platformType
          : typeof raw.project_type === 'string'
            ? raw.project_type
            : undefined,
      overview:
        typeof project.overview === 'string'
          ? project.overview
          : typeof project.description === 'string'
            ? project.description
            : undefined,
    },
    techStack: normalizeLegacyTechStack(raw.techStack ?? raw.tech_stack),
    modules,
    capabilities: Array.isArray(raw.capabilities)
      ? raw.capabilities.filter((item): item is string => typeof item === 'string')
      : [],
    entryPoints: Array.isArray(raw.entryPoints)
      ? raw.entryPoints.filter((item): item is string => typeof item === 'string')
      : [],
    dataModels: Array.isArray(raw.dataModels)
      ? raw.dataModels.filter((item): item is string => typeof item === 'string')
      : [],
    apiSurface,
    risks: Array.isArray(raw.risks)
      ? raw.risks.filter((item): item is string => typeof item === 'string')
      : [],
    evidence: Array.isArray(raw.evidence)
      ? raw.evidence.filter((item): item is string => typeof item === 'string')
      : [],
  };
}

export const FIRST_RUNTIME_DIR = '.spec-first/runtime/first';
export const FIRST_RUNTIME_INDEX_FILE = 'index.json';
export const FIRST_RUNTIME_SUMMARY_FILE = 'summary.json';
export const FIRST_RUNTIME_STEERING_FILE = 'steering.json';
export const FIRST_RUNTIME_CONVENTIONS_FILE = 'conventions.json';
export const FIRST_RUNTIME_CRITICAL_FLOWS_FILE = 'critical-flows.json';
export const FIRST_RUNTIME_ENTRY_GUIDE_FILE = 'entry-guide.json';
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

export function getFirstSteeringPath(projectRoot: string): string {
  return join(getFirstRuntimeDir(projectRoot), FIRST_RUNTIME_STEERING_FILE);
}

export function getFirstConventionsPath(projectRoot: string): string {
  return join(getFirstRuntimeDir(projectRoot), FIRST_RUNTIME_CONVENTIONS_FILE);
}

export function getFirstCriticalFlowsPath(projectRoot: string): string {
  return join(getFirstRuntimeDir(projectRoot), FIRST_RUNTIME_CRITICAL_FLOWS_FILE);
}

export function getFirstEntryGuidePath(projectRoot: string): string {
  return join(getFirstRuntimeDir(projectRoot), FIRST_RUNTIME_ENTRY_GUIDE_FILE);
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
  if (!existsSync(path)) return null;
  try {
    return readJson<T>(path);
  } catch (error) {
    logFirstRuntimeWarning('first-runtime-store.read', `读取 runtime 资产失败: ${path}`, error);
    return null;
  }
}

export function validateFirstRuntimePath(targetPath: string): boolean {
  const normalizedTarget = posix.normalize(targetPath.replaceAll('\\', '/'));
  const targetSegments = normalizedTarget.split('/').filter(Boolean);
  const runtimeSegments = FIRST_RUNTIME_DIR.split('/');

  for (let i = 0; i <= targetSegments.length - runtimeSegments.length; i += 1) {
    const matches = runtimeSegments.every(
      (segment, offset) => targetSegments[i + offset] === segment
    );
    if (matches) return true;
  }

  return false;
}

export function assertValidFirstRuntimePath(targetPath: string): void {
  if (!validateFirstRuntimePath(targetPath)) {
    throw new Error(
      `Invalid First Runtime path: "${targetPath}". ` +
        `Expected path to contain "${FIRST_RUNTIME_DIR}". ` +
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
  const entryGuide =
    rawIndex.entryGuide ??
    makeSyntheticAsset(projectRoot, '.spec-first/runtime/first/entry-guide.json', lastUpdated);
  const apiContracts =
    rawIndex.apiContracts ??
    makeSyntheticAsset(projectRoot, '.spec-first/runtime/first/api-contracts.json', lastUpdated);
  const structureOverview =
    rawIndex.structureOverview ??
    makeSyntheticAsset(
      projectRoot,
      '.spec-first/runtime/first/structure-overview.json',
      lastUpdated
    );
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
    steering.healthy &&
    conventions.healthy &&
    criticalFlows.healthy &&
    entryGuide.healthy &&
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
    entryGuide,
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
            ...(!steering.healthy ? ['steering unhealthy'] : []),
            ...(!conventions.healthy ? ['conventions unhealthy'] : []),
            ...(!criticalFlows.healthy ? ['critical-flows unhealthy'] : []),
            ...(!entryGuide.healthy ? ['entry-guide unhealthy'] : []),
            ...(!apiContracts.healthy ? ['api-contracts unhealthy'] : []),
            ...(!structureOverview.healthy ? ['structure-overview unhealthy'] : []),
            ...(!domainModel.healthy ? ['domain-model unhealthy'] : []),
            ...(databaseSchema.status === 'degraded' ? ['database-schema degraded'] : []),
          ].join('；'),
  };
}

function isCanonicalRuntimeIndexShape(rawIndex: unknown): rawIndex is FirstRuntimeIndex {
  if (typeof rawIndex !== 'object' || rawIndex === null) return false;
  const obj = rawIndex as Record<string, unknown>;
  return (
    obj.summary !== undefined &&
    obj.steering !== undefined &&
    obj.conventions !== undefined &&
    obj.criticalFlows !== undefined &&
    obj.entryGuide !== undefined &&
    obj.apiContracts !== undefined &&
    obj.structureOverview !== undefined &&
    obj.domainModel !== undefined &&
    obj.databaseSchema !== undefined &&
    obj.status !== undefined
  );
}

export function readFirstRuntimeIndex(projectRoot: string): FirstRuntimeIndex | null {
  const raw = readRuntimeJson<Record<string, unknown>>(getFirstRuntimeIndexPath(projectRoot));
  if (raw === null || !isCanonicalRuntimeIndexShape(raw)) {
    return null;
  }
  return normalizeCanonicalRuntimeIndex(projectRoot, raw);
}

export function readFirstRuntimeSummary(projectRoot: string): FirstRuntimeSummary | null {
  const raw = readRuntimeJson<Record<string, unknown>>(getFirstRuntimeSummaryPath(projectRoot));
  if (raw === null) return null;
  return normalizeRuntimeSummary(raw);
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

export function readFirstEntryGuide(projectRoot: string): FirstEntryGuide | null {
  return readRuntimeJson<FirstEntryGuide>(getFirstEntryGuidePath(projectRoot));
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

export function writeFirstRuntimeIndex(projectRoot: string, index: FirstRuntimeIndex): void {
  writeRuntimeJson(getFirstRuntimeIndexPath(projectRoot), index);
}

export function writeFirstRuntimeSummary(projectRoot: string, summary: FirstRuntimeSummary): void {
  writeRuntimeJson(getFirstRuntimeSummaryPath(projectRoot), summary);
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

export function writeFirstEntryGuide(projectRoot: string, entryGuide: FirstEntryGuide): void {
  writeRuntimeJson(getFirstEntryGuidePath(projectRoot), entryGuide);
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
