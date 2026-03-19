import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { loadFirstContext } from '../../src/core/skill-runtime/first-context.js';
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

const TEST_ROOT = join(import.meta.dirname, '../fixtures/.tmp-first-context');

function healthyEntry(path: string) {
  return {
    path,
    fileHash: path,
    lastUpdated: '2026-03-08T12:00:00.000Z',
    healthy: true,
  };
}

function seedCanonicalRuntime() {
  writeFirstRuntimeIndex(TEST_ROOT, {
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
    databaseSchema: {
      ...healthyEntry('.spec-first/runtime/first/database-schema.json'),
      status: 'healthy',
    },
    docsProjection: {},
    status: 'current',
  });
  writeFirstRuntimeSummary(TEST_ROOT, {
    generatedAt: '2026-03-08T12:00:00.000Z',
    mode: 'deep',
    project: { name: 'spec-first', platformType: 'backend', overview: 'context test' },
    modules: ['src/core/skill-runtime'],
    capabilities: ['runtime truth source'],
    entryPoints: ['src/cli/index.ts'],
    dataModels: ['Feature'],
    apiSurface: ['CLI: spec-first init'],
    risks: ['legacy docs'],
    evidence: ['tests/unit/first-context.test.ts'],
  });
  writeFirstSteering(TEST_ROOT, {
    product: {
      overview: 'context test',
      coreScenarios: ['brownfield delivery'],
      nonGoals: ['legacy docs as truth'],
      glossary: ['Feature'],
    },
    tech: {
      stack: ['TypeScript'],
      constraints: ['backend'],
      forbiddenPatterns: ['docs-only truth'],
    },
    structure: {
      modules: ['src/core/skill-runtime'],
      boundaries: ['cli -> runtime'],
      entryRules: ['read runtime first'],
    },
  });
  writeFirstConventions(TEST_ROOT, {
    api: {
      observedPatterns: ['CLI: spec-first init'],
      deviations: [],
      recommendedConvention: 'Expose stable CLI verbs.',
      evidence: ['src/cli/index.ts'],
    },
    module: {
      observedPatterns: ['src/core/skill-runtime'],
      deviations: [],
      recommendedConvention: 'Keep runtime logic under src/core.',
      evidence: ['src/core/skill-runtime'],
    },
    testing: {
      observedPatterns: ['Vitest'],
      deviations: [],
      recommendedConvention: 'Use Vitest.',
      evidence: ['tests/unit/first-context.test.ts'],
    },
    projectRules: {
      observedPatterns: ['runtime truth first'],
      deviations: [],
      recommendedConvention: 'Read runtime truth before docs.',
      evidence: ['.spec-first/runtime/first'],
    },
  });
  writeFirstCriticalFlows(TEST_ROOT, [
    {
      flowId: 'flow-cli-entry',
      name: 'CLI Entry Flow',
      entryPoints: ['src/cli/index.ts'],
      coreModules: ['src/core/skill-runtime'],
      invariants: ['runtime truth first'],
      verificationHooks: ['pnpm vitest'],
    },
  ]);
  writeFirstEntryGuide(TEST_ROOT, [
    {
      taskCategory: 'runtime-extension',
      readFirst: ['.spec-first/runtime/first/summary.json'],
      thenRead: ['src/core/skill-runtime'],
      avoidEntry: ['docs/first/summary.md'],
      relatedFlows: ['flow-cli-entry'],
    },
  ]);
  writeFirstApiContracts(TEST_ROOT, {
    interfaces: [],
    integrationPoints: ['src/cli/index.ts'],
    notes: [],
  });
  writeFirstStructureOverview(TEST_ROOT, {
    topology: ['cli -> runtime'],
    modules: [
      {
        name: 'skill-runtime',
        purpose: 'runtime truth source',
        keyPaths: ['src/core/skill-runtime'],
        entryPoints: ['src/cli/index.ts'],
        dependencies: [],
      },
    ],
    readingOrder: ['src/cli/index.ts', 'src/core/skill-runtime'],
    evidence: ['src/cli/index.ts'],
  });
  writeFirstDomainModel(TEST_ROOT, {
    entities: [
      {
        name: 'Feature',
        kind: 'concept',
        description: 'feature',
        invariants: ['runtime truth first'],
        relationships: [],
        evidence: ['src/cli/index.ts'],
      },
    ],
    glossary: ['Feature'],
    evidence: ['src/cli/index.ts'],
  });
  writeFirstDatabaseSchema(TEST_ROOT, {
    status: 'healthy',
    provider: 'sqlite',
    tables: [{ name: 'features', fields: ['id'], relations: [], evidence: ['schema.prisma'] }],
    risks: [],
    evidence: ['schema.prisma'],
  });
}

describe('first context', () => {
  beforeEach(() => {
    rmSync(TEST_ROOT, { recursive: true, force: true });
    mkdirSync(TEST_ROOT, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_ROOT, { recursive: true, force: true });
  });

  it('loads the aggregated first context', () => {
    seedCanonicalRuntime();
    const context = loadFirstContext(TEST_ROOT);
    expect(context.summary.project.name).toBe('spec-first');
    expect(context.steering.tech.constraints).toContain('backend');
    expect(context.structureOverview.modules[0]?.name).toBe('skill-runtime');
  });

  it('loads canonical guidance assets from runtime truth', () => {
    seedCanonicalRuntime();
    const context = loadFirstContext(TEST_ROOT);
    expect(context.entryGuide[0]?.readFirst[0]).toContain('summary.json');
    expect(context.conventions.projectRules.recommendedConvention).toContain('runtime');
  });

  it('rejects unhealthy summary assets when loading context', () => {
    seedCanonicalRuntime();
    writeFirstRuntimeIndex(TEST_ROOT, {
      version: '1.0.0',
      lastRun: '2026-03-08T12:00:00.000Z',
      summary: { ...healthyEntry('.spec-first/runtime/first/summary.json'), healthy: false, issues: ['summary drift'] },
      steering: healthyEntry('.spec-first/runtime/first/steering.json'),
      conventions: healthyEntry('.spec-first/runtime/first/conventions.json'),
      criticalFlows: healthyEntry('.spec-first/runtime/first/critical-flows.json'),
      entryGuide: healthyEntry('.spec-first/runtime/first/entry-guide.json'),
      apiContracts: healthyEntry('.spec-first/runtime/first/api-contracts.json'),
      structureOverview: healthyEntry('.spec-first/runtime/first/structure-overview.json'),
      domainModel: healthyEntry('.spec-first/runtime/first/domain-model.json'),
      databaseSchema: { ...healthyEntry('.spec-first/runtime/first/database-schema.json'), status: 'healthy' },
      docsProjection: {},
      status: 'stale',
      staleReason: 'summary drift',
    });
    expect(() => loadFirstContext(TEST_ROOT)).toThrow(/summary/i);
  });
});
