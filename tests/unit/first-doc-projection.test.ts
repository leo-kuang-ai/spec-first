import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { refreshFirstDocsFromRuntime } from '../../src/core/skill-runtime/first-doc-projection.js';
import {
  getFirstConventionsPath,
  getFirstChangeMapPath,
  getFirstCriticalFlowsPath,
  getFirstEntryGuidePath,
  getFirstRebootGuidePath,
  getFirstRoleViewsPath,
  getFirstRuntimeIndexPath,
  getFirstRuntimeSummaryPath,
  getFirstSteeringPath,
  getFirstStageViewsPath,
  writeFirstRoleViews,
  writeFirstRuntimeIndex,
  writeFirstRuntimeSummary,
  writeFirstConventions,
  writeFirstChangeMap,
  writeFirstCriticalFlows,
  writeFirstEntryGuide,
  writeFirstRebootGuide,
  writeFirstSteering,
  writeFirstStageViews,
} from '../../src/core/skill-runtime/first-runtime-store.js';
import type {
  FirstConventions,
  FirstChangeMap,
  FirstCriticalFlows,
  FirstEntryGuide,
  FirstRebootGuide,
  FirstRoleViews,
  FirstRuntimeIndex,
  FirstRuntimeSummary,
  FirstSteering,
  FirstStageViews,
} from '../../src/core/skill-runtime/first-runtime-types.js';

const TEST_ROOT = join(import.meta.dirname, '../fixtures/.tmp-first-doc-projection');

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
  mode: 'deep',
  project: { name: 'spec-first', platformType: 'backend', overview: 'Runtime truth-source migration' },
  techStack: ['runtime: Node.js ≥20.0.0', 'language: TypeScript 5.4+'],
  modules: ['src/core/skill-runtime', 'src/cli/commands'],
  capabilities: ['runtime truth source', 'docs projection'],
  entryPoints: ['src/cli/commands/init.ts'],
  dataModels: ['Feature', 'StageState'],
  apiSurface: ['spec-first init'],
  risks: ['half-switch state'],
  evidence: ['src/core/skill-runtime/dispatcher.ts:1'],
};

const roleViews: FirstRoleViews = {
  product: { role: 'product', summary: 'product', focus: ['capabilities'], warnings: [] },
  dev: { role: 'dev', summary: 'dev', focus: ['modules'], warnings: [] },
  qa: { role: 'qa', summary: 'qa', focus: ['validation'], warnings: [] },
  architect: { role: 'architect', summary: 'architect', focus: ['constraints'], warnings: [] },
};

