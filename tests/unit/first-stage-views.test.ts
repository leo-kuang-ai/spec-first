import { describe, expect, it } from 'vitest';
import { buildStageViews } from '../../src/core/skill-runtime/first-stage-views.js';
import type { FirstRuntimeSummary } from '../../src/core/skill-runtime/first-runtime-types.js';

const summary: FirstRuntimeSummary = {
  generatedAt: '2026-03-08T12:00:00.000Z',
  mode: 'deep',
  project: {
    name: 'spec-first',
    platformType: 'backend',
    overview: 'Runtime truth-source migration',
  },
  modules: ['src/core/skill-runtime', 'src/cli/commands'],
  capabilities: ['runtime truth source', 'docs projection'],
  entryPoints: ['src/cli/commands/init.ts'],
  dataModels: ['Feature', 'StageState'],
  apiSurface: ['spec-first init'],
  risks: ['half-switch state'],
  evidence: ['src/core/skill-runtime/dispatcher.ts:1'],
};

describe('first stage views builder', () => {
  it('builds spec/design/code/verify views from summary', () => {
    const views = buildStageViews(summary);

    expect(views.spec.businessCapabilities).toEqual(['runtime truth source', 'docs projection']);
    expect(views.spec.coreEntities).toEqual(['Feature', 'StageState']);
    expect(views.design.moduleBoundaries).toEqual(['src/core/skill-runtime', 'src/cli/commands']);
    expect(views.design.integrationPoints).toEqual(['spec-first init']);
    expect(views.code.entryPoints).toEqual(['src/cli/commands/init.ts']);
    expect(views.code.changeHazards).toEqual(['half-switch state']);
    expect(views.verify.testFocus).toEqual(['runtime truth source', 'docs projection']);
    expect(views.verify.releaseBlockers).toEqual(['half-switch state']);
  });

  it('builds enriched stage-specific summaries and hints', () => {
    const views = buildStageViews(summary);

    expect(views.spec.summary).toContain('2 项能力');
    expect(views.spec.dependencies).toContain('接口: spec-first init');
    expect(views.design.technicalConstraints).toContain('平台类型: backend');
    expect(views.code.callPathHints).toContain('入口 -> src/cli/commands/init.ts');
    expect(views.code.couplingPoints).toContain('模块耦合: src/core/skill-runtime');
    expect(views.verify.criticalFlows).toContain('入口链路: src/cli/commands/init.ts');
    expect(views.verify.validationFocus).toContain('风险验证: half-switch state');
    expect(views.verify.recommendedChecks).toContain('证据核对: src/core/skill-runtime/dispatcher.ts:1');
  });
});
