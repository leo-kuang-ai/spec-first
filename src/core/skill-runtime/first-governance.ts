import { execFileSync } from 'node:child_process';
import { bootstrapFirstRuntime } from './first-bootstrap.js';
import { detectStructuralChanges, type StructuralChange } from './first-change-detection.js';
import {
  BASE_PROJECTION_DOCS,
  CONDITIONAL_PROJECTION_DOCS,
  FORMAL_TOPIC_PROJECTION_DOCS,
  matchRuntimeArtifactsByChangedFile,
} from './first-artifact-mapping.js';
import { refreshFirstArtifacts, syncBackgroundInputStatus, type FirstRefreshResult } from './first-context.js';
import { incrementalUpdateRuntimeAssets } from './first-incremental-update.js';
import {
  getFirstProjectCognitionUpdatesPath,
  readFirstRuntimeIndex,
} from './first-runtime-store.js';
import { readLog, writeLog } from '../../shared/logger.js';
import { Stage } from '../../shared/types.js';

export type ProjectCognitionDecision = 'must_update' | 'should_update' | 'must_not_update';
export type ProjectCognitionGateStatus = 'approved' | 'skipped' | 'blocked';

export interface ProjectCognitionDiff {
  triggerStage: Stage.WRAP_UP | Stage.DONE;
  changedFiles: string[];
  decision: ProjectCognitionDecision;
  reasons: string[];
  suggestedAssets: string[];
  evidence: string[];
  structuralChanges: StructuralChange[];
}

export interface ProjectCognitionWritebackResult {
  diff: ProjectCognitionDiff;
  gateStatus: ProjectCognitionGateStatus;
  gateReason: string;
  updatedAssets: string[];
  updatedRuntimeAssets: string[];
  updatedBaseDocs: string[];
  updatedTopicDocs: string[];
  updatedConditionalDocs: string[];
  conditionalStatuses: Record<string, 'healthy' | 'not_applicable' | 'degraded'>;
  writebackMode?: 'bootstrap' | 'refresh-all' | 'refresh-docs-from-runtime' | 'incremental-structural-update';
  refreshResult?: FirstRefreshResult;
  writebackPerformed: boolean;
}

export interface ProjectCognitionMemoryMetadata {
  topicKey: string;
  assetId: string;
  updateSource: 'governance-wrap-up' | 'governance-done';
}

const PROJECT_COGNITION_TOPIC_KEY = 'project-cognition/first';

const MUST_UPDATE_PATTERNS = [
  /^src\/core\/skill-runtime\/first-[a-z0-9-]+\.ts$/,
  /^src\/core\/skill-runtime\/first-runtime-store\.ts$/,
  /^src\/core\/skill-runtime\/first-runtime-types\.ts$/,
  /^src\/core\/skill-runtime\/first-bootstrap\.ts$/,
  /^src\/core\/skill-runtime\/first-doc-projection\.ts$/,
  /^src\/core\/skill-runtime\/first-artifact-mapping\.ts$/,
  /^src\/core\/skill-runtime\/first-context\.ts$/,
  /^src\/core\/skill-runtime\/first-governance\.ts$/,
  /^src\/core\/process-engine\/advance\.ts$/,
  /^src\/cli\/commands\/first\.ts$/,
];

const SHOULD_UPDATE_PATTERNS = [
  /^docs\/first\/.+\.md$/,
  /^tests\/unit\/first-.+\.test\.ts$/,
  /^tests\/unit\/context-resolver\.test\.ts$/,
  /^tests\/unit\/dispatcher-first-runtime\.test\.ts$/,
  /^tests\/unit\/skill-runtime\.test\.ts$/,
  /^src\/core\/skill-runtime\/context-resolver\.ts$/,
  /^src\/core\/skill-runtime\/dispatcher\.ts$/,
];

