import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { BackgroundInputStatus } from '../../shared/types.js';
import { detectBackgroundInputStatus } from './first-context.js';
import { readCurrentFeatureId } from './execution-context.js';
import {
  readFirstRoleViews,
  readFirstRuntimeIndex,
  readFirstRuntimeSummary,
  readFirstStageViews,
} from './first-runtime-store.js';

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
  missingAssets: string[];
  recommendedAction?: string;
}

type StageViewKey = 'spec' | 'design' | 'code' | 'verify';

const ALL_RUNTIME_ASSETS = ['summary', 'role-views', 'stage-views'] as const;
const BACKGROUND_SKILLS = new Set(['task', 'plan', 'orchestrate', 'status', 'analyze']);

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
  const stageViews = readFirstStageViews(projectRoot);
  const missingAssets = buildMissingAssets(projectRoot);
  const firstSummaryLite = buildFirstSummaryLite(projectRoot);

  if (stageKey && hasHealthyRuntimeStageViews(projectRoot) && stageViews?.[stageKey]?.summary) {
    return {
      featureId,
      skillName,
      source: 'runtime',
      backgroundInputStatus,
      stageViewSummary: stageViews[stageKey].summary,
      firstSummaryLite,
      missingAssets,
      recommendedAction: backgroundInputStatus === 'full' ? undefined : 'run-first',
    };
  }

  if (skillName === 'onboarding') {
    const roleViewSummary = buildRoleSummaryFromRuntime(projectRoot);
    if (hasHealthyRuntimeRoleViews(projectRoot) && roleViewSummary) {
      return {
        featureId,
        skillName,
        source: 'runtime',
        backgroundInputStatus,
        roleViewSummary,
        firstSummaryLite,
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
        missingAssets,
        recommendedAction: 'run-first',
      };
    }
  }

  if (BACKGROUND_SKILLS.has(skillName)) {
    if (hasHealthyRuntimeSummary(projectRoot) && firstSummaryLite) {
      return {
        featureId,
        skillName,
        source: 'runtime',
        backgroundInputStatus,
        firstSummaryLite,
        missingAssets,
        recommendedAction: backgroundInputStatus === 'full' ? undefined : 'run-first',
      };
    }

    if (
      existsSync(join(projectRoot, 'docs', 'first')) &&
      (existsSync(join(projectRoot, 'docs', 'first', 'summary.md')) ||
        existsSync(join(projectRoot, 'docs', 'first', 'README.md')) ||
        existsSync(join(projectRoot, 'docs', 'first', 'stage-views.md')) ||
        existsSync(join(projectRoot, 'docs', 'first', 'role-views.md')))
    ) {
      return {
        featureId,
        skillName,
        source: 'docs',
        backgroundInputStatus,
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
    missingAssets,
    recommendedAction: 'run-first',
  };
}
