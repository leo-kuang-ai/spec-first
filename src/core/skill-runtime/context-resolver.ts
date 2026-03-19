import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { BackgroundInputStatus } from '../../shared/types.js';
import { detectBackgroundInputStatus } from './first-context.js';
import { readCurrentFeatureId } from './execution-context.js';
import {
  readFirstApiContracts,
  readFirstConventions,
  readFirstCriticalFlows,
  readFirstDatabaseSchema,
  readFirstDocsIndex,
  readFirstDomainModel,
  readFirstEntryGuide,
  readFirstRuntimeIndex,
  readFirstRuntimeSummary,
  readFirstSteering,
  readFirstStructureOverview,
} from './first-runtime-store.js';
import { CANONICAL_PROJECTION_DOCS } from './first-artifact-mapping.js';
import type {
  FirstApiContracts,
  FirstConventions,
  FirstCriticalFlows,
  FirstDatabaseSchema,
  FirstDocsIndex,
  FirstDomainModel,
  FirstEntryGuide,
  FirstSteering,
  FirstStructureOverview,
} from './first-runtime-types.js';

export type ResolvedContextSource = 'runtime' | 'docs' | 'none';

export interface FirstSummaryLite {
  projectName: string;
  platformType?: string;
  techStack: string[];
  modules: string[];
  risks: string[];
}

export interface ResolvedSkillContext {
  featureId?: string;
  skillName: string;
  source: ResolvedContextSource;
  backgroundInputStatus: BackgroundInputStatus;
  contextSummary?: string;
  onboardingSummary?: string;
  firstSummaryLite?: FirstSummaryLite;
  docsIndex?: FirstDocsIndex;
  requiredAssetNames: string[];
  optionalAssetNames: string[];
  missingRequiredAssets: string[];
  required: {
    steering?: FirstSteering;
    conventions?: FirstConventions;
    criticalFlows?: FirstCriticalFlows;
    entryGuide?: FirstEntryGuide;
    apiContracts?: FirstApiContracts;
    structureOverview?: FirstStructureOverview;
    domainModel?: FirstDomainModel;
    databaseSchema?: FirstDatabaseSchema;
  };
  optional: {
    steering?: FirstSteering;
    conventions?: FirstConventions;
    criticalFlows?: FirstCriticalFlows;
    entryGuide?: FirstEntryGuide;
    apiContracts?: FirstApiContracts;
    structureOverview?: FirstStructureOverview;
    domainModel?: FirstDomainModel;
    databaseSchema?: FirstDatabaseSchema;
  };
  fallback: {
    source: ResolvedContextSource;
    warning?: string;
  };
  missingAssets: string[];
  recommendedAction?: string;
}

type StageViewKey = 'spec' | 'design' | 'code' | 'verify';
type RuntimeAssetName =
  | 'summary'
  | 'steering'
  | 'conventions'
  | 'critical-flows'
  | 'entry-guide'
  | 'api-contracts'
  | 'structure-overview'
  | 'domain-model'
  | 'database-schema';

const ALL_RUNTIME_ASSETS: RuntimeAssetName[] = [
  'summary',
  'steering',
  'conventions',
  'critical-flows',
  'entry-guide',
  'api-contracts',
  'structure-overview',
  'domain-model',
  'database-schema',
];

const BACKGROUND_SKILLS = new Set(['task', 'plan', 'orchestrate', 'status', 'analyze']);

interface SkillAssetContract {
  required: RuntimeAssetName[];
  optional: RuntimeAssetName[];
}

/**
 * Skill 输入矩阵：定义每个 skill 需要的 runtime 资产
 * - required: 必需资产，缺失时降级到 docs 或 none
 * - optional: 可选资产，缺失时不影响执行
 */
