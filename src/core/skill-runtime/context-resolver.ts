import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { BackgroundInputStatus } from '../../shared/types.js';
import { detectBackgroundInputStatus } from './first-context.js';
import { readCurrentFeatureId } from './execution-context.js';
import {
  readFirstChangeMap,
  readFirstConventions,
  readFirstCriticalFlows,
  readFirstEntryGuide,
  readFirstRebootGuide,
  readFirstRoleViews,
  readFirstRuntimeIndex,
  readFirstRuntimeSummary,
  readFirstSteering,
  readFirstStageViews,
} from './first-runtime-store.js';
import { CANONICAL_PROJECTION_DOCS } from './first-artifact-mapping.js';
import type {
  FirstChangeMap,
  FirstConventions,
  FirstCriticalFlows,
  FirstEntryGuide,
  FirstRebootGuide,
  FirstSteering,
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
  stageViewSummary?: string;
  roleViewSummary?: string;
  firstSummaryLite?: FirstSummaryLite;
  requiredAssetNames: string[];
  optionalAssetNames: string[];
  missingRequiredAssets: string[];
  required: {
    steering?: FirstSteering;
    conventions?: FirstConventions;
    criticalFlows?: FirstCriticalFlows;
    changeMap?: FirstChangeMap;
    entryGuide?: FirstEntryGuide;
    rebootGuide?: FirstRebootGuide;
  };
  optional: {
    steering?: FirstSteering;
    conventions?: FirstConventions;
    criticalFlows?: FirstCriticalFlows;
    changeMap?: FirstChangeMap;
    entryGuide?: FirstEntryGuide;
    rebootGuide?: FirstRebootGuide;
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
  | 'role-views'
  | 'stage-views'
  | 'steering'
  | 'conventions'
  | 'critical-flows'
  | 'change-map'
  | 'entry-guide'
  | 'reboot-guide';

const ALL_RUNTIME_ASSETS = [
  'summary',
  'role-views',
  'stage-views',
  'steering',
  'conventions',
  'critical-flows',
  'change-map',
  'entry-guide',
  'reboot-guide',
] as const;
const BACKGROUND_SKILLS = new Set(['task', 'plan', 'orchestrate', 'status', 'analyze']);

interface SkillAssetContract {
  required: RuntimeAssetName[];
  optional: RuntimeAssetName[];
}

interface RuntimeAssetSnapshot {
  summary?: FirstSummaryLite;
  roleViewSummary?: string;
  stageViewsAvailable: boolean;
  steering?: FirstSteering;
  conventions?: FirstConventions;
  criticalFlows?: FirstCriticalFlows;
  changeMap?: FirstChangeMap;
  entryGuide?: FirstEntryGuide;
  rebootGuide?: FirstRebootGuide;
  availableAssets: Set<RuntimeAssetName>;
}

const SKILL_TASK_CATEGORIES: Partial<Record<string, string[]>> = {
  task: ['runtime-extension'],
  plan: ['runtime-extension'],
  orchestrate: ['runtime-extension'],
};

const TASK_CATEGORY_TO_CHANGE_TYPES: Record<string, string[]> = {
  'runtime-extension': ['runtime-asset-extension'],
  'docs-projection': ['docs-projection-adjustment'],
};

function hasHealthyRuntimeSummary(projectRoot: string): boolean {
  const index = readFirstRuntimeIndex(projectRoot);
  return Boolean(index?.summary.healthy && readFirstRuntimeSummary(projectRoot));
}

function hasHealthyRuntimeRoleViews(projectRoot: string): boolean {
  const index = readFirstRuntimeIndex(projectRoot);
  return Boolean(index?.roleViews.healthy && readFirstRoleViews(projectRoot));
}

function hasHealthyRuntimeStageViews(projectRoot: string): boolean {
  const index = readFirstRuntimeIndex(projectRoot);
  return Boolean(index?.stageViews.healthy && readFirstStageViews(projectRoot));
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

function hasHealthyRuntimeChangeMap(projectRoot: string): boolean {
  const index = readFirstRuntimeIndex(projectRoot);
  return Boolean(index?.changeMap.healthy && readFirstChangeMap(projectRoot));
}

function hasHealthyRuntimeEntryGuide(projectRoot: string): boolean {
  const index = readFirstRuntimeIndex(projectRoot);
  return Boolean(index?.entryGuide.healthy && readFirstEntryGuide(projectRoot));
}

function hasHealthyRuntimeRebootGuide(projectRoot: string): boolean {
  const index = readFirstRuntimeIndex(projectRoot);
  return Boolean(index?.rebootGuide.healthy && readFirstRebootGuide(projectRoot));
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
  if (!index.roleViews.healthy || !readFirstRoleViews(projectRoot)) missing.push('role-views');
  if (!index.stageViews.healthy || !readFirstStageViews(projectRoot)) missing.push('stage-views');
  if (!index.steering.healthy || !readFirstSteering(projectRoot)) missing.push('steering');
  if (!index.conventions.healthy || !readFirstConventions(projectRoot)) missing.push('conventions');
  if (!index.criticalFlows.healthy || !readFirstCriticalFlows(projectRoot)) {
    missing.push('critical-flows');
  }
  if (!index.changeMap.healthy || !readFirstChangeMap(projectRoot)) missing.push('change-map');
  if (!index.entryGuide.healthy || !readFirstEntryGuide(projectRoot)) missing.push('entry-guide');
  if (!index.rebootGuide.healthy || !readFirstRebootGuide(projectRoot)) {
    missing.push('reboot-guide');
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

function buildRoleSummaryFromRuntime(projectRoot: string): string | undefined {
  const roleViews = readFirstRoleViews(projectRoot);
  if (!roleViews) return undefined;

  return [roleViews.product, roleViews.dev, roleViews.qa, roleViews.architect]
    .map((role) => role.summary.trim())
    .find(Boolean);
}

function resolveSkillAssetContract(skillName: string): SkillAssetContract {
  switch (skillName) {
    case 'onboarding':
      return {
        required: ['steering'],
        optional: ['reboot-guide'],
      };
    case 'spec':
    case 'spec-review':
      return {
        required: ['stage-views'],
        optional: ['conventions'],
      };
    case 'design':
      return {
        required: ['stage-views'],
        optional: ['steering', 'critical-flows', 'conventions'],
      };
    case 'task':
    case 'plan':
    case 'orchestrate':
      return {
        required: ['summary'],
        optional: ['change-map', 'critical-flows', 'entry-guide'],
      };
    case 'code':
    case 'review':
      return {
        required: ['stage-views'],
        optional: ['conventions', 'entry-guide', 'change-map'],
      };
    case 'verify':
      return {
        required: ['stage-views'],
        optional: ['critical-flows', 'conventions'],
      };
    case 'status':
    case 'analyze':
      return {
        required: ['summary'],
        optional: ['change-map', 'reboot-guide'],
      };
    default:
      return {
        required: [],
        optional: [],
      };
  }
}

function readRuntimeAssetSnapshot(projectRoot: string): RuntimeAssetSnapshot {
  const availableAssets = new Set<RuntimeAssetName>();
  const summary = hasHealthyRuntimeSummary(projectRoot) ? buildFirstSummaryLite(projectRoot) : undefined;
  if (summary) availableAssets.add('summary');

  const roleViewSummary = hasHealthyRuntimeRoleViews(projectRoot)
    ? buildRoleSummaryFromRuntime(projectRoot)
    : undefined;
  if (roleViewSummary) availableAssets.add('role-views');

  const stageViews = hasHealthyRuntimeStageViews(projectRoot) ? readFirstStageViews(projectRoot) : undefined;
  if (stageViews) availableAssets.add('stage-views');

  const steering = hasHealthyRuntimeSteering(projectRoot) ? readFirstSteering(projectRoot) ?? undefined : undefined;
  if (steering) availableAssets.add('steering');

  const conventions = hasHealthyRuntimeConventions(projectRoot)
    ? readFirstConventions(projectRoot) ?? undefined
    : undefined;
  if (conventions) availableAssets.add('conventions');

  const criticalFlows = hasHealthyRuntimeCriticalFlows(projectRoot)
    ? readFirstCriticalFlows(projectRoot) ?? undefined
    : undefined;
  if (criticalFlows) availableAssets.add('critical-flows');

  const changeMap = hasHealthyRuntimeChangeMap(projectRoot)
    ? readFirstChangeMap(projectRoot) ?? undefined
    : undefined;
  if (changeMap) availableAssets.add('change-map');

  const entryGuide = hasHealthyRuntimeEntryGuide(projectRoot)
    ? readFirstEntryGuide(projectRoot) ?? undefined
    : undefined;
  if (entryGuide) availableAssets.add('entry-guide');

  const rebootGuide = hasHealthyRuntimeRebootGuide(projectRoot)
    ? readFirstRebootGuide(projectRoot) ?? undefined
    : undefined;
  if (rebootGuide) availableAssets.add('reboot-guide');

  return {
    summary,
    roleViewSummary,
    stageViewsAvailable: Boolean(stageViews),
    steering,
    conventions,
    criticalFlows,
    changeMap,
    entryGuide,
    rebootGuide,
    availableAssets,
  };
}

function buildRuntimeSlices(
  snapshot: RuntimeAssetSnapshot,
  contract: SkillAssetContract,
  skillName: string
): Pick<ResolvedSkillContext, 'required' | 'optional' | 'missingRequiredAssets'> {
  const required: ResolvedSkillContext['required'] = {};
  const optional: ResolvedSkillContext['optional'] = {};
  const missingRequiredAssets = contract.required.filter((asset) => !snapshot.availableAssets.has(asset));
  const allowedTaskCategories = SKILL_TASK_CATEGORIES[skillName];
  const allowedChangeTypes = allowedTaskCategories?.flatMap(
    (category) => TASK_CATEGORY_TO_CHANGE_TYPES[category] ?? []
  );

  for (const asset of contract.required) {
    if (asset === 'steering' && snapshot.steering) required.steering = snapshot.steering;
    if (asset === 'conventions' && snapshot.conventions) required.conventions = snapshot.conventions;
    if (asset === 'critical-flows' && snapshot.criticalFlows) {
      required.criticalFlows = snapshot.criticalFlows;
    }
    if (asset === 'change-map' && snapshot.changeMap) required.changeMap = snapshot.changeMap;
    if (asset === 'entry-guide' && snapshot.entryGuide) required.entryGuide = snapshot.entryGuide;
    if (asset === 'reboot-guide' && snapshot.rebootGuide) required.rebootGuide = snapshot.rebootGuide;
  }

  for (const asset of contract.optional) {
    if (asset === 'steering' && snapshot.steering) optional.steering = snapshot.steering;
    if (asset === 'conventions' && snapshot.conventions) optional.conventions = snapshot.conventions;
    if (asset === 'critical-flows' && snapshot.criticalFlows) optional.criticalFlows = snapshot.criticalFlows;
    if (asset === 'change-map' && snapshot.changeMap) {
      optional.changeMap = allowedChangeTypes
        ? snapshot.changeMap.filter((entry) => allowedChangeTypes.includes(entry.changeType))
        : snapshot.changeMap;
    }
    if (asset === 'entry-guide' && snapshot.entryGuide) {
      optional.entryGuide = allowedTaskCategories
        ? snapshot.entryGuide.filter((entry) => allowedTaskCategories.includes(entry.taskCategory))
        : snapshot.entryGuide;
    }
    if (asset === 'reboot-guide' && snapshot.rebootGuide) optional.rebootGuide = snapshot.rebootGuide;
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

export function parseStageSummaryFromDocs(
  projectRoot: string,
  stage: StageViewKey
): string | undefined {
  const docsPath = join(projectRoot, 'docs/first/stage-views.md');
  if (!existsSync(docsPath)) return undefined;

  const content = readFileSync(docsPath, 'utf-8');
  const stagePatterns: Record<StageViewKey, RegExp> = {
    spec: /##\s*(?:需求阶段视图|Spec View)/i,
    design: /##\s*(?:设计阶段视图|Design View)/i,
    code: /##\s*(?:代码阶段视图|Code View)/i,
    verify: /##\s*(?:验证阶段视图|Verify View)/i,
  };

  const stageMatch = content.match(stagePatterns[stage]);
  if (!stageMatch?.index && stageMatch?.index !== 0) return undefined;

  const stageStart = stageMatch.index + stageMatch[0].length;
  const nextSectionMatch = content.slice(stageStart).match(/\n##\s/);
  const stageContent = nextSectionMatch
    ? content.slice(stageStart, stageStart + (nextSectionMatch.index ?? 0))
    : content.slice(stageStart);

  const summaryMatch = stageContent.match(/(?:\*\*摘要\*\*:\s*|-\s*Summary:\s*)(.+?)(?:\n|$)/);
  return summaryMatch?.[1]?.trim() || undefined;
}

export function parseRoleSummaryFromDocs(projectRoot: string): string | undefined {
  const docsPath = join(projectRoot, 'docs/first/role-views.md');
  if (!existsSync(docsPath)) return undefined;

  const content = readFileSync(docsPath, 'utf-8');
  const summaryMatch = content.match(/-\s*Summary:\s*(.+?)(?:\n|$)/);
  return summaryMatch?.[1]?.trim() || undefined;
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
  const runtimeSlices = buildRuntimeSlices(snapshot, contract, skillName);
  const fallbackWarning = buildFallbackWarning(runtimeSlices.missingRequiredAssets);
  const stageViews = hasHealthyRuntimeStageViews(projectRoot) ? readFirstStageViews(projectRoot) : undefined;

  if (
    runtimeSlices.missingRequiredAssets.length === 0 &&
    stageKey &&
    stageViews?.[stageKey]?.summary
  ) {
    return {
      featureId,
      skillName,
      source: 'runtime',
      backgroundInputStatus,
      stageViewSummary: stageViews[stageKey].summary,
      firstSummaryLite,
      requiredAssetNames: contract.required,
      optionalAssetNames: contract.optional,
      missingRequiredAssets: runtimeSlices.missingRequiredAssets,
      required: runtimeSlices.required,
      optional: runtimeSlices.optional,
      fallback: {
        source: 'runtime',
      },
      missingAssets,
      recommendedAction: backgroundInputStatus === 'full' ? undefined : 'run-first',
    };
  }

  if (skillName === 'onboarding') {
    const roleViewSummary = snapshot.roleViewSummary;
    if (runtimeSlices.missingRequiredAssets.length === 0) {
      return {
        featureId,
        skillName,
        source: 'runtime',
        backgroundInputStatus,
        roleViewSummary,
        firstSummaryLite,
        requiredAssetNames: contract.required,
        optionalAssetNames: contract.optional,
        missingRequiredAssets: runtimeSlices.missingRequiredAssets,
        required: runtimeSlices.required,
        optional: runtimeSlices.optional,
        fallback: {
          source: 'runtime',
        },
        missingAssets,
        recommendedAction: backgroundInputStatus === 'full' ? undefined : 'run-first',
      };
    }
  }

  if (stageKey) {
    const docsStageSummary = parseStageSummaryFromDocs(projectRoot, stageKey);
    if (docsStageSummary) {
      return {
        featureId,
        skillName,
        source: 'docs',
        backgroundInputStatus,
        stageViewSummary: docsStageSummary,
        firstSummaryLite,
        requiredAssetNames: contract.required,
        optionalAssetNames: contract.optional,
        missingRequiredAssets: runtimeSlices.missingRequiredAssets,
        required: {},
        optional: {},
        fallback: {
          source: 'docs',
          warning: fallbackWarning,
        },
        missingAssets,
        recommendedAction: 'run-first',
      };
    }
  }

  if (skillName === 'onboarding') {
    const docsRoleSummary = parseRoleSummaryFromDocs(projectRoot);
    if (docsRoleSummary) {
      return {
        featureId,
        skillName,
        source: 'docs',
        backgroundInputStatus,
        roleViewSummary: docsRoleSummary,
        firstSummaryLite,
        requiredAssetNames: contract.required,
        optionalAssetNames: contract.optional,
        missingRequiredAssets: runtimeSlices.missingRequiredAssets,
        required: {},
        optional: {},
        fallback: {
          source: 'docs',
          warning: fallbackWarning,
        },
        missingAssets,
        recommendedAction: 'run-first',
      };
    }
  }

  if (BACKGROUND_SKILLS.has(skillName)) {
    if (runtimeSlices.missingRequiredAssets.length === 0 && firstSummaryLite) {
      return {
        featureId,
        skillName,
        source: 'runtime',
        backgroundInputStatus,
        firstSummaryLite,
        requiredAssetNames: contract.required,
        optionalAssetNames: contract.optional,
        missingRequiredAssets: runtimeSlices.missingRequiredAssets,
        required: runtimeSlices.required,
        optional: runtimeSlices.optional,
        fallback: {
          source: 'runtime',
        },
        missingAssets,
        recommendedAction: backgroundInputStatus === 'full' ? undefined : 'run-first',
      };
    }

    if (
      existsSync(join(projectRoot, 'docs', 'first')) &&
      hasHealthyCanonicalDocsFallback(projectRoot)
    ) {
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
        fallback: {
          source: 'docs',
          warning: fallbackWarning,
        },
        missingAssets,
        recommendedAction: 'run-first',
      };
    }
  }

  return {
    featureId,
    skillName,
    source: 'none',
    backgroundInputStatus,
    firstSummaryLite,
    requiredAssetNames: contract.required,
    optionalAssetNames: contract.optional,
    missingRequiredAssets: runtimeSlices.missingRequiredAssets,
    required: {},
    optional: {},
    fallback: {
      source: 'none',
      warning: fallbackWarning,
    },
    missingAssets,
    recommendedAction: 'run-first',
  };
}
