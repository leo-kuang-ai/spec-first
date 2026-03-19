import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { refreshFirstDocsFromRuntime } from '../../src/core/skill-runtime/first-doc-projection.js';
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

const TEST_ROOT = join(import.meta.dirname, '../fixtures/.tmp-first-doc-projection');

function healthyEntry(path: string) {
  return {
    path,
    fileHash: path,
    lastUpdated: '2026-03-08T12:00:00.000Z',
    healthy: true,
  };
}

function seedCanonicalRuntime(): void {
  writeFirstRuntimeSummary(TEST_ROOT, {
    generatedAt: '2026-03-08T12:00:00.000Z',
    mode: 'deep',
    project: { name: 'spec-first', platformType: 'backend', overview: 'projection test' },
    techStack: ['language: TypeScript'],
    modules: ['src/core/skill-runtime'],
    capabilities: ['runtime truth source'],
    entryPoints: ['src/cli/index.ts'],
    dataModels: ['Feature'],
    apiSurface: ['CLI: spec-first'],
    risks: ['docs drift'],
    evidence: ['src/cli/index.ts'],
  });
  writeFirstSteering(TEST_ROOT, {
    product: { overview: 'projection test', coreScenarios: ['bootstrap'], nonGoals: [], glossary: ['Feature'] },
    tech: { stack: ['language: TypeScript'], constraints: ['backend'], forbiddenPatterns: ['docs-only truth'] },
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
    interfaces: [
      {
        interfaceType: 'cli-command',
        name: 'spec-first',
        path: 'spec-first',
        method: 'run',
        handler: 'src/cli/index.ts',
        request: [],
        response: ['runtime truth source'],
        auth: [],
        errors: [],
        evidence: ['src/cli/index.ts'],
      },
    ],
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
    tables: [
      {
        name: 'features',
        purpose: 'store features',
        fields: ['id', 'title'],
        relations: [],
        evidence: ['schema.prisma'],
      },
    ],
    risks: [],
    evidence: ['schema.prisma'],
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
      status: 'healthy',
    },
    docsProjection: {},
    status: 'current',
  });
}

describe('first docs outputs writer', () => {
  beforeEach(() => {
    rmSync(TEST_ROOT, { recursive: true, force: true });
    mkdirSync(TEST_ROOT, { recursive: true });
    seedCanonicalRuntime();
  });

  afterEach(() => {
    rmSync(TEST_ROOT, { recursive: true, force: true });
  });

  it('writes docs outputs with readable content', () => {
    const docs = refreshFirstDocsFromRuntime(TEST_ROOT);

    expect(docs).toContain('docs/first/README.md');
    expect(docs).toContain('docs/first/summary.md');
    expect(docs).toContain('docs/first/development-guidelines.md');
    expect(docs).toContain('docs/first/database-er.md');

    const summaryDoc = readFileSync(join(TEST_ROOT, 'docs', 'first', 'summary.md'), 'utf-8');
    const overviewDoc = readFileSync(join(TEST_ROOT, 'docs', 'first', 'README.md'), 'utf-8');
    const devDoc = readFileSync(join(TEST_ROOT, 'docs', 'first', 'development-guidelines.md'), 'utf-8');
    const dbDoc = readFileSync(join(TEST_ROOT, 'docs', 'first', 'database-er.md'), 'utf-8');

    expect(summaryDoc).toContain('## 项目是什么');
    expect(summaryDoc).toContain('spec-first');
    expect(overviewDoc).toContain('Docs Outputs');
    expect(overviewDoc).toContain('.spec-first/runtime/first/');
    expect(devDoc).toContain('## API 规范');
    expect(devDoc).toContain('## 项目规范');
    expect(devDoc).not.toContain('## 配置规范');
    expect(devDoc).not.toContain('## 交付规范');
    expect(devDoc).toContain('## 本地环境配置');
    expect(readFileSync(join(TEST_ROOT, 'docs', 'first', 'conventions.md'), 'utf-8')).toContain(
      '## 交付约束'
    );
    expect(dbDoc).toContain('features');
  });
});
