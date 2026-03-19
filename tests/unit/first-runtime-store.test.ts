import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import {
  FIRST_RUNTIME_API_CONTRACTS_FILE,
  FIRST_RUNTIME_CONVENTIONS_FILE,
  FIRST_RUNTIME_CRITICAL_FLOWS_FILE,
  FIRST_RUNTIME_DATABASE_SCHEMA_FILE,
  FIRST_RUNTIME_DOCS_INDEX_FILE,
  FIRST_RUNTIME_DIR,
  FIRST_RUNTIME_DOMAIN_MODEL_FILE,
  FIRST_RUNTIME_ENTRY_GUIDE_FILE,
  FIRST_RUNTIME_INDEX_FILE,
  FIRST_RUNTIME_STRUCTURE_OVERVIEW_FILE,
  FIRST_RUNTIME_STEERING_FILE,
  FIRST_RUNTIME_SUMMARY_FILE,
  getFirstApiContractsPath,
  getFirstConventionsPath,
  getFirstCriticalFlowsPath,
  getFirstDatabaseSchemaPath,
  getFirstDocsIndexPath,
  getFirstDomainModelPath,
  getFirstEntryGuidePath,
  getFirstRuntimeIndexPath,
  getFirstRuntimeSummaryPath,
  getFirstSteeringPath,
  getFirstStructureOverviewPath,
  readFirstRuntimeIndex,
  writeFirstApiContracts,
  writeFirstConventions,
  writeFirstCriticalFlows,
  writeFirstDatabaseSchema,
  writeFirstDocsIndex,
  writeFirstDomainModel,
  writeFirstEntryGuide,
  writeFirstRuntimeIndex,
  writeFirstRuntimeSummary,
  writeFirstSteering,
  writeFirstStructureOverview,
} from '../../src/core/skill-runtime/first-runtime-store.js';

const TEST_ROOT = join(import.meta.dirname, '../fixtures/.tmp-first-runtime-store');

