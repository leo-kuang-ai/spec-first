import { join } from 'node:path';
import { exists, readJson, readMarkdown } from '../../shared/fs-utils.js';
import { Stage, type FeatureState } from '../../shared/types.js';
import { resolveExecutionFeatureId, type SkillExecutionContext } from './execution-context.js';

export interface ChecklistItem {
  id: string;
  description: string;
  status: 'pass' | 'fail' | 'skip';
  detail?: string;
}

export interface SkillChecklistResult {
  skillName: string;
  stage: Stage;
  checks: ChecklistItem[];
  overallStatus: 'complete' | 'partial' | 'empty';
  canMarkDone: boolean;
}

type ChecklistDefinition = {
  requiredChecks: Array<(ctx: ChecklistEvalContext) => ChecklistItem>;
};

interface ChecklistEvalContext {
  projectRoot: string;
  featureId?: string;
  skillName: string;
  stage: Stage;
  state?: Partial<FeatureState>;
}

const SKILL_STAGE_MAP: Partial<Record<string, Stage>> = {
  spec: Stage.SPECIFY,
  'spec-review': Stage.SPECIFY,
  design: Stage.DESIGN,
  research: Stage.DESIGN,
  task: Stage.PLAN,
  plan: Stage.PLAN,
  code: Stage.IMPLEMENT,
  review: Stage.IMPLEMENT,
  verify: Stage.VERIFY,
  archive: Stage.WRAP_UP,
  golive: Stage.RELEASE,
};

function inferChecklistStage(skillName: string): Stage | undefined {
  return SKILL_STAGE_MAP[skillName];
}

function readFeatureState(projectRoot: string, featureId?: string): Partial<FeatureState> | undefined {
  if (!featureId) return undefined;
  const statePath = join(projectRoot, 'specs', featureId, 'stage-state.json');
  if (!exists(statePath)) return undefined;
  return readJson<Partial<FeatureState>>(statePath);
}

function readArtifact(projectRoot: string, featureId: string | undefined, name: string): string | undefined {
  if (!featureId) return undefined;
  const path = join(projectRoot, 'specs', featureId, name);
  return exists(path) ? readMarkdown(path) : undefined;
}

function fileExists(id: string, description: string, fileName: string) {
  return (ctx: ChecklistEvalContext): ChecklistItem => {
    const content = readArtifact(ctx.projectRoot, ctx.featureId, fileName);
    return {
      id,
      description,
      status: content ? 'pass' : 'fail',
      detail: content ? undefined : `缺少 ${fileName}`,
    };
  };
}

function fileNonEmpty(id: string, description: string, fileName: string) {
  return (ctx: ChecklistEvalContext): ChecklistItem => {
    const content = readArtifact(ctx.projectRoot, ctx.featureId, fileName);
    return {
      id,
      description,
      status: content && content.trim().length > 32 ? 'pass' : 'fail',
      detail: content ? undefined : `缺少 ${fileName}`,
    };
  };
}

function fileIncludes(id: string, description: string, fileName: string, pattern: RegExp) {
  return (ctx: ChecklistEvalContext): ChecklistItem => {
    const content = readArtifact(ctx.projectRoot, ctx.featureId, fileName);
    if (!content) {
      return { id, description, status: 'fail', detail: `缺少 ${fileName}` };
    }
    return {
      id,
      description,
      status: pattern.test(content) ? 'pass' : 'fail',
      detail: pattern.test(content) ? undefined : `未找到 ${pattern}`,
    };
  };
}

