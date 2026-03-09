import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { readJson, writeJson } from '../../shared/fs-utils.js';
import { logFirstRuntimeWarning, toErrorMessage } from './first-runtime-observability.js';
import type {
  FirstRoleView,
  FirstRoleViews,
  FirstRuntimeAssetIndexEntry,
  FirstRuntimeIndex,
  FirstRuntimeSummary,
  FirstStageViews,
} from './first-runtime-types.js';

export const FIRST_RUNTIME_DIR = '.spec-first/runtime/first';
export const FIRST_RUNTIME_INDEX_FILE = 'index.json';
export const FIRST_RUNTIME_SUMMARY_FILE = 'summary.json';
export const FIRST_RUNTIME_ROLE_VIEWS_FILE = 'role-views.json';
export const FIRST_RUNTIME_STAGE_VIEWS_FILE = 'stage-views.json';

interface LegacyFirstRuntimeIndexArtifact {
  id?: string;
  path?: string;
  type?: string;
  status?: string;
}

interface LegacyFirstRuntimeIndex {
  version?: string;
  mode?: 'quick' | 'deep';
  generated_at?: string;
  project?: {
    name?: string;
    version?: string;
    type?: string;
    description?: string;
  };
  artifacts?: LegacyFirstRuntimeIndexArtifact[];
  database?: {
    detected?: boolean;
    reason?: string;
  };
}

interface LegacyFirstRuntimeSummary {
  mode?: 'quick' | 'deep';
  generated_at?: string;
  tech_stack?: Record<string, string>;
  project_type?: string;
  core_modules?: string[];
  commands_count?: number;
  has_database?: boolean;
}

interface LegacyFirstRoleDescriptor {
  priority_docs?: string[];
  entry_points?: string[];
  key_concepts?: string[];
}

interface LegacyFirstRoleViews {
  generated_at?: string;
  roles?: {
    developer?: LegacyFirstRoleDescriptor;
    product_manager?: LegacyFirstRoleDescriptor;
    tester?: LegacyFirstRoleDescriptor;
    architect?: LegacyFirstRoleDescriptor;
  };
}

interface LegacyFirstStageDescriptor {
  relevant_docs?: string[];
  key_files?: string[];
}

interface LegacyFirstStageViews {
  generated_at?: string;
  stages?: Record<string, LegacyFirstStageDescriptor>;
}

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function uniqueStrings(...groups: Array<string[] | undefined>): string[] {
  return Array.from(new Set(groups.flatMap(group => group ?? []).filter(Boolean)));
}

function toDocRefs(entries: string[]): string[] {
  return entries.map(entry => entry.startsWith('docs/') ? entry : `docs/first/${entry}`);
}

function isLegacyRuntimeIndex(value: unknown): value is LegacyFirstRuntimeIndex {
  return isRecord(value)
    && typeof value.version === 'string'
    && Array.isArray(value.artifacts)
    && isRecord(value.project);
}

function isLegacyRuntimeSummary(value: unknown): value is LegacyFirstRuntimeSummary {
  return isRecord(value)
    && typeof value.generated_at === 'string'
    && typeof value.project_type === 'string'
    && Array.isArray(value.core_modules);
}

function isLegacyRoleViews(value: unknown): value is LegacyFirstRoleViews {
  return isRecord(value)
    && typeof value.generated_at === 'string'
    && isRecord(value.roles);
}

function isLegacyStageViews(value: unknown): value is LegacyFirstStageViews {
  return isRecord(value)
    && typeof value.generated_at === 'string'
    && isRecord(value.stages);
}

function makeSyntheticAsset(projectRoot: string, path: string, lastUpdated: string): FirstRuntimeAssetIndexEntry {
  const healthy = existsSync(join(projectRoot, path));
  return {
    path,
    fileHash: 'legacy-runtime',
    lastUpdated,
    healthy,
    issues: healthy ? undefined : ['file missing'],
  };
}

function normalizeLegacyRoleView(role: FirstRoleView['role'], descriptor?: LegacyFirstRoleDescriptor): FirstRoleView {
  const priorityDocs = toDocRefs(asStringArray(descriptor?.priority_docs));
  const entryPoints = asStringArray(descriptor?.entry_points).map(entryPoint => `entry: ${entryPoint}`);
  const keyConcepts = asStringArray(descriptor?.key_concepts);

  return {
    role,
    summary: priorityDocs[0] ? `Prioritize ${priorityDocs[0]}` : 'No summary available',
    focus: uniqueStrings(priorityDocs, entryPoints, keyConcepts),
    warnings: [],
  };
}

