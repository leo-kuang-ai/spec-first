import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { refreshFirstDocsFromRuntime } from '../../src/core/skill-runtime/first-doc-projection.js';
import {
  getFirstRoleViewsPath,
  getFirstRuntimeIndexPath,
  getFirstRuntimeSummaryPath,
  getFirstStageViewsPath,
  writeFirstRoleViews,
  writeFirstRuntimeIndex,
  writeFirstRuntimeSummary,
  writeFirstStageViews,
} from '../../src/core/skill-runtime/first-runtime-store.js';
import type {
  FirstRoleViews,
  FirstRuntimeIndex,
  FirstRuntimeSummary,
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

    const docs = refreshFirstDocsFromRuntime(TEST_ROOT, ['summary.json', 'role-views.json', 'stage-views.json']);

    expect(docs).toContain('docs/first/summary.md');
    expect(docs).toContain('docs/first/role-views.md');
    expect(docs).toContain('docs/first/stage-views.md');

    const readmeDoc = readFileSync(join(TEST_ROOT, 'docs', 'first', 'README.md'), 'utf-8');
    const summaryDoc = readFileSync(join(TEST_ROOT, 'docs', 'first', 'summary.md'), 'utf-8');
    const stageViewsDoc = readFileSync(join(TEST_ROOT, 'docs', 'first', 'stage-views.md'), 'utf-8');
    const roleViewsDoc = readFileSync(join(TEST_ROOT, 'docs', 'first', 'role-views.md'), 'utf-8');

    expect(readmeDoc).toContain('投影视图');
    expect(readmeDoc).toContain('.spec-first/runtime/first/');
    expect(summaryDoc).toContain('## 项目概览');
    expect(summaryDoc).toContain('runtime: Node.js ≥20.0.0');
    expect(summaryDoc).toContain('runtime truth source');
    expect(stageViewsDoc).toContain('## Verify View');
    expect(stageViewsDoc).toContain('### Recommended Checks');
    expect(roleViewsDoc).toContain('## Developer');
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

    const docs = refreshFirstDocsFromRuntime(TEST_ROOT, ['summary.json', 'role-views.json', 'stage-views.json']);

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

    expect(readmeDoc).toContain('docs/first/tech-stack.md');
    expect(readmeDoc).toContain('spec-first');
    expect(summaryDoc).toContain('## Tech Stack');
    expect(summaryDoc).toContain('Node.js ≥20.0.0');
    expect(roleViewsDoc).toContain('docs/first/codebase-overview.md');
    expect(roleViewsDoc).toContain('Stage');
    expect(stageViewsDoc).toContain('docs/first/domain-model.md');
    expect(stageViewsDoc).toContain('src/core/gate-engine/');
  });
});
