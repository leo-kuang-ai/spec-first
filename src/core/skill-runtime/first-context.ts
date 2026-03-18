import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { BackgroundInputStatus } from '../../shared/types.js';
import { sha256Hex } from '../../shared/crypto-utils.js';
import { readJson, writeJson } from '../../shared/fs-utils.js';
import {
  FIRST_RUNTIME_ARTIFACTS,
  matchRuntimeArtifactsByChangedFile,
} from './first-artifact-mapping.js';
import { bootstrapFirstRuntime } from './first-bootstrap.js';
import { refreshFirstDocsFromRuntime } from './first-doc-projection.js';
import {
  getFirstApiContractsPath,
  getFirstConventionsPath,
  getFirstCriticalFlowsPath,
  getFirstDatabaseSchemaPath,
  getFirstDomainModelPath,
  getFirstEntryGuidePath,
  getFirstRuntimeSummaryPath,
  getFirstSteeringPath,
  getFirstStructureOverviewPath,
  readFirstApiContracts,
  readFirstConventions,
  readFirstCriticalFlows,
  readFirstDatabaseSchema,
  readFirstDomainModel,
  readFirstEntryGuide,
  readFirstRuntimeIndex,
  readFirstRuntimeSummary,
  readFirstSteering,
  readFirstStructureOverview,
  writeFirstRuntimeIndex,
} from './first-runtime-store.js';
import type {
  FirstApiContracts,
  FirstConventions,
  FirstCriticalFlows,
  FirstDatabaseSchema,
  FirstDomainModel,
  FirstEntryGuide,
  FirstRuntimeAssetIndexEntry,
  FirstRuntimeIndex,
  FirstRuntimeSummary,
  FirstSteering,
  FirstStructureOverview,
} from './first-runtime-types.js';

export const FIRST_REFRESH_MODES = [
  'refresh-runtime-only',
  'refresh-docs-from-runtime',
  'refresh-all',
] as const;

export type FirstRefreshMode = (typeof FIRST_REFRESH_MODES)[number];
export type FirstRuntimeArtifact = (typeof FIRST_RUNTIME_ARTIFACTS)[number];

export interface FirstContext {
  index: FirstRuntimeIndex;
  summary: FirstRuntimeSummary;
  steering: FirstSteering;
  conventions: FirstConventions;
  criticalFlows: FirstCriticalFlows;
  entryGuide: FirstEntryGuide;
  apiContracts: FirstApiContracts;
  structureOverview: FirstStructureOverview;
  domainModel: FirstDomainModel;
  databaseSchema: FirstDatabaseSchema | null;
}

export interface FirstRefreshResult {
  mode: FirstRefreshMode;
  runtimeArtifacts: string[];
  docsProjections: string[];
}

export interface ExecuteFirstResult {
  runtimeArtifacts: string[];
  docsProjections: string[];
}

export interface BackgroundInputSyncResult {
  backgroundInputStatus: BackgroundInputStatus;
  updatedFeatures: string[];
  skippedFeatures: string[];
}

function requireRuntimeAsset<T>(asset: T | null, label: string): T {
  if (asset === null) {
    throw new Error(`Missing first runtime asset: ${label}`);
  }
  return asset;
}

function ensureHealthyRuntimeAsset(
  index: FirstRuntimeIndex,
  assetName:
    | 'summary'
    | 'steering'
    | 'conventions'
    | 'criticalFlows'
    | 'entryGuide'
    | 'apiContracts'
    | 'structureOverview'
    | 'domainModel',
  label: string
): void {
  const asset = index[assetName];
  if (!asset) {
    throw new Error(`Missing first runtime asset: ${label}`);
  }
  if (!asset.healthy) {
    const reason = asset.issues?.join('；') || index.staleReason || 'runtime asset unhealthy';
    throw new Error(`${label}: ${reason}`);
  }
}

function ensureHealthyDatabaseSchema(index: FirstRuntimeIndex): void {
  if (index.databaseSchema.status === 'degraded') {
    const reason =
      index.databaseSchema.issues?.join('；') || index.staleReason || 'database-schema degraded';
    throw new Error(`database-schema: ${reason}`);
  }
}

