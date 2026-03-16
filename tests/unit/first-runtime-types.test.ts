import { describe, expect, it } from 'vitest';
import {
  type FirstRebootGuide,
  type FirstEntryGuide,
  type FirstChangeMap,
  type FirstCriticalFlows,
  FIRST_RUNTIME_ROLES,
  FIRST_RUNTIME_STAGES,
  type FirstConventions,
  type FirstSteering,
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
      steering: {
        path: '.spec-first/runtime/first/steering.json',
        fileHash: 'hash-steering',
        lastUpdated: '2026-03-08T12:00:00.000Z',
        healthy: true,
      },
      conventions: {
        path: '.spec-first/runtime/first/conventions.json',
        fileHash: 'hash-conventions',
        lastUpdated: '2026-03-08T12:00:00.000Z',
        healthy: true,
      },
      criticalFlows: {
        path: '.spec-first/runtime/first/critical-flows.json',
        fileHash: 'hash-critical-flows',
        lastUpdated: '2026-03-08T12:00:00.000Z',
        healthy: true,
      },
      changeMap: {
        path: '.spec-first/runtime/first/change-map.json',
        fileHash: 'hash-change-map',
        lastUpdated: '2026-03-08T12:00:00.000Z',
        healthy: true,
      },
      entryGuide: {
        path: '.spec-first/runtime/first/entry-guide.json',
        fileHash: 'hash-entry-guide',
        lastUpdated: '2026-03-08T12:00:00.000Z',
        healthy: true,
      },
      rebootGuide: {
        path: '.spec-first/runtime/first/reboot-guide.json',
        fileHash: 'hash-reboot-guide',
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
    expect(index.steering.fileHash).toBe('hash-steering');
    expect(index.conventions.fileHash).toBe('hash-conventions');
    expect(index.criticalFlows.fileHash).toBe('hash-critical-flows');
    expect(index.changeMap.fileHash).toBe('hash-change-map');
    expect(index.entryGuide.fileHash).toBe('hash-entry-guide');
    expect(index.rebootGuide.fileHash).toBe('hash-reboot-guide');
  });

  it('accepts summary, steering, conventions, critical flows, change map, entry guide, reboot guide, role views, and stage views shapes', () => {
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

    const steering: FirstSteering = {
      product: {
        overview: 'Spec-first workflow runtime',
        coreScenarios: ['brownfield feature delivery'],
        nonGoals: ['replace feature findings'],
        glossary: ['Feature', 'StageState'],
      },
      tech: {
        stack: ['TypeScript', 'Vitest'],
        constraints: ['ESM'],
        forbiddenPatterns: ['docs-only truth'],
      },
      structure: {
        modules: ['src/core/skill-runtime'],
        boundaries: ['cli -> runtime'],
        entryRules: ['start from runtime truth'],
      },
    };

    const conventions: FirstConventions = {
      api: {
        observedPatterns: ['CLI: spec-first init'],
        deviations: [],
        recommendedConvention: 'Expose command surfaces through spec-first CLI verbs.',
        evidence: ['src/cli/index.ts'],
      },
      module: {
        observedPatterns: ['src/core/skill-runtime'],
        deviations: [],
        recommendedConvention: 'Keep runtime logic under src/core and CLI entry under src/cli.',
        evidence: ['src/core/skill-runtime', 'src/cli/index.ts'],
      },
      testing: {
        observedPatterns: ['Vitest'],
        deviations: [],
        recommendedConvention: 'Use Vitest for unit coverage and keep regression tests under tests/unit.',
        evidence: ['vitest.config.ts', 'tests/unit/first-runtime-types.test.ts'],
      },
      projectRules: {
        observedPatterns: ['runtime truth first'],
        deviations: [],
        recommendedConvention: 'Treat .spec-first/runtime/first as canonical truth before docs projection.',
        evidence: ['src/core/skill-runtime/first-doc-projection.ts'],
      },
    };

    const criticalFlows: FirstCriticalFlows = [
      {
        flowId: 'flow-cli-entry',
        name: 'CLI Entry Flow',
        entryPoints: ['src/cli/index.ts'],
        coreModules: ['src/core/skill-runtime'],
        invariants: ['runtime truth first'],
        verificationHooks: ['pnpm vitest run tests/unit/first-*.test.ts'],
      },
      {
        flowId: 'flow-doc-projection',
        name: 'Docs Projection Flow',
        entryPoints: ['src/core/skill-runtime/first-doc-projection.ts'],
        coreModules: ['src/core/skill-runtime'],
        invariants: ['canonical projection docs must reflect runtime truth'],
        verificationHooks: ['pnpm typecheck'],
      },
    ];

    const changeMap: FirstChangeMap = [
      {
        changeType: 'runtime-asset-extension',
        likelyModules: ['src/core/skill-runtime'],
        likelyCommands: ['src/cli/commands/first.ts'],
        likelyConfigs: ['package.json'],
        likelyTests: ['tests/unit/first-runtime-store.test.ts'],
        riskPoints: ['runtime index drift'],
      },
      {
        changeType: 'docs-projection-adjustment',
        likelyModules: ['src/core/skill-runtime/first-doc-projection.ts'],
        likelyCommands: [],
        likelyConfigs: [],
        likelyTests: ['tests/unit/first-doc-projection.test.ts'],
        riskPoints: ['canonical docs mismatch'],
      },
    ];

    const entryGuide: FirstEntryGuide = [
      {
        taskCategory: 'runtime-extension',
        readFirst: ['.spec-first/runtime/first/summary.json', '.spec-first/runtime/first/steering.json'],
        thenRead: ['src/core/skill-runtime/first-runtime-store.ts'],
        avoidEntry: ['docs/first/tech-stack.md'],
        relatedFlows: ['flow-cli-entry'],
      },
      {
        taskCategory: 'docs-projection',
        readFirst: ['docs/first/README.md', '.spec-first/runtime/first/change-map.json'],
        thenRead: ['src/core/skill-runtime/first-doc-projection.ts'],
        avoidEntry: ['legacy docs as truth'],
        relatedFlows: ['flow-doc-projection'],
      },
    ];

    const rebootGuide: FirstRebootGuide = {
      projectWhat: 'Spec-first workflow runtime',
      whereToStart: ['.spec-first/runtime/first/summary.json', 'docs/first/README.md'],
      currentCriticalAreas: ['runtime truth first', 'canonical docs projection'],
      commonChangePaths: ['src/core/skill-runtime', 'src/cli/commands/first.ts'],
      verifyChecklist: ['pnpm vitest run tests/unit/first-*.test.ts', 'pnpm typecheck'],
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
    expect(steering.tech.forbiddenPatterns).toContain('docs-only truth');
    expect(conventions.projectRules.recommendedConvention).toContain('canonical truth');
    expect(criticalFlows[0].flowId).toBe('flow-cli-entry');
    expect(changeMap[0].changeType).toBe('runtime-asset-extension');
    expect(entryGuide[0].taskCategory).toBe('runtime-extension');
    expect(rebootGuide.projectWhat).toContain('workflow runtime');
    expect(roleViews.dev.role).toBe('dev');
    expect(stageViews.verify.releaseBlockers).toContain('stage views missing');
  });
});
