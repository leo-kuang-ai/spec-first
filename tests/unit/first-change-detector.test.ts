import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { sha256Hex } from '../../src/shared/crypto-utils.js';
import {
  analyzeChanges,
  checkFirstUpdateContext,
  detectFirstRefreshScope,
  formatChangeAnalysis,
  formatHealthStatus,
  getAffectedArtifacts,
  type FirstUpdateContext,
} from '../../src/core/skill-runtime/first-change-detector.js';
import {
  getFirstRuntimeDir,
  writeFirstRoleViews,
  writeFirstRuntimeIndex,
  writeFirstRuntimeSummary,
  writeFirstStageViews,
} from '../../src/core/skill-runtime/first-runtime-store.js';
import type { FirstRuntimeIndex, FirstRuntimeSummary, FirstRoleViews, FirstStageViews } from '../../src/core/skill-runtime/first-runtime-types.js';

const TEST_DIR = join(import.meta.dirname, '../fixtures/first-change-detector');

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
  project: { name: 'spec-first', platformType: 'backend', overview: 'runtime health' },
  modules: ['src/core/skill-runtime'],
  capabilities: ['runtime truth source'],
  entryPoints: ['src/cli/commands/init.ts'],
  dataModels: ['Feature'],
  apiSurface: ['spec-first init'],
  risks: [],
  evidence: ['tests/unit/first-change-detector.test.ts'],
};

const roleViews: FirstRoleViews = {
  product: { role: 'product', summary: 'product', focus: [], warnings: [] },
  dev: { role: 'dev', summary: 'dev', focus: [], warnings: [] },
  qa: { role: 'qa', summary: 'qa', focus: [], warnings: [] },
  architect: { role: 'architect', summary: 'architect', focus: [], warnings: [] },
};

const stageViews: FirstStageViews = {
  spec: { stage: 'spec', summary: 'spec', businessCapabilities: [], coreEntities: [], dependencies: [], warnings: [] },
  design: { stage: 'design', summary: 'design', moduleBoundaries: [], integrationPoints: [], technicalConstraints: [], risks: [] },
  code: { stage: 'code', summary: 'code', entryPoints: [], likelyChangeAreas: [], changeHazards: [], verificationHooks: [] },
  verify: { stage: 'verify', summary: 'verify', testFocus: [], riskAreas: [], validationHooks: [], releaseBlockers: [] },
};

function seedRuntime(projectRoot: string, overrideIndex?: Partial<FirstRuntimeIndex>) {
  writeFirstRuntimeSummary(projectRoot, summary);
  writeFirstRoleViews(projectRoot, roleViews);
  writeFirstStageViews(projectRoot, stageViews);

  const runtimeIndex = { ...index, ...overrideIndex };
  const runtimeDir = getFirstRuntimeDir(projectRoot);
  writeFirstRuntimeIndex(projectRoot, {
    ...runtimeIndex,
    summary: {
      ...runtimeIndex.summary,
      fileHash: runtimeIndex.summary.fileHash === 'summary'
        ? sha256Hex(readFileSync(join(runtimeDir, 'summary.json'), 'utf-8'))
        : runtimeIndex.summary.fileHash,
    },
    roleViews: {
      ...runtimeIndex.roleViews,
      fileHash: runtimeIndex.roleViews.fileHash === 'roles'
        ? sha256Hex(readFileSync(join(runtimeDir, 'role-views.json'), 'utf-8'))
        : runtimeIndex.roleViews.fileHash,
    },
    stageViews: {
      ...runtimeIndex.stageViews,
      fileHash: runtimeIndex.stageViews.fileHash === 'stages'
        ? sha256Hex(readFileSync(join(runtimeDir, 'stage-views.json'), 'utf-8'))
        : runtimeIndex.stageViews.fileHash,
    },
  });
}

describe('analyzeChanges', () => {
  beforeEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('无 Git 仓库返回全量更新策略', () => {
    const result = analyzeChanges(TEST_DIR);

    expect(result.recommendedStrategy).toBe('full');
    expect(result.reason).toContain('无 Git');
    expect(result.affectedArtifacts.length).toBeGreaterThan(0);
  });

  it('格式化全量更新策略结果', () => {
    const result = formatChangeAnalysis({
      changedFiles: 10,
      totalFiles: 20,
      changePercentage: 0.5,
      affectedArtifacts: ['tech-stack.md'],
      recommendedStrategy: 'full',
      reason: 'full',
    });

    expect(result).toContain('全量更新');
    expect(result).toContain('变更文件');
  });
});

