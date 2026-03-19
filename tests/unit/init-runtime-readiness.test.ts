import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkInitReadiness, summarizeFirstArtifacts } from '../../src/cli/commands/init.js';
import {
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

const TEST_ROOT = join(import.meta.dirname, '../fixtures/.tmp-init-runtime-readiness');

function healthyEntry(path: string) {
  return {
    path,
    fileHash: path,
    lastUpdated: '2026-03-08T12:00:00.000Z',
    healthy: true,
  };
}

function seedCanonicalRuntime(healthySummary = true) {
  writeFirstRuntimeIndex(TEST_ROOT, {
    version: '1.0.0',
    lastRun: '2026-03-08T12:00:00.000Z',
    summary: { ...healthyEntry('.spec-first/runtime/first/summary.json'), healthy: healthySummary, issues: healthySummary ? undefined : ['stale summary'] },
    steering: healthyEntry('.spec-first/runtime/first/steering.json'),
    conventions: healthyEntry('.spec-first/runtime/first/conventions.json'),
    criticalFlows: healthyEntry('.spec-first/runtime/first/critical-flows.json'),
    entryGuide: healthyEntry('.spec-first/runtime/first/entry-guide.json'),
    apiContracts: healthyEntry('.spec-first/runtime/first/api-contracts.json'),
    structureOverview: healthyEntry('.spec-first/runtime/first/structure-overview.json'),
    domainModel: healthyEntry('.spec-first/runtime/first/domain-model.json'),
    databaseSchema: { ...healthyEntry('.spec-first/runtime/first/database-schema.json'), status: 'healthy' },
    docsProjection: {},
    status: healthySummary ? 'current' : 'stale',
  });
  writeFirstRuntimeSummary(TEST_ROOT, {
    generatedAt: '2026-03-08T12:00:00.000Z',
    mode: 'deep',
    project: { name: 'spec-first' },
    modules: [],
    capabilities: [],
    entryPoints: [],
    dataModels: [],
    apiSurface: [],
    risks: [],
    evidence: [],
  });
  writeFirstSteering(TEST_ROOT, {
    product: { overview: 'spec-first', coreScenarios: ['init'], nonGoals: [], glossary: [] },
    tech: { stack: ['TypeScript'], constraints: [], forbiddenPatterns: [] },
    structure: { modules: ['src/core'], boundaries: [], entryRules: [] },
  });
  writeFirstConventions(TEST_ROOT, {
    api: { observedPatterns: [], deviations: [], recommendedConvention: 'stable', evidence: [] },
    module: { observedPatterns: [], deviations: [], recommendedConvention: 'stable', evidence: [] },
    testing: { observedPatterns: [], deviations: [], recommendedConvention: 'stable', evidence: [] },
    projectRules: { observedPatterns: [], deviations: [], recommendedConvention: 'stable', evidence: [] },
  });
  writeFirstCriticalFlows(TEST_ROOT, []);
  writeFirstEntryGuide(TEST_ROOT, []);
  writeFirstApiContracts(TEST_ROOT, { interfaces: [], integrationPoints: [], notes: [] });
  writeFirstStructureOverview(TEST_ROOT, { topology: [], modules: [], readingOrder: [], evidence: [] });
  writeFirstDomainModel(TEST_ROOT, { entities: [], glossary: [], evidence: [] });
  writeFirstDatabaseSchema(TEST_ROOT, { status: 'healthy', provider: 'sqlite', tables: [], risks: [], evidence: [] });
}

describe('init runtime readiness', () => {
  beforeEach(() => {
    rmSync(TEST_ROOT, { recursive: true, force: true });
    mkdirSync(TEST_ROOT, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_ROOT, { recursive: true, force: true });
  });

  it('treats canonical runtime truth source as readiness signal', () => {
    seedCanonicalRuntime();
    const readiness = checkInitReadiness(TEST_ROOT);
    expect(readiness.firstCompleted).toBe(true);
    expect(readiness.firstMissing).toEqual([]);
  });

  it('fails readiness when runtime assets exist but are marked unhealthy', () => {
    seedCanonicalRuntime(false);
    const readiness = checkInitReadiness(TEST_ROOT);
    expect(readiness.firstCompleted).toBe(false);
    expect(readiness.firstMissing).toContain('.spec-first/runtime/first/summary.json');
  });

  it('does not fall back to docs outputs when runtime summary is missing', () => {
    const docsFirst = join(TEST_ROOT, 'docs', 'first');
    mkdirSync(docsFirst, { recursive: true });
    writeFileSync(join(docsFirst, 'summary.md'), '# Summary\nunknown\n', 'utf-8');
    const summary = summarizeFirstArtifacts(TEST_ROOT);
    expect(summary).toEqual({
      mode: 'unknown',
      techStack: '待确认',
      codeVolume: '待确认',
      apiSurface: '待确认',
    });
  });
});
