import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { refreshFirstArtifacts } from '../../src/core/skill-runtime/first-context.js';
import {
  getFirstRoleViewsPath,
  getFirstRuntimeIndexPath,
  getFirstRuntimeSummaryPath,
  getFirstStageViewsPath,
  readFirstRuntimeIndex,
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

const TEST_ROOT = join(import.meta.dirname, '../fixtures/.tmp-first-refresh');

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
  project: { name: 'spec-first', platformType: 'backend', overview: 'refresh tests' },
  modules: ['src/core/skill-runtime', 'src/cli/commands'],
  capabilities: ['runtime truth source', 'docs projection'],
  entryPoints: ['src/cli/commands/init.ts'],
  dataModels: ['Feature'],
  apiSurface: ['spec-first init'],
  risks: ['half-switch state'],
  evidence: ['tests/unit/first-refresh.test.ts'],
};

const roleViews: FirstRoleViews = {
  product: { role: 'product', summary: 'product', focus: ['capabilities'], warnings: [] },
  dev: { role: 'dev', summary: 'dev', focus: ['modules'], warnings: [] },
  qa: { role: 'qa', summary: 'qa', focus: ['validation'], warnings: [] },
  architect: { role: 'architect', summary: 'architect', focus: ['constraints'], warnings: [] },
};

const stageViews: FirstStageViews = {
  spec: { stage: 'spec', summary: 'spec', businessCapabilities: ['runtime truth source'], coreEntities: ['Feature'], dependencies: ['接口: spec-first init'], warnings: [] },
  design: { stage: 'design', summary: 'design', moduleBoundaries: ['src/core/skill-runtime'], integrationPoints: ['spec-first init'], technicalConstraints: ['平台类型: backend'], risks: [] },
  code: {
    stage: 'code',
    summary: 'code',
    entryPoints: ['src/cli/commands/init.ts'],
    likelyChangeAreas: ['src/core/skill-runtime'],
    callPathHints: ['入口 -> src/cli/commands/init.ts'],
    couplingPoints: ['模块耦合: src/core/skill-runtime'],
    changeHazards: ['half-switch state'],
    verificationHooks: ['tests/unit/first-refresh.test.ts'],
  },
  verify: {
    stage: 'verify',
    summary: 'verify',
    criticalFlows: ['入口链路: src/cli/commands/init.ts'],
    validationFocus: ['能力验证: runtime truth source'],
    testFocus: ['runtime truth source'],
    riskAreas: ['half-switch state'],
    recommendedChecks: ['证据核对: tests/unit/first-refresh.test.ts'],
    validationHooks: ['pnpm vitest'],
    releaseBlockers: ['half-switch state'],
  },
};