function isRuntimeHealthy(index: FirstRuntimeIndex): boolean {
  return (
    index.status === 'current' &&
    index.summary.healthy &&
    index.steering.healthy &&
    index.conventions.healthy &&
    index.criticalFlows.healthy &&
    index.entryGuide.healthy &&
    index.apiContracts.healthy &&
    index.structureOverview.healthy &&
    index.domainModel.healthy &&
    index.databaseSchema.status !== 'degraded'
  );
}

function getCurrentSourceCommit(projectRoot: string): string | null {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

function getWorkingTreeChangedFiles(projectRoot: string): string[] | null {
  try {
    const output = execFileSync('git', ['status', '--porcelain'], {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();

    if (output === '') {
      return [];
    }

    return output
      .split('\n')
      .map((line) => line.slice(3).trim())
      .map((path) => (path.includes(' -> ') ? (path.split(' -> ').at(-1) ?? path) : path))
      .map((path) => path.replace(/^"|"$/g, ''))
      .filter(Boolean);
  } catch {
    return null;
  }
}

function getCommittedSourceChanges(
  projectRoot: string,
  fromCommit: string,
  toCommit: string
): string[] | null {
  try {
    const output = execFileSync('git', ['diff', '--name-only', `${fromCommit}..${toCommit}`], {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();

    if (output === '') {
      return [];
    }

    return Array.from(
      new Set(
        output
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .filter((line) => !line.startsWith('.spec-first/runtime/first/'))
          .filter((line) => !line.startsWith('docs/first/'))
      )
    );
  } catch {
    return null;
  }
}

function mergeChangedFiles(...groups: Array<string[] | null>): string[] | null {
  if (groups.some((group) => group === null)) {
    return null;
  }
  return Array.from(new Set(groups.flatMap((group) => group ?? [])));
}

function determineRebuildArtifacts(
  changedFiles: string[],
  index: FirstRuntimeIndex
): FirstRuntimeArtifact[] {
  if (!isRuntimeHealthy(index)) {
    return [...FIRST_RUNTIME_ARTIFACTS];
  }

  const artifacts = new Set<FirstRuntimeArtifact>();
  const requiresFullRefresh = changedFiles.some((file) =>
    [
      'src/core/skill-runtime/first-bootstrap.ts',
      'src/core/skill-runtime/first-context.ts',
      'src/core/skill-runtime/first-doc-projection.ts',
      'src/core/skill-runtime/first-artifact-mapping.ts',
      'src/core/skill-runtime/first-runtime-store.ts',
      'src/core/skill-runtime/first-summary.ts',
    ].some((target) => file === target || file.endsWith(`/${target.split('/').at(-1)}`))
  );

  if (requiresFullRefresh) {
    return [...FIRST_RUNTIME_ARTIFACTS];
  }

  for (const file of changedFiles) {
    for (const artifact of matchRuntimeArtifactsByChangedFile(file)) {
      if (FIRST_RUNTIME_ARTIFACTS.includes(artifact as FirstRuntimeArtifact)) {
        artifacts.add(artifact as FirstRuntimeArtifact);
      }
    }
  }

  return Array.from(artifacts);
}

function getRuntimeArtifactRelativePath(artifact: FirstRuntimeArtifact): string {
  return `.spec-first/runtime/first/${artifact}`;
}

function getRuntimeArtifactFullPath(projectRoot: string, artifact: FirstRuntimeArtifact): string {
  switch (artifact) {
    case 'summary.json':
      return getFirstRuntimeSummaryPath(projectRoot);
    case 'steering.json':
      return getFirstSteeringPath(projectRoot);
    case 'conventions.json':
      return getFirstConventionsPath(projectRoot);
    case 'critical-flows.json':
      return getFirstCriticalFlowsPath(projectRoot);
    case 'entry-guide.json':
      return getFirstEntryGuidePath(projectRoot);
    case 'api-contracts.json':
      return getFirstApiContractsPath(projectRoot);
    case 'structure-overview.json':
      return getFirstStructureOverviewPath(projectRoot);
    case 'domain-model.json':
      return getFirstDomainModelPath(projectRoot);
    case 'database-schema.json':
      return getFirstDatabaseSchemaPath(projectRoot);
  }
}

function buildIndexEntry(path: string, now: string): FirstRuntimeAssetIndexEntry {
  if (!existsSync(path)) {
    return {
      path,
      fileHash: '',
      lastUpdated: now,
      healthy: false,
      issues: ['file missing'],
    };
  }

  const content = readFileSync(path, 'utf-8');
  return {
    path,
    fileHash: sha256Hex(content),
    lastUpdated: now,
    healthy: true,
  };
}

function syncRuntimeIndex(
  projectRoot: string,
  index: FirstRuntimeIndex,
  refreshedArtifacts: FirstRuntimeArtifact[],
  refreshedDocs: string[]
): FirstRuntimeIndex {
  const now = new Date().toISOString();
  const nextIndex: FirstRuntimeIndex = {
    ...index,
    lastRun: now,
    sourceCommit: getCurrentSourceCommit(projectRoot) ?? index.sourceCommit,
    docsProjection: { ...index.docsProjection },
  };

  for (const artifact of refreshedArtifacts) {
    const entry = {
      ...buildIndexEntry(getRuntimeArtifactFullPath(projectRoot, artifact), now),
      path: getRuntimeArtifactRelativePath(artifact),
    };

    switch (artifact) {
      case 'summary.json':
        nextIndex.summary = entry;
        break;
      case 'steering.json':
        nextIndex.steering = entry;
        break;
      case 'conventions.json':
        nextIndex.conventions = entry;
        break;
      case 'critical-flows.json':
        nextIndex.criticalFlows = entry;
        break;
      case 'entry-guide.json':
        nextIndex.entryGuide = entry;
        break;
      case 'api-contracts.json':
        nextIndex.apiContracts = entry;
        break;
      case 'structure-overview.json':
        nextIndex.structureOverview = entry;
        break;
      case 'domain-model.json':
        nextIndex.domainModel = entry;
        break;
      case 'database-schema.json':
        nextIndex.databaseSchema = {
          ...entry,
          status: entry.healthy ? 'healthy' : 'degraded',
        };
        break;
    }
  }

  for (const docPath of refreshedDocs) {
    nextIndex.docsProjection[docPath] = {
      ...buildIndexEntry(join(projectRoot, docPath), now),
      path: docPath,
    };
  }

  nextIndex.status = isRuntimeHealthy(nextIndex) ? 'current' : 'stale';
  nextIndex.staleReason =
    nextIndex.status === 'current'
      ? undefined
      : [
          ...(!nextIndex.summary.healthy ? ['summary unhealthy'] : []),
          ...(!nextIndex.steering.healthy ? ['steering unhealthy'] : []),
          ...(!nextIndex.conventions.healthy ? ['conventions unhealthy'] : []),
          ...(!nextIndex.criticalFlows.healthy ? ['critical-flows unhealthy'] : []),
          ...(!nextIndex.entryGuide.healthy ? ['entry-guide unhealthy'] : []),
          ...(!nextIndex.apiContracts.healthy ? ['api-contracts unhealthy'] : []),
          ...(!nextIndex.structureOverview.healthy ? ['structure-overview unhealthy'] : []),
          ...(!nextIndex.domainModel.healthy ? ['domain-model unhealthy'] : []),
          ...(nextIndex.databaseSchema.status === 'degraded'
            ? ['database-schema degraded']
            : []),
        ].join('；');

  return nextIndex;
}

export function loadFirstContext(projectRoot: string): FirstContext {
  const index = requireRuntimeAsset(readFirstRuntimeIndex(projectRoot), 'index');

  ensureHealthyRuntimeAsset(index, 'summary', 'summary');
  ensureHealthyRuntimeAsset(index, 'steering', 'steering');
  ensureHealthyRuntimeAsset(index, 'conventions', 'conventions');
  ensureHealthyRuntimeAsset(index, 'criticalFlows', 'critical-flows');
  ensureHealthyRuntimeAsset(index, 'entryGuide', 'entry-guide');
  ensureHealthyRuntimeAsset(index, 'apiContracts', 'api-contracts');
  ensureHealthyRuntimeAsset(index, 'structureOverview', 'structure-overview');
  ensureHealthyRuntimeAsset(index, 'domainModel', 'domain-model');
  ensureHealthyDatabaseSchema(index);

  return {
    index,
    summary: requireRuntimeAsset(readFirstRuntimeSummary(projectRoot), 'summary'),
    steering: requireRuntimeAsset(readFirstSteering(projectRoot), 'steering'),
    conventions: requireRuntimeAsset(readFirstConventions(projectRoot), 'conventions'),
    criticalFlows: requireRuntimeAsset(readFirstCriticalFlows(projectRoot), 'critical-flows'),
    entryGuide: requireRuntimeAsset(readFirstEntryGuide(projectRoot), 'entry-guide'),
    apiContracts: requireRuntimeAsset(readFirstApiContracts(projectRoot), 'api-contracts'),
    structureOverview: requireRuntimeAsset(
      readFirstStructureOverview(projectRoot),
      'structure-overview'
    ),
    domainModel: requireRuntimeAsset(readFirstDomainModel(projectRoot), 'domain-model'),
    databaseSchema: readFirstDatabaseSchema(projectRoot),
  };
}

export function refreshFirstArtifacts(
  projectRoot: string,
  mode: FirstRefreshMode
): FirstRefreshResult {
  const index = requireRuntimeAsset(readFirstRuntimeIndex(projectRoot), 'index');
  const workingTreeChangedFiles = getWorkingTreeChangedFiles(projectRoot);
  const currentCommit = getCurrentSourceCommit(projectRoot);
  const committedSourceChanges =
    mode === 'refresh-docs-from-runtime' ||
    index.sourceCommit === undefined ||
    currentCommit === null ||
    index.sourceCommit === currentCommit
      ? []
      : getCommittedSourceChanges(projectRoot, index.sourceCommit, currentCommit);
  const changedFiles = mergeChangedFiles(workingTreeChangedFiles, committedSourceChanges);

  if (
    mode !== 'refresh-docs-from-runtime' &&
    changedFiles !== null &&
    changedFiles.length === 0 &&
    isRuntimeHealthy(index)
  ) {
    return { mode, runtimeArtifacts: [], docsProjections: [] };
  }

  if (mode === 'refresh-docs-from-runtime') {
    const docsProjections = refreshFirstDocsFromRuntime(projectRoot, [...FIRST_RUNTIME_ARTIFACTS]);
    const nextIndex = syncRuntimeIndex(projectRoot, index, [], docsProjections);
    writeFirstRuntimeIndex(projectRoot, nextIndex);
    return { mode, runtimeArtifacts: [], docsProjections };
  }

  const rebuildArtifacts =
    changedFiles === null ? [...FIRST_RUNTIME_ARTIFACTS] : determineRebuildArtifacts(changedFiles, index);

  if (rebuildArtifacts.length === 0 && isRuntimeHealthy(index)) {
    return { mode, runtimeArtifacts: [], docsProjections: [] };
  }

  const bootstrap = bootstrapFirstRuntime(projectRoot, {
    platformType: readFirstRuntimeSummary(projectRoot)?.project.platformType as never,
  });
  return {
    mode,
    runtimeArtifacts: bootstrap.runtimeArtifacts,
    docsProjections: mode === 'refresh-runtime-only' ? [] : bootstrap.docsProjections,
  };
}

function hasHealthyRuntimeTruth(projectRoot: string): boolean {
  const index = readFirstRuntimeIndex(projectRoot);
  if (!index || !isRuntimeHealthy(index)) {
    return false;
  }

  return Boolean(
    readFirstRuntimeSummary(projectRoot) &&
      readFirstSteering(projectRoot) &&
      readFirstConventions(projectRoot) &&
      readFirstCriticalFlows(projectRoot) &&
      readFirstEntryGuide(projectRoot) &&
      readFirstApiContracts(projectRoot) &&
      readFirstStructureOverview(projectRoot) &&
      readFirstDomainModel(projectRoot) &&
      (index.databaseSchema.status === 'not_applicable' || readFirstDatabaseSchema(projectRoot))
  );
}

export function executeFirst(projectRoot: string): ExecuteFirstResult {
  if (hasHealthyRuntimeTruth(projectRoot)) {
    const result = refreshFirstArtifacts(projectRoot, 'refresh-all');
    return {
      runtimeArtifacts: result.runtimeArtifacts,
      docsProjections: result.docsProjections,
    };
  }

  throw new Error('No healthy runtime truth found. Use bootstrap instead.');
}

export function detectBackgroundInputStatus(projectRoot: string): BackgroundInputStatus {
  const runtimeIndex = readFirstRuntimeIndex(projectRoot);
  const runtimeSummary = readFirstRuntimeSummary(projectRoot);
  const runtimeSteering = readFirstSteering(projectRoot);
  const runtimeConventions = readFirstConventions(projectRoot);
  const runtimeCriticalFlows = readFirstCriticalFlows(projectRoot);
  const runtimeEntryGuide = readFirstEntryGuide(projectRoot);
  const runtimeApiContracts = readFirstApiContracts(projectRoot);
  const runtimeStructureOverview = readFirstStructureOverview(projectRoot);
  const runtimeDomainModel = readFirstDomainModel(projectRoot);
  const runtimeDatabaseSchema = readFirstDatabaseSchema(projectRoot);

  const databaseSchemaReady =
    runtimeIndex?.databaseSchema.status === 'not_applicable' ||
    runtimeDatabaseSchema?.status === 'healthy' ||
    runtimeDatabaseSchema?.status === 'not_applicable';

  if (
    runtimeIndex &&
    runtimeSummary &&
    runtimeSteering &&
    runtimeConventions &&
    runtimeCriticalFlows &&
    runtimeEntryGuide &&
    runtimeApiContracts &&
    runtimeStructureOverview &&
    runtimeDomainModel &&
    databaseSchemaReady &&
    isRuntimeHealthy(runtimeIndex)
  ) {
    return 'full';
  }

  if (
    runtimeIndex ||
    runtimeSummary ||
    runtimeSteering ||
    runtimeConventions ||
    runtimeCriticalFlows ||
    runtimeEntryGuide ||
    runtimeApiContracts ||
    runtimeStructureOverview ||
    runtimeDomainModel ||
    runtimeDatabaseSchema ||
    existsSync(join(projectRoot, 'docs', 'first'))
  ) {
    return 'degraded';
  }

  return 'blind';
}

export function syncBackgroundInputStatus(projectRoot: string): BackgroundInputSyncResult {
  const backgroundInputStatus = detectBackgroundInputStatus(projectRoot);
  const specsDir = join(projectRoot, 'specs');
  if (!existsSync(specsDir)) {
    return {
      backgroundInputStatus,
      updatedFeatures: [],
      skippedFeatures: [],
    };
  }

  const updatedFeatures: string[] = [];
  const skippedFeatures: string[] = [];
  for (const featureId of readdirSync(specsDir)) {
    const statePath = join(specsDir, featureId, 'stage-state.json');
    if (!existsSync(statePath)) {
      skippedFeatures.push(featureId);
      continue;
    }
    try {
      const state = readJson<Record<string, unknown>>(statePath);
      if (state.backgroundInputStatus === backgroundInputStatus) {
        skippedFeatures.push(featureId);
        continue;
      }
      writeJson(statePath, {
        ...state,
        backgroundInputStatus,
      });
      updatedFeatures.push(featureId);
    } catch {
      skippedFeatures.push(featureId);
    }
  }

  return {
    backgroundInputStatus,
    updatedFeatures,
    skippedFeatures,
  };
}
