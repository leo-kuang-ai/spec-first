import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CANONICAL_PROJECTION_DOCS } from '../../src/core/skill-runtime/first-artifact-mapping.js';
import {
  writeFirstChangeMap,
  writeFirstConventions,
  writeFirstCriticalFlows,
  writeFirstEntryGuide,
  writeFirstRebootGuide,
  writeFirstRuntimeIndex,
  writeFirstRuntimeSummary,
  writeFirstRoleViews,
  writeFirstSteering,
  writeFirstStageViews,
} from '../../src/core/skill-runtime/first-runtime-store.js';
import type { FirstRuntimeIndex } from '../../src/core/skill-runtime/first-runtime-types.js';

const TMP = join(import.meta.dirname, '../fixtures/.tmp-context-resolver');
const FEATURE_ID = 'FSREQ-20260312-CONTEXT-001';

beforeEach(() => {
  mkdirSync(join(TMP, '.spec-first'), { recursive: true });
  mkdirSync(join(TMP, 'specs', FEATURE_ID), { recursive: true });
  writeFileSync(join(TMP, '.spec-first', 'current'), `${FEATURE_ID}\n`, 'utf-8');
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

function makeHealthyIndex(): FirstRuntimeIndex {
  return {
    version: '1.0.0',
    lastRun: '2026-03-12T12:00:00.000Z',
    mode: 'quick',
    summary: {
      path: '.spec-first/runtime/first/summary.json',
      fileHash: 'summary',
      lastUpdated: '2026-03-12T12:00:00.000Z',
      healthy: true,
    },
    roleViews: {
      path: '.spec-first/runtime/first/role-views.json',
      fileHash: 'roles',
      lastUpdated: '2026-03-12T12:00:00.000Z',
      healthy: true,
    },
    stageViews: {
      path: '.spec-first/runtime/first/stage-views.json',
      fileHash: 'stages',
      lastUpdated: '2026-03-12T12:00:00.000Z',
      healthy: true,
    },
    steering: {
      path: '.spec-first/runtime/first/steering.json',
      fileHash: 'steering',
      lastUpdated: '2026-03-12T12:00:00.000Z',
      healthy: true,
    },
    conventions: {
      path: '.spec-first/runtime/first/conventions.json',
      fileHash: 'conventions',
      lastUpdated: '2026-03-12T12:00:00.000Z',
      healthy: true,
    },
    criticalFlows: {
      path: '.spec-first/runtime/first/critical-flows.json',
      fileHash: 'critical-flows',
      lastUpdated: '2026-03-12T12:00:00.000Z',
      healthy: true,
    },
    changeMap: {
      path: '.spec-first/runtime/first/change-map.json',
      fileHash: 'change-map',
      lastUpdated: '2026-03-12T12:00:00.000Z',
      healthy: true,
    },
    entryGuide: {
      path: '.spec-first/runtime/first/entry-guide.json',
      fileHash: 'entry-guide',
      lastUpdated: '2026-03-12T12:00:00.000Z',
      healthy: true,
    },
    rebootGuide: {
      path: '.spec-first/runtime/first/reboot-guide.json',
      fileHash: 'reboot-guide',
      lastUpdated: '2026-03-12T12:00:00.000Z',
      healthy: true,
    },
    docsProjection: {},
    status: 'current',
  };
}

function writeRichRuntimeAssets() {
  writeFirstSteering(TMP, {
    product: {
      overview: 'Project steering overview',
      coreScenarios: ['authoring'],
      nonGoals: [],
      glossary: ['Feature'],
    },
    tech: {
      stack: ['TypeScript'],
      constraints: ['strict'],
      forbiddenPatterns: ['docs-only truth'],
    },
    structure: {
      modules: ['src/core/skill-runtime'],
      boundaries: ['src/cli'],
      entryRules: ['read runtime truth first'],
    },
  });
  writeFirstConventions(TMP, {
    api: {
      observedPatterns: ['spec-first CLI'],
      deviations: [],
      recommendedConvention: 'Keep CLI verbs stable.',
      evidence: ['src/cli'],
    },
    module: {
      observedPatterns: ['src/core/skill-runtime'],
      deviations: [],
      recommendedConvention: 'Keep runtime logic under src/core.',
      evidence: ['src/core/skill-runtime'],
    },
    testing: {
      observedPatterns: ['Vitest'],
      deviations: [],
      recommendedConvention: 'Use Vitest.',
      evidence: ['tests/unit'],
    },
    projectRules: {
      observedPatterns: ['runtime truth first'],
      deviations: [],
      recommendedConvention: 'Read runtime truth before docs.',
      evidence: ['.spec-first/runtime/first'],
    },
  });
  writeFirstCriticalFlows(TMP, [
    {
      flowId: 'flow-cli-entry',
      name: 'CLI Entry Flow',
      entryPoints: ['src/cli/index.ts'],
      coreModules: ['src/core/skill-runtime'],
      invariants: ['runtime truth first'],
      verificationHooks: ['pnpm vitest'],
    },
  ]);
  writeFirstChangeMap(TMP, [
    {
      changeType: 'runtime-asset-extension',
      likelyModules: ['src/core/skill-runtime'],
      likelyCommands: ['src/cli/commands/first.ts'],
      likelyConfigs: ['package.json'],
      likelyTests: ['tests/unit/context-resolver.test.ts'],
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
  ]);
  writeFirstEntryGuide(TMP, [
    {
      taskCategory: 'runtime-extension',
      readFirst: ['.spec-first/runtime/first/summary.json'],
      thenRead: ['src/core/skill-runtime/first-runtime-store.ts'],
      avoidEntry: ['docs/first/README.md'],
      relatedFlows: ['flow-cli-entry'],
    },
    {
      taskCategory: 'docs-projection',
      readFirst: ['docs/first/README.md'],
      thenRead: ['src/core/skill-runtime/first-doc-projection.ts'],
      avoidEntry: ['legacy docs as truth'],
      relatedFlows: ['flow-cli-entry'],
    },
  ]);
  writeFirstRebootGuide(TMP, {
    projectWhat: 'spec-first project cognition',
    whereToStart: ['.spec-first/runtime/first/summary.json'],
    currentCriticalAreas: ['runtime truth first'],
    commonChangePaths: ['src/core/skill-runtime'],
    verifyChecklist: ['pnpm vitest'],
  });
}

describe('resolveSkillContext', () => {
  it('returns runtime context when first runtime is healthy', async () => {
    const { resolveSkillContext } = await import('../../src/core/skill-runtime/context-resolver.js');

    writeFirstRuntimeIndex(TMP, makeHealthyIndex());
    writeFirstRuntimeSummary(TMP, {
      generatedAt: '2026-03-12T12:00:00.000Z',
      mode: 'quick',
      project: {
        name: 'spec-first',
        platformType: 'cli',
      },
      techStack: ['TypeScript', 'Vitest'],
      modules: ['cli', 'skill-runtime'],
      capabilities: [],
      entryPoints: [],
      dataModels: [],
      apiSurface: [],
      risks: ['dynamic injection drift'],
      evidence: [],
    });
    writeFirstRoleViews(TMP, {
      product: { role: 'product', summary: 'Product summary', focus: [], warnings: [] },
      dev: { role: 'dev', summary: 'Dev summary', focus: [], warnings: [] },
      qa: { role: 'qa', summary: 'QA summary', focus: [], warnings: [] },
      architect: { role: 'architect', summary: 'Architect summary', focus: [], warnings: [] },
    });
    writeFirstStageViews(TMP, {
      spec: {
        stage: 'spec',
        summary: 'Spec summary from runtime',
        businessCapabilities: [],
        coreEntities: [],
        dependencies: [],
        warnings: [],
      },
      design: {
        stage: 'design',
        summary: 'Design summary',
        moduleBoundaries: [],
        integrationPoints: [],
        technicalConstraints: [],
        risks: [],
      },
      code: {
        stage: 'code',
        summary: 'Code summary',
        entryPoints: [],
        likelyChangeAreas: [],
        changeHazards: [],
        verificationHooks: [],
      },
      verify: {
        stage: 'verify',
        summary: 'Verify summary',
        testFocus: [],
        riskAreas: [],
        validationHooks: [],
        releaseBlockers: [],
      },
    });
    writeRichRuntimeAssets();

    const result = resolveSkillContext(TMP, 'spec', FEATURE_ID);

    expect(result.source).toBe('runtime');
    expect(result.backgroundInputStatus).toBe('full');
    expect(result.stageViewSummary).toBe('Spec summary from runtime');
    expect(result.firstSummaryLite?.projectName).toBe('spec-first');
    expect(result.requiredAssetNames).toEqual(['stage-views']);
    expect(result.optionalAssetNames).toEqual(['conventions']);
    expect(result.optional.conventions?.projectRules.recommendedConvention).toContain(
      'runtime truth'
    );
    expect(result.featureId).toBe(FEATURE_ID);
  });

  it('falls back to docs context when runtime is unavailable', async () => {
    const { resolveSkillContext } = await import('../../src/core/skill-runtime/context-resolver.js');

    const index = makeHealthyIndex();
    index.summary.healthy = false;
    index.roleViews.healthy = false;
    index.stageViews.healthy = false;
    index.docsProjection = Object.fromEntries(
      CANONICAL_PROJECTION_DOCS.map((docPath) => [
        docPath,
        {
          path: docPath,
          fileHash: `hash-${docPath}`,
          lastUpdated: '2026-03-12T12:00:00.000Z',
          healthy: true,
        },
      ])
    );
    writeFirstRuntimeIndex(TMP, index);
    mkdirSync(join(TMP, 'docs', 'first'), { recursive: true });
    for (const docPath of CANONICAL_PROJECTION_DOCS) {
      if (docPath !== 'docs/first/stage-views.md') {
        writeFileSync(join(TMP, docPath), `# ${docPath}\n`, 'utf-8');
      }
    }
    writeFileSync(
      join(TMP, 'docs', 'first', 'stage-views.md'),
      [
        '## Design View',
        '',
        '- Summary: Design summary from docs',
      ].join('\n'),
      'utf-8',
    );

    const result = resolveSkillContext(TMP, 'design', FEATURE_ID);

    expect(result.source).toBe('docs');
    expect(result.backgroundInputStatus).toBe('degraded');
    expect(result.stageViewSummary).toBe('Design summary from docs');
    expect(result.fallback.source).toBe('docs');
    expect(result.missingRequiredAssets).toEqual(['stage-views']);
  });

  it('returns none when both runtime and docs are unavailable', async () => {
    const { resolveSkillContext } = await import('../../src/core/skill-runtime/context-resolver.js');

    const result = resolveSkillContext(TMP, 'code', FEATURE_ID);

    expect(result.source).toBe('none');
    expect(result.backgroundInputStatus).toBe('blind');
    expect(result.missingAssets).toEqual([
      'summary',
      'role-views',
      'stage-views',
      'steering',
      'conventions',
      'critical-flows',
      'change-map',
      'entry-guide',
      'reboot-guide',
    ]);
    expect(result.missingRequiredAssets).toEqual(['stage-views']);
    expect(result.recommendedAction).toBe('run-first');
  });

  it('reports docs as source for background skills when runtime summary is unavailable', async () => {
    const { resolveSkillContext } = await import('../../src/core/skill-runtime/context-resolver.js');

    const index = makeHealthyIndex();
    index.summary.healthy = false;
    index.roleViews.healthy = false;
    index.stageViews.healthy = false;
    index.docsProjection = Object.fromEntries(
      CANONICAL_PROJECTION_DOCS.map((docPath) => [
        docPath,
        {
          path: docPath,
          fileHash: `hash-${docPath}`,
          lastUpdated: '2026-03-12T12:00:00.000Z',
          healthy: true,
        },
      ])
    );
    writeFirstRuntimeIndex(TMP, index);
    mkdirSync(join(TMP, 'docs', 'first'), { recursive: true });
    for (const docPath of CANONICAL_PROJECTION_DOCS) {
      writeFileSync(join(TMP, docPath), `# ${docPath}\n`, 'utf-8');
    }

    const result = resolveSkillContext(TMP, 'plan', FEATURE_ID);

    expect(result.source).toBe('docs');
    expect(result.backgroundInputStatus).toBe('degraded');
    expect(result.requiredAssetNames).toEqual(['summary']);
    expect(result.optionalAssetNames).toEqual(['change-map', 'critical-flows', 'entry-guide']);
    expect(result.fallback.warning).toContain('summary');
  });

  it('falls back to docs for stage skills when stage runtime asset is unhealthy', async () => {
    const { resolveSkillContext } = await import('../../src/core/skill-runtime/context-resolver.js');

    const index = makeHealthyIndex();
    index.stageViews.healthy = false;
    index.docsProjection = Object.fromEntries(
      CANONICAL_PROJECTION_DOCS.map((docPath) => [
        docPath,
        {
          path: docPath,
          fileHash: `hash-${docPath}`,
          lastUpdated: '2026-03-12T12:00:00.000Z',
          healthy: true,
        },
      ])
    );
    writeFirstRuntimeIndex(TMP, index);
    writeFirstStageViews(TMP, {
      spec: {
        stage: 'spec',
        summary: 'stale runtime spec summary',
        businessCapabilities: [],
        coreEntities: [],
        dependencies: [],
        warnings: [],
      },
      design: {
        stage: 'design',
        summary: 'stale runtime design summary',
        moduleBoundaries: [],
        integrationPoints: [],
        technicalConstraints: [],
        risks: [],
      },
      code: {
        stage: 'code',
        summary: 'stale runtime code summary',
        entryPoints: [],
        likelyChangeAreas: [],
        changeHazards: [],
        verificationHooks: [],
      },
      verify: {
        stage: 'verify',
        summary: 'stale runtime verify summary',
        testFocus: [],
        riskAreas: [],
        validationHooks: [],
        releaseBlockers: [],
      },
    });
    mkdirSync(join(TMP, 'docs', 'first'), { recursive: true });
    for (const docPath of CANONICAL_PROJECTION_DOCS) {
      if (docPath !== 'docs/first/stage-views.md') {
        writeFileSync(join(TMP, docPath), `# ${docPath}\n`, 'utf-8');
      }
    }
    writeFileSync(
      join(TMP, 'docs', 'first', 'stage-views.md'),
      ['## Spec View', '', '- Summary: Fresh docs spec summary'].join('\n'),
      'utf-8',
    );

    const result = resolveSkillContext(TMP, 'spec', FEATURE_ID);

    expect(result.source).toBe('docs');
    expect(result.stageViewSummary).toBe('Fresh docs spec summary');
    expect(result.fallback.warning).toContain('stage-views');
  });

  it('does not fallback to docs for stage skills when canonical docs health is unavailable', async () => {
    const { resolveSkillContext } = await import('../../src/core/skill-runtime/context-resolver.js');

    mkdirSync(join(TMP, 'docs', 'first'), { recursive: true });
    writeFileSync(
      join(TMP, 'docs', 'first', 'stage-views.md'),
      ['## Spec View', '', '- Summary: Fresh docs spec summary'].join('\n'),
      'utf-8',
    );

    const result = resolveSkillContext(TMP, 'spec', FEATURE_ID);

    expect(result.source).toBe('none');
    expect(result.recommendedAction).toBe('run-first');
  });

  it('does not fallback to docs for onboarding when canonical docs health is unavailable', async () => {
    const { resolveSkillContext } = await import('../../src/core/skill-runtime/context-resolver.js');

    mkdirSync(join(TMP, 'docs', 'first'), { recursive: true });
    writeFileSync(join(TMP, 'docs', 'first', 'role-views.md'), '- Summary: onboarding docs\n', 'utf-8');

    const result = resolveSkillContext(TMP, 'onboarding', FEATURE_ID);

    expect(result.source).toBe('none');
    expect(result.recommendedAction).toBe('run-first');
  });

  it('filters optional task-category slices for planning skills', async () => {
    const { resolveSkillContext } = await import('../../src/core/skill-runtime/context-resolver.js');

    writeFirstRuntimeIndex(TMP, makeHealthyIndex());
    writeFirstRuntimeSummary(TMP, {
      generatedAt: '2026-03-12T12:00:00.000Z',
      mode: 'quick',
      project: {
        name: 'spec-first',
        platformType: 'cli',
      },
      techStack: ['TypeScript', 'Vitest'],
      modules: ['cli', 'skill-runtime'],
      capabilities: [],
      entryPoints: [],
      dataModels: [],
      apiSurface: [],
      risks: ['dynamic injection drift'],
      evidence: [],
    });
    writeRichRuntimeAssets();

    const result = resolveSkillContext(TMP, 'plan', FEATURE_ID);

    expect(result.source).toBe('runtime');
    expect(result.optional.entryGuide?.map((entry) => entry.taskCategory)).toEqual([
      'runtime-extension',
    ]);
    expect(result.optional.changeMap?.map((entry) => entry.changeType)).toEqual([
      'runtime-asset-extension',
    ]);
  });

  it('does not over-filter optional slices for review skill', async () => {
    const { resolveSkillContext } = await import('../../src/core/skill-runtime/context-resolver.js');

    writeFirstRuntimeIndex(TMP, makeHealthyIndex());
    writeFirstRuntimeSummary(TMP, {
      generatedAt: '2026-03-12T12:00:00.000Z',
      mode: 'quick',
      project: { name: 'spec-first', platformType: 'cli' },
      techStack: ['TypeScript', 'Vitest'],
      modules: ['cli', 'skill-runtime'],
      capabilities: [],
      entryPoints: [],
      dataModels: [],
      apiSurface: [],
      risks: [],
      evidence: [],
    });
    writeFirstRoleViews(TMP, {
      product: { role: 'product', summary: 'Product summary', focus: [], warnings: [] },
      dev: { role: 'dev', summary: 'Dev summary', focus: [], warnings: [] },
      qa: { role: 'qa', summary: 'QA summary', focus: [], warnings: [] },
      architect: { role: 'architect', summary: 'Architect summary', focus: [], warnings: [] },
    });
    writeFirstStageViews(TMP, {
      spec: { stage: 'spec', summary: 'Spec summary', businessCapabilities: [], coreEntities: [], dependencies: [], warnings: [] },
      design: { stage: 'design', summary: 'Design summary', moduleBoundaries: [], integrationPoints: [], technicalConstraints: [], risks: [] },
      code: { stage: 'code', summary: 'Code summary', entryPoints: [], likelyChangeAreas: [], changeHazards: [], verificationHooks: [] },
      verify: { stage: 'verify', summary: 'Verify summary', testFocus: [], riskAreas: [], validationHooks: [], releaseBlockers: [] },
    });
    writeRichRuntimeAssets();

    const result = resolveSkillContext(TMP, 'review', FEATURE_ID);

    expect(result.source).toBe('runtime');
    expect(result.optional.entryGuide?.map((entry) => entry.taskCategory)).toEqual([
      'runtime-extension',
      'docs-projection',
    ]);
    expect(result.optional.changeMap?.map((entry) => entry.changeType)).toEqual([
      'runtime-asset-extension',
      'docs-projection-adjustment',
    ]);
  });

  it('does not fallback to docs for background skills when canonical docs health is unavailable', async () => {
    const { resolveSkillContext } = await import('../../src/core/skill-runtime/context-resolver.js');

    mkdirSync(join(TMP, 'docs', 'first'), { recursive: true });
    writeFileSync(join(TMP, 'docs', 'first', 'summary.md'), '# stale docs\n', 'utf-8');
    writeFileSync(join(TMP, 'docs', 'first', 'README.md'), '# stale readme\n', 'utf-8');

    const result = resolveSkillContext(TMP, 'plan', FEATURE_ID);

    expect(result.source).toBe('none');
    expect(result.recommendedAction).toBe('run-first');
  });
});
