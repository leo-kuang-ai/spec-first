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
});
