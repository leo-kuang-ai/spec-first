import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  FIRST_RUNTIME_DIR,
  FIRST_RUNTIME_INDEX_FILE,
  FIRST_RUNTIME_ROLE_VIEWS_FILE,
  FIRST_RUNTIME_STAGE_VIEWS_FILE,
  FIRST_RUNTIME_SUMMARY_FILE,
  getFirstRuntimeDir,
  getFirstRuntimeIndexPath,
  getFirstRuntimeSummaryPath,
  getFirstRoleViewsPath,
  getFirstStageViewsPath,
  readFirstRuntimeIndex,
  readFirstRuntimeSummary,
  readFirstRoleViews,
  readFirstStageViews,
  writeFirstRuntimeIndex,
  writeFirstRuntimeSummary,
  writeFirstRoleViews,
  writeFirstStageViews,
} from '../../src/core/skill-runtime/first-runtime-store.js';
import type {
  FirstRuntimeIndex,
  FirstRuntimeSummary,
  FirstRoleViews,
  FirstStageViews,
} from '../../src/core/skill-runtime/first-runtime-types.js';

const TEST_ROOT = join(import.meta.dirname, '../fixtures/.tmp-first-runtime-store');

function makeIndex(): FirstRuntimeIndex {
  return {
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
    docsProjection: {},
    status: 'current',
  };
}

function makeSummary(): FirstRuntimeSummary {
  return {
    generatedAt: '2026-03-08T12:00:00.000Z',
    mode: 'quick',
    project: { name: 'spec-first', platformType: 'backend' },
    modules: ['src/core/skill-runtime'],
    capabilities: ['runtime truth source'],
    entryPoints: ['src/cli/index.ts'],
    dataModels: ['Feature'],
    apiSurface: ['spec-first init'],
    risks: ['legacy docs coupling'],
    evidence: [],
  };
}

function makeRoleViews(): FirstRoleViews {
  return {
    product: { role: 'product', summary: 'product', focus: ['capabilities'], warnings: [] },
    dev: { role: 'dev', summary: 'dev', focus: ['entryPoints'], warnings: [] },
    qa: { role: 'qa', summary: 'qa', focus: ['verificationHooks'], warnings: [] },
    architect: { role: 'architect', summary: 'arch', focus: ['constraints'], warnings: [] },
  };
}

function makeStageViews(): FirstStageViews {
  return {
    spec: {
      stage: 'spec',
      summary: 'spec summary',
      businessCapabilities: ['init'],
      coreEntities: ['Feature'],
      dependencies: ['stage-state'],
      warnings: [],
    },
    design: {
      stage: 'design',
      summary: 'design summary',
      moduleBoundaries: ['src/core'],
      integrationPoints: ['CLI'],
      technicalConstraints: ['strict'],
      risks: [],
    },
    code: {
      stage: 'code',
      summary: 'code summary',
      entryPoints: ['src/cli/index.ts'],
      likelyChangeAreas: ['src/core/skill-runtime'],
      changeHazards: ['docs/first'],
      verificationHooks: ['tests/unit/init.test.ts'],
    },
    verify: {
      stage: 'verify',
      summary: 'verify summary',
      testFocus: ['truth-source'],
      riskAreas: ['half switch'],
      validationHooks: ['pnpm vitest'],
      releaseBlockers: [],
    },
  };
}

describe('first runtime store', () => {
  beforeEach(() => {
    rmSync(TEST_ROOT, { recursive: true, force: true });
    mkdirSync(TEST_ROOT, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_ROOT, { recursive: true, force: true });
  });

  it('exposes the expected runtime paths', () => {
    expect(FIRST_RUNTIME_DIR).toBe('.spec-first/runtime/first');
    expect(FIRST_RUNTIME_INDEX_FILE).toBe('index.json');
    expect(FIRST_RUNTIME_SUMMARY_FILE).toBe('summary.json');
    expect(FIRST_RUNTIME_ROLE_VIEWS_FILE).toBe('role-views.json');
    expect(FIRST_RUNTIME_STAGE_VIEWS_FILE).toBe('stage-views.json');

    expect(getFirstRuntimeDir(TEST_ROOT)).toBe(join(TEST_ROOT, '.spec-first/runtime/first'));
    expect(getFirstRuntimeIndexPath(TEST_ROOT)).toBe(join(TEST_ROOT, '.spec-first/runtime/first/index.json'));
    expect(getFirstRuntimeSummaryPath(TEST_ROOT)).toBe(join(TEST_ROOT, '.spec-first/runtime/first/summary.json'));
    expect(getFirstRoleViewsPath(TEST_ROOT)).toBe(join(TEST_ROOT, '.spec-first/runtime/first/role-views.json'));
    expect(getFirstStageViewsPath(TEST_ROOT)).toBe(join(TEST_ROOT, '.spec-first/runtime/first/stage-views.json'));
  });

  it('writes and reads all runtime assets', () => {
    const index = makeIndex();
    const summary = makeSummary();
    const roleViews = makeRoleViews();
    const stageViews = makeStageViews();

    writeFirstRuntimeIndex(TEST_ROOT, index);
    writeFirstRuntimeSummary(TEST_ROOT, summary);
    writeFirstRoleViews(TEST_ROOT, roleViews);
    writeFirstStageViews(TEST_ROOT, stageViews);

    expect(readFirstRuntimeIndex(TEST_ROOT)).toEqual(index);
    expect(readFirstRuntimeSummary(TEST_ROOT)).toEqual(summary);
    expect(readFirstRoleViews(TEST_ROOT)).toEqual(roleViews);
    expect(readFirstStageViews(TEST_ROOT)).toEqual(stageViews);
  });

  it('returns null for missing or invalid json files', () => {
    expect(readFirstRuntimeIndex(TEST_ROOT)).toBeNull();

    const runtimeDir = getFirstRuntimeDir(TEST_ROOT);
    mkdirSync(runtimeDir, { recursive: true });
    writeFileSync(getFirstRuntimeIndexPath(TEST_ROOT), '{invalid json', 'utf8');

    expect(readFirstRuntimeIndex(TEST_ROOT)).toBeNull();
  });

  it('creates runtime directories on write', () => {
    writeFirstRuntimeSummary(TEST_ROOT, makeSummary());

    expect(existsSync(getFirstRuntimeDir(TEST_ROOT))).toBe(true);
    expect(JSON.parse(readFileSync(getFirstRuntimeSummaryPath(TEST_ROOT), 'utf8'))).toMatchObject({
      project: { name: 'spec-first' },
    });
  });
});
