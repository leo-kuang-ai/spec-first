import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { BackgroundInputStatus } from '../../shared/types.js';
import {
  FIRST_RUNTIME_ARTIFACTS,
  matchRuntimeArtifactsByChangedFile,
} from './first-artifact-mapping.js';
import { refreshFirstDocsFromRuntime } from './first-doc-projection.js';
import { buildRoleViews } from './first-role-views.js';
import {
  getFirstRoleViewsPath,
  getFirstRuntimeSummaryPath,
  getFirstStageViewsPath,
  readFirstRoleViews,
  readFirstRuntimeIndex,
  readFirstRuntimeSummary,
  readFirstStageViews,
  writeFirstRoleViews,
  writeFirstRuntimeIndex,
  writeFirstRuntimeSummary,
  writeFirstStageViews,
} from './first-runtime-store.js';
import type {
  FirstRoleView,
  FirstRuntimeAssetIndexEntry,
  FirstRuntimeIndex,
  FirstRuntimeRole,
  FirstRuntimeStage,
  FirstRuntimeSummary,
  FirstRoleViews,
  FirstStageViews,
} from './first-runtime-types.js';
import { buildStageViews } from './first-stage-views.js';
import { buildFirstSummary } from './first-summary.js';
import { sha256Hex } from '../../shared/crypto-utils.js';

export const FIRST_REFRESH_MODES = [
  'refresh-runtime-only',
  'refresh-docs-from-runtime',
  'refresh-all',
] as const;

export type FirstRefreshMode = (typeof FIRST_REFRESH_MODES)[number];
type FirstRuntimeArtifact = (typeof FIRST_RUNTIME_ARTIFACTS)[number];

export interface FirstContext {
  index: FirstRuntimeIndex;
  summary: FirstRuntimeSummary;
  roleViews: FirstRoleViews;
  stageViews: FirstStageViews;
}

export interface FirstRefreshResult {
  mode: FirstRefreshMode;
  runtimeArtifacts: string[];
  docsProjections: string[];
}

function requireRuntimeAsset<T>(asset: T | null, label: string): T {
  if (asset === null) {
    throw new Error(`Missing first runtime asset: ${label}`);
  }
  return asset;
}

function ensureHealthyRuntimeAsset(
  index: FirstRuntimeIndex,
  assetName: 'summary' | 'roleViews' | 'stageViews',
  label: 'summary' | 'role-views' | 'stage-views',
): void {
  const asset = index[assetName];
  if (!asset.healthy) {
    const reason = asset.issues?.join('；') || index.staleReason || 'runtime asset unhealthy';
    throw new Error(`${label}: ${reason}`);
  }
}

function ensureHealthyStageViews(index: FirstRuntimeIndex): void {
  ensureHealthyRuntimeAsset(index, 'stageViews', 'stage-views');
}

function isRuntimeHealthy(index: FirstRuntimeIndex): boolean {
  return index.status === 'current'
    && index.summary.healthy
    && index.roleViews.healthy
    && index.stageViews.healthy;
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
      .map(line => line.slice(3).trim())
      .map(path => path.includes(' -> ') ? path.split(' -> ').at(-1) ?? path : path)
      .map(path => path.replace(/^"|"$/g, ''))
      .filter(Boolean);
  } catch {
    return null;
  }
}