const SKILL_INPUT_MATRIX: Record<string, SkillAssetContract> = {
  onboarding: {
    required: ['steering'],
    optional: ['entry-guide', 'structure-overview'],
  },
  catchup: {
    required: ['summary'],
    optional: ['entry-guide', 'structure-overview', 'steering'],
  },
  spec: {
    required: ['summary'],
    optional: ['domain-model', 'conventions'],
  },
  'spec-review': {
    required: ['summary'],
    optional: ['domain-model', 'conventions'],
  },
  research: {
    required: ['summary'],
    optional: ['critical-flows', 'api-contracts'],
  },
  design: {
    required: ['summary'],
    optional: ['structure-overview', 'api-contracts', 'critical-flows', 'steering'],
  },
  task: {
    required: ['summary'],
    optional: ['entry-guide', 'critical-flows', 'structure-overview', 'api-contracts'],
  },
  plan: {
    required: ['summary'],
    optional: ['entry-guide', 'critical-flows', 'structure-overview', 'api-contracts'],
  },
  orchestrate: {
    required: ['summary'],
    optional: ['entry-guide', 'critical-flows', 'structure-overview', 'api-contracts'],
  },
  code: {
    required: ['summary'],
    optional: ['conventions', 'entry-guide', 'structure-overview', 'api-contracts'],
  },
  review: {
    required: ['summary'],
    optional: ['conventions', 'entry-guide', 'structure-overview', 'api-contracts'],
  },
  archive: {
    required: ['summary'],
    optional: ['structure-overview', 'domain-model'],
  },
  verify: {
    required: ['summary'],
    optional: ['critical-flows', 'conventions', 'database-schema'],
  },
  status: {
    required: ['summary'],
    optional: ['critical-flows', 'structure-overview', 'domain-model'],
  },
  analyze: {
    required: ['summary'],
    optional: ['critical-flows', 'structure-overview', 'domain-model'],
  },
  doctor: {
    required: ['summary'],
    optional: ['conventions', 'entry-guide', 'database-schema'],
  },
  sync: {
    required: ['summary'],
    optional: ['entry-guide', 'structure-overview', 'api-contracts'],
  },
  feature: {
    required: ['summary'],
    optional: ['structure-overview', 'entry-guide'],
  },
};

interface RuntimeAssetSnapshot {
  summary?: FirstSummaryLite;
  onboardingSummary?: string;
  stageSummaries: Partial<Record<StageViewKey, string>>;
  steering?: FirstSteering;
  conventions?: FirstConventions;
  criticalFlows?: FirstCriticalFlows;
  entryGuide?: FirstEntryGuide;
  apiContracts?: FirstApiContracts;
  structureOverview?: FirstStructureOverview;
  domainModel?: FirstDomainModel;
  databaseSchema?: FirstDatabaseSchema;
  docsIndex?: FirstDocsIndex;
  availableAssets: Set<RuntimeAssetName>;
}

function hasHealthyRuntimeSummary(projectRoot: string): boolean {
  const index = readFirstRuntimeIndex(projectRoot);
  return Boolean(index?.summary.healthy && readFirstRuntimeSummary(projectRoot));
}

function hasHealthyRuntimeSteering(projectRoot: string): boolean {
  const index = readFirstRuntimeIndex(projectRoot);
  return Boolean(index?.steering.healthy && readFirstSteering(projectRoot));
}

function hasHealthyRuntimeConventions(projectRoot: string): boolean {
  const index = readFirstRuntimeIndex(projectRoot);
  return Boolean(index?.conventions.healthy && readFirstConventions(projectRoot));
}

function hasHealthyRuntimeCriticalFlows(projectRoot: string): boolean {
  const index = readFirstRuntimeIndex(projectRoot);
  return Boolean(index?.criticalFlows.healthy && readFirstCriticalFlows(projectRoot));
}

function hasHealthyRuntimeEntryGuide(projectRoot: string): boolean {
  const index = readFirstRuntimeIndex(projectRoot);
  return Boolean(index?.entryGuide.healthy && readFirstEntryGuide(projectRoot));
}

function hasHealthyRuntimeApiContracts(projectRoot: string): boolean {
  const index = readFirstRuntimeIndex(projectRoot);
  return Boolean(index?.apiContracts.healthy && readFirstApiContracts(projectRoot));
}

function hasHealthyRuntimeStructureOverview(projectRoot: string): boolean {
  const index = readFirstRuntimeIndex(projectRoot);
  return Boolean(index?.structureOverview.healthy && readFirstStructureOverview(projectRoot));
}

function hasHealthyRuntimeDomainModel(projectRoot: string): boolean {
  const index = readFirstRuntimeIndex(projectRoot);
  return Boolean(index?.domainModel.healthy && readFirstDomainModel(projectRoot));
}

