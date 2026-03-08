import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getFirstRuntimeNotice, getOrchestrateRuntimeNotice } from '../../src/core/skill-runtime/dispatcher.js';
import {
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

const TEST_ROOT = join(import.meta.dirname, '../fixtures/.tmp-dispatcher-first-runtime');

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
  project: { name: 'spec-first', platformType: 'backend', overview: 'Runtime-backed first context' },
  modules: ['src/core/skill-runtime'],
  capabilities: ['runtime truth source'],
  entryPoints: ['src/cli/commands/init.ts'],
  dataModels: ['Feature'],
  apiSurface: ['spec-first init'],
  risks: [],
  evidence: [],
};

const roleViews: FirstRoleViews = {
  product: { role: 'product', summary: 'product', focus: ['capabilities'], warnings: [] },
  dev: { role: 'dev', summary: 'dev', focus: ['modules'], warnings: [] },
  qa: { role: 'qa', summary: 'qa', focus: ['validation'], warnings: [] },
  architect: { role: 'architect', summary: 'architect', focus: ['constraints'], warnings: [] },
};

const stageViews: FirstStageViews = {
  spec: { stage: 'spec', summary: 'spec', businessCapabilities: ['init'], coreEntities: ['Feature'], dependencies: ['stage-state'], warnings: [] },
  design: { stage: 'design', summary: 'design', moduleBoundaries: ['src/core'], integrationPoints: ['CLI'], technicalConstraints: ['strict'], risks: [] },
  code: { stage: 'code', summary: 'code', entryPoints: ['src/cli/commands/init.ts'], likelyChangeAreas: ['src/core/skill-runtime'], changeHazards: [], verificationHooks: ['tests/unit/init.test.ts'] },
  verify: { stage: 'verify', summary: 'verify', testFocus: ['truth-source'], riskAreas: [], validationHooks: ['pnpm vitest'], releaseBlockers: [] },
};

describe('dispatcher first runtime notice', () => {
  beforeEach(() => {
    rmSync(TEST_ROOT, { recursive: true, force: true });
    mkdirSync(TEST_ROOT, { recursive: true });
    writeFirstRuntimeIndex(TEST_ROOT, index);
    writeFirstRuntimeSummary(TEST_ROOT, summary);
    writeFirstRoleViews(TEST_ROOT, roleViews);
    writeFirstStageViews(TEST_ROOT, stageViews);
  });

  afterEach(() => {
    rmSync(TEST_ROOT, { recursive: true, force: true });
  });

  it('builds notice from runtime truth source without docs/first', () => {
    const notice = getFirstRuntimeNotice(TEST_ROOT);

    expect(notice).toContain('first-runtime-context');
    expect(notice).toContain('runtime-assets');
    expect(notice).toContain('spec-first');
  });
  it('builds orchestrate notice from current feature background guidance', () => {
    mkdirSync(join(TEST_ROOT, '.spec-first'), { recursive: true });
    writeFileSync(join(TEST_ROOT, '.spec-first', 'current'), 'FSREQ-20260308-AUTH-001\n', 'utf-8');
    mkdirSync(join(TEST_ROOT, 'specs', 'FSREQ-20260308-AUTH-001'), { recursive: true });
    writeFileSync(
      join(TEST_ROOT, 'specs', 'FSREQ-20260308-AUTH-001', 'stage-state.json'),
      JSON.stringify({
        featureId: 'FSREQ-20260308-AUTH-001',
        currentStage: '02_design',
        history: [],
        terminal: false,
        mode: 'N',
        size: 'S',
        platforms: ['h5'],
        backgroundInputStatus: 'blind',
        createdAt: '2026-03-08T12:00:00.000Z',
        updatedAt: '2026-03-08T12:00:00.000Z'
      }),
      'utf-8',
    );
    writeFileSync(
      join(TEST_ROOT, 'specs', 'FSREQ-20260308-AUTH-001', 'task_plan.md'),
      '# Task Plan\n\n- [parallel] TASK-AUTH-001 风险改造\n',
      'utf-8',
    );

    const notice = getOrchestrateRuntimeNotice(TEST_ROOT);

    expect(notice).toContain('orchestrate-runtime-context');
    expect(notice).toContain('background_status: blind');
    expect(notice).toContain('dependency_strength: L3');
    expect(notice).toContain('recommended_action: backfill-first');
    expect(notice).toContain('risk_signals: 存在并行任务标记');
    expect(notice).toContain('risk_category: formal-design-review');
  });
});
