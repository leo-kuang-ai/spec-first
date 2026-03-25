import { join } from 'node:path';
import { exists, readJson, readMarkdown } from '../../shared/fs-utils.js';
import { Stage, type FeatureState } from '../../shared/types.js';
import { parseTaskPlanContent } from '../task-plan/parser.js';
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

function readAnyArtifact(
  projectRoot: string,
  featureId: string | undefined,
  fileNames: readonly string[]
): { fileName: string; content: string } | undefined {
  if (!featureId) return undefined;
  for (const fileName of fileNames) {
    const content = readArtifact(projectRoot, featureId, fileName);
    if (content !== undefined) {
      return { fileName, content };
    }
  }
  return undefined;
}

function hasAnyPattern(content: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(content));
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

function fileExistsAll(id: string, description: string, fileNames: readonly string[]) {
  return (ctx: ChecklistEvalContext): ChecklistItem => {
    const missing = fileNames.filter((fileName) => !readArtifact(ctx.projectRoot, ctx.featureId, fileName));
    return {
      id,
      description,
      status: missing.length === 0 ? 'pass' : 'fail',
      detail: missing.length === 0 ? undefined : `缺少 ${missing.join(' / ')}`,
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

function fileContainsAny(
  id: string,
  description: string,
  fileName: string,
  patterns: readonly RegExp[]
) {
  return (ctx: ChecklistEvalContext): ChecklistItem => {
    const content = readArtifact(ctx.projectRoot, ctx.featureId, fileName);
    if (!content) {
      return { id, description, status: 'fail', detail: `缺少 ${fileName}` };
    }
    return {
      id,
      description,
      status: hasAnyPattern(content, patterns) ? 'pass' : 'fail',
      detail: hasAnyPattern(content, patterns)
        ? undefined
        : `未找到 ${patterns.map((pattern) => String(pattern)).join(' 或 ')}`,
    };
  };
}

function fileContainsAnyFromFiles(
  id: string,
  description: string,
  fileNames: readonly string[],
  patterns: readonly RegExp[]
) {
  return (ctx: ChecklistEvalContext): ChecklistItem => {
    const match = readAnyArtifact(ctx.projectRoot, ctx.featureId, fileNames);
    if (!match) {
      return { id, description, status: 'fail', detail: `缺少 ${fileNames.join(' / ')}` };
    }
    return {
      id,
      description,
      status: hasAnyPattern(match.content, patterns) ? 'pass' : 'fail',
      detail: hasAnyPattern(match.content, patterns)
        ? undefined
        : `未找到 ${patterns.map((pattern) => String(pattern)).join(' 或 ')}`,
    };
  };
}

function fileHasSection(
  id: string,
  description: string,
  fileName: string,
  patterns: readonly RegExp[]
) {
  return fileContainsAny(id, description, fileName, patterns);
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
      (ctx) => ({
        id: 'runtime-stage-initialized',
        description: '运行态已初始化到 init 节点',
        status:
          ctx.state?.currentStage === Stage.INIT && ctx.state?.featureId ? 'pass' : 'fail',
        detail:
          ctx.state?.currentStage === Stage.INIT
            ? undefined
            : 'currentStage 不是 00_init 或缺少 featureId',
      }),
      fileExistsAll('base-docs-created', '基础文档骨架已创建', [
        'constitution.md',
        'findings.md',
        'task_plan.md',
      ]),
    ],
  },
  [Stage.SPECIFY]: {
    requiredChecks: [
      fileExists('spec-exists', 'spec.md 文件存在', 'spec.md'),
      fileContainsAnyFromFiles('spec-non-empty', 'spec.md 非空（>100字符）', ['spec.md'], [
        /[\s\S]{100,}/,
      ]),
      fileContainsAny(
        'spec-has-background',
        'spec.md 包含背景章节',
        'spec.md',
        [/^#{1,3}\s*(背景|Background).*$/im]
      ),
      fileContainsAny(
        'spec-has-goals',
        'spec.md 包含目标章节',
        'spec.md',
        [/^#{1,3}\s*(目标|Goals?|Objectives?).*$/im]
      ),
      fileContainsAny(
        'spec-has-scope',
        'spec.md 包含范围章节',
        'spec.md',
        [/^#{1,3}\s*(范围|Scope).*$/im]
      ),
    ],
  },
  [Stage.DESIGN]: {
    requiredChecks: [
      fileExists('design-exists', 'design.md 文件存在', 'design.md'),
      fileContainsAnyFromFiles('design-non-empty', 'design.md 非空', ['design.md'], [
        /[\s\S]{64,}/,
      ]),
      fileContainsAny(
        'design-has-architecture',
        'design.md 包含方案结构',
        'design.md',
        [/^#{1,3}\s*(架构|Architecture|方案结构).*$/im]
      ),
      fileContainsAny(
        'design-has-dataflow',
        'design.md 包含数据流或交互流',
        'design.md',
        [/^#{1,3}\s*(数据流|交互流|Data Flow|Flow).*$/im]
      ),
      fileContainsAny(
        'design-has-risks',
        'design.md 包含风险与权衡',
        'design.md',
        [/^#{1,3}\s*(风险|Risks?|Trade-offs?|权衡).*$/im]
      ),
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
      (ctx) => {
        const content = readArtifact(ctx.projectRoot, ctx.featureId, 'task_plan.md');
        if (!content) {
          return { id: 'task-statuses-valid', description: '任务状态字段合法', status: 'fail', detail: '缺少 task_plan.md' };
        }
        try {
          parseTaskPlanContent(content);
          return {
            id: 'task-statuses-valid',
            description: '任务状态字段合法',
            status: 'pass',
          };
        } catch (error) {
          return {
            id: 'task-statuses-valid',
            description: '任务状态字段合法',
            status: 'fail',
            detail: (error as Error).message,
          };
        }
      },
      (ctx) => {
        const content = readArtifact(ctx.projectRoot, ctx.featureId, 'task_plan.md');
        if (!content) {
          return { id: 'plan-has-sequencing', description: '包含执行顺序或任务分组说明', status: 'fail', detail: '缺少 task_plan.md' };
        }
        try {
          const plan = parseTaskPlanContent(content);
          const hasSequencing =
            plan.tasks.some((task) => Boolean(task.next_step?.trim())) ||
            /(?:顺序|分组|flow|sequence)/i.test(content);
          return {
            id: 'plan-has-sequencing',
            description: '包含执行顺序或任务分组说明',
            status: hasSequencing ? 'pass' : 'fail',
            detail: hasSequencing ? undefined : '缺少 next_step 或顺序说明',
          };
        } catch (error) {
          return {
            id: 'plan-has-sequencing',
            description: '包含执行顺序或任务分组说明',
            status: 'fail',
            detail: (error as Error).message,
          };
        }
      },
    ],
  },
  [Stage.IMPLEMENT]: {
    requiredChecks: [
      fileExists('task-plan-exists', 'task_plan.md 文件存在', 'task_plan.md'),
      (ctx) => {
        const content = readArtifact(ctx.projectRoot, ctx.featureId, 'task_plan.md');
        if (!content) {
          return {
            id: 'task-progress-updated',
            description: 'task_plan.md 中至少一个任务状态已更新',
            status: 'fail',
            detail: '缺少 task_plan.md',
          };
        }
        try {
          const plan = parseTaskPlanContent(content);
          const hasProgress = plan.tasks.some((task) => task.status !== 'todo');
          return {
            id: 'task-progress-updated',
            description: 'task_plan.md 中至少一个任务状态已更新',
            status: hasProgress ? 'pass' : 'fail',
            detail: hasProgress ? undefined : '所有任务仍为 todo',
          };
        } catch (error) {
          return {
            id: 'task-progress-updated',
            description: 'task_plan.md 中至少一个任务状态已更新',
            status: 'fail',
            detail: (error as Error).message,
          };
        }
      },
      fileHasSection(
        'findings-has-impl-notes',
        'findings.md 包含实现说明段',
        'findings.md',
        [/^#{1,3}\s*(Implementation|实现说明|实现).*$/im]
      ),
    ],
  },
  [Stage.VERIFY]: {
    requiredChecks: [
      fileExists('verify-exists', 'verify.md 文件存在', 'verify.md'),
      fileContainsAnyFromFiles('verify-non-empty', 'verify.md 非空', ['verify.md'], [
        /[\s\S]{64,}/,
      ]),
      fileHasSection(
        'verify-has-scope',
        'verify.md 包含验证范围',
        'verify.md',
        [/^#{1,3}\s*(验证范围|Scope|范围).*$/im]
      ),
      fileHasSection(
        'verify-has-method',
        'verify.md 包含验证方法',
        'verify.md',
        [/^#{1,3}\s*(验证方法|Method|方法).*$/im]
      ),
      fileHasSection(
        'verify-has-result',
        'verify.md 包含验证结果',
        'verify.md',
        [/^#{1,3}\s*(验证结果|Result|结果).*$/im]
      ),
      fileHasSection(
        'verify-has-risks',
        'verify.md 包含未覆盖风险',
        'verify.md',
        [/^#{1,3}\s*(风险|Risks?|未覆盖风险).*$/im]
      ),
    ],
  },
  [Stage.WRAP_UP]: {
    requiredChecks: [
      fileExists('wrap-up-exists', 'wrap_up.md 文件存在', 'wrap_up.md'),
      fileContainsAnyFromFiles(
        'wrap-up-has-summary',
        '包含最终交付摘要',
        ['wrap_up.md'],
        [/^#{1,3}\s*(最终交付摘要|Summary|总结).*$/im]
      ),
      fileContainsAnyFromFiles(
        'wrap-up-has-open-issues',
        '包含剩余问题',
        ['wrap_up.md'],
        [/^#{1,3}\s*(剩余问题|Open Issues|Outstanding Issues).*$/im]
      ),
      fileContainsAnyFromFiles(
        'wrap-up-has-next-steps',
        '包含后续建议',
        ['wrap_up.md'],
        [/^#{1,3}\s*(后续建议|Next Steps|后续步骤).*$/im]
      ),
    ],
  },
  [Stage.RELEASE]: {
    requiredChecks: [
      fileExists('release-exists', 'release.md 文件存在', 'release.md'),
      fileContainsAnyFromFiles('release-has-content', '包含发布内容', ['release.md'], [
        /[\s\S]{64,}/,
      ]),
      fileHasSection(
        'release-has-risks',
        '包含风险说明',
        'release.md',
        [/^#{1,3}\s*(风险|Risks?|风险说明).*$/im]
      ),
      fileHasSection(
        'release-has-decision',
        '包含发布结论',
        'release.md',
        [/^#{1,3}\s*(发布结论|Decision|结论).*$/im]
      ),
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
