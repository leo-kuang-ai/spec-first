import { describe, expect, it } from 'vitest';
import {
  FIRST_RUNTIME_ROLES,
  FIRST_RUNTIME_STAGES,
  type FirstRuntimeIndex,
  type FirstRuntimeSummary,
  type FirstRoleViews,
  type FirstStageViews,
  type FirstSpecView,
  type FirstDesignView,
  type FirstCodeView,
  type FirstVerifyView,
} from '../../src/core/skill-runtime/first-runtime-types.js';

describe('first runtime types', () => {
  it('exports stage and role constants', () => {
    expect(FIRST_RUNTIME_STAGES).toEqual(['spec', 'design', 'code', 'verify']);
    expect(FIRST_RUNTIME_ROLES).toEqual(['product', 'dev', 'qa', 'architect']);
  });

  it('accepts a valid runtime index shape', () => {
    const index: FirstRuntimeIndex = {
      version: '1.0.0',
      lastRun: '2026-03-08T12:00:00.000Z',
      mode: 'quick',
      summary: {
        path: '.spec-first/runtime/first/summary.json',
        fileHash: 'hash-summary',
        lastUpdated: '2026-03-08T12:00:00.000Z',
        healthy: true,
      },
      roleViews: {
        path: '.spec-first/runtime/first/role-views.json',
        fileHash: 'hash-role',
        lastUpdated: '2026-03-08T12:00:00.000Z',
        healthy: true,
      },
      stageViews: {
        path: '.spec-first/runtime/first/stage-views.json',
        fileHash: 'hash-stage',
        lastUpdated: '2026-03-08T12:00:00.000Z',
        healthy: true,
      },
      docsProjection: {
        'docs/first/README.md': {
          path: 'docs/first/README.md',
          fileHash: 'hash-doc',
          lastUpdated: '2026-03-08T12:00:00.000Z',
          healthy: true,
        },
      },
      status: 'current',
    };

    expect(index.mode).toBe('quick');
    expect(index.stageViews.fileHash).toBe('hash-stage');
  });

  it('accepts summary, role views, and stage views shapes', () => {
    const summary: FirstRuntimeSummary = {
      generatedAt: '2026-03-08T12:00:00.000Z',
      mode: 'deep',
      project: {
        name: 'spec-first',
        platformType: 'backend',
        overview: 'Spec-first workflow runtime',
      },
      modules: ['src/core/skill-runtime'],
      capabilities: ['runtime truth source', 'stage view generation'],
      entryPoints: ['src/cli/index.ts'],
      dataModels: ['Feature', 'StageState'],
      apiSurface: ['spec-first init', 'spec-first orchestrate'],
      risks: ['old docs/first dependency'],
      evidence: ['src/core/skill-runtime/dispatcher.ts:345'],
    };

    const specView: FirstSpecView = {
      stage: 'spec',
      summary: 'spec summary',
      businessCapabilities: ['feature init'],
      coreEntities: ['Feature'],
      dependencies: ['stage-state'],
      warnings: ['runtime missing degrades to docs'],
    };

    const designView: FirstDesignView = {
      stage: 'design',
      summary: 'design summary',
      moduleBoundaries: ['src/core', 'src/cli'],
      integrationPoints: ['CLI', 'runtime store'],
      technicalConstraints: ['ESM', 'strict'],
      risks: ['half-switch state'],
    };

    const codeView: FirstCodeView = {
      stage: 'code',
      summary: 'code summary',
      entryPoints: ['src/cli/commands/init.ts'],
      likelyChangeAreas: ['src/core/skill-runtime'],
      changeHazards: ['legacy docs/first coupling'],
      verificationHooks: ['tests/unit/init.test.ts'],
    };

    const verifyView: FirstVerifyView = {
      stage: 'verify',
      summary: 'verify summary',
      testFocus: ['runtime truth-source checks'],
      riskAreas: ['dispatcher still reading docs'],
      validationHooks: ['pnpm vitest run tests/unit/first-*.test.ts'],
      releaseBlockers: ['stage views missing'],
    };

    const roleViews: FirstRoleViews = {
      product: { role: 'product', summary: 'product', focus: ['capabilities'], warnings: [] },
      dev: { role: 'dev', summary: 'dev', focus: ['entryPoints'], warnings: [] },
      qa: { role: 'qa', summary: 'qa', focus: ['validationHooks'], warnings: [] },
      architect: { role: 'architect', summary: 'arch', focus: ['constraints'], warnings: [] },
    };

    const stageViews: FirstStageViews = {
      spec: specView,
      design: designView,
      code: codeView,
      verify: verifyView,
    };

    expect(summary.project.name).toBe('spec-first');
    expect(roleViews.dev.role).toBe('dev');
    expect(stageViews.verify.releaseBlockers).toContain('stage views missing');
  });
});
