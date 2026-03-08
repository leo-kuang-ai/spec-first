import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { writeFirstRuntimeIndex, writeFirstRuntimeSummary, writeFirstRoleViews, writeFirstStageViews } from '../../src/core/skill-runtime/first-runtime-store.js';
import { loadFirstContext, loadFirstRoleView, loadStageView } from '../../src/core/skill-runtime/first-context.js';
import type { FirstRuntimeIndex, FirstRuntimeSummary, FirstRoleViews, FirstStageViews } from '../../src/core/skill-runtime/first-runtime-types.js';

const TEST_ROOT = join(import.meta.dirname, '../fixtures/.tmp-first-context');

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
  generatedAt: '2026-03-08T12:00:00.000Z',
  mode: 'quick',
  project: { name: 'spec-first', platformType: 'backend', overview: 'context test' },
  modules: ['src/core/skill-runtime'],
  capabilities: ['runtime truth source'],
  entryPoints: ['src/cli/index.ts'],
  dataModels: ['Feature'],
  apiSurface: ['spec-first init'],
  risks: ['legacy docs'],
  evidence: ['src/core/skill-runtime/dispatcher.ts:345'],
};

const roleViews: FirstRoleViews = {
  product: { role: 'product', summary: 'product', focus: ['capabilities'], warnings: [] },
  dev: { role: 'dev', summary: 'dev', focus: ['modules'], warnings: [] },
  qa: { role: 'qa', summary: 'qa', focus: ['risks'], warnings: [] },
  architect: { role: 'architect', summary: 'arch', focus: ['backend'], warnings: [] },
};

const stageViews: FirstStageViews = {
  spec: { stage: 'spec', summary: 'spec', businessCapabilities: ['runtime truth source'], coreEntities: ['Feature'], dependencies: ['spec-first init'], warnings: [] },
  design: { stage: 'design', summary: 'design', moduleBoundaries: ['src/core/skill-runtime'], integrationPoints: ['spec-first init'], technicalConstraints: ['backend'], risks: [] },
  code: { stage: 'code', summary: 'code', entryPoints: ['src/cli/index.ts'], likelyChangeAreas: ['src/core/skill-runtime'], changeHazards: ['legacy docs'], verificationHooks: ['tests/unit/first-context.test.ts'] },
  verify: { stage: 'verify', summary: 'verify', testFocus: ['truth source'], riskAreas: ['legacy docs'], validationHooks: ['pnpm vitest'], releaseBlockers: [] },
};

describe('first context', () => {
  beforeEach(() => {
    rmSync(TEST_ROOT, { recursive: true, force: true });
    mkdirSync(TEST_ROOT, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_ROOT, { recursive: true, force: true });
  });

  it('loads the aggregated first context', () => {
    writeFirstRuntimeIndex(TEST_ROOT, index);
    writeFirstRuntimeSummary(TEST_ROOT, summary);
    writeFirstRoleViews(TEST_ROOT, roleViews);
    writeFirstStageViews(TEST_ROOT, stageViews);

    const context = loadFirstContext(TEST_ROOT);

    expect(context.index.mode).toBe('quick');
    expect(context.summary.project.name).toBe('spec-first');
    expect(context.roleViews.dev.role).toBe('dev');
    expect(context.stageViews.verify.stage).toBe('verify');
  });

  it('loads a single role view and stage view', () => {
    writeFirstRuntimeIndex(TEST_ROOT, index);
    writeFirstRuntimeSummary(TEST_ROOT, summary);
    writeFirstRoleViews(TEST_ROOT, roleViews);
    writeFirstStageViews(TEST_ROOT, stageViews);

    expect(loadFirstRoleView(TEST_ROOT, 'architect')).toEqual(roleViews.architect);
    expect(loadStageView(TEST_ROOT, 'code')).toEqual(stageViews.code);
  });

  it('rejects unhealthy summary assets when loading context', () => {
    writeFirstRuntimeIndex(TEST_ROOT, {
      ...index,
      summary: { ...index.summary, healthy: false, issues: ['summary drift'] },
      status: 'stale',
      staleReason: 'summary drift',
    });
    writeFirstRuntimeSummary(TEST_ROOT, summary);
    writeFirstRoleViews(TEST_ROOT, roleViews);
    writeFirstStageViews(TEST_ROOT, stageViews);

    expect(() => loadFirstContext(TEST_ROOT)).toThrow(/summary/i);
  });

  it('rejects unhealthy role views assets when loading role data', () => {
    writeFirstRuntimeIndex(TEST_ROOT, {
      ...index,
      roleViews: { ...index.roleViews, healthy: false, issues: ['role view drift'] },
      status: 'stale',
      staleReason: 'role view drift',
    });
    writeFirstRuntimeSummary(TEST_ROOT, summary);
    writeFirstRoleViews(TEST_ROOT, roleViews);
    writeFirstStageViews(TEST_ROOT, stageViews);

    expect(() => loadFirstContext(TEST_ROOT)).toThrow(/role-views/i);
    expect(() => loadFirstRoleView(TEST_ROOT, 'architect')).toThrow(/role-views/i);
  });
});