describe('checkFirstUpdateContext', () => {
  beforeEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('runtime 目录不存在时返回 hasExistingOutput=false', () => {
    const result = checkFirstUpdateContext(TEST_DIR);

    expect(result.hasExistingOutput).toBe(false);
    expect(result.productStatus).toEqual([]);
    expect(result.hasManualModifications).toBe(false);
  });

  it('runtime 资产健康时返回 3 个运行时资产状态', () => {
    seedRuntime(TEST_DIR);

    const result = checkFirstUpdateContext(TEST_DIR);

    expect(result.hasExistingOutput).toBe(true);
    expect(result.productStatus.map((item) => item.name)).toEqual([
      'summary.json',
      'role-views.json',
      'stage-views.json',
    ]);
    expect(result.productStatus.every((item) => item.issues.length === 0)).toBe(true);
    expect(result.hasManualModifications).toBe(false);
  });

  it('runtime 资产 hash 不匹配时标记 hasManualModifications=true', () => {
    seedRuntime(TEST_DIR, {
      summary: { ...index.summary, fileHash: 'not-the-real-hash' },
    });

    const result = checkFirstUpdateContext(TEST_DIR);
    const summaryStatus = result.productStatus.find((item) => item.name === 'summary.json');

    expect(summaryStatus?.issues.some((issue) => issue.type === 'hash_mismatch')).toBe(true);
    expect(result.hasManualModifications).toBe(true);
  });

  it('runtime 索引标记 unhealthy 时返回 format_error', () => {
    seedRuntime(TEST_DIR, {
      roleViews: { ...index.roleViews, healthy: false, issues: ['role unhealthy'] },
    });

    const result = checkFirstUpdateContext(TEST_DIR);
    const roleStatus = result.productStatus.find((item) => item.name === 'role-views.json');

    expect(roleStatus?.issues.some((issue) => issue.type === 'format_error')).toBe(true);
  });

  it('忽略 docs/first 历史文件，未生成 runtime 时仍视为首次生成', () => {
    const docsFirst = join(TEST_DIR, 'docs', 'first');
    mkdirSync(docsFirst, { recursive: true });
    writeFileSync(join(docsFirst, 'tech-stack.md'), '# legacy docs\n', 'utf-8');

    const result = checkFirstUpdateContext(TEST_DIR);

    expect(result.hasExistingOutput).toBe(false);
    expect(result.productStatus).toEqual([]);
  });

  it('仅存在 runtime 目录但缺失索引时，标记三个资产均缺失', () => {
    mkdirSync(getFirstRuntimeDir(TEST_DIR), { recursive: true });

    const result = checkFirstUpdateContext(TEST_DIR);

    expect(result.hasExistingOutput).toBe(true);
    expect(result.productStatus.every((item) => item.issues.some((issue) => issue.type === 'missing'))).toBe(true);
  });
});

describe('getAffectedArtifacts', () => {
  it('forceUpdate=true 返回全部产物', () => {
    const context: FirstUpdateContext = {
      hasExistingOutput: true,
      productStatus: [],
      hasManualModifications: false,
    };

    const result = getAffectedArtifacts(context, true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('合并 changeAnalysis 与健康检查结果', () => {
    const context: FirstUpdateContext = {
      hasExistingOutput: true,
      changeAnalysis: {
        changedFiles: 1,
        totalFiles: 10,
        changePercentage: 0.1,
        affectedArtifacts: ['tech-stack.md'],
        recommendedStrategy: 'incremental',
        reason: 'incremental',
      },
      productStatus: [
        { name: 'summary.json', exists: true, issues: [], needsUpdate: false },
        { name: 'role-views.json', exists: true, issues: [{ type: 'format_error', message: 'bad' }], needsUpdate: true },
      ],
      hasManualModifications: false,
    };

    const result = getAffectedArtifacts(context);
    expect(result).toContain('tech-stack.md');
    expect(result).toContain('role-views.json');
  });
});

describe('formatHealthStatus', () => {
  it('无产物时提示首次生成', () => {
    expect(formatHealthStatus({ hasExistingOutput: false, productStatus: [], hasManualModifications: false })).toContain('首次生成');
  });

  it('显示 runtime 健康问题', () => {
    const output = formatHealthStatus({
      hasExistingOutput: true,
      lastUpdateTime: new Date('2026-03-08T12:00:00.000Z'),
      productStatus: [
        { name: 'summary.json', exists: true, issues: [{ type: 'hash_mismatch', message: 'summary mismatch' }], needsUpdate: true },
      ],
      hasManualModifications: true,
    });

    expect(output).toContain('summary.json');
    expect(output).toContain('summary mismatch');
  });
});

describe('detectFirstRefreshScope', () => {
  it('marks source changes as runtime-only refresh by default', () => {
    const result = detectFirstRefreshScope(['src/core/skill-runtime/first-summary.ts']);
    expect(result.scope).toBe('runtime-only');
    expect(result.runtimeArtifacts).toContain('summary.json');
  });

  it('marks runtime asset changes as runtime-and-docs refresh', () => {
    const result = detectFirstRefreshScope(['.spec-first/runtime/first/stage-views.json']);
    expect(result.scope).toBe('runtime-and-docs');
    expect(result.docsProjections).toContain('docs/first/stage-views.md');
  });

  it('marks projection source changes as runtime-and-docs refresh', () => {
    const result = detectFirstRefreshScope(['src/core/skill-runtime/first-doc-projection.ts']);
    expect(result.scope).toBe('runtime-and-docs');
    expect(result.docsProjections.length).toBeGreaterThan(0);
  });
});