const steering: FirstSteering = {
  product: {
    overview: 'Runtime truth-source migration',
    coreScenarios: ['brownfield feature delivery'],
    nonGoals: ['legacy docs as truth'],
    glossary: ['Feature', 'StageState'],
  },
  tech: {
    stack: ['runtime: Node.js ≥20.0.0', 'language: TypeScript 5.4+'],
    constraints: ['平台类型: backend'],
    forbiddenPatterns: ['docs-only truth'],
  },
  structure: {
    modules: ['src/core/skill-runtime', 'src/cli/commands'],
    boundaries: ['cli -> runtime'],
    entryRules: ['read runtime truth first'],
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
    evidence: ['vitest.config.ts'],
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
  projectWhat: 'Runtime truth-source migration',
  whereToStart: ['.spec-first/runtime/first/summary.json', 'docs/first/README.md'],
  currentCriticalAreas: ['runtime truth first', 'canonical docs projection'],
  commonChangePaths: ['src/core/skill-runtime', 'src/cli/commands/first.ts'],
  verifyChecklist: ['pnpm vitest', 'pnpm typecheck'],
};

const stageViews: FirstStageViews = {
  spec: { stage: 'spec', summary: 'spec', businessCapabilities: ['runtime truth source'], coreEntities: ['Feature'], dependencies: ['接口: spec-first init'], warnings: ['half-switch state'] },
  design: { stage: 'design', summary: 'design', moduleBoundaries: ['src/core/skill-runtime'], integrationPoints: ['spec-first init'], technicalConstraints: ['平台类型: backend'], risks: ['half-switch state'] },
  code: {
    stage: 'code',
    summary: 'code',
    entryPoints: ['src/cli/commands/init.ts'],
    likelyChangeAreas: ['src/core/skill-runtime'],
    callPathHints: ['入口 -> src/cli/commands/init.ts'],
    couplingPoints: ['模块耦合: src/core/skill-runtime'],
    changeHazards: ['half-switch state'],
    verificationHooks: ['tests/unit/first-doc-projection.test.ts'],
  },
  verify: {
    stage: 'verify',
    summary: 'verify',
    criticalFlows: ['入口链路: src/cli/commands/init.ts'],
    validationFocus: ['能力验证: runtime truth source'],
    testFocus: ['runtime truth source'],
    riskAreas: ['half-switch state'],
    recommendedChecks: ['证据核对: src/core/skill-runtime/dispatcher.ts:1'],
    validationHooks: ['pnpm vitest'],
    releaseBlockers: ['half-switch state'],
  },
};

describe('first docs projection', () => {
  beforeEach(() => {
    rmSync(TEST_ROOT, { recursive: true, force: true });
    mkdirSync(TEST_ROOT, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_ROOT, { recursive: true, force: true });
  });

  it('writes canonical projection docs with readable content', () => {
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

    const docs = refreshFirstDocsFromRuntime(TEST_ROOT, ['summary.json', 'role-views.json', 'stage-views.json', 'steering.json', 'conventions.json', 'critical-flows.json', 'change-map.json', 'entry-guide.json', 'reboot-guide.json']);

    expect(docs).toContain('docs/first/summary.md');
    expect(docs).toContain('docs/first/role-views.md');
    expect(docs).toContain('docs/first/stage-views.md');
    expect(docs).toContain('docs/first/steering.md');
    expect(docs).toContain('docs/first/conventions.md');
    expect(docs).toContain('docs/first/critical-flows.md');
    expect(docs).toContain('docs/first/change-map.md');
    expect(docs).toContain('docs/first/common-playbooks.md');
    expect(docs).toContain('docs/first/entry-guide.md');
    expect(docs).toContain('docs/first/known-risks-and-traps.md');
    expect(docs).toContain('docs/first/reboot-guide.md');

    const readmeDoc = readFileSync(join(TEST_ROOT, 'docs', 'first', 'README.md'), 'utf-8');
    const summaryDoc = readFileSync(join(TEST_ROOT, 'docs', 'first', 'summary.md'), 'utf-8');
    const stageViewsDoc = readFileSync(join(TEST_ROOT, 'docs', 'first', 'stage-views.md'), 'utf-8');
    const roleViewsDoc = readFileSync(join(TEST_ROOT, 'docs', 'first', 'role-views.md'), 'utf-8');
    const steeringDoc = readFileSync(join(TEST_ROOT, 'docs', 'first', 'steering.md'), 'utf-8');
    const conventionsDoc = readFileSync(join(TEST_ROOT, 'docs', 'first', 'conventions.md'), 'utf-8');
    const criticalFlowsDoc = readFileSync(join(TEST_ROOT, 'docs', 'first', 'critical-flows.md'), 'utf-8');
    const changeMapDoc = readFileSync(join(TEST_ROOT, 'docs', 'first', 'change-map.md'), 'utf-8');
    const commonPlaybooksDoc = readFileSync(join(TEST_ROOT, 'docs', 'first', 'common-playbooks.md'), 'utf-8');
    const entryGuideDoc = readFileSync(join(TEST_ROOT, 'docs', 'first', 'entry-guide.md'), 'utf-8');
    const knownRisksDoc = readFileSync(join(TEST_ROOT, 'docs', 'first', 'known-risks-and-traps.md'), 'utf-8');
    const rebootGuideDoc = readFileSync(join(TEST_ROOT, 'docs', 'first', 'reboot-guide.md'), 'utf-8');

    expect(readmeDoc).toContain('投影视图');
    expect(readmeDoc).toContain('.spec-first/runtime/first/');
    expect(readmeDoc).toContain('## Runtime Canonical Truth');
    expect(readmeDoc).toContain('## Canonical Projection Docs');
    expect(readmeDoc).toContain('## Legacy / Reference Docs');
    expect(readmeDoc).toContain('## Skill Consumption Contract');
    expect(readmeDoc).toContain('docs/first/steering.md');
    expect(readmeDoc).toContain('docs/first/common-playbooks.md');
    expect(readmeDoc).toContain('列出的 `Canonical Projection Docs` 全部受 runtime 自动刷新保障');
    expect(readmeDoc).not.toContain(
      '只有 `docs/first/README.md`、`summary.md`、`role-views.md`、`stage-views.md` 是 canonical projection docs。'
    );
    expect(summaryDoc).toContain('## 项目概览');
    expect(summaryDoc).toContain('runtime: Node.js ≥20.0.0');
    expect(summaryDoc).toContain('runtime truth source');
    expect(stageViewsDoc).toContain('## Verify View');
    expect(stageViewsDoc).toContain('### Recommended Checks');
    expect(roleViewsDoc).toContain('## Developer');
    expect(steeringDoc).toContain('## Product Steering');
    expect(steeringDoc).toContain('brownfield feature delivery');
    expect(conventionsDoc).toContain('## API');
    expect(conventionsDoc).toContain('runtime truth first');
    expect(criticalFlowsDoc).toContain('CLI Entry Flow');
    expect(criticalFlowsDoc).toContain('runtime truth first');
    expect(changeMapDoc).toContain('runtime-asset-extension');
    expect(changeMapDoc).toContain('runtime index drift');
    expect(commonPlaybooksDoc).toContain('runtime-extension');
    expect(commonPlaybooksDoc).toContain('Recommended Convention');
    expect(entryGuideDoc).toContain('runtime-extension');
    expect(entryGuideDoc).toContain('.spec-first/runtime/first/summary.json');
    expect(knownRisksDoc).toContain('half-switch state');
    expect(knownRisksDoc).toContain('runtime truth first');
    expect(rebootGuideDoc).toContain('Runtime truth-source migration');
    expect(rebootGuideDoc).toContain('runtime truth first');
  });

  it('projects docs from legacy first runtime truth source', () => {
    mkdirSync(join(TEST_ROOT, '.spec-first', 'runtime', 'first'), { recursive: true });

    writeFileSync(getFirstRuntimeIndexPath(TEST_ROOT), JSON.stringify({
      version: '2.1.0',
      mode: 'quick',
      generated_at: '2026-03-09T04:43:27.542Z',
      project: {
        name: 'spec-first',
        version: '0.5.49',
        type: 'cli-tool',
        description: 'Specification-driven development process engine',
      },
      artifacts: [
        { id: 'tech-stack', path: 'docs/first/tech-stack.md', type: 'tech-stack', status: 'generated' },
        { id: 'api-docs', path: 'docs/first/api-docs.md', type: 'api-specification', status: 'generated' },
        { id: 'codebase-overview', path: 'docs/first/codebase-overview.md', type: 'code-structure', status: 'generated' },
        { id: 'domain-model', path: 'docs/first/domain-model.md', type: 'domain-model', status: 'generated' },
      ],
      database: {
        detected: false,
        reason: 'No database dependencies found',
      },
    }, null, 2));

    writeFileSync(getFirstRuntimeSummaryPath(TEST_ROOT), JSON.stringify({
      mode: 'quick',
      generated_at: '2026-03-09T04:43:27.542Z',
      tech_stack: {
        runtime: 'Node.js ≥20.0.0',
        language: 'TypeScript 5.4+',
        module_system: 'ESM',
        bundler: 'tsup',
        test_framework: 'Vitest',
      },
      project_type: 'cli-tool',
      core_modules: ['process-engine', 'trace-engine', 'gate-engine', 'skill-runtime'],
      commands_count: 19,
      has_database: false,
    }, null, 2));

    writeFileSync(getFirstRoleViewsPath(TEST_ROOT), JSON.stringify({
      generated_at: '2026-03-09T04:43:27.542Z',
      roles: {
        developer: {
          priority_docs: ['codebase-overview.md', 'tech-stack.md', 'domain-model.md'],
          entry_points: ['src/cli/index.ts', 'src/core/'],
          key_concepts: ['Stage', 'Feature', 'Task', 'Traceability'],
        },
        product_manager: {
          priority_docs: ['domain-model.md', 'api-docs.md'],
          entry_points: ['specs/', 'docs/'],
          key_concepts: ['Feature', 'RFC', 'Stage', 'Gate'],
        },
        tester: {
          priority_docs: ['domain-model.md', 'codebase-overview.md'],
          entry_points: ['tests/', 'src/core/gate-engine/'],
          key_concepts: ['Gate', 'Coverage', 'Traceability Matrix'],
        },
        architect: {
          priority_docs: ['tech-stack.md', 'codebase-overview.md', 'domain-model.md'],
          entry_points: ['src/core/', 'CLAUDE.md'],
          key_concepts: ['Process Engine', 'Trace Engine', 'Change Management'],
        },
      },
    }, null, 2));

    writeFileSync(getFirstStageViewsPath(TEST_ROOT), JSON.stringify({
      generated_at: '2026-03-09T04:43:27.542Z',
      stages: {
        '00_init': {
          relevant_docs: ['codebase-overview.md', 'tech-stack.md'],
          key_files: ['src/cli/index.ts', 'package.json'],
        },
        '01_specify': {
          relevant_docs: ['domain-model.md', 'api-docs.md'],
          key_files: ['src/core/trace-engine/', 'templates/'],
        },
        '02_design': {
          relevant_docs: ['tech-stack.md', 'codebase-overview.md', 'domain-model.md'],
          key_files: ['src/core/process-engine/', 'src/core/skill-runtime/'],
        },
        '03_plan': {
          relevant_docs: ['codebase-overview.md', 'domain-model.md'],
          key_files: ['src/core/trace-engine/', 'src/core/change-mgr/'],
        },
        '04_implement': {
          relevant_docs: ['tech-stack.md', 'codebase-overview.md'],
          key_files: ['src/', 'tests/'],
        },
        '05_verify': {
          relevant_docs: ['domain-model.md', 'codebase-overview.md'],
          key_files: ['src/core/gate-engine/', 'tests/'],
        },
      },
    }, null, 2));

    writeFileSync(getFirstSteeringPath(TEST_ROOT), JSON.stringify({
      generated_at: '2026-03-09T04:43:27.542Z',
      project_what: 'Specification-driven development process engine',
      where_to_start: ['src/cli/index.ts', 'src/core/'],
      current_critical_areas: ['runtime truth', 'skill runtime'],
      common_change_paths: ['src/core/skill-runtime', 'src/cli/commands'],
      verify_checklist: ['pnpm vitest', 'pnpm typecheck'],
    }, null, 2));

    writeFileSync(getFirstConventionsPath(TEST_ROOT), JSON.stringify({
      api: {
        observedPatterns: ['CLI: spec-first'],
        deviations: [],
        recommendedConvention: 'Keep command verbs under the spec-first CLI.',
        evidence: ['src/cli/index.ts'],
      },
      module: {
        observedPatterns: ['src/core/skill-runtime'],
        deviations: [],
        recommendedConvention: 'Keep runtime logic under src/core/skill-runtime.',
        evidence: ['src/core/skill-runtime'],
      },
      testing: {
        observedPatterns: ['Vitest'],
        deviations: [],
        recommendedConvention: 'Use Vitest.',
        evidence: ['vitest.config.ts'],
      },
      projectRules: {
        observedPatterns: ['runtime truth first'],
        deviations: [],
        recommendedConvention: 'Read runtime truth before docs.',
        evidence: ['docs/first/README.md'],
      },
    }, null, 2));

    writeFileSync(getFirstCriticalFlowsPath(TEST_ROOT), JSON.stringify([
      {
        flowId: 'flow-cli-entry',
        name: 'CLI Entry Flow',
        entryPoints: ['src/cli/index.ts'],
        coreModules: ['src/core/skill-runtime'],
        invariants: ['runtime truth first'],
        verificationHooks: ['pnpm vitest'],
      },
      {
        flowId: 'flow-doc-projection',
        name: 'Docs Projection Flow',
        entryPoints: ['src/core/skill-runtime/first-doc-projection.ts'],
        coreModules: ['src/core/skill-runtime'],
        invariants: ['docs reflect runtime'],
        verificationHooks: ['pnpm typecheck'],
      },
    ], null, 2));

    writeFileSync(getFirstChangeMapPath(TEST_ROOT), JSON.stringify([
      {
        changeType: 'docs-projection-adjustment',
        likelyModules: ['src/core/skill-runtime/first-doc-projection.ts'],
        likelyCommands: [],
        likelyConfigs: [],
        likelyTests: ['tests/unit/first-doc-projection.test.ts'],
        riskPoints: ['canonical docs mismatch'],
      },
    ], null, 2));

    writeFileSync(getFirstEntryGuidePath(TEST_ROOT), JSON.stringify([
      {
        taskCategory: 'docs-projection',
        readFirst: ['docs/first/README.md'],
        thenRead: ['src/core/skill-runtime/first-doc-projection.ts'],
        avoidEntry: ['legacy docs as truth'],
        relatedFlows: ['flow-doc-projection'],
      },
    ], null, 2));

    writeFileSync(getFirstRebootGuidePath(TEST_ROOT), JSON.stringify({
      projectWhat: 'Specification-driven development process engine',
      whereToStart: ['docs/first/README.md'],
      currentCriticalAreas: ['skill-runtime'],
      commonChangePaths: ['src/core/skill-runtime'],
      verifyChecklist: ['pnpm vitest'],
    }, null, 2));

    const docs = refreshFirstDocsFromRuntime(TEST_ROOT, ['summary.json', 'role-views.json', 'stage-views.json', 'steering.json', 'conventions.json', 'critical-flows.json', 'change-map.json', 'entry-guide.json', 'reboot-guide.json']);

    expect(docs).toEqual(expect.arrayContaining([
      'docs/first/README.md',
      'docs/first/summary.md',
      'docs/first/role-views.md',
      'docs/first/stage-views.md',
    ]));
    expect(docs).not.toContain('docs/first/tech-stack.md');

    const readmeDoc = readFileSync(join(TEST_ROOT, 'docs', 'first', 'README.md'), 'utf-8');
    const summaryDoc = readFileSync(join(TEST_ROOT, 'docs', 'first', 'summary.md'), 'utf-8');
    const roleViewsDoc = readFileSync(join(TEST_ROOT, 'docs', 'first', 'role-views.md'), 'utf-8');
    const stageViewsDoc = readFileSync(join(TEST_ROOT, 'docs', 'first', 'stage-views.md'), 'utf-8');
    const steeringDoc = readFileSync(join(TEST_ROOT, 'docs', 'first', 'steering.md'), 'utf-8');
    const conventionsDoc = readFileSync(join(TEST_ROOT, 'docs', 'first', 'conventions.md'), 'utf-8');
    const criticalFlowsDoc = readFileSync(join(TEST_ROOT, 'docs', 'first', 'critical-flows.md'), 'utf-8');
    const changeMapDoc = readFileSync(join(TEST_ROOT, 'docs', 'first', 'change-map.md'), 'utf-8');
    const entryGuideDoc = readFileSync(join(TEST_ROOT, 'docs', 'first', 'entry-guide.md'), 'utf-8');
    const rebootGuideDoc = readFileSync(join(TEST_ROOT, 'docs', 'first', 'reboot-guide.md'), 'utf-8');

    expect(readmeDoc).toContain('docs/first/tech-stack.md');
    expect(readmeDoc).toContain('spec-first');
    expect(readmeDoc).toContain('当前不受 runtime 真源自动刷新保障');
    expect(summaryDoc).toContain('## Tech Stack');
    expect(summaryDoc).toContain('Node.js ≥20.0.0');
    expect(roleViewsDoc).toContain('docs/first/codebase-overview.md');
    expect(roleViewsDoc).toContain('Stage');
    expect(stageViewsDoc).toContain('docs/first/domain-model.md');
    expect(stageViewsDoc).toContain('src/core/gate-engine/');
    expect(steeringDoc).toContain('Specification-driven development process engine');
    expect(conventionsDoc).toContain('Keep command verbs');
    expect(criticalFlowsDoc).toContain('Docs Projection Flow');
    expect(changeMapDoc).toContain('docs-projection-adjustment');
    expect(entryGuideDoc).toContain('docs-projection');
    expect(rebootGuideDoc).toContain('Specification-driven development process engine');
  });
});