function hasHealthyRuntimeDatabaseSchema(projectRoot: string): boolean {
  const index = readFirstRuntimeIndex(projectRoot);
  return Boolean(index?.databaseSchema.status !== 'degraded' && readFirstDatabaseSchema(projectRoot));
}

function resolveStageKey(skillName: string): StageViewKey | undefined {
  switch (skillName) {
    case 'spec':
      return 'spec';
    case 'design':
      return 'design';
    case 'code':
    case 'review':
      return 'code';
    case 'verify':
      return 'verify';
    default:
      return undefined;
  }
}

function buildMissingAssets(projectRoot: string): string[] {
  const index = readFirstRuntimeIndex(projectRoot);
  if (!index) return [...ALL_RUNTIME_ASSETS];

  const missing: string[] = [];
  if (!index.summary.healthy || !readFirstRuntimeSummary(projectRoot)) missing.push('summary');
  if (!index.steering.healthy || !readFirstSteering(projectRoot)) missing.push('steering');
  if (!index.conventions.healthy || !readFirstConventions(projectRoot)) {
    missing.push('conventions');
  }
  if (!index.criticalFlows.healthy || !readFirstCriticalFlows(projectRoot)) {
    missing.push('critical-flows');
  }
  if (!index.entryGuide.healthy || !readFirstEntryGuide(projectRoot)) {
    missing.push('entry-guide');
  }
  if (!index.apiContracts.healthy || !readFirstApiContracts(projectRoot)) {
    missing.push('api-contracts');
  }
  if (!index.structureOverview.healthy || !readFirstStructureOverview(projectRoot)) {
    missing.push('structure-overview');
  }
  if (!index.domainModel.healthy || !readFirstDomainModel(projectRoot)) {
    missing.push('domain-model');
  }
  if (index.databaseSchema.status === 'degraded' || !readFirstDatabaseSchema(projectRoot)) {
    missing.push('database-schema');
  }
  return missing;
}

function buildFirstSummaryLite(projectRoot: string): FirstSummaryLite | undefined {
  const summary = readFirstRuntimeSummary(projectRoot);
  if (!summary) return undefined;
  return {
    projectName: summary.project.name,
    platformType: summary.project.platformType,
    techStack: summary.techStack ?? [],
    modules: summary.modules,
    risks: summary.risks,
  };
}

/**
 * 解析 skill 的资产契约（从输入矩阵查表）
 */
function resolveSkillAssetContract(skillName: string): SkillAssetContract {
  return SKILL_INPUT_MATRIX[skillName] ?? { required: [], optional: [] };
}

function readRuntimeAssetSnapshot(projectRoot: string): RuntimeAssetSnapshot {
  const availableAssets = new Set<RuntimeAssetName>();
  const summary = hasHealthyRuntimeSummary(projectRoot) ? buildFirstSummaryLite(projectRoot) : undefined;
  if (summary) availableAssets.add('summary');

  const steering = hasHealthyRuntimeSteering(projectRoot) ? (readFirstSteering(projectRoot) ?? undefined) : undefined;
  if (steering) availableAssets.add('steering');

  const conventions = hasHealthyRuntimeConventions(projectRoot)
    ? (readFirstConventions(projectRoot) ?? undefined)
    : undefined;
  if (conventions) availableAssets.add('conventions');

  const criticalFlows = hasHealthyRuntimeCriticalFlows(projectRoot)
    ? (readFirstCriticalFlows(projectRoot) ?? undefined)
    : undefined;
  if (criticalFlows) availableAssets.add('critical-flows');

  const entryGuide = hasHealthyRuntimeEntryGuide(projectRoot)
    ? (readFirstEntryGuide(projectRoot) ?? undefined)
    : undefined;
  if (entryGuide) availableAssets.add('entry-guide');

  const apiContracts = hasHealthyRuntimeApiContracts(projectRoot)
    ? (readFirstApiContracts(projectRoot) ?? undefined)
    : undefined;
  if (apiContracts) availableAssets.add('api-contracts');

  const structureOverview = hasHealthyRuntimeStructureOverview(projectRoot)
    ? (readFirstStructureOverview(projectRoot) ?? undefined)
    : undefined;
  if (structureOverview) availableAssets.add('structure-overview');

  const domainModel = hasHealthyRuntimeDomainModel(projectRoot)
    ? (readFirstDomainModel(projectRoot) ?? undefined)
    : undefined;
  if (domainModel) availableAssets.add('domain-model');

  const databaseSchema = hasHealthyRuntimeDatabaseSchema(projectRoot)
    ? (readFirstDatabaseSchema(projectRoot) ?? undefined)
    : undefined;
  if (databaseSchema) availableAssets.add('database-schema');
  const docsIndex = readFirstDocsIndex(projectRoot) ?? undefined;

  const stageSummaries: Partial<Record<StageViewKey, string>> = {};
  if (summary) {
    for (const stage of ['spec', 'design', 'code', 'verify'] as StageViewKey[]) {
      stageSummaries[stage] = buildRuntimeStageSummary(stage, summary);
    }
  }
  const onboardingSummary =
    summary && steering ? buildOnboardingRuntimeSummary(summary, steering, entryGuide) : undefined;

  return {
    summary,
    onboardingSummary,
    stageSummaries,
    steering,
    conventions,
    criticalFlows,
    entryGuide,
    apiContracts,
    structureOverview,
    domainModel,
    databaseSchema,
    docsIndex,
    availableAssets,
  };
}

