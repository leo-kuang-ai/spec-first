import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  FIRST_RUNTIME_DIR,
  FIRST_RUNTIME_INDEX_FILE,
  FIRST_RUNTIME_ROLE_VIEWS_FILE,
  FIRST_RUNTIME_CONVENTIONS_FILE,
  FIRST_RUNTIME_CHANGE_MAP_FILE,
  FIRST_RUNTIME_CRITICAL_FLOWS_FILE,
  FIRST_RUNTIME_ENTRY_GUIDE_FILE,
  FIRST_RUNTIME_REBOOT_GUIDE_FILE,
  FIRST_RUNTIME_STEERING_FILE,
  FIRST_RUNTIME_STAGE_VIEWS_FILE,
  FIRST_RUNTIME_SUMMARY_FILE,
  getFirstRuntimeDir,
  getFirstRuntimeIndexPath,
  getFirstRuntimeSummaryPath,
  getFirstRoleViewsPath,
  getFirstConventionsPath,
  getFirstChangeMapPath,
  getFirstCriticalFlowsPath,
  getFirstEntryGuidePath,
  getFirstRebootGuidePath,
  getFirstSteeringPath,
  getFirstStageViewsPath,
  readFirstRuntimeIndex,
  readFirstRuntimeSummary,
  readFirstRoleViews,
  readFirstConventions,
  readFirstChangeMap,
  readFirstCriticalFlows,
  readFirstEntryGuide,
  readFirstRebootGuide,
  readFirstSteering,
  readFirstStageViews,
  writeFirstRuntimeIndex,
  writeFirstRuntimeSummary,
  writeFirstRoleViews,
  writeFirstConventions,
  writeFirstChangeMap,
  writeFirstCriticalFlows,
  writeFirstEntryGuide,
  writeFirstRebootGuide,
  writeFirstSteering,
  writeFirstStageViews,
  assertValidFirstRuntimePath,
  validateFirstRuntimePath,
} from '../../src/core/skill-runtime/first-runtime-store.js';
import type {
  FirstConventions,
  FirstChangeMap,
  FirstCriticalFlows,
  FirstEntryGuide,
  FirstRebootGuide,
  FirstSteering,
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
    docsProjection: {},
    status: 'current',
  };
}

function makeRebootGuide(): FirstRebootGuide {
  return {
    projectWhat: 'Specification-driven development process engine',
    whereToStart: ['.spec-first/runtime/first/summary.json', 'docs/first/README.md'],
    currentCriticalAreas: ['runtime truth first', 'canonical docs projection'],
    commonChangePaths: ['src/core/skill-runtime', 'src/cli/commands/first.ts'],
    verifyChecklist: ['pnpm vitest run tests/unit/first-*.test.ts', 'pnpm typecheck'],
  };
}

