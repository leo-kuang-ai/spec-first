import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  formatProductSummary,
  formatResumePrompt,
  generateResumeRecommendation,
  type ResumeRecommendation,
} from '../../src/core/skill-runtime/first-resume.js';
import {
  getFirstRuntimeDir,
  writeFirstApiContracts,
  writeFirstConventions,
  writeFirstCriticalFlows,
  writeFirstDatabaseSchema,
  writeFirstDomainModel,
  writeFirstEntryGuide,
  writeFirstRuntimeIndex,
  writeFirstRuntimeSummary,
  writeFirstSteering,
  writeFirstStructureOverview,
} from '../../src/core/skill-runtime/first-runtime-store.js';

const TEST_DIR = join(import.meta.dirname, '../fixtures/first-resume');

function healthyEntry(path: string) {
  return {
    path,
    fileHash: path,
    lastUpdated: '2026-03-08T12:00:00.000Z',
    healthy: true,
  };
}

function seedHealthyRuntime(projectRoot: string) {
  writeFirstRuntimeIndex(projectRoot, {
    version: '1.0.0',
    lastRun: '2026-03-08T12:00:00.000Z',
    summary: healthyEntry('.spec-first/runtime/first/summary.json'),
    steering: healthyEntry('.spec-first/runtime/first/steering.json'),
    conventions: healthyEntry('.spec-first/runtime/first/conventions.json'),
    criticalFlows: healthyEntry('.spec-first/runtime/first/critical-flows.json'),
    entryGuide: healthyEntry('.spec-first/runtime/first/entry-guide.json'),
    apiContracts: healthyEntry('.spec-first/runtime/first/api-contracts.json'),
    structureOverview: healthyEntry('.spec-first/runtime/first/structure-overview.json'),
    domainModel: healthyEntry('.spec-first/runtime/first/domain-model.json'),
    databaseSchema: { ...healthyEntry('.spec-first/runtime/first/database-schema.json'), status: 'healthy' },
    docsProjection: {},
    status: 'current',
  });
  writeFirstRuntimeSummary(projectRoot, {
    generatedAt: '2026-03-08T12:00:00.000Z',
    mode: 'deep',
    project: { name: 'spec-first', platformType: 'backend', overview: 'runtime-only' },
    modules: ['src/core/skill-runtime'],
    capabilities: ['runtime truth source'],
    entryPoints: ['src/cli/commands/init.ts'],
    dataModels: ['Feature'],
    apiSurface: ['spec-first init'],
    risks: [],
    evidence: ['tests/unit/first-resume.test.ts'],
  });
  writeFirstSteering(projectRoot, {
    product: { overview: 'runtime-only', coreScenarios: ['runtime truth source'], nonGoals: [], glossary: ['Feature'] },
    tech: { stack: ['TypeScript'], constraints: [], forbiddenPatterns: [] },
    structure: { modules: ['src/core/skill-runtime'], boundaries: [], entryRules: ['read runtime truth first'] },
  });
  writeFirstConventions(projectRoot, {
    api: { observedPatterns: [], deviations: [], recommendedConvention: 'stable', evidence: [] },
    module: { observedPatterns: [], deviations: [], recommendedConvention: 'stable', evidence: [] },
    testing: { observedPatterns: [], deviations: [], recommendedConvention: 'stable', evidence: [] },
    projectRules: { observedPatterns: [], deviations: [], recommendedConvention: 'stable', evidence: [] },
  });
  writeFirstCriticalFlows(projectRoot, []);
  writeFirstEntryGuide(projectRoot, []);
  writeFirstApiContracts(projectRoot, { interfaces: [], integrationPoints: ['CLI: spec-first init'], notes: [] });
  writeFirstStructureOverview(projectRoot, { topology: ['cli -> runtime'], modules: [], readingOrder: [], evidence: [] });
  writeFirstDomainModel(projectRoot, { entities: [], glossary: ['Feature'], evidence: [] });
  writeFirstDatabaseSchema(projectRoot, { status: 'healthy', provider: 'sqlite', tables: [], risks: [], evidence: [] });
}

describe('first resume', () => {
  beforeEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('无 runtime 资产时返回首次运行建议', () => {
    const result = generateResumeRecommendation(join(TEST_DIR, 'nonexistent'));
    expect(result.hasExistingProducts).toBe(false);
    expect(result.recommendedOption).toBe('full_regenerate');
  });

  it('runtime 存在时返回恢复建议', () => {
    seedHealthyRuntime(TEST_DIR);
    const result = generateResumeRecommendation(TEST_DIR);
    expect(result.hasExistingProducts).toBe(true);
    expect(result.message).toContain('runtime 产物');
  });

  it('格式化 runtime 摘要时只展示 canonical runtime 资产', () => {
    seedHealthyRuntime(TEST_DIR);
    const summary = formatProductSummary(TEST_DIR);
    expect(summary).toContain('runtime-assets');
    expect(summary).toContain('.spec-first/runtime/first/summary.json');
    expect(summary).toContain('.spec-first/runtime/first/api-contracts.json');
    expect(summary).toContain('.spec-first/runtime/first/database-schema.json');
  });

  it('格式化恢复提示', () => {
    const recommendation: ResumeRecommendation = {
      hasExistingProducts: true,
      lastMode: 'deep',
      lastRunTime: new Date('2026-03-01'),
      isStale: false,
      commitMismatch: false,
      options: ['view_summary', 'full_regenerate'],
      recommendedOption: 'view_summary',
      message: '检测到已有产物',
    };
    const prompt = formatResumePrompt(recommendation);
    expect(prompt).toContain('检测到已有产物');
  });

  it('runtime 索引缺失时提示全量重建', () => {
    mkdirSync(getFirstRuntimeDir(TEST_DIR), { recursive: true });
    writeFileSync(join(TEST_DIR, 'README.md'), '# project\n', 'utf-8');
    const result = generateResumeRecommendation(TEST_DIR);
    expect(result.isStale).toBe(true);
  });
});