function healthyEntry(path: string) {
  return {
    path,
    fileHash: path,
    lastUpdated: '2026-03-08T12:00:00.000Z',
    healthy: true,
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

  it('exposes the expected canonical runtime paths', () => {
    expect(FIRST_RUNTIME_DIR).toBe('.spec-first/runtime/first');
    expect(FIRST_RUNTIME_INDEX_FILE).toBe('index.json');
    expect(FIRST_RUNTIME_SUMMARY_FILE).toBe('summary.json');
    expect(FIRST_RUNTIME_STEERING_FILE).toBe('steering.json');
    expect(FIRST_RUNTIME_CONVENTIONS_FILE).toBe('conventions.json');
    expect(FIRST_RUNTIME_CRITICAL_FLOWS_FILE).toBe('critical-flows.json');
    expect(FIRST_RUNTIME_ENTRY_GUIDE_FILE).toBe('entry-guide.json');
    expect(FIRST_RUNTIME_API_CONTRACTS_FILE).toBe('api-contracts.json');
    expect(FIRST_RUNTIME_STRUCTURE_OVERVIEW_FILE).toBe('structure-overview.json');
    expect(FIRST_RUNTIME_DOMAIN_MODEL_FILE).toBe('domain-model.json');
    expect(FIRST_RUNTIME_DATABASE_SCHEMA_FILE).toBe('database-schema.json');
    expect(FIRST_RUNTIME_DOCS_INDEX_FILE).toBe('docs-index.json');
    expect(getFirstRuntimeIndexPath(TEST_ROOT)).toBe(join(TEST_ROOT, '.spec-first/runtime/first/index.json'));
    expect(getFirstRuntimeSummaryPath(TEST_ROOT)).toBe(join(TEST_ROOT, '.spec-first/runtime/first/summary.json'));
    expect(getFirstSteeringPath(TEST_ROOT)).toBe(join(TEST_ROOT, '.spec-first/runtime/first/steering.json'));
    expect(getFirstConventionsPath(TEST_ROOT)).toBe(join(TEST_ROOT, '.spec-first/runtime/first/conventions.json'));
    expect(getFirstCriticalFlowsPath(TEST_ROOT)).toBe(join(TEST_ROOT, '.spec-first/runtime/first/critical-flows.json'));
    expect(getFirstEntryGuidePath(TEST_ROOT)).toBe(join(TEST_ROOT, '.spec-first/runtime/first/entry-guide.json'));
    expect(getFirstApiContractsPath(TEST_ROOT)).toBe(join(TEST_ROOT, '.spec-first/runtime/first/api-contracts.json'));
    expect(getFirstStructureOverviewPath(TEST_ROOT)).toBe(join(TEST_ROOT, '.spec-first/runtime/first/structure-overview.json'));
    expect(getFirstDomainModelPath(TEST_ROOT)).toBe(join(TEST_ROOT, '.spec-first/runtime/first/domain-model.json'));
    expect(getFirstDatabaseSchemaPath(TEST_ROOT)).toBe(join(TEST_ROOT, '.spec-first/runtime/first/database-schema.json'));
    expect(getFirstDocsIndexPath(TEST_ROOT)).toBe(join(TEST_ROOT, '.spec-first/runtime/first/docs-index.json'));
  });

  it('writes and reads canonical runtime assets', () => {
    writeFirstRuntimeSummary(TEST_ROOT, {
      generatedAt: '2026-03-08T12:00:00.000Z',
      mode: 'deep',
      project: { name: 'spec-first', platformType: 'backend', overview: 'store test' },
      modules: ['src/core/skill-runtime'],
      capabilities: ['runtime truth source'],
      entryPoints: ['src/cli/index.ts'],
      dataModels: ['Feature'],
      apiSurface: ['CLI: spec-first'],
      risks: [],
      evidence: [],
    });
    writeFirstSteering(TEST_ROOT, {
      product: { overview: 'store test', coreScenarios: ['bootstrap'], nonGoals: [], glossary: ['Feature'] },
      tech: { stack: ['TypeScript'], constraints: [], forbiddenPatterns: ['docs-only truth'] },
      structure: { modules: ['src/core/skill-runtime'], boundaries: ['src/cli/index.ts'], entryRules: ['read runtime truth first'] },
    });
    writeFirstConventions(TEST_ROOT, {
      api: { observedPatterns: ['CLI: spec-first'], deviations: [], recommendedConvention: 'stable CLI', evidence: ['src/cli/index.ts'] },
      module: { observedPatterns: ['src/core/skill-runtime'], deviations: [], recommendedConvention: 'runtime under src/core', evidence: ['src/core/skill-runtime'] },
      testing: { observedPatterns: ['Vitest'], deviations: [], recommendedConvention: 'use Vitest', evidence: ['tests/unit'] },
      projectRules: { observedPatterns: ['runtime truth first'], deviations: [], recommendedConvention: 'runtime first', evidence: ['.spec-first/runtime/first'] },
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
        thenRead: ['src/core/skill-runtime/first-runtime-store.ts'],
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
      topology: ['entry -> runtime'],
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
      evidence: [],
    });
    writeFirstDomainModel(TEST_ROOT, {
      entities: [
        {
          name: 'Feature',
          kind: 'concept',
          description: 'feature',
          invariants: ['runtime truth first'],
          relationships: [],
          evidence: [],
        },
      ],
      glossary: ['Feature'],
      evidence: [],
    });
    writeFirstDatabaseSchema(TEST_ROOT, {
      status: 'not_applicable',
      tables: [],
      risks: [],
      evidence: [],
    });
    writeFirstDocsIndex(TEST_ROOT, {
      generatedAt: '2026-03-08T12:00:00.000Z',
      mode: 'deep',
      quickStart: ['docs/first/README.md'],
      entries: [
        {
          path: 'docs/first/README.md',
          title: '项目认知输出总览',
          purpose: 'runtime docs index',
          relatedRuntimeAssets: ['.spec-first/runtime/first/index.json'],
          recommendedWhen: ['首次进入项目'],
          priority: 'primary',
        },
      ],
      notes: ['runtime docs index'],
    });
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
        status: 'not_applicable',
      },
      docsProjection: {},
      status: 'current',
    });

    const index = readFirstRuntimeIndex(TEST_ROOT);
    expect(index?.status).toBe('current');
    expect(index?.apiContracts.path).toContain('api-contracts.json');
    expect(index?.structureOverview.path).toContain('structure-overview.json');
    expect(index?.domainModel.path).toContain('domain-model.json');
    expect(index?.databaseSchema.status).toBe('not_applicable');
  });
});