const CHECKLISTS: Record<Stage, ChecklistDefinition> = {
  [Stage.INIT]: {
    requiredChecks: [
      (ctx) => ({
        id: 'stage-state-exists',
        description: 'stage-state.json 已初始化',
        status: ctx.state ? 'pass' : 'fail',
        detail: ctx.state ? undefined : '缺少 stage-state.json',
      }),
    ],
  },
  [Stage.SPECIFY]: {
    requiredChecks: [
      fileExists('spec-exists', 'spec.md 文件存在', 'spec.md'),
      fileNonEmpty('spec-non-empty', 'spec.md 非空', 'spec.md'),
    ],
  },
  [Stage.DESIGN]: {
    requiredChecks: [
      fileExists('design-exists', 'design.md 文件存在', 'design.md'),
      fileNonEmpty('design-non-empty', 'design.md 非空', 'design.md'),
    ],
  },
  [Stage.PLAN]: {
    requiredChecks: [
      fileExists('task-plan-exists', 'task_plan.md 文件存在', 'task_plan.md'),
      fileIncludes(
        'task-plan-table',
        'task_plan.md 包含汇总任务表格',
        'task_plan.md',
        /\|\s*title\s*\|\s*status\s*\|/i
      ),
    ],
  },
  [Stage.IMPLEMENT]: {
    requiredChecks: [
      fileExists('task-plan-exists', 'task_plan.md 文件存在', 'task_plan.md'),
      fileIncludes(
        'findings-implementation',
        'findings.md 包含 Implementation 段',
        'findings.md',
        /^##\s+Implementation\b/im
      ),
    ],
  },
  [Stage.VERIFY]: {
    requiredChecks: [
      fileExists('verify-exists', 'verify.md 文件存在', 'verify.md'),
      fileNonEmpty('verify-non-empty', 'verify.md 非空', 'verify.md'),
    ],
  },
  [Stage.WRAP_UP]: {
    requiredChecks: [
      fileExists('retro-exists', 'retro.md 文件存在', 'retro.md'),
      fileNonEmpty('retro-non-empty', 'retro.md 非空', 'retro.md'),
    ],
  },
  [Stage.RELEASE]: {
    requiredChecks: [
      fileExists('release-exists', 'release.md 文件存在', 'release.md'),
      fileNonEmpty('release-non-empty', 'release.md 非空', 'release.md'),
    ],
  },
  [Stage.DONE]: { requiredChecks: [] },
  [Stage.CANCELLED]: { requiredChecks: [] },
};

export function evaluateSkillChecklist(
  skillName: string,
  executionContext: SkillExecutionContext
): SkillChecklistResult | undefined {
  const stage = inferChecklistStage(skillName);
  if (!stage) return undefined;

  const featureId = resolveExecutionFeatureId(executionContext);
  const state = readFeatureState(executionContext.projectRoot, featureId);
  const ctx: ChecklistEvalContext = {
    projectRoot: executionContext.projectRoot,
    featureId,
    skillName,
    stage,
    state,
  };
  const definition = CHECKLISTS[stage];
  const checks = definition.requiredChecks.map((check) => check(ctx));
  const passCount = checks.filter((check) => check.status === 'pass').length;
  const requiredCount = checks.length;

  let overallStatus: SkillChecklistResult['overallStatus'] = 'empty';
  if (requiredCount > 0 && passCount === requiredCount) overallStatus = 'complete';
  else if (passCount > 0) overallStatus = 'partial';

  return {
    skillName,
    stage,
    checks,
    overallStatus,
    canMarkDone: requiredCount > 0 && passCount === requiredCount,
  };
}

export function buildSkillChecklistContext(
  skillName: string,
  executionContext: SkillExecutionContext,
  mode: 'flow' | 'standalone' = 'flow'
): string | undefined {
  const result = evaluateSkillChecklist(skillName, executionContext);
  if (!result) return undefined;

  const resolvedFeatureId = resolveExecutionFeatureId(executionContext);
  const nodeStatus = resolvedFeatureId
    ? readFeatureState(executionContext.projectRoot, resolvedFeatureId)?.nodes?.[result.stage]?.status
    : undefined;

  const lines = [
    '<!-- skill-checklist-context -->',
    '## Skill Checklist',
    `- skill: ${skillName}`,
    `- stage: ${result.stage}`,
    `- mode: ${mode}`,
    `- node_status: ${nodeStatus ?? 'unknown'}`,
    `- overall_status: ${result.overallStatus}`,
    `- can_mark_done: ${result.canMarkDone ? 'yes' : 'no'}`,
    '',
    '### Checks',
    ...result.checks.map(
      (check) => `- [${check.status}] ${check.description}${check.detail ? ` (${check.detail})` : ''}`
    ),
    '<!-- /skill-checklist-context -->',
  ];

  return lines.join('\n');
}