function normalizeLegacyRuntimeIndex(projectRoot: string, rawIndex: LegacyFirstRuntimeIndex): FirstRuntimeIndex {
  const generatedAt = rawIndex.generated_at ?? new Date(0).toISOString();
  const summary = makeSyntheticAsset(projectRoot, '.spec-first/runtime/first/summary.json', generatedAt);
  const roleViews = makeSyntheticAsset(projectRoot, '.spec-first/runtime/first/role-views.json', generatedAt);
  const stageViews = makeSyntheticAsset(projectRoot, '.spec-first/runtime/first/stage-views.json', generatedAt);
  const status = summary.healthy && roleViews.healthy && stageViews.healthy ? 'current' : 'stale';
  const staleReason = status === 'current'
    ? undefined
    : [
      ...(!summary.healthy ? ['summary unhealthy'] : []),
      ...(!roleViews.healthy ? ['role-views unhealthy'] : []),
      ...(!stageViews.healthy ? ['stage-views unhealthy'] : []),
    ].join('；');

  return {
    version: rawIndex.version ?? 'legacy-runtime',
    lastRun: generatedAt,
    mode: rawIndex.mode === 'deep' ? 'deep' : 'quick',
    summary,
    roleViews,
    stageViews,
    docsProjection: {},
    status,
    staleReason,
  };
}

function normalizeLegacyRuntimeSummary(
  projectRoot: string,
  rawSummary: LegacyFirstRuntimeSummary,
  rawIndex: LegacyFirstRuntimeIndex | null,
  rawRoleViews: LegacyFirstRoleViews | null,
): FirstRuntimeSummary {
  const generatedAt = rawSummary.generated_at ?? rawIndex?.generated_at ?? new Date(0).toISOString();
  const projectName = rawIndex?.project?.name ?? basename(projectRoot);
  const entryPoints = uniqueStrings(
    asStringArray(rawRoleViews?.roles?.developer?.entry_points),
    asStringArray(rawRoleViews?.roles?.product_manager?.entry_points),
    asStringArray(rawRoleViews?.roles?.tester?.entry_points),
    asStringArray(rawRoleViews?.roles?.architect?.entry_points),
  );
  const apiSurface = toDocRefs(
    rawIndex?.artifacts
      ?.filter(artifact => artifact.type?.includes('api'))
      .map(artifact => artifact.path)
      .filter((path): path is string => typeof path === 'string') ?? [],
  );
  const dataModels = toDocRefs(
    rawIndex?.artifacts
      ?.filter(artifact => artifact.type?.includes('domain'))
      .map(artifact => artifact.path)
      .filter((path): path is string => typeof path === 'string') ?? [],
  );
  const capabilities = uniqueStrings(
    rawSummary.project_type ? [`project type: ${rawSummary.project_type}`] : [],
    typeof rawSummary.commands_count === 'number' ? [`commands: ${rawSummary.commands_count}`] : [],
    [rawSummary.has_database ? 'database: detected' : 'database: not detected'],
  );
  const risks = rawIndex?.database?.detected === false && rawIndex.database.reason
    ? [`database: ${rawIndex.database.reason}`]
    : [];

  return {
    generatedAt,
    mode: rawSummary.mode === 'deep' ? 'deep' : 'quick',
    project: {
      name: projectName,
      platformType: rawSummary.project_type ?? rawIndex?.project?.type,
      overview: rawIndex?.project?.description,
    },
    modules: asStringArray(rawSummary.core_modules),
    capabilities,
    entryPoints,
    dataModels,
    apiSurface,
    risks,
    evidence: [
      '.spec-first/runtime/first/index.json',
      '.spec-first/runtime/first/summary.json',
      '.spec-first/runtime/first/role-views.json',
      '.spec-first/runtime/first/stage-views.json',
    ],
  };
}

function normalizeLegacyRoleViews(rawRoleViews: LegacyFirstRoleViews): FirstRoleViews {
  return {
    product: normalizeLegacyRoleView('product', rawRoleViews.roles?.product_manager),
    dev: normalizeLegacyRoleView('dev', rawRoleViews.roles?.developer),
    qa: normalizeLegacyRoleView('qa', rawRoleViews.roles?.tester),
    architect: normalizeLegacyRoleView('architect', rawRoleViews.roles?.architect),
  };
}