function buildRuntimeStageSummary(stage: StageViewKey, summary: FirstSummaryLite): string {
  const projectName = summary.projectName;
  switch (stage) {
    case 'spec':
      return `${projectName}: 先从 summary、domain model 与 conventions 收敛需求边界，再补关键流程证据`;
    case 'design':
      return `${projectName}: 结合 structure overview、api contracts 与 critical flows 组织设计方案`;
    case 'code':
      return `${projectName}: 优先遵循 conventions 与 entry guide，按 structure overview 落到实现入口`;
    case 'verify':
      return `${projectName}: 以 critical flows、conventions 与 database schema 组织验证路径`;
  }
}

function buildOnboardingRuntimeSummary(
  summary: FirstSummaryLite,
  steering?: FirstSteering,
  entryGuide?: FirstEntryGuide
): string {
  const projectName = summary.projectName;
  const overview = steering?.product.overview ?? '项目级认知已就绪';
  const firstRead = entryGuide?.flatMap((entry) => entry.readFirst).slice(0, 2).join(', ');
  return firstRead
    ? `${projectName}: ${overview}；建议先读 ${firstRead}`
    : `${projectName}: ${overview}；建议先从 summary 与 entry-guide 进入`;
}

function buildRuntimeSlices(
  snapshot: RuntimeAssetSnapshot,
  contract: SkillAssetContract
): Pick<ResolvedSkillContext, 'required' | 'optional' | 'missingRequiredAssets'> {
  const required: ResolvedSkillContext['required'] = {};
  const optional: ResolvedSkillContext['optional'] = {};
  const missingRequiredAssets = contract.required.filter(
    (asset) => !snapshot.availableAssets.has(asset)
  );

  for (const asset of contract.required) {
    if (asset === 'steering' && snapshot.steering) required.steering = snapshot.steering;
    if (asset === 'conventions' && snapshot.conventions) required.conventions = snapshot.conventions;
    if (asset === 'critical-flows' && snapshot.criticalFlows) required.criticalFlows = snapshot.criticalFlows;
    if (asset === 'entry-guide' && snapshot.entryGuide) required.entryGuide = snapshot.entryGuide;
    if (asset === 'api-contracts' && snapshot.apiContracts) required.apiContracts = snapshot.apiContracts;
    if (asset === 'structure-overview' && snapshot.structureOverview) {
      required.structureOverview = snapshot.structureOverview;
    }
    if (asset === 'domain-model' && snapshot.domainModel) required.domainModel = snapshot.domainModel;
    if (asset === 'database-schema' && snapshot.databaseSchema) {
      required.databaseSchema = snapshot.databaseSchema;
    }
  }

  for (const asset of contract.optional) {
    if (asset === 'steering' && snapshot.steering) optional.steering = snapshot.steering;
    if (asset === 'conventions' && snapshot.conventions) optional.conventions = snapshot.conventions;
    if (asset === 'critical-flows' && snapshot.criticalFlows) optional.criticalFlows = snapshot.criticalFlows;
    if (asset === 'entry-guide' && snapshot.entryGuide) optional.entryGuide = snapshot.entryGuide;
    if (asset === 'api-contracts' && snapshot.apiContracts) optional.apiContracts = snapshot.apiContracts;
    if (asset === 'structure-overview' && snapshot.structureOverview) {
      optional.structureOverview = snapshot.structureOverview;
    }
    if (asset === 'domain-model' && snapshot.domainModel) optional.domainModel = snapshot.domainModel;
    if (asset === 'database-schema' && snapshot.databaseSchema) {
      optional.databaseSchema = snapshot.databaseSchema;
    }
  }

  return { required, optional, missingRequiredAssets };
}

