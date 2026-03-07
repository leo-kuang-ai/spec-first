export const PRIMARY_STAGE_SKILL = {
  '00_init': 'init',
  '01_specify': 'spec',
  '02_design': 'design',
  '03_plan': 'task',
  '04_implement': 'code',
  '05_verify': 'verify',
  '06_wrap_up': 'archive',
  '07_release': 'golive',
  '08_done': 'done',
} as const;

export const SKILL_STAGE_REQUIREMENTS = {
  spec: '01_specify',
  'spec-review': '01_specify',
  design: '02_design',
  research: '02_design',
  task: '03_plan',
  code: '04_implement',
  review: '04_implement',
  verify: '05_verify',
  archive: '06_wrap_up',
} as const;

export const DELIVERY_ROUTE = [
  { stage: '00_init', command: 'init', route: 'skill' },
  { stage: '01_specify', command: 'spec', route: 'skill' },
  { stage: '02_design', command: 'design', route: 'skill' },
  { stage: '03_plan', command: 'task', route: 'skill' },
  { stage: '04_implement', command: 'code', route: 'skill' },
  { stage: '05_verify', command: 'verify', route: 'skill' },
  { stage: '06_wrap_up', command: 'archive', route: 'skill' },
  { stage: '07_release', command: 'golive', route: 'runtime' },
  { stage: '08_done', command: 'done', route: 'runtime' },
] as const;

export const REMOVED_SKILLS = [
  'code-review',
  'test',
  'feature-list',
  'feature-switch',
  'feature-current',
] as const;

export const RELEASE_REQUIRED_ARTIFACTS = [
  'reports/smoke-test-report.md',
  'reports/release-note.md',
] as const;

export function getSuggestedCommandForStage(stage: string, featureId?: string): string {
  const route = DELIVERY_ROUTE.find((item) => item.stage === stage);
  if (!route) {
    return featureId
      ? `spec-first stage current ${featureId} 确认当前阶段`
      : 'spec-first stage current 确认当前阶段';
  }

  if (route.route === 'skill') {
    return `/spec-first:${route.command}`;
  }

  if (route.command === 'golive') {
    return featureId
      ? `spec-first golive check ${featureId}`
      : 'spec-first golive check';
  }

  if (route.command === 'done') {
    return featureId
      ? `spec-first stage current ${featureId} 确认已完成状态`
      : 'spec-first feature current';
  }

  return featureId
    ? `spec-first stage current ${featureId} 确认当前阶段`
    : 'spec-first stage current 确认当前阶段';
}