function normalizeLegacyStageViews(rawStageViews: LegacyFirstStageViews): FirstStageViews {
  const initStage = rawStageViews.stages?.['00_init'];
  const specStage = rawStageViews.stages?.['01_specify'] ?? initStage;
  const designStage = rawStageViews.stages?.['02_design'] ?? specStage;
  const planStage = rawStageViews.stages?.['03_plan'];
  const codeStage = rawStageViews.stages?.['04_implement'] ?? planStage ?? designStage;
  const verifyStage = rawStageViews.stages?.['05_verify'] ?? codeStage;

  const specDocs = toDocRefs(asStringArray(specStage?.relevant_docs));
  const designDocs = toDocRefs(asStringArray(designStage?.relevant_docs));
  const planDocs = toDocRefs(asStringArray(planStage?.relevant_docs));
  const codeDocs = toDocRefs(asStringArray(codeStage?.relevant_docs));
  const verifyDocs = toDocRefs(asStringArray(verifyStage?.relevant_docs));

  const specFiles = asStringArray(specStage?.key_files);
  const designFiles = asStringArray(designStage?.key_files);
  const planFiles = asStringArray(planStage?.key_files);
  const codeFiles = asStringArray(codeStage?.key_files);
  const verifyFiles = asStringArray(verifyStage?.key_files);
  const initFiles = asStringArray(initStage?.key_files);

  return {
    spec: {
      stage: 'spec',
      summary: 'Derived from 01_specify runtime stage',
      businessCapabilities: specDocs,
      coreEntities: [],
      dependencies: specFiles,
      warnings: initFiles.map(file => `00_init: ${file}`),
    },
    design: {
      stage: 'design',
      summary: 'Derived from 02_design runtime stage',
      moduleBoundaries: designFiles,
      integrationPoints: designDocs,
      technicalConstraints: [],
      risks: [],
    },
    code: {
      stage: 'code',
      summary: 'Derived from 04_implement runtime stage',
      entryPoints: codeFiles,
      likelyChangeAreas: uniqueStrings(planFiles, codeDocs),
      callPathHints: planFiles.map(file => `03_plan -> ${file}`),
      couplingPoints: uniqueStrings(planDocs, designFiles),
      changeHazards: [],
      verificationHooks: verifyFiles,
    },
    verify: {
      stage: 'verify',
      summary: 'Derived from 05_verify runtime stage',
      criticalFlows: verifyFiles,
      validationFocus: verifyDocs,
      testFocus: verifyFiles.length > 0 ? verifyFiles : verifyDocs,
      riskAreas: [],
      recommendedChecks: verifyDocs,
      validationHooks: [],
      releaseBlockers: [],
    },
  };
}

export function readFirstRuntimeIndex(projectRoot: string): FirstRuntimeIndex | null {
  const raw = readRuntimeJson<unknown>(getFirstRuntimeIndexPath(projectRoot));
  if (raw === null) {
    return null;
  }
  if (isLegacyRuntimeIndex(raw)) {
    return normalizeLegacyRuntimeIndex(projectRoot, raw);
  }
  return raw as FirstRuntimeIndex;
}

export function readFirstRuntimeSummary(projectRoot: string): FirstRuntimeSummary | null {
  const raw = readRuntimeJson<unknown>(getFirstRuntimeSummaryPath(projectRoot));
  if (raw === null) {
    return null;
  }
  if (isLegacyRuntimeSummary(raw)) {
    const rawIndex = readRuntimeJson<unknown>(getFirstRuntimeIndexPath(projectRoot));
    const rawRoleViews = readRuntimeJson<unknown>(getFirstRoleViewsPath(projectRoot));
    return normalizeLegacyRuntimeSummary(
      projectRoot,
      raw,
      isLegacyRuntimeIndex(rawIndex) ? rawIndex : null,
      isLegacyRoleViews(rawRoleViews) ? rawRoleViews : null,
    );
  }
  return raw as FirstRuntimeSummary;
}

export function readFirstRoleViews(projectRoot: string): FirstRoleViews | null {
  const raw = readRuntimeJson<unknown>(getFirstRoleViewsPath(projectRoot));
  if (raw === null) {
    return null;
  }
  if (isLegacyRoleViews(raw)) {
    return normalizeLegacyRoleViews(raw);
  }
  return raw as FirstRoleViews;
}

export function readFirstStageViews(projectRoot: string): FirstStageViews | null {
  const raw = readRuntimeJson<unknown>(getFirstStageViewsPath(projectRoot));
  if (raw === null) {
    return null;
  }
  if (isLegacyStageViews(raw)) {
    return normalizeLegacyStageViews(raw);
  }
  return raw as FirstStageViews;
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
