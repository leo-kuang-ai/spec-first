import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  writeFirstRuntimeIndex,
  writeFirstRuntimeSummary,
  writeFirstRoleViews,
  writeFirstStageViews,
} from '../../src/core/skill-runtime/first-runtime-store.js';

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

describe('resolveSkillContext', () => {
  it('returns runtime context when first runtime is healthy', async () => {
    const { resolveSkillContext } = await import('../../src/core/skill-runtime/context-resolver.js');

    writeFirstRuntimeIndex(TMP, {
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
      docsProjection: {},
      status: 'current',
    });
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

    const result = resolveSkillContext(TMP, 'spec', FEATURE_ID);

    expect(result.source).toBe('runtime');
    expect(result.backgroundInputStatus).toBe('full');
    expect(result.stageViewSummary).toBe('Spec summary from runtime');
    expect(result.firstSummaryLite?.projectName).toBe('spec-first');
    expect(result.featureId).toBe(FEATURE_ID);
  });

  it('falls back to docs context when runtime is unavailable', async () => {
    const { resolveSkillContext } = await import('../../src/core/skill-runtime/context-resolver.js');

    mkdirSync(join(TMP, 'docs', 'first'), { recursive: true });
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
  });

  it('returns none when both runtime and docs are unavailable', async () => {
    const { resolveSkillContext } = await import('../../src/core/skill-runtime/context-resolver.js');

    const result = resolveSkillContext(TMP, 'code', FEATURE_ID);

    expect(result.source).toBe('none');
    expect(result.backgroundInputStatus).toBe('blind');
    expect(result.missingAssets).toEqual(['summary', 'role-views', 'stage-views']);
    expect(result.recommendedAction).toBe('run-first');
  });

  it('reports docs as source for background skills when runtime summary is unavailable', async () => {
    const { resolveSkillContext } = await import('../../src/core/skill-runtime/context-resolver.js');

    writeFirstRuntimeIndex(TMP, {
      version: '1.0.0',
      lastRun: '2026-03-12T12:00:00.000Z',
      mode: 'quick',
      summary: {
        path: '.spec-first/runtime/first/summary.json',
        fileHash: 'summary',
        lastUpdated: '2026-03-12T12:00:00.000Z',
        healthy: false,
      },
      roleViews: {
        path: '.spec-first/runtime/first/role-views.json',
        fileHash: 'roles',
        lastUpdated: '2026-03-12T12:00:00.000Z',
        healthy: false,
      },
      stageViews: {
        path: '.spec-first/runtime/first/stage-views.json',
        fileHash: 'stages',
        lastUpdated: '2026-03-12T12:00:00.000Z',
        healthy: false,
      },
      docsProjection: {},
      status: 'current',
    });
    mkdirSync(join(TMP, 'docs', 'first'), { recursive: true });
    writeFileSync(join(TMP, 'docs', 'first', 'summary.md'), '# Summary\n', 'utf-8');

    const result = resolveSkillContext(TMP, 'plan', FEATURE_ID);

    expect(result.source).toBe('docs');
    expect(result.backgroundInputStatus).toBe('degraded');
  });

  it('falls back to docs for stage skills when stage runtime asset is unhealthy', async () => {
    const { resolveSkillContext } = await import('../../src/core/skill-runtime/context-resolver.js');

    writeFirstRuntimeIndex(TMP, {
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
        healthy: false,
      },
      docsProjection: {},
      status: 'current',
    });
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
    writeFileSync(
      join(TMP, 'docs', 'first', 'stage-views.md'),
      ['## Spec View', '', '- Summary: Fresh docs spec summary'].join('\n'),
      'utf-8',
    );

    const result = resolveSkillContext(TMP, 'spec', FEATURE_ID);

    expect(result.source).toBe('docs');
    expect(result.stageViewSummary).toBe('Fresh docs spec summary');
  });
});
