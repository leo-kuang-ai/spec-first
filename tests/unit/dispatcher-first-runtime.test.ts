import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getFirstRuntimeNotice, getOrchestrateRuntimeNotice } from '../../src/core/skill-runtime/dispatcher.js';
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
import type {
  FirstChangeMap,
  FirstConventions,
  FirstCriticalFlows,
  FirstEntryGuide,
  FirstRebootGuide,
  FirstSteering,
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
  steering: { path: '.spec-first/runtime/first/steering.json', fileHash: 'steering', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
  conventions: { path: '.spec-first/runtime/first/conventions.json', fileHash: 'conventions', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
  criticalFlows: { path: '.spec-first/runtime/first/critical-flows.json', fileHash: 'critical-flows', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
  changeMap: { path: '.spec-first/runtime/first/change-map.json', fileHash: 'change-map', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
  entryGuide: { path: '.spec-first/runtime/first/entry-guide.json', fileHash: 'entry-guide', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
  rebootGuide: { path: '.spec-first/runtime/first/reboot-guide.json', fileHash: 'reboot-guide', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
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

const steering: FirstSteering = {
  product: { overview: 'Runtime-backed first context', coreScenarios: ['bootstrap'], nonGoals: [], glossary: ['Feature'] },
  tech: { stack: ['TypeScript'], constraints: ['strict'], forbiddenPatterns: ['docs-only truth'] },
  structure: { modules: ['src/core/skill-runtime'], boundaries: ['src/cli/commands'], entryRules: ['read runtime truth first'] },
};

const conventions: FirstConventions = {
  api: { observedPatterns: ['spec-first init'], deviations: [], recommendedConvention: 'Keep CLI verbs stable.', evidence: ['src/cli/commands/init.ts'] },
  module: { observedPatterns: ['src/core/skill-runtime'], deviations: [], recommendedConvention: 'Keep runtime logic under src/core.', evidence: ['src/core/skill-runtime'] },
  testing: { observedPatterns: ['Vitest'], deviations: [], recommendedConvention: 'Use Vitest.', evidence: ['tests/unit'] },
  projectRules: { observedPatterns: ['runtime truth first'], deviations: [], recommendedConvention: 'Read runtime truth first.', evidence: ['.spec-first/runtime/first'] },
};

const criticalFlows: FirstCriticalFlows = [
  {
    flowId: 'flow-cli-entry',
    name: 'CLI Entry Flow',
    entryPoints: ['src/cli/commands/init.ts'],
    coreModules: ['src/core/skill-runtime'],
    invariants: ['runtime truth first'],
    verificationHooks: ['pnpm vitest'],
  },
];

const changeMap: FirstChangeMap = [
  {
    changeType: 'runtime-asset-extension',
    likelyModules: ['src/core/skill-runtime'],
    likelyCommands: ['src/cli/commands/first.ts'],
    likelyConfigs: ['package.json'],
    likelyTests: ['tests/unit/dispatcher-first-runtime.test.ts'],
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
];

const rebootGuide: FirstRebootGuide = {
  projectWhat: 'Runtime-backed first context',
  whereToStart: ['.spec-first/runtime/first/summary.json'],
  currentCriticalAreas: ['runtime truth first'],
  commonChangePaths: ['src/core/skill-runtime'],
  verifyChecklist: ['pnpm vitest'],
};

describe('dispatcher first runtime notice', () => {
  beforeEach(() => {
    rmSync(TEST_ROOT, { recursive: true, force: true });
    mkdirSync(TEST_ROOT, { recursive: true });
    writeFirstRuntimeIndex(TEST_ROOT, index);
    writeFirstRuntimeSummary(TEST_ROOT, summary);
    writeFirstRoleViews(TEST_ROOT, roleViews);
    writeFirstStageViews(TEST_ROOT, stageViews);
    writeFirstSteering(TEST_ROOT, steering);
    writeFirstConventions(TEST_ROOT, conventions);
    writeFirstCriticalFlows(TEST_ROOT, criticalFlows);
    writeFirstChangeMap(TEST_ROOT, changeMap);
    writeFirstEntryGuide(TEST_ROOT, entryGuide);
    writeFirstRebootGuide(TEST_ROOT, rebootGuide);
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
    expect(notice).toContain('project_name: spec-first');
    expect(notice).toContain('change_types: runtime-asset-extension');
    expect(notice).toContain('critical_flows: CLI Entry Flow');
    expect(notice).toContain('entry_categories: runtime-extension');
    expect(notice).not.toContain('docs-projection');
    expect(notice).not.toContain('docs-projection-adjustment');
  });
});
