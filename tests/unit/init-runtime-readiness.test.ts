import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkInitReadiness, summarizeFirstArtifacts } from '../../src/cli/commands/init.js';
import { writeFirstRuntimeIndex, writeFirstRuntimeSummary, writeFirstRoleViews, writeFirstStageViews } from '../../src/core/skill-runtime/first-runtime-store.js';
import type { FirstRuntimeIndex, FirstRuntimeSummary, FirstRoleViews, FirstStageViews } from '../../src/core/skill-runtime/first-runtime-types.js';

const TEST_ROOT = join(import.meta.dirname, '../fixtures/.tmp-init-runtime-readiness');

const index: FirstRuntimeIndex = {
  version: '1.0.0',
  lastRun: '2026-03-08T12:00:00.000Z',
  mode: 'quick',
  summary: { path: '.spec-first/runtime/first/summary.json', fileHash: 'summary', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
  roleViews: { path: '.spec-first/runtime/first/role-views.json', fileHash: 'roles', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
  stageViews: { path: '.spec-first/runtime/first/stage-views.json', fileHash: 'stages', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
  docsProjection: {},
  status: 'current',
};
const summary: FirstRuntimeSummary = {
  generatedAt: '2026-03-08T12:00:00.000Z', mode: 'quick', project: { name: 'spec-first' }, modules: [], capabilities: [], entryPoints: [], dataModels: [], apiSurface: [], risks: [], evidence: [],
};
const roleViews: FirstRoleViews = {
  product: { role: 'product', summary: 'product', focus: [], warnings: [] },
  dev: { role: 'dev', summary: 'dev', focus: [], warnings: [] },
  qa: { role: 'qa', summary: 'qa', focus: [], warnings: [] },
  architect: { role: 'architect', summary: 'architect', focus: [], warnings: [] },
};
const stageViews: FirstStageViews = {
  spec: { stage: 'spec', summary: 'spec', businessCapabilities: [], coreEntities: [], dependencies: [], warnings: [] },
  design: { stage: 'design', summary: 'design', moduleBoundaries: [], integrationPoints: [], technicalConstraints: [], risks: [] },
  code: { stage: 'code', summary: 'code', entryPoints: [], likelyChangeAreas: [], changeHazards: [], verificationHooks: [] },
  verify: { stage: 'verify', summary: 'verify', testFocus: [], riskAreas: [], validationHooks: [], releaseBlockers: [] },
};

describe('init runtime readiness', () => {
  beforeEach(() => {
    rmSync(TEST_ROOT, { recursive: true, force: true });
    mkdirSync(TEST_ROOT, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_ROOT, { recursive: true, force: true });
  });

  it('treats runtime truth source as readiness signal', () => {
    writeFirstRuntimeIndex(TEST_ROOT, index);
    writeFirstRuntimeSummary(TEST_ROOT, summary);
    writeFirstRoleViews(TEST_ROOT, roleViews);
    writeFirstStageViews(TEST_ROOT, stageViews);

    const readiness = checkInitReadiness(TEST_ROOT);
    expect(readiness.firstCompleted).toBe(true);
    expect(readiness.firstMissing).toEqual([]);
  });

  it('fails readiness when runtime assets exist but are marked unhealthy', () => {
    writeFirstRuntimeIndex(TEST_ROOT, {
      ...index,
      summary: { ...index.summary, healthy: false, issues: ['stale summary'] },
    });
    writeFirstRuntimeSummary(TEST_ROOT, summary);
    writeFirstRoleViews(TEST_ROOT, roleViews);
    writeFirstStageViews(TEST_ROOT, stageViews);

    const readiness = checkInitReadiness(TEST_ROOT);

    expect(readiness.firstCompleted).toBe(false);
    expect(readiness.firstMissing).toContain('.spec-first/runtime/first/summary.json');
  });

  it('does not fall back to docs projection when runtime summary is missing', () => {
    const docsFirst = join(TEST_ROOT, 'docs', 'first');
    mkdirSync(docsFirst, { recursive: true });
    writeFileSync(join(docsFirst, 'tech-stack.md'), '# Tech Stack\nNode.js + TypeScript\n', 'utf-8');
    writeFileSync(join(docsFirst, 'codebase-overview.md'), '代码量: 123 行\n', 'utf-8');
    writeFileSync(join(docsFirst, 'api-docs.md'), '3 个 API\n', 'utf-8');

    const summary = summarizeFirstArtifacts(TEST_ROOT);

    expect(summary).toEqual({
      mode: 'unknown',
      techStack: '待确认',
      codeVolume: '待确认',
      apiSurface: '待确认',
    });
  });

});