function safeExecFiles(projectRoot: string, args: string[]): string[] {
  try {
    const output = execFileSync('git', args, {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (!output) return [];
    return output
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function getWorkingTreeChangedFiles(projectRoot: string): string[] {
  try {
    const output = execFileSync('git', ['status', '--porcelain'], {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return output
      .split('\n')
      .filter(Boolean)
      .map((line) => line.slice(3).trim())
      .map((path) => (path.includes(' -> ') ? (path.split(' -> ').at(-1) ?? path) : path))
      .map((path) => path.replace(/^"|"$/g, ''))
      .filter(Boolean);
  } catch {
    return [];
  }
}

function getLastCommittedChangedFiles(projectRoot: string): string[] {
  const hasParent = safeExecFiles(projectRoot, ['rev-parse', '--verify', 'HEAD~1']);
  if (hasParent.length === 0) return [];
  return safeExecFiles(projectRoot, ['diff', '--name-only', 'HEAD~1..HEAD']);
}

function collectProjectCognitionChangedFiles(projectRoot: string): string[] {
  const workingTreeChangedFiles = getWorkingTreeChangedFiles(projectRoot);
  if (workingTreeChangedFiles.length > 0) {
    return workingTreeChangedFiles;
  }
  return getLastCommittedChangedFiles(projectRoot);
}

function matchesAny(path: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(path));
}

function inferDecision(changedFiles: string[]): {
  decision: ProjectCognitionDecision;
  reasons: string[];
  evidence: string[];
} {
  const mustUpdateFiles = changedFiles.filter((file) => matchesAny(file, MUST_UPDATE_PATTERNS));
  if (mustUpdateFiles.length > 0) {
    return {
      decision: 'must_update',
      reasons: ['detected canonical first runtime source changes'],
      evidence: mustUpdateFiles.slice(0, 10),
    };
  }

  const shouldUpdateFiles = changedFiles.filter((file) => matchesAny(file, SHOULD_UPDATE_PATTERNS));
  if (shouldUpdateFiles.length > 0) {
    return {
      decision: 'should_update',
      reasons: ['detected first consumption or canonical docs changes'],
      evidence: shouldUpdateFiles.slice(0, 10),
    };
  }

  return {
    decision: 'must_not_update',
    reasons: ['no project-level cognition changes detected'],
    evidence: changedFiles.slice(0, 10),
  };
}

function collectSuggestedAssets(changedFiles: string[]): string[] {
  return Array.from(
    new Set(changedFiles.flatMap((file) => matchRuntimeArtifactsByChangedFile(file)))
  );
}

function inferProjectCognitionMemoryMetadata(
  diff: ProjectCognitionDiff,
  updatedAssets: string[]
): ProjectCognitionMemoryMetadata {
  const runtimeAsset = updatedAssets.find((asset) => asset.endsWith('.json'));
  const docsAsset = updatedAssets.find((asset) => asset.startsWith('docs/first/'));
  const assetId =
    (diff.decision === 'must_update'
      ? diff.suggestedAssets[0] ?? runtimeAsset
      : docsAsset ?? diff.changedFiles.find((file) => file.startsWith('docs/first/'))) ??
    runtimeAsset ??
    docsAsset ??
    diff.changedFiles[0] ??
    'project-cognition';

  return {
    topicKey: PROJECT_COGNITION_TOPIC_KEY,
    assetId,
    updateSource: diff.triggerStage === Stage.WRAP_UP ? 'governance-wrap-up' : 'governance-done',
  };
}

function partitionUpdatedDocs(updatedAssets: string[]): {
  updatedRuntimeAssets: string[];
  updatedBaseDocs: string[];
  updatedTopicDocs: string[];
  updatedConditionalDocs: string[];
} {
  return {
    updatedRuntimeAssets: updatedAssets.filter((asset) => asset.endsWith('.json')),
    updatedBaseDocs: updatedAssets.filter((asset) =>
      BASE_PROJECTION_DOCS.includes(asset as (typeof BASE_PROJECTION_DOCS)[number])
    ),
    updatedTopicDocs: updatedAssets.filter((asset) =>
      FORMAL_TOPIC_PROJECTION_DOCS.includes(asset as (typeof FORMAL_TOPIC_PROJECTION_DOCS)[number])
    ),
    updatedConditionalDocs: updatedAssets.filter((asset) =>
      CONDITIONAL_PROJECTION_DOCS.includes(asset as (typeof CONDITIONAL_PROJECTION_DOCS)[number])
    ),
  };
}

function readConditionalStatuses(projectRoot: string): Record<string, 'healthy' | 'not_applicable' | 'degraded'> {
  const index = readFirstRuntimeIndex(projectRoot);
  if (!index) {
    return {};
  }

  return {
    databaseSchema: index.databaseSchema.status,
  };
}

export function analyzeProjectCognitionDiff(
  projectRoot: string,
  triggerStage: Stage.WRAP_UP | Stage.DONE,
  featureId?: string
): ProjectCognitionDiff {
  const changedFiles = collectProjectCognitionChangedFiles(projectRoot).filter(
    (file) => !file.startsWith('.spec-first/runtime/first/')
  );
  const structuralChanges = featureId ? detectStructuralChanges(projectRoot, featureId) : [];
  if (structuralChanges.length > 0) {
    const suggestedAssets = Array.from(
      new Set(
        structuralChanges.flatMap((change) => matchRuntimeArtifactsByChangedFile(change.evidence.split('#')[0] ?? ''))
      )
    );
    const fallbackAssets = Array.from(
      new Set(
        structuralChanges.flatMap((change) => {
          switch (change.type) {
            case 'module':
              return ['summary.json', 'structure-overview.json'];
            case 'api':
              return ['summary.json', 'api-contracts.json'];
            case 'risk':
              return ['summary.json'];
            case 'flow':
              return ['critical-flows.json', 'entry-guide.json'];
            case 'convention':
              return ['conventions.json'];
            case 'tech-stack':
              return ['summary.json'];
          }
        })
      )
    );
    return {
      triggerStage,
      changedFiles,
      decision: 'must_update',
      reasons: ['detected structural feature changes'],
      suggestedAssets: suggestedAssets.length > 0 ? suggestedAssets : fallbackAssets,
      evidence: structuralChanges.map((change) => change.evidence).slice(0, 10),
      structuralChanges,
    };
  }
  const inferred = inferDecision(changedFiles);

  return {
    triggerStage,
    changedFiles,
    decision: inferred.decision,
    reasons: inferred.reasons,
    suggestedAssets: collectSuggestedAssets(changedFiles),
    evidence: inferred.evidence,
    structuralChanges: [],
  };
}

function ensureFirstRuntime(projectRoot: string): 'bootstrap' | undefined {
  if (readFirstRuntimeIndex(projectRoot)) return undefined;
  bootstrapFirstRuntime(projectRoot, {});
  return 'bootstrap';
}

export function getProjectCognitionUpdateRecords(projectRoot: string): Record<string, unknown>[] {
  return readLog(getFirstProjectCognitionUpdatesPath(projectRoot));
}

export function applyProjectCognitionWriteback(
  featureId: string,
  projectRoot: string,
  triggerStage: Stage.WRAP_UP | Stage.DONE
): ProjectCognitionWritebackResult {
  const diff = analyzeProjectCognitionDiff(projectRoot, triggerStage, featureId);
  let gateStatus: ProjectCognitionGateStatus = 'skipped';
  let gateReason = diff.reasons.join('; ');
  let updatedAssets: string[] = [];
  let writebackMode: ProjectCognitionWritebackResult['writebackMode'];
  let refreshResult: FirstRefreshResult | undefined;
  let writebackPerformed = false;

  if (diff.decision !== 'must_not_update') {
    try {
      const bootstrapMode = ensureFirstRuntime(projectRoot);
      if (bootstrapMode) {
        writebackMode = bootstrapMode;
        writebackPerformed = true;
      }

      if (diff.structuralChanges.length > 0) {
        writebackMode = 'incremental-structural-update';
        const result = incrementalUpdateRuntimeAssets(projectRoot, featureId, diff.structuralChanges);
        updatedAssets = Array.from(
          new Set([...result.updatedRuntimeAssets, ...result.docsProjections])
        );
        writebackPerformed =
          writebackPerformed ||
          result.updatedRuntimeAssets.length > 0 ||
          result.docsProjections.length > 0;
      } else if (diff.decision === 'must_update') {
        writebackMode = 'refresh-all';
        refreshResult = refreshFirstArtifacts(projectRoot, 'refresh-all');
        updatedAssets = Array.from(
          new Set([...refreshResult.runtimeArtifacts, ...refreshResult.docsProjections])
        );
        writebackPerformed =
          writebackPerformed ||
          refreshResult.runtimeArtifacts.length > 0 ||
          refreshResult.docsProjections.length > 0;
      } else {
        writebackMode = 'refresh-docs-from-runtime';
        refreshResult = refreshFirstArtifacts(projectRoot, 'refresh-docs-from-runtime');
        updatedAssets =
          refreshResult.docsProjections.length > 0
            ? refreshResult.docsProjections
            : diff.changedFiles.filter((file) => file.startsWith('docs/first/'));
        writebackPerformed =
          writebackPerformed ||
          refreshResult.runtimeArtifacts.length > 0 ||
          refreshResult.docsProjections.length > 0;
      }

      gateStatus = 'approved';
      gateReason =
        diff.structuralChanges.length > 0
          ? 'structural project cognition writeback approved'
          : diff.decision === 'must_update'
          ? 'project cognition writeback approved'
          : 'canonical docs projection refresh approved';

      if (writebackPerformed) {
        syncBackgroundInputStatus(projectRoot);
      }
    } catch (error) {
      gateStatus = 'blocked';
      gateReason = error instanceof Error ? error.message : String(error);
    }
  }

  const memoryMetadata = inferProjectCognitionMemoryMetadata(diff, updatedAssets);
  const partitioned = partitionUpdatedDocs(updatedAssets);
  const conditionalStatuses = readConditionalStatuses(projectRoot);

  writeLog(getFirstProjectCognitionUpdatesPath(projectRoot), {
    event: 'project_cognition_update',
    featureId,
    triggerStage,
    decision: diff.decision,
    gateStatus,
    gateReason,
    changedFiles: diff.changedFiles,
    structuralChanges: diff.structuralChanges,
    updatedAssets,
    updatedRuntimeAssets: partitioned.updatedRuntimeAssets,
    updatedBaseDocs: partitioned.updatedBaseDocs,
    updatedTopicDocs: partitioned.updatedTopicDocs,
    updatedConditionalDocs: partitioned.updatedConditionalDocs,
    conditionalStatuses,
    evidence: diff.evidence,
    writebackMode,
    writebackPerformed,
    topicKey: memoryMetadata.topicKey,
    assetId: memoryMetadata.assetId,
    updateSource: memoryMetadata.updateSource,
  });

  return {
    diff,
    gateStatus,
    gateReason,
    updatedAssets,
    updatedRuntimeAssets: partitioned.updatedRuntimeAssets,
    updatedBaseDocs: partitioned.updatedBaseDocs,
    updatedTopicDocs: partitioned.updatedTopicDocs,
    updatedConditionalDocs: partitioned.updatedConditionalDocs,
    conditionalStatuses,
    writebackMode,
    refreshResult,
    writebackPerformed,
  };
}

export function formatProjectCognitionWritebackFinding(
  result: ProjectCognitionWritebackResult
): string {
  return [
    `PROJECT_COGNITION_${result.gateStatus.toUpperCase()}: ${result.diff.decision}`,
    `trigger=${result.diff.triggerStage}`,
    `updated=${result.updatedAssets.length > 0 ? result.updatedAssets.join(',') : 'none'}`,
    `reason=${result.gateReason}`,
  ].join(' | ');
}