function getCommittedSourceChanges(projectRoot: string, fromCommit: string, toCommit: string): string[] | null {
  try {
    const output = execFileSync('git', ['diff', '--name-only', `${fromCommit}..${toCommit}`], {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();

    if (output === '') {
      return [];
    }

    return Array.from(new Set(
      output
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .filter(line => !line.startsWith('.spec-first/runtime/first/'))
        .filter(line => !line.startsWith('docs/first/')),
    ));
  } catch {
    return null;
  }
}

function mergeChangedFiles(...groups: Array<string[] | null>): string[] | null {
  if (groups.some(group => group === null)) {
    return null;
  }

  return Array.from(new Set(groups.flatMap(group => group ?? [])));
}

function normalizeRuntimeArtifactList(runtimeArtifacts: string[]): FirstRuntimeArtifact[] {
  return runtimeArtifacts.filter(
    (artifact): artifact is FirstRuntimeArtifact => FIRST_RUNTIME_ARTIFACTS.includes(artifact as FirstRuntimeArtifact),
  );
}

function determineImpactedRuntimeArtifacts(changedFiles: string[]): FirstRuntimeArtifact[] {
  return Array.from(new Set(changedFiles.flatMap(file => normalizeRuntimeArtifactList(matchRuntimeArtifactsByChangedFile(file)))));
}

function determineRebuildArtifacts(changedFiles: string[], index: FirstRuntimeIndex): FirstRuntimeArtifact[] {
  if (!isRuntimeHealthy(index)) {
    return [...FIRST_RUNTIME_ARTIFACTS];
  }

  const artifacts = new Set<FirstRuntimeArtifact>();

  for (const file of changedFiles) {
    if (file.endsWith('/first-summary.ts') || file === 'src/core/skill-runtime/first-summary.ts') {
      artifacts.add('summary.json');
      artifacts.add('role-views.json');
      artifacts.add('stage-views.json');
      continue;
    }

    if (file.endsWith('/first-role-views.ts') || file === 'src/core/skill-runtime/first-role-views.ts') {
      artifacts.add('role-views.json');
      continue;
    }

    if (file.endsWith('/first-stage-views.ts') || file === 'src/core/skill-runtime/first-stage-views.ts') {
      artifacts.add('stage-views.json');
      continue;
    }

    if (
      file.endsWith('/first-runtime-store.ts')
      || file === 'src/core/skill-runtime/first-runtime-store.ts'
      || file.endsWith('/first-context.ts')
      || file === 'src/core/skill-runtime/first-context.ts'
      || file.endsWith('/first-doc-projection.ts')
      || file === 'src/core/skill-runtime/first-doc-projection.ts'
      || file.endsWith('/first-artifact-mapping.ts')
      || file === 'src/core/skill-runtime/first-artifact-mapping.ts'
    ) {
      artifacts.add('summary.json');
      artifacts.add('role-views.json');
      artifacts.add('stage-views.json');
    }
  }

  return Array.from(artifacts);
}

function getRuntimeArtifactRelativePath(artifact: FirstRuntimeArtifact): string {
  return `.spec-first/runtime/first/${artifact}`;
}

function getRuntimeArtifactFullPath(projectRoot: string, artifact: FirstRuntimeArtifact): string {
  if (artifact === 'summary.json') {
    return getFirstRuntimeSummaryPath(projectRoot);
  }
  if (artifact === 'role-views.json') {
    return getFirstRoleViewsPath(projectRoot);
  }
  return getFirstStageViewsPath(projectRoot);
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

function buildDocIndexEntry(projectRoot: string, docPath: string, now: string): FirstRuntimeAssetIndexEntry {
  return buildIndexEntry(join(projectRoot, docPath), now);
}

function rewriteRuntimeArtifacts(projectRoot: string, artifacts: FirstRuntimeArtifact[]): FirstRuntimeArtifact[] {
  if (artifacts.length === 0) {
    return [];
  }

  let summary = requireRuntimeAsset(readFirstRuntimeSummary(projectRoot), 'summary');
  const rewritten = new Set<FirstRuntimeArtifact>();

  if (artifacts.includes('summary.json')) {
    summary = buildFirstSummary({
      generatedAt: new Date().toISOString(),
      mode: summary.mode,
      projectName: summary.project.name,
      platformType: summary.project.platformType,
      overview: summary.project.overview,
      modules: summary.modules,
      capabilities: summary.capabilities,
      entryPoints: summary.entryPoints,
      dataModels: summary.dataModels,
      apiSurface: summary.apiSurface,
      risks: summary.risks,
      evidence: summary.evidence,
    });
    writeFirstRuntimeSummary(projectRoot, summary);
    rewritten.add('summary.json');
  }

  if (artifacts.includes('role-views.json')) {
    writeFirstRoleViews(projectRoot, buildRoleViews(summary));
    rewritten.add('role-views.json');
  }

  if (artifacts.includes('stage-views.json')) {
    writeFirstStageViews(projectRoot, buildStageViews(summary));
    rewritten.add('stage-views.json');
  }

  return Array.from(rewritten);
}

function syncRuntimeIndex(
  projectRoot: string,
  index: FirstRuntimeIndex,
  rewrittenArtifacts: FirstRuntimeArtifact[],
  refreshedDocs: string[],
): FirstRuntimeIndex {
  const now = new Date().toISOString();
  const nextIndex: FirstRuntimeIndex = {
    ...index,
    lastRun: now,
    sourceCommit: getCurrentSourceCommit(projectRoot) ?? index.sourceCommit,
    docsProjection: { ...index.docsProjection },
  };

  for (const artifact of rewrittenArtifacts) {
    const entry = buildIndexEntry(getRuntimeArtifactFullPath(projectRoot, artifact), now);
    if (artifact === 'summary.json') {
      nextIndex.summary = { ...entry, path: getRuntimeArtifactRelativePath(artifact) };
      continue;
    }
    if (artifact === 'role-views.json') {
      nextIndex.roleViews = { ...entry, path: getRuntimeArtifactRelativePath(artifact) };
      continue;
    }
    nextIndex.stageViews = { ...entry, path: getRuntimeArtifactRelativePath(artifact) };
  }

  for (const docPath of refreshedDocs) {
    nextIndex.docsProjection[docPath] = {
      ...buildDocIndexEntry(projectRoot, docPath, now),
      path: docPath,
    };
  }

  const summaryHealthy = nextIndex.summary.healthy;
  const roleHealthy = nextIndex.roleViews.healthy;
  const stageHealthy = nextIndex.stageViews.healthy;

  nextIndex.status = summaryHealthy && roleHealthy && stageHealthy ? 'current' : 'stale';
  nextIndex.staleReason = nextIndex.status === 'current'
    ? undefined
    : [
      ...(!summaryHealthy ? ['summary unhealthy'] : []),
      ...(!roleHealthy ? ['role-views unhealthy'] : []),
      ...(!stageHealthy ? ['stage-views unhealthy'] : []),
    ].join('；');

  return nextIndex;
}

export function loadFirstContext(projectRoot: string): FirstContext {
  const index = requireRuntimeAsset(readFirstRuntimeIndex(projectRoot), 'index');

  ensureHealthyRuntimeAsset(index, 'summary', 'summary');
  ensureHealthyRuntimeAsset(index, 'roleViews', 'role-views');
  ensureHealthyStageViews(index);

  const summary = requireRuntimeAsset(readFirstRuntimeSummary(projectRoot), 'summary');
  const stageViews = requireRuntimeAsset(readFirstStageViews(projectRoot), 'stage-views');
  const roleViews = requireRuntimeAsset(readFirstRoleViews(projectRoot), 'role-views');

  return {
    index,
    summary,
    roleViews,
    stageViews,
  };
}

export function loadStageView(projectRoot: string, stage: FirstRuntimeStage) {
  const index = requireRuntimeAsset(readFirstRuntimeIndex(projectRoot), 'index');
  ensureHealthyStageViews(index);

  const stageViews = requireRuntimeAsset(readFirstStageViews(projectRoot), 'stage-views');
  return stageViews[stage];
}

export function loadFirstRoleView(projectRoot: string, role: FirstRuntimeRole): FirstRoleView {
  const index = requireRuntimeAsset(readFirstRuntimeIndex(projectRoot), 'index');
  ensureHealthyRuntimeAsset(index, 'roleViews', 'role-views');

  const roleViews = requireRuntimeAsset(readFirstRoleViews(projectRoot), 'role-views');
  return roleViews[role];
}

export function refreshFirstArtifacts(
  projectRoot: string,
  mode: FirstRefreshMode,
): FirstRefreshResult {
  const index = requireRuntimeAsset(readFirstRuntimeIndex(projectRoot), 'index');
  const workingTreeChangedFiles = getWorkingTreeChangedFiles(projectRoot);
  const currentCommit = getCurrentSourceCommit(projectRoot);
  const committedSourceChanges = mode === 'refresh-docs-from-runtime'
    || index.sourceCommit === undefined
    || currentCommit === null
    || index.sourceCommit === currentCommit
    ? []
    : getCommittedSourceChanges(projectRoot, index.sourceCommit, currentCommit);
  const changedFiles = mergeChangedFiles(workingTreeChangedFiles, committedSourceChanges);

  if (mode !== 'refresh-docs-from-runtime' && changedFiles !== null && changedFiles.length === 0 && isRuntimeHealthy(index)) {
    return {
      mode,
      runtimeArtifacts: [],
      docsProjections: [],
    };
  }

  const impactedRuntimeArtifacts = mode === 'refresh-docs-from-runtime'
    ? [...FIRST_RUNTIME_ARTIFACTS]
    : changedFiles === null
      ? [...FIRST_RUNTIME_ARTIFACTS]
      : determineImpactedRuntimeArtifacts(changedFiles);
  const rebuildArtifacts = mode === 'refresh-docs-from-runtime'
    ? []
    : changedFiles === null
      ? [...FIRST_RUNTIME_ARTIFACTS]
      : determineRebuildArtifacts(changedFiles, index);
  const docsArtifacts = mode === 'refresh-runtime-only'
    ? []
    : mode === 'refresh-docs-from-runtime'
      ? [...FIRST_RUNTIME_ARTIFACTS]
      : Array.from(new Set<FirstRuntimeArtifact>([...impactedRuntimeArtifacts, ...rebuildArtifacts]));

  if (rebuildArtifacts.length === 0 && docsArtifacts.length === 0) {
    return {
      mode,
      runtimeArtifacts: [],
      docsProjections: [],
    };
  }

  const runtimeArtifacts = rewriteRuntimeArtifacts(projectRoot, rebuildArtifacts);
  let nextIndex = syncRuntimeIndex(projectRoot, index, runtimeArtifacts, []);

  if (runtimeArtifacts.length > 0) {
    writeFirstRuntimeIndex(projectRoot, nextIndex);
  }

  const docsProjections = docsArtifacts.length > 0
    ? refreshFirstDocsFromRuntime(projectRoot, docsArtifacts)
    : [];

  if (docsProjections.length > 0 || runtimeArtifacts.length > 0) {
    nextIndex = syncRuntimeIndex(projectRoot, nextIndex, [], docsProjections);
    writeFirstRuntimeIndex(projectRoot, nextIndex);
  }

  return {
    mode,
    runtimeArtifacts,
    docsProjections,
  };
}

export function detectBackgroundInputStatus(projectRoot: string): BackgroundInputStatus {
  const runtimeIndex = readFirstRuntimeIndex(projectRoot);
  const runtimeSummary = readFirstRuntimeSummary(projectRoot);
  const runtimeRoleViews = readFirstRoleViews(projectRoot);
  const runtimeStageViews = readFirstStageViews(projectRoot);

  if (
    runtimeIndex
    && runtimeSummary
    && runtimeRoleViews
    && runtimeStageViews
    && runtimeIndex.summary.healthy
    && runtimeIndex.roleViews.healthy
    && runtimeIndex.stageViews.healthy
  ) {
    return 'full';
  }

  if (runtimeIndex || runtimeSummary || runtimeRoleViews || runtimeStageViews || existsSync(join(projectRoot, 'docs', 'first'))) {
    return 'degraded';
  }

  return 'blind';
}
