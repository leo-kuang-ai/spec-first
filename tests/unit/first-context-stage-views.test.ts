import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { writeFirstRuntimeIndex, writeFirstRuntimeSummary } from '../../src/core/skill-runtime/first-runtime-store.js';
import { loadFirstContext, loadStageView } from '../../src/core/skill-runtime/first-context.js';
import type { FirstRuntimeIndex, FirstRuntimeSummary } from '../../src/core/skill-runtime/first-runtime-types.js';

const TEST_ROOT = join(import.meta.dirname, '../fixtures/.tmp-first-context-stage-views');

const index: FirstRuntimeIndex = {
  version: '1.0.0',
  lastRun: '2026-03-08T12:00:00.000Z',
  mode: 'quick',
  summary: { path: '.spec-first/runtime/first/summary.json', fileHash: 'summary', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
  roleViews: { path: '.spec-first/runtime/first/role-views.json', fileHash: 'roles', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
  stageViews: { path: '.spec-first/runtime/first/stage-views.json', fileHash: 'stages', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: false, issues: ['missing stage views'] },
  docsProjection: {},
  status: 'stale',
  staleReason: 'stage views missing',
};

const summary: FirstRuntimeSummary = {
  generatedAt: '2026-03-08T12:00:00.000Z',
  mode: 'quick',
  project: { name: 'spec-first' },
  modules: [],
  capabilities: [],
  entryPoints: [],
  dataModels: [],
  apiSurface: [],
  risks: [],
  evidence: [],
};

describe('first context stage view guards', () => {
  beforeEach(() => {
    rmSync(TEST_ROOT, { recursive: true, force: true });
    mkdirSync(TEST_ROOT, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_ROOT, { recursive: true, force: true });
  });

  it('throws clear errors when stage views are missing', () => {
    writeFirstRuntimeIndex(TEST_ROOT, index);
    writeFirstRuntimeSummary(TEST_ROOT, summary);

    expect(() => loadFirstContext(TEST_ROOT)).toThrow(/stage-views/i);
    expect(() => loadStageView(TEST_ROOT, 'spec')).toThrow(/stage-views/i);
  });
});


describe('refresh mode contract', () => {
  it('exports the three supported refresh modes', async () => {
    const { FIRST_REFRESH_MODES } = await import('../../src/core/skill-runtime/first-context.js');
    expect(FIRST_REFRESH_MODES).toEqual([
      'refresh-runtime-only',
      'refresh-docs-from-runtime',
      'refresh-all',
    ]);
  });
});