function makeEntryGuide(): FirstEntryGuide {
  return [
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
}

function makeChangeMap(): FirstChangeMap {
  return [
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
}

function makeCriticalFlows(): FirstCriticalFlows {
  return [
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
}

function makeConventions(): FirstConventions {
  return {
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
      evidence: ['vitest.config.ts'],
    },
    projectRules: {
      observedPatterns: ['runtime truth first'],
      deviations: [],
      recommendedConvention: 'Treat .spec-first/runtime/first as canonical truth before docs projection.',
      evidence: ['src/core/skill-runtime/first-doc-projection.ts'],
    },
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

function makeSteering(): FirstSteering {
  return {
    product: {
      overview: 'Specification-driven development process engine',
      coreScenarios: ['brownfield delivery'],
      nonGoals: ['legacy docs as truth'],
      glossary: ['Feature'],
    },
    tech: {
      stack: ['TypeScript'],
      constraints: ['ESM'],
      forbiddenPatterns: ['docs-only truth'],
    },
    structure: {
      modules: ['src/core/skill-runtime'],
      boundaries: ['cli -> runtime'],
      entryRules: ['read runtime first'],
    },
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
    expect(FIRST_RUNTIME_STEERING_FILE).toBe('steering.json');
    expect(FIRST_RUNTIME_CONVENTIONS_FILE).toBe('conventions.json');
    expect(FIRST_RUNTIME_CRITICAL_FLOWS_FILE).toBe('critical-flows.json');
    expect(FIRST_RUNTIME_CHANGE_MAP_FILE).toBe('change-map.json');
    expect(FIRST_RUNTIME_ENTRY_GUIDE_FILE).toBe('entry-guide.json');
    expect(FIRST_RUNTIME_REBOOT_GUIDE_FILE).toBe('reboot-guide.json');

    expect(getFirstRuntimeDir(TEST_ROOT)).toBe(join(TEST_ROOT, '.spec-first/runtime/first'));
    expect(getFirstRuntimeIndexPath(TEST_ROOT)).toBe(join(TEST_ROOT, '.spec-first/runtime/first/index.json'));
    expect(getFirstRuntimeSummaryPath(TEST_ROOT)).toBe(join(TEST_ROOT, '.spec-first/runtime/first/summary.json'));
    expect(getFirstRoleViewsPath(TEST_ROOT)).toBe(join(TEST_ROOT, '.spec-first/runtime/first/role-views.json'));
    expect(getFirstStageViewsPath(TEST_ROOT)).toBe(join(TEST_ROOT, '.spec-first/runtime/first/stage-views.json'));
    expect(getFirstSteeringPath(TEST_ROOT)).toBe(join(TEST_ROOT, '.spec-first/runtime/first/steering.json'));
    expect(getFirstConventionsPath(TEST_ROOT)).toBe(join(TEST_ROOT, '.spec-first/runtime/first/conventions.json'));
    expect(getFirstCriticalFlowsPath(TEST_ROOT)).toBe(join(TEST_ROOT, '.spec-first/runtime/first/critical-flows.json'));
    expect(getFirstChangeMapPath(TEST_ROOT)).toBe(join(TEST_ROOT, '.spec-first/runtime/first/change-map.json'));
    expect(getFirstEntryGuidePath(TEST_ROOT)).toBe(join(TEST_ROOT, '.spec-first/runtime/first/entry-guide.json'));
    expect(getFirstRebootGuidePath(TEST_ROOT)).toBe(join(TEST_ROOT, '.spec-first/runtime/first/reboot-guide.json'));
  });

  it('writes and reads all runtime assets', () => {
    const index = makeIndex();
    const summary = makeSummary();
    const roleViews = makeRoleViews();
    const stageViews = makeStageViews();
    const steering = makeSteering();
    const conventions = makeConventions();
    const criticalFlows = makeCriticalFlows();
    const changeMap = makeChangeMap();
    const entryGuide = makeEntryGuide();
    const rebootGuide = makeRebootGuide();

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

    expect(readFirstRuntimeIndex(TEST_ROOT)).toEqual(index);
    expect(readFirstRuntimeSummary(TEST_ROOT)).toEqual(summary);
    expect(readFirstRoleViews(TEST_ROOT)).toEqual(roleViews);
    expect(readFirstStageViews(TEST_ROOT)).toEqual(stageViews);
    expect(readFirstSteering(TEST_ROOT)).toEqual(steering);
    expect(readFirstConventions(TEST_ROOT)).toEqual(conventions);
    expect(readFirstCriticalFlows(TEST_ROOT)).toEqual(criticalFlows);
    expect(readFirstChangeMap(TEST_ROOT)).toEqual(changeMap);
    expect(readFirstEntryGuide(TEST_ROOT)).toEqual(entryGuide);
    expect(readFirstRebootGuide(TEST_ROOT)).toEqual(rebootGuide);

    const rawJsonPaths = [
      getFirstRuntimeIndexPath(TEST_ROOT),
      getFirstRuntimeSummaryPath(TEST_ROOT),
      getFirstRoleViewsPath(TEST_ROOT),
      getFirstStageViewsPath(TEST_ROOT),
      getFirstSteeringPath(TEST_ROOT),
      getFirstConventionsPath(TEST_ROOT),
      getFirstCriticalFlowsPath(TEST_ROOT),
      getFirstChangeMapPath(TEST_ROOT),
      getFirstEntryGuidePath(TEST_ROOT),
      getFirstRebootGuidePath(TEST_ROOT),
    ];

    for (const path of rawJsonPaths) {
      expect(() => JSON.parse(readFileSync(path, 'utf-8'))).not.toThrow();
    }
  });

  it('returns null for missing or invalid json files', () => {
    expect(readFirstRuntimeIndex(TEST_ROOT)).toBeNull();

    const runtimeDir = getFirstRuntimeDir(TEST_ROOT);
    mkdirSync(runtimeDir, { recursive: true });
    writeFileSync(getFirstRuntimeIndexPath(TEST_ROOT), '{invalid json', 'utf8');

    expect(readFirstRuntimeIndex(TEST_ROOT)).toBeNull();
  });

  it('normalizes legacy runtime assets into canonical runtime models', () => {
    const runtimeDir = getFirstRuntimeDir(TEST_ROOT);
    mkdirSync(runtimeDir, { recursive: true });

    writeFileSync(getFirstRuntimeIndexPath(TEST_ROOT), JSON.stringify({
      version: '2.1.0',
      mode: 'quick',
      generated_at: '2026-03-09T04:43:27.542Z',
      project: {
        name: 'spec-first',
        type: 'cli-tool',
        description: 'Specification-driven development process engine',
      },
      artifacts: [
        { id: 'api-docs', path: 'docs/first/api-docs.md', type: 'api-specification', status: 'generated' },
        { id: 'domain-model', path: 'docs/first/domain-model.md', type: 'domain-model', status: 'generated' },
      ],
      database: {
        detected: false,
        reason: 'No database dependencies found',
      },
    }, null, 2), 'utf8');

    writeFileSync(getFirstRuntimeSummaryPath(TEST_ROOT), JSON.stringify({
      mode: 'quick',
      generated_at: '2026-03-09T04:43:27.542Z',
      tech_stack: { runtime: 'Node.js ≥20.0.0', language: 'TypeScript 5.4+' },
      project_type: 'cli-tool',
      core_modules: ['skill-runtime', 'gate-engine'],
      commands_count: 19,
      has_database: false,
    }, null, 2), 'utf8');

    writeFileSync(getFirstRoleViewsPath(TEST_ROOT), JSON.stringify({
      generated_at: '2026-03-09T04:43:27.542Z',
      roles: {
        developer: {
          priority_docs: ['codebase-overview.md', 'tech-stack.md'],
          entry_points: ['src/cli/index.ts'],
          key_concepts: ['Feature', 'Traceability'],
        },
        product_manager: {
          priority_docs: ['domain-model.md'],
          entry_points: ['specs/'],
          key_concepts: ['RFC'],
        },
        tester: {
          priority_docs: ['domain-model.md'],
          entry_points: ['tests/'],
          key_concepts: ['Coverage'],
        },
        architect: {
          priority_docs: ['tech-stack.md'],
          entry_points: ['src/core/'],
          key_concepts: ['Process Engine'],
        },
      },
    }, null, 2), 'utf8');

    writeFileSync(getFirstStageViewsPath(TEST_ROOT), JSON.stringify({
      generated_at: '2026-03-09T04:43:27.542Z',
      stages: {
        '00_init': { relevant_docs: ['codebase-overview.md'], key_files: ['src/cli/index.ts'] },
        '01_specify': { relevant_docs: ['domain-model.md', 'api-docs.md'], key_files: ['specs/'] },
        '02_design': { relevant_docs: ['tech-stack.md'], key_files: ['src/core/skill-runtime/'] },
        '03_plan': { relevant_docs: ['codebase-overview.md'], key_files: ['src/core/change-mgr/'] },
        '04_implement': { relevant_docs: ['tech-stack.md'], key_files: ['src/', 'tests/'] },
        '05_verify': { relevant_docs: ['domain-model.md'], key_files: ['src/core/gate-engine/', 'tests/'] },
      },
    }, null, 2), 'utf8');

    expect(readFirstRuntimeIndex(TEST_ROOT)).toMatchObject({
      version: '2.1.0',
      mode: 'quick',
      status: 'current',
      summary: { healthy: true, path: '.spec-first/runtime/first/summary.json' },
    });
    expect(readFirstRuntimeSummary(TEST_ROOT)).toMatchObject({
      project: { name: 'spec-first', platformType: 'cli-tool' },
      modules: ['skill-runtime', 'gate-engine'],
      apiSurface: ['docs/first/api-docs.md'],
    });
    expect(readFirstSteering(TEST_ROOT)).toMatchObject({
      product: { overview: 'Specification-driven development process engine' },
      tech: { stack: ['runtime: Node.js ≥20.0.0', 'language: TypeScript 5.4+'] },
    });
    expect(readFirstRoleViews(TEST_ROOT)?.dev.focus).toContain('docs/first/codebase-overview.md');
    expect(readFirstStageViews(TEST_ROOT)?.verify.testFocus).toContain('src/core/gate-engine/');
  });

  it('creates runtime directories on write', () => {
    writeFirstRuntimeSummary(TEST_ROOT, makeSummary());

    expect(existsSync(getFirstRuntimeDir(TEST_ROOT))).toBe(true);
    expect(JSON.parse(readFileSync(getFirstRuntimeSummaryPath(TEST_ROOT), 'utf8'))).toMatchObject({
      project: { name: 'spec-first' },
    });
  });

  describe('validateFirstRuntimePath', () => {
    it('returns true for valid runtime paths', () => {
      expect(validateFirstRuntimePath('/project/.spec-first/runtime/first/summary.json')).toBe(true);
      expect(validateFirstRuntimePath('.spec-first/runtime/first/index.json')).toBe(true);
      expect(validateFirstRuntimePath('/absolute/path/.spec-first/runtime/first/role-views.json')).toBe(true);
      expect(validateFirstRuntimePath('C:\\project\\.spec-first\\runtime\\first\\summary.json')).toBe(true);
    });

    it('returns false for invalid paths', () => {
      // Common typo: .config-first instead of .spec-first
      expect(validateFirstRuntimePath('/project/.config-first/runtime/first/summary.json')).toBe(false);
      expect(validateFirstRuntimePath('.config-first/runtime/first/index.json')).toBe(false);
      // Missing runtime segment
      expect(validateFirstRuntimePath('/project/.spec-first/summary.json')).toBe(false);
      // Wrong directory name
      expect(validateFirstRuntimePath('/project/.spec-first/runtime/second/summary.json')).toBe(false);
      // Prefix collision should not be treated as the canonical runtime dir
      expect(validateFirstRuntimePath('/project/.spec-first/runtime/first-backup/summary.json')).toBe(false);
      expect(validateFirstRuntimePath('/project/.spec-first/runtime/first-old/index.json')).toBe(false);
      // Path traversal should not normalize into a valid target accidentally
      expect(validateFirstRuntimePath('/project/.spec-first/runtime/first/../shadow/summary.json')).toBe(false);
    });
  });

  describe('assertValidFirstRuntimePath', () => {
    it('throws for invalid runtime targets that only partially match the canonical dir', () => {
      expect(() =>
        assertValidFirstRuntimePath('/project/.spec-first/runtime/first-backup/summary.json')
      ).toThrow(/Invalid First Runtime path/);
      expect(() =>
        assertValidFirstRuntimePath('/project/.config-first/runtime/first/summary.json')
      ).toThrow(/Invalid First Runtime path/);
    });
  });
});