function buildFallbackWarning(missingRequiredAssets: string[]): string | undefined {
  if (missingRequiredAssets.length === 0) return undefined;
  return `required runtime assets unavailable: ${missingRequiredAssets.join(', ')}`;
}

function hasHealthyCanonicalDocsFallback(projectRoot: string): boolean {
  const index = readFirstRuntimeIndex(projectRoot);
  if (!index) return false;
  return CANONICAL_PROJECTION_DOCS.every((docPath) => {
    const entry = index.docsProjection[docPath];
    return Boolean(entry?.healthy && existsSync(join(projectRoot, docPath)));
  });
}

function buildDocsStageSummary(stage: StageViewKey, summary?: FirstSummaryLite): string {
  const projectName = summary?.projectName ?? '当前项目';
  switch (stage) {
    case 'spec':
      return `${projectName}: 优先阅读 summary.md、domain-model.md、entry-guide.md 形成需求上下文`;
    case 'design':
      return `${projectName}: 优先阅读 architecture.md、codebase-overview.md、api-docs.md 形成设计上下文`;
    case 'code':
      return `${projectName}: 优先阅读 development-guidelines.md、codebase-overview.md、call-graph.md 形成实现上下文`;
    case 'verify':
      return `${projectName}: 优先阅读 critical-flows.md、development-guidelines.md、database-er.md 形成验证上下文`;
  }
}

export function parseContextSummaryFromDocs(
  projectRoot: string,
  stage: StageViewKey
): string | undefined {
  if (!hasHealthyCanonicalDocsFallback(projectRoot)) return undefined;
  return buildDocsStageSummary(stage, buildFirstSummaryLite(projectRoot));
}

export function parseOnboardingSummaryFromDocs(projectRoot: string): string | undefined {
  if (!hasHealthyCanonicalDocsFallback(projectRoot)) return undefined;
  const summary = buildFirstSummaryLite(projectRoot);
  return `${summary?.projectName ?? '当前项目'}: 先读 summary.md 与 entry-guide.md，再按 codebase-overview.md 深入实现细节`;
}

export function resolveCurrentFeatureId(
  projectRoot: string,
  explicitFeatureId?: string
): string | undefined {
  if (explicitFeatureId) return explicitFeatureId;
  return readCurrentFeatureId(projectRoot);
}