describe('refreshFirstArtifacts', () => {
  beforeEach(() => {
    rmSync(TEST_ROOT, { recursive: true, force: true });
    mkdirSync(TEST_ROOT, { recursive: true });
    mkdirSync(join(TEST_ROOT, 'src', 'core', 'skill-runtime'), { recursive: true });
    writeFileSync(join(TEST_ROOT, 'src', 'core', 'skill-runtime', 'first-stage-views.ts'), 'export const marker = 1;\n', 'utf-8');

    execSync('git -c core.hooksPath=/dev/null init', { cwd: TEST_ROOT, stdio: 'ignore' });
    execSync('git config user.email "dev@example.com"', { cwd: TEST_ROOT, stdio: 'ignore' });
    execSync('git config user.name "Dev"', { cwd: TEST_ROOT, stdio: 'ignore' });
    execSync('git config core.hooksPath /dev/null', { cwd: TEST_ROOT, stdio: 'ignore' });
    execSync('git config commit.gpgsign false', { cwd: TEST_ROOT, stdio: 'ignore' });

    execSync('git -c core.hooksPath=/dev/null add src', { cwd: TEST_ROOT, stdio: 'ignore' });
    execSync('git -c core.hooksPath=/dev/null -c commit.gpgsign=false commit -m "source init"', { cwd: TEST_ROOT, stdio: 'ignore' });
    const sourceCommit = execSync('git rev-parse HEAD', { cwd: TEST_ROOT, encoding: 'utf-8' }).trim();

    writeFirstRuntimeIndex(TEST_ROOT, { ...index, sourceCommit });
    writeFirstRuntimeSummary(TEST_ROOT, summary);
    writeFirstRoleViews(TEST_ROOT, roleViews);
    writeFirstStageViews(TEST_ROOT, stageViews);

    execSync('git -c core.hooksPath=/dev/null add .', { cwd: TEST_ROOT, stdio: 'ignore' });
    execSync('git -c core.hooksPath=/dev/null -c commit.gpgsign=false commit -m "runtime init"', { cwd: TEST_ROOT, stdio: 'ignore' });
  });

  afterEach(() => {
    rmSync(TEST_ROOT, { recursive: true, force: true });
  });

  it('returns no-op when working tree is clean and runtime assets are healthy', () => {
    expect(refreshFirstArtifacts(TEST_ROOT, 'refresh-all')).toEqual({
      mode: 'refresh-all',
      runtimeArtifacts: [],
      docsProjections: [],
    });
  });

  it('refreshes only affected runtime artifact and canonical docs when builder file changes', () => {
    writeFileSync(join(TEST_ROOT, 'src', 'core', 'skill-runtime', 'first-stage-views.ts'), 'export const marker = 2;\n', 'utf-8');

    const result = refreshFirstArtifacts(TEST_ROOT, 'refresh-all');

    expect(result.runtimeArtifacts).toEqual(['stage-views.json']);
    expect(result.docsProjections).toContain('docs/first/stage-views.md');
    expect(existsSync(join(TEST_ROOT, 'docs', 'first', 'stage-views.md'))).toBe(true);
    expect(readFileSync(join(TEST_ROOT, 'docs', 'first', 'stage-views.md'), 'utf-8')).toContain('## Verify View');

    const refreshedIndex = readFirstRuntimeIndex(TEST_ROOT);
    expect(refreshedIndex?.docsProjection['docs/first/stage-views.md']?.healthy).toBe(true);
  });

  it('supports docs-only refresh from current runtime assets', () => {
    writeFileSync(join(TEST_ROOT, 'src', 'core', 'skill-runtime', 'first-stage-views.ts'), 'export const marker = 3;\n', 'utf-8');

    const result = refreshFirstArtifacts(TEST_ROOT, 'refresh-docs-from-runtime');

    expect(result.runtimeArtifacts).toEqual([]);
    expect(result.docsProjections).toContain('docs/first/stage-views.md');
  });

  it('rebuilds canonical docs on explicit docs refresh even when working tree is clean', () => {
    const result = refreshFirstArtifacts(TEST_ROOT, 'refresh-docs-from-runtime');

    expect(result.runtimeArtifacts).toEqual([]);
    expect(result.docsProjections).toContain('docs/first/README.md');
    expect(result.docsProjections).toContain('docs/first/stage-views.md');
    expect(existsSync(join(TEST_ROOT, 'docs', 'first', 'README.md'))).toBe(true);

    const refreshedIndex = readFirstRuntimeIndex(TEST_ROOT);
    expect(refreshedIndex?.docsProjection['docs/first/README.md']?.healthy).toBe(true);
  });

  it('refreshes docs from legacy runtime truth source without crashing', () => {
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
        { id: 'tech-stack', path: 'docs/first/tech-stack.md', type: 'tech-stack', status: 'generated' },
        { id: 'api-docs', path: 'docs/first/api-docs.md', type: 'api-specification', status: 'generated' },
      ],
      database: { detected: false, reason: 'No database dependencies found' },
    }, null, 2), 'utf-8');

    writeFileSync(getFirstRuntimeSummaryPath(TEST_ROOT), JSON.stringify({
      mode: 'quick',
      generated_at: '2026-03-09T04:43:27.542Z',
      tech_stack: { runtime: 'Node.js ≥20.0.0', language: 'TypeScript 5.4+' },
      project_type: 'cli-tool',
      core_modules: ['skill-runtime', 'gate-engine'],
      commands_count: 19,
      has_database: false,
    }, null, 2), 'utf-8');

    writeFileSync(getFirstRoleViewsPath(TEST_ROOT), JSON.stringify({
      generated_at: '2026-03-09T04:43:27.542Z',
      roles: {
        developer: { priority_docs: ['codebase-overview.md'], entry_points: ['src/cli/index.ts'], key_concepts: ['Feature'] },
        product_manager: { priority_docs: ['domain-model.md'], entry_points: ['specs/'], key_concepts: ['RFC'] },
        tester: { priority_docs: ['domain-model.md'], entry_points: ['tests/'], key_concepts: ['Coverage'] },
        architect: { priority_docs: ['tech-stack.md'], entry_points: ['src/core/'], key_concepts: ['Process Engine'] },
      },
    }, null, 2), 'utf-8');

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
    }, null, 2), 'utf-8');

    const result = refreshFirstArtifacts(TEST_ROOT, 'refresh-docs-from-runtime');

    expect(result.runtimeArtifacts).toEqual([]);
    expect(result.docsProjections).toEqual(expect.arrayContaining([
      'docs/first/README.md',
      'docs/first/summary.md',
      'docs/first/role-views.md',
      'docs/first/stage-views.md',
    ]));
    expect(readFileSync(join(TEST_ROOT, 'docs', 'first', 'summary.md'), 'utf-8')).toContain('## Tech Stack');
    expect(readFirstRuntimeIndex(TEST_ROOT)?.docsProjection['docs/first/summary.md']?.healthy).toBe(true);
  });

  it('refreshes docs when legacy runtime files drift in the working tree', () => {
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
        { id: 'tech-stack', path: 'docs/first/tech-stack.md', type: 'tech-stack', status: 'generated' },
      ],
      database: { detected: false, reason: 'No database dependencies found' },
    }, null, 2), 'utf-8');

    writeFileSync(getFirstRuntimeSummaryPath(TEST_ROOT), JSON.stringify({
      mode: 'quick',
      generated_at: '2026-03-09T04:43:27.542Z',
      tech_stack: { runtime: 'Node.js ≥20.0.0' },
      project_type: 'cli-tool',
      core_modules: ['skill-runtime'],
      commands_count: 19,
      has_database: false,
    }, null, 2), 'utf-8');

    writeFileSync(getFirstRoleViewsPath(TEST_ROOT), JSON.stringify({
      generated_at: '2026-03-09T04:43:27.542Z',
      roles: {
        developer: { priority_docs: ['codebase-overview.md'], entry_points: ['src/cli/index.ts'], key_concepts: ['Feature'] },
        product_manager: { priority_docs: ['domain-model.md'], entry_points: ['specs/'], key_concepts: ['RFC'] },
        tester: { priority_docs: ['domain-model.md'], entry_points: ['tests/'], key_concepts: ['Coverage'] },
        architect: { priority_docs: ['tech-stack.md'], entry_points: ['src/core/'], key_concepts: ['Process Engine'] },
      },
    }, null, 2), 'utf-8');

    writeFileSync(getFirstStageViewsPath(TEST_ROOT), JSON.stringify({
      generated_at: '2026-03-09T04:43:27.542Z',
      stages: {
        '00_init': { relevant_docs: ['codebase-overview.md'], key_files: ['src/cli/index.ts'] },
        '01_specify': { relevant_docs: ['domain-model.md'], key_files: ['specs/'] },
        '02_design': { relevant_docs: ['tech-stack.md'], key_files: ['src/core/skill-runtime/'] },
        '03_plan': { relevant_docs: ['codebase-overview.md'], key_files: ['src/core/change-mgr/'] },
        '04_implement': { relevant_docs: ['tech-stack.md'], key_files: ['src/', 'tests/'] },
        '05_verify': { relevant_docs: ['domain-model.md'], key_files: ['src/core/gate-engine/', 'tests/'] },
      },
    }, null, 2), 'utf-8');

    const result = refreshFirstArtifacts(TEST_ROOT, 'refresh-all');

    expect(result.runtimeArtifacts).toEqual([]);
    expect(result.docsProjections).toEqual(expect.arrayContaining([
      'docs/first/README.md',
      'docs/first/summary.md',
      'docs/first/role-views.md',
      'docs/first/stage-views.md',
    ]));
    expect(readFirstRuntimeIndex(TEST_ROOT)?.docsProjection['docs/first/README.md']?.healthy).toBe(true);
  });

  it('refreshes runtime artifacts when relevant source drift was already committed', () => {
    writeFileSync(join(TEST_ROOT, 'src', 'core', 'skill-runtime', 'first-stage-views.ts'), 'export const marker = 4;\n', 'utf-8');
    execSync('git -c core.hooksPath=/dev/null add src/core/skill-runtime/first-stage-views.ts', { cwd: TEST_ROOT, stdio: 'ignore' });
    execSync('git -c core.hooksPath=/dev/null -c commit.gpgsign=false commit -m "builder drift"', { cwd: TEST_ROOT, stdio: 'ignore' });

    const result = refreshFirstArtifacts(TEST_ROOT, 'refresh-all');

    expect(result.runtimeArtifacts).toEqual(['stage-views.json']);
    expect(result.docsProjections).toContain('docs/first/stage-views.md');
    expect(existsSync(join(TEST_ROOT, 'docs', 'first', 'stage-views.md'))).toBe(true);
  });
});
