import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { readJson, writeJson } from '../../shared/fs-utils.js';
import { logFirstRuntimeWarning, toErrorMessage } from './first-runtime-observability.js';
import type {
  FirstChangeMap,
  FirstConventions,
  FirstCriticalFlows,
  FirstEntryGuide,
  FirstRebootGuide,
  FirstSteering,
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
export const FIRST_RUNTIME_STEERING_FILE = 'steering.json';
export const FIRST_RUNTIME_CONVENTIONS_FILE = 'conventions.json';
export const FIRST_RUNTIME_CRITICAL_FLOWS_FILE = 'critical-flows.json';
export const FIRST_RUNTIME_CHANGE_MAP_FILE = 'change-map.json';
export const FIRST_RUNTIME_ENTRY_GUIDE_FILE = 'entry-guide.json';
export const FIRST_RUNTIME_REBOOT_GUIDE_FILE = 'reboot-guide.json';
export const FIRST_PROJECT_COGNITION_UPDATES_FILE = 'project-cognition-updates.jsonl';

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

interface LegacyFirstSteering {
  generated_at?: string;
  project_what?: string;
  where_to_start?: string[];
  current_critical_areas?: string[];
  common_change_paths?: string[];
  verify_checklist?: string[];
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
  return Array.from(new Set(groups.flatMap((group) => group ?? []).filter(Boolean)));
}

function toDocRefs(entries: string[]): string[] {
  return entries.map((entry) => (entry.startsWith('docs/') ? entry : `docs/first/${entry}`));
}

function isLegacyRuntimeIndex(value: unknown): value is LegacyFirstRuntimeIndex {
  return (
    isRecord(value) &&
    typeof value.version === 'string' &&
    Array.isArray(value.artifacts) &&
    isRecord(value.project)
  );
}

function isLegacyRuntimeSummary(value: unknown): value is LegacyFirstRuntimeSummary {
  return (
    isRecord(value) &&
    typeof value.generated_at === 'string' &&
    typeof value.project_type === 'string' &&
    Array.isArray(value.core_modules)
  );
}

function isLegacyRoleViews(value: unknown): value is LegacyFirstRoleViews {
  return isRecord(value) && typeof value.generated_at === 'string' && isRecord(value.roles);
}

function isLegacyStageViews(value: unknown): value is LegacyFirstStageViews {
  return isRecord(value) && typeof value.generated_at === 'string' && isRecord(value.stages);
}

function isLegacySteering(value: unknown): value is LegacyFirstSteering {
  return (
    isRecord(value) &&
    typeof value.generated_at === 'string' &&
    typeof value.project_what === 'string'
  );
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

function normalizeLegacyRoleView(
  role: FirstRoleView['role'],
  descriptor?: LegacyFirstRoleDescriptor
): FirstRoleView {
  const priorityDocs = toDocRefs(asStringArray(descriptor?.priority_docs));
  const entryPoints = asStringArray(descriptor?.entry_points).map(
    (entryPoint) => `entry: ${entryPoint}`
  );
  const keyConcepts = asStringArray(descriptor?.key_concepts);

  return {
    role,
    summary: priorityDocs[0] ? `Prioritize ${priorityDocs[0]}` : 'No summary available',
    focus: uniqueStrings(priorityDocs, entryPoints, keyConcepts),
    warnings: [],
  };
}

function normalizeLegacyRuntimeIndex(
  projectRoot: string,
  rawIndex: LegacyFirstRuntimeIndex
): FirstRuntimeIndex {
  const generatedAt = rawIndex.generated_at ?? new Date(0).toISOString();
  const summary = makeSyntheticAsset(
    projectRoot,
    '.spec-first/runtime/first/summary.json',
    generatedAt
  );
  const roleViews = makeSyntheticAsset(
    projectRoot,
    '.spec-first/runtime/first/role-views.json',
    generatedAt
  );
  const stageViews = makeSyntheticAsset(
    projectRoot,
    '.spec-first/runtime/first/stage-views.json',
    generatedAt
  );
  const steering = makeSyntheticAsset(
    projectRoot,
    '.spec-first/runtime/first/steering.json',
    generatedAt
  );
  steering.healthy = true;
  steering.issues = undefined;
  steering.fileHash = 'legacy-derived';
  const conventions = makeSyntheticAsset(
    projectRoot,
    '.spec-first/runtime/first/conventions.json',
    generatedAt
  );
  conventions.healthy = true;
  conventions.issues = undefined;
  conventions.fileHash = 'legacy-derived';
  const criticalFlows = makeSyntheticAsset(
    projectRoot,
    '.spec-first/runtime/first/critical-flows.json',
    generatedAt
  );
  criticalFlows.healthy = true;
  criticalFlows.issues = undefined;
  criticalFlows.fileHash = 'legacy-derived';
  const changeMap = makeSyntheticAsset(
    projectRoot,
    '.spec-first/runtime/first/change-map.json',
    generatedAt
  );
  changeMap.healthy = true;
  changeMap.issues = undefined;
  changeMap.fileHash = 'legacy-derived';
  const entryGuide = makeSyntheticAsset(
    projectRoot,
    '.spec-first/runtime/first/entry-guide.json',
    generatedAt
  );
  entryGuide.healthy = true;
  entryGuide.issues = undefined;
  entryGuide.fileHash = 'legacy-derived';
  const rebootGuide = makeSyntheticAsset(
    projectRoot,
    '.spec-first/runtime/first/reboot-guide.json',
    generatedAt
  );
  rebootGuide.healthy = true;
  rebootGuide.issues = undefined;
  rebootGuide.fileHash = 'legacy-derived';
  const status =
    summary.healthy &&
    roleViews.healthy &&
    stageViews.healthy &&
    steering.healthy &&
    conventions.healthy &&
    criticalFlows.healthy &&
    changeMap.healthy &&
    entryGuide.healthy &&
    rebootGuide.healthy
      ? 'current'
      : 'stale';
  const staleReason =
    status === 'current'
      ? undefined
      : [
          ...(!summary.healthy ? ['summary unhealthy'] : []),
          ...(!roleViews.healthy ? ['role-views unhealthy'] : []),
          ...(!stageViews.healthy ? ['stage-views unhealthy'] : []),
          ...(!steering.healthy ? ['steering unhealthy'] : []),
          ...(!conventions.healthy ? ['conventions unhealthy'] : []),
          ...(!criticalFlows.healthy ? ['critical-flows unhealthy'] : []),
          ...(!changeMap.healthy ? ['change-map unhealthy'] : []),
          ...(!entryGuide.healthy ? ['entry-guide unhealthy'] : []),
          ...(!rebootGuide.healthy ? ['reboot-guide unhealthy'] : []),
        ].join('；');

  return {
    version: rawIndex.version ?? 'legacy-runtime',
    lastRun: generatedAt,
    mode: rawIndex.mode === 'deep' ? 'deep' : 'quick',
    summary,
    roleViews,
    stageViews,
    steering,
    conventions,
    criticalFlows,
    changeMap,
    entryGuide,
    rebootGuide,
    docsProjection: {},
    status,
    staleReason,
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
  const status =
    rawIndex.summary.healthy &&
    rawIndex.roleViews.healthy &&
    rawIndex.stageViews.healthy &&
    steering.healthy &&
    conventions.healthy &&
    criticalFlows.healthy &&
    changeMap.healthy &&
    entryGuide.healthy &&
    rebootGuide.healthy
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
    status,
    staleReason:
      status === 'current'
        ? undefined
        : [
            ...(!rawIndex.summary.healthy ? ['summary unhealthy'] : []),
            ...(!rawIndex.roleViews.healthy ? ['role-views unhealthy'] : []),
            ...(!rawIndex.stageViews.healthy ? ['stage-views unhealthy'] : []),
            ...(!steering.healthy ? ['steering unhealthy'] : []),
            ...(!conventions.healthy ? ['conventions unhealthy'] : []),
            ...(!criticalFlows.healthy ? ['critical-flows unhealthy'] : []),
            ...(!changeMap.healthy ? ['change-map unhealthy'] : []),
            ...(!entryGuide.healthy ? ['entry-guide unhealthy'] : []),
            ...(!rebootGuide.healthy ? ['reboot-guide unhealthy'] : []),
          ].join('；'),
  };
}

function normalizeLegacyRuntimeSummary(
  projectRoot: string,
  rawSummary: LegacyFirstRuntimeSummary,
  rawIndex: LegacyFirstRuntimeIndex | null,
  rawRoleViews: LegacyFirstRoleViews | null
): FirstRuntimeSummary {
  const generatedAt =
    rawSummary.generated_at ?? rawIndex?.generated_at ?? new Date(0).toISOString();
  const projectName = rawIndex?.project?.name ?? basename(projectRoot);
  const entryPoints = uniqueStrings(
    asStringArray(rawRoleViews?.roles?.developer?.entry_points),
    asStringArray(rawRoleViews?.roles?.product_manager?.entry_points),
    asStringArray(rawRoleViews?.roles?.tester?.entry_points),
    asStringArray(rawRoleViews?.roles?.architect?.entry_points)
  );
  const apiSurface = toDocRefs(
    rawIndex?.artifacts
      ?.filter((artifact) => artifact.type?.includes('api'))
      .map((artifact) => artifact.path)
      .filter((path): path is string => typeof path === 'string') ?? []
  );
  const dataModels = toDocRefs(
    rawIndex?.artifacts
      ?.filter((artifact) => artifact.type?.includes('domain'))
      .map((artifact) => artifact.path)
      .filter((path): path is string => typeof path === 'string') ?? []
  );
  const capabilities = uniqueStrings(
    rawSummary.project_type ? [`project type: ${rawSummary.project_type}`] : [],
    typeof rawSummary.commands_count === 'number' ? [`commands: ${rawSummary.commands_count}`] : [],
    [rawSummary.has_database ? 'database: detected' : 'database: not detected']
  );
  const risks =
    rawIndex?.database?.detected === false && rawIndex.database.reason
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
    techStack: Object.entries(rawSummary.tech_stack ?? {}).map(
      ([key, value]) => `${key}: ${value}`
    ),
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
      warnings: initFiles.map((file) => `00_init: ${file}`),
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
      callPathHints: planFiles.map((file) => `03_plan -> ${file}`),
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

function normalizeLegacySteering(
  rawSteering: LegacyFirstSteering,
  rawSummary: LegacyFirstRuntimeSummary | null
): FirstSteering {
  return {
    product: {
      overview: rawSteering.project_what ?? 'project cognition',
      coreScenarios: asStringArray(rawSteering.current_critical_areas),
      nonGoals: ['legacy docs as canonical truth'],
      glossary: [],
    },
    tech: {
      stack: rawSummary
        ? Object.entries(rawSummary.tech_stack ?? {}).map(([key, value]) => `${key}: ${value}`)
        : [],
      constraints: asStringArray(rawSteering.verify_checklist),
      forbiddenPatterns: ['docs-only truth'],
    },
    structure: {
      modules: asStringArray(rawSteering.common_change_paths),
      boundaries: asStringArray(rawSteering.where_to_start),
      entryRules: ['read runtime truth first'],
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
  return normalizeCanonicalRuntimeIndex(projectRoot, raw as FirstRuntimeIndex);
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
      isLegacyRoleViews(rawRoleViews) ? rawRoleViews : null
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

export function readFirstSteering(projectRoot: string): FirstSteering | null {
  const raw = readRuntimeJson<unknown>(getFirstSteeringPath(projectRoot));
  if (raw === null) {
    const rawSummary = readRuntimeJson<unknown>(getFirstRuntimeSummaryPath(projectRoot));
    const rawIndex = readRuntimeJson<unknown>(getFirstRuntimeIndexPath(projectRoot));
    if (isLegacyRuntimeSummary(rawSummary)) {
      return normalizeLegacySteering(
        {
          generated_at: rawSummary.generated_at,
          project_what:
            isLegacyRuntimeIndex(rawIndex) && typeof rawIndex.project?.description === 'string'
              ? rawIndex.project.description
              : `${basename(projectRoot)} project cognition`,
          where_to_start: isLegacyRuntimeIndex(rawIndex)
            ? rawIndex.artifacts
                ?.map((artifact) => artifact.path)
                .filter((path): path is string => typeof path === 'string')
            : [],
          current_critical_areas: asStringArray(rawSummary.core_modules),
          common_change_paths: asStringArray(rawSummary.core_modules),
          verify_checklist: ['refresh steering from runtime truth'],
        },
        rawSummary
      );
    }
    return null;
  }
  if (isLegacySteering(raw)) {
    const rawSummary = readRuntimeJson<unknown>(getFirstRuntimeSummaryPath(projectRoot));
    return normalizeLegacySteering(raw, isLegacyRuntimeSummary(rawSummary) ? rawSummary : null);
  }
  return raw as FirstSteering;
}

export function readFirstConventions(projectRoot: string): FirstConventions | null {
  const raw = readRuntimeJson<unknown>(getFirstConventionsPath(projectRoot));
  if (raw === null) {
    const rawSummary = readRuntimeJson<unknown>(getFirstRuntimeSummaryPath(projectRoot));
    if (isLegacyRuntimeSummary(rawSummary)) {
      return {
        api: {
          observedPatterns: ['CLI surface not explicitly detected'],
          deviations: [],
          recommendedConvention: 'Expose command surfaces through stable spec-first CLI verbs.',
          evidence: [],
        },
        module: {
          observedPatterns: asStringArray(rawSummary.core_modules),
          deviations: [],
          recommendedConvention: 'Keep runtime logic under src/core and entry orchestration near src/cli.',
          evidence: asStringArray(rawSummary.core_modules),
        },
        testing: {
          observedPatterns: Object.entries(rawSummary.tech_stack ?? {})
            .map(([key, value]) => `${key}: ${value}`)
            .filter((item) => item.toLowerCase().includes('test')),
          deviations: [],
          recommendedConvention: 'Use Vitest-style automated regression coverage and keep test evidence alongside runtime changes.',
          evidence: ['vitest.config.ts'],
        },
        projectRules: {
          observedPatterns: ['runtime truth first'],
          deviations: [],
          recommendedConvention:
            'Treat .spec-first/runtime/first as canonical truth before projecting docs/first views.',
          evidence: ['.spec-first/runtime/first'],
        },
      };
    }
    return null;
  }
  return raw as FirstConventions;
}

export function readFirstCriticalFlows(projectRoot: string): FirstCriticalFlows | null {
  const raw = readRuntimeJson<unknown>(getFirstCriticalFlowsPath(projectRoot));
  if (raw === null) {
    const rawSummary = readRuntimeJson<unknown>(getFirstRuntimeSummaryPath(projectRoot));
    if (isLegacyRuntimeSummary(rawSummary)) {
      return [
        {
          flowId: 'flow-cli-entry',
          name: 'CLI Entry Flow',
          entryPoints: ['src/cli/index.ts'],
          coreModules: asStringArray(rawSummary.core_modules),
          invariants: ['runtime truth first'],
          verificationHooks: ['refresh critical flows from runtime truth'],
        },
      ];
    }
    return null;
  }
  return raw as FirstCriticalFlows;
}

export function readFirstChangeMap(projectRoot: string): FirstChangeMap | null {
  const raw = readRuntimeJson<unknown>(getFirstChangeMapPath(projectRoot));
  if (raw === null) {
    const rawSummary = readRuntimeJson<unknown>(getFirstRuntimeSummaryPath(projectRoot));
    if (isLegacyRuntimeSummary(rawSummary)) {
      return [
        {
          changeType: 'runtime-asset-extension',
          likelyModules: asStringArray(rawSummary.core_modules),
          likelyCommands: ['spec-first first'],
          likelyConfigs: [],
          likelyTests: ['refresh change-map from runtime truth'],
          riskPoints: ['legacy runtime drift'],
        },
      ];
    }
    return null;
  }
  return raw as FirstChangeMap;
}

export function readFirstEntryGuide(projectRoot: string): FirstEntryGuide | null {
  const raw = readRuntimeJson<unknown>(getFirstEntryGuidePath(projectRoot));
  if (raw === null) {
    const rawSummary = readRuntimeJson<unknown>(getFirstRuntimeSummaryPath(projectRoot));
    if (isLegacyRuntimeSummary(rawSummary)) {
      return [
        {
          taskCategory: 'runtime-extension',
          readFirst: ['.spec-first/runtime/first/summary.json'],
          thenRead: asStringArray(rawSummary.core_modules),
          avoidEntry: ['legacy docs as truth'],
          relatedFlows: [],
        },
      ];
    }
    return null;
  }
  return raw as FirstEntryGuide;
}

export function readFirstRebootGuide(projectRoot: string): FirstRebootGuide | null {
  const raw = readRuntimeJson<unknown>(getFirstRebootGuidePath(projectRoot));
  if (raw === null) {
    const rawSummary = readRuntimeJson<unknown>(getFirstRuntimeSummaryPath(projectRoot));
    if (isLegacyRuntimeSummary(rawSummary)) {
      return {
        projectWhat: `${basename(projectRoot)} project cognition`,
        whereToStart: ['.spec-first/runtime/first/summary.json'],
        currentCriticalAreas: asStringArray(rawSummary.core_modules),
        commonChangePaths: asStringArray(rawSummary.core_modules),
        verifyChecklist: ['refresh reboot-guide from runtime truth'],
      };
    }
    return null;
  }
  return raw as FirstRebootGuide;
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

export function writeFirstRebootGuide(
  projectRoot: string,
  rebootGuide: FirstRebootGuide
): void {
  writeRuntimeJson(getFirstRebootGuidePath(projectRoot), rebootGuide);
}