export function resolveSkillContext(
  projectRoot: string,
  skillName: string,
  explicitFeatureId?: string
): ResolvedSkillContext {
  const featureId = resolveCurrentFeatureId(projectRoot, explicitFeatureId);
  const backgroundInputStatus = detectBackgroundInputStatus(projectRoot);
  const stageKey = resolveStageKey(skillName);
  const missingAssets = buildMissingAssets(projectRoot);
  const snapshot = readRuntimeAssetSnapshot(projectRoot);
  const firstSummaryLite = snapshot.summary;
  const contract = resolveSkillAssetContract(skillName);
  const runtimeSlices = buildRuntimeSlices(snapshot, contract);
  const fallbackWarning = buildFallbackWarning(runtimeSlices.missingRequiredAssets);

  if (runtimeSlices.missingRequiredAssets.length === 0 && stageKey && snapshot.stageSummaries[stageKey]) {
    return {
      featureId,
      skillName,
      source: 'runtime',
      backgroundInputStatus,
      contextSummary: snapshot.stageSummaries[stageKey],
      firstSummaryLite,
      docsIndex: snapshot.docsIndex,
      requiredAssetNames: contract.required,
      optionalAssetNames: contract.optional,
      missingRequiredAssets: runtimeSlices.missingRequiredAssets,
      required: runtimeSlices.required,
      optional: runtimeSlices.optional,
      fallback: { source: 'runtime' },
      missingAssets,
      recommendedAction: backgroundInputStatus === 'full' ? undefined : 'run-first',
    };
  }

  if (skillName === 'onboarding' && runtimeSlices.missingRequiredAssets.length === 0) {
    return {
      featureId,
      skillName,
      source: 'runtime',
      backgroundInputStatus,
      onboardingSummary: snapshot.onboardingSummary,
      firstSummaryLite,
      docsIndex: snapshot.docsIndex,
      requiredAssetNames: contract.required,
      optionalAssetNames: contract.optional,
      missingRequiredAssets: runtimeSlices.missingRequiredAssets,
      required: runtimeSlices.required,
      optional: runtimeSlices.optional,
      fallback: { source: 'runtime' },
      missingAssets,
      recommendedAction: backgroundInputStatus === 'full' ? undefined : 'run-first',
    };
  }

  if (stageKey) {
    const docsStageSummary = parseContextSummaryFromDocs(projectRoot, stageKey);
    if (docsStageSummary) {
      return {
        featureId,
        skillName,
        source: 'docs',
        backgroundInputStatus,
        contextSummary: docsStageSummary,
        firstSummaryLite,
        docsIndex: snapshot.docsIndex,
        requiredAssetNames: contract.required,
        optionalAssetNames: contract.optional,
        missingRequiredAssets: runtimeSlices.missingRequiredAssets,
        required: {},
        optional: {},
        fallback: { source: 'docs', warning: fallbackWarning },
        missingAssets,
        recommendedAction: 'run-first',
      };
    }
  }

  if (skillName === 'onboarding') {
    const docsRoleSummary = parseOnboardingSummaryFromDocs(projectRoot);
    if (docsRoleSummary) {
      return {
        featureId,
        skillName,
        source: 'docs',
        backgroundInputStatus,
        onboardingSummary: docsRoleSummary,
        firstSummaryLite,
        docsIndex: snapshot.docsIndex,
        requiredAssetNames: contract.required,
        optionalAssetNames: contract.optional,
        missingRequiredAssets: runtimeSlices.missingRequiredAssets,
        required: {},
        optional: {},
        fallback: { source: 'docs', warning: fallbackWarning },
        missingAssets,
        recommendedAction: 'run-first',
      };
    }
  }

  if (BACKGROUND_SKILLS.has(skillName) && firstSummaryLite && runtimeSlices.missingRequiredAssets.length === 0) {
    return {
      featureId,
      skillName,
      source: 'runtime',
      backgroundInputStatus,
      firstSummaryLite,
      docsIndex: snapshot.docsIndex,
      requiredAssetNames: contract.required,
      optionalAssetNames: contract.optional,
      missingRequiredAssets: runtimeSlices.missingRequiredAssets,
      required: runtimeSlices.required,
      optional: runtimeSlices.optional,
      fallback: { source: 'runtime' },
      missingAssets,
      recommendedAction: backgroundInputStatus === 'full' ? undefined : 'run-first',
    };
  }

  if (BACKGROUND_SKILLS.has(skillName) && existsSync(join(projectRoot, 'docs', 'first')) && hasHealthyCanonicalDocsFallback(projectRoot)) {
    return {
      featureId,
      skillName,
      source: 'docs',
      backgroundInputStatus,
      requiredAssetNames: contract.required,
      optionalAssetNames: contract.optional,
      missingRequiredAssets: runtimeSlices.missingRequiredAssets,
      required: {},
      optional: {},
      fallback: { source: 'docs', warning: fallbackWarning },
      missingAssets,
      recommendedAction: 'run-first',
    };
  }

  return {
    featureId,
    skillName,
    source: 'none',
    backgroundInputStatus,
      firstSummaryLite,
      docsIndex: snapshot.docsIndex,
      requiredAssetNames: contract.required,
    optionalAssetNames: contract.optional,
    missingRequiredAssets: runtimeSlices.missingRequiredAssets,
    required: {},
    optional: {},
    fallback: { source: 'none', warning: fallbackWarning },
    missingAssets,
    recommendedAction: 'run-first',
  };
}
